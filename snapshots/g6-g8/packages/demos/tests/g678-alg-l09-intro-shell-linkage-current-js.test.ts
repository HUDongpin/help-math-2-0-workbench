import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {Script} from "node:vm";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import p001 from "../src/modules/shared-alg001-l09-p001";
import {
  SHARED_ALG001_L09_P001_CONFIG,
  SHARED_ALG001_L09_P001_SOURCE,
} from "../src/timelines/shared-alg001-l09-p001";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const OUTPUT_ROOT = path.join(
  PROJECT_ROOT,
  "work/g678-shared-page-factory/g678-alg-l09-intro-shell-linkage-current-js-1-v1",
);

test("ALG L9 intro keeps the exact 134-frame page child and excludes shell linkages", () => {
  assert.equal(p001.key, "shared-alg001-l09-p001");
  assert.equal(p001.maturity, "private-current-js");
  assert.deepEqual(p001.lessonHost?.capabilities ?? [], []);
  assert.equal(
    SHARED_ALG001_L09_P001_SOURCE.adapterFamily,
    "alg-l09-intro-shell-linkage-source-static",
  );
  assert.equal(SHARED_ALG001_L09_P001_CONFIG.rootFrameCount, 10);
  assert.equal(SHARED_ALG001_L09_P001_CONFIG.rootBeginFrame, 6);
  assert.equal(SHARED_ALG001_L09_P001_CONFIG.mainFrameDomain, "sprite-142");
  assert.equal(SHARED_ALG001_L09_P001_CONFIG.mainFrameCount, 134);
  assert.equal(SHARED_ALG001_L09_P001_CONFIG.livePlaybackEndFrame, 134);
  const markup = renderToStaticMarkup(createElement(p001.Renderer, {
    frame: 134,
    frameDomain: "sprite-142",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    uiLanguage: "en",
  }));
  assert.match(markup, /data-candidate-status="source-static-engineering-not-strict"/u);
  assert.doesNotMatch(markup, /data-page-interaction-companion-surface/u);
  assert.doesNotMatch(markup, /data-source-character-id/u);
});

test("ALG L9 intro runtime is immutable and renders first and terminal visual frames", async () => {
  const runtime = await readFile(path.join(
    OUTPUT_ROOT,
    "members/shared-alg001-l09-p001/canvas-renderer.js",
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
  new Script(runtime, {filename: "shared-alg001-l09-p001.js"})
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
    "shared-alg001-l09-p001",
  );
  assert.equal(property?.writable, false);
  assert.equal(property?.configurable, false);
  for (const frame of [1, 134]) {
    const state = registry["shared-alg001-l09-p001"].resolveFrameState({
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
