import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildReport,
  deriveMemberReadiness,
  parseArguments,
  renderMarkdown,
  stableJson,
} from "./build-g5-l4-specification-readiness.mjs";

const DIGEST = "a".repeat(64);

function memberFixture() {
  return {
    ordinal: 1,
    animationId: "page-1",
    assetId: `swf-${DIGEST}`,
    releaseRole: "active-xml-referenced-page",
    shardId: "shard-1",
    source: {
      path: "HELP_COURSES/ELMGR5/L4/IR/page-1.swf",
      sha256: DIGEST,
    },
  };
}

function migrationFixture() {
  return {
    schemaVersion: 2,
    id: "page-1",
    animationId: "page-1",
    assetId: `swf-${DIGEST}`,
    status: "preserved",
    source: {
      swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IR/page-1.swf",
      swfSha256: DIGEST,
    },
    runtime: {
      stage: {width: 800, height: 600},
      fps: 12,
      frameCount: 10,
      durationMs: 833.333333,
      actionScriptVersion: "unknown",
      backgroundColor: "",
      complexity: "unknown",
      scripts: [],
      externalDependencies: [],
    },
    audit: {
      assetsRequired: false,
      assetsNotRequiredReason: "",
    },
    scenarios: [{id: "default", description: "", reachable: true}],
    implementation: {rendering: "undecided", route: ""},
    toolVersions: {ffdec: "unavailable", swfmill: "unavailable"},
  };
}

function machineAuditFixture({pairedFla = true, externalCalls = true} = {}) {
  return {
    schemaVersion: 1,
    animationId: "page-1",
    auditStatus: "partial",
    migrationStatusUnchanged: true,
    source: {expectedSha256: DIGEST, hashMatches: true},
    authoringSource: {
      pairedFlaStatus: pairedFla ? "present" : "missing",
    },
    findings: {
      actionScriptVersion: "AS1/2",
      backgroundColor: "#ffffff",
      exportedScriptFileCount: 4,
      externalCallCandidates: externalCalls
        ? [{api: "getURL", occurrences: 2}]
        : [],
      runtimeCrossCheck: {allMatch: true},
      swfmill: {
        tagCounts: {
          DefineShape2: 3,
          DefineSprite: 2,
          DefineText: 4,
        },
      },
    },
  };
}

function frameDomainsFixture() {
  return {
    schemaVersion: 1,
    animationId: "page-1",
    source: {sha256: DIGEST},
    root: {timelineId: "root", frameCount: 10},
    summary: {
      nestedDefinitionCount: 2,
      nestedLongerThanRootCount: 1,
      unresolvedReachabilityCount: 2,
      completeRootReachableDomainInventory: false,
    },
    acceptanceEffects: {
      authoritativeOriginalRuntime: false,
      completeFrameDomainDisposition: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
  };
}

function runtimePlanFixture() {
  return {
    schemaVersion: 2,
    identity: {
      releaseId: "lesson-g05-l04-number-lines",
      ordinal: 1,
      animationId: "page-1",
      assetId: `swf-${DIGEST}`,
    },
    executionGate: {runnable: false},
    emptyRuntimeAcquisitionWorksheet: {
      state: "empty-non-runnable-planning-only",
      runtimeReceipts: [],
    },
    coverageV2Planning: {
      authoritativeBaselineCount: 0,
      candidateCaptureCount: 0,
    },
    acceptanceEffects: {
      currentJavaScriptCandidate: false,
      strictComplete: false,
      published: false,
    },
  };
}

function sourceBindingFixture() {
  return {
    schemaVersion: 1,
    releaseId: "lesson-g05-l04-number-lines",
    member: {
      ordinal: 1,
      animationId: "page-1",
      assetId: `swf-${DIGEST}`,
      source: {swf: {sha256: DIGEST}},
    },
    acceptanceEffects: {
      currentJavaScriptCandidate: false,
      strictComplete: false,
      published: false,
    },
  };
}

function audioEvidenceFixture() {
  return {
    present: true,
    path: "migrations/page-1/audit/audio-runtime-evidence.json",
    bytes: 100,
    sha256: DIGEST,
    document: {
      schemaVersion: 2,
      animationId: "page-1",
      source: {expectedSha256: DIGEST, hashMatches: true},
      acceptance: {
        structurallyAudited: true,
        authoritativeListeningComplete: false,
        strictAudioAcceptance: "pending",
        releaseBoundary: {
          authoritativeOriginalRuntimeListeningComplete: false,
          strictMigrationComplete: false,
          publicationAuthorized: false,
        },
      },
    },
  };
}

function coverageFixture() {
  const requirement = (language) => ({
    requirementId: `req-default-root-${language}`,
    frameDomainId: "root",
    language,
    requiredRange: {firstFrame: 1, lastFrame: 10},
    baselineAuthority: "unresolved",
    status: "pending",
    capturedFrameCount: 0,
    missingFrames: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  });
  return {
    schemaVersion: 2,
    animationId: "page-1",
    requirements: [requirement("en"), requirement("es")],
  };
}

function optionalSpecificationFiles() {
  return {
    frameDomainDisposition: {
      present: false,
      path: "migrations/page-1/audit/frame-domain-disposition.json",
    },
    scenarioInventory: {
      present: false,
      path: "migrations/page-1/audit/scenario-inventory.json",
    },
    scriptInventory: {
      present: false,
      path: "migrations/page-1/audit/script-inventory.json",
    },
    dependencyInventory: {
      present: false,
      path: "migrations/page-1/audit/dependency-inventory.json",
    },
    strictReadiness: {
      present: false,
      path: "migrations/page-1/audit/strict-readiness.json",
    },
  };
}

function briefTemplate() {
  return [
    "Describe the instructional purpose, target users, required languages, interactions, and exact stakeholder request.",
    "Selected renderer: React + SVG / Canvas + CreateJS / Canvas + PixiJS / other",
    "Summarize object phases, one-indexed frame windows, transforms, alpha, depth, text/count changes, audio cues, and interaction transitions.",
  ].join("\n");
}

function candidatePackageFixture() {
  const artifact = (name) => ({
    path: `migrations/page-1/audit/machine/${name}`,
    bytes: 100,
    sha256: DIGEST,
  });
  return {
    materialized: true,
    fileCount: 7,
    definitionCount: 9,
    scriptCount: 4,
    dependencyApiCandidateCount: 1,
    dependencyOccurrenceCount: 2,
    artifacts: {
      candidateRuntimeFacts: artifact(
        "g5-l4-pre-runtime-manifest-runtime-facts-candidate.json",
      ),
      candidateAssetCensus: artifact(
        "g5-l4-pre-runtime-swf-asset-definition-census.json",
      ),
      candidateDefinitionInventory: artifact(
        "g5-l4-pre-runtime-swf-definition-inventory.csv",
      ),
      candidateScriptInventory: artifact(
        "g5-l4-pre-runtime-ffdec-script-inventory-candidate.json",
      ),
      candidateDependencyInventory: artifact(
        "g5-l4-pre-runtime-static-dependency-inventory-candidate.json",
      ),
      candidateBrief: artifact(
        "g5-l4-pre-runtime-migration-brief-static-prefill-candidate.md",
      ),
      candidateReceipt: artifact(
        "g5-l4-pre-runtime-specification-candidate-receipt.json",
      ),
    },
  };
}

function deriveFixture(options = {}) {
  const {
    audioEvidence = audioEvidenceFixture(),
    ...machineOptions
  } = options;
  return deriveMemberReadiness({
    member: memberFixture(),
    migration: migrationFixture(),
    assetRows: [],
    audioRows: [["cue"]],
    keyframeRows: [],
    coverage: coverageFixture(),
    migrationBrief: briefTemplate(),
    machineAudit: machineAuditFixture(machineOptions),
    frameDomains: frameDomainsFixture(),
    runtimePlan: runtimePlanFixture(),
    sourceScopeBinding: sourceBindingFixture(),
    audioRuntimeEvidence: audioEvidence,
    optionalSpecificationFiles: optionalSpecificationFiles(),
    candidatePackage: candidatePackageFixture(),
  });
}

function sourceStaticDeriveFixture() {
  const animationId = "course-g05-l04-vb-002";
  const member = memberFixture();
  member.animationId = animationId;
  member.source.path = "HELP_COURSES/ELMGR5/L4/VB/VB002.swf";

  const migration = migrationFixture();
  migration.id = animationId;
  migration.animationId = animationId;
  migration.source.swf =
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/VB002.swf";
  migration.runtime.actionScriptVersion = "AS1/2";
  migration.runtime.backgroundColor = "#ffffff";
  migration.scenarios = [
    {
      id: "root-unavailable",
      description:
        "Diagnostic root identity; authoritative runtime behavior unresolved.",
      reachable: true,
    },
    {
      id: "source-static-frame",
      description:
        "Diagnostic nested source-static identity; reachability unresolved.",
      reachable: true,
    },
  ];
  migration.implementation = {
    rendering:
      "source-static Canvas engineering candidate; all fidelity gates fail closed",
    route: `/animations/${animationId}`,
    defaultFrameDomainId: "sprite-49",
    frameDomains: [
      {
        id: "root",
        kind: "root",
        frameCount: 10,
      },
      {
        id: "sprite-49",
        kind: "nested",
        sourceInstanceId: "animation",
        parentFrameDomainId: "root",
        frameCount: 186,
      },
    ],
    capturePlanning: {
      authoritativeRuntimeFrameDomainDispositionEstablished: false,
      runtimeReachabilityEstablished: false,
      strictAcceptanceEffect: "none",
    },
    candidateState: {
      status: "current-javascript-engineering-candidate-only",
      sourceStaticFrameDomain: "sprite-49",
      sourceStaticFrames: {firstFrame: 1, lastFrame: 186},
      renderedFrameCount: 186,
      rootEnabled: false,
      spanishEnabled: false,
      audioEnabled: false,
      sourceControlsEnabled: false,
      replayParityEstablished: false,
      originalRuntimeBaselineUsed: false,
      rmseComputed: false,
      humanVisualReviewPerformed: false,
      ownerReviewPerformed: false,
      strictAcceptanceEffect: "none",
    },
  };
  migration.evidence = {
    currentJavascriptCandidateAuthority:
      "non-authoritative-current-javascript-source-static-output",
    currentJavascriptCandidateStrictAcceptanceEffect: "none",
  };
  migration.toolVersions = {ffdec: "26.2.1", swfmill: "0.3.6"};

  const machineAudit = machineAuditFixture();
  machineAudit.animationId = animationId;
  const frameDomains = frameDomainsFixture();
  frameDomains.animationId = animationId;
  const runtimePlan = runtimePlanFixture();
  runtimePlan.identity.animationId = animationId;
  const sourceScopeBinding = sourceBindingFixture();
  sourceScopeBinding.member.animationId = animationId;
  const audioRuntimeEvidence = audioEvidenceFixture();
  audioRuntimeEvidence.path =
    `migrations/${animationId}/audit/audio-runtime-evidence.json`;
  audioRuntimeEvidence.document.animationId = animationId;

  const pendingRequirement = (frameDomainId, frameCount, language) => ({
    requirementId:
      `req:${frameDomainId}:lesson-shell-natural-entry:${language}`,
    scenario:
      frameDomainId === "root" ? "root-unavailable" : "source-static-frame",
    frameDomainId,
    language,
    requiredRange: {firstFrame: 1, lastFrame: frameCount},
    baselineAuthority: "unresolved",
    status: "pending",
    capturedFrameCount: 0,
    missingFrames: Array.from({length: frameCount}, (_, index) => index + 1),
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
  });
  const coverage = {
    schemaVersion: 2,
    animationId,
    planningState:
      "valid-root-and-conservative-nested-requirements-pending-authoritative-runtime",
    requirements: [
      pendingRequirement("root", 10, "en"),
      pendingRequirement("root", 10, "es"),
      pendingRequirement("sprite-49", 186, "en"),
      pendingRequirement("sprite-49", 186, "es"),
    ],
  };
  const candidates = candidatePackageFixture();
  candidates.historicalPostAdoption = true;
  candidates.historicalManifestSuccessor = true;
  candidates.sourceStaticEngineeringCandidate = true;

  return {
    inputs: {
      member,
      migration,
      assetRows: [],
      audioRows: [["cue"]],
      keyframeRows: [],
      coverage,
      migrationBrief: briefTemplate(),
      machineAudit,
      frameDomains,
      runtimePlan,
      sourceScopeBinding,
      audioRuntimeEvidence,
      optionalSpecificationFiles: optionalSpecificationFiles(),
      candidatePackage: candidates,
    },
  };
}

test("member classification separates candidate automation from runtime and human decisions", () => {
  const item = deriveFixture();
  assert.equal(item.implementationSpecificationReady, false);
  assert.equal(item.implementationAuthorizedByThisReport, false);
  assert.equal(item.specificationAreas.assetInventory.rowCount, 0);
  assert.equal(
    item.specificationAreas.assetInventory.machineAssetDefinitionCandidateCount,
    9,
  );
  assert.equal(item.specificationAreas.keyframes.rowCount, 0);
  assert.equal(item.specificationAreas.audioInventory.structurallyAudited, true);
  assert.equal(item.specificationAreas.fullFrameCoverage.missingFrameCount, 20);
  assert.equal(item.specificationAreas.frameDomains.unresolvedReachabilityCount, 2);
  assert.equal(item.specificationAreas.scriptsAndDependencies.exportedScriptFileCount, 4);
  assert.deepEqual(
    item.specificationAreas.scriptsAndDependencies.externalCallCandidates,
    [{api: "getURL", occurrences: 2}],
  );
  assert.ok(
    item.routing.automaticallyAdvanceableTasks.includes(
      "machine-materialize-script-candidates",
    ),
  );
  assert.equal(item.routing.safeMachineCandidateWorkAvailable, true);
  assert.equal(item.routing.safeMachineCandidateWorkMaterialized, true);
  assert.deepEqual(item.routing.remainingAutomaticallyAdvanceableTasks, [
    "machine-reconcile-static-canonical-specification",
    "machine-build-static-strict-readiness",
    "machine-build-scenario-inventory",
    "machine-build-frame-domain-disposition",
  ]);
  assert.ok(
    item.routing.requiresOriginalRuntimeOrHumanTasks.includes(
      "original-runtime-reachable-scenarios-and-natural-traces",
    ),
  );
  assert.ok(
    item.routing.requiresOriginalRuntimeOrHumanTasks.includes(
      "human-external-call-security-disposition",
    ),
  );
  assert.ok(Object.values(item.acceptanceEffects).every((value) => value === false));

  const withoutAudioEvidence = deriveFixture({
    audioEvidence: {
      present: false,
      path: "migrations/page-1/audit/audio-runtime-evidence.json",
    },
  });
  assert.equal(
    withoutAudioEvidence.specificationAreas.audioInventory.structurallyAudited,
    false,
  );
  assert.equal(
    withoutAudioEvidence.specificationAreas.audioInventory.specificationReady,
    false,
  );
});

test("source-static successors are counted as engineering candidates without promoting fidelity gates", () => {
  const fixture = sourceStaticDeriveFixture();
  const item = deriveMemberReadiness(fixture.inputs);
  assert.equal(item.implementationState.started, true);
  assert.equal(item.implementationState.state, "source-static-engineering-candidate");
  assert.equal(item.implementationState.currentJavaScriptOutputPresent, true);
  assert.equal(
    item.implementationState.authoritativeRuntimeReachabilityEstablished,
    false,
  );
  assert.equal(item.implementationState.spanishEnabled, false);
  assert.equal(item.implementationState.audioEnabled, false);
  assert.equal(item.implementationState.rmseComputed, false);
  assert.equal(item.implementationState.humanVisualReviewPerformed, false);
  assert.equal(item.implementationState.ownerReviewPerformed, false);
  assert.equal(item.specificationAreas.fullFrameCoverage.requirementCount, 4);
  assert.equal(item.specificationAreas.fullFrameCoverage.rootOnlyRequirementCount, 2);
  assert.equal(item.specificationAreas.fullFrameCoverage.nestedRequirementCount, 2);
  assert.equal(item.specificationAreas.fullFrameCoverage.requiredFrameCount, 392);
  assert.equal(item.specificationAreas.fullFrameCoverage.missingFrameCount, 392);
  assert.equal(
    item.specificationAreas.frameDomains.sourceStaticDeclaredFrameDomainId,
    "sprite-49",
  );
  assert.equal(item.implementationSpecificationReady, false);
  assert.ok(Object.values(item.acceptanceEffects).every((value) => value === false));

  fixture.inputs.migration.implementation.candidateState.spanishEnabled = true;
  assert.throws(
    () => deriveMemberReadiness(fixture.inputs),
    /engineering-candidate manifest drifted or crossed an authority boundary/,
  );
});

test("paired FLA and shipped-SWF-only members receive distinct human routing", () => {
  const paired = deriveFixture({pairedFla: true, externalCalls: false});
  assert.ok(
    paired.routing.requiresOriginalRuntimeOrHumanTasks.includes(
      "human-read-only-authoring-audit",
    ),
  );
  assert.ok(
    !paired.routing.requiresOriginalRuntimeOrHumanTasks.includes(
      "human-swf-only-source-gap-disposition",
    ),
  );
  assert.ok(
    !paired.routing.requiresOriginalRuntimeOrHumanTasks.includes(
      "human-external-call-security-disposition",
    ),
  );

  const swfOnly = deriveFixture({pairedFla: false, externalCalls: false});
  assert.equal(swfOnly.sourceModel, "shipped-swf-only");
  assert.ok(
    swfOnly.routing.requiresOriginalRuntimeOrHumanTasks.includes(
      "human-swf-only-source-gap-disposition",
    ),
  );
});

test("runtime receipts or promoted frame-domain evidence are rejected", () => {
  const runtimePlan = runtimePlanFixture();
  runtimePlan.emptyRuntimeAcquisitionWorksheet.runtimeReceipts.push({id: "receipt"});
  assert.throws(
    () => deriveMemberReadiness({
      member: memberFixture(),
      migration: migrationFixture(),
      assetRows: [],
      audioRows: [],
      keyframeRows: [],
      coverage: coverageFixture(),
      migrationBrief: briefTemplate(),
      machineAudit: machineAuditFixture(),
      frameDomains: frameDomainsFixture(),
      runtimePlan,
      sourceScopeBinding: sourceBindingFixture(),
      audioRuntimeEvidence: audioEvidenceFixture(),
      optionalSpecificationFiles: optionalSpecificationFiles(),
      candidatePackage: candidatePackageFixture(),
    }),
    /runtime plan drifted or contains runtime\/acceptance evidence/,
  );

  const domains = frameDomainsFixture();
  domains.summary.completeRootReachableDomainInventory = true;
  assert.throws(
    () => deriveMemberReadiness({
      member: memberFixture(),
      migration: migrationFixture(),
      assetRows: [],
      audioRows: [],
      keyframeRows: [],
      coverage: coverageFixture(),
      migrationBrief: briefTemplate(),
      machineAudit: machineAuditFixture(),
      frameDomains: domains,
      runtimePlan: runtimePlanFixture(),
      sourceScopeBinding: sourceBindingFixture(),
      audioRuntimeEvidence: audioEvidenceFixture(),
      optionalSpecificationFiles: optionalSpecificationFiles(),
      candidatePackage: candidatePackageFixture(),
    }),
    /frame-domain evidence drifted or promoted reachability/,
  );
});

test("CLI stays report-only and rejects workspace or GUI controls", () => {
  assert.deepEqual(parseArguments([]), {
    outputPrefix: "reports/g5-l4-specification-readiness",
    check: false,
    help: false,
  });
  assert.equal(parseArguments(["--check"]).check, true);
  assert.throws(
    () => parseArguments(["--output-prefix", "migrations/g5-l4"]),
    /below reports/,
  );
  assert.throws(
    () => parseArguments(["--launch-animate"]),
    /Unknown option/,
  );
  assert.throws(
    () => parseArguments(["--write-workspaces"]),
    /Unknown option/,
  );
});

test("checked-in G5 L4 report is deterministic, exact, and fail-closed", async () => {
  const report = await buildReport();
  const [json, markdown] = await Promise.all([
    readFile("reports/g5-l4-specification-readiness.json", "utf8"),
    readFile("reports/g5-l4-specification-readiness.md", "utf8"),
  ]);
  assert.equal(json, stableJson(report));
  assert.equal(markdown, renderMarkdown(report));
  assert.equal(report.summary.memberCount, 55);
  assert.equal(report.summary.pairedFlaSwfCount, 44);
  assert.equal(report.summary.swfOnlyCount, 11);
  assert.equal(report.summary.rootFrameCount, 590);
  assert.equal(report.summary.assetInventoryPopulatedCount, 55);
  assert.equal(report.summary.assetInventoryRowCount, 12066);
  assert.equal(report.summary.audioInventoryPopulatedCount, 52);
  assert.equal(report.summary.audioInventoryEmptyCount, 3);
  assert.equal(report.summary.structuralAudioInventoryRowCount, 373);
  assert.equal(report.summary.audioRuntimeEvidencePresentCount, 55);
  assert.equal(report.summary.audioStructurallyAuditedCount, 55);
  assert.equal(report.summary.audioSpecificationReadyCount, 0);
  assert.equal(report.summary.keyframeInventoryPopulatedCount, 55);
  assert.equal(report.summary.keyframeRowCount, 802);
  assert.equal(report.summary.coverageRequirementCount, 212);
  assert.equal(report.summary.coverageRootOnlyRequirementCount, 110);
  assert.equal(report.summary.coverageNestedRequirementCount, 102);
  assert.equal(report.summary.coverageRequiredFrameCount, 34508);
  assert.equal(report.summary.coverageMissingFrameCount, 34508);
  assert.equal(report.summary.migrationBriefTemplateCount, 55);
  assert.equal(report.summary.machineAuditPartialCount, 55);
  assert.equal(report.summary.nestedDefinitionCount, 1281);
  assert.equal(report.summary.unresolvedNestedReachabilityCount, 1281);
  assert.equal(report.summary.exportedScriptFileCount, 2332);
  assert.equal(report.summary.externalCallCandidateMemberCount, 3);
  assert.equal(report.summary.externalCallCandidateApiCount, 6);
  assert.equal(report.summary.externalCallCandidateOccurrenceCount, 17);
  assert.equal(report.summary.preRuntimeCandidatePackageMaterializedCount, 55);
  assert.equal(report.summary.preRuntimeCandidateFileCount, 385);
  assert.equal(report.summary.manifestRuntimeFactsCandidateCount, 55);
  assert.equal(report.summary.assetDefinitionCensusCandidateCount, 55);
  assert.equal(report.summary.definitionInventoryCandidateCount, 55);
  assert.equal(report.summary.scriptInventoryCandidateCount, 55);
  assert.equal(report.summary.dependencyInventoryCandidateCount, 55);
  assert.equal(report.summary.migrationBriefStaticPrefillCandidateCount, 55);
  assert.equal(report.summary.preRuntimeCandidateReceiptCount, 55);
  assert.equal(report.summary.manifestRuntimeFactsReconciledCount, 55);
  assert.equal(report.summary.strictReadinessPresentCount, 55);
  assert.equal(report.summary.scenarioInventoryPresentCount, 55);
  assert.equal(report.summary.frameDomainDispositionPresentCount, 55);
  assert.equal(report.summary.materializedDefinitionCandidateCount, 12066);
  assert.equal(report.summary.materializedScriptCandidateCount, 2332);
  assert.equal(report.summary.materializedDependencyApiCandidateCount, 6);
  assert.equal(report.summary.materializedDependencyOccurrenceCount, 17);
  assert.equal(report.summary.automaticallyAdvanceableTaskCount, 550);
  assert.equal(
    report.summary.materializedAutomaticallyAdvanceableTaskCount,
    550,
  );
  assert.equal(report.summary.remainingAutomaticallyAdvanceableTaskCount, 0);
  assert.equal(report.summary.implementationStartedCount, 52);
  assert.equal(report.summary.sourceStaticEngineeringCandidateCount, 52);
  assert.equal(report.summary.currentJavaScriptOutputPresentCount, 52);
  assert.equal(report.summary.manifestBoundSingleSpriteCandidateCount, 51);
  assert.equal(report.summary.fullSingleSpriteCandidateCount, 20);
  assert.equal(report.summary.safePrefixSingleSpriteCandidateCount, 31);
  assert.equal(
    report.summary.independentDualSpriteCompositeCandidateCount,
    1,
  );
  assert.equal(report.summary.canonicalNestedCoverageCandidateCount, 51);
  assert.equal(report.summary.sourceStaticOpenFrameCount, 13696);
  assert.equal(report.summary.sourceStaticBlockedTailFrameCount, 3020);
  assert.equal(
    report.summary.authoritativeRuntimeReachabilityEstablishedCount,
    0,
  );
  assert.equal(report.summary.spanishEnabledCount, 0);
  assert.equal(report.summary.sourceStaticAudioEnabledCount, 0);
  assert.equal(report.summary.rmseComputedCount, 0);
  assert.equal(report.summary.humanVisualReviewPerformedCount, 0);
  assert.equal(report.summary.ownerReviewPerformedCount, 0);
  assert.equal(report.summary.implementationSpecificationReadyCount, 0);
  assert.equal(report.summary.safeMachineCandidateWorkAvailableCount, 0);
  assert.equal(report.summary.safeMachineCandidateWorkMaterializedCount, 55);
  assert.equal(report.summary.originalRuntimeOrHumanDecisionRequiredCount, 55);
  assert.equal(report.writeBoundary.workspaceFilesModifiedByThisGenerator, 0);
  assert.equal(report.writeBoundary.scenarioInventoriesCreatedByThisGenerator, 0);
  assert.equal(report.writeBoundary.frameDomainDispositionsCreatedByThisGenerator, 0);
  assert.ok(
    report.members.every(
      ({
        implementationSpecificationReady,
        implementationAuthorizedByThisReport,
        preRuntimeCandidatePackage,
      }) =>
        implementationSpecificationReady === false &&
        implementationAuthorizedByThisReport === false &&
        preRuntimeCandidatePackage.historicalPostAdoption === true &&
        preRuntimeCandidatePackage.staticReconciliationReceipt.endsWith(
          "g5-l4-m1-static-reconciliation-receipt.json",
        ),
    ),
  );
  assert.deepEqual(
    report.members
      .filter(({implementationState}) =>
        implementationState.sourceStaticEngineeringCandidate)
      .map(({animationId}) => animationId),
    [
      "course-g05-l04-ir-001-a662633d",
      "course-g05-l04-rw-002",
      "course-g05-l04-rw-003",
      "course-g05-l04-rw-004",
      "course-g05-l04-vb-002",
      "course-g05-l04-vb-003",
      "course-g05-l04-vb-004",
      "course-g05-l04-vb-005",
      "course-g05-l04-vb-006",
      "course-g05-l04-vb-007",
      "course-g05-l04-vb-008",
      "course-g05-l04-vb-009",
      "course-g05-l04-vb-010",
      "course-g05-l04-vb-011",
      "course-g05-l04-in-002",
      "course-g05-l04-in-003",
      "course-g05-l04-in-004",
      "course-g05-l04-in-005",
      "course-g05-l04-in-006",
      "course-g05-l04-in-007",
      "course-g05-l04-in-008",
      "course-g05-l04-in-009",
      "course-g05-l04-in-010",
      "course-g05-l04-in-011",
      "course-g05-l04-in-012",
      "course-g05-l04-in-013",
      "course-g05-l04-in-014",
      "course-g05-l04-in-015",
      "course-g05-l04-in-016",
      "course-g05-l04-in-017",
      "course-g05-l04-in-018",
      "course-g05-l04-in-019",
      "course-g05-l04-in-020",
      "course-g05-l04-in-021",
      "course-g05-l04-in-022",
      "course-g05-l04-ti-002",
      "course-g05-l04-ti-003",
      "course-g05-l04-ti-004",
      "course-g05-l04-ti-005",
      "course-g05-l04-ti-006",
      "course-g05-l04-ti-007",
      "course-g05-l04-ti-008",
      "course-g05-l04-ti-009",
      "course-g05-l04-gs-002",
      "course-g05-l04-ts-002",
      "course-g05-l04-ts-003",
      "course-g05-l04-ts-004",
      "course-g05-l04-ts-005",
      "course-g05-l04-ts-006",
      "course-g05-l04-ts-007",
      "course-g05-l04-ts-008",
      "course-g05-l04-fq-001",
    ],
  );
  const fq001 = report.members.find(
    ({animationId}) => animationId === "course-g05-l04-fq-001",
  );
  assert.deepEqual(
    {
      state: fq001.implementationState.state,
      candidateKind: fq001.implementationState.candidateKind,
      manifestBound: fq001.implementationState.manifestBound,
      canonicalNestedCoverageDeclared:
        fq001.implementationState.canonicalNestedCoverageDeclared,
      requirementCount:
        fq001.specificationAreas.fullFrameCoverage.requirementCount,
      nestedRequirementCount:
        fq001.specificationAreas.fullFrameCoverage.nestedRequirementCount,
    },
    {
      state: "dual-sprite-composite-engineering-candidate",
      candidateKind: "dual-sprite-composite-prefix",
      manifestBound: false,
      canonicalNestedCoverageDeclared: false,
      requirementCount: 2,
      nestedRequirementCount: 0,
    },
  );
  assert.ok(
    report.members
      .filter(({implementationState}) =>
        implementationState.sourceStaticEngineeringCandidate &&
        implementationState.manifestBound)
      .every((member) =>
        member.preRuntimeCandidatePackage.historicalManifestSuccessor ===
          true &&
        member.specificationAreas.fullFrameCoverage.requirementCount === 4 &&
        member.specificationAreas.fullFrameCoverage.specificationReady ===
          false &&
        Object.values(member.acceptanceEffects).every(
          (value) => value === false,
        )),
  );
  assert.ok(
    Object.values(report.acceptanceEffects).every((value) => value === false),
  );
  assert.doesNotMatch(json, /\/Users\/|\/Volumes\/|file:\/\//);
});

test("external-call candidates remain exact and unexecuted in the reader report", async () => {
  const report = await buildReport();
  const risky = report.members.filter(
    (item) =>
      item.specificationAreas.scriptsAndDependencies.externalCallCandidates
        .length > 0,
  );
  assert.deepEqual(
    risky.map(({animationId}) => animationId),
    [
      "course-g05-l04-fq-002",
      "course-g05-l04-fq-003",
      "shell-course-g05-l04-index-local",
    ],
  );
  assert.deepEqual(
    risky[2].specificationAreas.scriptsAndDependencies.externalCallCandidates,
    [
      {api: "SharedObject", occurrences: 1},
      {api: "fscommand", occurrences: 5},
      {api: "getURL", occurrences: 3},
      {api: "loadMovie", occurrences: 5},
    ],
  );
  const markdown = renderMarkdown(report);
  assert.match(markdown, /These candidates were not executed/);
  assert.match(markdown, /Candidate automation cannot satisfy the second category/);
  assert.match(markdown, /Workspace files modified\/created: \*\*0\/0\*\*/);
  assert.match(
    markdown,
    /Pre-runtime candidate packages: \*\*55\/55\*\* \(385 hash-bound files\)/,
  );
});
