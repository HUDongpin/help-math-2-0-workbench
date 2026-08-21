import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import fq002, {
  buildCourseG04L10Fq002CaptureAttributes,
  getCourseG04L10Fq002FrameState,
} from "../src/modules/course-g04-l10-fq-002";
import fq001, {
  buildCourseG04L10Fq001CaptureAttributes,
  getCourseG04L10Fq001FrameState,
} from "../src/modules/course-g04-l10-fq-001";
import fq003, {
  buildCourseG04L10Fq003CaptureAttributes,
  getCourseG04L10Fq003FrameState,
} from "../src/modules/course-g04-l10-fq-003";
import in006, {
  buildCourseG04L10In006CaptureAttributes,
  getCourseG04L10In006FrameState,
} from "../src/modules/course-g04-l10-in-006";
import in008, {
  buildCourseG04L10In008CaptureAttributes,
  getCourseG04L10In008FrameState,
} from "../src/modules/course-g04-l10-in-008";
import in009, {
  buildCourseG04L10In009CaptureAttributes,
  getCourseG04L10In009FrameState,
} from "../src/modules/course-g04-l10-in-009";
import in011, {
  buildCourseG04L10In011CaptureAttributes,
  getCourseG04L10In011FrameState,
} from "../src/modules/course-g04-l10-in-011";
import in013, {
  buildCourseG04L10In013CaptureAttributes,
  getCourseG04L10In013FrameState,
} from "../src/modules/course-g04-l10-in-013";
import in016, {
  buildCourseG04L10In016CaptureAttributes,
  getCourseG04L10In016FrameState,
} from "../src/modules/course-g04-l10-in-016";
import ir001, {
  buildCourseG04L10Ir001CaptureAttributes,
  getCourseG04L10Ir001FrameState,
} from "../src/modules/course-g04-l10-ir-001";
import rw004, {
  buildCourseG04L10Rw004CaptureAttributes,
  getCourseG04L10Rw004FrameState,
} from "../src/modules/course-g04-l10-rw-004";
import ti003, {
  buildCourseG04L10Ti003CaptureAttributes,
  getCourseG04L10Ti003FrameState,
} from "../src/modules/course-g04-l10-ti-003";
import ts006, {
  buildCourseG04L10Ts006CaptureAttributes,
  getCourseG04L10Ts006FrameState,
} from "../src/modules/course-g04-l10-ts-006";
import ts002, {
  buildCourseG04L10Ts002CaptureAttributes,
  getCourseG04L10Ts002FrameState,
} from "../src/modules/course-g04-l10-ts-002";
import ts005, {
  buildCourseG04L10Ts005CaptureAttributes,
  getCourseG04L10Ts005FrameState,
} from "../src/modules/course-g04-l10-ts-005";
import vb002, {
  buildCourseG04L10Vb002CaptureAttributes,
  getCourseG04L10Vb002FrameState,
} from "../src/modules/course-g04-l10-vb-002";
import vb003, {
  buildCourseG04L10Vb003CaptureAttributes,
  getCourseG04L10Vb003FrameState,
} from "../src/modules/course-g04-l10-vb-003";
import vb004, {
  buildCourseG04L10Vb004CaptureAttributes,
  getCourseG04L10Vb004FrameState,
} from "../src/modules/course-g04-l10-vb-004";
import vb005, {
  buildCourseG04L10Vb005CaptureAttributes,
  getCourseG04L10Vb005FrameState,
} from "../src/modules/course-g04-l10-vb-005";
import vb006, {
  buildCourseG04L10Vb006CaptureAttributes,
  getCourseG04L10Vb006FrameState,
} from "../src/modules/course-g04-l10-vb-006";
import vb007, {
  buildCourseG04L10Vb007CaptureAttributes,
  getCourseG04L10Vb007FrameState,
} from "../src/modules/course-g04-l10-vb-007";
import vb008, {
  buildCourseG04L10Vb008CaptureAttributes,
  getCourseG04L10Vb008FrameState,
} from "../src/modules/course-g04-l10-vb-008";
import vb010, {
  buildCourseG04L10Vb010CaptureAttributes,
  getCourseG04L10Vb010FrameState,
} from "../src/modules/course-g04-l10-vb-010";
import vb011, {
  buildCourseG04L10Vb011CaptureAttributes,
  getCourseG04L10Vb011FrameState,
} from "../src/modules/course-g04-l10-vb-011";
import {buildCanvasAssetRequest} from "../src/source-static-canvas-candidate";
import {COURSE_G04_L10_FQ_001_CONFIG} from "../src/timelines/course-g04-l10-fq-001";
import {COURSE_G04_L10_FQ_002_CONFIG} from "../src/timelines/course-g04-l10-fq-002";
import {COURSE_G04_L10_FQ_003_CONFIG} from "../src/timelines/course-g04-l10-fq-003";
import {COURSE_G04_L10_IN_006_CONFIG} from "../src/timelines/course-g04-l10-in-006";
import {COURSE_G04_L10_IN_008_CONFIG} from "../src/timelines/course-g04-l10-in-008";
import {COURSE_G04_L10_IN_009_CONFIG} from "../src/timelines/course-g04-l10-in-009";
import {COURSE_G04_L10_IN_011_CONFIG} from "../src/timelines/course-g04-l10-in-011";
import {COURSE_G04_L10_IN_013_CONFIG} from "../src/timelines/course-g04-l10-in-013";
import {COURSE_G04_L10_IN_016_CONFIG} from "../src/timelines/course-g04-l10-in-016";
import {COURSE_G04_L10_IR_001_CONFIG} from "../src/timelines/course-g04-l10-ir-001";
import {COURSE_G04_L10_RW_004_CONFIG} from "../src/timelines/course-g04-l10-rw-004";
import {COURSE_G04_L10_TI_003_CONFIG} from "../src/timelines/course-g04-l10-ti-003";
import {COURSE_G04_L10_TS_002_CONFIG} from "../src/timelines/course-g04-l10-ts-002";
import {COURSE_G04_L10_TS_005_CONFIG} from "../src/timelines/course-g04-l10-ts-005";
import {COURSE_G04_L10_TS_006_CONFIG} from "../src/timelines/course-g04-l10-ts-006";
import {COURSE_G04_L10_VB_002_CONFIG} from "../src/timelines/course-g04-l10-vb-002";
import {COURSE_G04_L10_VB_003_CONFIG} from "../src/timelines/course-g04-l10-vb-003";
import {COURSE_G04_L10_VB_004_CONFIG} from "../src/timelines/course-g04-l10-vb-004";
import {COURSE_G04_L10_VB_005_CONFIG} from "../src/timelines/course-g04-l10-vb-005";
import {COURSE_G04_L10_VB_006_CONFIG} from "../src/timelines/course-g04-l10-vb-006";
import {COURSE_G04_L10_VB_007_CONFIG} from "../src/timelines/course-g04-l10-vb-007";
import {COURSE_G04_L10_VB_008_CONFIG} from "../src/timelines/course-g04-l10-vb-008";
import {COURSE_G04_L10_VB_010_CONFIG} from "../src/timelines/course-g04-l10-vb-010";
import {COURSE_G04_L10_VB_011_CONFIG} from "../src/timelines/course-g04-l10-vb-011";

const ENTRY_STATE = "d".repeat(64);
const privateProductBridgeIds = new Set([
  "course-g04-l10-ir-001",
  "course-g04-l10-rw-004",
  "course-g04-l10-vb-002",
  "course-g04-l10-vb-003",
  "course-g04-l10-vb-004",
  "course-g04-l10-vb-005",
  "course-g04-l10-vb-006",
  "course-g04-l10-vb-007",
  "course-g04-l10-vb-008",
  "course-g04-l10-vb-010",
  "course-g04-l10-vb-011",
  "course-g04-l10-ts-002",
  "course-g04-l10-ts-005",
  "course-g04-l10-ts-006",
  "course-g04-l10-fq-001",
  "course-g04-l10-in-008",
  "course-g04-l10-in-009",
  "course-g04-l10-in-016",
]);
const candidates = [
  {
    id: "course-g04-l10-vb-003",
    module: vb003,
    config: COURSE_G04_L10_VB_003_CONFIG,
    frameDomain: "sprite-120",
    frameCount: 203,
    getFrameState: getCourseG04L10Vb003FrameState,
    buildCaptureAttributes: buildCourseG04L10Vb003CaptureAttributes,
  },
  {
    id: "course-g04-l10-ti-003",
    module: ti003,
    config: COURSE_G04_L10_TI_003_CONFIG,
    frameDomain: "sprite-308",
    frameCount: 395,
    getFrameState: getCourseG04L10Ti003FrameState,
    buildCaptureAttributes: buildCourseG04L10Ti003CaptureAttributes,
  },
  {
    id: "course-g04-l10-ts-006",
    module: ts006,
    config: COURSE_G04_L10_TS_006_CONFIG,
    frameDomain: "sprite-13",
    frameCount: 245,
    getFrameState: getCourseG04L10Ts006FrameState,
    buildCaptureAttributes: buildCourseG04L10Ts006CaptureAttributes,
  },
  {
    id: "course-g04-l10-fq-002",
    module: fq002,
    config: COURSE_G04_L10_FQ_002_CONFIG,
    frameDomain: "sprite-823",
    frameCount: 70,
    getFrameState: getCourseG04L10Fq002FrameState,
    buildCaptureAttributes: buildCourseG04L10Fq002CaptureAttributes,
  },
  {
    id: "course-g04-l10-rw-004",
    module: rw004,
    config: COURSE_G04_L10_RW_004_CONFIG,
    frameDomain: "sprite-109",
    frameCount: 1325,
    getFrameState: getCourseG04L10Rw004FrameState,
    buildCaptureAttributes: buildCourseG04L10Rw004CaptureAttributes,
  },
  {
    id: "course-g04-l10-in-009",
    module: in009,
    config: COURSE_G04_L10_IN_009_CONFIG,
    frameDomain: "sprite-89",
    frameCount: 953,
    getFrameState: getCourseG04L10In009FrameState,
    buildCaptureAttributes: buildCourseG04L10In009CaptureAttributes,
  },
  {
    id: "course-g04-l10-vb-008",
    module: vb008,
    config: COURSE_G04_L10_VB_008_CONFIG,
    frameDomain: "sprite-62",
    frameCount: 413,
    getFrameState: getCourseG04L10Vb008FrameState,
    buildCaptureAttributes: buildCourseG04L10Vb008CaptureAttributes,
  },
  {
    id: "course-g04-l10-ts-002",
    module: ts002,
    config: COURSE_G04_L10_TS_002_CONFIG,
    frameDomain: "sprite-29",
    frameCount: 324,
    getFrameState: getCourseG04L10Ts002FrameState,
    buildCaptureAttributes: buildCourseG04L10Ts002CaptureAttributes,
  },
  {
    id: "course-g04-l10-fq-001",
    module: fq001,
    config: COURSE_G04_L10_FQ_001_CONFIG,
    frameDomain: "sprite-50",
    frameCount: 52,
    getFrameState: getCourseG04L10Fq001FrameState,
    buildCaptureAttributes: buildCourseG04L10Fq001CaptureAttributes,
  },
  {
    id: "course-g04-l10-fq-003",
    module: fq003,
    config: COURSE_G04_L10_FQ_003_CONFIG,
    frameDomain: "sprite-823",
    frameCount: 70,
    getFrameState: getCourseG04L10Fq003FrameState,
    buildCaptureAttributes: buildCourseG04L10Fq003CaptureAttributes,
  },
  {
    id: "course-g04-l10-in-016",
    module: in016,
    config: COURSE_G04_L10_IN_016_CONFIG,
    frameDomain: "sprite-209",
    frameCount: 81,
    getFrameState: getCourseG04L10In016FrameState,
    buildCaptureAttributes: buildCourseG04L10In016CaptureAttributes,
  },
  {
    id: "course-g04-l10-vb-006",
    module: vb006,
    config: COURSE_G04_L10_VB_006_CONFIG,
    frameDomain: "sprite-213",
    frameCount: 104,
    getFrameState: getCourseG04L10Vb006FrameState,
    buildCaptureAttributes: buildCourseG04L10Vb006CaptureAttributes,
  },
  {
    id: "course-g04-l10-in-011",
    module: in011,
    config: COURSE_G04_L10_IN_011_CONFIG,
    frameDomain: "sprite-209",
    frameCount: 125,
    getFrameState: getCourseG04L10In011FrameState,
    buildCaptureAttributes: buildCourseG04L10In011CaptureAttributes,
  },
  {
    id: "course-g04-l10-vb-010",
    module: vb010,
    config: COURSE_G04_L10_VB_010_CONFIG,
    frameDomain: "sprite-36",
    frameCount: 128,
    getFrameState: getCourseG04L10Vb010FrameState,
    buildCaptureAttributes: buildCourseG04L10Vb010CaptureAttributes,
  },
  {
    id: "course-g04-l10-in-008",
    module: in008,
    config: COURSE_G04_L10_IN_008_CONFIG,
    frameDomain: "sprite-210",
    frameCount: 129,
    getFrameState: getCourseG04L10In008FrameState,
    buildCaptureAttributes: buildCourseG04L10In008CaptureAttributes,
  },
  {
    id: "course-g04-l10-vb-007",
    module: vb007,
    config: COURSE_G04_L10_VB_007_CONFIG,
    frameDomain: "sprite-204",
    frameCount: 130,
    getFrameState: getCourseG04L10Vb007FrameState,
    buildCaptureAttributes: buildCourseG04L10Vb007CaptureAttributes,
  },
  {
    id: "course-g04-l10-ir-001",
    module: ir001,
    config: COURSE_G04_L10_IR_001_CONFIG,
    frameDomain: "sprite-31",
    frameCount: 136,
    getFrameState: getCourseG04L10Ir001FrameState,
    buildCaptureAttributes: buildCourseG04L10Ir001CaptureAttributes,
  },
  {
    id: "course-g04-l10-in-013",
    module: in013,
    config: COURSE_G04_L10_IN_013_CONFIG,
    frameDomain: "sprite-222",
    frameCount: 139,
    getFrameState: getCourseG04L10In013FrameState,
    buildCaptureAttributes: buildCourseG04L10In013CaptureAttributes,
  },
  {
    id: "course-g04-l10-in-006",
    module: in006,
    config: COURSE_G04_L10_IN_006_CONFIG,
    frameDomain: "sprite-220",
    frameCount: 141,
    getFrameState: getCourseG04L10In006FrameState,
    buildCaptureAttributes: buildCourseG04L10In006CaptureAttributes,
  },
  {
    id: "course-g04-l10-vb-011",
    module: vb011,
    config: COURSE_G04_L10_VB_011_CONFIG,
    frameDomain: "sprite-31",
    frameCount: 153,
    getFrameState: getCourseG04L10Vb011FrameState,
    buildCaptureAttributes: buildCourseG04L10Vb011CaptureAttributes,
  },
  {
    id: "course-g04-l10-vb-004",
    module: vb004,
    config: COURSE_G04_L10_VB_004_CONFIG,
    frameDomain: "sprite-45",
    frameCount: 213,
    getFrameState: getCourseG04L10Vb004FrameState,
    buildCaptureAttributes: buildCourseG04L10Vb004CaptureAttributes,
  },
  {
    id: "course-g04-l10-vb-005",
    module: vb005,
    config: COURSE_G04_L10_VB_005_CONFIG,
    frameDomain: "sprite-44",
    frameCount: 217,
    getFrameState: getCourseG04L10Vb005FrameState,
    buildCaptureAttributes: buildCourseG04L10Vb005CaptureAttributes,
  },
  {
    id: "course-g04-l10-ts-005",
    module: ts005,
    config: COURSE_G04_L10_TS_005_CONFIG,
    frameDomain: "sprite-32",
    frameCount: 234,
    getFrameState: getCourseG04L10Ts005FrameState,
    buildCaptureAttributes: buildCourseG04L10Ts005CaptureAttributes,
  },
  {
    id: "course-g04-l10-vb-002",
    module: vb002,
    config: COURSE_G04_L10_VB_002_CONFIG,
    frameDomain: "sprite-84",
    frameCount: 280,
    getFrameState: getCourseG04L10Vb002FrameState,
    buildCaptureAttributes: buildCourseG04L10Vb002CaptureAttributes,
  },
] as const;

function context(frameDomain: string, overrides = {}) {
  return {
    entryStateSha256: ENTRY_STATE,
    frameDomain,
    lang: "en" as const,
    requirementId: "req-source-static-engineering",
    scenario: "source-static-frame",
    seed: 0,
    traceId: "trace-source-static-engineering",
    ...overrides,
  };
}

test("twenty-four L10 source-static cores remain fixed-English and acceptance-neutral", () => {
  for (const candidate of candidates) {
    assert.equal(candidate.module.key, candidate.id);
    assert.equal(
      candidate.module.maturity,
      privateProductBridgeIds.has(candidate.id)
        ? "private-current-js"
        : "legacy-prototype",
    );
    assert.equal(candidate.module.runtime?.frameCount, 10);
    assert.equal(candidate.module.runtime?.defaultFrameDomain,
      candidate.frameDomain);
    if (candidate.id === "course-g04-l10-ir-001") {
      assert.equal(candidate.module.audioCues?.length, 2);
    } else if (
      candidate.id === "course-g04-l10-ts-006" ||
      candidate.id === "course-g04-l10-ts-002" ||
      candidate.id === "course-g04-l10-ts-005" ||
      candidate.id === "course-g04-l10-rw-004" ||
      candidate.id === "course-g04-l10-vb-002" ||
      candidate.id === "course-g04-l10-vb-004" ||
      candidate.id === "course-g04-l10-vb-005" ||
      candidate.id === "course-g04-l10-vb-008" ||
      candidate.id === "course-g04-l10-vb-010" ||
      candidate.id === "course-g04-l10-vb-011" ||
      candidate.id === "course-g04-l10-vb-006" ||
      candidate.id === "course-g04-l10-vb-007" ||
      candidate.id === "course-g04-l10-in-008" ||
      candidate.id === "course-g04-l10-in-009" ||
      candidate.id === "course-g04-l10-in-016"
    ) {
      assert.equal(candidate.module.audioCues?.length, 1);
      assert.equal(candidate.module.audioTracks?.length, 1);
    } else {
      assert.deepEqual(candidate.module.audioCues, []);
    }
    assert.equal(candidate.config.mainFrameCount, candidate.frameCount);
    assert.equal(candidate.config.mainFrameDomain, candidate.frameDomain);
    assert.deepEqual(candidate.config.blockedFrameRanges, []);
    const first = candidate.getFrameState(
      1,
      context(candidate.frameDomain),
    );
    const last = candidate.getFrameState(
      candidate.frameCount,
      context(candidate.frameDomain),
    );
    for (const state of [first, last]) {
      assert.equal(state.status, "ready");
      assert.equal(state.language, "en");
      assert.equal(state.interactiveControlsEnabled, false);
      assert.equal(state.sourceHostBehaviorResolved, false);
      assert.equal(state.naturalRuntimeEstablished, false);
      assert.equal(state.audioRendered, false);
    }
  }
});

test("twenty-four L10 modules fail closed for invalid domains, scenarios, and Spanish", () => {
  for (const candidate of candidates) {
    const invalidDomain = candidate.getFrameState(1, context("sprite-999"));
    assert.equal(invalidDomain.status, "blocked");
    assert.equal(invalidDomain.blocker, "unsupported-runtime-request");
    const invalidScenario = candidate.getFrameState(
      1,
      context(candidate.frameDomain, {scenario: "unknown"}),
    );
    assert.equal(invalidScenario.status, "blocked");
    assert.equal(invalidScenario.blocker, "unsupported-runtime-request");
    const spanish = candidate.getFrameState(
      1,
      context(candidate.frameDomain, {lang: "es"}),
    );
    assert.equal(spanish.status, "blocked");
    assert.equal(spanish.blocker,
      "spanish-visual-and-audio-unvalidated");
  }
});

test("twenty-four L10 modules require exact capture identity", () => {
  for (const candidate of candidates) {
    const identity = context(candidate.frameDomain);
    const state = candidate.getFrameState(1, identity);
    const complete = candidate.buildCaptureAttributes({
      canvasStatus: "ready",
      frame: 1,
      state,
      ...identity,
    });
    assert.equal(complete["data-capture-stage"], "true");
    assert.equal(complete["data-capture-identity-status"], "verified");
    assert.equal(complete["data-source-controls-enabled"], "false");
    const mismatched = candidate.buildCaptureAttributes({
      canvasStatus: "ready",
      frame: 2,
      state,
      ...identity,
    });
    assert.equal(mismatched["data-capture-stage"], undefined);
    assert.equal(mismatched["data-capture-identity-status"], "blocked");
  }
});

test("twenty-four L10 assets use same-origin paths and digest-specific SRI", () => {
  for (const candidate of candidates) {
    const request = buildCanvasAssetRequest(candidate.config);
    assert.match(request.src, new RegExp(
      `^/flash-assets/courses/${candidate.id}/canvas-renderer\\.js\\?sha256=[a-f0-9]{64}$`,
    ));
    assert.match(request.integrity ?? "", /^sha256-[A-Za-z0-9+/]+={0,2}$/);
    assert.equal(request.crossOrigin, "anonymous");
    assert.doesNotMatch(request.src, /^https?:/);
  }
});

test("TI003 preserves its exact fractional native stage and 800x600 Canvas backing", () => {
  assert.deepEqual(ti003.movie.stage, {width: 799.9, height: 599.75});
  assert.deepEqual(ti003.runtime?.stage, {width: 799.9, height: 599.75});
  assert.deepEqual(COURSE_G04_L10_TI_003_CONFIG.nativeStage, {
    width: 799.9,
    height: 599.75,
    backgroundColor: "#b8d8f7",
  });
  assert.deepEqual(COURSE_G04_L10_TI_003_CONFIG.backingStage, {
    width: 800,
    height: 600,
  });
});

test("the private bridge registers only eighteen L10 candidates and no public course", async () => {
  const publicRegistries = await Promise.all([
    new URL("../prototype-registry.json", import.meta.url),
    new URL("../src/prototype-manifest.ts", import.meta.url),
    new URL("../../../apps/web/lib/whole-lesson-course-registry.ts", import.meta.url),
  ].map((url) => readFile(url, "utf8")));
  for (const source of publicRegistries) {
    for (const candidate of candidates) {
      assert.doesNotMatch(source, new RegExp(candidate.id));
    }
  }

  const [generated, privateRegistry] = await Promise.all([
    readFile(new URL("../src/registry.generated.ts", import.meta.url), "utf8"),
    readFile(new URL("../private-current-js-registry.json", import.meta.url), "utf8"),
  ]);
  for (const candidate of candidates) {
    if (privateProductBridgeIds.has(candidate.id)) {
      assert.match(generated, new RegExp(candidate.id));
      assert.match(privateRegistry, new RegExp(candidate.id));
    } else {
      assert.doesNotMatch(generated, new RegExp(candidate.id));
      assert.doesNotMatch(privateRegistry, new RegExp(candidate.id));
    }
  }
});
