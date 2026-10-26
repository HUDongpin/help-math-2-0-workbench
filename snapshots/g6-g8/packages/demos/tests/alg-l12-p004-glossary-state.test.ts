import assert from 'node:assert/strict';
import test from 'node:test';
import {
  P004_GLOSSARY_BUTTONS,
  P004_GLOSSARY_CLOSE_POLICY,
  P004_MAIN_FRAME_COUNT,
  P004_SOURCE_SHA256,
  advanceP004Glossary,
  closeP004Glossary,
  initialP004GlossaryState,
  replayP004Glossary,
  requestP004Glossary,
  resumeP004Glossary,
  visibleP004GlossaryButtons,
} from '../src/alg-l12-p004-glossary-state';

test('P004 terms bind exact source character/depth and inclusive display-list ranges', () => {
  assert.equal(P004_SOURCE_SHA256, '4d7aa78bd955aa52d476f31548c97135da989daf9d106986ff06a954c6d8b334');
  assert.deepEqual(P004_GLOSSARY_BUTTONS.map(({characterId, term, depth, firstFrame, lastFrame}) =>
    [characterId, term, depth, firstFrame, lastFrame]), [
    [63, 'Vertical-line test', 151, 19, 969],
    [66, 'Vertical', 157, 29, 969],
    [67, 'Graph', 159, 29, 969],
    [71, 'Point', 165, 203, 969],
    [72, 'Function', 167, 203, 969],
  ]);
  assert.deepEqual([18, 19, 28, 29, 202, 203, 969, 970].map(frame =>
    visibleP004GlossaryButtons(frame).map(button => button.characterId)), [
    [], [63], [63], [63, 66, 67], [63, 66, 67], [63, 66, 67, 71, 72],
    [63, 66, 67, 71, 72], [],
  ]);
});

test('each source button requests its exact term and pauses at the requested frame', () => {
  for (const button of P004_GLOSSARY_BUTTONS) {
    const before = advanceP004Glossary(initialP004GlossaryState(), button.firstFrame - 1);
    const requested = requestP004Glossary(before, button.characterId);
    assert.deepEqual(requested.pendingGlossary, {
      term: button.term, sourceCharacterId: button.characterId, requestedAtFrame: button.firstFrame,
    });
    assert.equal(requested.transport, 'paused');
    assert.equal(advanceP004Glossary(requested, 10), requested);
    assert.equal(requestP004Glossary(requested, 63), requested);
    const closed = closeP004Glossary(requested);
    assert.equal(closed.pendingGlossary, null);
    assert.equal(closed.transport, 'paused');
    assert.equal(resumeP004Glossary(closed).transport, 'playing');
  }
  assert.match(P004_GLOSSARY_CLOSE_POLICY, /original-parity-pending/);
});

test('unavailable buttons do not request glossary; terminal stop and Replay are deterministic', () => {
  const initial = initialP004GlossaryState();
  assert.equal(requestP004Glossary(initial, 63), initial);
  assert.equal(requestP004Glossary(initial, 999), initial);
  assert.throws(() => advanceP004Glossary(initial, 0), RangeError);
  const terminal = advanceP004Glossary(initial, P004_MAIN_FRAME_COUNT);
  assert.equal(terminal.frame, 969);
  assert.equal(terminal.transport, 'stopped');
  assert.equal(advanceP004Glossary(terminal), terminal);
  const requested = requestP004Glossary(terminal, 72);
  assert.equal(requested.pendingGlossary?.term, 'Function');
  assert.equal(closeP004Glossary(requested).transport, 'stopped');
  assert.equal(resumeP004Glossary(closeP004Glossary(requested)).transport, 'stopped');
  assert.deepEqual(replayP004Glossary(), initial);
  assert.deepEqual(replayP004Glossary(), replayP004Glossary());
  assert.deepEqual(visibleP004GlossaryButtons(1.5), []);
});
