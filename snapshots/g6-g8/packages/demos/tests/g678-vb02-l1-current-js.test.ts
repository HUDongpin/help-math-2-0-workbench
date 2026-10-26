import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {Script} from "node:vm";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import alg01, {SHARED_ALG001_L01_P007_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l01-p007";
import {SHARED_ALG001_L01_P007_CONFIG, SHARED_ALG001_L01_P007_SOURCE} from "../src/timelines/shared-alg001-l01-p007";
import alg02, {SHARED_ALG001_L02_P008_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l02-p008";
import {SHARED_ALG001_L02_P008_CONFIG, SHARED_ALG001_L02_P008_SOURCE} from "../src/timelines/shared-alg001-l02-p008";
import alg03, {SHARED_ALG001_L03_P006_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l03-p006";
import {SHARED_ALG001_L03_P006_CONFIG, SHARED_ALG001_L03_P006_SOURCE} from "../src/timelines/shared-alg001-l03-p006";
import alg04, {SHARED_ALG001_L04_P006_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l04-p006";
import {SHARED_ALG001_L04_P006_CONFIG, SHARED_ALG001_L04_P006_SOURCE} from "../src/timelines/shared-alg001-l04-p006";
import alg05, {SHARED_ALG001_L05_P005_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l05-p005";
import {SHARED_ALG001_L05_P005_CONFIG, SHARED_ALG001_L05_P005_SOURCE} from "../src/timelines/shared-alg001-l05-p005";
import alg06, {SHARED_ALG001_L06_P011_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l06-p011";
import {SHARED_ALG001_L06_P011_CONFIG, SHARED_ALG001_L06_P011_SOURCE} from "../src/timelines/shared-alg001-l06-p011";
import alg10, {SHARED_ALG001_L10_P007_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l10-p007";
import {SHARED_ALG001_L10_P007_CONFIG, SHARED_ALG001_L10_P007_SOURCE} from "../src/timelines/shared-alg001-l10-p007";
import alg11, {SHARED_ALG001_L11_P005_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l11-p005";
import {SHARED_ALG001_L11_P005_CONFIG, SHARED_ALG001_L11_P005_SOURCE} from "../src/timelines/shared-alg001-l11-p005";
import alg12, {SHARED_ALG001_L12_P007_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l12-p007";
import {SHARED_ALG001_L12_P007_CONFIG, SHARED_ALG001_L12_P007_SOURCE} from "../src/timelines/shared-alg001-l12-p007";
import dat01, {SHARED_DAT001_L01_P008_GLOSSARY_TERMS} from "../src/modules/shared-dat001-l01-p008";
import {SHARED_DAT001_L01_P008_CONFIG, SHARED_DAT001_L01_P008_SOURCE} from "../src/timelines/shared-dat001-l01-p008";
import nms01, {SHARED_NMS002_L01_P006_GLOSSARY_TERMS} from "../src/modules/shared-nms002-l01-p006";
import {SHARED_NMS002_L01_P006_CONFIG, SHARED_NMS002_L01_P006_SOURCE} from "../src/timelines/shared-nms002-l01-p006";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const OUTPUT_ROOT = path.join(PROJECT_ROOT, "work/g678-shared-page-factory",
  "g678-vb02-l1-current-js-11-v1");

const candidates = [
  [alg01, SHARED_ALG001_L01_P007_CONFIG, SHARED_ALG001_L01_P007_SOURCE, SHARED_ALG001_L01_P007_GLOSSARY_TERMS],
  [alg02, SHARED_ALG001_L02_P008_CONFIG, SHARED_ALG001_L02_P008_SOURCE, SHARED_ALG001_L02_P008_GLOSSARY_TERMS],
  [alg03, SHARED_ALG001_L03_P006_CONFIG, SHARED_ALG001_L03_P006_SOURCE, SHARED_ALG001_L03_P006_GLOSSARY_TERMS],
  [alg04, SHARED_ALG001_L04_P006_CONFIG, SHARED_ALG001_L04_P006_SOURCE, SHARED_ALG001_L04_P006_GLOSSARY_TERMS],
  [alg05, SHARED_ALG001_L05_P005_CONFIG, SHARED_ALG001_L05_P005_SOURCE, SHARED_ALG001_L05_P005_GLOSSARY_TERMS],
  [alg06, SHARED_ALG001_L06_P011_CONFIG, SHARED_ALG001_L06_P011_SOURCE, SHARED_ALG001_L06_P011_GLOSSARY_TERMS],
  [alg10, SHARED_ALG001_L10_P007_CONFIG, SHARED_ALG001_L10_P007_SOURCE, SHARED_ALG001_L10_P007_GLOSSARY_TERMS],
  [alg11, SHARED_ALG001_L11_P005_CONFIG, SHARED_ALG001_L11_P005_SOURCE, SHARED_ALG001_L11_P005_GLOSSARY_TERMS],
  [alg12, SHARED_ALG001_L12_P007_CONFIG, SHARED_ALG001_L12_P007_SOURCE, SHARED_ALG001_L12_P007_GLOSSARY_TERMS],
  [dat01, SHARED_DAT001_L01_P008_CONFIG, SHARED_DAT001_L01_P008_SOURCE, SHARED_DAT001_L01_P008_GLOSSARY_TERMS],
  [nms01, SHARED_NMS002_L01_P006_CONFIG, SHARED_NMS002_L01_P006_SOURCE, SHARED_NMS002_L01_P006_GLOSSARY_TERMS],
] as const;

test("all eleven VB-2 L1 modules remain local-only candidates with exact glossary controls", () => {
  assert.equal(candidates.length, 11);
  for (const [module, config, source, terms] of candidates) {
    assert.equal(module.key, config.animationId);
    assert.equal(module.maturity, "private-current-js");
    assert.deepEqual(module.lessonHost, {
      capabilities: ["glossary"],
      legacyOperations: "blocked",
      auditStorage: "memory-only",
      storesPersonalData: false,
    });
    assert.equal(source.deploymentScope, "local-only");
    assert.equal(source.currentJavaScriptRegistered, false);
    assert.equal(source.productCalibrationPassed, false);
    assert.deepEqual(source.productBlockers,
      ["vb02-l1-browser-product-calibration-pending"]);
    assert.ok(terms.length > 0, config.animationId);
    assert.equal(new Set(terms.map((term) =>
      term.sourceCharacterId)).size, terms.length, config.animationId);
    const firstFrame = Math.min(...terms.map((term) => term.firstFrame));
    const lastFirstFrame = Math.max(...terms.map((term) => term.firstFrame));

    const before = renderToStaticMarkup(createElement(module.Renderer, {
      frame: Math.max(1, firstFrame - 1),
      frameDomain: config.mainFrameDomain,
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      uiLanguage: "es",
    }));
    if (firstFrame > 1) {
      assert.doesNotMatch(before, /data-source-action="DoHyperLinks"/u,
        config.animationId);
    }
    const visible = renderToStaticMarkup(createElement(module.Renderer, {
      frame: firstFrame,
      frameDomain: config.mainFrameDomain,
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      uiLanguage: "es",
    }));
    assert.match(visible, /data-source-action="DoHyperLinks"/u,
      config.animationId);
    assert.match(visible, /data-source-animation-stop="modeled-by-modern-host-pause"/u,
      config.animationId);
    const allVisible = renderToStaticMarkup(createElement(module.Renderer, {
      frame: lastFirstFrame,
      frameDomain: config.mainFrameDomain,
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      uiLanguage: "es",
    }));
    for (const term of terms) {
      assert.ok(allVisible.includes(`>${term.labels.es}</button>`),
        `${config.animationId}: ${term.sourceKeyAttribute}`);
    }
    assert.match(visible, /data-source-actionscript-executed="false"/u,
      config.animationId);
    assert.match(visible, /data-audio-acceptance="pending"/u,
      config.animationId);
  }
});

test("all eleven VB-2 runtimes register immutable canonical Canvas assets", async () => {
  for (const [, config] of candidates) {
    const runtime = await readFile(path.join(OUTPUT_ROOT, "members",
      config.animationId, "canvas-renderer.js"), "utf8");
    assert.doesNotMatch(runtime,
      /fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage/u,
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
    new Script(runtime, {filename: `${config.animationId}.js`})
      .runInNewContext(sandbox);
    const registry = sandbox.HELP_MATH_CANVAS_ASSETS as Record<string, {
      resolveFrameState(request: Readonly<{frame: number; scenario: string;
        lang: string; seed: number}>): Readonly<{localFrame: number;
          exportFrame: number; audioRendered: false}>;
    }>;
    const asset = registry[config.animationId];
    assert.ok(asset, `${config.animationId}: runtime did not register`);
    const property = Object.getOwnPropertyDescriptor(registry,
      config.animationId);
    assert.equal(property?.writable, false, config.animationId);
    assert.equal(property?.configurable, false, config.animationId);
    for (const frame of [1, config.mainFrameCount]) {
      const state = asset.resolveFrameState({frame,
        scenario: "source-static-frame", lang: "en", seed: 0});
      assert.equal(state.localFrame, frame, config.animationId);
      assert.equal(state.exportFrame, frame - 1, config.animationId);
      assert.equal(state.audioRendered, false, config.animationId);
    }
  }
});

