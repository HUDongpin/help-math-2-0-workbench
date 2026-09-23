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
  assertSnapshotUnchanged as assertV7SnapshotUnchanged,
  deriveContract as deriveV7Contract,
  readSnapshot as readV7Snapshot,
  validateContract as validateV7Contract,
} from "./build-g4-l10-complete-migration-template-contract-v7.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const REPORT_JSON =
  "reports/g4-l10-complete-migration-template-contract-v8-2026-08-07.json";
export const REPORT_MARKDOWN =
  "reports/g4-l10-complete-migration-template-contract-v8-2026-08-07.md";
export const TEST_RELATIVE =
  "scripts/build-g4-l10-complete-migration-template-contract-v8.test.mjs";

const EXACT_INPUTS = Object.freeze({
  predecessorV7Json: Object.freeze({
    path: "reports/g4-l10-complete-migration-template-contract-v7-2026-08-07.json",
    bytes: 245414,
    sha256: "78cd44a2524d50b3db6e1860200cd748ff518741bc64193b68c5740bc7368a53",
    mode: "0444",
  }),
  predecessorV7Markdown: Object.freeze({
    path: "reports/g4-l10-complete-migration-template-contract-v7-2026-08-07.md",
    bytes: 1892,
    sha256: "8f34f9673bb2a96d1ff382845a43ac10587a4fc4b776d8402a254b59521b740f",
    mode: "0444",
  }),
  vb003CurrentnessJson: Object.freeze({
    path: "reports/g4-l10-vb003-current-js-engineering-diagnostic-v1-currentness-successor.json",
    bytes: 71333,
    sha256: "3a77a67fd1acff1f673352da59bd5bb8187bdc3a33c416836c2c1d6e5a1a77cd",
    mode: "0444",
  }),
  vb003CurrentnessMarkdown: Object.freeze({
    path: "reports/g4-l10-vb003-current-js-engineering-diagnostic-v1-currentness-successor.md",
    bytes: 1449,
    sha256: "a4010f5bee509bfed42252ed10f65f3cff095bf18cc453069d334c215f246a5c",
    mode: "0444",
  }),
  ts008CurrentnessJson: Object.freeze({
    path: "reports/g4-l10-ts008-frame-domain-disposition-currentness-v1.json",
    bytes: 11511,
    sha256: "d87308dec07f4a9d1a1200765c8b02e506a7b17eeaf7e711619a65fece5f7fa8",
    mode: "0444",
  }),
  ts008CurrentnessMarkdown: Object.freeze({
    path: "reports/g4-l10-ts008-frame-domain-disposition-currentness-v1.md",
    bytes: 1330,
    sha256: "39f7e1fffdd23bc8866adc6c0ce9f264ad464bc2eabe45cbb4df8ae2f65f65d6",
    mode: "0444",
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

function modeOf(info) {
  return Number(info.mode & 0o777n).toString(8).padStart(4, "0");
}

function contained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function portable(value) {
  return value.split(path.sep).join("/");
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

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const v7Snapshot = await readV7Snapshot(root);
  const v7Report = deriveV7Contract(v7Snapshot);
  validateV7Contract(v7Report);
  const entries = Object.fromEntries(await Promise.all(Object.entries(EXACT_INPUTS)
    .map(async ([key, expected]) => [key, await readStable(root, key, expected)])));
  const expectedV7Json = `${JSON.stringify(v7Report, null, 2)}\n`;
  assert.equal(entries.predecessorV7Json.contents.toString("utf8"),
    expectedV7Json, "Stored v7 JSON differs from authoritative recomputation");
  const selfEntries = Object.fromEntries(await Promise.all([
    ["builder", portable(path.relative(root, SCRIPT_PATH))],
    ["test", TEST_RELATIVE],
  ].map(async ([key, relativePath]) => {
    const absolute = resolveInside(root, relativePath);
    const info = await lstat(absolute, {bigint: true});
    const expected = {
      path: relativePath,
      bytes: Number(info.size),
      sha256: sha256(await readFile(absolute)),
      mode: modeOf(info),
    };
    return [key, await readStable(root, key, expected)];
  })));
  return {
    projectRoot: root,
    v7Snapshot,
    v7Report,
    entries,
    selfEntries,
    records: [
      ...Object.values(entries).map((entry) => entry.record),
      ...Object.values(selfEntries).map((entry) => entry.record),
    ],
  };
}

export function deriveContract(snapshot) {
  const v7 = structuredClone(snapshot.v7Report);
  const vb003 = parseJson(snapshot.entries.vb003CurrentnessJson);
  const ts008 = parseJson(snapshot.entries.ts008CurrentnessJson);
  assert.equal(vb003.status,
    "CURRENTNESS_SUCCESSOR_PASS_CAPTURE_BYTES_UNCHANGED_LEDGER_EPOCH_REBOUND_NO_AUTHORITY");
  assert.equal(vb003.reportFingerprintSha256,
    "daabc42631eebcdcec369d75bc469ddb6d2d09b937b2b4f4cc03890389f7ab22");
  assert.deepEqual(vb003.currentness.exactChangedBindingKeys,
    ["completionLedger", "lessonReleaseLedger"]);
  assert.equal(vb003.predecessor.captureClosure.decodedAndRehashedPngCount,
    203);
  assert.equal(vb003.formalState.releaseStrictCompleteCount, 0);
  assert.equal(vb003.formalState.releaseMissingCount, 47);
  assert.ok(Object.values(vb003.authority).every((value) => value === false));

  assert.equal(ts008.status,
    "SOURCE_STATIC_DISPOSITION_CURRENT_COVERAGE_PREDECESSOR_STALE_NO_RUNTIME_AUTHORITY");
  assert.equal(ts008.reportFingerprintSha256,
    "f8ca55c8ed741d33c649b9bc85730fa60a4b087a85371157859c28523333271d");
  assert.equal(ts008.currentDisposition.dispositionCounts.unresolved, 0);
  assert.equal(ts008.coverageCurrentness.currentAgainstDisposition, false);
  assert.deepEqual(ts008.coverageCurrentness.exactChangedDispositionTimelineIds,
    ["sprite-354", "sprite-378"]);
  assert.equal(ts008.securityAndRuntimeBoundary
    .originalRuntimeLaunchAuthorized, false);
  assert.ok(Object.values(ts008.authorityEffects).every((value) =>
    value === false));

  const inputBindings = Object.fromEntries(Object.entries(snapshot.entries)
    .map(([key, entry]) => [key, binding(entry.record)]));
  const selfIdentity = Object.fromEntries(Object.entries(snapshot.selfEntries)
    .map(([key, entry]) => [key, binding(entry.record)]));
  const report = {
    ...v7,
    schemaVersion: 8,
    successorOf: inputBindings.predecessorV7Json,
    predecessorDisposition: {
      v7: {
        status: "preserved-authoritatively-recomputed",
        preserved: true,
        authoritativeRecomputationMatched: true,
        json: inputBindings.predecessorV7Json,
        markdown: inputBindings.predecessorV7Markdown,
        reportFingerprintSha256: v7.reportFingerprintSha256,
        acceptanceEffect: "none",
      },
      ...v7.predecessorDisposition,
    },
    latestAuditCurrentness: {
      vb003CurrentJavascriptDiagnostic: {
        json: inputBindings.vb003CurrentnessJson,
        markdown: inputBindings.vb003CurrentnessMarkdown,
        status: vb003.status,
        decision: vb003.decision,
        reportFingerprintSha256: vb003.reportFingerprintSha256,
        frozenCaptureCount: vb003.predecessor.captureClosure.captureCount,
        decodedAndRehashedPngCount:
          vb003.predecessor.captureClosure.decodedAndRehashedPngCount,
        captureSetSha256:
          vb003.predecessor.captureClosure.captureSetSha256,
        exactChangedBindingKeys:
          vb003.currentness.exactChangedBindingKeys,
        allNonLedgerBindingsByteIdenticalToPredecessor:
          vb003.currentness.allNonLedgerBindingsByteIdenticalToPredecessor,
        browserRecapturePerformed: vb003.scope.browserRecapturePerformed,
        formalCompletionEntryPresent:
          vb003.formalState.completionLedgerEntryPresent,
        releaseStrictCompleteCount:
          vb003.formalState.releaseStrictCompleteCount,
        releaseMissingCount: vb003.formalState.releaseMissingCount,
        authorityAllFalse: Object.values(vb003.authority)
          .every((value) => value === false),
        meaning:
          "Stored current-JavaScript candidate bytes are current through a read-only two-ledger epoch rebind; no browser recapture, original-runtime evidence, comparison, or acceptance is created.",
      },
      ts008FrameDomainDisposition: {
        json: inputBindings.ts008CurrentnessJson,
        markdown: inputBindings.ts008CurrentnessMarkdown,
        status: ts008.status,
        decision: ts008.decision,
        reportFingerprintSha256: ts008.reportFingerprintSha256,
        currentDispositionSha256:
          ts008.coverageCurrentness.currentDisposition.sha256,
        currentDispositionCounts:
          ts008.currentDisposition.dispositionCounts,
        coverageCurrentAgainstDisposition:
          ts008.coverageCurrentness.currentAgainstDisposition,
        coverageBoundPredecessorDispositionSha256:
          ts008.coverageCurrentness.boundPredecessorDisposition.sha256,
        exactChangedDispositionTimelineIds:
          ts008.coverageCurrentness.exactChangedDispositionTimelineIds,
        parentEntryStateEstablished:
          ts008.currentDisposition.parentEntryStateEstablished,
        authoritativeOriginalRuntimeFrameCount:
          ts008.securityAndRuntimeBoundary.authoritativeOriginalRuntimeFrameCount,
        authorityAllFalse: Object.values(ts008.authorityEffects)
          .every((value) => value === false),
        meaning:
          "TS008 source-static disposition has zero enumerated unresolved timelines, but coverage remains predecessor-bound and runtime parent entry remains unresolved; no downstream regeneration is authorized.",
      },
      formalStateChangeFromV7: false,
      templateStableEffect: false,
      acceptanceEffect: "none",
    },
    inputBindings: {
      ...v7.inputBindings,
      v8SuccessorInputs: inputBindings,
    },
    builder: {
      generator: selfIdentity.builder,
      test: selfIdentity.test,
    },
  };
  delete report.reportFingerprintSha256;
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateContract(report);
  return report;
}

export function validateContract(report) {
  assert.equal(report.schemaVersion, 8);
  assert.equal(report.status, "fail-closed-template-not-stable");
  assert.equal(report.templateStable, false);
  assert.equal(report.scope.memberCount, 47);
  assert.equal(report.scope.activePageCount, 46);
  assert.equal(report.scope.shellCount, 1);
  assert.equal(report.currentFormalState.requirements.total, 520);
  assert.equal(report.currentFormalState.requirements.rootReady, 94);
  assert.equal(report.currentFormalState.requirements.unresolvedNested, 426);
  assert.equal(report.currentFormalState.requirements
    .unresolvedFrameDomainDispositions, 74);
  assert.equal(report.currentFormalState.frameObligations.total, 44488);
  assert.equal(report.currentFormalState.frameObligations.authoritativeCaptured,
    0);
  assert.equal(report.latestAuditCurrentness
    .vb003CurrentJavascriptDiagnostic.decodedAndRehashedPngCount, 203);
  assert.deepEqual(report.latestAuditCurrentness
    .vb003CurrentJavascriptDiagnostic.exactChangedBindingKeys,
  ["completionLedger", "lessonReleaseLedger"]);
  assert.equal(report.latestAuditCurrentness
    .vb003CurrentJavascriptDiagnostic.browserRecapturePerformed, false);
  assert.equal(report.latestAuditCurrentness
    .ts008FrameDomainDisposition.currentDispositionCounts.unresolved, 0);
  assert.equal(report.latestAuditCurrentness
    .ts008FrameDomainDisposition.coverageCurrentAgainstDisposition, false);
  assert.deepEqual(report.latestAuditCurrentness
    .ts008FrameDomainDisposition.exactChangedDispositionTimelineIds,
  ["sprite-354", "sprite-378"]);
  assert.equal(report.latestAuditCurrentness
    .ts008FrameDomainDisposition.parentEntryStateEstablished, false);
  assert.equal(report.latestAuditCurrentness.formalStateChangeFromV7, false);
  assert.equal(report.latestAuditCurrentness.templateStableEffect, false);
  assert.equal(report.latestAuditCurrentness.acceptanceEffect, "none");
  assert.equal(report.latestSecurityReviewBoundary
    .productionHelperImplementationEligible, false);
  assert.equal(report.authorityBoundary.mayLaunchOriginalRuntime, false);
  assert.equal(report.downstreamTransactionBoundary.applyAuthorized, false);
  assert.deepEqual(report.downstreamTransactionBoundary.prohibitedModes,
    ["--apply", "--dry-run", "--check"]);
  assert.ok(Object.values(report.acceptanceEffects).every((value) =>
    value === false));
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
}

export function renderMarkdown(report) {
  const vb003 = report.latestAuditCurrentness
    .vb003CurrentJavascriptDiagnostic;
  const ts008 = report.latestAuditCurrentness.ts008FrameDomainDisposition;
  return `# Grade 4 Lesson 10 complete migration template contract v8\n\n` +
    `Status: **${report.status}**. Template stable: **${report.templateStable}**.\n\n` +
    `V8 authoritatively recomputes and preserves v7, then binds two new ` +
    `acceptance-neutral audit-currentness reports.\n\n` +
    `## VB003 current-JavaScript diagnostic currentness\n\n` +
    `- Frozen PNGs decoded and rehashed: **${vb003.decodedAndRehashedPngCount}**.\n` +
    `- Exact changed bindings: \`${vb003.exactChangedBindingKeys.join("\`, \`")}\`.\n` +
    `- Browser recapture performed: **${vb003.browserRecapturePerformed}**.\n` +
    `- Lesson strict-complete: **${vb003.releaseStrictCompleteCount}/47**; missing **${vb003.releaseMissingCount}/47**.\n\n` +
    `## TS008 disposition currentness\n\n` +
    `- Current source-static unresolved count: **${ts008.currentDispositionCounts.unresolved}**.\n` +
    `- Coverage current against disposition: **${ts008.coverageCurrentAgainstDisposition}**.\n` +
    `- Changed timelines: \`${ts008.exactChangedDispositionTimelineIds.join("\`, \`")}\`.\n` +
    `- Parent natural entry established: **${ts008.parentEntryStateEstablished}**.\n\n` +
    `## Retained whole-lesson gate\n\n` +
    `The denominator remains 46 active pages plus one shell. Authoritative ` +
    `runtime frames remain 0/${report.currentFormalState.frameObligations.total}; ` +
    `the latest security batch failed; coverage regeneration, helper work, ` +
    `runtime launch, specification/renderer adoption, behavior, RMSE, audio, ` +
    `human/owner review, strict completion, integration, release, promotion, ` +
    `and publication remain unauthorized or incomplete.\n\n` +
    `Report fingerprint: \`${report.reportFingerprintSha256}\`.\n`;
}

export async function buildBundle(projectRoot = PROJECT_ROOT) {
  const snapshot = await readSnapshot(projectRoot);
  const report = deriveContract(snapshot);
  return {
    snapshot,
    report,
    json: `${JSON.stringify(report, null, 2)}\n`,
    markdown: renderMarkdown(report),
  };
}

async function assertSnapshotUnchanged(snapshot) {
  await assertV7SnapshotUnchanged(snapshot.v7Snapshot);
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

export async function checkContract(bundle,
  outputRoot = bundle.snapshot.projectRoot, options = {}) {
  const root = await canonicalRoot(outputRoot);
  for (const [relativePath, expected] of [
    [REPORT_JSON, bundle.json],
    [REPORT_MARKDOWN, bundle.markdown],
  ]) {
    await readStable(root, "generated-v8-contract", {
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
    status: bundle.report.status,
    templateStable: false,
    reportFingerprintSha256: bundle.report.reportFingerprintSha256,
    vb003CurrentnessBound: true,
    ts008CurrentnessBound: true,
    coverageRegenerationAuthorized: false,
    productionHelperImplementationEligible: false,
    originalRuntimeAuthorized: false,
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
  return checkContract(bundle, root, {skipInputCheck: true});
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
  if (mode === "--check") return checkContract(bundle);
  return {
    disposition: "dry-run",
    status: bundle.report.status,
    templateStable: false,
    reportFingerprintSha256: bundle.report.reportFingerprintSha256,
    vb003CurrentnessBound: true,
    ts008CurrentnessBound: true,
    coverageRegenerationAuthorized: false,
    productionHelperImplementationEligible: false,
    originalRuntimeAuthorized: false,
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
