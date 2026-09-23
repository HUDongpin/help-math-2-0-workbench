#!/usr/bin/env node

import {mkdir, mkdtemp, readFile, rename, rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  ACCEPTANCE_EFFECTS_FALSE,
  PROJECT_ROOT,
  assertFileContents,
  fileIdentity,
  invariant,
  inventoryDirectory,
  portable,
  publicMemberProjection,
  resolveInside,
  stableJson,
  validateCorpus,
  writeExclusive,
} from "./lib/core.mjs";
import {buildFfdecBackend} from "./lib/ffdec.mjs";
import {buildNext2dBackend} from "./lib/next2d.mjs";
import {buildOpenflBackend} from "./lib/openfl.mjs";
import {buildComparisonReport} from "./lib/report.mjs";

function usage(message = null) {
  if (message) console.error(message);
  console.error(`Usage:
  node tools/flash-compiler-pilot/run.mjs build --output work/flash-compiler-pilot/<run> [--backend all|ffdec,next2d,openfl] [--next2d-worker <file>] [--openfl-toolchain <dir>] [--report reports/flash-compiler-pilot]
  node tools/flash-compiler-pilot/run.mjs report --output work/flash-compiler-pilot/<run> --report reports/flash-compiler-pilot
  node tools/flash-compiler-pilot/run.mjs check --output work/flash-compiler-pilot/<run> --report reports/flash-compiler-pilot`);
  process.exit(message ? 2 : 0);
}

function parseArgs(argv) {
  const mode = argv[0];
  if (!["build", "report", "check"].includes(mode)) usage("explicit build, report, or check mode required");
  const options = {mode, backend: "all"};
  for (let index = 1; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === "--help" || flag === "-h") usage();
    if (!["--output", "--backend", "--next2d-worker", "--openfl-toolchain", "--report"].includes(flag)) {
      usage(`unknown argument: ${flag}`);
    }
    invariant(index + 1 < argv.length, `missing value after ${flag}`);
    const value = argv[index += 1];
    if (flag === "--output") options.output = value;
    if (flag === "--backend") options.backend = value;
    if (flag === "--next2d-worker") options.next2dWorker = value;
    if (flag === "--openfl-toolchain") options.openflToolchain = value;
    if (flag === "--report") options.report = value;
  }
  invariant(options.output, "--output is required");
  if (["report", "check"].includes(mode)) invariant(options.report, "--report is required");
  return options;
}

function resolveOutput(relativePath) {
  invariant(typeof relativePath === "string" &&
    relativePath.startsWith("work/flash-compiler-pilot/"),
  "--output must be below work/flash-compiler-pilot/");
  return resolveInside(PROJECT_ROOT, relativePath, "output");
}

function resolveReport(relativePath) {
  invariant(typeof relativePath === "string" &&
    (relativePath === "reports/flash-compiler-pilot" ||
      relativePath.startsWith("reports/flash-compiler-pilot/")),
  "--report must be reports/flash-compiler-pilot or a child directory");
  return resolveInside(PROJECT_ROOT, relativePath, "report");
}

function selectedBackends(value) {
  if (value === "all") return ["ffdec", "next2d", "openfl"];
  const selected = value.split(",").filter(Boolean);
  invariant(selected.length > 0 && selected.every((item) =>
    ["ffdec", "next2d", "openfl"].includes(item)),
  "--backend must be all or a comma-separated subset of ffdec,next2d,openfl");
  invariant(new Set(selected).size === selected.length, "duplicate backend selected");
  return selected;
}

function corpusLock(validation) {
  return {
    schemaVersion: 1,
    pilotId: validation.pilotId,
    corpusPath: validation.corpusPath,
    corpusIdentity: validation.corpusIdentity,
    catalogPath: validation.catalogPath,
    catalogIdentity: validation.catalogIdentity,
    sourceRoot: validation.sourceRoot,
    scope: validation.scope,
    summary: validation.summary,
    members: validation.members.map((member) => publicMemberProjection(member)),
    acceptanceEffects: {...ACCEPTANCE_EFFECTS_FALSE},
  };
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function build(options) {
  const output = resolveOutput(options.output);
  const backends = selectedBackends(options.backend);
  if (options.report) {
    invariant(backends.length === 3,
      "comparison report requires all three backends");
  }
  if (backends.includes("openfl")) {
    invariant(options.openflToolchain,
      "OpenFL build requires --openfl-toolchain <pinned temporary toolchain root>");
  }
  await mkdir(path.dirname(output), {recursive: true});
  const staging = `${output}.staging-${process.pid}`;
  await mkdir(staging, {recursive: false});
  const validation = await validateCorpus();
  await writeExclusive(path.join(staging, "corpus-lock.json"),
    stableJson(corpusLock(validation)));
  const results = {};
  try {
    if (backends.includes("ffdec")) {
      results.ffdec = await buildFfdecBackend({
        corpusValidation: validation,
        outputRoot: staging,
      });
    }
    if (backends.includes("next2d")) {
      results.next2d = await buildNext2dBackend({
        corpusValidation: validation,
        outputRoot: staging,
        workerSourcePath: options.next2dWorker || null,
      });
    }
    if (backends.includes("openfl")) {
      results.openfl = await buildOpenflBackend({
        corpusValidation: validation,
        outputRoot: staging,
        toolchainRoot: path.resolve(options.openflToolchain),
      });
    }
    const backendSummaryIdentities = {};
    for (const backend of backends) {
      backendSummaryIdentities[backend] = await fileIdentity(
        path.join(staging, backend, "summary.json"),
      );
    }
    const rootSummary = {
      schemaVersion: 1,
      pilotId: validation.pilotId,
      status: "backend-machine-evidence-built",
      backends,
      memberCount: 5,
      shellCount: 0,
      sourceAssetsChanged: false,
      modernCourseUiChanged: false,
      backendSummaryIdentities,
      outputInventory: await inventoryDirectory(staging, {exclude: ["summary.json"]}),
      acceptanceEffects: {...ACCEPTANCE_EFFECTS_FALSE},
    };
    await writeExclusive(path.join(staging, "summary.json"), stableJson(rootSummary));
    await rename(staging, output);
  } catch (error) {
    error.message = `${error.message}\nPartial fail-closed diagnostics retained at ${staging}`;
    throw error;
  }
  if (options.report) {
    const report = resolveReport(options.report);
    await buildComparisonReport({
      outputRoot: output,
      reportRoot: report,
      corpusValidation: validation,
    });
  }
  return {
    mode: "build",
    output: portable(path.relative(PROJECT_ROOT, output)),
    report: options.report || null,
    backends,
    memberCount: 5,
    shellCount: 0,
  };
}

async function buildReportOnly(options) {
  const output = resolveOutput(options.output);
  const report = resolveReport(options.report);
  const validation = await validateCorpus();
  await assertFileContents(path.join(output, "corpus-lock.json"),
    stableJson(corpusLock(validation)));
  await buildComparisonReport({
    outputRoot: output,
    reportRoot: report,
    corpusValidation: validation,
  });
  return {
    mode: "report",
    output: portable(path.relative(PROJECT_ROOT, output)),
    report: portable(path.relative(PROJECT_ROOT, report)),
  };
}

async function check(options) {
  const output = resolveOutput(options.output);
  const report = resolveReport(options.report);
  const validation = await validateCorpus();
  await assertFileContents(path.join(output, "corpus-lock.json"),
    stableJson(corpusLock(validation)));
  const rootSummary = await readJson(path.join(output, "summary.json"));
  invariant(rootSummary.memberCount === 5 && rootSummary.shellCount === 0,
    "root pilot summary scope drifted");
  invariant(Object.values(rootSummary.acceptanceEffects).every((value) => value === false),
    "root pilot summary attempted an acceptance promotion");
  const currentInventory = await inventoryDirectory(output, {exclude: ["summary.json"]});
  invariant(JSON.stringify(currentInventory) === JSON.stringify(rootSummary.outputInventory),
    "pilot raw output inventory drifted");

  const temporaryReportParent = await mkdtemp(path.join(os.tmpdir(), "help-flash-report-check-"));
  const temporaryReport = path.join(temporaryReportParent, "report");
  try {
    await buildComparisonReport({
      outputRoot: output,
      reportRoot: temporaryReport,
      corpusValidation: validation,
    });
    for (const filename of ["summary.json", "SUMMARY.zh-CN.md"]) {
      await assertFileContents(
        path.join(report, filename),
        await readFile(path.join(temporaryReport, filename)),
      );
    }
  } finally {
    await rm(temporaryReportParent, {recursive: true, force: false});
  }
  return {
    mode: "check",
    verdict: "PASS",
    output: portable(path.relative(PROJECT_ROOT, output)),
    report: portable(path.relative(PROJECT_ROOT, report)),
    memberCount: 5,
    shellCount: 0,
  };
}

const options = parseArgs(process.argv.slice(2));
const result = options.mode === "build"
  ? await build(options)
  : options.mode === "report"
    ? await buildReportOnly(options)
    : await check(options);
console.log(stableJson(result));

