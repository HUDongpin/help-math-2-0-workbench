import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {localOnlyAnimationModuleRegistration} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import {algL12P011Descriptor} from '../lib/g678-alg-l12-p011.server';
import {ALG_L12_P002_CALIBRATION, ALG_L12_P002_FREEZE,
  ALG_L12_P002_ID, algL12P002Canvas, algL12P002Descriptor,
  extendAlgL12P002Descriptor, readAlgL12P002Packet} from
  '../lib/g678-alg-l12-p002.server';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

test('P002 freeze binds physical source and canonical candidate-v2 runtime', () => {
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE_ROOT);
  const packet = readAlgL12P002Packet();
  const page = packet.selectedPages[0]!;
  const asset = algL12P002Canvas();
  assert.equal(page.globalPageOrdinal, 2);
  assert.equal(page.runtime.frameDomain, 'sprite-454');
  assert.equal(page.runtime.frameCount, 1951);
  assert.equal(page.runtime.audioPlaybackEnabled, false);
  assert.equal(asset.bytes.length, 23587892);
  assert.equal(digest(asset.bytes),
    '993722d3cf0c30601805005fe8b750cecf50620a9b6692f5628f342184b4a3e4');
  assert.equal(packet.entry.artifacts.runtime.sha256, digest(asset.bytes));
  assert.equal(packet.productCalibrationPassed, false);
  assert.equal(packet.acceptanceEffects.audioAccepted, false);
  assert.equal(packet.acceptanceEffects.strictComplete, false);
});

test('P002 proposed descriptor adds only page 2 and preserves P011 glossary', () => {
  const packet = readAlgL12P002Packet();
  const base = algL12P011Descriptor();
  const p011Registration = localOnlyAnimationModuleRegistration('shared-alg001-l12-p011');
  assert.ok(p011Registration);
  const proposedRegistration = {...p011Registration,
    calibrationId: ALG_L12_P002_CALIBRATION,
    freezeManifestSha256: ALG_L12_P002_FREEZE.sha256,
    moduleSha256: packet.entry.artifacts.module.sha256,
    timelineSha256: packet.entry.artifacts.timeline.sha256,
    runtimeSha256: packet.entry.artifacts.runtime.sha256};
  const descriptor = extendAlgL12P002Descriptor(base, packet, proposedRegistration);
  assert.equal(descriptor.pages.length, 52);
  assert.equal(descriptor.productBridge.registeredAnimationCount, 17);
  assert.equal(descriptor.pages[1]?.rendererAvailability.kind, 'registered');
  assert.equal(descriptor.pages[10]?.rendererAvailability.kind, 'registered');
  assert.deepEqual(descriptor.pages.filter(page =>
    page.animationId !== ALG_L12_P002_ID), base.pages.filter(page =>
    page.animationId !== ALG_L12_P002_ID));
  assert.deepEqual(descriptor.glossary, base.glossary);
  assert.deepEqual(descriptor.productBridge.selectedAnimationIds.filter(id =>
    id !== ALG_L12_P002_ID), base.productBridge.selectedAnimationIds);
  const actual = localOnlyAnimationModuleRegistration(ALG_L12_P002_ID);
  if (actual) assert.equal(algL12P002Descriptor().productBridge.registeredAnimationCount, 17);
  else assert.throws(() => algL12P002Descriptor(), /actual private module registration/u);
});

test('P002 routes are local-only, silent, same-origin and noindex', () => {
  const route = readFileSync(new URL(
    '../app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p002/page.tsx',
    import.meta.url), 'utf8');
  assert.match(route, /process\.env\.NODE_ENV === 'production'/u);
  assert.match(route, /isG678LocalPreviewRequestHeaders/u);
  assert.match(route, /robots: \{index: false/u);
  const player = readFileSync(new URL(
    '../app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p002/player.tsx',
    import.meta.url), 'utf8');
  assert.match(player, /audioEnabled=\{false\}/u);
  assert.match(player, /shared-alg001-l12-p011-glossary/u);
  assert.match(player, /saved\.trigger\.focus/u);
  const assetRoute = readFileSync(new URL(
    '../app/flash-assets/g678-local/shared-alg001-l12-p002/canvas-renderer.js/route.ts',
    import.meta.url), 'utf8');
  assert.match(assetRoute, /isG678LocalPreviewRequestUrl/u);
  assert.match(assetRoute, /isG678SameOriginCanvasAssetRequest/u);
  assert.match(assetRoute, /query\.length !== 1/u);
  assert.match(assetRoute, /noindex, nofollow, noarchive/u);
});
