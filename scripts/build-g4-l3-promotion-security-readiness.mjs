#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {ORIGINAL_RUNTIME_NATURAL_PROMOTION_ENABLED} from "./lib/original-runtime-natural-causality.mjs";
import {
  ORIGINAL_RUNTIME_RELEASE_BUNDLE_PRODUCTION_ENABLED,
  ORIGINAL_RUNTIME_RELEASE_BUNDLE_WRITES_ENABLED,
} from "./lib/original-runtime-promotion-release-bundle.mjs";
import {ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_WRITES_ENABLED} from "./lib/original-runtime-promotion-transaction.mjs";
import {
  LIVE_SESSION_PRODUCTION_ANCHOR_NOT_CONFIGURED_CODE,
  LIVE_SESSION_PRODUCTION_TRUST_ROOT_PATH,
  LIVE_SESSION_STATUS,
  PROTECTED_PREEXISTING_FLASH_PIDS,
} from "./lib/original-runtime-live-session-consumer.mjs";
import {
  PROMOTION_WRITES_ENABLED as TRUST_PROMOTION_WRITES_ENABLED,
  PRODUCTION_TRUST_ANCHOR_CONFIGURED,
} from "./lib/original-runtime-promotion-trust.mjs";
import {
  LEGACY_ADOPTER_CANONICAL_WRITE_IMPLEMENTATION_PRESENT,
  PROMOTION_REMAINING_GATES,
  PROMOTION_WRITES_ENABLED as LEGACY_ADOPTER_PROMOTION_WRITES_ENABLED,
  originalRuntimePromotionBoundary,
} from "./adopt-course-original-runtime-evidence.mjs";

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const JSON_OUTPUT = path.join(ROOT, "reports/g4-l3-promotion-security-readiness.json");
const MARKDOWN_OUTPUT = path.join(ROOT, "reports/g4-l3-promotion-security-readiness.md");
const ENVIRONMENT_REPORT = "reports/g4-l3-original-runtime-environment-readiness.json";
const SUITES = Object.freeze([
  "scripts/adopt-course-original-runtime-evidence.test.mjs",
  "scripts/original-runtime-natural-causality.test.mjs",
  "scripts/original-runtime-promotion-trust.test.mjs",
  "scripts/original-runtime-promotion-transaction.test.mjs",
  "scripts/original-runtime-promotion-release-bundle.test.mjs",
  "scripts/original-runtime-live-session-consumer.test.mjs",
]);
const MODULES = Object.freeze([
  "scripts/adopt-course-original-runtime-evidence.mjs",
  "scripts/lib/original-runtime-natural-causality.mjs",
  "scripts/lib/original-runtime-promotion-trust.mjs",
  "scripts/lib/original-runtime-promotion-transaction.mjs",
  "scripts/lib/original-runtime-promotion-release-bundle.mjs",
  "scripts/lib/original-runtime-live-session-consumer.mjs",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

async function fileBinding(relativePath) {
  const bytes = await readFile(path.join(ROOT, relativePath));
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)};
}

function parseCount(output, label) {
  const match = output.match(new RegExp(`^# ${label} (\\d+)$`, "m"));
  invariant(match, `Node test output is missing ${label} count`);
  return Number(match[1]);
}

async function runSecuritySuites() {
  const externalTmp = path.join(ROOT, "work", "tmp");
  await mkdir(externalTmp, {recursive: true});
  const {stdout, stderr} = await execFileAsync(process.execPath, [
    "--test",
    "--test-reporter=tap",
    ...SUITES.map((file) => path.join(ROOT, file)),
  ], {
    cwd: ROOT,
    env: {...process.env, TMPDIR: externalTmp},
    maxBuffer: 8 * 1024 * 1024,
  });
  invariant(!stderr.trim(), `Security suite emitted stderr: ${stderr.trim().slice(0, 500)}`);
  const tests = parseCount(stdout, "tests");
  const passed = parseCount(stdout, "pass");
  const failed = parseCount(stdout, "fail");
  invariant(tests === 163 && passed === 163 && failed === 0,
    `Promotion security suite result drifted: ${passed}/${tests} passed, ${failed} failed`);
  return {runner: process.execPath, reporter: "tap", tests, passed, failed, cancelled: parseCount(stdout, "cancelled")};
}

export async function buildReport() {
  const [testResult, environmentBinding, generator, ...sourceBindings] = await Promise.all([
    runSecuritySuites(),
    fileBinding(ENVIRONMENT_REPORT),
    fileBinding(path.relative(ROOT, SCRIPT_PATH).split(path.sep).join("/")),
    ...[...MODULES, ...SUITES].map(fileBinding),
  ]);
  const environment = JSON.parse(await readFile(path.join(ROOT, ENVIRONMENT_REPORT), "utf8"));
  invariant(environment.executionGate.originalRuntimeExecutionReady === false
    && typeof environment.installedRuntimeCandidate.codeSignature.strictVerification.passed === "boolean",
  "Runtime environment unexpectedly became executable or lost its signature snapshot");
  const allProductionFusesClosed = [
    ORIGINAL_RUNTIME_NATURAL_PROMOTION_ENABLED,
    TRUST_PROMOTION_WRITES_ENABLED,
    PRODUCTION_TRUST_ANCHOR_CONFIGURED,
    ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_WRITES_ENABLED,
    ORIGINAL_RUNTIME_RELEASE_BUNDLE_WRITES_ENABLED,
    ORIGINAL_RUNTIME_RELEASE_BUNDLE_PRODUCTION_ENABLED,
    LEGACY_ADOPTER_PROMOTION_WRITES_ENABLED,
    LEGACY_ADOPTER_CANONICAL_WRITE_IMPLEMENTATION_PRESENT,
  ].every((value) => value === false);
  invariant(allProductionFusesClosed, "A production promotion fuse opened unexpectedly");
  return {
    schemaVersion: 1,
    reportType: "g4-l3-promotion-security-readiness",
    generator,
    sourceBindings: {
      originalRuntimeEnvironment: environmentBinding,
      modules: sourceBindings.slice(0, MODULES.length),
      suites: sourceBindings.slice(MODULES.length),
    },
    testResult,
    verifiedControls: [
      "typed recursive candidate DAG closure and content hashing",
      "signature tampering, role mismatch, signer reuse, revocation freshness, and nonce replay rejection",
      "path traversal, symlink, external hardlink, and disguised media rejection",
      "per-migration lock and concurrent promotion exclusion",
      "coverage compare-and-swap and manifest/output drift rejection",
      "no-replace canonical file and archive publication",
      "segmented hash-addressed transaction journal",
      "partial journal, process-exit, rollback, and repeated crash recovery",
      "durable test-only nonce reservation and foreign-drift preservation",
      "release-bundle substitution and Merkle inclusion failure handling",
      "signed live-session prelaunch, fresh-process claim, completion CAS, five-role separation, fixed-name opaque evidence byte closure, and retroactive-PID rejection",
      "legacy adopter has no filesystem mutation capability or latent promotion return path",
    ],
    productionFuses: {
      naturalPromotionEnabled: ORIGINAL_RUNTIME_NATURAL_PROMOTION_ENABLED,
      trustPromotionWritesEnabled: TRUST_PROMOTION_WRITES_ENABLED,
      productionTrustAnchorConfigured: PRODUCTION_TRUST_ANCHOR_CONFIGURED,
      transactionWritesEnabled: ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_WRITES_ENABLED,
      releaseBundleWritesEnabled: ORIGINAL_RUNTIME_RELEASE_BUNDLE_WRITES_ENABLED,
      releaseBundleProductionEnabled: ORIGINAL_RUNTIME_RELEASE_BUNDLE_PRODUCTION_ENABLED,
      legacyAdopterPromotionWritesEnabled: LEGACY_ADOPTER_PROMOTION_WRITES_ENABLED,
      legacyAdopterCanonicalWriteImplementationPresent: LEGACY_ADOPTER_CANONICAL_WRITE_IMPLEMENTATION_PRESENT,
      allClosed: allProductionFusesClosed,
    },
    legacyAdopterBoundary: originalRuntimePromotionBoundary(),
    remainingProductionGates: PROMOTION_REMAINING_GATES,
    externalDependencies: {
      trustedProjectorStrictSignatureVerified:
        environment.installedRuntimeCandidate.codeSignature.strictVerification.passed,
      projectorSignatureVerificationIsPointInTimeOnly: true,
      fixedOutOfBandTrustRootInstalled: false,
      liveSessionProductionTrustRootPath: LIVE_SESSION_PRODUCTION_TRUST_ROOT_PATH,
      liveSessionProductionAnchorMissingCode:
        LIVE_SESSION_PRODUCTION_ANCHOR_NOT_CONFIGURED_CODE,
      captureOperatorIdentityAndAttestationBound: false,
      independentHumanReviewerBound: false,
      ownerRepresentativeBound: false,
      releaseCustodianBound: false,
      independentAppendOnlyOwnerLedgerDurabilityProven: false,
      realImmutableCandidateEndToEndQualified: false,
      independentPromotionSecurityReviewComplete: false,
    },
    readiness: {
      state: "security-suite-passed-production-fail-closed",
      diagnosticVerifierReady: true,
      testOnlyTransactionMechanismReady: true,
      signedLiveSessionConsumerReady: true,
      signedLiveSessionSuccessDisposition: LIVE_SESSION_STATUS,
      signedLiveSessionRequiredDistinctSubjectsAndKeys: 5,
      protectedPreexistingDiagnosticPids: [...PROTECTED_PREEXISTING_FLASH_PIDS],
      retroactiveLiveSessionClaimRejected: true,
      legacyAdopterStructurallyReadOnly: true,
      signedReleaseBundleIntegratedWithAdopter: false,
      typedCausalityDagIntegratedWithAdopter: false,
      productionExecuteAndRecoveryConnected: false,
      kernelAnchoredAncestorRaceClosureProven: false,
      productionPromotionWriterReady: false,
      capturePromotionDisposition: "pending-candidate-only",
      authoritativeOriginalRuntimeCaptureMayStart: false,
      strictAcceptanceEffect: "none",
    },
    acceptance: {
      acceptanceNeutral: true,
      authoritativeBaselineAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      releaseAuthorized: false,
      strictCompletions: 0,
    },
  };
}

export function renderMarkdown(report) {
  return `# G4 L3 Promotion Security Readiness\n\n`
    + `The fail-closed security suite passes **${report.testResult.passed}/${report.testResult.tests}** tests. Production promotion remains intentionally disabled.\n\n`
    + `- State: **${report.readiness.state}**.\n`
    + `- Production fuses closed: **${report.productionFuses.allClosed}**.\n`
    + `- Legacy adopter canonical writer present: **${report.productionFuses.legacyAdopterCanonicalWriteImplementationPresent}**.\n`
    + `- Capture disposition: **${report.readiness.capturePromotionDisposition}**.\n`
    + `- Signed live-session consumer: **${report.readiness.signedLiveSessionConsumerReady ? "ready, fail-closed" : "not ready"}**; successful verification can produce only \`${report.readiness.signedLiveSessionSuccessDisposition}\`.\n`
    + `- Live-session role separation: **${report.readiness.signedLiveSessionRequiredDistinctSubjectsAndKeys} distinct subjects and keys**; retroactive PID claims rejected: **${report.readiness.retroactiveLiveSessionClaimRejected}**.\n`
    + `- Current Projector strict signature verification: **${report.externalDependencies?.trustedProjectorStrictSignatureVerified === true ? "passed" : report.externalDependencies?.trustedProjectorStrictSignatureVerified === false ? "failed" : "not supplied to renderer"}** (point-in-time only; recheck before every session).\n`
    + `- External trust root / named operator / reviewer / owner / release custodian: **not bound**.\n`
    + `- Strict completions: **0**.\n\n`
    + `Covered controls include signature tampering, revocation, replay, path and symlink attacks, concurrent promotion, no-replace publication, CAS drift, partial writes, journal integrity, crash recovery, release-bundle substitution, and structural absence of a legacy write path. Passing these synthetic tests does not authorize a runtime session or make any production writer available.\n\n`
    + `Remaining production gates: ${report.remainingProductionGates.map(({code}) => `\`${code}\``).join(", ")}.\n`;
}

export function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const report = await buildReport();
  const json = stableJson(report);
  const markdown = renderMarkdown(report);
  if (options.check) {
    const [currentJson, currentMarkdown] = await Promise.all([
      readFile(JSON_OUTPUT, "utf8"),
      readFile(MARKDOWN_OUTPUT, "utf8"),
    ]);
    invariant(currentJson === json && currentMarkdown === markdown, "Promotion security readiness report is stale");
    process.stdout.write(`PASS ${report.testResult.passed}/${report.testResult.tests}; production promotion disabled\n`);
    return;
  }
  await Promise.all([writeFile(JSON_OUTPUT, json), writeFile(MARKDOWN_OUTPUT, markdown)]);
  process.stdout.write(`WROTE ${report.testResult.passed}/${report.testResult.tests}; production promotion disabled\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
