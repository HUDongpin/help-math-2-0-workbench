import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  ACCEPTANCE_EFFECTS,
  buildContinuationReport,
  buildDeliveryReport,
  buildOwnerReport,
  collectCoreEvidence,
  CORE_INPUT_PATHS,
  CRITICAL_SOURCE_PATHS,
  GENERATORS,
  OUTPUTS,
  PACKAGE_BASENAME,
  PACKAGE_ID,
  parseMode,
  RELEASE_ID,
  OWNER_INPUT_PATHS,
  sha256,
  stableJson,
  validateContinuationReport,
  validateDeliveryReport,
  validateOwnerReport,
  writeOrCheckPair,
} from "./lib/g5-l4-v7-final-successors.mjs";

import {
  AUTHORITY_BOUNDARY as R6_AUTHORITY_BOUNDARY,
  RAW_ARTIFACT_ROOT,
  RESOLVED_REMEDIATIONS,
} from "./lib/g5-l4-current-js-deep-qa-successor-v7.mjs";
import {SOURCE_PATHS as R6_SOURCE_PATHS} from
  "./build-g5-l4-current-js-deep-qa-successors-v7.mjs";
import {
  GENERATOR_PATH as KEYTERMS_R2_GENERATOR_PATH,
  TEST_PATH as KEYTERMS_R2_TEST_PATH,
  buildG5L4CombinedKeytermsProductReferenceBindingSuccessorR2,
  renderMarkdown as renderKeytermsR2Markdown,
} from "./build-g5-l4-combined-keyterms-product-reference-binding-successor-r2.mjs";

const FALSES = Object.freeze({
  originalRuntime: false,
  humanReview: false,
  owner: false,
  strictComplete: false,
  published: false,
});
const SNAPSHOT = Object.freeze({
  fileCount: 600,
  totalBytes: 200_000_000,
  sha256: "a".repeat(64),
});
const PROJECT_ROOT = fileURLToPath(new URL("../", import.meta.url));
const TEST_BUILD_OPTIONS = Object.freeze({
  sourceSnapshotCollector: async () => SNAPSHOT,
});
let keytermsR2ReportPromise;

function currentKeytermsR2Report() {
  keytermsR2ReportPromise ??=
    buildG5L4CombinedKeytermsProductReferenceBindingSuccessorR2();
  return keytermsR2ReportPromise;
}

async function writeRelative(root, relativePath, value) {
  const absolute = path.resolve(root, relativePath);
  await mkdir(path.dirname(absolute), {recursive: true});
  const bytes = Buffer.isBuffer(value)
    ? value
    : Buffer.from(typeof value === "string" ? value : stableJson(value), "utf8");
  await writeFile(absolute, bytes);
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

function rawAcceptanceEffects() {
  return {
    authoritativeOriginalRuntimeAccepted: false,
    originalRuntimeFullFrameAccepted: false,
    originalRuntimeNaturalTraversalAccepted: false,
    audioAccepted: false,
    humanAudioAccepted: false,
    humanVisualAccepted: false,
    rmseAccepted: false,
    ownerAccepted: false,
    strictMigrationComplete: false,
    lessonStrictComplete: false,
    publicReleaseAuthorized: false,
    published: false,
  };
}

function scopeResult() {
  return {
    currentJavascriptDeepProductQaMachineWorkExhausted: true,
    productQaComplete: false,
    migrationQaComplete: false,
    authoritativeOriginalRuntimeComplete: false,
    audioAcceptanceComplete: false,
    humanVisualReviewComplete: false,
    ownerAcceptanceComplete: false,
    strictCompletionComplete: false,
    publicationComplete: false,
    allFourV7RemediationsResolved: true,
    allFourPredecessorFindingsFreshV7Resolved: true,
  };
}

async function createCoreFixture(root) {
  for (const relativePath of [
    ...CRITICAL_SOURCE_PATHS,
    ...Object.values(GENERATORS),
  ]) await writeRelative(root, relativePath, `fixture ${relativePath}\n`);

  const archive = await writeRelative(
    root,
    CORE_INPUT_PATHS.packageArchive,
    Buffer.from("fixture-v7-archive"),
  );
  await writeRelative(
    root,
    CORE_INPUT_PATHS.packageArchiveSha256,
    `${archive.sha256}  ${path.basename(archive.path)}\n`,
  );
  const manifestDocument = {
    schemaVersion: 1,
    packageId: PACKAGE_ID,
    release: {
      releaseId: RELEASE_ID,
      expectedMembers: 55,
      activePages: 54,
      strictCompleteCount: 0,
      published: false,
    },
    authority: {...FALSES},
    build: {
      inputSnapshotBefore: SNAPSHOT,
      inputSnapshotAfter: SNAPSHOT,
    },
  };
  const manifest = await writeRelative(
    root,
    CORE_INPUT_PATHS.packageManifest,
    manifestDocument,
  );
  await writeRelative(root, CORE_INPUT_PATHS.packageSmoke, {
    schemaVersion: 1,
    reportType: "g5-l4-whole-lesson-package-mvp-v7-smoke",
    packageId: PACKAGE_ID,
    status: "pass-current-javascript-private-preview",
    freshArchiveExtraction: true,
    archive,
    packageManifestSha256: manifest.sha256,
    packageVerifier: {
      status: "verified",
      packageId: PACKAGE_ID,
      members: 55,
      currentJavascriptPages: 54,
      strictComplete: 0,
      published: false,
    },
    authority: {...FALSES},
  });

  const counts = (passed) => ({passed, failed: 0});
  const rawDocument = {
    schemaVersion: 1,
    reportType:
      "g5-l4-v7-fresh-unzip-deep-current-javascript-product-qa",
    packageId: PACKAGE_ID,
    status: "pass-current-javascript-deep-product-qa",
    archiveBinding: archive,
    packageManifestBinding: {
      ...manifest,
      path: `${PACKAGE_BASENAME}/package-manifest.json`,
    },
    sourceObservation: {
      sourceCurrentAtObservation: true,
      packageSnapshot: SNAPSHOT,
      currentSnapshot: SNAPSHOT,
      delta: {fileCount: 0, totalBytes: 0, sha256Changed: false},
      currentWorkspaceSourceUsedToServeQa: false,
      acceptanceEffect: "none",
    },
    authorityBoundary: {
      acceptanceNeutral: true,
      strictAcceptanceEffect: "none",
      authoritativeOriginalRuntimeAuthority: false,
      audioAuthority: false,
      humanReviewAuthority: false,
      ownerAuthority: false,
      strictCompletionAuthority: false,
      publicationAuthority: false,
    },
    acceptanceEffects: rawAcceptanceEffects(),
    releaseBoundary: {
      releaseId: RELEASE_ID,
      expectedMembers: 55,
      strictCompleteCount: 0,
      published: false,
    },
    assertionCounts: {
      layout: counts(648),
      identity: counts(648),
      overflow: counts(648),
      reducedMotionObservations: counts(108),
      reducedMotionSamples: counts(324),
      replayActivations: counts(324),
      map: counts(4),
      keyTerms: counts(4),
      fq: counts(4),
      persistence: counts(2),
      remediations: counts(4),
    },
    freshClaims: {
      freshUnzip: true,
      packageVerifierBeforeAndAfter: true,
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
    },
    scopeResult: scopeResult(),
    remediationChecks: ["a", "b", "c", "d"].map((id) => ({
      id,
      passed: true,
      acceptanceEffect: "none",
    })),
    failures: [],
  };
  const raw = await writeRelative(root, CORE_INPUT_PATHS.rawJson, rawDocument);
  const rawMarkdown = await writeRelative(
    root,
    CORE_INPUT_PATHS.rawMarkdown,
    "# fixture raw v7 boundary\n",
  );

  const smoke = await descriptor(root, CORE_INPUT_PATHS.packageSmoke);
  const sidecar = await descriptor(root, CORE_INPUT_PATHS.packageArchiveSha256);
  const evidence = [smoke, manifest, archive, sidecar, raw, rawMarkdown];
  const r6 = (kind) => ({
    schemaVersion: 1,
    receiptId: kind === "fq"
      ? "g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r6"
      : "g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r6",
    releaseId: RELEASE_ID,
    status: "pass-current-javascript-deep-product-qa-successor",
    scope: {
      packageId: PACKAGE_ID,
      ...(kind === "fq" ? {members: [
        "course-g05-l04-fq-002",
        "course-g05-l04-fq-003",
      ]} : {}),
    },
    scopeResult: scopeResult(),
    evidence,
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
  });
  await writeRelative(root, CORE_INPUT_PATHS.fqR6Json, r6("fq"));
  await writeRelative(root, CORE_INPUT_PATHS.fqR6Markdown, "# fixture fq r6\n");
  await writeRelative(root, CORE_INPUT_PATHS.wholeR6Json, r6("whole"));
  await writeRelative(
    root,
    CORE_INPUT_PATHS.wholeR6Markdown,
    "# fixture whole r6\n",
  );
  await writeRelative(root, CORE_INPUT_PATHS.audioStaticJson, {
    schemaVersion: 1,
    artifactType: "g5-l4-audio-static-cue-reconciliation",
    releaseId: RELEASE_ID,
    status: "machine-static-reconciliation-complete-runtime-evidence-unresolved",
    summary: {
      canonicalInventoryCueCount: 373,
      inventoryIdentityTriangulatedCount: 373,
      runtimeReachabilityEstablishedCueCount: 0,
      audibleContentEstablishedCueCount: 0,
      spokenLanguageEstablishedFileCount: 0,
      synchronizationEstablishedCueCount: 0,
      listeningAcceptedCueCount: 0,
      ownerAcceptedCueCount: 0,
      strictCompleteMemberCount: 0,
      publishedMemberCount: 0,
    },
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
  });
  await writeRelative(
    root,
    CORE_INPUT_PATHS.audioStaticMarkdown,
    "# fixture audio static boundary\n",
  );
}

async function descriptor(root, relativePath) {
  const bytes = await readFile(path.resolve(root, relativePath));
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)};
}

async function createCanonicalCoreFixture(root) {
  for (const relativePath of new Set([
    ...CRITICAL_SOURCE_PATHS,
    ...Object.values(GENERATORS),
  ])) {
    const value = [
      KEYTERMS_R2_GENERATOR_PATH,
      KEYTERMS_R2_TEST_PATH,
    ].includes(relativePath)
      ? await readFile(path.resolve(PROJECT_ROOT, relativePath))
      : `fixture ${relativePath}\n`;
    await writeRelative(root, relativePath, value);
  }

  const keytermsR2Report = await currentKeytermsR2Report();
  await writeRelative(root, CORE_INPUT_PATHS.keytermsR2Json, keytermsR2Report);
  await writeRelative(
    root,
    CORE_INPUT_PATHS.keytermsR2Markdown,
    renderKeytermsR2Markdown(keytermsR2Report),
  );

  const archive = await writeRelative(
    root,
    CORE_INPUT_PATHS.packageArchive,
    Buffer.from("fixture-v7-archive"),
  );
  const sidecar = await writeRelative(
    root,
    CORE_INPUT_PATHS.packageArchiveSha256,
    `${archive.sha256}  ${path.basename(archive.path)}\n`,
  );
  const members = Array.from({length: 55}, (_, index) => ({
    ordinal: index + 1,
    animationId: index === 54
      ? "shell-course-g05-l04-index-local"
      : `course-g05-l04-fixture-${String(index + 1).padStart(3, "0")}`,
    assetId: `fixture-${index + 1}`,
    releaseRole: index === 54 ? "course-shell" : "active-xml-referenced-page",
    sourceSha256: "b".repeat(64),
  }));
  const authority = {
    authoritativeOriginalRuntime: false,
    originalRuntimeFullFrameAccepted: false,
    audioAccepted: false,
    humanVisualAccepted: false,
    humanAudioAccepted: false,
    ownerFidelityAccepted: false,
    strictComplete: false,
    publicRelease: false,
    published: false,
  };
  const manifestDocument = {
    schemaVersion: 1,
    packageId: PACKAGE_ID,
    packageType: "machine-verified-private-controlled-preview",
    entry: {
      url: "http://127.0.0.1:3233/courses/5/4",
      spanishUrl: "http://127.0.0.1:3233/es/courses/5/4",
      network: "loopback-only",
      externalDeploymentAuthorized: false,
    },
    release: {
      releaseId: RELEASE_ID,
      expectedMembers: 55,
      activePages: 54,
      courseShells: 1,
      strictCompleteCount: 0,
      missingCount: 55,
      published: false,
    },
    authority,
    build: {inputSnapshotBefore: SNAPSHOT, inputSnapshotAfter: SNAPSHOT},
    members,
    assets: {memberCount: 55, extensions: {js: 54}},
    glossaries: [
      {language: "en", entryCount: 761},
      {language: "es", entryCount: 753},
    ],
  };
  const manifest = await writeRelative(
    root,
    CORE_INPUT_PATHS.packageManifest,
    manifestDocument,
  );
  await writeRelative(root, CORE_INPUT_PATHS.packageSmoke, {
    schemaVersion: 1,
    reportType: "g5-l4-whole-lesson-package-mvp-v7-smoke",
    packageId: PACKAGE_ID,
    status: "pass-current-javascript-private-preview",
    freshArchiveExtraction: true,
    archive,
    packageManifestSha256: manifest.sha256,
    packageVerifier: {
      status: "verified",
      packageId: PACKAGE_ID,
      members: 55,
      currentJavascriptPages: 54,
      strictComplete: 0,
      published: false,
    },
    englishPagesReady: 54,
    spanishPagesReady: 54,
    fqFlows: ["fq002", "fq003"].map((id) => ({
      id,
      answerSelectionAndSubmit: true,
      replayResetToQuestionOne: true,
    })),
    glossaryCounts: {englishIndex: 761, spanishIndex: 753},
    serverIdentity: {listenerOwnedBySpawnedChild: true},
    spanishMobile: {horizontalOverflow: false},
    privacyScan: {status: "pass"},
    release: manifestDocument.release,
    consoleErrors: [],
    pageErrors: [],
    badHttpResponses: [],
    failedRequests: [],
    externalRequests: [],
    failures: [],
    authority,
  });
  const smoke = await descriptor(root, CORE_INPUT_PATHS.packageSmoke);
  const rawMarkdown = await writeRelative(
    root,
    CORE_INPUT_PATHS.rawMarkdown,
    "# fixture raw v7 boundary\n",
  );
  const runner = await descriptor(root, "scripts/qa-g5-l4-v7-deep-product.mjs");
  const runnerTest = await descriptor(root, "scripts/qa-g5-l4-v7-deep-product.test.mjs");
  const counts = (passed) => ({passed, failed: 0});
  const remediationChecks = RESOLVED_REMEDIATIONS.map(({id}) => ({
    id,
    passed: true,
    acceptanceEffect: "none",
    evidence: {fixture: true},
  }));
  const supportMap = Array.from({length: 4}, (_, index) => ({
    locale: index < 2 ? "en" : "es",
    viewport: index % 2 ? "mobile" : "desktop",
    passed: true,
    samePageAnimationId: "fixture",
    samePageFocusPassed: true,
    samePageFocus: {tagName: "H1", insidePageHeading: true},
    differentPageAnimationId: "fixture-other",
    differentPageFocusPassed: true,
    differentPageFocus: {tagName: "H1", insidePageHeading: true},
  }));
  const rawDocument = {
    schemaVersion: 1,
    reportType: "g5-l4-v7-fresh-unzip-deep-current-javascript-product-qa",
    packageId: PACKAGE_ID,
    status: "pass-current-javascript-deep-product-qa",
    generatorBinding: runner,
    testBinding: runnerTest,
    archiveBinding: archive,
    archiveSidecarBinding: sidecar,
    packageManifestBinding: {...manifest, path: `${PACKAGE_BASENAME}/package-manifest.json`},
    sourceObservation: {
      sourceCurrentAtObservation: true,
      packageSnapshot: SNAPSHOT,
      currentSnapshot: SNAPSHOT,
      currentSnapshotAtStart: SNAPSHOT,
      currentSnapshotAtEnd: SNAPSHOT,
      delta: {fileCount: 0, totalBytes: 0, sha256Changed: false},
      manifestBuildSnapshotsEqual: true,
      unchangedThroughoutQa: true,
      requiredForPass: true,
      currentWorkspaceSourceUsedToServeQa: false,
      qaRuntimeSource: "fresh-unzip-hash-bound-v7-archive",
      acceptanceEffect: "none",
    },
    authorityBoundary: {
      acceptanceNeutral: true,
      strictAcceptanceEffect: "none",
      authoritativeOriginalRuntimeAuthority: false,
      audioAuthority: false,
      humanReviewAuthority: false,
      ownerAuthority: false,
      strictCompletionAuthority: false,
      publicationAuthority: false,
    },
    acceptanceEffects: rawAcceptanceEffects(),
    releaseBoundary: {
      releaseId: RELEASE_ID,
      activePages: 54,
      courseShells: 1,
      expectedMembers: 55,
      strictCompleteCount: 0,
      missingCount: 55,
      published: false,
    },
    assertionCounts: {
      layout: counts(648), identity: counts(648), overflow: counts(648),
      reducedMotionObservations: counts(108), reducedMotionSamples: counts(324),
      replayActivations: counts(324), map: counts(4), keyTerms: counts(4),
      fq: counts(4), persistence: counts(2), remediations: counts(4),
    },
    freshClaims: {
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
    },
    scopeResult: {
      currentJavascriptDeepProductQaMachineWorkExhausted: true,
      productQaComplete: false,
      migrationQaComplete: false,
      authoritativeOriginalRuntimeComplete: false,
      audioAcceptanceComplete: false,
      humanVisualReviewComplete: false,
      ownerAcceptanceComplete: false,
      strictCompletionComplete: false,
      publicationComplete: false,
    },
    freshUnzip: {
      archiveSidecarSha256: archive.sha256,
      pinnedInput: {
        copyMode: "create-exclusive-byte-copy",
        archive,
        sidecar,
      },
      originalInputsUnchangedAtEnd: true,
      archiveEntriesSafetyCheckedInFull: true,
      packageSource: "hash-bound-v7-zip-only",
      currentWorkspaceSourceServed: false,
      loopback: {dynamicPort: true, listenerOwnedBySpawnedChild: true},
    },
    archiveSourceStability: {
      unchanged: true,
      archiveUnchanged: true,
      sidecarUnchanged: true,
      endPairValid: true,
      archiveAtStart: archive,
      archiveAtEnd: archive,
      sidecarAtStart: sidecar,
      sidecarAtEnd: sidecar,
    },
    packageVerifier: {before: {status: 0}, after: {status: 0}},
    network: {passed: true},
    support: {map: supportMap},
    remediationChecks,
    outputBindings: {
      json: {path: CORE_INPUT_PATHS.rawJson},
      markdown: rawMarkdown,
      artifactDirectory: RAW_ARTIFACT_ROOT,
    },
    failures: [],
  };
  const raw = await writeRelative(root, CORE_INPUT_PATHS.rawJson, rawDocument);
  const packageEvidence = {
    packageId: PACKAGE_ID,
    smokeReport: smoke,
    archive,
    archiveSha256: sidecar,
    packageManifest: manifest,
    packageSourceSnapshot: SNAPSHOT,
    currentSourceSnapshotAtRawObservation: SNAPSHOT,
    currentSourceSnapshotAtSuccessorAssembly: SNAPSHOT,
    sourceCurrentAtObservation: true,
    sourceCurrentAtSuccessorAssembly: true,
    sourceUnchangedThroughoutRawQa: true,
    freshArchiveExtraction: true,
    qaRuntimeSource: "fresh-unzip-hash-bound-v7-archive",
    authorityBoundary: {...R6_AUTHORITY_BOUNDARY},
  };
  const rawDeepQaEvidence = {
    report: raw,
    markdown: rawMarkdown,
    runner,
    runnerTest,
    artifactBindings: [{...rawMarkdown, role: "fixture-browser-artifact"}],
    status: rawDocument.status,
    assertionCounts: rawDocument.assertionCounts,
    freshClaims: rawDocument.freshClaims,
    remediationChecks,
    mapFocus: supportMap.map((entry) => ({
      locale: entry.locale,
      viewport: entry.viewport,
      samePageAnimationId: entry.samePageAnimationId,
      samePageFocusPassed: entry.samePageFocusPassed,
      differentPageAnimationId: entry.differentPageAnimationId,
      differentPageFocusPassed: entry.differentPageFocusPassed,
    })),
  };
  const sourceBindings = await Promise.all(R6_SOURCE_PATHS.map((relativePath) =>
    descriptor(root, relativePath)
  ));
  const fakeBinding = (relativePath) => ({path: relativePath, bytes: 1, sha256: "c".repeat(64)});
  const predecessorEvidence = (kind) => ({
    receipt: fakeBinding(kind === "fq"
      ? "reports/g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r5.json"
      : "reports/g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r5.json"),
    markdown: fakeBinding(kind === "fq"
      ? "reports/g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r5.md"
      : "reports/g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r5.md"),
    immediatePredecessor: true,
    currentAuthority: false,
    claimsCarriedForward: false,
    supersededByFreshV7RawR1: true,
  });
  const resolvedRemediations = RESOLVED_REMEDIATIONS.map(({id, predecessorFinding}) => ({
    id,
    predecessorFinding,
    predecessorFindingObserved: true,
    predecessorClaimsCarriedForward: false,
    freshV7Resolved: true,
    rawCheckPassed: true,
    acceptanceEffect: "none",
  }));
  const commonR6 = (kind, markdownBinding) => ({
    schemaVersion: 4,
    evidenceType: kind === "fq"
      ? "g5-l4-current-js-fq23-companion-deep-qa-successor-receipt"
      : "g5-l4-current-js-whole-lesson-product-deep-qa-successor-receipt",
    receiptId: kind === "fq"
      ? "g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r6"
      : "g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r6",
    releaseId: RELEASE_ID,
    packageId: PACKAGE_ID,
    status: "pass-current-javascript-deep-product-qa",
    evidenceAssembledOn: "2026-08-01",
    authorityBoundary: {...R6_AUTHORITY_BOUNDARY},
    scope: {
      networkBoundary: "loopback-only-local-preview",
      previewClass: "private-controlled-ceo-preview",
      packageId: PACKAGE_ID,
      g4L3Port3216Touched: false,
      externalDeploymentPerformed: false,
      ...(kind === "fq"
        ? {members: ["course-g05-l04-fq-002", "course-g05-l04-fq-003"]}
        : {releaseMembers: 55, activePages: 54, courseShells: 1}),
    },
    packageEvidence,
    predecessorEvidence: predecessorEvidence(kind),
    rawDeepQaEvidence,
    resolvedRemediations,
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
      ...(kind === "fq" ? {
        currentJavascriptFq23DeepQaFreshlyPerformed: true,
        exactReleaseOrderFreshlyEstablished: true,
        fqInteractionFreshlyReperformed: true,
      } : {
        exactReleaseOrderFreshlyEstablished: true,
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
    sourceBindings,
    artifacts: [{
      ...markdownBinding,
      role: kind === "fq"
        ? "human-readable-r6-fq23-companion-deep-qa-successor-boundary"
        : "human-readable-r6-whole-lesson-product-deep-qa-successor-boundary",
    }],
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
  });
  const fqMarkdown = await writeRelative(root, CORE_INPUT_PATHS.fqR6Markdown, "# fixture fq r6\n");
  const fqDocument = commonR6("fq", fqMarkdown);
  const fq = await writeRelative(root, CORE_INPUT_PATHS.fqR6Json, fqDocument);
  const wholeMarkdown = await writeRelative(root, CORE_INPUT_PATHS.wholeR6Markdown, "# fixture whole r6\n");
  const wholeDocument = commonR6("whole", wholeMarkdown);
  wholeDocument.childReceipts = [{...fq, role: "r6-fq23-deep-qa-successor"}];
  await writeRelative(root, CORE_INPUT_PATHS.wholeR6Json, wholeDocument);

  await writeRelative(
    root,
    CORE_INPUT_PATHS.audioStaticJson,
    await readFile(path.resolve(PROJECT_ROOT, CORE_INPUT_PATHS.audioStaticJson)),
  );
  await writeRelative(
    root,
    CORE_INPUT_PATHS.audioStaticMarkdown,
    await readFile(path.resolve(PROJECT_ROOT, CORE_INPUT_PATHS.audioStaticMarkdown)),
  );
}

async function createOwnerFixture(root) {
  await writeRelative(root, "reports/g5-l4-owner-action-packet.json", {
    schemaVersion: 1,
    reportType: "g5-l4-unsigned-owner-action-packet",
    releaseId: RELEASE_ID,
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
  });
  await writeRelative(
    root,
    "reports/g5-l4-owner-action-packet.md",
    "# fixture owner predecessor\n",
  );
  await writeRelative(
    root,
    "catalog/owner-authorizations/g5-l4-original-runtime-animate-operator-assignment-2026-07-28.json",
    {
      releaseId: RELEASE_ID,
      assignment: {
        assigneeFullName: "Dr. Peter Hu",
        roleId: "authorized-original-runtime-operator",
        explicit: true,
      },
      authorityBoundary: {
        namedHumanRoleAssignmentEstablished: true,
        immutableSessionAuthorizationEstablished: false,
        actualOriginalRuntimeSessionEstablished: false,
      },
    },
  );
  await writeRelative(
    root,
    "catalog/owner-authorizations/g5-l4-owner-continuation-and-prospective-approval-intake-2026-08-01.json",
    {releaseId: RELEASE_ID, authority: "fixture-work-only"},
  );
  await writeRelative(
    root,
    "reports/g5-l4-per-session-authorization-preparation.json",
    {
      evidenceState: "unsigned-non-runnable-session-preparation-only",
      summary: {sessionsExecuted: 0, runnableTemplates: 0},
    },
  );
  await writeRelative(
    root,
    "reports/g5-l4-missing-keyterm-recovery-readiness.json",
    {
      releaseId: RELEASE_ID,
      recoveryGate: {
        exactTargetCandidates: 0,
        recoveredTargets: 0,
        sourceGapClosed: false,
      },
    },
  );
  await writeRelative(
    root,
    "reports/g5-l4-keyterms-source-gap-exception-proposal.json",
    {
      status: "unsigned-proposal-runtime-observation-and-owner-review-required",
      admissionPrerequisites: [
        {id: "runtime", satisfied: false},
        {id: "validator", satisfied: false},
      ],
      unsignedOwnerDecision: {decision: "pending"},
    },
  );
  await writeRelative(root, "catalog/lesson-release-ledger.json", {
    releases: [{
      releaseId: RELEASE_ID,
      expectedMemberCount: 55,
      strictCompleteCount: 0,
      missingCount: 55,
      published: false,
      status: "unpublished",
    }],
  });
}

async function createCanonicalOwnerFixture(root) {
  for (const relativePath of Object.values(OWNER_INPUT_PATHS)) {
    await writeRelative(
      root,
      relativePath,
      await readFile(path.resolve(PROJECT_ROOT, relativePath)),
    );
  }
}

test("fixed output paths and acceptance boundary remain fail-closed", () => {
  assert.deepEqual(OUTPUTS, {
    continuation:
      "reports/g5-l4-continuation-machine-readiness-successor-2026-08-01-v7-r1",
    delivery:
      "reports/g5-l4-whole-lesson-package-mvp-v7-delivery-2026-08-01-r1",
    owner:
      "reports/g5-l4-owner-action-packet-successor-2026-08-01-v7-r1",
  });
  assert.ok(Object.values(ACCEPTANCE_EFFECTS).every((value) => value === false));
  assert.equal(
    CORE_INPUT_PATHS.rawJson,
    "reports/g5-l4-whole-lesson-package-mvp-v7-deep-product-qa-2026-08-01-r2.json",
  );
  assert.equal(
    CORE_INPUT_PATHS.rawMarkdown,
    "reports/g5-l4-whole-lesson-package-mvp-v7-deep-product-qa-2026-08-01-r2.md",
  );
  assert.equal(
    CORE_INPUT_PATHS.keytermsR2Json,
    "reports/g5-l4-combined-keyterms-product-reference-binding-successor-2026-08-01-r2.json",
  );
  assert.equal(
    CORE_INPUT_PATHS.keytermsR2Markdown,
    "reports/g5-l4-combined-keyterms-product-reference-binding-successor-2026-08-01-r2.md",
  );
  assert.equal(
    CRITICAL_SOURCE_PATHS.filter((value) => value === KEYTERMS_R2_GENERATOR_PATH).length,
    1,
  );
  assert.equal(
    CRITICAL_SOURCE_PATHS.filter((value) => value === KEYTERMS_R2_TEST_PATH).length,
    1,
  );
  assert.deepEqual(parseMode(["--write"]), {check: false});
  assert.deepEqual(parseMode(["--check"]), {check: true});
  assert.throws(() => parseMode([]), /exactly one mode/);
  assert.throws(() => parseMode(["--write", "--check"]), /exactly one mode/);
});

test("missing formal v7 inputs fail closed before any report is created", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "g5-l4-v7-missing-"));
  try {
    await assert.rejects(
      collectCoreEvidence({projectRoot: root}),
      /required input unavailable/,
    );
    await assert.rejects(
      readFile(path.resolve(root, `${OUTPUTS.continuation}.json`)),
      /ENOENT/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("fixture chain builds, validates, checks, and preserves role/session distinction", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "g5-l4-v7-successors-"));
  try {
    await createCanonicalCoreFixture(root);
    await createCanonicalOwnerFixture(root);

    await assert.rejects(
      buildContinuationReport({
        projectRoot: root,
        sourceSnapshotCollector: async () => ({...SNAPSHOT, sha256: "d".repeat(64)}),
      }),
      /source snapshot manifestBefore drifted/,
    );

    const continuation = await buildContinuationReport({
      projectRoot: root,
      ...TEST_BUILD_OPTIONS,
    });
    validateContinuationReport(continuation);
    assert.equal(
      continuation.currentJavascriptDeepProductQaMachineWorkExhausted,
      true,
    );
    assert.equal(continuation.acceptanceEffects.strictComplete, false);
    assert.equal(
      continuation.sourceBindings
        .combinedKeytermsProductReferenceBindingSuccessor.json.path,
      CORE_INPUT_PATHS.keytermsR2Json,
    );
    assert.equal(
      continuation.sourceBindings
        .combinedKeytermsProductReferenceBindingSuccessor.markdown.path,
      CORE_INPUT_PATHS.keytermsR2Markdown,
    );
    assert.equal(
      continuation.inputCurrency.criticalSourceCoverage
        .keytermsR2ExactBindingCount,
      2,
    );
    await writeOrCheckPair({
      projectRoot: root,
      prefix: OUTPUTS.continuation,
      kind: "continuation",
      report: continuation,
    });

    const delivery = await buildDeliveryReport({
      projectRoot: root,
      ...TEST_BUILD_OPTIONS,
    });
    validateDeliveryReport(delivery);
    assert.equal(delivery.deliveryBoundary.externalDeploymentPerformed, false);
    assert.deepEqual(
      delivery.sourceBindings
        .combinedKeytermsProductReferenceBindingSuccessor,
      continuation.sourceBindings
        .combinedKeytermsProductReferenceBindingSuccessor,
    );
    await writeOrCheckPair({
      projectRoot: root,
      prefix: OUTPUTS.delivery,
      kind: "delivery",
      report: delivery,
    });

    const owner = await buildOwnerReport({
      projectRoot: root,
      ...TEST_BUILD_OPTIONS,
    });
    validateOwnerReport(owner);
    assert.equal(owner.operatorBoundary.namedPrimaryRoleAssigned, true);
    assert.equal(owner.operatorBoundary.assigneeFullName, "Dr. Peter Hu");
    assert.equal(
      owner.operatorBoundary.exactSessionOperatorDeclarationEstablished,
      false,
    );
    assert.equal(owner.exactSessionTemplate.operatorDeclaration, null);
    assert.equal(owner.exactSessionTemplate.runnable, false);
    assert.deepEqual(
      owner.sourceBindings.combinedKeytermsProductReferenceBindingSuccessor,
      continuation.sourceBindings
        .combinedKeytermsProductReferenceBindingSuccessor,
    );
    const partialEffects = structuredClone(continuation);
    delete partialEffects.acceptanceEffects.audioAccepted;
    assert.throws(
      () => validateContinuationReport(partialEffects),
      /acceptanceEffects keys drifted/,
    );
    const wrongMemberBoundary = structuredClone(continuation);
    wrongMemberBoundary.releaseBoundary.expectedMembers = 1;
    assert.throws(
      () => validateContinuationReport(wrongMemberBoundary),
      /boundary drifted/,
    );
    const missingUpstream = structuredClone(delivery);
    delete missingUpstream.sourceBindings.continuationSuccessor;
    assert.throws(
      () => validateDeliveryReport(missingUpstream),
      /sourceBindings keys drifted/,
    );
    const missingKeytermsR2 = structuredClone(continuation);
    delete missingKeytermsR2.sourceBindings
      .combinedKeytermsProductReferenceBindingSuccessor;
    assert.throws(
      () => validateContinuationReport(missingKeytermsR2),
      /sourceBindings keys drifted/,
    );
    const changedKeytermsR2Binding = structuredClone(continuation);
    changedKeytermsR2Binding.sourceBindings
      .combinedKeytermsProductReferenceBindingSuccessor.json.sha256 =
        "f".repeat(64);
    assert.throws(
      () => validateContinuationReport(changedKeytermsR2Binding),
      /inputSetSha256 drifted/,
    );
    const wrongCompanionRole = structuredClone(owner);
    wrongCompanionRole.companionMarkdown.role = "wrong-role";
    assert.throws(
      () => validateOwnerReport(wrongCompanionRole),
      /role drifted/,
    );
    const exactSessionPromotion = structuredClone(owner);
    exactSessionPromotion.operatorBoundary.exactSessionOperatorDeclarationEstablished = true;
    assert.throws(
      () => validateOwnerReport(exactSessionPromotion),
      /conflated role assignment/,
    );
    await writeOrCheckPair({
      projectRoot: root,
      prefix: OUTPUTS.owner,
      kind: "owner",
      report: owner,
    });

    for (const [kind, report] of [
      ["continuation", continuation],
      ["delivery", delivery],
      ["owner", owner],
    ]) {
      const result = await writeOrCheckPair({
        projectRoot: root,
        prefix: OUTPUTS[kind],
        kind,
        report,
        check: true,
      });
      assert.equal(result.action, "verified");
      await assert.rejects(
        writeOrCheckPair({
          projectRoot: root,
          prefix: OUTPUTS[kind],
          kind,
          report,
        }),
        /already exists/,
      );
    }

    await writeFile(
      path.resolve(root, KEYTERMS_R2_GENERATOR_PATH),
      "fixture drift after valid chain\n",
    );
    await assert.rejects(
      collectCoreEvidence({
        projectRoot: root,
        ...TEST_BUILD_OPTIONS,
      }),
      /combined Key Terms r2 generator does not match the fixed current file/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("staged pair publication rolls back injected steps 2 and 3 without residue", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "g5-l4-v7-pair-rollback-"));
  try {
    await createCanonicalCoreFixture(root);
    const report = await buildContinuationReport({
      projectRoot: root,
      ...TEST_BUILD_OPTIONS,
    });
    for (const publishFailureAt of [2, 3]) {
      await assert.rejects(
        writeOrCheckPair({
          projectRoot: root,
          prefix: OUTPUTS.continuation,
          kind: "continuation",
          report,
          publishFailureAt,
        }),
        new RegExp(`injected publish failure at step ${publishFailureAt}`),
      );
      await assert.rejects(
        readFile(path.resolve(root, `${OUTPUTS.continuation}.json`)),
        /ENOENT/,
      );
      await assert.rejects(
        readFile(path.resolve(root, `${OUTPUTS.continuation}.md`)),
        /ENOENT/,
      );
      assert.deepEqual(
        (await readdir(root)).filter((name) =>
          name.startsWith(".g5-l4-v7-continuation-stage-")
        ),
        [],
      );
    }
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("rollback cleanup failures are aggregated and residuals are reported", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "g5-l4-v7-cleanup-failure-"));
  try {
    await createCanonicalCoreFixture(root);
    const report = await buildContinuationReport({
      projectRoot: root,
      ...TEST_BUILD_OPTIONS,
    });
    await assert.rejects(
      writeOrCheckPair({
        projectRoot: root,
        prefix: OUTPUTS.continuation,
        kind: "continuation",
        report,
        publishFailureAt: 2,
        cleanupFailureAt: "rollback-unlink",
      }),
      (error) => {
        assert.equal(error instanceof AggregateError, true);
        assert.match(error.message, /cleanup errors or residuals/);
        assert.match(
          error.errors.map((item) => item?.message).join("\n"),
          /rollback residual remains/,
        );
        return true;
      },
    );
    assert.equal(
      await readFile(path.resolve(root, `${OUTPUTS.continuation}.json`), "utf8")
        .then(() => true, () => false),
      true,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("exported validator rejects a boundary-only object without the evidence chain", () => {
  const base = {
    schemaVersion: 1,
    reportType: "g5-l4-owner-action-packet-v7-successor",
    releaseId: RELEASE_ID,
    packageId: PACKAGE_ID,
    operatorBoundary: {
      namedPrimaryRoleAssigned: true,
      assigneeFullName: "Dr. Peter Hu",
      exactSessionOperatorDeclarationEstablished: false,
      immutableSessionAuthorizationEstablished: false,
      originalRuntimeSessionExecuted: false,
    },
    exactSessionTemplate: {operatorDeclaration: null, runnable: false},
    keytermsBoundary: {
      exactCandidateCount: 0,
      recoveredTargetCount: 0,
      lessonSpecificSubstitutionAuthorized: false,
      sourceGapClosed: false,
    },
    releaseBoundary: {
      expectedMembers: 55,
      strictCompleteCount: 0,
      missingStrictCompletionEntryCount: 55,
      published: false,
    },
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    acceptanceNeutral: true,
    strictAcceptanceEffect: "none",
  };
  assert.throws(
    () => validateOwnerReport(base),
    /sourceBindings core is missing|sourceBindings is missing/,
  );
});
