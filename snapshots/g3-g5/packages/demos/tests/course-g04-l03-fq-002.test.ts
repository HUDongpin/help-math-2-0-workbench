import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import {loadAnimationModule} from "../src/animation-registry";
import animationModule, {
  COURSE_G04_L03_FQ_002_MOVIE,
  COURSE_G04_L03_FQ_002_RUNTIME,
  COURSE_G04_L03_FQ_002_SOURCE,
  COURSE_G04_L03_FQ_002_SOURCE_CONTRACT,
  CourseG04L03Fq002Renderer,
  getCourseG04L03Fq002FrameState,
} from "../src/modules/course-g04-l03-fq-002";
import {
  COURSE_G04_L03_FQ_002_QUESTIONS,
  createCourseG04L03Fq002InteractionState,
  COURSE_G04_L03_FQ_002_FUNCTIONAL_MASKING_POLICY,
  COURSE_G04_L03_FQ_002_INTERACTION_AUTHORITY,
} from "../src/timelines/course-g04-l03-fq-002-quiz-interaction";

import {FQ002_NUMBER_LINES} from "../src/modern-lessons/generated/g4-l3-fq002-number-lines";
import {Fq002NumberLine} from "../src/modern-lessons/g4-l3-fq002-number-line";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const ENTRY_SHA = "a".repeat(64);

const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

const render = (
  overrides: Partial<Parameters<typeof CourseG04L03Fq002Renderer>[0]> = {},
) =>
  renderToStaticMarkup(
    createElement(CourseG04L03Fq002Renderer, {
      frame: 1,
      frameDomain: "sprite-899",
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      ...overrides,
    }),
  );

test("FQ002 retains exact source, root, nested-domain, and registry identity", async () => {
  assert.deepEqual(COURSE_G04_L03_FQ_002_MOVIE.stage, {
    width: 800,
    height: 600,
  });
  assert.equal(COURSE_G04_L03_FQ_002_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_FQ_002_MOVIE.frameCount, 68);
  assert.equal(COURSE_G04_L03_FQ_002_RUNTIME.frameCount, 10);
  assert.equal(
    COURSE_G04_L03_FQ_002_RUNTIME.defaultFrameDomain,
    "sprite-899",
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_RUNTIME.frameDomains?.find(
      ({id}) => id === "sprite-899",
    )?.frameCount,
    68,
  );
  assert.equal(animationModule.key, "course-g04-l03-fq-002");
  assert.equal(animationModule.maturity, "legacy-prototype");
  assert.equal(animationModule.reducedMotionFrame, 1);
  assert.equal(animationModule.playbackEndFrameByDomain?.["sprite-899"], 1);
  assert.equal(animationModule.Renderer, CourseG04L03Fq002Renderer);
  assert.equal(
    (await loadAnimationModule("course-g04-l03-fq-002"))?.Renderer,
    CourseG04L03Fq002Renderer,
  );
  assert.equal(
    sha256(
      await readFile(
        `${repositoryRoot}${COURSE_G04_L03_FQ_002_SOURCE.swf}`,
      ),
    ),
    COURSE_G04_L03_FQ_002_SOURCE.swfSha256,
  );
  assert.equal(
    sha256(
      await readFile(
        `${repositoryRoot}${COURSE_G04_L03_FQ_002_SOURCE.fla}`,
      ),
    ),
    COURSE_G04_L03_FQ_002_SOURCE.flaSha256,
  );
});

test("functional entry binds seeded question 7 to source frame 8 and one modern overlay", () => {
  const markup = render();

  assert.match(
    markup,
    /data-current-js-functional-entry="sprite-899:1:source-static-frame:en"/,
  );
  assert.match(markup, /data-current-js-controls-enabled="true"/);
  assert.match(markup, /data-current-js-overlay-count="1"/);
  assert.match(markup, /data-current-js-sequence-number="1"/);
  assert.match(markup, /data-current-js-source-visual-frame="8"/);
  assert.match(
    markup,
    /data-current-js-functional-overlay="course-g04-l03-fq-002-quiz"/,
  );
  assert.match(
    markup,
    /data-functional-canvas-artifact-mask="Mc_Finish-QuestNo-CQ"/,
  );
  assert.match(markup, /data-functional-mask-phase="question"/);
  assert.match(
    markup,
    /data-modern-source-visual-cover="full-stage-opaque"/,
  );
  assert.match(
    markup,
    /<rect fill="#b8d8f7" height="600" width="800" x="0" y="0"/,
  );
  assert.match(
    markup,
    /course-g04-l03-fq-002-stage-panel--wide/,
  );
  assert.match(markup, /data-source-canvas-accessibility-isolated="true"/);
  assert.match(
    markup,
    /data-source-canvas-visual-exposure="hidden-behind-modern-backdrop"/,
  );
  assert.match(markup, /data-answer-transition-locked="false"/);
  assert.match(
    markup,
    /data-source-symbol-projection="exact-source-native-option-paths"/,
  );
  assert.doesNotMatch(markup, /data-source-symbol-crop="target"/);
  assert.match(markup, /data-fq002-native-number-line="7"/);
  assert.match(markup, /data-source-shape-id="144"/);
  assert.match(markup, /data-source-shape-id="148"/);
  assert.match(markup, /data-source-text-id="character-145"/);
  assert.match(markup, /inert=""/);
  assert.match(markup, /data-flash-frame="8"/);
  assert.match(markup, /Question 1 of 10/);
  assert.match(
    markup,
    /Which symbol is located at\s+–4 on this number line\?/,
  );
  for (const [optionId, optionNumber] of [
    ["A", 1],
    ["B", 2],
    ["C", 3],
    ["D", 4],
  ] as const) {
    assert.match(markup, new RegExp(`aria-label="${optionId}\\. ${["Square", "Circle", "Triangle", "Heart"][optionNumber - 1]}"`));
    assert.match(
      markup,
      new RegExp(`data-source-option-instance="A7Opt${optionNumber}"`),
    );
    assert.match(
      markup,
      new RegExp(`data-fq002-native-option="${String.fromCharCode(64 + optionNumber)}"`),
    );
  }
  assert.match(
    markup,
    /data-source-host-close-report-enabled="false"/,
  );
  assert.match(markup, /data-source-audio-enabled="false"/);
});

test("deterministic entry-state capture preserves requested source frame with zero mask or controls", () => {
  const markup = render({
    entryStateSha256: ENTRY_SHA,
    frame: 44,
    requirementId: "req-fq002-review-44",
    traceId: "trace-fq002-review-44",
    seed: 7,
  });

  assert.match(markup, /data-deterministic-evidence-capture="true"/);
  assert.match(markup, /data-current-js-controls-enabled="false"/);
  assert.match(markup, /data-current-js-overlay-count="0"/);
  assert.match(markup, /data-current-js-source-visual-frame="44"/);
  assert.match(markup, /data-flash-frame="44"/);
  assert.match(
    markup,
    /data-flash-entry-state-sha256="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"/,
  );
  assert.match(
    markup,
    /data-flash-requirement-id="req-fq002-review-44"/,
  );
  assert.match(
    markup,
    /data-flash-trace-id="trace-fq002-review-44"/,
  );
  assert.doesNotMatch(markup, /data-current-js-functional-overlay/);
  assert.doesNotMatch(markup, /data-functional-canvas-artifact-mask/);
  assert.doesNotMatch(markup, /data-interaction-companion-surface/);
  assert.doesNotMatch(markup, /data-source-symbol-projection=/);
  assert.doesNotMatch(markup, /Modern reconstruction/);
});

test("non-entry, Spanish, wrong-domain, and capture requests fail closed to source-only rendering", () => {
  for (const markup of [
    render({frame: 2}),
    render({lang: "es"}),
    render({frameDomain: "root", scenario: "root-unavailable"}),
    render({entryStateSha256: ENTRY_SHA}),
  ]) {
    assert.match(markup, /data-current-js-controls-enabled="false"/);
    assert.match(markup, /data-current-js-overlay-count="0"/);
    assert.doesNotMatch(markup, /data-current-js-functional-overlay/);
    assert.doesNotMatch(markup, /data-functional-canvas-artifact-mask/);
    assert.match(markup, /data-source-canvas-visual-exposure="source-only"/);
  }
});

test("pause and reduced motion remain explicit host states without changing evidence gates", () => {
  const markup = render({paused: true, reducedMotion: true});

  assert.match(markup, /data-host-paused="true"/);
  assert.match(markup, /data-reduced-motion="true"/);
  assert.match(markup, /data-behavior-parity-established="false"/);
  assert.match(markup, /data-owner-accepted="false"/);
  assert.match(markup, /data-strict-migration-complete="false"/);
  assert.match(markup, /data-lesson-published="false"/);
});

test("pure source-static frame state remains available across the branch atlas", () => {
  for (const frame of [1, 2, 26, 43, 44, 68]) {
    const state = getCourseG04L03Fq002FrameState(frame, {
      frameDomain: "sprite-899",
      scenario: "source-static-frame",
      lang: "en",
      seed: 7,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.frame, frame);
    assert.equal(state.frameDomain, "sprite-899");
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.naturalRuntimeEstablished, false);
    assert.equal(state.audioRendered, false);
  }
});

test("functional contract records masking and modern enhancements while every acceptance gate stays false", () => {
  assert.deepEqual(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.currentJavascriptFunctionalEntry,
    {
      frameDomain: "sprite-899",
      frame: 1,
      scenario: "source-static-frame",
      language: "en",
      deterministicCaptureOverlayEnabled: false,
    },
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.livePlaybackEndFrame,
    1,
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT
      .sourceStaticDynamicVisibilityAndCounterParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT
      .sourceQuestionSelectionParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT
      .sourceReviewVisualParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT
      .sourceResultsVisualParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT
      .authoritativeOriginalRuntimeAccepted,
    false,
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.naturalRuntimeTraceAccepted,
    false,
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.humanVisualReviewAccepted,
    false,
  );
  assert.equal(COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.ownerAccepted, false);
  assert.equal(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.strictMigrationComplete,
    false,
  );
  assert.equal(COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.lessonPublished, false);
  assert.equal(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.strictAcceptanceEffect,
    "none",
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_FUNCTIONAL_MASKING_POLICY
      .deterministicCaptureMask,
    "none",
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_INTERACTION_AUTHORITY
      .sourceRandomParityEstablished,
    false,
  );
  assert.ok(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.currentJavascriptInteractionScope
      .includes("physical-double-click-answer-transition-lock"),
  );
  assert.ok(
    COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.currentJavascriptInteractionScope
      .includes(
        "Q7-Q12-source-bound-native-number-line-and-option-symbols",
      ),
  );
  assert.doesNotMatch(
    JSON.stringify(
      COURSE_G04_L03_FQ_002_SOURCE_CONTRACT.currentJavascriptInteractionScope,
    ),
    /TS007|cross-placement/,
  );
});


test("all six number-line questions retain full source ranges and all four symbols", () => {
  assert.deepEqual(FQ002_NUMBER_LINES.figures.map(figure => figure.questionId), [7, 8, 9, 10, 11, 12]);
  for (const figure of FQ002_NUMBER_LINES.figures) {
    const expected = figure.questionId < 9 ? ["–5", "0", "5"]
      : figure.questionId < 11 ? ["–10", "–5", "0", "5", "10"]
        : ["-15", "-10", "-5", "0", "5", "10", "15"];
    assert.deepEqual(figure.labels.map(label => label.text), expected);
    assert.equal(figure.shapes.flatMap(shape => shape.paths).filter(path => path.fill === "#cc9900" && (path.d.match(/[LQ]/g)?.length ?? 0) > 1).length, 4);
    const markup = renderToStaticMarkup(createElement(Fq002NumberLine, {questionId: figure.questionId}));
    for (const label of figure.labels) assert.ok(markup.includes(`data-source-text-id="${label.sourceTextId}"`));
    assert.match(markup, /tabindex="0"/);
    assert.doesNotMatch(markup, /correctOption|data-source-symbol-crop="target"/);
  }
  // Q9's circle is a separate placed symbol; omitting it loses part of the diagram.
  assert.deepEqual(FQ002_NUMBER_LINES.figures[2].shapes.map(shape => shape.id), [175, 177, 153]);
  assert.equal(renderToStaticMarkup(createElement(Fq002NumberLine, {questionId: 6})), "");
});


test("number-line descriptions derive every symbol position without exposing an answer key", () => {
  const expected = [[-4, -2, 2, 4], [-4, -2, 2, 4], [-8, -1, 4, 8], [-8, -1, 4, 8], [-11, -6, 6, 11], [-11, -6, 6, 11]];
  for (const [index, figure] of FQ002_NUMBER_LINES.figures.entries()) {
    assert.deepEqual(figure.symbols.map(symbol => symbol.value), expected[index]);
    assert.deepEqual(figure.symbols.map(symbol => symbol.name), ["Square", "Circle", "Triangle", "Heart"]);
    const markup = renderToStaticMarkup(createElement(Fq002NumberLine, {questionId: figure.questionId}));
    assert.match(markup, /<summary data-fq002-focus-control="number-line-description">Read number line positions<\/summary>/);
    for (const symbol of figure.symbols) assert.ok(markup.includes(`${symbol.name} at ${symbol.value}`));
    assert.doesNotMatch(markup, /correctOption|Correct answer|Target symbol/);
  }
});


test("source option letters bind native named shapes on every number-line question", () => {
  for (const figure of FQ002_NUMBER_LINES.figures) {
    assert.deepEqual(figure.options.map(option => [option.optionId, option.name, option.shapeId]),
      [["A", "Square", 150], ["B", "Circle", 153], ["C", "Triangle", 156], ["D", "Heart", 159]]);
    for (const option of figure.options) {
      assert.equal(option.sourceInstance, `A${figure.questionId}Opt${option.optionNumber}`);
      assert.ok(option.paths.some(path => path.fill === "#cc9900"));
    }
  }
});

// Cover each source question through the real renderer's seeded entry, including
// temperature/table questions absent from the default seed's ten-question run.
test("all 25 source questions enter native text and four bound answer controls", () => {
  const seeds = new Map<number, number>();
  for (let seed = 0; seed < 10000 && seeds.size < 25; seed++) {
    const id = createCourseG04L03Fq002InteractionState(seed).currentQuestion!.id;
    if (!seeds.has(id)) seeds.set(id, seed);
  }
  assert.equal(seeds.size, 25, "Seed coverage must include every source question");
  for (const question of COURSE_G04_L03_FQ_002_QUESTIONS) {
    const markup = render({seed: seeds.get(question.id)});
    const heading = renderToStaticMarkup(createElement("h2", {lang: "en"}, question.questionText));
    assert.ok(markup.includes(heading), `Missing native question ${question.id}`);
    assert.ok(markup.includes(`data-current-js-source-visual-frame="${question.questionFrame}"`));
    for (const option of question.options) {
      assert.ok(markup.includes(`data-source-option-instance="${option.sourceInstance}"`), `Missing Q${question.id} option ${option.id}`);
    }
    assert.ok(markup.includes('data-fq002-native-flow="true"'));
    assert.doesNotMatch(markup, /<span>Modern reconstruction<\/span>/);
  }
});

test("Spanish interface keeps source English question and independent audio language", () => {
  const markup = render({uiLanguage: "es", audioEnabled: true, onLessonHostRequest: () => undefined});
  assert.match(markup, /Pregunta 1 de 10/);
  assert.match(markup, /aria-label="Examen final"/);
  assert.match(markup, /aria-label="Opciones de respuesta"/);
  assert.match(markup, /Escuchar pregunta/);
  assert.match(markup, /Which symbol is located at/);
  assert.match(markup, /data-fq002-audio="g4-l3-fq002-fq-q07-question-es"/);
});

test("Spanish native regions distinguish interface language from English source content", () => {
  const markup = render({uiLanguage: "es"});
  assert.match(markup, /<section lang="es"/);
  assert.match(markup, /<p lang="es" data-fq002-source-language-note="en">Las preguntas y las respuestas conservan el texto original en inglés\. No hay una traducción verificada al español\.<\/p>/);
  assert.doesNotMatch(render({uiLanguage: "en"}), /<p[^>]*data-fq002-source-language-note=/);
  assert.match(markup, /<h2 lang="en">Which symbol/);
  assert.match(markup, /<p lang="en" class="fq002-native-quiz-title"/);
  assert.match(markup, /<figure lang="es"/);
  assert.match(markup, /<svg lang="en" viewBox="-6100/);
  assert.match(markup, /Leer las posiciones en la recta numérica/);
  assert.match(markup, /Diagrama de recta numérica/);
  assert.match(markup, /Cargando la ilustración original/);
  assert.match(markup, /<button lang="en" aria-label="A\. Square"/);
});

test("native temperature tables retain all source cells and expose bilingual keyboard scrolling", () => {
  for (const id of [22, 23, 24, 25]) {
    let seed = 0;
    while (createCourseG04L03Fq002InteractionState(seed).currentQuestion?.id !== id) seed++;
    const question = COURSE_G04_L03_FQ_002_QUESTIONS.find(value => value.id === id)!;
    for (const uiLanguage of ['en', 'es'] as const) {
      const markup = render({seed, uiLanguage});
      assert.match(markup, /class="fq002-native-table-scroll" role="region"/);
      assert.match(markup, /tabindex="0"/);
      assert.match(markup, /<th scope="col">/);
      for (const cell of question.contextText) {
        const escaped = renderToStaticMarkup(createElement('span', null, cell)).slice(6, -7);
        assert.ok(markup.includes(escaped), `Missing Q${id} table cell ${cell}`);
      }
      assert.ok(markup.includes(uiLanguage === 'es'
        ? 'Desplázate horizontalmente para ver todas las columnas.'
        : 'Scroll horizontally to see all columns.'));
    }
  }
});


test("FQ003 native Spanish UI preserves English source and never enables FQ002 audio", async () => {
  const {CourseG04L03Fq003Renderer} = await import("../src/modules/course-g04-l03-fq-003");
  const markup = renderToStaticMarkup(createElement(CourseG04L03Fq003Renderer, {
    frame: 1, frameDomain: "sprite-899", scenario: "source-static-frame", lang: "en", seed: 0,
    uiLanguage: "es", audioEnabled: true, onLessonHostRequest: () => undefined,
  }));
  assert.match(markup, /<section[^>]*lang="es"/);
  assert.match(markup, /<p[^>]*lang="es"[^>]*data-fq002-source-language-note="en"/);
  assert.match(markup, /<h2 lang="en">/);
  assert.match(markup, /Pregunta 1 de 25/);
  assert.doesNotMatch(markup, /<[^>]+data-fq002-audio=/);
  const capture = renderToStaticMarkup(createElement(CourseG04L03Fq003Renderer, {
    frame: 7, frameDomain: "sprite-899", scenario: "source-static-frame", lang: "en", seed: 0,
    uiLanguage: "es", entryStateSha256: ENTRY_SHA,
  }));
  assert.match(capture, /data-current-js-overlay-count="0"/);
  assert.doesNotMatch(capture, /<section[^>]+data-fq002-native-flow="true"/);
});

test("compatible number-line geometry identifies the current FQ003 source separately from its donor", async () => {
  const {COURSE_G04_L03_FQ_003_SOURCE} = await import("../src/timelines/course-g04-l03-fq-003");
  for (const questionId of [7, 11]) {
    const markup = renderToStaticMarkup(createElement(Fq002NumberLine, {
      questionId, sourceSwfSha256: COURSE_G04_L03_FQ_003_SOURCE.swfSha256, spanishUi: true,
    }));
    assert.match(markup, new RegExp('<figure[^>]+data-source-sha256="' + COURSE_G04_L03_FQ_003_SOURCE.swfSha256 + '"'));
    assert.match(markup, new RegExp('data-source-geometry-donor-sha256="' + COURSE_G04_L03_FQ_002_SOURCE.swfSha256 + '"'));
    const figure = FQ002_NUMBER_LINES.figures.find(item => item.questionId === questionId)!;
    for (const label of figure.labels) assert.ok(markup.includes(`data-source-text-id="${label.sourceTextId}"`));
    for (const shape of figure.shapes) assert.ok(markup.includes(`data-source-shape-id="${shape.id}"`));
  }
});

test("G4 L11 shared factory consumer retains its existing legacy presentation", async () => {
  const {CourseG04L11Fq003Renderer} = await import("../src/modules/course-g04-l11-fq-003");
  const markup = renderToStaticMarkup(createElement(CourseG04L11Fq003Renderer, {
    frame: 1, frameDomain: "sprite-910", scenario: "source-static-frame", lang: "en", seed: 0, uiLanguage: "es", audioEnabled: true,
  }));
  assert.match(markup, /data-final-quiz-animation-id="course-g04-l11-fq-003"/);
  assert.match(markup, /data-final-quiz-question-count="26"/);
  assert.doesNotMatch(markup, /<p[^>]+data-fq002-source-title/);
  assert.doesNotMatch(markup, /<figure[^>]+data-fq002-native-number-line=/);
  assert.doesNotMatch(markup, /<[^>]+data-fq002-audio=/);
});
