import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  DISPOSITIONS,
  EXPECTED_SHELL_SHA256,
  extractStaticCandidates,
  parseArguments,
} from "./build-g4-l3-shell-legacy-host-dependency-contract.mjs";

const testPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(testPath), "..");
const reportPath = path.join(projectRoot, "reports/g4-l3-shell-legacy-host-dependency-contract.json");
const report = JSON.parse(await readFile(reportPath, "utf8"));

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("argument parser supports deterministic check inputs and rejects unknown flags", () => {
  const options = parseArguments(["--check", "--ffdec", "/opt/ffdec", "--root", "."]);
  assert.equal(options.check, true);
  assert.equal(options.ffdec, "/opt/ffdec");
  assert.equal(options.root, path.resolve("."));
  assert.throws(() => parseArguments(["--surprise"]), /Unknown option/);
  assert.throws(() => parseArguments(["--ffdec"]), /requires a value/);
});

test("static extractor excludes unloadMovie and preserves generic loadMovie(url) as unresolved", () => {
  const text = [
    "target.unloadMovie();",
    "target.loadMovie(url);",
    "",
  ].join("\n");
  const candidates = extractStaticCandidates([{
    path: "FScrollPaneSymbol.as",
    text,
    sha256: sha256(text),
  }], new Map([["FScrollPaneSymbol.as", "source-event-0407"]]));
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].api, "loadMovie");
  assert.equal(candidates[0].source.lineNumber, 2);
  assert.equal(candidates[0].source.sourceEventId, "source-event-0407");
  assert.equal(candidates[0].disposition, "unresolved-source-expression");
  assert.equal(candidates[0].runtimeReachabilityEstablished, false);
});

test("checked contract enumerates every exact and observed candidate once", () => {
  assert.equal(report.summary.staticExactCallCount, 20);
  assert.deepEqual(report.summary.staticExactCallsByApi, {
    fscommand: 5,
    getURL: 3,
    loadMovie: 5,
    loadVariablesNum: 3,
    "SharedObject.getLocal": 1,
    "Sound.loadSound": 1,
    "XML.load": 2,
  });
  assert.equal(report.summary.observedRequestCount, 3);
  assert.equal(report.summary.totalCandidateCount, 23);
  assert.equal(new Set(report.candidates.map((candidate) => candidate.candidateId)).size, 23);
  assert.equal(report.summary.candidatesWithoutDisposition, 0);
  assert.ok(report.candidates.every((candidate) => DISPOSITIONS.includes(candidate.disposition)));
});

test("disposition totals retain disabled effects and unresolved evidence boundaries", () => {
  assert.deepEqual(report.summary.candidateCountsByDisposition, {
    "disabled-legacy-side-effect": 12,
    "human-runtime-evidence-required": 2,
    "local-nextjs-navigation-data-candidate": 8,
    "unresolved-source-expression": 1,
  });
  const unresolved = report.candidates.filter((candidate) => candidate.disposition === "unresolved-source-expression");
  assert.equal(unresolved.length, 1);
  assert.equal(unresolved[0].role, "generic-scroll-pane-content-load");
  assert.equal(unresolved[0].source.exactCallText, "_loc1_.loadTemp.loadMovie(url);");
  assert.equal(report.summary.telemetryTaggedCandidateCount, 5);
});

test("physical shell and selected diagnostics remain hash-bound and contained", async () => {
  const shell = await readFile(path.join(projectRoot, report.sourceBindings.shellSwf.path));
  const diagnosticJson = await readFile(path.join(projectRoot, report.sourceBindings.selectedRuffleDiagnosticJson.path));
  const diagnosticPng = await readFile(path.join(projectRoot, report.sourceBindings.selectedRuffleDiagnosticPng.path));
  assert.equal(sha256(shell), EXPECTED_SHELL_SHA256);
  assert.equal(sha256(diagnosticJson), report.sourceBindings.selectedRuffleDiagnosticJson.sha256);
  assert.equal(sha256(diagnosticPng), report.sourceBindings.selectedRuffleDiagnosticPng.sha256);
  assert.equal(report.observedRequests.length, 3);
  assert.ok(report.observedRequests.every((request) => request.blockedBeforeServer === true));
  assert.ok(report.observedRequests.every((request) => request.authoritativeRuntimeEvidence === false));
});

test("product conflict and every acceptance gate remain explicitly unresolved or false", () => {
  assert.equal(report.productNavigationBoundary.activeProductPageCount, 39);
  assert.equal(report.productNavigationBoundary.shellStaticPageCount, 44);
  assert.deepEqual(report.productNavigationBoundary.shellStaticExtrasNotInActiveProductSequence, [
    "VB/L3VB01.swf",
    "IN/L3IN01.swf",
    "TI/L3TI01.swf",
    "GS/L3GS01.swf",
    "TS/L3TS01.swf",
  ]);
  assert.equal(report.productNavigationBoundary.shellStaticConflictResolved, false);
  assert.ok(Object.values(report.acceptance.gates).every((value) => value === false));
  assert.equal(report.acceptance.legacyEndpointExecutions, 0);
  assert.equal(report.acceptance.productionRouteChanges, 0);
  assert.equal(report.acceptance.migrationStatusChanges, 0);
  assert.equal(report.acceptance.completionLedgerChanges, 0);
  assert.equal(report.acceptance.approvalOrReviewChanges, 0);
});
