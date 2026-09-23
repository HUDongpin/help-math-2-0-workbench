import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import courseIn005, {
  COURSE_G04_L03_IN_005_MOVIE,
  COURSE_G04_L03_IN_005_RUNTIME,
  COURSE_G04_L03_IN_005_SOURCE,
  COURSE_G04_L03_IN_005_SOURCE_CONTRACT,
  buildCourseG04L03In005CaptureAttributes,
  getCourseG04L03In005SourceCanvasRenderKey,
  getCourseG04L03In005FrameState,
  normalizeCourseG04L03In005Frame,
} from "../src/modules/course-g04-l03-in-005";
import {matchPrototype} from "../src/prototype-manifest";
import {
  COURSE_G04_L03_IN_005_ORDERING_CARDS,
  COURSE_G04_L03_IN_005_ORDERING_CURRENT_JS_TIMING,
  COURSE_G04_L03_IN_005_ORDERING_INTERACTION_AUTHORITY,
  COURSE_G04_L03_IN_005_ORDERING_SOURCE_GEOMETRY,
  COURSE_G04_L03_IN_005_SORTED_TARGET_IDS,
} from "../src/timelines/course-g04-l03-in-005-ordering-interaction";
import {COURSE_G04_L03_IN_005_AUTHORITY} from "../src/timelines/course-g04-l03-in-005";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

const expectedCompanionDomains = [
  ["sprite-5", 1], ["sprite-47", 20], ["sprite-49", 1],
  ["sprite-50", 1], ["sprite-51", 1], ["sprite-52", 1],
  ["sprite-53", 1], ["sprite-54", 1], ["sprite-55", 1],
  ["sprite-57", 1], ["sprite-58", 1], ["sprite-59", 1],
  ["sprite-60", 1], ["sprite-61", 1], ["sprite-62", 1],
  ["sprite-63", 1], ["sprite-67", 25], ["sprite-79", 15],
] as const;

test("IN005 preserves the root, sprite-80, interactions, and domain facts", async () => {
  assert.deepEqual(COURSE_G04_L03_IN_005_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_IN_005_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_IN_005_MOVIE.frameCount, 186);
  assert.equal(COURSE_G04_L03_IN_005_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_IN_005_RUNTIME.defaultFrameDomain, "sprite-80");
  assert.deepEqual(COURSE_G04_L03_IN_005_RUNTIME.frameDomains, [
    {id: "sprite-80", frameCount: 186, fps: 12, rootFrame: 6},
    ...expectedCompanionDomains.map(([id, frameCount]) =>
      ({id, frameCount, fps: 12, rootFrame: 6})),
  ]);
  assert.deepEqual(COURSE_G04_L03_IN_005_SOURCE.buttonObjectIds, [20, 21, 22, 76]);
  assert.deepEqual(COURSE_G04_L03_IN_005_SOURCE.dragItemObjectIds,
    [57, 58, 59, 60, 61, 62, 63]);
  assert.equal(COURSE_G04_L03_IN_005_SOURCE.dragDropPlacementFrame, 144);
  assert.equal(COURSE_G04_L03_IN_005_SOURCE.interactionSignalCount, 18);
  assert.equal(COURSE_G04_L03_IN_005_SOURCE.timelineNavigationOccurrenceCount, 33);
  assert.equal(courseIn005.runtime, COURSE_G04_L03_IN_005_RUNTIME);
  assert.equal(Object.keys(courseIn005.playbackEndFrameByDomain ?? {}).length, 20);
  assert.equal(courseIn005.playbackEndFrameByDomain?.root, 1);
  assert.equal(courseIn005.playbackEndFrameByDomain?.["sprite-80"], 144);
  assert.equal(courseIn005.playbackEndFrameByDomain?.["sprite-47"], 1);
  for (const [path, expected] of [
    [COURSE_G04_L03_IN_005_SOURCE.swf, COURSE_G04_L03_IN_005_SOURCE.swfSha256],
    [COURSE_G04_L03_IN_005_SOURCE.fla, COURSE_G04_L03_IN_005_SOURCE.flaSha256],
    [COURSE_G04_L03_IN_005_SOURCE.associatedAudio,
      COURSE_G04_L03_IN_005_SOURCE.associatedAudioSha256],
  ] as const) {
    assert.equal(sha256(await readFile(`${repositoryRoot}${path}`)), expected);
  }
});

test("IN005 exposes bounded one-indexed English sprite-80 drawings", () => {
  assert.equal(normalizeCourseG04L03In005Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03In005Frame(187), 186);
  assert.equal(normalizeCourseG04L03In005Frame(8, "root"), 8);
  assert.equal(normalizeCourseG04L03In005Frame(22, "sprite-47"), 20);
  for (const frame of [1, 93, 144, 186]) {
    const state = getCourseG04L03In005FrameState(frame, {
      frameDomain: "sprite-80",
      scenario: "source-static-frame",
      lang: "en",
      seed: frame === 186 ? -1 : 0,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.frame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.deepEqual(state.visibleSourceMarkers,
      frame < 144
        ? ["numbers-on-number-line"]
        : ["numbers-on-number-line", "seven-item-drag-drop-static-drawing"]);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
    assert.equal(state.naturalRuntimeEstablished, false);
  }
});

test("IN005 fails closed for Spanish, root, companions, and unsupported domains", () => {
  const requests = [
    ["sprite-80", "source-static-frame", "es", "spanish-visual-and-audio-unvalidated"],
    ["root", "root-unavailable", "en", "root-baseline-unavailable"],
    ["sprite-47", "sprite-47-unavailable", "en", "companion-domain-unrendered"],
    ["sprite-75", "sprite-75-unavailable", "en", "unsupported-runtime-request"],
    ["root", "source-static-frame", "en", "frame-domain-scenario-mismatch"],
  ] as const;
  for (const [frameDomain, scenario, lang, blocker] of requests) {
    const state = getCourseG04L03In005FrameState(1, {
      frameDomain,
      scenario,
      lang,
      seed: 0,
    });
    assert.equal(state.blocker, blocker);
  }
});

test("IN005 capture identity remains deterministic and muted", () => {
  const state = getCourseG04L03In005FrameState(144, {
    frameDomain: "sprite-80",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const attributes = buildCourseG04L03In005CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-144",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(attributes["data-capture-stage"], "true");
  assert.equal(attributes["data-flash-frame-domain"], "sprite-80");
  assert.equal(attributes["data-source-controls-enabled"], "false");
  assert.equal(attributes["data-source-marker-visuals"],
    "numbers-on-number-line,seven-item-drag-drop-static-drawing");
});

test("IN005 frame 144 exposes the fail-closed current-JS ordering surface over clean frame 143", () => {
  const wholeLessonHostState = getCourseG04L03In005FrameState(144, {
    frameDomain: "sprite-80",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
  });
  const markup = renderToStaticMarkup(createElement(courseIn005.Renderer, {
    frame: 144,
    frameDomain: "sprite-80",
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
    /data-current-js-functional-scope="in005-ordering-drag-source-script-bound"/,
  );
  assert.match(markup, /data-current-js-source-visual-frame="143"/);
  assert.match(markup, /data-flash-frame="143"/);
  assert.match(
    markup,
    /data-source-canvas-accessibility-isolated="true"/,
  );
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /inert=""/);
  assert.match(markup, /data-current-js-controls-ready="false"/);
  assert.match(markup, /data-source-canvas-status="idle"/);
  assert.match(
    markup,
    /aria-label="Select 0 to move"[^>]*disabled=""/,
  );
  assert.match(
    markup,
    /aria-label="Place selected card in least-to-greatest slot 1"[^>]*disabled=""/,
  );
  assert.equal(markup.match(/data-source-card="/g)?.length, 7);
  assert.equal(markup.match(/data-source-target="/g)?.length, 7);
  assert.match(markup, /data-interaction-companion-surface="mobile"/);
  assert.match(markup, /data-interaction-companion-placement="fallback"/);
  assert.match(markup, /data-mobile-touch-target-min="48"/);
  assert.match(markup, /data-host-glossary-actions="safe-disabled"/);
  assert.equal(markup.match(/data-source-glossary-term="/g)?.length, 3);
  for (const term of ["Order", "Least", "Greatest"]) {
    assert.match(markup, new RegExp(`data-source-glossary-term="${term}"`));
  }
  assert.doesNotMatch(markup, /aria-label="Open Need More Help"/);
  assert.doesNotMatch(markup, /aria-label="Clear"/);
  assert.doesNotMatch(markup, /aria-label="New Number"/);

  assert.deepEqual(
    COURSE_G04_L03_IN_005_ORDERING_CARDS.map((card) => ({
      id: card.id,
      value: card.numericValue,
      targetId: card.targetId,
      sourceCenter: card.sourceCenter,
      targetCenter: card.targetCenter,
    })),
    [
      {
        id: "Scr_1",
        value: 0,
        targetId: "Mc_Tar_1",
        sourceCenter: {x: 172, y: 360},
        targetCenter: {x: 383, y: 233.1},
      },
      {
        id: "Scr_2",
        value: 9,
        targetId: "Mc_Tar_2",
        sourceCenter: {x: 244.15, y: 360},
        targetCenter: {x: 600.95, y: 233.1},
      },
      {
        id: "Scr_3",
        value: -6,
        targetId: "Mc_Tar_3",
        sourceCenter: {x: 316.3, y: 360},
        targetCenter: {x: 167, y: 233.1},
      },
      {
        id: "Scr_4",
        value: 4,
        targetId: "Mc_Tar_4",
        sourceCenter: {x: 388.45, y: 360},
        targetCenter: {x: 526.95, y: 233.1},
      },
      {
        id: "Scr_5",
        value: 1,
        targetId: "Mc_Tar_5",
        sourceCenter: {x: 460.6, y: 360},
        targetCenter: {x: 454.95, y: 233.1},
      },
      {
        id: "Scr_6",
        value: -5,
        targetId: "Mc_Tar_6",
        sourceCenter: {x: 532.75, y: 360},
        targetCenter: {x: 237, y: 233.1},
      },
      {
        id: "Scr_7",
        value: -1,
        targetId: "Mc_Tar_7",
        sourceCenter: {x: 604.9, y: 360},
        targetCenter: {x: 310, y: 233.1},
      },
    ],
  );
  assert.deepEqual(COURSE_G04_L03_IN_005_SORTED_TARGET_IDS, [
    "Mc_Tar_3",
    "Mc_Tar_6",
    "Mc_Tar_7",
    "Mc_Tar_1",
    "Mc_Tar_5",
    "Mc_Tar_4",
    "Mc_Tar_2",
  ]);
  assert.equal(
    COURSE_G04_L03_IN_005_ORDERING_SOURCE_GEOMETRY.interactionFrame,
    144,
  );
  assert.equal(
    COURSE_G04_L03_IN_005_ORDERING_SOURCE_GEOMETRY.cleanSourceVisualFrame,
    143,
  );

  assert.notEqual(
    getCourseG04L03In005SourceCanvasRenderKey(0, 0, 143),
    getCourseG04L03In005SourceCanvasRenderKey(1, 0, 143),
  );
  assert.notEqual(
    getCourseG04L03In005SourceCanvasRenderKey(0, 0, 143),
    getCourseG04L03In005SourceCanvasRenderKey(0, 0, 144),
  );
  assert.equal(courseIn005.reducedMotionFrame, 144);
  assert.equal(
    COURSE_G04_L03_IN_005_SOURCE_CONTRACT
      .currentJavascriptInteractionStatus,
    "source-script-bound-functional-candidate",
  );
  assert.deepEqual(
    COURSE_G04_L03_IN_005_SOURCE_CONTRACT.currentJavascriptTiming,
    COURSE_G04_L03_IN_005_ORDERING_CURRENT_JS_TIMING,
  );
  assert.equal(
    COURSE_G04_L03_IN_005_SOURCE_CONTRACT.interactionAuthority,
    COURSE_G04_L03_IN_005_ORDERING_INTERACTION_AUTHORITY,
  );
  assert.equal(
    COURSE_G04_L03_IN_005_SOURCE_CONTRACT.wrongFeedbackTextStatus,
    "authored-fallback-host-global-unresolved",
  );
  assert.equal(
    COURSE_G04_L03_IN_005_SOURCE_CONTRACT.sourceGlossaryActionStatus,
    "three-source-hits-safe-disabled",
  );
  assert.ok(
    COURSE_G04_L03_IN_005_SOURCE_CONTRACT.currentJavascriptInteractionScope
      .includes(
        "clean-frame-143-source-visual-under-frame-144-functional-overlay",
      ),
  );
  assert.ok(
    COURSE_G04_L03_IN_005_SOURCE_CONTRACT.currentJavascriptInteractionScope
      .includes(
        "deterministic-entry-state-capture-preserves-requested-frame-without-overlay",
      ),
  );
  assert.equal(
    COURSE_G04_L03_IN_005_SOURCE_CONTRACT.behaviorParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_IN_005_SOURCE_CONTRACT.replayParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_IN_005_SOURCE_CONTRACT.originalRuntimeAuthorityEstablished,
    false,
  );
  assert.equal(COURSE_G04_L03_IN_005_SOURCE_CONTRACT.ownerAccepted, false);
  assert.equal(
    COURSE_G04_L03_IN_005_SOURCE_CONTRACT.strictMigrationComplete,
    false,
  );
  assert.equal(
    COURSE_G04_L03_IN_005_SOURCE_CONTRACT.strictAcceptanceEffect,
    "none",
  );
  for (
    const [name, value]
    of Object.entries(COURSE_G04_L03_IN_005_ORDERING_INTERACTION_AUTHORITY)
  ) {
    if (typeof value === "boolean") assert.equal(value, false, name);
  }
});

test("IN005 entry-state capture preserves source frame 144 with zero controls", () => {
  const wholeLessonHostState = getCourseG04L03In005FrameState(144, {
    frameDomain: "sprite-80",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const markup = renderToStaticMarkup(createElement(courseIn005.Renderer, {
    entryStateSha256:
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    frame: 144,
    frameDomain: "sprite-80",
    requirementId: "IN005-ORDERING-READY",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
    state: wholeLessonHostState,
    traceId: "in005-source-static-f144",
  }));

  assert.match(markup, /data-deterministic-evidence-capture="true"/);
  assert.match(markup, /data-current-js-controls-enabled="false"/);
  assert.match(markup, /data-current-js-functional-candidate="false"/);
  assert.match(markup, /data-current-js-source-visual-frame="144"/);
  assert.match(markup, /data-flash-frame="144"/);
  assert.match(
    markup,
    /data-source-canvas-accessibility-isolated="false"/,
  );
  assert.match(markup, /<canvas/);
  assert.doesNotMatch(
    markup,
    /aria-label="Source-script-bound current JavaScript least-to-greatest ordering activity"/,
  );
  assert.doesNotMatch(markup, /data-source-card="/);
  assert.doesNotMatch(markup, /data-source-target="/);
  assert.doesNotMatch(markup, /data-host-glossary-actions=/);
  assert.doesNotMatch(markup, /data-interaction-companion-surface="mobile"/);
  assert.equal(markup.match(/<button/g)?.length ?? 0, 0);
});

test("IN005 remains prototype-only with every acceptance gate closed", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-in-005"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.runtime.frameDomains?.length, 19);
  assert.equal(manifest?.movie.frameCount, 186);
  assert.equal(manifest?.title.en, "Numbers on the Number Line");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3IN05.swf"}), undefined);
  const registered = await loadAnimationModule("course-g04-l03-in-005");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  assert.equal(COURSE_G04_L03_IN_005_SOURCE_CONTRACT.ownerAccepted, false);
  for (const [name, value] of Object.entries(COURSE_G04_L03_IN_005_AUTHORITY)) {
    if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect") continue;
    assert.equal(value, false, name);
  }
  assert.equal(COURSE_G04_L03_IN_005_AUTHORITY.registryIsPrototypeOnly, true);
});
