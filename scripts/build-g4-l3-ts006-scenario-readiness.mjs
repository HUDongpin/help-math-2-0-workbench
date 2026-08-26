#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const ANIMATION_ID = "course-g04-l03-ts-006";
const WORKSPACE_RELATIVE = `migrations/${ANIMATION_ID}`;
const OUTPUT_RELATIVE = `${WORKSPACE_RELATIVE}/audit/strict-readiness.json`;
const MACHINE_REPORT_RELATIVE = `${WORKSPACE_RELATIVE}/audit/machine/report.json`;
const SOURCE_AUDIT_RELATIVE = `${WORKSPACE_RELATIVE}/audit/machine/g4-l3-source-audit.json`;
const PROTOCOL_RELATIVE = "reports/g4-l3-ts006-original-runtime-session-protocol-draft.json";
const SESSION_READINESS_RELATIVE = "reports/g4-l3-first-original-runtime-session-readiness.json";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function portable(value) {
  return value.split(path.sep).join("/");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

async function readRecord(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  const bytes = await readFile(absolutePath);
  return {
    path: relativePath,
    absolutePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    document: JSON.parse(bytes.toString("utf8")),
  };
}

async function verifyMachineOutput(workspace, output) {
  invariant(output?.path?.startsWith("audit/machine/"), `unsupported TS006 machine output path: ${output?.path || "missing"}`);
  invariant(SHA256_PATTERN.test(output.sha256 || ""), `invalid TS006 machine output SHA-256: ${output.path}`);
  const absolutePath = path.join(workspace, output.path);
  const bytes = await readFile(absolutePath);
  invariant(sha256(bytes) === output.sha256, `TS006 machine output hash mismatch: ${output.path}`);
  invariant(bytes.length === output.bytes, `TS006 machine output byte count mismatch: ${output.path}`);
  return {path: output.path, bytes: output.bytes, sha256: output.sha256};
}

export function validateTs006ScenarioReadiness(document) {
  invariant(document.schemaVersion === 2, "TS006 scenario readiness schemaVersion must be 2");
  invariant(document.evidenceKind === "course-shell-strict-readiness", "TS006 scenario readiness evidenceKind is invalid");
  invariant(document.animationId === ANIMATION_ID, "TS006 scenario readiness animationId is invalid");
  invariant(document.migrationStatusChanged === false, "TS006 scenario readiness may not change migration status");
  for (const key of [
    "strictAcceptanceReady",
    "completionClaimAllowed",
    "localAuthoritativeBaselineCompletable",
    "localExhaustiveBranchCaptureCompletable",
  ]) invariant(document.conclusion?.[key] === false, `TS006 scenario readiness ${key} must remain false`);
  invariant(document.conclusion?.risk === "high", "TS006 scenario readiness risk must remain high");
  invariant(Array.isArray(document.machineAudit?.observedBehaviorFromExtractedScripts) && document.machineAudit.observedBehaviorFromExtractedScripts.length >= 3, "TS006 scenario readiness needs source-observed behavior statements");
  invariant(Array.isArray(document.branchCaptureReadiness?.requiredScenarioInventory) && document.branchCaptureReadiness.requiredScenarioInventory.length >= 6, "TS006 scenario readiness needs conservative scenario requirements");
  invariant(document.branchCaptureReadiness?.status === "partial-reference-only", "TS006 scenario readiness branch status must remain partial-reference-only");
  invariant(Array.isArray(document.branchCaptureReadiness?.missing) && document.branchCaptureReadiness.missing.length >= 5, "TS006 scenario readiness must retain explicit missing evidence");
  invariant(document.branchCaptureReadiness?.authoritativeScheduleEstablished === false, "TS006 authoritative schedule must remain unestablished");
  invariant(document.branchCaptureReadiness?.runtimeSessionsExecuted === 0, "TS006 runtime session count must remain zero");
  for (const key of [
    "authoritativeOriginalRuntimeAccepted",
    "audioAccepted",
    "humanVisualAccepted",
    "ownerAccepted",
    "strictMigrationComplete",
  ]) invariant(document.acceptance?.[key] === false, `TS006 scenario readiness ${key} must remain false`);
  invariant(String(document.strictAcceptanceEffect || "").startsWith("none;"), "TS006 scenario readiness must have no strict acceptance effect");
  invariant(Array.isArray(document.evidence) && document.evidence.length >= 8, "TS006 scenario readiness evidence index is incomplete");
  invariant(document.evidence.every((entry) => entry.path && SHA256_PATTERN.test(entry.sha256 || "")), "TS006 scenario readiness evidence entries require paths and SHA-256");
  return true;
}

export async function buildTs006ScenarioReadiness(options = {}) {
  const workspace = path.join(projectRoot, WORKSPACE_RELATIVE);
  const [manifestRecord, machineRecord, sourceAuditRecord, protocolRecord, sessionReadinessRecord, generatorBytes] = await Promise.all([
    readRecord(`${WORKSPACE_RELATIVE}/migration.json`),
    readRecord(MACHINE_REPORT_RELATIVE),
    readRecord(SOURCE_AUDIT_RELATIVE),
    readRecord(PROTOCOL_RELATIVE),
    readRecord(SESSION_READINESS_RELATIVE),
    readFile(scriptPath),
  ]);
  const manifest = manifestRecord.document;
  const machine = machineRecord.document;
  const sourceAudit = sourceAuditRecord.document;
  const protocol = protocolRecord.document;
  const sessionReadiness = sessionReadinessRecord.document;

  invariant(manifest.animationId === ANIMATION_ID, "TS006 migration manifest identity mismatch");
  invariant(machine.animationId === ANIMATION_ID && machine.auditStatus === "partial", "TS006 standard machine report identity/status mismatch");
  invariant(machine.migrationStatusUnchanged === true, "TS006 standard machine report changed migration status");
  invariant(machine.source?.path === manifest.source.swf && machine.source?.expectedSha256 === manifest.source.swfSha256, "TS006 machine report source binding mismatch");
  invariant(machine.source?.observedSha256Before === manifest.source.swfSha256 && machine.source?.observedSha256After === manifest.source.swfSha256 && machine.source?.hashMatches === true, "TS006 machine report did not preserve the SWF");
  invariant(machine.authoringSource?.path === manifest.source.fla && machine.authoringSource?.expectedSha256 === manifest.source.flaSha256 && machine.authoringSource?.hashMatches === true, "TS006 machine report FLA binding mismatch");
  invariant(machine.authoringSource?.inspectionStatus === "not-performed-by-this-script", "TS006 machine audit must not claim FLA authoring inspection");
  invariant(machine.findings?.runtimeCrossCheck?.allMatch === true, "TS006 machine runtime cross-check failed");
  invariant(machine.findings?.ffdecHeader?.widthPx === 800 && machine.findings?.ffdecHeader?.heightPx === 600 && machine.findings?.ffdecHeader?.frameRate === 12 && machine.findings?.ffdecHeader?.frameCount === 10, "TS006 machine runtime metadata drifted");
  invariant(Object.values(machine.commands || {}).every((command) => command.status === "success"), "TS006 standard machine extraction has a failed command");
  const machineOutputs = await Promise.all((machine.outputs || []).map((output) => verifyMachineOutput(workspace, output)));
  invariant(machineOutputs.some(({path: candidate}) => candidate.endsWith("ffdec-scripts.txt.gz")), "TS006 FFDec script bundle is missing");
  invariant(machineOutputs.some(({path: candidate}) => candidate.endsWith("swfmill.xml.gz")), "TS006 swfmill structure is missing");

  invariant(sourceAudit.identity?.animationId === ANIMATION_ID, "TS006 G4 L3 source audit identity mismatch");
  invariant(sourceAudit.provenance?.source?.swf?.sha256 === manifest.source.swfSha256 && sourceAudit.provenance?.source?.fla?.sha256 === manifest.source.flaSha256, "TS006 G4 L3 source audit hash binding mismatch");
  invariant(sourceAudit.machineFindings?.runtime?.rootFrameCount === 10 && sourceAudit.machineFindings?.runtime?.fps === 12, "TS006 G4 L3 source audit runtime facts drifted");
  invariant(sourceAudit.machineFindings?.evidenceLimits?.runtimeReachabilityEstablished === false, "TS006 source audit may not establish runtime reachability");

  invariant(protocol.reportType === "g4-l3-ts006-original-runtime-session-protocol-draft", "TS006 protocol report type mismatch");
  invariant(protocol.sourceFacts?.rootTimeline?.frameCount === 10, "TS006 protocol root frame count drifted");
  invariant(protocol.sourceFacts?.nestedTimelineCandidates?.some((item) => item.frameDomainCandidateId === "sprite-3" && item.declaredFrameCount === 1), "TS006 protocol lost sprite-3");
  invariant(protocol.sourceFacts?.nestedTimelineCandidates?.some((item) => item.frameDomainCandidateId === "sprite-23" && item.declaredFrameCount === 128), "TS006 protocol lost sprite-23");
  invariant(protocol.executionGate?.originalRuntimeExecutionReady === false && protocol.acceptance?.strictMigrationComplete === false, "TS006 protocol was unexpectedly promoted");
  invariant(sessionReadiness.reportType === "g4-l3-first-original-runtime-session-readiness", "TS006 first-session readiness type mismatch");
  invariant(sessionReadiness.summary?.runtimeSessionsExecuted === 0 && sessionReadiness.acceptance?.strictMigrationComplete === false, "TS006 first-session readiness was unexpectedly promoted");

  const physicalSourceRecords = [];
  for (const [kind, sourcePath, expectedSha256] of [
    ["source-swf", manifest.source.swf, manifest.source.swfSha256],
    ["source-fla", manifest.source.fla, manifest.source.flaSha256],
  ]) {
    const absolutePath = path.join(projectRoot, sourcePath);
    const bytes = await readFile(absolutePath);
    invariant(sha256(bytes) === expectedSha256, `TS006 physical ${kind} hash mismatch`);
    physicalSourceRecords.push({id: kind, path: sourcePath, bytes: bytes.length, sha256: expectedSha256});
  }

  const document = {
    schemaVersion: 2,
    evidenceKind: "course-shell-strict-readiness",
    generatedBy: {
      script: portable(path.relative(projectRoot, scriptPath)),
      version: 1,
      sha256: sha256(generatorBytes),
      deterministic: true,
    },
    animationId: ANIMATION_ID,
    assessedOn: "2026-07-25",
    migrationStatusChanged: false,
    conclusion: {
      strictAcceptanceReady: false,
      completionClaimAllowed: false,
      localAuthoritativeBaselineCompletable: false,
      localExhaustiveBranchCaptureCompletable: false,
      risk: "high",
      reason: "Static source, FFDec/swfmill, work-only authoring, host-tree, and operator-protocol evidence identify the TS006 root and nested timeline obligations, but no approved original-runtime natural trace, authoritative baseline, audio listening/synchronization review, full-frame comparison, human visual review, or owner acceptance exists.",
    },
    source: {
      swf: manifest.source.swf,
      swfSha256: manifest.source.swfSha256,
      fla: manifest.source.fla,
      flaSha256: manifest.source.flaSha256,
      sourceHashesVerified: true,
      technicalManifestProjection: TECHNICAL_MANIFEST_PROJECTION.id,
      technicalManifestProjectionSha256: technicalManifestSha256(manifest),
      technicalManifestExcludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
    },
    machineAudit: {
      auditStatus: "partial",
      stage: {width: 800, height: 600},
      fps: 12,
      rootFrameCount: 10,
      actionScriptVersion: machine.findings.actionScriptVersion,
      exportedScriptFileCount: machine.findings.exportedScriptFileCount,
      allCommandsPassed: true,
      allOutputPinsVerified: true,
      observedBehaviorFromExtractedScripts: [
        "Root frame 1 calls _level0.InternalPreloader.gotoAndPlay(\"jump_check\") and stops; natural entry therefore requires the same-lesson host rather than direct child-SWF launch.",
        "Root frame 6 places the one-frame Mc_Page_Title timeline sprite-3 and the 128-frame Animation03 timeline sprite-23, then stops the root playhead.",
        "sprite-23 owns 128 declared frames, a terminal stop, and embedded streaming MP3 structure; static extraction does not establish natural reachability, language, cue timing, synchronization, or listening acceptance.",
      ],
      report: {path: MACHINE_REPORT_RELATIVE, bytes: machineRecord.bytes, sha256: machineRecord.sha256},
    },
    branchCaptureReadiness: {
      status: "partial-reference-only",
      authoritativeScheduleEstablished: false,
      runtimeSessionsExecuted: 0,
      requiredScenarioInventory: [
        "English natural entry through the complete same-lesson shell host path",
        "Spanish natural entry through a fresh independent runtime profile and complete same-lesson shell host path",
        "all naturally reached one-indexed root frames and the frame-6 entry state",
        "all naturally reached sprite-23 frames 1-128 through its terminal stop",
        "evidence-backed disposition of root-placed sprite-3 without treating static placement as runtime reachability",
        "embedded and external audio selection, cue, language, timing, synchronization, and complete listening review",
        "host-native Replay with full root, nested, audio, language, and navigation-state reset",
        "host-native Previous and Next navigation plus natural re-entry to TS006",
      ],
      missing: [
        "source-hash-bound authorized original-runtime natural-entry capture",
        "approved containment, named runtime operator, owner authorization, and external trust-root bindings",
        "natural runtime reachability and final disposition for every root-placed timeline",
        "complete English and Spanish frame, audio, navigation, terminal, and Replay evidence",
        "implementation captures, full-frame RMSE, independent human review, and owner acceptance",
      ],
      directSeekAuthority: "not-permitted-for-primary-evidence; supplemental diagnosis only after a complete natural trace",
    },
    acceptance: {
      acceptanceNeutral: true,
      authoritativeOriginalRuntimeAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
    },
    evidence: [
      ...physicalSourceRecords,
      {id: "migration-technical-contract", path: manifestRecord.path, bytes: manifestRecord.bytes, sha256: manifestRecord.sha256},
      {id: "standard-machine-report", path: machineRecord.path, bytes: machineRecord.bytes, sha256: machineRecord.sha256},
      ...machineOutputs.map((output, index) => ({id: `standard-machine-output-${String(index + 1).padStart(2, "0")}`, ...output})),
      {id: "g4-l3-source-audit", path: sourceAuditRecord.path, bytes: sourceAuditRecord.bytes, sha256: sourceAuditRecord.sha256},
      {id: "original-runtime-protocol-draft", path: protocolRecord.path, bytes: protocolRecord.bytes, sha256: protocolRecord.sha256},
      {id: "first-session-readiness", path: sessionReadinessRecord.path, bytes: sessionReadinessRecord.bytes, sha256: sessionReadinessRecord.sha256},
    ],
    limitations: [
      "This readiness artifact is a static specification input. It launches neither Adobe Animate nor an original Flash runtime.",
      "The standard machine audit re-extracts source structure but cannot prove runtime reachability, interaction behavior, visual fidelity, or audio timing.",
      "No field in this artifact authorizes capture, satisfies a full-frame requirement, changes migration status, or supplies a human or owner signature.",
    ],
    strictAcceptanceEffect: "none; this fail-closed readiness artifact only supplies source-bound scenario obligations",
  };
  validateTs006ScenarioReadiness(document);
  const rendered = `${JSON.stringify(document, null, 2)}\n`;
  const outputPath = path.join(projectRoot, OUTPUT_RELATIVE);
  if (options.check) {
    const existing = await readFile(outputPath, "utf8");
    invariant(existing === rendered, "TS006 scenario readiness artifact is stale");
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
    process.stdout.write("Usage: node scripts/build-g4-l3-ts006-scenario-readiness.mjs [--check]\n");
  } else {
    const result = await buildTs006ScenarioReadiness(options);
    process.stdout.write(`${result.action}: ${result.output} (strict acceptance remains false)\n`);
  }
}
