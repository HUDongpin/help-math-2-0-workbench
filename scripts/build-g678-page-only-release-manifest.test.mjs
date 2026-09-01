import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  PROJECT_ROOT,
  buildReleaseManifest,
  validateReleaseManifest,
} from "./build-g678-page-only-release-manifest.mjs";

async function identity(relativePath) {
  const filePath = path.join(PROJECT_ROOT, relativePath);
  const bytes = await readFile(filePath);
  const {createHash} = await import("node:crypto");
  return {
    filePath,
    value: JSON.parse(bytes.toString("utf8")),
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

test("release manifest preserves 44 source-ordered page-only memberships", async () => {
  const [catalog, mapping] = await Promise.all([
    identity("catalog/g678-shared-catalog.v1.json"),
    identity("catalog/g678-grade-mapping.v1.json"),
  ]);
  const manifest = buildReleaseManifest({
    catalog: catalog.value,
    mapping: mapping.value,
    catalogIdentity: catalog,
    mappingIdentity: mapping,
  });
  assert.deepEqual(validateReleaseManifest(manifest), []);
  assert.equal(manifest.releases.length, 44);
  assert.deepEqual(manifest.releases.map((release) => release.releaseOrder), Array.from({length: 44}, (_value, index) => index + 1));
  assert.equal(manifest.expectedCounts.activeXmlReferencedPages, 2282);
  assert.equal(manifest.expectedCounts.courseShells, 0);
  assert.equal(manifest.releases.every((release) => release.status === "source-audit-only"), true);
  assert.equal(manifest.releases.every((release) => release.members.every((member) => member.registrationStatus === "unregistered-source-bound")), true);
});

test("release validator rejects a shell or implicit registration", async () => {
  const [catalog, mapping] = await Promise.all([
    identity("catalog/g678-shared-catalog.v1.json"),
    identity("catalog/g678-grade-mapping.v1.json"),
  ]);
  const manifest = buildReleaseManifest({catalog: catalog.value, mapping: mapping.value, catalogIdentity: catalog, mappingIdentity: mapping});
  const mutated = structuredClone(manifest);
  mutated.releases[0].expectedCounts.courseShells = 1;
  mutated.releases[0].members[0].registrationStatus = "registered";
  const errors = validateReleaseManifest(mutated);
  assert.equal(errors.some((error) => /courseShells|implicitly registered/u.test(error)), true);
});
