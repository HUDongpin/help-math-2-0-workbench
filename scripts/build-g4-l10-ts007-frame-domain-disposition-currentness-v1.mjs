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
import {gunzipSync} from "node:zlib";

import {
  deriveMultiFrameScriptlessCandidateAudit,
  deriveNestedDeclaredParentScriptlessCandidateSpecs,
  deriveSingleFrameScriptlessEligibility,
  parseFfdecDispositionScripts,
  parseSwfmillDispositionStructure,
} from "./build-static-frame-domain-disposition-evidence.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const ANIMATION_ID = "course-g04-l10-ts-007";
export const REPORT_JSON =
  "reports/g4-l10-ts007-frame-domain-disposition-currentness-v1.json";
export const REPORT_MARKDOWN =
  "reports/g4-l10-ts007-frame-domain-disposition-currentness-v1.md";
export const TEST_RELATIVE =
  "scripts/build-g4-l10-ts007-frame-domain-disposition-currentness-v1.test.mjs";

const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const BASE = `migrations/${ANIMATION_ID}`;
const SOURCE_SHA256 =
  "64070bdec0badb3cb009a741fe1b5e9c96bd98e68b92c4dfe125db3b43617eff";
const CURRENT_DISPOSITION_SHA256 =
  "b5495a553e3663dad5083bca04b82d06756912a8496617f8dc231014866c36da";
const PREDECESSOR_DISPOSITION_SHA256 =
  "ebc6e4aafdf48f7beb6752f437e21a5fdd1986e4b5209362c0c94628e830b3c2";
const NEW_COMPOSITE_TIMELINES = Object.freeze(["sprite-355", "sprite-379"]);
const SINGLE_FRAME_COMPOSITES = Object.freeze([
  "sprite-60",
  "sprite-62",
  "sprite-63",
  "sprite-77",
  "sprite-79",
  "sprite-203",
  "sprite-226",
  "sprite-419",
]);
const ALL_COMPOSITES = Object.freeze([
  ...SINGLE_FRAME_COMPOSITES.slice(0, 7),
  ...NEW_COMPOSITE_TIMELINES,
  SINGLE_FRAME_COMPOSITES[7],
]);
const DECLARED_NESTED_DOMAINS = Object.freeze([
  "sprite-121",
  "sprite-159",
  "sprite-171",
  "sprite-221",
  "sprite-235",
  "sprite-246",
  "sprite-258",
  "sprite-292",
  "sprite-304",
  "sprite-317",
  "sprite-349",
  "sprite-388",
  "sprite-412",
  "sprite-415",
]);

const INPUTS = Object.freeze({
  manifest: Object.freeze({
    path: `${BASE}/migration.json`,
    bytes: 28936,
    sha256: "62a981ef41d274f5ec9b3ad69852d3e7b860db4270cb895085387ca395cc8337",
    mode: "0644",
  }),
  coverage: Object.freeze({
    path: `${BASE}/evidence/full-frame-coverage.json`,
    bytes: 97875,
    sha256: "7a0b368f1d1f222a40a6a3185cfc0842036f7967063940e0511758aac100d789",
    mode: "0644",
  }),
  disposition: Object.freeze({
    path: `${BASE}/audit/frame-domain-disposition.json`,
    bytes: 100597,
    sha256: CURRENT_DISPOSITION_SHA256,
    mode: "0644",
  }),
  staticEvidence: Object.freeze({
    path: `${BASE}/audit/static-frame-domain-disposition-evidence.json`,
    bytes: 165860,
    sha256: "3e965e69081ce4affedfcfa86ff02b14559d5fbee73039539b8e475a57a2aaea",
    mode: "0644",
  }),
  independentEvidence: Object.freeze({
    path: `${BASE}/audit/source-proven-independent-frame-domain-evidence.json`,
    bytes: 54647,
    sha256: "110ad73562c8e01b205c4449504612dcf6cb0d86b6cea051d1da81bb25f60f02",
    mode: "0644",
  }),
  inventory: Object.freeze({
    path: `${BASE}/audit/scenario-inventory.json`,
    bytes: 1030575,
    sha256: "a7601f0e9a1508f446ccb630d182d3004316b52ef3cd38dc2734115c292430f6",
    mode: "0644",
  }),
  swfmill: Object.freeze({
    path: `${BASE}/audit/machine/swfmill.xml.gz`,
    bytes: 987643,
    sha256: "a2cdc609431c5a6571383828e2a180b9034137ebe9275f19e9da107330873183",
    mode: "0644",
  }),
  ffdecScripts: Object.freeze({
    path: `${BASE}/audit/machine/ffdec-scripts.txt.gz`,
    bytes: 1475,
    sha256: "37ae1f45789624e1bbc68937074eaf7c59818877692701a71ab4f82b6bafc447",
    mode: "0644",
  }),
  sourceSwf: Object.freeze({
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS07.swf",
    bytes: 585839,
    sha256: SOURCE_SHA256,
    mode: "0500",
  }),
  sprite64Readiness: Object.freeze({
    path: "reports/g4-l10-ts007-sprite64-interactive-disposition-readiness-v1.json",
    bytes: 29331,
    sha256: "4ea042c833cb50061a9dc9067938dc49b751e3103917fdf9cb1a878de4cb4207",
    mode: "0444",
  }),
  sprite64Geometry: Object.freeze({
    path: "reports/g4-l10-ts007-sprite64-interaction-geometry-v1.json",
    bytes: 20945,
    sha256: "3c89c03b0805052260830491c465b6e0c18fa3300d9444636cf59ba7a8fc4637",
    mode: "0444",
  }),
  residualTriage: Object.freeze({
    path: "reports/g4-l10-residual-frame-domain-audit-triage-v1.json",
    bytes: 124726,
    sha256: "ba515be75fbf9f8fd25ddbd9114a3e00996cdfb535f567c4518116118bb1a7f2",
    mode: "0444",
  }),
  templateContractV12: Object.freeze({
    path: "reports/g4-l10-complete-migration-template-contract-v12-2026-08-07.json",
    bytes: 272341,
    sha256: "7611ea345ba34354e762eaa9fcf9ebacc20c93495b750c8de4adef9bf2ac08bc",
    mode: "0444",
  }),
  reviewProtocolV216: Object.freeze({
    path: "docs/G4_L10_NATIVE_HELPER_V2_16_REVIEW_PROTOCOL_SUCCESSOR.md",
    bytes: 18042,
    sha256: "64077e18264236f10c77414f049c00b585a3d7258a9a3c324ec616c399695736",
    mode: "0644",
  }),
});

const AUTHORITY_EFFECT_KEYS = Object.freeze([
  "canonicalWorkspaceMutation",
  "frameDomainDispositionChange",
  "coverageRegeneration",
  "traceRegeneration",
  "keyframeRegeneration",
  "runtimePlanRegeneration",
  "reviewerTaskCreation",
  "phaseAExecution",
  "phaseBExecution",
  "productionHelperImplementation",
  "productionHelperTest",
  "protectedInstallation",
  "helperExecution",
  "originalRuntimeLaunch",
  "authoritativeOriginalRuntimeEvidence",
  "specificationAcceptance",
  "baselineAdoption",
  "rendererAdoption",
  "behaviorAcceptance",
  "visualRmseAcceptance",
  "audioAcceptance",
  "humanVisualAcceptance",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictCompletion",
  "lessonBatchAdmission",
  "wholeLessonIntegration",
  "remainingGrade4BatchStart",
  "wholeCourseIntegration",
  "sourcePromotion",
  "release",
  "publication",
]);

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

function exactTimelineIds(rows) {
  return rows.map((row) => row.timelineId);
}

function projectRootPath(pathRows) {
  return pathRows.map((row) => ({
    parentTimelineId: row.parentTimelineId,
    childTimelineId: row.childTimelineId,
    sourceObjectId: row.sourceObjectId,
    frame: row.frame,
    depth: row.depth,
    instanceName: row.instanceName,
    tag: row.tag,
    replace: row.replace,
    hasClipActions: row.hasClipActions,
  }));
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const entries = Object.fromEntries(await Promise.all(Object.entries(INPUTS)
    .map(async ([key, expected]) => [key, await readStable(root, key, expected)])));
  const scriptRelative = portable(path.relative(root, SCRIPT_PATH));
  const selfEntries = Object.fromEntries(await Promise.all([
    ["builder", {path: scriptRelative}],
    ["test", {path: TEST_RELATIVE}],
  ].map(async ([key, item]) => {
    const absolute = resolveInside(root, item.path);
    const info = await lstat(absolute, {bigint: true});
    const expected = {
      path: item.path,
      bytes: Number(info.size),
      sha256: sha256(await readFile(absolute)),
      mode: modeOf(info),
    };
    return [key, await readStable(root, key, expected)];
  })));
  return {
    projectRoot: root,
    entries,
    selfEntries,
    records: [
      ...Object.values(entries).map((entry) => entry.record),
      ...Object.values(selfEntries).map((entry) => entry.record),
    ],
  };
}

export function deriveReport(snapshot) {
  const {entries} = snapshot;
  const manifest = parseJson(entries.manifest);
  const coverage = parseJson(entries.coverage);
  const disposition = parseJson(entries.disposition);
  const staticEvidence = parseJson(entries.staticEvidence);
  const independentEvidence = parseJson(entries.independentEvidence);
  const inventory = parseJson(entries.inventory);
  const readiness = parseJson(entries.sprite64Readiness);
  const geometry = parseJson(entries.sprite64Geometry);
  const residual = parseJson(entries.residualTriage);
  const template = parseJson(entries.templateContractV12);
  const protocolText = entries.reviewProtocolV216.contents.toString("utf8");
  const structure = parseSwfmillDispositionStructure(
    gunzipSync(entries.swfmill.contents).toString("utf8"));
  const scripts = parseFfdecDispositionScripts(
    gunzipSync(entries.ffdecScripts.contents).toString("utf8"));

  assert.equal(manifest.id, ANIMATION_ID);
  assert.equal(manifest.assetId, `swf-${SOURCE_SHA256}`);
  assert.equal(manifest.source.swfSha256, SOURCE_SHA256);
  assert.equal(manifest.source.pairedFlaStatus, "missing");
  assert.equal(manifest.status, "preserved");
  assert.equal(inventory.animationId, ANIMATION_ID);
  assert.equal(inventory.inventoryStatus,
    "static-exhaustive-runtime-unverified");

  const single = deriveSingleFrameScriptlessEligibility({
    animationId: ANIMATION_ID,
    structure,
    scripts,
    inventory,
    manifest,
  });
  assert.deepEqual(single.eligibleTimelineIds, SINGLE_FRAME_COMPOSITES,
    "Single-frame composite recomputation changed");
  const sprite64Inspection = single.inspections.get("sprite-64");
  assert.ok(sprite64Inspection, "sprite-64 inspection is missing");
  assert.equal(sprite64Inspection.eligible, false);
  assert.deepEqual(sprite64Inspection.disqualifiers, [
    "swfmill-do-action-present",
    "ffdec-frame-script-present",
  ]);

  const multi = deriveMultiFrameScriptlessCandidateAudit({
    animationId: ANIMATION_ID,
    structure,
    scripts,
    inventory,
    manifest,
  });
  assert.deepEqual(multi.undeclaredTimelineIds, NEW_COMPOSITE_TIMELINES);
  assert.deepEqual(multi.excludedTimelineIds, NEW_COMPOSITE_TIMELINES);
  assert.deepEqual(multi.inspections.map((row) => ({
    timelineId: row.timelineId,
    frameCount: row.frameCount,
    parentTimelineId: row.parentTimelineId,
    parentFrameDomainId: row.parentFrameDomainId,
    parentFrameCount: row.parentFrameCount,
    eligible: row.eligible,
    disqualifiers: row.disqualifiers,
    ffdecFrameScriptCount: row.ffdecFrameScriptCount,
    attributedDoInitActionCount: row.attributedDoInitActionCount,
  })), [
    {
      timelineId: "sprite-355",
      frameCount: 22,
      parentTimelineId: "sprite-388",
      parentFrameDomainId: "sprite-388",
      parentFrameCount: 27,
      eligible: false,
      disqualifiers: ["declared-parent-does-not-have-one-direct-root-placement"],
      ffdecFrameScriptCount: 0,
      attributedDoInitActionCount: 0,
    },
    {
      timelineId: "sprite-379",
      frameCount: 19,
      parentTimelineId: "sprite-388",
      parentFrameDomainId: "sprite-388",
      parentFrameCount: 27,
      eligible: false,
      disqualifiers: ["declared-parent-does-not-have-one-direct-root-placement"],
      ffdecFrameScriptCount: 0,
      attributedDoInitActionCount: 0,
    },
  ]);
  const nestedSpecs = deriveNestedDeclaredParentScriptlessCandidateSpecs({
    animationId: ANIMATION_ID,
    candidateAudit: multi,
    manifest,
    structure,
    selectedTimelineIds: NEW_COMPOSITE_TIMELINES,
  });
  assert.equal(nestedSpecs.length, 1);
  const [nested] = nestedSpecs;
  assert.equal(nested.parentTimelineId, "sprite-388");
  assert.equal(nested.parentFrameDomainId, "sprite-388");
  assert.equal(nested.parentEntryStateEstablished, false);
  assert.equal(nested.parentBindingMode,
    "nested-declared-parent-local-clock-only");
  assert.deepEqual(nested.timelines.map((row) => [row.timelineId,
    row.frameCount]), [["sprite-355", 22], ["sprite-379", 19]]);
  assert.deepEqual(projectRootPath(nested.parentRootPath), [
    {
      parentTimelineId: "root",
      childTimelineId: "sprite-415",
      sourceObjectId: "415",
      frame: 6,
      depth: "1",
      instanceName: "animation",
      tag: "PlaceObject2",
      replace: "0",
      hasClipActions: false,
    },
    {
      parentTimelineId: "sprite-415",
      childTimelineId: "sprite-388",
      sourceObjectId: "388",
      frame: 832,
      depth: "441",
      instanceName: "Mc_Right_Feed5",
      tag: "PlaceObject2",
      replace: "0",
      hasClipActions: false,
    },
  ]);

  assert.equal(staticEvidence.status, "verified-static-composite-claims");
  assert.equal(staticEvidence.animationId, ANIMATION_ID);
  assert.deepEqual(exactTimelineIds(staticEvidence.claims), ALL_COMPOSITES);
  const nestedClaims = staticEvidence.claims.filter((claim) =>
    NEW_COMPOSITE_TIMELINES.includes(claim.timelineId));
  assert.ok(nestedClaims.every((claim) =>
    claim.role === "multi-frame-scriptless-parent-clock-composite-child" &&
    claim.claimScope === "local-playhead-fully-derived-from-declared-parent-clock" &&
    claim.parentBinding.parentTimelineId === "sprite-388" &&
    claim.parentBinding.parentFrameDomainId === "sprite-388" &&
    claim.parentBinding.parentEntryStateEstablished === false &&
    JSON.stringify(projectRootPath(claim.parentBinding.parentRootPath)) ===
      JSON.stringify(projectRootPath(nested.parentRootPath)) &&
    claim.scriptAudit.ffdecFrameScriptCount === 0 &&
    claim.scriptAudit.attributedDoInitActionCount === 0),
  "Nested static composite claim boundary changed");

  assert.equal(independentEvidence.status, "verified-source-obligation");
  assert.equal(independentEvidence.animationId, ANIMATION_ID);
  assert.deepEqual(exactTimelineIds(independentEvidence.claims),
    DECLARED_NESTED_DOMAINS);
  assert.equal(independentEvidence.summary.independentRequired, 14);
  assert.equal(independentEvidence.summary.unresolvedAfter, 3);

  assert.equal(disposition.status,
    "structurally-enumerated-dispositions-unresolved");
  assert.equal(disposition.migrationStatusChanged, false);
  assert.deepEqual(disposition.summary, {
    inventoryTimelineCount: 27,
    enumeratedTimelineCount: 26,
    reachableChildTimelineCount: 25,
    excludedNotProvenTimelineCount: 1,
    dispositionCounts: {
      "declared-frame-domain": 15,
      "composite-child-with-parent": 10,
      "independent-required": 0,
      nonvisual: 0,
      unresolved: 1,
    },
    highRiskIndependentCandidateCount: 0,
    highRiskIndependentCandidates: [],
  });
  assert.deepEqual(exactTimelineIds(disposition.timelines.filter((row) =>
    row.disposition === "declared-frame-domain")).slice(1),
  DECLARED_NESTED_DOMAINS);
  assert.deepEqual(exactTimelineIds(disposition.timelines.filter((row) =>
    row.disposition === "composite-child-with-parent")), ALL_COMPOSITES);
  assert.deepEqual(exactTimelineIds(disposition.timelines.filter((row) =>
    row.disposition === "unresolved")), ["sprite-64"]);
  assert.equal(disposition.generatedFrom.staticDispositionEvidence.sha256,
    INPUTS.staticEvidence.sha256);
  assert.equal(disposition.generatedFrom
    .sourceProvenIndependentDeclarationBasis.memberEvidence.sha256,
  INPUTS.independentEvidence.sha256);
  assert.equal(disposition.generatedFrom.nestedDeclaredParentSuccessorBasis
    .memberPairSet.count, 2);
  assert.equal(disposition.generatedFrom.nestedDeclaredParentSuccessorBasis
    .parentEntryStateEstablished, false);
  assert.equal(disposition.generatedFrom.lessonReleaseCatalog.member.ordinal, 42);

  const coverageBinding = coverage.materialization.frameDomainDisposition;
  assert.equal(coverageBinding.bytes, 91900);
  assert.equal(coverageBinding.sha256, PREDECESSOR_DISPOSITION_SHA256);
  assert.equal(coverageBinding.status,
    "structurally-enumerated-dispositions-unresolved");
  assert.deepEqual(coverageBinding.dispositionCounts, {
    "declared-frame-domain": 15,
    "composite-child-with-parent": 8,
    "independent-required": 0,
    nonvisual: 0,
    unresolved: 3,
  });
  assert.deepEqual(coverage.materialization.excludedUnresolvedTimelines.timelines
    .map((row) => row.sourceTimelineId),
  ["sprite-64", ...NEW_COMPOSITE_TIMELINES]);
  assert.equal(coverage.requirements.length, 30);
  assert.ok(coverage.requirements.every((requirement) =>
    requirement.status === "blocked" &&
    requirement.capturedFrameCount === 0 &&
    requirement.baselineAuthority === "unresolved"));
  assert.notEqual(coverageBinding.sha256, INPUTS.disposition.sha256);

  assert.equal(readiness.status,
    "source-static-interactive-gap-frozen-disposition-unresolved");
  assert.equal(readiness.decision,
    "KEEP_UNRESOLVED_DO_NOT_CLASSIFY_DO_NOT_APPLY");
  assert.equal(readiness.currentDisposition.sprite64.disposition, "unresolved");
  assert.equal(readiness.currentDisposition
    .sprite64ClaimedByStaticCompositeEvidence, false);
  assert.equal(readiness.currentDisposition
    .sprite64ClaimedBySourceProvenIndependentEvidence, false);
  assert.equal(readiness.dispositionConclusion.compositeChildWithParentSupported,
    false);
  assert.equal(readiness.dispositionConclusion.independentRequiredSupported,
    false);
  assert.equal(readiness.dispositionConclusion.nonvisualSupported, false);

  assert.equal(geometry.status,
    "SOURCE_STATIC_HIT_GEOMETRY_AND_COORDINATE_CANDIDATES_FROZEN_RUNTIME_TRACE_UNRESOLVED");
  assert.equal(geometry.decision,
    "PRESERVE_GEOMETRY_PREDECLARE_CANDIDATES_DO_NOT_EXECUTE_DO_NOT_CLASSIFY");
  assert.equal(geometry.naturalEntryBinding.authoritativeRuntimeEntryObserved,
    false);
  assert.equal(geometry.naturalEntryBinding.entryStateSha256Established, false);
  assert.equal(geometry.predecessorGapEffect.formalNaturalScheduleReadyCountChange,
    0);
  assert.equal(geometry.dispositionBoundary.currentDisposition, "unresolved");

  assert.equal(residual.status,
    "residual-unresolved-exactly-enumerated-routed-no-disposition-change");
  assert.equal(residual.decision,
    "KEEP_70_UNRESOLVED_ADVANCE_ONLY_BY_BOUND_SUCCESSORS");
  assert.equal(residual.reconciliation.currentResidual.count, 70);
  assert.equal(residual.reconciliation.currentResidual.sha256,
    "13df4a13d684c1900c138ba08cd8b7e5c61c4c4f8be050558d71fc2c8a219852");
  assert.equal(residual.formalProjectionBoundary
    .currentFormalRequirementProjectionResidualCount, 74);
  assert.equal(residual.formalProjectionBoundary.difference, 4);
  assert.deepEqual(residual.formalProjectionBoundary.prohibitedTransactionModes,
    ["--apply", "--dry-run", "--check"]);

  assert.equal(template.status, "fail-closed-template-not-stable");
  assert.equal(template.templateStable, false);
  assert.equal(template.currentFormalState.requirements
    .unresolvedFrameDomainDispositions, 74);
  assert.equal(template.currentFormalState.requirements.naturalScheduleReady, 0);
  assert.equal(template.downstreamTransactionBoundary.decision, "DO_NOT_APPLY");
  assert.deepEqual(template.downstreamTransactionBoundary.prohibitedModes,
    ["--apply", "--dry-run", "--check"]);
  const security = template.downstreamTransactionBoundary
    .nativeHelperV2SecurityDesign;
  assert.equal(security.status,
    "v2.16-review-infrastructure-authored-unreviewed-no-implementation-or-runtime-authority");
  assert.equal(security.reviewProtocolV216.sha256,
    INPUTS.reviewProtocolV216.sha256);
  assert.equal(security.freshUserOwnedReviewBatchAuthorized, false);
  assert.equal(security.specReviewQualified, false);
  assert.equal(security.productionHelperImplementationEligible, false);
  assert.equal(security.originalRuntimeAuthority, false);
  assert.equal(security.reviewSetManifestBound, false);
  assert.ok(protocolText.includes("v2.16"));
  assert.ok(protocolText.includes("No reviewer task is created by authoring this successor"));

  const inputBindings = Object.fromEntries(Object.entries(entries)
    .map(([key, entry]) => [key, binding(entry.record)]));
  const selfIdentity = Object.fromEntries(Object.entries(snapshot.selfEntries)
    .map(([key, entry]) => [key, binding(entry.record)]));
  const report = {
    schemaVersion: 1,
    artifactType:
      "g4-l10-ts007-frame-domain-disposition-currentness-v1",
    generatedForDate: "2026-08-07",
    status:
      "SOURCE_STATIC_DISPOSITION_CURRENT_ONE_INTERACTIVE_UNRESOLVED_COVERAGE_PREDECESSOR_STALE_NO_RUNTIME_AUTHORITY",
    decision:
      "PRESERVE_CURRENT_DISPOSITION_KEEP_SPRITE64_UNRESOLVED_DO_NOT_REFRESH_COVERAGE_DO_NOT_RUN_DOWNSTREAM_TRANSACTION",
    releaseId: RELEASE_ID,
    animationId: ANIMATION_ID,
    sourceIdentity: {
      assetId: `swf-${SOURCE_SHA256}`,
      sourceSwfPath: INPUTS.sourceSwf.path,
      sourceSwfSha256: SOURCE_SHA256,
      pairedFlaStatus: "missing",
    },
    evidenceClass:
      "read-only-source-static-currentness-stale-downstream-binding-and-unresolved-interaction-report",
    purpose: [
      "Prove the current TS007 frame-domain disposition state from exact source-static inputs without mutating the workspace.",
      "Separate the two established nested-parent composites from sprite-64, whose source-static interaction evidence does not authorize a disposition change.",
      "Separate current raw disposition state from the stale predecessor disposition still bound by full-frame coverage and formal requirement projections.",
      "Preserve every reviewer-task, helper, original-runtime, specification, renderer, visual/RMSE, audio, human, owner, integration, promotion, release, and publication gate.",
    ],
    inputBindings,
    independentStaticRecomputation: {
      singleFrameCompositeTimelineIds: single.eligibleTimelineIds,
      directRootMultiFrameAuditExcludedTimelineIds: multi.excludedTimelineIds,
      directRootExclusionReason:
        "declared-parent-does-not-have-one-direct-root-placement",
      nestedDeclaredParentSuccessor: {
        timelineIds: nested.timelines.map((row) => row.timelineId),
        parentTimelineId: nested.parentTimelineId,
        parentFrameDomainId: nested.parentFrameDomainId,
        parentFrameCount: nested.parentFrameCount,
        parentBindingMode: nested.parentBindingMode,
        parentEntryStateEstablished: nested.parentEntryStateEstablished,
        parentRootPath: projectRootPath(nested.parentRootPath),
        childFrameCounts: Object.fromEntries(nested.timelines.map((row) =>
          [row.timelineId, row.frameCount])),
        childFrameScriptCounts: Object.fromEntries(multi.inspections.map((row) =>
          [row.timelineId, row.ffdecFrameScriptCount])),
        childAttributedDoInitActionCounts: Object.fromEntries(
          multi.inspections.map((row) =>
            [row.timelineId, row.attributedDoInitActionCount])),
      },
      sprite64: {
        eligibleAsSingleFrameScriptlessComposite: sprite64Inspection.eligible,
        disqualifiers: sprite64Inspection.disqualifiers,
        directDoActionCount: sprite64Inspection.timeline.tagCounts.DoAction,
        directFfdecFrameScriptCount: sprite64Inspection.ffdecFrameScriptCount,
      },
      staticEvidenceClaimTimelineIds: exactTimelineIds(staticEvidence.claims),
      sourceProvenIndependentTimelineIds:
        exactTimelineIds(independentEvidence.claims),
      recomputationMatchedCurrentEvidence: true,
    },
    currentDisposition: {
      path: INPUTS.disposition.path,
      bytes: INPUTS.disposition.bytes,
      sha256: CURRENT_DISPOSITION_SHA256,
      status: disposition.status,
      inventoryTimelineCount: 27,
      enumeratedTimelineCount: 26,
      excludedNotProvenTimelineCount: 1,
      dispositionCounts: disposition.summary.dispositionCounts,
      unresolvedTimelineIds: ["sprite-64"],
      newlyCompositeRelativeToCoverageTimelineIds: NEW_COMPOSITE_TIMELINES,
      parentEntryStateEstablished: false,
      meaning:
        "Source-static evidence removes separate child frame-domain requirements for sprite-355 and sprite-379 by deriving their local clocks from declared parent sprite-388. It does not establish sprite-388 natural runtime entry and does not classify interactive sprite-64.",
    },
    sprite64UnresolvedBoundary: {
      timelineId: "sprite-64",
      sourceStaticInteractive: true,
      currentDisposition: readiness.dispositionConclusion.currentDisposition,
      compositeChildWithParentSupported:
        readiness.dispositionConclusion.compositeChildWithParentSupported,
      independentRequiredSupported:
        readiness.dispositionConclusion.independentRequiredSupported,
      nonvisualSupported: readiness.dispositionConclusion.nonvisualSupported,
      authoritativeRuntimeEntryObserved:
        geometry.naturalEntryBinding.authoritativeRuntimeEntryObserved,
      entryStateSha256Established:
        geometry.naturalEntryBinding.entryStateSha256Established,
      formalNaturalScheduleReadyCountChange:
        geometry.predecessorGapEffect.formalNaturalScheduleReadyCountChange,
      dispositionChangeAuthorized: false,
      rule:
        "Source-static scripting and geometry preserve test candidates only. They do not prove runtime entry, callback ordering, state persistence, interaction causality, or frame-domain exhaustiveness.",
    },
    coverageCurrentness: {
      path: INPUTS.coverage.path,
      bytes: INPUTS.coverage.bytes,
      sha256: INPUTS.coverage.sha256,
      currentAgainstDisposition: false,
      boundPredecessorDisposition: {
        bytes: coverageBinding.bytes,
        sha256: coverageBinding.sha256,
        status: coverageBinding.status,
        dispositionCounts: coverageBinding.dispositionCounts,
      },
      currentDisposition: {
        bytes: INPUTS.disposition.bytes,
        sha256: CURRENT_DISPOSITION_SHA256,
        status: disposition.status,
        dispositionCounts: disposition.summary.dispositionCounts,
      },
      exactChangedDispositionTimelineIds: NEW_COMPOSITE_TIMELINES,
      stillUnresolvedTimelineIds: ["sprite-64"],
      requirementCount: coverage.requirements.length,
      capturedFrameCount: 0,
      baselineAuthority: "unresolved",
      effect:
        "The 30 existing EN/ES requirements remain blocked, but this coverage file cannot be cited as current because it binds the predecessor disposition and still lists sprite-355 and sprite-379 as unresolved exclusions.",
    },
    aggregateProjectionBoundary: {
      rawDispositionResidualCount: residual.reconciliation.currentResidual.count,
      rawDispositionResidualSetSha256:
        residual.reconciliation.currentResidual.sha256,
      formalRequirementProjectionResidualCount:
        residual.formalProjectionBoundary
          .currentFormalRequirementProjectionResidualCount,
      exactStaleProjectionDifference: residual.formalProjectionBoundary.difference,
      naturalScheduleReadyRequirementCount:
        template.currentFormalState.requirements.naturalScheduleReady,
      changeCreatedByThisReport: 0,
      rule:
        "This currentness report explains two of the four raw-versus-formal stale pairs but performs no downstream regeneration and changes neither the raw residual count nor the formal projection count.",
    },
    downstreamBoundary: {
      decision: template.downstreamTransactionBoundary.decision,
      prohibitedModes: template.downstreamTransactionBoundary.prohibitedModes,
      durableAppliedReceiptPresent:
        template.downstreamTransactionBoundary.durableAppliedReceiptPresent,
      applyAuthorized: template.downstreamTransactionBoundary.applyAuthorized,
      rule:
        "Do not execute scripts/materialize-g4-l10-nested-parent-downstream-successor-v1.mjs in any mode and do not hand-edit coverage, traces, keyframes, plans, ledgers, caches, or receipts.",
    },
    securityAndRuntimeBoundary: {
      activeReviewProtocol: binding(entries.reviewProtocolV216.record),
      activeReviewProtocolStatus: security.status,
      reviewSetManifestBound: security.reviewSetManifestBound,
      freshUserOwnedReviewBatchAuthorized:
        security.freshUserOwnedReviewBatchAuthorized,
      specReviewQualified: security.specReviewQualified,
      productionHelperImplementationEligible:
        security.productionHelperImplementationEligible,
      reviewerTaskCount: 0,
      phaseAExecuted: false,
      phaseBExecuted: false,
      originalRuntimeLaunchAuthorized: false,
      parentNaturalEntryEstablished: false,
      authoritativeOriginalRuntimeFrameCount: 0,
    },
    authorityEffects: Object.fromEntries(AUTHORITY_EFFECT_KEYS.map((key) =>
      [key, false])),
    review: {
      reviewTaskAuthorized: false,
      reviewTaskIds: [],
      reviewVerdictPresent: false,
      acceptanceDecisionPresent: false,
    },
    selfIdentity,
    nextPermittedAction:
      "Retain this report as acceptance-neutral audit currentness evidence. The next static gap requires a separately authorized successor; v2.16 reviewer tasks and any helper or original-runtime activity require separate authorization and evidence.",
  };
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateReport(report);
  return report;
}

export function validateReport(report) {
  assert.equal(report.status,
    "SOURCE_STATIC_DISPOSITION_CURRENT_ONE_INTERACTIVE_UNRESOLVED_COVERAGE_PREDECESSOR_STALE_NO_RUNTIME_AUTHORITY");
  assert.equal(report.decision,
    "PRESERVE_CURRENT_DISPOSITION_KEEP_SPRITE64_UNRESOLVED_DO_NOT_REFRESH_COVERAGE_DO_NOT_RUN_DOWNSTREAM_TRANSACTION");
  assert.equal(report.animationId, ANIMATION_ID);
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
    .newlyCompositeRelativeToCoverageTimelineIds, NEW_COMPOSITE_TIMELINES);
  assert.equal(report.currentDisposition.parentEntryStateEstablished, false);
  assert.equal(report.sprite64UnresolvedBoundary.dispositionChangeAuthorized,
    false);
  assert.equal(report.coverageCurrentness.currentAgainstDisposition, false);
  assert.equal(report.coverageCurrentness.boundPredecessorDisposition.sha256,
    PREDECESSOR_DISPOSITION_SHA256);
  assert.equal(report.coverageCurrentness.currentDisposition.sha256,
    CURRENT_DISPOSITION_SHA256);
  assert.equal(report.coverageCurrentness.capturedFrameCount, 0);
  assert.equal(report.coverageCurrentness.baselineAuthority, "unresolved");
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
  assert.equal(report.review.reviewVerdictPresent, false);
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
}

export function renderMarkdown(report) {
  const oldCounts = report.coverageCurrentness.boundPredecessorDisposition
    .dispositionCounts;
  const currentCounts = report.currentDisposition.dispositionCounts;
  return `# G4 L10 TS007 frame-domain disposition currentness v1\n\n` +
    `Status: **${report.status}**\n\n` +
    `Decision: **${report.decision}**\n\n` +
    `The exact source-static recomputation supports 15 declared frame domains, ` +
    `10 composite children, and exactly one unresolved enumerated timeline. ` +
    `The two nested-parent successor composites are \`sprite-355\` and ` +
    `\`sprite-379\`, derived from declared parent \`sprite-388\`; its natural ` +
    `runtime entry remains unresolved. Interactive \`sprite-64\` remains ` +
    `unresolved and is not classified by this report.\n\n` +
    `## Stale downstream binding\n\n` +
    `The existing coverage binds predecessor disposition ` +
    `\`${report.coverageCurrentness.boundPredecessorDisposition.sha256}\` ` +
    `(${oldCounts["composite-child-with-parent"]} composite, ` +
    `${oldCounts.unresolved} unresolved), not current disposition ` +
    `\`${report.coverageCurrentness.currentDisposition.sha256}\` ` +
    `(${currentCounts["composite-child-with-parent"]} composite, ` +
    `${currentCounts.unresolved} unresolved). Its 30 EN/ES requirements remain ` +
    `blocked with zero authoritative frames. Raw unresolved remains 70; the ` +
    `deliberately stale formal projection remains 74.\n\n` +
    `## Boundary\n\n` +
    `Do not run the prohibited 114-output downstream transaction in any mode. ` +
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
    const expectedBinding = {
      path: relativePath,
      bytes: Buffer.byteLength(expected),
      sha256: sha256(Buffer.from(expected)),
      mode: "0444",
    };
    await readStable(root, "generated-report", expectedBinding);
  }
  if (options.skipInputCheck !== true) {
    await assertSnapshotUnchanged(bundle.snapshot);
  }
  return {
    disposition: "checked",
    status: bundle.report.status,
    reportFingerprintSha256: bundle.report.reportFingerprintSha256,
    currentDispositionUnresolvedCount: 1,
    currentDispositionUnresolvedTimelineIds: ["sprite-64"],
    coverageCurrentAgainstDisposition: false,
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
    status: bundle.report.status,
    reportFingerprintSha256: bundle.report.reportFingerprintSha256,
    currentDispositionUnresolvedCount: 1,
    currentDispositionUnresolvedTimelineIds: ["sprite-64"],
    coverageCurrentAgainstDisposition: false,
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
