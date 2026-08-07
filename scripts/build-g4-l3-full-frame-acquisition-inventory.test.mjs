import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  parseArguments,
  renderMarkdown,
  validateReport,
} from "./build-g4-l3-full-frame-acquisition-inventory.mjs";

test("checked-in inventory preserves 40-member, 25/15, zero-invalid, unpublished boundaries", async () => {
  const report = validateReport(JSON.parse(await readFile(
    new URL("../reports/g4-l3-full-frame-acquisition-inventory.json", import.meta.url),
    "utf8",
  )));
  assert.equal(report.items.length, 40);
  assert.equal(report.summary.declaredRequirements, 542);
  assert.equal(report.summary.pendingRequirements, 538);
  assert.equal(report.summary.blockedRequirements, 4);
  assert.equal(report.summary.completeRequirements, 0);
  assert.equal(report.summary.nonAuthoritativeImplementationCaptureMembers, 40);
  assert.equal(report.summary.nonAuthoritativeImplementationCaptureRequirements, 130);
  assert.equal(report.summary.nonAuthoritativeImplementationCapturedFrames, 17098);
  assert.equal(report.summary.authoritativeBaselineRequirements, 0);
  assert.equal(report.summary.pairedMetricRequirements, 0);
  assert.equal(report.summary.shellUnresolvedChildTimelines, 0);
  const ts006 = report.items.find(({animationId}) => animationId === "course-g04-l03-ts-006");
  assert.deepEqual(ts006.currentWorkspace.declaredFrameDomains.map(({id, frameCount}) => ({id, frameCount})), [
    {id: "root", frameCount: 10},
    {id: "sprite-23", frameCount: 128},
  ]);
  assert.equal(ts006.currentWorkspace.requirementCount, 4);
  assert.equal(ts006.currentWorkspace.nonAuthoritativeImplementationCaptures.requirementCount, 1);
  assert.equal(ts006.currentWorkspace.nonAuthoritativeImplementationCaptures.frameCount, 128);
  assert.equal(ts006.acquisitionMatrix.technicalScheduleCandidate.prepared, true);
  assert.equal(ts006.acquisitionMatrix.technicalScheduleCandidate.sessions.length, 2);
  assert.equal(ts006.acquisitionMatrix.technicalScheduleCandidate.accepted, false);
  assert.equal(ts006.acquisitionMatrix.technicalScheduleCandidate.executionAuthorized, false);
  const shell = report.items.find(({animationId}) => animationId === "shell-course-g04-l03-index-local");
  assert.equal(shell.currentWorkspace.nonAuthoritativeImplementationCaptures.requirementCount, 88);
  assert.equal(shell.currentWorkspace.nonAuthoritativeImplementationCaptures.frameCount, 4012);
  assert.equal(report.runtimeAndPromotionGate.captureMayOnlyBeStoredAs, "pending-candidate");
  assert.equal(report.runtimeAndPromotionGate.ts006TechnicalScheduleCandidatePrepared, true);
  assert.equal(report.runtimeAndPromotionGate.ts006TechnicalScheduleAccepted, false);
  assert.match(renderMarkdown(report), /not an authoritative scenario matrix/);
});

test("CLI cannot authorize capture or publication", () => {
  assert.equal(parseArguments(["--check"]).check, true);
  assert.throws(() => parseArguments(["--capture"]), /Unknown option/);
  assert.throws(() => parseArguments(["--publish"]), /Unknown option/);
});
