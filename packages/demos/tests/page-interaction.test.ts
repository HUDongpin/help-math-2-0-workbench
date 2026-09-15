import assert from 'node:assert/strict';
import test from 'node:test';

import {UNPROVEN_FLASH_POINTER_POLICY} from '../src/page-interaction/contract';
import {
  createDragDropState,
  isDragDropSolved,
  placeTokenOnTarget,
  selectToken
} from '../src/page-interaction/drag-drop';
import {reducePointer} from '../src/page-interaction/pointer';
import {
  hasPageInteraction,
  listedPageInteractionIds,
  pageInteractionFor,
  stageTargetId
} from '../src/page-interaction/registry';

const addition = [
  {id: 'a', label: {en: 'addend', es: 'sumando'}, correctTargetIds: ['slot-a', 'slot-b']},
  {id: 'b', label: {en: 'addend', es: 'sumando'}, correctTargetIds: ['slot-a', 'slot-b']},
  {id: 'c', label: {en: 'sum', es: 'suma'}, correctTargetIds: ['slot-c']}
];

test('placing interchangeable addends and the sum solves the drag-drop exercise', () => {
  let state = createDragDropState(addition);
  assert.equal(isDragDropSolved(state, addition), false);
  state = placeTokenOnTarget(state, addition, 'b', 'slot-a');
  state = placeTokenOnTarget(state, addition, 'a', 'slot-b');
  state = placeTokenOnTarget(state, addition, 'c', 'slot-c');
  assert.equal(state.feedback, 'correct');
  assert.equal(isDragDropSolved(state, addition), true);
});

test('a sum cannot complete an addend cell', () => {
  let state = createDragDropState(addition);
  state = placeTokenOnTarget(state, addition, 'c', 'slot-a');
  state = placeTokenOnTarget(state, addition, 'a', 'slot-b');
  state = placeTokenOnTarget(state, addition, 'b', 'slot-c');
  assert.equal(isDragDropSolved(state, addition), false);
});

test('selecting a token is a toggle used by click-to-place', () => {
  let state = createDragDropState(addition);
  state = selectToken(state, 'a');
  assert.equal(state.selectedTokenId, 'a');
  state = selectToken(state, 'a');
  assert.equal(state.selectedTokenId, null);
});

test('pointer policy drops only after a press that started on a token and released on a target', () => {
  const down = reducePointer(UNPROVEN_FLASH_POINTER_POLICY, null, 'a', {
    phase: 'down',
    pointerId: 1,
    pointerType: 'mouse',
    button: 0,
    buttons: 1,
    isPrimary: true,
    insideToken: true,
    hitTargetId: null
  });
  assert.equal(down.decision.action, 'start');
  const miss = reducePointer(UNPROVEN_FLASH_POINTER_POLICY, down.session, 'a', {
    phase: 'up',
    pointerId: 1,
    pointerType: 'mouse',
    button: 0,
    buttons: 0,
    isPrimary: true,
    insideToken: false,
    hitTargetId: null
  });
  assert.equal(miss.decision.action, 'cancel');
  const hit = reducePointer(UNPROVEN_FLASH_POINTER_POLICY, down.session, 'a', {
    phase: 'up',
    pointerId: 1,
    pointerType: 'mouse',
    button: 0,
    buttons: 0,
    isPrimary: true,
    insideToken: false,
    hitTargetId: 'slot-c'
  });
  assert.deepEqual(hit.decision, {action: 'drop', tokenId: 'a', targetId: 'slot-c'});
});

test('cited Try It and Play It pages register stage target suffixes', () => {
  const ids = listedPageInteractionIds();
  assert.ok(ids.includes('course-g03-l02-ti-002'));
  assert.ok(ids.includes('course-g03-l02-gs-002'));
  assert.ok(ids.includes('course-g04-l03-ti-002'));
  assert.ok(ids.includes('course-g05-l05-ti-002'));
  const spec = pageInteractionFor('course-g03-l02-ti-002');
  assert.equal(spec?.kind, 'drag-drop-key-terms');
  assert.equal(spec?.pointerLifecycle.originalFlashPointerLifecycleEstablished, false);
  assert.equal(stageTargetId('g3-l2', spec!), 'g3-l2-ti002-key-terms');
  assert.equal(hasPageInteraction('course-g03-l02-ir-001-87689b4b'), false);
  assert.equal(
    ids.filter((id) => id.includes('-ti-') || id.includes('-gs-')).length,
    ids.length
  );
});
