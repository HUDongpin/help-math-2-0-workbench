#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  lstat,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  validateOwnerActionPacket,
} from "./build-g5-l5-owner-action-packet.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH =
  "catalog/owner-authorizations/g5-l5-owner-governance-directive-intake-2026-07-29.json";

const INTAKE_BINDING_SEMANTICS =
  "historical-at-intake-do-not-require-current-byte-identity";
const RELEASE_ID = "lesson-g05-l05-add-subtract-negative-numbers";
const RELEASE_FINGERPRINT_SHA256 =
  "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84";
const RECEIVED_ON_LOCAL = "2026-07-29";
const RECEIVED_TIMEZONE = "Asia/Shanghai";
const RECORDED_AT_UTC = "2026-07-28T17:38:25Z";
const STATEMENT_LANGUAGE = "zh-CN";
const STATEMENT_BYTE_LENGTH = 112;
const STATEMENT_SHA256 =
  "616d57c45c1c1d38aa3f9ecbbdb26e62ab47a89f703970d65b9446628e4f9af1";
const DEFAULT_DISPOSITION =
  "fail-closed-unset-no-spend-procurement-or-payment-authority";

const INPUTS = Object.freeze({
  roadmap:
    "outputs/help-math-2-product-deployment-district-pilot-roadmap-2026-2027.zh.md",
  releaseManifest: "catalog/lesson-releases.json",
  sourceScopeFreeze: "reports/g5-l5-source-scope-freeze.json",
  preAuthorizationOwnerActionPacket:
    "reports/g5-l5-owner-action-packet.json",
});

const AUTHORIZATION_KEYS = Object.freeze([
  "continueMachineOnlyStaticWork",
  "m0ExitDirectiveRecorded",
  "m1MachineFoundationStartAuthorized",
  "repositoryBudgetProcurementDefaultsSelected",
]);

const AUTHORITY_BOUNDARY = Object.freeze({
  userDirectiveRecorded: true,
  ownerIdentityStoredInRepository: false,
  ownerIdentityCryptographicallyVerified: false,
  portableExternalSignatureEstablished: false,
  m0ExitDirectiveRecorded: true,
  m0ExitEffective: false,
  m1MachineOnlyStartAuthorized: true,
  m1MachineOnlyEffective: true,
  budgetDefaultsSelected: true,
  budgetValuesEstablished: false,
  externalSpendAuthorized: false,
  procurementOrPaymentAuthorized: false,
  runtimeHostOrContainmentAuthorized: false,
  originalRuntimeExecutionAuthorized: false,
  animateGuiExecutionAuthorized: false,
  rendererImplementationAuthorized: false,
  evidencePromotionAuthorized: false,
  humanReviewAccepted: false,
  ownerFidelityAcceptanceEstablished: false,
  strictCompletionEstablished: false,
  publicationAuthorized: false,
  strictAcceptanceEffect: "machine-only-m1-start-directive-intake",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function hasExactKeys(value, expectedKeys) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join("\0") ===
      [...expectedKeys].sort().join("\0")
  );
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function resolveProjectPath(root, relativePath, label = relativePath) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `${label}: path must be project-relative and portable`,
  );
  const absolute = path.resolve(root, relativePath);
  const normalized = portable(path.relative(root, absolute));
  invariant(
    normalized === relativePath &&
      normalized !== ".." &&
      !normalized.startsWith("../"),
    `${label}: path escapes or is not normalized`,
  );
  return absolute;
}

function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative));
}

async function ensureContainedOrdinaryDirectoryTree(
  root,
  targetDirectory,
  label,
) {
  const rootState = await lstat(root);
  invariant(
    rootState.isDirectory() && !rootState.isSymbolicLink(),
    `${label}: root must be one ordinary directory`,
  );
  const rootReal = await realpath(root);
  const relative = path.relative(root, targetDirectory);
  invariant(
    relative === "" ||
      (relative !== ".." &&
        !relative.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relative)),
    `${label}: directory escapes the project root`,
  );
  let current = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    const state = await lstat(current);
    invariant(
      state.isDirectory() && !state.isSymbolicLink(),
      `${label}: ancestor must be an ordinary directory: ${segment}`,
    );
    invariant(
      isWithin(rootReal, await realpath(current)),
      `${label}: ancestor escapes the project root: ${segment}`,
    );
  }
  return rootReal;
}

export async function readOrdinaryFileBinding(
  relativePath,
  {root = projectRoot, json = true} = {},
) {
  const absolute = resolveProjectPath(root, relativePath);
  const rootReal = await ensureContainedOrdinaryDirectoryTree(
    root,
    path.dirname(absolute),
    relativePath,
  );
  const before = await lstat(absolute);
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${relativePath}: must be one ordinary single-link file`,
  );
  invariant(
    isWithin(rootReal, await realpath(absolute)),
    `${relativePath}: escapes the project root`,
  );
  const contents = await readFile(absolute);
  const after = await lstat(absolute);
  invariant(
    after.isFile() &&
      !after.isSymbolicLink() &&
      after.nlink === 1 &&
      before.dev === after.dev &&
      before.ino === after.ino &&
      before.size === after.size &&
      before.mtimeMs === after.mtimeMs &&
      contents.length === after.size &&
      isWithin(rootReal, await realpath(absolute)),
    `${relativePath}: changed while being read`,
  );
  let document = null;
  if (json) {
    try {
      document = JSON.parse(contents.toString("utf8"));
    } catch (error) {
      throw new Error(`${relativePath}: invalid JSON (${error.message})`);
    }
  }
  return {
    path: relativePath,
    bytes: contents.length,
    sha256: sha256(contents),
    document,
    text: contents.toString("utf8"),
  };
}

function descriptor(binding) {
  return {
    path: binding.path,
    bytes: binding.bytes,
    sha256: binding.sha256,
  };
}

function receiptWithoutFingerprint(receipt) {
  const copy = structuredClone(receipt);
  delete copy.receiptFingerprintSha256;
  return copy;
}

function assertDescriptor(binding, expectedPath, extraKeys = []) {
  invariant(
    hasExactKeys(binding, ["path", "bytes", "sha256", ...extraKeys]) &&
      binding.path === expectedPath &&
      Number.isSafeInteger(binding.bytes) &&
      binding.bytes > 0 &&
      /^[a-f0-9]{64}$/.test(binding.sha256),
    `${expectedPath}: source binding drifted`,
  );
  resolveProjectPath(projectRoot, binding.path, `${expectedPath} binding`);
}

function selectRelease(document) {
  invariant(
    document?.schemaVersion === 1 && Array.isArray(document.releases),
    "lesson release manifest is malformed",
  );
  const matches = document.releases.filter(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  invariant(matches.length === 1, "G5 L5 release is not unique");
  const release = matches[0];
  invariant(
    release.titleDisplay === "Add & Subtract Negative Numbers" &&
      release.grade === 5 &&
      release.lesson === 5 &&
      release.releaseType === "complete-lesson" &&
      release.publicationMode === "atomic" &&
      release.expectedCounts?.activeXmlReferencedPages === 56 &&
      release.expectedCounts.courseShells === 1 &&
      release.expectedCounts.members === 57 &&
      Array.isArray(release.members) &&
      release.members.length === 57 &&
      sha256(Buffer.from(stableJson(release))) ===
        RELEASE_FINGERPRINT_SHA256,
    "G5 L5 release scope or fingerprint drifted",
  );
  return release;
}

function validateSourceScope(document) {
  invariant(
    document?.schemaVersion === 1 &&
      document.reportType === "g5-l5-source-scope-freeze" &&
      document.releaseId === RELEASE_ID &&
      document.summary?.pageCount === 56 &&
      document.summary.shellCount === 1 &&
      document.summary.memberCount === 57 &&
      document.summary.strictCompleteCount === 0 &&
      document.summary.publishedCount === 0 &&
      Object.values(document.acceptanceEffects || {}).every(
        (value) => value === false,
      ),
    "G5 L5 source-scope input crossed an acceptance boundary",
  );
}

function validatePreAuthorizationActionPacket(document) {
  validateOwnerActionPacket(document);
  invariant(
    document.releaseId === RELEASE_ID &&
      document.release?.releaseFingerprintSha256 ===
        RELEASE_FINGERPRINT_SHA256 &&
      document.evidenceState ===
        "machine-prepared-unsigned-external-action-template-only" &&
      Object.values(document.acceptanceEffects || {}).every(
        (value) => value === false,
      ) &&
      document.externalHandlingBoundary
        ?.personalDataAllowedInThisReport === false &&
      document.externalHandlingBoundary.automationMaySignOrAttest === false,
    "pre-authorization Owner action packet crossed its blank boundary",
  );
}

export function validateG5L5OwnerGovernanceDirectiveIntake(receipt) {
  invariant(
    hasExactKeys(receipt, [
      "schemaVersion",
      "evidenceType",
      "releaseId",
      "releaseFingerprintSha256",
      "receivedOnLocal",
      "timezone",
      "recordedAtUtc",
      "channel",
      "statementDigest",
      "authorization",
      "budgetDefaultResolution",
      "sourceBindingsAtIntake",
      "generator",
      "externalSignatureEnvelope",
      "authorityBoundary",
      "receiptFingerprintSha256",
    ]) &&
      receipt.schemaVersion === 1 &&
      receipt.evidenceType ===
        "g5-l5-public-safe-owner-governance-directive-intake" &&
      receipt.releaseId === RELEASE_ID &&
      receipt.releaseFingerprintSha256 ===
        RELEASE_FINGERPRINT_SHA256,
    "G5 L5 Owner directive intake identity drifted",
  );

  invariant(
    receipt.receivedOnLocal === RECEIVED_ON_LOCAL &&
      receipt.timezone === RECEIVED_TIMEZONE &&
      receipt.recordedAtUtc === RECORDED_AT_UTC &&
      receipt.channel === "current-codex-task",
    "G5 L5 Owner directive intake date or channel drifted",
  );

  invariant(
    hasExactKeys(receipt.statementDigest, [
      "language",
      "byteLength",
      "sha256",
      "exactTextStored",
    ]) &&
      receipt.statementDigest.language === STATEMENT_LANGUAGE &&
      receipt.statementDigest.byteLength === STATEMENT_BYTE_LENGTH &&
      receipt.statementDigest.sha256 === STATEMENT_SHA256 &&
      receipt.statementDigest.exactTextStored === false,
    "G5 L5 Owner directive statement digest drifted or stores text",
  );

  invariant(
    hasExactKeys(receipt.authorization, AUTHORIZATION_KEYS) &&
      AUTHORIZATION_KEYS.every(
        (key) => receipt.authorization[key] === true,
      ),
    "G5 L5 Owner directive authorization scope drifted",
  );

  invariant(
    hasExactKeys(receipt.budgetDefaultResolution, [
      "currency",
      "ownerSelectedRepositoryDefaults",
      "repositoryDefinedNumericOrCycleDefaultsFound",
      "personnelRateCeilingUsdPerHour",
      "totalBudgetEnvelopeUsd",
      "procurementPaymentCycle",
      "defaultDisposition",
      "externalSpendAuthorized",
      "procurementOrPaymentAuthorized",
      "anySpendRequiresNewOwnerReceipt",
    ]) &&
      receipt.budgetDefaultResolution.currency === "USD" &&
      receipt.budgetDefaultResolution.ownerSelectedRepositoryDefaults ===
        true &&
      receipt.budgetDefaultResolution
        .repositoryDefinedNumericOrCycleDefaultsFound === false &&
      receipt.budgetDefaultResolution.personnelRateCeilingUsdPerHour ===
        null &&
      receipt.budgetDefaultResolution.totalBudgetEnvelopeUsd === null &&
      receipt.budgetDefaultResolution.procurementPaymentCycle === null &&
      receipt.budgetDefaultResolution.defaultDisposition ===
        DEFAULT_DISPOSITION &&
      receipt.budgetDefaultResolution.externalSpendAuthorized === false &&
      receipt.budgetDefaultResolution.procurementOrPaymentAuthorized ===
        false &&
      receipt.budgetDefaultResolution.anySpendRequiresNewOwnerReceipt ===
        true,
    "G5 L5 Owner directive invented a budget, cycle, spend, or procurement authority",
  );

  invariant(
    hasExactKeys(receipt.sourceBindingsAtIntake, [
      "bindingSemantics",
      ...Object.keys(INPUTS),
    ]) &&
      receipt.sourceBindingsAtIntake.bindingSemantics ===
        INTAKE_BINDING_SEMANTICS,
    "G5 L5 Owner directive source-binding set drifted",
  );
  assertDescriptor(
    receipt.sourceBindingsAtIntake.roadmap,
    INPUTS.roadmap,
  );
  assertDescriptor(
    receipt.sourceBindingsAtIntake.releaseManifest,
    INPUTS.releaseManifest,
    ["releaseFingerprintSha256"],
  );
  invariant(
    receipt.sourceBindingsAtIntake.releaseManifest
      .releaseFingerprintSha256 === RELEASE_FINGERPRINT_SHA256,
    "G5 L5 Owner directive release fingerprint binding drifted",
  );
  assertDescriptor(
    receipt.sourceBindingsAtIntake.sourceScopeFreeze,
    INPUTS.sourceScopeFreeze,
  );
  assertDescriptor(
    receipt.sourceBindingsAtIntake.preAuthorizationOwnerActionPacket,
    INPUTS.preAuthorizationOwnerActionPacket,
    ["reportFingerprintSha256"],
  );
  invariant(
    /^[a-f0-9]{64}$/.test(
      receipt.sourceBindingsAtIntake.preAuthorizationOwnerActionPacket
        .reportFingerprintSha256,
    ),
    "G5 L5 Owner directive action-packet fingerprint binding is invalid",
  );

  assertDescriptor(
    receipt.generator,
    "scripts/build-g5-l5-owner-governance-directive-intake.mjs",
  );
  invariant(
    receipt.externalSignatureEnvelope === null,
    "G5 L5 Owner directive intake invented an external signature",
  );

  invariant(
    hasExactKeys(
      receipt.authorityBoundary,
      Object.keys(AUTHORITY_BOUNDARY),
    ) &&
      stableJson(receipt.authorityBoundary) ===
        stableJson(AUTHORITY_BOUNDARY),
    "G5 L5 Owner directive authority boundary drifted",
  );

  const serialized = JSON.stringify(receipt);
  invariant(
    !/\/Users\/|\/Volumes\/|file:\/\//i.test(serialized) &&
      !/[A-Z]:\\/i.test(serialized) &&
      !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(serialized) &&
      !/Dr\.?\s*Peter|Peter\s+Hu/i.test(serialized) &&
      !/taskThreadId|threadId|ownerFullName|exactUtf8/i.test(serialized),
    "G5 L5 Owner directive intake contains a private path, identity, contact, thread, or statement text",
  );

  invariant(
    /^[a-f0-9]{64}$/.test(receipt.receiptFingerprintSha256) &&
      receipt.receiptFingerprintSha256 ===
        sha256(
          Buffer.from(
            stableJson(receiptWithoutFingerprint(receipt)),
          ),
        ),
    "G5 L5 Owner directive receipt fingerprint drifted",
  );
  return receipt;
}

export async function buildG5L5OwnerGovernanceDirectiveIntake({
  root = projectRoot,
} = {}) {
  const entries = await Promise.all(
    Object.entries(INPUTS).map(async ([key, relativePath]) => [
      key,
      await readOrdinaryFileBinding(relativePath, {
        root,
        json: key !== "roadmap",
      }),
    ]),
  );
  const inputs = Object.fromEntries(entries);
  const generator = await readOrdinaryFileBinding(
    "scripts/build-g5-l5-owner-governance-directive-intake.mjs",
    {root, json: false},
  );

  selectRelease(inputs.releaseManifest.document);
  validateSourceScope(inputs.sourceScopeFreeze.document);
  validatePreAuthorizationActionPacket(
    inputs.preAuthorizationOwnerActionPacket.document,
  );

  const base = {
    schemaVersion: 1,
    evidenceType:
      "g5-l5-public-safe-owner-governance-directive-intake",
    releaseId: RELEASE_ID,
    releaseFingerprintSha256: RELEASE_FINGERPRINT_SHA256,
    receivedOnLocal: RECEIVED_ON_LOCAL,
    timezone: RECEIVED_TIMEZONE,
    recordedAtUtc: RECORDED_AT_UTC,
    channel: "current-codex-task",
    statementDigest: {
      language: STATEMENT_LANGUAGE,
      byteLength: STATEMENT_BYTE_LENGTH,
      sha256: STATEMENT_SHA256,
      exactTextStored: false,
    },
    authorization: {
      continueMachineOnlyStaticWork: true,
      m0ExitDirectiveRecorded: true,
      m1MachineFoundationStartAuthorized: true,
      repositoryBudgetProcurementDefaultsSelected: true,
    },
    budgetDefaultResolution: {
      currency: "USD",
      ownerSelectedRepositoryDefaults: true,
      repositoryDefinedNumericOrCycleDefaultsFound: false,
      personnelRateCeilingUsdPerHour: null,
      totalBudgetEnvelopeUsd: null,
      procurementPaymentCycle: null,
      defaultDisposition: DEFAULT_DISPOSITION,
      externalSpendAuthorized: false,
      procurementOrPaymentAuthorized: false,
      anySpendRequiresNewOwnerReceipt: true,
    },
    sourceBindingsAtIntake: {
      bindingSemantics: INTAKE_BINDING_SEMANTICS,
      roadmap: descriptor(inputs.roadmap),
      releaseManifest: {
        ...descriptor(inputs.releaseManifest),
        releaseFingerprintSha256: RELEASE_FINGERPRINT_SHA256,
      },
      sourceScopeFreeze: descriptor(inputs.sourceScopeFreeze),
      preAuthorizationOwnerActionPacket: {
        ...descriptor(inputs.preAuthorizationOwnerActionPacket),
        reportFingerprintSha256:
          inputs.preAuthorizationOwnerActionPacket.document
            .reportFingerprintSha256,
      },
    },
    generator: descriptor(generator),
    externalSignatureEnvelope: null,
    authorityBoundary: structuredClone(AUTHORITY_BOUNDARY),
  };
  const receipt = {
    ...base,
    receiptFingerprintSha256: sha256(Buffer.from(stableJson(base))),
  };
  return validateG5L5OwnerGovernanceDirectiveIntake(receipt);
}

export async function readG5L5OwnerGovernanceDirectiveIntake({
  root = projectRoot,
} = {}) {
  const record = await readOrdinaryFileBinding(
    G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
    {root, json: true},
  );
  const receipt = validateG5L5OwnerGovernanceDirectiveIntake(
    record.document,
  );
  invariant(
    record.text === stableJson(receipt),
    "G5 L5 Owner directive intake is not canonical JSON",
  );
  return {
    receipt,
    binding: descriptor(record),
  };
}

export async function atomicReplaceOrdinaryFile(
  absolutePath,
  contents,
  {root = path.dirname(absolutePath)} = {},
) {
  invariant(path.isAbsolute(absolutePath), "output path must be absolute");
  const parent = path.dirname(absolutePath);
  await ensureContainedOrdinaryDirectoryTree(
    root,
    parent,
    `${absolutePath}: output`,
  );
  const temporaryPath = path.join(
    parent,
    `.${path.basename(absolutePath)}.${process.pid}.${randomUUID()}.tmp`,
  );
  let temporaryExists = false;
  try {
    await writeFile(temporaryPath, contents, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o644,
    });
    temporaryExists = true;
    await ensureContainedOrdinaryDirectoryTree(
      root,
      parent,
      `${absolutePath}: output`,
    );
    await rename(temporaryPath, absolutePath);
    temporaryExists = false;
  } finally {
    if (temporaryExists) {
      await unlink(temporaryPath).catch(() => {});
    }
  }
}

export function parseArguments(argv) {
  const options = {check: false, help: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/build-g5-l5-owner-governance-directive-intake.mjs
  node scripts/build-g5-l5-owner-governance-directive-intake.mjs --check

Builds or verifies one fixed, public-safe G5 L5 Owner directive intake.
It cannot ingest names, contacts, signatures, budgets, procurement cycles,
runtime details, implementation approval, review, strict completion, or publication.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  const outputPath = resolveProjectPath(
    projectRoot,
    G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
    "Owner directive receipt output",
  );

  if (options.check) {
    await readG5L5OwnerGovernanceDirectiveIntake();
    process.stdout.write(
      "PASS: G5 L5 public-safe Owner directive; M0 effective false; M1 machine-only true; spend/runtime/implementation/strict/publication false\n",
    );
    return;
  }

  try {
    await readG5L5OwnerGovernanceDirectiveIntake();
    process.stdout.write(
      "PRESERVED: existing immutable G5 L5 public-safe Owner directive; M0 effective false; M1 machine-only true\n",
    );
    return;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const receipt = await buildG5L5OwnerGovernanceDirectiveIntake();
  const expected = stableJson(receipt);
  await atomicReplaceOrdinaryFile(outputPath, expected, {
    root: projectRoot,
  });
  process.stdout.write(
    "WROTE: G5 L5 public-safe Owner directive; M0 effective false; M1 machine-only true; spend/runtime/implementation/strict/publication false\n",
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === scriptPath
) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
