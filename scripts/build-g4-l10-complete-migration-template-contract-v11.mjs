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

import {validateContract as validateV10Contract} from
  "./build-g4-l10-complete-migration-template-contract-v10.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const REPORT_JSON =
  "reports/g4-l10-complete-migration-template-contract-v11-2026-08-07.json";
export const REPORT_MARKDOWN =
  "reports/g4-l10-complete-migration-template-contract-v11-2026-08-07.md";
export const GENERATOR_PATH =
  "scripts/build-g4-l10-complete-migration-template-contract-v11.mjs";
export const TEST_PATH =
  "scripts/build-g4-l10-complete-migration-template-contract-v11.test.mjs";

const TARGET_SHA256 =
  "a86c726ca5e3ae89cfb110c1a3dedb751c3cb2c51d1b737a908a91ddd0bf9510";

const EXPECTED_INPUTS = Object.freeze({
  v10Contract: {
    path: "reports/g4-l10-complete-migration-template-contract-v10-2026-08-07.json",
    bytes: 261987,
    sha256: "151435b1e95a70f59226e512c21add6bac30cca79a4965852fe6d958767abf9a",
    mode: "0444",
  },
  v10Markdown: {
    path: "reports/g4-l10-complete-migration-template-contract-v10-2026-08-07.md",
    bytes: 965,
    sha256: "7611aad5f1e08a319e97b77ab9f58bc225c5064c87af0fda4f8691f7d548268e",
    mode: "0444",
  },
  v10Generator: {
    path: "scripts/build-g4-l10-complete-migration-template-contract-v10.mjs",
    bytes: 18655,
    sha256: "c71d5dd57b0d9d0d9f3eace194d75bb7e2dd40e5ed6f8ae4e3fc843558ba0609",
    mode: "0644",
  },
  v10Test: {
    path: "scripts/build-g4-l10-complete-migration-template-contract-v10.test.mjs",
    bytes: 4847,
    sha256: "748054fed2c295272a16ff8fe2cfae932f55873facf1bb4541c110c31b3a714c",
    mode: "0644",
  },
  frozenTarget: {
    path: "docs/G4_L10_NATIVE_HELPER_V2_14_SECURITY_CONTRACT_SUCCESSOR.md",
    bytes: 50310,
    sha256: TARGET_SHA256,
    mode: "0444",
  },
  reviewProtocolV215: {
    path: "docs/G4_L10_NATIVE_HELPER_V2_15_REVIEW_PROTOCOL_SUCCESSOR.md",
    bytes: 9873,
    sha256: "2f3161f93209b8ec5ba87d36cd11557fee8790087af60984ca9eefc9923caea7",
    mode: "0644",
  },
  deterministicVerifierV215: {
    path: "scripts/g4-l10-native-helper-v2_15-review-verifier.mjs",
    bytes: 37369,
    sha256: "99e6ec770a74e3a344ddd4138718bc8a04c5032314dc7402b1cd3b937d716b70",
    mode: "0644",
  },
  deterministicVerifierTestV215: {
    path: "scripts/g4-l10-native-helper-v2_15-review-verifier.test.mjs",
    bytes: 9301,
    sha256: "363783b17bcc04556e7121721f6115b8d87ed196a82e51537be3dd3733faf88b",
    mode: "0644",
  },
  strictV214HistoryClosure: {
    path: "reports/g4-l10-native-helper-strict-v2-14-history-closure-v1.json",
    bytes: 6187,
    sha256: "67d10b77decee152a7a6ffeaa13c44708d81d49870dd24bd824afae599d9a6d1",
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

function assertProtocol(protocolText) {
  const required = [
    "Status: active review-procedure successor authorized by the project owner on 2026-08-07.",
    "No new HMG4RB4 batch may be created.",
    "There is no HMG4RB successor batch token.",
    "VERIFIED_INPUTS_READY_FOR_HUMAN_REVIEW",
    "Only three complete independent `P0/P1/P2=0/0/0` conclusions with an empty combined finding union may be called `spec-review-qualified`.",
    "spec-review-qualified has no implementation or runtime authority.",
  ];
  for (const marker of required) {
    assert.ok(protocolText.includes(marker),
      `v2.15 protocol marker missing: ${marker}`);
  }
}

function assertHistoryClosure(history) {
  assert.equal(history.artifactType,
    "g4-l10-native-helper-v2-14-strict-history-closure");
  assert.equal(history.status, "STRICT_BUT_NONQUALIFYING_CLOSED");
  assert.deepEqual(history.summary, {
    artifactCount: 17,
    targetCount: 1,
    activationReceiptCount: 4,
    failedBatchReceiptCount: 6,
    chunkPlanCount: 6,
    qualifyingReviewCount: 0,
  });
  assert.equal(history.failedHMG4RB4.length, 6);
  assert.equal(history.rules.newHMG4RB4BatchesAllowed, false);
  assert.equal(history.rules.newV214PrefixedArtifactsAllowed, false);
  assert.equal(history.rules.historicalResultCanBecomePass, false);
  assert.equal(history.rules.historicalTaskOrOutputReuseAllowed, false);
  assert.equal(history.rules.implementationAuthority, false);
  assert.equal(history.rules.runtimeAuthority, false);
  const target = history.artifacts.find((entry) =>
    entry.role === "frozen-target");
  assert.deepEqual(target, {
    role: "frozen-target",
    path: EXPECTED_INPUTS.frozenTarget.path,
    bytes: EXPECTED_INPUTS.frozenTarget.bytes,
    lfCount: 173,
    mode: EXPECTED_INPUTS.frozenTarget.mode,
    sha256: TARGET_SHA256,
  });
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
  const v10 = parseJson(snapshot.inputs.v10Contract, "v10Contract");
  const history = parseJson(snapshot.inputs.strictV214HistoryClosure,
    "strictV214HistoryClosure");
  const protocolText = snapshot.inputs.reviewProtocolV215.bytes.toString("utf8");
  validateV10Contract(v10);
  assertProtocol(protocolText);
  assertHistoryClosure(history);

  const inputBindings = Object.fromEntries(Object.entries(snapshot.inputs)
    .map(([key, value]) => [key, value.descriptor]));
  const report = {
    ...v10,
    schemaVersion: 11,
    reportType: "g4-l10-complete-migration-template-contract-v11",
    evidenceDate: "2026-08-07",
    status: "fail-closed-template-not-stable",
    templateStable: false,
    successorOf: snapshot.inputs.v10Contract.descriptor,
    latestSecurityReviewBoundary: {
      protocolStatus: "active-review-procedure-successor",
      target: snapshot.inputs.frozenTarget.descriptor,
      protocol: snapshot.inputs.reviewProtocolV215.descriptor,
      deterministicVerifier:
        snapshot.inputs.deterministicVerifierV215.descriptor,
      deterministicVerifierTest:
        snapshot.inputs.deterministicVerifierTestV215.descriptor,
      closedHistory:
        snapshot.inputs.strictV214HistoryClosure.descriptor,
      closedHistoryStatus: history.status,
      closedHistoryArtifactCount: history.summary.artifactCount,
      closedHistoryQualifyingReviewCount:
        history.summary.qualifyingReviewCount,
      requiredScopes: ["schema", "adversarial", "whole"],
      commonIdentityFields: [
        "target",
        "protocol",
        "deterministic-verifier",
        "closed-history",
      ],
      newHMG4RB4Allowed: false,
      hmg4rbSuccessorTokenExists: false,
      historicalTaskOrOutputReuseAllowed: false,
      deterministicInputStructureReadyForReviewerPreflight: true,
      parentPreflightReceiptBound: false,
      reviewerPreflightReceiptCountBound: 0,
      reviewerEvidenceReceiptCountBound: 0,
      reviewerHumanConclusionCountBound: 0,
      qualifyingReviewerConclusionCountBound: 0,
      reviewerFindingUnionEvaluated: false,
      specReviewQualified: false,
      userOwnedTaskCreationAuthorizedByThisArtifact: false,
      authenticatedReviewerExecutionPerformedByThisArtifact: false,
      productionHelperImplementationEligible: false,
      productionHelperImplementationAuthorized: false,
      originalRuntimeLaunchAuthorized: false,
      acceptanceEffect: "none",
    },
    authorityBoundary: {
      ...v10.authorityBoundary,
      readOnlyRecomputation: true,
      createsReviewPreflightReceipt: false,
      createsReviewerEvidenceReceipt: false,
      createsReviewerConclusion: false,
      createsRuntimeEvidence: false,
      createsRenderer: false,
      mayCreateUserOwnedTask: false,
      mayLaunchOriginalRuntime: false,
      mayImplementOrTestProductionHelper: false,
      mayApplyDownstreamTransaction: false,
      mayRefreshOrAdoptEvidence: false,
      mayRegisterRenderer: false,
      mayMarkAcceptanceOrCompletion: false,
      mayIntegrateOrPublish: false,
    },
    inputBindings: {
      ...v10.inputBindings,
      v11SuccessorInputs: inputBindings,
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
  assert.equal(report.schemaVersion, 11);
  assert.equal(report.reportType,
    "g4-l10-complete-migration-template-contract-v11");
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
  const security = report.latestSecurityReviewBoundary;
  assert.equal(security.target.sha256, TARGET_SHA256);
  assert.equal(security.closedHistoryStatus,
    "STRICT_BUT_NONQUALIFYING_CLOSED");
  assert.equal(security.closedHistoryArtifactCount, 17);
  assert.equal(security.closedHistoryQualifyingReviewCount, 0);
  assert.deepEqual(security.requiredScopes,
    ["schema", "adversarial", "whole"]);
  assert.deepEqual(security.commonIdentityFields, [
    "target",
    "protocol",
    "deterministic-verifier",
    "closed-history",
  ]);
  assert.equal(security.newHMG4RB4Allowed, false);
  assert.equal(security.hmg4rbSuccessorTokenExists, false);
  assert.equal(security.historicalTaskOrOutputReuseAllowed, false);
  assert.equal(security.deterministicInputStructureReadyForReviewerPreflight,
    true);
  assert.equal(security.parentPreflightReceiptBound, false);
  assert.equal(security.reviewerPreflightReceiptCountBound, 0);
  assert.equal(security.reviewerEvidenceReceiptCountBound, 0);
  assert.equal(security.reviewerHumanConclusionCountBound, 0);
  assert.equal(security.qualifyingReviewerConclusionCountBound, 0);
  assert.equal(security.reviewerFindingUnionEvaluated, false);
  assert.equal(security.specReviewQualified, false);
  assert.equal(security.userOwnedTaskCreationAuthorizedByThisArtifact, false);
  assert.equal(security.authenticatedReviewerExecutionPerformedByThisArtifact,
    false);
  assert.equal(security.productionHelperImplementationEligible, false);
  assert.equal(security.productionHelperImplementationAuthorized, false);
  assert.equal(security.originalRuntimeLaunchAuthorized, false);
  assert.equal(report.authorityBoundary.mayCreateUserOwnedTask, false);
  assert.equal(report.authorityBoundary.mayImplementOrTestProductionHelper,
    false);
  assert.equal(report.authorityBoundary.mayLaunchOriginalRuntime, false);
  assert.equal(report.downstreamTransactionBoundary.applyAuthorized, false);
  assert.ok(Object.values(report.acceptanceEffects).every((value) =>
    value === false));
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
  return report;
}

export function renderMarkdown(report) {
  const security = report.latestSecurityReviewBoundary;
  return `# Grade 4 Lesson 10 complete migration template contract v11\n\n` +
    `Status: **${report.status}**. Template stable: **${report.templateStable}**.\n\n` +
    `V11 validates and preserves v10, then binds the active v2.15 ` +
    `independent-review procedure, its deterministic verifier and test, the ` +
    `frozen v2.14 target, and the strict nonqualifying history closure.\n\n` +
    `## Security review boundary\n\n` +
    `- Closed v2.14 history artifacts: **${security.closedHistoryArtifactCount}**; ` +
    `qualifying historical reviews: **${security.closedHistoryQualifyingReviewCount}**.\n` +
    `- Required independent scopes: **${security.requiredScopes.join(", ")}**.\n` +
    `- New HMG4RB4 allowed: **${security.newHMG4RB4Allowed}**; ` +
    `HMG4RB successor token exists: **${security.hmg4rbSuccessorTokenExists}**.\n` +
    `- Bound reviewer preflights/evidence/conclusions: ` +
    `**${security.reviewerPreflightReceiptCountBound}/` +
    `${security.reviewerEvidenceReceiptCountBound}/` +
    `${security.reviewerHumanConclusionCountBound}**.\n` +
    `- spec-review-qualified: **${security.specReviewQualified}**.\n\n` +
    `## Retained migration gate\n\n` +
    `Lesson 10 remains 47 members with ` +
    `${report.currentFormalState.requirements.naturalScheduleReady}/` +
    `${report.currentFormalState.requirements.total} natural schedules ready ` +
    `and ${report.currentFormalState.frameObligations.authoritativeCaptured}/` +
    `${report.currentFormalState.frameObligations.total} authoritative runtime ` +
    `frames captured. This artifact creates no task, reviewer receipt or ` +
    `conclusion, helper implementation/test, original-runtime launch, ` +
    `specification adoption, renderer, comparison, review, acceptance, ` +
    `integration, promotion, release, or publication authority.\n\n` +
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
    activeReviewProtocol: "v2.15",
    reviewerConclusionCountBound: 0,
    specReviewQualified: false,
    naturalScheduleReady: 0,
    originalRuntimeAuthorized: false,
    productionHelperAuthorized: false,
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
    activeReviewProtocol: "v2.15",
    reviewerConclusionCountBound: 0,
    specReviewQualified: false,
    naturalScheduleReady: 0,
    originalRuntimeAuthorized: false,
    productionHelperAuthorized: false,
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
