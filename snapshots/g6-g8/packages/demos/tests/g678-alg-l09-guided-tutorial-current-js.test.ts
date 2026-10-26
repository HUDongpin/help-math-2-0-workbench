import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {Script} from "node:vm";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import p037, * as m037 from "../src/modules/shared-alg001-l09-p037";
import p038, * as m038 from "../src/modules/shared-alg001-l09-p038";
import p039, * as m039 from "../src/modules/shared-alg001-l09-p039";
import {SHARED_ALG001_L09_P037_CONFIG as c037} from
  "../src/timelines/shared-alg001-l09-p037";
import {SHARED_ALG001_L09_P038_CONFIG as c038} from
  "../src/timelines/shared-alg001-l09-p038";
import {SHARED_ALG001_L09_P039_CONFIG as c039} from
  "../src/timelines/shared-alg001-l09-p039";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const OUTPUT_ROOT = path.join(PROJECT_ROOT,
  "work/g678-shared-page-factory/" +
  "g678-alg-l09-guided-tutorial-current-js-3-v1");
const members = [
  {module: p037, exports: m037, config: c037},
  {module: p038, exports: m038, config: c038},
  {module: p039, exports: m039, config: c039},
] as const;

function named<T>(exports: Record<string, unknown>, suffix: string): T {
  const match = Object.entries(exports).find(([key]) => key.endsWith(suffix));
  assert.ok(match, `missing generated export ${suffix}`);
  return match[1] as T;
}

test("guided modules expose five source stops and one terminal stop", () => {
  for (const member of members) {
    const behavior = named<{
      animationId: string;
      frameCount: number;
      finalQuestion: string;
      correctChoiceId: string;
      stops: readonly {id: string; frame: number; resumeFrame: number | null;
        kind: string}[];
      options: readonly {id: string; correct: boolean}[];
    }>(member.exports, "_BEHAVIOR");
    const glossary = named<readonly {id: string;
      sourceCharacterIds: readonly number[]}[]>(member.exports,
      "_GLOSSARY_TERMS");
    const help = named<readonly {stopId: string; text: {en: string;
      es: string}}[]>(member.exports, "_HELP_PROMPTS");
    assert.equal(member.module.key, behavior.animationId);
    assert.equal(member.module.maturity, "private-current-js");
    assert.deepEqual(member.module.lessonHost?.capabilities,
      ["glossary", "practice-feedback"]);
    assert.equal(behavior.stops.length, 6);
    assert.equal(behavior.stops.at(-1)?.kind, "terminal");
    assert.equal(behavior.stops.at(-1)?.frame, behavior.frameCount);
    assert.equal(member.module.interactiveStops?.length, 5);
    assert.equal(member.module.interactiveStops?.every((stop, index) =>
      stop.stopFrame === behavior.stops[index]?.frame &&
      stop.resumeFrame === behavior.stops[index]?.resumeFrame &&
      stop.completionDisposition === "blocked-while-unresolved"), true);
    assert.equal(help.length, 2);
    assert.equal(help.every((prompt, index) =>
      prompt.stopId === `help-${index + 1}` &&
      prompt.text.en.length > 20 && prompt.text.es.length > 20), true);
    assert.equal(glossary.length > 0, true);
    assert.equal(new Set(glossary.map((term) => term.id)).size,
      glossary.length);
    assert.equal(behavior.options.filter((option) => option.correct)[0]?.id,
      behavior.correctChoiceId);
  }
});

test("guided renderers expose source controls at initial requested stops", () => {
  for (const member of members) {
    const behavior = named<{
      finalQuestion: string;
      stops: readonly {frame: number; kind: string}[];
      options: readonly unknown[];
    }>(member.exports, "_BEHAVIOR");
    const firstStop = behavior.stops[0];
    const firstMarkup = renderToStaticMarkup(createElement(
      member.module.Renderer, {
        frame: firstStop.frame,
        frameDomain: member.config.mainFrameDomain,
        scenario: "source-static-frame",
        lang: "en",
        seed: 0,
        uiLanguage: "en",
      }));
    assert.match(firstMarkup, /data-complexity-lane="advanced-manual"/u);
    assert.match(firstMarkup, /data-guided-phase="continue-stop"/u);
    assert.match(firstMarkup, />Continue</u);
    const quizStop = behavior.stops.find((stop) => stop.kind === "quiz");
    assert.ok(quizStop);
    const quizMarkup = renderToStaticMarkup(createElement(
      member.module.Renderer, {
        frame: quizStop.frame,
        frameDomain: member.config.mainFrameDomain,
        scenario: "source-static-frame",
        lang: "en",
        seed: 0,
        uiLanguage: "en",
      }));
    assert.match(quizMarkup, /data-guided-phase="choosing"/u);
    assert.equal(quizMarkup.includes(behavior.finalQuestion), true);
    assert.equal((quizMarkup.match(/<button/gu) ?? []).length >=
      behavior.options.length, true);
  }
});

test("guided member manifests bind raw stop reconstruction and host files", async () => {
  for (const member of members) {
    const behavior = named<{animationId: string; stops: readonly {
      id: string; frame: number; kind: string}[]}>(member.exports,
      "_BEHAVIOR");
    const manifest = JSON.parse(await readFile(path.join(OUTPUT_ROOT,
      "members", behavior.animationId, "member-manifest.json"), "utf8"));
    assert.equal(manifest.artifactType,
      "g678-alg-l09-guided-tutorial-current-js-member-v1");
    assert.equal(manifest.reviewedAuthority.sourceGuidedStopBinding.source,
      "swfmill-source-xml");
    assert.deepEqual(manifest.reviewedAuthority.sourceGuidedStopBinding.stops,
      behavior.stops);
    assert.equal(manifest.timeline.interactiveStops.length, 5);
    assert.equal(manifest.product.sourceGuidedStopsBound, true);
    assert.equal(manifest.product.sourceNeedMoreHelpBranchesBound, true);
    assert.equal(manifest.product.sourceFinalChoiceQuizBound, true);
    assert.equal(manifest.product.productCalibrationPassed, false);
  }
});

test("guided runtimes are immutable, local, and span each source domain", async () => {
  for (const member of members) {
    const behavior = named<{animationId: string; frameCount: number;
      stops: readonly {frame: number}[]}>(member.exports, "_BEHAVIOR");
    const runtime = await readFile(path.join(OUTPUT_ROOT, "members",
      behavior.animationId, "canvas-renderer.js"), "utf8");
    assert.doesNotMatch(runtime,
      /fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|getURL/u);
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
      resolveFrameState(request: {frame: number; scenario: string;
        lang: string; seed: number}): {localFrame: number;
          exportFrame: number; audioRendered: false};
    }>;
    const property = Object.getOwnPropertyDescriptor(registry,
      behavior.animationId);
    assert.equal(property?.writable, false);
    assert.equal(property?.configurable, false);
    for (const frame of [1, ...behavior.stops.map((stop) => stop.frame),
      behavior.frameCount]) {
      const resolved = registry[behavior.animationId].resolveFrameState({
        frame, scenario: "source-static-frame", lang: "en", seed: 0,
      });
      assert.equal(resolved.localFrame, frame);
      assert.equal(resolved.exportFrame, frame - 1);
      assert.equal(resolved.audioRendered, false);
    }
  }
});
