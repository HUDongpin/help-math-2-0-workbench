import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {initialP046State, reduceP046, P046_SOURCE, P046_VALUES,
  type P046State, type P046Event, type P046Id} from './alg-l06-p046-state-v1';

const root = new URL('../../../migrations/shared-alg001-l06-p046/', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');
const hash = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex');
function send(s: P046State, event: Omit<P046Event, 'epoch'> | Record<string, unknown>) {
  const result = reduceP046(s, {...event, epoch: s.epoch} as P046Event);
  assert.equal(result.accepted, true, result.reason);
  return result.state;
}
function quiz() {
  let s = send(initialP046State(), {type: 'play'});
  s = send(s, {type: 'advance-main', frame: 743});
  assert.equal(s.mainFrame, 163); assert.equal(s.mainPlaying, false);
  return s;
}
function drop(s: P046State, id: P046Id, target: P046Id | null) {
  s = send(s, {type: 'pick', id});
  return send(s, {type: 'drop', id, target, token: s.selection!.token});
}

test('P046 constants independently bind physical SWF, source geometry and exact ActionScript', () => {
  assert.equal(hash(readFileSync(new URL('source-v1/L6TI06.swf', root))), P046_SOURCE.swfSha256);
  const modelRaw = read('native-v1/source-model-v1.json');
  assert.equal(hash(modelRaw), P046_SOURCE.modelSha256);
  const m = JSON.parse(modelRaw);
  assert.deepEqual(m.drags.map((r: {id: P046Id; value: string}) => [r.id, r.value]),
    Object.entries(P046_VALUES).map(([id, value]) => [Number(id), value]));
  assert.deepEqual(m.drags.map((r: {textId: number}) => r.textId), [31, 29, 32, 28, 30]);
  const base = 'audit-v1/ffdec-export/scripts/';
  for (const [sprite, depth] of [[55, 40], [53, 34], [56, 43], [52, 31], [54, 37]]) {
    const release = read(`${base}DefineSprite_123/frame_163/PlaceObject2_${sprite}_${depth}/CLIPACTIONRECORD on(releaseOutside,release).as`);
    assert.match(release, /tempMcName = "Tar_" \+ _name.substring/);
    assert.match(release, /_global.quizDragCount\+\+/);
    assert.match(release, /enabled = false/);
    assert.match(release, /_X = oX/);
    assert.match(release, /_parent.Coach_audio_1.gotoAndPlay\(2\)/);
    assert.match(release, /_parent.Coach_audio_2.gotoAndPlay\(2\)/);
  }
  assert.match(read(`${base}DefineSprite_63/frame_20/DoAction.as`), /quizDragCount >= 5/);
  assert.match(read(`${base}DefineSprite_123/frame_743/DoAction.as`), /stop\(\)/);
  assert.deepEqual(m.streams.map((s: {spriteId: number; blockCount: number}) => [s.spriteId, s.blockCount]), [[61, 19], [63, 19], [123, 724]]);
});

test('wrong target and release outside return the source without losing earlier matches', () => {
  let s = drop(quiz(), 3, 3);
  s = drop(s, 1, 2);
  assert.equal(s.quizDragCount, 1); assert.deepEqual(s.placements, {3: true});
  assert.equal(s.tryAgainVisible, true); assert.equal(s.selection, null);
  s = send(s, {type: 'pick', id: 1});
  assert.equal(s.tryAgainVisible, false);
  s = send(s, {type: 'drop', id: 1, target: null, token: s.selection!.token});
  assert.equal(s.quizDragCount, 1); assert.equal(s.tryAgainVisible, true);
});

test('correct sources lock individually; duplicate drops and stale gesture tokens cannot increment count', () => {
  let s = quiz(); s = send(s, {type: 'pick', id: 1});
  const oldToken = s.selection!.token;
  s = send(s, {type: 'pick', id: 2});
  assert.equal(reduceP046(s, {type: 'drop', id: 1, target: 1, token: oldToken, epoch: s.epoch}).accepted, false);
  s = send(s, {type: 'drop', id: 2, target: 2, token: s.selection!.token});
  assert.equal(reduceP046(s, {type: 'pick', id: 2, epoch: s.epoch}).accepted, false);
  assert.equal(s.quizDragCount, 1);
  assert.equal(send(s, {type: 'pick', id: 4}).selection!.id, 4);
});

test('wrong/right coach clocks coexist; restarting one retires only that coach callback', () => {
  let s = drop(quiz(), 1, 2);
  const wrongToken = s.coaches.wrong!.token;
  s = drop(s, 1, 1);
  assert.equal(s.coaches.wrong!.token, wrongToken); assert.equal(s.coaches.wrong!.playing, true);
  const oldRight = s.coaches.right!.token;
  s = drop(s, 2, 2);
  assert.equal(reduceP046(s, {type: 'advance-coach', kind: 'right', frame: 20, token: oldRight, epoch: s.epoch}).accepted, false);
  s = send(s, {type: 'advance-coach', kind: 'wrong', frame: 20, token: wrongToken});
  assert.equal(s.coaches.right!.playing, true); assert.equal(s.coaches.wrong!.frame, 1);
  assert.equal(s.mainPlaying, false);
});

test('all five matches remain held until current right coach20; main164 removes both coaches and ends743', () => {
  let s = quiz();
  for (const id of [3, 1, 5, 2, 4] as const) s = drop(s, id, id);
  assert.equal(s.quizDragCount, 5); assert.equal(s.phase, 'quiz'); assert.equal(s.mainPlaying, false);
  assert.equal(reduceP046(s, {type: 'advance-main', frame: 164, epoch: s.epoch}).accepted, false);
  s = send(s, {type: 'advance-coach', kind: 'right', frame: 19, token: s.coaches.right!.token});
  assert.equal(s.mainPlaying, false);
  s = send(s, {type: 'advance-coach', kind: 'right', frame: 20, token: s.coaches.right!.token});
  assert.equal(s.phase, 'explanation'); assert.equal(s.mainFrame, 163); assert.equal(s.quizSection, false);
  s = send(s, {type: 'advance-main', frame: 164});
  assert.deepEqual(s.coaches, {wrong: null, right: null});
  s = send(s, {type: 'advance-main', frame: 743});
  assert.equal(s.phase, 'end'); assert.equal(s.mainPlaying, false); assert.equal(s.lessonCompleted, false);
});

test('NMH and nested glossary preserve matches; paused coach callbacks stay stale after return', () => {
  let s = drop(quiz(), 5, 5); const token = s.coaches.right!.token;
  s = send(s, {type: 'open-nmh'});
  assert.equal(s.coaches.right!.playing, true);
  assert.equal(reduceP046(s, {type: 'pick', id: 1, epoch: s.epoch}).accepted, false);
  s = send(s, {type: 'glossary', buttonId: 84});
  assert.equal(s.glossary!.term, 'Equation');
  s = send(s, {type: 'close-glossary'}); assert.equal(s.nmhVisible, true);
  assert.equal(reduceP046(s, {type: 'advance-coach', kind: 'right', frame: 20, token, epoch: s.epoch}).accepted, false);
  s = send(s, {type: 'close-nmh'}); assert.equal(s.quizDragCount, 1);
  s = send(s, {type: 'play'}); assert.equal(s.mainPlaying, false); assert.equal(s.coaches.right!.playing, true);
});

test('explicit SA holds all tracks, return preserves matches, Replay and leave invalidate the entire run', () => {
  let s = drop(quiz(), 2, 2); const token = s.coaches.right!.token;
  s = send(s, {type: 'spanish'}); assert.equal(s.spanishSelected, true);
  assert.equal(reduceP046(s, {type: 'pick', id: 1, epoch: s.epoch}).accepted, false);
  s = send(s, {type: 'return-spanish'}); assert.equal(s.mainPlaying, false); assert.equal(s.quizDragCount, 1);
  assert.equal(reduceP046(s, {type: 'advance-coach', kind: 'right', frame: 20, token, epoch: s.epoch}).accepted, false);
  const oldEpoch = s.epoch; s = send(s, {type: 'replay'});
  assert.deepEqual(s, initialP046State(oldEpoch + 1));
  assert.equal(reduceP046(s, {type: 'advance-coach', kind: 'right', frame: 20, token, epoch: oldEpoch}).accepted, false);
  s = send(s, {type: 'leave'}); assert.equal(s.phase, 'left');
  assert.equal(reduceP046(s, {type: 'play', epoch: s.epoch}).accepted, false);
});

test('pointer cancellation has no wrong feedback and invalid source/frame values fail closed', () => {
  let s = send(quiz(), {type: 'pick', id: 4});
  s = send(s, {type: 'cancel-drag', token: s.selection!.token});
  assert.equal(s.tryAgainVisible, false); assert.deepEqual(s.coaches, {wrong: null, right: null});
  assert.equal(reduceP046(s, {type: 'pick', id: 6 as P046Id, epoch: s.epoch}).accepted, false);
  const intro = send(initialP046State(), {type: 'play'});
  for (const frame of [0, -1, NaN, 1.5, 744])
    assert.equal(reduceP046(intro, {type: 'advance-main', frame, epoch: intro.epoch}).accepted, false);
});
