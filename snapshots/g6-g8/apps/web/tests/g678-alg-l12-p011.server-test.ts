import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {localOnlyAnimationModuleRegistration} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import {algL12P001Descriptor, ALG_L12_P001_ID} from
  '../lib/g678-alg-l12-p001.server';
import {
  ALG_L12_P011_CALIBRATION,
  ALG_L12_P011_FREEZE,
  ALG_L12_P011_ID,
  algL12P011Canvas,
  algL12P011Descriptor,
  extendAlgL12P011Descriptor,
  readAlgL12P011Packet,
} from '../lib/g678-alg-l12-p011.server';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

test('P011 freeze binds the physical source and canonical candidate-v2 runtime', () => {
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE_ROOT);
  const packet = readAlgL12P011Packet();
  const page = packet.selectedPages[0]!;
  const asset = algL12P011Canvas();
  assert.equal(page.globalPageOrdinal, 11);
  assert.equal(page.sectionCode, 'VB');
  assert.equal(page.sectionPageOrdinal, 5);
  assert.equal(page.runtime.frameDomain, 'sprite-33');
  assert.equal(page.runtime.frameCount, 118);
  assert.equal(asset.bytes.length, 884739);
  assert.equal(digest(asset.bytes),
    '70bab6fd85db2afa782f987a241aef0abbf6deb5b98bffcca1146b440c541031');
  assert.equal(packet.entry.artifacts.runtime.sha256, digest(asset.bytes));
  assert.equal(packet.productCalibrationPassed, false);
  assert.equal(packet.acceptanceEffects.audioAccepted, false);
  assert.equal(packet.acceptanceEffects.strictComplete, false);
});

test('P011 descriptor preparation adds only page 11 and the two missing source terms', () => {
  const packet = readAlgL12P011Packet();
  const base = algL12P001Descriptor();
  const p001Registration = localOnlyAnimationModuleRegistration(ALG_L12_P001_ID);
  assert.ok(p001Registration);
  // Exercise the descriptor extension before the main agent admits P011.
  const proposedRegistration = {...p001Registration,
    calibrationId: ALG_L12_P011_CALIBRATION,
    freezeManifestSha256: ALG_L12_P011_FREEZE.sha256,
    moduleSha256: packet.entry.artifacts.module.sha256,
    timelineSha256: packet.entry.artifacts.timeline.sha256,
    runtimeSha256: packet.entry.artifacts.runtime.sha256};
  const descriptor = extendAlgL12P011Descriptor(base, packet,
    proposedRegistration);
  assert.equal(descriptor.pages.length, 52);
  assert.equal(descriptor.productBridge.registeredAnimationCount, 16);
  assert.equal(descriptor.pages[0]?.rendererAvailability.kind, 'registered');
  assert.equal(descriptor.pages[10]?.animationId, ALG_L12_P011_ID);
  assert.equal(descriptor.pages[10]?.rendererAvailability.kind, 'registered');
  assert.equal(descriptor.pages[10]?.presentation?.pageInteractionCompanionTargetIdSuffix,
    'origin-glossary-controls');
  assert.deepEqual(descriptor.pages.filter(page =>
    page.animationId !== ALG_L12_P011_ID), base.pages.filter(page =>
    page.animationId !== ALG_L12_P011_ID));
  assert.deepEqual(descriptor.glossary.slice(0, base.glossary.length),
    base.glossary);
  assert.deepEqual(descriptor.glossary.slice(base.glossary.length)
    .map(entry => entry.id), ['origin', 'intersect']);
  for (const control of packet.sourceGlossary.controls) {
    assert.equal(descriptor.glossary.find(entry =>
      entry.id === control.entryId)?.sourceKeyAttribute,
    control.sourceKeyAttribute);
  }
  const actual = localOnlyAnimationModuleRegistration(ALG_L12_P011_ID);
  if (actual) assert.equal(algL12P011Descriptor().productBridge.registeredAnimationCount, 16);
  else assert.throws(() => algL12P011Descriptor(), /actual private module registration/u);
});

test('P011 local-only routes retain production, origin and noindex guards', () => {
  const route = readFileSync(new URL(
    '../app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p011/page.tsx',
    import.meta.url), 'utf8');
  assert.match(route, /process\.env\.NODE_ENV === 'production'/u);
  assert.match(route, /isG678LocalPreviewRequestHeaders/u);
  assert.match(route, /robots: \{index: false/u);
  const assetRoute = readFileSync(new URL(
    '../app/flash-assets/g678-local/shared-alg001-l12-p011/canvas-renderer.js/route.ts',
    import.meta.url), 'utf8');
  assert.match(assetRoute, /isG678LocalPreviewRequestUrl/u);
  assert.match(assetRoute, /isG678SameOriginCanvasAssetRequest/u);
  assert.match(assetRoute, /query\.length !== 1/u);
  assert.match(assetRoute, /noindex, nofollow, noarchive/u);
});
