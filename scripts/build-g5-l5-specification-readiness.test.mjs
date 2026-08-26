import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildReport,
  classifyStaticReconciliationState,
  deriveMemberReadiness,
  parseArguments,
  renderMarkdown,
  stableJson,
} from "./build-g5-l5-specification-readiness.mjs";

const DIGEST = "a".repeat(64);

function normalizeTaskDefinitionOrder(markdown) {
  return markdown.replace(
    /(### (?:Materialized automatically advanceable candidate work|Requires original runtime or human decision)\n\n)((?:- `[^\n]+`\:?[^\n]*\n)+)/g,
    (_match, heading, bulletBlock) =>
      `${heading}${bulletBlock.trimEnd().split("\n").sort().join("\n")}\n`,
  );
}

function memberFixture() {
  return {
    ordinal: 1,
    animationId: "page-1",
    assetId: `swf-${DIGEST}`,
    releaseRole: "active-xml-referenced-page",
    shardId: "shard-1",
    source: {
      path: "HELP_COURSES/ELMGR5/L5/IR/page-1.swf",
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
      swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L5/IR/page-1.swf",
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
      releaseId: "lesson-g05-l05-add-subtract-negative-numbers",
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
    releaseId: "lesson-g05-l05-add-subtract-negative-numbers",
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
        "manifest-runtime-facts-candidate.json",
      ),
      candidateAssetCensus: artifact(
        "swf-asset-definition-census.json",
      ),
      candidateDefinitionInventory: artifact(
        "swf-definition-inventory.csv",
      ),
      candidateScriptInventory: artifact(
        "ffdec-script-inventory-candidate.json",
      ),
      candidateDependencyInventory: artifact(
        "static-dependency-inventory-candidate.json",
      ),
      candidateBrief: artifact(
        "migration-brief-static-prefill-candidate.md",
      ),
      candidateReceipt: artifact(
        "pre-runtime-specification-candidate-receipt.json",
      ),
    },
  };
}

function deriveFixture(options = {}) {
  return deriveMemberReadiness({
    member: memberFixture(),
    migration: migrationFixture(),
    assetRows: [],
    audioRows: [["cue"]],
    keyframeRows: [],
    coverage: coverageFixture(),
    migrationBrief: briefTemplate(),
    machineAudit: machineAuditFixture(options),
    frameDomains: frameDomainsFixture(),
    runtimePlan: runtimePlanFixture(),
    sourceScopeBinding: sourceBindingFixture(),
    audioRuntimeEvidence: audioEvidenceFixture(),
    optionalSpecificationFiles: optionalSpecificationFiles(),
    candidatePackage: candidatePackageFixture(),
  });
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
  assert.equal(item.routing.safeMachineCandidateWorkAvailable, false);
  assert.equal(item.routing.safeMachineCandidateWorkMaterialized, true);
  assert.deepEqual(item.routing.remainingAutomaticallyAdvanceableTasks, []);
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
});

test("static reconciliation transition is exactly 0 or 57 receipts", () => {
  assert.equal(
    classifyStaticReconciliationState(
      Array.from({length: 57}, () => ({present: false})),
    ),
    "pre-adoption",
  );
  assert.equal(
    classifyStaticReconciliationState(
      Array.from({length: 57}, () => ({present: true})),
    ),
    "post-adoption",
  );
  const partial = Array.from({length: 57}, () => ({present: false}));
  partial[0].present = true;
  assert.throws(
    () => classifyStaticReconciliationState(partial),
    /partial \(1\/57\)/,
  );
});

test("machine-only static reconciliation remains implementation-blocked", () => {
  const migration = migrationFixture();
  migration.runtime.actionScriptVersion = "AS1/2";
  migration.runtime.backgroundColor = "#ffffff";
  migration.runtime.scripts = [{
    actionScriptVersion: "AS1/2",
    completeReachableInventory: false,
    runtimeReachability: "unresolved",
  }];
  migration.toolVersions.ffdec = "FFDec test";
  migration.toolVersions.swfmill = "swfmill test";
  const optional = optionalSpecificationFiles();
  optional.scriptInventory = {
    present: true,
    path: "migrations/page-1/audit/script-inventory.json",
    bytes: 10,
    sha256: DIGEST,
  };
  optional.dependencyInventory = {
    present: true,
    path: "migrations/page-1/audit/dependency-inventory.json",
    bytes: 10,
    sha256: DIGEST,
  };
  const item = deriveMemberReadiness({
    member: memberFixture(),
    migration,
    assetRows: [],
    audioRows: [["cue"]],
    keyframeRows: [],
    coverage: coverageFixture(),
    migrationBrief:
      "# page-1 M1 Static-Reconciled Migration Brief\n\nRenderer unresolved.\n",
    machineAudit: machineAuditFixture(),
    frameDomains: frameDomainsFixture(),
    runtimePlan: runtimePlanFixture(),
    sourceScopeBinding: sourceBindingFixture(),
    audioRuntimeEvidence: audioEvidenceFixture(),
    optionalSpecificationFiles: optional,
    candidatePackage: candidatePackageFixture(),
    staticReconciliation: {
      binding: {
        path:
          "migrations/page-1/audit/machine/g5-l5-m1-static-reconciliation-receipt.json",
        bytes: 100,
        sha256: DIGEST,
      },
      postOutputs: {},
      receipt: {
        reconciliation: {applied: true, machineOnlyStatic: true},
        summary: {runtimeReachabilityResolved: false},
      },
    },
  });
  assert.equal(
    item.specificationAreas.migrationManifest
      .manifestStaticFactsReconciled,
    true,
  );
  assert.equal(
    item.specificationAreas.migrationManifest
      .manifestRuntimeFactsReconciled,
    false,
  );
  assert.equal(
    item.specificationAreas.scriptsAndDependencies
      .runtimeReachabilityResolved,
    false,
  );
  assert.equal(
    item.specificationAreas.scriptsAndDependencies.specificationReady,
    false,
  );
  assert.equal(item.implementationSpecificationReady, false);
  assert.equal(item.staticReconciliation.applied, true);
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
    outputPrefix: "reports/g5-l5-specification-readiness",
    check: false,
    help: false,
  });
  assert.equal(parseArguments(["--check"]).check, true);
  assert.throws(
    () => parseArguments(["--output-prefix", "migrations/g5-l5"]),
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

test("checked-in G5 L5 historical report is self-consistent and fail-closed", async () => {
  const [json, markdown] = await Promise.all([
    readFile("reports/g5-l5-specification-readiness.json", "utf8"),
    readFile("reports/g5-l5-specification-readiness.md", "utf8"),
  ]);
  const report = JSON.parse(json);
  const {
    reportFingerprintSha256,
    ...reportWithoutFingerprint
  } = report;
  assert.equal(
    reportFingerprintSha256,
    createHash("sha256")
      .update(stableJson(reportWithoutFingerprint))
      .digest("hex"),
  );
  assert.equal(
    normalizeTaskDefinitionOrder(markdown),
    normalizeTaskDefinitionOrder(renderMarkdown(report)),
  );
  assert.equal(report.summary.memberCount, 57);
  assert.equal(report.summary.implementationSpecificationReadyCount, 0);
  assert.equal(report.summary.strictCompleteCount, 0);
  assert.equal(report.summary.publishedCount, 0);
  assert.ok(
    report.members.every(
      ({implementationSpecificationReady, implementationAuthorizedByThisReport}) =>
        implementationSpecificationReady === false &&
        implementationAuthorizedByThisReport === false,
    ),
  );
  assert.ok(
    Object.values(report.acceptanceEffects).every((value) => value === false),
  );
  assert.doesNotMatch(json, /\/Users\/|\/Volumes\/|file:\/\//);
});

test("current G5 L5 report remains exact and fail-closed", async () => {
  const report = await buildReport();
  assert.equal(report.summary.memberCount, 57);
  assert.equal(report.summary.pairedFlaSwfCount, 49);
  assert.equal(report.summary.swfOnlyCount, 8);
  assert.equal(report.summary.rootFrameCount, 610);
  assert.equal(report.summary.assetInventoryPopulatedCount, 0);
  assert.equal(report.summary.audioInventoryPopulatedCount, 54);
  assert.equal(report.summary.audioInventoryEmptyCount, 3);
  assert.equal(report.summary.structuralAudioInventoryRowCount, 285);
  assert.equal(report.summary.keyframeInventoryPopulatedCount, 0);
  assert.equal(report.summary.coverageRequirementCount, 114);
  assert.equal(report.summary.coverageMissingFrameCount, 1220);
  assert.equal(
    report.summary.migrationBriefTemplateCount,
    report.reconciliationMode === "post-adoption" ? 0 : 57,
  );
  assert.equal(report.summary.machineAuditPartialCount, 57);
  assert.equal(report.summary.nestedDefinitionCount, 1232);
  assert.equal(report.summary.unresolvedNestedReachabilityCount, 1232);
  assert.equal(report.summary.exportedScriptFileCount, 2456);
  assert.equal(report.summary.externalCallCandidateMemberCount, 3);
  assert.equal(report.summary.externalCallCandidateApiCount, 6);
  assert.equal(report.summary.externalCallCandidateOccurrenceCount, 17);
  assert.equal(report.summary.preRuntimeCandidatePackageMaterializedCount, 57);
  assert.equal(report.summary.preRuntimeCandidateFileCount, 399);
  assert.equal(report.summary.manifestRuntimeFactsCandidateCount, 57);
  assert.equal(report.summary.assetDefinitionCensusCandidateCount, 57);
  assert.equal(report.summary.definitionInventoryCandidateCount, 57);
  assert.equal(report.summary.scriptInventoryCandidateCount, 57);
  assert.equal(report.summary.dependencyInventoryCandidateCount, 57);
  assert.equal(report.summary.migrationBriefStaticPrefillCandidateCount, 57);
  assert.equal(report.summary.preRuntimeCandidateReceiptCount, 57);
  assert.equal(report.summary.materializedDefinitionCandidateCount, 9767);
  assert.equal(report.summary.materializedScriptCandidateCount, 2456);
  assert.equal(report.summary.materializedDependencyApiCandidateCount, 6);
  assert.equal(report.summary.materializedDependencyOccurrenceCount, 17);
  assert.equal(
    report.summary.staticReconciliationCount,
    report.reconciliationMode === "post-adoption" ? 57 : 0,
  );
  assert.equal(
    report.summary.manifestStaticFactsReconciledCount,
    report.reconciliationMode === "post-adoption" ? 57 : 0,
  );
  assert.equal(report.summary.manifestRuntimeFactsReconciledCount, 0);
  assert.equal(report.summary.complexityUnknownCount, 57);
  assert.equal(report.summary.rendererUnselectedCount, 57);
  assert.equal(report.summary.runtimeReachabilityUnresolvedCount, 57);
  assert.equal(report.summary.audioHumanDecisionPendingCount, 57);
  assert.equal(
    report.summary.canonicalStaticScriptInventoryCount,
    report.reconciliationMode === "post-adoption" ? 57 : 0,
  );
  assert.equal(
    report.summary.canonicalStaticDependencyInventoryCount,
    report.reconciliationMode === "post-adoption" ? 57 : 0,
  );
  assert.equal(report.summary.automaticallyAdvanceableTaskCount, 285);
  assert.equal(
    report.summary.materializedAutomaticallyAdvanceableTaskCount,
    285,
  );
  assert.equal(report.summary.remainingAutomaticallyAdvanceableTaskCount, 0);
  assert.equal(report.summary.implementationSpecificationReadyCount, 0);
  assert.equal(report.summary.strictCompleteCount, 0);
  assert.equal(report.summary.publishedCount, 0);
  assert.equal(report.summary.safeMachineCandidateWorkAvailableCount, 0);
  assert.equal(report.summary.safeMachineCandidateWorkMaterializedCount, 57);
  assert.equal(report.summary.originalRuntimeOrHumanDecisionRequiredCount, 57);
  assert.equal(report.writeBoundary.workspaceFilesModifiedByThisGenerator, 0);
  assert.equal(report.writeBoundary.scenarioInventoriesCreatedByThisGenerator, 0);
  assert.equal(report.writeBoundary.frameDomainDispositionsCreatedByThisGenerator, 0);
  assert.ok(
    report.members.every(
      ({implementationSpecificationReady, implementationAuthorizedByThisReport}) =>
        implementationSpecificationReady === false &&
        implementationAuthorizedByThisReport === false,
    ),
  );
  assert.ok(
    Object.values(report.acceptanceEffects).every((value) => value === false),
  );
  assert.doesNotMatch(stableJson(report), /\/Users\/|\/Volumes\/|file:\/\//);
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
      "course-g05-l05-fq-002",
      "course-g05-l05-fq-003",
      "shell-course-g05-l05-index-local",
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
  assert.match(
    markdown,
    /(Candidate automation|Machine-only static reconciliation) cannot satisfy the second category/,
  );
  assert.match(markdown, /Workspace files modified\/created: \*\*0\/0\*\*/);
  assert.match(
    markdown,
    /Pre-runtime candidate packages: \*\*57\/57\*\* \(399 hash-bound files\)/,
  );
});
