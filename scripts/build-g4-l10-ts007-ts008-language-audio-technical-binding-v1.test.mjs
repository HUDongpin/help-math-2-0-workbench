#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  chmod,
  mkdir,
  mkdtemp,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import test from "node:test";

import {
  REPORT_JSON,
  REPORT_MARKDOWN,
  buildBundle,
  checkReport,
  parseCliArgs,
  publishNoClobber,
  validateReport,
} from "./build-g4-l10-ts007-ts008-language-audio-technical-binding-v1.mjs";

const bundle = await buildBundle();

test("CLI exposes only dry-run, no-clobber write, and read-only check", () => {
  assert.equal(parseCliArgs(["--dry-run"]), "--dry-run");
  assert.equal(parseCliArgs(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]));
  assert.throws(() => parseCliArgs(["--apply"]));
  assert.throws(() => parseCliArgs(["--check", "extra"]));
});

test("TS007 and TS008 bind exactly two external and twenty-four embedded candidates", () => {
  validateReport(bundle.report);
  assert.equal(bundle.report.members.length, 2);
  assert.equal(bundle.report.aggregate.exactExternalCandidateCount, 2);
  assert.equal(bundle.report.aggregate.embeddedUnknownLanguageCandidateCount, 24);
  assert.equal(bundle.report.aggregate.totalCandidateCount, 26);
  assert.equal(bundle.report.aggregate.targetActionScriptAudioOperationCount, 0);
});

test("EN and ES obligations preserve route and spoken-language boundaries", () => {
  for (const member of bundle.report.members) {
    const en = member.languageObligations.find((row) => row.language === "en");
    const es = member.languageObligations.find((row) => row.language === "es");
    assert.equal(en.exactExternalCandidateIds.length, 0);
    assert.equal(en.embeddedUnknownLanguageCandidateIds.length, 12);
    assert.equal(es.exactExternalCandidateIds.length, 1);
    assert.equal(es.embeddedUnknownLanguageCandidateIds.length, 12);
    assert.equal(member.exactExternalCandidate.spokenLanguageEstablished, false);
    assert.equal(member.exactExternalCandidate.runtimeReachabilityEstablished,
      false);
    assert.ok(member.embeddedCandidates.every((candidate) =>
      candidate.spokenLanguage === null &&
      candidate.rootRuntimeCueTime === null));
  }
});

test("manifest follow-up is exact-preimage but unapplied and unadopted", () => {
  for (const member of bundle.report.members) {
    const followUp = member.manifestFollowUpProposal;
    assert.deepEqual(followUp.operations[0].exactPreimage, ["und"]);
    assert.deepEqual(followUp.operations[0].proposedSuccessorValue,
      ["und", "es"]);
    assert.equal(followUp.operations[1].exactPreimage, "und");
    assert.equal(followUp.operations[1].proposedSuccessorValue, "es");
    assert.equal(followUp.applyAuthorizedByThisArtifact, false);
    assert.equal(followUp.applied, false);
    assert.equal(followUp.adoptionReviewPresent, false);
  }
});

test("Grade 4 and security gates remain closed", () => {
  assert.equal(bundle.report.grade4Boundary.l10MissingCourseMp3Count, 0);
  assert.equal(bundle.report.grade4Boundary
    .theseExactExternalMp3sAreAmongMissing16, false);
  assert.equal(bundle.report.grade4Boundary.wholeGrade4MissingCourseMp3Count,
    16);
  assert.deepEqual(bundle.report.grade4Boundary.missingCourseMp3ByLesson,
    {2: 14, 6: 1, 8: 1});
  assert.equal(bundle.report.securityAndRuntimeBoundary.reviewBatchReusable,
    false);
  assert.equal(bundle.report.securityAndRuntimeBoundary
    .productionHelperImplementationEligible, false);
  assert.equal(bundle.report.securityAndRuntimeBoundary
    .originalRuntimeLaunchAuthorizedByThisArtifact, false);
  assert.ok(Object.values(bundle.report.authorityEffects).every((value) =>
    value === false));
});

test("publication is exact no-clobber, read-only, checkable, and tamper-evident", async () => {
  const tempRoot = await realpath(await mkdtemp(path.join(tmpdir(),
    "g4-l10-ts007-ts008-audio-binding-")));
  try {
    await mkdir(path.join(tempRoot, "reports"));
    const published = await publishNoClobber(bundle, {outputRoot: tempRoot});
    assert.equal(published.disposition, "checked");
    await assert.rejects(() => publishNoClobber(bundle,
      {outputRoot: tempRoot}), /refusing overwrite/);
    const jsonPath = path.join(tempRoot, REPORT_JSON);
    const markdownPath = path.join(tempRoot, REPORT_MARKDOWN);
    await chmod(jsonPath, 0o644);
    await writeFile(jsonPath, `${bundle.json} `);
    await assert.rejects(() => checkReport(bundle, tempRoot),
      /mode changed|byte count changed|SHA-256 changed/);
    await chmod(markdownPath, 0o644);
  } finally {
    await rm(tempRoot, {recursive: true, force: true});
  }
});
