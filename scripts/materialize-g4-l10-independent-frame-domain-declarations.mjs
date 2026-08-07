#!/usr/bin/env node

import {createHash, randomBytes} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {buildDispositionReport} from "./build-frame-domain-dispositions.mjs";
import {
  validateScenarioInventory,
} from "./build-course-scenario-inventories.mjs";
import {
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";
import {
  SOURCE_PROVEN_INDEPENDENT_PROOF_TYPE,
  canonicalIndependentPairSet,
  validateSourceProvenIndependentEvidenceDocument,
} from "./source-proven-independent-frame-domain-evidence.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SCRIPT_RELATIVE =
  "scripts/materialize-g4-l10-independent-frame-domain-declarations.mjs";
const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const RELEASE_CATALOG_RELATIVE = "catalog/lesson-releases.json";
const WAVE2_REPORT_RELATIVE =
  "reports/lesson-release-source-proven-independent-frame-domains/lesson-g04-l10-perimeter-area.json";
const WAVE2_REPORT_SHA256 =
  "91625576767071511bc6c65f56ee1fd7bbe428304e0604ef58e77944fa034ce2";
const PRE_TRANSITION_WAVE2_GENERATOR_SHA256 =
  "42f338579beb99f63cd6d7dbfc83457b1d47ec429b8a6e22815f35f04fe7c69c";
const WAVE2_GENERATOR_RELATIVE =
  "scripts/materialize-lesson-release-source-proven-frame-domain-dispositions.mjs";
const INDEPENDENT_PROOF_ENGINE_RELATIVE =
  "scripts/source-proven-independent-frame-domain-evidence.mjs";
const DECLARATION_REPORT_RELATIVE =
  "reports/g4-l10-independent-frame-domain-declarations.json";
export const INDEPENDENT_DOMAIN_SCENARIO_ID =
  "source-proven-independent-domain-entry-unresolved";
export const G4_L10_DECLARATION_REPORT_RELATIVE =
  DECLARATION_REPORT_RELATIVE;

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const EXPECTED = Object.freeze({
  releaseMembers: 47,
  affectedMembers: 40,
  declaredChildren: 213,
  declaredLocalFrames: 21734,
  directDoActions: 746,
  newLanguageRequirements: 426,
  before: Object.freeze({
    declared: 47,
    composite: 751,
    independentRequired: 213,
    unresolved: 77,
    nonvisual: 0,
    excludedNotProven: 210,
  }),
  after: Object.freeze({
    declared: 260,
    composite: 751,
    independentRequired: 0,
    unresolved: 77,
    nonvisual: 0,
    excludedNotProven: 210,
  }),
  acceptedPairSetSha256:
    "32bd3115ff796d2905eb8f83b9860717f9022b43d2295a1bba8ce1d2adbc4c1f",
  rejectedPairSetSha256:
    "e796abfd334b8c92971f26e7ff35e2706b88e382964221623c63636afcf5f76e",
  releaseCatalogSha256:
    "d518f812a19b6038e55bca337b7a4f4f96425dd5599f9d07c9f69c8a0a1ae1cf",
  releaseFingerprintSha256:
    "4b77aedf7dcb0aeb9e9a84b7eb97b89b7a0ff03200956a4a93d65f8f9de2b1fd",
  orderedMemberIdentitySha256:
    "b3950290c53c2d6f5f1bd40ce20deb1f1b954660b0868a3fa8dc3795ec5504fe",
});

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

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareTimelineIds(left, right) {
  const leftNumber = Number.parseInt(String(left).replace(/^sprite-/, ""), 10);
  const rightNumber = Number.parseInt(String(right).replace(/^sprite-/, ""), 10);
  return leftNumber - rightNumber || compareText(String(left), String(right));
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (
    !path.isAbsolute(relative)
    && relative !== ".."
    && !relative.startsWith(`..${path.sep}`)
  );
}

function resolveProjectPath(projectRoot, relativePath, label = relativePath) {
  invariant(
    typeof relativePath === "string"
      && relativePath.length > 0
      && !path.isAbsolute(relativePath)
      && !relativePath.includes("\\"),
    `${label}: path must be portable and project-relative`,
  );
  const absolutePath = path.resolve(projectRoot, relativePath);
  invariant(
    isWithin(projectRoot, absolutePath)
      && portable(path.relative(projectRoot, absolutePath)) === relativePath,
    `${label}: path escapes the project root or is not normalized`,
  );
  return absolutePath;
}

async function fileExists(candidate) {
  try {
    await lstat(candidate);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function readOrdinary(projectRoot, relativePath, {allowMissing = false} = {}) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath);
  let before;
  try {
    before = await lstat(absolutePath, {bigint: true});
  } catch (error) {
    if (allowMissing && error?.code === "ENOENT") {
      return {path: relativePath, absolutePath, exists: false, bytes: 0, sha256: null};
    }
    throw error;
  }
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${relativePath}: expected an ordinary single-link file`,
  );
  const [realRoot, realFile, bytes] = await Promise.all([
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
      && BigInt(bytes.length) === after.size,
    `${relativePath}: changed while it was read`,
  );
  return {
    path: relativePath,
    absolutePath,
    exists: true,
    contents: bytes,
    bytes: bytes.length,
    sha256: sha256(bytes),
    stat: before,
  };
}

async function readJson(projectRoot, relativePath, options) {
  const record = await readOrdinary(projectRoot, relativePath, options);
  if (!record.exists) return {...record, document: null};
  try {
    return {...record, document: JSON.parse(record.contents.toString("utf8"))};
  } catch (error) {
    throw new Error(`${relativePath}: invalid JSON (${error.message})`);
  }
}

function recordForRendered(relativePath, rendered) {
  const bytes = Buffer.from(rendered, "utf8");
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)};
}

function descriptor(record) {
  return {path: record.path, bytes: record.bytes, sha256: record.sha256};
}

function releaseFingerprint(release) {
  return sha256(Buffer.from(stableJson(release), "utf8"));
}

function orderedMemberIdentityFingerprint(release) {
  return sha256(Buffer.from(stableJson(release.members.map(
    ({ordinal, animationId, assetId}) => ({ordinal, animationId, assetId}),
  )), "utf8"));
}

function declarationScenario() {
  return {
    id: INDEPENDENT_DOMAIN_SCENARIO_ID,
    kind: "source-proven-structural-entry-runtime-unresolved",
    description:
      "The hash-bound source placement graph proves structural root reachability and the local-action proof requires a separate child frame domain. Natural runtime entry, exact parent/host state, ActionScript effects, interaction, language, audio, Replay, visual fidelity, and acceptance remain unresolved; this scenario invents no action or runtime fixture.",
    reachable: true,
    reachabilityAuthority: "structural-root-placement-graph-only",
    authoritativeRuntimeEntryEstablished: false,
    strictAcceptanceEffect: "none",
  };
}

export function buildIndependentFrameDomainDeclaration({
  claim,
  evidenceRecord,
  claimIndex,
}) {
  invariant(/^sprite-\d+$/.test(claim?.timelineId || ""), "claim timelineId is invalid");
  invariant(Number.isInteger(claim.frameCount) && claim.frameCount > 1, `${claim.timelineId}: frameCount is invalid`);
  invariant(claim.disposition === "independent-required", `${claim.timelineId}: claim disposition is invalid`);
  invariant(claim.role === SOURCE_PROVEN_INDEPENDENT_PROOF_TYPE, `${claim.timelineId}: proof type is invalid`);
  invariant(claim.claimScope === "separate-local-frame-action-domain-required", `${claim.timelineId}: claim scope is invalid`);
  const sourceProof = claim.sourceProof || {};
  invariant(
    sourceProof.exactDoActionToFfdecFrameScriptCount === true
      && sourceProof.exactDoActionToFfdecFrameSequence === true
      && sourceProof.swfmillDoActionFrameSequenceSha256
        === sourceProof.ffdecFrameScriptFrameSequenceSha256
      && JSON.stringify(sourceProof.swfmillDoActionFrames)
        === JSON.stringify(sourceProof.ffdecFrameScriptFrames),
    `${claim.timelineId}: local-action frame sequence is not exact`,
  );
  return {
    id: claim.timelineId,
    kind: "nested",
    sourceTimelineId: claim.timelineId,
    parentFrameDomainId: "root",
    frameCount: claim.frameCount,
    scenarioIds: [INDEPENDENT_DOMAIN_SCENARIO_ID],
    role:
      "source-proven independent local-action frame domain; conservative root capture envelope only; natural runtime entry, behavior, visual, audio, review, and acceptance remain unresolved",
    sourceParentTimelineIds: [...claim.parentTimelineIds],
    captureParentResolution:
      "root is the nearest universally declared containing capture domain; sourceParentTimelineIds preserve the exact direct source parents and parentEntryState remains unresolved",
    sourceProof: {
      path: evidenceRecord.path.replace(/^migrations\/[^/]+\//, ""),
      sha256: evidenceRecord.sha256,
      claimIndex,
      proofType: claim.role,
      claimScope: claim.claimScope,
      sourceObjectId: claim.sourceObjectId,
      directDoActionTagCount: sourceProof.directDoActionTagCount,
      ffdecFrameScriptCount: sourceProof.ffdecFrameScriptCount,
      actionFrameSequenceSha256:
        sourceProof.swfmillDoActionFrameSequenceSha256,
      actionFrameSequenceEncoding:
        sourceProof.localActionFrameSequenceEncoding,
      authoritativeRuntimeEntryEstablished: false,
      strictAcceptanceEffect: "none",
    },
  };
}

function withoutDeclarationFields(manifest) {
  const projection = structuredClone(manifest);
  projection.scenarios = (projection.scenarios || []).filter(
    ({id}) => id !== INDEPENDENT_DOMAIN_SCENARIO_ID,
  );
  projection.implementation.frameDomains = (
    projection.implementation.frameDomains || []
  ).filter(({id}) => id === "root");
  return projection;
}

export function assertAcceptanceNeutralManifestTransition(before, after) {
  invariant(
    JSON.stringify(withoutDeclarationFields(before))
      === JSON.stringify(withoutDeclarationFields(after)),
    `${before.animationId}: declaration changed a field outside scenarios/frameDomains`,
  );
  for (const key of [
    "status",
    "created",
    "confidence",
    "classification",
    "baseline",
    "evidence",
    "fidelity",
    "accessibility",
    "acceptance",
    "catalogEvidence",
  ]) {
    invariant(
      JSON.stringify(before[key]) === JSON.stringify(after[key]),
      `${before.animationId}: declaration changed acceptance-bearing ${key}`,
    );
  }
  return true;
}

function targetManifestFor(manifest, claims, evidenceRecord) {
  const scenario = declarationScenario();
  const claimIds = new Set(claims.map(({timelineId}) => timelineId));
  const existingClaimDomains = (manifest.implementation.frameDomains || [])
    .filter(({sourceTimelineId}) => claimIds.has(sourceTimelineId));
  const existingScenario = (manifest.scenarios || []).filter(
    ({id}) => id === INDEPENDENT_DOMAIN_SCENARIO_ID,
  );
  const pre = existingClaimDomains.length === 0 && existingScenario.length === 0;
  const target = structuredClone(manifest);
  const domains = claims.map((claim, claimIndex) =>
    buildIndependentFrameDomainDeclaration({
      claim,
      evidenceRecord,
      claimIndex,
    }));
  if (pre) {
    invariant(
      target.implementation.frameDomains?.length === 1
        && target.implementation.frameDomains[0].id === "root",
      `${manifest.animationId}: pre-transition manifest is not root-only`,
    );
    target.scenarios.push(scenario);
    target.implementation.frameDomains.push(...domains);
  } else {
    invariant(existingScenario.length === 1, `${manifest.animationId}: declaration scenario is partial or duplicated`);
    invariant(JSON.stringify(existingScenario[0]) === JSON.stringify(scenario), `${manifest.animationId}: declaration scenario drifted`);
    invariant(
      target.implementation.frameDomains.length === 1 + domains.length,
      `${manifest.animationId}: declared frame-domain count drifted`,
    );
    const domainById = new Map(target.implementation.frameDomains.map((domain) => [domain.id, domain]));
    for (const expected of domains) {
      invariant(
        JSON.stringify(domainById.get(expected.id)) === JSON.stringify(expected),
        `${manifest.animationId}/${expected.id}: declaration drifted`,
      );
    }
  }
  assertAcceptanceNeutralManifestTransition(manifest, target);
  return {target, inputState: pre ? "pre-transition" : "declared-successor"};
}

function targetInventoryFor(inventory, targetManifestTechnicalSha256) {
  const target = structuredClone(inventory);
  const matches = target.evidenceIndex.filter(
    ({artifactId}) => artifactId === "migration-technical-contract",
  );
  invariant(matches.length === 1, `${inventory.animationId}: migration technical evidence is not unique`);
  const [binding] = matches;
  invariant(
    binding.path === "migration.json"
      && binding.hashMode === "canonical-json-v1"
      && binding.projection === TECHNICAL_MANIFEST_PROJECTION.id
      && JSON.stringify(binding.excludedPaths)
        === JSON.stringify(TECHNICAL_MANIFEST_PROJECTION.excludedPaths),
    `${inventory.animationId}: migration technical evidence contract drifted`,
  );
  binding.sha256 = targetManifestTechnicalSha256;
  validateScenarioInventory(target);
  return target;
}

function targetStaticEvidenceFor(evidence, manifestSha256, inventoryRecord) {
  if (!evidence) return null;
  const target = structuredClone(evidence);
  invariant(
    target.schemaVersion === 2
      && target.evidenceType === "static-frame-domain-disposition-evidence"
      && target.status === "verified-static-composite-claims"
      && target.migrationStatusChanged === false
      && String(target.strictAcceptanceEffect || "").startsWith("none;"),
    `${target.animationId}: static composite evidence boundary drifted`,
  );
  target.generatedFrom.migrationManifest.sha256 = manifestSha256;
  target.generatedFrom.scenarioInventory.sha256 = inventoryRecord.sha256;
  return target;
}

function dispositionTotals(reports) {
  const totals = {
    declared: 0,
    composite: 0,
    independentRequired: 0,
    unresolved: 0,
    nonvisual: 0,
    excludedNotProven: 0,
  };
  for (const report of reports) {
    totals.declared += report.summary.dispositionCounts["declared-frame-domain"];
    totals.composite += report.summary.dispositionCounts["composite-child-with-parent"];
    totals.independentRequired += report.summary.dispositionCounts["independent-required"];
    totals.unresolved += report.summary.dispositionCounts.unresolved;
    totals.nonvisual += report.summary.dispositionCounts.nonvisual;
    totals.excludedNotProven += report.summary.excludedNotProvenTimelineCount;
  }
  return totals;
}

function assertTotals(actual, expected, label) {
  invariant(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`,
  );
}

function releaseBinding(catalogRecord, catalog, release) {
  return {
    releaseId: release.releaseId,
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

function validateWave2Evidence(document, record, member, wave2Record) {
  const generated = document.generatedFrom;
  validateSourceProvenIndependentEvidenceDocument(document, {
    animationId: member.animationId,
    sourceSwf: generated.sourceSwf,
    scenarioInventory: generated.scenarioInventory,
    migrationTechnicalProjection: generated.migrationTechnicalProjection,
    swfmillStructure: generated.swfmillStructure,
    ffdecScripts: generated.ffdecScripts,
  });
  invariant(
    generated.sourceProvenReleaseContract?.path === wave2Record.path
      && generated.sourceProvenReleaseContract.sha256 === wave2Record.sha256
      && generated.sourceProvenReleaseContract.bytes === wave2Record.bytes,
    `${member.animationId}: independent evidence does not bind the exact wave2 report`,
  );
  invariant(
    JSON.stringify(document.claims) === JSON.stringify(member.claims)
      && JSON.stringify(document.rejected) === JSON.stringify(member.rejected),
    `${member.animationId}: member wave2 evidence/report claims differ`,
  );
  invariant(
    document.exactPairSets.accepted.sha256
      === canonicalIndependentPairSet(document.claims.map(({timelineId}) => ({
        animationId: member.animationId,
        timelineId,
      }))).sha256,
    `${member.animationId}: independent member pair set drifted`,
  );
  return {document, record};
}

async function buildState(projectRoot) {
  const [
    scriptRecord,
    wave2Record,
    wave2GeneratorSuccessorRecord,
    proofEngineRecord,
    catalogRecord,
  ] = await Promise.all([
    readOrdinary(projectRoot, SCRIPT_RELATIVE),
    readJson(projectRoot, WAVE2_REPORT_RELATIVE),
    readOrdinary(projectRoot, WAVE2_GENERATOR_RELATIVE),
    readOrdinary(projectRoot, INDEPENDENT_PROOF_ENGINE_RELATIVE),
    readJson(projectRoot, RELEASE_CATALOG_RELATIVE),
  ]);
  invariant(wave2Record.sha256 === WAVE2_REPORT_SHA256, "hardened wave2 report SHA-256 drifted");
  invariant(catalogRecord.sha256 === EXPECTED.releaseCatalogSha256, "lesson-release catalog SHA-256 drifted");
  const wave2 = wave2Record.document;
  invariant(
    wave2.schemaVersion === 1
      && wave2.reportType === "lesson-release-source-proven-independent-frame-domain-contract"
      && wave2.releaseId === RELEASE_ID
      && wave2.generatedBy.script === WAVE2_GENERATOR_RELATIVE
      && wave2.generatedBy.sha256
        === PRE_TRANSITION_WAVE2_GENERATOR_SHA256
      && wave2.generatedBy.proofEngine.path === INDEPENDENT_PROOF_ENGINE_RELATIVE
      && wave2.generatedBy.proofEngine.sha256 === proofEngineRecord.sha256,
    "wave2 generator/proof identity drifted",
  );
  invariant(
    wave2.exactPairSets.accepted.count === EXPECTED.declaredChildren
      && wave2.exactPairSets.accepted.sha256 === EXPECTED.acceptedPairSetSha256
      && wave2.exactPairSets.rejected.count === EXPECTED.before.unresolved
      && wave2.exactPairSets.rejected.sha256 === EXPECTED.rejectedPairSetSha256,
    "wave2 accepted/rejected pair set drifted",
  );
  const catalog = catalogRecord.document;
  const releases = catalog.releases.filter(({releaseId}) => releaseId === RELEASE_ID);
  invariant(releases.length === 1, `${RELEASE_ID}: exact release is not unique`);
  const [release] = releases;
  invariant(
    release.members.length === EXPECTED.releaseMembers
      && releaseFingerprint(release) === EXPECTED.releaseFingerprintSha256
      && orderedMemberIdentityFingerprint(release)
        === EXPECTED.orderedMemberIdentitySha256,
    `${RELEASE_ID}: release identity drifted`,
  );
  const releaseById = new Map(release.members.map((member) => [member.animationId, member]));
  const affected = wave2.members.filter(({claims}) => claims.length > 0);
  invariant(affected.length === EXPECTED.affectedMembers, "affected member count drifted");
  const acceptedPairs = affected.flatMap((member) => member.claims.map(
    ({timelineId}) => ({animationId: member.animationId, timelineId}),
  ));
  invariant(
    canonicalIndependentPairSet(acceptedPairs).sha256
      === EXPECTED.acceptedPairSetSha256,
    "accepted pair-set derivation drifted",
  );
  const targetEntries = [];
  const memberStates = [];
  const allDispositionReports = [];
  const affectedIds = new Set(affected.map(({animationId}) => animationId));
  const binding = releaseBinding(catalogRecord, catalog, release);
  let declarationFrames = 0;
  let doActionCount = 0;
  const inputStates = new Set();

  for (const waveMember of affected) {
    const id = waveMember.animationId;
    const releaseMember = releaseById.get(id);
    invariant(releaseMember, `${id}: release member is missing`);
    const base = `migrations/${id}`;
    const manifestRelative = `${base}/migration.json`;
    const inventoryRelative = `${base}/audit/scenario-inventory.json`;
    const dispositionRelative = `${base}/audit/frame-domain-disposition.json`;
    const staticRelative = `${base}/audit/static-frame-domain-disposition-evidence.json`;
    const independentRelative = `${base}/audit/source-proven-independent-frame-domain-evidence.json`;
    const [manifestRecord, inventoryRecord, dispositionRecord, staticRecord, independentRecord] = await Promise.all([
      readJson(projectRoot, manifestRelative),
      readJson(projectRoot, inventoryRelative),
      readJson(projectRoot, dispositionRelative),
      readJson(projectRoot, staticRelative, {allowMissing: true}),
      readJson(projectRoot, independentRelative),
    ]);
    invariant(
      manifestRecord.document.animationId === id
        && inventoryRecord.document.animationId === id
        && dispositionRecord.document.animationId === id
        && manifestRecord.document.assetId === releaseMember.assetId,
      `${id}: workspace/release identity drifted`,
    );
    validateWave2Evidence(
      independentRecord.document,
      independentRecord,
      waveMember,
      wave2Record,
    );
    const {target: manifest, inputState} = targetManifestFor(
      manifestRecord.document,
      waveMember.claims,
      independentRecord,
    );
    inputStates.add(inputState);
    const manifestRendered = pretty(manifest);
    const manifestTarget = {
      ...recordForRendered(manifestRelative, manifestRendered),
      rendered: manifestRendered,
      document: manifest,
    };
    const manifestTechnicalSha256 = technicalManifestSha256(manifest);
    const inventory = targetInventoryFor(
      inventoryRecord.document,
      manifestTechnicalSha256,
    );
    const inventoryRendered = pretty(inventory);
    const inventoryTarget = {
      ...recordForRendered(inventoryRelative, inventoryRendered),
      rendered: inventoryRendered,
      document: inventory,
    };
    const staticEvidence = targetStaticEvidenceFor(
      staticRecord.document,
      manifestTechnicalSha256,
      inventoryTarget,
    );
    const staticTarget = staticEvidence ? {
      ...recordForRendered(staticRelative, pretty(staticEvidence)),
      rendered: pretty(staticEvidence),
      document: staticEvidence,
    } : null;
    const disposition = buildDispositionReport({
      animationId: id,
      inventory,
      inventorySha256: inventoryTarget.sha256,
      manifest,
      manifestSha256: manifestTechnicalSha256,
      releaseBinding: binding,
      staticDispositionEvidence: staticEvidence,
      staticDispositionEvidenceSha256: staticTarget?.sha256 || null,
      independentDispositionEvidence: null,
      independentDispositionEvidenceSha256: null,
    });
    disposition.authorityStatement.push(
      "The declared nested domains are justified by the exact pre-transition source-proven independent-domain evidence named in generatedFrom.sourceProvenIndependentDeclarationBasis; declaration satisfies only the missing-domain planning obligation and does not establish runtime entry or acceptance.",
    );
    disposition.generatedFrom.sourceProvenIndependentDeclarationBasis = {
      wave2Report: descriptor(wave2Record),
      memberEvidence: descriptor(independentRecord),
      acceptedPairSet: independentRecord.document.exactPairSets.accepted,
      claimCount: waveMember.claims.length,
      declarationEffect: "declared-frame-domain-only",
      strictAcceptanceEffect: "none",
    };
    const dispositionRendered = pretty(disposition);
    const dispositionTarget = {
      ...recordForRendered(dispositionRelative, dispositionRendered),
      rendered: dispositionRendered,
      document: disposition,
    };
    const domains = manifest.implementation.frameDomains.filter(
      ({id: domainId}) => domainId !== "root",
    );
    declarationFrames += domains.reduce((sum, {frameCount}) => sum + frameCount, 0);
    doActionCount += waveMember.claims.reduce(
      (sum, claim) => sum + claim.sourceProof.directDoActionTagCount,
      0,
    );
    memberStates.push({
      animationId: id,
      ordinal: releaseMember.ordinal,
      assetId: releaseMember.assetId,
      preTransitionProof: {
        migrationTechnicalProjectionSha256:
          independentRecord.document.generatedFrom.migrationTechnicalProjection.sha256,
        scenarioInventorySha256:
          independentRecord.document.generatedFrom.scenarioInventory.sha256,
        independentEvidence: descriptor(independentRecord),
        acceptedPairSet: independentRecord.document.exactPairSets.accepted,
      },
      declaration: {
        scenarioId: INDEPENDENT_DOMAIN_SCENARIO_ID,
        frameDomainCount: domains.length,
        localFrameCount: domains.reduce((sum, {frameCount}) => sum + frameCount, 0),
        directDoActionCount: waveMember.claims.reduce(
          (sum, claim) => sum + claim.sourceProof.directDoActionTagCount,
          0,
        ),
        domains,
      },
      successor: {
        migrationJson: {
          ...descriptor(manifestTarget),
          technicalProjectionSha256: manifestTechnicalSha256,
        },
        scenarioInventory: descriptor(inventoryTarget),
        staticCompositeEvidence: staticTarget ? descriptor(staticTarget) : null,
        frameDomainDisposition: descriptor(dispositionTarget),
      },
    });
    targetEntries.push(manifestTarget, inventoryTarget);
    if (staticTarget) targetEntries.push(staticTarget);
    targetEntries.push(dispositionTarget);
    allDispositionReports.push(disposition);
  }
  invariant(inputStates.size === 1, "declaration workspaces are in a mixed pre/successor state");
  invariant(declarationFrames === EXPECTED.declaredLocalFrames, "declared local-frame count drifted");
  invariant(doActionCount === EXPECTED.directDoActions, "declared DoAction count drifted");

  for (const member of release.members) {
    if (affectedIds.has(member.animationId)) continue;
    const report = await readJson(
      projectRoot,
      `migrations/${member.animationId}/audit/frame-domain-disposition.json`,
    );
    allDispositionReports.push(report.document);
  }
  assertTotals(
    dispositionTotals(allDispositionReports),
    EXPECTED.after,
    "post-declaration disposition totals",
  );

  const report = {
    schemaVersion: 1,
    reportType: "g4-l10-source-proven-independent-frame-domain-declarations",
    releaseId: RELEASE_ID,
    generatedBy: {
      path: SCRIPT_RELATIVE,
      sha256: scriptRecord.sha256,
      deterministic: true,
      transactional: true,
    },
    generatedFrom: {
      wave2IndependentRequirementContract: descriptor(wave2Record),
      wave2GeneratorPreTransition: {
        path: wave2.generatedBy.script,
        sha256: wave2.generatedBy.sha256,
        binding:
          "generator hash declared inside the exact immutable wave2 report; the current physical path is the successor-aware wrapper recorded separately",
      },
      wave2GeneratorSuccessorWrapper:
        descriptor(wave2GeneratorSuccessorRecord),
      independentProofEngine: descriptor(proofEngineRecord),
      lessonReleaseCatalog: descriptor(catalogRecord),
      releaseFingerprintSha256: EXPECTED.releaseFingerprintSha256,
      orderedMemberIdentitySha256: EXPECTED.orderedMemberIdentitySha256,
    },
    declarationPolicy: {
      exactInput:
        "Every and only exact wave2 accepted pair is declared. The proof requires matching ordered, multiplicity-preserving one-indexed swfmill DoAction and FFDec local frame-script sequences.",
      domainShape:
        "Each accepted source timeline becomes one nested frame domain whose id/sourceTimelineId are the exact sprite ID, whose frameCount is source-bound, and whose sole scenario is the shared entry-unresolved scenario.",
      parentPolicy:
        "parentFrameDomainId is conservatively root for the capture envelope. Exact direct source parents remain in sourceParentTimelineIds; no parent entry frame, host state, or runtime action is invented.",
      scenarioPolicy:
        "The shared scenario records structural root reachability only. Natural runtime entry, ActionScript effects, interaction, localization, audio, Replay, visual comparison, and acceptance remain unresolved.",
      proofLineage:
        "The wave2 report and all 40 per-member source-proven independent evidence files remain byte-preserved and are hash-bound here and from each declared domain.",
    },
    exactPairSet: wave2.exactPairSets.accepted,
    summary: {
      releaseMembers: EXPECTED.releaseMembers,
      affectedMembers: EXPECTED.affectedMembers,
      declarationScenariosAdded: EXPECTED.affectedMembers,
      childFrameDomainsDeclared: EXPECTED.declaredChildren,
      declaredLocalFrames: declarationFrames,
      matchedDirectDoActionFrames: doActionCount,
      actionFrameSequenceMismatchCount: 0,
      newlyEnumeratedEnEsCoverageRequirements:
        EXPECTED.newLanguageRequirements,
      beforeDispositionTotals: EXPECTED.before,
      afterDispositionTotals: EXPECTED.after,
      authoritativeRuntimeSessionsExecuted: 0,
      implementationFramesCaptured: 0,
      originalRuntimeFramesCaptured: 0,
      rmseComparisonsCompleted: 0,
      strictCompletions: 0,
      publishedMembers: 0,
    },
    members: memberStates,
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
      "none; exact source-proven independent child timelines are declared for downstream coverage planning while every runtime, behavior, visual, audio, comparison, human, owner, strict-completion, release, and publication gate remains pending",
  };
  const reportRendered = pretty(report);
  const reportTarget = {
    ...recordForRendered(DECLARATION_REPORT_RELATIVE, reportRendered),
    rendered: reportRendered,
    document: report,
  };
  targetEntries.push(reportTarget);
  return {
    inputState: [...inputStates][0],
    report,
    reportTarget,
    targetEntries,
  };
}

async function assertInputPreimages(entries, projectRoot) {
  for (const entry of entries) {
    const current = await readOrdinary(projectRoot, entry.path, {allowMissing: true});
    const expected = entry.preimage;
    invariant(current.exists === expected.exists, `${entry.path}: existence changed after preflight`);
    if (current.exists) {
      invariant(
        current.bytes === expected.bytes && current.sha256 === expected.sha256,
        `${entry.path}: changed after preflight`,
      );
    }
  }
}

export async function commitAtomicEntries(entries, {
  projectRoot,
  hooks = {},
} = {}) {
  invariant(Array.isArray(entries) && entries.length > 0, "transaction has no entries");
  invariant(projectRoot, "transaction projectRoot is required");
  const transactionId = `${process.pid}-${randomBytes(12).toString("hex")}`;
  const prepared = [];
  try {
    for (const entry of entries) {
      const absolutePath = resolveProjectPath(projectRoot, entry.path);
      await mkdir(path.dirname(absolutePath), {recursive: true});
      const realRoot = await realpath(projectRoot);
      const realParent = await realpath(path.dirname(absolutePath));
      invariant(isWithin(realRoot, realParent), `${entry.path}: parent escapes project root`);
      const preimage = await readOrdinary(projectRoot, entry.path, {allowMissing: true});
      const stagePath = path.join(
        path.dirname(absolutePath),
        `.${path.basename(absolutePath)}.${transactionId}.stage`,
      );
      const backupPath = path.join(
        path.dirname(absolutePath),
        `.${path.basename(absolutePath)}.${transactionId}.backup`,
      );
      await writeFile(stagePath, entry.rendered, {encoding: "utf8", flag: "wx", mode: 0o644});
      const staged = await readFile(stagePath);
      invariant(
        staged.length === entry.bytes && sha256(staged) === entry.sha256,
        `${entry.path}: staged replacement identity mismatch`,
      );
      prepared.push({...entry, absolutePath, stagePath, backupPath, preimage, phase: "staged"});
    }
    await hooks.afterStage?.({entries: prepared});
    await assertInputPreimages(prepared, projectRoot);
    for (const [index, entry] of prepared.entries()) {
      if (entry.preimage.exists) {
        await rename(entry.absolutePath, entry.backupPath);
        entry.phase = "original-moved";
      }
      await rename(entry.stagePath, entry.absolutePath);
      entry.phase = "installed";
      await hooks.afterInstall?.({entry, index, entries: prepared});
    }
    for (const entry of prepared) {
      const installed = await readOrdinary(projectRoot, entry.path);
      invariant(
        installed.bytes === entry.bytes && installed.sha256 === entry.sha256,
        `${entry.path}: installed replacement identity mismatch`,
      );
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const entry of [...prepared].reverse()) {
      try {
        if (entry.phase === "installed") {
          await unlink(entry.absolutePath);
          if (entry.preimage.exists) await rename(entry.backupPath, entry.absolutePath);
        } else if (entry.phase === "original-moved") {
          await rename(entry.backupPath, entry.absolutePath);
        }
        await unlink(entry.stagePath).catch((cleanupError) => {
          if (cleanupError?.code !== "ENOENT") throw cleanupError;
        });
        await unlink(entry.backupPath).catch((cleanupError) => {
          if (cleanupError?.code !== "ENOENT") throw cleanupError;
        });
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        `declaration transaction failed and ${rollbackErrors.length} rollback action(s) failed`,
      );
    }
    throw error;
  }
  const cleanupErrors = [];
  for (const entry of prepared) {
    for (const candidate of [entry.stagePath, entry.backupPath]) {
      try {
        await unlink(candidate);
      } catch (error) {
        if (error?.code !== "ENOENT") cleanupErrors.push(error);
      }
    }
  }
  if (cleanupErrors.length) {
    throw new AggregateError(
      cleanupErrors,
      `declaration transaction committed but ${cleanupErrors.length} cleanup action(s) failed`,
    );
  }
}

async function verifyTargetState(state, projectRoot) {
  for (const entry of state.targetEntries) {
    const current = await readOrdinary(projectRoot, entry.path);
    invariant(
      current.bytes === entry.bytes && current.sha256 === entry.sha256
        && current.contents.toString("utf8") === entry.rendered,
      `${entry.path}: checked-in successor is stale`,
    );
  }
}

export async function materializeG4L10IndependentFrameDomainDeclarations({
  mode = "dry-run",
  projectRoot: projectRootOption = PROJECT_ROOT,
  transactionHooks = {},
} = {}) {
  invariant(["dry-run", "apply", "check"].includes(mode), `unsupported mode: ${mode}`);
  const projectRoot = path.resolve(projectRootOption);
  const state = await buildState(projectRoot);
  if (mode === "dry-run") {
    return {
      action: state.inputState === "pre-transition" ? "planned" : "verified-plan",
      inputState: state.inputState,
      report: state.report,
      reportRecord: descriptor(state.reportTarget),
    };
  }
  if (mode === "apply") {
    const changedEntries = [];
    for (const entry of state.targetEntries) {
      const current = await readOrdinary(projectRoot, entry.path, {
        allowMissing: true,
      });
      if (
        !current.exists
        || current.bytes !== entry.bytes
        || current.sha256 !== entry.sha256
      ) changedEntries.push(entry);
    }
    if (changedEntries.length) {
      await commitAtomicEntries(changedEntries, {
        projectRoot,
        hooks: transactionHooks,
      });
    }
  } else {
    invariant(
      state.inputState === "declared-successor",
      "successor verification requires every affected manifest to be declared",
    );
  }
  const successor = await buildState(projectRoot);
  invariant(successor.inputState === "declared-successor", "declaration successor state was not installed");
  await verifyTargetState(successor, projectRoot);
  return {
    action: mode === "check" ? "verified" : "written",
    inputState: successor.inputState,
    report: successor.report,
    reportRecord: descriptor(successor.reportTarget),
  };
}

export function parseArguments(argv) {
  const modes = argv.filter((argument) => ["--dry-run", "--apply", "--check"].includes(argument));
  const unknown = argv.filter((argument) => !["--dry-run", "--apply", "--check", "--help", "-h"].includes(argument));
  invariant(unknown.length === 0, `Unknown option: ${unknown[0]}`);
  const help = argv.includes("--help") || argv.includes("-h");
  if (help) {
    invariant(argv.length === 1, "--help must be used alone");
    return {help: true, mode: ""};
  }
  invariant(modes.length === 1, "choose exactly one of --dry-run, --apply, or --check");
  return {help: false, mode: modes[0].slice(2)};
}

function usage() {
  return `Usage: node ${SCRIPT_RELATIVE} --dry-run|--apply|--check

Consumes the exact hardened L10 wave2 source-proof contract, declares only its
213 accepted independent child timelines in the 40 affected migration
manifests, rebinds only their scenario inventories/static-composite evidence,
and atomically rebuilds their frame-domain dispositions plus one successor
receipt. It does not write coverage, traces, keyframes, runtime plans,
renderers, reviews, ledgers, status, acceptance, release, or publication.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = await materializeG4L10IndependentFrameDomainDeclarations({
    mode: options.mode,
  });
  process.stdout.write(`${JSON.stringify({
    action: result.action,
    inputState: result.inputState,
    report: result.reportRecord,
    summary: result.report.summary,
    exactPairSet: result.report.exactPairSet,
    acceptanceEffect: "none",
  }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
