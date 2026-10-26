#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, realpath, unlink, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {validateFq01BrowserCalibrationReceipt} from
  './check-g678-fq01-browser-calibration-receipt.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const REPRESENTATIVE = 'shared-alg001-l01-p055';
const OUTPUT =
  'catalog/product-bridge-calibrations/g678-fq01-family-calibration-v1.json';
const PATHS = Object.freeze({
  audit: 'catalog/g678-final-quiz-intro-family-audit-v1.json',
  generator: 'scripts/build-g678-fq01-current-js.mjs',
  generatorRun:
    'work/g678-shared-page-factory/g678-fq01-current-js-calibration-1-v1/run-manifest.json',
  generatorFragment:
    'catalog/product-bridge-calibrations/g678-fq01-current-js-calibration-1-v1.fragment.json',
  interimFreeze:
    'catalog/product-bridge-calibrations/g678-current-js-173-page-fq01-calibration-v1.json',
  interimFragment:
    'catalog/product-bridge-calibrations/g678-current-js-173-page-fq01-calibration-v1.fragment.json',
  browser: 'output/playwright/g678-fq01-family-calibration/evidence.json',
  browserVerifier:
    'scripts/check-g678-fq01-browser-calibration-receipt.mjs',
  snapshotPrivateRegistry:
    'work/g678-shared-page-factory/g678-fq01-calibration-173-registry-snapshot-v1/private-current-js-registry.json',
  snapshotLocalRegistry:
    'work/g678-shared-page-factory/g678-fq01-calibration-173-registry-snapshot-v1/registry.local-only.metadata.generated.ts',
  snapshotLauncher:
    'work/g678-shared-page-factory/g678-fq01-calibration-173-registry-snapshot-v1/local-preview-launcher.mjs',
  snapshotBrowserQa:
    'work/g678-shared-page-factory/g678-fq01-calibration-173-registry-snapshot-v1/browser-qa-script.mjs',
  sourceStaticHost: 'packages/demos/src/source-static-canvas-candidate.tsx',
  safeAdapter: 'scripts/build-safe-ffdec-canvas-adapter.mjs',
  productBridge:
    'work/g678-shared-page-factory/g678-fq01-calibration-173-registry-snapshot-v1/product-bridge.server.ts',
});
const FALSE_EFFECTS = Object.freeze({
  authoritativeOriginalRuntime: false,
  behaviorAccepted: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  releaseEligible: false,
  released: false,
  published: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}
function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}
function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}
function projectPath(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}
async function binding(relativePath, {json = false} = {}) {
  const target = projectPath(relativePath);
  const [canonical, before] = await Promise.all([
    realpath(target), lstat(target, {bigint: true}),
  ]);
  invariant(canonical === target && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${relativePath} must be one canonical ordinary file`);
  const buffer = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, bytes: buffer.length,
    sha256: sha256(buffer), buffer,
    ...(json ? {value: JSON.parse(buffer)} : {})});
}
function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}

async function expectedArtifact() {
  const verifiedBrowserReceipt =
    await validateFq01BrowserCalibrationReceipt();
  const entries = await Promise.all(Object.entries(PATHS).map(
    async ([key, relativePath]) => [key, await binding(relativePath,
      {json: ['audit', 'generatorRun', 'generatorFragment', 'interimFreeze',
        'interimFragment', 'browser'].includes(key)})],
  ));
  const inputs = Object.fromEntries(entries);
  const builder = await binding(path.relative(ROOT, SCRIPT_PATH));
  const audit = inputs.audit.value;
  const run = inputs.generatorRun.value;
  const fragment = inputs.generatorFragment.value;
  const interim = inputs.interimFreeze.value;
  const interimFragment = inputs.interimFragment.value;
  const browser = inputs.browser.value;
  const authorizedPlacementIds = audit.records.flatMap((record) =>
    record.placementIds).sort();
  invariant(JSON.stringify(verifiedBrowserReceipt.evidenceBinding) ===
      JSON.stringify(descriptor(inputs.browser)) &&
    JSON.stringify(verifiedBrowserReceipt.historicalBindings) ===
      JSON.stringify({
        privateRegistry: descriptor(inputs.snapshotPrivateRegistry),
        localRegistry: descriptor(inputs.snapshotLocalRegistry),
        launcher: descriptor(inputs.snapshotLauncher),
        productBridge: descriptor(inputs.productBridge),
        self: descriptor(inputs.snapshotBrowserQa),
      }),
  'FQ01 durable browser receipt/snapshot validation drifted');
  invariant(audit.artifactType ===
      'g678-final-quiz-intro-family-audit-v1' &&
      audit.status ===
        'complete-source-and-exact-script-audit-calibration-pending' &&
      audit.records.length === 6 &&
      authorizedPlacementIds.length === 44 &&
      new Set(authorizedPlacementIds).size === 44 &&
      audit.records.every((record) =>
        record.structure.mainFrameCount === 52 &&
        record.structure.buttonCount === 0 &&
        record.structure.audioStreamCount === 0 &&
        record.exactScripts.fileCount === 14 &&
        record.exactScripts.checksumSetSha256 ===
          audit.exactClassifier.normalizedExactScriptSetSha256),
  'FQ01 audit classifier drifted');
  invariant(run.runId === 'g678-fq01-current-js-calibration-1-v1' &&
    run.scope.generatedPlacementCount === 1 &&
    run.members.length === 1 && run.members[0].animationId === REPRESENTATIVE &&
    run.currentJavaScriptRegistered === false &&
    run.familyScaleOutAuthorized === false &&
    JSON.stringify(run.inputs.review) === JSON.stringify(descriptor(inputs.audit)) &&
    JSON.stringify(run.inputs.generator) ===
      JSON.stringify(descriptor(inputs.generator)) &&
    fragment.entries.length === 1 && fragment.entries[0].key === REPRESENTATIVE &&
    JSON.stringify(fragment.compilerRun) ===
      JSON.stringify(descriptor(inputs.generatorRun)),
  'FQ01 representative generator authority drifted');
  const member = await binding(run.members[0].manifest.path, {json: true});
  const runtime = await binding(run.members[0].runtime.path);
  invariant(member.bytes === run.members[0].manifest.bytes &&
    member.sha256 === run.members[0].manifest.sha256 &&
    runtime.bytes === run.members[0].runtime.bytes &&
    runtime.sha256 === run.members[0].runtime.sha256 &&
    member.value.timeline.frameCount === 52 &&
    member.value.timeline.livePlaybackEndFrame === 52 &&
    member.value.product.familyVisualPlaybackCalibrationPassed === false &&
    JSON.stringify(member.value.productBlockers) ===
      JSON.stringify(['fq01-family-browser-calibration-pending']),
  'FQ01 representative member/runtime drifted');
  invariant(interim.registrationCandidatePlacementCount === 173 &&
    interim.selectedPages.length === 173 &&
    interim.selectedPages.some((page) => page.animationId === REPRESENTATIVE) &&
    interim.engineeringPreviewReady === false &&
    interim.productCalibrationPassed === false &&
    interimFragment.calibration.entries.length === 173 &&
    interimFragment.calibration.freezeManifest === inputs.interimFreeze.path &&
    JSON.stringify(interimFragment.freeze) ===
      JSON.stringify(descriptor(inputs.interimFreeze)),
  'FQ01 interim product registration drifted');
  invariant(browser.artifactType ===
      'g678-fq01-browser-family-calibration-v1' &&
    browser.animationId === REPRESENTATIVE &&
    browser.registeredCurrentJsPages === 173 &&
    browser.readyStart.canvasState === 'ready' &&
    browser.readyStart.playbackComplete === 'false' &&
    browser.midpoint.frame >= 20 && browser.midpoint.frame < 52 &&
    browser.midpoint.playbackComplete === 'false' &&
    browser.naturalEnd.frame === 52 &&
    browser.naturalEnd.playbackComplete === 'true' &&
    browser.replay.startFrame < 5 && browser.replay.progressedFrame > 1 &&
    browser.replay.playbackComplete === 'false' &&
    browser.audioBoundary.audioAvailable === 'false' &&
    browser.assetResponses.length === 1 &&
    browser.assetResponses[0].status === 200 &&
    browser.assetResponses[0].corp === 'same-origin' &&
    browser.consoleErrors.length === 0 && browser.pageErrors.length === 0 &&
    browser.familyCurrentJsVisualPlaybackPassed === true &&
    browser.scaleOutAuthorizedByThisReceipt === false,
  'FQ01 browser product calibration drifted');
  return Object.freeze({schemaVersion: 1,
    artifactType: 'g678-fq01-family-calibration-v1',
    calibrationId: 'g678-fq01-family-calibration-v1',
    adapterFamily: 'final-quiz-intro-source-static',
    status: 'family-current-js-visual-playback-calibrated',
    representative: Object.freeze({animationId: REPRESENTATIVE,
      sourceSha256: member.value.source.sha256,
      frameDomain: member.value.timeline.frameDomain,
      frameCount: 52, fps: 12,
      runtimeSha256: runtime.sha256}),
    inputs: Object.freeze({...Object.fromEntries(entries.map(([key, value]) =>
      [key, descriptor(value)])), builder: descriptor(builder)}),
    authorizedPlacementIds: Object.freeze(authorizedPlacementIds),
    exactStructuralClassifier: Object.freeze({stage: '800x600', fps: 12,
      rootFrameCount: 10, rootBeginFrame: 6, mainFrameCount: 52,
      exactTerminalStop: true, buttonCount: 0, audioStreamCount: 0,
      normalizedExactScriptSetSha256:
        audit.exactClassifier.normalizedExactScriptSetSha256}),
    productCalibration: Object.freeze({canvasReady: true,
      naturalOneToEndPlayback: true, completionOnlyAtAuthoredEnd: true,
      replayResetsAndRestarts: true, localAssetIntegrityAndCorp: true,
      familyCurrentJsVisualPlaybackPassed: true,
      overallG678ProductCalibrationPassed: false}),
    scaleOutAuthorization: Object.freeze({authorized: true,
      scope: 'exact-44-audited-fq01-placement-set-only',
      requiresExactAuditAndGeneratorBindings: true,
      requiresCreateExclusiveGeneration: true,
      permitsAnotherFinalQuizPageType: false,
      permitsInteractiveQuestions: false,
      permitsOriginalRuntimeOrFidelityClaim: false,
      permitsWholeLessonPreviewClaimBeforeNNRegistration: false}),
    acceptanceEffects: FALSE_EFFECTS,
    limitations: Object.freeze([
      'This receipt calibrates maintained Current-JS playback for the exact audited FQ01 intro family only.',
      'It does not establish Adobe runtime parity, visual fidelity acceptance, human or Owner acceptance, strict completion, release, or publication.',
      'One representative was exercised in the browser; all 44 admissions still require exact source/artifact hashes and finalizer membership checks.',
    ])});
}

async function writeExclusive(bytes) {
  const target = projectPath(OUTPUT);
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, bytes, {flag: 'wx'});
  try {
    await copyFile(temporary, target, fsConstants.COPYFILE_EXCL);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

export async function buildFq01FamilyCalibration({check = false} = {}) {
  const artifact = await expectedArtifact();
  const bytes = stableBytes(artifact);
  if (check) {
    const current = await binding(OUTPUT);
    invariant(current.buffer.equals(bytes),
      'FQ01 family calibration artifact drifted');
  } else await writeExclusive(bytes);
  return Object.freeze({check, output: OUTPUT, bytes: bytes.length,
    sha256: sha256(bytes), status: artifact.status,
    authorizedPlacementCount: artifact.authorizedPlacementIds.length,
    scaleOutAuthorized: artifact.scaleOutAuthorization.authorized,
    acceptanceEffects: artifact.acceptanceEffects});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: build-g678-fq01-family-calibration.mjs [--check]');
  buildFq01FamilyCalibration({check: args[0] === '--check'})
    .then((result) => process.stdout.write(
      `${JSON.stringify(result, null, 2)}\n`,
    )).catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
