import assert from 'node:assert/strict';
import test from 'node:test';
import {getCourseG04L03Ti006FrameState} from '../src/modules/course-g04-l03-ti-006';
import {getTi006TextSnapshot} from '../src/modern-lessons/g4-l3-ti006-text';
import {createCourseG04L03Ti006NumberLineDragState as initial,
  reduceCourseG04L03Ti006NumberLineDrag as reduce} from '../src/timelines/course-g04-l03-ti-006-number-line-drag-interaction';
const context = (frame: number) => ({frame, frameDomain: 'sprite-269', rootFrame: 6, scenario: 'source-static-frame', lang: 'en' as const, seed: 0});
const snapshot = (frame: number, state = initial(), help = false) => getTi006TextSnapshot(getCourseG04L03Ti006FrameState(frame, context(frame)), context(frame), state, help);

test('native TI006 main/help ranges and their visible state remain independent across the handoff', () => {
  assert.equal(snapshot(1).status, 'ready');
  assert.equal(snapshot(1).blocks.filter(b => b.visible).length, 0);
  for (const frame of [8,165,166]) {
    const s = snapshot(frame);
    assert.equal(s.status, 'ready');
    assert.equal(s.blocks.filter(b => b.id.startsWith('axis-') && b.visible).length,17);
    assert.equal(s.blocks.filter(b => b.id.startsWith('help-tick-') && b.visible).length,0);
    assert.equal(s.blocks.find(b => b.id === 'axis--8')?.text,'−8');
    assert.equal(s.blocks.find(b => b.id === 'axis-8')?.text,'+8');
  }
  const help = snapshot(166, initial(), true);
  assert.equal(help.blocks.filter(b => b.id.startsWith('help-tick-') && b.visible).length,21);
  assert.equal(help.blocks.find(b => b.id === 'help-tick-10')?.text,'10');
  assert.equal(help.blocks.find(b => b.id === 'help-tick--10')?.text,'−10');
});
test('wrong-feedback static teaching text is state-bound without claiming host assignment resolved', () => {
  const wrong = reduce(initial(), {type: 'drop-card',cardId:'Scr_1',targetId:'Mc_Tar_2'});
  assert.equal(snapshot(166,wrong).blocks.find(b => b.id === 'close-wrong')?.visible,true);
  assert.equal(snapshot(166).blocks.find(b => b.id === 'close-wrong')?.visible,false);
  assert.equal(snapshot(166,wrong).blocks.find(b => b.id === 'wrong-feedback')?.text,
    'Having money means positive numbers and owing money means negative numbers. Try again.');
  assert.equal(snapshot(166).blocks.find(b => b.id === 'wrong-feedback')?.visible,false);
});
test('identity, frame, seed, language and evidence mismatches fail closed before showing teaching text', () => {
  const c = context(166), s = getCourseG04L03Ti006FrameState(166,c);
  assert(getTi006TextSnapshot(s,c).blockers.includes('interaction-state-required'));
  for (const invalid of [{...s,sourceSwfSha256:'bad'}, {...s,rootFrame:7}, {...s,frame:165}, {...s,seed:1}, {...s,scenario:'bad'}]) {
    const r = getTi006TextSnapshot(invalid,c,initial());
    assert.equal(r.status,'blocked'); assert.deepEqual(r.blocks,[]);
  }
  for (const invalid of [{...c,lang:'es' as const}, {...c,entryStateSha256:'a'.repeat(64)}, {...c,frame:NaN}]) {
    assert.equal(getTi006TextSnapshot(s,invalid,initial()).status,'blocked');
  }
});
