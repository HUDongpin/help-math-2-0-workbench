import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {
  P006_GLOSSARY_BUTTONS,
  P006_GLOSSARY_SEGMENTS,
  P006_MAIN_FRAME_COUNT,
  P006_MODERN_CLOSE_POLICY,
  P006_SOURCE_SHA256,
  advanceP006Glossary,
  closeP006Glossary,
  initialP006GlossaryState,
  placedP006GlossaryButtons,
  replayP006Glossary,
  requestP006GlossaryAfterVerifiedHit,
  resumeP006Glossary,
} from '../src/alg-l12-p006-glossary-state';

interface GlossaryAudit {
  source: {sha256: string};
  timeline: {
    mainFrameCount: number;
    sameFrameReplacement: number;
    buttonPresenceAtFrames: Record<string, number[]>;
    moveEvents: unknown[];
  };
  buttons: Array<{
    characterId: number;
    sourceKeyAttribute: string;
    depth: number;
    releaseSequence: string[];
    placements: Array<{firstFrame: number; lastFrame: number; ratio: number}>;
  }>;
  clipMask: {depth: number; clipDepth: number; affectsButtonDepths: number[]};
}

const audit = JSON.parse(readFileSync(new URL(
  '../../../migrations/shared-alg001-l12-p006/audit/glossary-disposition-v1.json', import.meta.url,
), 'utf8')) as GlossaryAudit;

test('P006 bindings match its audit, including the same-frame replacement and clip-mask boundary', () => {
  assert.equal(P006_SOURCE_SHA256, audit.source.sha256);
  assert.equal(P006_MAIN_FRAME_COUNT, audit.timeline.mainFrameCount);
  assert.equal(audit.timeline.sameFrameReplacement, 338);
  assert.deepEqual(audit.timeline.moveEvents, []);
  assert.deepEqual(P006_GLOSSARY_BUTTONS.map(({characterId, term, depth}) =>
    [characterId, term, depth]), audit.buttons.map(({characterId, sourceKeyAttribute, depth}) =>
    [characterId, sourceKeyAttribute, depth]));
  for (const button of audit.buttons) {
    assert.deepEqual(button.placements.map(({firstFrame, lastFrame, ratio}) =>
      ({firstFrame, lastFrame, ratio})), P006_GLOSSARY_SEGMENTS);
    assert.deepEqual(button.releaseSequence, [
      'set _global.KeyAttribute', 'call _root.DoHyperLinks()', 'stop _root.animation_mc.animation',
    ]);
  }
  assert.equal(audit.clipMask.depth, 18);
  assert.equal(audit.clipMask.clipDepth, 29);
  assert.deepEqual(audit.clipMask.affectsButtonDepths, P006_GLOSSARY_BUTTONS.map(button => button.depth));
  assert.deepEqual([248, 249, 337, 338, 342].map(frame =>
    placedP006GlossaryButtons(frame).map(button => button.characterId)),
    [248, 249, 337, 338, 342].map(frame => audit.timeline.buttonPresenceAtFrames[String(frame)]));
  assert.deepEqual([0, -1, 248, 343, 1.5, NaN, Infinity].map(placedP006GlossaryButtons),
    [[], [], [], [], [], [], []]);
});

test('placement alone never makes a request; the caller must verify hit eligibility', () => {
  const before = advanceP006Glossary(initialP006GlossaryState(), 248);
  assert.equal(before.frame, 249);
  assert.equal(requestP006GlossaryAfterVerifiedHit(before, 48, false), before);
  for (const invalidId of [0, 47, 52, 999, 48.5, NaN, Infinity]) {
    assert.equal(requestP006GlossaryAfterVerifiedHit(before, invalidId, true), before);
  }
  for (const invalidFrame of [0, 248, 343, 249.5, NaN, Infinity]) {
    const invalidState = {...before, frame: invalidFrame};
    assert.equal(requestP006GlossaryAfterVerifiedHit(invalidState, 48, true), invalidState);
  }
  assert.match(P006_MODERN_CLOSE_POLICY, /original-parity-pending/);
});

test('each verified source release requests its exact key and pauses until close plus explicit resume', () => {
  for (const button of P006_GLOSSARY_BUTTONS) {
    const before = Object.freeze(advanceP006Glossary(initialP006GlossaryState(), 248));
    const requested = requestP006GlossaryAfterVerifiedHit(before, button.characterId, true);
    assert.deepEqual(requested.pendingGlossary, {
      term: button.term, sourceCharacterId: button.characterId, requestedAtFrame: 249,
    });
    assert.equal(requested.transport, 'paused');
    assert.equal(requested.frame, 249);
    assert.equal(before.pendingGlossary, null);
    assert.equal(advanceP006Glossary(requested, 10), requested);
    assert.equal(resumeP006Glossary(requested), requested);
    assert.equal(requestP006GlossaryAfterVerifiedHit(requested, button.characterId, true), requested);
    const closed = closeP006Glossary(requested);
    assert.equal(closed.pendingGlossary, null);
    assert.equal(closed.transport, 'paused');
    assert.equal(closeP006Glossary(closed), closed);
    assert.equal(advanceP006Glossary(closed), closed);
    // A stopped playhead does not remove source buttons; reopening stays paused.
    const reopened = requestP006GlossaryAfterVerifiedHit(closed, button.characterId, true);
    assert.equal(reopened.pendingGlossary?.term, button.term);
    assert.equal(reopened.transport, 'paused');
    const resumed = resumeP006Glossary(closed);
    assert.equal(resumed.transport, 'playing');
    assert.equal(resumed.frame, 249);
    assert.equal(requestP006GlossaryAfterVerifiedHit(resumed, button.characterId, false), resumed);
    assert.equal(requestP006GlossaryAfterVerifiedHit(resumed, button.characterId, true).pendingGlossary?.term, button.term);
  }
});

test('replacement, terminal stop, invalid advances, and Replay reset are deterministic', () => {
  const initial = initialP006GlossaryState();
  for (const invalidFrames of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => advanceP006Glossary(initial, invalidFrames), RangeError);
  }
  assert.equal(requestP006GlossaryAfterVerifiedHit(initial, 48, true), initial);
  const at337 = advanceP006Glossary(initial, 336);
  assert.equal(at337.frame, 337);
  const at338 = advanceP006Glossary(at337);
  assert.equal(at338.frame, 338);
  assert.equal(requestP006GlossaryAfterVerifiedHit(at338, 49, false), at338);
  assert.equal(requestP006GlossaryAfterVerifiedHit(at338, 49, true).pendingGlossary?.term, 'Graph');
  const terminal = advanceP006Glossary(at338, 100);
  assert.equal(terminal.frame, 342);
  assert.equal(terminal.transport, 'stopped');
  assert.equal(advanceP006Glossary(terminal), terminal);
  const requested = requestP006GlossaryAfterVerifiedHit(terminal, 51, true);
  assert.equal(requested.pendingGlossary?.term, 'Inequality');
  assert.equal(requested.transport, 'stopped');
  const closed = closeP006Glossary(requested);
  assert.equal(closed.transport, 'stopped');
  assert.equal(resumeP006Glossary(closed), closed);
  assert.deepEqual(replayP006Glossary(), initial);
  assert.notEqual(replayP006Glossary(), initial);
  assert.deepEqual(replayP006Glossary(), replayP006Glossary());
});
