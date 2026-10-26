import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import {
  G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CHOICE_HELP,
  G678_ALG_L11_INTERACTIVE10_TRANCHE_C_PAGES,
  G678_ALG_L11_INTERACTIVE10_TRANCHE_C_SPEC,
} from "../src/g678-alg-l11-interactive10-tranche-c-core";
import {
  G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CANDIDATE_MODULES,
} from "../src/g678-alg-l11-interactive10-tranche-c-candidates";
import p006Generated from
  "../src/modules/g678-alg-l11-interactive10-tranche-c-p006";
import p008Generated from
  "../src/modules/g678-alg-l11-interactive10-tranche-c-p008";
import p009Generated from
  "../src/modules/g678-alg-l11-interactive10-tranche-c-p009";
import p010Generated from
  "../src/modules/g678-alg-l11-interactive10-tranche-c-p010";
import p011Generated from
  "../src/modules/g678-alg-l11-interactive10-tranche-c-p011";
import p014Generated from
  "../src/modules/g678-alg-l11-interactive10-tranche-c-p014";
import p019Generated from
  "../src/modules/g678-alg-l11-interactive10-tranche-c-p019";
import p020Generated from
  "../src/modules/g678-alg-l11-interactive10-tranche-c-p020";
import p021Generated from
  "../src/modules/g678-alg-l11-interactive10-tranche-c-p021";
import p025Generated from
  "../src/modules/g678-alg-l11-interactive10-tranche-c-p025";
import {
  AlgL11Interactive10ChoiceFeedbackStatus,
  AlgL11Interactive10ChoiceHelp,
} from "../src/g678-alg-l11-interactive10-tranche-c-wrappers";
import {
  buildAlgL11Interactive10PracticeFeedbackRequest,
  buildAlgL11Interactive10PracticeFeedbackResetRequest,
  createAlgL11Interactive10ChoiceState,
  createAlgL11Interactive10RandomState,
  createAlgL11Interactive10TwoTryState,
  reduceAlgL11Interactive10Choice,
  reduceAlgL11Interactive10TwoTry,
  resolveAlgL11Interactive10PracticeFeedbackResetStatus,
} from "../src/g678-alg-l11-interactive10-tranche-c-state";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)),
  "../../..");
const AUDIT = JSON.parse(readFileSync(path.join(ROOT,
  "catalog/g678-alg-l11-interactive10-tranche-c-audit-v1.json"), "utf8"));
const SCENARIO = "interactive10-tranche-c-unregistered-engineering-candidate";
const GENERATED_MODULES = Object.freeze([p006Generated, p008Generated,
  p009Generated, p010Generated, p011Generated, p014Generated, p019Generated,
  p020Generated, p021Generated, p025Generated]);

function stableSha(value: unknown) {
  return createHash("sha256").update(Buffer.from(
    `${JSON.stringify(value, null, 2)}\n`)).digest("hex");
}

function count(value: string, expression: RegExp) {
  return [...value.matchAll(expression)].length;
}

function escapeText(value: string) {
  return value.replace(/&/gu, "&amp;").replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;");
}

function common(module: (typeof G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CANDIDATE_MODULES)[number],
  paused = false) {
  return {frame: 1, frameDomain: module.runtime?.defaultFrameDomain ?? "root",
    lang: "en" as const, scenario: SCENARIO, seed: 31, replay: 0, paused,
    onReplay: () => {}};
}

test("maintained core is an exact compact projection of audit4539 source evidence", () => {
  assert.equal(G678_ALG_L11_INTERACTIVE10_TRANCHE_C_SPEC.audit.sha256,
    "45398b11c513b52bac070fd37303376362e2be0e01fe6b0b4710350c86f56578");
  assert.deepEqual(G678_ALG_L11_INTERACTIVE10_TRANCHE_C_PAGES.map((page) =>
    page.animationId), AUDIT.exactPlacementIds);
  for (const config of G678_ALG_L11_INTERACTIVE10_TRANCHE_C_PAGES) {
    const member = AUDIT.members.find((item: {animationId: string}) =>
      item.animationId === config.animationId);
    assert.ok(member);
    assert.deepEqual(config.source, member.source);
    assert.deepEqual(config.mainTimeline, member.exactMainTimeline);
    assert.deepEqual(config.hostCalls, member.hostCalls);
    assert.deepEqual(config.audioCandidate, member.physicalAudioCandidate);
    if (config.sourceContract.kind === "choice-feedback-practice") {
      assert.equal(config.sourceContract.geometrySetSha256,
        member.sourceContract.geometry.geometrySetSha256);
      assert.equal(config.sourceContract.tryMutationModel,
        member.sourceContract.tryMutationModel);
      assert.deepEqual(config.sourceContract.literalTwoAttemptSequence,
        member.sourceContract.literalTwoAttemptSequence);
      const help = G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CHOICE_HELP[
        config.animationId as keyof typeof
          G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CHOICE_HELP];
      if (member.sourceContract.needMoreHelp === null) {
        assert.equal(help, undefined);
        assert.deepEqual(member.sourceContract.needMoreHelpScripts, []);
      } else {
        assert.deepEqual(help, {sourceControlScripts:
          member.sourceContract.needMoreHelpScripts,
        ...member.sourceContract.needMoreHelp});
      }
      for (const option of config.sourceContract.optionSlots) {
        const source = member.sourceContract.geometry.optionSlots.find(
          (item: {slot: string}) => item.slot === option.slot);
        assert.ok(source);
        assert.equal(option.present, source.present);
        if (option.present) {
          assert.equal(option.correct, source.correct);
          assert.deepEqual(option.visibleTextValues, source.visibleTextValues);
          assert.equal(option.geometrySha256, source.geometrySha256);
          assert.equal(option.visibleObjectProjectionSha256,
            stableSha(source.visibleObjects));
        } else {
          assert.deepEqual(option.absence, source.absence);
        }
      }
    } else if (config.sourceContract.kind === "two-try-need-more-help") {
      assert.deepEqual(config.sourceContract.sourceParentChain,
        member.sourceContract.sourceParentChain);
      assert.equal(config.sourceContract.runtimeParentBindingEstablished, false);
    } else {
      assert.deepEqual(config.sourceContract.labelWindows,
        member.sourceContract.labelWindows);
      assert.equal(config.sourceContract.embeddedAudioStructure
        .listeningAcceptancePassed, false);
    }
  }
});

test("p006 deterministic source branch cycles on Replay without playing audio", () => {
  const values = Array.from({length: 4}, (_, replay) =>
    createAlgL11Interactive10RandomState(31, replay));
  assert.equal(new Set(values.map((state) => state.selectedLabel)).size, 4);
  assert.ok(values.every((state) => state.audioPlayed === false));
  assert.deepEqual(values.map((state) => state.replay), [0, 1, 2, 3]);
});

test("all seven choice pages require typed host reset between exact attempts", () => {
  for (const config of G678_ALG_L11_INTERACTIVE10_TRANCHE_C_PAGES) {
    if (config.sourceContract.kind !== "choice-feedback-practice") continue;
    const wrong = config.sourceContract.optionSlots.find((option) =>
      option.present && !option.correct);
    const correct = config.sourceContract.optionSlots.find((option) =>
      option.present && option.correct);
    assert.ok(wrong?.present && correct?.present);
    let state = createAlgL11Interactive10ChoiceState();
    state = reduceAlgL11Interactive10Choice(config, state,
      {type: "select", slot: wrong.slot, input: "mouse", seed: 31});
    assert.equal(state.wrongAttempt, 1);
    assert.equal(state.feedbackText,
      config.sourceContract.literalTwoAttemptSequence[0].text);
    state = reduceAlgL11Interactive10Choice(config, state,
      {type: "dismiss-feedback", input: "mouse", resetStatus: "blocked"});
    assert.equal(state.phase, "wrong-feedback");
    assert.equal(state.hostResetStatus, "blocked");
    const blockedHtml = renderToStaticMarkup(
      <AlgL11Interactive10ChoiceFeedbackStatus state={state} paused={false}
        onDismiss={() => {}}/>);
    assert.match(blockedHtml, /data-host-reset-status="blocked"/u);
    assert.match(blockedHtml, /role="alert"/u);
    assert.ok(blockedHtml.includes(state.feedbackText ?? "missing-feedback"));
    state = reduceAlgL11Interactive10Choice(config, state,
      {type: "dismiss-feedback", input: "mouse", resetStatus: "allowed"});
    assert.equal(state.phase, "choosing");
    const clearedHtml = renderToStaticMarkup(
      <AlgL11Interactive10ChoiceFeedbackStatus state={state} paused={false}
        onDismiss={() => {}}/>);
    assert.doesNotMatch(clearedHtml, /role="alert"/u);
    assert.equal(state.feedbackText, null);
    state = reduceAlgL11Interactive10Choice(config, state,
      {type: "select", slot: wrong.slot, input: "Enter", seed: 31});
    assert.equal(state.wrongAttempt, 2);
    assert.equal(state.feedbackText,
      config.sourceContract.literalTwoAttemptSequence[1].text);
    state = reduceAlgL11Interactive10Choice(config, state,
      {type: "dismiss-feedback", input: "Enter", resetStatus: "allowed"});
    assert.equal(state.phase, "complete");

    state = createAlgL11Interactive10ChoiceState();
    state = reduceAlgL11Interactive10Choice(config, state,
      {type: "select", slot: correct.slot, input: "mouse", seed: 31});
    assert.equal(state.phase, "right-feedback");
    assert.deepEqual(buildAlgL11Interactive10PracticeFeedbackRequest(
      config.animationId, "correct", state.feedbackBranchIndex ?? 0,
      state.feedbackBranchCount ?? 4), {
      type: "record-practice-feedback", interactionId: config.animationId,
      outcome: "correct", branchIndex: state.feedbackBranchIndex,
      branchCount: state.feedbackBranchCount,
    });
    assert.deepEqual(buildAlgL11Interactive10PracticeFeedbackResetRequest(
      config.animationId), {type: "reset-practice-feedback",
      interactionId: config.animationId});
  }
  assert.throws(() => buildAlgL11Interactive10PracticeFeedbackRequest(
    "bad", "correct", 5, 4), /invalid/u);
  assert.throws(() => buildAlgL11Interactive10PracticeFeedbackResetRequest(
    "bad"), /invalid/u);
  assert.equal(resolveAlgL11Interactive10PracticeFeedbackResetStatus(
    undefined), "blocked");
  assert.equal(resolveAlgL11Interactive10PracticeFeedbackResetStatus({
    status: "blocked",
  }), "blocked");
  assert.equal(resolveAlgL11Interactive10PracticeFeedbackResetStatus({
    status: "allowed",
  }), "allowed");
});

test("p011 alone exposes exact source help and resets it on Replay", () => {
  for (const config of G678_ALG_L11_INTERACTIVE10_TRANCHE_C_PAGES) {
    if (config.sourceContract.kind !== "choice-feedback-practice") continue;
    const help = G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CHOICE_HELP[
      config.animationId as keyof typeof
        G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CHOICE_HELP];
    let state = createAlgL11Interactive10ChoiceState();
    if (!help) {
      state = reduceAlgL11Interactive10Choice(config, state,
        {type: "open-help", input: "mouse"});
      assert.equal(state.helpOpen, false);
      assert.equal(state.blockedReason, "help-unavailable");
      continue;
    }
    const helpHtml = renderToStaticMarkup(<AlgL11Interactive10ChoiceHelp
      config={config}/>);
    const scripts = help.sourceControlScripts;
    assert.match(helpHtml, new RegExp(
      `data-source-help-script-count="${scripts.length}"`, "u"));
    for (const script of scripts) assert.ok(helpHtml.includes(script.sha256));
    assert.ok(helpHtml.includes(
      "Use the rules of inequalities to find the solution set."));
    assert.ok(helpHtml.includes("Inequality Rule 3: You can multiply or divide"));
    for (const placement of help.textPlacements) {
      assert.ok(helpHtml.includes(placement.text.sha256));
      assert.ok(helpHtml.includes(placement.definitionSha256));
    }
    const correct = config.sourceContract.optionSlots.find((option) =>
      option.present && option.correct);
    assert.ok(correct?.present);
    state = reduceAlgL11Interactive10Choice(config, state,
      {type: "open-help", input: "mouse"});
    assert.equal(state.helpOpen, true);
    state = reduceAlgL11Interactive10Choice(config, state,
      {type: "select", slot: correct.slot, input: "mouse", seed: 31});
    assert.equal(state.blockedReason, "choice-disabled-during-feedback");
    state = reduceAlgL11Interactive10Choice(config, state,
      {type: "close-help", input: "mouse"});
    assert.equal(state.helpOpen, false);
    state = reduceAlgL11Interactive10Choice(config, state,
      {type: "open-help", input: "mouse"});
    state = reduceAlgL11Interactive10Choice(config, state,
      {type: "replay", input: "mouse"});
    assert.equal(state.helpOpen, false);
    assert.equal(state.phase, "choosing");
  }
});

test("p009 and p010 implement a local two-try parent transition while preserving the original-runtime blocker", () => {
  for (const config of G678_ALG_L11_INTERACTIVE10_TRANCHE_C_PAGES) {
    if (config.sourceContract.kind !== "two-try-need-more-help") continue;
    let state = createAlgL11Interactive10TwoTryState();
    state = reduceAlgL11Interactive10TwoTry(state,
      {type: "open-help", input: "mouse"});
    assert.equal(state.phase, "help-open");
    state = reduceAlgL11Interactive10TwoTry(state,
      {type: "close-help", input: "mouse"});
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      state = reduceAlgL11Interactive10TwoTry(state,
        {type: "open-feedback", input: "mouse"});
      assert.equal(state.nestedFrame, 64);
      state = reduceAlgL11Interactive10TwoTry(state,
        {type: "close-popup", input: "mouse"});
      assert.equal(state.nestedFrame, 65);
      state = reduceAlgL11Interactive10TwoTry(state,
        {type: "advance-local-parent", input: "mouse"});
    }
    assert.equal(state.phase, "complete");
    assert.equal(state.nestedFrame, 70);
    assert.equal(state.tryCount, 2);
    assert.equal(state.originalRuntimeParentBindingEstablished, false);
    assert.equal(config.sourceContract.runtimeParentBindingEstablished, false);
    state = reduceAlgL11Interactive10TwoTry(state,
      {type: "replay", input: "mouse"});
    assert.deepEqual({phase: state.phase, frame: state.nestedFrame,
      count: state.tryCount, replay: state.replay},
    {phase: "ready", frame: 1, count: 0, replay: 1});
  }
});

test("all ten SSR candidates expose exact source choices or state boundaries and stay unregistered", () => {
  const correctVisibleMath: Record<string, string> = {
    "shared-alg001-l11-p008": "−3 < x < 3",
    "shared-alg001-l11-p011": "x ≥ 2",
    "shared-alg001-l11-p014": "age ≥ 16",
    "shared-alg001-l11-p019": "x ≤ 2",
    "shared-alg001-l11-p020": "x ≥ 2",
    "shared-alg001-l11-p021": "x > −5",
    "shared-alg001-l11-p025": "−7 < x < 7",
  };
  for (const [index, module] of
    GENERATED_MODULES.entries()) {
    const config = G678_ALG_L11_INTERACTIVE10_TRANCHE_C_PAGES[index];
    assert.equal(module,
      G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CANDIDATE_MODULES[index]);
    assert.equal(module.key, config.animationId);
    assert.equal(module.maturity, "private-current-js");
    assert.equal(module.audioCues.length, 0);
    const html = renderToStaticMarkup(<module.Renderer {...common(module)} />);
    assert.match(html, /data-private-current-js="true"/);
    assert.match(html, /data-current-javascript-registered="false"/);
    assert.match(html, /data-source-audio-played="false"/);
    assert.doesNotMatch(html, /Mc_PopUp|&#x(?:003c|003e|2260|2264|2265);/iu);
    if (config.sourceContract.kind === "choice-feedback-practice") {
      const present = config.sourceContract.optionSlots.filter((item) =>
        item.present);
      assert.equal(count(html, /data-source-geometry-sha256=/gu),
        present.length);
      assert.ok(html.includes(escapeText(correctVisibleMath[config.animationId])));
      for (const option of present) {
        assert.ok(html.includes(option.geometrySha256));
        assert.ok(html.includes(option.visibleObjectProjectionSha256));
      }
      if (config.animationId === "shared-alg001-l11-p011") {
        assert.match(html, />Need more help<\/button>/u);
      } else {
        assert.doesNotMatch(html, />Need more help<\/button>/u);
      }
    } else if (config.sourceContract.kind === "two-try-need-more-help") {
      assert.match(html,
        /data-original-runtime-parent-binding-established="false"/);
      assert.match(html, /data-maintained-local-parent-transition="true"/);
    } else {
      assert.match(html, /Random source branch: S[1-4]/u);
      assert.match(html, /data-audio-played="false"/);
    }
  }
});

test("pause disables every visible control and Replay does not invent audio", () => {
  for (const module of G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CANDIDATE_MODULES) {
    const html = renderToStaticMarkup(<module.Renderer {...common(module,
      true)} />);
    assert.equal(count(html, /<button/gu), count(html, / disabled=""/gu));
    assert.match(html, /data-runtime-paused="true"/);
    assert.match(html, /data-source-audio-played="false"/);
  }
});

test("candidate sources contain no entity residue, network, storage, audio, legacy, or registry path", () => {
  const files = ["core.ts", "state.ts", "wrappers.tsx", "candidates.tsx"]
    .map((suffix) => path.join(ROOT, "packages/demos/src/" +
      `g678-alg-l11-interactive10-tranche-c-${suffix}`));
  const source = files.map((file) => readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(source, /&#x[0-9a-f]+;|&(?:gt|lt|quot|amp);/iu);
  assert.doesNotMatch(source,
    /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB|Audio)\b/u);
  assert.doesNotMatch(source,
    /registry\.generated|local-only-animation-registry|private-animation-registry/u);
  assert.doesNotMatch(source, /type:\s*["'](?:play-audio|legacy)["']/u);
});

test("module runtime accepts only exact private scenario/domain and preserves every downstream false gate", () => {
  assert.equal(G678_ALG_L11_INTERACTIVE10_TRANCHE_C_SPEC
    .currentJavaScriptImplementedPlacementCount, 10);
  assert.equal(G678_ALG_L11_INTERACTIVE10_TRANCHE_C_SPEC
    .currentJavaScriptRegisteredPlacementCount, 0);
  assert.ok(Object.values(G678_ALG_L11_INTERACTIVE10_TRANCHE_C_SPEC
    .acceptanceEffects).every((value) => value === false));
  for (const module of G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CANDIDATE_MODULES) {
    const domain = module.runtime?.defaultFrameDomain ?? "root";
    assert.equal(module.getFrameState(1, {frame: 1, frameDomain: domain,
      rootFrame: 6, scenario: SCENARIO, lang: "en", seed: 1}).status, "ready");
    const blocked = module.getFrameState(1, {frame: 1, frameDomain: "root",
      rootFrame: 6, scenario: SCENARIO, lang: "en", seed: 1});
    assert.equal(blocked.status, "blocked");
    assert.equal(blocked.currentJavaScriptRegistered, false);
    assert.equal(blocked.productCalibrationPassed, false);
    assert.equal(blocked.audioAccepted, false);
  }
});
