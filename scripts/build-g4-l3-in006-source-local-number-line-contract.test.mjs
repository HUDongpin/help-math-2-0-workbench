import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  OUTPUT_JSON,
  buildIn006SourceLocalNumberLineContract,
  parseIn006SourcePairs,
} from "./build-g4-l3-in006-source-local-number-line-contract.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const builtPromise = buildIn006SourceLocalNumberLineContract();
const SOURCE_PAIRS = [
  "-11~-8", "-8~-15", "-15~-4", "-4~5",
  "5~9", "9~15", "15~1", "1~-6",
];

test("IN006 exact source-local question pairs remain ordered and duplicated", () => {
  const literal = SOURCE_PAIRS.map((pair) => JSON.stringify(pair)).join(",");
  assert.deepEqual(parseIn006SourcePairs(
    `arr = new Array(${literal});\narr = new Array(${literal});\n`,
  ), SOURCE_PAIRS);
  assert.throws(() => parseIn006SourcePairs(
    `arr = new Array(${literal});\n`,
  ), /initialization count changed/);
});

test("IN006 terminal quiz contract preserves the source stop boundary", async () => {
  const {report} = await builtPromise;
  assert.equal(report.status,
    "verified-source-local-number-line-quiz-initial-state-and-post-stop-static-frames");
  assert.equal(report.initialQuizState.entryFrame, 1_054);
  assert.equal(report.initialQuizState.livePlaybackEndFrame, 1_054);
  assert.equal(report.initialQuizState.sourceStopAtEntry, true);
  assert.equal(report.initialQuizState.sequentialPlaybackAfterEntryPermitted, false);
  assert.deepEqual(report.structuralEvidence.postStopFrames, [
    {frame: 1_055, tagSequence: ["SoundStreamBlock", "ShowFrame"]},
    {frame: 1_056, tagSequence: ["SoundStreamBlock", "ShowFrame"]},
    {frame: 1_057, tagSequence: ["SoundStreamBlock", "ShowFrame"]},
  ]);
});

test("IN006 deterministic overlay is geometry- and font-bound without AVM1 authority", async () => {
  const {report} = await builtPromise;
  const quiz = report.initialQuizState;
  assert.deepEqual(quiz.sourcePairs, SOURCE_PAIRS);
  assert.equal(quiz.sourceRandomExecuted, false);
  assert.equal(quiz.implementationSeedMapping,
    "seed-modulo-eight-for-deterministic-current-javascript-only-not-injected-into-avm1");
  assert.deepEqual(quiz.numberLine, {
    minimum: -15,
    maximum: 15,
    labelCount: 31,
    firstTickX: 64,
    lastTickX: 739,
    tickY: 319.4,
    tickLength: 9.95,
    tickWidth: 2,
    tickColor: "#0000cc",
    spacing: 22.5,
    labelFontSize: 14,
    labelColor: "#890101",
    labelBaselineY: 342.43047,
    dropFirstX: 59,
    dropLastX: 734,
  });
  assert.equal(quiz.font.functionName, "font3");
  assert.equal(quiz.font.ttfSha256,
    "2c6301244e439f355437371c4265d5070174222dcff3a8721313b3ce0cb507ee");
});

test("IN006 source-local contract is reproducible and acceptance-neutral", async () => {
  const built = await builtPromise;
  const checkedIn = await readFile(path.join(ROOT, OUTPUT_JSON), "utf8");
  assert.equal(checkedIn, built.json);
  assert.equal(built.report.acceptance.acceptanceNeutral, true);
  assert.ok(Object.entries(built.report.acceptance)
    .filter(([name]) => name !== "acceptanceNeutral")
    .every(([, value]) => value === false));
  assert.equal(built.report.strictAcceptanceEffect, "none");
});
