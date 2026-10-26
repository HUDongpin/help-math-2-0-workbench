#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, realpath, unlink, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {freezeG678Final354PrivateCurrentJsRegistryWitness} from
  './freeze-g678-final354-private-current-js-registry-witness.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
export const OUTPUT =
  'catalog/g678-final354-current-bridge-successor-compatibility-v1.json';
const BRIDGE = 'apps/web/lib/g678-calibration-product-bridge.server.ts';
const BRIDGE_TEST =
  'apps/web/tests/g678-provisional377-prepared-product-bridge.server-test.ts';
const FINAL354 =
  'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.json';
const FINAL354_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.fragment.json';
const FINAL354_REGISTRY =
  'catalog/product-bridge-calibrations/g678-final354-private-current-js-registry-witness-v1.json';
const FINAL354_REGISTRY_WITNESS_BUILDER =
  'scripts/freeze-g678-final354-private-current-js-registry-witness.mjs';
export const EXPECTED_FINAL354_BRIDGE = Object.freeze({bytes: 153620,
  sha256: '00b14152cce3b84293fbd14ebe6390b254cfd22c208857c1c6618dcae8630166'});
const MARKER = /^([ \t]*)\/\/ PROVISIONAL377_BRIDGE_BEGIN: ([^\n]+)\n[\s\S]*?^\1\/\/ PROVISIONAL377_BRIDGE_END: \2\n?/gmu;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}
function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function stableBytes(value) { return Buffer.from(`${JSON.stringify(value, null, 2)}\n`); }
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
function replaceOnce(source, before, after, label) {
  invariant(source.split(before).length === 2,
    `current bridge ${label} exact inverse drifted`);
  return source.replace(before, after);
}

export function reconstructFinal354ProductBridge(currentSource) {
  const labels = [];
  let source = currentSource.replace(MARKER, (match, indentation, label) => {
    void match; void indentation; labels.push(label); return '';
  });
  invariant(exact(labels, [
    'freeze-phase', 'phase', 'maintained-dom-type',
    'maintained-dom-snapshot', 'exact-artifact-binding',
    'maintained-dom-host-capabilities',
    'maintained-dom-host-capability-projection',
    'maintained-dom-authority-map', 'maintained-dom-authorities',
    'maintained-dom-collection', 'maintained-dom-registration',
    'maintained-dom-projection', 'maintained-dom-ready-output',
    'maintained-dom-empty-output',
  ]), 'current bridge exact provisional377 marker set drifted');
  source = replaceOnce(source,
    '    const registrationRecord = record(registration);\n', '',
    'registration record');
  source = replaceOnce(source,
    "        (maintainedDomRegistrationValid || canvasRegistrationValid) &&\n" +
      "        typeof registrationRecord.moduleSha256 === 'string' &&\n" +
      '        SHA256.test(registrationRecord.moduleSha256) &&\n' +
      "        typeof registrationRecord.timelineSha256 === 'string' &&\n" +
      '        SHA256.test(registrationRecord.timelineSha256) &&',
    "        registration.runtimeSha256 === registeredRuntime.sha256 &&\n" +
      "        typeof registration.moduleSha256 === 'string' &&\n" +
      '        SHA256.test(registration.moduleSha256) &&\n' +
      "        typeof registration.timelineSha256 === 'string' &&\n" +
      '        SHA256.test(registration.timelineSha256) &&',
    'registration invariant');
  source = replaceOnce(source,
    '    selectedIdentities.add(identity);\n  }',
    '    selectedIdentities.add(identity);\n' +
      '    runtimeAssets.push(runtimeAsset(animationId, selected.runtime));\n  }',
    'canvas projection');
  source = replaceOnce(source,
    '  readonly url: string;\n}\n\n\nexport interface G678Partial',
    '  readonly url: string;\n}\n\nexport interface G678Partial',
    'maintained DOM type spacing');
  source = replaceOnce(source,
    '    binding.sha256 === observed.sha256;\n}\n\n\nfunction sourceLabel',
    '    binding.sha256 === observed.sha256;\n}\n\nfunction sourceLabel',
    'artifact helper spacing');
  return source;
}

export function assertFinal354BridgeExactInverse(currentSource) {
  const reconstructed = Buffer.from(
    reconstructFinal354ProductBridge(currentSource));
  invariant(reconstructed.length === EXPECTED_FINAL354_BRIDGE.bytes &&
    sha256(reconstructed) === EXPECTED_FINAL354_BRIDGE.sha256,
  'final354 bridge exact inverse did not reconstruct the predecessor');
  return reconstructed;
}

export async function prepareG678Final354CurrentBridgeSuccessorCompatibility() {
  const [bridge, bridgeTest, final354, fragment, registry,
    registryWitnessBuilder, builder, witnessCheck] =
    await Promise.all([
      binding(BRIDGE), binding(BRIDGE_TEST), binding(FINAL354, true),
      binding(FINAL354_FRAGMENT, true), binding(FINAL354_REGISTRY, true),
      binding(FINAL354_REGISTRY_WITNESS_BUILDER),
      binding(path.relative(ROOT, SCRIPT_PATH)),
      freezeG678Final354PrivateCurrentJsRegistryWitness({check: true}),
    ]);
  const reconstructed = assertFinal354BridgeExactInverse(
    bridge.buffer.toString('utf8'));
  const selected = final354.value.selectedPages;
  const calibration = registry.value.calibrations.filter((candidate) =>
    candidate.calibrationId === 'g678-16-page-product-calibration-v1');
  invariant(final354.value.status ===
      'private-current-js-product-host-calibrated-candidates-registered' &&
    final354.value.registrationCandidatePlacementCount === 354 &&
    selected.length === 354 &&
    selected.every((page) => page.runtime?.canvasRenderer?.sha256 &&
      page.runtime.rendererBinding === undefined) &&
    final354.value.productHostCalibration.familyCalibratedPlacementCount ===
      138 &&
    final354.value.productHostCalibration.browserSampleCount === 104 &&
    final354.value.productHostCalibration.screenshotCount === 111 &&
    final354.value.productHostCalibration.wholeLessonEngineeringPreviewCount ===
      1 &&
    final354.value.productHostCalibration.overallG678ProductCalibrationPassed ===
      false &&
    exact(fragment.value.freeze, descriptor(final354)) &&
    fragment.value.calibration.entries.length === 354 &&
    calibration.length === 1 && calibration[0].entries.length === 354 &&
    calibration[0].freezeManifestSha256 === final354.sha256 &&
    witnessCheck.check === true &&
    witnessCheck.exactFinal354RegistrationCount === 354 &&
    witnessCheck.liveRegistryRequiredDuringCheck === false &&
    Object.values(final354.value.acceptanceEffects).every((value) =>
      value === false),
  'final354 predecessor compatibility boundary drifted');
  const artifact = {
    schemaVersion: 1,
    artifactType:
      'g678-final354-current-bridge-successor-compatibility-v1',
    status:
      'exact-final354-inverse-and-static-compatibility-current-host-revalidation-required',
    inputs: {currentBridge: descriptor(bridge),
      preparedProvisional377BridgeTest: descriptor(bridgeTest),
      final354ProductCalibratedFreeze: descriptor(final354),
      final354ProductCalibratedFragment: descriptor(fragment),
      final354PrivateRegistryWitness: descriptor(registry),
      final354PrivateRegistryWitnessBuilder: descriptor(registryWitnessBuilder),
      builder: descriptor(builder)},
    exactInverseTransformation: {
      reconstructedBytes: reconstructed.length,
      reconstructedSha256: sha256(reconstructed),
      expectedFinal354Bridge: EXPECTED_FINAL354_BRIDGE,
      exactMatch: true,
      allowedSuccessorChanges: [
        'one provisional377 freeze phase selected only by an explicit local phase',
        'three exact unregistered maintained DOM fragment authority kinds',
        'one discriminated maintained-dom-module-v1 registration and descriptor provenance union for exact23',
        'separate 354 external canvas runtime assets and 23 maintained DOM renderer records',
        'source-bound ALG L11 maintained DOM lesson-host capability projection',
      ],
      otherBridgeChangesDetected: false,
    },
    final354Compatibility: {
      exactDescriptorInvariantCount: 354,
      exactExternalCanvasRuntimeAssetCount: 354,
      maintainedDomRendererCount: 0,
      historicalProductHostCalibratedPlacementCount: 138,
      historicalFamilyCalibrationCount: 22,
      priorBrowserSampleCount: 104,
      priorScreenshotCount: 111,
      productCalibratedCompleteLessonKeys: ['shared-alg001-l09'],
      productCalibratedWholeLessonEngineeringPreviewCount: 1,
      currentBridgeStaticCompatibilityEstablished: true,
      currentHostBrowserRevalidated: false,
    },
    requiredProvisional377BrowserAssertions: {
      predecessorSamplesMustBeReplayed: true,
      predecessorReplayCount: 104,
      exactNewMaintainedDomPlacementCount: 23,
      exactExternalCanvasRuntimeAssetCount: 354,
      exactMaintainedDomRendererCount: 23,
      algL11RegisteredPageCount: 44,
      algL11ActivePageCount: 44,
      registeredCompleteLessonCount: 2,
      productCalibratedWholeLessonEngineeringPreviewCount: 1,
      newWholeLessonEngineeringPreviewCount: 0,
      browserProductCalibrationPassed: false,
    },
    acceptanceEffects: {authoritativeOriginalRuntime: false,
      behaviorParityAccepted: false, visualFidelityAccepted: false,
      audioAccepted: false, humanVisualAccepted: false,
      ownerAccepted: false, strictComplete: false, releaseEligible: false,
      published: false},
  };
  return Object.freeze({artifact, bytes: stableBytes(artifact)});
}

async function writeExclusive(relativePath, bytes) {
  const target = absolute(relativePath);
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, bytes, {flag: 'wx'});
  try { await copyFile(temporary, target, fsConstants.COPYFILE_EXCL); }
  finally { await unlink(temporary).catch(() => {}); }
}

export async function auditG678Final354CurrentBridgeSuccessorCompatibility(
  {check = false} = {},
) {
  const prepared =
    await prepareG678Final354CurrentBridgeSuccessorCompatibility();
  if (check) {
    const current = await binding(OUTPUT);
    invariant(current.buffer.equals(prepared.bytes),
      'final354 current-bridge successor compatibility artifact drifted');
  } else {
    await writeExclusive(OUTPUT, prepared.bytes);
  }
  return Object.freeze({check, output: {path: OUTPUT,
    bytes: prepared.bytes.length, sha256: sha256(prepared.bytes)},
  exactDescriptorInvariantCount: 354, predecessorReplayCount: 104,
  currentHostBrowserRevalidated: false,
  exactInverseTransformationPassed: true, acceptanceEffectsChanged: false});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: audit-g678-final354-current-bridge-successor-compatibility.mjs [--check]');
  auditG678Final354CurrentBridgeSuccessorCompatibility({
    check: args.includes('--check'),
  }).then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
