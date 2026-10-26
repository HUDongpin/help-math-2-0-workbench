#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const EVIDENCE = 'output/playwright/g678-fq01-family-calibration/evidence.json';
const SNAPSHOT =
  'work/g678-shared-page-factory/g678-fq01-calibration-173-registry-snapshot-v1';
const HISTORICAL_INPUTS = Object.freeze({
  privateRegistry: `${SNAPSHOT}/private-current-js-registry.json`,
  localRegistry: `${SNAPSHOT}/registry.local-only.metadata.generated.ts`,
  launcher: `${SNAPSHOT}/local-preview-launcher.mjs`,
  productBridge: `${SNAPSHOT}/product-bridge.server.ts`,
  self: `${SNAPSHOT}/browser-qa-script.mjs`,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}
function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}
function projectPath(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}
async function binding(relativePath, {json = false, absolute = false} = {}) {
  const target = absolute ? path.resolve(relativePath) : projectPath(relativePath);
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
function matches(actual, expected) {
  return actual.bytes === expected.bytes && actual.sha256 === expected.sha256;
}

export async function validateFq01BrowserCalibrationReceipt() {
  const evidenceBinding = await binding(EVIDENCE, {json: true});
  const evidence = evidenceBinding.value;
  const snapshotRoot = await lstat(projectPath(SNAPSHOT), {bigint: true});
  invariant(snapshotRoot.isDirectory() &&
    (snapshotRoot.mode & 0o777n) === 0o555n,
  'FQ01 calibration registry snapshot root must remain read-only');
  const historicalBindings = {};
  for (const [key, relativePath] of Object.entries(HISTORICAL_INPUTS)) {
    const current = await binding(relativePath);
    const expected = evidence.inputs[key];
    invariant(expected && matches(current, expected),
      `FQ01 historical ${key} binding drifted`);
    historicalBindings[key] = Object.freeze({path: current.path,
      bytes: current.bytes, sha256: current.sha256});
  }
  for (const [key, expected] of Object.entries(evidence.inputs)) {
    if (key in HISTORICAL_INPUTS || key === 'chromium') continue;
    const current = await binding(expected.path);
    invariant(matches(current, expected), `FQ01 current ${key} binding drifted`);
  }
  const executable = await binding(
    evidence.inputs.chromium.executable.path, {absolute: true});
  invariant(matches(executable, evidence.inputs.chromium.executable) &&
    /^\d+\.\d+\.\d+\.\d+$/u.test(evidence.inputs.chromium.version),
  'FQ01 Chromium receipt identity drifted');
  invariant(evidence.artifactType ===
    'g678-fq01-browser-family-calibration-v1' &&
  evidence.animationId === 'shared-alg001-l01-p055' &&
  evidence.baseOrigin === 'http://127.0.0.1:3317' &&
  evidence.registeredCurrentJsPages === 173 &&
  evidence.readyStart.canvasState === 'ready' &&
  evidence.readyStart.playbackComplete === 'false' &&
  evidence.midpoint.frame >= 20 && evidence.midpoint.frame < 52 &&
  evidence.midpoint.playbackComplete === 'false' &&
  evidence.naturalEnd.frame === 52 &&
  evidence.naturalEnd.playbackComplete === 'true' &&
  evidence.replay.startFrame < 5 && evidence.replay.progressedFrame > 1 &&
  evidence.replay.playbackComplete === 'false' &&
  evidence.audioBoundary.audioAvailable === 'false' &&
  evidence.assetResponses.length === 1 &&
  evidence.assetResponses[0].url.includes(
    '/shared-alg001-l01-p055/canvas-renderer.js?sha256=') &&
  evidence.assetResponses[0].status === 200 &&
  evidence.assetResponses[0].corp === 'same-origin' &&
  evidence.assetResponses[0].cacheControl ===
    'private, no-store, max-age=0' &&
  evidence.assetResponses[0].noSniff === 'nosniff' &&
  evidence.consoleErrors.length === 0 && evidence.pageErrors.length === 0 &&
  evidence.familyCurrentJsVisualPlaybackPassed === true &&
  evidence.scaleOutAuthorizedByThisReceipt === false &&
  Object.values(evidence.acceptanceEffects).every((value) => value === false),
'FQ01 browser product receipt drifted');
  invariant(JSON.stringify(evidence.screenshots.map((item) => item.path)) ===
  JSON.stringify([
    'output/playwright/g678-fq01-family-calibration/midpoint.png',
    'output/playwright/g678-fq01-family-calibration/natural-end.png',
  ]), 'FQ01 browser screenshot set drifted');
  for (const screenshot of evidence.screenshots) {
    const current = await binding(screenshot.path);
    invariant(matches(current, screenshot), `${screenshot.path} drifted`);
  }
  const snapshotRegistry = (await binding(HISTORICAL_INPUTS.privateRegistry,
    {json: true})).value;
  const calibration = snapshotRegistry.calibrations.find((candidate) =>
    candidate.calibrationId === 'g678-16-page-product-calibration-v1');
  invariant(calibration.entries.length === 173 &&
  calibration.freezeManifest ===
    'catalog/product-bridge-calibrations/g678-current-js-173-page-fq01-calibration-v1.json' &&
  calibration.freezeManifestSha256 === evidence.inputs.freeze.sha256,
'FQ01 historical registry snapshot contract drifted');
  return Object.freeze({check: true, evidence: EVIDENCE,
    evidenceBinding: Object.freeze({path: EVIDENCE,
      bytes: evidenceBinding.bytes, sha256: evidenceBinding.sha256}),
    historicalBindings: Object.freeze(historicalBindings),
    historicalRegistryEntries: 173,
    familyCurrentJsVisualPlaybackPassed: true,
    scaleOutAuthorizedByThisReceipt: false});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  validateFq01BrowserCalibrationReceipt()
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
