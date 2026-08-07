#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const SCHEMA_VERSION = 2;
const DEFAULT_BATCH_ID = "batch-001";
const BATCH_CONFIG = Object.freeze({
  "batch-001": Object.freeze({cardCount: 25}),
  "batch-002": Object.freeze({cardCount: 15}),
});
const DIALOG_OPERATOR = "Dr. Peter Hu";
const SOURCE_ARCHIVE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES/";

const WORK_CARDS_PATH = path.join(projectRoot, "reports", "g4-l3-implementation-work-cards.json");
const MACHINE_AUDIT_PATH = path.join(projectRoot, "reports", "g4-l3-machine-source-audits.json");
const PREFLIGHT_PATH = path.join(projectRoot, "reports", "g4-l3-automation-preflight.json");
const ANIMATE_PREPARE_PATH = path.join(projectRoot, "reports", "g4-l3-animate-prepare-readiness.json");
const STATIC_SOURCE_EVENT_INDEX_PATH = path.join(
  projectRoot,
  "reports",
  "g4-l3-static-source-event-index.json",
);
const EMBEDDED_AUDIO_ARCHIVE_PATH = path.join(
  projectRoot,
  "reports",
  "g4-l3-embedded-audio-archive.json",
);
const ASSET_DEFINITION_CENSUS_PATH = path.join(
  projectRoot,
  "reports",
  "g4-l3-swf-asset-definition-census.json",
);
const ANIMATE_AUTHORING_AUDIT_INDEX_PATH = path.join(
  projectRoot,
  "reports",
  "g4-l3-animate-authoring-audit-index.json",
);
const ANIMATE_AUTHORING_AUDIT_INDEX_GENERATOR_PATH = path.join(
  projectRoot,
  "scripts",
  "build-g4-l3-animate-authoring-audit-index.mjs",
);
const ASSIST_RUNNER_PATH = path.join(projectRoot, "scripts", "run-assisted-animate-authoring-audit.mjs");

const HEX_64 = /^[a-f0-9]{64}$/;
const INTERACTION_SIGNAL_IDS = new Set([
  "mouse-events",
  "clip-events",
  "keyboard-events",
  "input-fields",
  "score-or-answer-state",
  "replay-or-reset",
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function requireBatchConfig(batchId) {
  const config = BATCH_CONFIG[batchId];
  if (!config) throw new Error(`Unsupported G4 L3 batch ${batchId}`);
  return config;
}

function reportTypeFor(batchId) {
  requireBatchConfig(batchId);
  return `g4-l3-${batchId}-specification-readiness`;
}

function defaultOutputPath(batchId, extension) {
  requireBatchConfig(batchId);
  return path.join(projectRoot, "reports", `g4-l3-${batchId}-specification-readiness.${extension}`);
}

function batchNumber(batchId) {
  return batchId.slice("batch-".length);
}

function relative(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

function resolveProjectPath(projectPath) {
  const absolute = path.resolve(projectRoot, projectPath);
  const projectRelative = path.relative(projectRoot, absolute);
  if (projectRelative.startsWith("..") || path.isAbsolute(projectRelative)) {
    throw new Error(`Path escapes the project root: ${projectPath}`);
  }
  return absolute;
}

function canonicalJson(value) {
  return JSON.stringify(value);
}

function sameJson(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function shellQuote(value) {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(value)) return value;
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function shellCommand(argv) {
  return argv.map(shellQuote).join(" ");
}

async function bindFile(filePath) {
  const bytes = await readFile(filePath);
  return {
    path: relative(filePath),
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

async function verifyRegularFileBinding(binding, label) {
  if (!binding || typeof binding.path !== "string" || !HEX_64.test(binding.sha256) || !Number.isInteger(binding.bytes)) {
    throw new Error(`${label}: incomplete path/hash/byte binding`);
  }
  if (!binding.path.startsWith(SOURCE_ARCHIVE_PREFIX)) {
    throw new Error(`${label}: source path is outside the frozen HELP Math archive`);
  }
  const absolute = resolveProjectPath(binding.path);
  const [metadata, bytes] = await Promise.all([lstat(absolute), readFile(absolute)]);
  if (!metadata.isFile() || metadata.isSymbolicLink()) throw new Error(`${label}: source is not a regular non-symlink file`);
  if (bytes.length !== binding.bytes || sha256(bytes) !== binding.sha256) {
    throw new Error(`${label}: physical file does not match the declared byte/hash binding`);
  }
  return {
    path: binding.path,
    bytes: binding.bytes,
    sha256: binding.sha256,
    physicalHashVerifiedNow: true,
    regularNonSymlinkFile: true,
  };
}

async function verifyEvidenceFileBinding(binding, label) {
  if (!binding || typeof binding.file !== "string" || !HEX_64.test(binding.sha256)
    || !Number.isSafeInteger(binding.bytes) || binding.bytes < 0) {
    throw new Error(`${label}: incomplete file/hash/byte binding`);
  }
  const absolute = resolveProjectPath(binding.file);
  const [metadata, bytes] = await Promise.all([lstat(absolute), readFile(absolute)]);
  if (!metadata.isFile() || metadata.isSymbolicLink()
    || bytes.length !== binding.bytes || sha256(bytes) !== binding.sha256) {
    throw new Error(`${label}: physical evidence file does not match its binding`);
  }
  return binding;
}

async function verifyStagedEntry(entry, sourceFla, sourceSwf) {
  if (!entry) throw new Error(`${sourceFla.path}: missing content-addressed Animate staging entry`);
  if (
    entry.source?.file !== sourceFla.path ||
    entry.source?.sha256 !== sourceFla.sha256 ||
    entry.source?.bytes !== sourceFla.bytes ||
    entry.source?.pairedSwf?.file !== sourceSwf.path ||
    entry.source?.pairedSwf?.sha256 !== sourceSwf.sha256 ||
    entry.source?.pairedSwf?.bytes !== sourceSwf.bytes
  ) {
    throw new Error(`${entry.animationId}: staged FLA/SWF source binding drift`);
  }
  const workingPath = resolveProjectPath(entry.workingCopy.file);
  const sourcePath = resolveProjectPath(sourceFla.path);
  const [workingLstat, workingStat, sourceStat, bytes] = await Promise.all([
    lstat(workingPath),
    stat(workingPath),
    stat(sourcePath),
    readFile(workingPath),
  ]);
  const mode = workingStat.mode & 0o777;
  if (
    !workingLstat.isFile() ||
    workingLstat.isSymbolicLink() ||
    mode !== 0o444 ||
    workingStat.nlink !== 1 ||
    (workingStat.dev === sourceStat.dev && workingStat.ino === sourceStat.ino) ||
    bytes.length !== sourceFla.bytes ||
    sha256(bytes) !== sourceFla.sha256
  ) {
    throw new Error(`${entry.animationId}: staged working copy is not a separate byte-identical 0444 file`);
  }
  return {
    manifestEntryAnimationId: entry.animationId,
    workingCopy: {
      path: entry.workingCopy.file,
      bytes: bytes.length,
      sha256: sha256(bytes),
      mode: "0444",
      linkCount: workingStat.nlink,
      readOnly: true,
      byteIdenticalToSource: true,
      separateRegularFile: true,
    },
    authoringAuditStatus: entry.animateAuthoringAudit?.status || "not-run",
    acceptanceEffect: false,
  };
}

function projectFrameDomainCandidates(machineItem, card) {
  const candidates = machineItem.swf.frameDomains.domains
    .filter((domain) => domain.staticallyRootReachable)
    .map((domain) => ({
      domainId: domain.domainId,
      kind: domain.kind,
      declaredFrameCount: domain.declaredFrameCount,
      observedShowFrameCount: domain.observedShowFrameCount,
      parentDomainIds: [...domain.parentDomainIds],
      placementEdges: domain.placementEdges.map((edge) => ({
        characterId: edge.characterId,
        childSpriteId: edge.childSpriteId,
        placementCount: edge.placementCount,
        firstFrame: edge.firstFrame,
        distinctFrames: [...edge.distinctFrames],
      })),
      staticDomainFingerprintSha256: domain.domainFingerprintSha256,
      dispositionStatus: domain.kind === "root" ? "root-requirement-unresolved" : "unresolved",
    }));
  const cardProjection = card.requiredWork.frameDomains.staticallyRootReachableCandidates.map((candidate) => ({
    domainId: candidate.domainId,
    kind: candidate.kind,
    declaredFrameCount: candidate.declaredFrameCount,
    parentDomainIds: candidate.parentDomainIds,
    staticDomainFingerprintSha256: candidate.staticDomainFingerprintSha256,
  }));
  const machineProjection = candidates.map((candidate) => ({
    domainId: candidate.domainId,
    kind: candidate.kind,
    declaredFrameCount: candidate.declaredFrameCount,
    parentDomainIds: candidate.parentDomainIds,
    staticDomainFingerprintSha256: candidate.staticDomainFingerprintSha256,
  }));
  if (!sameJson(cardProjection, machineProjection)) {
    throw new Error(`${card.animationId}: work-card frame-domain candidates drifted from the machine source audit`);
  }
  return candidates;
}

function projectWorkOnlyAuthoringAudit(card, result) {
  if (!card.source.fla) {
    if (result) throw new Error(`${card.animationId}: SWF-only card unexpectedly has an Animate authoring result`);
    return null;
  }
  if (!result) throw new Error(`${card.animationId}: paired card is missing its work-only Animate authoring result`);
  const selected = result.selectedPassingAudit;
  const attempt = result.attempts.find((candidate) => candidate.status === "passed"
    && candidate.evidenceId === selected.evidenceId && candidate.runId === selected.runId);
  if (!attempt || attempt.dialogOperator !== DIALOG_OPERATOR
    || attempt.automatedDialogInteractionUsed !== false
    || attempt.reviewOrOwnerDecisionRecorded !== false
    || attempt.migrationOrApprovalWrites !== false
    || attempt.acceptanceEffect !== false) {
    throw new Error(`${card.animationId}: selected authoring attempt crossed its operator or acceptance boundary`);
  }
  return {
    status: "verified-work-only-authoring-audit",
    designatedDialogOperator: DIALOG_OPERATOR,
    operatorRoleBoundary:
      "Dialog operator only: this completed work-only action is not review, approval, evidence signature, acceptance, original-runtime behavior, or migration completion.",
    evidenceId: selected.evidenceId,
    runId: selected.runId,
    receipt: selected.receipt,
    workEvidence: selected.workEvidence,
    artifacts: selected.artifacts,
    animateVersion: selected.animateVersion,
    nativeMovie: selected.nativeMovie,
    sourcePairReverified: result.sourcePair.bothSourceFilesReverified,
    sourceSwfExecuted: false,
    provesFlaSwfEquivalence: false,
    originalRuntimeBehaviorEstablished: false,
    authoringAccepted: false,
    strictAcceptanceEffect: false,
  };
}

async function verifyAnimateAuthoringAuditIndex(index, machineAudit) {
  if (index.schemaVersion !== 1
    || index.reportType !== "g4-l3-adobe-animate-authoring-audit-result-index"
    || index.summary?.queueItems !== 29
    || index.summary?.sourcePairsReverified !== 29
    || index.summary?.verifiedWorkOnlyAuthoringAudits !== 29
    || index.summary?.pendingAuthoringAudits !== 0
    || index.summary?.authoringCoverageComplete !== true
    || index.summary?.originalRuntimeBaselinesEstablished !== 0
    || index.summary?.humanVisualReviewsEstablished !== 0
    || index.summary?.ownerAcceptancesEstablished !== 0
    || index.summary?.strictAcceptancesEstablished !== 0
    || index.summary?.strictAcceptanceEffect !== false) {
    throw new Error("Animate authoring result index is incomplete or promoted beyond work-only evidence");
  }
  const pairedMachineItems = machineAudit.items.filter((item) => item.source.sourceKind === "fla+swf");
  if (index.items.length !== pairedMachineItems.length) {
    throw new Error("Animate authoring result index does not cover the exact 29 paired items");
  }
  const resultById = new Map();
  for (let itemIndex = 0; itemIndex < pairedMachineItems.length; itemIndex += 1) {
    const machine = pairedMachineItems[itemIndex];
    const result = index.items[itemIndex];
    if (result.queueOrdinal !== itemIndex + 1
      || result.animationId !== machine.animationId
      || result.status !== "verified-work-only-authoring-audit"
      || result.sourcePair?.sourceKind !== "fla+swf"
      || result.sourcePair?.fla?.file !== machine.source.fla.path
      || result.sourcePair?.fla?.sha256 !== machine.source.fla.sha256
      || result.sourcePair?.fla?.bytes !== machine.source.fla.bytes
      || result.sourcePair?.swf?.file !== machine.source.swf.path
      || result.sourcePair?.swf?.sha256 !== machine.source.swf.sha256
      || result.sourcePair?.swf?.bytes !== machine.source.swf.bytes
      || result.sourcePair?.bothSourceFilesReverified !== true
      || result.sourcePair?.shippedSwfExecutedByTheseAudits !== false
      || result.sourcePair?.flaSwfEquivalenceProven !== false
      || result.originalRuntimeBehaviorEstablished !== false
      || result.humanVisualReviewEstablished !== false
      || result.ownerAcceptanceEstablished !== false
      || result.strictAcceptanceEffect !== false
      || !result.selectedPassingAudit
      || result.selectedPassingAudit.authority !== "work-only Adobe Animate authoring structure"
      || result.selectedPassingAudit.acceptanceEffect !== false) {
      throw new Error(`${machine.animationId}: Animate authoring result identity, source pair, or authority drifted`);
    }
    for (const [key, record] of Object.entries({
      receipt: result.selectedPassingAudit.receipt,
      workEvidence: result.selectedPassingAudit.workEvidence,
      marker: result.selectedPassingAudit.artifacts?.marker,
      report: result.selectedPassingAudit.artifacts?.report,
      png: result.selectedPassingAudit.artifacts?.png,
    })) {
      await verifyEvidenceFileBinding(record, `${machine.animationId} selected authoring ${key}`);
    }
    resultById.set(result.animationId, result);
  }
  return resultById;
}

function assertMachinePrerequisiteReports({
  machineAuditBytes,
  workCardBytes,
  sourceEventIndex,
  embeddedAudioArchive,
  assetDefinitionCensus,
}) {
  if (
    sourceEventIndex.schemaVersion !== 1 ||
    sourceEventIndex.reportType !== "g4-l3-static-source-event-index" ||
    sourceEventIndex.scope?.canonicalItems !== 40 ||
    sourceEventIndex.authority?.runtimeReachabilityEstablished !== false ||
    sourceEventIndex.authority?.actualRuntimeScenarioCount !== 0 ||
    sourceEventIndex.acceptance?.acceptanceNeutral !== true ||
    sourceEventIndex.sourceBindings?.machineAudit?.sha256 !== sha256(machineAuditBytes) ||
    sourceEventIndex.sourceBindings?.ffdecInvokedByThisGenerator !== false
  ) {
    throw new Error("Static source-event index is stale, promoted, or not bound to the current machine audit");
  }
  if (
    embeddedAudioArchive.schemaVersion !== 1 ||
    embeddedAudioArchive.reportType !== "g4-l3-embedded-audio-archive" ||
    embeddedAudioArchive.summary?.canonicalItems !== 40 ||
    embeddedAudioArchive.acceptance?.acceptanceNeutral !== true ||
    embeddedAudioArchive.acceptance?.cueMappingEstablished !== false ||
    embeddedAudioArchive.acceptance?.runtimeSynchronizationEstablished !== false ||
    embeddedAudioArchive.acceptance?.listeningAcceptanceEstablished !== false ||
    embeddedAudioArchive.sourceBindings?.machineSourceAudit?.sha256 !== sha256(machineAuditBytes) ||
    embeddedAudioArchive.archive?.archiveWritten !== true ||
    embeddedAudioArchive.archive?.allArchivedPayloadHashesVerified !== true
  ) {
    throw new Error("Embedded-audio archive is stale, promoted, or not bound to the current machine audit");
  }
  if (
    assetDefinitionCensus.schemaVersion !== 1 ||
    assetDefinitionCensus.reportType !== "g4-l3-swf-asset-definition-census" ||
    assetDefinitionCensus.scope?.canonicalItems !== 40 ||
    assetDefinitionCensus.acceptance?.acceptanceNeutral !== true ||
    Object.values(assetDefinitionCensus.acceptance?.gates || {}).some(Boolean) ||
    assetDefinitionCensus.method?.runtimeVisibilityEstablished !== false ||
    assetDefinitionCensus.method?.rendererReuseAuthorized !== false ||
    assetDefinitionCensus.sourceBindings?.workCards?.path !== "reports/g4-l3-implementation-work-cards.json" ||
    assetDefinitionCensus.sourceBindings?.workCards?.schemaVersion !== 1 ||
    assetDefinitionCensus.sourceBindings?.workCards?.reportType !== "g4-l3-implementation-work-cards" ||
    !HEX_64.test(assetDefinitionCensus.sourceBindings?.workCards?.sha256 || "")
  ) {
    throw new Error("SWF asset-definition census is promoted or lacks its original work-card binding");
  }
  for (const [label, report] of [
    ["static source-event index", sourceEventIndex],
    ["embedded-audio archive", embeddedAudioArchive],
    ["asset-definition census", assetDefinitionCensus],
  ]) {
    if (!Array.isArray(report.items) || report.items.length !== 40) {
      throw new Error(`${label} must contain 40 canonical items`);
    }
    if (new Set(report.items.map((item) => item.animationId)).size !== 40) {
      throw new Error(`${label} contains duplicate animation IDs`);
    }
  }
}

async function verifyAudioArchiveCas(archive) {
  const objects = archive.archive?.casObjects || [];
  if (
    objects.length !== archive.archive?.archivedFileCount ||
    archive.archive.archivedBytes !== objects.reduce((sum, object) => sum + object.byteLength, 0)
  ) {
    throw new Error("Embedded-audio CAS object inventory count/bytes are stale");
  }
  for (const object of objects) {
    const absolute = resolveProjectPath(object.path);
    const [metadata, bytes] = await Promise.all([lstat(absolute), readFile(absolute)]);
    if (
      !metadata.isFile() ||
      metadata.isSymbolicLink() ||
      bytes.length !== object.byteLength ||
      sha256(bytes) !== object.sha256 ||
      object.physicalHashVerified !== true
    ) {
      throw new Error(`Embedded-audio CAS object is missing or stale: ${object.path}`);
    }
  }
  return {
    root: archive.archive.root,
    archivedFileCount: objects.length,
    archivedBytes: objects.reduce((sum, object) => sum + object.byteLength, 0),
    archiveSetSha256: archive.archive.archiveSetSha256,
    allObjectsPhysicallyVerifiedNow: true,
    cueMappingEstablished: false,
    runtimeSynchronizationEstablished: false,
    listeningAcceptanceEstablished: false,
  };
}

function matchEvidenceItem(card, item, label, sourcePath, sourceSha256) {
  if (
    !item ||
    item.animationId !== card.animationId ||
    item.assetId !== card.assetId ||
    item.sequence !== card.sequence ||
    (item.batchId ?? item.batch?.batchId) !== card.batch.batchId ||
    sourcePath !== card.source.swf.path ||
    sourceSha256 !== card.source.swf.sha256
  ) {
    throw new Error(`${card.animationId}: ${label} identity/source binding drift`);
  }
  return item;
}

function projectStaticSourceEvents(card, item, itemIndex) {
  matchEvidenceItem(
    card,
    item,
    "static source-event index",
    item.physicalSources?.swf?.path,
    item.physicalSources?.swf?.sha256,
  );
  if (
    item.runtimeBoundary?.runtimeReachabilityEstablished !== false ||
    item.runtimeBoundary?.runtimeScenarios?.length !== 0 ||
    item.parsingLimits?.exactTimelineOperationMethodsResolved !== 0 ||
    item.parsingLimits?.languageScriptSignalsIndexed !== 0
  ) {
    throw new Error(`${card.animationId}: static source-event evidence crossed its runtime/detail boundary`);
  }
  return {
    evidencePointer: `/items/${itemIndex}`,
    itemFingerprintSha256: item.itemFingerprintSha256,
    upstreamMachineAuditFingerprintSha256: item.upstreamMachineAudit.auditFingerprintSha256,
    scriptEvidenceFingerprintSha256: item.upstreamMachineAudit.scriptEvidenceFingerprintSha256,
    scriptFileCount: item.upstreamMachineAudit.scriptFileCount,
    indexedSourceEventFiles: item.counts.indexedSourceEventFiles,
    handlerFiles: item.counts.handlerFiles,
    handlerEventTokens: item.counts.handlerEventTokens,
    pointerEventTokens: item.counts.pointerEventTokens,
    keyboardEventTokens: item.counts.keyboardEventTokens,
    clipEventTokens: item.counts.clipEventTokens,
    candidateFamilyCount: item.counts.candidateFamilyCount,
    candidateFamilyIds: item.candidateScenarioFamilies.map((family) => family.familyId),
    timelineNavigationOccurrences: item.counts.timelineNavigationOccurrences,
    inputSignalOccurrences: item.counts.inputSignalOccurrences,
    scoringSignalOccurrences: item.counts.scoringSignalOccurrences,
    randomCallOccurrences: item.counts.randomCallOccurrences,
    replayOrResetOccurrences: item.counts.replayOrResetOccurrences,
    externalApiOccurrences: item.counts.externalApiOccurrences,
    exactTimelineOperationMethodsResolved: 0,
    languageScriptSignalOccurrences: 0,
    runtimeReachabilityEstablished: false,
    machinePrerequisiteBound: true,
  };
}

function projectEmbeddedAudio(card, item, itemIndex) {
  matchEvidenceItem(
    card,
    item,
    "embedded-audio archive",
    item.source?.swf?.path,
    item.source?.swf?.observedSha256,
  );
  if (
    Object.values(item.evidenceLimits || {}).some(Boolean) ||
    item.source.swf.physicalHashVerified !== true ||
    item.source.swf.expectedSha256 !== item.source.swf.observedSha256
  ) {
    throw new Error(`${card.animationId}: embedded-audio evidence was promoted or lost its source binding`);
  }
  const units = [...item.embeddedAudio.defineSounds, ...item.embeddedAudio.soundStreams];
  if (units.some((unit) =>
    unit.payload?.archiveWritten !== true ||
    unit.payload?.physicalHashVerified !== true ||
    unit.cueMappingEstablished !== false ||
    unit.runtimeSynchronizationEstablished !== false
  )) {
    throw new Error(`${card.animationId}: embedded-audio archive unit is incomplete or promoted`);
  }
  const archivePaths = [...new Set(units.map((unit) => unit.payload.archivePath))].sort();
  return {
    evidencePointer: `/items/${itemIndex}`,
    itemFingerprintSha256: item.itemFingerprintSha256,
    defineSoundCount: item.embeddedAudio.defineSounds.length,
    soundStreamCount: item.embeddedAudio.soundStreams.length,
    soundStreamBlockCount: item.embeddedAudio.soundStreams.reduce((sum, stream) => sum + stream.blocks.length, 0),
    audioUnitCount: units.length,
    archiveObjectReferences: archivePaths.length,
    archivePaths,
    allArchivePayloadHashesVerified: units.every((unit) => unit.payload.physicalHashVerified),
    languageClassificationEstablished: false,
    cueMappingEstablished: false,
    runtimeSynchronizationEstablished: false,
    listeningAcceptanceEstablished: false,
    machinePrerequisiteBound: true,
  };
}

function projectAssetDefinitionCensus(card, item, itemIndex) {
  matchEvidenceItem(card, item, "asset-definition census", item.source?.path, item.source?.sha256);
  if (
    item.source.physicalHashVerified !== true ||
    item.runtime.fps !== card.runtime.fps ||
    item.runtime.rootFrameCount !== card.runtime.rootFrameCount ||
    item.tagStream.definitionCount !== item.definitions.length ||
    !HEX_64.test(item.definitionInventorySha256)
  ) {
    throw new Error(`${card.animationId}: asset-definition census facts are incomplete`);
  }
  const exactFontNames = [...new Set(item.fontFacts.map((font) => font.exactName))].sort();
  return {
    evidencePointer: `/items/${itemIndex}`,
    definitionInventorySha256: item.definitionInventorySha256,
    definitionCount: item.definitions.length,
    categoryCounts: item.tagStream.categoryCounts,
    tagCounts: item.tagStream.tagCounts,
    fontDefinitionCount: item.fontFacts.length,
    exactFontNames,
    exactTextOccurrenceCount: item.exactTextOccurrenceCount,
    tagStreamsWithTrailingBytesAfterEnd: item.tagStream.streams.filter(
      (stream) => stream.trailingBytesAfterEnd > 0,
    ).length,
    runtimeVisibilityEstablished: false,
    authoringSemanticsEstablished: false,
    rendererReuseAuthorized: false,
    machinePrerequisiteBound: true,
  };
}

function evidenceRequirement(id, artifact, requirement, extra = {}) {
  return {
    id,
    status: "required-unresolved",
    artifact,
    requirement,
    ...extra,
  };
}

export function deriveSpecificationReadiness(card, preflightItem, workOnlyAuthoringAudit = null) {
  const interaction = card.signals.interaction.candidate;
  const random = card.signals.random.candidate;
  const external = card.signals.external.candidate;
  const hasAudio = card.signals.embeddedAudio.tagCount > 0 || card.signals.externalAudioAssociationCount > 0;
  const hasFla = Boolean(card.source.fla);
  const existingWorkspace = Boolean(preflightItem.existing.workspaceExists);

  const commonDomain = evidenceRequirement(
    "frame-domain-disposition",
    "audit/frame-domain-disposition.json",
    "Resolve every statically root-reachable candidate plus any ActionScript/linkage-created timeline as declared, composited, independent, nonvisual, or explicitly unresolved; bind entry placement and one-indexed frame count.",
  );
  const commonScenario = evidenceRequirement(
    "scenario-inventory",
    "audit/scenario-inventory.json",
    "Enumerate source-evidenced reachable scenarios, languages, terminal states, Replay reset, and every required frame domain without treating static token matches as runtime reachability.",
  );
  const naturalTrace = evidenceRequirement(
    "natural-original-runtime-traces",
    "audit/trace-specs/<requirement-id>.json plus hash-chained original-runtime execution receipts",
    "Provide ordered source-targeted events, pre/post checkpoints, entry-state SHA-256, terminal semantics, and natural Adobe-runtime execution proof for each nested or interactive requirement.",
  );
  if (Boolean(workOnlyAuthoringAudit) !== hasFla) {
    throw new Error(`${card.animationId}: work-only authoring evidence applicability drifted`);
  }
  const authoringLimitation = hasFla
    ? null
    : evidenceRequirement(
      "missing-fla-limitation",
      "migration.json audit.machineEvidence limitations",
      "Record that no paired FLA exists, lower authoring confidence, and rely on shipped-SWF structure plus authoritative runtime evidence without inventing missing authoring facts.",
      {sourceUnavailable: true},
    );
  const audio = evidenceRequirement(
    "audio-cue-map",
    "audio-inventory.csv plus hash-bound audio runtime/listening evidence",
    hasAudio
      ? "Map every embedded/external asset to language, frame domain, scenario, start frame, stop/loop rule, Replay behavior, duration, and authoritative synchronization/listening result."
      : "Prove that audio is not required for each reachable scenario, or bind any runtime-discovered asset/cue; absence of static tags alone is not a final disposition.",
  );
  const hostLanguage = evidenceRequirement(
    "host-language-entry-contract",
    "audit/scenario-inventory.json and source-bound host-entry evidence",
    "Resolve original parent/root/global values, English/Spanish entry behavior, background/title/navigation context, and deny or replace unreviewed legacy side effects.",
  );
  const originalBaseline = evidenceRequirement(
    "authoritative-original-runtime-baselines",
    "baseline/original-runtime/<requirement-id>/capture-manifest.json",
    "Capture every one-indexed frame required by each final domain/scenario/language trace at 800x600 and bind exact PNG hashes, runtime version, source hash, trace, entry state, and seed.",
  );
  const boundaryMap = evidenceRequirement(
    "visual-and-behavior-boundary-map",
    "keyframes.csv",
    "Identify frame 1, every tween/morph boundary, object/text/formula/count/language change, interaction state, audio cue transition, terminal frame, and complete Replay reset from source plus authoritative playback.",
  );
  const rendererDecision = evidenceRequirement(
    "evidence-reviewed-renderer-decision",
    "MIGRATION_BRIEF.md",
    "Re-evaluate the provisional renderer after authoring/runtime evidence; record the chosen renderer, rejected alternatives, native coordinate system, and fidelity risks.",
  );

  const interactionRequirement = interaction
    ? evidenceRequirement(
      "interaction-event-map",
      "audit/scenario-inventory.json",
      "Resolve every pointer, button, clip, keyboard, input, answer/score, completion, and Replay event detected in source to exact target, event order, state transition, and reachable runtime trace.",
    )
    : null;
  const randomRequirement = random
    ? evidenceRequirement(
      "random-outcome-map",
      "audit/scenario-inventory.json plus audit/trace-specs/<random-requirement>.json",
      "Enumerate every source-proven random outcome and call order, then bind deterministic seeds without forcing or inventing branches.",
    )
    : null;
  const externalRequirement = external
    ? evidenceRequirement(
      "external-call-disposition",
      "migration.json audit.networkCalls and reviewed modern API disposition",
      "Disable every unreviewed legacy call; bind an explicit blocked, inert, or reviewed modern replacement without executing the legacy endpoint during audit.",
    )
    : null;

  const migrationJsonEvidence = [commonDomain, commonScenario, naturalTrace, audio, hostLanguage, rendererDecision];
  const keyframeEvidence = [commonDomain, commonScenario, naturalTrace, originalBaseline, boundaryMap, audio];
  const scenarioEvidence = [commonDomain, naturalTrace, hostLanguage, audio];
  if (authoringLimitation) {
    migrationJsonEvidence.unshift(authoringLimitation);
    scenarioEvidence.unshift(authoringLimitation);
  }
  if (interactionRequirement) {
    migrationJsonEvidence.push(interactionRequirement);
    keyframeEvidence.push(interactionRequirement);
    scenarioEvidence.push(interactionRequirement);
  }
  if (randomRequirement) {
    migrationJsonEvidence.push(randomRequirement);
    keyframeEvidence.push(randomRequirement);
    scenarioEvidence.push(randomRequirement);
  }
  if (externalRequirement) {
    migrationJsonEvidence.push(externalRequirement);
    scenarioEvidence.push(externalRequirement);
  }

  return {
    status: "static-source-bound-specification-not-ready",
    existingWorkspace: {
      exists: existingWorkspace,
      path: preflightItem.existing.workspace,
      migrationStatus: preflightItem.existing.migrationStatus,
      route: preflightItem.existing.route,
      rendererDeclared: preflightItem.existing.renderer.declared,
      note: existingWorkspace
        ? "Existing pilot/current-JavaScript artifacts must be reconciled against the requirements below; their presence is not strict specification or acceptance evidence."
        : "No migration workspace has been scaffolded yet. The parallel-shard scaffold gate is open, but this report does not create a workspace or authorize renderer implementation.",
    },
    readyFacts: [
      "physical SWF path, byte length, and SHA-256",
      ...(hasFla ? ["physical FLA path, byte length, SHA-256, and content-addressed 0444 staging copy"] : []),
      ...(hasFla ? ["hash-bound work-only Adobe Animate authoring-structure audit"] : []),
      "native 800x600 stage, 12 FPS, and SWF root timeline frame count",
      "static root-reachable frame-domain candidate inventory with per-domain fingerprints",
      "static ActionScript interaction/random/external-call risk inventory",
      "hash-verified catalog-associated audio inventory and embedded-audio tag counts",
    ],
    migrationJson: {
      status: existingWorkspace ? "existing-preserved-not-finally-specified" : "scaffold-ready-not-created",
      exactRemainingEvidence: migrationJsonEvidence,
      readyForFinalSpecification: false,
    },
    keyframesCsv: {
      status: existingWorkspace ? "existing-or-placeholder-not-authoritative-complete" : "not-created-specification-unresolved",
      exactRemainingEvidence: keyframeEvidence,
      readyForFinalSpecification: false,
    },
    scenarioInventory: {
      status: existingWorkspace ? "existing-static-or-partial-runtime-unverified" : "not-created-specification-unresolved",
      exactRemainingEvidence: scenarioEvidence,
      readyForFinalSpecification: false,
    },
    rendererImplementationAuthorized: false,
    fullSpecificationReady: false,
  };
}

function unresolvedGap(id, artifact, requirement, evidenceInputs = []) {
  return {
    id,
    status: "required-unresolved",
    artifact,
    requirement,
    evidenceInputs,
    machineEvidenceAloneClosesGap: false,
  };
}

function buildMachinePrerequisiteReadiness(card, staticEvents, embeddedAudio, assetDefinitions) {
  const components = {
    staticSourceEventIndex: {
      ready: staticEvents.machinePrerequisiteBound,
      itemFingerprintSha256: staticEvents.itemFingerprintSha256,
      limitation:
        "Source paths, hashes, handler/event tokens, and upstream signal counts are bound. Runtime reachability, exact timeline methods, source line numbers, and code-level language signals remain unresolved.",
    },
    embeddedAudioArchive: {
      ready: embeddedAudio.machinePrerequisiteBound,
      itemFingerprintSha256: embeddedAudio.itemFingerprintSha256,
      limitation:
        "Codec payload bytes are archived and hash-verified. Language, cue mapping, synchronization, audible quality, and listening acceptance remain unresolved.",
    },
    assetDefinitionCensus: {
      ready: assetDefinitions.machinePrerequisiteBound,
      definitionInventorySha256: assetDefinitions.definitionInventorySha256,
      limitation:
        "Definitions, exact tag identities, font names, and exactly decodable text are inventoried. Placement, runtime visibility, authoring semantics, transformation, and renderer reuse remain unresolved.",
    },
  };
  const allComponentsReady = Object.values(components).every((component) => component.ready);
  return {
    status: allComponentsReady
      ? "machine-prerequisite-bundle-ready-human-runtime-and-final-specification-unresolved"
      : "machine-prerequisite-bundle-incomplete",
    allComponentsReady,
    components,
    scopeBoundary:
      "Ready means that the three current acceptance-neutral machine reports and their per-item source identities are hash-bound. It does not mean final specification ready, implementation authorized, fidelity validated, reviewed, accepted, or complete.",
    implementationAuthorized: false,
    finalSpecificationReady: false,
    strictComplete: false,
    animationId: card.animationId,
  };
}

function buildRemainingGaps(card, staticEvents, embeddedAudio, assetDefinitions, workOnlyAuthoringAudit) {
  const hasAudio = embeddedAudio.audioUnitCount > 0 || card.signals.externalAudioAssociationCount > 0;
  const human = [
    ...(!card.source.fla ? [unresolvedGap(
        "named-review-of-missing-fla-confidence-limit",
        "migration.json audit.machineEvidence limitations",
        "A named reviewer must confirm the explicit SWF-only authoring-confidence limitation; no FLA structure may be guessed.",
        ["source SWF SHA-256", "missing paired-FLA fact"],
      )] : []),
    unresolvedGap(
      "named-human-full-diff-review",
      "evidence/contact-sheet-review.json",
      "A named reviewer must inspect the complete per-requirement contact sheets, every failure/outlier, formulas, text, layering, terminal state, and Replay result.",
      ["authoritative original-runtime captures", "implementation captures", "complete RMSE metrics"],
    ),
    ...(hasAudio ? [unresolvedGap(
      "named-human-audio-listening-review",
      "evidence/audio-listening-acceptance.json",
      "A named listener must review every English/Spanish track and embedded cue for audible content, timing, overlap, stop/loop, terminal, and Replay behavior.",
      ["embedded-audio archive", "catalog audio hashes", "authoritative runtime audio sessions"],
    )] : []),
    unresolvedGap(
      "owner-acceptance",
      "evidence/owner-acceptance.json",
      "The owner must accept the final hash-bound implementation and every disclosed exception after human, runtime, audio, and visual evidence exists.",
      ["final technical evidence bundle", "named-human reviews", "strict validator result"],
    ),
  ];

  const runtime = [
    unresolvedGap(
      "authoritative-runtime-reachability-and-scenario-traces",
      "audit/trace-specs/<requirement-id>.json plus original-runtime execution receipts",
      "Prove every reachable domain, state, handler, branch, terminal state, and reset through source-evidenced natural Adobe/original-runtime traces.",
      ["static source-event item fingerprint", "frame-domain candidate fingerprints"],
    ),
    unresolvedGap(
      "bilingual-host-entry-runtime-proof",
      "baseline/original-runtime/<requirement-id>/capture-manifest.json",
      "Prove English and Spanish host/root/global entry state, navigation context, text, audio selection, and language switching without substituting catalog metadata for behavior.",
      ["source-event parsing limitation", "course/host evidence"],
    ),
    ...(card.signals.random.candidate ? [unresolvedGap(
      "random-outcome-and-seed-runtime-proof",
      "audit/trace-specs/<random-requirement>.json",
      "Prove every source-reachable random outcome and call order, then bind deterministic capture seeds without forcing or inventing branches.",
      ["static random-call occurrence files", "authoritative runtime event/state receipts"],
    )] : []),
    ...(hasAudio ? [unresolvedGap(
      "audio-cue-and-synchronization-runtime-proof",
      "evidence/audio-runtime-evidence.json",
      "Prove cue language, domain/scenario, start frame, duration, stop/loop, overlap, terminal, and Replay synchronization against authoritative playback.",
      ["embedded-audio item fingerprint", "catalog audio file hashes"],
    )] : []),
    unresolvedGap(
      "terminal-and-replay-reset-runtime-proof",
      "audit/trace-specs/<replay-requirement>.json",
      "Prove terminal state and complete Replay/reset of playheads, scores, answers, random state, language, audio, and host variables.",
      ["static Replay/reset candidates where present", "authoritative runtime state checkpoints"],
    ),
    unresolvedGap(
      "authoritative-full-frame-baseline-and-rmse",
      "baseline/original-runtime and evidence/metrics.json",
      "Capture every required one-indexed frame for every reachable domain/scenario/language trace at 800x600, then compare implementation frames and preserve every diff/outlier.",
      ["final trace specifications", "original-runtime capture manifests", "implementation capture manifests"],
    ),
  ];

  const finalSpecification = [
    unresolvedGap(
      "source-event-operation-and-language-resolution",
      "audit/scenario-inventory.json",
      staticEvents.timelineNavigationOccurrences > 0
        ? "Resolve exact stop/play/goto method, receiver, arguments, event order, and language behavior from source/authoring/runtime evidence; the current category counts cannot supply those details."
        : "Confirm from source/authoring/runtime evidence that no unresolved timeline or language operation affects a reachable scenario.",
      ["static source-event item fingerprint", "upstream script evidence fingerprint"],
    ),
    unresolvedGap(
      "asset-definition-placement-and-reuse-disposition",
      "asset-inventory.csv",
      "Map every required definition to placement, bounds, transform, depth, visibility, editable output, and renderer disposition; exact byte reuse groups do not authorize renderer sharing.",
      ["definition inventory SHA-256", `${assetDefinitions.definitionCount} static definitions`],
    ),
    unresolvedGap(
      "frame-domain-disposition",
      "audit/frame-domain-disposition.json",
      "Give every static and dynamically created timeline an evidenced declared/composited/independent/nonvisual/unresolved disposition with exact entry state and frame count.",
      ["static frame-domain fingerprints", "authoring/runtime traces"],
    ),
    unresolvedGap(
      "final-scenario-inventory",
      "audit/scenario-inventory.json",
      "Enumerate only source-evidenced reachable scenarios, languages, interaction outcomes, terminal states, and Replay transitions.",
      ["static candidate families", "authoritative runtime reachability"],
    ),
    ...(hasAudio ? [unresolvedGap(
      "final-audio-cue-map",
      "audio-inventory.csv",
      "Bind every embedded and external audio asset to language, scenario, frame domain, cue frame, duration, stop/loop, and Replay behavior.",
      ["embedded-audio archive paths/hashes", "runtime synchronization evidence"],
    )] : []),
    unresolvedGap(
      "final-keyframe-and-boundary-table",
      "keyframes.csv",
      "Record every visual/text/formula/count/audio/interaction boundary and terminal/reset frame from source plus authoritative playback.",
      ["final scenario inventory", "authoritative original-runtime captures"],
    ),
    unresolvedGap(
      "final-migration-manifest",
      "migration.json",
      "Complete the source, classification, dependency, domain, scenario, audio, renderer, test, evidence, exception, and acceptance fields without promoting machine-only facts.",
      ["all final specification artifacts"],
    ),
    unresolvedGap(
      "evidence-reviewed-renderer-decision",
      "MIGRATION_BRIEF.md",
      "Choose and justify the renderer only after authoring, runtime, asset, audio, interaction, and fidelity risks are resolved.",
      ["asset-definition disposition", "scenario/runtime evidence", "audio cue map"],
    ),
  ];

  return {
    human,
    runtime,
    finalSpecification,
    counts: {
      human: human.length,
      runtime: runtime.length,
      finalSpecification: finalSpecification.length,
      resolvedByMachineEvidence: 0,
      resolvedByWorkOnlyAuthoringEvidence: workOnlyAuthoringAudit ? 1 : 0,
    },
    allRequiredGapsClosed: false,
  };
}

function projectRisks(card) {
  const interactionSignals = Object.fromEntries(
    Object.entries(card.signals.actionScript.signalOccurrences)
      .filter(([id]) => INTERACTION_SIGNAL_IDS.has(id))
      .sort(([left], [right]) => left.localeCompare(right)),
  );
  return {
    interaction: {
      candidate: card.signals.interaction.candidate,
      status: card.signals.interaction.status,
      occurrenceCount: card.signals.interaction.occurrenceCount,
      signalOccurrences: interactionSignals,
      buttonHandlerFileCount: card.signals.actionScript.buttonHandlerFileCount,
      clipHandlerFileCount: card.signals.actionScript.clipHandlerFileCount,
      runtimeReachabilityProved: false,
    },
    random: {
      candidate: card.signals.random.candidate,
      status: card.signals.random.status,
      occurrenceCount: card.signals.random.occurrenceCount,
      files: card.signals.random.files,
      deterministicOutcomeMapProved: false,
    },
    external: {
      candidate: card.signals.external.candidate,
      status: card.signals.external.status,
      occurrenceCount: card.signals.external.occurrenceCount,
      actionScriptApiCandidates: card.signals.external.actionScriptApiCandidates,
      swfImportTags: card.signals.external.swfImportTags,
      legacyCallsExecutedDuringAudit: card.signals.external.legacyCallsExecutedDuringAudit,
      reviewedDispositionComplete: false,
    },
    audio: {
      embeddedTagCount: card.signals.embeddedAudio.tagCount,
      embeddedTagCounts: card.signals.embeddedAudio.tagCounts,
      catalogAssociatedFileCount: card.requiredWork.audio.catalogAssociation.associatedFileCount,
      catalogLanguages: card.requiredWork.audio.catalogAssociation.languages,
      catalogFiles: card.requiredWork.audio.catalogAssociation.files,
      cueMappingEstablished: false,
      listeningAcceptanceEstablished: false,
    },
  };
}

export function validateSpecificationReadinessReport(report) {
  const batchId = report?.batch?.batchId;
  const batchConfig = requireBatchConfig(batchId);
  if (report.schemaVersion !== SCHEMA_VERSION || report.reportType !== reportTypeFor(batchId)) {
    throw new Error(`Unexpected G4 L3 ${batchId} specification-readiness schema`);
  }
  if (
    !report.authorityBoundary.acceptanceNeutral ||
    report.authorityBoundary.batchGateOpened !== false ||
    report.authorityBoundary.rendererImplementationCreated !== false ||
    report.authorityBoundary.strictAcceptanceEffect !== false
  ) {
    throw new Error("Specification-readiness report crossed its acceptance-neutral boundary");
  }
  if (report.cards.length !== batchConfig.cardCount || report.summary.cards !== batchConfig.cardCount) {
    throw new Error(
      `Specification-readiness report must contain exactly G4 L3 ${batchId}'s ${batchConfig.cardCount} cards`,
    );
  }
  if (
    report.batch.gate.open !== true ||
    report.batch.gate.prerequisiteKind !== "none" ||
    report.batch.gate.requiredCount !== 0 ||
    report.batch.gate.admittedCount !== 0 ||
    report.batch.implementationAuthorizedNow !== false
  ) {
    throw new Error(`Open ${batchId} scaffold gate was confused with renderer implementation authorization`);
  }
  if (
    report.releaseFramework?.publicationMode !== "atomic" ||
    report.releaseFramework?.developmentMode !== "parallel-shards" ||
    report.releaseFramework?.shardCount !== 2 ||
    report.releaseFramework?.scaffoldGateOpen !== true ||
    report.releaseFramework?.scaffoldGateEffectLimitedToWorkspaceCreation !== true ||
    report.acceptance.implementationAuthorized !== false ||
    report.acceptance.strictMigrationComplete !== false
  ) {
    throw new Error(`${batchId} lost the parallel-shard/atomic-publication boundary`);
  }
  const actualFlaBacked = report.cards.filter((card) => Boolean(card.source.fla)).length;
  if (
    report.summary.flaBacked !== actualFlaBacked ||
    report.summary.swfOnly !== batchConfig.cardCount - actualFlaBacked
  ) {
    throw new Error(`G4 L3 ${batchId} source-kind summary does not match the source-bound cards`);
  }
  if (new Set(report.cards.map((card) => card.animationId)).size !== batchConfig.cardCount) {
    throw new Error(`${batchId} animation IDs must be unique`);
  }
  if (!sameJson(report.batch.orderedAnimationIds, report.cards.map((card) => card.animationId))) {
    throw new Error(`${batchId} report order does not match the catalog queue`);
  }
  if (
    !Number.isInteger(report.batch.globalSequenceStart) ||
    report.batch.globalSequenceEnd !== report.batch.globalSequenceStart + batchConfig.cardCount - 1
  ) {
    throw new Error(`${batchId} global sequence bounds are incomplete`);
  }
  for (const [index, card] of report.cards.entries()) {
    if (card.sequence !== report.batch.globalSequenceStart + index || card.batchOrdinal !== index + 1) {
      throw new Error(`${card.animationId}: non-deterministic batch ordering`);
    }
    if (!HEX_64.test(card.source.swf.sha256) || !card.source.swf.physicalHashVerifiedNow) {
      throw new Error(`${card.animationId}: SWF source hash is not physically verified`);
    }
    if (card.assetId !== `swf-${card.source.swf.sha256}`) {
      throw new Error(`${card.animationId}: assetId does not bind the SWF SHA-256`);
    }
    if (card.rootTimeline.fps !== 12 || card.rootTimeline.stage.width !== 800 || card.rootTimeline.stage.height !== 600) {
      throw new Error(`${card.animationId}: unexpected native stage or FPS`);
    }
    const roots = card.rootReachableFrameDomainCandidates.filter((domain) => domain.domainId === "root");
    if (
      roots.length !== 1 ||
      roots[0].declaredFrameCount !== card.rootTimeline.frameCount ||
      card.rootReachableFrameDomainCandidates.some((domain) => !HEX_64.test(domain.staticDomainFingerprintSha256))
    ) {
      throw new Error(`${card.animationId}: root-domain candidate binding is incomplete`);
    }
    if (card.risks.external.legacyCallsExecutedDuringAudit !== 0) {
      throw new Error(`${card.animationId}: a legacy external call was executed during audit`);
    }
    const machinePrerequisites = card.machinePrerequisiteReadiness;
    if (
      !machinePrerequisites?.allComponentsReady ||
      !machinePrerequisites.components.staticSourceEventIndex.ready ||
      !machinePrerequisites.components.embeddedAudioArchive.ready ||
      !machinePrerequisites.components.assetDefinitionCensus.ready ||
      machinePrerequisites.implementationAuthorized ||
      machinePrerequisites.finalSpecificationReady ||
      machinePrerequisites.strictComplete
    ) {
      throw new Error(`${card.animationId}: machine prerequisite bundle is incomplete or was promoted`);
    }
    const machineFacts = card.machinePrerequisiteFacts;
    if (
      !HEX_64.test(machineFacts?.staticSourceEvents?.itemFingerprintSha256 || "") ||
      !HEX_64.test(machineFacts?.embeddedAudio?.itemFingerprintSha256 || "") ||
      !HEX_64.test(machineFacts?.assetDefinitions?.definitionInventorySha256 || "") ||
      machineFacts.staticSourceEvents.runtimeReachabilityEstablished !== false ||
      machineFacts.staticSourceEvents.exactTimelineOperationMethodsResolved !== 0 ||
      machineFacts.staticSourceEvents.languageScriptSignalOccurrences !== 0 ||
      machineFacts.embeddedAudio.cueMappingEstablished !== false ||
      machineFacts.embeddedAudio.runtimeSynchronizationEstablished !== false ||
      machineFacts.embeddedAudio.listeningAcceptanceEstablished !== false ||
      machineFacts.assetDefinitions.runtimeVisibilityEstablished !== false ||
      machineFacts.assetDefinitions.rendererReuseAuthorized !== false
    ) {
      throw new Error(`${card.animationId}: machine prerequisite facts are missing or over-claimed`);
    }
    if (
      card.remainingGaps?.allRequiredGapsClosed !== false ||
      card.remainingGaps.counts.resolvedByMachineEvidence !== 0 ||
      card.remainingGaps.counts.resolvedByWorkOnlyAuthoringEvidence !== (card.source.fla ? 1 : 0) ||
      !["human", "runtime", "finalSpecification"].every((kind) =>
        card.remainingGaps[kind]?.length > 0 &&
        card.remainingGaps[kind].every((gap) =>
          gap.status === "required-unresolved" && gap.machineEvidenceAloneClosesGap === false
        )
      )
    ) {
      throw new Error(`${card.animationId}: exact human/runtime/specification gaps are missing or falsely closed`);
    }
    if (
      card.specificationReadiness.fullSpecificationReady ||
      card.specificationReadiness.rendererImplementationAuthorized ||
      card.specificationReadiness.migrationJson.readyForFinalSpecification ||
      card.specificationReadiness.keyframesCsv.readyForFinalSpecification ||
      card.specificationReadiness.scenarioInventory.readyForFinalSpecification
    ) {
      throw new Error(`${card.animationId}: unresolved specification work was promoted`);
    }
    if (card.source.fla) {
      if (!card.source.fla.physicalHashVerifiedNow || !card.source.animatePrepare?.workingCopy.byteIdenticalToSource) {
        throw new Error(`${card.animationId}: paired FLA preparation is incomplete`);
      }
      const authoring = card.workOnlyAuthoringAudit;
      if (
        !authoring ||
        authoring.status !== "verified-work-only-authoring-audit" ||
        authoring.designatedDialogOperator !== DIALOG_OPERATOR ||
        !HEX_64.test(authoring.receipt?.sha256 || "") ||
        !HEX_64.test(authoring.workEvidence?.sha256 || "") ||
        !HEX_64.test(authoring.artifacts?.report?.sha256 || "") ||
        !HEX_64.test(authoring.artifacts?.png?.sha256 || "") ||
        authoring.sourceSwfExecuted !== false ||
        authoring.provesFlaSwfEquivalence !== false ||
        authoring.originalRuntimeBehaviorEstablished !== false ||
        authoring.authoringAccepted !== false ||
        authoring.strictAcceptanceEffect !== false ||
        card.humanAssistedAnimate !== null ||
        card.remainingGaps.human.some((gap) => gap.id === "human-assisted-paired-animate-authoring-audit") ||
        card.specificationReadiness.migrationJson.exactRemainingEvidence.some(
          (requirement) => requirement.id === "paired-animate-authoring-audit",
        )
      ) {
        throw new Error(`${card.animationId}: work-only paired authoring evidence is missing, unsafe, or still pending`);
      }
    } else if (card.humanAssistedAnimate !== null || card.source.animatePrepare !== null
      || card.workOnlyAuthoringAudit !== null
      || !card.remainingGaps.human.some((gap) => gap.id === "named-review-of-missing-fla-confidence-limit")) {
      throw new Error(`${card.animationId}: SWF-only item cannot have paired Animate preparation`);
    }
    if (Object.values(card.acceptance).some(Boolean)) {
      throw new Error(`${card.animationId}: acceptance-neutral specification card contains a passing gate`);
    }
  }
  const summaryProjection = {
    physicallyVerifiedSwfSources: report.cards.filter((card) => card.source.swf.physicalHashVerifiedNow).length,
    physicallyVerifiedFlaSources: report.cards.filter((card) => card.source.fla?.physicalHashVerifiedNow).length,
    readOnlyAnimateStagingCopies: report.cards.filter((card) => card.source.animatePrepare?.workingCopy.readOnly).length,
    verifiedWorkOnlyAuthoringAudits: report.cards.filter((card) => card.workOnlyAuthoringAudit).length,
    pendingApplicableAuthoringAudits: report.cards.filter((card) =>
      card.source.fla && !card.workOnlyAuthoringAudit).length,
    authoringAuditNotApplicable: report.cards.filter((card) => !card.source.fla).length,
    rootFrameCountSum: report.cards.reduce((sum, card) => sum + card.rootTimeline.frameCount, 0),
    staticRootReachableDomainCandidates: report.cards.reduce(
      (sum, card) => sum + card.rootReachableFrameDomainCandidates.length,
      0,
    ),
    interactionCandidates: report.cards.filter((card) => card.risks.interaction.candidate).length,
    randomCandidates: report.cards.filter((card) => card.risks.random.candidate).length,
    externalCandidates: report.cards.filter((card) => card.risks.external.candidate).length,
    itemsWithEmbeddedAudioTags: report.cards.filter((card) => card.risks.audio.embeddedTagCount > 0).length,
    itemsWithCatalogAudio: report.cards.filter((card) => card.risks.audio.catalogAssociatedFileCount > 0).length,
    uniqueCatalogAudioFiles: new Set(
      report.cards.flatMap((card) => card.risks.audio.catalogFiles.map((file) => file.path)),
    ).size,
    existingMigrationWorkspaces: report.cards.filter((card) => card.specificationReadiness.existingWorkspace.exists).length,
    machinePrerequisiteBundleReady: report.cards.filter(
      (card) => card.machinePrerequisiteReadiness.allComponentsReady,
    ).length,
    staticSourceEventIndexBound: report.cards.filter(
      (card) => card.machinePrerequisiteFacts.staticSourceEvents.machinePrerequisiteBound,
    ).length,
    embeddedAudioArchiveBound: report.cards.filter(
      (card) => card.machinePrerequisiteFacts.embeddedAudio.machinePrerequisiteBound,
    ).length,
    assetDefinitionCensusBound: report.cards.filter(
      (card) => card.machinePrerequisiteFacts.assetDefinitions.machinePrerequisiteBound,
    ).length,
    indexedSourceEventFiles: report.cards.reduce(
      (sum, card) => sum + card.machinePrerequisiteFacts.staticSourceEvents.indexedSourceEventFiles,
      0,
    ),
    indexedSourceHandlerFiles: report.cards.reduce(
      (sum, card) => sum + card.machinePrerequisiteFacts.staticSourceEvents.handlerFiles,
      0,
    ),
    staticCandidateFamilies: report.cards.reduce(
      (sum, card) => sum + card.machinePrerequisiteFacts.staticSourceEvents.candidateFamilyCount,
      0,
    ),
    embeddedAudioArchiveUnits: report.cards.reduce(
      (sum, card) => sum + card.machinePrerequisiteFacts.embeddedAudio.audioUnitCount,
      0,
    ),
    itemsWithArchivedEmbeddedAudio: report.cards.filter(
      (card) => card.machinePrerequisiteFacts.embeddedAudio.audioUnitCount > 0,
    ).length,
    assetDefinitionCount: report.cards.reduce(
      (sum, card) => sum + card.machinePrerequisiteFacts.assetDefinitions.definitionCount,
      0,
    ),
    exactFontDefinitionFacts: report.cards.reduce(
      (sum, card) => sum + card.machinePrerequisiteFacts.assetDefinitions.fontDefinitionCount,
      0,
    ),
    exactTextOccurrences: report.cards.reduce(
      (sum, card) => sum + card.machinePrerequisiteFacts.assetDefinitions.exactTextOccurrenceCount,
      0,
    ),
    unresolvedHumanGaps: report.cards.reduce((sum, card) => sum + card.remainingGaps.counts.human, 0),
    resolvedWorkOnlyAuthoringGaps: report.cards.reduce(
      (sum, card) => sum + card.remainingGaps.counts.resolvedByWorkOnlyAuthoringEvidence,
      0,
    ),
    unresolvedRuntimeGaps: report.cards.reduce((sum, card) => sum + card.remainingGaps.counts.runtime, 0),
    unresolvedFinalSpecificationGaps: report.cards.reduce(
      (sum, card) => sum + card.remainingGaps.counts.finalSpecification,
      0,
    ),
    finalSpecificationReady: report.cards.filter((card) => card.specificationReadiness.fullSpecificationReady).length,
  };
  for (const [field, value] of Object.entries(summaryProjection)) {
    if (report.summary[field] !== value) throw new Error(`${batchId} summary field ${field} drifted from its cards`);
  }
  if (
    report.summary.humanEvidenceReady !== 0 ||
    report.summary.authoritativeRuntimeReady !== 0 ||
    report.summary.implementationAuthorized !== 0 ||
    report.summary.strictComplete !== 0
  ) {
    throw new Error(`${batchId} acceptance-neutral summary contains a passing gate`);
  }
  if (report.sourceBindings.animateAuthoringAuditIndex?.verifiedWorkOnlyAuthoringAudits !== 29
    || report.sourceBindings.animateAuthoringAuditIndex?.pendingApplicableAuthoringAudits !== 0
    || report.sourceBindings.animateAuthoringAuditIndex?.originalRuntimeBaselinesEstablished !== 0
    || report.sourceBindings.animateAuthoringAuditIndex?.strictAcceptanceEffect !== false
    || !HEX_64.test(report.sourceBindings.animateAuthoringAuditIndex?.sha256 || "")
    || report.authorityBoundary.workOnlyAuthoringEvidenceBound !== true
    || report.authorityBoundary.authoringAuditAccepted !== false
    || report.acceptance.authoringAccepted !== false) {
    throw new Error(`${batchId} work-only authoring evidence binding is incomplete or promoted`);
  }
  return report;
}

export async function buildSpecificationReadinessReport(batchId = DEFAULT_BATCH_ID) {
  const batchConfig = requireBatchConfig(batchId);
  const [
    workCardBytes,
    machineBytes,
    preflightBytes,
    animatePrepareBytes,
    sourceEventIndexBytes,
    embeddedAudioArchiveBytes,
    assetDefinitionCensusBytes,
    animateAuthoringAuditIndexBytes,
    animateAuthoringAuditIndexGeneratorBytes,
    assistRunnerBytes,
    generatorBytes,
  ] = await Promise.all([
    readFile(WORK_CARDS_PATH),
    readFile(MACHINE_AUDIT_PATH),
    readFile(PREFLIGHT_PATH),
    readFile(ANIMATE_PREPARE_PATH),
    readFile(STATIC_SOURCE_EVENT_INDEX_PATH),
    readFile(EMBEDDED_AUDIO_ARCHIVE_PATH),
    readFile(ASSET_DEFINITION_CENSUS_PATH),
    readFile(ANIMATE_AUTHORING_AUDIT_INDEX_PATH),
    readFile(ANIMATE_AUTHORING_AUDIT_INDEX_GENERATOR_PATH),
    readFile(ASSIST_RUNNER_PATH),
    readFile(scriptPath),
  ]);
  const workCards = JSON.parse(workCardBytes);
  const machineAudit = JSON.parse(machineBytes);
  const preflight = JSON.parse(preflightBytes);
  const animatePrepare = JSON.parse(animatePrepareBytes);
  const sourceEventIndex = JSON.parse(sourceEventIndexBytes);
  const embeddedAudioArchive = JSON.parse(embeddedAudioArchiveBytes);
  const assetDefinitionCensus = JSON.parse(assetDefinitionCensusBytes);
  const animateAuthoringAuditIndex = JSON.parse(animateAuthoringAuditIndexBytes);
  assertMachinePrerequisiteReports({
    machineAuditBytes: machineBytes,
    workCardBytes,
    sourceEventIndex,
    embeddedAudioArchive,
    assetDefinitionCensus,
  });
  const audioCasBinding = await verifyAudioArchiveCas(embeddedAudioArchive);
  const batch = workCards.batchPlan.find((candidate) => candidate.batchId === batchId);
  if (
    !batch ||
    batch.cardCount !== batchConfig.cardCount ||
    batch.orderedAnimationIds.length !== batchConfig.cardCount ||
    batch.gate.open !== true ||
    batch.gate.prerequisiteKind !== "none" ||
    batch.gate.requiredCount !== 0 ||
    batch.gate.admittedCount !== 0 ||
    batch.implementationAuthorizedNow
  ) {
    throw new Error(`G4 L3 ${batchId} is missing, changed size, or no longer scaffold-open and implementation-closed`);
  }
  if (sha256(machineBytes) !== workCards.sourceBindings.machineAudit.sha256) {
    throw new Error("Machine source audit drifted from the work-card binding");
  }
  if (sha256(preflightBytes) !== workCards.sourceBindings.preflight.sha256) {
    throw new Error("Automation preflight drifted from the work-card binding");
  }
  if (sha256(animatePrepareBytes) !== workCards.sourceBindings.animatePrepare.sha256) {
    throw new Error("Animate prepare readiness drifted from the work-card binding");
  }
  const boundAssistRunner = animatePrepare.toolBindings?.existingAssistRunner;
  if (
    boundAssistRunner?.file !== relative(ASSIST_RUNNER_PATH) ||
    !Number.isSafeInteger(boundAssistRunner?.bytes) ||
    boundAssistRunner.bytes <= 0 ||
    !HEX_64.test(boundAssistRunner?.sha256 || "")
  ) {
    throw new Error("Animate prepare-readiness is missing its historical assist-runner provenance");
  }
  const authoringById = await verifyAnimateAuthoringAuditIndex(animateAuthoringAuditIndex, machineAudit);
  const stagingManifestPath = resolveProjectPath(animatePrepare.contentAddressedManifest.file);
  const stagingManifestBytes = await readFile(stagingManifestPath);
  if (
    sha256(stagingManifestBytes) !== animatePrepare.contentAddressedManifest.sha256 ||
    stagingManifestBytes.length !== animatePrepare.contentAddressedManifest.bytes
  ) {
    throw new Error("Content-addressed G4 L3 Animate staging manifest is stale");
  }
  const stagingManifest = JSON.parse(stagingManifestBytes);
  const stagingMetadata = await stat(stagingManifestPath);
  if ((stagingMetadata.mode & 0o777) !== 0o444) throw new Error("Animate staging manifest must remain 0444");

  const machineById = new Map(machineAudit.items.map((item, index) => [item.animationId, {item, index}]));
  const preflightById = new Map(preflight.items.map((item, index) => [item.animationId, {item, index}]));
  const stagingById = new Map(stagingManifest.entries.map((entry, index) => [entry.animationId, {entry, index}]));
  const sourceEventsById = new Map(sourceEventIndex.items.map((item, index) => [item.animationId, {item, index}]));
  const embeddedAudioById = new Map(
    embeddedAudioArchive.items.map((item, index) => [item.animationId, {item, index}]),
  );
  const assetDefinitionsById = new Map(
    assetDefinitionCensus.items.map((item, index) => [item.animationId, {item, index}]),
  );
  const authoringIndexById = new Map(
    animateAuthoringAuditIndex.items.map((item, index) => [item.animationId, {item, index}]),
  );
  const selectedBatchCards = batch.orderedAnimationIds.map((animationId, index) => {
    const card = workCards.cards.find((candidate) => candidate.animationId === animationId);
    const globalIndex = workCards.cards.indexOf(card);
    if (
      !card ||
      globalIndex < 0 ||
      card.sequence !== globalIndex + 1 ||
      card.batch.batchId !== batchId ||
      card.batch.batchOrdinal !== index + 1
    ) {
      throw new Error(`${animationId}: work-card batch ordering drift`);
    }
    return card;
  });

  const cards = [];
  for (const [index, card] of selectedBatchCards.entries()) {
    const machineMatch = machineById.get(card.animationId);
    const preflightMatch = preflightById.get(card.animationId);
    const sourceEventMatch = sourceEventsById.get(card.animationId);
    const embeddedAudioMatch = embeddedAudioById.get(card.animationId);
    const assetDefinitionMatch = assetDefinitionsById.get(card.animationId);
    if (
      !machineMatch ||
      !preflightMatch ||
      !sourceEventMatch ||
      !embeddedAudioMatch ||
      !assetDefinitionMatch
    ) {
      throw new Error(`${card.animationId}: direct machine prerequisite evidence is missing`);
    }
    const machineItem = machineMatch.item;
    const preflightItem = preflightMatch.item;
    if (
      machineItem.auditFingerprintSha256 !== card.runtime.machineAuditFingerprintSha256 ||
      machineItem.source.swf.sha256 !== card.source.swf.sha256 ||
      machineItem.source.fla?.sha256 !== card.source.fla?.sha256
    ) {
      throw new Error(`${card.animationId}: machine audit and work-card source identity disagree`);
    }
    const swf = await verifyRegularFileBinding(card.source.swf, `${card.animationId} SWF`);
    let fla = null;
    let animatePrepareBinding = null;
    if (card.source.fla) {
      fla = await verifyRegularFileBinding(card.source.fla, `${card.animationId} FLA`);
      const stagingMatch = stagingById.get(card.animationId);
      animatePrepareBinding = await verifyStagedEntry(stagingMatch?.entry, fla, swf);
    }
    const authoringResult = authoringById.get(card.animationId) ?? null;
    const workOnlyAuthoringAudit = projectWorkOnlyAuthoringAudit(card, authoringResult);
    const candidates = projectFrameDomainCandidates(machineItem, card);
    const risks = projectRisks(card);
    const specificationReadiness = deriveSpecificationReadiness(card, preflightItem, workOnlyAuthoringAudit);
    const staticSourceEvents = projectStaticSourceEvents(
      card,
      sourceEventMatch.item,
      sourceEventMatch.index,
    );
    const embeddedAudio = projectEmbeddedAudio(
      card,
      embeddedAudioMatch.item,
      embeddedAudioMatch.index,
    );
    const assetDefinitions = projectAssetDefinitionCensus(
      card,
      assetDefinitionMatch.item,
      assetDefinitionMatch.index,
    );
    const machinePrerequisiteReadiness = buildMachinePrerequisiteReadiness(
      card,
      staticSourceEvents,
      embeddedAudio,
      assetDefinitions,
    );
    const remainingGaps = buildRemainingGaps(
      card,
      staticSourceEvents,
      embeddedAudio,
      assetDefinitions,
      workOnlyAuthoringAudit,
    );
    cards.push({
      sequence: card.sequence,
      batchOrdinal: index + 1,
      animationId: card.animationId,
      assetId: card.assetId,
      releaseRole: card.releaseRole,
      classification: card.classification,
      evidencePointers: {
        workCard: `/cards/${workCards.cards.indexOf(card)}`,
        machineAudit: `/items/${machineMatch.index}`,
        preflight: `/items/${preflightMatch.index}`,
        animateStagingEntry: card.source.fla ? `/entries/${stagingById.get(card.animationId).index}` : null,
        staticSourceEventIndex: `/items/${sourceEventMatch.index}`,
        embeddedAudioArchive: `/items/${embeddedAudioMatch.index}`,
        assetDefinitionCensus: `/items/${assetDefinitionMatch.index}`,
        animateAuthoringAuditIndex: card.source.fla
          ? `/items/${authoringIndexById.get(card.animationId).index}`
          : null,
      },
      source: {
        sourceKind: card.source.sourceKind,
        swf,
        fla,
        animatePrepare: animatePrepareBinding,
      },
      rootTimeline: {
        definitionId: "root",
        indexing: "one-indexed",
        stage: card.runtime.stage,
        fps: card.runtime.fps,
        frameCount: card.runtime.rootFrameCount,
        durationMs: card.runtime.rootDurationMs,
        actionScriptVersion: card.runtime.actionScriptVersion,
        staticStructureSha256: card.runtime.staticStructureSha256,
        machineAuditFingerprintSha256: card.runtime.machineAuditFingerprintSha256,
        boundary:
          "This is the SWF root timeline only; longer child MovieClip timelines remain separate candidates and cannot replace runtime.frameCount.",
      },
      rootReachableFrameDomainCandidates: candidates,
      risks,
      machinePrerequisiteFacts: {
        staticSourceEvents,
        embeddedAudio,
        assetDefinitions,
      },
      machinePrerequisiteReadiness,
      remainingGaps,
      specificationReadiness,
      workOnlyAuthoringAudit,
      humanAssistedAnimate: null,
      acceptance: {
        migrationJsonFinallySpecified: false,
        keyframesFinallySpecified: false,
        scenariosFinallySpecified: false,
        implementationAuthorized: false,
        authoritativeBaselineComplete: false,
        strictMigrationComplete: false,
      },
    });
  }

  const uniqueAudioFiles = new Set(cards.flatMap((card) => card.risks.audio.catalogFiles.map((file) => file.path)));
  const report = {
    schemaVersion: SCHEMA_VERSION,
    reportType: reportTypeFor(batchId),
    generator: {
      path: relative(scriptPath),
      version: SCHEMA_VERSION,
      sha256: sha256(generatorBytes),
    },
    scope:
      `Evidence-bound specification preparation for G4 L3 ${batchId}'s ${batchConfig.cardCount} cards only; it binds completed work-only Animate authoring audits for every FLA-backed card. The parallel-shard scaffold gate is open, but this report performs no migration scaffolding, renderer implementation, runtime capture, review, approval, or gate promotion.`,
    authorityBoundary: {
      acceptanceNeutral: true,
      sourceAssetWrites: 0,
      animateGuiLaunchedByThisGenerator: false,
      dialogInteractionPerformedByThisGenerator: false,
      migrationWorkspacesCreated: 0,
      rendererImplementationCreated: false,
      batchGateOpened: false,
      statusReviewApprovalLedgerWrites: 0,
      workOnlyAuthoringEvidenceBound: true,
      authoringAuditAccepted: false,
      strictAcceptanceEffect: false,
    },
    sourceBindings: {
      workCards: {path: relative(WORK_CARDS_PATH), bytes: workCardBytes.length, sha256: sha256(workCardBytes)},
      machineAudit: {
        path: relative(MACHINE_AUDIT_PATH),
        bytes: machineBytes.length,
        sha256: sha256(machineBytes),
        auditSetSha256: machineAudit.summary.auditSetSha256,
      },
      preflight: {path: relative(PREFLIGHT_PATH), bytes: preflightBytes.length, sha256: sha256(preflightBytes)},
      animatePrepare: {
        path: relative(ANIMATE_PREPARE_PATH),
        bytes: animatePrepareBytes.length,
        sha256: sha256(animatePrepareBytes),
      },
      staticSourceEventIndex: {
        path: relative(STATIC_SOURCE_EVENT_INDEX_PATH),
        bytes: sourceEventIndexBytes.length,
        sha256: sha256(sourceEventIndexBytes),
        itemSetSha256: sourceEventIndex.summary.itemSetSha256,
        sourceScriptFilesBound: sourceEventIndex.summary.sourceScriptFilesBound,
        runtimeReachabilityEstablished: false,
      },
      embeddedAudioArchive: {
        path: relative(EMBEDDED_AUDIO_ARCHIVE_PATH),
        bytes: embeddedAudioArchiveBytes.length,
        sha256: sha256(embeddedAudioArchiveBytes),
        itemSetSha256: embeddedAudioArchive.summary.itemSetSha256,
        sourceSetSha256: embeddedAudioArchive.summary.sourceSetSha256,
        ...audioCasBinding,
      },
      assetDefinitionCensus: {
        path: relative(ASSET_DEFINITION_CENSUS_PATH),
        bytes: assetDefinitionCensusBytes.length,
        sha256: sha256(assetDefinitionCensusBytes),
        totalDefinitions: assetDefinitionCensus.summary.totalDefinitions,
        uniqueExactDefinitionIdentities: assetDefinitionCensus.summary.uniqueExactDefinitionIdentities,
        runtimeVisibilityEstablished: false,
        rendererReuseAuthorized: false,
      },
      animateAuthoringAuditIndex: {
        path: relative(ANIMATE_AUTHORING_AUDIT_INDEX_PATH),
        bytes: animateAuthoringAuditIndexBytes.length,
        sha256: sha256(animateAuthoringAuditIndexBytes),
        reportType: animateAuthoringAuditIndex.reportType,
        schemaVersion: animateAuthoringAuditIndex.schemaVersion,
        generator: {
          path: relative(ANIMATE_AUTHORING_AUDIT_INDEX_GENERATOR_PATH),
          bytes: animateAuthoringAuditIndexGeneratorBytes.length,
          sha256: sha256(animateAuthoringAuditIndexGeneratorBytes),
        },
        verifiedWorkOnlyAuthoringAudits: 29,
        pendingApplicableAuthoringAudits: 0,
        originalRuntimeBaselinesEstablished: 0,
        strictAcceptanceEffect: false,
      },
      animatePrepareHistoricalAssistRunner: {
        path: boundAssistRunner.file,
        bytes: boundAssistRunner.bytes,
        sha256: boundAssistRunner.sha256,
        historicalSnapshotOnly: true,
      },
      pairedAnimateAssistRunner: {
        path: relative(ASSIST_RUNNER_PATH),
        bytes: assistRunnerBytes.length,
        sha256: sha256(assistRunnerBytes),
        pairedFlaSwfMode: true,
        dialogAutomationAllowed: false,
      },
      animateStagingManifest: {
        path: relative(stagingManifestPath),
        bytes: stagingManifestBytes.length,
        sha256: sha256(stagingManifestBytes),
        mode: "0444",
        contentAddressed: true,
      },
      catalogs: {
        batches: workCards.sourceBindings.batches,
        lessonReleases: workCards.sourceBindings.lessonReleases,
        lessons: workCards.sourceBindings.lessons,
        audioGroups: workCards.sourceBindings.audioGroups,
      },
    },
    batch: {
      batchId,
      releasePart: batch.releasePart,
      releasePartCount: batch.releasePartCount,
      globalSequenceStart: cards[0].sequence,
      globalSequenceEnd: cards.at(-1).sequence,
      orderedAnimationIds: [...batch.orderedAnimationIds],
      shardId: batch.shardId,
      shardOrdinal: batch.shardOrdinal,
      parallelGroup: batch.parallelGroup,
      developmentPrerequisites: batch.developmentPrerequisites,
      gate: batch.gate,
      implementationAuthorizedNow: false,
      entryRule: batch.entryRule,
    },
    releaseFramework: {
      ...workCards.releaseFramework,
      scaffoldGateOpen: true,
      scaffoldGateEffectLimitedToWorkspaceCreation: true,
      rendererImplementationAuthorized: false,
    },
    summary: {
      cards: cards.length,
      flaBacked: cards.filter((card) => card.source.fla).length,
      swfOnly: cards.filter((card) => !card.source.fla).length,
      physicallyVerifiedSwfSources: cards.filter((card) => card.source.swf.physicalHashVerifiedNow).length,
      physicallyVerifiedFlaSources: cards.filter((card) => card.source.fla?.physicalHashVerifiedNow).length,
      readOnlyAnimateStagingCopies: cards.filter((card) => card.source.animatePrepare?.workingCopy.readOnly).length,
      verifiedWorkOnlyAuthoringAudits: cards.filter((card) => card.workOnlyAuthoringAudit).length,
      pendingApplicableAuthoringAudits: cards.filter((card) =>
        card.source.fla && !card.workOnlyAuthoringAudit).length,
      authoringAuditNotApplicable: cards.filter((card) => !card.source.fla).length,
      rootFrameCountSum: cards.reduce((sum, card) => sum + card.rootTimeline.frameCount, 0),
      staticRootReachableDomainCandidates: cards.reduce(
        (sum, card) => sum + card.rootReachableFrameDomainCandidates.length,
        0,
      ),
      interactionCandidates: cards.filter((card) => card.risks.interaction.candidate).length,
      randomCandidates: cards.filter((card) => card.risks.random.candidate).length,
      externalCandidates: cards.filter((card) => card.risks.external.candidate).length,
      itemsWithEmbeddedAudioTags: cards.filter((card) => card.risks.audio.embeddedTagCount > 0).length,
      itemsWithCatalogAudio: cards.filter((card) => card.risks.audio.catalogAssociatedFileCount > 0).length,
      uniqueCatalogAudioFiles: uniqueAudioFiles.size,
      existingMigrationWorkspaces: cards.filter((card) => card.specificationReadiness.existingWorkspace.exists).length,
      machinePrerequisiteBundleReady: cards.filter(
        (card) => card.machinePrerequisiteReadiness.allComponentsReady,
      ).length,
      staticSourceEventIndexBound: cards.filter(
        (card) => card.machinePrerequisiteFacts.staticSourceEvents.machinePrerequisiteBound,
      ).length,
      embeddedAudioArchiveBound: cards.filter(
        (card) => card.machinePrerequisiteFacts.embeddedAudio.machinePrerequisiteBound,
      ).length,
      assetDefinitionCensusBound: cards.filter(
        (card) => card.machinePrerequisiteFacts.assetDefinitions.machinePrerequisiteBound,
      ).length,
      indexedSourceEventFiles: cards.reduce(
        (sum, card) => sum + card.machinePrerequisiteFacts.staticSourceEvents.indexedSourceEventFiles,
        0,
      ),
      indexedSourceHandlerFiles: cards.reduce(
        (sum, card) => sum + card.machinePrerequisiteFacts.staticSourceEvents.handlerFiles,
        0,
      ),
      staticCandidateFamilies: cards.reduce(
        (sum, card) => sum + card.machinePrerequisiteFacts.staticSourceEvents.candidateFamilyCount,
        0,
      ),
      embeddedAudioArchiveUnits: cards.reduce(
        (sum, card) => sum + card.machinePrerequisiteFacts.embeddedAudio.audioUnitCount,
        0,
      ),
      itemsWithArchivedEmbeddedAudio: cards.filter(
        (card) => card.machinePrerequisiteFacts.embeddedAudio.audioUnitCount > 0,
      ).length,
      assetDefinitionCount: cards.reduce(
        (sum, card) => sum + card.machinePrerequisiteFacts.assetDefinitions.definitionCount,
        0,
      ),
      exactFontDefinitionFacts: cards.reduce(
        (sum, card) => sum + card.machinePrerequisiteFacts.assetDefinitions.fontDefinitionCount,
        0,
      ),
      exactTextOccurrences: cards.reduce(
        (sum, card) => sum + card.machinePrerequisiteFacts.assetDefinitions.exactTextOccurrenceCount,
        0,
      ),
      unresolvedHumanGaps: cards.reduce((sum, card) => sum + card.remainingGaps.counts.human, 0),
      resolvedWorkOnlyAuthoringGaps: cards.reduce(
        (sum, card) => sum + card.remainingGaps.counts.resolvedByWorkOnlyAuthoringEvidence,
        0,
      ),
      unresolvedRuntimeGaps: cards.reduce((sum, card) => sum + card.remainingGaps.counts.runtime, 0),
      unresolvedFinalSpecificationGaps: cards.reduce(
        (sum, card) => sum + card.remainingGaps.counts.finalSpecification,
        0,
      ),
      humanEvidenceReady: 0,
      authoritativeRuntimeReady: 0,
      finalSpecificationReady: cards.filter((card) => card.specificationReadiness.fullSpecificationReady).length,
      implementationAuthorized: 0,
      strictComplete: 0,
    },
    cards,
    acceptance: {
      authoringAccepted: false,
      finalSpecificationReady: false,
      implementationAuthorized: false,
      originalRuntimeBaselineAccepted: false,
      audioAccepted: false,
      humanVisualReviewAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      statement:
        "This report proves physical source bindings, acceptance-neutral static source-event/embedded-audio/asset-definition machine prerequisites, content-addressed read-only FLA preparation, and completed work-only Animate authoring-structure audits for every FLA-backed card. Those audits are not authoring acceptance, shipped-SWF execution, FLA/SWF equivalence, or original-runtime proof. The report does not prove runtime reachability, final specification, JavaScript fidelity, audio synchronization/listening, RMSE, review, acceptance, or completion.",
    },
  };
  return validateSpecificationReadinessReport(report);
}

function compactRisk(card) {
  const risks = [];
  if (card.risks.interaction.candidate) risks.push(`interaction:${card.risks.interaction.occurrenceCount}`);
  if (card.risks.random.candidate) risks.push(`random:${card.risks.random.occurrenceCount}`);
  if (card.risks.external.candidate) risks.push(`external:${card.risks.external.occurrenceCount}`);
  if (card.risks.audio.embeddedTagCount) risks.push(`embedded-audio:${card.risks.audio.embeddedTagCount}`);
  if (card.risks.audio.catalogAssociatedFileCount) risks.push(`catalog-audio:${card.risks.audio.catalogAssociatedFileCount}`);
  return risks.join(", ") || "no static risk detected";
}

export function renderSpecificationReadinessMarkdown(report) {
  const batchId = report.batch.batchId;
  const selectedCount = report.summary.cards;
  const rows = report.cards.map((card) => {
    const fla = card.source.fla ? `FLA+SWF / ${card.source.fla.sha256.slice(0, 12)}…` : "SWF-only";
    const workspace = card.specificationReadiness.existingWorkspace.exists ? "existing partial" : "not scaffolded";
    const machine = card.machinePrerequisiteFacts;
    const machineFacts = `${machine.staticSourceEvents.indexedSourceEventFiles}/${machine.staticSourceEvents.handlerFiles} events; ` +
      `${machine.embeddedAudio.audioUnitCount} audio; ${machine.assetDefinitions.definitionCount} definitions`;
    return `| ${card.sequence} | \`${card.animationId}\` | ${card.classification.section}/${card.classification.page} | ${fla} | ${card.source.swf.sha256.slice(0, 12)}… | ${card.rootTimeline.frameCount} | ${card.rootReachableFrameDomainCandidates.length} | ${machineFacts} | ${compactRisk(card)} | ${workspace}; not ready |`;
  });
  const authoringRows = report.cards
    .filter((card) => card.workOnlyAuthoringAudit)
    .map((card) => `| ${card.sequence} | \`${card.animationId}\` | \`${card.workOnlyAuthoringAudit.runId}\` | \`${card.workOnlyAuthoringAudit.receipt.sha256}\` | work-only; no runtime/acceptance effect |`);
  return [
    `# G4 L3 ${batchId.replace("batch-", "Batch-")} Specification Readiness`,
    "",
    `> Acceptance-neutral projection for G4 L3 ${batchId}'s ${selectedCount} lesson cards. Its parallel-shard scaffold gate is open for workspace creation; renderer implementation, fidelity, acceptance, strict completion, and atomic publication remain unauthorized.`,
    "",
    "## Bound evidence",
    "",
    `- Work cards: \`${report.sourceBindings.workCards.path}\` / \`${report.sourceBindings.workCards.sha256}\``,
    `- Machine audit: \`${report.sourceBindings.machineAudit.path}\` / \`${report.sourceBindings.machineAudit.sha256}\``,
    `- Static source-event index: \`${report.sourceBindings.staticSourceEventIndex.path}\` / \`${report.sourceBindings.staticSourceEventIndex.sha256}\``,
    `- Embedded-audio archive: \`${report.sourceBindings.embeddedAudioArchive.path}\` / \`${report.sourceBindings.embeddedAudioArchive.sha256}\``,
    `- SWF asset-definition census: \`${report.sourceBindings.assetDefinitionCensus.path}\` / \`${report.sourceBindings.assetDefinitionCensus.sha256}\``,
    `- Animate readiness: \`${report.sourceBindings.animatePrepare.path}\` / \`${report.sourceBindings.animatePrepare.sha256}\``,
    `- Animate authoring result index: \`${report.sourceBindings.animateAuthoringAuditIndex.path}\` / \`${report.sourceBindings.animateAuthoringAuditIndex.sha256}\``,
    `- Historical prepare-snapshot runner: \`${report.sourceBindings.animatePrepareHistoricalAssistRunner.path}\` / \`${report.sourceBindings.animatePrepareHistoricalAssistRunner.sha256}\``,
    `- Paired-source Animate assist runner: \`${report.sourceBindings.pairedAnimateAssistRunner.path}\` / \`${report.sourceBindings.pairedAnimateAssistRunner.sha256}\``,
    `- Content-addressed 0444 FLA staging manifest: \`${report.sourceBindings.animateStagingManifest.path}\` / \`${report.sourceBindings.animateStagingManifest.sha256}\``,
    "",
    `All ${report.summary.physicallyVerifiedSwfSources} SWFs and all ${report.summary.physicallyVerifiedFlaSources} available FLAs were physically re-hashed. The ${report.summary.readOnlyAnimateStagingCopies} staged FLA copies were rechecked as byte-identical, read-only, single-link files separate from their sources.`,
    "",
    "## Current boundary",
    "",
    `- Scaffold gate: **open** — ${report.batch.entryRule}`,
    `- Development/publication policy: **${report.releaseFramework.developmentMode}** / **${report.releaseFramework.publicationMode}**; shard \`${report.batch.shardId}\` has no development prerequisite.`,
    `- Source mix: ${report.summary.flaBacked} FLA+SWF, ${report.summary.swfOnly} SWF-only.`,
    `- Static domain candidates: ${report.summary.staticRootReachableDomainCandidates}; none is promoted to final runtime coverage by this report.`,
    `- Static risks: ${report.summary.interactionCandidates} interaction, ${report.summary.randomCandidates} random, ${report.summary.externalCandidates} external-call items; ${report.summary.uniqueCatalogAudioFiles} unique catalog audio files.`,
    `- Machine prerequisite bundles bound: **${report.summary.machinePrerequisiteBundleReady}/${selectedCount}**; ${report.summary.indexedSourceEventFiles} indexed event/signal files, ${report.summary.indexedSourceHandlerFiles} handler files, ${report.summary.embeddedAudioArchiveUnits} archived embedded-audio units, and ${report.summary.assetDefinitionCount} exact SWF definition records.`,
    `- Work-only Animate authoring audits: **${report.summary.verifiedWorkOnlyAuthoringAudits}/${report.summary.flaBacked} applicable verified**, **${report.summary.pendingApplicableAuthoringAudits} pending**, and **${report.summary.authoringAuditNotApplicable} SWF-only n/a**. They establish authoring structure only, not authoring acceptance or original-runtime behavior.`,
    `- Remaining unresolved gaps: ${report.summary.unresolvedHumanGaps} human, ${report.summary.unresolvedRuntimeGaps} runtime, and ${report.summary.unresolvedFinalSpecificationGaps} final-specification obligations across this batch.`,
    `- Human evidence ready: **0/${selectedCount}**; authoritative runtime ready: **0/${selectedCount}**.`,
    `- Final specification ready: **${report.summary.finalSpecificationReady}/${selectedCount}**; implementation authorized: **0/${selectedCount}**; strict complete: **0/${selectedCount}**.`,
    "",
    "## Ordered readiness table",
    "",
    "| # | Animation | XML | Source | SWF SHA-256 | Root frames | Static domains | Machine facts | Known static risks | Specification state |",
    "|---:|---|---|---|---|---:|---:|---|---|---|",
    ...rows,
    "",
    "## Exact remaining evidence contract",
    "",
    "Every JSON card contains the original three `exactRemainingEvidence` lists plus exact `remainingGaps.human`, `remainingGaps.runtime`, and `remainingGaps.finalSpecification` lists. They are conditional per item and cover:",
    "",
    "- completed work-only paired Animate authoring evidence, or an explicit missing-FLA limitation;",
    "- final frame-domain dispositions and entry-state bindings;",
    "- source-evidenced natural original-runtime traces for nested and interactive requirements;",
    "- every interaction, random outcome, language/host state, terminal state, and Replay reset;",
    "- embedded/external audio cue, language, timing, synchronization, and named listening evidence;",
    "- native-size one-indexed original-runtime PNG manifests and the complete visual/behavior boundary map;",
    "- a renderer decision revisited only after the evidence above exists.",
    "",
    report.summary.existingMigrationWorkspaces > 0
      ? `${report.summary.existingMigrationWorkspaces} selected existing migration workspace is recorded as partial/current-JavaScript context only. Its presence is not promoted to final specification or strict acceptance.`
      : "No selected item currently has a migration workspace; the scaffold gate is open, but this report does not create one and does not authorize renderer implementation.",
    "",
    "## Bound completed work-only Animate authoring audits",
    "",
    "No further Animate command is emitted by this report. Each row binds a completed work-only audit; none is original-runtime, review, approval, or strict evidence.",
    "",
    "| # | Animation | Run | Receipt SHA-256 | Authority |",
    "|---:|---|---|---|---|",
    ...authoringRows,
    "",
    "## Acceptance boundary",
    "",
    report.acceptance.statement,
    "",
  ].join("\n");
}

export function parseArguments(argv) {
  const options = {
    check: false,
    batchId: DEFAULT_BATCH_ID,
    jsonOutput: null,
    markdownOutput: null,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--batch") {
      const value = argv[++index];
      if (!value) throw new Error("--batch requires a batch ID");
      requireBatchConfig(value);
      options.batchId = value;
    }
    else if (argument === "--json-output") {
      const value = argv[++index];
      if (!value) throw new Error("--json-output requires a path");
      options.jsonOutput = path.resolve(value);
    } else if (argument === "--markdown-output") {
      const value = argv[++index];
      if (!value) throw new Error("--markdown-output requires a path");
      options.markdownOutput = path.resolve(value);
    } else if (argument === "--help") options.help = true;
    else throw new Error(`Unknown option ${argument}`);
  }
  options.jsonOutput ||= defaultOutputPath(options.batchId, "json");
  options.markdownOutput ||= defaultOutputPath(options.batchId, "md");
  return options;
}

function assertSafeOutput(filePath, extension) {
  if (path.extname(filePath) !== extension) throw new Error(`Output must end in ${extension}`);
  const reportsRoot = path.join(projectRoot, "reports");
  const projectRelative = path.relative(reportsRoot, filePath);
  if (projectRelative.startsWith("..") || path.isAbsolute(projectRelative)) {
    throw new Error("Output must remain inside reports/");
  }
}

async function main(argv) {
  const options = parseArguments(argv);
  if (options.help) {
    process.stdout.write(
      "node scripts/build-g4-l3-batch-001-specification-readiness.mjs [--batch batch-001|batch-002] [--check] [--json-output reports/file.json] [--markdown-output reports/file.md]\n",
    );
    return;
  }
  assertSafeOutput(options.jsonOutput, ".json");
  assertSafeOutput(options.markdownOutput, ".md");
  const report = await buildSpecificationReadinessReport(options.batchId);
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = renderSpecificationReadinessMarkdown(report);
  if (options.check) {
    const [existingJson, existingMarkdown] = await Promise.all([
      readFile(options.jsonOutput, "utf8"),
      readFile(options.markdownOutput, "utf8"),
    ]);
    if (existingJson !== json) throw new Error(`G4 L3 ${options.batchId} specification-readiness JSON is missing or stale`);
    if (existingMarkdown !== markdown) {
      throw new Error(`G4 L3 ${options.batchId} specification-readiness Markdown is missing or stale`);
    }
    process.stdout.write(
      `PASS: G4 L3 ${options.batchId} has ${report.summary.cards} source-bound specification-readiness cards; scaffold gate open, 0 implementation authorizations\n`,
    );
    return;
  }
  await Promise.all([
    writeFile(options.jsonOutput, json),
    writeFile(options.markdownOutput, markdown),
  ]);
  process.stdout.write(
    `WROTE: ${report.summary.cards} G4 L3 ${options.batchId} specification-readiness cards (acceptance-neutral; scaffold gate open, implementation unauthorized)\n`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
