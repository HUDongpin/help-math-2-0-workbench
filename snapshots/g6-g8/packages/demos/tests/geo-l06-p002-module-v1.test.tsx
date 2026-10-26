import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import type {AnimationModule} from '../src/contract';

const built = await build({entryPoints: [fileURLToPath(new URL(
  '../src/modules/g678-geo-l06-source-area-p002.tsx', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
  loader: {'.css': 'empty'}});
const moduleObject: {exports: {default?: AnimationModule}} = {exports: {}};
new Function('require', 'module', 'exports', built.outputFiles[0]!.text)(
  createRequire(import.meta.url), moduleObject, moduleObject.exports);
const module = moduleObject.exports.default!;

test('private module declares the true root and independent child frame domains', () => {
  assert.equal(module.key, 'shared-geo001-l06-p002');
  assert.equal(module.maturity, 'private-current-js');
  assert.equal(module.movie.frameCount, 10);
  assert.equal(module.runtime?.defaultFrameDomain, 'sprite-230');
  assert.deepEqual(module.runtime?.frameDomains?.map(domain =>
    [domain.id, domain.frameCount]), [['root', 10], ['sprite-230', 1216]]);
  assert.equal(module.playbackEndFrameByDomain?.root, 1);
  assert.equal(module.playbackEndFrameByDomain?.['sprite-230'], 1216);
  assert.equal(module.reducedMotionFrame, 987);
  assert.deepEqual(module.lessonHost?.capabilities, ['glossary']);
  assert.deepEqual(module.audioCues, []);
});

test('module frame queries do not borrow the nested clock for root frames', () => {
  const context = {frame: 6, scenario: 'default', lang: 'en' as const, seed: 0, replay: 2};
  const root = module.getFrameState(6, {...context, frameDomain: 'root'}) as
    {frameDomain: string; mainSpriteFrame: number | null};
  const main = module.getFrameState(6, {...context, frameDomain: 'sprite-230'}) as
    {frameDomain: string; audioBlock: unknown};
  assert.equal(root.frameDomain, 'root');
  assert.equal(root.mainSpriteFrame, null);
  assert.equal(main.frameDomain, 'sprite-230');
  assert.equal(main.audioBlock, null);
});
