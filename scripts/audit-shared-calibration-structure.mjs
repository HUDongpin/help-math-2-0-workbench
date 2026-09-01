#!/usr/bin/env node

/**
 * Run a bounded, source-only structural audit for the G6–G8 shared-page
 * calibration set.
 *
 * This command is deliberately narrower than the shared-page factory.  It
 * reads the profile's calibrationSet and the checked-in shared catalog,
 * verifies the selected SWF bytes, and invokes FFDec/swfmill only for
 * structural evidence.  It never writes source, migration, registry, or
 * product files and it never creates a JavaScript renderer or an acceptance
 * decision.
 */

import {createHash, randomUUID} from "node:crypto";
import {spawn} from "node:child_process";
import {lstat, mkdir, readFile, readdir, rename, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {validateSharedProfile} from "./lib/g678-shared-catalog.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const FACTORY_ROOT_NAME = "g678-shared-page-factory";
export const DEFAULT_PROFILE = "catalog/g678-shared-source-profile.v1.json";
export const DEFAULT_CATALOG = "catalog/g678-shared-catalog.v1.json";
export const DEFAULT_OUTPUT = `work/${FACTORY_ROOT_NAME}/calibration-structure-v1`;
export const REPORT_FILE = "report.json";
export const REPORT_SCHEMA_VERSION = 1;
export const DEFAULT_TIMEOUT_MS = 120_000;
export const DEFAULT_CONCURRENCY = 2;
export const MAX_TIMEOUT_MS = 900_000;
export const MAX_CONCURRENCY = 4;
export const DEFAULT_MAX_OUTPUT_BYTES = 32 * 1024 * 1024;
export const MAX_OUTPUT_BYTES = 256 * 1024 * 1024;
const SHA256 = /^[a-f0-9]{64}$/u;

/**
 * This is intentionally an explicit, broad all-false boundary.  Keeping the
 * names used by both the source catalog and the factory manifests makes it
 * difficult for a structural report to be mistaken for product evidence.
 */
export const ALL_FALSE_ACCEPTANCE_EFFECTS = Object.freeze({
  canonicalSourcePromoted: false,
  sourceCustodyChanged: false,
  modernCourseUiChanged: false,
  modernMyLessonHostChanged: false,
  legacyFlashCourseShellConverted: false,
  currentJavaScriptRegistered: false,
  avm1BehaviorCompiled: false,
  nestedAudioPlaybackCompiled: false,
  authoritativeOriginalRuntime: false,
  originalRuntimeAccepted: false,
  behaviorAccepted: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  released: false,
  published: false,
});

export class CalibrationAuditError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "CalibrationAuditError";
    this.code = code;
    this.details = details;
  }
}

function invariant(condition, code, message, details = {}) {
  if (!condition) throw new CalibrationAuditError(code, message, details);
}

function portable(value) {
  return String(value).split(path.sep).join("/");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort((a, b) => a.localeCompare(b, "en"))
    .map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

export function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function fileIdentity(filePath, {allowSymlink = false, label = "file"} = {}) {
  let info;
  try {
    info = await lstat(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new CalibrationAuditError("FILE_MISSING", `${label}: file does not exist`, {path: filePath});
    }
    throw error;
  }
  invariant(info.isFile() && (allowSymlink || !info.isSymbolicLink()), "FILE_NOT_REGULAR",
    `${label}: expected a regular non-symlink file`, {path: filePath});
  const bytes = await readFile(filePath);
  return Object.freeze({
    bytes: bytes.length,
    sha256: sha256Bytes(bytes),
    mode: `0${(info.mode & 0o777).toString(8)}`,
    writable: (info.mode & 0o222) !== 0,
  });
}

async function binding(filePath, label, {allowSymlink = false} = {}) {
  const identity = await fileIdentity(filePath, {allowSymlink, label});
  return Object.freeze({path: filePath, ...identity});
}

async function readJsonBinding(filePath, label) {
  let info;
  try {
    info = await lstat(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new CalibrationAuditError("FILE_MISSING", `${label}: file does not exist`, {path: filePath});
    }
    throw error;
  }
  invariant(info.isFile() && !info.isSymbolicLink(), "FILE_NOT_REGULAR",
    `${label}: expected a regular non-symlink file`, {path: filePath});
  const bytes = await readFile(filePath);
  const file = Object.freeze({
    path: filePath,
    bytes: bytes.length,
    sha256: sha256Bytes(bytes),
    mode: `0${(info.mode & 0o777).toString(8)}`,
    writable: (info.mode & 0o222) !== 0,
  });
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new CalibrationAuditError("JSON_INVALID", `${label}: invalid JSON`, {
      path: filePath,
      cause: error.message,
    });
  }
  invariant(value && typeof value === "object" && !Array.isArray(value), "JSON_INVALID",
    `${label}: expected an object`, {path: filePath});
  return Object.freeze({file, value});
}

function resolveProjectPath(value, projectRoot, label, {allowAbsolute = false} = {}) {
  invariant(typeof value === "string" && value.length > 0, "PATH_INVALID", `${label}: path is required`);
  if (path.isAbsolute(value)) {
    invariant(allowAbsolute, "ABSOLUTE_PATH_FORBIDDEN", `${label}: absolute paths are not allowed`);
    return path.resolve(value);
  }
  const normalized = path.normalize(value);
  invariant(normalized !== ".." && !normalized.startsWith(`..${path.sep}`), "PATH_ESCAPES_ROOT",
    `${label}: path escapes project root`);
  return path.resolve(projectRoot, normalized);
}

function ensureWithin(target, root, code, label) {
  const absoluteTarget = path.resolve(target);
  const absoluteRoot = path.resolve(root);
  invariant(absoluteTarget === absoluteRoot || absoluteTarget.startsWith(`${absoluteRoot}${path.sep}`), code,
    `${label}: path must remain below ${absoluteRoot}`, {target: absoluteTarget, root: absoluteRoot});
  return absoluteTarget;
}

function parsePositiveInteger(value, label, {maximum = Number.MAX_SAFE_INTEGER} = {}) {
  const number = Number(value);
  invariant(Number.isSafeInteger(number) && number > 0 && number <= maximum, "ARGUMENT_INVALID",
    `${label}: expected an integer between 1 and ${maximum}`);
  return number;
}

export function parseArguments(argv) {
  const options = {
    profile: DEFAULT_PROFILE,
    catalog: DEFAULT_CATALOG,
    sourceRoot: null,
    output: DEFAULT_OUTPUT,
    check: false,
    ffdec: "ffdec",
    swfmill: "swfmill",
    timeoutMs: DEFAULT_TIMEOUT_MS,
    concurrency: DEFAULT_CONCURRENCY,
    maxOutputBytes: DEFAULT_MAX_OUTPUT_BYTES,
    requireReadOnly: true,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const take = () => {
      invariant(index + 1 < argv.length, "ARGUMENT_VALUE_MISSING", `${argument}: value is required`);
      return argv[++index];
    };
    if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else if (argument === "--check") {
      options.check = true;
    } else if (argument === "--profile") {
      options.profile = take();
    } else if (argument === "--catalog") {
      options.catalog = take();
    } else if (argument === "--source-root") {
      options.sourceRoot = take();
    } else if (argument === "--output") {
      options.output = take();
    } else if (argument === "--ffdec") {
      options.ffdec = take();
    } else if (argument === "--swfmill") {
      options.swfmill = take();
    } else if (argument === "--timeout-ms" || argument === "--timeout") {
      options.timeoutMs = parsePositiveInteger(take(), "--timeout-ms", {maximum: MAX_TIMEOUT_MS});
    } else if (argument === "--concurrency" || argument === "--max-concurrency" || argument === "--jobs") {
      options.concurrency = parsePositiveInteger(take(), "--concurrency", {maximum: MAX_CONCURRENCY});
    } else if (argument === "--max-output-bytes") {
      options.maxOutputBytes = parsePositiveInteger(take(), "--max-output-bytes", {maximum: MAX_OUTPUT_BYTES});
    } else if (argument === "--require-read-only") {
      options.requireReadOnly = true;
    } else if (argument === "--allow-writable-source") {
      options.requireReadOnly = false;
    } else {
      throw new CalibrationAuditError("ARGUMENT_UNKNOWN", `unknown argument: ${argument}`);
    }
  }
  return Object.freeze(options);
}

export function helpText() {
  return `G6–G8 shared calibration structural audit

Usage:
  node scripts/audit-shared-calibration-structure.mjs --profile <profile.json> --catalog <catalog.json> --source-root <private-root> --output <work-dir> [options]
  node scripts/audit-shared-calibration-structure.mjs --check --profile <profile.json> --catalog <catalog.json> --source-root <private-root> --output <work-dir>

Options:
  --profile <path>             profile containing calibrationSet (default ${DEFAULT_PROFILE})
  --catalog <path>             checked-in shared source catalog (default ${DEFAULT_CATALOG})
  --source-root <path>         private source parent or G6-G8-shared directory
  --output <directory>         create-exclusive work output (default ${DEFAULT_OUTPUT})
  --check                      verify an existing report and artifacts without invoking tools
  --ffdec <command>            FFDec launcher (default ffdec)
  --swfmill <command>          swfmill launcher (default swfmill)
  --timeout-ms <milliseconds> per-command timeout (default ${DEFAULT_TIMEOUT_MS})
  --concurrency <count>        maximum concurrent placements (default ${DEFAULT_CONCURRENCY})
  --max-output-bytes <bytes>   cap each captured command stream (default ${DEFAULT_MAX_OUTPUT_BYTES})
  --require-read-only          require selected source SWFs to have no write bits (default)
  --allow-writable-source      fixture-only override; audit still never writes source bytes

Only structural machine evidence is emitted. JavaScript, runtime, fidelity, audio, review, strict, release, and publication gates remain false.
`;
}

function calibrationEntries(profile) {
  const declared = Array.isArray(profile?.calibrationSet)
    ? profile.calibrationSet
    : profile?.calibrationSet?.pages ?? profile?.calibrationSet?.members ??
      profile?.calibration?.pages ?? profile?.calibration?.members;
  invariant(Array.isArray(declared) && declared.length > 0, "CALIBRATION_SET_MISSING",
    "profile calibrationSet must be a non-empty array");
  const seen = new Set();
  return declared.map((entry, index) => {
    invariant(entry && typeof entry === "object" && !Array.isArray(entry), "CALIBRATION_ENTRY_INVALID",
      `calibration entry ${index + 1} must be an object`);
    let moduleCode = String(entry.moduleCode ?? entry.module ?? "").trim().toUpperCase();
    let lessonNumber = Number(entry.lessonNumber ?? entry.lesson);
    let ordinalValue = entry.ordinal ?? entry.xmlOccurrence ?? entry.pageOrdinal ?? null;
    const placementId = entry.placementId ?? null;
    if ((!moduleCode || !Number.isSafeInteger(lessonNumber)) && typeof placementId === "string") {
      const idMatch = placementId.match(/^shared-([a-z0-9]+)-l(\d+)-p(\d+)$/iu);
      if (idMatch) {
        moduleCode ||= idMatch[1].toUpperCase();
        if (!Number.isSafeInteger(lessonNumber)) lessonNumber = Number(idMatch[2]);
        if (ordinalValue === null) ordinalValue = Number(idMatch[3]);
      }
    }
    invariant(/^[A-Z][A-Z0-9]{2,15}$/u.test(moduleCode), "CALIBRATION_ENTRY_INVALID",
      `calibration entry ${index + 1} has an invalid moduleCode`);
    invariant(Number.isSafeInteger(lessonNumber) && lessonNumber > 0, "CALIBRATION_ENTRY_INVALID",
      `calibration entry ${index + 1} has an invalid lessonNumber`);
    invariant(ordinalValue !== null || typeof placementId === "string", "CALIBRATION_ENTRY_INVALID",
      `calibration entry ${index + 1} requires ordinal or placementId`);
    const ordinal = ordinalValue === null ? null : parsePositiveInteger(ordinalValue, `calibration entry ${index + 1} ordinal`);
    const derivedPlacementId = `shared-${moduleCode.toLowerCase()}-l${String(lessonNumber).padStart(2, "0")}-p${String(ordinal ?? 0).padStart(3, "0")}`;
    const id = typeof placementId === "string" && placementId.length > 0 ? placementId : derivedPlacementId;
    invariant(/^shared-[a-z0-9]+-l\d{2}-p\d{3}$/u.test(id), "CALIBRATION_ENTRY_INVALID",
      `calibration entry ${index + 1} has an invalid placementId`);
    invariant(!seen.has(id), "CALIBRATION_DUPLICATE", `duplicate calibration placement: ${id}`);
    seen.add(id);
    return Object.freeze({
      moduleCode,
      lessonNumber,
      ordinal,
      placementId: id,
      declaredLane: entry.lane ?? null,
      selectionRole: entry.selectionRole ?? entry.role ?? null,
      selectionReason: entry.selectionReason ?? entry.reason ?? null,
    });
  });
}

function flattenCatalogPages(catalog) {
  invariant(Array.isArray(catalog?.lessons), "CATALOG_INVALID", "catalog lessons must be an array");
  return catalog.lessons.flatMap((lesson) => Array.isArray(lesson?.pages)
    ? lesson.pages.map((page) => ({lesson, page}))
    : []);
}

function catalogPageForSelection(catalog, selection) {
  const matches = flattenCatalogPages(catalog).filter(({page}) => page?.placementId === selection.placementId);
  invariant(matches.length === 1, "CALIBRATION_NOT_IN_CATALOG",
    `${selection.placementId}: expected exactly one checked-in catalog page`, {matches: matches.length});
  const {lesson, page} = matches[0];
  invariant(String(page.moduleCode ?? lesson.moduleCode).toUpperCase() === selection.moduleCode,
    "CATALOG_PLACEMENT_MISMATCH", `${selection.placementId}: moduleCode drifted`);
  invariant(Number(page.lessonNumber ?? lesson.lessonNumber) === selection.lessonNumber,
    "CATALOG_PLACEMENT_MISMATCH", `${selection.placementId}: lessonNumber drifted`);
  const observedOrdinal = Number(page.xmlOccurrence ?? page.globalOrdinal ?? page.ordinal);
  if (selection.ordinal !== null) {
    invariant(observedOrdinal === selection.ordinal, "CALIBRATION_ORDINAL_DRIFT",
      `${selection.placementId}: catalog ordinal drifted`, {expected: selection.ordinal, actual: observedOrdinal});
  }
  const sourceSha256 = page.sourceSha256 ?? page.source?.sha256 ?? null;
  const sourceBytes = page.sourceBytes ?? page.source?.bytes ?? null;
  invariant(typeof sourceSha256 === "string" && SHA256.test(sourceSha256), "CATALOG_SOURCE_HASH_INVALID",
    `${selection.placementId}: catalog source SHA-256 is missing or invalid`);
  invariant(Number.isSafeInteger(Number(sourceBytes)) && Number(sourceBytes) > 0,
    "CATALOG_SOURCE_BYTES_INVALID", `${selection.placementId}: catalog source byte count is invalid`);
  invariant(page.assetId === undefined || page.assetId === null || page.assetId === `swf-${sourceSha256}`,
    "CATALOG_ASSET_ID_DRIFT", `${selection.placementId}: catalog assetId does not match source SHA-256`);
  if (page.sourceStatus !== undefined) {
    invariant(page.sourceStatus === "resolved-canonical", "CATALOG_SOURCE_NOT_CANONICAL",
      `${selection.placementId}: catalog source is not resolved-canonical`, {status: page.sourceStatus});
  }
  if (page.sourceRootKind !== undefined) {
    invariant(["canonical", "canonical-newhelp"].includes(page.sourceRootKind),
      "CATALOG_SOURCE_NOT_CANONICAL", `${selection.placementId}: catalog source root kind is not canonical`);
  }
  const flags = page.flags ?? page.source?.flags ?? null;
  if (flags) {
    invariant(flags.referenced !== false && flags.unreferenced !== true && flags.variant !== true && flags.shell !== true,
      "CATALOG_PAGE_INELIGIBLE", `${selection.placementId}: catalog page is inactive, variant, or shell`);
  }
  if (page.acceptanceEffects) {
    invariant(!Object.values(page.acceptanceEffects).some((value) => value === true),
      "CATALOG_ACCEPTANCE_DRIFT", `${selection.placementId}: catalog page contains a true acceptance effect`);
  }
  const candidatePath = page.viewPath ?? page.sourcePath ?? page.expectedPath ?? page.reference;
  invariant(typeof candidatePath === "string" && /\.swf$/iu.test(candidatePath), "CATALOG_SOURCE_PATH_INVALID",
    `${selection.placementId}: catalog SWF path is missing or not a SWF`);
  invariant(!/^index(?:[^/]*)?\.swf$/iu.test(path.posix.basename(candidatePath)), "CATALOG_SHELL_REJECTED",
    `${selection.placementId}: legacy course shell path is not allowed`);
  return Object.freeze({selection, lesson, page, sourceSha256, sourceBytes: Number(sourceBytes), candidatePath});
}

async function resolveSourceRoot(sourceRootValue, profile, projectRoot) {
  const configured = sourceRootValue ??
    (typeof profile?.sourceViewPath === "string" && !/^\$[A-Z][A-Z0-9_]*$/u.test(profile.sourceViewPath)
      ? profile.sourceViewPath
      : null) ??
    (profile?.sourceView?.rootEnv ? process.env[profile.sourceView.rootEnv] : null) ??
    process.env.HELP_MATH_G678_SOURCE_ROOT;
  invariant(configured, "SOURCE_ROOT_MISSING", "--source-root or the profile source-root environment variable is required");
  const absolute = path.isAbsolute(configured) ? path.resolve(configured) : path.resolve(projectRoot, configured);
  const relativeRoot = portable(path.normalize(String(
    profile?.sourceView?.relativeRoot ?? profile?.canonicalRootRule?.relativePath ?? "G6-G8-shared",
  ).replace(/^\/+/, "")));
  let canonicalRoot = absolute;
  const directName = path.basename(relativeRoot);
  if (path.basename(absolute) !== directName) {
    const nested = path.resolve(absolute, relativeRoot);
    try {
      const info = await lstat(nested);
      if (info.isDirectory() && !info.isSymbolicLink()) canonicalRoot = nested;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  const info = await lstat(canonicalRoot).catch((error) => {
    if (error?.code === "ENOENT") throw new CalibrationAuditError("SOURCE_ROOT_MISSING",
      `source root does not exist: ${canonicalRoot}`, {sourceRoot: canonicalRoot});
    throw error;
  });
  invariant(info.isDirectory() && !info.isSymbolicLink(), "SOURCE_ROOT_INVALID",
    `source root must be a non-symlink directory: ${canonicalRoot}`);
  return Object.freeze({configured, canonicalRoot, relativeRoot});
}

function sourceRelativePath(candidatePath, selection) {
  let value = portable(String(candidatePath).replace(/^\/+/, ""));
  const canonicalPrefix = "G6-G8-shared/";
  if (value.startsWith(canonicalPrefix)) value = value.slice(canonicalPrefix.length);
  if (value.startsWith("HELP_COURSES/")) value = value.slice("HELP_COURSES/".length);
  const modulePrefix = `${selection.moduleCode}/L${selection.lessonNumber}/`;
  const moduleIndex = value.toUpperCase().indexOf(modulePrefix.toUpperCase());
  if (moduleIndex >= 0) value = value.slice(moduleIndex);
  if (!value.toUpperCase().startsWith(modulePrefix.toUpperCase())) {
    value = path.posix.join(selection.moduleCode, `L${selection.lessonNumber}`, value);
  }
  const normalized = path.posix.normalize(value);
  invariant(normalized !== "." && normalized !== ".." && !normalized.startsWith("../") && /\.swf$/iu.test(normalized),
    "SOURCE_PATH_INVALID", `${selection.placementId}: unsafe SWF source path`, {candidatePath});
  return normalized;
}

async function resolveSelectedSources(profileBinding, catalogBinding, sourceRootValue, projectRoot, {requireReadOnly = true} = {}) {
  const profile = profileBinding.value;
  const catalog = catalogBinding.value;
  const profileErrors = validateSharedProfile(profile);
  // The checked-in profile has a strict project contract.  Synthetic fixture
  // profiles used by focused tests may intentionally omit that contract; in
  // that case the local shape checks below remain authoritative.
  if (profile.profileId === "g678-shared-source-profile-v1") {
    invariant(profileErrors.length === 0, "PROFILE_INVALID", profileErrors.join("; "));
  }
  invariant(catalog.schemaVersion === 1 && catalog.catalogKind === "help-math-g678-shared-source-catalog",
    "CATALOG_INVALID", "checked-in catalog schema/kind mismatch");
  invariant(!Object.values(catalog.acceptanceEffects ?? {}).some((value) => value === true),
    "CATALOG_ACCEPTANCE_DRIFT", "checked-in catalog contains a true acceptance effect");
  if (catalog.profileId !== undefined) {
    invariant(catalog.profileId === profile.profileId, "CATALOG_PROFILE_MISMATCH",
      "catalog profileId does not match profile");
  }
  if (profile.sourceManifestSha256 && catalog.generatedFrom?.sourceManifestSha256) {
    invariant(profile.sourceManifestSha256 === catalog.generatedFrom.sourceManifestSha256,
      "CATALOG_PROFILE_MISMATCH", "catalog source-manifest binding does not match profile");
  }
  const sourceRoot = await resolveSourceRoot(sourceRootValue, profile, projectRoot);
  const selections = calibrationEntries(profile);
  const records = [];
  for (const selection of selections) {
    const catalogRecord = catalogPageForSelection(catalog, selection);
    const relative = sourceRelativePath(catalogRecord.candidatePath, selection);
    const sourcePath = ensureWithin(path.resolve(sourceRoot.canonicalRoot, relative), sourceRoot.canonicalRoot,
      "SOURCE_PATH_ESCAPES_ROOT", `${selection.placementId} source`);
    const source = await binding(sourcePath, `${selection.placementId} SWF`);
    invariant(source.sha256 === catalogRecord.sourceSha256 && source.bytes === catalogRecord.sourceBytes,
      "SOURCE_HASH_DRIFT", `${selection.placementId}: source bytes/hash differ from checked-in catalog`, {
        path: sourcePath,
        expectedSha256: catalogRecord.sourceSha256,
        actualSha256: source.sha256,
        expectedBytes: catalogRecord.sourceBytes,
        actualBytes: source.bytes,
      });
    if (requireReadOnly) {
      invariant(source.writable === false, "SOURCE_WRITABLE", `${selection.placementId}: source SWF must be read-only`, {
        path: sourcePath,
        mode: source.mode,
      });
    }
    records.push(Object.freeze({
      ...catalogRecord,
      sourcePath,
      source,
      sourceRelativePath: relative,
    }));
  }
  return Object.freeze({sourceRoot, selections, records});
}

function redactArg(argument, sourcePath, outputRoot) {
  if (argument === sourcePath) return "<SWF>";
  if (argument === outputRoot) return "<OUTPUT>";
  return argument;
}

/** Run one child process, capturing bounded stdout/stderr without a shell. */
export async function runBoundedCommand({command, args, cwd, stdoutPath, stderrPath, timeoutMs, maxOutputBytes}) {
  await mkdir(path.dirname(stdoutPath), {recursive: true});
  const started = process.hrtime.bigint();
  const stdoutChunks = [];
  const stderrChunks = [];
  let stdoutBytes = 0;
  let stderrBytes = 0;
  let outputLimitExceeded = false;
  let timedOut = false;
  let spawnError = null;
  let exitCode = null;
  let signal = null;
  let child;
  const append = (chunks, chunk, current, streamName) => {
    const bytes = Buffer.byteLength(chunk);
    if (current + bytes <= maxOutputBytes) chunks.push(Buffer.from(chunk));
    else outputLimitExceeded = true;
    return current + bytes;
  };
  await new Promise((resolve) => {
    try {
      child = spawn(command, args, {
        cwd,
        env: {...process.env, NO_COLOR: "1", FORCE_COLOR: "0"},
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      spawnError = error;
      resolve();
      return;
    }
    let killTimer = null;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      killTimer = setTimeout(() => child.kill("SIGKILL"), 1_000);
    }, timeoutMs);
    child.stdout.on("data", (chunk) => { stdoutBytes = append(stdoutChunks, chunk, stdoutBytes, "stdout"); });
    child.stderr.on("data", (chunk) => { stderrBytes = append(stderrChunks, chunk, stderrBytes, "stderr"); });
    child.once("error", (error) => { spawnError = error; });
    child.once("close", (code, observedSignal) => {
      clearTimeout(timeout);
      if (killTimer) clearTimeout(killTimer);
      exitCode = code;
      signal = observedSignal;
      resolve();
    });
  });
  const stdout = Buffer.concat(stdoutChunks);
  const stderr = Buffer.concat(stderrChunks);
  await writeFile(stdoutPath, stdout, {flag: "wx", mode: 0o444});
  await writeFile(stderrPath, stderr, {flag: "wx", mode: 0o444});
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
  const stdoutIdentity = await fileIdentity(stdoutPath, {label: "command stdout"});
  const stderrIdentity = await fileIdentity(stderrPath, {label: "command stderr"});
  return Object.freeze({
    command,
    args,
    exitCode,
    signal,
    timedOut,
    outputLimitExceeded,
    stdoutBytes,
    stderrBytes,
    elapsedMs: Number(elapsedMs.toFixed(3)),
    spawnError: spawnError ? String(spawnError.message || spawnError) : null,
    stdout: stdoutIdentity,
    stderr: stderrIdentity,
    stdoutPath,
    stderrPath,
    stdoutText: stdout.toString("utf8"),
    stderrText: stderr.toString("utf8"),
    success: !spawnError && !timedOut && !outputLimitExceeded && exitCode === 0,
  });
}

function attributeValue(tag, name) {
  const match = String(tag).match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "iu"));
  return match?.[1] ?? null;
}

function numberAttribute(tag, name) {
  const value = attributeValue(tag, name);
  if (value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function parseFfdecHeader(text) {
  const values = {};
  for (const line of String(text ?? "").replace(/\u001b\[[0-9;]*m/gu, "").split(/\r?\n/u)) {
    const match = line.match(/^\s*([^=:#]+?)\s*=\s*(.*?)\s*$/u);
    if (!match) continue;
    values[match[1].trim()] = match[2].trim();
  }
  const number = (keys) => {
    for (const key of keys) {
      const candidate = Number(values[key]);
      if (Number.isFinite(candidate)) return candidate;
    }
    return null;
  };
  const displayRectRaw = values.displayRect ?? values.rect ?? null;
  const displayRect = displayRectRaw
    ? [...displayRectRaw.matchAll(/-?\d+(?:\.\d+)?/gu)].map((match) => Number(match[0]))
    : [];
  const result = {
    version: number(["version", "swfVersion"]),
    compression: values.compression ?? null,
    encrypted: values.encrypted ?? null,
    frameCount: number(["frameCount", "frames"]),
    frameRate: number(["frameRate", "fps"]),
    widthPx: number(["widthPx"]),
    heightPx: number(["heightPx"]),
    widthTwips: number(["width"]),
    heightTwips: number(["height"]),
    displayRect: displayRect.length === 4 ? displayRect : null,
    rawKeyCount: Object.keys(values).length,
  };
  invariant(result.rawKeyCount > 0, "TOOL_OUTPUT_INVALID", "FFDec -header produced no parseable fields");
  return Object.freeze(result);
}

function countTag(text, name) {
  return [...String(text ?? "").matchAll(new RegExp(`<${name}(?:\\s|/|>)`, "giu"))].length;
}

export function parseFfdecDump(text) {
  const source = String(text ?? "");
  const tags = {};
  for (const match of source.matchAll(/(?:tagName|type)=([A-Za-z][A-Za-z0-9]*)/gu)) {
    const name = match[1];
    tags[name] = (tags[name] ?? 0) + 1;
  }
  // FFDec's text dump commonly prints the tag name immediately before the
  // numeric `tagId` field (for example `SetBackgroundColor tagId= 9`), while
  // fixture/proxy output may use `tagId=12 DoAction`. Keep both forms.
  for (const match of source.matchAll(/\btagId\s*=\s*\d+\s+([A-Z][A-Za-z0-9]*)(?!\s*=)/gu)) {
    const name = match[1];
    tags[name] = (tags[name] ?? 0) + 1;
  }
  for (const match of source.matchAll(/^\s*(?:[0-9a-f]+:\s*)?(?:\d+\.\s*)?([A-Za-z][A-Za-z0-9]*)[^\n]*\btagId\s*=\s*\d+/gimu)) {
    const name = match[1];
    tags[name] = (tags[name] ?? 0) + 1;
  }
  for (const name of ["DoAction", "DoInitAction", "DoABC", "DoABC2", "DefineSprite", "DefineButton", "DefineButton2", "DefineSound", "SoundStreamHead", "SoundStreamBlock", "ShowFrame"]) {
    if (!tags[name]) tags[name] = countTag(source, name);
  }
  return Object.freeze({
    lineCount: source ? source.split(/\r?\n/u).length : 0,
    tagRecordCount: [...source.matchAll(/tagId\s*=/gu)].length,
    tags: Object.fromEntries(Object.entries(tags).filter(([, value]) => value > 0).sort(([a], [b]) => a.localeCompare(b, "en"))),
    actionScriptTagCount: (tags.DoAction ?? 0) + (tags.DoInitAction ?? 0) + (tags.DoABC ?? 0) + (tags.DoABC2 ?? 0),
    nestedSpriteCount: tags.DefineSprite ?? 0,
    buttonCount: (tags.DefineButton ?? 0) + (tags.DefineButton2 ?? 0),
    soundTagCount: (tags.DefineSound ?? 0) + (tags.SoundStreamHead ?? 0) + (tags.SoundStreamBlock ?? 0),
  });
}

export function parseSwfmillStructure(xml) {
  const source = String(xml ?? "").replace(/^\uFEFF/u, "");
  const swfTag = source.match(/<swf\b[^>]*>/iu)?.[0] ?? null;
  const headerTag = source.match(/<Header\b[^>]*>/iu)?.[0] ?? null;
  invariant(swfTag && headerTag, "TOOL_OUTPUT_INVALID", "swfmill output lacks swf/Header tags");
  const version = numberAttribute(swfTag, "version");
  const frameRate = numberAttribute(headerTag, "framerate") ?? numberAttribute(headerTag, "frameRate");
  const frameCount = numberAttribute(headerTag, "frames") ?? numberAttribute(headerTag, "frameCount");
  invariant(Number.isFinite(version) && Number.isFinite(frameRate) && Number.isFinite(frameCount),
    "TOOL_OUTPUT_INVALID", "swfmill output lacks version, frame rate, or root frame count");
  const rectangleTag = source.match(/<Rectangle\b[^>]*>/iu)?.[0] ?? null;
  const left = rectangleTag ? numberAttribute(rectangleTag, "left") : null;
  const right = rectangleTag ? numberAttribute(rectangleTag, "right") : null;
  const top = rectangleTag ? numberAttribute(rectangleTag, "top") : null;
  const bottom = rectangleTag ? numberAttribute(rectangleTag, "bottom") : null;
  const nestedSprites = [...source.matchAll(/<DefineSprite\b[^>]*>/giu)].map((match) => {
    const tag = match[0];
    return {
      objectId: numberAttribute(tag, "objectID") ?? numberAttribute(tag, "objectId"),
      frameCount: numberAttribute(tag, "frames") ?? numberAttribute(tag, "frameCount"),
    };
  });
  const counts = {
    doAction: countTag(source, "DoAction"),
    doInitAction: countTag(source, "DoInitAction"),
    doAbc: countTag(source, "DoABC") + countTag(source, "DoABC2"),
    buttons: countTag(source, "DefineButton") + countTag(source, "DefineButton2"),
    sprites: nestedSprites.length,
    shapes: countTag(source, "DefineShape") + countTag(source, "DefineShape2") + countTag(source, "DefineShape3") + countTag(source, "DefineShape4"),
    morphShapes: countTag(source, "DefineMorphShape") + countTag(source, "DefineMorphShape2"),
    fonts: countTag(source, "DefineFont") + countTag(source, "DefineFont2") + countTag(source, "DefineFont3") + countTag(source, "DefineFont4"),
    images: countTag(source, "DefineBits") + countTag(source, "DefineBitsJPEG2") + countTag(source, "DefineBitsJPEG3") + countTag(source, "DefineBitsLossless") + countTag(source, "DefineBitsLossless2"),
    soundStreamHeads: countTag(source, "SoundStreamHead") + countTag(source, "SoundStreamHead2"),
    soundStreamBlocks: countTag(source, "SoundStreamBlock"),
    defineSounds: countTag(source, "DefineSound"),
    startSounds: countTag(source, "StartSound") + countTag(source, "StartSound2"),
    placeObjects: countTag(source, "PlaceObject") + countTag(source, "PlaceObject2") + countTag(source, "PlaceObject3") + countTag(source, "PlaceObject4"),
    removeObjects: countTag(source, "RemoveObject") + countTag(source, "RemoveObject2"),
    frameLabels: countTag(source, "FrameLabel"),
    showFrames: countTag(source, "ShowFrame"),
  };
  return Object.freeze({
    swfVersion: version,
    fps: frameRate,
    rootFrameCount: frameCount,
    stage: rectangleTag && [left, right, top, bottom].every(Number.isFinite)
      ? {width: (right - left) / 20, height: (bottom - top) / 20, twipsPerPixel: 20}
      : null,
    nestedSprites,
    counts,
  });
}

async function walkRegularFiles(root, relative = "", result = []) {
  let entries;
  try {
    entries = await readdir(root, {withFileTypes: true});
  } catch (error) {
    if (error?.code === "ENOENT") return result;
    throw error;
  }
  entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
  for (const entry of entries) {
    const absolute = path.join(root, entry.name);
    const childRelative = portable(path.join(relative, entry.name));
    const info = await lstat(absolute);
    invariant(!info.isSymbolicLink(), "TOOL_OUTPUT_INVALID", `tool output contains a symlink: ${childRelative}`);
    if (info.isDirectory()) await walkRegularFiles(absolute, childRelative, result);
    else {
      invariant(info.isFile(), "TOOL_OUTPUT_INVALID", `tool output contains a non-regular file: ${childRelative}`);
      result.push({absolute, relative: childRelative});
    }
  }
  return result;
}

async function inventoryExportedScripts(exportRoot, maxOutputBytes) {
  const files = await walkRegularFiles(exportRoot);
  const records = [];
  let totalBytes = 0;
  const textParts = [];
  for (const file of files) {
    const identity = await fileIdentity(file.absolute, {label: `FFDec script export ${file.relative}`});
    totalBytes += identity.bytes;
    invariant(totalBytes <= maxOutputBytes * 8, "TOOL_OUTPUT_LIMIT", "FFDec script export exceeded bounded inventory size", {
      maxBytes: maxOutputBytes * 8,
    });
    if (/\.(?:as|txt|js|xml)$/iu.test(file.relative)) {
      const bytes = await readFile(file.absolute);
      textParts.push(bytes.toString("utf8"));
    }
    records.push({path: file.relative, bytes: identity.bytes, sha256: identity.sha256});
  }
  const scriptRecords = records.filter((record) => /\.(?:as|txt|js)$/iu.test(record.path));
  return Object.freeze({
    root: exportRoot,
    fileCount: records.length,
    scriptFileCount: scriptRecords.length,
    totalBytes,
    files: records,
    text: textParts.join("\n"),
  });
}

const RISK_PATTERNS = Object.freeze([
  ["dynamic-eval", /\beval\s*\(|\bEval\b/giu],
  ["randomness", /\b(?:random|Random)\b/gu],
  ["dynamic-movieclip", /\b(?:attachMovie|duplicateMovieClip|removeMovieClip|createEmptyMovieClip|startDrag|stopDrag)\b/gu],
  ["timer-or-loop", /\b(?:setInterval|clearInterval|onEnterFrame|onMouseMove|updateAfterEvent)\b/gu],
  ["host-contract", /\b(?:_level\d+|_root|_parent|InternalPreloader|ExternalInterface)\b/gu],
  ["external-or-network", /\b(?:getURL|loadMovie|loadVariables|XMLSocket|NetConnection|SharedObject)\b/gu],
  ["sound-control", /\b(?:Sound|startSound|stopAllSounds|StartSound|StopSounds)\b/gu],
]);

export function deriveLaneHint({header = null, dump = null, as2 = "", as3 = "", exported = null, swfmill = null} = {}) {
  const combined = [as2, as3, exported?.text ?? ""].join("\n");
  const riskReasons = [];
  const featureCounts = {};
  for (const [id, pattern] of RISK_PATTERNS) {
    const count = [...combined.matchAll(pattern)].length;
    if (count > 0) {
      featureCounts[id] = count;
      riskReasons.push(`${id}:${count}`);
    }
  }
  const rootFrameCount = Number(swfmill?.rootFrameCount ?? header?.frameCount ?? 0);
  const nestedCount = Number(swfmill?.nestedSprites?.length ?? dump?.nestedSpriteCount ?? 0);
  const buttonCount = Number(swfmill?.counts?.buttons ?? dump?.buttonCount ?? 0);
  const audioCount = Number(swfmill?.counts?.soundStreamHeads ?? 0) +
    Number(swfmill?.counts?.soundStreamBlocks ?? 0) + Number(swfmill?.counts?.defineSounds ?? 0) +
    Number(swfmill?.counts?.startSounds ?? 0) + Number(dump?.soundTagCount ?? 0);
  const scriptCount = Number(swfmill?.counts?.doAction ?? 0) + Number(swfmill?.counts?.doInitAction ?? 0) +
    Number(swfmill?.counts?.doAbc ?? 0) + Number(exported?.scriptFileCount ?? 0);
  let lane = "unknown";
  let confidence = "none";
  const reasons = [];
  if (!header || !dump || !swfmill) {
    reasons.push("incomplete-structural-observation");
  } else if (riskReasons.length > 0) {
    lane = "behavior-heavy";
    confidence = "low";
    reasons.push("dynamic-or-host-sensitive-script", ...riskReasons);
  } else if (buttonCount > 0 || scriptCount > 0 || nestedCount > 0 || audioCount > 0 || rootFrameCount > 1) {
    lane = "interactive-understood";
    confidence = "low";
    if (buttonCount > 0) reasons.push(`buttons:${buttonCount}`);
    if (scriptCount > 0) reasons.push(`scripts:${scriptCount}`);
    if (nestedCount > 0) reasons.push(`nested-sprites:${nestedCount}`);
    if (audioCount > 0) reasons.push(`audio-tags:${audioCount}`);
    if (rootFrameCount > 1) reasons.push(`root-frames:${rootFrameCount}`);
  } else {
    lane = "low";
    confidence = "low";
    reasons.push("no-script-button-nested-or-audio-signals");
  }
  return Object.freeze({
    lane,
    confidence,
    disposition: "preliminary-machine-hint-needs-review",
    generationEligible: false,
    scaleOutAuthorized: false,
    reasons,
    featureCounts,
    observed: {rootFrameCount, nestedSpriteCount: nestedCount, buttonCount, audioTagCount: audioCount, scriptSignalCount: scriptCount},
  });
}

function commandRecord(result, sourcePath, outputRoot, relativeOutputPath) {
  return {
    status: result.success ? "succeeded" : "failed",
    command: result.command,
    args: result.args.map((value) => redactArg(value, sourcePath, outputRoot)),
    exitCode: result.exitCode,
    signal: result.signal,
    timedOut: result.timedOut,
    outputLimitExceeded: result.outputLimitExceeded,
    elapsedMs: result.elapsedMs,
    spawnError: result.spawnError,
    stdout: {path: relativeOutputPath(result.stdoutPath), bytes: result.stdout.bytes, sha256: result.stdout.sha256},
    stderr: {path: relativeOutputPath(result.stderrPath), bytes: result.stderr.bytes, sha256: result.stderr.sha256},
  };
}

async function executePlacement(record, context) {
  const placementRoot = path.join(context.stageRoot, "placements", record.selection.placementId);
  const logsRoot = path.join(placementRoot, "logs");
  const exportRoot = path.join(placementRoot, "ffdec-script-export");
  const swfmillRoot = path.join(placementRoot, "swfmill");
  await mkdir(logsRoot, {recursive: true});
  await mkdir(exportRoot, {recursive: true});
  await mkdir(swfmillRoot, {recursive: true});
  const relativeOutputPath = (absolute) => portable(path.relative(context.stageRoot, absolute));
  const invoke = async (id, command, args, stdoutName, stderrName) => {
    const result = await runBoundedCommand({
      command,
      args,
      cwd: context.projectRoot,
      stdoutPath: path.join(logsRoot, stdoutName),
      stderrPath: path.join(logsRoot, stderrName),
      timeoutMs: context.timeoutMs,
      maxOutputBytes: context.maxOutputBytes,
    });
    invariant(result.success, "TOOL_FAILED", `${record.selection.placementId}: ${id} failed`, {
      id,
      command,
      exitCode: result.exitCode,
      signal: result.signal,
      timedOut: result.timedOut,
      outputLimitExceeded: result.outputLimitExceeded,
      stderr: result.stderrText.slice(0, 2_000),
    });
    return {id, result};
  };
  const sourcePath = record.sourcePath;
  const commands = {};
  const before = await binding(sourcePath, `${record.selection.placementId} SWF before tools`);
  invariant(before.sha256 === record.source.sha256 && before.bytes === record.source.bytes, "SOURCE_HASH_DRIFT",
    `${record.selection.placementId}: source drifted before tool invocation`);
  const assertSourceStable = async (phase) => {
    const current = await binding(sourcePath, `${record.selection.placementId} SWF ${phase}`);
    invariant(current.sha256 === before.sha256 && current.bytes === before.bytes, "SOURCE_HASH_DRIFT",
      `${record.selection.placementId}: source changed during ${phase}`);
  };
  const header = await invoke("ffdecHeader", context.ffdec, ["-header", sourcePath], "ffdec-header.stdout.txt", "ffdec-header.stderr.txt");
  commands.ffdecHeader = commandRecord(header.result, sourcePath, exportRoot, relativeOutputPath);
  await assertSourceStable("ffdec-header");
  const headerStructure = parseFfdecHeader(header.result.stdoutText);
  const dump = await invoke("ffdecDumpSWF", context.ffdec, ["-dumpSWF", sourcePath], "ffdec-dumpSWF.stdout.txt", "ffdec-dumpSWF.stderr.txt");
  commands.ffdecDumpSWF = commandRecord(dump.result, sourcePath, exportRoot, relativeOutputPath);
  await assertSourceStable("ffdec-dumpSWF");
  const dumpStructure = parseFfdecDump(dump.result.stdoutText);
  const as2 = await invoke("ffdecDumpAS2", context.ffdec, ["-dumpAS2", sourcePath], "ffdec-dumpAS2.stdout.txt", "ffdec-dumpAS2.stderr.txt");
  commands.ffdecDumpAS2 = commandRecord(as2.result, sourcePath, exportRoot, relativeOutputPath);
  await assertSourceStable("ffdec-dumpAS2");
  const as3 = await invoke("ffdecDumpAS3", context.ffdec, ["-dumpAS3", sourcePath], "ffdec-dumpAS3.stdout.txt", "ffdec-dumpAS3.stderr.txt");
  commands.ffdecDumpAS3 = commandRecord(as3.result, sourcePath, exportRoot, relativeOutputPath);
  await assertSourceStable("ffdec-dumpAS3");
  const exported = await invoke("ffdecExportScript", context.ffdec,
    ["-export", "script", exportRoot, sourcePath], "ffdec-export-script.stdout.txt", "ffdec-export-script.stderr.txt");
  commands.ffdecExportScript = commandRecord(exported.result, sourcePath, exportRoot, relativeOutputPath);
  await assertSourceStable("ffdec-export-script");
  const exportInventory = await inventoryExportedScripts(exportRoot, context.maxOutputBytes);
  const xmlPath = path.join(swfmillRoot, "source.xml");
  const swfmill = await invoke("swfmillXml", context.swfmill,
    ["-n", "swf2xml", sourcePath, xmlPath], "swfmill.stdout.txt", "swfmill.stderr.txt");
  commands.swfmillXml = commandRecord(swfmill.result, sourcePath, exportRoot, relativeOutputPath);
  await assertSourceStable("swfmill");
  const xmlInfo = await fileIdentity(xmlPath, {label: `${record.selection.placementId} swfmill XML`});
  invariant(xmlInfo.bytes <= context.maxOutputBytes * 8, "TOOL_OUTPUT_LIMIT",
    `${record.selection.placementId}: swfmill XML exceeded bounded size`);
  const xmlText = await readFile(xmlPath, "utf8");
  const swfmillStructure = parseSwfmillStructure(xmlText);
  const after = await binding(sourcePath, `${record.selection.placementId} SWF after tools`);
  invariant(after.sha256 === before.sha256 && after.bytes === before.bytes, "SOURCE_HASH_DRIFT",
    `${record.selection.placementId}: source changed while tools were running`);
  const laneHint = deriveLaneHint({
    header: headerStructure,
    dump: dumpStructure,
    as2: as2.result.stdoutText,
    as3: as3.result.stdoutText,
    exported: exportInventory,
    swfmill: swfmillStructure,
  });
  const structural = {
    ffdecHeader: headerStructure,
    ffdecDumpSWF: dumpStructure,
    actionScript: {
      as2IndexBytes: Buffer.byteLength(as2.result.stdoutText),
      as3IndexBytes: Buffer.byteLength(as3.result.stdoutText),
      as2LineCount: as2.result.stdoutText ? as2.result.stdoutText.split(/\r?\n/u).length : 0,
      as3LineCount: as3.result.stdoutText ? as3.result.stdoutText.split(/\r?\n/u).length : 0,
      exportedScriptFileCount: exportInventory.scriptFileCount,
      exportedFileCount: exportInventory.fileCount,
      exportedBytes: exportInventory.totalBytes,
      execution: "not-executed",
    },
    swfmill: {
      ...swfmillStructure,
      xml: {path: relativeOutputPath(xmlPath), bytes: xmlInfo.bytes, sha256: xmlInfo.sha256},
    },
    exportedScripts: {
      path: portable(path.relative(context.stageRoot, exportRoot)),
      fileCount: exportInventory.fileCount,
      scriptFileCount: exportInventory.scriptFileCount,
      totalBytes: exportInventory.totalBytes,
      files: exportInventory.files,
    },
  };
  return Object.freeze({
    placementId: record.selection.placementId,
    moduleCode: record.selection.moduleCode,
    lessonNumber: record.selection.lessonNumber,
    ordinal: record.selection.ordinal ?? record.page.xmlOccurrence ?? record.page.globalOrdinal ?? null,
    selectionRole: record.selection.selectionRole,
    selectionReason: record.selection.selectionReason,
    declaredLane: record.selection.declaredLane,
    source: {
      catalogPath: record.page.sourcePath ?? record.page.viewPath ?? record.candidatePath,
      path: `$EXTERNAL_SOURCE_ROOT/${context.sourceRoot.relativeRoot}/${record.sourceRelativePath}`,
      sourceRelativePath: record.sourceRelativePath,
      bytes: before.bytes,
      sha256: before.sha256,
      mode: before.mode,
      readOnly: before.writable === false,
      unchangedDuringAudit: true,
    },
    commands,
    structural,
    laneHint,
    acceptanceEffects: {...ALL_FALSE_ACCEPTANCE_EFFECTS},
  });
}

async function mapBounded(records, concurrency, worker) {
  const results = new Array(records.length);
  let next = 0;
  let firstError = null;
  async function runWorker() {
    while (firstError === null) {
      const index = next;
      next += 1;
      if (index >= records.length) return;
      try {
        results[index] = await worker(records[index], index);
      } catch (error) {
        firstError ??= error;
        return;
      }
    }
  }
  await Promise.all(Array.from({length: Math.min(concurrency, records.length)}, () => runWorker()));
  if (firstError) throw firstError;
  return results;
}

function reportSummary(placements) {
  const laneCounts = {low: 0, "interactive-understood": 0, "behavior-heavy": 0, unknown: 0};
  for (const placement of placements) laneCounts[placement.laneHint.lane] = (laneCounts[placement.laneHint.lane] ?? 0) + 1;
  return {
    selectedPlacementCount: placements.length,
    auditedPlacementCount: placements.length,
    preliminaryLaneHintCounts: laneCounts,
    toolCommandCount: placements.length * 6,
    structuralOnly: true,
    currentJavaScriptRegisteredCount: 0,
    originalRuntimeAcceptedCount: 0,
    visualFidelityAcceptedCount: 0,
    audioAcceptedCount: 0,
    strictCompleteCount: 0,
    publishedCount: 0,
  };
}

function outputRootFor(options, projectRoot) {
  const factoryRoot = path.resolve(projectRoot, "work", FACTORY_ROOT_NAME);
  const output = resolveProjectPath(options.output, projectRoot, "output", {allowAbsolute: true});
  return ensureWithin(output, factoryRoot, "OUTPUT_OUTSIDE_FACTORY_ROOT", "output");
}

async function writeFailure(stageRoot, error, context) {
  const failure = {
    schemaVersion: 1,
    artifactType: "help-math-g678-shared-calibration-structure-failure",
    status: "failed-closed",
    errorCode: error.code ?? "CALIBRATION_AUDIT_FAILED",
    message: error.message,
    details: error.details ?? {},
    profileSha256: context.profileBinding.file.sha256,
    catalogSha256: context.catalogBinding.file.sha256,
    acceptanceEffects: {...ALL_FALSE_ACCEPTANCE_EFFECTS},
  };
  await writeFile(path.join(stageRoot, "failure.json"), stableJson(failure), {flag: "wx", mode: 0o444}).catch(() => {});
}

export async function runCheck(optionsInput = {}) {
  const projectRoot = path.resolve(optionsInput.projectRoot ?? PROJECT_ROOT);
  const options = {...parseArguments([]), ...optionsInput, check: true};
  const outputRoot = outputRootFor(options, projectRoot);
  const reportPath = path.join(outputRoot, REPORT_FILE);
  let report;
  try {
    report = JSON.parse(await readFile(reportPath, "utf8"));
  } catch (error) {
    throw new CalibrationAuditError("REPORT_MISSING", `report is unavailable: ${reportPath}`, {path: reportPath});
  }
  invariant(report?.schemaVersion === REPORT_SCHEMA_VERSION &&
    report?.artifactType === "help-math-g678-shared-calibration-structure" &&
    report?.status === "structural-audit-only", "REPORT_INVALID", "structural report identity/status drifted");
  invariant(stableJson(report.acceptanceEffects) === stableJson(ALL_FALSE_ACCEPTANCE_EFFECTS),
    "REPORT_ACCEPTANCE_DRIFT", "structural report acceptance effects are not all false");
  const profilePath = resolveProjectPath(options.profile, projectRoot, "profile", {allowAbsolute: true});
  const catalogPath = resolveProjectPath(options.catalog, projectRoot, "catalog", {allowAbsolute: true});
  const [profileBinding, catalogBinding] = await Promise.all([
    readJsonBinding(profilePath, "profile"),
    readJsonBinding(catalogPath, "catalog"),
  ]);
  invariant(report.inputs?.profile?.sha256 === profileBinding.file.sha256 && report.inputs?.catalog?.sha256 === catalogBinding.file.sha256,
    "REPORT_INPUT_DRIFT", "profile or catalog SHA-256 drifted since report creation");
  const sourceRoot = await resolveSourceRoot(options.sourceRoot, profileBinding.value, projectRoot);
  const reportSourceRoot = report.inputs?.sourceRoot?.canonicalRoot;
  invariant(reportSourceRoot === `$EXTERNAL_SOURCE_ROOT/${sourceRoot.relativeRoot}` ||
    reportSourceRoot === portable(path.relative(projectRoot, sourceRoot.canonicalRoot)) ||
    reportSourceRoot === sourceRoot.canonicalRoot,
  "REPORT_SOURCE_ROOT_DRIFT", "source-root binding drifted since report creation");
  const selected = await resolveSelectedSources(
    profileBinding,
    catalogBinding,
    options.sourceRoot,
    projectRoot,
    {requireReadOnly: report.inputs?.sourceRoot?.readOnlyRequired !== false},
  );
  invariant(selected.records.length === (report.placements ?? []).length,
    "REPORT_SELECTION_DRIFT", "calibration placement count/order drifted since report creation");
  const requiredCommands = ["ffdecHeader", "ffdecDumpSWF", "ffdecDumpAS2", "ffdecDumpAS3", "ffdecExportScript", "swfmillXml"];
  invariant(report.summary?.toolCommandCount === selected.records.length * requiredCommands.length &&
    report.scope?.selectedPlacementCount === selected.records.length,
  "REPORT_SCOPE_DRIFT", "structural report scope/command count drifted");
  selected.records.forEach((record, index) => {
    const placement = report.placements[index];
    invariant(placement?.placementId === record.selection.placementId &&
      placement.moduleCode === record.selection.moduleCode &&
      placement.lessonNumber === record.selection.lessonNumber &&
      placement.ordinal === (record.selection.ordinal ?? record.page.xmlOccurrence ?? record.page.globalOrdinal ?? null),
    "REPORT_SELECTION_DRIFT", `calibration placement ${index + 1} no longer matches profile/catalog`);
    invariant(placement.source?.sourceRelativePath === record.sourceRelativePath &&
      placement.source?.sha256 === record.source.sha256 &&
      placement.source?.bytes === record.source.bytes,
    "REPORT_INPUT_DRIFT", `${placement.placementId}: source binding drifted in profile/catalog`);
    invariant(stableJson(placement.acceptanceEffects) === stableJson(ALL_FALSE_ACCEPTANCE_EFFECTS),
      "REPORT_ACCEPTANCE_DRIFT", `${placement.placementId}: placement acceptance effects are not all false`);
    invariant(requiredCommands.every((commandId) => placement.commands?.[commandId]?.status === "succeeded"),
      "REPORT_COMMAND_DRIFT", `${placement.placementId}: one or more required structural commands are missing or failed`);
    invariant(placement.laneHint?.generationEligible === false && placement.laneHint?.scaleOutAuthorized === false,
      "REPORT_LANE_DRIFT", `${placement.placementId}: lane hint crossed the generation boundary`);
  });
  for (const placement of report.placements ?? []) {
    const sourcePath = ensureWithin(path.resolve(sourceRoot.canonicalRoot, placement.source.sourceRelativePath), sourceRoot.canonicalRoot,
      "SOURCE_PATH_ESCAPES_ROOT", `${placement.placementId} source`);
    const current = await binding(sourcePath, `${placement.placementId} source`);
    invariant(current.sha256 === placement.source.sha256 && current.bytes === placement.source.bytes,
      "SOURCE_HASH_DRIFT", `${placement.placementId}: source hash drifted since report creation`);
  }
  const files = await walkRegularFiles(outputRoot);
  const expected = new Map();
  for (const placement of report.placements ?? []) {
    for (const command of Object.values(placement.commands ?? {})) {
      for (const stream of [command.stdout, command.stderr]) expected.set(stream.path, stream);
    }
    const xml = placement.structural?.swfmill?.xml;
    if (xml) expected.set(xml.path, xml);
    for (const file of placement.structural?.exportedScripts?.files ?? []) {
      expected.set(portable(path.join(placement.structural.exportedScripts.path, file.path)), file);
    }
  }
  const observedPaths = new Set();
  for (const file of files) {
    if (file.relative === REPORT_FILE || file.relative === "failure.json") continue;
    const descriptor = expected.get(file.relative);
    invariant(descriptor, "REPORT_OUTPUT_DRIFT", `unexpected report artifact: ${file.relative}`);
    observedPaths.add(file.relative);
    const current = await fileIdentity(file.absolute, {label: file.relative});
    invariant(current.sha256 === descriptor.sha256 && current.bytes === descriptor.bytes,
      "REPORT_OUTPUT_DRIFT", `report artifact drifted: ${file.relative}`);
  }
  for (const expectedPath of expected.keys()) {
    invariant(observedPaths.has(expectedPath), "REPORT_OUTPUT_DRIFT", `missing report artifact: ${expectedPath}`);
  }
  return {status: "PASS", report: portable(path.relative(projectRoot, reportPath)), selectedPlacementCount: report.placements?.length ?? 0};
}

export async function runAudit(optionsInput = {}) {
  const projectRoot = path.resolve(optionsInput.projectRoot ?? PROJECT_ROOT);
  const parsedDefaults = parseArguments([]);
  const options = {...parsedDefaults, ...optionsInput};
  if (options.check) return runCheck({...options, projectRoot});
  options.timeoutMs = parsePositiveInteger(options.timeoutMs, "timeoutMs", {maximum: MAX_TIMEOUT_MS});
  options.concurrency = parsePositiveInteger(options.concurrency, "concurrency", {maximum: MAX_CONCURRENCY});
  options.maxOutputBytes = parsePositiveInteger(options.maxOutputBytes, "maxOutputBytes", {maximum: MAX_OUTPUT_BYTES});
  const outputRoot = outputRootFor(options, projectRoot);
  try {
    await lstat(outputRoot);
    throw new CalibrationAuditError("OUTPUT_EXISTS", `refusing to overwrite existing output: ${outputRoot}`, {outputRoot});
  } catch (error) {
    if (error?.code !== "ENOENT" && error?.code !== "OUTPUT_EXISTS") throw error;
    if (error?.code === "OUTPUT_EXISTS") throw error;
  }
  const profilePath = resolveProjectPath(options.profile, projectRoot, "profile", {allowAbsolute: true});
  const catalogPath = resolveProjectPath(options.catalog, projectRoot, "catalog", {allowAbsolute: true});
  const [profileBinding, catalogBinding] = await Promise.all([
    readJsonBinding(profilePath, "profile"),
    readJsonBinding(catalogPath, "catalog"),
  ]);
  const contextBase = {
    projectRoot,
    profileBinding,
    catalogBinding,
  };
  const selected = await resolveSelectedSources(profileBinding, catalogBinding, options.sourceRoot, projectRoot, {
    requireReadOnly: options.requireReadOnly !== false,
  });
  const stageRoot = `${outputRoot}.staging-${process.pid}-${randomUUID()}`;
  await mkdir(path.dirname(outputRoot), {recursive: true});
  await mkdir(stageRoot, {recursive: false});
  const context = {
    ...contextBase,
    stageRoot,
    sourceRoot: selected.sourceRoot,
    ffdec: options.ffdec,
    swfmill: options.swfmill,
    timeoutMs: options.timeoutMs,
    concurrency: options.concurrency,
    maxOutputBytes: options.maxOutputBytes,
  };
  try {
    const placements = await mapBounded(selected.records, options.concurrency,
      (record) => executePlacement(record, context));
    const profileAfter = await binding(profilePath, "profile after audit");
    const catalogAfter = await binding(catalogPath, "catalog after audit");
    invariant(profileAfter.sha256 === profileBinding.file.sha256, "PROFILE_HASH_DRIFT",
      "profile changed during structural audit");
    invariant(catalogAfter.sha256 === catalogBinding.file.sha256, "CATALOG_HASH_DRIFT",
      "catalog changed during structural audit");
    const report = {
      schemaVersion: REPORT_SCHEMA_VERSION,
      artifactType: "help-math-g678-shared-calibration-structure",
      reportId: "g678-shared-calibration-structure-v1",
      status: "structural-audit-only",
      generatedAt: null,
      inputs: {
        profile: {path: portable(path.relative(projectRoot, profilePath)), bytes: profileBinding.file.bytes, sha256: profileBinding.file.sha256},
        catalog: {path: portable(path.relative(projectRoot, catalogPath)), bytes: catalogBinding.file.bytes, sha256: catalogBinding.file.sha256},
        sourceRoot: {
          configured: typeof selected.sourceRoot.configured === "string" && path.isAbsolute(selected.sourceRoot.configured)
            ? "$EXTERNAL_SOURCE_ROOT"
            : selected.sourceRoot.configured,
          canonicalRoot: `$EXTERNAL_SOURCE_ROOT/${selected.sourceRoot.relativeRoot}`,
          relativeRoot: selected.sourceRoot.relativeRoot,
          readOnlyRequired: options.requireReadOnly !== false,
        },
      },
      scope: {
        calibrationSetCount: selected.selections.length,
        selectedPlacementCount: placements.length,
        legacyFlashCourseShellsIncluded: false,
        modernCourseUiRetained: true,
      },
      limits: {
        timeoutMs: options.timeoutMs,
        concurrency: options.concurrency,
        maxOutputBytes: options.maxOutputBytes,
      },
      tools: {
        ffdec: {command: options.ffdec, invokedOperations: ["-header", "-dumpSWF", "-dumpAS2", "-dumpAS3", "-export script"]},
        swfmill: {command: options.swfmill, invokedOperations: ["-n swf2xml"]},
      },
      summary: reportSummary(placements),
      placements,
      limitations: [
        "FFDec and swfmill output is source-structural evidence only; AVM1 is not executed.",
        "Preliminary machine lane hints are non-authoritative and require source/behavior review.",
        "No JavaScript renderer, registry entry, My Lesson integration, original-runtime trace, fidelity comparison, audio acceptance, human review, Owner acceptance, strict completion, release, or publication is created.",
      ],
      acceptanceEffects: {...ALL_FALSE_ACCEPTANCE_EFFECTS},
    };
    await writeFile(path.join(stageRoot, REPORT_FILE), stableJson(report), {flag: "wx", mode: 0o444});
    await rename(stageRoot, outputRoot);
    return {
      status: report.status,
      report: portable(path.relative(projectRoot, path.join(outputRoot, REPORT_FILE))),
      output: portable(path.relative(projectRoot, outputRoot)),
      selectedPlacementCount: placements.length,
      acceptanceEffects: report.acceptanceEffects,
    };
  } catch (error) {
    await writeFailure(stageRoot, error, context).catch(() => {});
    throw error;
  }
}

const invokedDirectly = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;

if (invokedDirectly) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) process.stdout.write(helpText());
    else {
      const result = await runAudit(options);
      process.stdout.write(`${stableJson(result)}\n`);
    }
  } catch (error) {
    process.stderr.write(`${stableJson({ok: false, errorCode: error.code ?? "CALIBRATION_AUDIT_FAILED", message: error.message, details: error.details ?? {}})}\n`);
    process.exitCode = 1;
  }
}
