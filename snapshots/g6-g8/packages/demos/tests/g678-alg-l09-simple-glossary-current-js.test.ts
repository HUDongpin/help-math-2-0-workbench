import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {Script} from "node:vm";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import p005, {SHARED_ALG001_L09_P005_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l09-p005";
import {SHARED_ALG001_L09_P005_CONFIG, SHARED_ALG001_L09_P005_SOURCE} from "../src/timelines/shared-alg001-l09-p005";
import p010, {SHARED_ALG001_L09_P010_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l09-p010";
import {SHARED_ALG001_L09_P010_CONFIG, SHARED_ALG001_L09_P010_SOURCE} from "../src/timelines/shared-alg001-l09-p010";
import p011, {SHARED_ALG001_L09_P011_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l09-p011";
import {SHARED_ALG001_L09_P011_CONFIG, SHARED_ALG001_L09_P011_SOURCE} from "../src/timelines/shared-alg001-l09-p011";
import p013, {SHARED_ALG001_L09_P013_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l09-p013";
import {SHARED_ALG001_L09_P013_CONFIG, SHARED_ALG001_L09_P013_SOURCE} from "../src/timelines/shared-alg001-l09-p013";
import p015, {SHARED_ALG001_L09_P015_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l09-p015";
import {SHARED_ALG001_L09_P015_CONFIG, SHARED_ALG001_L09_P015_SOURCE} from "../src/timelines/shared-alg001-l09-p015";
import p017, {SHARED_ALG001_L09_P017_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l09-p017";
import {SHARED_ALG001_L09_P017_CONFIG, SHARED_ALG001_L09_P017_SOURCE} from "../src/timelines/shared-alg001-l09-p017";
import p019, {SHARED_ALG001_L09_P019_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l09-p019";
import {SHARED_ALG001_L09_P019_CONFIG, SHARED_ALG001_L09_P019_SOURCE} from "../src/timelines/shared-alg001-l09-p019";
import p021, {SHARED_ALG001_L09_P021_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l09-p021";
import {SHARED_ALG001_L09_P021_CONFIG, SHARED_ALG001_L09_P021_SOURCE} from "../src/timelines/shared-alg001-l09-p021";
import p023, {SHARED_ALG001_L09_P023_GLOSSARY_TERMS} from "../src/modules/shared-alg001-l09-p023";
import {SHARED_ALG001_L09_P023_CONFIG, SHARED_ALG001_L09_P023_SOURCE} from "../src/timelines/shared-alg001-l09-p023";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const OUTPUT_ROOT = path.join(
  PROJECT_ROOT,
  "work/g678-shared-page-factory/g678-alg-l09-simple-glossary-current-js-9-v1",
);

const candidates = [
  [p005, SHARED_ALG001_L09_P005_CONFIG, SHARED_ALG001_L09_P005_SOURCE, SHARED_ALG001_L09_P005_GLOSSARY_TERMS],
  [p010, SHARED_ALG001_L09_P010_CONFIG, SHARED_ALG001_L09_P010_SOURCE, SHARED_ALG001_L09_P010_GLOSSARY_TERMS],
  [p011, SHARED_ALG001_L09_P011_CONFIG, SHARED_ALG001_L09_P011_SOURCE, SHARED_ALG001_L09_P011_GLOSSARY_TERMS],
  [p013, SHARED_ALG001_L09_P013_CONFIG, SHARED_ALG001_L09_P013_SOURCE, SHARED_ALG001_L09_P013_GLOSSARY_TERMS],
  [p015, SHARED_ALG001_L09_P015_CONFIG, SHARED_ALG001_L09_P015_SOURCE, SHARED_ALG001_L09_P015_GLOSSARY_TERMS],
  [p017, SHARED_ALG001_L09_P017_CONFIG, SHARED_ALG001_L09_P017_SOURCE, SHARED_ALG001_L09_P017_GLOSSARY_TERMS],
  [p019, SHARED_ALG001_L09_P019_CONFIG, SHARED_ALG001_L09_P019_SOURCE, SHARED_ALG001_L09_P019_GLOSSARY_TERMS],
  [p021, SHARED_ALG001_L09_P021_CONFIG, SHARED_ALG001_L09_P021_SOURCE, SHARED_ALG001_L09_P021_GLOSSARY_TERMS],
  [p023, SHARED_ALG001_L09_P023_CONFIG, SHARED_ALG001_L09_P023_SOURCE, SHARED_ALG001_L09_P023_GLOSSARY_TERMS],
] as const;

test("ALG L9 nine-page closure tranche preserves exact local glossary controls", () => {
  assert.equal(candidates.length, 9);
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
    assert.deepEqual(source.productBlockers, [
      "alg-l09-simple-glossary-browser-product-calibration-pending",
    ]);
    assert.ok(terms.length > 0, config.animationId);
    assert.equal(new Set(terms.map((term) => term.id)).size, terms.length);
    assert.equal(
      new Set(terms.map((term) => term.sourceCharacterId)).size,
      terms.length,
    );
    const inspectionFrame = Math.max(...terms.map((term) => term.firstFrame));
    const markup = renderToStaticMarkup(createElement(module.Renderer, {
      frame: inspectionFrame,
      frameDomain: config.mainFrameDomain,
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      uiLanguage: "es",
    }));
    assert.equal(
      markup.match(/data-source-character-id=/gu)?.length,
      terms.length,
      config.animationId,
    );
    assert.match(markup, /data-source-action="DoHyperLinks"/u);
    assert.match(
      markup,
      /data-source-animation-stop="modeled-by-modern-host-pause"/u,
    );
    assert.match(markup, /data-source-actionscript-executed="false"/u);
    assert.match(markup, /data-audio-acceptance="pending"/u);
  }
});

test("ALG L9 nine-page closure runtimes register immutable Canvas assets", async () => {
  for (const [, config] of candidates) {
    const runtime = await readFile(
      path.join(OUTPUT_ROOT, "members", config.animationId, "canvas-renderer.js"),
      "utf8",
    );
    assert.doesNotMatch(
      runtime,
      /fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage/u,
      config.animationId,
    );
    const sandbox = {
      document: {
        createElement(tagName: string) {
          if (tagName === "canvas") {
            return {getContext: () => ({}), width: 0, height: 0};
          }
          if (tagName === "img") {
            return {
              complete: true,
              naturalWidth: 1,
              naturalHeight: 1,
              decode: async () => undefined,
            };
          }
          throw new Error(`unexpected runtime element: ${tagName}`);
        },
      },
    } as Record<string, unknown>;
    new Script(runtime, {filename: `${config.animationId}.js`})
      .runInNewContext(sandbox);
    const registry = sandbox.HELP_MATH_CANVAS_ASSETS as Record<string, {
      resolveFrameState(request: Readonly<{
        frame: number;
        scenario: string;
        lang: string;
        seed: number;
      }>): Readonly<{localFrame: number; exportFrame: number; audioRendered: false}>;
    }>;
    const asset = registry[config.animationId];
    assert.ok(asset, config.animationId);
    const property = Object.getOwnPropertyDescriptor(registry, config.animationId);
    assert.equal(property?.writable, false, config.animationId);
    assert.equal(property?.configurable, false, config.animationId);
    for (const frame of [1, config.mainFrameCount]) {
      const state = asset.resolveFrameState({
        frame,
        scenario: "source-static-frame",
        lang: "en",
        seed: 0,
      });
      assert.equal(state.localFrame, frame, config.animationId);
      assert.equal(state.exportFrame, frame - 1, config.animationId);
      assert.equal(state.audioRendered, false, config.animationId);
    }
  }
});
