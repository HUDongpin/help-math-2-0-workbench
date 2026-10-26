// Maintained target: packages/demos/tests/hfr-retarget-scope.test.ts
// Exercise public scope APIs without changing interpreter error or operation guards.
import assert from 'node:assert/strict';
import test from 'node:test';
import {ASFunction, ASObject} from '../src/hfr/avm';
import {MovieClip, Runtime} from '../src/hfr/display';
import {makeHelpers} from '../src/hfr/helpers';
import type {PageData} from '../src/hfr/types';

function setup() {
  const data = {
    source: {swfVersion: 6},
    stage: {fps: 12, width: 800, height: 600},
    dictionary: {},
    root: {frameCount: 1, frames: [[]], labels: {}},
    exports: {},
    streams: [],
  } as unknown as PageData;
  const rt = new Runtime(data, {});
  rt.helpers = makeHelpers(rt);
  rt.loadPage();
  const fn = new ASFunction(rt, {
    name: 'fixture',
    scope: [rt.Global, rt.page_],
    target: rt.page_,
    params: [],
  });
  const {ctx, act} = rt.prepareCall(fn, rt.page_, [], null);
  return {rt, ctx, act};
}

test('new tellTarget counter advances without changing the captured timeline', () => {
  const {rt, ctx} = setup();
  const moved = rt.retarget(ctx, '_root');
  assert.equal(moved.target, rt.shell);
  const scope = rt.helpers.scope(moved);
  scope.i = 0;
  const observed: unknown[] = [];
  // Bound the test itself so a regression cannot hang the test runner.
  for (let guard = 0; guard < 4; guard += 1) {
    observed.push(scope.i);
    scope.i = Number(scope.i) + 1;
  }
  assert.deepEqual(observed, [0, 1, 2, 3]);
  assert.equal(rt.shell.get('i'), 4);
  assert.equal(rt.page_.get('i'), undefined);
});

test('function activation retains read and write precedence after tellTarget', () => {
  const {rt, ctx, act} = setup();
  act.set('i', 8);
  rt.shell.set('i', 100);
  const moved = rt.retarget(ctx, '_root');
  assert.equal(rt.getVariable(moved, 'i'), 8);
  rt.setVariable(moved, 'i', 9);
  assert.equal(act.get('i'), 9);
  assert.equal(rt.shell.get('i'), 100);
});

test('captured scope and globals keep their existing precedence', () => {
  const {rt, ctx} = setup();
  rt.page_.set('kept', 3);
  rt.shell.set('kept', 9);
  rt.Global.set('globalOnly', 4);
  rt.shell.set('globalOnly', 20);
  const moved = rt.retarget(ctx, '_root');
  assert.equal(rt.getVariable(moved, 'kept'), 3);
  assert.equal(rt.getVariable(moved, 'globalOnly'), 4);
  rt.setVariable(moved, 'kept', 5);
  assert.equal(rt.page_.get('kept'), 5);
  assert.equal(rt.shell.get('kept'), 9);
});

test('defined undefined in activation or captured scope still shadows the target', () => {
  const {rt, ctx, act} = setup();
  act.set('localUndefined', undefined);
  rt.page_.set('capturedUndefined', undefined);
  rt.shell.set('localUndefined', 3);
  rt.shell.set('capturedUndefined', 4);
  const moved = rt.retarget(ctx, '_root');
  assert.deepEqual(rt.findScopeVar(moved, 'localUndefined'), [true, undefined]);
  assert.deepEqual(rt.findScopeVar(moved, 'capturedUndefined'), [true, undefined]);
});

test('empty target restores the original target after moved variable writes', () => {
  const {rt, ctx} = setup();
  const moved = rt.retarget(ctx, '_root');
  rt.setVariable(moved, 'counter', 2);
  assert.equal(rt.getVariable(moved, 'counter'), 2);
  const restored = rt.retarget(moved, '');
  assert.equal(restored.target, rt.page_);
  assert.equal(rt.getVariable(restored, 'counter'), undefined);
  rt.setVariable(restored, 'counter', 7);
  assert.equal(rt.page_.get('counter'), 7);
  assert.equal(rt.shell.get('counter'), 2);
});

test('target fallback reads inherited properties and preserves the getter receiver', () => {
  const {rt, ctx} = setup();
  const proto = new ASObject(rt, rt.MovieClipProto);
  let receiver: unknown;
  proto.define('fromPrototype', 13);
  proto.define('observed', undefined, {
    getter: rt.nat((self) => {
      receiver = self;
      return 21;
    }),
  });
  const other = new MovieClip(
    rt,
    proto,
    {kind: 'sprite', frameCount: 1, frames: [[]]},
    rt.page_,
    5,
    'other',
    -1,
  );
  const moved = rt.retarget(ctx, other);
  assert.equal(rt.getVariable(moved, 'fromPrototype'), 13);
  assert.equal(rt.getVariable(moved, 'observed'), 21);
  assert.equal(receiver, other);
  assert.deepEqual(rt.findScopeVar(moved, 'notPresent'), [false, undefined]);
});

test('ordinary timeline and invalid tellTarget behavior remain unchanged', () => {
  const {rt} = setup();
  const ctx = rt.timelineCtx(rt.page_);
  rt.setVariable(ctx, 'x', 2);
  assert.equal(rt.getVariable(ctx, 'x'), 2);
  const bad = rt.retarget(ctx, 'notPresent');
  assert.equal(bad, ctx);
  assert.equal(rt.getVariable(bad, 'x'), 2);
  assert.equal(rt.notes.get('setTargetMissing:notPresent'), 1);
});
