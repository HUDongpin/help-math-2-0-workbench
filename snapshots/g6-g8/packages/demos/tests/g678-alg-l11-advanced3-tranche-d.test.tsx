import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import {
  G678_ALG_L11_ADVANCED3_TRANCHE_D_CANDIDATE_MODULES,
  G678_ALG_L11_ADVANCED3_TRANCHE_D_P033_CANDIDATE_MODULE,
  G678_ALG_L11_ADVANCED3_TRANCHE_D_P034_CANDIDATE_MODULE,
  G678_ALG_L11_ADVANCED3_TRANCHE_D_P044_CANDIDATE_MODULE,
  resolveAlgL11Advanced3ControllerPhase,
} from "../src/g678-alg-l11-advanced3-tranche-d-candidates";
import {
  G678_ALG_L11_ADVANCED3_TRANCHE_D_ANSWER_KEY,
  G678_ALG_L11_ADVANCED3_TRANCHE_D_AUDIT_ANSWER_KEY_PROJECTION,
  G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS,
  G678_ALG_L11_ADVANCED3_TRANCHE_D_SPEC,
  assertAlgL11Advanced3MatchingCards,
  buildAlgL11Advanced3AnswerKeyFromAudit,
  buildAlgL11Advanced3NavigationIntent,
  createAlgL11Advanced3AssessmentState,
  createAlgL11Advanced3ControllerState,
  createAlgL11Advanced3MatchingState,
  gradeAlgL11Advanced3Assessment,
  reduceAlgL11Advanced3Assessment,
  reduceAlgL11Advanced3Controller,
  reduceAlgL11Advanced3Matching,
  selectAlgL11Advanced3AssessmentQuestions,
} from "../src/g678-alg-l11-advanced3-tranche-d-state";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)),
  "../../..");

test("tranche-d spec keeps all registration, product, preview, acceptance, and release gates false", () => {
  assert.equal(G678_ALG_L11_ADVANCED3_TRANCHE_D_SPEC.pages.length, 3);
  assert.equal(G678_ALG_L11_ADVANCED3_TRANCHE_D_SPEC
    .currentJavaScriptImplementedPlacementCount, 3);
  assert.equal(G678_ALG_L11_ADVANCED3_TRANCHE_D_SPEC
    .candidateModuleMaturity, "private-current-js");
  assert.equal(G678_ALG_L11_ADVANCED3_TRANCHE_D_SPEC.audit.auditP0Count, 0);
  assert.equal(G678_ALG_L11_ADVANCED3_TRANCHE_D_SPEC.audit.auditP1Count, 0);
  assert.equal(G678_ALG_L11_ADVANCED3_TRANCHE_D_SPEC
    .registrationCandidatePlacementCount, 0);
  assert.equal(G678_ALG_L11_ADVANCED3_TRANCHE_D_SPEC
    .currentJavaScriptRegisteredPlacementCount, 0);
  assert.equal(G678_ALG_L11_ADVANCED3_TRANCHE_D_SPEC
    .productCalibrationPassed, false);
  assert.equal(G678_ALG_L11_ADVANCED3_TRANCHE_D_SPEC
    .wholeLessonEngineeringPreviewReady, false);
  assert.equal(G678_ALG_L11_ADVANCED3_TRANCHE_D_SPEC.releaseAuthorized, false);
  assert.equal(G678_ALG_L11_ADVANCED3_TRANCHE_D_SPEC.published, false);
  assert.ok(Object.values(G678_ALG_L11_ADVANCED3_TRANCHE_D_SPEC
    .acceptanceEffects).every((value) => !value));
});

test("p033 selects one level and preserves both exact source handoff arities without executing them", () => {
  let initial = createAlgL11Advanced3ControllerState("initial");
  initial = reduceAlgL11Advanced3Controller(initial,
    {type: "start", input: "mouse"});
  assert.equal(initial.blockedReason, "level-required");
  assert.equal(buildAlgL11Advanced3NavigationIntent(initial), null);
  initial = reduceAlgL11Advanced3Controller(initial,
    {type: "select-level", level: 2, input: "Enter"});
  initial = reduceAlgL11Advanced3Controller(initial,
    {type: "start", input: " "});
  const initialIntent = buildAlgL11Advanced3NavigationIntent(initial);
  assert.deepEqual(initialIntent?.legacyEvidence.arguments, ["L11GS03", 1]);
  assert.equal(initialIntent?.legacyEvidence.executed, false);
  assert.equal(initialIntent?.request.handoff?.level, 2);

  let terminal = createAlgL11Advanced3ControllerState("terminal");
  terminal = reduceAlgL11Advanced3Controller(terminal,
    {type: "select-level", level: 1, input: "mouse"});
  terminal = reduceAlgL11Advanced3Controller(terminal,
    {type: "start", input: "mouse"});
  assert.deepEqual(buildAlgL11Advanced3NavigationIntent(terminal)
    ?.legacyEvidence.arguments, ["L11GS03", 1, 6]);
  terminal = reduceAlgL11Advanced3Controller(terminal,
    {type: "replay", input: "mouse"});
  assert.equal(terminal.level, null);
  assert.equal(terminal.startRequested, false);
  assert.equal(terminal.replay, 1);
});

test("p034 exact 24-card source identity cannot be replaced by text similarity", () => {
  assertAlgL11Advanced3MatchingCards(
    G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS);
  assert.equal(G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS.length, 24);
  for (const level of [1, 2] as const) {
    const cards = G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS
      .filter((card) => card.level === level);
    assert.equal(cards.length, 12);
    for (const pairId of [1, 2, 3, 4, 5, 6]) {
      assert.deepEqual(cards.filter((card) => card.pairId === pairId)
        .map((card) => card.side).sort(), [1, 2]);
    }
  }
  const substituted = G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS
    .map((card, index) => index === 0
      ? {...card, sourceCharacterId: card.sourceCharacterId + 1} : card);
  assert.throws(() => assertAlgL11Advanced3MatchingCards(substituted),
    /exact matching card contract is invalid/);
  const sameLengthWrongToken = G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS
    .map((card, index) => index === 0
      ? {...card, sourceTextTokens: ["10 < x <11"]} : card);
  assert.equal(sameLengthWrongToken[0].sourceTextTokens[0].length,
    G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS[0]
      .sourceTextTokens[0].length);
  assert.throws(() => assertAlgL11Advanced3MatchingCards(
    sameLengthWrongToken), /exact matching card contract is invalid/);
  const wrongSourceHash = G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS
    .map((card, index) => index === 0
      ? {...card, sourceTextSha256s: ["0".repeat(64)]} : card);
  assert.throws(() => assertAlgL11Advanced3MatchingCards(wrongSourceHash),
    /exact matching card contract is invalid/);
});

test("p034 state projection exactly equals the frozen audit values, IDs, characters, and hashes", () => {
  const artifact = JSON.parse(readFileSync(path.join(ROOT,
    "catalog/g678-alg-l11-advanced3-tranche-d-audit-v1.json"), "utf8"));
  const audited = artifact.behaviorContracts.p034MatchingGame.cards.map(
    (card: {level: number; sourceInstanceName: string;
      sourceCharacterId: number; pairId: number; side: number;
      sourceTexts: Array<{textId: number; value: string; sha256: string}>}) => ({
      level: card.level,
      sourceInstanceName: card.sourceInstanceName,
      sourceCharacterId: card.sourceCharacterId,
      pairId: card.pairId,
      side: card.side,
      sourceTextIds: card.sourceTexts.map((text) => text.textId),
      sourceTextTokens: card.sourceTexts.map((text) => text.value),
      sourceTextSha256s: card.sourceTexts.map((text) => text.sha256),
    }));
  const maintained = G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS.map(
    (card) => ({level: card.level,
      sourceInstanceName: card.sourceInstanceName,
      sourceCharacterId: card.sourceCharacterId, pairId: card.pairId,
      side: card.side, sourceTextIds: card.sourceTextIds,
      sourceTextTokens: card.sourceTextTokens,
      sourceTextSha256s: card.sourceTextSha256s}));
  assert.deepEqual(maintained, audited);
});

test("p034 score, disable-feedback boundary, six-pair terminal, level switch, and replay are deterministic", () => {
  let state = createAlgL11Advanced3MatchingState(1);
  const level1 = G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS
    .filter((card) => card.level === 1);
  state = reduceAlgL11Advanced3Matching(state,
    {type: "select-card", cardId: level1[0].id, input: "mouse"});
  state = reduceAlgL11Advanced3Matching(state,
    {type: "select-card", cardId: level1[2].id, input: "mouse"});
  assert.equal(state.score, -2);
  assert.equal(state.phase, "wrong-feedback");
  const blocked = reduceAlgL11Advanced3Matching(state,
    {type: "select-card", cardId: level1[1].id, input: "mouse"});
  assert.equal(blocked.blockedReason, "cards-disabled-during-feedback");
  state = reduceAlgL11Advanced3Matching(state,
    {type: "dismiss-feedback", input: "mouse"});

  for (const pairId of [1, 2, 3, 4, 5, 6]) {
    const pair = level1.filter((card) => card.pairId === pairId);
    state = reduceAlgL11Advanced3Matching(state,
      {type: "select-card", cardId: pair[0].id, input: "mouse"});
    state = reduceAlgL11Advanced3Matching(state,
      {type: "select-card", cardId: pair[1].id, input: "mouse"});
    assert.equal(state.phase, "correct-feedback");
    state = reduceAlgL11Advanced3Matching(state,
      {type: "dismiss-feedback", input: "mouse"});
  }
  assert.equal(state.phase, "complete");
  assert.equal(state.score, 58);
  assert.deepEqual(state.matchedPairIds, [1, 2, 3, 4, 5, 6]);
  state = reduceAlgL11Advanced3Matching(state,
    {type: "switch-level", level: 2, input: "mouse"});
  assert.equal(state.level, 2);
  assert.equal(state.score, 0);
  state = reduceAlgL11Advanced3Matching(state,
    {type: "replay", input: "mouse"});
  assert.equal(state.level, 2);
  assert.equal(state.replay, 1);
});

test("p044 uses deterministic source-shaped random-index/splice selection with 10 unique members", () => {
  const first = selectAlgL11Advanced3AssessmentQuestions(73);
  const second = selectAlgL11Advanced3AssessmentQuestions(73);
  assert.deepEqual(first, second);
  assert.equal(first.length, 10);
  assert.equal(new Set(first).size, 10);
  assert.ok(first.every((question) => question >= 1 && question <= 24));
  assert.notDeepEqual(first, selectAlgL11Advanced3AssessmentQuestions(74));
});

test("p044 answer key is constructed from the exact audit projection with an independent 24-item oracle", () => {
  const expected24 = [
    4, 1, 4, 3, 3, 4, 2, 1, 4, 2, 4, 1,
    3, 4, 2, 4, 3, 2, 3, 1, 4, 3, 2, 1,
  ];
  assert.deepEqual(G678_ALG_L11_ADVANCED3_TRANCHE_D_ANSWER_KEY, expected24);
  const artifact = JSON.parse(readFileSync(path.join(ROOT,
    "catalog/g678-alg-l11-advanced3-tranche-d-audit-v1.json"), "utf8"));
  const auditProjection = artifact.behaviorContracts
    .p044RandomFinalAssessment.answerKey;
  assert.deepEqual(auditProjection,
    G678_ALG_L11_ADVANCED3_TRANCHE_D_AUDIT_ANSWER_KEY_PROJECTION);
  assert.deepEqual(buildAlgL11Advanced3AnswerKeyFromAudit(
    G678_ALG_L11_ADVANCED3_TRANCHE_D_SPEC.audit.sha256, auditProjection),
  expected24);
  const mutated = [...auditProjection];
  mutated[11] = "A12Opt2";
  assert.throws(() => buildAlgL11Advanced3AnswerKeyFromAudit(
    G678_ALG_L11_ADVANCED3_TRANCHE_D_SPEC.audit.sha256, mutated),
  /audit answer-key projection drifted/);
});

test("p044 scores exact answers, derives source grade bands, reviews in presented order, and resamples on replay", () => {
  let state = createAlgL11Advanced3AssessmentState(91);
  const presented = [...state.questionNumbers];
  for (const questionNumber of presented) {
    state = reduceAlgL11Advanced3Assessment(state, {type: "answer",
      option: G678_ALG_L11_ADVANCED3_TRANCHE_D_ANSWER_KEY[questionNumber - 1],
      input: "mouse"}, 91);
  }
  assert.equal(state.phase, "results");
  assert.equal(state.grade, "Advanced");
  assert.equal(state.responses.length, 10);
  assert.deepEqual(state.responses.map((response) => response.questionNumber),
    presented);
  state = reduceAlgL11Advanced3Assessment(state,
    {type: "begin-review", input: "mouse"}, 91);
  assert.equal(state.phase, "review");
  for (let index = 1; index < 10; index += 1) {
    state = reduceAlgL11Advanced3Assessment(state,
      {type: "next-review", input: "mouse"}, 91);
  }
  state = reduceAlgL11Advanced3Assessment(state,
    {type: "finish-review", input: "mouse"}, 91);
  assert.equal(state.phase, "results");
  const replayed = reduceAlgL11Advanced3Assessment(state,
    {type: "replay", input: "mouse"}, 91);
  assert.equal(replayed.replay, 1);
  assert.equal(replayed.responses.length, 0);
  assert.equal(new Set(replayed.questionNumbers).size, 10);
  assert.notDeepEqual(replayed.questionNumbers, presented);
  assert.equal(gradeAlgL11Advanced3Assessment(0), "Unsatisfactory");
  assert.equal(gradeAlgL11Advanced3Assessment(4), "Partially Proficient");
  assert.equal(gradeAlgL11Advanced3Assessment(7), "Proficient");
  assert.equal(gradeAlgL11Advanced3Assessment(9), "Advanced");
  assert.throws(() => gradeAlgL11Advanced3Assessment(11),
    /correct count is invalid/);
});

test("the three modules are implemented private-current-js but remain unregistered with blocked legacy operations", () => {
  assert.deepEqual(G678_ALG_L11_ADVANCED3_TRANCHE_D_CANDIDATE_MODULES
    .map((module) => module.key), [
      "shared-alg001-l11-p033", "shared-alg001-l11-p034",
      "shared-alg001-l11-p044",
    ]);
  for (const module of G678_ALG_L11_ADVANCED3_TRANCHE_D_CANDIDATE_MODULES) {
    assert.equal(module.maturity, "private-current-js");
    assert.equal(module.movie.frameCount, 10);
    assert.equal(module.lessonHost?.legacyOperations, "blocked");
    assert.equal(module.lessonHost?.auditStorage, "memory-only");
    assert.equal(module.lessonHost?.storesPersonalData, false);
    assert.equal(module.audioCues.length, 0);
  }
  assert.deepEqual(G678_ALG_L11_ADVANCED3_TRANCHE_D_P033_CANDIDATE_MODULE
    .lessonHost?.capabilities, ["navigation"]);
  assert.deepEqual(G678_ALG_L11_ADVANCED3_TRANCHE_D_P034_CANDIDATE_MODULE
    .lessonHost?.capabilities, []);
  assert.deepEqual(G678_ALG_L11_ADVANCED3_TRANCHE_D_P044_CANDIDATE_MODULE
    .lessonHost?.capabilities, []);
});

test("candidate renderers disclose the exact non-production boundary and no module imports a registry", () => {
  for (const module of G678_ALG_L11_ADVANCED3_TRANCHE_D_CANDIDATE_MODULES) {
    const html = renderToStaticMarkup(<module.Renderer frame={1}
      frameDomain={module.runtime?.defaultFrameDomain}
      lang="en" scenario="advanced3-tranche-d-unregistered-engineering-candidate"
      seed={17} />);
    assert.match(html, /data-current-javascript-registered="false"/);
    assert.match(html, /data-private-current-js="true"/);
    assert.match(html, /data-product-calibration-passed="false"/);
    assert.match(html, /data-release-authorized="false"/);
    assert.match(html, /data-source-actionscript-executed="false"/);
  }
  const source = readFileSync(path.join(ROOT,
    "packages/demos/src/g678-alg-l11-advanced3-tranche-d-candidates.tsx"),
  "utf8");
  assert.doesNotMatch(source, /registry\.generated|local-only-animation-registry|fetch\s*\(|XMLHttpRequest/u);
});

test("p033 controller render and source-call arity switch only at the audited 604-to-605 boundary", () => {
  assert.equal(resolveAlgL11Advanced3ControllerPhase(1), "initial");
  assert.equal(resolveAlgL11Advanced3ControllerPhase(604), "initial");
  assert.equal(resolveAlgL11Advanced3ControllerPhase(605), "terminal");
  assert.equal(resolveAlgL11Advanced3ControllerPhase(606), "terminal");
  const render = (frame: number) => renderToStaticMarkup(
    <G678_ALG_L11_ADVANCED3_TRANCHE_D_P033_CANDIDATE_MODULE.Renderer
      frame={frame} frameDomain="sprite-116" lang="en"
      scenario="advanced3-tranche-d-unregistered-engineering-candidate"
      seed={17} />);
  assert.match(render(604), /data-source-handoff-arity="2"/);
  assert.match(render(605), /data-source-handoff-arity="3"/);
});
