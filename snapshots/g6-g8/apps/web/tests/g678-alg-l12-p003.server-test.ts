import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {isDeepStrictEqual} from 'node:util';

import {localOnlyAnimationModuleRegistration} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import {algL12P004Descriptor, ALG_L12_P004_FREEZE} from
  '../lib/g678-alg-l12-p004.server';
import {ALG_L12_P003_CALIBRATION, ALG_L12_P003_FREEZE,
  ALG_L12_P003_ID, algL12P003Canvas, algL12P003Descriptor,
  extendAlgL12P003Descriptor, readAlgL12P003Packet} from
  '../lib/g678-alg-l12-p003.server';
import {isG678LocalPreviewRequestHeaders, isG678LocalPreviewRequestUrl,
  isG678SameOriginCanvasAssetRequest} from '../lib/g678-preview-policy';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_SHA = '384f7e8e269768063d8e6ca410350ccbd5c321596fd6f55d68903cc1b6d2bccb';
const RUNTIME_SHA = 'f42b2edc01881c3ec3d60a8de36da436883e6befa8d066fb673592c4c7e6874c';
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const previewEnv = {
  NODE_ENV: 'development', HELP_MATH_G678_LOCAL_PREVIEW: '1',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1',
};

test('P003 source, custody runtime, and actual four-layer candidate are exact', () => {
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE_ROOT);
  const source = readFileSync(`${SOURCE_ROOT}/G6-G8-shared/ALG001/L12/RW/L12RW03.swf`);
  assert.equal(source.length, 439040);
  assert.equal(digest(source), SOURCE_SHA);
  const runtime = readFileSync(new URL(
    '../../../work/g678-shared-page-factory/g678-alg-l12-p003-current-js-v1/members/shared-alg001-l12-p003/canvas-renderer.js',
    import.meta.url));
  assert.equal(runtime.length, 8757124);
  assert.equal(digest(runtime), RUNTIME_SHA);
  const candidate = JSON.parse(readFileSync(new URL(
    '../../../migrations/shared-alg001-l12-p003/candidate-v1/adapter-manifest.json',
    import.meta.url), 'utf8'));
  assert.equal(candidate.animationId, ALG_L12_P003_ID);
  assert.equal(candidate.sourceSha256, SOURCE_SHA);
  assert.equal(candidate.runtimeSha256, RUNTIME_SHA);
  assert.equal(candidate.runtimeBytes, runtime.length);
  assert.equal(candidate.composition.rootFrame, 6);
  assert.deepEqual(candidate.composition.layers.map((layer: {
    objectID: string; depth: string;
  }) => [layer.objectID, layer.depth]), [
    ['2', '1'], ['164', '2'], ['166', '146'], ['167', '148'],
  ]);
  assert.equal(candidate.composition.nestedSprite22,
    'source-exported single-frame child retained inside sprite164');
  assert.equal(candidate.acceptanceEffects.currentJavaScriptRegistered, false);
  assert.equal(candidate.acceptanceEffects.audioAccepted, false);
});

test('P003 six glossary requests merge into corrected P004 without replacing prior terms', () => {
  const base = algL12P004Descriptor();
  assert.equal(base.pages.length, 52);
  assert.equal(base.productBridge.registeredAnimationCount, 18);
  assert.equal(base.glossary.length, 31);
  assert.equal(base.source.candidateFreezeManifestSha256, ALG_L12_P004_FREEZE.sha256);
  assert.equal(base.pages[2]?.labels.en.text, 'Page 2');
  assert.equal(base.pages[2]?.rendererAvailability.kind, 'unavailable');
  const source = JSON.parse(readFileSync(new URL(
    '../../../migrations/shared-alg001-l12-p003/audit/source-glossary-v1.json',
    import.meta.url), 'utf8'));
  assert.deepEqual(source.buttonSources.map((item: {
    characterId: number; requestedSourceKey: string;
  }) => [item.characterId, item.requestedSourceKey]), [
    [150, 'Graph'], [151, 'Relation'], [156, 'Function'],
    [157, 'Equation'], [161, 'Linear equation'], [162, 'Linear function'],
  ]);
  assert.equal(source.entries.length, 6);
  const newIds: string[] = [];
  for (const entry of source.entries) {
    const normalized = {id: entry.id, sourceKeyAttribute: entry.sourceKeyAttribute,
      labels: entry.labels, definitions: entry.definitions, source: entry.source};
    const prior = base.glossary.find(item => item.id === entry.id);
    if (prior) assert.ok(isDeepStrictEqual(prior, normalized), entry.id);
    else newIds.push(entry.id);
  }
  assert.deepEqual(newIds, ['linear-equation', 'linear-function', 'relation']);
  assert.equal(new Set([...base.glossary.map(item => item.id), ...newIds]).size, 34);
  assert.equal(source.originalHostLookupVerified, false);
  assert.equal(source.companionMediaVerified, false);
});

test('P003 exact final freeze requires matching actual private registration', () => {
  assert.ok(ALG_L12_P003_FREEZE.bytes > 0);
  assert.match(ALG_L12_P003_FREEZE.sha256, /^[a-f0-9]{64}$/u);
  const packet = readAlgL12P003Packet();
  const page = packet.selectedPages[0]!;
  assert.equal(packet.predecessor.freezeManifestSha256, ALG_L12_P004_FREEZE.sha256);
  assert.equal(packet.predecessor.registeredAnimationCount, 18);
  assert.equal(page.globalPageOrdinal, 3);
  assert.equal(page.runtime.frameDomain, 'sprite-164');
  assert.equal(page.runtime.frameCount, 1008);
  assert.equal(page.runtime.audioPlaybackEnabled, false);
  assert.equal(digest(algL12P003Canvas().bytes), RUNTIME_SHA);
  assert.equal(packet.productCalibrationPassed, false);
  assert.equal(packet.acceptanceEffects.strictComplete, false);
  const base = algL12P004Descriptor();
  const p004Registration = localOnlyAnimationModuleRegistration('shared-alg001-l12-p004');
  assert.ok(p004Registration);
  const proposedRegistration = {...p004Registration,
    calibrationId: ALG_L12_P003_CALIBRATION,
    freezeManifestSha256: ALG_L12_P003_FREEZE.sha256,
    moduleSha256: packet.entry.artifacts.module.sha256,
    timelineSha256: packet.entry.artifacts.timeline.sha256,
    runtimeSha256: RUNTIME_SHA};
  const descriptor = extendAlgL12P003Descriptor(base, packet, proposedRegistration);
  assert.throws(() => extendAlgL12P003Descriptor({
    ...base, source: {...base.source, candidateFreezeManifestSha256: SOURCE_SHA},
  }, packet, proposedRegistration), /P004 corrected-v2 predecessor/u);
  assert.equal(descriptor.productBridge.registeredAnimationCount, 19);
  assert.equal(descriptor.pages[2]?.rendererAvailability.kind, 'registered');
  assert.equal(descriptor.pages[2]?.presentation?.pageInteractionCompanionTargetIdSuffix,
    'p003-glossary-controls');
  assert.deepEqual(descriptor.pages.filter(item => item.animationId !== ALG_L12_P003_ID),
    base.pages.filter(item => item.animationId !== ALG_L12_P003_ID));
  assert.deepEqual(descriptor.glossary.slice(0, 31), base.glossary);
  assert.deepEqual(descriptor.glossary.slice(31).map(item => item.id),
    ['linear-equation', 'linear-function', 'relation']);
  const actual = localOnlyAnimationModuleRegistration(ALG_L12_P003_ID);
  if (actual) assert.equal(algL12P003Descriptor().productBridge.registeredAnimationCount, 19);
  else assert.throws(() => algL12P003Descriptor(), /actual private module registration/u);
});

test('P003 page and canvas remain loopback-only, production-negative, and noindex', () => {
  const page = readFileSync(new URL(
    '../app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p003/page.tsx',
    import.meta.url), 'utf8');
  assert.match(page, /process\.env\.NODE_ENV === 'production'/u);
  assert.match(page, /isG678LocalPreviewRequestHeaders/u);
  assert.match(page, /robots: \{index: false/u);
  const player = readFileSync(new URL(
    '../app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p003/player.tsx',
    import.meta.url), 'utf8');
  assert.match(player, /audioEnabled=\{false\}/u);
  assert.match(player, /button\[data-source-character-id\]/u);
  assert.match(player, /saved\.opened && !saved\.trigger\.disabled/u);
  assert.match(player, /saved\.trigger\.focus/u);
  for (const characterId of [150, 151, 156, 157, 161, 162]) {
    assert.match(player, new RegExp(`'${characterId}':`, 'u'));
  }
  const assetRoute = readFileSync(new URL(
    '../app/flash-assets/g678-local/shared-alg001-l12-p003/canvas-renderer.js/route.ts',
    import.meta.url), 'utf8');
  assert.match(assetRoute, /isG678LocalPreviewRequestUrl/u);
  assert.match(assetRoute, /isG678SameOriginCanvasAssetRequest/u);
  assert.match(assetRoute, /query\.length !== 1/u);
  assert.match(assetRoute, /noindex, nofollow, noarchive/u);
  const url = new URL('http://127.0.0.1:3134/flash-assets/g678-local/shared-alg001-l12-p003/canvas-renderer.js');
  const headers = new Headers({host: '127.0.0.1:3134',
    referer: 'http://127.0.0.1:3134/en/migration-status/g678-calibration/shared-alg001-l12-p003',
    origin: 'http://127.0.0.1:3134', 'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'script'});
  assert.ok(isG678LocalPreviewRequestUrl(url, previewEnv));
  assert.ok(isG678LocalPreviewRequestHeaders(headers, previewEnv));
  assert.ok(isG678SameOriginCanvasAssetRequest(headers, url));
  assert.equal(isG678LocalPreviewRequestUrl(url, {...previewEnv, NODE_ENV: 'production'}), false);
  assert.equal(isG678LocalPreviewRequestHeaders(headers,
    {...previewEnv, NODE_ENV: 'production'}), false);
  assert.equal(isG678LocalPreviewRequestUrl(new URL('https://helpmath.ai'), previewEnv), false);
  assert.equal(isG678SameOriginCanvasAssetRequest(new Headers({
    ...Object.fromEntries(headers), 'sec-fetch-site': 'cross-site',
  }), url), false);
  assert.equal(isG678SameOriginCanvasAssetRequest(new Headers({
    ...Object.fromEntries(headers), 'sec-fetch-dest': 'document',
  }), url), false);
});
