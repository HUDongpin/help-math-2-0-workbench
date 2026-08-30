import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import type {AnimationRendererProps} from "../src/contract";
import courseTs007, {
  COURSE_G04_L03_TS_007_MOVIE,
  COURSE_G04_L03_TS_007_RUNTIME,
  COURSE_G04_L03_TS_007_SOURCE_CONTRACT,
  getCourseG04L03Ts007FrameState,
} from "../src/modules/course-g04-l03-ts-007";
import {
  COURSE_G04_L03_TS_007_CHOICES,
  COURSE_G04_L03_TS_007_GLOSSARY,
  COURSE_G04_L03_TS_007_INTERACTION_AUTHORITY,
  COURSE_G04_L03_TS_007_PLAYBACK_POLICY,
  createCourseG04L03Ts007InteractionState,
  reduceCourseG04L03Ts007Interaction,
  type CourseG04L03Ts007ChoiceId,
  type CourseG04L03Ts007InteractionState,
} from "../src/timelines/course-g04-l03-ts-007-practice-question-interaction";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));

const baseProps: AnimationRendererProps = {
  frame: 235,
  frameDomain: "sprite-441",
  scenario: "source-static-frame",
  lang: "en",
  seed: 2,
};

const render = (overrides: Partial<AnimationRendererProps> = {}) =>
  renderToStaticMarkup(
    createElement(courseTs007.Renderer, {...baseProps, ...overrides}),
  );

const reachQuiz = (seed = 0): CourseG04L03Ts007InteractionState => {
  let state = createCourseG04L03Ts007InteractionState(seed);
  for (let gate = 0; gate < 4; gate += 1) {
    state = reduceCourseG04L03Ts007Interaction(state, {
      type: "continue-walkthrough",
    });
  }
  return state;
};

const choose = (
  state: CourseG04L03Ts007InteractionState,
  choiceId: CourseG04L03Ts007ChoiceId,
) =>
  reduceCourseG04L03Ts007Interaction(state, {
    type: "choose",
    choiceId,
  });

const completeFeedback = (state: CourseG04L03Ts007InteractionState) =>
  reduceCourseG04L03Ts007Interaction(state, {type: "feedback-complete"});

test("TS007 keeps the root timeline separate from the 696-frame sprite domain", () => {
  assert.deepEqual(COURSE_G04_L03_TS_007_MOVIE.stage, {
    width: 800,
    height: 600,
  });
  assert.equal(COURSE_G04_L03_TS_007_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_TS_007_MOVIE.frameCount, 696);
  assert.equal(COURSE_G04_L03_TS_007_RUNTIME.frameCount, 10);
  assert.equal(
    COURSE_G04_L03_TS_007_RUNTIME.defaultFrameDomain,
    "sprite-441",
  );
  assert.deepEqual(
    COURSE_G04_L03_TS_007_RUNTIME.frameDomains?.[0],
    {id: "sprite-441", frameCount: 696, fps: 12, rootFrame: 6},
  );
  assert.equal(courseTs007.runtime, COURSE_G04_L03_TS_007_RUNTIME);
  assert.equal(courseTs007.reducedMotionFrame, 235);

  for (const frame of [235, 373, 500, 617, 680, 696]) {
    const state = getCourseG04L03Ts007FrameState(frame, {
      frameDomain: "sprite-441",
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

test("TS007 normal functional entry renders only current-JS gate zero and fails closed until Canvas is ready", () => {
  const markup = render({
    pageInteractionCompanionTargetId:
      "g4-l3-page-interaction-companion",
  });

  assert.match(markup, /data-current-js-controls-enabled="true"/);
  assert.match(markup, /data-current-js-modern-reconstruction="true"/);
  assert.match(markup, /data-current-js-source-visual-frame="235"/);
  assert.match(markup, /data-source-visual-parity-established="false"/);
  assert.match(markup, /data-natural-composite-established="false"/);
  assert.match(markup, /data-natural-composite-unresolved-frames="373,500,617,679"/);
  assert.match(markup, /Modern reconstruction/);
  assert.match(markup, /Checkpoint 1 of 4/);
  assert.match(
    markup,
    /data-ts007-focus-control="walkthrough-continue" disabled=""/,
  );
  assert.match(markup, /data-source-canvas-status="idle"/);
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /inert=""/);
  assert.match(markup, /pointer-events:none|pointer-events:\s*none/i);
  assert.match(markup, /<canvas/);
  assert.match(markup, /data-interaction-companion-surface="mobile"/);
  assert.match(markup, /data-interaction-companion-placement="fallback"/);
});

test("TS007 reducer drives walkthrough, correct, two-wrong, NMH, and Replay paths used by the module", () => {
  let correct = createCourseG04L03Ts007InteractionState(3);
  for (const frame of [235, 373, 500, 617]) {
    assert.equal(correct.frame, frame);
    correct = reduceCourseG04L03Ts007Interaction(correct, {
      type: "continue-walkthrough",
    });
  }
  assert.equal(correct.phase, "quiz");
  assert.equal(correct.frame, 679);
  correct = choose(correct, "B");
  assert.equal(correct.feedback?.kind, "right");
  assert.equal(correct.feedback?.branch, 4);
  correct = completeFeedback(correct);
  assert.equal(correct.phase, "terminal");
  assert.equal(correct.frame, 696);

  let wrong = choose(reachQuiz(2), "A");
  assert.equal(wrong.feedback?.kind, "wrong");
  assert.equal(wrong.feedback?.branch, 3);
  wrong = completeFeedback(wrong);
  assert.equal(wrong.phase, "quiz");
  assert.equal(wrong.wrongTryCount, 1);
  assert.equal(wrong.focusTarget, "choice-A");
  wrong = completeFeedback(choose(wrong, "D"));
  assert.equal(wrong.phase, "terminal");
  assert.equal(wrong.frame, 696);

  let help = reduceCourseG04L03Ts007Interaction(reachQuiz(8), {
    type: "open-need-more-help",
  });
  assert.equal(help.phase, "need-more-help");
  assert.equal(help.focusTarget, "need-more-help-close");
  help = reduceCourseG04L03Ts007Interaction(help, {
    type: "close-need-more-help",
  });
  assert.equal(help.phase, "quiz");
  assert.equal(help.focusTarget, "need-more-help");

  assert.deepEqual(
    reduceCourseG04L03Ts007Interaction(wrong, {type: "replay"}),
    createCourseG04L03Ts007InteractionState(2),
  );
});

test("TS007 deterministic entry-state capture preserves the requested frame with zero functional overlay", () => {
  const markup = render({
    entryStateSha256: "a".repeat(64),
    frame: 617,
    requirementId: "req-sprite-441-frame-617",
    traceId: "trace-sprite-441-frame-617",
  });

  assert.match(markup, /data-current-js-controls-enabled="false"/);
  assert.match(markup, /data-current-js-modern-reconstruction="false"/);
  assert.match(markup, /data-current-js-source-visual-frame="617"/);
  assert.match(markup, /data-flash-frame="617"/);
  assert.match(
    markup,
    new RegExp(`data-flash-entry-state-sha256="${"a".repeat(64)}"`),
  );
  assert.doesNotMatch(
    markup,
    /aria-label="Current-JavaScript reconstructed walkthrough and practice controls"/,
  );
  assert.doesNotMatch(markup, /Modern reconstruction<\/strong>/);
  assert.doesNotMatch(markup, /data-interaction-companion-surface="mobile"/);
  assert.doesNotMatch(markup, /data-ts007-focus-control=/);
});

test("TS007 enables no overlay outside the exact English sprite-441 frame-235 entry", () => {
  const requests: readonly Partial<AnimationRendererProps>[] = [
    {frame: 234},
    {frame: 236},
    {lang: "es"},
    {frameDomain: "root", scenario: "root-unavailable", frame: 1},
    {scenario: "unsupported-scenario"},
  ];

  for (const overrides of requests) {
    const markup = render(overrides);
    assert.match(markup, /data-current-js-controls-enabled="false"/);
    assert.match(markup, /data-current-js-modern-reconstruction="false"/);
    assert.doesNotMatch(markup, /data-ts007-focus-control=/);
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

test("TS007 pause, reduced-motion, feedback remaining time, and Replay policies stay current-JS-only", async () => {
  const moduleSource = await readFile(
    `${repositoryRoot}packages/demos/src/modules/course-g04-l03-ts-007.tsx`,
    "utf8",
  );
  const pausedMarkup = render({paused: true});
  const reducedMarkup = render({reducedMotion: true});

  assert.match(
    pausedMarkup,
    /data-ts007-focus-control="walkthrough-continue" disabled=""/,
  );
  assert.match(
    reducedMarkup,
    /data-ts007-focus-control="walkthrough-continue" disabled=""/,
  );
  assert.deepEqual(COURSE_G04_L03_TS_007_PLAYBACK_POLICY, {
    timingAuthority: "source-window-projection-only",
    pause: {
      policy: "renderer-must-freeze-parent-and-feedback-remaining-time",
      sourceParityEstablished: false,
    },
    reducedMotion: {
      policy: "show-static-feedback-before-explicit-completion",
      sourceParityEstablished: false,
    },
  });
  assert.match(moduleSource, /feedbackRemainingMsRef/);
  assert.match(moduleSource, /performance\.now\(\)/);
  assert.match(moduleSource, /props\.paused/);
  assert.match(moduleSource, /props\.reducedMotion/);
  assert.match(moduleSource, /dispatch\(\{type: "replay", seed: props\.seed\}\)/);
  assert.match(moduleSource, /props\.onReplay\?\.\(\)/);
  assert.match(moduleSource, /source feedback artwork is not/);
});

test("TS007 desktop, mobile, and wide coarse-pointer contracts preserve exact hits and focus migration", async () => {
  const moduleSource = await readFile(
    `${repositoryRoot}packages/demos/src/modules/course-g04-l03-ts-007.tsx`,
    "utf8",
  );
  const markup = render({
    pageInteractionCompanionTargetId:
      "g4-l3-page-interaction-companion",
  });

  assert.deepEqual(
    COURSE_G04_L03_TS_007_CHOICES.map(
      ({id, sourceInstance, hitBounds}) => ({
        id,
        sourceInstance,
        hitBounds,
      }),
    ),
    [
      {
        id: "A",
        sourceInstance: "AnsBtn1",
        hitBounds: {x: 550.759, y: 208.914, width: 98.642, height: 43.772},
      },
      {
        id: "B",
        sourceInstance: "AnsBtn2",
        hitBounds: {x: 549.569, y: 281.818, width: 106.892, height: 51.564},
      },
      {
        id: "C",
        sourceInstance: "AnsBtn3",
        hitBounds: {x: 550.342, y: 364.948, width: 98.069, height: 41.603},
      },
      {
        id: "D",
        sourceInstance: "AnsBtn4",
        hitBounds: {x: 549.735, y: 437.6, width: 96.483, height: 47.1},
      },
    ],
  );
  assert.match(markup, /course-g04-l03-ts-007-stage-surface/);
  assert.match(markup, /course-g04-l03-ts-007-mobile-controls--fallback/);
  assert.match(markup, /min-height:\s*48px/);
  assert.match(markup, /grid-row:\s*7/);
  assert.match(
    markup,
    /\(max-width: 640px\), \(any-pointer: coarse\)/,
  );
  assert.match(moduleSource, /createPortal\(mobileSurface, companionTarget\)/);
  assert.match(moduleSource, /media\.addEventListener\("change", migrateFocus\)/);
  assert.match(moduleSource, /findVisibleFocusTarget/);
  assert.match(moduleSource, /choice\.hitBounds/);
  assert.match(moduleSource, /inert=\{interactionEnabled \? true : undefined\}/);
});

test("TS007 safe-disables glossary callbacks and keeps every acceptance authority false", () => {
  const markup = render();
  for (const value of Object.values(
    COURSE_G04_L03_TS_007_INTERACTION_AUTHORITY,
  )) {
    if (typeof value === "boolean") assert.equal(value, false);
  }

  for (const key of [
    "naturalCompositeEstablished",
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
    assert.equal(COURSE_G04_L03_TS_007_SOURCE_CONTRACT[key], false, key);
  }
  assert.equal(
    COURSE_G04_L03_TS_007_SOURCE_CONTRACT.glossaryHostCallbacks,
    "safe-disabled-unresolved",
  );
  assert.deepEqual(
    COURSE_G04_L03_TS_007_GLOSSARY.map(({term, mode}) => ({term, mode})),
    [
      {
        term: "Symbol",
        mode: "safe-disabled-unresolved-host-callback",
      },
      {
        term: "Number line",
        mode: "safe-disabled-unresolved-host-callback",
      },
    ],
  );
  assert.equal(
    COURSE_G04_L03_TS_007_SOURCE_CONTRACT.strictAcceptanceEffect,
    "none",
  );
  assert.equal(courseTs007.maturity, "legacy-prototype");
  assert.match(markup, /data-associated-audio-modeled="false"/);
  assert.match(markup, /data-authoritative-baseline-accepted="false"/);
  assert.match(markup, /data-feedback-random-parity-established="false"/);
  assert.match(markup, /data-human-visual-review-accepted="false"/);
  assert.match(markup, /data-owner-accepted="false"/);
  assert.match(markup, /data-strict-migration-complete="false"/);
  assert.match(markup, /data-lesson-published="false"/);
  assert.match(markup, /data-strict-acceptance-effect="none"/);
});
