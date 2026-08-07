import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
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

import {
  buildReport,
  derivePromotionLedgerReadiness,
  parseArguments,
  renderMarkdown,
  selectGovernance,
  stableJson,
  validateM1AuthorizationReceipt,
  validateM0OwnerGovernanceReceipt,
  validateOriginalRuntimeOperatorAssignmentReceipt,
  writeOrCheck,
} from "./build-lesson-release-m0-readiness.mjs";

const releaseId = "lesson-g05-l04-number-lines";
const outputPrefix = "reports/g5-l4-m0-governance-readiness";

test("M0 governance schema v4 binds one consolidated directive while keeping budget fail closed", async () => {
  const catalog = JSON.parse(
    await readFile("catalog/lesson-release-m0-governance.json", "utf8"),
  );
  const entry = selectGovernance(catalog, releaseId);
  assert.equal(entry.requiredOwnerDecisions.length, 4);
  assert.equal(entry.requiredRoles.length, 6);
  assert.equal(entry.budgetDecision.personnelRateCeilingUsdPerHour, null);
  assert.equal(entry.budgetDecision.totalBudgetEnvelopeUsd, null);
  assert.equal(entry.budgetDecision.procurementPaymentCycle, null);

  const promoted = structuredClone(catalog);
  promoted.releases[0].budgetDecision.personnelRateCeilingUsdPerHour = 100;
  assert.throws(
    () => selectGovernance(promoted, releaseId),
    /budget defaults must remain fail-closed/,
  );
});

async function jsonFileBinding(relativePath) {
  const value = await readFile(relativePath);
  return {
    path: relativePath,
    bytes: value.length,
    sha256: createHash("sha256").update(value).digest("hex"),
    value: JSON.parse(value.toString("utf8")),
  };
}

async function rawFileBinding(relativePath) {
  const value = await readFile(relativePath);
  return {
    path: relativePath,
    bytes: value.length,
    sha256: createHash("sha256").update(value).digest("hex"),
    value,
  };
}

async function currentAuthorizationInputs() {
  const [governanceCatalog, receiptBinding, releaseBinding, sourceScopeBinding] = await Promise.all([
    readFile("catalog/lesson-release-m0-governance.json", "utf8").then(JSON.parse),
    jsonFileBinding("catalog/owner-authorizations/g5-l4-m1-owner-authorization-2026-07-28.json"),
    jsonFileBinding("catalog/lesson-releases.json"),
    jsonFileBinding("reports/g5-l4-source-scope-freeze.json"),
  ]);
  return {
    receipt: receiptBinding.value,
    receiptBinding,
    releaseId,
    governance: selectGovernance(governanceCatalog, releaseId),
    releaseBinding,
    sourceScopeBinding,
  };
}

async function currentOperatorAssignmentInputs() {
  const [
    governanceCatalog,
    receiptBinding,
    m1AuthorizationBinding,
    releaseBinding,
    sourceScopeBinding,
  ] = await Promise.all([
    readFile("catalog/lesson-release-m0-governance.json", "utf8").then(JSON.parse),
    jsonFileBinding("catalog/owner-authorizations/g5-l4-original-runtime-animate-operator-assignment-2026-07-28.json"),
    jsonFileBinding("catalog/owner-authorizations/g5-l4-m1-owner-authorization-2026-07-28.json"),
    jsonFileBinding("catalog/lesson-releases.json"),
    jsonFileBinding("reports/g5-l4-source-scope-freeze.json"),
  ]);
  return {
    receipt: receiptBinding.value,
    receiptBinding,
    releaseId,
    governance: selectGovernance(governanceCatalog, releaseId),
    releaseBinding,
    sourceScopeBinding,
    m1AuthorizationBinding,
    m1AuthorizationReceipt: m1AuthorizationBinding.value,
  };
}

async function currentM0GovernanceInputs() {
  const [
    governanceCatalog,
    receiptBinding,
    roadmapBinding,
    releaseBinding,
    sourceScopeBinding,
    sourceGapBinding,
    m1AuthorizationBinding,
    operatorAssignmentBinding,
  ] = await Promise.all([
    readFile("catalog/lesson-release-m0-governance.json", "utf8").then(JSON.parse),
    jsonFileBinding("catalog/owner-authorizations/g5-l4-m0-owner-governance-intake-2026-07-28.json"),
    rawFileBinding("outputs/help-math-2-product-deployment-district-pilot-roadmap-2026-2027.zh.md"),
    jsonFileBinding("catalog/lesson-releases.json"),
    jsonFileBinding("reports/g5-l4-source-scope-freeze.json"),
    jsonFileBinding("reports/g5-l4-source-gap-forensics.json"),
    jsonFileBinding("catalog/owner-authorizations/g5-l4-m1-owner-authorization-2026-07-28.json"),
    jsonFileBinding("catalog/owner-authorizations/g5-l4-original-runtime-animate-operator-assignment-2026-07-28.json"),
  ]);
  return {
    receipt: receiptBinding.value,
    receiptBinding,
    releaseId,
    governance: selectGovernance(governanceCatalog, releaseId),
    roadmapBinding,
    releaseBinding,
    sourceScopeBinding,
    sourceGapBinding,
    m1AuthorizationBinding,
    m1AuthorizationReceipt: m1AuthorizationBinding.value,
    operatorAssignmentBinding,
    operatorAssignmentReceipt: operatorAssignmentBinding.value,
  };
}

test("M1 authorization validates exact Owner directive and rejects scope or authority drift", async () => {
  const inputs = await currentAuthorizationInputs();
  const authorization = validateM1AuthorizationReceipt(inputs);
  assert.equal(authorization.authorizedPhase, "M1");
  assert.equal(authorization.owner.fullName, "Dr. Peter Hu");
  assert.equal(authorization.machineOnly, true);
  assert.equal(authorization.implementationAuthorized, false);
  assert.equal(authorization.originalRuntimeAuthorized, false);
  assert.equal(authorization.fidelityAcceptanceEstablished, false);

  const cases = [
    ["release", (copy) => { copy.receipt.releaseId = "lesson-g05-l05"; }, /belongs to/],
    ["phase", (copy) => { copy.receipt.authorization.phase = "M2"; }, /not for M1/],
    ["directive hash", (copy) => { copy.receipt.ownerStatement.sha256 = "0".repeat(64); }, /statement SHA-256 drifted/],
    ["source path", (copy) => { copy.receipt.sourceBindingsAtIntake.sourceScopeFreeze.path = "reports/other.json"; }, /source-scope binding drifted/],
    ["runtime authority", (copy) => { copy.receipt.authorityBoundary.originalRuntimeExecutionAuthorizedByThisIntakeAlone = true; }, /crossed the originalRuntimeExecutionAuthorizedByThisIntakeAlone boundary/],
    ["descriptor hash", (copy) => { copy.governance.m1AuthorizationReceipt.sha256 = "f".repeat(64); }, /descriptor drifted/],
  ];
  for (const [label, mutate, pattern] of cases) {
    const copy = structuredClone(inputs);
    mutate(copy);
    assert.throws(() => validateM1AuthorizationReceipt(copy), pattern, label);
  }
});

test("primary original-runtime/Animate operator assignment is exact and grants no execution authority", async () => {
  const inputs = await currentOperatorAssignmentInputs();
  const assignment = validateOriginalRuntimeOperatorAssignmentReceipt(inputs);
  assert.equal(assignment.roleId, "authorized-original-runtime-operator");
  assert.equal(assignment.slot, "primary");
  assert.equal(assignment.assignee.fullName, "Dr. Peter Hu");
  assert.equal(assignment.capacity.established, false);
  assert.equal(assignment.runtimeHostApproved, false);
  assert.equal(assignment.containmentApproved, false);
  assert.equal(assignment.immutableSessionAuthorizationEstablished, false);
  assert.equal(assignment.animateGuiAuthorized, false);
  assert.equal(assignment.originalRuntimeAuthorized, false);
  assert.equal(assignment.actualAnimateExecutionEstablished, false);
  assert.equal(assignment.actualOriginalRuntimeSessionEstablished, false);

  const cases = [
    ["statement hash", (copy) => { copy.receipt.ownerStatement.sha256 = "0".repeat(64); }, /statement SHA-256 drifted/],
    ["assignee", (copy) => { copy.receipt.assignment.assigneeFullName = "Someone Else"; }, /assignee does not match/],
    ["capacity", (copy) => {
      copy.receipt.capacity.committedHoursPerWeek = 20;
      copy.receipt.capacity.status = "committed";
    }, /unstated weekly capacity/],
    ["duties", (copy) => { copy.receipt.assignment.duties.pop(); }, /duties are incomplete/],
    ["cryptographic identity", (copy) => {
      copy.receipt.authorityBoundary.assigneeIdentityCryptographicallyVerified = true;
    }, /invented cryptographic identity/],
    ["slot count", (copy) => {
      copy.receipt.authorityBoundary.namedRoleSlotCountEffect = 2;
    }, /count effect must be exactly one/],
    ["external signature", (copy) => {
      copy.receipt.externalSignatureEnvelope = {signature: "invented"};
    }, /cannot claim an external signature/],
    ["runtime host", (copy) => { copy.receipt.authorityBoundary.runtimeHostApproved = true; }, /crossed the runtimeHostApproved boundary/],
    ["session authority", (copy) => {
      copy.receipt.authorityBoundary.immutableSessionAuthorizationEstablished = true;
    }, /crossed the immutableSessionAuthorizationEstablished boundary/],
    ["runtime execution", (copy) => {
      copy.receipt.authorityBoundary.originalRuntimeExecutionAuthorizedByThisReceiptAlone = true;
    }, /crossed the originalRuntimeExecutionAuthorizedByThisReceiptAlone boundary/],
    ["review", (copy) => {
      copy.receipt.authorityBoundary.humanReviewAccepted = true;
    }, /crossed the humanReviewAccepted boundary/],
    ["descriptor", (copy) => {
      copy.governance.requiredRoles[0].primaryAssignmentReceipt.sha256 = "f".repeat(64);
    }, /descriptor drifted/],
  ];
  for (const [label, mutate, pattern] of cases) {
    const copy = structuredClone(inputs);
    mutate(copy);
    assert.throws(() => validateOriginalRuntimeOperatorAssignmentReceipt(copy), pattern, label);
  }
});

test("consolidated Owner governance intake records all directives and slots without closing M0", async () => {
  const inputs = await currentM0GovernanceInputs();
  const intake = validateM0OwnerGovernanceReceipt(inputs);
  assert.equal(intake.owner.fullName, "Dr. Peter Hu");
  assert.equal(intake.roadmapSignoff.userAttested, true);
  assert.equal(intake.roadmapSignoff.portableExternalSignatureVerified, false);
  assert.equal(intake.decisions.length, 4);
  assert.equal(
    intake.decisions.filter(({m0RequirementSatisfied}) => m0RequirementSatisfied).length,
    2,
  );
  assert.equal(intake.staffingCapacity.slots.length, 12);
  assert.ok(
    intake.staffingCapacity.slots.every(
      ({committedHoursPerWeek}) => committedHoursPerWeek === 1,
    ),
  );
  assert.equal(intake.staffingCapacity.hoursAreAdditiveAcrossSlots, false);
  assert.equal(intake.staffingCapacity.distinctBackupCoverageClaimed, false);
  assert.equal(intake.budgetDefaultSelection.personnelRateCeilingUsdPerHour, null);
  assert.equal(intake.budgetDefaultSelection.totalBudgetEnvelopeUsd, null);
  assert.equal(intake.budgetDefaultSelection.procurementPaymentCycle, null);
  assert.equal(intake.authorityBoundary.m0ExitEstablished, false);
  assert.equal(intake.authorityBoundary.strictCompletionEstablished, false);
  assert.equal(intake.authorityBoundary.publicationAuthorized, false);

  const cases = [
    ["statement", (copy) => {
      copy.receipt.ownerStatements[1].sha256 = "0".repeat(64);
    }, /statement SHA-256 drifted/],
    ["slot hours", (copy) => {
      copy.receipt.staffingCapacity.slots[0].committedHoursPerWeek = 20;
    }, /staffing slot .* drifted/],
    ["budget", (copy) => {
      copy.receipt.budgetDefaultSelection.totalBudgetEnvelopeUsd = 1;
    }, /invented a numeric, cycle, spend, or payment authority/],
    ["external signature", (copy) => {
      copy.receipt.externalSignatureEnvelope = {signature: "invented"};
    }, /cannot claim an external signature envelope/],
    ["M0 promotion", (copy) => {
      copy.receipt.authorityBoundary.m0ExitEstablished = true;
    }, /authority boundary drifted/],
    ["descriptor", (copy) => {
      copy.governance.staffingCapacityReceipt.sha256 = "f".repeat(64);
    }, /descriptor drifted/],
  ];
  for (const [label, mutate, pattern] of cases) {
    const copy = structuredClone(inputs);
    mutate(copy);
    assert.throws(() => validateM0OwnerGovernanceReceipt(copy), pattern, label);
  }
});

test("Owner-packet readiness is release-scoped while global drift remains separately fail-closed", () => {
  const promotion = {
    ledgerReproducibility: {
      allCurrent: true,
      completionLedger: {current: true},
      releaseLedger: {current: true},
    },
    releaseScopedProjection: {current: true},
    release: {ledgerBindingsCurrent: true, ledgerRowPresent: true},
    readiness: {
      inputLedgersReproducible: true,
      releaseScopedProjectionCurrent: true,
    },
  };
  assert.deepEqual(derivePromotionLedgerReadiness(promotion), {
    globalInputLedgersReproducible: true,
    releaseScopedLedgerCurrent: true,
    ownerPacketReady: true,
  });

  const unrelatedGlobalDrift = structuredClone(promotion);
  unrelatedGlobalDrift.ledgerReproducibility.allCurrent = false;
  unrelatedGlobalDrift.ledgerReproducibility.completionLedger.current = false;
  unrelatedGlobalDrift.ledgerReproducibility.releaseLedger.current = false;
  unrelatedGlobalDrift.readiness.inputLedgersReproducible = false;
  assert.deepEqual(derivePromotionLedgerReadiness(unrelatedGlobalDrift), {
    globalInputLedgersReproducible: false,
    releaseScopedLedgerCurrent: true,
    ownerPacketReady: true,
  });

  const targetDrift = structuredClone(promotion);
  targetDrift.releaseScopedProjection.current = false;
  targetDrift.readiness.releaseScopedProjectionCurrent = false;
  assert.equal(derivePromotionLedgerReadiness(targetDrift).ownerPacketReady, false);
});

test("G5 L4 Owner packet recognizes bounded M1 authorization and never closes M0", async () => {
  const report = await buildReport({releaseId});
  assert.equal(
    report.summary.machinePacketReadyForOwnerReview,
    report.machinePacket.promotionSecurity.releaseScopedLedgerCurrent,
  );
  assert.equal(report.machinePacket.frozenRelease.members, 55);
  assert.equal(report.machinePacket.frozenRelease.pages, 54);
  assert.equal(report.machinePacket.frozenRelease.shells, 1);
  assert.equal(report.machinePacket.frozenRelease.exclusions, 10);
  assert.equal(report.machinePacket.workspaces.draftValidationPassed, 55);
  assert.equal(report.machinePacket.workspaces.implementationStarted, 52);
  assert.equal(report.summary.m0ExitReady, false);
  assert.equal(report.summary.m1StartAuthorized, true);
  assert.equal(report.phaseAuthorization.owner.fullName, "Dr. Peter Hu");
  assert.equal(report.phaseAuthorization.machineOnly, true);
  assert.equal(report.schemaVersion, 4);
  assert.equal(report.ownerGovernance.roadmapSignoff.userAttested, true);
  assert.equal(
    report.ownerGovernance.roadmapSignoff.portableExternalSignatureVerified,
    false,
  );
});

test("all twelve role intents are bound while capacity, backup, execution, review, and budget gates stay open", async () => {
  const report = await buildReport({releaseId});
  assert.equal(report.summary.ownerDecisionReceiptCount, 4);
  assert.equal(report.summary.ownerDecisionM0SatisfiedCount, 2);
  assert.equal(report.summary.requiredOwnerDecisionCount, 4);
  assert.equal(report.summary.namedRoleAssignmentReceiptCount, 12);
  assert.equal(report.summary.requiredNamedRoleSlotCount, 12);
  assert.equal(report.summary.ownerAttestedNamedRoleAssignmentCount, 12);
  assert.equal(report.summary.portableExternallyVerifiedNamedRoleAssignmentCount, 0);
  assert.equal(report.summary.weeklyCapacityCommitmentCount, 12);
  assert.equal(report.summary.capacityFloorSatisfiedCount, 0);
  assert.equal(report.summary.effectiveBackupCoverageCount, 0);
  assert.equal(report.summary.roleBackupHourFloorSpecifiedCount, 1);
  assert.equal(report.summary.unresolvedBackupHourFloorCount, 5);
  assert.equal(report.summary.budgetGateApprovedCount, 0);
  assert.equal(report.summary.budgetGateCount, 3);
  const assigned = report.roleSlots.filter(({assignmentReceipt}) => assignmentReceipt !== null);
  assert.equal(assigned.length, 12);
  assert.equal(assigned[0].roleId, "authorized-original-runtime-operator");
  assert.equal(assigned[0].assignment, "primary");
  assert.ok(assigned.every(({assignee}) => assignee.fullName === "Dr. Peter Hu"));
  assert.ok(assigned.every(({committedHoursPerWeek}) => committedHoursPerWeek === 1));
  assert.ok(
    assigned.every(({capacityCommitmentEstablished}) => capacityCommitmentEstablished),
  );
  assert.ok(assigned.every(({capacityFloorSatisfied}) => !capacityFloorSatisfied));
  assert.ok(
    assigned
      .filter(({assignment}) => assignment === "backup")
      .every(({effectiveBackupCoverageEstablished}) =>
        effectiveBackupCoverageEstablished === false),
  );
  assert.equal(report.roleAssignments.length, 1);
  assert.equal(report.roleAssignments[0].animateGuiAuthorized, false);
  assert.equal(report.roleAssignments[0].originalRuntimeAuthorized, false);
  assert.ok(report.budget.gates.every(({approved, value}) => !approved && value === null));
  assert.deepEqual(report.acceptanceEffects, {
    m0Closed: false,
    m1Authorized: true,
    implementationAuthorized: false,
    authoritativeOriginalRuntime: false,
    humanReviewAccepted: false,
    ownerAccepted: false,
    strictComplete: false,
    published: false,
  });
});

test("runtime, audio, authoring, and promotion gates remain fail-closed", async () => {
  const report = await buildReport({releaseId});
  assert.equal(report.machinePacket.audio.candidatesHashVerified, 135);
  assert.equal(report.machinePacket.audio.spokenLanguageEstablished, 0);
  assert.equal(report.machinePacket.authoring.stagingCopiesVerified, 44);
  assert.equal(report.machinePacket.authoring.authoringAudits, 0);
  assert.equal(report.machinePacket.runtime.emptyWorksheets, 55);
  assert.equal(report.machinePacket.runtime.namedOperatorRoleAssignments, 1);
  assert.equal(report.machinePacket.runtime.plansWithNamedOperatorRoleAssignment, 55);
  assert.equal(report.machinePacket.runtime.sessionOperatorAttestations, 0);
  assert.equal(report.machinePacket.runtime.authoritativeSessions, 0);
  assert.equal(report.machinePacket.runtime.totalCoverageKnownMembers, 0);
  assert.equal(report.machinePacket.promotionSecurity.syntheticTestsPassed, 209);
  assert.equal(report.machinePacket.promotionSecurity.productionFusesClosed, true);
  assert.equal(report.machinePacket.promotionSecurity.productionWriterReady, false);
  assert.equal(
    report.machinePacket.promotionSecurity.globalInputLedgersReproducible,
    report.machinePacket.promotionSecurity.globalCompletionLedgerCurrent &&
      report.machinePacket.promotionSecurity.globalReleaseLedgerCurrent,
  );
});

test("checked M0 packet is deterministic and output cannot escape reports", async () => {
  const report = await buildReport({releaseId});
  assert.equal(await writeOrCheck({report, outputPrefix, check: true}), "checked");
  assert.throws(
    () => parseArguments(["--release-id", releaseId, "--output-prefix", "../escape"]),
    /must stay below reports/,
  );
});

test("M0 JSON and Markdown outputs roll back together when the later commit fails", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-m0-rollback-"));
  await mkdir(path.join(root, "reports"));
  const prefix = "reports/m0";
  const jsonPath = path.join(root, `${prefix}.json`);
  const markdownPath = path.join(root, `${prefix}.md`);
  const beforeJson = "original JSON bytes\n";
  const beforeMarkdown = "original Markdown bytes\n";
  await writeFile(jsonPath, beforeJson);
  await writeFile(markdownPath, beforeMarkdown);
  const report = await buildReport({releaseId});
  try {
    await assert.rejects(
      writeOrCheck({
        report,
        outputPrefix: prefix,
        outputRoot: root,
        check: false,
        transactionHooks: {
          beforeCommit: ({index}) => {
            if (index === 1) throw new Error("injected Markdown commit failure");
          },
        },
      }),
      /injected Markdown commit failure/,
    );
    assert.equal(await readFile(jsonPath, "utf8"), beforeJson);
    assert.equal(await readFile(markdownPath, "utf8"), beforeMarkdown);
    assert.deepEqual((await readdir(path.join(root, "reports"))).sort(), ["m0.json", "m0.md"]);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("M0 output preparation rejects linked targets and ancestors before external writes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-m0-links-"));
  const outside = await mkdtemp(path.join(os.tmpdir(), "helpmath-m0-outside-"));
  const report = await buildReport({releaseId});
  try {
    await mkdir(path.join(root, "reports"));
    await symlink(outside, path.join(root, "reports", "linked-parent"));
    await assert.rejects(
      writeOrCheck({
        report,
        outputPrefix: "reports/linked-parent/m0",
        outputRoot: root,
        check: false,
      }),
      /output ancestor must be an ordinary directory/,
    );
    assert.deepEqual(await readdir(outside), []);

    const protectedPath = path.join(root, "protected.json");
    await writeFile(protectedPath, "protected bytes\n");
    await link(protectedPath, path.join(root, "reports", "hard.json"));
    await assert.rejects(
      writeOrCheck({
        report,
        outputPrefix: "reports/hard",
        outputRoot: root,
        check: false,
      }),
      /must not be hard-linked/,
    );
    assert.equal(await readFile(protectedPath, "utf8"), "protected bytes\n");
  } finally {
    await rm(root, {recursive: true, force: true});
    await rm(outside, {recursive: true, force: true});
  }
});

test("M0 cleanup failure never rolls back an already committed pair", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-m0-cleanup-"));
  await mkdir(path.join(root, "reports"));
  const prefix = "reports/m0";
  const jsonPath = path.join(root, `${prefix}.json`);
  const markdownPath = path.join(root, `${prefix}.md`);
  await writeFile(jsonPath, "old JSON\n");
  await writeFile(markdownPath, "old Markdown\n");
  const report = await buildReport({releaseId});
  try {
    await assert.rejects(
      writeOrCheck({
        report,
        outputPrefix: prefix,
        outputRoot: root,
        check: false,
        transactionHooks: {
          beforeCleanup: ({index}) => {
            if (index === 1) throw new Error("injected backup cleanup failure");
          },
        },
      }),
      /outputs committed.*cleanup.*failed/,
    );
    assert.equal(await readFile(jsonPath, "utf8"), stableJson(report));
    assert.equal(await readFile(markdownPath, "utf8"), renderMarkdown(report));
    const leftovers = await readdir(path.join(root, "reports"));
    assert.equal(leftovers.some((name) => name.includes(".stage")), false);
    assert.equal(leftovers.filter((name) => name.includes(".backup")).length, 1);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("M0 rollback refuses to overwrite a concurrently changed committed output", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-m0-concurrent-"));
  await mkdir(path.join(root, "reports"));
  const prefix = "reports/m0";
  const jsonPath = path.join(root, `${prefix}.json`);
  const markdownPath = path.join(root, `${prefix}.md`);
  await writeFile(jsonPath, "old JSON\n");
  await writeFile(markdownPath, "old Markdown\n");
  const report = await buildReport({releaseId});
  try {
    await assert.rejects(
      writeOrCheck({
        report,
        outputPrefix: prefix,
        outputRoot: root,
        check: false,
        transactionHooks: {
          beforeCommit: async ({index}) => {
            if (index === 1) {
              await writeFile(jsonPath, "external concurrent bytes\n");
              throw new Error("injected late commit failure");
            }
          },
        },
      }),
      /rollback also failed.*committed output changed before rollback/,
    );
    assert.equal(await readFile(jsonPath, "utf8"), "external concurrent bytes\n");
    assert.equal(await readFile(markdownPath, "utf8"), "old Markdown\n");
    const leftovers = await readdir(path.join(root, "reports"));
    assert.equal(leftovers.some((name) => name.includes(".backup")), true);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
