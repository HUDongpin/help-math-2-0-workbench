import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {link, mkdir, mkdtemp, readFile, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import test from "node:test";

import {
  assertSafeReportOutput,
  buildPairedAuthoringSourceBindingsReport,
  parseArguments,
  renderMarkdown,
  validatePairedAuthoringSourceBindingsReport,
  writeOrCheckReport,
} from "./build-g4-l3-paired-authoring-source-bindings.mjs";

function clone(value) {
  return structuredClone(value);
}

const execFileAsync = promisify(execFile);

test("physically verifies all 29 G4 L3 paired FLA/SWF runner bindings", async () => {
  const report = await buildPairedAuthoringSourceBindingsReport();
  assert.equal(report.items.length, 29);
  assert.equal(report.summary.verifiedBindings, 29);
  assert.equal(report.summary.preparedPhysicalFileCount, 87);
  assert.equal(report.summary.exactMode0444FileCount, 87);
  assert.equal(report.summary.sourceFlaBytes, report.summary.preparedFlaBytes);
  assert.equal(report.summary.sourceSwfBytes, report.summary.preparedSwfBytes);
  assert.ok(report.summary.runArtifactFiles > 0);
  assert.equal(report.summary.authoringAuditsCompleted, 29);
  assert.deepEqual([...new Set(report.items.map((item) => item.batchId))], ["batch-001", "batch-002"]);
  assert.equal(report.inputBindings.historicalPairedSourcePreparationRunner.file,
    "scripts/run-assisted-animate-authoring-audit.mjs");
  assert.equal(report.inputBindings.preparationRunnerIsCurrent, false);
  assert.ok(report.items.every((item) =>
    item.prepared.sourceBindingGenerator.sha256 ===
      report.inputBindings.historicalPairedSourcePreparationRunner.sha256));
});

test("records work-only authoring audits while runtime, review, and strict gates stay closed", async () => {
  const report = validatePairedAuthoringSourceBindingsReport(await buildPairedAuthoringSourceBindingsReport());
  assert.equal(report.authorityBoundary.animateLaunchedByPreparation, false);
  assert.equal(report.authorityBoundary.popupAcknowledgedByPreparation, false);
  assert.equal(report.authorityBoundary.sourceSwfExecuted, false);
  assert.equal(report.authorityBoundary.authoringAuditProved, true);
  assert.equal(report.authorityBoundary.originalRuntimeBaselineProved, false);
  assert.equal(report.authorityBoundary.strictAcceptanceEffect, false);
  assert.equal(report.acceptance.namedHumanDialogStepStillRequired, false);
  assert.equal(report.acceptance.authoringEvidenceReady, true);
  assert.equal(report.acceptance.implementationAuthorized, false);
  assert.equal(report.acceptance.strictMigrationComplete, false);
});

test("retains exact bounded rerun commands without dialog automation", async () => {
  const report = await buildPairedAuthoringSourceBindingsReport();
  for (const item of report.items) {
    const command = item.boundedRerunCommand;
    assert.deepEqual(command.argv.slice(-2), ["--dialog-operator", "Dr. Peter Hu"]);
    assert.equal(command.dialogAutomationAllowed, false);
    assert.equal(command.sourceSwfExecuted, false);
    assert.equal(command.strictAcceptanceEffect, false);
  }
});

test("validator rejects authority promotion and incomplete prepared trees", async () => {
  const report = await buildPairedAuthoringSourceBindingsReport();
  const promoted = clone(report);
  promoted.acceptance.implementationAuthorized = true;
  assert.throws(() => validatePairedAuthoringSourceBindingsReport(promoted), /acceptance state drifted/);
  const runtime = clone(report);
  runtime.authorityBoundary.sourceSwfExecuted = true;
  assert.throws(() => validatePairedAuthoringSourceBindingsReport(runtime), /authority boundary was promoted/);
  const missing = clone(report);
  missing.items[0].prepared.exactTreeFileCount = 2;
  assert.throws(() => validatePairedAuthoringSourceBindingsReport(missing), /tree count or mode/);
});

test("validator binds each prepared file identity and recomputes preparation totals", async () => {
  const report = await buildPairedAuthoringSourceBindingsReport();
  const mutations = [
    ["prepared FLA hash", (copy) => { copy.items[0].prepared.fla.sha256 = "0".repeat(64); }, /differs from its source/],
    ["prepared FLA bytes", (copy) => { copy.items[0].prepared.fla.bytes += 1; }, /differs from its source/],
    ["uppercase source hash", (copy) => { copy.items[0].source.fla.sha256 = copy.items[0].source.fla.sha256.toUpperCase(); }, /source identity shape/],
    ["source-binding shape", (copy) => { copy.items[0].prepared.sourceBinding.unexpected = true; }, /prepared identity shape/],
    ["source-binding hash case", (copy) => { copy.items[0].prepared.sourceBinding.sha256 = copy.items[0].prepared.sourceBinding.sha256.toUpperCase(); }, /prepared identity shape/],
    ["prepared path", (copy) => { copy.items[0].prepared.swf.file += ".moved"; }, /prepared path binding/],
    ["prepared mode", (copy) => { copy.items[0].prepared.fla.mode = "0644"; }, /tree count or mode/],
    ["run artifact count", (copy) => { copy.items[0].prepared.runArtifactFileCount = 1; }, /tree count or mode/],
    ["summary FLA bytes", (copy) => { copy.summary.sourceFlaBytes += 1; }, /summary field sourceFlaBytes/],
    ["summary mode count", (copy) => { copy.summary.exactMode0444FileCount -= 1; }, /summary field exactMode0444FileCount/],
  ];
  for (const [label, mutate, pattern] of mutations) {
    const copy = clone(report);
    mutate(copy);
    assert.throws(() => validatePairedAuthoringSourceBindingsReport(copy), pattern, label);
  }

  const coordinatedBytes = clone(report);
  coordinatedBytes.items[0].source.fla.bytes += 1;
  coordinatedBytes.items[0].prepared.fla.bytes += 1;
  coordinatedBytes.summary.sourceFlaBytes += 1;
  coordinatedBytes.summary.preparedFlaBytes += 1;
  assert.throws(
    () => validatePairedAuthoringSourceBindingsReport(coordinatedBytes),
    /derived totals changed/,
    "coordinated byte/summary mutation",
  );
});

test("validator binds every bounded rerun argv token to the current paired source", async () => {
  const report = await buildPairedAuthoringSourceBindingsReport();
  const argv = report.items[0].boundedRerunCommand.argv;
  assert.deepEqual(argv, [
    "node",
    "scripts/run-assisted-animate-authoring-audit.mjs",
    "--dependency-fla",
    report.items[0].source.fla.file,
    "--evidence-id",
    report.items[0].animationId,
    "--source-sha256",
    report.items[0].source.fla.sha256,
    "--paired-swf",
    report.items[0].source.swf.file,
    "--paired-swf-sha256",
    report.items[0].source.swf.sha256,
    "--dialog-operator",
    "Dr. Peter Hu",
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const mutated = clone(report);
    mutated.items[0].boundedRerunCommand.argv[index] = `${argv[index]}-mutated`;
    assert.throws(
      () => validatePairedAuthoringSourceBindingsReport(mutated),
      /no-save\/no-publish boundary/,
      `argv token ${index} was not bound`,
    );
  }
  const shortened = clone(report);
  shortened.items[0].boundedRerunCommand.argv.pop();
  assert.throws(() => validatePairedAuthoringSourceBindingsReport(shortened), /no-save\/no-publish boundary/);
});

test("validator binds exact no-save/no-publish preconditions on all 29 bounded rerun commands", async () => {
  const report = await buildPairedAuthoringSourceBindingsReport();
  const expected = [
    "No Adobe Animate process is already running.",
    "The named human is present at an unlocked screen for the entire bounded run.",
    "The human may acknowledge only the legacy ActionScript conversion warning popup.",
    "Do not save, publish, export, or acknowledge any other dialog.",
  ];
  assert.ok(report.items.every((item) => JSON.stringify(item.boundedRerunCommand.preconditions) === JSON.stringify(expected)));
  for (let index = 0; index < expected.length; index += 1) {
    const mutated = clone(report);
    mutated.items[0].boundedRerunCommand.preconditions[index] = "Saving and publishing are authorized.";
    assert.throws(
      () => validatePairedAuthoringSourceBindingsReport(mutated),
      /no-save\/no-publish boundary/,
      `precondition ${index} was not bound`,
    );
  }
  const appended = clone(report);
  appended.items[0].boundedRerunCommand.preconditions.push("Export is authorized.");
  assert.throws(() => validatePairedAuthoringSourceBindingsReport(appended), /no-save\/no-publish boundary/);
});

test("Markdown separates completed authoring audits from original-runtime and acceptance authority", async () => {
  const markdown = renderMarkdown(await buildPairedAuthoringSourceBindingsReport());
  assert.match(markdown, /Verified paired bindings: \*\*29\/29\*\*/);
  assert.match(markdown, /completed work-only Animate authoring audits/);
  assert.match(markdown, /work-only authoring audits completed: \*\*29\*\*/);
  assert.doesNotMatch(markdown, /strict migration complete: true/i);
});

test("CLI exposes only deterministic build and check outputs", () => {
  const options = parseArguments(["--check", "--json-output", "reports/a.json", "--markdown-output", "reports/a.md"]);
  assert.equal(options.check, true);
  assert.match(options.jsonOutput, /reports\/a\.json$/);
  assert.match(options.markdownOutput, /reports\/a\.md$/);
  assert.throws(() => parseArguments(["--launch"]), /Unknown option/);
  assert.throws(() => parseArguments(["--dialog-operator", "Codex"]), /Unknown option/);
});

test("report outputs reject links and wrong extensions while check mode never writes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g4-l3-paired-report-output-"));
  try {
    const reports = path.join(root, "reports");
    const outside = path.join(root, "outside");
    await Promise.all([mkdir(reports), mkdir(outside)]);

    const checked = path.join(reports, "checked.json");
    await writeFile(checked, "sentinel\n");
    await writeOrCheckReport(checked, "sentinel\n", {root, extension: ".json", check: true});
    await assert.rejects(
      writeOrCheckReport(checked, "replacement\n", {root, extension: ".json", check: true}),
      /missing or stale/,
    );
    assert.equal(await readFile(checked, "utf8"), "sentinel\n");

    const missing = path.join(reports, "missing.json");
    await assert.rejects(
      writeOrCheckReport(missing, "created\n", {root, extension: ".json", check: true}),
      /missing or stale/,
    );
    await assert.rejects(readFile(missing), {code: "ENOENT"});

    const wrongExtension = path.join(reports, "wrong.txt");
    await writeFile(wrongExtension, "extension sentinel\n");
    await assert.rejects(
      writeOrCheckReport(wrongExtension, "replacement\n", {root, extension: ".json"}),
      /end in \.json/,
    );
    assert.equal(await readFile(wrongExtension, "utf8"), "extension sentinel\n");
    await assert.rejects(
      assertSafeReportOutput(path.join(outside, "outside.json"), {root, extension: ".json"}),
      /inside/,
    );

    const componentSentinel = path.join(outside, "component.json");
    await writeFile(componentSentinel, "component sentinel\n");
    await symlink(outside, path.join(reports, "escape"));
    await assert.rejects(
      writeOrCheckReport(path.join(reports, "escape", "component.json"), "replacement\n", {root, extension: ".json"}),
      /symbolic-link/,
    );
    assert.equal(await readFile(componentSentinel, "utf8"), "component sentinel\n");

    const symlinkSentinel = path.join(outside, "target.json");
    const symlinkOutput = path.join(reports, "target.json");
    await writeFile(symlinkSentinel, "symlink sentinel\n");
    await symlink(symlinkSentinel, symlinkOutput);
    await assert.rejects(
      writeOrCheckReport(symlinkOutput, "replacement\n", {root, extension: ".json"}),
      /symbolic-link/,
    );
    assert.equal(await readFile(symlinkSentinel, "utf8"), "symlink sentinel\n");

    const hardlinkSentinel = path.join(outside, "hardlink.json");
    const hardlinkOutput = path.join(reports, "hardlink.json");
    await writeFile(hardlinkSentinel, "hardlink sentinel\n");
    await link(hardlinkSentinel, hardlinkOutput);
    await assert.rejects(
      writeOrCheckReport(hardlinkOutput, "replacement\n", {root, extension: ".json"}),
      /hard-linked/,
    );
    assert.equal(await readFile(hardlinkSentinel, "utf8"), "hardlink sentinel\n");
    assert.equal(await readFile(hardlinkOutput, "utf8"), "hardlink sentinel\n");

    const fifoOutput = path.join(reports, "fifo.json");
    await execFileAsync("mkfifo", [fifoOutput]);
    await assert.rejects(
      writeOrCheckReport(fifoOutput, "replacement\n", {root, extension: ".json"}),
      /regular file/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
