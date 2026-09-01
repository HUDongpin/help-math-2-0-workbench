import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
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
