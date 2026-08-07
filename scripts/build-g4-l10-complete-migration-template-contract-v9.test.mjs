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
  checkContract,
  parseCliArgs,
  publishNoClobber,
  validateContract,
} from "./build-g4-l10-complete-migration-template-contract-v9.mjs";

const bundle = await buildBundle();

test("CLI is restricted to dry-run, no-clobber write, or read-only check", () => {
  assert.equal(parseCliArgs(["--dry-run"]), "--dry-run");
  assert.equal(parseCliArgs(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]));
  assert.throws(() => parseCliArgs(["--apply"]));
  assert.throws(() => parseCliArgs(["--check", "extra"]));
});

test("v9 preserves the complete v8 denominator and formal gate", () => {
  validateContract(bundle.report);
  assert.equal(bundle.report.scope.memberCount, 47);
  assert.equal(bundle.report.currentFormalState.requirements.total, 520);
  assert.equal(bundle.report.currentFormalState.requirements.rootReady, 94);
  assert.equal(bundle.report.currentFormalState.requirements.unresolvedNested,
    426);
  assert.equal(bundle.report.currentFormalState.requirements
    .unresolvedFrameDomainDispositions, 74);
  assert.equal(bundle.report.currentFormalState.frameObligations.total, 44488);
  assert.equal(bundle.report.currentFormalState.frameObligations
    .authoritativeCaptured, 0);
});

test("v9 binds TS007/TS008 audio candidates without adopting the follow-up", () => {
  const audio = bundle.report.latestAuditCurrentness
    .ts007Ts008LanguageAudioBinding;
  assert.equal(audio.memberCount, 2);
  assert.equal(audio.languageObligationCount, 4);
  assert.equal(audio.exactExternalCandidateCount, 2);
  assert.equal(audio.embeddedUnknownLanguageCandidateCount, 24);
  assert.equal(audio.totalCandidateCount, 26);
  assert.equal(audio.targetActionScriptAudioOperationCount, 0);
  assert.ok(audio.exactUnappliedFollowUp.every((row) =>
    row.applied === false && row.adopted === false));
  assert.equal(audio.manifestFilesModified, false);
  assert.equal(audio.formalStateChangeFromV8, false);
});

test("missing MP3, security, runtime, and acceptance gates remain closed", () => {
  assert.equal(bundle.report.sourceAndCurriculumBindings.missingCourseMp3Count,
    16);
  assert.equal(bundle.report.sourceAndCurriculumBindings.l10MissingCourseMp3Count,
    0);
  assert.equal(bundle.report.latestSecurityReviewBoundary
    .productionHelperImplementationEligible, false);
  assert.equal(bundle.report.authorityBoundary.mayLaunchOriginalRuntime, false);
  assert.equal(bundle.report.downstreamTransactionBoundary.applyAuthorized,
    false);
  assert.deepEqual(bundle.report.downstreamTransactionBoundary.prohibitedModes,
    ["--apply", "--dry-run", "--check"]);
  assert.ok(Object.values(bundle.report.acceptanceEffects).every((value) =>
    value === false));
});

test("template remains fail-closed and not batch-admissible", () => {
  assert.equal(bundle.report.status, "fail-closed-template-not-stable");
  assert.equal(bundle.report.templateStable, false);
  assert.equal(bundle.report.automationBoundary.templateBatchAdmissionAllowed,
    false);
  assert.equal(bundle.report.automationBoundary
    .remainingGrade4LessonBatchStartAllowed, false);
  assert.equal(bundle.report.automationBoundary.wholeCourseIntegrationAllowed,
    false);
});

test("publication is exact no-clobber, read-only, checkable, and tamper-evident", async () => {
  const tempRoot = await realpath(await mkdtemp(path.join(tmpdir(),
    "g4-l10-template-v9-")));
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
    await assert.rejects(() => checkContract(bundle, tempRoot),
      /mode changed|byte count changed|SHA-256 changed/);
    await chmod(markdownPath, 0o644);
  } finally {
    await rm(tempRoot, {recursive: true, force: true});
  }
});
