#!/usr/bin/env node

import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {access, lstat, mkdir, readFile, readdir, realpath, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {execFile} from "node:child_process";
import {fileURLToPath} from "node:url";

import {parseAudioInventory} from "./audio-listening-acceptance.mjs";
import {PILOT_MIGRATIONS} from "./scaffold-pilot-migrations.mjs";

export const FORMULA_AUDIO_SESSION_IDS = Object.freeze([
  "formula-elementary-conversion-01-01",
  "formula-elementary-conversion-01-02",
  "formula-elementary-conversion-01-03",
  "formula-elementary-conversion-01-04",
]);
export const ACUTE_ANGLE_AUDIO_SESSION_ID = "keyterm-elementary-acute-angle";
export const COURSE_AUDIO_SESSION_IDS = Object.freeze([
  "course-g03-l01-ts-008",
  "course-g03-l01-vb-004",
  "course-g03-l06-ti-001",
  "course-g04-l01-ir-001",
  "course-g04-l03-in-009",
  "course-g04-l09-gs-002",
  "course-g05-l13-rw-002",
  "shell-course-g04-l01-index-local",
]);
export const DEFAULT_AUDIO_SESSION_KIT_ROOT = "work/audio-runtime-session-kits";
export const DEFAULT_PROJECTOR_APP = "/Applications/Adobe Animate 2021/Players/Flash Player.app";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const execFileAsync = promisify(execFile);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const RECEIPT_RELATIVE_PATH = "evidence/audio-runtime-sessions/runtime-toolchain-receipt.json";
const IDENTITY_RELATIVE_PATH = "evidence/audio-runtime-sessions/runtime-executable-sha256.txt";
export const AUDIO_SESSION_KIT_IDS = Object.freeze([
  ...FORMULA_AUDIO_SESSION_IDS,
  ACUTE_ANGLE_AUDIO_SESSION_ID,
  ...COURSE_AUDIO_SESSION_IDS,
]);
const ALLOWED_IDS = new Set(AUDIO_SESSION_KIT_IDS);

function portable(value) {
  return value.split(path.sep).join("/");
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function sha256File(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function assertSha256(value, label) {
  if (!SHA256_PATTERN.test(value || "")) throw new Error(`${label} does not contain a valid SHA-256`);
}

async function resolveDeclaredFile({projectRoot, workspace, declared, label}) {
  if (
    typeof declared !== "string" || !declared || path.isAbsolute(declared) || declared.includes("\\") ||
    portable(path.normalize(declared)) !== declared || declared === ".." || declared.startsWith("../")
  ) throw new Error(`${label} has an unsafe relative path: ${declared || "missing"}`);
  for (const base of [workspace, projectRoot]) {
    const candidate = path.resolve(base, declared);
    const relative = path.relative(base, candidate);
    if (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative) && await exists(candidate)) return candidate;
  }
  throw new Error(`${label} does not exist: ${declared}`);
}

async function hashBoundDeclaredFile({projectRoot, workspace, declared, expectedSha256, label}) {
  assertSha256(expectedSha256, `${label} expected identity`);
  const absolutePath = await resolveDeclaredFile({projectRoot, workspace, declared, label});
  const observedSha256 = await sha256File(absolutePath);
  if (observedSha256 !== expectedSha256) throw new Error(`${label} SHA-256 is stale (${declared})`);
  return {file: declared, sha256: observedSha256};
}

async function readPlistValue(infoPlist, key) {
  const {stdout} = await execFileAsync("/usr/bin/plutil", ["-extract", key, "raw", "-o", "-", infoPlist], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });
  const value = stdout.trim();
  if (!value) throw new Error(`Projector Info.plist has no ${key}`);
  return value;
}

export async function inspectProjectorRuntime({playerApp = DEFAULT_PROJECTOR_APP} = {}) {
  const requestedAppPath = path.resolve(playerApp);
  const appPath = await realpath(requestedAppPath).catch(() => {
    throw new Error(`Adobe Flash Player Projector app is missing: ${requestedAppPath}`);
  });
  const appInfo = await stat(appPath);
  if (!appInfo.isDirectory()) throw new Error(`Projector app is not a directory: ${appPath}`);
  const infoPlist = path.join(appPath, "Contents", "Info.plist");
  const [version, executableName] = await Promise.all([
    readPlistValue(infoPlist, "CFBundleShortVersionString"),
    readPlistValue(infoPlist, "CFBundleExecutable"),
  ]);
  const executablePath = await realpath(path.join(appPath, "Contents", "MacOS", executableName)).catch(() => {
    throw new Error(`Projector executable is missing from ${appPath}`);
  });
  const executableInfo = await stat(executablePath);
  if (!executableInfo.isFile()) throw new Error(`Projector executable is not a file: ${executablePath}`);
  return {
    runtimeId: "adobe-flash-player-projector",
    name: "Adobe Flash Player Projector",
    version,
    requestedAppPath,
    appPath,
    executablePath,
    executableSha256: await sha256File(executablePath),
  };
}

function normalizeRuntime(runtime) {
  const normalized = {
    runtimeId: runtime?.runtimeId,
    name: runtime?.name,
    version: runtime?.version,
    requestedAppPath: runtime?.requestedAppPath || runtime?.appPath,
    appPath: runtime?.appPath,
    executablePath: runtime?.executablePath,
    executableSha256: runtime?.executableSha256,
  };
  if (normalized.runtimeId !== "adobe-flash-player-projector" || normalized.name !== "Adobe Flash Player Projector") {
    throw new Error("Only the approved Adobe Flash Player Projector runtime may be bound into this kit");
  }
  for (const field of ["version", "appPath", "executablePath"]) {
    if (!String(normalized[field] || "").trim()) throw new Error(`Projector runtime ${field} is missing`);
  }
  assertSha256(normalized.executableSha256, "Projector executable identity");
  return normalized;
}

export async function verifyProjectorRuntimeBinding(runtime) {
  const normalized = normalizeRuntime(runtime);
  const [resolvedApp, resolvedExecutable] = await Promise.all([
    realpath(normalized.appPath).catch(() => { throw new Error(`Projector app is missing: ${normalized.appPath}`); }),
    realpath(normalized.executablePath).catch(() => { throw new Error(`Projector executable is missing: ${normalized.executablePath}`); }),
  ]);
  const [appInfo, executableInfo] = await Promise.all([stat(resolvedApp), stat(resolvedExecutable)]);
  if (!appInfo.isDirectory()) throw new Error(`Projector app is not a directory: ${resolvedApp}`);
  if (!executableInfo.isFile()) throw new Error(`Projector executable is not a file: ${resolvedExecutable}`);
  const executableRelative = path.relative(path.join(resolvedApp, "Contents", "MacOS"), resolvedExecutable);
  if (!executableRelative || executableRelative === ".." || executableRelative.startsWith(`..${path.sep}`) || path.isAbsolute(executableRelative)) {
    throw new Error("Projector executable is not inside the bound .app/Contents/MacOS directory");
  }
  const observedSha256 = await sha256File(resolvedExecutable);
  if (observedSha256 !== normalized.executableSha256) throw new Error("Projector executable SHA-256 is stale");
  return {...normalized, appPath: resolvedApp, executablePath: resolvedExecutable};
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
    format: row.format,
    channels: Number(row.channels),
    sampleRateHz: Number(row.sample_rate_hz),
    sourceCharacterId: row.source_character_id === "" ? null : Number(row.source_character_id),
  };
}

function cueTemplateFile(cue) {
  const safe = `${cue.cueId}-${cue.language}`.replace(/[^a-zA-Z0-9._-]+/g, "-");
  return `evidence/audio-listening-sessions/${safe}.template.json`;
}

function sessionTemplate({animationId, cue, runtime, host}) {
  return {
    schemaVersion: 1,
    evidenceType: "original-runtime-audio-listening-session",
    templateStatus: "unsigned-pending-human-listening",
    animationId,
    cue,
    reviewer: {
      kind: "human",
      fullName: "",
      role: "",
      organizationOrOwnerId: "",
      contact: "",
    },
    observedAt: null,
    runtime: {
      runtimeId: runtime.runtimeId,
      name: runtime.name,
      version: runtime.version,
      hostFile: host.file,
      hostSha256: host.sha256,
      toolchainReceipt: {file: RECEIPT_RELATIVE_PATH, sha256: null},
    },
    operationEvents: [
      {sequence: 1, action: "activate", observedAtMs: null, previousEventSha256: null, eventSha256: null},
      {sequence: 2, action: "start", observedAtMs: null, previousEventSha256: null, eventSha256: null},
      {sequence: 3, action: null, actionOptions: ["stop", "complete"], observedAtMs: null, previousEventSha256: null, eventSha256: null},
      {sequence: 4, action: "replay", observedAtMs: null, previousEventSha256: null, eventSha256: null},
      {sequence: 5, action: "start", observedAtMs: null, previousEventSha256: null, eventSha256: null},
    ],
    observations: {
      spokenContentAndLanguage: "pending",
      naturalHostTraversal: "pending",
      startStopAndSynchronization: "pending",
      replayReset: "pending",
    },
    artifacts: [],
    notes: "",
  };
}

function runtimeIdentityText(runtime) {
  return [
    `runtime_id=${runtime.runtimeId}`,
    `runtime_name=${runtime.name}`,
    `runtime_version=${runtime.version}`,
    `requested_application_path=${runtime.requestedAppPath}`,
    `resolved_application_path=${runtime.appPath}`,
    `resolved_executable_path=${runtime.executablePath}`,
    `executable_sha256=${runtime.executableSha256}`,
    "",
  ].join("\n");
}

function readme({animationId, collection, isAcuteEnglishOnly, cues, blockers, requirements}) {
  const scopeWarning = isAcuteEnglishOnly
    ? "This optional kit covers the available English acute-angle cue only. The missing Spanish source remains a strict blocker, so this kit cannot complete or unblock the migration."
    : collection === "course"
      ? "This kit covers every cue currently declared by the hash-bound course audio inventory. It prepares blank records only: each embedded cue's natural host reachability, language/content, timing, stop behavior, and Replay behavior remain unproven until a named human performs the original-runtime session."
      : "This kit covers every cue currently declared by the hash-bound formula audio inventory.";
  const blockerLines = blockers.length ? blockers.map((item) => `- ${item}`).join("\n") : "- None recorded by the machine audit at scaffold time.";
  const requirementLines = requirements.length ? requirements.map((item) => `- ${item}`).join("\n") : "- None beyond the standard named-human listening/session contract.";
  return `# Unsigned original-runtime audio session kit: ${animationId}

Status: **template only — not acceptance evidence**

${scopeWarning}

This directory is intentionally outside \`migrations/\`. Generating it does not change a migration status, acceptance decision, owner review, or strict-validator result. The helper does not launch or control Adobe Flash Player.

## Exact bound scope

- Runtime: the version and executable SHA-256 in \`${IDENTITY_RELATIVE_PATH}\`.
- Original host: see \`kit-manifest.json\`; launch the exact host there, not the child SWF alone.
- Cues: ${cues.map((cue) => `${cue.cueId}/${cue.language}${cue.sourceCharacterId === null ? "" : ` (source character ${cue.sourceCharacterId})`}`).join(", ")}.

## Human-only completion steps

1. A named human listener launches the exact original host in the bound Adobe Flash Player Projector and reaches the cue through the natural host controls.
2. Record a real runtime identity capture/log. Fill \`capturedAt\` in the receipt template, bind the artifact, rename the file to \`runtime-toolchain-receipt.json\`, and calculate its final SHA-256.
3. For each cue, fill the listener identity, actual \`observedAt\`, observed event times, the observed stop-or-complete action, SHA-256 event chain, conclusions, and at least one permitted runtime artifact. Do not infer Replay/audio behavior from the modern implementation.
4. Rehash the completed files, add their descriptors to the existing audio-listening acceptance record, and obtain the separately required named-human/owner review. Run the strict validator only after all evidence is complete.

Nothing in these templates is a \`pass\`. Empty fields, \`null\`, \`pending\`, the absent receipt SHA-256, and the empty artifact list are deliberate fail-closed controls.

For an embedded or interaction-state cue, do not fill a session merely because its bytes are present in the SWF. If the exact cue cannot be reached and identified through the original host's natural controls, leave the template pending and report that blocker.

## Machine-audit blockers retained in this kit

${blockerLines}

## Machine-audit requirements still requiring original-runtime work

${requirementLines}
`;
}

function normalizedManifestCue(item) {
  return {
    cueId: item.id || item.cueId,
    language: item.language,
    sourceFile: item.source || item.sourceFile,
    sha256: item.sha256,
    durationMs: Number(item.durationMs),
    startFrame: item.startFrame ?? null,
    startFrameDomainId: item.startFrameDomainId || null,
    startSemantics: item.startSemantics || "timeline-frame",
    format: item.format,
    channels: Number(item.channels),
    sampleRateHz: Number(item.sampleRateHz),
    sourceCharacterId: item.sourceCharacterId ?? null,
  };
}

const BASE_CUE_IDENTITY_FIELDS = Object.freeze([
    "cueId",
    "language",
    "sourceFile",
    "sha256",
    "durationMs",
    "startFrame",
    "startFrameDomainId",
    "startSemantics",
]);
const STRUCTURAL_CUE_IDENTITY_FIELDS = Object.freeze([
    "format",
    "channels",
    "sampleRateHz",
    "sourceCharacterId",
]);

function cueDiffers(left, right, fields) {
  return fields.some((field) => left[field] !== right[field]);
}

function matchingEmbeddedAuditCue({audit, cue}) {
  let match;
  if (cue.cueId.startsWith("embedded-define-sound-")) {
    const suffix = cue.cueId.slice("embedded-define-sound-".length);
    if (!/^\d{4}$/.test(suffix)) return null;
    match = (audit.embeddedAudio?.defineSounds || []).find(({characterId}) => characterId === Number(suffix));
    if (!match) return null;
    return {
      cueId: `embedded-define-sound-${String(match.characterId).padStart(4, "0")}`,
      durationMs: Number(match.durationMs),
      format: `swf-${match.format}`,
      channels: Number(match.channels),
      sampleRateHz: Number(match.sampleRateHz),
      sourceCharacterId: Number(match.characterId),
    };
  }
  if (cue.cueId.startsWith("embedded-stream-")) {
    const suffix = cue.cueId.slice("embedded-stream-".length);
    if (!/^\d{4}$/.test(suffix)) return null;
    match = (audit.embeddedAudio?.soundStreams || []).find(({streamIndex}) => streamIndex === Number(suffix));
    if (!match) return null;
    return {
      cueId: `embedded-stream-${String(match.streamIndex).padStart(4, "0")}`,
      durationMs: Number(match.durationMs),
      format: `swf-${match.format}-stream`,
      channels: Number(match.playbackChannels ?? match.channels),
      sampleRateHz: Number(match.playbackSampleRateHz ?? match.sampleRateHz),
      sourceCharacterId: Number(match.context?.characterId),
    };
  }
  return null;
}

async function collectWorkspaceEvidence({projectRoot, migrationsRoot, animationId, acuteEnglishOnly}) {
  const workspace = path.join(migrationsRoot, animationId);
  const manifestPath = path.join(workspace, "migration.json");
  const auditPath = path.join(workspace, "audit", "audio-runtime-evidence.json");
  const [manifestBytes, auditBytes] = await Promise.all([readFile(manifestPath), readFile(auditPath)]);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  const audit = JSON.parse(auditBytes.toString("utf8"));
  if (manifest.animationId !== animationId || audit.animationId !== animationId) throw new Error(`${animationId}: manifest/audit identity differs from workspace`);
  if (manifest.audio?.required !== true) throw new Error(`${animationId}: migration.audio.required is not true`);
  if (audit.acceptance?.structurallyAudited !== true) throw new Error(`${animationId}: machine audio audit is not structurally complete`);
  if (audit.source?.hashMatches !== true || audit.source?.expectedSha256 !== manifest.source?.swfSha256 || audit.source?.observedSha256 !== manifest.source?.swfSha256) {
    throw new Error(`${animationId}: machine audio audit does not bind the current source SWF`);
  }
  const sourceSwf = await hashBoundDeclaredFile({
    projectRoot,
    workspace,
    declared: manifest.source.swf,
    expectedSha256: manifest.source.swfSha256,
    label: `${animationId} source SWF`,
  });
  const inventoryFile = manifest.audio.inventoryFile || "audio-inventory.csv";
  const inventoryPath = path.join(workspace, inventoryFile);
  const inventoryBytes = await readFile(inventoryPath);
  let cues = parseAudioInventory(inventoryBytes.toString("utf8")).rows.map(cueIdentity);
  if (!cues.length) throw new Error(`${animationId}: audio inventory contains no cue`);
  if (acuteEnglishOnly) cues = cues.filter(({language}) => language === "en");
  if (!cues.length) throw new Error(`${animationId}: requested kit scope contains no cue`);

  const exactAssociations = audit.externalAudio?.exactAssociations || [];
  const manifestCues = (manifest.audio.cues || []).map(normalizedManifestCue);
  if (manifestCues.length !== cues.length) throw new Error(`${animationId}: manifest and inventory cue counts differ`);
  for (const cue of cues) {
    assertSha256(cue.sha256, `${animationId} ${cue.cueId}/${cue.language}`);
    if (!(cue.durationMs > 0)) throw new Error(`${animationId}: ${cue.cueId}/${cue.language} has no positive duration`);
    if (!(cue.channels > 0) || !(cue.sampleRateHz > 0) || !cue.format) throw new Error(`${animationId}: ${cue.cueId}/${cue.language} has incomplete structural audio metadata`);
    await hashBoundDeclaredFile({projectRoot, workspace, declared: cue.sourceFile, expectedSha256: cue.sha256, label: `${animationId} ${cue.cueId}/${cue.language}`});
    const declared = manifestCues.find((item) => item.cueId === cue.cueId && item.language === cue.language);
    const manifestFields = COURSE_AUDIO_SESSION_IDS.includes(animationId)
      ? [...BASE_CUE_IDENTITY_FIELDS, "format", "channels", "sampleRateHz"]
      : animationId === ACUTE_ANGLE_AUDIO_SESSION_ID
        ? ["cueId", "language", "startFrame", "startFrameDomainId", "startSemantics"]
        : BASE_CUE_IDENTITY_FIELDS;
    if (!declared || cueDiffers(declared, cue, manifestFields)) throw new Error(`${animationId}: ${cue.cueId}/${cue.language} differs from migration.audio.cues`);

    if (cue.sourceFile === manifest.source.swf) {
      if (cue.sha256 !== manifest.source.swfSha256 || cue.language !== "und" || cue.startSemantics !== "interaction-state") {
        throw new Error(`${animationId}: ${cue.cueId}/${cue.language} has an invalid embedded-source identity`);
      }
      const embedded = matchingEmbeddedAuditCue({audit, cue});
      if (
        !embedded || embedded.cueId !== cue.cueId || embedded.durationMs !== cue.durationMs || embedded.format !== cue.format ||
        embedded.channels !== cue.channels || embedded.sampleRateHz !== cue.sampleRateHz || embedded.sourceCharacterId !== cue.sourceCharacterId
      ) throw new Error(`${animationId}: ${cue.cueId}/${cue.language} differs from the embedded machine audio audit`);
    } else {
      const association = exactAssociations.find((item) => item.sourceFile === cue.sourceFile && item.languageAssessment?.language === cue.language);
      if (
        !association || association.observedSha256 !== cue.sha256 || association.catalogSha256 !== cue.sha256 || association.hashMatchesCatalog !== true ||
        Number(association.probe?.durationMs) !== cue.durationMs || Number(association.probe?.channels) !== cue.channels ||
        Number(association.probe?.sampleRateHz) !== cue.sampleRateHz || association.startSemantics !== cue.startSemantics
      ) throw new Error(`${animationId}: ${cue.cueId}/${cue.language} differs from the external machine audio audit`);
    }
  }

  const isFormula = FORMULA_AUDIO_SESSION_IDS.includes(animationId);
  const isCourse = COURSE_AUDIO_SESSION_IDS.includes(animationId);
  const missing = audit.externalAudio?.expectedButMissing || [];
  const candidates = audit.externalAudio?.lessonGroupCandidates || [];
  const followUp = audit.acceptance?.manifestFollowUp || [];
  if (!acuteEnglishOnly && (missing.length || candidates.length || followUp.length)) {
    throw new Error(`${animationId}: machine audit still has missing, candidate, or manifest-follow-up audio`);
  }
  if (isFormula && audit.authority?.hostScript?.conventions?.formula?.verified !== true) {
    throw new Error(`${animationId}: formula host convention is not verified`);
  }
  if (animationId === ACUTE_ANGLE_AUDIO_SESSION_ID && audit.authority?.hostScript?.conventions?.keyterm?.verified !== true) {
    throw new Error(`${animationId}: key-term host convention is not verified`);
  }
  if (isCourse && exactAssociations.length && audit.authority?.hostScript?.conventions?.courseSpanishPage?.verified !== true) {
    throw new Error(`${animationId}: course external-audio host convention is not verified`);
  }
  if (isCourse && cues.some(({sourceFile}) => sourceFile === manifest.source.swf) && !(audit.acceptance?.requirements || []).length) {
    throw new Error(`${animationId}: embedded cues have no explicit original-runtime listening/traversal requirements`);
  }

  const hostScript = audit.authority?.hostScript;
  const host = await hashBoundDeclaredFile({
    projectRoot,
    workspace,
    declared: hostScript?.sourceFile,
    expectedSha256: hostScript?.sha256,
    label: `${animationId} authoritative host`,
  });
  const blockers = [
    ...missing.map((item) => `${item.language || "unknown language"}: missing source ${item.sourceFile}`),
    ...candidates.map((item) => `unresolved candidate association: ${item.sourceFile || "unknown"}`),
    ...followUp.map((item) => `manifest follow-up: ${typeof item === "string" ? item : JSON.stringify(item)}`),
  ];
  return {
    workspace,
    manifest,
    audit,
    collection: isCourse ? "course" : manifest.classification?.collection,
    cues,
    blockers,
    requirements: audit.acceptance?.requirements || [],
    sourceSwf,
    host,
    bindings: {
      migrationManifest: {file: portable(path.relative(projectRoot, manifestPath)), sha256: digest(manifestBytes)},
      machineAudioAudit: {file: portable(path.relative(projectRoot, auditPath)), sha256: digest(auditBytes)},
      audioInventory: {file: portable(path.relative(projectRoot, inventoryPath)), sha256: digest(inventoryBytes)},
    },
  };
}

export async function buildAudioRuntimeSessionKit({
  projectRoot = PROJECT_ROOT,
  migrationsRoot = path.join(projectRoot, "migrations"),
  animationId,
  runtime,
  acuteEnglishOnly = false,
}) {
  if (!ALLOWED_IDS.has(animationId)) throw new Error(`Unsupported pilot animation ID: ${animationId}`);
  if (animationId === ACUTE_ANGLE_AUDIO_SESSION_ID && !acuteEnglishOnly) {
    throw new Error(`${animationId}: use the explicit --include-acute-english scope; Spanish audio is missing`);
  }
  if (animationId !== ACUTE_ANGLE_AUDIO_SESSION_ID && acuteEnglishOnly) throw new Error(`${animationId}: acuteEnglishOnly is only valid for acute angle`);
  const normalizedRuntime = await verifyProjectorRuntimeBinding(runtime);
  const evidence = await collectWorkspaceEvidence({projectRoot, migrationsRoot, animationId, acuteEnglishOnly});
  const identityText = runtimeIdentityText(normalizedRuntime);
  const identitySha256 = digest(identityText);
  const receipt = {
    schemaVersion: 1,
    evidenceType: "authorized-original-runtime-toolchain-receipt",
    templateStatus: "unsigned-pending-human-runtime-capture",
    runtime: {
      runtimeId: normalizedRuntime.runtimeId,
      name: normalizedRuntime.name,
      version: normalizedRuntime.version,
    },
    capturedAt: null,
    identityArtifacts: [{kind: "executable-sha256-receipt", file: IDENTITY_RELATIVE_PATH, sha256: identitySha256}],
    additionalHumanCapturedIdentityArtifacts: [],
    notes: "",
  };
  const files = new Map([
    [IDENTITY_RELATIVE_PATH, identityText],
    ["evidence/audio-runtime-sessions/runtime-toolchain-receipt.template.json", json(receipt)],
  ]);
  const sessions = evidence.cues.map((cue) => {
    const file = cueTemplateFile(cue);
    const content = json(sessionTemplate({animationId, cue, runtime: normalizedRuntime, host: evidence.host}));
    files.set(file, content);
    return {cueId: cue.cueId, language: cue.language, file, sha256: digest(content), intendedEvidenceFile: file.replace(/\.template\.json$/, ".json")};
  });
  const manifest = {
    schemaVersion: 1,
    evidenceType: "unsigned-original-runtime-audio-session-kit",
    animationId,
    status: "unsigned-template-only",
    strictAcceptanceEffect: "none",
    migrationFilesModified: false,
    humanOrOwnerAcceptanceRecorded: false,
    scope: acuteEnglishOnly
      ? "available-English-cue-only; Spanish missing source remains blocking"
      : evidence.collection === "course"
        ? "all-declared-course-audio-cues; natural host traversal and listening remain pending"
        : "all-declared-formula-audio-cues",
    bindings: {
      ...evidence.bindings,
      sourceSwf: evidence.sourceSwf,
      authoritativeHost: evidence.host,
    },
    runtime: normalizedRuntime,
    cues: evidence.cues,
    machineAuditBlockers: evidence.blockers,
    machineAuditRequirementsStillPending: evidence.requirements,
    templates: {
      runtimeIdentity: {file: IDENTITY_RELATIVE_PATH, sha256: identitySha256},
      runtimeReceipt: {
        file: "evidence/audio-runtime-sessions/runtime-toolchain-receipt.template.json",
        sha256: digest(files.get("evidence/audio-runtime-sessions/runtime-toolchain-receipt.template.json")),
        intendedEvidenceFile: RECEIPT_RELATIVE_PATH,
      },
      listeningSessions: sessions,
    },
    requiredHumanFieldsStillBlank: [
      "runtime receipt capturedAt and any human-captured identity artifact",
      "runtime receipt final SHA-256 in every listening session",
      "listener full name, role, organization/owner ID, and contact",
      "session observedAt and every operation observedAtMs",
      "observed stop-or-complete action and SHA-256 event chain",
      "all four per-cue observation decisions",
      "at least one hash-bound runtime capture/log artifact",
      "acceptance summary, named-human signature, and owner decision in the existing migration record",
    ],
  };
  files.set("kit-manifest.json", json(manifest));
  files.set("README.md", readme({
    animationId,
    collection: evidence.collection,
    isAcuteEnglishOnly: acuteEnglishOnly,
    cues: evidence.cues,
    blockers: evidence.blockers,
    requirements: evidence.requirements,
  }));
  return {animationId, manifest, files};
}

async function nearestExistingAncestor(target) {
  let current = target;
  while (!await exists(current)) {
    const parent = path.dirname(current);
    if (parent === current) throw new Error(`Cannot resolve an existing ancestor for ${target}`);
    current = parent;
  }
  return current;
}

export async function assertSafeKitOutputRoot({projectRoot = PROJECT_ROOT, outputRoot}) {
  const workRoot = path.resolve(projectRoot, "work");
  const resolvedOutput = path.resolve(outputRoot);
  const relative = path.relative(workRoot, resolvedOutput);
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Output must be a child directory of ${workRoot}`);
  }
  const [workAncestor, outputAncestor] = await Promise.all([nearestExistingAncestor(workRoot), nearestExistingAncestor(resolvedOutput)]);
  const [realWorkAncestor, realOutputAncestor] = await Promise.all([realpath(workAncestor), realpath(outputAncestor)]);
  const projectedWorkRoot = path.resolve(realWorkAncestor, path.relative(workAncestor, workRoot));
  const projectedOutput = path.resolve(realOutputAncestor, path.relative(outputAncestor, resolvedOutput));
  const realRelative = path.relative(projectedWorkRoot, projectedOutput);
  if (!realRelative || realRelative === ".." || realRelative.startsWith(`..${path.sep}`) || path.isAbsolute(realRelative)) {
    throw new Error("Output path escapes work/ through a symlink");
  }
  return resolvedOutput;
}

async function materializeKit({kit, outputRoot, check}) {
  const kitRoot = path.join(outputRoot, kit.animationId);
  const expected = [...kit.files].map(([relative, content]) => ({relative, content, file: path.join(kitRoot, relative)}));
  const expectedFiles = new Set(expected.map(({relative}) => relative));
  const expectedDirectories = new Set([""]);
  for (const {relative} of expected) {
    let directory = portable(path.dirname(relative));
    while (directory !== "." && !expectedDirectories.has(directory)) {
      expectedDirectories.add(directory);
      directory = portable(path.dirname(directory));
    }
  }
  async function inspectExistingTree(directory, relative = "") {
    const info = await lstat(directory);
    if (info.isSymbolicLink() || !info.isDirectory()) throw new Error(`${portable(path.relative(PROJECT_ROOT, directory))} is not a real directory`);
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
      const child = path.join(directory, entry.name);
      const childInfo = await lstat(child);
      if (childInfo.isSymbolicLink()) throw new Error(`${portable(path.relative(PROJECT_ROOT, child))} is a symbolic link`);
      if (childInfo.isDirectory()) {
        if (!expectedDirectories.has(childRelative)) throw new Error(`${portable(path.relative(PROJECT_ROOT, child))} is an unexpected directory in the unsigned kit`);
        await inspectExistingTree(child, childRelative);
      } else {
        if (!childInfo.isFile() || childInfo.nlink !== 1) throw new Error(`${portable(path.relative(PROJECT_ROOT, child))} is not an ordinary single-link file`);
        if (!expectedFiles.has(childRelative)) throw new Error(`${portable(path.relative(PROJECT_ROOT, child))} is unexpected session/evidence content in the unsigned kit`);
      }
    }
  }
  if (await exists(kitRoot)) await inspectExistingTree(kitRoot);
  for (const item of expected) {
    if (!await exists(item.file)) {
      if (check) throw new Error(`${portable(path.relative(PROJECT_ROOT, item.file))} is missing`);
      continue;
    }
    const observed = await readFile(item.file, "utf8");
    if (observed !== item.content) throw new Error(`${portable(path.relative(PROJECT_ROOT, item.file))} differs; refusing to overwrite an edited or stale kit`);
  }
  if (check) return {animationId: kit.animationId, kitRoot, status: "verified"};
  for (const item of expected) {
    if (await exists(item.file)) continue;
    await mkdir(path.dirname(item.file), {recursive: true});
    try {
      await writeFile(item.file, item.content, {encoding: "utf8", flag: "wx"});
    } catch (error) {
      if (error.code !== "EEXIST" || await readFile(item.file, "utf8") !== item.content) throw error;
    }
  }
  return {animationId: kit.animationId, kitRoot, status: "scaffolded"};
}

export async function scaffoldAudioRuntimeSessionKits({
  projectRoot = PROJECT_ROOT,
  migrationsRoot = path.join(projectRoot, "migrations"),
  outputRoot = path.join(projectRoot, DEFAULT_AUDIO_SESSION_KIT_ROOT),
  ids = FORMULA_AUDIO_SESSION_IDS,
  includeAcuteEnglish = false,
  runtime,
  check = false,
}) {
  const selected = [...new Set(ids)];
  if (includeAcuteEnglish && !selected.includes(ACUTE_ANGLE_AUDIO_SESSION_ID)) selected.push(ACUTE_ANGLE_AUDIO_SESSION_ID);
  if (selected.includes(ACUTE_ANGLE_AUDIO_SESSION_ID) && !includeAcuteEnglish) {
    throw new Error(`${ACUTE_ANGLE_AUDIO_SESSION_ID}: --include-acute-english is required because this is an English-only, non-unblocking kit`);
  }
  if (!selected.length) throw new Error("At least one animation ID is required");
  for (const id of selected) if (!ALLOWED_IDS.has(id)) throw new Error(`Unsupported pilot animation ID: ${id}`);
  const safeOutputRoot = await assertSafeKitOutputRoot({projectRoot, outputRoot});
  const normalizedRuntime = normalizeRuntime(runtime);
  const kits = [];
  for (const animationId of selected) {
    kits.push(await buildAudioRuntimeSessionKit({
      projectRoot,
      migrationsRoot,
      animationId,
      runtime: normalizedRuntime,
      acuteEnglishOnly: animationId === ACUTE_ANGLE_AUDIO_SESSION_ID,
    }));
  }
  const results = [];
  for (const kit of kits) results.push(await materializeKit({kit, outputRoot: safeOutputRoot, check}));
  return results;
}

function readinessMarkdown(report) {
  const rows = report.pilots.map((item) => {
    const reasons = item.reasons.length ? item.reasons.join("<br>") : "—";
    const kit = item.kit?.path ? `\`${item.kit.path}\`` : "—";
    return `| \`${item.animationId}\` | ${item.status} | ${item.cueCount} | ${kit} | ${reasons} |`;
  });
  return `# Pilot original-runtime audio session readiness

Status: **acceptance-neutral deterministic readiness report**

This report classifies whether current source-, host-, manifest-, inventory-, and machine-audit identities are sufficient to prepare an **unsigned** original-runtime listening template. A prepared template is not a runtime capture, listening result, human review, owner acceptance, or strict pass.

## Summary

- Pilot count: ${report.summary.pilotCount}
- Prepared unsigned kits: ${report.summary.preparedUnsignedKitCount}
- Fully scoped prepared kits: ${report.summary.fullyScopedPreparedCount}
- Partial, explicitly non-unblocking kits: ${report.summary.partialPreparedCount}
- Structurally not applicable: ${report.summary.notApplicableCount}
- Blocked before template preparation: ${report.summary.blockedCount}
- Declared cues in prepared kits: ${report.summary.preparedCueCount}

| Pilot | Readiness | Cues | Kit | Reasons / retained blockers |
|---|---:|---:|---|---|
${rows.join("\n")}

All prepared session files keep reviewer identity blank, timestamps null, observations pending, artifacts empty, and strict-acceptance effect none. Projector/Animate was not launched by this generator.
`;
}

async function materializeExactFiles({projectRoot, files, check}) {
  for (const {file, content} of files) {
    if (!await exists(file)) {
      if (check) throw new Error(`${portable(path.relative(projectRoot, file))} is missing`);
      continue;
    }
    if (await readFile(file, "utf8") !== content) throw new Error(`${portable(path.relative(projectRoot, file))} differs; refusing to overwrite a readiness report`);
  }
  if (check) return;
  for (const {file, content} of files) {
    if (await exists(file)) continue;
    await mkdir(path.dirname(file), {recursive: true});
    await writeFile(file, content, {encoding: "utf8", flag: "wx"});
  }
}

export async function buildPilotAudioSessionReadiness({
  projectRoot = PROJECT_ROOT,
  migrationsRoot = path.join(projectRoot, "migrations"),
  outputRoot = path.join(projectRoot, DEFAULT_AUDIO_SESSION_KIT_ROOT),
  runtime,
  pilotIds = PILOT_MIGRATIONS.map(({id}) => id),
  check = false,
}) {
  const safeOutputRoot = await assertSafeKitOutputRoot({projectRoot, outputRoot});
  const normalizedRuntime = await verifyProjectorRuntimeBinding(runtime);
  const pilots = [];
  for (const animationId of pilotIds) {
    const workspace = path.join(migrationsRoot, animationId);
    const manifestPath = path.join(workspace, "migration.json");
    const auditPath = path.join(workspace, "audit", "audio-runtime-evidence.json");
    const inventoryPath = path.join(workspace, "audio-inventory.csv");
    const [manifestBytes, auditBytes, inventoryBytes] = await Promise.all([
      readFile(manifestPath),
      readFile(auditPath),
      readFile(inventoryPath),
    ]);
    const manifest = JSON.parse(manifestBytes.toString("utf8"));
    const audit = JSON.parse(auditBytes.toString("utf8"));
    const inventoryRows = parseAudioInventory(inventoryBytes.toString("utf8")).rows;
    if (manifest.animationId !== animationId || audit.animationId !== animationId) throw new Error(`${animationId}: readiness identity mismatch`);
    const common = {
      animationId,
      sourceSwfSha256: manifest.source?.swfSha256,
      machineAudioAuditSha256: digest(auditBytes),
      audioInventorySha256: digest(inventoryBytes),
      cueCount: inventoryRows.length,
      reasons: [],
      kit: null,
    };
    if (manifest.audio?.required !== true) {
      const errors = [];
      if (inventoryRows.length) errors.push("audio.required is false but the inventory is not empty");
      if (audit.acceptance?.strictAudioAcceptance !== "accepted-not-required") errors.push("machine audit has no accepted-not-required structural disposition");
      if ((audit.externalAudio?.exactAssociations || []).length || (audit.externalAudio?.lessonGroupCandidates || []).length || (audit.externalAudio?.expectedButMissing || []).length) {
        errors.push("machine audit still contains external audio associations, candidates, or missing tracks");
      }
      if ((audit.embeddedAudio?.defineSounds || []).length || (audit.embeddedAudio?.soundStreams || []).some(({durationMs}) => Number(durationMs) > 0)) {
        errors.push("machine audit still contains positive-duration embedded audio");
      }
      await hashBoundDeclaredFile({projectRoot, workspace, declared: manifest.source.swf, expectedSha256: manifest.source.swfSha256, label: `${animationId} source SWF`});
      pilots.push({...common, status: errors.length ? "blocked-inconsistent-not-applicable" : "not-applicable-source-bound", reasons: errors.length ? errors : [manifest.audio.reasonNotRequired]});
      continue;
    }
    if (!ALLOWED_IDS.has(animationId)) {
      const reasons = [];
      if (!inventoryRows.length) reasons.push("audio inventory has no resolved cue rows");
      const missingCount = (audit.externalAudio?.expectedButMissing || []).length;
      const candidateCount = (audit.externalAudio?.lessonGroupCandidates || []).length;
      const followUpCount = (audit.acceptance?.manifestFollowUp || []).length;
      if (missingCount) reasons.push(`${missingCount} expected source audio path(s) are missing`);
      if (candidateCount) reasons.push(`${candidateCount} lesson-group candidate association(s) remain unresolved`);
      if (followUpCount) reasons.push(`${followUpCount} manifest follow-up item(s) remain unresolved`);
      if (!reasons.length) reasons.push("pilot is not in the explicit unsigned-session-kit allowlist");
      pilots.push({...common, status: "blocked-before-template", reasons});
      continue;
    }
    try {
      const kit = await buildAudioRuntimeSessionKit({
        projectRoot,
        migrationsRoot,
        animationId,
        runtime: normalizedRuntime,
        acuteEnglishOnly: animationId === ACUTE_ANGLE_AUDIO_SESSION_ID,
      });
      const kitManifestBytes = kit.files.get("kit-manifest.json");
      const kitManifestPath = path.join(safeOutputRoot, animationId, "kit-manifest.json");
      if (!await exists(kitManifestPath) || await readFile(kitManifestPath, "utf8") !== kitManifestBytes) {
        throw new Error("expected current unsigned kit is missing or differs from the current evidence projection");
      }
      const partial = animationId === ACUTE_ANGLE_AUDIO_SESSION_ID;
      pilots.push({
        ...common,
        status: partial ? "prepared-partial-non-unblocking" : "prepared-unsigned-template",
        reasons: partial ? kit.manifest.machineAuditBlockers : [],
        kit: {
          path: portable(path.relative(projectRoot, path.join(safeOutputRoot, animationId))),
          manifestSha256: digest(kitManifestBytes),
          templateCount: kit.manifest.templates.listeningSessions.length,
          strictAcceptanceEffect: "none",
        },
      });
    } catch (error) {
      pilots.push({...common, status: "blocked-before-template", reasons: [error.message]});
    }
  }
  const prepared = pilots.filter(({status}) => status.startsWith("prepared-"));
  const report = {
    schemaVersion: 1,
    evidenceType: "pilot-original-runtime-audio-session-readiness",
    status: "acceptance-neutral",
    strictAcceptanceEffect: "none",
    projectorOrAnimateLaunched: false,
    runtime: normalizedRuntime,
    summary: {
      pilotCount: pilots.length,
      preparedUnsignedKitCount: prepared.length,
      fullyScopedPreparedCount: prepared.filter(({status}) => status === "prepared-unsigned-template").length,
      partialPreparedCount: prepared.filter(({status}) => status === "prepared-partial-non-unblocking").length,
      notApplicableCount: pilots.filter(({status}) => status === "not-applicable-source-bound").length,
      blockedCount: pilots.filter(({status}) => status.startsWith("blocked-")).length,
      preparedCueCount: prepared.reduce((sum, {cueCount}) => sum + cueCount, 0),
    },
    pilots,
  };
  const jsonContent = json(report);
  const markdownContent = readinessMarkdown(report);
  const files = [
    {file: path.join(safeOutputRoot, "readiness-report.json"), content: jsonContent},
    {file: path.join(safeOutputRoot, "readiness-report.md"), content: markdownContent},
  ];
  await materializeExactFiles({projectRoot, files, check});
  return {report, files: files.map(({file}) => file)};
}

export function parseArguments(argv) {
  const options = {
    ids: [],
    includeAcuteEnglish: false,
    migrationsRoot: path.join(PROJECT_ROOT, "migrations"),
    outputRoot: path.join(PROJECT_ROOT, DEFAULT_AUDIO_SESSION_KIT_ROOT),
    playerApp: DEFAULT_PROJECTOR_APP,
    check: false,
    readinessReport: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    const takeValue = () => {
      const candidate = argv[index + 1];
      if (!candidate || candidate.startsWith("--")) throw new Error(`${value} requires a value`);
      index += 1;
      return candidate;
    };
    if (value === "--id") options.ids.push(takeValue());
    else if (value === "--include-acute-english") options.includeAcuteEnglish = true;
    else if (value === "--migrations") options.migrationsRoot = path.resolve(takeValue());
    else if (value === "--output") options.outputRoot = path.resolve(takeValue());
    else if (value === "--player-app") options.playerApp = path.resolve(takeValue());
    else if (value === "--check") options.check = true;
    else if (value === "--readiness-report") options.readinessReport = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  if (!options.ids.length) options.ids = [...FORMULA_AUDIO_SESSION_IDS];
  return options;
}

export function usage() {
  return `Usage: node scripts/scaffold-audio-runtime-session-kit.mjs [options]

Options:
  --id <animation-id>          Scaffold an explicitly allowlisted formula/course pilot; repeatable
  --include-acute-english      Also scaffold the available acute-angle English cue (never unblocks strict)
  --migrations <directory>     Migration root (default: migrations)
  --output <directory>         Output under work/ (default: ${DEFAULT_AUDIO_SESSION_KIT_ROOT})
  --player-app <path>          Exact Adobe Flash Player Projector .app to hash-bind
  --check                      Verify an existing untouched kit without writing
  --readiness-report           Also write/check a deterministic all-16 readiness index
  -h, --help                   Show this help

The command never launches Projector, never writes under migrations/ or source-assets/,
and never records a pass, listener identity, listening time, owner decision, or acceptance.
Generated files are unsigned templates and deliberately fail strict acceptance until a
named human completes and hash-binds real original-runtime evidence. Course embedded
cues remain pending unless the named human reaches and identifies each cue naturally.
`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const runtime = await inspectProjectorRuntime({playerApp: options.playerApp});
  const results = await scaffoldAudioRuntimeSessionKits({...options, projectRoot: PROJECT_ROOT, runtime});
  for (const result of results) {
    process.stdout.write(`${result.status}: ${portable(path.relative(PROJECT_ROOT, result.kitRoot))}\n`);
  }
  if (options.readinessReport) {
    const readiness = await buildPilotAudioSessionReadiness({...options, projectRoot: PROJECT_ROOT, runtime});
    process.stdout.write(`readiness: ${portable(path.relative(PROJECT_ROOT, readiness.files[0]))}\n`);
  }
  process.stdout.write("No migration acceptance/status/review file was changed. All human conclusions remain pending.\n");
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
