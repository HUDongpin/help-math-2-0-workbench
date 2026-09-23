import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {buildOwnerActionPacket, parseArguments, renderOwnerActionMarkdown, stableJson, validateOwnerActionPacket} from "./build-g5-l4-owner-action-packet.mjs";

let packetPromise;
function packet() { packetPromise ||= buildOwnerActionPacket(); return packetPromise; }
function resign(value) { const copy = structuredClone(value); delete copy.reportFingerprintSha256; value.reportFingerprintSha256 = createHash("sha256").update(stableJson(copy)).digest("hex"); }

test("builds a public-safe blank G5 L4 packet", async () => {
  const report = await packet();
  assert.deepEqual(report.release, {titleDisplay: "Number Lines", grade: 5, lesson: 4, activeXmlPages: 54, courseShells: 1, members: 55, pairedFlaSwfMembers: 44, swfOnlyMembers: 11, publicationMode: "atomic", releaseFingerprintSha256: "df2f04bb91ffecffcde4447807dce7eeff25b689269d5de1f44741f25b5ba2cc", strictCompleteCount: 0, published: false, atomicGateOpen: false});
  assert.equal(report.ownerDecisionTemplate.length, 4);
  assert.deepEqual(report.ownerDecisionTemplate.map((item) => [
    item.repositoryDirectiveRecorded,
    item.m0RequirementSatisfied,
    item.externalActionRequired,
  ]), [
    [true, true, false],
    [true, true, false],
    [true, false, true],
    [true, false, true],
  ]);
  assert.deepEqual(report.currentRepositoryState, {
    ownerDirectivesRecorded: 4,
    m0RequirementsSatisfied: 2,
    m0ExitReady: false,
    m1MachinePreparationAuthorized: true,
    m1MachineFoundationReady: true,
    sourceStaticEngineeringCandidateCount: 52,
    implementationStartedCount: 52,
    implementationWorkAuthorized: true,
    runtimeExecutionWorkAuthorized: true,
    implementationAuthorizedCount: 0,
    userAttestedRoleSlotIntentCount: 12,
    roleSlotIntentsAtOneHourPerWeek: 12,
    capacityFloorsSatisfied: 0,
    effectiveBackupCoverageCount: 0,
    budgetGatesApproved: 0,
  });
  assert.equal(
    report.sourceBindings.ownerWorkAuthorization.path,
    "catalog/owner-authorizations/g5-l4-owner-continuation-and-prospective-approval-intake-2026-08-01.json",
  );
  assert.equal(report.ownerWorkAuthorization.ownerIdentityRedacted, true);
  assert.equal(report.ownerWorkAuthorization.ownerFullName, undefined);
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
  assert.equal(report.summary.runtimeExecutionWorkAuthorized, true);
  assert.equal(report.staffingCapacityTemplate.roleSlots.length, 12);
  assert.ok(report.staffingCapacityTemplate.roleSlots.every((slot) =>
    slot.repositoryUserAttestedIntentRecorded === true &&
    slot.repositoryIntentHoursPerWeek === 1 &&
    slot.repositoryCapacityFloorSatisfied === false));
  assert.ok(report.staffingCapacityTemplate.roleSlots.every((slot) => slot.externalAssigneeFullName === null && slot.externalCommittedHoursPerWeek === null));
  assert.equal(report.runtimeContainmentTemplate.runnable, false);
  assert.ok(
    report.runtimeContainmentTemplate.controls.every(
      (control) =>
        typeof control.selectedMechanism === "string" &&
        control.selectedMechanism.length > 10 &&
        control.externalApproval === null &&
        control.externalVerification === null,
    ),
  );
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  assert.doesNotMatch(JSON.stringify(report), /Dr\. Peter Hu|\/Users\/|\/Volumes\/|file:\/\//i);
});

test("checked-in outputs are deterministic and public-safe", async () => {
  const report = await packet();
  const [json, markdown] = await Promise.all([readFile("reports/g5-l4-owner-action-packet.json", "utf8"), readFile("reports/g5-l4-owner-action-packet.md", "utf8")]);
  assert.equal(json, stableJson(report));
  assert.equal(markdown, renderOwnerActionMarkdown(report));
  assert.match(markdown, /54 pages \+ Shell = 55 members/);
  assert.match(markdown, /4\/4 Owner directives recorded; 2\/4 M0 requirements satisfied/);
  assert.match(markdown, /M1 machine preparation authorized/);
  assert.doesNotMatch(`${json}\n${markdown}`, /Dr\. Peter Hu|\/Users\/|\/Volumes\/|file:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
});

test("rejects injected authority, budget, identity, host, and acceptance", async () => {
  const report = await packet();
  const mutations = [
    (copy) => { copy.ownerDecisionTemplate[0].externalDecision = "approved"; },
    (copy) => { copy.ownerDecisionTemplate[0].m0RequirementSatisfied = false; },
    (copy) => { copy.ownerDecisionTemplate[2].externalActionRequired = false; },
    (copy) => { copy.currentRepositoryState.m1MachinePreparationAuthorized = false; },
    (copy) => { copy.currentRepositoryState.implementationAuthorizedCount = 5; },
    (copy) => { copy.ownerWorkAuthorization.technicalMechanismsApproved = true; },
    (copy) => { copy.ownerWorkAuthorization.runtimeExecutionAuthorized = true; },
    (copy) => { copy.staffingCapacityTemplate.roleSlots[0].externalAssigneeFullName = "Synthetic Person"; },
    (copy) => { copy.budgetProcurementTemplate.personnelRateCeilingUsdPerHour = 250; },
    (copy) => { copy.budgetProcurementTemplate.totalBudgetEnvelopeUsd = 100000; },
    (copy) => { copy.budgetProcurementTemplate.procurementPaymentCycle = "net-30"; },
    (copy) => { copy.runtimeContainmentTemplate.launchCommand = "unsafe"; },
    (copy) => { copy.runtimeContainmentTemplate.runnable = true; },
    (copy) => { copy.acceptanceEffects.strictCompleteByThisPacket = true; },
    (copy) => { copy.authorizationGranted = true; },
    (copy) => { copy.privateOperatorNote = "Jane Doe /private/secret 555-0100"; },
    (copy) => { copy.runtimeContainmentTemplate.controls[0].unknownApproval = true; },
    (copy) => { copy.runtimeContainmentTemplate.controls[0].requirement = "Execution authorized for Jane Doe at /private/runtime with phone 555-0100"; },
    (copy) => { copy.sourceBindings.releaseManifest.privatePath = "/private/source"; },
    (copy) => { copy.release.titleDisplay = "Private operator Jane Doe"; },
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(report);
    mutate(copy);
    resign(copy);
    assert.throws(() => validateOwnerActionPacket(copy));
  }
});

test("CLI accepts only check/help and rejects authority injection", () => {
  assert.equal(parseArguments(["--check"]).check, true);
  assert.equal(parseArguments(["--help"]).help, true);
  for (const argument of ["--operator", "--budget", "--authorize", "--host", "--json"]) assert.throws(() => parseArguments([argument]));
});
