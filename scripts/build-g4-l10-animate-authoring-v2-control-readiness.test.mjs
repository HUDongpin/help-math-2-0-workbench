import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  assertG4L10AnimateAuthoringV2ControlReadinessReport,
  buildG4L10AnimateAuthoringV2ControlReadiness,
  parseArguments,
  writeOrCheckReport,
} from "./build-g4-l10-animate-authoring-v2-control-readiness.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const JSON_REPORT = path.join(ROOT,
  "reports/g4-l10-animate-authoring-v2-control-readiness.json");
const MARKDOWN_REPORT = path.join(ROOT,
  "reports/g4-l10-animate-authoring-v2-control-readiness.md");

test("CLI is deterministic and exposes only help or write-free --check", () => {
  assert.deepEqual(parseArguments([]), {check: false, help: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true, help: false});
  assert.deepEqual(parseArguments(["--help"]), {check: false, help: true});
  for (const argv of [
    ["--check", "--check"],
    ["--help", "--check"],
    ["--root", ROOT],
    ["--now", "2026-01-01T00:00:00.000Z"],
    ["--animate-binary", "/tmp/fake"],
  ]) assert.throws(() => parseArguments(argv), /only once|cannot be combined|unknown option/u);
});

test("actual readiness build revalidates the exact zero-admission L10 control baseline without writes", async () => {
  const before = await Promise.all([stat(JSON_REPORT), stat(MARKDOWN_REPORT)]);
  const result = await buildG4L10AnimateAuthoringV2ControlReadiness({persist: false});
  const after = await Promise.all([stat(JSON_REPORT), stat(MARKDOWN_REPORT)]);
  assert.deepEqual(after.map(({size, mtimeMs}) => ({size, mtimeMs})),
    before.map(({size, mtimeMs}) => ({size, mtimeMs})));
  assert.equal(result.report.release.memberCount, 47);
  assert.equal(result.report.release.flaBackedCount, 34);
  assert.equal(result.report.release.swfOnlyCount, 13);
  assert.equal(result.report.fixedInputs.queue.sha256,
    "fe7a034a62ad79cfa9d37fb34c2d761233f59e5b55f91ece56822983f9999725");
  assert.equal(result.report.fixedInputs.staging.sha256,
    "1266c971b6c2651187e18e37fa7654070aecec1db84e91102b6c6be96399bf57");
  assert.equal(result.report.fixedInputs.sourceFreeze.sha256,
    "f0a33c8a3d15afd7340e9ea5523385428bae7546bd8d4227a3a8977ab8914318");
  assert.equal(result.report.diagnosticClosure.moduleCount, 7);
  assert.equal(result.report.diagnosticClosure.actualBuildPerformedByThisBuilder, true);
  assert.equal(result.report.diagnosticClosure.replayLockHelperAuthority,
    "diagnostic-project-fixture");
  assert.equal(result.report.diagnosticClosure.diagnosticReplayHelper.executed, false);
  assert.equal(result.report.productionClosure.buildableNow, false);
  assert.equal(result.report.nativeCapability.enabled, false);
  assert.deepEqual({
    assignment: result.report.receiptInventory.assignmentReceipts,
    authorization: result.report.receiptInventory.authorizationReceipts,
    closure: result.report.receiptInventory.productionClosureReceipts,
    operator: result.report.receiptInventory.namedOperators,
    runs: result.report.receiptInventory.runReceipts,
  }, {assignment: 0, authorization: 0, closure: 0, operator: 0, runs: 0});
  assert.equal(result.report.resultIndexAdmission.enabled, false);
  assert.equal(result.report.admission.admitted, false);
  assert.equal(Object.values(result.report.evidenceEffects)
    .every((value) => value === 0 || value === false), true);
  assertG4L10AnimateAuthoringV2ControlReadinessReport(result.report);
});

test("report contract fails closed on admission, receipt, closure, or evidence-effect promotion", async () => {
  const baseline = JSON.parse(await readFile(JSON_REPORT, "utf8"));
  for (const mutate of [
    (value) => { value.admission.admitted = true; },
    (value) => { value.receiptInventory.runReceipts = 1; },
    (value) => { value.productionClosure.buildableNow = true; },
    (value) => { value.nativeCapability.enabled = true; },
    (value) => { value.evidenceEffects.currentJavaScript = 1; },
    (value) => { value.evidenceEffects.migrationCompletion = 1; },
    (value) => { value.blockers[0].satisfied = true; },
    (value) => { value.blockers[0].requirement = "weakened"; },
    (value) => { value.diagnosticClosure.modules.pop(); },
    (value) => { value.resultIndexAdmission.authorityBoundary.originalRuntimeBehavior = true; },
    (value) => { value.determinism.checkedAt = "2026-01-01T00:00:00.000Z"; },
  ]) {
    const candidate = structuredClone(baseline);
    mutate(candidate);
    assert.throws(() => assertG4L10AnimateAuthoringV2ControlReadinessReport(candidate),
      /admission|receipt|production closure|native launch|advanced|blocker|diagnostic|result-index|time drift/u);
  }
});

test("exact report check is write-free and rejects stale or absent output", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "g4-l10-v2-readiness-check-"));
  try {
    const reports = path.join(temporary, "reports");
    const target = path.join(reports, "fixture.json");
    const expected = Buffer.from("{\"ok\":true}\n");
    await mkdir(reports);
    await writeFile(target, expected);
    const before = await stat(target);
    await writeOrCheckReport(temporary, "reports/fixture.json", expected, true);
    const after = await stat(target);
    assert.deepEqual(
      {size: after.size, mtimeMs: after.mtimeMs, ctimeMs: after.ctimeMs},
      {size: before.size, mtimeMs: before.mtimeMs, ctimeMs: before.ctimeMs},
    );
    await writeFile(target, "stale\n");
    await assert.rejects(
      writeOrCheckReport(temporary, "reports/fixture.json", expected, true),
      /stale/u,
    );
    await unlink(target);
    await assert.rejects(
      writeOrCheckReport(temporary, "reports/fixture.json", expected, true),
      /ENOENT|no such file/iu,
    );
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
});

test("builder source contains no process-launch or Git execution primitive", async () => {
  const source = await readFile(path.join(ROOT,
    "scripts/build-g4-l10-animate-authoring-v2-control-readiness.mjs"), "utf8");
  assert.doesNotMatch(source, /from "node:child_process"|\bspawn\s*\(|\bexecFile\s*\(|\bgit\s+(?:status|diff|add|commit)|--run-jsfl/u);
  assert.match(source, /stageAnimateReleaseFlaCopies\([\s\S]*check: true/u);
  assert.match(source, /buildLessonAnimateExecutionCodeClosureManifest\(/u);
  assert.match(source, /resultIndexSource\.includes\("const PASSING_RECEIPT_ADMISSION_ENABLED = false;"\)/u);
});
