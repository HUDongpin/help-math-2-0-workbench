#!/usr/bin/env node

/**
 * Profile-driven structural front end for the G6-G8 shared Flash factory.
 *
 * This command intentionally stops at source-locked structural evidence.  It
 * does not run an AVM runtime, generate a runnable renderer, register a
 * Current-JS module, compare frames, or accept audio/review/release evidence.
 * Those are independent gates in the flash-to-js operating contract.
 *
 * The script is deliberately generic: a source profile describes the four
 * shared modules and the source view; no lesson-specific generator scripts are
 * required.  The same profile/run manifest is consumed by later IR and
 * maintained-adapter stages.
 */

import {createHash, randomUUID} from "node:crypto";
import {access, lstat, mkdir, readFile, readdir, rename, writeFile} from "node:fs/promises";
import {constants as fsConstants} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {validateSharedProfile} from "./lib/g678-shared-catalog.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const FACTORY_NAME = "g678-shared-page-factory";
export const FACTORY_SCHEMA_VERSION = 2;
export const PROFILE_SCHEMA_VERSION = 1;
export const DEFAULT_PROFILE = "catalog/g678-shared-source-profile.v1.json";
export const DEFAULT_OUTPUT = `work/${FACTORY_NAME}`;
export const DEFAULT_CACHE = `work/${FACTORY_NAME}-cache`;
export const IR_SCHEMA_VERSION = 1;
export const DEFAULT_MAX_ARCHIVE_RECEIPT_BYTES = 64 * 1024 * 1024;
export const MAX_ARCHIVE_RECEIPT_BYTES = 512 * 1024 * 1024;

const SHA256 = /^[a-f0-9]{64}$/;
const MODULE_CODE = /^[A-Z][A-Z0-9]{2,15}$/;
const MODES = new Set(["calibrate", "extend", "check"]);
const LANES = new Set(["low", "interactive-understood", "behavior-heavy"]);
export const ACCEPTANCE_EFFECTS_FALSE = Object.freeze({
  canonicalSourcePromoted: false,
  sourceCustodyChanged: false,
  modernCourseUiChanged: false,
  modernMyLessonHostChanged: false,
  legacyFlashCourseShellConverted: false,
  currentJavaScriptRegistered: false,
  avm1BehaviorCompiled: false,
  nestedAudioPlaybackCompiled: false,
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

function parseLessonNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const normalized = String(value).replace(/^L/i, "");
  const number = Number(normalized);
  return Number.isSafeInteger(number) ? number : Number.NaN;
}

export class FactoryError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "FactoryError";
    this.code = code;
    this.details = details;
  }
}

function invariant(condition, code, message, details = {}) {
  if (!condition) throw new FactoryError(code, message, details);
}

function stableClone(value) {
  if (Array.isArray(value)) return value.map(stableClone);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableClone(value[key])]));
  }
  return value;
}

export function stableJson(value) {
  return `${JSON.stringify(stableClone(value), null, 2)}\n`;
}

export function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

export async function sha256File(filePath) {
  const hash = createHash("sha256");
  const bytes = await readFile(filePath);
  hash.update(bytes);
  return hash.digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

export function relativeProject(filePath) {
  const relative = path.relative(PROJECT_ROOT, filePath);
  return portable(relative || ".");
}

function resolvePath(value, label, {allowAbsolute = false, root = PROJECT_ROOT} = {}) {
  invariant(typeof value === "string" && value.length > 0, "INVALID_PATH", `${label}: non-empty path required`);
  if (path.isAbsolute(value)) {
    invariant(allowAbsolute, "ABSOLUTE_PATH_FORBIDDEN", `${label}: absolute paths are not allowed`);
    return path.resolve(value);
  }
  const normalized = path.normalize(value);
  invariant(normalized !== ".." && !normalized.startsWith(`..${path.sep}`), "PATH_ESCAPES_ROOT", `${label}: path escapes root`);
  return path.resolve(root, normalized);
}

function ensureWithin(target, root, code, label) {
  const resolvedTarget = path.resolve(target);
  const resolvedRoot = path.resolve(root);
  invariant(resolvedTarget === resolvedRoot || resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`), code,
    `${label}: path must remain below ${resolvedRoot}`);
  return resolvedTarget;
}

async function regularFileIdentity(filePath, {requireReadOnly = false, label = "file"} = {}) {
  let info;
  try {
    info = await lstat(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new FactoryError("SOURCE_FILE_MISSING", `${label}: file does not exist`, {path: filePath});
    }
    throw error;
  }
  invariant(info.isFile() && !info.isSymbolicLink(), "SOURCE_FILE_NOT_REGULAR",
    `${label}: expected a regular non-symlink file`, {path: filePath});
  const identity = {
    bytes: info.size,
    sha256: await sha256File(filePath),
    mode: `0${(info.mode & 0o777).toString(8)}`,
    writable: (info.mode & 0o222) !== 0,
  };
  if (requireReadOnly) {
    invariant(identity.writable === false, "SOURCE_FILE_WRITABLE", `${label}: source must be read-only`, {
      path: filePath,
      mode: identity.mode,
    });
  }
  return identity;
}

async function optionalIdentity(filePath, label) {
  try {
    return await regularFileIdentity(filePath, {label});
  } catch (error) {
    if (error?.code === "SOURCE_FILE_MISSING") return null;
    throw error;
  }
}

function expandEnvironmentPath(value) {
  if (typeof value !== "string" || value.length === 0) return null;
  return value.replace(/\$\{([A-Z][A-Z0-9_]*)\}|\$([A-Z][A-Z0-9_]*)/gu,
    (match, braced, bare) => process.env[braced ?? bare] ?? match);
}

function archiveReceiptDeclarations(value) {
  if (Array.isArray(value)) return value.map((entry, index) => [String(index), entry]);
  if (value && typeof value === "object") return Object.entries(value);
  return [];
}

function archiveReceiptPathCandidates(rawPath, {sourceViewPath, profilePath}) {
  const expanded = expandEnvironmentPath(rawPath);
  if (!expanded || typeof expanded !== "string") return [];
  if (path.isAbsolute(expanded)) return [path.resolve(expanded)];
  return [
    path.resolve(sourceViewPath, expanded),
    path.resolve(path.dirname(profilePath), expanded),
  ];
}

async function regularFileMetadata(filePath, label) {
  let info;
  try {
    info = await lstat(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
  invariant(info.isFile() && !info.isSymbolicLink(), "ARCHIVE_RECEIPT_NOT_REGULAR",
    `${label}: expected a regular non-symlink file`, {path: filePath});
  return {
    bytes: info.size,
    mode: `0${(info.mode & 0o777).toString(8)}`,
    writable: (info.mode & 0o222) !== 0,
  };
}

/**
 * Normalize archive receipt declarations without touching archive bytes by
 * default. Explicit verification is bounded so a smoke run cannot
 * accidentally read a multi-gigabyte recovery ZIP.
 */
export async function resolveArchiveReceipts(profile, profilePath, sourceViewPath, {
  verify = false,
  maxBytes = DEFAULT_MAX_ARCHIVE_RECEIPT_BYTES,
  requireReadOnly = false,
} = {}) {
  invariant(Number.isSafeInteger(maxBytes) && maxBytes > 0 && maxBytes <= MAX_ARCHIVE_RECEIPT_BYTES,
    "ARCHIVE_RECEIPT_LIMIT_INVALID",
    `archive receipt verification byte limit must be between 1 and ${MAX_ARCHIVE_RECEIPT_BYTES} bytes`);
  const declarations = archiveReceiptDeclarations(profile.archiveReceipts);
  const receipts = [];
  for (const [indexOrKey, value] of declarations) {
    const declaration = value && typeof value === "object" ? value : {path: value};
    const key = String(declaration.receiptId ?? declaration.id ?? indexOrKey);
    const declaredPath = declaration.containerPath ?? declaration.path ?? declaration.receiptPath ??
      declaration.file ?? declaration.archivePath ?? declaration.tokenPath ?? declaration.token ?? null;
    const declaredSha256 = declaration.containerSha256 ?? declaration.sha256 ?? declaration.declaredSha256 ??
      declaration.declaredHash ?? declaration.hash ?? declaration.digest ?? declaration.sha ?? null;
    if (declaredSha256 !== null && declaredSha256 !== undefined && declaredSha256 !== "") {
      validateSha(String(declaredSha256).toLowerCase(), `archiveReceipts.${key}.sha256`);
    }
    const memberManifestPathDeclared = declaration.memberManifestPath ?? null;
    const memberManifestSha256 = declaration.memberManifestSha256 ?? null;
    if (memberManifestSha256 !== null && memberManifestSha256 !== undefined && memberManifestSha256 !== "") {
      validateSha(String(memberManifestSha256).toLowerCase(), `archiveReceipts.${key}.memberManifestSha256`);
    }
    const declaredBytes = declaration.containerBytes ?? declaration.bytes ?? null;
    if (declaredBytes !== null && declaredBytes !== undefined) {
      invariant(Number.isSafeInteger(Number(declaredBytes)) && Number(declaredBytes) > 0,
        "ARCHIVE_RECEIPT_BYTES_INVALID", `${key}: declared bytes must be positive`);
    }
    const candidates = archiveReceiptPathCandidates(declaredPath, {sourceViewPath, profilePath});
    const memberCandidates = archiveReceiptPathCandidates(memberManifestPathDeclared, {sourceViewPath, profilePath});
    let resolvedPath = null;
    let resolvedMemberPath = null;
    for (const candidate of candidates) {
      if (await regularFileMetadata(candidate, `archive receipt ${key}`)) {
        resolvedPath = candidate;
        break;
      }
    }
    for (const candidate of memberCandidates) {
      if (await regularFileMetadata(candidate, `archive member manifest ${key}`)) {
        resolvedMemberPath = candidate;
        break;
      }
    }
    const primaryMetadata = resolvedPath
      ? await regularFileMetadata(resolvedPath, `archive receipt ${key}`)
      : null;
    const memberMetadata = resolvedMemberPath
      ? await regularFileMetadata(resolvedMemberPath, `archive member manifest ${key}`)
      : null;
    const binding = {
      key,
      receiptId: key,
      declaredPath,
      containerPath: declaredPath,
      memberManifestPath: memberManifestPathDeclared,
      resolvedPath,
      resolvedMemberPath,
      resolvedPathRelativeToSourceView: resolvedPath ? portable(path.relative(sourceViewPath, resolvedPath)) : null,
      declaredSha256: declaredSha256 ? String(declaredSha256).toLowerCase() : null,
      containerSha256: declaredSha256 ? String(declaredSha256).toLowerCase() : null,
      memberManifestSha256: memberManifestSha256 ? String(memberManifestSha256).toLowerCase() : null,
      containerBytes: declaredBytes === null || declaredBytes === undefined ? null : Number(declaredBytes),
      disposition: declaration.disposition ?? "CUSTODY_ONLY_NO_PROMOTION",
      rehashRequiredAtRunStart: declaration.rehashRequiredAtRunStart === true,
      declaredStatus: declaration.status ?? null,
      status: "declared-unverified",
      reason: null,
      candidates: [...candidates, ...memberCandidates].map((candidate) => portable(path.relative(sourceViewPath, candidate))),
      identity: null,
      memberManifestIdentity: null,
      verification: verify ? "explicit-bounded-hash" : "not-requested",
    };
    const requiresMember = Boolean(memberManifestPathDeclared || memberManifestSha256);
    if (!resolvedPath || (requiresMember && !resolvedMemberPath)) {
      binding.reason = declaredPath ? "token-path-unresolved" : "token-path-not-declared";
      if (verify) throw new FactoryError("ARCHIVE_RECEIPT_UNRESOLVED", `archive receipt ${key} cannot be resolved`, {
        key, declaredPath, memberManifestPath: memberManifestPathDeclared, candidates, memberCandidates,
      });
    } else if (verify) {
      const files = [{path: resolvedPath, metadata: primaryMetadata, expectedSha256: declaredSha256, expectedBytes: declaredBytes, label: "container"}];
      if (requiresMember) files.push({path: resolvedMemberPath, metadata: memberMetadata, expectedSha256: memberManifestSha256, expectedBytes: null, label: "member manifest"});
      for (const file of files) {
        invariant(file.metadata && file.metadata.bytes <= maxBytes, "ARCHIVE_RECEIPT_TOO_LARGE",
          `${key}: ${file.label} exceeds verification limit`, {path: file.path, bytes: file.metadata?.bytes, maxBytes});
        invariant(file.expectedSha256, "ARCHIVE_RECEIPT_HASH_MISSING",
          `${key}: ${file.label} has no declared SHA-256`, {path: file.path});
        const identity = await regularFileIdentity(file.path, {label: `archive receipt ${key} ${file.label}`});
        invariant(identity.sha256 === String(file.expectedSha256).toLowerCase(), "ARCHIVE_RECEIPT_HASH_DRIFT",
          `${key}: ${file.label} SHA-256 drifted`, {path: file.path, expected: file.expectedSha256, actual: identity.sha256});
        if (file.expectedBytes !== null && file.expectedBytes !== undefined) {
          invariant(identity.bytes === Number(file.expectedBytes), "ARCHIVE_RECEIPT_BYTES_DRIFT",
            `${key}: ${file.label} byte count drifted`, {path: file.path, expected: file.expectedBytes, actual: identity.bytes});
        }
        if (file.label === "container") binding.identity = identity;
        else binding.memberManifestIdentity = identity;
      }
      if (requireReadOnly) invariant(binding.identity?.writable === false &&
        (!requiresMember || binding.memberManifestIdentity?.writable === false),
      "ARCHIVE_RECEIPT_WRITABLE", `${key}: verified archive evidence must be read-only`);
      binding.status = "verified";
      binding.reason = null;
    } else {
      binding.reason = declaredSha256 ? "declared-hash-not-verified" : "no-declared-hash";
    }
    receipts.push(Object.freeze(binding));
  }
  return Object.freeze(receipts);
}

// Backward-compatible internal name retained for callers of the first runner
// draft; both APIs now share the bounded, declaration-preserving contract.
async function resolveArchiveReceiptBindings(profile, profilePath, options = {}) {
  return resolveArchiveReceipts(profile, profilePath, options.sourceViewPath ?? path.dirname(profilePath), {
    verify: options.verifyArchiveReceipts === true,
    maxBytes: options.maxArchiveReceiptBytes ?? DEFAULT_MAX_ARCHIVE_RECEIPT_BYTES,
    requireReadOnly: options.requireReadOnly === true,
  });
}

function archiveReceiptSummary(profile) {
  return (profile.archiveReceipts ?? []).map((binding) => ({
    key: binding.key ?? binding.receiptId,
    receiptId: binding.receiptId ?? binding.key,
    declaredPath: binding.declaredPath ?? binding.containerPath ?? null,
    containerPath: binding.containerPath ?? binding.declaredPath ?? null,
    memberManifestPath: binding.memberManifestPath ?? null,
    resolvedPath: binding.resolvedPath ? `$EXTERNAL/${path.basename(binding.resolvedPath)}` : null,
    resolvedMemberPath: binding.resolvedMemberPath ? `$EXTERNAL/${path.basename(binding.resolvedMemberPath)}` : null,
    declaredSha256: binding.declaredSha256 ?? binding.containerSha256 ?? null,
    containerSha256: binding.containerSha256 ?? binding.declaredSha256 ?? null,
    memberManifestSha256: binding.memberManifestSha256 ?? null,
    containerBytes: binding.containerBytes ?? null,
    disposition: binding.disposition ?? null,
    rehashRequiredAtRunStart: binding.rehashRequiredAtRunStart === true,
    declaredStatus: binding.declaredStatus ?? null,
    status: binding.status ?? "declared-unverified",
    reason: binding.reason ?? null,
    candidates: binding.candidates ?? [],
    identity: binding.identity ? {bytes: binding.identity.bytes, sha256: binding.identity.sha256} : null,
    memberManifestIdentity: binding.memberManifestIdentity
      ? {bytes: binding.memberManifestIdentity.bytes, sha256: binding.memberManifestIdentity.sha256}
      : null,
    verification: binding.verification ?? "not-requested",
  }));
}

function archiveReceiptGate(profile) {
  const bindings = profile.archiveReceipts ?? [];
  if (bindings.length === 0) return "not-declared";
  return bindings.every((binding) => binding.status === "verified") ? "hash-verified" : "blocked-unverified";
}

function archiveReceiptVerification(options, profile) {
  return {
    status: options.verifyArchiveReceipts ? "explicit-bounded-hash" : "not-requested",
    maxBytes: options.maxArchiveReceiptBytes ?? profile.maxArchiveReceiptBytes ?? DEFAULT_MAX_ARCHIVE_RECEIPT_BYTES,
  };
}

function decodeXmlEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function parseAttributes(text) {
  const attributes = {};
  const pattern = /([A-Za-z_:][A-Za-z0-9_.:-]*)\s*=\s*("[^"]*"|'[^']*')/g;
  for (const match of text.matchAll(pattern)) {
    attributes[match[1]] = decodeXmlEntities(match[2].slice(1, -1));
  }
  return attributes;
}

function firstTagText(text, tag) {
  const match = text.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}\\s*>`, "i"));
  return match ? decodeXmlEntities(match[1].trim()) : null;
}

function stripXmlComments(rawText) {
  let unterminated = false;
  const stripped = rawText.replace(/<!--[\s\S]*?(?:-->|$)/g, (match) => {
    if (!match.endsWith("-->")) unterminated = true;
    return "";
  });
  return {stripped, unterminated};
}

/**
 * Parse only the active Page projection.  We intentionally use a tolerant
 * projection instead of an XML DOM because the legacy files contain bare
 * ampersands and BOMs.  Raw bytes/hash remain the source authority.
 */
export function parseLessonXml(rawBytes, {xmlPath, moduleCode, lessonNumber} = {}) {
  const rawText = Buffer.from(rawBytes).toString("utf8");
  const warnings = [];
  const hasBom = rawBytes.length >= 3 && rawBytes[0] === 0xef && rawBytes[1] === 0xbb && rawBytes[2] === 0xbf;
  if (hasBom) warnings.push({code: "XML_UTF8_BOM", message: "UTF-8 BOM preserved in source bytes"});
  const {stripped, unterminated} = stripXmlComments(rawText);
  if (unterminated) warnings.push({code: "XML_UNTERMINATED_COMMENT", message: "unterminated comment removed from active projection"});
  const bareAmpersands = (stripped.match(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-f]+;)/gi) ?? []).length;
  if (bareAmpersands > 0) warnings.push({code: "XML_BARE_AMPERSAND", count: bareAmpersands, message: "tolerant projection retained bare ampersand"});
  const lessonName = firstTagText(stripped, "LessonName");
  const courseName = firstTagText(stripped, "CourseName");
  const sections = [];
  const pages = [];
  const sectionPattern = /<Section\b([^>]*)>([\s\S]*?)<\/Section\s*>/gi;
  let sectionMatch;
  while ((sectionMatch = sectionPattern.exec(stripped)) !== null) {
    const sectionAttributes = parseAttributes(sectionMatch[1]);
    const sectionBody = sectionMatch[2];
    const code = String(sectionAttributes.SName ?? sectionAttributes.sname ?? "").trim().toUpperCase() || null;
    const section = {
      code,
      number: sectionAttributes.SNumber ?? sectionAttributes.snumber ?? null,
      titleEnglish: firstTagText(sectionBody, "English"),
      titleSpanish: firstTagText(sectionBody, "Spanish"),
      sourceOffset: sectionMatch.index,
    };
    sections.push(section);
    const pagePattern = /<Page\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Page\s*>)/gi;
    let pageMatch;
    while ((pageMatch = pagePattern.exec(sectionBody)) !== null) {
      const attributes = parseAttributes(pageMatch[1]);
      const reference = decodeXmlEntities((pageMatch[2] ?? "").trim());
      const page = {
        ordinal: pages.length + 1,
        sectionCode: code,
        sectionNumber: section.number,
        titleEnglish: attributes.Title ?? attributes.title ?? null,
        randomAudio: attributes.RandomAudio ?? attributes.randomAudio ?? null,
        bgText: attributes.BGText ?? attributes.bgText ?? null,
        slideSpace: attributes.SlideSpace ?? attributes.slideSpace ?? null,
        navigation: attributes.Navigation ?? attributes.navigation ?? null,
        reference,
        sourceOffset: sectionMatch.index + pageMatch.index,
      };
      if (!reference) page.warnings = [{code: "PAGE_REFERENCE_EMPTY", message: "active Page has no SWF reference"}];
      pages.push(page);
    }
  }
  invariant(sections.length > 0, "XML_NO_SECTIONS", `${xmlPath ?? "lesson XML"}: no active Section elements found`);
  invariant(pages.length > 0, "XML_NO_ACTIVE_PAGES", `${xmlPath ?? "lesson XML"}: no active Page elements found`);
  return Object.freeze({
    moduleCode: moduleCode ?? null,
    lessonNumber: lessonNumber ?? null,
    lessonName,
    courseName,
    sections: Object.freeze(sections.map((section) => Object.freeze(section))),
    pages: Object.freeze(pages.map((page) => Object.freeze(page))),
    warnings: Object.freeze(warnings),
    rawBytes: rawBytes.length,
    hasBom,
  });
}

function normalizeModuleRoot(sourceViewPath, canonicalRoot, module) {
  const sourceRootValue = module.sourceRoot ?? module.path ?? module.moduleRoot;
  invariant(typeof sourceRootValue === "string" && sourceRootValue.length > 0, "PROFILE_MODULE_ROOT_MISSING",
    `${module.moduleCode}: sourceRoot is required`);
  const canonicalBase = path.resolve(sourceViewPath, canonicalRoot);
  if (path.isAbsolute(sourceRootValue)) {
    return ensureWithin(path.resolve(sourceRootValue), canonicalBase, "PROFILE_MODULE_ROOT_ESCAPES_CANONICAL", `${module.moduleCode} sourceRoot`);
  }
  const normalized = portable(path.normalize(sourceRootValue));
  const canonical = portable(path.normalize(canonicalRoot));
  let resolved;
  if (normalized === canonical || normalized.startsWith(`${canonical}/`)) resolved = path.resolve(sourceViewPath, normalized);
  else if (normalized === module.moduleCode || normalized.startsWith(`${module.moduleCode}/`)) resolved = path.resolve(sourceViewPath, canonical, normalized);
  else resolved = path.resolve(sourceViewPath, canonical, normalized);
  return ensureWithin(resolved, canonicalBase, "PROFILE_MODULE_ROOT_ESCAPES_CANONICAL", `${module.moduleCode} sourceRoot`);
}

function normalizeLessonNumbers(module) {
  if (Array.isArray(module.lessonNumbers)) return module.lessonNumbers.map(Number);
  if (Array.isArray(module.lessons)) {
    return module.lessons.map((lesson) => Number(typeof lesson === "number" ? lesson : lesson.lessonNumber ?? lesson.lesson));
  }
  if (module.lessons && typeof module.lessons === "object") {
    return Object.keys(module.lessons).map((key) => Number(String(key).replace(/^L/i, "")));
  }
  return [];
}

function validateSha(value, label, {optional = false} = {}) {
  if (optional && (value === undefined || value === null || value === "")) return null;
  invariant(typeof value === "string" && SHA256.test(value), "PROFILE_HASH_INVALID", `${label}: expected lowercase SHA-256`);
  return value;
}

export async function loadProfile(profilePathValue, {
  projectRoot = PROJECT_ROOT,
  sourceRootOverride = null,
  verifyArchiveReceipts = false,
  requireReadOnly = false,
  maxArchiveReceiptBytes = null,
} = {}) {
  const profilePath = resolvePath(profilePathValue || DEFAULT_PROFILE, "profile", {allowAbsolute: true, root: projectRoot});
  let raw;
  try {
    raw = await readFile(profilePath);
  } catch (error) {
    if (error?.code === "ENOENT") throw new FactoryError("PROFILE_MISSING", `profile does not exist: ${profilePath}`, {profilePath});
    throw error;
  }
  let profile;
  try {
    profile = JSON.parse(raw.toString("utf8"));
  } catch (error) {
    throw new FactoryError("PROFILE_INVALID_JSON", `profile is not valid JSON: ${profilePath}`, {cause: error.message});
  }
  invariant(profile && typeof profile === "object", "PROFILE_INVALID", "profile must be an object");
  invariant(profile.schemaVersion === PROFILE_SCHEMA_VERSION, "PROFILE_SCHEMA_UNSUPPORTED",
    `profile schemaVersion must be ${PROFILE_SCHEMA_VERSION}`);
  invariant(typeof profile.profileId === "string" && profile.profileId.length > 0, "PROFILE_ID_MISSING", "profileId is required");
  invariant(typeof profile.version === "string" && profile.version.length > 0, "PROFILE_VERSION_MISSING", "profile version is required");
  if (profile.profileId === "g678-shared-source-profile-v1") {
    const profileErrors = validateSharedProfile(profile);
    invariant(profileErrors.length === 0, "PROFILE_CONTRACT_INVALID", profileErrors.join("; "));
  }
  const sourceView = profile.sourceView && typeof profile.sourceView === "object" ? profile.sourceView : {};
  const relativeRoot = sourceView.relativeRoot ?? profile.canonicalRootRule?.relativePath ?? profile.canonicalRootRule ?? "G6-G8-shared";
  const normalizedRelativeRoot = portable(path.normalize(String(relativeRoot).replace(/^\/+/, "")));
  const rootEnvName = sourceView.rootEnv ?? "HELP_MATH_G678_SOURCE_ROOT";
  const declaredSourceViewPath = profile.sourceViewPath ?? null;
  const sourceViewToken = typeof declaredSourceViewPath === "string" && /^\$[A-Z][A-Z0-9_]*$/u.test(declaredSourceViewPath);
  const configuredRoot = sourceViewToken
    ? null
    : declaredSourceViewPath ?? profile.sourceRoot ?? sourceView.path ?? null;
  let sourceViewPath;
  if (sourceRootOverride) sourceViewPath = path.resolve(sourceRootOverride);
  else if (configuredRoot && path.isAbsolute(configuredRoot)) sourceViewPath = path.resolve(configuredRoot);
  else if (configuredRoot && typeof configuredRoot === "string") {
    const fromProfile = path.resolve(path.dirname(profilePath), configuredRoot);
    const fromEnv = process.env[rootEnvName] ? path.resolve(process.env[rootEnvName]) : null;
    // A relative `sourceRoot` in the canonical profile is normally the
    // canonical-root name, while a synthetic/test profile may place its view
    // beside the profile.  Prefer the explicit environment root when it has
    // the declared canonical directory; otherwise retain profile-relative
    // semantics.
    const configuredNormalized = portable(path.normalize(configuredRoot));
    const looksLikeCanonicalRoot = configuredNormalized === normalizedRelativeRoot ||
      configuredNormalized.startsWith(`${normalizedRelativeRoot}/`) ||
      configuredNormalized === path.basename(normalizedRelativeRoot);
    sourceViewPath = fromEnv && looksLikeCanonicalRoot ? fromEnv : fromProfile;
  }
  else if (sourceViewToken && process.env[rootEnvName]) sourceViewPath = path.resolve(process.env[rootEnvName]);
  else if (process.env[rootEnvName]) sourceViewPath = path.resolve(process.env[rootEnvName]);
  else throw new FactoryError("SOURCE_VIEW_ENV_MISSING", `source root is not configured; set ${rootEnvName} or pass --source-root`, {rootEnvName});
  if (path.basename(sourceViewPath) === path.basename(normalizedRelativeRoot)) {
    sourceViewPath = path.dirname(sourceViewPath);
  }
  const canonicalRoot = normalizedRelativeRoot || "G6-G8-shared";
  invariant(typeof canonicalRoot === "string" && canonicalRoot.length > 0, "PROFILE_CANONICAL_ROOT_MISSING", "canonicalRootRule.relativePath is required");
  let sourceViewInfo;
  try {
    sourceViewInfo = await lstat(sourceViewPath);
  } catch (error) {
    if (error?.code === "ENOENT") throw new FactoryError("SOURCE_VIEW_MISSING", `source root does not exist: ${sourceViewPath}`, {sourceViewPath});
    throw error;
  }
  invariant(sourceViewInfo.isDirectory() && !sourceViewInfo.isSymbolicLink(), "SOURCE_VIEW_NOT_DIRECTORY",
    `source root must be a non-symlink directory: ${sourceViewPath}`, {sourceViewPath});
  const canonicalRootPath = path.resolve(sourceViewPath, canonicalRoot);
  let canonicalRootInfo;
  try {
    canonicalRootInfo = await lstat(canonicalRootPath);
  } catch (error) {
    if (error?.code === "ENOENT") throw new FactoryError("SOURCE_CANONICAL_ROOT_MISSING",
      `canonical source root does not exist: ${canonicalRootPath}`, {sourceViewPath, canonicalRoot});
    throw error;
  }
  invariant(canonicalRootInfo.isDirectory() && !canonicalRootInfo.isSymbolicLink(), "SOURCE_CANONICAL_ROOT_NOT_DIRECTORY",
    `canonical source root must be a non-symlink directory: ${canonicalRootPath}`);
  const declaredModulesValue = profile.moduleDefinitions ?? profile.modules;
  const declaredModulesRaw = Array.isArray(declaredModulesValue)
    ? declaredModulesValue
    : Object.entries(declaredModulesValue ?? {}).map(([moduleCode, value]) => ({moduleCode, ...(value ?? {})}));
  // The v1 profile carries both the explicit moduleDefinitions contract and
  // the legacy `modules` projection.  Inherit omitted page-count/path fields
  // from the latter so adding the compatibility contract can never silently
  // turn expected counts into zero.
  const legacyModuleByCode = new Map(
    (Array.isArray(profile.modules) ? profile.modules : []).map((module) => [
      String(module?.moduleCode ?? '').toUpperCase(),
      module,
    ]),
  );
  const declaredModules = declaredModulesRaw.map((module) => ({
    ...(legacyModuleByCode.get(String(module?.moduleCode ?? '').toUpperCase()) ?? {}),
    ...(module ?? {}),
  }));
  invariant(Array.isArray(declaredModules) && declaredModules.length > 0,
    "PROFILE_MODULES_MISSING", "moduleDefinitions must be a non-empty array");
  const seenModules = new Set();
  const modules = declaredModules.map((module) => {
    invariant(module && typeof module === "object", "PROFILE_MODULE_INVALID", "module definition must be an object");
    const moduleCode = String(module.moduleCode ?? "").trim().toUpperCase();
    invariant(MODULE_CODE.test(moduleCode), "PROFILE_MODULE_CODE_INVALID", `invalid moduleCode: ${module.moduleCode}`);
    invariant(!seenModules.has(moduleCode), "PROFILE_MODULE_DUPLICATE", `duplicate moduleCode: ${moduleCode}`);
    seenModules.add(moduleCode);
    const moduleCountDeclaration = module.activePageCounts ?? null;
    const countMap = profile.activePageCounts?.[moduleCode] ??
      profile.activePageCounts?.[String(module.moduleCode ?? "").toUpperCase()] ??
      (Array.isArray(moduleCountDeclaration)
        ? Object.fromEntries(normalizeLessonNumbers(module).map((lesson, index) => [String(lesson), moduleCountDeclaration[index]]))
        : moduleCountDeclaration) ?? null;
    const declaredLessonNumbers = normalizeLessonNumbers(module);
    const lessonNumbers = declaredLessonNumbers.length > 0
      ? declaredLessonNumbers
      : Object.keys(countMap ?? {})
        .map((key) => Number(String(key).replace(/^L/i, "")))
        .filter((number) => Number.isSafeInteger(number));
    invariant(lessonNumbers.length > 0 && lessonNumbers.every((number) => Number.isSafeInteger(number) && number > 0),
      "PROFILE_LESSONS_INVALID", `${moduleCode}: lessonNumbers must be positive integers`);
    const expectedActivePageCount = module.expectedActivePageCount ?? module.activePageCount ??
      (countMap !== null && Number.isFinite(Number(countMap)) ? Number(countMap) : null) ??
      (countMap && typeof countMap === "object" && Object.keys(countMap).length > 0 ? Object.values(countMap).reduce((sum, value) => {
        const numeric = typeof value === "number" ? value : value?.expectedActivePageCount ?? value?.activePageCount;
        return sum + (Number.isFinite(Number(numeric)) ? Number(numeric) : 0);
      }, 0) : null);
    if (expectedActivePageCount !== undefined && expectedActivePageCount !== null) {
      invariant(Number.isSafeInteger(Number(expectedActivePageCount)) && Number(expectedActivePageCount) >= 0,
        "PROFILE_PAGE_COUNT_INVALID", `${moduleCode}: expectedActivePageCount must be a non-negative integer`);
    }
    return Object.freeze({
      ...module,
      moduleCode,
      moduleTitle: module.moduleTitle ?? module.title ?? module.titleEnglish ?? moduleCode,
      lessonNumbers: Object.freeze([...new Set(lessonNumbers)].sort((a, b) => a - b)),
      expectedActivePageCount: expectedActivePageCount === undefined || expectedActivePageCount === null ? null : Number(expectedActivePageCount),
      expectedActivePagesByLesson: {
        ...(countMap ?? {}),
        ...(module.expectedActivePagesByLesson ?? {}),
      },
      moduleRoot: normalizeModuleRoot(sourceViewPath, canonicalRoot, {...module, moduleCode}),
    });
  });
  const profileHash = sha256Bytes(raw);
  const witnessIdentities = {};
  for (const [relativePath, expectedSha256] of Object.entries(profile.witnesses ?? {})) {
    validateSha(expectedSha256, `witnesses.${relativePath}`);
    const witnessPath = resolvePath(relativePath, `witness ${relativePath}`, {root: sourceViewPath});
    ensureWithin(witnessPath, sourceViewPath, "WITNESS_ESCAPES_SOURCE_VIEW", `witness ${relativePath}`);
    const identity = await regularFileIdentity(witnessPath, {
      label: `witness ${relativePath}`,
      requireReadOnly,
    });
    invariant(identity.sha256 === expectedSha256, "WITNESS_HASH_DRIFT", `witness hash drifted: ${relativePath}`, {
      path: witnessPath,
      expected: expectedSha256,
      actual: identity.sha256,
    });
    witnessIdentities[relativePath] = identity;
  }
  const toolchain = normalizeToolchain(profile.toolchain ?? profile.toolchainVersions);
  const license = await resolveLicenseManifest(profile, profilePath);
  const parserModulePath = path.resolve(projectRoot, "scripts/lib/g678-shared-catalog.mjs");
  const parserSha256 = await sha256File(parserModulePath);
  const sourceManifestSha256 = validateSha(
    profile.sourceManifestSha256 ?? profile.witnesses?.["classification-manifest.jsonl"],
    "sourceManifestSha256",
    {optional: true},
  );
  const mappingManifestSha256 = validateSha(
    profile.mappingManifestSha256 ?? profile.gradeMapping?.mappingManifestSha256,
    "mappingManifestSha256",
    {optional: true},
  );
  const archiveReceiptBindings = await resolveArchiveReceiptBindings(profile, profilePath, {
    sourceViewPath,
    verifyArchiveReceipts,
    requireReadOnly,
    maxArchiveReceiptBytes,
  });
  return Object.freeze({
    ...profile,
    schemaVersion: PROFILE_SCHEMA_VERSION,
    profilePath,
    profilePathPortable: relativeProject(profilePath),
    profileSha256: profileHash,
    sourceViewPath,
    canonicalRoot,
    modules,
    witnessIdentities: Object.freeze(witnessIdentities),
    toolchain,
    license,
    parserModulePath: relativeProject(parserModulePath),
    parserSha256,
    sourceManifestSha256,
    mappingManifestSha256,
    archiveReceipts: archiveReceiptBindings,
    // Alias retained for internal callers from the first runner draft.
    archiveReceiptBindings,
  });
}

function normalizeToolchain(value) {
  const source = value && typeof value === "object" ? value : {};
  const normalized = {};
  for (const [name, entry] of Object.entries(source)) {
    if (Array.isArray(entry)) normalized[name] = {
      role: name,
      version: null,
      executable: null,
      sha256: null,
      status: "declared",
      argv: [],
      value: [...entry],
    };
    else if (entry && typeof entry === "object") normalized[name] = {
      role: entry.role ?? name,
      version: entry.version ?? null,
      executable: entry.executable ?? entry.path ?? null,
      sha256: entry.sha256 ?? null,
      status: entry.status ?? (entry.version ? "pinned" : "unresolved"),
      argv: Array.isArray(entry.argv) ? [...entry.argv] : [],
    };
    else normalized[name] = {role: name, version: entry ?? null, executable: null, sha256: null, status: entry ? "pinned" : "unresolved", argv: []};
  }
  for (const name of ["ffdec", "swfmill", "ffmpeg", "ffprobe", "playwright"]) {
    if (!normalized[name]) normalized[name] = {role: name, version: null, executable: null, sha256: null, status: "not-invoked", argv: []};
  }
  return Object.freeze(normalized);
}

async function resolveLicenseManifest(profile, profilePath) {
  const declaration = profile.licenseManifest ?? profile.licenses ?? null;
  if (!declaration) return Object.freeze({status: "unresolved", path: null, identity: null, reason: "licenseManifest not declared"});
  if (typeof declaration === "string") {
    const target = path.isAbsolute(declaration) ? path.resolve(declaration) : path.resolve(path.dirname(profilePath), declaration);
    const identity = await optionalIdentity(target, "license manifest");
    return Object.freeze({status: identity ? "hash-observed" : "unresolved", path: target, identity, reason: identity ? null : "license manifest file missing"});
  }
  invariant(typeof declaration === "object", "PROFILE_LICENSE_INVALID", "licenseManifest must be a path or object");
  const declaredPath = declaration.path ?? declaration.file ?? null;
  if (!declaredPath) {
    const entries = Object.entries(declaration).map(([name, value]) => ({
      name,
      license: typeof value === "string" ? value : value?.license ?? null,
      status: name === "productBundleAdmission" ? "blocked" : "declared",
    }));
    return Object.freeze({
      status: declaration.productBundleAdmission ? "declared-product-admission-blocked" : "declared-unhashed",
      path: null,
      identity: null,
      declaredSha256: null,
      entries,
      reason: "license declarations are not a hash-bound manifest file",
    });
  }
  let target = null;
  let identity = null;
  if (declaredPath) {
    target = path.isAbsolute(declaredPath) ? path.resolve(declaredPath) : path.resolve(path.dirname(profilePath), declaredPath);
    identity = await optionalIdentity(target, "license manifest");
  }
  if (declaration.sha256 !== undefined) validateSha(declaration.sha256, "licenseManifest.sha256");
  if (declaration.sha256 && identity) {
    invariant(identity.sha256 === declaration.sha256, "LICENSE_MANIFEST_HASH_DRIFT", "license manifest hash drifted", {
      path: target,
      expected: declaration.sha256,
      actual: identity.sha256,
    });
  }
  return Object.freeze({
    status: identity ? "hash-verified" : declaration.status ?? "unresolved",
    path: target,
    identity,
    declaredSha256: declaration.sha256 ?? null,
    entries: Array.isArray(declaration.entries) ? declaration.entries : [],
    reason: identity ? null : "license manifest not hash-verified",
  });
}

function moduleFor(profile, moduleCode) {
  const normalized = String(moduleCode ?? "").trim().toUpperCase();
  return profile.modules.find((module) => module.moduleCode === normalized) ?? null;
}

function lessonDefinition(module, lessonNumber) {
  const number = Number(lessonNumber);
  return module?.lessonNumbers.includes(number) ? number : null;
}

function candidateCalibration(profile) {
  const declared = profile.calibrationSet;
  const set = Array.isArray(declared)
    ? declared
    : declared?.pages ?? declared?.members ?? profile.calibration?.pages ?? profile.calibration?.members;
  invariant(Array.isArray(set) && set.length > 0, "CALIBRATION_SET_MISSING",
    "calibrate mode requires a non-empty profile.calibrationSet");
  return set.map((selection, index) => {
    invariant(selection && typeof selection === "object", "CALIBRATION_ENTRY_INVALID", `calibration entry ${index + 1} must be an object`);
    const moduleCode = String(selection.moduleCode ?? selection.module ?? "").toUpperCase();
    const lesson = parseLessonNumber(selection.lessonNumber ?? selection.lesson);
    invariant(moduleCode && Number.isSafeInteger(lesson), "CALIBRATION_ENTRY_INVALID",
      `calibration entry ${index + 1} requires moduleCode and lessonNumber`);
    const ordinal = selection.ordinal ?? selection.xmlOccurrence ?? null;
    if (ordinal !== null) invariant(Number.isSafeInteger(Number(ordinal)) && Number(ordinal) > 0,
      "CALIBRATION_ORDINAL_INVALID", `calibration entry ${index + 1} has invalid ordinal`);
    return {
      moduleCode,
      lessonNumber: lesson,
      ordinal: ordinal === null ? null : Number(ordinal),
      placementId: selection.placementId ?? null,
      lane: selection.lane ?? null,
      selectionRole: selection.selectionRole ?? null,
      selectionReason: selection.selectionReason ?? null,
    };
  });
}

function selectLessonTasks(profile, options) {
  if (options.mode === "calibrate") return candidateCalibration(profile);
  const moduleCode = options.moduleCode ? String(options.moduleCode).toUpperCase() : null;
  const lessonNumber = parseLessonNumber(options.lesson);
  invariant(!(moduleCode && options.batch), "EXTEND_SCOPE_CONFLICT", "--module-code/--lesson and --batch cannot be combined");
  invariant(!(lessonNumber !== null && !moduleCode), "EXTEND_LESSON_REQUIRES_MODULE", "--lesson requires --module-code");
  invariant(!(options.all && (moduleCode || options.batch || lessonNumber !== null)), "EXTEND_SCOPE_CONFLICT", "--all cannot be combined with a narrower scope");
  if (!moduleCode && !options.batch && !options.all) {
    throw new FactoryError("EXTEND_SCOPE_REQUIRED", "extend mode requires --module-code/--lesson, --batch, or explicit --all; refusing implicit catalog-wide run");
  }
  if (moduleCode) {
    const module = moduleFor(profile, moduleCode);
    invariant(module, "MODULE_NOT_IN_PROFILE", `moduleCode not found in profile: ${moduleCode}`);
    if (lessonNumber !== null) {
      invariant(lessonDefinition(module, lessonNumber) !== null, "LESSON_NOT_IN_PROFILE", `${moduleCode}: lesson ${lessonNumber} not in profile`);
      return [{moduleCode, lessonNumber, ordinal: null, placementId: null, lane: null, selectionRole: null, selectionReason: "explicit extend scope"}];
    }
    return module.lessonNumbers.map((lesson) => ({moduleCode, lessonNumber: lesson, ordinal: null, placementId: null, lane: null, selectionRole: null, selectionReason: "module extend scope"}));
  }
  if (options.batch) {
    const batches = profile.batches ?? profile.extendBatches ?? [];
    invariant(Array.isArray(batches), "PROFILE_BATCHES_INVALID", "profile batches must be an array");
    const batch = batches.find((entry) => String(entry.batchId ?? entry.id ?? "") === String(options.batch));
    invariant(batch, "BATCH_NOT_IN_PROFILE", `batch not found in profile: ${options.batch}`);
    const members = batch.members ?? batch.pages ?? batch.placements;
    invariant(Array.isArray(members) && members.length > 0, "BATCH_EMPTY", `batch ${options.batch} has no members`);
    return members.map((entry) => ({
      moduleCode: String(entry.moduleCode ?? entry.module ?? "").toUpperCase(),
      lessonNumber: parseLessonNumber(entry.lessonNumber ?? entry.lesson),
      ordinal: entry.ordinal ?? entry.xmlOccurrence ?? null,
      placementId: entry.placementId ?? null,
      lane: entry.lane ?? null,
      selectionRole: entry.selectionRole ?? null,
      selectionReason: entry.selectionReason ?? `profile batch ${options.batch}`,
    }));
  }
  return profile.modules.flatMap((module) => module.lessonNumbers.map((lesson) => ({
    moduleCode: module.moduleCode,
    lessonNumber: lesson,
    ordinal: null,
    placementId: null,
    lane: null,
    selectionRole: null,
    selectionReason: "explicit --all",
  })));
}

function findModulePageHint(profile, moduleCode, lessonNumber, ordinal, page) {
  const maps = [profile.laneOverrides, profile.pageHints, profile.auditHints, profile.placements,
    profile.calibrationSet, profile.calibration?.pages, profile.calibration?.members];
  for (const map of maps) {
    if (!map) continue;
    const candidates = Array.isArray(map) ? map.map((hint) => [null, hint]) : Object.entries(map);
    for (const [mapKey, hint] of candidates) {
      if (!hint || typeof hint !== "object") continue;
      const keyMatch = mapKey && String(mapKey).match(/^shared-([a-z0-9]+)-l(\d+)-p(\d+)$/i);
      if (keyMatch && (keyMatch[1].toUpperCase() !== moduleCode || Number(keyMatch[2]) !== lessonNumber || Number(keyMatch[3]) !== ordinal)) continue;
      const hasSelector = Boolean(keyMatch || hint.moduleCode || hint.module || hint.lessonNumber !== undefined || hint.lesson !== undefined || hint.ordinal !== undefined || hint.xmlOccurrence !== undefined || hint.placementId || hint.sourcePath);
      if (!hasSelector) continue;
      if (hint.moduleCode && String(hint.moduleCode).toUpperCase() !== moduleCode) continue;
      if (hint.lessonNumber !== undefined && Number(hint.lessonNumber) !== lessonNumber) continue;
      if (hint.lesson !== undefined && Number(hint.lesson) !== lessonNumber) continue;
      if (hint.ordinal !== undefined && Number(hint.ordinal) !== ordinal) continue;
      if (hint.xmlOccurrence !== undefined && Number(hint.xmlOccurrence) !== ordinal) continue;
      if (hint.placementId && hint.placementId !== page.placementId) continue;
      if (hint.sourcePath && hint.sourcePath !== page.sourcePath && !hint.sourcePath.endsWith(page.reference)) continue;
      return hint;
    }
  }
  return null;
}

export function classifyLane({hint = null, swfSignature = null, sourceOnly = true} = {}) {
  const unsupportedReasons = [];
  if (!swfSignature || !["FWS", "CWS", "ZWS"].includes(swfSignature)) unsupportedReasons.push("invalid-or-unknown-swf-signature");
  if (hint?.unsupported === true) unsupportedReasons.push("profile-marked-unsupported");
  if (Array.isArray(hint?.unsupportedFeatures)) unsupportedReasons.push(...hint.unsupportedFeatures.map(String));
  if (hint?.dependencyStatus === "blocked" || hint?.dependenciesResolved === false) unsupportedReasons.push("unresolved-dependency");
  if (hint?.variantDecision && !["canonical", "accepted-canonical"].includes(hint.variantDecision)) unsupportedReasons.push(`variant:${hint.variantDecision}`);
  const requested = hint?.lane ?? hint?.complexity ?? null;
  const lane = LANES.has(requested) ? requested : null;
  const unresolved = !lane || unsupportedReasons.length > 0 || sourceOnly;
  return Object.freeze({
    lane: lane ?? "unknown",
    laneDisposition: unsupportedReasons.length > 0 ? "hold-unsupported" : (!lane ? "hold-needs-source-audit" : (sourceOnly ? "structural-only" : "eligible")),
    sourceOnly,
    unsupportedReasons: Object.freeze([...new Set(unsupportedReasons)]),
    generationEligible: Boolean(lane && unsupportedReasons.length === 0 && !sourceOnly),
    unresolved,
  });
}

function resolveSwfReference({moduleRoot, lessonDir, reference}) {
  const cleanReference = reference.replace(/^\/+/, "");
  const candidates = [];
  if (cleanReference.startsWith("HELP_COURSES/")) {
    const withoutPrefix = cleanReference.slice("HELP_COURSES/".length);
    candidates.push(path.resolve(moduleRoot, withoutPrefix));
    candidates.push(path.resolve(path.dirname(moduleRoot), withoutPrefix));
  }
  candidates.push(path.resolve(lessonDir, cleanReference));
  candidates.push(path.resolve(moduleRoot, `L${path.basename(lessonDir).replace(/^L/i, "")}`, cleanReference));
  return [...new Set(candidates)].filter((candidate) => {
    try {
      ensureWithin(candidate, moduleRoot, "SOURCE_REFERENCE_ESCAPES_MODULE", "SWF reference");
      return true;
    } catch {
      return false;
    }
  });
}

async function readSwfIdentity(candidates, {requireReadOnly = false, label}) {
  let firstPath = candidates[0];
  for (const candidate of candidates) {
    firstPath = candidate;
    try {
      const info = await lstat(candidate);
      if (!info.isFile() || info.isSymbolicLink()) continue;
      const identity = await regularFileIdentity(candidate, {requireReadOnly, label});
      const header = await readFile(candidate, {encoding: null});
      const signature = header.length >= 3 ? header.subarray(0, 3).toString("ascii") : null;
      const swfVersion = header.length >= 4 ? header[3] : null;
      const declaredLength = header.length >= 8 ? header.readUInt32LE(4) : null;
      return {path: candidate, identity, signature, swfVersion, declaredLength};
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
  }
  throw new FactoryError("SWF_MISSING", `${label}: SWF reference cannot be resolved`, {candidates});
}

export async function enumerateSource(profile, tasks, {requireReadOnly = false} = {}) {
  const records = [];
  const lessonMap = new Map();
  const seenLessonKeys = new Set();
  const seenPlacementIds = new Set();
  for (const task of tasks) {
    const module = moduleFor(profile, task.moduleCode);
    invariant(module, "MODULE_NOT_IN_PROFILE", `moduleCode not found in profile: ${task.moduleCode}`);
    const lessonNumber = lessonDefinition(module, task.lessonNumber);
    invariant(lessonNumber !== null, "LESSON_NOT_IN_PROFILE", `${module.moduleCode}: lesson ${task.lessonNumber} not in profile`);
    const lessonKey = `shared-${module.moduleCode.toLowerCase()}-l${String(lessonNumber).padStart(2, "0")}`;
    invariant(!seenLessonKeys.has(lessonKey) || task.ordinal !== null || task.placementId,
      "DUPLICATE_LESSON_TASK", `duplicate lesson task without page selector: ${lessonKey}`);
    const lessonDir = path.join(module.moduleRoot, `L${lessonNumber}`);
    let lessonDirInfo;
    try {
      lessonDirInfo = await lstat(lessonDir);
    } catch (error) {
      if (error?.code === "ENOENT") throw new FactoryError("SOURCE_LESSON_DIRECTORY_MISSING",
        `${module.moduleCode} L${lessonNumber}: lesson directory does not exist`, {lessonDir});
      throw error;
    }
    invariant(lessonDirInfo.isDirectory() && !lessonDirInfo.isSymbolicLink(), "SOURCE_LESSON_DIRECTORY_INVALID",
      `${module.moduleCode} L${lessonNumber}: lesson directory must be a non-symlink directory`, {lessonDir});
    const xmlPath = path.join(lessonDir, "index.xml");
    let xmlBytes;
    try {
      xmlBytes = await readFile(xmlPath);
    } catch (error) {
      if (error?.code === "ENOENT") throw new FactoryError("SOURCE_XML_MISSING", `${module.moduleCode} L${lessonNumber}: index.xml does not exist`, {xmlPath});
      throw error;
    }
    const xmlIdentity = {
      bytes: xmlBytes.length,
      sha256: sha256Bytes(xmlBytes),
      writable: (await lstat(xmlPath)).mode & 0o222 ? true : false,
    };
    if (requireReadOnly) invariant(xmlIdentity.writable === false, "SOURCE_XML_WRITABLE", `${module.moduleCode} L${lessonNumber}: XML must be read-only`, {xmlPath});
    if (module.xmlSha256ByLesson?.[String(lessonNumber)]) {
      invariant(xmlIdentity.sha256 === module.xmlSha256ByLesson[String(lessonNumber)], "SOURCE_XML_HASH_DRIFT",
        `${module.moduleCode} L${lessonNumber}: XML hash drifted`, {expected: module.xmlSha256ByLesson[String(lessonNumber)], actual: xmlIdentity.sha256});
    }
    const projection = parseLessonXml(xmlBytes, {xmlPath: portable(xmlPath), moduleCode: module.moduleCode, lessonNumber});
    if (module.expectedActivePageCount !== null) {
      // A profile may specify per-lesson counts or a module total.  A module
      // total is checked after all selected lessons; per-lesson declarations
      // are checked immediately.
      const lessonEntry = Array.isArray(module.lessons)
        ? module.lessons.find((entry) => Number(entry?.lessonNumber ?? entry?.lesson) === lessonNumber)
        : module.lessons?.[String(lessonNumber)] ?? module.lessons?.[`L${lessonNumber}`];
      const expectedLesson = module.expectedActivePagesByLesson?.[String(lessonNumber)] ??
        module.expectedActivePagesByLesson?.[`L${lessonNumber}`] ??
        (typeof lessonEntry === "object" ? lessonEntry.expectedActivePageCount ?? lessonEntry.activePageCount : typeof lessonEntry === "number" ? lessonEntry : undefined);
      if (expectedLesson !== undefined) invariant(projection.pages.length === Number(expectedLesson), "ACTIVE_PAGE_COUNT_DRIFT",
        `${module.moduleCode} L${lessonNumber}: active page count drifted`, {expected: Number(expectedLesson), actual: projection.pages.length});
    }
    const selectedPages = projection.pages.filter((page) =>
      (task.ordinal === null || task.ordinal === undefined || page.ordinal === Number(task.ordinal)) &&
      (!task.placementId || task.placementId === `${lessonKey}-p${String(page.ordinal).padStart(3, "0")}`));
    invariant(selectedPages.length > 0, "CALIBRATION_PAGE_NOT_FOUND", `${lessonKey}: selected page is not present in XML`, {task});
    for (const page of selectedPages) {
      const placementId = `${lessonKey}-p${String(page.ordinal).padStart(3, "0")}`;
      invariant(!seenPlacementIds.has(placementId), "DUPLICATE_PLACEMENT", `duplicate placement: ${placementId}`);
      seenPlacementIds.add(placementId);
      const candidates = resolveSwfReference({moduleRoot: module.moduleRoot, lessonDir, reference: page.reference});
      invariant(candidates.length > 0, "SOURCE_REFERENCE_ESCAPES_MODULE",
        `${placementId}: SWF reference escapes the canonical module root`, {reference: page.reference});
      let swf;
      try {
        swf = await readSwfIdentity(candidates, {requireReadOnly, label: `${placementId} SWF`});
      } catch (error) {
        if (error?.code !== "SWF_MISSING") throw error;
        // Keep a structural record for missing SWF references in check/dry-run
        // callers, but make the lane unambiguously blocked.
        swf = {path: candidates[0], identity: null, signature: null, swfVersion: null, declaredLength: null, missing: true};
      }
      const sourcePath = portable(path.relative(profile.sourceViewPath, swf.path));
      const canonicalPrefix = profile.sourceView?.canonicalSourcePrefix ?? "HELP_COURSES";
      const cleanPageReference = page.reference.replace(/^\/+/, "");
      const canonicalPath = cleanPageReference.startsWith(`${canonicalPrefix}/`)
        ? cleanPageReference
        : `${canonicalPrefix}/${module.moduleCode}/L${lessonNumber}/${cleanPageReference}`;
      const canonicalXmlPath = `${canonicalPrefix}/${module.moduleCode}/L${lessonNumber}/index.xml`;
      const pageWithIdentity = {...page, placementId, sourcePath};
      const profileHint = findModulePageHint(profile, module.moduleCode, lessonNumber, page.ordinal, pageWithIdentity);
      const hint = task.lane || task.selectionReason
        ? {
            ...(profileHint ?? {}),
            ...(task.lane ? {lane: task.lane} : {}),
            ...(task.selectionRole ? {selectionRole: task.selectionRole} : {}),
            ...(task.selectionReason ? {selectionReason: task.selectionReason} : {}),
          }
        : profileHint;
      const lane = classifyLane({hint, swfSignature: swf.signature, sourceOnly: true});
      const source = swf.identity ? {
        path: sourcePath,
        canonicalPath,
        bytes: swf.identity.bytes,
        sha256: swf.identity.sha256,
        signature: swf.signature,
        swfVersion: swf.swfVersion,
        declaredLength: swf.declaredLength,
        writable: swf.identity.writable,
      } : {
        path: sourcePath,
        canonicalPath,
        bytes: null,
        sha256: null,
        signature: null,
        swfVersion: null,
        declaredLength: null,
        writable: null,
      };
      const record = {
        placementId,
        stableLessonKey: lessonKey,
        moduleCode: module.moduleCode,
        moduleTitle: module.moduleTitle,
        lessonNumber,
        lessonName: projection.lessonName,
        courseName: projection.courseName,
        sectionCode: page.sectionCode,
        sectionNumber: page.sectionNumber,
        xmlOccurrence: page.ordinal,
        pageReference: page.reference,
        titleEnglish: page.titleEnglish,
        randomAudio: page.randomAudio,
        bgText: page.bgText,
        slideSpace: page.slideSpace,
        navigation: page.navigation,
        sourceXml: {path: portable(path.relative(profile.sourceViewPath, xmlPath)), canonicalPath: canonicalXmlPath, ...xmlIdentity},
        source,
        assetId: source.sha256 ? `swf-${source.sha256}` : null,
        animationId: placementId,
        // Keep the source-root enum consistent with the catalog/release
        // contracts.  The selected archive is already bound separately by
        // `canonicalArchive: NewHelpProgram`; callers should not need to
        // special-case a second "canonical-newhelp" value.
        sourceRootKind: "canonical",
        swfOnly: true,
        fla: null,
        lane: lane.lane,
        laneDisposition: lane.laneDisposition,
        unsupportedReasons: lane.unsupportedReasons,
        generationEligible: lane.generationEligible,
        selectionRole: task.selectionRole ?? hint?.selectionRole ?? null,
        selectionReason: task.selectionReason ?? hint?.selectionReason ?? null,
        hint: hint ? {...hint} : null,
        warnings: [...projection.warnings, ...(page.warnings ?? [])],
        structuralStatus: source.sha256 ? "source-locked" : "blocked-missing-source",
        acceptanceEffects: {...ACCEPTANCE_EFFECTS_FALSE},
      };
      records.push(Object.freeze(record));
    }
    seenLessonKeys.add(lessonKey);
    const currentLesson = lessonMap.get(lessonKey);
    if (currentLesson) currentLesson.selectedPageCount += selectedPages.length;
    else lessonMap.set(lessonKey, {
      stableLessonKey: lessonKey,
      moduleCode: module.moduleCode,
      moduleTitle: module.moduleTitle,
      lessonNumber,
      lessonName: projection.lessonName,
      courseName: projection.courseName,
      sourceXml: {
        path: portable(path.relative(profile.sourceViewPath, xmlPath)),
        canonicalPath: `${profile.sourceView?.canonicalSourcePrefix ?? "HELP_COURSES"}/${module.moduleCode}/L${lessonNumber}/index.xml`,
        ...xmlIdentity,
      },
      activePageCount: projection.pages.length,
      selectedPageCount: selectedPages.length,
      sections: projection.sections,
      warnings: projection.warnings,
    });
  }
  return Object.freeze({
    lessons: Object.freeze([...lessonMap.values()].map((lesson) => Object.freeze(lesson))),
    placements: Object.freeze(records.sort((left, right) => left.moduleCode.localeCompare(right.moduleCode) || left.lessonNumber - right.lessonNumber || left.xmlOccurrence - right.xmlOccurrence)),
  });
}

function toolchainSnapshot(profile, scriptIdentity) {
  return {
    ...profile.toolchain,
    runner: {
      role: "factory-runner",
      version: FACTORY_SCHEMA_VERSION,
      executable: process.execPath,
      sha256: null,
      status: "runtime-observed",
      argv: process.argv.slice(2),
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      scriptPath: relativeProject(SCRIPT_PATH),
      scriptSha256: scriptIdentity,
    },
  };
}

export function computeCacheKey({profile, selected, source, options, scriptSha256}) {
  const payload = {
    cacheSchemaVersion: 1,
    profileId: profile.profileId,
    profileVersion: profile.version,
    profileSha256: profile.profileSha256,
    parserSha256: profile.parserSha256 ?? null,
    sourceManifestSha256: profile.sourceManifestSha256,
    mappingManifestSha256: profile.mappingManifestSha256,
    archiveReceipts: archiveReceiptSummary(profile),
    witnessIdentities: Object.fromEntries(
      Object.entries(profile.witnessIdentities ?? {})
        .map(([name, identity]) => [name, identity?.sha256 ?? null])
        .sort(([left], [right]) => left.localeCompare(right, "en")),
    ),
    selected: selected.map((entry) => ({
      placementId: entry.placementId,
      sourcePath: entry.source.path,
      sourceSha256: entry.source.sha256,
      sourceXmlPath: entry.sourceXml.path,
      sourceXmlSha256: entry.sourceXml.sha256,
      lane: entry.lane,
      selectionRole: entry.selectionRole ?? null,
      unsupportedReasons: entry.unsupportedReasons,
    })),
    toolchain: profile.toolchain,
    license: profile.license,
    generator: {
      scriptSha256,
      irSchemaVersion: IR_SCHEMA_VERSION,
      adapterVersion: profile.adapterVersion ?? null,
      generatorVersion: profile.generatorVersion ?? null,
      adapterSha256: profile.adapterSha256 ?? null,
    },
    backendVersions: profile.backendVersions ?? profile.toolchainVersions ?? profile.toolchain,
    launcherArgs: profile.launcherArgs ?? [],
    // Scope is already represented by the ordered placement identities above.
    // Do not include the CLI mode/selector in the key: `check` must recompute
    // the same key as the producing `calibrate` or `extend` run.
    configuration: {
      factoryScope: "placement-set",
      archiveReceiptVerification: options.verifyArchiveReceipts ? "explicit-bounded-hash" : "not-requested",
      maxArchiveReceiptBytes: options.maxArchiveReceiptBytes ?? DEFAULT_MAX_ARCHIVE_RECEIPT_BYTES,
    },
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  };
  return {cacheKey: sha256Bytes(stableJson(payload)).slice(0, 64), payload};
}

export function computeInputManifestSha256({profile, source, selected, scriptSha256, options = {}}) {
  return sha256Bytes(stableJson({
    schemaVersion: 1,
    profileId: profile.profileId,
    profileSha256: profile.profileSha256,
    sourceManifestSha256: profile.sourceManifestSha256,
    mappingManifestSha256: profile.mappingManifestSha256,
    archiveReceipts: archiveReceiptSummary(profile),
    archiveReceiptVerification: {
      status: options.verifyArchiveReceipts ? "explicit-bounded-hash" : "not-requested",
      maxBytes: options.maxArchiveReceiptBytes ?? DEFAULT_MAX_ARCHIVE_RECEIPT_BYTES,
    },
    witnessIdentities: Object.fromEntries(
      Object.entries(profile.witnessIdentities ?? {})
        .map(([name, identity]) => [name, identity?.sha256 ?? null])
        .sort(([left], [right]) => left.localeCompare(right, "en")),
    ),
    scriptSha256,
    parserSha256: profile.parserSha256 ?? null,
    irSchemaVersion: IR_SCHEMA_VERSION,
    adapterSha256: profile.adapterSha256 ?? null,
    placements: selected.map((entry) => ({
      placementId: entry.placementId,
      sourcePath: entry.source.path,
      sourceSha256: entry.source.sha256,
      sourceXmlPath: entry.sourceXml.path,
      sourceXmlSha256: entry.sourceXml.sha256,
      lane: entry.lane,
    })),
    lessonCount: source.lessons.length,
  })).slice(0, 64);
}

function computeOutputManifestSha256(source) {
  const sourceHashes = [...new Set(source.placements.map((entry) => entry.source.sha256).filter(Boolean))].sort();
  const sourceXmlHashes = [...new Set(source.placements.map((entry) => entry.sourceXml.sha256).filter(Boolean))].sort();
  return sha256Bytes(stableJson({
    placementIds: source.placements.map((entry) => entry.placementId),
    sourceAssetSha256: sourceHashes,
    sourceXmlSha256: sourceXmlHashes,
    sourcePlacements: source.placements.map((entry) => ({
      placementId: entry.placementId,
      sourcePath: entry.source.path,
      sourceSha256: entry.source.sha256,
      sourceXmlPath: entry.sourceXml.path,
      sourceXmlSha256: entry.sourceXml.sha256,
    })),
  }));
}

async function directoryInventory(root, {exclude = []} = {}) {
  const excluded = new Set(exclude);
  const records = [];
  async function walk(current) {
    let entries = await readdir(current, {withFileTypes: true});
    entries = entries.sort((a, b) => a.name.localeCompare(b.name, "en"));
    for (const entry of entries) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(target);
      else if (entry.isFile()) {
        const relative = portable(path.relative(root, target));
        if (excluded.has(relative)) continue;
        const identity = await regularFileIdentity(target, {label: target});
        records.push({path: relative, ...identity});
      } else throw new FactoryError("OUTPUT_UNSUPPORTED_ENTRY", `unsupported output entry: ${target}`);
    }
  }
  await walk(root);
  const checksumSetSha256 = sha256Bytes(records.map((record) => `${record.sha256}  ${record.path}\n`).join(""));
  return {fileCount: records.length, checksumSetSha256, records};
}

async function pathExists(target) {
  try {
    await access(target, fsConstants.F_OK);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function writeExclusive(filePath, contents) {
  await mkdir(path.dirname(filePath), {recursive: true});
  try {
    await writeFile(filePath, contents, {flag: "wx"});
  } catch (error) {
    if (error?.code === "EEXIST") throw new FactoryError("OUTPUT_FILE_EXISTS", `output file already exists: ${filePath}`, {filePath});
    throw error;
  }
}

async function writeRunArtifacts(staging, {profile, source, cacheKey, runManifest, options}) {
  await mkdir(path.join(staging, "structural", "placements"), {recursive: true});
  await mkdir(path.join(staging, "structural", "lessons"), {recursive: true});
  await writeExclusive(path.join(staging, "structural", "placements.json"), stableJson(source.placements));
  await writeExclusive(path.join(staging, "structural", "lessons.json"), stableJson(source.lessons));
  await writeExclusive(path.join(staging, "run-manifest.json"), stableJson(runManifest));
  await writeExclusive(path.join(staging, "source-profile-lock.json"), stableJson({
    schemaVersion: 1,
    profileId: profile.profileId,
    profileVersion: profile.version,
    profilePath: profile.profilePathPortable,
    profileSha256: profile.profileSha256,
    sourceViewPath: profile.sourceViewPath,
    canonicalRoot: profile.canonicalRoot,
    sourceManifestSha256: profile.sourceManifestSha256,
    mappingManifestSha256: profile.mappingManifestSha256,
    parserSha256: profile.parserSha256 ?? null,
    archiveReceiptGate: archiveReceiptGate(profile),
    archiveReceipts: archiveReceiptSummary(profile),
    archiveReceiptVerification: archiveReceiptVerification(options, profile),
  }));
  for (const lesson of source.lessons) {
    await writeExclusive(path.join(staging, "structural", "lessons", `${lesson.stableLessonKey}.json`), stableJson(lesson));
  }
  for (const placement of source.placements) {
    await writeExclusive(path.join(staging, "structural", "placements", `${placement.placementId}.json`), stableJson(placement));
  }
  const summary = buildSummary({profile, source, cacheKey, options, runManifest});
  await writeExclusive(path.join(staging, "summary.json"), stableJson(summary));
  const inventory = await directoryInventory(staging, {exclude: ["output-inventory.json"]});
  await writeExclusive(path.join(staging, "output-inventory.json"), stableJson(inventory));
  return {summary, inventory};
}

function buildSummary({profile, source, cacheKey, options, runManifest}) {
  const placements = source.placements;
  const structuralValid = placements.filter((entry) => entry.source.sha256 && entry.source.signature && ["FWS", "CWS", "ZWS"].includes(entry.source.signature)).length;
  const laneCounts = Object.fromEntries(["low", "interactive-understood", "behavior-heavy", "unknown"].map((lane) => [lane, placements.filter((entry) => entry.lane === lane).length]));
  const unsupported = placements.filter((entry) => entry.unsupportedReasons.length > 0).length;
  const missing = placements.filter((entry) => !entry.source.sha256).length;
  return {
    schemaVersion: FACTORY_SCHEMA_VERSION,
    factory: FACTORY_NAME,
    profileId: profile.profileId,
    profileVersion: profile.version,
    runId: runManifest.runId,
    mode: options.mode,
    status: "structural-audit-only",
    sourceViewPath: profile.sourceViewPath,
    canonicalRoot: profile.canonicalRoot,
    scope: {
      lessonCount: source.lessons.length,
      placementCount: placements.length,
      shellCount: 0,
      legacyCourseShellExcluded: true,
      modernMyLessonHostRetained: true,
    },
    funnel: {
      structural: {attempted: placements.length, validSwf: structuralValid, invalidOrMissing: placements.length - structuralValid},
      candidate: {runnable: 0, unregistered: 0},
      registeredCurrentJs: 0,
      evidence: {originalRuntime: 0, behavior: 0, fidelity: 0, audio: 0},
      review: {humanVisual: 0, owner: 0},
      downstream: {strictComplete: 0, released: 0, published: 0},
    },
    lanes: laneCounts,
    unsupportedPlacementCount: unsupported,
    missingSourcePlacementCount: missing,
    swfOnlyPlacementCount: placements.filter((entry) => entry.swfOnly).length,
    cacheKey,
    archiveReceiptGate: archiveReceiptGate(profile),
    archiveReceipts: archiveReceiptSummary(profile),
    archiveReceiptVerification: archiveReceiptVerification(options, profile),
    acceptanceEffects: {...ACCEPTANCE_EFFECTS_FALSE},
    license: profile.license,
    toolchain: runManifest.toolchain,
    warnings: [...new Set(placements.flatMap((entry) => entry.warnings.map((warning) => warning.code)))],
    dryRun: Boolean(options.dryRun),
  };
}

function buildRunManifest({
  profile,
  source,
  options,
  cacheKey,
  scriptSha256,
  runId,
  stagingPath,
  elapsedMachineMs,
}) {
  const sourceHashes = [...new Set(source.placements.map((entry) => entry.source.sha256).filter(Boolean))].sort();
  const sourceXmlHashes = [...new Set(source.placements.map((entry) => entry.sourceXml.sha256).filter(Boolean))].sort();
  const generatorSha256 = scriptSha256;
  const laneValues = [...new Set(source.placements.map((entry) => entry.lane))];
  const outputManifestSha256 = computeOutputManifestSha256(source);
  const warnings = [...new Set(source.placements.flatMap((entry) =>
    (entry.warnings ?? []).map((warning) => warning.code ?? String(warning))))];
  const inputManifestSha256 = computeInputManifestSha256({
    profile,
    source,
    selected: source.placements,
    scriptSha256,
    options,
  });
  return {
    schemaVersion: FACTORY_SCHEMA_VERSION,
    manifestKind: "FactoryRunManifestV2",
    factory: FACTORY_NAME,
    runId,
    createdAt: new Date().toISOString(),
    mode: options.mode,
    archiveReceiptGate: archiveReceiptGate(profile),
    archiveReceipts: archiveReceiptSummary(profile),
    archiveReceiptVerification: archiveReceiptVerification(options, profile),
    lane: laneValues.length === 1 ? laneValues[0] : "mixed",
    inputManifestSha256,
    parserSha256: profile.parserSha256 ?? null,
    assetSha256: sourceHashes,
    backendVersions: profile.backendVersions ?? profile.toolchainVersions ?? profile.toolchain,
    irSchemaVersion: IR_SCHEMA_VERSION,
    generatorSha256,
    adapterSha256: profile.adapterSha256 ?? null,
    stagingPath: portable(path.relative(PROJECT_ROOT, stagingPath)),
    outputManifestSha256,
    warnings,
    failureCode: null,
    elapsedMachineMs: Number.isFinite(elapsedMachineMs) ? Math.max(0, Math.round(elapsedMachineMs)) : 0,
    reworkOfRunId: options.reworkOfRunId ?? null,
    profile: {
      path: profile.profilePathPortable,
      profileId: profile.profileId,
      version: profile.version,
      sha256: profile.profileSha256,
      sourceViewPath: profile.sourceViewPath,
      canonicalRoot: profile.canonicalRoot,
      sourceManifestSha256: profile.sourceManifestSha256,
      mappingManifestSha256: profile.mappingManifestSha256,
      parserSha256: profile.parserSha256 ?? null,
    },
    placementIds: source.placements.map((entry) => entry.placementId),
    sourceAssetSha256: sourceHashes,
    sourceXmlSha256: sourceXmlHashes,
    sourcePlacements: source.placements.map((entry) => ({
      placementId: entry.placementId,
      sourcePath: entry.source.path,
      sourceSha256: entry.source.sha256,
      sourceXmlPath: entry.sourceXml.path,
      sourceXmlSha256: entry.sourceXml.sha256,
    })),
    sourceIdentity: {
      lessonCount: source.lessons.length,
      placementCount: source.placements.length,
      sourceAssetUniqueSha256Count: sourceHashes.length,
      swfOnlyPlacementCount: source.placements.filter((entry) => entry.swfOnly).length,
    },
    laneSummary: Object.fromEntries(["low", "interactive-understood", "behavior-heavy", "unknown"].map((lane) => [lane, source.placements.filter((entry) => entry.lane === lane).length])),
    toolchain: toolchainSnapshot(profile, scriptSha256),
    generator: {
      script: relativeProject(SCRIPT_PATH),
      sha256: generatorSha256,
      irSchemaVersion: IR_SCHEMA_VERSION,
      adapterVersion: profile.adapterVersion ?? null,
      generatorVersion: profile.generatorVersion ?? null,
      extractionInvoked: false,
      runtimeInvoked: false,
    },
    launcherArgs: profile.launcherArgs ?? [],
    cache: {cacheKey, cacheSchemaVersion: 1, hit: false},
    staging: {strategy: "create-exclusive-atomic-rename", output: options.output, staging: null},
    acceptanceEffects: {...ACCEPTANCE_EFFECTS_FALSE},
    failure: null,
  };
}

async function cacheEntry(cacheRoot, cacheKey) {
  return path.join(cacheRoot, cacheKey);
}

async function materializeCacheRecord(cacheRoot, cacheKey, payload) {
  await mkdir(cacheRoot, {recursive: true});
  const destination = await cacheEntry(cacheRoot, cacheKey);
  if (await pathExists(destination)) {
    const existing = await readFile(path.join(destination, "cache-record.json"), "utf8").catch(() => null);
    if (!existing) throw new FactoryError("CACHE_CORRUPT", `cache entry lacks cache-record.json: ${destination}`);
    let record;
    try {
      record = JSON.parse(existing);
    } catch (error) {
      throw new FactoryError("CACHE_CORRUPT", `cache record is invalid JSON: ${destination}`, {cause: error.message});
    }
    if (stableJson(record) !== stableJson(payload)) {
      throw new FactoryError("CACHE_CONTENT_DRIFT", `content-addressed cache payload drifted: ${destination}`, {cacheKey});
    }
    return {hit: true, path: destination, record};
  }
  const staging = `${destination}.staging-${process.pid}-${randomUUID()}`;
  await mkdir(staging, {recursive: false});
  try {
    await writeExclusive(path.join(staging, "cache-record.json"), stableJson(payload));
    await writeExclusive(path.join(staging, "README.txt"), "Structural metadata only; no runnable renderer or acceptance evidence.\n");
    try {
      await rename(staging, destination);
    } catch (error) {
      if (error?.code === "EEXIST") {
        const existing = JSON.parse(await readFile(path.join(destination, "cache-record.json"), "utf8"));
        if (stableJson(existing) !== stableJson(payload)) throw new FactoryError("CACHE_CONTENT_DRIFT", `content-addressed cache payload drifted after race: ${destination}`, {cacheKey});
        return {hit: true, path: destination, record: existing};
      }
      throw error;
    }
  } catch (error) {
    error.message = `${error.message}\nCache staging retained at ${staging}`;
    throw error;
  }
  return {hit: false, path: destination, record: payload};
}

async function tasksFromExistingRun(options) {
  const output = resolveOutput(options.output);
  const manifestPath = path.join(output, "run-manifest.json");
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") throw new FactoryError("RUN_MANIFEST_MISSING", `cannot infer check scope; run manifest does not exist: ${manifestPath}`, {output});
    throw new FactoryError("RUN_MANIFEST_INVALID", `cannot infer check scope; run manifest is invalid: ${manifestPath}`, {cause: error.message});
  }
  invariant(Array.isArray(manifest.placementIds) && manifest.placementIds.length > 0,
    "RUN_PLACEMENT_SET_MISSING", "run manifest has no placementIds; pass explicit check scope");
  return manifest.placementIds.map((placementId) => {
    const match = String(placementId).match(/^shared-([a-z0-9]+)-l(\d+)-p(\d+)$/i);
    invariant(match, "RUN_PLACEMENT_ID_INVALID", `cannot infer module/lesson from placementId: ${placementId}`);
    return {
      moduleCode: match[1].toUpperCase(),
      lessonNumber: parseLessonNumber(match[2]),
      ordinal: Number(match[3]),
      placementId: String(placementId),
      lane: null,
      selectionReason: "inferred from existing run manifest",
    };
  });
}

export async function runFactory(optionsInput) {
  const runStartedAt = process.hrtime.bigint();
  const options = normalizeOptions(optionsInput);
  const profile = await loadProfile(options.profile, {
    sourceRootOverride: options.sourceRoot,
    verifyArchiveReceipts: options.verifyArchiveReceipts,
    requireReadOnly: options.requireReadOnly,
    maxArchiveReceiptBytes: options.maxArchiveReceiptBytes,
  });
  const scriptSha256 = await sha256File(SCRIPT_PATH);
  const tasks = options.mode === "check" && !options.moduleCode && !options.batch && !options.all
    ? await tasksFromExistingRun(options)
    : selectLessonTasks(profile, options);
  const source = await enumerateSource(profile, tasks, {
    requireReadOnly: options.requireReadOnly || profile.requireReadOnlySource === true,
  });
  const selected = source.placements;
  const missingSources = selected.filter((entry) => !entry.source.sha256);
  invariant(missingSources.length === 0, "SOURCE_CLOSURE_INCOMPLETE",
    `${missingSources.length} selected SWF source(s) are missing; structural run remains blocked`, {
      missingPlacementIds: missingSources.map((entry) => entry.placementId),
    });
  const {cacheKey, payload: cachePayload} = computeCacheKey({profile, selected, source, options, scriptSha256});
  if (options.dryRun) {
    return {
      mode: options.mode,
      dryRun: true,
      profileId: profile.profileId,
      runId: options.runId ?? null,
      cacheKey,
      lessonCount: source.lessons.length,
      placementCount: selected.length,
      laneCounts: Object.fromEntries(["low", "interactive-understood", "behavior-heavy", "unknown"].map((lane) => [lane, selected.filter((entry) => entry.lane === lane).length])),
      unsupportedPlacementCount: selected.filter((entry) => entry.unsupportedReasons.length > 0).length,
      missingSourcePlacementCount: selected.filter((entry) => !entry.source.sha256).length,
      archiveReceiptGate: archiveReceiptGate(profile),
      archiveReceipts: archiveReceiptSummary(profile),
      archiveReceiptVerification: archiveReceiptVerification(options, profile),
      acceptanceEffects: {...ACCEPTANCE_EFFECTS_FALSE},
      status: "dry-run-structural-only",
    };
  }
  if (options.mode === "check") return checkRun(options, profile, source, cacheKey, scriptSha256);
  const output = resolveOutput(options.output);
  invariant(!(await pathExists(output)), "OUTPUT_EXISTS", `output already exists; use a new run/output path: ${output}`, {output});
  const runId = options.runId ?? `${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${randomUUID().slice(0, 12)}`;
  const staging = `${output}.staging-${process.pid}-${randomUUID()}`;
  await mkdir(path.dirname(output), {recursive: true});
  await mkdir(staging, {recursive: false});
  const runManifest = buildRunManifest({
    profile,
    source,
    options,
    cacheKey,
    scriptSha256,
    runId,
    stagingPath: staging,
    elapsedMachineMs: Number(process.hrtime.bigint() - runStartedAt) / 1e6,
  });
  runManifest.staging.staging = portable(path.relative(PROJECT_ROOT, staging));
  try {
    const cache = await materializeCacheRecord(resolveCache(options.cache), cacheKey, {
      schemaVersion: 1,
      cacheKey,
      payload: cachePayload,
      sourceAssetSha256: [...new Set(selected.map((entry) => entry.source.sha256).filter(Boolean))].sort(),
      outputKind: "structural-only",
      acceptanceEffects: {...ACCEPTANCE_EFFECTS_FALSE},
    });
    runManifest.cache.hit = cache.hit;
    runManifest.cache.path = portable(path.relative(PROJECT_ROOT, cache.path));
    const artifacts = await writeRunArtifacts(staging, {profile, source, cacheKey, runManifest, options});
    await rename(staging, output);
    return {
      mode: options.mode,
      status: "structural-audit-only",
      runId,
      output: portable(path.relative(PROJECT_ROOT, output)),
      cacheKey,
      cacheHit: cache.hit,
      lessonCount: source.lessons.length,
      placementCount: selected.length,
      summary: artifacts.summary,
      acceptanceEffects: {...ACCEPTANCE_EFFECTS_FALSE},
    };
  } catch (error) {
    const failure = {
      schemaVersion: 1,
      manifestKind: "FactoryRunFailureV1",
      runId,
      mode: options.mode,
      profileId: profile.profileId,
      cacheKey,
      code: error.code ?? "FACTORY_RUN_FAILED",
      message: error.message,
      details: error.details ?? {},
      staging: portable(path.relative(PROJECT_ROOT, staging)),
      acceptanceEffects: {...ACCEPTANCE_EFFECTS_FALSE},
      createdAt: new Date().toISOString(),
    };
    await writeFile(path.join(staging, "failure.json"), stableJson(failure)).catch(() => {});
    throw new FactoryError(failure.code, `${failure.message}; failure diagnostics retained at ${staging}`, failure);
  }
}

function resolveOutput(outputValue) {
  const output = resolvePath(outputValue || DEFAULT_OUTPUT, "output");
  return ensureWithin(output, path.join(PROJECT_ROOT, "work"), "OUTPUT_ESCAPES_WORK", "output");
}

function resolveCache(cacheValue) {
  const cache = resolvePath(cacheValue || DEFAULT_CACHE, "cache");
  return ensureWithin(cache, path.join(PROJECT_ROOT, "work"), "CACHE_ESCAPES_WORK", "cache");
}

async function checkRun(options, profile, source, cacheKey, scriptSha256) {
  const output = resolveOutput(options.output);
  invariant(await pathExists(output), "OUTPUT_MISSING", `check output does not exist: ${output}`, {output});
  const manifestPath = path.join(output, "run-manifest.json");
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    throw new FactoryError("RUN_MANIFEST_MISSING", `run-manifest.json is missing or invalid: ${manifestPath}`, {cause: error.message});
  }
  invariant(manifest.schemaVersion === FACTORY_SCHEMA_VERSION && manifest.manifestKind === "FactoryRunManifestV2",
    "RUN_MANIFEST_SCHEMA_DRIFT", "run manifest schema/kind drifted");
  invariant(manifest.profile?.profileId === profile.profileId && manifest.profile?.sha256 === profile.profileSha256,
    "RUN_PROFILE_DRIFT", "run manifest profile identity drifted", {expected: profile.profileSha256, actual: manifest.profile?.sha256});
  invariant(manifest.parserSha256 === profile.parserSha256 &&
    manifest.profile?.parserSha256 === profile.parserSha256,
  "RUN_PARSER_DRIFT", "run parser identity drifted", {
    expected: profile.parserSha256,
    actual: manifest.parserSha256 ?? manifest.profile?.parserSha256,
  });
  invariant(manifest.archiveReceiptGate === archiveReceiptGate(profile),
    "RUN_ARCHIVE_RECEIPT_GATE_DRIFT", "run archive receipt gate drifted");
  invariant(stableJson(manifest.archiveReceipts ?? []) === stableJson(archiveReceiptSummary(profile)),
    "RUN_ARCHIVE_RECEIPT_BINDING_DRIFT", "run archive receipt bindings drifted");
  invariant(stableJson(manifest.archiveReceiptVerification) === stableJson(archiveReceiptVerification(options, profile)),
    "RUN_ARCHIVE_RECEIPT_VERIFICATION_DRIFT", "run archive receipt verification policy drifted");
  invariant(JSON.stringify(manifest.placementIds) === JSON.stringify(source.placements.map((entry) => entry.placementId)),
    "RUN_PLACEMENT_SET_DRIFT", "run manifest placement set/order drifted");
  invariant(JSON.stringify(manifest.sourceAssetSha256) === JSON.stringify([...new Set(source.placements.map((entry) => entry.source.sha256).filter(Boolean))].sort()),
    "RUN_SOURCE_HASH_DRIFT", "run manifest source hash set drifted");
  const expectedSourcePlacements = source.placements.map((entry) => ({
    placementId: entry.placementId,
    sourcePath: entry.source.path,
    sourceSha256: entry.source.sha256,
    sourceXmlPath: entry.sourceXml.path,
    sourceXmlSha256: entry.sourceXml.sha256,
  }));
  invariant(stableJson(manifest.sourcePlacements) === stableJson(expectedSourcePlacements),
    "RUN_SOURCE_PLACEMENT_DRIFT", "run manifest source placement identities drifted");
  const expectedInputManifestSha256 = computeInputManifestSha256({
    profile,
    source,
    selected: source.placements,
    scriptSha256,
    options,
  });
  invariant(manifest.inputManifestSha256 === expectedInputManifestSha256,
    "RUN_INPUT_MANIFEST_DRIFT", "run input manifest identity drifted", {
      expected: expectedInputManifestSha256,
      actual: manifest.inputManifestSha256,
    });
  invariant(JSON.stringify(manifest.assetSha256) === JSON.stringify(manifest.sourceAssetSha256),
    "RUN_ASSET_HASH_DRIFT", "run asset hash alias drifted");
  invariant(manifest.irSchemaVersion === IR_SCHEMA_VERSION &&
    manifest.generator?.irSchemaVersion === IR_SCHEMA_VERSION,
  "RUN_IR_SCHEMA_DRIFT", "run IR schema version drifted");
  invariant(manifest.generatorSha256 === scriptSha256 &&
    manifest.generator?.sha256 === scriptSha256,
  "RUN_GENERATOR_DRIFT", "run generator hash drifted", {
    expected: scriptSha256,
    actual: manifest.generatorSha256 ?? manifest.generator?.sha256,
  });
  invariant(manifest.adapterSha256 === (profile.adapterSha256 ?? null),
    "RUN_ADAPTER_DRIFT", "run adapter hash drifted");
  invariant(stableJson(manifest.backendVersions) === stableJson(
    profile.backendVersions ?? profile.toolchainVersions ?? profile.toolchain,
  ), "RUN_BACKEND_VERSION_DRIFT", "run backend version bindings drifted");
  const expectedLaneValues = [...new Set(source.placements.map((entry) => entry.lane))];
  const expectedLane = expectedLaneValues.length === 1 ? expectedLaneValues[0] : "mixed";
  invariant(manifest.lane === expectedLane, "RUN_LANE_DRIFT", "run lane binding drifted", {
    expected: expectedLane,
    actual: manifest.lane,
  });
  const expectedWarnings = [...new Set(source.placements.flatMap((entry) =>
    (entry.warnings ?? []).map((warning) => warning?.code ?? String(warning))))];
  invariant(stableJson(manifest.warnings) === stableJson(expectedWarnings),
    "RUN_WARNING_DRIFT", "run warning bindings drifted");
  invariant(manifest.failureCode === null, "RUN_FAILURE_CODE_PRESENT", "successful run cannot carry a failure code");
  invariant(Number.isFinite(Number(manifest.elapsedMachineMs)) && Number(manifest.elapsedMachineMs) >= 0,
    "RUN_ELAPSED_INVALID", "run elapsedMachineMs must be a non-negative finite number");
  invariant(typeof manifest.reworkOfRunId === "string" || manifest.reworkOfRunId === null,
    "RUN_REWORK_BINDING_INVALID", "run reworkOfRunId must be a string or null");
  invariant(typeof manifest.stagingPath === "string" && manifest.stagingPath.length > 0 &&
    !path.isAbsolute(manifest.stagingPath) &&
    manifest.stagingPath === manifest.staging?.staging,
  "RUN_STAGING_BINDING_INVALID", "run staging path binding drifted");
  invariant(manifest.outputManifestSha256 === computeOutputManifestSha256(source),
    "RUN_OUTPUT_MANIFEST_DRIFT", "run output manifest identity drifted");
  invariant(manifest.cache?.cacheKey === cacheKey, "RUN_CACHE_KEY_DRIFT", "run cache key drifted", {expected: cacheKey, actual: manifest.cache?.cacheKey});
  invariant(stableJson(manifest.acceptanceEffects) === stableJson(ACCEPTANCE_EFFECTS_FALSE),
    "RUN_ACCEPTANCE_EFFECT_DRIFT", "run manifest contains an unexpected acceptance effect");
  const inventoryPath = path.join(output, "output-inventory.json");
  const recordedInventory = JSON.parse(await readFile(inventoryPath, "utf8"));
  const currentInventory = await directoryInventory(output, {exclude: ["output-inventory.json"]});
  invariant(stableJson(recordedInventory) === stableJson(currentInventory), "RUN_OUTPUT_DRIFT", "output inventory drifted");
  return {
    mode: "check",
    status: "PASS",
    output: portable(path.relative(PROJECT_ROOT, output)),
    runId: manifest.runId,
    profileId: profile.profileId,
    cacheKey,
    lessonCount: source.lessons.length,
    placementCount: source.placements.length,
    acceptanceEffects: manifest.acceptanceEffects,
  };
}

function normalizeOptions(options = {}) {
  const mode = options.mode;
  invariant(MODES.has(mode), "MODE_INVALID", "--mode must be calibrate, extend, or check");
  const normalized = {
    mode,
    profile: options.profile || DEFAULT_PROFILE,
    sourceRoot: options.sourceRoot ?? null,
    output: options.output || DEFAULT_OUTPUT,
    cache: options.cache || DEFAULT_CACHE,
    moduleCode: options.moduleCode ?? null,
    lesson: parseLessonNumber(options.lesson),
    batch: options.batch ?? null,
    all: Boolean(options.all),
    runId: options.runId ?? null,
    reworkOfRunId: options.reworkOfRunId ?? null,
    verifyArchiveReceipts: Boolean(options.verifyArchiveReceipts),
    maxArchiveReceiptBytes: options.maxArchiveReceiptBytes === undefined || options.maxArchiveReceiptBytes === null
      ? null
      : Number(options.maxArchiveReceiptBytes),
    dryRun: Boolean(options.dryRun),
    requireReadOnly: Boolean(options.requireReadOnly),
  };
  if (normalized.lesson !== null) invariant(Number.isSafeInteger(normalized.lesson) && normalized.lesson > 0, "LESSON_INVALID", "--lesson must be a positive integer");
  if (normalized.reworkOfRunId !== null) invariant(typeof normalized.reworkOfRunId === "string" && normalized.reworkOfRunId.trim().length > 0, "REWORK_RUN_ID_INVALID", "--rework-of-run-id must be a non-empty string");
  if (normalized.maxArchiveReceiptBytes !== null) invariant(
    Number.isSafeInteger(normalized.maxArchiveReceiptBytes) &&
      normalized.maxArchiveReceiptBytes > 0 &&
      normalized.maxArchiveReceiptBytes <= MAX_ARCHIVE_RECEIPT_BYTES,
    "ARCHIVE_RECEIPT_LIMIT_INVALID",
    `--max-archive-receipt-bytes must be between 1 and ${MAX_ARCHIVE_RECEIPT_BYTES}`,
  );
  if (mode === "check") invariant(!normalized.all, "CHECK_ALL_INVALID", "--all is not valid in check mode");
  return Object.freeze(normalized);
}

export function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") return {help: true};
    const take = (name) => {
      invariant(index + 1 < argv.length, "ARGUMENT_VALUE_MISSING", `${argument}: value is required`);
      options[name] = argv[++index];
    };
    if (argument === "--mode") take("mode");
    else if (argument === "--profile") take("profile");
    else if (argument === "--source-root") take("sourceRoot");
    else if (argument === "--output") take("output");
    else if (argument === "--cache") take("cache");
    else if (argument === "--module-code") take("moduleCode");
    else if (argument === "--lesson") take("lesson");
    else if (argument === "--batch") take("batch");
    else if (argument === "--run-id") take("runId");
    else if (argument === "--rework-of-run-id") take("reworkOfRunId");
    else if (argument === "--verify-archive-receipts") options.verifyArchiveReceipts = true;
    else if (argument === "--max-archive-receipt-bytes") take("maxArchiveReceiptBytes");
    else if (argument === "--all") options.all = true;
    else if (argument === "--dry-run" || argument === "--check-only") options.dryRun = true;
    else if (argument === "--require-read-only") options.requireReadOnly = true;
    else throw new FactoryError("ARGUMENT_UNKNOWN", `unknown argument: ${argument}`);
  }
  if (options.help) return options;
  return normalizeOptions(options);
}

function usage() {
  return `Usage:\n  node scripts/build-shared-page-factory.mjs --profile <profile.json> [--source-root <private-root>] --mode calibrate --run-id <id> [--rework-of-run-id <id>] [--verify-archive-receipts] [--max-archive-receipt-bytes <n>] --output <work-dir> [--dry-run]\n  node scripts/build-shared-page-factory.mjs --profile <profile.json> [--source-root <private-root>] --mode extend --module-code NMS002 [--lesson 1] [--run-id <id>] [--rework-of-run-id <id>] [--verify-archive-receipts] [--max-archive-receipt-bytes <n>] [--output <work-dir>]\n  node scripts/build-shared-page-factory.mjs --profile <profile.json> --mode extend --batch <batch-id> [--run-id <id>] [--rework-of-run-id <id>] [--output <work-dir>]\n  node scripts/build-shared-page-factory.mjs --profile <profile.json> --mode extend --all [--run-id <id>] [--rework-of-run-id <id>] [--output <work-dir>]\n  node scripts/build-shared-page-factory.mjs --profile <profile.json> --mode check --output <existing-work-dir> [--verify-archive-receipts] [--max-archive-receipt-bytes <n>]`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  try {
    const parsed = parseArguments(process.argv.slice(2));
    if (parsed.help) {
      console.log(usage());
      process.exit(0);
    }
    const result = await runFactory(parsed);
    console.log(stableJson(result));
  } catch (error) {
    const output = {
      ok: false,
      errorCode: error.code ?? "FACTORY_RUN_FAILED",
      message: error.message,
      details: error.details ?? {},
    };
    console.error(stableJson(output));
    process.exitCode = 1;
  }
}
