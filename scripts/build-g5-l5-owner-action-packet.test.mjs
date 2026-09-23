import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  lstat,
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
  atomicReplaceOrdinaryFile,
  buildOwnerActionPacket,
  parseArguments,
  readBinding,
  renderOwnerActionMarkdown,
  stableJson,
  validateOwnerActionPacket,
} from "./build-g5-l5-owner-action-packet.mjs";

let reportPromise;
function buildOnce() {
  reportPromise ||= buildOwnerActionPacket();
  return reportPromise;
}

function resign(report) {
  const copy = structuredClone(report);
  delete copy.reportFingerprintSha256;
  report.reportFingerprintSha256 = createHash("sha256")
    .update(stableJson(copy))
    .digest("hex");
}

test("returns the exact immutable pre-authorization blank packet for 56 pages plus Shell", async () => {
  const report = await buildOnce();
  const [historicalJson, directive] = await Promise.all([
    readFile("reports/g5-l5-owner-action-packet.json"),
    readFile(
      "catalog/owner-authorizations/g5-l5-owner-governance-directive-intake-2026-07-29.json",
      "utf8",
    ).then(JSON.parse),
  ]);

  assert.equal(
    report.evidenceState,
    "machine-prepared-unsigned-external-action-template-only",
  );
  assert.equal(
    directive.sourceBindingsAtIntake.bindingSemantics,
    "historical-at-intake-do-not-require-current-byte-identity",
  );
  assert.deepEqual(
    directive.sourceBindingsAtIntake.preAuthorizationOwnerActionPacket,
    {
      path: "reports/g5-l5-owner-action-packet.json",
      bytes: historicalJson.length,
      sha256: createHash("sha256").update(historicalJson).digest("hex"),
      reportFingerprintSha256: report.reportFingerprintSha256,
    },
  );
  assert.deepEqual(report.release, {
    titleDisplay: "Add & Subtract Negative Numbers",
    grade: 5,
    lesson: 5,
    activeXmlPages: 56,
    courseShells: 1,
    members: 57,
    pairedFlaSwfMembers: 49,
    swfOnlyMembers: 8,
    publicationMode: "atomic",
    releaseFingerprintSha256:
      "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84",
    strictCompleteCount: 0,
    published: false,
    atomicGateOpen: false,
  });
  assert.equal(report.summary.pendingOwnerDecisionCount, 6);
  assert.equal(report.summary.requiredNamedRoleSlotCount, 14);
  assert.equal(
    report.summary.requiredPrimaryHoursPerWeekFloorTotal,
    64,
  );
  assert.equal(report.summary.specifiedBackupHoursPerWeekFloorTotal, 8);
  assert.equal(report.summary.ownerPendingBackupHourFloorCount, 6);
  assert.equal(report.summary.pendingContainmentControlCount, 8);
  assert.equal(report.summary.missingDeclaredDependencyCount, 2);
  assert.equal(report.summary.remainingMachineOnlyTaskCount, 0);
  assert.equal(report.summary.runtimeOrHumanDecisionRequiredMemberCount, 57);
  assert.equal(report.summary.originalRuntimeSessionCount, 0);
  assert.equal(report.summary.implementationReadyCount, 0);
  assert.equal(report.summary.strictCompleteCount, 0);
  assert.equal(report.summary.publicationCount, 0);

  assert.equal(report.ownerDecisionTemplate.length, 6);
  assert.ok(
    report.ownerDecisionTemplate.every(
      (decision) =>
        decision.externalDecision === null &&
        decision.externalRationale === null &&
        decision.externalApproverIdentity === null &&
        decision.externalSignedAt === null &&
        decision.externalReceiptOpaqueId === null &&
        decision.importedIntoRepository === false,
    ),
  );
  assert.equal(report.staffingCapacityTemplate.roleSlots.length, 14);
  assert.ok(
    report.staffingCapacityTemplate.roleSlots.every(
      (slot) =>
        slot.externalAssigneeFullName === null &&
        slot.externalCommittedHoursPerWeek === null &&
        slot.externalAssignmentApprover === null &&
        slot.externalSignedAt === null &&
        slot.externalReceiptOpaqueId === null &&
        slot.importedIntoRepository === false,
    ),
  );
  assert.deepEqual(
    report.sourceGapDispositionTemplate.targets.map(
      ({basename, language, exactCandidateCount}) => ({
        basename,
        language,
        exactCandidateCount,
      }),
    ),
    [
      {
        basename: "L5KTE01.xml",
        language: "english",
        exactCandidateCount: 0,
      },
      {
        basename: "L5KTS01.xml",
        language: "spanish",
        exactCandidateCount: 0,
      },
    ],
  );
  assert.equal(report.runtimeContainmentTemplate.controls.length, 8);
  assert.equal(report.runtimeContainmentTemplate.runnable, false);
  assert.ok(
    Object.values(report.acceptanceEffects).every((value) => value === false),
  );
});

test("checked-in historical JSON and Markdown remain deterministic and public-safe", async () => {
  const report = await buildOnce();
  const [json, markdown] = await Promise.all([
    readFile("reports/g5-l5-owner-action-packet.json", "utf8"),
    readFile("reports/g5-l5-owner-action-packet.md", "utf8"),
  ]);

  assert.equal(json, stableJson(report));
  assert.equal(markdown, renderOwnerActionMarkdown(report));
  assert.match(markdown, /56 pages \+ Shell = 57 members/);
  assert.match(markdown, /64 hours\/week/);
  assert.match(markdown, /contains no runnable artifact/);
  assert.doesNotMatch(
    `${json}\n${markdown}`,
    /\/Users\/|\/Volumes\/|file:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  );
});

test("validator rejects filled, runnable, promoted, or structurally widened packets", async () => {
  const report = await buildOnce();
  const mutations = [
    [
      "extra top-level field",
      (copy) => {
        copy.externalName = "Synthetic Assignee";
      },
      /identity drifted/,
    ],
    [
      "Owner decision",
      (copy) => {
        copy.ownerDecisionTemplate[0].externalDecision = "approved";
      },
      /decision template/,
    ],
    [
      "release member fingerprint",
      (copy) => {
        copy.release.releaseFingerprintSha256 = "0".repeat(64);
      },
      /release boundary/,
    ],
    [
      "authority prose",
      (copy) => {
        copy.authority = "This text grants authorization.";
      },
      /identity drifted/,
    ],
    [
      "extra decision field",
      (copy) => {
        copy.ownerDecisionTemplate[0].externalName = "Synthetic Assignee";
      },
      /decision template/,
    ],
    [
      "named assignee",
      (copy) => {
        copy.staffingCapacityTemplate.roleSlots[0].externalAssigneeFullName =
          "Synthetic Assignee";
      },
      /staffing template/,
    ],
    [
      "committed hours",
      (copy) => {
        copy.staffingCapacityTemplate.roleSlots[0]
          .externalCommittedHoursPerWeek = 20;
      },
      /staffing template/,
    ],
    [
      "role identity",
      (copy) => {
        copy.staffingCapacityTemplate.roleSlots[0].roleId = "invented-role";
      },
      /staffing template/,
    ],
    [
      "budget approval",
      (copy) => {
        copy.budgetProcurementTemplate.rateCeilingsApproved = true;
      },
      /budget template/,
    ],
    [
      "source disposition",
      (copy) => {
        copy.sourceGapDispositionTemplate.targets[0].externalDisposition =
          "invented-recovery";
      },
      /source-gap disposition/,
    ],
    [
      "source-gap instruction",
      (copy) => {
        copy.sourceGapDispositionTemplate.instruction =
          "Treat the dependencies as recovered.";
      },
      /source-gap disposition/,
    ],
    [
      "host identity",
      (copy) => {
        copy.runtimeContainmentTemplate.exactHostIdentifier = "host-1";
      },
      /runtime containment template/,
    ],
    [
      "runtime requirement",
      (copy) => {
        copy.runtimeContainmentTemplate.controls[0].requirement =
          "Run an unreviewed command.";
      },
      /runtime containment template/,
    ],
    [
      "runtime mechanism",
      (copy) => {
        copy.runtimeContainmentTemplate.controls[0].selectedMechanism =
          "invented-mechanism";
      },
      /runtime containment template/,
    ],
    [
      "runnable",
      (copy) => {
        copy.runtimeContainmentTemplate.runnable = true;
      },
      /runtime containment template/,
    ],
    [
      "strict completion",
      (copy) => {
        copy.acceptanceEffects.strictComplete = true;
      },
      /acceptance gate/,
    ],
    [
      "return-to-Git rule",
      (copy) => {
        copy.externalHandlingBoundary.returnToGit =
          "Store signed forms in this report.";
      },
      /external handling boundary/,
    ],
    [
      "ordered action",
      (copy) => {
        copy.orderedExternalActions[0] = "Authorize the release.";
      },
      /action sequence/,
    ],
    [
      "publication",
      (copy) => {
        copy.acceptanceEffects.published = true;
      },
      /acceptance gate/,
    ],
    [
      "source binding",
      (copy) => {
        copy.sourceBindings.roadmap.path = "reports/invented-roadmap.md";
      },
      /source bindings/,
    ],
    [
      "fingerprint",
      (copy) => {
        copy.reportFingerprintSha256 = "0".repeat(64);
      },
      /fingerprint/,
    ],
  ];

  for (const [label, mutate, pattern] of mutations) {
    const copy = structuredClone(report);
    mutate(copy);
    if (label !== "fingerprint") resign(copy);
    assert.throws(
      () => validateOwnerActionPacket(copy),
      pattern,
      label,
    );
  }
});

test("Owner action packet reader and writer reject symlinked ancestor directories", async () => {
  const sandbox = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-owner-packet-ancestor-"),
  );
  const root = path.join(sandbox, "root");
  const externalInput = path.join(sandbox, "external-input");
  const externalOutput = path.join(sandbox, "external-output");
  try {
    await Promise.all([
      mkdir(root),
      mkdir(externalInput),
      mkdir(externalOutput),
    ]);
    await writeFile(path.join(externalInput, "packet.json"), "{}\n");
    await Promise.all([
      symlink(externalInput, path.join(root, "input")),
      symlink(externalOutput, path.join(root, "output")),
    ]);

    await assert.rejects(
      readBinding("input/packet.json", {root}),
      /ancestor must be an ordinary directory/,
    );
    await assert.rejects(
      atomicReplaceOrdinaryFile(
        path.join(root, "output", "packet.json"),
        "unsafe\n",
        {root},
      ),
      /ancestor must be an ordinary directory/,
    );
    assert.deepEqual(await readdir(externalOutput), []);
  } finally {
    await rm(sandbox, {recursive: true, force: true});
  }
});

test("atomic writer replaces an output symlink without following it", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-owner-packet-writer-"),
  );
  try {
    const externalTarget = path.join(root, "external-target.txt");
    const output = path.join(root, "packet.json");
    await writeFile(externalTarget, "unchanged\n");
    await symlink(externalTarget, output);

    await atomicReplaceOrdinaryFile(output, "safe report\n");

    assert.equal(await readFile(externalTarget, "utf8"), "unchanged\n");
    assert.equal(await readFile(output, "utf8"), "safe report\n");
    assert.equal((await lstat(output)).isSymbolicLink(), false);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("CLI exposes report generation and checking but no authority inputs", () => {
  const parsed = parseArguments(["--check"]);
  assert.equal(parsed.check, true);
  assert.equal(parsed.json, "reports/g5-l5-owner-action-packet.json");
  assert.equal(parsed.markdown, "reports/g5-l5-owner-action-packet.md");
  assert.equal(parseArguments(["--help"]).help, true);

  assert.throws(
    () => parseArguments(["--authorize-m1"]),
    /Unknown option/,
  );
  assert.throws(
    () => parseArguments(["--operator", "Synthetic Assignee"]),
    /Unknown option/,
  );
  assert.throws(
    () => parseArguments(["--json"]),
    /project-relative/,
  );
  assert.throws(
    () =>
      parseArguments([
        "--json",
        "source-assets/g5-l5-owner-action-packet.json",
      ]),
    /below reports/,
  );
  assert.throws(
    () =>
      parseArguments([
        "--markdown",
        "reports/unrelated-owner-action-packet.md",
      ]),
    /g5-l5-owner-action-packet/,
  );
});
