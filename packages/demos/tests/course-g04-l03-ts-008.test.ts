import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import type {AnimationRendererProps} from "../src/contract";
import courseTs008, {
  COURSE_G04_L03_TS_008_MOVIE,
  COURSE_G04_L03_TS_008_RUNTIME,
  COURSE_G04_L03_TS_008_SOURCE_CONTRACT,
  getCourseG04L03Ts008FrameState,
} from "../src/modules/course-g04-l03-ts-008";
import {
  COURSE_G04_L03_TS_008_CHOICES,
  COURSE_G04_L03_TS_008_DONOR_POLICY,
  COURSE_G04_L03_TS_008_GLOSSARY,
  COURSE_G04_L03_TS_008_INTERACTION_AUTHORITY,
  COURSE_G04_L03_TS_008_NEED_MORE_HELP,
  COURSE_G04_L03_TS_008_PLAYBACK_POLICY,
  COURSE_G04_L03_TS_008_WALKTHROUGH_STEPS,
  createCourseG04L03Ts008InteractionState,
  reduceCourseG04L03Ts008Interaction,
  type CourseG04L03Ts008ChoiceId,
  type CourseG04L03Ts008InteractionState,
} from "../src/timelines/course-g04-l03-ts-008-practice-question-interaction";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));

const baseProps: AnimationRendererProps = {
  frame: 328,
  frameDomain: "sprite-350",
  scenario: "source-static-frame",
  lang: "en",
  seed: 2,
};

const render = (overrides: Partial<AnimationRendererProps> = {}) =>
  renderToStaticMarkup(
    createElement(courseTs008.Renderer, {...baseProps, ...overrides}),
  );

const continueWalkthrough = (state: CourseG04L03Ts008InteractionState) =>
  reduceCourseG04L03Ts008Interaction(state, {
    type: "continue-walkthrough",
  });

const revealBox = (state: CourseG04L03Ts008InteractionState) =>
  reduceCourseG04L03Ts008Interaction(state, {
    type: "reveal-walkthrough-box",
  });

const closeBox = (state: CourseG04L03Ts008InteractionState) =>
  reduceCourseG04L03Ts008Interaction(state, {
    type: "close-walkthrough-box",
  });

const choose = (
  state: CourseG04L03Ts008InteractionState,
  choiceId: CourseG04L03Ts008ChoiceId,
) =>
  reduceCourseG04L03Ts008Interaction(state, {
    type: "choose",
    choiceId,
  });

const completeFeedback = (state: CourseG04L03Ts008InteractionState) =>
  reduceCourseG04L03Ts008Interaction(state, {type: "feedback-complete"});

const reachFrame592 = (seed = 0): CourseG04L03Ts008InteractionState =>
  continueWalkthrough(
    continueWalkthrough(createCourseG04L03Ts008InteractionState(seed)),
  );

const reachQuiz = (seed = 0): CourseG04L03Ts008InteractionState => {
  let state = revealBox(reachFrame592(seed));
  state = closeBox(state);
  state = revealBox(state);
  return closeBox(state);
};

test("TS008 keeps the ten-frame root separate from sprite-350 and preserves source-only frame state", () => {
  assert.deepEqual(COURSE_G04_L03_TS_008_MOVIE.stage, {
    width: 800,
    height: 600,
  });
  assert.equal(COURSE_G04_L03_TS_008_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_TS_008_MOVIE.frameCount, 789);
  assert.equal(COURSE_G04_L03_TS_008_RUNTIME.frameCount, 10);
  assert.equal(
    COURSE_G04_L03_TS_008_RUNTIME.defaultFrameDomain,
    "sprite-350",
  );
  assert.deepEqual(
    COURSE_G04_L03_TS_008_RUNTIME.frameDomains?.[0],
    {id: "sprite-350", frameCount: 789, fps: 12, rootFrame: 6},
  );
  assert.equal(courseTs008.runtime, COURSE_G04_L03_TS_008_RUNTIME);
  assert.equal(courseTs008.reducedMotionFrame, 328);
  assert.equal(
    courseTs008.playbackEndFrameByDomain?.["sprite-350"],
    328,
  );

  for (const frame of [328, 465, 592, 712, 769, 770, 789]) {
    const state = getCourseG04L03Ts008FrameState(frame, {
      frameDomain: "sprite-350",
      scenario: "source-static-frame",
      lang: "en",
      seed: 2,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.frame, frame);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.naturalRuntimeEstablished, false);
    assert.equal(state.audioRendered, false);
  }
});

test("TS008 normal functional entry exposes gate one over donor 328 and fails closed until Canvas is ready", () => {
  const markup = render({
    pageInteractionCompanionTargetId:
      "g4-l3-page-interaction-companion",
  });

  assert.match(markup, /data-current-js-controls-enabled="true"/);
  assert.match(markup, /data-current-js-controls-ready="false"/);
  assert.match(markup, /data-current-js-modern-reconstruction="true"/);
  assert.match(markup, /data-current-js-overlay-count="1"/);
  assert.match(markup, /data-current-js-source-visual-frame="328"/);
  assert.match(markup, /data-deterministic-evidence-capture="false"/);
  assert.match(markup, /data-source-visual-parity-established="false"/);
  assert.match(markup, /data-natural-composite-established="false"/);
  assert.match(
    markup,
    /data-natural-composite-unsafe-frames="592,712,770"/,
  );
  assert.match(markup, /Modern reconstruction/);
  assert.match(
    markup,
    /data-ts008-focus-control="walkthrough-step-1" disabled=""/,
  );
  assert.match(markup, /data-source-canvas-status="idle"/);
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /inert=""/);
  assert.match(markup, /pointer-events:none|pointer-events:\s*none/i);
  assert.match(markup, /<canvas/);
  assert.match(markup, /data-interaction-companion-surface="mobile"/);
  assert.match(markup, /data-interaction-companion-placement="fallback"/);
});

test("TS008 reducer supplies the module walkthrough, reveal/Close, right, two-wrong, NMH, and Replay paths", () => {
  let correct = createCourseG04L03Ts008InteractionState(3);
  assert.equal(correct.frame, 328);
  correct = continueWalkthrough(correct);
  assert.equal(correct.frame, 465);
  correct = continueWalkthrough(correct);
  assert.equal(correct.frame, 592);
  assert.equal(correct.walkthroughBoxRevealed, false);

  correct = revealBox(correct);
  assert.equal(correct.frame, 592);
  assert.equal(correct.walkthroughBoxRevealed, true);
  assert.equal(correct.focusTarget, "walkthrough-box-3-close");

  let help = reduceCourseG04L03Ts008Interaction(correct, {
    type: "open-need-more-help",
  });
  assert.equal(help.phase, "need-more-help");
  assert.equal(help.frame, 592);
  assert.equal(help.focusTarget, "need-more-help-close");
  help = reduceCourseG04L03Ts008Interaction(help, {
    type: "close-need-more-help",
  });
  assert.equal(help.phase, "walkthrough");
  assert.equal(help.walkthroughBoxRevealed, true);
  assert.equal(help.focusTarget, "need-more-help");

  correct = closeBox(help);
  assert.equal(correct.frame, 712);
  assert.equal(correct.walkthroughBoxRevealed, false);
  correct = revealBox(correct);
  assert.equal(correct.frame, 712);
  assert.equal(correct.walkthroughBoxRevealed, true);
  assert.equal(correct.focusTarget, "walkthrough-box-4-close");
  correct = closeBox(correct);
  assert.equal(correct.phase, "quiz");
  assert.equal(correct.frame, 770);
  assert.equal(correct.focusTarget, "choice-A");

  const quizHelp = reduceCourseG04L03Ts008Interaction(correct, {
    type: "open-need-more-help",
  });
  assert.equal(quizHelp.phase, "need-more-help");
  assert.equal(quizHelp.needMoreHelpReturnPhase, "quiz");
  correct = reduceCourseG04L03Ts008Interaction(quizHelp, {
    type: "close-need-more-help",
  });
  assert.equal(correct.phase, "quiz");
  assert.equal(correct.focusTarget, "need-more-help");

  correct = choose(correct, "D");
  assert.equal(correct.feedback?.kind, "right");
  assert.equal(correct.feedback?.branch, 4);
  assert.equal(correct.feedback?.copy, "Great Job!");
  correct = completeFeedback(correct);
  assert.equal(correct.phase, "terminal");
  assert.equal(correct.frame, 789);
  assert.equal(correct.selectedChoiceId, "D");

  let wrong = choose(reachQuiz(2), "C");
  assert.equal(wrong.feedback?.kind, "wrong");
  assert.equal(wrong.feedback?.branch, 3);
  assert.equal(wrong.feedback?.copy, "Try Again!");
  wrong = completeFeedback(wrong);
  assert.equal(wrong.phase, "quiz");
  assert.equal(wrong.wrongTryCount, 1);
  assert.equal(wrong.focusTarget, "choice-C");
  wrong = completeFeedback(choose(wrong, "A"));
  assert.equal(wrong.phase, "terminal");
  assert.equal(wrong.frame, 789);
  assert.equal(wrong.wrongTryCount, 0);
  assert.equal(wrong.selectedChoiceId, "A");

  assert.deepEqual(
    reduceCourseG04L03Ts008Interaction(wrong, {type: "replay"}),
    createCourseG04L03Ts008InteractionState(2),
  );
});

test("TS008 deterministic entry-state capture preserves the requested unsafe source frame with zero functional overlay", () => {
  const markup = render({
    entryStateSha256: "a".repeat(64),
    frame: 770,
    requirementId: "req-sprite-350-frame-770",
    traceId: "trace-sprite-350-frame-770",
  });

  assert.match(markup, /data-current-js-controls-enabled="false"/);
  assert.match(markup, /data-current-js-controls-ready="false"/);
  assert.match(markup, /data-current-js-modern-reconstruction="false"/);
  assert.match(markup, /data-current-js-overlay-count="0"/);
  assert.match(markup, /data-current-js-source-visual-frame="770"/);
  assert.match(markup, /data-deterministic-evidence-capture="true"/);
  assert.match(markup, /data-flash-frame="770"/);
  assert.match(
    markup,
    new RegExp(`data-flash-entry-state-sha256="${"a".repeat(64)}"`),
  );
  assert.doesNotMatch(
    markup,
    /aria-label="Current-JavaScript reconstructed four-step reasoning and practice controls"/,
  );
  assert.doesNotMatch(markup, /Modern reconstruction<\/strong>/);
  assert.doesNotMatch(markup, /data-interaction-companion-surface="mobile"/);
  assert.doesNotMatch(markup, /data-ts008-focus-control=/);
});

test("TS008 enables no overlay outside the exact English sprite-350 frame-328 entry", () => {
  const requests: readonly Partial<AnimationRendererProps>[] = [
    {frame: 327},
    {frame: 329},
    {lang: "es"},
    {frameDomain: "root", scenario: "root-unavailable", frame: 1},
    {scenario: "unsupported-scenario"},
  ];

  for (const overrides of requests) {
    const markup = render(overrides);
    assert.match(markup, /data-current-js-controls-enabled="false"/);
    assert.match(markup, /data-current-js-controls-ready="false"/);
    assert.match(markup, /data-current-js-modern-reconstruction="false"/);
    assert.match(markup, /data-current-js-overlay-count="0"/);
    assert.doesNotMatch(markup, /data-ts008-focus-control=/);
    assert.doesNotMatch(
      markup,
      /data-interaction-companion-surface="mobile"/,
    );
  }

  const spanish = render({lang: "es"});
  assert.match(
    spanish,
    /data-fail-closed-reason="spanish-visual-and-audio-unvalidated"/,
  );
  assert.doesNotMatch(spanish, /<canvas/);

  const root = render({
    frame: 1,
    frameDomain: "root",
    scenario: "root-unavailable",
  });
  assert.match(
    root,
    /data-fail-closed-reason="root-baseline-unavailable"/,
  );
});

test("TS008 donor and unsafe-composite policies keep functional reconstruction separate from exact capture", () => {
  assert.deepEqual(
    COURSE_G04_L03_TS_008_DONOR_POLICY.functionalStateMap.map(
      ({state, sourceFrame, donorFrame}) => ({
        state,
        sourceFrame,
        donorFrame,
      }),
    ),
    [
      {state: "walkthrough-step-1", sourceFrame: 328, donorFrame: 328},
      {state: "walkthrough-step-2", sourceFrame: 465, donorFrame: 465},
      {state: "walkthrough-step-3", sourceFrame: 592, donorFrame: 465},
      {state: "walkthrough-step-4", sourceFrame: 712, donorFrame: 465},
      {state: "quiz", sourceFrame: 770, donorFrame: 769},
      {state: "terminal", sourceFrame: 789, donorFrame: 789},
    ],
  );
  assert.deepEqual(
    COURSE_G04_L03_TS_008_DONOR_POLICY.unsafeDirectSourceFrames.map(
      ({frame}) => frame,
    ),
    [592, 712, 770],
  );
  assert.equal(
    COURSE_G04_L03_TS_008_SOURCE_CONTRACT.currentJavascriptDonorPolicy,
    COURSE_G04_L03_TS_008_DONOR_POLICY,
  );
  assert.deepEqual(
    COURSE_G04_L03_TS_008_SOURCE_CONTRACT.sourceCompositeUnsafeFrames,
    [592, 712, 770],
  );
  assert.equal(
    COURSE_G04_L03_TS_008_SOURCE_CONTRACT.sourceCompositeEstablished,
    false,
  );
  assert.match(
    COURSE_G04_L03_TS_008_DONOR_POLICY.deterministicCapturePolicy,
    /exact requested source frame with no donor remap/,
  );
});

test("TS008 pause, reduced-motion hold/Continue, remaining-time, and Replay contracts stay current-JS-only", async () => {
  const moduleSource = await readFile(
    `${repositoryRoot}packages/demos/src/modules/course-g04-l03-ts-008.tsx`,
    "utf8",
  );
  const pausedMarkup = render({paused: true});
  const reducedMarkup = render({reducedMotion: true});

  assert.match(
    pausedMarkup,
    /data-ts008-focus-control="walkthrough-step-1" disabled=""/,
  );
  assert.match(
    reducedMarkup,
    /data-ts008-focus-control="walkthrough-step-1" disabled=""/,
  );
  assert.deepEqual(COURSE_G04_L03_TS_008_PLAYBACK_POLICY, {
    timingAuthority: "source-window-projection-only",
    pause: {
      policy:
        "renderer-must-freeze-walkthrough-and-feedback-remaining-time-without-dispatching-feedback-complete",
      sourceParityEstablished: false,
    },
    reducedMotion: {
      policy:
        "show-static-reveal-or-feedback-state-before-explicit-completion",
      sourceParityEstablished: false,
    },
    replay: {
      policy:
        "reset-frame-step-reveal-quiz-try-feedback-need-more-help-focus-and-seed-vector",
      sourceParityEstablished: false,
    },
  });
  assert.match(moduleSource, /feedbackRemainingMsRef/);
  assert.match(moduleSource, /performance\.now\(\)/);
  assert.match(moduleSource, /props\.paused/);
  assert.match(moduleSource, /props\.reducedMotion/);
  assert.match(moduleSource, /Reduced motion: static feedback is held until Continue/);
  assert.match(
    moduleSource,
    /dispatch\(\{type: "replay", seed: props\.seed\}\)/,
  );
  assert.match(moduleSource, /props\.onReplay\?\.\(\)/);
});

test("TS008 desktop, mobile, and wide coarse-pointer contracts preserve exact answer hits, minimum targets, row seven, and focus migration", async () => {
  const moduleSource = await readFile(
    `${repositoryRoot}packages/demos/src/modules/course-g04-l03-ts-008.tsx`,
    "utf8",
  );
  const markup = render({
    pageInteractionCompanionTargetId:
      "g4-l3-page-interaction-companion",
  });

  assert.deepEqual(
    COURSE_G04_L03_TS_008_CHOICES.map(
      ({id, sourceInstance, sourceButtonObjectId, hitBounds}) => ({
        id,
        sourceInstance,
        sourceButtonObjectId,
        hitBounds,
      }),
    ),
    [
      {
        id: "A",
        sourceInstance: "AnsBtn1",
        sourceButtonObjectId: 159,
        hitBounds: {x: 574.7, y: 203.9, width: 90.7, height: 40},
      },
      {
        id: "B",
        sourceInstance: "AnsBtn2",
        sourceButtonObjectId: 156,
        hitBounds: {x: 575, y: 269.5, width: 95.1, height: 40},
      },
      {
        id: "C",
        sourceInstance: "AnsBtn3",
        sourceButtonObjectId: 158,
        hitBounds: {x: 573.4, y: 327.4, width: 106.3, height: 38},
      },
      {
        id: "D",
        sourceInstance: "AnsBtn4",
        sourceButtonObjectId: 157,
        hitBounds: {x: 574.7, y: 386.4, width: 89.3, height: 41},
      },
    ],
  );
  assert.deepEqual(
    COURSE_G04_L03_TS_008_WALKTHROUGH_STEPS.map(
      ({id, hitBounds}) => ({id, hitBounds}),
    ),
    [
      {
        id: 1,
        hitBounds: {x: 70.3, y: 157.5, width: 219.7, height: 133.1},
      },
      {
        id: 2,
        hitBounds: {x: 70.3, y: 304.5, width: 219.7, height: 167.2},
      },
      {
        id: 3,
        hitBounds: {x: 301.3, y: 161, width: 213.6, height: 126.1},
      },
      {
        id: 4,
        hitBounds: {x: 298.3, y: 304.5, width: 219.7, height: 167.2},
      },
    ],
  );
  assert.deepEqual(COURSE_G04_L03_TS_008_NEED_MORE_HELP.buttonBounds, {
    x: 601.4,
    y: 130.8,
    width: 118.5,
    height: 27.5,
  });
  assert.match(markup, /course-g04-l03-ts-008-stage-surface/);
  assert.match(markup, /course-g04-l03-ts-008-mobile-controls--fallback/);
  assert.match(markup, /min-height:\s*48px/);
  assert.match(markup, /min-width:\s*48px/);
  assert.match(markup, /grid-row:\s*7/);
  assert.match(
    markup,
    /\(max-width: 640px\), \(any-pointer: coarse\)/,
  );
  assert.match(moduleSource, /createPortal\(mobileSurface, companionTarget\)/);
  assert.match(
    moduleSource,
    /media\.addEventListener\("change", migrateFocus\)/,
  );
  assert.match(moduleSource, /findVisibleFocusTarget/);
  assert.match(moduleSource, /choice\.hitBounds/);
  assert.match(moduleSource, /currentStep\.hitBounds/);
  assert.match(moduleSource, /data-ts008-focus-control/);
  assert.match(
    moduleSource,
    /inert=\{interactionEnabled \? true : undefined\}/,
  );
});

test("TS008 safe-disables all glossary callbacks and keeps every acceptance authority false", () => {
  const markup = render();

  for (const value of Object.values(
    COURSE_G04_L03_TS_008_INTERACTION_AUTHORITY,
  )) {
    if (typeof value === "boolean") assert.equal(value, false);
  }

  for (const key of [
    "sourceCompositeEstablished",
    "sourceVisualParityEstablished",
    "sourceFeedbackVisualParityEstablished",
    "sourceRandomParityEstablished",
    "sourceTimingParityEstablished",
    "associatedAudioModeled",
    "needMoreHelpSourceVisualAccepted",
    "behaviorParityEstablished",
    "replayParityEstablished",
    "ownerAccepted",
    "strictMigrationComplete",
    "lessonPublished",
  ] as const) {
    assert.equal(COURSE_G04_L03_TS_008_SOURCE_CONTRACT[key], false, key);
  }
  assert.equal(
    COURSE_G04_L03_TS_008_SOURCE_CONTRACT.glossaryHostCallbacks,
    "safe-disabled-unresolved",
  );
  assert.deepEqual(
    COURSE_G04_L03_TS_008_GLOSSARY.map(
      ({term, sourceButtonObjectId, enabled, mode}) => ({
        term,
        sourceButtonObjectId,
        enabled,
        mode,
      }),
    ),
    [
      {
        term: "Positive number",
        sourceButtonObjectId: 166,
        enabled: false,
        mode: "safe-disabled-unresolved-host-callback",
      },
      {
        term: "Owe",
        sourceButtonObjectId: 167,
        enabled: false,
        mode: "safe-disabled-unresolved-host-callback",
      },
      {
        term: "Negative number",
        sourceButtonObjectId: 168,
        enabled: false,
        mode: "safe-disabled-unresolved-host-callback",
      },
    ],
  );
  assert.equal(
    COURSE_G04_L03_TS_008_SOURCE_CONTRACT.strictAcceptanceEffect,
    "none",
  );
  assert.equal(courseTs008.maturity, "legacy-prototype");
  assert.match(markup, /data-associated-audio-modeled="false"/);
  assert.match(markup, /data-authoritative-baseline-accepted="false"/);
  assert.match(markup, /data-feedback-random-parity-established="false"/);
  assert.match(markup, /data-glossary-host-resolved="false"/);
  assert.match(markup, /data-human-visual-review-accepted="false"/);
  assert.match(markup, /data-owner-accepted="false"/);
  assert.match(markup, /data-strict-migration-complete="false"/);
  assert.match(markup, /data-lesson-published="false"/);
  assert.match(markup, /data-strict-acceptance-effect="none"/);
});
