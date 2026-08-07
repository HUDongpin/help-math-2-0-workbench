import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import courseIn004, {
  COURSE_G04_L03_IN_004_MOVIE,
  COURSE_G04_L03_IN_004_RUNTIME,
  COURSE_G04_L03_IN_004_SOURCE,
  COURSE_G04_L03_IN_004_SOURCE_CONTRACT,
  buildCourseG04L03In004CaptureAttributes,
  getCourseG04L03In004FrameState,
  normalizeCourseG04L03In004Frame,
} from "../src/modules/course-g04-l03-in-004";
import {matchPrototype} from "../src/prototype-manifest";
import {
  COURSE_G04_L03_IN_004_CURRENT_JS_TIMING,
  COURSE_G04_L03_IN_004_INTERACTION_AUTHORITY,
  COURSE_G04_L03_IN_004_NUMBER_CARDS,
} from "../src/timelines/course-g04-l03-in-004-number-line-drag-interaction";
import {COURSE_G04_L03_IN_004_AUTHORITY} from "../src/timelines/course-g04-l03-in-004";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

const expectedCompanionDomains = [
  ["sprite-5", 1], ["sprite-53", 55], ["sprite-55", 20],
  ["sprite-61", 1], ["sprite-69", 1], ["sprite-72", 28],
  ["sprite-84", 25], ["sprite-98", 32], ["sprite-119", 33],
  ["sprite-131", 28], ["sprite-133", 1], ["sprite-135", 1],
  ["sprite-136", 1], ["sprite-137", 1], ["sprite-138", 1],
  ["sprite-139", 1], ["sprite-140", 1], ["sprite-141", 1],
  ["sprite-142", 1], ["sprite-143", 1], ["sprite-155", 15],
  ["sprite-159", 25],
] as const;

test("IN004 preserves the root, sprite-160, drag activity, and domain facts", async () => {
  assert.deepEqual(COURSE_G04_L03_IN_004_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_IN_004_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_IN_004_MOVIE.frameCount, 169);
  assert.equal(COURSE_G04_L03_IN_004_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_IN_004_RUNTIME.defaultFrameDomain, "sprite-160");
  assert.deepEqual(COURSE_G04_L03_IN_004_RUNTIME.frameDomains, [
    {id: "sprite-160", frameCount: 169, fps: 12, rootFrame: 6},
    ...expectedCompanionDomains.map(([id, frameCount]) =>
      ({id, frameCount, fps: 12, rootFrame: 6})),
  ]);
  assert.deepEqual(COURSE_G04_L03_IN_004_SOURCE.buttonObjectIds, [44, 45, 152]);
  assert.deepEqual(COURSE_G04_L03_IN_004_SOURCE.draggableObjectIds,
    [139, 140, 141, 142, 143]);
  assert.equal(COURSE_G04_L03_IN_004_SOURCE.dragPlacementFrame, 126);
  assert.equal(COURSE_G04_L03_IN_004_SOURCE.terminalStopFrame, 169);
  assert.equal(COURSE_G04_L03_IN_004_SOURCE.randomCall.scope,
    "muted-companion-audio-only");
  assert.equal(COURSE_G04_L03_IN_004_SOURCE.embeddedAudioStreamSha256.length, 11);
  assert.equal(courseIn004.runtime, COURSE_G04_L03_IN_004_RUNTIME);
  assert.equal(Object.keys(courseIn004.playbackEndFrameByDomain ?? {}).length, 24);
  assert.equal(courseIn004.playbackEndFrameByDomain?.root, 1);
  assert.equal(courseIn004.playbackEndFrameByDomain?.["sprite-160"], 126);
  assert.equal(courseIn004.playbackEndFrameByDomain?.["sprite-53"], 1);
  assert.equal(courseIn004.reducedMotionFrame, 126);
  for (const [path, expected] of [
    [COURSE_G04_L03_IN_004_SOURCE.swf, COURSE_G04_L03_IN_004_SOURCE.swfSha256],
    [COURSE_G04_L03_IN_004_SOURCE.fla, COURSE_G04_L03_IN_004_SOURCE.flaSha256],
    [COURSE_G04_L03_IN_004_SOURCE.associatedAudio,
      COURSE_G04_L03_IN_004_SOURCE.associatedAudioSha256],
  ] as const) {
    assert.equal(sha256(await readFile(`${repositoryRoot}${path}`)), expected);
  }
});

test("IN004 exposes all English main frames without executing companion random", () => {
  assert.equal(normalizeCourseG04L03In004Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03In004Frame(170), 169);
  assert.equal(normalizeCourseG04L03In004Frame(10, "root"), 10);
  assert.equal(normalizeCourseG04L03In004Frame(56, "sprite-53"), 55);
  const expectedMarkers = new Map([
    [1, ["number-line-instruction-source-static-drawing"]],
    [125, ["number-line-instruction-source-static-drawing"]],
    [126, ["number-line-instruction-source-static-drawing", "five-drag-object-stop-static-drawing"]],
    [127, ["number-line-instruction-source-static-drawing", "post-drag-static-drawing"]],
    [169, ["number-line-instruction-source-static-drawing", "post-drag-static-drawing", "terminal-stop-static-drawing"]],
  ]);
  for (const [frame, markers] of expectedMarkers) {
    const state = getCourseG04L03In004FrameState(frame, {
      frameDomain: "sprite-160",
      scenario: "source-static-frame",
      lang: "en",
      seed: -1,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.frame, frame);
    assert.equal(state.seed, 4_294_967_295);
    assert.deepEqual(state.visibleSourceMarkers, markers);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
  }
});

test("IN004 fails closed for Spanish, root, companions, and unreachable domains", () => {
  const requests = [
    ["sprite-160", "source-static-frame", "es", "spanish-visual-and-audio-unvalidated"],
    ["root", "root-unavailable", "en", "root-baseline-unavailable"],
    ["sprite-53", "sprite-53-unavailable", "en", "companion-domain-unrendered"],
    ["sprite-151", "sprite-151-unavailable", "en", "unsupported-runtime-request"],
    ["root", "source-static-frame", "en", "frame-domain-scenario-mismatch"],
  ] as const;
  for (const [frameDomain, scenario, lang, blocker] of requests) {
    const state = getCourseG04L03In004FrameState(1, {
      frameDomain,
      scenario,
      lang,
      seed: 0,
    });
    assert.equal(state.blocker, blocker);
  }
});

test("IN004 frame-126 capture attributes remain deterministic and noninteractive", () => {
  const state = getCourseG04L03In004FrameState(126, {
    frameDomain: "sprite-160",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const attributes = buildCourseG04L03In004CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-126",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(attributes["data-capture-stage"], "true");
  assert.equal(attributes["data-runtime-seed"], 7);
  assert.equal(attributes["data-source-controls-enabled"], "false");
});

test("IN004 normal frame 126 SSR uses clean frame 125 under functional controls", () => {
  const markup = renderToStaticMarkup(
    createElement(courseIn004.Renderer, {
      frame: 126,
      frameDomain: "sprite-160",
      scenario: "source-static-frame",
      lang: "en",
      replay: 2,
      seed: 7,
    }),
  );

  assert.match(markup, /data-current-js-controls-enabled="true"/);
  assert.match(markup, /data-current-js-controls-ready="false"/);
  assert.match(markup, /data-current-js-functional-candidate="true"/);
  assert.match(markup, /data-current-js-source-visual-frame="125"/);
  assert.match(markup, /data-deterministic-evidence-capture="false"/);
  assert.match(markup, /data-flash-frame="125"/);
  assert.match(markup, /data-flash-frame-domain="sprite-160"/);
  assert.match(markup, /data-source-canvas-accessibility-isolated="true"/);
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /\sinert=""/);
  assert.match(markup, /style="pointer-events:none"/);
  assert.match(markup, /data-host-wrong-feedback-resolved="false"/);
  assert.match(markup, /data-source-glossary-actions="safe-disabled"/);
  assert.equal((markup.match(/data-source-card="Scr_/g) ?? []).length, 5);
  assert.equal((markup.match(/data-source-target="Mc_Tar_/g) ?? []).length, 5);
  assert.equal((markup.match(/data-source-glossary-term=/g) ?? []).length, 4);
  assert.equal((markup.match(/<button\b/g) ?? []).length, 20);
  assert.doesNotMatch(markup, /data-source-target-reveal=/);
  assert.doesNotMatch(markup, /Need More Help/);
});

test("IN004 complete entry-state capture preserves frame 126 with zero overlay", () => {
  const entryStateSha256 = "b".repeat(64);
  const markup = renderToStaticMarkup(
    createElement(courseIn004.Renderer, {
      entryStateSha256,
      frame: 126,
      frameDomain: "sprite-160",
      requirementId: "in004-deterministic-frame-126",
      scenario: "source-static-frame",
      lang: "en",
      seed: 11,
      traceId: "in004-deterministic-trace",
    }),
  );

  assert.match(markup, /data-current-js-controls-enabled="false"/);
  assert.match(markup, /data-current-js-functional-candidate="false"/);
  assert.match(markup, /data-current-js-source-visual-frame="126"/);
  assert.match(markup, /data-deterministic-evidence-capture="true"/);
  assert.match(markup, /data-source-canvas-accessibility-isolated="false"/);
  assert.match(markup, /data-capture-identity-status="verified"/);
  assert.match(markup, /data-flash-frame="126"/);
  assert.match(
    markup,
    new RegExp(`data-flash-entry-state-sha256="${entryStateSha256}"`),
  );
  assert.equal((markup.match(/<button\b/g) ?? []).length, 0);
  assert.doesNotMatch(markup, /data-source-card="Scr_/);
  assert.doesNotMatch(markup, /data-source-target="Mc_Tar_/);
  assert.doesNotMatch(markup, /\sinert=""/);
});

test("IN004 is English-only at frame 126 and does not activate at frame 125", () => {
  const frame125Markup = renderToStaticMarkup(
    createElement(courseIn004.Renderer, {
      frame: 125,
      frameDomain: "sprite-160",
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
    }),
  );
  assert.match(frame125Markup, /data-current-js-controls-enabled="false"/);
  assert.match(frame125Markup, /data-current-js-source-visual-frame="125"/);
  assert.match(frame125Markup, /data-deterministic-evidence-capture="false"/);
  assert.equal((frame125Markup.match(/<button\b/g) ?? []).length, 0);

  const spanishMarkup = renderToStaticMarkup(
    createElement(courseIn004.Renderer, {
      frame: 126,
      frameDomain: "sprite-160",
      scenario: "source-static-frame",
      lang: "es",
      seed: 0,
    }),
  );
  assert.match(spanishMarkup, /data-current-js-controls-enabled="false"/);
  assert.match(
    spanishMarkup,
    /data-fail-closed-reason="spanish-visual-and-audio-unvalidated"/,
  );
  assert.match(spanishMarkup, /data-audio-rendered="false"/);
  assert.equal((spanishMarkup.match(/<button\b/g) ?? []).length, 0);
  assert.doesNotMatch(spanishMarkup, /<canvas/);
});

test("IN004 exact mappings and current-JS-only source contract remain locked", () => {
  assert.deepEqual(
    COURSE_G04_L03_IN_004_NUMBER_CARDS.map((card) => ({
      id: card.id,
      numericValue: card.numericValue,
      sourceInstance: card.sourceInstance,
      sourcePosition: card.sourcePosition,
      targetInstance: card.targetInstance,
      targetPosition: card.targetPosition,
    })),
    [
      {
        id: "2",
        numericValue: -6,
        sourceInstance: "Scr_2",
        sourcePosition: {x: 305, y: 420},
        targetInstance: "Mc_Tar_2",
        targetPosition: {x: 228.55, y: 229},
      },
      {
        id: "3",
        numericValue: 0,
        sourceInstance: "Scr_3",
        sourcePosition: {x: 375, y: 420},
        targetInstance: "Mc_Tar_3",
        targetPosition: {x: 402.55, y: 229},
      },
      {
        id: "4",
        numericValue: 6,
        sourceInstance: "Scr_4",
        sourcePosition: {x: 445, y: 420},
        targetInstance: "Mc_Tar_4",
        targetPosition: {x: 572.5, y: 229},
      },
      {
        id: "5",
        numericValue: 8,
        sourceInstance: "Scr_5",
        sourcePosition: {x: 515, y: 420},
        targetInstance: "Mc_Tar_5",
        targetPosition: {x: 628.5, y: 229},
      },
      {
        id: "6",
        numericValue: -4,
        sourceInstance: "Scr_6",
        sourcePosition: {x: 585, y: 420},
        targetInstance: "Mc_Tar_6",
        targetPosition: {x: 288.55, y: 229},
      },
    ],
  );
  assert.equal(
    COURSE_G04_L03_IN_004_SOURCE_CONTRACT.currentJavascriptInteractionStatus,
    "source-script-bound-functional-candidate",
  );
  assert.deepEqual(
    COURSE_G04_L03_IN_004_SOURCE_CONTRACT.currentJavascriptInteractionScope,
    [
      "five-source-bound-number-cards-and-number-line-targets",
      "html-drag-and-drop-and-select-then-target-keyboard-alternative",
      "authored-wrong-fallback-with-host-global-unresolved-and-close-retry",
      "source-target-reveal-and-card-hide",
      "per-card-current-js-correct-feedback",
      "five-card-persistent-current-js-correct-terminal",
      "host-pause-freezes-current-js-correct-feedback-delay",
      "reduced-motion-immediate-current-js-feedback-transition",
      "whole-renderer-replay-and-seed-reset",
      "two-source-glossary-actions-safe-disabled-without-invented-help",
      "responsive-mobile-and-coarse-pointer-touch-control-surface",
      "page-interaction-companion-portal-with-stage-fallback",
      "desktop-mobile-focus-migration-and-wrong-close-focus-restoration",
      "interactive-canvas-aria-inert-and-pointer-isolation",
      "answer-controls-fail-closed-until-source-canvas-ready",
      "clean-frame-125-source-visual-under-frame-126-functional-overlay",
      "complete-entry-state-capture-preserves-requested-frame-without-overlay",
    ],
  );
  assert.equal(
    COURSE_G04_L03_IN_004_SOURCE_CONTRACT.currentJavascriptTiming,
    COURSE_G04_L03_IN_004_CURRENT_JS_TIMING,
  );
  assert.equal(
    COURSE_G04_L03_IN_004_SOURCE_CONTRACT.interactionAuthority,
    COURSE_G04_L03_IN_004_INTERACTION_AUTHORITY,
  );
  assert.equal(
    COURSE_G04_L03_IN_004_SOURCE_CONTRACT.wrongFeedbackTextStatus,
    "authored-fallback-host-global-runtime-value-unresolved",
  );
  assert.equal(
    COURSE_G04_L03_IN_004_SOURCE_CONTRACT.glossaryActionStatus,
    "two-source-host-actions-safe-disabled",
  );
  assert.equal(
    COURSE_G04_L03_IN_004_SOURCE_CONTRACT.helpStatus,
    "no-help-control-invented",
  );
  for (const [name, value] of Object.entries(
    COURSE_G04_L03_IN_004_INTERACTION_AUTHORITY,
  )) {
    if (typeof value === "boolean") assert.equal(value, false, name);
  }
  for (const gate of [
    "naturalTerminalContinuationEstablished",
    "sourceDragDropExecuted",
    "behaviorParityEstablished",
    "replayParityEstablished",
    "originalRuntimeAuthorityEstablished",
    "fullFrameRmseEstablished",
    "humanVisualReviewAccepted",
    "ownerAccepted",
    "strictMigrationComplete",
  ] as const) {
    assert.equal(COURSE_G04_L03_IN_004_SOURCE_CONTRACT[gate], false, gate);
  }
  assert.equal(
    COURSE_G04_L03_IN_004_SOURCE_CONTRACT.strictAcceptanceEffect,
    "none",
  );
});

test("IN004 remains prototype-only with every acceptance gate closed", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-in-004"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.runtime.frameDomains?.length, 23);
  assert.equal(manifest?.movie.frameCount, 169);
  assert.equal(manifest?.title.en, "Numbers on the Number Line");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3IN04.swf"}), undefined);
  const registered = await loadAnimationModule("course-g04-l03-in-004");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  assert.equal(COURSE_G04_L03_IN_004_SOURCE_CONTRACT.ownerAccepted, false);
  for (const [name, value] of Object.entries(COURSE_G04_L03_IN_004_AUTHORITY)) {
    if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect") continue;
    assert.equal(value, false, name);
  }
  assert.equal(COURSE_G04_L03_IN_004_AUTHORITY.registryIsPrototypeOnly, true);
});
