import assert from 'node:assert/strict';
import test from 'node:test';

import {bridgeHostCall, resolvePageJump} from '../src/hfr/host-bridge';
import {hfrPageComplete} from '../src/hfr/renderer';
import type {HfrPageMeta} from '../src/hfr/types';

const meta: HfrPageMeta = Object.freeze({
  key: 'shared-nms002-l07-p041',
  lessonKey: 'shared-nms002-l07',
  dataUrl: '/hfr/abc/shared-nms002-l07-p041/shared-nms002-l07-p041.data.json',
  sourceSha256: '0'.repeat(64),
  compiler: 'hfr-compile 0.1.0',
  stage: {width: 800, height: 600, fps: 12},
  progressTimeline: 193,
  progressFrameCount: 777,
  completionMode: 'timeline',
  lessonPagesByFile: {L7GS02: 'shared-nms002-l07-p041', L7GS03: 'shared-nms002-l07-p042'},
  previousKey: 'shared-nms002-l07-p040',
  nextKey: 'shared-nms002-l07-p042',
  hasSpanishNarration: true,
});

const call = (kind: string, ...args: unknown[]) => ({tick: 1, kind, args});

test('doNeedMoreHelp is an in-lesson page jump by source file', () => {
  assert.deepEqual(bridgeHostCall(meta, call('shell.doNeedMoreHelp', 'L7GS03', 1)), {
    kind: 'request',
    request: {type: 'navigate', targetAnimationId: 'shared-nms002-l07-p042'},
  });
  assert.equal(resolvePageJump(meta, 'GS/l7gs03.swf'), 'shared-nms002-l07-p042');
  // A page that is not active in this lesson (for example a commented-out XML page) stays put.
  assert.deepEqual(bridgeHostCall(meta, call('shell.doNeedMoreHelp', 'L7GS01', 1)), {kind: 'none'});
  assert.equal(resolvePageJump(meta, 42), null);
});

test('previous and next movie calls follow the lesson order', () => {
  assert.deepEqual(bridgeHostCall(meta, call('shell.doPlayNextMovie')), {
    kind: 'request',
    request: {type: 'navigate', targetAnimationId: 'shared-nms002-l07-p042'},
  });
  assert.deepEqual(bridgeHostCall(meta, call('shell.doPlayPreviousMovie')), {
    kind: 'request',
    request: {type: 'navigate', targetAnimationId: 'shared-nms002-l07-p040'},
  });
});

test('doCloseApp finishes the lesson; bookmarks stay inside the page', () => {
  assert.deepEqual(bridgeHostCall(meta, call('shell.doCloseApp')), {kind: 'lesson-finished'});
  assert.deepEqual(bridgeHostCall(meta, call('shell.setBookMark')), {kind: 'none'});
  assert.deepEqual(bridgeHostCall(meta, call('shell.getBookMark')), {kind: 'none'});
});

test('feedback becomes bounded practice feedback, never a raw answer', () => {
  const right = bridgeHostCall(meta, call('shell.showRightFeed'));
  assert.deepEqual(right, {
    kind: 'request',
    activity: true,
    request: {
      type: 'record-practice-feedback',
      interactionId: meta.key,
      outcome: 'correct',
      branchIndex: 1,
      branchCount: 1,
    },
  });
  const wrong = bridgeHostCall(meta, call('shell.showWrongFeed'));
  assert.equal(wrong.kind === 'request' && wrong.request.type === 'record-practice-feedback' && wrong.request.outcome, 'incorrect');
});

test('activity signals and legacy endpoints', () => {
  assert.deepEqual(bridgeHostCall(meta, call('shell.nav.next_mc', 'active')), {kind: 'activity'});
  assert.deepEqual(bridgeHostCall(meta, call('shell.nav.next_mc', 'inactive')), {kind: 'none'});
  assert.deepEqual(bridgeHostCall(meta, call('shell.enableQuizButton')), {kind: 'activity'});
  assert.deepEqual(bridgeHostCall(meta, call('getURL', 'http://example.invalid/report?Student_ID=1', '_blank', 0)), {
    kind: 'request',
    request: {type: 'legacy', operation: 'getURL', target: 'http://example.invalid/report?Student_ID=1'},
  });
  assert.deepEqual(bridgeHostCall(meta, call('sandboxed.LoadVars.send', 'x')), {
    kind: 'request',
    request: {type: 'legacy', operation: 'loadVariables'},
  });
  assert.deepEqual(bridgeHostCall(meta, call('shell.DoHyperLinks')), {kind: 'none'});
  assert.deepEqual(bridgeHostCall(meta, call('trace', 'hello')), {kind: 'none'});
});

test('page completion follows the page kind', () => {
  const idle = {settled: false, reachedEnd: false, activity: false, lessonFinished: false};
  assert.equal(hfrPageComplete('timeline', idle), false);
  assert.equal(hfrPageComplete('timeline', {...idle, settled: true}), true);
  assert.equal(hfrPageComplete('timeline', {...idle, reachedEnd: true}), true);
  // An activity page is not done just because it is waiting for the learner.
  assert.equal(hfrPageComplete('activity', {...idle, settled: true, reachedEnd: true}), false);
  assert.equal(hfrPageComplete('activity', {...idle, activity: true}), true);
  assert.equal(hfrPageComplete('activity', {...idle, lessonFinished: true}), true);
});
