import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  loadG5L4AudioHumanReviewContract,
  validateG5L4AudioHumanReviewWorksheet,
} from "./validate-g5-l4-audio-human-review-worksheet.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function makeCompleteWorksheet() {
  const contract = await loadG5L4AudioHumanReviewContract({projectRoot: PROJECT_ROOT});
  return {
    schemaVersion: 1,
    artifactType: "g5-l4-audio-human-review-worksheet",
    status: "unsigned-reviewer-export",
    acceptanceEffect: "none-until-independent-validation-and-adoption",
    reviewId: contract.report.reviewId,
    reviewReport: {path: contract.reportPath, sha256: contract.reportSha256},
    productUrl: "http://127.0.0.1:3211/courses/5/4?mode=focus",
    reviewerIdentity: "Test-only reviewer",
    reviewerRole: "Automated validator fixture",
    exactCommitSha: "a".repeat(40),
    exportedAt: "2026-08-16T00:00:00.000Z",
    trackReviews: contract.trackIds.map((id) => ({
      id,
      language: "pass",
      content: "pass",
      intelligibility: "pass",
      technicalQuality: "pass",
      decision: "pass",
      notes: "",
    })),
    pageReviews: contract.pages.map((page) => ({
      id: page.animationId,
      decision: page.reviewTemplate === null ? "pending" : "pass",
      notes: "",
    })),
  };
}

test("complete worksheet validates without creating acceptance", async () => {
  const result = await validateG5L4AudioHumanReviewWorksheet(
    await makeCompleteWorksheet(),
    {projectRoot: PROJECT_ROOT},
  );
  assert.equal(result.status, "structurally-complete-unsigned-reviewer-input");
  assert.equal(result.reviewOutcomeCandidate, "all-reviewed-items-pass-candidate");
  assert.equal(result.counts.trackReviews, 185);
  assert.equal(result.counts.reviewablePageReviews, 53);
  assert.equal(result.counts.blockedPageReviews, 1);
  assert.equal(result.fq001DispositionAccepted, false);
  assert.equal(result.ownerAcceptance, false);
  assert.equal(result.publicationAuthorized, false);
});

test("validator fails closed on pending, contradictory, and not-applicable decisions", async (t) => {
  await t.test("pending track", async () => {
    const worksheet = await makeCompleteWorksheet();
    worksheet.trackReviews[0].language = "pending";
    await assert.rejects(
      validateG5L4AudioHumanReviewWorksheet(worksheet, {projectRoot: PROJECT_ROOT}),
      /remains pending/,
    );
  });
  await t.test("criterion failure with overall pass", async () => {
    const worksheet = await makeCompleteWorksheet();
    worksheet.trackReviews[0].content = "fail";
    await assert.rejects(
      validateG5L4AudioHumanReviewWorksheet(worksheet, {projectRoot: PROJECT_ROOT}),
      /overall pass requires|failed criterion requires/,
    );
  });
  await t.test("unexplained N\/A", async () => {
    const worksheet = await makeCompleteWorksheet();
    worksheet.pageReviews[0].decision = "not-applicable";
    await assert.rejects(
      validateG5L4AudioHumanReviewWorksheet(worksheet, {projectRoot: PROJECT_ROOT}),
      /requires explanatory notes/,
    );
  });
});

test("validator rejects stale identity, duplicates, and a fabricated FQ001 decision", async (t) => {
  await t.test("stale report digest", async () => {
    const worksheet = await makeCompleteWorksheet();
    worksheet.reviewReport.sha256 = "0".repeat(64);
    await assert.rejects(
      validateG5L4AudioHumanReviewWorksheet(worksheet, {projectRoot: PROJECT_ROOT}),
      /not bound to the current listening report/,
    );
  });
  await t.test("non-exact loopback product URL", async () => {
    const worksheet = await makeCompleteWorksheet();
    worksheet.productUrl =
      "http://127.0.0.1:3211/courses/5/4?mode=focus&mode=focus";
    await assert.rejects(
      validateG5L4AudioHumanReviewWorksheet(worksheet, {projectRoot: PROJECT_ROOT}),
      /exact G5 L4 focus route/,
    );
  });
  await t.test("duplicate track", async () => {
    const worksheet = await makeCompleteWorksheet();
    worksheet.trackReviews[1].id = worksheet.trackReviews[0].id;
    await assert.rejects(
      validateG5L4AudioHumanReviewWorksheet(worksheet, {projectRoot: PROJECT_ROOT}),
      /must be unique/,
    );
  });
  await t.test("FQ001 fabricated pass", async () => {
    const worksheet = await makeCompleteWorksheet();
    const fq001 = worksheet.pageReviews.find((row) => row.id === "course-g05-l04-fq-001");
    fq001.decision = "pass";
    await assert.rejects(
      validateG5L4AudioHumanReviewWorksheet(worksheet, {projectRoot: PROJECT_ROOT}),
      /blocked FQ001 must remain pending/,
    );
  });
});
