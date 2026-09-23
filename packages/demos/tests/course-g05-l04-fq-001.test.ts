import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import fq001Module, {
  COURSE_G05_L04_FQ_001_ASSET,
  COURSE_G05_L04_FQ_001_MOVIE,
  COURSE_G05_L04_FQ_001_RUNTIME,
  COURSE_G05_L04_FQ_001_SOURCE_CONTRACT,
  getCourseG05L04Fq001FrameState,
} from "../src/modules/course-g05-l04-fq-001";
import {
  COURSE_G05_L04_FQ_001_ACCEPTANCE_EFFECTS,
  COURSE_G05_L04_FQ_001_COMPOSITE,
  COURSE_G05_L04_FQ_001_FIXED_COMPANION_DOMAIN,
  COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN,
  COURSE_G05_L04_FQ_001_SCENARIO,
} from "../src/timelines/course-g05-l04-fq-001";
import {loadAnimationModule} from "../src/animation-registry";
import {matchPrototype} from "../src/prototype-manifest";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const READY_CONTEXT = Object.freeze({
  frameDomain: COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN,
  scenario: COURSE_G05_L04_FQ_001_SCENARIO,
  lang: "en" as const,
  seed: 7,
  requirementId: "fq001-source-static-composite",
  traceId: "fq001-en-prefix",
  entryStateSha256: "a".repeat(64),
});

test("FQ001 timeline exposes only sprite-145 frames over fixed sprite-100 frame 1", () => {
  for (const frame of [1, 19, 20, 52]) {
    const state = getCourseG05L04Fq001FrameState(frame, READY_CONTEXT);
    assert.equal(state.status, "ready");
    assert.equal(state.blocker, null);
    assert.equal(state.frame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.equal(state.frameDomain, "sprite-145");
    assert.equal(state.rootFrame, 6);
    assert.equal(state.fixedCompanionFrameDomain, "sprite-100");
    assert.equal(state.fixedCompanionFrame, 1);
    assert.equal(state.legacyActionScriptExecuted, false);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.scrollEnabled, false);
    assert.equal(state.quizEnabled, false);
    assert.equal(state.textInputEnabled, false);
    assert.equal(state.audioRendered, false);
    assert.equal(state.networkEnabled, false);
    assert.equal(state.naturalRuntimeEstablished, false);
    assert.equal(state.sourceReplayEstablished, false);
  }
  assert.deepEqual(COURSE_G05_L04_FQ_001_COMPOSITE.renderOrder, [
    "stage-background",
    "sprite-100",
    "sprite-145",
  ]);
  assert.equal(COURSE_G05_L04_FQ_001_COMPOSITE.companion.fixedFrame, 1);
  assert.equal(
    COURSE_G05_L04_FQ_001_COMPOSITE.companion
      .standaloneRequestsEnabled,
    false,
  );
});

test("FQ001 timeline rejects root, standalone companion, ES, wrong scenario, and invalid frames", () => {
  const cases = [
    {
      frame: 1,
      context: {...READY_CONTEXT, frameDomain: "root"},
      blocker: "root-domain-disabled",
    },
    {
      frame: 1,
      context: {
        ...READY_CONTEXT,
        frameDomain: COURSE_G05_L04_FQ_001_FIXED_COMPANION_DOMAIN,
      },
      blocker: "companion-standalone-disabled",
    },
    {
      frame: 1,
      context: {...READY_CONTEXT, frameDomain: "sprite-999"},
      blocker: "unsupported-frame-domain",
    },
    {
      frame: 1,
      context: {...READY_CONTEXT, scenario: "source-static-frame"},
      blocker: "frame-domain-scenario-mismatch",
    },
    {
      frame: 1,
      context: {...READY_CONTEXT, lang: "es" as const},
      blocker: "spanish-disabled",
    },
    {
      frame: 0,
      context: READY_CONTEXT,
      blocker: "frame-out-of-range",
    },
    {
      frame: 53,
      context: READY_CONTEXT,
      blocker: "frame-out-of-range",
    },
  ] as const;
  for (const item of cases) {
    const state = getCourseG05L04Fq001FrameState(
      item.frame,
      item.context,
    );
    assert.equal(state.status, "blocked");
    assert.equal(state.blocker, item.blocker);
    assert.equal(state.sourceStaticCompositeReady, false);
    assert.equal(state.exportFrame, null);
  }
});

test("FQ001 module remains an acceptance-neutral legacy prototype", () => {
  assert.equal(fq001Module.key, "course-g05-l04-fq-001");
  assert.equal(fq001Module.maturity, "legacy-prototype");
  assert.equal(fq001Module.playbackMode, "once");
  assert.equal(fq001Module.playbackEndFrame, 52);
  assert.deepEqual(fq001Module.audioCues, []);
  assert.equal(COURSE_G05_L04_FQ_001_MOVIE.frameCount, 52);
  assert.equal(COURSE_G05_L04_FQ_001_RUNTIME.frameCount, 10);
  assert.equal(
    COURSE_G05_L04_FQ_001_RUNTIME.defaultFrameDomain,
    "sprite-145",
  );
  assert.deepEqual(
    COURSE_G05_L04_FQ_001_RUNTIME.frameDomains?.map((domain) => domain.id),
    ["sprite-145"],
  );
  assert.equal(
    COURSE_G05_L04_FQ_001_SOURCE_CONTRACT
      .canonicalFrameDomainDispositionStatus,
    "unresolved-unchanged",
  );
  assert.equal(
    COURSE_G05_L04_FQ_001_SOURCE_CONTRACT.strictAcceptanceEffect,
    "none",
  );
  assert.ok(
    Object.values(COURSE_G05_L04_FQ_001_ACCEPTANCE_EFFECTS).every(
      (value) => value === false,
    ),
  );
});

test("FQ001 is registered without exposing its fixed companion as a standalone domain", async () => {
  const loaded = await loadAnimationModule("course-g05-l04-fq-001");
  assert.ok(loaded);
  assert.equal(loaded.key, fq001Module.key);
  assert.equal(loaded.maturity, "legacy-prototype");
  assert.equal(loaded.runtime?.frameCount, 10);
  assert.equal(loaded.runtime?.defaultFrameDomain, "sprite-145");
  assert.deepEqual(
    loaded.runtime?.frameDomains?.map((domain) => domain.id),
    ["sprite-145"],
  );

  const prototype = matchPrototype({
    animationId: "course-g05-l04-fq-001",
  });
  assert.ok(prototype);
  assert.equal(prototype.key, "course-g05-l04-fq-001");
  assert.deepEqual(prototype.sourceBasenames, []);
  assert.equal(prototype.runtime.frameCount, 10);
  assert.equal(prototype.runtime.defaultFrameDomain, "sprite-145");
  assert.deepEqual(
    prototype.runtime.frameDomains?.map((domain) => domain.id),
    ["sprite-145"],
  );
  assert.equal(prototype.movie.frameCount, 52);
});

test("FQ001 module asset integrity is bound to the generated runtime", async () => {
  const runtimePath = path.join(
    ROOT,
    "public/flash-assets/courses/course-g05-l04-fq-001/canvas-renderer.js",
  );
  const runtime = await readFile(runtimePath);
  assert.equal(
    createHash("sha256").update(runtime).digest("hex"),
    COURSE_G05_L04_FQ_001_ASSET.sha256,
  );
});
