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
  assertG4L10RootCaptureKitReconcileReceiptV1,
  buildG4L10RootCaptureKitReconcileReceiptV1,
} from "./build-g4-l10-root-capture-kit-reconcile-receipt-v1.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = await realpath(path.resolve(path.dirname(SCRIPT_PATH), ".."));
const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const REPORT_JSON_RELATIVE =
  "reports/g4-l10-root-capture-kit-reconcile-receipt-v2.json";
const REPORT_MARKDOWN_RELATIVE =
  "reports/g4-l10-root-capture-kit-reconcile-receipt-v2.md";
const V2_TEST_RELATIVE =
  "scripts/build-g4-l10-root-capture-kit-reconcile-receipt-v2.test.mjs";
const V1_FILES = Object.freeze({
  json: "reports/g4-l10-root-capture-kit-reconcile-receipt-v1.json",
  markdown: "reports/g4-l10-root-capture-kit-reconcile-receipt-v1.md",
  generator:
    "scripts/build-g4-l10-root-capture-kit-reconcile-receipt-v1.mjs",
  tests:
    "scripts/build-g4-l10-root-capture-kit-reconcile-receipt-v1.test.mjs",
});
const V2_FILES = Object.freeze({
  generator:
    "scripts/build-g4-l10-root-capture-kit-reconcile-receipt-v2.mjs",
  tests: V2_TEST_RELATIVE,
});
const PRE_EXISTING_IDENTITIES = Object.freeze(new Map([
  ["course-g04-l10-vb-003:req-default-root-en",
    "e8e95173a251f34d2574e483d53f4329af1acca3cb21f842aec5da2d4a2a9a83"],
  ["course-g04-l10-vb-003:req-default-root-es",
    "c71f16837bb5f28bfb9d75760ac5b3a77c2eae528d4ad77c51b7738655713628"],
]));
const HASH = /^[a-f0-9]{64}$/u;

function invariant(condition, message) {
  if (!condition) {
    throw new Error(`G4 L10 root-capture reconcile receipt v2: ${message}`);
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

function projectPath(root, relative) {
  invariant(typeof relative === "string" && relative.length > 0
    && !path.isAbsolute(relative) && !relative.includes("\\")
    && portable(path.normalize(relative)) === relative
    && relative !== ".." && !relative.startsWith("../"),
  `${relative || "empty"} is not one portable project-relative path`);
  const candidate = path.resolve(root, relative);
  const relation = path.relative(root, candidate);
  invariant(relation !== ".." && !relation.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relation), `${relative} escapes the project`);
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

async function readStableProjectFile(root, relative) {
  const absolute = projectPath(root, relative);
  const before = await lstat(absolute, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink()
    && before.nlink === 1n, `${relative} is not one regular, single-link file`);
  const contents = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  invariant(sameIdentity(before, after), `${relative} changed while read`);
  return {
    contents,
    descriptor: {
      file: relative,
      bytes: contents.length,
      sha256: sha256(contents),
      mode: modeOf(after),
    },
  };
}

function assertDescriptor(item, label) {
  invariant(item && typeof item.file === "string"
    && Number.isInteger(item.bytes) && item.bytes > 0
    && HASH.test(item.sha256 || "")
    && /^[0-7]{4}$/u.test(item.mode || ""),
  `${label} descriptor is invalid`);
}

function rowIdentity(row) {
  return `${row.animationId}:${row.requirementId}`;
}

function dispositionRow(kit) {
  return {
    ordinal: kit.ordinal,
    animationId: kit.animationId,
    requirementId: kit.requirementId,
    language: kit.language,
    frameCount: kit.frameCount,
    captureKitManifestSha256: kit.captureKitManifestSha256,
    treeSha256: kit.treeSha256,
  };
}

function setIdentity(rows) {
  return sha256(Buffer.from(stableJson(rows)));
}

function projectToV1(report) {
  const projected = structuredClone(report);
  projected.reportType = "g4-l10-root-capture-kit-reconcile-receipt-v1";
  projected.evidenceClass =
    "acceptance-neutral-post-reconcile-current-state-with-bounded-local-run-observation";
  delete projected.receiptVersion;
  delete projected.status;
  delete projected.v1Attempt;
  delete projected.v2Correction;
  delete projected.dispositionSets;
  delete projected.historicalDispositionBoundary;
  delete projected.tooling.successorReceiptGenerator;
  delete projected.tooling.successorReceiptTests;
  for (const key of [
    "createdKitCount",
    "verifiedPreExistingKitCount",
    "createdFutureRootFrameCaptureObligations",
    "preExistingFutureRootFrameCaptureObligations",
  ]) delete projected.summary[key];
  projected.kits.forEach((kit) => delete kit.reconcileDisposition);
  return projected;
}

export function assertG4L10RootCaptureKitReconcileReceiptV2(report) {
  invariant(report?.schemaVersion === 1
    && report.receiptVersion === 2
    && report.reportType === "g4-l10-root-capture-kit-reconcile-receipt-v2"
    && report.releaseId === RELEASE_ID
    && report.status === "reconciled-unsigned-template-only-not-evidence"
    && report.evidenceClass
      === "acceptance-neutral-reconcile-successor-with-preserved-v1-pretest-attempt",
  "schema, version, type, status, or release drifted");
  assertG4L10RootCaptureKitReconcileReceiptV1(projectToV1(report));

  for (const key of ["json", "markdown", "generator", "tests"]) {
    assertDescriptor(report.v1Attempt.artifacts[key], `v1Attempt.${key}`);
    invariant(report.v1Attempt.artifacts[key].file === V1_FILES[key],
      `v1Attempt.${key} path drifted`);
  }
  invariant(report.v1Attempt.preserved === true
    && report.v1Attempt.rewritten === false
    && report.v1Attempt.acceptedAsFinal === false
    && report.v1Attempt.disposition
      === "retained-pretest-attempt-not-promoted"
    && report.v1Attempt.defect
      === "JSON return object reused bytes for both content and byte count, preventing the persisted-byte test from comparing Buffer content"
    && report.v1Attempt.passingAssertionsObservedBeforeDefect === 3
    && report.v1Attempt.completeTestSummaryAvailable === false
    && report.v1Attempt.acceptanceEffect === "none",
  "v1 pretest-attempt preservation boundary drifted");
  invariant(report.v2Correction.separateJsonContentsAndByteCount === true
    && report.v2Correction.smallBooleanPersistedByteAssertion === true
    && report.v2Correction.v1ArtifactsModified === false
    && report.v2Correction.newVersionedOutputsOnly === true,
  "v2 correction contract drifted");
  assertDescriptor(report.tooling.successorReceiptGenerator,
    "tooling.successorReceiptGenerator");
  assertDescriptor(report.tooling.successorReceiptTests,
    "tooling.successorReceiptTests");
  invariant(report.tooling.successorReceiptGenerator.file === V2_FILES.generator
    && report.tooling.successorReceiptTests.file === V2_FILES.tests,
  "v2 tooling paths drifted");

  invariant(report.summary.createdKitCount === 92
    && report.summary.verifiedPreExistingKitCount === 2
    && report.summary.createdFutureRootFrameCaptureObligations === 1000
    && report.summary.preExistingFutureRootFrameCaptureObligations === 20
    && report.summary.futureRootFrameCaptureObligations === 1020,
  "created/pre-existing/total arithmetic drifted");
  const created = report.kits.filter(({reconcileDisposition}) =>
    reconcileDisposition === "created-by-observed-reconcile");
  const preExisting = report.kits.filter(({reconcileDisposition}) =>
    reconcileDisposition === "verified-pre-existing-by-observed-reconcile");
  invariant(created.length === 92 && preExisting.length === 2
    && created.reduce((total, item) => total + item.frameCount, 0) === 1000
    && preExisting.reduce((total, item) => total + item.frameCount, 0) === 20,
  "per-kit disposition/frame arithmetic drifted");
  const allIdentities = new Set(report.kits.map(rowIdentity));
  const createdIdentities = new Set(created.map(rowIdentity));
  const preExistingIdentities = new Set(preExisting.map(rowIdentity));
  invariant(allIdentities.size === 94 && createdIdentities.size === 92
    && preExistingIdentities.size === 2
    && [...createdIdentities].every((identity) =>
      !preExistingIdentities.has(identity))
    && [...PRE_EXISTING_IDENTITIES.keys()].every((identity) =>
      preExistingIdentities.has(identity)),
  "disposition sets overlap, duplicate, or omit the VB003 pair");
  for (const kit of preExisting) {
    invariant(kit.frameCount === 10
      && kit.captureKitManifestSha256
        === PRE_EXISTING_IDENTITIES.get(rowIdentity(kit)),
    `pre-existing ${rowIdentity(kit)} identity drifted`);
  }
  invariant(report.dispositionSets.created.count === 92
    && report.dispositionSets.created.futureRootFrameObligations === 1000
    && report.dispositionSets.created.setSha256
      === setIdentity(created.map(dispositionRow))
    && report.dispositionSets.verifiedPreExisting.count === 2
    && report.dispositionSets.verifiedPreExisting.futureRootFrameObligations
      === 20
    && report.dispositionSets.verifiedPreExisting.setSha256
      === setIdentity(preExisting.map(dispositionRow))
    && report.dispositionSets.postReconcile.count === 94
    && report.dispositionSets.postReconcile.futureRootFrameObligations === 1020
    && report.dispositionSets.postReconcile.setSha256
      === setIdentity(report.kits.map(dispositionRow)),
  "disposition-set hash or arithmetic drifted");
  invariant(report.historicalDispositionBoundary.basis
    === "direct-reconcile-return-and-same-turn-preflight-observation"
    && report.historicalDispositionBoundary.rawObservationArtifact === null
    && report.historicalDispositionBoundary.preReconcileInventoryReceipt === null
    && report.historicalDispositionBoundary.independentlyReconstructableFromCurrentTree
      === false
    && report.historicalDispositionBoundary.filesystemTimestampsUsed === false,
  "historical disposition evidence boundary drifted");
  invariant(report.summary.capturePngs === 0
    && report.summary.actualRuntimeReceipts === 0
    && report.summary.actualLaunchReceipts === 0
    && report.summary.actualSessionAttestations === 0
    && Object.values(report.acceptanceEffects).every((value) => value === false)
    && report.strictAcceptanceEffect === "none",
  "runtime, capture, or acceptance state advanced");
  return true;
}

function renderMarkdown(report, jsonIdentity) {
  const preExisting = report.kits.filter(({reconcileDisposition}) =>
    reconcileDisposition === "verified-pre-existing-by-observed-reconcile");
  return [
    "# G4 L10 root-capture kit reconcile receipt v2",
    "",
    "This append-only successor preserves the v1 pretest attempt and corrects its return contract. It closes only deterministic unsigned operator-kit materialization; it is not original-runtime evidence and advances no acceptance gate.",
    "",
    "## Outcome",
    "",
    `- Newly materialized by the observed reconcile: **${report.summary.createdKitCount} kits / ${report.summary.createdFutureRootFrameCaptureObligations} future root-frame obligations**`,
    `- Reverified pre-existing VB003 scope: **${report.summary.verifiedPreExistingKitCount} kits / ${report.summary.preExistingFutureRootFrameCaptureObligations} future obligations**`,
    `- Post-reconcile total: **${report.summary.exactKits} kits / ${report.summary.futureRootFrameCaptureObligations} future obligations**`,
    `- Current captured frames / runtime sessions / authoritative baselines: **0 / 0 / 0**`,
    `- Exact current check: **${report.currentExactCheck.verifiedKits}/${report.summary.exactKits} pass; ${report.currentExactCheck.writeCount} writes**`,
    `- Files / bytes: **${report.summary.files} / ${report.summary.totalKitBytes}**`,
    `- JSON identity: \`${jsonIdentity.sha256}\` (${jsonIdentity.bytes} bytes)`,
    "",
    "## Preserved v1 attempt",
    "",
    `- JSON: \`${report.v1Attempt.artifacts.json.file}\` / \`${report.v1Attempt.artifacts.json.sha256}\``,
    `- Markdown: \`${report.v1Attempt.artifacts.markdown.file}\` / \`${report.v1Attempt.artifacts.markdown.sha256}\``,
    "- The v1 files were not rewritten. Its report semantics remained acceptance-neutral, but the return object reused one `bytes` field for both content and count, so the persisted-byte test could not complete a valid Buffer comparison.",
    "- Three assertions were observed passing before that defect; a complete v1 test summary is not claimed.",
    "",
    "## Historical disposition boundary",
    "",
    "The 92/2 split is bound to the direct reconcile return and same-turn preflight observation. No raw stdout artifact or independent pre-reconcile inventory receipt was persisted, and current post-state alone cannot reconstruct which paths were newly created. Filesystem timestamps are not used as proof.",
    "",
    "The two pre-existing identities are:",
    "",
    ...preExisting.map((kit) =>
      `- \`${kit.animationId}/${kit.requirementId}\`: ${kit.frameCount} future frames; manifest \`${kit.captureKitManifestSha256}\``),
    "",
    "## Current exact state",
    "",
    `- 47 EN + 47 ES kits; ${report.summary.filesPerKit} immutable files per kit.`,
    `- ${report.summary.stagedSwfCopies} byte-identical staged SWF copies across ${report.summary.uniqueStagedSwfHashes} unique source hashes.`,
    `- ${report.summary.frameReadmePlaceholders} README-only frame placeholders and ${report.summary.capturePngs} PNGs.`,
    `- ${report.summary.fractionalNativeStageKits} TI003–TI006 language kits preserve 799.9×599.75 native stage and require 800×600 capture raster.`,
    `- Active L10 locks / transaction artifacts: ${report.transactionArtifacts.activeL10RefreshLockEntryCount} / ${report.transactionArtifacts.transactionNamedEntryCount}.`,
    "",
    "## Acceptance boundary",
    "",
    ...Object.entries(report.acceptanceEffects)
      .map(([key, value]) => `- ${key}: \`${value}\``),
    "",
    `Strict acceptance effect: **${report.strictAcceptanceEffect}**.`,
    "",
    "A named operator, real Projector source-open sessions, all 1,020 lossless frame captures, chained runtime/display-list records, bilingual/audio verification, RMSE comparisons, human review, owner review, renderer registration, whole-lesson integration, strict completion, and publication approval all remain open.",
    "",
  ].join("\n");
}

async function writeOrCheckAppendOnly(root, relative, contents, check) {
  const target = projectPath(root, relative);
  const reportsRoot = projectPath(root, "reports");
  invariant(path.dirname(target) === reportsRoot,
    `${relative} is outside the reports root`);
  if (check) {
    const observed = await readStableProjectFile(root, relative);
    invariant(observed.contents.equals(contents), `${relative} is stale`);
    return "checked";
  }
  if (await exists(target)) {
    const observed = await readStableProjectFile(root, relative);
    invariant(observed.contents.equals(contents),
      `${relative} is append-only and differs from the current successor`);
    return "unchanged";
  }
  const temporary = path.join(
    reportsRoot,
    `.${path.basename(relative)}.tmp-${process.pid}`,
  );
  try {
    await writeFile(temporary, contents, {flag: "wx", mode: 0o644});
    try {
      await link(temporary, target);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      const observed = await readStableProjectFile(root, relative);
      invariant(observed.contents.equals(contents),
        `${relative} was concurrently published with different bytes`);
    }
  } finally {
    await unlink(temporary).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
  return "written";
}

export async function buildG4L10RootCaptureKitReconcileReceiptV2({
  root = ROOT,
  persist = true,
  check = false,
} = {}) {
  invariant(typeof root === "string" && path.isAbsolute(root),
    "root must be one absolute path");
  const resolvedRoot = await realpath(root);
  invariant(resolvedRoot === root, "root must be canonical");
  const [base, v1Json, v1Markdown, v1Generator, v1Tests,
    v2Generator, v2Tests] = await Promise.all([
    buildG4L10RootCaptureKitReconcileReceiptV1({
      root: resolvedRoot,
      persist: false,
    }),
    readStableProjectFile(resolvedRoot, V1_FILES.json),
    readStableProjectFile(resolvedRoot, V1_FILES.markdown),
    readStableProjectFile(resolvedRoot, V1_FILES.generator),
    readStableProjectFile(resolvedRoot, V1_FILES.tests),
    readStableProjectFile(resolvedRoot, V2_FILES.generator),
    readStableProjectFile(resolvedRoot, V2_FILES.tests),
  ]);
  const report = structuredClone(base.report);
  report.receiptVersion = 2;
  report.reportType = "g4-l10-root-capture-kit-reconcile-receipt-v2";
  report.status = "reconciled-unsigned-template-only-not-evidence";
  report.evidenceClass =
    "acceptance-neutral-reconcile-successor-with-preserved-v1-pretest-attempt";
  report.v1Attempt = {
    disposition: "retained-pretest-attempt-not-promoted",
    preserved: true,
    rewritten: false,
    acceptedAsFinal: false,
    artifacts: {
      json: v1Json.descriptor,
      markdown: v1Markdown.descriptor,
      generator: v1Generator.descriptor,
      tests: v1Tests.descriptor,
    },
    defect:
      "JSON return object reused bytes for both content and byte count, preventing the persisted-byte test from comparing Buffer content",
    passingAssertionsObservedBeforeDefect: 3,
    completeTestSummaryAvailable: false,
    acceptanceEffect: "none",
  };
  report.v2Correction = {
    separateJsonContentsAndByteCount: true,
    smallBooleanPersistedByteAssertion: true,
    v1ArtifactsModified: false,
    newVersionedOutputsOnly: true,
  };
  report.tooling.successorReceiptGenerator = v2Generator.descriptor;
  report.tooling.successorReceiptTests = v2Tests.descriptor;

  for (const kit of report.kits) {
    kit.reconcileDisposition = PRE_EXISTING_IDENTITIES.has(rowIdentity(kit))
      ? "verified-pre-existing-by-observed-reconcile"
      : "created-by-observed-reconcile";
  }
  const created = report.kits.filter(({reconcileDisposition}) =>
    reconcileDisposition === "created-by-observed-reconcile");
  const preExisting = report.kits.filter(({reconcileDisposition}) =>
    reconcileDisposition === "verified-pre-existing-by-observed-reconcile");
  report.summary.createdKitCount = created.length;
  report.summary.verifiedPreExistingKitCount = preExisting.length;
  report.summary.createdFutureRootFrameCaptureObligations = created.reduce(
    (total, kit) => total + kit.frameCount,
    0,
  );
  report.summary.preExistingFutureRootFrameCaptureObligations =
    preExisting.reduce((total, kit) => total + kit.frameCount, 0);
  report.dispositionSets = {
    created: {
      count: created.length,
      futureRootFrameObligations:
        report.summary.createdFutureRootFrameCaptureObligations,
      setSha256: setIdentity(created.map(dispositionRow)),
    },
    verifiedPreExisting: {
      count: preExisting.length,
      futureRootFrameObligations:
        report.summary.preExistingFutureRootFrameCaptureObligations,
      setSha256: setIdentity(preExisting.map(dispositionRow)),
      members: preExisting.map(dispositionRow),
    },
    postReconcile: {
      count: report.kits.length,
      futureRootFrameObligations:
        report.summary.futureRootFrameCaptureObligations,
      setSha256: setIdentity(report.kits.map(dispositionRow)),
    },
  };
  report.historicalDispositionBoundary = {
    basis: "direct-reconcile-return-and-same-turn-preflight-observation",
    rawObservationArtifact: null,
    preReconcileInventoryReceipt: null,
    independentlyReconstructableFromCurrentTree: false,
    filesystemTimestampsUsed: false,
    limitation:
      "Post-state exact verification proves the current 94-kit tree but cannot independently reconstruct the 92-created/2-pre-existing history.",
  };
  assertG4L10RootCaptureKitReconcileReceiptV2(report);
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
    result.persistence = {
      json: await writeOrCheckAppendOnly(
        resolvedRoot,
        REPORT_JSON_RELATIVE,
        jsonContents,
        check,
      ),
      markdown: await writeOrCheckAppendOnly(
        resolvedRoot,
        REPORT_MARKDOWN_RELATIVE,
        markdownContents,
        check,
      ),
    };
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

function usage() {
  return [
    "Usage: node scripts/build-g4-l10-root-capture-kit-reconcile-receipt-v2.mjs [--check]",
    "",
    "Build or byte-check the append-only v2 successor for the acceptance-neutral L10 root-kit reconcile.",
    "The command verifies all 94 unsigned kits and inspects the bound Projector bundle without launching Projector or Animate.",
    "",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const result = await buildG4L10RootCaptureKitReconcileReceiptV2({
    root: ROOT,
    persist: true,
    check: options.check,
  });
  process.stdout.write(`${JSON.stringify({
    status: options.check ? "checked" : "built",
    releaseId: RELEASE_ID,
    createdKits: result.report.summary.createdKitCount,
    verifiedPreExistingKits:
      result.report.summary.verifiedPreExistingKitCount,
    exactKits: result.report.summary.exactKits,
    createdFutureRootFrameCaptureObligations:
      result.report.summary.createdFutureRootFrameCaptureObligations,
    preExistingFutureRootFrameCaptureObligations:
      result.report.summary.preExistingFutureRootFrameCaptureObligations,
    totalFutureRootFrameCaptureObligations:
      result.report.summary.futureRootFrameCaptureObligations,
    capturedFrames: result.report.summary.capturePngs,
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
