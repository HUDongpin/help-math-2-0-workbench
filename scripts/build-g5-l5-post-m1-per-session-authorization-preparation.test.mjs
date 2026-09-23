import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile, stat} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {
  buildG5L5PostM1PerSessionPreparation,
  parseArguments,
  validateG5L5PostM1PerSessionPreparation,
} from "./build-g5-l5-post-m1-per-session-authorization-preparation.mjs";

const TEST_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(TEST_PATH), "..");
const JSON_OUTPUT = path.join(
  PROJECT_ROOT,
  "reports/g5-l5-post-m1-per-session-authorization-preparation.json",
);
const MARKDOWN_OUTPUT = path.join(
  PROJECT_ROOT,
  "reports/g5-l5-post-m1-per-session-authorization-preparation.md",
);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function allTemplates(report) {
  return [
    ...report.animateSessionTemplates,
    ...report.originalRuntimeSessionTemplates,
  ];
}

test("dry-run builds exactly 49 Animate plus 114 EN/ES runtime templates", async () => {
  const result = await buildG5L5PostM1PerSessionPreparation({
    projectRoot: PROJECT_ROOT,
    mode: "dry-run",
  });
  const {report} = result;
  assert.equal(report.release.memberCount, 57);
  assert.equal(report.release.activePageCount, 56);
  assert.equal(report.release.shellCount, 1);
  assert.equal(report.animateSessionTemplates.length, 49);
  assert.equal(report.originalRuntimeSessionTemplates.length, 114);
  assert.equal(allTemplates(report).length, 163);
  assert.equal(new Set(allTemplates(report).map(({templateId}) => templateId)).size, 163);
  assert.equal(
    report.originalRuntimeSessionTemplates.filter(
      ({identity}) => identity.language === "en",
    ).length,
    57,
  );
  assert.equal(
    report.originalRuntimeSessionTemplates.filter(
      ({identity}) => identity.language === "es",
    ).length,
    57,
  );
  assert.equal(report.summary.boundPendingCoverageFrameCount, 1220);
  assert.equal(report.summary.flaBackedMemberCount, 49);
  assert.equal(report.summary.swfOnlyMemberCount, 8);
  assert.equal(result.outputChanges.length, 2);
});

test("every session remains blank, unsigned, commandless, outputless, and non-runnable", async () => {
  const {report} = await buildG5L5PostM1PerSessionPreparation({
    projectRoot: PROJECT_ROOT,
    mode: "dry-run",
  });
  for (const template of allTemplates(report)) {
    assert.deepEqual(Object.values(template.roleAssignment), [
      null,
      null,
      null,
      null,
      null,
    ]);
    assert.equal(template.sessionAuthorization.sessionId, null);
    assert.equal(template.sessionAuthorization.authorizerFullName, null);
    assert.equal(template.sessionAuthorization.authorizedAt, null);
    assert.equal(template.sessionAuthorization.signatureEnvelope, null);
    assert.equal(
      template.sessionAuthorization.state,
      "unsigned-empty-non-runnable",
    );
    assert.ok(
      Object.values(template.budget).every((value) => value === null),
    );
    assert.ok(
      Object.values(template.procurement).every((value) => value === null),
    );
    assert.ok(
      Object.values(template.schedule).every((value) => value === null),
    );
    assert.equal(template.operator.fullName, null);
    assert.equal(template.operator.present, false);
    assert.deepEqual(template.operator.allowedActionIds, []);
    assert.deepEqual(template.commands, []);
    assert.deepEqual(template.stopConditions, []);
    assert.deepEqual(template.actualOutputs, []);
    assert.equal(template.execution.runnable, false);
    assert.equal(template.execution.launchAuthorized, false);
    assert.equal(template.execution.sessionExecuted, false);
    assert.equal(template.execution.guiExecuted, false);
    assert.ok(
      Object.values(template.acceptance).every((value) => value === false),
    );
    assert.equal(template.containment.controls.length, 8);
    assert.ok(
      template.containment.controls.every(
        (control) =>
          control.selectedMechanism === null &&
          control.approvalReceiptSha256 === null &&
          control.verificationReceiptSha256 === null &&
          control.approved === false &&
          control.verified === false,
      ),
    );
  }
  assert.equal(JSON.stringify(report).includes("Dr. Peter Hu"), false);
  for (const value of Object.values(report.authorityBoundary)) {
    assert.equal(value, false);
  }
});

test("runtime identities bind pending current coverage without claiming a natural trace", async () => {
  const {report} = await buildG5L5PostM1PerSessionPreparation({
    projectRoot: PROJECT_ROOT,
    mode: "dry-run",
  });
  let frameCount = 0;
  const languageSets = new Map();
  for (const template of report.originalRuntimeSessionTemplates) {
    assert.match(template.traceIdentity.requirementId, /^req-default-root-(en|es)$/);
    assert.equal(template.traceIdentity.frameDomain, "root");
    assert.equal(template.traceIdentity.scenario, "default");
    assert.equal(template.traceIdentity.seed, "0");
    assert.equal(
      template.traceIdentity.obligationState,
      "pending-static-coverage-obligation-not-observed-runtime",
    );
    assert.equal(template.traceIdentity.naturalRuntimeTraceReceiptSha256, null);
    frameCount +=
      template.traceIdentity.exactFrameRange.end -
      template.traceIdentity.exactFrameRange.start +
      1;
    const languages =
      languageSets.get(template.identity.animationId) || new Set();
    languages.add(template.identity.language);
    languageSets.set(template.identity.animationId, languages);
  }
  assert.equal(frameCount, 1220);
  assert.equal(languageSets.size, 57);
  assert.ok(
    [...languageSets.values()].every(
      (languages) => languages.size === 2 &&
        languages.has("en") &&
        languages.has("es"),
    ),
  );
  assert.equal(report.summary.naturalRuntimeTraceCount, 0);
  assert.equal(report.summary.authoritativeBaselineCount, 0);
});

test("validator rejects filled authority, command, output, execution, and acceptance fields", async () => {
  const result = await buildG5L5PostM1PerSessionPreparation({
    projectRoot: PROJECT_ROOT,
    mode: "dry-run",
  });
  const mutations = [
    (report) => {
      report.animateSessionTemplates[0].roleAssignment.assigneeFullName =
        "Filled Name";
    },
    (report) => {
      report.originalRuntimeSessionTemplates[0]
        .sessionAuthorization.sessionId = "session-1";
    },
    (report) => {
      report.originalRuntimeSessionTemplates[0].budget.amount = 1;
    },
    (report) => {
      report.originalRuntimeSessionTemplates[0].commands = ["launch"];
    },
    (report) => {
      report.originalRuntimeSessionTemplates[0].actualOutputs = [
        {path: "not-allowed"},
      ];
    },
    (report) => {
      report.originalRuntimeSessionTemplates[0].execution.runnable = true;
    },
    (report) => {
      report.originalRuntimeSessionTemplates[0].acceptance.strictComplete =
        true;
    },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(result.report);
    mutate(changed);
    assert.throws(
      () =>
        validateG5L5PostM1PerSessionPreparation(
          changed,
          result.validationContext,
        ),
    );
  }
});

test("checked-in reports match a fresh rebuild and remain ordinary mode 0644 files", async () => {
  const result = await buildG5L5PostM1PerSessionPreparation({
    projectRoot: PROJECT_ROOT,
    mode: "check",
  });
  assert.equal(result.outputChanges.every(({change}) => change === "unchanged"), true);
  for (const output of [JSON_OUTPUT, MARKDOWN_OUTPUT]) {
    const information = await stat(output);
    assert.equal(information.isFile(), true);
    assert.equal(information.nlink, 1);
    assert.equal(information.mode & 0o777, 0o644);
  }
});

test("transaction failure restores both aggregate outputs byte-for-byte", async () => {
  const before = await Promise.all([
    readFile(JSON_OUTPUT),
    readFile(MARKDOWN_OUTPUT),
  ]);
  await assert.rejects(
    buildG5L5PostM1PerSessionPreparation({
      projectRoot: PROJECT_ROOT,
      mode: "apply",
      transactionHooks: {
        afterCommit({index}) {
          if (index === 0) throw new Error("injected transaction failure");
        },
      },
    }),
    /injected transaction failure/,
  );
  const after = await Promise.all([
    readFile(JSON_OUTPUT),
    readFile(MARKDOWN_OUTPUT),
  ]);
  assert.deepEqual(after.map(sha256), before.map(sha256));
});

test("CLI parsing is explicit and fail-closed", () => {
  assert.deepEqual(parseArguments([]), {help: false, mode: "dry-run"});
  assert.deepEqual(parseArguments(["--apply"]), {
    help: false,
    mode: "apply",
  });
  assert.deepEqual(parseArguments(["--check"]), {
    help: false,
    mode: "check",
  });
  assert.deepEqual(parseArguments(["--help"]), {
    help: true,
    mode: "dry-run",
  });
  assert.throws(() => parseArguments(["--launch"]), /Unknown argument/);
});
