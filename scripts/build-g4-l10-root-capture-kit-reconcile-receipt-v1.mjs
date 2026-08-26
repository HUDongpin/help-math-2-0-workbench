#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  access,
  link,
  lstat,
  readFile,
  readdir,
  realpath,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  DEFAULT_PROJECTOR_APP,
  inspectProjectorRuntime,
  sha256File,
} from "./scaffold-audio-runtime-session-kit.mjs";
import {
  DEFAULT_ROOT_CAPTURE_KIT_ROOT,
  ROOT_CAPTURE_TEMPLATE_STATUS,
  listReadyLessonReleaseRootSpecs,
  scaffoldRootCaptureKits,
} from "./scaffold-root-capture-kit.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = await realpath(path.resolve(path.dirname(SCRIPT_PATH), ".."));
const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const REPORT_JSON_RELATIVE =
  "reports/g4-l10-root-capture-kit-reconcile-receipt-v1.json";
const REPORT_MARKDOWN_RELATIVE =
  "reports/g4-l10-root-capture-kit-reconcile-receipt-v1.md";
const RECEIPT_TEST_RELATIVE =
  "scripts/build-g4-l10-root-capture-kit-reconcile-receipt-v1.test.mjs";
const RELEASE_INDEX_RELATIVE =
  "migrations/lesson-release-trace-spec-indexes/lesson-g04-l10-perimeter-area.json";
const SOURCE_MANIFEST_RELATIVE = "catalog/source-manifest.sha256";
const SOURCE_FREEZE_RELATIVE = "catalog/source-freeze.json";
const SOURCE_MANIFEST_SHA256 =
  "f0a33c8a3d15afd7340e9ea5523385428bae7546bd8d4227a3a8977ab8914318";
const PROJECTOR_VERSION = "32.0.0.414";
const PROJECTOR_EXECUTABLE_SHA256 =
  "8f4e10c8c28698f3429a1489f9592f6ae5697fb6eb7d15c4cfe83e925b1ebc30";
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
const PRE_EXISTING_KITS = Object.freeze([
  Object.freeze({
    animationId: "course-g04-l10-vb-003",
    requirementId: "req-default-root-en",
  }),
  Object.freeze({
    animationId: "course-g04-l10-vb-003",
    requirementId: "req-default-root-es",
  }),
]);
const TOOLING_FILES = Object.freeze({
  rootTraceSpecContract: "scripts/lib/root-trace-spec-contract.mjs",
  rootCaptureKitScaffolder: "scripts/scaffold-root-capture-kit.mjs",
  rootCaptureKitScaffolderTests: "scripts/scaffold-root-capture-kit.test.mjs",
  rootCaptureCandidatePreparer: "scripts/prepare-root-capture-candidate.mjs",
  rootCaptureCandidatePreparerTests:
    "scripts/prepare-root-capture-candidate.test.mjs",
  courseTraceSpecBuilder: "scripts/build-course-trace-specs.mjs",
  courseTraceSpecBuilderTests: "scripts/build-course-trace-specs.test.mjs",
  receiptGenerator:
    "scripts/build-g4-l10-root-capture-kit-reconcile-receipt-v1.mjs",
  receiptTests: RECEIPT_TEST_RELATIVE,
});
const ACCEPTANCE_EFFECTS = Object.freeze({
  swfFlaAuditCompletion: false,
  frameDomainCompletion: false,
  actionScriptAuditCompletion: false,
  originalRuntimeEvidence: false,
  ruffleBaselineAuthority: false,
  englishSpanishBehaviorAcceptance: false,
  audioCueAcceptance: false,
  keyframeAcceptance: false,
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
const HASH = /^[a-f0-9]{64}$/u;

function invariant(condition, message) {
  if (!condition) {
    throw new Error(`G4 L10 root-capture reconcile receipt v1: ${message}`);
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

function projectPath(root, relative, label = relative) {
  invariant(typeof relative === "string" && relative.length > 0,
    `${label} path is empty`);
  invariant(!path.isAbsolute(relative) && !relative.includes("\\"),
    `${label} path is not portable project-relative`);
  const normalized = portable(path.normalize(relative));
  invariant(normalized === relative && relative !== ".."
    && !relative.startsWith("../"), `${label} path escapes the project`);
  const candidate = path.resolve(root, relative);
  const relation = path.relative(root, candidate);
  invariant(relation !== ".." && !relation.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relation), `${label} path escapes the project`);
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

async function readStableRegularFile(absolute, declaredFile = absolute) {
  const before = await lstat(absolute, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${declaredFile} must be one regular, single-link file`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  invariant(sameIdentity(before, after),
    `${declaredFile} changed while it was read`);
  return {
    bytes,
    descriptor: {
      file: declaredFile,
      bytes: bytes.length,
      sha256: sha256(bytes),
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

async function inventoryRegularFiles(directory, relative = "") {
  const entries = await readdir(directory);
  entries.sort();
  const records = [];
  for (const name of entries) {
    const absolute = path.join(directory, name);
    const childRelative = relative ? `${relative}/${name}` : name;
    const info = await lstat(absolute, {bigint: true});
    invariant(!info.isSymbolicLink(),
      `${portable(path.relative(ROOT, absolute))} is a symbolic link`);
    if (info.isDirectory()) {
      records.push(...await inventoryRegularFiles(absolute, childRelative));
      continue;
    }
    invariant(info.isFile() && info.nlink === 1n,
      `${portable(path.relative(ROOT, absolute))} is not one regular, single-link file`);
    const item = await readStableRegularFile(absolute, childRelative);
    records.push({
      file: childRelative,
      bytes: item.descriptor.bytes,
      sha256: item.descriptor.sha256,
      mode: item.descriptor.mode,
    });
  }
  return records;
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function inspectOneKit({root, spec, checked}) {
  invariant(checked.status === "verified-unsigned-template-only"
    && checked.animationId === spec.animationId
    && checked.requirementId === spec.requirementId
    && checked.strictAcceptanceEffect === false
    && checked.migrationStatusChanged === false,
  `${spec.animationId}/${spec.requirementId} exact-check result drifted`);
  const kitRoot = path.join(
    root,
    DEFAULT_ROOT_CAPTURE_KIT_ROOT,
    spec.animationId,
    spec.requirementId,
  );
  invariant(path.resolve(checked.kitRoot) === kitRoot,
    `${spec.animationId}/${spec.requirementId} exact-check root drifted`);
  const files = await inventoryRegularFiles(kitRoot);
  invariant(sameJson(files.map(({file}) => file), EXPECTED_KIT_FILES),
    `${spec.animationId}/${spec.requirementId} has an unexpected file set`);
  for (const item of files) {
    invariant(item.mode === (item.file === "launch-projector-empty.sh"
      ? "0555" : "0444"),
    `${spec.animationId}/${spec.requirementId}/${item.file} mode drifted`);
  }
  const manifestFile = files.find(({file}) => file === "kit-manifest.json");
  const manifest = JSON.parse(
    await readFile(path.join(kitRoot, "kit-manifest.json"), "utf8"),
  );
  invariant(manifest.schemaVersion === 1
    && manifest.artifactType === "root-frame-accurate-capture-operator-kit"
    && manifest.status === ROOT_CAPTURE_TEMPLATE_STATUS
    && manifest.notEvidence === true
    && manifest.strictAcceptanceEffect === false
    && manifest.migrationStatusChanged === false
    && manifest.humanReviewRecorded === false
    && manifest.ownerReviewRecorded === false,
  `${spec.animationId}/${spec.requirementId} acceptance-neutral manifest drifted`);
  invariant(manifest.animationId === spec.animationId
    && manifest.requirementId === spec.requirementId
    && manifest.identity?.language === spec.language
    && manifest.frameDomain?.id === "root"
    && Number.isInteger(manifest.frameDomain?.frameCount)
    && manifest.frameDomain.frameCount > 0,
  `${spec.animationId}/${spec.requirementId} identity/frame-domain drifted`);
  invariant(manifest.runtime?.version === PROJECTOR_VERSION
    && manifest.runtime?.executableSha256 === PROJECTOR_EXECUTABLE_SHA256
    && manifest.stagedSource?.staged?.file === "runtime-source/source.swf"
    && manifest.stagedSource?.staged?.sha256 === checked.sourceSwfSha256
    && manifest.stagedSource?.copiedByteForByte === true
    && manifest.stagedSource?.sourceAssetsLaunchedDirectly === false,
  `${spec.animationId}/${spec.requirementId} runtime/staged-source binding drifted`);
  invariant(manifestFile.sha256 === checked.captureKitManifestSha256,
    `${spec.animationId}/${spec.requirementId} manifest check/hash drifted`);
  const stagedSource = files.find(({file}) => file === "runtime-source/source.swf");
  invariant(stagedSource.sha256 === checked.sourceSwfSha256,
    `${spec.animationId}/${spec.requirementId} staged source hash drifted`);
  const captureRaster = manifest.captureRaster || null;
  if (captureRaster) {
    invariant(
      sameJson(manifest.frameDomain.nativeStage,
        {width: 799.9, height: 599.75})
      && sameJson(captureRaster, {
        rule: "ceil-positive-native-stage-dimensions",
        width: 800,
        height: 600,
      }),
    `${spec.animationId}/${spec.requirementId} fractional-stage projection drifted`);
  } else {
    invariant(Number.isInteger(manifest.frameDomain.nativeStage?.width)
      && Number.isInteger(manifest.frameDomain.nativeStage?.height),
    `${spec.animationId}/${spec.requirementId} omitted a required capture raster`);
  }
  return {
    ordinal: spec.ordinal,
    animationId: spec.animationId,
    requirementId: spec.requirementId,
    language: spec.language,
    kitRoot: portable(path.relative(root, kitRoot)),
    traceSpec: {
      file: spec.file,
      sha256: checked.traceSpecSha256,
    },
    sourceSwfSha256: checked.sourceSwfSha256,
    runtimeExecutableSha256: checked.runtimeExecutableSha256,
    captureKitManifestSha256: checked.captureKitManifestSha256,
    frameCount: manifest.frameDomain.frameCount,
    nativeStage: manifest.frameDomain.nativeStage,
    captureRaster,
    fileCount: files.length,
    totalBytes: files.reduce((total, item) => total + item.bytes, 0),
    treeSha256: sha256(Buffer.from(stableJson(files))),
  };
}

async function inspectTransactionArtifacts(root, animationIds) {
  const outputRoot = projectPath(root, DEFAULT_ROOT_CAPTURE_KIT_ROOT);
  const rootEntries = await readdir(outputRoot);
  const transactionNamedEntries = rootEntries.filter((name) =>
    name.startsWith(".refresh-staging-")
    || name.startsWith(".refresh-backup-")
    || name.includes(".tmp-")
    || name.endsWith(".lock"));
  const refreshRoot = path.join(outputRoot, ".refresh-locks");
  const emptyHistoricalAnimationNamespaces = [];
  const activeLockEntries = [];
  if (await exists(refreshRoot)) {
    for (const animationId of animationIds) {
      const animationRoot = path.join(refreshRoot, animationId);
      if (!await exists(animationRoot)) continue;
      const info = await lstat(animationRoot);
      invariant(info.isDirectory() && !info.isSymbolicLink(),
        `refresh-lock namespace for ${animationId} is not a real directory`);
      const children = await readdir(animationRoot);
      if (children.length === 0) {
        emptyHistoricalAnimationNamespaces.push(
          portable(path.relative(root, animationRoot)),
        );
      } else {
        activeLockEntries.push(...children.map((name) =>
          portable(path.relative(root, path.join(animationRoot, name)))));
      }
    }
  }
  return {
    transactionNamedEntryCount: transactionNamedEntries.length,
    transactionNamedEntries: transactionNamedEntries.sort(),
    activeL10RefreshLockEntryCount: activeLockEntries.length,
    activeL10RefreshLockEntries: activeLockEntries.sort(),
    emptyHistoricalL10RefreshNamespaces:
      emptyHistoricalAnimationNamespaces.sort(),
  };
}

function assertNoTemporalKeys(value, trail = "report") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoTemporalKeys(item, `${trail}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    invariant(!/(?:^|_)(?:created|generated|observed|captured|executed|verified)?at$/iu.test(key)
      && !/(?:created|generated|observed|captured|executed|verified)At$/u.test(key),
    `${trail}.${key} introduces temporal drift`);
    assertNoTemporalKeys(item, `${trail}.${key}`);
  }
}

export function assertG4L10RootCaptureKitReconcileReceiptV1(report) {
  invariant(report?.schemaVersion === 1
    && report.reportType === "g4-l10-root-capture-kit-reconcile-receipt-v1"
    && report.releaseId === RELEASE_ID,
  "schema, type, or release identity drifted");
  invariant(report.evidenceClass
    === "acceptance-neutral-post-reconcile-current-state-with-bounded-local-run-observation",
  "evidence class drifted");
  invariant(report.reconcileRunObservation.executedByReceiptGenerator === false
    && report.reconcileRunObservation.historicalReplayable === false
    && report.reconcileRunObservation.preflight.totalKits === 94
    && report.reconcileRunObservation.preflight.existingExactKits === 2
    && report.reconcileRunObservation.preflight.missingKits === 92
    && sameJson(report.reconcileRunObservation.preflight.preExistingKits,
      PRE_EXISTING_KITS)
    && report.reconcileRunObservation.execution.command
      === "npm run reconcile:g4:l10:root-capture-kits"
    && report.reconcileRunObservation.execution.exitCode === 0
    && report.reconcileRunObservation.execution.status
      === "reconciled-unsigned-template-only"
    && report.reconcileRunObservation.execution.resultCount === 94
    && report.reconcileRunObservation.postCheck.command
      === "npm run check:g4:l10:root-capture-kits"
    && report.reconcileRunObservation.postCheck.exitCode === 0
    && report.reconcileRunObservation.postCheck.verifiedKits === 94,
  "bounded local reconcile/check observation drifted");
  invariant(report.currentExactCheck.executedByReceiptGenerator === true
    && report.currentExactCheck.writeCount === 0
    && report.currentExactCheck.verifiedKits === 94
    && report.currentExactCheck.failedKits === 0,
  "current exact generator check drifted");
  invariant(report.summary.releaseMembers === 47
    && report.summary.rootTraceSpecs === 94
    && report.summary.englishKits === 47
    && report.summary.spanishKits === 47
    && report.summary.exactKits === 94
    && report.summary.files === 1222
    && report.summary.filesPerKit === 13
    && report.summary.stagedSwfCopies === 94
    && report.summary.uniqueStagedSwfHashes === 47
    && report.summary.futureRootFrameCaptureObligations === 1020
    && report.summary.capturePngs === 0
    && report.summary.frameReadmePlaceholders === 94
    && report.summary.fractionalNativeStageKits === 8
    && report.summary.actualRuntimeReceipts === 0
    && report.summary.actualLaunchReceipts === 0
    && report.summary.actualSessionAttestations === 0,
  "post-reconcile summary drifted");
  invariant(Array.isArray(report.kits) && report.kits.length === 94,
    "kit inventory does not contain 94 entries");
  const identities = new Set();
  let frames = 0;
  let bytes = 0;
  for (const [index, kit] of report.kits.entries()) {
    const expectedOrdinal = Math.floor(index / 2) + 1;
    const expectedLanguage = index % 2 === 0 ? "en" : "es";
    invariant(kit.ordinal === expectedOrdinal
      && kit.language === expectedLanguage
      && kit.requirementId === `req-default-root-${expectedLanguage}`
      && Number.isInteger(kit.frameCount) && kit.frameCount > 0
      && kit.fileCount === 13
      && Number.isInteger(kit.totalBytes) && kit.totalBytes > 0
      && HASH.test(kit.treeSha256 || "")
      && HASH.test(kit.captureKitManifestSha256 || "")
      && HASH.test(kit.sourceSwfSha256 || "")
      && kit.runtimeExecutableSha256 === PROJECTOR_EXECUTABLE_SHA256,
    `kit inventory entry ${index + 1} drifted`);
    const identity = `${kit.animationId}:${kit.requirementId}`;
    invariant(!identities.has(identity), `duplicate kit identity ${identity}`);
    identities.add(identity);
    frames += kit.frameCount;
    bytes += kit.totalBytes;
  }
  invariant(frames === report.summary.futureRootFrameCaptureObligations
    && bytes === report.summary.totalKitBytes,
  "kit totals do not match the summary");
  const fractional = report.kits.filter(({captureRaster}) => captureRaster);
  invariant(fractional.length === 8
    && fractional.every((kit) =>
      /^course-g04-l10-ti-00[3-6]$/u.test(kit.animationId)
      && sameJson(kit.nativeStage, {width: 799.9, height: 599.75})
      && sameJson(kit.captureRaster, {
        rule: "ceil-positive-native-stage-dimensions",
        width: 800,
        height: 600,
      })),
  "fractional native-stage/capture-raster mapping drifted");
  invariant(report.transactionArtifacts.transactionNamedEntryCount === 0
    && report.transactionArtifacts.transactionNamedEntries.length === 0
    && report.transactionArtifacts.activeL10RefreshLockEntryCount === 0
    && report.transactionArtifacts.activeL10RefreshLockEntries.length === 0,
  "active L10 transaction or lock artifact remains");
  invariant(report.runtime.runtimeId === "adobe-flash-player-projector"
    && report.runtime.name === "Adobe Flash Player Projector"
    && report.runtime.version === PROJECTOR_VERSION
    && report.runtime.executableSha256 === PROJECTOR_EXECUTABLE_SHA256
    && report.runtime.launchedByReceiptGenerator === false,
  "Projector runtime binding or launch boundary drifted");
  invariant(report.sourceFreeze.manifest.sha256 === SOURCE_MANIFEST_SHA256
    && report.sourceFreeze.declaredManifestSha256 === SOURCE_MANIFEST_SHA256
    && report.sourceFreeze.sourceTreeRehashedByReceiptGenerator === false,
  "source-freeze binding drifted");
  for (const [key, descriptor] of Object.entries(report.tooling)) {
    assertDescriptor(descriptor, `tooling.${key}`);
  }
  assertDescriptor(report.releaseTraceSpecIndex, "releaseTraceSpecIndex");
  invariant(report.releaseTraceSpecIndex.file === RELEASE_INDEX_RELATIVE,
    "release trace-spec index path drifted");
  invariant(sameJson(report.acceptanceEffects, ACCEPTANCE_EFFECTS)
    && Object.values(report.acceptanceEffects).every((value) => value === false)
    && report.strictAcceptanceEffect === "none"
    && report.safety.projectorLaunched === false
    && report.safety.animateLaunched === false
    && report.safety.sourceAssetsWritten === false
    && report.safety.migrationStatusWritten === false
    && report.safety.gitInvoked === false
    && report.safety.reportIsOriginalRuntimeEvidence === false,
  "acceptance or safety boundary advanced");
  assertNoTemporalKeys(report);
  return true;
}

async function inspectSourceFreeze(root) {
  const [manifest, freeze] = await Promise.all([
    readProjectFile(root, SOURCE_MANIFEST_RELATIVE),
    readProjectFile(root, SOURCE_FREEZE_RELATIVE),
  ]);
  const freezeValue = JSON.parse(freeze.bytes.toString("utf8"));
  invariant(manifest.descriptor.sha256 === SOURCE_MANIFEST_SHA256
    && freezeValue.manifest === SOURCE_MANIFEST_RELATIVE
    && freezeValue.manifestSha256 === SOURCE_MANIFEST_SHA256,
  "current source-freeze manifest binding drifted");
  return {
    manifest: manifest.descriptor,
    freeze: freeze.descriptor,
    declaredManifestSha256: freezeValue.manifestSha256,
    sourceTreeRehashedByReceiptGenerator: false,
  };
}

async function inspectNodeExecutable() {
  const absolute = await realpath(process.execPath);
  const info = await lstat(absolute);
  invariant(info.isFile() && !info.isSymbolicLink(),
    "Node executable is not one resolved regular file");
  return {
    path: absolute,
    sha256: await sha256File(absolute),
  };
}

function renderMarkdown(report, jsonIdentity) {
  return [
    "# G4 L10 root-capture kit reconcile receipt v1",
    "",
    "This append-only receipt closes only the unsigned operator-kit preparation step for the 47-member L10 atomic release. It is not original-runtime evidence and advances no migration acceptance gate.",
    "",
    "## Outcome",
    "",
    `- Atomic release members: **${report.summary.releaseMembers}**`,
    `- Exact EN/ES kits: **${report.summary.exactKits}** (${report.summary.englishKits} EN + ${report.summary.spanishKits} ES)`,
    `- Current exact generator check: **${report.currentExactCheck.verifiedKits}/${report.summary.exactKits} pass; 0 writes**`,
    `- Files: **${report.summary.files}** (${report.summary.filesPerKit} per kit), ${report.summary.totalKitBytes} bytes`,
    `- Future root-frame capture obligations: **${report.summary.futureRootFrameCaptureObligations}**`,
    `- Current PNGs / actual session attestations: **${report.summary.capturePngs} / ${report.summary.actualSessionAttestations}**`,
    `- Fractional native-stage mappings: **${report.summary.fractionalNativeStageKits}**`,
    `- Combined kit-tree identity: \`${report.combinedKitTreeSha256}\``,
    `- JSON identity: \`${jsonIdentity.sha256}\` (${jsonIdentity.bytes} bytes)`,
    "",
    "## Reconcile observation boundary",
    "",
    `- Same-turn read-only preflight observed **${report.reconcileRunObservation.preflight.existingExactKits}** exact existing kits and **${report.reconcileRunObservation.preflight.missingKits}** missing kits.`,
    `- The reconcile command returned exit **${report.reconcileRunObservation.execution.exitCode}**, status \`${report.reconcileRunObservation.execution.status}\`, and ${report.reconcileRunObservation.execution.resultCount} results.`,
    `- A separate post-check returned exit **${report.reconcileRunObservation.postCheck.exitCode}** for ${report.reconcileRunObservation.postCheck.verifiedKits} kits.`,
    "- The 92-new/2-existing split is a bounded local process observation from this reconcile turn. It is intentionally not presented as a fact that can be reconstructed from the post-state alone.",
    "",
    "## Current materialized state",
    "",
    `- Staged byte-identical SWF copies: **${report.summary.stagedSwfCopies}** across ${report.summary.uniqueStagedSwfHashes} unique SWF hashes.`,
    `- Frame placeholders: **${report.summary.frameReadmePlaceholders}**; captured PNGs: **${report.summary.capturePngs}**.`,
    `- Actual runtime-toolchain receipts, source-open receipts, and session attestations: **${report.summary.actualRuntimeReceipts} / ${report.summary.actualLaunchReceipts} / ${report.summary.actualSessionAttestations}**.`,
    `- Active L10 refresh locks / transaction artifacts: **${report.transactionArtifacts.activeL10RefreshLockEntryCount} / ${report.transactionArtifacts.transactionNamedEntryCount}**.`,
    "- TI003–TI006 each retain a 799.9×599.75 source-native stage in both languages and require an 800×600 lossless PNG raster via `ceil-positive-native-stage-dimensions`.",
    "",
    "## Runtime binding",
    "",
    `- Runtime: \`${report.runtime.name}\` ${report.runtime.version}`,
    `- Executable SHA-256: \`${report.runtime.executableSha256}\``,
    "- The receipt generator inspected the bundle metadata and executable hash but did not launch Projector or Animate.",
    "",
    "## Acceptance boundary",
    "",
    ...Object.entries(report.acceptanceEffects)
      .map(([key, value]) => `- ${key}: \`${value}\``),
    "",
    `Strict acceptance effect: **${report.strictAcceptanceEffect}**.`,
    "",
    "A named human operator, a real source-open session, all 1,020 lossless frame captures, display-list/operation chains, signatures, visual comparisons, audio listening, and human/owner decisions are still absent. The kits therefore do not establish Flash fidelity, original-runtime behavior, RMSE acceptance, whole-lesson integration, strict completion, or publication readiness.",
    "",
  ].join("\n");
}

async function writeOrCheckAppendOnly(root, relative, bytes, check) {
  const target = projectPath(root, relative, "receipt output");
  const reportsRoot = projectPath(root, "reports", "reports root");
  invariant(path.dirname(target) === reportsRoot,
    `${relative} is outside the reports root`);
  if (check) {
    const observed = await readStableRegularFile(target, relative);
    invariant(observed.bytes.equals(bytes), `${relative} is stale`);
    return "checked";
  }
  if (await exists(target)) {
    const observed = await readStableRegularFile(target, relative);
    invariant(observed.bytes.equals(bytes),
      `${relative} is append-only and differs from the current report`);
    return "unchanged";
  }
  const temporary = path.join(
    reportsRoot,
    `.${path.basename(relative)}.tmp-${process.pid}`,
  );
  try {
    await writeFile(temporary, bytes, {flag: "wx", mode: 0o644});
    try {
      await link(temporary, target);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      const observed = await readStableRegularFile(target, relative);
      invariant(observed.bytes.equals(bytes),
        `${relative} was concurrently published with different bytes`);
    }
  } finally {
    await unlink(temporary).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
  return "written";
}

export async function buildG4L10RootCaptureKitReconcileReceiptV1({
  root = ROOT,
  persist = true,
  check = false,
} = {}) {
  invariant(typeof root === "string" && path.isAbsolute(root),
    "root must be one absolute path");
  const resolvedRoot = await realpath(root);
  invariant(resolvedRoot === root, "root must be canonical");
  const packageFile = await readProjectFile(resolvedRoot, "package.json");
  const packageValue = JSON.parse(packageFile.bytes.toString("utf8"));
  invariant(packageValue.scripts?.["reconcile:g4:l10:root-capture-kits"]
    === "node scripts/scaffold-root-capture-kit.mjs --lesson-release lesson-g04-l10-perimeter-area --reconcile-missing"
    && packageValue.scripts?.["check:g4:l10:root-capture-kits"]
    === "node scripts/scaffold-root-capture-kit.mjs --lesson-release lesson-g04-l10-perimeter-area --check",
  "package reconcile/check command contract drifted");

  const [runtime, releaseScope, sourceFreeze, nodeExecutable] =
    await Promise.all([
      inspectProjectorRuntime({playerApp: DEFAULT_PROJECTOR_APP}),
      listReadyLessonReleaseRootSpecs({
        projectRoot: resolvedRoot,
        releaseId: RELEASE_ID,
      }),
      inspectSourceFreeze(resolvedRoot),
      inspectNodeExecutable(),
    ]);
  invariant(runtime.version === PROJECTOR_VERSION
    && runtime.executableSha256 === PROJECTOR_EXECUTABLE_SHA256,
  "approved Projector runtime binding drifted");
  invariant(releaseScope.indexFile === RELEASE_INDEX_RELATIVE
    && releaseScope.index.value?.memberCount === 47
    && releaseScope.specs.length === 94,
  "atomic release root-spec scope drifted");

  const checked = await scaffoldRootCaptureKits({
    projectRoot: resolvedRoot,
    lessonRelease: RELEASE_ID,
    runtime,
    check: true,
  });
  invariant(checked.length === 94,
    "current exact root-kit check did not return 94 results");
  const checkedByIdentity = new Map(checked.map((item) => [
    `${item.animationId}:${item.requirementId}`,
    item,
  ]));
  invariant(checkedByIdentity.size === 94,
    "current exact root-kit check returned duplicate identities");
  const kits = [];
  for (const spec of releaseScope.specs) {
    const identity = `${spec.animationId}:${spec.requirementId}`;
    const item = checkedByIdentity.get(identity);
    invariant(item, `current exact root-kit check omitted ${identity}`);
    kits.push(await inspectOneKit({root: resolvedRoot, spec, checked: item}));
  }
  const animationIds = [...new Set(kits.map(({animationId}) => animationId))];
  const transactionArtifacts = await inspectTransactionArtifacts(
    resolvedRoot,
    animationIds,
  );
  const toolingEntries = await Promise.all(Object.entries(TOOLING_FILES)
    .map(async ([key, relative]) => [
      key,
      (await readProjectFile(resolvedRoot, relative)).descriptor,
    ]));
  const tooling = Object.fromEntries(toolingEntries);
  const releaseTraceSpecIndex = (await readProjectFile(
    resolvedRoot,
    RELEASE_INDEX_RELATIVE,
  )).descriptor;
  invariant(releaseTraceSpecIndex.sha256 === releaseScope.index.sha256,
    "release index stable read differs from the bound lesson scope");

  const totalKitBytes = kits.reduce((total, kit) => total + kit.totalBytes, 0);
  const futureRootFrameCaptureObligations = kits.reduce(
    (total, kit) => total + kit.frameCount,
    0,
  );
  const combinedKitTreeSha256 = sha256(Buffer.from(stableJson(kits.map((kit) => ({
    ordinal: kit.ordinal,
    animationId: kit.animationId,
    requirementId: kit.requirementId,
    treeSha256: kit.treeSha256,
    fileCount: kit.fileCount,
    totalBytes: kit.totalBytes,
  })))));
  const report = {
    schemaVersion: 1,
    reportType: "g4-l10-root-capture-kit-reconcile-receipt-v1",
    releaseId: RELEASE_ID,
    evidenceClass:
      "acceptance-neutral-post-reconcile-current-state-with-bounded-local-run-observation",
    reconcileRunObservation: {
      executedByReceiptGenerator: false,
      historicalReplayable: false,
      evidentiaryLimit:
        "The 92-new/2-existing split is a same-turn preflight and process-result observation; post-state inspection alone cannot reconstruct creation history.",
      preflight: {
        totalKits: 94,
        existingExactKits: 2,
        missingKits: 92,
        preExistingKits: PRE_EXISTING_KITS,
      },
      execution: {
        command: "npm run reconcile:g4:l10:root-capture-kits",
        exitCode: 0,
        status: "reconciled-unsigned-template-only",
        resultCount: 94,
        projectorLaunched: false,
        animateLaunched: false,
      },
      postCheck: {
        command: "npm run check:g4:l10:root-capture-kits",
        exitCode: 0,
        verifiedKits: 94,
        writeCount: 0,
      },
    },
    currentExactCheck: {
      executedByReceiptGenerator: true,
      operation: "scaffoldRootCaptureKits lesson-release check mode",
      verifiedKits: checked.length,
      failedKits: 0,
      writeCount: 0,
    },
    summary: {
      releaseMembers: animationIds.length,
      rootTraceSpecs: releaseScope.specs.length,
      englishKits: kits.filter(({language}) => language === "en").length,
      spanishKits: kits.filter(({language}) => language === "es").length,
      exactKits: kits.length,
      files: kits.reduce((total, kit) => total + kit.fileCount, 0),
      filesPerKit: new Set(kits.map(({fileCount}) => fileCount)).size === 1
        ? kits[0].fileCount
        : null,
      totalKitBytes,
      stagedSwfCopies: kits.length,
      uniqueStagedSwfHashes: new Set(kits.map(({sourceSwfSha256}) =>
        sourceSwfSha256)).size,
      futureRootFrameCaptureObligations,
      capturePngs: 0,
      frameReadmePlaceholders: kits.length,
      fractionalNativeStageKits: kits.filter(({captureRaster}) =>
        captureRaster).length,
      actualRuntimeReceipts: 0,
      actualLaunchReceipts: 0,
      actualSessionAttestations: 0,
    },
    combinedKitTreeSha256,
    kits,
    transactionArtifacts,
    runtime: {
      runtimeId: runtime.runtimeId,
      name: runtime.name,
      version: runtime.version,
      requestedAppPath: runtime.requestedAppPath,
      appPath: runtime.appPath,
      executablePath: runtime.executablePath,
      executableSha256: runtime.executableSha256,
      launchedByReceiptGenerator: false,
    },
    nodeExecutable,
    packageContract: {
      descriptor: packageFile.descriptor,
      reconcileCommand: packageValue.scripts["reconcile:g4:l10:root-capture-kits"],
      checkCommand: packageValue.scripts["check:g4:l10:root-capture-kits"],
    },
    releaseTraceSpecIndex,
    sourceFreeze,
    tooling,
    acceptanceEffects: ACCEPTANCE_EFFECTS,
    strictAcceptanceEffect: "none",
    safety: {
      projectorLaunched: false,
      animateLaunched: false,
      sourceAssetsWritten: false,
      migrationStatusWritten: false,
      gitInvoked: false,
      reportIsOriginalRuntimeEvidence: false,
      reportIsRuffleAuthority: false,
      reportIsHumanOrOwnerReview: false,
    },
    remainingWork: {
      namedHumanOperatorRequired: true,
      sourceOpenSessionRequired: true,
      losslessFrameCapturesRequired: futureRootFrameCaptureObligations,
      displayListAndOperationChainsRequired: true,
      runtimeSignaturesRequired: true,
      originalRuntimeValidationRequired: true,
      audioListeningRequired: true,
      visualComparisonRequired: true,
      humanReviewRequired: true,
      ownerReviewRequired: true,
    },
  };
  assertG4L10RootCaptureKitReconcileReceiptV1(report);
  const jsonBytes = Buffer.from(stableJson(report));
  const jsonIdentity = {bytes: jsonBytes.length, sha256: sha256(jsonBytes)};
  const markdownBytes = Buffer.from(renderMarkdown(report, jsonIdentity));
  const result = {
    report,
    json: {relative: REPORT_JSON_RELATIVE, bytes: jsonBytes, ...jsonIdentity},
    markdown: {
      relative: REPORT_MARKDOWN_RELATIVE,
      bytes: markdownBytes,
      byteCount: markdownBytes.length,
      sha256: sha256(markdownBytes),
    },
  };
  if (persist) {
    result.persistence = {
      json: await writeOrCheckAppendOnly(
        resolvedRoot,
        REPORT_JSON_RELATIVE,
        jsonBytes,
        check,
      ),
      markdown: await writeOrCheckAppendOnly(
        resolvedRoot,
        REPORT_MARKDOWN_RELATIVE,
        markdownBytes,
        check,
      ),
    };
  }
  return result;
}

export function parseArguments(argv) {
  const options = {check: false, help: false};
  for (const value of argv) {
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function usage() {
  return [
    "Usage: node scripts/build-g4-l10-root-capture-kit-reconcile-receipt-v1.mjs [--check]",
    "",
    "Build or byte-check the append-only, acceptance-neutral L10 root-capture-kit reconcile receipt.",
    "The command inspects Projector metadata/hash and verifies all 94 unsigned kits; it never launches Projector or Animate.",
    "",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const result = await buildG4L10RootCaptureKitReconcileReceiptV1({
    root: ROOT,
    persist: true,
    check: options.check,
  });
  process.stdout.write(`${JSON.stringify({
    status: options.check ? "checked" : "built",
    releaseId: RELEASE_ID,
    exactKits: result.report.summary.exactKits,
    files: result.report.summary.files,
    totalKitBytes: result.report.summary.totalKitBytes,
    futureRootFrameCaptureObligations:
      result.report.summary.futureRootFrameCaptureObligations,
    capturePngs: result.report.summary.capturePngs,
    strictAcceptanceEffect: result.report.strictAcceptanceEffect,
    json: {
      file: result.json.relative,
      bytes: result.json.bytes.length,
      sha256: result.json.sha256,
    },
    markdown: {
      file: result.markdown.relative,
      bytes: result.markdown.bytes.length,
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
