#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {auditG678Final354CurrentBridgeSuccessorCompatibility} from
  './audit-g678-final354-current-bridge-successor-compatibility.mjs';
import {freezeG678Final354PrivateCurrentJsRegistryWitness} from
  './freeze-g678-final354-private-current-js-registry-witness.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
export const FINAL354_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.json';
export const FINAL354_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.fragment.json';
export const FINAL354_REGISTRY_WITNESS =
  'catalog/product-bridge-calibrations/g678-final354-private-current-js-registry-witness-v1.json';
export const LIVE_REGISTRY = 'packages/demos/private-current-js-registry.json';
export const CURRENT_SUCCESSOR =
  'catalog/g678-final354-current-bridge-successor-compatibility-v1.json';
const REQUIRED = Object.freeze({
  freeze: Object.freeze({path: FINAL354_FREEZE, bytes: 2190557,
    sha256: 'e10f263fe19a9db3141c23ba2611730eed2e3cf7c495b27aef6e862a8936e850'}),
  fragment: Object.freeze({path: FINAL354_FRAGMENT, bytes: 245193,
    sha256: 'b3d161b1f499b0cd13f34e50445dbb2d5e049b5b0a0a2020b0d4721f92701c7b'}),
  witness: Object.freeze({path: FINAL354_REGISTRY_WITNESS, bytes: 397841,
    sha256: '2c734cdba9d19efaea00812bffdae5fa2de747972b447b8f86f6f2a0d037d239'}),
  successor: Object.freeze({path: CURRENT_SUCCESSOR, bytes: 4232,
    sha256: '2b9f3501c97f0d2eb1bc298d093d67417eba89e24e17f5a20e0b67ff8b0f61c1'}),
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}
function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function exact(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
function absolute(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}
async function binding(relativePath, json = false) {
  const target = absolute(relativePath);
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
    ...(json ? {value: JSON.parse(buffer.toString('utf8'))} : {})});
}
function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}

export function assertCurrentFinal354LiveRegistry({liveRegistryBytes,
  witnessBytes}) {
  invariant(Buffer.isBuffer(liveRegistryBytes) &&
    Buffer.isBuffer(witnessBytes) && liveRegistryBytes.equals(witnessBytes) &&
    witnessBytes.length === REQUIRED.witness.bytes &&
    sha256(witnessBytes) === REQUIRED.witness.sha256,
  'current final354 live registry is not the immutable witness');
  return true;
}

export async function checkG678CurrentFinal354Admission({
  fragmentPath = FINAL354_FRAGMENT,
  freezePath = FINAL354_FREEZE,
} = {}) {
  invariant(fragmentPath === FINAL354_FRAGMENT &&
    freezePath === FINAL354_FREEZE,
  'current final354 admission requires the exact canonical fragment and freeze');
  const [freeze, fragment, witness, liveRegistry, successor,
    witnessCheck, successorCheck] = await Promise.all([
    binding(freezePath, true), binding(fragmentPath, true),
    binding(FINAL354_REGISTRY_WITNESS, true), binding(LIVE_REGISTRY, true),
    binding(CURRENT_SUCCESSOR, true),
    freezeG678Final354PrivateCurrentJsRegistryWitness({check: true}),
    auditG678Final354CurrentBridgeSuccessorCompatibility({check: true}),
  ]);
  for (const [label, observed] of Object.entries({freeze, fragment,
    witness, successor})) {
    invariant(exact(descriptor(observed), REQUIRED[label]),
      `current final354 ${label} binding drifted`);
  }
  assertCurrentFinal354LiveRegistry({liveRegistryBytes: liveRegistry.buffer,
    witnessBytes: witness.buffer});
  const calibration = witness.value.calibrations.filter((candidate) =>
    candidate.calibrationId === 'g678-16-page-product-calibration-v1');
  invariant(freeze.value.status ===
      'private-current-js-product-host-calibrated-candidates-registered' &&
    freeze.value.registrationCandidatePlacementCount === 354 &&
    freeze.value.selectedPages.length === 354 &&
    freeze.value.productHostCalibration.familyCalibratedPlacementCount === 138 &&
    freeze.value.productHostCalibration.browserSampleCount === 104 &&
    freeze.value.productHostCalibration.wholeLessonEngineeringPreviewCount === 1 &&
    freeze.value.productHostCalibration.overallG678ProductCalibrationPassed ===
      false &&
    exact(fragment.value.freeze, descriptor(freeze)) &&
    fragment.value.calibration.freezeManifest === FINAL354_FREEZE &&
    fragment.value.calibration.entries.length === 354 &&
    calibration.length === 1 && calibration[0].entries.length === 354 &&
    calibration[0].freezeManifest === FINAL354_FREEZE &&
    calibration[0].freezeManifestSha256 === freeze.sha256 &&
    successor.value.exactInverseTransformation.exactMatch === true &&
    successor.value.final354Compatibility.exactDescriptorInvariantCount ===
      354 &&
    successor.value.final354Compatibility
      .historicalProductHostCalibratedPlacementCount === 138 &&
    successor.value.final354Compatibility.currentHostBrowserRevalidated ===
      false &&
    successor.value.requiredProvisional377BrowserAssertions
      .predecessorReplayCount === 104 &&
    Object.values(freeze.value.acceptanceEffects).every((value) =>
      value === false) &&
    witnessCheck.check === true && successorCheck.check === true,
  'current final354 successor-aware semantic boundary drifted');
  return Object.freeze({check: true, registrationCount: 354,
    historicalProductHostCalibratedPlacementCount: 138,
    predecessorReplayCount: 104, currentHostBrowserRevalidated: false,
    historicalFinal354FinalizerInvoked: false});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length === 0 ||
    (args.length === 1 && args[0] === '--check'),
  'usage: check-g678-current-final354-admission.mjs [--check]');
  checkG678CurrentFinal354Admission()
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
