#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const REVIEW_REPORT = "reports/g5-l4-current-js-audio-listening-review-v1.json";
const TRACK_FIELDS = [
  "language",
  "content",
  "intelligibility",
  "technicalQuality",
  "decision",
];
const FINAL_DECISIONS = new Set(["pass", "fail", "not-applicable"]);
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, expected, label) {
  invariant(isPlainObject(value), `${label} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  invariant(
    JSON.stringify(actual) === JSON.stringify(wanted),
    `${label} fields changed: expected ${wanted.join(", ")}; received ${actual.join(", ")}`,
  );
}

function requiredText(value, label) {
  invariant(typeof value === "string" && value.trim() === value && value.length > 0,
    `${label} must be a non-empty trimmed string`);
  return value;
}

function validateIsoTimestamp(value, label) {
  requiredText(value, label);
  invariant(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) &&
      Number.isFinite(Date.parse(value)),
    `${label} must be an ISO-8601 UTC timestamp`,
  );
}

function validateLoopbackProductUrl(value) {
  const url = new URL(requiredText(value, "productUrl"));
  invariant(url.protocol === "http:", "productUrl must use loopback HTTP");
  invariant(LOOPBACK_HOSTS.has(url.hostname), "productUrl must be loopback-only");
  invariant(
    url.username === "" && url.password === "" && url.hash === "" &&
      url.pathname === "/courses/5/4" && url.search === "?mode=focus",
    "productUrl must be the exact G5 L4 focus route",
  );
}

function validateFinalDecision(value, label, notes) {
  invariant(FINAL_DECISIONS.has(value), `${label} remains pending or is invalid`);
  if (value === "not-applicable") {
    invariant(
      typeof notes === "string" && notes.trim().length > 0,
      `${label}=not-applicable requires explanatory notes`,
    );
  }
}

function validateTrackReview(row, expectedId) {
  exactKeys(
    row,
    ["id", "language", "content", "intelligibility", "technicalQuality", "decision", "notes"],
    `trackReviews[${expectedId}]`,
  );
  invariant(row.id === expectedId, `track review order/identity changed at ${expectedId}`);
  invariant(typeof row.notes === "string", `${row.id}: notes must be a string`);
  for (const field of TRACK_FIELDS) {
    validateFinalDecision(row[field], `${row.id}.${field}`, row.notes);
  }
  if (row.decision === "pass") {
    invariant(
      TRACK_FIELDS.slice(0, -1).every((field) => row[field] === "pass"),
      `${row.id}: overall pass requires every listening criterion to pass`,
    );
  }
  if (TRACK_FIELDS.slice(0, -1).some((field) => row[field] === "fail")) {
    invariant(row.decision === "fail", `${row.id}: failed criterion requires overall fail`);
  }
}

function validatePageReview(row, expectedPage) {
  exactKeys(row, ["id", "decision", "notes"], `pageReviews[${expectedPage.animationId}]`);
  invariant(
    row.id === expectedPage.animationId,
    `page review order/identity changed at ${expectedPage.animationId}`,
  );
  invariant(typeof row.notes === "string", `${row.id}: notes must be a string`);
  if (expectedPage.reviewTemplate === null) {
    invariant(
      row.decision === "pending" && row.notes.trim() === "",
      `${row.id}: blocked FQ001 must remain pending and unannotated in this worksheet`,
    );
    return;
  }
  validateFinalDecision(row.decision, `${row.id}.decision`, row.notes);
}

export async function loadG5L4AudioHumanReviewContract({
  projectRoot = DEFAULT_PROJECT_ROOT,
} = {}) {
  const root = path.resolve(projectRoot);
  const reportPath = path.resolve(root, REVIEW_REPORT);
  const reportBytes = await readFile(reportPath);
  const report = JSON.parse(reportBytes.toString("utf8"));
  invariant(
    report?.reviewId === "g5-l4-current-js-audio-listening-review-v1" &&
      report?.status === "unsigned-pending-human-listening-and-sync-review" &&
      report?.summary?.uniqueTrackCount === 185 &&
      report?.summary?.pageCount === 54 &&
      report?.summary?.reviewablePageCount === 53 &&
      report?.summary?.humanReviewedTrackCount === 0 &&
      report?.summary?.humanReviewedPageCount === 0,
    "listening report identity or acceptance-neutral boundary changed",
  );
  const blocked = report.pages.filter((page) => page.reviewTemplate === null);
  invariant(
    blocked.length === 1 && blocked[0].animationId === "course-g05-l04-fq-001",
    "FQ001 must remain the sole blocked page",
  );
  invariant(new Set(report.tracks.map((track) => track.id)).size === 185,
    "listening report track IDs are not unique");
  invariant(new Set(report.pages.map((page) => page.animationId)).size === 54,
    "listening report page IDs are not unique");
  return {
    report,
    reportPath: REVIEW_REPORT,
    reportSha256: sha256(reportBytes),
    trackIds: report.tracks.map((track) => track.id),
    pages: report.pages,
  };
}

export async function validateG5L4AudioHumanReviewWorksheet(
  worksheet,
  {projectRoot = DEFAULT_PROJECT_ROOT} = {},
) {
  const contract = await loadG5L4AudioHumanReviewContract({projectRoot});
  exactKeys(worksheet, [
    "schemaVersion",
    "artifactType",
    "status",
    "acceptanceEffect",
    "reviewId",
    "reviewReport",
    "productUrl",
    "reviewerIdentity",
    "reviewerRole",
    "exactCommitSha",
    "exportedAt",
    "trackReviews",
    "pageReviews",
  ], "worksheet");
  invariant(worksheet.schemaVersion === 1, "worksheet schemaVersion must be 1");
  invariant(
    worksheet.artifactType === "g5-l4-audio-human-review-worksheet" &&
      worksheet.status === "unsigned-reviewer-export" &&
      worksheet.acceptanceEffect === "none-until-independent-validation-and-adoption" &&
      worksheet.reviewId === contract.report.reviewId,
    "worksheet authority or review identity changed",
  );
  exactKeys(worksheet.reviewReport, ["path", "sha256"], "worksheet.reviewReport");
  invariant(
    worksheet.reviewReport.path === contract.reportPath &&
      worksheet.reviewReport.sha256 === contract.reportSha256,
    "worksheet is not bound to the current listening report",
  );
  validateLoopbackProductUrl(worksheet.productUrl);
  requiredText(worksheet.reviewerIdentity, "reviewerIdentity");
  requiredText(worksheet.reviewerRole, "reviewerRole");
  invariant(
    typeof worksheet.exactCommitSha === "string" && /^[a-f0-9]{40}$/.test(worksheet.exactCommitSha),
    "exactCommitSha must be 40 lowercase hexadecimal characters",
  );
  validateIsoTimestamp(worksheet.exportedAt, "exportedAt");
  invariant(Array.isArray(worksheet.trackReviews), "trackReviews must be an array");
  invariant(Array.isArray(worksheet.pageReviews), "pageReviews must be an array");
  invariant(worksheet.trackReviews.length === 185, "worksheet must contain exactly 185 track reviews");
  invariant(worksheet.pageReviews.length === 54, "worksheet must contain exactly 54 page rows");
  invariant(new Set(worksheet.trackReviews.map((row) => row?.id)).size === 185,
    "track review IDs must be unique");
  invariant(new Set(worksheet.pageReviews.map((row) => row?.id)).size === 54,
    "page review IDs must be unique");
  contract.trackIds.forEach((id, index) => validateTrackReview(worksheet.trackReviews[index], id));
  contract.pages.forEach((page, index) => validatePageReview(worksheet.pageReviews[index], page));

  const trackDecisionCounts = Object.fromEntries(
    [...FINAL_DECISIONS].map((decision) => [
      decision,
      worksheet.trackReviews.filter((row) => row.decision === decision).length,
    ]),
  );
  const reviewablePages = worksheet.pageReviews.filter(
    (row) => row.id !== "course-g05-l04-fq-001",
  );
  const pageDecisionCounts = Object.fromEntries(
    [...FINAL_DECISIONS].map((decision) => [
      decision,
      reviewablePages.filter((row) => row.decision === decision).length,
    ]),
  );
  const allTrackDecisionsPass = trackDecisionCounts.pass === 185;
  const allReviewablePageDecisionsPass = pageDecisionCounts.pass === 53;
  return {
    schemaVersion: 1,
    artifactType: "g5-l4-audio-human-review-worksheet-validation",
    status: "structurally-complete-unsigned-reviewer-input",
    authority: "machine-validation-only",
    acceptanceEffect: "none-until-independent-adoption-and-owner-decision",
    reviewId: contract.report.reviewId,
    reviewReport: {path: contract.reportPath, sha256: contract.reportSha256},
    reviewerIdentity: worksheet.reviewerIdentity,
    reviewerRole: worksheet.reviewerRole,
    exactCommitSha: worksheet.exactCommitSha,
    exportedAt: worksheet.exportedAt,
    counts: {
      trackReviews: 185,
      reviewablePageReviews: 53,
      blockedPageReviews: 1,
      trackDecisions: trackDecisionCounts,
      pageDecisions: pageDecisionCounts,
    },
    reviewOutcomeCandidate: allTrackDecisionsPass && allReviewablePageDecisionsPass
      ? "all-reviewed-items-pass-candidate"
      : "contains-fail-or-not-applicable-decisions",
    allTrackDecisionsPass,
    allReviewablePageDecisionsPass,
    fq001DispositionAccepted: false,
    ownerAcceptance: false,
    publicationAuthorized: false,
  };
}

async function main(argv) {
  invariant(argv.length === 1, "usage: node scripts/validate-g5-l4-audio-human-review-worksheet.mjs WORKSHEET.json");
  const worksheetBytes = await readFile(path.resolve(argv[0]));
  const worksheet = JSON.parse(worksheetBytes.toString("utf8"));
  const validation = await validateG5L4AudioHumanReviewWorksheet(worksheet);
  process.stdout.write(`${JSON.stringify(validation, null, 2)}\n`);
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.stack : error}\n`);
    process.exitCode = 1;
  }
}
