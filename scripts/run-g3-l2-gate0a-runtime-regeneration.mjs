#!/usr/bin/env node

/**
 * Re-run the browser-free G3 L2 source-first checks and bind all 70 regenerated
 * Current-JS runtimes to the immutable adaptive-canvas v9 plan.
 *
 * This script has two explicit modes:
 *   --freeze  create the pre-run family freeze (create-exclusive)
 *   (none)    verify the freeze, run read-only checks, and create the family
 *             provenance receipt (create-exclusive)
 */

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {chmod, lstat, mkdir, open} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {buildG3L2CurrentJsCandidates} from "./build-g3-l2-current-js-candidates.mjs";

const execFile = promisify(execFileCallback);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SOURCE_ROOT =
  "/Volumes/WestWorld/HELP MATH 2.0/source-assets/flash/HELP MATH_ORIGINAL FILES";
const V9_PLAN_PATH = "work/adaptive-canvas-production-five.plan.v9.json";
const FACTORY_ROOT = "work/g3-l2-ffdec-canvas-pcode-factory/gate0a-fresh-v2";
const FACTORY_RUN_PATH = `${FACTORY_ROOT}/run-manifest.json`;
const AUDIT_PATH = "reports/g3-l2-cross-grade-factory-audit.json";
const FACTORY_GENERATOR = "scripts/build-g3-l2-ffdec-canvas-pcode-factory.mjs";
const FACTORY_TEST = "scripts/build-g3-l2-ffdec-canvas-pcode-factory.test.mjs";
const CURRENT_JS_GENERATOR = "scripts/build-g3-l2-current-js-candidates.mjs";
const CURRENT_JS_TEST = "scripts/build-g3-l2-current-js-candidates.test.mjs";
const SAFE_ADAPTER = "scripts/build-safe-ffdec-canvas-adapter.mjs";
const WRAPPER_TEST = "scripts/run-g3-l2-gate0a-runtime-regeneration.test.mjs";
const FREEZE_PATH = "work/gate0a/g3-l2-family-receipt-freeze.v1.json";
const RECEIPT_PATH = "work/gate0a/g3-l2-regeneration-provenance.v1.json";
const RELEASE_ID = "lesson-g03-l02-addition-subtraction-page-only-current-js";

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

function canonicalCompactBytes(value) {
  return Buffer.from(JSON.stringify(canonical(value)));
}

function projectPath(relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0 && !path.isAbsolute(relativePath),
    `${label}: project-relative path required`);
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  invariant(resolved.startsWith(`${PROJECT_ROOT}${path.sep}`), `${label}: path escapes worktree`);
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
    return {bytes, identity, physical: {
      dev: String(before.dev), ino: String(before.ino), size: String(before.size),
      mtimeNs: String(before.mtimeNs), ctimeNs: String(before.ctimeNs),
    }};
  } finally {
    await handle.close();
  }
}

async function readProjectJson(relativePath, label, expected = null) {
  const observed = await stableRead(projectPath(relativePath, label), label, expected);
  return {value: JSON.parse(observed.bytes.toString("utf8")), path: relativePath,
    ...observed.identity, physical: observed.physical};
}

async function writeExclusive(relativePath, bytes, label) {
  const target = projectPath(relativePath, label);
  await mkdir(path.dirname(target), {recursive: true});
  const handle = await open(target, "wx", 0o444);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await chmod(target, 0o444);
  return stableRead(target, label, {bytes: bytes.length, sha256: sha256(bytes)});
}

function validateCanonicalDocument(document, label, {payloadTrailingLf = false} = {}) {
  invariant(document?.schemaVersion === 1 && typeof document.payload === "object",
    `${label}: schema/payload invalid`);
  const payloadBytes = payloadTrailingLf
    ? canonicalBytes(document.payload)
    : canonicalCompactBytes(document.payload);
  invariant(document.payloadSha256 === sha256(payloadBytes),
    `${label}: payload SHA-256 mismatch`);
}

function v9Rows(plan) {
  const rows = plan.payload?.runtimes?.filter(({releaseId, pageRenderer}) =>
    releaseId === RELEASE_ID && pageRenderer) ?? [];
  invariant(rows.length === 70, `v9 G3 L2 denominator drifted: ${rows.length}`);
  invariant(new Set(rows.map(({animationId}) => animationId)).size === 70,
    "v9 G3 L2 animation IDs are not unique");
  return rows;
}

async function identityFor(relativePath, label) {
  const observed = await stableRead(projectPath(relativePath, label), label);
  return {path: relativePath, ...observed.identity};
}

async function buildFreeze() {
  const [plan, factoryRun, audit, wrapper, wrapperTest, factoryGenerator,
    factoryTest, currentJsGenerator, currentJsTest, safeAdapter] = await Promise.all([
    readProjectJson(V9_PLAN_PATH, "v9 plan"),
    readProjectJson(FACTORY_RUN_PATH, "G3 L2 fresh factory run"),
    readProjectJson(AUDIT_PATH, "G3 L2 cross-grade audit"),
    stableRead(SCRIPT_PATH, "G3 L2 wrapper"),
    stableRead(projectPath(WRAPPER_TEST, "wrapper test"), "G3 L2 wrapper test"),
    stableRead(projectPath(FACTORY_GENERATOR, "factory generator"), "G3 L2 factory generator"),
    stableRead(projectPath(FACTORY_TEST, "factory test"), "G3 L2 factory test"),
    stableRead(projectPath(CURRENT_JS_GENERATOR, "Current-JS generator"), "G3 L2 Current-JS generator"),
    stableRead(projectPath(CURRENT_JS_TEST, "Current-JS test"), "G3 L2 Current-JS test"),
    stableRead(projectPath(SAFE_ADAPTER, "safe adapter"), "safe FFDec adapter"),
  ]);
  validateCanonicalDocument(plan.value, "v9 plan");
  invariant(v9Rows(plan.value).length === 70, "G3 L2 v9 scope invalid");
  invariant(factoryRun.value.compiler?.regenerationOnly === true &&
    factoryRun.value.compiler?.browserLaunched === false &&
    factoryRun.value.members?.length === 70,
  "G3 L2 fresh factory run is not browser-free 70/70");
  invariant(audit.value.members?.length === 70, "G3 L2 audit denominator drifted");
  invariant(factoryRun.value.inputLock?.factoryScript?.sha256 === factoryGenerator.identity.sha256,
    "G3 L2 fresh factory run generator lock drifted");
  const payload = {
    status: "frozen-before-family-provenance-receipt",
    v9Plan: {path: plan.path, bytes: plan.bytes, sha256: plan.sha256,
      payloadSha256: plan.value.payloadSha256},
    freshFactoryRun: {path: factoryRun.path, bytes: factoryRun.bytes, sha256: factoryRun.sha256},
    crossGradeAudit: {path: audit.path, bytes: audit.bytes, sha256: audit.sha256},
    runtimeWrapper: {path: path.relative(PROJECT_ROOT, SCRIPT_PATH), ...wrapper.identity},
    runtimeWrapperTest: {path: WRAPPER_TEST, ...wrapperTest.identity},
    factoryGenerator: {path: FACTORY_GENERATOR, ...factoryGenerator.identity},
    factoryGeneratorTest: {path: FACTORY_TEST, ...factoryTest.identity},
    currentJsGenerator: {path: CURRENT_JS_GENERATOR, ...currentJsGenerator.identity},
    currentJsGeneratorTest: {path: CURRENT_JS_TEST, ...currentJsTest.identity},
    safeAdapter: {path: SAFE_ADAPTER, ...safeAdapter.identity},
    boundaries: {browserStarted: false, adaptiveBatchApplyRun: false,
      productionRendererWritten: false, v2ProfileWritten: false,
      activeBindingWritten: false, deploymentRun: false,
      applySentinelUpdated: false},
  };
  const document = {schemaVersion: 1,
    receiptType: "g3-l2-gate0a-family-receipt-freeze-v1",
    payloadSha256: sha256(canonicalCompactBytes(payload)), payload};
  const bytes = canonicalBytes(document);
  const written = await writeExclusive(FREEZE_PATH, bytes, "G3 L2 family freeze");
  return {path: FREEZE_PATH, ...written.identity, payloadSha256: document.payloadSha256};
}

function assertFrozenIdentity(freeze, key, observed, label) {
  const expected = freeze.payload?.[key];
  invariant(expected?.bytes === observed.identity.bytes && expected?.sha256 === observed.identity.sha256,
    `${label}: drifted from family freeze`);
}

async function buildReceipt() {
  const [plan, factoryRun, audit, freeze, wrapper, wrapperTest,
    factoryGenerator, factoryTest, currentJsGenerator, currentJsTest, safeAdapter] = await Promise.all([
    readProjectJson(V9_PLAN_PATH, "v9 plan"),
    readProjectJson(FACTORY_RUN_PATH, "G3 L2 fresh factory run"),
    readProjectJson(AUDIT_PATH, "G3 L2 cross-grade audit"),
    readProjectJson(FREEZE_PATH, "G3 L2 family freeze"),
    stableRead(SCRIPT_PATH, "G3 L2 wrapper"),
    stableRead(projectPath(WRAPPER_TEST, "wrapper test"), "G3 L2 wrapper test"),
    stableRead(projectPath(FACTORY_GENERATOR, "factory generator"), "G3 L2 factory generator"),
    stableRead(projectPath(FACTORY_TEST, "factory test"), "G3 L2 factory test"),
    stableRead(projectPath(CURRENT_JS_GENERATOR, "Current-JS generator"), "G3 L2 Current-JS generator"),
    stableRead(projectPath(CURRENT_JS_TEST, "Current-JS test"), "G3 L2 Current-JS test"),
    stableRead(projectPath(SAFE_ADAPTER, "safe adapter"), "safe FFDec adapter"),
  ]);
  validateCanonicalDocument(plan.value, "v9 plan");
  validateCanonicalDocument(freeze.value, "G3 L2 family freeze");
  assertFrozenIdentity(freeze.value, "runtimeWrapper", wrapper, "G3 L2 wrapper");
  assertFrozenIdentity(freeze.value, "runtimeWrapperTest", wrapperTest, "G3 L2 wrapper test");
  assertFrozenIdentity(freeze.value, "factoryGenerator", factoryGenerator, "G3 L2 factory generator");
  assertFrozenIdentity(freeze.value, "factoryGeneratorTest", factoryTest, "G3 L2 factory test");
  assertFrozenIdentity(freeze.value, "currentJsGenerator", currentJsGenerator, "G3 L2 Current-JS generator");
  assertFrozenIdentity(freeze.value, "currentJsGeneratorTest", currentJsTest, "G3 L2 Current-JS test");
  assertFrozenIdentity(freeze.value, "safeAdapter", safeAdapter, "safe FFDec adapter");
  invariant(freeze.value.payload?.v9Plan?.sha256 === plan.sha256 &&
    freeze.value.payload?.freshFactoryRun?.sha256 === factoryRun.sha256 &&
    freeze.value.payload?.crossGradeAudit?.sha256 === audit.sha256,
  "G3 L2 frozen input identity drifted");
  invariant(factoryRun.value.compiler?.regenerationOnly === true &&
    factoryRun.value.compiler?.browserLaunched === false &&
    factoryRun.value.members?.length === 70,
  "G3 L2 fresh factory run is not browser-free 70/70");

  const checkCommand = await execFile(process.execPath, [projectPath(FACTORY_GENERATOR, "factory generator"),
    "--mode", "check", "--output", FACTORY_ROOT, "--source-root", SOURCE_ROOT,
    "--regeneration-only"], {
    cwd: PROJECT_ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024,
  });
  const checkStdout = Buffer.from(checkCommand.stdout ?? "");
  const checkStderr = Buffer.from(checkCommand.stderr ?? "");
  const checkResult = JSON.parse(checkStdout.toString("utf8"));
  invariant(checkResult.checked === true && checkResult.mode === "extend" &&
    checkResult.memberCount === 70,
  "G3 L2 factory check did not close 70/70");

  const regeneration = await buildG3L2CurrentJsCandidates({
    check: true, factoryRoot: FACTORY_ROOT, runtimeOnly: true, sourceRoot: SOURCE_ROOT,
  });
  invariant(regeneration.checked === true && regeneration.runtimeOnly === true &&
    regeneration.browserLaunched === false && regeneration.candidateCount === 70 &&
    regeneration.runtimes?.length === 70 &&
    regeneration.runtimes.every(({matchesV1Materialization}) => matchesV1Materialization === true),
  "G3 L2 runtime-only regeneration did not close 70/70");

  const runById = new Map(factoryRun.value.members.map((member) => [member.animationId, member]));
  const auditById = new Map(audit.value.members.map((member) => [member.animationId, member]));
  const runtimeById = new Map(regeneration.runtimes.map((runtime) => [runtime.animationId, runtime]));
  const records = [];
  for (const v9 of v9Rows(plan.value)) {
    const runMember = runById.get(v9.animationId);
    const auditMember = auditById.get(v9.animationId);
    const runtime = runtimeById.get(v9.animationId);
    invariant(runMember && auditMember && runtime, `${v9.animationId}: source/run/runtime row missing`);
    invariant(runtime.bytes === v9.input.bytes && runtime.sha256 === v9.input.sha256,
      `${v9.animationId}: regenerated runtime differs from v9 input`);
    invariant(runMember.ordinal === auditMember.ordinal && runtime.ordinal === auditMember.ordinal,
      `${v9.animationId}: source order drifted`);
    const memberManifestPath = `${FACTORY_ROOT}/${runMember.manifestPath}`;
    const memberManifest = await readProjectJson(memberManifestPath,
      `${v9.animationId} fresh member manifest`, runMember.manifest);
    const detail = memberManifest.value;
    invariant(detail.animationId === v9.animationId && detail.source?.unchanged === true &&
      detail.source?.before?.sha256 === auditMember.source?.sha256,
    `${v9.animationId}: source custody drifted`);
    invariant(detail.compiler?.canvasSmoke?.regenerationOnly === true &&
      detail.compiler?.canvasSmoke?.browserLaunched === false &&
      detail.compiler?.canvasSmoke?.captures?.length === 0,
    `${v9.animationId}: browser-free compiler boundary drifted`);
    const spriteRoot = `${FACTORY_ROOT}/members/${v9.animationId}/canvas/sprites/DefineSprite_${auditMember.target.objectId}`;
    const [helper, frames, swfmillXml, source, materialized] = await Promise.all([
      stableRead(projectPath(`${spriteRoot}/canvas.js`, "fresh helper"),
        `${v9.animationId} fresh helper`),
      stableRead(projectPath(`${spriteRoot}/frames.html`, "fresh frames"),
        `${v9.animationId} fresh frames`),
      stableRead(projectPath(
        `${FACTORY_ROOT}/members/${v9.animationId}/swfmill/source.xml`, "fresh swfmill XML"),
      `${v9.animationId} fresh swfmill XML`),
      stableRead(path.join(SOURCE_ROOT, detail.source.path), `${v9.animationId} source SWF`,
        detail.source.before),
      stableRead(projectPath(`apps/web/public/flash-assets/${v9.assetPath}`, "v1 runtime"),
        `${v9.animationId} v1 runtime`, v9.input),
    ]);
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
      source: {path: `source-assets/flash/HELP MATH_ORIGINAL FILES/${detail.source.path}`,
        ...source.identity},
      freshCompilerInput: {
        memberManifest: {path: memberManifestPath, bytes: memberManifest.bytes,
          sha256: memberManifest.sha256},
        swfmillXml: {path: `${FACTORY_ROOT}/members/${v9.animationId}/swfmill/source.xml`,
          ...swfmillXml.identity},
        canvasChecksumSetSha256: detail.compiler.outputInventory?.canvas?.checksumSetSha256,
        pcodeChecksumSetSha256: detail.compiler.outputInventory?.pcode?.checksumSetSha256,
        targetSpriteObjectId: auditMember.target.objectId,
        helper: {path: `${spriteRoot}/canvas.js`, ...helper.identity},
        framesHtml: {path: `${spriteRoot}/frames.html`, ...frames.identity},
      },
      regeneratedRuntime: {path: runtime.path, bytes: runtime.bytes, sha256: runtime.sha256},
      observedV1Materialization: {
        path: `apps/web/public/flash-assets/${v9.assetPath}`,
        ...materialized.identity, physical: materialized.physical,
      },
      exactV9InputMatch: true,
      placements: [{placementId: `g03-l02-placement-${String(runMember.ordinal).padStart(3, "0")}`,
        ordinal: runMember.ordinal}],
      browserStarted: false,
    });
  }
  invariant(records.length === 70 && new Set(records.map(({animationId}) => animationId)).size === 70,
    "G3 L2 provenance record denominator drifted");
  invariant(records.every(({input, output}) => input?.sha256 && output?.sha256),
    "G3 L2 provenance record is missing v9 input/output identity");

  const payload = {
    status: "pass",
    scope: "gate0a-g3-l2-regeneration-provenance",
    provenancePolicy: "source-first-or-canonical-advanced-manual-v1",
    summary: {recordCount: 70, placementCount: 70, sourceFirstPassCount: 70,
      advancedManualPassCount: 0, noGoCount: 0},
    inputs: {
      v9Plan: {path: plan.path, bytes: plan.bytes, sha256: plan.sha256},
      freshFactoryRun: {path: factoryRun.path, bytes: factoryRun.bytes, sha256: factoryRun.sha256},
      crossGradeAudit: {path: audit.path, bytes: audit.bytes, sha256: audit.sha256},
      freeze: {path: freeze.path, bytes: freeze.bytes, sha256: freeze.sha256},
      factoryGenerator: {path: FACTORY_GENERATOR, ...factoryGenerator.identity},
      factoryGeneratorTest: {path: FACTORY_TEST, ...factoryTest.identity},
      currentJsGenerator: {path: CURRENT_JS_GENERATOR, ...currentJsGenerator.identity},
      currentJsGeneratorTest: {path: CURRENT_JS_TEST, ...currentJsTest.identity},
      safeAdapter: {path: SAFE_ADAPTER, ...safeAdapter.identity},
      wrapper: {path: path.relative(PROJECT_ROOT, SCRIPT_PATH), ...wrapper.identity},
      factoryCheckCommand: {
        executable: process.execPath,
        args: [FACTORY_GENERATOR, "--mode", "check", "--output", FACTORY_ROOT,
          "--source-root", SOURCE_ROOT, "--regeneration-only"],
        exitCode: 0,
        stdout: {bytes: checkStdout.length, sha256: sha256(checkStdout)},
        stderr: {bytes: checkStderr.length, sha256: sha256(checkStderr)},
        browserStarted: false,
      },
    },
    records,
    boundaries: {browserStarted: false, adaptiveBatchApplyRun: false,
      productionRendererWritten: false, v2ProfileWritten: false,
      activeBindingWritten: false, deploymentRun: false,
      applySentinelUpdated: false, applyAuthorization: false},
  };
  const document = {schemaVersion: 1,
    receiptType: "adaptive-canvas-g3-l2-regeneration-provenance-v1",
    payloadSha256: sha256(canonicalBytes(payload)), payload};
  const bytes = canonicalBytes(document);
  const written = await writeExclusive(RECEIPT_PATH, bytes, "G3 L2 provenance receipt");
  return {receipt: {path: RECEIPT_PATH, ...written.identity,
    payloadSha256: document.payloadSha256}, summary: payload.summary};
}

async function main(argv = process.argv.slice(2)) {
  invariant(argv.length === 0 || (argv.length === 1 && argv[0] === "--freeze"),
    "usage: run-g3-l2-gate0a-runtime-regeneration.mjs [--freeze]");
  const result = argv[0] === "--freeze" ? {freeze: await buildFreeze()} : await buildReceipt();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
