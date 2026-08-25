#!/usr/bin/env node

/**
 * Gate 0A-only G4 L3 source-first orchestration.
 *
 * --preflight runs all 39 page regenerations plus the IR001 loaded-host
 * derivation without writing a receipt. --freeze creates the immutable family
 * input freeze. The default mode re-runs the same checks and create-exclusively
 * writes the family provenance receipt. No mode launches a browser or writes a
 * production renderer, adaptive profile, active binding, or deployment state.
 */

import {constants as fsConstants} from "node:fs";
import {createHash} from "node:crypto";
import {chmod, lstat, mkdir, open} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {generateG4L3In003CurrentJsCandidate} from
  "./build-g4-l3-in003-current-js-candidate.mjs";
import {buildG4L3McBackTextHostComposite} from
  "./build-g4-l3-mc-back-text-host-composite.mjs";
import {generateG4L3Rw003CurrentJsCandidate} from
  "./build-g4-l3-rw003-current-js-candidate.mjs";
import {generateG4L3SourceStaticCandidate} from
  "./build-g4-l3-source-static-candidate.mjs";
import {generateG4L3Ts006CurrentJsCandidate} from
  "./build-g4-l3-ts006-current-js-candidate.mjs";
import {generateG4L3Vb005CurrentJsCandidate} from
  "./build-g4-l3-vb005-current-js-candidate.mjs";
import {generateG4L3Vb006CurrentJsCandidate} from
  "./build-g4-l3-vb006-current-js-candidate.mjs";
import {generateG4L3Vb009CurrentJsCandidate} from
  "./build-g4-l3-vb009-current-js-candidate.mjs";
import {generateIn009CanvasCandidate} from
  "./build-in-009-ffdec-canvas-candidate.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const CANONICAL_PROJECT_ROOT = "/Volumes/WestWorld/HELP MATH 2.0";
const SOURCE_ROOT = path.join(CANONICAL_PROJECT_ROOT,
  "source-assets/flash/HELP MATH_ORIGINAL FILES");
const SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const RELEASE_ID = "lesson-g04-l03-negative-numbers";
const V9_PLAN_PATH = "work/adaptive-canvas-production-five.plan.v9.json";
const PARENT_FREEZE_PATH = "work/adaptive-canvas-production-five.gate0a-freeze.v1.json";
const NAVIGATION_PATH = "reports/g4-l3-lesson-product-navigation-contract.json";
const AUTHORING_CANONICALIZATION =
  "work/gate0a/g4-l3-authoring-evidence-canonicalization.v1.json";
const IN009_CANONICALIZATION =
  "work/gate0a/in009-root-baseline-evidence-canonicalization.v1.json";
const WRAPPER_TEST = "scripts/run-g4-l3-gate0a-runtime-regeneration.test.mjs";
const FREEZE_PATH = "work/gate0a/g4-l3-family-receipt-freeze.v1.json";
const RECEIPT_PATH = "work/gate0a/g4-l3-regeneration-provenance.v1.json";
const HOST_ID = "course-g04-l03-ir-001-341242cc-loaded-swf-host";
const IR001_ID = "course-g04-l03-ir-001-341242cc";

const DEDICATED_PAGE_IDS = Object.freeze([
  "course-g04-l03-in-003",
  "course-g04-l03-in-009",
  "course-g04-l03-rw-003",
  "course-g04-l03-ts-006",
  "course-g04-l03-vb-005",
  "course-g04-l03-vb-006",
  "course-g04-l03-vb-009",
]);

const GENERATOR_PATHS = Object.freeze([
  "scripts/build-g4-l3-embedded-audio-archive.mjs",
  "scripts/build-g4-l3-gs002-source-local-game-contract.mjs",
  "scripts/build-g4-l3-gs002-source-local-game-contract.test.mjs",
  "scripts/build-g4-l3-in003-current-js-candidate.mjs",
  "scripts/build-g4-l3-in003-current-js-candidate.test.mjs",
  "scripts/build-g4-l3-machine-source-audits.mjs",
  "scripts/build-g4-l3-mc-back-text-host-composite.mjs",
  "scripts/build-g4-l3-mc-back-text-host-composite.test.mjs",
  "scripts/build-g4-l3-rw003-current-js-candidate.mjs",
  "scripts/build-g4-l3-rw003-current-js-candidate.test.mjs",
  "scripts/build-g4-l3-source-static-candidate.mjs",
  "scripts/build-g4-l3-source-static-candidate.test.mjs",
  "scripts/build-g4-l3-ts006-current-js-candidate.mjs",
  "scripts/build-g4-l3-ts006-current-js-candidate.test.mjs",
  "scripts/build-g4-l3-vb005-current-js-candidate.mjs",
  "scripts/build-g4-l3-vb005-current-js-candidate.test.mjs",
  "scripts/build-g4-l3-vb006-current-js-candidate.mjs",
  "scripts/build-g4-l3-vb006-current-js-candidate.test.mjs",
  "scripts/build-g4-l3-vb009-current-js-candidate.mjs",
  "scripts/build-g4-l3-vb009-current-js-candidate.test.mjs",
  "scripts/build-in-009-ffdec-canvas-candidate.mjs",
  "scripts/build-in-009-ffdec-canvas-candidate.test.mjs",
  "scripts/build-safe-ffdec-canvas-adapter.mjs",
  "scripts/build-safe-ffdec-canvas-adapter.test.mjs",
  "scripts/parse-swfmill-g4-l3-static-candidate.py",
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
  const info = await lstat(filePath);
  invariant(info.isFile() && !info.isSymbolicLink(), `${label}: ordinary file required`);
  const handle = await open(filePath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
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

function validateCanonicalDocument(document, label, trailingLf = false) {
  invariant(document?.schemaVersion === 1 && typeof document.payload === "object",
    `${label}: schema/payload invalid`);
  const bytes = trailingLf ? canonicalBytes(document.payload) : canonicalCompactBytes(document.payload);
  invariant(document.payloadSha256 === sha256(bytes), `${label}: payload SHA-256 mismatch`);
}

function v9Rows(plan) {
  const rows = plan.payload?.runtimes?.filter(({releaseId}) => releaseId === RELEASE_ID) ?? [];
  invariant(rows.length === 40, `v9 G4 L3 runtime denominator drifted: ${rows.length}`);
  invariant(rows.filter(({pageRenderer}) => pageRenderer).length === 39,
    "v9 G4 L3 page denominator drifted");
  invariant(rows.filter(({pageRenderer}) => !pageRenderer).length === 1 &&
    rows.find(({pageRenderer}) => !pageRenderer)?.animationId === HOST_ID,
  "v9 G4 L3 loaded-host identity drifted");
  return rows;
}

function sourceStaticRows(plan) {
  const dedicated = new Set(DEDICATED_PAGE_IDS);
  const rows = v9Rows(plan).filter(({pageRenderer, animationId}) =>
    pageRenderer && !dedicated.has(animationId));
  invariant(rows.length === 32, `G4 L3 shared source-static denominator drifted: ${rows.length}`);
  return rows;
}

function specPath(animationId) {
  return `migrations/${animationId}/audit/source-static-current-js-candidate-spec.json`;
}

async function identityRows(paths) {
  const rows = [];
  for (const relativePath of [...paths].sort()) {
    const observed = await stableRead(projectPath(relativePath, relativePath), relativePath);
    rows.push({path: relativePath, ...observed.identity});
  }
  return {count: rows.length, checksumSetSha256: sha256(canonicalCompactBytes(rows)), rows};
}

function runtimeFromResult(result, animationId) {
  const runtime = result?.runtime ?? result?.outputScript;
  invariant(runtime && Number.isSafeInteger(runtime.bytes) && typeof runtime.sha256 === "string",
    `${animationId}: regeneration runtime identity missing`);
  invariant(result.browserLaunched === false,
    `${animationId}: regeneration did not prove browserLaunched=false`);
  invariant(result.regenerationOnly === true,
    `${animationId}: regenerationOnly result missing`);
  invariant(runtime.matchesV1Materialization !== false &&
    result.runtimeMatchesV1Materialization !== false,
  `${animationId}: v1 materialization match failed`);
  return runtime;
}

function assertRuntimeMatchesV9(runtime, row) {
  invariant(runtime.bytes === row.input.bytes && runtime.sha256 === row.input.sha256,
    `${row.animationId}: regenerated runtime differs from v9 input`);
}

export function deriveFixedK1LoadedHost(baseRuntimeBytes) {
  let source = Buffer.from(baseRuntimeBytes).toString("utf8");
  const replacements = [
    [
      [
        '    ctx.fillStyle = "#b8d8f7";',
        "    ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);",
      ].join("\n"),
      "    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);",
    ],
    [
      "        ctx.transform(1, 0, 0, 1, -124.5, 98.5);",
      [
        "        ctx.transform(1, 0, 0, 1, -12.5, 33.3);",
        "        ctx.transform(1, 0, 0, 1, -124.5, 98.5);",
      ].join("\n"),
    ],
    [
      `if (Object.prototype.hasOwnProperty.call(registry, "${IR001_ID}")) {`,
      `if (Object.prototype.hasOwnProperty.call(registry, "${HOST_ID}")) {`,
    ],
    [
      `registry["${IR001_ID}"] = Object.freeze({metadata: METADATA, ready: ready, resolveFrameState: resolveFrameState, render: render});`,
      `registry["${HOST_ID}"] = Object.freeze({metadata: METADATA, ready: ready, resolveFrameState: resolveFrameState, render: render});`,
    ],
  ];
  for (const [before, after] of replacements) {
    invariant(source.split(before).length === 2,
      `IR001 fixed-k1 host transform boundary drifted: ${before.slice(0, 72)}`);
    source = source.replace(before, after);
  }
  invariant(source.includes(`canvas asset is already registered: " + "${IR001_ID}"`) &&
    !source.includes('"mode": "adaptive-integer"') &&
    source.includes(`registry["${HOST_ID}"]`),
  "IR001 fixed-k1 host transform changed historical collision/scale semantics");
  return Buffer.from(source);
}

async function runDedicatedRegenerations() {
  const options = {check: true, regenerationOnly: true, sourceRoot: SOURCE_ROOT};
  const results = [];
  results.push(await generateG4L3In003CurrentJsCandidate(options));
  results.push(await generateIn009CanvasCandidate(options));
  results.push(await generateG4L3Rw003CurrentJsCandidate(options));
  results.push(await generateG4L3Ts006CurrentJsCandidate(options));
  results.push(await generateG4L3Vb005CurrentJsCandidate(options));
  results.push(await generateG4L3Vb006CurrentJsCandidate(options));
  results.push(await generateG4L3Vb009CurrentJsCandidate(options));
  invariant(results.length === 7 && new Set(results.map(({animationId}) => animationId)).size === 7,
    "G4 L3 dedicated regeneration denominator drifted");
  return results;
}

async function runAllRegenerations(plan, navigation) {
  const rowById = new Map(v9Rows(plan).map((row) => [row.animationId, row]));
  const resultById = new Map();
  for (const row of sourceStaticRows(plan)) {
    const result = await generateG4L3SourceStaticCandidate({
      check: true,
      regenerationOnly: true,
      sourceRoot: SOURCE_ROOT,
      specPath: specPath(row.animationId),
    });
    const runtime = runtimeFromResult(result, row.animationId);
    assertRuntimeMatchesV9(runtime, row);
    resultById.set(row.animationId, {kind: "shared-source-static", result, runtime});
  }
  for (const result of await runDedicatedRegenerations()) {
    const row = rowById.get(result.animationId);
    invariant(row?.pageRenderer === true, `${result.animationId}: dedicated v9 row missing`);
    const runtime = runtimeFromResult(result, result.animationId);
    assertRuntimeMatchesV9(runtime, row);
    resultById.set(result.animationId, {kind: "dedicated-source-first", result, runtime});
  }
  invariant(resultById.size === 39, `G4 L3 regenerated page denominator drifted: ${resultById.size}`);

  const hostComposite = await buildG4L3McBackTextHostComposite({
    preservedSourceRoot: CANONICAL_PROJECT_ROOT,
  });
  invariant(hostComposite.assets?.length === 2 &&
    hostComposite.manifest?.introductionLoadedSwfHost?.animationId === IR001_ID &&
    hostComposite.manifest?.courseXml?.activeBackgroundTextAnimationIds?.length === 1 &&
    hostComposite.manifest.courseXml.activeBackgroundTextAnimationIds[0] === IR001_ID,
  "G4 L3 loaded-host static shell evidence did not close");
  const base = await stableRead(projectPath(
    `apps/web/public/flash-assets/courses/${IR001_ID}/canvas-renderer.js`, "IR001 v1 runtime"),
  "IR001 v1 runtime", rowById.get(IR001_ID).input);
  const derivedHost = deriveFixedK1LoadedHost(base.bytes);
  const hostRow = rowById.get(HOST_ID);
  invariant(derivedHost.length === hostRow.input.bytes && sha256(derivedHost) === hostRow.input.sha256,
    "IR001 loaded-host source-first derivation differs from v9 input");
  resultById.set(HOST_ID, {
    kind: "loaded-swf-host-source-first-derivation",
    runtime: {bytes: derivedHost.length, sha256: sha256(derivedHost),
      matchesV1Materialization: true},
    result: {
      animationId: HOST_ID,
      check: true,
      regenerationOnly: true,
      browserLaunched: false,
      baseRuntime: {animationId: IR001_ID, ...base.identity},
      sourceHostEvidence: {
        shellSource: hostComposite.manifest.shellSource,
        courseXml: hostComposite.manifest.courseXml,
        swfmillAudit: hostComposite.manifest.swfmillAudit,
        pagePlane: hostComposite.manifest.pagePlane,
        loadedSwfHost: hostComposite.manifest.introductionLoadedSwfHost,
      },
      inMemoryAdaptiveHostEvidenceAssets: hostComposite.assets.map(({bytesBuffer: _bytes, ...asset}) => asset),
      strictAcceptanceEffect: "none",
    },
  });
  invariant(resultById.size === 40, "G4 L3 page+host regeneration denominator drifted");

  const navigationById = new Map(navigation.pages.map((page) => [page.animationId, page]));
  invariant(navigation.pages.length === 39 && navigationById.size === 39,
    "G4 L3 source-order navigation denominator drifted");
  const records = [];
  for (const row of v9Rows(plan)) {
    const evidence = resultById.get(row.animationId);
    invariant(evidence, `${row.animationId}: regeneration evidence missing`);
    const publicPath = `public/flash-assets/${row.assetPath}`;
    const appPath = `apps/web/public/flash-assets/${row.assetPath}`;
    const [publicRuntime, appRuntime] = await Promise.all([
      stableRead(projectPath(publicPath, "public v1 runtime"), `${row.animationId} public v1`, row.input),
      stableRead(projectPath(appPath, "app v1 runtime"), `${row.animationId} app v1`, row.input),
    ]);
    const page = row.pageRenderer ? navigationById.get(row.animationId) : navigationById.get(IR001_ID);
    invariant(page, `${row.animationId}: source-order page binding missing`);
    const source = page.source?.swf;
    invariant(source?.path?.startsWith(SOURCE_PREFIX), `${row.animationId}: canonical SWF binding missing`);
    const sourceObserved = await stableRead(
      path.join(SOURCE_ROOT, source.path.slice(SOURCE_PREFIX.length)),
      `${row.animationId} canonical source SWF`, source);
    const placements = row.pageRenderer
      ? [{placementId: `g04-l03-placement-${String(page.globalPageOrdinal).padStart(3, "0")}`,
        ordinal: page.globalPageOrdinal}]
      : [];
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
      source: {path: source.path, ...sourceObserved.identity},
      placements,
      loadedHostForPlacementId: row.pageRenderer ? null : "g04-l03-placement-001",
      regenerationKind: evidence.kind,
      regenerationEvidence: evidence.result,
      regeneratedRuntime: evidence.runtime,
      observedV1Materialization: {path: appPath, ...appRuntime.identity,
        physical: appRuntime.physical},
      generatorMaterialization: {path: publicPath, ...publicRuntime.identity,
        physical: publicRuntime.physical},
      exactV9InputMatch: true,
      browserStarted: false,
    });
  }
  invariant(records.length === 40 && new Set(records.map(({animationId}) => animationId)).size === 40,
    "G4 L3 provenance record denominator drifted");
  invariant(records.filter(({pageRenderer}) => pageRenderer).length === 39 &&
    records.reduce((sum, {placements}) => sum + placements.length, 0) === 39,
  "G4 L3 page placement denominator drifted");
  return records;
}

async function loadBaseInputs() {
  const [plan, parentFreeze, navigation, authoring, in009] = await Promise.all([
    readProjectJson(V9_PLAN_PATH, "v9 plan"),
    readProjectJson(PARENT_FREEZE_PATH, "parent Gate 0A freeze"),
    readProjectJson(NAVIGATION_PATH, "G4 L3 navigation contract"),
    readProjectJson(AUTHORING_CANONICALIZATION, "G4 L3 authoring canonicalization"),
    readProjectJson(IN009_CANONICALIZATION, "IN009 evidence canonicalization"),
  ]);
  validateCanonicalDocument(plan.value, "v9 plan");
  validateCanonicalDocument(parentFreeze.value, "parent Gate 0A freeze");
  invariant(v9Rows(plan.value).length === 40, "G4 L3 v9 scope invalid");
  invariant(navigation.value?.pages?.length === 39, "G4 L3 navigation contract invalid");
  return {plan, parentFreeze, navigation, authoring, in009};
}

async function buildFreeze() {
  const base = await loadBaseInputs();
  const wrapper = await stableRead(SCRIPT_PATH, "G4 L3 wrapper");
  const wrapperTest = await stableRead(projectPath(WRAPPER_TEST, "wrapper test"),
    "G4 L3 wrapper test");
  const generatorSet = await identityRows(GENERATOR_PATHS);
  const specSet = await identityRows(sourceStaticRows(base.plan.value).map(({animationId}) =>
    specPath(animationId)));
  const payload = {
    status: "frozen-before-family-provenance-receipt",
    v9Plan: {path: base.plan.path, bytes: base.plan.bytes, sha256: base.plan.sha256,
      payloadSha256: base.plan.value.payloadSha256},
    parentGate0aFreeze: {path: base.parentFreeze.path, bytes: base.parentFreeze.bytes,
      sha256: base.parentFreeze.sha256, payloadSha256: base.parentFreeze.value.payloadSha256},
    navigationContract: {path: base.navigation.path, bytes: base.navigation.bytes,
      sha256: base.navigation.sha256},
    authoringCanonicalization: {path: base.authoring.path, bytes: base.authoring.bytes,
      sha256: base.authoring.sha256},
    in009Canonicalization: {path: base.in009.path, bytes: base.in009.bytes,
      sha256: base.in009.sha256},
    runtimeWrapper: {path: path.relative(PROJECT_ROOT, SCRIPT_PATH), ...wrapper.identity},
    runtimeWrapperTest: {path: WRAPPER_TEST, ...wrapperTest.identity},
    generatorSet,
    sourceStaticSpecSet: specSet,
    boundaries: {browserStarted: false, adaptiveBatchApplyRun: false,
      productionRendererWritten: false, v2ProfileWritten: false,
      activeBindingWritten: false, deploymentRun: false,
      applySentinelUpdated: false},
  };
  const document = {schemaVersion: 1,
    receiptType: "g4-l3-gate0a-family-receipt-freeze-v1",
    payloadSha256: sha256(canonicalCompactBytes(payload)), payload};
  const bytes = canonicalBytes(document);
  const written = await writeExclusive(FREEZE_PATH, bytes, "G4 L3 family freeze");
  return {path: FREEZE_PATH, ...written.identity, payloadSha256: document.payloadSha256};
}

async function verifyFreeze(base) {
  const freeze = await readProjectJson(FREEZE_PATH, "G4 L3 family freeze");
  validateCanonicalDocument(freeze.value, "G4 L3 family freeze");
  const [wrapper, wrapperTest, generatorSet, specSet] = await Promise.all([
    stableRead(SCRIPT_PATH, "G4 L3 wrapper"),
    stableRead(projectPath(WRAPPER_TEST, "wrapper test"), "G4 L3 wrapper test"),
    identityRows(GENERATOR_PATHS),
    identityRows(sourceStaticRows(base.plan.value).map(({animationId}) => specPath(animationId))),
  ]);
  const payload = freeze.value.payload;
  invariant(payload.runtimeWrapper?.bytes === wrapper.identity.bytes &&
    payload.runtimeWrapper.sha256 === wrapper.identity.sha256 &&
    payload.runtimeWrapperTest?.bytes === wrapperTest.identity.bytes &&
    payload.runtimeWrapperTest.sha256 === wrapperTest.identity.sha256,
  "G4 L3 wrapper/test drifted from freeze");
  invariant(payload.generatorSet?.checksumSetSha256 === generatorSet.checksumSetSha256 &&
    payload.sourceStaticSpecSet?.checksumSetSha256 === specSet.checksumSetSha256,
  "G4 L3 generator/spec set drifted from freeze");
  invariant(payload.v9Plan?.sha256 === base.plan.sha256 &&
    payload.parentGate0aFreeze?.sha256 === base.parentFreeze.sha256 &&
    payload.navigationContract?.sha256 === base.navigation.sha256 &&
    payload.authoringCanonicalization?.sha256 === base.authoring.sha256 &&
    payload.in009Canonicalization?.sha256 === base.in009.sha256,
  "G4 L3 frozen input identity drifted");
  return {freeze, wrapper, wrapperTest, generatorSet, specSet};
}

async function preflight() {
  const base = await loadBaseInputs();
  const records = await runAllRegenerations(base.plan.value, base.navigation.value);
  return {status: "pass-no-write-preflight", recordCount: records.length,
    pageRendererCount: records.filter(({pageRenderer}) => pageRenderer).length,
    loadedHostCount: records.filter(({pageRenderer}) => !pageRenderer).length,
    browserStarted: false, applyAuthorization: false};
}

async function buildReceipt() {
  const base = await loadBaseInputs();
  const frozen = await verifyFreeze(base);
  const records = await runAllRegenerations(base.plan.value, base.navigation.value);
  const payload = {
    status: "pass",
    scope: "gate0a-g4-l3-regeneration-provenance",
    provenancePolicy: "source-first-or-canonical-advanced-manual-v1",
    summary: {recordCount: 40, pageRendererCount: 39, loadedHostCount: 1,
      placementCount: 39, sourceFirstPassCount: 40,
      advancedManualPassCount: 0, noGoCount: 0},
    inputs: {
      v9Plan: {path: base.plan.path, bytes: base.plan.bytes, sha256: base.plan.sha256},
      parentGate0aFreeze: {path: base.parentFreeze.path, bytes: base.parentFreeze.bytes,
        sha256: base.parentFreeze.sha256},
      familyFreeze: {path: frozen.freeze.path, bytes: frozen.freeze.bytes,
        sha256: frozen.freeze.sha256},
      navigationContract: {path: base.navigation.path, bytes: base.navigation.bytes,
        sha256: base.navigation.sha256},
      authoringCanonicalization: {path: base.authoring.path, bytes: base.authoring.bytes,
        sha256: base.authoring.sha256},
      in009Canonicalization: {path: base.in009.path, bytes: base.in009.bytes,
        sha256: base.in009.sha256},
      generatorSet: frozen.generatorSet,
      sourceStaticSpecSet: frozen.specSet,
      wrapper: {path: path.relative(PROJECT_ROOT, SCRIPT_PATH), ...frozen.wrapper.identity},
    },
    records,
    boundaries: {browserStarted: false, adaptiveBatchApplyRun: false,
      productionRendererWritten: false, v2ProfileWritten: false,
      activeBindingWritten: false, deploymentRun: false,
      applySentinelUpdated: false, applyAuthorization: false,
      legacyCourseShellMigrationMemberAdded: false},
  };
  const document = {schemaVersion: 1,
    receiptType: "adaptive-canvas-g4-l3-regeneration-provenance-v1",
    payloadSha256: sha256(canonicalBytes(payload)), payload};
  const bytes = canonicalBytes(document);
  const written = await writeExclusive(RECEIPT_PATH, bytes, "G4 L3 provenance receipt");
  return {receipt: {path: RECEIPT_PATH, ...written.identity,
    payloadSha256: document.payloadSha256}, summary: payload.summary};
}

export function parseArguments(argv) {
  invariant(argv.length <= 1, "usage: run-g4-l3-gate0a-runtime-regeneration.mjs [--preflight|--freeze]");
  if (argv.length === 0) return {mode: "receipt"};
  if (argv[0] === "--preflight") return {mode: "preflight"};
  if (argv[0] === "--freeze") return {mode: "freeze"};
  throw new Error("usage: run-g4-l3-gate0a-runtime-regeneration.mjs [--preflight|--freeze]");
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

