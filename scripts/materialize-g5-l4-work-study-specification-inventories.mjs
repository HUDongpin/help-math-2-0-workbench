#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  lstat,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {collectSwfAssetDefinitions} from "./build-g4-l3-swf-asset-definition-census.mjs";
import {
  SUCCESSOR_RECEIPT_NAME as ASSET_SUCCESSOR_RECEIPT_NAME,
  parseCsv as parseSourceDerivedCsv,
  validateSuccessorReceipt as validateAssetSuccessorReceipt,
} from "./materialize-g5-l4-source-derived-asset-inventories.mjs";
import {
  RECEIPT_PATH as KEYFRAME_SUCCESSOR_RECEIPT_PATH,
  validateSuccessorReceipt as validateKeyframeSuccessorReceipt,
} from "./materialize-g5-l4-source-derived-keyframe-candidates.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const G5_L4_RELEASE_ID = "lesson-g05-l04-number-lines";
export const G5_L4_WORK_STUDY_SPECIFICATION_IDS = Object.freeze([
  "shell-course-g05-l04-index-local",
  "course-g05-l04-rw-002",
  "course-g05-l04-in-019",
  "course-g05-l04-fq-002",
]);

const RELEASES_PATH = "catalog/lesson-releases.json";
const CALIBRATION_PATH = "catalog/lesson-release-calibration-sets.json";
const ASSET_TEMPLATE_PATH = "templates/flash-migration/asset-inventory.csv";
const KEYFRAME_TEMPLATE_PATH = "templates/flash-migration/keyframes.csv";
const ASSET_PARSER_PATH = "scripts/build-g4-l3-swf-asset-definition-census.mjs";

const SOURCE_SCOPE_NAME = "audit/machine/g5-l4-source-scope-binding.json";
const MACHINE_REPORT_NAME = "audit/machine/report.json";
const FRAME_CANDIDATES_NAME = "audit/machine/swf-frame-domain-candidates.json";
const SCENARIO_NAME = "audit/scenario-inventory.json";
const COVERAGE_NAME = "evidence/full-frame-coverage.json";
const STRICT_READINESS_NAME = "audit/strict-readiness.json";
const CANONICAL_ASSET_NAME = "asset-inventory.csv";
const CANONICAL_KEYFRAME_NAME = "keyframes.csv";
const CENSUS_NAME = "audit/machine/swf-asset-definition-census.json";
const MACHINE_INVENTORY_NAME = "audit/machine/swf-definition-inventory.csv";
const RECEIPT_NAME = "audit/machine/specification-inventory-readiness.json";

const ASSET_HEADER = Object.freeze([
  "asset_id",
  "swf_character_id",
  "library_symbol",
  "type",
  "source_file",
  "source_frame",
  "exported_file",
  "sha256",
  "format",
  "dimensions_or_bounds",
  "font_glyphs",
  "transformation",
  "confidence",
  "license_or_provenance",
  "notes",
]);

const KEYFRAME_HEADER = Object.freeze([
  "frame",
  "requirement_id",
  "frame_domain_id",
  "trace_id",
  "entry_state_sha256",
  "time_ms",
  "scenario",
  "language",
  "kind",
  "expected_state",
  "trigger",
  "baseline_file",
  "baseline_sha256",
  "implementation_file",
  "implementation_sha256",
  "diff_file",
  "diff_sha256",
  "normalized_rmse",
  "timing_result",
  "visual_result",
  "evidence_source",
  "reviewer",
  "notes",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(rows) {
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

function stableProjectionSha256(value) {
  return sha256(stableJson(value));
}

function assertAllFalse(value, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label} is absent`);
  for (const [key, state] of Object.entries(value)) {
    invariant(state === false, `${label}.${key} must remain false`);
  }
}

function assertPendingReview(review, label) {
  invariant(review && typeof review === "object", `${label} is absent`);
  invariant(review.decision === "pending", `${label}.decision must remain pending`);
  invariant(review.reviewer == null || review.reviewer === "", `${label}.reviewer must remain empty`);
  invariant(review.reviewedAt == null || review.reviewedAt === "", `${label}.reviewedAt must remain empty`);
  invariant(review.signatureEnvelope == null, `${label}.signatureEnvelope must remain absent`);
}

async function exists(filePath) {
  try {
    await lstat(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function contained(root, target) {
  const relative = path.relative(root, target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function assertOrdinaryProjectFile(root, relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0, `${label} path is absent`);
  invariant(!path.isAbsolute(relativePath), `${label} path must be project-relative`);
  const absolutePath = path.resolve(root, relativePath);
  invariant(contained(root, absolutePath), `${label} escapes the project root`);
  const [rootReal, fileReal, info] = await Promise.all([
    realpath(root),
    realpath(absolutePath),
    lstat(absolutePath),
  ]);
  invariant(contained(rootReal, fileReal), `${label} resolves outside the project root`);
  invariant(info.isFile() && !info.isSymbolicLink(), `${label} must be an ordinary file`);
  invariant(info.nlink === 1, `${label} must not have multiple hard links`);
  return absolutePath;
}

async function readRawBinding(root, relativePath, label) {
  const absolutePath = await assertOrdinaryProjectFile(root, relativePath, label);
  const bytes = await readFile(absolutePath);
  return {
    bytes,
    binding: {
      path: portable(relativePath),
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
  };
}

async function readJsonBinding(root, relativePath, label) {
  const raw = await readRawBinding(root, relativePath, label);
  let value;
  try {
    value = JSON.parse(raw.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
  return {...raw, value};
}

export function selectG5L4WorkStudySpecificationMembers(
  releasesDocument,
  calibrationDocument,
  requestedIds = G5_L4_WORK_STUDY_SPECIFICATION_IDS,
) {
  invariant(releasesDocument?.schemaVersion === 1 && Array.isArray(releasesDocument.releases),
    "lesson-release catalog schema is invalid");
  const releases = releasesDocument.releases.filter(({releaseId}) => releaseId === G5_L4_RELEASE_ID);
  invariant(releases.length === 1, `expected exactly one ${G5_L4_RELEASE_ID} release`);
  const release = releases[0];
  invariant(release.publicationMode === "atomic" && release.expectedCounts?.members === 55,
    `${G5_L4_RELEASE_ID} release shape changed`);
  invariant(Array.isArray(release.members) && release.members.length === 55,
    `${G5_L4_RELEASE_ID} must contain 55 members`);
  invariant(new Set(release.members.map(({animationId}) => animationId)).size === 55,
    `${G5_L4_RELEASE_ID} contains duplicate member IDs`);

  invariant(calibrationDocument?.schemaVersion === 1 && Array.isArray(calibrationDocument.calibrationSets),
    "calibration-set catalog schema is invalid");
  const calibrationSets = calibrationDocument.calibrationSets
    .filter(({releaseId}) => releaseId === G5_L4_RELEASE_ID);
  invariant(calibrationSets.length === 1, `expected exactly one ${G5_L4_RELEASE_ID} calibration set`);
  const calibration = calibrationSets[0];
  invariant(Array.isArray(calibration.humanWorkStudy?.memberAnimationIds),
    `${G5_L4_RELEASE_ID} human work-study selection is absent`);
  invariant(
    JSON.stringify(calibration.humanWorkStudy.memberAnimationIds) ===
      JSON.stringify(G5_L4_WORK_STUDY_SPECIFICATION_IDS),
    `${G5_L4_RELEASE_ID} work-study target selection changed`,
  );

  invariant(Array.isArray(requestedIds) && requestedIds.length > 0, "at least one target is required");
  invariant(new Set(requestedIds).size === requestedIds.length, "duplicate target ID requested");
  for (const animationId of requestedIds) {
    invariant(G5_L4_WORK_STUDY_SPECIFICATION_IDS.includes(animationId),
      `unknown G5 L4 work-study specification target: ${animationId}`);
  }
  const requested = new Set(requestedIds);
  const releaseById = new Map(release.members.map((member) => [member.animationId, member]));
  return {
    release,
    calibration,
    members: G5_L4_WORK_STUDY_SPECIFICATION_IDS
      .filter((animationId) => requested.has(animationId))
      .map((animationId) => {
        const member = releaseById.get(animationId);
        invariant(member, `${animationId} is not a ${G5_L4_RELEASE_ID} member`);
        return member;
      }),
  };
}

function validatePendingCoverage(manifest, coverage) {
  invariant(coverage?.schemaVersion === 2 && coverage.animationId === manifest.animationId,
    `${manifest.animationId}: coverage-v2 identity is invalid`);
  invariant(Array.isArray(coverage.requirements) && coverage.requirements.length > 0,
    `${manifest.animationId}: coverage-v2 has no requirements`);
  const seen = new Set();
  let rootRequirementCount = 0;
  let nestedRequirementCount = 0;
  const declaredDomains = new Map(
    (manifest.implementation?.frameDomains || []).map((domain) => [
      domain.id,
      domain,
    ]),
  );
  if (!declaredDomains.has("root")) {
    declaredDomains.set("root", {
      id: "root",
      kind: "root",
      frameCount: manifest.runtime?.frameCount,
    });
  }
  const candidateFrameDomain =
    manifest.implementation?.candidateState?.sourceStaticFrameDomain ?? null;
  for (const requirement of coverage.requirements) {
    const identity = [
      requirement.requirementId,
      requirement.frameDomainId,
      requirement.traceId,
      requirement.scenario,
      requirement.language,
    ].join("\u0000");
    invariant(!seen.has(identity), `${manifest.animationId}: duplicate coverage requirement identity`);
    seen.add(identity);
    const frameDomain = declaredDomains.get(requirement.frameDomainId);
    invariant(
      frameDomain &&
        (requirement.frameDomainId === "root" ||
          requirement.frameDomainId === candidateFrameDomain),
      `${manifest.animationId}: coverage claims an undeclared or non-candidate frame domain`,
    );
    if (requirement.frameDomainId === "root") rootRequirementCount += 1;
    else nestedRequirementCount += 1;
    invariant(requirement.requiredRange?.firstFrame === 1 &&
      requirement.requiredRange?.lastFrame === frameDomain.frameCount,
    `${manifest.animationId}: pending coverage range differs from its declared frame domain`);
    invariant(manifest.scenarios?.some(({id}) => id === requirement.scenario),
      `${manifest.animationId}: coverage references unknown scenario ${requirement.scenario}`);
    invariant(manifest.localization?.languages?.includes(requirement.language),
      `${manifest.animationId}: coverage references unsupported language ${requirement.language}`);
    invariant(isSha256(requirement.entryStateSha256),
      `${manifest.animationId}: coverage entry-state SHA-256 is invalid`);
    invariant(requirement.status === "pending" && requirement.baselineAuthority === "unresolved" &&
      requirement.capturedFrameCount === 0,
    `${manifest.animationId}: materializer accepts unresolved pending coverage only`);
    invariant(
      Array.isArray(requirement.missingFrames) &&
        requirement.missingFrames.length === frameDomain.frameCount &&
        requirement.missingFrames.every(
          (frame, index) => frame === index + 1,
        ),
      `${manifest.animationId}: pending coverage frame inventory is incomplete`,
    );
    invariant(
      ["baselineCaptureManifest", "baselineCaptureManifestSha256", "captureManifest",
        "captureManifestSha256", "metricsFile", "metricsSha256"]
        .every((field) => requirement[field] === ""),
      `${manifest.animationId}: coverage unexpectedly contains capture or comparison evidence`,
    );
  }
  invariant(
    rootRequirementCount === 2 &&
      nestedRequirementCount === (candidateFrameDomain ? 2 : 0),
    `${manifest.animationId}: bilingual root/nested pending coverage cardinality drifted`,
  );
  return {
    total: coverage.requirements.length,
    root: rootRequirementCount,
    nested: nestedRequirementCount,
  };
}

export function renderMachineDefinitionInventory(sourcePath, census) {
  const fonts = new Map(census.fontFacts.map((font) => [font.characterId, font]));
  const rows = [ASSET_HEADER];
  for (const definition of census.definitions) {
    const font = fonts.get(definition.characterId);
    const specific = definition.specificFacts || {};
    const details = [
      `container=${definition.containerPath}`,
      `definitionDepth=${definition.definitionDepth}`,
      `tagOrdinal=${definition.ordinal}`,
      `payloadBytes=${definition.payloadLength}`,
      `rawTagPayloadSha256=${definition.rawTagPayloadSha256}`,
      `exactTagIdentitySha256=${definition.exactTagIdentitySha256}`,
    ];
    if (specific.declaredFrameCount != null) {
      details.push(`declaredFrameCount=${specific.declaredFrameCount}`);
    }
    if (specific.sampleCount != null) {
      details.push(`declaredSampleCount=${specific.sampleCount}`);
    }
    rows.push([
      `swf-definition-${String(definition.ordinal).padStart(5, "0")}`,
      definition.characterId,
      font?.exactName || "",
      definition.category,
      sourcePath,
      "",
      "",
      definition.rawTagPayloadSha256,
      definition.tagName,
      "",
      font?.glyphCount ?? "",
      "none; original SWF tag payload indexed without visual or renderer export",
      "machine-extracted-definition",
      "owner-provided SWF",
      `${details.join("; ")}; runtime reachability, placement, bounds, authoring semantics, export, and renderer suitability remain unresolved.`,
    ]);
  }
  return csv(rows);
}

function buildCensus({
  member,
  manifest,
  sourceBinding,
  parsed,
  generatedBy,
  inputs,
}) {
  const sourceModel = manifest.source.fla
    ? "paired-fla-and-shipped-swf"
    : "shipped-swf-only";
  const census = {
    schemaVersion: 1,
    artifactType: "g5-l4-work-study-swf-asset-definition-census",
    releaseId: G5_L4_RELEASE_ID,
    animationId: member.animationId,
    assetId: member.assetId,
    generatedBy,
    source: {
      path: sourceBinding.path,
      bytes: sourceBinding.bytes,
      sha256: sourceBinding.sha256,
      physicalHashVerified: true,
      sourceModel,
    },
    sourceBindings: inputs,
    method: {
      parser: "Reusable direct binary SWF tag parser after lossless CWS inflation",
      recursion: "Root stream plus structurally nested DefineSprite streams",
      definitionIdentity:
        "SWF tag code plus SHA-256 of the complete uncompressed raw tag payload; local CharacterID remains included",
      establishesRuntimeVisibility: false,
      establishesAuthoringSemantics: false,
      exportsRendererAssets: false,
      authorizesRendererReuse: false,
    },
    sourceFormat: parsed.sourceFormat,
    tagStream: parsed.tagStream,
    definitions: parsed.definitions,
    companions: parsed.companions,
    fontFacts: parsed.fontFacts,
    fontCompanionFacts: parsed.fontCompanionFacts,
    textFacts: parsed.textFacts,
    exactTextOccurrences: parsed.exactTextOccurrences,
    summary: {
      definitionCount: parsed.tagStream.definitionCount,
      companionCount: parsed.tagStream.companionCount,
      categoryCounts: parsed.tagStream.categoryCounts,
      exactTextOccurrenceCount: parsed.exactTextOccurrences.length,
      rendererAssetExportCount: 0,
      runtimePlacementDispositionCount: 0,
      finalCanonicalAssetSpecificationComplete: false,
    },
    acceptance: {
      originalRuntime: false,
      implementation: false,
      fidelity: false,
      audio: false,
      humanReview: false,
      ownerAcceptance: false,
      strictCompletion: false,
      publication: false,
    },
    limitations: [
      "Definition presence is static structure, not runtime reachability, placement, visibility, language behavior, interaction causality, or terminal/Replay proof.",
      sourceModel === "paired-fla-and-shipped-swf"
        ? "The paired FLA is hash-bound only; this generator does not open Animate or establish authoring-library names, layers, or authoring acceptance."
        : "No paired FLA exists; this census must not invent authoring-library names, layers, or source structure.",
      "Canonical asset-inventory.csv contains source-derived definition candidate rows only; placement, bounds, editable export, transformation, visual confirmation, and renderer disposition remain unresolved.",
    ],
    strictAcceptanceEffect: "none; machine-only asset-definition census",
  };
  census.artifactFingerprintSha256 = stableProjectionSha256(census);
  return census;
}

function validateStrictReadiness(report, manifest) {
  const candidate =
    Boolean(manifest.implementation?.candidateState);
  invariant(report?.schemaVersion === 3 &&
    report.evidenceKind === "course-shell-strict-readiness" &&
    report.animationId === manifest.animationId &&
    report.releaseId === G5_L4_RELEASE_ID,
  `${manifest.animationId}: strict-readiness identity is invalid`);
  invariant(report.runtimeAcquisitionReadiness?.runtimeSessionsExecuted === 0,
    `${manifest.animationId}: original-runtime session count must remain zero`);
  invariant(report.implementationReadiness?.implementationAuthorized === false &&
    report.implementationReadiness?.currentJavaScriptCandidate === candidate &&
    report.implementationReadiness?.rendererSelected === candidate &&
    report.implementationReadiness?.routeDeclared === candidate &&
    report.implementationReadiness?.fullFrameComparisonAccepted === false,
  `${manifest.animationId}: strict-readiness crossed the implementation/fidelity boundary`);
  invariant(report.acceptance?.acceptanceNeutral === true,
    `${manifest.animationId}: strict-readiness must remain acceptance-neutral`);
  assertAllFalse(
    Object.fromEntries(Object.entries(report.acceptance)
      .filter(([key]) => key !== "acceptanceNeutral")),
    `${manifest.animationId}: strict-readiness acceptance`,
  );
  for (const [key, review] of Object.entries(report.review || {})) {
    assertPendingReview(review, `${manifest.animationId}: strict-readiness review.${key}`);
  }
  invariant(String(report.strictAcceptanceEffect).startsWith("none"),
    `${manifest.animationId}: strict-readiness has a non-neutral effect`);
}

function validateReceipt(report) {
  invariant([1, 2].includes(report?.schemaVersion) &&
    report.artifactType === "g5-l4-work-study-specification-inventory-readiness" &&
    report.releaseId === G5_L4_RELEASE_ID &&
    G5_L4_WORK_STUDY_SPECIFICATION_IDS.includes(report.animationId),
  "specification inventory readiness identity is invalid");
  invariant(report.generatedBy?.path ===
    "scripts/materialize-g5-l4-work-study-specification-inventories.mjs" &&
    isSha256(report.generatedBy.sha256),
  `${report.animationId}: generator binding is invalid`);
  for (const output of Object.values(report.outputs || {})) {
    invariant(typeof output.path === "string" && Number.isInteger(output.bytes) &&
      output.bytes > 0 && isSha256(output.sha256),
    `${report.animationId}: output binding is invalid`);
  }
  invariant(report.canonicalFiles?.assetInventory?.changedByMaterializer === false &&
    report.canonicalFiles?.keyframes?.changedByMaterializer === false &&
    report.readiness?.assetInventoryFinalSpecificationComplete === false &&
    report.readiness?.keyframesFinalSpecificationComplete === false,
  `${report.animationId}: readiness receipt promoted canonical completeness`);
  if (report.schemaVersion === 1) {
    invariant(
      report.canonicalFiles.assetInventory.rowCount === 0 &&
        report.canonicalFiles.keyframes.rowCount === 0,
      `${report.animationId}: historical readiness receipt shape drifted`,
    );
  } else {
    invariant(
      report.canonicalFiles.assetInventory.rowCount > 0 &&
        report.canonicalFiles.assetInventory.sourceDerivedCandidateOnly === true &&
        report.canonicalFiles.keyframes.rowCount > 0 &&
        report.canonicalFiles.keyframes.sourceDerivedCandidateOnly === true &&
        report.readiness.sourceDerivedAssetCandidateRowsMaterialized === true &&
        report.readiness.sourceDerivedKeyframeCandidateRowsMaterialized === true &&
        report.readiness.authoritativeBoundaryEvidenceRowCount === 0,
      `${report.animationId}: successor readiness receipt candidate boundary drifted`,
    );
  }
  assertAllFalse(report.acceptance, `${report.animationId}: readiness receipt acceptance`);
  invariant(report.migrationStatusChanged === false &&
    report.sourceAssetsChanged === false &&
    report.strictAcceptanceEffect === "none",
  `${report.animationId}: readiness receipt crossed an evidence boundary`);
  const projected = structuredClone(report);
  delete projected.reportFingerprintSha256;
  invariant(report.reportFingerprintSha256 === stableProjectionSha256(projected),
    `${report.animationId}: readiness receipt fingerprint is stale`);
  return report;
}

function buildReceipt({
  member,
  manifest,
  generatedBy,
  source,
  sourceFla,
  inputs,
  census,
  machineInventoryBytes,
  censusBytes,
  canonicalAssetBinding,
  canonicalKeyframeBinding,
  canonicalAssetRowCount,
  canonicalKeyframeRowCount,
  coverageRequirementCounts,
  nestedCandidateCount,
}) {
  const workspaceRelative = `migrations/${member.animationId}`;
  const report = {
    schemaVersion: 2,
    artifactType: "g5-l4-work-study-specification-inventory-readiness",
    releaseId: G5_L4_RELEASE_ID,
    animationId: member.animationId,
    assetId: member.assetId,
    generatedBy,
    releaseMembership: {
      ordinal: member.ordinal,
      releaseRole: member.releaseRole,
      batchId: member.batchId,
      shardId: member.shardId,
    },
    source: {
      sourceModel: manifest.source.fla
        ? "paired-fla-and-shipped-swf"
        : "shipped-swf-only",
      swf: source,
      fla: sourceFla,
      sourceHashesVerified: true,
    },
    inputs,
    outputs: {
      assetDefinitionCensus: {
        path: `${workspaceRelative}/${CENSUS_NAME}`,
        bytes: censusBytes.length,
        sha256: sha256(censusBytes),
        definitionCount: census.summary.definitionCount,
      },
      machineDefinitionInventory: {
        path: `${workspaceRelative}/${MACHINE_INVENTORY_NAME}`,
        bytes: machineInventoryBytes.length,
        sha256: sha256(machineInventoryBytes),
        rowCount: census.summary.definitionCount,
      },
    },
    canonicalFiles: {
      assetInventory: {
        ...canonicalAssetBinding,
        rowCount: canonicalAssetRowCount,
        sourceDerivedCandidateOnly: true,
        changedByMaterializer: false,
      },
      keyframes: {
        ...canonicalKeyframeBinding,
        rowCount: canonicalKeyframeRowCount,
        sourceDerivedCandidateOnly: true,
        changedByMaterializer: false,
      },
    },
    readiness: {
      staticSwfDefinitionCensusComplete: true,
      staticSwfDefinitionCount: census.summary.definitionCount,
      machineDefinitionInventoryRowCount: census.summary.definitionCount,
      rendererAssetExportCount: 0,
      runtimePlacementDispositionCount: 0,
      unresolvedNestedDefinitionCandidateCount: nestedCandidateCount,
      pendingCoverageRequirementCount: coverageRequirementCounts.total,
      pendingRootCoverageRequirementCount: coverageRequirementCounts.root,
      pendingNestedCoverageRequirementCount: coverageRequirementCounts.nested,
      authoritativeBoundaryEvidenceRowCount: 0,
      sourceDerivedAssetCandidateRowsMaterialized: true,
      sourceDerivedKeyframeCandidateRowsMaterialized: true,
      baselineFilesBound: 0,
      implementationFilesBound: 0,
      diffFilesBound: 0,
      rmseResultsBound: 0,
      reviewerIdentitiesBound: 0,
      assetInventoryFinalSpecificationComplete: false,
      keyframesFinalSpecificationComplete: false,
      finalSpecificationReady: false,
      implementationAuthorized: false,
    },
    blockers: {
      assetInventory: [
        "Resolve runtime reachability, root/nested placement, depth, transforms, masks, bounds, visibility, and language/scenario use for every required definition.",
        "For paired sources, complete read-only authoring inspection before assigning FLA library names/layers; for SWF-only sources, retain the explicit missing-authoring limitation.",
        "Export or reconstruct editable renderer assets and record exact output hashes, transformations, provenance, and reuse dispositions.",
      ],
      keyframes: [
        "Complete every root-reachable frame-domain disposition and final coverage-v2 requirement/trace identity.",
        "Use source/authoring evidence plus authorized original-runtime natural playback to identify every visual, text, formula, count, audio, interaction, terminal, and Replay boundary.",
        "Do not convert pending root range endpoints or structural tag frames into authoritative keyframes without the missing evidence.",
        "Bind original-runtime baselines, implementation captures, diffs, RMSE, timing results, and named-human review only after those artifacts exist.",
      ],
    },
    acceptance: {
      originalRuntime: false,
      implementation: false,
      fidelity: false,
      audio: false,
      engineeringReview: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictCompletion: false,
      publication: false,
    },
    migrationStatusChanged: false,
    sourceAssetsChanged: false,
    strictAcceptanceEffect: "none",
  };
  report.reportFingerprintSha256 = stableProjectionSha256(report);
  return report;
}

async function verifyMachineOutputs(root, workspaceRelative, machineReport, animationId) {
  invariant(machineReport?.schemaVersion === 1 &&
    machineReport.animationId === animationId &&
    machineReport.source?.hashMatches === true &&
    machineReport.source.expectedSha256 === machineReport.source.observedSha256Before &&
    machineReport.source.expectedSha256 === machineReport.source.observedSha256After,
  `${animationId}: machine report identity/hash boundary is invalid`);
  invariant(Array.isArray(machineReport.outputs) && machineReport.outputs.length > 0,
    `${animationId}: machine report has no outputs`);
  for (const output of machineReport.outputs) {
    const relativePath = `${workspaceRelative}/${output.path}`;
    const binding = await readRawBinding(root, relativePath, `${animationId}: machine output ${output.path}`);
    invariant(binding.binding.bytes === output.bytes && binding.binding.sha256 === output.sha256,
      `${animationId}: machine output binding drifted: ${output.path}`);
  }
}

function statIdentity(info, {includeSize = false} = {}) {
  return {
    dev: info.dev,
    ino: info.ino,
    mode: info.mode,
    uid: info.uid,
    gid: info.gid,
    ...(includeSize ? {size: info.size, nlink: info.nlink} : {}),
  };
}

function identitiesEqual(left, right) {
  const keys = new Set([...Object.keys(left || {}), ...Object.keys(right || {})]);
  return [...keys].every((key) => left?.[key] === right?.[key]);
}

async function assertSafeOutput(root, relativePath) {
  invariant(typeof relativePath === "string" && relativePath.startsWith("migrations/"),
    `output must remain under migrations/: ${relativePath}`);
  const absolutePath = path.resolve(root, relativePath);
  invariant(contained(root, absolutePath), `output escapes project root: ${relativePath}`);
  const rootInfo = await lstat(root);
  invariant(rootInfo.isDirectory() && !rootInfo.isSymbolicLink(),
    `project root must be a real directory: ${root}`);
  const rootReal = await realpath(root);
  const ancestors = [{
    absolutePath: root,
    relativePath: ".",
    identity: statIdentity(rootInfo),
  }];
  let cursor = root;
  const parentRelative = path.relative(root, path.dirname(absolutePath));
  for (const component of parentRelative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    invariant(await exists(cursor),
      `output parent must already exist: ${portable(path.relative(root, cursor))}`);
    const info = await lstat(cursor);
    invariant(info.isDirectory() && !info.isSymbolicLink(),
      `output parent must be a real directory: ${portable(path.relative(root, cursor))}`);
    invariant(contained(rootReal, await realpath(cursor)),
      `output parent resolves outside project root: ${portable(path.relative(root, cursor))}`);
    ancestors.push({
      absolutePath: cursor,
      relativePath: portable(path.relative(root, cursor)),
      identity: statIdentity(info),
    });
  }
  let targetIdentity = null;
  if (await exists(absolutePath)) {
    const info = await lstat(absolutePath);
    invariant(info.isFile() && !info.isSymbolicLink(),
      `output must be an ordinary file: ${relativePath}`);
    invariant(info.nlink === 1, `output must not have multiple hard links: ${relativePath}`);
    targetIdentity = statIdentity(info, {includeSize: true});
  }
  return {absolutePath, ancestors, targetIdentity, rootReal};
}

async function currentOutputState(root, relativePath) {
  const safety = await assertSafeOutput(root, relativePath);
  if (safety.targetIdentity === null) return {...safety, priorBytes: null};
  const priorBytes = await readFile(safety.absolutePath);
  const afterRead = await lstat(safety.absolutePath);
  invariant(afterRead.isFile() && !afterRead.isSymbolicLink() && afterRead.nlink === 1 &&
    identitiesEqual(safety.targetIdentity, statIdentity(afterRead, {includeSize: true})),
  `output identity changed while reading prior bytes: ${relativePath}`);
  invariant(priorBytes.length === safety.targetIdentity.size,
    `output size changed while reading prior bytes: ${relativePath}`);
  return {
    ...safety,
    priorBytes,
    priorSha256: sha256(priorBytes),
  };
}

async function requirePriorOwnership(root, report, relativePath, outputKey) {
  const output = report.outputs?.[outputKey];
  invariant(output?.path === relativePath,
    `${report.animationId}: prior receipt does not own ${relativePath}`);
  const current = await readRawBinding(root, relativePath, `${report.animationId}: prior ${outputKey}`);
  invariant(current.binding.bytes === output.bytes && current.binding.sha256 === output.sha256,
    `${report.animationId}: refusing to overwrite modified ${relativePath}`);
}

async function prepareTarget({
  root,
  member,
  releaseBinding,
  calibrationBinding,
  assetTemplate,
  keyframeTemplate,
  keyframeSuccessorInput,
  generatedBy,
}) {
  const workspaceRelative = `migrations/${member.animationId}`;
  const paths = {
    manifest: `${workspaceRelative}/migration.json`,
    sourceScope: `${workspaceRelative}/${SOURCE_SCOPE_NAME}`,
    machineReport: `${workspaceRelative}/${MACHINE_REPORT_NAME}`,
    frameCandidates: `${workspaceRelative}/${FRAME_CANDIDATES_NAME}`,
    scenario: `${workspaceRelative}/${SCENARIO_NAME}`,
    coverage: `${workspaceRelative}/${COVERAGE_NAME}`,
    strictReadiness: `${workspaceRelative}/${STRICT_READINESS_NAME}`,
    canonicalAsset: `${workspaceRelative}/${CANONICAL_ASSET_NAME}`,
    canonicalKeyframes: `${workspaceRelative}/${CANONICAL_KEYFRAME_NAME}`,
    assetSuccessorReceipt:
      `${workspaceRelative}/audit/machine/${ASSET_SUCCESSOR_RECEIPT_NAME}`,
    census: `${workspaceRelative}/${CENSUS_NAME}`,
    machineInventory: `${workspaceRelative}/${MACHINE_INVENTORY_NAME}`,
    receipt: `${workspaceRelative}/${RECEIPT_NAME}`,
  };
  const [
    manifestInput,
    scopeInput,
    machineInput,
    frameInput,
    scenarioInput,
    coverageInput,
    strictInput,
    canonicalAssetInput,
    canonicalKeyframeInput,
    assetSuccessorInput,
  ] = await Promise.all([
    readJsonBinding(root, paths.manifest, `${member.animationId}: migration manifest`),
    readJsonBinding(root, paths.sourceScope, `${member.animationId}: source-scope binding`),
    readJsonBinding(root, paths.machineReport, `${member.animationId}: machine report`),
    readJsonBinding(root, paths.frameCandidates, `${member.animationId}: frame-domain candidates`),
    readJsonBinding(root, paths.scenario, `${member.animationId}: scenario inventory`),
    readJsonBinding(root, paths.coverage, `${member.animationId}: coverage-v2`),
    readJsonBinding(root, paths.strictReadiness, `${member.animationId}: strict-readiness`),
    readRawBinding(root, paths.canonicalAsset, `${member.animationId}: canonical asset inventory`),
    readRawBinding(root, paths.canonicalKeyframes, `${member.animationId}: canonical keyframes`),
    readJsonBinding(
      root,
      paths.assetSuccessorReceipt,
      `${member.animationId}: source-derived asset successor receipt`,
    ),
  ]);

  const manifest = manifestInput.value;
  invariant(manifest.animationId === member.animationId && manifest.assetId === member.assetId,
    `${member.animationId}: workspace identity differs from release membership`);
  invariant(manifest.source?.swfSha256 === member.source.sha256 &&
    manifest.source.swf.endsWith(member.source.path),
  `${member.animationId}: manifest SWF differs from release membership`);
  invariant(manifest.status !== "complete",
    `${member.animationId}: materializer cannot operate on a complete migration`);
  for (const [key, review] of Object.entries(manifest.acceptance || {})) {
    if (key.endsWith("Review")) assertPendingReview(review, `${member.animationId}: manifest ${key}`);
  }
  const assetRows = parseSourceDerivedCsv(
    canonicalAssetInput.bytes.toString("utf8"),
    ASSET_HEADER,
    `${member.animationId}: canonical asset inventory`,
  ).rows;
  const keyframeRows = parseSourceDerivedCsv(
    canonicalKeyframeInput.bytes.toString("utf8"),
    KEYFRAME_HEADER,
    `${member.animationId}: canonical keyframes`,
  ).rows;
  invariant(assetRows.length > 0,
    `${member.animationId}: source-derived asset candidate rows are absent`);
  invariant(keyframeRows.length > 0,
    `${member.animationId}: source-derived keyframe candidate rows are absent`);
  const assetSuccessor = validateAssetSuccessorReceipt(
    assetSuccessorInput.value,
    member,
  );
  invariant(
    assetSuccessor.output.assetInventory.path === canonicalAssetInput.binding.path &&
      assetSuccessor.output.assetInventory.bytes === canonicalAssetInput.binding.bytes &&
      assetSuccessor.output.assetInventory.sha256 === canonicalAssetInput.binding.sha256 &&
      assetSuccessor.output.assetInventory.rowCount === assetRows.length,
    `${member.animationId}: asset successor does not bind the canonical candidate rows`,
  );
  const keyframeMember = keyframeSuccessorInput.value.members.find(
    ({animationId}) => animationId === member.animationId,
  );
  invariant(
    keyframeMember?.output?.after?.path === canonicalKeyframeInput.binding.path &&
      keyframeMember.output.after.bytes === canonicalKeyframeInput.binding.bytes &&
      keyframeMember.output.after.sha256 === canonicalKeyframeInput.binding.sha256 &&
      keyframeMember.derivation?.rowCount === keyframeRows.length &&
      keyframeMember.derivation.authoritativeBaselineKeyframeCount === 0 &&
      keyframeMember.derivation.observedRuntimeRowCount === 0,
    `${member.animationId}: keyframe successor does not bind the canonical candidate rows`,
  );

  const sourceInput = await readRawBinding(root, manifest.source.swf, `${member.animationId}: physical SWF`);
  invariant(sourceInput.binding.sha256 === member.source.sha256 &&
    sourceInput.binding.sha256 === manifest.source.swfSha256 &&
    member.assetId === `swf-${sourceInput.binding.sha256}`,
  `${member.animationId}: physical SWF identity differs from release/manifest`);
  let sourceFla = null;
  if (manifest.source.fla) {
    const flaInput = await readRawBinding(root, manifest.source.fla, `${member.animationId}: physical FLA`);
    invariant(flaInput.binding.sha256 === manifest.source.flaSha256,
      `${member.animationId}: physical FLA hash differs from manifest`);
    sourceFla = {...flaInput.binding, physicalHashVerified: true};
  } else {
    invariant(manifest.source.flaSha256 === "" && manifest.source.pairedFlaStatus === "missing",
      `${member.animationId}: SWF-only source model is inconsistent`);
  }

  const scope = scopeInput.value;
  invariant(scope?.schemaVersion === 1 &&
    scope.artifactType === "g5-l4-source-scope-binding" &&
    scope.releaseId === G5_L4_RELEASE_ID &&
    scope.member?.animationId === member.animationId &&
    scope.member?.assetId === member.assetId &&
    scope.member?.source?.swf?.sha256 === sourceInput.binding.sha256,
  `${member.animationId}: source-scope binding is invalid`);
  const expectedSourceModel = sourceFla ? "paired-fla-and-shipped-swf" : "shipped-swf-only";
  invariant(scope.member.source.sourceModel === expectedSourceModel,
    `${member.animationId}: source model differs from frozen scope`);
  if (sourceFla) {
    invariant(scope.member.source.fla?.sha256 === sourceFla.sha256,
      `${member.animationId}: frozen FLA binding differs from physical source`);
  } else {
    invariant(scope.member.source.fla === null,
      `${member.animationId}: SWF-only frozen scope unexpectedly contains FLA`);
  }

  await verifyMachineOutputs(root, workspaceRelative, machineInput.value, member.animationId);
  invariant(machineInput.value.source.expectedSha256 === sourceInput.binding.sha256,
    `${member.animationId}: machine report SWF binding differs`);
  const frameCandidates = frameInput.value;
  invariant(frameCandidates?.schemaVersion === 1 &&
    frameCandidates.artifactType === "swf-frame-domain-candidates" &&
    frameCandidates.animationId === member.animationId &&
    frameCandidates.source?.sha256 === sourceInput.binding.sha256 &&
    frameCandidates.root?.frameCount === manifest.runtime.frameCount &&
    frameCandidates.summary?.completeRootReachableDomainInventory === false &&
    frameCandidates.summary?.unresolvedReachabilityCount ===
      frameCandidates.summary?.nestedDefinitionCount,
  `${member.animationId}: frame-domain candidates crossed the unresolved boundary`);
  invariant(scenarioInput.value?.schemaVersion === 1 &&
    scenarioInput.value.animationId === member.animationId &&
    scenarioInput.value.inventoryStatus === "static-exhaustive-runtime-unverified" &&
    Array.isArray(scenarioInput.value.authoritativeRuntimeEvidence) &&
    scenarioInput.value.authoritativeRuntimeEvidence.length === 0 &&
    scenarioInput.value.migrationStatusChanged === false &&
    String(scenarioInput.value.strictAcceptanceEffect).startsWith("none"),
  `${member.animationId}: scenario inventory crossed its static boundary`);
  const coverageRequirementCounts =
    validatePendingCoverage(manifest, coverageInput.value);
  validateStrictReadiness(strictInput.value, manifest);

  const parsed = collectSwfAssetDefinitions(sourceInput.bytes);
  invariant(parsed.sourceFormat.rootFrameCount === manifest.runtime.frameCount &&
    parsed.sourceFormat.fps === manifest.runtime.fps &&
    parsed.tagStream.definitionCount > 0,
  `${member.animationId}: direct SWF parse differs from manifest root timeline`);

  const inputs = {
    lessonReleaseCatalog: releaseBinding,
    calibrationCatalog: calibrationBinding,
    migrationManifest: manifestInput.binding,
    sourceScopeBinding: scopeInput.binding,
    machineReport: machineInput.binding,
    frameDomainCandidates: frameInput.binding,
    scenarioInventory: scenarioInput.binding,
    fullFrameCoverage: coverageInput.binding,
    strictReadiness: strictInput.binding,
    sourceDerivedAssetSuccessorReceipt: assetSuccessorInput.binding,
    sourceDerivedKeyframeSuccessorReceipt: keyframeSuccessorInput.binding,
  };
  const census = buildCensus({
    member,
    manifest,
    sourceBinding: sourceInput.binding,
    parsed,
    generatedBy,
    inputs,
  });
  const censusBytes = Buffer.from(stableJson(census));
  const machineInventoryBytes = Buffer.from(renderMachineDefinitionInventory(
    manifest.source.swf,
    census,
  ));
  const receipt = buildReceipt({
    member,
    manifest,
    generatedBy,
    source: {...sourceInput.binding, physicalHashVerified: true},
    sourceFla,
    inputs,
    census,
    censusBytes,
    machineInventoryBytes,
    canonicalAssetBinding: canonicalAssetInput.binding,
    canonicalKeyframeBinding: canonicalKeyframeInput.binding,
    canonicalAssetRowCount: assetRows.length,
    canonicalKeyframeRowCount: keyframeRows.length,
    coverageRequirementCounts,
    nestedCandidateCount: frameCandidates.summary.nestedDefinitionCount,
  });
  validateReceipt(receipt);
  const receiptBytes = Buffer.from(stableJson(receipt));

  await Promise.all([
    assertSafeOutput(root, paths.census),
    assertSafeOutput(root, paths.machineInventory),
    assertSafeOutput(root, paths.receipt),
  ]);
  if (await exists(path.join(root, paths.receipt))) {
    const priorInput = await readJsonBinding(root, paths.receipt,
      `${member.animationId}: prior specification inventory readiness`);
    const prior = validateReceipt(priorInput.value);
    invariant(prior.animationId === member.animationId && prior.assetId === member.assetId,
      `${member.animationId}: prior readiness identity mismatch`);
    await Promise.all([
      requirePriorOwnership(root, prior, paths.census, "assetDefinitionCensus"),
      requirePriorOwnership(root, prior, paths.machineInventory, "machineDefinitionInventory"),
    ]);
  } else {
    invariant(!(await exists(path.join(root, paths.census))),
      `${member.animationId}: unowned asset-definition census already exists`);
    invariant(!(await exists(path.join(root, paths.machineInventory))),
      `${member.animationId}: unowned machine definition inventory already exists`);
  }

  const desired = [
    {relativePath: paths.census, desiredBytes: censusBytes},
    {relativePath: paths.machineInventory, desiredBytes: machineInventoryBytes},
    {relativePath: paths.receipt, desiredBytes: receiptBytes},
  ];
  const outputs = [];
  for (const output of desired) {
    outputs.push({...output, ...await currentOutputState(root, output.relativePath)});
  }
  return {
    animationId: member.animationId,
    sourceModel: expectedSourceModel,
    definitionCount: census.summary.definitionCount,
    machineDefinitionRows: census.summary.definitionCount,
    canonicalAssetRows: assetRows.length,
    canonicalKeyframeRows: keyframeRows.length,
    pendingCoverageRequirements: coverageRequirementCounts.total,
    unresolvedNestedDefinitionCandidates: frameCandidates.summary.nestedDefinitionCount,
    outputs,
  };
}

async function assertAncestorsUnchanged(output) {
  for (const ancestor of output.ancestors) {
    const info = await lstat(ancestor.absolutePath);
    invariant(info.isDirectory() && !info.isSymbolicLink() &&
      identitiesEqual(ancestor.identity, statIdentity(info)),
    `output ancestor identity changed during transaction: ${ancestor.relativePath}`);
    invariant(contained(output.rootReal, await realpath(ancestor.absolutePath)),
      `output ancestor resolves outside project root during transaction: ${ancestor.relativePath}`);
  }
}

async function assertUnchanged(output) {
  await assertAncestorsUnchanged(output);
  if (output.priorBytes === null) {
    invariant(!(await exists(output.absolutePath)),
      `output appeared during transaction preparation: ${output.relativePath}`);
    return;
  }
  invariant(await exists(output.absolutePath),
    `output disappeared during transaction preparation: ${output.relativePath}`);
  const beforeRead = await lstat(output.absolutePath);
  invariant(beforeRead.isFile() && !beforeRead.isSymbolicLink() && beforeRead.nlink === 1 &&
    identitiesEqual(output.targetIdentity, statIdentity(beforeRead, {includeSize: true})),
  `output identity changed during transaction preparation: ${output.relativePath}`);
  const bytes = await readFile(output.absolutePath);
  const afterRead = await lstat(output.absolutePath);
  invariant(identitiesEqual(output.targetIdentity, statIdentity(afterRead, {includeSize: true})) &&
    sha256(bytes) === output.priorSha256 && bytes.equals(output.priorBytes),
  `output bytes changed during transaction preparation: ${output.relativePath}`);
}

async function stageBytes(output, kind, bytes) {
  const stagedPath = `${output.absolutePath}.${kind}-${process.pid}-${randomUUID()}`;
  await writeFile(stagedPath, bytes, {flag: "wx", mode: 0o600});
  const info = await lstat(stagedPath);
  invariant(info.isFile() && !info.isSymbolicLink() && info.nlink === 1,
    `staged ${kind} must be an ordinary single-link file: ${output.relativePath}`);
  const staged = {
    path: stagedPath,
    identity: statIdentity(info, {includeSize: true}),
    bytes,
    sha256: sha256(bytes),
    kind,
  };
  await assertStagedBytes(output, staged);
  return staged;
}

async function assertStagedBytes(output, staged) {
  invariant(staged?.path && await exists(staged.path),
    `staged ${staged?.kind || "transaction"} file disappeared: ${output.relativePath}`);
  const beforeRead = await lstat(staged.path);
  invariant(beforeRead.isFile() && !beforeRead.isSymbolicLink() && beforeRead.nlink === 1 &&
    identitiesEqual(staged.identity, statIdentity(beforeRead, {includeSize: true})),
  `staged ${staged.kind} identity changed: ${output.relativePath}`);
  const bytes = await readFile(staged.path);
  const afterRead = await lstat(staged.path);
  invariant(identitiesEqual(staged.identity, statIdentity(afterRead, {includeSize: true})) &&
    sha256(bytes) === staged.sha256 && bytes.equals(staged.bytes),
  `staged ${staged.kind} bytes changed: ${output.relativePath}`);
}

async function assertCommittedBytes(output) {
  await assertAncestorsUnchanged(output);
  const info = await lstat(output.absolutePath);
  invariant(info.isFile() && !info.isSymbolicLink() && info.nlink === 1 &&
    identitiesEqual(output.desiredStage.identity, statIdentity(info, {includeSize: true})),
  `committed output identity changed: ${output.relativePath}`);
  const bytes = await readFile(output.absolutePath);
  invariant(sha256(bytes) === output.desiredStage.sha256 && bytes.equals(output.desiredBytes),
    `committed output bytes changed: ${output.relativePath}`);
}

async function rollbackCommittedOutput(output) {
  await assertAncestorsUnchanged(output);
  await assertCommittedBytes(output);
  if (output.priorBytes === null) {
    await unlink(output.absolutePath);
    invariant(!(await exists(output.absolutePath)),
      `new output still exists after rollback: ${output.relativePath}`);
    return;
  }
  await assertStagedBytes(output, output.backupStage);
  const backupIdentity = output.backupStage.identity;
  await rename(output.backupStage.path, output.absolutePath);
  output.backupStage.path = null;
  const restoredInfo = await lstat(output.absolutePath);
  invariant(restoredInfo.isFile() && !restoredInfo.isSymbolicLink() &&
    restoredInfo.nlink === 1 &&
    identitiesEqual(backupIdentity, statIdentity(restoredInfo, {includeSize: true})),
  `restored output identity is invalid: ${output.relativePath}`);
  const restoredBytes = await readFile(output.absolutePath);
  invariant(sha256(restoredBytes) === output.priorSha256 &&
    restoredBytes.equals(output.priorBytes),
  `restored output bytes differ from staged backup: ${output.relativePath}`);
}

function contextualError(message, error) {
  const wrapped = new Error(`${message}: ${error.message}`);
  wrapped.cause = error;
  return wrapped;
}

async function cleanupStage(output, staged) {
  if (!staged?.path || !(await exists(staged.path))) return;
  await assertAncestorsUnchanged(output);
  const info = await lstat(staged.path);
  invariant(info.isFile() && !info.isSymbolicLink() && info.nlink === 1 &&
    identitiesEqual(staged.identity, statIdentity(info, {includeSize: true})),
  `refusing to clean modified staged ${staged.kind}: ${output.relativePath}`);
  await unlink(staged.path);
}

export async function writeTransaction(outputs, {hooks = {}} = {}) {
  invariant(Array.isArray(outputs) && outputs.length > 0, "transaction has no outputs");
  invariant(new Set(outputs.map(({absolutePath}) => absolutePath)).size === outputs.length,
    "transaction contains duplicate output paths");
  for (const [name, hook] of Object.entries(hooks || {})) {
    invariant(["afterStage", "beforeCommit", "beforeRollback"].includes(name) &&
      typeof hook === "function", `unsupported transaction hook: ${name}`);
  }

  const staged = [];
  const committed = [];
  const rollbackErrors = [];
  const cleanupErrors = [];
  let primaryError = null;
  try {
    for (const output of outputs) {
      await assertUnchanged(output);
      const desiredStage = await stageBytes(output, "desired", output.desiredBytes);
      const backupStage = output.priorBytes === null
        ? null
        : await stageBytes(output, "backup", output.priorBytes);
      staged.push({...output, desiredStage, backupStage});
    }
    if (hooks.afterStage) await hooks.afterStage({outputs: staged});
    for (const output of staged) {
      await assertUnchanged(output);
      await assertStagedBytes(output, output.desiredStage);
      if (output.backupStage) await assertStagedBytes(output, output.backupStage);
    }
    for (const [index, output] of staged.entries()) {
      await assertUnchanged(output);
      await assertStagedBytes(output, output.desiredStage);
      if (output.backupStage) await assertStagedBytes(output, output.backupStage);
      if (hooks.beforeCommit) await hooks.beforeCommit({index, output});
      await rename(output.desiredStage.path, output.absolutePath);
      output.desiredStage.path = null;
      committed.push(output);
      await assertCommittedBytes(output);
    }
  } catch (error) {
    primaryError = error;
    for (const [rollbackIndex, output] of [...committed].reverse().entries()) {
      try {
        if (hooks.beforeRollback) {
          await hooks.beforeRollback({
            rollbackIndex,
            commitIndex: staged.indexOf(output),
            output,
            primaryError,
          });
        }
        await rollbackCommittedOutput(output);
      } catch (rollbackError) {
        output.rollbackFailed = true;
        const recoveryHint = output.backupStage?.path
          ? `; staged prior-byte backup retained at ${output.backupStage.path}`
          : "";
        rollbackErrors.push(contextualError(
          `rollback failed for ${output.relativePath}${recoveryHint}`,
          rollbackError,
        ));
      }
    }
  } finally {
    for (const output of staged) {
      for (const stage of [output.desiredStage, output.backupStage]) {
        if (output.rollbackFailed && stage === output.backupStage && stage?.path) continue;
        try {
          await cleanupStage(output, stage);
        } catch (cleanupError) {
          cleanupErrors.push(contextualError(
            `staged-file cleanup failed for ${output.relativePath}`,
            cleanupError,
          ));
        }
      }
    }
  }

  if (primaryError) {
    if (rollbackErrors.length || cleanupErrors.length) {
      throw new AggregateError(
        [primaryError, ...rollbackErrors, ...cleanupErrors],
        `${outputs.length}-output transaction failed; ${rollbackErrors.length} rollback failure(s) and ` +
          `${cleanupErrors.length} cleanup failure(s) were surfaced`,
        {cause: primaryError},
      );
    }
    throw primaryError;
  }
  if (cleanupErrors.length) {
    throw new AggregateError(
      cleanupErrors,
      `${outputs.length}-output transaction committed but ` +
        `${cleanupErrors.length} staged-file cleanup failure(s) occurred`,
    );
  }
}

export async function materializeG5L4WorkStudySpecificationInventories({
  root = projectRoot,
  releaseId = G5_L4_RELEASE_ID,
  ids = G5_L4_WORK_STUDY_SPECIFICATION_IDS,
  check = false,
  dryRun = false,
  transactionHooks = {},
} = {}) {
  invariant(releaseId === G5_L4_RELEASE_ID,
    `unsupported release: ${releaseId}; expected ${G5_L4_RELEASE_ID}`);
  invariant(!(check && dryRun), "--check and --dry-run are mutually exclusive");
  const [releasesInput, calibrationInput, assetTemplate, keyframeTemplate,
    keyframeSuccessorInput, generatorBytes, parserBytes] =
    await Promise.all([
      readJsonBinding(root, RELEASES_PATH, "lesson-release catalog"),
      readJsonBinding(root, CALIBRATION_PATH, "calibration-set catalog"),
      readRawBinding(root, ASSET_TEMPLATE_PATH, "canonical asset inventory template"),
      readRawBinding(root, KEYFRAME_TEMPLATE_PATH, "canonical keyframe template"),
      readJsonBinding(
        root,
        KEYFRAME_SUCCESSOR_RECEIPT_PATH,
        "source-derived keyframe successor receipt",
      ),
      readFile(scriptPath),
      readFile(path.join(projectRoot, ASSET_PARSER_PATH)),
    ]);
  invariant(assetTemplate.bytes.equals(Buffer.from(csv([ASSET_HEADER]))),
    "canonical asset-inventory.csv template header changed");
  invariant(keyframeTemplate.bytes.equals(Buffer.from(csv([KEYFRAME_HEADER]))),
    "canonical keyframes.csv template header changed");
  validateKeyframeSuccessorReceipt(keyframeSuccessorInput.value);
  const selection = selectG5L4WorkStudySpecificationMembers(
    releasesInput.value,
    calibrationInput.value,
    ids,
  );
  const generatedBy = {
    path: "scripts/materialize-g5-l4-work-study-specification-inventories.mjs",
    version: 2,
    bytes: generatorBytes.length,
    sha256: sha256(generatorBytes),
    dependencies: {
      assetDefinitionParser: {
        path: ASSET_PARSER_PATH,
        bytes: parserBytes.length,
        sha256: sha256(parserBytes),
        importedFunction: "collectSwfAssetDefinitions",
      },
    },
  };

  const preparedTargets = [];
  for (const member of selection.members) {
    preparedTargets.push(await prepareTarget({
      root,
      member,
      releaseBinding: releasesInput.binding,
      calibrationBinding: calibrationInput.binding,
      assetTemplate,
      keyframeTemplate,
      keyframeSuccessorInput,
      generatedBy,
    }));
  }
  const outputs = preparedTargets.flatMap(({outputs: targetOutputs}) => targetOutputs);
  if (check) {
    for (const output of outputs) {
      invariant(output.priorBytes !== null && output.priorBytes.equals(output.desiredBytes),
        `${output.relativePath} is missing or stale`);
    }
  } else if (!dryRun) {
    await writeTransaction(outputs, {hooks: transactionHooks});
  }
  return {
    mode: check ? "checked" : dryRun ? "dry-run" : "materialized",
    releaseId: G5_L4_RELEASE_ID,
    targetCount: preparedTargets.length,
    outputCount: outputs.length,
    targets: preparedTargets.map(({outputs: _outputs, ...target}) => target),
    canonicalFilesChanged: false,
    sourceAssetsChanged: false,
    runtimeSessionsExecuted: 0,
    implementationAuthorized: false,
    reviewAccepted: false,
    fidelityAccepted: false,
    strictComplete: false,
    published: false,
    strictAcceptanceEffect: "none",
  };
}

export function parseArguments(argv) {
  const options = {
    root: projectRoot,
    releaseId: G5_L4_RELEASE_ID,
    ids: [],
    check: false,
    dryRun: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const next = argv[index + 1];
    if (argument === "--root") {
      invariant(next, "--root requires a value");
      options.root = path.resolve(next);
      index += 1;
    } else if (argument === "--release-id") {
      invariant(next, "--release-id requires a value");
      options.releaseId = next;
      index += 1;
    } else if (argument === "--id") {
      invariant(next, "--id requires a value");
      options.ids.push(next);
      index += 1;
    } else if (argument === "--check") {
      options.check = true;
    } else if (argument === "--dry-run") {
      options.dryRun = true;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`unknown option: ${argument}`);
    }
  }
  if (options.ids.length === 0) options.ids = [...G5_L4_WORK_STUDY_SPECIFICATION_IDS];
  invariant(!(options.check && options.dryRun), "--check and --dry-run are mutually exclusive");
  return options;
}

function usage() {
  return [
    "Usage: node scripts/materialize-g5-l4-work-study-specification-inventories.mjs [options]",
    "",
    `  --release-id ${G5_L4_RELEASE_ID}`,
    "  --id <animation-id>  Limit to an exact allowlisted work-study target; repeatable",
    "  --check              Verify deterministic outputs without writing",
    "  --dry-run            Validate and summarize without writing",
    "  --root <dir>         Override repository root for synthetic tests",
    "",
    "Writes only a machine SWF definition census, machine candidate CSV, and readiness",
    "receipt under audit/machine for the selected workspaces. It reads the current",
    "source-derived asset/keyframe candidate successors but does not rewrite either",
    "canonical CSV or promote those candidate rows to final specification evidence.",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = await materializeG5L4WorkStudySpecificationInventories(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
