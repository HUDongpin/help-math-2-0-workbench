#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

import {G4_L3_MEMBER_READINESS_IDS} from "./build-g4-l3-member-scenario-readiness.mjs";
import {
  deriveSingleFrameScriptlessEligibility,
  parseFfdecDispositionScripts,
  parseSwfmillDispositionStructure,
} from "./build-static-frame-domain-disposition-evidence.mjs";
import {TECHNICAL_MANIFEST_PROJECTION, technicalManifestSha256} from "./evidence-projections.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const OUTPUT_RELATIVE = "reports/g4-l3-single-frame-disposition-candidates.json";
const PROOF_ENGINE_RELATIVE = "scripts/build-static-frame-domain-disposition-evidence.mjs";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function compareTimelineIds(left, right) {
  return Number(left.split("-").at(-1)) - Number(right.split("-").at(-1)) || left.localeCompare(right);
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
    frameCount: inspection.inventoryTimeline.frameCount,
    eligible: inspection.eligible,
    disqualifiers: [...inspection.disqualifiers],
    sourceProof: {
      declaredFrameCount: inspection.timeline.declaredFrames,
      observedShowFrameCount: inspection.timeline.observedShowFrames,
      directDoActionTagCount: inspection.directDoActionTagCount,
      directDoInitActionTagCount: inspection.directDoInitActionTagCount,
      attributedDoInitActionCount: inspection.attributedDoInitActions.length,
      ffdecFrameScriptCount: inspection.ffdecFrameScripts.length,
      incomingPlacementCount: inspection.incomingResolved.length,
      outgoingPlacementCount: inspection.outgoingResolved.length,
      unresolvedOutgoingObjectCount: inspection.unresolvedOutgoingCount,
      clipActionCount: inspection.clipActionCount,
      declaredFrameDomainCount: inspection.declaredFrameDomains.length,
    },
  };
}

export function validateG4L3SingleFrameDispositionCandidates(document) {
  invariant(document.schemaVersion === 1, "candidate report schemaVersion must be 1");
  invariant(document.reportType === "g4-l3-single-frame-disposition-candidates", "candidate report type is invalid");
  invariant(document.generatedBy?.script === "scripts/build-g4-l3-single-frame-disposition-candidates.mjs", "candidate report generator is invalid");
  invariant(document.generatedBy?.proofEngine?.path === PROOF_ENGINE_RELATIVE && SHA256_PATTERN.test(document.generatedBy?.proofEngine?.sha256 || ""), "candidate report proof engine binding is invalid");
  invariant(document.scope?.memberCount === 37 && document.members.length === 37, "candidate report must cover 37 members");
  invariant(JSON.stringify(document.scope.memberIds) === JSON.stringify(G4_L3_MEMBER_READINESS_IDS), "candidate report member IDs drifted");
  invariant(document.acceptance?.acceptanceNeutral === true, "candidate report must remain acceptance-neutral");
  for (const key of ["runtimeReachabilityEstablished", "frameDomainDispositionEstablished", "strictMigrationComplete"]) {
    invariant(document.acceptance[key] === false, `candidate report ${key} must remain false`);
  }
  const allCandidates = document.members.flatMap((member) => member.eligibleCandidates.map((item) => ({member, item})));
  invariant(document.summary.eligibleCandidateCount === allCandidates.length, "candidate report eligible count drifted");
  invariant(document.summary.memberWithEligibleCandidatesCount === document.members.filter((member) => member.eligibleCandidates.length).length, "candidate report member count drifted");
  for (const {member, item} of allCandidates) {
    invariant(item.eligible === true && item.frameCount === 1, `${member.animationId}/${item.timelineId}: candidate is not a one-frame proof candidate`);
    invariant(item.disqualifiers.length === 0, `${member.animationId}/${item.timelineId}: eligible candidate has disqualifiers`);
    invariant(item.sourceProof.declaredFrameCount === 1 && item.sourceProof.observedShowFrameCount === 1, `${member.animationId}/${item.timelineId}: frame census is invalid`);
    for (const key of ["directDoActionTagCount", "directDoInitActionTagCount", "attributedDoInitActionCount", "ffdecFrameScriptCount", "unresolvedOutgoingObjectCount", "clipActionCount", "declaredFrameDomainCount"]) {
      invariant(item.sourceProof[key] === 0, `${member.animationId}/${item.timelineId}: ${key} must be zero`);
    }
    invariant(item.sourceProof.incomingPlacementCount > 0, `${member.animationId}/${item.timelineId}: incoming placement proof is missing`);
  }
  invariant(String(document.strictAcceptanceEffect || "").startsWith("none;"), "candidate report must have no strict acceptance effect");
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
  const {inspections, eligibleTimelineIds} = deriveSingleFrameScriptlessEligibility({animationId: id, structure, scripts, inventory, manifest});
  const reviewedInspections = [...inspections.values()]
    .map((inspection) => serializeInspection(inspection))
    .sort((left, right) => compareTimelineIds(left.timelineId, right.timelineId));
  const eligibleCandidates = reviewedInspections.filter((item) => item.eligible);
  invariant(JSON.stringify(eligibleCandidates.map((item) => item.timelineId)) === JSON.stringify(eligibleTimelineIds), `${id}: eligibility ordering drifted`);
  return {
    animationId: id,
    bindings: {
      sourceSwf: {path: sourceEvidence.path, sha256: sourceEvidence.sha256},
      migrationTechnicalProjectionSha256: manifestEvidence.sha256,
      scenarioInventory: {path: inventoryRecord.path, bytes: inventoryRecord.bytes, sha256: inventoryRecord.sha256},
      swfmill: {path: swfmillEvidence.path, sha256: swfmillEvidence.sha256, uncompressedSha256: swfmillEvidence.uncompressedSha256},
      ffdecScripts: {path: scriptsEvidence.path, sha256: scriptsEvidence.sha256, uncompressedSha256: scriptsEvidence.uncompressedSha256},
    },
    oneFrameReachableTimelineCount: reviewedInspections.length,
    eligibleCandidateCount: eligibleCandidates.length,
    eligibleCandidates,
    disqualifiedOneFrameTimelines: reviewedInspections.filter((item) => !item.eligible),
  };
}

export async function buildG4L3SingleFrameDispositionCandidates(options = {}) {
  const [generatorBytes, proofEngineBytes] = await Promise.all([
    readFile(scriptPath),
    readFile(path.join(projectRoot, PROOF_ENGINE_RELATIVE)),
  ]);
  const members = [];
  for (const id of G4_L3_MEMBER_READINESS_IDS) members.push(await buildMember(id));
  const document = {
    schemaVersion: 1,
    reportType: "g4-l3-single-frame-disposition-candidates",
    generatedBy: {
      script: "scripts/build-g4-l3-single-frame-disposition-candidates.mjs",
      version: 1,
      sha256: sha256(generatorBytes),
      deterministic: true,
      proofEngine: {
        path: PROOF_ENGINE_RELATIVE,
        sha256: sha256(proofEngineBytes),
      },
    },
    scope: {
      releaseId: "lesson-g04-l03-negative-numbers",
      memberCount: members.length,
      memberIds: [...G4_L3_MEMBER_READINESS_IDS],
      customMembersExcluded: ["course-g04-l03-in-009", "course-g04-l03-ts-006", "shell-course-g04-l03-index-local"],
    },
    summary: {
      memberWithEligibleCandidatesCount: members.filter((member) => member.eligibleCandidateCount > 0).length,
      eligibleCandidateCount: members.reduce((sum, member) => sum + member.eligibleCandidateCount, 0),
      inspectedOneFrameReachableTimelineCount: members.reduce((sum, member) => sum + member.oneFrameReachableTimelineCount, 0),
      disqualifiedOneFrameTimelineCount: members.reduce((sum, member) => sum + member.disqualifiedOneFrameTimelines.length, 0),
    },
    members,
    acceptance: {
      acceptanceNeutral: true,
      runtimeReachabilityEstablished: false,
      frameDomainDispositionEstablished: false,
      strictMigrationComplete: false,
    },
    limitations: [
      "Eligibility is a static independent-local-playhead proof candidate only; it does not itself change any timeline disposition.",
      "A separate explicit reviewed-selection artifact must pin the exact candidate IDs before workspace evidence may classify them as composite-child-with-parent.",
      "All visual, interaction, behavior, audio, full-frame/RMSE, human-review, and owner-acceptance obligations remain pending.",
    ],
    strictAcceptanceEffect: "none; this report only enumerates source-verified candidates for explicit engineering review",
  };
  validateG4L3SingleFrameDispositionCandidates(document);
  const rendered = `${JSON.stringify(document, null, 2)}\n`;
  const outputPath = path.join(projectRoot, OUTPUT_RELATIVE);
  if (options.check) {
    invariant(await exists(outputPath), "G4 L3 single-frame disposition candidate report is missing");
    invariant(await readFile(outputPath, "utf8") === rendered, "G4 L3 single-frame disposition candidate report is stale");
    return {action: "verified", output: OUTPUT_RELATIVE, document};
  }
  await writeFile(outputPath, rendered, "utf8");
  return {action: "written", output: OUTPUT_RELATIVE, document};
}

function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write("Usage: node scripts/build-g4-l3-single-frame-disposition-candidates.mjs [--check]\n");
  } else {
    const result = await buildG4L3SingleFrameDispositionCandidates(options);
    process.stdout.write(`${JSON.stringify({
      action: result.action,
      output: result.output,
      summary: result.document.summary,
      acceptanceEffect: "none",
    }, null, 2)}\n`);
  }
}
