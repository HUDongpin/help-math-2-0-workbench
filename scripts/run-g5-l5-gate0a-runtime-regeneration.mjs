#!/usr/bin/env node

/** Bind the fresh G5 L5 FFDec run to all 56 v9 Current-JS inputs. */

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {chmod, lstat, mkdir, open, readFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFile = promisify(execFileCallback);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const V9_PLAN_PATH = "work/adaptive-canvas-production-five.plan.v9.json";
const SOURCE_RUN_ROOT = "work/gate0a/g5-l5-source-first-complete-v2";
const SOURCE_RUN_PATH = `${SOURCE_RUN_ROOT}/gate0a-source-first-run-manifest.json`;
const ROOT_AUDIT_PATH = "work/g5-l5-root-placement-audit/v1/run-manifest.json";
const CANONICALIZATION_PATH = "work/gate0a/g5-l5-toolchain-canonicalization.v3.json";
const FREEZE_PATH = "work/gate0a/g5-l5-source-first-run-freeze.v1.json";
const TRANSFORMED_RUNNER =
  "work/gate0a/g5-l5-canonical-toolchain-v3/build-g5-l5-private-current-js.gate0a.mjs";
const ORIGINAL_GENERATOR = "scripts/build-g5-l5-private-current-js.mjs";
const LEGACY_ADAPTER =
  "work/gate0a/g5-l5-canonical-toolchain-v3/build-safe-ffdec-canvas-adapter.mjs";
const LEGACY_SUCCESSOR =
  "work/gate0a/g5-l5-canonical-toolchain-v3/build-g5-l5-safe-canvas-successor.mjs";
const RECEIPT_PATH = "work/gate0a/g5-l5-regeneration-provenance.v1.json";

function invariant(value, message) {
  if (!value) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

function canonicalBytes(value) {
  return Buffer.from(`${JSON.stringify(canonical(value))}\n`);
}

function resolveProject(relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0 && !path.isAbsolute(relativePath),
    `${label}: project-relative path required`);
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  invariant(resolved.startsWith(`${PROJECT_ROOT}${path.sep}`), `${label}: path escapes project`);
  return resolved;
}

async function stableRead(filePath, label, expected = null) {
  const pathInfo = await lstat(filePath);
  invariant(pathInfo.isFile() && !pathInfo.isSymbolicLink(), `${label}: ordinary file required`);
  const handle = await open(filePath, "r");
  try {
    const before = await handle.stat({bigint: true});
    const bytes = await handle.readFile();
    const after = await handle.stat({bigint: true});
    for (const key of ["dev", "ino", "size", "mtimeNs", "ctimeNs"]) {
      invariant(before[key] === after[key], `${label}: unstable read (${key})`);
    }
    const identity = {bytes: bytes.length, sha256: sha256(bytes)};
    if (expected) {
      invariant(identity.bytes === expected.bytes && identity.sha256 === expected.sha256,
        `${label}: bytes/SHA-256 mismatch`);
    }
    return {bytes, identity, physical: {dev: String(before.dev), ino: String(before.ino),
      size: String(before.size), mtimeNs: String(before.mtimeNs), ctimeNs: String(before.ctimeNs)}};
  } finally {
    await handle.close();
  }
}

async function readJson(relativePath, label) {
  const observed = await stableRead(resolveProject(relativePath, label), label);
  return {value: JSON.parse(observed.bytes.toString("utf8")), path: relativePath,
    ...observed.identity};
}

async function writeExclusive(relativePath, bytes) {
  const target = resolveProject(relativePath, "receipt target");
  await mkdir(path.dirname(target), {recursive: true});
  const handle = await open(target, "wx", 0o444);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await chmod(target, 0o444);
  return stableRead(target, "written G5 L5 provenance receipt",
    {bytes: bytes.length, sha256: sha256(bytes)});
}

function v9Rows(plan) {
  const rows = plan.payload?.runtimes?.filter(({releaseId, pageRenderer}) =>
    releaseId === "lesson-g05-l05-add-subtract-negative-numbers" && pageRenderer) ?? [];
  invariant(rows.length === 56, `v9 G5 L5 denominator drifted: ${rows.length}`);
  return rows;
}

async function main() {
  const [plan, sourceRun, rootAudit, canonicalization, freeze, wrapper,
    transformed, originalGenerator, adapter, successor] = await Promise.all([
    readJson(V9_PLAN_PATH, "v9 plan"),
    readJson(SOURCE_RUN_PATH, "G5 L5 source-first run"),
    readJson(ROOT_AUDIT_PATH, "G5 L5 root audit"),
    readJson(CANONICALIZATION_PATH, "G5 L5 canonicalization"),
    readJson(FREEZE_PATH, "G5 L5 run freeze"),
    stableRead(SCRIPT_PATH, "G5 L5 runtime wrapper"),
    stableRead(resolveProject(TRANSFORMED_RUNNER, "transformed runner"), "transformed v1 runner"),
    stableRead(resolveProject(ORIGINAL_GENERATOR, "original generator"), "original v1 generator"),
    stableRead(resolveProject(LEGACY_ADAPTER, "legacy adapter"), "legacy safe adapter"),
    stableRead(resolveProject(LEGACY_SUCCESSOR, "legacy successor"), "legacy root successor"),
  ]);
  invariant(sourceRun.value.status === "pass-source-first-compiler-input-regeneration" &&
    sourceRun.value.records?.length === 56,
  "G5 L5 source-first run is not a 56/56 pass");
  invariant(rootAudit.value.members?.length === 56, "G5 L5 root audit denominator drifted");
  invariant(canonicalization.value.payload?.transformedReadOnlyRunner?.sha256 === transformed.identity.sha256,
    "G5 L5 transformed runner drifted from canonicalization receipt");
  invariant(freeze.value.payload?.status === "frozen-before-fresh-source-first-run",
    "G5 L5 pre-run freeze invalid");

  const sourceRoot = "/Volumes/WestWorld/HELP MATH 2.0/source-assets/flash/HELP MATH_ORIGINAL FILES";
  const command = await execFile(process.execPath, [resolveProject(TRANSFORMED_RUNNER, "runner"),
    "--scope", "all", "--check"], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    env: {...process.env,
      HELP_MATH_GATE0A_PROJECT_ROOT: PROJECT_ROOT,
      HELP_MATH_GATE0A_SOURCE_ROOT: sourceRoot,
      HELP_MATH_GATE0A_FACTORY_ROOT: resolveProject(SOURCE_RUN_ROOT, "source run root"),
      HELP_MATH_GATE0A_RUNTIME_ONLY: "1",
    },
  });
  const commandOutput = Buffer.from(command.stdout ?? "");
  const commandError = Buffer.from(command.stderr ?? "");
  const commandResult = JSON.parse(commandOutput.toString("utf8"));
  invariant(commandResult.registered === 56 && commandResult.activePages === 56 &&
    commandResult.courseShellCount === 0 && commandResult.check === true,
  "G5 L5 runtime-only generator check did not close 56/56");

  const sourceRunById = new Map(sourceRun.value.records.map((record) =>
    [record.animationId, record]));
  const rootById = new Map(rootAudit.value.members.map((member) =>
    [member.animationId, member]));
  const records = [];
  for (const v9 of v9Rows(plan.value)) {
    const sourceRecord = sourceRunById.get(v9.animationId);
    const rootMember = rootById.get(v9.animationId);
    invariant(sourceRecord && rootMember, `${v9.animationId}: source-first/root row missing`);
    invariant(JSON.stringify(sourceRecord.v9Input) === JSON.stringify(v9.input) &&
      JSON.stringify(sourceRecord.v9Output) === JSON.stringify(v9.output),
    `${v9.animationId}: source-first/v9 identity drifted`);
    const memberManifest = await stableRead(resolveProject(
      `${SOURCE_RUN_ROOT}/${sourceRecord.manifestPath}`, "member manifest"),
    `${v9.animationId} source-first manifest`, sourceRecord.manifest);
    const detail = JSON.parse(memberManifest.bytes.toString("utf8"));
    const helper = await stableRead(resolveProject(
      `${SOURCE_RUN_ROOT}/members/${v9.animationId}/${detail.targetSprite.helper.path}`,
      "fresh helper"), `${v9.animationId} fresh helper`, detail.targetSprite.helper);
    const frames = await stableRead(resolveProject(
      `${SOURCE_RUN_ROOT}/members/${v9.animationId}/${detail.targetSprite.framesHtml.path}`,
      "fresh frames"), `${v9.animationId} fresh frames`, detail.targetSprite.framesHtml);
    const materializedPath = `apps/web/public/flash-assets/${v9.assetPath}`;
    const materialized = await stableRead(resolveProject(materializedPath, "v1 runtime"),
      `${v9.animationId} v1 runtime`, v9.input);
    invariant(rootMember.sourceSwf.sha256 === detail.source.sha256,
      `${v9.animationId}: root/source-first binding drifted`);
    records.push({
      animationId: v9.animationId,
      metadataAnimationId: v9.metadataAnimationId,
      pageRenderer: v9.pageRenderer,
      assetPath: v9.assetPath,
      relativePath: v9.relativePath,
      releaseId: v9.releaseId,
      family: v9.family,
      lane: v9.lane,
      input: v9.input,
      output: v9.output,
      provenanceClass: "source-first-regeneration",
      source: {path: detail.source.logicalPath, bytes: detail.source.bytes,
        sha256: detail.source.sha256},
      freshCompilerInput: {
        memberManifest: {path: `${SOURCE_RUN_ROOT}/${sourceRecord.manifestPath}`,
          ...sourceRecord.manifest},
        swfmillSha256: sourceRecord.swfmillSha256,
        helper: {path: `${SOURCE_RUN_ROOT}/members/${v9.animationId}/${detail.targetSprite.helper.path}`,
          ...helper.identity},
        framesHtml: {path: `${SOURCE_RUN_ROOT}/members/${v9.animationId}/${detail.targetSprite.framesHtml.path}`,
          ...frames.identity},
      },
      observedV1Materialization: {path: materializedPath, ...materialized.identity,
        physical: materialized.physical},
      regeneratedRuntime: v9.input,
      exactV9InputMatch: true,
      placements: [{placementId: `g05-l05-placement-${String(rootMember.ordinal).padStart(3, "0")}`,
        ordinal: rootMember.ordinal}],
      browserStarted: false,
    });
  }
  invariant(records.length === 56 && new Set(records.map(({animationId}) => animationId)).size === 56,
    "G5 L5 provenance denominator drifted");

  const payload = {
    status: "pass",
    scope: "gate0a-g5-l5-regeneration-provenance",
    provenancePolicy: "source-first-or-canonical-advanced-manual-v1",
    summary: {recordCount: 56, placementCount: 56, sourceFirstPassCount: 56,
      advancedManualPassCount: 0, noGoCount: 0},
    inputs: {
      v9Plan: {path: plan.path, bytes: plan.bytes, sha256: plan.sha256},
      sourceFirstRun: {path: sourceRun.path, bytes: sourceRun.bytes, sha256: sourceRun.sha256},
      rootAudit: {path: rootAudit.path, bytes: rootAudit.bytes, sha256: rootAudit.sha256},
      canonicalization: {path: canonicalization.path, bytes: canonicalization.bytes,
        sha256: canonicalization.sha256},
      freeze: {path: freeze.path, bytes: freeze.bytes, sha256: freeze.sha256},
      originalGenerator: {path: ORIGINAL_GENERATOR, ...originalGenerator.identity},
      transformedRunner: {path: TRANSFORMED_RUNNER, ...transformed.identity},
      legacyAdapter: {path: LEGACY_ADAPTER, ...adapter.identity},
      legacySuccessor: {path: LEGACY_SUCCESSOR, ...successor.identity},
      wrapper: {path: path.relative(PROJECT_ROOT, SCRIPT_PATH), ...wrapper.identity},
      runtimeCheckCommand: {
        executable: process.execPath,
        args: [TRANSFORMED_RUNNER, "--scope", "all", "--check"],
        exitCode: 0,
        stdout: {bytes: commandOutput.length, sha256: sha256(commandOutput)},
        stderr: {bytes: commandError.length, sha256: sha256(commandError)},
        browserStarted: false,
      },
    },
    records,
    boundaries: {browserStarted: false, adaptiveBatchApplyRun: false,
      productionRendererWritten: false, v2ProfileWritten: false,
      activeBindingWritten: false, deploymentRun: false, applySentinelUpdated: false,
      applyAuthorization: false},
  };
  const payloadBytes = canonicalBytes(payload);
  const document = {schemaVersion: 1,
    receiptType: "adaptive-canvas-g5-l5-regeneration-provenance-v1",
    payloadSha256: sha256(payloadBytes), payload};
  const receiptBytes = canonicalBytes(document);
  const written = await writeExclusive(RECEIPT_PATH, receiptBytes);
  process.stdout.write(`${JSON.stringify({receipt: {path: RECEIPT_PATH,
    ...written.identity, payloadSha256: document.payloadSha256}, summary: payload.summary}, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
