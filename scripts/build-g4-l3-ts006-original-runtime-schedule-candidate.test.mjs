import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildTs006OriginalRuntimeScheduleCandidate,
  parseArguments,
  renderMarkdown,
  validateTs006OriginalRuntimeScheduleCandidate,
} from "./build-g4-l3-ts006-original-runtime-schedule-candidate.mjs";

let reportPromise;
function buildOnce() {
  reportPromise ||= buildTs006OriginalRuntimeScheduleCandidate();
  return reportPromise;
}

test("TS006 schedule candidate binds two isolated language sessions and all four coverage obligations", async () => {
  const report = await buildOnce();
  assert.deepEqual(report.scheduleCandidate.sessions.map(({language}) => language), ["en", "es"]);
  assert.deepEqual(report.scheduleCandidate.sessions.map(({independentFrameDomainFrames}) => independentFrameDomainFrames), [138, 138]);
  assert.deepEqual(report.scheduleCandidate.sessions.map(({conservativeOriginalRuntimePngUpperBound}) => conservativeOriginalRuntimePngUpperBound), [139, 139]);
  assert.equal(new Set(report.scheduleCandidate.sessions.flatMap(({coverageRequirements}) => coverageRequirements.map(({requirementId}) => requirementId))).size, 4);
  assert.ok(report.scheduleCandidate.sessions.every(({protocolSteps}) => protocolSteps.map(({stepId}) => stepId).join("|") === "P00|P01|P02|P03|P04|P05|P06|P07|P08|P09"));
});

test("TS006 schedule candidate leaves every authority, identity, launch, and acceptance field closed", async () => {
  const report = validateTs006OriginalRuntimeScheduleCandidate(await buildOnce());
  assert.equal(report.authorizationTemplate.owner.fullName, null);
  assert.equal(report.authorizationTemplate.containmentApprover.fullName, null);
  assert.equal(report.authorizationTemplate.originalRuntimeOperators.en.fullName, null);
  assert.equal(report.authorizationTemplate.originalRuntimeOperators.es.fullName, null);
  assert.equal(report.authorizationTemplate.launchCommand, null);
  assert.equal(report.scheduleCandidate.controlApprovalsRecorded, 0);
  assert.equal(report.scheduleCandidate.runtimeSessionsExecuted, 0);
  assert.equal(report.executionGate.originalRuntimeExecutionReady, false);
  assert.ok(Object.values(report.acceptance).every((value) => value === false));
  assert.match(renderMarkdown(report), /non-executable, acceptance-neutral candidate/);
});

test("TS006 schedule candidate validator rejects fabricated approval or execution", async () => {
  const report = await buildOnce();
  const approved = structuredClone(report);
  approved.authorizationTemplate.owner.fullName = "Automation";
  assert.throws(() => validateTs006OriginalRuntimeScheduleCandidate(approved), /authorization template was filled/);
  const executed = structuredClone(report);
  executed.scheduleCandidate.runtimeSessionsExecuted = 1;
  assert.throws(() => validateTs006OriginalRuntimeScheduleCandidate(executed), /authorization counts drifted/);
});

test("checked-in TS006 schedule candidate is deterministic and CLI is fail-closed", async () => {
  const report = await buildOnce();
  const [json, markdown] = await Promise.all([
    readFile("reports/g4-l3-ts006-original-runtime-schedule-candidate.json", "utf8"),
    readFile("reports/g4-l3-ts006-original-runtime-schedule-candidate.md", "utf8"),
  ]);
  assert.equal(json, `${JSON.stringify(report, null, 2)}\n`);
  assert.equal(markdown, renderMarkdown(report));
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--approve"]), /Unknown option/);
});
