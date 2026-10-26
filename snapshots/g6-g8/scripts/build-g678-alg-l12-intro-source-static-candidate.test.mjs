import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import test from 'node:test';

const ROOT = new URL('../migrations/shared-alg001-l12-p001/candidate/', import.meta.url);
const ID = 'shared-alg001-l12-p001';

test('L12 Introduction source-static runtime stays source-bound and local-only', async () => {
  const [source, manifest, spec] = await Promise.all([
    readFile(new URL('canvas-renderer.js', ROOT), 'utf8'),
    readFile(new URL('adapter-manifest.json', ROOT), 'utf8').then(JSON.parse),
    readFile(new URL('adapter-spec.json', ROOT), 'utf8').then(JSON.parse),
  ]);
  assert.equal(manifest.animationId, ID);
  assert.equal(manifest.status, 'local-candidate-not-registered');
  assert.equal(manifest.acceptanceEffects.currentJavaScriptRegistered, false);
  assert.equal(spec.source.swfSha256,
    '393da0d6755e706bf849a2cff0796823e129fa6bc7f438b93d09c05547679b67');
  assert.equal(spec.ffdecExport.exportCanvas.width, 506);
  assert.equal(spec.timeline.local.frameCount, 130);
  assert.equal(spec.timeline.stageRenderOffset.x, 170.3);
  assert.equal(spec.timeline.stageRenderOffset.y, 268.25);
  assert.doesNotMatch(source, /shared-alg001-l11-p001/u);

  const context = {Number, Object, Promise};
  context.globalThis = context;
  runInNewContext(source, context, {filename: `${ID}-canvas-renderer.js`});
  const asset = context.HELP_MATH_CANVAS_ASSETS[ID];
  assert.equal(asset.metadata.animationId, ID);
  assert.equal(asset.metadata.sourceSwfSha256, spec.source.swfSha256);
  assert.equal(asset.metadata.deterministicContentTimeline.frameCount, 130);
  assert.equal(asset.resolveFrameState({frame: 1}).localFrame, 1);
  assert.equal(asset.resolveFrameState({frame: 130}).exportFrame, 129);
  assert.equal(asset.resolveFrameState({frame: 130}).audioRendered, false);
  assert.throws(() => asset.resolveFrameState({frame: 0}), /1\.\.130/u);
  assert.throws(() => asset.resolveFrameState({frame: 131}), /1\.\.130/u);
  assert.throws(() => asset.resolveFrameState({frame: 1, lang: 'es'}),
    /unsupported source-proven language/u);
  assert.equal(Object.getOwnPropertyDescriptor(context.HELP_MATH_CANVAS_ASSETS,
    ID).writable, false);
});
