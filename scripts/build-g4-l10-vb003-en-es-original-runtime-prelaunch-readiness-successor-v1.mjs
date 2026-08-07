#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  readFile,
  readdir,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");
export const REPORT_RELATIVE =
  "reports/g4-l10-vb003-en-es-original-runtime-prelaunch-readiness-successor-v1.json";

const ANIMATION_ID = "course-g04-l10-vb-003";
const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const SOURCE_SWF_SHA256 =
  "96a0c6c9cd7f5813d06e382bcb9dc2b81a0c0127a9865222dea1abba96a8d93d";
const RUNTIME_EXECUTABLE_SHA256 =
  "8f4e10c8c28698f3429a1489f9592f6ae5697fb6eb7d15c4cfe83e925b1ebc30";
const V3_KIT_ROOT = "work/root-capture-kits-v3";

const FIXED_INPUTS = Object.freeze({
  securityContractV214: Object.freeze({
    path: "docs/G4_L10_NATIVE_HELPER_V2_14_SECURITY_CONTRACT_SUCCESSOR.md",
    bytes: 50310,
    sha256: "a86c726ca5e3ae89cfb110c1a3dedb751c3cb2c51d1b737a908a91ddd0bf9510",
    mode: "0444",
  }),
  rootCaptureProtocolV3: Object.freeze({
    path: "reports/g4-l10-root-capture-kit-protocol-v3-successor.json",
    bytes: 328835,
    sha256: "9c403289c12be94150b4afa783711ff377a0ea3c1dc6831446e5448a234e8753",
    mode: "0644",
  }),
  conditionalOperatorGateV1: Object.freeze({
    path: "reports/g4-l10-vb003-conditional-operator-gate-v1.json",
    bytes: 7079,
    sha256: "6024df8cec7ed47e9d200cd5b31cd3182408d01451292fc767b5f2b27f3b26f5",
    mode: "0600",
  }),
  failedHelperReviewBatch: Object.freeze({
    path: "reports/g4-l10-native-helper-v2-14-independent-review-batch-487d5f85-failed-v1.json",
    bytes: 8768,
    sha256: "7b07824a378d232e89f46eb744fd572042a455f3203c7e41c2b0b16fda477b1d",
    mode: "0444",
  }),
  completeTemplateV6: Object.freeze({
    path: "reports/g4-l10-complete-migration-template-contract-v6-2026-08-06.json",
    bytes: 237667,
    sha256: "4bc3884451303da1342763ec65095bb13b3d67f2ba28bfbfda739c58485f9e51",
    mode: "0644",
  }),
  residualTriage: Object.freeze({
    path: "reports/g4-l10-residual-frame-domain-audit-triage-v1.json",
    bytes: 124726,
    sha256: "ba515be75fbf9f8fd25ddbd9114a3e00996cdfb535f567c4518116118bb1a7f2",
    mode: "0444",
  }),
  dynamicDispositionPlan: Object.freeze({
    path: "reports/g4-l10-dynamic-indirect-parent-disposition-successor-plan-v1.json",
    bytes: 128316,
    sha256: "f5b958601ef2d1be09e60ad5e72e606fa9dff08f97e1eaba02cc469682b79c19",
    mode: "0444",
  }),
  scriptedOneFrameTriage: Object.freeze({
    path: "reports/g4-l10-scripted-one-frame-control-triage-v1.json",
    bytes: 176201,
    sha256: "a679db0da5db2a2b4eff797d120efc4464516eb0254c9fd3fdafbdeea3a6abeb",
    mode: "0444",
  }),
  staticSpecificationReviewInput: Object.freeze({
    path: "reports/g4-l10-vb003-static-specification-adopter-readiness-v2-review-input.json",
    bytes: 51883,
    sha256: "eeedc90efabd8a3e7bfc0910cf53e1c592c4122d35cfbaa33102a72a524329af",
    mode: "0444",
  }),
  traceSpecIndex: Object.freeze({
    path: "migrations/lesson-release-trace-spec-indexes/lesson-g04-l10-perimeter-area.json",
    bytes: 706051,
    sha256: "d2f846831fa9a5c7c3a7e9cb0276a8b3671fbf6c26d17067bf4610c132e8687f",
    mode: "0644",
  }),
});

const EXPECTED_KITS = Object.freeze([
  Object.freeze({
    language: "en",
    requirementId: "req-default-root-en",
    traceId: "default-root-en",
    entryStateSha256:
      "bf209e3302a76c14fff3e7e12f6fdc0f9bc01d4934aadd03334b5c3cf61b7cf1",
    traceSpec: Object.freeze({
      path: "migrations/course-g04-l10-vb-003/audit/trace-specs/lesson-releases/lesson-g04-l10-perimeter-area/req-default-root-en.json",
      bytes: 18110,
      sha256: "7595b0c09079743993a1adfb1ca9a1af1cda663ce43482630362679fe4f5057e",
      mode: "0644",
    }),
    captureKitManifestSha256:
      "c217a225043ab019b19b69f61eb626b32b9811f0dd78d1ddb5930b1d28997f9b",
    treeSha256:
      "d27e244f9f470445ef936d65b8e7cf2cf4f1dd14cff95fb1e9a63fd83f2f899d",
  }),
  Object.freeze({
    language: "es",
    requirementId: "req-default-root-es",
    traceId: "default-root-es",
    entryStateSha256:
      "4e4bcf0390c6fd9bb1539b0c26a8555d9e4034ef5c591548bdb1f9a506f70067",
    traceSpec: Object.freeze({
      path: "migrations/course-g04-l10-vb-003/audit/trace-specs/lesson-releases/lesson-g04-l10-perimeter-area/req-default-root-es.json",
      bytes: 18110,
      sha256: "be746206689c25275dd33af219859e240dd98a3fbbb5382dc0a9eb58c41ec76b",
      mode: "0644",
    }),
    captureKitManifestSha256:
      "1055a6f34269fcfaf7eb17391ed302d89cbddcca204f17755095a39ecc8a2bfc",
    treeSha256:
      "227f0494f58d4b7b99767e1f0cb59f820d85377c33a73b88672b8e032d46775c",
  }),
]);

const AUTHORITY_EFFECT_KEYS = Object.freeze([
  "securityReviewAcceptance",
  "productionHelperImplementation",
  "productionHelperTesting",
  "protectedInstallation",
  "helperExecution",
  "originalRuntimeLaunch",
  "originalRuntimeEvidence",
  "baselineAdoption",
  "specificationAdoption",
  "rendererAdoption",
  "behaviorAcceptance",
  "visualRmseAcceptance",
  "audioAcceptance",
  "humanVisualAcceptance",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictCompletion",
  "lessonBatchAdmission",
  "wholeLessonIntegration",
  "remainingGrade4BatchStart",
  "wholeCourseIntegration",
  "sourcePromotion",
  "release",
  "publication",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function compareText(left, right) {
  return Buffer.compare(Buffer.from(String(left)), Buffer.from(String(right)));
}

function modeString(info) {
  const mode = typeof info.mode === "bigint" ? info.mode : BigInt(info.mode);
  return Number(mode & 0o777n).toString(8).padStart(4, "0");
}

function statIdentity(info) {
  return [info.dev, info.ino, info.mode, info.nlink, info.uid, info.gid,
    info.size, info.mtimeNs, info.ctimeNs].map(String).join(":");
}

function contained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".."
    && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function canonicalRoot(projectRoot) {
  const lexical = path.resolve(projectRoot);
  const info = await lstat(lexical);
  assert.ok(info.isDirectory() && !info.isSymbolicLink(),
    `Project root must be an ordinary directory: ${lexical}`);
  assert.equal(await realpath(lexical), lexical,
    `Project root resolves through a symlink: ${lexical}`);
  return lexical;
}

function resolveInside(root, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false,
    `Absolute path is forbidden: ${relativePath}`);
  assert.equal(relativePath.includes("\\"), false,
    `Non-portable path is forbidden: ${relativePath}`);
  const absolute = path.resolve(root, relativePath);
  assert.ok(contained(root, absolute), `Path escapes root: ${relativePath}`);
  return absolute;
}

async function assertOrdinaryAncestors(root, absoluteParent) {
  assert.ok(absoluteParent === root || contained(root, absoluteParent));
  const relative = path.relative(root, absoluteParent);
  let cursor = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const info = await lstat(cursor);
    assert.ok(info.isDirectory() && !info.isSymbolicLink(),
      `Path ancestor must be an ordinary directory: ${cursor}`);
    assert.equal(await realpath(cursor), cursor,
      `Path ancestor resolves through a symlink: ${cursor}`);
  }
}

async function stableRead(root, expected) {
  const absolute = resolveInside(root, expected.path);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `Input must be an ordinary non-symlink file: ${expected.path}`);
  assert.equal(await realpath(absolute), absolute,
    `Input resolves through a symlink: ${expected.path}`);
  assert.equal(before.nlink, 1n,
    `Input must have one hard link: ${expected.path}`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `Input changed while read: ${expected.path}`);
  const record = {
    path: expected.path,
    bytes,
    byteCount: bytes.length,
    sha256: sha256(bytes),
    mode: modeString(before),
  };
  if (expected.bytes !== undefined) assert.equal(record.byteCount,
    expected.bytes, `Input byte count drifted: ${expected.path}`);
  if (expected.sha256) assert.equal(record.sha256, expected.sha256,
    `Input SHA-256 drifted: ${expected.path}`);
  if (expected.mode) assert.equal(record.mode, expected.mode,
    `Input mode drifted: ${expected.path}`);
  return record;
}

async function assertAbsent(root, relativePath) {
  const absolute = resolveInside(root, relativePath);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  try {
    await lstat(absolute);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  assert.fail(`Target must be absent: ${relativePath}`);
}

function binding(record) {
  return {path: record.path, bytes: record.byteCount, sha256: record.sha256,
    mode: record.mode};
}

function parseJson(record) {
  return JSON.parse(record.bytes.toString("utf8"));
}

async function inventoryKit(root, kitRelative) {
  const kitAbsolute = resolveInside(root, kitRelative);
  await assertOrdinaryAncestors(root, kitAbsolute);
  const descriptors = [];
  async function walk(relativeDirectory) {
    const absoluteDirectory = relativeDirectory
      ? path.join(kitAbsolute, ...relativeDirectory.split("/"))
      : kitAbsolute;
    const directoryInfo = await lstat(absoluteDirectory);
    assert.ok(directoryInfo.isDirectory() && !directoryInfo.isSymbolicLink(),
      `${kitRelative}/${relativeDirectory}: kit path must be an ordinary directory`);
    assert.equal(await realpath(absoluteDirectory), absoluteDirectory,
      `${kitRelative}/${relativeDirectory}: kit directory resolves through a symlink`);
    const names = await readdir(absoluteDirectory);
    names.sort(compareText);
    for (const name of names) {
      assert.notEqual(name, ".DS_Store", `${kitRelative}: .DS_Store is forbidden`);
      const relative = relativeDirectory ? `${relativeDirectory}/${name}` : name;
      const absolute = path.join(absoluteDirectory, name);
      const info = await lstat(absolute);
      assert.equal(info.isSymbolicLink(), false,
        `${kitRelative}/${relative}: symlink is forbidden`);
      if (info.isDirectory()) {
        await walk(relative);
        continue;
      }
      assert.ok(info.isFile(), `${kitRelative}/${relative}: special file is forbidden`);
      const record = await stableRead(root, {path: `${kitRelative}/${relative}`});
      descriptors.push({
        file: relative,
        bytes: record.byteCount,
        sha256: record.sha256,
        mode: record.mode,
      });
    }
  }
  await walk("");
  return {
    descriptors,
    fileCount: descriptors.length,
    totalBytes: descriptors.reduce((sum, {bytes}) => sum + bytes, 0),
    treeSha256: sha256(Buffer.from(stableJson(descriptors), "utf8")),
  };
}

function exactFileSet(descriptors) {
  const encoded = [...descriptors].sort((left, right) =>
    compareText(left.file, right.file)).map(
    ({file, bytes, sha256: hash, mode}) =>
      `${file}\0${bytes}\0${hash}\0${mode}\n`).join("");
  return {
    count: descriptors.length,
    sha256: sha256(Buffer.from(encoded, "utf8")),
    encoding: "sorted-relativePath-null-bytes-null-sha256-null-mode-newline-v1",
  };
}

function findProtocolKit(protocol, expected) {
  const rows = protocol.v3ParallelRoot.kits.filter(({animationId,
    requirementId, language}) => animationId === ANIMATION_ID
      && requirementId === expected.requirementId
      && language === expected.language);
  assert.equal(rows.length, 1,
    `${expected.requirementId}: protocol v3 kit is missing or duplicated`);
  return rows[0];
}

function findConditionalKit(gate, expected) {
  const rows = gate.captureKits.filter(({animationId, requirementId, language}) =>
    animationId === ANIMATION_ID && requirementId === expected.requirementId
      && language === expected.language);
  assert.equal(rows.length, 1,
    `${expected.requirementId}: conditional gate kit is missing or duplicated`);
  return rows[0];
}

export async function buildReadiness(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const fixedRecords = Object.fromEntries(await Promise.all(
    Object.entries(FIXED_INPUTS).map(async ([key, expected]) =>
      [key, await stableRead(root, expected)]),
  ));
  const protocol = parseJson(fixedRecords.rootCaptureProtocolV3);
  const operatorGate = parseJson(fixedRecords.conditionalOperatorGateV1);
  const failedReview = parseJson(fixedRecords.failedHelperReviewBatch);
  const template = parseJson(fixedRecords.completeTemplateV6);
  const residual = parseJson(fixedRecords.residualTriage);
  const dynamicPlan = parseJson(fixedRecords.dynamicDispositionPlan);
  const scriptedTriage = parseJson(fixedRecords.scriptedOneFrameTriage);
  const specificationReviewInput = parseJson(
    fixedRecords.staticSpecificationReviewInput);

  assert.equal(protocol.status,
    "materialized-unsigned-protocol-successor-not-operator-ready-not-evidence");
  assert.equal(protocol.v3ParallelRoot.root, V3_KIT_ROOT);
  assert.equal(protocol.v3ParallelRoot.operatorReady, false);
  assert.equal(protocol.v3ParallelRoot.summary.actualRuntimeSessions, 0);
  assert.equal(protocol.v3ParallelRoot.summary.actualRuntimeReceipts, 0);
  assert.equal(protocol.v3ParallelRoot.summary.actualLaunchReceipts, 0);
  assert.equal(protocol.v3ParallelRoot.summary.capturePngs, 0);
  assert.equal(operatorGate.status,
    "conditional-designation-recorded-not-activated-not-operator-ready");
  assert.equal(operatorGate.decision, "DO_NOT_LAUNCH");
  assert.equal(operatorGate.operator.name, "Peter Hu");
  assert.equal(operatorGate.operator.activated, false);
  assert.equal(operatorGate.operator.operatorReady, false);
  assert.equal(failedReview.status,
    "FAILED_INVALIDATED_NONREUSABLE_NO_IMPLEMENTATION_AUTHORITY");
  assert.equal(failedReview.batch.reusable, false);
  assert.equal(failedReview.batchResult.productionHelperImplementationEligible,
    false);
  assert.equal(failedReview.batchResult.allThreeP0P1P2Zero, false);
  assert.equal(failedReview.retainedState.PeterHuOriginalRuntimeOperatorActivated,
    false);
  assert.equal(template.status, "fail-closed-template-not-stable");
  assert.equal(template.templateStable, false);
  assert.equal(residual.decision,
    "KEEP_70_UNRESOLVED_ADVANCE_ONLY_BY_BOUND_SUCCESSORS");
  assert.equal(dynamicPlan.status,
    "FROZEN_PLAN_ONLY_NOT_APPLIED_NO_WORKSPACE_MUTATION_AUTHORITY");
  assert.equal(dynamicPlan.scope.workspaceFilesWritten, 0);
  assert.equal(scriptedTriage.decision,
    "FREEZE_41_SCRIPTED_ONE_FRAME_ROUTES_KEEP_ALL_41_UNRESOLVED");
  assert.equal(specificationReviewInput.status,
    "review-input-frozen-no-task-authorization-no-review-verdict");
  assert.equal(specificationReviewInput.decision,
    "DO_NOT_CREATE_TASKS_DO_NOT_APPLY_DO_NOT_IMPLEMENT_DO_NOT_LAUNCH");

  const traceRecords = Object.fromEntries(await Promise.all(EXPECTED_KITS.map(
    async (expected) => [expected.language,
      await stableRead(root, expected.traceSpec)])));
  const kits = [];
  const allDescriptors = [];
  for (const expected of EXPECTED_KITS) {
    const protocolKit = findProtocolKit(protocol, expected);
    const conditionalKit = findConditionalKit(operatorGate, expected);
    const kitRoot = `${V3_KIT_ROOT}/${ANIMATION_ID}/${expected.requirementId}`;
    const inventory = await inventoryKit(root, kitRoot);
    assert.equal(inventory.fileCount, 13,
      `${expected.requirementId}: exact v3 kit file count drifted`);
    assert.equal(inventory.totalBytes, 121474,
      `${expected.requirementId}: exact v3 kit byte count drifted`);
    assert.equal(inventory.treeSha256, expected.treeSha256,
      `${expected.requirementId}: exact v3 kit tree SHA-256 drifted`);
    assert.equal(protocolKit.tree.sha256, expected.treeSha256,
      `${expected.requirementId}: protocol tree binding drifted`);
    assert.equal(conditionalKit.tree.sha256, expected.treeSha256,
      `${expected.requirementId}: conditional tree binding drifted`);
    const manifestDescriptor = inventory.descriptors.find(({file}) =>
      file === "kit-manifest.json");
    assert.equal(manifestDescriptor?.sha256,
      expected.captureKitManifestSha256,
    `${expected.requirementId}: current kit manifest SHA-256 drifted`);
    assert.equal(protocolKit.captureKitManifestSha256,
      expected.captureKitManifestSha256,
    `${expected.requirementId}: protocol manifest binding drifted`);
    assert.equal(conditionalKit.captureKitManifestSha256,
      expected.captureKitManifestSha256,
    `${expected.requirementId}: conditional manifest binding drifted`);
    const manifestRecord = await stableRead(root,
      {path: `${kitRoot}/kit-manifest.json`});
    const manifest = parseJson(manifestRecord);
    assert.equal(manifest.schemaVersion, 1);
    assert.equal(manifest.artifactType,
      "root-frame-accurate-capture-operator-kit");
    assert.equal(manifest.status, "unsigned-template-only-not-evidence");
    assert.equal(manifest.notEvidence, true);
    assert.equal(manifest.strictAcceptanceEffect, false);
    assert.equal(manifest.migrationStatusChanged, false);
    assert.equal(manifest.humanReviewRecorded, false);
    assert.equal(manifest.ownerReviewRecorded, false);
    assert.equal(manifest.animationId, ANIMATION_ID);
    assert.equal(manifest.requirementId, expected.requirementId);
    assert.equal(manifest.identity.language, expected.language);
    assert.equal(manifest.identity.traceId, expected.traceId);
    assert.equal(manifest.identity.entryStateSha256,
      expected.entryStateSha256);
    assert.deepEqual(manifest.identity.requiredRange,
      {firstFrame: 1, lastFrame: 10});
    assert.equal(manifest.frameDomain.id, "root");
    assert.equal(manifest.frameDomain.frameCount, 10);
    assert.deepEqual(manifest.frameDomain.nativeStage, {width: 800, height: 600});
    assert.equal(manifest.frameDomain.fps, 12);
    assert.equal(manifest.stagedSource.staged.sha256, SOURCE_SWF_SHA256);
    assert.equal(manifest.stagedSource.copiedByteForByte, true);
    assert.equal(manifest.stagedSource.sourceAssetsLaunchedDirectly, false);
    assert.equal(manifest.runtime.executableSha256,
      RUNTIME_EXECUTABLE_SHA256);
    assert.equal(manifest.evidenceProtocol.schemaVersion, 3);
    assert.equal(manifest.evidenceProtocol.name,
      "acyclic-root-capture-evidence-dag-v3");
    assert.equal(manifest.evidenceProtocol.operatorReadiness.operatorReady,
      false);
    const sourceDescriptor = inventory.descriptors.find(({file}) =>
      file === "runtime-source/source.swf");
    assert.equal(sourceDescriptor?.sha256, SOURCE_SWF_SHA256,
      `${expected.requirementId}: staged source SHA-256 drifted`);
    assert.equal(traceRecords[expected.language].sha256,
      expected.traceSpec.sha256);
    const pngCount = inventory.descriptors.filter(({file}) =>
      file.toLowerCase().endsWith(".png")).length;
    const actualReceiptCount = inventory.descriptors.filter(({file}) =>
      !file.includes("/templates/") && !file.startsWith("templates/")
        && /(receipt|attestation).*\.json$/u.test(file)).length;
    assert.equal(pngCount, 0,
      `${expected.requirementId}: capture PNG unexpectedly exists`);
    assert.equal(actualReceiptCount, 0,
      `${expected.requirementId}: actual receipt unexpectedly exists in kit`);
    allDescriptors.push(...inventory.descriptors.map((descriptor) => ({
      kit: expected.requirementId,
      ...descriptor,
    })));
    kits.push({
      animationId: ANIMATION_ID,
      ordinal: 7,
      language: expected.language,
      requirementId: expected.requirementId,
      frameDomainId: "root",
      traceId: expected.traceId,
      entryStateSha256: expected.entryStateSha256,
      scenario: "default",
      seed: "0",
      frameRange: {firstFrame: 1, lastFrame: 10},
      frameCount: 10,
      nativeStage: {width: 800, height: 600},
      fps: 12,
      sourceSwfSha256: SOURCE_SWF_SHA256,
      runtimeExecutableSha256: RUNTIME_EXECUTABLE_SHA256,
      kitRoot,
      captureKitManifestSha256: expected.captureKitManifestSha256,
      exactTree: {
        algorithm: "stable-json-sorted-relative-file-descriptors-sha256-v1",
        fileCount: inventory.fileCount,
        totalBytes: inventory.totalBytes,
        sha256: inventory.treeSha256,
        exactFileSet: exactFileSet(inventory.descriptors),
        files: inventory.descriptors,
      },
      traceSpec: binding(traceRecords[expected.language]),
      traceSpecIndex: binding(fixedRecords.traceSpecIndex),
      kitStatus: "unsigned-template-only-not-evidence",
      operatorReady: false,
      originalRuntimeEvidence: false,
      authoritativeBaselineFrames: 0,
      capturePngCount: 0,
      actualLaunchReceiptCount: 0,
      actualRuntimeReceiptCount: 0,
      actualSessionAttestationCount: 0,
      sessionOutputCreated: false,
      launchAuthorizedNow: false,
    });
  }

  const combinedDescriptorEncoding = [...allDescriptors]
    .sort((left, right) => compareText(
      `${left.kit}/${left.file}`,
      `${right.kit}/${right.file}`,
    ))
    .map(({kit, file, bytes, sha256: hash, mode}) =>
      `${kit}/${file}\0${bytes}\0${hash}\0${mode}\n`)
    .join("");
  const combinedKitFileSet = {
    count: allDescriptors.length,
    sha256: sha256(Buffer.from(combinedDescriptorEncoding, "utf8")),
    encoding:
      "sorted-requirementId-slash-relativePath-null-bytes-null-sha256-null-mode-newline-v1",
  };
  assert.equal(combinedKitFileSet.count, 26);

  const preparedChecks = {
    exactV3KitCountIsTwo: true,
    exactV3KitTreesCurrent: true,
    exactEnEsRequirementScopeBound: true,
    sourceSwfByteIdentityBound: true,
    runtimeExecutableIdentityValueBound: true,
    rootTraceSpecsCurrentAndHashBound: true,
    traceSpecIndexCurrentAndHashBound: true,
    nativeStageFpsFrameRangeAndEntryStatesBound: true,
    namedConditionalOperatorRecorded: true,
    freshLaunchReceiptPolicyFrozen: true,
  };
  const blockingChecks = {
    validV214SchemaAdversarialWholeSecurityReviewP0P1P2Zero: false,
    authenticatedPostReviewImplementationAndLaunchAuthorization: false,
    productionHelperImplementedUnderAuthorizedCleanRoomTask: false,
    productionHelperIndependentSecurityReviewP0P1P2Zero: false,
    protectedInstallationAuthorized: false,
    helperExecutionAuthorized: false,
    disposableOfflineEnvironmentApprovedAndPreflighted: false,
    oneItemReadOnlyAllowlistedLessonTreePreflighted: false,
    outboundNetworkDenialAndRequestAuditPreflighted: false,
    freshStorageCapacityPreflightPassed: false,
    outsideKitSessionOutputRootPreflightPassed: false,
    freshNamedHumanLaunchReceiptGeneratedAndChecked: false,
    peterHuOperatorActivated: false,
    originalRuntimeLaunchAuthorizedNow: false,
  };
  assert.ok(Object.values(preparedChecks).every(Boolean));
  assert.ok(Object.values(blockingChecks).every((value) => value === false));

  const authorityEffects = Object.fromEntries(AUTHORITY_EFFECT_KEYS.map((key) =>
    [key, false]));
  const documentWithoutFingerprint = {
    schemaVersion: 1,
    artifactType:
      "g4-l10-vb003-en-es-original-runtime-prelaunch-readiness-successor-v1",
    status:
      "EXACT_EN_ES_V3_KITS_CURRENT_PRELAUNCH_CLOSED_LATEST_SECURITY_BATCH_INVALIDATED",
    decision:
      "DO_NOT_LAUNCH_PRESERVE_EXACT_KITS_AWAIT_NEW_VALID_SECURITY_REVIEW_AND_AUTHORIZATION",
    evidenceClass:
      "acceptance-neutral-read-only-prelaunch-readiness-successor-not-runtime-evidence",
    purpose: [
      "Reverify the exact current protocol-v3 EN/ES capture-kit bytes for the user-scoped VB003 original-runtime baseline handoff.",
      "Bind the latest invalidated security-review batch and distinguish prepared kit identity from every still-closed launch, baseline, specification, renderer, review, and release gate.",
    ],
    scope: {
      releaseId: RELEASE_ID,
      animationId: ANIMATION_ID,
      ordinal: 7,
      sourceSwfSha256: SOURCE_SWF_SHA256,
      languages: ["en", "es"],
      requirementIds: EXPECTED_KITS.map(({requirementId}) => requirementId),
      exactCaptureKitCount: kits.length,
      combinedKitFileSet,
      otherL10MembersAuthorized: false,
      otherCoursesAuthorized: false,
    },
    fixedEvidenceInputs: Object.fromEntries(Object.entries(fixedRecords).map(
      ([key, record]) => [key, binding(record)])),
    captureKits: kits,
    readinessMatrix: {
      preparedChecks,
      blockingChecks,
      preparedCheckCount: Object.keys(preparedChecks).length,
      blockingCheckCount: Object.keys(blockingChecks).length,
      allPreparedKitIdentityChecksSatisfied: true,
      allLaunchChecksSatisfied: false,
      launchAuthorizedNow: false,
      originalRuntimeBaselineCount: 0,
    },
    latestSecurityReviewBoundary: {
      hmg4rb4: failedReview.batch.hmg4rb4,
      taskIds: failedReview.batch.preimageLinesInOrder.slice(2),
      status: failedReview.status,
      schemaResult: failedReview.tasks.find(({scope}) => scope === "schema").result,
      adversarialResult:
        failedReview.tasks.find(({scope}) => scope === "adversarial").result,
      wholeResult: failedReview.tasks.find(({scope}) => scope === "whole").result,
      allThreeQualifyingIndependentReviews: false,
      allThreeP0P1P2Zero: false,
      productionHelperImplementationEligible: false,
      reusable: false,
      peterHuOperatorActivated: false,
      laterStaticObservationsCannotCureSecurityReview: true,
    },
    launchReceiptPolicy: {
      schemaVersion: 3,
      evidenceType: "named-human-hash-bound-root-source-open-start-receipt",
      namedOperator: "Peter Hu",
      freshReceiptRequiredForEveryStart: true,
      receiptCheckedBeforeLaunch: true,
      finalizedBeforeFirstFrame: true,
      postHocReceiptAllowed: false,
      receiptReuseAllowed: false,
      currentReceiptCount: 0,
      launchAuthorizedNow: false,
    },
    currentL10Boundary: {
      templateStatus: template.status,
      templateStable: false,
      releaseMemberCount: template.scope.memberCount,
      activePageCount: template.scope.activePageCount,
      shellCount: template.scope.shellCount,
      rawResidualCount: residual.reconciliation.currentResidual.count,
      formalRequirementProjectionResidualCount:
        residual.formalProjectionBoundary
          .currentFormalRequirementProjectionResidualCount,
      dynamicIndirectParentPlan: {
        selectedPairs: dynamicPlan.scope.plannedTransitionPairs,
        projectedRawResidualCountNotApplied:
          dynamicPlan.aggregateProjection.projectedRawDispositionTotalsNotApplied.unresolved,
        workspaceFilesWritten: 0,
        applied: false,
      },
      scriptedOneFrameTriage: {
        exactPairs: scriptedTriage.scope.exactPairs,
        scriptBodyGroups: scriptedTriage.scope.distinctScriptBodyGroups,
        evidenceRoutes: scriptedTriage.scope.evidenceRoutes,
        dispositionChanged: false,
      },
      originalRuntimeFramesCaptured: 0,
      authoritativeOriginalRuntimeBaselineCount: 0,
      specificationReviewInputStatus: specificationReviewInput.status,
      specificationReviewVerdictPresent: false,
      specificationApplied: false,
      rendererImplemented: false,
      behaviorAccepted: false,
      visualRmseAccepted: false,
      audioHumanOwnerAccepted: false,
    },
    originalRuntimeEvidenceBoundary: {
      kitsAreUnsignedTemplatesOnly: true,
      ruffleCannotServeAsBaseline: true,
      runtimeExecutableBytesAreNotContainedInKit: true,
      runtimeIdentityValueDoesNotProveCurrentExecutableOrEnvironment: true,
      actualDisposableOfflineEnvironmentEvidencePresent: false,
      actualLaunchReceiptPresent: false,
      actualRuntimeSessionPresent: false,
      actualFramePngPresent: false,
      authoritativeBaselinePresent: false,
    },
    implementationBoundary: {
      reportPublicationOnly: true,
      captureKitWriteSupported: false,
      migrationWorkspaceWriteSupported: false,
      helperImplementationSupported: false,
      helperExecutionSupported: false,
      protectedInstallationSupported: false,
      originalRuntimeLaunchSupported: false,
      baselineAdoptionSupported: false,
      specificationAdoptionSupported: false,
      rendererImplementationSupported: false,
      applySupported: false,
      recoverSupported: false,
      releaseSupported: false,
      publicationSupported: false,
    },
    supportedCliModes: ["--dry-run", "--write-no-clobber", "--check"],
    writeNoClobberMeaning:
      `publish only ${REPORT_RELATIVE} as a new mode-0444 report; never modify a capture kit, migration workspace, source asset, helper, runtime, baseline, specification, renderer, acceptance, promotion, release, or publication artifact`,
    authorityEffects,
    nextPermittedAction:
      "Continue read-only L10 audit/specification readiness while the latest helper/security batch remains invalidated. A future original-runtime start requires a separately authorized fresh valid security-review path, authorized helper implementation and independent review, approved disposable offline environment, fresh capacity/output-root preflights, and a new checked launch receipt for that exact start.",
  };
  assert.ok(Object.values(authorityEffects).every((value) => value === false));
  const readinessFingerprintSha256 = sha256(Buffer.from(
    canonicalJson(documentWithoutFingerprint), "utf8"));
  const document = {...documentWithoutFingerprint, readinessFingerprintSha256};
  const json = `${JSON.stringify(document, null, 2)}\n`;
  return {root, document, json};
}

async function assertInputsCurrent(bundle) {
  const current = await buildReadiness(bundle.root);
  assert.equal(current.json, bundle.json,
    "G4 L10 VB003 EN/ES prelaunch readiness inputs changed after derivation");
}

export async function checkReadiness(bundle, outputRoot = bundle.root) {
  const root = await canonicalRoot(outputRoot);
  await assertInputsCurrent(bundle);
  const expected = Buffer.from(bundle.json, "utf8");
  const observed = await stableRead(root, {
    path: REPORT_RELATIVE,
    bytes: expected.length,
    sha256: sha256(expected),
    mode: "0444",
  });
  assert.deepEqual(observed.bytes, expected,
    "G4 L10 VB003 EN/ES prelaunch readiness report bytes drifted");
  return {
    disposition: "checked",
    status: bundle.document.status,
    decision: bundle.document.decision,
    report: REPORT_RELATIVE,
    reportSha256: observed.sha256,
    readinessFingerprintSha256: bundle.document.readinessFingerprintSha256,
    exactCaptureKits: bundle.document.scope.exactCaptureKitCount,
    exactKitFiles: bundle.document.scope.combinedKitFileSet.count,
    preparedChecks: bundle.document.readinessMatrix.preparedCheckCount,
    blockingChecks: bundle.document.readinessMatrix.blockingCheckCount,
    originalRuntimeBaselineCount:
      bundle.document.readinessMatrix.originalRuntimeBaselineCount,
    launchAuthorizedNow: false,
    originalRuntimeLaunched: false,
    helperImplemented: false,
    acceptanceEffect: false,
  };
}

export async function publishReadinessNoClobber(bundle, options = {}) {
  const outputRoot = await canonicalRoot(options.outputRoot ?? bundle.root);
  await assertInputsCurrent(bundle);
  const absolute = resolveInside(outputRoot, REPORT_RELATIVE);
  await assertOrdinaryAncestors(outputRoot, path.dirname(absolute));
  await assertAbsent(outputRoot, REPORT_RELATIVE);
  await (options.beforeWrite ?? (async () => {}))();
  await assertInputsCurrent(bundle);
  await writeFile(absolute, bundle.json, {flag: "wx", mode: 0o600});
  await chmod(absolute, 0o444);
  await assertInputsCurrent(bundle);
  return checkReadiness(bundle, outputRoot);
}

export function parseArguments(argv) {
  assert.equal(argv.length, 1,
    "Choose exactly one of --dry-run, --write-no-clobber, or --check");
  assert.ok(["--dry-run", "--write-no-clobber", "--check"].includes(argv[0]),
    "Only --dry-run, --write-no-clobber, and --check are supported");
  return argv[0];
}

export async function runCli(argv = process.argv.slice(2),
  projectRoot = PROJECT_ROOT) {
  const mode = parseArguments(argv);
  const bundle = await buildReadiness(projectRoot);
  if (mode === "--write-no-clobber") return publishReadinessNoClobber(bundle);
  if (mode === "--check") return checkReadiness(bundle);
  return {
    disposition: "dry-run",
    status: bundle.document.status,
    decision: bundle.document.decision,
    report: REPORT_RELATIVE,
    readinessFingerprintSha256: bundle.document.readinessFingerprintSha256,
    exactCaptureKits: bundle.document.scope.exactCaptureKitCount,
    exactKitFiles: bundle.document.scope.combinedKitFileSet.count,
    preparedChecks: bundle.document.readinessMatrix.preparedCheckCount,
    blockingChecks: bundle.document.readinessMatrix.blockingCheckCount,
    originalRuntimeBaselineCount:
      bundle.document.readinessMatrix.originalRuntimeBaselineCount,
    launchAuthorizedNow: false,
    originalRuntimeLaunched: false,
    helperImplemented: false,
    acceptanceEffect: false,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  runCli().then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
