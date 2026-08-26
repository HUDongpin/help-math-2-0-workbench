import {createHash} from "node:crypto";
import {open, readFile, lstat} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

export const OUTPUT_RELATIVE_PATH =
  "reports/g4-l10-vb003-conditional-operator-gate-v1.json";
export const CONTRACT_RELATIVE_PATH =
  "docs/G4_L10_NATIVE_HELPER_V2_14_SECURITY_CONTRACT_SUCCESSOR.md";
export const PROTOCOL_RELATIVE_PATH =
  "reports/g4-l10-root-capture-kit-protocol-v3-successor.json";

const EXPECTED_CONTRACT = Object.freeze({
  bytes: 50_310,
  mode: "0444",
  sha256: "a86c726ca5e3ae89cfb110c1a3dedb751c3cb2c51d1b737a908a91ddd0bf9510",
});
const EXPECTED_PROTOCOL = Object.freeze({
  bytes: 328_835,
  mode: "0644",
  sha256: "9c403289c12be94150b4afa783711ff377a0ea3c1dc6831446e5448a234e8753",
});
const EXPECTED_SOURCE_SWF_SHA256 =
  "96a0c6c9cd7f5813d06e382bcb9dc2b81a0c0127a9865222dea1abba96a8d93d";
const EXPECTED_REQUIREMENTS = Object.freeze([
  Object.freeze({
    language: "en",
    requirementId: "req-default-root-en",
    captureKitManifestSha256:
      "c217a225043ab019b19b69f61eb626b32b9811f0dd78d1ddb5930b1d28997f9b",
    treeSha256: "d27e244f9f470445ef936d65b8e7cf2cf4f1dd14cff95fb1e9a63fd83f2f899d",
  }),
  Object.freeze({
    language: "es",
    requirementId: "req-default-root-es",
    captureKitManifestSha256:
      "1055a6f34269fcfaf7eb17391ed302d89cbddcca204f17755095a39ecc8a2bfc",
    treeSha256: "227f0494f58d4b7b99767e1f0cb59f820d85377c33a73b88672b8e032d46775c",
  }),
]);

const REQUIRED_CONTRACT_ANCHORS = Object.freeze([
  "The user’s prior task-creation authorization named only v2.13 SHA-256",
  "No implementation task may be created until a valid v2.14 batch",
  "Peter Hu’s named original-runtime operator status is not activated by v2.14.",
  "fresh checked launch receipt for every start",
  "migrations/course-g04-l10-vb-003",
]);

const EXCLUSIONS = Object.freeze([
  "other-L10-members",
  "other-courses",
  "protected-installation",
  "apply-or-recover",
  "acceptance",
  "promotion",
  "integration",
  "release",
  "publication",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function modeString(stat) {
  return (stat.mode & 0o777n).toString(8).padStart(4, "0");
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

export function renderJson(value) {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

async function readStableOrdinary(projectRoot, relativePath, expected) {
  const absolutePath = path.join(projectRoot, relativePath);
  const before = await lstat(absolutePath, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink(), `${relativePath}: not an ordinary file`);
  invariant(before.nlink === 1n, `${relativePath}: link count must be one`);
  const bytes = await readFile(absolutePath);
  const after = await lstat(absolutePath, {bigint: true});
  invariant(
    before.dev === after.dev
      && before.ino === after.ino
      && before.size === after.size
      && before.mtimeNs === after.mtimeNs,
    `${relativePath}: changed while being read`,
  );
  const record = {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    mode: modeString(after),
    nlink: Number(after.nlink),
  };
  invariant(record.bytes === expected.bytes, `${relativePath}: byte count changed`);
  invariant(record.sha256 === expected.sha256, `${relativePath}: SHA-256 changed`);
  invariant(record.mode === expected.mode, `${relativePath}: mode changed`);
  invariant(record.nlink === 1, `${relativePath}: link count changed`);
  return {bytes, record};
}

function findExactKits(protocol) {
  invariant(protocol?.reportType === "g4-l10-root-capture-kit-protocol-v3-successor", "Protocol report type changed");
  invariant(protocol?.schemaVersion === 1, "Protocol schema version changed");
  invariant(
    protocol?.status === "materialized-unsigned-protocol-successor-not-operator-ready-not-evidence",
    "Protocol status changed",
  );
  invariant(protocol?.safety?.operatorReady === false, "Protocol unexpectedly became operator-ready");
  invariant(protocol?.safety?.projectorLaunched === false, "Protocol reports a projector launch");
  invariant(protocol?.safety?.animateLaunched === false, "Protocol reports an Animate launch");
  invariant(protocol?.protocol?.operatorReadiness?.operatorReady === false, "Protocol operator readiness changed");
  invariant(protocol?.v3ParallelRoot?.summary?.actualRuntimeSessions === 0, "Protocol runtime-session count changed");
  invariant(protocol?.v3ParallelRoot?.summary?.actualLaunchReceipts === 0, "Protocol launch-receipt count changed");
  invariant(protocol?.v3ParallelRoot?.summary?.capturePngs === 0, "Protocol capture PNG count changed");
  const kits = protocol?.v3ParallelRoot?.kits?.filter(
    (kit) => kit.animationId === "course-g04-l10-vb-003",
  );
  invariant(Array.isArray(kits) && kits.length === 2, "Expected exactly two VB003 root kits");
  return EXPECTED_REQUIREMENTS.map((expected) => {
    const kit = kits.find(
      (candidate) => candidate.language === expected.language
        && candidate.requirementId === expected.requirementId,
    );
    invariant(kit, `Missing ${expected.language} VB003 root kit`);
    invariant(kit.ordinal === 7, `${expected.language} kit ordinal changed`);
    invariant(kit.frameCount === 10, `${expected.language} kit frame count changed`);
    invariant(kit.nativeStage?.width === 800 && kit.nativeStage?.height === 600, `${expected.language} kit stage changed`);
    invariant(kit.sourceSwfSha256 === EXPECTED_SOURCE_SWF_SHA256, `${expected.language} source SHA-256 changed`);
    invariant(
      kit.captureKitManifestSha256 === expected.captureKitManifestSha256,
      `${expected.language} manifest SHA-256 changed`,
    );
    invariant(kit.tree?.sha256 === expected.treeSha256, `${expected.language} kit-tree SHA-256 changed`);
    invariant(kit.tree?.fileCount === 13, `${expected.language} kit file count changed`);
    invariant(
      kit.technicalIdentity?.currentRawTraceSpecFileSha256Reverified === true,
      `${expected.language} raw trace-spec identity is not reverified`,
    );
    invariant(
      kit.technicalIdentity?.upstreamProjectionCurrentnessEstablished === false,
      `${expected.language} upstream currentness unexpectedly changed`,
    );
    return {
      animationId: kit.animationId,
      language: kit.language,
      requirementId: kit.requirementId,
      ordinal: kit.ordinal,
      frameCount: kit.frameCount,
      nativeStage: kit.nativeStage,
      sourceSwfSha256: kit.sourceSwfSha256,
      captureKitManifestSha256: kit.captureKitManifestSha256,
      tree: {
        fileCount: kit.tree.fileCount,
        totalBytes: kit.tree.totalBytes,
        sha256: kit.tree.sha256,
      },
      traceSpec: kit.technicalIdentity.currentRawTraceSpec,
      upstreamProjectionCurrentnessEstablished: false,
      kitIsOriginalRuntimeEvidence: false,
      kitIsOperatorReady: false,
    };
  });
}

export function validateReport(report) {
  invariant(report?.schemaVersion === "help-math-g4-l10-vb003-conditional-operator-gate/v1", "Report schema changed");
  invariant(report?.artifactType === "g4-l10-vb003-conditional-operator-gate", "Artifact type changed");
  invariant(report?.status === "conditional-designation-recorded-not-activated-not-operator-ready", "Report status changed");
  invariant(report?.decision === "DO_NOT_LAUNCH", "Decision must remain DO_NOT_LAUNCH");
  invariant(report?.scope?.animationId === "course-g04-l10-vb-003", "Animation scope changed");
  invariant(report?.scope?.exactCaptureKitCount === 2, "Capture-kit scope changed");
  invariant(JSON.stringify(report?.scope?.languages) === JSON.stringify(["en", "es"]), "Language scope changed");
  invariant(report?.operator?.name === "Peter Hu", "Named operator changed");
  invariant(report?.operator?.designationRecorded === true, "Conditional designation is not recorded");
  invariant(report?.operator?.activated === false, "Operator must not be activated");
  invariant(report?.operator?.operatorReady === false, "Operator must not be ready");
  invariant(report?.operator?.authorizationScopeExpansion === false, "Operator scope expanded");
  invariant(report?.launchReceipt?.freshReceiptRequiredForEveryStart === true, "Fresh launch receipt rule changed");
  invariant(report?.launchReceipt?.receiptCheckedBeforeLaunch === true, "Pre-launch receipt check rule changed");
  invariant(report?.launchReceipt?.postHocReceiptAllowed === false, "Post-hoc receipt became allowed");
  invariant(report?.launchReceipt?.launchAuthorizedNow === false, "Launch became authorized");
  invariant(report?.gates?.allSatisfied === false, "All gates unexpectedly became satisfied");
  for (const [name, value] of Object.entries(report?.gates?.current || {})) {
    invariant(value === false, `Gate ${name} must remain false`);
  }
  invariant(JSON.stringify(report?.exclusions) === JSON.stringify(EXCLUSIONS), "Exclusions changed");
  for (const [name, value] of Object.entries(report?.acceptanceEffects || {})) {
    invariant(value === false, `Acceptance effect ${name} must remain false`);
  }
  invariant(Array.isArray(report?.captureKits) && report.captureKits.length === 2, "Exact kit count changed");
  for (const kit of report.captureKits) {
    invariant(kit.kitIsOriginalRuntimeEvidence === false, `${kit.language} kit gained runtime authority`);
    invariant(kit.kitIsOperatorReady === false, `${kit.language} kit became operator-ready`);
    invariant(kit.upstreamProjectionCurrentnessEstablished === false, `${kit.language} upstream currentness expanded`);
  }
  const fingerprint = report.reportFingerprintSha256;
  const withoutFingerprint = {...report};
  delete withoutFingerprint.reportFingerprintSha256;
  invariant(fingerprint === sha256(Buffer.from(renderJson(withoutFingerprint))), "Report fingerprint changed");
  return true;
}

export async function buildReport({projectRoot = PROJECT_ROOT} = {}) {
  const contract = await readStableOrdinary(projectRoot, CONTRACT_RELATIVE_PATH, EXPECTED_CONTRACT);
  const contractText = contract.bytes.toString("utf8");
  for (const anchor of REQUIRED_CONTRACT_ANCHORS) {
    invariant(contractText.includes(anchor), `Security contract anchor missing: ${anchor}`);
  }
  const protocolSource = await readStableOrdinary(projectRoot, PROTOCOL_RELATIVE_PATH, EXPECTED_PROTOCOL);
  const protocol = JSON.parse(protocolSource.bytes.toString("utf8"));
  const captureKits = findExactKits(protocol);
  const reportWithoutFingerprint = {
    schemaVersion: "help-math-g4-l10-vb003-conditional-operator-gate/v1",
    artifactType: "g4-l10-vb003-conditional-operator-gate",
    reportDate: "2026-08-06",
    status: "conditional-designation-recorded-not-activated-not-operator-ready",
    decision: "DO_NOT_LAUNCH",
    evidenceClass: "acceptance-neutral-conditional-user-designation-transcription-and-exact-kit-binding",
    scope: {
      releaseId: "lesson-g04-l10-perimeter-area",
      animationId: "course-g04-l10-vb-003",
      sourceSwfSha256: EXPECTED_SOURCE_SWF_SHA256,
      languages: ["en", "es"],
      requirementIds: EXPECTED_REQUIREMENTS.map(({requirementId}) => requirementId),
      exactCaptureKitCount: 2,
      otherMembersAuthorized: false,
      otherCoursesAuthorized: false,
    },
    sourceBindings: {
      securityContractV214: contract.record,
      rootCaptureProtocolV3: protocolSource.record,
    },
    operator: {
      name: "Peter Hu",
      role: "named-original-runtime-operator-for-exact-vb003-en-es-capture-kits-only",
      designationRecorded: true,
      designationState: "conditional-pending-all-security-and-launch-gates",
      activated: false,
      operatorReady: false,
      authorizationScopeExpansion: false,
      localArtifactAuthenticationAuthority: false,
      boundary: "This report records the user's conditional designation and exact scope. It is not an authenticated user message, cannot satisfy v2.14 review or post-review authorization, and cannot activate the operator.",
    },
    captureKits,
    gates: {
      allSatisfied: false,
      current: {
        freshV214SchemaAdversarialWholeReviewBatchValid: false,
        authenticatedPostReviewV214AuthorizationPresent: false,
        v28TransitionSeparatelyAuthorizedAndDoubleProjected: false,
        cleanRoomIsolationPackIndependentlyApproved: false,
        productionHelperImplementedInAuthorizedCleanRoomTask: false,
        productionHelperIndependentReviewP0P1P2Zero: false,
        disposableOfflineEnvironmentApprovedAndPreflighted: false,
        outsideKitSessionOutputRootPreflightPassed: false,
        freshStorageCapacityPreflightPassed: false,
        currentLaunchReceiptGeneratedAndChecked: false,
      },
      rule: "Every current gate must be independently evidenced. A local PASS, generated receipt, task substitute, or partial zero cannot satisfy any gate.",
    },
    launchReceipt: {
      schemaVersion: 3,
      evidenceType: "named-human-hash-bound-root-source-open-start-receipt",
      freshReceiptRequiredForEveryStart: true,
      receiptCheckedBeforeLaunch: true,
      finalizedBeforeFirstFrame: true,
      postHocReceiptAllowed: false,
      receiptReuseAllowed: false,
      launchAuthorizedNow: false,
    },
    exclusions: [...EXCLUSIONS],
    controls: {
      planOnly: true,
      appendOnlySuccessor: true,
      noClobber: true,
      originalRuntimeLaunched: false,
      ruffleLaunched: false,
      animateLaunched: false,
      helperExecuted: false,
      helperImplemented: false,
      workspaceModified: false,
      sourceAssetsModified: false,
      captureKitModified: false,
      launchReceiptCreated: false,
      runtimeSessionCreated: false,
      capturePngCreated: false,
    },
    unresolved: {
      exactKitUpstreamProjectionCurrentnessEstablished: false,
      authoritativeOriginalRuntimeBaselineCount: 0,
      actualRuntimeSessionCount: 0,
      actualLaunchReceiptCount: 0,
      capturePngCount: 0,
      nextAuthorizedAction: "new authenticated user instruction for exact v2.14 schema/adversarial/whole user-owned review tasks",
    },
    acceptanceEffects: {
      sourcePromotion: false,
      helperImplementationAuthority: false,
      protectedInstallationAuthority: false,
      originalRuntimeAuthority: false,
      originalRuntimeEvidence: false,
      baselineAdoption: false,
      rendererAdoption: false,
      behaviorAcceptance: false,
      visualRmseAcceptance: false,
      audioAcceptance: false,
      humanVisualAcceptance: false,
      engineeringAcceptance: false,
      ownerAcceptance: false,
      strictCompletion: false,
      wholeLessonIntegration: false,
      wholeCourseIntegration: false,
      release: false,
      publication: false,
    },
  };
  const report = {
    ...reportWithoutFingerprint,
    reportFingerprintSha256: sha256(Buffer.from(renderJson(reportWithoutFingerprint))),
  };
  validateReport(report);
  return report;
}

export async function writeNoClobber(filePath, bytes) {
  let handle;
  try {
    handle = await open(filePath, "wx", 0o600);
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = null;
    return "created";
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    if (error.code !== "EEXIST") throw error;
    const info = await lstat(filePath, {bigint: true});
    invariant(info.isFile() && !info.isSymbolicLink(), "Existing output is not an ordinary file");
    invariant(info.nlink === 1n, "Existing output link count must be one");
    const current = await readFile(filePath);
    invariant(current.equals(bytes), "Refusing to overwrite a different conditional-operator report");
    return "exact-existing";
  }
}

export function parseArguments(argv) {
  const allowed = new Set(["--write-no-clobber", "--check", "--help", "-h"]);
  const unknown = argv.find((argument) => !allowed.has(argument));
  invariant(!unknown, `Unknown option: ${unknown}`);
  if (argv.includes("--help") || argv.includes("-h")) {
    invariant(argv.length === 1, "--help must be used alone");
    return {help: true, mode: ""};
  }
  const modes = argv.filter((argument) => argument === "--write-no-clobber" || argument === "--check");
  invariant(modes.length === 1 && argv.length === 1, "choose exactly one of --write-no-clobber or --check");
  return {help: false, mode: modes[0].slice(2)};
}

function usage() {
  return `Usage: node scripts/build-g4-l10-vb003-conditional-operator-gate-v1.mjs --write-no-clobber|--check\n\nBuilds one append-only, acceptance-neutral report that records Peter Hu's conditional\nVB003 EN/ES operator designation without activating it. The command never launches a\nruntime, implements or executes the helper, edits capture kits/workspaces/sources, or\ngrants acceptance, integration, release, or publication authority.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const report = await buildReport();
  const rendered = Buffer.from(renderJson(report));
  const outputPath = path.join(PROJECT_ROOT, OUTPUT_RELATIVE_PATH);
  let action;
  if (options.mode === "write-no-clobber") {
    action = await writeNoClobber(outputPath, rendered);
  } else {
    const current = await readFile(outputPath);
    invariant(current.equals(rendered), `${OUTPUT_RELATIVE_PATH}: checked-in report is stale`);
    action = "verified";
  }
  process.stdout.write(`${JSON.stringify({
    action,
    output: OUTPUT_RELATIVE_PATH,
    bytes: rendered.length,
    sha256: sha256(rendered),
    status: report.status,
    decision: report.decision,
    operatorReady: report.operator.operatorReady,
    launchAuthorizedNow: report.launchReceipt.launchAuthorizedNow,
    acceptanceEffect: false,
  }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
