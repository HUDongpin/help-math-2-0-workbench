import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {Script} from "node:vm";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import p024, * as m024 from "../src/modules/shared-alg001-l09-p024";
import p025, * as m025 from "../src/modules/shared-alg001-l09-p025";
import p026, * as m026 from "../src/modules/shared-alg001-l09-p026";
import p027, * as m027 from "../src/modules/shared-alg001-l09-p027";
import p028, * as m028 from "../src/modules/shared-alg001-l09-p028";
import p029, * as m029 from "../src/modules/shared-alg001-l09-p029";
import {SHARED_ALG001_L09_P024_CONFIG as c024} from
  "../src/timelines/shared-alg001-l09-p024";
import {SHARED_ALG001_L09_P025_CONFIG as c025} from
  "../src/timelines/shared-alg001-l09-p025";
import {SHARED_ALG001_L09_P026_CONFIG as c026} from
  "../src/timelines/shared-alg001-l09-p026";
import {SHARED_ALG001_L09_P027_CONFIG as c027} from
  "../src/timelines/shared-alg001-l09-p027";
import {SHARED_ALG001_L09_P028_CONFIG as c028} from
  "../src/timelines/shared-alg001-l09-p028";
import {SHARED_ALG001_L09_P029_CONFIG as c029} from
  "../src/timelines/shared-alg001-l09-p029";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const OUTPUT_ROOT = path.join(PROJECT_ROOT,
  "work/g678-shared-page-factory/g678-alg-l09-ti-choice-current-js-6-v1");
const members = [
  {module: p024, exports: m024, config: c024},
  {module: p025, exports: m025, config: c025},
  {module: p026, exports: m026, config: c026},
  {module: p027, exports: m027, config: c027},
  {module: p028, exports: m028, config: c028},
  {module: p029, exports: m029, config: c029},
] as const;

function named<T>(exports: Record<string, unknown>, suffix: string): T {
  const match = Object.entries(exports).find(([key]) => key.endsWith(suffix));
  assert.ok(match, `missing generated export ${suffix}`);
  return match[1] as T;
}

test("ALG L9 TI modules bind six source stops and unique glossary groups", () => {
  for (const member of members) {
    const behavior = named<{
      animationId: string;
      stopFrame: number;
      resumeFrame: number;
      options: readonly unknown[];
    }>(member.exports, "_BEHAVIOR");
    const glossary = named<readonly {
      id: string;
      sourceCharacterIds: readonly number[];
    }[]>(member.exports, "_GLOSSARY_TERMS");
    assert.equal(member.module.key, behavior.animationId);
    assert.equal(member.module.maturity, "private-current-js");
    assert.deepEqual(member.module.lessonHost?.capabilities,
      ["glossary", "practice-feedback"]);
    assert.equal(member.config.animationId, behavior.animationId);
    assert.equal(member.config.mainFrameCount > behavior.stopFrame, true);
    assert.deepEqual(member.module.interactiveStops, [{
      id: `${behavior.animationId}-choice-quiz`,
      frameDomain: member.config.mainFrameDomain,
      stopFrame: behavior.stopFrame,
      resumeFrame: behavior.resumeFrame,
      resolution: "explicit-source-feedback-finished",
      completionDisposition: "blocked-while-unresolved",
      requiresHostInteractiveStop: true,
      strictAcceptanceEffect: "none",
    }]);
    assert.equal(glossary.length > 0, true);
    assert.equal(new Set(glossary.map((term) => term.id)).size,
      glossary.length);
    assert.equal(glossary.every((term) =>
      term.sourceCharacterIds.length > 0), true);
  }
});

test("ALG L9 TI renderers expose exact questions and two-to-four choices", () => {
  for (const member of members) {
    const behavior = named<{
      stopFrame: number;
      sourceText: {question: string};
      options: readonly unknown[];
      maintainedAttemptCounterNormalizesKnownSourceVariantDefect: boolean;
    }>(member.exports, "_BEHAVIOR");
    const markup = renderToStaticMarkup(createElement(member.module.Renderer, {
      frame: behavior.stopFrame,
      frameDomain: member.config.mainFrameDomain,
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      uiLanguage: "en",
    }));
    assert.match(markup, /data-complexity-lane="interactive-understood"/u);
    assert.match(markup, /data-audio-acceptance="pending"/u);
    assert.match(markup, new RegExp(
      `data-source-stop-frame="${behavior.stopFrame}"`, "u"));
    assert.equal(markup.includes(behavior.sourceText.question), true);
    assert.equal(markup.match(/data-choice-id=/gu)?.length,
      behavior.options.length);
    assert.equal(markup.includes(
      `data-maintained-attempt-counter-normalizes-source-defect="${
        behavior.maintainedAttemptCounterNormalizesKnownSourceVariantDefect
          ? "true"
          : "false"}"`), true);
  }
});

test("ALG L9 TI member manifests bind source placement quirks", async () => {
  for (const member of members) {
    const behavior = named<{
      animationId: string;
      stopFrame: number;
      correctChoice: string;
      options: readonly {
        id: string;
        sourceButtonCharacterId: number;
        sourceButtonDepth: number;
        sourceInstanceName: string;
      }[];
    }>(member.exports, "_BEHAVIOR");
    const manifest = JSON.parse(await readFile(path.join(OUTPUT_ROOT,
      "members", behavior.animationId, "member-manifest.json"), "utf8"));
    const binding = manifest.reviewedAuthority.sourceChoicePlacementBinding;
    assert.equal(binding.source, "swfmill-source-xml");
    assert.equal(binding.frameDomain, member.config.mainFrameDomain);
    assert.equal(binding.answerButtonsPlacedFrame, behavior.stopFrame);
    assert.equal(binding.correctChoiceId, behavior.correctChoice);
    assert.equal(binding.sourceInstanceNamesMayRepeatOrDifferFromVisualOrder,
      true);
    assert.deepEqual(binding.options.map((option: {
      id: string;
      buttonCharacterId: number;
      buttonDepth: number;
      sourceInstanceName: string;
    }) => [option.id, option.buttonCharacterId, option.buttonDepth,
      option.sourceInstanceName]), behavior.options.map((option) => [
      option.id, option.sourceButtonCharacterId, option.sourceButtonDepth,
      option.sourceInstanceName,
    ]));
  }
});

test("ALG L9 TI runtimes are immutable and cover start, stop, and endpoint", async () => {
  for (const member of members) {
    const behavior = named<{
      animationId: string;
      stopFrame: number;
    }>(member.exports, "_BEHAVIOR");
    const runtime = await readFile(path.join(OUTPUT_ROOT, "members",
      behavior.animationId, "canvas-renderer.js"), "utf8");
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
    new Script(runtime, {filename: `${behavior.animationId}.js`})
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
      behavior.animationId);
    assert.equal(property?.writable, false);
    assert.equal(property?.configurable, false);
    for (const frame of [1, behavior.stopFrame,
      member.config.mainFrameCount]) {
      const state = registry[behavior.animationId].resolveFrameState({
        frame, scenario: "source-static-frame", lang: "en", seed: 0,
      });
      assert.equal(state.localFrame, frame);
      assert.equal(state.exportFrame, frame - 1);
      assert.equal(state.audioRendered, false);
    }
  }
});
