import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

import {loadAnimationModule} from "../src/animation-registry";
import courseIn006, {
  COURSE_G04_L03_IN_006_MOVIE,
  COURSE_G04_L03_IN_006_RUNTIME,
  COURSE_G04_L03_IN_006_SOURCE,
  COURSE_G04_L03_IN_006_SOURCE_CONTRACT,
  getCourseG04L03In006FrameState,
  normalizeCourseG04L03In006Frame,
} from "../src/modules/course-g04-l03-in-006";
import {matchPrototype} from "../src/prototype-manifest";
import {COURSE_G04_L03_IN_006_AUTHORITY} from "../src/timelines/course-g04-l03-in-006";
import {COURSE_G04_L03_IN_006_NUMBER_LINE_GEOMETRY} from "../src/timelines/course-g04-l03-in-006-number-line-jump-interaction";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
const expectedCompanions = [
  ["sprite-11", 1], ["sprite-15", 1], ["sprite-122", 3],
  ["sprite-125", 3], ["sprite-130", 4], ["sprite-133", 3],
  ["sprite-135", 1], ["sprite-137", 1], ["sprite-142", 2],
  ["sprite-144", 55], ["sprite-146", 20], ["sprite-150", 25],
] as const;

test("IN006 jump coordinates use the source horizontal line and one native SVG plane", async () => {
  const audit = `${repositoryRoot}migrations/course-g04-l03-in-006/audit/machine/`;
  const xml = gunzipSync(await readFile(`${audit}swfmill.xml.gz`)).toString();
  const shape = xml.match(/<DefineShape objectID="16">[\s\S]*?<\/DefineShape>/)?.[0];
  assert.ok(shape);
  const localY = Number(shape.match(/<ShapeSetup x="-7045" y="(\d+)"/)?.[1]);
  const root = xml.match(/<PlaceObject2[^>]*objectID="151"[^>]*>[\s\S]*?<Transform transX="(\d+)" transY="(\d+)"/);
  assert.ok(root);
  const geometry = COURSE_G04_L03_IN_006_NUMBER_LINE_GEOMETRY;
  assert.equal(geometry.baselineY, (Number(root[2]) + localY) / 20);
  const scripts = gunzipSync(await readFile(`${audit}ffdec-scripts.txt.gz`)).toString();
  const action = scripts.split('===== DefineSprite_151/frame_1054/DoAction.as =====')[1]?.split('=====')[0];
  assert.ok(action);
  const vx = Number(action.match(/\nvx = (-?[\d.]+);/)?.[1]);
  const spacing = Number(action.match(/\ndiff = ([\d.]+);/)?.[1]);
  assert.equal(geometry.firstTickX, Number(root[1]) / 20 + vx + spacing);
  assert.equal(geometry.tickSpacing, spacing);
  const markup = renderToStaticMarkup(createElement(courseIn006.Renderer, {
    frame: 1054, frameDomain: "sprite-151", scenario: "source-static-frame", lang: "en", seed: 0,
  }));
  assert.match(markup, /<svg[^>]+class="course-g04-l03-in-006-stage-surface"[^>]+viewBox="0 0 800 600"/);
  assert.match(markup, /<foreignObject height="600" width="800" x="0" y="0">/);
});

test("IN006 preserves the 1057-frame source domain and random quiz facts", async () => {
  assert.deepEqual(COURSE_G04_L03_IN_006_MOVIE.stage, {width: 800, height: 600});
  assert.equal(COURSE_G04_L03_IN_006_MOVIE.frameCount, 1_057);
  assert.equal(COURSE_G04_L03_IN_006_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_IN_006_RUNTIME.defaultFrameDomain, "sprite-151");
  assert.deepEqual(COURSE_G04_L03_IN_006_RUNTIME.frameDomains, [
    {id: "sprite-151", frameCount: 1_057, fps: 12, rootFrame: 6},
    ...expectedCompanions.map(([id, frameCount]) =>
      ({id, frameCount, fps: 12, rootFrame: 6})),
  ]);
  assert.deepEqual(COURSE_G04_L03_IN_006_SOURCE.quizSourcePairs,
    ["-11~-8", "-8~-15", "-15~-4", "-4~5", "5~9", "9~15", "15~1", "1~-6"]);
  assert.equal(COURSE_G04_L03_IN_006_SOURCE.randomCalls.length, 2);
  assert.equal(COURSE_G04_L03_IN_006_SOURCE.embeddedAudioStreamSha256.length, 5);
  assert.equal(courseIn006.playbackEndFrameByDomain?.["sprite-151"], 1_054);
  for (const [path, expected] of [
    [COURSE_G04_L03_IN_006_SOURCE.swf, COURSE_G04_L03_IN_006_SOURCE.swfSha256],
    [COURSE_G04_L03_IN_006_SOURCE.fla, COURSE_G04_L03_IN_006_SOURCE.flaSha256],
    [COURSE_G04_L03_IN_006_SOURCE.associatedAudio,
      COURSE_G04_L03_IN_006_SOURCE.associatedAudioSha256],
    [COURSE_G04_L03_IN_006_SOURCE.sourceLocalNumberLineQuizContract,
      COURSE_G04_L03_IN_006_SOURCE.sourceLocalNumberLineQuizContractSha256],
  ] as const) {
    assert.equal(sha256(await readFile(`${repositoryRoot}${path}`)), expected);
  }
});

test("IN006 exposes pre-quiz drawings while keeping source behavior disabled", () => {
  assert.equal(normalizeCourseG04L03In006Frame(2_000), 1_057);
  for (const frame of [1, 1_053]) {
    const state = getCourseG04L03In006FrameState(frame, {
      frameDomain: "sprite-151",
      scenario: "source-static-frame",
      lang: "en",
      seed: -1,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.seed, 4_294_967_295);
    assert.deepEqual(state.visibleSourceMarkers,
      ["number-line-instruction-source-static-drawing"]);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
  }
});

test("IN006 exposes the source-local initial quiz and labels post-stop inspection", () => {
  for (const frame of [1_054, 1_055, 1_056, 1_057]) {
    const state = getCourseG04L03In006FrameState(frame, {
      frameDomain: "sprite-151",
      scenario: "source-static-frame",
      lang: "en",
      seed: 7,
    });
    assert.equal(state.status, "ready");
    assert.equal(state.blocker, null);
    assert.deepEqual(state.visibleSourceMarkers, [frame === 1_054
      ? "number-line-quiz-source-local-initial-state"
      : "number-line-quiz-post-stop-static-inspection"]);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
  }
  assert.equal(COURSE_G04_L03_IN_006_SOURCE_CONTRACT.blockedSourceBehaviorFrameCount, 0);
  assert.equal(COURSE_G04_L03_IN_006_SOURCE.safeLivePlaybackEndFrame, 1_054);
  const companion = getCourseG04L03In006FrameState(1, {
    frameDomain: "sprite-144",
    scenario: "sprite-144-unavailable",
    lang: "en",
    seed: 0,
  });
  assert.equal(companion.blocker, "companion-domain-unrendered");
  const unreachable = getCourseG04L03In006FrameState(1, {
    frameDomain: "sprite-26",
    scenario: "sprite-26-unavailable",
    lang: "en",
    seed: 0,
  });
  assert.equal(unreachable.blocker, "unsupported-runtime-request");
});

test("IN006 initial quiz renderer exposes acceptance-neutral functional controls", () => {
  const markup = renderToStaticMarkup(createElement(courseIn006.Renderer, {
    frame: 1_054,
    frameDomain: "sprite-151",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  }));
  assert.match(markup, /data-render-state="idle"/);
  assert.match(markup, /data-audio-rendered="false"/);
  assert.match(markup, /data-current-js-controls-enabled="true"/);
  assert.match(markup, /data-current-js-functional-candidate="true"/);
  assert.match(markup, /data-current-question-id="question-08"/);
  assert.match(markup, /data-source-canvas-accessibility-isolated="true"/);
  assert.match(markup, /inert=""/);
  assert.match(markup, /<canvas/);
  assert.match(markup, /aria-label="Jump 1 to the right/);
  assert.match(markup, /aria-label="Reverse the most recently placed jump"/);
  assert.match(markup, /aria-label="New Number"/);
  assert.match(markup, /aria-label="Clear"/);
  assert.match(markup, /Number-line jump controls/);
  assert.match(markup, /15.*to.*1/);
  assert.match(markup, /data-interaction-companion-placement="fallback"/);
  assert.equal(courseIn006.reducedMotionFrame, 1_054);
  assert.equal(
    COURSE_G04_L03_IN_006_SOURCE_CONTRACT
      .currentJavascriptInteractionStatus,
    "source-script-bound-functional-candidate",
  );
  assert.equal(
    COURSE_G04_L03_IN_006_SOURCE_CONTRACT.behaviorParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_IN_006_SOURCE_CONTRACT.strictAcceptanceEffect,
    "none",
  );
});

test("IN006 hash-bound deterministic capture preserves source Canvas without controls", () => {
  const markup = renderToStaticMarkup(createElement(courseIn006.Renderer, {
    frame: 1_054,
    frameDomain: "sprite-151",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
    requirementId: "IN006-QUIZ-READY",
    traceId: "in006-source-static-f1054",
    entryStateSha256:
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  }));
  assert.match(markup, /data-deterministic-evidence-capture="true"/);
  assert.match(markup, /data-current-js-controls-enabled="false"/);
  assert.match(markup, /data-current-js-functional-candidate="false"/);
  assert.match(markup, /data-source-canvas-accessibility-isolated="false"/);
  assert.match(markup, /<canvas/);
  assert.doesNotMatch(markup, /Number-line jump controls/);
  assert.doesNotMatch(markup, /<button/);
});

test("IN006 functional controls fail closed outside the English source quiz stop", () => {
  for (const props of [
    {
      frame: 1_053,
      frameDomain: "sprite-151",
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
    },
    {
      frame: 1_054,
      frameDomain: "sprite-151",
      scenario: "source-static-frame",
      lang: "es",
      seed: 0,
    },
  ] as const) {
    const markup = renderToStaticMarkup(
      createElement(courseIn006.Renderer, props),
    );
    assert.match(markup, /data-current-js-controls-enabled="false"/);
    assert.match(markup, /data-current-js-functional-candidate="false"/);
    assert.match(markup, /data-source-canvas-accessibility-isolated="false"/);
    assert.doesNotMatch(markup, /Number-line jump controls/);
    assert.doesNotMatch(markup, /<button/);
  }
});

test("IN006 remains prototype-only and acceptance-neutral", async () => {
  const manifest = matchPrototype({animationId: "course-g04-l03-in-006"});
  assert.equal(manifest?.runtime.frameDomains?.length, 13);
  assert.equal(manifest?.movie.frameCount, 1_057);
  assert.equal(manifest?.title.en, "Numbers on the Number Line");
  assert.equal(matchPrototype({sourcePath: "/unknown/L3IN06.swf"}), undefined);
  const registered = await loadAnimationModule("course-g04-l03-in-006");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  for (const [name, value] of Object.entries(COURSE_G04_L03_IN_006_AUTHORITY)) {
    if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect") continue;
    assert.equal(value, false, name);
  }
});
