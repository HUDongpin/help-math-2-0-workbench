import assert from "node:assert/strict";
import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PROJECT_ROOT,
  REPORT_RELATIVE,
  buildReadiness,
  checkReadiness,
  parseArguments,
  publishReadinessNoClobber,
} from "./build-g4-l10-vb003-en-es-original-runtime-prelaunch-readiness-successor-v1.mjs";

test("CLI is prelaunch-report-only and rejects runtime or mutation modes", () => {
  assert.equal(parseArguments(["--dry-run"]), "--dry-run");
  assert.equal(parseArguments(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseArguments(["--check"]), "--check");
  for (const forbidden of ["--launch", "--apply", "--recover", "--rollback",
    "--write", "--force", "--execute-helper", "--implement-helper",
    "--install", "--promote", "--adopt-baseline"]) {
    assert.throws(() => parseArguments([forbidden]), /Only --dry-run/u);
  }
  assert.throws(() => parseArguments([]), /Choose exactly one/u);
  assert.throws(() => parseArguments(["--check", "--dry-run"]),
    /Choose exactly one/u);
});

test("successor rebinds the exact current EN and ES protocol-v3 kits", async () => {
  const {document} = await buildReadiness(PROJECT_ROOT);
  assert.equal(document.status,
    "EXACT_EN_ES_V3_KITS_CURRENT_PRELAUNCH_CLOSED_LATEST_SECURITY_BATCH_INVALIDATED");
  assert.equal(document.decision,
    "DO_NOT_LAUNCH_PRESERVE_EXACT_KITS_AWAIT_NEW_VALID_SECURITY_REVIEW_AND_AUTHORIZATION");
  assert.deepEqual(document.scope.languages, ["en", "es"]);
  assert.deepEqual(document.scope.requirementIds,
    ["req-default-root-en", "req-default-root-es"]);
  assert.equal(document.scope.exactCaptureKitCount, 2);
  assert.deepEqual(document.scope.combinedKitFileSet, {
    count: 26,
    sha256: "3e47cd191c2d1855454ab7c80315276a685aaeb915d0253405bd5f90b096282e",
    encoding:
      "sorted-requirementId-slash-relativePath-null-bytes-null-sha256-null-mode-newline-v1",
  });
});

test("each kit binds 13 exact files, source, trace, entry, stage, and zero runtime outputs", async () => {
  const {document} = await buildReadiness(PROJECT_ROOT);
  const byLanguage = Object.fromEntries(document.captureKits.map((kit) =>
    [kit.language, kit]));
  assert.deepEqual(Object.keys(byLanguage).sort(), ["en", "es"]);
  assert.deepEqual({
    manifest: byLanguage.en.captureKitManifestSha256,
    tree: byLanguage.en.exactTree.sha256,
    fileSet: byLanguage.en.exactTree.exactFileSet.sha256,
    entry: byLanguage.en.entryStateSha256,
    trace: byLanguage.en.traceSpec.sha256,
  }, {
    manifest: "c217a225043ab019b19b69f61eb626b32b9811f0dd78d1ddb5930b1d28997f9b",
    tree: "d27e244f9f470445ef936d65b8e7cf2cf4f1dd14cff95fb1e9a63fd83f2f899d",
    fileSet: "b36d0861dde3895e1a48d0e15b4513415d20ee18229bb856bae1148d17c0aae8",
    entry: "bf209e3302a76c14fff3e7e12f6fdc0f9bc01d4934aadd03334b5c3cf61b7cf1",
    trace: "7595b0c09079743993a1adfb1ca9a1af1cda663ce43482630362679fe4f5057e",
  });
  assert.deepEqual({
    manifest: byLanguage.es.captureKitManifestSha256,
    tree: byLanguage.es.exactTree.sha256,
    fileSet: byLanguage.es.exactTree.exactFileSet.sha256,
    entry: byLanguage.es.entryStateSha256,
    trace: byLanguage.es.traceSpec.sha256,
  }, {
    manifest: "1055a6f34269fcfaf7eb17391ed302d89cbddcca204f17755095a39ecc8a2bfc",
    tree: "227f0494f58d4b7b99767e1f0cb59f820d85377c33a73b88672b8e032d46775c",
    fileSet: "3e4c16b15f4d3470d727f3586f889f0d48a7d5ee5577cc6cad2abdd64c9409db",
    entry: "4e4bcf0390c6fd9bb1539b0c26a8555d9e4034ef5c591548bdb1f9a506f70067",
    trace: "be746206689c25275dd33af219859e240dd98a3fbbb5382dc0a9eb58c41ec76b",
  });
  for (const kit of document.captureKits) {
    assert.equal(kit.exactTree.fileCount, 13);
    assert.equal(kit.exactTree.totalBytes, 121474);
    assert.equal(kit.frameCount, 10);
    assert.deepEqual(kit.frameRange, {firstFrame: 1, lastFrame: 10});
    assert.deepEqual(kit.nativeStage, {width: 800, height: 600});
    assert.equal(kit.fps, 12);
    assert.equal(kit.sourceSwfSha256,
      "96a0c6c9cd7f5813d06e382bcb9dc2b81a0c0127a9865222dea1abba96a8d93d");
    assert.equal(kit.kitStatus, "unsigned-template-only-not-evidence");
    assert.equal(kit.operatorReady, false);
    assert.equal(kit.originalRuntimeEvidence, false);
    assert.equal(kit.authoritativeBaselineFrames, 0);
    assert.equal(kit.capturePngCount, 0);
    assert.equal(kit.actualLaunchReceiptCount, 0);
    assert.equal(kit.actualRuntimeReceiptCount, 0);
    assert.equal(kit.actualSessionAttestationCount, 0);
    assert.equal(kit.launchAuthorizedNow, false);
  }
});

test("latest security batch remains invalidated, nonreusable, and noncurable", async () => {
  const {document} = await buildReadiness(PROJECT_ROOT);
  assert.deepEqual(document.latestSecurityReviewBoundary, {
    hmg4rb4: "487d5f85f7cd3be759a8863dcbde09d4675ab68e00b91c77e415234692d0a20c",
    taskIds: [
      "019fd8f8-21fb-7e53-a3eb-328824e8a5ed",
      "019fd8f8-40ed-7d12-abd3-4f1a1c18216c",
      "019fd8f8-621b-72c1-abff-d8572798e170",
    ],
    status: "FAILED_INVALIDATED_NONREUSABLE_NO_IMPLEMENTATION_AUTHORITY",
    schemaResult: "INVALIDATED_INCOMPLETE",
    adversarialResult: "INVALIDATED_NONQUALIFYING",
    wholeResult: "INVALIDATED_NONQUALIFYING_INCOMPLETE",
    allThreeQualifyingIndependentReviews: false,
    allThreeP0P1P2Zero: false,
    productionHelperImplementationEligible: false,
    reusable: false,
    peterHuOperatorActivated: false,
    laterStaticObservationsCannotCureSecurityReview: true,
  });
});

test("prepared kit identity is separated from fourteen closed launch checks", async () => {
  const {document} = await buildReadiness(PROJECT_ROOT);
  assert.equal(document.readinessMatrix.preparedCheckCount, 10);
  assert.equal(document.readinessMatrix.blockingCheckCount, 14);
  assert.ok(Object.values(document.readinessMatrix.preparedChecks).every(Boolean));
  assert.ok(Object.values(document.readinessMatrix.blockingChecks).every(
    (value) => value === false));
  assert.equal(document.readinessMatrix.allPreparedKitIdentityChecksSatisfied,
    true);
  assert.equal(document.readinessMatrix.allLaunchChecksSatisfied, false);
  assert.equal(document.readinessMatrix.launchAuthorizedNow, false);
  assert.equal(document.readinessMatrix.originalRuntimeBaselineCount, 0);
  assert.equal(document.launchReceiptPolicy.namedOperator, "Peter Hu");
  assert.equal(document.launchReceiptPolicy.currentReceiptCount, 0);
  assert.equal(document.launchReceiptPolicy.freshReceiptRequiredForEveryStart,
    true);
  assert.equal(document.launchReceiptPolicy.receiptCheckedBeforeLaunch, true);
  assert.equal(document.launchReceiptPolicy.postHocReceiptAllowed, false);
  assert.equal(document.launchReceiptPolicy.receiptReuseAllowed, false);
});

test("L10 remains incomplete and every authority effect stays false", async () => {
  const {document} = await buildReadiness(PROJECT_ROOT);
  assert.deepEqual(document.currentL10Boundary, {
    templateStatus: "fail-closed-template-not-stable",
    templateStable: false,
    releaseMemberCount: 47,
    activePageCount: 46,
    shellCount: 1,
    rawResidualCount: 70,
    formalRequirementProjectionResidualCount: 74,
    dynamicIndirectParentPlan: {
      selectedPairs: 21,
      projectedRawResidualCountNotApplied: 49,
      workspaceFilesWritten: 0,
      applied: false,
    },
    scriptedOneFrameTriage: {
      exactPairs: 41,
      scriptBodyGroups: 15,
      evidenceRoutes: 5,
      dispositionChanged: false,
    },
    originalRuntimeFramesCaptured: 0,
    authoritativeOriginalRuntimeBaselineCount: 0,
    specificationReviewInputStatus:
      "review-input-frozen-no-task-authorization-no-review-verdict",
    specificationReviewVerdictPresent: false,
    specificationApplied: false,
    rendererImplemented: false,
    behaviorAccepted: false,
    visualRmseAccepted: false,
    audioHumanOwnerAccepted: false,
  });
  assert.ok(Object.values(document.authorityEffects).every((value) =>
    value === false));
  assert.ok(Object.values(document.implementationBoundary).every((value) =>
    value === false || value === true));
  assert.equal(document.implementationBoundary.reportPublicationOnly, true);
  for (const [key, value] of Object.entries(document.implementationBoundary)) {
    if (key !== "reportPublicationOnly") assert.equal(value, false, key);
  }
});

test("report publication is immutable no-clobber and check rejects tamper", async () => {
  const bundle = await buildReadiness(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-vb003-prelaunch-readiness-")));
  await mkdir(path.join(temporaryRoot, "reports"), {recursive: true});
  const result = await publishReadinessNoClobber(bundle,
    {outputRoot: temporaryRoot});
  assert.equal(result.disposition, "checked");
  assert.equal(result.exactCaptureKits, 2);
  assert.equal(result.exactKitFiles, 26);
  assert.equal(result.preparedChecks, 10);
  assert.equal(result.blockingChecks, 14);
  assert.equal(result.originalRuntimeBaselineCount, 0);
  assert.equal(result.launchAuthorizedNow, false);
  await assert.rejects(() => publishReadinessNoClobber(bundle,
    {outputRoot: temporaryRoot}), /Target must be absent/u);
  const reportPath = path.join(temporaryRoot, REPORT_RELATIVE);
  await chmod(reportPath, 0o644);
  await writeFile(reportPath, "tampered\n", "utf8");
  await chmod(reportPath, 0o444);
  await assert.rejects(() => checkReadiness(bundle, temporaryRoot),
    /Input byte count drifted|Input SHA-256 drifted/u);
});

test("a pre-publication failure leaves no readiness report", async () => {
  const bundle = await buildReadiness(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-vb003-prelaunch-readiness-fail-")));
  await mkdir(path.join(temporaryRoot, "reports"), {recursive: true});
  await assert.rejects(() => publishReadinessNoClobber(bundle, {
    outputRoot: temporaryRoot,
    beforeWrite: async () => { throw new Error("simulated report stop"); },
  }), /simulated report stop/u);
  await assert.rejects(() => readFile(path.join(temporaryRoot, REPORT_RELATIVE)),
    /ENOENT/u);
});
