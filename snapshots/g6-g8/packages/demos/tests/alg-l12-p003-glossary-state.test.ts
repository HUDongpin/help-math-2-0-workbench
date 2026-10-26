import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P003_SOURCE_SHA256, P003_GLOSSARY_BUTTONS, P003_CLOSE_POLICY,
  advanceP003Glossary, closeP003Glossary, initialP003GlossaryState,
  replayP003Glossary, requestP003Glossary, retainedP003GlossaryButtons,
  setP003Paused} from '../src/alg-l12-p003-glossary-state';

test('P003 every frame agrees with independently extracted source retention intervals', () => {
  const source = JSON.parse(readFileSync(new URL('../../../migrations/shared-alg001-l12-p003/audit/source-structure.json', import.meta.url), 'utf8'));
  assert.equal(source.source.sha256, P003_SOURCE_SHA256);
  for (let frame = 1; frame <= 1008; frame++) {
    const records = source.sprites['164'].buttonDisplayListRanges.filter((r: {firstFrame:number;lastFrame:number}) => frame >= r.firstFrame && frame <= r.lastFrame);
    const expected = [...new Set(records.map((r: {characterId:number}) => r.characterId))].sort();
    assert.deepEqual(retainedP003GlossaryButtons(frame).map(x => x.characterId).sort(), expected, `frame ${frame}`);
  }
  for (const frame of [0,1009,1.5,NaN,Infinity]) assert.deepEqual(retainedP003GlossaryButtons(frame), []);
});

test('six exact requests hold frame, block reentrancy and restore modern prior transport', () => {
  for (const button of P003_GLOSSARY_BUTTONS) {
    const before = advanceP003Glossary(initialP003GlossaryState(), button.firstFrame - 1);
    const unavailable = {...before, frame: button.firstFrame - 1};
    assert.equal(requestP003Glossary(unavailable, button.characterId), unavailable);
    for (const paused of [false,true]) {
      const state = setP003Paused(before, paused);
      const request = requestP003Glossary(state, button.characterId);
      assert.equal(request.pendingGlossary?.term, button.term);
      assert.equal(request.pendingGlossary?.requestedAtFrame, button.firstFrame);
      assert.equal(advanceP003Glossary(request, 100), request);
      assert.equal(setP003Paused(request,false), request);
      assert.equal(requestP003Glossary(request,150), request);
      assert.deepEqual(closeP003Glossary(request), state);
    }
  }
  assert.match(P003_CLOSE_POLICY,/original-host-parity-unverified/);
});

test('terminal stays stopped through repeated dialogs; Replay clears complete state', () => {
  const initial = initialP003GlossaryState();
  const terminal = advanceP003Glossary(initial, 1008);
  assert.equal(terminal.frame,1008);
  assert.equal(terminal.transport,'stopped');
  for (const button of P003_GLOSSARY_BUTTONS) assert.deepEqual(closeP003Glossary(requestP003Glossary(terminal,button.characterId)),terminal);
  assert.equal(setP003Paused(terminal,false),terminal);
  assert.equal(advanceP003Glossary(terminal),terminal);
  assert.equal(requestP003Glossary(initial,999),initial);
  assert.deepEqual(replayP003Glossary(),initial);
  for (const n of [0,-1,1.5,Infinity]) assert.throws(()=>advanceP003Glossary(initial,n),RangeError);
});
