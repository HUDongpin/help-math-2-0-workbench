import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync} from 'node:fs';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {P056_DISPLAY_EVENTS, P056_DISPLAY_SOURCE} from '../generated/nms-l02-p056-display-list-v1';
import {p056SourceButtonDisplay, P056_SOURCE_BEHAVIOR} from './shared-nms002-l02-p056-source-behavior';
import {p056SourceSpriteFrame} from './shared-nms002-l02-p056-display-list';

test('P056 compact IR retains the exact 234-frame source domain and root placement', () => {
  assert.equal(P056_DISPLAY_SOURCE.sourceSwfSha256, P056_SOURCE_BEHAVIOR.swfSha256);
  assert.equal(P056_DISPLAY_SOURCE.frameDomain, 'sprite-24');
  assert.equal(P056_DISPLAY_SOURCE.frameCount, 234);
  assert.deepEqual(P056_DISPLAY_SOURCE.rootPlacement,
    {frame: 6, depth: 2, characterId: 24, transX: 8248, transY: 5666});
  assert.equal(P056_DISPLAY_EVENTS.length, 108);
  assert.equal(P056_DISPLAY_EVENTS.filter(event => event.kind === 'place').length, 26);
  assert.equal(P056_DISPLAY_EVENTS.filter(event => event.kind === 'update').length, 76);
  assert.equal(P056_DISPLAY_EVENTS.filter(event => event.kind === 'remove').length, 6);
});

test('all teaching frames have deterministic, ordered source-static layers', () => {
  for (let frame = 1; frame <= 234; frame++) {
    const layers = p056SourceSpriteFrame(frame);
    assert.deepEqual(layers.map(layer => layer.depth),
      [...layers.map(layer => layer.depth)].sort((a, b) => a - b));
    assert.equal(new Set(layers.map(layer => layer.depth)).size, layers.length);
    for (const layer of layers) {
      assert.ok(layer.characterId > 0 && layer.alpha256 >= 0 && layer.alpha256 <= 256);
      assert.ok(Number.isFinite(layer.transform.scaleX) &&
        Number.isFinite(layer.transform.scaleY) &&
        Number.isFinite(layer.transform.transX) &&
        Number.isFinite(layer.transform.transY));
    }
    for (const characterId of [16, 17]) {
      const sourceButton = p056SourceButtonDisplay(frame, characterId);
      const layer = layers.find(item => item.characterId === characterId);
      if (!sourceButton) { assert.equal(layer, undefined); continue; }
      assert.ok(layer);
      assert.equal(layer.alpha256, sourceButton.alpha256);
      assert.equal(layer.transform.transX, sourceButton.localXTwips);
      assert.equal(layer.transform.transY, sourceButton.localYTwips);
    }
  }
  for (const frame of [0, 235, 1.5, Number.NaN]) {
    assert.throws(() => p056SourceSpriteFrame(frame), RangeError);
  }
});

test('one-frame term flashes and later question fades retain their source boundaries', () => {
  const at = (frame: number, depth: number) =>
    p056SourceSpriteFrame(frame).find(layer => layer.depth === depth);
  assert.equal(p056SourceSpriteFrame(1).length, 11);
  assert.equal(p056SourceSpriteFrame(8).length, 11);
  assert.equal(p056SourceSpriteFrame(9).length, 16);
  for (const frame of [32, 34, 36]) assert.equal(at(frame, 20)?.characterId, 18);
  for (const frame of [33, 35, 37]) assert.equal(at(frame, 20), undefined);
  for (const frame of [42, 44, 46]) assert.equal(at(frame, 20)?.characterId, 19);
  for (const frame of [43, 45, 47]) assert.equal(at(frame, 20), undefined);
  assert.equal(at(102, 20)?.characterId, 20);
  assert.equal(at(102, 20)?.alpha256, 0);
  assert.equal(at(111, 20)?.alpha256, 256);
  assert.equal(at(154, 22)?.characterId, 22);
  assert.equal(at(154, 22)?.alpha256, 0);
  assert.equal(at(163, 22)?.alpha256, 256);
  assert.equal(at(234, 22)?.characterId, 22);
});

test('exact source regenerates the IR byte-for-byte and cannot overwrite it', t => {
  const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;
  if (!sourceRoot) { t.skip('real G6–G8 source root required'); return; }
  assert.equal(sourceRoot,
    '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware');
  const rootStat = lstatSync(sourceRoot);
  assert.ok(rootStat.isDirectory() && !rootStat.isSymbolicLink());
  const script = new URL('../../../../scripts/build-nms-l02-p056-display-list-v1.mjs', import.meta.url);
  const generated = new URL('../generated/nms-l02-p056-display-list-v1.ts', import.meta.url);
  const before = createHash('sha256').update(readFileSync(generated)).digest('hex');
  const env = {...process.env, HELP_MATH_G678_SOURCE_ROOT: sourceRoot};
  const check = spawnSync(process.execPath, [fileURLToPath(script), '--check'], {env, encoding: 'utf8'});
  assert.equal(check.status, 0, check.stderr);
  const overwrite = spawnSync(process.execPath, [fileURLToPath(script), '--write'], {env, encoding: 'utf8'});
  assert.notEqual(overwrite.status, 0);
  assert.match(overwrite.stderr, /EEXIST/u);
  assert.equal(createHash('sha256').update(readFileSync(generated)).digest('hex'), before);
});
