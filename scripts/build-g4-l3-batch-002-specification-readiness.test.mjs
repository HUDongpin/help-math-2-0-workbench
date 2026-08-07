import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildSpecificationReadinessReport,
  parseArguments,
  renderSpecificationReadinessMarkdown,
  validateSpecificationReadinessReport,
} from "./build-g4-l3-batch-001-specification-readiness.mjs";

const BATCH_ID = "batch-002";

test("builds the exact scaffold-open, implementation-closed G4 L3 batch-002 projection", async () => {
  const report = await buildSpecificationReadinessReport(BATCH_ID);
  assert.equal(report.schemaVersion, 2);
  assert.equal(report.reportType, "g4-l3-batch-002-specification-readiness");
  assert.equal(report.cards.length, 15);
  assert.equal(report.summary.cards, 15);
  assert.equal(report.summary.flaBacked, 10);
  assert.equal(report.summary.swfOnly, 5);
  assert.equal(report.summary.rootFrameCountSum, 190);
  assert.equal(report.summary.staticRootReachableDomainCandidates, 639);
  assert.equal(report.summary.interactionCandidates, 14);
  assert.equal(report.summary.randomCandidates, 6);
  assert.equal(report.summary.externalCandidates, 3);
  assert.equal(report.summary.itemsWithEmbeddedAudioTags, 12);
  assert.equal(report.summary.itemsWithCatalogAudio, 14);
  assert.equal(report.summary.uniqueCatalogAudioFiles, 119);
  assert.equal(report.summary.existingMigrationWorkspaces, 15);
  assert.equal(report.summary.verifiedWorkOnlyAuthoringAudits, 10);
  assert.equal(report.summary.pendingApplicableAuthoringAudits, 0);
  assert.equal(report.summary.authoringAuditNotApplicable, 5);
  assert.equal(report.summary.resolvedWorkOnlyAuthoringGaps, 10);
  assert.equal(report.summary.machinePrerequisiteBundleReady, 15);
  assert.equal(report.summary.staticSourceEventIndexBound, 15);
  assert.equal(report.summary.embeddedAudioArchiveBound, 15);
  assert.equal(report.summary.assetDefinitionCensusBound, 15);
  assert.equal(report.summary.indexedSourceEventFiles, 1027);
  assert.equal(report.summary.indexedSourceHandlerFiles, 577);
  assert.equal(report.summary.staticCandidateFamilies, 68);
  assert.equal(report.summary.embeddedAudioArchiveUnits, 247);
  assert.equal(report.summary.itemsWithArchivedEmbeddedAudio, 12);
  assert.equal(report.summary.assetDefinitionCount, 4952);
  assert.equal(report.summary.exactFontDefinitionFacts, 103);
  assert.equal(report.summary.exactTextOccurrences, 2114);
  assert.equal(report.summary.humanEvidenceReady, 0);
  assert.equal(report.summary.authoritativeRuntimeReady, 0);
  assert.equal(report.summary.finalSpecificationReady, 0);
  assert.equal(report.batch.globalSequenceStart, 26);
  assert.equal(report.batch.globalSequenceEnd, 40);
  assert.equal(report.batch.gate.open, true);
  assert.equal(report.batch.gate.prerequisiteKind, "none");
  assert.equal(report.batch.gate.prerequisiteBatchId, null);
  assert.equal(report.batch.shardId, "shard-02");
  assert.equal(report.releaseFramework.developmentMode, "parallel-shards");
  assert.equal(report.releaseFramework.publicationMode, "atomic");
  assert.equal(report.batch.implementationAuthorizedNow, false);
  assert.ok(report.cards.every((card) => card.specificationReadiness.existingWorkspace.exists));
  assert.ok(report.cards.every((card) => card.specificationReadiness.existingWorkspace.migrationStatus === "preserved"));
  assert.equal(report.sourceBindings.staticSourceEventIndex.runtimeReachabilityEstablished, false);
  assert.equal(report.sourceBindings.embeddedAudioArchive.allObjectsPhysicallyVerifiedNow, true);
  assert.equal(report.sourceBindings.embeddedAudioArchive.runtimeSynchronizationEstablished, false);
  assert.equal(report.sourceBindings.assetDefinitionCensus.runtimeVisibilityEstablished, false);
  assert.deepEqual(report.batch.orderedAnimationIds, report.cards.map((card) => card.animationId));
  assert.equal(report.cards[0].animationId, "course-g04-l03-ti-004");
  assert.equal(report.cards[14].animationId, "shell-course-g04-l03-index-local");
});

test("physically re-hashes every batch-002 source and verifies every available 0444 FLA staging copy", async () => {
  const report = await buildSpecificationReadinessReport(BATCH_ID);
  assert.equal(report.summary.physicallyVerifiedSwfSources, 15);
  assert.equal(report.summary.physicallyVerifiedFlaSources, 10);
  assert.equal(report.summary.readOnlyAnimateStagingCopies, 10);
  for (const card of report.cards) {
    assert.match(card.source.swf.sha256, /^[a-f0-9]{64}$/);
    assert.equal(card.source.swf.physicalHashVerifiedNow, true);
    assert.equal(card.assetId, `swf-${card.source.swf.sha256}`);
    assert.equal(card.rootTimeline.definitionId, "root");
    assert.equal(card.rootTimeline.indexing, "one-indexed");
    assert.equal(card.rootTimeline.stage.width, 800);
    assert.equal(card.rootTimeline.stage.height, 600);
    assert.equal(card.rootTimeline.fps, 12);
    const roots = card.rootReachableFrameDomainCandidates.filter((domain) => domain.domainId === "root");
    assert.equal(roots.length, 1);
    assert.equal(roots[0].declaredFrameCount, card.rootTimeline.frameCount);
    assert.equal(card.machinePrerequisiteReadiness.allComponentsReady, true);
    assert.equal(card.machinePrerequisiteReadiness.finalSpecificationReady, false);
    assert.equal(card.machinePrerequisiteReadiness.implementationAuthorized, false);
    assert.equal(card.machinePrerequisiteReadiness.strictComplete, false);
    assert.equal(card.machinePrerequisiteFacts.staticSourceEvents.machinePrerequisiteBound, true);
    assert.equal(card.machinePrerequisiteFacts.staticSourceEvents.runtimeReachabilityEstablished, false);
    assert.equal(card.machinePrerequisiteFacts.embeddedAudio.machinePrerequisiteBound, true);
    assert.equal(card.machinePrerequisiteFacts.embeddedAudio.runtimeSynchronizationEstablished, false);
    assert.equal(card.machinePrerequisiteFacts.assetDefinitions.machinePrerequisiteBound, true);
    assert.equal(card.machinePrerequisiteFacts.assetDefinitions.rendererReuseAuthorized, false);
    if (card.source.fla) {
      assert.equal(card.source.fla.physicalHashVerifiedNow, true);
      assert.equal(card.source.animatePrepare.workingCopy.mode, "0444");
      assert.equal(card.source.animatePrepare.workingCopy.linkCount, 1);
      assert.equal(card.source.animatePrepare.workingCopy.readOnly, true);
      assert.equal(card.source.animatePrepare.workingCopy.separateRegularFile, true);
      assert.equal(card.source.animatePrepare.workingCopy.byteIdenticalToSource, true);
    } else {
      assert.equal(card.source.animatePrepare, null);
    }
  }
  const first = report.cards[0];
  assert.equal(first.source.swf.sha256, "04145dae5f7b295bed7ed882689be12ca7c4d31ef392a496d1c741ba1915a43c");
  assert.equal(first.source.fla.sha256, "68837d6c25eb947fcb76a7ecf1113f28db9a45136dd1d4ce9a966d890a245fc3");
  assert.equal(first.rootReachableFrameDomainCandidates.length, 26);
  assert.equal(first.machinePrerequisiteFacts.staticSourceEvents.itemFingerprintSha256,
    "43f19d45c98e39758160259548063e64e9fb4407c5c676aca58800f939290ac5");
  assert.equal(first.machinePrerequisiteFacts.embeddedAudio.itemFingerprintSha256,
    "9ec042230a5f8dee7438c8b7615e8568a916e485851dc81f52401e36db47b373");
  assert.equal(first.machinePrerequisiteFacts.assetDefinitions.definitionInventorySha256,
    "51b45dedae69c2750e9865ac3d3aca572d99d7072dff9e3ddc1d7f42f3599454");
  const shell = report.cards.at(-1);
  assert.equal(shell.source.swf.sha256, "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e");
  assert.equal(shell.rootTimeline.frameCount, 50);
  assert.equal(shell.rootReachableFrameDomainCandidates.length, 90);
});

test("retains static interaction, random, external, and audio risks without claiming runtime reachability", async () => {
  const report = await buildSpecificationReadinessReport(BATCH_ID);
  const fq002 = report.cards.find((card) => card.animationId === "course-g04-l03-fq-002");
  assert.equal(fq002.rootReachableFrameDomainCandidates.length, 208);
  assert.equal(fq002.risks.interaction.candidate, true);
  assert.equal(fq002.risks.interaction.runtimeReachabilityProved, false);
  assert.equal(fq002.risks.random.candidate, true);
  assert.equal(fq002.risks.random.deterministicOutcomeMapProved, false);
  assert.equal(fq002.risks.external.candidate, true);
  assert.equal(fq002.risks.external.legacyCallsExecutedDuringAudit, 0);
  assert.equal(fq002.risks.external.reviewedDispositionComplete, false);
  assert.equal(fq002.risks.audio.catalogAssociatedFileCount, 108);
  assert.equal(fq002.risks.audio.cueMappingEstablished, false);
  assert.equal(fq002.risks.audio.listeningAcceptanceEstablished, false);

  const shell = report.cards.at(-1);
  assert.equal(shell.risks.external.candidate, true);
  assert.equal(shell.risks.external.occurrenceCount, 18);
  assert.equal(shell.risks.audio.embeddedTagCount, 283);
  assert.equal(shell.risks.audio.catalogAssociatedFileCount, 0);
});

test("keeps batch-002 human, runtime, and final-specification obligations exact and unresolved", async () => {
  const report = await buildSpecificationReadinessReport(BATCH_ID);
  assert.equal(report.summary.unresolvedHumanGaps, 50);
  assert.equal(report.summary.unresolvedRuntimeGaps, 81);
  assert.equal(report.summary.unresolvedFinalSpecificationGaps, 120);
  for (const card of report.cards) {
    assert.equal(card.remainingGaps.allRequiredGapsClosed, false);
    assert.equal(card.remainingGaps.counts.resolvedByMachineEvidence, 0);
    assert.equal(card.remainingGaps.counts.resolvedByWorkOnlyAuthoringEvidence, card.source.fla ? 1 : 0);
    for (const kind of ["human", "runtime", "finalSpecification"]) {
      assert.ok(card.remainingGaps[kind].length > 0);
      assert.ok(card.remainingGaps[kind].every((gap) => gap.status === "required-unresolved"));
      assert.ok(card.remainingGaps[kind].every((gap) => gap.machineEvidenceAloneClosesGap === false));
    }
  }
});

test("binds completed paired-source work-only audits and assigns Dr. Peter Hu only as dialog operator", async () => {
  const report = await buildSpecificationReadinessReport(BATCH_ID);
  const paired = report.cards.filter((card) => card.source.fla);
  const swfOnly = report.cards.filter((card) => !card.source.fla);
  assert.equal(paired.length, 10);
  assert.equal(swfOnly.length, 5);
  for (const card of paired) {
    const authoring = card.workOnlyAuthoringAudit;
    assert.equal(card.humanAssistedAnimate, null);
    assert.equal(authoring.designatedDialogOperator, "Dr. Peter Hu");
    assert.match(authoring.operatorRoleBoundary, /not review, approval, evidence signature/);
    assert.equal(authoring.status, "verified-work-only-authoring-audit");
    assert.match(authoring.receipt.sha256, /^[a-f0-9]{64}$/);
    assert.match(authoring.workEvidence.sha256, /^[a-f0-9]{64}$/);
    assert.equal(authoring.sourceSwfExecuted, false);
    assert.equal(authoring.provesFlaSwfEquivalence, false);
    assert.equal(authoring.originalRuntimeBehaviorEstablished, false);
    assert.equal(authoring.authoringAccepted, false);
    assert.equal(authoring.strictAcceptanceEffect, false);
  }
  for (const card of swfOnly) {
    assert.equal(card.humanAssistedAnimate, null);
    assert.equal(card.workOnlyAuthoringAudit, null);
  }
});

test("enumerates exact unresolved specification evidence for every batch-002 item", async () => {
  const report = await buildSpecificationReadinessReport(BATCH_ID);
  for (const card of report.cards) {
    const readiness = card.specificationReadiness;
    assert.equal(readiness.status, "static-source-bound-specification-not-ready");
    assert.equal(readiness.fullSpecificationReady, false);
    assert.equal(readiness.rendererImplementationAuthorized, false);
    for (const field of ["migrationJson", "keyframesCsv", "scenarioInventory"]) {
      assert.equal(readiness[field].readyForFinalSpecification, false);
      assert.ok(readiness[field].exactRemainingEvidence.length > 0);
      assert.ok(readiness[field].exactRemainingEvidence.every((requirement) => requirement.status === "required-unresolved"));
    }
    const migrationIds = readiness.migrationJson.exactRemainingEvidence.map((requirement) => requirement.id);
    const keyframeIds = readiness.keyframesCsv.exactRemainingEvidence.map((requirement) => requirement.id);
    const scenarioIds = readiness.scenarioInventory.exactRemainingEvidence.map((requirement) => requirement.id);
    if (card.source.fla) {
      assert.equal(migrationIds.includes("paired-animate-authoring-audit"), false);
      assert.ok(readiness.readyFacts.includes("hash-bound work-only Adobe Animate authoring-structure audit"));
    } else {
      assert.ok(migrationIds.includes("missing-fla-limitation"));
    }
    assert.ok(migrationIds.includes("frame-domain-disposition"));
    assert.ok(migrationIds.includes("host-language-entry-contract"));
    assert.ok(keyframeIds.includes("authoritative-original-runtime-baselines"));
    assert.ok(keyframeIds.includes("visual-and-behavior-boundary-map"));
    assert.ok(scenarioIds.includes("natural-original-runtime-traces"));
    assert.ok(scenarioIds.includes("audio-cue-map"));
    if (card.risks.interaction.candidate) assert.ok(scenarioIds.includes("interaction-event-map"));
    if (card.risks.random.candidate) assert.ok(scenarioIds.includes("random-outcome-map"));
    if (card.risks.external.candidate) assert.ok(scenarioIds.includes("external-call-disposition"));
  }
});

test("checked-in batch-002 JSON and Markdown exactly match the shared deterministic generator", async () => {
  const report = await buildSpecificationReadinessReport(BATCH_ID);
  const [json, markdown] = await Promise.all([
    readFile("reports/g4-l3-batch-002-specification-readiness.json", "utf8"),
    readFile("reports/g4-l3-batch-002-specification-readiness.md", "utf8"),
  ]);
  assert.equal(json, `${JSON.stringify(report, null, 2)}\n`);
  assert.equal(markdown, renderSpecificationReadinessMarkdown(report));
});

test("shared validator rejects batch-002 gate promotion, source drift, false readiness, and unsafe commands", async () => {
  const report = await buildSpecificationReadinessReport(BATCH_ID);

  const gate = structuredClone(report);
  gate.batch.gate.open = false;
  assert.throws(() => validateSpecificationReadinessReport(gate), /Open batch-002 scaffold gate/);

  const source = structuredClone(report);
  source.cards[0].source.swf.sha256 = "0".repeat(64);
  assert.throws(() => validateSpecificationReadinessReport(source), /assetId does not bind/);

  const readiness = structuredClone(report);
  readiness.cards[0].specificationReadiness.fullSpecificationReady = true;
  assert.throws(() => validateSpecificationReadinessReport(readiness), /summary field finalSpecificationReady|promoted/);

  const authoring = structuredClone(report);
  authoring.cards[0].workOnlyAuthoringAudit.originalRuntimeBehaviorEstablished = true;
  assert.throws(() => validateSpecificationReadinessReport(authoring), /work-only paired authoring evidence/);

  const machine = structuredClone(report);
  machine.cards[0].machinePrerequisiteFacts.embeddedAudio.cueMappingEstablished = true;
  assert.throws(() => validateSpecificationReadinessReport(machine), /machine prerequisite facts/);

  const gap = structuredClone(report);
  gap.cards[0].remainingGaps.runtime[0].status = "complete";
  assert.throws(() => validateSpecificationReadinessReport(gap), /exact human\/runtime\/specification gaps/);
});

test("CLI selects deterministic batch-002 default outputs and rejects unsupported batches", () => {
  const options = parseArguments(["--batch", BATCH_ID, "--check"]);
  assert.equal(options.batchId, BATCH_ID);
  assert.equal(options.check, true);
  assert.match(options.jsonOutput, /reports\/g4-l3-batch-002-specification-readiness\.json$/);
  assert.match(options.markdownOutput, /reports\/g4-l3-batch-002-specification-readiness\.md$/);
  assert.throws(() => parseArguments(["--batch"]), /requires a batch ID/);
  assert.throws(() => parseArguments(["--batch", "batch-003"]), /Unsupported G4 L3 batch/);
});
