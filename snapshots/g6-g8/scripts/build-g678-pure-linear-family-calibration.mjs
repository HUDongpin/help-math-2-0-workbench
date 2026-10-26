#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const OUTPUT =
  'catalog/product-bridge-calibrations/g678-pure-linear-family-calibration-v1.json';
const REPRESENTATIVE = 'shared-alg001-l06-p040';
const PATHS = Object.freeze({
  ir: 'catalog/product-bridge-calibrations/g678-16-page-product-calibration-v1.ir.json',
  structuralReport:
    'work/g678-shared-page-factory/calibration-structure-final-20260901-155359-v2/report.json',
  sharedRun:
    'work/g678-shared-page-factory/g678-shared-current-js-calibration-13-v1/run-manifest.json',
  member:
    `work/g678-shared-page-factory/g678-shared-current-js-calibration-13-v1/members/${REPRESENTATIVE}/member-manifest.json`,
  registeredFreeze:
    'catalog/product-bridge-calibrations/g678-16-page-product-calibration-v1.registered.json',
  browser:
    'output/playwright/g678-pure-linear-calibration/evidence.json',
  productionIsolation:
    'output/g678-production-bundle-isolation-multipage-20260902.json',
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function absolute(relativePath) {
  const result = path.resolve(ROOT, relativePath);
  invariant(result.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes the project root`);
  return result;
}

async function binding(relativePath, json = false) {
  const target = absolute(relativePath);
  const before = await lstat(target, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${relativePath} must be an ordinary single-link file`);
  const bytes = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, bytes: bytes.length,
    sha256: sha256(bytes), buffer: bytes,
    ...(json ? {value: JSON.parse(bytes)} : {})});
}

function descriptor(item) {
  return Object.freeze({path: item.path, bytes: item.bytes,
    sha256: item.sha256});
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

async function expectedArtifact() {
  const entries = await Promise.all(Object.entries(PATHS).map(
    async ([key, relativePath]) => [key, await binding(relativePath, true)],
  ));
  const inputs = Object.fromEntries(entries);
  const builder = await binding(path.relative(ROOT, SCRIPT_PATH));
  const placement = inputs.ir.value.placements.find((candidate) =>
    candidate.animationId === REPRESENTATIVE);
  const report = inputs.structuralReport.value.placements.find((candidate) =>
    candidate.placementId === REPRESENTATIVE);
  const member = inputs.member.value;
  const selected = inputs.registeredFreeze.value.selectedPages.find(
    (candidate) => candidate.animationId === REPRESENTATIVE,
  );
  const browser = inputs.browser.value;
  const scriptRows = report?.structural?.exportedScripts?.files ?? [];
  invariant(
    placement?.adapterFamily === 'pure-linear-source-static' &&
      placement.reviewedLane === 'interactive-understood' &&
      placement.mainChild?.objectId === 86 &&
      placement.mainChild?.frameCount === 189 &&
      JSON.stringify(placement.productBlockers) ===
        JSON.stringify(['embedded-audio-lifecycle-not-implemented']) &&
      report?.source?.sha256 === placement.sourceSha256 &&
      report?.structural?.ffdecHeader?.frameRate === 12 &&
      report?.structural?.ffdecHeader?.widthPx === 800 &&
      report?.structural?.ffdecHeader?.heightPx === 600 &&
      report?.structural?.ffdecDumpSWF?.buttonCount === 0 &&
      report?.structural?.swfmill?.counts?.buttons === 0 &&
      report?.structural?.swfmill?.counts?.soundStreamHeads === 1 &&
      report?.structural?.swfmill?.counts?.soundStreamBlocks === 189 &&
      scriptRows.length === 2 &&
      scriptRows[0]?.path === 'scripts/frame_1/DoAction.as' &&
      scriptRows[0]?.sha256 ===
        'af7188282949f2613421ba9c8be629f489bbe2ee1e370a072024794b2d2cfc19' &&
      scriptRows[1]?.path === 'scripts/frame_6/DoAction.as' &&
      scriptRows[1]?.sha256 ===
        '3271a793e3f9600314c6b0facc05023c4f3ed09c116d452966200a5d04735655' &&
      member?.reviewedRouting?.adapterFamily ===
        'pure-linear-source-static' &&
      member?.timeline?.frameDomain === 'sprite-86' &&
      member?.timeline?.frameCount === 189 &&
      member?.timeline?.livePlaybackEndFrame === 189 &&
      member?.runtime?.canvasRenderer?.sha256 ===
        selected?.runtime?.canvasRenderer?.sha256,
    'pure-linear representative source/runtime/registry contract drifted',
  );
  invariant(
    browser?.animationId === REPRESENTATIVE &&
      browser?.consoleErrors?.length === 0 &&
      browser?.pageErrors?.length === 0 &&
      browser?.assetResponses?.length === 1 &&
      browser.assetResponses[0]?.status === 200 &&
      browser.assetResponses[0]?.corp === 'same-origin' &&
      browser?.readyStart?.frame === 1 &&
      browser?.readyStart?.canvasState === 'ready' &&
      browser?.readyStart?.playbackComplete === 'false' &&
      browser?.midpoint?.frame >= 80 &&
      browser?.midpoint?.frame < 189 &&
      browser?.midpoint?.playbackComplete === 'false' &&
      browser?.naturalEnd?.frame === 189 &&
      browser?.naturalEnd?.playbackComplete === 'true' &&
      browser?.replay?.startFrame === 1 &&
      browser?.replay?.progressedFrame > 1 &&
      browser?.replay?.playbackComplete === 'false' &&
      browser?.audioBoundary?.audioAvailable === 'false' &&
      browser?.audioBoundary?.audioAccepted === false,
    'pure-linear natural browser playback contract drifted',
  );
  invariant(
    inputs.productionIsolation.value?.buildId === 'jSF-1i9OOfat9fuVkIHft' &&
      inputs.productionIsolation.value?.frozenCandidateCount === 16 &&
      inputs.productionIsolation.value?.matchCount === 0 &&
      inputs.productionIsolation.value?.localOnlyG678MaterialAbsent === true,
    'pure-linear production isolation receipt drifted',
  );
  const acceptanceEffects = Object.freeze({
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
  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-shared-adapter-family-calibration-v1',
    calibrationId: 'g678-pure-linear-family-calibration-v1',
    adapterFamily: 'pure-linear-source-static',
    status: 'family-current-js-visual-playback-calibrated-audio-independent',
    representative: Object.freeze({
      animationId: REPRESENTATIVE,
      sourceSha256: placement.sourceSha256,
      frameDomain: 'sprite-86',
      frameCount: 189,
      fps: 12,
      runtimeSha256: member.runtime.canvasRenderer.sha256,
    }),
    inputs: Object.freeze({
      ...Object.fromEntries(Object.entries(inputs).map(([key, value]) =>
        [key, descriptor(value)])),
      builder: descriptor(builder),
    }),
    exactStructuralClassifier: Object.freeze({
      stage: Object.freeze({width: 800, height: 600}),
      fps: 12,
      buttonCount: 0,
      childActionScriptCount: 0,
      rootActionScripts: Object.freeze([
        Object.freeze({role: 'internal-preloader-handoff',
          sha256:
            'af7188282949f2613421ba9c8be629f489bbe2ee1e370a072024794b2d2cfc19'}),
        Object.freeze({role: 'root-stop-after-main-child-placement',
          sha256:
            '3271a793e3f9600314c6b0facc05023c4f3ed09c116d452966200a5d04735655'}),
      ]),
      mainChildRequirement:
        'one reviewed animation instance with positive frame count and no child scripts',
      audioDisposition:
        'embedded sound stream inventoried but omitted from Current-JS visual family; audio remains independently blocked',
    }),
    productCalibration: Object.freeze({
      canvasReady: true,
      naturalOneToEndPlayback: true,
      completionOnlyAtAuthoredEnd: true,
      replayResetsAndRestarts: true,
      localAssetIntegrityAndCorp: true,
      productionBundleIsolation: true,
      familyCurrentJsVisualPlaybackPassed: true,
      overallSixteenPageProductCalibrationPassed: false,
    }),
    scaleOutAuthorization: Object.freeze({
      authorized: true,
      scope: 'exact-structural-classifier-matches-only',
      requiresCompleteReviewedInventoryBeforeGeneration: true,
      permitsGlossaryPages: false,
      permitsHoverPages: false,
      permitsIntroFuiPages: false,
      permitsInteractiveStops: false,
      permitsAudioAcceptanceClaim: false,
      permitsWholeLessonPreviewClaimBeforeNNRegistration: false,
    }),
    acceptanceEffects,
    limitations: Object.freeze([
      'This family receipt authorizes silent visual Current-JS generation only for exact reviewed structural matches.',
      'It does not authorize another adapter family or a broad G6-G8 factory run.',
      'It does not establish Adobe runtime parity, visual fidelity, audio correctness, human or Owner acceptance, strict completion, release, or publication.',
    ]),
  });
}

async function writeExclusive(bytes) {
  const target = absolute(OUTPUT);
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, bytes, {flag: 'wx'});
  try {
    await copyFile(temporary, target, fsConstants.COPYFILE_EXCL);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

export async function buildPureLinearFamilyCalibration({check = false} = {}) {
  const artifact = await expectedArtifact();
  const bytes = stableBytes(artifact);
  if (check) {
    const current = await binding(OUTPUT);
    invariant(current.buffer.equals(bytes),
      'pure-linear family calibration artifact drifted');
  } else {
    await writeExclusive(bytes);
  }
  return Object.freeze({check, output: OUTPUT, bytes: bytes.length,
    sha256: sha256(bytes), status: artifact.status,
    scaleOutAuthorized: artifact.scaleOutAuthorization.authorized,
    acceptanceEffects: artifact.acceptanceEffects});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: build-g678-pure-linear-family-calibration.mjs [--check]');
  buildPureLinearFamilyCalibration({check: args[0] === '--check'})
    .then((result) => process.stdout.write(
      `${JSON.stringify(result, null, 2)}\n`,
    )).catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
