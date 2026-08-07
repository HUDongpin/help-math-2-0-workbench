#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, readFile, realpath} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

import {buildDispositionReport} from "./build-frame-domain-dispositions.mjs";
import {
  INDIRECT_DECLARED_PARENT_DISQUALIFIER,
  NESTED_DECLARED_PARENT_BINDING_MODE,
  buildStaticCompositeEvidenceDocument,
  deriveMultiFrameScriptlessCandidateAudit,
  deriveNestedDeclaredParentScriptlessCandidateSpecs,
  parseFfdecDispositionScripts,
  parseSwfmillDispositionStructure,
} from "./build-static-frame-domain-disposition-evidence.mjs";
import {
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";
import {
  commitAtomicEntries,
} from "./materialize-g4-l10-independent-frame-domain-declarations.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SCRIPT_RELATIVE =
  "scripts/materialize-g4-l10-nested-declared-parent-static-composites.mjs";
const PROOF_ENGINE_RELATIVE =
  "scripts/build-static-frame-domain-disposition-evidence.mjs";
const DISPOSITION_ENGINE_RELATIVE = "scripts/build-frame-domain-dispositions.mjs";
const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const RELEASE_CATALOG_RELATIVE = "catalog/lesson-releases.json";
const PREDECESSOR_REPORT_RELATIVE =
  "reports/g4-l10-post-declaration-static-composites.json";
export const G4_L10_NESTED_PARENT_REPORT_RELATIVE =
  "reports/g4-l10-nested-declared-parent-static-composites.json";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

const EXPECTED = Object.freeze({
  releaseMembers: 47,
  releaseCatalog: Object.freeze({
    bytes: 115651,
    sha256:
      "d518f812a19b6038e55bca337b7a4f4f96425dd5599f9d07c9f69c8a0a1ae1cf",
  }),
  releaseFingerprintSha256:
    "4b77aedf7dcb0aeb9e9a84b7eb97b89b7a0ff03200956a4a93d65f8f9de2b1fd",
  orderedMemberIdentitySha256:
    "b3950290c53c2d6f5f1bd40ce20deb1f1b954660b0868a3fa8dc3795ec5504fe",
  predecessorReport: Object.freeze({
    bytes: 95598,
    sha256:
      "1b64902f3806f6939df82c8f62806c1e09101c5f019619e874921be1d7a23ca8",
  }),
  selected: Object.freeze({
    count: 4,
    sha256:
      "24e6fabe063f6b32bd14b1359961b09ae895d18369ecb48aaa70ad233523bfff",
  }),
  predecessorRemaining: Object.freeze({
    count: 74,
    sha256:
      "3f2adcef24544cff58cf36fa940abae25e3441c8486062100ea368aa858e3962",
  }),
  residualParentBlockers: Object.freeze({
    count: 22,
    sha256:
      "cd2d739cc94bba5e026b5ee2f84c27270327f7d33d6b31f79c3f46db2ea1879b",
  }),
  successorRemaining: Object.freeze({
    count: 70,
    sha256:
      "13df4a13d684c1900c138ba08cd8b7e5c61c4c4f8be050558d71fc2c8a219852",
  }),
  before: Object.freeze({
    declared: 260,
    composite: 754,
    independentRequired: 0,
    unresolved: 74,
    nonvisual: 0,
    excludedNotProven: 210,
  }),
  after: Object.freeze({
    declared: 260,
    composite: 758,
    independentRequired: 0,
    unresolved: 70,
    nonvisual: 0,
    excludedNotProven: 210,
  }),
});

const TARGETS = Object.freeze([
  Object.freeze({
    animationId: "course-g04-l10-ts-007",
    sourcePath:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS07.swf",
    sourceSha256:
      "64070bdec0badb3cb009a741fe1b5e9c96bd98e68b92c4dfe125db3b43617eff",
    technicalManifestSha256:
      "8cc294f310f7503070e672094f1bdd6384ade899c46af1c550f872ff285664ac",
    predecessorStatic: Object.freeze({
      bytes: 56544,
      sha256:
        "df1e981d95928c1a441eb51bb66d2edafcfb66c486252f7d1823d7148a9dedff",
    }),
    predecessorDisposition: Object.freeze({
      bytes: 91900,
      sha256:
        "ebc6e4aafdf48f7beb6752f437e21a5fdd1986e4b5209362c0c94628e830b3c2",
    }),
    singleFrameTimelineIds: Object.freeze([
      "sprite-60", "sprite-62", "sprite-63", "sprite-77",
      "sprite-79", "sprite-203", "sprite-226", "sprite-419",
    ]),
    selectedTimelineIds: Object.freeze(["sprite-355", "sprite-379"]),
    selectedPairSetSha256:
      "f8f99abbb4d172c421dabb625b4f698a54db1f2ef6adfc4b42d2127a9d4d335a",
    parent: Object.freeze({
      timelineId: "sprite-388",
      sourceObjectId: "388",
      frameCount: 27,
      sourceProofSha256:
        "110ad73562c8e01b205c4449504612dcf6cb0d86b6cea051d1da81bb25f60f02",
      sourceProofClaimIndex: 11,
      rootPath: Object.freeze([
        Object.freeze({
          parentTimelineId: "root",
          childTimelineId: "sprite-415",
          sourceObjectId: "415",
          frame: 6,
          depth: "1",
          instanceName: "animation",
          tag: "PlaceObject2",
          replace: "0",
          hasClipActions: false,
        }),
        Object.freeze({
          parentTimelineId: "sprite-415",
          childTimelineId: "sprite-388",
          sourceObjectId: "388",
          frame: 832,
          depth: "441",
          instanceName: "Mc_Right_Feed5",
          tag: "PlaceObject2",
          replace: "0",
          hasClipActions: false,
        }),
      ]),
    }),
    afterCounts: Object.freeze({
      declared: 15,
      composite: 10,
      unresolved: 1,
    }),
  }),
  Object.freeze({
    animationId: "course-g04-l10-ts-008",
    sourcePath:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS08.swf",
    sourceSha256:
      "59299d4acf780a24e5f221fb1f4fe5e9a8330303367b9632c7b1ff2d6bf7b3a5",
    technicalManifestSha256:
      "6724d44124ed7b78554f12236deb80e68118a400fd8a33944be623639f096cf6",
    predecessorStatic: Object.freeze({
      bytes: 36936,
      sha256:
        "2d6e13fef9507cf208b3a0b2d0e582bf25d56ede401add90a0bcfa5713827ab5",
    }),
    predecessorDisposition: Object.freeze({
      bytes: 75257,
      sha256:
        "37a0d679f6829ea2ace2c377e0f2d9e2907e755bb72efff278d966d2fa780c8c",
    }),
    singleFrameTimelineIds: Object.freeze([
      "sprite-17", "sprite-66", "sprite-68", "sprite-202", "sprite-225",
    ]),
    selectedTimelineIds: Object.freeze(["sprite-354", "sprite-378"]),
    selectedPairSetSha256:
      "b6737ae562b91badc4e59ae40c4cc9f74251b2d3d9a274a0dae822ca465fbd6f",
    parent: Object.freeze({
      timelineId: "sprite-387",
      sourceObjectId: "387",
      frameCount: 27,
      sourceProofSha256:
        "08bf041ab9348fcf24799f9525369a0c4860a36a2134a28dbcd4b7a698fe9528",
      sourceProofClaimIndex: 11,
      rootPath: Object.freeze([
        Object.freeze({
          parentTimelineId: "root",
          childTimelineId: "sprite-413",
          sourceObjectId: "413",
          frame: 6,
          depth: "3",
          instanceName: "animation",
          tag: "PlaceObject2",
          replace: "0",
          hasClipActions: false,
        }),
        Object.freeze({
          parentTimelineId: "sprite-413",
          childTimelineId: "sprite-387",
          sourceObjectId: "387",
          frame: 766,
          depth: "399",
          instanceName: "Mc_Right_Feed5",
          tag: "PlaceObject2",
          replace: "0",
          hasClipActions: false,
        }),
      ]),
    }),
    afterCounts: Object.freeze({
      declared: 15,
      composite: 7,
      unresolved: 0,
    }),
  }),
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (
    !path.isAbsolute(relative)
    && relative !== ".."
    && !relative.startsWith(`..${path.sep}`)
  );
}

function resolveProjectPath(projectRoot, relativePath) {
  invariant(
    typeof relativePath === "string"
      && relativePath.length > 0
      && !path.isAbsolute(relativePath)
      && !relativePath.includes("\\"),
    `${relativePath}: path must be portable and project-relative`,
  );
  const absolutePath = path.resolve(projectRoot, relativePath);
  invariant(
    isWithin(projectRoot, absolutePath)
      && portable(path.relative(projectRoot, absolutePath)) === relativePath,
    `${relativePath}: path escapes the project root`,
  );
  return absolutePath;
}

async function readOrdinary(projectRoot, relativePath, {allowMissing = false} = {}) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath);
  let before;
  try {
    before = await lstat(absolutePath, {bigint: true});
  } catch (error) {
    if (allowMissing && error?.code === "ENOENT") {
      return {
        path: relativePath,
        absolutePath,
        exists: false,
        bytes: 0,
        sha256: null,
        contents: null,
      };
    }
    throw error;
  }
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${relativePath}: expected an ordinary single-link file`,
  );
  const [realRoot, realFile, contents] = await Promise.all([
    realpath(projectRoot),
    realpath(absolutePath),
    readFile(absolutePath),
  ]);
  invariant(isWithin(realRoot, realFile), `${relativePath}: real path escapes project root`);
  const after = await lstat(absolutePath, {bigint: true});
  invariant(
    before.dev === after.dev
      && before.ino === after.ino
      && before.size === after.size
      && before.mtimeNs === after.mtimeNs
      && before.ctimeNs === after.ctimeNs
      && BigInt(contents.length) === after.size,
    `${relativePath}: changed while it was read`,
  );
  return {
    path: relativePath,
    absolutePath,
    exists: true,
    bytes: contents.length,
    sha256: sha256(contents),
    contents,
  };
}

async function readJson(projectRoot, relativePath, options) {
  const record = await readOrdinary(projectRoot, relativePath, options);
  if (!record.exists) return {...record, document: null};
  return {...record, document: JSON.parse(record.contents.toString("utf8"))};
}

function descriptor(record) {
  return {path: record.path, bytes: record.bytes, sha256: record.sha256};
}

function recordForRendered(relativePath, document) {
  const rendered = pretty(document);
  const contents = Buffer.from(rendered, "utf8");
  return {
    path: relativePath,
    bytes: contents.length,
    sha256: sha256(contents),
    rendered,
    document,
  };
}

function matches(record, expected) {
  return record.exists
    && record.bytes === expected.bytes
    && record.sha256 === expected.sha256;
}

function assertDescriptor(record, expected, label) {
  invariant(matches(record, expected), `${label}: exact descriptor drifted`);
}

function expectedPreimage(record) {
  return {
    path: record.path,
    exists: record.exists === true,
    bytes: record.exists ? record.bytes : 0,
    sha256: record.exists ? record.sha256 : null,
  };
}

function assertPreparedExpectedPreimages(entries) {
  for (const entry of entries) {
    const expected = entry.expectedPreimage;
    const observed = entry.preimage;
    invariant(expected && observed,
      `${entry.path}: prepared transaction preimage contract is missing`);
    invariant(
      observed.exists === expected.exists
        && observed.bytes === expected.bytes
        && observed.sha256 === expected.sha256,
      `${entry.path}: prepared preimage differs from buildState expectedPreimage`,
    );
  }
}

export function buildWave3PredecessorDispositionMap(report, releaseMembers) {
  invariant(Array.isArray(releaseMembers) && releaseMembers.length === EXPECTED.releaseMembers,
    "wave3 predecessor map requires the exact 47-member release");
  const descriptors = [
    ...(report.members || []).map((member) => (
      member.successor?.frameDomainDisposition
    )),
    ...(report.unchangedDispositionBindings || []),
  ];
  invariant(descriptors.length === EXPECTED.releaseMembers,
    "wave3 predecessor disposition descriptor count drifted");
  const byAnimationId = new Map();
  const seenPaths = new Set();
  for (const descriptorValue of descriptors) {
    invariant(
      descriptorValue
        && typeof descriptorValue.path === "string"
        && Number.isInteger(descriptorValue.bytes)
        && descriptorValue.bytes > 0
        && SHA256_PATTERN.test(descriptorValue.sha256 || ""),
      "wave3 predecessor disposition descriptor is invalid",
    );
    const matchPath = descriptorValue.path.match(
      /^migrations\/(.+)\/audit\/frame-domain-disposition\.json$/,
    );
    invariant(matchPath, `${descriptorValue.path}: predecessor disposition path is invalid`);
    const animationId = matchPath[1];
    invariant(!seenPaths.has(descriptorValue.path),
      `${descriptorValue.path}: predecessor disposition path is duplicated`);
    invariant(!byAnimationId.has(animationId),
      `${animationId}: predecessor disposition member is duplicated`);
    seenPaths.add(descriptorValue.path);
    byAnimationId.set(animationId, {...descriptorValue});
  }
  const expectedIds = [...releaseMembers.map(({animationId}) => animationId)].sort();
  const observedIds = [...byAnimationId.keys()].sort();
  invariant(JSON.stringify(observedIds) === JSON.stringify(expectedIds),
    "wave3 predecessor disposition map has a missing or foreign release member");
  for (const member of report.members || []) {
    invariant(
      byAnimationId.get(member.animationId)?.path
        === member.successor?.frameDomainDisposition?.path,
      `${member.animationId}: wave3 member successor disposition binding drifted`,
    );
  }
  return byAnimationId;
}

export function canonicalNestedParentPairSet(entries) {
  invariant(Array.isArray(entries), "pair set entries must be an array");
  const lines = entries.map(({animationId, timelineId}) => {
    invariant(
      typeof animationId === "string"
        && animationId.length > 0
        && !animationId.includes("\t")
        && !animationId.includes("\n"),
      "pair set animationId is invalid",
    );
    invariant(/^sprite-\d+$/.test(timelineId || ""), `${animationId}: pair timelineId is invalid`);
    return `${animationId}\t${timelineId}`;
  }).sort();
  invariant(new Set(lines).size === lines.length, "pair set contains duplicates");
  const bytes = Buffer.from(lines.length ? `${lines.join("\n")}\n` : "", "utf8");
  return {
    count: lines.length,
    sha256: sha256(bytes),
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  };
}

function assertPairSet(entries, expected, label) {
  const actual = canonicalNestedParentPairSet(entries);
  invariant(
    actual.count === expected.count && actual.sha256 === expected.sha256,
    `${label}: exact pair set drifted (${actual.count}/${actual.sha256})`,
  );
  return actual;
}

function releaseFingerprint(release) {
  return sha256(Buffer.from(stableJson(release), "utf8"));
}

function orderedMemberIdentityFingerprint(release) {
  return sha256(Buffer.from(stableJson(release.members.map(
    ({ordinal, animationId, assetId}) => ({ordinal, animationId, assetId}),
  )), "utf8"));
}

function requiredEvidence(inventory, artifactId) {
  const matches = (inventory.evidenceIndex || []).filter(
    (item) => item.artifactId === artifactId,
  );
  invariant(matches.length === 1, `${inventory.animationId}: ${artifactId} binding is not unique`);
  invariant(SHA256_PATTERN.test(matches[0].sha256 || ""), `${inventory.animationId}: ${artifactId} hash is invalid`);
  return matches[0];
}

function artifactPath(animationId, declaredPath) {
  return declaredPath.startsWith("source-assets/") || declaredPath.startsWith("migrations/")
    ? declaredPath
    : `migrations/${animationId}/${declaredPath}`;
}

function releaseBinding(catalogRecord, catalog, release) {
  return {
    releaseId: RELEASE_ID,
    releaseFingerprintSha256: EXPECTED.releaseFingerprintSha256,
    orderedMemberIdentitySha256: EXPECTED.orderedMemberIdentitySha256,
    catalog: {
      path: RELEASE_CATALOG_RELATIVE,
      bytes: catalogRecord.bytes,
      sha256: catalogRecord.sha256,
      schemaVersion: catalog.schemaVersion,
    },
    members: Object.fromEntries(release.members.map((member) => [
      member.animationId,
      {
        animationId: member.animationId,
        ordinal: member.ordinal,
        shardId: member.shardId,
        assetId: member.assetId,
        sourcePath: member.source.path,
        sourceSha256: member.source.sha256,
      },
    ])),
  };
}

export function dispositionTotals(reports) {
  const totals = {
    declared: 0,
    composite: 0,
    independentRequired: 0,
    unresolved: 0,
    nonvisual: 0,
    excludedNotProven: 0,
  };
  for (const report of reports) {
    const counts = report.summary.dispositionCounts;
    totals.declared += counts["declared-frame-domain"];
    totals.composite += counts["composite-child-with-parent"];
    totals.independentRequired += counts["independent-required"];
    totals.unresolved += counts.unresolved;
    totals.nonvisual += counts.nonvisual;
    totals.excludedNotProven += report.summary.excludedNotProvenTimelineCount;
  }
  return totals;
}

export function assertNestedParentTransitionTotals(before, after) {
  invariant(JSON.stringify(before) === JSON.stringify(EXPECTED.before),
    `predecessor totals drifted: ${JSON.stringify(before)}`);
  invariant(JSON.stringify(after) === JSON.stringify(EXPECTED.after),
    `successor totals drifted: ${JSON.stringify(after)}`);
  invariant(
    after.declared === before.declared
      && after.composite - before.composite === 4
      && before.unresolved - after.unresolved === 4
      && after.independentRequired === before.independentRequired
      && after.nonvisual === before.nonvisual
      && after.excludedNotProven === before.excludedNotProven,
    "transition must be exactly unresolved 74->70 and composite 754->758",
  );
  return true;
}

export function assertNestedParentAcceptanceNeutral(document, label = "successor evidence") {
  invariant(document?.migrationStatusChanged === false, `${label}: migration status changed`);
  invariant(String(document?.strictAcceptanceEffect || "").startsWith("none;"),
    `${label}: strict acceptance effect drifted`);
  if (document.acceptanceEffects) {
    for (const [key, value] of Object.entries(document.acceptanceEffects)) {
      invariant(value === false, `${label}: acceptance effect ${key} must remain false`);
    }
  }
  return true;
}

function predecessorRemainingPairs(report) {
  const scripted = report.scriptedReasonGroups.flatMap(({pairs}) => pairs);
  const rejected = report.rejectedReasonGroups.flatMap(({pairs}) => pairs);
  const direct = report.directRootLongBlockers.map(
    ({animationId, timelineId}) => ({animationId, timelineId}),
  );
  return [...scripted, ...rejected, ...direct];
}

function exactSingleFramePredecessor(document, target) {
  invariant(
    document?.schemaVersion === 2
      && document.evidenceType === "static-frame-domain-disposition-evidence"
      && document.status === "verified-static-composite-claims",
    `${target.animationId}: predecessor static evidence identity drifted`,
  );
  const claims = document.claims || [];
  const actualIds = claims
    .filter(({role}) => role === "single-frame-scriptless-structural-child")
    .map(({timelineId}) => timelineId);
  invariant(
    claims.length === target.singleFrameTimelineIds.length
      && JSON.stringify(actualIds) === JSON.stringify(target.singleFrameTimelineIds),
    `${target.animationId}: predecessor single-frame claim set drifted`,
  );
  invariant(document.generatedFrom?.sourceProvenReleaseContract,
    `${target.animationId}: predecessor release contract is missing`);
  return structuredClone(document.generatedFrom.sourceProvenReleaseContract);
}

function validateParentDomain(manifest, target) {
  const domains = (manifest.implementation?.frameDomains || []).filter(
    ({sourceTimelineId}) => sourceTimelineId === target.parent.timelineId,
  );
  invariant(domains.length === 1, `${target.animationId}: parent domain is not unique`);
  const [domain] = domains;
  invariant(
    domain.id === target.parent.timelineId
      && domain.kind === "nested"
      && domain.frameCount === target.parent.frameCount
      && JSON.stringify(domain.sourceParentTimelineIds)
        === JSON.stringify([target.parent.rootPath.at(-1).parentTimelineId])
      && domain.captureParentResolution?.includes("parentEntryState remains unresolved")
      && domain.sourceProof?.sourceObjectId === target.parent.sourceObjectId
      && domain.sourceProof?.sha256 === target.parent.sourceProofSha256
      && domain.sourceProof?.claimIndex === target.parent.sourceProofClaimIndex
      && domain.sourceProof?.authoritativeRuntimeEntryEstablished === false
      && domain.sourceProof?.strictAcceptanceEffect === "none",
    `${target.animationId}: exact parent declaration lineage drifted`,
  );
  return domain;
}

async function auditTarget(projectRoot, target) {
  const base = `migrations/${target.animationId}`;
  const [manifestRecord, inventoryRecord, swfmillRecord, scriptsRecord] =
    await Promise.all([
      readJson(projectRoot, `${base}/migration.json`),
      readJson(projectRoot, `${base}/audit/scenario-inventory.json`),
      readOrdinary(projectRoot, `${base}/audit/machine/swfmill.xml.gz`),
      readOrdinary(projectRoot, `${base}/audit/machine/ffdec-scripts.txt.gz`),
    ]);
  const manifest = manifestRecord.document;
  const inventory = inventoryRecord.document;
  invariant(
    manifest.animationId === target.animationId
      && inventory.animationId === target.animationId,
    `${target.animationId}: workspace identity drifted`,
  );
  invariant(
    technicalManifestSha256(manifest) === target.technicalManifestSha256,
    `${target.animationId}: technical manifest projection drifted`,
  );
  const manifestEvidence = requiredEvidence(inventory, "migration-technical-contract");
  invariant(
    manifestEvidence.path === "migration.json"
      && manifestEvidence.projection === TECHNICAL_MANIFEST_PROJECTION.id
      && manifestEvidence.hashMode === "canonical-json-v1"
      && JSON.stringify(manifestEvidence.excludedPaths)
        === JSON.stringify(TECHNICAL_MANIFEST_PROJECTION.excludedPaths)
      && manifestEvidence.sha256 === target.technicalManifestSha256,
    `${target.animationId}: scenario technical-manifest binding drifted`,
  );
  const swfmillEvidence = requiredEvidence(inventory, "swfmill-xml");
  const scriptsEvidence = requiredEvidence(inventory, "ffdec-scripts");
  invariant(
    swfmillRecord.sha256 === swfmillEvidence.sha256
      && scriptsRecord.sha256 === scriptsEvidence.sha256,
    `${target.animationId}: compressed machine evidence drifted`,
  );
  const swfmillXml = gunzipSync(swfmillRecord.contents).toString("utf8");
  const scriptText = gunzipSync(scriptsRecord.contents).toString("utf8");
  invariant(
    sha256(Buffer.from(swfmillXml, "utf8")) === swfmillEvidence.uncompressedSha256
      && sha256(Buffer.from(scriptText, "utf8")) === scriptsEvidence.uncompressedSha256,
    `${target.animationId}: uncompressed machine evidence drifted`,
  );
  const sourceEvidence = requiredEvidence(inventory, "source-swf");
  invariant(
    sourceEvidence.path === target.sourcePath
      && sourceEvidence.sha256 === target.sourceSha256,
    `${target.animationId}: source binding drifted`,
  );
  const sourceRecord = await readOrdinary(
    projectRoot,
    artifactPath(target.animationId, sourceEvidence.path),
  );
  invariant(sourceRecord.sha256 === target.sourceSha256,
    `${target.animationId}: physical source drifted`);
  const structure = parseSwfmillDispositionStructure(swfmillXml);
  const scripts = parseFfdecDispositionScripts(scriptText);
  const candidateAudit = deriveMultiFrameScriptlessCandidateAudit({
    animationId: target.animationId,
    structure,
    scripts,
    inventory,
    manifest,
  });
  return {
    base,
    manifestRecord,
    inventoryRecord,
    swfmillRecord,
    scriptsRecord,
    sourceRecord,
    manifest,
    inventory,
    structure,
    scripts,
    candidateAudit,
  };
}

async function buildState(projectRoot) {
  const [scriptRecord, proofEngineRecord, dispositionEngineRecord,
    predecessorReportRecord, catalogRecord, currentSuccessorReport] = await Promise.all([
    readOrdinary(projectRoot, SCRIPT_RELATIVE),
    readOrdinary(projectRoot, PROOF_ENGINE_RELATIVE),
    readOrdinary(projectRoot, DISPOSITION_ENGINE_RELATIVE),
    readJson(projectRoot, PREDECESSOR_REPORT_RELATIVE),
    readJson(projectRoot, RELEASE_CATALOG_RELATIVE),
    readJson(projectRoot, G4_L10_NESTED_PARENT_REPORT_RELATIVE, {
      allowMissing: true,
    }),
  ]);
  assertDescriptor(predecessorReportRecord, EXPECTED.predecessorReport,
    "immutable wave3 predecessor report");
  assertDescriptor(catalogRecord, EXPECTED.releaseCatalog, "lesson release catalog");
  const predecessorReport = predecessorReportRecord.document;
  invariant(
    predecessorReport.schemaVersion === 1
      && predecessorReport.reportType === "g4-l10-post-declaration-static-composite-wave3"
      && predecessorReport.releaseId === RELEASE_ID
      && JSON.stringify(predecessorReport.summary.afterDispositionTotals)
        === JSON.stringify(EXPECTED.before),
    "wave3 predecessor report contract drifted",
  );
  const selectedReasonGroups = predecessorReport.rejectedReasonGroups.filter(
    ({reason}) => reason === INDIRECT_DECLARED_PARENT_DISQUALIFIER,
  );
  invariant(selectedReasonGroups.length === 1,
    "wave3 exact indirect-parent reason group is missing or duplicated");
  const selectedPairs = selectedReasonGroups[0].pairs.map((pair) => ({...pair}));
  const selectedPairSet = assertPairSet(selectedPairs, EXPECTED.selected,
    "successor selected four");
  const allowlistPairs = TARGETS.flatMap((target) => target.selectedTimelineIds.map(
    (timelineId) => ({animationId: target.animationId, timelineId}),
  ));
  invariant(
    JSON.stringify(canonicalNestedParentPairSet(allowlistPairs))
      === JSON.stringify(selectedPairSet),
    "materializer allowlist differs from the immutable four-pair group",
  );
  for (const target of TARGETS) {
    assertPairSet(
      target.selectedTimelineIds.map(
        (timelineId) => ({animationId: target.animationId, timelineId}),
      ),
      {count: 2, sha256: target.selectedPairSetSha256},
      `${target.animationId}: exact member allowlist`,
    );
  }
  const oldRemainingPairs = predecessorRemainingPairs(predecessorReport);
  const predecessorRemainingPairSet = assertPairSet(
    oldRemainingPairs,
    EXPECTED.predecessorRemaining,
    "wave3 remaining unresolved",
  );
  const selectedKeys = new Set(selectedPairs.map(
    ({animationId, timelineId}) => `${animationId}\t${timelineId}`,
  ));
  const successorRemainingPairs = oldRemainingPairs.filter(
    ({animationId, timelineId}) => !selectedKeys.has(`${animationId}\t${timelineId}`),
  );
  const successorRemainingPairSet = assertPairSet(
    successorRemainingPairs,
    EXPECTED.successorRemaining,
    "successor remaining unresolved",
  );
  const residualParentPairs = predecessorReport.rejectedReasonGroups
    .flatMap(({pairs}) => pairs)
    .filter(({animationId, timelineId}) => (
      !selectedKeys.has(`${animationId}\t${timelineId}`)
    ));
  const residualParentPairSet = assertPairSet(
    residualParentPairs,
    EXPECTED.residualParentBlockers,
    "residual parent/static blockers",
  );

  const catalog = catalogRecord.document;
  const releases = catalog.releases.filter(({releaseId}) => releaseId === RELEASE_ID);
  invariant(releases.length === 1, `${RELEASE_ID}: release is missing or duplicated`);
  const [release] = releases;
  invariant(
    release.members.length === EXPECTED.releaseMembers
      && releaseFingerprint(release) === EXPECTED.releaseFingerprintSha256
      && orderedMemberIdentityFingerprint(release)
        === EXPECTED.orderedMemberIdentitySha256,
    `${RELEASE_ID}: exact release identity drifted`,
  );
  const releaseById = new Map(release.members.map((member) => [member.animationId, member]));
  const predecessorDispositionById = buildWave3PredecessorDispositionMap(
    predecessorReport,
    release.members,
  );
  for (const target of TARGETS) {
    const expectedDisposition = predecessorDispositionById.get(target.animationId);
    invariant(
      expectedDisposition.bytes === target.predecessorDisposition.bytes
        && expectedDisposition.sha256 === target.predecessorDisposition.sha256,
      `${target.animationId}: target predecessor disposition differs from immutable wave3`,
    );
  }
  const binding = releaseBinding(catalogRecord, catalog, release);
  const targetEntries = [];
  const targetMembers = [];
  const targetDispositionById = new Map();
  const targetStates = [];

  for (const target of TARGETS) {
    invariant(releaseById.has(target.animationId), `${target.animationId}: release member missing`);
    const audit = await auditTarget(projectRoot, target);
    const parentDomain = validateParentDomain(audit.manifest, target);
    const selectedInspections = target.selectedTimelineIds.map((timelineId) => {
      const inspection = audit.candidateAudit.inspections.find(
        (item) => item.timelineId === timelineId,
      );
      invariant(
        inspection?.eligible === false
          && JSON.stringify(inspection.disqualifiers)
            === JSON.stringify([INDIRECT_DECLARED_PARENT_DISQUALIFIER])
          && inspection.parentTimelineId === target.parent.timelineId
          && inspection.parentFrameCount === target.parent.frameCount,
        `${target.animationId}/${timelineId}: generic fail-closed inspection drifted`,
      );
      return inspection;
    });
    invariant(
      !audit.candidateAudit.candidateSpecs.some((spec) => (
        spec.timelines.some(({timelineId}) => target.selectedTimelineIds.includes(timelineId))
      )),
      `${target.animationId}: generic direct-root proof unexpectedly admitted a successor pair`,
    );
    const nestedSpecs = deriveNestedDeclaredParentScriptlessCandidateSpecs({
      animationId: target.animationId,
      candidateAudit: audit.candidateAudit,
      manifest: audit.manifest,
      structure: audit.structure,
      selectedTimelineIds: [...target.selectedTimelineIds],
    });
    invariant(
      nestedSpecs.length === 1
        && nestedSpecs[0].proofType
          === "multi-frame-scriptless-parent-clock-composite-child"
        && nestedSpecs[0].parentBindingMode
          === NESTED_DECLARED_PARENT_BINDING_MODE
        && nestedSpecs[0].parentEntryStateEstablished === false
        && nestedSpecs[0].parentTimelineId === target.parent.timelineId
        && nestedSpecs[0].parentFrameCount === target.parent.frameCount
        && JSON.stringify(nestedSpecs[0].parentRootPath)
          === JSON.stringify(target.parent.rootPath)
        && JSON.stringify(nestedSpecs[0].timelines.map(({timelineId}) => timelineId))
          === JSON.stringify(target.selectedTimelineIds),
      `${target.animationId}: narrow nested-parent spec drifted`,
    );

    const staticRelative = `${audit.base}/audit/static-frame-domain-disposition-evidence.json`;
    const dispositionRelative = `${audit.base}/audit/frame-domain-disposition.json`;
    const [currentStatic, currentDisposition] = await Promise.all([
      readJson(projectRoot, staticRelative),
      readJson(projectRoot, dispositionRelative),
    ]);
    const currentIsPredecessor = matches(currentStatic, target.predecessorStatic)
      && matches(currentDisposition, target.predecessorDisposition);
    let predecessorSourceContract;
    if (currentIsPredecessor) {
      predecessorSourceContract = exactSingleFramePredecessor(
        currentStatic.document,
        target,
      );
    } else {
      predecessorSourceContract = structuredClone(
        currentStatic.document?.generatedFrom?.sourceProvenReleaseContract,
      );
      invariant(predecessorSourceContract,
        `${target.animationId}: successor lost predecessor release lineage`);
    }
    const multiFrameExclusionIds = audit.candidateAudit.undeclaredTimelineIds.filter(
      (timelineId) => !target.selectedTimelineIds.includes(timelineId),
    );
    const staticDocument = buildStaticCompositeEvidenceDocument({
      animationId: target.animationId,
      manifest: audit.manifest,
      inventory: audit.inventory,
      inventorySha256: audit.inventoryRecord.sha256,
      sourceSwfBytes: audit.sourceRecord.contents,
      swfmillGzip: audit.swfmillRecord.contents,
      scriptsGzip: audit.scriptsRecord.contents,
      claimSpecs: [],
      singleFrameClaimSpec: {
        proofType: "single-frame-scriptless-structural-child",
        expectedTimelineCount: target.singleFrameTimelineIds.length,
        timelineIds: [...target.singleFrameTimelineIds],
      },
      multiFrameClaimSpec: nestedSpecs,
      multiFrameExclusionIds,
    });
    staticDocument.authorityStatement.push(
      "This successor uses the existing multi-frame parent-clock claim role only in nested-declared-parent-local-clock-only mode. The exact complete root path is bound while parentEntryStateEstablished remains false.",
      "The generic direct-root candidate audit remains fail-closed for these four pairs; only this exact hash-bound successor allowlist can apply the narrower parent-local-clock classification.",
    );
    staticDocument.generatedFrom.sourceProvenReleaseContract = predecessorSourceContract;
    staticDocument.generatedFrom.nestedDeclaredParentSuccessorBasis = {
      materializer: descriptor(scriptRecord),
      proofEngine: descriptor(proofEngineRecord),
      dispositionEngine: descriptor(dispositionEngineRecord),
      predecessorWave3Report: descriptor(predecessorReportRecord),
      selectedPairSet,
      memberPairSet: canonicalNestedParentPairSet(
        target.selectedTimelineIds.map(
          (timelineId) => ({animationId: target.animationId, timelineId}),
        ),
      ),
      successorRemainingPairSet,
      residualParentBlockerPairSet: residualParentPairSet,
      proofType: "multi-frame-scriptless-parent-clock-composite-child",
      parentBindingMode: NESTED_DECLARED_PARENT_BINDING_MODE,
      parentEntryStateEstablished: false,
      parentRootPath: target.parent.rootPath.map((edge) => ({...edge})),
      engineeringReviewOnly: true,
      authoritativeRuntimeEstablished: false,
      humanReviewer: false,
      ownerAcceptance: false,
      strictAcceptanceEffect: "none",
    };
    assertNestedParentAcceptanceNeutral(staticDocument,
      `${target.animationId}: static evidence`);
    const newClaims = staticDocument.claims.filter(
      ({timelineId}) => target.selectedTimelineIds.includes(timelineId),
    );
    invariant(
      newClaims.length === 2
        && newClaims.every((claim) => (
          claim.role === "multi-frame-scriptless-parent-clock-composite-child"
          && claim.parentBinding?.parentBindingMode
            === NESTED_DECLARED_PARENT_BINDING_MODE
          && claim.parentBinding?.parentEntryStateEstablished === false
          && claim.parentBinding?.rootPlacement === null
          && JSON.stringify(claim.parentBinding?.parentRootPath)
            === JSON.stringify(target.parent.rootPath)
          && Object.values(claim.preservedObligations || {}).every(
            ({satisfiedByDisposition}) => satisfiedByDisposition === false,
          )
        )),
      `${target.animationId}: exact two-claim successor drifted`,
    );
    const staticTarget = recordForRendered(staticRelative, staticDocument);
    staticTarget.expectedPreimage = expectedPreimage(currentStatic);
    const disposition = buildDispositionReport({
      animationId: target.animationId,
      inventory: audit.inventory,
      inventorySha256: audit.inventoryRecord.sha256,
      manifest: audit.manifest,
      manifestSha256: target.technicalManifestSha256,
      releaseBinding: binding,
      staticDispositionEvidence: staticDocument,
      staticDispositionEvidenceSha256: staticTarget.sha256,
      independentDispositionEvidence: null,
      independentDispositionEvidenceSha256: null,
    });
    disposition.authorityStatement.push(
      "The nested-declared-parent-local-clock-only successor changes only two exact child timelines from unresolved to composite-child-with-parent; parent runtime entry and all acceptance obligations remain unresolved.",
    );
    disposition.generatedFrom.sourceProvenIndependentDeclarationBasis =
      structuredClone(currentDisposition.document.generatedFrom?.sourceProvenIndependentDeclarationBasis);
    invariant(disposition.generatedFrom.sourceProvenIndependentDeclarationBasis,
      `${target.animationId}: declaration lineage is missing`);
    disposition.generatedFrom.nestedDeclaredParentSuccessorBasis = {
      predecessorWave3Report: descriptor(predecessorReportRecord),
      memberPairSet: staticDocument.generatedFrom.nestedDeclaredParentSuccessorBasis.memberPairSet,
      successorRemainingPairSet,
      staticCompositeEvidence: descriptor(staticTarget),
      parentBindingMode: NESTED_DECLARED_PARENT_BINDING_MODE,
      parentEntryStateEstablished: false,
      dispositionEffect: "two-unresolved-to-composite-child-with-parent-only",
      strictAcceptanceEffect: "none",
    };
    assertNestedParentAcceptanceNeutral(disposition,
      `${target.animationId}: disposition`);
    const counts = disposition.summary.dispositionCounts;
    invariant(
      counts["declared-frame-domain"] === target.afterCounts.declared
        && counts["composite-child-with-parent"] === target.afterCounts.composite
        && counts["independent-required"] === 0
        && counts.unresolved === target.afterCounts.unresolved,
      `${target.animationId}: target disposition totals drifted`,
    );
    const dispositionTarget = recordForRendered(dispositionRelative, disposition);
    dispositionTarget.expectedPreimage = expectedPreimage(currentDisposition);
    const currentIsSuccessor = matches(currentStatic, staticTarget)
      && matches(currentDisposition, dispositionTarget);
    invariant(currentIsPredecessor || currentIsSuccessor,
      `${target.animationId}: target is neither exact predecessor nor exact successor`);
    targetStates.push(currentIsPredecessor ? "wave3-predecessor" : "nested-parent-successor");
    targetEntries.push(staticTarget, dispositionTarget);
    targetDispositionById.set(target.animationId, disposition);
    targetMembers.push({
      animationId: target.animationId,
      ordinal: releaseById.get(target.animationId).ordinal,
      assetId: releaseById.get(target.animationId).assetId,
      source: {path: target.sourcePath, sha256: target.sourceSha256},
      parentDeclaration: {
        id: parentDomain.id,
        sourceTimelineId: parentDomain.sourceTimelineId,
        frameCount: parentDomain.frameCount,
        sourceProof: structuredClone(parentDomain.sourceProof),
      },
      exactSelectedPairSet:
        staticDocument.generatedFrom.nestedDeclaredParentSuccessorBasis.memberPairSet,
      parentBindingMode: NESTED_DECLARED_PARENT_BINDING_MODE,
      parentEntryStateEstablished: false,
      parentRootPath: target.parent.rootPath.map((edge) => ({...edge})),
      genericInspectionDisqualifiers: selectedInspections.map(({timelineId, disqualifiers}) => ({
        timelineId,
        disqualifiers: [...disqualifiers],
      })),
      predecessor: {
        staticCompositeEvidence: {
          path: staticRelative,
          ...target.predecessorStatic,
        },
        frameDomainDisposition: {
          path: dispositionRelative,
          ...target.predecessorDisposition,
        },
      },
      successor: {
        staticCompositeEvidence: descriptor(staticTarget),
        frameDomainDisposition: descriptor(dispositionTarget),
      },
      newCompositeClaims: newClaims.map((claim) => structuredClone(claim)),
    });
  }
  invariant(new Set(targetStates).size === 1,
    "target workspaces are in a mixed predecessor/successor state");
  const inputState = targetStates[0];

  const currentReports = [];
  const successorReports = [];
  const unchangedBindings = [];
  let exactNonTargetPredecessorCount = 0;
  for (const member of release.members) {
    const relative = `migrations/${member.animationId}/audit/frame-domain-disposition.json`;
    const record = await readJson(projectRoot, relative);
    currentReports.push(record.document);
    if (targetDispositionById.has(member.animationId)) {
      successorReports.push(targetDispositionById.get(member.animationId));
    } else {
      assertDescriptor(
        record,
        predecessorDispositionById.get(member.animationId),
        `${member.animationId}: immutable wave3 non-target disposition`,
      );
      exactNonTargetPredecessorCount += 1;
      successorReports.push(record.document);
      unchangedBindings.push(descriptor(record));
    }
  }
  invariant(exactNonTargetPredecessorCount === 45,
    "immutable wave3 non-target disposition coverage must be exactly 45/45");
  const currentTotals = dispositionTotals(currentReports);
  const successorTotals = dispositionTotals(successorReports);
  if (inputState === "wave3-predecessor") {
    assertNestedParentTransitionTotals(currentTotals, successorTotals);
  } else {
    invariant(JSON.stringify(currentTotals) === JSON.stringify(EXPECTED.after),
      "installed successor aggregate totals drifted");
    invariant(JSON.stringify(successorTotals) === JSON.stringify(EXPECTED.after),
      "rebuilt successor aggregate totals drifted");
  }

  const report = {
    schemaVersion: 1,
    reportType: "g4-l10-nested-declared-parent-static-composite-successor",
    releaseId: RELEASE_ID,
    generatedBy: {
      path: SCRIPT_RELATIVE,
      sha256: scriptRecord.sha256,
      deterministic: true,
      transactional: true,
      proofEngine: descriptor(proofEngineRecord),
      dispositionEngine: descriptor(dispositionEngineRecord),
    },
    generatedFrom: {
      immutableWave3Predecessor: descriptor(predecessorReportRecord),
      lessonReleaseCatalog: descriptor(catalogRecord),
      releaseFingerprintSha256: EXPECTED.releaseFingerprintSha256,
      orderedMemberIdentitySha256: EXPECTED.orderedMemberIdentitySha256,
    },
    proofContract: {
      retainedClaimRole: "multi-frame-scriptless-parent-clock-composite-child",
      parentBindingMode: NESTED_DECLARED_PARENT_BINDING_MODE,
      parentEntryStateEstablished: false,
      genericDirectRootAuditRemainsFailClosed: true,
      successorSelectionIsExactAllowlistOnly: true,
      rootPlacementNullAloneIsInsufficient: true,
    },
    exactPairSets: {
      predecessorRemaining: predecessorRemainingPairSet,
      selected: selectedPairSet,
      residualParentBlockers: residualParentPairSet,
      successorRemaining: successorRemainingPairSet,
    },
    summary: {
      releaseMembers: EXPECTED.releaseMembers,
      affectedMembers: TARGETS.length,
      newCompositeClaims: EXPECTED.selected.count,
      beforeDispositionTotals: EXPECTED.before,
      afterDispositionTotals: EXPECTED.after,
      remainingUnresolved: EXPECTED.successorRemaining.count,
      authoritativeRuntimeSessionsExecuted: 0,
      implementationFramesCaptured: 0,
      originalRuntimeFramesCaptured: 0,
      rmseComparisonsCompleted: 0,
      humanReviewsCompleted: 0,
      ownerReviewsCompleted: 0,
      strictCompletions: 0,
      publishedMembers: 0,
    },
    mutationScope: {
      exactTargetCount: 5,
      targetPaths: [
        ...targetEntries.map(({path: targetPath}) => targetPath),
        G4_L10_NESTED_PARENT_REPORT_RELATIVE,
      ],
      explicitlyNotRebuilt: [
        "migration manifests",
        "scenario inventories",
        "trace index",
        "trace specifications",
        "keyframes",
        "runtime plans",
        "renderers",
        "coverage",
        "strict-readiness",
        "reviews",
        "registries",
        "ledgers",
        "source assets",
      ],
    },
    downstreamBoundary: {
      dispositionTransitions: targetMembers.map((member) => ({
        animationId: member.animationId,
        predecessor: structuredClone(member.predecessor.frameDomainDisposition),
        successor: structuredClone(member.successor.frameDomainDisposition),
      })),
      staleArtifacts: [
        {
          artifactClass: "lesson-release-trace-index",
          path:
            "migrations/lesson-release-trace-spec-indexes/lesson-g04-l10-perimeter-area.json",
          stale: true,
          currentCheck: false,
          rebuildRequired: true,
        },
        {
          artifactClass: "member-trace-specifications",
          pathPrefixes: TARGETS.map(({animationId}) => (
            `migrations/${animationId}/audit/trace-specs/lesson-releases/${RELEASE_ID}/`
          )),
          stale: true,
          currentCheck: false,
          rebuildRequired: true,
        },
        {
          artifactClass: "member-keyframes",
          paths: TARGETS.map(({animationId}) => (
            `migrations/${animationId}/keyframes.csv`
          )),
          stale: true,
          currentCheck: false,
          rebuildRequired: true,
        },
        {
          artifactClass: "member-full-frame-coverage",
          paths: TARGETS.map(({animationId}) => (
            `migrations/${animationId}/evidence/full-frame-coverage.json`
          )),
          stale: true,
          currentCheck: false,
          rebuildRequired: true,
        },
        {
          artifactClass: "member-release-runtime-acquisition-plan",
          paths: TARGETS.map(({animationId}) => (
            `migrations/${animationId}/audit/machine/release-runtime-acquisition-plan.json`
          )),
          stale: true,
          currentCheck: false,
          rebuildRequired: true,
        },
      ],
      successorPolicy:
        "Every listed downstream artifact binds a predecessor TS007/TS008 frame-domain-disposition descriptor. It is stale with currentCheck=false after this transition and must be rebuilt by a later explicit successor transaction before it can be cited as current.",
      historicalPredecessorReports: [
        descriptor(predecessorReportRecord),
        structuredClone(
          predecessorReport.generatedFrom.immutableDeclarationReceipt,
        ),
        structuredClone(
          predecessorReport.generatedFrom.immutableWave2UnresolvedContract,
        ),
      ].map((reportDescriptor) => ({
        ...reportDescriptor,
        immutable: true,
        rewrittenByThisTransition: false,
      })),
      historicalPredecessorPolicy:
        "This transition is append-only. It creates one successor report and never regenerates, rewrites, deletes, or silently supersedes any historical predecessor receipt.",
    },
    members: targetMembers,
    unchangedDispositionBindings: unchangedBindings,
    acceptanceBoundary: {
      authoritativeRuntimeEstablished: false,
      behaviorEstablished: false,
      visualFidelityEstablished: false,
      audioEstablished: false,
      fullFrameRmseEstablished: false,
      humanReviewEstablished: false,
      ownerAcceptanceEstablished: false,
      strictCompletionEstablished: false,
      releasePublicationEstablished: false,
    },
    strictAcceptanceEffect:
      "none; four exact nested-parent local-clock composite classifications only; runtime entry, behavior, visual, audio, full-frame/RMSE, human, owner, strict-completion, release, and publication acceptance remain pending",
  };
  invariant(report.mutationScope.targetPaths.length === 5,
    "successor transaction must contain exactly five paths");
  const reportTarget = recordForRendered(G4_L10_NESTED_PARENT_REPORT_RELATIVE, report);
  const reportIsAbsent = currentSuccessorReport.exists === false;
  const reportIsExactSuccessor = matches(currentSuccessorReport, reportTarget);
  invariant(
    (inputState === "wave3-predecessor" && reportIsAbsent)
      || (inputState === "nested-parent-successor" && reportIsExactSuccessor),
    `${G4_L10_NESTED_PARENT_REPORT_RELATIVE}: append-only report must be absent at the predecessor or exact at the successor; foreign/nonexact content is never overwritten`,
  );
  reportTarget.expectedPreimage = expectedPreimage(currentSuccessorReport);
  targetEntries.push(reportTarget);
  return {inputState, report, reportTarget, targetEntries};
}

async function verifyTargetState(state, projectRoot) {
  for (const entry of state.targetEntries) {
    const current = await readOrdinary(projectRoot, entry.path);
    invariant(
      current.bytes === entry.bytes
        && current.sha256 === entry.sha256
        && current.contents.toString("utf8") === entry.rendered,
      `${entry.path}: checked-in nested-parent successor is stale`,
    );
  }
}

export async function materializeG4L10NestedDeclaredParentStaticComposites({
  mode = "dry-run",
  projectRoot: projectRootOption = PROJECT_ROOT,
  transactionHooks = {},
} = {}) {
  invariant(["dry-run", "apply", "check"].includes(mode), `unsupported mode: ${mode}`);
  const projectRoot = path.resolve(projectRootOption);
  const state = await buildState(projectRoot);
  if (mode === "dry-run") {
    return {
      action: state.inputState === "wave3-predecessor" ? "planned" : "verified-plan",
      inputState: state.inputState,
      report: state.report,
      reportRecord: descriptor(state.reportTarget),
      targetRecords: state.targetEntries.map(descriptor),
    };
  }
  if (mode === "check") {
    invariant(state.inputState === "nested-parent-successor",
      "successor verification requires both target workspaces to be exact successors");
  } else {
    const changedEntries = [];
    for (const entry of state.targetEntries) {
      const current = await readOrdinary(projectRoot, entry.path, {allowMissing: true});
      if (!matches(current, entry)) changedEntries.push(entry);
    }
    if (changedEntries.length) {
      await commitAtomicEntries(changedEntries, {
        projectRoot,
        hooks: {
          ...transactionHooks,
          afterStage: async (context) => {
            assertPreparedExpectedPreimages(context.entries);
            await transactionHooks.afterStage?.(context);
          },
        },
      });
    }
  }
  const successor = await buildState(projectRoot);
  invariant(successor.inputState === "nested-parent-successor",
    "nested-parent successor was not fully installed");
  await verifyTargetState(successor, projectRoot);
  return {
    action: mode === "check" ? "verified" : "written",
    inputState: successor.inputState,
    report: successor.report,
    reportRecord: descriptor(successor.reportTarget),
    targetRecords: successor.targetEntries.map(descriptor),
  };
}

export function parseArguments(argv) {
  const modes = argv.filter((argument) => ["--dry-run", "--apply", "--check"].includes(argument));
  const unknown = argv.filter(
    (argument) => !["--dry-run", "--apply", "--check", "--help", "-h"].includes(argument),
  );
  invariant(unknown.length === 0, `unknown argument(s): ${unknown.join(", ")}`);
  if (argv.includes("--help") || argv.includes("-h")) return {help: true, mode: ""};
  invariant(modes.length === 1, "choose exactly one of --dry-run, --apply, or --check");
  return {help: false, mode: modes[0].slice(2)};
}

function usage() {
  return `Usage: node ${SCRIPT_RELATIVE} --dry-run|--apply|--check

Builds the exact four-pair TS007/TS008 nested-declared-parent local-clock
successor. The generic direct-root audit remains fail-closed. Dry-run performs
all source, pair-set, graph, script, lifecycle, aggregate-total, and acceptance
checks without writing any migration, report, trace, keyframe, or cache file.
`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const result = await materializeG4L10NestedDeclaredParentStaticComposites({
    mode: options.mode,
  });
  process.stdout.write(`${result.action}: ${result.reportRecord.path} (${result.report.summary.newCompositeClaims} exact claims; ${result.report.summary.beforeDispositionTotals.composite}->${result.report.summary.afterDispositionTotals.composite} composite; ${result.report.summary.beforeDispositionTotals.unresolved}->${result.report.summary.afterDispositionTotals.unresolved} unresolved)\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
