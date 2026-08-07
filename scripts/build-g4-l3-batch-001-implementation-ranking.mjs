#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {
  assertSafeReportOutput,
  validateG4L3MachineSourceAudits,
} from "./build-g4-l3-machine-source-audits.mjs";
import {validateWorkCardReport} from "./build-g4-l3-implementation-work-cards.mjs";
import {validateReport as validateSourceOperationReport} from "./build-g4-l3-source-operation-index-v2.mjs";
import {validateAssetDefinitionCensus} from "./build-g4-l3-swf-asset-definition-census.mjs";
import {validateG4L3EmbeddedAudioArchive} from "./build-g4-l3-embedded-audio-archive.mjs";
import {validateG4L3CatalogAudioMediaProbe} from "./build-g4-l3-catalog-audio-media-probe.mjs";
import {validateSpecificationReadinessReport} from "./build-g4-l3-batch-001-specification-readiness.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const SCHEMA_VERSION = 1;
const REPORT_TYPE = "g4-l3-batch-001-implementation-complexity-ranking";
const BATCH_ID = "batch-001";
const EXPECTED_ITEM_COUNT = 25;
const SOURCE_ARCHIVE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const DEFAULT_JSON_OUTPUT = path.join(projectRoot, "reports", "g4-l3-batch-001-implementation-ranking.json");
const DEFAULT_MARKDOWN_OUTPUT = path.join(projectRoot, "reports", "g4-l3-batch-001-implementation-ranking.md");

const INPUT_REPORTS = Object.freeze({
  workCards: "reports/g4-l3-implementation-work-cards.json",
  batchSpecificationReadiness: "reports/g4-l3-batch-001-specification-readiness.json",
  machineAudit: "reports/g4-l3-machine-source-audits.json",
  sourceOperations: "reports/g4-l3-source-operation-index-v2.json",
  assetDefinitionCensus: "reports/g4-l3-swf-asset-definition-census.json",
  embeddedAudioArchive: "reports/g4-l3-embedded-audio-archive.json",
  catalogAudioMediaProbe: "reports/g4-l3-catalog-audio-media-probe.json",
});

const METRICS = Object.freeze([
  Object.freeze({id: "rootFrameCount", axis: "timeline", description: "SWF root timeline frames"}),
  Object.freeze({id: "staticRootReachableTimelineCount", axis: "timeline", description: "root plus statically root-reachable sprite timelines"}),
  Object.freeze({id: "staticRootReachableDeclaredFrameCount", axis: "timeline", description: "declared frames in the static root-reachable graph"}),
  Object.freeze({id: "placementTagCount", axis: "timeline", description: "recursive PlaceObject/PlaceObject2/PlaceObject3 tags"}),
  Object.freeze({id: "exactOperationCount", axis: "behavior", description: "exact source operation records"}),
  Object.freeze({id: "exactEventHandlerOperationCount", axis: "behavior", description: "exact event-handler operation records"}),
  Object.freeze({id: "exactSignalCount", axis: "behavior", description: "exact source lexical signal records"}),
  Object.freeze({id: "scenarioTraceCandidateCount", axis: "behavior", description: "source-bound scenario/trace candidates only"}),
  Object.freeze({id: "assetDefinitionCount", axis: "assets", description: "recursive SWF asset definitions"}),
  Object.freeze({id: "featureHeavyDefinitionCount", axis: "assets", description: "morph, bitmap, and button definitions"}),
  Object.freeze({id: "exactTextOccurrenceCount", axis: "assets", description: "exact statically decoded text occurrences"}),
  Object.freeze({id: "fontDefinitionFactCount", axis: "assets", description: "exact embedded font-definition facts"}),
  Object.freeze({id: "embeddedAudioUnitCount", axis: "audio", description: "DefineSound plus SoundStream archive units"}),
  Object.freeze({id: "embeddedAudioBlockCount", axis: "audio", description: "SoundStreamBlock records"}),
  Object.freeze({id: "embeddedAudioPayloadBytes", axis: "audio", description: "byte-exact archived logical codec payload bytes"}),
  Object.freeze({id: "catalogAudioDurationMs", axis: "audio", description: "sum of technical-probe catalog-audio durations in milliseconds"}),
]);

const AXES = Object.freeze(["timeline", "behavior", "assets", "audio"]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function fingerprint(value) {
  return sha256(stableJson(value));
}

function projectPath(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

function resolveProjectPath(relativePath) {
  const absolute = path.resolve(projectRoot, relativePath);
  const projected = path.relative(projectRoot, absolute);
  invariant(projected && !projected.startsWith(`..${path.sep}`) && !path.isAbsolute(projected),
    `Path escapes the project root: ${relativePath}`);
  return absolute;
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function nonnegativeInteger(value, label) {
  invariant(Number.isSafeInteger(value) && value >= 0, `${label} must be a non-negative safe integer`);
  return value;
}

async function readJsonBinding(relativePath) {
  const absolute = resolveProjectPath(relativePath);
  const [metadata, bytes] = await Promise.all([lstat(absolute), readFile(absolute)]);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${relativePath} must be a regular non-symlink report`);
  return {
    value: JSON.parse(bytes.toString("utf8")),
    binding: {
      path: relativePath,
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
  };
}

async function verifyGeneratorBinding(report, label) {
  const generator = report.generator;
  if (!generator?.sha256) return {available: false, verifiedNow: false};
  invariant(typeof generator.path === "string" && generator.path.startsWith("scripts/") &&
    /^[a-f0-9]{64}$/.test(generator.sha256), `${label}: invalid generator binding`);
  const absolute = resolveProjectPath(generator.path);
  const [metadata, bytes] = await Promise.all([lstat(absolute), readFile(absolute)]);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${label}: generator must be a regular non-symlink file`);
  invariant(sha256(bytes) === generator.sha256, `${label}: generator SHA-256 does not match the current script`);
  return {
    available: true,
    verifiedNow: true,
    path: generator.path,
    bytes: bytes.length,
    sha256: generator.sha256,
  };
}

async function verifyFrozenSource(binding, {extension, label}) {
  invariant(binding && typeof binding.path === "string" && binding.path.startsWith(SOURCE_ARCHIVE_PREFIX),
    `${label}: source path is outside the frozen HELP Math archive`);
  invariant(path.extname(binding.path).toLowerCase() === extension, `${label}: expected ${extension} source`);
  invariant(Number.isSafeInteger(binding.bytes) && binding.bytes > 0 && /^[a-f0-9]{64}$/.test(binding.sha256 || ""),
    `${label}: source identity is incomplete`);
  const absolute = resolveProjectPath(binding.path);
  const [metadata, bytes] = await Promise.all([lstat(absolute), readFile(absolute)]);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${label}: source must be a regular non-symlink file`);
  invariant(bytes.length === binding.bytes && sha256(bytes) === binding.sha256,
    `${label}: physical source bytes do not match the report binding`);
  return {
    path: binding.path,
    bytes: binding.bytes,
    sha256: binding.sha256,
    physicalHashVerifiedNow: true,
  };
}

function requireUniqueIndex(items, label) {
  invariant(Array.isArray(items), `${label} must be an array`);
  const result = new Map();
  for (const item of items) {
    invariant(typeof item?.animationId === "string" && !result.has(item.animationId),
      `${label}: missing or duplicate animation ID ${item?.animationId}`);
    result.set(item.animationId, item);
  }
  return result;
}

export function validateInputReports(reports, bindings) {
  validateWorkCardReport(reports.workCards);
  validateSpecificationReadinessReport(reports.batchSpecificationReadiness);
  validateG4L3MachineSourceAudits(reports.machineAudit);
  validateSourceOperationReport(reports.sourceOperations);
  validateAssetDefinitionCensus(reports.assetDefinitionCensus);
  validateG4L3EmbeddedAudioArchive(reports.embeddedAudioArchive);
  validateG4L3CatalogAudioMediaProbe(reports.catalogAudioMediaProbe);

  const batchPlan = reports.workCards.batchPlan.find((batch) => batch.batchId === BATCH_ID);
  const selectedCards = reports.workCards.cards.filter((card) => card.batch?.batchId === BATCH_ID);
  invariant(batchPlan?.cardCount === EXPECTED_ITEM_COUNT && batchPlan.orderedAnimationIds?.length === EXPECTED_ITEM_COUNT,
    "G4 L3 batch-001 work-card plan must contain exactly 25 items");
  invariant(selectedCards.length === EXPECTED_ITEM_COUNT && new Set(selectedCards.map((card) => card.animationId)).size === EXPECTED_ITEM_COUNT,
    "G4 L3 batch-001 selection must contain exactly 25 unique items");
  invariant(sameValue(selectedCards.map((card) => card.animationId), batchPlan.orderedAnimationIds),
    "G4 L3 batch-001 card order differs from its declared batch plan");
  invariant(reports.batchSpecificationReadiness.cards?.length === EXPECTED_ITEM_COUNT &&
    sameValue(reports.batchSpecificationReadiness.batch?.orderedAnimationIds, batchPlan.orderedAnimationIds),
  "G4 L3 batch-001 specification report does not bind the exact 25-card order");
  invariant(reports.batchSpecificationReadiness.batch?.gate?.open === true &&
    reports.batchSpecificationReadiness.batch?.gate?.prerequisiteKind === "none" &&
    reports.batchSpecificationReadiness.summary?.existingMigrationWorkspaces === EXPECTED_ITEM_COUNT &&
    reports.batchSpecificationReadiness.batch?.implementationAuthorizedNow === false &&
    reports.batchSpecificationReadiness.summary?.implementationAuthorized === 0 &&
    reports.batchSpecificationReadiness.summary?.strictComplete === 0,
  "G4 L3 batch-001 scaffold gate must be open while implementation/strict gates remain closed");

  invariant(reports.workCards.sourceBindings?.machineAudit?.sha256 === bindings.machineAudit.sha256,
    "Work-card report is not bound to the current machine-audit bytes");
  invariant(reports.batchSpecificationReadiness.sourceBindings?.workCards?.sha256 === bindings.workCards.sha256 &&
    reports.batchSpecificationReadiness.sourceBindings?.machineAudit?.sha256 === bindings.machineAudit.sha256,
  "Batch specification report is not bound to the current work-card/machine-audit bytes");
  invariant(reports.sourceOperations.sourceBindings?.machineAudit?.sha256 === bindings.machineAudit.sha256,
    "Source-operation report is not bound to the current machine-audit bytes");
  const assetWorkCardBinding = reports.assetDefinitionCensus.sourceBindings?.workCards;
  const audioWorkCardBinding = reports.catalogAudioMediaProbe.sourceBindings?.implementationWorkCards;
  invariant(assetWorkCardBinding?.path === INPUT_REPORTS.workCards &&
    audioWorkCardBinding?.path === INPUT_REPORTS.workCards &&
    assetWorkCardBinding.bytes === audioWorkCardBinding.bytes &&
    assetWorkCardBinding.sha256 === audioWorkCardBinding.sha256 &&
    /^[a-f0-9]{64}$/.test(assetWorkCardBinding.sha256 || "") &&
    !/^0{64}$/.test(assetWorkCardBinding.sha256),
  "Asset/audio evidence lacks a consistent historical work-card binding");
  invariant(reports.embeddedAudioArchive.sourceBindings?.machineSourceAudit?.sha256 === bindings.machineAudit.sha256,
    "Embedded-audio archive is not bound to the current machine-audit bytes");
  const assetById = requireUniqueIndex(reports.assetDefinitionCensus.items, "asset-definition census compatibility");
  const probeByPath = new Map(reports.catalogAudioMediaProbe.probes.map((probe) => [probe.source.path, probe]));
  invariant(probeByPath.size === reports.catalogAudioMediaProbe.probes.length,
    "Catalog-audio compatibility probe paths must be unique");
  for (const card of reports.workCards.cards) {
    const asset = assetById.get(card.animationId);
    invariant(asset?.source?.path === card.source.swf.path && asset.source.bytes === card.source.swf.bytes &&
      asset.source.sha256 === card.source.swf.sha256 && asset.runtime?.fps === card.runtime.fps &&
      asset.runtime?.rootFrameCount === card.runtime.rootFrameCount,
    `${card.animationId}: current work card disagrees with asset-definition evidence`);
    for (const file of card.requiredWork?.audio?.catalogAssociation?.files || []) {
      const probe = probeByPath.get(file.path);
      invariant(probe?.source?.bytes === file.bytes && probe.source.sha256 === file.sha256 &&
        probe.source.referencedByAnimationIds.includes(card.animationId),
      `${card.animationId}: current work card disagrees with catalog-audio evidence`);
    }
  }
  return {batchPlan, selectedCards};
}

function audioProjectionForCard(card, probeByPath) {
  const declared = card.requiredWork?.audio?.catalogAssociation;
  invariant(declared && Array.isArray(declared.files), `${card.animationId}: missing catalog-audio association`);
  invariant(declared.exactFileCount === declared.files.length && declared.associatedFileCount >= declared.files.length,
    `${card.animationId}: catalog-audio association counts are stale`);
  const probes = declared.files.map((file) => {
    const probe = probeByPath.get(file.path);
    invariant(probe, `${card.animationId}: catalog audio ${file.path} has no technical probe`);
    invariant(probe.source.sha256 === file.sha256 && probe.source.bytes === file.bytes &&
      probe.source.referencedByAnimationIds.includes(card.animationId),
    `${card.animationId}: catalog-audio report/source identity drift`);
    invariant(probe.probe.status === "ffprobe-parsed-ffmpeg-decode-check-passed" &&
      probe.probe.ffmpegDecodeToNull.decodeCheckPassed === true,
    `${card.animationId}: catalog audio ${file.path} lacks a passing technical decode probe`);
    return probe;
  });
  const languageCandidates = {en: 0, es: 0};
  for (const probe of probes) languageCandidates[probe.source.normalizedLanguageCandidate] += 1;
  return {
    declaredFiles: declared.files,
    probes,
    evidence: {
      catalogAudioFileCount: probes.length,
      catalogAudioDurationMs: sum(probes.map((probe) => Math.round(probe.probe.media.timing.durationSeconds * 1000))),
      normalizedLanguageCandidateCounts: languageCandidates,
      technicalDecodeProbePassedCount: probes.length,
      spokenLanguageEstablished: false,
      cueMappingEstablished: false,
      synchronizationEstablished: false,
      listeningAcceptanceEstablished: false,
    },
  };
}

function rawEvidenceFor({card, machineItem, operationItem, assetItem, embeddedItem, audio}) {
  const identityFields = [machineItem, operationItem, assetItem, embeddedItem];
  for (const item of identityFields) {
    invariant(item.animationId === card.animationId && item.assetId === card.assetId,
      `${card.animationId}: cross-report animation/asset identity drift`);
    invariant(item.sequence === card.sequence, `${card.animationId}: cross-report lesson sequence drift`);
  }
  invariant(machineItem.batch.batchId === BATCH_ID && operationItem.batch.batchId === BATCH_ID &&
    assetItem.batchId === BATCH_ID && embeddedItem.batchId === BATCH_ID,
  `${card.animationId}: cross-report batch identity drift`);
  invariant(machineItem.source.swf.path === card.source.swf.path && machineItem.source.swf.sha256 === card.source.swf.sha256 &&
    operationItem.source.swf.path === card.source.swf.path && operationItem.source.swf.sha256 === card.source.swf.sha256 &&
    assetItem.source.path === card.source.swf.path && assetItem.source.sha256 === card.source.swf.sha256 &&
    embeddedItem.source.swf.path === card.source.swf.path && embeddedItem.source.swf.expectedSha256 === card.source.swf.sha256,
  `${card.animationId}: cross-report source SWF identity drift`);
  invariant(machineItem.auditFingerprintSha256 === card.runtime.machineAuditFingerprintSha256 &&
    operationItem.upstreamBindings.machineAuditFingerprintSha256 === machineItem.auditFingerprintSha256,
  `${card.animationId}: machine/source-operation fingerprint drift`);
  invariant(assetItem.runtime.rootFrameCount === card.runtime.rootFrameCount && assetItem.runtime.fps === card.runtime.fps,
    `${card.animationId}: asset census runtime identity drift`);
  for (const item of [machineItem, operationItem, assetItem, embeddedItem]) {
    invariant(item.classification?.section === card.classification.section &&
      item.classification?.page === card.classification.page,
    `${card.animationId}: cross-report lesson classification drift`);
  }

  const frameDomains = machineItem.swf.frameDomains;
  const embedded = embeddedItem.embeddedAudio;
  const embeddedTagCounts = embedded.tagCounts;
  const machineTagCounts = machineItem.swf.audio.tagCounts;
  for (const field of ["DefineSound", "SoundStreamHead", "SoundStreamHead2", "SoundStreamBlock"]) {
    invariant((machineTagCounts[field] || 0) === (embeddedTagCounts[field] || 0),
      `${card.animationId}: embedded-audio ${field} count drift`);
  }
  const embeddedUnits = [...embedded.defineSounds, ...embedded.soundStreams];
  const embeddedBlockCount = sum(embedded.soundStreams.map((stream) => stream.blockCount));
  const embeddedPayloadBytes = sum(embeddedUnits.map((unit) => unit.payload.byteLength));
  const categoryCounts = assetItem.tagStream.categoryCounts;
  const placementTagCount = sum(["PlaceObject", "PlaceObject2", "PlaceObject3"]
    .map((name) => machineItem.swf.tagCounts[name] || 0));
  const metrics = {
    rootFrameCount: card.runtime.rootFrameCount,
    staticRootReachableTimelineCount: frameDomains.staticallyRootReachableDefinitionCount + 1,
    staticRootReachableDeclaredFrameCount: frameDomains.staticallyRootReachableDeclaredFrameCountSum,
    placementTagCount,
    exactOperationCount: operationItem.counts.operations,
    exactEventHandlerOperationCount: operationItem.counts.exactEventHandlerOperationCount,
    exactSignalCount: operationItem.counts.signals,
    scenarioTraceCandidateCount: operationItem.scenarioTraceCandidates.length,
    assetDefinitionCount: assetItem.tagStream.definitionCount,
    featureHeavyDefinitionCount: categoryCounts.morph + categoryCounts.bitmap + categoryCounts.button,
    exactTextOccurrenceCount: assetItem.exactTextOccurrenceCount,
    fontDefinitionFactCount: assetItem.fontFacts.length,
    embeddedAudioUnitCount: embeddedUnits.length,
    embeddedAudioBlockCount: embeddedBlockCount,
    embeddedAudioPayloadBytes: embeddedPayloadBytes,
    catalogAudioDurationMs: audio.evidence.catalogAudioDurationMs,
  };
  for (const metric of METRICS) nonnegativeInteger(metrics[metric.id], `${card.animationId}.${metric.id}`);
  return {
    metrics,
    supplemental: {
      sourceKind: card.source.sourceKind,
      normalizedScriptBytes: operationItem.reexport.normalizedBytes,
      exportedScriptFileCount: operationItem.reexport.exportedScriptFileCount,
      operationCountsByCategory: operationItem.counts.operationsByCategory,
      assetCategoryCounts: categoryCounts,
      catalogAudioFileCount: audio.evidence.catalogAudioFileCount,
      catalogAudioNormalizedLanguageCandidateCounts: audio.evidence.normalizedLanguageCandidateCounts,
      catalogAudioTechnicalDecodeProbePassedCount: audio.evidence.technicalDecodeProbePassedCount,
      catalogAudioProbeBindings: audio.probes.map((probe) => ({
        path: probe.source.path,
        bytes: probe.source.bytes,
        sha256: probe.source.sha256,
        probeFingerprintSha256: probe.probeFingerprintSha256,
        durationMs: Math.round(probe.probe.media.timing.durationSeconds * 1000),
      })),
      embeddedAudioTagCounts: embeddedTagCounts,
      sourceBoundOnly: true,
      runtimeReachabilityEstablished: false,
    },
  };
}

function competitionRanks(items, metricId) {
  const values = [...new Set(items.map((item) => item.evidence.metrics[metricId]))].sort((left, right) => left - right);
  return new Map(values.map((value) => [value, 1 + items.filter((item) => item.evidence.metrics[metricId] < value).length]));
}

export function rankEvidenceItems(inputItems) {
  invariant(Array.isArray(inputItems) && inputItems.length === EXPECTED_ITEM_COUNT,
    "Implementation complexity ranking requires exactly 25 input items");
  invariant(new Set(inputItems.map((item) => item.animationId)).size === EXPECTED_ITEM_COUNT,
    "Implementation complexity ranking input IDs must be unique");
  const metricRankMaps = new Map(METRICS.map((metric) => [metric.id, competitionRanks(inputItems, metric.id)]));
  const scored = inputItems.map((item) => {
    const metricOrdinalRanks = Object.fromEntries(METRICS.map((metric) => [
      metric.id,
      metricRankMaps.get(metric.id).get(item.evidence.metrics[metric.id]),
    ]));
    const axisOrdinalScores = Object.fromEntries(AXES.map((axis) => [
      axis,
      sum(METRICS.filter((metric) => metric.axis === axis).map((metric) => metricOrdinalRanks[metric.id])),
    ]));
    return {
      ...item,
      ranking: {
        metricOrdinalRanks,
        axisOrdinalScores,
        aggregateOrdinalScore: sum(Object.values(metricOrdinalRanks)),
        interpretation: "lower aggregate ordinal score means lower measured static complexity within this exact 25-item set",
      },
    };
  });
  scored.sort((left, right) => left.ranking.aggregateOrdinalScore - right.ranking.aggregateOrdinalScore ||
    left.lessonSequence - right.lessonSequence || left.animationId.localeCompare(right.animationId, "en"));
  const scoreCounts = new Map();
  for (const item of scored) scoreCounts.set(item.ranking.aggregateOrdinalScore,
    (scoreCounts.get(item.ranking.aggregateOrdinalScore) || 0) + 1);
  return scored.map((item, index) => {
    const ranked = {
      ...item,
      ranking: {
        implementationSequencePosition: index + 1,
        complexityCompetitionRank: 1 + scored.filter((candidate) =>
          candidate.ranking.aggregateOrdinalScore < item.ranking.aggregateOrdinalScore).length,
        aggregateScoreTieSize: scoreCounts.get(item.ranking.aggregateOrdinalScore),
        ...item.ranking,
        tieBreaker: "lesson sequence, then animationId; tie-breakers do not assert a complexity difference",
      },
    };
    ranked.itemFingerprintSha256 = fingerprint(ranked);
    return ranked;
  });
}

function rankingMethod() {
  return {
    purpose: "Deterministic acceptance-neutral ordering of the exact G4 L3 batch-001 set by measured static implementation complexity only.",
    direction: "implementationSequencePosition 1 has the lowest aggregate ordinal score in this exact 25-item set",
    axes: AXES.map((axis) => ({
      id: axis,
      metrics: METRICS.filter((metric) => metric.axis === axis).map((metric) => ({...metric})),
    })),
    metricRanking: "For each raw metric, ascending competition rank is 1 plus the number of batch items with a smaller value; equal raw values receive equal ranks.",
    aggregation: "All 16 metric ranks are summed with equal weight. Each of the four axes contributes exactly four metrics.",
    ties: "Equal aggregate scores remain complexity ties; lesson sequence and then animationId provide only a stable display order.",
    excludedFromScore: [
      "FLA availability or SWF-only status",
      "existing migration workspace or pilot reuse",
      "provisional renderer recommendation",
      "batch gate, implementation authorization, migration status, review, approval, or acceptance",
      "unobserved runtime reachability, behavior, language semantics, cue timing, visual fidelity, or authoring semantics",
    ],
    interpretationLimits: [
      "The ordering is relative to this exact 25-item set and is not a time or staffing estimate.",
      "Static source counts are implementation-planning facts, not proof that code is placed, reachable, ordered, visible, audible, or behaviorally authoritative at runtime.",
      "The ordering does not establish renderer choice, specification readiness, implementation readiness, fidelity, parity, or completion.",
    ],
  };
}

function bindInputReports(bindings, generatorBindings) {
  const result = {};
  for (const key of Object.keys(INPUT_REPORTS)) {
    result[key] = {
      ...bindings[key],
      schemaVersion: null,
      reportType: null,
      generatorBinding: generatorBindings[key],
    };
  }
  return result;
}

function inputReportSetProjection(inputReports) {
  return Object.entries(inputReports).map(([id, binding]) => ({
    id,
    path: binding.path,
    bytes: binding.bytes,
    sha256: binding.sha256,
    schemaVersion: binding.schemaVersion,
    reportType: binding.reportType,
    generatorBinding: binding.generatorBinding,
  }));
}

export async function buildImplementationRankingReport() {
  const entries = await Promise.all(Object.entries(INPUT_REPORTS).map(async ([key, relativePath]) => [key, await readJsonBinding(relativePath)]));
  const reports = Object.fromEntries(entries.map(([key, entry]) => [key, entry.value]));
  const bindings = Object.fromEntries(entries.map(([key, entry]) => [key, entry.binding]));
  const {batchPlan, selectedCards} = validateInputReports(reports, bindings);
  const generatorBindings = Object.fromEntries(await Promise.all(Object.entries(reports).map(async ([key, report]) => [
    key,
    await verifyGeneratorBinding(report, key),
  ])));
  const inputReportBindings = bindInputReports(bindings, generatorBindings);
  for (const key of Object.keys(inputReportBindings)) {
    inputReportBindings[key].schemaVersion = reports[key].schemaVersion;
    inputReportBindings[key].reportType = reports[key].reportType;
  }

  const machineById = requireUniqueIndex(reports.machineAudit.items, "machine audit");
  const operationById = requireUniqueIndex(reports.sourceOperations.items, "source operations");
  const assetById = requireUniqueIndex(reports.assetDefinitionCensus.items, "asset-definition census");
  const embeddedById = requireUniqueIndex(reports.embeddedAudioArchive.items, "embedded-audio archive");
  const specificationById = requireUniqueIndex(reports.batchSpecificationReadiness.cards, "batch specification readiness");
  const probeByPath = new Map(reports.catalogAudioMediaProbe.probes.map((probe) => [probe.source.path, probe]));
  invariant(probeByPath.size === reports.catalogAudioMediaProbe.probes.length, "Catalog-audio probe paths must be unique");

  const sourceVerifications = [];
  const selectedAudioPaths = new Set();
  const rawItems = [];
  for (const card of selectedCards) {
    const specification = specificationById.get(card.animationId);
    invariant(specification && specification.machinePrerequisiteReadiness?.implementationAuthorized === false &&
      specification.machinePrerequisiteReadiness?.strictComplete === false &&
      specification.specificationReadiness?.fullSpecificationReady === false,
    `${card.animationId}: specification/gate boundary drift`);
    const swf = await verifyFrozenSource(card.source.swf, {extension: ".swf", label: `${card.animationId} SWF`});
    const fla = card.source.fla ? await verifyFrozenSource(card.source.fla, {extension: ".fla", label: `${card.animationId} FLA`}) : null;
    sourceVerifications.push({animationId: card.animationId, swf, fla});
    const audio = audioProjectionForCard(card, probeByPath);
    for (const file of audio.declaredFiles) selectedAudioPaths.add(file.path);
    const evidence = rawEvidenceFor({
      card,
      machineItem: machineById.get(card.animationId),
      operationItem: operationById.get(card.animationId),
      assetItem: assetById.get(card.animationId),
      embeddedItem: embeddedById.get(card.animationId),
      audio,
    });
    rawItems.push({
      lessonSequence: card.sequence,
      animationId: card.animationId,
      assetId: card.assetId,
      classification: {
        section: card.classification.section,
        page: card.classification.page,
        titleRaw: card.classification.titleRaw,
        titleDisplay: card.classification.titleDisplay,
      },
      source: {
        sourceKind: card.source.sourceKind,
        swf,
        fla,
        sourceAvailabilityExcludedFromScore: true,
      },
      upstreamEvidence: {
        machineAuditFingerprintSha256: machineById.get(card.animationId).auditFingerprintSha256,
        sourceOperationItemBinding: fingerprint({
          animationId: card.animationId,
          sourceSetSha256: reports.sourceOperations.sourceBindings.sourceSetSha256,
          reexportSetSha256: reports.sourceOperations.sourceBindings.reexportSetSha256,
          itemSetSha256: reports.sourceOperations.summary.itemSetSha256,
        }),
        assetDefinitionInventorySha256: assetById.get(card.animationId).definitionInventorySha256,
        embeddedAudioItemFingerprintSha256: embeddedById.get(card.animationId).itemFingerprintSha256,
      },
      evidence,
      boundaries: {
        runtimeLaunchedByThisReport: false,
        runtimeReachabilityEstablished: false,
        specificationReady: false,
        implementationAuthorized: false,
        rendererSelected: false,
        visualOrBehavioralParityEstablished: false,
        audioLanguageCueSyncOrListeningAccepted: false,
        humanReviewAccepted: false,
        ownerAccepted: false,
        strictComplete: false,
      },
    });
  }

  const audioSourceVerifications = [];
  for (const audioPath of [...selectedAudioPaths].sort((left, right) => left.localeCompare(right, "en"))) {
    const probe = probeByPath.get(audioPath);
    audioSourceVerifications.push(await verifyFrozenSource(probe.source, {extension: ".mp3", label: `catalog audio ${audioPath}`}));
  }
  const rankedItems = rankEvidenceItems(rawItems);
  const generatorBytes = await readFile(scriptPath);
  const sourceSetProjection = sourceVerifications.map((entry) => ({
    animationId: entry.animationId,
    swf: entry.swf,
    fla: entry.fla,
  }));
  const audioSourceSetProjection = audioSourceVerifications.map((entry) => ({
    path: entry.path,
    bytes: entry.bytes,
    sha256: entry.sha256,
  }));
  const inputReportSet = inputReportSetProjection(inputReportBindings);
  const report = {
    schemaVersion: SCHEMA_VERSION,
    reportType: REPORT_TYPE,
    generator: {
      path: projectPath(scriptPath),
      version: SCHEMA_VERSION,
      bytes: generatorBytes.length,
      sha256: sha256(generatorBytes),
    },
    scope: {
      lesson: {grade: 4, lesson: 3, title: "Negative Numbers"},
      batchId: BATCH_ID,
      canonicalItems: EXPECTED_ITEM_COUNT,
      orderedLessonAnimationIds: [...batchPlan.orderedAnimationIds],
      rankingDirection: "ascending measured static complexity",
    },
    method: rankingMethod(),
    developmentBoundary: {
      scaffoldGateOpen: true,
      scaffoldedWorkspaces: EXPECTED_ITEM_COUNT,
      scaffoldGateAffectsRanking: false,
      implementationAuthorized: false,
      strictComplete: false,
      statement:
        "The open scaffold gate and 25 existing workspaces are development-preparation facts only; neither affects the static complexity ranking nor authorizes implementation or strict completion.",
    },
    sourceBindings: {
      inputReports: inputReportBindings,
      inputReportSetSha256: fingerprint(inputReportSet),
      selectedLegacySources: {
        swfCount: sourceVerifications.length,
        flaCount: sourceVerifications.filter((entry) => entry.fla).length,
        physicalFileCount: sourceVerifications.length + sourceVerifications.filter((entry) => entry.fla).length,
        physicalHashesVerifiedNow: true,
        sourceSetSha256: fingerprint(sourceSetProjection),
        filesByAnimation: sourceSetProjection,
      },
      selectedCatalogAudioSources: {
        fileCount: audioSourceVerifications.length,
        physicalHashesVerifiedNow: true,
        sourceSetSha256: fingerprint(audioSourceSetProjection),
        files: audioSourceSetProjection,
      },
    },
    summary: {
      rankedItems: rankedItems.length,
      distinctAnimationIds: new Set(rankedItems.map((item) => item.animationId)).size,
      distinctSequencePositions: new Set(rankedItems.map((item) => item.ranking.implementationSequencePosition)).size,
      flaBacked: rankedItems.filter((item) => item.source.fla).length,
      swfOnly: rankedItems.filter((item) => !item.source.fla).length,
      physicallyRehashedLegacySourceFiles: sourceVerifications.length + sourceVerifications.filter((entry) => entry.fla).length,
      physicallyRehashedCatalogAudioFiles: audioSourceVerifications.length,
      inputReportsBound: Object.keys(inputReportBindings).length,
      inputReportGeneratorsWithHashVerifiedNow: Object.values(generatorBindings).filter((binding) => binding.verifiedNow).length,
      minimumAggregateOrdinalScore: Math.min(...rankedItems.map((item) => item.ranking.aggregateOrdinalScore)),
      maximumAggregateOrdinalScore: Math.max(...rankedItems.map((item) => item.ranking.aggregateOrdinalScore)),
      implementationAuthorized: 0,
      authoritativeRuntimeReady: 0,
      strictComplete: 0,
      rankingSetSha256: fingerprint(rankedItems.map((item) => ({
        implementationSequencePosition: item.ranking.implementationSequencePosition,
        animationId: item.animationId,
        aggregateOrdinalScore: item.ranking.aggregateOrdinalScore,
        itemFingerprintSha256: item.itemFingerprintSha256,
      }))),
    },
    rankedItems,
    acceptance: {
      acceptanceNeutral: true,
      sourceAssetChanges: 0,
      migrationWorkspaceChanges: 0,
      implementationOrRendererChanges: 0,
      routeChanges: 0,
      reviewOrApprovalChanges: 0,
      statusOrLedgerChanges: 0,
      runtimeSessions: 0,
      audioPlaybackOrListeningReviews: 0,
      strictAcceptanceEffect: false,
      statement: "This is a relative, source-count-based implementation sequencing aid only. It does not establish specification or implementation readiness, authorize implementation, select a renderer, prove runtime behavior/fidelity/audio, record review or approval, or complete any migration.",
    },
  };
  return validateImplementationRankingReport(report);
}

function itemWithoutDerivedRanking(item) {
  const copy = structuredClone(item);
  delete copy.itemFingerprintSha256;
  delete copy.ranking;
  return copy;
}

export function validateImplementationRankingReport(report) {
  invariant(report?.schemaVersion === SCHEMA_VERSION && report.reportType === REPORT_TYPE,
    "Unexpected G4 L3 batch-001 implementation-ranking schema/type");
  invariant(report.generator?.path === "scripts/build-g4-l3-batch-001-implementation-ranking.mjs" &&
    report.generator.version === SCHEMA_VERSION && Number.isSafeInteger(report.generator.bytes) && report.generator.bytes > 0 &&
    /^[a-f0-9]{64}$/.test(report.generator.sha256 || ""),
  "Implementation-ranking generator binding is invalid");
  invariant(sameValue(report.method, rankingMethod()), "Implementation-ranking method drifted");
  invariant(report.scope?.batchId === BATCH_ID && report.scope?.canonicalItems === EXPECTED_ITEM_COUNT &&
    report.scope?.orderedLessonAnimationIds?.length === EXPECTED_ITEM_COUNT,
  "Implementation-ranking scope must remain exactly 25 batch-001 items");
  invariant(report.developmentBoundary?.scaffoldGateOpen === true &&
    report.developmentBoundary?.scaffoldedWorkspaces === EXPECTED_ITEM_COUNT &&
    report.developmentBoundary?.scaffoldGateAffectsRanking === false &&
    report.developmentBoundary?.implementationAuthorized === false &&
    report.developmentBoundary?.strictComplete === false,
  "Implementation-ranking scaffold state crossed its acceptance-neutral boundary");
  invariant(Array.isArray(report.rankedItems) && report.rankedItems.length === EXPECTED_ITEM_COUNT &&
    new Set(report.rankedItems.map((item) => item.animationId)).size === EXPECTED_ITEM_COUNT,
  "Implementation-ranking item set must contain exactly 25 unique items");
  invariant(new Set(report.rankedItems.map((item) => item.ranking.implementationSequencePosition)).size === EXPECTED_ITEM_COUNT &&
    report.rankedItems.every((item, index) => item.ranking.implementationSequencePosition === index + 1),
  "Implementation-ranking positions must be the exact 1..25 sequence");
  invariant(new Set(report.rankedItems.map((item) => item.lessonSequence)).size === EXPECTED_ITEM_COUNT &&
    sameValue([...report.rankedItems].sort((left, right) => left.lessonSequence - right.lessonSequence)
      .map((item) => item.animationId), report.scope.orderedLessonAnimationIds),
  "Implementation-ranking lesson order/cardinality drifted");
  invariant(report.sourceBindings?.selectedLegacySources?.swfCount === EXPECTED_ITEM_COUNT &&
    report.sourceBindings.selectedLegacySources.physicalHashesVerifiedNow === true &&
    report.sourceBindings.selectedCatalogAudioSources?.physicalHashesVerifiedNow === true &&
    /^[a-f0-9]{64}$/.test(report.sourceBindings.inputReportSetSha256 || "") &&
    Object.keys(report.sourceBindings.inputReports || {}).length === Object.keys(INPUT_REPORTS).length,
  "Implementation-ranking source/report hash bindings are incomplete");
  for (const [key, binding] of Object.entries(report.sourceBindings.inputReports)) {
    invariant(INPUT_REPORTS[key] === binding.path && Number.isSafeInteger(binding.bytes) && binding.bytes > 0 &&
      /^[a-f0-9]{64}$/.test(binding.sha256 || "") && Number.isSafeInteger(binding.schemaVersion) &&
      typeof binding.reportType === "string" && binding.reportType.length > 0,
    `Invalid input report binding ${key}`);
    const generatorBinding = binding.generatorBinding;
    invariant(generatorBinding && typeof generatorBinding.available === "boolean" &&
      typeof generatorBinding.verifiedNow === "boolean" &&
      (generatorBinding.available === false
        ? generatorBinding.verifiedNow === false
        : generatorBinding.verifiedNow === true && typeof generatorBinding.path === "string" &&
          generatorBinding.path.startsWith("scripts/") && Number.isSafeInteger(generatorBinding.bytes) &&
          generatorBinding.bytes > 0 && /^[a-f0-9]{64}$/.test(generatorBinding.sha256 || "")),
    `Invalid input report generator binding ${key}`);
  }
  const reportSetProjection = inputReportSetProjection(report.sourceBindings.inputReports);
  invariant(report.sourceBindings.inputReportSetSha256 === fingerprint(reportSetProjection),
    "Implementation-ranking input-report set SHA-256 is stale");
  const expectedLegacySourceSet = [...report.rankedItems]
    .sort((left, right) => left.lessonSequence - right.lessonSequence)
    .map((item) => ({animationId: item.animationId, swf: item.source.swf, fla: item.source.fla}));
  invariant(sameValue(report.sourceBindings.selectedLegacySources.filesByAnimation, expectedLegacySourceSet) &&
    report.sourceBindings.selectedLegacySources.sourceSetSha256 === fingerprint(expectedLegacySourceSet) &&
    report.sourceBindings.selectedLegacySources.flaCount === expectedLegacySourceSet.filter((entry) => entry.fla).length &&
    report.sourceBindings.selectedLegacySources.physicalFileCount === EXPECTED_ITEM_COUNT +
      expectedLegacySourceSet.filter((entry) => entry.fla).length,
  "Implementation-ranking selected legacy-source set binding is stale");
  const selectedAudioFiles = report.sourceBindings.selectedCatalogAudioSources.files;
  invariant(Array.isArray(selectedAudioFiles) && selectedAudioFiles.length ===
    report.sourceBindings.selectedCatalogAudioSources.fileCount &&
    new Set(selectedAudioFiles.map((file) => file.path)).size === selectedAudioFiles.length &&
    selectedAudioFiles.every((file) => file.path.startsWith(SOURCE_ARCHIVE_PREFIX) &&
      path.extname(file.path).toLowerCase() === ".mp3" && Number.isSafeInteger(file.bytes) && file.bytes > 0 &&
      /^[a-f0-9]{64}$/.test(file.sha256 || "")) &&
    report.sourceBindings.selectedCatalogAudioSources.sourceSetSha256 === fingerprint(selectedAudioFiles),
  "Implementation-ranking selected catalog-audio source set binding is stale");
  for (const item of report.rankedItems) {
    invariant(item.assetId === `swf-${item.source.swf.sha256}` && item.source.swf.physicalHashVerifiedNow === true &&
      (!item.source.fla || item.source.fla.physicalHashVerifiedNow === true),
    `${item.animationId}: invalid physical source identity`);
    invariant(Object.values(item.boundaries || {}).every((value) => value === false),
      `${item.animationId}: implementation-ranking evidence crossed a runtime/acceptance boundary`);
    for (const metric of METRICS) nonnegativeInteger(item.evidence?.metrics?.[metric.id], `${item.animationId}.${metric.id}`);
    const catalogProbeBindings = item.evidence?.supplemental?.catalogAudioProbeBindings;
    invariant(Array.isArray(catalogProbeBindings) && catalogProbeBindings.length ===
      item.evidence.supplemental.catalogAudioFileCount &&
      catalogProbeBindings.length === item.evidence.supplemental.catalogAudioTechnicalDecodeProbePassedCount &&
      catalogProbeBindings.every((binding) => /^[a-f0-9]{64}$/.test(binding.probeFingerprintSha256 || "") &&
        Number.isSafeInteger(binding.durationMs) && binding.durationMs >= 0) &&
      sum(catalogProbeBindings.map((binding) => binding.durationMs)) === item.evidence.metrics.catalogAudioDurationMs,
    `${item.animationId}: catalog-audio probe projection is stale`);
  }
  const projectedAudioFiles = new Map();
  for (const item of report.rankedItems) {
    for (const binding of item.evidence.supplemental.catalogAudioProbeBindings) {
      const projection = {path: binding.path, bytes: binding.bytes, sha256: binding.sha256};
      if (projectedAudioFiles.has(binding.path)) {
        invariant(sameValue(projectedAudioFiles.get(binding.path), projection),
          `${item.animationId}: conflicting catalog-audio source binding`);
      } else projectedAudioFiles.set(binding.path, projection);
    }
  }
  const projectedAudioSourceSet = [...projectedAudioFiles.values()].sort((left, right) =>
    left.path.localeCompare(right.path, "en"));
  invariant(sameValue(projectedAudioSourceSet, selectedAudioFiles),
    "Implementation-ranking item/catalog-audio source projections disagree");
  const expected = rankEvidenceItems(report.rankedItems.map(itemWithoutDerivedRanking));
  invariant(sameValue(report.rankedItems, expected), "Implementation-ranking order, score, or item fingerprint is stale");
  const expectedRankingSetSha256 = fingerprint(report.rankedItems.map((item) => ({
    implementationSequencePosition: item.ranking.implementationSequencePosition,
    animationId: item.animationId,
    aggregateOrdinalScore: item.ranking.aggregateOrdinalScore,
    itemFingerprintSha256: item.itemFingerprintSha256,
  })));
  invariant(report.summary?.rankedItems === EXPECTED_ITEM_COUNT &&
    report.summary.distinctAnimationIds === EXPECTED_ITEM_COUNT &&
    report.summary.distinctSequencePositions === EXPECTED_ITEM_COUNT &&
    report.summary.rankingSetSha256 === expectedRankingSetSha256,
  "Implementation-ranking summary/cardinality/set hash is stale");
  invariant(report.summary.flaBacked === report.rankedItems.filter((item) => item.source.fla).length &&
    report.summary.swfOnly === report.rankedItems.filter((item) => !item.source.fla).length &&
    report.summary.physicallyRehashedLegacySourceFiles === report.summary.rankedItems + report.summary.flaBacked &&
    report.summary.minimumAggregateOrdinalScore === Math.min(...report.rankedItems.map((item) => item.ranking.aggregateOrdinalScore)) &&
    report.summary.maximumAggregateOrdinalScore === Math.max(...report.rankedItems.map((item) => item.ranking.aggregateOrdinalScore)),
  "Implementation-ranking aggregate summary is stale");
  invariant(report.summary.physicallyRehashedCatalogAudioFiles ===
    report.sourceBindings.selectedCatalogAudioSources.fileCount &&
    report.summary.inputReportsBound === Object.keys(report.sourceBindings.inputReports).length &&
    report.summary.inputReportGeneratorsWithHashVerifiedNow === Object.values(report.sourceBindings.inputReports)
      .filter((binding) => binding.generatorBinding?.verifiedNow).length,
  "Implementation-ranking source/report verification summary is stale");
  invariant(report.summary.implementationAuthorized === 0 && report.summary.authoritativeRuntimeReady === 0 &&
    report.summary.strictComplete === 0,
  "Implementation-ranking summary must not promote readiness or completion");
  invariant(report.acceptance?.acceptanceNeutral === true && report.acceptance.strictAcceptanceEffect === false &&
    ["sourceAssetChanges", "migrationWorkspaceChanges", "implementationOrRendererChanges", "routeChanges",
      "reviewOrApprovalChanges", "statusOrLedgerChanges", "runtimeSessions", "audioPlaybackOrListeningReviews"]
      .every((field) => report.acceptance[field] === 0),
  "Implementation-ranking report crossed its acceptance-neutral boundary");
  return report;
}

export function renderImplementationRankingMarkdown(report) {
  const rows = report.rankedItems.map((item) => {
    const metric = item.evidence.metrics;
    const axis = item.ranking.axisOrdinalScores;
    return `| ${item.ranking.implementationSequencePosition} | ${item.ranking.complexityCompetitionRank} | ` +
      `\`${item.animationId}\` | ${item.classification.section}/${item.classification.page ?? "shell"} | ` +
      `${item.ranking.aggregateOrdinalScore} | ${axis.timeline}/${axis.behavior}/${axis.assets}/${axis.audio} | ` +
      `${metric.staticRootReachableTimelineCount}/${metric.staticRootReachableDeclaredFrameCount} | ` +
      `${metric.exactOperationCount}/${metric.exactSignalCount}/${metric.scenarioTraceCandidateCount} | ` +
      `${metric.assetDefinitionCount}/${metric.featureHeavyDefinitionCount} | ` +
      `${metric.embeddedAudioUnitCount}/${metric.embeddedAudioBlockCount}/${metric.catalogAudioDurationMs} |`;
  });
  return [
    "# G4 L3 batch-001 implementation complexity ranking",
    "",
    "> Acceptance-neutral static sequencing aid for exactly 25 items. Position 1 is the lowest measured static complexity in this set; it does not mean ready, faithful, accepted, or complete.",
    "",
    "## Result",
    "",
    `- Ranked: **${report.summary.rankedItems}/25** canonical animations; ${report.summary.flaBacked} FLA+SWF and ${report.summary.swfOnly} SWF-only.`,
    `- Rehashed now: **${report.summary.physicallyRehashedLegacySourceFiles}** legacy source files and **${report.summary.physicallyRehashedCatalogAudioFiles}** catalog MP3 files.`,
    `- Bound input reports: **${report.summary.inputReportsBound}**; generators with report-declared SHA-256 reverified now: **${report.summary.inputReportGeneratorsWithHashVerifiedNow}**.`,
    `- Aggregate ordinal range: **${report.summary.minimumAggregateOrdinalScore}–${report.summary.maximumAggregateOrdinalScore}**; ranking-set SHA-256 \`${report.summary.rankingSetSha256}\`.`,
    `- Scaffold state: gate **open**, workspaces **${report.developmentBoundary.scaffoldedWorkspaces}/25**; this does not affect ranking or authorize implementation.`,
    "- Implementation authorized: **0/25**; authoritative runtime ready: **0/25**; strict complete: **0/25**.",
    "",
    "## Deterministic ordering",
    "",
    report.method.metricRanking,
    report.method.aggregation,
    report.method.ties,
    "",
    "`Axes` is timeline / behavior / assets / audio ordinal sums. `Domains` is static root-reachable timeline count / declared frame total. `Behavior` is exact operations / exact signals / source-bound candidate families. `Assets` is all definitions / morph+bitmap+button definitions. `Audio` is embedded units / stream blocks / catalog duration milliseconds.",
    "",
    "| Position | Complexity rank | Animation | Section/page | Score | Axes | Domains | Behavior | Assets | Audio |",
    "|---:|---:|---|---|---:|---|---|---|---|---|",
    ...rows,
    "",
    "## Evidence boundary",
    "",
    ...report.method.interpretationLimits.map((limit) => `- ${limit}`),
    ...report.method.excludedFromScore.map((excluded) => `- Excluded from score: ${excluded}.`),
    "",
    report.acceptance.statement,
    "",
  ].join("\n");
}

export function parseArguments(argv) {
  const options = {
    check: false,
    jsonOutput: DEFAULT_JSON_OUTPUT,
    markdownOutput: DEFAULT_MARKDOWN_OUTPUT,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--json-output" || argument === "--markdown-output") {
      const value = argv[++index];
      invariant(value, `${argument} requires a path`);
      if (argument === "--json-output") options.jsonOutput = path.resolve(value);
      else options.markdownOutput = path.resolve(value);
    } else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

export async function assertSafeRankingReportOutput(filePath, {extension} = {}) {
  const output = await assertSafeReportOutput(filePath, {extension});
  const information = await lstat(output).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  invariant(!information || (information.isFile() && !information.isSymbolicLink() && information.nlink === 1),
    "Implementation-ranking report output must be a regular, non-symlink, single-link file");
  return output;
}

export async function writeOrCheckRankingReport(filePath, expected, {extension, check = false} = {}) {
  const output = await assertSafeRankingReportOutput(filePath, {extension});
  if (check) {
    const actual = await readFile(output, "utf8").catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    invariant(actual === expected, `${projectPath(output)} is missing or stale`);
    return;
  }
  await mkdir(path.dirname(output), {recursive: true});
  await assertSafeRankingReportOutput(output, {extension});
  await writeFile(output, expected);
  await assertSafeRankingReportOutput(output, {extension});
}

function usage() {
  return `Usage: node scripts/build-g4-l3-batch-001-implementation-ranking.mjs [options]\n\n` +
    `  --check                    Verify checked-in JSON/Markdown byte-for-byte\n` +
    `  --json-output <path>       JSON output inside reports/\n` +
    `  --markdown-output <path>   Markdown output inside reports/\n`;
}

async function main(argv) {
  const options = parseArguments(argv);
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  await Promise.all([
    assertSafeRankingReportOutput(options.jsonOutput, {extension: ".json"}),
    assertSafeRankingReportOutput(options.markdownOutput, {extension: ".md"}),
  ]);
  const report = await buildImplementationRankingReport();
  const json = stableJson(report);
  const markdown = renderImplementationRankingMarkdown(report);
  await Promise.all([
    writeOrCheckRankingReport(options.jsonOutput, json, {extension: ".json", check: options.check}),
    writeOrCheckRankingReport(options.markdownOutput, markdown, {extension: ".md", check: options.check}),
  ]);
  process.stdout.write(`${options.check ? "PASS" : "WROTE"}: G4 L3 batch-001 static implementation complexity ranking; ` +
    `${report.summary.rankedItems}/25 items; strict complete 0/25\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
