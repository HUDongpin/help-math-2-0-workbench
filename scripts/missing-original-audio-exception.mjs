#!/usr/bin/env node

import {createHash} from "node:crypto";
import {access, lstat, mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {
  CANONICAL_PROJECTION_ENCODING,
  TECHNICAL_MANIFEST_PROJECTION,
  projectionSha256,
  technicalManifestSha256,
} from "./evidence-projections.mjs";

export const MISSING_ORIGINAL_AUDIO_EXCEPTION_SCHEMA_VERSION = 1;
export const MISSING_ORIGINAL_AUDIO_EXCEPTION_RELATIVE_PATH = "evidence/missing-original-audio-exception.json";
export const MISSING_ORIGINAL_AUDIO_EXCEPTION_SCOPE = "exact-preserved-original-audio-source-absence-only";
export const MISSING_ORIGINAL_AUDIO_EXCEPTION_ATTESTATION =
  "I am a named human owner or owner delegate. I accept only that the exact listed intended original audio sources are absent from the preserved archive. This does not accept synthesized or replacement audio as original and does not attest listening, language or content, host traversal, timing, synchronization, behavioral parity, or migration completion.";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const ISO_TIMESTAMP_WITH_TIMEZONE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
const AUTOMATION_IDENTITY_PATTERN =
  /(?:codex|openai|\bai\s*agent\b|github\s*actions?|\bci\b|\bsystem\b|script|automat|generator|machine|robot|\bbot\b|自动|机器人|系统)/i;
const CLAIM_FIELDS = Object.freeze([
  "acceptsOnlyOriginalSourceAbsence",
  "originalAudioListeningAccepted",
  "languageOrContentAccepted",
  "hostTraversalAccepted",
  "timingOrSynchronizationAccepted",
  "replacementAudioAcceptedAsOriginal",
  "behavioralParityAccepted",
  "migrationCompletionAccepted",
]);
const HOST_ROUTING_PROJECTION_ID = "missing-original-audio-host-routing-v1";
const MISSING_CUE_PROJECTION_ID = "missing-original-audio-cues-v1";

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function isObjectRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function requireExactKeys(value, expected, label, errors) {
  if (!isObjectRecord(value)) {
    errors.push(`${label} must be an object with exactly the contract fields.`);
    return false;
  }
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (canonicalJson(actual) !== canonicalJson(wanted)) {
    errors.push(`${label} contains missing or extra fields.`);
    return false;
  }
  return true;
}

function safeRelativePath(value) {
  if (
    typeof value !== "string" ||
    !value ||
    path.isAbsolute(value) ||
    value.includes("\\") ||
    value.includes("\0")
  ) return false;
  const normalized = portable(path.normalize(value));
  return normalized === value && normalized !== ".." && !normalized.startsWith("../");
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve a regular file while rejecting every symlink component. Evidence
 * bindings deliberately use a stricter rule than ordinary file reads so a
 * later symlink retarget cannot silently change the authority boundary.
 */
async function resolveNonSymlinkFile(base, declared) {
  if (!safeRelativePath(declared)) return null;
  const resolvedBase = path.resolve(base);
  const baseStats = await lstat(resolvedBase).catch(() => null);
  if (!baseStats?.isDirectory() || baseStats.isSymbolicLink()) return null;
  const candidate = path.resolve(resolvedBase, declared);
  const relative = path.relative(resolvedBase, candidate);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return null;

  let cursor = resolvedBase;
  for (const component of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    let stats;
    try {
      stats = await lstat(cursor);
    } catch {
      return null;
    }
    if (stats.isSymbolicLink()) return null;
  }
  const stats = await lstat(candidate).catch(() => null);
  return stats?.isFile() ? candidate : null;
}

/**
 * Prove that an intended source path is absent without following symlinks.
 * Missing parents are acceptable; an existing leaf or any symlink component
 * fails closed.
 */
async function inspectAbsentNonSymlinkPath(root, declared) {
  if (!safeRelativePath(declared)) return {valid: false, absent: false, reason: "unsafe-path"};
  const resolvedRoot = path.resolve(root);
  const rootStats = await lstat(resolvedRoot).catch(() => null);
  if (!rootStats?.isDirectory() || rootStats.isSymbolicLink()) {
    return {valid: false, absent: false, reason: "unsafe-root"};
  }
  const candidate = path.resolve(resolvedRoot, declared);
  const relative = path.relative(resolvedRoot, candidate);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    return {valid: false, absent: false, reason: "path-escape"};
  }
  let cursor = resolvedRoot;
  for (const component of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    let stats;
    try {
      stats = await lstat(cursor);
    } catch (error) {
      if (error.code === "ENOENT") return {valid: true, absent: true, reason: "missing"};
      return {valid: false, absent: false, reason: error.message};
    }
    if (stats.isSymbolicLink()) return {valid: false, absent: false, reason: "symlink-component"};
  }
  return {valid: true, absent: false, reason: "path-exists"};
}

function routeConventionId(manifest, item) {
  const sourceFile = item?.sourceFile || "";
  if (manifest.classification?.collection === "keyterm" || sourceFile.includes("/HELP_KEYTERMS/")) return "keyterm";
  if (
    manifest.classification?.collection === "formula" ||
    sourceFile.includes("/HELP_FORMULAS/") ||
    sourceFile.includes("/FORMULAS/")
  ) return "formula";
  if (manifest.classification?.section === "FQ" || sourceFile.includes("/FQ/") || item?.cueKind) return "finalQuiz";
  if (item?.language === "es" && sourceFile.includes("/HELP_COURSES/")) return "courseSpanishPage";
  return null;
}

function hostRoutingProjection(audit) {
  const host = audit?.authority?.hostScript;
  const conventions = Object.entries(host?.conventions || {})
    .filter(([, value]) => value?.verified === true)
    .map(([id, value]) => ({
      id,
      evidenceScript: value.evidenceScript,
      finding: value.finding,
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  const identity = {
    sourceHost: {
      file: host?.sourceFile,
      sha256: host?.sha256,
    },
    combinedAudioRelevantScriptsSha256: host?.combinedAudioRelevantScriptsSha256,
    conventions,
  };
  return {
    hashMode: CANONICAL_PROJECTION_ENCODING,
    projection: HOST_ROUTING_PROJECTION_ID,
    sha256: projectionSha256({projection: HOST_ROUTING_PROJECTION_ID, ...identity}),
    ...identity,
  };
}

function missingCueProjection(missingCues) {
  return {
    hashMode: CANONICAL_PROJECTION_ENCODING,
    projection: MISSING_CUE_PROJECTION_ID,
    sha256: projectionSha256({
      projection: MISSING_CUE_PROJECTION_ID,
      missingCues,
    }),
  };
}

function expectedMissingCues(manifest, audit, errors = []) {
  const missing = Array.isArray(audit?.externalAudio?.expectedButMissing)
    ? audit.externalAudio.expectedButMissing
    : [];
  const conventions = new Set(
    Object.entries(audit?.authority?.hostScript?.conventions || {})
      .filter(([, value]) => value?.verified === true)
      .map(([id]) => id)
  );
  const identities = new Set();
  const cueIds = new Set();
  const projected = [];
  for (const [index, item] of missing.entries()) {
    const label = `Machine audio audit expectedButMissing[${index}]`;
    const hasExpectedPathId = item?.expectedPathId !== undefined && item?.expectedPathId !== null;
    if (
      !isObjectRecord(item) ||
      !safeRelativePath(item.sourceFile) ||
      !["en", "es"].includes(item.language) ||
      (hasExpectedPathId && (typeof item.expectedPathId !== "string" || !item.expectedPathId.trim())) ||
      (item.cueKind !== undefined && item.cueKind !== null &&
        (typeof item.cueKind !== "string" || !item.cueKind.trim())) ||
      (item.questionNumber !== undefined && item.questionNumber !== null &&
        (!Number.isSafeInteger(item.questionNumber) || item.questionNumber < 1)) ||
      (item.option !== undefined && item.option !== null &&
        (typeof item.option !== "string" || !item.option.trim())) ||
      item.status !== "missing-source" ||
      typeof item.evidence !== "string" ||
      !item.evidence.trim()
    ) {
      errors.push(`${label} does not identify a safe exact missing source path, language, status, and machine rationale.`);
      continue;
    }
    const routingConventionId = routeConventionId(manifest, item);
    if (!routingConventionId || !conventions.has(routingConventionId)) {
      errors.push(`${label} cannot be tied to a verified host-routing convention.`);
      continue;
    }
    const cueId = item.expectedPathId || `path:${item.language}:${item.sourceFile}`;
    if (cueIds.has(cueId)) {
      errors.push(`${label} duplicates missing cueId ${cueId}.`);
      continue;
    }
    cueIds.add(cueId);
    const identity = `${cueId}\0${item.language}\0${item.sourceFile}`;
    if (identities.has(identity)) {
      errors.push(`${label} duplicates another missing cue identity.`);
      continue;
    }
    identities.add(identity);
    projected.push({
      cueId,
      machineExpectedPathId: item.expectedPathId || null,
      sourceFile: item.sourceFile,
      language: item.language,
      cueKind: item.cueKind || null,
      questionNumber: Number.isSafeInteger(item.questionNumber) ? item.questionNumber : null,
      option: typeof item.option === "string" && item.option ? item.option : null,
      status: "missing-source",
      routingConventionId,
      machineEvidence: item.evidence,
      replacement: {
        disposition: "none",
        acceptedAsOriginal: false,
      },
    });
  }
  return projected.sort((left, right) =>
    `${left.cueId}\0${left.language}\0${left.sourceFile}`.localeCompare(
      `${right.cueId}\0${right.language}\0${right.sourceFile}`
    )
  );
}

function recordShapeErrors(record) {
  const errors = [];
  if (!requireExactKeys(record, [
    "schemaVersion",
    "evidenceType",
    "animationId",
    "status",
    "scope",
    "bindings",
    "missingCues",
    "claims",
    "review",
  ], "Missing-original-audio exception", errors)) return errors;

  if (requireExactKeys(record.bindings, [
    "migrationManifest",
    "sourceSwf",
    "machineAudioAudit",
    "hostRoutingEvidence",
    "missingCueEvidence",
  ], "Missing-original-audio exception bindings", errors)) {
    for (const name of ["sourceSwf", "machineAudioAudit"]) {
      requireExactKeys(
        record.bindings[name],
        ["file", "sha256"],
        `Missing-original-audio exception bindings.${name}`,
        errors
      );
    }
    requireExactKeys(
      record.bindings.migrationManifest,
      ["path", "hashMode", "projection", "excludedPaths", "sha256"],
      "Missing-original-audio exception bindings.migrationManifest",
      errors
    );
    requireExactKeys(
      record.bindings.missingCueEvidence,
      ["hashMode", "projection", "sha256"],
      "Missing-original-audio exception bindings.missingCueEvidence",
      errors
    );
    const routing = record.bindings.hostRoutingEvidence;
    if (requireExactKeys(
      routing,
      [
        "hashMode",
        "projection",
        "sha256",
        "sourceHost",
        "combinedAudioRelevantScriptsSha256",
        "conventions",
      ],
      "Missing-original-audio exception bindings.hostRoutingEvidence",
      errors
    )) {
      requireExactKeys(
        routing.sourceHost,
        ["file", "sha256"],
        "Missing-original-audio exception bindings.hostRoutingEvidence.sourceHost",
        errors
      );
      if (Array.isArray(routing.conventions)) {
        for (const [index, convention] of routing.conventions.entries()) {
          requireExactKeys(
            convention,
            ["id", "evidenceScript", "finding"],
            `Missing-original-audio exception bindings.hostRoutingEvidence.conventions[${index}]`,
            errors
          );
        }
      } else {
        errors.push("Missing-original-audio exception host-routing conventions must be an array.");
      }
    }
  }

  if (!Array.isArray(record.missingCues)) {
    errors.push("Missing-original-audio exception missingCues must be an array.");
  } else {
    for (const [index, cue] of record.missingCues.entries()) {
      const label = `Missing-original-audio exception missingCues[${index}]`;
      if (requireExactKeys(cue, [
        "cueId",
        "machineExpectedPathId",
        "sourceFile",
        "language",
        "cueKind",
        "questionNumber",
        "option",
        "status",
        "routingConventionId",
        "machineEvidence",
        "replacement",
      ], label, errors)) {
        requireExactKeys(cue.replacement, ["disposition", "acceptedAsOriginal"], `${label}.replacement`, errors);
      }
    }
  }

  requireExactKeys(record.claims, CLAIM_FIELDS, "Missing-original-audio exception claims", errors);
  if (requireExactKeys(
    record.review,
    ["decision", "reviewer", "attestation", "signedAt", "notes"],
    "Missing-original-audio exception review",
    errors
  )) {
    requireExactKeys(
      record.review.reviewer,
      ["kind", "authority", "fullName", "role", "organizationOrOwnerId", "contact"],
      "Missing-original-audio exception review.reviewer",
      errors
    );
  }
  return errors;
}

async function readWorkspaceInputs({projectRoot, workspace}) {
  const manifestPath = await resolveNonSymlinkFile(workspace, "migration.json");
  const auditPath = await resolveNonSymlinkFile(workspace, "audit/audio-runtime-evidence.json");
  if (!manifestPath || !auditPath) {
    throw new Error("migration/audio evidence path is missing, escaping, or contains a symlink");
  }
  const [manifestBytes, auditBytes] = await Promise.all([readFile(manifestPath), readFile(auditPath)]);
  return {
    manifestBytes,
    auditBytes,
    manifest: JSON.parse(manifestBytes.toString("utf8")),
    audit: JSON.parse(auditBytes.toString("utf8")),
    projectRoot,
    workspace,
  };
}

async function machinePrerequisiteErrors({projectRoot, workspace, manifest, audit}) {
  const errors = [];
  if (!manifest?.animationId || audit?.animationId !== manifest.animationId) {
    errors.push("Machine audio audit animationId differs from migration.json.");
  }
  if (
    !safeRelativePath(manifest?.source?.swf) ||
    !SHA256_PATTERN.test(manifest?.source?.swfSha256 || "")
  ) {
    errors.push("migration.json source SWF path/hash is malformed.");
  } else {
    const sourcePath = await resolveNonSymlinkFile(projectRoot, manifest.source.swf);
    if (!sourcePath) errors.push("Source SWF path is missing, escaping, or contains a symlink.");
    else if (digest(await readFile(sourcePath)) !== manifest.source.swfSha256) {
      errors.push("Source SWF hash differs from migration.json.");
    }
  }
  if (
    audit?.source?.swf !== manifest?.source?.swf ||
    audit?.source?.expectedSha256 !== manifest?.source?.swfSha256 ||
    audit?.source?.observedSha256 !== manifest?.source?.swfSha256 ||
    audit?.source?.hashMatches !== true
  ) {
    errors.push("Machine audio audit does not bind the current source SWF identity.");
  }
  if (audit?.acceptance?.structurallyAudited !== true) {
    errors.push("Machine audio audit is not structurally audited.");
  }

  const routing = hostRoutingProjection(audit);
  if (
    routing.hashMode !== CANONICAL_PROJECTION_ENCODING ||
    routing.projection !== HOST_ROUTING_PROJECTION_ID ||
    !SHA256_PATTERN.test(routing.sha256 || "") ||
    !safeRelativePath(routing.sourceHost.file) ||
    !SHA256_PATTERN.test(routing.sourceHost.sha256 || "") ||
    !SHA256_PATTERN.test(routing.combinedAudioRelevantScriptsSha256 || "") ||
    !routing.conventions.length ||
    routing.conventions.some((item) =>
      typeof item.id !== "string" ||
      !item.id ||
      typeof item.evidenceScript !== "string" ||
      !item.evidenceScript ||
      typeof item.finding !== "string" ||
      !item.finding
    )
  ) {
    errors.push("Machine audio audit host-routing evidence is incomplete or malformed.");
  } else {
    const hostPath = await resolveNonSymlinkFile(projectRoot, routing.sourceHost.file);
    if (!hostPath) errors.push("Host-routing source path is missing, escaping, or contains a symlink.");
    else if (digest(await readFile(hostPath)) !== routing.sourceHost.sha256) {
      errors.push("Host-routing source hash is stale.");
    }
  }

  const missing = expectedMissingCues(manifest, audit, errors);
  const declaredCount = audit?.externalAudio?.missingExpectedCount;
  const rawCount = Array.isArray(audit?.externalAudio?.expectedButMissing)
    ? audit.externalAudio.expectedButMissing.length
    : -1;
  if (!Number.isSafeInteger(declaredCount) || declaredCount <= 0 || declaredCount !== rawCount || missing.length !== rawCount) {
    errors.push("Machine audio audit missing-source count is empty, inconsistent, or not fully projectable.");
  }
  const exactPaths = new Set((audit?.externalAudio?.exactAssociations || []).map((item) => item?.sourceFile));
  for (const cue of missing) {
    if (exactPaths.has(cue.sourceFile)) {
      errors.push(`Missing cue is also listed as an exact existing association (${cue.sourceFile}).`);
    }
    const absence = await inspectAbsentNonSymlinkPath(projectRoot, cue.sourceFile);
    if (!absence.valid) {
      errors.push(`Intended missing source path is unsafe or contains a symlink (${cue.sourceFile}).`);
    } else if (!absence.absent) {
      errors.push(`Intended missing source path now exists (${cue.sourceFile}).`);
    }
  }
  return {errors, missing, routing, missingCueEvidence: missingCueProjection(missing)};
}

export async function buildMissingOriginalAudioExceptionTemplate({
  projectRoot = defaultProjectRoot,
  workspace,
}) {
  const inputs = await readWorkspaceInputs({projectRoot, workspace});
  const prerequisites = await machinePrerequisiteErrors(inputs);
  if (prerequisites.errors.length) {
    throw new Error(`Cannot scaffold missing-original-audio exception. ${prerequisites.errors.join(" ")}`);
  }
  return {
    schemaVersion: MISSING_ORIGINAL_AUDIO_EXCEPTION_SCHEMA_VERSION,
    evidenceType: "missing-original-audio-absence-exception",
    animationId: inputs.manifest.animationId,
    status: "pending",
    scope: MISSING_ORIGINAL_AUDIO_EXCEPTION_SCOPE,
    bindings: {
      migrationManifest: {
        path: "migration.json",
        hashMode: CANONICAL_PROJECTION_ENCODING,
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
        sha256: technicalManifestSha256(inputs.manifest),
      },
      sourceSwf: {file: inputs.manifest.source.swf, sha256: inputs.manifest.source.swfSha256},
      machineAudioAudit: {file: "audit/audio-runtime-evidence.json", sha256: digest(inputs.auditBytes)},
      hostRoutingEvidence: prerequisites.routing,
      missingCueEvidence: prerequisites.missingCueEvidence,
    },
    missingCues: prerequisites.missing,
    claims: {
      acceptsOnlyOriginalSourceAbsence: false,
      originalAudioListeningAccepted: false,
      languageOrContentAccepted: false,
      hostTraversalAccepted: false,
      timingOrSynchronizationAccepted: false,
      replacementAudioAcceptedAsOriginal: false,
      behavioralParityAccepted: false,
      migrationCompletionAccepted: false,
    },
    review: {
      decision: "pending",
      reviewer: {
        kind: "human",
        authority: "owner",
        fullName: "",
        role: "",
        organizationOrOwnerId: "",
        contact: "",
      },
      attestation: MISSING_ORIGINAL_AUDIO_EXCEPTION_ATTESTATION,
      signedAt: "",
      notes: "",
    },
  };
}

export async function scaffoldMissingOriginalAudioException({
  projectRoot = defaultProjectRoot,
  workspace,
}) {
  const output = path.join(workspace, MISSING_ORIGINAL_AUDIO_EXCEPTION_RELATIVE_PATH);
  if (await exists(output)) {
    throw new Error(`${portable(path.relative(projectRoot, output))} already exists; never overwrite an owner review record`);
  }
  const record = await buildMissingOriginalAudioExceptionTemplate({projectRoot, workspace});
  const evidenceDirectory = path.dirname(output);
  let evidenceDirectoryStats = await lstat(evidenceDirectory).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!evidenceDirectoryStats) {
    try {
      await mkdir(evidenceDirectory);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
    evidenceDirectoryStats = await lstat(evidenceDirectory).catch(() => null);
  }
  if (!evidenceDirectoryStats?.isDirectory() || evidenceDirectoryStats.isSymbolicLink()) {
    throw new Error(`${portable(path.relative(projectRoot, evidenceDirectory))} is not a non-symlink evidence directory`);
  }
  try {
    await writeFile(output, `${JSON.stringify(record, null, 2)}\n`, {encoding: "utf8", flag: "wx"});
  } catch (error) {
    if (error.code === "EEXIST") {
      throw new Error(`${portable(path.relative(projectRoot, output))} appeared during scaffolding; never overwrite an owner review record`);
    }
    throw error;
  }
  return {output, record};
}

async function verifyCurrentBinding({base, descriptor, expectedFile, label, errors}) {
  if (
    !isObjectRecord(descriptor) ||
    descriptor.file !== expectedFile ||
    !SHA256_PATTERN.test(descriptor.sha256 || "")
  ) {
    errors.push(`${label} binding is missing or malformed.`);
    return;
  }
  const filePath = await resolveNonSymlinkFile(base, descriptor.file);
  if (!filePath) {
    errors.push(`${label} path is missing, escaping, or contains a symlink.`);
    return;
  }
  if (digest(await readFile(filePath)) !== descriptor.sha256) errors.push(`${label} binding SHA-256 is stale.`);
}

async function verifyTechnicalManifestBinding({workspace, manifest, descriptor, errors}) {
  if (
    descriptor?.path !== "migration.json" ||
    descriptor?.hashMode !== CANONICAL_PROJECTION_ENCODING ||
    descriptor?.projection !== TECHNICAL_MANIFEST_PROJECTION.id ||
    canonicalJson(descriptor?.excludedPaths) !== canonicalJson([...TECHNICAL_MANIFEST_PROJECTION.excludedPaths]) ||
    descriptor?.sha256 !== technicalManifestSha256(manifest)
  ) {
    errors.push("Migration technical-manifest projection binding is malformed or stale.");
  }
  if (!await resolveNonSymlinkFile(workspace, descriptor?.path)) {
    errors.push("Migration technical-manifest path is missing, escaping, or contains a symlink.");
  }
}

export async function validateMissingOriginalAudioException({
  projectRoot = defaultProjectRoot,
  workspace,
  manifest,
  audit,
  record,
}) {
  const errors = recordShapeErrors(record);
  const prerequisites = await machinePrerequisiteErrors({projectRoot, workspace, manifest, audit});
  errors.push(...prerequisites.errors);

  if (record?.schemaVersion !== MISSING_ORIGINAL_AUDIO_EXCEPTION_SCHEMA_VERSION) {
    errors.push("Missing-original-audio exception schemaVersion is invalid.");
  }
  if (record?.evidenceType !== "missing-original-audio-absence-exception") {
    errors.push("Missing-original-audio exception evidenceType is invalid.");
  }
  if (record?.animationId !== manifest?.animationId) {
    errors.push("Missing-original-audio exception animationId differs from migration.json.");
  }
  if (record?.status !== "accepted-absence") {
    errors.push(`Missing-original-audio exception status is ${record?.status || "missing"}, not accepted-absence.`);
  }
  if (record?.scope !== MISSING_ORIGINAL_AUDIO_EXCEPTION_SCOPE) {
    errors.push("Missing-original-audio exception scope is altered or broader than source absence.");
  }

  await verifyTechnicalManifestBinding({
    workspace,
    manifest,
    descriptor: record?.bindings?.migrationManifest,
    errors,
  });
  await verifyCurrentBinding({
    base: projectRoot,
    descriptor: record?.bindings?.sourceSwf,
    expectedFile: manifest?.source?.swf,
    label: "Source SWF",
    errors,
  });
  if (record?.bindings?.sourceSwf?.sha256 !== manifest?.source?.swfSha256) {
    errors.push("Source SWF exception binding differs from migration.json.");
  }
  await verifyCurrentBinding({
    base: workspace,
    descriptor: record?.bindings?.machineAudioAudit,
    expectedFile: "audit/audio-runtime-evidence.json",
    label: "Machine audio audit",
    errors,
  });
  await verifyCurrentBinding({
    base: projectRoot,
    descriptor: record?.bindings?.hostRoutingEvidence?.sourceHost,
    expectedFile: audit?.authority?.hostScript?.sourceFile,
    label: "Host-routing source",
    errors,
  });
  if (
    canonicalJson(record?.bindings?.hostRoutingEvidence) !==
    canonicalJson(prerequisites.routing)
  ) {
    errors.push("Host-routing evidence projection differs from the current machine audio audit.");
  }
  if (
    canonicalJson(record?.bindings?.missingCueEvidence) !==
    canonicalJson(prerequisites.missingCueEvidence)
  ) {
    errors.push("Missing-cue projection hash differs from the exact current machine audio audit.");
  }
  if (canonicalJson(record?.missingCues) !== canonicalJson(prerequisites.missing)) {
    errors.push("Missing-cue inventory differs from the exact current machine-audited paths/languages/cues.");
  }

  const acceptedClaims = {
    acceptsOnlyOriginalSourceAbsence: true,
    originalAudioListeningAccepted: false,
    languageOrContentAccepted: false,
    hostTraversalAccepted: false,
    timingOrSynchronizationAccepted: false,
    replacementAudioAcceptedAsOriginal: false,
    behavioralParityAccepted: false,
    migrationCompletionAccepted: false,
  };
  if (canonicalJson(record?.claims) !== canonicalJson(acceptedClaims)) {
    errors.push("Exception claims must accept source absence only and leave listening, synchronization, parity, and completion unaccepted.");
  }
  for (const cue of record?.missingCues || []) {
    if (cue?.replacement?.disposition !== "none" || cue?.replacement?.acceptedAsOriginal !== false) {
      errors.push(`Missing cue replacement must remain none and cannot be represented as original (${cue?.cueId || "unknown"}).`);
    }
  }

  if (record?.review?.decision !== "accepted-absence") {
    errors.push("Owner review decision must be accepted-absence.");
  }
  const reviewer = record?.review?.reviewer;
  const reviewerTextFields = ["fullName", "role", "organizationOrOwnerId", "contact"];
  if (
    reviewer?.kind !== "human" ||
    !["owner", "owner-delegate"].includes(reviewer?.authority) ||
    reviewerTextFields.some((field) =>
      typeof reviewer?.[field] !== "string" || !reviewer[field].trim()
    )
  ) {
    errors.push("Exception review requires a complete named-human owner or owner-delegate identity.");
  }
  if (AUTOMATION_IDENTITY_PATTERN.test(
    `${reviewer?.fullName || ""} ${reviewer?.role || ""} ${reviewer?.organizationOrOwnerId || ""} ${reviewer?.contact || ""}`
  )) {
    errors.push("Exception reviewer self-identifies as automation, not a human owner reviewer.");
  }
  if (record?.review?.attestation !== MISSING_ORIGINAL_AUDIO_EXCEPTION_ATTESTATION) {
    errors.push("Exception owner attestation is missing or altered.");
  }
  const signedAtText = record?.review?.signedAt;
  const signedAt = typeof signedAtText === "string" ? Date.parse(signedAtText) : Number.NaN;
  if (!ISO_TIMESTAMP_WITH_TIMEZONE_PATTERN.test(signedAtText || "") || !Number.isFinite(signedAt)) {
    errors.push("Exception owner review requires a valid ISO signedAt with an explicit timezone.");
  }
  else if (signedAt > Date.now() + 5 * 60 * 1000) errors.push("Exception signedAt cannot be in the future.");
  return errors;
}

export async function validateMissingOriginalAudioExceptionWorkspace({
  projectRoot = defaultProjectRoot,
  workspace,
}) {
  let inputs;
  try {
    inputs = await readWorkspaceInputs({projectRoot, workspace});
  } catch (error) {
    return [`Migration/audio evidence cannot be read (${error.code === "ENOENT" ? "file does not exist" : error.message}).`];
  }
  let record;
  try {
    record = JSON.parse(
      await readFile(path.join(workspace, MISSING_ORIGINAL_AUDIO_EXCEPTION_RELATIVE_PATH), "utf8")
    );
  } catch (error) {
    return [`Missing-original-audio exception cannot be read (${error.code === "ENOENT" ? "file does not exist" : error.message}).`];
  }
  return validateMissingOriginalAudioException({...inputs, record});
}

export function parseMissingOriginalAudioExceptionArguments(argv) {
  const options = {
    id: null,
    migrationsRoot: path.join(defaultProjectRoot, "migrations"),
    check: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--id") {
      const id = argv[++index];
      if (!id || id.startsWith("--")) throw new Error("--id requires an animation ID");
      if (!SAFE_ID_PATTERN.test(id)) throw new Error("--id must be one safe migration directory name");
      options.id = id;
    } else if (value === "--migrations") {
      const directory = argv[++index];
      if (!directory || directory.startsWith("--")) throw new Error("--migrations requires a directory");
      options.migrationsRoot = path.resolve(directory);
    } else if (value === "--check") options.check = true;
    else if (["--help", "-h"].includes(value)) options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

export function missingOriginalAudioExceptionUsage() {
  return `Usage: node scripts/missing-original-audio-exception.mjs --id <animation-id> [options]

Options:
  --migrations <directory>  Migration root (default: migrations)
  --check                   Read-only validation of an existing named-human
                            accepted-absence record; never writes or approves
  -h, --help                Show this help

Without --check, the command scaffolds one unsigned pending record and refuses
to overwrite any existing record. --check fails closed on stale hashes, changed
machine/host-routing evidence, unsafe or symlinked paths, an existing formerly
missing source, extra fields, replacement audio represented as original, or an
incomplete/automated reviewer.

Scaffolding and --check do not attest that anyone listened to audio, verified
language/content, traversed the original host, checked timing/synchronization,
proved behavioral parity, or completed a migration.`;
}

export async function runMissingOriginalAudioExceptionCli({
  projectRoot = defaultProjectRoot,
  options,
}) {
  if (!options.id) throw new Error("--id is required");
  const workspace = path.join(options.migrationsRoot, options.id);
  if (options.check) {
    const errors = await validateMissingOriginalAudioExceptionWorkspace({projectRoot, workspace});
    if (errors.length) {
      throw new Error(`${options.id}: missing-original-audio exception is not valid.\n- ${errors.join("\n- ")}`);
    }
    return {mode: "check", workspace};
  }
  const result = await scaffoldMissingOriginalAudioException({projectRoot, workspace});
  return {mode: "scaffold", workspace, ...result};
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const options = parseMissingOriginalAudioExceptionArguments(process.argv.slice(2));
    if (options.help || !options.id) {
      process.stdout.write(`${missingOriginalAudioExceptionUsage()}\n`);
      if (!options.help) process.exitCode = 1;
    } else {
      const result = await runMissingOriginalAudioExceptionCli({options});
      if (result.mode === "check") {
        process.stdout.write(`${options.id}: accepted source-absence-only exception is current; no listening, synchronization, parity, or completion claim was made.\n`);
      } else {
        process.stdout.write(`scaffolded unsigned pending source-absence-only record: ${portable(path.relative(defaultProjectRoot, result.output))}\n`);
      }
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
