import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {Script} from "node:vm";

import {createSourceStaticCanvasCandidate} from "../src/source-static-canvas-candidate";
import {
  SHARED_ALG001_L01_P001_CONFIG,
  SHARED_ALG001_L01_P001_SOURCE,
} from "../src/timelines/shared-alg001-l01-p001";
import {
  SHARED_ALG001_L05_P030_CONFIG,
  SHARED_ALG001_L05_P030_SOURCE,
} from "../src/timelines/shared-alg001-l05-p030";
import {
  SHARED_ALG001_L06_P040_CONFIG,
  SHARED_ALG001_L06_P040_SOURCE,
} from "../src/timelines/shared-alg001-l06-p040";
import {
  SHARED_ALG001_L08_P025_CONFIG,
  SHARED_ALG001_L08_P025_SOURCE,
} from "../src/timelines/shared-alg001-l08-p025";
import {
  SHARED_DAT001_L01_P001_CONFIG,
  SHARED_DAT001_L01_P001_SOURCE,
} from "../src/timelines/shared-dat001-l01-p001";
import {
  SHARED_DAT001_L03_P030_CONFIG,
  SHARED_DAT001_L03_P030_SOURCE,
} from "../src/timelines/shared-dat001-l03-p030";
import {
  SHARED_DAT001_L07_P025_CONFIG,
  SHARED_DAT001_L07_P025_SOURCE,
} from "../src/timelines/shared-dat001-l07-p025";
import {
  SHARED_GEO001_L02_P020_CONFIG,
  SHARED_GEO001_L02_P020_SOURCE,
} from "../src/timelines/shared-geo001-l02-p020";
import {
  SHARED_GEO001_L07_P040_CONFIG,
  SHARED_GEO001_L07_P040_SOURCE,
} from "../src/timelines/shared-geo001-l07-p040";
import {
  SHARED_GEO001_L11_P030_CONFIG,
  SHARED_GEO001_L11_P030_SOURCE,
} from "../src/timelines/shared-geo001-l11-p030";
import {
  SHARED_NMS002_L01_P001_CONFIG,
  SHARED_NMS002_L01_P001_SOURCE,
} from "../src/timelines/shared-nms002-l01-p001";
import {
  SHARED_NMS002_L02_P020_CONFIG,
  SHARED_NMS002_L02_P020_SOURCE,
} from "../src/timelines/shared-nms002-l02-p020";
import {
  SHARED_NMS002_L05_P040_CONFIG,
  SHARED_NMS002_L05_P040_SOURCE,
} from "../src/timelines/shared-nms002-l05-p040";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const OUTPUT_ROOT = path.join(PROJECT_ROOT, "work/g678-shared-page-factory",
  "g678-shared-current-js-calibration-13-v1");

const candidates = Object.freeze([
  [SHARED_NMS002_L01_P001_CONFIG, SHARED_NMS002_L01_P001_SOURCE],
  [SHARED_NMS002_L02_P020_CONFIG, SHARED_NMS002_L02_P020_SOURCE],
  [SHARED_NMS002_L05_P040_CONFIG, SHARED_NMS002_L05_P040_SOURCE],
  [SHARED_GEO001_L02_P020_CONFIG, SHARED_GEO001_L02_P020_SOURCE],
  [SHARED_GEO001_L07_P040_CONFIG, SHARED_GEO001_L07_P040_SOURCE],
  [SHARED_GEO001_L11_P030_CONFIG, SHARED_GEO001_L11_P030_SOURCE],
  [SHARED_ALG001_L01_P001_CONFIG, SHARED_ALG001_L01_P001_SOURCE],
  [SHARED_ALG001_L05_P030_CONFIG, SHARED_ALG001_L05_P030_SOURCE],
  [SHARED_ALG001_L06_P040_CONFIG, SHARED_ALG001_L06_P040_SOURCE],
  [SHARED_ALG001_L08_P025_CONFIG, SHARED_ALG001_L08_P025_SOURCE],
  [SHARED_DAT001_L01_P001_CONFIG, SHARED_DAT001_L01_P001_SOURCE],
  [SHARED_DAT001_L03_P030_CONFIG, SHARED_DAT001_L03_P030_SOURCE],
  [SHARED_DAT001_L07_P025_CONFIG, SHARED_DAT001_L07_P025_SOURCE],
] as const);

test("all thirteen shared candidates expose renderable first and last visual frames while controls remain unresolved", () => {
  assert.equal(candidates.length, 13);
  for (const [config, source] of candidates) {
    const candidate = createSourceStaticCanvasCandidate(config);
    assert.deepEqual(config.blockedFrameRanges, [], config.animationId);
    assert.match(config.assetSource,
      new RegExp(`^/flash-assets/g678-local/${config.animationId}/canvas-renderer\\.js$`));
    assert.ok(source.productBlockers.length > 0, config.animationId);
    assert.equal(source.productCalibrationPassed, false, config.animationId);
    assert.equal(source.engineeringPreviewReady, false, config.animationId);
    for (const frame of [1, config.mainFrameCount]) {
      const state = candidate.getFrameState(frame, {
        frameDomain: config.mainFrameDomain,
        scenario: "source-static-frame",
        lang: "en",
        seed: 0,
      });
      assert.equal(state.status, "ready", `${config.animationId} frame ${frame}`);
      assert.equal(state.exportFrame, frame - 1, config.animationId);
      assert.equal(state.sourceStaticVisualReady, true, config.animationId);
      assert.equal(state.interactiveControlsEnabled, false, config.animationId);
      assert.equal(state.sourceHostBehaviorResolved, false, config.animationId);
      assert.equal(state.naturalRuntimeEstablished, false, config.animationId);
      assert.equal(state.audioRendered, false, config.animationId);
    }
  }
});

test("each generated runtime executes into the canonical Canvas registry and resolves first and last frames", async () => {
  for (const [config] of candidates) {
    const runtimePath = path.join(OUTPUT_ROOT, "members", config.animationId,
      "canvas-renderer.js");
    const runtime = await readFile(runtimePath, "utf8");
    assert.doesNotMatch(runtime, /HELP_MATH_G678_LOCAL_CANVAS_ASSETS/u,
      config.animationId);
    const sandbox = {
      document: {
        createElement(tagName: string) {
          if (tagName === "canvas") {
            return {getContext: () => ({}), width: 0, height: 0};
          }
          if (tagName === "img") {
            return {complete: true, naturalWidth: 1, naturalHeight: 1,
              decode: async () => undefined};
          }
          throw new Error(`unexpected runtime element: ${tagName}`);
        },
      },
    } as Record<string, unknown>;
    new Script(runtime, {filename: `${config.animationId}-canvas-renderer.js`})
      .runInNewContext(sandbox);
    const registry = sandbox.HELP_MATH_CANVAS_ASSETS as Record<string, {
      resolveFrameState(request: Readonly<{frame: number; scenario: string;
        lang: string; seed: number}>): Readonly<{localFrame: number;
          exportFrame: number; interactiveStateResolved: false;
          audioRendered: false}>;
    }>;
    assert.ok(registry, `${config.animationId}: canonical registry is absent`);
    const asset = registry[config.animationId];
    assert.ok(asset, `${config.animationId}: runtime did not register`);
    for (const frame of [1, config.mainFrameCount]) {
      const state = asset.resolveFrameState({frame,
        scenario: "source-static-frame", lang: "en", seed: 0});
      assert.equal(state.localFrame, frame, config.animationId);
      assert.equal(state.exportFrame, frame - 1, config.animationId);
      assert.equal(state.interactiveStateResolved, false, config.animationId);
      assert.equal(state.audioRendered, false, config.animationId);
    }
  }
});
