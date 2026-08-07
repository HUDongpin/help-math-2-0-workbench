import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  classifyGate,
  parseArguments,
  renderMarkdown,
  validateReport,
} from "./build-pilot-machine-gap-readiness.mjs";

function gates(...entries) {
  return new Map(entries.map((gate) => [gate.id, gate]));
}

test("passed gates never re-enter the closure queue", () => {
  const gate = {id: "production-build", status: "pass", reasons: []};
  const classified = classifyGate({gate, gatesById: gates(gate), vb004ReviewPending: true});
  assert.equal(classified.closureClass, "passed");
  assert.equal(classified.machineClosableNow, false);
});

test("blocked renderer states require behavior evidence instead of plausible synthesis", () => {
  const gate = {
    id: "implementation-route",
    status: "fail",
    reasons: ["Renderer frame-domain support status is not fully-renderable"],
  };
  const classified = classifyGate({gate, gatesById: gates(gate), vb004ReviewPending: false});
  assert.equal(classified.closureClass, "behavior-specification-evidence-required");
  assert.equal(classified.machineClosableNow, false);
  assert.deepEqual(classified.dependencies, ["source-evidenced-or-original-runtime-behavior"]);
});

test("full-frame and RMSE stay downstream while baseline authority is absent", () => {
  const baseline = {id: "authoritative-baseline", status: "fail", reasons: []};
  const deterministic = {id: "deterministic-frame-contract", status: "pass", reasons: []};
  const fullFrame = {id: "full-frame-scenario-coverage", status: "fail", reasons: []};
  const map = gates(baseline, deterministic, fullFrame);
  const classified = classifyGate({gate: fullFrame, gatesById: map, vb004ReviewPending: false});
  assert.equal(classified.closureClass, "downstream-prerequisite-blocked");
  assert.equal(classified.machineClosableNow, false);
  assert.deepEqual(classified.dependencies, ["authoritative-baseline"]);
});

test("regression gate cannot refresh a protected VB004 review pin", () => {
  const gate = {id: "regression-tests", status: "fail", reasons: ["test receipt is non-zero"]};
  const classified = classifyGate({gate, gatesById: gates(gate), vb004ReviewPending: true});
  assert.equal(classified.closureClass, "protected-review-pin-blocked");
  assert.equal(classified.machineClosableNow, false);
  assert.deepEqual(classified.dependencies, ["fresh-explicit-vb004-semantic-decision"]);
});

test("a genuinely isolated machine defect is surfaced rather than hidden", () => {
  const gate = {id: "implementation-route", status: "fail", reasons: ["component path does not exist"]};
  const classified = classifyGate({gate, gatesById: gates(gate), vb004ReviewPending: false});
  assert.equal(classified.closureClass, "machine-closable-now");
  assert.equal(classified.machineClosableNow, true);
});

test("checked-in inventory covers every pilot and gate without acceptance promotion", async () => {
  const report = validateReport(JSON.parse(await readFile(
    new URL("../reports/pilot-machine-gap-readiness.json", import.meta.url),
    "utf8",
  )));
  assert.equal(report.summary.pilotCount, 16);
  assert.equal(report.summary.workspacesInspected, 16);
  assert.equal(report.summary.gateCells, 240);
  assert.equal(report.summary.passedGateCells, 46);
  assert.equal(report.summary.failedGateCells, 194);
  assert.equal(report.summary.productionBuildPassPilots, 16);
  assert.equal(report.summary.implementationRoutePassPilots, 12);
  assert.equal(report.summary.deterministicFrameContractPassPilots, 10);
  assert.equal(report.summary.machineClosableFailingGateCellsNow, 0);
  assert.equal(report.decision.disposition, "no-safe-machine-only-strict-gate-closure-currently-proven");
  assert.equal(report.authorityBoundary.changesStrictStatus, false);
  assert.equal(report.authorityBoundary.changesAcceptanceRecords, false);
  assert.equal(report.authorityBoundary.changesProtectedVb004Pins, false);
  assert.equal(report.source.protectedVb004ReviewPacket.pendingExplicitNamedHumanDecision, true);
  assert.ok(report.pilots.every((pilot) => pilot.workspaceInspection.manifestSha256MatchesStrictReport));
  assert.ok(report.pilots.every((pilot) => pilot.machineClosableFailingGateIds.length === 0));

  const markdown = renderMarkdown(report);
  assert.match(markdown, /Machine-only failing gate cells proven safely closable now: \*\*0\*\*/);
  assert.match(markdown, /not an acceptance record/);
  assert.match(markdown, /does not refresh that pin/);
});

test("CLI exposes deterministic check mode and rejects unknown options", () => {
  assert.equal(parseArguments(["--check"]).check, true);
  assert.equal(parseArguments(["--json"]).json, true);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

