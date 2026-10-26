import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  hasLocalOnlyAnimationModule,
  loadLocalOnlyAnimationModule,
  localOnlyAnimationModuleRegistration,
  registeredLocalOnlyAnimationKeys,
} from '../lib/g678-local-only-registry.production-stub';
import {g678PartialCalibrationSnapshot} from
  '../lib/g678-calibration-product-bridge.server';
test('G678 production client registry is an exact empty stub', async () => {
  assert.deepEqual(registeredLocalOnlyAnimationKeys, []);
  assert.equal(hasLocalOnlyAnimationModule('shared-alg001-l11-p001'), false);
  assert.equal(localOnlyAnimationModuleRegistration(
    'shared-alg001-l11-p001'), undefined);
  assert.equal(await loadLocalOnlyAnimationModule(
    'shared-alg001-l11-p001'), undefined);
});

test('G678 production server source returns the exact closed projection',
  async () => {
    const source = await readFile(new URL(
      '../lib/g678-calibration-product-bridge.server.ts', import.meta.url),
    'utf8');
    const emptySnapshot = source.match(/function emptySnapshot\([\s\S]*?\n\}/u);
    assert.ok(emptySnapshot);
    for (const required of [
      'descriptors: Object.freeze([])',
      'registeredPlacementCount: 0',
      'registrationStatus: null',
      'runtimeAssets: Object.freeze([])',
      'maintainedDomRenderers: Object.freeze([])',
      'scaleOutAuthorized: false',
    ]) assert.match(emptySnapshot[0], new RegExp(required
      .replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
    assert.match(source,
      /process\.env\.NODE_ENV === 'production'[\s\S]*?return emptySnapshot\('production-closed', null\)/u);
    const snapshotSource = source.slice(source.indexOf(
      'export function g678PartialCalibrationSnapshot()'));
    assert.ok(snapshotSource.indexOf(
      "process.env.NODE_ENV === 'production'") <
      snapshotSource.indexOf('const root = getWorkspaceRoot()'));
  });

test('production projection and both local registry aliases stay DOM-union closed',
  async () => {
    const environment = process.env as Record<string, string | undefined>;
    const prior = environment.NODE_ENV;
    environment.NODE_ENV = 'production';
    try {
      const snapshot = g678PartialCalibrationSnapshot();
      assert.equal(snapshot.status, 'production-closed');
      assert.equal(snapshot.registeredPlacementCount, 0);
      assert.deepEqual(snapshot.runtimeAssets, []);
      assert.deepEqual(snapshot.maintainedDomRenderers, []);
      assert.deepEqual(snapshot.descriptors, []);
    } finally {
      if (prior === undefined) delete environment.NODE_ENV;
      else environment.NODE_ENV = prior;
    }
    const config = await readFile(new URL('../next.config.ts', import.meta.url),
      'utf8');
    assert.match(config,
      /'@helpmath\/demos\/local-only-animation-registry'/u);
    assert.match(config,
      /'@helpmath\/demos\/local-only-animation-registry-metadata'/u);
    assert.match(config,
      /\[g678LocalOnlyRegistrySpecifier\]:\s*\n?\s*g678LocalOnlyRegistryProductionStub/u);
    assert.match(config,
      /\[g678LocalOnlyRegistryMetadataSpecifier\]:\s*\n?\s*g678LocalOnlyRegistryProductionStub/u);
  });
