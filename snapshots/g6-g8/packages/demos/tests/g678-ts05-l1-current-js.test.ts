import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {Script} from "node:vm";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import alg01, {SHARED_ALG001_L01_P050_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l01-p050";
import {SHARED_ALG001_L01_P050_CONFIG, SHARED_ALG001_L01_P050_SOURCE} from "../src/timelines/shared-alg001-l01-p050";
import alg02, {SHARED_ALG001_L02_P052_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l02-p052";
import {SHARED_ALG001_L02_P052_CONFIG, SHARED_ALG001_L02_P052_SOURCE} from "../src/timelines/shared-alg001-l02-p052";
import alg03, {SHARED_ALG001_L03_P050_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l03-p050";
import {SHARED_ALG001_L03_P050_CONFIG, SHARED_ALG001_L03_P050_SOURCE} from "../src/timelines/shared-alg001-l03-p050";
import alg04, {SHARED_ALG001_L04_P047_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l04-p047";
import {SHARED_ALG001_L04_P047_CONFIG, SHARED_ALG001_L04_P047_SOURCE} from "../src/timelines/shared-alg001-l04-p047";
import alg05, {SHARED_ALG001_L05_P057_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l05-p057";
import {SHARED_ALG001_L05_P057_CONFIG, SHARED_ALG001_L05_P057_SOURCE} from "../src/timelines/shared-alg001-l05-p057";
import alg06, {SHARED_ALG001_L06_P054_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l06-p054";
import {SHARED_ALG001_L06_P054_CONFIG, SHARED_ALG001_L06_P054_SOURCE} from "../src/timelines/shared-alg001-l06-p054";
import alg07, {SHARED_ALG001_L07_P056_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l07-p056";
import {SHARED_ALG001_L07_P056_CONFIG, SHARED_ALG001_L07_P056_SOURCE} from "../src/timelines/shared-alg001-l07-p056";
import alg08, {SHARED_ALG001_L08_P044_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l08-p044";
import {SHARED_ALG001_L08_P044_CONFIG, SHARED_ALG001_L08_P044_SOURCE} from "../src/timelines/shared-alg001-l08-p044";
import alg09, {SHARED_ALG001_L09_P035_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l09-p035";
import {SHARED_ALG001_L09_P035_CONFIG, SHARED_ALG001_L09_P035_SOURCE} from "../src/timelines/shared-alg001-l09-p035";
import alg10, {SHARED_ALG001_L10_P046_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l10-p046";
import {SHARED_ALG001_L10_P046_CONFIG, SHARED_ALG001_L10_P046_SOURCE} from "../src/timelines/shared-alg001-l10-p046";
import alg11, {SHARED_ALG001_L11_P038_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l11-p038";
import {SHARED_ALG001_L11_P038_CONFIG, SHARED_ALG001_L11_P038_SOURCE} from "../src/timelines/shared-alg001-l11-p038";
import alg12, {SHARED_ALG001_L12_P046_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l12-p046";
import {SHARED_ALG001_L12_P046_CONFIG, SHARED_ALG001_L12_P046_SOURCE} from "../src/timelines/shared-alg001-l12-p046";
import dat01, {SHARED_DAT001_L01_P050_GLOSSARY_TERMS} from "../src/modules/shared-dat001-l01-p050";
import {SHARED_DAT001_L01_P050_CONFIG, SHARED_DAT001_L01_P050_SOURCE} from "../src/timelines/shared-dat001-l01-p050";
import geo01, {SHARED_GEO001_L01_P053_GLOSSARY_TERMS} from "../src/modules/shared-geo001-l01-p053";
import {SHARED_GEO001_L01_P053_CONFIG, SHARED_GEO001_L01_P053_SOURCE} from "../src/timelines/shared-geo001-l01-p053";
import nms01, {SHARED_NMS002_L01_P041_GLOSSARY_TERMS} from "../src/modules/shared-nms002-l01-p041";
import {SHARED_NMS002_L01_P041_CONFIG, SHARED_NMS002_L01_P041_SOURCE} from "../src/timelines/shared-nms002-l01-p041";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const OUTPUT_ROOT = path.join(PROJECT_ROOT, "work/g678-shared-page-factory",
  "g678-ts05-l1-current-js-15-v1");

const candidates = [
  [alg01, SHARED_ALG001_L01_P050_CONFIG, SHARED_ALG001_L01_P050_SOURCE, SHARED_ALG001_L01_P050_GLOSSARY_TERMS],
  [alg02, SHARED_ALG001_L02_P052_CONFIG, SHARED_ALG001_L02_P052_SOURCE, SHARED_ALG001_L02_P052_GLOSSARY_TERMS],
  [alg03, SHARED_ALG001_L03_P050_CONFIG, SHARED_ALG001_L03_P050_SOURCE, SHARED_ALG001_L03_P050_GLOSSARY_TERMS],
  [alg04, SHARED_ALG001_L04_P047_CONFIG, SHARED_ALG001_L04_P047_SOURCE, SHARED_ALG001_L04_P047_GLOSSARY_TERMS],
  [alg05, SHARED_ALG001_L05_P057_CONFIG, SHARED_ALG001_L05_P057_SOURCE, SHARED_ALG001_L05_P057_GLOSSARY_TERMS],
  [alg06, SHARED_ALG001_L06_P054_CONFIG, SHARED_ALG001_L06_P054_SOURCE, SHARED_ALG001_L06_P054_GLOSSARY_TERMS],
  [alg07, SHARED_ALG001_L07_P056_CONFIG, SHARED_ALG001_L07_P056_SOURCE, SHARED_ALG001_L07_P056_GLOSSARY_TERMS],
  [alg08, SHARED_ALG001_L08_P044_CONFIG, SHARED_ALG001_L08_P044_SOURCE, SHARED_ALG001_L08_P044_GLOSSARY_TERMS],
  [alg09, SHARED_ALG001_L09_P035_CONFIG, SHARED_ALG001_L09_P035_SOURCE, SHARED_ALG001_L09_P035_GLOSSARY_TERMS],
  [alg10, SHARED_ALG001_L10_P046_CONFIG, SHARED_ALG001_L10_P046_SOURCE, SHARED_ALG001_L10_P046_GLOSSARY_TERMS],
  [alg11, SHARED_ALG001_L11_P038_CONFIG, SHARED_ALG001_L11_P038_SOURCE, SHARED_ALG001_L11_P038_GLOSSARY_TERMS],
  [alg12, SHARED_ALG001_L12_P046_CONFIG, SHARED_ALG001_L12_P046_SOURCE, SHARED_ALG001_L12_P046_GLOSSARY_TERMS],
  [dat01, SHARED_DAT001_L01_P050_CONFIG, SHARED_DAT001_L01_P050_SOURCE, SHARED_DAT001_L01_P050_GLOSSARY_TERMS],
  [geo01, SHARED_GEO001_L01_P053_CONFIG, SHARED_GEO001_L01_P053_SOURCE, SHARED_GEO001_L01_P053_GLOSSARY_TERMS],
  [nms01, SHARED_NMS002_L01_P041_CONFIG, SHARED_NMS002_L01_P041_SOURCE, SHARED_NMS002_L01_P041_GLOSSARY_TERMS],
] as const;

test("all fifteen TS05 L1 modules remain local-only candidates with exact glossary controls", () => {
  assert.equal(candidates.length, 15);
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
      ["ts05-l1-browser-product-calibration-pending"]);
    assert.ok(terms.length === 5 || terms.length === 6,
      config.animationId);
    assert.equal(new Set(terms.map((term) => term.id)).size, terms.length,
      config.animationId);
    const termIds = new Set<string>(terms.map((term) => term.id));
    for (const id of ["strategies", "equation", "pattern", "table",
      "simple-simpler-simplest"]) {
      assert.equal(termIds.has(id), true, `${config.animationId}:${id}`);
    }

    const before = renderToStaticMarkup(createElement(module.Renderer, {
      frame: Math.max(1, terms[0].firstFrame - 1),
      frameDomain: config.mainFrameDomain,
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      uiLanguage: "es",
    }));
    if (terms[0].firstFrame > 1) {
      assert.doesNotMatch(before, /data-source-action="DoHyperLinks"/u,
        config.animationId);
    }
    const visible = renderToStaticMarkup(createElement(module.Renderer, {
      frame: terms[0].firstFrame,
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
    assert.ok(visible.includes(`>${terms[0].labels.es}</button>`),
      config.animationId);
    const allVisible = renderToStaticMarkup(createElement(module.Renderer, {
      frame: Math.max(...terms.map((term) => term.firstFrame)),
      frameDomain: config.mainFrameDomain,
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      uiLanguage: "es",
    }));
    for (const term of terms) {
      assert.ok(allVisible.includes(`>${term.labels.es}</button>`),
        `${config.animationId}:${term.id}`);
    }
    assert.match(visible, /data-source-actionscript-executed="false"/u,
      config.animationId);
    assert.match(visible, /data-audio-acceptance="pending"/u,
      config.animationId);
  }
});

test("all fifteen TS05 runtimes register immutable canonical Canvas assets", async () => {
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
