import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  link,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildG5L4OriginalRuntimeContainmentReadiness,
  parseArguments,
  readFileRecord,
  renderMarkdown,
  stableJson,
  validateG5L4OriginalRuntimeContainmentReadiness,
  writeOrCheck,
} from "./build-g5-l4-original-runtime-containment-readiness.mjs";

let reportPromise;
function buildOnce() {
  reportPromise ||= buildG5L4OriginalRuntimeContainmentReadiness();
  return reportPromise;
}

function refingerprint(report) {
  const projection = structuredClone(report);
  delete projection.reportFingerprintSha256;
  report.reportFingerprintSha256 = createHash("sha256")
    .update(stableJson(projection))
    .digest("hex");
}

async function withTemporaryRoot(callback) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l4-containment-test-"),
  );
  try {
    return await callback(root);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
}

test("binds the exact release, planning and runtime-mechanism candidate evidence, operator and Owner default-policy receipts, and four static scenarios", async () => {
  const report = validateG5L4OriginalRuntimeContainmentReadiness(
    await buildOnce(),
  );
  assert.equal(report.scope.releaseMemberCount, 55);
  assert.equal(report.scope.activeXmlReferencedPageCount, 54);
  assert.equal(report.scope.courseShellCount, 1);
  assert.equal(
    report.sourceBindings.runtimePlanningReadiness.reportType,
    "release-runtime-acquisition-planning-readiness",
  );
  assert.equal(
    report.sourceBindings.runtimeMechanismCandidateReadiness.reportType,
    "g5-l4-runtime-mechanism-candidate-readiness",
  );
  assert.match(
    report.sourceBindings.runtimeMechanismCandidateReadiness.path,
    /runtime-mechanism-candidate-readiness\.json$/,
  );
  assert.match(
    report.sourceBindings.operatorAssignmentReceipt.path,
    /original-runtime-animate-operator-assignment/,
  );
  assert.equal(
    report.sourceBindings.ownerDefaultBlockersAuthorizationReceipt.path,
    "catalog/owner-authorizations/g5-l4-owner-default-blockers-2-4-authorization-2026-07-29.json",
  );
  assert.equal(
    report.sourceBindings.ownerDefaultBlockersAuthorizationReceipt.evidenceType,
    "g5-l4-user-stated-owner-default-blockers-2-4-authorization-intake",
  );
  assert.equal(
    report.sourceBindings.ownerWorkAuthorizationReceipt.path,
    "catalog/owner-authorizations/g5-l4-owner-continuation-and-prospective-approval-intake-2026-08-01.json",
  );
  assert.equal(
    report.sourceBindings.ownerWorkAuthorizationReceipt.evidenceType,
    "g5-l4-user-stated-owner-continuation-and-prospective-approval-intake",
  );
  assert.deepEqual(
    report.sourceBindings.workStudyScenarioInventories.map(
      ({animationId}) => animationId,
    ),
    [
      "shell-course-g05-l04-index-local",
      "course-g05-l04-rw-002",
      "course-g05-l04-in-019",
      "course-g05-l04-fq-002",
    ],
  );
  assert.ok(
    report.workStudyStaticInputs.every(
      (item) =>
        item.inventoryStatus === "static-exhaustive-runtime-unverified" &&
        item.authoritativeRuntimeEvidenceCount === 0 &&
        item.migrationStatusChanged === false,
    ),
  );
});

test("records prospective Owner work permission without changing containment, execution, substitution, or acceptance authority", async () => {
  const report = await buildOnce();
  assert.equal(report.ownerWorkAuthorization.implementationWorkAuthorized, true);
  assert.equal(report.ownerWorkAuthorization.runtimeExecutionWorkAuthorized, true);
  assert.equal(
    report.ownerWorkAuthorization.runtimeExecutionWorkAuthorizationBasis,
    "user-attested-prospective-owner-direction",
  );
  assert.equal(
    report.ownerWorkAuthorization.remainingInScopeMachineWorkAuthorized,
    true,
  );
  assert.equal(report.ownerWorkAuthorization.implementationAuthorizedCountEffect, 0);
  for (const key of [
    "technicalMechanismsApproved",
    "technicalMechanismsVerified",
    "runtimeHostApproved",
    "immutableSessionAuthorizationEstablished",
    "runtimeExecutionAuthorized",
    "lessonSpecificSubstitution",
    "fidelityAccepted",
    "strictComplete",
    "publicationAuthorized",
  ]) {
    assert.equal(report.ownerWorkAuthorization[key], false, key);
  }
  assert.equal(report.summary.implementationWorkAuthorized, true);
  assert.equal(report.summary.runtimeExecutionWorkAuthorized, true);
  assert.equal(report.summary.ownerWorkAuthorizationReceiptCount, 1);

  const promoted = structuredClone(report);
  promoted.ownerWorkAuthorization.runtimeExecutionAuthorized = true;
  assert.throws(
    () => validateG5L4OriginalRuntimeContainmentReadiness(promoted),
    /runtimeExecutionAuthorized (?:must remain false|protected gate must remain false)/,
  );
});

test("records eight machine-selected offline-checked candidates without Owner approval, live verification, or runtime authority", async () => {
  const report = await buildOnce();
  assert.deepEqual(
    report.containmentPlan.controls.map(({controlId}) => controlId),
    ["CR-01", "CR-02", "CR-03", "CR-04", "CR-05", "CR-06", "CR-07", "CR-08"],
  );
  assert.ok(
    report.containmentPlan.controls.every(
      (control) =>
        control.policyApproved === true &&
        control.preparationAuthorized === true &&
        typeof control.selectedMechanism === "string" &&
        control.selectedMechanism.length > 10 &&
        control.candidateImplementationPresent === true &&
        control.offlineOrDiagnosticVerified === true &&
        control.ownerTechnicalApprovalEstablished === false &&
        control.liveSessionVerified === false &&
        control.approved === false &&
        control.verified === false,
    ),
  );
  assert.equal(report.containmentPlan.policyApproved, true);
  assert.equal(report.containmentPlan.preparationAuthorized, true);
  assert.equal(report.containmentPlan.policyApprovedControlCount, 8);
  assert.equal(report.containmentPlan.preparationAuthorizedControlCount, 8);
  assert.equal(report.containmentPlan.controlsWithSelectedMechanism, 8);
  assert.equal(
    report.containmentPlan.candidateImplementationPresentControlCount,
    8,
  );
  assert.equal(
    report.containmentPlan.offlineOrDiagnosticVerifiedControlCount,
    8,
  );
  assert.equal(report.containmentPlan.ownerTechnicalApprovalControlCount, 0);
  assert.equal(report.containmentPlan.liveSessionVerifiedControlCount, 0);
  assert.equal(report.containmentPlan.controlsApproved, 0);
  assert.equal(report.containmentPlan.controlsVerified, 0);
});

test("projects the exact Owner blockers 2-4 directive as policy/preparation authority only", async () => {
  const report = await buildOnce();
  assert.deepEqual(
    report.ownerDefaultPolicyAuthorization.blockerReferenceSet.blockerNumbers,
    [2, 3, 4],
  );
  assert.equal(
    report.ownerDefaultPolicyAuthorization.ownerDirective.byteLength,
    84,
  );
  assert.equal(
    report.ownerDefaultPolicyAuthorization.ownerDirective.sha256,
    "f9e39425a4d3ad8baafab9e3cb4020dba4c90b4ebc0c043d743d46309f8ee0ef",
  );
  assert.equal(report.ownerDefaultPolicyAuthorization.policyApproved, true);
  assert.equal(
    report.ownerDefaultPolicyAuthorization.preparationAuthorized,
    true,
  );
  assert.equal(
    report.ownerDefaultPolicyAuthorization
      .unsignedPendingOwnerSignaturePackagePreparationAuthorized,
    true,
  );
  for (const key of [
    "technicalMechanismSelectionAuthorized",
    "technicalMechanismApprovalEstablished",
    "technicalMechanismVerificationEstablished",
    "missingDependencySubstitutionAuthorized",
    "runtimeHostApprovalEstablished",
    "immutableSessionAuthorizationEstablished",
    "runtimeExecutionAuthorized",
    "animateAuditEstablished",
    "humanReviewAcceptanceEstablished",
    "ownerFidelityAcceptanceEstablished",
    "strictValidationApprovalEstablished",
    "atomicPublicationApprovalEstablished",
  ]) {
    assert.equal(report.ownerDefaultPolicyAuthorization[key], false, key);
  }
});

test("keeps CR-02 partial because both declared keyterm XML dependencies are missing", async () => {
  const report = await buildOnce();
  assert.equal(
    report.hostTreeCandidate.candidateClass,
    "materialized-incomplete-read-only-host-tree-candidate-only",
  );
  assert.equal(report.hostTreeCandidate.partialHostTreeCandidate, true);
  assert.equal(report.hostTreeCandidate.cr02TechnicalArtifactComplete, false);
  assert.equal(report.hostTreeCandidate.readOnlyHostTreeMaterialized, true);
  assert.equal(report.hostTreeCandidate.fileCount, 7);
  assert.equal(report.hostTreeCandidate.runtimeSessionsExecuted, 0);
  assert.deepEqual(
    report.hostTreeCandidate.missingDeclaredDependencies.map(
      ({path: dependencyPath, physicalPresence}) => ({
        path: dependencyPath,
        physicalPresence,
      }),
    ),
    [
      {
        path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml",
        physicalPresence: false,
      },
      {
        path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml",
        physicalPresence: false,
      },
    ],
  );
  assert.equal(
    report.hostTreeCandidate.inventedOrSubstitutedDependencyCount,
    0,
  );
});

test("binds Dr. Peter Hu only as the named role while every execution and acceptance count remains zero", async () => {
  const report = await buildOnce();
  assert.equal(report.namedOperatorRole.assigneeFullName, "Dr. Peter Hu");
  assert.equal(
    report.namedOperatorRole.roleId,
    "authorized-original-runtime-operator",
  );
  for (const key of [
    "capacityEstablished",
    "runtimeHostApproved",
    "containmentApproved",
    "immutableSessionAuthorizationEstablished",
    "sessionOperatorAttestationPresent",
    "animateGuiExecutionAuthorized",
    "originalRuntimeExecutionAuthorized",
    "actualAnimateExecutionEstablished",
    "actualOriginalRuntimeSessionEstablished",
  ]) {
    assert.equal(report.namedOperatorRole[key], false, key);
  }
  assert.equal(report.executionGate.runnable, false);
  assert.equal(report.executionGate.originalRuntimeExecutionReady, false);
  for (const key of [
    "runnableArtifactCount",
    "guiSessionsExecuted",
    "animateGuiExecutions",
    "originalRuntimeSessionsExecuted",
    "authoritativeBaselinePackagesEstablished",
    "acceptedAudioListeningSessions",
    "humanReviewsAccepted",
    "ownerFidelityAcceptances",
    "strictCompletions",
    "publications",
  ]) {
    assert.equal(report.summary[key], 0, key);
  }
  assert.ok(
    Object.values(report.acceptanceEffects).every((value) => value === false),
  );
});

test("validator rejects containment, host, operator, runtime, and acceptance authority promotion", async () => {
  const report = await buildOnce();
  const promotedControl = structuredClone(report);
  promotedControl.containmentPlan.controls[0].approved = true;
  assert.throws(
    () =>
      validateG5L4OriginalRuntimeContainmentReadiness(promotedControl),
    /machine-candidate, approval, verification, or execution boundary drifted/,
  );

  const removedSelectedMechanism = structuredClone(report);
  removedSelectedMechanism.containmentPlan.controls[1].selectedMechanism = null;
  assert.throws(
    () =>
      validateG5L4OriginalRuntimeContainmentReadiness(
        removedSelectedMechanism,
      ),
    /machine-candidate, approval, verification, or execution boundary drifted/,
  );

  const inventedLiveVerification = structuredClone(report);
  inventedLiveVerification.containmentPlan.controls[1].liveSessionVerified =
    true;
  assert.throws(
    () =>
      validateG5L4OriginalRuntimeContainmentReadiness(
        inventedLiveVerification,
      ),
    /machine-candidate, approval, verification, or execution boundary drifted/,
  );

  const removedPolicyApproval = structuredClone(report);
  removedPolicyApproval.containmentPlan.controls[0].policyApproved = false;
  assert.throws(
    () =>
      validateG5L4OriginalRuntimeContainmentReadiness(
        removedPolicyApproval,
      ),
    /machine-candidate, approval, verification, or execution boundary drifted/,
  );

  const completedHostTree = structuredClone(report);
  completedHostTree.hostTreeCandidate.cr02TechnicalArtifactComplete = true;
  assert.throws(
    () =>
      validateG5L4OriginalRuntimeContainmentReadiness(completedHostTree),
    /completed or promoted/,
  );

  const promotedOperator = structuredClone(report);
  promotedOperator.namedOperatorRole.capacityEstablished = true;
  assert.throws(
    () =>
      validateG5L4OriginalRuntimeContainmentReadiness(promotedOperator),
    /capacityEstablished must remain false/,
  );

  const runnable = structuredClone(report);
  runnable.executionGate.runnable = true;
  assert.throws(
    () => validateG5L4OriginalRuntimeContainmentReadiness(runnable),
    /execution gate identity drifted|executionGate\.runnable protected gate must remain false/,
  );

  const accepted = structuredClone(report);
  accepted.acceptanceEffects.strictComplete = true;
  assert.throws(
    () => validateG5L4OriginalRuntimeContainmentReadiness(accepted),
    /changed an acceptance gate|acceptanceEffects\.strictComplete protected gate must remain false/,
  );

  for (const mutate of [
    (value) => { value.runtimeExecutionAuthorized = true; },
    (value) => { value.summary.runtimeExecutionAuthorized = true; },
    (value) => { value.acceptanceEffects.runtimeExecutionAuthorized = true; },
    (value) => { value.sourceBindings.runtimeExecutionAuthorized = true; },
    (value) => { value.identity.strictComplete = true; },
  ]) {
    const injected = structuredClone(report);
    mutate(injected);
    refingerprint(injected);
    assert.throws(
      () => validateG5L4OriginalRuntimeContainmentReadiness(injected),
      /exact key set drifted|protected gate must remain false/,
    );
  }
});

test("input reader rejects symlinks and hardlinks", async () => {
  await withTemporaryRoot(async (root) => {
    await mkdir(path.join(root, "evidence"));
    await writeFile(path.join(root, "source.json"), "{}\n");
    await symlink(
      path.join(root, "source.json"),
      path.join(root, "evidence", "symlink.json"),
    );
    assert.rejects(
      readFileRecord(root, "evidence/symlink.json"),
      /ordinary non-linked file/,
    );

    await link(
      path.join(root, "source.json"),
      path.join(root, "evidence", "hardlink.json"),
    );
    assert.rejects(
      readFileRecord(root, "evidence/hardlink.json"),
      /ordinary non-linked file/,
    );
  });
});

test("writer rejects symlink and hardlink targets without modifying their referents", async () => {
  const report = await buildOnce();
  await withTemporaryRoot(async (root) => {
    await mkdir(path.join(root, "reports"));
    const referent = path.join(root, "referent.txt");
    await writeFile(referent, "do-not-change\n");
    await symlink(referent, path.join(root, "reports", "unsafe.json"));
    await assert.rejects(
      writeOrCheck({
        report,
        projectRoot: root,
        outputPrefix: "reports/unsafe",
      }),
      /output target must be one ordinary non-linked file/,
    );
    assert.equal(await readFile(referent, "utf8"), "do-not-change\n");
  });

  await withTemporaryRoot(async (root) => {
    await mkdir(path.join(root, "reports"));
    const referent = path.join(root, "referent.txt");
    await writeFile(referent, "do-not-change\n");
    await link(referent, path.join(root, "reports", "unsafe.json"));
    await assert.rejects(
      writeOrCheck({
        report,
        projectRoot: root,
        outputPrefix: "reports/unsafe",
      }),
      /output target must be one ordinary non-linked file/,
    );
    assert.equal(await readFile(referent, "utf8"), "do-not-change\n");
  });
});

test("writer atomically restores the prior pair on failure and --check verifies deterministic output", async () => {
  const report = await buildOnce();
  await withTemporaryRoot(async (root) => {
    await mkdir(path.join(root, "reports"));
    const options = {
      report,
      projectRoot: root,
      outputPrefix: "reports/containment",
    };
    const written = await writeOrCheck(options);
    assert.equal(written.action, "written");
    const jsonPath = path.join(root, "reports", "containment.json");
    const markdownPath = path.join(root, "reports", "containment.md");
    assert.equal(await readFile(jsonPath, "utf8"), stableJson(report));
    assert.equal(await readFile(markdownPath, "utf8"), renderMarkdown(report));

    const before = await Promise.all([
      readFile(jsonPath, "utf8"),
      readFile(markdownPath, "utf8"),
    ]);
    await assert.rejects(
      writeOrCheck({
        ...options,
        transactionHook: ({index}) => {
          if (index === 1) throw new Error("injected transaction failure");
        },
      }),
      /injected transaction failure/,
    );
    assert.deepEqual(
      await Promise.all([
        readFile(jsonPath, "utf8"),
        readFile(markdownPath, "utf8"),
      ]),
      before,
    );

    const checked = await writeOrCheck({...options, check: true});
    assert.equal(checked.action, "verified");
  });
});

test("CLI permits deterministic output/check only and rejects launch, approval, and unsafe paths", () => {
  assert.deepEqual(parseArguments(["--check"]), {
    check: true,
    outputPrefix: "reports/g5-l4-original-runtime-containment-readiness",
  });
  assert.equal(
    parseArguments([
      "--output-prefix",
      "reports/test-containment",
    ]).outputPrefix,
    "reports/test-containment",
  );
  assert.throws(
    () => parseArguments(["--output-prefix"]),
    /requires a value/,
  );
  assert.throws(() => parseArguments(["--launch"]), /Unknown option/);
  assert.throws(() => parseArguments(["--approve"]), /Unknown option/);
  assert.throws(
    () => parseArguments(["--output-prefix", "../outside"]),
    /below reports/,
  );
  assert.throws(
    () => parseArguments(["--output-prefix", "reports/a.json"]),
    /extensionless/,
  );
});
