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
export const ANIMATION_ID = "course-g04-l10-ts-008";
export const REPORT_JSON =
  "reports/g4-l10-ts008-frame-domain-disposition-currentness-v1.json";
export const REPORT_MARKDOWN =
  "reports/g4-l10-ts008-frame-domain-disposition-currentness-v1.md";
export const TEST_RELATIVE =
  "scripts/build-g4-l10-ts008-frame-domain-disposition-currentness-v1.test.mjs";

const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const BASE = `migrations/${ANIMATION_ID}`;
const SOURCE_SHA256 =
  "59299d4acf780a24e5f221fb1f4fe5e9a8330303367b9632c7b1ff2d6bf7b3a5";
const CURRENT_DISPOSITION_SHA256 =
  "8f4f4d32b532b58711ea09237184e27b121a721af1a05d378bb894cde1e54733";
const PREDECESSOR_DISPOSITION_SHA256 =
  "37a0d679f6829ea2ace2c377e0f2d9e2907e755bb72efff278d966d2fa780c8c";
const NEW_COMPOSITE_TIMELINES = Object.freeze(["sprite-354", "sprite-378"]);
const SINGLE_FRAME_COMPOSITES = Object.freeze([
  "sprite-17",
  "sprite-66",
  "sprite-68",
  "sprite-202",
  "sprite-225",
]);
const ALL_COMPOSITES = Object.freeze([
  ...SINGLE_FRAME_COMPOSITES,
  ...NEW_COMPOSITE_TIMELINES,
]);
const DECLARED_NESTED_DOMAINS = Object.freeze([
  "sprite-110",
  "sprite-150",
  "sprite-169",
  "sprite-220",
  "sprite-234",
  "sprite-245",
  "sprite-257",
  "sprite-291",
  "sprite-303",
  "sprite-316",
  "sprite-348",
  "sprite-387",
  "sprite-411",
  "sprite-413",
]);

const INPUTS = Object.freeze({
  manifest: Object.freeze({
    path: `${BASE}/migration.json`,
    bytes: 28936,
    sha256: "d7630d31090e204f84d6e93f334d876caf5f7d32428014d7396bb1490afaab6d",
    mode: "0644",
  }),
  coverage: Object.freeze({
    path: `${BASE}/evidence/full-frame-coverage.json`,
    bytes: 95809,
    sha256: "f00e858b4b8c5f1e589c68627a9c1a36b0c02745dfb15889aaceda0db19c7c9e",
    mode: "0644",
  }),
  disposition: Object.freeze({
    path: `${BASE}/audit/frame-domain-disposition.json`,
    bytes: 83928,
    sha256: CURRENT_DISPOSITION_SHA256,
    mode: "0644",
  }),
  staticEvidence: Object.freeze({
    path: `${BASE}/audit/static-frame-domain-disposition-evidence.json`,
    bytes: 146886,
    sha256: "9a906cfa7e8e680e3fa5f0552639e2322a5f6de8c1080416b533520f6f2f05b7",
    mode: "0644",
  }),
  independentEvidence: Object.freeze({
    path: `${BASE}/audit/source-proven-independent-frame-domain-evidence.json`,
    bytes: 52652,
    sha256: "08bf041ab9348fcf24799f9525369a0c4860a36a2134a28dbcd4b7a698fe9528",
    mode: "0644",
  }),
  inventory: Object.freeze({
    path: `${BASE}/audit/scenario-inventory.json`,
    bytes: 956558,
    sha256: "e28eb246b02f93c293307832815c39841db5a1c3627352759a12a0f6262bbcc4",
    mode: "0644",
  }),
  swfmill: Object.freeze({
    path: `${BASE}/audit/machine/swfmill.xml.gz`,
    bytes: 955133,
    sha256: "37158bde3d9feaf6b26538641893586bd25be6b7748e2e8ff7d802d28b77f49a",
    mode: "0644",
  }),
  ffdecScripts: Object.freeze({
    path: `${BASE}/audit/machine/ffdec-scripts.txt.gz`,
    bytes: 1105,
    sha256: "ff65a1f947e69be18be8cae6a04517bc53c74f5d92c232ecea52ccf54dc3983f",
    mode: "0644",
  }),
  sourceSwf: Object.freeze({
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS08.swf",
    bytes: 556547,
    sha256: SOURCE_SHA256,
    mode: "0500",
  }),
  templateContractV7: Object.freeze({
    path: "reports/g4-l10-complete-migration-template-contract-v7-2026-08-07.json",
    bytes: 245414,
    sha256: "78cd44a2524d50b3db6e1860200cd748ff518741bc64193b68c5740bc7368a53",
    mode: "0444",
  }),
  failedSecurityBatch: Object.freeze({
    path: "reports/g4-l10-native-helper-v2-14-independent-review-batch-4d05187e-failed-v1.json",
    bytes: 9999,
    sha256: "de1bfbf4323a44360932851772bf35db09f8bc3e4310f65eac28b976aa002ea2",
    mode: "0444",
  }),
});

const AUTHORITY_EFFECT_KEYS = Object.freeze([
  "canonicalWorkspaceMutation",
  "frameDomainDispositionChange",
  "coverageRegeneration",
  "traceRegeneration",
  "specificationAcceptance",
  "productionHelperImplementation",
  "productionHelperTest",
  "protectedInstallation",
  "helperExecution",
  "originalRuntimeLaunch",
  "authoritativeOriginalRuntimeEvidence",
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
  const template = parseJson(entries.templateContractV7);
  const security = parseJson(entries.failedSecurityBatch);
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
      timelineId: "sprite-354",
      frameCount: 22,
      parentTimelineId: "sprite-387",
      parentFrameDomainId: "sprite-387",
      parentFrameCount: 27,
      eligible: false,
      disqualifiers: ["declared-parent-does-not-have-one-direct-root-placement"],
      ffdecFrameScriptCount: 0,
      attributedDoInitActionCount: 0,
    },
    {
      timelineId: "sprite-378",
      frameCount: 19,
      parentTimelineId: "sprite-387",
      parentFrameDomainId: "sprite-387",
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
  assert.equal(nested.parentTimelineId, "sprite-387");
  assert.equal(nested.parentFrameDomainId, "sprite-387");
  assert.equal(nested.parentEntryStateEstablished, false);
  assert.equal(nested.parentBindingMode,
    "nested-declared-parent-local-clock-only");
  assert.deepEqual(nested.timelines.map((row) => [row.timelineId,
    row.frameCount]), [["sprite-354", 22], ["sprite-378", 19]]);
  assert.deepEqual(projectRootPath(nested.parentRootPath), [
    {
      parentTimelineId: "root",
      childTimelineId: "sprite-413",
      sourceObjectId: "413",
      frame: 6,
      depth: "3",
      instanceName: "animation",
      tag: "PlaceObject2",
      replace: "0",
      hasClipActions: false,
    },
    {
      parentTimelineId: "sprite-413",
      childTimelineId: "sprite-387",
      sourceObjectId: "387",
      frame: 766,
      depth: "399",
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
    claim.parentBinding.parentTimelineId === "sprite-387" &&
    claim.parentBinding.parentFrameDomainId === "sprite-387" &&
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
  assert.equal(independentEvidence.summary.unresolvedAfter, 2);

  assert.equal(disposition.status, "structurally-enumerated");
  assert.equal(disposition.migrationStatusChanged, false);
  assert.equal(disposition.strictAcceptanceEffect,
    "none; this structural audit does not advance migration status or satisfy authoritative runtime, full-frame RMSE, audio, behavior, human-review, or owner-acceptance gates");
  assert.deepEqual(disposition.summary, {
    inventoryTimelineCount: 23,
    enumeratedTimelineCount: 22,
    reachableChildTimelineCount: 21,
    excludedNotProvenTimelineCount: 1,
    dispositionCounts: {
      "declared-frame-domain": 15,
      "composite-child-with-parent": 7,
      "independent-required": 0,
      nonvisual: 0,
      unresolved: 0,
    },
    highRiskIndependentCandidateCount: 0,
    highRiskIndependentCandidates: [],
  });
  assert.deepEqual(exactTimelineIds(disposition.timelines.filter((row) =>
    row.disposition === "declared-frame-domain")).slice(1),
  DECLARED_NESTED_DOMAINS);
  assert.deepEqual(exactTimelineIds(disposition.timelines.filter((row) =>
    row.disposition === "composite-child-with-parent")), ALL_COMPOSITES);
  assert.equal(disposition.timelines.some((row) =>
    row.disposition === "unresolved"), false);
  assert.equal(disposition.generatedFrom.staticDispositionEvidence.sha256,
    INPUTS.staticEvidence.sha256);
  assert.equal(disposition.generatedFrom
    .sourceProvenIndependentDeclarationBasis.memberEvidence.sha256,
  INPUTS.independentEvidence.sha256);
  assert.equal(disposition.generatedFrom.nestedDeclaredParentSuccessorBasis
    .memberPairSet.count, 2);
  assert.equal(disposition.generatedFrom.nestedDeclaredParentSuccessorBasis
    .parentEntryStateEstablished, false);
  assert.equal(disposition.generatedFrom.lessonReleaseCatalog.member.ordinal, 43);

  const coverageBinding = coverage.materialization.frameDomainDisposition;
  assert.equal(coverageBinding.bytes, 75257);
  assert.equal(coverageBinding.sha256, PREDECESSOR_DISPOSITION_SHA256);
  assert.equal(coverageBinding.status,
    "structurally-enumerated-dispositions-unresolved");
  assert.deepEqual(coverageBinding.dispositionCounts, {
    "declared-frame-domain": 15,
    "composite-child-with-parent": 5,
    "independent-required": 0,
    nonvisual: 0,
    unresolved: 2,
  });
  assert.deepEqual(coverage.materialization.excludedUnresolvedTimelines.timelines
    .map((row) => row.sourceTimelineId), NEW_COMPOSITE_TIMELINES);
  assert.equal(coverage.requirements.length, 30);
  assert.ok(coverage.requirements.every((requirement) =>
    requirement.status === "blocked" &&
    requirement.capturedFrameCount === 0 &&
    requirement.baselineAuthority === "unresolved"));
  assert.notEqual(coverageBinding.sha256, INPUTS.disposition.sha256);

  assert.equal(template.status, "fail-closed-template-not-stable");
  assert.equal(template.templateStable, false);
  assert.equal(template.downstreamTransactionBoundary.decision, "DO_NOT_APPLY");
  assert.deepEqual(template.downstreamTransactionBoundary.prohibitedModes,
    ["--apply", "--dry-run", "--check"]);
  assert.equal(security.status,
    "FAILED_TWO_TASK_SYSTEM_INCOMPLETE_ONE_P1_NONREUSABLE_NO_IMPLEMENTATION_AUTHORITY");
  assert.equal(security.batchResult.productionHelperImplementationEligible,
    false);
  assert.equal(security.batchResult.reusable, false);

  const inputBindings = Object.fromEntries(Object.entries(entries)
    .map(([key, entry]) => [key, binding(entry.record)]));
  const selfIdentity = Object.fromEntries(Object.entries(snapshot.selfEntries)
    .map(([key, entry]) => [key, binding(entry.record)]));
  const report = {
    schemaVersion: 1,
    artifactType:
      "g4-l10-ts008-frame-domain-disposition-currentness-v1",
    generatedForDate: "2026-08-07",
    status:
      "SOURCE_STATIC_DISPOSITION_CURRENT_COVERAGE_PREDECESSOR_STALE_NO_RUNTIME_AUTHORITY",
    decision:
      "PRESERVE_CURRENT_DISPOSITION_DO_NOT_REFRESH_COVERAGE_DO_NOT_RUN_DOWNSTREAM_TRANSACTION",
    releaseId: RELEASE_ID,
    animationId: ANIMATION_ID,
    sourceIdentity: {
      assetId: `swf-${SOURCE_SHA256}`,
      sourceSwfPath: INPUTS.sourceSwf.path,
      sourceSwfSha256: SOURCE_SHA256,
      pairedFlaStatus: "missing",
    },
    evidenceClass:
      "read-only-source-static-currentness-and-stale-downstream-binding-report",
    purpose: [
      "Prove the current TS008 frame-domain disposition state from exact source-static inputs without mutating the workspace.",
      "Separate current source-static disposition closure from the stale predecessor disposition still bound by full-frame coverage.",
      "Preserve every original-runtime, behavior, visual/RMSE, audio, human, owner, strict-completion, lesson, and course gate.",
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
      inventoryTimelineCount: 23,
      enumeratedTimelineCount: 22,
      excludedNotProvenTimelineCount: 1,
      dispositionCounts: disposition.summary.dispositionCounts,
      unresolvedTimelineIds: [],
      newlyCompositeRelativeToCoverageTimelineIds: NEW_COMPOSITE_TIMELINES,
      parentEntryStateEstablished: false,
      meaning:
        "Source-static evidence removes separate child frame-domain requirements for sprite-354 and sprite-378 by deriving their local clocks from declared parent sprite-387; it does not establish when or how sprite-387 is naturally entered at runtime.",
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
      requirementCount: coverage.requirements.length,
      capturedFrameCount: 0,
      baselineAuthority: "unresolved",
      effect:
        "The 30 existing EN/ES requirements remain blocked, but this coverage file cannot be cited as current because its materialization binds the predecessor disposition and still lists two excluded unresolved timelines.",
    },
    downstreamBoundary: {
      decision: template.downstreamTransactionBoundary.decision,
      prohibitedModes:
        template.downstreamTransactionBoundary.prohibitedModes,
      durableAppliedReceiptPresent:
        template.downstreamTransactionBoundary.durableAppliedReceiptPresent,
      applyAuthorized: template.downstreamTransactionBoundary.applyAuthorized,
      rule:
        "Do not execute scripts/materialize-g4-l10-nested-parent-downstream-successor-v1.mjs in any mode and do not hand-edit coverage, traces, keyframes, plans, ledgers, caches, or receipts.",
    },
    securityAndRuntimeBoundary: {
      latestSecurityStatus: security.status,
      securityBatchReusable: security.batchResult.reusable,
      productionHelperImplementationEligible:
        security.batchResult.productionHelperImplementationEligible,
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
      "Retain this report as acceptance-neutral audit currentness evidence. A separately authorized and independently reviewed successor is required before any downstream regeneration, helper implementation, runtime start, specification adoption, or renderer work.",
  };
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateReport(report);
  return report;
}

export function validateReport(report) {
  assert.equal(report.status,
    "SOURCE_STATIC_DISPOSITION_CURRENT_COVERAGE_PREDECESSOR_STALE_NO_RUNTIME_AUTHORITY");
  assert.equal(report.decision,
    "PRESERVE_CURRENT_DISPOSITION_DO_NOT_REFRESH_COVERAGE_DO_NOT_RUN_DOWNSTREAM_TRANSACTION");
  assert.equal(report.animationId, ANIMATION_ID);
  assert.deepEqual(report.currentDisposition.dispositionCounts, {
    "declared-frame-domain": 15,
    "composite-child-with-parent": 7,
    "independent-required": 0,
    nonvisual: 0,
    unresolved: 0,
  });
  assert.deepEqual(report.currentDisposition
    .newlyCompositeRelativeToCoverageTimelineIds, NEW_COMPOSITE_TIMELINES);
  assert.equal(report.currentDisposition.parentEntryStateEstablished, false);
  assert.equal(report.coverageCurrentness.currentAgainstDisposition, false);
  assert.equal(report.coverageCurrentness.boundPredecessorDisposition.sha256,
    PREDECESSOR_DISPOSITION_SHA256);
  assert.equal(report.coverageCurrentness.currentDisposition.sha256,
    CURRENT_DISPOSITION_SHA256);
  assert.equal(report.coverageCurrentness.capturedFrameCount, 0);
  assert.equal(report.coverageCurrentness.baselineAuthority, "unresolved");
  assert.deepEqual(report.downstreamBoundary.prohibitedModes,
    ["--apply", "--dry-run", "--check"]);
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
  return `# G4 L10 TS008 frame-domain disposition currentness v1\n\n` +
    `Status: **${report.status}**\n\n` +
    `Decision: **${report.decision}**\n\n` +
    `The exact source-static recomputation supports 15 declared frame domains, ` +
    `7 composite children, and 0 unresolved enumerated timelines. The two ` +
    `nested-parent successor composites are \`sprite-354\` and ` +
    `\`sprite-378\`; both are derived from the local clock of declared parent ` +
    `\`sprite-387\`, whose natural runtime entry remains unresolved.\n\n` +
    `## Stale downstream binding\n\n` +
    `The existing coverage binds predecessor disposition ` +
    `\`${report.coverageCurrentness.boundPredecessorDisposition.sha256}\` ` +
    `(${oldCounts["composite-child-with-parent"]} composite, ` +
    `${oldCounts.unresolved} unresolved), not current disposition ` +
    `\`${report.coverageCurrentness.currentDisposition.sha256}\` ` +
    `(${currentCounts["composite-child-with-parent"]} composite, ` +
    `${currentCounts.unresolved} unresolved). Its 30 EN/ES requirements remain ` +
    `blocked with zero authoritative frames.\n\n` +
    `## Boundary\n\n` +
    `Do not run the prohibited 114-output downstream transaction in any mode ` +
    `and do not hand-edit coverage or ledgers. This report creates no helper, ` +
    `runtime, specification, renderer, RMSE, audio, review, acceptance, ` +
    `integration, promotion, release, or publication authority.\n\n` +
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
    currentDispositionUnresolvedCount: 0,
    coverageCurrentAgainstDisposition: false,
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
    currentDispositionUnresolvedCount: 0,
    coverageCurrentAgainstDisposition: false,
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
