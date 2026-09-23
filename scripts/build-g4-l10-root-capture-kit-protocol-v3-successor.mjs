#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  access,
  link,
  lstat,
  readFile,
  realpath,
  readdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  DEFAULT_ROOT_CAPTURE_KIT_ROOT,
  DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT,
  ROOT_CAPTURE_TEMPLATE_STATUS,
  renderUnsignedTemplateFiles,
} from "./scaffold-root-capture-kit.mjs";
import {
  ROOT_CAPTURE_V3_EVIDENCE_ORDER,
  ROOT_CAPTURE_V3_PROTOCOL_NAME,
  ROOT_CAPTURE_V3_REQUIRED_PREFLIGHTS,
  rootCaptureV3ProtocolManifest,
} from "./prepare-root-capture-candidate.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = await realpath(path.resolve(path.dirname(SCRIPT_PATH), ".."));
const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const REPORT_JSON_RELATIVE =
  "reports/g4-l10-root-capture-kit-protocol-v3-successor.json";
const REPORT_MARKDOWN_RELATIVE =
  "reports/g4-l10-root-capture-kit-protocol-v3-successor.md";
const GENERATOR_RELATIVE =
  "scripts/build-g4-l10-root-capture-kit-protocol-v3-successor.mjs";
const TEST_RELATIVE =
  "scripts/build-g4-l10-root-capture-kit-protocol-v3-successor.test.mjs";
const HASH = /^[a-f0-9]{64}$/u;

const EXPECTED_PREDECESSOR_ARTIFACTS = Object.freeze({
  v1: Object.freeze({
    json: Object.freeze({
      file: "reports/g4-l10-root-capture-kit-reconcile-receipt-v1.json",
      bytes: 107970,
      sha256: "26bffacbc97c1b8a8aabe734fd14f07a56f4a4861ecdf727c0396aee6d6aab49",
    }),
    markdown: Object.freeze({
      file: "reports/g4-l10-root-capture-kit-reconcile-receipt-v1.md",
      bytes: 3029,
      sha256: "748f47bbc02df56e0eeada2823565ffbaaeba60f192b13fdd53a1d9be72014b4",
    }),
  }),
  v2: Object.freeze({
    json: Object.freeze({
      file: "reports/g4-l10-root-capture-kit-reconcile-receipt-v2.json",
      bytes: 118100,
      sha256: "fb376ac734a52a848380df6b963a342a2f89be1467008a71fc425cd2b03e020a",
    }),
    markdown: Object.freeze({
      file: "reports/g4-l10-root-capture-kit-reconcile-receipt-v2.md",
      bytes: 3375,
      sha256: "689765536ea60ded36b0ebd5ac2f42a041354bfce7c624df6824b56ab305eeaa",
    }),
  }),
});

const TOOLING_FILES = Object.freeze({
  rootCaptureKitScaffolder: "scripts/scaffold-root-capture-kit.mjs",
  rootCaptureKitScaffolderTests: "scripts/scaffold-root-capture-kit.test.mjs",
  rootCaptureCandidatePreparer: "scripts/prepare-root-capture-candidate.mjs",
  rootCaptureCandidatePreparerTests:
    "scripts/prepare-root-capture-candidate.test.mjs",
  successorGenerator: GENERATOR_RELATIVE,
  successorTests: TEST_RELATIVE,
});

const EXPECTED_KIT_FILES = Object.freeze([
  "OPERATOR_CARD.md",
  "README.md",
  "frames/README.md",
  "kit-manifest.json",
  "launch-projector-empty.sh",
  "runtime/runtime-executable-sha256.txt",
  "runtime-source/source.swf",
  "sandbox.sb",
  "templates/capture-session-attestation.template.json",
  "templates/display-list-states.schema.template.jsonl",
  "templates/operation-log.schema.template.jsonl",
  "templates/runtime-toolchain-receipt.template.json",
  "templates/source-open-launch-receipt.template.json",
]);

const ACCEPTANCE_EFFECTS = Object.freeze({
  swfFlaAuditCompletion: false,
  frameDomainCompletion: false,
  actionScriptAuditCompletion: false,
  originalRuntimeEvidence: false,
  ruffleBaselineAuthority: false,
  englishSpanishBehaviorAcceptance: false,
  audioCueAcceptance: false,
  keyframeAcceptance: false,
  javascriptRendererImplementation: false,
  currentJavascriptRegistration: false,
  behaviorAcceptance: false,
  fullFrameRmseAcceptance: false,
  humanVisualReview: false,
  engineeringReview: false,
  ownerAcceptance: false,
  strictCompletion: false,
  wholeLessonIntegration: false,
  publication: false,
});

const PUBLICATION_CONTRACT = Object.freeze({
  appendOnly: true,
  atomicPerArtifact: true,
  existingDifferentBytesRejected: true,
  partialExistingPairRejected: true,
  checkWrites: 0,
});

const SAFETY_BOUNDARY = Object.freeze({
  projectorLaunched: false,
  animateLaunched: false,
  gitInvoked: false,
  sourceAssetsWritten: false,
  v2RootWritten: false,
  migrationStatusWritten: false,
  reportIsOriginalRuntimeEvidence: false,
  reportIsRuffleAuthority: false,
  reportIsHumanOrOwnerReview: false,
  operatorReady: false,
});

const REMAINING_WORK = Object.freeze({
  externalNamedOperatorAuthorizationRequired: true,
  authorizedDisposableOfflineEnvironmentPreflightRequired: true,
  outsideKitSessionOutputRootPreflightRequired: true,
  freshStorageCapacityPreflightRequired: true,
  realRuntimeSessionsRequired: 94,
  losslessFrameCapturesRequired: 1020,
  bilingualAndAudioVerificationRequired: true,
  keyframeAndRendererWorkRequired: true,
  behaviorAndFullFrameRmseRequired: true,
  humanReviewRequired: true,
  ownerReviewRequired: true,
  strictCompletionRequired: true,
  wholeLessonIntegrationRequired: true,
  publicationApprovalRequired: true,
});

const V3_TECHNICAL_IDENTITY_CONTRACT = Object.freeze({
  comparisonBasis:
    "exact-full-immutable-v2-manifest-after-two-explicit-v3-only-deltas",
  allowedV3OnlyDifferences: Object.freeze([
    "evidenceProtocol-added-as-exact-protocol-v3-manifest",
    "runtime.identityReceipt.file-moved-from-exact-v2-kit-root-to-exact-v3-kit-root",
  ]),
  immutableV2ManifestProjectionMatched: true,
  currentRawTraceSpecFileSha256Reverified: true,
  currentRawTraceSpecIndexSha256Reverified: true,
  upstreamProjectionCurrentnessEstablished: false,
});

let publicationSequence = 0;

function invariant(condition, message) {
  if (!condition) {
    throw new Error(`G4 L10 root-capture protocol-v3 successor: ${message}`);
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function modeOf(info) {
  const value = typeof info.mode === "bigint"
    ? Number(info.mode & 0o7777n)
    : info.mode & 0o7777;
  return value.toString(8).padStart(4, "0");
}

function sameIdentity(left, right) {
  return left.dev === right.dev
    && left.ino === right.ino
    && left.size === right.size
    && left.mode === right.mode
    && left.mtimeNs === right.mtimeNs
    && left.ctimeNs === right.ctimeNs
    && left.nlink === right.nlink;
}

function sameNode(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

function projectPath(root, relative, label = relative) {
  invariant(typeof relative === "string" && relative.length > 0,
    `${label} path is empty`);
  invariant(!path.isAbsolute(relative) && !relative.includes("\\"),
    `${label} is not portable project-relative`);
  const normalized = portable(path.normalize(relative));
  invariant(normalized === relative && relative !== ".."
    && !relative.startsWith("../"), `${label} escapes the project`);
  const candidate = path.resolve(root, relative);
  const relation = path.relative(root, candidate);
  invariant(relation !== ".." && !relation.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relation), `${label} escapes the project`);
  return candidate;
}

async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function lstatIfPresent(candidate) {
  try {
    return await lstat(candidate, {bigint: true});
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function readStableRegularFile(absolute, declaredFile) {
  const before = await lstat(absolute, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink()
    && before.nlink === 1n,
  `${declaredFile} must be one regular, single-link file`);
  const contents = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  invariant(sameIdentity(before, after), `${declaredFile} changed while read`);
  return {
    contents,
    identity: after,
    descriptor: {
      file: declaredFile,
      bytes: contents.length,
      sha256: sha256(contents),
      mode: modeOf(after),
    },
  };
}

async function readProjectFile(root, relative) {
  return readStableRegularFile(projectPath(root, relative), relative);
}

function assertDescriptor(descriptor, label) {
  invariant(descriptor && typeof descriptor.file === "string"
    && Number.isInteger(descriptor.bytes) && descriptor.bytes >= 0
    && HASH.test(descriptor.sha256 || "")
    && /^[0-7]{4}$/u.test(descriptor.mode || ""),
  `${label} descriptor is invalid`);
}

async function inventoryRegularFiles(directory, projectRoot, relative = "") {
  const info = await lstat(directory, {bigint: true});
  invariant(info.isDirectory() && !info.isSymbolicLink(),
    `${portable(path.relative(projectRoot, directory))} is not one real directory`);
  const entries = await readdir(directory);
  entries.sort();
  const records = [];
  for (const name of entries) {
    const absolute = path.join(directory, name);
    const childRelative = relative ? `${relative}/${name}` : name;
    const child = await lstat(absolute, {bigint: true});
    invariant(!child.isSymbolicLink(),
      `${portable(path.relative(projectRoot, absolute))} is a symbolic link`);
    if (child.isDirectory()) {
      records.push(...await inventoryRegularFiles(
        absolute,
        projectRoot,
        childRelative,
      ));
      continue;
    }
    invariant(child.isFile() && child.nlink === 1n,
      `${portable(path.relative(projectRoot, absolute))} is not one regular, single-link file`);
    const item = await readStableRegularFile(absolute, childRelative);
    records.push(item.descriptor);
  }
  return records;
}

async function inspectPredecessorArtifact(root, expected, label) {
  const item = await readProjectFile(root, expected.file);
  invariant(item.descriptor.bytes === expected.bytes
    && item.descriptor.sha256 === expected.sha256,
  `${label} immutable bytes or SHA-256 drifted`);
  return item;
}

function kitSetIdentity(kits) {
  return sha256(Buffer.from(stableJson(kits.map((kit) => ({
    ordinal: kit.ordinal,
    animationId: kit.animationId,
    requirementId: kit.requirementId,
    language: kit.language,
    frameCount: kit.frameCount,
    captureKitManifestSha256: kit.captureKitManifestSha256,
    fileCount: kit.tree.fileCount,
    totalBytes: kit.tree.totalBytes,
    treeSha256: kit.tree.sha256,
  })))));
}

function assertManifestAcceptanceNeutral(manifest, expected, protocolV3) {
  invariant(manifest?.schemaVersion === 1
    && manifest.artifactType === "root-frame-accurate-capture-operator-kit"
    && manifest.status === ROOT_CAPTURE_TEMPLATE_STATUS
    && manifest.notEvidence === true
    && manifest.strictAcceptanceEffect === false
    && manifest.migrationStatusChanged === false
    && manifest.humanReviewRecorded === false
    && manifest.ownerReviewRecorded === false,
  `${expected.animationId}/${expected.requirementId} acceptance-neutral manifest drifted`);
  invariant(manifest.animationId === expected.animationId
    && manifest.requirementId === expected.requirementId
    && manifest.identity?.language === expected.language
    && manifest.frameDomain?.id === "root"
    && manifest.frameDomain?.frameCount === expected.frameCount
    && sameJson(manifest.frameDomain?.nativeStage, expected.nativeStage)
    && sameJson(manifest.captureRaster || null, expected.captureRaster || null),
  `${expected.animationId}/${expected.requirementId} identity/frame/stage drifted`);
  invariant(manifest.stagedSource?.staged?.file === "runtime-source/source.swf"
    && manifest.stagedSource.staged.sha256 === expected.sourceSwfSha256
    && manifest.stagedSource.copiedByteForByte === true
    && manifest.stagedSource.sourceAssetsLaunchedDirectly === false
    && manifest.runtime?.executableSha256
      === expected.runtimeExecutableSha256,
  `${expected.animationId}/${expected.requirementId} source/runtime binding drifted`);
  if (protocolV3) {
    invariant(sameJson(manifest.evidenceProtocol,
      rootCaptureV3ProtocolManifest()),
    `${expected.animationId}/${expected.requirementId} protocol-v3 DAG drifted`);
    invariant(manifest.runtime?.identityReceipt?.file?.startsWith(
      `${DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT}/${expected.animationId}/${expected.requirementId}/`),
    `${expected.animationId}/${expected.requirementId} v3 output-root binding drifted`);
  } else {
    invariant(!Object.hasOwn(manifest, "evidenceProtocol"),
      `${expected.animationId}/${expected.requirementId} legacy v2 manifest drifted`);
  }
}

function assertExactV3TechnicalProjection({manifest, immutableV2Manifest, expected}) {
  const label = `${expected.animationId}/${expected.requirementId}`;
  const expectedV2IdentityReceipt =
    `${DEFAULT_ROOT_CAPTURE_KIT_ROOT}/${expected.animationId}/${expected.requirementId}/runtime/runtime-executable-sha256.txt`;
  const expectedV3IdentityReceipt =
    `${DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT}/${expected.animationId}/${expected.requirementId}/runtime/runtime-executable-sha256.txt`;
  invariant(immutableV2Manifest.runtime?.identityReceipt?.file
      === expectedV2IdentityReceipt,
  `${label} immutable v2 identity-receipt path drifted`);
  invariant(manifest.runtime?.identityReceipt?.file === expectedV3IdentityReceipt,
    `${label} v3 identity-receipt path is not the exact parallel-root successor`);
  const normalizedV3 = structuredClone(manifest);
  delete normalizedV3.evidenceProtocol;
  normalizedV3.runtime.identityReceipt.file = expectedV2IdentityReceipt;
  invariant(sameJson(normalizedV3, immutableV2Manifest),
    `${label} v3 full technical projection differs from immutable v2 manifest outside the two allowed protocol-v3 deltas`);
}

async function inspectV2LegacyKit(root, expected) {
  const expectedRoot =
    `${DEFAULT_ROOT_CAPTURE_KIT_ROOT}/${expected.animationId}/${expected.requirementId}`;
  invariant(expected.kitRoot === expectedRoot,
    `${expected.animationId}/${expected.requirementId} predecessor kitRoot drifted`);
  const absolute = projectPath(root, expectedRoot, "v2 legacy kit root");
  const files = await inventoryRegularFiles(absolute, root);
  invariant(sameJson(files.map(({file}) => file), EXPECTED_KIT_FILES),
    `${expectedRoot} has a missing or extra file`);
  const fileCount = files.length;
  const totalBytes = files.reduce((total, file) => total + file.bytes, 0);
  const treeSha256 = sha256(Buffer.from(stableJson(files)));
  invariant(fileCount === expected.fileCount
    && totalBytes === expected.totalBytes
    && treeSha256 === expected.treeSha256,
  `${expectedRoot} immutable tree descriptor drifted`);
  const manifestFile = files.find(({file}) => file === "kit-manifest.json");
  invariant(manifestFile.sha256 === expected.captureKitManifestSha256,
    `${expectedRoot} immutable manifest hash drifted`);
  const manifest = JSON.parse((await readStableRegularFile(
    path.join(absolute, "kit-manifest.json"),
    `${expectedRoot}/kit-manifest.json`,
  )).contents.toString("utf8"));
  assertManifestAcceptanceNeutral(manifest, expected, false);
  return {
    manifest,
    kit: {
      ordinal: expected.ordinal,
      animationId: expected.animationId,
      requirementId: expected.requirementId,
      language: expected.language,
      frameCount: expected.frameCount,
      nativeStage: expected.nativeStage,
      captureRaster: expected.captureRaster,
      sourceSwfSha256: expected.sourceSwfSha256,
      captureKitManifestSha256: manifestFile.sha256,
      tree: {
        algorithm: "stable-json-sorted-relative-file-descriptors-sha256-v1",
        fileCount,
        totalBytes,
        sha256: treeSha256,
      },
    },
  };
}

function assertV3TemplateContracts({root, kitRoot, manifest, files}) {
  const parse = async (relative) => JSON.parse((await readStableRegularFile(
    path.join(kitRoot, relative),
    `${portable(path.relative(root, kitRoot))}/${relative}`,
  )).contents.toString("utf8"));
  return Promise.all([
    parse("templates/source-open-launch-receipt.template.json"),
    parse("templates/runtime-toolchain-receipt.template.json"),
    parse("templates/capture-session-attestation.template.json"),
  ]).then(([launch, toolchain, attestation]) => {
    invariant(launch.schemaVersion === 3
      && launch.evidenceType
        === "named-human-hash-bound-root-source-open-start-receipt"
      && launch.templateStatus === ROOT_CAPTURE_TEMPLATE_STATUS
      && launch.notEvidence === true
      && Object.hasOwn(launch, "finalizedAt")
      && launch.finalizedAt === null
      && !Object.hasOwn(launch, "endedAt")
      && launch.sessionId === ""
      && launch.receiptSha256 === null,
    `${manifest.animationId}/${manifest.requirementId} launch-start template drifted`);
    invariant(toolchain.schemaVersion === 1
      && toolchain.evidenceType
        === "human-attested-adobe-runtime-toolchain-receipt"
      && toolchain.captureSessionBinding?.sessionId === ""
      && toolchain.captureSessionBinding?.launchReceiptSha256 === null
      && toolchain.capturedAt === null,
    `${manifest.animationId}/${manifest.requirementId} toolchain template drifted`);
    invariant(attestation.schemaVersion === 1
      && attestation.evidenceType
        === "named-human-root-capture-session-attestation"
      && attestation.sessionId === ""
      && attestation.startedAt === null
      && attestation.endedAt === null
      && attestation.signedAt === null
      && attestation.attestationSha256 === null
      && Array.isArray(attestation.frameSet?.frames)
      && attestation.frameSet.frames.length === 0,
    `${manifest.animationId}/${manifest.requirementId} attestation template drifted`);
    invariant(!files.some(({file}) => /\.png$/iu.test(file)),
      `${manifest.animationId}/${manifest.requirementId} contains a captured PNG`);
  });
}

async function inspectV3Kit(root, expected, immutableV2Manifest) {
  const kitRelative =
    `${DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT}/${expected.animationId}/${expected.requirementId}`;
  const kitRoot = projectPath(root, kitRelative, "v3 successor kit root");
  const files = await inventoryRegularFiles(kitRoot, root);
  invariant(sameJson(files.map(({file}) => file), EXPECTED_KIT_FILES),
    `${kitRelative} has a missing or extra file`);
  for (const file of files) {
    invariant(file.mode === (file.file === "launch-projector-empty.sh"
      ? "0555" : "0444"),
    `${kitRelative}/${file.file} immutable mode drifted`);
  }
  const manifestRead = await readStableRegularFile(
    path.join(kitRoot, "kit-manifest.json"),
    `${kitRelative}/kit-manifest.json`,
  );
  const manifest = JSON.parse(manifestRead.contents.toString("utf8"));
  assertManifestAcceptanceNeutral(manifest, expected, true);
  assertExactV3TechnicalProjection({
    manifest,
    immutableV2Manifest,
    expected,
  });
  const [traceSpecRead, traceSpecIndexRead] = await Promise.all([
    readProjectFile(root, manifest.bindings.traceSpec.file),
    readProjectFile(root, manifest.bindings.traceSpecIndex.file),
  ]);
  invariant(traceSpecRead.descriptor.sha256
      === manifest.bindings.traceSpec.sha256,
  `${expected.animationId}/${expected.requirementId} current raw trace-spec SHA-256 drifted`);
  invariant(traceSpecIndexRead.descriptor.sha256
      === manifest.bindings.traceSpecIndex.sha256,
  `${expected.animationId}/${expected.requirementId} current raw trace-spec-index SHA-256 drifted`);
  const sourceRead = await readStableRegularFile(
    path.join(kitRoot, "runtime-source/source.swf"),
    `${kitRelative}/runtime-source/source.swf`,
  );
  invariant(sourceRead.descriptor.sha256 === expected.sourceSwfSha256
    && sourceRead.descriptor.sha256 === manifest.stagedSource.staged.sha256,
  `${kitRelative} staged source bytes drifted`);

  const expectedFiles = renderUnsignedTemplateFiles({
    root,
    manifest,
    sourceBytes: sourceRead.contents,
  });
  invariant(sameJson(
    [...expectedFiles.keys()].sort(),
    [...EXPECTED_KIT_FILES].sort(),
  ),
    `${kitRelative} current scaffolder rendered an unexpected file contract`);
  for (const file of files) {
    const expectedContents = expectedFiles.get(file.file);
    invariant(expectedContents !== undefined,
      `${kitRelative}/${file.file} is not in the deterministic render`);
    const expectedBytes = Buffer.isBuffer(expectedContents)
      ? expectedContents
      : Buffer.from(expectedContents);
    invariant(file.bytes === expectedBytes.length
      && file.sha256 === sha256(expectedBytes),
    `${kitRelative}/${file.file} differs from the deterministic render`);
  }
  await assertV3TemplateContracts({root, kitRoot, manifest, files});

  const fileCount = files.length;
  const totalBytes = files.reduce((total, file) => total + file.bytes, 0);
  const treeSha256 = sha256(Buffer.from(stableJson(files)));
  return {
    ordinal: expected.ordinal,
    animationId: expected.animationId,
    requirementId: expected.requirementId,
    language: expected.language,
    frameCount: expected.frameCount,
    nativeStage: expected.nativeStage,
    captureRaster: expected.captureRaster,
    sourceSwfSha256: sourceRead.descriptor.sha256,
    captureKitManifestSha256: manifestRead.descriptor.sha256,
    technicalIdentity: {
      ...V3_TECHNICAL_IDENTITY_CONTRACT,
      immutableV2ManifestSha256: expected.captureKitManifestSha256,
      immutableV2TraceSpec: immutableV2Manifest.bindings.traceSpec,
      immutableV2TraceSpecIndex: immutableV2Manifest.bindings.traceSpecIndex,
      currentRawTraceSpec: traceSpecRead.descriptor,
      currentRawTraceSpecIndex: traceSpecIndexRead.descriptor,
    },
    tree: {
      algorithm: "stable-json-sorted-relative-file-descriptors-sha256-v1",
      fileCount,
      totalBytes,
      sha256: treeSha256,
    },
  };
}

function summarizeKits(kits) {
  const fileCounts = new Set(kits.map(({tree}) => tree.fileCount));
  return {
    releaseMembers: new Set(kits.map(({animationId}) => animationId)).size,
    rootTraceSpecs: kits.length,
    englishKits: kits.filter(({language}) => language === "en").length,
    spanishKits: kits.filter(({language}) => language === "es").length,
    exactKits: kits.length,
    files: kits.reduce((total, kit) => total + kit.tree.fileCount, 0),
    filesPerKit: fileCounts.size === 1 ? kits[0]?.tree.fileCount ?? null : null,
    totalKitBytes: kits.reduce((total, kit) =>
      total + kit.tree.totalBytes, 0),
    stagedSwfCopies: kits.length,
    uniqueStagedSwfHashes:
      new Set(kits.map(({sourceSwfSha256}) => sourceSwfSha256)).size,
    futureRootFrameCaptureObligations: kits.reduce((total, kit) =>
      total + kit.frameCount, 0),
    capturePngs: 0,
    frameReadmePlaceholders: kits.length,
    fractionalNativeStageKits: kits.filter(({captureRaster}) =>
      captureRaster !== null).length,
    actualRuntimeReceipts: 0,
    actualLaunchReceipts: 0,
    actualSessionAttestations: 0,
    actualRuntimeSessions: 0,
  };
}

function assertSummary(summary, label, expectedBytes = null) {
  invariant(summary.releaseMembers === 47
    && summary.rootTraceSpecs === 94
    && summary.englishKits === 47
    && summary.spanishKits === 47
    && summary.exactKits === 94
    && summary.files === 1222
    && summary.filesPerKit === 13
    && summary.stagedSwfCopies === 94
    && summary.uniqueStagedSwfHashes === 47
    && summary.futureRootFrameCaptureObligations === 1020
    && summary.capturePngs === 0
    && summary.frameReadmePlaceholders === 94
    && summary.fractionalNativeStageKits === 8
    && summary.actualRuntimeReceipts === 0
    && summary.actualLaunchReceipts === 0
    && summary.actualSessionAttestations === 0
    && summary.actualRuntimeSessions === 0,
  `${label} 47/94/1222/1020 arithmetic or zero-evidence boundary drifted`);
  if (expectedBytes !== null) {
    invariant(summary.totalKitBytes === expectedBytes,
      `${label} immutable byte total drifted`);
  }
}

function assertArtifactBinding(binding, expected, label) {
  assertDescriptor(binding, label);
  invariant(binding.file === expected.file
    && binding.bytes === expected.bytes
    && binding.sha256 === expected.sha256,
  `${label} exact predecessor binding drifted`);
}

export function assertG4L10RootCaptureKitProtocolV3Successor(report) {
  invariant(report?.schemaVersion === 1
    && report.reportType
      === "g4-l10-root-capture-kit-protocol-v3-successor"
    && report.releaseId === RELEASE_ID
    && report.status
      === "materialized-unsigned-protocol-successor-not-operator-ready-not-evidence"
    && report.evidenceClass
      === "acceptance-neutral-append-only-acyclic-root-capture-protocol-successor",
  "schema, type, release, status, or evidence class drifted");
  for (const version of ["v1", "v2"]) {
    for (const format of ["json", "markdown"]) {
      assertArtifactBinding(
        report.predecessors[version].artifacts[format],
        EXPECTED_PREDECESSOR_ARTIFACTS[version][format],
        `predecessors.${version}.artifacts.${format}`,
      );
    }
    invariant(report.predecessors[version].immutable === true
      && report.predecessors[version].rewrittenBySuccessor === false,
    `predecessors.${version} append-only preservation drifted`);
  }
  invariant(report.predecessors.v2.currentRegeneration.attempted === false
    && report.predecessors.v2.currentRegeneration.required === false
    && report.predecessors.v2.currentRegeneration.mayBeStaleAfterSuccessorToolingChanges
      === true
    && report.predecessors.v2.currentRegeneration.validationBasis
      === "immutable-v2-artifact-bytes-plus-independent-v2-tree-reverification",
  "v2 current-regeneration boundary drifted");

  invariant(report.protocol.schemaVersion === 3
    && report.protocol.name === ROOT_CAPTURE_V3_PROTOCOL_NAME
    && report.protocol.outputRoot === DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT
    && sameJson(report.protocol.evidenceOrder,
      ROOT_CAPTURE_V3_EVIDENCE_ORDER)
    && report.protocol.postHocLaunchOrToolchainReceiptsAllowed === false
    && report.protocol.operatorReadiness.operatorReady === false
    && report.protocol.operatorReadiness.status
      === "blocked-pending-external-authorization-and-preflight"
    && sameJson(report.protocol.operatorReadiness.requiredPreflights,
      ROOT_CAPTURE_V3_REQUIRED_PREFLIGHTS),
  "acyclic protocol or blocked operator-readiness boundary drifted");

  invariant(report.v2LegacyRoot.root === DEFAULT_ROOT_CAPTURE_KIT_ROOT
    && report.v2LegacyRoot.status
      === "preserved-legacy-unsigned-preparation-only"
    && report.v2LegacyRoot.rewrittenBySuccessor === false
    && report.v2LegacyRoot.currentTreeIndependentlyReverified === true,
  "v2 legacy-root preservation boundary drifted");
  invariant(report.v3ParallelRoot.root === DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT
    && report.v3ParallelRoot.status
      === "materialized-unsigned-protocol-v3-template-only"
    && report.v3ParallelRoot.protocolName === ROOT_CAPTURE_V3_PROTOCOL_NAME
    && report.v3ParallelRoot.operatorReady === false
    && report.v3ParallelRoot.currentTreeIndependentlyReverified === true
    && sameJson(report.v3ParallelRoot.technicalIdentityContract,
      V3_TECHNICAL_IDENTITY_CONTRACT),
  "v3 parallel-root boundary drifted");
  assertSummary(report.v2LegacyRoot.summary, "v2 legacy root", 36596882);
  assertSummary(report.v3ParallelRoot.summary, "v3 parallel root");
  invariant(Array.isArray(report.v2LegacyRoot.kits)
    && report.v2LegacyRoot.kits.length === 94
    && Array.isArray(report.v3ParallelRoot.kits)
    && report.v3ParallelRoot.kits.length === 94,
  "v2/v3 kit inventories are not exact 94-member sets");
  invariant(report.v2LegacyRoot.kitSetSha256
      === kitSetIdentity(report.v2LegacyRoot.kits)
    && report.v3ParallelRoot.kitSetSha256
      === kitSetIdentity(report.v3ParallelRoot.kits),
  "v2/v3 deterministic kit-set SHA-256 drifted");
  for (const [index, v3] of report.v3ParallelRoot.kits.entries()) {
    const v2 = report.v2LegacyRoot.kits[index];
    const language = index % 2 === 0 ? "en" : "es";
    const {
      immutableV2ManifestSha256,
      immutableV2TraceSpec,
      immutableV2TraceSpecIndex,
      currentRawTraceSpec,
      currentRawTraceSpecIndex,
      ...technicalIdentityContract
    } = v3.technicalIdentity || {};
    assertDescriptor(currentRawTraceSpec,
      `v3 kit ${index + 1} current raw trace spec`);
    assertDescriptor(currentRawTraceSpecIndex,
      `v3 kit ${index + 1} current raw trace-spec index`);
    invariant(v3.ordinal === Math.floor(index / 2) + 1
      && v3.language === language
      && v3.requirementId === `req-default-root-${language}`
      && v3.animationId === v2.animationId
      && v3.requirementId === v2.requirementId
      && v3.frameCount === v2.frameCount
      && v3.sourceSwfSha256 === v2.sourceSwfSha256
      && sameJson(technicalIdentityContract, V3_TECHNICAL_IDENTITY_CONTRACT)
      && immutableV2ManifestSha256 === v2.captureKitManifestSha256
      && immutableV2TraceSpec?.file === currentRawTraceSpec.file
      && immutableV2TraceSpec?.sha256 === currentRawTraceSpec.sha256
      && immutableV2TraceSpecIndex?.file === currentRawTraceSpecIndex.file
      && immutableV2TraceSpecIndex?.sha256 === currentRawTraceSpecIndex.sha256
      && v3.tree.fileCount === 13
      && HASH.test(v3.tree.sha256 || "")
      && HASH.test(v3.captureKitManifestSha256 || ""),
    `v2/v3 kit identity ${index + 1} drifted`);
  }
  for (const [key, descriptor] of Object.entries(report.tooling)) {
    assertDescriptor(descriptor, `tooling.${key}`);
    invariant(descriptor.file === TOOLING_FILES[key],
      `tooling.${key} path drifted`);
  }
  invariant(sameJson(report.acceptanceEffects, ACCEPTANCE_EFFECTS)
    && Object.values(report.acceptanceEffects).every((value) => value === false)
    && report.strictAcceptanceEffect === "none"
    && sameJson(report.safety, SAFETY_BOUNDARY)
    && sameJson(report.remainingWork, REMAINING_WORK),
  "acceptance or safety boundary advanced");
  invariant(sameJson(report.publication, PUBLICATION_CONTRACT),
  "append-only publication/check contract drifted");
  return true;
}

function renderMarkdown(report, jsonIdentity) {
  return [
    "# G4 L10 root-capture protocol-v3 successor",
    "",
    "This append-only successor preserves the immutable v1/v2 reconcile receipts and the legacy v2 kit tree while binding a separate protocol-v3 tree. It corrects the receipt chronology only. It is not operator authorization, runtime evidence, human review, owner acceptance, strict completion, integration, or publication approval.",
    "",
    "## Outcome",
    "",
    `- Legacy v2 root: **${report.v2LegacyRoot.summary.exactKits} kits / ${report.v2LegacyRoot.summary.files} files / ${report.v2LegacyRoot.summary.totalKitBytes} bytes / ${report.v2LegacyRoot.summary.futureRootFrameCaptureObligations} future frames**; preserved and independently reverified.`,
    `- Parallel v3 root: **${report.v3ParallelRoot.summary.exactKits} kits / ${report.v3ParallelRoot.summary.files} files / ${report.v3ParallelRoot.summary.futureRootFrameCaptureObligations} future frames**.`,
    `- V3 languages: **${report.v3ParallelRoot.summary.englishKits} EN + ${report.v3ParallelRoot.summary.spanishKits} ES**.`,
    `- Captured PNGs / receipts / sessions: **0 / 0 / 0**.`,
    `- V3 deterministic kit-set SHA-256: \`${report.v3ParallelRoot.kitSetSha256}\`.`,
    `- JSON identity: \`${jsonIdentity.sha256}\` (${jsonIdentity.bytes} bytes).`,
    "",
    "## Immutable predecessors",
    "",
    `- v1 JSON: \`${report.predecessors.v1.artifacts.json.sha256}\` (${report.predecessors.v1.artifacts.json.bytes} bytes).`,
    `- v1 Markdown: \`${report.predecessors.v1.artifacts.markdown.sha256}\` (${report.predecessors.v1.artifacts.markdown.bytes} bytes).`,
    `- v2 JSON: \`${report.predecessors.v2.artifacts.json.sha256}\` (${report.predecessors.v2.artifacts.json.bytes} bytes).`,
    `- v2 Markdown: \`${report.predecessors.v2.artifacts.markdown.sha256}\` (${report.predecessors.v2.artifacts.markdown.bytes} bytes).`,
    "- The successor never rewrites v1/v2. A current v2 regeneration can be stale after successor scaffolder/preparer hash changes; predecessor validity is instead bound to exact immutable report bytes and independent verification of the exact legacy tree.",
    "",
    "## Protocol boundary",
    "",
    `- Name: \`${report.protocol.name}\`.`,
    "- One-way order: finalized schema-v3 source-open start receipt, then captured toolchain receipt, then capture-session start and live records, then final signed attestation.",
    "- Post-hoc launch/toolchain receipts are prohibited.",
    "- Operator ready: `false`.",
    ...report.protocol.operatorReadiness.requiredPreflights.map((item) =>
      `- Required preflight: \`${item}\`.`),
    "",
    "## Acceptance boundary",
    "",
    ...Object.entries(report.acceptanceEffects)
      .map(([key, value]) => `- ${key}: \`${value}\``),
    "",
    `Strict acceptance effect: **${report.strictAcceptanceEffect}**.`,
    "",
    "All 1,020 real frames, named operator authorization, environment/output-root/fresh-capacity preflights, runtime source-open sessions, bilingual/audio decisions, comparisons, reviews, renderer work, lesson integration, and publication remain open.",
    "",
  ].join("\n");
}

async function inspectOutput(root, relative, contents) {
  const target = projectPath(root, relative, "successor output");
  const info = await lstatIfPresent(target);
  if (!info) return {target, exists: false, matches: false, identity: null};
  const observed = await readStableRegularFile(target, relative);
  return {
    target,
    exists: true,
    matches: observed.contents.equals(contents),
    identity: observed.identity,
  };
}

async function removeOwnedPublishedLink(target, stagedIdentity) {
  const current = await lstatIfPresent(target);
  if (current && sameNode(current, stagedIdentity)) await unlink(target);
}

async function publishAppendOnlyPair(root, outputs, check) {
  const reportsRoot = projectPath(root, "reports", "reports root");
  const reportsInfo = await lstat(reportsRoot, {bigint: true});
  invariant(reportsInfo.isDirectory() && !reportsInfo.isSymbolicLink(),
    "reports root is not one real directory");
  const observed = await Promise.all(outputs.map(({relative, contents}) =>
    inspectOutput(root, relative, contents)));
  if (check) {
    invariant(observed.every(({exists, matches}) => exists && matches),
      "append-only successor outputs are missing or stale");
    return Object.fromEntries(outputs.map(({key}) => [key, "checked"]));
  }
  if (observed.every(({exists}) => exists)) {
    invariant(observed.every(({matches}) => matches),
      "append-only successor output differs from current bytes");
    return Object.fromEntries(outputs.map(({key}) => [key, "unchanged"]));
  }
  invariant(observed.every(({exists}) => !exists),
    "partial successor publication exists; refusing implicit repair");

  publicationSequence += 1;
  const staged = [];
  const published = [];
  try {
    for (const output of outputs) {
      const temporary = path.join(
        reportsRoot,
        `.${path.basename(output.relative)}.tmp-${process.pid}-${publicationSequence}`,
      );
      await writeFile(temporary, output.contents, {flag: "wx", mode: 0o644});
      const identity = await lstat(temporary, {bigint: true});
      staged.push({...output, temporary, identity});
    }
    for (const item of staged) {
      try {
        await link(item.temporary, projectPath(root, item.relative));
        published.push(item);
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
        const concurrent = await inspectOutput(root, item.relative, item.contents);
        invariant(concurrent.exists && concurrent.matches,
          `${item.relative} was concurrently published with different bytes`);
      }
    }
    for (const item of staged) await unlink(item.temporary);
    const final = await Promise.all(outputs.map(({relative, contents}) =>
      inspectOutput(root, relative, contents)));
    invariant(final.every(({exists, matches}) => exists && matches),
      "successor publication did not finish with an exact pair");
  } catch (error) {
    for (const item of published.reverse()) {
      await removeOwnedPublishedLink(
        projectPath(root, item.relative),
        item.identity,
      );
    }
    throw error;
  } finally {
    for (const item of staged) {
      await unlink(item.temporary).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
    }
  }
  return Object.fromEntries(outputs.map(({key}) => [key, "written"]));
}

export async function buildG4L10RootCaptureKitProtocolV3Successor({
  root = ROOT,
  persist = true,
  check = false,
} = {}) {
  invariant(typeof root === "string" && path.isAbsolute(root),
    "root must be one absolute path");
  const resolvedRoot = await realpath(root);
  invariant(resolvedRoot === root, "root must be canonical");
  invariant(typeof persist === "boolean" && typeof check === "boolean",
    "persist and check must be booleans");
  invariant(!check || persist, "check requires persist=true");

  const [v1Json, v1Markdown, v2Json, v2Markdown] = await Promise.all([
    inspectPredecessorArtifact(
      resolvedRoot,
      EXPECTED_PREDECESSOR_ARTIFACTS.v1.json,
      "v1 JSON",
    ),
    inspectPredecessorArtifact(
      resolvedRoot,
      EXPECTED_PREDECESSOR_ARTIFACTS.v1.markdown,
      "v1 Markdown",
    ),
    inspectPredecessorArtifact(
      resolvedRoot,
      EXPECTED_PREDECESSOR_ARTIFACTS.v2.json,
      "v2 JSON",
    ),
    inspectPredecessorArtifact(
      resolvedRoot,
      EXPECTED_PREDECESSOR_ARTIFACTS.v2.markdown,
      "v2 Markdown",
    ),
  ]);
  const v1Report = JSON.parse(v1Json.contents.toString("utf8"));
  const v2Report = JSON.parse(v2Json.contents.toString("utf8"));
  invariant(v1Report.reportType
      === "g4-l10-root-capture-kit-reconcile-receipt-v1"
    && v1Report.releaseId === RELEASE_ID,
  "immutable v1 JSON semantic identity drifted");
  invariant(v2Report.reportType
      === "g4-l10-root-capture-kit-reconcile-receipt-v2"
    && v2Report.releaseId === RELEASE_ID
    && v2Report.receiptVersion === 2
    && Array.isArray(v2Report.kits)
    && v2Report.kits.length === 94
    && v2Report.summary?.exactKits === 94
    && v2Report.summary?.files === 1222
    && v2Report.summary?.totalKitBytes === 36596882
    && v2Report.summary?.futureRootFrameCaptureObligations === 1020
    && v2Report.summary?.capturePngs === 0
    && Object.values(v2Report.acceptanceEffects || {})
      .every((value) => value === false),
  "immutable v2 JSON semantic boundary drifted");

  const v2Kits = [];
  const v3Kits = [];
  for (const expected of v2Report.kits) {
    const inspectedV2 = await inspectV2LegacyKit(resolvedRoot, expected);
    v2Kits.push(inspectedV2.kit);
    v3Kits.push(await inspectV3Kit(
      resolvedRoot,
      expected,
      inspectedV2.manifest,
    ));
  }
  const v2Summary = summarizeKits(v2Kits);
  const v3Summary = summarizeKits(v3Kits);
  assertSummary(v2Summary, "v2 legacy root", 36596882);
  assertSummary(v3Summary, "v3 parallel root");
  if (resolvedRoot === ROOT) {
    invariant(v3Summary.totalKitBytes === 36974668,
      "canonical v3 parallel-root exact byte total drifted");
  }
  invariant(v2Report.combinedKitTreeSha256 === sha256(Buffer.from(stableJson(
    v2Report.kits.map((kit) => ({
      ordinal: kit.ordinal,
      animationId: kit.animationId,
      requirementId: kit.requirementId,
      treeSha256: kit.treeSha256,
      fileCount: kit.fileCount,
      totalBytes: kit.totalBytes,
    })),
  ))), "immutable v2 combined kit-tree identity drifted");

  const toolingEntries = await Promise.all(Object.entries(TOOLING_FILES)
    .map(async ([key, relative]) => [
      key,
      (await readProjectFile(resolvedRoot, relative)).descriptor,
    ]));
  const tooling = Object.fromEntries(toolingEntries);
  const protocol = rootCaptureV3ProtocolManifest();
  const report = {
    schemaVersion: 1,
    reportType: "g4-l10-root-capture-kit-protocol-v3-successor",
    releaseId: RELEASE_ID,
    status:
      "materialized-unsigned-protocol-successor-not-operator-ready-not-evidence",
    evidenceClass:
      "acceptance-neutral-append-only-acyclic-root-capture-protocol-successor",
    predecessors: {
      v1: {
        immutable: true,
        rewrittenBySuccessor: false,
        artifacts: {
          json: v1Json.descriptor,
          markdown: v1Markdown.descriptor,
        },
      },
      v2: {
        immutable: true,
        rewrittenBySuccessor: false,
        artifacts: {
          json: v2Json.descriptor,
          markdown: v2Markdown.descriptor,
        },
        currentRegeneration: {
          attempted: false,
          required: false,
          mayBeStaleAfterSuccessorToolingChanges: true,
          validationBasis:
            "immutable-v2-artifact-bytes-plus-independent-v2-tree-reverification",
          explanation:
            "The v2 report bound predecessor tool hashes. Protocol-v3 successor edits may make a fresh v2 regeneration differ; this successor never rewrites v2 and instead verifies its fixed artifacts and legacy tree independently.",
        },
      },
    },
    protocol,
    v2LegacyRoot: {
      root: DEFAULT_ROOT_CAPTURE_KIT_ROOT,
      status: "preserved-legacy-unsigned-preparation-only",
      rewrittenBySuccessor: false,
      currentTreeIndependentlyReverified: true,
      summary: v2Summary,
      kitSetSha256: kitSetIdentity(v2Kits),
      kits: v2Kits,
    },
    v3ParallelRoot: {
      root: DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT,
      status: "materialized-unsigned-protocol-v3-template-only",
      protocolName: ROOT_CAPTURE_V3_PROTOCOL_NAME,
      operatorReady: false,
      requiredPreflights: [...ROOT_CAPTURE_V3_REQUIRED_PREFLIGHTS],
      currentTreeIndependentlyReverified: true,
      technicalIdentityContract: {...V3_TECHNICAL_IDENTITY_CONTRACT},
      summary: v3Summary,
      kitSetSha256: kitSetIdentity(v3Kits),
      kits: v3Kits,
    },
    tooling,
    publication: {...PUBLICATION_CONTRACT},
    acceptanceEffects: ACCEPTANCE_EFFECTS,
    strictAcceptanceEffect: "none",
    safety: {...SAFETY_BOUNDARY},
    remainingWork: {...REMAINING_WORK},
  };
  assertG4L10RootCaptureKitProtocolV3Successor(report);
  const jsonContents = Buffer.from(stableJson(report));
  const jsonIdentity = {
    bytes: jsonContents.length,
    sha256: sha256(jsonContents),
  };
  const markdownContents = Buffer.from(renderMarkdown(report, jsonIdentity));
  const result = {
    report,
    json: {
      relative: REPORT_JSON_RELATIVE,
      contents: jsonContents,
      bytes: jsonContents.length,
      sha256: jsonIdentity.sha256,
    },
    markdown: {
      relative: REPORT_MARKDOWN_RELATIVE,
      contents: markdownContents,
      bytes: markdownContents.length,
      sha256: sha256(markdownContents),
    },
  };
  if (persist) {
    result.persistence = await publishAppendOnlyPair(resolvedRoot, [
      {key: "json", relative: REPORT_JSON_RELATIVE, contents: jsonContents},
      {
        key: "markdown",
        relative: REPORT_MARKDOWN_RELATIVE,
        contents: markdownContents,
      },
    ], check);
  }
  return result;
}

export function parseArguments(argv) {
  invariant(Array.isArray(argv), "arguments must be one array");
  if (argv.length === 0) return {check: false, help: false};
  if (argv.length === 1 && argv[0] === "--check") {
    return {check: true, help: false};
  }
  if (argv.length === 1 && (argv[0] === "--help" || argv[0] === "-h")) {
    return {check: false, help: true};
  }
  throw new Error(`Unknown or incompatible arguments: ${argv.join(" ")}`);
}

export function usage() {
  return [
    "Usage: node scripts/build-g4-l10-root-capture-kit-protocol-v3-successor.mjs [--check]",
    "",
    "Build or exact-byte check the append-only, acceptance-neutral L10 protocol-v3 successor receipt.",
    "The command independently verifies immutable v1/v2 predecessors plus the separate 94-kit protocol-v3 tree.",
    "It never launches Projector or Animate and does not make the unsigned kits operator-ready or authoritative.",
    "",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const result = await buildG4L10RootCaptureKitProtocolV3Successor({
    root: ROOT,
    persist: true,
    check: options.check,
  });
  process.stdout.write(`${JSON.stringify({
    status: options.check ? "checked" : "built",
    releaseId: RELEASE_ID,
    protocol: result.report.protocol.name,
    operatorReady: result.report.protocol.operatorReadiness.operatorReady,
    v2ExactKits: result.report.v2LegacyRoot.summary.exactKits,
    v3ExactKits: result.report.v3ParallelRoot.summary.exactKits,
    v3Files: result.report.v3ParallelRoot.summary.files,
    futureRootFrameCaptureObligations:
      result.report.v3ParallelRoot.summary.futureRootFrameCaptureObligations,
    capturedFrames: result.report.v3ParallelRoot.summary.capturePngs,
    strictAcceptanceEffect: result.report.strictAcceptanceEffect,
    json: {
      file: result.json.relative,
      bytes: result.json.bytes,
      sha256: result.json.sha256,
    },
    markdown: {
      file: result.markdown.relative,
      bytes: result.markdown.bytes,
      sha256: result.markdown.sha256,
    },
    persistence: result.persistence,
  }, null, 2)}\n`);
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
