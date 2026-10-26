import assert from "node:assert/strict";
import test from "node:test";

import {
  createTs07AssessmentState,
  reduceTs07Assessment,
  validateTs07AssessmentConfig,
  type Ts07AssessmentConfig,
} from "../src/g678-ts07-assessment";

const config = Object.freeze({
  animationId: "shared-nms002-l01-p043",
  quizStopFrame: 757,
  resumeFrame: 758,
  terminalFrame: 779,
  answers: Object.freeze([
    Object.freeze({ordinal: 1, instanceName: "AnsBtn1", sourceVisualOrder: 1,
      sourceCharacterId: 171,
      label: Object.freeze({en: "36°", es: "36°"}), result: "wrong"}),
    Object.freeze({ordinal: 2, instanceName: "AnsBtn2", sourceVisualOrder: 4,
      sourceCharacterId: 170,
      label: Object.freeze({en: "146°", es: "146°"}), result: "wrong"}),
    Object.freeze({ordinal: 3, instanceName: "AnsBtn3", sourceVisualOrder: 3,
      sourceCharacterId: 172,
      label: Object.freeze({en: "38°", es: "38°"}), result: "right"}),
    Object.freeze({ordinal: 4, instanceName: "AnsBtn4", sourceVisualOrder: 2,
      sourceCharacterId: 171,
      label: Object.freeze({en: "37°", es: "37°"}), result: "wrong"}),
  ]),
  feedbackDomains: Object.freeze([
    Object.freeze({instanceName: "Mc_Wrong_Feed1", sourceObjectId: 186,
      frameDomain: "sprite-186", frameCount: 31, terminalFrame: 31,
      activeAtQuizStop: true, kind: "wrong"}),
    Object.freeze({instanceName: "Mc_Wrong_Feed2", sourceObjectId: 197,
      frameDomain: "sprite-197", frameCount: 29, terminalFrame: 29,
      activeAtQuizStop: true, kind: "wrong"}),
    Object.freeze({instanceName: "Mc_Wrong_Feed3", sourceObjectId: 208,
      frameDomain: "sprite-208", frameCount: 28, terminalFrame: 28,
      activeAtQuizStop: true, kind: "wrong"}),
    Object.freeze({instanceName: "Mc_Right_Feed1", sourceObjectId: 266,
      frameDomain: "sprite-266", frameCount: 25, terminalFrame: 25,
      activeAtQuizStop: true, kind: "right"}),
    Object.freeze({instanceName: "Mc_Right_Feed2", sourceObjectId: 307,
      frameDomain: "sprite-307", frameCount: 27, terminalFrame: 27,
      activeAtQuizStop: true, kind: "right"}),
    Object.freeze({instanceName: "Mc_Right_Feed3", sourceObjectId: 234,
      frameDomain: "sprite-234", frameCount: 31, terminalFrame: 31,
      activeAtQuizStop: true, kind: "right"}),
    Object.freeze({instanceName: "Mc_Right_Feed4", sourceObjectId: 299,
      frameDomain: "sprite-299", frameCount: 27, terminalFrame: 27,
      activeAtQuizStop: true, kind: "right"}),
  ]),
} as const satisfies Ts07AssessmentConfig);

test("TS07 reducer preserves one wrong retry then resumes after attempt two", () => {
  let state = createTs07AssessmentState(config);
  state = reduceTs07Assessment(config, state, {
    type: "choose-answer", answerOrdinal: 1, input: "mouse", seed: 0,
  });
  assert.equal(state.phase, "feedback-active");
  assert.equal(state.activeFeedback?.instanceName, "Mc_Wrong_Feed1");
  assert.equal(state.answerControlsEnabled, false);
  state = reduceTs07Assessment(config, state, {type: "feedback-finished"});
  assert.equal(state.phase, "selecting");
  assert.equal(state.quizTryCount, 1);
  assert.equal(state.answerControlsEnabled, true);

  state = reduceTs07Assessment(config, state, {
    type: "choose-answer", answerOrdinal: 4, input: "Enter", seed: 1,
  });
  assert.equal(state.activeFeedback?.instanceName, "Mc_Wrong_Feed2");
  state = reduceTs07Assessment(config, state, {type: "feedback-finished"});
  assert.deepEqual({phase: state.phase, quizTryCount: state.quizTryCount,
    quizSection: state.quizSection, mainFrame: state.mainFrame,
    mainPlaying: state.mainPlaying}, {
    phase: "resumed", quizTryCount: 0, quizSection: false,
    mainFrame: 758, mainPlaying: true,
  });
});

test("TS07 right answer resolves one of four host branches and resumes", () => {
  let state = createTs07AssessmentState(config);
  state = reduceTs07Assessment(config, state, {
    type: "choose-answer", answerOrdinal: 3, input: " ", seed: 3,
  });
  assert.deepEqual({name: state.activeFeedback?.instanceName,
    branchIndex: state.activeFeedback?.branchIndex,
    branchCount: state.activeFeedback?.branchCount,
    adobeRandomAccepted:
      state.activeFeedback?.authoritativeAdobeRandomStateAccepted}, {
    name: "Mc_Right_Feed4", branchIndex: 4, branchCount: 4,
    adobeRandomAccepted: false,
  });
  state = reduceTs07Assessment(config, state, {type: "feedback-finished"});
  assert.equal(state.phase, "resumed");
  assert.equal(state.mainFrame, 758);
});

test("TS07 hint and Replay reset the complete interaction vector", () => {
  let state = createTs07AssessmentState(config);
  state = reduceTs07Assessment(config, state,
    {type: "open-hint", input: "mouse"});
  assert.equal(state.phase, "hint-open");
  assert.equal(state.answerControlsEnabled, false);
  state = reduceTs07Assessment(config, state,
    {type: "close-hint", input: "Enter"});
  assert.equal(state.phase, "selecting");
  state = reduceTs07Assessment(config, state,
    {type: "replay", input: " "});
  assert.deepEqual(state, {...createTs07AssessmentState(config), replay: 1});
});

test("TS07 reducer rejects a host-selected inactive feedback domain", () => {
  const inactive = {
    ...config,
    feedbackDomains: config.feedbackDomains.map((domain) =>
      domain.instanceName === "Mc_Wrong_Feed1"
        ? {...domain, activeAtQuizStop: false}
        : domain),
  } satisfies Ts07AssessmentConfig;
  const state = reduceTs07Assessment(inactive,
    createTs07AssessmentState(inactive), {
      type: "choose-answer", answerOrdinal: 1, input: "mouse", seed: 0,
    });
  assert.equal(state.phase, "selecting");
  assert.equal(state.blockedReason, "feedback-domain-inactive-at-quiz-stop");
});

test("TS07 config rejects an incomplete 3-wrong/4-right domain set", () => {
  assert.throws(() => validateTs07AssessmentConfig({
    ...config,
    feedbackDomains: config.feedbackDomains.slice(1),
  }), /exact 3-wrong\/4-right source domains/u);
});
