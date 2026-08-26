import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildG5L5M0GovernanceReadiness,
  descriptor,
  fileRecord,
  G5_L5_AUTHORIZATION_INPUT_KEYS,
  G5_L5_OWNER_DIRECTIVE_RECEIPT_DESCRIPTOR,
  G5_L5_PROFILE_PATH,
  G5_L5_RELEASE_MANIFEST_PATH,
  jsonRecord,
  parseG5L5M0Arguments,
  renderG5L5M0Markdown,
  selectG5L5Release,
  stableJson,
  validateG5L5GovernanceProfile,
  validateG5L5M0GovernanceReport,
  writeOrCheckG5L5M0,
} from "./build-g5-l5-m0-governance-readiness.mjs";
import {
  G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
} from "./build-g5-l5-owner-governance-directive-intake.mjs";

function refingerprint(report) {
  const base = structuredClone(report);
  delete base.reportFingerprintSha256;
  report.reportFingerprintSha256 = createHash("sha256")
    .update(Buffer.from(stableJson(base)))
    .digest("hex");
}

test("G5 L5 governance profile freezes 57 members and seven roadmap-capacity roles without importing commitments", async () => {
  const [profileRecord, releaseRecord] = await Promise.all([
    jsonRecord(process.cwd(), G5_L5_PROFILE_PATH, "profile"),
    jsonRecord(process.cwd(), G5_L5_RELEASE_MANIFEST_PATH, "releases"),
  ]);
  const release = selectG5L5Release(releaseRecord.value);
  const roadmapRecord = await fileRecord(process.cwd(), profileRecord.value.roadmap.path, "roadmap");
  const profile = validateG5L5GovernanceProfile(profileRecord.value, release, descriptor(roadmapRecord));
  assert.equal(release.members.length, 57);
  assert.deepEqual(
    Object.keys(profile.authorizationInputs).sort(),
    [...G5_L5_AUTHORIZATION_INPUT_KEYS].sort(),
  );
  assert.ok(
    G5_L5_AUTHORIZATION_INPUT_KEYS.every(
      (key) => profile.authorizationInputs[key] === null,
    ),
  );
  assert.equal(profile.requiredOwnerDecisions.length, 6);
  assert.ok(profile.requiredOwnerDecisions.every(({receipt}) => receipt === null));
  assert.deepEqual(
    profile.requiredRoles.map((role) => [
      role.roleId,
      role.minimumPrimaryHoursPerWeek,
      role.minimumBackupHoursPerWeek,
    ]),
    [
      ["authorized-original-runtime-operator", 20, 8],
      ["mathematics-reviewer", 8, null],
      ["spanish-reviewer", 8, null],
      ["audio-reviewer", 8, null],
      ["independent-visual-reviewer", 8, null],
      ["owner-approver", 4, null],
      ["product-accessibility-reviewer", 8, null],
    ],
  );
  assert.ok(profile.requiredRoles.every((role) =>
    role.primaryAssignmentRequired === true &&
    role.backupAssignmentRequired === true &&
    role.committedPrimaryHoursPerWeek === null &&
    role.committedBackupHoursPerWeek === null &&
    role.primaryAssignmentReceipt === null &&
    role.backupAssignmentReceipt === null));
  assert.deepEqual(profile.roadmapCapacityBoundary, {
    sourceSection: "4.5 Fidelity capacity proof and biweekly gates",
    minimumsAreRoadmapRequiredReservations: true,
    minimumsAreInheritedCommitments: false,
    minimumsAreEstablishedCommitments: false,
    requiredPrimaryHoursPerWeekFloorTotal: 64,
    specifiedBackupHoursPerWeekFloorTotal: 8,
    rolesRequiringNamedPrimary: 7,
    rolesRequiringNamedBackup: 7,
    rolesWithOwnerPendingBackupHourFloor: 6,
    committedHourReceiptCount: 0,
  });
  assert.doesNotMatch(JSON.stringify(profile.machinePacket), /g5-l4|lesson-g05-l04/);
  assert.doesNotMatch(JSON.stringify(profile), /Dr\. Peter|Peter Hu/);
});

test("checked-in G5 L5 M0 report deterministically records bounded M1 machine-only authorization while M0 remains open", async () => {
  const report = await buildG5L5M0GovernanceReadiness();
  const [json, markdown] = await Promise.all([
    readFile("reports/g5-l5-m0-governance-readiness.json", "utf8"),
    readFile("reports/g5-l5-m0-governance-readiness.md", "utf8"),
  ]);
  assert.equal(json, stableJson(report));
  assert.equal(markdown, renderG5L5M0Markdown(report));
  assert.equal(report.release.memberCount, 57);
  assert.equal(report.machinePacket.workspaces.machineAudited, 57);
  assert.equal(report.summary.machinePacketReadyForOwnerReview, true);
  assert.equal(report.summary.ownerDecisionReceiptCount, 2);
  assert.equal(report.summary.ownerDecisionRequirementSatisfiedCount, 1);
  assert.equal(report.summary.namedRoleAssignmentReceiptCount, 0);
  assert.equal(report.summary.namedPersonCount, 0);
  assert.equal(report.summary.inheritedHourCommitmentCount, 0);
  assert.equal(report.summary.requiredRoleCount, 7);
  assert.equal(report.summary.requiredNamedRoleSlotCount, 14);
  assert.equal(report.summary.requiredPrimaryHoursPerWeekFloorTotal, 64);
  assert.equal(report.summary.specifiedBackupHoursPerWeekFloorTotal, 8);
  assert.equal(report.summary.rolesWithOwnerPendingBackupHourFloorCount, 6);
  assert.equal(report.summary.committedHourCommitmentCount, 0);
  assert.equal(report.summary.committedHoursPerWeekTotal, 0);
  assert.equal(report.roleSlots.length, 14);
  assert.ok(report.roleSlots.every((slot) =>
    slot.assignmentRequired === true &&
    slot.committedHoursPerWeek === null &&
    slot.assignee === null &&
    slot.receipt === null));
  assert.match(markdown, /\| `authorized-original-runtime-operator` \| 20 \| unset \| 8 \| unset \|/);
  assert.match(markdown, /\| `product-accessibility-reviewer` \| 8 \| unset \| Owner must set \| unset \|/);
  assert.equal(
    report.sourceBindings.ownerGovernanceDirectiveIntake.path,
    G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
  );
  assert.deepEqual(
    report.sourceBindings.ownerGovernanceDirectiveIntake,
    G5_L5_OWNER_DIRECTIVE_RECEIPT_DESCRIPTOR,
  );
  assert.deepEqual(
    report.ownerDirective.receipt,
    report.sourceBindings.ownerGovernanceDirectiveIntake,
  );
  assert.equal(report.ownerDirective.m0ExitDirectiveRecorded, true);
  assert.equal(report.ownerDirective.m0ExitEffective, false);
  assert.equal(report.ownerDirective.originalRuntimeExecutionAuthorized, false);
  assert.equal(report.ownerDirective.animateGuiExecutionAuthorized, false);
  assert.equal(report.ownerDirective.rendererImplementationAuthorized, false);
  assert.equal(report.ownerDirective.evidencePromotionAuthorized, false);
  assert.equal(report.ownerDirective.humanReviewAccepted, false);
  assert.equal(
    report.ownerDirective.ownerFidelityAcceptanceEstablished,
    false,
  );
  assert.equal(report.ownerDirective.strictCompletionEstablished, false);
  assert.equal(report.ownerDirective.publicationAuthorized, false);
  assert.equal(report.owner.m0SignoffReceipt, null);
  assert.equal(report.owner.m0ExitDirectiveRecorded, true);
  assert.equal(report.owner.m0ExitEffective, false);
  assert.deepEqual(
    report.owner.m0ExitDirectiveReceipt,
    report.sourceBindings.ownerGovernanceDirectiveIntake,
  );
  assert.equal(
    report.ownerDecisions.filter(({receipt}) => receipt !== null).length,
    2,
  );
  assert.deepEqual(
    report.ownerDecisions
      .filter(({receipt}) => receipt !== null)
      .map(({decisionId, receipt, requirementSatisfied}) => ({
        decisionId,
        receipt,
        requirementSatisfied,
      })),
    [
      {
        decisionId: "rates-budget-envelope-and-procurement-cycle-review",
        receipt: report.sourceBindings.ownerGovernanceDirectiveIntake,
        requirementSatisfied: false,
      },
      {
        decisionId: "m1-machine-foundation-start-authorization",
        receipt: report.sourceBindings.ownerGovernanceDirectiveIntake,
        requirementSatisfied: true,
      },
    ],
  );
  assert.equal(report.budget.defaultSelection.ownerSelectedRepositoryDefaults, true);
  assert.equal(
    report.budget.defaultSelection.repositoryDefinedNumericOrCycleDefaultsFound,
    false,
  );
  assert.equal(report.budget.defaultSelection.personnelRateCeilingUsdPerHour, null);
  assert.equal(report.budget.defaultSelection.totalBudgetEnvelopeUsd, null);
  assert.equal(report.budget.defaultSelection.procurementPaymentCycle, null);
  assert.equal(report.budget.defaultSelection.externalSpendAuthorized, false);
  assert.equal(report.budget.defaultSelection.procurementOrPaymentAuthorized, false);
  assert.ok(report.budget.gates.every(({approved, value}) =>
    approved === false && value === null));
  assert.equal(report.summary.m0ExitDirectiveRecorded, true);
  assert.equal(report.summary.m0ExitEffective, false);
  assert.equal(report.summary.m0ExitReady, false);
  assert.equal(report.summary.m1StartAuthorized, false);
  assert.equal(report.summary.m1MachineOnlyStaticStartAuthorized, true);
  assert.equal(report.summary.m1MachineFoundationExecutionAuthorized, false);
  assert.equal(report.summary.m1MachineOnlyStaticExecutionAuthorized, true);
  assert.equal(report.m1.startAuthorized, false);
  assert.equal(report.m1.machineOnlyStaticStartAuthorized, true);
  assert.equal(report.m1.machineFoundationExecutionAuthorized, false);
  assert.equal(report.m1.machineOnlyStaticExecutionAuthorized, true);
  assert.equal(report.m1.machineOnlyStaticScope, true);
  assert.equal(report.m1.implementationAuthorized, false);
  assert.equal(report.m1.originalRuntimeExecutionAuthorized, false);
  assert.equal(report.summary.strictCompleteCount, 0);
  assert.equal(report.summary.published, false);
  assert.equal(report.acceptanceEffects.m0Closed, false);
  assert.equal(report.acceptanceEffects.m1Authorized, false);
  assert.equal(
    report.acceptanceEffects.m1MachineOnlyStaticStartAuthorized,
    true,
  );
  assert.equal(report.acceptanceEffects.m1ExecutionAuthorized, false);
  assert.equal(
    report.acceptanceEffects.m1MachineOnlyStaticExecutionAuthorized,
    true,
  );
  assert.equal(report.acceptanceEffects.strictComplete, false);
  assert.equal(report.acceptanceEffects.published, false);
  assert.match(markdown, /M0-exit directive recorded: \*\*true\*\*/);
  assert.match(markdown, /M1 machine-only static start \/ foundation execution authorized: \*\*true \/ true\*\*/);
  assert.doesNotMatch(json, /Dr\. Peter|Peter Hu|catalog\/owner-authorizations\/g5-l4|reports\/g5-l4/);
  await writeOrCheckG5L5M0({
    report,
    outputPrefix: "reports/g5-l5-m0-governance-readiness",
    check: true,
  });
});

test("G5 L5 M0 validator rejects receipt tampering, authority broadening, bounded-authorization loss, people, hours, strict, and publication promotion", async () => {
  const report = await buildG5L5M0GovernanceReadiness();
  const mutations = [
    ["M0 close", (copy) => { copy.summary.m0ExitReady = true; }, /summary crossed/],
    ["M0 effective", (copy) => { copy.owner.m0ExitEffective = true; }, /effective M0 evidence/],
    ["receipt path", (copy) => { copy.sourceBindings.ownerGovernanceDirectiveIntake.path = "catalog/owner-authorizations/other.json"; }, /immutable G5 L5 Owner directive receipt/],
    ["M1 authorization loss", (copy) => { copy.m1.machineOnlyStaticStartAuthorized = false; }, /bounded machine-only authorization/],
    ["M1 execution loss", (copy) => { copy.m1.machineOnlyStaticExecutionAuthorized = false; }, /bounded machine-only authorization/],
    ["budget decision promoted", (copy) => { copy.ownerDecisions[3].requirementSatisfied = true; }, /budget\/procurement Owner decision/],
    ["M1 receipt removed", (copy) => { copy.ownerDecisions[4].receipt = null; }, /M1 Owner decision/],
    ["budget value", (copy) => { copy.budget.defaultSelection.totalBudgetEnvelopeUsd = 1; }, /budget defaults invented/],
    ["spend authority", (copy) => { copy.budget.defaultSelection.externalSpendAuthorized = true; }, /budget defaults invented/],
    ["bounded M1 acceptance loss", (copy) => { copy.acceptanceEffects.m1MachineOnlyStaticExecutionAuthorized = false; }, /lost bounded M1 authorization/],
    ["generic M1 acceptance broadening", (copy) => { copy.acceptanceEffects.m1ExecutionAuthorized = true; }, /m1ExecutionAuthorized/],
    ["named person", (copy) => { copy.roleSlots[0].assignee = "Synthetic Person"; }, /role slot/],
    ["hours", (copy) => { copy.roleSlots[0].committedHoursPerWeek = 20; }, /role slot/],
    ["primary floor", (copy) => { copy.roleRequirements[0].minimumPrimaryHoursPerWeek = 19; }, /required floor/],
    ["receipt", (copy) => { copy.authorizationInputs.m1MachineFoundationStartAuthorizationReceipt = {path: "receipt.json"}; }, /authorization input/],
    ["implementation", (copy) => { copy.acceptanceEffects.implementationAuthorized = true; }, /implementationAuthorized/],
    ["strict", (copy) => { copy.acceptanceEffects.strictComplete = true; }, /strictComplete/],
    ["publication", (copy) => { copy.acceptanceEffects.published = true; }, /published/],
  ];
  for (const [label, mutate, pattern] of mutations) {
    const copy = structuredClone(report);
    mutate(copy);
    assert.throws(() => validateG5L5M0GovernanceReport(copy), pattern, label);
  }
});

test("G5 L5 M0 pure-document validation requires the exact seven null authorization inputs", async () => {
  const report = await buildG5L5M0GovernanceReadiness();
  for (const authorizationInputs of [
    {},
    Object.fromEntries(
      G5_L5_AUTHORIZATION_INPUT_KEYS.slice(1).map((key) => [key, null]),
    ),
    Object.fromEntries(
      G5_L5_AUTHORIZATION_INPUT_KEYS.map((key, index) => [
        index === 0 ? "wrongAuthorizationReceipt" : key,
        null,
      ]),
    ),
  ]) {
    const copy = structuredClone(report);
    copy.authorizationInputs = authorizationInputs;
    refingerprint(copy);
    assert.throws(
      () => validateG5L5M0GovernanceReport(copy),
      /exact seven-key baseline/,
    );
  }
});

test("G5 L5 M0 pure-document validation hard-binds every Owner directive projection to the canonical receipt bytes", async () => {
  const copy = structuredClone(await buildG5L5M0GovernanceReadiness());
  const forged = {
    path: G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
    bytes: 1,
    sha256: "0".repeat(64),
  };
  copy.sourceBindings.ownerGovernanceDirectiveIntake = forged;
  copy.ownerDirective.receipt = forged;
  copy.owner.m0ExitDirectiveReceipt = forged;
  copy.m1.startAuthorizationReceipt = forged;
  for (const decision of copy.ownerDecisions) {
    if (decision.receipt !== null) decision.receipt = forged;
  }
  copy.budget.ownerDirectiveReceipt = forged;
  refingerprint(copy);
  assert.throws(
    () => validateG5L5M0GovernanceReport(copy),
    /immutable G5 L5 Owner directive receipt/,
  );
});

test("G5 L5 M0 readers and writers reject symlinked ancestor directories", async () => {
  const sandbox = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-m0-path-security-"),
  );
  const root = path.join(sandbox, "root");
  const externalCatalog = path.join(sandbox, "external-catalog");
  const externalReports = path.join(sandbox, "external-reports");
  try {
    await Promise.all([
      mkdir(root),
      mkdir(externalCatalog),
      mkdir(externalReports),
    ]);
    await writeFile(
      path.join(externalCatalog, "input.json"),
      "{}\n",
    );
    await Promise.all([
      symlink(externalCatalog, path.join(root, "catalog")),
      symlink(externalReports, path.join(root, "reports")),
    ]);

    await assert.rejects(
      fileRecord(root, "catalog/input.json", "M0 symlink-parent input"),
      /ancestor must be an ordinary directory/,
    );

    const report = await buildG5L5M0GovernanceReadiness();
    await assert.rejects(
      writeOrCheckG5L5M0({
        report,
        outputPrefix: "reports/g5-l5-m0-path-security",
        check: false,
        root,
      }),
      /ancestor must be an ordinary directory/,
    );
    assert.deepEqual(
      await readdir(externalReports),
      [],
    );
  } finally {
    await rm(sandbox, {recursive: true, force: true});
  }
});

test("G5 L5 M0 CLI exposes deterministic output/check only", () => {
  const parsed = parseG5L5M0Arguments([
    "--output-prefix", "reports/g5-l5-m0-governance-readiness",
    "--check",
  ]);
  assert.equal(parsed.check, true);
  assert.equal(parsed.outputPrefix, "reports/g5-l5-m0-governance-readiness");
  assert.throws(() => parseG5L5M0Arguments(["--authorize-m1"]), /Unknown option/);
  assert.throws(() => parseG5L5M0Arguments(["--operator", "person"]), /Unknown option/);
  assert.throws(() => parseG5L5M0Arguments(["--output-prefix", "migrations/escape"]), /below reports/);
});
