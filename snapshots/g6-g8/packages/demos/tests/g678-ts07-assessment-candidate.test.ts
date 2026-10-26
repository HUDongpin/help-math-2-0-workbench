import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import {createPrivateSourceStaticAssessmentCandidate} from
  "../src/private-source-static-assessment-candidate";
import type {Ts07AssessmentConfig} from "../src/g678-ts07-assessment";
import type {SourceStaticCanvasCandidateConfig} from
  "../src/source-static-canvas-candidate";

const sourceConfig = Object.freeze({
  animationId: "shared-nms002-l01-p043",
  title: "Question 1 — TS07 product slice",
  sourceSwfSha256:
    "c920dfa231eb8d4e1824454df041899f8c1c979b94c0553ef44c527ac81c21df",
  assetSource:
    "/flash-assets/g678-local/shared-nms002-l01-p043/canvas-renderer.js",
  assetSha256: "a".repeat(64),
  stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-331",
  mainFrameCount: 779,
  livePlaybackEndFrame: 779,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: [],
  visualMarkers: [{id: "sprite-331-ffdec-drawing", firstFrame: 1,
    lastFrame: 779}],
  showEngineeringDisclosure: false,
} as const satisfies SourceStaticCanvasCandidateConfig);

const assessment = Object.freeze({
  animationId: sourceConfig.animationId,
  quizStopFrame: 757,
  resumeFrame: 758,
  terminalFrame: 779,
  answers: Object.freeze([
    {ordinal: 1, instanceName: "AnsBtn1", sourceVisualOrder: 1,
      sourceCharacterId: 171,
      label: {en: "36°", es: "36°"}, result: "wrong"},
    {ordinal: 2, instanceName: "AnsBtn2", sourceVisualOrder: 4,
      sourceCharacterId: 170,
      label: {en: "146°", es: "146°"}, result: "wrong"},
    {ordinal: 3, instanceName: "AnsBtn3", sourceVisualOrder: 3,
      sourceCharacterId: 172,
      label: {en: "38°", es: "38°"}, result: "right"},
    {ordinal: 4, instanceName: "AnsBtn4", sourceVisualOrder: 2,
      sourceCharacterId: 171,
      label: {en: "37°", es: "37°"}, result: "wrong"},
  ]),
  feedbackDomains: Object.freeze([
    {instanceName: "Mc_Wrong_Feed1", sourceObjectId: 186,
      frameDomain: "sprite-186", frameCount: 31, terminalFrame: 31,
      activeAtQuizStop: true, kind: "wrong"},
    {instanceName: "Mc_Wrong_Feed2", sourceObjectId: 197,
      frameDomain: "sprite-197", frameCount: 29, terminalFrame: 29,
      activeAtQuizStop: true, kind: "wrong"},
    {instanceName: "Mc_Wrong_Feed3", sourceObjectId: 208,
      frameDomain: "sprite-208", frameCount: 28, terminalFrame: 28,
      activeAtQuizStop: true, kind: "wrong"},
    {instanceName: "Mc_Right_Feed1", sourceObjectId: 266,
      frameDomain: "sprite-266", frameCount: 25, terminalFrame: 25,
      activeAtQuizStop: true, kind: "right"},
    {instanceName: "Mc_Right_Feed2", sourceObjectId: 307,
      frameDomain: "sprite-307", frameCount: 27, terminalFrame: 27,
      activeAtQuizStop: true, kind: "right"},
    {instanceName: "Mc_Right_Feed3", sourceObjectId: 234,
      frameDomain: "sprite-234", frameCount: 31, terminalFrame: 31,
      activeAtQuizStop: true, kind: "right"},
    {instanceName: "Mc_Right_Feed4", sourceObjectId: 299,
      frameDomain: "sprite-299", frameCount: 27, terminalFrame: 27,
      activeAtQuizStop: true, kind: "right"},
  ]),
} as const satisfies Ts07AssessmentConfig);

const feedbackLabels = assessment.feedbackDomains.map((domain) => ({
  instanceName: domain.instanceName,
  labels: {en: domain.kind === "right" ? "Excellent!" : "Try again!",
    es: domain.kind === "right" ? "Excellent!" : "Try again!"},
}));

test("TS07 assessment candidate freezes source stop and host contracts", () => {
  const candidate = createPrivateSourceStaticAssessmentCandidate(sourceConfig, {
    calibrationId: "g678-ts07-nms-l1-product-calibration-v1",
    companionSurfaceId: "shared-nms002-l01-p043-assessment",
    sourceTextLanguage: "en",
    spanishTextParityAccepted: false,
    assessment,
    glossaryTerms: [{id: "difference", sourceKeyAttribute: "Difference",
      sourceCharacterId: 22, firstFrame: 1,
      labels: {en: "Difference", es: "Diferencia"}}],
    feedbackLabels,
    hint: {title: {en: "Need More Help", es: "Need More Help"},
      lines: {en: ["Difference means to subtract."],
        es: ["Difference means to subtract."]}},
  });
  assert.equal(candidate.module.playbackEndFrame, 779);
  assert.deepEqual(candidate.module.interactiveStops, [{
    id: "shared-nms002-l01-p043-quiz-stop",
    frameDomain: "sprite-331",
    stopFrame: 757,
    resumeFrame: 758,
    resolution: "explicit-source-feedback-finished",
    completionDisposition: "blocked-while-unresolved",
    requiresHostInteractiveStop: true,
    strictAcceptanceEffect: "none",
  }]);
  assert.deepEqual(candidate.module.lessonHost?.capabilities,
    ["glossary", "practice-feedback"]);

  const markup = renderToStaticMarkup(React.createElement(candidate.Renderer, {
    frame: 757,
    frameDomain: "sprite-331",
    lang: "en",
    scenario: "source-static-frame",
    seed: 2,
    uiLanguage: "en",
  }));
  assert.match(markup, /data-source-quiz-visual-frame="758"/u);
  assert.match(markup, /data-source-quiz-stop-frame="757"/u);
  assert.match(markup, /data-source-instance="AnsBtn3"/u);
  assert.match(markup, />38°</u);
  assert.match(markup, /data-audio-acceptance="pending"/u);
  assert.match(markup, /data-behavior-parity-established="false"/u);
});

test("TS07 assessment candidate rejects incomplete feedback labels", () => {
  assert.throws(() => createPrivateSourceStaticAssessmentCandidate(sourceConfig, {
    calibrationId: "g678-ts07-nms-l1-product-calibration-v1",
    companionSurfaceId: "shared-nms002-l01-p043-assessment",
    sourceTextLanguage: "en",
    spanishTextParityAccepted: false,
    assessment,
    glossaryTerms: [{id: "difference", sourceKeyAttribute: "Difference",
      sourceCharacterId: 22, firstFrame: 1,
      labels: {en: "Difference", es: "Diferencia"}}],
    feedbackLabels: feedbackLabels.slice(1),
    hint: {title: {en: "Need More Help", es: "Need More Help"},
      lines: {en: ["Difference means to subtract."],
        es: ["Difference means to subtract."]}},
  }), /feedback labels are incomplete/u);
});
