#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {captureKeyframes} from './capture-animation-keyframes.mjs';
import {comparePngFiles} from './compare-images.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');
const animationId = 'course-g03-l01-vb-004';
const migrationRoot = path.join(projectRoot, 'migrations', animationId);
const outputRoot = path.join(projectRoot, 'output', 'playwright', `${animationId}-technical-endpoints`);
const reportPath = path.join(migrationRoot, 'evidence', 'nextjs-native-candidate-qa.json');
const coveragePath = path.join(migrationRoot, 'evidence', 'full-frame-coverage.json');
const baselineManifestPath = path.join(migrationRoot, 'baseline', 'adobe-flash-player-32-standalone-default.json');
const baselineFramesRoot = path.join(
  projectRoot,
  'artifacts',
  'full-frame',
  'pilot-baselines',
  animationId,
  'adobe-flash-player-32-standalone-default'
);

const endpointDefinitions = Object.freeze([
  Object.freeze({requirementId: 'req:root:root-standalone:en', frames: [1, 10], output: 'root-en'}),
  Object.freeze({requirementId: 'req:root:root-standalone:es', frames: [1, 10], output: 'root-es'}),
  Object.freeze({requirementId: 'req:sprite-231:linear-to-quiz-stop:en', frames: [1, 222], output: 'sprite-en'}),
  Object.freeze({requirementId: 'req:sprite-231:linear-to-quiz-stop:es', frames: [1, 222], output: 'sprite-es'})
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function portable(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join('/');
}

export function parseArguments(argv) {
  const options = {baseUrl: 'http://127.0.0.1:3214', check: false};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--base-url') {
      assert(argv[index + 1], '--base-url requires a value');
      options.baseUrl = argv[index + 1];
      index += 1;
    } else if (value === '--check') {
      options.check = true;
    } else if (value === '--help' || value === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${value}`);
    }
  }
  const parsed = new URL(options.baseUrl);
  assert(['http:', 'https:'].includes(parsed.protocol), '--base-url must be HTTP(S)');
  options.baseUrl = parsed.href.replace(/\/$/, '');
  return options;
}

async function fileBinding(filePath, {migrationRelative = false} = {}) {
  const bytes = await readFile(filePath);
  return {
    path: migrationRelative
      ? path.relative(migrationRoot, filePath).split(path.sep).join('/')
      : portable(filePath),
    sha256: sha256(bytes)
  };
}

function findRequirement(coverage, requirementId) {
  const matches = (coverage.requirements || []).filter((entry) => entry.requirementId === requirementId);
  assert(matches.length === 1, `coverage must contain exactly one ${requirementId}`);
  const requirement = matches[0];
  assert(requirement.status === 'blocked', `${requirementId}: engineering capture must not overwrite strict coverage status`);
  assert(/^[a-f0-9]{64}$/.test(requirement.entryStateSha256 || ''), `${requirementId}: invalid entry-state SHA-256`);
  return requirement;
}

export function validateCaptureManifest(manifest, definition, requirement) {
  assert(manifest.schemaVersion === 3, `${definition.requirementId}: capture schema must be 3`);
  assert(manifest.status === 'complete', `${definition.requirementId}: capture did not complete`);
  assert(manifest.animationId === animationId, `${definition.requirementId}: animation identity mismatch`);
  assert(manifest.requirementId === definition.requirementId, `${definition.requirementId}: requirement identity mismatch`);
  assert(manifest.frameDomainId === requirement.frameDomainId, `${definition.requirementId}: frame-domain mismatch`);
  assert(manifest.traceId === requirement.traceId, `${definition.requirementId}: trace mismatch`);
  assert(manifest.entryStateSha256 === requirement.entryStateSha256, `${definition.requirementId}: entry-state mismatch`);
  assert(manifest.scenario === requirement.scenario, `${definition.requirementId}: scenario mismatch`);
  assert(manifest.language === requirement.language, `${definition.requirementId}: language mismatch`);
  assert(String(manifest.seed) === String(requirement.seed), `${definition.requirementId}: seed mismatch`);
  assert(JSON.stringify((manifest.captured || []).map(({frame}) => frame)) === JSON.stringify(definition.frames), `${definition.requirementId}: endpoint frames mismatch`);
  assert((manifest.captured || []).every((entry) => entry.width === 800 && entry.height === 600), `${definition.requirementId}: captures must be native 800x600`);
  assert((manifest.captured || []).every((entry) => entry.reportedFrame === entry.frame), `${definition.requirementId}: reported frame mismatch`);
  assert((manifest.captured || []).every((entry) => entry.reportedFrameDomainId === requirement.frameDomainId), `${definition.requirementId}: reported domain mismatch`);
  assert((manifest.captured || []).every((entry) => entry.requirementId === definition.requirementId), `${definition.requirementId}: reported requirement mismatch`);
  assert((manifest.captured || []).every((entry) => entry.traceId === requirement.traceId), `${definition.requirementId}: reported trace mismatch`);
  assert((manifest.captured || []).every((entry) => entry.entryStateSha256 === requirement.entryStateSha256), `${definition.requirementId}: reported entry state mismatch`);
  assert((manifest.captured || []).every((entry) => entry.visualTarget?.reportedRenderState === 'ready'), `${definition.requirementId}: visual renderer was not ready`);
  for (const key of ['consoleErrors', 'failedRequests', 'httpErrors', 'unexpectedRequests']) {
    assert(Array.isArray(manifest[key]) && manifest[key].length === 0, `${definition.requirementId}: ${key} is not empty`);
  }
  assert(manifest.error === null, `${definition.requirementId}: capture error is not null`);
  return true;
}

async function rehashCaptureFiles(captureDirectory, manifest) {
  for (const entry of manifest.captured) {
    const bytes = await readFile(path.join(captureDirectory, entry.file));
    assert(sha256(bytes) === entry.sha256, `${manifest.requirementId}/${entry.file}: PNG SHA-256 mismatch`);
  }
}

async function captureEndpoints(baseUrl, coverage) {
  const route = `${baseUrl}/en/animations/${animationId}`;
  const results = [];
  for (const definition of endpointDefinitions) {
    const requirement = findRequirement(coverage, definition.requirementId);
    const output = path.join(outputRoot, definition.output);
    const {manifest} = await captureKeyframes({
      id: animationId,
      url: route,
      output,
      selector: '[data-capture-stage="true"]',
      frameParam: 'frame',
      frameDomain: requirement.frameDomainId,
      frameDomainParam: 'frameDomain',
      requirementId: requirement.requirementId,
      requirementIdParam: 'requirementId',
      trace: requirement.traceId,
      traceParam: 'trace',
      entryStateSha256: requirement.entryStateSha256,
      entryStateSha256Param: 'entryStateSha256',
      scenario: requirement.scenario,
      scenarioParam: 'scenario',
      lang: requirement.language,
      langParam: 'lang',
      seed: String(requirement.seed),
      seedParam: 'seed',
      width: 1200,
      height: 900,
      deviceScale: 1,
      frameList: definition.frames
    });
    validateCaptureManifest(manifest, definition, requirement);
    await rehashCaptureFiles(output, manifest);
    const manifestPath = path.join(output, 'capture-manifest.json');
    results.push({definition, requirement, manifest, output, manifestBinding: await fileBinding(manifestPath)});
  }
  return results;
}

async function validateBaseline() {
  const bytes = await readFile(baselineManifestPath);
  const manifest = JSON.parse(bytes);
  assert(manifest.animationId === animationId, 'baseline animation identity mismatch');
  assert(manifest.status === 'authoritative-standalone-runtime-baseline', 'baseline authority is not current');
  assert(manifest.runtime?.stage?.width === 800 && manifest.runtime?.stage?.height === 600, 'baseline stage mismatch');
  for (const frame of [1, 10]) {
    const record = manifest.frames.find((entry) => entry.frame === frame);
    assert(record, `baseline frame ${frame} is missing`);
    const frameBytes = await readFile(path.join(baselineFramesRoot, record.file));
    assert(sha256(frameBytes) === record.sha256, `baseline frame ${frame} SHA-256 mismatch`);
  }
  return {manifest, binding: {path: 'baseline/adobe-flash-player-32-standalone-default.json', sha256: sha256(bytes)}};
}

function captureByRequirement(captures, requirementId) {
  return captures.find(({definition}) => definition.requirementId === requirementId);
}

async function buildVisualSanity(captures, baseline) {
  const englishRoot = captureByRequirement(captures, 'req:root:root-standalone:en');
  const spanishRoot = captureByRequirement(captures, 'req:root:root-standalone:es');
  const englishSprite = captureByRequirement(captures, 'req:sprite-231:linear-to-quiz-stop:en');
  const spanishSprite = captureByRequirement(captures, 'req:sprite-231:linear-to-quiz-stop:es');
  const comparisons = [];
  for (const frame of [1, 10]) {
    const baselineRecord = baseline.manifest.frames.find((entry) => entry.frame === frame);
    const candidateRecord = englishRoot.manifest.captured.find((entry) => entry.frame === frame);
    const metrics = await comparePngFiles(
      path.join(baselineFramesRoot, baselineRecord.file),
      path.join(englishRoot.output, candidateRecord.file)
    );
    comparisons.push({
      frame,
      baselinePngSha256: baselineRecord.sha256,
      candidatePngSha256: candidateRecord.sha256,
      normalizedRmse: metrics.normalizedRmse,
      threshold: 0.05,
      thresholdPass: metrics.normalizedRmse <= 0.05
    });
  }
  for (const [english, spanish, label] of [
    [englishRoot, spanishRoot, 'root'],
    [englishSprite, spanishSprite, 'sprite-231']
  ]) {
    const englishHashes = english.manifest.captured.map(({sha256: digest}) => digest);
    const spanishHashes = spanish.manifest.captured.map(({sha256: digest}) => digest);
    assert(JSON.stringify(englishHashes) === JSON.stringify(spanishHashes), `${label}: en/es source-shared pixels differ`);
  }
  return {
    authority: 'candidate-only endpoint sanity against the hash-bound Adobe standalone English root baseline; not adopted full-frame metrics',
    baselineManifest: baseline.binding,
    comparisons,
    spanishPixelRelationship: {
      status: 'identical-to-English-endpoint-captures-by-source-shared-untranslated-visual-contract',
      translationOrParityClaim: false
    },
    strictRmseStatus: 'not-eligible-without-accepted-exhaustive-baseline-and-implementation-capture-manifests'
  };
}

async function projectBindings() {
  return {
    fla: await fileBinding(path.join(projectRoot, 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/VB/L1VB04.fla')),
    swf: await fileBinding(path.join(projectRoot, 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/VB/L1VB04.swf')),
    renderer: await fileBinding(path.join(projectRoot, 'packages/demos/src/modules/course-g03-l01-vb-004.tsx')),
    timeline: await fileBinding(path.join(projectRoot, 'packages/demos/src/timelines/course-g03-l01-vb-004.ts')),
    tests: await fileBinding(path.join(projectRoot, 'packages/demos/tests/course-g03-l01-vb-004.test.ts')),
    adapterGenerator: await fileBinding(path.join(projectRoot, 'scripts/build-safe-animate-createjs-adapter.mjs')),
    adapterGeneratorTests: await fileBinding(path.join(projectRoot, 'scripts/build-safe-animate-createjs-adapter.test.mjs')),
    adapterSpec: await fileBinding(path.join(migrationRoot, 'audit/animate-createjs-adapter-spec.json'), {migrationRelative: true}),
    adapterManifest: await fileBinding(path.join(projectRoot, 'public/flash-assets/courses/course-g03-l01-vb-004/manifest.json')),
    rendererSupport: await fileBinding(path.join(migrationRoot, 'audit/renderer-frame-domain-support.json'), {migrationRelative: true}),
    coverage: await fileBinding(coveragePath, {migrationRelative: true}),
    producer: await fileBinding(scriptPath),
    producerTests: await fileBinding(path.join(projectRoot, 'scripts/qa-vb-004-candidate.test.mjs'))
  };
}

export function buildReport({captures, visualSanity, bindings, reviewedAt = new Date().toISOString()}) {
  const rootEngineeringRmsePass = (visualSanity.comparisons || []).every(({thresholdPass}) => thresholdPass !== false);
  return {
    schemaVersion: 3,
    animationId,
    evidenceKind: 'current-javascript-renderer-endpoint-engineering-qa',
    status: rootEngineeringRmsePass ? 'pass' : 'blocked-engineering-rmse',
    reviewedAt,
    reviewer: 'Codex machine-assisted engineering revalidation',
    acceptanceEffect: 'none',
    strictAcceptanceEffect: false,
    authority: 'Real-browser engineering evidence for the current JavaScript renderer only; not authoritative Flash parity, audio listening, human visual review, owner acceptance, or strict completion.',
    source: {fla: bindings.fla, swf: bindings.swf, originalsModified: false},
    implementation: {
      renderer: bindings.renderer,
      timeline: bindings.timeline,
      tests: bindings.tests,
      adapterGenerator: bindings.adapterGenerator,
      adapterGeneratorTests: bindings.adapterGeneratorTests,
      adapterSpec: bindings.adapterSpec,
      adapterManifest: bindings.adapterManifest,
      rendererSupport: bindings.rendererSupport,
      coverage: bindings.coverage,
      route: `/en/animations/${animationId}`,
      migrationStatusUnchanged: 'preserved'
    },
    generatedBy: {script: bindings.producer.path, scriptSha256: bindings.producer.sha256, tests: bindings.producerTests},
    rendererEndpointQa: {
      status: 'complete-for-eight-current-javascript-renderer-endpoints',
      endpointCount: captures.reduce((sum, entry) => sum + entry.manifest.captured.length, 0),
      reportedIdentityMismatches: 0,
      nativeDimensionMismatches: 0,
      consoleErrors: 0,
      failedRequests: 0,
      httpErrors: 0,
      unexpectedRequests: 0,
      captures: captures.map(({definition, requirement, manifestBinding}) => ({
        requirementId: definition.requirementId,
        frameDomain: requirement.frameDomainId,
        scenario: requirement.scenario,
        language: requirement.language,
        frames: definition.frames,
        captureManifest: manifestBinding.path,
        captureManifestSha256: manifestBinding.sha256
      }))
    },
    boundedVisualSanity: visualSanity,
    checks: {
      assertions: 14,
      passed: rootEngineeringRmsePass ? 14 : 13,
      failed: rootEngineeringRmsePass ? 0 : 1,
      details: [
        '8/8 endpoint identities and native 800x600 captures passed',
        'console, failed request, HTTP error, and unexpected network counts are zero',
        rootEngineeringRmsePass
          ? 'root frames 1 and 10 meet normalized RGB RMSE <= 0.05'
          : 'at least one root endpoint exceeds normalized RGB RMSE 0.05; the exact metric remains recorded as a blocker',
        'en/es endpoint pixels match the source-shared untranslated visual contract',
        'strict coverage, human review, owner review, and migration status were not changed'
      ]
    },
    knownBlockers: [
      'No accepted exhaustive original-runtime/implementation pair and all-frame RMSE exists for the four declared requirements.',
      'Nested natural traces, quiz/glossary/scoring/feedback/completion/Replay branches, and frame-domain dispositions remain unresolved.',
      'Embedded streams and the external Spanish MP3 still require authoritative original-host listening and synchronization evidence.',
      'Mobile accessibility, all-diff human visual review, and owner acceptance remain pending.'
    ],
    humanVisualReview: {decision: 'pending', reviewer: null, reviewedAt: null},
    ownerAcceptance: {decision: 'pending', reviewer: null, reviewedAt: null}
  };
}

async function validateStoredReport(report) {
  assert(report.schemaVersion === 3 && report.animationId === animationId, 'stored report identity is invalid');
  assert(['pass', 'blocked-engineering-rmse'].includes(report.status), 'stored report status is invalid');
  assert(report.strictAcceptanceEffect === false, 'stored report must not affect strict acceptance');
  assert(report.humanVisualReview?.decision === 'pending', 'stored report must not claim human review');
  assert(report.ownerAcceptance?.decision === 'pending', 'stored report must not claim owner acceptance');
  for (const capture of report.rendererEndpointQa?.captures || []) {
    const manifestPath = path.join(projectRoot, capture.captureManifest);
    const bytes = await readFile(manifestPath);
    assert(sha256(bytes) === capture.captureManifestSha256, `${capture.requirementId}: stored manifest SHA-256 mismatch`);
  }
  const bindings = await projectBindings();
  for (const key of Object.keys(bindings)) {
    const stored = key === 'producer' ? {path: report.generatedBy.script, sha256: report.generatedBy.scriptSha256}
      : key === 'producerTests' ? report.generatedBy.tests
        : key === 'fla' || key === 'swf' ? report.source[key]
          : report.implementation[key];
    assert(stored?.path === bindings[key].path && stored?.sha256 === bindings[key].sha256, `${key}: stored dependency is stale`);
  }
  return true;
}

export async function runVbCandidateQa({baseUrl, check = false}) {
  if (check) {
    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    await validateStoredReport(report);
    return {check: true, status: report.status, report: portable(reportPath), strictAcceptanceEffect: false};
  }
  const coverage = JSON.parse(await readFile(coveragePath, 'utf8'));
  const captures = await captureEndpoints(baseUrl, coverage);
  const baseline = await validateBaseline();
  const visualSanity = await buildVisualSanity(captures, baseline);
  const bindings = await projectBindings();
  const report = buildReport({captures, visualSanity, bindings});
  assert(report.rendererEndpointQa.endpointCount === 8, 'expected exactly eight endpoint captures');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  return {
    check: false,
    status: report.status,
    assertions: report.checks.assertions,
    report: portable(reportPath),
    reportSha256: sha256(await readFile(reportPath)),
    strictAcceptanceEffect: false
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: node scripts/qa-vb-004-candidate.mjs [--base-url http://127.0.0.1:3214] [--check]');
    return;
  }
  console.log(JSON.stringify(await runVbCandidateQa(options), null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
