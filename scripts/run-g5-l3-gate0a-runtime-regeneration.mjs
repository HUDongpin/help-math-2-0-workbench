#!/usr/bin/env node

/** Run the canonical G5 L3 v1 generator without browser QA and bind 64 v9 rows. */

import {createHash} from "node:crypto";
import {chmod, lstat, mkdir, open, readFile, realpath} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {buildG5L3ProductSlice} from
  "../work/gate0a/g5-l3-canonical-toolchain-v1/build-g5-l3-source-static-product-slice.gate0a.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const V9_PLAN_PATH = "work/adaptive-canvas-production-five.plan.v9.json";
const CORPUS_PATH = "tools/g5-l3-migration/corpus.json";
const CROSSCHECK_PATH = "work/gate0a/g5-l3-source-crosscheck-v1/gate0a-source-crosscheck-run.json";
const CANONICALIZATION_PATH = "work/gate0a/g5-l3-toolchain-canonicalization.v1.json";
const FREEZE_PATH = "work/gate0a/g5-l3-source-first-run-freeze.v1.json";
const TRANSFORMED_RUNNER =
  "work/gate0a/g5-l3-canonical-toolchain-v1/build-g5-l3-source-static-product-slice.gate0a.mjs";
const ORIGINAL_GENERATOR = "scripts/build-g5-l3-source-static-product-slice.mjs";
const LEGACY_ADAPTER =
  "work/gate0a/g5-l3-canonical-toolchain-v1/build-safe-ffdec-canvas-adapter.mjs";
const RECEIPT_PATH = "work/gate0a/g5-l3-regeneration-provenance.v1.json";

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
    return {bytes, identity, physical: {
      dev: String(before.dev), ino: String(before.ino), size: String(before.size),
      mtimeNs: String(before.mtimeNs), ctimeNs: String(before.ctimeNs),
    }};
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
  return stableRead(target, "written G5 L3 provenance receipt",
    {bytes: bytes.length, sha256: sha256(bytes)});
}

function v9Rows(plan) {
  const rows = plan.payload?.runtimes?.filter(({releaseId, pageRenderer}) =>
    releaseId === "lesson-g05-l03-exponents-prime-factorizations-page-only" && pageRenderer) ?? [];
  invariant(rows.length === 64, `v9 G5 L3 denominator drifted: ${rows.length}`);
  return rows;
}

async function main() {
  invariant(process.env.HELP_MATH_GATE0A_RUNTIME_ONLY === "1",
    "HELP_MATH_GATE0A_RUNTIME_ONLY=1 is required");
  const evidenceRoot = process.env.HELP_MATH_GATE0A_EVIDENCE_ROOT;
  invariant(evidenceRoot && path.isAbsolute(evidenceRoot),
    "HELP_MATH_GATE0A_EVIDENCE_ROOT must be absolute");
  const expectedPrefix = path.join(PROJECT_ROOT, "work", "gate0a") + path.sep;
  invariant(path.resolve(evidenceRoot).startsWith(expectedPrefix),
    "G5 L3 evidence root must stay under work/gate0a");
  invariant(process.env.HELP_MATH_GATE0A_SOURCE_ROOT &&
    path.isAbsolute(process.env.HELP_MATH_GATE0A_SOURCE_ROOT),
  "HELP_MATH_GATE0A_SOURCE_ROOT must be absolute");
  invariant(path.resolve(process.env.HELP_MATH_GATE0A_PROJECT_ROOT ?? "") === PROJECT_ROOT,
    "HELP_MATH_GATE0A_PROJECT_ROOT must equal the isolated worktree");

  const [plan, corpus, crosscheck, canonicalization, freeze, runner, transformed,
    originalGenerator, adapter] = await Promise.all([
    readJson(V9_PLAN_PATH, "v9 plan"),
    readJson(CORPUS_PATH, "G5 L3 corpus"),
    readJson(CROSSCHECK_PATH, "G5 L3 source crosscheck"),
    readJson(CANONICALIZATION_PATH, "G5 L3 canonicalization"),
    readJson(FREEZE_PATH, "G5 L3 run freeze"),
    stableRead(SCRIPT_PATH, "G5 L3 runtime wrapper"),
    stableRead(resolveProject(TRANSFORMED_RUNNER, "transformed runner"), "transformed v1 runner"),
    stableRead(resolveProject(ORIGINAL_GENERATOR, "original generator"), "original v1 generator"),
    stableRead(resolveProject(LEGACY_ADAPTER, "legacy adapter"), "legacy safe adapter"),
  ]);
  invariant(crosscheck.value.status === "pass-source-first-ir-crosscheck" &&
    crosscheck.value.records?.length === 64,
  "G5 L3 source crosscheck is not a 64/64 pass");
  invariant(canonicalization.value.payload?.memberRecords?.length === 64,
    "G5 L3 canonicalization is incomplete");
  invariant(freeze.value.payload?.status === "frozen-before-fresh-source-first-run",
    "G5 L3 pre-run freeze is invalid");
  invariant(corpus.value.members?.length === 64 && corpus.value.placements?.length === 65,
    "G5 L3 corpus denominator drifted");

  const result = await buildG5L3ProductSlice({all: true, check: true, ffdec: "ffdec"});
  invariant(result.memberCount === 64 && result.members?.length === 64,
    "G5 L3 v1 runtime regeneration denominator drifted");
  invariant(result.members.every(({browserQa}) =>
    browserQa?.status === "not-run-gate0a-browser-prohibited" &&
    browserQa?.browserStarted === false),
  "G5 L3 runtime regeneration crossed the browser boundary");

  const resultById = new Map(result.members.map((member) => [member.animationId, member]));
  const crosscheckById = new Map(crosscheck.value.records.map((record) =>
    [record.animationId, record]));
  const corpusById = new Map(corpus.value.members.map((member) => [member.animationId, member]));
  const records = [];
  for (const v9 of v9Rows(plan.value)) {
    const regenerated = resultById.get(v9.animationId);
    const sourceCrosscheck = crosscheckById.get(v9.animationId);
    const member = corpusById.get(v9.animationId);
    invariant(regenerated && sourceCrosscheck && member,
      `${v9.animationId}: regeneration/source/corpus row missing`);
    invariant(regenerated.runtime.bytes === v9.input.bytes &&
      regenerated.runtime.sha256 === v9.input.sha256,
    `${v9.animationId}: regenerated runtime differs from v9 input`);
    const materializedPath = `apps/web/public/flash-assets/${v9.assetPath}`;
    const materialized = await stableRead(resolveProject(materializedPath, "v1 runtime"),
      `${v9.animationId} v1 runtime`, v9.input);
    const spriteRoot = path.join(evidenceRoot, v9.animationId,
      `DefineSprite_${regenerated.target.objectId}`);
    const [helper, frames] = await Promise.all([
      stableRead(path.join(spriteRoot, "canvas.js"), `${v9.animationId} fresh helper`,
        regenerated.sourceFirstCompilerInput.helper),
      stableRead(path.join(spriteRoot, "frames.html"), `${v9.animationId} fresh frames`,
        regenerated.sourceFirstCompilerInput.framesHtml),
    ]);
    const placements = corpus.value.placements.filter(({animationId}) =>
      animationId === v9.animationId).map(({placementId, ordinal}) => ({placementId, ordinal}));
    invariant(placements.length === (v9.animationId === "course-g05-l03-in-028" ? 2 : 1),
      `${v9.animationId}: placement denominator drifted`);
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
      placements,
      provenanceClass: "source-first-regeneration",
      source: regenerated.sourceFirstCompilerInput.source,
      sourceIrCrosscheck: {
        manifestPath: sourceCrosscheck.manifestPath,
        manifest: sourceCrosscheck.manifest,
        freshSwfmillSha256: sourceCrosscheck.freshSwfmillSha256,
        freshFfdecScriptsSha256: sourceCrosscheck.freshFfdecScriptsSha256,
      },
      freshFfdecCanvas: {
        targetSpriteObjectId: regenerated.target.objectId,
        helper: {path: path.relative(PROJECT_ROOT, path.join(spriteRoot, "canvas.js")),
          ...helper.identity},
        framesHtml: {path: path.relative(PROJECT_ROOT, path.join(spriteRoot, "frames.html")),
          ...frames.identity},
      },
      regeneratedRuntime: regenerated.runtime,
      observedV1Materialization: {path: materializedPath, ...materialized.identity,
        physical: materialized.physical},
      exactV9InputMatch: true,
      browserStarted: false,
    });
  }
  invariant(records.length === 64 && new Set(records.map(({animationId}) => animationId)).size === 64,
    "G5 L3 provenance record denominator drifted");
  invariant(records.reduce((sum, {placements}) => sum + placements.length, 0) === 65,
    "G5 L3 placement denominator drifted");

  const payload = {
    status: "pass",
    scope: "gate0a-g5-l3-regeneration-provenance",
    provenancePolicy: "source-first-or-canonical-advanced-manual-v1",
    summary: {recordCount: 64, placementCount: 65, sourceFirstPassCount: 64,
      advancedManualPassCount: 0, noGoCount: 0},
    inputs: {
      v9Plan: {path: plan.path, bytes: plan.bytes, sha256: plan.sha256},
      corpus: {path: corpus.path, bytes: corpus.bytes, sha256: corpus.sha256},
      sourceCrosscheck: {path: crosscheck.path, bytes: crosscheck.bytes,
        sha256: crosscheck.sha256},
      canonicalization: {path: canonicalization.path, bytes: canonicalization.bytes,
        sha256: canonicalization.sha256},
      freeze: {path: freeze.path, bytes: freeze.bytes, sha256: freeze.sha256},
      originalGenerator: {path: ORIGINAL_GENERATOR, ...originalGenerator.identity},
      transformedRunner: {path: TRANSFORMED_RUNNER, ...transformed.identity},
      legacyAdapter: {path: LEGACY_ADAPTER, ...adapter.identity},
      wrapper: {path: path.relative(PROJECT_ROOT, SCRIPT_PATH), ...runner.identity},
      freshEvidenceRoot: path.relative(PROJECT_ROOT, evidenceRoot),
    },
    records,
    boundaries: {browserStarted: false, adaptiveBatchApplyRun: false,
      productionRendererWritten: false, v2ProfileWritten: false,
      activeBindingWritten: false, deploymentRun: false, applySentinelUpdated: false,
      applyAuthorization: false},
  };
  const payloadBytes = canonicalBytes(payload);
  const document = {schemaVersion: 1,
    receiptType: "adaptive-canvas-g5-l3-regeneration-provenance-v1",
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
