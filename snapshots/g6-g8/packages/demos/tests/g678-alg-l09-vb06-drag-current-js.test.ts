import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {Script} from "node:vm";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import p012, {SHARED_ALG001_L09_P012_GLOSSARY_TERMS} from
  "../src/modules/shared-alg001-l09-p012";
import {
  SHARED_ALG001_L09_P012_CONFIG,
  SHARED_ALG001_L09_P012_SOURCE,
} from "../src/timelines/shared-alg001-l09-p012";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const OUTPUT_ROOT = path.join(
  PROJECT_ROOT,
  "work/g678-shared-page-factory/g678-alg-l09-vb06-drag-current-js-1-v1",
);

test("ALG L9 VB06 binds the authored frame-129 grouped-drag stop", () => {
  assert.equal(p012.key, "shared-alg001-l09-p012");
  assert.equal(p012.maturity, "private-current-js");
  assert.deepEqual(p012.lessonHost?.capabilities, ["glossary"]);
  assert.equal(
    SHARED_ALG001_L09_P012_SOURCE.adapterFamily,
    "alg-l09-vb06-drag-source-static",
  );
  assert.equal(SHARED_ALG001_L09_P012_SOURCE.currentJavaScriptRegistered, false);
  assert.equal(SHARED_ALG001_L09_P012_SOURCE.productCalibrationPassed, false);
  assert.equal(SHARED_ALG001_L09_P012_CONFIG.mainFrameDomain, "sprite-78");
  assert.equal(SHARED_ALG001_L09_P012_CONFIG.mainFrameCount, 188);
  assert.equal(SHARED_ALG001_L09_P012_CONFIG.livePlaybackEndFrame, 188);
  assert.deepEqual(p012.interactiveStops, [{
    id: "shared-alg001-l09-p012-drag-set",
    frameDomain: "sprite-78",
    stopFrame: 129,
    resumeFrame: 130,
    resolution: "explicit-source-drag-set-finished",
    completionDisposition: "blocked-while-unresolved",
    requiresHostInteractiveStop: true,
    strictAcceptanceEffect: "none",
  }]);
  assert.deepEqual(
    SHARED_ALG001_L09_P012_GLOSSARY_TERMS.map((term) => [
      term.sourceCharacterId,
      term.firstFrame,
      term.sourceKeyAttribute,
    ]),
    [
      [12, 1, "Proportional relationship"],
      [13, 1, "Non-proportional relationship"],
      [8, 1, "Quantity"],
    ],
  );
});

test("ALG L9 VB06 exposes pointer and keyboard controls without accepting audio", () => {
  const markup = renderToStaticMarkup(createElement(p012.Renderer, {
    frame: 129,
    frameDomain: "sprite-78",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    uiLanguage: "en",
  }));
  assert.match(markup,
    /data-advanced-manual-kind="four-source-grouped-drag-drop"/u);
  assert.match(markup, /data-audio-accepted="false"/u);
  assert.match(markup, /data-source-stop-frame="129"/u);
  assert.equal(markup.match(/data-source-id=/gu)?.length, 4);
  assert.equal(markup.match(/data-target-id=/gu)?.length, 4);
  assert.equal(markup.match(/data-source-character-id=/gu)?.length, 3);
  assert.match(markup, /Proportional slot 1/u);
  assert.match(markup, /Non-proportional slot 2/u);
  assert.match(markup, /Random feedback audio[^<]*remain false/u);
});

test("ALG L9 VB06 runtime is immutable and covers start, stop, and endpoint", async () => {
  const runtime = await readFile(path.join(
    OUTPUT_ROOT,
    "members/shared-alg001-l09-p012/canvas-renderer.js",
  ), "utf8");
  assert.doesNotMatch(runtime,
    /fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage/u);
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
  new Script(runtime, {filename: "shared-alg001-l09-p012.js"})
    .runInNewContext(sandbox);
  const registry = sandbox.HELP_MATH_CANVAS_ASSETS as Record<string, {
    resolveFrameState(request: Readonly<{
      frame: number;
      scenario: string;
      lang: string;
      seed: number;
    }>): Readonly<{localFrame: number; exportFrame: number; audioRendered: false}>;
  }>;
  const property = Object.getOwnPropertyDescriptor(
    registry,
    "shared-alg001-l09-p012",
  );
  assert.equal(property?.writable, false);
  assert.equal(property?.configurable, false);
  for (const frame of [1, 129, 188]) {
    const state = registry["shared-alg001-l09-p012"].resolveFrameState({
      frame,
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
    });
    assert.equal(state.localFrame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.equal(state.audioRendered, false);
  }
});
