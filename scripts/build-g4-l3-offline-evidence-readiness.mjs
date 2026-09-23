#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const GENERATOR_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(GENERATOR_PATH), "..");
const REPORT_BASENAME = "g4-l3-offline-evidence-readiness";
const DEFAULT_JSON = path.join(ROOT, "reports", `${REPORT_BASENAME}.json`);
const DEFAULT_MARKDOWN = path.join(ROOT, "reports", `${REPORT_BASENAME}.md`);

const REQUIRED_INPUTS = Object.freeze([
  {key: "machineSourceAudit", file: "reports/g4-l3-machine-source-audits.json", reportType: "g4-l3-machine-source-audits", schemaVersion: 1},
  {key: "implementationWorkCards", file: "reports/g4-l3-implementation-work-cards.json", reportType: "g4-l3-implementation-work-cards", schemaVersion: 1},
  {key: "batch001SpecificationReadiness", file: "reports/g4-l3-batch-001-specification-readiness.json", reportType: "g4-l3-batch-001-specification-readiness", schemaVersion: 2},
  {key: "batch002SpecificationReadiness", file: "reports/g4-l3-batch-002-specification-readiness.json", reportType: "g4-l3-batch-002-specification-readiness", schemaVersion: 2},
  {key: "lessonProductNavigationContract", file: "reports/g4-l3-lesson-product-navigation-contract.json", reportType: "g4-l3-full-lesson-product-navigation-contract", schemaVersion: 1},
  {key: "staticSourceEventIndex", file: "reports/g4-l3-static-source-event-index.json", reportType: "g4-l3-static-source-event-index", schemaVersion: 1},
  {key: "sourceOperationIndexV2", file: "reports/g4-l3-source-operation-index-v2.json", reportType: "g4-l3-actionscript-source-operation-index", schemaVersion: 2},
  {key: "assetDefinitionCensus", file: "reports/g4-l3-swf-asset-definition-census.json", reportType: "g4-l3-swf-asset-definition-census", schemaVersion: 1},
  {key: "embeddedAudioArchive", file: "reports/g4-l3-embedded-audio-archive.json", reportType: "g4-l3-embedded-audio-archive", schemaVersion: 1},
  {key: "audioCasMediaProbe", file: "reports/g4-l3-audio-cas-media-probe.json", reportType: "g4-l3-audio-cas-technical-media-probe", schemaVersion: 1},
  {key: "swfAdpcmDerivedAudio", file: "reports/g4-l3-swf-adpcm-derived-audio.json", reportType: "g4-l3-swf-adpcm-derived-audio-technical-binding", schemaVersion: 1},
  {key: "catalogAudioMediaProbe", file: "reports/g4-l3-catalog-audio-media-probe.json", reportType: "g4-l3-catalog-audio-technical-media-probe", schemaVersion: 1},
  {key: "pairedAuthoringSourceBindings", file: "reports/g4-l3-paired-authoring-source-bindings.json", reportType: "g4-l3-paired-authoring-source-bindings", schemaVersion: 1},
  {key: "animateAuthoringAuditIndex", file: "reports/g4-l3-animate-authoring-audit-index.json", reportType: "g4-l3-adobe-animate-authoring-audit-result-index", schemaVersion: 1, generator: "scripts/build-g4-l3-animate-authoring-audit-index.mjs"},
  {key: "shellLegacyHostContract", file: "reports/g4-l3-shell-legacy-host-dependency-contract.json", reportType: "g4-l3-shell-legacy-host-dependency-disposition-contract", schemaVersion: 1},
  {key: "captureCapacityReadiness", file: "reports/g4-l3-capture-capacity-readiness.json", reportType: "g4-l3-capture-capacity-readiness", schemaVersion: 1},
  {key: "originalRuntimeEnvironmentReadiness", file: "reports/g4-l3-original-runtime-environment-readiness.json", reportType: "g4-l3-original-runtime-environment-readiness", schemaVersion: 1},
  {key: "originalRuntimeContainmentReadiness", file: "reports/g4-l3-original-runtime-containment-readiness.json", reportType: "g4-l3-original-runtime-containment-readiness", schemaVersion: 1},
  {key: "automationPreflight", file: "reports/g4-l3-automation-preflight.json", reportType: "g4-l3-complete-lesson-automation-preflight", schemaVersion: 1},
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function relative(file) {
  const candidate = path.relative(ROOT, file).split(path.sep).join("/");
  invariant(candidate && !candidate.startsWith("../") && !path.isAbsolute(candidate), `${file} escapes the project root`);
  return candidate;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function exact(value) {
  return JSON.stringify(value);
}

async function physicalBinding(file) {
  const bytes = await readFile(file);
  return {file: relative(file), sha256: sha256(bytes), bytes: bytes.length};
}

async function readBoundInput(definition) {
  const absolute = path.join(ROOT, definition.file);
  const bytes = await readFile(absolute);
  const report = JSON.parse(bytes);
  invariant(report.reportType === definition.reportType,
    `${definition.key}: expected reportType ${definition.reportType}, found ${report.reportType}`);
  invariant(report.schemaVersion === definition.schemaVersion,
    `${definition.key}: expected schemaVersion ${definition.schemaVersion}, found ${report.schemaVersion}`);

  const generatorFile = report.generator?.path || report.generator?.file || definition.generator;
  invariant(typeof generatorFile === "string" && generatorFile.startsWith("scripts/") && !generatorFile.includes(".."),
    `${definition.key}: missing safe upstream generator binding`);
  const generator = await physicalBinding(path.join(ROOT, generatorFile));
  if (report.generator?.sha256 !== undefined) {
    invariant(report.generator.sha256 === generator.sha256,
      `${definition.key}: upstream generator hash is stale`);
  }
  if (report.generator?.bytes !== undefined) {
    invariant(report.generator.bytes === generator.bytes,
      `${definition.key}: upstream generator byte count is stale`);
  }

  return {
    definition,
    report,
    binding: {
      file: definition.file,
      sha256: sha256(bytes),
      bytes: bytes.length,
      reportType: report.reportType,
      schemaVersion: report.schemaVersion,
      generator,
    },
  };
}

function ids(items) {
  invariant(Array.isArray(items), "Expected an item array while checking lesson identity");
  return items.map((item) => item.animationId);
}

function assertExactIds(expected, actual, label) {
  invariant(exact(actual) === exact(expected), `${label}: ordered 40-item identity drifted`);
}

function assertAllFalse(object, label) {
  invariant(object && typeof object === "object" && !Array.isArray(object), `${label}: expected an object`);
  for (const [key, value] of Object.entries(object)) {
    invariant(value === false, `${label}.${key}: gate unexpectedly opened`);
  }
}

function verifyAndSummarize(inputs) {
  const byKey = Object.fromEntries(inputs.map((input) => [input.definition.key, input.report]));
  const machine = byKey.machineSourceAudit;
  const workCards = byKey.implementationWorkCards;
  const batch1 = byKey.batch001SpecificationReadiness;
  const batch2 = byKey.batch002SpecificationReadiness;
  const product = byKey.lessonProductNavigationContract;
  const staticEvents = byKey.staticSourceEventIndex;
  const operations = byKey.sourceOperationIndexV2;
  const assets = byKey.assetDefinitionCensus;
  const embedded = byKey.embeddedAudioArchive;
  const casProbe = byKey.audioCasMediaProbe;
  const adpcm = byKey.swfAdpcmDerivedAudio;
  const catalogProbe = byKey.catalogAudioMediaProbe;
  const paired = byKey.pairedAuthoringSourceBindings;
  const authoring = byKey.animateAuthoringAuditIndex;
  const shell = byKey.shellLegacyHostContract;
  const capacity = byKey.captureCapacityReadiness;
  const runtimeEnvironment = byKey.originalRuntimeEnvironmentReadiness;
  const runtimeContainment = byKey.originalRuntimeContainmentReadiness;
  const preflight = byKey.automationPreflight;
  const inputBindings = Object.fromEntries(inputs.map((input) => [input.definition.key, input.binding]));

  const orderedIds = ids(machine.items);
  invariant(orderedIds.length === 40 && new Set(orderedIds).size === 40,
    "Machine source audit must define exactly 40 unique canonical lesson items");
  invariant(machine.items.filter((item) => item.releaseRole === "active-xml-referenced-page").length === 39,
    "Machine source audit must contain exactly 39 active pages");
  invariant(machine.items.filter((item) => item.releaseRole === "course-shell").length === 1,
    "Machine source audit must contain exactly one course shell");
  invariant(machine.summary.flaBacked === 29 && machine.summary.swfOnly === 11,
    "Machine source audit paired/SWF-only split drifted");
  invariant(machine.items.filter((item) => item.source.sourceKind === "fla+swf").length === 29,
    "Machine source audit no longer has 29 paired FLA/SWF items");
  invariant(machine.items.filter((item) => item.source.sourceKind === "swf-only").length === 11,
    "Machine source audit no longer has 11 SWF-only items");

  assertExactIds(orderedIds, ids(workCards.cards), "implementation work cards");
  assertExactIds(orderedIds, [...ids(batch1.cards), ...ids(batch2.cards)], "batch specification reports");
  assertExactIds(orderedIds, ids(staticEvents.items), "static source-event index");
  assertExactIds(orderedIds, ids(operations.items), "source-operation index v2");
  assertExactIds(orderedIds, ids(assets.items), "asset-definition census");
  assertExactIds(orderedIds, ids(embedded.items), "embedded-audio archive");
  assertExactIds(orderedIds, ids(preflight.items), "automation preflight");
  assertExactIds(orderedIds, [...ids(product.pages), product.shell.animationId], "lesson product contract");

  invariant(batch1.summary.cards === 25 && batch2.summary.cards === 15,
    "G4 L3 batch sizes must remain 25 plus 15");
  invariant(batch1.summary.existingMigrationWorkspaces === 25
    && batch2.summary.existingMigrationWorkspaces === 15,
  "G4 L3 batch scaffold coverage must remain 25/25 plus 15/15");
  invariant(batch1.batch.gate.open === true && batch2.batch.gate.open === true
    && batch1.batch.gate.prerequisiteKind === "none"
    && batch2.batch.gate.prerequisiteKind === "none",
  "Both G4 L3 parallel-shard scaffold gates must be open without strict prerequisites");
  invariant(batch1.summary.strictComplete === 0 && batch2.summary.strictComplete === 0,
    "A G4 L3 batch unexpectedly reports strict completion");
  invariant(batch1.summary.finalSpecificationReady === 0 && batch2.summary.finalSpecificationReady === 0,
    "A G4 L3 batch unexpectedly reports final specification readiness");
  invariant(batch1.summary.implementationAuthorized === 0 && batch2.summary.implementationAuthorized === 0,
    "A G4 L3 batch unexpectedly authorizes implementation");

  invariant(paired.summary.expectedBindings === 29 && paired.summary.verifiedBindings === 29,
    "Paired authoring source preparation must verify 29/29 bindings");
  invariant(paired.items.length === 29 && paired.summary.exactMode0444FileCount === 87,
    "Paired authoring source preparation no longer has 87 read-only files");
  invariant(paired.summary.runArtifactFiles > 0
    && paired.summary.animateGuiExecutionsRecordedByThesePreparedTrees >= 29
    && paired.summary.authoringAuditsCompleted === 29
    && paired.summary.implementationAuthorizations === 0
    && paired.summary.strictComplete === 0,
  "Paired authoring evidence is incomplete or crossed its work-only authority boundary");
  invariant(paired.items.every((item) => item.prepared.runArtifactFileCount > 0
    && item.observedAuthoringAudit.status === "verified-work-only-authoring-audit"
    && item.observedAuthoringAudit.originalRuntimeBaselineEstablished === false
    && item.observedAuthoringAudit.acceptanceEffect === false
    && item.boundedRerunCommand.dialogAutomationAllowed === false
    && item.boundedRerunCommand.sourceSwfExecuted === false
    && item.boundedRerunCommand.strictAcceptanceEffect === false),
  "A paired authoring item is incomplete or exceeds work-only evidence authority");
  const expectedPairedIds = machine.items
    .filter((item) => item.source.sourceKind === "fla+swf")
    .map((item) => item.animationId);
  assertExactIds(expectedPairedIds, ids(paired.items), "paired authoring source bindings");
  assertExactIds(expectedPairedIds, ids(authoring.items), "Animate authoring audit result index");
  invariant(authoring.summary.queueItems === 29
    && authoring.summary.sourcePairsReverified === 29
    && authoring.summary.totalAttemptReceipts === 36
    && authoring.summary.passedAttemptReceipts === 29
    && authoring.summary.failedAttemptReceipts === 7
    && authoring.summary.verifiedWorkOnlyAuthoringAudits === 29
    && authoring.summary.pendingAuthoringAudits === 0
    && authoring.summary.authoringCoverageComplete === true
    && authoring.summary.originalRuntimeBaselinesEstablished === 0
    && authoring.summary.humanVisualReviewsEstablished === 0
    && authoring.summary.ownerAcceptancesEstablished === 0
    && authoring.summary.strictAcceptancesEstablished === 0
    && authoring.summary.strictAcceptanceEffect === false,
  "Animate authoring audit index is incomplete or promoted beyond work-only evidence");
  invariant(batch1.summary.verifiedWorkOnlyAuthoringAudits === 19
    && batch1.summary.pendingApplicableAuthoringAudits === 0
    && batch2.summary.verifiedWorkOnlyAuthoringAudits === 10
    && batch2.summary.pendingApplicableAuthoringAudits === 0,
  "Batch specification reports did not propagate the 29/29 work-only authoring audits");

  invariant(operations.summary.canonicalItems === 40
    && operations.summary.physicallyRehashedSwfs === 40
    && operations.summary.completeFfdecReexports === 40
    && operations.items.length === 40,
  "Source-operation index v2 does not cover exactly 40 re-exported items");
  invariant(operations.summary.exportedScriptFileCount === 1809
    && operations.summary.exactOperationCount === 3403
    && operations.summary.itemsWithRuntimeReachability === 0
    && operations.summary.authoritativeScenarioInventories === 0
    && operations.summary.authoritativeTraceSpecs === 0,
  "Source-operation index v2 summary drifted or crossed into runtime authority");

  invariant(catalogProbe.summary.sourceFileCount === 143
    && catalogProbe.summary.ffprobeParsedCount === 143
    && catalogProbe.summary.ffmpegDecodeCheckPassedCount === 143
    && catalogProbe.summary.sampleCountToolSupportedCount === 143,
  "Catalog audio technical probe no longer proves 143/143 parse/decode checks");
  invariant(catalogProbe.summary.sourceReferenceCount === 359
    && catalogProbe.summary.animationsWithCatalogAudio === 38,
  "Catalog audio reference facts drifted");
  invariant(embedded.summary.canonicalItems === 40
    && embedded.summary.audioUnitCount === 359
    && embedded.archive.archivedFileCount === 88
    && embedded.archive.archivedBytes === 5710816,
  "Embedded-audio archive facts drifted");
  invariant(casProbe.summary.casObjectCount === 88
    && casProbe.summary.casObjectBytes === 5710816
    && casProbe.summary.sourceAudioUnitReferenceCount === 359
    && casProbe.summary.ffprobeParsedObjectCount === 86
    && casProbe.summary.ffprobeParseFailedObjectCount === 2
    && casProbe.summary.ffmpegDecodeCheckPassedObjectCount === 86,
  "Embedded-audio CAS technical probe facts drifted");
  invariant(adpcm.summary.sourceCasObjectCount === 1
    && adpcm.summary.sourceCasBytes === 3770
    && adpcm.summary.sourceAudioUnitReferenceCount === 4
    && adpcm.summary.independentlyDecodedBlockCount === 13
    && adpcm.summary.decodedSampleCountPerChannel === 5967
    && adpcm.summary.derivedArtifactCount === 1
    && adpcm.summary.ffprobeParsedDerivedArtifactCount === 1
    && adpcm.summary.ffmpegDecodeToNullPassedDerivedArtifactCount === 1
    && adpcm.derivedArtifact.sha256 === "f3e05365073feff502feda8779b3d3a5e3ba4ca6ee213e7a162e1ad5b3961eb8"
    && adpcm.derivedArtifact.mode === "0444"
    && adpcm.derivedArtifact.sampleRateHz === 5512
    && adpcm.derivedArtifact.channels === 1,
  "SWF ADPCM derived technical binding facts drifted");
  invariant(adpcm.acceptance.independentDecoderPcmEqualityEstablished === false
    && adpcm.acceptance.languageEstablished === false
    && adpcm.acceptance.cueMappingEstablished === false
    && adpcm.acceptance.runtimeSynchronizationEstablished === false
    && adpcm.acceptance.listeningAcceptanceEstablished === false
    && adpcm.acceptance.authoritativeRuntimeEstablished === false
    && adpcm.acceptance.humanReviewEstablished === false
    && adpcm.acceptance.ownerAcceptanceEstablished === false
    && adpcm.acceptance.strictCompletionEstablished === false,
  "SWF ADPCM derived technical binding crossed an acceptance gate");

  invariant(assets.scope.canonicalItems === 40
    && assets.summary.structuralCountCrossChecksPassed === 40
    && assets.summary.totalDefinitions === 8068,
  "Asset-definition census coverage drifted");
  invariant(shell.summary.totalCandidateCount === 23
    && shell.summary.candidatesWithoutDisposition === 0
    && shell.summary.unresolvedSourceExpressionCount === 1
    && shell.acceptance.legacyEndpointExecutions === 0,
  "Shell host-dependency contract drifted or executed a legacy endpoint");

  invariant(product.summary.activePages === 39 && product.summary.courseShells === 1
    && product.summary.currentPrototypeModules === 40 && product.summary.currentPrototypePageModules === 39
    && product.summary.currentPrototypeShellModules === 1 && product.summary.currentStrictModules === 0
    && product.summary.browserVerifiedRoutes === 82 && product.summary.strictCompletePages === 0
    && product.summary.strictCompleteShells === 0,
  "Lesson product contract strict/product state drifted");
  invariant(product.development?.mode === "parallel-shards"
    && product.development?.shards?.length === 2
    && product.development?.scaffoldGatesOpen === true
    && product.development?.shards.every((shard) => shard.scaffoldGateOpen === true)
    && product.development?.implementationAuthorized === false
    && product.publication?.mode === "atomic"
    && product.publication?.requiredMembers === 40
    && product.publication?.strictCompleteMembers === 0
    && product.publication?.missingMembers === 40
    && product.publication?.published === false,
  "Lesson product contract lost the parallel-shard/atomic-publication boundary");
  invariant(workCards.summary.cards === 40 && workCards.summary.existingMigrationWorkspaces === 40
    && workCards.cards.every((card) => card.requiredWork?.implementation?.workspace?.exists === true)
    && workCards.summary.batchGatesOpen === 2
    && workCards.summary.implementationAuthorizedNow === 0
    && workCards.summary.unresolvedFrameDomainCards === 40
    && workCards.summary.unresolvedScenarioCards === 40
    && workCards.summary.unresolvedOriginalRuntimeCards === 40,
  "Implementation work-card authority boundary drifted");
  invariant(preflight.summary.existingMigrationWorkspaces === 40
    && preflight.items.every((item) => item.existing?.workspaceExists === true)
    && preflight.summary.batchGatesOpen === 2
    && preflight.strictGateSnapshot.strictComplete === 0
    && preflight.strictGateSnapshot.pilotStrictAccepted === 0,
  "Automation preflight strict gate snapshot drifted");
  invariant(capacity.capacityModel.admission === "admit-full-lesson-capture-capacity"
    && capacity.capacityModel.headroomBytesAtMinimumSafeThreshold >= 0
    && capacity.capacityModel.remainingEvidenceSafetyMultiplier === 1.2
    && capacity.capacityModel.operationalReserveBytes === 100 * 1024 ** 3
    && capacity.capacityModel.admissionIsFidelityEvidence === false,
  "Capture-capacity admission boundary drifted");
  invariant(runtimeEnvironment.scope.canonicalItems === 40
    && runtimeEnvironment.summary.installedRuntimeCandidates === 1
    && runtimeEnvironment.summary.historicalStandaloneCandidates === 1
    && runtimeEnvironment.summary.historicalStandaloneFramesReverified === 10
    && runtimeEnvironment.summary.authorizedRuntimeContexts === 0
    && runtimeEnvironment.summary.runtimeSessionsExecuted === 0
    && runtimeEnvironment.summary.authoritativeBaselinePackagesEstablished === 0
    && runtimeEnvironment.executionGate.originalRuntimeExecutionReady === false,
  "Original-runtime environment candidate drifted or was promoted");
  invariant(runtimeContainment.summary.canonicalItems === 40
    && runtimeContainment.summary.affectedMembers === 3
    && runtimeContainment.summary.exactExternalOperations === 23
    && runtimeContainment.summary.networkCapableOrScriptNavigationOperations === 17
    && runtimeContainment.summary.hostControlOperations === 5
    && runtimeContainment.summary.localPersistentStateOperations === 1
    && runtimeContainment.summary.containmentControlsSpecified === 8
    && runtimeContainment.summary.containmentControlsApproved === 0
    && runtimeContainment.summary.runtimeSessionsExecuted === 0
    && runtimeContainment.executionGate.originalRuntimeExecutionReady === false,
  "Original-runtime containment readiness drifted or was promoted");
  invariant(runtimeEnvironment.sourceBindings.captureCapacityReadiness.sha256
      === inputBindings.captureCapacityReadiness.sha256
    && runtimeContainment.sourceBindings.originalRuntimeEnvironmentReadiness.sha256
      === inputBindings.originalRuntimeEnvironmentReadiness.sha256
    && runtimeContainment.sourceBindings.sourceOperationIndexV2.sha256
      === inputBindings.sourceOperationIndexV2.sha256,
  "Original-runtime readiness reports do not bind the same direct upstream inputs");

  assertAllFalse(assets.acceptance.gates, "asset-definition census acceptance gates");
  assertAllFalse(shell.acceptance.gates, "shell host-dependency acceptance gates");
  invariant(product.acceptance.implementationAuthorized === false
    && product.acceptance.routeBehaviorVerified === false
    && product.acceptance.originalRuntimeAccepted === false
    && product.acceptance.audioAccepted === false
    && product.acceptance.humanVisualAccepted === false
    && product.acceptance.ownerAccepted === false
    && product.acceptance.strictProductAccepted === false
    && product.acceptance.lessonComplete === false,
  "Lesson product acceptance gate unexpectedly opened");
  invariant(paired.acceptance.authoringEvidenceReady === true
    && paired.acceptance.authoritativeRuntimeReady === false
    && paired.acceptance.implementationAuthorized === false
    && paired.acceptance.strictMigrationComplete === false,
  "Paired authoring evidence gate is incomplete or was promoted beyond work-only evidence");
  invariant(catalogProbe.acceptance.spokenLanguageAccepted === false
    && catalogProbe.acceptance.cueMappingAccepted === false
    && catalogProbe.acceptance.synchronizationAccepted === false
    && catalogProbe.acceptance.listeningAccepted === false
    && catalogProbe.acceptance.ownerAccepted === false
    && catalogProbe.acceptance.strictMigrationComplete === false,
  "Catalog audio acceptance gate unexpectedly opened");

  return {
    scope: {
      releaseId: "lesson-g04-l03-negative-numbers",
      grade: 4,
      lesson: 3,
      titleRaw: "Negative Numbers",
      canonicalItems: 40,
      activePages: 39,
      courseShells: 1,
      batchSizes: [25, 15],
      developmentMode: workCards.releaseFramework.developmentMode,
      publicationMode: workCards.releaseFramework.publicationMode,
      shardCount: workCards.releaseFramework.shardCount,
      flaBacked: 29,
      swfOnly: 11,
    },
    machinePreparedFacts: {
      sourceAndLessonIdentity: {
        canonicalItems: 40,
        activePages: 39,
        courseShells: 1,
        physicallyAuditedSwfs: machine.items.length,
        flaBacked: 29,
        swfOnly: 11,
        rootFrameCountSum: machine.summary.rootFrameCountSum,
        allDeclaredTimelineFrameCountSum: machine.summary.allDeclaredTimelineFrameCountSum,
      },
      authoringEvidence: {
        verifiedPairedBindings: 29,
        preparedReadOnlyFilesMode0444: 87,
        preparedFlaBytes: paired.summary.preparedFlaBytes,
        preparedSwfBytes: paired.summary.preparedSwfBytes,
        totalAttemptReceipts: authoring.summary.totalAttemptReceipts,
        passedAttemptReceipts: authoring.summary.passedAttemptReceipts,
        failedDiagnosticAttemptReceipts: authoring.summary.failedAttemptReceipts,
        verifiedWorkOnlyAuthoringAudits: authoring.summary.verifiedWorkOnlyAuthoringAudits,
        pendingApplicableAuthoringAudits: authoring.summary.pendingAuthoringAudits,
        authoringCoverageComplete: authoring.summary.authoringCoverageComplete,
        originalRuntimeBaselinesEstablished: 0,
        humanVisualReviewsEstablished: 0,
        ownerAcceptancesEstablished: 0,
        strictAcceptancesEstablished: 0,
        acceptanceEffect: false,
      },
      sourceOperations: {
        exactItems: 40,
        completeFfdecReexports: 40,
        exportedScriptFiles: operations.summary.exportedScriptFileCount,
        exactOperations: operations.summary.exactOperationCount,
        sourceBoundScenarioTraceCandidates: operations.summary.sourceBoundScenarioTraceCandidateCount,
        authoritativeRuntimeReachabilityItems: 0,
        authoritativeTraceSpecs: 0,
      },
      originalRuntimePreparation: {
        installedCandidateCount: runtimeEnvironment.summary.installedRuntimeCandidates,
        runtimeId: runtimeEnvironment.installedRuntimeCandidate.runtimeId,
        runtimeVersion: runtimeEnvironment.installedRuntimeCandidate.version,
        executableSha256: runtimeEnvironment.installedRuntimeCandidate.executable.sha256,
        historicalStandaloneCandidatesReverified:
          runtimeEnvironment.summary.historicalStandaloneCandidates,
        historicalStandaloneFramesReverified:
          runtimeEnvironment.summary.historicalStandaloneFramesReverified,
        historicalCandidatesWithCurrentStrictAuthority: 0,
        staticExternalSideEffectAffectedMembers: runtimeContainment.summary.affectedMembers,
        exactExternalSideEffectOperations: runtimeContainment.summary.exactExternalOperations,
        networkCapableOrScriptNavigationOperations:
          runtimeContainment.summary.networkCapableOrScriptNavigationOperations,
        containmentControlsSpecified: runtimeContainment.summary.containmentControlsSpecified,
        containmentControlsApproved: runtimeContainment.summary.containmentControlsApproved,
        namedRuntimeOperators: 0,
        authorizedRuntimeContexts: 0,
        runtimeSessionsExecuted: 0,
        authoritativeBaselinePackagesEstablished: 0,
        originalRuntimeExecutionReady: false,
      },
      assetDefinitions: {
        exactItems: 40,
        totalDefinitions: assets.summary.totalDefinitions,
        structurallyCrossCheckedItems: assets.summary.structuralCountCrossChecksPassed,
        exactFontNames: assets.summary.exactFontNameCount,
        uniqueExactText: assets.summary.uniqueExactTextCount,
      },
      embeddedAudioTechnical: {
        sourceAudioUnitReferences: embedded.summary.audioUnitCount,
        itemsWithAudioPayloads: embedded.summary.itemsWithAudioPayloads,
        casObjects: embedded.archive.archivedFileCount,
        casObjectBytes: embedded.archive.archivedBytes,
        ffprobeParsedCasObjects: casProbe.summary.ffprobeParsedObjectCount,
        ffmpegDecodeCheckedCasObjects: casProbe.summary.ffmpegDecodeCheckPassedObjectCount,
        casObjectsNotParsedByTheGenericContainerProbe: casProbe.summary.ffprobeParseFailedObjectCount,
        derivedSwfAdpcmEvidence: {
          status: "acceptance-neutral-technical-decode-bound",
          sourceCasObjectSha256: "e5c99e029d9df7717bc7755b5f4660841ad3f453d10bb8dbc8010d69b5a653b6",
          sourceCasObjectBytes: adpcm.summary.sourceCasBytes,
          sourceAudioUnitReferences: adpcm.summary.sourceAudioUnitReferenceCount,
          independentlyDecodedBlocks: adpcm.summary.independentlyDecodedBlockCount,
          samplesPerBlock: 459,
          decodedPcm16MonoSamples: adpcm.summary.decodedSampleCountPerChannel,
          sampleRateHz: adpcm.derivedArtifact.sampleRateHz,
          derivedWavSha256: adpcm.derivedArtifact.sha256,
          ffprobeParsedDerivedWav: adpcm.summary.ffprobeParsedDerivedArtifactCount === 1,
          ffmpegDecodeCheckedDerivedWav: adpcm.summary.ffmpegDecodeToNullPassedDerivedArtifactCount === 1,
          independentFfdecOrOriginalPcmEquality: false,
          listeningOrAcceptanceEffect: false,
        },
      },
      catalogAudioTechnical: {
        physicalMp3Files: 143,
        physicalMp3Bytes: catalogProbe.summary.sourceBytes,
        placementReferences: 359,
        animationsWithCatalogAudio: 38,
        ffprobeParsed: 143,
        ffmpegDecodeChecked: 143,
        sampleCountToolSupported: 143,
        listeningReviews: 0,
      },
      lessonAndShellContracts: {
        exactSectionCount: product.summary.sectionCount,
        exactProductPages: 39,
        shellHostDependencyCandidates: shell.summary.totalCandidateCount,
        shellCandidatesWithoutDisposition: shell.summary.candidatesWithoutDisposition,
        shellUnresolvedSourceExpressions: shell.summary.unresolvedSourceExpressionCount,
        legacyEndpointExecutions: shell.acceptance.legacyEndpointExecutions,
        browserVerifiedRoutes: product.summary.browserVerifiedRoutes,
        currentPrototypeModules: product.summary.currentPrototypeModules,
      },
      batchAndCapacityBoundary: {
        scaffoldedLessonWorkspaces: 40,
        batch001ScaffoldedWorkspaces: 25,
        batch002ScaffoldedWorkspaces: 15,
        batch001ScaffoldGateOpen: true,
        batch002ScaffoldGateOpen: true,
        developmentMode: workCards.releaseFramework.developmentMode,
        publicationMode: workCards.releaseFramework.publicationMode,
        rendererImplementationAuthorized: false,
        atomicLessonPublicationAuthorized: false,
        pilotStrictAccepted: preflight.strictGateSnapshot.pilotStrictAccepted,
        currentStrictLessonItems: product.publication.strictCompleteMembers,
        captureCapacityAdmission: capacity.capacityModel.admission,
        captureCapacitySnapshotAvailableBytes: capacity.capacityModel.availableBytes,
        captureCapacityMinimumSafeFreeBytes: capacity.capacityModel.minimumSafeFreeBytes,
        captureCapacityHeadroomBytes: capacity.capacityModel.headroomBytesAtMinimumSafeThreshold,
      },
    },
  };
}

function pendingGates() {
  return [
    {id: "authoritative-original-runtime-baselines", status: "pending", exactScope: "all reachable page, shell, locale, branch, terminal, navigation, and Replay states", current: "0/40 established"},
    {id: "final-frame-domain-scenario-and-trace-specification", status: "pending", exactScope: "40 canonical items", current: "40/40 unresolved work cards; 193 source-bound candidates are static candidates, not authoritative traces"},
    {id: "javascript-implementation-and-behavior-tests", status: "pending", exactScope: "40 strict modules and registry entries", current: "40 current-JavaScript candidate modules; 0 strict modules"},
    {id: "full-frame-rmse-diffs-and-visual-inspection", status: "pending", exactScope: "every required frame in every reachable scenario and language", current: "0/40 strict visual-parity packages"},
    {id: "bilingual-audio-cue-sync-and-listening", status: "pending", exactScope: "embedded audio plus 143 catalog MP3 files across EN/ES runtime paths", current: "technical byte/parse/decode evidence only; 0 listening reviews or cue/synchronization acceptances"},
    {id: "browser-product-accessibility-and-network-qa", status: "pending", exactScope: "English/Spanish lesson, page, shell, navigation, Replay, native/mobile, accessibility, console, asset, and network behavior", current: "82 current-JavaScript routes verified; strict original-runtime parity and acceptance remain 0/40"},
    {id: "source-conflict-dispositions", status: "pending", exactScope: "active XML versus shipped shell sequence; missing lesson-specific versus present grade-wide keyterm XML; missing reviewed Spanish titles", current: "unresolved"},
    {id: "strict-human-visual-review", status: "pending", exactScope: "all strict-complete candidate requirements and every outlier/diff", current: "0/40"},
    {id: "owner-acceptance", status: "pending", exactScope: "separate owner signature after machine and strict-human gates", current: "0/40"},
    {id: "parallel-shard-implementation-and-atomic-publication", status: "pending", exactScope: "complete all 40 scaffolded workspaces as strict migrations, then publish the lesson atomically", current: "both scaffold gates open; 40/40 workspaces exist; implementation unauthorized; 0/40 strict-complete; atomic publication closed"},
  ];
}

export async function buildOfflineEvidenceReadinessReport() {
  const inputs = [];
  for (const definition of REQUIRED_INPUTS) inputs.push(await readBoundInput(definition));
  const {scope, machinePreparedFacts} = verifyAndSummarize(inputs);
  const generator = await physicalBinding(GENERATOR_PATH);
  const sourceBindings = Object.fromEntries(inputs.map((input) => [input.definition.key, input.binding]));
  const report = {
    schemaVersion: 1,
    reportType: REPORT_BASENAME,
    generator,
    scope,
    authorityBoundary: {
      leafOnlyAggregate: true,
      upstreamReportsModified: false,
      sourceAssetsModified: false,
      migrationWorkspacesModified: false,
      renderersModified: false,
      routesModified: false,
      statusesOrLedgerModified: false,
      reviewsOrApprovalsModified: false,
      runtimeSessionsPerformed: false,
      legacyEndpointsExecuted: false,
      strictAcceptanceEffect: false,
    },
    sourceBindings,
    summary: {
      boundRequiredReports: inputs.length,
      canonicalItems: 40,
      activePages: 39,
      courseShells: 1,
      pairedAuthoringBindingsPrepared: 29,
      verifiedWorkOnlyAuthoringAudits: 29,
      pendingApplicableAuthoringAudits: 0,
      authoringAuditNotApplicableItems: 11,
      swfOnlyItems: 11,
      exactSourceOperationItems: 40,
      installedOriginalRuntimeCandidates: 1,
      exactExternalSideEffectOperations: 23,
      runtimeContainmentControlsSpecified: 8,
      runtimeContainmentControlsApproved: 0,
      scaffoldedLessonWorkspaces: 40,
      catalogMp3TechnicalProbesPassed: 143,
      swfAdpcmDerivedTechnicalBindings: 1,
      strictLessonItems: 0,
      openScaffoldGates: 2,
      pendingGateCount: pendingGates().length,
    },
    machinePreparedFacts,
    scaffoldAndReleaseBoundary: {
      developmentMode: "parallel-shards",
      publicationMode: "atomic",
      batch001ScaffoldGateOpen: true,
      batch002ScaffoldGateOpen: true,
      openScaffoldGateCount: 2,
      rendererImplementationAuthorized: false,
      atomicLessonPublicationAuthorized: false,
    },
    closedGates: {
      animateAuthoringEvidenceAccepted: false,
      authoritativeOriginalRuntimeBaselineAccepted: false,
      finalSpecificationAccepted: false,
      implementationAuthorized: false,
      fortyStrictJavascriptModulesAccepted: false,
      visualParityAndRmseAccepted: false,
      behaviorParityAccepted: false,
      bilingualAudioListeningAndSyncAccepted: false,
      browserProductQaAccepted: false,
      strictHumanVisualReviewAccepted: false,
      ownerAccepted: false,
      lessonStrictComplete: false,
    },
    pendingGates: pendingGates(),
    acceptance: {
      acceptanceNeutral: true,
      offlineEvidenceAggregateGenerated: true,
      authoringAccepted: false,
      authoritativeRuntimeAccepted: false,
      specificationAccepted: false,
      implementationAccepted: false,
      visualOrBehaviorParityAccepted: false,
      audioAccepted: false,
      humanVisualReviewAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      statement: "This leaf report re-hashes and cross-checks acceptance-neutral offline G4 L3 evidence only. It binds 29/29 applicable completed work-only Animate authoring-structure audits, one installed-but-unapproved Flash Player candidate, and 23 exact static side-effect operations with eight specified but unapproved containment controls while changing no upstream artifact. Those facts are not authoring acceptance, shipped-SWF execution, FLA/SWF equivalence, runtime authorization, authoritative original-runtime evidence, or containment approval. The report does not establish final specification, JavaScript implementation fidelity, RMSE, audio listening/synchronization, human review, owner acceptance, parity, or migration completion.",
    },
  };
  return validateOfflineEvidenceReadinessReport(report);
}

export function validateOfflineEvidenceReadinessReport(report) {
  invariant(report.schemaVersion === 1 && report.reportType === REPORT_BASENAME,
    "Offline evidence readiness report identity drifted");
  invariant(report.summary.boundRequiredReports === REQUIRED_INPUTS.length,
    "Offline evidence readiness input count drifted");
  invariant(report.summary.canonicalItems === 40 && report.summary.activePages === 39
    && report.summary.courseShells === 1 && report.summary.pairedAuthoringBindingsPrepared === 29
    && report.summary.verifiedWorkOnlyAuthoringAudits === 29
    && report.summary.pendingApplicableAuthoringAudits === 0
    && report.summary.authoringAuditNotApplicableItems === 11
    && report.summary.swfOnlyItems === 11 && report.summary.exactSourceOperationItems === 40
    && report.summary.installedOriginalRuntimeCandidates === 1
    && report.summary.exactExternalSideEffectOperations === 23
    && report.summary.runtimeContainmentControlsSpecified === 8
    && report.summary.runtimeContainmentControlsApproved === 0
    && report.summary.scaffoldedLessonWorkspaces === 40
    && report.summary.catalogMp3TechnicalProbesPassed === 143
    && report.summary.swfAdpcmDerivedTechnicalBindings === 1,
  "Offline evidence readiness exact scope drifted");
  invariant(Object.keys(report.sourceBindings).length === REQUIRED_INPUTS.length,
    "Offline evidence readiness source bindings are incomplete");
  for (const definition of REQUIRED_INPUTS) {
    const binding = report.sourceBindings[definition.key];
    invariant(binding?.file === definition.file && binding.reportType === definition.reportType
      && binding.schemaVersion === definition.schemaVersion && /^[0-9a-f]{64}$/.test(binding.sha256),
    `${definition.key}: aggregate input binding drifted`);
  }
  invariant(report.authorityBoundary.leafOnlyAggregate === true
    && report.authorityBoundary.upstreamReportsModified === false
    && report.authorityBoundary.sourceAssetsModified === false
    && report.authorityBoundary.migrationWorkspacesModified === false
    && report.authorityBoundary.renderersModified === false
    && report.authorityBoundary.routesModified === false
    && report.authorityBoundary.statusesOrLedgerModified === false
    && report.authorityBoundary.reviewsOrApprovalsModified === false
    && report.authorityBoundary.runtimeSessionsPerformed === false
    && report.authorityBoundary.legacyEndpointsExecuted === false
    && report.authorityBoundary.strictAcceptanceEffect === false,
  "Offline evidence readiness authority boundary was promoted");
  invariant(report.summary.openScaffoldGates === 2
    && report.scaffoldAndReleaseBoundary.developmentMode === "parallel-shards"
    && report.scaffoldAndReleaseBoundary.publicationMode === "atomic"
    && report.scaffoldAndReleaseBoundary.batch001ScaffoldGateOpen === true
    && report.scaffoldAndReleaseBoundary.batch002ScaffoldGateOpen === true
    && report.scaffoldAndReleaseBoundary.openScaffoldGateCount === 2
    && report.scaffoldAndReleaseBoundary.rendererImplementationAuthorized === false
    && report.scaffoldAndReleaseBoundary.atomicLessonPublicationAuthorized === false,
  "Offline evidence readiness scaffold/release boundary drifted");
  assertAllFalse(report.closedGates, "offline evidence readiness closed gates");
  invariant(report.pendingGates.length === 10 && report.pendingGates.every((gate) => gate.status === "pending")
    && !report.pendingGates.some((gate) => gate.id === "named-human-animate-authoring-audits"),
    "Offline evidence readiness pending-gate inventory drifted");
  invariant(report.acceptance.acceptanceNeutral === true
    && report.acceptance.offlineEvidenceAggregateGenerated === true
    && report.acceptance.authoringAccepted === false
    && report.acceptance.authoritativeRuntimeAccepted === false
    && report.acceptance.specificationAccepted === false
    && report.acceptance.implementationAccepted === false
    && report.acceptance.visualOrBehaviorParityAccepted === false
    && report.acceptance.audioAccepted === false
    && report.acceptance.humanVisualReviewAccepted === false
    && report.acceptance.ownerAccepted === false
    && report.acceptance.strictMigrationComplete === false,
  "Offline evidence readiness acceptance state drifted");
  return report;
}

export function renderMarkdown(report) {
  validateOfflineEvidenceReadinessReport(report);
  const facts = report.machinePreparedFacts;
  const bindingRows = Object.entries(report.sourceBindings)
    .map(([key, binding]) => `| ${key} | \`${binding.file}\` | \`${binding.sha256}\` | ${binding.bytes.toLocaleString("en-US")} |`)
    .join("\n");
  const pendingRows = report.pendingGates
    .map((gate) => `| ${gate.id} | ${gate.current} | ${gate.exactScope} |`)
    .join("\n");
  return `# G4 L3 Offline Evidence Readiness (leaf aggregate)\n\n`
    + `This is an acceptance-neutral, leaf-only aggregate for Grade 4 Lesson 3, **Negative Numbers**. It binds existing reports without modifying them.\n\n`
    + `## Exact scope and machine-prepared facts\n\n`
    + `- Lesson identity: **40 canonical items = 39 active pages + 1 course shell**.\n`
    + `- Source split: **29 paired FLA/SWF + 11 SWF-only**.\n`
    + `- Authoring evidence: **29/29** read-only source bindings with **87** exact-mode-0444 core files, plus **29/29 applicable verified work-only Animate authoring audits**; **11 SWF-only n/a**, **0 pending**. These audits establish authoring structure only, not original-runtime behavior or acceptance.\n`
    + `- Static ActionScript operation index v2: **${facts.sourceOperations.exactItems}/40** items, **${facts.sourceOperations.exportedScriptFiles.toLocaleString("en-US")}** exported scripts, **${facts.sourceOperations.exactOperations.toLocaleString("en-US")}** exact operations, and **0** authoritative runtime trace specs.\n`
    + `- Original-runtime preparation: **1 installed-but-unapproved ${facts.originalRuntimePreparation.runtimeVersion} candidate**, **${facts.originalRuntimePreparation.exactExternalSideEffectOperations}** exact static side-effect operations across **${facts.originalRuntimePreparation.staticExternalSideEffectAffectedMembers}** members, and **${facts.originalRuntimePreparation.containmentControlsSpecified} containment controls specified / 0 approved**. The historical 10-frame IN009 set remains unpromoted; runtime sessions and authoritative baselines are 0.\n`
    + `- Catalog audio: **143/143** physical MP3s passed technical parse and decode-to-null checks; listening, cue mapping, language identity, and synchronization remain unaccepted.\n`
    + `- Embedded audio: **${facts.embeddedAudioTechnical.casObjects}** CAS objects / **${facts.embeddedAudioTechnical.sourceAudioUnitReferences}** source references; the raw SWF ADPCM object is now bound to an acceptance-neutral **${facts.embeddedAudioTechnical.derivedSwfAdpcmEvidence.independentlyDecodedBlocks}-block / ${facts.embeddedAudioTechnical.derivedSwfAdpcmEvidence.decodedPcm16MonoSamples}-sample** PCM-WAV technical decode.\n`
    + `- Product state: **${facts.lessonAndShellContracts.currentPrototypeModules} current-JavaScript candidate modules, 0 strict modules, ${facts.lessonAndShellContracts.browserVerifiedRoutes} browser-verified current-JavaScript routes, 0/40 strict-complete**.\n`
    + `- Development state: **40/40** catalog-backed migration workspaces now exist (batch-001 **25/25**, batch-002 **15/15**) and both shard scaffold gates are **open**. Workspace presence does not authorize renderer implementation; lesson publication remains **atomic** and closed at 0/40 strict-complete. The capture-capacity snapshot says: \`${facts.batchAndCapacityBoundary.captureCapacityAdmission}\`.\n\n`
    + `The SWF ADPCM-derived evidence is **${facts.embeddedAudioTechnical.derivedSwfAdpcmEvidence.status}**. It does not prove independent FFDec/original PCM equality, spoken language, cue mapping, synchronization, listening quality, runtime behavior, or acceptance.\n\n`
    + `## Pending acceptance gates (all remain closed)\n\n`
    + `| Gate | Current evidence state | Required scope |\n| --- | --- | --- |\n${pendingRows}\n\n`
    + `## Bound reports\n\n`
    + `| Key | Report | SHA-256 | Bytes |\n| --- | --- | --- | ---: |\n${bindingRows}\n\n`
    + `## Acceptance boundary\n\n${report.acceptance.statement}\n`;
}

export function parseArguments(argv) {
  const options = {check: false, jsonOutput: DEFAULT_JSON, markdownOutput: DEFAULT_MARKDOWN};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--json-output") options.jsonOutput = path.resolve(ROOT, argv[++index] || "");
    else if (argument === "--markdown-output") options.markdownOutput = path.resolve(ROOT, argv[++index] || "");
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const report = await buildOfflineEvidenceReadinessReport();
  const jsonText = stableJson(report);
  const markdownText = renderMarkdown(report);
  if (options.check) {
    const [currentJson, currentMarkdown] = await Promise.all([
      readFile(options.jsonOutput, "utf8"),
      readFile(options.markdownOutput, "utf8"),
    ]);
    invariant(currentJson === jsonText, `${relative(options.jsonOutput)} is stale`);
    invariant(currentMarkdown === markdownText, `${relative(options.markdownOutput)} is stale`);
    process.stdout.write(`PASS ${relative(options.jsonOutput)} and ${relative(options.markdownOutput)} are current\n`);
    return;
  }
  await Promise.all([
    writeFile(options.jsonOutput, jsonText),
    writeFile(options.markdownOutput, markdownText),
  ]);
  process.stdout.write(`Wrote ${relative(options.jsonOutput)} and ${relative(options.markdownOutput)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === GENERATOR_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
