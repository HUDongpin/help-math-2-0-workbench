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
  buildG5L4PerSessionAuthorizationPreparation,
  parseArguments,
  readPreparationInputFile,
  renderMarkdown,
  stableJson,
  validateG5L4PerSessionAuthorizationPreparation,
  writeOrCheck,
} from "./build-g5-l4-per-session-authorization-preparation.mjs";

let currentReport;

test.before(async () => {
  currentReport = await buildG5L4PerSessionAuthorizationPreparation();
});

function refingerprint(report) {
  const {reportFingerprintSha256: ignored, ...withoutFingerprint} = report;
  void ignored;
  report.reportFingerprintSha256 = createHash("sha256")
    .update(Buffer.from(stableJson(withoutFingerprint)))
    .digest("hex");
  return report;
}

async function withTemporaryRoot(callback) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l4-session-preparation-"),
  );
  try {
    return await callback(root);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
}

test("builds the exact 44 Animate plus 55xEN/ES unsigned template set", () => {
  assert.equal(
    validateG5L4PerSessionAuthorizationPreparation(currentReport),
    true,
  );
  assert.equal(currentReport.release.memberCount, 55);
  assert.equal(currentReport.release.flaBackedMemberCount, 44);
  assert.equal(currentReport.release.swfOnlyMemberCount, 11);
  assert.equal(currentReport.animateSessionTemplates.length, 44);
  assert.equal(currentReport.originalRuntimeSessionTemplates.length, 110);
  assert.equal(
    currentReport.originalRuntimeSessionTemplates.filter(
      (template) => template.identity.language === "en",
    ).length,
    55,
  );
  assert.equal(
    currentReport.originalRuntimeSessionTemplates.filter(
      (template) => template.identity.language === "es",
    ).length,
    55,
  );
  assert.equal(currentReport.summary.totalUnsignedTemplates, 154);
  assert.equal(currentReport.summary.ownerWorkAuthorizationReceiptCount, 1);
  assert.equal(currentReport.summary.implementationWorkAuthorized, true);
  assert.equal(currentReport.summary.runtimeExecutionWorkAuthorized, true);
  assert.equal(
    currentReport.sourceBindings.ownerWorkAuthorizationReceipt.path,
    "catalog/owner-authorizations/g5-l4-owner-continuation-and-prospective-approval-intake-2026-08-01.json",
  );
  assert.equal(currentReport.ownerWorkAuthorization.implementationWorkAuthorized, true);
  assert.equal(currentReport.ownerWorkAuthorization.runtimeExecutionWorkAuthorized, true);
  assert.equal(
    currentReport.ownerWorkAuthorization.runtimeExecutionWorkAuthorizationBasis,
    "user-attested-prospective-owner-direction",
  );
  assert.equal(currentReport.ownerWorkAuthorization.implementationAuthorizedCountEffect, 0);
  assert.equal(currentReport.ownerWorkAuthorization.technicalMechanismsApproved, false);
  assert.equal(currentReport.ownerWorkAuthorization.technicalMechanismsVerified, false);
  assert.equal(currentReport.ownerWorkAuthorization.runtimeHostApproved, false);
  assert.equal(
    currentReport.ownerWorkAuthorization.immutableSessionAuthorizationEstablished,
    false,
  );
  assert.equal(currentReport.ownerWorkAuthorization.runtimeExecutionAuthorized, false);
  assert.equal(currentReport.ownerWorkAuthorization.lessonSpecificSubstitution, false);
  assert.equal(currentReport.ownerWorkAuthorization.fidelityAccepted, false);
  assert.equal(currentReport.ownerWorkAuthorization.strictComplete, false);
  assert.equal(currentReport.ownerWorkAuthorization.publicationAuthorized, false);
  assert.equal(currentReport.authorityBoundary.runtimeExecutionWorkAuthorized, true);
  assert.equal(currentReport.authorityBoundary.technicalMechanismsSelected, true);
  assert.equal(currentReport.summary.containmentMechanismsSelected, 8);
  assert.equal(currentReport.summary.runnableTemplates, 0);
  assert.equal(currentReport.summary.sessionsExecuted, 0);
});

test("every template carries the eight machine candidates while every exact authorization and execution field remains empty", () => {
  const all = [
    ...currentReport.animateSessionTemplates,
    ...currentReport.originalRuntimeSessionTemplates,
  ];
  assert.equal(new Set(all.map((template) => template.templateId)).size, 154);
  for (const template of all) {
    assert.deepEqual(
      {
        sessionId: template.sessionAuthorization.sessionId,
        nonce: template.sessionAuthorization.nonce,
        ttlSeconds: template.sessionAuthorization.ttlSeconds,
        signatureEnvelope: template.sessionAuthorization.signatureEnvelope,
      },
      {
        sessionId: null,
        nonce: null,
        ttlSeconds: null,
        signatureEnvelope: null,
      },
    );
    assert.equal(template.source.swf.sha256.length, 64);
    assert.ok("staging" in template);
    assert.deepEqual(
      Object.keys(template.toolchain).sort(),
      ["executable", "jsfl", "runner"],
    );
    assert.ok("host" in template.environment);
    assert.ok("profile" in template.environment);
    assert.ok("hostTree" in template.environment);
    assert.deepEqual(
      template.containment.controls.map((control) => control.controlId),
      ["CR-01", "CR-02", "CR-03", "CR-04", "CR-05", "CR-06", "CR-07", "CR-08"],
    );
    assert.ok(
      template.containment.controls.every(
        (control) =>
          typeof control.selectedMechanism === "string" &&
          control.selectedMechanism.length > 10 &&
          control.candidateImplementationPresent === true &&
          control.offlineOrDiagnosticVerified === true &&
          control.ownerTechnicalApprovalEstablished === false &&
          control.liveSessionVerified === false &&
          control.approvalReceiptSha256 === null &&
          control.verificationReceiptSha256 === null &&
          control.approved === false &&
          control.verified === false,
      ),
    );
    assert.deepEqual(template.stopConditions, []);
    assert.equal(template.operator.expectedFullName, "Dr. Peter Hu");
    assert.equal(template.operator.perSessionDeclaration.present, false);
    assert.equal(template.traceIdentity.requirementId, null);
    assert.equal(template.execution.runnable, false);
    assert.equal(template.execution.sessionExecuted, false);
    assert.equal(template.acceptance.strictComplete, false);
    assert.equal(template.acceptance.published, false);
  }
});

test("validator rejects identity, authorization, execution, review, strict, and publication fabrication", () => {
  const mutations = [
    {
      label: "release identity",
      mutate: (report) => {
        report.release.releaseId = "lesson-g05-l05-add-subtract-negative-numbers";
      },
    },
    {
      label: "operator identity",
      mutate: (report) => {
        report.animateSessionTemplates[0].operator.expectedFullName =
          "Someone Else";
      },
    },
    {
      label: "filled session ID",
      mutate: (report) => {
        report.originalRuntimeSessionTemplates[0].sessionAuthorization.sessionId =
          "runtime-session-0001";
      },
    },
    {
      label: "signature envelope",
      mutate: (report) => {
        report.animateSessionTemplates[0].sessionAuthorization.signatureEnvelope =
          {};
      },
    },
    {
      label: "runnable",
      mutate: (report) => {
        report.originalRuntimeSessionTemplates[0].execution.runnable = true;
      },
    },
    {
      label: "verified containment",
      mutate: (report) => {
        report.originalRuntimeSessionTemplates[0].containment.controls[0].verified =
          true;
      },
    },
    {
      label: "removed machine-selected containment candidate",
      mutate: (report) => {
        report.originalRuntimeSessionTemplates[0].containment.controls[0]
          .selectedMechanism = null;
      },
    },
    {
      label: "session executed",
      mutate: (report) => {
        report.animateSessionTemplates[0].execution.sessionExecuted = true;
      },
    },
    {
      label: "review accepted",
      mutate: (report) => {
        report.originalRuntimeSessionTemplates[0].acceptance.independentReviewAccepted =
          true;
      },
    },
    {
      label: "strict complete",
      mutate: (report) => {
        report.animateSessionTemplates[0].acceptance.strictComplete = true;
      },
    },
    {
      label: "published",
      mutate: (report) => {
        report.originalRuntimeSessionTemplates[0].acceptance.published = true;
      },
    },
  ];
  for (const mutation of mutations) {
    const changed = structuredClone(currentReport);
    mutation.mutate(changed);
    refingerprint(changed);
    assert.throws(
      () => validateG5L4PerSessionAuthorizationPreparation(changed),
      Error,
      mutation.label,
    );
  }
});

test("validator rejects promoted report-level authority and nonzero counters", () => {
  for (const [pathParts, value] of [
    [["authorityBoundary", "immutablePerSessionAuthorizationPresent"], true],
    [["authorityBoundary", "animateGuiExecutionAuthorized"], true],
    [["authorityBoundary", "originalRuntimeExecutionAuthorized"], true],
    [["authorityBoundary", "reviewAccepted"], true],
    [["authorityBoundary", "strictComplete"], true],
    [["authorityBoundary", "publicationAuthorized"], true],
    [["ownerWorkAuthorization", "technicalMechanismsApproved"], true],
    [["ownerWorkAuthorization", "runtimeExecutionAuthorized"], true],
    [["runtimeExecutionAuthorized"], true],
    [["authorityBoundary", "unknownRuntimeExecutionAuthorized"], true],
    [["summary", "runtimeExecutionAuthorized"], true],
    [["sourceBindings", "runtimeExecutionAuthorized"], true],
    [["release", "strictComplete"], true],
    [["summary", "signatureEnvelopes"], 1],
    [["summary", "sessionsExecuted"], 1],
    [["summary", "reviewsAccepted"], 1],
    [["summary", "strictCompletions"], 1],
    [["summary", "publications"], 1],
  ]) {
    const changed = structuredClone(currentReport);
    let target = changed;
    for (const segment of pathParts.slice(0, -1)) target = target[segment];
    target[pathParts.at(-1)] = value;
    refingerprint(changed);
    assert.throws(
      () => validateG5L4PerSessionAuthorizationPreparation(changed),
      Error,
      pathParts.join("."),
    );
  }
});

test("local safe reader rejects traversal, symlink, and hardlink inputs", async () => {
  await withTemporaryRoot(async (root) => {
    await mkdir(path.join(root, "evidence"));
    const source = path.join(root, "source.json");
    await writeFile(source, "{}\n");
    await symlink(source, path.join(root, "evidence", "symlink.json"));
    await assert.rejects(
      readPreparationInputFile(root, "evidence/symlink.json"),
      /ordinary non-linked file/,
    );
    await link(source, path.join(root, "evidence", "hardlink.json"));
    await assert.rejects(
      readPreparationInputFile(root, "evidence/hardlink.json"),
      /ordinary non-linked file/,
    );
    await assert.rejects(
      readPreparationInputFile(root, "../outside.json"),
      /escapes project root|not normalized/,
    );
  });
});

test("writer rejects unsafe paths and linked outputs without modifying referents", async () => {
  assert.throws(
    () =>
      parseArguments([
        "--output-prefix",
        "reports/../outside/session-preparation",
      ]),
    /normalized extensionless path below reports/,
  );
  assert.throws(() => parseArguments(["--launch"]), /Unknown argument/);

  await withTemporaryRoot(async (root) => {
    await mkdir(path.join(root, "real-reports"));
    await symlink(
      path.join(root, "real-reports"),
      path.join(root, "reports"),
    );
    await assert.rejects(
      writeOrCheck({
        report: currentReport,
        projectRoot: root,
        outputPrefix: "reports/session-preparation",
      }),
      /output ancestor must be an ordinary directory/,
    );
  });

  for (const kind of ["symlink", "hardlink"]) {
    await withTemporaryRoot(async (root) => {
      await mkdir(path.join(root, "reports"));
      const referent = path.join(root, "referent.json");
      const target = path.join(root, "reports", "session-preparation.json");
      const contents = `do-not-change-${kind}\n`;
      await writeFile(referent, contents);
      if (kind === "symlink") await symlink(referent, target);
      else await link(referent, target);
      await assert.rejects(
        writeOrCheck({
          report: currentReport,
          projectRoot: root,
          outputPrefix: "reports/session-preparation",
        }),
        /ordinary non-linked file/,
      );
      assert.equal(await readFile(referent, "utf8"), contents);
    });
  }
});

test("writer rolls back the JSON/Markdown pair and detects output TOCTOU", async () => {
  await withTemporaryRoot(async (root) => {
    await mkdir(path.join(root, "reports"));
    const options = {
      report: currentReport,
      projectRoot: root,
      outputPrefix: "reports/session-preparation",
    };
    assert.equal((await writeOrCheck(options)).action, "written");
    const json = path.join(root, "reports", "session-preparation.json");
    const markdown = path.join(root, "reports", "session-preparation.md");
    const before = await Promise.all([readFile(json), readFile(markdown)]);
    await assert.rejects(
      writeOrCheck({
        ...options,
        transactionHook: ({phase, index}) => {
          if (phase === "before-install" && index === 1) {
            throw new Error("injected second-output failure");
          }
        },
      }),
      /injected second-output failure/,
    );
    assert.deepEqual(
      await Promise.all([readFile(json), readFile(markdown)]),
      before,
    );
    assert.equal((await writeOrCheck({...options, check: true})).action, "verified");
  });

  await withTemporaryRoot(async (root) => {
    await mkdir(path.join(root, "reports"));
    const options = {
      report: currentReport,
      projectRoot: root,
      outputPrefix: "reports/session-preparation",
    };
    await writeOrCheck(options);
    const json = path.join(root, "reports", "session-preparation.json");
    await assert.rejects(
      writeOrCheck({
        ...options,
        transactionHook: async ({phase}) => {
          if (phase === "after-stage") {
            await writeFile(json, "external-change-during-transaction\n");
          }
        },
      }),
      /output changed during transaction/,
    );
    assert.equal(
      await readFile(json, "utf8"),
      "external-change-during-transaction\n",
    );
  });
});

test("checked-in JSON/Markdown pair matches a fresh deterministic build", async () => {
  const result = await writeOrCheck({
    report: currentReport,
    check: true,
  });
  assert.equal(result.action, "verified");
  assert.equal(result.outputs.length, 2);
  assert.equal(
    await readFile(result.outputs[0].path, "utf8"),
    stableJson(currentReport),
  );
  assert.equal(
    await readFile(result.outputs[1].path, "utf8"),
    renderMarkdown(currentReport),
  );
});
