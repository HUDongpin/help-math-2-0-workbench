#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const GENERATOR_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(GENERATOR_PATH), "..");
const REPORT_BASENAME = "g4-l3-authoritative-runtime-acquisition-contract";
const DEFAULT_JSON = path.join(ROOT, "reports", `${REPORT_BASENAME}.json`);
const DEFAULT_MARKDOWN = path.join(ROOT, "reports", `${REPORT_BASENAME}.md`);

const REQUIRED_INPUTS = Object.freeze([
  {
    key: "machineSourceAudits",
    file: "reports/g4-l3-machine-source-audits.json",
    reportType: "g4-l3-machine-source-audits",
    schemaVersion: 1,
    generator: "scripts/build-g4-l3-machine-source-audits.mjs",
  },
  {
    key: "implementationWorkCards",
    file: "reports/g4-l3-implementation-work-cards.json",
    reportType: "g4-l3-implementation-work-cards",
    schemaVersion: 1,
    generator: "scripts/build-g4-l3-implementation-work-cards.mjs",
  },
  {
    key: "staticSourceEventIndex",
    file: "reports/g4-l3-static-source-event-index.json",
    reportType: "g4-l3-static-source-event-index",
    schemaVersion: 1,
    generator: "scripts/build-g4-l3-static-source-event-index.mjs",
  },
  {
    key: "sourceOperationIndexV2",
    file: "reports/g4-l3-source-operation-index-v2.json",
    reportType: "g4-l3-actionscript-source-operation-index",
    schemaVersion: 2,
    generator: "scripts/build-g4-l3-source-operation-index-v2.mjs",
  },
  {
    key: "lessonProductNavigationContract",
    file: "reports/g4-l3-lesson-product-navigation-contract.json",
    reportType: "g4-l3-full-lesson-product-navigation-contract",
    schemaVersion: 1,
    generator: "scripts/build-g4-l3-lesson-product-contract.mjs",
  },
  {
    key: "pairedAuthoringSourceBindings",
    file: "reports/g4-l3-paired-authoring-source-bindings.json",
    reportType: "g4-l3-paired-authoring-source-bindings",
    schemaVersion: 1,
    generator: "scripts/build-g4-l3-paired-authoring-source-bindings.mjs",
  },
  {
    key: "animateAuthoringOperatorQueue",
    file: "reports/g4-l3-animate-authoring-operator-queue.json",
    reportType: "g4-l3-adobe-animate-human-assisted-authoring-operator-queue",
    schemaVersion: 1,
    generator: "scripts/build-g4-l3-animate-operator-queue.mjs",
  },
  {
    key: "animateAuthoringAuditIndex",
    file: "reports/g4-l3-animate-authoring-audit-index.json",
    reportType: "g4-l3-adobe-animate-authoring-audit-result-index",
    schemaVersion: 1,
    generator: "scripts/build-g4-l3-animate-authoring-audit-index.mjs",
  },
  {
    key: "ruffleReferenceMatrix",
    file: "reports/g4-l3-ruffle-reference-matrix.json",
    reportType: "g4-l3-ruffle-forensic-reference-matrix",
    schemaVersion: 1,
    generator: "scripts/build-g4-l3-ruffle-reference-matrix.mjs",
  },
  {
    key: "captureCapacityReadiness",
    file: "reports/g4-l3-capture-capacity-readiness.json",
    reportType: "g4-l3-capture-capacity-readiness",
    schemaVersion: 1,
    generator: "scripts/build-g4-l3-capture-capacity-readiness.mjs",
  },
  {
    key: "originalRuntimeEnvironmentReadiness",
    file: "reports/g4-l3-original-runtime-environment-readiness.json",
    reportType: "g4-l3-original-runtime-environment-readiness",
    schemaVersion: 1,
    generator: "scripts/build-g4-l3-original-runtime-environment-readiness.mjs",
  },
  {
    key: "originalRuntimeContainmentReadiness",
    file: "reports/g4-l3-original-runtime-containment-readiness.json",
    reportType: "g4-l3-original-runtime-containment-readiness",
    schemaVersion: 1,
    generator: "scripts/build-g4-l3-original-runtime-containment-readiness.mjs",
  },
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
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

async function physicalBinding(file) {
  const bytes = await readFile(file);
  return {file: relative(file), sha256: sha256(bytes), bytes: bytes.length};
}

async function readBoundInput(definition) {
  const [reportBytes, generator] = await Promise.all([
    readFile(path.join(ROOT, definition.file)),
    physicalBinding(path.join(ROOT, definition.generator)),
  ]);
  const report = JSON.parse(reportBytes);
  invariant(report.reportType === definition.reportType,
    `${definition.key}: expected reportType ${definition.reportType}, found ${report.reportType}`);
  invariant(report.schemaVersion === definition.schemaVersion,
    `${definition.key}: expected schemaVersion ${definition.schemaVersion}, found ${report.schemaVersion}`);
  return {
    definition,
    report,
    binding: {
      file: definition.file,
      sha256: sha256(reportBytes),
      bytes: reportBytes.length,
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
  invariant(JSON.stringify(actual) === JSON.stringify(expected), `${label}: ordered 40-item identity drifted`);
}

function indexByAnimationId(items, label) {
  const index = new Map(items.map((item) => [item.animationId, item]));
  invariant(index.size === items.length, `${label}: duplicate animationId`);
  return index;
}

function minimalScenarioCandidate(candidate) {
  return {
    candidateId: candidate.candidateId,
    sourceOperationCount: candidate.sourceOperationIds.length,
    sourceSignalCount: candidate.sourceSignalIds.length,
    sourceEventCount: candidate.sourceEventIds.length,
    orderedScheduleEstablished: false,
    runtimeReachabilityEstablished: false,
    authoritativeTraceIds: [],
    captureScheduleEstablished: false,
    deterministicSeedBindingEstablished: false,
    acceptanceEffect: "none",
  };
}

function minimalStaticFamily(family) {
  return {
    familyId: family.familyId,
    sourceEventCount: family.sourceEventIds.length,
    runtimeReachabilityEstablished: false,
    runtimeScenarioIds: [],
    captureScheduleEstablished: false,
    deterministicSeedContractEstablished: false,
    acceptanceEffect: "none",
  };
}

function buildItem({machine, card, events, operations, product, paired, animate, authoringResult, ruffle,
  runtimeEnvironment, runtimeContainment}) {
  const isPaired = machine.source.sourceKind === "fla+swf";
  const embeddedAudioTagCount = card.signals.embeddedAudio.tagCount;
  const externalAudioAssociationCount = card.signals.externalAudioAssociationCount;
  const sourceBoundScenarioCandidates = operations.scenarioTraceCandidates.map(minimalScenarioCandidate);
  const staticCandidateFamilies = events.candidateScenarioFamilies.map(minimalStaticFamily);
  const randomCandidate = events.counts.randomCallOccurrences > 0;
  const frameDomains = machine.swf.frameDomains;
  let selectedAuthoringAttempt = null;

  if (isPaired) {
    invariant(paired && animate && authoringResult,
      `${machine.animationId}: paired item is missing its prepared Animate bindings or result`);
    invariant(paired.prepared.runArtifactFileCount > 0
      && paired.observedAuthoringAudit.status === "verified-work-only-authoring-audit"
      && paired.observedAuthoringAudit.originalRuntimeBaselineEstablished === false
      && paired.observedAuthoringAudit.acceptanceEffect === false
      && paired.boundedRerunCommand.dialogAutomationAllowed === false
      && paired.boundedRerunCommand.sourceSwfExecuted === false
      && paired.boundedRerunCommand.strictAcceptanceEffect === false,
    `${machine.animationId}: paired authoring gate unexpectedly changed`);
    invariant(animate.currentState === "ready-for-named-human-one-item-run",
      `${machine.animationId}: Animate queue state drifted`);
    invariant(authoringResult.status === "verified-work-only-authoring-audit"
      && authoringResult.selectedPassingAudit
      && authoringResult.originalRuntimeBehaviorEstablished === false
      && authoringResult.humanVisualReviewEstablished === false
      && authoringResult.ownerAcceptanceEstablished === false
      && authoringResult.strictAcceptanceEffect === false,
    `${machine.animationId}: completed work-only authoring result is missing or promoted`);
    selectedAuthoringAttempt = authoringResult.attempts.find((attempt) =>
      attempt.status === "passed"
      && attempt.evidenceId === authoringResult.selectedPassingAudit.evidenceId
      && attempt.runId === authoringResult.selectedPassingAudit.runId);
    invariant(selectedAuthoringAttempt
      && typeof selectedAuthoringAttempt.dialogOperator === "string"
      && selectedAuthoringAttempt.dialogOperator.length >= 2
      && selectedAuthoringAttempt.automatedDialogInteractionUsed === false
      && selectedAuthoringAttempt.reviewOrOwnerDecisionRecorded === false
      && selectedAuthoringAttempt.migrationOrApprovalWrites === false
      && selectedAuthoringAttempt.acceptanceEffect === false,
    `${machine.animationId}: selected authoring attempt crossed its operator or acceptance boundary`);
  } else {
    invariant(!paired && !animate && !authoringResult,
      `${machine.animationId}: SWF-only item unexpectedly has a paired Animate row`);
  }

  invariant(ruffle.animationId === machine.animationId, `${machine.animationId}: Ruffle queue identity drifted`);
  invariant(ruffle.expectedDiagnostic.resultCannotBeUsedAs.includes("authoritative-original-runtime-baseline"),
    `${machine.animationId}: Ruffle boundary no longer excludes authoritative baselines`);
  invariant(card.requiredWork.originalRuntime.authoritativeBaselineEstablished === false,
    `${machine.animationId}: work card unexpectedly reports an authoritative baseline`);
  invariant(events.runtimeBoundary.originalRuntimeBaselines.length === 0,
    `${machine.animationId}: static event index unexpectedly contains an original-runtime baseline`);
  invariant(operations.runtimeBoundary.authoritativeTraceSpecsEstablished === false,
    `${machine.animationId}: source operation index unexpectedly contains an authoritative trace spec`);
  const historicalRuntimeCandidate = runtimeEnvironment.historicalCandidates.find((candidate) =>
    candidate.animationId === machine.animationId);
  const externalSurface = runtimeContainment.staticExternalSurface.affectedMembers.find((candidate) =>
    candidate.animationId === machine.animationId);

  return {
    sequence: machine.sequence,
    animationId: machine.animationId,
    assetId: machine.assetId,
    releaseRole: machine.releaseRole,
    batch: machine.batch,
    classification: machine.classification,
    source: {
      sourceKind: machine.source.sourceKind,
      swf: machine.source.swf,
      fla: machine.source.fla,
    },
    nativeRuntimeFacts: {
      stage: machine.swf.header.stage,
      fps: machine.swf.header.fps,
      rootFrameCount: machine.swf.header.rootFrameCount,
      rootFramesAreOneIndexed: true,
      rootTimelineMustNotBeReplacedByNestedTimeline: true,
      staticallyRootReachableNestedDefinitionCount: frameDomains.staticallyRootReachableDefinitionCount,
      staticallyRootReachableDeclaredFrameCountSum: frameDomains.staticallyRootReachableDeclaredFrameCountSum,
      staticReachabilityIsRuntimeProof: false,
      frameDomainDispositionEstablished: false,
    },
    authoringGate: {
      required: isPaired,
      status: isPaired ? "verified-work-only-authoring-audit" : "not-applicable-swf-only",
      preparedReadOnlyBindingsVerified: isPaired,
      animateQueueOrdinal: animate?.queueOrdinal ?? null,
      namedDialogOperatorSupplied: isPaired,
      dialogOperator: selectedAuthoringAttempt?.dialogOperator ?? null,
      animateGuiExecutionEstablished: isPaired,
      authoringAuditEstablished: isPaired,
      authoringAuditIsOriginalRuntimeEvidence: false,
      selectedPassingAudit: isPaired ? {
        evidenceId: authoringResult.selectedPassingAudit.evidenceId,
        runId: authoringResult.selectedPassingAudit.runId,
        receipt: authoringResult.selectedPassingAudit.receipt,
        workEvidence: authoringResult.selectedPassingAudit.workEvidence,
        artifacts: authoringResult.selectedPassingAudit.artifacts,
        animateVersion: authoringResult.selectedPassingAudit.animateVersion,
        nativeMovie: authoringResult.selectedPassingAudit.nativeMovie,
        acceptanceEffect: false,
      } : null,
    },
    acquisitionRequirements: {
      naturalExecutionFirst: true,
      requiredLocales: ["en", "es"],
      universalEvidenceFamilies: [
        "root-natural-entry-and-playback",
        "nested-frame-domain-disposition-and-every-reachable-transition",
        "english-language-path",
        "spanish-language-path",
        "terminal-state-and-complete-replay-reset",
        "previous-next-course-and-section-navigation-in-host-context",
      ],
      sourceBoundScenarioCandidates,
      staticCandidateFamilies,
      sourceBoundScenarioCandidateCount: sourceBoundScenarioCandidates.length,
      staticCandidateFamilyCount: staticCandidateFamilies.length,
      randomCandidate,
      randomOutcomeRequirement: randomCandidate
        ? "enumerate every naturally observed source-proven outcome; bind reproducible seed only after call order and runtime semantics are established"
        : "no static random call candidate; natural execution must still confirm the absence of reachable random behavior",
      audio: {
        required: embeddedAudioTagCount > 0 || externalAudioAssociationCount > 0,
        embeddedAudioTagCount,
        externalAudioAssociationCount,
        cueMappingEstablished: false,
        runtimeSynchronizationEstablished: false,
        englishListeningAccepted: false,
        spanishListeningAccepted: false,
      },
      navigationAndReplay: {
        required: true,
        sourceContractKind: machine.releaseRole === "course-shell"
          ? "shell-navigation-expectations"
          : "active-page-previous-next-replay-contract",
        productRoutes: product.routes,
        originalRuntimeVerified: false,
        completeReplayResetVerified: false,
      },
    },
    captureIdentityContract: {
      requiredFields: [
        "frameDomain",
        "requirementId",
        "trace",
        "entryStateSha256",
        "frame",
        "scenario",
        "lang",
        "seed",
      ],
      nativeStagePngRequired: true,
      orderedEventAndStateHashChainRequired: true,
      sourceSwfSha256: machine.source.swf.sha256,
      sourceFlaSha256: machine.source.fla?.sha256 ?? null,
      runtimeVersionRequired: true,
      launchPathAndHostContextRequired: true,
    },
    directSeekPolicy: {
      authorizedNow: false,
      prerequisite: "same-source natural trace plus controller-state capture must be established first",
      roleAfterPrerequisite: "supplemental frame inspection only; never a replacement for natural execution",
    },
    forensicReferenceBoundary: {
      ruffleQueueOrdinal: ruffle.queueOrdinal,
      localDiagnosticPrepared: true,
      authoritativeOriginalRuntimeEvidence: false,
      strictRmseBaseline: false,
      languageScenarioOrSeedProof: false,
      productionImplementation: false,
    },
    runtimeEnvironmentPrerequisite: {
      installedCandidateIdentified: true,
      candidateExecutableTechnicallyBound: true,
      runtimeId: runtimeEnvironment.installedRuntimeCandidate.runtimeId,
      runtimeVersion: runtimeEnvironment.installedRuntimeCandidate.version,
      executable: {
        path: runtimeEnvironment.installedRuntimeCandidate.executable.path,
        sha256: runtimeEnvironment.installedRuntimeCandidate.executable.sha256,
        bytes: runtimeEnvironment.installedRuntimeCandidate.executable.bytes,
        architecture: runtimeEnvironment.installedRuntimeCandidate.executable.architecture,
      },
      compatibilityLayer: {
        packageId: runtimeEnvironment.compatibilityLayer.packageId,
        version: runtimeEnvironment.compatibilityLayer.version,
        status: runtimeEnvironment.compatibilityLayer.status,
        hostArchitecture: runtimeEnvironment.compatibilityLayer.hostArchitecture,
      },
      historicalStandaloneCandidate: historicalRuntimeCandidate ? {
        manifest: historicalRuntimeCandidate.manifest,
        frameCount: historicalRuntimeCandidate.frameCount,
        frameSetSha256: historicalRuntimeCandidate.frameSetSha256,
        disposition: historicalRuntimeCandidate.currentDisposition,
        currentStrictBaselineAuthority: false,
      } : null,
      runtimeApprovedByOwner: false,
      authorizedHostContextIdentified: false,
      networkContainmentPlanApproved: false,
      namedOriginalRuntimeOperatorSupplied: false,
      perItemCaptureAuthorized: false,
      originalRuntimeExecutionReady: false,
      environmentIdentityIsBaselineEvidence: false,
    },
    runtimeContainmentPrerequisite: {
      requiredForEveryRuntimeSession: true,
      staticExternalSurfaceAffectedMember: Boolean(externalSurface),
      exactExternalOperationCount: externalSurface?.exactExternalOperationCount ?? 0,
      apiCounts: externalSurface?.apiCounts ?? {},
      riskCounts: externalSurface?.riskCounts ?? {},
      controlsSpecified: runtimeContainment.containmentPlan.controlsSpecified,
      controlsApproved: runtimeContainment.containmentPlan.controlsApproved,
      controlsVerified: runtimeContainment.containmentPlan.controlsVerified,
      state: runtimeContainment.executionGate.state,
      sideEffectContainmentApproved: false,
      noEgressVerificationPassed: false,
      readOnlyLocalDependencyAllowlistBound: false,
      ephemeralRuntimeProfileBound: false,
      emptySharedObjectStoreVerified: false,
      safeToExecuteNow: false,
      staticCallsAreRuntimeReachabilityProof: false,
    },
    currentEvidenceState: {
      workOnlyAuthoringAuditEstablished: isPaired,
      namedOriginalRuntimeOperatorSupplied: false,
      authorizedOriginalRuntimeSessionEstablished: false,
      naturalExecutionProofEstablished: false,
      runtimeReachabilityEstablished: false,
      authoritativeScenarioInventoryEstablished: false,
      authoritativeTraceSpecificationEstablished: false,
      authoritativeBaselinePackageEstablished: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      implementationAuthorized: false,
      strictComplete: false,
    },
  };
}

function verifyInputs(inputs) {
  const byKey = Object.fromEntries(inputs.map((input) => [input.definition.key, input.report]));
  const machine = byKey.machineSourceAudits;
  const cards = byKey.implementationWorkCards;
  const events = byKey.staticSourceEventIndex;
  const operations = byKey.sourceOperationIndexV2;
  const product = byKey.lessonProductNavigationContract;
  const paired = byKey.pairedAuthoringSourceBindings;
  const animate = byKey.animateAuthoringOperatorQueue;
  const authoring = byKey.animateAuthoringAuditIndex;
  const ruffle = byKey.ruffleReferenceMatrix;
  const capacity = byKey.captureCapacityReadiness;
  const runtimeEnvironment = byKey.originalRuntimeEnvironmentReadiness;
  const runtimeContainment = byKey.originalRuntimeContainmentReadiness;
  const inputBindings = Object.fromEntries(inputs.map((input) => [input.definition.key, input.binding]));
  const orderedIds = ids(machine.items);

  invariant(orderedIds.length === 40 && new Set(orderedIds).size === 40,
    "Machine source audits must define exactly 40 unique canonical lesson items");
  assertExactIds(orderedIds, ids(cards.cards), "implementation work cards");
  assertExactIds(orderedIds, ids(events.items), "static source event index");
  assertExactIds(orderedIds, ids(operations.items), "source operation index v2");
  assertExactIds(orderedIds, [...ids(product.pages), product.shell.animationId], "lesson product contract");
  assertExactIds(orderedIds, ids(ruffle.queue), "Ruffle reference matrix");

  invariant(machine.summary.activePages === 39 && machine.summary.courseShells === 1,
    "G4 L3 scope must remain 39 active pages plus one course shell");
  invariant(machine.summary.flaBacked === 29 && machine.summary.swfOnly === 11,
    "G4 L3 paired/SWF-only split drifted");
  invariant(paired.summary.verifiedBindings === 29
    && paired.summary.authoringAuditsCompleted === 29
    && paired.summary.animateGuiExecutionsRecordedByThesePreparedTrees >= 29
    && paired.summary.implementationAuthorizations === 0
    && paired.summary.strictComplete === 0
    && paired.acceptance.authoringEvidenceReady === true
    && paired.acceptance.authoritativeRuntimeReady === false
    && paired.acceptance.implementationAuthorized === false
    && paired.acceptance.strictMigrationComplete === false
    && animate.summary.totalItems === 29,
  "G4 L3 paired authoring evidence is incomplete or crossed its work-only authority boundary");
  assertExactIds(ids(paired.items), ids(authoring.items), "Animate authoring audit result index");
  invariant(authoring.summary.verifiedWorkOnlyAuthoringAudits === 29
    && authoring.summary.pendingAuthoringAudits === 0
    && authoring.summary.authoringCoverageComplete === true
    && authoring.summary.originalRuntimeBaselinesEstablished === 0
    && authoring.summary.humanVisualReviewsEstablished === 0
    && authoring.summary.ownerAcceptancesEstablished === 0
    && authoring.summary.strictAcceptancesEstablished === 0
    && authoring.summary.strictAcceptanceEffect === false,
  "G4 L3 work-only authoring coverage is incomplete or promoted");
  invariant(animate.processGate.state === "closed-awaiting-named-human-operator"
    && animate.processGate.animateRunning === false
    && animate.processGate.humanAssistedRunAllowedNow === false,
  "Animate operator gate is not safely closed");
  invariant(ruffle.summary.authoritativeOriginalRuntimeBaselines === 0
    && ruffle.summary.strictRmseBaselines === 0
    && ruffle.summary.productionRuffleImplementations === 0,
  "Ruffle matrix crossed its forensic-only authority boundary");
  invariant(capacity.capacityModel.admissionIsFidelityEvidence === false,
    "Capacity report was promoted to fidelity evidence");
  invariant(capacity.capacityModel.scenarios.low.incrementalBytes > 0
    && capacity.capacityModel.operationalReserveBytes > 0,
  "Capacity report is missing its low projection or operational reserve");
  invariant(runtimeEnvironment.scope.canonicalItems === 40
    && runtimeEnvironment.scope.activePages === 39
    && runtimeEnvironment.scope.courseShells === 1
    && runtimeEnvironment.summary.installedRuntimeCandidates === 1
    && runtimeEnvironment.summary.historicalStandaloneCandidates === 1
    && runtimeEnvironment.summary.historicalStandaloneFramesReverified === 10
    && runtimeEnvironment.summary.authorizedRuntimeContexts === 0
    && runtimeEnvironment.summary.namedOriginalRuntimeOperators === 0
    && runtimeEnvironment.summary.runtimeSessionsExecuted === 0
    && runtimeEnvironment.summary.authoritativeBaselinePackagesEstablished === 0,
  "Original-runtime environment candidate scope or disposition drifted");
  invariant(runtimeEnvironment.executionGate.state === "installed-candidate-identified-execution-not-authorized"
    && runtimeEnvironment.executionGate.installedRuntimeCandidateIdentified === true
    && runtimeEnvironment.executionGate.candidateExecutableTechnicallyBound === true
    && runtimeEnvironment.executionGate.runtimeApprovedByOwner === false
    && runtimeEnvironment.executionGate.authorizedHostContextIdentified === false
    && runtimeEnvironment.executionGate.networkContainmentPlanApproved === false
    && runtimeEnvironment.executionGate.originalRuntimeExecutionReady === false,
  "Original-runtime environment candidate was not safely bound or was promoted");
  invariant(runtimeEnvironment.sourceBindings.machineSourceAudits.sha256
      === inputBindings.machineSourceAudits.sha256
    && runtimeEnvironment.sourceBindings.captureCapacityReadiness.sha256
      === inputBindings.captureCapacityReadiness.sha256,
  "Original-runtime environment source bindings do not match this contract's direct inputs");
  invariant(runtimeContainment.scope.canonicalItems === 40
    && runtimeContainment.summary.affectedMembers === 3
    && runtimeContainment.summary.exactExternalOperations === 23
    && runtimeContainment.summary.networkCapableOrScriptNavigationOperations === 17
    && runtimeContainment.summary.hostControlOperations === 5
    && runtimeContainment.summary.localPersistentStateOperations === 1
    && runtimeContainment.summary.containmentControlsSpecified === 8
    && runtimeContainment.summary.containmentControlsApproved === 0
    && runtimeContainment.summary.runtimeSessionsExecuted === 0
    && runtimeContainment.executionGate.state === "closed-awaiting-approved-side-effect-containment"
    && runtimeContainment.executionGate.originalRuntimeExecutionReady === false,
  "Original-runtime side-effect containment scope drifted or was promoted");
  invariant(runtimeContainment.sourceBindings.sourceOperationIndexV2.sha256
      === inputBindings.sourceOperationIndexV2.sha256
    && runtimeContainment.sourceBindings.originalRuntimeEnvironmentReadiness.sha256
      === inputBindings.originalRuntimeEnvironmentReadiness.sha256,
  "Original-runtime containment source bindings do not match this contract's direct inputs");

  return byKey;
}

export async function buildAuthoritativeRuntimeAcquisitionContract() {
  const inputs = [];
  for (const definition of REQUIRED_INPUTS) inputs.push(await readBoundInput(definition));
  const byKey = verifyInputs(inputs);
  const machineItems = byKey.machineSourceAudits.items;
  const cardIndex = indexByAnimationId(byKey.implementationWorkCards.cards, "implementation work cards");
  const eventIndex = indexByAnimationId(byKey.staticSourceEventIndex.items, "static source event index");
  const operationIndex = indexByAnimationId(byKey.sourceOperationIndexV2.items, "source operation index v2");
  const productIndex = indexByAnimationId(
    [...byKey.lessonProductNavigationContract.pages, byKey.lessonProductNavigationContract.shell],
    "lesson product contract",
  );
  const pairedIndex = indexByAnimationId(byKey.pairedAuthoringSourceBindings.items, "paired source bindings");
  const animateIndex = indexByAnimationId(byKey.animateAuthoringOperatorQueue.queue, "Animate operator queue");
  const authoringIndex = indexByAnimationId(byKey.animateAuthoringAuditIndex.items, "Animate authoring audit index");
  const ruffleIndex = indexByAnimationId(byKey.ruffleReferenceMatrix.queue, "Ruffle queue");
  const items = machineItems.map((machine) => buildItem({
    machine,
    card: cardIndex.get(machine.animationId),
    events: eventIndex.get(machine.animationId),
    operations: operationIndex.get(machine.animationId),
    product: productIndex.get(machine.animationId),
    paired: pairedIndex.get(machine.animationId),
    animate: animateIndex.get(machine.animationId),
    authoringResult: authoringIndex.get(machine.animationId),
    ruffle: ruffleIndex.get(machine.animationId),
    runtimeEnvironment: byKey.originalRuntimeEnvironmentReadiness,
    runtimeContainment: byKey.originalRuntimeContainmentReadiness,
  }));
  const capacity = byKey.captureCapacityReadiness.capacityModel;
  const runtimeEnvironment = byKey.originalRuntimeEnvironmentReadiness;
  const runtimeContainment = byKey.originalRuntimeContainmentReadiness;
  const generator = await physicalBinding(GENERATOR_PATH);
  const report = {
    schemaVersion: 1,
    reportType: REPORT_BASENAME,
    generator,
    lesson: {
      releaseId: "lesson-g04-l03-negative-numbers",
      grade: 4,
      lesson: 3,
      title: "Negative Numbers",
      canonicalItems: 40,
      activePages: 39,
      courseShells: 1,
    },
    sourceBindings: Object.fromEntries(inputs.map((input) => [input.definition.key, input.binding])),
    authorityPolicy: {
      order: [
        "original FLA library, timeline, and scripts",
        "original SWF metadata, tags, bytecode, and embedded assets",
        "authorized original runtime or Adobe Animate Test Movie capture",
        "Ruffle forensic playback",
        "screenshots, PDFs, notes, and recollection",
      ],
      originalRuntimeEvidenceRequiresNamedOperator: true,
      naturalExecutionRequiredBeforeDirectSeek: true,
      ruffleIsForensicOnly: true,
      staticSourceCandidatesAreRuntimeProof: false,
      authoringAuditIsRuntimeProof: false,
      implementationCaptureIsOriginalRuntimeProof: false,
    },
    executionGate: {
      state: "closed-runtime-candidate-identified-acquisition-not-authorized",
      animateMustRemainClosedAfterCompletedAuthoringAudits: true,
      namedAnimateDialogOperatorRecorded: true,
      installedOriginalRuntimeCandidateIdentified: true,
      candidateExecutableTechnicallyBound: true,
      runtimeCandidateApprovedByOwner: false,
      namedOriginalRuntimeOperatorSupplied: false,
      authorizedOriginalRuntimeAndHostContextIdentified: false,
      networkContainmentPlanApproved: false,
      sideEffectContainmentPlanApproved: false,
      bulkCaptureAuthorized: false,
      perItemCaptureAuthorized: false,
      reason: "All 29 work-only Animate authoring audits are recorded and Adobe Flash Player 32.0.0.414 is hash-bound as an installed technical candidate, but it has not been owner-approved for execution and no authorized host context, reviewed network containment, or named runtime operator is bound. Live storage admission must also be rechecked before any capture session.",
    },
    runtimeEnvironmentCandidate: {
      status: runtimeEnvironment.installedRuntimeCandidate.status,
      runtimeId: runtimeEnvironment.installedRuntimeCandidate.runtimeId,
      name: runtimeEnvironment.installedRuntimeCandidate.name,
      version: runtimeEnvironment.installedRuntimeCandidate.version,
      buildVersion: runtimeEnvironment.installedRuntimeCandidate.buildVersion,
      bundleIdentifier: runtimeEnvironment.installedRuntimeCandidate.bundle.bundleIdentifier,
      executable: runtimeEnvironment.installedRuntimeCandidate.executable,
      codeSignature: runtimeEnvironment.installedRuntimeCandidate.codeSignature,
      compatibilityLayer: runtimeEnvironment.compatibilityLayer,
      historicalStandaloneCandidates: runtimeEnvironment.historicalCandidates.map((candidate) => ({
        animationId: candidate.animationId,
        manifest: candidate.manifest,
        frameCount: candidate.frameCount,
        frameSetSha256: candidate.frameSetSha256,
        disposition: candidate.currentDisposition,
        currentStrictBaselineAuthority: false,
      })),
      runtimeApprovedByOwner: false,
      executionAuthorized: false,
      acceptanceEffect: "none",
    },
    runtimeContainmentBoundary: {
      state: runtimeContainment.executionGate.state,
      affectedMembers: runtimeContainment.summary.affectedMembers,
      exactExternalOperations: runtimeContainment.summary.exactExternalOperations,
      networkCapableOrScriptNavigationOperations:
        runtimeContainment.summary.networkCapableOrScriptNavigationOperations,
      hostControlOperations: runtimeContainment.summary.hostControlOperations,
      localPersistentStateOperations: runtimeContainment.summary.localPersistentStateOperations,
      controls: runtimeContainment.containmentPlan.controls.map((control) => ({
        controlId: control.controlId,
        requirement: control.requirement,
        selectedMechanism: null,
        approved: false,
        verified: false,
      })),
      controlsApproved: 0,
      controlsVerified: 0,
      originalRuntimeExecutionReady: false,
      acceptanceEffect: "none",
    },
    capacityBoundary: {
      boundSnapshotAvailableBytes: capacity.availableBytes,
      lowProjectionIncrementalBytes: capacity.scenarios.low.incrementalBytes,
      expectedProjectionIncrementalBytes: capacity.scenarios.expected.incrementalBytes,
      highProjectionIncrementalBytes: capacity.scenarios.high.incrementalBytes,
      operationalReserveBytes: capacity.operationalReserveBytes,
      boundSnapshotAdmission: capacity.admission,
      bulkLessonCaptureAdmittedByThisContract: false,
      boundedSessionRequiresLiveCapacityPreflight: true,
      capacityIsFidelityEvidence: false,
    },
    collectionProtocol: {
      order: [
        "preserve the 29 validated work-only Animate authoring audits without treating them as original-runtime or acceptance evidence",
        "obtain an explicit owner decision on the hash-bound Flash Player candidate, then bind the authorized host context, reviewed network containment, launch path, and named runtime operator",
        "select, approve, and preflight all eight side-effect containment controls, including outbound deny, read-only local dependencies, an empty disposable SharedObject profile, and a zero-egress audit",
        "record natural execution and controller state before any direct seek",
        "resolve reachable frame domains, scenarios, languages, branches, random outcomes, terminal state, navigation, and Replay",
        "capture native 800x600 one-indexed PNGs plus ordered event/state hash chains",
        "adopt only validated source-bound evidence; keep Ruffle and current-JavaScript captures in separate evidence classes",
        "perform separate bilingual listening, strict visual review, and owner acceptance",
      ],
      oneAnimateItemPerFreshProcess: true,
      oneOriginalRuntimeItemPerEvidenceSession: true,
      noBulkExecutionByBuilder: true,
      noLegacyNetworkEndpointsExecutedByBuilder: true,
    },
    summary: {
      canonicalItems: items.length,
      activePages: items.filter((item) => item.releaseRole === "active-xml-referenced-page").length,
      courseShells: items.filter((item) => item.releaseRole === "course-shell").length,
      flaBackedItems: items.filter((item) => item.source.sourceKind === "fla+swf").length,
      swfOnlyItems: items.filter((item) => item.source.sourceKind === "swf-only").length,
      verifiedWorkOnlyAnimateAuthoringAudits: items.filter((item) => item.authoringGate.authoringAuditEstablished).length,
      pendingAnimateAuthoringAudits: items.filter((item) => item.authoringGate.required
        && !item.authoringGate.authoringAuditEstablished).length,
      staticallyReachableNestedDefinitions: items.reduce(
        (sum, item) => sum + item.nativeRuntimeFacts.staticallyRootReachableNestedDefinitionCount,
        0,
      ),
      staticCandidateFamilies: items.reduce(
        (sum, item) => sum + item.acquisitionRequirements.staticCandidateFamilyCount,
        0,
      ),
      sourceBoundScenarioCandidates: items.reduce(
        (sum, item) => sum + item.acquisitionRequirements.sourceBoundScenarioCandidateCount,
        0,
      ),
      randomCandidateItems: items.filter((item) => item.acquisitionRequirements.randomCandidate).length,
      audioObligationItems: items.filter((item) => item.acquisitionRequirements.audio.required).length,
      acquisitionContractsPrepared: items.length,
      installedOriginalRuntimeCandidates: 1,
      workspacesWithInstalledCandidateBinding: items.filter((item) =>
        item.runtimeEnvironmentPrerequisite.installedCandidateIdentified).length,
      historicalStandaloneCandidatesReverified: runtimeEnvironment.historicalCandidates.length,
      historicalStandaloneFramesReverified: runtimeEnvironment.summary.historicalStandaloneFramesReverified,
      externalSideEffectAffectedMembers: runtimeContainment.summary.affectedMembers,
      exactExternalSideEffectOperations: runtimeContainment.summary.exactExternalOperations,
      runtimeContainmentControlsSpecified: runtimeContainment.summary.containmentControlsSpecified,
      runtimeContainmentControlsApproved: runtimeContainment.summary.containmentControlsApproved,
      authorizedOriginalRuntimeContexts: 0,
      namedOriginalRuntimeOperators: 0,
      acquisitionSessionsExecuted: 0,
      authoritativeBaselinePackagesEstablished: 0,
      implementationAuthorizations: 0,
      strictCompletions: 0,
    },
    items,
    acceptance: {
      acceptanceNeutral: true,
      planningContractPrepared: true,
      sourceAssetsModified: false,
      migrationWorkspacesModified: false,
      runtimeSessionsExecuted: false,
      animateAuthoringAccepted: false,
      authoritativeOriginalRuntimeAccepted: false,
      implementationAuthorized: false,
      rmseAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      lessonPublished: false,
      strictMigrationComplete: false,
      statement: "This report is a fail-closed acquisition contract. Its builder executes no Animate or original-runtime session and captures no baseline. It binds 29 completed work-only Animate authoring audits, but establishes no authoring acceptance, original-runtime proof, implementation authorization, RMSE, audio, human, owner, publication, parity, or completion acceptance.",
    },
  };
  return validateAuthoritativeRuntimeAcquisitionContract(report);
}

export function validateAuthoritativeRuntimeAcquisitionContract(report) {
  invariant(report.schemaVersion === 1 && report.reportType === REPORT_BASENAME,
    "Authoritative runtime acquisition contract identity drifted");
  invariant(report.lesson.canonicalItems === 40 && report.lesson.activePages === 39
    && report.lesson.courseShells === 1,
  "Authoritative runtime acquisition lesson scope drifted");
  invariant(Object.keys(report.sourceBindings).length === REQUIRED_INPUTS.length,
    "Authoritative runtime acquisition source bindings are incomplete");
  for (const definition of REQUIRED_INPUTS) {
    const binding = report.sourceBindings[definition.key];
    invariant(binding?.file === definition.file && binding.reportType === definition.reportType
      && binding.schemaVersion === definition.schemaVersion && /^[0-9a-f]{64}$/.test(binding.sha256)
      && binding.generator?.file === definition.generator && /^[0-9a-f]{64}$/.test(binding.generator.sha256),
    `${definition.key}: acquisition input binding drifted`);
  }
  invariant(report.summary.canonicalItems === 40 && report.summary.activePages === 39
    && report.summary.courseShells === 1 && report.summary.flaBackedItems === 29
    && report.summary.swfOnlyItems === 11
    && report.summary.verifiedWorkOnlyAnimateAuthoringAudits === 29
    && report.summary.pendingAnimateAuthoringAudits === 0
    && report.summary.staticallyReachableNestedDefinitions === 859
    && report.summary.staticCandidateFamilies === 143
    && report.summary.sourceBoundScenarioCandidates === 193
    && report.summary.randomCandidateItems === 12
    && report.summary.audioObligationItems === 40
    && report.summary.acquisitionContractsPrepared === 40
    && report.summary.installedOriginalRuntimeCandidates === 1
    && report.summary.workspacesWithInstalledCandidateBinding === 40
    && report.summary.historicalStandaloneCandidatesReverified === 1
    && report.summary.historicalStandaloneFramesReverified === 10
    && report.summary.externalSideEffectAffectedMembers === 3
    && report.summary.exactExternalSideEffectOperations === 23
    && report.summary.runtimeContainmentControlsSpecified === 8
    && report.summary.runtimeContainmentControlsApproved === 0
    && report.summary.authorizedOriginalRuntimeContexts === 0
    && report.summary.namedOriginalRuntimeOperators === 0,
  "Authoritative runtime acquisition summary drifted");
  invariant(report.executionGate.state === "closed-runtime-candidate-identified-acquisition-not-authorized"
    && report.executionGate.animateMustRemainClosedAfterCompletedAuthoringAudits === true
    && report.executionGate.namedAnimateDialogOperatorRecorded === true
    && report.executionGate.installedOriginalRuntimeCandidateIdentified === true
    && report.executionGate.candidateExecutableTechnicallyBound === true
    && report.executionGate.runtimeCandidateApprovedByOwner === false
    && report.executionGate.namedOriginalRuntimeOperatorSupplied === false
    && report.executionGate.authorizedOriginalRuntimeAndHostContextIdentified === false
    && report.executionGate.networkContainmentPlanApproved === false
    && report.executionGate.sideEffectContainmentPlanApproved === false
    && report.executionGate.bulkCaptureAuthorized === false
    && report.executionGate.perItemCaptureAuthorized === false,
  "Authoritative runtime acquisition execution gate was opened");
  invariant(report.runtimeEnvironmentCandidate.status === "installed-unapproved-original-runtime-candidate"
    && report.runtimeEnvironmentCandidate.runtimeId === "adobe-flash-player-projector"
    && report.runtimeEnvironmentCandidate.version === "32.0.0.414"
    && report.runtimeEnvironmentCandidate.bundleIdentifier === "com.macromedia.Flash Player.app"
    && report.runtimeEnvironmentCandidate.executable.sha256
      === "8f4e10c8c28698f3429a1489f9592f6ae5697fb6eb7d15c4cfe83e925b1ebc30"
    && report.runtimeEnvironmentCandidate.executable.architecture.includes("x86_64")
    && report.runtimeEnvironmentCandidate.codeSignature.teamIdentifier === "JQ525L2MZD"
    && report.runtimeEnvironmentCandidate.compatibilityLayer.status === "installed"
    && report.runtimeEnvironmentCandidate.compatibilityLayer.installationIsRuntimeAuthorization === false
    && report.runtimeEnvironmentCandidate.historicalStandaloneCandidates.length === 1
    && report.runtimeEnvironmentCandidate.historicalStandaloneCandidates[0].animationId === "course-g04-l03-in-009"
    && report.runtimeEnvironmentCandidate.historicalStandaloneCandidates[0].frameCount === 10
    && report.runtimeEnvironmentCandidate.historicalStandaloneCandidates[0].currentStrictBaselineAuthority === false
    && report.runtimeEnvironmentCandidate.runtimeApprovedByOwner === false
    && report.runtimeEnvironmentCandidate.executionAuthorized === false
    && report.runtimeEnvironmentCandidate.acceptanceEffect === "none",
  "Authoritative runtime environment candidate identity or disposition drifted");
  invariant(report.runtimeContainmentBoundary.state === "closed-awaiting-approved-side-effect-containment"
    && report.runtimeContainmentBoundary.affectedMembers === 3
    && report.runtimeContainmentBoundary.exactExternalOperations === 23
    && report.runtimeContainmentBoundary.networkCapableOrScriptNavigationOperations === 17
    && report.runtimeContainmentBoundary.hostControlOperations === 5
    && report.runtimeContainmentBoundary.localPersistentStateOperations === 1
    && report.runtimeContainmentBoundary.controls.length === 8
    && report.runtimeContainmentBoundary.controlsApproved === 0
    && report.runtimeContainmentBoundary.controlsVerified === 0
    && report.runtimeContainmentBoundary.controls.every((control) => control.selectedMechanism === null
      && control.approved === false && control.verified === false)
    && report.runtimeContainmentBoundary.originalRuntimeExecutionReady === false
    && report.runtimeContainmentBoundary.acceptanceEffect === "none",
  "Authoritative runtime containment boundary drifted or was promoted");
  invariant(report.capacityBoundary.bulkLessonCaptureAdmittedByThisContract === false
    && report.capacityBoundary.boundedSessionRequiresLiveCapacityPreflight === true
    && report.capacityBoundary.capacityIsFidelityEvidence === false,
  "Authoritative runtime acquisition capacity boundary was promoted");
  invariant(report.authorityPolicy.naturalExecutionRequiredBeforeDirectSeek === true
    && report.authorityPolicy.ruffleIsForensicOnly === true
    && report.authorityPolicy.staticSourceCandidatesAreRuntimeProof === false
    && report.authorityPolicy.authoringAuditIsRuntimeProof === false,
  "Authoritative runtime acquisition authority policy drifted");
  invariant(report.items.length === 40 && new Set(ids(report.items)).size === 40,
    "Authoritative runtime acquisition items are not exactly 40 unique members");
  for (const item of report.items) {
    invariant(item.nativeRuntimeFacts.rootFramesAreOneIndexed === true
      && item.nativeRuntimeFacts.rootTimelineMustNotBeReplacedByNestedTimeline === true
      && item.nativeRuntimeFacts.staticReachabilityIsRuntimeProof === false
      && item.nativeRuntimeFacts.frameDomainDispositionEstablished === false,
    `${item.animationId}: frame-domain contract was promoted`);
    invariant(item.captureIdentityContract.requiredFields.join("|")
      === "frameDomain|requirementId|trace|entryStateSha256|frame|scenario|lang|seed",
    `${item.animationId}: capture identity contract drifted`);
    invariant(item.directSeekPolicy.authorizedNow === false
      && item.forensicReferenceBoundary.authoritativeOriginalRuntimeEvidence === false
      && item.forensicReferenceBoundary.strictRmseBaseline === false,
    `${item.animationId}: diagnostic or direct-seek authority was promoted`);
    invariant(item.runtimeEnvironmentPrerequisite.installedCandidateIdentified === true
      && item.runtimeEnvironmentPrerequisite.candidateExecutableTechnicallyBound === true
      && item.runtimeEnvironmentPrerequisite.runtimeId === "adobe-flash-player-projector"
      && item.runtimeEnvironmentPrerequisite.runtimeVersion === "32.0.0.414"
      && item.runtimeEnvironmentPrerequisite.executable.sha256
        === report.runtimeEnvironmentCandidate.executable.sha256
      && item.runtimeEnvironmentPrerequisite.runtimeApprovedByOwner === false
      && item.runtimeEnvironmentPrerequisite.authorizedHostContextIdentified === false
      && item.runtimeEnvironmentPrerequisite.networkContainmentPlanApproved === false
      && item.runtimeEnvironmentPrerequisite.namedOriginalRuntimeOperatorSupplied === false
      && item.runtimeEnvironmentPrerequisite.perItemCaptureAuthorized === false
      && item.runtimeEnvironmentPrerequisite.originalRuntimeExecutionReady === false
      && item.runtimeEnvironmentPrerequisite.environmentIdentityIsBaselineEvidence === false,
    `${item.animationId}: runtime environment prerequisite drifted or was promoted`);
    invariant(item.runtimeContainmentPrerequisite.requiredForEveryRuntimeSession === true
      && Number.isInteger(item.runtimeContainmentPrerequisite.exactExternalOperationCount)
      && item.runtimeContainmentPrerequisite.exactExternalOperationCount >= 0
      && item.runtimeContainmentPrerequisite.controlsSpecified === 8
      && item.runtimeContainmentPrerequisite.controlsApproved === 0
      && item.runtimeContainmentPrerequisite.controlsVerified === 0
      && item.runtimeContainmentPrerequisite.state === "closed-awaiting-approved-side-effect-containment"
      && item.runtimeContainmentPrerequisite.sideEffectContainmentApproved === false
      && item.runtimeContainmentPrerequisite.noEgressVerificationPassed === false
      && item.runtimeContainmentPrerequisite.readOnlyLocalDependencyAllowlistBound === false
      && item.runtimeContainmentPrerequisite.ephemeralRuntimeProfileBound === false
      && item.runtimeContainmentPrerequisite.emptySharedObjectStoreVerified === false
      && item.runtimeContainmentPrerequisite.safeToExecuteNow === false
      && item.runtimeContainmentPrerequisite.staticCallsAreRuntimeReachabilityProof === false,
    `${item.animationId}: runtime containment prerequisite drifted or was promoted`);
    invariant(item.authoringGate.authoringAuditEstablished === item.authoringGate.required
      && item.currentEvidenceState.workOnlyAuthoringAuditEstablished === item.authoringGate.required,
    `${item.animationId}: work-only authoring evidence state drifted`);
    invariant(Object.entries(item.currentEvidenceState)
      .filter(([key]) => key !== "workOnlyAuthoringAuditEstablished")
      .every(([, value]) => value === false),
    `${item.animationId}: runtime or acceptance evidence state unexpectedly opened`);
  }
  invariant(report.summary.acquisitionSessionsExecuted === 0
    && report.summary.authoritativeBaselinePackagesEstablished === 0
    && report.summary.implementationAuthorizations === 0
    && report.summary.strictCompletions === 0,
  "Authoritative runtime acquisition results were unexpectedly promoted");
  const historicalItemCandidates = report.items.filter((item) =>
    item.runtimeEnvironmentPrerequisite.historicalStandaloneCandidate !== null);
  invariant(historicalItemCandidates.length === 1
    && historicalItemCandidates[0].animationId === "course-g04-l03-in-009"
    && historicalItemCandidates[0].runtimeEnvironmentPrerequisite.historicalStandaloneCandidate.frameCount === 10
    && historicalItemCandidates[0].runtimeEnvironmentPrerequisite.historicalStandaloneCandidate
      .currentStrictBaselineAuthority === false,
  "Historical standalone candidate workspace disposition drifted");
  const sideEffectItems = report.items.filter((item) =>
    item.runtimeContainmentPrerequisite.staticExternalSurfaceAffectedMember);
  invariant(sideEffectItems.map((item) => item.animationId).join("|")
      === "course-g04-l03-fq-002|course-g04-l03-fq-003|shell-course-g04-l03-index-local"
    && sideEffectItems.reduce((sum, item) =>
      sum + item.runtimeContainmentPrerequisite.exactExternalOperationCount, 0) === 23,
  "Runtime containment affected-member projection drifted");
  invariant(report.acceptance.acceptanceNeutral === true
    && report.acceptance.planningContractPrepared === true
    && report.acceptance.sourceAssetsModified === false
    && report.acceptance.migrationWorkspacesModified === false
    && report.acceptance.runtimeSessionsExecuted === false
    && report.acceptance.animateAuthoringAccepted === false
    && report.acceptance.authoritativeOriginalRuntimeAccepted === false
    && report.acceptance.implementationAuthorized === false
    && report.acceptance.rmseAccepted === false
    && report.acceptance.audioAccepted === false
    && report.acceptance.humanVisualAccepted === false
    && report.acceptance.ownerAccepted === false
    && report.acceptance.lessonPublished === false
    && report.acceptance.strictMigrationComplete === false,
  "Authoritative runtime acquisition acceptance state drifted");
  return report;
}

export function renderMarkdown(report) {
  validateAuthoritativeRuntimeAcquisitionContract(report);
  const rows = report.items.map((item) => {
    const authoring = item.authoringGate.required ? "verified work-only" : "n/a (SWF-only)";
    const audio = `${item.acquisitionRequirements.audio.embeddedAudioTagCount}/${item.acquisitionRequirements.audio.externalAudioAssociationCount}`;
    return `| ${item.sequence} | \`${item.animationId}\` | ${item.source.sourceKind} | ${authoring} | ${item.nativeRuntimeFacts.staticallyRootReachableNestedDefinitionCount} | ${item.acquisitionRequirements.staticCandidateFamilyCount}/${item.acquisitionRequirements.sourceBoundScenarioCandidateCount} | ${item.acquisitionRequirements.randomCandidate ? "yes" : "no"} | ${audio} | closed |`;
  }).join("\n");
  const bindings = Object.entries(report.sourceBindings).map(([key, binding]) =>
    `| ${key} | \`${binding.file}\` | \`${binding.sha256}\` |`,
  ).join("\n");
  return `# G4 L3 Authoritative Runtime Acquisition Contract\n\n`
    + `This fail-closed contract prepares the complete **40-member lesson evidence queue (39 active pages + 1 course shell)**. Its builder does not run Adobe Animate, an original runtime, Ruffle, or a browser capture; it binds prior work-only authoring audit evidence.\n\n`
    + `## Gate state\n\n`
    + `- Execution: **closed for original-runtime acquisition**. No named original-runtime operator or authorized original-runtime host context is bound.\n`
    + `- Authoring: **29/29 paired FLA/SWF audits are verified as work-only evidence**; the 11 SWF-only members have no FLA authoring gate.\n`
    + `- Installed runtime candidate: **${report.runtimeEnvironmentCandidate.name} ${report.runtimeEnvironmentCandidate.version}** is executable-hash and signature bound, with Rosetta installed. It is not owner-approved or authorized for execution.\n`
    + `- Side-effect containment: **${report.runtimeContainmentBoundary.exactExternalOperations} exact static operations across ${report.runtimeContainmentBoundary.affectedMembers} members**; **${report.runtimeContainmentBoundary.controls.length} controls specified / 0 approved**.\n`
    + `- Runtime: **0/40 authoritative baseline packages**, **0** authoritative scenario inventories, and **0** authoritative trace specifications.\n`
    + `- Candidate workload: **${report.summary.staticallyReachableNestedDefinitions}** statically reachable nested definitions, **${report.summary.staticCandidateFamilies}** static candidate families, and **${report.summary.sourceBoundScenarioCandidates}** source-bound scenario candidates. None proves runtime reachability.\n`
    + `- Special coverage: **${report.summary.randomCandidateItems}** random-candidate members and **${report.summary.audioObligationItems}** members with embedded or associated audio obligations.\n`
    + `- Capacity: the bound snapshot says \`${report.capacityBoundary.boundSnapshotAdmission}\`; this contract still authorizes neither bulk nor per-item capture and requires a fresh live-capacity preflight before any bounded session.\n\n`
    + `## Mandatory acquisition order\n\n`
    + report.collectionProtocol.order.map((step, index) => `${index + 1}. ${step}`).join("\n")
    + `\n\nDirect seek is supplemental only after a natural same-source trace and controller-state capture. Ruffle remains forensic-only and cannot become the authoritative original-runtime or strict-RMSE baseline.\n\n`
    + `## Per-member queue\n\n`
    + `Audio is shown as embedded-tag count / external-associated-file count. Candidates are static families / source-bound scenario candidates.\n\n`
    + `| Seq | Animation | Source | Animate authoring | Reachable nested defs | Candidates | Random | Audio | Execution |\n`
    + `| ---: | --- | --- | --- | ---: | ---: | --- | ---: | --- |\n${rows}\n\n`
    + `Every member requires native 800x600, one-indexed evidence identities bound to \`frameDomain\`, \`requirementId\`, \`trace\`, \`entryStateSha256\`, \`frame\`, \`scenario\`, \`lang\`, and \`seed\`, plus runtime version, launch path, host context, source hashes, and ordered event/state hash chains.\n\n`
    + `## Bound inputs\n\n| Key | Report | SHA-256 |\n| --- | --- | --- |\n${bindings}\n\n`
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
  const report = await buildAuthoritativeRuntimeAcquisitionContract();
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
