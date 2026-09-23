import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildOriginalRuntimeContainmentReadiness,
  parseArguments,
  renderMarkdown,
  stableJson,
  validateOriginalRuntimeContainmentReadiness,
} from "./build-g4-l3-original-runtime-containment-readiness.mjs";

let reportPromise;
function buildOnce() {
  reportPromise ||= buildOriginalRuntimeContainmentReadiness();
  return reportPromise;
}

test("binds all 23 exact external operations and their exact API classes", async () => {
  const report = await buildOnce();
  assert.equal(report.summary.exactExternalOperations, 23);
  assert.deepEqual(report.staticExternalSurface.apiCounts, {
    "SharedObject.getLocal": 1,
    "Sound.loadSound": 1,
    "XML.load": 2,
    fscommand: 5,
    getURL: 6,
    loadMovie: 5,
    loadVariablesNum: 3,
  });
  assert.equal(report.staticExternalSurface.networkCapableOrScriptNavigationOperations, 17);
  assert.equal(report.staticExternalSurface.hostControlOperations, 5);
  assert.equal(report.staticExternalSurface.localPersistentStateOperations, 1);
});

test("identifies exactly the two final-quiz pages and course shell without claiming reachability", async () => {
  const report = await buildOnce();
  assert.deepEqual(report.staticExternalSurface.affectedMembers.map((item) => item.animationId), [
    "course-g04-l03-fq-002",
    "course-g04-l03-fq-003",
    "shell-course-g04-l03-index-local",
  ]);
  assert.deepEqual(report.staticExternalSurface.affectedMembers.map((item) => item.exactExternalOperationCount), [2, 1, 20]);
  assert.ok(report.staticExternalSurface.affectedMembers.every((item) => !item.runtimeReachabilityEstablished));
  assert.ok(report.staticExternalSurface.affectedMembers.flatMap((item) => item.operations)
    .every((operation) => !operation.executionAuthorized));
});

test("specifies eight controls but keeps every selection, approval, and execution gate closed", async () => {
  const report = validateOriginalRuntimeContainmentReadiness(await buildOnce());
  assert.equal(report.containmentPlan.controlsSpecified, 8);
  assert.equal(report.containmentPlan.controlsWithSelectedMechanism, 0);
  assert.equal(report.containmentPlan.controlsApproved, 0);
  assert.equal(report.containmentPlan.controlsVerified, 0);
  assert.equal(report.executionGate.exactExternalSurfaceBound, true);
  assert.equal(report.executionGate.installedRuntimeCandidateBound, true);
  assert.equal(report.executionGate.oneItemPerFreshProcessRequired, true);
  assert.equal(report.executionGate.outboundDenyMechanismSelected, false);
  assert.equal(report.executionGate.namedOriginalRuntimeOperatorSupplied, false);
  assert.equal(report.executionGate.ownerRuntimeApprovalBound, false);
  assert.equal(report.executionGate.originalRuntimeExecutionReady, false);
});

test("validator rejects a selected endpoint, approved control, or opened runtime", async () => {
  const report = await buildOnce();
  const endpoint = structuredClone(report);
  endpoint.containmentPlan.allowedOutboundDestinations.push("https://example.invalid");
  assert.throws(() => validateOriginalRuntimeContainmentReadiness(endpoint), /controls were selected or promoted/);
  const control = structuredClone(report);
  control.containmentPlan.controls[0].approved = true;
  assert.throws(() => validateOriginalRuntimeContainmentReadiness(control), /controls were selected or promoted/);
  const runtime = structuredClone(report);
  runtime.executionGate.originalRuntimeExecutionReady = true;
  assert.throws(() => validateOriginalRuntimeContainmentReadiness(runtime), /containment gate/);
});

test("checked-in JSON and Markdown are deterministic and explicit about zero authorization", async () => {
  const report = await buildOnce();
  const [json, markdown] = await Promise.all([
    readFile("reports/g4-l3-original-runtime-containment-readiness.json", "utf8"),
    readFile("reports/g4-l3-original-runtime-containment-readiness.md", "utf8"),
  ]);
  assert.equal(json, stableJson(report));
  assert.equal(markdown, renderMarkdown(report));
  assert.match(markdown, /8 specified \/ 0 approved/);
  assert.match(markdown, /Runtime sessions and authoritative baselines remain \*\*0\*\*/);
  assert.doesNotMatch(markdown, /strict migration complete: true/i);
});

test("CLI exposes only deterministic report output and rejects launch or approval switches", () => {
  const options = parseArguments(["--check", "--json-output", "reports/a.json", "--markdown-output", "reports/a.md"]);
  assert.equal(options.check, true);
  assert.match(options.jsonOutput, /reports\/a\.json$/);
  assert.match(options.markdownOutput, /reports\/a\.md$/);
  assert.throws(() => parseArguments(["--json-output"]), /requires a value/);
  assert.throws(() => parseArguments(["--launch"]), /Unknown option/);
  assert.throws(() => parseArguments(["--approve"]), /Unknown option/);
});
