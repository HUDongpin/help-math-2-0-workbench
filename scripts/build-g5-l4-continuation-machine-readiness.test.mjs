import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  copyFile,
  link,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildG5L4ContinuationMachineReadiness,
  parseArguments,
  renderMarkdown,
  stableJson,
  validateG5L4ContinuationMachineReadiness,
  writeOrCheck,
} from "./build-g5-l4-continuation-machine-readiness.mjs";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

let reportPromise;
function buildOnce() {
  reportPromise ||= buildG5L4ContinuationMachineReadiness();
  return reportPromise;
}

async function withTemporaryRoot(callback) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l4-continuation-test-"),
  );
  try {
    return await callback(root);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
}

async function seedSourceBindings(root, report) {
  for (const binding of [
    report.generator,
    ...Object.values(report.sourceBindings),
    report.currentJavascriptPrivatePreviewEvidence.standalonePackage.archive,
    report.currentJavascriptPrivatePreviewEvidence.standalonePackage
      .packageManifest,
  ]) {
    const destination = path.join(root, binding.path);
    await mkdir(path.dirname(destination), {recursive: true});
    await copyFile(path.join(PROJECT_ROOT, binding.path), destination);
  }
}

function refingerprint(report) {
  const projection = structuredClone(report);
  delete projection.reportFingerprintSha256;
  report.reportFingerprintSha256 = createHash("sha256")
    .update(stableJson(projection))
    .digest("hex");
}

test("aggregates the exact current machine-only preparation state", async () => {
  const report = await buildOnce();
  assert.equal(
    validateG5L4ContinuationMachineReadiness(report, {
      expectedSourceBindings: report.sourceBindings,
    }),
    true,
  );
  assert.deepEqual(report.inputCurrency, {
    boundInputCount: 15,
    inputKeys: [
      "ownerDefaultBlockersAuthorizationReceipt",
      "ownerWorkAuthorizationReceipt",
      "originalRuntimeContainmentReadiness",
      "m1MachineFoundationReadiness",
      "sourceGapForensics",
      "missingKeytermRecoveryReadiness",
      "specificationReadiness",
      "perSessionAuthorizationPreparation",
      "reviewWorkflowPreparation",
      "currentJsImplementationAuthorization",
      "combinedKeytermsProductReferenceSuccessor",
      "sourceDerivedKeyframeCandidateSuccessor",
      "currentJsFq23CompanionQa",
      "currentJsWholeLessonProductQa",
      "standalonePackageSmoke",
    ],
    inputSetSha256: report.inputCurrency.inputSetSha256,
    exactOwnerDirectiveVerified: true,
    ownerWorkAuthorizationReceiptVerified: true,
    upstreamFreshRebuildCheckCount: 7,
    upstreamFreshRebuildVerifiedCount: 7,
    supplementalEvidenceValidatorCount: 6,
    supplementalEvidenceVerifiedCount: 6,
    crossReportDescriptorCasVerified: true,
    standalonePackageArchiveCasVerified: true,
    allInputsCurrent: true,
  });
  assert.deepEqual(report.summary, {
    releaseMemberCount: 55,
    candidatePackageCount: 55,
    candidateFileCount: 385,
    definitionCandidateCount: 12066,
    scriptCandidateCount: 2332,
    sourceDerivedAssetCandidateMemberCount: 55,
    sourceDerivedAssetCandidateRowCount: 12066,
    sourceDerivedKeyframeCandidateMemberCount: 55,
    sourceDerivedKeyframeCandidateRowCount: 802,
    authoritativeBaselineKeyframeCount: 0,
    unsignedSessionTemplateCount: 154,
    unsignedReviewAndApprovalTemplateCount: 223,
    totalUnsignedHumanGateTemplateCount: 377,
    missingXmlCount: 2,
    exactRecoveryCandidateCount: 0,
    combinedElementaryKeytermsReferenceAuthorized: true,
    combinedReferenceRuntimeByteVariantVerified: false,
    currentJavascriptPrivatePreviewImplementationAuthorized: true,
    currentJavascriptPrivatePreviewQaAuthorized: true,
    currentJavascriptFq23ScopedQaPassed: true,
    currentJavascriptFq23QaMemberCount: 2,
    currentJavascriptWholeLessonScopedQaPassed: true,
    currentJavascriptWholeLessonReadyPageCount: 54,
    currentJavascriptWholeLessonMinimumPageStateVisitCount: 162,
    standalonePackageFreshUnzipSmokePassed: true,
    standalonePackageCurrentJavascriptPageCount: 54,
    ownerWorkAuthorizationReceiptCount: 1,
    implementationWorkAuthorized: true,
    runtimeExecutionWorkAuthorized: true,
    containmentMechanismsSelected: 8,
    containmentCandidateImplementationsPresent: 8,
    containmentOfflineOrDiagnosticVerified: 8,
    containmentOwnerTechnicalApprovals: 0,
    containmentLiveSessionVerified: 0,
    materializedReadOnlyHostTreeCandidateCount: 1,
    materializedEmptyRuntimeProfileCandidateCount: 2,
    sourceStaticEngineeringCandidateCount: 52,
    manifestBoundSingleSpriteCandidateCount: 51,
    fullSingleSpriteCandidateCount: 20,
    safePrefixSingleSpriteCandidateCount: 31,
    independentDualSpriteCompositeCandidateCount: 1,
    canonicalNestedCoverageCandidateCount: 51,
    sourceStaticOpenFrameCount: 13696,
    sourceStaticBlockedTailFrameCount: 3020,
    currentJavaScriptOutputPresentCount: 52,
    coverageRequirementCount: 212,
    coverageRootOnlyRequirementCount: 110,
    coverageNestedRequirementCount: 102,
    coverageRequiredFrameCount: 34508,
    coverageMissingFrameCount: 34508,
    actualOriginalRuntimeSessionCount: 0,
    actualAnimateAuditCount: 0,
    actualReviewAcceptanceCount: 0,
    actualOwnerFidelityAcceptanceCount: 0,
    implementationStartedCount: 52,
    strictCompleteCount: 0,
    publishedCount: 0,
    machinePreparationExhaustedBeforeHumanGate: true,
    implementationComplete: false,
    fidelityMigrationComplete: false,
  });
  assert.equal(
    report.sourceBindings.ownerWorkAuthorizationReceipt.path,
    "catalog/owner-authorizations/g5-l4-owner-continuation-and-prospective-approval-intake-2026-08-01.json",
  );
  assert.equal(report.ownerWorkAuthorization.implementationWorkAuthorized, true);
  assert.equal(report.ownerWorkAuthorization.runtimeExecutionWorkAuthorized, true);
  assert.equal(
    report.ownerWorkAuthorization.runtimeExecutionWorkAuthorizationBasis,
    "user-attested-prospective-owner-direction",
  );
  assert.equal(report.ownerWorkAuthorization.implementationAuthorizedCountEffect, 0);
  assert.equal(report.ownerWorkAuthorization.technicalMechanismsApproved, false);
  assert.equal(report.ownerWorkAuthorization.technicalMechanismsVerified, false);
  assert.equal(report.ownerWorkAuthorization.runtimeHostApproved, false);
  assert.equal(
    report.ownerWorkAuthorization.immutableSessionAuthorizationEstablished,
    false,
  );
  assert.equal(report.ownerWorkAuthorization.runtimeExecutionAuthorized, false);
  assert.equal(report.ownerWorkAuthorization.lessonSpecificSubstitution, false);
  assert.equal(report.ownerWorkAuthorization.fidelityAccepted, false);
  assert.equal(report.ownerWorkAuthorization.strictComplete, false);
  assert.equal(report.ownerWorkAuthorization.publicationAuthorized, false);
  assert.deepEqual(
    {
      state: report.machinePreparation.runtimeMechanismCandidates.state,
      bindingMode:
        report.machinePreparation.runtimeMechanismCandidates.bindingMode,
      controlsSpecified:
        report.machinePreparation.runtimeMechanismCandidates.controlsSpecified,
      mechanismsSelected:
        report.machinePreparation.runtimeMechanismCandidates.mechanismsSelected,
      candidateImplementationsPresent:
        report.machinePreparation.runtimeMechanismCandidates
          .candidateImplementationsPresent,
      offlineOrDiagnosticVerified:
        report.machinePreparation.runtimeMechanismCandidates
          .offlineOrDiagnosticVerified,
      ownerTechnicalApprovals:
        report.machinePreparation.runtimeMechanismCandidates
          .ownerTechnicalApprovals,
      liveSessionVerified:
        report.machinePreparation.runtimeMechanismCandidates
          .liveSessionVerified,
      originalRuntimeSessionsExecuted:
        report.machinePreparation.runtimeMechanismCandidates
          .originalRuntimeSessionsExecuted,
      runnable: report.machinePreparation.runtimeMechanismCandidates.runnable,
    },
    {
      state:
        "acceptance-neutral-machine-selected-candidates-owner-live-runtime-gates-closed",
      bindingMode:
        "transitive-through-original-runtime-containment-readiness",
      controlsSpecified: 8,
      mechanismsSelected: 8,
      candidateImplementationsPresent: 8,
      offlineOrDiagnosticVerified: 8,
      ownerTechnicalApprovals: 0,
      liveSessionVerified: 0,
      originalRuntimeSessionsExecuted: 0,
      runnable: false,
    },
  );
  assert.deepEqual(
    report.machinePreparation.sourceStaticEngineeringCandidates,
    {
      candidateIds: [
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
      candidateCount: 52,
      manifestBoundSingleSpriteCandidateCount: 51,
      fullSingleSpriteCandidateCount: 20,
      safePrefixSingleSpriteCandidateCount: 31,
      independentDualSpriteCompositeCandidateCount: 1,
      canonicalNestedCoverageCandidateCount: 51,
      openFrameCount: 13696,
      blockedTailFrameCount: 3020,
      currentJavaScriptOutputPresentCount: 52,
      rendererSelectedCount: 52,
      routeDeclaredCount: 52,
      implementationStartedCount: 52,
      implementationAuthorizedCount: 0,
      authoritativeRuntimeReachabilityEstablishedCount: 0,
      originalRuntimeSessionCount: 0,
      spanishEnabledCount: 0,
      audioEnabledCount: 0,
      rmseComputedCount: 0,
      humanReviewAcceptedCount: 0,
      ownerFidelityAcceptedCount: 0,
      strictCompleteCount: 0,
      publishedCount: 0,
      strictAcceptanceEffect:
        "none; these 52 entries are bounded canonical current-JavaScript engineering candidates only",
    },
  );
  assert.deepEqual(report.machinePreparation.coverageObligations, {
    requirementCount: 212,
    rootRequirementCount: 110,
    nestedRequirementCount: 102,
    requiredFrameCount: 34508,
    missingFrameCount: 34508,
    authoritativeBaselineCount: 0,
    authoritativeRuntimeReachabilityEstablishedCount: 0,
    specificationReadyCount: 0,
    state:
      "all-root-and-conservative-nested-requirements-pending-no-authoritative-baseline",
  });
  assert.deepEqual(report.machinePreparation.unsignedSessionTemplates, {
    originalRuntimeEnglishCount: 55,
    originalRuntimeSpanishCount: 55,
    originalRuntimeTotalCount: 110,
    animateCount: 44,
    totalCount: 154,
    signedCount: 0,
    runnableCount: 0,
    executedCount: 0,
  });
  assert.deepEqual(
    report.machinePreparation.unsignedReviewAndApprovalTemplates,
    {
      independentEngineeringCount: 55,
      independentVisualCount: 55,
      independentAudioCount: 55,
      independentSpanishCount: 55,
      memberReviewCount: 220,
      releaseApprovalCount: 3,
      totalCount: 223,
      assignedCount: 0,
      signedCount: 0,
      acceptedCount: 0,
    },
  );
  assert.deepEqual(
    report.machinePreparation.authorizedCombinedElementaryKeytermsReference,
    {
      state: "authorized-product-reference-only-lesson-source-gap-open",
      directionEvidenceClass: "owner-relayed-content-manager-email",
      referenceUseAuthorized: true,
      intakeSourceCount: 2,
      intakeSourceSetSha256:
        report.machinePreparation.authorizedCombinedElementaryKeytermsReference
          .intakeSourceSetSha256,
      parsedRecordCount: 1626,
      knownUnrelatedMalformedRecordCount: 1,
      intakeSources: {
        english: {
          path:
            "source-assets/flash/intake/2026-07-30-venky-combined-keyterms/ELM/ELKTEG4.xml",
          bytes: 398191,
          sha256:
            "d39fab547dde0476c27caa01c8e3e2443d71cc40eb2df725e7a50102d01ab42c",
        },
        spanish: {
          path:
            "source-assets/flash/intake/2026-07-30-venky-combined-keyterms/ELM/ELKTSG4.xml",
          bytes: 396776,
          sha256:
            "a3aab5a75cd635f88ba5883a5fc2715ea144f51ac5efedac0341c5801c672c6d",
        },
      },
      canonical2008MasterSelected: true,
      ownerIntake2015Selected: false,
      runtimeByteVariantVerified: false,
      exactRecoveryCandidateCount: 0,
      recoveredTargetCount: 0,
      missingLessonSourcesRecovered: false,
      sourceGapClosed: false,
      substitutionAuthorized: false,
      fidelityAccepted: false,
      strictComplete: false,
      published: false,
    },
  );
  assert.match(
    report.machinePreparation.authorizedCombinedElementaryKeytermsReference
      .intakeSourceSetSha256,
    /^[a-f0-9]{64}$/,
  );
  assert.equal(
    report.machinePreparation.missingKeytermRecovery
      .combinedReferenceUseAuthorized,
    true,
  );
  assert.match(
    report.sourceBindings.reviewWorkflowPreparation.sha256,
    /^[a-f0-9]{64}$/,
  );
  assert.ok(report.sourceBindings.reviewWorkflowPreparation.bytes > 0);
  assert.deepEqual(
    report.currentJavascriptPrivatePreviewEvidence.authorization,
    {
      state: "owner-authorized-current-js-private-preview-scope-only",
      currentJsRendererImplementationAuthorized: true,
      sourceDerivedBehaviorCandidateImplementationAuthorized: true,
      currentJsProductQaAuthorized: true,
      privateControlledCeoPreviewPreparationAuthorized: true,
      controlledPreviewHumanNaturalEntryRequirementWaived: true,
      migrationStrictImplementationAuthorizedCount: 0,
      originalRuntimeEvidenceEstablished: false,
      naturalNavigationCausalityEstablished: false,
      independentHumanReviewAccepted: false,
      ownerFidelityAcceptanceEstablished: false,
      strictCompletionEstablished: false,
      externalDeploymentAuthorized: false,
      publicReleaseAuthorized: false,
      publicationAuthorized: false,
    },
  );
  assert.deepEqual(
    report.currentJavascriptPrivatePreviewEvidence
      .sourceDerivedSpecificationCandidates,
    {
      assetBindingMode:
        "indirect-through-specification-readiness-member-workspace-descriptors",
      assetSuccessorReceiptCount: 55,
      assetCandidateRowCount: 12066,
      keyframeSuccessorReceiptCount: 1,
      keyframeCandidateMemberCount: 55,
      keyframeCandidateRowCount: 802,
      authoritativeBaselineKeyframeCount: 0,
      observedRuntimeKeyframeRowCount: 0,
      finalSpecificationComplete: false,
    },
  );
  assert.deepEqual(
    report.currentJavascriptPrivatePreviewEvidence.fq23CompanionQa,
    {
      receiptId:
        "g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r4",
      memberCount: 2,
      packageId: "g5-l4-whole-lesson-package-mvp-v6",
      currentJavascriptFreshPackageQaPassed: true,
      answerSelectionSubmitAndReplayResetPassed: true,
      fullScoreAndReviewFlowFreshlyReperformed: false,
      predecessorClaimsCarriedForward: false,
      consoleErrorCount: 0,
      pageErrorCount: 0,
      failedRequestCount: 0,
      badHttpResponseCount: 0,
      externalRequestCount: 0,
      productQaComplete: false,
    },
  );
  assert.deepEqual(
    report.currentJavascriptPrivatePreviewEvidence.wholeLessonProductQa,
    {
      receiptId:
        "g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r4",
      packageId: "g5-l4-whole-lesson-package-mvp-v6",
      currentJavascriptFreshPackageQaPassed: true,
      releaseMemberCount: 55,
      activePageCount: 54,
      englishReadyPageCount: 54,
      spanishReadyPageCount: 54,
      reducedMotionContextApplied: true,
      spanishMobileHorizontalOverflow: false,
      englishGlossaryEntryCount: 761,
      spanishGlossaryEntryCount: 753,
      exactReleaseOrderFreshlyEstablished: false,
      courseMapInteractionFreshlyReperformed: false,
      keyTermsEscapeFocusFreshlyReperformed: false,
      predecessorClaimsCarriedForward: false,
      spanishSourceVisualParityEstablished: false,
      consoleErrorCount: 0,
      pageErrorCount: 0,
      failedRequestCount: 0,
      badHttpResponseCount: 0,
      externalRequestCount: 0,
      productQaComplete: false,
    },
  );
  assert.equal(
    report.currentJavascriptPrivatePreviewEvidence.standalonePackage
      .freshArchiveExtraction,
    true,
  );
  assert.equal(
    report.currentJavascriptPrivatePreviewEvidence.standalonePackage
      .strictCompleteCount,
    0,
  );
});

test("is deterministic and renders the strict evidence boundary", async () => {
  const report = await buildOnce();
  const rebuilt = await buildG5L4ContinuationMachineReadiness();
  assert.equal(stableJson(rebuilt), stableJson(report));
  const markdown = renderMarkdown(report);
  assert.match(markdown, /Bound inputs current: \*\*15\/15\*\*/);
  assert.match(markdown, /12,066 \/ 2,332/);
  assert.match(markdown, /55\/55 \(12,066 rows\) \/ 55\/55 \(802 rows\)/);
  assert.match(markdown, /Owner-authorized within the narrow current-JS scope/);
  assert.match(
    markdown,
    /Bounded canonical current-JavaScript engineering candidates \/ routes \/ implementation started: \*\*52\/55 \/ 52\/55 \/ 52\/55\*\*/,
  );
  assert.match(
    markdown,
    /Candidate split: \*\*20 full single-sprite \+ 31 safe-prefix single-sprite \+ 1 independently evidenced FQ001 dual-sprite composite\*\*; open\/blocked-tail frames: \*\*13,696 \/ 3,020\*\*; canonical nested coverage declared by \*\*51\*\* candidates/,
  );
  assert.match(
    markdown,
    /Pending coverage obligations: \*\*212\*\* \(\*\*110 root \+ 102 conservative nested\*\*\); missing frames: \*\*34,508\/34,508\*\*/,
  );
  assert.match(markdown, /Unsigned session templates: \*\*154\*\*/);
  assert.match(
    markdown,
    /Unsigned independent-review\/release-approval templates: \*\*223\*\*/,
  );
  assert.match(markdown, /Missing KeyTerm XML \/ exact recovery candidates: \*\*2 \/ 0\*\*/);
  assert.match(
    markdown,
    /Combined elementary KeyTerm product-reference use authorized: \*\*true\*\*; recovered lesson-local targets: \*\*0\/2\*\*; runtime byte variant verified: \*\*false\*\*; source gap closed: \*\*false\*\*/,
  );
  assert.match(
    markdown,
    /does not recover `L4KTE01\.xml` or\s+`L4KTS01\.xml`/,
  );
  assert.match(markdown, /Actual original-runtime sessions \/ Animate audits \/ accepted reviews: \*\*0 \/ 0 \/ 0\*\*/);
  assert.match(markdown, /Implementation started \/ strict complete \/ published: \*\*52\/55 \/ 0\/55 \/ 0\/55\*\*/);
  assert.match(markdown, /Fresh-unzip standalone package smoke: \*\*pass/);
  assert.match(
    markdown,
    /54\/54 EN \+ 54\/54 ES \+ 54\/54 reduced-motion ready/,
  );
  assert.match(markdown, /fixed English source visuals/);
  assert.match(markdown, /Migration strict\s+`implementationAuthorized` remains \*\*0\/55\*\*/);
  assert.match(markdown, /This value is \*\*not\*\*\s+implementation completion/);
  assert.match(markdown, /G5 L4 remains strict \*\*0\/55\*\* and unpublished/);
});

test("validator rejects wrong aggregate counts and every promotion", async () => {
  const report = await buildOnce();
  const mutations = [
    (value) => {
      value.machinePreparation.specificationCandidates.candidatePackageCount = 54;
    },
    (value) => {
      value.machinePreparation.specificationCandidates.candidateFileCount = 384;
    },
    (value) => {
      value.machinePreparation.specificationCandidates.definitionCandidateCount = 12065;
    },
    (value) => {
      value.machinePreparation.specificationCandidates.scriptCandidateCount = 2331;
    },
    (value) => {
      value.machinePreparation.specificationCandidates
        .sourceDerivedAssetCandidateRowCount = 12065;
    },
    (value) => {
      value.machinePreparation.specificationCandidates
        .sourceDerivedKeyframeCandidateRowCount = 801;
    },
    (value) => {
      value.machinePreparation.sourceStaticEngineeringCandidates.candidateCount = 4;
    },
    (value) => {
      value.machinePreparation.sourceStaticEngineeringCandidates.candidateIds[0] =
        "course-g05-l04-vb-001";
    },
    (value) => {
      value.machinePreparation.sourceStaticEngineeringCandidates.implementationAuthorizedCount = 1;
    },
    (value) => {
      value.machinePreparation.coverageObligations.requirementCount = 119;
    },
    (value) => {
      value.machinePreparation.coverageObligations.missingFrameCount = 4621;
    },
    (value) => {
      value.machinePreparation.unsignedSessionTemplates.totalCount = 153;
    },
    (value) => {
      value.machinePreparation.unsignedReviewAndApprovalTemplates.totalCount = 222;
    },
    (value) => {
      value.machinePreparation.missingKeytermRecovery.missingXmlCount = 1;
    },
    (value) => {
      value.machinePreparation.missingKeytermRecovery.exactRecoveryCandidateCount = 1;
    },
    (value) => {
      value.machinePreparation.authorizedCombinedElementaryKeytermsReference
        .referenceUseAuthorized = false;
    },
    (value) => {
      value.machinePreparation.authorizedCombinedElementaryKeytermsReference
        .runtimeByteVariantVerified = true;
    },
    (value) => {
      value.machinePreparation.authorizedCombinedElementaryKeytermsReference
        .recoveredTargetCount = 1;
    },
    (value) => {
      value.currentJavascriptPrivatePreviewEvidence.authorization
        .migrationStrictImplementationAuthorizedCount = 1;
    },
    (value) => {
      value.currentJavascriptPrivatePreviewEvidence.authorization
        .externalDeploymentAuthorized = true;
    },
    (value) => {
      value.currentJavascriptPrivatePreviewEvidence
        .sourceDerivedSpecificationCandidates.authoritativeBaselineKeyframeCount =
        1;
    },
    (value) => {
      value.currentJavascriptPrivatePreviewEvidence.fq23CompanionQa
        .productQaComplete = true;
    },
    (value) => {
      value.currentJavascriptPrivatePreviewEvidence.wholeLessonProductQa
        .productQaComplete = true;
    },
    (value) => {
      value.currentJavascriptPrivatePreviewEvidence.standalonePackage
        .strictCompleteCount = 1;
    },
    (value) => {
      value.machinePreparation.runtimeMechanismCandidates
        .ownerTechnicalApprovals = 1;
    },
    (value) => {
      value.machinePreparation.runtimeMechanismCandidates.liveSessionVerified =
        1;
    },
    (value) => {
      value.machinePreparation.runtimeMechanismCandidates.runnable = true;
    },
    (value) => {
      value.summary.actualOriginalRuntimeSessionCount = 1;
    },
    (value) => {
      value.summary.actualAnimateAuditCount = 1;
    },
    (value) => {
      value.summary.actualReviewAcceptanceCount = 1;
    },
    (value) => {
      value.summary.implementationStartedCount = 1;
    },
    (value) => {
      value.summary.strictCompleteCount = 1;
    },
    (value) => {
      value.summary.publishedCount = 1;
    },
    (value) => {
      value.acceptanceEffects.fidelityAccepted = true;
    },
    (value) => {
      value.ownerWorkAuthorization.technicalMechanismsApproved = true;
    },
    (value) => {
      value.ownerWorkAuthorization.runtimeExecutionAuthorized = true;
    },
    (value) => {
      value.machinePreparationExhaustedBeforeHumanGate = false;
    },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(report);
    mutate(changed);
    assert.throws(
      () => validateG5L4ContinuationMachineReadiness(changed),
    );
  }
});

test("standalone validator rejects recomputed-fingerprint authority-shaped extra keys in a legacy report", async () => {
  const legacy = JSON.parse(
    await readFile("reports/g5-l4-continuation-machine-readiness.json", "utf8"),
  );
  for (const mutate of [
    (value) => { value.runtimeExecutionAuthorized = true; },
    (value) => { value.summary.runtimeExecutionAuthorized = true; },
    (value) => { value.acceptanceEffects.runtimeExecutionAuthorized = true; },
    (value) => { value.machinePreparation.runtimeExecutionAuthorized = true; },
    (value) => {
      value.currentJavascriptPrivatePreviewEvidence.strictComplete = true;
    },
  ]) {
    const injected = structuredClone(legacy);
    mutate(injected);
    refingerprint(injected);
    assert.throws(
      () => validateG5L4ContinuationMachineReadiness(injected),
      /exact key set drifted|protected gate must remain false/,
    );
  }
});

test("validator rejects stale descriptors and false input-current claims", async () => {
  const report = await buildOnce();
  const stale = structuredClone(report);
  stale.sourceBindings.specificationReadiness.sha256 = "0".repeat(64);
  refingerprint(stale);
  assert.throws(
    () => validateG5L4ContinuationMachineReadiness(stale, {
      expectedSourceBindings: report.sourceBindings,
    }),
    /stale or mismatched descriptor/,
  );

  const notCurrent = structuredClone(report);
  notCurrent.inputCurrency.allInputsCurrent = false;
  refingerprint(notCurrent);
  assert.throws(
    () => validateG5L4ContinuationMachineReadiness(notCurrent),
    /input currency/,
  );

  const unsupportedExhaustion = structuredClone(report);
  unsupportedExhaustion.inputCurrency.upstreamFreshRebuildVerifiedCount = 6;
  refingerprint(unsupportedExhaustion);
  assert.throws(
    () => validateG5L4ContinuationMachineReadiness(unsupportedExhaustion),
    /input currency/,
  );

  const unverifiedSupplement = structuredClone(report);
  unverifiedSupplement.inputCurrency.supplementalEvidenceVerifiedCount = 5;
  refingerprint(unverifiedSupplement);
  assert.throws(
    () => validateG5L4ContinuationMachineReadiness(unverifiedSupplement),
    /input currency/,
  );
});

test("checked-in report pair matches a fresh canonical rebuild", async () => {
  const report = await buildOnce();
  assert.equal(
    await readFile(
      path.join(
        PROJECT_ROOT,
        "reports/g5-l4-continuation-machine-readiness.json",
      ),
      "utf8",
    ),
    stableJson(report),
  );
  assert.equal(
    await readFile(
      path.join(
        PROJECT_ROOT,
        "reports/g5-l4-continuation-machine-readiness.md",
      ),
      "utf8",
    ),
    renderMarkdown(report),
  );
});

test("writer creates, checks, and transactionally rolls back the report pair", async () => {
  const report = await buildOnce();
  await withTemporaryRoot(async (root) => {
    await seedSourceBindings(root, report);
    await mkdir(path.join(root, "reports"), {recursive: true});
    const options = {
      report,
      projectRoot: root,
      outputPrefix: "reports/continuation",
    };
    assert.equal((await writeOrCheck(options)).action, "written");
    assert.equal(
      (await writeOrCheck({...options, check: true})).action,
      "verified",
    );
    const jsonPath = path.join(root, "reports", "continuation.json");
    const markdownPath = path.join(root, "reports", "continuation.md");
    const before = await Promise.all([
      readFile(jsonPath),
      readFile(markdownPath),
    ]);
    await assert.rejects(
      writeOrCheck({
        ...options,
        transactionHooks: {
          beforeInstall({index}) {
            if (index === 1) throw new Error("injected transaction failure");
          },
        },
      }),
      /injected transaction failure/,
    );
    const after = await Promise.all([
      readFile(jsonPath),
      readFile(markdownPath),
    ]);
    assert.ok(after[0].equals(before[0]));
    assert.ok(after[1].equals(before[1]));
    const reportFiles = await readdir(path.join(root, "reports"));
    assert.ok(reportFiles.includes("continuation.json"));
    assert.ok(reportFiles.includes("continuation.md"));
    assert.ok(
      reportFiles.every(
        (entry) => !entry.includes(".tmp") && !entry.includes(".bak"),
      ),
    );
  });
});

test("writer rejects symlink and hardlink output targets", async () => {
  const report = await buildOnce();
  for (const linkTarget of [symlink, link]) {
    await withTemporaryRoot(async (root) => {
      await seedSourceBindings(root, report);
      await mkdir(path.join(root, "reports"), {recursive: true});
      const referent = path.join(root, "referent.txt");
      await writeFile(referent, "do-not-change\n");
      await linkTarget(
        referent,
        path.join(root, "reports", "continuation.json"),
      );
      await assert.rejects(
        writeOrCheck({
          report,
          projectRoot: root,
          outputPrefix: "reports/continuation",
        }),
        /ordinary non-linked file/,
      );
      assert.equal(await readFile(referent, "utf8"), "do-not-change\n");
    });
  }
});

test("writer leaves no temporary file when a later output target is invalid", async () => {
  const report = await buildOnce();
  await withTemporaryRoot(async (root) => {
    await seedSourceBindings(root, report);
    const reportsDirectory = path.join(root, "reports");
    await mkdir(reportsDirectory, {recursive: true});
    await mkdir(path.join(reportsDirectory, "continuation.md"));
    await assert.rejects(
      writeOrCheck({
        report,
        projectRoot: root,
        outputPrefix: "reports/continuation",
      }),
      /ordinary non-linked file/,
    );
    const reportFiles = await readdir(reportsDirectory);
    assert.ok(
      reportFiles.every(
        (entry) => !entry.includes(".tmp") && !entry.includes(".bak"),
      ),
    );
  });
});

test("writer rejects a source binding that drifts after construction", async () => {
  const report = await buildOnce();
  await withTemporaryRoot(async (root) => {
    await seedSourceBindings(root, report);
    const binding = report.sourceBindings.specificationReadiness;
    await writeFile(path.join(root, binding.path), "{}\n");
    await assert.rejects(
      writeOrCheck({
        report,
        projectRoot: root,
        outputPrefix: "reports/continuation",
      }),
      /source bytes drifted after report construction/,
    );
  });
});

test("argument parser accepts report paths and rejects unsafe options", () => {
  assert.deepEqual(parseArguments(["--check"]), {
    check: true,
    outputPrefix: "reports/g5-l4-continuation-machine-readiness",
  });
  assert.deepEqual(
    parseArguments([
      "--output-prefix",
      "reports/test-continuation",
    ]),
    {
      check: false,
      outputPrefix: "reports/test-continuation",
    },
  );
  for (const argv of [
    ["--approve"],
    ["--output-prefix"],
    ["--output-prefix", "../escape"],
    ["--output-prefix", "reports/../escape"],
    ["--output-prefix", "reports/result.json"],
  ]) {
    assert.throws(() => parseArguments(argv));
  }
});
