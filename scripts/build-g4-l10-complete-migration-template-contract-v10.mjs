#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {validateContract as validateV9Contract} from
  "./build-g4-l10-complete-migration-template-contract-v9.mjs";
import {validateReport as validateGeometryReport} from
  "./build-g4-l10-ts007-sprite64-interaction-geometry-v1.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const REPORT_JSON =
  "reports/g4-l10-complete-migration-template-contract-v10-2026-08-07.json";
export const REPORT_MARKDOWN =
  "reports/g4-l10-complete-migration-template-contract-v10-2026-08-07.md";
export const GENERATOR_PATH =
  "scripts/build-g4-l10-complete-migration-template-contract-v10.mjs";
export const TEST_PATH =
  "scripts/build-g4-l10-complete-migration-template-contract-v10.test.mjs";

const EXPECTED_INPUTS = Object.freeze({
  v9Contract: {
    path: "reports/g4-l10-complete-migration-template-contract-v9-2026-08-07.json",
    bytes: 257172,
    sha256: "4d108fbb92e63d4c921bde0d6f50588ce2d28f7e69d1bf9fd5d6bca011507190",
    mode: "0444",
  },
  v9Generator: {
    path: "scripts/build-g4-l10-complete-migration-template-contract-v9.mjs",
    bytes: 19232,
    sha256: "d30d2c16ddf30d9ad2ee7877a62534fdb179e2720b025bf5533b48ea45ec5751",
    mode: "0644",
  },
  v9Test: {
    path: "scripts/build-g4-l10-complete-migration-template-contract-v9.test.mjs",
    bytes: 4502,
    sha256: "628c44a3cb6ea6075a27a98637154c07840fa1e517b9729438e5560a599462cb",
    mode: "0644",
  },
  geometryJson: {
    path: "reports/g4-l10-ts007-sprite64-interaction-geometry-v1.json",
    bytes: 20945,
    sha256: "3c89c03b0805052260830491c465b6e0c18fa3300d9444636cf59ba7a8fc4637",
    mode: "0444",
  },
  geometryMarkdown: {
    path: "reports/g4-l10-ts007-sprite64-interaction-geometry-v1.md",
    bytes: 1476,
    sha256: "bc32b0532db96086b1823f2048e11e62d86df59c6fedca05c09c0984464286ca",
    mode: "0444",
  },
  geometryGenerator: {
    path: "scripts/build-g4-l10-ts007-sprite64-interaction-geometry-v1.mjs",
    bytes: 46034,
    sha256: "acc0efa427fffe9d690529674962d03650804a3782982fd2031e857461f8ae52",
    mode: "0644",
  },
  geometryTest: {
    path: "scripts/build-g4-l10-ts007-sprite64-interaction-geometry-v1.test.mjs",
    bytes: 5225,
    sha256: "19dbccd932de66298ca42b1caa491b3e7f3710a20eaf4a813a95db54762b74d8",
    mode: "0644",
  },
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) =>
      [key, canonicalize(value[key])]));
  }
  return value;
}

function reportFingerprint(report) {
  const {reportFingerprintSha256: ignored, ...payload} = report;
  return sha256(Buffer.from(JSON.stringify(canonicalize(payload)), "utf8"));
}

function modeString(stat) {
  return (Number(stat.mode) & 0o7777).toString(8).padStart(4, "0");
}

function statIdentity(stat) {
  return [stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs,
    stat.mode, stat.nlink].map(String).join(":");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function resolveInside(root, relativePath) {
  assert.ok(typeof relativePath === "string" && relativePath.length > 0 &&
    !path.isAbsolute(relativePath));
  const absolute = path.resolve(root, relativePath);
  const relative = portable(path.relative(root, absolute));
  assert.ok(relative && !relative.startsWith("../") &&
    !path.isAbsolute(relative), `${relativePath} escapes the project root`);
  return absolute;
}

async function canonicalRoot(root) {
  return realpath(path.resolve(root));
}

async function readStable(root, label, expected) {
  const rootReal = await canonicalRoot(root);
  const absolute = resolveInside(root, expected.path);
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `${label} is not an ordinary non-symlink file`);
  const resolved = await realpath(absolute);
  assert.ok(resolved.startsWith(`${rootReal}${path.sep}`),
    `${label} resolves outside the project root`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `${label} changed during the snapshot`);
  const descriptor = {
    path: expected.path,
    bytes: bytes.length,
    sha256: sha256(bytes),
    mode: modeString(after),
  };
  assert.deepEqual(descriptor, expected, `${label} descriptor drifted`);
  return {descriptor, bytes, statIdentity: statIdentity(after)};
}

function parseJson(input, label) {
  try {
    return JSON.parse(input.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const inputs = {};
  const records = [];
  for (const [key, expected] of Object.entries(EXPECTED_INPUTS)) {
    const record = await readStable(root, key, expected);
    records.push(record);
    inputs[key] = record;
  }
  const identities = {};
  for (const [key, relativePath] of Object.entries({
    generator: GENERATOR_PATH,
    test: TEST_PATH,
  })) {
    const absolute = resolveInside(root, relativePath);
    const stat = await lstat(absolute, {bigint: true});
    const expected = {
      path: relativePath,
      bytes: Number(stat.size),
      sha256: sha256(await readFile(absolute)),
      mode: modeString(stat),
    };
    const record = await readStable(root, key, expected);
    records.push(record);
    identities[key] = record;
  }
  return {projectRoot: root, inputs, identities, records};
}

async function assertSnapshotUnchanged(snapshot) {
  for (const record of snapshot.records) {
    const current = await lstat(resolveInside(snapshot.projectRoot,
      record.descriptor.path), {bigint: true});
    assert.equal(statIdentity(current), record.statIdentity,
      `${record.descriptor.path} changed after the snapshot`);
  }
}

export function deriveContract(snapshot) {
  const v9 = parseJson(snapshot.inputs.v9Contract, "v9Contract");
  const geometry = parseJson(snapshot.inputs.geometryJson, "geometryJson");
  validateV9Contract(v9);
  validateGeometryReport(geometry);
  assert.equal(geometry.dispositionBoundary.currentDisposition, "unresolved");
  assert.equal(geometry.predecessorGapEffect
    .formalNaturalScheduleReadyCountChange, 0);
  assert.equal(geometry.securityAndRuntimeBoundary
    .originalRuntimeLaunchAuthorizedByThisArtifact, false);

  const inputBindings = Object.fromEntries(Object.entries(snapshot.inputs)
    .map(([key, value]) => [key, value.descriptor]));
  const report = {
    ...v9,
    schemaVersion: 10,
    reportType: "g4-l10-complete-migration-template-contract-v10",
    evidenceDate: "2026-08-07",
    status: "fail-closed-template-not-stable",
    templateStable: false,
    successorOf: snapshot.inputs.v9Contract.descriptor,
    authorityBoundary: {
      ...v9.authorityBoundary,
      readOnlyRecomputation: true,
      createsRuntimeEvidence: false,
      createsRenderer: false,
      mayLaunchOriginalRuntime: false,
      mayApplyDownstreamTransaction: false,
      mayRefreshOrAdoptEvidence: false,
      mayRegisterRenderer: false,
      mayMarkAcceptanceOrCompletion: false,
      mayIntegrateOrPublish: false,
    },
    latestAuditCurrentness: {
      ...v9.latestAuditCurrentness,
      ts007Sprite64InteractionGeometry: {
        json: snapshot.inputs.geometryJson.descriptor,
        markdown: snapshot.inputs.geometryMarkdown.descriptor,
        status: geometry.status,
        decision: geometry.decision,
        reportFingerprintSha256: geometry.reportFingerprintSha256,
        animationId: geometry.animationId,
        interactionTargets: geometry.interactionTargets.map((row) => ({
          targetId: row.targetId,
          nativeStageAxisAlignedBoundsPixels:
            row.nativeStageAxisAlignedBoundsPixels,
          safeIntegerNativeStagePoint: row.safeIntegerNativeStagePoint,
          roundedPointInsideNonzeroAlphaFill:
            row.roundedPointInsideNonzeroAlphaFill,
          inputExecuted: false,
        })),
        rotationAnchor: geometry.rotationAnchor,
        integerAngleProbeCandidateCount:
          geometry.integerAngleProbeCandidates.length,
        integerCoveredSourceBranches: [...new Set(
          geometry.integerAngleProbeCandidates.map((row) =>
            row.sourceBranch))].sort(),
        equalityBranchMathematicalCandidateCount:
          geometry.exactEqualityBranchCandidates.length,
        equalityBranchExecutableCandidateCount:
          geometry.exactEqualityBranchCandidates.filter((row) =>
            row.operatorExecutableByThisReport).length,
        equalityBranchSubpixelPrecisionRequired:
          geometry.exactEqualityBranchCandidates.every((row) =>
            row.subpixelPointerPrecisionRequired),
        sourceStaticIntegerCandidateMatrixDerived:
          geometry.predecessorGapEffect
            .sourceStaticIntegerCandidateMatrixNowDerived,
        currentDisposition: geometry.dispositionBoundary.currentDisposition,
        formalTraceSpecification: false,
        captureKitCreated: false,
        pointerInputExecuted: false,
        runtimeEntryObserved: false,
        formalNaturalScheduleReadyCountChange: 0,
        formalStateChangeFromV9: false,
        templateStableEffect: false,
        acceptanceEffect: "none",
      },
      formalStateChangeFromV9: false,
      templateStableEffect: false,
      acceptanceEffect: "none",
    },
    inputBindings: {
      ...v9.inputBindings,
      v10SuccessorInputs: inputBindings,
    },
    builder: {
      generator: snapshot.identities.generator.descriptor,
      test: snapshot.identities.test.descriptor,
    },
  };
  delete report.reportFingerprintSha256;
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateContract(report);
  return report;
}

export function validateContract(report) {
  assert.equal(report.schemaVersion, 10);
  assert.equal(report.reportType,
    "g4-l10-complete-migration-template-contract-v10");
  assert.equal(report.status, "fail-closed-template-not-stable");
  assert.equal(report.templateStable, false);
  assert.equal(report.scope.memberCount, 47);
  assert.equal(report.currentFormalState.requirements.total, 520);
  assert.equal(report.currentFormalState.requirements.rootReady, 94);
  assert.equal(report.currentFormalState.requirements.unresolvedNested, 426);
  assert.equal(report.currentFormalState.requirements.naturalScheduleReady, 0);
  assert.equal(report.currentFormalState.requirements
    .unresolvedFrameDomainDispositions, 74);
  assert.equal(report.currentFormalState.frameObligations.total, 44488);
  assert.equal(report.currentFormalState.frameObligations.authoritativeCaptured,
    0);
  const geometry = report.latestAuditCurrentness
    .ts007Sprite64InteractionGeometry;
  assert.equal(geometry.interactionTargets.length, 2);
  assert.ok(geometry.interactionTargets.every((row) =>
    row.roundedPointInsideNonzeroAlphaFill === true &&
    row.inputExecuted === false));
  assert.equal(geometry.integerAngleProbeCandidateCount, 8);
  assert.deepEqual(geometry.integerCoveredSourceBranches, [
    "degrees_Mirrored_gt_0_lt_180",
    "degrees_Mirrored_gt_180_lt_360",
  ]);
  assert.equal(geometry.equalityBranchMathematicalCandidateCount, 2);
  assert.equal(geometry.equalityBranchExecutableCandidateCount, 0);
  assert.equal(geometry.equalityBranchSubpixelPrecisionRequired, true);
  assert.equal(geometry.currentDisposition, "unresolved");
  assert.equal(geometry.formalTraceSpecification, false);
  assert.equal(geometry.captureKitCreated, false);
  assert.equal(geometry.pointerInputExecuted, false);
  assert.equal(geometry.runtimeEntryObserved, false);
  assert.equal(geometry.formalNaturalScheduleReadyCountChange, 0);
  assert.equal(geometry.formalStateChangeFromV9, false);
  assert.equal(report.latestAuditCurrentness.formalStateChangeFromV9, false);
  assert.equal(report.latestAuditCurrentness.templateStableEffect, false);
  assert.equal(report.latestSecurityReviewBoundary
    .productionHelperImplementationEligible, false);
  assert.equal(report.authorityBoundary.mayLaunchOriginalRuntime, false);
  assert.equal(report.downstreamTransactionBoundary.applyAuthorized, false);
  assert.ok(Object.values(report.acceptanceEffects).every((value) =>
    value === false));
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
  return report;
}

export function renderMarkdown(report) {
  const geometry = report.latestAuditCurrentness
    .ts007Sprite64InteractionGeometry;
  return `# Grade 4 Lesson 10 complete migration template contract v10\n\n` +
    `Status: **${report.status}**. Template stable: **${report.templateStable}**.\n\n` +
    `V10 validates and preserves v9, then binds the TS007 sprite-64 ` +
    `source-static interaction-geometry successor.\n\n` +
    `## New static currentness\n\n` +
    `- Source-filled integer target points: **${geometry.interactionTargets.length}**.\n` +
    `- Integer angle probes: **${geometry.integerAngleProbeCandidateCount}**, ` +
    `covering the two strict range branches.\n` +
    `- Equality-branch mathematical candidates: ` +
    `**${geometry.equalityBranchMathematicalCandidateCount}**; executable ` +
    `candidates: **${geometry.equalityBranchExecutableCandidateCount}**.\n` +
    `- The equality axis remains a half-pixel precision and coordinate-mapping ` +
    `problem; no pointer input was executed.\n\n` +
    `## Retained gate\n\n` +
    `TS007 sprite-64 remains unresolved. Natural schedules remain ` +
    `${report.currentFormalState.requirements.naturalScheduleReady}/` +
    `${report.currentFormalState.requirements.total}; authoritative runtime ` +
    `frames remain ${report.currentFormalState.frameObligations.authoritativeCaptured}/` +
    `${report.currentFormalState.frameObligations.total}. No capture kit, ` +
    `specification, helper, runtime, renderer, comparison, review, acceptance, ` +
    `integration, promotion, release, or publication authority is created.\n\n` +
    `Report fingerprint: \`${report.reportFingerprintSha256}\`.\n`;
}

export async function buildBundle(projectRoot = PROJECT_ROOT) {
  const snapshot = await readSnapshot(projectRoot);
  const report = deriveContract(snapshot);
  return {
    snapshot,
    report,
    json: `${JSON.stringify(report, null, 2)}\n`,
    markdown: renderMarkdown(report),
  };
}

async function outputState(root, relativePath) {
  const absolute = resolveInside(root, relativePath);
  try {
    return {absolute, info: await lstat(absolute)};
  } catch (error) {
    if (error?.code === "ENOENT") return {absolute, info: null};
    throw error;
  }
}

export async function checkContract(bundle,
  outputRoot = bundle.snapshot.projectRoot, options = {}) {
  const root = await canonicalRoot(outputRoot);
  for (const [relativePath, expectedContent] of [
    [REPORT_JSON, bundle.json],
    [REPORT_MARKDOWN, bundle.markdown],
  ]) {
    const absolute = resolveInside(root, relativePath);
    const stat = await lstat(absolute);
    assert.ok(stat.isFile() && !stat.isSymbolicLink());
    assert.equal(modeString(stat), "0444", `${relativePath} mode changed`);
    const observed = await readFile(absolute);
    assert.equal(observed.length, Buffer.byteLength(expectedContent),
      `${relativePath} byte count changed`);
    assert.equal(sha256(observed), sha256(Buffer.from(expectedContent)),
      `${relativePath} SHA-256 changed`);
  }
  if (options.skipInputCheck !== true) await assertSnapshotUnchanged(bundle.snapshot);
  return {
    disposition: "checked",
    status: bundle.report.status,
    reportFingerprintSha256: bundle.report.reportFingerprintSha256,
    templateStable: false,
    safeIntegerTargetPointCount: 2,
    equalityBranchExecutableCandidateCount: 0,
    naturalScheduleReady: 0,
    originalRuntimeAuthorized: false,
    acceptanceEffect: false,
  };
}

export async function publishNoClobber(bundle, options = {}) {
  const root = await canonicalRoot(options.outputRoot ??
    bundle.snapshot.projectRoot);
  const jsonState = await outputState(root, REPORT_JSON);
  const markdownState = await outputState(root, REPORT_MARKDOWN);
  assert.equal(jsonState.info, null,
    `Output already exists; refusing overwrite: ${REPORT_JSON}`);
  assert.equal(markdownState.info, null,
    `Output already exists; refusing overwrite: ${REPORT_MARKDOWN}`);
  await assertSnapshotUnchanged(bundle.snapshot);
  await writeFile(jsonState.absolute, bundle.json, {flag: "wx", mode: 0o600});
  await chmod(jsonState.absolute, 0o444);
  await (options.beforeMarkdown ?? (async () => {}))();
  await assertSnapshotUnchanged(bundle.snapshot);
  await writeFile(markdownState.absolute, bundle.markdown,
    {flag: "wx", mode: 0o600});
  await chmod(markdownState.absolute, 0o444);
  await assertSnapshotUnchanged(bundle.snapshot);
  return checkContract(bundle, root, {skipInputCheck: true});
}

export function parseCliArgs(args) {
  assert.equal(args.length, 1,
    "Choose exactly one of --dry-run, --write-no-clobber, or --check");
  assert.ok(["--dry-run", "--write-no-clobber", "--check"].includes(args[0]),
    "Expected --dry-run, --write-no-clobber, or --check");
  return args[0];
}

export async function runCli(args = process.argv.slice(2),
  projectRoot = PROJECT_ROOT) {
  const mode = parseCliArgs(args);
  const bundle = await buildBundle(projectRoot);
  if (mode === "--write-no-clobber") return publishNoClobber(bundle);
  if (mode === "--check") return checkContract(bundle);
  return {
    disposition: "dry-run",
    status: bundle.report.status,
    reportFingerprintSha256: bundle.report.reportFingerprintSha256,
    templateStable: false,
    safeIntegerTargetPointCount: 2,
    equalityBranchExecutableCandidateCount: 0,
    naturalScheduleReady: 0,
    originalRuntimeAuthorized: false,
    acceptanceEffect: false,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runCli().then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
