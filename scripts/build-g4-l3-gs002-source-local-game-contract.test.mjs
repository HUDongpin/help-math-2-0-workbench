import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  OUTPUT_JSON,
  buildGs002SourceLocalGameContract,
  validateGs002GameScript,
} from "./build-g4-l3-gs002-source-local-game-contract.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const builtPromise = buildGs002SourceLocalGameContract();

test("GS002 game parser fails closed when the exact source script changes", () => {
  assert.throws(() => validateGs002GameScript(
    "_global.arrayCoupLocY = [];\n_global.arrayVirusLocY = [];\n",
  ), /ActionScript body changed/);
});

test("GS002 game contract preserves the frame-427 source stop boundary", async () => {
  const {report} = await builtPromise;
  assert.equal(report.initialGameState.entryFrame, 427);
  assert.equal(report.initialGameState.livePlaybackEndFrame, 427);
  assert.equal(report.initialGameState.sourceStopAtEntry, true);
  assert.equal(report.initialGameState.sequentialPlaybackAfterEntryPermitted,
    false);
  assert.equal(report.structuralEvidence.postStopFrames[0].frame, 428);
  assert.deepEqual(report.structuralEvidence.postStopFrames[0].tagSequence, [
    "RemoveObject2", "PlaceObject2", "PlaceObject2", "PlaceObject2",
    "PlaceObject2", "PlaceObject2", "SoundStreamBlock", "ShowFrame",
  ]);
});

test("GS002 initial drawing is fourteen-way deterministic without AVM1 authority", async () => {
  const {initialGameState: game} = (await builtPromise).report;
  assert.equal(game.coupLocations.length, 15);
  assert.equal(game.virusLocations.length, 15);
  assert.deepEqual(game.allowedVirusIndices,
    [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14]);
  assert.equal(game.coupIndex, 7);
  assert.equal(game.sourceCoupY, -4.1);
  assert.equal(game.virusLocations[game.coupIndex], game.sourceCoupY);
  assert.equal(game.implementationSeedMapping,
    "seed-modulo-fourteen-selects-allowed-virus-index-for-deterministic-current-javascript-only-not-injected-into-avm1");
  assert.equal(game.sourceRandomExecuted, false);
  assert.equal(game.postStopStaticInspectionCarriesInitializedPositions, true);
  assert.equal(game.initialTimerDisplayText, "00:00:00");
  assert.equal(game.initialScoreDisplayText, "0");
  assert.equal(game.dynamicTextDrawing.timer.sourceFont.name, "Arial");
  assert.equal(game.dynamicTextDrawing.timer.sourceFont.glyphCount, 0);
  assert.equal(game.dynamicTextDrawing.score.sourceFont.name, "Bauhaus Md BT");
  assert.equal(game.dynamicTextDrawing.score.sourceFont.glyphCount, 0);
  assert.deepEqual(game.dynamicTextDrawing.score.framePlacements.map(
    ({frame, centerX, baselineY}) => ({frame, centerX, baselineY})), [
    {frame: 427, centerX: 268.9, baselineY: 153.1},
    {frame: 428, centerX: 265.9, baselineY: 171.1},
  ]);
});

test("GS002 source-local game contract is reproducible and acceptance-neutral", async () => {
  const built = await builtPromise;
  assert.equal(await readFile(path.join(ROOT, OUTPUT_JSON), "utf8"), built.json);
  assert.equal(built.report.sourceContract.sourceFrame428NavigationEstablished,
    false);
  assert.equal(built.report.acceptance.acceptanceNeutral, true);
  assert.ok(Object.entries(built.report.acceptance)
    .filter(([name]) => name !== "acceptanceNeutral")
    .every(([, value]) => value === false));
  assert.equal(built.report.strictAcceptanceEffect, "none");
});
