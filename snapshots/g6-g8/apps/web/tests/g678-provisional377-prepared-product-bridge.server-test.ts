import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {prepareG678AlgL11Remaining23Provisional377Registration} from
  '../../../scripts/finalize-g678-alg-l11-remaining23-provisional377-registration.mjs';

process.env.HELP_MATH_G678_CALIBRATION_PHASE =
  'alg-l11-remaining23-provisional-browser-qa';

const bridge = await import('../lib/g678-calibration-product-bridge.server');
const sha256 = (bytes: Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex');

async function jsonBinding(relativePath: string) {
  const bytes = await readFile(new URL(`../../../${relativePath}`,
    import.meta.url));
  return Object.freeze({path: relativePath, bytes: bytes.length,
    sha256: sha256(bytes), value: JSON.parse(bytes.toString('utf8'))});
}

test('prepared provisional377 projects exact 354 canvas and 23 maintained DOM records', async () => {
  const [artifacts, catalog, profile, privateRegistry] = await Promise.all([
    prepareG678AlgL11Remaining23Provisional377Registration(),
    jsonBinding(bridge.G678_SHARED_CATALOG_PATH),
    jsonBinding(bridge.G678_SHARED_PROFILE_PATH),
    jsonBinding('packages/demos/private-current-js-registry.json'),
  ]);
  assert.equal(bridge.G678_CALIBRATION_FREEZE_PATH,
    bridge.G678_ALG_L11_REMAINING23_PROVISIONAL_CALIBRATION_FREEZE_PATH);
  const freezeSha256 = sha256(artifacts.freezeBytes);
  const authorityDeclarations = artifacts.freeze.inputs.selectionAuthorities as
    readonly {readonly path: string}[];
  const selectionAuthorities = await Promise.all(authorityDeclarations.map(
    (declaration) => jsonBinding(declaration.path)));
  const entries = new Map(artifacts.fragment.calibration.entries.map((entry) =>
    [entry.key, entry]));
  const predecessorCalibration = (privateRegistry.value as {
    calibrations: {calibrationId: string; entries: unknown[]}[];
  }).calibrations.find((candidate) => candidate.calibrationId ===
    'g678-16-page-product-calibration-v1');
  assert.ok(predecessorCalibration);
  const predecessorEntries = new Map(predecessorCalibration.entries.map(
    (entry) => [(entry as {key: string}).key, entry]));
  const registry = {
    hasModule: (animationId: string) => entries.has(animationId),
    registrationFor: (animationId: string) => {
      const entry = entries.get(animationId);
      if (!entry) return undefined;
      const provenance = entry.artifacts ??
        (predecessorEntries.get(animationId) as typeof entry).artifacts;
      return Object.freeze({scope: 'private-engineering' as const,
        maturity: entry.maturity, deploymentScope: 'local-only' as const,
        calibrationId: 'g678-16-page-product-calibration-v1',
        freezeManifestSha256: freezeSha256,
        moduleSha256: provenance.module.sha256,
        timelineSha256: provenance.timeline.sha256,
        ...(provenance.kind === 'maintained-dom-module-v1'
          ? {rendererBindingKind: 'maintained-dom-module-v1' as const,
              memberManifestSha256: provenance.memberManifest.sha256,
              sourceRunSha256: provenance.sourceRun.sha256}
          : {runtimeSha256: provenance.runtime.sha256})});
    },
  };
  const freeze = Object.freeze({
    path: bridge.G678_CALIBRATION_FREEZE_PATH,
    bytes: artifacts.freezeBytes.length,
    sha256: freezeSha256,
    value: artifacts.freeze,
  });
  const snapshot = bridge.buildG678PartialCalibrationSnapshot({catalog,
    freeze, profile, registry, selectionAuthorities} as never);
  assert.equal(snapshot.status, 'ready');
  assert.equal(snapshot.registeredPlacementCount, 377);
  assert.equal(snapshot.descriptors.length, 44);
  assert.equal(snapshot.runtimeAssets.length, 354);
  assert.equal(snapshot.maintainedDomRenderers.length, 23);
  assert.equal(new Set(snapshot.maintainedDomRenderers.map((item) =>
    item.animationId)).size, 23);
  assert.equal(snapshot.runtimeAssets.some((item) =>
    item.animationId === 'shared-alg001-l11-p006'), false);
  const algL11 = snapshot.descriptors.find((descriptor) =>
    descriptor.productBridge.selectedAnimationIds.includes(
      'shared-alg001-l11-p006'));
  assert.equal(algL11?.pages.length, 44);
  assert.equal(algL11?.productBridge.registeredAnimationCount, 44);
  assert.deepEqual(algL11?.support.lessonHostCapabilities,
    ['glossary', 'navigation', 'practice-feedback', 'fq-scoring']);

  assert.throws(() => bridge.buildG678PartialCalibrationSnapshot({catalog,
    freeze, profile, selectionAuthorities,
    registry: {...registry, registrationFor: (animationId: string) => {
      const registration = registry.registrationFor(animationId);
      return animationId === 'shared-alg001-l11-p006' && registration
        ? {...registration, runtimeSha256: '0'.repeat(64)}
        : registration;
    }}} as never), /G678_CALIBRATION_REGISTRATION_INVALID/u);

  const copiedAuthorities = selectionAuthorities.map((authority) =>
    authority.path.endsWith('interactive10-tranche-c-current-js-v1.fragment.json')
      ? {...authority, value: {...authority.value,
          entries: [...(authority.value as {entries: unknown[]}).entries]
            .reverse()}}
      : authority);
  assert.throws(() => bridge.buildG678PartialCalibrationSnapshot({catalog,
    freeze, profile, registry, selectionAuthorities: copiedAuthorities} as never),
  /G678_CALIBRATION_ALG_L11_MAINTAINED_DOM_AUTHORITY_INVALID/u);

  const crossedFreezeValue = structuredClone(artifacts.freeze);
  const interactive = crossedFreezeValue.selectedPages.find((page) =>
    page.animationId === 'shared-alg001-l11-p006');
  const behavior = crossedFreezeValue.selectedPages.find((page) =>
    page.animationId === 'shared-alg001-l11-p026');
  assert.ok(interactive && behavior);
  [interactive.adapterFamily, behavior.adapterFamily] =
    [behavior.adapterFamily, interactive.adapterFamily];
  const crossedBytes = Buffer.from(`${JSON.stringify(crossedFreezeValue)}\n`);
  const crossedSha256 = sha256(crossedBytes);
  const crossedFreeze = {...freeze, bytes: crossedBytes.length,
    sha256: crossedSha256, value: crossedFreezeValue};
  const crossedRegistry = {...registry,
    registrationFor: (animationId: string) => {
      const registration = registry.registrationFor(animationId);
      return registration ? {...registration,
        freezeManifestSha256: crossedSha256} : undefined;
    }};
  assert.throws(() => bridge.buildG678PartialCalibrationSnapshot({catalog,
    freeze: crossedFreeze, profile, registry: crossedRegistry,
    selectionAuthorities} as never),
  /G678_CALIBRATION_REGISTRATION_INVALID/u);
});
