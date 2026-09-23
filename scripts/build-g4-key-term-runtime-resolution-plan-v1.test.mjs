import assert from "node:assert/strict";
import {
  chmod,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  OUTPUT_PREFIX,
  PROJECT_ROOT,
  deriveReport,
  parseArguments,
  readSnapshot,
  renderMarkdown,
  runCli,
  stableJson,
  validateResolutionPlanV1,
  writeNoClobber,
} from "./build-g4-key-term-runtime-resolution-plan-v1.mjs";

let snapshot;
let report;

test.before(async () => {
  snapshot = await readSnapshot(PROJECT_ROOT);
  report = deriveReport(snapshot);
});

test("accepts only one read-only write or check mode", () => {
  assert.equal(parseArguments(["--write"]), "--write");
  assert.equal(parseArguments(["--check"]), "--check");
  assert.throws(() => parseArguments([]), /choose exactly one/u);
  assert.throws(() => parseArguments(["--write", "--check"]),
    /choose exactly one/u);
  assert.throws(() => parseArguments(["--apply"]), /unsupported/u);
  assert.throws(() => parseArguments(["--promote"]), /unsupported/u);
});

test("binds the twelve-lesson EN and ES declaration surface without substitution authority", () => {
  assert.equal(validateResolutionPlanV1(report), true);
  assert.equal(report.declarations.lessonCount, 12);
  assert.equal(report.declarations.declaredDiagramOccurrences, 1515);
  assert.equal(report.declarations.uniqueRuntimeSwfPaths, 760);
  assert.equal(report.declarations.uniqueRuntimePathSetSha256,
    "244efecbb57ddb249ca9cb3f5e9384fc0962f82feeb108d334054144345e7f96");
  assert.deepEqual({
    entries: report.declarations.languageSources.english.entryCount,
    warnings: report.declarations.languageSources.english.warningCount,
    sourceSha256: report.declarations.languageSources.english.sourceSha256,
  }, {
    entries: 761,
    warnings: 6,
    sourceSha256: "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749",
  });
  assert.deepEqual({
    entries: report.declarations.languageSources.spanish.entryCount,
    warnings: report.declarations.languageSources.spanish.warningCount,
    sourceSha256: report.declarations.languageSources.spanish.sourceSha256,
  }, {
    entries: 753,
    warnings: 2,
    sourceSha256: "7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00",
  });
  assert.equal(report.declarations.languageSources.lessonSpecificDeclarationsPresent,
    false);
  assert.equal(report.declarations.languageSources.gradeWideSubstitutionAuthorized,
    false);
});

test("rehashes all 443 catalog-resolved canonical runtime SWFs", () => {
  assert.equal(report.canonicalRuntimeEvidence.filesRehashed, 443);
  assert.equal(report.canonicalRuntimeEvidence.bytesRehashed, 3978065);
  assert.equal(report.canonicalRuntimeEvidence.exactPlacementCount, 35);
  assert.equal(report.canonicalRuntimeEvidence.caseVariantSameDirectoryCount, 407);
  assert.equal(report.canonicalRuntimeEvidence.uniqueBasenameOtherDirectoryCount, 1);
  assert.equal(report.canonicalRuntimeEvidence.catalogPathSetSha256,
    "c42f5b6986b6b7f147522841cf3edab89301fff285f17989822dec015568bac9");
  assert.equal(report.canonicalRuntimeEvidence.identitySetSha256,
    "00cf44de1eb46a37de81ace0b18abbbb46637053a6934257b83abbba02d09689");
  assert.equal(report.canonicalRuntimeEvidence.sourcePresenceOnly, true);
  assert.equal(report.canonicalRuntimeEvidence.runtimeBehaviorVerified, false);
});

test("rehashes the folder ZIP and the complete 1594-file DIG tree", () => {
  assert.equal(report.quarantineEvidence.folderZipRehashed, true);
  assert.equal(report.quarantineEvidence.folderZipBytes, 92213676);
  assert.equal(report.quarantineEvidence.folderZipSha256,
    "e367ea90c904894080c4c8e11f9eaaaebf615e14b655991b68820977ecbd6428");
  assert.equal(report.quarantineEvidence.verifiedTreeFilesRehashed, 1594);
  assert.equal(report.quarantineEvidence.verifiedTreeBytesRehashed, 169045760);
  assert.equal(report.quarantineEvidence.verifiedTreeChecksumSetSha256,
    "fe16e6eec0ab36aba449ca15f047583286dbaeb1e5412c61c7a9e26db9083c79");
  assert.equal(report.quarantineEvidence.symlinkCount, 0);
  assert.equal(report.quarantineEvidence.specialFileCount, 0);
  assert.equal(report.quarantineEvidence.writableFileCount, 0);
  assert.equal(report.quarantineEvidence.missingManifestFiles, 0);
  assert.equal(report.quarantineEvidence.unexpectedFiles, 0);
  assert.equal(report.quarantineEvidence.payloadIdentityDoesNotAuthorizePlacement,
    true);
});

test("splits 316 unselected candidates into exact and case-variant review batches", () => {
  const exact = report.reviewBatches.exactPlacement.records;
  const caseVariant = report.reviewBatches.caseVariantPlacement.records;
  const all = [...exact, ...caseVariant];
  assert.equal(exact.length, 17);
  assert.equal(caseVariant.length, 299);
  assert.equal(all.length, 316);
  assert.equal(all.filter(({companionFla}) => companionFla).length, 313);
  assert.deepEqual(all.filter(({companionFla}) => companionFla === null)
    .map(({expectedRuntimePath}) => expectedRuntimePath).sort(), [
    "HELP_KEYTERMS/KT/ELEMENTARY/DIG/Fixed_value.swf",
    "HELP_KEYTERMS/KT/ELEMENTARY/DIG/Image_transformation.swf",
    "HELP_KEYTERMS/KT/ELEMENTARY/DIG/Miles_per_hour.swf",
  ]);
  assert.ok(exact.every(({candidateRuntime}) => candidateRuntime.sameExactPlacement));
  assert.ok(caseVariant.every(({candidateRuntime}) =>
    !candidateRuntime.sameExactPlacement));
  assert.ok(all.every((record) =>
    record.expectedSha256 === null &&
    Object.values(record.admission).every((value) => value === false)));
  assert.equal(report.resolutionSummary.candidateRuntimeIdentitySetSha256,
    "c32d39acad30dce668a8c42a101e7d230fcbd8b264c1785681b61efb736277be");
});

test("keeps Polynomial.swf unresolved and treats the FLA only as an authoring companion", () => {
  const [polynomial] = report.reviewBatches.unresolvedRuntime.records;
  assert.equal(polynomial.expectedRuntimePath,
    "HELP_KEYTERMS/KT/ELEMENTARY/DIG/Polynomial.swf");
  assert.equal(polynomial.occurrenceCount, 2);
  assert.equal(polynomial.expectedSha256, null);
  assert.equal(polynomial.runtimeSwfCandidate, null);
  assert.equal(polynomial.companionFla.quarantineCanonicalPath,
    "HELP_KEYTERMS/KT/ELEMENTARY/DIG/polynomial.fla");
  assert.equal(polynomial.companionFla.bytes, 19456);
  assert.equal(polynomial.companionFla.sha256,
    "4281f3dbde526f0f7e8e445efd4f61893566ad6308c0236816d07baa16a89263");
  assert.equal(polynomial.flaDoesNotSubstituteForShippedRuntime, true);
  assert.equal(report.resolutionSummary.potentialResolvedAfterAllReviewHoldsAccepted,
    759);
  assert.equal(report.resolutionSummary.sourceDependencyClosure, false);
});

test("creates no executor, promotion, task, helper, runtime, or acceptance authority", () => {
  assert.equal(report.controls.executable, false);
  assert.equal(report.controls.executorPresent, false);
  assert.equal(report.controls.writeOrApplySupported, false);
  assert.equal(report.controls.promotionRecordCount, 0);
  assert.equal(report.controls.bulkV7V8AdmissionAuthorized, false);
  assert.equal(report.controls.filenameOrBasenameAdmissionAuthorized, false);
  assert.equal(report.controls.caseInsensitiveAdmissionAuthorized, false);
  assert.equal(report.controls.reviewerTasksCreated, false);
  assert.equal(report.controls.hmg4rb4Created, false);
  assert.equal(report.controls.helperImplementedOrExecuted, false);
  assert.equal(report.controls.originalRuntimeLaunched, false);
  assert.deepEqual(report.promotionRecords, []);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
});

test("emits no private absolute root, per-entry Drive identifier, or personal identifier", () => {
  for (const output of [stableJson(report), renderMarkdown(report)]) {
    assert.doesNotMatch(output, /\/Volumes\//u);
    assert.doesNotMatch(output, /1w8SJhRG9vjZtaoikpmEf5Hgefa0k9f3E/u);
    assert.doesNotMatch(output, /DriveFolderId|driveEntryId|firstObserved/u);
    assert.doesNotMatch(output,
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu);
  }
});

test("validator rejects fabricated admission, promotion, closure, or acceptance", () => {
  const admitted = structuredClone(report);
  admitted.reviewBatches.exactPlacement.records[0].admission.selected = true;
  assert.throws(() => validateResolutionPlanV1(admitted));

  const promotion = structuredClone(report);
  promotion.promotionRecords.push({sha256: "a".repeat(64)});
  assert.throws(() => validateResolutionPlanV1(promotion));

  const closed = structuredClone(report);
  closed.resolutionSummary.sourceDependencyClosure = true;
  closed.reportFingerprintSha256 = "a".repeat(64);
  assert.throws(() => validateResolutionPlanV1(closed));

  const accepted = structuredClone(report);
  accepted.acceptanceEffects.ownerAcceptance = true;
  assert.throws(() => validateResolutionPlanV1(accepted));
});

test("no-clobber output creates mode 0444 once and refuses reuse", async () => {
  const temporary = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-keyterm-v1-output-"),
  ));
  try {
    const output = path.join(temporary, "report.json");
    await writeNoClobber(output, "exact\n");
    const mode = (await import("node:fs/promises")).stat(output)
      .then((info) => (info.mode & 0o777).toString(8).padStart(4, "0"));
    assert.equal(await mode, "0444");
    await assert.rejects(writeNoClobber(output, "exact\n"), /EEXIST/u);
    await chmod(output, 0o644);
    await writeFile(output, "foreign\n", "utf8");
    await assert.rejects(writeNoClobber(output, "exact\n"), /EEXIST/u);
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
});

test("checked-in JSON and Markdown equal the live deterministic report", async () => {
  assert.equal(
    await readFile(path.join(PROJECT_ROOT, `${OUTPUT_PREFIX}.json`), "utf8"),
    stableJson(report),
  );
  assert.equal(
    await readFile(path.join(PROJECT_ROOT, `${OUTPUT_PREFIX}.md`), "utf8"),
    renderMarkdown(report),
  );
  assert.equal(report.inputs.inputSetSha256,
    "2e972b060f7341b0dec6214fff9e68174806349e840d79347cc85e0b56748398");
  assert.equal(report.reportFingerprintSha256,
    "ca67ea117c084ab543d18ffcbf7a1afcee25b645bfbffefcdba42509afa14b11");
});

test("check mode repeats the complete read-only identity verification", async () => {
  const result = await runCli(["--check"], PROJECT_ROOT);
  assert.equal(result.mode, "--check");
  assert.deepEqual(result.outputs, [
    `${OUTPUT_PREFIX}.json`,
    `${OUTPUT_PREFIX}.md`,
  ]);
});
