#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  buildBundle as buildV1Bundle,
  validateReport as validateV1Report,
} from "./build-g4-l10-ts007-frame-domain-disposition-currentness-v1.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const REPORT_JSON =
  "reports/g4-l10-ts007-frame-domain-disposition-currentness-v2.json";
export const REPORT_MARKDOWN =
  "reports/g4-l10-ts007-frame-domain-disposition-currentness-v2.md";
export const GENERATOR_PATH =
  "scripts/build-g4-l10-ts007-frame-domain-disposition-currentness-v2.mjs";
export const TEST_PATH =
  "scripts/build-g4-l10-ts007-frame-domain-disposition-currentness-v2.test.mjs";

const V1_FINGERPRINT =
  "204a874c088e7121a8df457644b498e3b46c02cb837a3b91f19ab931c5adc5ed";
const V1_PARSED_RECOMPUTED_FINGERPRINT =
  "a6b7416d26f68e0e59080d1bb8e8f34a4c8834235df9e07918b760b8ba59dedd";
const INPUTS = Object.freeze({
  predecessorJson: Object.freeze({
    path: "reports/g4-l10-ts007-frame-domain-disposition-currentness-v1.json",
    bytes: 14821,
    sha256: "4e0d8b649828734d838b5e4073db9e671da9cdb8a458fb80017b4c5c722cfa19",
    mode: "0444",
  }),
  predecessorMarkdown: Object.freeze({
    path: "reports/g4-l10-ts007-frame-domain-disposition-currentness-v1.md",
    bytes: 1509,
    sha256: "273f950b255b3e864de44aa9ba00679f32ec3dc6e158c44f0c41bb137f8a1f2f",
    mode: "0444",
  }),
  predecessorBuilder: Object.freeze({
    path: "scripts/build-g4-l10-ts007-frame-domain-disposition-currentness-v1.mjs",
    bytes: 41651,
    sha256: "c10511b83fdd51d0b3093474e1a88946c082c974e4642a77326583c09d008742",
    mode: "0644",
  }),
  predecessorTest: Object.freeze({
    path: "scripts/build-g4-l10-ts007-frame-domain-disposition-currentness-v1.test.mjs",
    bytes: 7402,
    sha256: "3294ccfa5eaf77ae147f997153f926983c075fb5d74db7cac84c1811af672910",
    mode: "0644",
  }),
});

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function reportFingerprint(report) {
  const copy = structuredClone(report);
  delete copy.reportFingerprintSha256;
  return sha256(Buffer.from(canonicalJson(copy)));
}

function modeOf(info) {
  return Number(info.mode & 0o777n).toString(8).padStart(4, "0");
}

function statIdentity(info) {
  return [
    info.dev,
    info.ino,
    info.mode,
    info.nlink,
    info.uid,
    info.gid,
    info.size,
    info.mtimeNs,
    info.ctimeNs,
  ].map(String).join(":");
}

function contained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function canonicalRoot(projectRoot) {
  const lexical = path.resolve(projectRoot);
  const info = await lstat(lexical);
  assert.ok(info.isDirectory() && !info.isSymbolicLink(),
    `Project root must be an ordinary directory: ${lexical}`);
  assert.equal(await realpath(lexical), lexical,
    `Project root resolves through a symlink: ${lexical}`);
  return lexical;
}

function resolveInside(root, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false,
    `Absolute path is forbidden: ${relativePath}`);
  assert.equal(relativePath.includes("\\"), false,
    `Non-portable path is forbidden: ${relativePath}`);
  const absolute = path.resolve(root, relativePath);
  assert.ok(contained(root, absolute), `Path escapes root: ${relativePath}`);
  return absolute;
}

async function assertOrdinaryAncestors(root, absoluteParent) {
  assert.ok(absoluteParent === root || contained(root, absoluteParent));
  const relative = path.relative(root, absoluteParent);
  let cursor = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const info = await lstat(cursor);
    assert.ok(info.isDirectory() && !info.isSymbolicLink(),
      `Path ancestor must be an ordinary directory: ${cursor}`);
    assert.equal(await realpath(cursor), cursor,
      `Path ancestor resolves through a symlink: ${cursor}`);
  }
}

async function readStable(root, key, expected) {
  const absolute = resolveInside(root, expected.path);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `${expected.path} must be an ordinary file`);
  assert.equal(before.nlink, 1n, `${expected.path} link count changed`);
  assert.equal(await realpath(absolute), absolute,
    `${expected.path} resolves through a symlink`);
  const contents = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `${expected.path} changed while read`);
  assert.equal(contents.length, expected.bytes,
    `${expected.path} byte count changed`);
  assert.equal(sha256(contents), expected.sha256,
    `${expected.path} SHA-256 changed`);
  assert.equal(modeOf(after), expected.mode, `${expected.path} mode changed`);
  return {
    key,
    contents,
    record: {
      path: expected.path,
      bytes: contents.length,
      sha256: expected.sha256,
      mode: expected.mode,
      statIdentity: statIdentity(after),
    },
  };
}

function binding(record) {
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
    mode: record.mode,
  };
}

function parseJson(entry) {
  return JSON.parse(entry.contents.toString("utf8"));
}

async function dynamicSelfEntry(root, key, relativePath) {
  const absolute = resolveInside(root, relativePath);
  const info = await lstat(absolute, {bigint: true});
  return readStable(root, key, {
    path: relativePath,
    bytes: Number(info.size),
    sha256: sha256(await readFile(absolute)),
    mode: modeOf(info),
  });
}

function undefinedPaths(value) {
  const paths = [];
  function walk(current, prefix) {
    if (!current || typeof current !== "object") return;
    for (const key of Reflect.ownKeys(current)) {
      const next = current[key];
      const nextPath = [...prefix, String(key)];
      if (next === undefined) paths.push(nextPath.join("."));
      else walk(next, nextPath);
    }
  }
  walk(value, []);
  return paths;
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const entries = Object.fromEntries(await Promise.all(Object.entries(INPUTS)
    .map(async ([key, expected]) => [key, await readStable(root, key, expected)])));
  const predecessorBundle = await buildV1Bundle(root);
  assert.equal(entries.predecessorJson.contents.toString("utf8"),
    predecessorBundle.json,
  "Checked-in v1 JSON is not the deterministic v1 output");
  assert.equal(entries.predecessorMarkdown.contents.toString("utf8"),
    predecessorBundle.markdown,
  "Checked-in v1 Markdown is not the deterministic v1 output");
  const selfEntries = Object.fromEntries(await Promise.all([
    ["generator", GENERATOR_PATH],
    ["test", TEST_PATH],
  ].map(async ([key, relativePath]) =>
    [key, await dynamicSelfEntry(root, key, relativePath)])));
  return {
    projectRoot: root,
    entries,
    selfEntries,
    predecessorBundle,
    records: [
      ...Object.values(entries).map((entry) => entry.record),
      ...Object.values(selfEntries).map((entry) => entry.record),
      ...predecessorBundle.snapshot.records,
    ],
  };
}

export function deriveReport(snapshot) {
  const predecessor = parseJson(snapshot.entries.predecessorJson);
  validateV1Report(snapshot.predecessorBundle.report);
  assert.equal(predecessor.reportFingerprintSha256, V1_FINGERPRINT);
  assert.deepEqual(undefinedPaths(snapshot.predecessorBundle.report), [
    "independentStaticRecomputation.sprite64.directFfdecFrameScriptCount",
  ]);
  assert.equal(Object.hasOwn(predecessor.independentStaticRecomputation.sprite64,
    "directFfdecFrameScriptCount"), false);
  assert.equal(reportFingerprint(predecessor),
    V1_PARSED_RECOMPUTED_FINGERPRINT);

  const report = structuredClone(predecessor);
  report.schemaVersion = 2;
  report.artifactType =
    "g4-l10-ts007-frame-domain-disposition-currentness-v2";
  report.status =
    "SOURCE_STATIC_DISPOSITION_CURRENT_ONE_INTERACTIVE_UNRESOLVED_COVERAGE_PREDECESSOR_STALE_PARSE_STABLE_NO_RUNTIME_AUTHORITY";
  report.successorOf = binding(snapshot.entries.predecessorJson.record);
  report.predecessorSerializationDefect = {
    predecessorFingerprintSha256: V1_FINGERPRINT,
    parsedPredecessorRecomputedFingerprintSha256:
      V1_PARSED_RECOMPUTED_FINGERPRINT,
    exactInMemoryUndefinedPaths: [
      "independentStaticRecomputation.sprite64.directFfdecFrameScriptCount",
    ],
    checkedInJsonOmittedPaths: [
      "independentStaticRecomputation.sprite64.directFfdecFrameScriptCount",
    ],
    sourceOfDefect:
      "v1 projected sprite64Inspection.ffdecFrameScriptCount, a nonexistent property, instead of sprite64Inspection.ffdecFrameScripts.length",
    factualEffect:
      "none; the bound source recomputation already established one direct FFDec frame script and kept sprite-64 unresolved",
    authorityEffect: "none",
    repair:
      "v2 writes the explicit integer count 1 and requires zero undefined values plus exact JSON round-trip fingerprint equality",
  };
  report.independentStaticRecomputation.sprite64
    .directFfdecFrameScriptCount = 1;
  report.inputBindings.v2Successor = {
    predecessorJson: binding(snapshot.entries.predecessorJson.record),
    predecessorMarkdown: binding(snapshot.entries.predecessorMarkdown.record),
    predecessorBuilder: binding(snapshot.entries.predecessorBuilder.record),
    predecessorTest: binding(snapshot.entries.predecessorTest.record),
  };
  report.fingerprintSerializationContract = {
    canonicalization: "recursive-object-key-sort-json-primitives-v1",
    undefinedValueCount: 0,
    jsonRoundTripDeepEqual: true,
    jsonRoundTripFingerprintEqual: true,
    rule:
      "Every report value must survive JSON.stringify plus JSON.parse without property loss or fingerprint drift.",
  };
  report.selfIdentity = Object.fromEntries(Object.entries(snapshot.selfEntries)
    .map(([key, entry]) => [key, binding(entry.record)]));
  report.nextPermittedAction =
    "Retain v2 as the parse-stable acceptance-neutral TS007 currentness authority. It still does not authorize coverage regeneration, reviewer tasks, Phase A/B, helper work, original runtime, specification adoption, renderer work, acceptance, integration, promotion, release, or publication.";
  delete report.reportFingerprintSha256;
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateReport(report);
  return report;
}

export function validateReport(report) {
  assert.equal(report.schemaVersion, 2);
  assert.equal(report.artifactType,
    "g4-l10-ts007-frame-domain-disposition-currentness-v2");
  assert.equal(report.status,
    "SOURCE_STATIC_DISPOSITION_CURRENT_ONE_INTERACTIVE_UNRESOLVED_COVERAGE_PREDECESSOR_STALE_PARSE_STABLE_NO_RUNTIME_AUTHORITY");
  assert.equal(report.decision,
    "PRESERVE_CURRENT_DISPOSITION_KEEP_SPRITE64_UNRESOLVED_DO_NOT_REFRESH_COVERAGE_DO_NOT_RUN_DOWNSTREAM_TRANSACTION");
  assert.equal(report.successorOf.sha256, INPUTS.predecessorJson.sha256);
  assert.equal(report.predecessorSerializationDefect
    .predecessorFingerprintSha256, V1_FINGERPRINT);
  assert.equal(report.predecessorSerializationDefect
    .parsedPredecessorRecomputedFingerprintSha256,
  V1_PARSED_RECOMPUTED_FINGERPRINT);
  assert.deepEqual(report.predecessorSerializationDefect
    .exactInMemoryUndefinedPaths, [
    "independentStaticRecomputation.sprite64.directFfdecFrameScriptCount",
  ]);
  assert.equal(report.predecessorSerializationDefect.factualEffect, "none; the bound source recomputation already established one direct FFDec frame script and kept sprite-64 unresolved");
  assert.equal(report.independentStaticRecomputation.sprite64
    .directFfdecFrameScriptCount, 1);
  assert.deepEqual(undefinedPaths(report), []);
  assert.deepEqual(report.currentDisposition.dispositionCounts, {
    "declared-frame-domain": 15,
    "composite-child-with-parent": 10,
    "independent-required": 0,
    nonvisual: 0,
    unresolved: 1,
  });
  assert.deepEqual(report.currentDisposition.unresolvedTimelineIds,
    ["sprite-64"]);
  assert.deepEqual(report.currentDisposition
    .newlyCompositeRelativeToCoverageTimelineIds,
  ["sprite-355", "sprite-379"]);
  assert.equal(report.sprite64UnresolvedBoundary.currentDisposition,
    "unresolved");
  assert.equal(report.sprite64UnresolvedBoundary.dispositionChangeAuthorized,
    false);
  assert.equal(report.coverageCurrentness.currentAgainstDisposition, false);
  assert.equal(report.coverageCurrentness.boundPredecessorDisposition.sha256,
    "ebc6e4aafdf48f7beb6752f437e21a5fdd1986e4b5209362c0c94628e830b3c2");
  assert.equal(report.coverageCurrentness.currentDisposition.sha256,
    "b5495a553e3663dad5083bca04b82d06756912a8496617f8dc231014866c36da");
  assert.equal(report.coverageCurrentness.capturedFrameCount, 0);
  assert.equal(report.aggregateProjectionBoundary.rawDispositionResidualCount,
    70);
  assert.equal(report.aggregateProjectionBoundary
    .formalRequirementProjectionResidualCount, 74);
  assert.equal(report.aggregateProjectionBoundary.changeCreatedByThisReport, 0);
  assert.deepEqual(report.downstreamBoundary.prohibitedModes,
    ["--apply", "--dry-run", "--check"]);
  assert.equal(report.securityAndRuntimeBoundary.reviewSetManifestBound, false);
  assert.equal(report.securityAndRuntimeBoundary.reviewerTaskCount, 0);
  assert.equal(report.securityAndRuntimeBoundary.phaseAExecuted, false);
  assert.equal(report.securityAndRuntimeBoundary.phaseBExecuted, false);
  assert.equal(report.securityAndRuntimeBoundary
    .productionHelperImplementationEligible, false);
  assert.equal(report.securityAndRuntimeBoundary.originalRuntimeLaunchAuthorized,
    false);
  assert.ok(Object.values(report.authorityEffects).every((value) =>
    value === false));
  assert.equal(report.review.reviewTaskAuthorized, false);
  assert.equal(report.fingerprintSerializationContract.undefinedValueCount, 0);
  const roundTrip = JSON.parse(JSON.stringify(report));
  assert.deepEqual(roundTrip, report);
  assert.equal(reportFingerprint(roundTrip), reportFingerprint(report));
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
}

export function renderMarkdown(report) {
  const oldCounts = report.coverageCurrentness.boundPredecessorDisposition
    .dispositionCounts;
  const currentCounts = report.currentDisposition.dispositionCounts;
  return `# G4 L10 TS007 frame-domain disposition currentness v2\n\n` +
    `Status: **${report.status}**\n\n` +
    `Decision: **${report.decision}**\n\n` +
    `V2 is the parse-stable successor to v1. V1's in-memory report contained ` +
    `one \`undefined\` projection at ` +
    `\`independentStaticRecomputation.sprite64.directFfdecFrameScriptCount\`; ` +
    `JSON serialization omitted it, so a parsed-file fingerprint recomputation ` +
    `did not equal the in-memory fingerprint. V2 records the exact source-derived ` +
    `integer count \`1\` and requires zero undefined values plus an exact JSON ` +
    `round-trip. No underlying disposition fact changes.\n\n` +
    `The current disposition remains 15 declared, ` +
    `${currentCounts["composite-child-with-parent"]} composite, and ` +
    `${currentCounts.unresolved} unresolved. \`sprite-355\` and ` +
    `\`sprite-379\` are the two nested-parent composites added after coverage; ` +
    `interactive \`sprite-64\` remains unresolved. Coverage still binds the ` +
    `predecessor (${oldCounts["composite-child-with-parent"]} composite, ` +
    `${oldCounts.unresolved} unresolved), and all 30 EN/ES requirements remain ` +
    `blocked with zero authoritative frames. Raw/formal unresolved remain 70/74.\n\n` +
    `No reviewer task, Phase A/B, helper, original runtime, specification, ` +
    `renderer, RMSE, audio, review, acceptance, integration, promotion, ` +
    `release, or publication authority is created.\n\n` +
    `Report fingerprint: \`${report.reportFingerprintSha256}\`.\n`;
}

export async function buildBundle(projectRoot = PROJECT_ROOT) {
  const snapshot = await readSnapshot(projectRoot);
  const report = deriveReport(snapshot);
  return {
    snapshot,
    report,
    json: `${JSON.stringify(report, null, 2)}\n`,
    markdown: renderMarkdown(report),
  };
}

async function assertSnapshotUnchanged(snapshot) {
  for (const record of snapshot.records) {
    const absolute = resolveInside(snapshot.projectRoot, record.path);
    const current = await lstat(absolute, {bigint: true});
    assert.equal(statIdentity(current), record.statIdentity,
      `${record.path} changed after snapshot`);
  }
}

async function outputState(root, relativePath) {
  const absolute = resolveInside(root, relativePath);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  try {
    return {absolute, info: await lstat(absolute)};
  } catch (error) {
    if (error?.code === "ENOENT") return {absolute, info: null};
    throw error;
  }
}

export async function checkReport(bundle,
  outputRoot = bundle.snapshot.projectRoot, options = {}) {
  const root = await canonicalRoot(outputRoot);
  for (const [relativePath, expected] of [
    [REPORT_JSON, bundle.json],
    [REPORT_MARKDOWN, bundle.markdown],
  ]) {
    await readStable(root, "generated-output", {
      path: relativePath,
      bytes: Buffer.byteLength(expected),
      sha256: sha256(Buffer.from(expected)),
      mode: "0444",
    });
  }
  if (options.skipInputCheck !== true) {
    await assertSnapshotUnchanged(bundle.snapshot);
  }
  return {
    disposition: "checked",
    schemaVersion: 2,
    status: bundle.report.status,
    reportFingerprintSha256: bundle.report.reportFingerprintSha256,
    parseStable: true,
    undefinedValueCount: 0,
    directFfdecFrameScriptCount: 1,
    currentDispositionUnresolvedTimelineIds: ["sprite-64"],
    rawDispositionResidualCount: 70,
    formalRequirementProjectionResidualCount: 74,
    originalRuntimeAuthorized: false,
    productionHelperImplementationEligible: false,
    acceptanceEffect: false,
  };
}

export async function publishNoClobber(bundle, options = {}) {
  const root = await canonicalRoot(options.outputRoot ??
    bundle.snapshot.projectRoot);
  const jsonState = await outputState(root, REPORT_JSON);
  const markdownState = await outputState(root, REPORT_MARKDOWN);
  assert.equal(jsonState.info, null,
    `Output already exists; refusing overwrite: ${REPORT_JSON}`);
  assert.equal(markdownState.info, null,
    `Output already exists; refusing overwrite: ${REPORT_MARKDOWN}`);
  await assertSnapshotUnchanged(bundle.snapshot);
  await writeFile(jsonState.absolute, bundle.json, {flag: "wx", mode: 0o600});
  await chmod(jsonState.absolute, 0o444);
  await (options.beforeMarkdown ?? (async () => {}))();
  await assertSnapshotUnchanged(bundle.snapshot);
  await writeFile(markdownState.absolute, bundle.markdown,
    {flag: "wx", mode: 0o600});
  await chmod(markdownState.absolute, 0o444);
  await assertSnapshotUnchanged(bundle.snapshot);
  return checkReport(bundle, root, {skipInputCheck: true});
}

export function parseCliArgs(args) {
  assert.equal(args.length, 1,
    "Choose exactly one of --dry-run, --write-no-clobber, or --check");
  assert.ok(["--dry-run", "--write-no-clobber", "--check"].includes(args[0]),
    "Expected --dry-run, --write-no-clobber, or --check");
  return args[0];
}

export async function runCli(args = process.argv.slice(2),
  projectRoot = PROJECT_ROOT) {
  const mode = parseCliArgs(args);
  const bundle = await buildBundle(projectRoot);
  if (mode === "--write-no-clobber") return publishNoClobber(bundle);
  if (mode === "--check") return checkReport(bundle);
  return {
    disposition: "dry-run",
    schemaVersion: 2,
    status: bundle.report.status,
    reportFingerprintSha256: bundle.report.reportFingerprintSha256,
    parseStable: true,
    undefinedValueCount: 0,
    directFfdecFrameScriptCount: 1,
    currentDispositionUnresolvedTimelineIds: ["sprite-64"],
    rawDispositionResidualCount: 70,
    formalRequirementProjectionResidualCount: 74,
    originalRuntimeAuthorized: false,
    productionHelperImplementationEligible: false,
    acceptanceEffect: false,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runCli().then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
