import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const PACKET = new URL("../reports/g678-review-packet-v4-20260901.json", import.meta.url);

test("G6-G8 review packet contains every blocked external gate without acceptance effects", async () => {
  const packet = JSON.parse(await readFile(PACKET, "utf8"));
  assert.equal(packet.artifactType, "help-math-g678-review-packet");
  assert.equal(packet.overallStatus, "blocked-at-external-human-authority-gates");
  assert.equal(packet.conflicts.records.length, 46);
  assert.equal(packet.conflicts.completedDecisionCount, 0);
  assert.equal(packet.geoAlternate.records.length, 59);
  assert.equal(packet.geoAlternate.differingShaCount, 33);
  assert.equal(packet.geoAlternate.completedDecisionCount, 0);
  assert.equal(packet.dependencies.holdCount, 92);
  assert.equal(packet.dependencies.uniqueReferenceCount, 28);
  assert.equal(packet.audio.groupedFqEaCandidates, 5562);
  assert.equal(packet.audio.status, "candidate-index-only");
  assert.equal(packet.calibration.placements.length, 16);
  assert.equal(packet.calibration.manualReviewCompleted, false);
  assert.equal(packet.calibration.scaleOutDecision, "NO-GO-scale-out");
  assert.ok(packet.conflicts.records.every((record) => record.decisionStatus === "pending-independent-source-choice-review"));
  assert.ok(packet.geoAlternate.records.every((record) => record.reviewStatus === "pending-source-choice-review"));
  assert.ok(packet.acceptanceEffects && Object.values(packet.acceptanceEffects).every((value) => value === false));
});
