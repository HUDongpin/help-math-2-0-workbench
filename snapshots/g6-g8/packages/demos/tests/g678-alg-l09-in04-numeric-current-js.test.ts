import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {Script} from "node:vm";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import p016, {SHARED_ALG001_L09_P016_GLOSSARY_TERMS} from
  "../src/modules/shared-alg001-l09-p016";
import {
  SHARED_ALG001_L09_P016_CONFIG,
  SHARED_ALG001_L09_P016_SOURCE,
} from "../src/timelines/shared-alg001-l09-p016";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const OUTPUT_ROOT = path.join(PROJECT_ROOT,
  "work/g678-shared-page-factory/g678-alg-l09-in04-numeric-current-js-1-v1");

test("ALG L9 IN04 binds the authored frame-270 numeric stop", () => {
  assert.equal(p016.key, "shared-alg001-l09-p016");
  assert.equal(p016.maturity, "private-current-js");
  assert.deepEqual(p016.lessonHost?.capabilities,
    ["glossary", "practice-feedback"]);
  assert.equal(SHARED_ALG001_L09_P016_SOURCE.adapterFamily,
    "alg-l09-in04-numeric-source-static");
  assert.equal(SHARED_ALG001_L09_P016_SOURCE.currentJavaScriptRegistered, false);
  assert.equal(SHARED_ALG001_L09_P016_CONFIG.mainFrameDomain, "sprite-81");
  assert.equal(SHARED_ALG001_L09_P016_CONFIG.mainFrameCount, 420);
  assert.deepEqual(p016.interactiveStops, [{
    id: "shared-alg001-l09-p016-numeric-response",
    frameDomain: "sprite-81",
    stopFrame: 270,
    resumeFrame: 271,
    resolution: "explicit-source-feedback-finished",
    completionDisposition: "blocked-while-unresolved",
    requiresHostInteractiveStop: true,
    strictAcceptanceEffect: "none",
  }]);
  assert.deepEqual(SHARED_ALG001_L09_P016_GLOSSARY_TERMS.map((term) => [
    term.sourceCharacterId, term.firstFrame, term.sourceKeyAttribute,
  ]), [[21, 1, "Fiction"], [22, 1, "Nonfiction"], [25, 93, "Ratio"]]);
});

test("ALG L9 IN04 exposes accessible digit inputs and fail-closed host feedback", () => {
  const markup = renderToStaticMarkup(createElement(p016.Renderer, {
    frame: 270,
    frameDomain: "sprite-81",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    uiLanguage: "en",
  }));
  assert.match(markup, /data-complexity-lane="interactive-understood"/u);
  assert.match(markup, /data-audio-acceptance="pending"/u);
  assert.match(markup, /data-source-stop-frame="270"/u);
  assert.match(markup, /aria-label="Nonfiction"/u);
  assert.match(markup, /aria-label="Fiction"/u);
  assert.match(markup, /data-source-button-character-id="44"/u);
  assert.equal(markup.match(/data-source-key-attribute=/gu)?.length, 3);
});

test("ALG L9 IN04 runtime is immutable and covers start, stop, and endpoint", async () => {
  const runtime = await readFile(path.join(OUTPUT_ROOT,
    "members/shared-alg001-l09-p016/canvas-renderer.js"), "utf8");
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
  new Script(runtime, {filename: "shared-alg001-l09-p016.js"})
    .runInNewContext(sandbox);
  const registry = sandbox.HELP_MATH_CANVAS_ASSETS as Record<string, {
    resolveFrameState(request: Readonly<{
      frame: number;
      scenario: string;
      lang: string;
      seed: number;
    }>): Readonly<{localFrame: number; exportFrame: number; audioRendered: false}>;
  }>;
  const property = Object.getOwnPropertyDescriptor(registry,
    "shared-alg001-l09-p016");
  assert.equal(property?.writable, false);
  assert.equal(property?.configurable, false);
  for (const frame of [1, 270, 420]) {
    const state = registry["shared-alg001-l09-p016"].resolveFrameState({
      frame, scenario: "source-static-frame", lang: "en", seed: 0,
    });
    assert.equal(state.localFrame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.equal(state.audioRendered, false);
  }
});
