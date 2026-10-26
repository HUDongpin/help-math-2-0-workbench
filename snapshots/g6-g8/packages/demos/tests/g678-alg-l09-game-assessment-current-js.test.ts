import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {Script} from "node:vm";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import {createMemoryOnlyLessonHost} from "../src/lesson-host-contract";
import {commitAlgL09GameNavigation} from
  "../src/private-source-static-alg-l09-game-assessment-candidate";

import p030, * as m030 from "../src/modules/shared-alg001-l09-p030";
import p031, * as m031 from "../src/modules/shared-alg001-l09-p031";
import p041, * as m041 from "../src/modules/shared-alg001-l09-p041";
import {SHARED_ALG001_L09_P030_CONFIG as c030} from
  "../src/timelines/shared-alg001-l09-p030";
import {SHARED_ALG001_L09_P031_CONFIG as c031} from
  "../src/timelines/shared-alg001-l09-p031";
import {SHARED_ALG001_L09_P041_CONFIG as c041} from
  "../src/timelines/shared-alg001-l09-p041";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const OUTPUT = path.join(ROOT, "work/g678-shared-page-factory/" +
  "g678-alg-l09-game-assessment-current-js-3-v1");
const members = [
  {module: p030, exports: m030, config: c030, id: "shared-alg001-l09-p030"},
  {module: p031, exports: m031, config: c031, id: "shared-alg001-l09-p031"},
  {module: p041, exports: m041, config: c041, id: "shared-alg001-l09-p041"},
] as const;

function behavior(exports: Record<string, unknown>) {
  const found = Object.entries(exports).find(([key]) =>
    key.endsWith("_SOURCE_BEHAVIOR"));
  assert.ok(found);
  return found[1] as Record<string, unknown>;
}

test("three residual modules expose exact maintained host contracts", () => {
  assert.deepEqual(p030.lessonHost?.capabilities, ["navigation"]);
  assert.deepEqual(p031.lessonHost?.capabilities, ["practice-feedback"]);
  assert.deepEqual(p041.lessonHost?.capabilities, ["fq-scoring"]);
  for (const member of members) {
    assert.equal(member.module.key, member.id);
    assert.equal(member.module.maturity, "private-current-js");
    assert.equal(member.module.interactiveStops?.length, 1);
    assert.equal(member.module.interactiveStops?.[0]
      .completionDisposition, "blocked-while-unresolved");
  }
  assert.equal(behavior(m030).targetAnimationId,
    "shared-alg001-l09-p031");
  assert.equal(behavior(m031).answerReleaseCount, 24);
  assert.equal(behavior(m031).correctScoreDelta, 10);
  assert.equal(behavior(m031).wrongScoreDelta, -2);
  for (const levelCards of [behavior(m031).level1Cards,
    behavior(m031).level2Cards] as readonly (readonly Record<string,
      unknown>[])[]) {
    assert.equal(levelCards.length, 12);
    for (const pairId of [1, 2, 3, 4, 5, 6]) {
      const pair = levelCards.filter((card) => card.pairId === pairId);
      assert.equal(pair.length, 2);
      assert.equal(new Set(pair.map((card) => card.equivalenceKey)).size, 1);
      assert.ok(pair.every((card) => typeof card.label === "string" &&
        card.label.length > 0));
    }
  }
  assert.equal((behavior(m041).answerKey as readonly number[]).length, 24);
  const questionBank = behavior(m041).questionBank as readonly Readonly<{
    questionNumber: number; prompt: string; choices: readonly string[];
  }>[];
  assert.equal(questionBank.length, 24);
  assert.deepEqual(questionBank.map((question) => question.choices.length),
    [...Array(12).fill(4), ...Array(8).fill(2), ...Array(4).fill(4)]);
  assert.ok(questionBank.every((question, index) =>
    question.questionNumber === index + 1 && question.prompt.length > 0));
});

test("controller resolves its stop only after exact navigation is admitted", () => {
  const sourceAnimationId = "shared-alg001-l09-p030";
  const targetAnimationId = "shared-alg001-l09-p031";
  const stop = p030.interactiveStops![0]!;
  for (const enabled of [false, true]) {
    const host = createMemoryOnlyLessonHost({releaseId: "alg-l09-game",
      releaseMemberIds: [sourceAnimationId, targetAnimationId],
      currentAnimationId: sourceAnimationId,
      enabledCapabilities: enabled ? ["navigation"] : []});
    let resolutions = 0;
    const committed = commitAlgL09GameNavigation({level: 2,
      sourceAnimationId, targetAnimationId,
      onLessonHostRequest: (request) => host.dispatch(request), stop,
      onInteractiveStopResolved: () => {resolutions += 1;}});
    assert.equal(committed, enabled);
    assert.equal(resolutions, enabled ? 1 : 0);
    assert.equal(host.snapshot().currentAnimationId,
      enabled ? targetAnimationId : sourceAnimationId);
  }
});

test("residual renderers expose controller, matching, and FQ controls", () => {
  const base = {scenario: "source-static-frame", lang: "en" as const,
    uiLanguage: "en" as const, seed: 7};
  const controller = renderToStaticMarkup(createElement(p030.Renderer,
    {...base, frame: 748, frameDomain: c030.mainFrameDomain}));
  assert.match(controller, /data-game-controller-ready/u);
  assert.match(controller, />Level 1</u);
  assert.match(controller, />Start game</u);
  const game = renderToStaticMarkup(createElement(p031.Renderer,
    {...base, frame: 1, frameDomain: c031.mainFrameDomain,
      lessonHostNavigationHandoff: {kind: "game-level" as const,
        sourceAnimationId: "shared-alg001-l09-p030",
        targetAnimationId: "shared-alg001-l09-p031", level: 2 as const}}));
  assert.match(game, /data-game-phase="choosing"/u);
  assert.match(game, /data-game-level="2"/u);
  assert.match(game, />3\/2</u);
  assert.match(game, />6\/4</u);
  assert.doesNotMatch(game, />Card 1A</u);
  assert.equal((game.match(/data-card-id=/gu) ?? []).length, 12);
  const assessment = renderToStaticMarkup(createElement(p041.Renderer,
    {...base, frame: 1, frameDomain: c041.mainFrameDomain}));
  assert.match(assessment, /data-assessment-phase="answering"/u);
  assert.match(assessment, /data-presented-question-count="10"/u);
  assert.match(assessment, /data-source-question-content-bound="true"/u);
  assert.match(assessment, /(?:ratio|relationship|proportion|scale)/iu);
  assert.equal((assessment.match(/data-answer-option=/gu) ?? []).length,
    Number(assessment.match(/data-choice-count="([24])"/u)?.[1]));
});

test("member manifests bind exact source behavior and safe runtimes", async () => {
  for (const member of members) {
    const manifest = JSON.parse(await readFile(path.join(OUTPUT, "members",
      member.id, "member-manifest.json"), "utf8"));
    assert.equal(manifest.artifactType,
      "g678-alg-l09-game-assessment-current-js-member-v1");
    assert.equal(manifest.reviewedAuthority.sourceBehaviorBinding.source,
      "swfmill-source-xml");
    assert.equal(manifest.timeline.interactiveStops.length, 1);
    assert.equal(manifest.product.sourceGameOrAssessmentBehaviorBound, true);
    const runtime = await readFile(path.join(OUTPUT, "members", member.id,
      "canvas-renderer.js"), "utf8");
    assert.doesNotMatch(runtime,
      /fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|getURL/u);
    const sandbox = {document: {createElement(tagName: string) {
      if (tagName === "canvas") return {getContext: () => ({}), width: 0,
        height: 0};
      if (tagName === "img") return {complete: true, naturalWidth: 1,
        naturalHeight: 1, decode: async () => undefined};
      throw new Error(`unexpected element: ${tagName}`);
    }}} as Record<string, unknown>;
    new Script(runtime).runInNewContext(sandbox);
    const registry = sandbox.HELP_MATH_CANVAS_ASSETS as Record<string, unknown>;
    assert.ok(registry[member.id]);
    assert.equal(Object.getOwnPropertyDescriptor(registry, member.id)
      ?.writable, false);
  }
});
