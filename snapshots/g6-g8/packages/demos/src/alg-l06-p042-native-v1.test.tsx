import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {p042InitialState, p042Reduce, type P042Event, type P042State} from './alg-l06-p042-state-v1';
import {
  P042_NATIVE, P042NativeCompanionV1, p042NativeGlossary,
  p042NativeOptions, p042NativeWrongFeedback,
} from './alg-l06-p042-native-v1';

function accepted(state: P042State, event: P042Event): P042State {
  const result = p042Reduce(state, event);
  assert.equal(result.accepted, true, result.reason);
  return result.state;
}

function atQuiz(): P042State {
  let state = p042InitialState();
  state = accepted(state, {type: 'start-main', epoch: state.epoch});
  return accepted(state, {type: 'advance-main', epoch: state.epoch, frame: 279});
}

test('native companion option boxes and text IDs match the pinned source model', () => {
  const bytes = readFileSync(new URL('../../../output/g678-p042-native-canvas-preparation-20261002-v1/native-model-v1.json', import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), P042_NATIVE.nativeModelSha256);
  const native = JSON.parse(bytes.toString());
  assert.deepEqual([native.stage.width, native.stage.height], [P042_NATIVE.stage.width, P042_NATIVE.stage.height]);
  for (const placement of native.quiz.answerPlacements) {
    const letter = placement.sourceStageLetter.text as keyof typeof P042_NATIVE.options;
    const companion = P042_NATIVE.options[letter];
    assert.equal(companion.instance, placement.instance);
    assert.equal(companion.buttonId, placement.buttonId);
    assert.equal(companion.value, placement.sourceStageValue.text);
    assert.equal(companion.letterTextId, placement.sourceStageLetter.sourceTextId);
    assert.equal(companion.valueTextId, placement.sourceStageValue.sourceTextId);
    assert.deepEqual(companion.hitBoxPx, placement.sourceStageHitBoxPx);
  }
});

test('NMH, glossary, and feedback local matrices remain pinned to native extraction', () => {
  const native = JSON.parse(readFileSync(new URL('../../../output/g678-p042-native-canvas-preparation-20261002-v1/native-model-v1.json', import.meta.url)).toString());
  const named = (spriteId: number, objectId: number) => native.selectedInstances.find(
    (item: {spriteId: number; objectId: number}) => item.spriteId === spriteId && item.objectId === objectId,
  );
  const xy = (item: {runs: {matrixTwips: {transX: number; transY: number}}[]}) =>
    [item.runs[0].matrixTwips.transX, item.runs[0].matrixTwips.transY];
  assert.deepEqual(xy(named(341, 146)), P042_NATIVE.nmh.openMainMatrixTwips);
  assert.deepEqual(xy(named(341, 181)), P042_NATIVE.nmh.closeMainMatrixTwips);
  assert.deepEqual(xy(named(288, 287)), P042_NATIVE.wrong.textLocalMatrixTwips);
  assert.deepEqual(xy(named(288, 285)), P042_NATIVE.wrong.closeLocalMatrixTwips);
  for (const [key, record] of Object.entries(P042_NATIVE.glossary)) {
    const item = native.selectedInstances.find((x: {spriteId: number; objectId: number; firstFrame: number; lastFrame: number}) =>
      x.spriteId === record.ownerSpriteId && x.objectId === Number(key) &&
      (record.ownerSpriteId === 145 || (x.firstFrame <= 279 && x.lastFrame >= 279)));
    const run = record.ownerSpriteId === 145 ? item.runs[0] : item.runs.find(
      (x: {firstFrame: number; lastFrame: number}) => x.firstFrame <= 279 && x.lastFrame >= 279);
    assert.deepEqual([run.matrixTwips.transX, run.matrixTwips.transY], record.localMatrixTwips);
  }
});

test('feedback EditText and Close source-stage boxes are computed without using them as overlay CSS', () => {
  const native = JSON.parse(readFileSync(new URL('../../../output/g678-p042-native-canvas-preparation-20261002-v1/native-model-v1.json', import.meta.url)).toString());
  const root = native.root.animationPlacementMatrixTwips;
  const edit = native.readOnlyEditDefinitions['287'].boundsTwips;
  const text = P042_NATIVE.wrong.textLocalMatrixTwips;
  const close = P042_NATIVE.wrong.closeLocalMatrixTwips;
  const base = [root.transX - 252 - 192, root.transY - 1533 - 237];
  const textBox = [base[0] + text[0] + edit.left, base[1] + text[1] + edit.top,
    base[0] + text[0] + edit.right, base[1] + text[1] + edit.bottom].map(x => x / 20);
  assert.deepEqual(textBox, P042_NATIVE.wrong.textStageBoxPx);
  const closeBox = [base[0] + close[0] - 1836, base[1] + close[1] - 351,
    base[0] + close[0] - 40, base[1] + close[1] + 209].map(x => x / 20);
  assert.deepEqual(closeBox, P042_NATIVE.wrong.closeStageBoxPx);
});

test('source English answer controls remain responsive below preserved Canvas in ES host', () => {
  const state = atQuiz();
  assert.deepEqual(p042NativeOptions(state).map(x => [x.choice, x.value, x.buttonId]), [
    ['A', '–3', 171], ['B', '3', 169], ['C', '10', 170], ['D', '25', 170],
  ]);
  const html = renderToStaticMarkup(<P042NativeCompanionV1 state={state} language="es"
    onChoose={() => {}} onOpenNmh={() => {}} onGlossary={() => {}} />);
  assert.match(html, /data-p042-language-policy="source-en-fallback"/);
  assert.match(html, /data-p042-canvas-glyphs="preserved"/);
  assert.match(html, /data-p042-overlay-calibration="pending"/);
  assert.match(html, /Texto original en inglés/);
  assert.match(html, /lang="en"/);
  assert.match(html, /data-source-choice="A"[^>]*>.*?–3<\/button>/);
  assert.match(html, /data-source-button-id="146"/);
  assert.doesNotMatch(html, /position:absolute|display:none/);
});

test('wrong dynamic txtFeed appears after source placement; Close only at hold 22', () => {
  let state = atQuiz();
  state = accepted(state, {type: 'choose', epoch: state.epoch,
    quizGeneration: state.quizGeneration, choice: 'B'});
  const token = state.feedback!.token;
  assert.equal(p042NativeWrongFeedback(state), null);
  state = accepted(state, {type: 'advance-feedback', epoch: state.epoch, token, frame: 16});
  const faded = p042NativeWrongFeedback(state);
  assert.equal(faded?.editTextId, 287);
  assert.equal(faded?.text, 'Substitute –2 for x in the equation. Try again.');
  assert.equal(faded?.canClose, false);
  state = accepted(state, {type: 'advance-feedback', epoch: state.epoch, token, frame: 22});
  assert.equal(p042NativeWrongFeedback(state)?.canClose, true);
  const html = renderToStaticMarkup(<P042NativeCompanionV1 state={state} language="es"
    onCloseWrong={() => {}} />);
  assert.match(html, /data-source-edit-text-id="287"/);
  assert.match(html, /data-source-button-id="285"[^>]*>Close<\/button>/);
  assert.doesNotMatch(html, />Cerrar<\/button>/);
  state = accepted(state, {type: 'close-wrong', epoch: state.epoch, token});
  assert.equal(p042NativeWrongFeedback(state), null);
});

test('NMH popup gates nested glossary and source Close separately from feedback Close', () => {
  let state = atQuiz();
  assert.deepEqual(p042NativeGlossary(state).map(x => x.buttonId), [153, 152, 154]);
  state = accepted(state, {type: 'open-nmh', epoch: state.epoch,
    quizGeneration: state.quizGeneration});
  assert.deepEqual(p042NativeGlossary(state).map(x => x.buttonId),
    [135, 136, 137, 140, 141, 142, 143]);
  assert.deepEqual(p042NativeOptions(state), []);
  const html = renderToStaticMarkup(<P042NativeCompanionV1 state={state}
    onCloseNmh={() => {}} onGlossary={() => {}} />);
  assert.match(html, /data-p042-section="source-nmh-popup"/);
  assert.match(html, /data-source-popup-sprite-id="145"/);
  assert.match(html, /data-source-glossary-button-id="135"/);
  assert.match(html, /data-source-button-id="181"[^>]*>Close<\/button>/);
  assert.doesNotMatch(html, /data-source-button-id="285"/);
  state = accepted(state, {type: 'close-nmh', epoch: state.epoch,
    quizGeneration: state.quizGeneration});
  assert.deepEqual(p042NativeGlossary(state).map(x => x.buttonId), [153, 152, 154]);
});
