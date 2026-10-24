import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

import type {AnimationRendererProps} from "../src/contract";
import {loadAnimationModule} from "../src/animation-registry";
import {lessonTextCompletionAllowed} from "../src/lesson-text-completion";
import courseTs007, {
  COURSE_G04_L03_TS_007_INTERACTION_COMPLETION,
  COURSE_G04_L03_TS_007_MOVIE,
  COURSE_G04_L03_TS_007_RUNTIME,
  COURSE_G04_L03_TS_007_SOURCE_CONTRACT,
  CourseG04L03Ts007DesktopQuiz,
  CourseG04L03Ts007FlowSurface,
  CourseG04L03Ts007HelpTeachingContent,
  CourseG04L03Ts007NativeNumberLine,
  CourseG04L03Ts007ResponsiveFeedbackPreview,
  CourseG04L03Ts007ResponsiveNumberLinePreview,
  getCourseG04L03Ts007FrameState,
} from "../src/modules/course-g04-l03-ts-007";
import {
  COURSE_G04_L03_TS_007_CHOICES,
  COURSE_G04_L03_TS_007_GLOSSARY,
  COURSE_G04_L03_TS_007_HELP,
  COURSE_G04_L03_TS_007_HELP_AXIS,
  COURSE_G04_L03_TS_007_INTERACTION_AUTHORITY,
  COURSE_G04_L03_TS_007_PLAYBACK_POLICY,
  COURSE_G04_L03_TS_007_QUESTION,
  COURSE_G04_L03_TS_007_QUIZ_STRATEGY,
  COURSE_G04_L03_TS_007_RIGHT_FEEDBACK_WINDOWS,
  COURSE_G04_L03_TS_007_WALKTHROUGH_COPY,
  COURSE_G04_L03_TS_007_WRONG_FEEDBACK_WINDOWS,
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

test("TS007 completion capability uses the source hold while the practice reducer reaches terminal", async () => {
  const scripts = gunzipSync(await readFile(
    `${repositoryRoot}migrations/course-g04-l03-ts-007/audit/machine/ffdec-scripts.txt.gz`,
  )).toString();
  assert.match(scripts, /DefineSprite_441\/frame_235\/DoAction\.as =====\nstop\(\);/);
  assert.match(scripts, /DefineSprite_441\/frame_696\/DoAction\.as =====\nstop\(\);/);
  assert.deepEqual(COURSE_G04_L03_TS_007_INTERACTION_COMPLETION, {
    id: "g4-l3-ts007-terminal",
    frameDomain: "sprite-441",
    frames: [235],
  });
  assert.deepEqual(
    (await loadAnimationModule("course-g04-l03-ts-007"))?.interactionCompletion,
    COURSE_G04_L03_TS_007_INTERACTION_COMPLETION,
  );

  const walkthrough = createCourseG04L03Ts007InteractionState(2);
  const quiz = reachQuiz(2);
  const feedback = choose(quiz, "B");
  const terminal = completeFeedback(feedback);
  assert.equal(walkthrough.phase, "walkthrough");
  assert.equal(walkthrough.frame, 235);
  assert.equal(quiz.phase, "quiz");
  assert.equal(feedback.phase, "feedback");
  assert.equal(terminal.phase, "terminal");
  assert.equal(terminal.frame, COURSE_G04_L03_TS_007_QUESTION.terminalFrame);

  const request = {
    id: COURSE_G04_L03_TS_007_INTERACTION_COMPLETION.id,
    frameDomain: "sprite-441",
    frame: 235,
    seed: 2,
    replay: 0,
  };
  const current = {frame: 235, frameDomain: "sprite-441", seed: 2, replay: 0, capture: false};
  assert.equal(lessonTextCompletionAllowed(COURSE_G04_L03_TS_007_INTERACTION_COMPLETION, request, current), true);
  assert.equal(lessonTextCompletionAllowed(COURSE_G04_L03_TS_007_INTERACTION_COMPLETION,
    request, {...current, capture: true}), false);
  assert.equal(lessonTextCompletionAllowed(COURSE_G04_L03_TS_007_INTERACTION_COMPLETION,
    {...request, replay: 1}, current), false);
});

test("TS007 responsive companion preserves the full source-axis teaching range and four choice positions", async () => {
  const sourceCatalog = JSON.parse(gunzipSync(await readFile(
    `${repositoryRoot}catalog/typography-v1/source-catalog/assets/f29b6880fea6e2316d1916bec26dc58050a8dad78a4b082efc19c85720128daf.json.gz`,
  )).toString());
  const sourceAxisLabels = sourceCatalog.timelines
    .find((timeline: {timelineId: string}) => timeline.timelineId === "sprite-441")
    .events.filter((event: {frame: number; kind: string; characterId?: number}) =>
      event.frame === 1 && event.kind === "place" && [16, 17].includes(event.characterId ?? -1))
    .sort((a: {matrix: number[]}, b: {matrix: number[]}) => a.matrix[4]! - b.matrix[4]!);
  assert.deepEqual(sourceAxisLabels.map((event: {characterId: number}) => event.characterId), [17, 16, 17]);
  assert.equal(sourceCatalog.textDefinitions.find((text: {characterId: number}) => text.characterId === 16)
    .runs.map((run: {text: string}) => run.text).join(""), "0");
  assert.equal(sourceCatalog.textDefinitions.find((text: {characterId: number}) => text.characterId === 17)
    .runs.map((run: {text: string}) => run.text).join(""), "5");

  const markup = renderToStaticMarkup(
    createElement(CourseG04L03Ts007NativeNumberLine),
  );
  assert.match(markup, /data-source-visual-parity-established="false"/);
  assert.match(markup, /<figcaption>Positions on the number line<\/figcaption>/);
  assert.deepEqual(
    [...markup.matchAll(/data-number-line-location="(-?\d+)"/g)].map((match) => Number(match[1])),
    [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5],
  );
  assert.deepEqual(
    [...markup.matchAll(/data-axis-label-visible="true" data-number-line-location="(-?\d+)"/g)]
      .map((match) => Number(match[1])),
    [-5, 0, 5],
  );
  for (const choice of COURSE_G04_L03_TS_007_CHOICES) {
    const tick = markup.match(
      new RegExp(`data-number-line-location="${choice.numberLineLocation}"[\\s\\S]*?<\\/li>`),
    )?.[0];
    assert.ok(tick, `missing tick for ${choice.id}`);
    assert.match(tick, new RegExp(`data-source-choice-instance="${choice.sourceInstance}"`));
    assert.match(tick, new RegExp(`aria-label="${choice.id}: ${choice.symbol}"`));
  }
  assert.match(markup, /−5/);

  const scrollableMarkup = renderToStaticMarkup(
    createElement(CourseG04L03Ts007NativeNumberLine, {scrollable: true}),
  );
  assert.match(scrollableMarkup, /aria-description="Scroll horizontally to inspect the full number line"/);
  assert.match(scrollableMarkup, /tabindex="0"/);
});

test("TS007 help uses its own source popup, text, and minus-ten to ten number line", async () => {
  const catalog = JSON.parse(gunzipSync(await readFile(
    `${repositoryRoot}catalog/typography-v1/source-catalog/assets/f29b6880fea6e2316d1916bec26dc58050a8dad78a4b082efc19c85720128daf.json.gz`,
  )).toString());
  const main = catalog.timelines.find(
    (timeline: {timelineId: string}) => timeline.timelineId === "sprite-441",
  );
  const popup = catalog.timelines.find(
    (timeline: {timelineId: string}) => timeline.timelineId === "sprite-183",
  );
  assert.ok(main.instances.some((instance: {
    characterId: number;
    firstFrame: number;
  }) => instance.characterId === 183 && instance.firstFrame === 679));
  assert.ok(popup);
  const sourceText = (id: number) => catalog.textDefinitions.find(
    (text: {characterId: number}) => text.characterId === id,
  )?.runs.map((run: {text: string}) => run.text).join("");
  assert.equal(sourceText(141), COURSE_G04_L03_TS_007_HELP.description);
  assert.equal(sourceText(140), "Example:   5 is 5 units to the left of 0 on the number line.  ");
  assert.equal(COURSE_G04_L03_TS_007_HELP.example,
    "Example: −5 is 5 units to the left of 0 on the number line.");
  assert.equal(sourceText(146), COURSE_G04_L03_TS_007_HELP.negativeTitle);
  assert.equal(sourceText(147), COURSE_G04_L03_TS_007_HELP.positiveTitle);
  assert.ok(popup.instances.some((instance: {characterId: number}) =>
    instance.characterId === COURSE_G04_L03_TS_007_HELP.sourceAxisMinusShapeId));
  assert.deepEqual(COURSE_G04_L03_TS_007_HELP_AXIS.map(({value}) => value),
    Array.from({length: 21}, (_, index) => index - 10));
  for (const {value, sourceTextId} of COURSE_G04_L03_TS_007_HELP_AXIS) {
    assert.equal(sourceText(sourceTextId), String(Math.abs(value)));
    assert.ok(popup.instances.some((instance: {characterId: number}) =>
      instance.characterId === sourceTextId), `missing help axis ${value}`);
  }
  const scripts = gunzipSync(await readFile(
    `${repositoryRoot}migrations/course-g04-l03-ts-007/audit/machine/ffdec-scripts.txt.gz`,
  )).toString();
  assert.match(scripts, /DefineButton2_13\/BUTTONCONDACTION[\s\S]*?Mc_Popup\._visible = true;/);
  assert.match(scripts, /DefineButton2_138\/BUTTONCONDACTION[\s\S]*?_root\.enableQuizButton\(\);/);

  for (const compact of [false, true]) {
    const markup = renderToStaticMarkup(createElement(
      CourseG04L03Ts007HelpTeachingContent,
      {compact, descriptionId: `help-description-${compact}`},
    ));
    assert.match(markup, /data-source-sprite-id="sprite-183"/);
    assert.match(markup, /data-source-axis-minus-shape-id="174"/);
    assert.match(markup, /data-source-visual-parity-established="false"/);
    assert.match(markup, /Example: −5 is 5 units to the left of 0/);
    assert.deepEqual([...markup.matchAll(/data-help-axis-location="(-?\d+)"/g)]
      .map((match) => Number(match[1])),
    Array.from({length: 21}, (_, index) => index - 10));
    assert.deepEqual(
      [...markup.matchAll(/class="course-g04-l03-ts-007-help-value">([^<]+)<\/span>/g)]
        .map((match) => match[1]),
      COURSE_G04_L03_TS_007_HELP_AXIS.map(({value}) =>
        value < 0 ? `−${Math.abs(value)}` : String(value)),
      "All 21 source Help labels must be direct visible signed text",
    );
    assert.doesNotMatch(markup,
      /class="course-g04-l03-ts-007-help-value"><span/,
      "Help labels must not be replaced by visually hidden spans",
    );
    for (const [value, id] of [[-10, 173], [-5, 168], [0, 153], [5, 158], [10, 163]]) {
      assert.match(markup,
        new RegExp(`data-help-axis-location="${value}" data-source-text-id="${id}"`));
    }
    assert.match(markup, /data-help-example="true" data-help-axis-location="-5"/);
    assert.equal(markup.includes("course-g04-l03-ts-007-help-number-line--compact"), compact);
    if (compact) {
      assert.match(markup, /aria-description="Use arrow keys to inspect more positions when the line extends beyond the panel"/);
      assert.match(markup, /class="course-g04-l03-ts-007-help-number-line course-g04-l03-ts-007-help-number-line--compact"[^>]*tabindex="0"/);
    } else {
      assert.doesNotMatch(markup, /tabindex="0"/);
    }
  }
});

test("TS007 desktop quiz exposes native teaching text, full number line, and visible source-mapped choices", async () => {
  const markup = renderToStaticMarkup(createElement(
    CourseG04L03Ts007DesktopQuiz,
    {controlsDisabled: false, dispatch: () => undefined},
  ));
  const moduleSource = await readFile(
    `${repositoryRoot}packages/demos/src/modules/course-g04-l03-ts-007.tsx`,
    "utf8",
  );

  assert.match(markup, /class="course-g04-l03-ts-007-stage-quiz"/);
  assert.match(markup, /Which symbol is located at −2 on the number line\?/);
  assert.match(markup, /Number line from negative five to positive five, in steps of one/);
  assert.deepEqual(
    [...markup.matchAll(/data-number-line-location="(-?\d+)"/g)]
      .map((match) => Number(match[1])),
    [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5],
  );
  assert.equal([...markup.matchAll(/data-ts007-focus-control="choice-/g)].length, 4);
  for (const choice of COURSE_G04_L03_TS_007_CHOICES) {
    assert.match(markup, new RegExp(`data-source-button-object-id="${choice.sourceButtonObjectId}"`));
    assert.match(markup, new RegExp(`data-source-instance="${choice.sourceInstance}"`));
    assert.match(markup, new RegExp(`aria-label="${choice.id}\\. ${choice.symbol}, located at`));
  }
  assert.match(moduleSource, /\.course-g04-l03-ts-007-stage-quiz\s*\{\s*background: #fff/);
  assert.match(moduleSource, /\.course-g04-l03-ts-007-source-hit-button\s*\{[\s\S]*?min-height: 44px/);
  assert.doesNotMatch(moduleSource, /color: transparent/);
});

test("TS007 quiz retains source Guess-and-Check text without showing the answer before choice", async () => {
  const catalog = JSON.parse(gunzipSync(await readFile(
    `${repositoryRoot}catalog/typography-v1/source-catalog/assets/f29b6880fea6e2316d1916bec26dc58050a8dad78a4b082efc19c85720128daf.json.gz`,
  )).toString());
  const main = catalog.timelines.find(
    (timeline: {timelineId: string}) => timeline.timelineId === "sprite-441",
  );
  assert.deepEqual(COURSE_G04_L03_TS_007_QUIZ_STRATEGY.sourceTextIds, [117, 118]);
  assert.equal(COURSE_G04_L03_TS_007_QUIZ_STRATEGY.sourceFrame,
    COURSE_G04_L03_TS_007_QUESTION.quizFrame);
  for (const [index, id] of COURSE_G04_L03_TS_007_QUIZ_STRATEGY.sourceTextIds.entries()) {
    const sourceText = catalog.textDefinitions.find(
      (entry: {characterId: number}) => entry.characterId === id,
    );
    assert.equal(sourceText.runs.map((run: {text: string}) => run.text).join(""),
      COURSE_G04_L03_TS_007_QUIZ_STRATEGY.lines[index]);
    assert.ok(main.instances.some((instance: {
      characterId: number;
      firstFrame: number;
      lastFrameExclusive: number;
    }) => instance.characterId === id
      && instance.firstFrame <= COURSE_G04_L03_TS_007_QUIZ_STRATEGY.sourceFrame
      && COURSE_G04_L03_TS_007_QUIZ_STRATEGY.sourceFrame < instance.lastFrameExclusive));
  }
  const desktop = renderToStaticMarkup(createElement(
    CourseG04L03Ts007DesktopQuiz,
    {controlsDisabled: false, dispatch: () => undefined},
  ));
  const preview = renderToStaticMarkup(createElement(
    CourseG04L03Ts007ResponsiveNumberLinePreview,
  ));
  assert.match(desktop, /data-source-text-ids="117,118"/);
  assert.match(desktop, /Use strategy: Guess and Check/);
  assert.match(desktop, /Where is each symbol located\?/);
  assert.doesNotMatch(desktop, /The correct answer choice is B/);
  assert.match(preview, /aria-hidden="true"/);
  assert.match(preview, /class="course-g04-l03-ts-007-responsive-number-line-preview"/);
  assert.deepEqual(
    [...preview.matchAll(/data-number-line-location="(-?\d+)"/g)]
      .map((match) => Number(match[1])),
    [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5],
  );
  assert.doesNotMatch(preview, /The correct answer choice is B/);
});

test("TS007 responsive feedback preview follows the selected source branch without leaking the answer on wrong feedback", () => {
  const wrong = choose(reachQuiz(0), "A");
  const right = choose(reachQuiz(0), "B");
  const wrongMarkup = renderToStaticMarkup(createElement(
    CourseG04L03Ts007ResponsiveFeedbackPreview,
    {interaction: wrong},
  ));
  const rightMarkup = renderToStaticMarkup(createElement(
    CourseG04L03Ts007ResponsiveFeedbackPreview,
    {interaction: right},
  ));

  assert.match(wrongMarkup, /aria-hidden="true"/);
  assert.match(wrongMarkup, /data-feedback-branch="wrong1"/);
  assert.match(wrongMarkup, /data-source-text-ids="220,221"/);
  assert.match(wrongMarkup, /OH! NO/);
  assert.match(wrongMarkup, /try the question again/);
  assert.doesNotMatch(wrongMarkup, /answer B|heart/);
  assert.match(rightMarkup, /data-feedback-branch="right1"/);
  assert.match(rightMarkup, /data-source-text-ids="280,281,283"/);
  assert.match(rightMarkup, /Great Job!/);
  assert.match(rightMarkup, /heart, answer B, is located at negative two/);
  assert.equal(renderToStaticMarkup(createElement(
    CourseG04L03Ts007ResponsiveFeedbackPreview,
    {interaction: reachQuiz(0)},
  )), "");
});

test("TS007 native walkthrough keeps each stop's source text visible in teaching order", async () => {
  const sourceCatalog = JSON.parse(gunzipSync(await readFile(
    `${repositoryRoot}catalog/typography-v1/source-catalog/assets/f29b6880fea6e2316d1916bec26dc58050a8dad78a4b082efc19c85720128daf.json.gz`,
  )).toString());
  const main = sourceCatalog.timelines.find(
    (timeline: {timelineId: string}) => timeline.timelineId === "sprite-441",
  );
  const expected = [
    {sourceFrame: 235, sourceTextIds: [14]},
    {sourceFrame: 373, sourceTextIds: [50]},
    {sourceFrame: 500, sourceTextIds: [92, 91]},
    {sourceFrame: 617, sourceTextIds: [94, 95, 96]},
  ];
  assert.deepEqual(COURSE_G04_L03_TS_007_WALKTHROUGH_COPY.map(
    ({sourceFrame, sourceTextIds}) => ({sourceFrame, sourceTextIds: [...sourceTextIds]}),
  ), expected);
  for (const step of expected) {
    for (const sourceTextId of step.sourceTextIds) {
      assert.ok(main.instances.some((instance: {
        characterId: number;
        firstFrame: number;
        lastFrameExclusive: number;
      }) => instance.characterId === sourceTextId
        && instance.firstFrame <= step.sourceFrame
        && step.sourceFrame < instance.lastFrameExclusive),
      `source text ${sourceTextId} is not on the ${step.sourceFrame} timeline`);
    }
  }
  assert.deepEqual(COURSE_G04_L03_TS_007_WALKTHROUGH_COPY[3].paragraphs, [
    "Use strategy: Draw a picture.",
    "Label the number line to see where −2 is.",
    "The correct answer choice is B.",
  ]);
  assert.match(render(), /data-source-text-ids="14"/);
  assert.match(render(), /Which symbol is located at −2 on the number line\?/);
});

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
  assert.match(markup, /data-interaction-phase="walkthrough"[^>]*style="background:#e9f7ff/);
  assert.match(markup, /class="course-g04-l03-ts-007-responsive-number-line-preview"/);
  assert.equal([...markup.matchAll(/<figcaption>Positions on the number line<\/figcaption>/g)].length, 3);
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

test("TS007 native feedback headings match their source branch text", async () => {
  const catalog = JSON.parse(gunzipSync(await readFile(
    `${repositoryRoot}catalog/typography-v1/source-catalog/assets/f29b6880fea6e2316d1916bec26dc58050a8dad78a4b082efc19c85720128daf.json.gz`,
  )).toString());
  const expected = [
    {kind: "wrong", sprite: "sprite-225", heading: "OH! NO", ids: [220, 221]},
    {kind: "wrong", sprite: "sprite-211", heading: "OH! NO", ids: [197, 198]},
    {kind: "wrong", sprite: "sprite-193", heading: "incorrect!", ids: [187, 188, 190]},
    {kind: "right", sprite: "sprite-284", heading: "Great Job!", ids: [280, 281, 283]},
    {kind: "right", sprite: "sprite-324", heading: "Good Job!", ids: [319, 320]},
    {kind: "right", sprite: "sprite-382", heading: "Excellent!", ids: [379, 380]},
    {kind: "right", sprite: "sprite-350", heading: "YOU GOT IT!", ids: [339, 340]},
  ];
  const windows = [
    ...COURSE_G04_L03_TS_007_WRONG_FEEDBACK_WINDOWS,
    ...COURSE_G04_L03_TS_007_RIGHT_FEEDBACK_WINDOWS,
  ];
  assert.equal(windows.length, expected.length);

  for (const [index, source] of expected.entries()) {
    const window = windows[index]!;
    assert.equal(window.kind, source.kind);
    assert.equal(window.sourceSpriteId, source.sprite);
    assert.equal(window.sourceHeading, source.heading);
    assert.deepEqual(window.sourceTextIds, source.ids);
    const timeline = catalog.timelines.find(
      (entry: {timelineId: string}) => entry.timelineId === source.sprite,
    );
    assert.ok(timeline, `missing ${source.sprite}`);
    for (const id of source.ids) {
      const text = catalog.textDefinitions.find(
        (entry: {characterId: number}) => entry.characterId === id,
      );
      assert.ok(text, `missing source text ${id}`);
      assert.equal(text.runs.map((run: {text: string}) => run.text).join(""), source.heading);
      assert.ok(timeline.instances.some((instance: {
        characterId: number;
        firstFrame: number;
        lastFrameExclusive: number;
      }) => instance.characterId === id
        && instance.firstFrame < window.sourceEndFrame
        && instance.lastFrameExclusive > window.sourceStartFrame),
      `${source.sprite} does not place source text ${id} during feedback`);
    }
  }

  for (let seed = 0; seed < 4; seed += 1) {
    assert.equal(choose(reachQuiz(seed), "B").feedback?.sourceWindow.sourceHeading,
      COURSE_G04_L03_TS_007_RIGHT_FEEDBACK_WINDOWS[seed]!.sourceHeading);
    assert.equal(choose(reachQuiz(seed), "A").feedback?.sourceWindow.sourceHeading,
      COURSE_G04_L03_TS_007_WRONG_FEEDBACK_WINDOWS[seed % 3]!.sourceHeading);
  }
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
  assert.match(moduleSource, /data-feedback-source-visual-parity-established="false"/);
  assert.match(moduleSource, /data-feedback-remaining-ms=/);
  assert.doesNotMatch(moduleSource, /Modern accessible feedback|Accessible current-JavaScript feedback branch/);
});

test("TS007 native desktop and mobile flow preserves source hit mappings and capture isolation", async () => {
  const moduleSource = await readFile(
    `${repositoryRoot}packages/demos/src/modules/course-g04-l03-ts-007.tsx`,
    "utf8",
  );
  const markup = render({
    pageInteractionCompanionTargetId:
      "g4-l3-page-interaction-companion",
  });
  const evidenceMarkup = render({frame: 234});

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
  assert.match(markup, /data-current-js-controls-enabled="true"/);
  assert.match(markup, /@media all/);
  assert.match(markup, /@media \(max-width: 760px\)/);
  assert.match(markup, /data-lesson-platform-header="true"/);
  assert.match(markup, /background: var\(--lesson-platform-bg\)/);
  assert.match(markup, /@media \(min-width: 1280px\) and \(any-pointer: coarse\)/);
  assert.match(markup, /grid-template-columns: minmax\(0, 1fr\) !important/);
  assert.match(markup, /max-height: none !important/);
  assert.match(evidenceMarkup, /data-current-js-controls-enabled="false"/);
  assert.match(evidenceMarkup, /\(max-width: 1023px\), \(any-pointer: coarse\)/);
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


const renderNativeFlow = (interaction: CourseG04L03Ts007InteractionState) => renderToStaticMarkup(createElement(
  CourseG04L03Ts007FlowSurface, {interaction, modernText: true, placement: "native", canvasStatus: "ready",
    controlsReady: true, paused: false, feedbackRemainingMs: 0, dispatch: () => {}, onCloseNeedMoreHelp: () => {},
    onFinishFeedback: () => {}, onReplay: () => {}},
));

test("TS007 modern Draw teaches negative two with all source tick labels visibly numbered", () => {
  let state = createCourseG04L03Ts007InteractionState(0);
  state = reduceCourseG04L03Ts007Interaction(state, {type: "continue-walkthrough"});
  state = reduceCourseG04L03Ts007Interaction(state, {type: "continue-walkthrough"});
  const html = renderNativeFlow(state);
  assert.match(html, /Draw a picture/);
  assert.match(html, /Label the number line/);
  assert.equal((html.match(/data-axis-label-visible="true"/g) ?? []).length, 11);
  assert.match(html, /data-number-line-location="-2"[\s\S]*?class="course-g04-l03-ts-007-native-value">−2<\/span>/);
  assert.doesNotMatch(html, /class="course-g04-l03-ts-007-modern-label"/);
  const before = renderNativeFlow(createCourseG04L03Ts007InteractionState(0));
  assert.equal((before.match(/data-axis-label-visible="true"/g) ?? []).length, 3);
});

test("TS007 modern Guess teaches the four signed symbol locations without hiding them in aria labels", () => {
  let state = createCourseG04L03Ts007InteractionState(0);
  for (let gate=0;gate<3;gate++) state=reduceCourseG04L03Ts007Interaction(state,{type:"continue-walkthrough"});
  for (const current of [state, reachQuiz(0)]) {
    const html=renderNativeFlow(current);
    assert.match(html,/Guess and Check/);
    assert.equal((html.match(/data-axis-label-visible="true"/g) ?? []).length,3);
    for (const [id,value] of [["A","−4"],["B","−2"],["C","2"],["D","4"]]) {
      assert.match(html,new RegExp('data-guess-choice="'+id+'"[^>]*><dt>'+id+':[\\s\\S]*?<dd>'+value+'<\\/dd>'));
    }
  }
});

test("TS007 native flow preserves Help, explicit feedback completion, disabled glossary and terminal Replay", () => {
  const quiz=reachQuiz(0);
  const help=renderNativeFlow(reduceCourseG04L03Ts007Interaction(quiz,{type:"open-need-more-help"}));
  assert.equal((help.match(/data-help-axis-location=/g) ?? []).length,21);
  assert.match(help,/role="dialog"/);
  assert.match(help,/data-ts007-focus-control="need-more-help-close"/);
  const feedback=choose(quiz,"A"), feedbackHtml=renderNativeFlow(feedback);
  assert.match(feedbackHtml,/data-ts007-focus-control="feedback-status"/);
  assert.match(feedbackHtml,/Continue/);
  assert.match(renderNativeFlow(quiz),/disabled[^>]*>Symbol glossary unavailable/);
  const terminal=renderNativeFlow(completeFeedback(choose(quiz,"B")));
  assert.match(terminal,/Question complete/);
  assert.match(terminal,/>Replay<\/button>/);
});


test("TS007 native intro keeps natural reveal boundaries and source choices disabled until the authored hold", () => {
  const initial=createCourseG04L03Ts007InteractionState(0);
  const renderIntro=(frame:number,interaction=initial)=>renderToStaticMarkup(createElement(CourseG04L03Ts007FlowSurface,
    {interaction,modernText:true,placement:"native",introductionFrame:frame,canvasStatus:"ready",controlsReady:true,paused:false,
      feedbackRemainingMs:0,dispatch:()=>{},onCloseNeedMoreHelp:()=>{},onFinishFeedback:()=>{},onReplay:()=>{}}));
  const hidden=renderIntro(1);
  assert.match(hidden,/data-ts007-introduction-opacity="0"[^>]*aria-hidden="true"/);
  assert.doesNotMatch(hidden,/data-ts007-focus-control="walkthrough-continue"|Answer choices/);
  assert.match(renderIntro(7),/data-ts007-introduction-opacity="1"/);
  for(const frame of [8,234]) {
    const html=renderIntro(frame);
    assert.equal((html.match(/<button[^>]*disabled/g)??[]).length,6);
    assert.doesNotMatch(html,/walkthrough-continue|Guess and Check|Need More Help/);
  }
  assert.match(renderIntro(8),/data-ts007-introduction-choice-opacity="0"/);
  assert.match(renderIntro(9),/data-ts007-introduction-choice-opacity="0.25"/);
  assert.match(renderIntro(12),/data-ts007-introduction-choice-opacity="1"/);
  const stale=renderIntro(1,completeFeedback(choose(reachQuiz(0),"B")));
  assert.doesNotMatch(stale,/Question complete|>Replay<\/button>/);
});
