#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

import {G4_L3_MEMBER_READINESS_IDS} from "./build-g4-l3-member-scenario-readiness.mjs";
import {
  buildStaticCompositeEvidenceDocument,
  deriveMultiFrameScriptlessCandidateAudit,
  parseFfdecDispositionScripts,
  parseSwfmillDispositionStructure,
} from "./build-static-frame-domain-disposition-evidence.mjs";
import {TECHNICAL_MANIFEST_PROJECTION, technicalManifestSha256} from "./evidence-projections.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const OUTPUT_RELATIVE = "reports/g4-l3-multi-frame-disposition-candidates.json";
const PROOF_ENGINE_RELATIVE = "scripts/build-static-frame-domain-disposition-evidence.mjs";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function exists(candidate) {
  try {
    await stat(candidate);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function readRecord(relativePath) {
  const bytes = await readFile(path.join(projectRoot, relativePath));
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes), document: JSON.parse(bytes.toString("utf8"))};
}

function requiredEvidence(inventory, artifactId) {
  const matches = inventory.evidenceIndex?.filter((item) => item.artifactId === artifactId) || [];
  invariant(matches.length === 1, `${inventory.animationId}: expected exactly one ${artifactId}`);
  invariant(SHA256_PATTERN.test(matches[0].sha256 || ""), `${inventory.animationId}: ${artifactId} SHA-256 is invalid`);
  return matches[0];
}

async function verifiedArtifactBytes(workspace, artifact, id) {
  const absolutePath = artifact.path.startsWith("source-assets/") || artifact.path.startsWith("migrations/")
    ? path.join(projectRoot, artifact.path)
    : path.join(workspace, artifact.path);
  const bytes = await readFile(absolutePath);
  invariant(sha256(bytes) === artifact.sha256, `${id}: ${artifact.artifactId} compressed/physical hash mismatch`);
  return bytes;
}

function serializeInspection(inspection) {
  return {
    timelineId: inspection.timelineId,
    sourceObjectId: inspection.sourceObjectId,
    frameCount: inspection.frameCount,
    parentTimelineId: inspection.parentTimelineId,
    parentFrameDomainId: inspection.parentFrameDomainId,
    incomingLifetimeCount: inspection.placements.length,
    internalDisplayEventCount: inspection.internalDisplayEventCount,
    ffdecFrameScriptCount: inspection.ffdecFrameScriptCount,
    attributedDoInitActionCount: inspection.attributedDoInitActionCount,
    namedIncomingInstances: inspection.namedIncomingInstances,
    eligible: inspection.eligible,
    disqualifiers: inspection.disqualifiers,
  };
}

export function validateG4L3MultiFrameDispositionCandidates(document) {
  invariant(document.schemaVersion === 1, "multi-frame candidate report schemaVersion must be 1");
  invariant(document.reportType === "g4-l3-multi-frame-disposition-candidates", "multi-frame candidate report type is invalid");
  invariant(document.generatedBy?.script === "scripts/build-g4-l3-multi-frame-disposition-candidates.mjs", "multi-frame candidate generator is invalid");
  invariant(document.generatedBy?.proofEngine?.path === PROOF_ENGINE_RELATIVE && SHA256_PATTERN.test(document.generatedBy?.proofEngine?.sha256 || ""), "multi-frame proof-engine binding is invalid");
  invariant(document.scope?.memberCount === 37 && document.members.length === 37, "multi-frame candidate report must cover 37 members");
  invariant(JSON.stringify(document.scope.memberIds) === JSON.stringify(G4_L3_MEMBER_READINESS_IDS), "multi-frame candidate member IDs drifted");
  invariant(document.acceptance?.acceptanceNeutral === true, "multi-frame candidate report must remain acceptance-neutral");
  for (const key of ["runtimeReachabilityEstablished", "frameDomainDispositionEstablished", "strictMigrationComplete"]) {
    invariant(document.acceptance[key] === false, `multi-frame candidate report ${key} must remain false`);
  }
  const totals = document.members.reduce((result, member) => {
    invariant(member.undeclaredReachableMultiFrameCount === member.eligibleCandidateCount + member.excludedCandidateCount, `${member.animationId}: multi-frame partition is incomplete`);
    invariant(member.candidateSpecs.reduce((sum, spec) => sum + spec.expectedTimelineCount, 0) === member.eligibleCandidateCount, `${member.animationId}: candidate spec count is stale`);
    invariant(member.eligibleCandidates.every((item) => item.eligible === true && item.disqualifiers.length === 0 && item.frameCount > 1), `${member.animationId}: eligible multi-frame candidate is weakened`);
    invariant(member.excludedCandidates.every((item) => item.eligible === false && item.disqualifiers.length > 0), `${member.animationId}: excluded multi-frame candidate lacks a reason`);
    if (member.eligibleCandidateCount > 0) invariant(SHA256_PATTERN.test(member.strongClaimSetSha256 || ""), `${member.animationId}: strong claim-set hash is missing`);
    return {
      undeclared: result.undeclared + member.undeclaredReachableMultiFrameCount,
      eligible: result.eligible + member.eligibleCandidateCount,
      excluded: result.excluded + member.excludedCandidateCount,
      groups: result.groups + member.candidateSpecs.length,
    };
  }, {undeclared: 0, eligible: 0, excluded: 0, groups: 0});
  invariant(document.summary.undeclaredReachableMultiFrameCount === totals.undeclared, "multi-frame total undeclared count drifted");
  invariant(document.summary.eligibleCandidateCount === totals.eligible, "multi-frame total eligible count drifted");
  invariant(document.summary.excludedCandidateCount === totals.excluded, "multi-frame total excluded count drifted");
  invariant(document.summary.parentClockGroupCount === totals.groups, "multi-frame parent group count drifted");
  invariant(String(document.strictAcceptanceEffect || "").startsWith("none;"), "multi-frame candidate report must have no strict acceptance effect");
  return true;
}

async function buildMember(id) {
  const workspace = path.join(projectRoot, "migrations", id);
  const [manifestRecord, inventoryRecord] = await Promise.all([
    readRecord(`migrations/${id}/migration.json`),
    readRecord(`migrations/${id}/audit/scenario-inventory.json`),
  ]);
  const manifest = manifestRecord.document;
  const inventory = inventoryRecord.document;
  invariant(manifest.animationId === id && inventory.animationId === id, `${id}: identity mismatch`);
  invariant(inventory.inventoryStatus === "static-exhaustive-runtime-unverified" && inventory.migrationStatusChanged === false, `${id}: scenario inventory authority drifted`);
  const manifestEvidence = requiredEvidence(inventory, "migration-technical-contract");
  invariant(manifestEvidence.projection === TECHNICAL_MANIFEST_PROJECTION.id && manifestEvidence.sha256 === technicalManifestSha256(manifest), `${id}: technical manifest projection is stale`);
  const sourceEvidence = requiredEvidence(inventory, "source-swf");
  const swfmillEvidence = requiredEvidence(inventory, "swfmill-xml");
  const scriptsEvidence = requiredEvidence(inventory, "ffdec-scripts");
  const [sourceBytes, swfmillGzip, scriptsGzip] = await Promise.all([
    verifiedArtifactBytes(workspace, sourceEvidence, id),
    verifiedArtifactBytes(workspace, swfmillEvidence, id),
    verifiedArtifactBytes(workspace, scriptsEvidence, id),
  ]);
  invariant(sha256(sourceBytes) === manifest.source.swfSha256, `${id}: physical source differs from manifest`);
  const swfmillXml = gunzipSync(swfmillGzip).toString("utf8");
  const scriptsText = gunzipSync(scriptsGzip).toString("utf8");
  invariant(sha256(swfmillXml) === swfmillEvidence.uncompressedSha256, `${id}: uncompressed swfmill hash mismatch`);
  invariant(sha256(scriptsText) === scriptsEvidence.uncompressedSha256, `${id}: uncompressed FFDec scripts hash mismatch`);
  const structure = parseSwfmillDispositionStructure(swfmillXml);
  const scripts = parseFfdecDispositionScripts(scriptsText);
  const audit = deriveMultiFrameScriptlessCandidateAudit({animationId: id, structure, scripts, inventory, manifest});
  const eligibleCandidates = audit.inspections.filter(({eligible}) => eligible).map(serializeInspection);
  const excludedCandidates = audit.inspections.filter(({eligible}) => !eligible).map(serializeInspection);
  let strongClaimSetSha256 = null;
  if (eligibleCandidates.length > 0) {
    const proof = buildStaticCompositeEvidenceDocument({
      animationId: id,
      manifest,
      inventory,
      inventorySha256: inventoryRecord.sha256,
      sourceSwfBytes: sourceBytes,
      swfmillGzip,
      scriptsGzip,
      claimSpecs: [],
      singleFrameClaimSpec: null,
      multiFrameClaimSpec: audit.candidateSpecs,
      multiFrameExclusionIds: audit.excludedTimelineIds,
      reviewedSingleFrameSelection: null,
    });
    invariant(proof.claims.length === eligibleCandidates.length, `${id}: strong multi-frame proof count differs from candidate audit`);
    strongClaimSetSha256 = sha256(JSON.stringify(proof.claims));
  }
  return {
    animationId: id,
    bindings: {
      sourceSwf: {path: sourceEvidence.path, sha256: sourceEvidence.sha256},
      migrationTechnicalProjectionSha256: manifestEvidence.sha256,
      scenarioInventory: {path: inventoryRecord.path, bytes: inventoryRecord.bytes, sha256: inventoryRecord.sha256},
      swfmill: {path: swfmillEvidence.path, sha256: swfmillEvidence.sha256, uncompressedSha256: swfmillEvidence.uncompressedSha256},
      ffdecScripts: {path: scriptsEvidence.path, sha256: scriptsEvidence.sha256, uncompressedSha256: scriptsEvidence.uncompressedSha256},
    },
    undeclaredReachableMultiFrameCount: audit.undeclaredTimelineIds.length,
    eligibleCandidateCount: eligibleCandidates.length,
    excludedCandidateCount: excludedCandidates.length,
    eligibleTimelineIds: audit.eligibleTimelineIds,
    excludedTimelineIds: audit.excludedTimelineIds,
    candidateSpecs: audit.candidateSpecs,
    eligibleCandidates,
    excludedCandidates,
    globalAudit: audit.globalAudit,
    strongClaimSetSha256,
  };
}

export async function buildG4L3MultiFrameDispositionCandidates(options = {}) {
  const [generatorBytes, proofEngineBytes] = await Promise.all([
    readFile(scriptPath),
    readFile(path.join(projectRoot, PROOF_ENGINE_RELATIVE)),
  ]);
  const members = [];
  for (const id of G4_L3_MEMBER_READINESS_IDS) members.push(await buildMember(id));
  const document = {
    schemaVersion: 1,
    reportType: "g4-l3-multi-frame-disposition-candidates",
    generatedBy: {
      script: "scripts/build-g4-l3-multi-frame-disposition-candidates.mjs",
      version: 1,
      sha256: sha256(generatorBytes),
      deterministic: true,
      proofEngine: {path: PROOF_ENGINE_RELATIVE, sha256: sha256(proofEngineBytes)},
    },
    scope: {
      releaseId: "lesson-g04-l03-negative-numbers",
      memberCount: members.length,
      memberIds: [...G4_L3_MEMBER_READINESS_IDS],
      customMembersExcluded: ["course-g04-l03-in-009", "course-g04-l03-ts-006", "shell-course-g04-l03-index-local"],
    },
    summary: {
      memberWithEligibleCandidatesCount: members.filter((member) => member.eligibleCandidateCount > 0).length,
      undeclaredReachableMultiFrameCount: members.reduce((sum, member) => sum + member.undeclaredReachableMultiFrameCount, 0),
      eligibleCandidateCount: members.reduce((sum, member) => sum + member.eligibleCandidateCount, 0),
      excludedCandidateCount: members.reduce((sum, member) => sum + member.excludedCandidateCount, 0),
      parentClockGroupCount: members.reduce((sum, member) => sum + member.candidateSpecs.length, 0),
    },
    members,
    acceptance: {
      acceptanceNeutral: true,
      runtimeReachabilityEstablished: false,
      frameDomainDispositionEstablished: false,
      strictMigrationComplete: false,
    },
    limitations: [
      "Eligibility is a static parent-clock proof candidate only; it does not itself change any timeline disposition.",
      "Every excluded timeline remains unresolved with explicit source-derived reasons, and a separate reviewed selection must pin both accepted and excluded sets before workspace evidence may change dispositions.",
      "All visual, interaction, behavior, audio, full-frame/RMSE, human-review, and owner-acceptance obligations remain pending."
    ],
    strictAcceptanceEffect: "none; this report only enumerates source-verified multi-frame candidates for explicit engineering review",
  };
  validateG4L3MultiFrameDispositionCandidates(document);
  const rendered = `${JSON.stringify(document, null, 2)}\n`;
  const outputPath = path.join(projectRoot, OUTPUT_RELATIVE);
  if (options.check) {
    invariant(await exists(outputPath), "G4 L3 multi-frame disposition candidate report is missing");
    invariant(await readFile(outputPath, "utf8") === rendered, "G4 L3 multi-frame disposition candidate report is stale");
    return {action: "verified", output: OUTPUT_RELATIVE, document};
  }
  await writeFile(outputPath, rendered, "utf8");
  return {action: "written", output: OUTPUT_RELATIVE, document};
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const check = process.argv.slice(2).includes("--check");
  const unknown = process.argv.slice(2).filter((argument) => argument !== "--check" && argument !== "--help" && argument !== "-h");
  if (unknown.length) throw new Error(`Unknown option(s): ${unknown.join(", ")}`);
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    process.stdout.write("Usage: node scripts/build-g4-l3-multi-frame-disposition-candidates.mjs [--check]\n");
  } else {
    const result = await buildG4L3MultiFrameDispositionCandidates({check});
    process.stdout.write(`${JSON.stringify({action: result.action, output: result.output, summary: result.document.summary, acceptanceEffect: "none"}, null, 2)}\n`);
  }
}
