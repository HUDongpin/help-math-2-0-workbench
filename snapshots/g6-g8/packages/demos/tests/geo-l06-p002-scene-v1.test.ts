import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import vectorManifest from '../../../migrations/shared-geo001-l06-p002/audit/vector-assets-v1/manifest.json';
import {geoL06P002MainState} from '../src/geo-l06-p002-display-state-v1';
import {geoL06P002Scene} from '../src/geo-l06-p002-scene-v1';

test('all source main frames project into source-ordered vector layers', () => {
  const sourceCharacters = new Set(vectorManifest.records.map(record => record.characterId));
  let maxObjects = 0;
  for (let frame = 1; frame <= 1216; frame++) {
    const state = geoL06P002MainState(frame, {frame, frameDomain: 'sprite-230',
      scenario: 'default', lang: 'en', seed: 0, replay: 0});
    const scene = geoL06P002Scene(state);
    const objects = [...scene.clipped, ...scene.foreground];
    assert.equal(scene.frame, frame);
    assert.equal(scene.maskMode, 'binary-fill');
    assert.ok(objects.every(object => sourceCharacters.has(object.characterId)));
    assert.ok(scene.clipped.every(object => object.depth <= 668));
    assert.ok(scene.foreground.every(object => object.depth > 668));
    assert.deepEqual(scene.clipped.map(object => object.depth),
      [...scene.clipped.map(object => object.depth)].sort((a, b) => a - b));
    assert.deepEqual(scene.foreground.map(object => object.depth),
      [...scene.foreground.map(object => object.depth)].sort((a, b) => a - b));
    maxObjects = Math.max(maxObjects, objects.length);
  }
  assert.ok(maxObjects > 20);
});

test('source shape alpha is not applied as clipDepth mask opacity', () => {
  const maskShape = readFileSync(new URL('../../../migrations/shared-geo001-l06-p002/' +
    'audit/vector-assets-v1/shapes/4.svg', import.meta.url), 'utf8');
  assert.match(maskShape, /fill="#2685e3" fill-opacity="0\.6"/);
  const state = geoL06P002MainState(1, {frame: 1, frameDomain: 'sprite-230',
    scenario: 'default', lang: 'en', seed: 0, replay: 0});
  assert.equal(state.objects.find(object => object.depth === 1)?.clipDepth, 668);
  assert.equal(geoL06P002Scene(state).maskMode, 'binary-fill');
});

test('native glossary and teaching text do not duplicate as decorative vector glyphs', () => {
  const state = geoL06P002MainState(987, {frame: 987, frameDomain: 'sprite-230',
    scenario: 'default', lang: 'es', seed: 0, replay: 2});
  const scene = geoL06P002Scene(state);
  const ids = [...scene.clipped, ...scene.foreground].map(object => object.characterId);
  for (const id of [209, 211, 212, 213, 214, 215, 219, 221, 222, 226, 227, 228, 229]) {
    assert.ok(!ids.includes(id));
  }
  assert.ok(ids.length > 20);
});
