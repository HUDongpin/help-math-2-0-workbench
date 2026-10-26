import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {localOnlyAnimationModuleRegistration} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import {algL12P002Descriptor} from '../lib/g678-alg-l12-p002.server';
import {ALG_L12_P004_CALIBRATION, ALG_L12_P004_FREEZE,
  ALG_L12_P004_ID, algL12P004Canvas, algL12P004Descriptor,
  extendAlgL12P004Descriptor, readAlgL12P004Packet} from
  '../lib/g678-alg-l12-p004.server';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

test('P004 freeze binds physical source and canonical silent candidate runtime', () => {
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE_ROOT);
  const packet = readAlgL12P004Packet();
  const page = packet.selectedPages[0]!;
  const asset = algL12P004Canvas();
  assert.equal(page.globalPageOrdinal, 4);
  assert.equal(page.runtime.frameDomain, 'sprite-90');
  assert.equal(page.runtime.frameCount, 969);
  assert.equal(page.runtime.audioPlaybackEnabled, false);
  assert.equal(asset.bytes.length, 18639014);
  assert.equal(digest(asset.bytes),
    'd4cd5a861761c4548793b8f94468b5284d5a1c98a68bc99ff5267344df124d13');
  assert.equal(packet.entry.artifacts.runtime.sha256, digest(asset.bytes));
  assert.equal(packet.productCalibrationPassed, false);
  assert.equal(packet.acceptanceEffects.audioAccepted, false);
  assert.equal(packet.acceptanceEffects.strictComplete, false);
});

test('P004 proposed descriptor preserves 28 glossary entries and adds three pinned bilingual entries', () => {
  const packet = readAlgL12P004Packet();
  const base = algL12P002Descriptor();
  const p002Registration = localOnlyAnimationModuleRegistration('shared-alg001-l12-p002');
  assert.ok(p002Registration);
  const proposedRegistration = {...p002Registration,
    calibrationId: ALG_L12_P004_CALIBRATION,
    freezeManifestSha256: ALG_L12_P004_FREEZE.sha256,
    moduleSha256: packet.entry.artifacts.module.sha256,
    timelineSha256: packet.entry.artifacts.timeline.sha256,
    runtimeSha256: packet.entry.artifacts.runtime.sha256};
  const descriptor = extendAlgL12P004Descriptor(base, packet, proposedRegistration);
  assert.equal(base.pages.length, 52);
  assert.equal(base.productBridge.registeredAnimationCount, 17);
  assert.equal(base.glossary.length, 28);
  assert.equal(base.pages[3]?.animationId, ALG_L12_P004_ID);
  assert.equal(base.pages[3]?.rendererAvailability.kind, 'unavailable');
  assert.equal(descriptor.pages.length, 52);
  assert.equal(descriptor.productBridge.registeredAnimationCount, 18);
  assert.equal(descriptor.pages[3]?.rendererAvailability.kind, 'registered');
  assert.equal(descriptor.pages[3]?.presentation?.pageInteractionCompanionTargetIdSuffix, 'p004-glossary-controls');
  assert.deepEqual(descriptor.pages.filter(page =>
    page.animationId !== ALG_L12_P004_ID), base.pages.filter(page =>
    page.animationId !== ALG_L12_P004_ID));
  assert.deepEqual(descriptor.productBridge.selectedAnimationIds.filter(id =>
    id !== ALG_L12_P004_ID), base.productBridge.selectedAnimationIds);
  assert.deepEqual(descriptor.glossary.slice(0, 28), base.glossary);
  assert.equal(descriptor.glossary.length, 31);
  assert.deepEqual(descriptor.glossary.slice(28).map(entry => entry.id),
    ['function', 'graph', 'vertical-line-test']);
  const expected = new Map([
    ['vertical-line-test', 'Vertical-line test'], ['vertical', 'Vertical'],
    ['graph', 'Graph'], ['point', 'Point'], ['function', 'Function'],
  ]);
  for (const [id, key] of expected) {
    const entry = descriptor.glossary.find(item => item.id === id);
    assert.equal(entry?.sourceKeyAttribute, key);
    assert.ok(entry?.definitions.en && entry.definitions.es);
  }
  const source = JSON.parse(readFileSync(new URL(
    '../../../migrations/shared-alg001-l12-p004/audit/source-glossary-v1.json',
    import.meta.url), 'utf8'));
  const alias = source.entries.find((entry: {id: string}) =>
    entry.id === 'vertical-line-test');
  assert.equal(alias.rawScreenkeyTerm, 'vertical-line test');
  assert.equal(alias.requestedSourceKey, 'Vertical-line test');
  assert.equal(alias.sourceKeyAttribute, 'Vertical-line test');
  assert.equal(source.originalHostLookupVerified, false);
  const actual = localOnlyAnimationModuleRegistration(ALG_L12_P004_ID);
  if (actual) assert.equal(algL12P004Descriptor().productBridge.registeredAnimationCount, 18);
  else assert.throws(() => algL12P004Descriptor(), /actual private module registration/u);
});

test('P004 page and asset routes remain local-only, silent, same-origin, and noindex', () => {
  const route = readFileSync(new URL(
    '../app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p004/page.tsx',
    import.meta.url), 'utf8');
  assert.match(route, /process\.env\.NODE_ENV === 'production'/u);
  assert.match(route, /isG678LocalPreviewRequestHeaders/u);
  assert.match(route, /robots: \{index: false/u);
  const player = readFileSync(new URL(
    '../app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p004/player.tsx',
    import.meta.url), 'utf8');
  assert.match(player, /audioEnabled=\{false\}/u);
  assert.match(player, /button\[data-source-character-id\]/u);
  assert.match(player, /saved\.opened && !saved\.trigger\.disabled/u);
  assert.match(player, /'disabled'/u);
  assert.match(player, /saved\.trigger\.focus/u);
  for (const characterId of [63, 66, 67, 71, 72]) {
    assert.match(player, new RegExp(`'${characterId}':`, 'u'));
  }
  const assetRoute = readFileSync(new URL(
    '../app/flash-assets/g678-local/shared-alg001-l12-p004/canvas-renderer.js/route.ts',
    import.meta.url), 'utf8');
  assert.match(assetRoute, /isG678LocalPreviewRequestUrl/u);
  assert.match(assetRoute, /isG678SameOriginCanvasAssetRequest/u);
  assert.match(assetRoute, /query\.length !== 1/u);
  assert.match(assetRoute, /noindex, nofollow, noarchive/u);
});
