#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  lstat,
  open,
  readFile,
  realpath,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
  validateG5L5OwnerGovernanceDirectiveIntake,
} from "./build-g5-l5-owner-governance-directive-intake.mjs";
import {
  OUTPUT_NAMES as CANDIDATE_OUTPUT_NAMES,
  validatePriorReceipt as validateCandidateReceipt,
} from "./materialize-g5-l5-pre-runtime-specification-candidates.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

export const RELEASE_ID =
  "lesson-g05-l05-add-subtract-negative-numbers";
export const G5_L5_M1_STATIC_RECONCILIATION_RECEIPT_NAME =
  "g5-l5-m1-static-reconciliation-receipt.json";

const GENERATOR_PATH =
  "scripts/adopt-g5-l5-m1-static-specification.mjs";
const OWNER_DIRECTIVE_VALIDATOR_PATH =
  "scripts/build-g5-l5-owner-governance-directive-intake.mjs";
const CANDIDATE_MATERIALIZER_PATH =
  "scripts/materialize-g5-l5-pre-runtime-specification-candidates.mjs";
const RELEASE_PATH = "catalog/lesson-releases.json";
const SOURCE_SCOPE_PATH = "reports/g5-l5-source-scope-freeze.json";
const RELEASE_FINGERPRINT_SHA256 =
  "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84";

export const G5_L5_STATIC_RECONCILIATION_CONFIG = Object.freeze({
  releaseId: RELEASE_ID,
  releaseLabel: "G5 L5",
  titleDisplay: "Add & Subtract Negative Numbers",
  grade: 5,
  lesson: 5,
  activeXmlReferencedPages: 56,
  courseShells: 1,
  memberCount: 57,
  releaseFingerprintSha256: RELEASE_FINGERPRINT_SHA256,
  generatorPath: GENERATOR_PATH,
  ownerAuthorizationValidatorPath: OWNER_DIRECTIVE_VALIDATOR_PATH,
  candidateMaterializerPath: CANDIDATE_MATERIALIZER_PATH,
  releasePath: RELEASE_PATH,
  sourceScopePath: SOURCE_SCOPE_PATH,
  ownerAuthorizationPath: G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
  preserveHistoricalGeneratorBindingAfterAdoption: true,
  sourceScopeBindingName: "g5-l5-source-scope-binding.json",
  candidateOutputNames: CANDIDATE_OUTPUT_NAMES,
  receiptName: G5_L5_M1_STATIC_RECONCILIATION_RECEIPT_NAME,
  artifactTypes: Object.freeze({
    sourceScopeBinding: "g5-l5-source-scope-binding",
    runtimeFactsCandidate: "g5-l5-manifest-runtime-facts-candidate",
    scriptInventoryCandidate:
      "g5-l5-ffdec-script-inventory-candidate",
    dependencyInventoryCandidate:
      "g5-l5-static-dependency-inventory-candidate",
    canonicalScriptInventory:
      "g5-l5-canonical-static-script-inventory",
    canonicalDependencyInventory:
      "g5-l5-canonical-static-dependency-inventory",
    reconciliationReceipt:
      "g5-l5-m1-static-reconciliation-receipt",
  }),
  validateCandidateReceipt,
  validateOwnerAuthorization(receipt) {
    validateG5L5OwnerGovernanceDirectiveIntake(receipt);
    invariant(
      receipt.authorization?.m1MachineFoundationStartAuthorized === true &&
        receipt.authorization?.continueMachineOnlyStaticWork === true &&
        receipt.authorityBoundary?.m1MachineOnlyEffective === true &&
        receipt.authorityBoundary?.runtimeHostOrContainmentAuthorized ===
          false &&
        receipt.authorityBoundary?.originalRuntimeExecutionAuthorized ===
          false &&
        receipt.authorityBoundary?.animateGuiExecutionAuthorized === false &&
        receipt.authorityBoundary?.rendererImplementationAuthorized ===
          false &&
        receipt.authorityBoundary?.evidencePromotionAuthorized === false &&
        receipt.authorityBoundary?.strictCompletionEstablished === false &&
        receipt.authorityBoundary?.publicationAuthorized === false,
      "Owner directive does not authorize machine-only M1 static work",
    );
  },
  ownerAuthorizationFingerprint(receipt) {
    return receipt.receiptFingerprintSha256;
  },
  ownerM1MachineOnlyEffective(receipt) {
    return receipt.authorityBoundary.m1MachineOnlyEffective;
  },
});

const ACCEPTANCE_EFFECTS = Object.freeze({
  authoritativeOriginalRuntime: false,
  currentJavaScriptCandidate: false,
  implementationAuthorized: false,
  fidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  published: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
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

function jsonBytes(value) {
  return Buffer.from(stableJson(value));
}

function manifestBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function contained(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function resolveProjectPath(root, relativePath, label = relativePath) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `${label}: path must be project-relative and portable`,
  );
  const absolutePath = path.resolve(root, relativePath);
  invariant(contained(root, absolutePath), `${label}: path escapes project root`);
  invariant(
    portable(path.relative(root, absolutePath)) === relativePath,
    `${label}: path is not normalized`,
  );
  return absolutePath;
}

async function assertSafeParent(root, absolutePath, label) {
  const rootInfo = await lstat(root);
  invariant(
    rootInfo.isDirectory() && !rootInfo.isSymbolicLink(),
    `${label}: project root must be an ordinary directory`,
  );
  const rootReal = await realpath(root);
  const relativeParent = path.relative(root, path.dirname(absolutePath));
  invariant(
    relativeParent !== ".." &&
      !relativeParent.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativeParent),
    `${label}: parent escapes project root`,
  );
  let cursor = root;
  for (const segment of relativeParent.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const info = await lstat(cursor);
    invariant(
      info.isDirectory() && !info.isSymbolicLink(),
      `${label}: ancestor must be an ordinary directory: ${portable(
        path.relative(root, cursor),
      )}`,
    );
  }
  const parentReal = await realpath(path.dirname(absolutePath));
  invariant(
    contained(rootReal, parentReal),
    `${label}: real parent escapes project root`,
  );
}

function guardIdentity(info) {
  return {
    dev: info.dev,
    ino: info.ino,
    mode: info.mode,
    uid: info.uid,
    gid: info.gid,
    nlink: info.nlink,
    size: info.size,
    mtimeMs: info.mtimeMs,
  };
}

function identitiesEqual(left, right) {
  return Object.keys(left).every((key) => left[key] === right?.[key]);
}

function descriptor(binding) {
  return {
    path: binding.path,
    bytes: binding.bytes.length,
    sha256: binding.sha256,
  };
}

async function readBinding(
  root,
  relativePath,
  {json = false, label = relativePath} = {},
) {
  const absolutePath = resolveProjectPath(root, relativePath, label);
  await assertSafeParent(root, absolutePath, label);
  const before = await lstat(absolutePath);
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${label}: must be one ordinary single-link file`,
  );
  const bytes = await readFile(absolutePath);
  const after = await lstat(absolutePath);
  invariant(
    identitiesEqual(guardIdentity(before), guardIdentity(after)) &&
      bytes.length === after.size,
    `${label}: changed while being read`,
  );
  let value = null;
  if (json) {
    try {
      value = JSON.parse(bytes.toString("utf8"));
    } catch (error) {
      throw new Error(`${label}: invalid JSON (${error.message})`);
    }
  }
  return {
    path: relativePath,
    absolutePath,
    bytes,
    sha256: sha256(bytes),
    value,
    guard: {
      path: relativePath,
      identity: guardIdentity(after),
      sha256: sha256(bytes),
    },
  };
}

async function readOptionalOutput(root, relativePath, label) {
  const absolutePath = resolveProjectPath(root, relativePath, label);
  await assertSafeParent(root, absolutePath, label);
  try {
    return await readBinding(root, relativePath, {label});
  } catch (error) {
    if (error?.code === "ENOENT") {
      return {
        path: relativePath,
        absolutePath,
        bytes: null,
        sha256: null,
        guard: {path: relativePath, absent: true},
      };
    }
    throw error;
  }
}

async function verifyGuard(root, guard, label = guard.path) {
  const absolutePath = resolveProjectPath(root, guard.path, label);
  await assertSafeParent(root, absolutePath, label);
  if (guard.absent) {
    try {
      await lstat(absolutePath);
    } catch (error) {
      if (error?.code === "ENOENT") return;
      throw error;
    }
    throw new Error(`${label}: appeared after preflight`);
  }
  const current = await readBinding(root, guard.path, {label});
  invariant(
    identitiesEqual(guard.identity, current.guard.identity) &&
      guard.sha256 === current.sha256,
    `${label}: changed after preflight`,
  );
}

function assertDescriptor(binding, expected, label) {
  invariant(
    binding?.path === expected.path &&
      binding.bytes === expected.bytes.length &&
      binding.sha256 === expected.sha256,
    `${label}: binding does not match current bytes`,
  );
}

function assertAllFalse(value, label) {
  invariant(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(ACCEPTANCE_EFFECTS).every(
        (key) => value[key] === false,
      ) &&
      Object.values(value).every((entry) => entry === false),
    `${label}: acceptance boundary is not all false`,
  );
}

function validateFingerprintedCandidate(value, label) {
  invariant(
    value && typeof value === "object" && !Array.isArray(value),
    `${label}: candidate must be an object`,
  );
  const projected = structuredClone(value);
  delete projected.artifactFingerprintSha256;
  delete projected.generatedMarker;
  const fingerprint = sha256(stableJson(projected));
  invariant(
    value.artifactFingerprintSha256 === fingerprint &&
      value.generatedMarker === `sha256:${fingerprint}`,
    `${label}: candidate fingerprint is invalid`,
  );
  return value;
}

function withArtifactFingerprint(value) {
  const fingerprint = sha256(stableJson(value));
  return {
    ...value,
    artifactFingerprintSha256: fingerprint,
    generatedMarker: `sha256:${fingerprint}`,
  };
}

function validateConfig(config) {
  invariant(
    config &&
      typeof config === "object" &&
      typeof config.releaseId === "string" &&
      typeof config.releaseLabel === "string" &&
      typeof config.titleDisplay === "string" &&
      Number.isSafeInteger(config.grade) &&
      Number.isSafeInteger(config.lesson) &&
      Number.isSafeInteger(config.activeXmlReferencedPages) &&
      Number.isSafeInteger(config.courseShells) &&
      Number.isSafeInteger(config.memberCount) &&
      config.memberCount ===
        config.activeXmlReferencedPages + config.courseShells &&
      isSha256(config.releaseFingerprintSha256) &&
      typeof config.generatorPath === "string" &&
      typeof config.ownerAuthorizationValidatorPath === "string" &&
      typeof config.candidateMaterializerPath === "string" &&
      typeof config.releasePath === "string" &&
      typeof config.sourceScopePath === "string" &&
      typeof config.ownerAuthorizationPath === "string" &&
      typeof config.sourceScopeBindingName === "string" &&
      typeof config.receiptName === "string" &&
      typeof config.validateCandidateReceipt === "function" &&
      typeof config.validateOwnerAuthorization === "function" &&
      typeof config.ownerAuthorizationFingerprint === "function" &&
      typeof config.ownerM1MachineOnlyEffective === "function",
    "static reconciliation configuration is incomplete",
  );
  for (const name of [
    "manifestRuntimeFacts",
    "assetDefinitionCensus",
    "definitionInventory",
    "scriptInventory",
    "dependencyInventory",
    "briefStaticPrefill",
    "receipt",
  ]) {
    invariant(
      typeof config.candidateOutputNames?.[name] === "string",
      `static reconciliation candidate output is missing: ${name}`,
    );
  }
  for (const name of [
    "sourceScopeBinding",
    "runtimeFactsCandidate",
    "scriptInventoryCandidate",
    "dependencyInventoryCandidate",
    "canonicalScriptInventory",
    "canonicalDependencyInventory",
    "reconciliationReceipt",
  ]) {
    invariant(
      typeof config.artifactTypes?.[name] === "string",
      `static reconciliation artifact type is missing: ${name}`,
    );
  }
  return config;
}

function historicalPostimageSuccessorPolicy(config, member) {
  const policy = config.historicalPostimageSuccessorPolicy;
  if (
    !policy ||
    !Array.isArray(policy.animationIds) ||
    !policy.animationIds.includes(member.animationId)
  ) {
    return null;
  }
  invariant(
    new Set(policy.animationIds).size === policy.animationIds.length &&
      Array.isArray(policy.outputNames) &&
      new Set(policy.outputNames).size === policy.outputNames.length &&
      policy.outputNames.every((name) =>
        ["migrationManifest", "migrationBrief", "scriptInventory", "dependencyInventory"]
          .includes(name)) &&
      Array.isArray(policy.inputNames) &&
      new Set(policy.inputNames).size === policy.inputNames.length &&
      policy.inputNames.every((name) =>
        [
          "sourceScopeBinding",
          "machineAudit",
          "canonicalAssetInventory",
          "canonicalAudioInventory",
          "canonicalKeyframes",
          "canonicalCoverage",
        ].includes(name)) &&
      (
        policy.additionalInputs === undefined ||
        (
          policy.additionalInputs &&
          typeof policy.additionalInputs === "object" &&
          !Array.isArray(policy.additionalInputs) &&
          Object.entries(policy.additionalInputs).every(
            ([name, descriptor]) =>
              typeof name === "string" &&
              name.length > 0 &&
              descriptor &&
              typeof descriptor === "object" &&
              !Array.isArray(descriptor) &&
              ["workspace", "project"].includes(descriptor.scope) &&
              typeof descriptor.path === "string" &&
              descriptor.path.length > 0 &&
              !path.isAbsolute(descriptor.path) &&
              !descriptor.path.includes("\\") &&
              typeof descriptor.json === "boolean",
          )
        )
      ) &&
      typeof policy.validate === "function",
    `${member.animationId}: historical postimage successor policy is malformed`,
  );
  return policy;
}

function validateHistoricalPostimageSuccessor({
  config,
  member,
  phase,
  receipt,
  outputs,
  inputs,
  outputName,
  currentOutput,
}) {
  const policy = historicalPostimageSuccessorPolicy(config, member);
  invariant(
    policy,
    `${member.animationId}: no historical postimage successor policy is configured`,
  );
  policy.validate({
    member,
    phase,
    receipt,
    outputs,
    inputs,
    outputName,
    currentOutput,
  });
}

function memberInputPaths(config) {
  return {
    sourceScopeBinding:
      `audit/machine/${config.sourceScopeBindingName}`,
    candidateReceipt:
      `audit/machine/${config.candidateOutputNames.receipt}`,
    runtimeFacts:
      `audit/machine/${config.candidateOutputNames.manifestRuntimeFacts}`,
    assetCensus:
      `audit/machine/${config.candidateOutputNames.assetDefinitionCensus}`,
    definitionInventory:
      `audit/machine/${config.candidateOutputNames.definitionInventory}`,
    scriptCandidate:
      `audit/machine/${config.candidateOutputNames.scriptInventory}`,
    dependencyCandidate:
      `audit/machine/${config.candidateOutputNames.dependencyInventory}`,
    briefCandidate:
      `audit/machine/${config.candidateOutputNames.briefStaticPrefill}`,
    machineAudit: "audit/machine/report.json",
    assetInventory: "asset-inventory.csv",
    audioInventory: "audio-inventory.csv",
    keyframes: "keyframes.csv",
    fullFrameCoverage: "evidence/full-frame-coverage.json",
  };
}

function outputSuffixes(config) {
  return {
    migrationManifest: "migration.json",
    migrationBrief: "MIGRATION_BRIEF.md",
    scriptInventory: "audit/script-inventory.json",
    dependencyInventory: "audit/dependency-inventory.json",
    receipt: `audit/machine/${config.receiptName}`,
  };
}

function selectRelease(document, config) {
  invariant(
    document?.schemaVersion === 1 && Array.isArray(document.releases),
    "lesson release catalog is malformed",
  );
  const matches = document.releases.filter(
    ({releaseId}) => releaseId === config.releaseId,
  );
  invariant(
    matches.length === 1,
    `${config.releaseLabel} release must be unique`,
  );
  const release = matches[0];
  invariant(
    release.titleDisplay === config.titleDisplay &&
      release.grade === config.grade &&
      release.lesson === config.lesson &&
      release.releaseType === "complete-lesson" &&
      release.publicationMode === "atomic" &&
      release.expectedCounts?.activeXmlReferencedPages ===
        config.activeXmlReferencedPages &&
      release.expectedCounts?.courseShells === config.courseShells &&
      release.expectedCounts?.members === config.memberCount &&
      Array.isArray(release.members) &&
      release.members.length === config.memberCount &&
      sha256(stableJson(release)) ===
        config.releaseFingerprintSha256,
    `${config.releaseLabel} release identity, count, or fingerprint drifted`,
  );
  const ids = new Set(release.members.map(({animationId}) => animationId));
  invariant(
    ids.size === config.memberCount,
    `${config.releaseLabel} release contains duplicate animation IDs`,
  );
  return release;
}

function selectScopeMembers(document, release, config) {
  invariant(
    document?.schemaVersion === 1 &&
      document.releaseId === config.releaseId &&
      Array.isArray(document.members) &&
      document.members.length === config.memberCount,
    `${config.releaseLabel} source-scope freeze is malformed or not ${config.memberCount}-member`,
  );
  const byId = new Map(
    document.members.map((member) => [member.animationId, member]),
  );
  invariant(
    byId.size === config.memberCount,
    `${config.releaseLabel} source-scope freeze contains duplicate animation IDs`,
  );
  for (const member of release.members) {
    const scopeMember = byId.get(member.animationId);
    invariant(
      scopeMember?.ordinal === member.ordinal &&
        scopeMember.assetId === member.assetId &&
        scopeMember.workspacePath === `migrations/${member.animationId}` &&
        scopeMember.source?.swf?.sha256 === member.source.sha256,
      `${member.animationId}: release/source-scope identity drifted`,
    );
  }
  return byId;
}

function countCsvDataRows(bytes, label) {
  const text = bytes.toString("utf8");
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  invariant(!quoted, `${label}: unterminated quoted CSV field`);
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  invariant(
    rows.length >= 1 &&
      rows[0][0] === "cue_id" &&
      rows[0].includes("source_file") &&
      rows[0].includes("sha256"),
    `${label}: audio inventory header is invalid`,
  );
  return rows.length - 1;
}

function outputPaths(member, config) {
  return Object.fromEntries(
    Object.entries(outputSuffixes(config)).map(([name, suffix]) => [
      name,
      `migrations/${member.animationId}/${suffix}`,
    ]),
  );
}

export function g5L5M1StaticReconciliationReceiptPath(animationId) {
  return lessonM1StaticReconciliationReceiptPath(
    G5_L5_STATIC_RECONCILIATION_CONFIG,
    animationId,
  );
}

export function lessonM1StaticReconciliationReceiptPath(
  config,
  animationId,
) {
  validateConfig(config);
  invariant(
    typeof animationId === "string" &&
      /^[a-z0-9][a-z0-9-]*$/.test(animationId),
    "animationId must be a normalized portable identifier",
  );
  return `migrations/${animationId}/audit/machine/${config.receiptName}`;
}

function beforeDescriptor(output) {
  return output.bytes === null
    ? {path: output.path, exists: false, bytes: 0, sha256: null}
    : {
        path: output.path,
        exists: true,
        bytes: output.bytes.length,
        sha256: output.sha256,
      };
}

function afterDescriptor(relativePath, bytes) {
  return {
    path: relativePath,
    exists: true,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

function validateStaticInputs({
  member,
  scopeMember,
  inputs,
  releaseBinding,
  scopeBinding,
  config,
}) {
  const scopeRecord = inputs.sourceScopeBinding.value;
  invariant(
    scopeRecord?.schemaVersion === 1 &&
      scopeRecord.artifactType ===
        config.artifactTypes.sourceScopeBinding &&
      scopeRecord.releaseId === config.releaseId &&
      scopeRecord.member?.animationId === member.animationId &&
      scopeRecord.member?.assetId === member.assetId &&
      scopeRecord.member?.ordinal === member.ordinal,
    `${member.animationId}: source-scope binding identity drifted`,
  );
  assertDescriptor(
    scopeRecord.scope,
    scopeBinding,
    `${member.animationId}: source-scope report`,
  );
  invariant(
    scopeRecord.member.source?.swf?.sha256 ===
      scopeMember.source.swf.sha256 &&
      scopeRecord.disposition?.runtimeReachability === "unresolved" &&
      scopeRecord.acceptanceEffects?.strictComplete === false &&
      scopeRecord.acceptanceEffects?.published === false,
    `${member.animationId}: source-scope boundary drifted`,
  );

  const candidateReceipt = config.validateCandidateReceipt(
    inputs.candidateReceipt.value,
    member,
  );
  assertAllFalse(
    candidateReceipt.acceptanceEffects,
    `${member.animationId}: candidate receipt`,
  );
  invariant(
    candidateReceipt.releaseMembership?.ordinal === member.ordinal &&
      candidateReceipt.releaseMembership?.releaseRole === member.releaseRole &&
      candidateReceipt.releaseMembership?.batchId === member.batchId &&
      candidateReceipt.releaseMembership?.shardId === member.shardId &&
      candidateReceipt.runtimeSessionsExecuted === 0 &&
      candidateReceipt.guiApplicationsLaunched === 0 &&
      candidateReceipt.legacyEndpointsExecuted === 0 &&
      candidateReceipt.workspaceCanonicalFilesChanged === 0,
    `${member.animationId}: candidate receipt crossed its machine-only boundary`,
  );

  const candidateDescriptors = {
    manifestRuntimeFacts: inputs.runtimeFacts,
    assetDefinitionCensus: inputs.assetCensus,
    definitionInventory: inputs.definitionInventory,
    scriptInventory: inputs.scriptCandidate,
    dependencyInventory: inputs.dependencyCandidate,
    briefStaticPrefill: inputs.briefCandidate,
  };
  for (const [key, binding] of Object.entries(candidateDescriptors)) {
    assertDescriptor(
      candidateReceipt.outputs?.[key],
      binding,
      `${member.animationId}: ${key}`,
    );
  }
  assertDescriptor(
    candidateReceipt.inputs?.lessonReleaseCatalog,
    releaseBinding,
    `${member.animationId}: release catalog`,
  );
  assertDescriptor(
    candidateReceipt.inputs?.sourceScopeBinding,
    inputs.sourceScopeBinding,
    `${member.animationId}: source-scope binding`,
  );
  assertDescriptor(
    candidateReceipt.inputs?.machineAudit,
    inputs.machineAudit,
    `${member.animationId}: machine audit`,
  );
  for (const [receiptKey, inputKey] of [
    ["canonicalAssetInventory", "assetInventory"],
    ["canonicalAudioInventory", "audioInventory"],
    ["canonicalKeyframes", "keyframes"],
    ["canonicalCoverageV2", "fullFrameCoverage"],
  ]) {
    assertDescriptor(
      candidateReceipt.inputs?.[receiptKey],
      inputs[inputKey],
      `${member.animationId}: ${receiptKey}`,
    );
  }

  const runtimeFacts = validateFingerprintedCandidate(
    inputs.runtimeFacts.value,
    `${member.animationId}: runtime-facts candidate`,
  );
  const scriptCandidate = validateFingerprintedCandidate(
    inputs.scriptCandidate.value,
    `${member.animationId}: script candidate`,
  );
  const dependencyCandidate = validateFingerprintedCandidate(
    inputs.dependencyCandidate.value,
    `${member.animationId}: dependency candidate`,
  );
  for (const [label, document, artifactType] of [
    [
      "runtime facts",
      runtimeFacts,
      config.artifactTypes.runtimeFactsCandidate,
    ],
    [
      "script inventory",
      scriptCandidate,
      config.artifactTypes.scriptInventoryCandidate,
    ],
    [
      "dependency inventory",
      dependencyCandidate,
      config.artifactTypes.dependencyInventoryCandidate,
    ],
  ]) {
    invariant(
      document.releaseId === config.releaseId &&
        document.animationId === member.animationId &&
        document.assetId === member.assetId &&
        document.artifactType === artifactType,
      `${member.animationId}: ${label} identity drifted`,
    );
    assertAllFalse(
      document.acceptanceEffects,
      `${member.animationId}: ${label}`,
    );
  }
  invariant(
    runtimeFacts.canonicalPatchApplied === false &&
      runtimeFacts.unresolved?.reachableScenarios === true &&
      runtimeFacts.unresolved?.naturalTraces === true &&
      runtimeFacts.unresolved?.rendererSelection === true,
    `${member.animationId}: runtime-facts candidate resolved a protected decision`,
  );
  invariant(
    Array.isArray(scriptCandidate.scripts) &&
      scriptCandidate.summary?.scriptCount ===
        scriptCandidate.scripts.length &&
      scriptCandidate.summary?.completeReachableScriptInventory === false &&
      scriptCandidate.unresolved?.runtimeReachability === true &&
      scriptCandidate.scripts.every(
        (script) =>
          script.runtimeReachability === "unresolved" &&
          script.scenario === "unresolved" &&
          script.naturalTrace === "unresolved",
      ),
    `${member.animationId}: script inventory claims runtime reachability`,
  );
  invariant(
    Array.isArray(dependencyCandidate.candidates) &&
      dependencyCandidate.summary?.runtimeDependencyClearance === false &&
      dependencyCandidate.summary?.executedLegacyEndpointCount === 0 &&
      dependencyCandidate.unresolved?.runtimeReachability === true &&
      dependencyCandidate.unresolved?.hostDependencyClosure === true,
    `${member.animationId}: dependency candidate crossed runtime or endpoint boundary`,
  );
  invariant(
    inputs.machineAudit.value?.animationId === member.animationId &&
      inputs.machineAudit.value?.migrationStatusUnchanged === true,
    `${member.animationId}: machine audit identity or status boundary drifted`,
  );
  return {
    candidateReceipt,
    runtimeFacts,
    scriptCandidate,
    dependencyCandidate,
  };
}

function reconcileManifest({
  member,
  current,
  runtimeFacts,
  scriptCandidate,
  audioRowCount,
  config,
}) {
  invariant(
    current?.schemaVersion === 2 &&
      current.animationId === member.animationId &&
      current.assetId === member.assetId,
    `${member.animationId}: canonical manifest identity drifted`,
  );
  invariant(
    current.runtime?.complexity === "unknown" &&
      current.implementation?.rendering === "undecided" &&
      current.implementation?.route === "" &&
      current.implementation?.routeFile === "" &&
      current.scenarios?.every(({description}) => description === ""),
    `${member.animationId}: protected implementation or scenario decision is no longer unresolved`,
  );
  const facts = runtimeFacts.candidateRuntimeFacts;
  invariant(
    typeof facts?.backgroundColor === "string" &&
      /^#[a-f0-9]{6}$/i.test(facts.backgroundColor) &&
      typeof facts.actionScriptGeneration === "string" &&
      facts.actionScriptGeneration.length > 0 &&
      typeof facts.toolVersions?.ffdec?.version === "string" &&
      facts.toolVersions.ffdec.version.length > 0 &&
      facts.toolVersions.ffdec.success === true &&
      typeof facts.toolVersions?.swfmill?.version === "string" &&
      facts.toolVersions.swfmill.version.length > 0 &&
      facts.toolVersions.swfmill.success === true,
    `${member.animationId}: exact static runtime/tool facts are incomplete`,
  );
  invariant(
    current.runtime.stage?.width === facts.stage?.width &&
      current.runtime.stage?.height === facts.stage?.height &&
      current.runtime.fps === facts.fps &&
      current.runtime.frameCount === facts.rootFrameCount &&
      current.runtime.swfSignature === facts.swfSignature &&
      current.runtime.swfVersion === facts.swfVersion,
    `${member.animationId}: candidate facts conflict with canonical static preimage`,
  );
  invariant(
    Array.isArray(current.runtime.externalDependencies) &&
      current.runtime.externalDependencies.length === 0,
    `${member.animationId}: canonical external dependencies require human reconciliation`,
  );

  const desired = structuredClone(current);
  desired.runtime.backgroundColor = facts.backgroundColor;
  desired.runtime.actionScriptVersion = facts.actionScriptGeneration;
  desired.runtime.scripts = [
    {
      actionScriptVersion: facts.actionScriptGeneration,
      confidence:
        "machine-extracted-static-runtime-reachability-unresolved",
      evidence: "audit/script-inventory.json",
      exportedFileCount: scriptCandidate.summary.scriptCount,
      completeReachableInventory: false,
      runtimeReachability: "unresolved",
    },
  ];
  desired.toolVersions.ffdec = facts.toolVersions.ffdec.version;
  desired.toolVersions.swfmill = facts.toolVersions.swfmill.version;

  let audioRequirementRaised = false;
  if (
    config.allowAudioRequirementRaise !== false &&
    audioRowCount > 0 &&
    desired.audio?.required === false
  ) {
    desired.audio.required = true;
    desired.audio.reasonNotRequired = "";
    audioRequirementRaised = true;
  }
  invariant(
    desired.runtime.complexity === "unknown" &&
      desired.implementation.rendering === "undecided" &&
      desired.implementation.route === "" &&
      desired.implementation.routeFile === "" &&
      desired.status === current.status &&
      desired.scenarios.every(({description}) => description === "") &&
      stableJson(desired.audio.languages) ===
        stableJson(current.audio.languages) &&
      stableJson(desired.audio.cues) === stableJson(current.audio.cues),
    `${member.animationId}: reconciliation crossed a protected decision`,
  );
  return {desired, audioRequirementRaised};
}

function buildCanonicalScriptInventory({
  member,
  candidate,
  candidateBinding,
  ownerDirective,
  generator,
  config,
}) {
  return withArtifactFingerprint({
    schemaVersion: 1,
    artifactType: config.artifactTypes.canonicalScriptInventory,
    releaseId: config.releaseId,
    animationId: member.animationId,
    assetId: member.assetId,
    generatedBy: descriptor(generator),
    ownerDirective: {
      ...descriptor(ownerDirective.binding),
      receiptFingerprintSha256:
        ownerDirective.fingerprintSha256,
    },
    adoptedFrom: {
      ...descriptor(candidateBinding),
      artifactFingerprintSha256:
        candidate.artifactFingerprintSha256,
    },
    source: structuredClone(candidate.source ?? null),
    summary: {
      scriptCount: candidate.summary.scriptCount,
      scriptBytes: candidate.summary.scriptBytes,
      scriptsWithExternalCallCandidates:
        candidate.summary.scriptsWithExternalCallCandidates,
      machineExtractedStatic: true,
      completeReachableScriptInventory: false,
      runtimeReachabilityResolved: false,
    },
    scripts: structuredClone(candidate.scripts),
    unresolved: {
      runtimeReachability: true,
      scenarioAndTraceBinding: true,
      sourceTargetSemantics: true,
      hostAndExternalDependencySemantics: true,
    },
    execution: {
      runtimeSessionsExecuted: 0,
      guiApplicationsLaunched: 0,
      legacyEndpointsExecuted: 0,
    },
    acceptanceEffects: structuredClone(ACCEPTANCE_EFFECTS),
  });
}

function buildCanonicalDependencyInventory({
  member,
  candidate,
  candidateBinding,
  ownerDirective,
  generator,
  config,
}) {
  return withArtifactFingerprint({
    schemaVersion: 1,
    artifactType: config.artifactTypes.canonicalDependencyInventory,
    releaseId: config.releaseId,
    animationId: member.animationId,
    assetId: member.assetId,
    generatedBy: descriptor(generator),
    ownerDirective: {
      ...descriptor(ownerDirective.binding),
      receiptFingerprintSha256:
        ownerDirective.fingerprintSha256,
    },
    adoptedFrom: {
      ...descriptor(candidateBinding),
      artifactFingerprintSha256:
        candidate.artifactFingerprintSha256,
    },
    scanMethod: candidate.scanMethod,
    noCandidateMeaning: candidate.noCandidateMeaning,
    candidates: structuredClone(candidate.candidates),
    summary: {
      apiCandidateCount: candidate.summary.apiCandidateCount,
      occurrenceCount: candidate.summary.occurrenceCount,
      machineExtractedStatic: true,
      executedLegacyEndpointCount: 0,
      runtimeDependencyClearance: false,
    },
    unresolved: {
      endpointOrTarget: true,
      runtimeReachability: true,
      securityDisposition: true,
      hostDependencyClosure: true,
      reviewedReplacementApi: true,
    },
    execution: {
      runtimeSessionsExecuted: 0,
      guiApplicationsLaunched: 0,
      legacyEndpointsExecuted: 0,
    },
    acceptanceEffects: structuredClone(ACCEPTANCE_EFFECTS),
  });
}

function buildBrief({
  member,
  scopeMember,
  runtimeFacts,
  scriptCandidate,
  dependencyCandidate,
  audioRowCount,
  audioRequirementRaised,
  ownerDirective,
  config,
}) {
  const facts = runtimeFacts.candidateRuntimeFacts;
  const fla = runtimeFacts.source?.fla;
  const titlePrefix =
    config.briefManagedSection === true ? "##" : "#";
  return `${titlePrefix} ${member.animationId} M1 Static-Reconciled Migration Brief

> Canonical machine-only static specification. This is acceptance-neutral and does not establish original-runtime authority, renderer implementation, fidelity, human review, owner acceptance, strict completion, or publication.

## Release and source identity

- Release: \`${config.releaseId}\`; member **${member.ordinal}/${config.memberCount}**; role: \`${member.releaseRole}\`; shard: \`${member.shardId}\`.
- Animation/asset: \`${member.animationId}\` / \`${member.assetId}\`.
- SWF: \`${runtimeFacts.source.swf.path}\`; ${runtimeFacts.source.swf.bytes} bytes; SHA-256 \`${runtimeFacts.source.swf.sha256}\`.
${fla ? `- FLA: \`${fla.path}\`; ${fla.bytes} bytes; SHA-256 \`${fla.sha256}\`.` : "- FLA: not present in the frozen source scope; no authoring structure is inferred."}
- Source-scope role: \`${scopeMember.role}\`; source model: \`${scopeMember.source.sourceModel}\`.
- Owner authorization: \`${config.ownerAuthorizationPath}\`; fingerprint \`${ownerDirective.fingerprintSha256}\`; authority is limited to machine-only M1 static work.

## Reconciled static facts

- Stage: **${facts.stage.width} × ${facts.stage.height}**; FPS: **${facts.fps}**; root frames: **${facts.rootFrameCount}**; duration: **${facts.durationMs} ms**.
- SWF signature/version: **${facts.swfSignature}/${facts.swfVersion}**; ActionScript generation: **${facts.actionScriptGeneration}**; background: **${facts.backgroundColor}**.
- Tool versions adopted exactly from the machine audit: FFDec **${facts.toolVersions.ffdec.version}**; swfmill **${facts.toolVersions.swfmill.version}**.
- Static exported scripts: **${scriptCandidate.summary.scriptCount}**. This is not a complete reachable script inventory.
- Static dependency API candidates: **${dependencyCandidate.summary.apiCandidateCount}** APIs / **${dependencyCandidate.summary.occurrenceCount}** occurrences. No endpoint was contacted or executed.
- Canonical machine inventories: \`audit/script-inventory.json\` and \`audit/dependency-inventory.json\`.

## Audio fail-closed disposition

- Canonical audio-inventory data rows: **${audioRowCount}**.
- Manifest audio requirement raised from false to true in this reconciliation: **${audioRequirementRaised}**.
- Spoken language/content, cue reachability, timing, synchronization, loop/stop behavior, and listening acceptance remain **unresolved**. Languages and cues were not inferred.

## Decisions intentionally unresolved

- Renderer selection, implementation route/component/module/package, rejected alternatives, and implementation authorization: **unresolved / not authorized**.
- Instructional behavior, branches, terminal state, Replay/reset, random behavior, reachable scenarios, natural traces, and host entry: **unresolved**.
- Nested-frame placement/entry state, keyframes, requirement coverage, and full-frame baseline: **unresolved; canonical keyframes and coverage were not changed**.
- Runtime reachability, dependency security disposition, host dependency closure, and reviewed replacement APIs: **unresolved**.
- Accessibility, localization, visual comparison, audio listening, human review, owner fidelity acceptance, strict completion, and publication: **false or pending**.

## Machine-only boundary

- Runtime sessions executed: **0**.
- GUI applications launched: **0**.
- Legacy endpoints executed: **0**.
- No renderer, asset inventory, keyframe, coverage, scenario, or frame-domain artifact was produced or promoted by this reconciliation.
`;
}

function reconcileBrief(currentBytes, generatedBrief, config) {
  if (config.briefManagedSection !== true) {
    return Buffer.from(generatedBrief);
  }
  const begin =
    "<!-- BEGIN MACHINE-OWNED M1 STATIC RECONCILIATION -->";
  const end =
    "<!-- END MACHINE-OWNED M1 STATIC RECONCILIATION -->";
  const text = currentBytes.toString("utf8");
  const firstBegin = text.indexOf(begin);
  const firstEnd = text.indexOf(end);
  invariant(
    (firstBegin === -1 && firstEnd === -1) ||
      (firstBegin !== -1 &&
        firstEnd > firstBegin &&
        text.indexOf(begin, firstBegin + begin.length) === -1 &&
        text.indexOf(end, firstEnd + end.length) === -1),
    "MIGRATION_BRIEF managed static section markers are malformed",
  );
  const managed = `${begin}\n${generatedBrief.trimEnd()}\n${end}`;
  if (firstBegin === -1) {
    const separator = text.endsWith("\n\n")
      ? ""
      : text.endsWith("\n")
        ? "\n"
        : "\n\n";
    return Buffer.from(`${text}${separator}${managed}\n`);
  }
  return Buffer.from(
    `${text.slice(0, firstBegin)}${managed}${text.slice(firstEnd + end.length)}`,
  );
}

function validateOutputPathSet(member, paths, config) {
  const expected = outputPaths(member, config);
  invariant(
    stableJson(paths) === stableJson(expected),
    `${member.animationId}: output allowlist drifted`,
  );
}

function buildReceipt({
  member,
  audioRequirementRaised,
  scriptCandidate,
  dependencyCandidate,
  ownerDirective,
  globalInputs,
  inputs,
  outputs,
  priorReceipt,
  config,
}) {
  const originalBefore = priorReceipt
    ? Object.fromEntries(
        Object.entries(priorReceipt.outputs).map(([name, value]) => [
          name,
          structuredClone(value.before),
        ]),
      )
    : Object.fromEntries(
        Object.entries(outputs)
          .filter(([name]) => name !== "receipt")
          .map(([name, output]) => [name, beforeDescriptor(output)]),
      );
  const base = {
    schemaVersion: 1,
    artifactType: config.artifactTypes.reconciliationReceipt,
    releaseId: config.releaseId,
    animationId: member.animationId,
    assetId: member.assetId,
    releaseMembership: {
      ordinal: member.ordinal,
      releaseRole: member.releaseRole,
      batchId: member.batchId,
      shardId: member.shardId,
    },
    reconciliation: {
      applied: true,
      machineOnlyStatic: true,
      canonicalOutputCount: 4,
      audioRequirementRaised,
    },
    summary: {
      scriptCount: scriptCandidate.summary.scriptCount,
      dependencyApiCandidateCount:
        dependencyCandidate.summary.apiCandidateCount,
      dependencyOccurrenceCount:
        dependencyCandidate.summary.occurrenceCount,
      manifestStaticFactsReconciled: true,
      migrationBriefStaticReconciled: true,
      complexityResolved: false,
      rendererSelected: false,
      runtimeReachabilityResolved: false,
    },
    ownerDirective: {
      ...descriptor(ownerDirective.binding),
      receiptFingerprintSha256:
        ownerDirective.fingerprintSha256,
      m1MachineOnlyEffective:
        ownerDirective.m1MachineOnlyEffective,
    },
    inputBindingSemantics: {
      candidateArtifacts:
        "historical-at-adoption-do-not-require-current-path-byte-identity",
      protectedCanonicalPreimages:
        "current-through-adoption-recorded-as-output-before-or-immutable-input",
    },
    inputs: {
      releaseCatalog: descriptor(globalInputs.release),
      sourceScopeFreeze: descriptor(globalInputs.scope),
      ownerDirectiveValidator: descriptor(
        globalInputs.ownerDirectiveValidator,
      ),
      generator: descriptor(globalInputs.generator),
      ...(globalInputs.reconciliationEngine
        ? {
            reconciliationEngine: descriptor(
              globalInputs.reconciliationEngine,
            ),
          }
        : {}),
      candidateMaterializer: descriptor(
        globalInputs.candidateMaterializer,
      ),
      sourceScopeBinding: descriptor(inputs.sourceScopeBinding),
      candidateReceipt: descriptor(inputs.candidateReceipt),
      runtimeFactsCandidate: descriptor(inputs.runtimeFacts),
      candidateAssetCensus: descriptor(inputs.assetCensus),
      candidateDefinitionInventory: descriptor(
        inputs.definitionInventory,
      ),
      scriptCandidate: descriptor(inputs.scriptCandidate),
      dependencyCandidate: descriptor(inputs.dependencyCandidate),
      briefCandidate: descriptor(inputs.briefCandidate),
      machineAudit: descriptor(inputs.machineAudit),
      canonicalAssetInventory: descriptor(inputs.assetInventory),
      canonicalAudioInventory: descriptor(inputs.audioInventory),
      canonicalKeyframes: descriptor(inputs.keyframes),
      canonicalCoverage: descriptor(inputs.fullFrameCoverage),
    },
    outputs: Object.fromEntries(
      Object.entries(outputs)
        .filter(([name]) => name !== "receipt")
        .map(([name, output]) => [
          name,
          {
            before: originalBefore[name],
            after: afterDescriptor(output.path, output.desiredBytes),
          },
        ]),
    ),
    execution: {
      runtimeSessionsExecuted: 0,
      guiApplicationsLaunched: 0,
      legacyEndpointsExecuted: 0,
    },
    acceptanceEffects: structuredClone(ACCEPTANCE_EFFECTS),
  };
  return {
    ...base,
    receiptFingerprintSha256: sha256(stableJson(base)),
  };
}

export function validateG5L5M1StaticReconciliationReceipt(
  receipt,
  member,
) {
  return validateLessonM1StaticReconciliationReceipt(
    receipt,
    member,
    G5_L5_STATIC_RECONCILIATION_CONFIG,
  );
}

export function validateLessonM1StaticReconciliationReceipt(
  receipt,
  member,
  config,
) {
  validateConfig(config);
  invariant(
    receipt?.schemaVersion === 1 &&
      receipt.artifactType ===
        config.artifactTypes.reconciliationReceipt &&
      receipt.releaseId === config.releaseId &&
      receipt.animationId === member.animationId &&
      receipt.assetId === member.assetId,
    `${member.animationId}: M1 static reconciliation receipt identity drifted`,
  );
  invariant(
    receipt.releaseMembership?.ordinal === member.ordinal &&
      receipt.releaseMembership?.releaseRole === member.releaseRole &&
      receipt.releaseMembership?.batchId === member.batchId &&
      receipt.releaseMembership?.shardId === member.shardId,
    `${member.animationId}: M1 receipt release membership drifted`,
  );
  invariant(
    receipt.reconciliation?.applied === true &&
      receipt.reconciliation?.machineOnlyStatic === true &&
      receipt.reconciliation?.canonicalOutputCount === 4 &&
      typeof receipt.reconciliation?.audioRequirementRaised === "boolean" &&
      receipt.summary?.manifestStaticFactsReconciled === true &&
      receipt.summary?.migrationBriefStaticReconciled === true &&
      receipt.summary?.complexityResolved === false &&
      receipt.summary?.rendererSelected === false &&
      receipt.summary?.runtimeReachabilityResolved === false &&
      Number.isSafeInteger(receipt.summary?.scriptCount) &&
      Number.isSafeInteger(
        receipt.summary?.dependencyApiCandidateCount,
      ) &&
      Number.isSafeInteger(
        receipt.summary?.dependencyOccurrenceCount,
      ),
    `${member.animationId}: M1 receipt summary crossed a protected boundary`,
  );
  invariant(
    receipt.ownerDirective?.path ===
      config.ownerAuthorizationPath &&
      isSha256(receipt.ownerDirective?.sha256) &&
      isSha256(receipt.ownerDirective?.receiptFingerprintSha256) &&
      receipt.ownerDirective?.m1MachineOnlyEffective === true,
    `${member.animationId}: M1 receipt owner directive binding drifted`,
  );
  invariant(
    receipt.inputBindingSemantics?.candidateArtifacts ===
      "historical-at-adoption-do-not-require-current-path-byte-identity" &&
      receipt.inputBindingSemantics?.protectedCanonicalPreimages ===
        "current-through-adoption-recorded-as-output-before-or-immutable-input",
    `${member.animationId}: M1 receipt input-binding semantics drifted`,
  );
  invariant(
    receipt.execution?.runtimeSessionsExecuted === 0 &&
      receipt.execution?.guiApplicationsLaunched === 0 &&
      receipt.execution?.legacyEndpointsExecuted === 0,
    `${member.animationId}: M1 receipt records runtime, GUI, or endpoint execution`,
  );
  assertAllFalse(
    receipt.acceptanceEffects,
    `${member.animationId}: M1 receipt`,
  );
  const paths = outputPaths(member, config);
  for (const name of [
    "migrationManifest",
    "migrationBrief",
    "scriptInventory",
    "dependencyInventory",
  ]) {
    const record = receipt.outputs?.[name];
    invariant(
      record?.before?.path === paths[name] &&
        typeof record.before.exists === "boolean" &&
        Number.isSafeInteger(record.before.bytes) &&
        (record.before.exists
          ? record.before.bytes > 0 && isSha256(record.before.sha256)
          : record.before.bytes === 0 &&
            record.before.sha256 === null) &&
        record.after?.path === paths[name] &&
        record.after?.exists === true &&
        Number.isSafeInteger(record.after.bytes) &&
        record.after.bytes > 0 &&
        isSha256(record.after.sha256),
      `${member.animationId}: M1 receipt output binding drifted for ${name}`,
    );
  }
  const projected = structuredClone(receipt);
  delete projected.receiptFingerprintSha256;
  invariant(
    isSha256(receipt.receiptFingerprintSha256) &&
      receipt.receiptFingerprintSha256 === sha256(stableJson(projected)),
    `${member.animationId}: M1 receipt fingerprint is invalid`,
  );
  return receipt;
}

export async function readG5L5M1StaticReconciliationReceipt({
  root = defaultProjectRoot,
  animationId,
  member,
} = {}) {
  return readLessonM1StaticReconciliationReceipt({
    root,
    animationId,
    member,
    config: G5_L5_STATIC_RECONCILIATION_CONFIG,
  });
}

export async function readLessonM1StaticReconciliationReceipt({
  root = defaultProjectRoot,
  animationId,
  member,
  config,
} = {}) {
  validateConfig(config);
  invariant(
    member?.animationId === animationId,
    "member and animationId must identify the same release member",
  );
  const binding = await readBinding(
    root,
    lessonM1StaticReconciliationReceiptPath(config, animationId),
    {json: true, label: `${animationId}: M1 receipt`},
  );
  const receipt = validateLessonM1StaticReconciliationReceipt(
    binding.value,
    member,
    config,
  );
  invariant(
    binding.bytes.equals(jsonBytes(receipt)),
    `${animationId}: M1 receipt is not canonical JSON`,
  );
  const postOutputs = {};
  for (const name of [
    "migrationManifest",
    "migrationBrief",
    "scriptInventory",
    "dependencyInventory",
  ]) {
    const expected = receipt.outputs[name].after;
    const current = await readBinding(root, expected.path, {
      json: name === "migrationManifest",
      label: `${animationId}: ${name} postimage`,
    });
    const exactHistoricalPostimage =
      current.bytes.length === expected.bytes &&
      current.sha256 === expected.sha256;
    if (!exactHistoricalPostimage) {
      const policy = historicalPostimageSuccessorPolicy(config, member);
      invariant(
        policy?.outputNames.includes(name),
        `${animationId}: ${name} no longer matches the receipt postimage`,
      );
      validateHistoricalPostimageSuccessor({
        config,
        member,
        phase: "read-output",
        receipt,
        outputName: name,
        currentOutput: current,
      });
    }
    postOutputs[name] = descriptor(current);
  }
  return {
    receipt,
    binding: descriptor(binding),
    postOutputs,
  };
}

async function readMemberInputs(root, member, config) {
  const workspace = `migrations/${member.animationId}`;
  const entries = await Promise.all(
    Object.entries(memberInputPaths(config)).map(async ([name, suffix]) => [
      name,
      await readBinding(root, `${workspace}/${suffix}`, {
        json: ![
          "briefCandidate",
          "definitionInventory",
          "assetInventory",
          "audioInventory",
          "keyframes",
        ].includes(name),
        label: `${member.animationId}: ${name}`,
      }),
    ]),
  );
  return Object.fromEntries(entries);
}

function assertCanonicalPreimage(
  member,
  candidateReceipt,
  name,
  current,
) {
  const expected = candidateReceipt.canonicalFiles?.[name];
  invariant(
    expected?.path === current.path &&
      expected.bytes === current.bytes.length &&
      expected.sha256 === current.sha256 &&
      expected.changedByMaterializer === false,
    `${member.animationId}: ${name} no longer matches the candidate canonical preimage`,
  );
}

async function preflightMemberOutputs(root, member, config) {
  const paths = outputPaths(member, config);
  validateOutputPathSet(member, paths, config);
  const entries = await Promise.all(
    Object.entries(paths).map(async ([name, relativePath]) => [
      name,
      await readOptionalOutput(
        root,
        relativePath,
        `${member.animationId}: ${name} output`,
      ),
    ]),
  );
  return Object.fromEntries(entries);
}

function assertPriorReceiptOwnership(
  member,
  priorReceipt,
  outputs,
  config,
) {
  if (!priorReceipt) {
    invariant(
      outputs.scriptInventory.bytes === null &&
        outputs.dependencyInventory.bytes === null &&
        outputs.receipt.bytes === null,
      `${member.animationId}: unowned M1 output exists without a receipt`,
    );
    return;
  }
  validateLessonM1StaticReconciliationReceipt(
    priorReceipt,
    member,
    config,
  );
  invariant(
    outputs.receipt.bytes.equals(jsonBytes(priorReceipt)),
    `${member.animationId}: prior M1 receipt is not canonical JSON`,
  );
  for (const name of [
    "migrationManifest",
    "migrationBrief",
    "scriptInventory",
    "dependencyInventory",
  ]) {
    const expected = priorReceipt.outputs[name].after;
    const current = outputs[name];
    const policy = historicalPostimageSuccessorPolicy(config, member);
    if (policy?.outputNames.includes(name)) {
      continue;
    }
    invariant(
      current.bytes !== null &&
        current.bytes.length === expected.bytes &&
        current.sha256 === expected.sha256,
      `${member.animationId}: prior owned output drifted: ${name}`,
    );
  }
}

async function readPostAdoptionInputs(root, member, config) {
  const workspace = `migrations/${member.animationId}`;
  const pathsForMember = memberInputPaths(config);
  const paths = {
    sourceScopeBinding: pathsForMember.sourceScopeBinding,
    machineAudit: pathsForMember.machineAudit,
    assetInventory: pathsForMember.assetInventory,
    audioInventory: pathsForMember.audioInventory,
    keyframes: pathsForMember.keyframes,
    fullFrameCoverage: pathsForMember.fullFrameCoverage,
  };
  const entries = await Promise.all(
    Object.entries(paths).map(async ([name, suffix]) => [
      name,
      await readBinding(root, `${workspace}/${suffix}`, {
        json: ["sourceScopeBinding", "machineAudit", "fullFrameCoverage"].includes(
          name,
        ),
        label: `${member.animationId}: post-adoption ${name}`,
      }),
    ]),
  );
  const fixed = Object.fromEntries(entries);
  const policy = historicalPostimageSuccessorPolicy(config, member);
  const additional = await Promise.all(
    Object.entries(policy?.additionalInputs || {}).map(
      async ([name, descriptor]) => {
        invariant(
          fixed[name] === undefined,
          `${member.animationId}: duplicate post-adoption input name ${name}`,
        );
        const relativePath = descriptor.scope === "workspace"
          ? `${workspace}/${descriptor.path}`
          : descriptor.path;
        return [
          name,
          await readBinding(root, relativePath, {
            json: descriptor.json,
            label: `${member.animationId}: post-adoption ${name}`,
          }),
        ];
      },
    ),
  );
  return {...fixed, ...Object.fromEntries(additional)};
}

function planSummary(items) {
  return {
    memberCount: items.length,
    outputCount: items.length * 5,
    changedOutputCount: items.reduce(
      (sum, item) =>
        sum +
        Object.values(item.outputs).filter(({changed}) => changed).length,
      0,
    ),
    scriptCount: items.reduce(
      (sum, {receipt}) => sum + receipt.summary.scriptCount,
      0,
    ),
    dependencyApiCandidateCount: items.reduce(
      (sum, {receipt}) =>
        sum + receipt.summary.dependencyApiCandidateCount,
      0,
    ),
    dependencyOccurrenceCount: items.reduce(
      (sum, {receipt}) =>
        sum + receipt.summary.dependencyOccurrenceCount,
      0,
    ),
    audioInventoryRowCount: items.reduce(
      (sum, {audioRowCount}) => sum + audioRowCount,
      0,
    ),
    audioRequirementRaiseCount: items.filter(
      ({audioRequirementRaised}) => audioRequirementRaised,
    ).length,
  };
}

export async function buildG5L5M1StaticReconciliationPlan({
  root = defaultProjectRoot,
} = {}) {
  return buildLessonM1StaticReconciliationPlan({
    root,
    config: G5_L5_STATIC_RECONCILIATION_CONFIG,
  });
}

export async function buildLessonM1StaticReconciliationPlan({
  root = defaultProjectRoot,
  config,
} = {}) {
  validateConfig(config);
  const [
    release,
    scope,
    ownerDirectiveValidator,
    generator,
    candidateMaterializer,
    ownerDirectiveBinding,
    reconciliationEngine,
  ] = await Promise.all([
    readBinding(root, config.releasePath, {
      json: true,
      label: `${config.releaseLabel} release catalog`,
    }),
    readBinding(root, config.sourceScopePath, {
      json: true,
      label: `${config.releaseLabel} source-scope freeze`,
    }),
    readBinding(root, config.ownerAuthorizationValidatorPath, {
      label: "Owner authorization validator",
    }),
    readBinding(root, config.generatorPath, {
      label: "M1 static reconciler",
    }),
    readBinding(root, config.candidateMaterializerPath, {
      label: "pre-runtime candidate materializer",
    }),
    readBinding(root, config.ownerAuthorizationPath, {
      json: true,
      label: "Owner authorization",
    }),
    config.reconciliationEnginePath
      ? readBinding(root, config.reconciliationEnginePath, {
          label: "M1 static reconciliation engine",
        })
      : Promise.resolve(null),
  ]);
  const selectedRelease = selectRelease(release.value, config);
  const scopeMembers = selectScopeMembers(
    scope.value,
    selectedRelease,
    config,
  );
  config.validateOwnerAuthorization(
    ownerDirectiveBinding.value,
    ownerDirectiveBinding,
  );
  const ownerDirective = {
    receipt: ownerDirectiveBinding.value,
    binding: ownerDirectiveBinding,
    fingerprintSha256: config.ownerAuthorizationFingerprint(
      ownerDirectiveBinding.value,
      ownerDirectiveBinding,
    ),
    m1MachineOnlyEffective: config.ownerM1MachineOnlyEffective(
      ownerDirectiveBinding.value,
    ),
  };
  invariant(
    isSha256(ownerDirective.fingerprintSha256) &&
      ownerDirective.m1MachineOnlyEffective === true,
    "Owner authorization does not establish machine-only M1 authority",
  );

  const globalInputs = {
    release,
    scope,
    ownerDirectiveValidator,
    generator,
    candidateMaterializer,
    ownerDirectiveReceipt: ownerDirectiveBinding,
    ...(reconciliationEngine
      ? {reconciliationEngine}
      : {}),
  };
  const outputSnapshots = new Map();
  for (const member of selectedRelease.members) {
    outputSnapshots.set(
      member.animationId,
      await preflightMemberOutputs(root, member, config),
    );
  }
  const receiptCount = [...outputSnapshots.values()].filter(
    ({receipt}) => receipt.bytes !== null,
  ).length;
  invariant(
    receiptCount === 0 || receiptCount === config.memberCount,
    `${config.releaseLabel} M1 receipt set is partial (${receiptCount}/${config.memberCount}); refuse mixed pre/post-adoption state`,
  );

  if (receiptCount === config.memberCount) {
    const adoptedItems = [];
    for (const member of selectedRelease.members) {
      const outputs = outputSnapshots.get(member.animationId);
      let receipt;
      try {
        receipt = JSON.parse(outputs.receipt.bytes.toString("utf8"));
      } catch (error) {
        throw new Error(
          `${member.animationId}: invalid M1 receipt JSON (${error.message})`,
        );
      }
      assertPriorReceiptOwnership(member, receipt, outputs, config);
      assertDescriptor(
        receipt.ownerDirective,
        ownerDirectiveBinding,
        `${member.animationId}: current Owner directive`,
      );
      invariant(
        receipt.ownerDirective.receiptFingerprintSha256 ===
          ownerDirective.fingerprintSha256,
        `${member.animationId}: Owner authorization fingerprint drifted`,
      );
      const currentGlobalBindings = [
        ["releaseCatalog", release, "release catalog"],
        ["sourceScopeFreeze", scope, "source-scope freeze"],
        [
          "ownerDirectiveValidator",
          ownerDirectiveValidator,
          "Owner directive validator",
        ],
        ["generator", generator, "M1 reconciler"],
        [
          "candidateMaterializer",
          candidateMaterializer,
          "candidate materializer",
        ],
        ...(reconciliationEngine
          ? [
              [
                "reconciliationEngine",
                reconciliationEngine,
                "M1 reconciliation engine",
              ],
            ]
          : []),
      ];
      for (const [receiptKey, current, label] of currentGlobalBindings) {
        const historicalGlobalInputKeys = new Set([
          ...(config.preserveHistoricalGeneratorBindingAfterAdoption ===
          true
            ? ["generator"]
            : []),
          ...(config
            .preserveHistoricalGlobalInputBindingsAfterAdoption || []),
        ]);
        if (historicalGlobalInputKeys.has(receiptKey)) {
          continue;
        }
        assertDescriptor(
          receipt.inputs?.[receiptKey],
          current,
          `${member.animationId}: ${label}`,
        );
      }
      const inputs = await readPostAdoptionInputs(root, member, config);
      for (const [receiptKey, inputKey] of [
        ["sourceScopeBinding", "sourceScopeBinding"],
        ["machineAudit", "machineAudit"],
        ["canonicalAssetInventory", "assetInventory"],
        ["canonicalAudioInventory", "audioInventory"],
        ["canonicalKeyframes", "keyframes"],
        ["canonicalCoverage", "fullFrameCoverage"],
      ]) {
        const policy = historicalPostimageSuccessorPolicy(config, member);
        if (policy?.inputNames.includes(receiptKey)) {
          continue;
        }
        assertDescriptor(
          receipt.inputs?.[receiptKey],
          inputs[inputKey],
          `${member.animationId}: post-adoption ${receiptKey}`,
        );
      }
      if (historicalPostimageSuccessorPolicy(config, member)) {
        validateHistoricalPostimageSuccessor({
          config,
          member,
          phase: "adopted-state",
          receipt,
          outputs,
          inputs,
        });
      }
      const scopeMember = scopeMembers.get(member.animationId);
      invariant(
        inputs.sourceScopeBinding.value?.member?.animationId ===
          member.animationId &&
          inputs.sourceScopeBinding.value?.member?.assetId === member.assetId &&
          inputs.sourceScopeBinding.value?.member?.source?.swf?.sha256 ===
            scopeMember.source.swf.sha256,
        `${member.animationId}: post-adoption source-scope binding drifted`,
      );
      const audioRowCount = countCsvDataRows(
        inputs.audioInventory.bytes,
        `${member.animationId}: audio inventory`,
      );
      for (const output of Object.values(outputs)) {
        output.desiredBytes = output.bytes;
        output.changed = false;
      }
      adoptedItems.push({
        member,
        inputs,
        outputs,
        audioRowCount,
        audioRequirementRaised:
          receipt.reconciliation.audioRequirementRaised,
        receipt,
      });
    }
    return {
      root,
      release: selectedRelease,
      ownerDirective: ownerDirective.receipt,
      items: adoptedItems,
      guards: [
        ...Object.values(globalInputs).map(({guard}) => guard),
        ...adoptedItems.flatMap(({inputs}) =>
          Object.values(inputs).map(({guard}) => guard),
        ),
      ],
      summary: planSummary(adoptedItems),
    };
  }

  const items = [];
  for (const member of selectedRelease.members) {
    const scopeMember = scopeMembers.get(member.animationId);
    const inputs = await readMemberInputs(root, member, config);
    const staticInputs = validateStaticInputs({
      member,
      scopeMember,
      inputs,
      releaseBinding: release,
      scopeBinding: scope,
      config,
    });
    const currentOutputs = outputSnapshots.get(member.animationId);
    const priorReceipt = null;
    assertPriorReceiptOwnership(
      member,
      priorReceipt,
      currentOutputs,
      config,
    );

    if (!priorReceipt) {
      assertCanonicalPreimage(
        member,
        staticInputs.candidateReceipt,
        "migrationManifest",
        currentOutputs.migrationManifest,
      );
      assertCanonicalPreimage(
        member,
        staticInputs.candidateReceipt,
        "migrationBrief",
        currentOutputs.migrationBrief,
      );
    }
    const audioRowCount = countCsvDataRows(
      inputs.audioInventory.bytes,
      `${member.animationId}: audio inventory`,
    );
    const currentManifest = JSON.parse(
      currentOutputs.migrationManifest.bytes.toString("utf8"),
    );
    const reconciled = reconcileManifest({
      member,
      current: currentManifest,
      runtimeFacts: staticInputs.runtimeFacts,
      scriptCandidate: staticInputs.scriptCandidate,
      audioRowCount,
      config,
    });
    const effectiveAudioRequirementRaised =
      priorReceipt?.reconciliation.audioRequirementRaised ??
      reconciled.audioRequirementRaised;
    const canonicalScript = buildCanonicalScriptInventory({
      member,
      candidate: staticInputs.scriptCandidate,
      candidateBinding: inputs.scriptCandidate,
      ownerDirective: {
        receipt: ownerDirective.receipt,
        binding: ownerDirectiveBinding,
        fingerprintSha256: ownerDirective.fingerprintSha256,
      },
      generator,
      config,
    });
    const canonicalDependency = buildCanonicalDependencyInventory({
      member,
      candidate: staticInputs.dependencyCandidate,
      candidateBinding: inputs.dependencyCandidate,
      ownerDirective: {
        receipt: ownerDirective.receipt,
        binding: ownerDirectiveBinding,
        fingerprintSha256: ownerDirective.fingerprintSha256,
      },
      generator,
      config,
    });
    const brief = buildBrief({
      member,
      scopeMember,
      runtimeFacts: staticInputs.runtimeFacts,
      scriptCandidate: staticInputs.scriptCandidate,
      dependencyCandidate: staticInputs.dependencyCandidate,
      audioRowCount,
      audioRequirementRaised: effectiveAudioRequirementRaised,
      ownerDirective,
      config,
    });
    const desired = {
      migrationManifest: manifestBytes(reconciled.desired),
      migrationBrief: reconcileBrief(
        currentOutputs.migrationBrief.bytes,
        brief,
        config,
      ),
      scriptInventory: jsonBytes(canonicalScript),
      dependencyInventory: jsonBytes(canonicalDependency),
    };
    for (const [name, desiredBytes] of Object.entries(desired)) {
      currentOutputs[name].desiredBytes = desiredBytes;
    }
    const receipt = buildReceipt({
      member,
      audioRequirementRaised: effectiveAudioRequirementRaised,
      scriptCandidate: staticInputs.scriptCandidate,
      dependencyCandidate: staticInputs.dependencyCandidate,
      ownerDirective: {
        receipt: ownerDirective.receipt,
        binding: ownerDirectiveBinding,
        fingerprintSha256: ownerDirective.fingerprintSha256,
        m1MachineOnlyEffective:
          ownerDirective.m1MachineOnlyEffective,
      },
      globalInputs,
      inputs,
      outputs: currentOutputs,
      priorReceipt,
      config,
    });
    validateLessonM1StaticReconciliationReceipt(
      receipt,
      member,
      config,
    );
    currentOutputs.receipt.desiredBytes = jsonBytes(receipt);

    if (priorReceipt) {
      invariant(
        currentOutputs.receipt.desiredBytes.equals(
          currentOutputs.receipt.bytes,
        ),
        `${member.animationId}: current M1 receipt no longer reproduces exactly`,
      );
    }
    for (const output of Object.values(currentOutputs)) {
      output.changed =
        output.bytes === null || !output.bytes.equals(output.desiredBytes);
    }
    items.push({
      member,
      inputs,
      outputs: currentOutputs,
      audioRowCount,
      audioRequirementRaised: effectiveAudioRequirementRaised,
      receipt,
    });
  }

  const guards = [
    ...Object.values(globalInputs).map(({guard}) => guard),
    ...items.flatMap(({inputs}) =>
      Object.values(inputs).map(({guard}) => guard),
    ),
  ];
  return {
    root,
    transactionTag: config.releaseId,
    release: selectedRelease,
    ownerDirective: ownerDirective.receipt,
    items,
    guards,
    summary: planSummary(items),
  };
}

async function verifyAllGuards(root, guards) {
  for (const guard of guards) {
    await verifyGuard(root, guard);
  }
}

async function stageOutput(root, output) {
  await verifyGuard(root, output.guard, `${output.path}: output CAS`);
  const parent = path.dirname(output.absolutePath);
  const temporaryPath = path.join(
    parent,
    `.${path.basename(output.absolutePath)}.lesson-m1.${randomUUID()}.tmp`,
  );
  const desiredMode = output.guard.identity
    ? output.guard.identity.mode & 0o777
    : 0o644;
  const handle = await open(temporaryPath, "wx", desiredMode);
  output.temporaryPath = temporaryPath;
  try {
    await handle.writeFile(output.desiredBytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  const staged = await lstat(temporaryPath);
  invariant(
    staged.isFile() &&
      !staged.isSymbolicLink() &&
      staged.nlink === 1 &&
      staged.size === output.desiredBytes.length,
    `${output.path}: staged output is not one ordinary single-link file`,
  );
}

async function cleanupStage(output) {
  if (!output.temporaryPath) return;
  try {
    const info = await lstat(output.temporaryPath);
    if (info.isFile() && !info.isSymbolicLink() && info.nlink === 1) {
      await unlink(output.temporaryPath);
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  output.temporaryPath = null;
}

async function restoreOutput(root, output) {
  const current = await readOptionalOutput(
    root,
    output.path,
    `${output.path}: rollback`,
  );
  invariant(
    current.bytes !== null &&
      current.sha256 === sha256(output.desiredBytes),
    `${output.path}: rollback refused to overwrite foreign drift`,
  );
  if (output.bytes === null) {
    await unlink(output.absolutePath);
    return;
  }
  const parent = path.dirname(output.absolutePath);
  const temporaryPath = path.join(
    parent,
    `.${path.basename(output.absolutePath)}.lesson-m1.rollback.${randomUUID()}.tmp`,
  );
  let handle = null;
  try {
    handle = await open(
      temporaryPath,
      "wx",
      output.guard.identity.mode & 0o777,
    );
    await handle.writeFile(output.bytes);
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(temporaryPath, output.absolutePath);
  } catch (error) {
    await handle?.close().catch(() => {});
    await unlink(temporaryPath).catch(() => {});
    throw error;
  }
  const restored = await readBinding(root, output.path, {
    label: `${output.path}: restored output`,
  });
  invariant(
    restored.sha256 === output.sha256 &&
      (restored.guard.identity.mode & 0o777) ===
        (output.guard.identity.mode & 0o777),
    `${output.path}: rollback preimage hash mismatch`,
  );
}

async function writeTransaction(
  plan,
  {transactionHooks = {}} = {},
) {
  const changed = plan.items.flatMap(({member, outputs}) =>
    Object.entries(outputs)
      .filter(([, output]) => output.changed)
      .map(([name, output]) => ({member, name, output})),
  );
  const ordered = [
    ...changed.filter(({name}) => name !== "receipt"),
    ...changed.filter(({name}) => name === "receipt"),
  ];
  const committed = [];
  try {
    for (const {output} of ordered) await stageOutput(plan.root, output);
    await verifyAllGuards(plan.root, plan.guards);
    if (transactionHooks.afterStage) {
      await transactionHooks.afterStage({plan, ordered});
    }
    for (let index = 0; index < ordered.length; index += 1) {
      const item = ordered[index];
      await verifyGuard(
        plan.root,
        item.output.guard,
        `${item.output.path}: pre-commit CAS`,
      );
      await rename(item.output.temporaryPath, item.output.absolutePath);
      item.output.temporaryPath = null;
      committed.push(item.output);
      if (transactionHooks.afterCommit) {
        await transactionHooks.afterCommit({
          index,
          member: item.member,
          name: item.name,
          output: item.output,
        });
      }
    }
    await verifyAllGuards(plan.root, plan.guards);
    for (const {output} of ordered) {
      const current = await readBinding(plan.root, output.path, {
        label: `${output.path}: post-commit`,
      });
      invariant(
        current.bytes.equals(output.desiredBytes),
        `${output.path}: post-commit bytes differ`,
      );
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const output of [...committed].reverse()) {
      try {
        await restoreOutput(plan.root, output);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    for (const {output} of ordered) {
      try {
        await cleanupStage(output);
      } catch (cleanupError) {
        rollbackErrors.push(cleanupError);
      }
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        `M1 static reconciliation failed and rollback was incomplete: ${error.message}`,
      );
    }
    throw error;
  }
}

export async function adoptG5L5M1StaticSpecification({
  root = defaultProjectRoot,
  mode = "dry-run",
  transactionHooks = {},
} = {}) {
  return adoptLessonM1StaticSpecification({
    root,
    mode,
    transactionHooks,
    config: G5_L5_STATIC_RECONCILIATION_CONFIG,
  });
}

export async function adoptLessonM1StaticSpecification({
  root = defaultProjectRoot,
  mode = "dry-run",
  transactionHooks = {},
  config,
} = {}) {
  validateConfig(config);
  invariant(
    new Set(["dry-run", "check", "apply"]).has(mode),
    `unsupported mode: ${mode}`,
  );
  const plan = await buildLessonM1StaticReconciliationPlan({
    root,
    config,
  });
  invariant(
    plan.items.length === config.memberCount &&
      plan.summary.outputCount === config.memberCount * 5,
    `M1 reconciliation must cover all ${config.memberCount} members and ${config.memberCount * 5} owned outputs`,
  );
  if (mode === "check") {
    invariant(
      plan.summary.changedOutputCount === 0,
      `M1 static reconciliation is not current (${plan.summary.changedOutputCount} outputs differ)`,
    );
  } else if (mode === "apply") {
    await writeTransaction(plan, {transactionHooks});
  }
  return {
    mode,
    releaseId: config.releaseId,
    ...plan.summary,
    applied:
      mode === "apply" && plan.summary.changedOutputCount > 0,
    acceptanceEffects: structuredClone(ACCEPTANCE_EFFECTS),
  };
}

export function parseArguments(argv) {
  invariant(Array.isArray(argv), "arguments must be an array");
  let mode = "dry-run";
  let explicitMode = null;
  let help = false;
  for (const argument of argv) {
    if (argument === "--help" || argument === "-h") {
      invariant(!help, "help option may be supplied only once");
      help = true;
      continue;
    }
    const candidate =
      argument === "--dry-run"
        ? "dry-run"
        : argument === "--check"
          ? "check"
          : argument === "--apply"
            ? "apply"
            : null;
    invariant(candidate, `unknown argument: ${argument}`);
    invariant(
      explicitMode === null,
      "choose exactly one of --dry-run, --check, or --apply",
    );
    explicitMode = candidate;
    mode = candidate;
  }
  invariant(
    !help || explicitMode === null,
    "--help cannot be combined with an execution mode",
  );
  return {mode, help};
}

function usage() {
  return `Usage:
  node scripts/adopt-g5-l5-m1-static-specification.mjs --dry-run
  node scripts/adopt-g5-l5-m1-static-specification.mjs --check
  node scripts/adopt-g5-l5-m1-static-specification.mjs --apply

Default mode is --dry-run. --apply is the only mutating mode and operates
transactionally across all 57 G5 L5 members. No mode launches a GUI, runtime,
renderer, or legacy endpoint.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = await adoptG5L5M1StaticSpecification({
    mode: options.mode,
  });
  process.stdout.write(stableJson(result));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
