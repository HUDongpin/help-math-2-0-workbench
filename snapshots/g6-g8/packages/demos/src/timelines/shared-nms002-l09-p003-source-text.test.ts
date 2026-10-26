import assert from 'node:assert/strict';
import test from 'node:test';

import type {RuntimeContext} from '../contract';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import {createNmsL09P003Clock, reduceNmsL09P003Clock} from
  './shared-nms002-l09-p003-source-clock';
import {NMS_L09_P003_TEXT_BINDING, NMS_L09_P003_TEXT_OPEN,
  projectNmsL09P003Text} from './shared-nms002-l09-p003-source-text';

function at(frame: number, lang: 'en' | 'es' = 'en', revision = 0) {
  const clock = createNmsL09P003Clock(frame);
  const context: RuntimeContext = {frame, frameDomain: 'sprite-246',
    rootFrame: 6, scenario: 'source-static-frame', lang, seed: 0,
    replay: revision};
  return projectNmsL09P003Text(clock, context);
}

test('source text binding identifies exact root and reused child instances', () => {
  validateLessonTextBinding(NMS_L09_P003_TEXT_BINDING);
  const blocks = NMS_L09_P003_TEXT_BINDING.blocks;
  assert.equal(blocks.length, 15);
  assert.equal(blocks[0].instance?.id, 'root:297:1:247');
  assert.deepEqual(blocks[0].sourceShapeIds, [248]);
  assert.deepEqual(blocks[3].sourceShapeIds, [227]);
  assert.deepEqual(blocks[4].sourceShapeIds, [238]);
  assert.equal(blocks[4].instance?.id,
    'root:1:1:246/sprite-246:242:1:106');
  assert.equal(blocks[5].instance?.id,
    'root:1:1:246/sprite-246:243:1:106');
  assert.equal(blocks[8].instance?.id,
    'root:1:1:246/sprite-246:283:2:232');
  assert.equal(blocks[9].instance?.id,
    'root:1:1:246/sprite-246:283:1:228');
  assert.equal(blocks[14].instance?.id,
    'root:1:1:246/sprite-246:286:5:239');
  assert(!blocks.some(block => block.sourceTextIds.some(id =>
    /character-155\//u.test(id))));
  assert.equal(NMS_L09_P003_TEXT_OPEN.length, 4);
});

test('five source mask beats reveal mathematical text without an early answer', () => {
  const steps = [
    [1, 0, ''], [300, 0, ''], [590, 0, ''],
    [591, 1, '5'], [598, 1, '5'],
    [599, 2, '5 +'], [604, 2, '5 +'],
    [605, 3, '5 + 3'], [611, 3, '5 + 3'],
    [612, 4, '5 + 3 ×'], [615, 4, '5 + 3 ×'],
    [616, 5, '5 + 3 × 2'], [635, 5, '5 + 3 × 2'],
  ] as const;
  for (const [frame, count, text] of steps) {
    const result = at(frame);
    assert.equal(result.snapshot.status, 'ready');
    assert.equal(result.formulaRevealStep, count);
    const expression = result.snapshot.blocks.find(block =>
      block.id === 'expression');
    assert.equal(expression?.text, text);
    assert.equal(expression?.visible, count > 0);
    assert.equal(result.snapshot.blocks.filter(block =>
      block.id === 'schedule-heading' && block.visible).length, 1);
    assert.equal(result.snapshot.blocks.find(block =>
      block.id === 'schedule-heading-second-layer')?.visible, false);
    assert(result.snapshot.blocks.filter(block =>
      block.id.includes('emphasis-copy-')).every(block => !block.visible));
  }
});

test('source emphasis and ES fallback preserve the same teaching state', () => {
  assert.equal(at(590).emphasisRow, 'tank-one');
  assert.equal(at(592).emphasisRow, 'tank-one');
  assert.equal(at(594).emphasisRow, 'tank-one');
  assert.equal(at(591).emphasisRow, null);
  assert.equal(at(615).emphasisRow, 'addend-one');
  assert.equal(at(617).emphasisRow, 'addend-one');
  assert.equal(at(619).emphasisRow, 'addend-one');
  assert.equal(at(620).emphasisRow, null);
  const es = at(616, 'es');
  assert.equal(es.sourceLanguagePolicy, 'source-fallback');
  assert.equal(es.snapshot.identity.language, 'es');
  assert(es.snapshot.blocks.every(block => block.language === 'en'));
});

test('Replay resets the reveal and stale context identities fail closed', () => {
  const terminal = createNmsL09P003Clock(635);
  const replay = reduceNmsL09P003Clock(terminal, {type: 'replay'});
  const context: RuntimeContext = {frame: replay.frame,
    frameDomain: replay.frameDomain, rootFrame: replay.rootFrame,
    scenario: 'source-static-frame', lang: 'en', seed: 0,
    replay: replay.revision};
  assert.equal(projectNmsL09P003Text(replay, context).formulaRevealStep, 0);
  assert.throws(() => projectNmsL09P003Text(replay,
    {...context, replay: 0}), /exact frozen source clock/u);
  assert.throws(() => projectNmsL09P003Text(replay,
    {...context, frameDomain: 'root'}), /exact frozen source clock/u);
  assert.throws(() => projectNmsL09P003Text(replay,
    {...context, scenario: 'invented'}), /exact frozen source clock/u);
  assert.throws(() => projectNmsL09P003Text(replay,
    {...context, seed: 1}), /exact frozen source clock/u);
});
