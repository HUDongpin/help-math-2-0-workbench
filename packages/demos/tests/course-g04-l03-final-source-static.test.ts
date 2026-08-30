import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import ir001, {COURSE_G04_L03_IR_001_341242CC_MOVIE as IR_MOVIE,
  COURSE_G04_L03_IR_001_341242CC_RUNTIME as IR_RUNTIME,
  COURSE_G04_L03_IR_001_341242CC_SOURCE as IR_SOURCE,
  getCourseG04L03Ir001341242ccFrameState as irState} from "../src/modules/course-g04-l03-ir-001-341242cc";
import gs002, {COURSE_G04_L03_GS_002_MOVIE as GS_MOVIE,
  COURSE_G04_L03_GS_002_RUNTIME as GS_RUNTIME,
  COURSE_G04_L03_GS_002_SOURCE as GS_SOURCE,
  COURSE_G04_L03_GS_002_SOURCE_CONTRACT as GS_SOURCE_CONTRACT,
  getCourseG04L03Gs002FrameState as gsState} from "../src/modules/course-g04-l03-gs-002";
import ts007, {COURSE_G04_L03_TS_007_MOVIE as TS7_MOVIE,
  COURSE_G04_L03_TS_007_RUNTIME as TS7_RUNTIME,
  COURSE_G04_L03_TS_007_SOURCE as TS7_SOURCE,
  getCourseG04L03Ts007FrameState as ts7State} from "../src/modules/course-g04-l03-ts-007";
import ts008, {COURSE_G04_L03_TS_008_MOVIE as TS8_MOVIE,
  COURSE_G04_L03_TS_008_RUNTIME as TS8_RUNTIME,
  COURSE_G04_L03_TS_008_SOURCE as TS8_SOURCE,
  getCourseG04L03Ts008FrameState as ts8State} from "../src/modules/course-g04-l03-ts-008";
import fq002, {COURSE_G04_L03_FQ_002_MOVIE as FQ2_MOVIE,
  COURSE_G04_L03_FQ_002_RUNTIME as FQ2_RUNTIME,
  COURSE_G04_L03_FQ_002_SOURCE as FQ2_SOURCE,
  COURSE_G04_L03_FQ_002_SOURCE_CONTRACT as FQ2_SOURCE_CONTRACT,
  getCourseG04L03Fq002FrameState as fq2State} from "../src/modules/course-g04-l03-fq-002";
import fq003, {COURSE_G04_L03_FQ_003_MOVIE as FQ3_MOVIE,
  COURSE_G04_L03_FQ_003_RUNTIME as FQ3_RUNTIME,
  COURSE_G04_L03_FQ_003_SOURCE as FQ3_SOURCE,
  getCourseG04L03Fq003FrameState as fq3State} from "../src/modules/course-g04-l03-fq-003";
import {matchPrototype} from "../src/prototype-manifest";
import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../src/source-static-candidate-authority";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

const pages = [
  {id: "course-g04-l03-ir-001-341242cc", domain: "sprite-27", frames: 136,
    movie: IR_MOVIE, runtime: IR_RUNTIME, module: ir001, source: IR_SOURCE},
  {id: "course-g04-l03-gs-002", domain: "sprite-321", frames: 428,
    movie: GS_MOVIE, runtime: GS_RUNTIME, module: gs002, source: GS_SOURCE},
  {id: "course-g04-l03-ts-007", domain: "sprite-441", frames: 696,
    movie: TS7_MOVIE, runtime: TS7_RUNTIME, module: ts007, source: TS7_SOURCE},
  {id: "course-g04-l03-ts-008", domain: "sprite-350", frames: 789,
    movie: TS8_MOVIE, runtime: TS8_RUNTIME, module: ts008, source: TS8_SOURCE},
  {id: "course-g04-l03-fq-002", domain: "sprite-899", frames: 68,
    movie: FQ2_MOVIE, runtime: FQ2_RUNTIME, module: fq002, source: FQ2_SOURCE},
  {id: "course-g04-l03-fq-003", domain: "sprite-899", frames: 68,
    movie: FQ3_MOVIE, runtime: FQ3_RUNTIME, module: fq003, source: FQ3_SOURCE},
] as const;

test("the final six G4 L3 engineering modules bind exact source and timeline identity", async () => {
  for (const page of pages) {
    assert.deepEqual(page.movie.stage, {width: 800, height: 600}, page.id);
    assert.equal(page.movie.frameCount, page.frames, page.id);
    assert.equal(page.runtime.frameCount, 10, page.id);
    assert.equal(page.runtime.defaultFrameDomain, page.domain, page.id);
    assert.equal(sha256(await readFile(`${repositoryRoot}${page.source.swf}`)),
      page.source.swfSha256, page.id);
    if (page.source.fla) {
      assert.equal(sha256(await readFile(`${repositoryRoot}${page.source.fla}`)),
        page.source.flaSha256, page.id);
    }
    const registered = await loadAnimationModule(page.id);
    assert.equal(registered?.maturity, "legacy-prototype", page.id);
    assert.equal(
      registered?.audioCues.length,
      page.id === "course-g04-l03-ir-001-341242cc"
        ? 2
        : [
            "course-g04-l03-gs-002",
            "course-g04-l03-ts-007",
            "course-g04-l03-ts-008",
          ].includes(page.id)
          ? 1
          : 0,
      page.id,
    );
    assert.equal(matchPrototype({animationId: page.id})?.movie.frameCount,
      page.frames, page.id);
  }
});

test("IR001, FQ002, and the GS002 source-local tail expose bounded drawings", async () => {
  for (const frame of [1, 136]) {
    const state = irState(frame, {frameDomain: "sprite-27",
      scenario: "source-static-frame", lang: "en", seed: 7});
    assert.equal(state.status, "ready");
    assert.deepEqual(state.visibleSourceMarkers,
      ["introduction-muted-source-static-drawing"]);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
  }
  for (const frame of [1, 68]) {
    const state = fq2State(frame, {frameDomain: "sprite-899",
      scenario: "source-static-frame", lang: "en", seed: 7});
    assert.equal(state.status, "ready");
    assert.deepEqual(state.visibleSourceMarkers,
      ["final-quiz-page-1-source-static-branch-atlas-drawing"]);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.naturalRuntimeEstablished, false);
    assert.equal(state.audioRendered, false);
  }
  assert.equal(fq002.playbackEndFrameByDomain?.["sprite-899"], 1);
  assert.equal(FQ2_SOURCE_CONTRACT.livePlaybackEndFrame, 1);
  assert.equal(FQ2_SOURCE_CONTRACT.blockedSourceBehaviorFrameCount, 0);
  for (const [frame, marker] of [
    [426, "game-1-lead-in-source-static-drawing"],
    [427, "game-1-source-local-initial-state"],
    [428, "game-1-post-stop-structural-inspection"],
  ] as const) {
    const state = gsState(frame, {frameDomain: "sprite-321",
      scenario: "source-static-frame", lang: "en", seed: 7});
    assert.equal(state.status, "ready");
    assert.equal(state.blocker, null);
    assert.deepEqual(state.visibleSourceMarkers, [marker]);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
  }
  assert.equal(gs002.playbackEndFrameByDomain?.["sprite-321"], 427);
  assert.equal(GS_SOURCE_CONTRACT.livePlaybackEndFrame, 427);
  assert.equal(GS_SOURCE_CONTRACT.blockedSourceBehaviorFrameCount, 0);
  assert.equal(sha256(await readFile(`${repositoryRoot}${
    GS_SOURCE.sourceLocalGameContract}`)),
  GS_SOURCE.sourceLocalGameContractSha256);
  const irMarkup = renderToStaticMarkup(createElement(ir001.Renderer, {frame: 1,
    frameDomain: "sprite-27", scenario: "source-static-frame", lang: "en", seed: 7}));
  assert.match(irMarkup, /<canvas/);
  const fq2Markup = renderToStaticMarkup(createElement(fq002.Renderer, {frame: 68,
    frameDomain: "sprite-899", scenario: "source-static-frame", lang: "en", seed: 7}));
  assert.match(fq2Markup, /<canvas/);
  const gsMarkup = renderToStaticMarkup(createElement(gs002.Renderer, {frame: 427,
    frameDomain: "sprite-321", scenario: "source-static-frame", lang: "en", seed: 7}));
  assert.doesNotMatch(gsMarkup, /data-fail-closed-reason/);
  assert.match(gsMarkup, /<canvas/);
});

test("TS007, TS008, and FQ003 expose muted drawings without executing controls", async () => {
  for (const [state, frame, domain, marker] of [
    [ts7State, 696, "sprite-441", "test-question-1-source-static-drawing"],
    [ts8State, 789, "sprite-350", "test-question-2-source-static-drawing"],
    [fq3State, 68, "sprite-899", "final-quiz-page-2-source-static-drawing"],
  ] as const) {
    const result = state(frame, {frameDomain: domain, scenario: "source-static-frame",
      lang: "en", seed: -1});
    assert.equal(result.status, "ready");
    assert.deepEqual(result.visibleSourceMarkers, [marker]);
    assert.equal(result.interactiveControlsEnabled, false);
    assert.equal(result.audioRendered, false);
  }
  const fq3Report = JSON.parse(await readFile(
    `${repositoryRoot}reports/g4-l3-fq003-current-javascript-candidate.json`, "utf8"));
  assert.equal(fq3Report.candidateRenderability.unexpectedNetworkRequestCount, 0);
  assert.equal(fq3Report.acceptance.behaviorComplete, false);
  for (const [name, value] of Object.entries(SOURCE_STATIC_CANDIDATE_AUTHORITY)) {
    if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect") continue;
    assert.equal(value, false, name);
  }
});
