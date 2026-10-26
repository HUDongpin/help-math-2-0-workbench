import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import {
  G678_ALG_L11_BEHAVIOR10_TRANCHE_B_CANDIDATE_MODULES,
} from "../src/g678-alg-l11-behavior10-tranche-b-candidates";
import {
  G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES,
  G678_ALG_L11_BEHAVIOR10_TRANCHE_B_SPEC,
  assertAlgL11Behavior10PageConfigs,
  buildAlgL11Behavior10FeedbackRequest,
  createAlgL11Behavior10State,
  feedbackTextForAlgL11Behavior10,
  reduceAlgL11Behavior10,
} from "../src/g678-alg-l11-behavior10-tranche-b-state";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)),
  "../../..");
const AUDIT = JSON.parse(await readFile(path.join(ROOT,
  "catalog/g678-alg-l11-behavior10-tranche-b-audit-v1.json"), "utf8"));
const DECISION = JSON.parse(await readFile(path.join(ROOT,
  "catalog/g678-alg-l11-behavior10-tranche-b-source-divergence-v1.json"),
"utf8"));

function page(suffix: string) {
  const value = G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES.find((entry) =>
    entry.animationId.endsWith(suffix));
  if (!value) throw new Error(`${suffix}: missing test page`);
  return value;
}

test("exact10 maintained configs are direct audit and divergence projections",
  () => {
    assert.equal(assertAlgL11Behavior10PageConfigs(
      G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES), true);
    assert.equal(G678_ALG_L11_BEHAVIOR10_TRANCHE_B_SPEC.audit.sha256,
      "2b45cee5d1503d9e98521b5ca0518500a29f8bc43a0b1c84145016dccc5289b8");
    assert.equal(G678_ALG_L11_BEHAVIOR10_TRANCHE_B_SPEC
      .divergenceDecision.sha256,
    "e4214120ddff6b052487dd339efb4421bdba88cd0532cf448c8200cf1969a89e");
    assert.deepEqual(G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES.map((config) =>
      config.animationId), AUDIT.selectedPlacementIds);
    for (const config of G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES) {
      const source = AUDIT.members.find((entry: {animationId: string}) =>
        entry.animationId === config.animationId);
      assert.ok(source);
      assert.deepEqual(config.source, {path: source.source.path,
        sha256: source.source.sha256});
      assert.deepEqual([config.mainObjectId, config.frameCount,
        config.quizFrame, config.resumeFrame, config.terminalFrame], [
        source.sourceStateMachine.mainObjectId,
        source.sourceStateMachine.frameCount,
        source.sourceStateMachine.quizFrame,
        source.sourceStateMachine.resumeFrame,
        source.sourceStateMachine.terminalFrame,
      ]);
      assert.deepEqual(config.options.map((choice) => ({id: choice.id,
        sourceInstanceName: choice.sourceInstanceName,
        sourceCharacterId: choice.sourceCharacterId,
        correct: choice.correct})),
      source.answerVisibleGeometryCrosswalk.rows.map((choice: {
        visibleLabel: string; instanceName: string; characterId: number;
        correct: boolean;
      }) => ({id: choice.visibleLabel, sourceInstanceName: choice.instanceName,
        sourceCharacterId: choice.characterId, correct: choice.correct})));
      assert.deepEqual(config.correct,
        source.answerVisibleGeometryCrosswalk.correct);
      assert.deepEqual(config.answerEvidence.frameSvg,
        source.answerVisibleGeometryCrosswalk.frameSvg);
      assert.equal(config.answerEvidence.hitRegionProjectionSha256,
        source.answerVisibleGeometryCrosswalk.hitRegionProjectionSha256);
      assert.equal(config.answerEvidence.visibleLabelTextProjectionSha256,
        source.answerVisibleGeometryCrosswalk
          .visibleLabelTextProjectionSha256);
      assert.deepEqual(config.answerEvidence.specialGeometryConclusion,
        source.answerVisibleGeometryCrosswalk.specialGeometryConclusion);
      assert.deepEqual(config.guidedHits,
        source.sourceStateMachine.guidedHits.map((hit: {
          frame: number; objectId: number; depth: number;
          script: {sha256: string};
        }) => ({frame: hit.frame, objectId: hit.objectId, depth: hit.depth,
          scriptSha256: hit.script.sha256})));
      assert.deepEqual(config.feedbackEndpointCounts, {
        right: source.sourceStateMachine.feedbackEndpoints.right.length,
        wrong: source.sourceStateMachine.feedbackEndpoints.wrong.length,
      });
      assert.deepEqual(config.audioCandidate, {
        path: source.audioCandidate.path, bytes: source.audioCandidate.bytes,
        sha256: source.audioCandidate.sha256, required: null,
        triggerEstablished: false, replayEstablished: false, accepted: false,
      });
      assert.deepEqual({instanceName: config.help.instanceName,
        characterId: config.help.characterId, frameSvg: config.help.frameSvg,
        openButtonId: config.help.openButtonId,
        closeButtonId: config.help.closeButtonId}, {
        instanceName: source.helpPopup.sourceInstanceName,
        characterId: source.helpPopup.characterId,
        frameSvg: source.helpPopup.frameSvg,
        openButtonId: source.helpPopup.openButtonId,
        closeButtonId: source.helpPopup.closeButtonId,
      });
      assert.deepEqual(config.p029Feedback,
        source.sourceStateMachine.p029FeedbackSequence);
      assert.equal(config.audioCandidate.accepted, false);
      assert.equal(config.audioCandidate.required, null);
      assert.equal(config.audioCandidate.triggerEstablished, false);
      assert.equal(config.audioCandidate.replayEstablished, false);
      if (config.help.staleAngleOverlay) {
        const divergence = DECISION.entries.find((entry: {
          animationId: string;
        }) => entry.animationId === config.animationId);
        assert.ok(divergence);
        assert.deepEqual({instanceName:
          config.help.staleAngleOverlay.instanceName,
        characterId: config.help.staleAngleOverlay.characterId,
        frameSvg: config.help.staleAngleOverlay.frameSvg}, {
          instanceName: divergence.sourceEvidence.staleAngleOverlay.instanceName,
          characterId: divergence.sourceEvidence.staleAngleOverlay.characterId,
          frameSvg: divergence.sourceEvidence.staleAngleOverlay.frameSvg,
        });
        assert.equal(config.help.staleAngleOverlay
          .suppressedByMaintainedCandidate, true);
      }
    }
  });

test("generic two-wrong and correct paths require typed host decisions",
  () => {
    const config = page("p026");
    let state = createAlgL11Behavior10State(config, config.quizFrame);
    const wrong = buildAlgL11Behavior10FeedbackRequest(config, "A", 6);
    assert.deepEqual(wrong.request, {type: "record-practice-feedback",
      interactionId: config.animationId, outcome: "incorrect",
      branchIndex: 2, branchCount: 4});
    state = reduceAlgL11Behavior10(config, state, {type: "choose",
      choiceId: "A", input: "mouse", hostAllowed: false,
      feedbackBranch: wrong.branchIndex});
    assert.equal(state.phase, "choosing");
    assert.equal(state.blockedReason, "practice-feedback-host-blocked");
    state = reduceAlgL11Behavior10(config, state, {type: "choose",
      choiceId: "A", input: "mouse", hostAllowed: true,
      feedbackBranch: wrong.branchIndex});
    assert.deepEqual([state.phase, state.quizTryCount],
      ["wrong-feedback-1", 0]);
    state = reduceAlgL11Behavior10(config, state, {type: "dismiss-feedback",
      input: "mouse", hostResetAllowed: false});
    assert.equal(state.phase, "wrong-feedback-1");
    assert.equal(state.blockedReason, "practice-feedback-reset-blocked");
    state = reduceAlgL11Behavior10(config, state, {type: "dismiss-feedback",
      input: "mouse", hostResetAllowed: true});
    assert.deepEqual([state.phase, state.quizTryCount], ["choosing", 1]);
    state = reduceAlgL11Behavior10(config, state, {type: "choose",
      choiceId: "B", input: "keyboard", hostAllowed: true,
      feedbackBranch: 1});
    assert.equal(state.phase, "wrong-feedback-2");
    state = reduceAlgL11Behavior10(config, state, {type: "dismiss-feedback",
      input: "keyboard", hostResetAllowed: true});
    assert.deepEqual([state.phase, state.quizTryCount, state.resolvedStopFrame],
      ["resumed", 0, config.quizFrame]);

    state = createAlgL11Behavior10State(config, config.quizFrame);
    const correct = buildAlgL11Behavior10FeedbackRequest(config, "D", -1);
    assert.deepEqual([correct.request.outcome, correct.branchIndex],
      ["correct", 3]);
    state = reduceAlgL11Behavior10(config, state, {type: "choose",
      choiceId: "D", input: "mouse", hostAllowed: true,
      feedbackBranch: correct.branchIndex});
    assert.equal(state.phase, "right-feedback");
    state = reduceAlgL11Behavior10(config, state, {type: "dismiss-feedback",
      input: "mouse", hostResetAllowed: true});
    assert.equal(state.phase, "resumed");
  });

test("p029 preserves pre-increment popup ordering and second-wrong autoresume",
  () => {
    const config = page("p029");
    let state = createAlgL11Behavior10State(config, config.quizFrame);
    state = reduceAlgL11Behavior10(config, state, {type: "choose",
      choiceId: "A", input: "mouse", hostAllowed: true,
      feedbackBranch: 0});
    assert.deepEqual([state.phase, state.quizTryCount],
      ["wrong-feedback-1", 1]);
    assert.equal(feedbackTextForAlgL11Behavior10(config, state),
      "Find the inequality that has x greater than 5 and less than 8. " +
        "Try again.");
    state = reduceAlgL11Behavior10(config, state, {type: "dismiss-feedback",
      input: "mouse", hostResetAllowed: true});
    assert.deepEqual([state.phase, state.quizTryCount], ["choosing", 1]);
    state = reduceAlgL11Behavior10(config, state, {type: "choose",
      choiceId: "C", input: "mouse", hostAllowed: true,
      feedbackBranch: 1});
    assert.deepEqual([state.phase, state.quizTryCount],
      ["wrong-feedback-2", 2]);
    assert.equal(feedbackTextForAlgL11Behavior10(config, state),
      "Find the inequality that has x greater than 5 and less than 8.");
    state = reduceAlgL11Behavior10(config, state, {type: "dismiss-feedback",
      input: "mouse", hostResetAllowed: true});
    assert.deepEqual([state.phase, state.quizTryCount, state.resolvedStopFrame],
      ["resumed", 0, config.quizFrame]);
  });

test("guided stops, help lifecycle, divergence, and Replay reset are exact",
  () => {
    const config = page("p040");
    const decision = DECISION.entries.find((entry: {animationId: string}) =>
      entry.animationId === config.animationId);
    assert.ok(decision);
    assert.equal(config.guidedHits.length, 5);
    assert.deepEqual([...new Set(config.guidedHits.map((hit) => hit.frame))],
      [338, 497, 629, 753]);
    let state = createAlgL11Behavior10State(config, 338);
    assert.equal(state.phase, "guided-stop");
    state = reduceAlgL11Behavior10(config, state,
      {type: "continue-guided", input: "keyboard"});
    assert.deepEqual([state.phase, state.resolvedStopFrame], ["resumed", 338]);
    state = createAlgL11Behavior10State(config, config.quizFrame);
    state = reduceAlgL11Behavior10(config, state,
      {type: "open-help", input: "mouse"});
    assert.equal(state.phase, "help-open");
    state = reduceAlgL11Behavior10(config, state,
      {type: "close-help", input: "keyboard"});
    assert.equal(state.phase, "choosing");
    state = reduceAlgL11Behavior10(config, state,
      {type: "replay", input: "mouse"});
    assert.deepEqual(state, {phase: "timeline", activeStopFrame: null,
      resolvedStopFrame: null, quizTryCount: 0, selectedChoice: null,
      feedbackBranch: null, blockedReason: null, replay: 1});
    assert.equal(config.correct.visibleLabel, "C");
    assert.equal(config.correct.sourceInstanceName, "AnsBtn1");
    assert.equal(config.help.instanceName, "Mc_Popup");
    assert.equal(config.help.staleAngleOverlay?.suppressedByMaintainedCandidate,
      true);
    assert.equal(decision.decision
      .maintainedCandidateMaySuppressStaleAngleOverlay, true);
    assert.equal(decision.decision.originalRuntimeDispositionEstablished,
      false);
  });

test("p028 and p030 preserve exact mathematical geometry in DOM", () => {
  const render = (suffix: string) => {
    const config = page(suffix);
    const module = G678_ALG_L11_BEHAVIOR10_TRANCHE_B_CANDIDATE_MODULES.find(
      (entry) => entry.key === config.animationId);
    assert.ok(module);
    return renderToStaticMarkup(React.createElement(module.Renderer, {
      frame: config.quizFrame, frameDomain: config.frameDomain,
      scenario: "source-static-frame", lang: "en", uiLanguage: "en",
      seed: 0, paused: false, replay: 0,
      onLessonHostRequest: () => undefined,
    }));
  };
  const graph = render("p028");
  assert.match(graph, /data-math-geometry="x-greater-than-2-open-right-ray"/u);
  assert.match(graph, /data-boundary-closed="false"/u);
  assert.match(graph, /data-ray-direction="right"/u);
  const absolute = render("p030");
  assert.match(absolute, /data-math-geometry="absolute-value-x-less-5"/u);
  assert.match(absolute, /data-absolute-value-bars="2"/u);
  assert.match(absolute, /\|x\| &lt; 5/u);
});

test("all exact10 modules are private DOM candidates with root/main separation",
  () => {
    assert.equal(G678_ALG_L11_BEHAVIOR10_TRANCHE_B_CANDIDATE_MODULES.length,
      10);
    for (const [index, module] of
      G678_ALG_L11_BEHAVIOR10_TRANCHE_B_CANDIDATE_MODULES.entries()) {
      const config = G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES[index];
      assert.equal(module.key, config.animationId);
      assert.equal(module.maturity, "private-current-js");
      assert.equal(module.runtime?.frameCount, 10);
      assert.equal(module.runtime?.fps, 12);
      assert.equal(module.runtime?.defaultFrameDomain, config.frameDomain);
      assert.equal(module.runtime?.frameDomains?.find((domain) =>
        domain.id === config.frameDomain)?.frameCount, config.frameCount);
      assert.equal(module.audioCues.length, 0);
      assert.equal(module.audioTracks, undefined);
      assert.equal(module.interactiveAudioAssets, undefined);
      assert.equal(module.pageAudioCandidates, undefined);
      assert.equal(module.lessonHost?.legacyOperations, "blocked");
      assert.deepEqual(module.lessonHost?.capabilities, ["practice-feedback"]);
      assert.equal(module.interactiveStops?.length,
        config.familyId === "l11-guided-tutorial-choice" ? 5 : 1);
    }
  });

test("SSR exposes implemented DOM but never stale overlay or acceptance claims",
  () => {
    for (const [index, module] of
      G678_ALG_L11_BEHAVIOR10_TRANCHE_B_CANDIDATE_MODULES.entries()) {
      const config = G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES[index];
      const markup = renderToStaticMarkup(React.createElement(module.Renderer,
        {frame: config.quizFrame, frameDomain: config.frameDomain,
          scenario: "source-static-frame", lang: "en", uiLanguage: "en",
          seed: 2, paused: true, replay: 0}));
      assert.match(markup, /data-current-javascript-implemented="true"/u);
      assert.match(markup, /data-dom-renderer-implemented="true"/u);
      assert.match(markup, /data-private-current-js="true"/u);
      assert.match(markup, /data-current-javascript-registered="false"/u);
      assert.match(markup, /data-product-calibration-passed="false"/u);
      assert.match(markup, /data-audio-accepted="false"/u);
      assert.doesNotMatch(markup, /Mc_PopUp/u);
      assert.doesNotMatch(markup, /https?:\/\//u);
    }
  });

test("maintained source never executes legacy calls, network, or audio", async () => {
  const files = [
    "packages/demos/src/g678-alg-l11-behavior10-tranche-b-state.ts",
    "packages/demos/src/g678-alg-l11-behavior10-tranche-b-candidate-core.tsx",
    "packages/demos/src/g678-alg-l11-behavior10-tranche-b-tutorial-candidate.tsx",
    "packages/demos/src/g678-alg-l11-behavior10-tranche-b-guided-candidate.tsx",
    "packages/demos/src/g678-alg-l11-behavior10-tranche-b-candidates.tsx",
  ];
  for (const file of files) {
    const source = await readFile(path.join(ROOT, file), "utf8");
    assert.doesNotMatch(source,
      /fetch\s*\(|XMLHttpRequest|window\.open|\bgetURL\s*\(|\bfscommand\s*\(/u);
    assert.doesNotMatch(source, /_root\.|_global\.|_level0\./u);
    assert.doesNotMatch(source, /play-audio|new Audio\s*\(/u);
    assert.doesNotMatch(source, /registry\.generated|private-current-js-registry/u);
  }
});
