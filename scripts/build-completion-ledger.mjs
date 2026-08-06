#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  MIGRATION_VALIDATOR_VERSION,
  validateMigration,
} from "../skills/flash-to-js/scripts/validate_migration.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const validatorAbsolutePath = path.join(projectRoot, "skills", "flash-to-js", "scripts", "validate_migration.mjs");
const LEDGER_SCHEMA_VERSION = 1;
const LEDGER_GENERATOR_VERSION = "1.0.0";
const DEFAULT_MIGRATIONS_ROOT = path.join(projectRoot, "migrations");
const DEFAULT_OUTPUT_PATH = path.join(projectRoot, "catalog", "completion-ledger.json");

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function projectRelative(filePath) {
  const relative = path.relative(projectRoot, filePath);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative)
    ? relative.split(path.sep).join("/")
    : filePath;
}

async function exists(filePath) {
  try {
    await readFile(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") return false;
    throw error;
  }
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function acceptanceSummary(manifest) {
  const acceptance = manifest.acceptance || {};
  const review = (value) => ({
    decision: value?.decision || "missing",
    reviewer: value?.reviewer || "",
    reviewedAt: value?.reviewedAt || "",
    ...(value?.reason ? { reason: value.reason } : {}),
    ...(value?.scope ? { scope: value.scope } : {}),
  });
  return {
    engineeringReview: review(acceptance.engineeringReview),
    humanVisualReview: review(acceptance.humanVisualReview),
    ownerReview: review(acceptance.ownerReview),
    knownExceptionCount: Array.isArray(acceptance.knownExceptions) ? acceptance.knownExceptions.length : 0,
  };
}

async function readManifest(workspace) {
  const manifestPath = path.join(workspace, "migration.json");
  try {
    const bytes = await readFile(manifestPath);
    return {
      manifest: JSON.parse(bytes.toString("utf8")),
      manifestPath,
      manifestSha256: createHash("sha256").update(bytes).digest("hex"),
      parseError: null,
    };
  } catch (error) {
    return { manifest: null, manifestPath, manifestSha256: null, parseError: error.message };
  }
}

async function migrationDirectories(migrationsRoot) {
  let entries;
  try {
    entries = await readdir(migrationsRoot, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => ({ name: entry.name, workspace: path.join(migrationsRoot, entry.name) }))
    .sort((left, right) => compareText(left.name, right.name));
}

export async function generateCompletionLedger({ migrationsRoot = DEFAULT_MIGRATIONS_ROOT } = {}) {
  const resolvedMigrationsRoot = path.resolve(migrationsRoot);
  const validatorSha256 = await sha256File(validatorAbsolutePath);
  const validator = {
    path: projectRelative(validatorAbsolutePath),
    version: MIGRATION_VALIDATOR_VERSION,
    sha256: validatorSha256,
  };
  const directories = await migrationDirectories(resolvedMigrationsRoot);
  const entries = [];
  const diagnostics = [];
  const markerInputs = [];
  const statusCounts = {};
  let declaredComplete = 0;

  for (const directory of directories) {
    const source = await readManifest(directory.workspace);
    const manifest = source.manifest || {};
    const animationId = manifest.animationId || manifest.id || directory.name;
    const status = manifest.status || "unreadable";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    if (status === "complete") declaredComplete += 1;
    let result;
    try {
      result = await validateMigration(directory.workspace);
    } catch (error) {
      result = { ok: false, mode: "strict", errors: [`Validator threw: ${error.message}`], warnings: [] };
    }
    const errors = Array.isArray(result.errors) ? result.errors : [];
    markerInputs.push({
      workspace: directory.name,
      animationId,
      manifestSha256: source.manifestSha256,
      strict: result.ok === true,
      errors,
    });
    if (result.ok === true) {
      entries.push({
        animationId,
        assetId: manifest.assetId,
        workspace: projectRelative(directory.workspace),
        manifestSha256: source.manifestSha256,
        route: manifest.implementation?.route || null,
        registryModule: manifest.implementation.registryModule,
        validation: {
          mode: "strict",
          validatorPath: validator.path,
          validatorVersion: validator.version,
          validatorSha256: validator.sha256,
        },
        acceptance: acceptanceSummary(manifest),
      });
    } else {
      diagnostics.push({
        animationId,
        workspace: projectRelative(directory.workspace),
        status,
        manifestSha256: source.manifestSha256,
        errorCount: errors.length || (source.parseError ? 1 : 0),
        errors: (errors.length ? errors : source.parseError ? [`Invalid migration.json: ${source.parseError}`] : ["Strict validation did not pass"]).slice(0, 5),
      });
    }
  }

  entries.sort((left, right) => compareText(left.animationId, right.animationId));
  diagnostics.sort((left, right) => compareText(left.animationId, right.animationId));
  const generatedMarker = `sha256:${sha256Text(JSON.stringify({
    schemaVersion: LEDGER_SCHEMA_VERSION,
    generatorVersion: LEDGER_GENERATOR_VERSION,
    validator,
    migrationsRoot: projectRelative(resolvedMigrationsRoot),
    markerInputs,
  }))}`;
  for (const entry of entries) entry.validation.generatedMarker = generatedMarker;

  return {
    schemaVersion: LEDGER_SCHEMA_VERSION,
    generatedMarker,
    generator: {
      path: projectRelative(scriptPath),
      version: LEDGER_GENERATOR_VERSION,
    },
    validator,
    source: {
      migrationsRoot: projectRelative(resolvedMigrationsRoot),
    },
    summary: {
      migrationDirectories: directories.length,
      declaredComplete,
      strictComplete: entries.length,
      strictFailed: directories.length - entries.length,
      statusCounts: Object.fromEntries(Object.entries(statusCounts).sort(([left], [right]) => compareText(left, right))),
    },
    diagnostics,
    entries,
  };
}

export async function writeCompletionLedger({
  migrationsRoot = DEFAULT_MIGRATIONS_ROOT,
  output = DEFAULT_OUTPUT_PATH,
} = {}) {
  const outputPath = path.resolve(output);
  const ledger = await generateCompletionLedger({ migrationsRoot });
  const serialized = stableJson(ledger);
  await mkdir(path.dirname(outputPath), { recursive: true });
  const temporaryPath = path.join(path.dirname(outputPath), `.${path.basename(outputPath)}.${process.pid}.tmp`);
  try {
    await writeFile(temporaryPath, serialized, { flag: "wx" });
    await rename(temporaryPath, outputPath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
  return { ledger, outputPath, serialized };
}

export async function checkCompletionLedger({
  migrationsRoot = DEFAULT_MIGRATIONS_ROOT,
  output = DEFAULT_OUTPUT_PATH,
} = {}) {
  const outputPath = path.resolve(output);
  const ledger = await generateCompletionLedger({ migrationsRoot });
  const expected = stableJson(ledger);
  let actual = null;
  if (await exists(outputPath)) actual = await readFile(outputPath, "utf8");
  return {
    ok: actual === expected,
    reason: actual === null ? "missing" : actual === expected ? "current" : "stale",
    outputPath,
    ledger,
    expected,
    actual,
  };
}

function usage() {
  return `Usage:
  node scripts/build-completion-ledger.mjs [--check] [--migrations <directory>] [--output <file>] [--json]

Without --check, atomically writes the strict-completion ledger. With --check,
re-runs strict validation and fails if the checked-in ledger is missing or stale.`;
}

export function parseArguments(argv) {
  const options = { migrationsRoot: DEFAULT_MIGRATIONS_ROOT, output: DEFAULT_OUTPUT_PATH, check: false, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--check") options.check = true;
    else if (value === "--json") options.json = true;
    else if (value === "--migrations" || value === "--output") {
      const next = argv[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      options[value === "--migrations" ? "migrationsRoot" : "output"] = next;
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    if (options.check) {
      const result = await checkCompletionLedger(options);
      if (options.json) console.log(JSON.stringify({ ok: result.ok, reason: result.reason, summary: result.ledger.summary }, null, 2));
      else console.log(`${result.ok ? "PASS" : "FAIL"}: completion ledger is ${result.reason} at ${result.outputPath}`);
      if (!result.ok) process.exitCode = 1;
      return;
    }
    const result = await writeCompletionLedger(options);
    if (options.json) console.log(JSON.stringify({ output: result.outputPath, generatedMarker: result.ledger.generatedMarker, summary: result.ledger.summary }, null, 2));
    else console.log(`Wrote ${result.outputPath}: ${result.ledger.summary.strictComplete} strict complete, ${result.ledger.summary.strictFailed} not admitted`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
