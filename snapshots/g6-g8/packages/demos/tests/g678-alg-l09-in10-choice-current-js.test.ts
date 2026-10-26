import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {Script} from "node:vm";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import p022, {SHARED_ALG001_L09_P022_GLOSSARY_TERMS} from
  "../src/modules/shared-alg001-l09-p022";
import {
  SHARED_ALG001_L09_P022_CONFIG,
  SHARED_ALG001_L09_P022_SOURCE,
} from "../src/timelines/shared-alg001-l09-p022";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const OUTPUT_ROOT = path.join(PROJECT_ROOT,
  "work/g678-shared-page-factory/g678-alg-l09-in10-choice-current-js-1-v1");

test("ALG L9 IN10 binds the authored frame-93 two-choice stop", () => {
  assert.equal(p022.key, "shared-alg001-l09-p022");
  assert.equal(p022.maturity, "private-current-js");
  assert.deepEqual(p022.lessonHost?.capabilities,
    ["glossary", "practice-feedback"]);
  assert.equal(SHARED_ALG001_L09_P022_SOURCE.adapterFamily,
    "alg-l09-in10-choice-source-static");
  assert.equal(SHARED_ALG001_L09_P022_SOURCE.currentJavaScriptRegistered, false);
  assert.equal(SHARED_ALG001_L09_P022_CONFIG.mainFrameDomain, "sprite-190");
  assert.equal(SHARED_ALG001_L09_P022_CONFIG.mainFrameCount, 436);
  assert.deepEqual(p022.interactiveStops, [{
    id: "shared-alg001-l09-p022-choice-quiz",
    frameDomain: "sprite-190",
    stopFrame: 93,
    resumeFrame: 94,
    resolution: "explicit-source-feedback-finished",
    completionDisposition: "blocked-while-unresolved",
    requiresHostInteractiveStop: true,
    strictAcceptanceEffect: "none",
  }]);
  assert.deepEqual(SHARED_ALG001_L09_P022_GLOSSARY_TERMS.map((term) => [
    term.sourceCharacterId, term.firstFrame, term.sourceKeyAttribute,
  ]), [[22, 10, "Equation"], [23, 10, "Proportional relationship"],
    [28, 65, "Non-proportional relationship"]]);
});

test("ALG L9 IN10 exposes two accessible choices and source glossary", () => {
  const markup = renderToStaticMarkup(createElement(p022.Renderer, {
    frame: 93,
    frameDomain: "sprite-190",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    uiLanguage: "en",
  }));
  assert.match(markup, /data-complexity-lane="interactive-understood"/u);
  assert.match(markup, /data-audio-acceptance="pending"/u);
  assert.match(markup, /data-source-stop-frame="93"/u);
  assert.match(markup, /Is this equation shown a proportional relationship/u);
  assert.match(markup, /B\. non-proportional relationship/u);
  assert.equal(markup.match(/data-choice-id=/gu)?.length, 2);
  assert.equal(markup.match(/data-source-key-attribute=/gu)?.length, 3);
});

test("ALG L9 IN10 binds answer instances to source text at frame 93", async () => {
  const manifest = JSON.parse(await readFile(path.join(OUTPUT_ROOT,
    "members/shared-alg001-l09-p022/member-manifest.json"), "utf8"));
  const binding = manifest.reviewedAuthority.sourceChoicePlacementBinding;
  assert.equal(binding.source, "swfmill-source-xml");
  assert.equal(binding.frameDomain, "sprite-190");
  assert.equal(binding.textPlacedFrame, 86);
  assert.equal(binding.answerButtonsPlacedFrame, 93);
  assert.equal(binding.correctAnswerInstanceName, "AnsBtn2");
  assert.equal(binding.correctAnswerButtonCharacterId, 166);
  assert.match(binding.projectionSha256, /^[0-9a-f]{64}$/u);
  assert.deepEqual(binding.options.map((option: {
    instanceName: string;
    label: string;
    value: string;
    buttonCharacterId: number;
  }) => [option.instanceName, option.label, option.value,
    option.buttonCharacterId]), [
    ["AnsBtn1", "A", "proportional relationship", 167],
    ["AnsBtn2", "B", "non-proportional relationship", 166],
  ]);
});

test("ALG L9 IN10 runtime is immutable and covers start, stop, and endpoint", async () => {
  const runtime = await readFile(path.join(OUTPUT_ROOT,
    "members/shared-alg001-l09-p022/canvas-renderer.js"), "utf8");
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
  new Script(runtime, {filename: "shared-alg001-l09-p022.js"})
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
    "shared-alg001-l09-p022");
  assert.equal(property?.writable, false);
  assert.equal(property?.configurable, false);
  for (const frame of [1, 93, 436]) {
    const state = registry["shared-alg001-l09-p022"].resolveFrameState({
      frame, scenario: "source-static-frame", lang: "en", seed: 0,
    });
    assert.equal(state.localFrame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.equal(state.audioRendered, false);
  }
});
