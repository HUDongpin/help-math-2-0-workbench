import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  decodeAnimateFileUri,
  relocationAttemptKey,
} from "./build-g4-l3-animate-authoring-relocation-receipt.mjs";
import {projectWhitelistedFields} from "./build-g4-l3-sql-curriculum-crosswalk.mjs";

async function report(name) {
  return JSON.parse(await readFile(new URL(`../reports/${name}`, import.meta.url), "utf8"));
}

test("Animate relocation utilities reject unsafe identities and preserve decoded project paths", () => {
  assert.equal(decodeAnimateFileUri("file:///Volumes/WestWorld/HELP%20MATH%202.0/example.fla"),
    "/Volumes/WestWorld/HELP MATH 2.0/example.fla");
  assert.equal(relocationAttemptKey("course-g04-l03-ts-006", "run-primary"),
    "course-g04-l03-ts-006/run-primary");
  assert.throws(() => relocationAttemptKey("../escape", "run-primary"), /unsafe/);
  assert.throws(() => relocationAttemptKey("safe", "../../run"), /unsafe/);
});

test("SQL projection retains only an explicit field allowlist", () => {
  const projected = projectWhitelistedFields({Lesson_ID: 49, Name: "Negative Numbers", Password: "never-copy"}, [
    "Lesson_ID",
    "Name",
    "MissingField",
  ]);
  assert.deepEqual(projected, {Lesson_ID: 49, Name: "Negative Numbers", MissingField: null});
  assert.equal(Object.hasOwn(projected, "Password"), false);
});

test("checked provenance reports keep historical audio private and SQL de-identified", async () => {
  const [audio, sql, relocation] = await Promise.all([
    report("g4-l3-historical-audio-provenance.json"),
    report("g4-l3-sql-curriculum-crosswalk.json"),
    report("g4-l3-animate-authoring-relocation-receipt.json"),
  ]);
  assert.equal(audio.summary.unmatchedAudioCandidates, 15);
  assert.equal(audio.summary.stagedPrivateIntakeCandidates, 15);
  assert.equal(audio.summary.canonicalSourceFilesCopied, 0);
  assert.equal(audio.summary.ownerProvenanceApprovals, 0);
  assert.equal(audio.summary.strictAcceptanceEffect, false);
  assert.equal(sql.privacyBoundary.accountOrganizationActivityCredentialOrNoteTablesRead, 0);
  assert.equal(sql.privacyBoundary.personalRecordsWritten, 0);
  assert.equal(sql.privacyBoundary.rawRowsCopied, 0);
  assert.equal(sql.reconciliation.sqlSequenceAuthority, false);
  assert.equal(relocation.summary.workOnlyAuthoringAuditsPreserved, 29);
  assert.equal(relocation.summary.historicalFilesRewritten, 0);
  assert.equal(relocation.summary.strictAcceptancesEstablished, 0);
});
