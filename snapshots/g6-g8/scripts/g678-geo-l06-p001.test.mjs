import assert from 'node:assert/strict';
import {test} from 'node:test';
import {appendFileSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {localOnlyAnimationModuleRegistration} from '../packages/demos/src/local-only-animation-registry-metadata.ts';
import {g678PartialCalibrationSnapshot} from '../apps/web/lib/g678-calibration-product-bridge.server.ts';
import {GEO_L06_P001_ID, extendGeoL06Descriptor, geoL06P001Descriptor,
  readGeoL06P001Packet} from '../apps/web/lib/g678-geo-l06-p001.server.ts';

const packet = readGeoL06P001Packet();
const predecessor = g678PartialCalibrationSnapshot();
assert.equal(predecessor.status, 'ready');
const base = predecessor.descriptors.find(descriptor =>
  descriptor.course.moduleCode === 'GEO001' && descriptor.course.lesson === 6);
assert.ok(base);
const registration = localOnlyAnimationModuleRegistration(GEO_L06_P001_ID);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('source-ordered GEO001 L6 gains exactly its first page in the private modern host', () => {
  const descriptor = geoL06P001Descriptor();
  assert.equal(descriptor.pages.length, 54);
  assert.equal(base.productBridge.registeredAnimationCount, 7);
  assert.equal(descriptor.productBridge.registeredAnimationCount, 8);
  assert.deepEqual(descriptor.pages.slice(1), base.pages.slice(1));
  assert.equal(descriptor.pages[0].rendererAvailability.kind, 'registered');
  assert.equal(descriptor.pages[0].rendererAvailability.runtimeQuery.frameDomain, 'sprite-142');
  assert.equal(descriptor.pages[0].nextPlacementId, 'shared-geo001-l06-p002');
  assert.equal(descriptor.course.courseShellCount, 0);
  assert.ok(Object.values(descriptor.productBridge.acceptanceEffects).every(value => value === false));
  assert.equal(packet.productCalibrationPassed, false);
  assert.equal(packet.scaleOutAuthorized, false);
});

test('missing or foreign registration and changed source placement fail closed', () => {
  for (const altered of [undefined, {...registration, deploymentScope: 'bundled'},
    {...registration, moduleSha256: '0'.repeat(64)},
    {...registration, freezeManifestSha256: '0'.repeat(64)}]) {
    assert.throws(() => extendGeoL06Descriptor(base, packet, altered), /actual private registration/);
  }
  const changed = structuredClone(base);
  changed.pages[0].source.assetId = `swf-${'0'.repeat(64)}`;
  assert.throws(() => extendGeoL06Descriptor(changed, packet, registration), /first unavailable placement/);
});

test('packet rejects drift in a transitive renderer dependency', () => {
  const temporary = mkdtempSync(path.join(realpathSync(tmpdir()), 'g678-geo-l06-p001-'));
  const memberPath = packet.entry.artifacts.memberManifest.path;
  const runPath = packet.entry.artifacts.sourceRun.path;
  const freezePath = 'catalog/product-bridge-calibrations/g678-geo-l06-p001-native-current-js-v1.json';
  const member = JSON.parse(readFileSync(path.join(root, memberPath)));
  const run = JSON.parse(readFileSync(path.join(root, runPath)));
  const paths = [freezePath, memberPath, runPath,
    ...member.implementation.map(pin => pin.path), ...run.inputs.map(pin => pin.path)];
  try {
    for (const relative of new Set(paths)) {
      const target = path.join(temporary, relative);
      mkdirSync(path.dirname(target), {recursive: true});
      copyFileSync(path.join(root, relative), target);
    }
    assert.equal(readGeoL06P001Packet(temporary).entry.key, GEO_L06_P001_ID);
    appendFileSync(path.join(temporary, 'packages/demos/src/geo-l06-p001-v1.css'), '\n/* drift */\n');
    assert.throws(() => readGeoL06P001Packet(temporary), /geo-l06-p001-v1\.css/);
  } finally {
    rmSync(temporary, {recursive: true, force: true});
  }
});

test('packet is closed in production even with exact local artifacts', () => {
  const prior = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    assert.throws(() => readGeoL06P001Packet(), /production closed/);
  } finally {
    if (prior === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prior;
  }
});
