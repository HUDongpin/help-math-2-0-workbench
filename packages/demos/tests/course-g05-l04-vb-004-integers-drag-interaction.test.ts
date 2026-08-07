import assert from "node:assert/strict";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";

import courseVb004, {
  COURSE_G05_L04_VB_004_APP_OWNED_UI_COPY,
  COURSE_G05_L04_VB_004_SOURCE_CONTRACT,
  getCourseG05L04Vb004AppOwnedUiCopy,
  getCourseG05L04Vb004FrameState,
} from "../src/modules/course-g05-l04-vb-004";
import {
  COURSE_G05_L04_VB_004_CARDS,
  COURSE_G05_L04_VB_004_INPUT_METHODS,
  COURSE_G05_L04_VB_004_INTERACTION_AUTHORITY,
  COURSE_G05_L04_VB_004_INTERACTION_DOMAIN,
  COURSE_G05_L04_VB_004_INTERACTION_FRAME,
  COURSE_G05_L04_VB_004_INTERACTION_SCENARIO,
  COURSE_G05_L04_VB_004_SOURCE_CONTROL_FRAME,
  COURSE_G05_L04_VB_004_STAGE,
  COURSE_G05_L04_VB_004_TARGETS,
  createCourseG05L04Vb004InteractionState,
  getCourseG05L04Vb004AppOwnedCardLabel,
  getCourseG05L04Vb004AppOwnedTargetLabel,
  getCourseG05L04Vb004CardPlacement,
  getCourseG05L04Vb004FeedbackMessage,
  getCourseG05L04Vb004PlacedCount,
  getCourseG05L04Vb004SnapPoint,
  getCourseG05L04Vb004TargetAtPoint,
  projectClientPointToCourseG05L04Vb004Stage,
  reduceCourseG05L04Vb004Interaction,
  translateCourseG05L04Vb004CardCenter,
  type CourseG05L04Vb004CardId,
  type CourseG05L04Vb004InteractionState,
  type CourseG05L04Vb004TargetId,
} from "../src/timelines/course-g05-l04-vb-004-integers-drag-interaction";
import {COURSE_G05_L04_VB_004_AUTHORITY} from
  "../src/timelines/course-g05-l04-vb-004";

const selectCard = (
  state: CourseG05L04Vb004InteractionState,
  cardId: CourseG05L04Vb004CardId,
) => reduceCourseG05L04Vb004Interaction(state, {
  type: "select-card",
  cardId,
});

const dropCard = (
  state: CourseG05L04Vb004InteractionState,
  cardId: CourseG05L04Vb004CardId,
  targetId: CourseG05L04Vb004TargetId | null,
  input: "pointer" | "keyboard" | "touch" = "pointer",
) => reduceCourseG05L04Vb004Interaction(state, {
  type: "drop-card",
  cardId,
  targetId,
  input,
});

const renderCandidate = ({
  entryStateSha256,
  frame = COURSE_G05_L04_VB_004_INTERACTION_FRAME,
  lang = "en",
  requirementId,
  state,
  traceId,
  uiLanguage,
}: {
  readonly entryStateSha256?: string;
  readonly frame?: number;
  readonly lang?: "en" | "es";
  readonly requirementId?: string;
  readonly state?: unknown;
  readonly traceId?: string;
  readonly uiLanguage?: "en" | "es";
} = {}) => renderToStaticMarkup(createElement(courseVb004.Renderer, {
  entryStateSha256,
  frame,
  frameDomain: COURSE_G05_L04_VB_004_INTERACTION_DOMAIN,
  lang,
  requirementId,
  scenario: COURSE_G05_L04_VB_004_INTERACTION_SCENARIO,
  seed: 0,
  state,
  traceId,
  uiLanguage,
}));

test("VB004 binds all eight source cards to exact classifications and geometry", () => {
  assert.deepEqual(
    COURSE_G05_L04_VB_004_CARDS.map((card) => ({
      id: card.id,
      sourceCharacterId: card.sourceCharacterId,
      sourceDepth: card.sourceDepth,
      visibleText: card.visibleText,
      correctTargetId: card.correctTargetId,
      sourceCenter: card.sourceCenter,
      sourceCardSize: card.sourceCardSize,
      sourceVisualBounds: card.sourceVisualBounds,
    })),
    [
      {
        id: "Src_1", sourceCharacterId: 45, sourceDepth: 31,
        visibleText: "−5", correctTargetId: "Mc_Tar_1",
        sourceCenter: {x: 566.3, y: 171.5},
        sourceCardSize: {width: 34.00010375976563, height: 31.45},
        sourceVisualBounds: {
          left: 549.3, right: 591.7, top: 155.75, bottom: 187.2,
        },
      },
      {
        id: "Src_2", sourceCharacterId: 46, sourceDepth: 35,
        visibleText: "0", correctTargetId: "Mc_Tar_1",
        sourceCenter: {x: 566.3, y: 232.15},
        sourceCardSize: {width: 30.6, height: 31.45},
        sourceVisualBounds: {
          left: 551, right: 583.7, top: 216.4, bottom: 247.85,
        },
      },
      {
        id: "Src_3", sourceCharacterId: 47, sourceDepth: 38,
        visibleText: "1/4", correctTargetId: "Mc_Tar_2",
        sourceCenter: {x: 566.3, y: 302.8},
        sourceCardSize: {width: 30.6, height: 59.20005645751953},
        sourceVisualBounds: {
          left: 551, right: 584.7, top: 273.2, bottom: 332.4,
        },
      },
      {
        id: "Src_4", sourceCharacterId: 48, sourceDepth: 42,
        visibleText: "18", correctTargetId: "Mc_Tar_1",
        sourceCenter: {x: 566.3, y: 373.45},
        sourceCardSize: {width: 30.6, height: 31.45},
        sourceVisualBounds: {
          left: 551, right: 589.65, top: 357.75, bottom: 389.2,
        },
      },
      {
        id: "Src_5", sourceCharacterId: 49, sourceDepth: 45,
        visibleText: "3.9", correctTargetId: "Mc_Tar_2",
        sourceCenter: {x: 659.55, y: 171.5},
        sourceCardSize: {width: 42.49989624023438, height: 31.45},
        sourceVisualBounds: {
          left: 638.3, right: 686.9, top: 155.75, bottom: 187.2,
        },
      },
      {
        id: "Src_6", sourceCharacterId: 50, sourceDepth: 48,
        visibleText: "−10.5", correctTargetId: "Mc_Tar_2",
        sourceCenter: {x: 659.55, y: 232.15},
        sourceCardSize: {width: 62.90005187988282, height: 31.45},
        sourceVisualBounds: {
          left: 628.1, right: 698.85, top: 216.4, bottom: 247.85,
        },
      },
      {
        id: "Src_7", sourceCharacterId: 51, sourceDepth: 51,
        visibleText: "35/100", correctTargetId: "Mc_Tar_2",
        sourceCenter: {x: 659.55, y: 302.8},
        sourceCardSize: {
          width: 51.00015563964844,
          height: 59.20005645751953,
        },
        sourceVisualBounds: {
          left: 634.05, right: 689.4, top: 273.2, bottom: 332.4,
        },
      },
      {
        id: "Src_8", sourceCharacterId: 52, sourceDepth: 55,
        visibleText: "9", correctTargetId: "Mc_Tar_1",
        sourceCenter: {x: 659.55, y: 373.45},
        sourceCardSize: {width: 30.6, height: 31.45},
        sourceVisualBounds: {
          left: 644.25, right: 676.95, top: 357.75, bottom: 389.2,
        },
      },
    ],
  );
  assert.deepEqual(
    COURSE_G05_L04_VB_004_TARGETS.map((target) => ({
      id: target.id,
      label: target.label,
      sourceObjectId: target.sourceObjectId,
      bounds: target.bounds,
    })),
    [
      {
        id: "Mc_Tar_1",
        label: "Integers",
        sourceObjectId: 44,
        bounds: {
          left: 123.08943023681641,
          right: 269.0373062133789,
          top: 187.00015258789062,
          bottom: 397.9543914794922,
        },
      },
      {
        id: "Mc_Tar_2",
        label: "Non-Integers",
        sourceObjectId: 43,
        bounds: {
          left: 314.8958709646016,
          right: 463.005785774067,
          top: 184.9995880126953,
          bottom: 400.0274353027344,
        },
      },
    ],
  );
  assert.deepEqual(COURSE_G05_L04_VB_004_STAGE, {width: 800, height: 600});
  assert.equal(COURSE_G05_L04_VB_004_INTERACTION_FRAME, 208);
  assert.equal(COURSE_G05_L04_VB_004_SOURCE_CONTROL_FRAME, 209);
  assert.equal(Object.isFrozen(COURSE_G05_L04_VB_004_CARDS), true);
  assert.equal(Object.isFrozen(COURSE_G05_L04_VB_004_TARGETS), true);
});

test("VB004 projects viewport pointers into native stage and hit-tests both buckets", () => {
  const rect = {left: 100, top: 50, width: 400, height: 300};
  assert.deepEqual(
    projectClientPointToCourseG05L04Vb004Stage({x: 100, y: 50}, rect),
    {x: 0, y: 0},
  );
  assert.deepEqual(
    projectClientPointToCourseG05L04Vb004Stage({x: 500, y: 350}, rect),
    {x: 800, y: 600},
  );
  assert.deepEqual(
    projectClientPointToCourseG05L04Vb004Stage({x: 0, y: 0}, rect),
    {x: -200, y: -100},
    "projection must not clamp outside drops into a target",
  );

  for (const target of COURSE_G05_L04_VB_004_TARGETS) {
    const center = {
      x: (target.bounds.left + target.bounds.right) / 2,
      y: (target.bounds.top + target.bounds.bottom) / 2,
    };
    const clientPoint = {
      x: rect.left + (center.x * rect.width) / 800,
      y: rect.top + (center.y * rect.height) / 600,
    };
    const projected = projectClientPointToCourseG05L04Vb004Stage(
      clientPoint,
      rect,
    );
    assert.ok(projected);
    assert.ok(Math.abs(projected.x - center.x) < 1e-10);
    assert.ok(Math.abs(projected.y - center.y) < 1e-10);
    assert.equal(getCourseG05L04Vb004TargetAtPoint(projected), target.id);
    assert.equal(
      getCourseG05L04Vb004TargetAtPoint({
        x: target.bounds.left,
        y: target.bounds.top,
      }),
      target.id,
    );
  }
  assert.equal(
    getCourseG05L04Vb004TargetAtPoint({x: 290, y: 292}),
    null,
  );
  assert.equal(
    getCourseG05L04Vb004TargetAtPoint({x: -1, y: -1}),
    null,
  );
  assert.equal(
    projectClientPointToCourseG05L04Vb004Stage(
      {x: 1, y: 1},
      {...rect, width: 0},
    ),
    null,
  );
  assert.equal(
    projectClientPointToCourseG05L04Vb004Stage(
      {x: Number.NaN, y: 1},
      rect,
    ),
    null,
  );
  assert.deepEqual(
    translateCourseG05L04Vb004CardCenter(
      {x: 566.3, y: 171.5},
      {x: 600, y: 180},
      {x: 220, y: 300},
    ),
    {x: 186.29999999999995, y: 291.5},
  );
  assert.equal(
    translateCourseG05L04Vb004CardCenter(
      {x: Number.NaN, y: 0},
      {x: 0, y: 0},
      {x: 0, y: 0},
    ),
    null,
  );
  assert.deepEqual(
    getCourseG05L04Vb004SnapPoint("Mc_Tar_1", 0),
    {x: 196.06336822509763, y: 220},
  );
  assert.deepEqual(
    getCourseG05L04Vb004SnapPoint("Mc_Tar_2", 4),
    {x: 388.9508283693343, y: 367},
  );
});

test("all eight by two classifications agree across pointer, touch, and keyboard paths", () => {
  let transitionCount = 0;
  for (const card of COURSE_G05_L04_VB_004_CARDS) {
    for (const target of COURSE_G05_L04_VB_004_TARGETS) {
      for (const inputMode of ["pointer", "touch", "keyboard"] as const) {
        transitionCount++;
        const initial = createCourseG05L04Vb004InteractionState();
        const beforeDrop = inputMode === "keyboard"
          ? selectCard(initial, card.id)
          : initial;
        if (inputMode === "keyboard") {
          assert.equal(beforeDrop.selectedCardId, card.id);
        }
        const attempted = dropCard(
          beforeDrop,
          card.id,
          target.id,
          inputMode,
        );
        assert.equal(attempted.attemptSequence, 1);

        if (target.id === card.correctTargetId) {
          assert.equal(attempted.feedback?.kind, "correct");
          assert.equal(attempted.feedback?.attemptedTargetId, target.id);
          assert.equal(getCourseG05L04Vb004PlacedCount(attempted), 1);
          assert.deepEqual(
            getCourseG05L04Vb004CardPlacement(attempted, card.id),
            {targetId: target.id, index: 0},
          );
        } else {
          assert.equal(attempted.feedback?.kind, "wrong");
          assert.equal(attempted.feedback?.cardId, card.id);
          assert.equal(attempted.feedback?.attemptedTargetId, target.id);
          assert.equal(getCourseG05L04Vb004PlacedCount(attempted), 0);
          assert.deepEqual(attempted.buckets, initial.buckets);

          const retried = dropCard(
            attempted,
            card.id,
            card.correctTargetId,
            inputMode,
          );
          assert.equal(retried.feedback?.kind, "correct");
          assert.equal(getCourseG05L04Vb004PlacedCount(retried), 1);
        }
      }
    }
  }
  assert.equal(transitionCount, 48);
});

test("VB004 placements are idempotent, complete on eight, and Replay resets every phase", () => {
  const initial = createCourseG05L04Vb004InteractionState();
  const selected = selectCard(initial, "Src_1");
  const wrong = dropCard(initial, "Src_1", "Mc_Tar_2");
  const partial = dropCard(initial, "Src_1", "Mc_Tar_1");

  assert.equal(
    dropCard(partial, "Src_1", "Mc_Tar_1"),
    partial,
    "a placed card must not increment twice",
  );
  assert.equal(selectCard(partial, "Src_1"), partial);

  let complete = initial;
  for (const [index, card] of COURSE_G05_L04_VB_004_CARDS.entries()) {
    complete = dropCard(
      complete,
      card.id,
      card.correctTargetId,
      index % 2 === 0 ? "pointer" : "touch",
    );
    assert.equal(getCourseG05L04Vb004PlacedCount(complete), index + 1);
    assert.equal(
      complete.status,
      index === COURSE_G05_L04_VB_004_CARDS.length - 1
        ? "complete"
        : "ready",
    );
  }
  assert.equal(complete.feedback?.kind, "complete");
  assert.equal(complete.attemptSequence, 8);
  assert.deepEqual(complete.buckets, {
    Mc_Tar_1: ["Src_1", "Src_2", "Src_4", "Src_8"],
    Mc_Tar_2: ["Src_3", "Src_5", "Src_6", "Src_7"],
  });
  assert.equal(selectCard(complete, "Src_1"), complete);
  assert.equal(dropCard(complete, "Src_1", "Mc_Tar_2"), complete);

  for (const state of [selected, wrong, partial, complete]) {
    const replayed = reduceCourseG05L04Vb004Interaction(state, {
      type: "replay",
    });
    assert.deepEqual(replayed, initial);
    assert.notEqual(replayed, state);
  }
});

test("source-runtime English frame 208 exposes the fail-closed functional surfaces", () => {
  const before = renderCandidate({frame: 207});
  assert.match(before, /data-current-js-interaction-eligible="false"/);
  assert.match(before, /data-current-js-functional-candidate="false"/);
  assert.doesNotMatch(before, /data-surface="stage"/);
  assert.doesNotMatch(before, /data-surface="responsive-touch"/);

  const markup = renderCandidate();
  assert.match(markup, /data-current-js-interaction-eligible="true"/);
  assert.match(markup, /data-source-runtime-language="en"/);
  assert.match(markup, /data-app-owned-ui-language="en"/);
  assert.match(markup, /data-current-js-functional-candidate="true"/);
  assert.match(
    markup,
    /data-current-js-functional-scope="vb004-integers-source-script-bound-classification"/,
  );
  assert.match(markup, /data-current-js-controls-enabled="false"/);
  assert.equal(
    markup.match(/data-current-js-controls-ready="false"/g)?.length,
    2,
  );
  assert.match(markup, /data-surface="stage"/);
  assert.match(markup, /data-surface="responsive-touch"/);
  assert.equal(markup.match(/data-source-target=/g)?.length, 2);
  assert.equal(markup.match(/data-mobile-source-card=/g)?.length, 8);
  assert.equal(markup.match(/data-mobile-source-target=/g)?.length, 2);
  assert.equal(markup.match(/data-card-placed=/g)?.length ?? 0, 0);
  assert.equal(markup.match(/data-source-card=/g)?.length, 8);
  assert.equal(markup.match(/<button/g)?.length, 20);
  assert.equal(markup.match(/disabled=""/g)?.length, 20);
  assert.match(markup, /data-source-canvas-accessibility-isolated="true"/);
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /inert=""/);
  assert.match(markup, /pointer-events:none/);
  assert.match(markup, /aria-live="polite"/);
  assert.match(markup, /data-interaction-status="ready"/);
  assert.match(markup, /min-height:\s*44px/);
  assert.match(markup, /button:focus-visible/);
  assert.deepEqual(COURSE_G05_L04_VB_004_INPUT_METHODS, [
    "pointer-drag",
    "touch-pointer-drag",
    "select-card-then-target-keyboard",
    "select-card-then-target-touch",
    "escape-cancel",
  ]);
  for (const inputMethod of COURSE_G05_L04_VB_004_INPUT_METHODS) {
    assert.match(markup, new RegExp(inputMethod));
  }
  assert.ok(
    COURSE_G05_L04_VB_004_SOURCE_CONTRACT.currentJavascriptInteractionScope
      .includes("pointer-and-touch-drag-with-pointer-capture"),
  );
  assert.ok(
    COURSE_G05_L04_VB_004_SOURCE_CONTRACT.currentJavascriptInteractionScope
      .includes("select-card-then-target-keyboard-and-touch-alternative"),
  );
});

test("English source runtime can expose Spanish app-owned controls without claiming Spanish source evidence", () => {
  const markup = renderCandidate({lang: "en", uiLanguage: "es"});

  assert.match(markup, /data-current-js-interaction-eligible="true"/);
  assert.match(markup, /data-current-js-functional-candidate="true"/);
  assert.match(markup, /data-source-runtime-language="en"/);
  assert.match(markup, /data-flash-lang="en"/);
  assert.equal(
    markup.match(/data-app-owned-ui-language="es"/g)?.length,
    3,
  );
  assert.match(markup, /lang="es"/);
  assert.match(markup, /Clasifica cada número como entero o no entero/);
  assert.match(
    markup,
    /aria-label="Controles responsivos para clasificar números enteros"/,
  );
  assert.match(markup, /Elige un número y luego elige su categoría\./);
  assert.match(markup, /aria-label="Números para clasificar"/);
  assert.match(markup, /aria-label="Categorías de números"/);
  assert.match(markup, /aria-label="Seleccionar menos cinco"/);
  assert.match(markup, /aria-label="Colocar en Enteros"/);
  assert.match(markup, />Enteros<\/button>/);
  assert.match(markup, />No enteros<\/button>/);
  assert.ok(
    markup.includes(COURSE_G05_L04_VB_004_APP_OWNED_UI_COPY.es.loading),
  );
  assert.doesNotMatch(
    markup,
    /Choose a number, then choose its category\./,
  );

  assert.equal(
    getCourseG05L04Vb004AppOwnedCardLabel("Src_1", "es"),
    "menos cinco",
  );
  assert.equal(
    getCourseG05L04Vb004AppOwnedTargetLabel("Mc_Tar_2", "es"),
    "No enteros",
  );
  assert.deepEqual(
    getCourseG05L04Vb004AppOwnedUiCopy("es"),
    COURSE_G05_L04_VB_004_APP_OWNED_UI_COPY.es,
  );
  assert.match(
    COURSE_G05_L04_VB_004_APP_OWNED_UI_COPY.es.error,
    /No se pudo cargar la pregunta fuente/,
  );
  assert.match(
    COURSE_G05_L04_VB_004_APP_OWNED_UI_COPY.es.blocked,
    /no está disponible en este contexto/,
  );
  assert.equal(
    COURSE_G05_L04_VB_004_SOURCE_CONTRACT.currentJavascriptFunctionalEntry
      .language,
    "en",
  );
  assert.equal(
    COURSE_G05_L04_VB_004_SOURCE_CONTRACT.spanishInteractionStatus,
    "unimplemented-disabled",
  );
  assert.equal(
    COURSE_G05_L04_VB_004_SOURCE_CONTRACT.appOwnedUiLocalizationStatus,
    "en-es-source-runtime-language-and-source-evidence-unchanged",
  );
});

test("app-owned feedback localizes every interaction status without changing reducer state", () => {
  const initial = createCourseG05L04Vb004InteractionState();
  const selected = selectCard(initial, "Src_1");
  const wrong = dropCard(initial, "Src_1", "Mc_Tar_2");
  const correct = dropCard(initial, "Src_1", "Mc_Tar_1");
  let complete = initial;
  for (const card of COURSE_G05_L04_VB_004_CARDS) {
    complete = dropCard(complete, card.id, card.correctTargetId);
  }

  assert.equal(
    getCourseG05L04Vb004FeedbackMessage(initial, "es"),
    "Mueve cada número a Enteros o No enteros.",
  );
  assert.equal(
    getCourseG05L04Vb004FeedbackMessage(selected, "es"),
    "Seleccionaste menos cinco. Elige Enteros o No enteros.",
  );
  assert.equal(
    getCourseG05L04Vb004FeedbackMessage(wrong, "es"),
    "menos cinco no pertenece a No enteros. Inténtalo de nuevo.",
  );
  assert.equal(
    getCourseG05L04Vb004FeedbackMessage(correct, "es"),
    "menos cinco es un entero. Correcto.",
  );
  assert.equal(
    getCourseG05L04Vb004FeedbackMessage(complete, "es"),
    "¡Buen trabajo! Los ocho números están clasificados correctamente.",
  );
  assert.equal(
    getCourseG05L04Vb004FeedbackMessage(correct),
    "negative five is an integer. Correct.",
  );
  assert.equal(correct.buckets.Mc_Tar_1[0], "Src_1");
  assert.equal(complete.status, "complete");
});

test("capture, Spanish, and source-controlled frames suppress every modern control", () => {
  const identity = {
    entryStateSha256:
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    requirementId: "VB004-INTEGERS-F208",
    traceId: "vb004-integers-source-static-f208",
  } as const;
  const captureState = getCourseG05L04Vb004FrameState(
    COURSE_G05_L04_VB_004_INTERACTION_FRAME,
    {
      ...identity,
      frameDomain: COURSE_G05_L04_VB_004_INTERACTION_DOMAIN,
      lang: "en",
      scenario: COURSE_G05_L04_VB_004_INTERACTION_SCENARIO,
      seed: 0,
    },
  );
  assert.equal(captureState.status, "ready");
  const captureMarkup = renderCandidate({
    ...identity,
    state: captureState,
  });
  assert.match(captureMarkup, /data-deterministic-evidence-capture="true"/);
  assert.match(captureMarkup, /data-current-js-interaction-eligible="false"/);
  assert.match(captureMarkup, /data-current-js-functional-candidate="false"/);
  assert.match(
    captureMarkup,
    /data-source-canvas-accessibility-isolated="false"/,
  );
  assert.match(captureMarkup, /data-flash-frame="208"/);
  assert.match(
    captureMarkup,
    new RegExp(`data-flash-entry-state-sha256="${identity.entryStateSha256}"`),
  );
  assert.doesNotMatch(captureMarkup, /data-surface=/);
  assert.doesNotMatch(captureMarkup, /data-source-target=/);
  assert.doesNotMatch(captureMarkup, /data-mobile-source-card=/);
  assert.equal(captureMarkup.match(/<button/g)?.length ?? 0, 0);

  const spanishMarkup = renderCandidate({lang: "es"});
  assert.match(
    spanishMarkup,
    /data-fail-closed-reason="spanish-visual-and-audio-unvalidated"/,
  );
  assert.doesNotMatch(spanishMarkup, /<canvas/);
  assert.doesNotMatch(spanishMarkup, /data-surface=/);

  for (const frame of [209, 257]) {
    const state = getCourseG05L04Vb004FrameState(frame, {
      frameDomain: COURSE_G05_L04_VB_004_INTERACTION_DOMAIN,
      lang: "en",
      scenario: COURSE_G05_L04_VB_004_INTERACTION_SCENARIO,
      seed: 0,
    });
    assert.equal(state.status, "blocked");
    assert.equal(
      state.blocker,
      "source-behavior-dependent-frame-unvalidated",
    );
    const blockedMarkup = renderCandidate({frame, state});
    assert.match(
      blockedMarkup,
      /data-fail-closed-reason="source-behavior-dependent-frame-unvalidated"/,
    );
    assert.doesNotMatch(blockedMarkup, /data-surface=/);
    assert.doesNotMatch(blockedMarkup, /data-source-target=/);
  }
});

test("VB004 remains prototype-only with audio, owner, fidelity, and strict gates closed", () => {
  assert.equal(courseVb004.maturity, "legacy-prototype");
  assert.equal(courseVb004.audioCues.length, 0);
  assert.equal(
    COURSE_G05_L04_VB_004_SOURCE_CONTRACT.currentJavascriptInteractionStatus,
    "source-script-bound-integers-classification-functional-candidate",
  );
  assert.equal(
    COURSE_G05_L04_VB_004_SOURCE_CONTRACT.audioStatus,
    "inventoried-unmapped-disabled",
  );
  assert.equal(
    COURSE_G05_L04_VB_004_SOURCE_CONTRACT.sourceFeedbackAudioStatus,
    "inventoried-unimplemented-unaccepted",
  );
  assert.equal(
    COURSE_G05_L04_VB_004_SOURCE_CONTRACT.associatedAudioStatus,
    "inventoried-unimplemented-unaccepted",
  );
  assert.equal(
    COURSE_G05_L04_VB_004_INTERACTION_AUTHORITY.strictAcceptanceEffect,
    "none",
  );
  for (const [name, value] of Object.entries(
    COURSE_G05_L04_VB_004_INTERACTION_AUTHORITY,
  )) {
    if (typeof value === "boolean") assert.equal(value, false, name);
  }
  for (const gate of [
    "naturalTerminalContinuationEstablished",
    "behaviorParityEstablished",
    "replayParityEstablished",
    "originalRuntimeAuthorityEstablished",
    "humanVisualReviewAccepted",
    "ownerAccepted",
    "strictMigrationComplete",
  ] as const) {
    assert.equal(COURSE_G05_L04_VB_004_SOURCE_CONTRACT[gate], false, gate);
  }
  for (const gate of [
    "sourceActionScriptExecuted",
    "sourceSnapBehaviorEstablished",
    "embeddedCoachAudioModeled",
    "associatedAudioModeled",
    "audioParityEstablished",
    "behaviorParityEstablished",
    "replayParityEstablished",
    "originalRuntimeAuthorityEstablished",
    "fullFrameRmseEstablished",
    "humanVisualReviewAccepted",
    "ownerAccepted",
    "strictMigrationComplete",
    "publicationAuthorized",
    "lessonPublished",
  ] as const) {
    assert.equal(COURSE_G05_L04_VB_004_INTERACTION_AUTHORITY[gate], false, gate);
  }
  assert.equal(
    COURSE_G05_L04_VB_004_AUTHORITY.registryIsPrototypeOnly,
    true,
  );
  assert.equal(COURSE_G05_L04_VB_004_AUTHORITY.behaviorParityEstablished, false);
  assert.equal(COURSE_G05_L04_VB_004_AUTHORITY.ownerAccepted, false);
  assert.equal(COURSE_G05_L04_VB_004_AUTHORITY.strictMigrationComplete, false);

  const markup = renderCandidate();
  assert.match(markup, /data-audio-rendered="false"/);
  assert.match(markup, /data-owner-accepted="false"/);
  assert.match(markup, /data-strict-migration-complete="false"/);
  assert.match(markup, /data-strict-acceptance-effect="none"/);
});
