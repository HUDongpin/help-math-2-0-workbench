import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import courseVb003, {
  COURSE_G04_L03_VB_003_MOVIE,
  COURSE_G04_L03_VB_003_RUNTIME,
  COURSE_G04_L03_VB_003_SOURCE,
  COURSE_G04_L03_VB_003_SOURCE_CONTRACT,
  buildCourseG04L03Vb003CaptureAttributes,
  getCourseG04L03Vb003FrameState,
  normalizeCourseG04L03Vb003Frame,
} from "../src/modules/course-g04-l03-vb-003";
import {matchPrototype} from "../src/prototype-manifest";
import {COURSE_G04_L03_VB_003_AUTHORITY} from "../src/timelines/course-g04-l03-vb-003";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

test("VB003 preserves the 10-frame root and distinct nested domains", async () => {
  assert.deepEqual(COURSE_G04_L03_VB_003_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_VB_003_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_VB_003_MOVIE.frameCount, 160);
  assert.equal(COURSE_G04_L03_VB_003_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_VB_003_RUNTIME.defaultFrameDomain, "sprite-106");
  assert.deepEqual(COURSE_G04_L03_VB_003_RUNTIME.frameDomains, [
    {id: "sprite-106", frameCount: 160, fps: 12, rootFrame: 6},
    {id: "sprite-28", frameCount: 1, fps: 12, rootFrame: 6},
  ]);
  assert.equal(courseVb003.runtime, COURSE_G04_L03_VB_003_RUNTIME);
  assert.deepEqual(courseVb003.playbackEndFrameByDomain, {
    root: 1,
    "sprite-106": 116,
    "sprite-28": 1,
  });
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G04_L03_VB_003_SOURCE.swf}`)),
    COURSE_G04_L03_VB_003_SOURCE.swfSha256,
  );
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${COURSE_G04_L03_VB_003_SOURCE.fla}`)),
    COURSE_G04_L03_VB_003_SOURCE.flaSha256,
  );
  assert.equal(
    sha256(await readFile(
      `${repositoryRoot}${COURSE_G04_L03_VB_003_SOURCE.sourceScriptEvidence}`,
    )),
    COURSE_G04_L03_VB_003_SOURCE.sourceScriptEvidenceSha256,
  );
  assert.equal(
    sha256(await readFile(
      `${repositoryRoot}${COURSE_G04_L03_VB_003_SOURCE.sourcePlacementEvidence}`,
    )),
    COURSE_G04_L03_VB_003_SOURCE.sourcePlacementEvidenceSha256,
  );
  assert.equal(COURSE_G04_L03_VB_003_SOURCE.embeddedAudioStreamSha256.length, 4);
  assert.equal(COURSE_G04_L03_VB_003_SOURCE.quizEntryFrame, 116);
  assert.deepEqual(COURSE_G04_L03_VB_003_SOURCE.draggableObjectIds,
    [83, 84, 85, 86, 87]);
  assert.deepEqual(
    COURSE_G04_L03_VB_003_SOURCE.dragMatchSourceData.map(
      ({itemInstance, label, targetInstance}) => ({
        itemInstance,
        label,
        targetInstance,
      }),
    ),
    [
      {itemInstance: "Scr_2", label: "–2", targetInstance: "Mc_Tar_2"},
      {itemInstance: "Scr_3", label: "2", targetInstance: "Mc_Tar_3"},
      {itemInstance: "Scr_4", label: "0", targetInstance: "Mc_Tar_4"},
      {itemInstance: "Scr_5", label: "–5", targetInstance: "Mc_Tar_5"},
      {itemInstance: "Scr_6", label: "5", targetInstance: "Mc_Tar_6"},
    ],
  );
});

test("VB003 exposes only bounded English source-static sprite-106 frames", () => {
  assert.equal(normalizeCourseG04L03Vb003Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03Vb003Frame(161), 160);
  assert.equal(normalizeCourseG04L03Vb003Frame(8, "root"), 8);
  assert.equal(normalizeCourseG04L03Vb003Frame(8, "sprite-28"), 1);
  for (const frame of [1, 80, 160]) {
    const state = getCourseG04L03Vb003FrameState(frame, {
      frameDomain: "sprite-106",
      scenario: "source-static-frame",
      lang: "en",
      seed: frame === 160 ? -1 : 0,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.frame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.deepEqual(state.visibleSourceMarkers, ["number-line-practice"]);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
    assert.equal(state.naturalRuntimeEstablished, false);
  }
});

test("VB003 fails closed for Spanish, root, companion, and mismatches", () => {
  const requests = [
    ["sprite-106", "source-static-frame", "es", "spanish-visual-and-audio-unvalidated"],
    ["root", "root-unavailable", "en", "root-baseline-unavailable"],
    ["sprite-28", "sprite-28-unavailable", "en", "companion-domain-unrendered"],
    ["root", "source-static-frame", "en", "frame-domain-scenario-mismatch"],
  ] as const;
  for (const [frameDomain, scenario, lang, blocker] of requests) {
    const state = getCourseG04L03Vb003FrameState(1, {
      frameDomain,
      scenario,
      lang,
      seed: 0,
    });
    assert.equal(state.blocker, blocker);
  }
});

test("VB003 deterministic capture keeps all source behavior disabled", () => {
  const state = getCourseG04L03Vb003FrameState(160, {
    frameDomain: "sprite-106",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  const attributes = buildCourseG04L03Vb003CaptureAttributes({
    canvasStatus: "ready",
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-160",
    state,
    traceId: "engineering-source-static",
  });
  assert.equal(attributes["data-capture-stage"], "true");
  assert.equal(attributes["data-flash-frame-domain"], "sprite-106");
  assert.equal(attributes["data-source-controls-enabled"], "false");
  assert.equal(attributes["data-source-marker-visuals"], "number-line-practice");
});

test("VB003 stays prototype-only with all authority and acceptance closed", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-vb-003"});
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.movie.frameCount, 160);
  assert.equal(manifest?.title.en, "Number Line Practice");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3VB03.swf"}), undefined);
  const registered = await loadAnimationModule("course-g04-l03-vb-003");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  assert.equal(COURSE_G04_L03_VB_003_SOURCE_CONTRACT.ownerAccepted, false);
  for (const [name, value] of Object.entries(COURSE_G04_L03_VB_003_AUTHORITY)) {
    if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect") continue;
    assert.equal(value, false, name);
  }
  assert.equal(COURSE_G04_L03_VB_003_AUTHORITY.registryIsPrototypeOnly, true);
  assert.equal(courseVb003.reducedMotionFrame, 116);
  const activityMarkup = renderToStaticMarkup(
    createElement(courseVb003.Renderer, {
      frame: 116,
      frameDomain: "sprite-106",
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
    }),
  );
  assert.match(activityMarkup, /data-current-js-controls-enabled="true"/);
  assert.match(activityMarkup, /data-current-js-functional-candidate="true"/);
  assert.match(activityMarkup,
    /data-current-js-functional-scope="vb003-number-line-drag-match-source-script-bound"/);
  assert.match(activityMarkup, /Select negative 2 to move/);
  assert.match(activityMarkup,
    /Place selected number at negative 5 on the number line/);
  assert.match(activityMarkup, /Mobile number-line practice controls/);
  assert.match(activityMarkup, /data-mobile-touch-target-min="48"/);
  assert.match(activityMarkup, /<div aria-hidden="true"><section/);
  assert.equal(
    COURSE_G04_L03_VB_003_SOURCE_CONTRACT.currentJavascriptInteractionStatus,
    "source-script-bound-functional-candidate",
  );
  assert.equal(
    COURSE_G04_L03_VB_003_SOURCE_CONTRACT.behaviorParityEstablished,
    false,
  );
  const spanishMarkup = renderToStaticMarkup(
    createElement(courseVb003.Renderer, {
      frame: 1,
      frameDomain: "sprite-106",
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

  const captureMarkup = renderToStaticMarkup(
    createElement(courseVb003.Renderer, {
      entryStateSha256: "a".repeat(64),
      frame: 116,
      frameDomain: "sprite-106",
      requirementId: "engineering-source-static-frame-116",
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      traceId: "engineering-source-static",
    }),
  );
  assert.match(captureMarkup, /data-current-js-controls-enabled="false"/);
  assert.doesNotMatch(captureMarkup, /Select negative 2 to move/);
  assert.doesNotMatch(captureMarkup, /Mobile number-line practice controls/);
});
