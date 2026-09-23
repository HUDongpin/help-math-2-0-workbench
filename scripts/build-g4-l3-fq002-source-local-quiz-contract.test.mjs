import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  OUTPUT_JSON,
  buildFq002SourceLocalQuizContract,
  expectedFq002BranchLabels,
  validateFq002BranchTimeline,
  validateFq002ScriptContract,
} from "./build-g4-l3-fq002-source-local-quiz-contract.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const builtPromise = buildFq002SourceLocalQuizContract();

test("FQ002 source proves 25 paired labels and ten selections without replacement", async () => {
  const {report} = await builtPromise;
  assert.equal(report.status,
    "verified-source-local-random-question-contract-static-branch-atlas-only");
  assert.equal(report.sourceLocalInitialization.answerCount, 25);
  assert.equal(report.sourceLocalInitialization.questionLabelCount, 25);
  assert.equal(report.sourceLocalInitialization.reviewLabelCount, 25);
  assert.equal(report.sourceLocalInitialization.totalQuestionsSelected, 10);
  assert.equal(report.sourceLocalInitialization.randomSelectionWithoutReplacement, true);
  assert.equal(
    report.sourceLocalInitialization.questionReviewPairingUsesSameRandomIndex,
    true,
  );
  assert.equal(report.sourceLocalInitialization.initialSelectionReadsHostState, false);
  assert.equal(report.sourceLocalInitialization.terminalReviewPathUsesHostState, true);
});

test("FQ002 branch atlas is exact and explicitly non-sequential", async () => {
  const {report} = await builtPromise;
  assert.deepEqual(report.branchAtlas.questions,
    {firstFrame: 2, lastFrame: 26, labels: "Q1..Q25"});
  assert.deepEqual(report.branchAtlas.reviewTransition,
    {firstFrame: 27, lastFrame: 43, stopFrame: 43});
  assert.deepEqual(report.branchAtlas.reviews,
    {firstFrame: 44, lastFrame: 68, labels: "R1..R25"});
  assert.equal(report.branchAtlas.labelCount, 52);
  assert.equal(report.branchAtlas.sourceStaticBranchAtlasRenderable, true);
  assert.equal(report.branchAtlas.sequentialPlaybackPermitted, false);
  assert.equal(report.branchAtlas.livePlaybackEndFrame, 1);
  assert.equal(report.branchAtlas.naturalRuntimeTraceEstablished, false);

  const valid = {
    schemaVersion: 1,
    parser: "python-xml.etree.ElementTree",
    targetSprite: {
      objectId: 899,
      declaredFrameCount: 68,
      observedShowFrameCount: 68,
      labels: expectedFq002BranchLabels(),
      actionFrames: [1, 27, 43],
      tagCounts: {DoAction: 3, End: 1, FrameLabel: 52, ShowFrame: 68},
    },
    authorityBoundary: {
      actionScriptExecuted: false,
      naturalRuntimeEstablished: false,
      visualParityEstablished: false,
      audioEstablished: false,
      acceptanceEffect: "none",
    },
  };
  assert.equal(validateFq002BranchTimeline(valid, 899), valid.targetSprite);
  const drifted = structuredClone(valid);
  drifted.targetSprite.labels[27].frame = 43;
  assert.throws(() => validateFq002BranchTimeline(drifted, 899),
    /frame-label atlas changed/);
});

test("FQ002 exact ActionScript contract rejects random-selection drift", async () => {
  const {validation} = await builtPromise;
  const accepted = validateFq002ScriptContract(validation.activeFrameOne);
  assert.equal(accepted.totalQuestionsSelected, 10);
  assert.equal(accepted.questionLabels[0], "Q1");
  assert.equal(accepted.questionLabels.at(-1), "Q25");
  assert.throws(() => validateFq002ScriptContract(
    validation.activeFrameOne.replace(
      "random(_global.quizLabelArray.length)",
      "random(1)",
    ),
  ), /ActionScript body changed/);
});

test("FQ002 source-local contract is reproducible and acceptance-neutral", async () => {
  const built = await builtPromise;
  const checkedIn = await readFile(path.join(ROOT, OUTPUT_JSON), "utf8");
  assert.equal(checkedIn, built.json);
  assert.ok(Object.entries(built.report.acceptance)
    .filter(([name]) => name !== "acceptanceNeutral")
    .every(([, value]) => value === false));
  assert.equal(built.report.acceptance.acceptanceNeutral, true);
  assert.equal(built.report.strictAcceptanceEffect, "none");
  assert.equal(built.report.source.activeSwf.sha256,
    "ab1940815259d7b73f9e9bf6e1f33351e00d3ec02e37286e480806409955882b");
  assert.equal(built.report.source.reviewSwf.sha256,
    "fca2d26467092deeabd15a8f22f8ad2f779dcc0c16f946bb20181d268aaf33bb");
});
