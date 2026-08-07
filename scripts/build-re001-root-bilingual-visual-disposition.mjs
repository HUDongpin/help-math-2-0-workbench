#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';

import {PNG} from 'pngjs';

import {
  buildProbeRequests,
  buildRendererSupportReport
} from './build-renderer-frame-domain-support.mjs';
import {technicalManifestSha256} from './evidence-projections.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');
const probeScriptPath = path.join(
  projectRoot,
  'scripts',
  'probe-renderer-frame-domain-support.ts'
);
const tsxPath = path.join(projectRoot, 'node_modules', '.bin', 'tsx');

export const RE001_ANIMATION_ID = 'course-g03-l08-re-001';
export const RE001_SOURCE_SWF =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L8/RE/L8RE01.swf';
export const RE001_SOURCE_SWF_SHA256 =
  'e4a6403f6b45a3b4aecb48e0659aa20113acb0644e37b027a19fb51f34417f9b';
export const RE001_MIGRATION_ROOT = `migrations/${RE001_ANIMATION_ID}`;
export const RE001_OUTPUT =
  `${RE001_MIGRATION_ROOT}/audit/bilingual-visual-source-disposition.json`;
export const RE001_RENDERER_AUDIT =
  `${RE001_MIGRATION_ROOT}/audit/renderer-frame-domain-support.json`;
export const RE001_STALE_BROWSER_QA_RECEIPT =
  `${RE001_MIGRATION_ROOT}/audit/prior-browser-qa-stale-disposition.json`;
export const RE001_STALE_BROWSER_QA_ARCHIVE =
  `${RE001_MIGRATION_ROOT}/evidence/native-canvas-candidate-qa.pre-root-bilingual-disposition.stale.json`;

const inputPaths = Object.freeze({
  migrationManifest: `${RE001_MIGRATION_ROOT}/migration.json`,
  ffdecScripts: `${RE001_MIGRATION_ROOT}/audit/machine/ffdec-scripts.txt.gz`,
  scenarioInventory: `${RE001_MIGRATION_ROOT}/audit/scenario-inventory.json`,
  staticDisposition:
    `${RE001_MIGRATION_ROOT}/audit/static-frame-domain-disposition-evidence.json`,
  standaloneManifest:
    `${RE001_MIGRATION_ROOT}/baseline/adobe-flash-player-32-standalone-default.json`,
  priorBrowserQa: `${RE001_MIGRATION_ROOT}/evidence/native-canvas-candidate-qa.json`,
  module: 'packages/demos/src/modules/course-g03-l08-re-001.tsx',
  timeline: 'packages/demos/src/timelines/course-g03-l08-re-001.ts',
  test: 'packages/demos/tests/course-g03-l08-re-001.test.ts',
  qaProducer: 'scripts/qa-re-001-candidate.mjs'
});

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function absolute(relativePath) {
  const resolved = path.resolve(projectRoot, relativePath);
  if (resolved !== projectRoot && !resolved.startsWith(`${projectRoot}${path.sep}`)) {
    throw new Error(`Path escapes project root: ${relativePath}`);
  }
  return resolved;
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function allFalse(value) {
  const values = Object.values(value ?? {});
  return values.length > 0 && values.every((candidate) => candidate === false);
}

async function fileBinding(relativePath) {
  const bytes = await readFile(absolute(relativePath));
  return {path: relativePath, sha256: sha256(bytes), bytes: bytes.length};
}

async function readIfPresent(relativePath) {
  try {
    return await readFile(absolute(relativePath));
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

export function extractRe001FfdecScriptBlocks(source) {
  const blocks = new Map();
  for (const chunk of source.split(/^===== /m).slice(1)) {
    const marker = chunk.indexOf(' =====\n');
    requireValue(marker > 0, 'FFDec script export contains a malformed block marker');
    const script = chunk.slice(0, marker);
    requireValue(!blocks.has(script), `FFDec script export repeats ${script}`);
    blocks.set(script, chunk.slice(marker + ' =====\n'.length).trim());
  }
  return blocks;
}

async function runRendererProbe(requests) {
  const temporary = await mkdtemp(path.join(tmpdir(), 'help-math-re001-renderer-audit-'));
  const inputPath = path.join(temporary, 'probe-input.json');
  await writeFile(
    inputPath,
    `${JSON.stringify({animationId: RE001_ANIMATION_ID, requests})}\n`,
    'utf8'
  );
  try {
    return await new Promise((resolve, reject) => {
      const child = spawn(tsxPath, [probeScriptPath, inputPath], {
        cwd: projectRoot,
        env: {...process.env, NO_COLOR: '1'},
        stdio: ['ignore', 'pipe', 'pipe']
      });
      let stdout = '';
      let stderr = '';
      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      child.stdout.on('data', (chunk) => {
        stdout += chunk;
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk;
      });
      child.on('error', reject);
      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`RE001 renderer probe failed (${code}): ${stderr.trim()}`));
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch (error) {
          reject(
            new Error(
              `RE001 renderer probe returned invalid JSON: ${
                error instanceof Error ? error.message : String(error)
              }`
            )
          );
        }
      });
    });
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
}

async function rendererAuditSourceHashes() {
  const bindings = {
    prototypeManifest: await fileBinding('packages/demos/src/prototype-manifest.ts'),
    animationRegistry: await fileBinding('packages/demos/src/animation-registry.ts'),
    contract: await fileBinding('packages/demos/src/contract.ts'),
    builder: await fileBinding('scripts/build-renderer-frame-domain-support.mjs'),
    auditContract: await fileBinding('scripts/evidence-projections.mjs'),
    probe: await fileBinding('scripts/probe-renderer-frame-domain-support.ts'),
    module: await fileBinding(inputPaths.module),
    timeline: await fileBinding(inputPaths.timeline)
  };
  return {
    prototypeManifest: bindings.prototypeManifest.sha256,
    animationRegistry: bindings.animationRegistry.sha256,
    contract: bindings.contract.sha256,
    builder: bindings.builder.sha256,
    auditContract: bindings.auditContract.sha256,
    probe: bindings.probe.sha256,
    module: {
      path: bindings.module.path,
      sha256: bindings.module.sha256
    },
    timeline: {
      path: bindings.timeline.path,
      sha256: bindings.timeline.sha256
    }
  };
}

export async function buildRe001RendererAuditReport() {
  const manifest = JSON.parse(
    await readFile(absolute(inputPaths.migrationManifest), 'utf8')
  );
  requireValue(
    manifest.animationId === RE001_ANIMATION_ID,
    'RE001 migration manifest identity is stale'
  );
  const requests = buildProbeRequests(manifest, RE001_ANIMATION_ID);
  const probe = await runRendererProbe(requests);
  return buildRendererSupportReport({
    animationId: RE001_ANIMATION_ID,
    manifest,
    technicalManifestSha256: technicalManifestSha256(manifest),
    probe,
    sourceHashes: await rendererAuditSourceHashes()
  });
}

export function serializeRe001RendererAudit(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export async function buildRe001PriorBrowserQaStaleReceipt() {
  const [
    priorBrowserQaBytes,
    moduleBinding,
    timelineBinding,
    testBinding,
    qaProducerBinding
  ] = await Promise.all([
    readFile(absolute(RE001_STALE_BROWSER_QA_ARCHIVE)),
    fileBinding(inputPaths.module),
    fileBinding(inputPaths.timeline),
    fileBinding(inputPaths.test),
    fileBinding(inputPaths.qaProducer)
  ]);
  const priorBrowserQa = JSON.parse(priorBrowserQaBytes);
  requireValue(
    sha256(priorBrowserQaBytes) ===
      '41e66586f4b0b20cfb8f97f5a01fabe8f52f0823e6b2ac0931ce377c34f6c025',
    'only the exact pre-disposition RE001 browser QA report may be archived as stale'
  );
  requireValue(
    priorBrowserQa?.schemaVersion === 3 &&
      priorBrowserQa?.animationId === RE001_ANIMATION_ID &&
      priorBrowserQa?.status === 'pass' &&
      priorBrowserQa?.deterministicContract?.caseCount === 6,
    'pre-disposition RE001 browser QA identity is unexpected'
  );
  requireValue(
    allFalse(priorBrowserQa.claims) && allFalse(priorBrowserQa.authorityBoundary),
    'historical browser QA must retain a false-only authority boundary'
  );
  const recorded = Object.fromEntries(
    priorBrowserQa.implementation.map((entry) => [entry.path, entry])
  );
  const recordedModule = recorded[inputPaths.module];
  const recordedTimeline = recorded[inputPaths.timeline];
  const recordedTest = recorded[inputPaths.test];
  requireValue(
    recordedModule?.sha256 !== moduleBinding.sha256 &&
      recordedTimeline?.sha256 !== timelineBinding.sha256 &&
      recordedTest?.sha256 !== testBinding.sha256 &&
      priorBrowserQa.generatedBy?.scriptSha256 !== qaProducerBinding.sha256,
    'historical browser QA is not stale against every changed RE001 binding'
  );

  const report = {
    schemaVersion: 1,
    evidenceType: 'historical-browser-qa-stale-disposition',
    animationId: RE001_ANIMATION_ID,
    status: 'verified-historical-stale',
    migrationStatusChanged: false,
    authorityStatement: [
      'The prior browser QA report is retained byte-for-byte as historical candidate evidence.',
      'Its producer, module, timeline, and candidate-test hashes all differ from the current root bilingual disposition implementation, so it is not current evidence and cannot be promoted or adopted.',
      'No browser capture was run and no screenshot, implementation capture, coverage record, review decision, or acceptance field was changed while producing this receipt.'
    ],
    staleArtifact: {
      path: RE001_STALE_BROWSER_QA_ARCHIVE,
      sha256: sha256(priorBrowserQaBytes),
      originalActivePath: inputPaths.priorBrowserQa,
      schemaVersion: priorBrowserQa.schemaVersion,
      recordedAt: priorBrowserQa.recordedAt,
      priorStatus: priorBrowserQa.status,
      priorCaseCount: priorBrowserQa.deterministicContract.caseCount,
      disposition: 'retained-unmodified-historical-stale'
    },
    recordedBindings: {
      producer: {
        path: priorBrowserQa.generatedBy.script,
        sha256: priorBrowserQa.generatedBy.scriptSha256
      },
      module: {
        path: recordedModule.path,
        sha256: recordedModule.sha256
      },
      timeline: {
        path: recordedTimeline.path,
        sha256: recordedTimeline.sha256
      },
      test: {
        path: recordedTest.path,
        sha256: recordedTest.sha256
      }
    },
    currentBindings: {
      producer: qaProducerBinding,
      module: moduleBinding,
      timeline: timelineBinding,
      test: testBinding
    },
    staleChecks: {
      producerHashChanged: true,
      moduleHashChanged: true,
      timelineHashChanged: true,
      testHashChanged: true,
      replacementBrowserQaGenerated: false,
      screenshotsReusedAsCurrent: false,
      implementationCaptureRun: false,
      coverageAdopted: false
    },
    acceptanceEffects: {
      browserQaCurrent: false,
      authoritativeOriginalRuntimeBaseline: false,
      spanishTranslation: false,
      visualParity: false,
      behaviorParity: false,
      audioAcceptance: false,
      fullFrameCoverage: false,
      rmseAcceptance: false,
      humanVisualReview: false,
      engineeringAcceptance: false,
      ownerAcceptance: false,
      strictMigrationCompletion: false
    },
    strictAcceptanceEffect:
      'none; this receipt only proves that the exact prior browser QA report is stale and retained unmodified'
  };
  requireValue(
    allFalse(report.acceptanceEffects),
    'stale browser QA receipt must leave every acceptance effect false'
  );
  return report;
}

export function serializeRe001PriorBrowserQaStaleReceipt(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

async function ensurePriorBrowserQaArchive({check}) {
  const currentArchive = await readIfPresent(RE001_STALE_BROWSER_QA_ARCHIVE);
  if (currentArchive) {
    requireValue(
      sha256(currentArchive) ===
        '41e66586f4b0b20cfb8f97f5a01fabe8f52f0823e6b2ac0931ce377c34f6c025',
      `${RE001_STALE_BROWSER_QA_ARCHIVE} does not match the pinned historical report`
    );
    return;
  }
  if (check) throw new Error(`${RE001_STALE_BROWSER_QA_ARCHIVE} is missing`);
  const activeReport = await readFile(absolute(inputPaths.priorBrowserQa));
  requireValue(
    sha256(activeReport) ===
      '41e66586f4b0b20cfb8f97f5a01fabe8f52f0823e6b2ac0931ce377c34f6c025',
    'active browser QA is no longer the exact report that must be archived'
  );
  await writeFile(absolute(RE001_STALE_BROWSER_QA_ARCHIVE), activeReport);
}

export function validateRe001RootBilingualVisualInputs({
  ffdecText,
  scenarioInventory,
  staticDisposition,
  standaloneManifest,
  rendererAudit,
  moduleSource,
  timelineSource
}) {
  requireValue(
    scenarioInventory?.animationId === RE001_ANIMATION_ID &&
      scenarioInventory?.source?.swfSha256 === RE001_SOURCE_SWF_SHA256,
    'scenario inventory identity or source hash is stale'
  );
  requireValue(
    scenarioInventory.source?.stage?.width === 800 &&
      scenarioInventory.source?.stage?.height === 600 &&
      scenarioInventory.source?.fps === 12 &&
      scenarioInventory.source?.rootFrameCount === 55,
    'scenario inventory native runtime facts are stale'
  );
  const rootTimeline = scenarioInventory.timelineInventory?.find(
    ({timelineId}) => timelineId === 'root'
  );
  const nestedTimeline = scenarioInventory.timelineInventory?.find(
    ({timelineId}) => timelineId === 'sprite-621'
  );
  requireValue(rootTimeline?.frameCount === 55, 'root timeline must retain 55 frames');
  requireValue(
    nestedTimeline?.frameCount === 27,
    'sprite-621 timeline must retain 27 frames'
  );
  requireValue(
    rootTimeline.namedPlacements?.some(
      ({frame, name, objectId}) =>
        frame === 51 && name === 'animation' && objectId === '621'
    ),
    'root frame 51 no longer binds the animation placement to sprite-621'
  );

  const scriptBlocks = extractRe001FfdecScriptBlocks(ffdecText);
  const expectedScriptPaths = [
    'DefineButton2_75/BUTTONCONDACTION on(release).as',
    'DefineButton2_80/BUTTONCONDACTION on(release).as',
    'DefineButton2_85/BUTTONCONDACTION on(release).as',
    'DefineSprite_621/frame_1/DoAction.as',
    'frame_1/DoAction.as',
    'frame_51/DoAction.as'
  ];
  requireValue(
    scriptBlocks.size === expectedScriptPaths.length &&
      expectedScriptPaths.every((script) => scriptBlocks.has(script)),
    'complete RE001 FFDec script set no longer matches the six audited exports'
  );
  requireValue(
    scriptBlocks
      .get('DefineSprite_621/frame_1/DoAction.as')
      ?.includes('_global.REVIEWANS.split("SPL");'),
    'sprite-621 no longer contains the audited REVIEWANS host dependency'
  );
  requireValue(
    scriptBlocks
      .get('DefineButton2_85/BUTTONCONDACTION on(release).as')
      ?.includes('getURL("javascript:history.back()");'),
    'legacy Back source side effect is no longer present in the bound script set'
  );
  const languageSensitiveScriptMatches =
    ffdecText.match(/\b(?:english|spanish|language|lang)\b/gi) ?? [];
  requireValue(
    languageSensitiveScriptMatches.length === 0,
    'RE001 SWF ActionScript now contains a language-sensitive branch'
  );

  requireValue(
    staticDisposition?.animationId === RE001_ANIMATION_ID &&
      staticDisposition?.status === 'verified-static-composite-claims',
    'static frame-domain disposition is missing or unverified'
  );
  requireValue(
    staticDisposition.claims?.length === 100,
    'RE001 static disposition must retain exactly 100 structural child claims'
  );
  requireValue(
    allFalse(staticDisposition.acceptanceEffects),
    'static disposition unexpectedly promotes an acceptance claim'
  );

  requireValue(
    standaloneManifest?.animationId === RE001_ANIMATION_ID &&
      standaloneManifest?.status === 'authoritative-standalone-runtime-baseline' &&
      standaloneManifest?.source?.swfSha256 === RE001_SOURCE_SWF_SHA256,
    'standalone Adobe manifest identity or source binding is stale'
  );
  requireValue(
    standaloneManifest.runtime?.stage?.width === 800 &&
      standaloneManifest.runtime?.stage?.height === 600 &&
      standaloneManifest.runtime?.fps === 12 &&
      standaloneManifest.runtime?.frameCount === 55 &&
      standaloneManifest.runtime?.scenario === 'standalone-default' &&
      standaloneManifest.runtime?.lang === 'en',
    'standalone Adobe runtime metadata is stale'
  );
  requireValue(
    standaloneManifest.frames?.length === 55 &&
      standaloneManifest.frames.every(
        ({bytes, file, frame, height, sha256: frameSha256, width}, index) =>
          frame === index + 1 &&
          file === `frame-${String(index + 1).padStart(4, '0')}.png` &&
          frameSha256 ===
            'b5ca7ce7ed2805be4b0afe8309d26f0fa215abfe35efbc4d0f96bd32db5c3183' &&
          bytes === 12175 &&
          width === 800 &&
          height === 600
      ),
    'standalone Adobe frame manifest is not the fixed 55-frame root trace'
  );

  requireValue(
    rendererAudit?.animationId === RE001_ANIMATION_ID &&
      rendererAudit?.status === 'renderer-frame-domain-support-incomplete',
    'renderer audit identity or status is stale'
  );
  requireValue(
    rendererAudit.summary?.probeCount === 16 &&
      rendererAudit.summary?.exactIdentityCount === 16 &&
      rendererAudit.summary?.renderableCount === 4 &&
      rendererAudit.summary?.blockedCount === 12,
    'renderer audit must prove exactly 4 root endpoints ready and 12 nested endpoints blocked'
  );
  const rootSupport = rendererAudit.domainSupport?.find(
    ({frameDomain}) => frameDomain === 'root'
  );
  const nestedSupport = rendererAudit.domainSupport?.find(
    ({frameDomain}) => frameDomain === 'sprite-621'
  );
  requireValue(
    rootSupport?.fullyRenderable === true &&
      rootSupport?.renderableCount === 4 &&
      rootSupport?.blockedCount === 0,
    'root en/es endpoint support is incomplete'
  );
  requireValue(
    nestedSupport?.fullyRenderable === false &&
      nestedSupport?.renderableCount === 0 &&
      nestedSupport?.blockedCount === 12,
    'sprite-621 must remain entirely blocked'
  );
  const rootProbes = rendererAudit.probes?.filter(
    ({request}) => request.frameDomain === 'root'
  );
  const nestedProbes = rendererAudit.probes?.filter(
    ({request}) => request.frameDomain === 'sprite-621'
  );
  requireValue(
    rootProbes?.length === 4 &&
      rootProbes.every(
        ({actual, renderable}) =>
          renderable === true && actual?.status === 'ready' && actual?.blocker === null
      ),
    'one or more root en/es renderer endpoints are not ready'
  );
  requireValue(
    nestedProbes?.length === 12 &&
      nestedProbes.every(
        ({actual, renderable}) =>
          renderable === false &&
          actual?.status === 'blocked' &&
          (actual.language === 'es'
            ? actual.blocker === 'spanish-host-state-not-source-proven'
            : actual.scenario === 'legacy-back-unavailable'
              ? actual.blocker === 'javascript-history-side-effect-disabled'
              : actual.blocker === 'reviewans-host-state-unavailable')
      ),
    'one or more sprite-621 language/scenario endpoints escaped fail-closed handling'
  );

  requireValue(
    timelineSource.includes("'source-shared-untranslated-visual'") &&
      timelineSource.includes("'host-dependent-unresolved'"),
    'timeline source does not expose both visual localization dispositions'
  );
  requireValue(
    moduleSource.includes('data-visual-localization-status') &&
      moduleSource.includes('source-shared untranslated'),
    'renderer source does not visibly bind the source-shared untranslated classification'
  );
  for (const forbidden of [
    /\bfetch\s*\(/,
    /XMLHttpRequest/,
    /WebSocket/,
    /\beval\s*\(/,
    /new Function/,
    /setInterval/,
    /setTimeout/,
    /requestAnimationFrame/,
    /new Audio/,
    /<audio\b/
  ]) {
    requireValue(!forbidden.test(moduleSource), `renderer source matches forbidden ${forbidden}`);
  }

  return {
    languageSensitiveScriptMatches,
    rootTimeline,
    nestedTimeline,
    sourceScripts: [...scriptBlocks].map(([script, body]) => ({
      script,
      bodySha256: sha256(body)
    })),
    rootSupport,
    nestedSupport
  };
}

export async function buildRe001RootBilingualVisualDisposition() {
  const [
    sourceSwfBytes,
    ffdecBytes,
    scenarioInventoryBytes,
    staticDispositionBytes,
    standaloneManifestBytes,
    rendererAuditBytes,
    staleBrowserQaReceiptBytes,
    moduleBytes,
    timelineBytes
  ] = await Promise.all([
    readFile(absolute(RE001_SOURCE_SWF)),
    readFile(absolute(inputPaths.ffdecScripts)),
    readFile(absolute(inputPaths.scenarioInventory)),
    readFile(absolute(inputPaths.staticDisposition)),
    readFile(absolute(inputPaths.standaloneManifest)),
    readFile(absolute(RE001_RENDERER_AUDIT)),
    readFile(absolute(RE001_STALE_BROWSER_QA_RECEIPT)),
    readFile(absolute(inputPaths.module)),
    readFile(absolute(inputPaths.timeline))
  ]);
  requireValue(
    sha256(sourceSwfBytes) === RE001_SOURCE_SWF_SHA256,
    'preserved RE001 SWF hash does not match the pinned source'
  );

  const ffdecText = gunzipSync(ffdecBytes).toString('utf8');
  const scenarioInventory = JSON.parse(scenarioInventoryBytes);
  const staticDisposition = JSON.parse(staticDispositionBytes);
  const standaloneManifest = JSON.parse(standaloneManifestBytes);
  const rendererAudit = JSON.parse(rendererAuditBytes);
  const staleBrowserQaReceipt = JSON.parse(staleBrowserQaReceiptBytes);
  const moduleSource = moduleBytes.toString('utf8');
  const timelineSource = timelineBytes.toString('utf8');
  const validated = validateRe001RootBilingualVisualInputs({
    ffdecText,
    scenarioInventory,
    staticDisposition,
    standaloneManifest,
    rendererAudit,
    moduleSource,
    timelineSource
  });
  requireValue(
    staleBrowserQaReceipt?.animationId === RE001_ANIMATION_ID &&
      staleBrowserQaReceipt?.status === 'verified-historical-stale' &&
      staleBrowserQaReceipt?.staleArtifact?.sha256 ===
        '41e66586f4b0b20cfb8f97f5a01fabe8f52f0823e6b2ac0931ce377c34f6c025' &&
      staleBrowserQaReceipt?.staleChecks?.replacementBrowserQaGenerated === false &&
      allFalse(staleBrowserQaReceipt?.acceptanceEffects),
    'formal prior browser QA stale receipt is missing or invalid'
  );

  const archiveDirectory = standaloneManifest.capture?.archiveDirectory;
  requireValue(
    typeof archiveDirectory === 'string',
    'standalone Adobe archive directory is missing'
  );
  const archiveFrames = [];
  for (const frame of standaloneManifest.frames) {
    const relativePath = `${archiveDirectory}/${frame.file}`;
    const bytes = await readFile(absolute(relativePath));
    const png = PNG.sync.read(bytes);
    requireValue(
      sha256(bytes) === frame.sha256 &&
        bytes.length === frame.bytes &&
        png.width === frame.width &&
        png.height === frame.height,
      `${relativePath} no longer matches the standalone frame manifest`
    );
    archiveFrames.push({
      frame: frame.frame,
      file: frame.file,
      sha256: sha256(bytes),
      bytes: bytes.length,
      width: png.width,
      height: png.height
    });
  }
  const archiveInventorySha256 = sha256(
    archiveFrames
      .map(
        ({bytes, file, frame, height, sha256: frameSha256, width}) =>
          `${frame}\0${file}\0${frameSha256}\0${bytes}\0${width}\0${height}`
      )
      .join('\n')
  );

  const report = {
    schemaVersion: 1,
    evidenceType: 'source-shared-bilingual-visual-disposition',
    animationId: RE001_ANIMATION_ID,
    status: 'verified-root-source-shared-untranslated-visual',
    migrationStatusChanged: false,
    authorityStatement: [
      'The preserved RE001 SWF contains one fixed standalone root drawing. The authoritative English Adobe standalone manifest binds all 55 root frames to the same 800x600 PNG.',
      'The complete six-script FFDec export contains no English, Spanish, language, or lang branch. Exposing the same fixed English source drawing in en and es request contexts preserves that source visual; it does not create or prove a Spanish translation.',
      'This disposition applies only to root/root-standalone. Every sprite-621 default, host-review-unavailable, and legacy-back-unavailable endpoint remains blocked in both languages because REVIEWANS host state and the prohibited history side effect remain unresolved.'
    ],
    generatedFrom: {
      sourceSwf: {
        path: RE001_SOURCE_SWF,
        sha256: sha256(sourceSwfBytes)
      },
      ffdecScripts: {
        path: inputPaths.ffdecScripts,
        sha256: sha256(ffdecBytes),
        uncompressedSha256: sha256(ffdecText),
        exportedScriptCount: validated.sourceScripts.length
      },
      scenarioInventory: {
        path: inputPaths.scenarioInventory,
        sha256: sha256(scenarioInventoryBytes)
      },
      staticFrameDomainDispositionEvidence: {
        path: inputPaths.staticDisposition,
        sha256: sha256(staticDispositionBytes)
      },
      standaloneRootManifest: {
        path: inputPaths.standaloneManifest,
        sha256: sha256(standaloneManifestBytes),
        archiveDirectory,
        archiveFrameCount: archiveFrames.length,
        archiveInventorySha256
      },
      rendererFrameDomainSupport: {
        path: RE001_RENDERER_AUDIT,
        sha256: sha256(rendererAuditBytes)
      },
      priorBrowserQaStaleDisposition: {
        path: RE001_STALE_BROWSER_QA_RECEIPT,
        sha256: sha256(staleBrowserQaReceiptBytes),
        staleArtifactPath: staleBrowserQaReceipt.staleArtifact.path,
        staleArtifactSha256: staleBrowserQaReceipt.staleArtifact.sha256
      },
      rendererAssets: {
        module: {
          path: inputPaths.module,
          sha256: sha256(moduleBytes),
          bytes: moduleBytes.length
        },
        timeline: {
          path: inputPaths.timeline,
          sha256: sha256(timelineBytes),
          bytes: timelineBytes.length
        },
        externalVisualAssets: []
      }
    },
    sourceFindings: {
      nativeStage: {width: 800, height: 600},
      fps: 12,
      rootFrameCount: validated.rootTimeline.frameCount,
      nestedFrameDomain: {
        timelineId: validated.nestedTimeline.timelineId,
        frameCount: validated.nestedTimeline.frameCount,
        hostStateRequired: true
      },
      standaloneRootFrames: {
        frameCount: archiveFrames.length,
        distinctPngSha256Count: new Set(
          archiveFrames.map(({sha256: frameSha256}) => frameSha256)
        ).size,
        sharedPngSha256: archiveFrames[0].sha256,
        archiveInventorySha256
      },
      sourceScripts: validated.sourceScripts,
      languageSensitiveActionScriptMatches: validated.languageSensitiveScriptMatches
    },
    implementationDisposition: {
      root: {
        frameDomain: 'root',
        scenario: 'root-standalone',
        languages: ['en', 'es'],
        status: 'ready',
        visualClassification: 'source-shared-untranslated-visual',
        renderSameFixedEnglishSourceVisualForBothLanguages: true,
        spanishTranslationSupplied: false
      },
      nested: {
        frameDomain: 'sprite-621',
        scenarios: [
          'default',
          'host-review-unavailable',
          'legacy-back-unavailable'
        ],
        languages: ['en', 'es'],
        endpointCount: 6,
        status: 'blocked',
        visualClassification: 'host-dependent-unresolved',
        reviewansHostStateSupplied: false,
        legacyHistorySideEffectExecuted: false
      },
      rendererProbeSummary: {
        probeCount: rendererAudit.summary.probeCount,
        renderableCount: rendererAudit.summary.renderableCount,
        blockedCount: rendererAudit.summary.blockedCount,
        rootFullyRenderable: validated.rootSupport.fullyRenderable,
        nestedFullyRenderable: validated.nestedSupport.fullyRenderable
      },
      audioRendered: false,
      currentJavascriptImplementationCapture: false,
      coverageAdopted: false,
      replacementBrowserQaGenerated: false
    },
    acceptanceEffects: {
      authoritativeSpanishOriginalRuntimeBaseline: false,
      spanishTranslation: false,
      bilingualVisualParity: false,
      audioAcceptance: false,
      naturalOriginalRuntimeTraversal: false,
      branchParity: false,
      behaviorParity: false,
      fullFrameCoverage: false,
      rmseAcceptance: false,
      accessibilityAcceptance: false,
      humanVisualReview: false,
      engineeringAcceptance: false,
      ownerAcceptance: false,
      strictMigrationCompletion: false
    },
    strictAcceptanceEffect:
      'none; this evidence permits only the fixed English source drawing to render unchanged for root/root-standalone in en and es request contexts. Spanish translation, sprite-621 host behavior, audio, current implementation capture, full-frame/RMSE, accessibility acceptance, human review, owner acceptance, and migration completion remain unresolved.'
  };
  requireValue(
    allFalse(report.acceptanceEffects),
    'RE001 disposition must leave every acceptance effect false'
  );
  return report;
}

export function serializeRe001RootBilingualVisualDisposition(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function parseArguments(argv) {
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
    console.log(
      'Usage: node scripts/build-re001-root-bilingual-visual-disposition.mjs [--check]'
    );
    return;
  }

  const rendererAudit = serializeRe001RendererAudit(
    await buildRe001RendererAuditReport()
  );
  if (options.check) {
    const currentRendererAudit = await readFile(absolute(RE001_RENDERER_AUDIT), 'utf8');
    if (currentRendererAudit !== rendererAudit) {
      throw new Error(`${RE001_RENDERER_AUDIT} is stale`);
    }
  } else {
    await writeFile(absolute(RE001_RENDERER_AUDIT), rendererAudit, 'utf8');
  }

  await ensurePriorBrowserQaArchive(options);
  const staleBrowserQaReceipt = serializeRe001PriorBrowserQaStaleReceipt(
    await buildRe001PriorBrowserQaStaleReceipt()
  );
  if (options.check) {
    const currentStaleReceipt = await readFile(
      absolute(RE001_STALE_BROWSER_QA_RECEIPT),
      'utf8'
    );
    if (currentStaleReceipt !== staleBrowserQaReceipt) {
      throw new Error(`${RE001_STALE_BROWSER_QA_RECEIPT} is stale`);
    }
  } else {
    await writeFile(
      absolute(RE001_STALE_BROWSER_QA_RECEIPT),
      staleBrowserQaReceipt,
      'utf8'
    );
  }

  const disposition = serializeRe001RootBilingualVisualDisposition(
    await buildRe001RootBilingualVisualDisposition()
  );
  if (options.check) {
    const current = await readFile(absolute(RE001_OUTPUT), 'utf8');
    if (current !== disposition) throw new Error(`${RE001_OUTPUT} is stale`);
    console.log(`RE001 root bilingual visual disposition is current: ${RE001_OUTPUT}`);
    return;
  }
  await writeFile(absolute(RE001_OUTPUT), disposition, 'utf8');
  console.log(`Wrote ${RE001_RENDERER_AUDIT}`);
  console.log(`Preserved ${RE001_STALE_BROWSER_QA_ARCHIVE}`);
  console.log(`Wrote ${RE001_STALE_BROWSER_QA_RECEIPT}`);
  console.log(`Wrote ${RE001_OUTPUT}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
