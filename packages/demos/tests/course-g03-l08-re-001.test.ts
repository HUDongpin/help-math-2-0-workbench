import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import courseReview from '../src/modules/course-g03-l08-re-001';
import {
  COURSE_G03_L08_RE_001_FEEDBACK_RGB,
  COURSE_G03_L08_RE_001_LOCAL_FRAME_LABELS,
  COURSE_G03_L08_RE_001_MOVIE,
  COURSE_G03_L08_RE_001_REVIEW_COUNT_MAX,
  COURSE_G03_L08_RE_001_REVIEW_COUNT_MIN,
  COURSE_G03_L08_RE_001_REVIEW_LABEL_MAP,
  COURSE_G03_L08_RE_001_RUNTIME,
  COURSE_G03_L08_RE_001_SOURCE,
  getCourseG03L08Re001BackNavigationIntent,
  getCourseG03L08Re001FrameState,
  getCourseG03L08Re001ReviewFeedbackState,
  normalizeCourseG03L08Re001Frame,
  normalizeCourseG03L08Re001LocalFrame,
  normalizeCourseG03L08Re001ReviewCount,
  parseCourseG03L08Re001ReviewAnsPayload,
  resolveCourseG03L08Re001ReviewLabel,
  stepCourseG03L08Re001ReviewCount
} from '../src/timelines/course-g03-l08-re-001';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const migrationRoot = `${repositoryRoot}migrations/course-g03-l08-re-001`;

function sha256(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

test('RE01 binds the candidate to the preserved SWF and audited evidence', async () => {
  const evidence = [
    [COURSE_G03_L08_RE_001_SOURCE.swf, COURSE_G03_L08_RE_001_SOURCE.swfSha256],
    [
      COURSE_G03_L08_RE_001_SOURCE.avm1Scripts,
      COURSE_G03_L08_RE_001_SOURCE.avm1ScriptsSha256
    ],
    [
      'migrations/course-g03-l08-re-001/audit/scenario-inventory.json',
      COURSE_G03_L08_RE_001_SOURCE.scenarioInventorySha256
    ],
    [
      'migrations/course-g03-l08-re-001/audit/strict-readiness.json',
      COURSE_G03_L08_RE_001_SOURCE.strictReadinessSha256
    ],
    [
      'migrations/course-g03-l08-re-001/audit/audio-runtime-evidence.json',
      COURSE_G03_L08_RE_001_SOURCE.audioAuditSha256
    ],
    [
      'migrations/course-g03-l08-re-001/baseline/adobe-flash-player-32-standalone-default.json',
      COURSE_G03_L08_RE_001_SOURCE.adobeStandaloneManifestSha256
    ],
    [
      'artifacts/full-frame/pilot-baselines/course-g03-l08-re-001/adobe-flash-player-32-standalone-default/frame-0051.png',
      COURSE_G03_L08_RE_001_SOURCE.adobeStandaloneFrameSha256
    ],
    [
      'migrations/course-g03-l08-re-001/baseline/controlled-local-frame-0002-adobe-player-failed-closed.json',
      COURSE_G03_L08_RE_001_SOURCE.controlledLocalFrame2FailureSha256
    ]
  ] as const;
  for (const [path, expected] of evidence) {
    assert.equal(sha256(await readFile(`${repositoryRoot}${path}`)), expected, path);
  }
});

test('RE01 source binding contains the exact seven-segment and navigation AVM1 operations', async () => {
  const source = gunzipSync(
    await readFile(`${repositoryRoot}${COURSE_G03_L08_RE_001_SOURCE.avm1Scripts}`)
  ).toString('utf8');
  assert.match(source, /splRevAnsValue = _global\.REVIEWANS\.split\("SPL"\);/);
  assert.match(source, /_global\.arrayCorrectAnswer = splRevAnsValue\[0\]\.split\(","\);/);
  assert.match(source, /_global\.arrayWrongAnswer = splRevAnsValue\[1\]\.split\(","\);/);
  assert.match(source, /_global\.arrayResponseAnswer = splRevAnsValue\[2\]\.split\(","\);/);
  assert.match(source, /_global\.quizLabelArray = splRevAnsValue\[3\]\.split\(","\);/);
  assert.match(source, /_global\.revLabelArray = splRevAnsValue\[4\]\.split\(","\);/);
  assert.match(source, /_global\.arrayAnswer = splRevAnsValue\[5\]\.split\(","\);/);
  assert.match(source, /_global\.arrayReview = splRevAnsValue\[6\]\.split\(","\);/);
  assert.match(source, /_global\.totalQuestionsCount = "10";/);
  assert.match(source, /getURL\("javascript:history\.back\(\)"\);/);
});

test('RE01 parses exactly seven REVIEWANS segments without normalizing source strings', () => {
  const raw = [
    'A3Opt2',
    'A5Opt1',
    'A3Opt2,A5Opt1',
    'Q1,Q2,Q3,Q4,Q5',
    'R1,R2,R3,R4,R5',
    'A1Opt1,A2Opt1,A3Opt2,A4Opt1,A5Opt4',
    'R3,R5'
  ].join('SPL');
  const result = parseCourseG03L08Re001ReviewAnsPayload(raw);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.payload.raw, raw);
  assert.deepEqual(result.payload.correctAnswers, ['A3Opt2']);
  assert.deepEqual(result.payload.wrongAnswers, ['A5Opt1']);
  assert.deepEqual(result.payload.responseAnswers, ['A3Opt2', 'A5Opt1']);
  assert.deepEqual(result.payload.quizLabels, ['Q1', 'Q2', 'Q3', 'Q4', 'Q5']);
  assert.deepEqual(result.payload.reviewLabels, ['R1', 'R2', 'R3', 'R4', 'R5']);
  assert.deepEqual(result.payload.answers, [
    'A1Opt1',
    'A2Opt1',
    'A3Opt2',
    'A4Opt1',
    'A5Opt4'
  ]);
  assert.deepEqual(result.payload.reviewOrder, ['R3', 'R5']);
  assert.equal(Object.isFrozen(result.payload), true);
  assert.equal(Object.isFrozen(result.payload.segments), true);
  assert.equal(Object.isFrozen(result.payload.segments[0]), true);

  const whitespace = parseCourseG03L08Re001ReviewAnsPayload(
    [' A1Opt1 ', '', '', '', '', '', ' R1 '].join('SPL')
  );
  assert.equal(whitespace.ok, true);
  if (whitespace.ok) {
    assert.deepEqual(whitespace.payload.correctAnswers, [' A1Opt1 ']);
    assert.deepEqual(whitespace.payload.reviewOrder, [' R1 ']);
  }
});

test('RE01 REVIEWANS parser fails closed on empty, non-string, and malformed segment counts', () => {
  assert.deepEqual(parseCourseG03L08Re001ReviewAnsPayload(null), {
    ok: false,
    reason: 'payload-not-string',
    actualSegmentCount: null
  });
  assert.deepEqual(parseCourseG03L08Re001ReviewAnsPayload(''), {
    ok: false,
    reason: 'payload-empty',
    actualSegmentCount: 1
  });
  assert.deepEqual(parseCourseG03L08Re001ReviewAnsPayload('oneSPLtwo'), {
    ok: false,
    reason: 'segment-count-not-seven',
    actualSegmentCount: 2
  });
  assert.deepEqual(parseCourseG03L08Re001ReviewAnsPayload('1SPL2SPL3SPL4SPL5SPL6SPL7SPL8'), {
    ok: false,
    reason: 'segment-count-not-seven',
    actualSegmentCount: 8
  });
});

test('RE01 maps every R1-R25 label to its exact one-indexed local frame', () => {
  assert.equal(COURSE_G03_L08_RE_001_REVIEW_LABEL_MAP.length, 25);
  for (let questionNumber = 1; questionNumber <= 25; questionNumber += 1) {
    const mapping = resolveCourseG03L08Re001ReviewLabel(`R${questionNumber}`);
    assert.deepEqual(mapping, {
      label: `R${questionNumber}`,
      questionNumber,
      localFrame: questionNumber + 1
    });
  }
  assert.equal(resolveCourseG03L08Re001ReviewLabel('R0'), null);
  assert.equal(resolveCourseG03L08Re001ReviewLabel('R26'), null);
  assert.equal(resolveCourseG03L08Re001ReviewLabel('r1'), null);
});

test('RE01 Next and Previous reproduce the exact inclusive 1..10 clamp', () => {
  assert.equal(COURSE_G03_L08_RE_001_REVIEW_COUNT_MIN, 1);
  assert.equal(COURSE_G03_L08_RE_001_REVIEW_COUNT_MAX, 10);
  assert.equal(normalizeCourseG03L08Re001ReviewCount(Number.NaN), 1);
  assert.equal(normalizeCourseG03L08Re001ReviewCount(-100), 1);
  assert.equal(normalizeCourseG03L08Re001ReviewCount(1), 1);
  assert.equal(normalizeCourseG03L08Re001ReviewCount(10), 10);
  assert.equal(normalizeCourseG03L08Re001ReviewCount(100), 10);
  assert.equal(stepCourseG03L08Re001ReviewCount(1, 'previous'), 1);
  assert.equal(stepCourseG03L08Re001ReviewCount(1, 'next'), 2);
  assert.equal(stepCourseG03L08Re001ReviewCount(5, 'previous'), 4);
  assert.equal(stepCourseG03L08Re001ReviewCount(5, 'next'), 6);
  assert.equal(stepCourseG03L08Re001ReviewCount(10, 'previous'), 9);
  assert.equal(stepCourseG03L08Re001ReviewCount(10, 'next'), 10);
  assert.equal(stepCourseG03L08Re001ReviewCount(0, 'next'), 1);
  assert.equal(stepCourseG03L08Re001ReviewCount(11, 'previous'), 10);
});

test('RE01 derives selected, correct, and wrong feedback without making a renderer state ready', () => {
  const answers = Array.from({length: 25}, (_, index) => `A${index + 1}Opt1`);
  answers[2] = 'A3Opt2';
  answers[4] = 'A5Opt4';
  const parsed = parseCourseG03L08Re001ReviewAnsPayload(
    [
      'A3Opt2',
      'A5Opt1',
      'A3Opt2,A5Opt1',
      Array.from({length: 25}, (_, index) => `Q${index + 1}`).join(','),
      Array.from({length: 25}, (_, index) => `R${index + 1}`).join(','),
      answers.join(','),
      'R3,R5'
    ].join('SPL')
  );
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;

  const correct = getCourseG03L08Re001ReviewFeedbackState(parsed.payload, 1);
  assert.equal(correct.ok, true);
  if (correct.ok) {
    assert.equal(correct.state.reviewLabel, 'R3');
    assert.equal(correct.state.localFrame, 4);
    assert.equal(correct.state.selectedLetter, 'B');
    assert.equal(correct.state.correctLetter, 'B');
    assert.equal(correct.state.selectedIsCorrect, true);
    assert.equal(correct.state.recordedOutcome, 'correct');
    assert.equal(correct.state.legacyOrdinalComparisonMatched, false);
    assert.deepEqual(correct.state.optionFeedback[1], {
      option: 2,
      letter: 'B',
      instanceName: 'R3Opt2',
      selected: true,
      correct: true,
      text: 'Correct',
      colorRgb: COURSE_G03_L08_RE_001_FEEDBACK_RGB.correct
    });
  }

  const wrong = getCourseG03L08Re001ReviewFeedbackState(parsed.payload, 2);
  assert.equal(wrong.ok, true);
  if (wrong.ok) {
    assert.equal(wrong.state.reviewLabel, 'R5');
    assert.equal(wrong.state.localFrame, 6);
    assert.equal(wrong.state.selectedLetter, 'A');
    assert.equal(wrong.state.correctLetter, 'D');
    assert.equal(wrong.state.selectedIsCorrect, false);
    assert.equal(wrong.state.recordedOutcome, 'wrong');
    assert.deepEqual(wrong.state.optionFeedback[0], {
      option: 1,
      letter: 'A',
      instanceName: 'R5Opt1',
      selected: true,
      correct: false,
      text: 'Incorrect',
      colorRgb: COURSE_G03_L08_RE_001_FEEDBACK_RGB.wrong
    });
    assert.deepEqual(wrong.state.optionFeedback[3], {
      option: 4,
      letter: 'D',
      instanceName: 'R5Opt4',
      selected: false,
      correct: true,
      text: 'Correct',
      colorRgb: COURSE_G03_L08_RE_001_FEEDBACK_RGB.correct
    });
  }

  assert.deepEqual(getCourseG03L08Re001ReviewFeedbackState(parsed.payload, 10), {
    ok: false,
    reason: 'review-item-missing'
  });
  const blockedLocal = getCourseG03L08Re001FrameState(4, {
    frameDomain: 'sprite-621',
    rootFrame: 51,
    scenario: 'default',
    lang: 'en',
    seed: 0
  });
  assert.equal(blockedLocal.status, 'blocked');
  assert.equal(blockedLocal.reviewDataResolved, false);
});

test('RE01 Back is an inert host navigation intent, never an executable legacy URL', () => {
  assert.deepEqual(getCourseG03L08Re001BackNavigationIntent(), {
    kind: 'request-history-back',
    historyDelta: -1,
    legacyJavascriptExecutionAllowed: false,
    requiresReviewedHostHandler: true
  });
  assert.equal(Object.isFrozen(getCourseG03L08Re001BackNavigationIntent()), true);
});

test('RE01 models root 55, Begin at 51, and the stopped 27-frame animation placement', () => {
  assert.deepEqual(COURSE_G03_L08_RE_001_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G03_L08_RE_001_MOVIE.fps, 12);
  assert.equal(COURSE_G03_L08_RE_001_MOVIE.frameCount, 55);
  assert.equal(COURSE_G03_L08_RE_001_SOURCE.rootBeginFrame, 51);
  assert.equal(COURSE_G03_L08_RE_001_SOURCE.rootBeginLabel, 'Begin');
  assert.equal(COURSE_G03_L08_RE_001_SOURCE.localObjectId, 621);
  assert.equal(COURSE_G03_L08_RE_001_SOURCE.localFrameCount, 27);
  assert.equal(courseReview.playbackEndFrame, 51);
  assert.equal(courseReview.runtime, COURSE_G03_L08_RE_001_RUNTIME);
  assert.equal(courseReview.runtime?.defaultFrameDomain, 'root');
  assert.deepEqual(courseReview.runtime?.frameDomains, [
    {id: 'sprite-621', frameCount: 27, rootFrame: 51}
  ]);
  assert.deepEqual(courseReview.playbackEndFrameByDomain, {root: 51, 'sprite-621': 1});
  assert.equal(courseReview.reducedMotionFrame, 51);
  assert.deepEqual(COURSE_G03_L08_RE_001_LOCAL_FRAME_LABELS, [
    {frame: 1, label: 'FirstSection'},
    ...Array.from({length: 25}, (_, index) => ({frame: index + 2, label: `R${index + 1}`}))
  ]);
});

test('RE01 pure state preserves the natural stop and distinguishes structural post-stop frames', () => {
  assert.equal(normalizeCourseG03L08Re001Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG03L08Re001Frame(0), 1);
  assert.equal(normalizeCourseG03L08Re001Frame(51.9), 51);
  assert.equal(normalizeCourseG03L08Re001Frame(99), 55);
  assert.equal(normalizeCourseG03L08Re001LocalFrame(0), 1);
  assert.equal(normalizeCourseG03L08Re001LocalFrame(99), 27);

  const before = getCourseG03L08Re001FrameState(50, {
    frameDomain: 'root',
    scenario: 'root-standalone',
    lang: 'en',
    seed: 1
  });
  const begin = getCourseG03L08Re001FrameState(51, {
    frameDomain: 'root',
    scenario: 'root-standalone',
    lang: 'en',
    seed: 1
  });
  const structural = getCourseG03L08Re001FrameState(55, {
    scenario: 'root-standalone',
    lang: 'en',
    seed: 1
  });
  assert.equal(before.phase, 'pre-begin');
  assert.equal(before.frameDomain, 'root');
  assert.equal(before.localTimeline.frame, null);
  assert.equal(begin.phase, 'begin-stopped');
  assert.equal(begin.frameDomain, 'root');
  assert.equal(begin.localTimeline.frame, 1);
  assert.equal(begin.localTimeline.label, 'FirstSection');
  assert.equal(begin.localTimeline.stopped, true);
  assert.equal(structural.phase, 'post-stop-structural-frame');
  assert.equal(structural.frameDomain, 'root');
  assert.equal(structural.scenario, 'root-standalone');
  assert.equal(structural.naturalPlaybackFrame, 51);
  assert.equal(structural.localTimeline.frame, 1);
  assert.equal(structural.reviewDataResolved, false);
  assert.equal(structural.controlledLocalFrame2Proved, false);
});

test('RE01 reports every declared frame-domain identity exactly while unresolved local states fail closed', () => {
  const rootScenarios = ['root-standalone'] as const;
  const localScenarios = ['default', 'host-review-unavailable', 'legacy-back-unavailable'] as const;
  let probes = 0;
  for (const language of ['en', 'es'] as const) {
    for (const scenario of rootScenarios) {
      for (const frame of [1, 55]) {
        const state = getCourseG03L08Re001FrameState(frame, {
          frameDomain: 'root',
          rootFrame: frame,
          scenario,
          lang: language,
          seed: 0
        });
        assert.equal(state.frameDomain, 'root');
        assert.equal(state.frame, frame);
        assert.equal(state.rootFrame, frame);
        assert.equal(state.scenario, scenario);
        assert.equal(state.language, language);
        assert.equal(state.status, 'ready');
        assert.equal(state.blocker, null);
        assert.equal(
          state.visualLocalizationStatus,
          'source-shared-untranslated-visual'
        );
        probes += 1;
      }
    }
    for (const scenario of localScenarios) {
      for (const frame of [1, 27]) {
        const state = getCourseG03L08Re001FrameState(frame, {
          frameDomain: 'sprite-621',
          rootFrame: 51,
          scenario,
          lang: language,
          seed: 0
        });
        assert.equal(state.frameDomain, 'sprite-621');
        assert.equal(state.frame, frame);
        assert.equal(state.rootFrame, 51);
        assert.equal(state.scenario, scenario);
        assert.equal(state.language, language);
        assert.equal(state.status, 'blocked');
        assert.equal(state.visualLocalizationStatus, 'host-dependent-unresolved');
        assert.equal(
          state.blocker,
          language === 'es'
            ? 'spanish-host-state-not-source-proven'
            : scenario === 'legacy-back-unavailable'
              ? 'javascript-history-side-effect-disabled'
              : 'reviewans-host-state-unavailable'
        );
        probes += 1;
      }
    }
  }
  assert.equal(probes, 16);
});

test('RE01 rejects every frame-domain/scenario mismatch and unknown runtime request', () => {
  for (const scenario of ['default', 'host-review-unavailable', 'legacy-back-unavailable']) {
    const mismatch = getCourseG03L08Re001FrameState(51, {
      frameDomain: 'root',
      scenario,
      lang: 'en',
      seed: 0
    });
    assert.equal(mismatch.frameDomain, 'root');
    assert.equal(mismatch.scenario, scenario);
    assert.equal(mismatch.blocker, 'frame-domain-scenario-mismatch');
  }
  const localMismatch = getCourseG03L08Re001FrameState(1, {
    frameDomain: 'sprite-621',
    scenario: 'root-standalone',
    lang: 'en',
    seed: 0
  });
  assert.equal(localMismatch.frameDomain, 'sprite-621');
  assert.equal(localMismatch.scenario, 'root-standalone');
  assert.equal(localMismatch.blocker, 'frame-domain-scenario-mismatch');

  const unknownDomain = getCourseG03L08Re001FrameState(1, {
    frameDomain: 'unknown-domain',
    scenario: 'root-standalone',
    lang: 'en',
    seed: 0
  });
  assert.equal(unknownDomain.frameDomain, 'root');
  assert.equal(unknownDomain.blocker, 'unsupported-runtime-request');
  const unknownScenario = getCourseG03L08Re001FrameState(1, {
    frameDomain: 'sprite-621',
    scenario: 'unknown-scenario',
    lang: 'en',
    seed: 0
  });
  assert.equal(unknownScenario.frameDomain, 'sprite-621');
  assert.equal(unknownScenario.scenario, 'default');
  assert.equal(unknownScenario.blocker, 'unsupported-runtime-request');
});

test('RE01 exposes one source-shared untranslated root visual in en/es and fails closed on every local state', () => {
  const ready = getCourseG03L08Re001FrameState(51, {
    frameDomain: 'root',
    scenario: 'root-standalone',
    lang: 'en',
    seed: 4294967297
  });
  const spanish = getCourseG03L08Re001FrameState(51, {
    frameDomain: 'root',
    scenario: 'root-standalone',
    lang: 'es',
    seed: 0
  });
  const host = getCourseG03L08Re001FrameState(1, {
    frameDomain: 'sprite-621',
    scenario: 'host-review-unavailable',
    lang: 'en',
    seed: 0
  });
  const back = getCourseG03L08Re001FrameState(1, {
    frameDomain: 'sprite-621',
    scenario: 'legacy-back-unavailable',
    lang: 'en',
    seed: 0
  });
  assert.equal(ready.status, 'ready');
  assert.equal(ready.seed, 1);
  assert.equal(ready.title, 'Quiz Review Details for the Student:');
  assert.equal(ready.visualLocalizationStatus, 'source-shared-untranslated-visual');
  assert.equal(spanish.status, 'ready');
  assert.equal(spanish.blocker, null);
  assert.equal(spanish.title, ready.title);
  assert.equal(spanish.visualLocalizationStatus, 'source-shared-untranslated-visual');
  assert.equal(host.blocker, 'reviewans-host-state-unavailable');
  assert.equal(host.visualLocalizationStatus, 'host-dependent-unresolved');
  assert.equal(back.blocker, 'javascript-history-side-effect-disabled');
  assert.equal(courseReview.audioCues.length, 0);
  assert.equal(courseReview.audioTracks, undefined);
});

test('RE01 renderer is native Canvas with Replay and explicit disabled source actions', () => {
  const render = (
    frame: number,
    frameDomain: 'root' | 'sprite-621',
    scenario: string,
    lang: 'en' | 'es'
  ) => {
    const rootFrame = frameDomain === 'root' ? frame : 51;
    const state = courseReview.getFrameState(frame, {
      frame,
      frameDomain,
      rootFrame,
      scenario,
      lang,
      seed: 17
    });
    return renderToStaticMarkup(
      createElement(courseReview.Renderer, {
        frame,
        frameDomain,
        rootFrame,
        scenario,
        lang,
        seed: 17,
        state,
        onReplay: () => undefined
      })
    );
  };
  const ready = render(51, 'root', 'root-standalone', 'en');
  assert.match(ready, /data-flash-frame="51"/);
  assert.match(ready, /data-flash-natural-frame="51"/);
  assert.match(ready, /data-local-object-id="621"/);
  assert.match(ready, /data-local-frame-count="27"/);
  assert.match(ready, /data-visual-localization-status="source-shared-untranslated-visual"/);
  assert.match(ready, /<canvas[^>]+width="800"/);
  assert.match(ready, /<canvas[^>]+height="600"/);
  assert.match(ready, /<button[^>]*>Replay<\/button>/);
  assert.match(ready, /Previous review unavailable/);
  assert.match(ready, /Next review unavailable/);
  assert.match(ready, /Back unavailable/);

  const rootStandalone = courseReview.getFrameState(55, {
    frame: 55,
    frameDomain: 'root',
    rootFrame: 55,
    scenario: 'root-standalone',
    lang: 'en',
    seed: 17,
    traceId: 'root-standalone',
    requirementId: 'req:root:root-standalone:en',
    entryStateSha256: '0'.repeat(64),
    replay: 0
  });
  assert.equal(rootStandalone.frameDomain, 'root');
  assert.equal(rootStandalone.scenario, 'root-standalone');
  assert.equal(rootStandalone.status, 'ready');

  const localBlocked = courseReview.getFrameState(27, {
    frame: 27,
    frameDomain: 'sprite-621',
    rootFrame: 51,
    scenario: 'default',
    lang: 'en',
    seed: 17
  });
  assert.equal(localBlocked.frameDomain, 'sprite-621');
  assert.equal(localBlocked.frame, 27);
  assert.equal(localBlocked.rootFrame, 51);
  assert.equal(localBlocked.status, 'blocked');
  assert.equal(localBlocked.blocker, 'reviewans-host-state-unavailable');

  const spanish = render(51, 'root', 'root-standalone', 'es');
  assert.match(spanish, /data-runtime-language="es"/);
  assert.match(
    spanish,
    /data-visual-localization-status="source-shared-untranslated-visual"/
  );
  assert.match(spanish, /<canvas[^>]+width="800"/);
  assert.doesNotMatch(spanish, /data-fail-closed-reason/);

  const host = render(1, 'sprite-621', 'host-review-unavailable', 'en');
  assert.match(host, /Quiz review data unavailable/);
  assert.match(host, /data-visual-localization-status="host-dependent-unresolved"/);
  assert.doesNotMatch(host, /<canvas/);

  for (const scenario of ['default', 'host-review-unavailable', 'legacy-back-unavailable']) {
    const nestedSpanish = render(1, 'sprite-621', scenario, 'es');
    assert.match(
      nestedSpanish,
      /data-fail-closed-reason="spanish-host-state-not-source-proven"/
    );
    assert.match(
      nestedSpanish,
      /data-visual-localization-status="host-dependent-unresolved"/
    );
    assert.doesNotMatch(nestedSpanish, /<canvas/);
  }
});

test('RE01 implementation contains no network, dynamic execution, or ambient ticker', async () => {
  const moduleSource = await readFile(
    `${repositoryRoot}packages/demos/src/modules/course-g03-l08-re-001.tsx`,
    'utf8'
  );
  for (const forbidden of [
    /\bfetch\s*\(/,
    /XMLHttpRequest/,
    /WebSocket/,
    /document\.createElement\(['"]script/,
    /\beval\s*\(/,
    /new Function/,
    /setInterval/,
    /setTimeout/,
    /requestAnimationFrame/
  ]) {
    assert.doesNotMatch(moduleSource, forbidden);
  }
  const strictReadiness = JSON.parse(
    await readFile(`${migrationRoot}/audit/strict-readiness.json`, 'utf8')
  ) as {conclusion: {strictAcceptanceReady: boolean}};
  assert.equal(strictReadiness.conclusion.strictAcceptanceReady, false);
  assert.equal(courseReview.maturity, 'legacy-prototype');
});
