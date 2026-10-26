import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {Script} from "node:vm";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import p018, {SHARED_ALG001_L09_P018_GLOSSARY_TERMS} from
  "../src/modules/shared-alg001-l09-p018";
import {
  SHARED_ALG001_L09_P018_CONFIG,
  SHARED_ALG001_L09_P018_SOURCE,
} from "../src/timelines/shared-alg001-l09-p018";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const OUTPUT_ROOT = path.join(PROJECT_ROOT,
  "work/g678-shared-page-factory/g678-alg-l09-in06-choice-current-js-1-v1");

test("ALG L9 IN06 binds the authored frame-188 four-choice stop", () => {
  assert.equal(p018.key, "shared-alg001-l09-p018");
  assert.equal(p018.maturity, "private-current-js");
  assert.deepEqual(p018.lessonHost?.capabilities,
    ["glossary", "practice-feedback"]);
  assert.equal(SHARED_ALG001_L09_P018_SOURCE.adapterFamily,
    "alg-l09-in06-choice-source-static");
  assert.equal(SHARED_ALG001_L09_P018_SOURCE.currentJavaScriptRegistered, false);
  assert.equal(SHARED_ALG001_L09_P018_CONFIG.mainFrameDomain, "sprite-189");
  assert.equal(SHARED_ALG001_L09_P018_CONFIG.mainFrameCount, 667);
  assert.deepEqual(p018.interactiveStops, [{
    id: "shared-alg001-l09-p018-choice-quiz",
    frameDomain: "sprite-189",
    stopFrame: 188,
    resumeFrame: 189,
    resolution: "explicit-source-feedback-finished",
    completionDisposition: "blocked-while-unresolved",
    requiresHostInteractiveStop: true,
    strictAcceptanceEffect: "none",
  }]);
  assert.deepEqual(SHARED_ALG001_L09_P018_GLOSSARY_TERMS.map((term) => [
    term.sourceCharacterId, term.firstFrame, term.sourceKeyAttribute,
  ]), [[9, 75, "Ratio"], [12, 155, "Simplest form"],
    [13, 155, "Simplify"]]);
});

test("ALG L9 IN06 exposes four accessible choices and source glossary", () => {
  const markup = renderToStaticMarkup(createElement(p018.Renderer, {
    frame: 188,
    frameDomain: "sprite-189",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    uiLanguage: "en",
  }));
  assert.match(markup, /data-complexity-lane="interactive-understood"/u);
  assert.match(markup, /data-audio-acceptance="pending"/u);
  assert.match(markup, /data-source-stop-frame="188"/u);
  assert.match(markup, /64 seventh graders and 96 eighth graders/u);
  assert.match(markup, /B\. 2:3/u);
  assert.equal(markup.match(/data-choice-id=/gu)?.length, 4);
  assert.equal(markup.match(/data-source-key-attribute=/gu)?.length, 3);
});

test("ALG L9 IN06 binds answer instances to source text at frame 188", async () => {
  const manifest = JSON.parse(await readFile(path.join(OUTPUT_ROOT,
    "members/shared-alg001-l09-p018/member-manifest.json"), "utf8"));
  const binding = manifest.reviewedAuthority.sourceChoicePlacementBinding;
  assert.equal(binding.source, "swfmill-source-xml");
  assert.equal(binding.frameDomain, "sprite-189");
  assert.equal(binding.textPlacedFrame, 181);
  assert.equal(binding.answerButtonsPlacedFrame, 188);
  assert.equal(binding.correctAnswerInstanceName, "AnsBtn2");
  assert.equal(binding.correctAnswerButtonCharacterId, 31);
  assert.match(binding.projectionSha256, /^[0-9a-f]{64}$/u);
  assert.deepEqual(binding.options.map((option: {
    instanceName: string;
    label: string;
    ratio: string;
    buttonCharacterId: number;
  }) => [option.instanceName, option.label, option.ratio,
    option.buttonCharacterId]), [
    ["AnsBtn1", "A", "1:2", 32],
    ["AnsBtn2", "B", "2:3", 31],
    ["AnsBtn3", "C", "32:48", 30],
    ["AnsBtn4", "D", "64:96", 30],
  ]);
});

test("ALG L9 IN06 runtime is immutable and covers start, stop, and endpoint", async () => {
  const runtime = await readFile(path.join(OUTPUT_ROOT,
    "members/shared-alg001-l09-p018/canvas-renderer.js"), "utf8");
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
  new Script(runtime, {filename: "shared-alg001-l09-p018.js"})
    .runInNewContext(sandbox);
  const registry = sandbox.HELP_MATH_CANVAS_ASSETS as Record<string, {
    resolveFrameState(request: Readonly<{
      frame: number;
      scenario: string;
      lang: string;
      seed: number;
    }>): Readonly<{localFrame: number; exportFrame: number;
      audioRendered: false}>;
  }>;
  const property = Object.getOwnPropertyDescriptor(registry,
    "shared-alg001-l09-p018");
  assert.equal(property?.writable, false);
  assert.equal(property?.configurable, false);
  for (const frame of [1, 188, 667]) {
    const state = registry["shared-alg001-l09-p018"].resolveFrameState({
      frame, scenario: "source-static-frame", lang: "en", seed: 0,
    });
    assert.equal(state.localFrame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.equal(state.audioRendered, false);
  }
});
