import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildOriginalRuntimeEnvironmentReadinessReport,
  parseArguments,
  renderMarkdown,
  stableJson,
  validateOriginalRuntimeEnvironmentReadinessReport,
} from "./build-g4-l3-original-runtime-environment-readiness.mjs";

let reportPromise;
function buildOnce() {
  reportPromise ||= buildOriginalRuntimeEnvironmentReadinessReport();
  return reportPromise;
}

test("binds the installed Flash Player 32 candidate and Rosetta without launching either app", async () => {
  const report = await buildOnce();
  assert.equal(report.summary.installedRuntimeCandidates, 1);
  assert.equal(report.installedRuntimeCandidate.version, "32.0.0.414");
  assert.equal(report.installedRuntimeCandidate.executable.sha256,
    "8f4e10c8c28698f3429a1489f9592f6ae5697fb6eb7d15c4cfe83e925b1ebc30");
  assert.match(report.installedRuntimeCandidate.executable.architecture, /x86_64/);
  assert.equal(report.installedRuntimeCandidate.codeSignature.teamIdentifier, "JQ525L2MZD");
  assert.equal(typeof report.installedRuntimeCandidate.codeSignature.strictVerification.passed, "boolean");
  assert.equal(report.executionGate.candidatePassesCurrentStrictCodeSignatureVerification,
    report.installedRuntimeCandidate.codeSignature.strictVerification.passed);
  assert.equal(report.summary.currentStrictCodeSignatureVerificationPassed,
    report.installedRuntimeCandidate.codeSignature.strictVerification.passed);
  assert.equal(report.compatibilityLayer.status, "installed");
  assert.equal(report.compatibilityLayer.hostArchitecture, "arm64");
  assert.equal(report.executionGate.launchesRuntimeByThisBuilder, false);
  assert.equal(report.executionGate.launchesAnimateByThisBuilder, false);
});

test("re-hashes the historical IN009 frame set but leaves current baseline authority at zero", async () => {
  const report = await buildOnce();
  assert.equal(report.historicalCandidates.length, 1);
  assert.equal(report.historicalCandidates[0].animationId, "course-g04-l03-in-009");
  assert.equal(report.historicalCandidates[0].frameCount, 10);
  assert.equal(report.historicalCandidates[0].frames.length, 10);
  assert.equal(report.historicalCandidates[0].currentStrictBaselineAuthority, false);
  assert.equal(report.summary.historicalStandaloneFramesReverified, 10);
  assert.equal(report.summary.authoritativeBaselinePackagesEstablished, 0);
});

test("keeps authorization, host, capacity, runtime, and acceptance gates closed", async () => {
  const report = validateOriginalRuntimeEnvironmentReadinessReport(await buildOnce());
  assert.equal(report.executionGate.runtimeApprovedByOwner, false);
  assert.equal(report.executionGate.namedOriginalRuntimeOperatorSupplied, false);
  assert.equal(report.executionGate.authorizedHostContextIdentified, false);
  assert.equal(report.executionGate.networkContainmentPlanApproved, false);
  assert.equal(report.executionGate.perItemCaptureAuthorized, false);
  assert.equal(report.executionGate.originalRuntimeExecutionReady, false);
  assert.equal(report.capacityBoundary.bulkLessonCaptureAdmitted, false);
  assert.equal(report.capacityBoundary.boundedSessionAdmitted, false);
  assert.equal(report.capacityBoundary.boundSnapshotCapacityPreflightPassed, true);
  assert.equal(report.capacityBoundary.captureExecutionAuthorizedByThisReport, false);
  assert.equal(report.capacityBoundary.remainingEvidenceSafetyMultiplier, 1.20);
  assert.equal(report.capacityBoundary.operationalReserveBytes, 100 * 1024 ** 3);
  assert.equal(report.acceptance.authoritativeOriginalRuntimeAccepted, false);
  assert.equal(report.acceptance.strictMigrationComplete, false);
});

test("validator rejects false authorization or historical promotion", async () => {
  const report = await buildOnce();
  const authorized = structuredClone(report);
  authorized.executionGate.runtimeApprovedByOwner = true;
  assert.throws(() => validateOriginalRuntimeEnvironmentReadinessReport(authorized), /execution gate/);
  const promoted = structuredClone(report);
  promoted.historicalCandidates[0].currentStrictBaselineAuthority = true;
  assert.throws(() => validateOriginalRuntimeEnvironmentReadinessReport(promoted), /Historical standalone/);
  const accepted = structuredClone(report);
  accepted.acceptance.ownerAccepted = true;
  assert.throws(() => validateOriginalRuntimeEnvironmentReadinessReport(accepted), /acceptance state/);
});

test("checked-in JSON and Markdown are deterministic and explicit about candidate-only authority", async () => {
  const report = await buildOnce();
  const [json, markdown] = await Promise.all([
    readFile("reports/g4-l3-original-runtime-environment-readiness.json", "utf8"),
    readFile("reports/g4-l3-original-runtime-environment-readiness.md", "utf8"),
  ]);
  assert.equal(json, stableJson(report));
  assert.equal(markdown, renderMarkdown(report));
  assert.match(markdown, /installed original-runtime \*\*candidate\*\*/);
  assert.match(markdown, /authoritative baseline packages at \*\*0\/40\*\*/);
  assert.doesNotMatch(markdown, /strict migration complete: true/i);
});

test("CLI exposes only report generation and deterministic checking", () => {
  const options = parseArguments(["--check", "--json-output", "reports/a.json", "--markdown-output", "reports/a.md"]);
  assert.equal(options.check, true);
  assert.match(options.jsonOutput, /reports\/a\.json$/);
  assert.match(options.markdownOutput, /reports\/a\.md$/);
  assert.throws(() => parseArguments(["--launch"]), /Unknown option/);
  assert.throws(() => parseArguments(["--authorize"]), /Unknown option/);
});
