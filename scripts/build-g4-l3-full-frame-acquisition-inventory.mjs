#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {technicalManifestSha256} from "./evidence-projections.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const JSON_OUTPUT = "reports/g4-l3-full-frame-acquisition-inventory.json";
const MARKDOWN_OUTPUT = "reports/g4-l3-full-frame-acquisition-inventory.md";
const INPUTS = Object.freeze({
  contract: "reports/g4-l3-authoritative-runtime-acquisition-contract.json",
  m3: "reports/g4-l3-m3-runtime-acquisition-readiness.json",
  capacity: "reports/g4-l3-capture-capacity-readiness.json",
  promotion: "reports/g4-l3-promotion-security-readiness.json",
  coverageUpgrade: "reports/g4-l3-valid-pending-root-coverage-upgrade.json",
  ts006PendingDomainCoverage: "reports/g4-l3-ts006-pending-domain-coverage-upgrade.json",
  ts006Protocol: "reports/g4-l3-ts006-original-runtime-session-protocol-draft.json",
  ts006ScheduleCandidate: "reports/g4-l3-ts006-original-runtime-schedule-candidate.json",
  shellReadiness: "migrations/shell-course-g04-l03-index-local/audit/strict-readiness.json",
});
const SHA256 = /^[a-f0-9]{64}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

async function readBound(relativePath) {
  const bytes = await readFile(path.join(ROOT, relativePath));
  return {value: JSON.parse(bytes), binding: {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)}};
}

async function bindingOnly(relativePath) {
  invariant(typeof relativePath === "string" && relativePath.length > 0 && !path.isAbsolute(relativePath),
    `Invalid project-relative binding path: ${relativePath}`);
  const absolute = path.resolve(ROOT, relativePath);
  const projectRelative = path.relative(ROOT, absolute);
  invariant(projectRelative && projectRelative !== ".." && !projectRelative.startsWith(`..${path.sep}`),
    `Binding path escapes project root: ${relativePath}`);
  const [metadata, physical] = await Promise.all([lstat(absolute), stat(absolute)]);
  invariant(metadata.isFile() && !metadata.isSymbolicLink() && physical.nlink === 1,
    `Binding must be one regular non-symlink, non-hard-linked file: ${relativePath}`);
  const bytes = await readFile(absolute);
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)};
}

function validateRequirement(requirement, domainsById, animationId) {
  invariant(typeof requirement.requirementId === "string" && requirement.requirementId.length > 0,
    `${animationId}: requirementId is absent`);
  invariant(typeof requirement.frameDomainId === "string" && requirement.frameDomainId.length > 0,
    `${animationId}: frameDomainId is absent`);
  invariant(typeof requirement.traceId === "string" && requirement.traceId.length > 0,
    `${animationId}: traceId is absent`);
  invariant(SHA256.test(requirement.entryStateSha256 || ""), `${animationId}: entryStateSha256 is invalid`);
  invariant(requirement.entryState && typeof requirement.entryState === "object" && !Array.isArray(requirement.entryState)
    && sha256(Buffer.from(JSON.stringify(stable(requirement.entryState)))) === requirement.entryStateSha256,
  `${animationId}: entryStateSha256 does not match canonical entryState JSON`);
  invariant(["en", "es"].includes(requirement.language) && String(requirement.seed).length > 0,
    `${animationId}: language or seed is invalid`);
  invariant(Number.isInteger(requirement.requiredRange?.firstFrame)
    && Number.isInteger(requirement.requiredRange?.lastFrame)
    && requirement.requiredRange.firstFrame >= 1
    && requirement.requiredRange.firstFrame <= requirement.requiredRange.lastFrame,
  `${animationId}: requirement range is invalid`);
  const domain = domainsById.get(requirement.frameDomainId);
  invariant(domain, `${animationId}: requirement names undeclared frame domain ${requirement.frameDomainId}`);
  invariant(requirement.requiredRange.firstFrame === 1
    && requirement.requiredRange.lastFrame === domain.frameCount,
  `${animationId}: requirement does not cover the complete declared frame domain ${requirement.frameDomainId}`);
}

function countStatuses(requirements) {
  return Object.fromEntries(["pending", "blocked", "complete"].map((status) => [
    status,
    requirements.filter((requirement) => requirement.status === status).length,
  ]));
}

export async function buildReport() {
  const entries = await Promise.all(Object.entries(INPUTS).map(async ([key, file]) => [key, await readBound(file)]));
  const input = Object.fromEntries(entries);
  const contract = input.contract.value;
  const m3 = input.m3.value;
  const capacity = input.capacity.value;
  const promotion = input.promotion.value;
  const shell = input.shellReadiness.value;
  invariant(contract.items?.length === 40 && contract.summary?.canonicalItems === 40,
    "Runtime acquisition contract does not contain 40 members");
  invariant(m3.items?.length === 40 && m3.summary?.workspaceArtifactsCurrent === 40,
    "M3 workspace planning is stale");
  invariant(capacity.capacityModel.admission === "admit-full-lesson-capture-capacity"
    && capacity.capacityModel.remainingEvidenceSafetyMultiplier === 1.20
    && capacity.capacityModel.operationalReserveBytes === 100 * 1024 ** 3,
  "The current capacity snapshot does not satisfy the v2 formula");
  invariant(promotion.testResult.passed === promotion.testResult.tests
    && promotion.testResult.failed === 0
    && promotion.testResult.cancelled === 0
    && promotion.testResult.tests >= 124
    && promotion.productionFuses.allClosed === true
    && promotion.readiness.productionPromotionWriterReady === false,
  "Promotion security readiness is stale or was opened");
  invariant(input.coverageUpgrade.value.summary.invalidOneToZeroRangesAfter === 0,
    "Legacy 1..0 coverage placeholders remain");
  const coverageUpgradeItems = input.coverageUpgrade.value.items || [];
  const coverageUpgradeNestedRequirements = coverageUpgradeItems
    .reduce((sum, item) => sum + (item.pendingNestedRequirements || 0), 0);
  const coverageUpgradeTotalRequirements = coverageUpgradeItems
    .reduce((sum, item) => sum + (item.pendingRequirements || 0), 0);
  invariant(coverageUpgradeItems.length === 38
    && input.coverageUpgrade.value.summary.rootRequirementsAfter === coverageUpgradeItems.length * 2
    && input.coverageUpgrade.value.summary.nestedRequirementsAfter === coverageUpgradeNestedRequirements
    && input.coverageUpgrade.value.summary.totalPendingRequirementsAfter === coverageUpgradeTotalRequirements
    && coverageUpgradeTotalRequirements
      === input.coverageUpgrade.value.summary.rootRequirementsAfter + coverageUpgradeNestedRequirements
    && input.ts006PendingDomainCoverage.value.summary?.pendingRequirements === 4
    && input.ts006PendingDomainCoverage.value.summary?.pendingNestedRequirements === 2
    && input.ts006PendingDomainCoverage.value.summary?.strictCompletions === 0,
  "TS006 conservative nested-domain coverage chain is stale or promoted");
  const ts006ScheduleCandidate = input.ts006ScheduleCandidate.value;
  invariant(ts006ScheduleCandidate.reportType === "g4-l3-ts006-original-runtime-schedule-candidate"
    && ts006ScheduleCandidate.scope?.animationId === "course-g04-l03-ts-006"
    && ts006ScheduleCandidate.scheduleCandidate?.sessions?.length === 2
    && ts006ScheduleCandidate.scheduleCandidate?.sessions?.every(({status, coverageRequirements, independentFrameDomainFrames, conservativeOriginalRuntimePngUpperBound}) =>
      status === "technical-candidate-not-approved-not-executed"
      && coverageRequirements?.length === 2
      && independentFrameDomainFrames === 138
      && conservativeOriginalRuntimePngUpperBound === 139)
    && ts006ScheduleCandidate.scheduleCandidate?.controlApprovalsRecorded === 0
    && ts006ScheduleCandidate.scheduleCandidate?.namedOperatorsRecorded === 0
    && ts006ScheduleCandidate.scheduleCandidate?.ownerApprovalsRecorded === 0
    && ts006ScheduleCandidate.scheduleCandidate?.runtimeSessionsExecuted === 0
    && ts006ScheduleCandidate.executionGate?.originalRuntimeExecutionReady === false
    && Object.values(ts006ScheduleCandidate.acceptance || {}).every((value) => value === false),
  "TS006 technical schedule candidate is stale, incomplete, or promoted");
  invariant(shell.frameDomainReadiness.unresolvedTimelineCount === 0
    && shell.frameDomainReadiness.unresolvedMultiFrameTimelineCount === 0,
    "Shell unresolved child-timeline count drifted");

  const m3ById = new Map(m3.items.map((item) => [item.animationId, item]));
  const items = [];
  for (const sourceItem of contract.items) {
    const workspace = m3ById.get(sourceItem.animationId);
    invariant(workspace?.sequence === sourceItem.sequence, `${sourceItem.animationId}: M3 binding is absent`);
    const migrationPath = `migrations/${sourceItem.animationId}/migration.json`;
    const coveragePath = `migrations/${sourceItem.animationId}/evidence/full-frame-coverage.json`;
    const [migration, coverage, migrationBinding, coverageBinding] = await Promise.all([
      readFile(path.join(ROOT, migrationPath), "utf8").then(JSON.parse),
      readFile(path.join(ROOT, coveragePath), "utf8").then(JSON.parse),
      readBound(migrationPath).then(({binding}) => binding),
      readBound(coveragePath).then(({binding}) => binding),
    ]);
    invariant(migration.animationId === sourceItem.animationId && coverage.animationId === sourceItem.animationId,
      `${sourceItem.animationId}: workspace identity drifted`);
    invariant(workspace.migrationTechnicalManifest?.path === migrationPath
      && workspace.migrationTechnicalManifest.sha256 === technicalManifestSha256(migration),
    `${sourceItem.animationId}: M3 technical migration projection is stale`);
    const declaredDomains = migration.implementation?.frameDomains || [];
    const domainsById = new Map(declaredDomains.map((domain) => [domain.id, domain]));
    const requirements = coverage.requirements || [];
    invariant(requirements.length > 0, `${sourceItem.animationId}: no capture requirements exist`);
    requirements.forEach((requirement) =>
      validateRequirement(requirement, domainsById, sourceItem.animationId));
    invariant(declaredDomains.some(({id, frameCount}) => id === "root"
      && frameCount === sourceItem.nativeRuntimeFacts.rootFrameCount),
    `${sourceItem.animationId}: root frame domain is not bound to the source root timeline`);
    const implementationCaptureManifests = [];
    for (const requirement of requirements) {
      if (!requirement.captureManifest) continue;
      const captureBinding = await bindingOnly(requirement.captureManifest);
      const requiredFrameCount = requirement.requiredRange.lastFrame - requirement.requiredRange.firstFrame + 1;
      invariant(captureBinding.sha256 === requirement.captureManifestSha256
        && requirement.capturedFrameCount === requiredFrameCount
        && requirement.missingFrames?.length === 0
        && requirement.status !== "complete"
        && requirement.baselineAuthority === "unresolved"
        && requirement.baselineCaptureManifest === ""
        && requirement.baselineCaptureManifestSha256 === ""
        && requirement.metricsFile === ""
        && requirement.metricsSha256 === "",
      `${sourceItem.animationId}: ${requirement.requirementId} implementation capture is stale, incomplete, or overclaimed`);
      implementationCaptureManifests.push({
        requirementId: requirement.requirementId,
        frameDomainId: requirement.frameDomainId,
        language: requirement.language,
        scenario: requirement.scenario,
        frames: requirement.capturedFrameCount,
        manifest: captureBinding,
        authority: "non-authoritative-current-javascript-output",
        strictAcceptanceEffect: "none",
      });
    }
    const captureAdoption = implementationCaptureManifests.length > 0
      ? await bindingOnly(`migrations/${sourceItem.animationId}/evidence/current-javascript-implementation-capture-adoption.json`)
      : null;
    items.push({
      sequence: sourceItem.sequence,
      batchId: workspace.batchId,
      animationId: sourceItem.animationId,
      releaseRole: sourceItem.releaseRole,
      source: {
        flaSha256: sourceItem.captureIdentityContract.sourceFlaSha256,
        swfSha256: sourceItem.captureIdentityContract.sourceSwfSha256,
      },
      nativeRuntime: {
        stage: sourceItem.nativeRuntimeFacts.stage,
        fps: sourceItem.nativeRuntimeFacts.fps,
        rootFrameCount: sourceItem.nativeRuntimeFacts.rootFrameCount,
        staticallyReachableNestedDefinitions:
          sourceItem.nativeRuntimeFacts.staticallyRootReachableNestedDefinitionCount,
        frameDomainDispositionEstablished: sourceItem.nativeRuntimeFacts.frameDomainDispositionEstablished,
      },
      currentWorkspace: {
        migration: migrationBinding,
        migrationTechnicalProjectionSha256: workspace.migrationTechnicalManifest.sha256,
        fullFrameCoverage: coverageBinding,
        declaredFrameDomains: declaredDomains.map(({id, kind, frameCount, scenarioIds}) => ({id, kind, frameCount, scenarioIds})),
        requirementCount: requirements.length,
        requirementStatuses: countStatuses(requirements),
        invalidRanges: 0,
        completeRequirements: requirements.filter(({status}) => status === "complete").length,
        nonAuthoritativeImplementationCaptures: {
          requirementCount: implementationCaptureManifests.length,
          frameCount: implementationCaptureManifests.reduce((sum, capture) => sum + capture.frames, 0),
          adoption: captureAdoption,
          manifests: implementationCaptureManifests,
          strictAcceptanceEffect: "none",
        },
        authoritativeBaselineRequirementCount: requirements.filter(({baselineCaptureManifest}) => Boolean(baselineCaptureManifest)).length,
        pairedMetricRequirementCount: requirements.filter(({metricsFile}) => Boolean(metricsFile)).length,
      },
      acquisitionMatrix: {
        languages: sourceItem.acquisitionRequirements.requiredLocales,
        naturalExecutionFirst: sourceItem.acquisitionRequirements.naturalExecutionFirst,
        universalEvidenceFamilies: sourceItem.acquisitionRequirements.universalEvidenceFamilies,
        sourceBoundScenarioCandidates: sourceItem.acquisitionRequirements.sourceBoundScenarioCandidates,
        staticCandidateFamilies: sourceItem.acquisitionRequirements.staticCandidateFamilies,
        randomCandidate: sourceItem.acquisitionRequirements.randomCandidate,
        audio: sourceItem.acquisitionRequirements.audio,
        navigationAndReplay: sourceItem.acquisitionRequirements.navigationAndReplay,
        authoritativeScenarioInventoryEstablished: false,
        authoritativeTraceSpecificationsEstablished: false,
        captureSchedulesEstablished: false,
        technicalScheduleCandidate: sourceItem.animationId === "course-g04-l03-ts-006"
          ? {
              prepared: true,
              scheduleCandidateSha256: ts006ScheduleCandidate.scheduleCandidateSha256,
              sessions: ts006ScheduleCandidate.scheduleCandidate.sessions.map(({language, coverageRequirements, independentFrameDomainFrames, structuralDispositionCheckpointFrames, conservativeOriginalRuntimePngUpperBound}) => ({
                language,
                requirementIds: coverageRequirements.map(({requirementId}) => requirementId),
                independentFrameDomainFrames,
                structuralDispositionCheckpointFrames,
                conservativeOriginalRuntimePngUpperBound,
              })),
              accepted: false,
              executionAuthorized: false,
              strictAcceptanceEffect: "none",
            }
          : null,
      },
      outputContract: {
        rawFramesRootTemplate: `artifacts/full-frame/g4-l3/<session-id>/${sourceItem.animationId}/`,
        nativePng: {width: 800, height: 600, lossless: true},
        frameRate: 12,
        rawAudioRequired: true,
        losslessSessionAudioRequired: true,
        captureIdentityFields: sourceItem.captureIdentityContract.requiredFields,
        naturalTraceAndDirectSeekMustRemainSeparate: true,
      },
      gate: {
        state: sourceItem.animationId === "course-g04-l03-ts-006"
          ? "vertical-slice-selected-execution-blocked"
          : "blocked-until-ts006-strict-closure-and-runtime-authorization",
        runtimeSessionExecuted: false,
        authoritativeBaselinePackageEstablished: false,
        strictComplete: false,
      },
    });
  }
  invariant(items.filter(({batchId}) => batchId === "batch-001").length === 25
    && items.filter(({batchId}) => batchId === "batch-002").length === 15,
  "The fixed 25/15 shard split drifted");
  const requirements = items.flatMap(({currentWorkspace}) => [currentWorkspace]);
  const summary = {
    canonicalMembers: items.length,
    activePages: items.filter(({releaseRole}) => releaseRole === "active-xml-referenced-page").length,
    courseShells: items.filter(({releaseRole}) => releaseRole === "course-shell").length,
    batch001Members: items.filter(({batchId}) => batchId === "batch-001").length,
    batch002Members: items.filter(({batchId}) => batchId === "batch-002").length,
    declaredRequirements: requirements.reduce((sum, item) => sum + item.requirementCount, 0),
    pendingRequirements: requirements.reduce((sum, item) => sum + item.requirementStatuses.pending, 0),
    blockedRequirements: requirements.reduce((sum, item) => sum + item.requirementStatuses.blocked, 0),
    completeRequirements: requirements.reduce((sum, item) => sum + item.requirementStatuses.complete, 0),
    invalidRanges: 0,
    sourceBoundScenarioCandidates: contract.summary.sourceBoundScenarioCandidates,
    staticCandidateFamilies: contract.summary.staticCandidateFamilies,
    staticallyReachableNestedDefinitions: contract.summary.staticallyReachableNestedDefinitions,
    shellUnresolvedChildTimelines: shell.frameDomainReadiness.unresolvedTimelineCount,
    runtimeSessionsExecuted: 0,
    authoritativeBaselinePackages: 0,
    nonAuthoritativeImplementationCaptureMembers: items.filter(({currentWorkspace}) =>
      currentWorkspace.nonAuthoritativeImplementationCaptures.requirementCount > 0).length,
    nonAuthoritativeImplementationCaptureRequirements: requirements.reduce((sum, item) =>
      sum + item.nonAuthoritativeImplementationCaptures.requirementCount, 0),
    nonAuthoritativeImplementationCapturedFrames: requirements.reduce((sum, item) =>
      sum + item.nonAuthoritativeImplementationCaptures.frameCount, 0),
    authoritativeBaselineRequirements: requirements.reduce((sum, item) =>
      sum + item.authoritativeBaselineRequirementCount, 0),
    pairedMetricRequirements: requirements.reduce((sum, item) =>
      sum + item.pairedMetricRequirementCount, 0),
    ts006TechnicalScheduleCandidatesPrepared: 1,
    strictCompletions: 0,
  };
  invariant(summary.declaredRequirements === 542 && summary.pendingRequirements === 538
    && summary.blockedRequirements === 4 && summary.completeRequirements === 0,
  "Current 542-requirement planning state drifted");
  invariant(summary.nonAuthoritativeImplementationCaptureMembers === 40
    && summary.nonAuthoritativeImplementationCaptureRequirements === 130
    && summary.nonAuthoritativeImplementationCapturedFrames === 17098
    && summary.authoritativeBaselineRequirements === 0
    && summary.pairedMetricRequirements === 0,
  "Current acceptance-neutral implementation-capture inventory drifted or was promoted");
  return {
    schemaVersion: 1,
    reportType: "g4-l3-full-frame-acquisition-inventory",
    generator: await bindingOnly(path.relative(ROOT, SCRIPT_PATH).split(path.sep).join("/")),
    sourceBindings: Object.fromEntries(entries.map(([key, document]) => [key, document.binding])),
    scope: {
      releaseId: "lesson-g04-l03-negative-numbers",
      captureOrder: ["course-g04-l03-ts-006-vertical-slice", "batch-001", "batch-002"],
      sharedLedgerCoordinator: "single-release-coordinator-required",
      rawEvidenceRoot: "artifacts/full-frame/g4-l3/<session-id>/",
    },
    capacityGate: {
      snapshotAdmission: capacity.capacityModel.admission,
      availableBytes: capacity.capacityModel.availableBytes,
      remainingEvidenceSafetyMultiplier: capacity.capacityModel.remainingEvidenceSafetyMultiplier,
      operationalReserveBytes: capacity.capacityModel.operationalReserveBytes,
      minimumSafeFreeBytes: capacity.capacityModel.minimumSafeFreeBytes,
      livePreflightRequiredBeforeEverySession: true,
      capacityIsFidelityEvidence: false,
    },
    runtimeAndPromotionGate: {
      projectorStrictSignatureVerified:
        promotion.externalDependencies.trustedProjectorStrictSignatureVerified,
      projectorSignatureVerificationIsPointInTimeOnly: true,
      containmentControlsApproved: 0,
      namedCaptureOperators: 0,
      externalTrustRootConfigured: false,
      productionPromotionWriterReady: false,
      ts006TechnicalScheduleCandidatePrepared: true,
      ts006TechnicalScheduleAccepted: false,
      captureMayOnlyBeStoredAs: "pending-candidate",
      bulkCaptureAuthorized: false,
    },
    items,
    summary,
    acceptance: {
      acceptanceNeutral: true,
      fullFrameMatrixAuthoritative: false,
      ts006StrictComplete: false,
      batchCaptureAuthorized: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      lessonPublished: false,
      strictCompletions: 0,
    },
  };
}

export function validateReport(report) {
  invariant(report.schemaVersion === 1 && report.reportType === "g4-l3-full-frame-acquisition-inventory",
    "Full-frame inventory identity drifted");
  invariant(report.summary.canonicalMembers === 40 && report.summary.activePages === 39
    && report.summary.courseShells === 1 && report.summary.batch001Members === 25
    && report.summary.batch002Members === 15 && report.summary.invalidRanges === 0,
  "Full-frame inventory scope drifted");
  invariant(report.runtimeAndPromotionGate.bulkCaptureAuthorized === false
    && report.runtimeAndPromotionGate.productionPromotionWriterReady === false
    && report.acceptance.lessonPublished === false && report.acceptance.strictCompletions === 0,
  "Full-frame inventory was promoted");
  return report;
}

export function renderMarkdown(report) {
  validateReport(report);
  const rows = report.items.map((item) =>
    `| ${item.sequence} | \`${item.animationId}\` | ${item.batchId} | ${item.nativeRuntime.rootFrameCount} | ${item.nativeRuntime.staticallyReachableNestedDefinitions} | ${item.acquisitionMatrix.sourceBoundScenarioCandidates.length} | ${item.currentWorkspace.requirementCount} | ${item.gate.state} |`).join("\n");
  return `# G4 L3 Full-Frame Acquisition Inventory\n\n`
    + `This is the current machine-verifiable acquisition queue, not an authoritative scenario matrix or capture authorization.\n\n`
    + `- Scope: **40** members (39 pages + shell); shards **25 / 15**.\n`
    + `- Current valid requirement records: **${report.summary.declaredRequirements}**; pending ${report.summary.pendingRequirements}, blocked ${report.summary.blockedRequirements}, complete ${report.summary.completeRequirements}; invalid ranges **0**.\n`
    + `- Acceptance-neutral implementation captures: **${report.summary.nonAuthoritativeImplementationCaptureRequirements} requirements / ${report.summary.nonAuthoritativeImplementationCapturedFrames} frames / ${report.summary.nonAuthoritativeImplementationCaptureMembers} members**. Authoritative baselines / paired RMSE metrics remain **${report.summary.authoritativeBaselineRequirements} / ${report.summary.pairedMetricRequirements}**.\n`
    + `- Source-bound scenario candidates: **${report.summary.sourceBoundScenarioCandidates}**; static candidate families: **${report.summary.staticCandidateFamilies}**. Runtime must decide reachability and avoid a guessed Cartesian product.\n`
    + `- Shell unresolved child timelines: **${report.summary.shellUnresolvedChildTimelines}**.\n`
    + `- Capacity snapshot: **${report.capacityGate.snapshotAdmission}**, using remaining evidence × 1.20 + 100 GiB; rerun before every session.\n`
    + `- Runtime/promotion: Projector point-in-time signature check ${report.runtimeAndPromotionGate.projectorStrictSignatureVerified ? "passes" : "fails"}, but external trust/approval remains unresolved; 0 containment approvals, 0 named operators, production writer closed; evidence can only be \`pending-candidate\`.\n\n`
    + `- TS006 EN/ES technical schedule candidate: **prepared but not accepted**; it binds 4 coverage requirements and P00–P09 without creating a launch command or runtime authority.\n\n`
    + `| # | Member | Shard | Root frames | Static nested candidates | Scenario candidates | Current requirements | Gate |\n`
    + `|---:|---|---|---:|---:|---:|---:|---|\n${rows}\n`;
}

export function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const report = validateReport(await buildReport());
  const json = stableJson(report);
  const markdown = renderMarkdown(report);
  if (options.check) {
    const [currentJson, currentMarkdown] = await Promise.all([
      readFile(path.join(ROOT, JSON_OUTPUT), "utf8"),
      readFile(path.join(ROOT, MARKDOWN_OUTPUT), "utf8"),
    ]);
    invariant(currentJson === json && currentMarkdown === markdown, "Full-frame acquisition inventory is stale");
    process.stdout.write(`PASS ${report.summary.canonicalMembers}/40; invalid ranges 0; capture not authorized\n`);
    return;
  }
  await Promise.all([
    writeFile(path.join(ROOT, JSON_OUTPUT), json),
    writeFile(path.join(ROOT, MARKDOWN_OUTPUT), markdown),
  ]);
  process.stdout.write(`WROTE ${report.summary.canonicalMembers}/40; invalid ranges 0; capture not authorized\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
