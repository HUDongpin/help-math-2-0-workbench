import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {Script} from "node:vm";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import p020, {SHARED_ALG001_L09_P020_GLOSSARY_TERMS} from
  "../src/modules/shared-alg001-l09-p020";
import {
  SHARED_ALG001_L09_P020_CONFIG,
  SHARED_ALG001_L09_P020_SOURCE,
} from "../src/timelines/shared-alg001-l09-p020";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const OUTPUT_ROOT = path.join(PROJECT_ROOT,
  "work/g678-shared-page-factory/g678-alg-l09-in08-choice-current-js-1-v1");

test("ALG L9 IN08 binds the authored frame-607 four-choice stop", () => {
  assert.equal(p020.key, "shared-alg001-l09-p020");
  assert.equal(p020.maturity, "private-current-js");
  assert.deepEqual(p020.lessonHost?.capabilities,
    ["glossary", "practice-feedback"]);
  assert.equal(SHARED_ALG001_L09_P020_SOURCE.adapterFamily,
    "alg-l09-in08-choice-source-static");
  assert.equal(SHARED_ALG001_L09_P020_SOURCE.currentJavaScriptRegistered, false);
  assert.equal(SHARED_ALG001_L09_P020_CONFIG.mainFrameDomain, "sprite-193");
  assert.equal(SHARED_ALG001_L09_P020_CONFIG.mainFrameCount, 1271);
  assert.deepEqual(p020.interactiveStops, [{
    id: "shared-alg001-l09-p020-choice-quiz",
    frameDomain: "sprite-193",
    stopFrame: 607,
    resumeFrame: 608,
    resolution: "explicit-source-feedback-finished",
    completionDisposition: "blocked-while-unresolved",
    requiresHostInteractiveStop: true,
    strictAcceptanceEffect: "none",
  }]);
  assert.deepEqual(SHARED_ALG001_L09_P020_GLOSSARY_TERMS.map((term) => [
    term.sourceCharacterId, term.firstFrame, term.sourceKeyAttribute,
  ]), [[8, 12, "Proportion"], [11, 56, "Equation"],
    [12, 56, "Denominator"], [16, 283, "Coefficient"],
    [17, 283, "Variable"]]);
});

test("ALG L9 IN08 exposes four accessible choices and source glossary", () => {
  const markup = renderToStaticMarkup(createElement(p020.Renderer, {
    frame: 607,
    frameDomain: "sprite-193",
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    uiLanguage: "en",
  }));
  assert.match(markup, /data-complexity-lane="interactive-understood"/u);
  assert.match(markup, /data-audio-acceptance="pending"/u);
  assert.match(markup, /data-source-stop-frame="607"/u);
  assert.match(markup, /Calculate the proportion for the unknown number/u);
  assert.match(markup, /D\. 7/u);
  assert.equal(markup.match(/data-choice-id=/gu)?.length, 4);
  assert.equal(markup.match(/data-source-key-attribute=/gu)?.length, 5);
});

test("ALG L9 IN08 binds answer instances to source text at frame 607", async () => {
  const manifest = JSON.parse(await readFile(path.join(OUTPUT_ROOT,
    "members/shared-alg001-l09-p020/member-manifest.json"), "utf8"));
  const binding = manifest.reviewedAuthority.sourceChoicePlacementBinding;
  assert.equal(binding.source, "swfmill-source-xml");
  assert.equal(binding.frameDomain, "sprite-193");
  assert.equal(binding.textPlacedFrame, 598);
  assert.equal(binding.answerButtonsPlacedFrame, 607);
  assert.equal(binding.correctAnswerInstanceName, "AnsBtn4");
  assert.equal(binding.correctAnswerButtonCharacterId, 171);
  assert.match(binding.projectionSha256, /^[0-9a-f]{64}$/u);
  assert.deepEqual(binding.options.map((option: {
    instanceName: string;
    label: string;
    value: string;
    buttonCharacterId: number;
  }) => [option.instanceName, option.label, option.value,
    option.buttonCharacterId]), [
    ["AnsBtn1", "A", "3", 170],
    ["AnsBtn2", "B", "4", 170],
    ["AnsBtn3", "C", "6", 170],
    ["AnsBtn4", "D", "7", 171],
  ]);
});

test("ALG L9 IN08 runtime is immutable and covers start, stop, and endpoint", async () => {
  const runtime = await readFile(path.join(OUTPUT_ROOT,
    "members/shared-alg001-l09-p020/canvas-renderer.js"), "utf8");
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
  new Script(runtime, {filename: "shared-alg001-l09-p020.js"})
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
    "shared-alg001-l09-p020");
  assert.equal(property?.writable, false);
  assert.equal(property?.configurable, false);
  for (const frame of [1, 607, 1271]) {
    const state = registry["shared-alg001-l09-p020"].resolveFrameState({
      frame, scenario: "source-static-frame", lang: "en", seed: 0,
    });
    assert.equal(state.localFrame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.equal(state.audioRendered, false);
  }
});
