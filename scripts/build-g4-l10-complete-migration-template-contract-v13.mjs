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
  buildBundle as buildV12Bundle,
  validateContract as validateV12Contract,
} from "./build-g4-l10-complete-migration-template-contract-v12.mjs";
import {
  buildBundle as buildTs007CurrentnessBundle,
  validateReport as validateTs007CurrentnessReport,
} from "./build-g4-l10-ts007-frame-domain-disposition-currentness-v2.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const REPORT_JSON =
  "reports/g4-l10-complete-migration-template-contract-v13-2026-08-07.json";
export const REPORT_MARKDOWN =
  "reports/g4-l10-complete-migration-template-contract-v13-2026-08-07.md";
export const GENERATOR_PATH =
  "scripts/build-g4-l10-complete-migration-template-contract-v13.mjs";
export const TEST_PATH =
  "scripts/build-g4-l10-complete-migration-template-contract-v13.test.mjs";

const INPUTS = Object.freeze({
  predecessorJson: Object.freeze({
    path: "reports/g4-l10-complete-migration-template-contract-v12-2026-08-07.json",
    bytes: 272341,
    sha256: "7611ea345ba34354e762eaa9fcf9ebacc20c93495b750c8de4adef9bf2ac08bc",
    mode: "0444",
  }),
  predecessorMarkdown: Object.freeze({
    path: "reports/g4-l10-complete-migration-template-contract-v12-2026-08-07.md",
    bytes: 1477,
    sha256: "e32def05628ae5d85c79e232c7f0d83f61c5908c4e816505fca42a63cce60f5a",
    mode: "0444",
  }),
  predecessorBuilder: Object.freeze({
    path: "scripts/build-g4-l10-complete-migration-template-contract-v12.mjs",
    bytes: 31435,
    sha256: "03381cbfe08cf0898de783d2083838999091c70f1dacb8beb86feb1a543755b2",
    mode: "0644",
  }),
  predecessorTest: Object.freeze({
    path: "scripts/build-g4-l10-complete-migration-template-contract-v12.test.mjs",
    bytes: 4958,
    sha256: "c9d7dbd31bfc870467371dff1dda406e29f39218d6c507692ee044691b536064",
    mode: "0644",
  }),
  ts007CurrentnessJson: Object.freeze({
    path: "reports/g4-l10-ts007-frame-domain-disposition-currentness-v2.json",
    bytes: 17528,
    sha256: "b5027565781e14f7dca4c419695bfc2899f985fc6ad19017b750dad77073e0bc",
    mode: "0444",
  }),
  ts007CurrentnessMarkdown: Object.freeze({
    path: "reports/g4-l10-ts007-frame-domain-disposition-currentness-v2.md",
    bytes: 1429,
    sha256: "ff9d59f730edd3314e4f973fac564bc6b27bfcc8b6a6400c046132ef36022566",
    mode: "0444",
  }),
  ts007CurrentnessBuilder: Object.freeze({
    path: "scripts/build-g4-l10-ts007-frame-domain-disposition-currentness-v2.mjs",
    bytes: 21219,
    sha256: "45737a305dea574f6d6a0ad9bf21bd3c8bfab6e3f7987d330cc7878c0eac8a30",
    mode: "0644",
  }),
  ts007CurrentnessTest: Object.freeze({
    path: "scripts/build-g4-l10-ts007-frame-domain-disposition-currentness-v2.test.mjs",
    bytes: 7161,
    sha256: "6738bd7203ff95067a91371260e832c032c4e3bd24a19a8c07d1d0926c0b0bbc",
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
  const expected = {
    path: relativePath,
    bytes: Number(info.size),
    sha256: sha256(await readFile(absolute)),
    mode: modeOf(info),
  };
  return readStable(root, key, expected);
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const entries = Object.fromEntries(await Promise.all(Object.entries(INPUTS)
    .map(async ([key, expected]) => [key, await readStable(root, key, expected)])));
  const [predecessorBundle, ts007Bundle] = await Promise.all([
    buildV12Bundle(root),
    buildTs007CurrentnessBundle(root),
  ]);
  assert.equal(entries.predecessorJson.contents.toString("utf8"),
    predecessorBundle.json,
  "Checked-in v12 JSON is not the deterministic v12 output");
  assert.equal(entries.predecessorMarkdown.contents.toString("utf8"),
    predecessorBundle.markdown,
  "Checked-in v12 Markdown is not the deterministic v12 output");
  assert.equal(entries.ts007CurrentnessJson.contents.toString("utf8"),
    ts007Bundle.json,
  "Checked-in TS007 currentness JSON is not the deterministic output");
  assert.equal(entries.ts007CurrentnessMarkdown.contents.toString("utf8"),
    ts007Bundle.markdown,
  "Checked-in TS007 currentness Markdown is not the deterministic output");
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
    ts007Bundle,
    records: [
      ...Object.values(entries).map((entry) => entry.record),
      ...Object.values(selfEntries).map((entry) => entry.record),
    ],
  };
}

function ts007Projection(currentness, entries) {
  return {
    json: binding(entries.ts007CurrentnessJson.record),
    markdown: binding(entries.ts007CurrentnessMarkdown.record),
    generator: binding(entries.ts007CurrentnessBuilder.record),
    test: binding(entries.ts007CurrentnessTest.record),
    status: currentness.status,
    decision: currentness.decision,
    reportFingerprintSha256: currentness.reportFingerprintSha256,
    parseStable:
      currentness.fingerprintSerializationContract.jsonRoundTripFingerprintEqual,
    undefinedValueCount:
      currentness.fingerprintSerializationContract.undefinedValueCount,
    directFfdecFrameScriptCount:
      currentness.independentStaticRecomputation.sprite64
        .directFfdecFrameScriptCount,
    currentDispositionSha256: currentness.currentDisposition.sha256,
    currentDispositionCounts:
      currentness.currentDisposition.dispositionCounts,
    unresolvedTimelineIds:
      currentness.currentDisposition.unresolvedTimelineIds,
    coverageCurrentAgainstDisposition:
      currentness.coverageCurrentness.currentAgainstDisposition,
    coverageBoundPredecessorDispositionSha256:
      currentness.coverageCurrentness.boundPredecessorDisposition.sha256,
    exactChangedDispositionTimelineIds:
      currentness.coverageCurrentness.exactChangedDispositionTimelineIds,
    sprite64Disposition:
      currentness.sprite64UnresolvedBoundary.currentDisposition,
    sprite64DispositionChangeAuthorized:
      currentness.sprite64UnresolvedBoundary.dispositionChangeAuthorized,
    parentEntryStateEstablished:
      currentness.currentDisposition.parentEntryStateEstablished,
    rawDispositionResidualCount:
      currentness.aggregateProjectionBoundary.rawDispositionResidualCount,
    formalRequirementProjectionResidualCount:
      currentness.aggregateProjectionBoundary
        .formalRequirementProjectionResidualCount,
    formalStateChangeFromV12: false,
    templateStableEffect: false,
    acceptanceEffect: "none",
    authorityAllFalse: Object.values(currentness.authorityEffects)
      .every((value) => value === false),
    meaning:
      "TS007 source-static disposition is current at one unresolved interactive timeline, sprite-64. Coverage remains predecessor-bound; raw/formal unresolved remain 70/74 and no downstream regeneration or runtime authority is created.",
  };
}

export function deriveContract(snapshot) {
  const predecessor = parseJson(snapshot.entries.predecessorJson);
  const currentness = parseJson(snapshot.entries.ts007CurrentnessJson);
  validateV12Contract(predecessor);
  validateTs007CurrentnessReport(snapshot.ts007Bundle.report);
  assert.equal(predecessor.reportFingerprintSha256,
    "f03bc678e129145054fdb02671ea1585b39178034fc80cd1a2d7f31d84280b33");
  assert.equal(currentness.reportFingerprintSha256,
    "095c1f6d16c215ebf0b9f16150a448baaf4cc674ab530b22a8200d09f968f180");

  const report = structuredClone(predecessor);
  report.schemaVersion = 13;
  report.successorOf = binding(snapshot.entries.predecessorJson.record);
  report.evidenceEpochClosure.rule =
    "V13 deterministically reproduces and byte-matches v12, then binds the exact parse-stable TS007 source-static frame-domain currentness v2 successor. It records TS007 at one unresolved interactive timeline and preserves the 70 raw / 74 formal stale-projection boundary. It creates no reviewer task, Phase A/B evidence, helper qualification, runtime, specification adoption, renderer, acceptance, integration, promotion, release, or publication evidence.";
  report.inputBindings.v13Successor = {
    predecessorJson: binding(snapshot.entries.predecessorJson.record),
    predecessorMarkdown: binding(snapshot.entries.predecessorMarkdown.record),
    predecessorBuilder: binding(snapshot.entries.predecessorBuilder.record),
    predecessorTest: binding(snapshot.entries.predecessorTest.record),
    ts007CurrentnessJson:
      binding(snapshot.entries.ts007CurrentnessJson.record),
    ts007CurrentnessMarkdown:
      binding(snapshot.entries.ts007CurrentnessMarkdown.record),
    ts007CurrentnessBuilder:
      binding(snapshot.entries.ts007CurrentnessBuilder.record),
    ts007CurrentnessTest:
      binding(snapshot.entries.ts007CurrentnessTest.record),
  };
  report.latestAuditCurrentness.ts007FrameDomainDisposition =
    ts007Projection(currentness, snapshot.entries);
  report.latestAuditCurrentness.formalStateChangeFromV12 = false;
  report.templateCurrentnessReconciliation = {
    ts007: {
      currentDispositionUnresolvedCount: 1,
      unresolvedTimelineIds: ["sprite-64"],
      coverageCurrentAgainstDisposition: false,
      changedRelativeToCoverageTimelineIds: ["sprite-355", "sprite-379"],
    },
    ts008: {
      currentDispositionUnresolvedCount: 0,
      unresolvedTimelineIds: [],
      coverageCurrentAgainstDisposition: false,
      changedRelativeToCoverageTimelineIds: ["sprite-354", "sprite-378"],
    },
    rawDispositionResidualCount: 70,
    formalRequirementProjectionResidualCount: 74,
    exactStaleProjectionDifference: 4,
    naturalScheduleReadyRequirementCount: 0,
    changeCreatedByV13: 0,
    downstreamRegenerationPerformed: false,
    rule:
      "The four exact TS007/TS008 nested-parent transitions are current in raw disposition evidence and deliberately stale in coverage, trace, keyframe, and runtime-plan projections. V13 reports the difference and writes no migration artifact.",
  };
  report.nextNamedHumanAction.reason =
    "V2.16 authoring and focused tests are not independent review. P0/P1/P2 remain UNEVALUATED, review-set-manifest-bound is false, and production helper/original runtime remain closed. TS007 still has interactive sprite-64 unresolved; TS007 and TS008 coverage remain stale; Grade 4 still has sixteen unresolved MP3 obligations.";
  report.builder = {
    generator: binding(snapshot.selfEntries.generator.record),
    test: binding(snapshot.selfEntries.test.record),
  };
  delete report.reportFingerprintSha256;
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateContract(report);
  return report;
}

export function validateContract(report) {
  assert.equal(report.schemaVersion, 13);
  assert.equal(report.status, "fail-closed-template-not-stable");
  assert.equal(report.templateStable, false);
  assert.equal(report.successorOf.sha256, INPUTS.predecessorJson.sha256);
  assert.equal(report.currentFormalState.sourceCustody.present, 47);
  assert.equal(report.currentFormalState.sourceCustody.required, 47);
  assert.equal(report.currentFormalState.requirements.total, 520);
  assert.equal(report.currentFormalState.requirements.rootReady, 94);
  assert.equal(report.currentFormalState.requirements.unresolvedNested, 426);
  assert.equal(report.currentFormalState.requirements.naturalScheduleReady, 0);
  assert.equal(report.currentFormalState.requirements
    .unresolvedFrameDomainDispositions, 74);
  assert.equal(report.currentFormalState.frameObligations.total, 44488);
  assert.equal(report.currentFormalState.frameObligations
    .authoritativeCaptured, 0);
  assert.equal(report.currentFormalState.originalRuntime.runtimeSessions, 0);
  assert.equal(report.currentFormalState.originalRuntime.operatorActivated,
    false);
  assert.equal(report.currentFormalState.javascript.engineeringCandidateCount,
    24);
  assert.equal(report.currentFormalState.javascript.registeredFormalRendererCount,
    0);
  assert.equal(report.downstreamTransactionBoundary.decision, "DO_NOT_APPLY");
  assert.equal(report.downstreamTransactionBoundary.applyAuthorized, false);
  assert.deepEqual(report.downstreamTransactionBoundary.prohibitedModes,
    ["--apply", "--dry-run", "--check"]);
  const security = report.downstreamTransactionBoundary
    .nativeHelperV2SecurityDesign;
  assert.equal(security.status,
    "v2.16-review-infrastructure-authored-unreviewed-no-implementation-or-runtime-authority");
  assert.equal(security.reviewSetManifestBound, false);
  assert.equal(security.freshUserOwnedReviewBatchAuthorized, false);
  assert.equal(security.productionHelperImplementationEligible, false);
  assert.equal(security.originalRuntimeAuthority, false);

  const ts007 = report.latestAuditCurrentness.ts007FrameDomainDisposition;
  assert.equal(ts007.json.sha256, INPUTS.ts007CurrentnessJson.sha256);
  assert.equal(ts007.markdown.sha256,
    INPUTS.ts007CurrentnessMarkdown.sha256);
  assert.equal(ts007.generator.sha256,
    INPUTS.ts007CurrentnessBuilder.sha256);
  assert.equal(ts007.test.sha256, INPUTS.ts007CurrentnessTest.sha256);
  assert.equal(ts007.status,
    "SOURCE_STATIC_DISPOSITION_CURRENT_ONE_INTERACTIVE_UNRESOLVED_COVERAGE_PREDECESSOR_STALE_PARSE_STABLE_NO_RUNTIME_AUTHORITY");
  assert.equal(ts007.parseStable, true);
  assert.equal(ts007.undefinedValueCount, 0);
  assert.equal(ts007.directFfdecFrameScriptCount, 1);
  assert.deepEqual(ts007.currentDispositionCounts, {
    "declared-frame-domain": 15,
    "composite-child-with-parent": 10,
    "independent-required": 0,
    nonvisual: 0,
    unresolved: 1,
  });
  assert.deepEqual(ts007.unresolvedTimelineIds, ["sprite-64"]);
  assert.equal(ts007.coverageCurrentAgainstDisposition, false);
  assert.deepEqual(ts007.exactChangedDispositionTimelineIds,
    ["sprite-355", "sprite-379"]);
  assert.equal(ts007.sprite64Disposition, "unresolved");
  assert.equal(ts007.sprite64DispositionChangeAuthorized, false);
  assert.equal(ts007.parentEntryStateEstablished, false);
  assert.equal(ts007.rawDispositionResidualCount, 70);
  assert.equal(ts007.formalRequirementProjectionResidualCount, 74);
  assert.equal(ts007.authorityAllFalse, true);

  const ts008 = report.latestAuditCurrentness.ts008FrameDomainDisposition;
  assert.equal(ts008.currentDispositionCounts.unresolved, 0);
  assert.equal(ts008.coverageCurrentAgainstDisposition, false);
  assert.deepEqual(ts008.exactChangedDispositionTimelineIds,
    ["sprite-354", "sprite-378"]);
  assert.equal(ts008.authorityAllFalse, true);

  const reconciliation = report.templateCurrentnessReconciliation;
  assert.equal(reconciliation.ts007.currentDispositionUnresolvedCount, 1);
  assert.deepEqual(reconciliation.ts007.unresolvedTimelineIds, ["sprite-64"]);
  assert.equal(reconciliation.ts008.currentDispositionUnresolvedCount, 0);
  assert.deepEqual(reconciliation.ts008.unresolvedTimelineIds, []);
  assert.equal(reconciliation.rawDispositionResidualCount, 70);
  assert.equal(reconciliation.formalRequirementProjectionResidualCount, 74);
  assert.equal(reconciliation.exactStaleProjectionDifference, 4);
  assert.equal(reconciliation.naturalScheduleReadyRequirementCount, 0);
  assert.equal(reconciliation.changeCreatedByV13, 0);
  assert.equal(reconciliation.downstreamRegenerationPerformed, false);

  assert.equal(report.latestAuditCurrentness.formalStateChangeFromV12, false);
  assert.equal(report.nextNamedHumanAction.currentlyAuthorized, false);
  assert.equal(report.nextNamedHumanAction.operatorActivated, false);
  assert.equal(report.nextNamedHumanAction
    .reviewTaskCreationAuthorizedByThisArtifact, false);
  assert.equal(report.nextNamedHumanAction.reviewSetManifestBound, false);
  assert.equal(report.nextNamedHumanAction
    .phaseAOrPhaseBAuthorizedByThisArtifact, false);
  assert.equal(report.authorityBoundary.mayCreateUserOwnedTask, false);
  assert.equal(report.authorityBoundary.mayRunPhaseAOrPhaseB, false);
  assert.equal(report.authorityBoundary.mayLaunchOriginalRuntime, false);
  assert.equal(report.authorityBoundary.mayApplyDownstreamTransaction, false);
  assert.equal(report.authorityBoundary.mayRegisterRenderer, false);
  assert.ok(Object.values(report.acceptanceEffects).every((value) =>
    value === false));
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
}

export function renderMarkdown(report) {
  const requirements = report.currentFormalState.requirements;
  const frames = report.currentFormalState.frameObligations;
  const currentness = report.templateCurrentnessReconciliation;
  return `# Grade 4 Lesson 10 complete migration template contract v13\n\n` +
    `Status: **${report.status}**. Template stable: ` +
    `**${report.templateStable}**.\n\n` +
    `V13 deterministically reproduces the exact v12 contract and adds the ` +
    `exact TS007 frame-domain currentness successor. Source custody remains ` +
    `47/47, but the formal migration remains open: ${requirements.total} ` +
    `requirements, ${requirements.rootReady} root-ready, ` +
    `${requirements.unresolvedNested} unresolved nested, ` +
    `${requirements.naturalScheduleReady} natural-schedule-ready, and ` +
    `${frames.authoritativeCaptured}/${frames.total} authoritative frames.\n\n` +
    `## TS007 and TS008 currentness\n\n` +
    `TS007 has exactly one unresolved enumerated timeline, \`sprite-64\`; ` +
    `TS008 has zero. Both coverage files remain predecessor-bound. The four ` +
    `raw disposition transitions are \`sprite-355\`, \`sprite-379\`, ` +
    `\`sprite-354\`, and \`sprite-378\`. Raw unresolved remains ` +
    `${currentness.rawDispositionResidualCount}; the deliberately stale formal ` +
    `projection remains ${currentness.formalRequirementProjectionResidualCount}. ` +
    `V13 changes neither count and performs no downstream regeneration.\n\n` +
    `## Boundary\n\n` +
    `The v2.16 review infrastructure remains unreviewed. No reviewer task, ` +
    `review-set manifest, Phase A/B execution, helper implementation, protected ` +
    `installation, helper execution, original-runtime launch, specification ` +
    `adoption, renderer registration, comparison, acceptance, integration, ` +
    `promotion, release, or publication is authorized.\n\n` +
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
  for (const record of snapshot.records) {
    const absolute = resolveInside(snapshot.projectRoot, record.path);
    const current = await lstat(absolute, {bigint: true});
    assert.equal(statIdentity(current), record.statIdentity,
      `${record.path} changed after snapshot`);
  }
  const [predecessorCurrent, ts007Current] = await Promise.all([
    buildV12Bundle(snapshot.projectRoot),
    buildTs007CurrentnessBundle(snapshot.projectRoot),
  ]);
  assert.equal(predecessorCurrent.json, snapshot.predecessorBundle.json,
    "v12 deterministic recomputation changed after snapshot");
  assert.equal(predecessorCurrent.markdown, snapshot.predecessorBundle.markdown,
    "v12 Markdown recomputation changed after snapshot");
  assert.equal(ts007Current.json, snapshot.ts007Bundle.json,
    "TS007 currentness deterministic recomputation changed after snapshot");
  assert.equal(ts007Current.markdown, snapshot.ts007Bundle.markdown,
    "TS007 currentness Markdown recomputation changed after snapshot");
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
    schemaVersion: bundle.report.schemaVersion,
    status: bundle.report.status,
    templateStable: bundle.report.templateStable,
    reportFingerprintSha256: bundle.report.reportFingerprintSha256,
    ts007UnresolvedTimelineIds: ["sprite-64"],
    ts008UnresolvedTimelineIds: [],
    rawDispositionResidualCount: 70,
    formalRequirementProjectionResidualCount: 74,
    naturalScheduleReadyRequirementCount: 0,
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
    schemaVersion: bundle.report.schemaVersion,
    status: bundle.report.status,
    templateStable: bundle.report.templateStable,
    reportFingerprintSha256: bundle.report.reportFingerprintSha256,
    ts007UnresolvedTimelineIds: ["sprite-64"],
    ts008UnresolvedTimelineIds: [],
    rawDispositionResidualCount: 70,
    formalRequirementProjectionResidualCount: 74,
    naturalScheduleReadyRequirementCount: 0,
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
