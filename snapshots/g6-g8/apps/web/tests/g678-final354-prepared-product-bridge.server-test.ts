import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {assertCurrentFinal354LiveRegistry, checkG678CurrentFinal354Admission} from
  '../../../scripts/check-g678-current-final354-admission.mjs';
import {
  buildG678PartialCalibrationSnapshot,
  G678_CALIBRATION_FREEZE_PATH,
  G678_SHARED_CATALOG_PATH,
  G678_SHARED_PROFILE_PATH,
} from '../lib/g678-calibration-product-bridge.server';

const sha256 = (bytes: Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex');

async function jsonBinding(relativePath: string) {
  const bytes = await readFile(new URL(`../../../${relativePath}`,
    import.meta.url));
  return Object.freeze({path: relativePath, bytes: bytes.length,
    sha256: sha256(bytes), value: JSON.parse(bytes.toString('utf8'))});
}

test('immutable final354 projects successor-aware while current admission follows live registry', async () => {
  const [freeze, catalog, profile, privateRegistry, liveRegistry] =
    await Promise.all([
      jsonBinding(G678_CALIBRATION_FREEZE_PATH),
      jsonBinding(G678_SHARED_CATALOG_PATH),
      jsonBinding(G678_SHARED_PROFILE_PATH),
      jsonBinding('catalog/product-bridge-calibrations/' +
        'g678-final354-private-current-js-registry-witness-v1.json'),
      jsonBinding('packages/demos/private-current-js-registry.json'),
    ]);
  const liveCalibration = (liveRegistry.value as {calibrations: {
    calibrationId: string; freezeManifest: string; entries: unknown[];
  }[]}).calibrations.find((candidate) => candidate.calibrationId ===
    'g678-16-page-product-calibration-v1');
  assert.ok(liveCalibration);
  if (liveCalibration.entries.length === 354) {
    const admission = await checkG678CurrentFinal354Admission();
    assert.equal(admission.historicalFinal354FinalizerInvoked, false);
  } else {
    assert.equal(liveCalibration.entries.length, 377);
    // Test the immutable witness boundary directly as well as the full dated
    // checker. Its old bridge-inverse proof now fails earlier on V2/V3; that
    // is expected fail-closed behavior, not current final354 admission.
    assert.throws(() => assertCurrentFinal354LiveRegistry({
      liveRegistryBytes: Buffer.from(JSON.stringify(liveRegistry.value, null, 2) + '\n'),
      witnessBytes: Buffer.from(JSON.stringify(privateRegistry.value, null, 2) + '\n'),
    }), /^Error: current final354 live registry is not the immutable witness$/u);
    const instructionalSuccessor = [
      'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v2.json',
      'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v3.json',
    ].includes(liveCalibration.freezeManifest);
    await assert.rejects(checkG678CurrentFinal354Admission(),
      instructionalSuccessor
        ? /^Error: final354 bridge exact inverse did not reconstruct the predecessor$/u
        : /^Error: current final354 live registry is not the immutable witness$/u);
    assert.equal(freeze.value.registrationCandidatePlacementCount, 377);
    return;
  }
  const aggregateBrowser = await jsonBinding((freeze.value as {
    inputs: {browserProductEvidence: {path: string}};
  }).inputs.browserProductEvidence.path);
  const finalFreezeSha256 = freeze.sha256;
  const authorityDeclarations =
    (freeze.value as {inputs: {selectionAuthorities: readonly {
      readonly path: string;
    }[]}}).inputs.selectionAuthorities;
  const selectionAuthorities = await Promise.all(authorityDeclarations.map(
    (declaration) => jsonBinding(declaration.path)));
  const calibration = privateRegistry.value.calibrations.find(
    (candidate: {calibrationId?: string}) =>
      candidate.calibrationId === 'g678-16-page-product-calibration-v1');
  assert.ok(calibration);
  const entries = new Map(calibration.entries.map((entry: {
    key: string;
  }) => [entry.key, entry]));
  const registry = {
    hasModule: (animationId: string) => entries.has(animationId),
    registrationFor: (animationId: string) => {
      const entry = entries.get(animationId) as {
        artifacts: {
          module: {sha256: string};
          runtime: {sha256: string};
          timeline: {sha256: string};
        };
        maturity: string;
      } | undefined;
      return entry ? Object.freeze({
        scope: 'private-engineering' as const,
        maturity: entry.maturity,
        deploymentScope: 'local-only' as const,
        calibrationId: 'g678-16-page-product-calibration-v1',
        freezeManifestSha256: finalFreezeSha256,
        moduleSha256: entry.artifacts.module.sha256,
        runtimeSha256: entry.artifacts.runtime.sha256,
        timelineSha256: entry.artifacts.timeline.sha256,
      }) : undefined;
    },
  };
  const snapshot = buildG678PartialCalibrationSnapshot({
    browserEvidence: aggregateBrowser,
    catalog,
    freeze,
    profile,
    registry,
    selectionAuthorities,
  } as never);
  assert.equal(snapshot.status, 'ready');
  assert.equal(snapshot.registeredPlacementCount, 354);
  assert.equal(snapshot.descriptors.length, 44);
  assert.equal(snapshot.runtimeAssets.length, 354);
  assert.equal(snapshot.maintainedDomRenderers.length, 0);
  const algL11 = snapshot.descriptors.find((descriptor) =>
    descriptor.productBridge.selectedAnimationIds.includes(
      'shared-alg001-l11-p001'));
  assert.equal(algL11?.pages.length, 44);
  assert.equal(algL11?.productBridge.registeredAnimationCount, 21);

  assert.throws(() => buildG678PartialCalibrationSnapshot({
    browserEvidence: aggregateBrowser,
    catalog,
    freeze,
    profile,
    registry: {...registry, registrationFor: (animationId: string) => {
      const registration = registry.registrationFor(animationId);
      return registration ? {...registration,
        freezeManifestSha256: '0'.repeat(64)} : undefined;
    }},
    selectionAuthorities,
  } as never), /G678_CALIBRATION_REGISTRATION_INVALID/u);
});
