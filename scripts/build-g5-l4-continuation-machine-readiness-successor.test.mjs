import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  ACCEPTANCE_EFFECTS,
  DEFAULT_INPUT_PATHS,
  GENERATOR_PATH,
  PACKAGE_ID,
  RAW_REPORT_TYPE,
  RELEASE_ID,
  buildReport,
  parseArguments,
  renderMarkdown,
  stableJson,
  validateReport,
  writeOrCheck,
} from "./build-g5-l4-continuation-machine-readiness-successor.mjs";

const canonicalRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const PACKAGE_SOURCE_SNAPSHOT = Object.freeze({
  fileCount: 537,
  totalBytes: 189628108,
  sha256: "f8e506deb23dfd1c2c9d231d1c80470cab4df9ae91992409d29fc6dc293d955a",
});
const CURRENT_SOURCE_SNAPSHOT = Object.freeze({
  fileCount: 537,
  totalBytes: 189628204,
  sha256: "88e39500a536fd8dae91cf1b907734c6ab88d8b665a7e5562f7b43604b6a2484",
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function writeRelative(root, relativePath, contents) {
  const absolute = path.join(root, relativePath);
  await mkdir(path.dirname(absolute), {recursive: true});
  await writeFile(absolute, contents);
  return absolute;
}

async function copyCanonical(root, relativePath) {
  await writeRelative(root, relativePath, await readFile(path.join(canonicalRoot, relativePath)));
}

async function descriptor(root, relativePath) {
  const bytes = await readFile(path.join(root, relativePath));
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)};
}

async function writeJson(root, relativePath, document) {
  await writeRelative(root, relativePath, `${JSON.stringify(document, null, 2)}\n`);
  return descriptor(root, relativePath);
}

function r5AcceptanceEffects() {
  return {
    productQaComplete: false,
    migrationQaComplete: false,
    authoritativeOriginalRuntime: false,
    naturalNavigationCausalityEstablished: false,
    spanishSourceVisualParityEstablished: false,
    audioAccepted: false,
    fullFrameRmseAccepted: false,
    independentHumanVisualReviewAccepted: false,
    ownerFidelityAccepted: false,
    strictComplete: false,
    externalDeploymentAuthorized: false,
    publicReleaseAuthorized: false,
    published: false,
  };
}

function packageEvidence(packageBindings) {
  return {
    packageId: PACKAGE_ID,
    smokeReport: packageBindings.packageSmoke,
    archive: packageBindings.packageArchive,
    archiveSha256: packageBindings.packageArchiveSha256,
    packageManifest: packageBindings.packageManifest,
    packageSourceSnapshot: PACKAGE_SOURCE_SNAPSHOT,
    currentSourceSnapshot: CURRENT_SOURCE_SNAPSHOT,
    sourceCurrentAtObservation: false,
    sourceDrift: {
      changedPath: "apps/web/tsconfig.json",
      totalBytesDelta: 96,
      explanation:
        "The G4 v3.1 packaging run changed apps/web/tsconfig.json by 96 bytes after the immutable v6 package snapshot.",
    },
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
    acceptanceNeutral: true,
    strictAcceptanceEffect: "none",
  };
}

async function seedFixture(root, {rawStatus = "pass-current-javascript-deep-product-qa"} = {}) {
  for (const relativePath of [
    GENERATOR_PATH,
    DEFAULT_INPUT_PATHS.predecessorJson,
    DEFAULT_INPUT_PATHS.predecessorMarkdown,
    DEFAULT_INPUT_PATHS.audioStaticJson,
    DEFAULT_INPUT_PATHS.audioStaticMarkdown,
  ]) await copyCanonical(root, relativePath);

  const archiveBytes = Buffer.from("synthetic immutable ZIP fixture\n", "utf8");
  await writeRelative(root, DEFAULT_INPUT_PATHS.packageArchive, archiveBytes);
  const archiveDescriptor = await descriptor(root, DEFAULT_INPUT_PATHS.packageArchive);
  await writeRelative(
    root,
    DEFAULT_INPUT_PATHS.packageArchiveSha256,
    `${archiveDescriptor.sha256}  ${path.basename(DEFAULT_INPUT_PATHS.packageArchive)}\n`,
  );
  const archiveShaDescriptor = await descriptor(
    root,
    DEFAULT_INPUT_PATHS.packageArchiveSha256,
  );

  const manifestDescriptor = await writeJson(
    root,
    DEFAULT_INPUT_PATHS.packageManifest,
    {
      schemaVersion: 1,
      packageId: PACKAGE_ID,
      release: {
        releaseId: RELEASE_ID,
        expectedMembers: 55,
        activePages: 54,
        strictCompleteCount: 0,
        published: false,
      },
      authority: {
        authoritativeOriginalRuntime: false,
        audioAccepted: false,
        humanVisualAccepted: false,
        ownerFidelityAccepted: false,
        strictComplete: false,
        publicRelease: false,
        published: false,
      },
    },
  );

  const smokeDescriptor = await writeJson(
    root,
    DEFAULT_INPUT_PATHS.packageSmoke,
    {
      schemaVersion: 1,
      reportType: "g5-l4-whole-lesson-package-mvp-v6-smoke",
      packageId: PACKAGE_ID,
      status: "pass-current-javascript-private-preview",
      freshArchiveExtraction: true,
      archiveEntryCount: 25,
      archive: archiveDescriptor,
      packageManifestSha256: manifestDescriptor.sha256,
      packageVerifier: {
        status: "verified",
        packageId: PACKAGE_ID,
        members: 55,
        currentJavascriptPages: 54,
        strictComplete: 0,
        published: false,
        privacyScan: {status: "pass"},
      },
    },
  );
  const packageBindings = {
    packageSmoke: smokeDescriptor,
    packageManifest: manifestDescriptor,
    packageArchive: archiveDescriptor,
    packageArchiveSha256: archiveShaDescriptor,
  };

  const raw = {
    schemaVersion: 1,
    reportType: RAW_REPORT_TYPE,
    packageId: PACKAGE_ID,
    status: rawStatus,
    archiveBinding: archiveDescriptor,
    packageManifestBinding: manifestDescriptor,
    sourceObservation: {
      sourceCurrentAtObservation: false,
      packageSnapshot: PACKAGE_SOURCE_SNAPSHOT,
      currentSnapshot: CURRENT_SOURCE_SNAPSHOT,
      delta: {fileCount: 0, totalBytes: 96, sha256Changed: true},
      driftReason:
        "The G4 v3.1 packaging run changed apps/web/tsconfig.json by 96 bytes after v6.",
    },
    assertionCounts: {
      layout: {passed: 648, failed: 0},
      identity: {passed: 648, failed: 0},
      overflow: {passed: 648, failed: 0},
      reducedMotionObservations: {passed: 108, failed: 0},
      reducedMotionSamples: {passed: 324, failed: 0},
      replayActivations: {passed: 324, failed: 0},
    },
    freshClaims: {
      exactReleaseOrder: true,
      map: true,
      keyTerms: true,
      fq: true,
      persistence: true,
      networkBoundary: true,
      perPageDirectUrl: false,
      productQaComplete: false,
    },
    knownRemediationsRequired: [
      "Reduced-motion note pointer interception can block stage interaction.",
      "VB004 Spanish modern UI remains English.",
      "The Exit target is clipped at 390 px.",
      "Course Map same-page selection loses focus.",
    ],
    releaseBoundary: {expectedMembers: 55, strictCompleteCount: 0, published: false},
    acceptanceEffects: rawAcceptanceEffects(),
  };
  const rawDescriptor = await writeJson(root, DEFAULT_INPUT_PATHS.deepRawJson, raw);
  await writeRelative(
    root,
    DEFAULT_INPUT_PATHS.deepRawMarkdown,
    `# Raw deep QA\n\nStatus: \`${rawStatus}\`.\n`,
  );
  const rawMarkdownDescriptor = await descriptor(root, DEFAULT_INPUT_PATHS.deepRawMarkdown);

  const fqReceipt = {
    schemaVersion: 3,
    evidenceType:
      "g5-l4-current-js-fq23-companion-deep-qa-successor-receipt",
    receiptId:
      "g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r5",
    releaseId: RELEASE_ID,
    scope: {
      packageId: PACKAGE_ID,
      networkBoundary: "loopback-only-local-preview",
      previewClass: "private-controlled-ceo-preview",
      g4L3Port3216Touched: false,
      externalDeploymentPerformed: false,
      members: ["course-g05-l04-fq-002", "course-g05-l04-fq-003"],
    },
    packageEvidence: packageEvidence(packageBindings),
    rawDeepQaEvidence: {report: rawDescriptor, markdown: rawMarkdownDescriptor},
    sourceBindings: Object.values(packageBindings),
    artifacts: [],
    scopeResult: {
      currentJavascriptFq23DeepQaFreshlyEstablished: true,
      exactReleaseOrderFreshlyEstablished: true,
      fqInteractionFreshlyReperformed: true,
      predecessorClaimsCarriedForward: false,
      productQaComplete: false,
      migrationQaComplete: false,
    },
    acceptanceEffects: r5AcceptanceEffects(),
  };
  const fqDescriptor = await writeJson(
    root,
    DEFAULT_INPUT_PATHS.fqSuccessorJson,
    fqReceipt,
  );
  await writeRelative(
    root,
    DEFAULT_INPUT_PATHS.fqSuccessorMarkdown,
    `# ${fqReceipt.receiptId}\n\nAll strict gates remain false.\n`,
  );

  const wholeReceipt = {
    schemaVersion: 3,
    evidenceType:
      "g5-l4-current-js-whole-lesson-product-deep-qa-successor-receipt",
    receiptId:
      "g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r5",
    releaseId: RELEASE_ID,
    scope: {
      packageId: PACKAGE_ID,
      networkBoundary: "loopback-only-local-preview",
      previewClass: "private-controlled-ceo-preview",
      g4L3Port3216Touched: false,
      externalDeploymentPerformed: false,
      releaseMembers: 55,
      activePages: 54,
      courseShells: 1,
    },
    packageEvidence: packageEvidence(packageBindings),
    rawDeepQaEvidence: {report: rawDescriptor, markdown: rawMarkdownDescriptor},
    childReceipts: [fqDescriptor],
    sourceBindings: Object.values(packageBindings),
    artifacts: [],
    scopeResult: {
      currentJavascriptWholeLessonDeepQaFreshlyEstablished: true,
      exactReleaseOrderFreshlyEstablished: true,
      layoutAssertionsFreshlyPassed: true,
      reducedMotionAssertionsFreshlyPassed: true,
      replayAssertionsFreshlyPassed: true,
      courseMapInteractionFreshlyReperformed: true,
      keyTermsInteractionFreshlyReperformed: true,
      fqInteractionFreshlyReperformed: true,
      crossLocalePersistenceFreshlyReperformed: true,
      predecessorClaimsCarriedForward: false,
      productQaComplete: false,
      migrationQaComplete: false,
    },
    acceptanceEffects: r5AcceptanceEffects(),
  };
  await writeJson(root, DEFAULT_INPUT_PATHS.wholeSuccessorJson, wholeReceipt);
  await writeRelative(
    root,
    DEFAULT_INPUT_PATHS.wholeSuccessorMarkdown,
    `# ${wholeReceipt.receiptId}\n\nAll strict gates remain false.\n`,
  );
}

async function withFixture(callback, options) {
  const root = await mkdtemp(path.join(tmpdir(), "g5-l4-continuation-successor-"));
  try {
    await seedFixture(root, options);
    return await callback(root);
  } finally {
    await chmod(root, 0o700).catch(() => {});
    await rm(root, {recursive: true, force: true});
  }
}

function refingerprint(report) {
  const {reportFingerprintSha256: _discarded, ...payload} = report;
  report.reportFingerprintSha256 = sha256(Buffer.from(stableJson(payload), "utf8"));
}

test("builds three separated machine facts without inheriting the broad predecessor claim", async () => {
  await withFixture(async (root) => {
    const report = await buildReport({projectRoot: root});
    assert.equal(report.staticSpecificationMachinePreparationExhausted, true);
    assert.equal(report.currentJavascriptDeepProductQaMachineWorkExhausted, true);
    assert.equal(report.audioStaticReconciliationComplete, true);
    assert.equal(report.audioRuntimeReachability, "pending");
    assert.equal(report.audioListening, "pending");
    assert.equal(report.audioSpokenLanguage, "pending");
    assert.equal(report.audioSynchronization, "pending");
    assert.equal(
      Object.hasOwn(report, "machinePreparationExhaustedBeforeHumanGate"),
      false,
    );
    assert.equal(report.inputCurrency.boundInputCount, 14);
    assert.match(report.inputCurrency.inputSetSha256, SHA256_PATTERN);
    assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
    assert.equal(report.summary.strictCompleteCount, 0);
    assert.equal(report.summary.publishedCount, 0);
  });
});

test("derives current-JavaScript exhaustion only from the final raw pass", async () => {
  await withFixture(async (root) => {
    const report = await buildReport({projectRoot: root});
    assert.equal(report.currentJavascriptDeepProductQaBoundary.derivedOnlyFromFinalRawPass, true);
    assert.match(report.currentJavascriptDeepProductQaBoundary.rawStatus, /^pass-/);
    assert.equal(report.currentJavascriptDeepProductQaBoundary.layoutAssertionCount, 648);
    assert.equal(report.currentJavascriptDeepProductQaBoundary.reducedMotionObservationCount, 108);
    assert.equal(report.currentJavascriptDeepProductQaBoundary.reducedMotionSampleCount, 324);
    assert.equal(report.currentJavascriptDeepProductQaBoundary.replayActivationCount, 324);
    assert.equal(report.currentJavascriptDeepProductQaBoundary.productQaComplete, false);
    assert.equal(report.currentJavascriptDeepProductQaBoundary.migrationQaComplete, false);
  });

  await withFixture(
    async (root) => {
      await assert.rejects(
        buildReport({projectRoot: root}),
        /requires a final raw pass-\* status/,
      );
    },
    {rawStatus: "fail-current-javascript-deep-product-qa"},
  );
});

test("validator fails closed on broad exhaustion, raw-pass, audio, and acceptance promotion", async () => {
  await withFixture(async (root) => {
    const report = await buildReport({projectRoot: root});
    const mutations = [
      (value) => { value.machinePreparationExhaustedBeforeHumanGate = true; },
      (value) => { value.staticSpecificationMachinePreparationExhausted = false; },
      (value) => { value.currentJavascriptDeepProductQaBoundary.rawStatus = "fail-forged"; },
      (value) => { value.audioRuntimeReachability = "established"; },
      (value) => { value.audioBoundary.listeningAcceptedCueCount = 1; },
      (value) => { value.acceptanceEffects.ownerFidelityAccepted = true; },
      (value) => { value.summary.currentJavascriptProductQaComplete = true; },
    ];
    for (const mutate of mutations) {
      const forged = structuredClone(report);
      mutate(forged);
      refingerprint(forged);
      assert.throws(() => validateReport(forged));
    }
  });
});

test("is deterministic and renders the split evidence boundary", async () => {
  await withFixture(async (root) => {
    const first = await buildReport({projectRoot: root});
    const second = await buildReport({projectRoot: root});
    assert.equal(stableJson(first), stableJson(second));
    const markdown = renderMarkdown(first);
    assert.match(markdown, /Static specification machine preparation exhausted: \*\*true\*\*/);
    assert.match(markdown, /derived only from raw status/);
    assert.match(markdown, /Audio runtime reachability: \*\*pending\*\*/);
    assert.match(markdown, /All acceptance effects remain `false`/);
  });
});

test("writer creates once, checks read-only, and refuses overwrite", async () => {
  await withFixture(async (root) => {
    const report = await buildReport({projectRoot: root});
    const outputPrefix = "reports/fixture-continuation-successor";
    const created = await writeOrCheck({projectRoot: root, outputPrefix, report});
    assert.equal(created.action, "created");
    assert.equal(created.outputs.length, 2);
    assert.equal(
      (await writeOrCheck({projectRoot: root, outputPrefix, report, check: true})).action,
      "verified",
    );
    const before = await Promise.all([
      readFile(path.join(root, `${outputPrefix}.json`)),
      readFile(path.join(root, `${outputPrefix}.md`)),
    ]);
    await assert.rejects(
      writeOrCheck({projectRoot: root, outputPrefix, report}),
      /Refusing to overwrite existing output/,
    );
    const after = await Promise.all([
      readFile(path.join(root, `${outputPrefix}.json`)),
      readFile(path.join(root, `${outputPrefix}.md`)),
    ]);
    assert.ok(after[0].equals(before[0]));
    assert.ok(after[1].equals(before[1]));
  });
});

test("writer rejects any input drift after report construction", async () => {
  await withFixture(async (root) => {
    const report = await buildReport({projectRoot: root});
    await writeRelative(root, DEFAULT_INPUT_PATHS.deepRawMarkdown, "drifted\n");
    await assert.rejects(
      writeOrCheck({
        projectRoot: root,
        outputPrefix: "reports/should-not-exist",
        report,
      }),
      /stale or mismatched descriptor/,
    );
  });
});

test("argument parser requires an explicit safe output and supports parameterized inputs", () => {
  assert.throws(() => parseArguments([]), /--output-prefix is required/);
  const parsed = parseArguments([
    "--output-prefix",
    "reports/new-successor",
    "--deep-raw-json",
    "reports/custom-raw.json",
    "--check",
  ]);
  assert.equal(parsed.outputPrefix, "reports/new-successor");
  assert.equal(parsed.inputPaths.deepRawJson, "reports/custom-raw.json");
  assert.equal(parsed.check, true);
  for (const argv of [
    ["--output-prefix", "../escape"],
    ["--output-prefix", "reports/result.json"],
    ["--unknown"],
    ["--output-prefix"],
    ["--help", "--check"],
  ]) assert.throws(() => parseArguments(argv));
});
