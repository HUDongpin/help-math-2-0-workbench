#!/usr/bin/env node

import {createHash} from "node:crypto";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  G5_L5_STATIC_RECONCILIATION_CONFIG,
  adoptLessonM1StaticSpecification,
  buildLessonM1StaticReconciliationPlan,
  lessonM1StaticReconciliationReceiptPath,
  readLessonM1StaticReconciliationReceipt,
  stableJson,
  validateLessonM1StaticReconciliationReceipt,
} from "./adopt-g5-l5-m1-static-specification.mjs";
import {
  OUTPUT_NAMES as G5_L4_CANDIDATE_OUTPUT_NAMES,
  validatePriorReceipt as validateG5L4CandidateReceipt,
} from "./materialize-g5-l4-pre-runtime-specification-candidates.mjs";
import {
  validateSuccessorReceipt as validateG5L4KeyframeSuccessorReceipt,
} from "./materialize-g5-l4-source-derived-keyframe-candidates.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

export const G5_L4_RELEASE_ID =
  "lesson-g05-l04-number-lines";
export const G5_L4_M1_STATIC_RECONCILIATION_RECEIPT_NAME =
  "g5-l4-m1-static-reconciliation-receipt.json";

const G5_L4_OWNER_AUTHORIZATION_PATH =
  "catalog/owner-authorizations/g5-l4-m1-owner-authorization-2026-07-28.json";
const G5_L4_OWNER_AUTHORIZATION_SHA256 =
  "7469ec586d8cadb6c5459609e46e0010a8041a4e9fe226e82912bd339d9f5afb";
const G5_L4_RELEASE_FINGERPRINT_SHA256 =
  "df2f04bb91ffecffcde4447807dce7eeff25b689269d5de1f44741f25b5ba2cc";
const G5_L4_SOURCE_SCOPE_SHA256 =
  "a46a673014d1934415ed0a5327bfc1ada40e23ca3d5b6d3c58159141384b8d20";
export const G5_L4_SOURCE_STATIC_SUCCESSOR_IDS = Object.freeze([
  "course-g05-l04-rw-002",
  "course-g05-l04-vb-002",
  "course-g05-l04-vb-005",
  "course-g05-l04-vb-006",
  "course-g05-l04-in-009",
  "course-g05-l04-in-015",
  "course-g05-l04-ts-006",
  "course-g05-l04-ts-003",
  "course-g05-l04-ts-002",
  "course-g05-l04-ts-005",
  "course-g05-l04-ts-004",
  "course-g05-l04-vb-008",
  "course-g05-l04-vb-009",
  "course-g05-l04-in-020",
  "course-g05-l04-in-012",
  "course-g05-l04-rw-003",
  "course-g05-l04-rw-004",
  "course-g05-l04-in-002",
  "course-g05-l04-in-007",
  "course-g05-l04-vb-007",
  "course-g05-l04-vb-010",
  "course-g05-l04-vb-011",
  "course-g05-l04-in-003",
  "course-g05-l04-in-004",
  "course-g05-l04-in-005",
  "course-g05-l04-in-010",
  "course-g05-l04-in-013",
  "course-g05-l04-in-014",
  "course-g05-l04-in-016",
  "course-g05-l04-in-017",
  "course-g05-l04-in-018",
  "course-g05-l04-ts-007",
  "course-g05-l04-ts-008",
  "course-g05-l04-vb-003",
  "course-g05-l04-vb-004",
  "course-g05-l04-in-006",
  "course-g05-l04-in-008",
  "course-g05-l04-in-011",
  "course-g05-l04-in-019",
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
  "course-g05-l04-ir-001-a662633d",
]);
const G5_L4_FQ001_COMPOSITE_SUCCESSOR_ID =
  "course-g05-l04-fq-001";
const G5_L4_PRODUCT_ONLY_SUCCESSOR_IDS = Object.freeze([
  "course-g05-l04-fq-002",
  "course-g05-l04-fq-003",
  "shell-course-g05-l04-index-local",
]);
const G5_L4_ALL_POST_M1_SUCCESSOR_IDS = Object.freeze([
  ...G5_L4_SOURCE_STATIC_SUCCESSOR_IDS,
  G5_L4_FQ001_COMPOSITE_SUCCESSOR_ID,
  ...G5_L4_PRODUCT_ONLY_SUCCESSOR_IDS,
]);
const SHA256 = /^[a-f0-9]{64}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function exactBinding(actual, expected) {
  return actual?.path === expected?.path &&
    actual?.bytes === expected?.bytes &&
    actual?.sha256 === expected?.sha256;
}

function inputDescriptor(input) {
  return {
    path: input?.path,
    bytes: input?.bytes?.length,
    sha256: input?.sha256,
  };
}

function validateG5L4AssetSuccessorFingerprint(document, animationId) {
  const projection = structuredClone(document);
  const fingerprint = projection.artifactFingerprintSha256;
  delete projection.artifactFingerprintSha256;
  delete projection.generatedMarker;
  invariant(
    SHA256.test(fingerprint || "") &&
      document.generatedMarker === `sha256:${fingerprint}` &&
      sha256(`${JSON.stringify(projection, null, 2)}\n`) === fingerprint,
    `${animationId}: source-derived asset successor fingerprint drifted`,
  );
}

function validateG5L4SourceDerivedInputSuccessors({
  member,
  receipt,
  inputs,
}) {
  const m1ReceiptBytes = Buffer.from(stableJson(receipt));
  const m1ReceiptBinding = {
    path:
      `migrations/${member.animationId}/audit/machine/` +
      G5_L4_M1_STATIC_RECONCILIATION_RECEIPT_NAME,
    bytes: m1ReceiptBytes.length,
    sha256: sha256(m1ReceiptBytes),
  };
  const assetSuccessor = inputs.assetInventorySuccessorReceipt?.value;
  invariant(
    assetSuccessor?.schemaVersion === 1 &&
      assetSuccessor.artifactType ===
        "g5-l4-source-derived-asset-inventory-candidate-receipt" &&
      assetSuccessor.releaseId === G5_L4_RELEASE_ID &&
      assetSuccessor.animationId === member.animationId &&
      assetSuccessor.assetId === member.assetId &&
      assetSuccessor.ownership?.acceptanceEvidence === false &&
      assetSuccessor.projection?.oneRowPerMachineDefinition === true &&
      assetSuccessor.projection?.sourceDefinitionCandidateCount ===
        assetSuccessor.output?.assetInventory?.rowCount &&
      assetSuccessor.projection?.authoritativeBaselineRowCount === 0 &&
      assetSuccessor.projection?.runtimePlacementDispositionCount === 0 &&
      assetSuccessor.projection?.assetUsageDispositionCount === 0 &&
      assetSuccessor.projection?.visualConfirmationCount === 0 &&
      assetSuccessor.projection?.rendererReadyAssetCount === 0 &&
      assetSuccessor.projection?.finalAssetSpecificationComplete === false &&
      assetSuccessor.strictAcceptanceEffect === "none" &&
      Object.values(assetSuccessor.acceptanceEffects || {}).length > 0 &&
      Object.values(assetSuccessor.acceptanceEffects).every(
        (value) => value === false,
      ) &&
      exactBinding(
        assetSuccessor.historicalCanonicalPreimage,
        receipt.inputs.canonicalAssetInventory,
      ) &&
      exactBinding(
        assetSuccessor.inputs?.m1StaticReconciliationReceipt,
        m1ReceiptBinding,
      ) &&
      exactBinding(
        assetSuccessor.output.assetInventory,
        inputDescriptor(inputs.assetInventory),
      ),
    `${member.animationId}: source-derived asset successor boundary or binding drifted`,
  );
  validateG5L4AssetSuccessorFingerprint(
    assetSuccessor,
    member.animationId,
  );

  const keyframeSuccessor =
    inputs.keyframeSuccessorReceipt?.value;
  validateG5L4KeyframeSuccessorReceipt(keyframeSuccessor);
  const keyframeMember = keyframeSuccessor.members.find(
    ({animationId}) => animationId === member.animationId,
  );
  invariant(
    keyframeMember?.assetId === member.assetId &&
      exactBinding(
        keyframeMember.inputs?.historicalM1Receipt,
        m1ReceiptBinding,
      ) &&
      exactBinding(
        keyframeMember.output?.before,
        receipt.inputs.canonicalKeyframes,
      ) &&
      exactBinding(
        keyframeMember.output?.after,
        inputDescriptor(inputs.keyframes),
      ) &&
      keyframeMember.derivation?.authoritativeBaselineKeyframeCount === 0 &&
      keyframeMember.derivation?.observedRuntimeRowCount === 0 &&
      keyframeMember.derivation?.rowCount > 0,
    `${member.animationId}: source-derived keyframe successor boundary or binding drifted`,
  );
}

function hasExactSourceStaticFrameBoundary(candidate, nested) {
  if (
    !Number.isSafeInteger(candidate?.renderedFrameCount) ||
    candidate.renderedFrameCount <= 0 ||
    candidate.renderedFrameCount > nested?.frameCount
  ) {
    return false;
  }
  if (candidate.renderedFrameCount === nested.frameCount) {
    return candidate.sourceStaticRenderableFrames === undefined &&
      candidate.blockedLocalFrameRanges === undefined;
  }
  const renderable = candidate.sourceStaticRenderableFrames;
  const blocked = candidate.blockedLocalFrameRanges;
  return renderable?.firstFrame === 1 &&
    renderable.lastFrame === candidate.renderedFrameCount &&
    renderable.frameCount === candidate.renderedFrameCount &&
    Array.isArray(blocked) &&
    blocked.length === 1 &&
    blocked[0]?.firstFrame === candidate.renderedFrameCount + 1 &&
    blocked[0]?.lastFrame === nested.frameCount;
}

function validateG5L4M1OwnerAuthorization(receipt, binding) {
  invariant(
    binding?.path === G5_L4_OWNER_AUTHORIZATION_PATH &&
      binding.sha256 === G5_L4_OWNER_AUTHORIZATION_SHA256 &&
      receipt?.schemaVersion === 1 &&
      receipt.evidenceType ===
        "g5-l4-user-stated-owner-m1-authorization-intake" &&
      receipt.releaseId === G5_L4_RELEASE_ID &&
      receipt.channel === "current-codex-task" &&
      receipt.ownerStatement?.sha256 ===
        "b5e3782e82d4d806304f221141579b1fe2fac72eff1f9f583b544f64ce6fa8cb" &&
      receipt.authorization?.phase === "M1" &&
      receipt.authorization?.track === "G5 L4 fidelity track" &&
      receipt.authorization?.explicit === true &&
      Array.isArray(receipt.authorization.scope) &&
      receipt.authorization.scope.includes(
        "g5-l4-scaffold-and-machine-audit",
      ) &&
      receipt.authorization.scope.includes(
        "g5-l4-frame-domain-and-audio-inventory",
      ),
    "G5 L4 M1 Owner authorization identity or scope drifted",
  );
  invariant(
    receipt.sourceBindingsAtIntake?.sourceScopeFreeze?.path ===
      "reports/g5-l4-source-scope-freeze.json" &&
      receipt.sourceBindingsAtIntake.sourceScopeFreeze.sha256 ===
        G5_L4_SOURCE_SCOPE_SHA256 &&
      receipt.externalSignatureEnvelope === null &&
      receipt.authorityBoundary?.machineOnlyM1FidelityTrancheAuthorized ===
        true &&
      receipt.authorityBoundary?.animateGuiExecutionAuthorizedByThisIntakeAlone ===
        false &&
      receipt.authorityBoundary
        ?.originalRuntimeExecutionAuthorizedByThisIntakeAlone === false &&
      receipt.authorityBoundary
        ?.rendererImplementationAuthorizedByThisIntakeAlone === false &&
      receipt.authorityBoundary?.humanReviewAccepted === false &&
      receipt.authorityBoundary?.ownerFidelityAcceptanceEstablished ===
        false &&
      receipt.authorityBoundary?.strictCompletionEstablished === false &&
      receipt.authorityBoundary?.publicationAuthorized === false,
    "G5 L4 M1 Owner authorization crossed its machine-only boundary",
  );
  return receipt;
}

function validatePendingCoverageRequirement(
  requirement,
  frameDomain,
  language,
) {
  invariant(
    requirement?.requirementId ===
      `req:${frameDomain.id}:lesson-shell-natural-entry:${language}` &&
      requirement.frameDomainId === frameDomain.id &&
      requirement.language === language &&
      requirement.requiredRange?.firstFrame === 1 &&
      requirement.requiredRange?.lastFrame === frameDomain.frameCount &&
      requirement.baselineAuthority === "unresolved" &&
      requirement.status === "pending" &&
      requirement.capturedFrameCount === 0 &&
      Array.isArray(requirement.missingFrames) &&
      requirement.missingFrames.length === frameDomain.frameCount &&
      requirement.missingFrames.every((frame, index) => frame === index + 1),
    `${requirement?.requirementId || "unknown"}: successor coverage was promoted or narrowed`,
  );
  for (const key of [
    "baselineCaptureManifest",
    "baselineCaptureManifestSha256",
    "captureManifest",
    "captureManifestSha256",
    "metricsFile",
    "metricsSha256",
  ]) {
    invariant(
      requirement[key] === "",
      `${requirement.requirementId}: ${key} must remain empty`,
    );
  }
}

function validateG5L4SourceStaticHistoricalSuccessor({
  member,
  phase,
  receipt,
  outputs,
  inputs,
  outputName,
  currentOutput,
}) {
  const fq001Composite =
    member.animationId === G5_L4_FQ001_COMPOSITE_SUCCESSOR_ID;
  const manifestSuccessor =
    G5_L4_SOURCE_STATIC_SUCCESSOR_IDS.includes(member.animationId) ||
    fq001Composite;
  invariant(
    G5_L4_ALL_POST_M1_SUCCESSOR_IDS.includes(member.animationId),
    `${member.animationId}: post-M1 successor is not allowlisted`,
  );
  invariant(
    phase === "read-output" || phase === "adopted-state",
    `${member.animationId}: unsupported historical successor validation phase`,
  );
  if (phase === "read-output") {
    invariant(
      manifestSuccessor &&
        outputName === "migrationManifest" &&
        currentOutput?.value &&
        currentOutput.sha256 !==
          receipt.outputs.migrationManifest.after.sha256,
      `${member.animationId}: only an actual migration-manifest successor may diverge`,
    );
  } else {
    validateG5L4SourceDerivedInputSuccessors({
      member,
      receipt,
      inputs,
    });
    if (!manifestSuccessor) {
      invariant(
        exactBinding(
          inputDescriptor(inputs.fullFrameCoverage),
          receipt.inputs.canonicalCoverage,
        ),
        `${member.animationId}: product-only successor changed canonical coverage`,
      );
      return;
    }
  }
  const manifest = phase === "read-output"
    ? currentOutput.value
    : JSON.parse(outputs.migrationManifest.bytes.toString("utf8"));
  if (fq001Composite) {
    const implementation = manifest.implementation;
    const maturity = implementation?.candidateMaturity;
    invariant(
      manifest?.schemaVersion === 2 &&
        manifest.id === member.animationId &&
        manifest.animationId === member.animationId &&
        manifest.assetId === member.assetId &&
        manifest.status === "preserved" &&
        manifest.source?.swfSha256 === member.source.sha256 &&
        implementation?.rendering === "undecided" &&
        implementation.route === "" &&
        implementation.routeFile === "" &&
        implementation.component === "" &&
        implementation.registryModule === "" &&
        implementation.timelineModule === "" &&
        implementation.testFile === "" &&
        implementation.standalonePackage === "" &&
        implementation.defaultFrameDomainId === "root" &&
        Array.isArray(implementation.frameDomains) &&
        implementation.frameDomains.length === 1 &&
        implementation.frameDomains[0]?.id === "root" &&
        implementation.frameDomains[0].kind === "root" &&
        implementation.frameDomains[0].frameCount ===
          manifest.runtime?.frameCount &&
        implementation.candidateState === undefined &&
        implementation.capturePlanning === undefined &&
        maturity?.status ===
          "current-javascript-engineering-candidate-only" &&
        maturity.candidateKind === "dual-sprite-composite-prefix" &&
        maturity.bindingAuthority ===
          "independent-fq001-composite-evidence-only" &&
        maturity.report ===
          "evidence/dual-sprite-composite-current-js-candidate.json" &&
        maturity.specification ===
          "audit/dual-sprite-composite-current-js-candidate-spec.json" &&
        maturity.assetManifest ===
          `public/flash-assets/courses/${member.animationId}/manifest.json` &&
        maturity.runtimeScript ===
          `public/flash-assets/courses/${member.animationId}/canvas-renderer.js` &&
        maturity.route === `/animations/${member.animationId}` &&
        maturity.publicComposite?.frameDomain === "sprite-145" &&
        maturity.publicComposite.firstFrame === 1 &&
        maturity.publicComposite.lastFrame === 52 &&
        maturity.publicComposite.openFrameCount === 52 &&
        maturity.publicComposite.fixedCompanionFrameDomain === "sprite-100" &&
        maturity.publicComposite.fixedCompanionFrame === 1 &&
        maturity.canonicalDefaultFrameDomainId === "root" &&
        maturity.canonicalFrameDomainsChanged === false &&
        maturity.canonicalFrameDomainDisposition === "unresolved" &&
        maturity.canonicalNestedCoverageDeclared === false &&
        maturity.rootEnabled === false &&
        maturity.companionStandaloneEnabled === false &&
        maturity.spanishEnabled === false &&
        maturity.audioEnabled === false &&
        maturity.sourceControlsEnabled === false &&
        maturity.replayParityEstablished === false &&
        maturity.originalRuntimeBaselineUsed === false &&
        maturity.rmseComputed === false &&
        maturity.humanVisualReviewPerformed === false &&
        maturity.ownerReviewPerformed === false &&
        maturity.implementationAuthorized === false &&
        maturity.strictAcceptanceEffect === "none",
      `${member.animationId}: current migration manifest is not the fail-closed FQ001 dual-sprite composite successor`,
    );
    if (phase === "read-output") return;
    invariant(
      outputs.migrationManifest.sha256 !==
        receipt.outputs.migrationManifest.after.sha256 &&
        inputs.fullFrameCoverage.sha256 ===
          receipt.inputs.canonicalCoverage.sha256,
      `${member.animationId}: FQ001 successor must preserve root-only canonical coverage`,
    );
    return;
  }
  const frameDomains = manifest.implementation?.frameDomains;
  const root = frameDomains?.find(({id}) => id === "root");
  const nested = frameDomains?.find(({kind}) => kind === "nested");
  const candidate = manifest.implementation?.candidateState;
  invariant(
    manifest?.schemaVersion === 2 &&
      manifest.id === member.animationId &&
      manifest.animationId === member.animationId &&
      manifest.assetId === member.assetId &&
      manifest.status === "preserved" &&
      manifest.source?.swfSha256 === member.source.sha256 &&
      manifest.implementation?.route ===
        `/animations/${member.animationId}` &&
      typeof manifest.implementation.rendering === "string" &&
      manifest.implementation.rendering.startsWith(
        "source-static Canvas engineering candidate;",
      ) &&
      Array.isArray(frameDomains) &&
      frameDomains.length === 2 &&
      root?.kind === "root" &&
      root.frameCount === manifest.runtime?.frameCount &&
      nested?.parentFrameDomainId === "root" &&
      Number.isSafeInteger(nested.frameCount) &&
      nested.frameCount > 0 &&
      candidate?.status ===
        "current-javascript-engineering-candidate-only" &&
      candidate.sourceStaticFrameDomain === nested.id &&
      hasExactSourceStaticFrameBoundary(candidate, nested) &&
      candidate.rootEnabled === false &&
      candidate.spanishEnabled === false &&
      candidate.audioEnabled === false &&
      candidate.sourceControlsEnabled === false &&
      candidate.replayParityEstablished === false &&
      candidate.originalRuntimeBaselineUsed === false &&
      candidate.rmseComputed === false &&
      candidate.humanVisualReviewPerformed === false &&
      candidate.ownerReviewPerformed === false &&
      candidate.strictAcceptanceEffect === "none" &&
      manifest.implementation.capturePlanning
        ?.authoritativeRuntimeFrameDomainDispositionEstablished === false &&
      manifest.implementation.capturePlanning
        .runtimeReachabilityEstablished === false &&
      manifest.implementation.capturePlanning.strictAcceptanceEffect ===
        "none",
    `${member.animationId}: current migration manifest is not the bounded source-static successor`,
  );
  const evidence = manifest.evidence;
  invariant(
    evidence?.sourceStaticCandidateSpec ===
      `audit/source-static-current-js-candidate-spec.json` &&
      SHA256.test(evidence.sourceStaticCandidateSpecSha256 || "") &&
      evidence.currentJavascriptCandidateReport ===
        "evidence/source-static-current-js-candidate.json" &&
      SHA256.test(evidence.currentJavascriptCandidateReportSha256 || "") &&
      evidence.currentJavascriptAssetManifest ===
        `public/flash-assets/courses/${member.animationId}/manifest.json` &&
      SHA256.test(evidence.currentJavascriptAssetManifestSha256 || "") &&
      evidence.currentJavascriptRuntimeScript ===
        `public/flash-assets/courses/${member.animationId}/canvas-renderer.js` &&
      SHA256.test(evidence.currentJavascriptRuntimeScriptSha256 || "") &&
      evidence.currentJavascriptCandidateAuthority ===
        "non-authoritative-current-javascript-source-static-output" &&
      evidence.currentJavascriptCandidateStrictAcceptanceEffect === "none",
    `${member.animationId}: source-static successor evidence binding drifted`,
  );
  if (phase === "read-output") return;

  invariant(
    outputs.migrationManifest.sha256 !==
      receipt.outputs.migrationManifest.after.sha256 &&
      inputs.fullFrameCoverage.sha256 !==
        receipt.inputs.canonicalCoverage.sha256,
    `${member.animationId}: successor policy requires distinct current manifest and coverage bytes`,
  );
  const coverage = inputs.fullFrameCoverage.value;
  invariant(
    coverage?.schemaVersion === 2 &&
      coverage.animationId === member.animationId &&
      coverage.planningState ===
        "valid-root-and-conservative-nested-requirements-pending-authoritative-runtime" &&
      Array.isArray(coverage.requirements) &&
      coverage.requirements.length === 4,
    `${member.animationId}: successor coverage identity drifted`,
  );
  for (const frameDomain of [root, nested]) {
    for (const language of ["en", "es"]) {
      const matches = coverage.requirements.filter(
        (requirement) =>
          requirement.frameDomainId === frameDomain.id &&
          requirement.language === language,
      );
      invariant(
        matches.length === 1,
        `${member.animationId}: expected one ${frameDomain.id}/${language} coverage requirement`,
      );
      validatePendingCoverageRequirement(matches[0], frameDomain, language);
    }
  }
}

export const G5_L4_STATIC_RECONCILIATION_CONFIG = Object.freeze({
  releaseId: G5_L4_RELEASE_ID,
  releaseLabel: "G5 L4",
  titleDisplay: "Number Lines",
  grade: 5,
  lesson: 4,
  activeXmlReferencedPages: 54,
  courseShells: 1,
  memberCount: 55,
  releaseFingerprintSha256:
    G5_L4_RELEASE_FINGERPRINT_SHA256,
  generatorPath:
    "scripts/reconcile-lesson-m1-static-specification.mjs",
  reconciliationEnginePath:
    "scripts/adopt-g5-l5-m1-static-specification.mjs",
  ownerAuthorizationValidatorPath:
    "scripts/reconcile-lesson-m1-static-specification.mjs",
  candidateMaterializerPath:
    "scripts/materialize-g5-l4-pre-runtime-specification-candidates.mjs",
  releasePath: "catalog/lesson-releases.json",
  sourceScopePath: "reports/g5-l4-source-scope-freeze.json",
  ownerAuthorizationPath: G5_L4_OWNER_AUTHORIZATION_PATH,
  sourceScopeBindingName: "g5-l4-source-scope-binding.json",
  candidateOutputNames: G5_L4_CANDIDATE_OUTPUT_NAMES,
  receiptName: G5_L4_M1_STATIC_RECONCILIATION_RECEIPT_NAME,
  artifactTypes: Object.freeze({
    sourceScopeBinding: "g5-l4-source-scope-binding",
    runtimeFactsCandidate: "g5-l4-manifest-runtime-facts-candidate",
    scriptInventoryCandidate:
      "g5-l4-ffdec-script-inventory-candidate",
    dependencyInventoryCandidate:
      "g5-l4-static-dependency-inventory-candidate",
    canonicalScriptInventory:
      "g5-l4-canonical-static-script-inventory",
    canonicalDependencyInventory:
      "g5-l4-canonical-static-dependency-inventory",
    reconciliationReceipt:
      "g5-l4-m1-static-reconciliation-receipt",
  }),
  allowAudioRequirementRaise: false,
  briefManagedSection: true,
  preserveHistoricalGeneratorBindingAfterAdoption: false,
  preserveHistoricalGlobalInputBindingsAfterAdoption: Object.freeze([
    "ownerDirectiveValidator",
    "generator",
    "candidateMaterializer",
    "reconciliationEngine",
  ]),
  historicalPostimageSuccessorPolicy: Object.freeze({
    animationIds: G5_L4_ALL_POST_M1_SUCCESSOR_IDS,
    outputNames: Object.freeze(["migrationManifest"]),
    inputNames: Object.freeze([
      "canonicalAssetInventory",
      "canonicalKeyframes",
      "canonicalCoverage",
    ]),
    additionalInputs: Object.freeze({
      assetInventorySuccessorReceipt: Object.freeze({
        scope: "workspace",
        path:
          "audit/machine/" +
          "g5-l4-source-derived-asset-inventory-candidate-receipt.json",
        json: true,
      }),
      keyframeSuccessorReceipt: Object.freeze({
        scope: "project",
        path:
          "reports/" +
          "g5-l4-source-derived-keyframe-candidate-successor-receipt.json",
        json: true,
      }),
    }),
    validate: validateG5L4SourceStaticHistoricalSuccessor,
  }),
  validateCandidateReceipt: validateG5L4CandidateReceipt,
  validateOwnerAuthorization: validateG5L4M1OwnerAuthorization,
  ownerAuthorizationFingerprint(_receipt, binding) {
    return binding.sha256;
  },
  ownerM1MachineOnlyEffective(receipt) {
    return (
      receipt.authorityBoundary
        .machineOnlyM1FidelityTrancheAuthorized === true
    );
  },
});

const CONFIG_BY_RELEASE_ID = new Map([
  [G5_L4_RELEASE_ID, G5_L4_STATIC_RECONCILIATION_CONFIG],
  [
    G5_L5_STATIC_RECONCILIATION_CONFIG.releaseId,
    G5_L5_STATIC_RECONCILIATION_CONFIG,
  ],
]);

export function staticReconciliationConfigForRelease(releaseId) {
  const config = CONFIG_BY_RELEASE_ID.get(releaseId);
  invariant(
    config,
    `unsupported M1 static reconciliation release: ${releaseId}`,
  );
  return config;
}

export function g5L4M1StaticReconciliationReceiptPath(animationId) {
  return lessonM1StaticReconciliationReceiptPath(
    G5_L4_STATIC_RECONCILIATION_CONFIG,
    animationId,
  );
}

export function validateG5L4M1StaticReconciliationReceipt(
  receipt,
  member,
) {
  return validateLessonM1StaticReconciliationReceipt(
    receipt,
    member,
    G5_L4_STATIC_RECONCILIATION_CONFIG,
  );
}

export async function readG5L4M1StaticReconciliationReceipt(options) {
  return readLessonM1StaticReconciliationReceipt({
    ...options,
    config: G5_L4_STATIC_RECONCILIATION_CONFIG,
  });
}

export async function buildG5L4M1StaticReconciliationPlan({
  root = defaultProjectRoot,
} = {}) {
  return buildLessonM1StaticReconciliationPlan({
    root,
    config: G5_L4_STATIC_RECONCILIATION_CONFIG,
  });
}

export async function reconcileLessonM1StaticSpecification({
  root = defaultProjectRoot,
  releaseId,
  mode = "dry-run",
  transactionHooks = {},
} = {}) {
  return adoptLessonM1StaticSpecification({
    root,
    mode,
    transactionHooks,
    config: staticReconciliationConfigForRelease(releaseId),
  });
}

export function parseArguments(argv) {
  invariant(Array.isArray(argv), "arguments must be an array");
  let releaseId = null;
  let mode = "dry-run";
  let explicitMode = null;
  let help = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") {
      invariant(!help, "help option may be supplied only once");
      help = true;
      continue;
    }
    if (argument === "--release-id") {
      invariant(releaseId === null, "--release-id may be supplied only once");
      releaseId = argv[index + 1] ?? null;
      invariant(
        releaseId && !releaseId.startsWith("--"),
        "--release-id requires a value",
      );
      index += 1;
      continue;
    }
    const candidate =
      argument === "--dry-run"
        ? "dry-run"
        : argument === "--check"
          ? "check"
          : argument === "--apply"
            ? "apply"
            : null;
    invariant(candidate, `unknown argument: ${argument}`);
    invariant(
      explicitMode === null,
      "choose exactly one of --dry-run, --check, or --apply",
    );
    explicitMode = candidate;
    mode = candidate;
  }
  invariant(
    !help || (releaseId === null && explicitMode === null),
    "--help cannot be combined with other options",
  );
  if (!help) {
    invariant(
      releaseId !== null,
      "--release-id is required for release-driven reconciliation",
    );
    staticReconciliationConfigForRelease(releaseId);
  }
  return {releaseId, mode, help};
}

function usage() {
  return `Usage:
  node scripts/reconcile-lesson-m1-static-specification.mjs \\
    --release-id <release-id> [--dry-run|--check|--apply]

Default mode is --dry-run. --apply is the only mutating mode and operates as
one all-member transaction. No mode launches a GUI, runtime, renderer, or
legacy endpoint, and every receipt remains acceptance-neutral.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = await reconcileLessonM1StaticSpecification(options);
  process.stdout.write(stableJson(result));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
