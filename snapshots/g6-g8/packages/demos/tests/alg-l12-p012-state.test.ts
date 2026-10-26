import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {
  P012_COACH_BRANCHES, P012_MOVES, P012_SOURCE,
  initialP012State, reduceP012State,
  type P012Button, type P012State,
} from '../src/alg-l12-p012-state';

const sourceRoot = new URL('../../../output/p011-source-triage-20260927-v1/raw/', import.meta.url);
const source = (relative: string) => readFileSync(new URL(relative, sourceRoot), 'utf8').replace(/\r\n/g, '\n');

test('the eight controls and tick rules remain pinned to the extracted source', () => {
  const swf = readFileSync(new URL('source-input.swf', sourceRoot));
  assert.equal(createHash('sha256').update(swf).digest('hex'), P012_SOURCE.swfSha256);
  const expected = [
    ['MoveBtn1', 80, 'Top1', 'y', 1, -1],
    ['MoveBtn2', 81, 'Top3', 'y', 3, -1],
    ['MoveBtn3', 82, 'Bottom1', 'y', -1, 1],
    ['MoveBtn4', 83, 'Bottom3', 'y', -3, 1],
    ['MoveBtn5', 84, 'Left1', 'x', -1, -1],
    ['MoveBtn6', 85, 'Left3', 'x', -3, -1],
    ['MoveBtn7', 78, 'Right1', 'x', 1, 1],
    ['MoveBtn8', 79, 'Right3', 'x', 3, 1],
  ] as const;
  for (const [button, character, path, axis, delta, pixelSign] of expected) {
    assert.deepEqual(P012_MOVES[button], {path, axis, delta, pixelSign, buttonCharacter: character});
    const press = source(`actionscript/as/scripts/DefineButton2_${character}/BUTTONCONDACTION on(press).as`);
    const release = source(`actionscript/as/scripts/DefineButton2_${character}/BUTTONCONDACTION on(release).as`);
    assert.match(press, new RegExp(`_global\\.s${axis.toUpperCase()} = McSpider\\._${axis};`));
    assert.match(press, new RegExp(`_global\\.temp = _global\\.${axis};`));
    assert.ok(release.includes(`_global.movePath = "${path}";`));
    assert.ok(release.includes(`_global.${axis} ${delta < 0 ? '-=' : '+='} ${Math.abs(delta)};`));
    assert.ok(release.includes('_global.' + axis + ' = _global.temp;'));
    assert.ok(release.includes('Mc_Feed_Popup1.gotoAndPlay(2);'));
  }
  const loop = source('actionscript/as/scripts/DefineSprite_86/frame_119/DoAction.as');
  // Frame 119 moves Mc_Dot1 three twips up from its earlier 380-twip pose.
  assert.deepEqual(P012_SOURCE.dotOrigin, {x: 133.7, y: 18.85});
  assert.match(loop, /McSpider\._x [+-]= 2;/);
  assert.match(loop, /McSpider\._y [+-]= 2;/);
  assert.match(loop, /mcOP\._y = McSpider\._y - 29;/);
  assert.match(loop, /mcOP\.txtOP\.text = "\(" \+ _global\.x \+ "," \+ _global\.y \+ "\)";/);
});

function move(state: P012State, button: P012Button): P012State {
  state = reduceP012State(state, {kind: 'press', button});
  state = reduceP012State(state, {kind: 'release', button});
  assert.equal(state.phase, 'moving');
  const ticks = Math.abs(P012_MOVES[button].delta) * 7;
  for (let tick = 0; tick < ticks; tick++) state = reduceP012State(state, {kind: 'tick'});
  assert.equal(state.phase, 'moving');
  state = reduceP012State(state, {kind: 'tick'});
  assert.equal(state.phase, 'completion');
  state = reduceP012State(state, {kind: 'tick'});
  assert.equal(state.phase, 'idle');
  return state;
}

test('all eight paired directions move spider by source pixels and commit dot/bubble only on idle', () => {
  for (const button of Object.keys(P012_MOVES) as P012Button[]) {
    const spec = P012_MOVES[button];
    let state = initialP012State();
    const firstPress = reduceP012State(state, {kind: 'press', button});
    assert.equal(firstPress.pressed?.button, button);
    assert.equal(firstPress.pressed?.originCoordinate, 0);
    assert.equal(firstPress.pressed?.originPixel, state.spider[spec.axis]);
    assert.equal(firstPress.controlsEnabled, false);
    state = reduceP012State(firstPress, {kind: 'release', button});
    assert.equal(state[spec.axis], spec.delta);
    assert.equal(state.coordinateText, '(0,0)', 'read-only field waits for idle tick');
    assert.equal(state.move?.path, spec.path);
    assert.equal(state.controlsEnabled, false);
    assert.equal(reduceP012State(state, {kind: 'press', button}), state);

    const ticks = Math.abs(spec.delta) * 7;
    const initialOtherAxis = state.spider[spec.axis === 'x' ? 'y' : 'x'];
    for (let tick = 1; tick <= ticks; tick++) {
      state = reduceP012State(state, {kind: 'tick'});
      assert.equal(state.spider[spec.axis], firstPress.spider[spec.axis] + spec.pixelSign * 2 * tick);
      assert.equal(state.spider[spec.axis === 'x' ? 'y' : 'x'], initialOtherAxis);
      assert.deepEqual(state.dot, firstPress.dot);
      assert.deepEqual(state.bubble, firstPress.bubble);
      assert.equal(state.phase, 'moving');
    }
    state = reduceP012State(state, {kind: 'tick'});
    assert.equal(state.phase, 'completion');
    assert.deepEqual(state.dot, firstPress.dot);
    assert.equal(state.controlsEnabled, false);
    state = reduceP012State(state, {kind: 'tick'});
    assert.equal(state.phase, 'idle');
    assert.deepEqual(state.dot, {x: state.spider.x, y: state.spider.y});
    assert.deepEqual(state.bubble, {x: state.spider.x, y: state.spider.y - 29});
    assert.equal(state.coordinateText, `(${state.x},${state.y})`);
    assert.equal(state.controlsEnabled, true);
  }
});

test('inclusive ±10 limits accept the edge, then reject 1 and 3 step overshoots without drift', () => {
  const paths = [
    {positive: 'MoveBtn7', large: 'MoveBtn8', negative: 'MoveBtn5', negativeLarge: 'MoveBtn6', axis: 'x'},
    {positive: 'MoveBtn1', large: 'MoveBtn2', negative: 'MoveBtn3', negativeLarge: 'MoveBtn4', axis: 'y'},
  ] as const;
  for (const route of paths) {
    let state = initialP012State(0);
    for (let i = 0; i < 3; i++) state = move(state, route.large);
    assert.equal(state[route.axis], 9);
    const beforeNine = state.spider;
    state = reduceP012State(state, {kind: 'press', button: route.large});
    state = reduceP012State(state, {kind: 'release', button: route.large});
    assert.equal(state[route.axis], 9);
    assert.deepEqual(state.spider, beforeNine);
    assert.equal(state.popup.visible, true);
    assert.equal(state.controlsEnabled, false);
    state = reduceP012State(state, {kind: 'close-popup'});
    state = move(state, route.positive);
    assert.equal(state[route.axis], 10);
    const beforeTen = state.spider;
    state = reduceP012State(state, {kind: 'press', button: route.positive});
    state = reduceP012State(state, {kind: 'release', button: route.positive});
    assert.equal(state[route.axis], 10);
    assert.deepEqual(state.spider, beforeTen);
    state = reduceP012State(state, {kind: 'close-popup'});

    for (let i = 0; i < 6; i++) state = move(state, route.negativeLarge);
    assert.equal(state[route.axis], -8);
    state = move(state, route.negative);
    assert.equal(state[route.axis], -9);
    const beforeMinusNine = state.spider;
    state = reduceP012State(state, {kind: 'press', button: route.negativeLarge});
    state = reduceP012State(state, {kind: 'release', button: route.negativeLarge});
    assert.equal(state[route.axis], -9);
    assert.deepEqual(state.spider, beforeMinusNine);
    state = reduceP012State(state, {kind: 'close-popup'});
    state = move(state, route.negative);
    assert.equal(state[route.axis], -10);
    const beforeMinusTen = state.spider;
    state = reduceP012State(state, {kind: 'press', button: route.negative});
    state = reduceP012State(state, {kind: 'release', button: route.negative});
    assert.equal(state[route.axis], -10);
    assert.deepEqual(state.spider, beforeMinusTen);
  }
});

test('release requires its own press; repeated or out-of-phase controls do nothing', () => {
  let state = initialP012State();
  assert.equal(reduceP012State(state, {kind: 'release', button: 'MoveBtn7'}), state);
  state = reduceP012State(state, {kind: 'press', button: 'MoveBtn7'});
  assert.equal(reduceP012State(state, {kind: 'press', button: 'MoveBtn1'}), state);
  assert.equal(reduceP012State(state, {kind: 'release', button: 'MoveBtn1'}), state);
  state = reduceP012State(state, {kind: 'release', button: 'MoveBtn7'});
  assert.equal(reduceP012State(state, {kind: 'release', button: 'MoveBtn7'}), state);
  assert.equal(reduceP012State(state, {kind: 'press', button: 'MoveBtn1'}), state);
});

test('pointer cancel or blur discards a press without changing position and permits another activation', () => {
  let state = initialP012State();
  const initial = state;
  state = reduceP012State(state, {kind: 'press', button: 'MoveBtn8'});
  state = reduceP012State(state, {kind: 'cancel-press'});
  assert.equal(state.pressed, null);
  assert.equal(state.controlsEnabled, true);
  assert.equal(state.x, initial.x);
  assert.equal(state.y, initial.y);
  assert.deepEqual(state.spider, initial.spider);
  assert.equal(reduceP012State(state, {kind: 'release', button: 'MoveBtn8'}), state);
  state = reduceP012State(state, {kind: 'press', button: 'MoveBtn1'});
  state = reduceP012State(state, {kind: 'release', button: 'MoveBtn1'});
  assert.equal(state.y, 1);
  assert.equal(state.phase, 'moving');
});

test('every seed branch reaches its source return frame; close applies explicit modal cancellation', () => {
  // LCG's first choices for seeds 0,1,2,3 are S4,S1,S2,S3.
  const expectedLabels = ['S4', 'S1', 'S2', 'S3'] as const;
  for (let seed = 0; seed < 4; seed++) {
    let state = initialP012State(seed);
    for (let i = 0; i < 10; i++) state = move(state, 'MoveBtn7');
    state = reduceP012State(state, {kind: 'press', button: 'MoveBtn7'});
    state = reduceP012State(state, {kind: 'release', button: 'MoveBtn7'});
    const branch = P012_COACH_BRANCHES.find(item => item.label === expectedLabels[seed])!;
    assert.equal(state.coach.label, branch.label);
    assert.equal(state.coach.frame, branch.firstFrame);
    assert.equal(state.popup.frame, 2);
    assert.equal(reduceP012State(state, {kind: 'press', button: 'MoveBtn5'}), state);
    for (let frame = branch.firstFrame; frame < branch.returnFrame - 1; frame++) {
      state = reduceP012State(state, {kind: 'coach-tick'});
      assert.equal(state.coach.frame, frame + 1);
      assert.equal(state.controlsEnabled, false);
    }
    state = reduceP012State(state, {kind: 'coach-tick'});
    assert.deepEqual(state.coach, {label: null, lastLabel: branch.label, frame: 1, playing: false});
    assert.equal(state.popup.visible, true, 'source callback is unresolved; modal popup remains');
    assert.equal(state.controlsEnabled, false);
    state = reduceP012State(state, {kind: 'close-popup'});
    assert.equal(state.controlsEnabled, true);
    assert.equal(state.popup.frame, 1);
  }
});

test('pause freezes movement/coach and cancels press; replay and navigation clear all transient state', () => {
  let state = initialP012State(2);
  state = reduceP012State(state, {kind: 'press', button: 'MoveBtn8'});
  state = reduceP012State(state, {kind: 'pause'});
  assert.equal(state.pressed, null);
  assert.equal(state.controlsEnabled, false);
  assert.equal(reduceP012State(state, {kind: 'release', button: 'MoveBtn8'}), state);
  state = reduceP012State(state, {kind: 'resume'});
  assert.equal(state.controlsEnabled, true);
  state = reduceP012State(state, {kind: 'press', button: 'MoveBtn8'});
  state = reduceP012State(state, {kind: 'release', button: 'MoveBtn8'});
  state = reduceP012State(state, {kind: 'tick'});
  const beforePause = state.spider;
  state = reduceP012State(state, {kind: 'pause'});
  assert.equal(reduceP012State(state, {kind: 'tick'}), state);
  assert.deepEqual(state.spider, beforePause);
  state = reduceP012State(state, {kind: 'resume'});
  state = reduceP012State(state, {kind: 'tick'});
  assert.notDeepEqual(state.spider, beforePause);
  state = reduceP012State(state, {kind: 'navigation'});
  assert.equal(state.phase, 'left');
  assert.equal(state.move, null);
  assert.equal(state.pressed, null);
  assert.equal(state.popup.visible, false);
  assert.deepEqual(state.spider, {...P012_SOURCE.spiderOrigin, rotation: 0});
  assert.equal(reduceP012State(state, {kind: 'tick'}), state);
  state = reduceP012State(state, {kind: 'replay'});
  assert.deepEqual(state, initialP012State(2));
});

test('replay resets seeded feedback choice and popup close cancels unfinished coach branch', () => {
  let state = initialP012State(1);
  for (let i = 0; i < 10; i++) state = move(state, 'MoveBtn7');
  state = reduceP012State(state, {kind: 'press', button: 'MoveBtn7'});
  state = reduceP012State(state, {kind: 'release', button: 'MoveBtn7'});
  assert.equal(state.coach.label, 'S1');
  state = reduceP012State(state, {kind: 'close-popup'});
  assert.equal(state.coach.playing, false);
  assert.equal(state.controlsEnabled, true);
  state = reduceP012State(state, {kind: 'replay'});
  assert.deepEqual(state, initialP012State(1));
});
