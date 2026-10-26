import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {localOnlyAnimationModuleRegistration} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import {
  ALG_L12_P001_ID,
  algL12P001Canvas,
  algL12P001Descriptor,
  readAlgL12P001Packet,
} from '../lib/g678-alg-l12-p001.server';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

test('L12 first placement is source-bound and adds exactly one My Lesson registration', () => {
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE_ROOT);
  const packet = readAlgL12P001Packet();
  const descriptor = algL12P001Descriptor();
  const first = descriptor.pages[0]!;
  const asset = algL12P001Canvas();
  const registration = localOnlyAnimationModuleRegistration(ALG_L12_P001_ID);
  assert.equal(descriptor.course.moduleCode, 'ALG001');
  assert.equal(descriptor.course.lesson, 12);
  assert.equal(descriptor.pages.length, 52);
  assert.equal(descriptor.productBridge.registeredAnimationCount, 15);
  assert.equal(first.animationId, ALG_L12_P001_ID);
  assert.equal(first.rendererAvailability.kind, 'registered');
  assert.equal(first.source.assetId, `swf-${packet.source.sha256}`);
  assert.equal(packet.selectedPages[0]?.runtime.frameCount, 130);
  assert.equal(asset.bytes.length, 117132);
  assert.equal(digest(asset.bytes), registration?.runtimeSha256);
  assert.equal(packet.productCalibrationPassed, false);
  assert.equal(packet.acceptanceEffects.audioAccepted, false);
  assert.equal(packet.acceptanceEffects.strictComplete, false);
});

test('L12 local-only routes retain production and same-origin guards', () => {
  const route = readFileSync(new URL(
    '../app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p001/page.tsx',
    import.meta.url), 'utf8');
  assert.match(route, /process\.env\.NODE_ENV === 'production'/u);
  assert.match(route, /isG678LocalPreviewRequestHeaders/u);
  const assetRoute = readFileSync(new URL(
    '../app/flash-assets/g678-local/shared-alg001-l12-p001/canvas-renderer.js/route.ts',
    import.meta.url), 'utf8');
  assert.match(assetRoute, /isG678LocalPreviewRequestUrl/u);
  assert.match(assetRoute, /isG678SameOriginCanvasAssetRequest/u);
});
