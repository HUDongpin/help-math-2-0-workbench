import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { evaluatePilot } from "./build-pilot-strict-acceptance.mjs";
import {
  bindPilotVerificationRecords,
  bindPilotBuildVerificationRecords,
  checkPilotBuildVerificationRecords,
  checkPilotVerificationRecords,
  loadPreRecordedVerificationCommands,
  parseArguments,
  runBuildVerificationCommand,
  runRequiredVerificationCommands,
} from "./refresh-pilot-verification.mjs";

async function fixture({ testExitCode = 0, buildExitCode = 0 } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "pilot-verification-"));
  const migrationsRoot = path.join(root, "migrations");
  const pilot = { id: "pilot-01" };
  const workspace = path.join(migrationsRoot, pilot.id);
  await mkdir(path.join(workspace, "evidence"), { recursive: true });
  await mkdir(path.join(root, "source-assets"), { recursive: true });
  await writeFile(path.join(root, "package.json"), `${JSON.stringify({
    name: "pilot-verification-fixture",
    private: true,
    scripts: {
      test: `node -e \"console.log('real test output'); process.exit(${testExitCode})\"`,
      build: `node -e \"console.log('real build output'); process.exit(${buildExitCode})\"`,
    },
  }, null, 2)}\n`);
  await writeFile(path.join(workspace, "migration.json"), `${JSON.stringify({
    schemaVersion: 2,
    id: pilot.id,
    animationId: pilot.id,
    status: "preserved",
    acceptance: {
      humanVisualReview: { decision: "pending" },
      ownerReview: { decision: "pending" },
    },
  }, null, 2)}\n`);
  return { root, migrationsRoot, pilot, workspace };
}

test("parses execution, pre-recorded, and check modes explicitly", () => {
  const run = parseArguments(["--output-root", "reports/runs", "--json"]);
  assert.equal(run.outputRoot, path.resolve("reports/runs"));
  assert.equal(run.json, true);
  assert.equal(Object.hasOwn(run, "pilots"), false);
  const recorded = parseArguments(["--from-results", "receipt.json"]);
  assert.equal(recorded.preRecordedResultsFile, path.resolve("receipt.json"));
  assert.throws(() => parseArguments(["--check", "--from-results", "receipt.json"]), /cannot be combined/);
  const buildOnly = parseArguments(["--build-only", "--pilot", "pilot-01", "--pilot", "pilot-02"]);
  assert.deepEqual(buildOnly.buildPilots, [{ id: "pilot-01" }, { id: "pilot-02" }]);
  assert.throws(() => parseArguments(["--build-only"]), /requires at least one/);
  assert.throws(() => parseArguments(["--pilot", "pilot-01"]), /only with --build-only/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("build-only refresh runs one build, preserves an authentic failing test, and advances only the production-build gate", async () => {
  const { root, migrationsRoot, pilot, workspace } = await fixture({ testExitCode: 3, buildExitCode: 0 });
  try {
    const initialRun = await runRequiredVerificationCommands({
      projectRoot: root,
      outputRoot: path.join(root, "reports", "runs"),
      runId: "initial-failing-test",
    });
    await bindPilotVerificationRecords({
      projectRoot: root,
      migrationsRoot,
      pilots: [pilot],
      expectedPilotCount: 1,
      commandRun: initialRun,
    });
    const verificationPath = path.join(workspace, "evidence", "verification.json");
    const before = JSON.parse(await readFile(verificationPath, "utf8"));
    const preservedTest = structuredClone(before.commands.test);

    const manifestPath = path.join(workspace, "migration.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.note = "make the prior verification manifest binding stale";
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const buildRun = await runBuildVerificationCommand({
      projectRoot: root,
      outputRoot: path.join(root, "reports", "runs"),
      runId: "build-only-refresh",
    });
    assert.deepEqual(Object.keys(buildRun.commands), ["build"]);
    assert.equal(buildRun.receipt.regressionTestsExecuted, false);
    assert.equal(buildRun.receipt.regressionTestsPassed, false);
    assert.equal(buildRun.allSelectedCommandsPassed, true);
    await bindPilotBuildVerificationRecords({
      projectRoot: root,
      migrationsRoot,
      pilots: [pilot],
      commandRun: buildRun,
    });

    const after = JSON.parse(await readFile(verificationPath, "utf8"));
    assert.deepEqual(after.commands.test, preservedTest);
    assert.equal(after.commands.build.status, "pass");
    assert.equal(after.strictCommandVerification.allCommandsPassed, false);
    assert.equal(after.strictCommandVerification.buildOnlyRefresh, true);
    assert.equal(after.strictCommandVerification.regressionTestDisposition, "preserved-authentic-failing-receipt-not-executed-or-promoted");
    const checked = await checkPilotBuildVerificationRecords({
      projectRoot: root,
      migrationsRoot,
      pilots: [pilot],
    });
    assert.equal(checked.ok, true);

    const strictLedgerView = await evaluatePilot({
      projectRoot: root,
      migrationsRoot,
      pilotId: pilot.id,
      validateMigrationFn: async () => ({ ok: false, errors: ["fixture validator remains fail-closed"], warnings: [] }),
      validator: { path: "validator.mjs", version: "fixture", sha256: "f".repeat(64) },
    });
    assert.equal(strictLedgerView.gates.find(({ id }) => id === "regression-tests").status, "fail");
    assert.equal(strictLedgerView.gates.find(({ id }) => id === "production-build").status, "pass");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("runs exact commands, preserves richer evidence, and detects a stale migration manifest", async () => {
  const { root, migrationsRoot, pilot, workspace } = await fixture();
  try {
    const commandRun = await runRequiredVerificationCommands({
      projectRoot: root,
      outputRoot: path.join(root, "reports", "runs"),
      runId: "passing-run",
    });
    assert.equal(commandRun.allCommandsPassed, true);
    assert.equal(commandRun.commands.test.command, "npm test");
    assert.equal(commandRun.commands.build.command, "npm run build");
    assert.match(await readFile(path.resolve(root, commandRun.commands.test.outputFile), "utf8"), /real test output/);

    const verificationPath = path.join(workspace, "evidence", "verification.json");
    await writeFile(verificationPath, `${JSON.stringify({
      schemaVersion: 1,
      evidenceType: "richer-engineering-record",
      disposition: { strictAcceptance: false },
      repositoryRuns: [{ command: "scoped test", result: "pass" }],
      integrity: {
        allFilesExistedAndHashesMatchedAtGeneration: true,
        files: [{ file: `migrations/${pilot.id}/migration.json`, sha256: "0".repeat(64) }],
      },
    }, null, 2)}\n`);
    await bindPilotVerificationRecords({
      projectRoot: root,
      migrationsRoot,
      pilots: [pilot],
      expectedPilotCount: 1,
      commandRun,
    });
    const verification = JSON.parse(await readFile(verificationPath, "utf8"));
    assert.equal(verification.evidenceType, "richer-engineering-record");
    assert.deepEqual(verification.disposition, { strictAcceptance: false });
    assert.deepEqual(verification.repositoryRuns, [{ command: "scoped test", result: "pass" }]);
    assert.equal(verification.integrity.allFilesExistedAndHashesMatchedAtGeneration, true);
    assert.notEqual(verification.integrity.files[0].sha256, "0".repeat(64));
    assert.equal(verification.integrity.files[0].exists, true);
    assert.equal(verification.commands.test.status, "pass");
    assert.equal(verification.commands.build.exitCode, 0);
    assert.equal(verification.strictCommandVerification.changesMigrationStatus, false);
    assert.equal(verification.strictCommandVerification.infersReviewAcceptance, false);

    const current = await checkPilotVerificationRecords({
      projectRoot: root,
      migrationsRoot,
      pilots: [pilot],
      expectedPilotCount: 1,
    });
    assert.equal(current.ok, true);
    const strictLedgerView = await evaluatePilot({
      projectRoot: root,
      migrationsRoot,
      pilotId: pilot.id,
      validateMigrationFn: async () => ({ ok: false, errors: ["fixture validator remains fail-closed"], warnings: [] }),
      validator: { path: "validator.mjs", version: "fixture", sha256: "f".repeat(64) },
    });
    assert.equal(strictLedgerView.gates.find(({ id }) => id === "regression-tests").status, "pass");
    assert.equal(strictLedgerView.gates.find(({ id }) => id === "production-build").status, "pass");
    assert.equal(strictLedgerView.strictAccepted, false);

    const manifestPath = path.join(workspace, "migration.json");
    const changed = JSON.parse(await readFile(manifestPath, "utf8"));
    changed.status = "audited";
    await writeFile(manifestPath, `${JSON.stringify(changed, null, 2)}\n`);
    const stale = await checkPilotVerificationRecords({
      projectRoot: root,
      migrationsRoot,
      pilots: [pilot],
      expectedPilotCount: 1,
    });
    assert.equal(stale.ok, false);
    assert.ok(stale.entries[0].reasons.some((reason) => reason.includes("manifestSha256 differs")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("records a real failed command as fail while still running and recording the build", async () => {
  const { root, migrationsRoot, pilot, workspace } = await fixture({ testExitCode: 3, buildExitCode: 0 });
  try {
    const commandRun = await runRequiredVerificationCommands({
      projectRoot: root,
      outputRoot: path.join(root, "reports", "runs"),
      runId: "failing-run",
    });
    assert.equal(commandRun.allCommandsPassed, false);
    assert.equal(commandRun.commands.test.status, "fail");
    assert.equal(commandRun.commands.test.exitCode, 3);
    assert.equal(commandRun.commands.build.status, "pass");
    await bindPilotVerificationRecords({
      projectRoot: root,
      migrationsRoot,
      pilots: [pilot],
      expectedPilotCount: 1,
      commandRun,
    });
    const verification = JSON.parse(await readFile(path.join(workspace, "evidence", "verification.json"), "utf8"));
    assert.equal(verification.commands.test.status, "fail");
    assert.equal(verification.commands.test.exitCode, 3);
    assert.equal(verification.commands.build.status, "pass");
    const checked = await checkPilotVerificationRecords({
      projectRoot: root,
      migrationsRoot,
      pilots: [pilot],
      expectedPilotCount: 1,
    });
    assert.equal(checked.ok, false);
    assert.ok(checked.entries[0].reasons.some((reason) => reason.includes("not a zero-exit pass")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("accepts only hash-valid pre-recorded zero-exit command results", async () => {
  const { root } = await fixture();
  try {
    const commandRun = await runRequiredVerificationCommands({
      projectRoot: root,
      outputRoot: path.join(root, "reports", "runs"),
      runId: "recorded-run",
    });
    const loaded = await loadPreRecordedVerificationCommands({
      projectRoot: root,
      resultsFile: commandRun.receiptPath,
    });
    assert.equal(loaded.allCommandsPassed, true);
    assert.equal(loaded.commands.test.command, "npm test");

    await writeFile(path.resolve(root, loaded.commands.test.outputFile), "mutated output\n");
    await assert.rejects(
      loadPreRecordedVerificationCommands({ projectRoot: root, resultsFile: commandRun.receiptPath }),
      /SHA-256 differs/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("refuses to write command evidence under source-assets", async () => {
  const { root } = await fixture();
  try {
    await assert.rejects(
      runRequiredVerificationCommands({
        projectRoot: root,
        outputRoot: path.join(root, "source-assets", "forbidden"),
        runId: "forbidden-run",
      }),
      /outside source-assets/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
