import { createHash } from "node:crypto";

export const CANONICAL_PROJECTION_ENCODING = "canonical-json-v1";

export const TECHNICAL_MANIFEST_PROJECTION = Object.freeze({
  id: "help-math-technical-manifest-v1",
  excludedPaths: Object.freeze([
    "status",
    "created",
    "confidence",
    "classification",
    "audit",
    "toolVersions",
    "baseline",
    "evidence",
    "fidelity",
    "accessibility",
    "acceptance",
    "catalogEvidence",
    "implementation.candidateQa",
    "implementation.candidateMaturity",
    "implementation.candidateProductQa",
    "implementation.candidateVisualEvidence",
    "implementation.productQaEvidence",
    "implementation.productQaScope",
    "audio.catalogGroupCandidates",
    "audio.catalogExactAssociations",
    "audio.acceptance",
    "audio.authoritativeListeningComplete",
    "audio.originalHostSynchronizationComplete",
    "audio.strictAcceptance",
    "audio.structuralAuditComplete",
  ]),
});

export const TRACE_COVERAGE_PROJECTION = Object.freeze({
  id: "help-math-trace-coverage-identity-v1",
  includedRequirementPaths: Object.freeze([
    "requirementId",
    "requirementSchemaVersion",
    "coverageRole",
    "coverageGroupId",
    "scenario",
    "frameDomainId",
    "traceId",
    "language",
    "seed",
    "requiredRange",
    "requiredFrameSet",
    "selectionSha256",
    "naturalPath",
    "entryState",
    "entryStateSha256",
    "baselineAuthorityRequirement",
    "strictAcceptanceEffect",
  ]),
  excludedRequirementPaths: Object.freeze([
    "status",
    "blockingReason",
    "blockingEvidence",
    "baselineAuthority",
    "capturedFrameCount",
    "missingFrames",
    "baselineCaptureManifest",
    "baselineCaptureManifestSha256",
    "captureManifest",
    "captureManifestSha256",
    "metricsFile",
    "metricsSha256",
  ]),
});

export const SCENARIO_INVENTORY_PROJECTION = Object.freeze({
  id: "help-math-scenario-inventory-technical-v1",
  excludedPaths: Object.freeze([
    "migrationStatusAtGeneration",
    "migrationStatusChanged",
    "evidenceIndex[artifactId=migration-manifest]",
  ]),
});

export const FQ_AUDIO_SOURCE_STRUCTURE_PROJECTION = Object.freeze({
  id: "help-math-fq-audio-source-structure-v1",
  includedPaths: Object.freeze([
    "schemaVersion",
    "animationId",
    "source.swf",
    "source.swfSha256",
    "courseXml.artifact.path",
    "courseXml.artifact.sha256",
    "courseXml.currentPlacement.sourceRelativePath",
    "courseXml.currentPlacement.matchStatus",
    "courseXml.currentPlacement.exactPlacement",
    "courseXml.currentPlacement.basenameMatches[].path",
    "timelineInventory[timelineId=sprite-1168].timelineId",
    "timelineInventory[timelineId=sprite-1168].frameCount",
    "timelineInventory[timelineId=sprite-1168].frameLabels[label=Q<n>].frame",
    "timelineInventory[timelineId=sprite-1168].frameLabels[label=Q<n>].label",
    "timelineInventory[timelineId=sprite-1168].controlStates[question-frame].frame",
    "timelineInventory[timelineId=sprite-1168].controlStates[question-frame].evidence[ffdec-release-handler].artifactId",
    "timelineInventory[timelineId=sprite-1168].controlStates[question-frame].evidence[ffdec-release-handler].script",
    "timelineInventory[timelineId=sprite-1168].controlStates[question-frame].evidence[ffdec-release-handler].lineStart",
    "timelineInventory[timelineId=sprite-1168].controlStates[question-frame].evidence[ffdec-release-handler].lineEnd",
  ]),
  excludedPaths: Object.freeze([
    "inventoryStatus",
    "migrationStatusAtGeneration",
    "migrationStatusChanged",
    "authorityStatement",
    "evidenceIndex",
    "authoritativeRuntimeEvidence",
    "staticExtraction",
    "interactions",
    "dependencies",
    "coverage",
    "conflicts",
    "unknowns",
    "strictAcceptanceEffect",
    "source.* except swf,swfSha256",
    "courseXml.* except artifact.path,artifact.sha256,currentPlacement.sourceRelativePath,currentPlacement.matchStatus,currentPlacement.exactPlacement,currentPlacement.basenameMatches[].path",
    "timelineInventory[timelineId!=sprite-1168]",
    "timelineInventory[timelineId=sprite-1168].* except frameCount,Q<n> frameLabels,and question-frame FFDec release-handler evidence",
  ]),
});

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function canonicalProjectionJson(value) {
  if (Array.isArray(value)) return `[${value.map((item) => (
    item === undefined || typeof item === "function" || typeof item === "symbol" ? "null" : canonicalProjectionJson(item)
  )).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined && typeof value[key] !== "function" && typeof value[key] !== "symbol")
      .sort(compareText)
      .map((key) => `${JSON.stringify(key)}:${canonicalProjectionJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function projectionSha256(value) {
  return createHash("sha256").update(canonicalProjectionJson(value)).digest("hex");
}

function selectedObject(value, keys) {
  return Object.fromEntries(keys.filter((key) => value?.[key] !== undefined).map((key) => [key, value[key]]));
}

export function projectTechnicalManifest(manifest) {
  const source = selectedObject(manifest?.source, [
    "placementPath",
    "fla",
    "swf",
    "flaSha256",
    "swfSha256",
    "pairedFlaStatus",
  ]);
  const runtime = selectedObject(manifest?.runtime, [
    "swfSignature",
    "swfVersion",
    "declaredFileLength",
    "stage",
    "fps",
    "frameCount",
    "durationMs",
    "backgroundColor",
    "actionScriptVersion",
    "fonts",
    "scripts",
    "externalDependencies",
    "rootTimelineId",
    "timelineDefinitions",
    "instances",
  ]);
  const localization = selectedObject(manifest?.localization, [
    "bilingualRequired",
    "languages",
  ]);
  const audio = {
    required: manifest?.audio?.required,
    reasonNotRequired: manifest?.audio?.reasonNotRequired,
    languages: manifest?.audio?.languages,
    inventoryFile: manifest?.audio?.inventoryFile,
    startSemantics: manifest?.audio?.startSemantics,
    missingRequired: (manifest?.audio?.missingRequired || []).map((item) => selectedObject(item, [
      "language",
      "sourceFile",
      "status",
    ])),
    cues: (manifest?.audio?.cues || []).map((cue) => selectedObject(cue, [
      "id",
      "cueId",
      "language",
      "source",
      "sourceFile",
      "sha256",
      "startFrame",
      "startFrameDomainId",
      "startSemantics",
      "durationMs",
      "format",
      "channels",
      "sampleRateHz",
      "trigger",
    ])),
  };
  const implementation = selectedObject(manifest?.implementation, [
    "authorityBoundary",
    "captureContract",
    "component",
    "defaultFrameDomainId",
    "frameDomains",
    "naturalPlaybackEndFrame",
    "playbackSemantics",
    "registryModule",
    "rendering",
    "route",
    "routeFile",
    "standalonePackage",
    "testFile",
    "timelineModule",
  ]);
  return {
    projection: TECHNICAL_MANIFEST_PROJECTION.id,
    schemaVersion: manifest?.schemaVersion,
    id: manifest?.id,
    animationId: manifest?.animationId,
    assetId: manifest?.assetId,
    source,
    runtime,
    localization,
    scenarios: manifest?.scenarios,
    audio,
    implementation,
  };
}

export function technicalManifestSha256(manifest) {
  return projectionSha256(projectTechnicalManifest(manifest));
}

export function projectTraceCoverage(coverage) {
  return {
    projection: TRACE_COVERAGE_PROJECTION.id,
    schemaVersion: coverage?.schemaVersion,
    animationId: coverage?.animationId,
    requirements: (coverage?.requirements || []).map((requirement) => selectedObject(
      requirement,
      TRACE_COVERAGE_PROJECTION.includedRequirementPaths,
    )),
  };
}

export function traceCoverageSha256(coverage) {
  return projectionSha256(projectTraceCoverage(coverage));
}

export function projectScenarioInventory(inventory) {
  const projected = { ...inventory };
  delete projected.migrationStatusAtGeneration;
  delete projected.migrationStatusChanged;
  projected.evidenceIndex = (inventory?.evidenceIndex || [])
    .filter((item) => item?.artifactId !== "migration-manifest");
  return {
    projection: SCENARIO_INVENTORY_PROJECTION.id,
    inventory: projected,
  };
}

export function scenarioInventorySha256(inventory) {
  return projectionSha256(projectScenarioInventory(inventory));
}

function isFqQuestionLabel(value) {
  return /^Q\d+$/.test(value || "");
}

function isFqReleaseHandlerEvidence(value) {
  return value?.artifactId === "ffdec-scripts"
    && /CLIPACTIONRECORD on\(release\)\.as$/.test(value?.script || "");
}

export function projectFqAudioSourceStructure(inventory) {
  const timeline = (inventory?.timelineInventory || []).find(({timelineId}) => timelineId === "sprite-1168");
  const frameLabels = (timeline?.frameLabels || [])
    .filter(({label}) => isFqQuestionLabel(label))
    .map((item) => selectedObject(item, ["frame", "label"]));
  const questionFrames = new Set(frameLabels.map(({frame}) => frame));
  const answerReleaseHandlers = (timeline?.controlStates || [])
    .filter(({frame}) => questionFrames.has(frame))
    .map((state) => ({
      frame: state.frame,
      handlers: (state.evidence || [])
        .filter(isFqReleaseHandlerEvidence)
        .map((item) => selectedObject(item, ["artifactId", "script", "lineStart", "lineEnd"])),
    }));
  const placement = inventory?.courseXml?.currentPlacement;
  return {
    projection: FQ_AUDIO_SOURCE_STRUCTURE_PROJECTION.id,
    schemaVersion: inventory?.schemaVersion,
    animationId: inventory?.animationId,
    source: selectedObject(inventory?.source, ["swf", "swfSha256"]),
    courseXml: {
      artifact: selectedObject(inventory?.courseXml?.artifact, ["path", "sha256"]),
      currentPlacement: {
        ...selectedObject(placement, ["sourceRelativePath", "matchStatus", "exactPlacement"]),
        basenameMatches: (placement?.basenameMatches || []).map((item) => selectedObject(item, ["path"])),
      },
    },
    timeline: {
      timelineId: timeline?.timelineId,
      frameCount: timeline?.frameCount,
      frameLabels,
      answerReleaseHandlers,
    },
  };
}

export function fqAudioSourceStructureSha256(inventory) {
  return projectionSha256(projectFqAudioSourceStructure(inventory));
}

export function projectionDescriptor({ projection, sha256, excludedPaths = [], includedPaths = [] }) {
  return {
    hashMode: CANONICAL_PROJECTION_ENCODING,
    projection,
    sha256,
    ...(excludedPaths.length ? { excludedPaths: [...excludedPaths] } : {}),
    ...(includedPaths.length ? { includedPaths: [...includedPaths] } : {}),
  };
}
