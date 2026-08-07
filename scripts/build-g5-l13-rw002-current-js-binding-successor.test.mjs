import assert from "node:assert/strict";
import test from "node:test";

import {
  EXPECTED_RW002_BINDING_DRIFT,
  buildRw002BindingSuccessorArtifacts,
  parseArguments,
  renderRw002BindingSuccessorMarkdown,
} from "./build-g5-l13-rw002-current-js-binding-successor.mjs";

test("RW002 binding successor parser is fail closed", () => {
  assert.deepEqual(parseArguments([]), {mode: "check"});
  assert.deepEqual(parseArguments(["--build"]), {mode: "build"});
  assert.deepEqual(parseArguments(["--json"]), {mode: "json"});
  assert.throws(() => parseArguments(["--replace"]), /Unknown option/);
});

test("RW002 binding successor reconciles only the exact allowlisted drifts", async () => {
  const {report} = await buildRw002BindingSuccessorArtifacts();
  assert.equal(
    report.predecessorReceipt.sha256,
    "36bde91455ac750990e50ee18ae42c2d13be24c84ee58f3284034eba09628652",
  );
  assert.equal(report.predecessorReceipt.retainedByteForByte, true);
  assert.equal(report.predecessorReceipt.browserObservationsInherited, false);
  assert.deepEqual(
    report.driftSummary.changedRoles,
    Object.keys(EXPECTED_RW002_BINDING_DRIFT),
  );
  assert.equal(report.driftSummary.changedBindingCount, 4);
  assert.equal(report.driftSummary.unexpectedDriftCount, 0);
  assert.equal(
    report.machineChecks.predecessorBrowserObservationsReusedAsCurrent,
    false,
  );
  assert.equal(report.machineChecks.browserQaExecutedForSuccessor, false);
  assert.equal(
    report.changeCharacterization.runtimeHelpers.causalAttributionEstablished,
    false,
  );
  assert.equal(
    Object.values(report.acceptanceEffects).every((value) => value === false),
    true,
  );
  assert.equal(Object.values(report.claims).every((value) => value === false), true);
  assert.equal(report.strictAcceptanceEffect, "none");
  assert.equal("normalPlaybackPage" in report, false);
  assert.equal("deterministicCapturePage" in report, false);
});

test("RW002 binding successor Markdown states the non-inheritance boundary", async () => {
  const {report} = await buildRw002BindingSuccessorArtifacts();
  const markdown = renderRw002BindingSuccessorMarkdown(report);
  assert.match(markdown, /does \*\*not\*\* inherit, relabel, or refresh/);
  assert.match(markdown, /ran no browser QA/);
  assert.match(markdown, /runtimeHelpers.*without causal attribution/s);
  assert.match(markdown, /All acceptance effects remain false/);
});
