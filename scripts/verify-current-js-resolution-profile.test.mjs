import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  DEFAULT_V1_PROFILE,
  validateProfileDocument,
} from "./verify-current-js-resolution-profile.mjs";

const RELEASES = [
  "lesson-g03-l02-addition-subtraction-page-only-current-js",
  "lesson-g04-l03-negative-numbers",
  "lesson-g05-l03-exponents-prime-factorizations-page-only",
  "lesson-g05-l04-number-lines",
  "lesson-g05-l05-add-subtract-negative-numbers",
];

async function loadProductionV1() {
  return JSON.parse(await readFile(DEFAULT_V1_PROFILE, "utf8"));
}

test("immutable five-Lesson v1 profile satisfies the verifier schema", async () => {
  const profile = await loadProductionV1();
  const parsed = validateProfileDocument(profile, {version: 1});
  assert.equal(parsed.entries.length, 1114);
  assert.equal(
    parsed.entries.filter((entry) =>
      /^courses\/course-g(?:03|04|05)-l\d{2}-[^/]+\/canvas-renderer\.js$/u
        .test(entry.assetPath)).length,
    283,
  );
  assert.deepEqual(parsed.approvedReleaseIds, RELEASES);
});

test("v2 schema fixes the immutable parent and rejects extra fields", async () => {
  const parent = await loadProductionV1();
  const candidate = {
    schemaVersion: 2,
    profileId: "current-js-production-assets-v2",
    parentProfileId: "current-js-production-assets-v1",
    parentChecksumSetSha256:
      "52dd1d51335523dc097b0c1a428e897960425ad184069fb023e98e0fcef7ae25",
    generatedBy: "fixture-adaptive-canvas-generator",
    approvalScope: parent.approvalScope,
    approvedReleaseIds: parent.approvedReleaseIds,
    counts: parent.counts,
    checksumSetSha256: parent.checksumSetSha256,
    entries: parent.entries,
  };
  assert.equal(
    validateProfileDocument(candidate, {version: 2}).parentProfileId,
    "current-js-production-assets-v1",
  );
  assert.throws(
    () => validateProfileDocument({...candidate, candidateAssets: []}, {version: 2}),
    /keys changed/u,
  );
  assert.throws(
    () => validateProfileDocument({...candidate, parentChecksumSetSha256: "0".repeat(64)}, {version: 2}),
    /parent checksum changed/u,
  );
});

test("candidate Lesson assets fail closed even with a syntactically valid path", async () => {
  const parent = await loadProductionV1();
  const entries = parent.entries.map((entry, index) => index === 0
    ? {
        ...entry,
        assetPath: "courses/course-g04-l10-fq-001/canvas-renderer.js",
        relativePath: "course-g04-l10-fq-001/canvas-renderer.js",
      }
    : entry);
  assert.throws(
    () => validateProfileDocument({...parent, entries}, {version: 1}),
    /leaked a G4 L5\/L10\/L11 candidate asset/u,
  );
});
