import assert from 'node:assert/strict';
import test from 'node:test';

import module, {
  buildCourseG03L05Ts006CaptureAttributes,
  getCourseG03L05Ts006FrameState,
} from '../src/modules/course-g03-l05-ts-006';
import {
  COURSE_G03_L05_TS_006_CONFIG,
  COURSE_G03_L05_TS_006_SOURCE,
} from '../src/timelines/course-g03-l05-ts-006';

const ENTRY_STATE = 'a'.repeat(64);

test('G3 L5 TS006 module remains an explicit source-static candidate', () => {
  assert.equal(module.key, 'course-g03-l05-ts-006');
  assert.equal(module.maturity, 'legacy-prototype');
  assert.equal(COURSE_G03_L05_TS_006_SOURCE.swfSha256,
    '404d53d6bee1288964c2f1215cb59cfb09bcc3d0141ab081ae5f07bf8dc37c53');
  assert.equal(COURSE_G03_L05_TS_006_CONFIG.mainFrameCount, 124);
  assert.equal(module.transport?.legacyBehaviorParity, false);
  assert.equal(module.transport?.audioDisposition, 'disabled-while-inspecting');
});

test('G3 L5 TS006 frame identity and capture attributes are deterministic', () => {
  const context = {
    frameDomain: 'sprite-23',
    scenario: 'source-static-frame',
    lang: 'en' as const,
    seed: 0,
    requirementId: 'req-static-sprite23-en',
    traceId: 'sprite23-static-en',
    entryStateSha256: ENTRY_STATE,
  };
  const first = getCourseG03L05Ts006FrameState(1, context);
  const last = getCourseG03L05Ts006FrameState(124, context);
  assert.equal(first.status, 'ready');
  assert.equal(first.frame, 1);
  assert.equal(first.rootFrame, 6);
  assert.equal(last.status, 'ready');
  assert.equal(last.frame, 124);
  assert.equal(last.rootFrame, 6);
  const attributes = buildCourseG03L05Ts006CaptureAttributes({
    canvasStatus: 'ready',
    entryStateSha256: ENTRY_STATE,
    frame: 124,
    frameDomain: 'sprite-23',
    lang: 'en',
    requirementId: 'req-static-sprite23-en',
    scenario: 'source-static-frame',
    seed: 0,
    state: last,
    traceId: 'sprite23-static-en',
  });
  assert.equal(attributes['data-animation-id'], 'course-g03-l05-ts-006');
  assert.equal(attributes['data-flash-frame'], 124);
  assert.equal(attributes['data-flash-frame-domain'], 'sprite-23');
  assert.equal(attributes['data-flash-entry-state-sha256'], ENTRY_STATE);
});
