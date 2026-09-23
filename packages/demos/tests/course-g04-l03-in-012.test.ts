import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import courseIn012, {
  COURSE_G04_L03_IN_012_MOVIE,
  COURSE_G04_L03_IN_012_RUNTIME,
  COURSE_G04_L03_IN_012_SOURCE,
  COURSE_G04_L03_IN_012_SOURCE_CONTRACT,
  buildCourseG04L03In012CaptureAttributes,
  getCourseG04L03In012FrameState,
  getCourseG04L03In012SourceCanvasRenderKey,
  normalizeCourseG04L03In012Frame,
} from "../src/modules/course-g04-l03-in-012";
import {matchPrototype} from "../src/prototype-manifest";
import {
  COURSE_G04_L03_IN_012_CARDS,
  COURSE_G04_L03_IN_012_CURRENT_JS_TIMING,
  COURSE_G04_L03_IN_012_INTERACTION_AUTHORITY,
  COURSE_G04_L03_IN_012_SOURCE_GEOMETRY,
  COURSE_G04_L03_IN_012_SOURCE_GLOSSARY_TERMS,
} from "../src/timelines/course-g04-l03-in-012-owing-drag-interaction";
import {COURSE_G04_L03_IN_012_AUTHORITY} from "../src/timelines/course-g04-l03-in-012";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

const expectedCompanionDomains = [
  ["sprite-5", 1], ["sprite-37", 20], ["sprite-46", 22],
  ["sprite-68", 26], ["sprite-74", 22], ["sprite-98", 19],
  ["sprite-108", 27], ["sprite-134", 31], ["sprite-166", 25],
  ["sprite-199", 27], ["sprite-201", 1], ["sprite-202", 1],
  ["sprite-203", 1], ["sprite-204", 1], ["sprite-205", 1],
  ["sprite-207", 1], ["sprite-208", 1], ["sprite-209", 1],
  ["sprite-210", 1], ["sprite-211", 1], ["sprite-223", 15],
  ["sprite-227", 25],
] as const;

test("IN012 preserves the root, sprite-228, drag quiz, and domain facts", async () => {
  assert.deepEqual(COURSE_G04_L03_IN_012_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_IN_012_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_IN_012_MOVIE.frameCount, 215);
  assert.equal(COURSE_G04_L03_IN_012_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_IN_012_RUNTIME.defaultFrameDomain, "sprite-228");
  assert.deepEqual(COURSE_G04_L03_IN_012_RUNTIME.frameDomains, [
    {id: "sprite-228", frameCount: 215, fps: 12, rootFrame: 6},
    ...expectedCompanionDomains.map(([id, frameCount]) =>
      ({id, frameCount, fps: 12, rootFrame: 6})),
  ]);
  assert.deepEqual(COURSE_G04_L03_IN_012_SOURCE.buttonObjectIds, [31, 34, 35, 220]);
  assert.deepEqual(COURSE_G04_L03_IN_012_SOURCE.dragItemObjectIds,
    [207, 208, 209, 210, 211]);
  assert.equal(COURSE_G04_L03_IN_012_SOURCE.dragPlacementFrame, 174);
  assert.equal(COURSE_G04_L03_IN_012_SOURCE.terminalStopFrame, 215);
  assert.equal(COURSE_G04_L03_IN_012_SOURCE.eventHandlerOperationCount, 19);
  assert.equal(COURSE_G04_L03_IN_012_SOURCE.inputOperationCount, 24);
  assert.equal(COURSE_G04_L03_IN_012_SOURCE.lifecycleOperationCount, 5);
  assert.equal(COURSE_G04_L03_IN_012_SOURCE.timelineNavigationOccurrenceCount, 49);
  assert.equal(COURSE_G04_L03_IN_012_SOURCE.replayResetOperationCount, 7);
  assert.equal(COURSE_G04_L03_IN_012_SOURCE.audioOperationCount, 5);
  assert.equal(COURSE_G04_L03_IN_012_SOURCE.embeddedAudioStreamSha256.length, 9);
  assert.equal(courseIn012.runtime, COURSE_G04_L03_IN_012_RUNTIME);
  assert.equal(Object.keys(courseIn012.playbackEndFrameByDomain ?? {}).length, 24);
  assert.equal(courseIn012.playbackEndFrameByDomain?.root, 1);
  assert.equal(courseIn012.playbackEndFrameByDomain?.["sprite-228"], 174);
  assert.equal(courseIn012.playbackEndFrameByDomain?.["sprite-37"], 1);
  for (const [path, expected] of [
    [COURSE_G04_L03_IN_012_SOURCE.swf, COURSE_G04_L03_IN_012_SOURCE.swfSha256],
    [COURSE_G04_L03_IN_012_SOURCE.fla, COURSE_G04_L03_IN_012_SOURCE.flaSha256],
    [COURSE_G04_L03_IN_012_SOURCE.associatedAudio,
      COURSE_G04_L03_IN_012_SOURCE.associatedAudioSha256],
  ] as const) {
    assert.equal(sha256(await readFile(`${repositoryRoot}${path}`)), expected);
  }
});

test("IN012 exposes bounded one-indexed English sprite-228 drawings", () => {
  assert.equal(normalizeCourseG04L03In012Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03In012Frame(216), 215);
  assert.equal(normalizeCourseG04L03In012Frame(8, "root"), 8);
  assert.equal(normalizeCourseG04L03In012Frame(21, "sprite-37"), 20);
  const expectedMarkers = new Map([
    [1, ["owing-situations"]],
    [173, ["owing-situations"]],
    [174, ["owing-situations", "five-drag-object-stop-static-drawing"]],
    [175, ["owing-situations", "post-drag-static-drawing"]],
    [215, ["owing-situations", "post-drag-static-drawing", "terminal-stop-static-drawing"]],
  ]);
  for (const [frame, markers] of expectedMarkers) {
    const state = getCourseG04L03In012FrameState(frame, {
      frameDomain: "sprite-228",
      scenario: "source-static-frame",
      lang: "en",
      seed: frame === 174 ? -1 : 0,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.frame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.deepEqual(state.visibleSourceMarkers, markers);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
    assert.equal(state.naturalRuntimeEstablished, false);
  }
});

test("IN012 fails closed for Spanish, root, companions, and unsupported domains", () => {
  const requests = [
    ["sprite-228", "source-static-frame", "es", "spanish-visual-and-audio-unvalidated"],
    ["root", "root-unavailable", "en", "root-baseline-unavailable"],
    ["sprite-37", "sprite-37-unavailable", "en", "companion-domain-unrendered"],
    ["sprite-219", "sprite-219-unavailable", "en", "unsupported-runtime-request"],
    ["root", "source-static-frame", "en", "frame-domain-scenario-mismatch"],
  ] as const;
  for (const [frameDomain, scenario, lang, blocker] of requests) {
    const state = getCourseG04L03In012FrameState(1, {
      frameDomain,
      scenario,
      lang,
      seed: 0,
    });
    assert.equal(state.blocker, blocker);
  }
});

test("IN012 capture identity remains deterministic, muted, and noninteractive", () => {
  const state = getCourseG04L03In012FrameState(215, {
    frameDomain: "sprite-228",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const attributes = buildCourseG04L03In012CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-215",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(attributes["data-capture-stage"], "true");
  assert.equal(attributes["data-flash-frame-domain"], "sprite-228");
  assert.equal(attributes["data-source-controls-enabled"], "false");
  assert.equal(attributes["data-source-marker-visuals"],
    "owing-situations,post-drag-static-drawing,terminal-stop-static-drawing");
});

test("IN012 frame 174 exposes fail-closed owing controls over clean frame 173", () => {
  const wholeLessonHostState = getCourseG04L03In012FrameState(174, {
    frameDomain: "sprite-228",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  });
  const markup = renderToStaticMarkup(createElement(courseIn012.Renderer, {
    frame: 174,
    frameDomain: "sprite-228",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    state: wholeLessonHostState,
  }));

  assert.doesNotMatch(markup, /data-fail-closed-reason/);
  assert.match(markup, /<canvas/);
  assert.match(markup, /data-current-js-controls-enabled="true"/);
  assert.match(markup, /data-current-js-functional-candidate="true"/);
  assert.match(
    markup,
    /data-current-js-functional-scope="in012-owing-drag-source-script-bound"/,
  );
  assert.match(markup, /data-current-js-source-visual-frame="173"/);
  assert.match(markup, /data-flash-frame="173"/);
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
    /aria-label="Select Josh has 7 dollars, positive 7 to move"[^>]*disabled=""/,
  );
  assert.match(
    markup,
    /aria-label="Place selected card at number-line position 1"[^>]*disabled=""/,
  );
  assert.equal(markup.match(/data-source-card="/g)?.length, 5);
  assert.equal(markup.match(/data-source-target="/g)?.length, 5);
  assert.match(markup, /data-interaction-companion-surface="mobile"/);
  assert.match(markup, /data-interaction-companion-placement="fallback"/);
  assert.match(markup, /data-mobile-touch-target-min="48"/);
  assert.match(markup, /\(any-pointer: coarse\)/);
  assert.match(markup, /grid-row: 7/);
  assert.match(markup, /min-height: 48px/);
  assert.match(markup, /data-host-glossary-actions="safe-disabled"/);
  assert.match(
    markup,
    /data-host-glossary-function="DoHyperLinks-unresolved"/,
  );
  assert.equal(markup.match(/data-source-glossary-term="/g)?.length, 3);
  for (const [visibleText, keyAttribute] of [
    ["position", "Position"],
    ["number line", "Number line"],
    ["owes", "Owe"],
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

  assert.equal(COURSE_G04_L03_IN_012_CARDS.length, 5);
  assert.equal(COURSE_G04_L03_IN_012_SOURCE_GLOSSARY_TERMS.length, 3);
  assert.equal(
    COURSE_G04_L03_IN_012_SOURCE_GLOSSARY_TERMS.every(
      ({enabled, hostContentResolved, status}) =>
        !enabled && !hostContentResolved && status === "safe-disabled",
    ),
    true,
  );
  assert.equal(COURSE_G04_L03_IN_012_SOURCE_GEOMETRY.interactionFrame, 174);
  assert.equal(
    COURSE_G04_L03_IN_012_SOURCE_GEOMETRY.cleanSourceVisualFrame,
    173,
  );
  assert.notEqual(
    getCourseG04L03In012SourceCanvasRenderKey(0, 0, 173),
    getCourseG04L03In012SourceCanvasRenderKey(1, 0, 173),
  );
  assert.notEqual(
    getCourseG04L03In012SourceCanvasRenderKey(0, 0, 173),
    getCourseG04L03In012SourceCanvasRenderKey(0, 0, 174),
  );
  assert.equal(courseIn012.reducedMotionFrame, 174);
  assert.equal(
    COURSE_G04_L03_IN_012_SOURCE_CONTRACT.currentJavascriptInteractionStatus,
    "source-script-bound-functional-candidate",
  );
  assert.equal(
    COURSE_G04_L03_IN_012_SOURCE_CONTRACT.currentJavascriptTiming,
    COURSE_G04_L03_IN_012_CURRENT_JS_TIMING,
  );
  assert.equal(
    COURSE_G04_L03_IN_012_SOURCE_CONTRACT.interactionAuthority,
    COURSE_G04_L03_IN_012_INTERACTION_AUTHORITY,
  );
  assert.equal(
    COURSE_G04_L03_IN_012_SOURCE_CONTRACT.wrongFeedbackTextStatus,
    "source-glyph-fallback-host-global-assignment-unresolved",
  );
  assert.equal(
    COURSE_G04_L03_IN_012_SOURCE_CONTRACT.sourceGlossaryActionStatus,
    "three-source-hits-safe-disabled",
  );
  for (const scope of [
    "html-drag-and-drop-and-select-then-target-keyboard-alternative",
    "source-target-reveal-and-card-hide",
    "fifth-card-two-stage-feedback-and-persistent-current-js-terminal",
    "host-pause-freezes-current-js-per-card-and-final-feedback-delays",
    "reduced-motion-immediate-current-js-feedback-transitions",
    "whole-renderer-replay-reset-and-source-canvas-remount",
    "responsive-mobile-and-coarse-pointer-touch-control-surface",
    "page-interaction-companion-portal-with-stage-fallback",
    "wide-coarse-companion-grid-row-seven",
    "desktop-mobile-focus-migration-and-wrong-close-focus-restore",
    "answer-controls-fail-closed-until-source-canvas-ready",
    "clean-frame-173-source-visual-under-frame-174-functional-overlay",
    "deterministic-entry-state-capture-preserves-requested-frame-without-overlay",
    "no-local-help-clear-or-new-number-controls-invented",
  ]) {
    assert.ok(
      COURSE_G04_L03_IN_012_SOURCE_CONTRACT.currentJavascriptInteractionScope
        .includes(scope),
      scope,
    );
  }
  for (const [name, value] of Object.entries(
    COURSE_G04_L03_IN_012_INTERACTION_AUTHORITY,
  )) {
    if (typeof value === "boolean") assert.equal(value, false, name);
  }
  assert.equal(
    COURSE_G04_L03_IN_012_SOURCE_CONTRACT.naturalTerminalContinuationEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_IN_012_SOURCE_CONTRACT.behaviorParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_IN_012_SOURCE_CONTRACT.replayParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_IN_012_SOURCE_CONTRACT.originalRuntimeAuthorityEstablished,
    false,
  );
  assert.equal(COURSE_G04_L03_IN_012_SOURCE_CONTRACT.ownerAccepted, false);
  assert.equal(
    COURSE_G04_L03_IN_012_SOURCE_CONTRACT.strictMigrationComplete,
    false,
  );
  assert.equal(
    COURSE_G04_L03_IN_012_SOURCE_CONTRACT.strictAcceptanceEffect,
    "none",
  );
});

test("IN012 entry-state capture preserves source frame 174 with zero overlays", () => {
  const entryStateSha256 =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  assert.equal(entryStateSha256.length, 64);
  const wholeLessonHostState = getCourseG04L03In012FrameState(174, {
    entryStateSha256,
    frameDomain: "sprite-228",
    requirementId: "IN012-OWING-READY",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
    traceId: "in012-source-static-f174",
  });
  const markup = renderToStaticMarkup(createElement(courseIn012.Renderer, {
    entryStateSha256,
    frame: 174,
    frameDomain: "sprite-228",
    requirementId: "IN012-OWING-READY",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
    state: wholeLessonHostState,
    traceId: "in012-source-static-f174",
  }));

  assert.match(markup, /data-deterministic-evidence-capture="true"/);
  assert.match(markup, /data-current-js-controls-enabled="false"/);
  assert.match(markup, /data-current-js-functional-candidate="false"/);
  assert.match(markup, /data-current-js-source-visual-frame="174"/);
  assert.match(markup, /data-flash-frame="174"/);
  assert.match(
    markup,
    new RegExp(`data-flash-entry-state-sha256="${entryStateSha256}"`),
  );
  assert.match(markup, /data-flash-requirement-id="IN012-OWING-READY"/);
  assert.match(markup, /data-flash-trace-id="in012-source-static-f174"/);
  assert.match(
    markup,
    /data-source-canvas-accessibility-isolated="false"/,
  );
  assert.match(markup, /<canvas/);
  assert.doesNotMatch(
    markup,
    /aria-label="Source-script-bound current JavaScript owing card activity"/,
  );
  assert.doesNotMatch(markup, /data-source-card="/);
  assert.doesNotMatch(markup, /data-source-target="/);
  assert.doesNotMatch(markup, /data-host-glossary-actions=/);
  assert.doesNotMatch(markup, /data-interaction-companion-surface="mobile"/);
  assert.equal(markup.match(/<button/g)?.length ?? 0, 0);
});

test("IN012 remains prototype-only with every acceptance gate closed", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-in-012"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.runtime.frameDomains?.length, 23);
  assert.equal(manifest?.movie.frameCount, 215);
  assert.equal(manifest?.title.en, "Situations with Negative Numbers: Owing");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3IN12.swf"}), undefined);
  const registered = await loadAnimationModule("course-g04-l03-in-012");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  assert.equal(COURSE_G04_L03_IN_012_SOURCE_CONTRACT.ownerAccepted, false);
  for (const [name, value] of Object.entries(COURSE_G04_L03_IN_012_AUTHORITY)) {
    if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect") continue;
    assert.equal(value, false, name);
  }
  assert.equal(COURSE_G04_L03_IN_012_AUTHORITY.registryIsPrototypeOnly, true);
  const spanishMarkup = renderToStaticMarkup(
    createElement(courseIn012.Renderer, {
      frame: 1,
      frameDomain: "sprite-228",
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
