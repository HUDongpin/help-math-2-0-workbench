import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {initialP047State, reduceP047, P047_SOURCE, P047_VALUES,
  type P047State, type P047Event, type P047Id} from './alg-l06-p047-state-v1';

const root = new URL('../../../migrations/shared-alg001-l06-p047/', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');
const hash = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex');
function send(s: P047State, event: Omit<P047Event, 'epoch'> | Record<string, unknown>) {
  const result = reduceP047(s, {...event, epoch: s.epoch} as P047Event);
  assert.equal(result.accepted, true, result.reason);
  return result.state;
}
function quiz() {
  let s = send(initialP047State(), {type: 'play'});
  s = send(s, {type: 'advance-main', frame: 889});
  assert.equal(s.mainFrame, 208); assert.equal(s.mainPlaying, false);
  return s;
}
function drop(s: P047State, id: P047Id, target: P047Id | null) {
  s = send(s, {type: 'pick', id});
  return send(s, {type: 'drop', id, target, token: s.selection!.token});
}

test('P047 constants independently bind physical SWF, source geometry and exact ActionScript', () => {
  assert.equal(hash(readFileSync(new URL('source-v1/L6TI07.swf', root))), P047_SOURCE.swfSha256);
  const modelRaw = read('native-v1/source-model-v1.json');
  assert.equal(hash(modelRaw), P047_SOURCE.modelSha256);
  const m = JSON.parse(modelRaw);
  assert.deepEqual(m.drags.map((r: {id: P047Id; value: string}) => [r.id, r.value]),
    Object.entries(P047_VALUES).map(([id, value]) => [Number(id), value]));
  assert.deepEqual(m.drags.map((r: {textId: number}) => r.textId), [40, 41, 39, 42, 40]);
  const base = 'audit-v1/ffdec-export/scripts/';
  for (const [sprite, depth] of [[63, 81], [61, 75], [64, 84]]) {
    const release = read(`${base}DefineSprite_117/frame_208/PlaceObject2_${sprite}_${depth}/CLIPACTIONRECORD on(releaseOutside,release).as`);
    assert.match(release, /tempMcName = "Tar_" \+ _name.substring/);
    assert.match(release, /_global.quizDragCount\+\+/);
    assert.match(release, /enabled = false/);
    assert.match(release, /_X = oX/);
    assert.match(release, /_parent.Coach_audio_1.gotoAndPlay\(2\)/);
    assert.match(release, /_parent.Coach_audio_2.gotoAndPlay\(2\)/);
  }

  for (const [sprite, depth] of [[62,78],[65,87]]) {
    const release=read(`${base}DefineSprite_117/frame_208/PlaceObject2_${sprite}_${depth}/CLIPACTIONRECORD on(releaseOutside,release).as`);
    assert.match(release, /_parent.Drop_mc1/); assert.match(release, /_parent.Drop_mc2/);
    assert.match(release, /_visible = false/); assert.match(release, /_X = OrgX/);
    assert.doesNotMatch(release, /showWrongFeed/);
  }
  assert.deepEqual(m.drags.map((r: {acceptedTargets:number[]})=>r.acceptedTargets),[[1,5],[2],[3],[4],[1,5]]);
  assert.deepEqual(m.graph.points,[[-6,6],[-3,-3],[2,-4],[0,-5],[6,6]]);
  assert.match(read(`${base}DefineSprite_72/frame_20/DoAction.as`), /quizDragCount >= 5/);
  assert.match(read(`${base}DefineSprite_117/frame_889/DoAction.as`), /stop\(\)/);
  assert.deepEqual(m.streams.map((s: {spriteId: number; blockCount: number}) => [s.spriteId, s.blockCount]), [[70, 19], [72, 19], [117, 871]]);
});

test('wrong target and release outside return the source without losing earlier matches', () => {
  let s = drop(quiz(), 3, 3);
  s = drop(s, 1, 2);
  assert.equal(s.quizDragCount, 1); assert.deepEqual(s.placements, {3: 3});
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
  assert.equal(reduceP047(s, {type: 'drop', id: 1, target: 1, token: oldToken, epoch: s.epoch}).accepted, false);
  s = send(s, {type: 'drop', id: 2, target: 2, token: s.selection!.token});
  assert.equal(reduceP047(s, {type: 'pick', id: 2, epoch: s.epoch}).accepted, false);
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
  assert.equal(reduceP047(s, {type: 'advance-coach', kind: 'right', frame: 20, token: oldRight, epoch: s.epoch}).accepted, false);
  s = send(s, {type: 'advance-coach', kind: 'wrong', frame: 20, token: wrongToken});
  assert.equal(s.coaches.right!.playing, true); assert.equal(s.coaches.wrong!.frame, 1);
  assert.equal(s.mainPlaying, false);
});

test('all five matches remain held until current right coach20; main209 removes both coaches and ends889', () => {
  let s = quiz();
  for (const id of [3, 1, 5, 2, 4] as const) s = drop(s, id, id);
  assert.equal(s.quizDragCount, 5); assert.equal(s.phase, 'quiz'); assert.equal(s.mainPlaying, false);
  assert.equal(reduceP047(s, {type: 'advance-main', frame: 209, epoch: s.epoch}).accepted, false);
  s = send(s, {type: 'advance-coach', kind: 'right', frame: 19, token: s.coaches.right!.token});
  assert.equal(s.mainPlaying, false);
  s = send(s, {type: 'advance-coach', kind: 'right', frame: 20, token: s.coaches.right!.token});
  assert.equal(s.phase, 'explanation'); assert.equal(s.mainFrame, 208); assert.equal(s.quizSection, false);
  s = send(s, {type: 'advance-main', frame: 209});
  assert.deepEqual(s.coaches, {wrong: null, right: null});
  s = send(s, {type: 'advance-main', frame: 889});
  assert.equal(s.phase, 'end'); assert.equal(s.mainPlaying, false); assert.equal(s.lessonCompleted, false);
});

test('NMH and nested glossary preserve matches; paused coach callbacks stay stale after return', () => {
  let s = drop(quiz(), 5, 5); const token = s.coaches.right!.token;
  s = send(s, {type: 'open-nmh'});
  assert.equal(s.coaches.right!.playing, true);
  assert.equal(reduceP047(s, {type: 'pick', id: 1, epoch: s.epoch}).accepted, false);
  s = send(s, {type: 'glossary', buttonId: 90});
  assert.equal(s.glossary!.term, 'X-coordinate');
  s = send(s, {type: 'close-glossary'}); assert.equal(s.nmhVisible, true);
  assert.equal(reduceP047(s, {type: 'advance-coach', kind: 'right', frame: 20, token, epoch: s.epoch}).accepted, false);
  s = send(s, {type: 'close-nmh'}); assert.equal(s.quizDragCount, 1);
  s = send(s, {type: 'play'}); assert.equal(s.mainPlaying, false); assert.equal(s.coaches.right!.playing, true);
});

test('explicit SA holds all tracks, return preserves matches, Replay and leave invalidate the entire run', () => {
  let s = drop(quiz(), 2, 2); const token = s.coaches.right!.token;
  s = send(s, {type: 'spanish'}); assert.equal(s.spanishSelected, true);
  assert.equal(reduceP047(s, {type: 'pick', id: 1, epoch: s.epoch}).accepted, false);
  s = send(s, {type: 'return-spanish'}); assert.equal(s.mainPlaying, false); assert.equal(s.quizDragCount, 1);
  assert.equal(reduceP047(s, {type: 'advance-coach', kind: 'right', frame: 20, token, epoch: s.epoch}).accepted, false);
  const oldEpoch = s.epoch; s = send(s, {type: 'replay'});
  assert.deepEqual(s, initialP047State(oldEpoch + 1));
  assert.equal(reduceP047(s, {type: 'advance-coach', kind: 'right', frame: 20, token, epoch: oldEpoch}).accepted, false);
  s = send(s, {type: 'leave'}); assert.equal(s.phase, 'left');
  assert.equal(reduceP047(s, {type: 'play', epoch: s.epoch}).accepted, false);
});

test('pointer cancellation has no wrong feedback and invalid source/frame values fail closed', () => {
  let s = send(quiz(), {type: 'pick', id: 4});
  s = send(s, {type: 'cancel-drag', token: s.selection!.token});
  assert.equal(s.tryAgainVisible, false); assert.deepEqual(s.coaches, {wrong: null, right: null});
  assert.equal(reduceP047(s, {type: 'pick', id: 6 as P047Id, epoch: s.epoch}).accepted, false);
  const intro = send(initialP047State(), {type: 'play'});
  for (const frame of [0, -1, NaN, 1.5, 890])
    assert.equal(reduceP047(intro, {type: 'advance-main', frame, epoch: intro.epoch}).accepted, false);
});


test('both 6 cards accept either visible target, preserving a bijection in both permutations',()=>{
  for(const destinations of [[1,5],[5,1]] as const){
    let s=drop(quiz(),1,destinations[0]); s=drop(s,5,destinations[1]);
    assert.deepEqual(s.placements,{1:destinations[0],5:destinations[1]});
    assert.deepEqual(s.targets,{[destinations[0]]:1,[destinations[1]]:5});
    assert.equal(s.quizDragCount,2);
  }
});
test('occupied duplicate target cannot be overwritten, then the remaining target still accepts',()=>{
  let s=drop(quiz(),5,1);s=drop(s,1,1);
  assert.equal(s.quizDragCount,1);assert.deepEqual(s.targets,{1:5});assert.deepEqual(s.placements,{5:1});
  assert.equal(s.tryAgainVisible,true);s=drop(s,1,5);
  assert.equal(s.quizDragCount,2);assert.deepEqual(s.targets,{1:5,5:1});
});
test('duplicate wrong handlers omit the legacy wrong call while fixed handlers retain it',()=>{
  for(const id of [1,2,3,4,5] as const){
    const s=send(quiz(),{type:'pick',id});
    const r=reduceP047(s,{type:'drop',id,target:null,token:s.selection!.token,epoch:s.epoch});
    assert(r.accepted);assert.equal(r.state.tryAgainVisible,true);
    assert.equal(r.effects.some(e=>e.type==='legacy:unboundCall'&&e.name==='showWrongFeed'),![1,5].includes(id));
    assert(r.effects.some(e=>e.type==='coach:play'&&e.kind==='wrong'));
  }
});
