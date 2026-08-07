import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import courseIn010, {
  COURSE_G04_L03_IN_010_MOVIE,
  COURSE_G04_L03_IN_010_RUNTIME,
  COURSE_G04_L03_IN_010_SOURCE,
  COURSE_G04_L03_IN_010_SOURCE_CONTRACT,
  buildCourseG04L03In010CaptureAttributes,
  getCourseG04L03In010FrameState,
  getCourseG04L03In010SourceCanvasRenderKey,
  normalizeCourseG04L03In010Frame,
} from "../src/modules/course-g04-l03-in-010";
import {matchPrototype} from "../src/prototype-manifest";
import {
  COURSE_G04_L03_IN_010_CARDS,
  COURSE_G04_L03_IN_010_CURRENT_JS_TIMING,
  COURSE_G04_L03_IN_010_INTERACTION_AUTHORITY,
  COURSE_G04_L03_IN_010_SOURCE_GEOMETRY,
  COURSE_G04_L03_IN_010_SOURCE_GLOSSARY_TERMS,
  COURSE_G04_L03_IN_010_WRONG_FEEDBACK,
} from "../src/timelines/course-g04-l03-in-010-temperature-drag-interaction";
import {COURSE_G04_L03_IN_010_AUTHORITY} from "../src/timelines/course-g04-l03-in-010";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

const expectedCompanionDomains = [
  ["sprite-5", 1], ["sprite-47", 1], ["sprite-52", 25],
  ["sprite-55", 1], ["sprite-58", 1], ["sprite-61", 1],
  ["sprite-63", 1], ["sprite-66", 1], ["sprite-69", 1],
  ["sprite-70", 1], ["sprite-71", 1], ["sprite-72", 1],
  ["sprite-73", 1], ["sprite-74", 1], ["sprite-75", 1],
  ["sprite-87", 15], ["sprite-89", 20],
] as const;

test("IN010 preserves the root, sprite-90, interactions, and domain facts", async () => {
  assert.deepEqual(COURSE_G04_L03_IN_010_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_IN_010_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_IN_010_MOVIE.frameCount, 264);
  assert.equal(COURSE_G04_L03_IN_010_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_IN_010_RUNTIME.defaultFrameDomain, "sprite-90");
  assert.deepEqual(COURSE_G04_L03_IN_010_RUNTIME.frameDomains, [
    {id: "sprite-90", frameCount: 264, fps: 12, rootFrame: 6},
    ...expectedCompanionDomains.map(([id, frameCount]) =>
      ({id, frameCount, fps: 12, rootFrame: 6})),
  ]);
  assert.deepEqual(COURSE_G04_L03_IN_010_SOURCE.buttonObjectIds, [39, 40, 84]);
  assert.deepEqual(COURSE_G04_L03_IN_010_SOURCE.dragItemObjectIds,
    [70, 71, 72, 73, 74, 75]);
  assert.equal(COURSE_G04_L03_IN_010_SOURCE.dragDropPlacementFrame, 264);
  assert.equal(COURSE_G04_L03_IN_010_SOURCE.interactionSignalCount, 15);
  assert.equal(COURSE_G04_L03_IN_010_SOURCE.timelineNavigationOccurrenceCount, 27);
  assert.equal(courseIn010.runtime, COURSE_G04_L03_IN_010_RUNTIME);
  assert.equal(Object.keys(courseIn010.playbackEndFrameByDomain ?? {}).length, 18);
  assert.equal(courseIn010.playbackEndFrameByDomain?.root, 1);
  assert.equal(courseIn010.playbackEndFrameByDomain?.["sprite-52"], 1);
  for (const [path, expected] of [
    [COURSE_G04_L03_IN_010_SOURCE.swf, COURSE_G04_L03_IN_010_SOURCE.swfSha256],
    [COURSE_G04_L03_IN_010_SOURCE.fla, COURSE_G04_L03_IN_010_SOURCE.flaSha256],
    [COURSE_G04_L03_IN_010_SOURCE.associatedAudio,
      COURSE_G04_L03_IN_010_SOURCE.associatedAudioSha256],
  ] as const) {
    assert.equal(sha256(await readFile(`${repositoryRoot}${path}`)), expected);
  }
});

test("IN010 exposes bounded one-indexed English sprite-90 drawings", () => {
  assert.equal(normalizeCourseG04L03In010Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03In010Frame(265), 264);
  assert.equal(normalizeCourseG04L03In010Frame(8, "root"), 8);
  assert.equal(normalizeCourseG04L03In010Frame(26, "sprite-52"), 25);
  for (const frame of [1, 132, 263, 264]) {
    const state = getCourseG04L03In010FrameState(frame, {
      frameDomain: "sprite-90",
      scenario: "source-static-frame",
      lang: "en",
      seed: frame === 264 ? -1 : 0,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.frame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.deepEqual(state.visibleSourceMarkers,
      frame < 264
        ? ["negative-number-temperature"]
        : ["negative-number-temperature", "six-item-drag-drop-static-drawing"]);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
    assert.equal(state.naturalRuntimeEstablished, false);
  }
});

test("IN010 fails closed for Spanish, root, companions, and unsupported domains", () => {
  const requests = [
    ["sprite-90", "source-static-frame", "es", "spanish-visual-and-audio-unvalidated"],
    ["root", "root-unavailable", "en", "root-baseline-unavailable"],
    ["sprite-52", "sprite-52-unavailable", "en", "companion-domain-unrendered"],
    ["sprite-83", "sprite-83-unavailable", "en", "unsupported-runtime-request"],
    ["root", "source-static-frame", "en", "frame-domain-scenario-mismatch"],
  ] as const;
  for (const [frameDomain, scenario, lang, blocker] of requests) {
    const state = getCourseG04L03In010FrameState(1, {
      frameDomain,
      scenario,
      lang,
      seed: 0,
    });
    assert.equal(state.blocker, blocker);
  }
});

test("IN010 capture identity remains deterministic, muted, and noninteractive", () => {
  const state = getCourseG04L03In010FrameState(264, {
    frameDomain: "sprite-90",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const attributes = buildCourseG04L03In010CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-264",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(attributes["data-capture-stage"], "true");
  assert.equal(attributes["data-flash-frame-domain"], "sprite-90");
  assert.equal(attributes["data-source-controls-enabled"], "false");
  assert.equal(attributes["data-source-marker-visuals"],
    "negative-number-temperature,six-item-drag-drop-static-drawing");
});

test("IN010 frame 264 exposes fail-closed controls over memoized frame 263", () => {
  const wholeLessonHostState = getCourseG04L03In010FrameState(264, {
    frameDomain: "sprite-90",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  });
  const markup = renderToStaticMarkup(createElement(courseIn010.Renderer, {
    frame: 264,
    frameDomain: "sprite-90",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    state: wholeLessonHostState,
  }));

  assert.doesNotMatch(markup, /data-fail-closed-reason/);
  assert.match(markup, /<canvas/);
  assert.match(markup, /data-current-js-controls-enabled="false"/);
  assert.match(markup, /data-current-js-interaction-eligible="true"/);
  assert.match(markup, /data-current-js-functional-candidate="true"/);
  assert.match(
    markup,
    /data-current-js-functional-scope="in010-temperature-drag-source-script-bound"/,
  );
  assert.match(markup, /data-current-js-source-visual-frame="263"/);
  assert.match(markup, /data-flash-frame="263"/);
  assert.match(
    markup,
    /data-source-canvas-accessibility-isolated="true"/,
  );
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /inert=""/);
  assert.match(markup, /pointer-events:none/);
  assert.match(markup, /data-current-js-controls-ready="false"/);
  assert.match(markup, /data-source-canvas-status="idle"/);
  assert.match(
    markup,
    /aria-label="Select Seattle, Washington, 51 degrees Fahrenheit to move"[^>]*disabled=""/,
  );
  assert.match(
    markup,
    /aria-label="Place selected city at thermometer position 1"[^>]*disabled=""/,
  );
  assert.equal(markup.match(/data-source-card="/g)?.length, 6);
  assert.equal(markup.match(/data-source-target="/g)?.length, 6);
  assert.equal(markup.match(/data-hit-target-minimum="48"/g)?.length, 6);
  assert.match(
    markup,
    /data-target-overlap-adaptation="split-horizontal-hit-regions"/,
  );
  assert.match(
    markup,
    /data-current-js-source-label-rendering="donor-retained-logical-button-disabled"/,
  );
  assert.match(markup, /data-source-visual-hide-parity-established="false"/);
  assert.match(markup, /data-post-drop-visual-parity-established="false"/);
  assert.match(markup, /data-visual-parity-established="false"/);
  assert.match(markup, /data-host-wrong-feedback-resolved="false"/);
  assert.match(markup, /data-interaction-companion-surface="mobile"/);
  assert.match(markup, /data-interaction-companion-placement="fallback"/);
  assert.match(markup, /data-mobile-touch-target-min="48"/);
  assert.match(
    markup,
    /data-mobile-target-overlap-adaptation="separate-grid-controls"/,
  );
  assert.match(markup, /\(any-pointer: coarse\)/);
  assert.match(markup, /grid-row: 7/);
  assert.match(markup, /min-height: 48px/);
  assert.match(markup, /data-host-glossary-actions="safe-disabled"/);
  assert.match(
    markup,
    /data-host-glossary-function="DoHyperLinks-unresolved"/,
  );
  assert.equal(markup.match(/data-source-glossary-term="/g)?.length, 2);
  for (const [visibleText, keyAttribute] of [
    ["temperature", "Temperature"],
    ["thermometer", "Thermometer"],
  ]) {
    assert.match(
      markup,
      new RegExp(`data-source-glossary-term="${visibleText}"`),
    );
    assert.match(
      markup,
      new RegExp(`data-source-glossary-key="${keyAttribute}"`),
    );
  }
  assert.doesNotMatch(markup, /aria-label="Open Need More Help"/);
  assert.doesNotMatch(markup, /aria-label="Clear"/);
  assert.doesNotMatch(markup, /aria-label="New Number"/);

  assert.equal(COURSE_G04_L03_IN_010_CARDS.length, 6);
  assert.equal(
    Object.keys(COURSE_G04_L03_IN_010_SOURCE_GEOMETRY.cards).length,
    6,
  );
  assert.equal(
    Object.keys(COURSE_G04_L03_IN_010_SOURCE_GEOMETRY.targets).length,
    6,
  );
  assert.equal(COURSE_G04_L03_IN_010_SOURCE_GLOSSARY_TERMS.length, 2);
  assert.equal(
    COURSE_G04_L03_IN_010_SOURCE_GLOSSARY_TERMS.every(
      ({enabled, hostContentResolved, status}) =>
        !enabled && !hostContentResolved && status === "safe-disabled",
    ),
    true,
  );
  assert.equal(
    COURSE_G04_L03_IN_010_SOURCE_GEOMETRY.interactionFrame,
    264,
  );
  assert.equal(
    COURSE_G04_L03_IN_010_SOURCE_GEOMETRY.initialInteractionDonorFrame,
    263,
  );
  assert.equal(
    COURSE_G04_L03_IN_010_SOURCE_GEOMETRY.postDropVisualDonorFrame,
    null,
  );
  assert.equal(
    COURSE_G04_L03_IN_010_WRONG_FEEDBACK.resolvedHostText,
    null,
  );
  assert.equal(
    COURSE_G04_L03_IN_010_WRONG_FEEDBACK.canvasStaticGlyph,
    "Try Again!",
  );
  assert.equal(
    COURSE_G04_L03_IN_010_WRONG_FEEDBACK.closeLabel,
    "Close",
  );
  assert.equal(
    COURSE_G04_L03_IN_010_CURRENT_JS_TIMING.perCardCorrectFeedbackMs,
    1_500,
  );
  assert.equal(
    COURSE_G04_L03_IN_010_CURRENT_JS_TIMING.finalCorrectFeedbackMs,
    (23 * 1_000) / 12,
  );
  assert.notEqual(
    getCourseG04L03In010SourceCanvasRenderKey(0, 0, 263),
    getCourseG04L03In010SourceCanvasRenderKey(1, 0, 263),
  );
  assert.notEqual(
    getCourseG04L03In010SourceCanvasRenderKey(0, 0, 263),
    getCourseG04L03In010SourceCanvasRenderKey(0, 0, 264),
  );
  assert.equal(courseIn010.reducedMotionFrame, 264);
  assert.equal(
    COURSE_G04_L03_IN_010_SOURCE_CONTRACT.currentJavascriptInteractionStatus,
    "source-script-bound-functional-candidate",
  );
  assert.equal(
    COURSE_G04_L03_IN_010_SOURCE_CONTRACT.currentJavascriptTiming,
    COURSE_G04_L03_IN_010_CURRENT_JS_TIMING,
  );
  assert.equal(
    COURSE_G04_L03_IN_010_SOURCE_CONTRACT.interactionAuthority,
    COURSE_G04_L03_IN_010_INTERACTION_AUTHORITY,
  );
  assert.equal(
    COURSE_G04_L03_IN_010_SOURCE_CONTRACT.wrongFeedbackTextStatus,
    "canvas-static-glyph-fallback-host-global-unresolved",
  );
  assert.equal(
    COURSE_G04_L03_IN_010_SOURCE_CONTRACT.sourceGlossaryActionStatus,
    "two-source-hits-safe-disabled",
  );
  for (const scope of [
    "html-drag-and-drop-and-select-then-target-keyboard-alternative",
    "source-target-label-reveal-after-logical-correct-placement",
    "source-buttons-disabled-after-placement-with-f263-source-visual-retained",
    "no-source-hide-or-post-drop-visual-parity-claim",
    "sixth-card-two-stage-23-over-12-second-feedback-and-persistent-current-js-terminal",
    "host-pause-freezes-current-js-per-card-and-final-feedback-delays",
    "reduced-motion-immediate-current-js-feedback-transitions",
    "whole-renderer-replay-reset-and-source-canvas-remount",
    "responsive-mobile-and-coarse-pointer-touch-control-surface",
    "page-interaction-companion-portal-with-stage-fallback",
    "non-overlapping-mobile-target-grid-for-33-and-34-degree-targets",
    "wide-coarse-companion-grid-row-seven",
    "desktop-mobile-focus-migration-and-wrong-close-focus-restore",
    "answer-controls-fail-closed-until-source-canvas-ready",
    "memoized-frame-263-initial-donor-under-frame-264-functional-overlay",
    "deterministic-entry-state-capture-preserves-requested-frame-without-overlay",
    "no-local-help-clear-or-new-controls-invented",
  ]) {
    assert.ok(
      COURSE_G04_L03_IN_010_SOURCE_CONTRACT.currentJavascriptInteractionScope
        .includes(scope),
      scope,
    );
  }
  for (const [name, value] of Object.entries(
    COURSE_G04_L03_IN_010_INTERACTION_AUTHORITY,
  )) {
    if (typeof value === "boolean") assert.equal(value, false, name);
  }
  for (const gate of [
    "sourceVisualHideParityEstablished",
    "postDropVisualParityEstablished",
    "visualParityEstablished",
    "naturalTerminalContinuationEstablished",
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
    assert.equal(COURSE_G04_L03_IN_010_SOURCE_CONTRACT[gate], false, gate);
  }
  assert.equal(
    COURSE_G04_L03_IN_010_SOURCE_CONTRACT.strictAcceptanceEffect,
    "none",
  );
});

test("IN010 entry-state capture preserves source frame 264 with zero overlays", () => {
  const entryStateSha256 =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  assert.equal(entryStateSha256.length, 64);
  const wholeLessonHostState = getCourseG04L03In010FrameState(264, {
    entryStateSha256,
    frameDomain: "sprite-90",
    requirementId: "IN010-TEMPERATURE-READY",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
    traceId: "in010-source-static-f264",
  });
  const markup = renderToStaticMarkup(createElement(courseIn010.Renderer, {
    entryStateSha256,
    frame: 264,
    frameDomain: "sprite-90",
    requirementId: "IN010-TEMPERATURE-READY",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
    state: wholeLessonHostState,
    traceId: "in010-source-static-f264",
  }));

  assert.match(markup, /data-deterministic-evidence-capture="true"/);
  assert.match(markup, /data-current-js-controls-enabled="false"/);
  assert.match(markup, /data-current-js-interaction-eligible="false"/);
  assert.match(markup, /data-current-js-functional-candidate="false"/);
  assert.match(markup, /data-current-js-source-visual-frame="264"/);
  assert.match(markup, /data-flash-frame="264"/);
  assert.match(
    markup,
    new RegExp(`data-flash-entry-state-sha256="${entryStateSha256}"`),
  );
  assert.match(markup, /data-flash-requirement-id="IN010-TEMPERATURE-READY"/);
  assert.match(markup, /data-flash-trace-id="in010-source-static-f264"/);
  assert.match(
    markup,
    /data-source-canvas-accessibility-isolated="false"/,
  );
  assert.match(markup, /<canvas/);
  assert.doesNotMatch(markup, /inert=""/);
  assert.doesNotMatch(
    markup,
    /aria-label="Source-script-bound current JavaScript temperature placement activity"/,
  );
  assert.doesNotMatch(markup, /data-source-card="/);
  assert.doesNotMatch(markup, /data-source-target="/);
  assert.doesNotMatch(markup, /data-host-glossary-actions=/);
  assert.doesNotMatch(markup, /data-interaction-companion-surface="mobile"/);
  assert.equal(markup.match(/<button/g)?.length ?? 0, 0);
});

test("IN010 remains prototype-only with every acceptance gate closed", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-in-010"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.runtime.frameDomains?.length, 18);
  assert.equal(manifest?.movie.frameCount, 264);
  assert.equal(manifest?.title.en, "Situations with Negative Numbers: Temperature");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3IN10.swf"}), undefined);
  const registered = await loadAnimationModule("course-g04-l03-in-010");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  assert.equal(COURSE_G04_L03_IN_010_SOURCE_CONTRACT.ownerAccepted, false);
  for (const [name, value] of Object.entries(COURSE_G04_L03_IN_010_AUTHORITY)) {
    if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect") continue;
    assert.equal(value, false, name);
  }
  assert.equal(COURSE_G04_L03_IN_010_AUTHORITY.registryIsPrototypeOnly, true);
  const spanishMarkup = renderToStaticMarkup(
    createElement(courseIn010.Renderer, {
      frame: 1,
      frameDomain: "sprite-90",
      scenario: "source-static-frame",
      lang: "es",
      seed: 0,
    }),
  );
  assert.match(spanishMarkup,
    /data-fail-closed-reason="spanish-visual-and-audio-unvalidated"/);
  assert.match(spanishMarkup, /data-audio-rendered="false"/);
  assert.match(spanishMarkup, /data-owner-accepted="false"/);
  assert.match(spanishMarkup, /data-strict-migration-complete="false"/);
  assert.doesNotMatch(spanishMarkup, /<canvas/);
});
