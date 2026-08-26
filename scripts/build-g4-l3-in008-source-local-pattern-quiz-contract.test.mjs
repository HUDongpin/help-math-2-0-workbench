import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  OUTPUT_JSON,
  buildIn008SourceLocalPatternQuizContract,
  validateIn008QuizScript,
} from "./build-g4-l3-in008-source-local-pattern-quiz-contract.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const builtPromise = buildIn008SourceLocalPatternQuizContract();

test("IN008 source quiz parser fails closed when exact source arrays change", () => {
  assert.throws(() => validateIn008QuizScript(
    "_global.qLableArray = [];\n_global.qAnsArray = [];\n" +
    "_global.qFeedBackArray = [];\n",
  ), /ActionScript body changed/);
});

test("IN008 terminal quiz contract preserves the frame-216 source stop", async () => {
  const {report} = await builtPromise;
  assert.equal(report.initialQuizState.entryFrame, 216);
  assert.equal(report.initialQuizState.livePlaybackEndFrame, 216);
  assert.equal(report.initialQuizState.sourceStopAtEntry, true);
  assert.equal(report.initialQuizState.sequentialPlaybackAfterEntryPermitted, false);
  assert.deepEqual(report.structuralEvidence.postStopFrames, [{
    frame: 217,
    tagSequence: ["DoAction", "SoundStreamBlock", "ShowFrame"],
  }]);
});

test("IN008 initial drawing is five-way deterministic without AVM1 authority", async () => {
  const {report} = await builtPromise;
  const quiz = report.initialQuizState;
  assert.equal(quiz.sourceQuestions.length, 5);
  assert.equal(quiz.sourceQuestions[0].label, "10, 5, 0, -5,");
  assert.equal(quiz.sourceQuestions[4].answers, "0~-4");
  assert.equal(quiz.implementationSeedMapping,
    "seed-modulo-five-for-deterministic-current-javascript-only-not-injected-into-avm1");
  assert.equal(quiz.sourceRandomExecuted, false);
  assert.equal(quiz.questionText.align, "right");
  assert.equal(quiz.questionText.box.right, 397.55);
  assert.equal(quiz.answerOne.initialText, "");
  assert.equal(quiz.answerTwo.initialText, "");
  assert.deepEqual(quiz.initiallyHiddenClip, {
    name: "Mc_Wrong_Feed",
    objectId: 52,
    functionName: "sprite52",
    depth: 38,
    placement: {x: 400.25, y: 216.75},
    sourceStatement: "Mc_Wrong_Feed._visible = false;",
  });
});

test("IN008 recovered Bauhaus glyphs are same-lesson and acceptance-neutral", async () => {
  const built = await builtPromise;
  const font = built.report.initialQuizState.font;
  assert.equal(font.primaryTtfSha256,
    "e56576cfc2c17204e624b1478586982ccc037ee8d117a7d169755ec8c0d690d8");
  assert.equal(font.sameLessonSupplementTtfSha256,
    "2c6301244e439f355437371c4265d5070174222dcff3a8721313b3ce0cb507ee");
  assert.equal(font.sharedGlyphsEquivalent, true);
  assert.equal(font.glyphs["3"].source, "same-lesson-in006-supplement");
  assert.equal(font.glyphs[","].source, "in008-primary-subset");
  assert.equal(await readFile(path.join(ROOT, OUTPUT_JSON), "utf8"), built.json);
  assert.equal(built.report.acceptance.acceptanceNeutral, true);
  assert.ok(Object.entries(built.report.acceptance)
    .filter(([name]) => name !== "acceptanceNeutral")
    .every(([, value]) => value === false));
  assert.equal(built.report.strictAcceptanceEffect, "none");
});
