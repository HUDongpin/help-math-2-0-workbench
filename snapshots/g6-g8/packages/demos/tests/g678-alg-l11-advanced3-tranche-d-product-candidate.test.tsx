import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import GeneratedP033 from
  "../src/modules/g678-alg-l11-advanced3-tranche-d-p033";
import GeneratedP034 from
  "../src/modules/g678-alg-l11-advanced3-tranche-d-p034";
import GeneratedP044 from
  "../src/modules/g678-alg-l11-advanced3-tranche-d-p044";

import {
  G678_ALG_L11_ADVANCED3_TRANCHE_D_CANDIDATE_MODULES,
  G678_ALG_L11_ADVANCED3_TRANCHE_D_P033_CANDIDATE_MODULE,
  G678_ALG_L11_ADVANCED3_TRANCHE_D_P034_CANDIDATE_MODULE,
  G678_ALG_L11_ADVANCED3_TRANCHE_D_P044_CANDIDATE_MODULE,
} from "../src/g678-alg-l11-advanced3-tranche-d-candidates";
import {
  G678_ALG_L11_ADVANCED3_TRANCHE_D_ANSWER_KEY,
  G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS,
  buildAlgL11Advanced3NavigationIntent,
  createAlgL11Advanced3AssessmentState,
  createAlgL11Advanced3ControllerState,
  createAlgL11Advanced3MatchingState,
  reduceAlgL11Advanced3Assessment,
  reduceAlgL11Advanced3Controller,
  reduceAlgL11Advanced3Matching,
} from "../src/g678-alg-l11-advanced3-tranche-d-state";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)),
  "../../..");
const SCENARIO = "advanced3-tranche-d-unregistered-engineering-candidate";

function common(frameDomain: string, overrides: Record<string, unknown> = {}) {
  return {frame: 1, frameDomain, lang: "en" as const, scenario: SCENARIO,
    seed: 31, replay: 0, paused: false, onReplay: () => {}, ...overrides};
}

function count(html: string, pattern: RegExp) {
  return [...html.matchAll(pattern)].length;
}

function escapeText(value: string) {
  return value.replace(/&/gu, "&amp;").replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;");
}

test("p033 SSR exposes exact level, target, arity, pause, and replay host controls", () => {
  const Renderer = G678_ALG_L11_ADVANCED3_TRANCHE_D_P033_CANDIDATE_MODULE
    .Renderer;
  const initial = renderToStaticMarkup(<Renderer {...common("sprite-116",
    {frame: 604, replay: 7})} />);
  assert.match(initial, /data-private-current-js="true"/);
  assert.match(initial, /data-current-javascript-registered="false"/);
  assert.match(initial, /data-handoff-target="shared-alg001-l11-p034"/);
  assert.match(initial, /data-legacy-handoff-target="L11GS03"/);
  assert.match(initial, /data-source-handoff-arity="2"/);
  assert.match(initial, /data-runtime-replay="7"/);
  assert.match(initial, />Level 1</);
  assert.match(initial, />Level 2</);
  assert.match(initial, />Start</);
  assert.match(initial, />Replay</);
  assert.equal(count(initial, /<button/gu), 4);

  const terminalPaused = renderToStaticMarkup(<Renderer {...common(
    "sprite-116", {frame: 605, paused: true, replay: 8})} />);
  assert.match(terminalPaused, /data-source-handoff-arity="3"/);
  assert.match(terminalPaused, /data-runtime-paused="true"/);
  assert.equal(count(terminalPaused, / disabled=""/gu), 4);

  let state = createAlgL11Advanced3ControllerState("terminal");
  state = reduceAlgL11Advanced3Controller(state,
    {type: "select-level", level: 2, input: "mouse"});
  state = reduceAlgL11Advanced3Controller(state,
    {type: "start", input: "mouse"});
  const intent = buildAlgL11Advanced3NavigationIntent(state);
  assert.deepEqual(intent?.request, {type: "navigate",
    targetAnimationId: "shared-alg001-l11-p034", handoff: {
      kind: "game-level", sourceAnimationId: "shared-alg001-l11-p033",
      targetAnimationId: "shared-alg001-l11-p034", level: 2}});
  assert.deepEqual(intent?.legacyEvidence.arguments, ["L11GS03", 1, 6]);
  assert.equal(intent?.legacyEvidence.executed, false);
});

test("p034 two SSR states expose all exact 24 source-token cards and visible feedback/replay controls", () => {
  const Renderer = G678_ALG_L11_ADVANCED3_TRANCHE_D_P034_CANDIDATE_MODULE
    .Renderer;
  const renderLevel = (level: 1 | 2, paused = false) =>
    renderToStaticMarkup(<Renderer {...common("sprite-225", {paused,
      lessonHostNavigationHandoff: {kind: "game-level" as const,
        sourceAnimationId: "shared-alg001-l11-p033",
        targetAnimationId: "shared-alg001-l11-p034", level}})} />);
  const level1 = renderLevel(1);
  const level2 = renderLevel(2);
  for (const [level, html] of [[1, level1], [2, level2]] as const) {
    assert.match(html, /data-source-card-count="24"/);
    assert.match(html, /data-source-level-count="2"/);
    assert.match(html, new RegExp(`<h2[^>]*>Level ${level}</h2>`, "u"));
    assert.match(html, />Level 1</);
    assert.match(html, />Level 2</);
    assert.match(html, />Replay</);
    assert.match(html, /data-feedback-phase="choosing"/);
    assert.match(html, />Continue</);
    assert.match(html, /Score: 0/);
    assert.equal(count(html, /data-source-character-id=/gu), 12);
  }
  const visibleCharacterIds = [...level1.matchAll(
    /data-source-character-id="(\d+)"/gu), ...level2.matchAll(
    /data-source-character-id="(\d+)"/gu)].map((match) => Number(match[1]));
  assert.deepEqual(visibleCharacterIds,
    G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS
      .map((card) => card.sourceCharacterId));
  for (const card of G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS) {
    const html = card.level === 1 ? level1 : level2;
    assert.ok(html.includes(escapeText(card.sourceTextTokens.join(" "))),
      `${card.id} source tokens are not visible`);
  }
  const paused = renderLevel(1, true);
  assert.match(paused, /data-runtime-paused="true"/);
  assert.equal(count(paused, / disabled=""/gu), 16);

  let state = createAlgL11Advanced3MatchingState(1);
  const pair = G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS
    .filter((card) => card.level === 1 && card.pairId === 1);
  state = reduceAlgL11Advanced3Matching(state,
    {type: "select-card", cardId: pair[0].id, input: "mouse"});
  state = reduceAlgL11Advanced3Matching(state,
    {type: "select-card", cardId: pair[1].id, input: "mouse"});
  assert.equal(state.score, 10);
  assert.equal(state.phase, "correct-feedback");
  state = reduceAlgL11Advanced3Matching(state,
    {type: "dismiss-feedback", input: "mouse"});
  state = reduceAlgL11Advanced3Matching(state,
    {type: "replay", input: "mouse"});
  assert.equal(state.score, 0);
  assert.deepEqual(state.matchedPairIds, []);
  assert.equal(state.selectedCardId, null);
  assert.equal(state.phase, "choosing");
});

test("p044 SSR exposes the exact 24-question identity pool, four choices, review, grade, pause, and replay", () => {
  const Renderer = G678_ALG_L11_ADVANCED3_TRANCHE_D_P044_CANDIDATE_MODULE
    .Renderer;
  const html = renderToStaticMarkup(<Renderer {...common("sprite-1083",
    {replay: 4})} />);
  const questionPool = Array.from({length: 24}, (_, index) => `Q${index + 1}`);
  assert.match(html, /data-question-pool-size="24"/);
  assert.match(html, /data-choice-count-per-question="4"/);
  assert.match(html, /data-review-enabled="true"/);
  assert.match(html, new RegExp(
    `data-question-pool="${questionPool.join(",")}"`, "u"));
  assert.match(html, />Option A</);
  assert.match(html, />Option B</);
  assert.match(html, />Option C</);
  assert.match(html, />Option D</);
  assert.match(html, />Review answers</);
  assert.match(html, /data-grade="pending"/);
  assert.match(html, />Replay</);
  assert.match(html, /data-runtime-replay="4"/);

  const paused = renderToStaticMarkup(<Renderer {...common("sprite-1083",
    {paused: true})} />);
  assert.match(paused, /data-runtime-paused="true"/);
  assert.equal(count(paused, / disabled=""/gu), 6);

  let state = createAlgL11Advanced3AssessmentState(31);
  for (const question of state.questionNumbers) {
    state = reduceAlgL11Advanced3Assessment(state, {type: "answer",
      option: G678_ALG_L11_ADVANCED3_TRANCHE_D_ANSWER_KEY[question - 1],
      input: "mouse"}, 31);
  }
  assert.equal(state.phase, "results");
  assert.equal(state.grade, "Advanced");
  state = reduceAlgL11Advanced3Assessment(state,
    {type: "begin-review", input: "mouse"}, 31);
  assert.equal(state.phase, "review");
  assert.equal(state.responses[state.reviewIndex].questionNumber,
    state.questionNumbers[0]);
  state = reduceAlgL11Advanced3Assessment(state,
    {type: "replay", input: "mouse"}, 31);
  assert.equal(state.phase, "answering");
  assert.equal(state.responses.length, 0);
  assert.equal(state.grade, null);
  assert.equal(new Set(state.questionNumbers).size, 10);
});

test("private-current-js candidates expose no legacy, network, persistence, or audio execution path", () => {
  for (const module of G678_ALG_L11_ADVANCED3_TRANCHE_D_CANDIDATE_MODULES) {
    assert.equal(module.maturity, "private-current-js");
    assert.equal(module.audioCues.length, 0);
    assert.equal(module.audioTracks, undefined);
    assert.equal(module.interactiveAudioAssets, undefined);
    assert.equal(module.lessonHost?.legacyOperations, "blocked");
    assert.equal(module.lessonHost?.auditStorage, "memory-only");
    assert.equal(module.lessonHost?.storesPersonalData, false);
  }
  const source = readFileSync(path.join(ROOT,
    "packages/demos/src/g678-alg-l11-advanced3-tranche-d-candidates.tsx"),
  "utf8");
  assert.doesNotMatch(source,
    /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB)\b/u);
  assert.doesNotMatch(source,
    /\b(?:doCloseApp|doGetReview|setBookMark|doPlayFQQuestionAudio|doPlayFQAnswerAudio)\s*\(/u);
  assert.doesNotMatch(source, /type:\s*["'](?:play-audio|legacy)["']/u);
});

test("generated per-page modules expose the same private-current-js renderers without registering them", () => {
  const generated = [GeneratedP033, GeneratedP034, GeneratedP044];
  assert.deepEqual(generated.map((module) => module.key), [
    "shared-alg001-l11-p033", "shared-alg001-l11-p034",
    "shared-alg001-l11-p044",
  ]);
  for (const [index, module] of generated.entries()) {
    assert.equal(module, G678_ALG_L11_ADVANCED3_TRANCHE_D_CANDIDATE_MODULES[
      index]);
    assert.equal(module.maturity, "private-current-js");
    const html = renderToStaticMarkup(<module.Renderer {...common(
      module.runtime?.defaultFrameDomain ?? "root")} />);
    assert.match(html, /data-private-current-js="true"/);
    assert.match(html, /data-current-javascript-registered="false"/);
  }
});
