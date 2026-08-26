import assert from "node:assert/strict";
import {mkdtemp, readFile, readdir, rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  ACCEPTANCE_EFFECTS as RAW_ACCEPTANCE_EFFECTS,
  REPORT_TYPE,
  SCOPE_RESULT_PASS,
} from "./qa-g5-l4-v7-deep-product.mjs";
import {
  ROOT,
  SOURCE_PATHS,
  parseArguments as parseBuildArguments,
  writeCreateExclusiveArtifactsV7,
} from "./build-g5-l4-current-js-deep-qa-successors-v7.mjs";
import {
  parseArguments as parseCheckArguments,
} from "./check-g5-l4-current-js-deep-qa-successors-v7.mjs";
import {
  ACCEPTANCE_EFFECTS,
  AUTHORITY_BOUNDARY,
  EXPECTED_ASSERTION_COUNTS,
  FQ_MARKDOWN_PATH,
  FQ_MEMBERS,
  FQ_PREDECESSOR_MARKDOWN_PATH,
  FQ_PREDECESSOR_PATH,
  FQ_RECEIPT_ID,
  FQ_RECEIPT_PATH,
  PACKAGE_ID,
  RAW_ARTIFACT_ROOT,
  RAW_MARKDOWN_PATH,
  RAW_REPORT_PATH,
  RAW_RUNNER_PATH,
  RAW_RUNNER_TEST_PATH,
  RESOLVED_REMEDIATIONS,
  WHOLE_MARKDOWN_PATH,
  WHOLE_PREDECESSOR_MARKDOWN_PATH,
  WHOLE_PREDECESSOR_PATH,
  WHOLE_RECEIPT_ID,
  WHOLE_RECEIPT_PATH,
  assertAcceptanceEffects,
  assertAuthorityBoundary,
  freshV7ResolutionFromRaw,
  sha256,
  stableJson,
  validateFqDeepQaSuccessorV7,
  validateRawV7DeepQaReport,
  validateWholeLessonDeepQaSuccessorV7,
} from "./lib/g5-l4-current-js-deep-qa-successor-v7.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SHA_A = "a".repeat(64);
const SHA_B = "b".repeat(64);
const SHA_C = "c".repeat(64);
const SNAPSHOT = Object.freeze({
  fileCount: 537,
  totalBytes: 189_628_204,
  sha256: SHA_A,
});
const FQ_SUCCESSOR_MARKDOWN_BYTES = Buffer.from("fq successor boundary\n");
const WHOLE_SUCCESSOR_MARKDOWN_BYTES = Buffer.from(
  "whole successor boundary\n",
);

function binding(pathname, hash = SHA_B) {
  return {path: pathname, bytes: 1, sha256: hash};
}

function bindingFromBytes(pathname, bytes, extras = {}) {
  return {
    path: pathname,
    bytes: bytes.length,
    sha256: sha256(bytes),
    ...extras,
  };
}

function counts() {
  return Object.fromEntries(
    Object.entries(EXPECTED_ASSERTION_COUNTS).map(([key, passed]) => [
      key,
      {passed, failed: 0},
    ]),
  );
}

function freshClaims() {
  return {
    deepQaFreshlyPerformed: true,
    freshUnzip: true,
    packageVerifierBeforeAndAfter: true,
    dynamicLoopbackServer: true,
    sourceCurrentAtObservation: true,
    exactReleaseOrder: true,
    layout: true,
    reducedMotion: true,
    replayMouseEnterSpace: true,
    map: true,
    keyTerms: true,
    fq: true,
    persistence: true,
    directUrlBoundary: true,
    perPageDirectUrl: false,
    networkBoundary: true,
    allFourV7Remediations: true,
  };
}

function passingRaw() {
  const map = ["en-desktop", "en-mobile", "es-desktop", "es-mobile"]
    .map((id) => ({
      locale: id.startsWith("es") ? "es" : "en",
      viewport: {id: id.endsWith("mobile") ? "mobile-portrait" : "desktop-16x9"},
      samePageAnimationId: "course-g05-l04-vb-004",
      samePageFocus: {tagName: "H1", insidePageHeading: true},
      samePageFocusPassed: true,
      differentPageAnimationId: "course-g05-l04-fq-002",
      differentPageFocus: {tagName: "H1", insidePageHeading: true},
      differentPageFocusPassed: true,
      passed: true,
    }));
  return {
    schemaVersion: 1,
    reportType: REPORT_TYPE,
    packageId: PACKAGE_ID,
    status: "pass-current-javascript-deep-product-qa",
    archiveBinding: binding(
      "outputs/g5-l4-whole-lesson-package-mvp-v7-darwin-arm64.zip",
      SHA_B,
    ),
    archiveSidecarBinding: binding(
      "outputs/g5-l4-whole-lesson-package-mvp-v7-darwin-arm64.zip.sha256",
      SHA_C,
    ),
    archiveSourceStability: {
      archiveAtStart: {bytes: 1, sha256: SHA_B},
      archiveAtEnd: {bytes: 1, sha256: SHA_B},
      archiveUnchanged: true,
      sidecarAtStart: {bytes: 1, sha256: SHA_C},
      sidecarAtEnd: {bytes: 1, sha256: SHA_C},
      sidecarUnchanged: true,
      endPairValid: true,
      unchanged: true,
    },
    packageManifestBinding: binding(
      "g5-l4-whole-lesson-package-mvp-v7-darwin-arm64/package-manifest.json",
      SHA_C,
    ),
    sourceObservation: {
      sourceCurrentAtObservation: true,
      packageSnapshot: {...SNAPSHOT},
      currentSnapshot: {...SNAPSHOT},
      currentSnapshotAtStart: {...SNAPSHOT},
      currentSnapshotAtEnd: {...SNAPSHOT},
      delta: {fileCount: 0, totalBytes: 0, sha256Changed: false},
      requiredForPass: true,
      currentWorkspaceSourceUsedToServeQa: false,
      qaRuntimeSource: "fresh-unzip-hash-bound-v7-archive",
      acceptanceEffect: "none",
      manifestBuildSnapshotsEqual: true,
      unchangedThroughoutQa: true,
    },
    authorityBoundary: {
      evidenceLayer: "current-javascript-machine-product-qa-only",
      acceptanceNeutral: true,
      strictAcceptanceEffect: "none",
      authoritativeOriginalRuntimeAuthority: false,
      audioAuthority: false,
      humanReviewAuthority: false,
      ownerAuthority: false,
      strictCompletionAuthority: false,
      publicationAuthority: false,
    },
    acceptanceEffects: {...RAW_ACCEPTANCE_EFFECTS},
    releaseBoundary: {
      releaseId: "lesson-g05-l04-number-lines",
      activePages: 54,
      courseShells: 1,
      expectedMembers: 55,
      strictCompleteCount: 0,
      missingCount: 55,
      published: false,
    },
    freshUnzip: {
      archiveSidecarSha256: SHA_B,
      pinnedInput: {
        copyMode: "create-exclusive-byte-copy",
        archive: {bytes: 1, sha256: SHA_B},
        sidecar: {bytes: 1, sha256: SHA_C},
      },
      originalInputsUnchangedAtEnd: true,
      archiveEntriesSafetyCheckedInFull: true,
      packageSource: "hash-bound-v7-zip-only",
      currentWorkspaceSourceServed: false,
      loopback: {dynamicPort: true, listenerOwnedBySpawnedChild: true},
    },
    packageVerifier: {before: {status: 0}, after: {status: 0}},
    assertionCounts: counts(),
    freshClaims: freshClaims(),
    scopeResult: {...SCOPE_RESULT_PASS},
    support: {map},
    remediationChecks: RESOLVED_REMEDIATIONS.map(({id}) => ({
      id,
      passed: true,
      evidence: {freshV7Proof: true},
      acceptanceEffect: "none",
    })),
    network: {passed: true},
    outputBindings: {
      json: {path: RAW_REPORT_PATH, selfSha256: null},
      markdown: binding(RAW_MARKDOWN_PATH),
      artifactDirectory: RAW_ARTIFACT_ROOT,
    },
    artifacts: [binding(`${RAW_ARTIFACT_ROOT}/representative.png`)],
    failures: [],
  };
}

function packageEvidence() {
  return {
    packageId: PACKAGE_ID,
    smokeReport: binding("reports/g5-l4-whole-lesson-package-mvp-v7-smoke.json"),
    archive: binding("outputs/g5-l4-whole-lesson-package-mvp-v7-darwin-arm64.zip"),
    archiveSha256: binding(
      "outputs/g5-l4-whole-lesson-package-mvp-v7-darwin-arm64.zip.sha256",
    ),
    packageManifest: binding(
      "outputs/g5-l4-whole-lesson-package-mvp-v7-darwin-arm64/package-manifest.json",
    ),
    packageSourceSnapshot: {...SNAPSHOT},
    currentSourceSnapshotAtRawObservation: {...SNAPSHOT},
    currentSourceSnapshotAtSuccessorAssembly: {...SNAPSHOT},
    sourceCurrentAtObservation: true,
    sourceCurrentAtSuccessorAssembly: true,
    sourceUnchangedThroughoutRawQa: true,
    freshArchiveExtraction: true,
    qaRuntimeSource: "fresh-unzip-hash-bound-v7-archive",
    authorityBoundary: {...AUTHORITY_BOUNDARY},
  };
}

function rawEvidence(raw) {
  return {
    report: binding(RAW_REPORT_PATH),
    markdown: binding(RAW_MARKDOWN_PATH),
    runner: binding(RAW_RUNNER_PATH),
    runnerTest: binding(RAW_RUNNER_TEST_PATH),
    artifactBindings: [binding(`${RAW_ARTIFACT_ROOT}/representative.png`)],
    status: raw.status,
    assertionCounts: raw.assertionCounts,
    freshClaims: raw.freshClaims,
    remediationChecks: raw.remediationChecks.map(({id, passed, acceptanceEffect}) => ({
      id,
      passed,
      acceptanceEffect,
    })),
    mapFocus: raw.support.map.map((entry) => ({
      locale: entry.locale,
      viewport: entry.viewport,
      samePageAnimationId: entry.samePageAnimationId,
      samePageFocusPassed: entry.samePageFocusPassed,
      differentPageAnimationId: entry.differentPageAnimationId,
      differentPageFocusPassed: entry.differentPageFocusPassed,
    })),
  };
}

function commonReceipt(kind) {
  const raw = passingRaw();
  const fq = kind === "fq";
  return {
    schemaVersion: 4,
    evidenceType: fq
      ? "g5-l4-current-js-fq23-companion-deep-qa-successor-receipt"
      : "g5-l4-current-js-whole-lesson-product-deep-qa-successor-receipt",
    receiptId: fq ? FQ_RECEIPT_ID : WHOLE_RECEIPT_ID,
    releaseId: "lesson-g05-l04-number-lines",
    packageId: PACKAGE_ID,
    status: "pass-current-javascript-deep-product-qa",
    evidenceAssembledOn: "2026-08-01",
    authorityBoundary: {...AUTHORITY_BOUNDARY},
    scope: fq
      ? {
        networkBoundary: "loopback-only-local-preview",
        previewClass: "private-controlled-ceo-preview",
        packageId: PACKAGE_ID,
        members: FQ_MEMBERS,
        g4L3Port3216Touched: false,
        externalDeploymentPerformed: false,
      }
      : {
        networkBoundary: "loopback-only-local-preview",
        previewClass: "private-controlled-ceo-preview",
        packageId: PACKAGE_ID,
        releaseMembers: 55,
        activePages: 54,
        courseShells: 1,
        g4L3Port3216Touched: false,
        externalDeploymentPerformed: false,
      },
    packageEvidence: packageEvidence(),
    predecessorEvidence: {
      receipt: binding(fq ? FQ_PREDECESSOR_PATH : WHOLE_PREDECESSOR_PATH),
      markdown: binding(
        fq ? FQ_PREDECESSOR_MARKDOWN_PATH : WHOLE_PREDECESSOR_MARKDOWN_PATH,
      ),
      immediatePredecessor: true,
      currentAuthority: false,
      claimsCarriedForward: false,
      supersededByFreshV7RawR1: true,
    },
    rawDeepQaEvidence: rawEvidence(raw),
    resolvedRemediations: freshV7ResolutionFromRaw(raw),
    scopeResult: {
      deepQaFreshlyPerformed: true,
      currentJavascriptDeepProductQaMachineWorkExhausted: true,
      sourceSnapshotCurrent: true,
      allFourPredecessorFindingsFreshV7Resolved: true,
      mapSamePageReselectFocusPassed: true,
      productQaComplete: false,
      migrationQaComplete: false,
      strictComplete: false,
      published: false,
      exactReleaseOrderFreshlyEstablished: true,
      predecessorClaimsCarriedForward: false,
      ...(fq
        ? {
          currentJavascriptFq23DeepQaFreshlyPerformed: true,
          fqInteractionFreshlyReperformed: true,
          fullScoreAndReviewFlowFreshlyReperformed: true,
        }
        : {
          layoutAssertionsFreshlyPassed: true,
          identityAssertionsFreshlyPassed: true,
          overflowAssertionsFreshlyPassed: true,
          reducedMotionAssertionsFreshlyPassed: true,
          replayAssertionsFreshlyPassed: true,
          courseMapInteractionFreshlyReperformed: true,
          mapDifferentPageFocusPassed: true,
          keyTermsInteractionFreshlyReperformed: true,
          fqInteractionFreshlyReperformed: true,
          crossLocalePersistenceFreshlyReperformed: true,
          perPageDirectUrlAvailable: false,
        }),
    },
    sourceBindings: [],
    artifacts: [fq
      ? bindingFromBytes(FQ_MARKDOWN_PATH, FQ_SUCCESSOR_MARKDOWN_BYTES, {
        role:
          "human-readable-r6-fq23-companion-deep-qa-successor-boundary",
      })
      : bindingFromBytes(
        WHOLE_MARKDOWN_PATH,
        WHOLE_SUCCESSOR_MARKDOWN_BYTES,
        {
          role:
            "human-readable-r6-whole-lesson-product-deep-qa-successor-boundary",
        },
      )],
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    ...(fq ? {} : {childReceipts: [binding(FQ_RECEIPT_PATH)]}),
  };
}

function outputFixture() {
  const fqReceipt = commonReceipt("fq");
  const fqJsonBytes = Buffer.from(stableJson(fqReceipt));
  const wholeReceipt = commonReceipt("whole");
  wholeReceipt.childReceipts = [bindingFromBytes(
    FQ_RECEIPT_PATH,
    fqJsonBytes,
    {role: "r6-fq23-deep-qa-successor"},
  )];
  return {
    fq: {
      markdownPath: FQ_MARKDOWN_PATH,
      markdownBytes: FQ_SUCCESSOR_MARKDOWN_BYTES,
      jsonPath: FQ_RECEIPT_PATH,
      jsonBytes: fqJsonBytes,
    },
    whole: {
      markdownPath: WHOLE_MARKDOWN_PATH,
      markdownBytes: WHOLE_SUCCESSOR_MARKDOWN_BYTES,
      jsonPath: WHOLE_RECEIPT_PATH,
      jsonBytes: Buffer.from(stableJson(wholeReceipt)),
    },
  };
}

test("fixed paths bind r6 successors, r5 predecessors, and v7 raw r2", () => {
  assert.equal(PACKAGE_ID, "g5-l4-whole-lesson-package-mvp-v7");
  assert.equal(
    RAW_REPORT_PATH,
    "reports/g5-l4-whole-lesson-package-mvp-v7-deep-product-qa-2026-08-01-r2.json",
  );
  assert.match(FQ_RECEIPT_PATH, /-r6\.json$/);
  assert.match(WHOLE_RECEIPT_PATH, /-r6\.json$/);
  assert.match(FQ_PREDECESSOR_PATH, /-r5\.json$/);
  assert.match(WHOLE_PREDECESSOR_PATH, /-r5\.json$/);
  assert.deepEqual(SOURCE_PATHS, [
    "scripts/lib/g5-l4-current-js-deep-qa-successor-v7.mjs",
    "scripts/build-g5-l4-current-js-deep-qa-successors-v7.mjs",
    "scripts/check-g5-l4-current-js-deep-qa-successors-v7.mjs",
    "scripts/g5-l4-current-js-deep-qa-successor-v7.test.mjs",
    "scripts/build-g5-l4-whole-lesson-package-mvp-v7.mjs",
    "scripts/qa-g5-l4-v7-deep-product.mjs",
    "scripts/qa-g5-l4-v7-deep-product.test.mjs",
  ]);
});

test("acceptance effects are exact all-false booleans with authority metadata outside", () => {
  assert.equal(Object.values(ACCEPTANCE_EFFECTS).every((value) => value === false), true);
  assert.equal("acceptanceNeutral" in ACCEPTANCE_EFFECTS, false);
  assert.equal("strictAcceptanceEffect" in ACCEPTANCE_EFFECTS, false);
  assert.equal(assertAcceptanceEffects({...ACCEPTANCE_EFFECTS}), true);
  assert.equal(assertAuthorityBoundary({...AUTHORITY_BOUNDARY}), true);
  assert.throws(
    () => assertAcceptanceEffects({...ACCEPTANCE_EFFECTS, acceptanceNeutral: true}),
  );
  assert.throws(
    () => assertAcceptanceEffects({...ACCEPTANCE_EFFECTS, strictComplete: true}),
  );
});

test("v7 raw pass requires current source, four fresh resolutions, and same-page H1 focus", () => {
  const raw = passingRaw();
  assert.equal(validateRawV7DeepQaReport(raw), true);
  const resolutions = freshV7ResolutionFromRaw(raw);
  assert.equal(resolutions.length, 4);
  assert.equal(resolutions.every(({freshV7Resolved}) => freshV7Resolved), true);
  assert.equal(
    resolutions.every(({predecessorClaimsCarriedForward}) =>
      predecessorClaimsCarriedForward === false),
    true,
  );

  const drift = passingRaw();
  drift.sourceObservation.sourceCurrentAtObservation = false;
  assert.throws(() => validateRawV7DeepQaReport(drift));

  const staleFinding = passingRaw();
  staleFinding.remediationChecks[0].passed = false;
  assert.throws(() => validateRawV7DeepQaReport(staleFinding));

  const lostFocus = passingRaw();
  lostFocus.support.map[0].samePageFocusPassed = false;
  assert.throws(() => validateRawV7DeepQaReport(lostFocus));
});

test("r6 receipt validators refuse r5 findings or acceptance promotion", () => {
  const fq = commonReceipt("fq");
  const whole = commonReceipt("whole");
  assert.equal(validateFqDeepQaSuccessorV7(fq), true);
  assert.equal(validateWholeLessonDeepQaSuccessorV7(whole), true);

  whole.scopeResult.mapSamePageReselectFocusPassed = false;
  assert.throws(() => validateWholeLessonDeepQaSuccessorV7(whole));
  whole.scopeResult.mapSamePageReselectFocusPassed = true;
  whole.acceptanceEffects.ownerFidelityAccepted = true;
  assert.throws(() => validateWholeLessonDeepQaSuccessorV7(whole));

  const wrongMarkdownRole = commonReceipt("fq");
  wrongMarkdownRole.artifacts[0].role = "generic-markdown";
  assert.throws(
    () => validateFqDeepQaSuccessorV7(wrongMarkdownRole),
    /successorMarkdown\.role/,
  );
  const wrongMarkdownPath = commonReceipt("whole");
  wrongMarkdownPath.artifacts[0].path = FQ_MARKDOWN_PATH;
  assert.throws(
    () => validateWholeLessonDeepQaSuccessorV7(wrongMarkdownPath),
    /exactly one corresponding Markdown artifact/,
  );
});

test("builder and checker expose only explicit fixed r6 workflows", async () => {
  assert.equal(parseBuildArguments(["--write"]), "write");
  assert.throws(() => parseBuildArguments([]), /Use --write/);
  assert.equal(parseCheckArguments([]), "check");
  assert.throws(() => parseCheckArguments(["--write"]), /takes no arguments/);

  const builder = await readFile(
    path.join(ROOT, "scripts/build-g5-l4-current-js-deep-qa-successors-v7.mjs"),
    "utf8",
  );
  const checker = await readFile(
    path.join(ROOT, "scripts/check-g5-l4-current-js-deep-qa-successors-v7.mjs"),
    "utf8",
  );
  assert.match(builder, /g5-l4-current-js-deep-qa-successor-v7\.mjs/);
  assert.match(builder, /immutable r6 successors are never overwritten/);
  assert.match(builder, /open\(absolutePath, "wx", 0o444\)/);
  assert.match(builder, /mapSamePageReselectFocusPassed: true/);
  assert.match(checker, /checks fixed r6 paths/);
  assert.match(checker, /sourceCurrentAtObservation: true/);
});

test("r6 writer is create-exclusive and never overwrites an existing receipt", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g5-l4-r6-successor-test-"));
  try {
    const outputs = outputFixture();
    await writeCreateExclusiveArtifactsV7(root, outputs);
    const before = new Map();
    for (const [relativePath, bytes] of [
      [FQ_MARKDOWN_PATH, outputs.fq.markdownBytes],
      [FQ_RECEIPT_PATH, outputs.fq.jsonBytes],
      [WHOLE_MARKDOWN_PATH, outputs.whole.markdownBytes],
      [WHOLE_RECEIPT_PATH, outputs.whole.jsonBytes],
    ]) {
      const actual = await readFile(path.join(root, relativePath));
      assert.equal(actual.equals(bytes), true);
      before.set(relativePath, sha256(actual));
    }
    await assert.rejects(
      writeCreateExclusiveArtifactsV7(root, outputs),
      /immutable r6 successors are never overwritten/,
    );
    for (const [relativePath, digest] of before) {
      assert.equal(
        sha256(await readFile(path.join(root, relativePath))),
        digest,
        `${relativePath}: existing output was overwritten`,
      );
    }
    assert.equal(
      (await readdir(root)).some((name) =>
        name.startsWith(".g5-l4-r6-successor-stage-")
      ),
      false,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

for (const publishFailureAt of [2, 3]) {
  test(`r6 staged publication step ${publishFailureAt} failure leaves no residue`, async () => {
    const root = await mkdtemp(
      path.join(os.tmpdir(), `g5-l4-r6-publish-${publishFailureAt}-`),
    );
    try {
      const outputs = outputFixture();
      await assert.rejects(
        writeCreateExclusiveArtifactsV7(root, outputs, {publishFailureAt}),
        new RegExp(`publication failure at step ${publishFailureAt}`),
      );
      for (const relativePath of [
        FQ_MARKDOWN_PATH,
        FQ_RECEIPT_PATH,
        WHOLE_MARKDOWN_PATH,
        WHOLE_RECEIPT_PATH,
      ]) {
        await assert.rejects(
          readFile(path.join(root, relativePath)),
          /ENOENT/,
          `${relativePath}: partial publication residue`,
        );
      }
      assert.equal(
        (await readdir(root)).some((name) =>
          name === "reports" ||
          name.startsWith(".g5-l4-r6-successor-stage-")
        ),
        false,
      );
    } finally {
      await rm(root, {recursive: true, force: true});
    }
  });
}
