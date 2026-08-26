import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  OUTPUT_JSON,
  buildTi005SourceLocalPatternQuizContract,
  validateTi005QuizScript,
} from "./build-g4-l3-ti005-source-local-pattern-quiz-contract.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const builtPromise = buildTi005SourceLocalPatternQuizContract();

test("TI005 source quiz parser fails closed when exact source arrays change", () => {
  assert.throws(() => validateTi005QuizScript(
    "_global.qLableArray = [];\n_global.qAnsArray = [];\n" +
    "_global.qFeedBackArray = [];\n",
  ), /ActionScript body changed/);
});

test("TI005 terminal quiz contract preserves the frame-209 source stop", async () => {
  const {report} = await builtPromise;
  assert.equal(report.initialQuizState.entryFrame, 209);
  assert.equal(report.initialQuizState.livePlaybackEndFrame, 209);
  assert.equal(report.initialQuizState.sourceStopAtEntry, true);
  assert.equal(report.initialQuizState.sequentialPlaybackAfterEntryPermitted, false);
  assert.deepEqual(report.structuralEvidence.postStopFrames, [{
    frame: 210,
    tagSequence: ["SoundStreamBlock", "ShowFrame"],
  }]);
});

test("TI005 initial drawing is five-way deterministic without AVM1 authority", async () => {
  const {report} = await builtPromise;
  const quiz = report.initialQuizState;
  assert.equal(quiz.sourceQuestions.length, 5);
  assert.equal(quiz.sourceQuestions[0].label, "-3, -5, -7, -9,");
  assert.equal(quiz.sourceQuestions[4].answers, "-3~-6");
  assert.equal(quiz.implementationSeedMapping,
    "seed-modulo-five-for-deterministic-current-javascript-only-not-injected-into-avm1");
  assert.equal(quiz.sourceRandomExecuted, false);
  assert.equal(quiz.questionText.align, "right");
  assert.equal(quiz.questionText.box.right, 413.55);
  assert.equal(quiz.answerOne.initialText, "");
  assert.equal(quiz.answerTwo.initialText, "");
  assert.deepEqual(quiz.initiallyHiddenClip, {
    name: "Mc_Wrong_Feed",
    objectId: 203,
    functionName: "sprite203",
    depth: 24,
    placement: {x: 399.25, y: 216.75},
    ffdecLocalPlacement: {
      matrix: [0.05, 0, 0, 0.05, -13.15, -66.55],
      frame: 208,
      expectedOccurrenceCount: 2,
    },
    sourceStatement: "Mc_Wrong_Feed._visible = false;",
  });
});

test("TI005 recovered Bauhaus glyphs are pairwise equivalent and acceptance-neutral", async () => {
  const built = await builtPromise;
  const font = built.report.initialQuizState.font;
  assert.equal(font.primaryTtfSha256,
    "375aa51f945f0742a5e7aedc83316cb2e29860471cfdefd0ca58e48a24c5b22e");
  assert.equal(font.digitMinusSupplementTtfSha256,
    "4b8c5b6896d18f56dfe908cec9b602e915e7ffb0dd4e83dce9d99c9d17bc3f11");
  assert.equal(font.commaSupplementTtfSha256,
    "5df6029d20f2fdefbb848f477aba21e3df37cb3a340cceb9b3c521efff9439e9");
  assert.equal(font.allSharedGlyphsEquivalent, true);
  assert.equal(font.deviceFontRuntimeEstablished, false);
  assert.equal(font.glyphs["-"].source,
    "matching-keyterm-digit-minus-supplement");
  assert.equal(font.glyphs[","].source, "matching-g4-comma-supplement");
  assert.equal(await readFile(path.join(ROOT, OUTPUT_JSON), "utf8"), built.json);
  assert.equal(built.report.acceptance.acceptanceNeutral, true);
  assert.ok(Object.entries(built.report.acceptance)
    .filter(([name]) => name !== "acceptanceNeutral")
    .every(([, value]) => value === false));
  assert.equal(built.report.strictAcceptanceEffect, "none");
});
