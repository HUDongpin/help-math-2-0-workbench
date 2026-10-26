import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {Script} from "node:vm";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import p008, {SHARED_ALG001_L09_P008_GLOSSARY_TERMS} from
  "../src/modules/shared-alg001-l09-p008";
import {
  SHARED_ALG001_L09_P008_CONFIG,
  SHARED_ALG001_L09_P008_SOURCE,
} from "../src/timelines/shared-alg001-l09-p008";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const OUTPUT_ROOT = path.join(PROJECT_ROOT,
  "work/g678-shared-page-factory/g678-alg-l09-vb02-glossary-current-js-1-v1");

test("ALG L9 VB02 binds the exact 505-frame visual and three glossary controls", () => {
  assert.equal(p008.key, "shared-alg001-l09-p008");
  assert.equal(p008.maturity, "private-current-js");
  assert.deepEqual(p008.lessonHost?.capabilities, ["glossary"]);
  assert.equal(SHARED_ALG001_L09_P008_SOURCE.adapterFamily,
    "alg-l09-vb02-glossary-source-static");
  assert.equal(SHARED_ALG001_L09_P008_CONFIG.mainFrameDomain, "sprite-187");
  assert.equal(SHARED_ALG001_L09_P008_CONFIG.mainFrameCount, 505);
  assert.equal(SHARED_ALG001_L09_P008_CONFIG.livePlaybackEndFrame, 505);
  assert.deepEqual(SHARED_ALG001_L09_P008_GLOSSARY_TERMS.map((term) => [
    term.sourceCharacterId, term.firstFrame, term.sourceKeyAttribute,
  ]), [[12, 2, "Ratio"], [13, 2, "Comparison"], [14, 2, "Quantity"]]);
  assert.equal(SHARED_ALG001_L09_P008_SOURCE.productBlockers.includes(
    "dormant-child-random-feedback-audio-runtime-and-listening-acceptance-pending"),
  true);
  const markup = renderToStaticMarkup(createElement(p008.Renderer, {
    frame: 2, frameDomain: "sprite-187", scenario: "source-static-frame",
    lang: "en", seed: 0, uiLanguage: "es",
  }));
  assert.match(markup, /data-source-actionscript-executed="false"/u);
  assert.match(markup, /data-audio-acceptance="pending"/u);
  assert.equal(markup.match(/data-source-character-id=/gu)?.length, 3);
});

test("ALG L9 VB02 runtime is immutable and renders first and final frames", async () => {
  const runtime = await readFile(path.join(OUTPUT_ROOT,
    "members/shared-alg001-l09-p008/canvas-renderer.js"), "utf8");
  assert.doesNotMatch(runtime,
    /fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage/u);
  const sandbox = {document: {createElement(tagName: string) {
    if (tagName === "canvas") return {getContext: () => ({}), width: 0,
      height: 0};
    if (tagName === "img") return {complete: true, naturalWidth: 1,
      naturalHeight: 1, decode: async () => undefined};
    throw new Error(`unexpected runtime element: ${tagName}`);
  }}} as Record<string, unknown>;
  new Script(runtime, {filename: "shared-alg001-l09-p008.js"})
    .runInNewContext(sandbox);
  const registry = sandbox.HELP_MATH_CANVAS_ASSETS as Record<string, {
    resolveFrameState(request: Readonly<{frame: number; scenario: string;
      lang: string; seed: number}>): Readonly<{localFrame: number;
        exportFrame: number; audioRendered: false}>;
  }>;
  const property = Object.getOwnPropertyDescriptor(registry,
    "shared-alg001-l09-p008");
  assert.equal(property?.writable, false);
  assert.equal(property?.configurable, false);
  for (const frame of [1, 2, 505]) {
    const state = registry["shared-alg001-l09-p008"].resolveFrameState({
      frame, scenario: "source-static-frame", lang: "en", seed: 0,
    });
    assert.equal(state.localFrame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.equal(state.audioRendered, false);
  }
});
