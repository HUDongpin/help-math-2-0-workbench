import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  assertFinal354BridgeExactInverse,
  EXPECTED_FINAL354_BRIDGE,
  prepareG678Final354CurrentBridgeSuccessorCompatibility,
  reconstructFinal354ProductBridge,
} from './audit-g678-final354-current-bridge-successor-compatibility.mjs';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

test('current product bridge exact-inverses to the final354 predecessor', async () => {
  const source = await readFile(new URL(
    '../apps/web/lib/g678-calibration-product-bridge.server.ts',
    import.meta.url), 'utf8');
  const reconstructed = reconstructFinal354ProductBridge(source);
  assert.equal(Buffer.byteLength(reconstructed), EXPECTED_FINAL354_BRIDGE.bytes);
  assert.equal(sha256(reconstructed), EXPECTED_FINAL354_BRIDGE.sha256);
  assert.equal(assertFinal354BridgeExactInverse(source).length,
    EXPECTED_FINAL354_BRIDGE.bytes);
  assert.throws(() => assertFinal354BridgeExactInverse(
    `${source}\n// unauthorized bridge change\n`),
  /did not reconstruct the predecessor/u);
  assert.throws(() => reconstructFinal354ProductBridge(source.replace(
    'PROVISIONAL377_BRIDGE_END: maintained-dom-registration',
    'PROVISIONAL377_BRIDGE_END: substituted-registration')),
  /marker set drifted|exact inverse drifted/u);
});

test('successor authority preserves final354 and requires exact104 replay', async () => {
  const {artifact} =
    await prepareG678Final354CurrentBridgeSuccessorCompatibility();
  assert.equal(artifact.final354Compatibility.exactDescriptorInvariantCount,
    354);
  assert.equal(artifact.final354Compatibility
    .historicalProductHostCalibratedPlacementCount, 138);
  assert.equal(artifact.final354Compatibility.currentHostBrowserRevalidated,
    false);
  assert.equal(artifact.requiredProvisional377BrowserAssertions
    .predecessorSamplesMustBeReplayed, true);
  assert.equal(artifact.requiredProvisional377BrowserAssertions
    .predecessorReplayCount, 104);
  assert.equal(artifact.requiredProvisional377BrowserAssertions
    .exactMaintainedDomRendererCount, 23);
  assert.equal(Object.values(artifact.acceptanceEffects).every((value) =>
    value === false), true);
});
