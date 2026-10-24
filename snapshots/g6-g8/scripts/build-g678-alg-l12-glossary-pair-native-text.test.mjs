import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildPairNativeText, preparePairNativeText, sourcePoseSegments} from './build-g678-alg-l12-glossary-pair-native-text.mjs';

test('physical P013/P015 text, source poses, masks and exact native suppression regenerate', async () => {
  const {records, manifests} = await buildPairNativeText({check: true});
  assert.deepEqual(Object.keys(records), ['p013', 'p015']);
  for (const [short, textCount, instanceCount, frameCount, titleShape] of [
    ['p013', 26, 44, 372, 64], ['p015', 19, 68, 474, 77],
  ]) {
    const page = records[short], manifest = manifests[short];
    assert.equal(page.definitions.length, textCount);
    assert.equal(page.instances.length, instanceCount);
    assert.equal(page.frameCount, frameCount);
    assert.equal(page.title.characterId, titleShape);
    assert.equal(page.title.text, 'Graphing in the Coordinate Plane: Vocabulary');
    assert.equal(page.masks.length, 2);
    assert.equal(manifest.sourceSwfSha256, page.source.swfSha256);
    assert.equal(manifest.sourceCanvasSha256, page.source.sourceCanvasSha256);
    assert.equal(manifest.rules.length, 2);
    assert.equal(manifest.rootCompanionShapeSuppression.length, 1);
    assert.equal(manifest.rootCompanionShapeSuppression[0].nativeReplacementId, 'title');
    assert.equal(manifest.rootCompanionShapeSuppression[0].object, `shape${titleShape}`);
    assert.deepEqual(manifest.rootCompanionShapeSuppression[0].canvasCallMatrix,
      [0.05, 0, 0, 0.05, 0, 0]);
    for (const rule of manifest.rules) {
      const instance = page.instances.find(item => item.instanceId === rule.id);
      const def = page.definitions.find(item => item.characterId === instance?.characterId);
      assert(instance && def && def.role === 'body');
      assert.equal(rule.nativeReplacementId, instance.instanceId);
      assert.deepEqual(rule.sourceTextIds, def.runs.map(run => run.sourceTextId));
      assert.deepEqual(rule.sourcePlacementEvents, instance.events);
      assert.equal(rule.lastFrameExclusive, frameCount + 1);
      assert.equal(rule.callOrdinalWithinFrameObject, 0);
      assert(page.masks.some(mask => mask.maskInstanceId === rule.maskInstanceId &&
        mask.textInstanceId === instance.instanceId));
    }
    assert.equal(new Set(page.roles.canvasRetainedTextInstanceIds).size,
      instanceCount - manifest.rules.length);
    assert(page.claimBoundary.structuralSourceAndCandidateOnly);
    assert.equal(page.claimBoundary.nativeTextBrowserVerified, false);
  }
});

test('PlaceObject2 move inherits matrix and clip state across held frames', () => {
  const selected = [{instanceId: 'sprite-1/depth-1/generation-1', depth: 1,
    firstFrame: 1, lastFrameExclusive: 4}];
  const timeline = {declaredFrameCount: 3, events: [
    {frame: 1, kind: 'place', move: false, depth: 1, instanceId: selected[0].instanceId,
      characterId: 5, matrix: [1, 0, 0, 1, 100, 200], clipDepth: 2},
    {frame: 2, kind: 'place', move: true, depth: 1, instanceId: selected[0].instanceId,
      matrix: [2, 0, 0, 1, 100, 200]},
  ]};
  const segments = sourcePoseSegments(timeline, selected).get(selected[0].instanceId);
  assert.deepEqual(segments.map(item => [item.firstFrame, item.lastFrameExclusive]), [[1, 2], [2, 4]]);
  assert.equal(segments[1].pose.clipDepth, 2);
  assert.deepEqual(segments[1].pose.matrix, [2, 0, 0, 1, 100, 200]);
});
