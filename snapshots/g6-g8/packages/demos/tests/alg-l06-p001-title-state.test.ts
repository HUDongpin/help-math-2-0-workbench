import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {ALG_L06_P001_SOURCE, sourceTitleState} from '../src/alg-l06-p001-title-state';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const sourceIr = JSON.parse(readFileSync(path.join(projectRoot,
  'migrations/shared-alg001-l06-p001/audit/title-timeline-v1.json'), 'utf8'));

test('P001 source title state is exact for all 134 nested frames', () => {
  assert.equal(ALG_L06_P001_SOURCE.swfSha256, sourceIr.sourceSwfSha256);
  assert.equal(ALG_L06_P001_SOURCE.frameCount, sourceIr.titleFrameCount);
  assert.equal(ALG_L06_P001_SOURCE.rootEntryFrame, sourceIr.rootTitlePlacement.frame);
  assert.equal(ALG_L06_P001_SOURCE.title, sourceIr.textObjects[0].text);
  for (const row of sourceIr.frames) {
    const state = sourceTitleState(row.frame);
    assert.equal(state.frameDomainId, sourceIr.titleFrameDomain);
    assert.equal(state.rootXTwips, sourceIr.rootTitlePlacement.matrix.transXTwips);
    assert.equal(state.rootYTwips, sourceIr.rootTitlePlacement.matrix.transYTwips);
    for (const [index, layer] of state.layers.entries()) {
      const expected = row.layers[index];
      assert.deepEqual({
        depth: layer.depth,
        characterId: layer.characterId,
        scaleX: layer.scaleX,
        scaleY: layer.scaleY,
        transXTwips: layer.xTwips,
        transYTwips: layer.yTwips,
        alpha256: layer.alpha256,
      }, expected);
    }
  }
  assert.equal(sourceTitleState(1).layers[0].alpha256, 0);
  assert.equal(sourceTitleState(133).layers[1].alpha256, 256);
  assert.deepEqual(sourceTitleState(133).layers, sourceTitleState(134).layers);
  assert.equal(sourceTitleState(132).fullyVisible, false);
  assert.equal(sourceTitleState(133).fullyVisible, true);
});

test('P001 source title state refuses out-of-domain frames', () => {
  for (const frame of [0, 135, 1.5, NaN, Infinity]) {
    assert.throws(() => sourceTitleState(frame), RangeError);
  }
});
