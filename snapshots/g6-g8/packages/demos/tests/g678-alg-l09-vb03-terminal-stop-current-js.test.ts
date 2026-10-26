import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {Script} from "node:vm";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import p009, {SHARED_ALG001_L09_P009_GLOSSARY_TERMS} from
  "../src/modules/shared-alg001-l09-p009";
import {SHARED_ALG001_L09_P009_CONFIG, SHARED_ALG001_L09_P009_SOURCE} from
  "../src/timelines/shared-alg001-l09-p009";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const OUTPUT_ROOT = path.join(
  PROJECT_ROOT,
  "work/g678-shared-page-factory/g678-alg-l09-vb03-terminal-stop-current-js-1-v1",
);

test("ALG L9 VB03 binds the exact endpoint and four source glossary controls", () => {
  assert.equal(p009.key, "shared-alg001-l09-p009");
  assert.equal(p009.maturity, "private-current-js");
  assert.deepEqual(p009.lessonHost?.capabilities, ["glossary"]);
  assert.equal(
    SHARED_ALG001_L09_P009_SOURCE.adapterFamily,
    "alg-l09-vb03-terminal-stop-source-static",
  );
  assert.equal(SHARED_ALG001_L09_P009_SOURCE.currentJavaScriptRegistered, false);
  assert.equal(SHARED_ALG001_L09_P009_SOURCE.productCalibrationPassed, false);
  assert.equal(SHARED_ALG001_L09_P009_CONFIG.mainFrameCount, 207);
  assert.equal(SHARED_ALG001_L09_P009_CONFIG.livePlaybackEndFrame, 207);
  assert.deepEqual(
    SHARED_ALG001_L09_P009_GLOSSARY_TERMS.map((term) => [
      term.sourceCharacterId,
      term.firstFrame,
      term.sourceKeyAttribute,
    ]),
    [
      [8, 2, "Proportion"],
      [9, 2, "Equation"],
      [10, 2, "Equivalent"],
      [11, 2, "Ratio"],
    ],
  );
  const markup = renderToStaticMarkup(createElement(p009.Renderer, {
    frame: 207,
    frameDomain: "sprite-25",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    uiLanguage: "es",
  }));
  assert.match(markup, /data-source-actionscript-executed="false"/u);
  assert.match(markup, /data-audio-acceptance="pending"/u);
  assert.match(markup, /data-source-action="DoHyperLinks"/u);
  assert.match(markup,
    /data-source-animation-stop="modeled-by-modern-host-pause"/u);
  assert.equal(markup.match(/data-source-character-id=/gu)?.length, 4);
});

test("ALG L9 VB03 runtime is immutable and renders first and terminal frames", async () => {
  const runtime = await readFile(path.join(
    OUTPUT_ROOT,
    "members/shared-alg001-l09-p009/canvas-renderer.js",
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
  new Script(runtime, {filename: "shared-alg001-l09-p009.js"})
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
    "shared-alg001-l09-p009",
  );
  assert.equal(property?.writable, false);
  assert.equal(property?.configurable, false);
  for (const frame of [1, 207]) {
    const state = registry["shared-alg001-l09-p009"].resolveFrameState({
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
