#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  access,
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { PILOT_MIGRATIONS } from "./scaffold-pilot-migrations.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

export const PILOT_VERIFICATION_SCHEMA_VERSION = 1;
export const PILOT_VERIFICATION_GENERATOR_VERSION = "1.1.0";

export const REQUIRED_VERIFICATION_COMMANDS = Object.freeze({
  test: Object.freeze({
    command: "npm test",
    executable: "npm",
    arguments: Object.freeze(["test"]),
    outputName: "npm-test.txt",
  }),
  build: Object.freeze({
    command: "npm run build",
    executable: "npm",
    arguments: Object.freeze(["run", "build"]),
    outputName: "npm-run-build.txt",
  }),
});

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isInside(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function canonicalizeForSafety(candidate) {
  let cursor = path.resolve(candidate);
  const suffix = [];
  while (true) {
    try {
      await lstat(cursor);
      return path.join(await realpath(cursor), ...suffix.reverse());
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      const parent = path.dirname(cursor);
      if (parent === cursor) return path.resolve(candidate);
      suffix.push(path.basename(cursor));
      cursor = parent;
    }
  }
}

async function assertOutsidePreservedSources(projectRoot, candidate, label) {
  const sourceRoot = await canonicalizeForSafety(path.join(projectRoot, "source-assets"));
  const resolvedCandidate = await canonicalizeForSafety(candidate);
  if (isInside(resolvedCandidate, sourceRoot)) {
    throw new Error(`${label} must remain outside source-assets: ${candidate}`);
  }
}

function referencePath(projectRoot, candidate) {
  const relative = path.relative(projectRoot, candidate);
  return relative && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative)
    ? portable(relative)
    : portable(path.resolve(candidate));
}

async function sha256File(candidate) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(candidate)) hash.update(chunk);
  return hash.digest("hex");
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function atomicWrite(candidate, content) {
  await mkdir(path.dirname(candidate), { recursive: true });
  const temporary = path.join(
    path.dirname(candidate),
    `.${path.basename(candidate)}.${process.pid}.${randomUUID()}.tmp`,
  );
  try {
    await writeFile(temporary, content, { flag: "wx" });
    await rename(temporary, candidate);
  } finally {
    await rm(temporary, { force: true });
  }
}

function safeRunId(now = new Date()) {
  return `${now.toISOString().replaceAll(":", "").replaceAll(".", "-")}-${randomUUID().slice(0, 8)}`;
}

async function executeExactCommand({ definition, projectRoot, outputPath, spawnImpl = spawn }) {
  const startedAt = new Date();
  const chunks = [];
  let spawnError = null;
  const result = await new Promise((resolve) => {
    const child = spawnImpl(definition.executable, [...definition.arguments], {
      cwd: projectRoot,
      env: process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout?.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    child.stderr?.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    child.once("error", (error) => {
      spawnError = error;
    });
    child.once("close", (exitCode, signal) => resolve({ exitCode, signal }));
  });
  if (spawnError) chunks.push(Buffer.from(`\n[spawn error] ${spawnError.stack || spawnError.message}\n`, "utf8"));
  const output = Buffer.concat(chunks);
  await atomicWrite(outputPath, output);
  const completedAt = new Date();
  const exitCode = Number.isInteger(result.exitCode) ? result.exitCode : -1;
  return {
    command: definition.command,
    status: exitCode === 0 && !spawnError ? "pass" : "fail",
    exitCode,
    signal: result.signal || null,
    outputFile: null,
    outputSha256: await sha256File(outputPath),
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs: completedAt.getTime() - startedAt.getTime(),
  };
}

function commandPassed(result) {
  return result?.status === "pass" && result?.exitCode === 0;
}

export async function runRequiredVerificationCommands({
  projectRoot = defaultProjectRoot,
  outputRoot = path.join(projectRoot, "reports", "pilot-verification-runs"),
  runId = safeRunId(),
  spawnImpl = spawn,
} = {}) {
  const resolvedProjectRoot = path.resolve(projectRoot);
  const resolvedOutputRoot = path.resolve(outputRoot);
  await assertOutsidePreservedSources(resolvedProjectRoot, resolvedOutputRoot, "Verification output root");
  const runDirectory = path.join(resolvedOutputRoot, runId);
  if (await exists(runDirectory)) throw new Error(`Verification run directory already exists: ${runDirectory}`);
  await mkdir(runDirectory, { recursive: true });

  const commands = {};
  for (const [key, definition] of Object.entries(REQUIRED_VERIFICATION_COMMANDS)) {
    const outputPath = path.join(runDirectory, definition.outputName);
    const result = await executeExactCommand({ definition, projectRoot: resolvedProjectRoot, outputPath, spawnImpl });
    result.outputFile = referencePath(resolvedProjectRoot, outputPath);
    commands[key] = result;
  }

  const receiptPath = path.join(runDirectory, "command-results.json");
  const receipt = {
    schemaVersion: PILOT_VERIFICATION_SCHEMA_VERSION,
    evidenceType: "pilot-strict-command-results",
    generator: {
      path: referencePath(resolvedProjectRoot, scriptPath),
      version: PILOT_VERIFICATION_GENERATOR_VERSION,
    },
    projectRoot: portable(resolvedProjectRoot),
    runId,
    commands,
    allCommandsPassed: Object.values(commands).every(commandPassed),
  };
  await atomicWrite(receiptPath, stableJson(receipt));
  return {
    commands,
    allCommandsPassed: receipt.allCommandsPassed,
    receipt,
    receiptPath,
    receiptSha256: await sha256File(receiptPath),
    source: "executed",
  };
}

export async function runBuildVerificationCommand({
  projectRoot = defaultProjectRoot,
  outputRoot = path.join(projectRoot, "reports", "pilot-verification-runs"),
  runId = safeRunId(),
  spawnImpl = spawn,
} = {}) {
  const resolvedProjectRoot = path.resolve(projectRoot);
  const resolvedOutputRoot = path.resolve(outputRoot);
  await assertOutsidePreservedSources(resolvedProjectRoot, resolvedOutputRoot, "Verification output root");
  const runDirectory = path.join(resolvedOutputRoot, runId);
  if (await exists(runDirectory)) throw new Error(`Verification run directory already exists: ${runDirectory}`);
  await mkdir(runDirectory, { recursive: true });

  const generatorSha256Before = await sha256File(scriptPath);
  const outputPath = path.join(runDirectory, REQUIRED_VERIFICATION_COMMANDS.build.outputName);
  const build = await executeExactCommand({
    definition: REQUIRED_VERIFICATION_COMMANDS.build,
    projectRoot: resolvedProjectRoot,
    outputPath,
    spawnImpl,
  });
  build.outputFile = referencePath(resolvedProjectRoot, outputPath);
  const generatorSha256After = await sha256File(scriptPath);
  const generatorStable = generatorSha256Before === generatorSha256After;

  const receiptPath = path.join(runDirectory, "build-command-result.json");
  const receipt = {
    schemaVersion: PILOT_VERIFICATION_SCHEMA_VERSION,
    evidenceType: "pilot-production-build-command-result",
    generator: {
      path: referencePath(resolvedProjectRoot, scriptPath),
      version: PILOT_VERIFICATION_GENERATOR_VERSION,
      sha256: generatorSha256Before,
      stableDuringExecution: generatorStable,
    },
    projectRoot: portable(resolvedProjectRoot),
    runId,
    selectedCommands: ["build"],
    commands: { build },
    allSelectedCommandsPassed: commandPassed(build) && generatorStable,
    regressionTestsExecuted: false,
    regressionTestsPassed: false,
    authorityBoundary: "This receipt proves only the exact production build command. It does not execute, pass, replace, or promote npm test, and it does not change migration, review, approval, baseline, coverage, or acceptance status.",
  };
  await atomicWrite(receiptPath, stableJson(receipt));
  return {
    commands: { build },
    allSelectedCommandsPassed: receipt.allSelectedCommandsPassed,
    receipt,
    receiptPath,
    receiptSha256: await sha256File(receiptPath),
    source: "executed-build-only",
  };
}

async function resolveRecordedOutput(projectRoot, value) {
  if (!value || typeof value !== "string") return null;
  const candidate = path.isAbsolute(value) ? value : path.resolve(projectRoot, value);
  return (await exists(candidate)) ? candidate : null;
}

async function refreshExistingIntegrity({ existing, projectRoot, workspace, refreshedAt }) {
  if (!existing.integrity || !Array.isArray(existing.integrity.files)) return existing.integrity;
  let allFilesExist = true;
  const files = [];
  for (const entry of existing.integrity.files) {
    const value = entry?.file;
    const candidates = typeof value === "string" && value
      ? (path.isAbsolute(value)
          ? [value]
          : [path.resolve(projectRoot, value), path.resolve(workspace, value)])
      : [];
    let resolved = null;
    for (const candidate of candidates) {
      if (await exists(candidate)) {
        resolved = candidate;
        break;
      }
    }
    if (!resolved) {
      allFilesExist = false;
      files.push({ ...entry, sha256: null, exists: false });
      continue;
    }
    files.push({ ...entry, sha256: await sha256File(resolved), exists: true });
  }
  return {
    ...existing.integrity,
    allFilesExistedAndHashesMatchedAtGeneration: allFilesExist,
    files,
    refreshedAt,
    refreshedBy: referencePath(projectRoot, scriptPath),
    refreshReason: "Recomputed after binding current strict command results; verification.json remains excluded from its own integrity list.",
  };
}

function validateCommandShape(result, key) {
  const expected = REQUIRED_VERIFICATION_COMMANDS[key];
  const reasons = [];
  if (!result || typeof result !== "object") return [`commands.${key} is missing.`];
  if (result.command !== expected.command) reasons.push(`commands.${key}.command must be exactly ${expected.command}.`);
  if (result.status !== "pass") reasons.push(`commands.${key}.status must be pass.`);
  if (result.exitCode !== 0) reasons.push(`commands.${key}.exitCode must be 0.`);
  if (!/^[a-f0-9]{64}$/i.test(String(result.outputSha256 || ""))) reasons.push(`commands.${key}.outputSha256 is invalid.`);
  if (!result.outputFile || typeof result.outputFile !== "string") reasons.push(`commands.${key}.outputFile is missing.`);
  return reasons;
}

export async function loadPreRecordedVerificationCommands({ projectRoot = defaultProjectRoot, resultsFile } = {}) {
  if (!resultsFile) throw new Error("A pre-recorded results file is required");
  const resolvedProjectRoot = path.resolve(projectRoot);
  const resolvedResultsFile = path.resolve(resultsFile);
  await assertOutsidePreservedSources(resolvedProjectRoot, resolvedResultsFile, "Pre-recorded command results");
  const receipt = JSON.parse(await readFile(resolvedResultsFile, "utf8"));
  if (receipt.schemaVersion !== PILOT_VERIFICATION_SCHEMA_VERSION) throw new Error("Pre-recorded command results schemaVersion must be 1");
  const commands = {};
  const reasons = [];
  for (const key of Object.keys(REQUIRED_VERIFICATION_COMMANDS)) {
    const result = receipt.commands?.[key];
    reasons.push(...validateCommandShape(result, key));
    const outputPath = await resolveRecordedOutput(resolvedProjectRoot, result?.outputFile);
    if (!outputPath) reasons.push(`commands.${key}.outputFile does not resolve.`);
    else {
      await assertOutsidePreservedSources(resolvedProjectRoot, outputPath, `commands.${key}.outputFile`);
      const actualSha256 = await sha256File(outputPath);
      if (actualSha256 !== String(result.outputSha256 || "").toLowerCase()) reasons.push(`commands.${key} output SHA-256 differs from the real output file.`);
    }
    if (result) commands[key] = { ...result };
  }
  if (reasons.length) throw new Error(`Pre-recorded command results are not an authentic zero-exit pass:\n- ${reasons.join("\n- ")}`);
  return {
    commands,
    allCommandsPassed: true,
    receipt,
    receiptPath: resolvedResultsFile,
    receiptSha256: await sha256File(resolvedResultsFile),
    source: "pre-recorded",
  };
}

function normalizePilots(pilots, expectedPilotCount) {
  const pilotIds = pilots.map(({ id }) => id);
  if (pilotIds.length !== expectedPilotCount) {
    throw new Error(`Pilot verification requires exactly ${expectedPilotCount} pilot(s); received ${pilotIds.length}`);
  }
  if (pilotIds.some((id) => !id) || new Set(pilotIds).size !== pilotIds.length) {
    throw new Error("Pilot verification IDs must be non-empty and unique");
  }
  return [...pilotIds].sort();
}

async function readManifestSnapshot(workspace, pilotId) {
  const manifestPath = path.join(workspace, "migration.json");
  const bytes = await readFile(manifestPath);
  let manifest;
  try {
    manifest = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${pilotId}: migration.json is invalid (${error.message})`);
  }
  if ((manifest.animationId || manifest.id) !== pilotId) {
    throw new Error(`${pilotId}: migration.json identity does not match its approved pilot ID`);
  }
  return { manifestPath, sha256: sha256Bytes(bytes) };
}

function commandRecordForVerification(result) {
  return {
    command: result.command,
    status: commandPassed(result) ? "pass" : "fail",
    exitCode: Number.isInteger(result.exitCode) ? result.exitCode : -1,
    outputFile: result.outputFile,
    outputSha256: String(result.outputSha256 || "").toLowerCase(),
    startedAt: result.startedAt || null,
    completedAt: result.completedAt || null,
    durationMs: Number.isFinite(result.durationMs) ? result.durationMs : null,
    signal: result.signal || null,
  };
}

async function validatePreservedFailingTestRecord({ record, projectRoot, pilotId }) {
  const reasons = [];
  if (!record || typeof record !== "object" || Array.isArray(record)) reasons.push("commands.test is missing.");
  else {
    if (record.command !== REQUIRED_VERIFICATION_COMMANDS.test.command) reasons.push(`commands.test.command must be exactly ${REQUIRED_VERIFICATION_COMMANDS.test.command}.`);
    if (record.status !== "fail") reasons.push("commands.test.status must remain fail for a build-only refresh.");
    if (!Number.isInteger(record.exitCode) || record.exitCode === 0) reasons.push("commands.test.exitCode must remain a non-zero integer for a build-only refresh.");
    if (!/^[a-f0-9]{64}$/i.test(String(record.outputSha256 || ""))) reasons.push("commands.test.outputSha256 is invalid.");
    const outputPath = await resolveRecordedOutput(projectRoot, record.outputFile);
    if (!outputPath) reasons.push("commands.test.outputFile does not resolve.");
    else {
      await assertOutsidePreservedSources(projectRoot, outputPath, `${pilotId} commands.test.outputFile`);
      if ((await sha256File(outputPath)) !== String(record.outputSha256 || "").toLowerCase()) {
        reasons.push("commands.test output SHA-256 differs from the real output file.");
      }
    }
  }
  if (reasons.length) throw new Error(`${pilotId}: refusing build-only refresh because the preserved failing regression receipt is not authentic:\n- ${reasons.join("\n- ")}`);
}

export async function bindPilotBuildVerificationRecords({
  projectRoot = defaultProjectRoot,
  migrationsRoot = path.join(projectRoot, "migrations"),
  pilots,
  commandRun,
} = {}) {
  if (!Array.isArray(pilots) || !pilots.length) throw new Error("build-only refresh requires at least one explicit pilot");
  if (!commandRun?.commands || Object.keys(commandRun.commands).sort().join(",") !== "build") {
    throw new Error("build-only refresh accepts exactly one build command result and no test result");
  }
  if (!commandPassed(commandRun.commands.build) || commandRun.allSelectedCommandsPassed !== true) {
    throw new Error("build-only refresh requires an authentic zero-exit production build");
  }
  const resolvedProjectRoot = path.resolve(projectRoot);
  const resolvedMigrationsRoot = path.resolve(migrationsRoot);
  const pilotIds = normalizePilots(pilots, pilots.length);
  const receiptPath = path.resolve(commandRun.receiptPath || "");
  if (!commandRun.receiptPath || !(await exists(receiptPath))) throw new Error("build-only run receipt does not exist");
  await assertOutsidePreservedSources(resolvedProjectRoot, receiptPath, "build-only run receipt");
  if ((await sha256File(receiptPath)) !== commandRun.receiptSha256) throw new Error("build-only run receipt SHA-256 differs from the real receipt file");
  const buildOutputPath = await resolveRecordedOutput(resolvedProjectRoot, commandRun.commands.build.outputFile);
  if (!buildOutputPath) throw new Error("build-only command output does not resolve");
  await assertOutsidePreservedSources(resolvedProjectRoot, buildOutputPath, "build-only command output");
  if ((await sha256File(buildOutputPath)) !== commandRun.commands.build.outputSha256) {
    throw new Error("build-only command output SHA-256 differs from the real output file");
  }

  const snapshots = [];
  for (const pilotId of pilotIds) {
    const workspace = path.join(resolvedMigrationsRoot, pilotId);
    const manifestSnapshot = await readManifestSnapshot(workspace, pilotId);
    const verificationPath = path.join(workspace, "evidence", "verification.json");
    let existing;
    try {
      existing = JSON.parse(await readFile(verificationPath, "utf8"));
    } catch (error) {
      throw new Error(`${pilotId}: refusing build-only refresh because verification.json is missing or invalid (${error.message})`);
    }
    if (!existing || Array.isArray(existing) || typeof existing !== "object") throw new Error(`${pilotId}: refusing to overwrite non-object verification.json`);
    if (existing.schemaVersion !== PILOT_VERIFICATION_SCHEMA_VERSION) throw new Error(`${pilotId}: verification.json schemaVersion must remain ${PILOT_VERIFICATION_SCHEMA_VERSION}`);
    if (existing.animationId !== pilotId) throw new Error(`${pilotId}: verification.json animationId differs from the pilot`);
    await validatePreservedFailingTestRecord({
      record: existing.commands?.test,
      projectRoot: resolvedProjectRoot,
      pilotId,
    });
    snapshots.push({ pilotId, workspace, verificationPath, existing, ...manifestSnapshot });
  }

  const receiptReference = referencePath(resolvedProjectRoot, receiptPath);
  const boundAt = new Date().toISOString();
  const generatorSha256 = await sha256File(scriptPath);
  const prepared = [];
  for (const snapshot of snapshots) {
    const refreshedIntegrity = await refreshExistingIntegrity({
      existing: snapshot.existing,
      projectRoot: resolvedProjectRoot,
      workspace: snapshot.workspace,
      refreshedAt: boundAt,
    });
    const existingStrict = snapshot.existing.strictCommandVerification
      && !Array.isArray(snapshot.existing.strictCommandVerification)
      && typeof snapshot.existing.strictCommandVerification === "object"
      ? snapshot.existing.strictCommandVerification
      : {};
    const next = {
      ...snapshot.existing,
      manifestSha256: snapshot.sha256,
      commands: {
        ...snapshot.existing.commands,
        test: { ...snapshot.existing.commands.test },
        build: commandRecordForVerification(commandRun.commands.build),
      },
      strictCommandVerification: {
        ...existingStrict,
        generator: {
          path: referencePath(resolvedProjectRoot, scriptPath),
          version: PILOT_VERIFICATION_GENERATOR_VERSION,
          sha256: generatorSha256,
        },
        boundAt,
        commandResultSource: commandRun.source,
        runReceipt: receiptReference,
        runReceiptSha256: commandRun.receiptSha256,
        allCommandsPassed: false,
        buildOnlyRefresh: true,
        selectedCommands: ["build"],
        preservedCommands: ["test"],
        regressionTestDisposition: "preserved-authentic-failing-receipt-not-executed-or-promoted",
        changesMigrationStatus: false,
        infersReviewAcceptance: false,
      },
      ...(refreshedIntegrity ? { integrity: refreshedIntegrity } : {}),
    };
    prepared.push({ snapshot, content: stableJson(next) });
  }

  const written = [];
  for (const { snapshot, content } of prepared) {
    await atomicWrite(snapshot.verificationPath, content);
    written.push({
      animationId: snapshot.pilotId,
      manifestSha256: snapshot.sha256,
      verificationPath: snapshot.verificationPath,
    });
  }
  return written;
}

export async function checkPilotBuildVerificationRecords({
  projectRoot = defaultProjectRoot,
  migrationsRoot = path.join(projectRoot, "migrations"),
  pilots,
} = {}) {
  if (!Array.isArray(pilots) || !pilots.length) throw new Error("build-only check requires at least one explicit pilot");
  const resolvedProjectRoot = path.resolve(projectRoot);
  const resolvedMigrationsRoot = path.resolve(migrationsRoot);
  const pilotIds = normalizePilots(pilots, pilots.length);
  const entries = [];
  for (const pilotId of pilotIds) {
    const workspace = path.join(resolvedMigrationsRoot, pilotId);
    const reasons = [];
    let snapshot;
    try {
      snapshot = await readManifestSnapshot(workspace, pilotId);
    } catch (error) {
      reasons.push(error.message);
    }
    let verification;
    try {
      verification = JSON.parse(await readFile(path.join(workspace, "evidence", "verification.json"), "utf8"));
    } catch (error) {
      reasons.push(`${pilotId}: verification.json is missing or invalid (${error.message})`);
    }
    if (verification) {
      if (verification.schemaVersion !== PILOT_VERIFICATION_SCHEMA_VERSION) reasons.push("verification.json schemaVersion is not 1.");
      if (snapshot && verification.manifestSha256 !== snapshot.sha256) reasons.push("verification.json is stale: manifestSha256 differs from the current migration.json.");
      try {
        await validatePreservedFailingTestRecord({ record: verification.commands?.test, projectRoot: resolvedProjectRoot, pilotId });
      } catch (error) {
        reasons.push(error.message);
      }
      const buildReasons = validateCommandShape(verification.commands?.build, "build");
      reasons.push(...buildReasons);
      const outputPath = await resolveRecordedOutput(resolvedProjectRoot, verification.commands?.build?.outputFile);
      if (!outputPath) reasons.push("commands.build.outputFile does not resolve.");
      else if ((await sha256File(outputPath)) !== String(verification.commands.build.outputSha256 || "").toLowerCase()) {
        reasons.push("commands.build output SHA-256 differs from the real output file.");
      }
      if (verification.strictCommandVerification?.allCommandsPassed !== false) reasons.push("strictCommandVerification.allCommandsPassed must remain false while npm test fails.");
      if (verification.strictCommandVerification?.buildOnlyRefresh !== true) reasons.push("strictCommandVerification.buildOnlyRefresh must be true.");
    }
    entries.push({ animationId: pilotId, ok: reasons.length === 0, reasons });
  }
  return {
    ok: entries.every(({ ok }) => ok),
    pilots: entries.length,
    passing: entries.filter(({ ok }) => ok).length,
    failing: entries.filter(({ ok }) => !ok).length,
    entries,
  };
}

export async function refreshPilotBuildVerifications({
  projectRoot = defaultProjectRoot,
  migrationsRoot = path.join(projectRoot, "migrations"),
  outputRoot = path.join(projectRoot, "reports", "pilot-verification-runs"),
  pilots,
  runId,
  spawnImpl = spawn,
} = {}) {
  if (!Array.isArray(pilots) || !pilots.length) throw new Error("build-only refresh requires explicit --pilot values");
  const commandRun = await runBuildVerificationCommand({ projectRoot, outputRoot, runId, spawnImpl });
  if (!commandRun.allSelectedCommandsPassed) return { ok: false, commandRun, written: [], check: null };
  const written = await bindPilotBuildVerificationRecords({ projectRoot, migrationsRoot, pilots, commandRun });
  const check = await checkPilotBuildVerificationRecords({ projectRoot, migrationsRoot, pilots });
  return { ok: check.ok, commandRun, written, check };
}

export async function bindPilotVerificationRecords({
  projectRoot = defaultProjectRoot,
  migrationsRoot = path.join(projectRoot, "migrations"),
  pilots = PILOT_MIGRATIONS,
  expectedPilotCount = 16,
  commandRun,
} = {}) {
  if (!commandRun?.commands) throw new Error("commandRun.commands is required");
  const resolvedProjectRoot = path.resolve(projectRoot);
  const resolvedMigrationsRoot = path.resolve(migrationsRoot);
  const pilotIds = normalizePilots(pilots, expectedPilotCount);
  const snapshots = [];
  for (const pilotId of pilotIds) {
    const workspace = path.join(resolvedMigrationsRoot, pilotId);
    snapshots.push({ pilotId, workspace, ...await readManifestSnapshot(workspace, pilotId) });
  }

  const receiptReference = commandRun.receiptPath
    ? referencePath(resolvedProjectRoot, path.resolve(commandRun.receiptPath))
    : null;
  const boundAt = new Date().toISOString();
  const written = [];
  for (const snapshot of snapshots) {
    const verificationPath = path.join(snapshot.workspace, "evidence", "verification.json");
    let existing = {};
    if (await exists(verificationPath)) {
      try {
        existing = JSON.parse(await readFile(verificationPath, "utf8"));
      } catch (error) {
        throw new Error(`${snapshot.pilotId}: refusing to overwrite invalid existing verification.json (${error.message})`);
      }
      if (!existing || Array.isArray(existing) || typeof existing !== "object") {
        throw new Error(`${snapshot.pilotId}: refusing to overwrite non-object verification.json`);
      }
    }
    const existingCommands = existing.commands && !Array.isArray(existing.commands) && typeof existing.commands === "object"
      ? existing.commands
      : {};
    const existingStrict = existing.strictCommandVerification && !Array.isArray(existing.strictCommandVerification) && typeof existing.strictCommandVerification === "object"
      ? existing.strictCommandVerification
      : {};
    const refreshedIntegrity = await refreshExistingIntegrity({
      existing,
      projectRoot: resolvedProjectRoot,
      workspace: snapshot.workspace,
      refreshedAt: boundAt,
    });
    const next = {
      ...existing,
      schemaVersion: PILOT_VERIFICATION_SCHEMA_VERSION,
      animationId: existing.animationId || snapshot.pilotId,
      manifestSha256: snapshot.sha256,
      commands: {
        ...existingCommands,
        test: commandRecordForVerification(commandRun.commands.test),
        build: commandRecordForVerification(commandRun.commands.build),
      },
      strictCommandVerification: {
        ...existingStrict,
        generator: {
          path: referencePath(resolvedProjectRoot, scriptPath),
          version: PILOT_VERIFICATION_GENERATOR_VERSION,
        },
        boundAt,
        commandResultSource: commandRun.source || "executed",
        runReceipt: receiptReference,
        runReceiptSha256: commandRun.receiptSha256 || null,
        allCommandsPassed: Object.values(commandRun.commands).every(commandPassed),
        changesMigrationStatus: false,
        infersReviewAcceptance: false,
      },
      ...(refreshedIntegrity ? { integrity: refreshedIntegrity } : {}),
    };
    await atomicWrite(verificationPath, stableJson(next));
    written.push({
      animationId: snapshot.pilotId,
      manifestSha256: snapshot.sha256,
      verificationPath,
    });
  }
  return written;
}

export async function checkPilotVerificationRecords({
  projectRoot = defaultProjectRoot,
  migrationsRoot = path.join(projectRoot, "migrations"),
  pilots = PILOT_MIGRATIONS,
  expectedPilotCount = 16,
} = {}) {
  const resolvedProjectRoot = path.resolve(projectRoot);
  const resolvedMigrationsRoot = path.resolve(migrationsRoot);
  const pilotIds = normalizePilots(pilots, expectedPilotCount);
  const entries = [];
  for (const pilotId of pilotIds) {
    const workspace = path.join(resolvedMigrationsRoot, pilotId);
    const reasons = [];
    let snapshot;
    try {
      snapshot = await readManifestSnapshot(workspace, pilotId);
    } catch (error) {
      reasons.push(error.message);
    }
    const verificationPath = path.join(workspace, "evidence", "verification.json");
    let verification = null;
    try {
      verification = JSON.parse(await readFile(verificationPath, "utf8"));
    } catch (error) {
      reasons.push(`${pilotId}: verification.json is missing or invalid (${error.message})`);
    }
    if (verification) {
      if (verification.schemaVersion !== PILOT_VERIFICATION_SCHEMA_VERSION) reasons.push("verification.json schemaVersion is not 1.");
      if (snapshot && verification.manifestSha256 !== snapshot.sha256) reasons.push("verification.json is stale: manifestSha256 differs from the current migration.json.");
      for (const [key, definition] of Object.entries(REQUIRED_VERIFICATION_COMMANDS)) {
        const result = verification.commands?.[key];
        if (result?.command !== definition.command) reasons.push(`commands.${key}.command is not exactly ${definition.command}.`);
        if (!commandPassed(result)) reasons.push(`commands.${key} is not a zero-exit pass.`);
        if (!/^[a-f0-9]{64}$/i.test(String(result?.outputSha256 || ""))) reasons.push(`commands.${key}.outputSha256 is invalid.`);
        const outputPath = await resolveRecordedOutput(resolvedProjectRoot, result?.outputFile);
        if (!outputPath) reasons.push(`commands.${key}.outputFile does not resolve.`);
        else {
          await assertOutsidePreservedSources(resolvedProjectRoot, outputPath, `commands.${key}.outputFile`);
          if ((await sha256File(outputPath)) !== String(result.outputSha256 || "").toLowerCase()) {
            reasons.push(`commands.${key} output SHA-256 differs from the real output file.`);
          }
        }
      }
    }
    entries.push({
      animationId: pilotId,
      verificationPath: referencePath(resolvedProjectRoot, verificationPath),
      ok: reasons.length === 0,
      reasons,
    });
  }
  return {
    ok: entries.every(({ ok }) => ok),
    pilots: entries.length,
    passing: entries.filter(({ ok }) => ok).length,
    failing: entries.filter(({ ok }) => !ok).length,
    entries,
  };
}

export async function refreshPilotVerifications({
  projectRoot = defaultProjectRoot,
  migrationsRoot = path.join(projectRoot, "migrations"),
  outputRoot = path.join(projectRoot, "reports", "pilot-verification-runs"),
  pilots = PILOT_MIGRATIONS,
  expectedPilotCount = 16,
  preRecordedResultsFile = null,
  runId,
  spawnImpl = spawn,
} = {}) {
  const resolvedProjectRoot = path.resolve(projectRoot);
  normalizePilots(pilots, expectedPilotCount);
  for (const { id } of pilots) await readManifestSnapshot(path.join(migrationsRoot, id), id);
  const commandRun = preRecordedResultsFile
    ? await loadPreRecordedVerificationCommands({ projectRoot: resolvedProjectRoot, resultsFile: preRecordedResultsFile })
    : await runRequiredVerificationCommands({ projectRoot: resolvedProjectRoot, outputRoot, runId, spawnImpl });
  const written = await bindPilotVerificationRecords({
    projectRoot: resolvedProjectRoot,
    migrationsRoot,
    pilots,
    expectedPilotCount,
    commandRun,
  });
  const check = await checkPilotVerificationRecords({
    projectRoot: resolvedProjectRoot,
    migrationsRoot,
    pilots,
    expectedPilotCount,
  });
  return {
    ok: commandRun.allCommandsPassed && check.ok,
    commandRun,
    written,
    check,
  };
}

export function parseArguments(argv) {
  const options = {
    projectRoot: defaultProjectRoot,
    migrationsRoot: path.join(defaultProjectRoot, "migrations"),
    outputRoot: path.join(defaultProjectRoot, "reports", "pilot-verification-runs"),
    check: false,
    json: false,
    buildOnly: false,
    buildPilots: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--check") options.check = true;
    else if (value === "--json") options.json = true;
    else if (value === "--build-only") options.buildOnly = true;
    else if (value === "--pilot") {
      const next = argv[index + 1];
      if (!next) throw new Error("--pilot requires a value");
      options.buildPilots.push({ id: next });
      index += 1;
    }
    else if (["--migrations", "--output-root", "--from-results"].includes(value)) {
      const next = argv[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--migrations") options.migrationsRoot = path.resolve(next);
      else if (value === "--output-root") options.outputRoot = path.resolve(next);
      else options.preRecordedResultsFile = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  if (options.check && options.preRecordedResultsFile) throw new Error("--check cannot be combined with --from-results");
  if (options.buildOnly && options.preRecordedResultsFile) throw new Error("--build-only cannot be combined with --from-results");
  if (options.buildOnly && options.check) throw new Error("--build-only cannot be combined with --check");
  if (options.buildOnly && !options.buildPilots.length) throw new Error("--build-only requires at least one explicit --pilot");
  if (!options.buildOnly && options.buildPilots.length) throw new Error("--pilot is supported only with --build-only");
  return options;
}

function usage() {
  return `Usage:
  node scripts/refresh-pilot-verification.mjs [--json]
    [--migrations <directory>] [--output-root <directory>]
  node scripts/refresh-pilot-verification.mjs --from-results <command-results.json> [--json]
  node scripts/refresh-pilot-verification.mjs --check [--json]
  node scripts/refresh-pilot-verification.mjs --build-only --pilot <animation-id>
    [--pilot <animation-id> ...] [--output-root <directory>] [--json]

Runs the exact repository commands "npm test" and "npm run build" once, keeps
their real output logs outside source-assets, and binds the results plus each
current migration.json SHA-256 into all 16 pilot evidence/verification.json
files. A failed command is recorded as failed and makes this command fail.
--from-results accepts only hash-valid, explicit zero-exit results.`;
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    if (options.check) {
      const result = await checkPilotVerificationRecords(options);
      if (options.json) console.log(JSON.stringify(result, null, 2));
      else console.log(`${result.ok ? "PASS" : "FAIL"}: ${result.passing}/${result.pilots} pilot verification records are current zero-exit passes`);
      if (!result.ok) process.exitCode = 1;
      return;
    }
    if (options.buildOnly) {
      const result = await refreshPilotBuildVerifications({
        ...options,
        pilots: options.buildPilots,
      });
      const summary = {
        ok: result.ok,
        source: result.commandRun.source,
        receipt: result.commandRun.receiptPath ? referencePath(options.projectRoot, result.commandRun.receiptPath) : null,
        build: result.commandRun.commands.build,
        regressionTestsExecuted: false,
        records: result.check,
      };
      if (options.json) console.log(JSON.stringify(summary, null, 2));
      else {
        console.log(`${summary.build.status.toUpperCase()}: ${summary.build.command} (exit ${summary.build.exitCode}) -> ${summary.build.outputFile}`);
        console.log(`${summary.ok ? "PASS" : "FAIL"}: build-only records ${summary.records?.passing || 0}/${options.buildPilots.length}; npm test was not executed or promoted`);
      }
      if (!result.ok) process.exitCode = 1;
      return;
    }
    const result = await refreshPilotVerifications(options);
    const summary = {
      ok: result.ok,
      source: result.commandRun.source,
      receipt: result.commandRun.receiptPath ? referencePath(options.projectRoot, result.commandRun.receiptPath) : null,
      commands: Object.fromEntries(Object.entries(result.commandRun.commands).map(([key, command]) => [key, {
        command: command.command,
        status: command.status,
        exitCode: command.exitCode,
        outputFile: command.outputFile,
        outputSha256: command.outputSha256,
      }])),
      records: result.check,
    };
    if (options.json) console.log(JSON.stringify(summary, null, 2));
    else {
      for (const command of Object.values(summary.commands)) console.log(`${command.status.toUpperCase()}: ${command.command} (exit ${command.exitCode}) -> ${command.outputFile}`);
      console.log(`${summary.ok ? "PASS" : "FAIL"}: ${summary.records.passing}/${summary.records.pilots} pilot verification records are current zero-exit passes`);
    }
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
