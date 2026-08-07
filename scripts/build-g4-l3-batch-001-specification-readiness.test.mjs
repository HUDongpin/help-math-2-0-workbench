import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildSpecificationReadinessReport,
  deriveSpecificationReadiness,
  parseArguments,
  renderSpecificationReadinessMarkdown,
  validateSpecificationReadinessReport,
} from "./build-g4-l3-batch-001-specification-readiness.mjs";

test("builds the exact scaffold-open, implementation-closed G4 L3 batch-001 projection", async () => {
  const report = await buildSpecificationReadinessReport();
  assert.equal(report.schemaVersion, 2);
  assert.equal(report.cards.length, 25);
  assert.equal(report.summary.cards, 25);
  assert.equal(report.summary.flaBacked, 19);
  assert.equal(report.summary.swfOnly, 6);
  assert.equal(report.summary.rootFrameCountSum, 250);
  assert.equal(report.summary.staticRootReachableDomainCandidates, 260);
  assert.equal(report.summary.interactionCandidates, 24);
  assert.equal(report.summary.randomCandidates, 6);
  assert.equal(report.summary.externalCandidates, 0);
  assert.equal(report.summary.existingMigrationWorkspaces, 25);
  assert.equal(report.summary.verifiedWorkOnlyAuthoringAudits, 19);
  assert.equal(report.summary.pendingApplicableAuthoringAudits, 0);
  assert.equal(report.summary.authoringAuditNotApplicable, 6);
  assert.equal(report.summary.resolvedWorkOnlyAuthoringGaps, 19);
  assert.equal(report.summary.machinePrerequisiteBundleReady, 25);
  assert.equal(report.summary.staticSourceEventIndexBound, 25);
  assert.equal(report.summary.embeddedAudioArchiveBound, 25);
  assert.equal(report.summary.assetDefinitionCensusBound, 25);
  assert.equal(report.summary.indexedSourceEventFiles, 519);
  assert.equal(report.summary.indexedSourceHandlerFiles, 239);
  assert.equal(report.summary.staticCandidateFamilies, 75);
  assert.equal(report.summary.embeddedAudioArchiveUnits, 112);
  assert.equal(report.summary.itemsWithArchivedEmbeddedAudio, 25);
  assert.equal(report.summary.assetDefinitionCount, 3116);
  assert.equal(report.summary.exactFontDefinitionFacts, 114);
  assert.equal(report.summary.exactTextOccurrences, 991);
  assert.equal(report.summary.humanEvidenceReady, 0);
  assert.equal(report.summary.authoritativeRuntimeReady, 0);
  assert.equal(report.summary.finalSpecificationReady, 0);
  assert.equal(report.sourceBindings.pairedAnimateAssistRunner.pairedFlaSwfMode, true);
  assert.equal(report.sourceBindings.pairedAnimateAssistRunner.dialogAutomationAllowed, false);
  assert.match(report.sourceBindings.pairedAnimateAssistRunner.sha256, /^[a-f0-9]{64}$/);
  assert.equal(report.batch.gate.open, true);
  assert.equal(report.batch.gate.prerequisiteKind, "none");
  assert.equal(report.batch.shardId, "shard-01");
  assert.equal(report.releaseFramework.developmentMode, "parallel-shards");
  assert.equal(report.releaseFramework.publicationMode, "atomic");
  assert.equal(report.batch.implementationAuthorizedNow, false);
  assert.ok(report.cards.every((card) => card.specificationReadiness.existingWorkspace.exists));
  assert.ok(report.cards.every((card) => card.specificationReadiness.existingWorkspace.migrationStatus === "preserved"));
  assert.equal(report.sourceBindings.staticSourceEventIndex.runtimeReachabilityEstablished, false);
  assert.equal(report.sourceBindings.staticSourceEventIndex.sourceScriptFilesBound, 1809);
  assert.equal(report.sourceBindings.embeddedAudioArchive.archivedFileCount, 88);
  assert.equal(report.sourceBindings.embeddedAudioArchive.allObjectsPhysicallyVerifiedNow, true);
  assert.equal(report.sourceBindings.embeddedAudioArchive.cueMappingEstablished, false);
  assert.equal(report.sourceBindings.assetDefinitionCensus.totalDefinitions, 8068);
  assert.equal(report.sourceBindings.assetDefinitionCensus.rendererReuseAuthorized, false);
  assert.deepEqual(report.batch.orderedAnimationIds, report.cards.map((card) => card.animationId));
  assert.equal(report.cards[0].animationId, "course-g04-l03-ir-001-341242cc");
  assert.equal(report.cards[24].animationId, "course-g04-l03-ti-003");
});

test("re-hashes each physical source and keeps the root timeline distinct from child domains", async () => {
  const report = await buildSpecificationReadinessReport();
  assert.equal(report.summary.physicallyVerifiedSwfSources, 25);
  assert.equal(report.summary.physicallyVerifiedFlaSources, 19);
  assert.equal(report.summary.readOnlyAnimateStagingCopies, 19);
  for (const card of report.cards) {
    assert.match(card.source.swf.sha256, /^[a-f0-9]{64}$/);
    assert.equal(card.source.swf.physicalHashVerifiedNow, true);
    assert.equal(card.assetId, `swf-${card.source.swf.sha256}`);
    assert.equal(card.rootTimeline.definitionId, "root");
    assert.equal(card.rootTimeline.indexing, "one-indexed");
    assert.equal(card.rootTimeline.stage.width, 800);
    assert.equal(card.rootTimeline.stage.height, 600);
    assert.equal(card.rootTimeline.fps, 12);
    const root = card.rootReachableFrameDomainCandidates.filter((domain) => domain.domainId === "root");
    assert.equal(root.length, 1);
    assert.equal(root[0].declaredFrameCount, card.rootTimeline.frameCount);
    assert.equal(card.machinePrerequisiteReadiness.allComponentsReady, true);
    assert.equal(card.machinePrerequisiteReadiness.finalSpecificationReady, false);
    assert.equal(card.machinePrerequisiteReadiness.implementationAuthorized, false);
    assert.equal(card.machinePrerequisiteReadiness.strictComplete, false);
    assert.equal(card.machinePrerequisiteFacts.staticSourceEvents.machinePrerequisiteBound, true);
    assert.equal(card.machinePrerequisiteFacts.staticSourceEvents.runtimeReachabilityEstablished, false);
    assert.equal(card.machinePrerequisiteFacts.staticSourceEvents.exactTimelineOperationMethodsResolved, 0);
    assert.equal(card.machinePrerequisiteFacts.embeddedAudio.machinePrerequisiteBound, true);
    assert.equal(card.machinePrerequisiteFacts.embeddedAudio.cueMappingEstablished, false);
    assert.equal(card.machinePrerequisiteFacts.embeddedAudio.listeningAcceptanceEstablished, false);
    assert.equal(card.machinePrerequisiteFacts.assetDefinitions.machinePrerequisiteBound, true);
    assert.equal(card.machinePrerequisiteFacts.assetDefinitions.runtimeVisibilityEstablished, false);
    assert.equal(card.machinePrerequisiteFacts.assetDefinitions.rendererReuseAuthorized, false);
  }
  const first = report.cards[0];
  assert.equal(first.source.swf.sha256, "2af6431db3ed786d9b48feec5a649887af92fb219a04e5dbd42e7e4b04087df4");
  assert.equal(first.source.fla.sha256, "3f5fe69773dea4516f1804cbd0e77396450c60d989691b87563d480d4179809c");
  assert.equal(first.rootTimeline.frameCount, 10);
  assert.equal(first.rootReachableFrameDomainCandidates.length, 4);
  assert.equal(first.rootReachableFrameDomainCandidates.at(-1).domainId, "sprite-27");
  assert.equal(first.rootReachableFrameDomainCandidates.at(-1).declaredFrameCount, 136);
  assert.equal(first.machinePrerequisiteFacts.staticSourceEvents.itemFingerprintSha256,
    "95b28ef9f2bc5dbf8775d4215abb4fb4f06e1adc192f8a7b1b5f1ce985dcf83d");
  assert.equal(first.machinePrerequisiteFacts.embeddedAudio.itemFingerprintSha256,
    "0cf8baf3d9c779bd85a62acad2aa5545302ec162df10337d9d46654a6e72aed9");
  assert.equal(first.machinePrerequisiteFacts.assetDefinitions.definitionInventorySha256,
    "9a8fcb53161724eb29b7322b704764d4a0c5e68e3b40c9dcbf15a5ccc46280fa");
});

test("keeps exact human, runtime, and final-specification gaps unresolved after machine readiness", async () => {
  const report = await buildSpecificationReadinessReport();
  assert.equal(report.summary.unresolvedHumanGaps, 81);
  assert.equal(report.summary.unresolvedRuntimeGaps, 131);
  assert.equal(report.summary.unresolvedFinalSpecificationGaps, 200);
  for (const card of report.cards) {
    assert.equal(card.remainingGaps.allRequiredGapsClosed, false);
    assert.equal(card.remainingGaps.counts.resolvedByMachineEvidence, 0);
    assert.equal(card.remainingGaps.counts.resolvedByWorkOnlyAuthoringEvidence, card.source.fla ? 1 : 0);
    for (const kind of ["human", "runtime", "finalSpecification"]) {
      assert.ok(card.remainingGaps[kind].length > 0);
      assert.ok(card.remainingGaps[kind].every((gap) => gap.status === "required-unresolved"));
      assert.ok(card.remainingGaps[kind].every((gap) => gap.machineEvidenceAloneClosesGap === false));
    }
    assert.ok(card.remainingGaps.runtime.some((gap) =>
      gap.id === "authoritative-runtime-reachability-and-scenario-traces"));
    assert.ok(card.remainingGaps.finalSpecification.some((gap) =>
      gap.id === "asset-definition-placement-and-reuse-disposition"));
    assert.ok(card.remainingGaps.human.some((gap) => gap.id === "owner-acceptance"));
  }
});

test("binds completed paired-source work-only authoring audits without emitting another command", async () => {
  const report = await buildSpecificationReadinessReport();
  const paired = report.cards.filter((card) => card.source.fla);
  const swfOnly = report.cards.filter((card) => !card.source.fla);
  assert.equal(paired.length, 19);
  assert.equal(swfOnly.length, 6);
  for (const card of paired) {
    const authoring = card.workOnlyAuthoringAudit;
    assert.equal(card.humanAssistedAnimate, null);
    assert.equal(authoring.designatedDialogOperator, "Dr. Peter Hu");
    assert.match(authoring.operatorRoleBoundary, /not review, approval, evidence signature/);
    assert.equal(authoring.status, "verified-work-only-authoring-audit");
    assert.equal(card.source.animatePrepare.workingCopy.mode, "0444");
    assert.equal(card.source.animatePrepare.workingCopy.linkCount, 1);
    assert.equal(card.source.animatePrepare.workingCopy.byteIdenticalToSource, true);
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
    assert.equal(card.source.animatePrepare, null);
  }
});

test("derives conditional exact remaining evidence without promoting partial IN009 artifacts", async () => {
  const [workCards, preflight] = await Promise.all([
    readFile("reports/g4-l3-implementation-work-cards.json", "utf8").then(JSON.parse),
    readFile("reports/g4-l3-automation-preflight.json", "utf8").then(JSON.parse),
  ]);
  const firstCard = workCards.cards[0];
  const firstPreflight = preflight.items.find((item) => item.animationId === firstCard.animationId);
  const first = deriveSpecificationReadiness(firstCard, firstPreflight, {status: "verified-work-only-authoring-audit"});
  const firstIds = first.migrationJson.exactRemainingEvidence.map((item) => item.id);
  assert.equal(first.status, "static-source-bound-specification-not-ready");
  assert.equal(firstIds.includes("paired-animate-authoring-audit"), false);
  assert.ok(first.readyFacts.includes("hash-bound work-only Adobe Animate authoring-structure audit"));
  assert.ok(firstIds.includes("interaction-event-map"));
  assert.ok(firstIds.includes("random-outcome-map"));
  assert.equal(first.fullSpecificationReady, false);

  const in009Card = workCards.cards.find((card) => card.animationId === "course-g04-l03-in-009");
  const in009Preflight = preflight.items.find((item) => item.animationId === in009Card.animationId);
  const in009 = deriveSpecificationReadiness(in009Card, in009Preflight);
  const in009Ids = in009.migrationJson.exactRemainingEvidence.map((item) => item.id);
  assert.equal(in009.existingWorkspace.exists, true);
  assert.equal(in009.existingWorkspace.migrationStatus, "preserved");
  assert.equal(in009.migrationJson.status, "existing-preserved-not-finally-specified");
  assert.ok(in009Ids.includes("missing-fla-limitation"));
  assert.ok(in009Ids.includes("natural-original-runtime-traces"));
  assert.equal(in009.rendererImplementationAuthorized, false);
  assert.equal(in009.fullSpecificationReady, false);
});

test("checked-in JSON and Markdown exactly match the deterministic generator", async () => {
  const report = await buildSpecificationReadinessReport();
  const [json, markdown] = await Promise.all([
    readFile("reports/g4-l3-batch-001-specification-readiness.json", "utf8"),
    readFile("reports/g4-l3-batch-001-specification-readiness.md", "utf8"),
  ]);
  assert.equal(json, `${JSON.stringify(report, null, 2)}\n`);
  assert.equal(markdown, renderSpecificationReadinessMarkdown(report));
});

test("validator rejects gate promotion, source identity drift, and false readiness", async () => {
  const report = await buildSpecificationReadinessReport();

  const gate = structuredClone(report);
  gate.batch.gate.open = false;
  assert.throws(() => validateSpecificationReadinessReport(gate), /Open batch-001 scaffold gate/);

  const source = structuredClone(report);
  source.cards[0].source.swf.sha256 = "0".repeat(64);
  assert.throws(() => validateSpecificationReadinessReport(source), /assetId does not bind/);

  const readiness = structuredClone(report);
  readiness.cards[0].specificationReadiness.fullSpecificationReady = true;
  assert.throws(() => validateSpecificationReadinessReport(readiness), /unresolved specification work was promoted/);

  const authoring = structuredClone(report);
  authoring.cards[0].workOnlyAuthoringAudit.originalRuntimeBehaviorEstablished = true;
  assert.throws(() => validateSpecificationReadinessReport(authoring), /work-only paired authoring evidence/);

  const machine = structuredClone(report);
  machine.cards[0].machinePrerequisiteReadiness.components.staticSourceEventIndex.ready = false;
  assert.throws(() => validateSpecificationReadinessReport(machine), /machine prerequisite bundle/);

  const runtime = structuredClone(report);
  runtime.cards[0].machinePrerequisiteFacts.staticSourceEvents.runtimeReachabilityEstablished = true;
  assert.throws(() => validateSpecificationReadinessReport(runtime), /machine prerequisite facts/);

  const gap = structuredClone(report);
  gap.cards[0].remainingGaps.human[0].status = "complete";
  assert.throws(() => validateSpecificationReadinessReport(gap), /exact human\/runtime\/specification gaps/);
});

test("CLI parsing is deterministic and rejects incomplete or unknown options", () => {
  assert.equal(parseArguments(["--check"]).check, true);
  assert.equal(parseArguments(["--help"]).help, true);
  assert.match(parseArguments(["--json-output", "reports/custom.json"]).jsonOutput, /reports\/custom\.json$/);
  assert.match(parseArguments(["--markdown-output", "reports/custom.md"]).markdownOutput, /reports\/custom\.md$/);
  assert.throws(() => parseArguments(["--json-output"]), /requires a path/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});
