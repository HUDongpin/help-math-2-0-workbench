import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

async function json(relativePath) {
  const bytes = await readFile(path.join(ROOT, relativePath));
  return JSON.parse(bytes.toString("utf8"));
}

test("checked-in G6-G8 source projection and reports retain the exact page-only denominator", async () => {
  const [catalog, release, matrix, mapping, governance] = await Promise.all([
    json("catalog/g678-shared-catalog.v1.json"),
    json("catalog/g678-page-only-release-manifest.v1.json"),
    json("reports/g678-acceptance-matrix.json"),
    json("reports/g678-grade-mapping-readiness.json"),
    json("catalog/g678-review-governance.v1.json"),
  ]);
  assert.equal(catalog.canonicalLessonXmlCount, 44);
  assert.equal(catalog.$schema, '../schemas/g678-shared-source-catalog-v1.schema.json');
  assert.equal(catalog.activePagePlacementCount, 2282);
  assert.equal(catalog.uniqueActiveSwfSha256Count, 2240);
  assert.equal(catalog.audit.commentedPageCount, 315);
  assert.equal(catalog.audit.variantPlacements, 46);
  assert.equal(catalog.audit.dependencyHolds, 92);
  assert.equal(catalog.audit.canonicalFileCounts.fla, 0);
  assert.equal(catalog.audit.unknownSwfMagic.length, 0);
  assert.equal(catalog.audit.unknownCanonicalSwfMagic.length, 2);
  assert.equal(JSON.stringify(catalog).includes("/Volumes/"), false);
  assert.equal(release.expectedCounts.activeXmlReferencedPages, 2282);
  assert.equal(release.expectedCounts.courseShells, 0);
  assert.equal(release.releases.length, 44);
  assert.equal(matrix.funnel.registeredCurrentJsPages, 0);
  assert.equal(matrix.funnel.publishedLessons, 0);
  assert.equal(mapping.summary.gradeRouteGenerationAllowed, false);
  assert.equal(governance.m0Exit, false);
});
