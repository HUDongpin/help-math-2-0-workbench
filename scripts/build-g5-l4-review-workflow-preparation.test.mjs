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
  buildG5L4ReviewWorkflowPreparation,
  parseArguments,
  renderMarkdown,
  stableJson,
  validateG5L4ReviewWorkflowPreparation,
  writeOrCheck,
} from "./build-g5-l4-review-workflow-preparation.mjs";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

let reportPromise;
function buildOnce() {
  reportPromise ||= buildG5L4ReviewWorkflowPreparation();
  return reportPromise;
}

async function withTemporaryRoot(callback) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l4-review-workflow-test-"),
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

test("prepares exactly four unsigned independent reviews for all 55 members", async () => {
  const report = await buildOnce();
  assert.equal(validateG5L4ReviewWorkflowPreparation(report), true);
  assert.equal(report.memberReviewTemplates.length, 220);
  assert.deepEqual(
    Object.fromEntries(
      [
        "independent-engineering-review",
        "independent-human-visual-review",
        "independent-audio-review",
        "independent-spanish-review",
      ].map((reviewId) => [
        reviewId,
        report.memberReviewTemplates.filter(
          (template) => template.reviewId === reviewId,
        ).length,
      ]),
    ),
    {
      "independent-engineering-review": 55,
      "independent-human-visual-review": 55,
      "independent-audio-review": 55,
      "independent-spanish-review": 55,
    },
  );
  assert.ok(
    report.memberReviewTemplates.every(
      (template) =>
        template.independenceRequired === true &&
        template.reviewerFullName === null &&
        template.reviewerSubjectId === null &&
        template.reviewedAt === null &&
        template.decision === null &&
        template.findings.length === 0 &&
        template.signatureEnvelope === null &&
        template.accepted === false &&
        template.automationMayComplete === false,
    ),
  );
  assert.equal(report.summary.sourceStaticEngineeringCandidateCount, 52);
  assert.equal(report.summary.manifestBoundSingleSpriteCandidateCount, 51);
  assert.equal(report.summary.fullSingleSpriteCandidateCount, 20);
  assert.equal(report.summary.safePrefixSingleSpriteCandidateCount, 31);
  assert.equal(
    report.summary.independentDualSpriteCompositeCandidateCount,
    1,
  );
  assert.equal(report.summary.canonicalNestedCoverageCandidateCount, 51);
  assert.equal(report.summary.sourceStaticOpenFrameCount, 13696);
  assert.equal(report.summary.sourceStaticBlockedTailFrameCount, 3020);
  assert.equal(report.summary.currentJavaScriptOutputPresentCount, 52);
  assert.equal(report.summary.implementationStartedCount, 52);
  assert.equal(report.summary.implementationSpecificationReadyCount, 0);
  assert.equal(report.summary.implementationAuthorizedCount, 0);
});

test("prepares three unsigned release approvals without accepting them", async () => {
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
        template.approverFullName === null &&
        template.approverSubjectId === null &&
        template.approvedAt === null &&
        template.decision === null &&
        template.signatureEnvelope === null &&
        template.approved === false &&
        template.automationMayComplete === false,
    ),
  );
  assert.equal(report.summary.totalUnsignedTemplateCount, 223);
  assert.ok(
    Object.values(report.acceptanceEffects).every((value) => value === false),
  );
});

test("validator rejects identities, reviews, signatures, fidelity, strict, and publication promotion", async () => {
  const report = await buildOnce();
  for (const mutate of [
    (value) => {
      value.memberReviewTemplates[0].reviewerFullName = "fabricated";
    },
    (value) => {
      value.memberReviewTemplates[0].accepted = true;
    },
    (value) => {
      value.memberReviewTemplates[0].signatureEnvelope = {};
    },
    (value) => {
      value.releaseApprovalTemplates[0].approved = true;
    },
    (value) => {
      value.summary.acceptedReviewCount = 1;
    },
    (value) => {
      value.summary.strictCompleteCount = 1;
    },
    (value) => {
      value.summary.sourceStaticEngineeringCandidateCount = 6;
    },
    (value) => {
      value.summary.implementationAuthorizedCount = 1;
    },
    (value) => {
      value.acceptanceEffects.ownerFidelityAccepted = true;
    },
    (value) => {
      value.acceptanceEffects.published = true;
    },
  ]) {
    const promoted = structuredClone(report);
    mutate(promoted);
    assert.throws(
      () => validateG5L4ReviewWorkflowPreparation(promoted),
    );
  }
});

test("validator rejects a jointly forged canonical identity and exact acceptance wording", async () => {
  const report = await buildOnce();
  const forgedIdentity = structuredClone(report);
  for (const template of forgedIdentity.memberReviewTemplates.slice(0, 4)) {
    template.animationId = "fabricated-animation";
    template.assetId = "fabricated-asset";
    template.templateId = `fabricated-animation:${template.reviewId}`;
  }
  refingerprint(forgedIdentity);
  assert.throws(
    () => validateG5L4ReviewWorkflowPreparation(forgedIdentity),
    /canonical release identities/,
  );

  const misleadingEffect = structuredClone(report);
  misleadingEffect.memberReviewTemplates[0].strictAcceptanceEffect =
    "none; but strict-complete in prose";
  refingerprint(misleadingEffect);
  assert.throws(
    () => validateG5L4ReviewWorkflowPreparation(misleadingEffect),
    /review template was filled or promoted/,
  );
});

test("is deterministic and renders the evidence boundary", async () => {
  const report = await buildOnce();
  const rebuilt = await buildG5L4ReviewWorkflowPreparation();
  assert.equal(stableJson(rebuilt), stableJson(report));
  const markdown = renderMarkdown(report);
  assert.match(markdown, /220 unsigned templates/);
  assert.match(markdown, /154/);
  assert.match(markdown, /0\/44/);
  assert.match(markdown, /52\/55/);
  assert.match(markdown, /52\/55 \/ 0\/55/);
  assert.match(markdown, /0\/55 \/ 0/);
  assert.match(markdown, /Strict acceptance effect: \*\*none\*\*/);
});

test("writer creates and checks a deterministic report pair", async () => {
  const report = await buildOnce();
  await withTemporaryRoot(async (root) => {
    await seedSourceBindings(root, report);
    await mkdir(path.join(root, "reports"), {recursive: true});
    const options = {
      report,
      projectRoot: root,
      outputPrefix: "reports/review-workflow",
    };
    const written = await writeOrCheck(options);
    assert.equal(written.action, "written");
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
      renderMarkdown(report),
    );
    const checked = await writeOrCheck({...options, check: true});
    assert.equal(checked.action, "verified");
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
      writeOrCheck({
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
      writeOrCheck({
        report,
        projectRoot: root,
        outputPrefix: "reports/review-workflow",
      }),
      /ordinary non-linked file/,
    );
    assert.equal(await readFile(referent, "utf8"), "do-not-change\n");
  });
});

test("writer rejects a source binding that drifts after report construction", async () => {
  const report = await buildOnce();
  await withTemporaryRoot(async (root) => {
    await seedSourceBindings(root, report);
    const binding = report.sourceBindings.specificationReadiness;
    await writeFile(path.join(root, binding.path), "{}\n");
    await assert.rejects(
      writeOrCheck({
        report,
        projectRoot: root,
        outputPrefix: "reports/review-workflow",
      }),
      /source bytes drifted after report construction/,
    );
  });
});

test("argument parser accepts reports paths and rejects unsafe options", () => {
  assert.deepEqual(parseArguments(["--check"]), {
    check: true,
    outputPrefix: "reports/g5-l4-review-workflow-preparation",
  });
  assert.deepEqual(
    parseArguments([
      "--output-prefix",
      "reports/test-review-workflow",
    ]),
    {
      check: false,
      outputPrefix: "reports/test-review-workflow",
    },
  );
  for (const argv of [
    ["--approve"],
    ["--output-prefix"],
    ["--output-prefix", "../escape"],
    ["--output-prefix", "reports/../escape"],
    ["--output-prefix", "reports/result.json"],
  ]) {
    assert.throws(() => parseArguments(argv));
  }
});
