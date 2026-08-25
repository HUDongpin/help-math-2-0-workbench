import assert from "node:assert/strict";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import vm from "node:vm";

import {
  APPROVED_ATOMIC_COMMIT_HELPER_SHA256,
  APPROVED_ATOMIC_COMMIT_BUILD_RECEIPT_SHA256,
  APPROVED_REGENERATION_PROVENANCE_RECEIPT_SHA256,
  APPROVED_RELEASE_IDS,
  ATOMIC_COMMIT_DRIVER_IMPLEMENTED,
  ATOMIC_COMMIT_BUILD_RECEIPT_PATH,
  CHROMIUM_PROOF_RUNNER_CONTRACT,
  CHROMIUM_PROOF_RUNNER_MODE,
  CHROMIUM_PROOF_TEST_NAME,
  DEFAULT_CHROMIUM_PROOF_RECEIPT_PATH,
  DEFAULT_PLAN_RECEIPT_PATH,
  EXPECTED_PAGE_RENDERER_CHECKSUM_SET_SHA256,
  EXPECTED_V1_CHECKSUM_SET_SHA256,
  EXPECTED_V1_PROFILE_SHA256,
  LOADED_HOST,
  PROFILE_COUNTS,
  GUARDED_CANVAS_RESIZE_PROPERTIES,
  GUARDED_MUTATING_2D_METHODS,
  K2_COMPARISON_ALGORITHM,
  REAL_CHROMIUM_GUARD_DEFINITION,
  REAL_CHROMIUM_SAMPLE_DEFINITIONS,
  REGENERATION_PROVENANCE_RECEIPT_PATH,
  REQUIRED_ATOMIC_COMMIT_CAPABILITY,
  RESOLUTION,
  applyAdaptiveCanvasBatch,
  assertAtomicCommitCapabilityApproved,
  assertFreshChromiumProofPublicationTarget,
  canonicalJson,
  chromiumProofDocument,
  chromiumProofReceiptBytes,
  captureProductionOutputClosure,
  captureProductionPrecommitClosure,
  collectChromiumProofIdentity,
  captureStablePathClosure,
  computeProfileChecksumSet,
  generatedBindingsBytes,
  inactiveV1BindingsBytes,
  loadFixedV1Profile,
  maximumRmseForFrameClass,
  parseArguments,
  planReceiptBytes,
  readAndValidateRegenerationProvenanceReceipt,
  readAndValidateAtomicCommitBuildReceipt,
  readAndValidateChromiumProofReceipt,
  readStableOrdinaryFile,
  regenerationProvenanceReceiptBytes,
  reverseAdaptiveRuntime,
  revalidateStablePathClosure,
  runtimeSetIdentity,
  sha256,
  transformAdaptiveRuntime,
  validateChromiumProofForApply,
  validateRegenerationProvenanceForApply,
  writeChromiumProofReceipt,
  writePlanReceipt,
} from "./generate-adaptive-canvas-batch.mjs";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIRECTORY, "..");
const COURSES_ROOT = path.join(
  PROJECT_ROOT,
  "apps/web/public/flash-assets/courses",
);

let loadedProfilePromise;

function fixedProfile() {
  loadedProfilePromise ??= loadFixedV1Profile(PROJECT_ROOT);
  return loadedProfilePromise;
}

async function v1BytesForPage(animationId) {
  const loaded = await fixedProfile();
  const entry = loaded.pageRenderers.find(
    (candidate) => candidate.animationId === animationId,
  );
  assert.ok(entry, `missing fixed v1 profile entry for ${animationId}`);
  const current = await readFile(path.join(COURSES_ROOT, entry.relativePath));
  if (current.length === entry.bytes && sha256(current) === entry.sha256) {
    return {entry, bytes: current};
  }
  return {
    entry,
    bytes: reverseAdaptiveRuntime({
      outputBytes: current,
      profileEntry: entry,
      animationId,
    }),
  };
}

async function v1BytesForLoadedHost() {
  const loaded = await fixedProfile();
  const entry = loaded.loadedHostEntry;
  const current = await readFile(path.join(COURSES_ROOT, entry.relativePath));
  if (current.length === entry.bytes && sha256(current) === entry.sha256) {
    return {entry, bytes: current};
  }
  return {
    entry,
    bytes: reverseAdaptiveRuntime({
      outputBytes: current,
      profileEntry: entry,
      animationId: LOADED_HOST.metadataAnimationId,
      metadataAnimationId: LOADED_HOST.metadataAnimationId,
      registryAnimationId: LOADED_HOST.registryAnimationId,
      pageRenderer: false,
    }),
  };
}

function transformPage(entry, bytes) {
  return transformAdaptiveRuntime({
    inputBytes: bytes,
    profileEntry: entry,
    animationId: entry.animationId,
  });
}

function proofUnitFixture() {
  const generatorSha256 = "1".repeat(64);
  const testSha256 = "2".repeat(64);
  const planSha256 = "3".repeat(64);
  const planPayloadSha256 = "4".repeat(64);
  const inputSha256 = "5".repeat(64);
  const outputSha256 = "6".repeat(64);
  const rgbaSha256 = "7".repeat(64);
  const challengeSha256 = "8".repeat(64);
  const challenge = {
    algorithm: "sha256",
    inputBytes: 32,
    sha256: challengeSha256,
    runnerMode: CHROMIUM_PROOF_RUNNER_MODE,
    temporaryProofPath:
      `work/.adaptive-canvas-chromium-proof-123-${challengeSha256}.json`,
  };
  const samples = REAL_CHROMIUM_SAMPLE_DEFINITIONS.map((definition) => ({
    animationId: definition.animationId,
    registryAnimationId: definition.registryAnimationId,
    pageRenderer: definition.pageRenderer,
    request: definition.request,
    frameClass: definition.frameClass,
    inputSha256,
    outputSha256,
    k1: {
      width: 800,
      height: 600,
      originalRgbaSha256: rgbaSha256,
      adaptiveRgbaSha256: rgbaSha256,
      rgbaByteIdentical: true,
      originalState: {frame: 1, scenario: definition.request.scenario},
      adaptiveState: {frame: 1, scenario: definition.request.scenario},
      stateByteIdentical: true,
    },
    k2: {
      width: 1600,
      height: 1200,
      comparisonAlgorithm: K2_COMPARISON_ALGORITHM,
      baselineK1RgbaSha256: rgbaSha256,
      rawRgbaSha256: rgbaSha256,
      downsampledWidth: 800,
      downsampledHeight: 600,
      downsampledRgbaSha256: rgbaSha256,
      normalizedDownsampleRmse: 0,
      state: {frame: 1, scenario: definition.request.scenario},
      stateSha256: sha256(Buffer.from(canonicalJson({
        frame: 1,
        scenario: definition.request.scenario,
      }))),
      stateByteIdenticalToK1: true,
    },
  }));
  const guardBeforeDraw = {
    animationId: REAL_CHROMIUM_GUARD_DEFINITION.animationId,
    registryAnimationId: REAL_CHROMIUM_GUARD_DEFINITION.registryAnimationId,
    request: REAL_CHROMIUM_GUARD_DEFINITION.request,
    inputSha256,
    outputSha256,
    rejectedRenderScales:
      REAL_CHROMIUM_GUARD_DEFINITION.rejectedRenderScales,
    errors: REAL_CHROMIUM_GUARD_DEFINITION.expectedErrors,
    instrumentedCanvasResizeProperties: GUARDED_CANVAS_RESIZE_PROPERTIES,
    instrumentedMutating2dMethods: GUARDED_MUTATING_2D_METHODS,
    attempts: REAL_CHROMIUM_GUARD_DEFINITION.rejectedRenderScales.map(
      (renderScale, index) => ({
        renderScale,
        error: REAL_CHROMIUM_GUARD_DEFINITION.expectedErrors[index],
        afterRgbaSha256: rgbaSha256,
        rgbaUnchanged: true,
        canvasResizeCount: 0,
        contextAcquisitionCount: 0,
        mutating2dMethodCount: 0,
        mutationCount: 0,
      }),
    ),
    width: 800,
    height: 600,
    beforeRgbaSha256: rgbaSha256,
    afterRgbaSha256: rgbaSha256,
    rgbaUnchanged: true,
  };
  const runtimeRecords = [
    ...samples.map((sample) => ({
      animationId: sample.animationId,
      pageRenderer: sample.pageRenderer,
      assetPath: `courses/${sample.animationId}/canvas-renderer.js`,
      lane: "unit-source-first-lane",
      input: {bytes: 10, sha256: inputSha256},
      output: {bytes: 11, sha256: outputSha256},
    })),
    {
      animationId: guardBeforeDraw.animationId,
      pageRenderer: true,
      assetPath: `courses/${guardBeforeDraw.animationId}/canvas-renderer.js`,
      lane: "unit-source-first-lane",
      input: {bytes: 10, sha256: inputSha256},
      output: {bytes: 11, sha256: outputSha256},
    },
    ...Array.from({length: 278}, (_, index) => ({
      animationId: `unit-fixture-${String(index).padStart(3, "0")}`,
      pageRenderer: true,
      assetPath:
        `courses/unit-fixture-${String(index).padStart(3, "0")}/canvas-renderer.js`,
      lane: "unit-source-first-lane",
      input: {bytes: 10, sha256: inputSha256},
      output: {bytes: 11, sha256: outputSha256},
    })),
  ];
  const relativeFile = (filePath, digest = generatorSha256) => ({
    path: filePath,
    bytes: 100,
    sha256: digest,
  });
  const packageTree = (packagePath, digest) => ({
    path: packagePath,
    fileCount: 10,
    totalBytes: 1_000,
    checksumSetSha256: digest,
  });
  const absoluteFile = (filePath, digest) => ({
    path: filePath,
    bytes: 100,
    sha256: digest,
  });
  const identity = {
    generator: relativeFile(
      "scripts/generate-adaptive-canvas-batch.mjs",
      generatorSha256,
    ),
    test: relativeFile(
      "scripts/generate-adaptive-canvas-batch.test.mjs",
      testSha256,
    ),
    planReceipt: {
      ...relativeFile(DEFAULT_PLAN_RECEIPT_PATH, planSha256),
      payloadSha256: planPayloadSha256,
    },
    runtimeSet: runtimeSetIdentity(runtimeRecords),
    toolchain: {
      node: {
        version: "v24.18.0",
        versionsSha256: generatorSha256,
        executable: absoluteFile("/unit/node", generatorSha256),
      },
      platform: {name: "darwin", arch: "arm64", endianness: "LE"},
      os: {type: "Darwin", release: "25.0.0", version: "unit-os"},
      packageLock: relativeFile("package-lock.json", planSha256),
      playwright: {
        version: "1.61.1",
        packageJson: relativeFile(
          "node_modules/playwright/package.json",
          testSha256,
        ),
        packageTree: packageTree("node_modules/playwright", testSha256),
      },
      playwrightCore: {
        version: "1.61.1",
        packageJson: relativeFile(
          "node_modules/playwright-core/package.json",
          outputSha256,
        ),
        packageTree: packageTree(
          "node_modules/playwright-core",
          outputSha256,
        ),
      },
      browsersManifest: {
        ...relativeFile(
          "node_modules/playwright-core/browsers.json",
          rgbaSha256,
        ),
        chromiumRevision: "1228",
        chromiumBrowserVersion: "149.0.7827.55",
      },
      chromium: {
        revision: "1228",
        browserVersion: "149.0.7827.55",
        executable: absoluteFile("/unit/chromium", rgbaSha256),
        runtimeBinary: absoluteFile("/unit/chromium-runtime", rgbaSha256),
      },
    },
    runnerContract: CHROMIUM_PROOF_RUNNER_CONTRACT,
  };
  const document = chromiumProofDocument({
    challenge,
    identity,
    browser: {
      name: "chromium",
      version: "149.0.7827.55",
      executablePath: "/unit/chromium",
    },
    samples,
    guardBeforeDraw,
  });
  return {challenge, document, identity, runtimeRecords};
}

function regenerationProvenanceUnitFixture() {
  const {identity, runtimeRecords} = proofUnitFixture();
  const sourceSha256 = "a".repeat(64);
  const generatorSha256 = "b".repeat(64);
  const records = runtimeRecords.map((runtime, index) => ({
    animationId: runtime.animationId,
    pageRenderer: runtime.pageRenderer,
    assetPath: runtime.assetPath,
    lane: runtime.lane,
    input: runtime.input,
    output: runtime.output,
    provenanceClass: index === 0
      ? "canonical-advanced-manual"
      : "source-first-regeneration",
    sourceEvidence: [{
      role: index === 0
        ? "canonical-advanced-manual-evidence"
        : "canonical-swf",
      path: `source-assets/unit-provenance/${runtime.animationId}.swf`,
      bytes: 100,
      sha256: sourceSha256,
    }],
    generator: {
      path: "scripts/unit-regeneration-generator.mjs",
      bytes: 200,
      sha256: generatorSha256,
    },
  }));
  const payload = {
    status: "pass",
    authorityClass: "independent-regeneration-provenance-review",
    provenancePolicy: "source-first-or-canonical-advanced-manual-v1",
    runtimeSet: identity.runtimeSet,
    records,
  };
  const document = {
    schemaVersion: 1,
    receiptType:
      "adaptive-canvas-production-five-regeneration-provenance-v1",
    payloadSha256: sha256(Buffer.from(canonicalJson(payload))),
    payload,
  };
  return {document, identity, runtimeRecords};
}

function refreshDocumentPayloadSha256(document) {
  document.payloadSha256 = sha256(
    Buffer.from(canonicalJson(document.payload)),
  );
  return document;
}

function relativeWorkPath(absolutePath) {
  return path.relative(PROJECT_ROOT, absolutePath).split(path.sep).join("/");
}

async function temporaryWorkDirectory(prefix) {
  const workRoot = path.join(PROJECT_ROOT, "work");
  await mkdir(workRoot, {recursive: true});
  return mkdtemp(path.join(workRoot, prefix));
}

async function entryOrNull(absolutePath) {
  return lstat(absolutePath).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
}

async function physicalClosurePlanFixture(projectRoot) {
  const runtimeRecords = [];
  const outputBytesByAssetPath = new Map();
  const runtimePaths = [];
  for (let index = 0; index < 284; index += 1) {
    const suffix = String(index).padStart(3, "0");
    const animationId = `unit-physical-${suffix}`;
    const relativePath = `${animationId}/canvas-renderer.js`;
    const assetPath = `courses/${relativePath}`;
    const inputBytes = Buffer.from(`input-runtime-${suffix}`);
    const outputBytes = Buffer.from(`output-runtime-${suffix}`);
    const runtimePath = path.join(
      projectRoot,
      "apps/web/public/flash-assets/courses",
      relativePath,
    );
    await mkdir(path.dirname(runtimePath), {recursive: true});
    await writeFile(runtimePath, inputBytes, {flag: "wx"});
    runtimePaths.push(runtimePath);
    runtimeRecords.push({
      animationId,
      pageRenderer: index < 283,
      assetPath,
      relativePath,
      lane: "unit-source-first-lane",
      input: {bytes: inputBytes.length, sha256: sha256(inputBytes)},
      output: {bytes: outputBytes.length, sha256: sha256(outputBytes)},
    });
    outputBytesByAssetPath.set(assetPath, outputBytes);
  }
  return {
    plan: {
      runtimeRecords,
      outputBytesByAssetPath,
      v2ProfileBytes: Buffer.from("unit-v2-profile"),
      bindingsBytes: Buffer.from("unit-active-bindings"),
    },
    runtimePaths,
  };
}

test("fixed production-five profile remains the exact 1114-entry parent", async () => {
  const loaded = await fixedProfile();
  assert.equal(sha256(loaded.bytes), EXPECTED_V1_PROFILE_SHA256);
  assert.equal(
    computeProfileChecksumSet(loaded.profile.entries),
    EXPECTED_V1_CHECKSUM_SET_SHA256,
  );
  assert.equal(
    computeProfileChecksumSet(loaded.pageRenderers),
    EXPECTED_PAGE_RENDERER_CHECKSUM_SET_SHA256,
  );
  assert.deepEqual(loaded.profile.counts, PROFILE_COUNTS);
  assert.deepEqual(loaded.profile.approvedReleaseIds, APPROVED_RELEASE_IDS);
  assert.equal(loaded.profile.entries.length, 1114);
  assert.equal(loaded.pageRenderers.length, 283);
  assert.equal(loaded.loadedHostEntry.sha256, LOADED_HOST.inputSha256);
});

test("all four page families and the loaded host reverse exactly to v1", async () => {
  const samples = [
    "course-g04-l03-ts-006",
    "course-g04-l03-in-002",
    "course-g05-l05-ts-006",
    "course-g04-l03-in-009",
    "course-g05-l04-fq-001",
  ];
  const observedFamilies = new Set();
  for (const animationId of samples) {
    const {entry, bytes} = await v1BytesForPage(animationId);
    const generated = transformPage(entry, bytes);
    observedFamilies.add(generated.record.family);
    assert.deepEqual(generated.record.resolution, RESOLUTION);
    assert.equal(generated.record.reverseProof.byteIdenticalToV1, true);
    assert.equal(generated.record.provenance.sourceFirstRegenerationClaimed, false);
    assert.ok(reverseAdaptiveRuntime({
      outputBytes: generated.outputBytes,
      profileEntry: entry,
      animationId,
    }).equals(bytes));
  }
  assert.deepEqual([...observedFamilies].sort(), [
    "g4-l3-in009-special",
    "g5-l4-fq001-special",
    "g5-l5-private-current-js",
    "safe-ffdec-canvas-adapter",
  ]);

  const loaded = await v1BytesForLoadedHost();
  const generated = transformAdaptiveRuntime({
    inputBytes: loaded.bytes,
    profileEntry: loaded.entry,
    animationId: LOADED_HOST.metadataAnimationId,
    metadataAnimationId: LOADED_HOST.metadataAnimationId,
    registryAnimationId: LOADED_HOST.registryAnimationId,
    pageRenderer: false,
  });
  assert.equal(generated.record.family, "g4-l3-loaded-swf-host");
  assert.equal(generated.record.pageRenderer, false);
  assert.match(
    generated.outputBytes.toString("utf8"),
    /ctx\.clearRect\(0, 0, 800, 600\);/u,
  );
  assert.ok(reverseAdaptiveRuntime({
    outputBytes: generated.outputBytes,
    profileEntry: loaded.entry,
    animationId: LOADED_HOST.metadataAnimationId,
    metadataAnimationId: LOADED_HOST.metadataAnimationId,
    registryAnimationId: LOADED_HOST.registryAnimationId,
    pageRenderer: false,
  }).equals(loaded.bytes));
});

test("complex FFDec structures require the calibrated helper ABI proofs", async () => {
  const {entry, bytes} = await v1BytesForPage("course-g04-l03-in-002");
  const generated = transformPage(entry, bytes);
  const semantics = generated.record.pixelSpaceSemantics;
  assert.equal(semantics.helperAbiSha256,
    "7b41c10fd8e7ac62b94545df0375fe44fad1a5a1246e01c442814b12450647b1");
  assert.equal(semantics.offscreenContextTransformCount, 490);
  assert.equal(semantics.sourceStrokeResetSiteCount, 176);
  assert.equal(semantics.actualFilterPlacementCount, 0);
  assert.equal(semantics.proofs.enhancedContextMatrixTracksRootScale, true);
  assert.equal(
    semantics.proofs.strokeResetTransformsPointsAndLineWidthBeforeIdentityDraw,
    true,
  );
  assert.equal(
    semantics.proofs.maskBackingUsesCurrentBackingAndRestoresTrackedMatrix,
    true,
  );
  assert.equal(
    semantics.proofs.blendBackingUsesCurrentBackingAndCopiesTrackedMatrix,
    true,
  );

  const mutated = Buffer.from(
    bytes.toString("utf8").replace(
      "this._matrix = [a, b, c, d, e, f];",
      "this._matrix = [1, 0, 0, 1, 0, 0];",
    ),
  );
  await assert.rejects(
    async () => transformAdaptiveRuntime({
      inputBytes: mutated,
      profileEntry: {...entry, bytes: mutated.length, sha256: sha256(mutated)},
      animationId: entry.animationId,
    }),
    /helper ABI drift/u,
  );
});

test("bitmap-bound classification decodes complete payloads and excludes guards", async () => {
  const clean = await v1BytesForPage("course-g04-l03-ts-006");
  const cleanGenerated = transformPage(clean.entry, clean.bytes);
  assert.equal(cleanGenerated.record.sourceBitmapResolutionBound, false);
  assert.equal(cleanGenerated.record.embeddedBitmaps.occurrenceCount, 0);
  assert.equal(
    clean.bytes.toString("utf8").includes('indexOf("data:image/")'),
    true,
  );

  const bitmap = await v1BytesForPage("course-g05-l03-vb-010");
  const bitmapGenerated = transformPage(bitmap.entry, bitmap.bytes);
  assert.equal(bitmapGenerated.record.sourceBitmapResolutionBound, true);
  assert.equal(bitmapGenerated.record.embeddedBitmaps.occurrenceCount, 1);
  assert.equal(bitmapGenerated.record.embeddedBitmaps.bytesUnchanged, true);
});

test("generated TypeScript exposes immutable page and loaded-host lookups", async () => {
  const page = await v1BytesForPage("course-g04-l03-ts-006");
  const pageRecord = transformPage(page.entry, page.bytes).record;
  const loaded = await v1BytesForLoadedHost();
  const loadedRecord = transformAdaptiveRuntime({
    inputBytes: loaded.bytes,
    profileEntry: loaded.entry,
    animationId: LOADED_HOST.metadataAnimationId,
    metadataAnimationId: LOADED_HOST.metadataAnimationId,
    registryAnimationId: LOADED_HOST.registryAnimationId,
    pageRenderer: false,
  }).record;
  const filler = Array.from({length: 282}, (_, index) => ({
    ...pageRecord,
    animationId: `fixture-${String(index).padStart(3, "0")}`,
    assetPath: `courses/fixture-${String(index).padStart(3, "0")}/canvas-renderer.js`,
  }));
  const source = generatedBindingsBytes([
    pageRecord,
    loadedRecord,
    ...filler,
  ]).toString("utf8");
  assert.match(source, /export interface AdaptiveCanvasProductionBinding/u);
  assert.match(source, /getAdaptiveCanvasProductionBinding/u);
  assert.match(source, /getAdaptiveLoadedSwfHostProductionBinding/u);
  assert.match(source, /Readonly<Record<string, AdaptiveCanvasProductionBinding>>/u);
  assert.match(source, /Object\.freeze\(\[1, 2\] as const\)/u);
  assert.match(source, /pageRenderer: false/u);
  const inactive = inactiveV1BindingsBytes().toString("utf8");
  assert.match(inactive, /No adaptive production profile is active/u);
  assert.match(inactive, /return null;/u);
  assert.match(inactive, /readonly assetSha256: string;/u);
  assert.doesNotMatch(
    inactive,
    /const ADAPTIVE_CANVAS_PRODUCTION_BINDINGS/u,
  );
  assert.doesNotMatch(inactive, /\b[a-f0-9]{64}\b/u);
  assert.doesNotMatch(inactive, /^\s*"[^"]+": Object\.freeze\(\{/mu);
});

test("CLI parser keeps plan, apply, and check mutually exclusive", () => {
  assert.deepEqual(parseArguments([]), {
    mode: "plan",
    receiptPath: "work/adaptive-canvas-production-five.plan.v10.json",
    proofReceiptPath:
      "work/adaptive-canvas-production-five.chromium-proof.v2.json",
    transactionId: null,
    help: false,
  });
  assert.deepEqual(parseArguments(["--plan"]), {
    mode: "plan",
    receiptPath: "work/adaptive-canvas-production-five.plan.v10.json",
    proofReceiptPath:
      "work/adaptive-canvas-production-five.chromium-proof.v2.json",
    transactionId: null,
    help: false,
  });
  assert.deepEqual(
    parseArguments([
      "--check",
      "--receipt",
      "work/receipt.json",
      "--proof-receipt=work/proof.json",
    ]),
    {
      mode: "check",
      receiptPath: "work/receipt.json",
      proofReceiptPath: "work/proof.json",
      transactionId: null,
      help: false,
    },
  );
  assert.deepEqual(parseArguments(["--bootstrap-bindings"]), {
    mode: "bootstrap-bindings",
    receiptPath: "work/adaptive-canvas-production-five.plan.v10.json",
    proofReceiptPath:
      "work/adaptive-canvas-production-five.chromium-proof.v2.json",
    transactionId: null,
    help: false,
  });
  assert.throws(
    () => parseArguments(["--plan", "--apply"]),
    /choose exactly one/u,
  );
  assert.deepEqual(
    parseArguments([
      "--recover-forward",
      `--transaction=${"a".repeat(64)}`,
    ]),
    {
      mode: "recover-forward",
      receiptPath: "work/adaptive-canvas-production-five.plan.v10.json",
      proofReceiptPath:
        "work/adaptive-canvas-production-five.chromium-proof.v2.json",
      transactionId: "a".repeat(64),
      help: false,
    },
  );
  assert.throws(
    () => parseArguments(["--recover-rollback"]),
    /requires --transaction/u,
  );
  assert.throws(
    () => parseArguments(["--plan", `--transaction=${"a".repeat(64)}`]),
    /only valid with a recovery mode/u,
  );
  assert.throws(
    () => parseArguments(["--recover-forward", `--transaction=${"A".repeat(64)}`]),
    /lowercase 64-character SHA-256/u,
  );
});

test("plan receipts cannot create arbitrary project paths", async () => {
  const payload = {status: "pass", operation: "unit-plan-path-policy"};
  const document = {
    schemaVersion: 1,
    receiptType: "adaptive-canvas-production-five-batch-plan",
    payloadSha256: sha256(Buffer.from(canonicalJson(payload))),
    payload,
  };
  const unsafePath = `apps/web/config/unit-plan-${process.pid}.json`;
  const absoluteUnsafePath = path.join(PROJECT_ROOT, unsafePath);
  assert.equal(await entryOrNull(absoluteUnsafePath), null);
  await assert.rejects(
    writePlanReceipt({
      document,
      receiptPath: unsafePath,
      projectRoot: PROJECT_ROOT,
    }),
    (error) => {
      assert.equal(error.code, "UNSAFE_PATH");
      return true;
    },
  );
  assert.equal(await entryOrNull(absoluteUnsafePath), null);
});

test("Chromium proof schema fails closed when a required result is absent", () => {
  const {document} = proofUnitFixture();
  assert.ok(chromiumProofReceiptBytes(document).length > 0);
  const incomplete = structuredClone(document);
  delete incomplete.payload.samples[0].k2.normalizedDownsampleRmse;
  incomplete.payloadSha256 = sha256(Buffer.from(canonicalJson(incomplete.payload)));
  assert.throws(
    () => chromiumProofReceiptBytes(incomplete),
    /k2 keys are not exact/u,
  );
});

test("Chromium proof reader fails closed when the proof receipt is missing", async () => {
  await assert.rejects(
    readAndValidateChromiumProofReceipt({
      projectRoot: PROJECT_ROOT,
      proofReceiptPath:
        `work/missing-real-chromium-proof-${process.pid}.json`,
    }),
    /file is missing/u,
  );
});

test("Chromium proof validator rejects stale generator/test/plan bindings", () => {
  const {challenge, document, identity, runtimeRecords} = proofUnitFixture();
  assert.equal(validateChromiumProofForApply({
    document,
    expectedChallenge: challenge,
    expectedIdentity: identity,
    runtimeRecords,
  }), true);
  for (const [field, expectedMessage] of [
    ["generator", /stale for the current generator/u],
    ["test", /stale for the current test/u],
    ["planReceipt", /stale for the selected plan receipt/u],
  ]) {
    const staleIdentity = structuredClone(identity);
    staleIdentity[field].sha256 = "8".repeat(64);
    assert.throws(
      () => validateChromiumProofForApply({
        document,
        expectedChallenge: challenge,
        expectedIdentity: staleIdentity,
        runtimeRecords,
      }),
      expectedMessage,
    );
  }
});

test("pre-existing ordinary or symlink proof receipts never authorize apply", async () => {
  await assert.rejects(
    assertFreshChromiumProofPublicationTarget({
      projectRoot: PROJECT_ROOT,
      proofReceiptPath: "apps/web/config/unsafe-proof.json",
    }),
    /must stay under work\//u,
  );
  const temporaryRoot = await temporaryWorkDirectory(
    "adaptive-proof-publication-negative-",
  );
  try {
    const {document} = proofUnitFixture();
    const existingPath = path.join(temporaryRoot, "self-consistent-proof.json");
    await writeFile(existingPath, chromiumProofReceiptBytes(document), {
      flag: "wx",
    });
    await assert.rejects(
      assertFreshChromiumProofPublicationTarget({
        projectRoot: PROJECT_ROOT,
        proofReceiptPath: relativeWorkPath(existingPath),
      }),
      /pre-existing proof can never authorize apply/u,
    );

    const symlinkPath = path.join(temporaryRoot, "proof-link.json");
    await symlink(existingPath, symlinkPath);
    await assert.rejects(
      assertFreshChromiumProofPublicationTarget({
        projectRoot: PROJECT_ROOT,
        proofReceiptPath: relativeWorkPath(symlinkPath),
      }),
      /pre-existing proof can never authorize apply/u,
    );
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("Chromium proof reader rejects valid-looking noncanonical JSON bytes", async () => {
  const temporaryRoot = await temporaryWorkDirectory(
    "adaptive-proof-noncanonical-negative-",
  );
  try {
    const {document} = proofUnitFixture();
    const receiptPath = path.join(temporaryRoot, "noncanonical-proof.json");
    await writeFile(receiptPath, Buffer.from(JSON.stringify(document)), {
      flag: "wx",
    });
    await assert.rejects(
      readAndValidateChromiumProofReceipt({
        projectRoot: PROJECT_ROOT,
        proofReceiptPath: relativeWorkPath(receiptPath),
      }),
      /JSON bytes are not canonical/u,
    );
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("Chromium proof validator rejects a forged apply challenge", () => {
  const {challenge, document, identity, runtimeRecords} = proofUnitFixture();
  const forgedChallenge = {
    ...challenge,
    sha256: "9".repeat(64),
  };
  assert.throws(
    () => validateChromiumProofForApply({
      document,
      expectedChallenge: forgedChallenge,
      expectedIdentity: identity,
      runtimeRecords,
    }),
    /challenge does not match this apply invocation/u,
  );
});

test("proof schema derives static-frame threshold and rejects k2/state/mutation claims", () => {
  const mutations = [
    {
      label: "receipt-authored threshold",
      mutate(document) {
        document.payload.samples[0].k2.maximumAllowedRmse = 1;
      },
      error: /k2 keys are not exact/u,
    },
    {
      label: "static frame RMSE above 0.05",
      mutate(document) {
        document.payload.samples[0].k2.normalizedDownsampleRmse = 0.050_001;
      },
      error: /k2 backing\/RGBA\/state\/RMSE proof is incomplete/u,
    },
    {
      label: "k2 state differs from k1 and v1",
      mutate(document) {
        const state = {frame: 2, scenario: "source-static-frame"};
        document.payload.samples[0].k2.state = state;
        document.payload.samples[0].k2.stateSha256 = sha256(
          Buffer.from(canonicalJson(state)),
        );
      },
      error: /k2 backing\/RGBA\/state\/RMSE proof is incomplete/u,
    },
    {
      label: "invalid request reaches a mutating 2D method",
      mutate(document) {
        document.payload.guardBeforeDraw.attempts[0].mutating2dMethodCount = 1;
        document.payload.guardBeforeDraw.attempts[0].mutationCount = 1;
      },
      error: /did not reject before drawing/u,
    },
  ];
  for (const mutation of mutations) {
    const {document} = proofUnitFixture();
    mutation.mutate(document);
    refreshDocumentPayloadSha256(document);
    assert.throws(
      () => chromiumProofReceiptBytes(document),
      mutation.error,
      mutation.label,
    );
  }
  assert.equal(maximumRmseForFrameClass("static-frame-1"), 0.05);
  assert.throws(
    () => maximumRmseForFrameClass("receipt-selected-threshold"),
    /unsupported Chromium proof frameClass/u,
  );
});

test("immutable regeneration provenance schema binds all 284 plan records and lanes", () => {
  const {document, runtimeRecords} =
    regenerationProvenanceUnitFixture();
  assert.ok(regenerationProvenanceReceiptBytes(document).length > 0);
  assert.equal(validateRegenerationProvenanceForApply({
    document,
    runtimeRecords,
  }), true);

  const staleLane = structuredClone(document);
  staleLane.payload.records[0].lane = "receipt-selected-other-lane";
  refreshDocumentPayloadSha256(staleLane);
  assert.throws(
    () => validateRegenerationProvenanceForApply({
      document: staleLane,
      runtimeRecords,
    }),
    /does not exactly bind the plan record\/lane/u,
  );

  const unsupportedManual = structuredClone(document);
  unsupportedManual.payload.records[0].sourceEvidence[0].role =
    "canonical-swf";
  refreshDocumentPayloadSha256(unsupportedManual);
  assert.throws(
    () => regenerationProvenanceReceiptBytes(unsupportedManual),
    /advanced-manual provenance lacks its canonical evidence/u,
  );
});

test("apply rejects a zero-target plan before proof, staging, or output writes", async () => {
  const temporaryRoot = await temporaryWorkDirectory(
    "adaptive-zero-target-apply-negative-",
  );
  const stagePath = path.join(
    PROJECT_ROOT,
    "work",
    `.adaptive-canvas-batch-stage-${process.pid}`,
  );
  const v2ProfilePath = path.join(
    PROJECT_ROOT,
    "apps/web/config/current-js-production-assets.v2.json",
  );
  const bindingPath = path.join(
    PROJECT_ROOT,
    "packages/demos/src/adaptive-canvas-production-bindings.generated.ts",
  );
  const representativeRuntimePath = path.join(
    COURSES_ROOT,
    "course-g04-l03-ts-006/canvas-renderer.js",
  );
  assert.equal(await entryOrNull(stagePath), null);
  assert.equal(await entryOrNull(v2ProfilePath), null);
  const bindingBefore = await readFile(bindingPath);
  const runtimeBefore = await readFile(representativeRuntimePath);
  try {
    const payload = {status: "pass", operation: "unit-zero-target"};
    const document = {
      schemaVersion: 1,
      receiptType: "adaptive-canvas-production-five-batch-plan",
      payloadSha256: sha256(Buffer.from(canonicalJson(payload))),
      payload,
    };
    const receiptPath = path.join(temporaryRoot, "zero-target-plan.json");
    const proofPath = path.join(temporaryRoot, "must-not-exist-proof.json");
    await writeFile(receiptPath, planReceiptBytes(document), {flag: "wx"});
    await assert.rejects(
      applyAdaptiveCanvasBatch({
        projectRoot: PROJECT_ROOT,
        receiptPath: relativeWorkPath(receiptPath),
        proofReceiptPath: relativeWorkPath(proofPath),
        plan: {
          document,
          runtimeRecords: [],
          outputBytesByAssetPath: new Map(),
          v2ProfileBytes: Buffer.alloc(0),
          bindingsBytes: Buffer.alloc(0),
        },
      }),
      /must contain exactly 284 records/u,
    );
    assert.equal(await entryOrNull(proofPath), null);
    assert.equal(await entryOrNull(stagePath), null);
    assert.equal(await entryOrNull(v2ProfilePath), null);
    assert.deepEqual(await readFile(bindingPath), bindingBefore);
    assert.deepEqual(await readFile(representativeRuntimePath), runtimeBefore);
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("code-approved provenance SHA validates the immutable 284-record receipt", async () => {
  assert.equal(
    APPROVED_REGENERATION_PROVENANCE_RECEIPT_SHA256,
    "d901badb154a562b97f102edb0a1ffd23fee67628254d8235a8814fcaac0ce8a",
  );
  assert.equal(
    REGENERATION_PROVENANCE_RECEIPT_PATH,
    "work/adaptive-canvas-production-five.regeneration-provenance.v1.json",
  );
  const planDocument = JSON.parse(
    await readFile(path.join(PROJECT_ROOT, DEFAULT_PLAN_RECEIPT_PATH), "utf8"),
  );
  assert.equal(planDocument.payload.runtimes.length, 284);
  const approved = await readAndValidateRegenerationProvenanceReceipt({
    projectRoot: PROJECT_ROOT,
    runtimeRecords: planDocument.payload.runtimes,
  });
  assert.equal(
    sha256(approved.bytes),
    APPROVED_REGENERATION_PROVENANCE_RECEIPT_SHA256,
  );
  assert.equal(approved.document.payload.records.length, 284);
  assert.equal(approved.document.payload.runtimeSet.pageRendererCount, 283);
  assert.equal(approved.document.payload.runtimeSet.loadedHostCount, 1);
  assert.equal(approved.verifiedFileIdentities.length, 10);
});

test("reviewed native atomic capability attests without browser, staging, or output writes", async () => {
  assert.equal(
    APPROVED_ATOMIC_COMMIT_HELPER_SHA256,
    "2a20fe5becfe94788b8cf1809b5cddff6428a4cdab00697d767db31721ebc472",
  );
  assert.equal(
    APPROVED_ATOMIC_COMMIT_BUILD_RECEIPT_SHA256,
    "d6836dbeea6b029e572b2286b39bf5b68f24d8e08904b7b523e2968dbcc0eda5",
  );
  assert.equal(
    ATOMIC_COMMIT_BUILD_RECEIPT_PATH,
    "work/adaptive-canvas-atomic-commit-build.v2.json",
  );
  assert.equal(ATOMIC_COMMIT_DRIVER_IMPLEMENTED, true);
  const temporaryRoot = await temporaryWorkDirectory(
    "adaptive-atomic-capability-negative-",
  );
  const untouchedPath = path.join(temporaryRoot, "untouched.txt");
  const untouchedBytes = Buffer.from("must-remain-unchanged");
  await writeFile(untouchedPath, untouchedBytes, {flag: "wx"});
  try {
    const approved = await assertAtomicCommitCapabilityApproved({
      projectRoot: PROJECT_ROOT,
    });
    const buildReceipt = await readAndValidateAtomicCommitBuildReceipt({
      projectRoot: PROJECT_ROOT,
    });
    assert.deepEqual(approved.capability, REQUIRED_ATOMIC_COMMIT_CAPABILITY);
    assert.equal(
      approved.helperIdentity.sha256,
      APPROVED_ATOMIC_COMMIT_HELPER_SHA256,
    );
    assert.equal(approved.nativeReceipt.production, true);
    assert.equal(approved.nativeReceipt.expectedEntryCount, 286);
    assert.equal(
      approved.buildReceiptIdentity.sha256,
      APPROVED_ATOMIC_COMMIT_BUILD_RECEIPT_SHA256,
    );
    assert.equal(buildReceipt.document.payload.protocol, approved.nativeReceipt.protocol);
    assert.equal(
      approved.nativeReceipt.staticContractSha256,
      REQUIRED_ATOMIC_COMMIT_CAPABILITY.staticContractSha256,
    );
    assert.deepEqual(await readFile(untouchedPath), untouchedBytes);
    assert.equal(
      await entryOrNull(path.join(
        PROJECT_ROOT,
        "work",
        `.adaptive-canvas-batch-stage-${process.pid}`,
      )),
      null,
    );
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("native build receipt rejects drift in any reviewed source input", async () => {
  const temporaryRoot = await temporaryWorkDirectory(
    "adaptive-atomic-build-receipt-negative-",
  );
  try {
    const receiptBytes = await readFile(path.join(
      PROJECT_ROOT,
      ATOMIC_COMMIT_BUILD_RECEIPT_PATH,
    ));
    const receipt = JSON.parse(receiptBytes.toString("utf8"));
    const descriptors = [
      receipt.payload.source,
      receipt.payload.driver,
      receipt.payload.nativeTest,
      receipt.payload.buildScript,
      receipt.payload.predecessorPlan,
    ];
    for (const descriptor of descriptors) {
      const target = path.join(temporaryRoot, descriptor.path);
      await mkdir(path.dirname(target), {recursive: true});
      await writeFile(target, await readFile(path.join(PROJECT_ROOT, descriptor.path)), {
        flag: "wx",
      });
    }
    const receiptTarget = path.join(
      temporaryRoot,
      ATOMIC_COMMIT_BUILD_RECEIPT_PATH,
    );
    await mkdir(path.dirname(receiptTarget), {recursive: true});
    await writeFile(receiptTarget, receiptBytes, {flag: "wx"});
    const accepted = await readAndValidateAtomicCommitBuildReceipt({
      projectRoot: temporaryRoot,
    });
    assert.equal(
      accepted.fileIdentity.sha256,
      APPROVED_ATOMIC_COMMIT_BUILD_RECEIPT_SHA256,
    );
    const driftTarget = path.join(temporaryRoot, receipt.payload.driver.path);
    await writeFile(
      driftTarget,
      Buffer.concat([await readFile(driftTarget), Buffer.from("\n")]),
    );
    await assert.rejects(
      readAndValidateAtomicCommitBuildReceipt({projectRoot: temporaryRoot}),
      (error) => error.code === "UNAPPROVED_ATOMIC_COMMIT_CAPABILITY" &&
        /reviewed input drifted/u.test(error.message),
    );
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("stable ordinary reads reject symlinks and detect same-byte inode replacement", async () => {
  const temporaryRoot = await temporaryWorkDirectory(
    "adaptive-stable-read-negative-",
  );
  try {
    const ordinaryPath = path.join(temporaryRoot, "ordinary.bin");
    const symlinkPath = path.join(temporaryRoot, "ordinary-link.bin");
    const absentPath = path.join(temporaryRoot, "must-stay-absent.bin");
    const replacementPath = path.join(temporaryRoot, "replacement.bin");
    const bytes = Buffer.from("stable-ordinary-file");
    await writeFile(ordinaryPath, bytes, {flag: "wx"});
    await symlink(ordinaryPath, symlinkPath);

    const stable = await readStableOrdinaryFile(
      ordinaryPath,
      "unit ordinary file",
    );
    assert.deepEqual(stable.bytes, bytes);
    assert.deepEqual(Object.keys(stable.identity).sort(), [
      "ctimeNs",
      "dev",
      "gid",
      "ino",
      "mode",
      "mtimeNs",
      "nlink",
      "sha256",
      "size",
      "uid",
    ]);
    assert.equal(stable.identity.sha256, sha256(bytes));
    await assert.rejects(
      readStableOrdinaryFile(symlinkPath, "unit symlink"),
      (error) => {
        assert.equal(error.code, "UNSAFE_FILE_TYPE");
        return true;
      },
    );

    const closure = await captureStablePathClosure({
      label: "unit stable-read closure",
      present: [{
        label: "unit ordinary file",
        absolutePath: ordinaryPath,
        bytes: bytes.length,
        sha256: sha256(bytes),
      }],
      absent: [{label: "unit absent file", absolutePath: absentPath}],
    });
    await writeFile(replacementPath, bytes, {flag: "wx"});
    await rename(replacementPath, ordinaryPath);
    await assert.rejects(
      revalidateStablePathClosure(closure),
      (error) => {
        assert.equal(error.code, "PHYSICAL_COMMIT_PRECONDITION_CHANGED");
        return true;
      },
    );
    assert.deepEqual(await readFile(ordinaryPath), bytes);
    assert.equal(await entryOrNull(absentPath), null);
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("full 284-runtime precommit and 286-target postcommit closures fail on any drift", async () => {
  const temporaryRoot = await temporaryWorkDirectory(
    "adaptive-full-physical-closure-negative-",
  );
  try {
    const {plan, runtimePaths} = await physicalClosurePlanFixture(
      temporaryRoot,
    );
    const bindingPath = path.join(
      temporaryRoot,
      "packages/demos/src/adaptive-canvas-production-bindings.generated.ts",
    );
    await mkdir(path.dirname(bindingPath), {recursive: true});
    await writeFile(bindingPath, inactiveV1BindingsBytes(), {flag: "wx"});
    const precommit = await captureProductionPrecommitClosure({
      projectRoot: temporaryRoot,
      plan,
    });
    assert.equal(precommit.present.length, 285);
    assert.equal(precommit.absent.length, 1);
    assert.equal(
      precommit.present.filter(({label}) => label.startsWith("courses/"))
        .length,
      284,
    );

    for (const [index, expected] of precommit.present.entries()) {
      const sameBytes = await readFile(expected.absolutePath);
      const replacementPath = path.join(
        temporaryRoot,
        `.precommit-same-byte-replacement-${String(index).padStart(3, "0")}`,
      );
      await writeFile(replacementPath, sameBytes, {flag: "wx"});
      await rename(replacementPath, expected.absolutePath);
      await assert.rejects(
        revalidateStablePathClosure({
          ...precommit,
          present: [expected],
          absent: [],
        }),
        (error) => {
          assert.equal(error.code, "PHYSICAL_COMMIT_PRECONDITION_CHANGED");
          return true;
        },
        `precommit target ${index} accepted a same-byte inode replacement`,
      );
      assert.equal(sha256(await readFile(expected.absolutePath)), expected.sha256);
    }
    for (const [index, expected] of precommit.absent.entries()) {
      const concurrentBytes = Buffer.from(`concurrent-absent-target-${index}`);
      await mkdir(path.dirname(expected.absolutePath), {recursive: true});
      await writeFile(expected.absolutePath, concurrentBytes, {flag: "wx"});
      await assert.rejects(
        revalidateStablePathClosure({
          ...precommit,
          present: [],
          absent: [expected],
        }),
        (error) => {
          assert.equal(error.code, "PHYSICAL_COMMIT_PRECONDITION_CHANGED");
          return true;
        },
        `precommit absent target ${index} accepted concurrent creation`,
      );
    }

    for (const [index, runtimePath] of runtimePaths.entries()) {
      const output = plan.outputBytesByAssetPath.get(
        plan.runtimeRecords[index].assetPath,
      );
      await writeFile(runtimePath, output);
    }
    const profilePath = path.join(
      temporaryRoot,
      "apps/web/config/current-js-production-assets.v2.json",
    );
    await mkdir(path.dirname(profilePath), {recursive: true});
    await writeFile(profilePath, plan.v2ProfileBytes);
    await writeFile(bindingPath, plan.bindingsBytes);

    const postcommit = await captureProductionOutputClosure({
      projectRoot: temporaryRoot,
      plan,
    });
    assert.equal(postcommit.present.length, 286);
    assert.equal(postcommit.absent.length, 0);
    for (const [index, expected] of postcommit.present.entries()) {
      const foreignBytes = Buffer.from(
        `concurrent-postcommit-target-${String(index).padStart(3, "0")}`,
      );
      await writeFile(expected.absolutePath, foreignBytes);
      await assert.rejects(
        revalidateStablePathClosure({
          ...postcommit,
          present: [expected],
        }),
        (error) => {
          assert.equal(error.code, "PHYSICAL_COMMIT_PRECONDITION_CHANGED");
          return true;
        },
        `postcommit target ${index} accepted concurrent drift`,
      );
      assert.deepEqual(await readFile(expected.absolutePath), foreignBytes);
    }
    assert.equal(postcommit.present.length, 284 + 2);
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("FFDec pixel-space VM fixture keeps k1 RGBA and scales offscreen mask/stroke at k2", () => {
  const fixtureSource = String.raw`
    function canvas(width, height) {
      return {width, height, pixels: new Uint8Array(width * height * 4)};
    }
    function context(target) {
      return {
        target,
        _matrix: [1, 0, 0, 1, 0, 0],
        setTransform(a, b, c, d, e, f) { this._matrix = [a,b,c,d,e,f]; },
        applyTransforms(matrix) { this.setTransform(...matrix); },
        applyTransformToPoint(point) {
          return {
            x: this._matrix[0] * point.x + this._matrix[2] * point.y + this._matrix[4],
            y: this._matrix[1] * point.x + this._matrix[3] * point.y + this._matrix[5],
          };
        },
        fillAuthored(x, y, width, height, rgba) {
          const left = Math.round(this._matrix[0] * x + this._matrix[4]);
          const top = Math.round(this._matrix[3] * y + this._matrix[5]);
          const right = Math.round(this._matrix[0] * (x + width) + this._matrix[4]);
          const bottom = Math.round(this._matrix[3] * (y + height) + this._matrix[5]);
          for (let py = top; py < bottom; py += 1) for (let px = left; px < right; px += 1) {
            const offset = (py * this.target.width + px) * 4;
            this.target.pixels.set(rgba, offset);
          }
        },
      };
    }
    function render(k, adaptive) {
      if (adaptive && k !== 1 && k !== 2) throw new Error("renderScale must be exactly 1 or 2");
      const target = canvas(4 * k, 4 * k);
      const root = context(target);
      root.setTransform(adaptive ? k : 1, 0, 0, adaptive ? k : 1, 0, 0);
      root.fillAuthored(0, 0, adaptive ? 4 : target.width, adaptive ? 4 : target.height, [8,16,24,255]);

      // FFDec mask/offscreen invariant: backing follows canvas.width/height and
      // the enhanced context copies the root _matrix, including k.
      const offscreen = canvas(target.width, target.height);
      const offscreenContext = context(offscreen);
      offscreenContext.applyTransforms(root._matrix);
      offscreenContext.fillAuthored(1, 1, 2, 2, [200,80,40,255]);

      // FFDec stroke-reset invariant: points are transformed through _matrix
      // before the temporary physical-pixel identity draw.
      const strokeStart = offscreenContext.applyTransformToPoint({x: 1, y: 2});
      const strokeEnd = offscreenContext.applyTransformToPoint({x: 3, y: 2});
      for (let line = 0; line < k; line += 1) for (let x = strokeStart.x; x < strokeEnd.x; x += 1) {
        const offset = ((strokeStart.y + line) * offscreen.width + x) * 4;
        offscreen.pixels.set([255,255,255,255], offset);
      }
      target.pixels.set(offscreen.pixels.map((value, index) =>
        value === 0 ? target.pixels[index] : value
      ));
      return target;
    }
    globalThis.result = {v1: render(1, false), k1: render(1, true), k2: render(2, true)};
  `;
  const sandbox = {Uint8Array};
  vm.runInNewContext(fixtureSource, sandbox, {timeout: 5_000});
  const {v1, k1, k2} = sandbox.result;
  assert.deepEqual(Buffer.from(k1.pixels), Buffer.from(v1.pixels));
  assert.equal(k2.width, 8);
  assert.equal(k2.height, 8);
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 4; x += 1) {
      const k1Offset = (y * 4 + x) * 4;
      const expected = Buffer.from(k1.pixels.subarray(k1Offset, k1Offset + 4));
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const k2Offset = (((y * 2 + dy) * 8) + x * 2 + dx) * 4;
        assert.deepEqual(
          Buffer.from(k2.pixels.subarray(k2Offset, k2Offset + 4)),
          expected,
        );
      }
    }
  }
});

async function browserRender(page, source, registryAnimationId, request, width, height) {
  await page.setContent(`<canvas id="stage" width="${width}" height="${height}"></canvas>`);
  await page.addScriptTag({content: source});
  return page.evaluate(async ({registryAnimationId, request}) => {
    const asset = globalThis.HELP_MATH_CANVAS_ASSETS[registryAnimationId];
    if (!asset) throw new Error(`missing registry asset ${registryAnimationId}`);
    await asset.ready();
    const canvas = document.querySelector("#stage");
    const state = asset.render(canvas, request);
    const bytes = canvas.getContext("2d").getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    ).data;
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return {
      digest: [...new Uint8Array(digest)].map((value) =>
        value.toString(16).padStart(2, "0")
      ).join(""),
      width: canvas.width,
      height: canvas.height,
      state: JSON.parse(JSON.stringify(state)),
    };
  }, {registryAnimationId, request});
}

async function browserScaleComparison(
  page,
  source,
  registryAnimationId,
  request,
) {
  await page.setContent(
    '<canvas id="k1" width="800" height="600"></canvas>' +
      '<canvas id="k2" width="1600" height="1200"></canvas>',
  );
  await page.addScriptTag({content: source});
  return page.evaluate(async ({registryAnimationId, request}) => {
    const asset = globalThis.HELP_MATH_CANVAS_ASSETS[registryAnimationId];
    await asset.ready();
    const k1 = document.querySelector("#k1");
    const k2 = document.querySelector("#k2");
    const k1State = asset.render(k1, {...request, renderScale: 1});
    const k2State = asset.render(k2, {...request, renderScale: 2});
    const baseline = k1.getContext("2d").getImageData(0, 0, 800, 600).data;
    const scaled = k2.getContext("2d").getImageData(0, 0, 1600, 1200).data;
    const downsampledRgba = new Uint8ClampedArray(800 * 600 * 4);
    let squaredError = 0;
    for (let y = 0; y < 600; y += 1) {
      for (let x = 0; x < 800; x += 1) {
        const sourceOffsets = [
          ((y * 2) * 1600 + x * 2) * 4,
          ((y * 2) * 1600 + x * 2 + 1) * 4,
          (((y * 2) + 1) * 1600 + x * 2) * 4,
          (((y * 2) + 1) * 1600 + x * 2 + 1) * 4,
        ];
        const alphaSum = sourceOffsets.reduce(
          (sum, offset) => sum + scaled[offset + 3],
          0,
        );
        const baselineOffset = (y * 800 + x) * 4;
        for (let channel = 0; channel < 3; channel += 1) {
          const channelValue = alphaSum === 0
            ? 0
            : Math.floor((sourceOffsets.reduce(
                (sum, offset) =>
                  sum + scaled[offset + channel] * scaled[offset + 3],
                0,
              ) + Math.floor(alphaSum / 2)) / alphaSum);
          const delta = baseline[baselineOffset + channel] - channelValue;
          downsampledRgba[baselineOffset + channel] = channelValue;
          squaredError += delta * delta;
        }
        const downsampledAlpha = Math.floor((alphaSum + 2) / 4);
        downsampledRgba[baselineOffset + 3] = downsampledAlpha;
        const alphaDelta = baseline[baselineOffset + 3] - downsampledAlpha;
        squaredError += alphaDelta * alphaDelta;
      }
    }
    const digest = async (values) => {
      const result = await crypto.subtle.digest("SHA-256", values);
      return [...new Uint8Array(result)].map((value) =>
        value.toString(16).padStart(2, "0")
      ).join("");
    };
    return {
      width: k2.width,
      height: k2.height,
      baselineK1RgbaSha256: await digest(baseline),
      rawRgbaSha256: await digest(scaled),
      downsampledWidth: 800,
      downsampledHeight: 600,
      downsampledRgbaSha256: await digest(downsampledRgba),
      normalizedDownsampleRmse:
        Math.sqrt(squaredError / (800 * 600 * 4)) / 255,
      k1State: JSON.parse(JSON.stringify(k1State)),
      k2State: JSON.parse(JSON.stringify(k2State)),
    };
  }, {registryAnimationId, request});
}

async function readExactChromiumRunnerEnvelope() {
  const chunks = [];
  let byteLength = 0;
  for await (const chunk of process.stdin) {
    const bytes = Buffer.from(chunk);
    byteLength += bytes.length;
    assert.ok(byteLength <= 16_384, "Chromium runner envelope is too large");
    chunks.push(bytes);
  }
  const bytes = Buffer.concat(chunks);
  let envelope;
  try {
    envelope = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    assert.fail(`Chromium runner envelope is invalid JSON: ${error.message}`);
  }
  assert.ok(envelope && typeof envelope === "object" && !Array.isArray(envelope));
  assert.deepEqual(Object.keys(envelope).sort(), [
    "challengeBase64",
    "chromiumExecutablePath",
    "planReceiptPath",
    "proofOutputPath",
    "protocol",
  ]);
  assert.deepEqual(
    bytes,
    Buffer.from(`${canonicalJson(envelope)}\n`),
    "Chromium runner envelope must use exact canonical JSON bytes",
  );
  assert.equal(envelope.protocol, CHROMIUM_PROOF_RUNNER_MODE);
  assert.equal(typeof envelope.challengeBase64, "string");
  const challengeBytes = Buffer.from(envelope.challengeBase64, "base64");
  assert.equal(challengeBytes.length, 32);
  assert.equal(challengeBytes.toString("base64"), envelope.challengeBase64);
  for (const field of [
    "planReceiptPath",
    "proofOutputPath",
    "chromiumExecutablePath",
  ]) {
    assert.equal(typeof envelope[field], "string");
    assert.ok(envelope[field].length > 0);
    assert.ok(!envelope[field].includes("\0"));
  }
  return {...envelope, challengeBytes};
}

const REAL_CHROMIUM_ENABLED =
  process.env.HELP_MATH_CHROMIUM_PROOF_RUNNER_MODE ===
    CHROMIUM_PROOF_RUNNER_MODE;

test(CHROMIUM_PROOF_TEST_NAME, {
  timeout: 280_000,
  skip: REAL_CHROMIUM_ENABLED
    ? false
    : "only the apply command may launch the one-time Chromium proof runner",
}, async (t) => {
  const envelope = await readExactChromiumRunnerEnvelope();
  const challenge = {
    algorithm: "sha256",
    inputBytes: envelope.challengeBytes.length,
    sha256: sha256(envelope.challengeBytes),
    runnerMode: CHROMIUM_PROOF_RUNNER_MODE,
    temporaryProofPath: envelope.proofOutputPath,
  };
  const startIdentity = await collectChromiumProofIdentity({
    projectRoot: PROJECT_ROOT,
    receiptPath: envelope.planReceiptPath,
  });
  assert.equal(
    envelope.chromiumExecutablePath,
    startIdentity.toolchain.chromium.executable.path,
    "runner executable differs from the hash-bound Chromium executable",
  );
  const {chromium} = await import("playwright");
  assert.equal(chromium.executablePath(), envelope.chromiumExecutablePath);
  const browser = await chromium.launch({
    headless: true,
    executablePath: envelope.chromiumExecutablePath,
  });
  const browserVersion = browser.version();
  assert.equal(
    browserVersion,
    startIdentity.toolchain.chromium.browserVersion,
    "launched Chromium version differs from the hash-bound browser manifest",
  );
  const samples = [];
  let guardBeforeDraw;
  try {
    for (const definition of REAL_CHROMIUM_SAMPLE_DEFINITIONS) {
      let entry;
      let bytes;
      let generated;
      if (definition.pageRenderer) {
        ({entry, bytes} = await v1BytesForPage(definition.animationId));
        generated = transformPage(entry, bytes);
      } else {
        ({entry, bytes} = await v1BytesForLoadedHost());
        generated = transformAdaptiveRuntime({
          inputBytes: bytes,
          profileEntry: entry,
          animationId: LOADED_HOST.metadataAnimationId,
          metadataAnimationId: LOADED_HOST.metadataAnimationId,
          registryAnimationId: LOADED_HOST.registryAnimationId,
          pageRenderer: false,
        });
      }
      const originalPage = await browser.newPage();
      const adaptivePage = await browser.newPage();
      const scalePage = await browser.newPage();
      try {
        const original = await browserRender(
          originalPage,
          bytes.toString("utf8"),
          definition.registryAnimationId,
          definition.request,
          800,
          600,
        );
        const adaptive = await browserRender(
          adaptivePage,
          generated.outputBytes.toString("utf8"),
          definition.registryAnimationId,
          {...definition.request, renderScale: 1},
          800,
          600,
        );
        assert.equal(
          adaptive.digest,
          original.digest,
          `${definition.animationId}: k1 RGBA`,
        );
        assert.deepEqual(
          adaptive.state,
          original.state,
          `${definition.animationId}: k1 render state`,
        );
        const scale = await browserScaleComparison(
          scalePage,
          generated.outputBytes.toString("utf8"),
          definition.registryAnimationId,
          definition.request,
        );
        assert.equal(scale.width, 1600, `${definition.animationId}: k2 width`);
        assert.equal(scale.height, 1200, `${definition.animationId}: k2 height`);
        assert.equal(
          scale.baselineK1RgbaSha256,
          adaptive.digest,
          `${definition.animationId}: independently rendered k1 baseline`,
        );
        assert.deepEqual(
          scale.k1State,
          adaptive.state,
          `${definition.animationId}: repeated k1 render state`,
        );
        assert.deepEqual(
          scale.k2State,
          adaptive.state,
          `${definition.animationId}: k2 state must equal k1/v1`,
        );
        const maximumRmse = maximumRmseForFrameClass(definition.frameClass);
        assert.ok(
          scale.normalizedDownsampleRmse <= maximumRmse,
          `${definition.animationId}: ${definition.frameClass} normalized ` +
            `k2 downsample RMSE ${scale.normalizedDownsampleRmse} > ${maximumRmse}`,
        );
        samples.push({
          animationId: definition.animationId,
          registryAnimationId: definition.registryAnimationId,
          pageRenderer: definition.pageRenderer,
          request: definition.request,
          frameClass: definition.frameClass,
          inputSha256: generated.record.input.sha256,
          outputSha256: generated.record.output.sha256,
          k1: {
            width: adaptive.width,
            height: adaptive.height,
            originalRgbaSha256: original.digest,
            adaptiveRgbaSha256: adaptive.digest,
            rgbaByteIdentical: adaptive.digest === original.digest,
            originalState: original.state,
            adaptiveState: adaptive.state,
            stateByteIdentical:
              canonicalJson(adaptive.state) === canonicalJson(original.state),
          },
          k2: {
            width: scale.width,
            height: scale.height,
            comparisonAlgorithm: K2_COMPARISON_ALGORITHM,
            baselineK1RgbaSha256: scale.baselineK1RgbaSha256,
            rawRgbaSha256: scale.rawRgbaSha256,
            downsampledWidth: scale.downsampledWidth,
            downsampledHeight: scale.downsampledHeight,
            downsampledRgbaSha256: scale.downsampledRgbaSha256,
            normalizedDownsampleRmse: scale.normalizedDownsampleRmse,
            state: scale.k2State,
            stateSha256: sha256(Buffer.from(canonicalJson(scale.k2State))),
            stateByteIdenticalToK1:
              canonicalJson(scale.k2State) === canonicalJson(adaptive.state),
          },
        });
      } finally {
        await Promise.all([
          originalPage.close(),
          adaptivePage.close(),
          scalePage.close(),
        ]);
      }
    }

    const {entry, bytes} = await v1BytesForPage(
      REAL_CHROMIUM_GUARD_DEFINITION.animationId,
    );
    const generated = transformPage(entry, bytes);
    const page = await browser.newPage();
    try {
      await page.setContent(
        '<canvas id="stage" width="800" height="600"></canvas>',
      );
      await page.evaluate(({resizeProperties, mutatingMethods}) => {
        const canvas = document.querySelector("#stage");
        const context = canvas.getContext("2d");
        const counters = {
          canvasResizeCount: 0,
          contextAcquisitionCount: 0,
          mutating2dMethodCount: 0,
        };
        const canvasPrototype = HTMLCanvasElement.prototype;
        for (const property of resizeProperties) {
          const descriptor = Object.getOwnPropertyDescriptor(
            canvasPrototype,
            property,
          );
          if (!descriptor?.get || !descriptor?.set || !descriptor.configurable) {
            throw new Error(`cannot instrument canvas ${property}`);
          }
          Object.defineProperty(canvasPrototype, property, {
            ...descriptor,
            set(value) {
              counters.canvasResizeCount += 1;
              return Reflect.apply(descriptor.set, this, [value]);
            },
          });
        }
        const originalGetContext = canvasPrototype.getContext;
        Object.defineProperty(canvasPrototype, "getContext", {
          configurable: true,
          writable: true,
          value(...argumentsForGetContext) {
            counters.contextAcquisitionCount += 1;
            return Reflect.apply(originalGetContext, this, argumentsForGetContext);
          },
        });
        const contextPrototype = CanvasRenderingContext2D.prototype;
        for (const method of mutatingMethods) {
          const descriptor = Object.getOwnPropertyDescriptor(
            contextPrototype,
            method,
          );
          if (
            !descriptor || typeof descriptor.value !== "function" ||
            !descriptor.configurable
          ) {
            throw new Error(`cannot instrument 2D method ${method}`);
          }
          const original = descriptor.value;
          Object.defineProperty(contextPrototype, method, {
            ...descriptor,
            value(...argumentsForMethod) {
              counters.mutating2dMethodCount += 1;
              return Reflect.apply(original, this, argumentsForMethod);
            },
          });
        }
        globalThis.__adaptiveCanvasGuardInstrumentation = {
          canvas,
          context,
          reset() {
            counters.canvasResizeCount = 0;
            counters.contextAcquisitionCount = 0;
            counters.mutating2dMethodCount = 0;
          },
          snapshot() {
            return {
              ...counters,
              mutationCount:
                counters.canvasResizeCount +
                counters.contextAcquisitionCount +
                counters.mutating2dMethodCount,
            };
          },
        };
      }, {
        resizeProperties: GUARDED_CANVAS_RESIZE_PROPERTIES,
        mutatingMethods: GUARDED_MUTATING_2D_METHODS,
      });
      await page.addScriptTag({content: generated.outputBytes.toString("utf8")});
      const result = await page.evaluate(async ({definition}) => {
        const asset = globalThis.HELP_MATH_CANVAS_ASSETS[
          definition.registryAnimationId
        ];
        if (!asset) throw new Error("missing guard registry asset");
        await asset.ready();
        const instrumentation =
          globalThis.__adaptiveCanvasGuardInstrumentation;
        const {canvas, context} = instrumentation;
        const digest = async (values) => {
          const result = await crypto.subtle.digest("SHA-256", values);
          return [...new Uint8Array(result)].map((value) =>
            value.toString(16).padStart(2, "0")
          ).join("");
        };
        const before = context.getImageData(0, 0, 800, 600).data;
        const beforeRgbaSha256 = await digest(before);
        const errors = [];
        const attempts = [];
        for (const renderScale of [undefined, 3]) {
          instrumentation.reset();
          let errorMessage = null;
          try {
            asset.render(canvas, {
              ...definition.request,
              ...(renderScale === undefined ? {} : {renderScale}),
            });
          } catch (error) {
            errorMessage = error.message;
            errors.push(errorMessage);
          }
          const counts = instrumentation.snapshot();
          const afterAttempt = context.getImageData(0, 0, 800, 600).data;
          const afterRgbaSha256 = await digest(afterAttempt);
          attempts.push({
            renderScale: renderScale === undefined ? "missing" : renderScale,
            error: errorMessage,
            afterRgbaSha256,
            rgbaUnchanged: beforeRgbaSha256 === afterRgbaSha256,
            ...counts,
          });
        }
        const after = context.getImageData(0, 0, 800, 600).data;
        const afterRgbaSha256 = await digest(after);
        return {
          errors,
          attempts,
          width: canvas.width,
          height: canvas.height,
          beforeRgbaSha256,
          afterRgbaSha256,
          rgbaUnchanged: beforeRgbaSha256 === afterRgbaSha256,
        };
      }, {definition: REAL_CHROMIUM_GUARD_DEFINITION});
      assert.deepEqual(
        result.errors,
        REAL_CHROMIUM_GUARD_DEFINITION.expectedErrors,
      );
      assert.deepEqual(
        result.attempts.map((attempt) => ({
          renderScale: attempt.renderScale,
          error: attempt.error,
          rgbaUnchanged: attempt.rgbaUnchanged,
          canvasResizeCount: attempt.canvasResizeCount,
          contextAcquisitionCount: attempt.contextAcquisitionCount,
          mutating2dMethodCount: attempt.mutating2dMethodCount,
          mutationCount: attempt.mutationCount,
        })),
        REAL_CHROMIUM_GUARD_DEFINITION.rejectedRenderScales.map(
          (renderScale, index) => ({
            renderScale,
            error: REAL_CHROMIUM_GUARD_DEFINITION.expectedErrors[index],
            rgbaUnchanged: true,
            canvasResizeCount: 0,
            contextAcquisitionCount: 0,
            mutating2dMethodCount: 0,
            mutationCount: 0,
          }),
        ),
      );
      assert.equal(result.width, 800);
      assert.equal(result.height, 600);
      assert.equal(result.rgbaUnchanged, true);
      guardBeforeDraw = {
        animationId: REAL_CHROMIUM_GUARD_DEFINITION.animationId,
        registryAnimationId:
          REAL_CHROMIUM_GUARD_DEFINITION.registryAnimationId,
        request: REAL_CHROMIUM_GUARD_DEFINITION.request,
        inputSha256: generated.record.input.sha256,
        outputSha256: generated.record.output.sha256,
        rejectedRenderScales:
          REAL_CHROMIUM_GUARD_DEFINITION.rejectedRenderScales,
        errors: result.errors,
        instrumentedCanvasResizeProperties:
          GUARDED_CANVAS_RESIZE_PROPERTIES,
        instrumentedMutating2dMethods: GUARDED_MUTATING_2D_METHODS,
        attempts: result.attempts,
        width: result.width,
        height: result.height,
        beforeRgbaSha256: result.beforeRgbaSha256,
        afterRgbaSha256: result.afterRgbaSha256,
        rgbaUnchanged: result.rgbaUnchanged,
      };
    } finally {
      await page.close();
    }
  } finally {
    await browser.close();
  }
  assert.equal(samples.length, REAL_CHROMIUM_SAMPLE_DEFINITIONS.length);
  assert.ok(guardBeforeDraw);
  const endIdentity = await collectChromiumProofIdentity({
    projectRoot: PROJECT_ROOT,
    receiptPath: envelope.planReceiptPath,
  });
  assert.deepEqual(
    endIdentity,
    startIdentity,
    "generator/test/plan/runtime/toolchain changed during real-Chromium proof run",
  );
  const proof = chromiumProofDocument({
    challenge,
    identity: startIdentity,
    browser: {
      name: "chromium",
      version: browserVersion,
      executablePath: envelope.chromiumExecutablePath,
    },
    samples,
    guardBeforeDraw,
  });
  const receipt = await writeChromiumProofReceipt({
    document: proof,
    receiptPath: envelope.proofOutputPath,
    projectRoot: PROJECT_ROOT,
    requireCreated: true,
  });
  t.diagnostic(
    `one-time real-Chromium proof ${receipt.operation}: ` +
      `${receipt.path} ${receipt.sha256}`,
  );
});
