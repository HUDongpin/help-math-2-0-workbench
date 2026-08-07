#!/usr/bin/env node

import {createHash} from "node:crypto";
import {access, mkdir, readFile, realpath, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {embeddedInventoryRows, externalInventoryRows} from "./audit-pilot-audio.mjs";

export const AUDIO_LISTENING_ACCEPTANCE_SCHEMA_VERSION = 1;
export const AUDIO_LISTENING_REVIEW_SCOPE = "all-declared-audio-cues-and-reachable-host-states";
export const AUDIO_LISTENING_ACCEPTANCE_RELATIVE_PATH = "evidence/audio-listening-acceptance.json";
export const AUDIO_HUMAN_ATTESTATION = "I personally performed the authoritative original-runtime audio listening and host traversal recorded here.";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const APPROVED_ORIGINAL_RUNTIME_IDENTITIES = Object.freeze(new Map([
  ["adobe-animate-test-movie", "Adobe Animate Test Movie"],
  ["adobe-flash-player-projector", "Adobe Flash Player Projector"],
  ["adobe-flash-player-authorized-legacy-browser", "Adobe Flash Player (Authorized Legacy Browser)"],
]));
const NO_AUDIO_CHECK_IDS = Object.freeze([
  "source-swf-hash",
  "swf-audio-tags",
  "parsed-audio-structures",
  "actionscript-audio-operations",
  "catalog-audio-associations",
  "basename-mp3",
  "keyterm-xml-placement",
  "catalog-placement",
]);
const PENDING_AUDIO_RESULT_FIELDS = Object.freeze([
  "spokenContentAndLanguage",
  "naturalHostTraversal",
  "startStopAndSynchronization",
  "replayReset",
]);
const AUDIO_SUMMARY_FIELDS = Object.freeze([
  "everyCueListened",
  "everyReachableHostStateTraversed",
  "synchronizationAccepted",
  "replayAccepted",
]);

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

function automationLikeIdentity(value) {
  return /(?:codex|openai|\bai\s*agent\b|github\s*actions?|\bci\b|\bsystem\b|script|automat|generator|machine|robot|\bbot\b|自动|机器人|系统)/i.test(value || "");
}

export function audioSessionEventSha256(event) {
  const {eventSha256: _ignored, ...payload} = event;
  return digest(canonicalJson(payload));
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) {
      values.push(value);
      value = "";
    } else value += character;
  }
  values.push(value);
  return values;
}

export function parseAudioInventory(text) {
  const lines = text.trimEnd().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return {headers: [], rows: []};
  const headers = parseCsvLine(lines[0]);
  return {
    headers,
    rows: lines.slice(1).map((line) => Object.fromEntries(headers.map((header, index) => [header, parseCsvLine(line)[index] || ""]))),
  };
}

function cueIdentity(row) {
  return {
    cueId: row.cue_id,
    language: row.language,
    sourceFile: row.source_file,
    sha256: row.sha256,
    durationMs: Number(row.duration_ms),
    startFrame: row.start_frame === "" ? null : Number(row.start_frame),
    startFrameDomainId: row.start_frame_domain_id || null,
    startSemantics: row.start_semantics || "timeline-frame",
  };
}

function normalizedCueRow(row) {
  return {
    cueId: row.cue_id,
    language: row.language,
    sourceFile: row.source_file,
    sha256: row.sha256,
    durationMs: Number(row.duration_ms),
    startFrame: row.start_frame === "" ? null : Number(row.start_frame),
    startFrameDomainId: row.start_frame_domain_id || null,
    startSemantics: row.start_semantics || "timeline-frame",
    format: row.format || null,
    channels: row.channels === "" || row.channels === undefined ? null : Number(row.channels),
    sampleRateHz: row.sample_rate_hz === "" || row.sample_rate_hz === undefined ? null : Number(row.sample_rate_hz),
  };
}

async function validateCueTriangulation({root, workspace, manifest, audit, inventoryRows, errors}) {
  const canonicalRows = [
    ...externalInventoryRows(audit.externalAudio?.exactAssociations || [], manifest, audit.authority?.hostScript || {conventions: {}}),
    ...embeddedInventoryRows(manifest, audit.embeddedAudio || {defineSounds: [], startSounds: [], soundStreams: []}),
  ];
  const canonical = canonicalRows.map(normalizedCueRow).sort((left, right) => `${left.cueId}:${left.language}`.localeCompare(`${right.cueId}:${right.language}`));
  const observed = inventoryRows.map(normalizedCueRow).sort((left, right) => `${left.cueId}:${left.language}`.localeCompare(`${right.cueId}:${right.language}`));
  const machineFields = (rows) => rows.map(({cueId: _cueId, ...row}) => row)
    .sort((left, right) => `${left.sourceFile}:${left.language}:${left.sha256}`.localeCompare(`${right.sourceFile}:${right.language}:${right.sha256}`));
  if (canonicalJson(machineFields(observed)) !== canonicalJson(machineFields(canonical))) {
    errors.push("Audio inventory cue identity differs from the independently extracted machine audio audit.");
  }
  const manifestCues = (manifest.audio?.cues || []).map((cue) => ({
    cueId: cue.id || cue.cueId,
    language: cue.language,
    sourceFile: cue.source || cue.sourceFile,
    sha256: cue.sha256,
    durationMs: Number(cue.durationMs),
    startFrame: cue.startFrame ?? null,
    startFrameDomainId: cue.startFrameDomainId || null,
    startSemantics: cue.startSemantics || "timeline-frame",
  })).sort((left, right) => `${left.cueId}:${left.language}`.localeCompare(`${right.cueId}:${right.language}`));
  const observedManifestFields = observed.map(({format: _format, channels: _channels, sampleRateHz: _sampleRateHz, ...cue}) => cue);
  if (canonicalJson(manifestCues) !== canonicalJson(observedManifestFields)) {
    errors.push("migration.audio.cues does not exactly match the machine-audited audio inventory identity.");
  }
  const inventoryLanguages = [...new Set(observed.map(({language}) => language).filter((language) => language && language !== "shared"))].sort();
  const manifestLanguages = [...new Set(manifest.audio?.languages || [])].sort();
  if (canonicalJson(inventoryLanguages) !== canonicalJson(manifestLanguages)) errors.push("migration.audio.languages does not exactly match inventoried cue languages.");
  if ((audit.externalAudio?.lessonGroupCandidates || []).length || (audit.externalAudio?.expectedButMissing || []).length || (audit.acceptance?.manifestFollowUp || []).length) {
    errors.push("Machine audio audit still has candidate, missing, or manifest-follow-up mappings; strict audio acceptance is not ready.");
  }
  for (const item of audit.externalAudio?.exactAssociations || []) {
    const filePath = await resolveSafeEvidenceFile(root, workspace, item.sourceFile);
    if (!filePath || item.hashMatchesCatalog !== true || item.catalogSha256 !== item.observedSha256 || digest(await readFile(filePath).catch(() => Buffer.alloc(0))) !== item.observedSha256) {
      errors.push(`Machine-audited external audio identity is stale (${item.sourceFile || "missing"}).`);
    }
    if (!String(item.probe?.codecName || "").trim() || !(Number(item.probe?.durationMs) > 0) || !(Number(item.probe?.probeSizeBytes) > 0)) {
      errors.push(`Machine-audited external audio codec/duration metadata is incomplete (${item.sourceFile || "missing"}).`);
    }
  }
}

async function binding(workspace, relativePath) {
  const absolutePath = path.join(workspace, relativePath);
  const bytes = await readFile(absolutePath);
  return {file: relativePath, sha256: digest(bytes)};
}

export async function buildAudioListeningAcceptanceTemplate({workspace}) {
  const manifest = JSON.parse(await readFile(path.join(workspace, "migration.json"), "utf8"));
  if (!manifest.audio?.required) throw new Error(`${manifest.animationId}: audio listening acceptance is only scaffolded when migration.audio.required is true`);
  const inventoryRelative = manifest.audio.inventoryFile || "audio-inventory.csv";
  const inventoryText = await readFile(path.join(workspace, inventoryRelative), "utf8");
  const inventory = parseAudioInventory(inventoryText);
  if (!inventory.rows.length) throw new Error(`${manifest.animationId}: audio inventory contains no cues`);
  return {
    schemaVersion: AUDIO_LISTENING_ACCEPTANCE_SCHEMA_VERSION,
    evidenceType: "authoritative-audio-listening-acceptance",
    animationId: manifest.animationId,
    status: "pending",
    bindings: {
      sourceSwf: {file: manifest.source.swf, sha256: manifest.source.swfSha256},
      machineAudioAudit: await binding(workspace, "audit/audio-runtime-evidence.json"),
      audioInventory: await binding(workspace, inventoryRelative),
    },
    cueReviews: inventory.rows.map((row) => ({
      ...cueIdentity(row),
      results: {
        spokenContentAndLanguage: "pending",
        naturalHostTraversal: "pending",
        startStopAndSynchronization: "pending",
        replayReset: "pending",
      },
      evidence: [],
      notes: "",
    })),
    summary: {
      everyCueListened: false,
      everyReachableHostStateTraversed: false,
      synchronizationAccepted: false,
      replayAccepted: false,
    },
    review: {
      decision: "pending",
      reviewer: {kind: "human", fullName: "", role: "", organizationOrOwnerId: "", contact: ""},
      attestation: AUDIO_HUMAN_ATTESTATION,
      signedAt: "",
      scope: AUDIO_LISTENING_REVIEW_SCOPE,
      notes: "",
    },
  };
}

function isObjectRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function requireExactKeys(value, expected, label, errors) {
  if (!isObjectRecord(value)) {
    errors.push(`${label} must be an object with exactly the unsigned-template fields.`);
    return false;
  }
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (canonicalJson(actual) !== canonicalJson(wanted)) {
    errors.push(`${label} fields differ from the unsigned-template schema.`);
    return false;
  }
  return true;
}

function requireBlank(value, label, errors) {
  if (value !== "") errors.push(`${label} contains reviewer-authored content.`);
}

/**
 * Returns every reason an existing record cannot be safely replaced by a
 * newly generated pending template. This predicate intentionally audits
 * blankness only: source/audit/inventory bindings may be stale, which is the
 * sole state the explicit refresh mode exists to repair.
 */
export function unsignedPendingAudioListeningTemplateErrors(record) {
  const errors = [];
  if (!requireExactKeys(record, [
    "schemaVersion", "evidenceType", "animationId", "status", "bindings",
    "cueReviews", "summary", "review",
  ], "Audio listening acceptance", errors)) return errors;
  if (record.schemaVersion !== AUDIO_LISTENING_ACCEPTANCE_SCHEMA_VERSION) errors.push("Audio listening acceptance schemaVersion is not the pending-template version.");
  if (record.evidenceType !== "authoritative-audio-listening-acceptance") errors.push("Audio listening acceptance evidenceType is not the pending-template type.");
  if (typeof record.animationId !== "string" || !record.animationId) errors.push("Audio listening acceptance animationId is blank or malformed.");
  if (record.status !== "pending") errors.push("Audio listening acceptance status is not pending.");

  if (requireExactKeys(record.bindings, ["sourceSwf", "machineAudioAudit", "audioInventory"], "Audio listening acceptance bindings", errors)) {
    for (const [name, descriptor] of Object.entries(record.bindings)) {
      if (!requireExactKeys(descriptor, ["file", "sha256"], `Audio listening acceptance bindings.${name}`, errors)) continue;
      if (typeof descriptor.file !== "string" || !descriptor.file || path.isAbsolute(descriptor.file) || descriptor.file.includes("\\")) {
        errors.push(`Audio listening acceptance bindings.${name}.file is not a safe non-empty relative path.`);
      }
      if (!SHA256_PATTERN.test(descriptor.sha256 || "")) errors.push(`Audio listening acceptance bindings.${name}.sha256 is malformed.`);
    }
  }

  if (!Array.isArray(record.cueReviews) || record.cueReviews.length === 0) {
    errors.push("Audio listening acceptance cueReviews must contain the generated pending cue templates.");
  } else {
    const identities = new Set();
    for (const [index, cue] of record.cueReviews.entries()) {
      const label = `Audio listening acceptance cueReviews[${index}]`;
      if (!requireExactKeys(cue, [
        "cueId", "language", "sourceFile", "sha256", "durationMs", "startFrame",
        "startFrameDomainId", "startSemantics", "results", "evidence", "notes",
      ], label, errors)) continue;
      for (const field of ["cueId", "language", "sourceFile", "startSemantics"]) {
        if (typeof cue[field] !== "string" || !cue[field]) errors.push(`${label}.${field} is blank or malformed.`);
      }
      if (!SHA256_PATTERN.test(cue.sha256 || "")) errors.push(`${label}.sha256 is malformed.`);
      if (!(Number.isFinite(cue.durationMs) && cue.durationMs > 0)) errors.push(`${label}.durationMs is malformed.`);
      if (!(cue.startFrame === null || (Number.isSafeInteger(cue.startFrame) && cue.startFrame >= 1))) errors.push(`${label}.startFrame is malformed.`);
      if (!(cue.startFrameDomainId === null || (typeof cue.startFrameDomainId === "string" && cue.startFrameDomainId))) errors.push(`${label}.startFrameDomainId is malformed.`);
      const identity = `${cue.cueId}\u0000${cue.language}`;
      if (identities.has(identity)) errors.push(`${label} duplicates another cue/language identity.`);
      identities.add(identity);
      if (requireExactKeys(cue.results, PENDING_AUDIO_RESULT_FIELDS, `${label}.results`, errors)) {
        for (const field of PENDING_AUDIO_RESULT_FIELDS) {
          if (cue.results[field] !== "pending") errors.push(`${label}.results.${field} is not pending.`);
        }
      }
      if (!Array.isArray(cue.evidence) || cue.evidence.length !== 0) errors.push(`${label}.evidence is not empty.`);
      requireBlank(cue.notes, `${label}.notes`, errors);
    }
  }

  if (requireExactKeys(record.summary, AUDIO_SUMMARY_FIELDS, "Audio listening acceptance summary", errors)) {
    for (const field of AUDIO_SUMMARY_FIELDS) {
      if (record.summary[field] !== false) errors.push(`Audio listening acceptance summary.${field} is not false.`);
    }
  }

  if (requireExactKeys(record.review, ["decision", "reviewer", "attestation", "signedAt", "scope", "notes"], "Audio listening acceptance review", errors)) {
    if (record.review.decision !== "pending") errors.push("Audio listening acceptance review.decision is not pending.");
    if (record.review.attestation !== AUDIO_HUMAN_ATTESTATION) errors.push("Audio listening acceptance review.attestation differs from the unsigned template.");
    if (record.review.scope !== AUDIO_LISTENING_REVIEW_SCOPE) errors.push("Audio listening acceptance review.scope differs from the unsigned template.");
    requireBlank(record.review.signedAt, "Audio listening acceptance review.signedAt", errors);
    requireBlank(record.review.notes, "Audio listening acceptance review.notes", errors);
    if (requireExactKeys(record.review.reviewer, ["kind", "fullName", "role", "organizationOrOwnerId", "contact"], "Audio listening acceptance review.reviewer", errors)) {
      if (record.review.reviewer.kind !== "human") errors.push("Audio listening acceptance review.reviewer.kind differs from the unsigned template.");
      for (const field of ["fullName", "role", "organizationOrOwnerId", "contact"]) {
        requireBlank(record.review.reviewer[field], `Audio listening acceptance review.reviewer.${field}`, errors);
      }
    }
  }
  return errors;
}

export function assertUnsignedPendingAudioListeningTemplate(record) {
  const errors = unsignedPendingAudioListeningTemplateErrors(record);
  if (errors.length) {
    throw new Error(`Refusing to refresh audio listening acceptance: the existing record is not a strictly blank, unsigned, all-pending template. ${errors.join(" ")}`);
  }
  return record;
}

export async function scaffoldOrRefreshAudioListeningAcceptance({workspace, refreshUnsignedPending = false}) {
  const output = path.join(workspace, AUDIO_LISTENING_ACCEPTANCE_RELATIVE_PATH);
  let existingBytes = null;
  let existingRecord = null;
  if (await exists(output)) {
    if (!refreshUnsignedPending) throw new Error(`${portable(path.relative(projectRoot, output))} already exists; never overwrite a human review record`);
    existingBytes = await readFile(output);
    try {
      existingRecord = JSON.parse(existingBytes.toString("utf8"));
    } catch (error) {
      throw new Error(`Refusing to refresh audio listening acceptance: the existing record is not valid JSON (${error.message}).`);
    }
    assertUnsignedPendingAudioListeningTemplate(existingRecord);
  }

  const record = await buildAudioListeningAcceptanceTemplate({workspace});
  if (existingRecord && existingRecord.animationId !== record.animationId) {
    throw new Error("Refusing to refresh audio listening acceptance: the existing pending template belongs to a different animationId.");
  }
  const rendered = `${JSON.stringify(record, null, 2)}\n`;
  await mkdir(path.dirname(output), {recursive: true});
  if (existingBytes) {
    const currentBytes = await readFile(output);
    if (!currentBytes.equals(existingBytes)) {
      throw new Error("Refusing to refresh audio listening acceptance: the existing record changed during the safety check.");
    }
    await writeFile(output, rendered, "utf8");
    return {action: "refreshed-unsigned-pending", output, record};
  }
  try {
    await writeFile(output, rendered, {encoding: "utf8", flag: "wx"});
  } catch (error) {
    if (error.code === "EEXIST") throw new Error(`${portable(path.relative(projectRoot, output))} appeared during scaffolding; never overwrite a human review record`);
    throw error;
  }
  return {action: "scaffolded", output, record};
}

async function verifyBinding({projectRoot: root, workspace, descriptor, expectedFile, label, errors, workspaceOnly = false}) {
  if (descriptor?.file !== expectedFile || !SHA256_PATTERN.test(descriptor?.sha256 || "")) {
    errors.push(`${label} binding is missing or malformed.`);
    return;
  }
  const filePath = await resolveSafeEvidenceFile(root, workspace, descriptor.file, {workspaceOnly});
  if (!filePath) {
    errors.push(`${label} bound file path is absolute, escaping, symlink-escaping, or missing (${descriptor.file}).`);
    return;
  }
  if (digest(await readFile(filePath)) !== descriptor.sha256) errors.push(`${label} binding SHA-256 is stale.`);
}

async function resolveSafeEvidenceFile(root, workspace, declared, {workspaceOnly = false, requiredPrefix = null} = {}) {
  if (typeof declared !== "string" || !declared || path.isAbsolute(declared) || declared.includes("\\")) return null;
  const normalized = portable(path.normalize(declared));
  if (normalized !== declared || normalized === ".." || normalized.startsWith("../") || (requiredPrefix && !declared.startsWith(requiredPrefix))) return null;
  for (const base of workspaceOnly ? [workspace] : [workspace, root]) {
    const candidate = path.resolve(base, declared);
    const relative = path.relative(base, candidate);
    if ((relative === declared || portable(relative) === declared) && await exists(candidate)) {
      const actual = await realpath(candidate);
      const actualRelative = path.relative(await realpath(base), actual);
      if (actualRelative !== ".." && !actualRelative.startsWith(`..${path.sep}`) && !path.isAbsolute(actualRelative)) return candidate;
    }
  }
  return null;
}

async function verifyRuntimeToolchainReceipt({root, workspace, runtime, label, errors}) {
  const approvedName = APPROVED_ORIGINAL_RUNTIME_IDENTITIES.get(runtime?.runtimeId);
  if (!approvedName || runtime?.name !== approvedName || !String(runtime?.version || "").trim()) {
    errors.push(`${label} runtime identity is not an approved Adobe original-runtime identity.`);
    return;
  }
  const descriptor = runtime?.toolchainReceipt;
  const receiptPath = await resolveSafeEvidenceFile(root, workspace, descriptor?.file, {
    workspaceOnly: true,
    requiredPrefix: "evidence/audio-runtime-sessions/",
  });
  if (!receiptPath || !SHA256_PATTERN.test(descriptor?.sha256 || "")) {
    errors.push(`${label} authorized runtime toolchain receipt path/SHA-256 is malformed, escaping, or missing.`);
    return;
  }
  const bytes = await readFile(receiptPath);
  if (digest(bytes) !== descriptor.sha256) {
    errors.push(`${label} authorized runtime toolchain receipt SHA-256 is stale.`);
    return;
  }
  let receipt;
  try { receipt = JSON.parse(bytes.toString("utf8")); }
  catch (error) {
    errors.push(`${label} authorized runtime toolchain receipt is not valid JSON (${error.message}).`);
    return;
  }
  if (
    receipt.schemaVersion !== 1 || receipt.evidenceType !== "authorized-original-runtime-toolchain-receipt" ||
    receipt.runtime?.runtimeId !== runtime.runtimeId || receipt.runtime?.name !== runtime.name || receipt.runtime?.version !== runtime.version
  ) errors.push(`${label} authorized runtime toolchain receipt identity differs from the session runtime.`);
  const capturedAt = Date.parse(receipt.capturedAt || "");
  if (!Number.isFinite(capturedAt) || capturedAt > Date.now() + 5 * 60 * 1000) errors.push(`${label} authorized runtime toolchain receipt capturedAt is invalid or in the future.`);
  const identityArtifacts = Array.isArray(receipt.identityArtifacts) ? receipt.identityArtifacts : [];
  if (!identityArtifacts.length) errors.push(`${label} authorized runtime toolchain receipt has no product/executable identity artifact.`);
  const allowedKinds = new Set(["product-version-capture", "executable-sha256-receipt", "workstation-toolchain-log"]);
  for (const [index, artifact] of identityArtifacts.entries()) {
    const artifactPath = await resolveSafeEvidenceFile(root, workspace, artifact?.file, {
      workspaceOnly: true,
      requiredPrefix: "evidence/audio-runtime-sessions/",
    });
    if (!allowedKinds.has(artifact?.kind) || !artifactPath || !SHA256_PATTERN.test(artifact?.sha256 || "") || digest(await readFile(artifactPath).catch(() => Buffer.alloc(0))) !== artifact.sha256) {
      errors.push(`${label} authorized runtime identityArtifact[${index}] path/hash/kind is invalid.`);
    }
  }
}

async function verifySession({root, workspace, manifest, machineAudioAudit, cue, descriptor, acceptanceReviewer, errors}) {
  const label = `Audio cue ${cue.cueId}/${cue.language} listening session`;
  if (descriptor?.kind !== "original-runtime-audio-listening-session") {
    errors.push(`${label} evidence kind must be original-runtime-audio-listening-session.`);
    return;
  }
  const sessionPath = await resolveSafeEvidenceFile(root, workspace, descriptor.file, {workspaceOnly: true, requiredPrefix: "evidence/audio-listening-sessions/"});
  if (!sessionPath || !SHA256_PATTERN.test(descriptor.sha256 || "")) {
    errors.push(`${label} descriptor path/SHA-256 is malformed, absolute, escaping, or missing.`);
    return;
  }
  const bytes = await readFile(sessionPath);
  if (digest(bytes) !== descriptor.sha256) {
    errors.push(`${label} descriptor SHA-256 is stale.`);
    return;
  }
  let session;
  try { session = JSON.parse(bytes.toString("utf8")); }
  catch (error) {
    errors.push(`${label} is not valid JSON (${error.message}).`);
    return;
  }
  if (session.schemaVersion !== 1 || session.evidenceType !== "original-runtime-audio-listening-session") errors.push(`${label} schema/type is invalid.`);
  if (session.animationId !== manifest.animationId) errors.push(`${label} animationId differs from migration.json.`);
  if (
    canonicalJson(session.reviewer) !== canonicalJson(acceptanceReviewer) ||
    session.reviewer?.kind !== "human" || !String(session.reviewer?.fullName || "").trim() ||
    !String(session.reviewer?.role || "").trim() || !String(session.reviewer?.organizationOrOwnerId || "").trim() ||
    automationLikeIdentity(`${session.reviewer?.fullName || ""} ${session.reviewer?.role || ""}`)
  ) {
    errors.push(`${label} reviewer must match the named human acceptance reviewer.`);
  }
  const observedAt = Date.parse(session.observedAt || "");
  if (!Number.isFinite(observedAt) || observedAt > Date.now() + 5 * 60 * 1000) errors.push(`${label} observedAt is invalid or in the future.`);
  for (const field of ["cueId", "language", "sourceFile", "sha256", "durationMs", "startFrame", "startFrameDomainId", "startSemantics"]) {
    if (session.cue?.[field] !== cue[field]) errors.push(`${label} cue.${field} binding is stale.`);
  }
  await verifyRuntimeToolchainReceipt({root, workspace, runtime: session.runtime, label, errors});
  const authoritativeHost = machineAudioAudit?.authority?.hostScript;
  const hostPath = await resolveSafeEvidenceFile(root, workspace, session.runtime?.hostFile);
  if (
    !hostPath || session.runtime?.hostFile !== authoritativeHost?.sourceFile || session.runtime?.hostSha256 !== authoritativeHost?.sha256 ||
    !SHA256_PATTERN.test(session.runtime?.hostSha256 || "") || digest(await readFile(hostPath).catch(() => Buffer.alloc(0))) !== session.runtime?.hostSha256
  ) {
    errors.push(`${label} original host identity/path/hash is invalid.`);
  }
  const events = Array.isArray(session.operationEvents) ? session.operationEvents : [];
  const allowedActions = new Set(["activate", "start", "stop", "complete", "replay"]);
  let prior = null;
  let priorObservedAtMs = -1;
  for (const [index, event] of events.entries()) {
    if (event.sequence !== index + 1 || event.previousEventSha256 !== prior || event.eventSha256 !== audioSessionEventSha256(event)) {
      errors.push(`${label} operation event chain is invalid at sequence ${index + 1}.`);
      break;
    }
    if (!allowedActions.has(event.action)) errors.push(`${label} operation event ${index + 1} action is invalid.`);
    if (!Number.isFinite(event.observedAtMs) || event.observedAtMs < priorObservedAtMs) errors.push(`${label} operation event ${index + 1} observedAtMs is invalid or non-monotonic.`);
    priorObservedAtMs = event.observedAtMs;
    prior = event.eventSha256;
  }
  const actions = events.map(({action}) => action);
  const terminalIndex = actions.findIndex((action) => ["stop", "complete"].includes(action));
  const replayIndex = actions.indexOf("replay");
  const replayStartIndex = replayIndex < 0 ? -1 : actions.indexOf("start", replayIndex + 1);
  if (actions[0] !== "activate" || actions[1] !== "start" || terminalIndex < 2 || replayIndex <= terminalIndex || replayStartIndex <= replayIndex) {
    errors.push(`${label} must prove ordered activate → start → stop-or-complete → replay → start operations.`);
  }
  for (const field of ["spokenContentAndLanguage", "naturalHostTraversal", "startStopAndSynchronization", "replayReset"]) {
    if (session.observations?.[field] !== "pass") errors.push(`${label} observation ${field} is not pass.`);
  }
  if (!Array.isArray(session.artifacts) || !session.artifacts.length) errors.push(`${label} must bind at least one runtime capture/log artifact.`);
  const allowedArtifactKinds = new Set(["lossless-runtime-capture", "append-only-original-runtime-log", "audio-waveform-capture"]);
  for (const [index, artifact] of (session.artifacts || []).entries()) {
    const artifactPath = await resolveSafeEvidenceFile(root, workspace, artifact?.file, {workspaceOnly: true, requiredPrefix: "evidence/audio-runtime-sessions/"});
    if (!allowedArtifactKinds.has(artifact?.kind) || !artifactPath || !SHA256_PATTERN.test(artifact?.sha256 || "") || digest(await readFile(artifactPath).catch(() => Buffer.alloc(0))) !== artifact.sha256) {
      errors.push(`${label} artifact[${index}] path/hash/kind is invalid.`);
    }
  }
}

export async function validateAudioListeningAcceptance({projectRoot: root = projectRoot, workspace, manifest, machineAudioAudit, record}) {
  const errors = [];
  if (record?.schemaVersion !== AUDIO_LISTENING_ACCEPTANCE_SCHEMA_VERSION || record?.evidenceType !== "authoritative-audio-listening-acceptance") {
    errors.push("Audio listening acceptance schema/type is invalid.");
    return errors;
  }
  if (record.animationId !== manifest.animationId) errors.push("Audio listening acceptance animationId differs from migration.json.");
  if (record.status !== "accepted") errors.push(`Audio listening acceptance status is ${record.status || "missing"}, not accepted.`);
  const inventoryRelative = manifest.audio?.inventoryFile || "audio-inventory.csv";
  await verifyBinding({projectRoot: root, workspace, descriptor: record.bindings?.sourceSwf, expectedFile: manifest.source.swf, label: "Source SWF", errors});
  if (record.bindings?.sourceSwf?.sha256 !== manifest.source.swfSha256) errors.push("Audio listening acceptance source SWF hash differs from migration.json.");
  await verifyBinding({projectRoot: root, workspace, descriptor: record.bindings?.machineAudioAudit, expectedFile: "audit/audio-runtime-evidence.json", label: "Machine audio audit", errors, workspaceOnly: true});
  await verifyBinding({projectRoot: root, workspace, descriptor: record.bindings?.audioInventory, expectedFile: inventoryRelative, label: "Audio inventory", errors, workspaceOnly: true});

  let rows = [];
  try {
    rows = parseAudioInventory(await readFile(path.join(workspace, inventoryRelative), "utf8")).rows;
  } catch (error) {
    errors.push(`Audio inventory cannot be read (${error.message}).`);
  }
  const expected = rows.map(cueIdentity);
  const reviews = Array.isArray(record.cueReviews) ? record.cueReviews : [];
  if (reviews.length !== expected.length) errors.push("Audio listening acceptance must contain exactly one review per inventory cue.");
  for (const cue of expected) {
    const review = reviews.find((candidate) => candidate.cueId === cue.cueId && candidate.language === cue.language);
    if (!review) {
      errors.push(`Audio cue ${cue.cueId}/${cue.language} has no review.`);
      continue;
    }
    for (const field of ["sourceFile", "sha256", "durationMs", "startFrame", "startFrameDomainId", "startSemantics"]) {
      if (review[field] !== cue[field]) errors.push(`Audio cue ${cue.cueId}/${cue.language} ${field} binding is stale.`);
    }
    const sourcePath = await resolveSafeEvidenceFile(root, workspace, cue.sourceFile);
    if (!sourcePath) errors.push(`Audio cue ${cue.cueId}/${cue.language} source file does not exist (${cue.sourceFile}).`);
    else if (!SHA256_PATTERN.test(cue.sha256 || "") || digest(await readFile(sourcePath)) !== cue.sha256) {
      errors.push(`Audio cue ${cue.cueId}/${cue.language} source SHA-256 is stale.`);
    }
    for (const field of ["spokenContentAndLanguage", "naturalHostTraversal", "startStopAndSynchronization", "replayReset"]) {
      if (review.results?.[field] !== "pass") errors.push(`Audio cue ${cue.cueId}/${cue.language} ${field} is not pass.`);
    }
    if (!Array.isArray(review.evidence) || !review.evidence.length) errors.push(`Audio cue ${cue.cueId}/${cue.language} has no listening/traversal evidence.`);
    for (const descriptor of review.evidence || []) {
      await verifySession({root, workspace, manifest, machineAudioAudit, cue, descriptor, acceptanceReviewer: record.review?.reviewer, errors});
    }
  }
  for (const field of ["everyCueListened", "everyReachableHostStateTraversed", "synchronizationAccepted", "replayAccepted"]) {
    if (record.summary?.[field] !== true) errors.push(`Audio listening summary.${field} must be true.`);
  }
  if (record.review?.decision !== "accepted") errors.push("Audio listening review.decision must be accepted.");
  const reviewer = record.review?.reviewer;
  if (
    reviewer?.kind !== "human" || !String(reviewer?.fullName || "").trim() || !String(reviewer?.role || "").trim() ||
    !String(reviewer?.organizationOrOwnerId || "").trim() || !String(reviewer?.contact || "").trim()
  ) errors.push("Audio listening review requires a structurally complete named-human identity and contact/owner ID.");
  if (automationLikeIdentity(`${reviewer?.fullName || ""} ${reviewer?.role || ""} ${reviewer?.organizationOrOwnerId || ""}`)) {
    errors.push("Audio listening reviewer self-identifies as automation, not a human reviewer.");
  }
  if (record.review?.attestation !== AUDIO_HUMAN_ATTESTATION) errors.push("Audio listening review human attestation is missing or altered.");
  const reviewedAt = Date.parse(record.review?.signedAt || "");
  if (!Number.isFinite(reviewedAt)) errors.push("Audio listening review requires a valid ISO signedAt.");
  else if (reviewedAt > Date.now() + 5 * 60 * 1000) errors.push("Audio listening signedAt cannot be in the future.");
  if (record.review?.scope !== AUDIO_LISTENING_REVIEW_SCOPE) errors.push("Audio listening review scope is incomplete.");
  return errors;
}

export async function validateStrictAudioEvidence({projectRoot: root = projectRoot, workspace, manifest}) {
  const errors = [];
  const auditPath = path.join(workspace, "audit", "audio-runtime-evidence.json");
  let audit;
  try {
    audit = JSON.parse(await readFile(auditPath, "utf8"));
  } catch (error) {
    return [`Authoritative machine audio audit cannot be read (${error.code === "ENOENT" ? "file does not exist" : error.message}).`];
  }
  if (audit.animationId !== manifest.animationId) errors.push("Machine audio audit animationId differs from migration.json.");
  if (audit.source?.hashMatches !== true || audit.source?.expectedSha256 !== manifest.source?.swfSha256 || audit.source?.observedSha256 !== manifest.source?.swfSha256) {
    errors.push("Machine audio audit does not bind the current source SWF hash.");
  }
  if (audit.acceptance?.structurallyAudited !== true) errors.push("Machine audio structure is not marked audited.");
  if ((audit.externalAudio?.missingExpectedCount || 0) > 0) errors.push(`Machine audio audit records ${audit.externalAudio.missingExpectedCount} expected but missing track(s).`);
  if (!manifest.audio?.required) {
    const assessment = audit.strictNoAudioAssessment;
    const checks = Array.isArray(assessment?.checks) ? assessment.checks : [];
    const checkIds = checks.map(({id}) => id).sort();
    if (
      audit.acceptance?.strictAudioAcceptance !== "accepted-not-required" ||
      assessment?.eligible !== true || assessment?.decision !== "accepted-not-required" ||
      assessment?.scope !== "shipped-SWF-and-preserved-host-placement-audio-reachability" ||
      canonicalJson(checkIds) !== canonicalJson([...NO_AUDIO_CHECK_IDS].sort()) || checks.some(({passed}) => passed !== true)
    ) {
      errors.push(`The no-audio claim is not source-bound accepted-not-required (${audit.acceptance?.strictAudioAcceptance || "missing"}).`);
    }
    if (
      assessment?.source?.swf !== manifest.source?.swf ||
      assessment?.source?.expectedSha256 !== manifest.source?.swfSha256 ||
      assessment?.source?.observedSha256 !== manifest.source?.swfSha256
    ) errors.push("No-audio negative proof source binding differs from migration.json.");
    let actualInventoryRows = [];
    try {
      actualInventoryRows = parseAudioInventory(await readFile(path.join(workspace, manifest.audio?.inventoryFile || "audio-inventory.csv"), "utf8")).rows;
    } catch (error) {
      errors.push(`No-audio inventory cannot be read (${error.message}).`);
    }
    if (
      (audit.externalAudio?.exactAssociations || []).length || (audit.externalAudio?.lessonGroupCandidates || []).length ||
      (audit.externalAudio?.expectedButMissing || []).length || (audit.embeddedAudio?.defineSounds || []).length ||
      (audit.embeddedAudio?.soundStreams || []).length || (audit.actionScriptAudioOperations || []).length ||
      audit.inventory?.rowCount !== 0 || actualInventoryRows.length || (manifest.audio?.cues || []).length || (manifest.audio?.languages || []).length
    ) errors.push("The no-audio claim is contradicted by external, embedded, scripted, missing, candidate, or inventoried audio evidence.");
    for (const descriptor of Object.values(assessment?.machineEvidence || {})) {
      const evidencePath = await resolveSafeEvidenceFile(root, workspace, descriptor?.file);
      if (!evidencePath || !SHA256_PATTERN.test(descriptor?.sha256 || "") || digest(await readFile(evidencePath).catch(() => Buffer.alloc(0))) !== descriptor.sha256) {
        errors.push(`No-audio machine evidence binding is stale (${descriptor?.file || "missing"}).`);
      }
    }
    for (const descriptor of [
      assessment?.archiveAssociationEvidence?.sourceFilesCatalog,
      assessment?.archiveAssociationEvidence?.animationsCatalog,
      ...(assessment?.archiveAssociationEvidence?.keytermXmlEvidence || []).map((item) => ({file: item.sourceFile, sha256: item.observedSha256})),
    ].filter(Boolean)) {
      const evidencePath = await resolveSafeEvidenceFile(root, workspace, descriptor.file);
      if (!evidencePath || !SHA256_PATTERN.test(descriptor.sha256 || "") || digest(await readFile(evidencePath).catch(() => Buffer.alloc(0))) !== descriptor.sha256) {
        errors.push(`No-audio archive-association evidence binding is stale (${descriptor.file || "missing"}).`);
      }
    }
    return errors;
  }
  let inventoryRows = [];
  try {
    inventoryRows = parseAudioInventory(await readFile(path.join(workspace, manifest.audio?.inventoryFile || "audio-inventory.csv"), "utf8")).rows;
  } catch (error) {
    errors.push(`Audio inventory cannot be read for machine/manifest triangulation (${error.message}).`);
  }
  await validateCueTriangulation({root, workspace, manifest, audit, inventoryRows, errors});
  let record;
  try {
    record = JSON.parse(await readFile(path.join(workspace, AUDIO_LISTENING_ACCEPTANCE_RELATIVE_PATH), "utf8"));
  } catch (error) {
    errors.push(`Authoritative audio listening acceptance cannot be read (${error.code === "ENOENT" ? "file does not exist" : error.message}).`);
    return errors;
  }
  errors.push(...await validateAudioListeningAcceptance({projectRoot: root, workspace, manifest, machineAudioAudit: audit, record}));
  return errors;
}

export function parseAudioListeningAcceptanceArguments(argv) {
  const options = {
    id: null,
    migrationsRoot: path.join(projectRoot, "migrations"),
    refreshUnsignedPending: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--id") {
      const value = argv[++index];
      if (!value || value.startsWith("--")) throw new Error("--id requires an animation ID");
      options.id = value;
    } else if (argv[index] === "--migrations") {
      const value = argv[++index];
      if (!value || value.startsWith("--")) throw new Error("--migrations requires a directory");
      options.migrationsRoot = path.resolve(value);
    } else if (argv[index] === "--refresh-unsigned-pending") options.refreshUnsignedPending = true;
    else if (["--help", "-h"].includes(argv[index])) options.help = true;
    else throw new Error(`Unknown option: ${argv[index]}`);
  }
  return options;
}

export function audioListeningAcceptanceUsage() {
  return `Usage: node scripts/audio-listening-acceptance.mjs --id <animation-id> [options]

Options:
  --migrations <directory>       Migration root (default: migrations)
  --refresh-unsigned-pending     Refresh an existing record only when it is
                                 strictly blank, unsigned, pending, contains
                                 no evidence/notes/reviewer content, and every
                                 cue result remains pending
  -h, --help                     Show this help

Without --refresh-unsigned-pending, an existing acceptance file is never
overwritten. The refresh mode also fails closed on any signed or partially
reviewed record and only regenerates machine-audit/inventory bindings.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseAudioListeningAcceptanceArguments(process.argv.slice(2));
  if (options.help || !options.id) {
    process.stdout.write(`${audioListeningAcceptanceUsage()}\n`);
    if (!options.help) process.exitCode = 1;
  } else {
    const workspace = path.join(options.migrationsRoot, options.id);
    const result = await scaffoldOrRefreshAudioListeningAcceptance({
      workspace,
      refreshUnsignedPending: options.refreshUnsignedPending,
    });
    const verb = result.action === "scaffolded" ? "scaffolded" : "safely refreshed";
    process.stdout.write(`${verb} unsigned pending audio listening acceptance: ${portable(path.relative(projectRoot, result.output))}\n`);
  }
}
