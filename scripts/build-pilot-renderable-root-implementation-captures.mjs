#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {PNG} from 'pngjs';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');
const reportPath = path.join(
  projectRoot,
  'reports',
  'pilot-renderable-root-implementation-captures.json'
);

const TARGETS = Object.freeze([
  Object.freeze({animationId: 'course-g03-l01-ts-008', language: 'en'}),
  Object.freeze({animationId: 'course-g03-l01-vb-004', language: 'en'}),
  Object.freeze({animationId: 'course-g03-l01-vb-004', language: 'es'}),
  Object.freeze({animationId: 'course-g03-l06-fq-002-review', language: 'en'}),
  Object.freeze({animationId: 'course-g03-l08-re-001', language: 'en'}),
  Object.freeze({animationId: 'course-g04-l01-ir-001', language: 'en'}),
  Object.freeze({animationId: 'course-g04-l03-in-009', language: 'en'}),
  Object.freeze({
    animationId: 'course-g04-l09-gs-002',
    language: 'en',
    structuralSourceManifest:
      'public/flash-assets/courses/course-g04-l09-gs-002/root-frames/manifest.json'
  }),
  Object.freeze({animationId: 'course-g05-l13-rw-002', language: 'en'})
]);

const RESOLVED_ENGINEERING_INCIDENTS = Object.freeze([
  Object.freeze({
    animationId: 'course-g03-l01-ts-008',
    requirementId: 'req:root:root-standalone:en',
    initialFailure: 'The first capture used 127.0.0.1 against a localhost-bound Next.js development server; Next.js rejected the HMR dev-resource origin and the dynamic module stayed at Loading module.',
    resolution: 'Restarted the exact failed development server process and captured from the same-origin localhost URL.',
    failedManifestRetained: false,
    reasonNotRetained: 'The failed manifest occupied the canonical generated-output path and was replaced by the successful current manifest; no failed bytes were adopted.'
  }),
  Object.freeze({
    animationId: 'course-g04-l01-ir-001',
    requirementId: 'req:root:root-standalone:en',
    initialFailure: 'The exact 800x600 Canvas rendered, but it lacked data-capture-stage, data-render-state, and data-render-visual, so the strict capture selector timed out before frame 1.',
    resolution: 'Added the deterministic identity contract only to the ready visual Canvas; loading placeholders and the nonvisual wrapper remain ineligible.',
    failedManifestRetained: false,
    reasonNotRetained: 'The failed manifest occupied the canonical generated-output path and was replaced by the successful current manifest; the failure and resolution are retained here.'
  }),
  Object.freeze({
    animationId: 'course-g04-l03-in-009',
    requirementId: 'req:root:root-standalone:en',
    initialFailure: 'The exact 800x600 Canvas rendered, but it lacked data-capture-stage, data-render-state, and data-render-visual, so the strict capture selector timed out before frame 1.',
    resolution: 'Added the deterministic identity contract only to the ready visual Canvas; loading placeholders and the nonvisual wrapper remain ineligible.',
    failedManifestRetained: false,
    reasonNotRetained: 'The failed manifest occupied the canonical generated-output path and was replaced by the successful current manifest; the failure and resolution are retained here.'
  })
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

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function normalizedRgbRmse(left, right) {
  assert(
    left.width === right.width && left.height === right.height,
    'structural source and implementation PNG dimensions differ'
  );
  let squaredError = 0;
  const rgbSamples = left.width * left.height * 3;
  for (let index = 0; index < left.data.length; index += 4) {
    for (let channel = 0; channel < 3; channel += 1) {
      const delta = left.data[index + channel] - right.data[index + channel];
      squaredError += delta * delta;
    }
  }
  return Math.sqrt(squaredError / rgbSamples) / 255;
}

async function readJson(filePath, label) {
  const bytes = await readFile(filePath);
  try {
    return {bytes, value: JSON.parse(bytes.toString('utf8'))};
  } catch (error) {
    throw new Error(`${label} is invalid JSON (${error.message})`);
  }
}

async function readOptionalJson(filePath) {
  try {
    return (await readJson(filePath, portable(filePath))).value;
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

function assertIdentity(value, expected, label) {
  for (const [field, expectedValue] of Object.entries(expected)) {
    const observed = field === 'seed' ? String(value?.[field]) : value?.[field];
    assert(observed === expectedValue, `${label}.${field} differs from the coverage requirement`);
  }
}

function findRootRequirement(coverage, target) {
  const requirementId = `req:root:root-standalone:${target.language}`;
  const matches = (coverage.requirements || []).filter(
    (requirement) => requirement.requirementId === requirementId
  );
  assert(matches.length === 1, `${target.animationId} must declare exactly one ${requirementId}`);
  const requirement = matches[0];
  assert(requirement.frameDomainId === 'root', `${requirementId} must use the root frame domain`);
  assert(requirement.scenario === 'root-standalone', `${requirementId} must use root-standalone`);
  assert(requirement.language === target.language, `${requirementId} language mismatch`);
  assert(String(requirement.seed) === '0', `${requirementId} must use seed 0`);
  assert(requirement.requiredRange?.firstFrame === 1, `${requirementId} must start at frame 1`);
  assert(
    Number.isInteger(requirement.requiredRange?.lastFrame) &&
      requirement.requiredRange.lastFrame >= 1,
    `${requirementId} has an invalid last frame`
  );
  assert(
    /^[a-f0-9]{64}$/.test(requirement.entryStateSha256 || ''),
    `${requirementId} has an invalid entry-state SHA-256`
  );
  return requirement;
}

async function validateTarget(target) {
  const migrationRoot = path.join(projectRoot, 'migrations', target.animationId);
  const coveragePath = path.join(migrationRoot, 'evidence', 'full-frame-coverage.json');
  const rendererPath = path.join(
    projectRoot,
    'packages',
    'demos',
    'src',
    'modules',
    `${target.animationId}.tsx`
  );
  const captureDirectory = path.join(
    projectRoot,
    'artifacts',
    'full-frame',
    'pilot-implementation',
    target.animationId,
    `req-root-root-standalone-${target.language}`
  );
  const capturePath = path.join(captureDirectory, 'capture-manifest.json');
  const structuralManifestPath = target.structuralSourceManifest
    ? path.join(projectRoot, target.structuralSourceManifest)
    : null;
  const [coverageRecord, captureRecord, rendererBytes, structuralManifestRecord] = await Promise.all([
    readJson(coveragePath, portable(coveragePath)),
    readJson(capturePath, portable(capturePath)),
    readFile(rendererPath),
    structuralManifestPath
      ? readJson(structuralManifestPath, portable(structuralManifestPath))
      : Promise.resolve(null)
  ]);
  const coverage = coverageRecord.value;
  assert(coverage.schemaVersion === 2, `${target.animationId} coverage must use schema 2`);
  assert(coverage.animationId === target.animationId, `${target.animationId} coverage identity mismatch`);
  const requirement = findRootRequirement(coverage, target);
  const capture = captureRecord.value;
  const identity = {
    animationId: target.animationId,
    requirementId: requirement.requirementId,
    frameDomainId: 'root',
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256,
    scenario: 'root-standalone',
    language: target.language,
    seed: '0'
  };
  assert(capture.schemaVersion === 3, `${target.animationId}/${target.language} capture must use schema 3`);
  assert(capture.status === 'complete', `${target.animationId}/${target.language} capture is not complete`);
  assertIdentity(capture, identity, `${target.animationId}/${target.language} capture`);
  assert(capture.requestedFrameDomain === 'root', `${target.animationId}/${target.language} requested domain mismatch`);
  assert(
    capture.viewport?.width === 800 &&
      capture.viewport?.height === 600 &&
      capture.viewport?.deviceScaleFactor === 1,
    `${target.animationId}/${target.language} viewport must be native 800x600 at device scale 1`
  );
  assert(capture.error === null, `${target.animationId}/${target.language} capture reports an error`);
  const diagnosticCounts = {};
  for (const field of ['consoleErrors', 'failedRequests', 'httpErrors', 'unexpectedRequests']) {
    assert(Array.isArray(capture[field]), `${target.animationId}/${target.language}.${field} must be an array`);
    diagnosticCounts[field] = capture[field].length;
    assert(capture[field].length === 0, `${target.animationId}/${target.language}.${field} is not empty`);
  }
  const lastFrame = requirement.requiredRange.lastFrame;
  const structuralFrames = new Map();
  if (structuralManifestRecord) {
    const structuralManifest = structuralManifestRecord.value;
    assert(
      structuralManifest.schemaVersion === 1 &&
        structuralManifest.evidenceType === 'ffdec-structural-root-frame-implementation-assets',
      `${target.animationId} structural source manifest schema/type mismatch`
    );
    assert(
      structuralManifest.animationId === target.animationId,
      `${target.animationId} structural source manifest identity mismatch`
    );
    assert(
      structuralManifest.authority?.originalRuntimeBaseline === false &&
        structuralManifest.authority?.actionScriptExecuted === false &&
        structuralManifest.authority?.naturalPlaybackClaimed === false,
      `${target.animationId} structural source manifest exceeds its authority boundary`
    );
    assert(
      structuralManifest.runtime?.frameDomain === 'root' &&
        structuralManifest.runtime?.frameCount === lastFrame &&
        structuralManifest.runtime?.supportedLanguages?.includes(target.language),
      `${target.animationId} structural source manifest runtime scope mismatch`
    );
    assert(
      structuralManifest.strictAcceptanceEffect === 'none',
      `${target.animationId} structural source manifest must have no strict effect`
    );
    for (const frame of structuralManifest.frames || []) {
      assert(
        Number.isInteger(frame.frame) && frame.frame >= 1 && frame.frame <= lastFrame,
        `${target.animationId} structural source manifest has an invalid frame`
      );
      assert(!structuralFrames.has(frame.frame), `${target.animationId} structural source frame is duplicated`);
      assert(
        /^frame-\d{4}\.png$/.test(frame.file || '') && /^[a-f0-9]{64}$/.test(frame.sha256 || ''),
        `${target.animationId} structural source frame binding is invalid`
      );
      structuralFrames.set(frame.frame, frame);
    }
    assert(
      structuralFrames.size === lastFrame,
      `${target.animationId} structural source manifest does not cover every root frame`
    );
  }
  assert(
    Array.isArray(capture.captured) && capture.captured.length === lastFrame,
    `${target.animationId}/${target.language} must capture all ${lastFrame} frames`
  );
  const frameBindings = [];
  const structuralComparisons = [];
  for (let index = 0; index < capture.captured.length; index += 1) {
    const frame = index + 1;
    const record = capture.captured[index];
    const label = `${target.animationId}/${target.language}/frame-${frame}`;
    assert(record.frame === frame && record.reportedFrame === frame, `${label} is not exact/contiguous`);
    assertIdentity(record, identity, label);
    assert(record.frameDomain === 'root', `${label}.frameDomain must be root`);
    assert(record.reportedFrameDomainId === 'root', `${label}.reportedFrameDomainId must be root`);
    assert(record.rootFrame === frame, `${label}.rootFrame must equal the requested root frame`);
    assert(record.reportedRenderState === 'ready', `${label} renderer is not ready`);
    assertIdentity(record.visualTarget, identity, `${label}.visualTarget`);
    assert(record.visualTarget?.reportedFrame === frame, `${label} visual frame mismatch`);
    assert(record.visualTarget?.frameDomainId === 'root', `${label} visual domain mismatch`);
    assert(record.visualTarget?.rootFrame === frame, `${label} visual root frame mismatch`);
    assert(record.visualTarget?.reportedRenderState === 'ready', `${label} visual renderer is not ready`);
    assert(String(record.visualTarget?.tagName || '').length > 0, `${label} visual target tag is missing`);
    assert(/^frame-\d+\.png$/.test(record.file || ''), `${label} has an unsafe PNG filename`);
    assert(/^[a-f0-9]{64}$/.test(record.sha256 || ''), `${label} has an invalid PNG SHA-256`);
    const pngPath = path.join(captureDirectory, record.file);
    assert(path.dirname(pngPath) === captureDirectory, `${label} PNG path escapes its capture directory`);
    const bytes = await readFile(pngPath);
    assert(sha256(bytes) === record.sha256, `${label} PNG SHA-256 mismatch`);
    let png;
    try {
      png = PNG.sync.read(bytes);
    } catch (error) {
      throw new Error(`${label} PNG is undecodable (${error.message})`);
    }
    assert(
      png.width === 800 && png.height === 600 && record.width === 800 && record.height === 600,
      `${label} PNG must be 800x600`
    );
    if (structuralManifestPath) {
      const sourceBinding = structuralFrames.get(frame);
      const sourcePath = path.join(path.dirname(structuralManifestPath), sourceBinding.file);
      assert(
        path.dirname(sourcePath) === path.dirname(structuralManifestPath),
        `${label} structural source path escapes its manifest directory`
      );
      const sourceBytes = await readFile(sourcePath);
      assert(sha256(sourceBytes) === sourceBinding.sha256, `${label} structural source SHA-256 mismatch`);
      assert(
        sourceBytes.length === sourceBinding.bytes,
        `${label} structural source byte count mismatch`
      );
      let sourcePng;
      try {
        sourcePng = PNG.sync.read(sourceBytes);
      } catch (error) {
        throw new Error(`${label} structural source PNG is undecodable (${error.message})`);
      }
      assert(
        sourcePng.width === sourceBinding.width && sourcePng.height === sourceBinding.height,
        `${label} structural source dimensions mismatch`
      );
      structuralComparisons.push({
        frame,
        sourceFile: portable(sourcePath),
        sourceSha256: sourceBinding.sha256,
        implementationFile: portable(pngPath),
        implementationSha256: record.sha256,
        normalizedRgbRmse: normalizedRgbRmse(sourcePng, png)
      });
    }
    frameBindings.push({frame, file: record.file, sha256: record.sha256});
  }
  return {
    animationId: target.animationId,
    requirementId: requirement.requirementId,
    frameDomainId: 'root',
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256,
    scenario: 'root-standalone',
    language: target.language,
    seed: '0',
    captureManifest: {
      path: portable(capturePath),
      sha256: sha256(captureRecord.bytes),
      capturedAt: capture.capturedAt,
      sourceUrl: capture.sourceUrl
    },
    frameSet: {
      firstFrame: 1,
      lastFrame,
      capturedFrameCount: frameBindings.length,
      sha256: sha256(Buffer.from(JSON.stringify(frameBindings)))
    },
    nativeStage: {width: 800, height: 600, deviceScaleFactor: 1},
    identity: {
      exactFrameCount: frameBindings.length,
      exactFrameDomainCount: frameBindings.length,
      exactRequirementCount: frameBindings.length,
      exactTraceCount: frameBindings.length,
      exactEntryStateCount: frameBindings.length,
      readyVisualCount: frameBindings.length
    },
    diagnostics: {...diagnosticCounts, captureError: null},
    coverageBinding: {path: portable(coveragePath), sha256: sha256(coverageRecord.bytes)},
    rendererBinding: {path: portable(rendererPath), sha256: sha256(rendererBytes)},
    ...(structuralManifestRecord
      ? {
          structuralSourceComparison: {
            authority:
              'hash-bound-ffdec-static-root-timeline-structural-render-not-original-runtime',
            originalRuntimeBaseline: false,
            actionScriptExecuted: false,
            naturalPlaybackClaimed: false,
            manifest: {
              path: portable(structuralManifestPath),
              sha256: sha256(structuralManifestRecord.bytes)
            },
            comparedFrameCount: structuralComparisons.length,
            maximumNormalizedRgbRmse: Math.max(
              ...structuralComparisons.map(({normalizedRgbRmse}) => normalizedRgbRmse)
            ),
            exactPixelMatchFrameCount: structuralComparisons.filter(
              ({normalizedRgbRmse}) => normalizedRgbRmse === 0
            ).length,
            frames: structuralComparisons,
            strictAcceptanceEffect: false
          }
        }
      : {}),
    result: 'validated-current-javascript-root-output-only',
    originalRuntimeAuthority: 'not-established-by-this-report',
    strictAcceptanceEffect: false
  };
}

export async function buildReport({generatedAt = new Date().toISOString()} = {}) {
  const requirements = [];
  for (const target of TARGETS) requirements.push(await validateTarget(target));
  const scriptBytes = await readFile(scriptPath);
  const capturedFrameCount = requirements.reduce(
    (total, requirement) => total + requirement.frameSet.capturedFrameCount,
    0
  );
  return {
    schemaVersion: 1,
    evidenceType: 'pilot-renderable-root-current-javascript-implementation-capture-index',
    status: 'complete-non-authoritative-current-javascript-output',
    generatedAt,
    authority: 'This report verifies only deterministic current JavaScript root-frame captures. It does not adopt or establish original-runtime baselines, RMSE parity, natural interaction traces, audio fidelity, human review, owner acceptance, or strict completion.',
    generatedBy: {path: portable(scriptPath), sha256: sha256(scriptBytes)},
    requirements,
    resolvedEngineeringIncidents: RESOLVED_ENGINEERING_INCIDENTS,
    summary: {
      requirementCount: requirements.length,
      completeRequirementCount: requirements.length,
      failedRequirementCount: 0,
      capturedFrameCount,
      validationErrorCount: 0,
      languageCounts: {
        en: requirements.filter(({language}) => language === 'en').length,
        es: requirements.filter(({language}) => language === 'es').length
      }
    },
    stateChanges: {
      migrationManifestsChangedByThisReport: false,
      coverageChangedByThisReport: false,
      baselineAuthorityChangedByThisReport: false,
      rmseMetricsChangedByThisReport: false,
      humanApprovalChangedByThisReport: false,
      ownerApprovalChangedByThisReport: false
    },
    strictAcceptanceEffect: false
  };
}

function parseArguments(argv) {
  const options = {check: false};
  for (const value of argv) {
    if (value === '--check') options.check = true;
    else if (value === '--help' || value === '-h') options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: node scripts/build-pilot-renderable-root-implementation-captures.mjs [--check]');
    return;
  }
  const observed = await readOptionalJson(reportPath);
  const report = await buildReport({
    generatedAt: options.check && observed?.generatedAt ? observed.generatedAt : new Date().toISOString()
  });
  const expected = jsonText(report);
  if (options.check) {
    assert(observed, `${portable(reportPath)} is missing`);
    const current = jsonText(observed);
    assert(current === expected, `${portable(reportPath)} is stale`);
    console.log(
      `CHECK ${portable(reportPath)}: ${report.summary.requirementCount} requirements, ${report.summary.capturedFrameCount} current-JavaScript frames`
    );
    return;
  }
  await writeFile(reportPath, expected, 'utf8');
  console.log(
    `WROTE ${portable(reportPath)}: ${report.summary.requirementCount} requirements, ${report.summary.capturedFrameCount} current-JavaScript frames`
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
