import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {AnimationRendererProps} from '../contract';
import type {LessonTextActivitySnapshot} from '../lesson-text-contract';
import {G4_L4_NINE_PAIR_CONFIGS as raw} from './generated/g4-l4-nine-pair-config';
import {createNinePairState as create, synchronizeNinePairState as sync, chooseNinePairCard as choose,
  tickNinePairFade as tick, finishNinePairFeedback as finish, observeNinePairFeedback as observe,
  setNinePairHelp as help, getNinePairCardState as cardState, getNinePairSnapshot as snapshot,
  NinePairScene, type NinePairConfig, type NinePairState} from './g4-l4-nine-pair';
import {G4_L4_TI004_TEXT_PRESENTATION as P4} from './g4-l4-ti004';
import {G4_L4_TI005_TEXT_PRESENTATION as P5} from './g4-l4-ti005';
import M4 from '../modules/course-g04-l04-ti-004';
import M5 from '../modules/course-g04-l04-ti-005';
const C = raw as readonly NinePairConfig[], P = [P4, P5], M = [M4, M5];
const root = process.env.NINE_PAIR_CANDIDATE_ROOT ?? process.cwd();
const runtime = (c: NinePairConfig): AnimationRendererProps => ({frame: c.activityFrame, frameDomain: c.frameDomain, rootFrame: 6, lang: 'en', scenario: 'source-static-frame', seed: 0, replay: 0, onLessonActivityRequest: () => true, onLessonFrameRequest: () => true});
const activity = (c: NinePairConfig, s: NinePairState, frame = 27, revision = s.attempts): LessonTextActivitySnapshot => {
  const d = c.activities.find(row => row.id === s.feedback!.id)!;
  return {id: d.id, sourceInstanceId: d.sourceInstanceId, frameDomain: d.frameDomain, frame, revision, status: frame === 27 ? 'completed' : 'playing'};
};
const pair = (c: NinePairConfig, s: NinePairState, number: number, reverse = false, r = runtime(c)) => {
  const names = [`Mc${number}_1`, `Mc${number}_2`]; if (reverse) names.reverse();
  return choose(c, choose(c, s, names[0], r), names[1], r);
};
test('own source identities, pair answers and source order remain distinct', () => {
  const expected = [
    ['664', '686', '1,399', '1,472', '1,235', '1,138', '1,509', '1,386', '1,225'],
    ['148', '317', '373', '276', '157', '82', '93', '379', '246'],
  ];
  for (const [index, c] of C.entries()) {
    assert.equal(c.cards.length, 18); assert.equal(new Set(c.cards.map(row => row.id)).size, 18);
    for (let n = 1; n <= 9; n++) assert.equal(c.cards.find(row => row.id === `Mc${n}_1`)!.text, expected[index][n - 1]);
    assert.equal(c.activityFrame, index ? 108 : 115); assert.equal(c.frameCount, index ? 112 : 116);
    assert.deepEqual(c.answerOrder, index ? ['Mc9_1', 'Mc6_1', 'Mc5_1', 'Mc4_1', 'Mc2_1', 'Mc7_1', 'Mc8_1', 'Mc3_1', 'Mc1_1'] : ['Mc4_1', 'Mc1_1', 'Mc7_1', 'Mc5_1', 'Mc8_1', 'Mc2_1', 'Mc6_1', 'Mc3_1', 'Mc9_1']);
  }
});
test('all 648 ordered card combinations distinguish pairs, same side and repeated same card', () => {
  for (const c of C) {
    let correct = 0, wrong = 0;
    for (const first of c.cards) for (const second of c.cards) {
      const r = runtime(c), selected = choose(c, create(), first.id, r);
      assert.equal(selected.selected, first.id); assert.equal(selected.score, 0); assert.equal(selected.attempts, 0);
      const s = choose(c, selected, second.id, r), expected = first.pair === second.pair && first.side !== second.side;
      assert.equal(s.feedback!.id, expected ? 'correct' : 'wrong'); assert.equal(s.score, expected ? 10 : -2);
      assert.equal(s.selected, null); assert.equal(s.attempts, 1); assert.deepEqual(s.matched, []);
      if (expected) correct++; else wrong++;
    }
    assert.equal(correct, 18); assert.equal(wrong, 306);
  }
});
test('invalid identities and refused child requests commit no second selection or score', () => {
  for (const c of C) {
    const r = runtime(c), empty = create();
    for (const delta of [{paused: true}, {frame: c.activityFrame - 1}, {lang: 'es'}, {rootFrame: 5}, {frameDomain: 'root'}, {seed: 1}, {replay: 1}, {scenario: 'other'}, {entryStateSha256: 'capture'}, {onLessonActivityRequest: undefined}, {onLessonFrameRequest: undefined}]) assert.equal(choose(c, empty, 'Mc1_1', {...r, ...delta} as any), empty);
    assert.equal(choose(c, empty, 'missing', r), empty);
    const first = choose(c, empty, 'Mc1_1', r);
    assert.equal(choose(c, first, 'Mc1_2', {...r, onLessonActivityRequest: () => false}), first);
    assert.equal(choose(c, first, 'Mc1_2', {...r, paused: true}), first);
    assert.equal(choose(c, help(c, first, true, r), 'Mc1_2', r).selected, 'Mc1_1');
  }
});
test('wrong attempts can repeat indefinitely and return focus without completing a pair', () => {
  for (const c of C) {
    const r = runtime(c); let s = create();
    for (let i = 0; i < 12; i++) {
      s = choose(c, choose(c, s, 'Mc1_1', r), 'Mc1_1', r);
      assert.equal(s.feedback!.id, 'wrong'); assert.equal(s.score, -2 * (i + 1));
      assert.equal(choose(c, s, 'Mc1_2', r), s);
      s = finish(c, s, {...r, lessonActivities: [activity(c, s)]});
      assert.equal(s.feedback, null); assert.equal(s.focusTarget, 'Mc1_1'); assert.deepEqual(s.matched, []);
    }
  }
});
test('four source interval ticks preserve reveal, alpha and hide semantics', () => {
  for (const c of C) {
    let s = pair(c, create(), 1), serial = s.feedback!.serial;
    for (let i = 0; i <= 4; i++) {
      const card = cardState(c, s, c.cards.find(row => row.id === 'Mc1_1')!, c.activityFrame);
      assert(Math.abs(card.alpha - [1, .6, .2, 0, 0][i]) < 1e-12);
      assert.equal(card.hidden, i === 4); assert.equal(card.reveal, i > 0);
      assert.equal(tick(c, s, serial + 1), s);
      const other = cardState(c, s, c.cards.find(row => row.id === 'Mc2_1')!, c.activityFrame); assert.equal(other.alpha, 1); assert.equal(other.reveal, false);
      if (i < 4) s = tick(c, s, serial);
    }
    assert.equal(tick(c, s, serial), s);
  }
});
test('only the exact current feedback revision can finish; duplicate and foreign snapshots fail closed', () => {
  for (const c of C) {
    const r = runtime(c), s = pair(c, create(), 1), a = activity(c, s);
    for (const entries of [[], [{...a, id: 'other'}], [{...a, sourceInstanceId: 'foreign'}], [{...a, frameDomain: 'root'}], [{...a, revision: -1}], [{...a, revision: 1.5}], [{...a, frame: NaN}], [{...a, frame: 1}], [{...a, frame: 28}], [a, a], [a, {...a, id: 'other'}]]) {
      assert.equal(observe(c, s, entries).bound, false); assert.equal(finish(c, s, {...r, lessonActivities: entries}), s);
    }
    assert.equal(finish(c, s, {...r, lessonActivities: [{...a, status: 'playing'}]}), s);
    assert.equal(finish(c, s, {...r, lessonActivities: [a], paused: true}), s);
    assert.equal(observe(c, {...s, feedbackRevision: 1}, [{...a, revision: 2}]).bound, false);
    const stale = pair(c, create(), 1, false, {...r, lessonActivities: [{...a, revision: 8}]});
    assert.equal(stale.feedback!.revisionFloor, 8); assert.equal(observe(c, stale, [{...a, revision: 8}]).bound, false);
    assert(observe(c, stale, [{...a, revision: 9}]).bound);
  }
});
test('parent stays held for eight pairs and advances once only after ninth feedback and host acceptance', () => {
  for (const c of C) {
    let requests = 0, allow = false, s = create();
    const r = {...runtime(c), onLessonFrameRequest: (edge: any) => {assert.deepEqual(edge, {fromFrame: c.activityFrame, toFrame: c.activityFrame + 1, stopFrame: c.frameCount}); requests++; return allow;}};
    for (let n = 1; n <= 9; n++) {
      s = pair(c, s, n, n % 2 === 0, r);
      assert.equal(s.score, n * 10); assert.equal(s.matched.length, n - 1);
      const a = activity(c, s), done = {...r, lessonActivities: [a]};
      if (n === 9) {assert.equal(finish(c, s, done), s); assert.equal(requests, 1); allow = true;}
      s = finish(c, s, done); assert.equal(s.matched.length, n); assert.equal(s.feedback, null);
      assert.equal(choose(c, s, `Mc${n}_1`, r), s);
      if (n < 9) assert.equal(requests, 0);
      else {assert.equal(requests, 2); assert.equal(s.pendingFromFrame, c.activityFrame); assert.equal(finish(c, s, done), s);}
    }
    s = sync(c, s, {...r, frame: c.activityFrame + 1}); assert.equal(s.pendingFromFrame, null); assert.equal(s.matched.length, 9);
  }
});
test('help retains selected card and permits source feedback completion while the popup is open', () => {
  for (const c of C) {
    const r = runtime(c), first = choose(c, create(), 'Mc1_1', r), opened = help(c, first, true, r);
    assert.equal(opened.selected, first.selected); assert.equal(help(c, opened, false, {...r, paused: true}), opened);
    const closed = help(c, opened, false, r); assert.equal(closed.focusTarget, 'help-button'); assert.equal(closed.selected, 'Mc1_1');
    const pending = choose(c, closed, 'Mc1_2', r), during = help(c, pending, true, r); assert(during.help);
    const finished = finish(c, during, {...r, lessonActivities: [activity(c, during)]}); assert(finished.help); assert.deepEqual(finished.matched, [1]);
    const end = sync(c, finished, {...r, frame: c.frameCount});
    assert.equal(help(c, help(c, end, false, {...r, frame: c.frameCount}), true, {...r, frame: c.frameCount}).help, c.animationId.endsWith('004'));
  }
});
test('Replay, seed change and backward seek discard owned feedback, matching and help', () => {
  for (const c of C) {
    const r = runtime(c), s = help(c, pair(c, create(), 1), true, r);
    assert.deepEqual(sync(c, s, {...r, replay: 1}), create(0, 1, c.activityFrame));
    assert.deepEqual(sync(c, s, {...r, seed: 2}), create(2, 0, c.activityFrame));
    assert.deepEqual(sync(c, s, {...r, frame: 1}), create());
    const terminal = sync(c, {...s, matched: [1, 2]}, {...r, frame: c.frameCount});
    assert.equal(terminal.feedback, null); assert.equal(terminal.feedbackRevision, null);
    assert.deepEqual(sync(c, terminal, r), create(0, 0, c.activityFrame));
  }
});
test('source feedback lettering, image mechanisms and regrouping distinctions are retained', () => {
  assert.equal(C[0].reward.mode, 'underlay-reveal'); assert.equal(C[1].reward.mode, 'paired-image-reveal');
  assert.equal(C[0].help.strikeLines.length, 0); assert.equal(C[1].help.strikeLines.length, 4);
  assert.equal(C[0].text['help-math'], '598 + 243 = 841'); assert.equal(C[1].text['help-math'], '412 − 173 = 239');
  assert.deepEqual(C[1].help.carry.map(row => row.text).sort(), ['0', '10', '12', '3']);
  for (const c of C) {
    assert.equal(c.activities.length, 4); assert.equal(c.reward.tiles.length, 9);
    assert.deepEqual(c.feedback.flatMap(branch => branch.labels.map(label => c.text[label.id])).sort(), ['Great Job!', 'OH! NO', 'ROCKET']);
    assert.equal(c.activities.filter(row => row.buttonPress).length, 2);
    for (const d of c.activities.filter(row => !row.buttonPress)) assert.deepEqual([d.startFrame, d.endFrame, d.fps], [2, 27, 12]);
  }
});
test('actual wrappers retain source identity, independent host clocks and explicit Spanish Audio', () => {
  for (const [index, c] of C.entries()) {
    const p = P[index], m = M[index], r = runtime(c), state = m.getFrameState(r.frame, r);
    assert.equal(p.getSnapshot(state, r).status, 'ready'); assert.deepEqual(p.binding, c.binding);
    assert.equal(p.playbackEndFrameByDomain![c.frameDomain], c.activityFrame); assert.deepEqual(p.reducedMotionFrameByDomain, p.playbackEndFrameByDomain);
    assert.deepEqual(p.activityTimelines, c.activities); assert.deepEqual(p.sourceTimelineAudioCues, c.sourceAudio); assert.deepEqual(p.keyTerms, c.keyTerms);
    assert(m.audioTracks); assert.equal(m.audioTracks.length, 1); const sa = m.audioTracks[0];
    assert.equal(sa.activation, 'user'); assert.deepEqual(sa.visibleWhen, ['es']); assert.equal(sa.timelineBehavior, 'pause-while-playing');
    for (const source of [sa, c.sourceAudio[0], c.reward]) assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'apps/web/public' + source.source))).digest('hex'), source.sha256);
    for (const delta of [{lang: 'es'}, {frame: 0}, {frame: r.frame - 1}, {seed: 3}, {rootFrame: 5}, {frameDomain: 'root'}, {scenario: 'other'}, {entryStateSha256: 'capture'}]) assert.equal(snapshot(c, state, {...r, ...delta} as any).status, 'blocked');
    for (const delta of [{animationId: 'foreign'}, {sourceSwfSha256: '0'.repeat(64)}, {status: 'loading'}, {rootFrame: 5}, {language: 'es'}]) assert.equal(snapshot(c, {...state, ...delta} as any, r).status, 'blocked');
  }
});
test('native scene uses DOM words and numerals, with only photo artwork in SVG', () => {
  for (const c of C) {
    const r = runtime(c), html = renderToStaticMarkup(<NinePairScene config={c} runtime={r} session={create()} onChoose={() => {}}/>);
    assert.doesNotMatch(html, /<canvas|<foreignObject|<text[ >]/); assert.equal((html.match(/data-pair-card=/g) ?? []).length, 18);
    for (const card of c.cards) assert(html.includes('>' + card.text + '</button>'));
    const popup = renderToStaticMarkup(<NinePairScene config={c} runtime={r} session={help(c, create(), true, r)} onHelp={() => {}}/>);
    assert(popup.includes('aria-modal="true"')); assert(popup.includes('data-source-keyterm="Problem"'));
    assert.equal((popup.match(/data-source-strike-shape=/g) ?? []).length, c.help.operator === '+' ? 0 : 4);
    assert.doesNotMatch(popup, /<canvas|<foreignObject|<text[ >]/);
  }
});
