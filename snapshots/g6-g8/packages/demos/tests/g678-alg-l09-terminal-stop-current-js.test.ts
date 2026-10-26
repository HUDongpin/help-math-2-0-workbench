import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {Script} from "node:vm";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import p003, {SHARED_ALG001_L09_P003_GLOSSARY_TERMS} from
  "../src/modules/shared-alg001-l09-p003";
import {SHARED_ALG001_L09_P003_CONFIG, SHARED_ALG001_L09_P003_SOURCE} from
  "../src/timelines/shared-alg001-l09-p003";
import p006, {SHARED_ALG001_L09_P006_GLOSSARY_TERMS} from
  "../src/modules/shared-alg001-l09-p006";
import {SHARED_ALG001_L09_P006_CONFIG, SHARED_ALG001_L09_P006_SOURCE} from
  "../src/timelines/shared-alg001-l09-p006";
import p007, {SHARED_ALG001_L09_P007_GLOSSARY_TERMS} from
  "../src/modules/shared-alg001-l09-p007";
import {SHARED_ALG001_L09_P007_CONFIG, SHARED_ALG001_L09_P007_SOURCE} from
  "../src/timelines/shared-alg001-l09-p007";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const OUTPUT_ROOT = path.join(
  PROJECT_ROOT,
  "work/g678-shared-page-factory/g678-alg-l09-terminal-stop-current-js-3-v1",
);

const candidates = [
  [p003, SHARED_ALG001_L09_P003_CONFIG, SHARED_ALG001_L09_P003_SOURCE,
    SHARED_ALG001_L09_P003_GLOSSARY_TERMS],
  [p006, SHARED_ALG001_L09_P006_CONFIG, SHARED_ALG001_L09_P006_SOURCE,
    SHARED_ALG001_L09_P006_GLOSSARY_TERMS],
  [p007, SHARED_ALG001_L09_P007_CONFIG, SHARED_ALG001_L09_P007_SOURCE,
    SHARED_ALG001_L09_P007_GLOSSARY_TERMS],
] as const;

test("ALG L9 terminal-stop family preserves exact endpoints and optional glossary controls", () => {
  assert.equal(candidates.length, 3);
  assert.deepEqual(candidates.map(([, config]) => config.mainFrameCount),
    [1053, 721, 485]);
  assert.deepEqual(candidates.map(([, , , terms]) => terms.length), [0, 0, 2]);
  for (const [module, config, source, terms] of candidates) {
    assert.equal(module.key, config.animationId);
    assert.equal(module.maturity, "private-current-js");
    assert.deepEqual(module.lessonHost?.capabilities,
      terms.length > 0 ? ["glossary"] : []);
    assert.equal(source.adapterFamily, "alg-l09-terminal-stop-source-static");
    assert.equal(source.currentJavaScriptRegistered, false);
    assert.equal(source.productCalibrationPassed, false);
    assert.equal(config.livePlaybackEndFrame, config.mainFrameCount);
    const markup = renderToStaticMarkup(createElement(module.Renderer, {
      frame: config.mainFrameCount,
      frameDomain: config.mainFrameDomain,
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      uiLanguage: "es",
    }));
    assert.match(markup, /data-source-actionscript-executed="false"/u);
    assert.match(markup, /data-audio-acceptance="pending"/u);
    assert.equal(markup.match(/data-source-character-id=/gu)?.length ?? 0,
      terms.length);
    if (terms.length > 0) {
      assert.match(markup, /data-source-action="DoHyperLinks"/u);
      assert.match(markup,
        /data-source-animation-stop="modeled-by-modern-host-pause"/u);
    }
  }
});

test("ALG L9 terminal-stop runtimes stay immutable and render first and terminal frames", async () => {
  for (const [, config] of candidates) {
    const runtime = await readFile(path.join(
      OUTPUT_ROOT, "members", config.animationId, "canvas-renderer.js",
    ), "utf8");
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
      resolveFrameState(request: Readonly<{
        frame: number;
        scenario: string;
        lang: string;
        seed: number;
      }>): Readonly<{localFrame: number; exportFrame: number; audioRendered: false}>;
    }>;
    const asset = registry[config.animationId];
    assert.ok(asset, config.animationId);
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
