import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  materializeReleaseRuntimeAcquisitionPlans,
  parseArguments,
  validateG4L10DeclarationReceipt,
  validateG4L10Wave3Receipt,
  validatePendingCoverage,
  validateSourceProvenFrameDomainDisposition,
  validateSourceStaticCandidateBoundary,
  validateWave3MemberLineage,
  WORKSPACE_ARTIFACT_RELATIVE,
} from "./materialize-release-runtime-acquisition-plans.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseId = "lesson-g05-l04-number-lines";
const g4L10ReleaseId = "lesson-g04-l10-perimeter-area";
const inputRelatives = [
  "migration.json",
  "audit/machine/g5-l4-source-scope-binding.json",
  "audit/machine/swf-frame-domain-candidates.json",
  "evidence/full-frame-coverage.json",
];

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "release-runtime-planning-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  await Promise.all([
    mkdir(path.join(root, "catalog"), {recursive: true}),
    mkdir(path.join(root, "catalog", "owner-authorizations"), {recursive: true}),
    mkdir(path.join(root, "scripts"), {recursive: true}),
    mkdir(path.join(root, "migrations"), {recursive: true}),
    mkdir(path.join(root, "reports"), {recursive: true}),
  ]);
  await Promise.all([
    copyFile(path.join(projectRoot, "catalog", "lesson-releases.json"), path.join(root, "catalog", "lesson-releases.json")),
    copyFile(path.join(projectRoot, "catalog", "assets.json"), path.join(root, "catalog", "assets.json")),
    copyFile(
      path.join(
        projectRoot,
        "catalog",
        "owner-authorizations",
        "g5-l4-original-runtime-animate-operator-assignment-2026-07-28.json",
      ),
      path.join(
        root,
        "catalog",
        "owner-authorizations",
        "g5-l4-original-runtime-animate-operator-assignment-2026-07-28.json",
      ),
    ),
    copyFile(
      path.join(projectRoot, "scripts", "materialize-release-runtime-acquisition-plans.mjs"),
      path.join(root, "scripts", "materialize-release-runtime-acquisition-plans.mjs"),
    ),
    symlink(path.join(projectRoot, "source-assets"), path.join(root, "source-assets"), "dir"),
  ]);
  const releaseCatalog = JSON.parse(await readFile(path.join(root, "catalog", "lesson-releases.json")));
  const release = releaseCatalog.releases.find((entry) => entry.releaseId === releaseId);
  assert.equal(release.members.length, 55);
  for (const member of release.members) {
    for (const relative of inputRelatives) {
      const destination = path.join(root, "migrations", member.animationId, ...relative.split("/"));
      await mkdir(path.dirname(destination), {recursive: true});
      await copyFile(path.join(projectRoot, "migrations", member.animationId, ...relative.split("/")), destination);
    }
  }
  return {
    root,
    release,
    options: {
      root,
      migrationsRoot: path.join(root, "migrations"),
      reportsRoot: path.join(root, "reports"),
      materializerPath: path.join(root, "scripts", "materialize-release-runtime-acquisition-plans.mjs"),
      operatorAssignmentReceiptPath: path.join(
        root,
        "catalog",
        "owner-authorizations",
        "g5-l4-original-runtime-animate-operator-assignment-2026-07-28.json",
      ),
      releaseId,
    },
  };
}

function conservativeBlockedCoverageFixture() {
  const member = {animationId: "course-g04-l10-test-001"};
  const manifest = {
    implementation: {
      frameDomains: [{id: "root", kind: "root", frameCount: 3}],
    },
    localization: {languages: ["en"]},
  };
  const coverage = {
    schemaVersion: 2,
    animationId: member.animationId,
    requirements: [{
      requirementId: "req-default-root-en",
      scenario: "default",
      frameDomainId: "root",
      traceId: "default-root-en",
      language: "en",
      seed: "0",
      requiredRange: {firstFrame: 1, lastFrame: 3},
      entryState: {kind: "initial-load", language: "en"},
      entryStateSha256: "a".repeat(64),
      baselineAuthorityRequirement: "original-runtime-frame-accurate",
      baselineAuthority: "unresolved",
      status: "blocked",
      blockingReason: "No authoritative original-runtime baseline has been adopted.",
      blockingEvidence: [{
        file: "audit/scenario-inventory.json",
        sha256: "b".repeat(64),
      }],
      capturedFrameCount: 0,
      missingFrames: [1, 2, 3],
      baselineCaptureManifest: "",
      baselineCaptureManifestSha256: "",
      captureManifest: "",
      captureManifestSha256: "",
      metricsFile: "",
      metricsSha256: "",
      strictAcceptanceEffect: "none",
      planningAuthority:
        "source-evidenced-declared-domain-only-runtime-and-acceptance-unresolved",
    }],
  };
  return {coverage, member, manifest};
}

async function g4L10DeclaredDomainFixture() {
  const animationId = "course-g04-l10-ir-001";
  const base = path.join(projectRoot, "migrations", animationId);
  const [
    catalogBytes,
    manifestBytes,
    domainsBytes,
    dispositionBytes,
    evidenceBytes,
    coverageBytes,
    receiptBytes,
  ] = await Promise.all([
    readFile(path.join(projectRoot, "catalog", "lesson-releases.json")),
    readFile(path.join(base, "migration.json")),
    readFile(path.join(base, "audit", "machine", "swf-frame-domain-candidates.json")),
    readFile(path.join(base, "audit", "frame-domain-disposition.json")),
    readFile(path.join(base, "audit", "source-proven-independent-frame-domain-evidence.json")),
    readFile(path.join(base, "evidence", "full-frame-coverage.json")),
    readFile(path.join(projectRoot, "reports", "g4-l10-independent-frame-domain-declarations.json")),
  ]);
  const catalog = JSON.parse(catalogBytes);
  const release = catalog.releases.find(
    ({releaseId: candidate}) => candidate === g4L10ReleaseId,
  );
  const member = release.members.find(
    ({animationId: candidate}) => candidate === animationId,
  );
  const manifest = JSON.parse(manifestBytes);
  const domains = JSON.parse(domainsBytes);
  const disposition = JSON.parse(dispositionBytes);
  const evidence = JSON.parse(evidenceBytes);
  const coverage = JSON.parse(coverageBytes);
  const receipt = JSON.parse(receiptBytes);
  const releaseBinding = {
    path: "catalog/lesson-releases.json",
    bytes: catalogBytes.length,
    sha256: createHash("sha256").update(catalogBytes).digest("hex"),
    releaseId: g4L10ReleaseId,
    releaseFingerprintSha256:
      disposition.generatedFrom.lessonReleaseCatalog
        .releaseFingerprintSha256,
  };
  const receiptBinding = {
    path: "reports/g4-l10-independent-frame-domain-declarations.json",
    bytes: receiptBytes.length,
    sha256: createHash("sha256").update(receiptBytes).digest("hex"),
  };
  const declarationReceipt = validateG4L10DeclarationReceipt({
    receipt,
    receiptBinding,
    releaseBinding,
  });
  return {
    member,
    manifest,
    domains,
    disposition,
    evidence,
    evidenceBinding: {
      path: `migrations/${animationId}/audit/source-proven-independent-frame-domain-evidence.json`,
      bytes: evidenceBytes.length,
      sha256: createHash("sha256").update(evidenceBytes).digest("hex"),
    },
    coverage,
    releaseBinding,
    declarationMember: declarationReceipt.memberById.get(animationId),
  };
}

async function g4L10Wave3Fixture() {
  const animationId = "course-g04-l10-rw-002";
  const base = path.join(projectRoot, "migrations", animationId);
  const [
    catalogBytes,
    manifestBytes,
    domainsBytes,
    dispositionBytes,
    evidenceBytes,
    staticEvidenceBytes,
    declarationBytes,
    wave3Bytes,
  ] = await Promise.all([
    readFile(path.join(projectRoot, "catalog", "lesson-releases.json")),
    readFile(path.join(base, "migration.json")),
    readFile(path.join(base, "audit", "machine", "swf-frame-domain-candidates.json")),
    readFile(path.join(base, "audit", "frame-domain-disposition.json")),
    readFile(path.join(base, "audit", "source-proven-independent-frame-domain-evidence.json")),
    readFile(path.join(base, "audit", "static-frame-domain-disposition-evidence.json")),
    readFile(path.join(projectRoot, "reports", "g4-l10-independent-frame-domain-declarations.json")),
    readFile(path.join(projectRoot, "reports", "g4-l10-post-declaration-static-composites.json")),
  ]);
  const digest = (bytes) =>
    createHash("sha256").update(bytes).digest("hex");
  const catalog = JSON.parse(catalogBytes);
  const release = catalog.releases.find(
    ({releaseId: candidate}) => candidate === g4L10ReleaseId,
  );
  const member = release.members.find(
    ({animationId: candidate}) => candidate === animationId,
  );
  const manifest = JSON.parse(manifestBytes);
  const domains = JSON.parse(domainsBytes);
  const disposition = JSON.parse(dispositionBytes);
  const evidence = JSON.parse(evidenceBytes);
  const staticEvidence = JSON.parse(staticEvidenceBytes);
  const declarationDocument = JSON.parse(declarationBytes);
  const wave3Document = JSON.parse(wave3Bytes);
  const releaseBinding = {
    path: "catalog/lesson-releases.json",
    bytes: catalogBytes.length,
    sha256: digest(catalogBytes),
    releaseId: g4L10ReleaseId,
    releaseFingerprintSha256:
      disposition.generatedFrom.lessonReleaseCatalog
        .releaseFingerprintSha256,
  };
  const declarationReceiptBinding = {
    path: "reports/g4-l10-independent-frame-domain-declarations.json",
    bytes: declarationBytes.length,
    sha256: digest(declarationBytes),
  };
  const declarationReceipt = validateG4L10DeclarationReceipt({
    receipt: declarationDocument,
    receiptBinding: declarationReceiptBinding,
    releaseBinding,
  });
  const wave3ReceiptBinding = {
    path: "reports/g4-l10-post-declaration-static-composites.json",
    bytes: wave3Bytes.length,
    sha256: digest(wave3Bytes),
  };
  const wave3Receipt = validateG4L10Wave3Receipt({
    receipt: wave3Document,
    receiptBinding: wave3ReceiptBinding,
    declarationReceiptBinding,
    declarationReceipt,
    releaseBinding,
    release,
  });
  return {
    release,
    member,
    manifest,
    manifestBinding: {
      path: `migrations/${animationId}/migration.json`,
      bytes: manifestBytes.length,
      sha256: digest(manifestBytes),
    },
    domains,
    disposition,
    dispositionBinding: {
      path: `migrations/${animationId}/audit/frame-domain-disposition.json`,
      bytes: dispositionBytes.length,
      sha256: digest(dispositionBytes),
    },
    evidence,
    evidenceBinding: {
      path: `migrations/${animationId}/audit/source-proven-independent-frame-domain-evidence.json`,
      bytes: evidenceBytes.length,
      sha256: digest(evidenceBytes),
    },
    staticEvidence,
    staticEvidenceBinding: {
      path: `migrations/${animationId}/audit/static-frame-domain-disposition-evidence.json`,
      bytes: staticEvidenceBytes.length,
      sha256: digest(staticEvidenceBytes),
    },
    declarationDocument,
    declarationReceipt,
    declarationReceiptBinding,
    declarationMember: declarationReceipt.memberById.get(animationId),
    wave3Document,
    wave3Receipt,
    wave3ReceiptBinding,
    wave3Member: wave3Receipt.memberById.get(animationId),
    releaseBinding,
  };
}

test("full-release dry-run prevalidates exact G5 L4 identity without writing", async (t) => {
  const {root, options, release} = await fixture(t);
  const result = await materializeReleaseRuntimeAcquisitionPlans({...options, dryRun: true});
  assert.equal(result.mode, "dry-run");
  assert.equal(result.members, 55);
  assert.equal(result.workspaceArtifactChanges, 55);
  assert.equal(result.totalFileChanges, 57);
  assert.equal(result.sourceScopeBindings, 55);
  assert.equal(result.summary.pairedFlaAndSwfCount, 44);
  assert.equal(result.summary.swfOnlyCount, 11);
  assert.equal(result.summary.structuralRootFrameCount, 590);
  assert.equal(result.summary.structuralNestedDefinitionCount, 1281);
  assert.equal(result.summary.structuralNestedLongerThanRootCount, 342);
  assert.equal(result.summary.unresolvedNestedReachabilityCount, 1281);
  assert.equal(result.summary.canonicalRootOnlyRequirementCount, 110);
  assert.equal(result.summary.canonicalNestedRequirementCount, 102);
  assert.equal(result.summary.canonicalRequirementCount, 212);
  assert.equal(result.summary.canonicalPendingRequirementCount, 212);
  assert.equal(result.summary.canonicalBlockedRequirementCount, 0);
  assert.equal(result.runtimeSessionsExecuted, 0);
  assert.equal(result.acceptanceChanges, 0);
  assert.equal(result.canonicalChanges, 0);
  await assert.rejects(
    readFile(path.join(root, "migrations", release.members[0].animationId, WORKSPACE_ARTIFACT_RELATIVE)),
    {code: "ENOENT"},
  );
});

test("materializes deterministic empty non-runnable plans and aggregate reports", async (t) => {
  const {root, options, release} = await fixture(t);
  const protectedInputs = new Map();
  for (const member of release.members) {
    for (const relative of inputRelatives) {
      const filePath = path.join(root, "migrations", member.animationId, ...relative.split("/"));
      protectedInputs.set(filePath, await readFile(filePath));
    }
  }
  const result = await materializeReleaseRuntimeAcquisitionPlans(options);
  assert.equal(result.members, 55);
  assert.equal(result.workspaceArtifactChanges, 55);
  assert.equal(result.totalFileChanges, 57);
  assert.match(result.artifactSetSha256, /^[a-f0-9]{64}$/);

  const representative = "course-g05-l04-rw-002";
  const artifact = JSON.parse(await readFile(path.join(
    root,
    "migrations",
    representative,
    WORKSPACE_ARTIFACT_RELATIVE,
  )));
  assert.equal(artifact.artifactType, "release-runtime-acquisition-plan");
  assert.equal(artifact.schemaVersion, 2);
  assert.equal(artifact.identity.releaseId, releaseId);
  assert.equal(artifact.identity.animationId, representative);
  assert.equal(artifact.nativeRootTimelineFacts.rootFrameCount, 10);
  assert.equal(artifact.nativeRootTimelineFacts.accountingBoundary,
    "structural-root-only-not-total-lesson-coverage");
  assert.equal(artifact.structuralDomainPlanning.nestedDefinitionCandidates.length, 3);
  assert.ok(artifact.structuralDomainPlanning.nestedDefinitionCandidates.every((entry) =>
    entry.rootReachability === "unresolved"
      && entry.placementEntryState === "unresolved"
      && entry.disposition === "structural-candidate-only"));
  assert.equal(artifact.structuralDomainPlanning.rootReachableDomainInventoryComplete, false);
  assert.equal(artifact.structuralDomainPlanning.totalCoverageFrameCount, null);
  assert.equal(artifact.structuralDomainPlanning.totalCoverageFramesKnown, false);
  assert.equal(artifact.coverageV2Planning.canonicalRootOnlyRequirementCount, 2);
  assert.equal(artifact.coverageV2Planning.nestedRequirementsMaterialized, 2);
  assert.equal(artifact.coverageV2Planning.authoritativeBaselineCount, 0);
  assert.equal(artifact.namedOperatorRoleAssignment.assigneeFullName, "Dr. Peter Hu");
  assert.equal(artifact.namedOperatorRoleAssignment.identityBasis, "user-attested-current-codex-task");
  assert.equal(artifact.namedOperatorRoleAssignment.cryptographicallyVerified, false);
  assert.equal(artifact.namedOperatorRoleAssignment.weeklyCapacityEstablished, false);
  assert.equal(artifact.namedOperatorRoleAssignment.runtimeHostApproved, false);
  assert.equal(artifact.namedOperatorRoleAssignment.containmentApproved, false);
  assert.equal(
    artifact.namedOperatorRoleAssignment.actualSessionOperatorAttestationPresent,
    false,
  );
  assert.equal(
    artifact.provenance.namedOperatorAssignmentReceipt.path,
    "catalog/owner-authorizations/g5-l4-original-runtime-animate-operator-assignment-2026-07-28.json",
  );
  assert.deepEqual(artifact.emptyRuntimeAcquisitionWorksheet.namedOperators, []);
  assert.match(
    artifact.emptyRuntimeAcquisitionWorksheet.namedOperatorFieldMeaning,
    /per-session operator attestation/,
  );
  assert.deepEqual(artifact.emptyRuntimeAcquisitionWorksheet.authorizedRuntimeContexts, []);
  assert.deepEqual(artifact.emptyRuntimeAcquisitionWorksheet.naturalEntryActions, []);
  assert.deepEqual(artifact.emptyRuntimeAcquisitionWorksheet.traceSchedules, []);
  assert.deepEqual(artifact.emptyRuntimeAcquisitionWorksheet.actionSchedules, []);
  assert.deepEqual(artifact.emptyRuntimeAcquisitionWorksheet.baselineManifests, []);
  assert.deepEqual(artifact.emptyRuntimeAcquisitionWorksheet.pngFiles, []);
  assert.deepEqual(artifact.emptyRuntimeAcquisitionWorksheet.reviewerSignatures, []);
  assert.deepEqual(artifact.emptyRuntimeAcquisitionWorksheet.ownerSignatures, []);
  assert.equal(artifact.executionGate.runnable, false);
  assert.equal(artifact.executionGate.launchesOriginalRuntime, false);
  assert.equal(artifact.unresolvedBlockers.missingNamedOriginalRuntimeOperator, false);
  assert.equal(artifact.unresolvedBlockers.missingPortableOperatorIdentityVerification, true);
  assert.equal(artifact.unresolvedBlockers.missingOperatorWeeklyCapacityCommitment, true);
  assert.equal(artifact.unresolvedBlockers.missingImmutablePerSessionOperatorAttestation, true);
  assert.equal(artifact.unresolvedBlockers.missingPerSessionExecutionAuthorization, true);
  assert.ok(Object.entries(artifact.acceptanceEffects)
    .filter(([key]) => key !== "acceptanceNeutral")
    .every(([, value]) => value === false));

  const report = JSON.parse(await readFile(path.join(
    root,
    "reports",
    "g05-l04-number-lines-runtime-acquisition-planning-readiness.json",
  )));
  assert.equal(report.schemaVersion, 2);
  assert.equal(report.scope.exactReleaseScopeValidated, true);
  assert.equal(report.scope.exactPhysicalSourceIdentityValidated, true);
  assert.equal(report.scope.canonicalFilesModified, false);
  assert.equal(report.summary.structuralRootFrameCount, 590);
  assert.equal(report.summary.canonicalRequirementCount, 212);
  assert.equal(report.summary.canonicalRootOnlyRequirementCount, 110);
  assert.equal(report.summary.canonicalNestedRequirementCount, 102);
  assert.equal(report.summary.canonicalPendingRequirementCount, 212);
  assert.equal(report.summary.canonicalBlockedRequirementCount, 0);
  assert.equal(report.summary.totalCoverageFrameCountKnownCount, 0);
  assert.equal(report.summary.namedOperatorRoleAssignmentReceiptCount, 1);
  assert.equal(report.summary.plansWithNamedOperatorRoleAssignmentCount, 55);
  assert.equal(report.summary.sessionOperatorAttestationCount, 0);
  assert.equal(report.namedOperatorRoleAssignment.assigneeFullName, "Dr. Peter Hu");
  assert.equal(report.gates.namedOperatorRoleAssignmentBound, true);
  assert.equal(report.gates.portableOperatorIdentityVerified, false);
  assert.equal(report.gates.operatorWeeklyCapacityEstablished, false);
  assert.equal(report.gates.runtimeOperatorSessionAttested, false);
  assert.equal(report.gates.runtimeOperatorBound, false);
  assert.equal(report.gates.rootReachableDomainsResolved, false);
  assert.equal(report.gates.strictCompletionAffected, false);
  assert.equal(report.gates.publicationAffected, false);
  assert.doesNotMatch(JSON.stringify(report), /\/Users\/|\/Volumes\/|file:\/\//);

  const sourceStaticArtifact = JSON.parse(
    await readFile(
      path.join(
        root,
        "migrations",
        "course-g05-l04-rw-003",
        WORKSPACE_ARTIFACT_RELATIVE,
      ),
    ),
  );
  assert.equal(
    sourceStaticArtifact.coverageV2Planning.canonicalRequirementCount,
    4,
  );
  assert.equal(
    sourceStaticArtifact.coverageV2Planning.canonicalRootOnlyRequirementCount,
    2,
  );
  assert.equal(
    sourceStaticArtifact.coverageV2Planning.nestedRequirementsMaterialized,
    2,
  );

  for (const [filePath, before] of protectedInputs) {
    assert.deepEqual(await readFile(filePath), before, `${filePath} changed`);
  }
  const check = await materializeReleaseRuntimeAcquisitionPlans({...options, check: true});
  assert.equal(check.workspaceArtifactChanges, 0);
  assert.equal(check.totalFileChanges, 0);
  assert.ok(check.results.every((entry) => entry.action === "up-to-date"));
});

test("accepts exact blocked coverage-v2 requirements without an acceptance effect", () => {
  const inputs = conservativeBlockedCoverageFixture();
  const result = validatePendingCoverage(inputs);
  assert.deepEqual(result, {
    requirementCount: 1,
    rootRequirementCount: 1,
    nestedRequirementCount: 0,
    declaredNestedRequirementCount: 0,
    pendingRequirementCount: 0,
    blockedRequirementCount: 1,
    languages: ["en"],
  });
});

test("binds exact source-proven dispositions without promoting excluded or unresolved domains", () => {
  const member = {
    animationId: "course-g04-l10-test-001",
    source: {sha256: "c".repeat(64)},
  };
  const manifest = {
    source: {
      swf: "source-assets/flash/course-g04-l10-test-001.swf",
    },
    runtime: {frameCount: 10},
  };
  const domains = {
    nestedDefinitions: [
      {timelineId: "sprite-1", sourceObjectId: 1, frameCount: 1},
      {timelineId: "sprite-2", sourceObjectId: 2, frameCount: 24},
      {timelineId: "sprite-3", sourceObjectId: 3, frameCount: 1},
    ],
  };
  const releaseBinding = {
    releaseId: "lesson-g04-l10-perimeter-area",
    sha256: "a".repeat(64),
    releaseFingerprintSha256: "b".repeat(64),
  };
  const disposition = {
    schemaVersion: 1,
    animationId: member.animationId,
    status: "structurally-enumerated-dispositions-unresolved",
    migrationStatusChanged: false,
    strictAcceptanceEffect: "none; acceptance-neutral structural evidence only",
    generatedFrom: {
      sourceSwf: {
        path: manifest.source.swf,
        sha256: "c".repeat(64),
      },
      lessonReleaseCatalog: {
        releaseId: releaseBinding.releaseId,
        sha256: releaseBinding.sha256,
        releaseFingerprintSha256:
          releaseBinding.releaseFingerprintSha256,
      },
    },
    timelines: [
      {
        timelineId: "root",
        frameCount: 10,
        structuralReachability: "root",
        disposition: "declared-frame-domain",
      },
      {
        timelineId: "sprite-1",
        sourceObjectId: "1",
        frameCount: 1,
        structuralReachability: "reachable-from-root-placement-graph",
        disposition: "composite-child-with-parent",
        staticCompositeEvidence: {
          claimScope: "independent-local-playhead-only",
        },
        riskAssessment: {independentFrameDomainCandidate: false},
      },
      {
        timelineId: "sprite-2",
        sourceObjectId: "2",
        frameCount: 24,
        structuralReachability: "reachable-from-root-placement-graph",
        disposition: "unresolved",
      },
    ],
    summary: {
      inventoryTimelineCount: 4,
      enumeratedTimelineCount: 3,
      reachableChildTimelineCount: 2,
      excludedNotProvenTimelineCount: 1,
      dispositionCounts: {
        "declared-frame-domain": 1,
        "composite-child-with-parent": 1,
        "independent-required": 0,
        nonvisual: 0,
        unresolved: 1,
      },
    },
  };
  const result = validateSourceProvenFrameDomainDisposition({
    disposition,
    domains,
    manifest,
    member,
    releaseBinding,
  });
  assert.equal(result.reachableChildCount, 2);
  assert.equal(result.excludedNotProvenCount, 1);
  assert.equal(result.composite, 1);
  assert.equal(result.unresolved, 1);
  assert.equal(result.independentRequired, 0);
  assert.equal(result.nonvisual, 0);

  const drifted = structuredClone(disposition);
  drifted.timelines[1].staticCompositeEvidence.claimScope =
    "full-runtime-fidelity";
  assert.throws(
    () => validateSourceProvenFrameDomainDisposition({
      disposition: drifted,
      domains,
      manifest,
      member,
      releaseBinding,
    }),
    /composite proof boundary drifted/,
  );
});

test("binds post-declaration manifest sourceProof, disposition lineage, and blocked EN/ES coverage", async () => {
  const inputs = await g4L10DeclaredDomainFixture();
  const dispositionSummary = validateSourceProvenFrameDomainDisposition({
    disposition: inputs.disposition,
    domains: inputs.domains,
    manifest: inputs.manifest,
    member: inputs.member,
    releaseBinding: inputs.releaseBinding,
    independentEvidence: inputs.evidence,
    independentEvidenceBinding: inputs.evidenceBinding,
    declarationMember: inputs.declarationMember,
  });
  assert.equal(dispositionSummary.declarationBound, true);
  assert.equal(dispositionSummary.declared, 3);
  assert.equal(dispositionSummary.independentRequired, 0);
  const coverageSummary = validatePendingCoverage({
    coverage: inputs.coverage,
    member: inputs.member,
    manifest: inputs.manifest,
    dispositionSummary,
  });
  assert.equal(coverageSummary.nestedRequirementCount, 6);
  assert.equal(coverageSummary.declaredNestedRequirementCount, 6);
  assert.equal(coverageSummary.blockedRequirementCount, 8);
  assert.equal(coverageSummary.pendingRequirementCount, 0);
});

test("rejects post-declaration sourceProof or disposition-lineage drift", async () => {
  const original = await g4L10DeclaredDomainFixture();
  for (const mutate of [
    (inputs) => {
      inputs.manifest.implementation.frameDomains[1]
        .sourceProof.actionFrameSequenceSha256 = "0".repeat(64);
    },
    (inputs) => {
      inputs.disposition.generatedFrom
        .sourceProvenIndependentDeclarationBasis.memberEvidence.sha256 =
          "0".repeat(64);
    },
    (inputs) => {
      inputs.disposition.timelines.find(
        ({timelineId}) => timelineId === "sprite-5",
      ).declaredFrameDomains[0].parentEntryFrame = 1;
    },
    (inputs) => {
      inputs.evidence.claims[0].sourceProof.ffdecFrameScriptFrames = [2, 135];
    },
  ]) {
    const inputs = structuredClone(original);
    mutate(inputs);
    assert.throws(() => validateSourceProvenFrameDomainDisposition({
      disposition: inputs.disposition,
      domains: inputs.domains,
      manifest: inputs.manifest,
      member: inputs.member,
      releaseBinding: inputs.releaseBinding,
      independentEvidence: inputs.evidence,
      independentEvidenceBinding: inputs.evidenceBinding,
      declarationMember: inputs.declarationMember,
    }));
  }
});

test("rejects declared-domain coverage promotion or invented runtime entry", async () => {
  const inputs = await g4L10DeclaredDomainFixture();
  const dispositionSummary = validateSourceProvenFrameDomainDisposition({
    disposition: inputs.disposition,
    domains: inputs.domains,
    manifest: inputs.manifest,
    member: inputs.member,
    releaseBinding: inputs.releaseBinding,
    independentEvidence: inputs.evidence,
    independentEvidenceBinding: inputs.evidenceBinding,
    declarationMember: inputs.declarationMember,
  });
  for (const mutate of [
    (requirement) => { requirement.status = "pending"; },
    (requirement) => {
      requirement.entryState.runtimeReachabilityEstablished = true;
    },
    (requirement) => {
      requirement.baselineAuthority = "adopted";
    },
    (requirement) => {
      requirement.planningAuthority = "ready-for-runtime";
    },
    (requirement) => {
      requirement.blockingEvidence[0].file = "runtime/session.json";
    },
  ]) {
    const coverage = structuredClone(inputs.coverage);
    const requirement = coverage.requirements.find(
      ({frameDomainId}) => frameDomainId !== "root",
    );
    mutate(requirement);
    assert.throws(() => validatePendingCoverage({
      coverage,
      member: inputs.member,
      manifest: inputs.manifest,
      dispositionSummary,
    }));
  }
});

test("binds exact wave3 receipt, three-member partition, evidence, and disposition successor", async () => {
  const inputs = await g4L10Wave3Fixture();
  assert.deepEqual(
    [...inputs.wave3Receipt.memberById.keys()],
    [
      "course-g04-l10-rw-002",
      "course-g04-l10-rw-003",
      "course-g04-l10-rw-005",
    ],
  );
  assert.equal(inputs.wave3Receipt.expectedDispositionById.size, 47);
  const wave3Lineage = validateWave3MemberLineage({
    wave3Member: inputs.wave3Member,
    wave3Receipt: inputs.wave3Document,
    declarationReceiptBinding: inputs.declarationReceiptBinding,
    manifest: inputs.manifest,
    manifestBinding: inputs.manifestBinding,
    member: inputs.member,
    disposition: inputs.disposition,
    dispositionBinding: inputs.dispositionBinding,
    staticEvidence: inputs.staticEvidence,
    staticEvidenceBinding: inputs.staticEvidenceBinding,
  });
  assert.equal(wave3Lineage.compositeTimelineId, "sprite-131");
  const dispositionSummary = validateSourceProvenFrameDomainDisposition({
    disposition: inputs.disposition,
    domains: inputs.domains,
    manifest: inputs.manifest,
    member: inputs.member,
    releaseBinding: inputs.releaseBinding,
    independentEvidence: inputs.evidence,
    independentEvidenceBinding: inputs.evidenceBinding,
    declarationMember: inputs.declarationMember,
    wave3Lineage,
  });
  assert.equal(dispositionSummary.declared, 1);
  assert.equal(dispositionSummary.composite, 2);
  assert.equal(dispositionSummary.postDeclarationWave3Composite, 1);
  assert.equal(dispositionSummary.unresolved, 0);
});

test("rejects wave3 report, evidence, disposition, or member-partition tampering", async () => {
  const original = await g4L10Wave3Fixture();
  {
    const receipt = structuredClone(original.wave3Document);
    receipt.members[0].animationId = "course-g04-l10-rw-004";
    assert.throws(() => validateG4L10Wave3Receipt({
      receipt,
      receiptBinding: original.wave3ReceiptBinding,
      declarationReceiptBinding: original.declarationReceiptBinding,
      declarationReceipt: original.declarationReceipt,
      releaseBinding: original.releaseBinding,
      release: original.release,
    }), /wave3 member\/predecessor transition drifted/);
  }
  {
    const receiptBinding = structuredClone(original.wave3ReceiptBinding);
    receiptBinding.sha256 = "0".repeat(64);
    assert.throws(() => validateG4L10Wave3Receipt({
      receipt: original.wave3Document,
      receiptBinding,
      declarationReceiptBinding: original.declarationReceiptBinding,
      declarationReceipt: original.declarationReceipt,
      releaseBinding: original.releaseBinding,
      release: original.release,
    }), /wave3 receipt identity drifted/);
  }
  for (const mutate of [
    (inputs) => {
      inputs.staticEvidence.generatedFrom.postDeclarationWave3Basis
        .acceptedPairSet.sha256 = "0".repeat(64);
    },
    (inputs) => {
      inputs.staticEvidence.claims[0].placementLifecycleAudit
        .allLifetimesMapped = false;
    },
    (inputs) => {
      inputs.disposition.generatedFrom.postDeclarationWave3CompositeBasis
        .declarationReceipt.sha256 = "0".repeat(64);
    },
    (inputs) => {
      inputs.disposition.timelines.find(
        ({timelineId}) => timelineId === "sprite-131",
      ).staticCompositeEvidence.parentFrameDomainId = "root";
    },
    (inputs) => {
      inputs.manifest.implementation.frameDomains.find(
        ({id}) => id === "sprite-356",
      ).sourceProof.actionFrameSequenceSha256 = "0".repeat(64);
    },
  ]) {
    const inputs = structuredClone(original);
    mutate(inputs);
    assert.throws(() => validateWave3MemberLineage({
      wave3Member: inputs.wave3Member,
      wave3Receipt: inputs.wave3Document,
      declarationReceiptBinding: inputs.declarationReceiptBinding,
      manifest: inputs.manifest,
      manifestBinding: inputs.manifestBinding,
      member: inputs.member,
      disposition: inputs.disposition,
      dispositionBinding: inputs.dispositionBinding,
      staticEvidence: inputs.staticEvidence,
      staticEvidenceBinding: inputs.staticEvidenceBinding,
    }));
  }
});

test("rejects promoted status, authority, evidence, or strict-effect drift", () => {
  for (const status of ["ready", "complete", "pass", "adopted"]) {
    const inputs = conservativeBlockedCoverageFixture();
    inputs.coverage.requirements[0].status = status;
    assert.throws(
      () => validatePendingCoverage(inputs),
      /status is not conservative pending\/blocked/,
    );
  }

  for (const mutate of [
    (requirement) => { requirement.baselineAuthority = "adopted"; },
    (requirement) => { requirement.strictAcceptanceEffect = "complete"; },
    (requirement) => { requirement.planningAuthority = "ready-for-acceptance"; },
    (requirement) => { requirement.acceptedEvidence = [{sha256: "c".repeat(64)}]; },
    (requirement) => { requirement.capturedFrameCount = 1; },
    (requirement) => { requirement.captureManifest = "capture.json"; },
  ]) {
    const inputs = conservativeBlockedCoverageFixture();
    mutate(inputs.coverage.requirements[0]);
    assert.throws(() => validatePendingCoverage(inputs));
  }
});

test("shard selection is exact and writes a separate aggregate", async (t) => {
  const {root, options} = await fixture(t);
  const result = await materializeReleaseRuntimeAcquisitionPlans({
    ...options,
    shardId: "g05-l04-host-language",
  });
  assert.equal(result.members, 15);
  assert.equal(result.summary.pairedFlaAndSwfCount, 11);
  assert.equal(result.summary.swfOnlyCount, 4);
  assert.match(result.report.json, /g05-l04-host-language\.json$/);
  const report = JSON.parse(await readFile(path.join(root, ...result.report.json.split("/"))));
  assert.equal(report.identity.shardId, "g05-l04-host-language");
  assert.equal(report.scope.selectedMemberCount, 15);
  assert.deepEqual(report.scope.selectedOrdinals, [...Array(14).keys()].map((value) => value + 1).concat(55));
});

test("all-member identity drift fails before the first artifact write", async (t) => {
  const {root, options, release} = await fixture(t);
  const last = release.members.at(-1);
  const manifestPath = path.join(root, "migrations", last.animationId, "migration.json");
  const manifest = JSON.parse(await readFile(manifestPath));
  manifest.assetId = `swf-${"0".repeat(64)}`;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await assert.rejects(
    materializeReleaseRuntimeAcquisitionPlans(options),
    /migration assetId mismatch/,
  );
  await assert.rejects(
    readFile(path.join(root, "migrations", release.members[0].animationId, WORKSPACE_ARTIFACT_RELATIVE)),
    {code: "ENOENT"},
  );
});

test("non-root defaults require an exact fail-closed source-static candidate boundary", async (t) => {
  const {root, options, release} = await fixture(t);
  const candidate = release.members.find(
    ({animationId}) => animationId === "course-g05-l04-rw-003",
  );
  const manifestPath = path.join(
    root,
    "migrations",
    candidate.animationId,
    "migration.json",
  );
  const manifest = JSON.parse(await readFile(manifestPath));
  assert.equal(manifest.implementation.defaultFrameDomainId, "sprite-535");
  manifest.implementation.candidateState.originalRuntimeBaselineUsed = true;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await assert.rejects(
    materializeReleaseRuntimeAcquisitionPlans(options),
    /non-root default frame domain is not a bounded source-static engineering candidate/,
  );
  await assert.rejects(
    readFile(
      path.join(
        root,
        "migrations",
        release.members[0].animationId,
        WORKSPACE_ARTIFACT_RELATIVE,
      ),
    ),
    {code: "ENOENT"},
  );
});

test("bounded source-static prefixes require one exact fail-closed tail range", () => {
  const frameDomain = {id: "sprite-436", kind: "nested", frameCount: 320};
  const candidate = {
    status: "current-javascript-engineering-candidate-only",
    sourceStaticFrameDomain: "sprite-436",
    sourceStaticRenderableFrames: {
      firstFrame: 1,
      lastFrame: 307,
      frameCount: 307,
    },
    blockedLocalFrameRanges: [{firstFrame: 308, lastFrame: 320}],
    renderedFrameCount: 307,
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
  };
  assert.equal(validateSourceStaticCandidateBoundary({candidate, frameDomain}), true);

  for (const mutate of [
    (value) => { value.sourceStaticRenderableFrames.firstFrame = 2; },
    (value) => { value.sourceStaticRenderableFrames.lastFrame = 308; },
    (value) => { value.blockedLocalFrameRanges[0].firstFrame = 309; },
    (value) => { value.blockedLocalFrameRanges[0].lastFrame = 319; },
    (value) => { value.blockedLocalFrameRanges.push({firstFrame: 1, lastFrame: 1}); },
    (value) => { value.renderedFrameCount = 320; },
  ]) {
    const drifted = structuredClone(candidate);
    mutate(drifted);
    assert.equal(
      validateSourceStaticCandidateBoundary({candidate: drifted, frameDomain}),
      false,
    );
  }
});

test("operator receipt cannot open capacity, host, session, or execution authority", async (t) => {
  const {root, options, release} = await fixture(t);
  const receiptPath = options.operatorAssignmentReceiptPath;
  const receipt = JSON.parse(await readFile(receiptPath));
  receipt.authorityBoundary.originalRuntimeExecutionAuthorizedByThisReceiptAlone = true;
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  await assert.rejects(
    materializeReleaseRuntimeAcquisitionPlans(options),
    /improperly opens originalRuntimeExecutionAuthorizedByThisReceiptAlone/,
  );
  await assert.rejects(
    readFile(path.join(root, "migrations", release.members[0].animationId, WORKSPACE_ARTIFACT_RELATIVE)),
    {code: "ENOENT"},
  );
});

test("check detects planning artifact drift without touching canonical inputs", async (t) => {
  const {root, options, release} = await fixture(t);
  await materializeReleaseRuntimeAcquisitionPlans(options);
  const first = release.members[0];
  const artifactPath = path.join(root, "migrations", first.animationId, WORKSPACE_ARTIFACT_RELATIVE);
  const manifestPath = path.join(root, "migrations", first.animationId, "migration.json");
  const manifestBefore = await readFile(manifestPath);
  await writeFile(artifactPath, `${await readFile(artifactPath, "utf8")} `);
  await assert.rejects(
    materializeReleaseRuntimeAcquisitionPlans({...options, check: true}),
    /runtime planning artifacts or reports are stale/,
  );
  assert.deepEqual(await readFile(manifestPath), manifestBefore);
});

test("CLI accepts only bounded planning controls", () => {
  assert.deepEqual(parseArguments(["--release-id", releaseId]), {releaseId});
  assert.deepEqual(parseArguments([
    "--release-id",
    releaseId,
    "--operator-assignment-receipt",
    "catalog/operator.json",
  ]), {
    releaseId,
    operatorAssignmentReceiptPath: "catalog/operator.json",
  });
  assert.equal(parseArguments([
    "--release-id",
    releaseId,
    "--shard-id",
    "g05-l04-instruction",
    "--check",
  ]).check, true);
  assert.throws(() => parseArguments([]), /--release-id/);
  assert.throws(() => parseArguments(["--release-id", "../escape"]), /lowercase letters/);
  assert.throws(() => parseArguments(["--release-id", releaseId, "--dry-run", "--check"]), /mutually exclusive/);
  assert.throws(() => parseArguments(["--release-id", releaseId, "--launch"]), /Unknown option/);
  assert.throws(() => parseArguments(["--release-id", releaseId, "--operator", "name"]), /Unknown option/);
  assert.throws(() => parseArguments(["--release-id", releaseId, "--approve"]), /Unknown option/);
});
