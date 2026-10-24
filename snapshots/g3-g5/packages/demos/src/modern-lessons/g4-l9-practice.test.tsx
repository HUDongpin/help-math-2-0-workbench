import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {G4_L9_PRACTICE_CONFIGS as configs, G4_L9_PRACTICE_HOST_AUDIO_CANDIDATES as hostAudio} from './generated/g4-l9-practice-config';
import {PracticeScene, getPracticeSnapshot} from './g4-l4-practice';
import {createPracticeState, proposePracticeAction, synchronizePracticeState} from './g4-l4-practice-state';
import {numberLineValue as at} from './g4-l4-number-line';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import {G4_L9_TS007_TEXT_PRESENTATION as presentation039} from './g4-l9-ts007';
import {G4_L9_TS008_TEXT_PRESENTATION as presentation040} from './g4-l9-ts008';
import {getCourseG04L09Ts007FrameState} from '../modules/course-g04-l09-ts-007';
import {getCourseG04L09Ts008FrameState} from '../modules/course-g04-l09-ts-008';

const expected = [
  {page: 'g04-l09-placement-039', domain: 'sprite-378', frameCount: 821, finalFrame: 802,
    holds: [323, 485, 615, 739], right: 'B', wrong3: 'sprite-378/depth-272/generation-1',
    step0: 'main-62', helpDomain: 'sprite-167'},
  {page: 'g04-l09-placement-040', domain: 'sprite-388', frameCount: 898, finalFrame: 879,
    holds: [372, 534, 664, 788], right: 'C', wrong3: 'sprite-388/depth-302/generation-1',
    step0: 'main-63', helpDomain: 'sprite-177'},
];
const runtime = (c: typeof configs[number], frame: number, seed = 2) => ({
  frame, seed, replay: 0, rootFrame: 6, frameDomain: c.frameDomain, lang: 'en' as const,
  scenario: 'source-static-frame', paused: false, onLessonFrameRequest: () => true,
  onLessonActivityRequest: () => true, onLessonHostRequest: () => undefined,
});
const sourceState = (c: typeof configs[number], frame: number) => ({
  status: 'ready', blocker: null, animationId: c.animationId, sourceSwfSha256: c.sourceSha256,
  frame, frameDomain: c.frameDomain, rootFrame: 6, language: 'en', scenario: 'source-static-frame', seed: 2,
});

for (const [index, c] of configs.entries()) {
  const own = expected[index];
  test(c.animationId+' actual module frame state reaches the native presentation', () => {
    const presentation = [presentation039, presentation040][index];
    const getter = [getCourseG04L09Ts007FrameState, getCourseG04L09Ts008FrameState][index];
    const r = runtime(c, c.finalFrame);
    const state = getter(r.frame, r);
    assert.equal(presentation.getSnapshot(state, r).status, 'ready');
    assert.equal(presentation.activityTimelines?.length, 12);
    assert.equal(presentation.sourceTimelineAudioCues?.length, 1);
    const Renderer = presentation.Renderer;
    assert(Renderer);
    const html = renderToStaticMarkup(<Renderer {...r} state={state}/>);
    assert(html.includes('data-modern-text-page="'+c.animationId+'"'));
    assert.doesNotMatch(html, /<canvas/);
  });
  test(c.animationId+' uses its own holds, source instances and explicit step ownership', () => {
    validateLessonTextBinding(c.binding);
    assert.equal(c.placementId, own.page);
    assert.equal(c.frameDomain, own.domain);
    assert.equal(c.frameCount, own.frameCount);
    assert.equal(c.finalFrame, own.finalFrame);
    assert.deepEqual(c.steps.map(s => s.hold), own.holds);
    assert.equal(c.answers.find(a => a.correct)?.id, own.right);
    assert.equal(c.feedback.filter(f => f.kind === 'wrong' && f.variant === 3).length, 1);
    assert.equal(c.feedback.find(f => f.id === 'wrong-3')?.sourceInstanceId, own.wrong3);
    assert.deepEqual(c.feedback.filter(f => f.kind === 'correct').map(f => f.variant), [1, 2, 3, 4]);
    assert.equal(c.stepCopy.find(b => b.stepIndex === 0)?.id, own.step0);
    assert(c.stepCopy.every(b => b.id !== 'main-48' && b.stepIndex !== undefined));
    assert.equal(c.panels.find(p => p.id === 'help')?.column.frameDomain, own.helpDomain);
  });

  test(c.animationId+' keeps the full seven-level question fade and restores blue after each pulse', () => {
    const q = c.question[0];
    const alpha = [0, 43/256, 85/256, 128/256, 171/256, 213/256, 1];
    for (let i = 0; i < alpha.length; i++) {
      assert(q.tokens.every(t => at(t.alpha, i+8, 0) === alpha[i]));
    }
    const pulse = index === 0 ? [20, 22, 24] : [19, 21, 23];
    const word = q.tokens.find(t => t.text.trim() === (index === 0 ? 'number' : 'sum'))!;
    assert(word.keyTerm);
    assert.equal(at(word.alpha, 14, 0), 1);
    for (const frame of pulse) {
      assert.equal(at(word.color!, frame, ''), '#ff00ff');
      assert.equal(at(word.color!, frame+1, ''), '#0000cc');
      assert.equal(at(word.alpha, frame+1, 0), 1);
    }
    for (const token of q.tokens.filter(t => t.keyTerm)) {
      const magenta = token.color?.find(v => v[1] === '#ff00ff')?.[0];
      assert(magenta);
      const active = runtime(c, magenta);
      const paint = renderToStaticMarkup(<PracticeScene config={c} runtime={active} session={createPracticeState(active)}/>);
      const match = paint.match(new RegExp('<span[^>]*style="opacity:1;color:#ff00ff"[^>]*><button([^>]*)data-source-keyterm="'+token.keyTerm!.key+'"([^>]*)>'));
      assert(match, token.keyTerm!.key+' must remain inside the source magenta token');
      assert.doesNotMatch(match[1]+match[2], /style=/, 'the word button must inherit the token color');
    }
    const r = runtime(c, 14);
    const html = renderToStaticMarkup(<PracticeScene config={c} runtime={r} session={createPracticeState(r)}/>);
    assert.match(html, /data-source-keyterm=/);
    assert.match(html, /data-keyterm-entry-id="en-/);
    assert.doesNotMatch(html, /<canvas|<foreignObject/);
  });

  test(c.animationId+' retains every completed section on the main timeline', () => {
    const r = runtime(c, c.finalFrame);
    const html = renderToStaticMarkup(<PracticeScene config={c} runtime={r} session={createPracticeState(r)}/>);
    assert.equal((html.match(/data-retained-panel=/g) ?? []).length, 2);
    const snapshot = getPracticeSnapshot(c, sourceState(c, r.frame) as any, r);
    assert.equal(snapshot.status, 'ready');
    for (const panel of c.completedPanels) {
      for (const section of [panel, ...(panel.sections ?? [])]) {
        for (const b of [section.heading, ...section.before, ...section.after, ...section.column.blocks.slice(1)]) {
          assert(html.includes('data-lesson-text-block="'+b.id+'"'), b.id);
          assert.equal(snapshot.blocks.find(v => v.id === b.id)?.visible, true, b.id);
        }
        assert(section.column.blocks.slice(1).every(b => b.sourceInstances.every(i => i.startsWith(c.frameDomain+'/'))));
      }
    }
    for (const delta of [{rootFrame: 5}, {frameDomain: 'root'}, {lang: 'es'}, {seed: 3}, {frame: 0}]) {
      assert.equal(getPracticeSnapshot(c, sourceState(c, r.frame) as any, {...r, ...delta} as any).status, 'blocked');
    }
  });

  test(c.animationId+' selected wrong3 preserves source RGB and rejects premature or foreign completion', () => {
    const r = runtime(c, c.finalFrame);
    const first = proposePracticeAction(c, createPracticeState(r), r, {type: 'choose', choice: 'A', revisionFloor: 3})!;
    assert.equal(first.request?.kind, 'activity');
    assert.equal(first.state.feedback?.definition.id, 'wrong-3');
    const d = first.state.feedback!.definition;
    const proof = {...d, frame: d.endFrame, revision: 4, status: 'completed'};
    for (const delta of [{frame: 28}, {revision: 3}, {frameDomain: 'sprite-222'}, {sourceInstanceId: 'other'}]) {
      assert.equal(proposePracticeAction(c, first.state, r, {type: 'activity-completed', proof: {...proof, ...delta}}), null);
    }
    const activity = {...d, frame: 7, revision: 4, status: 'playing'} as any;
    const html = renderToStaticMarkup(<PracticeScene config={c} runtime={r}
      session={first.state} activities={[activity]}/>);
    assert.match(html, /Try Again!/);
    assert.match(html, /color:rgba\(246\.953125,235\.0,235\.0,1\.0\)/);
    const label = c.feedbackViews.find(v => v.id === 'wrong-3')!.labels[0];
    assert.equal(at(label.alpha, 7, 0), 1);
    assert.equal(at(label.color!, 10, ''), 'rgba(153.0,0,0,1.0)');
    const done = proposePracticeAction(c, first.state, r, {type: 'activity-completed', proof})!;
    assert.equal(done.state.wrongAttempts, 1);
    assert.equal(done.request, undefined);
    const again = proposePracticeAction(c, done.state, r, {type: 'choose', choice: 'A', revisionFloor: 4})!;
    const next = again.state.feedback!.definition;
    const completed = proposePracticeAction(c, again.state, r, {type: 'activity-completed',
      proof: {...next, frame: next.endFrame, revision: 5, status: 'completed'}})!;
    assert.deepEqual(completed.request, {kind: 'frame', transition: c.finalTransition});
    assert.equal(proposePracticeAction(c, completed.state, r, {type: 'activity-completed', proof}), null);
  });

  test(c.animationId+' native step Close requires the exact own child endpoint and Replay clears it', () => {
    const step = c.steps[2], r = runtime(c, step.hold);
    const opened = proposePracticeAction(c, createPracticeState(r), r, {type: 'open-step', revisionFloor: 1})!;
    assert.equal(proposePracticeAction(c, opened.state, r, {type: 'close-step'}), null);
    const proof = {...step.box!, frame: 15, revision: 2, status: 'completed'};
    const ready = proposePracticeAction(c, opened.state, r, {type: 'activity-completed', proof})!;
    assert.deepEqual(proposePracticeAction(c, ready.state, r, {type: 'close-step'})?.request,
      {kind: 'frame', transition: step.transition});
    assert.equal(proposePracticeAction(c, ready.state, {...r, paused: true}, {type: 'close-step'}), null);
    assert.deepEqual(synchronizePracticeState(c, ready.state, {...r, frame: 1, replay: 1}),
      createPracticeState({...r, frame: 1, replay: 1}));
  });

  test(c.animationId+' binds the selected audio interface without changing the child clocks', () => {
    assert.equal(c.activities.length, 12);
    assert.equal(c.sourceAudio.length, 1);
    assert.equal(c.sourceAudio[0].frame, 14);
    assert.equal(c.sourceAudio[0].endFrame, c.frameCount+1);
    assert.equal(c.sourceAudio[0].frameDomain, c.frameDomain);
    const wrong = c.activities.find(a => a.id === 'wrong-3')!;
    assert.equal(wrong.sourceInstanceId, own.wrong3);
    assert.equal(wrong.startFrame, 2);
    assert.equal(wrong.endFrame, 29);
    assert.equal(wrong.audio?.sha256, '5bfd44f657eb1ee276cbae924e79bf448bfb0e6d7bef7515164118f295726f4d');
    assert.equal(wrong.audio?.offsetSeconds, 1673/22050);
    const right = c.activities.find(a => a.id === 'correct-2')!;
    assert.equal(right.startFrame, 2);
    assert.equal(right.endFrame, 25);
    assert.equal(right.audio?.firstFrame, 1);
    assert.equal(right.audio?.lastFrame, 13);
    assert.equal(right.audio?.offsetSeconds, 0);
    assert.match(right.audio!.source, /correct-4\.wav$/);
    for(const step of c.steps.filter(s => s.box)) {
      assert.equal(c.activities.find(a => a.id === step.box!.id)?.audio, undefined);
    }
    assert.equal(c.activities.filter(a => a.buttonPress).length, 3);
    const track = hostAudio[c.animationId as keyof typeof hostAudio].audioTracks[0];
    assert.equal(track.activation, 'user');
    assert.equal(track.timelineBehavior, 'pause-while-playing');
    assert.deepEqual(track.visibleWhen, ['es']);
    assert.deepEqual(track.frameDomains, [c.frameDomain]);
  });
}

test('039 repeated n × 6 = 84 instances retain separate teaching roles', () => {
  const panel = configs[0].panels.find(p => p.id === 'step-3')!;
  assert.equal(panel.before[0].text, 'n × 6 = 84');
  assert.equal(panel.column.blocks[1].text, 'n × 6 = 84');
  assert.notEqual(panel.before[0].id, panel.column.blocks[1].id);
  assert(panel.column.blocks[1].sourceInstances.includes('sprite-129/depth-31/generation-1'));
});

test('040 repeated A and B checks remain distinct and the retained check section is complete', () => {
  const c = configs[1], panel = c.panels.find(p => p.id === 'step-4')!;
  const check = panel.sections![0];
  const repeated = check.column.blocks.filter(b => b.text === '22 – 15 ≠ 37 no');
  assert.equal(repeated.length, 2);
  assert.notEqual(repeated[0].id, repeated[1].id);
  assert.notDeepEqual(repeated[0].sourceInstances, repeated[1].sourceInstances);
  const r = runtime(c, c.steps[3].hold);
  const s = {...createPracticeState(r), box: {definition: c.steps[3].box!, parentFrame: r.frame, revisionFloor: 0},
    boxReady: true};
  const html = renderToStaticMarkup(<PracticeScene config={c} runtime={r} session={s}/>);
  assert.equal((html.match(/22 – 15 ≠ 37 no/g) ?? []).length, 2);
  assert.match(html, /15 \+ 15 ≠ 37 no/);
});

test('040 main step links preserve Show and Solve and Help preserves the five-line sum diagram', () => {
  const c = configs[1], r = runtime(c, 373);
  const main = renderToStaticMarkup(<PracticeScene config={c} runtime={r} session={createPracticeState(r)}/>);
  assert.match(main, /data-source-keyterm="Show"/);
  assert.match(main, /data-source-keyterm="Solve"/);
  const final = runtime(c, c.finalFrame), help = {...createPracticeState(final), help: true};
  const html = renderToStaticMarkup(<PracticeScene config={c} runtime={final} session={help}/>);
  const panel = c.panels.find(p => p.id === 'help')!;
  const diagram = panel.column.figure.shapes.find(s => s.character === 173)!;
  assert.equal(diagram.paths.filter(p => p.fill === 'none').length, 5);
  assert.equal(diagram.paths.filter(p => p.fill !== 'none').length, 1);
  assert.match(html, /data-source-shape="173"/);
  assert.match(html, /data-source-keyterm="Sum"/);
  assert.match(html, /data-source-button="42"/);
  assert.match(html, /x \+ 6 – 6 = 8 – 6/);
  assert.match(html, /x = 2/);
});
