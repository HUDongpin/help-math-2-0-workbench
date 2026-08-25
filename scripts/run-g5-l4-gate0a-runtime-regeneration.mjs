#!/usr/bin/env node

/**
 * Gate 0A-only G5 L4 source-first orchestration.
 *
 * --preflight regenerates all 54 fixed-k1 runtimes without writing evidence.
 * --freeze create-exclusively freezes the family inputs. The default mode
 * verifies that freeze, reruns all 54 regenerations, and create-exclusively
 * writes the family provenance receipt. No mode launches a browser or writes
 * a production renderer, adaptive profile, active binding, or deployment.
 */

import {constants as fsConstants} from "node:fs";
import {createHash} from "node:crypto";
import {chmod, lstat, mkdir, open} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {buildFq001CompositeCandidate} from
  "./build-g5-l4-fq001-dual-sprite-composite-candidate.mjs";
import {buildQuestionAtlasCandidates} from
  "./build-g5-l4-fq23-question-atlas-candidates.mjs";
import {
  buildG5L4SourceStaticCandidates,
  G5_L4_SOURCE_STATIC_IDS,
} from "./build-g5-l4-source-static-candidates.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const CANONICAL_PROJECT_ROOT = "/Volumes/WestWorld/HELP MATH 2.0";
const SOURCE_ROOT = path.join(CANONICAL_PROJECT_ROOT,
  "source-assets/flash/HELP MATH_ORIGINAL FILES");
const RELEASE_ID = "lesson-g05-l04-number-lines";
const V9_PLAN_PATH = "work/adaptive-canvas-production-five.plan.v9.json";
const PARENT_FREEZE_PATH =
  "work/adaptive-canvas-production-five.gate0a-freeze.v1.json";
const SOURCE_SCOPE_PATH = "reports/g5-l4-source-scope-freeze.json";
const WRAPPER_TEST = "scripts/run-g5-l4-gate0a-runtime-regeneration.test.mjs";
const FREEZE_PATH = "work/gate0a/g5-l4-family-receipt-freeze.v1.json";
const RECEIPT_PATH = "work/gate0a/g5-l4-regeneration-provenance.v1.json";
const DEDICATED_IDS = Object.freeze([
  "course-g05-l04-fq-001",
  "course-g05-l04-fq-002",
  "course-g05-l04-fq-003",
]);
const DEDICATED_SPEC_PATHS = Object.freeze([
  "migrations/course-g05-l04-fq-001/audit/dual-sprite-composite-current-js-candidate-spec.json",
  "migrations/course-g05-l04-fq-002/audit/question-atlas-current-js-candidate-spec.json",
  "migrations/course-g05-l04-fq-003/audit/question-atlas-current-js-candidate-spec.json",
]);
const GENERATOR_PATHS = Object.freeze([
  "scripts/build-g5-l4-fq001-dual-sprite-composite-candidate.mjs",
  "scripts/build-g5-l4-fq001-dual-sprite-composite-candidate.test.mjs",
  "scripts/build-g5-l4-fq23-question-atlas-candidates.mjs",
  "scripts/build-g5-l4-fq23-question-atlas-candidates.test.mjs",
  "scripts/build-g5-l4-source-static-candidates.mjs",
  "scripts/build-g5-l4-source-static-candidates.test.mjs",
  "scripts/build-safe-ffdec-canvas-adapter.mjs",
  "scripts/build-safe-ffdec-canvas-adapter.test.mjs",
]);

function invariant(value, message) {
  if (!value) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [
      key,
      canonical(value[key]),
    ]));
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
  invariant(
    typeof relativePath === "string" && relativePath.length > 0 &&
      !path.isAbsolute(relativePath),
    `${label}: project-relative path required`,
  );
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  invariant(resolved.startsWith(`${PROJECT_ROOT}${path.sep}`),
    `${label}: path escapes worktree`);
  return resolved;
}

async function stableRead(filePath, label, expected = null) {
  const info = await lstat(filePath);
  invariant(info.isFile() && !info.isSymbolicLink(),
    `${label}: ordinary file required`);
  const handle = await open(
    filePath,
    fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW,
  );
  try {
    const before = await handle.stat({bigint: true});
    const bytes = await handle.readFile();
    const after = await handle.stat({bigint: true});
    for (const key of ["dev", "ino", "size", "mtimeNs", "ctimeNs"]) {
      invariant(before[key] === after[key], `${label}: unstable read (${key})`);
    }
    const identity = {bytes: bytes.length, sha256: sha256(bytes)};
    if (expected) {
      invariant(
        identity.bytes === expected.bytes &&
          identity.sha256 === expected.sha256,
        `${label}: bytes/SHA-256 mismatch`,
      );
    }
    return {
      bytes,
      identity,
      physical: {
        dev: String(before.dev),
        ino: String(before.ino),
        size: String(before.size),
        mtimeNs: String(before.mtimeNs),
        ctimeNs: String(before.ctimeNs),
      },
    };
  } finally {
    await handle.close();
  }
}

async function readProjectJson(relativePath, label, expected = null) {
  const observed = await stableRead(
    projectPath(relativePath, label),
    label,
    expected,
  );
  return {
    value: JSON.parse(observed.bytes.toString("utf8")),
    path: relativePath,
    ...observed.identity,
    physical: observed.physical,
  };
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
  return stableRead(target, label, {
    bytes: bytes.length,
    sha256: sha256(bytes),
  });
}

function validateCanonicalDocument(document, label) {
  invariant(document?.schemaVersion === 1 && typeof document.payload === "object",
    `${label}: schema/payload invalid`);
  invariant(
    document.payloadSha256 === sha256(canonicalCompactBytes(document.payload)) ||
      document.payloadSha256 === sha256(canonicalBytes(document.payload)),
    `${label}: payload SHA-256 mismatch`,
  );
}

function v9Rows(plan) {
  const rows = plan.payload?.runtimes?.filter(
    ({releaseId}) => releaseId === RELEASE_ID,
  ) ?? [];
  invariant(rows.length === 54,
    `v9 G5 L4 runtime denominator drifted: ${rows.length}`);
  invariant(rows.every(({pageRenderer}) => pageRenderer === true),
    "v9 G5 L4 contains a non-page runtime");
  invariant(new Set(rows.map(({animationId}) => animationId)).size === 54,
    "v9 G5 L4 animation IDs are not unique");
  return rows;
}

function sharedSpecPath(animationId) {
  return `migrations/${animationId}/audit/source-static-current-js-candidate-spec.json`;
}

async function identityRows(paths) {
  const rows = [];
  for (const relativePath of [...paths].sort()) {
    const observed = await stableRead(
      projectPath(relativePath, relativePath),
      relativePath,
    );
    rows.push({path: relativePath, ...observed.identity});
  }
  return {
    count: rows.length,
    checksumSetSha256: sha256(canonicalCompactBytes(rows)),
    rows,
  };
}

function runtimeFromResult(result, animationId) {
  const runtime = result?.runtime;
  invariant(
    runtime && Number.isSafeInteger(runtime.bytes) &&
      /^[a-f0-9]{64}$/.test(runtime.sha256 ?? ""),
    `${animationId}: regeneration runtime identity missing`,
  );
  invariant(result.browserLaunched === false,
    `${animationId}: browserLaunched=false proof missing`);
  invariant(result.regenerationOnly === true,
    `${animationId}: regenerationOnly proof missing`);
  invariant(
    runtime.matchesV1Materialization === true &&
      runtime.matchesV9Input === true,
    `${animationId}: v1/v9 runtime parity proof missing`,
  );
  return runtime;
}

function assertRuntimeMatchesV9(runtime, row) {
  invariant(
    runtime.bytes === row.input.bytes && runtime.sha256 === row.input.sha256,
    `${row.animationId}: regenerated runtime differs from v9 input`,
  );
}

async function runAllRegenerations(plan, sourceScope) {
  const rows = v9Rows(plan);
  const rowById = new Map(rows.map((row) => [row.animationId, row]));
  invariant(
    G5_L4_SOURCE_STATIC_IDS.length === 51 &&
      new Set(G5_L4_SOURCE_STATIC_IDS).size === 51,
    "G5 L4 shared source-static denominator drifted",
  );

  const shared = await buildG5L4SourceStaticCandidates({
    check: true,
    ids: [...G5_L4_SOURCE_STATIC_IDS],
    regenerationOnly: true,
    sourceRoot: SOURCE_ROOT,
  });
  invariant(
    shared.memberCount === 51 && shared.results?.length === 51 &&
      shared.browserLaunched === false,
    "G5 L4 shared source-static regeneration did not close 51 pages",
  );
  const fq001 = await buildFq001CompositeCandidate({
    check: true,
    regenerationOnly: true,
    sourceRoot: SOURCE_ROOT,
  });
  const fq23 = await buildQuestionAtlasCandidates({
    check: true,
    regenerationOnly: true,
    sourceRoot: SOURCE_ROOT,
  });
  invariant(
    fq23.browserLaunched === false && fq23.results?.length === 2 &&
      fq23.siblingFreshFfdecExportsEqual === true,
    "G5 L4 FQ002/FQ003 no-browser source-first regeneration did not close",
  );

  const resultById = new Map();
  for (const result of shared.results) {
    resultById.set(result.animationId, {
      kind: "shared-source-static",
      result,
      runtime: runtimeFromResult(result, result.animationId),
    });
  }
  resultById.set(fq001.animationId, {
    kind: "fq001-dual-sprite-source-first",
    result: fq001,
    runtime: runtimeFromResult(fq001, fq001.animationId),
  });
  for (const result of fq23.results) {
    resultById.set(result.animationId, {
      kind: "fq23-question-atlas-source-first",
      result,
      runtime: runtimeFromResult(result, result.animationId),
    });
  }
  invariant(resultById.size === 54,
    `G5 L4 regenerated runtime denominator drifted: ${resultById.size}`);
  for (const [animationId, evidence] of resultById) {
    const row = rowById.get(animationId);
    invariant(row, `${animationId}: v9 row missing`);
    assertRuntimeMatchesV9(evidence.runtime, row);
  }

  const members = sourceScope.members?.filter(({role}) => role === "lesson-page") ?? [];
  const memberById = new Map(members.map((member) => [member.animationId, member]));
  invariant(
    members.length === 54 && memberById.size === 54 &&
      sourceScope.summary?.pageCount === 54,
    "G5 L4 source-order page denominator drifted",
  );
  const records = [];
  for (const row of rows) {
    const evidence = resultById.get(row.animationId);
    const member = memberById.get(row.animationId);
    invariant(evidence && member,
      `${row.animationId}: source-first or source-order evidence missing`);
    const source = member.source?.swf;
    invariant(
      typeof source?.path === "string" && Number.isSafeInteger(source.bytes) &&
        /^[a-f0-9]{64}$/.test(source.sha256 ?? ""),
      `${row.animationId}: canonical source SWF identity missing`,
    );
    const sourceObserved = await stableRead(
      path.join(SOURCE_ROOT, source.path),
      `${row.animationId} canonical source SWF`,
      source,
    );
    const publicPath = `public/flash-assets/${row.assetPath}`;
    const appPath = `apps/web/public/flash-assets/${row.assetPath}`;
    const [publicRuntime, appRuntime] = await Promise.all([
      stableRead(
        projectPath(publicPath, "public v1 runtime"),
        `${row.animationId} public v1`,
        row.input,
      ),
      stableRead(
        projectPath(appPath, "app v1 runtime"),
        `${row.animationId} app v1`,
        row.input,
      ),
    ]);
    records.push({
      animationId: row.animationId,
      metadataAnimationId: row.metadataAnimationId,
      pageRenderer: row.pageRenderer,
      assetPath: row.assetPath,
      relativePath: row.relativePath,
      releaseId: row.releaseId,
      family: row.family,
      lane: row.lane,
      input: row.input,
      output: row.output,
      provenanceClass: "source-first-regeneration",
      source: {
        path: `source-assets/flash/HELP MATH_ORIGINAL FILES/${source.path}`,
        ...sourceObserved.identity,
      },
      placements: [{
        placementId: `g05-l04-placement-${String(member.ordinal).padStart(3, "0")}`,
        ordinal: member.ordinal,
      }],
      regenerationKind: evidence.kind,
      regenerationEvidence: evidence.result,
      regeneratedRuntime: evidence.runtime,
      observedV1Materialization: {
        path: appPath,
        ...appRuntime.identity,
        physical: appRuntime.physical,
      },
      generatorMaterialization: {
        path: publicPath,
        ...publicRuntime.identity,
        physical: publicRuntime.physical,
      },
      exactV9InputMatch: true,
      browserStarted: false,
    });
  }
  invariant(
    records.length === 54 &&
      new Set(records.map(({animationId}) => animationId)).size === 54 &&
      records.reduce((sum, {placements}) => sum + placements.length, 0) === 54,
    "G5 L4 provenance record/placement denominator drifted",
  );
  return records;
}

async function loadBaseInputs() {
  const [plan, parentFreeze, sourceScope] = await Promise.all([
    readProjectJson(V9_PLAN_PATH, "v9 plan"),
    readProjectJson(PARENT_FREEZE_PATH, "parent Gate 0A freeze"),
    readProjectJson(SOURCE_SCOPE_PATH, "G5 L4 source scope"),
  ]);
  validateCanonicalDocument(plan.value, "v9 plan");
  validateCanonicalDocument(parentFreeze.value, "parent Gate 0A freeze");
  invariant(v9Rows(plan.value).length === 54, "G5 L4 v9 scope invalid");
  invariant(
    sourceScope.value?.releaseId === RELEASE_ID &&
      sourceScope.value?.summary?.pageCount === 54,
    "G5 L4 source scope invalid",
  );
  return {plan, parentFreeze, sourceScope};
}

async function buildFreeze() {
  const base = await loadBaseInputs();
  const [wrapper, wrapperTest, generatorSet, sharedSpecSet, dedicatedSpecSet] =
    await Promise.all([
      stableRead(SCRIPT_PATH, "G5 L4 wrapper"),
      stableRead(
        projectPath(WRAPPER_TEST, "wrapper test"),
        "G5 L4 wrapper test",
      ),
      identityRows(GENERATOR_PATHS),
      identityRows(G5_L4_SOURCE_STATIC_IDS.map(sharedSpecPath)),
      identityRows(DEDICATED_SPEC_PATHS),
    ]);
  const payload = {
    status: "frozen-before-family-provenance-receipt",
    v9Plan: {
      path: base.plan.path,
      bytes: base.plan.bytes,
      sha256: base.plan.sha256,
      payloadSha256: base.plan.value.payloadSha256,
    },
    parentGate0aFreeze: {
      path: base.parentFreeze.path,
      bytes: base.parentFreeze.bytes,
      sha256: base.parentFreeze.sha256,
      payloadSha256: base.parentFreeze.value.payloadSha256,
    },
    sourceScope: {
      path: base.sourceScope.path,
      bytes: base.sourceScope.bytes,
      sha256: base.sourceScope.sha256,
    },
    runtimeWrapper: {
      path: path.relative(PROJECT_ROOT, SCRIPT_PATH),
      ...wrapper.identity,
    },
    runtimeWrapperTest: {path: WRAPPER_TEST, ...wrapperTest.identity},
    generatorSet,
    sharedSpecSet,
    dedicatedSpecSet,
    boundaries: {
      browserStarted: false,
      adaptiveBatchApplyRun: false,
      productionRendererWritten: false,
      v2ProfileWritten: false,
      activeBindingWritten: false,
      deploymentRun: false,
      applySentinelUpdated: false,
    },
  };
  const document = {
    schemaVersion: 1,
    receiptType: "g5-l4-gate0a-family-receipt-freeze-v1",
    payloadSha256: sha256(canonicalCompactBytes(payload)),
    payload,
  };
  const bytes = canonicalBytes(document);
  const written = await writeExclusive(
    FREEZE_PATH,
    bytes,
    "G5 L4 family freeze",
  );
  return {
    path: FREEZE_PATH,
    ...written.identity,
    payloadSha256: document.payloadSha256,
  };
}

async function verifyFreeze(base) {
  const freeze = await readProjectJson(FREEZE_PATH, "G5 L4 family freeze");
  validateCanonicalDocument(freeze.value, "G5 L4 family freeze");
  const [wrapper, wrapperTest, generatorSet, sharedSpecSet, dedicatedSpecSet] =
    await Promise.all([
      stableRead(SCRIPT_PATH, "G5 L4 wrapper"),
      stableRead(
        projectPath(WRAPPER_TEST, "wrapper test"),
        "G5 L4 wrapper test",
      ),
      identityRows(GENERATOR_PATHS),
      identityRows(G5_L4_SOURCE_STATIC_IDS.map(sharedSpecPath)),
      identityRows(DEDICATED_SPEC_PATHS),
    ]);
  const payload = freeze.value.payload;
  invariant(
    payload.runtimeWrapper?.bytes === wrapper.identity.bytes &&
      payload.runtimeWrapper.sha256 === wrapper.identity.sha256 &&
      payload.runtimeWrapperTest?.bytes === wrapperTest.identity.bytes &&
      payload.runtimeWrapperTest.sha256 === wrapperTest.identity.sha256,
    "G5 L4 wrapper/test drifted from freeze",
  );
  invariant(
    payload.generatorSet?.checksumSetSha256 ===
        generatorSet.checksumSetSha256 &&
      payload.sharedSpecSet?.checksumSetSha256 ===
        sharedSpecSet.checksumSetSha256 &&
      payload.dedicatedSpecSet?.checksumSetSha256 ===
        dedicatedSpecSet.checksumSetSha256,
    "G5 L4 generator/spec set drifted from freeze",
  );
  invariant(
    payload.v9Plan?.sha256 === base.plan.sha256 &&
      payload.parentGate0aFreeze?.sha256 === base.parentFreeze.sha256 &&
      payload.sourceScope?.sha256 === base.sourceScope.sha256,
    "G5 L4 frozen input identity drifted",
  );
  return {
    freeze,
    wrapper,
    wrapperTest,
    generatorSet,
    sharedSpecSet,
    dedicatedSpecSet,
  };
}

async function preflight() {
  const base = await loadBaseInputs();
  const records = await runAllRegenerations(
    base.plan.value,
    base.sourceScope.value,
  );
  return {
    status: "pass-no-write-preflight",
    recordCount: records.length,
    pageRendererCount: records.length,
    placementCount: records.reduce(
      (sum, {placements}) => sum + placements.length,
      0,
    ),
    browserStarted: false,
    applyAuthorization: false,
  };
}

async function buildReceipt() {
  const base = await loadBaseInputs();
  const frozen = await verifyFreeze(base);
  const records = await runAllRegenerations(
    base.plan.value,
    base.sourceScope.value,
  );
  const payload = {
    status: "pass",
    scope: "gate0a-g5-l4-regeneration-provenance",
    provenancePolicy: "source-first-or-canonical-advanced-manual-v1",
    summary: {
      recordCount: 54,
      pageRendererCount: 54,
      loadedHostCount: 0,
      placementCount: 54,
      sourceFirstPassCount: 54,
      advancedManualPassCount: 0,
      noGoCount: 0,
    },
    inputs: {
      v9Plan: {
        path: base.plan.path,
        bytes: base.plan.bytes,
        sha256: base.plan.sha256,
      },
      parentGate0aFreeze: {
        path: base.parentFreeze.path,
        bytes: base.parentFreeze.bytes,
        sha256: base.parentFreeze.sha256,
      },
      familyFreeze: {
        path: frozen.freeze.path,
        bytes: frozen.freeze.bytes,
        sha256: frozen.freeze.sha256,
      },
      sourceScope: {
        path: base.sourceScope.path,
        bytes: base.sourceScope.bytes,
        sha256: base.sourceScope.sha256,
      },
      generatorSet: frozen.generatorSet,
      sharedSpecSet: frozen.sharedSpecSet,
      dedicatedSpecSet: frozen.dedicatedSpecSet,
      wrapper: {
        path: path.relative(PROJECT_ROOT, SCRIPT_PATH),
        ...frozen.wrapper.identity,
      },
    },
    records,
    boundaries: {
      browserStarted: false,
      adaptiveBatchApplyRun: false,
      productionRendererWritten: false,
      v2ProfileWritten: false,
      activeBindingWritten: false,
      deploymentRun: false,
      applySentinelUpdated: false,
      applyAuthorization: false,
      legacyCourseShellMigrationMemberAdded: false,
    },
  };
  const document = {
    schemaVersion: 1,
    receiptType: "adaptive-canvas-g5-l4-regeneration-provenance-v1",
    payloadSha256: sha256(canonicalBytes(payload)),
    payload,
  };
  const bytes = canonicalBytes(document);
  const written = await writeExclusive(
    RECEIPT_PATH,
    bytes,
    "G5 L4 provenance receipt",
  );
  return {
    receipt: {
      path: RECEIPT_PATH,
      ...written.identity,
      payloadSha256: document.payloadSha256,
    },
    summary: payload.summary,
  };
}

export function parseArguments(argv) {
  invariant(
    argv.length <= 1,
    "usage: run-g5-l4-gate0a-runtime-regeneration.mjs [--preflight|--freeze]",
  );
  if (argv.length === 0) return {mode: "receipt"};
  if (argv[0] === "--preflight") return {mode: "preflight"};
  if (argv[0] === "--freeze") return {mode: "freeze"};
  throw new Error(
    "usage: run-g5-l4-gate0a-runtime-regeneration.mjs [--preflight|--freeze]",
  );
}

async function main(argv = process.argv.slice(2)) {
  const {mode} = parseArguments(argv);
  const result = mode === "preflight" ? await preflight()
    : mode === "freeze" ? {freeze: await buildFreeze()}
      : await buildReceipt();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
