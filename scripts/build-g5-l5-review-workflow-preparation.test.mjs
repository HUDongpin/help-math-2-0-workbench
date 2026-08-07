import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  copyFile,
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
import {fileURLToPath} from "node:url";

import {
  buildG5L5ReviewWorkflowPreparation,
  parseG5L5ReviewWorkflowArguments,
  renderG5L5ReviewWorkflowMarkdown,
  stableJson,
  validateG5L5ReviewWorkflowPreparation,
  writeOrCheckG5L5ReviewWorkflow,
} from "./build-g5-l5-review-workflow-preparation.mjs";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

let reportPromise;
function buildOnce() {
  reportPromise ||= buildG5L5ReviewWorkflowPreparation();
  return reportPromise;
}

async function withTemporaryRoot(callback) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-review-workflow-test-"),
  );
  try {
    return await callback(root);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
}

async function seedSourceBindings(root, report) {
  for (const binding of Object.values(report.sourceBindings)) {
    const destination = path.join(root, binding.path);
    await mkdir(path.dirname(destination), {recursive: true});
    await copyFile(path.join(PROJECT_ROOT, binding.path), destination);
  }
}

function refingerprint(report) {
  const projected = structuredClone(report);
  delete projected.reportFingerprintSha256;
  report.reportFingerprintSha256 = createHash("sha256")
    .update(stableJson(projected))
    .digest("hex");
}

test("prepares exactly four blank independent reviews for all 57 members", async () => {
  const report = await buildOnce();
  assert.equal(validateG5L5ReviewWorkflowPreparation(report), true);
  assert.equal(report.memberReviewBundles.length, 57);
  assert.equal(
    report.memberReviewBundles.flatMap(({reviews}) => reviews).length,
    228,
  );
  assert.deepEqual(
    Object.fromEntries(
      [
        "independent-engineering-review",
        "independent-human-visual-review",
        "independent-audio-review",
        "independent-spanish-review",
      ].map((reviewId) => [
        reviewId,
        report.memberReviewBundles
          .flatMap(({reviews}) => reviews)
          .filter((template) => template.reviewId === reviewId)
          .length,
      ]),
    ),
    {
      "independent-engineering-review": 57,
      "independent-human-visual-review": 57,
      "independent-audio-review": 57,
      "independent-spanish-review": 57,
    },
  );
  assert.ok(
    report.memberReviewBundles.flatMap(({reviews}) => reviews).every(
      (template) =>
        template.independenceRequired === true &&
        template.evidencePrerequisitesCurrent === false &&
        template.readyForHumanReview === false &&
        template.reviewerFullName === null &&
        template.reviewerSubjectId === null &&
        template.reviewedAt === null &&
        template.decision === null &&
        template.findings.length === 0 &&
        template.notes === null &&
        template.signatureEnvelope === null &&
        template.accepted === false &&
        template.automationMayComplete === false,
    ),
  );
});

test("prepares exactly three blank release approvals without approving them", async () => {
  const report = await buildOnce();
  assert.deepEqual(
    report.releaseApprovalTemplates.map(({approvalId}) => approvalId),
    [
      "owner-fidelity-acceptance",
      "strict-validation-approval",
      "atomic-publication-approval",
    ],
  );
  assert.ok(
    report.releaseApprovalTemplates.every(
      (template) =>
        template.preconditionsSatisfied === false &&
        template.readyForDecision === false &&
        template.approverFullName === null &&
        template.approverSubjectId === null &&
        template.approvedAt === null &&
        template.decision === null &&
        template.conditions.length === 0 &&
        template.notes === null &&
        template.signatureEnvelope === null &&
        template.approved === false &&
        template.automationMayComplete === false,
    ),
  );
  assert.equal(report.summary.memberReviewTemplateCount, 228);
  assert.equal(report.summary.releaseApprovalTemplateCount, 3);
  assert.equal(report.summary.totalUnsignedTemplateCount, 231);
});

test("keeps runtime, GUI, human, acceptance, strict, and publication effects at zero", async () => {
  const report = await buildOnce();
  assert.equal(report.execution.runnable, false);
  assert.deepEqual(report.execution.commands, []);
  assert.ok(
    Object.entries(report.execution)
      .filter(([key]) => !["runnable", "commands"].includes(key))
      .every(([, value]) => value === 0),
  );
  assert.ok(
    Object.values(report.acceptanceEffects).every((value) => value === false),
  );
  assert.ok(
    Object.values(report.protectedMutationCounts)
      .every((value) => value === 0),
  );
  assert.equal(report.currentInputBoundary.runtimeSessionCount, 0);
  assert.equal(
    report.currentInputBoundary.authoritativeOriginalRuntimeBaselineCount,
    0,
  );
  assert.equal(report.currentInputBoundary.animateGuiExecutionCount, 0);
  assert.equal(report.currentInputBoundary.implementationStartedCount, 0);
  assert.equal(report.currentInputBoundary.acceptedIndependentReviewCount, 0);
  assert.equal(report.currentInputBoundary.strictCompleteCount, 0);
  assert.equal(report.currentInputBoundary.publishedCount, 0);
});

test("validator rejects filled identity, signature, review, acceptance, strict, or publication state", async () => {
  const report = await buildOnce();
  for (const mutate of [
    (value) => {
      value.memberReviewBundles[0].reviews[0].reviewerFullName = "fabricated";
    },
    (value) => {
      value.memberReviewBundles[0].reviews[0].reviewedAt =
        "2099-01-01T00:00:00Z";
    },
    (value) => {
      value.memberReviewBundles[0].reviews[0].decision = "accepted";
    },
    (value) => {
      value.memberReviewBundles[0].reviews[0].signatureEnvelope = {};
    },
    (value) => {
      value.memberReviewBundles[0].reviews[0].accepted = true;
    },
    (value) => {
      value.releaseApprovalTemplates[0].approved = true;
    },
    (value) => {
      value.execution.guiApplicationsLaunched = 1;
    },
    (value) => {
      value.acceptanceEffects.ownerFidelityAccepted = true;
    },
    (value) => {
      value.summary.strictCompleteCount = 1;
    },
    (value) => {
      value.summary.publishedCount = 1;
    },
  ]) {
    const promoted = structuredClone(report);
    mutate(promoted);
    refingerprint(promoted);
    assert.throws(() => validateG5L5ReviewWorkflowPreparation(promoted));
  }
});

test("validator rejects forged release identities and misleading acceptance wording", async () => {
  const report = await buildOnce();
  const forgedIdentity = structuredClone(report);
  const firstBundle = forgedIdentity.memberReviewBundles[0];
  firstBundle.animationId = "fabricated-animation";
  firstBundle.assetId = "fabricated-asset";
  for (const template of firstBundle.reviews) {
    template.animationId = firstBundle.animationId;
    template.assetId = firstBundle.assetId;
    template.templateId = `${firstBundle.animationId}:${template.reviewId}`;
  }
  refingerprint(forgedIdentity);
  assert.throws(
    () => validateG5L5ReviewWorkflowPreparation(forgedIdentity),
    /57 unique release identities/,
  );

  const misleadingEffect = structuredClone(report);
  misleadingEffect.memberReviewBundles[0].reviews[0]
    .strictAcceptanceEffect = "none; but accepted in prose";
  refingerprint(misleadingEffect);
  assert.throws(
    () => validateG5L5ReviewWorkflowPreparation(misleadingEffect),
    /filled or promoted/,
  );
});

test("is deterministic and renders the exact fail-closed boundary", async () => {
  const report = await buildOnce();
  const rebuilt = await buildG5L5ReviewWorkflowPreparation();
  assert.equal(stableJson(rebuilt), stableJson(report));
  const markdown = renderG5L5ReviewWorkflowMarkdown(report);
  assert.match(markdown, /56 pages \+ Shell \/ 57 atomic release members/);
  assert.match(markdown, /228 blank unsigned templates/);
  assert.match(markdown, /57 empty \/ 0 sessions/);
  assert.match(markdown, /114 pending \/ 114 total/);
  assert.match(markdown, /0\/57 \/ 0\/57/);
  assert.match(markdown, /Strict acceptance effect: \*\*none\*\*/);
});

test("writer creates and checks a deterministic ordinary report pair", async () => {
  const report = await buildOnce();
  await withTemporaryRoot(async (root) => {
    await seedSourceBindings(root, report);
    await mkdir(path.join(root, "reports"), {recursive: true});
    const options = {
      report,
      projectRoot: root,
      outputPrefix: "reports/review-workflow",
    };
    const written = await writeOrCheckG5L5ReviewWorkflow(options);
    assert.equal(written.action, "written");
    assert.equal(written.outputCount, 2);
    assert.equal(
      await readFile(
        path.join(root, "reports", "review-workflow.json"),
        "utf8",
      ),
      stableJson(report),
    );
    assert.equal(
      await readFile(
        path.join(root, "reports", "review-workflow.md"),
        "utf8",
      ),
      renderG5L5ReviewWorkflowMarkdown(report),
    );
    const checked = await writeOrCheckG5L5ReviewWorkflow({
      ...options,
      check: true,
    });
    assert.deepEqual(checked, {action: "verified", outputCount: 2});
  });
});

test("writer rejects symlink and hardlink output targets", async () => {
  const report = await buildOnce();
  await withTemporaryRoot(async (root) => {
    await seedSourceBindings(root, report);
    await mkdir(path.join(root, "reports"), {recursive: true});
    const referent = path.join(root, "referent.txt");
    await writeFile(referent, "do-not-change\n");
    await symlink(
      referent,
      path.join(root, "reports", "review-workflow.json"),
    );
    await assert.rejects(
      writeOrCheckG5L5ReviewWorkflow({
        report,
        projectRoot: root,
        outputPrefix: "reports/review-workflow",
      }),
      /ordinary non-linked file/,
    );
    assert.equal(await readFile(referent, "utf8"), "do-not-change\n");
  });

  await withTemporaryRoot(async (root) => {
    await seedSourceBindings(root, report);
    await mkdir(path.join(root, "reports"), {recursive: true});
    const referent = path.join(root, "referent.txt");
    await writeFile(referent, "do-not-change\n");
    await link(
      referent,
      path.join(root, "reports", "review-workflow.json"),
    );
    await assert.rejects(
      writeOrCheckG5L5ReviewWorkflow({
        report,
        projectRoot: root,
        outputPrefix: "reports/review-workflow",
      }),
      /ordinary non-linked file/,
    );
    assert.equal(await readFile(referent, "utf8"), "do-not-change\n");
  });
});

test("writer rejects any source binding that drifts after construction", async () => {
  const report = await buildOnce();
  await withTemporaryRoot(async (root) => {
    await seedSourceBindings(root, report);
    const binding = report.sourceBindings.postM1RuntimeAcquisition;
    await writeFile(path.join(root, binding.path), "{}\n");
    await assert.rejects(
      writeOrCheckG5L5ReviewWorkflow({
        report,
        projectRoot: root,
        outputPrefix: "reports/review-workflow",
      }),
      /source bytes drifted after report construction/,
    );
  });
});

test("argument parser exposes bounded dry-run, apply, and check modes", () => {
  assert.deepEqual(parseG5L5ReviewWorkflowArguments([]), {
    mode: "dry-run",
    outputPrefix: "reports/g5-l5-review-workflow-preparation",
  });
  assert.deepEqual(parseG5L5ReviewWorkflowArguments(["--apply"]), {
    mode: "apply",
    outputPrefix: "reports/g5-l5-review-workflow-preparation",
  });
  assert.deepEqual(
    parseG5L5ReviewWorkflowArguments([
      "--check",
      "--output-prefix",
      "reports/test-review-workflow",
    ]),
    {
      mode: "check",
      outputPrefix: "reports/test-review-workflow",
    },
  );
  for (const argv of [
    ["--approve"],
    ["--dry-run", "--apply"],
    ["--output-prefix"],
    ["--output-prefix", "../escape"],
    ["--output-prefix", "reports/../escape"],
    ["--output-prefix", "reports/result.json"],
  ]) {
    assert.throws(() => parseG5L5ReviewWorkflowArguments(argv));
  }
});
