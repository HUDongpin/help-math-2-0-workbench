#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, readFile, stat} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {projectionSha256} from "./evidence-projections.mjs";
import {
  normalizeRequirementSelection,
  selectionSha256,
} from "./lib/trace-frame-selection.mjs";
import {validateSupplementalPartialRequirementBoundary} from
  "./lib/strict-full-domain-requirement.mjs";
import {writeApprovalTransaction} from
  "./record-current-javascript-output-approval.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ROOT_AUDIT_PATH =
  "reports/g4-l3-unresolved-root-entry-placement-path-audit.json";
const OBSERVABILITY_PATH =
  "reports/g4-l3-parent-composite-observability-audit.json";
const ASSET_REPORT_PATH = "reports/g4-l3-parent-composite-assets.json";
const REPORT_PATH = "reports/g4-l3-alternate-placement-coverage.json";
const MARKDOWN_PATH = "reports/g4-l3-alternate-placement-coverage.md";
const MUTABLE_FIELDS = Object.freeze([
  "blockingReason",
  "blockingEvidence",
  "capturedFrameCount",
  "missingFrames",
  "captureManifest",
  "captureManifestSha256",
]);
const AUTHORITY = Object.freeze({
  currentJavascriptImplementationCaptureOnly: true,
  originalRuntimeBaseline: false,
  rmseAcceptance: false,
  humanVisualReview: false,
  ownerAcceptance: false,
  strictAcceptance: false,
});

export const ALTERNATE_PLACEMENT_CONFIGS = Object.freeze([
  Object.freeze({
    animationId: "course-g04-l03-vb-007",
    expectedCanonicalRequirementCount: 30,
    canonicalRequirementId:
      "req:sprite-166:lesson-shell-natural-entry:en",
    requirementId:
      "req:sprite-166:lesson-shell-natural-entry-path-2:en",
    traceId:
      "trace:sprite-166:lesson-shell-natural-entry-path-2:en:seed-0",
    frameDomainId: "sprite-166",
    frameCount: 19,
    pathIndex: 2,
    contractId: "g04-l03-vb-007-parent-composite-observability-v1",
    behaviorCompositeStatePrefix: "sprite166-p02-target-frame-",
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-012",
    expectedCanonicalRequirementCount: 26,
    canonicalRequirementId:
      "req:sprite-98:lesson-shell-natural-entry:en",
    requirementId:
      "req:sprite-98:lesson-shell-natural-entry-path-2:en",
    traceId:
      "trace:sprite-98:lesson-shell-natural-entry-path-2:en:seed-0",
    frameDomainId: "sprite-98",
    frameCount: 19,
    pathIndex: 2,
    contractId: "g04-l03-in-012-parent-composite-observability-v1",
    behaviorCompositeStatePrefix: "sprite98-p02-target-frame-",
  }),
  Object.freeze({
    animationId: "course-g04-l03-ts-007",
    expectedCanonicalRequirementCount: 38,
    canonicalRequirementId:
      "req:sprite-314:lesson-shell-natural-entry:en",
    requirementId:
      "req:sprite-314:lesson-shell-natural-entry-path-2:en",
    traceId:
      "trace:sprite-314:lesson-shell-natural-entry-path-2:en:seed-0",
    frameDomainId: "sprite-314",
    frameCount: 19,
    pathIndex: 2,
    contractId: "g04-l03-ts-007-parent-composite-observability-v1",
    behaviorCompositeStatePrefix: "sprite314-p02-target-frame-",
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

function canonicalJson(value) {
  return JSON.stringify(stable(value));
}

function pretty(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function range(lastFrame) {
  return Array.from({length: lastFrame}, (_, index) => index + 1);
}

function projectPath(relativePath) {
  invariant(
    typeof relativePath === "string"
      && relativePath.length > 0
      && !path.isAbsolute(relativePath),
    "project-relative path is required",
  );
  const absolute = path.resolve(ROOT, relativePath);
  invariant(
    absolute.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes the project root`,
  );
  return absolute;
}

async function record(relativePath, {optional = false} = {}) {
  const absolute = projectPath(relativePath);
  try {
    const metadata = await lstat(absolute);
    invariant(
      metadata.isFile() && !metadata.isSymbolicLink(),
      `${relativePath} must be a regular non-symlink file`,
    );
    const physical = await stat(absolute);
    invariant(physical.nlink === 1, `${relativePath} must be single-linked`);
    const bytesValue = await readFile(absolute);
    return {
      path: relativePath,
      bytes: bytesValue.length,
      sha256: sha256(bytesValue),
      bytesValue,
    };
  } catch (error) {
    if (optional && error.code === "ENOENT") return null;
    throw error;
  }
}

function binding(fileRecord) {
  return {
    path: fileRecord.path,
    bytes: fileRecord.bytes,
    sha256: fileRecord.sha256,
  };
}

function withoutMutableFields(value) {
  const clone = structuredClone(value);
  for (const field of MUTABLE_FIELDS) delete clone[field];
  return clone;
}

function validateCanonicalRequirement(requirement, config) {
  invariant(
    requirement?.requirementId === config.canonicalRequirementId,
    `${config.animationId}: canonical requirement is missing`,
  );
  invariant(
    requirement.frameDomainId === config.frameDomainId
      && requirement.scenario === "source-static-reachable-domain"
      && requirement.language === "en"
      && String(requirement.seed) === "0"
      && requirement.requiredRange?.firstFrame === 1
      && requirement.requiredRange?.lastFrame === config.frameCount
      && projectionSha256(requirement.entryState)
        === requirement.entryStateSha256,
    `${config.animationId}: canonical requirement identity drifted`,
  );
}

function pathEvidence(rootAudit, observability, config) {
  const rootDomain = rootAudit.items.find(
    ({animationId}) => animationId === config.animationId,
  )?.domains.find(
    ({targetTimelineId}) => targetTimelineId === config.frameDomainId,
  );
  const placementPath = rootDomain?.placementPaths?.[config.pathIndex - 1];
  invariant(
    rootDomain?.rootEntryFrame === 6
      && placementPath?.length >= 3,
    `${config.animationId}: alternate placement path disappeared`,
  );
  const observedPath = observability.items.find(
    ({animationId}) => animationId === config.animationId,
  )?.domains.find(
    ({targetTimelineId}) => targetTimelineId === config.frameDomainId,
  )?.paths.find(({pathIndex}) => pathIndex === config.pathIndex);
  invariant(
    observedPath?.classification
      === "source-static-parent-composite-multiframe-candidate"
      && observedPath.targetFrameCount === config.frameCount
      && observedPath.overrideMechanismObservable === true
      && observedPath.sourcePositionObservable === true,
    `${config.animationId}: alternate placement observability drifted`,
  );
  return {
    rootEntryFrame: rootDomain.rootEntryFrame,
    placementPath: structuredClone(placementPath),
    mainFrameDomainId: observedPath.mainFrameDomainId,
    mainFrame: observedPath.mainFrame,
    intermediateFrameOverrides:
      structuredClone(observedPath.intermediateFrameOverrides),
    uniqueTargetVisualCount: observedPath.uniqueTargetVisualCount,
  };
}

export function buildAlternatePlacementRequirement({
  canonicalRequirement,
  config,
  pathIdentity,
  rootAuditBinding,
  observabilityBinding,
  assetReportBinding,
}) {
  validateCanonicalRequirement(canonicalRequirement, config);
  const entryState = {
    ...structuredClone(canonicalRequirement.entryState),
    placementPathIdentity: {
      schemaVersion: 1,
      pathIndex: config.pathIndex,
      rootEntryFrame: pathIdentity.rootEntryFrame,
      placementPath: structuredClone(pathIdentity.placementPath),
      sourceParentCompositeContractId: config.contractId,
      behaviorCompositeStatePrefix: config.behaviorCompositeStatePrefix,
      mainFrameDomainId: pathIdentity.mainFrameDomainId,
      mainFrame: pathIdentity.mainFrame,
      intermediateFrameOverrides:
        structuredClone(pathIdentity.intermediateFrameOverrides),
      uniqueTargetVisualCount: pathIdentity.uniqueTargetVisualCount,
      authority:
        "source-static-placement-path-candidate-not-original-runtime",
    },
  };
  const unsigned = {
    requirementSchemaVersion: 2,
    coverageRole: "placement-path",
    coverageGroupId:
      `coverage-group:${config.frameDomainId}:lesson-shell-natural-entry-path-${config.pathIndex}:en:seed-0`,
    requirementId: config.requirementId,
    scenario: canonicalRequirement.scenario,
    frameDomainId: config.frameDomainId,
    traceId: config.traceId,
    language: "en",
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame: config.frameCount},
    entryState,
    entryStateSha256: projectionSha256(entryState),
    baselineAuthorityRequirement: "original-runtime-natural-trace",
    baselineAuthority: "unresolved",
    status: "blocked",
    blockingReason:
      "This complete alternate placement-path identity has no adopted schema-v4 Current-JS capture. It remains supplemental and cannot enter original-runtime, fidelity, human, Owner, or strict acceptance.",
    blockingEvidence: [
      rootAuditBinding,
      observabilityBinding,
      assetReportBinding,
    ],
    capturedFrameCount: 0,
    missingFrames: range(config.frameCount),
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
    strictAcceptanceEffect: "none",
    authority: structuredClone(AUTHORITY),
    planningAuthority:
      "source-static-alternate-placement-path-candidate-not-executed-original-runtime-evidence",
  };
  return {
    ...unsigned,
    selectionSha256: selectionSha256(unsigned, config.frameCount),
  };
}

function mergeExistingEvidence(expected, existing, config) {
  if (!existing) return expected;
  invariant(
    canonicalJson(withoutMutableFields(existing))
      === canonicalJson(withoutMutableFields(expected)),
    `${config.animationId}: alternate placement immutable identity drifted`,
  );
  const merged = structuredClone(expected);
  for (const field of MUTABLE_FIELDS) merged[field] = structuredClone(existing[field]);
  const selection = normalizeRequirementSelection(merged, config.frameCount);
  validateSupplementalPartialRequirementBoundary(
    merged,
    selection,
    `${config.animationId}/${config.requirementId}`,
  );
  invariant(
    merged.blockingEvidence.length >= expected.blockingEvidence.length
      && canonicalJson(merged.blockingEvidence.slice(
        0,
        expected.blockingEvidence.length,
      )) === canonicalJson(expected.blockingEvidence),
    `${config.animationId}: alternate placement blocking evidence lost its source bindings`,
  );
  return merged;
}

async function buildArtifacts() {
  const [
    generatorRecord,
    rootAuditRecord,
    observabilityRecord,
    assetReportRecord,
  ] = await Promise.all([
    record(path.relative(ROOT, SCRIPT_PATH)),
    record(ROOT_AUDIT_PATH),
    record(OBSERVABILITY_PATH),
    record(ASSET_REPORT_PATH),
  ]);
  const rootAudit = JSON.parse(rootAuditRecord.bytesValue);
  const observability = JSON.parse(observabilityRecord.bytesValue);
  const sourceBindings = {
    rootEntryPlacementAudit: binding(rootAuditRecord),
    parentCompositeObservabilityAudit: binding(observabilityRecord),
    parentCompositeAssetReport: binding(assetReportRecord),
  };
  const outputs = [];
  const items = [];
  for (const config of ALTERNATE_PLACEMENT_CONFIGS) {
    const coveragePath =
      `migrations/${config.animationId}/evidence/full-frame-coverage.json`;
    const coverageRecord = await record(coveragePath);
    const coverage = JSON.parse(coverageRecord.bytesValue);
    invariant(
      coverage.schemaVersion === 2
        && coverage.animationId === config.animationId
        && Array.isArray(coverage.requirements),
      `${config.animationId}: coverage identity drifted`,
    );
    const existing = coverage.requirements.find(
      ({requirementId}) => requirementId === config.requirementId,
    );
    const canonicalRequirements = coverage.requirements.filter(
      ({requirementId}) => requirementId !== config.requirementId,
    );
    invariant(
      canonicalRequirements.length === config.expectedCanonicalRequirementCount,
      `${config.animationId}: canonical requirement count drifted`,
    );
    const canonicalRequirement = canonicalRequirements.find(
      ({requirementId}) => requirementId === config.canonicalRequirementId,
    );
    const canonicalCoverageBytes = Buffer.from(pretty({
      ...coverage,
      requirements: canonicalRequirements,
    }));
    const pathIdentity = pathEvidence(
      rootAudit,
      observability,
      config,
    );
    const expected = buildAlternatePlacementRequirement({
      canonicalRequirement,
      config,
      pathIdentity,
      rootAuditBinding: sourceBindings.rootEntryPlacementAudit,
      observabilityBinding: sourceBindings.parentCompositeObservabilityAudit,
      assetReportBinding: sourceBindings.parentCompositeAssetReport,
    });
    const supplemental = mergeExistingEvidence(expected, existing, config);
    const updatedCoverage = {
      ...coverage,
      requirements: [...canonicalRequirements, supplemental],
    };
    const bytes = Buffer.from(pretty(updatedCoverage));
    outputs.push({
      relativePath: coveragePath,
      expectedBefore: coverageRecord.bytesValue,
      bytes,
    });
    items.push({
      animationId: config.animationId,
      canonicalRequirementId: config.canonicalRequirementId,
      supplementalRequirementId: config.requirementId,
      frameDomainId: config.frameDomainId,
      pathIndex: config.pathIndex,
      selectedFrameCount: config.frameCount,
      entryStateSha256: supplemental.entryStateSha256,
      selectionSha256: supplemental.selectionSha256,
      captureAdopted: supplemental.capturedFrameCount === config.frameCount,
      coverageBefore: {
        path: coveragePath,
        bytes: canonicalCoverageBytes.length,
        sha256: sha256(canonicalCoverageBytes),
      },
      coverageAfter: {
        path: coveragePath,
        bytes: bytes.length,
        sha256: sha256(bytes),
      },
      strictAcceptanceEffect: "none",
    });
  }
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-alternate-placement-coverage",
    generator: binding(generatorRecord),
    inputs: sourceBindings,
    items,
    summary: {
      animationCount: 3,
      supplementalPlacementRequirementCount: 3,
      selectedFrameCount: 57,
      adoptedRequirementCount:
        items.filter(({captureAdopted}) => captureAdopted).length,
      canonicalStrictRequirementCountChanged: 0,
      originalRuntimeSessions: 0,
      fidelityAcceptances: 0,
      humanDecisions: 0,
      ownerDecisions: 0,
      strictCompletions: 0,
    },
    authority: AUTHORITY,
    strictAcceptanceEffect: "none",
  };
  const reportBytes = Buffer.from(pretty(report));
  const markdownBytes = Buffer.from(markdown(report));
  const existingReport = await record(REPORT_PATH, {optional: true});
  const existingMarkdown = await record(MARKDOWN_PATH, {optional: true});
  outputs.push({
    relativePath: REPORT_PATH,
    expectedBefore: existingReport?.bytesValue ?? null,
    bytes: reportBytes,
  });
  outputs.push({
    relativePath: MARKDOWN_PATH,
    expectedBefore: existingMarkdown?.bytesValue ?? null,
    bytes: markdownBytes,
  });
  return {outputs, report};
}

function markdown(report) {
  const rows = report.items.map((item) =>
    `| \`${item.animationId}\` | \`${item.frameDomainId}\` | ${item.pathIndex} | ${item.selectedFrameCount} | \`${item.supplementalRequirementId}\` | ${item.captureAdopted ? "yes" : "no"} |`,
  ).join("\n");
  return `# G4 L3 alternate placement coverage\n\n`
    + "Three schema-v2 `placement-path` requirements retain complete alternate source placement identities without entering the canonical strict denominator.\n\n"
    + "| Animation | Domain | Path | Frames | Supplemental requirement | Capture adopted |\n"
    + "|---|---|---:|---:|---|---|\n"
    + `${rows}\n\n`
    + "Current-JS captures remain non-authoritative. Original-runtime, fidelity, audio, human, Owner, strict, release, and publication gates remain closed.\n";
}

async function checkOutputs(outputs) {
  for (const output of outputs) {
    const current = await record(output.relativePath);
    invariant(
      current.bytesValue.equals(output.bytes),
      `${output.relativePath} is stale`,
    );
  }
}

export async function run({write = false} = {}) {
  const artifacts = await buildArtifacts();
  if (write) {
    const changedOutputs = artifacts.outputs.filter(
      (output) => output.expectedBefore === null
        || !Buffer.from(output.expectedBefore).equals(output.bytes),
    );
    if (!changedOutputs.length) return artifacts.report;
    await writeApprovalTransaction(changedOutputs.map((output) => ({
      filePath: projectPath(output.relativePath),
      value: output.bytes,
      expectedBefore: output.expectedBefore,
    })));
  } else {
    await checkOutputs(artifacts.outputs);
  }
  return artifacts.report;
}

export function parseArguments(argv) {
  invariant(argv.length <= 1, "Use zero arguments for check mode or --write");
  if (!argv.length) return {write: false};
  invariant(argv[0] === "--write", `Unknown option: ${argv[0]}`);
  return {write: true};
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  run(parseArguments(process.argv.slice(2))).then((report) => {
    process.stdout.write(
      `PASS: ${report.summary.supplementalPlacementRequirementCount} alternate placement requirements / ${report.summary.selectedFrameCount} frames / strict denominator delta 0.\n`,
    );
  }).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
