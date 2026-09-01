import assert from "node:assert/strict";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PROJECT_ROOT,
  buildGradeMappingReadiness,
  parseArguments,
} from "./map-shared-grade.mjs";

async function identity(relativePath) {
  const filePath = path.join(PROJECT_ROOT, relativePath);
  const bytes = await readFile(filePath);
  return {
    filePath,
    bytes,
    parsed: JSON.parse(bytes.toString("utf8")),
    sha256: (await import("node:crypto")).createHash("sha256").update(bytes).digest("hex"),
  };
}

test("pending mapping remains blocked and never creates grade routes", async () => {
  const [profileIdentity, mappingIdentity] = await Promise.all([
    identity("catalog/g678-shared-source-profile.v1.json"),
    identity("catalog/g678-grade-mapping.v1.json"),
  ]);
  const report = await buildGradeMappingReadiness({
    profileIdentity,
    mappingIdentity,
  });
  assert.equal(report.summary.recordCount, 44);
  assert.equal(report.summary.approvedAndReadyCount, 0);
  assert.equal(report.summary.statusCounts.pending, 44);
  assert.equal(report.summary.gradeRouteGenerationAllowed, false);
  assert.equal(report.records.every((record) => record.primaryGrade === null), true);
  assert.equal(report.acceptanceEffects.published, false);
});

test("one evidence-bound approved record does not unlock the remaining scope", async () => {
  const [profileIdentity, mappingIdentity] = await Promise.all([
    identity("catalog/g678-shared-source-profile.v1.json"),
    identity("catalog/g678-grade-mapping.v1.json"),
  ]);
  const mapping = structuredClone(mappingIdentity.parsed);
  mapping.records[0] = {
    ...mapping.records[0],
    primaryGrade: 6,
    ccssStandardCodes: ["CCSS.MATH.CONTENT.6.NS.C.5"],
    evidence: [{level: "A", kind: "official-scope", source: "fixture", excerpt: "fixture", sha256: null}],
    scoresByGrade: {"6": 5, "7": 2, "8": 0},
    reviewers: [
      {identity: "math-reviewer", role: "math-ccss-reviewer"},
      {identity: "independent-reviewer", role: "independent-reviewer", independent: true},
    ],
    status: "approved",
    decisionReason: "Test-only evidence-bound mapping fixture.",
    sourceManifestSha256: profileIdentity.parsed.sourceManifestSha256,
  };
  const report = await buildGradeMappingReadiness({
    profileIdentity,
    mappingIdentity: {...mappingIdentity, parsed: mapping},
    ccssId: "ccss-math-2010-v1",
  });
  assert.equal(report.summary.approvedAndReadyCount, 1);
  assert.equal(report.summary.gradeRouteGenerationAllowed, false);
  assert.deepEqual(report.records[0].blockers, []);
});

test("CLI parser keeps review enforcement explicit", () => {
  const parsed = parseArguments([
    "--check",
    "--profile", "catalog/g678-shared-source-profile.v1.json",
    "--mapping", "catalog/g678-grade-mapping.v1.json",
    "--ccss", "ccss-math-2010-v1",
    "--require-approved",
  ]);
  assert.equal(parsed.mode, "check");
  assert.equal(parsed.requireApproved, true);
});

test("a named pending CCSS authority receipt is hash-bound but cannot unlock routes", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "help-g678-ccss-receipt-"));
  t.after(() => rm(directory, {recursive: true, force: true}));
  const snapshotPath = path.join(directory, "Math_Standards1.pdf");
  const snapshotBytes = Buffer.from("official snapshot fixture\n", "utf8");
  await writeFile(snapshotPath, snapshotBytes);
  const snapshotSha256 = (await import("node:crypto")).createHash("sha256").update(snapshotBytes).digest("hex");
  const receiptPath = path.join(directory, "authority-receipt.json");
  await writeFile(receiptPath, JSON.stringify({
    schemaVersion: 1,
    artifactType: "ccss-authority-receipt-v1",
    status: "pending-authority-review",
    mappingVersion: "ccss-math-2010-v1",
    snapshotSha256,
    reviewerId: "dr-peter-hu",
  }));
  const [profileIdentity, mappingIdentity] = await Promise.all([
    identity("catalog/g678-shared-source-profile.v1.json"),
    identity("catalog/g678-grade-mapping.v1.json"),
  ]);
  const report = await buildGradeMappingReadiness({
    profileIdentity,
    mappingIdentity,
    ccssSnapshot: snapshotPath,
    ccssAuthorityReceipt: receiptPath,
  });
  assert.equal(report.ccss.authorityReviewer, "dr-peter-hu");
  assert.equal(report.ccss.status, "hash-observed-pending-authority-review");
  assert.equal(report.summary.gradeRouteGenerationAllowed, false);
  assert.equal(report.summary.approvedAndReadyCount, 0);
});

test("an approved CCSS corpus receipt closes only the snapshot authority gate", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "help-g678-ccss-approved-"));
  t.after(() => rm(directory, {recursive: true, force: true}));
  const snapshotPath = path.join(directory, "Math_Standards1.pdf");
  const snapshotBytes = Buffer.from("approved official snapshot fixture\n", "utf8");
  await writeFile(snapshotPath, snapshotBytes);
  const snapshotSha256 = (await import("node:crypto")).createHash("sha256").update(snapshotBytes).digest("hex");
  const receiptPath = path.join(directory, "authority-receipt-approved.json");
  await writeFile(receiptPath, JSON.stringify({
    schemaVersion: 1,
    artifactType: "ccss-authority-receipt-v1",
    status: "approved",
    mappingVersion: "ccss-math-2010-v1",
    snapshotSha256,
    reviewerId: "dr-peter-hu",
    reviewedAt: "2026-09-01T10:44:09Z",
  }));
  const [profileIdentity, mappingIdentity] = await Promise.all([
    identity("catalog/g678-shared-source-profile.v1.json"),
    identity("catalog/g678-grade-mapping.v1.json"),
  ]);
  const report = await buildGradeMappingReadiness({
    profileIdentity,
    mappingIdentity,
    ccssSnapshot: snapshotPath,
    ccssAuthorityReceipt: receiptPath,
  });
  assert.equal(report.ccss.status, "authority-approved");
  assert.equal(report.ccss.authorityReviewer, "dr-peter-hu");
  assert.deepEqual(report.summary.blockers, ["44-lesson-mappings-not-approved"]);
  assert.equal(report.summary.gradeRouteGenerationAllowed, false);
});
