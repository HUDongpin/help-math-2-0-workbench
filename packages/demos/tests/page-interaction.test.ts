import assert from 'node:assert/strict';
import test from 'node:test';

import {UNPROVEN_FLASH_POINTER_POLICY} from '../src/page-interaction/contract';
import {
  createDragDropState,
  isDragDropPracticeComplete,
  isDragDropSolved,
  placeTokenOnTarget,
  selectToken
} from '../src/page-interaction/drag-drop';
import {displayedFlashFrame} from '../src/page-interaction/frame';
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
  assert.equal(spec?.answerKey, 'ungraded-practice');
  assert.equal(spec?.evidence.reconstruction, 'catalog-vocabulary-ungraded-practice');
  assert.equal(spec?.pointerLifecycle.originalFlashPointerLifecycleEstablished, false);
  assert.equal(stageTargetId('g3-l2', spec!), 'g3-l2-ti002-key-terms');
  assert.equal(hasPageInteraction('course-g03-l02-ir-001-87689b4b'), false);
  assert.equal(
    ids.filter((id) => id.includes('-ti-') || id.includes('-gs-')).length,
    ids.length
  );
});

test('capture frames freeze at the requested one-indexed Flash frame', () => {
  assert.equal(displayedFlashFrame(5, 10, false), 5);
  assert.equal(displayedFlashFrame(99, 10, true), 99);
  assert.equal(displayedFlashFrame(undefined, 10, false), 1);
  assert.equal(displayedFlashFrame(undefined, 10, true), 10);
});

test('cited overlays keep empty answer keys until a SWF audit exists', () => {
  const spec = pageInteractionFor('course-g03-l02-ti-004');
  assert.equal(spec?.answerKey, 'ungraded-practice');
  assert.equal(spec?.problem.en, 'Question 3');
  for (const token of spec?.tokens ?? []) {
    assert.deepEqual(token.correctTargetIds, []);
  }
  const labels = (spec?.tokens ?? []).map((token) => token.label.en).sort();
  assert.deepEqual(labels, ['addend', 'difference', 'sum']);
  let state = createDragDropState(spec!.tokens ?? []);
  for (const [index, token] of (spec?.tokens ?? []).entries()) {
    state = placeTokenOnTarget(state, spec!.tokens ?? [], token.id, `slot-${['a', 'b', 'c'][index]}`);
  }
  assert.equal(isDragDropSolved(state, spec!.tokens ?? []), false);
  assert.equal(isDragDropPracticeComplete(state, spec!.tokens ?? []), true);
  assert.equal(state.feedback, 'complete');
});

test('Grade 4 Lesson 3 practice uses catalog number-line vocabulary', () => {
  const spec = pageInteractionFor('course-g04-l03-ti-005');
  const labels = (spec?.tokens ?? []).map((token) => token.label.en);
  assert.deepEqual(labels.sort(), ['negative', 'positive', 'zero']);
  assert.ok((spec?.tokens ?? []).every((token) => token.correctTargetIds.length === 0));
});
