import assert from 'node:assert/strict';
import test from 'node:test';
import { p042ModuleFrame } from '../src/nms-l02-p042-frame-v1';
import type { RuntimeContext } from '../src/contract';
const context = (frame: number, frameDomain = 'sprite-261'): RuntimeContext => ({ frame, frameDomain, scenario: 'source-explanation', lang: 'en', seed: 42, replay: 0 });
test('source root and child domain remain distinct, including post-stop inspection', () => {
  for (let frame = 1; frame <= 10; frame++) {
    const state = p042ModuleFrame(frame, context(frame, 'root'));
    assert.equal(state.rootFrame, frame);
    assert.equal(state.mainFrame, frame < 6 ? null : 1);
  }
  for (let frame = 1; frame <= 626; frame++) {
    const state = p042ModuleFrame(frame, context(frame));
    assert.equal(state.mainFrame, frame); assert.equal(state.rootFrame, 6);
    assert.equal(state.postStopInspection, frame === 626);
  }
});
test('query mismatches cannot silently select another source state', () => {
  for (const patch of [{ frameDomain: 'sprite-43' }, { scenario: 'other' }, { lang: 'fr' }, { rootFrame: 5 }, { frame: 2 }, { seed: -1 }, { replay: NaN }]) {
    assert.throws(() => p042ModuleFrame(1, { ...context(1), ...patch } as RuntimeContext), /QUERY_IDENTITY/);
  }
  for (const frame of [0, 627, 1.2, NaN]) assert.throws(() => p042ModuleFrame(frame, context(frame)), /QUERY_IDENTITY/);
});
