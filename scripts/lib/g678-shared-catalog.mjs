#!/usr/bin/env node

/**
 * Source-locked projection for the G6-G8 shared HELP Math courseware.
 *
 * This module intentionally stops at structural/source evidence.  It never
 * promotes a SWF, claims JavaScript registration, or signs fidelity/audio/
 * human/Owner/release acceptance.  The private source view is optional so
 * schema and parser tests can run against synthetic XML without copying any
 * external bytes into the repository.
 */

import {createHash} from "node:crypto";
import {lstat, readFile, readdir} from "node:fs/promises";
import path from "node:path";

export const PROFILE_ID = "g678-shared-source-profile-v1";
export const MAPPING_VERSION = "ccss-math-2010-v1";
export const GRADE_SCOPE = "G6-G8-shared";
export const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
export const SWF_MAGIC = Object.freeze(["FWS", "CWS", "ZWS"]);

export const MODULES = Object.freeze([
  Object.freeze({
    moduleCode: "NMS002",
    moduleTitle: "Numbers Make Sense",
    lessonNumbers: Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
    activePageCounts: Object.freeze([47, 64, 56, 45, 49, 51, 52, 60, 53, 49, 47, 65]),
  }),
  Object.freeze({
    moduleCode: "GEO001",
    moduleTitle: "Geometry",
    lessonNumbers: Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
    activePageCounts: Object.freeze([59, 51, 49, 44, 51, 54, 63, 47, 44, 42, 52, 39]),
  }),
  Object.freeze({
    moduleCode: "ALG001",
    moduleTitle: "Algebra",
    lessonNumbers: Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
    activePageCounts: Object.freeze([56, 58, 56, 53, 63, 60, 62, 50, 41, 52, 44, 52]),
  }),
  Object.freeze({
    moduleCode: "DAT001",
    moduleTitle: "Data Analysis",
    lessonNumbers: Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]),
    activePageCounts: Object.freeze([56, 53, 63, 39, 61, 46, 50, 34]),
  }),
]);

export const MODULE_BY_CODE = new Map(MODULES.map((module) => [module.moduleCode, module]));
export const SECTION_CODES = Object.freeze(["IR", "RW", "VB", "IN", "TI", "GS", "TS", "FQ"]);

export const EXPECTED_COUNTS = Object.freeze({
  canonicalLessonXmlCount: 44,
  activePagePlacementCount: 2282,
  uniqueActiveSwfSha256Count: 2240,
  commentedPageCount: 315,
  bomXmlCount: 39,
  bareAmpersandCount: 7,
  canonicalSwfCount: 2776,
  canonicalMp3Count: 13353,
  canonicalFlaCount: 0,
  samePathDifferentHashCount: 46,
  dependencyHolds: 92,
  audioCandidatePages: 2133,
  audioGroupedCandidateCount: 5562,
  geoAlternateLessonCount: 1,
  geoAlternateActivePageCount: 59,
});

export const ALL_FALSE_ACCEPTANCE_EFFECTS = Object.freeze({
  canonicalSourcePromoted: false,
  currentJavaScriptRegistered: false,
  authoritativeOriginalRuntime: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  released: false,
  published: false,
});

export class ExternalSourceRootMissingError extends Error {
  constructor(sourceRoot) {
    super(`BLOCKED_EXTERNAL_SOURCE_ROOT_MISSING: ${sourceRoot}`);
    this.name = "ExternalSourceRootMissingError";
    this.code = "BLOCKED_EXTERNAL_SOURCE_ROOT_MISSING";
    this.sourceRoot = sourceRoot;
  }
}

export class SharedCatalogValidationError extends Error {
  constructor(errors) {
    super(`G678_SHARED_CATALOG_INVALID: ${errors.join("; ")}`);
    this.name = "SharedCatalogValidationError";
    this.code = "G678_SHARED_CATALOG_INVALID";
    this.errors = errors;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function compareText(left, right) {
  return String(left).localeCompare(String(right), "en", {sensitivity: "variant"});
}

/** Stable object key ordering; arrays preserve source order by design. */
export function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort(compareText)
      .map((key) => [key, stable(value[key])]),
  );
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function portable(value) {
  return String(value).split(path.sep).join("/");
}

export function normalizeReferencePath(value) {
  const normalized = path.posix.normalize(String(value ?? "").trim().replaceAll("\\", "/").replace(/^\/+/, ""));
  assert(normalized && normalized !== "." && !normalized.startsWith("../") && normalized !== "..",
    `unsafe source reference path: ${value}`);
  return normalized;
}

export function decodeEntities(value) {
  const named = {amp: "&", apos: "'", gt: ">", lt: "<", quot: '"'};
  return String(value ?? "").replace(
    /&(#x[0-9a-f]+|#\d+|amp|apos|gt|lt|quot);/giu,
    (match, entity) => {
      if (entity[0] === "#") {
        const hexadecimal = entity[1].toLowerCase() === "x";
        const codePoint = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
        return Number.isFinite(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : match;
      }
      return named[entity.toLowerCase()] ?? match;
    },
  );
}

export function cleanText(value) {
  return decodeEntities(String(value ?? "").replace(/<[^>]+>/gu, " ")).replace(/\s+/gu, " ").trim();
}

export function parseAttributes(source) {
  const attributes = {};
  const warnings = [];
  const pattern = /([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gu;
  for (const match of String(source ?? "").matchAll(pattern)) {
    const key = match[1];
    if (Object.hasOwn(attributes, key)) warnings.push(`duplicate-attribute:${key}`);
    attributes[key] = decodeEntities(match[2] ?? match[3] ?? "");
  }
  return {attributes, warnings};
}

export function stripXmlComments(text) {
  const source = String(text ?? "");
  const starts = [...source.matchAll(/<!--/gu)].length;
  const closes = [...source.matchAll(/-->/gu)].length;
  const unterminatedCommentCount = Math.max(0, starts - closes);
  // Remove an unterminated comment through EOF as well.  Leaving its body in
  // the projection could incorrectly promote a commented Page into the
  // active denominator.
  const stripped = source.replace(/<!--[\s\S]*?(?:-->|$)/gu, "");
  return Object.freeze({
    text: stripped,
    commentCount: Math.min(starts, closes),
    unterminatedCommentCount,
  });
}

export function findBareAmpersands(text) {
  const matches = [];
  const pattern = /&(?!#(?:x[0-9a-f]+|\d+);|(?:amp|apos|gt|lt|quot);)/giu;
  for (const match of String(text ?? "").matchAll(pattern)) {
    matches.push(Object.freeze({index: match.index ?? -1, value: match[0]}));
  }
  return matches;
}

export function countCommentedPageElements(text) {
  let count = 0;
  for (const match of String(text ?? "").matchAll(/<!--[\s\S]*?(?:-->|$)/gu)) {
    count += [...match[0].matchAll(/<Page\b/giu)].length;
  }
  return count;
}

function exactTagBlock(text, tagName) {
  return String(text ?? "").match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}\\s*>`, "iu"))?.[1] ?? "";
}

function extractTagText(text, tagName) {
  const block = exactTagBlock(text, tagName);
  return block ? cleanText(block) || null : null;
}

function stripLeadingOrdinal(value) {
  return String(value ?? "").replace(/^\s*\d+\s*[.)-]\s*/u, "").trim();
}

function parseLessonIdentity(xmlPath, suppliedModuleCode = null) {
  const normalized = portable(xmlPath);
  const match = normalized.match(/(?:^|\/)(NMS002|GEO001|ALG001|DAT001)\/L(\d+)\/index\.xml$/iu);
  assert(match, `Not a G6-G8 shared lesson XML path: ${xmlPath}`);
  const moduleCode = String(suppliedModuleCode ?? match[1]).toUpperCase();
  const lessonNumber = Number(match[2]);
  assert(MODULE_BY_CODE.has(moduleCode), `unsupported shared module: ${moduleCode}`);
  assert(Number.isSafeInteger(lessonNumber) && lessonNumber > 0, `invalid lesson number: ${lessonNumber}`);
  assert(normalized.toUpperCase().includes(`/${moduleCode}/`), `module/XML path mismatch: ${xmlPath}`);
  return {moduleCode, lessonNumber};
}

function canonicalSourcePath(moduleCode, lessonNumber, reference) {
  return normalizeReferencePath(path.posix.join("HELP_COURSES", moduleCode, `L${lessonNumber}`, reference));
}

function viewSourcePath(moduleCode, lessonNumber, reference) {
  return normalizeReferencePath(path.posix.join("G6-G8-shared", moduleCode, `L${lessonNumber}`, reference));
}

function stableLessonKey(moduleCode, lessonNumber) {
  return `shared-${moduleCode.toLowerCase()}-l${String(lessonNumber).padStart(2, "0")}`;
}

function placementId(moduleCode, lessonNumber, ordinal) {
  return `${stableLessonKey(moduleCode, lessonNumber)}-p${String(ordinal).padStart(3, "0")}`;
}

function parsePageElement(sectionBody, sectionCode, sectionNumber, pageOrdinal, globalOrdinal, context) {
  const pageTag = context.pageTag;
  const attrResult = parseAttributes(pageTag.attributes);
  const referenceRaw = cleanText(pageTag.body);
  if (!referenceRaw) return null;
  let reference;
  try {
    reference = normalizeReferencePath(referenceRaw);
  } catch {
    context.warnings.push(`unsafe-page-reference:${referenceRaw}`);
    return null;
  }
  if (!/\.swf$/iu.test(reference)) {
    context.warnings.push(`non-swf-page-reference:${reference}`);
    return null;
  }
  const {moduleCode, lessonNumber} = context;
  const sourcePath = canonicalSourcePath(moduleCode, lessonNumber, reference);
  const stableId = placementId(moduleCode, lessonNumber, globalOrdinal);
  return {
    placementId: stableId,
    animationId: stableId,
    assetId: null,
    moduleCode,
    lessonNumber,
    stableLessonKey: stableLessonKey(moduleCode, lessonNumber),
    sectionCode,
    sectionNumber,
    sectionPageOrdinal: pageOrdinal,
    xmlOccurrence: globalOrdinal,
    globalOrdinal,
    reference,
    expectedPath: sourcePath,
    sourcePath,
    viewPath: viewSourcePath(moduleCode, lessonNumber, reference),
    titleRaw: attrResult.attributes.Title?.trim() || null,
    titleEnglish: null,
    titleSpanish: null,
    spanishTitleDisposition: "pending-source-subpage-title-or-english-fallback",
    pageAttributes: attrResult.attributes,
    attributeWarnings: attrResult.warnings,
    slideSpace: attrResult.attributes.SlideSpace === "Yes",
    randomAudio: attrResult.attributes.RandomAudio || null,
    bgText: attrResult.attributes.BGText || null,
    navigation: attrResult.attributes.Navigation || null,
    sourceStatus: "unresolved-until-source-audit",
    sourceRootKind: "canonical-newhelp",
    sourceSha256: null,
    sourceBytes: null,
    swfMagic: null,
    authoringEvidence: "swf-only-expected",
    flaPath: null,
    variantDecision: "pending-source-audit",
    variantStatus: "pending-source-audit",
    variants: [],
    dependencyStatus: "pending-source-audit",
    dependencyHolds: [],
    audioCueCandidates: [],
    audioStatus: "candidate-index-only",
    behaviorLane: "pending-structural-audit",
  };
}

/**
 * Parse one lesson XML while retaining source order and source diagnostics.
 * `bytes` may be a Buffer, Uint8Array, or UTF-8 string.  No XML package is
 * required because the legacy files contain a deliberately small, regular
 * subset and often include tolerated bare ampersands/extra comment syntax.
 */
export function parseSharedLessonXml({bytes, xmlPath, moduleCode = null}) {
  assert(bytes !== undefined && bytes !== null, "bytes are required");
  assert(typeof xmlPath === "string" && xmlPath.length > 0, "xmlPath is required");
  const identity = parseLessonIdentity(xmlPath, moduleCode);
  const rawBytes = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  const rawText = rawBytes.toString("utf8");
  const commentProjection = stripXmlComments(rawText);
  const activeText = commentProjection.text;
  const bareAmpersands = findBareAmpersands(activeText);
  const context = {
    ...identity,
    warnings: [],
  };
  if (rawBytes.length >= 3 && rawBytes[0] === 0xef && rawBytes[1] === 0xbb && rawBytes[2] === 0xbf) {
    // Keep the original BOM bytes/hash intact, but surface the encoding
    // condition as an auditable parser warning instead of silently normalizing
    // the source projection.
    context.warnings.push("utf8-bom:1");
  }
  if (commentProjection.unterminatedCommentCount > 0) {
    context.warnings.push(`unterminated-xml-comment:${commentProjection.unterminatedCommentCount}`);
  }
  if (bareAmpersands.length > 0) context.warnings.push(`bare-ampersands:${bareAmpersands.length}`);

  const module = MODULE_BY_CODE.get(identity.moduleCode);
  const lessonKey = stableLessonKey(identity.moduleCode, identity.lessonNumber);
  const pageRoot = extractTagText(activeText, "PageRoot");
  const expectedPageRoot = `HELP_COURSES/${identity.moduleCode}/L${identity.lessonNumber}`;
  if (pageRoot && normalizeReferencePath(pageRoot).toLowerCase() !== expectedPageRoot.toLowerCase()) {
    context.warnings.push(`page-root-mismatch:${pageRoot}`);
  }
  const keyTermsBody = exactTagBlock(activeText, "Keyterms");
  const sections = [];
  const pages = [];
  const sectionMatches = [...activeText.matchAll(/<Section\b([^>]*)>([\s\S]*?)<\/Section\s*>/giu)];
  for (const sectionMatch of sectionMatches) {
    const sectionAttrResult = parseAttributes(sectionMatch[1]);
    const sectionBody = sectionMatch[2];
    const sectionCode = (sectionAttrResult.attributes.SName ?? "UNKNOWN").toUpperCase();
    const sectionNumber = Number(sectionAttrResult.attributes.SNumber) || null;
    if (!SECTION_CODES.includes(sectionCode)) context.warnings.push(`unknown-section-code:${sectionCode}`);
    const titleBody = exactTagBlock(sectionBody, "Title");
    const sectionTitleEnglish = extractTagText(titleBody, "English");
    const sectionTitleSpanish = extractTagText(titleBody, "Spanish");
    const sectionPages = [];
    const subpages = [];
    const pagePattern = /<Page\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Page\s*>)/giu;
    for (const pageMatch of sectionBody.matchAll(pagePattern)) {
      const page = parsePageElement(sectionBody, sectionCode, sectionNumber, sectionPages.length + 1, pages.length + sectionPages.length + 1, {
        ...context,
        pageTag: {attributes: pageMatch[1], body: pageMatch[2] ?? ""},
      });
      if (page) sectionPages.push(page);
    }
    const subpagePattern = /<SubPageTitle\b([^>]*)>([\s\S]*?)<\/SubPageTitle\s*>/giu;
    for (const subpageMatch of sectionBody.matchAll(subpagePattern)) {
      const attrs = parseAttributes(subpageMatch[1]).attributes;
      let reference;
      try {
        reference = normalizeReferencePath(cleanText(subpageMatch[2]));
      } catch {
        context.warnings.push(`unsafe-subpage-reference:${cleanText(subpageMatch[2])}`);
        continue;
      }
      subpages.push({
        expectedPath: canonicalSourcePath(identity.moduleCode, identity.lessonNumber, reference),
        titleEnglish: stripLeadingOrdinal(attrs.EngSubTitleName ?? "") || null,
        titleSpanish: stripLeadingOrdinal(attrs.SpanSubTitleName ?? "") || null,
      });
    }
    const subpageStarts = subpages
      .map((subpage) => ({
        ...subpage,
        start: sectionPages.findIndex((page) => page.expectedPath.toLowerCase() === subpage.expectedPath.toLowerCase()),
      }))
      .filter(({start}) => start >= 0)
      .sort((left, right) => left.start - right.start);
    sectionPages.forEach((page, index) => {
      let knowledgePoint = null;
      for (const candidate of subpageStarts) {
        if (candidate.start > index) break;
        knowledgePoint = candidate;
      }
      page.titleEnglish = knowledgePoint?.titleEnglish ?? page.titleRaw ?? sectionTitleEnglish ?? sectionCode;
      page.titleSpanish = knowledgePoint?.titleSpanish ?? page.titleEnglish;
      page.spanishTitleDisposition = knowledgePoint?.titleSpanish
        ? "source-subpage-title"
        : "english-fallback-no-source-spanish-page-title";
      pages.push(page);
    });
    sections.push({
      sectionCode,
      sectionNumber,
      titleEnglish: sectionTitleEnglish,
      titleSpanish: sectionTitleSpanish,
      pageCount: sectionPages.length,
      attributes: sectionAttrResult.attributes,
      attributeWarnings: sectionAttrResult.warnings,
    });
  }

  const lessonNumberFromTag = Number(extractTagText(activeText, "LessonNumber"));
  if (Number.isSafeInteger(lessonNumberFromTag) && lessonNumberFromTag !== identity.lessonNumber) {
    context.warnings.push(`lesson-number-mismatch:${lessonNumberFromTag}`);
  }
  const courseName = extractTagText(activeText, "CourseName");
  const lessonName = extractTagText(activeText, "LessonName");
  const legacyTitle = extractTagText(activeText, "NewTitle1");
  if (legacyTitle && lessonName && legacyTitle !== lessonName) {
    context.warnings.push(`legacy-newtitle1-drift:${legacyTitle}`);
  }
  // NewTitle1 is an old page/player label and is known to be stale in some
  // shared lessons (for example DAT001/L1). LessonName is the source lesson
  // identity used by catalog cards; retain the legacy value only as a warning.
  const title = lessonName ?? courseName ?? legacyTitle ?? lessonKey;
  return {
    schemaVersion: 1,
    catalogKind: "g678-shared-lesson-source-projection",
    moduleCode: identity.moduleCode,
    moduleTitle: module.moduleTitle,
    moduleLesson: identity.lessonNumber,
    lessonNumber: identity.lessonNumber,
    stableLessonKey: lessonKey,
    courseKey: null,
    gradeScope: GRADE_SCOPE,
    primaryGrade: null,
    gradeTags: [],
    mappingStatus: "source-mapping-pending",
    mappingVersion: MAPPING_VERSION,
    ccssStandardCodes: [],
    sourceXml: {
      path: portable(xmlPath),
      bytes: rawBytes.length,
      sha256: sha256(rawBytes),
      hasUtf8Bom: rawBytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])),
    },
    sourceXmlPath: portable(xmlPath),
    sourceXmlSha256: sha256(rawBytes),
    courseName,
    title,
    titleEnglish: title,
    titleSpanish: null,
    lessonName,
    courseImagePath: extractTagText(activeText, "CourseIMGName"),
    pageRoot,
    keyTerms: {
      english: extractTagText(keyTermsBody, "English"),
      spanish: extractTagText(keyTermsBody, "Spanish"),
      diagramDirectory: extractTagText(keyTermsBody, "DigDir"),
    },
    sections,
    pages,
    // FQ/EA answer audio does not share page SWF basenames in the shared
    // source.  It is populated by the source audit as an unmatched,
    // acceptance-neutral inventory (never as a playable/accepted cue).
    audioGroupedCandidates: [],
    activePageCount: pages.length,
    pagePlacementCount: pages.length,
    commentedPageCount: countCommentedPageElements(rawText),
    warnings: context.warnings,
    dependencyStatus: "pending-source-audit",
    dependencyHolds: [],
    variantStatus: "canonical-newhelp-pending-audit",
    acceptanceEffects: {...ALL_FALSE_ACCEPTANCE_EFFECTS},
  };
}

function normalizeManifestPath(value) {
  try {
    return normalizeReferencePath(value).toLowerCase();
  } catch {
    return String(value ?? "").replaceAll("\\", "/").replace(/^\/+/, "").toLowerCase();
  }
}

function canonicalManifestKeys(row) {
  const keys = new Set();
  for (const candidate of [row.outputPath, row.relativePath]) {
    if (!candidate) continue;
    const normalized = normalizeManifestPath(candidate);
    keys.add(normalized);
    if (normalized.startsWith("g6-g8-shared/")) keys.add(normalized.slice("g6-g8-shared/".length));
    const match = normalized.match(/(?:^|\/)(nms002|geo001|alg001|dat001)\/(l\d+\/.*)$/iu);
    if (match) {
      keys.add(`help_courses/${match[1]}/${match[2]}`);
      keys.add(`${match[1]}/${match[2]}`);
    }
  }
  return keys;
}

export function indexClassificationRows(rows) {
  const index = new Map();
  for (const row of rows ?? []) {
    if (!row || typeof row !== "object") continue;
    if (row.gradeBucket && row.gradeBucket !== GRADE_SCOPE) continue;
    for (const key of canonicalManifestKeys(row)) {
      if (!index.has(key)) index.set(key, row);
    }
  }
  return index;
}

export function indexDependencyRows(rows) {
  const index = new Map();
  for (const row of rows ?? []) {
    if (!row || typeof row !== "object") continue;
    const sourcePath = normalizeManifestPath(row.sourcePath ?? row.lessonXmlPath ?? row.path);
    if (!sourcePath) continue;
    const keys = [sourcePath];
    const match = sourcePath.match(/(?:^|\/)(nms002|geo001|alg001|dat001)\/(l\d+\/index\.xml)$/iu);
    if (match) {
      keys.push(`help_courses/${match[1]}/${match[2]}`);
      keys.push(`g6-g8-shared/${match[1]}/${match[2]}`);
    }
    for (const key of keys) {
      const bucket = index.get(key) ?? [];
      bucket.push(row);
      index.set(key, bucket);
    }
  }
  return index;
}

function lookupClassification(index, sourcePath, viewPath) {
  if (!index) return null;
  return index.get(normalizeManifestPath(sourcePath))
    ?? index.get(normalizeManifestPath(viewPath))
    ?? index.get(normalizeManifestPath(sourcePath.replace(/^help_courses\//iu, "")))
    ?? null;
}

function lookupDependency(index, sourceXmlPath, sourceViewPath) {
  if (!index) return [];
  return index.get(normalizeManifestPath(sourceXmlPath))
    ?? index.get(normalizeManifestPath(sourceViewPath))
    ?? index.get(normalizeManifestPath(sourceXmlPath.replace(/^help_courses\//iu, "")))
    ?? [];
}

function unresolvedDependencyRows(rows) {
  const seen = new Set();
  const result = [];
  for (const row of rows) {
    const status = String(row?.status ?? "").toLowerCase();
    // The dependency manifest is a complete scan, not a missing-only list.
    // Keep unresolved/review/error rows and leave resolved references as
    // machine evidence without inflating the lesson hold count.
    if (!/(unresolved|missing|review|unknown|blocked|error)/u.test(status)) continue;
    const key = [row.reference ?? "", status, row.candidateCount ?? ""].join("\u0000");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(row);
  }
  return result;
}

function rowVariantDisposition(row) {
  if (!Array.isArray(row?.variants) || row.variants.length === 0) return "canonical";
  return "hold-source-choice-review";
}

function inferSwfMagic(bytes) {
  const magic = Buffer.from(bytes).subarray(0, 3).toString("ascii");
  return SWF_MAGIC.includes(magic) ? magic : null;
}

function pathInside(root, relative) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(root, relative);
  assert(resolved === resolvedRoot || resolved.startsWith(`${resolvedRoot}${path.sep}`), `path escapes source root: ${relative}`);
  return resolved;
}

async function walkFiles(root) {
  const files = [];
  async function visit(directory) {
    const entries = await readdir(directory, {withFileTypes: true});
    entries.sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (entry.isFile()) files.push(target);
      else if (entry.isSymbolicLink()) throw new Error(`symbolic-link-source-rejected:${target}`);
    }
  }
  await visit(root);
  return files;
}

/**
 * Measure the preserved GEO alternate source without admitting it to the
 * canonical lesson/page denominator.  The alternate tree is deliberately
 * audited from its own XML occurrence stream so a missing or expanded
 * variant cannot pass a strict source check merely because the canonical
 * tree still has the expected 595 pages.
 */
async function auditGeoAlternate(sourceRoot) {
  const alternateRoot = pathInside(
    sourceRoot,
    path.join("GEO001", "_alternate"),
  );
  let info;
  try {
    info = await lstat(alternateRoot);
  } catch (error) {
    if (error?.code === "ENOENT") return {lessonCount: 0, activePageCount: 0};
    throw error;
  }
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error(`alternate source root is not a non-symlink directory: ${alternateRoot}`);
  }
  const files = await walkFiles(alternateRoot);
  const xmlFiles = files.filter((filePath) =>
    path.basename(filePath).toLowerCase() === "index.xml" &&
    /(?:^|[/\\])L\d+[/\\]index\.xml$/iu.test(filePath),
  );
  let activePageCount = 0;
  for (const xmlPath of xmlFiles) {
    const lessonMatch = xmlPath.match(/(?:^|[/\\])L(\d+)[/\\]index\.xml$/iu);
    if (!lessonMatch) continue;
    const bytes = await readFile(xmlPath);
    const projection = parseSharedLessonXml({
      bytes,
      // The alternate path contains extra archive/user directories.  Supply
      // the canonical identity explicitly while retaining the alternate
      // bytes and occurrence order for this audit-only measurement.
      xmlPath: `G6-G8-shared/GEO001/L${lessonMatch[1]}/index.xml`,
      moduleCode: "GEO001",
    });
    activePageCount += projection.activePageCount;
  }
  return {lessonCount: xmlFiles.length, activePageCount};
}

async function ensureDirectory(root) {
  try {
    const info = await lstat(root);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`source root is not an ordinary directory: ${root}`);
  } catch (error) {
    if (error?.code === "ENOENT") throw new ExternalSourceRootMissingError(root);
    throw error;
  }
}

function moduleConfig(profile, moduleCode) {
  const configured = profile?.modules?.find((module) => module.moduleCode === moduleCode);
  return configured ?? MODULE_BY_CODE.get(moduleCode);
}

function enrichPageWithClassification(page, row, bytes, flaExists) {
  page.sourceBytes = bytes.length;
  page.sourceSha256 = sha256(bytes);
  page.assetId = `swf-${page.sourceSha256}`;
  page.swfMagic = inferSwfMagic(bytes);
  // A valid SWF byte sequence is not enough to establish source custody.  The
  // strict source audit must also bind every active placement to a row in the
  // hash-locked classification manifest, including both its SHA-256 and byte
  // count.  Keep the normal resolved status unchanged for the current source
  // view, while assigning an explicit non-resolved status to an absent or
  // drifted row so `validateSharedCatalog(..., {strictCounts: true})` cannot
  // silently accept an unbound page.
  const rowPresent = Boolean(row && typeof row === "object");
  const manifestSha256 = typeof row?.sha256 === "string"
    ? row.sha256.toLowerCase()
    : null;
  const manifestBytes = Number(row?.bytes);
  const manifestHashDrift = !rowPresent ||
    !manifestSha256 ||
    !SHA256_PATTERN.test(manifestSha256) ||
    manifestSha256 !== page.sourceSha256;
  const manifestBytesDrift = !rowPresent ||
    !Number.isSafeInteger(manifestBytes) ||
    manifestBytes !== bytes.length;
  page.sourceStatus = !rowPresent
    ? "classification-row-missing"
    : manifestHashDrift || manifestBytesDrift
      ? "classification-hash-drift"
      : page.swfMagic
        ? "resolved-canonical"
        : "resolved-unknown-swf-magic";
  if (!rowPresent) {
    page.warnings = [...(page.warnings ?? []), "classification-row-missing"];
  } else {
    if (manifestHashDrift) page.warnings = [...(page.warnings ?? []), "classification-hash-drift"];
    if (manifestBytesDrift) page.warnings = [...(page.warnings ?? []), "classification-bytes-drift"];
  }
  page.authoringEvidence = flaExists ? "paired-fla" : "swf-only";
  page.flaPath = flaExists ? page.sourcePath.replace(/\.swf$/iu, ".fla") : null;
  page.variantDecision = rowVariantDisposition(row);
  page.variantStatus = page.variantDecision === "canonical"
    ? "canonical-no-variant"
    : "canonical-retained-variant-not-admitted";
  page.variants = Array.isArray(row?.variants) ? row.variants.map((variant) => ({
    archive: variant.archive ?? null,
    sourcePath: variant.sourcePath ?? null,
    outputPath: variant.outputPath ?? null,
    bytes: Number.isSafeInteger(variant.bytes) ? variant.bytes : null,
    sha256: variant.sha256 ?? null,
    decision: "hold-source-choice-review",
  })) : [];
  return page;
}

function audioCandidateNames(page) {
  const stem = path.posix.basename(page.reference, ".swf");
  return new Set([`${stem}.mp3`.toLowerCase(), `${stem}.MP3`.toLowerCase()]);
}

function isFqEaAudio(item) {
  const normalized = String(item?.relativePath ?? "").replaceAll("\\", "/");
  return /(?:^|\/)FQ\/EA\/[^/]+\.mp3$/iu.test(normalized);
}

function groupedAudioCandidate(lesson, item, ordinal, classificationIndex) {
  const row = lookupClassification(classificationIndex, item.sourcePath, item.viewPath);
  return {
    // The ordinal is scoped to the lesson and path list, so duplicate bytes
    // remain distinct source occurrences while IDs stay deterministic.
    id: `${lesson.stableLessonKey}-fq-ea-a${String(ordinal).padStart(4, "0")}`,
    source: item.sourcePath,
    sha256: item.sha256,
    language: "undetermined",
    startSemantics: "pending-authorized-original-runtime",
    hostTrigger: "pending-authorized-original-runtime",
    stopOrCompleteSemantics: "pending-authorized-original-runtime",
    replayBehavior: "pending-authorized-original-runtime",
    binding: "FQ/EA",
    // Unknown until an authorized runtime trace and audio reviewer establish
    // whether a cue is required.  `null` is intentionally not acceptance.
    required: null,
    acceptance: "candidate-index-only",
    // Source-audit compatibility fields.  Keep the normalized source paths
    // and complete hash/byte identity alongside the generic candidate shape.
    sourcePath: item.sourcePath,
    viewPath: item.viewPath,
    bytes: item.bytes,
    sourceRootKind: row?.sourceRootKind ?? "canonical-newhelp",
    matchDisposition: "unmatched-page-basename",
  };
}

function addAudioCandidates(lesson, audioFiles, classificationIndex) {
  const byName = new Map();
  const orderedAudioFiles = [...audioFiles].sort((left, right) => compareText(left.sourcePath, right.sourcePath));
  for (const item of orderedAudioFiles) {
    const basename = path.posix.basename(item.relativePath).toLowerCase();
    const bucket = byName.get(basename) ?? [];
    bucket.push(item);
    byName.set(basename, bucket);
  }
  const matchedSourcePaths = new Set();
  for (const page of lesson.pages) {
    const candidates = [];
    for (const name of audioCandidateNames(page)) {
      for (const item of byName.get(name) ?? []) {
        const row = lookupClassification(classificationIndex, item.sourcePath, item.viewPath);
        const normalizedRelativePath = item.relativePath.replaceAll("\\", "/");
        candidates.push({
          sourcePath: item.sourcePath,
          viewPath: item.viewPath,
          bytes: item.bytes,
          sha256: item.sha256,
          language: null,
          sourceRootKind: row?.sourceRootKind ?? "canonical-newhelp",
          bindingKind: /(?:^|\/)FQ\/EA\//iu.test(normalizedRelativePath)
            ? "FQ/EA-candidate"
            : /(?:^|\/)FQ\/SA\//iu.test(normalizedRelativePath)
              ? "FQ/SA-candidate"
              : "lesson-SA-candidate",
          acceptance: "candidate-index-only",
        });
        matchedSourcePaths.add(item.sourcePath);
      }
    }
    page.audioCueCandidates = candidates.sort((left, right) => compareText(left.sourcePath, right.sourcePath));
  }
  lesson.audioGroupedCandidates = orderedAudioFiles
    .filter((item) => isFqEaAudio(item) && !matchedSourcePaths.has(item.sourcePath))
    .map((item, index) => groupedAudioCandidate(lesson, item, index + 1, classificationIndex));
}

/**
 * Build the source-backed 44-lesson projection.  `sourceRoot` points at the
 * private `G6-G8-shared` directory; no files are copied or modified.
 */
export async function buildSharedCatalog({
  sourceRoot,
  profile,
  classificationRows = [],
  dependencyRows = [],
  includeVariants = false,
} = {}) {
  assert(sourceRoot, "sourceRoot is required");
  await ensureDirectory(sourceRoot);
  const classificationIndex = indexClassificationRows(classificationRows);
  const dependencyIndex = indexDependencyRows(dependencyRows);
  const lessons = [];
  const audit = {
    // Never persist an absolute private path in the generated catalog.
    sourceRoot: "$HELP_MATH_G678_SOURCE_ROOT",
    sourceRootKind: "private-external-read-only",
    includeVariants,
    warnings: [],
    missingSources: [],
    unknownSwfMagic: [],
    classificationHashDrift: [],
    variantPlacements: 0,
    dependencyHolds: 0,
    audioCandidatePages: 0,
    audioGroupedCandidateCount: 0,
    commentedPageCount: 0,
    bomXmlCount: 0,
    bareAmpersandCount: 0,
    canonicalFileCounts: {swf: 0, mp3: 0, fla: 0, xml: 0},
    unknownCanonicalSwfMagic: [],
    // The GEO alternate source is measured but never appended to `lessons`.
    // These fields make the denominator boundary auditable and let strict
    // validation detect an accidentally removed or expanded alternate tree.
    geoAlternateLessonCount: 0,
    geoAlternateActivePageCount: 0,
  };
  const moduleDefinitions = Array.isArray(profile?.modules) && profile.modules.length > 0
    ? profile.modules
    : MODULES;
  for (const module of moduleDefinitions) {
    const config = moduleConfig(profile, module.moduleCode);
    for (const lessonNumber of module.lessonNumbers) {
      const xmlRelative = path.join(module.moduleCode, `L${lessonNumber}`, "index.xml");
      const xmlAbsolute = pathInside(sourceRoot, xmlRelative);
      let bytes;
      try {
        bytes = await readFile(xmlAbsolute);
      } catch (error) {
        if (error?.code === "ENOENT") {
          audit.missingSources.push(portable(xmlRelative));
          continue;
        }
        throw error;
      }
      const lesson = parseSharedLessonXml({
        bytes,
        xmlPath: `G6-G8-shared/${portable(xmlRelative)}`,
        moduleCode: module.moduleCode,
      });
      // Keep source-parser diagnostics visible at both lesson and aggregate
      // levels.  The aggregate list is intentionally de-duplicated below;
      // raw XML bytes and their hash remain the authority.
      audit.warnings.push(...lesson.warnings.map((warning) => `${lesson.stableLessonKey}:${warning}`));
      lesson.expectedActivePageCount = config?.activePageCounts?.[lessonNumber - 1] ?? null;
      if (lesson.expectedActivePageCount !== null && lesson.activePageCount !== lesson.expectedActivePageCount) {
        lesson.warnings.push(`active-page-count-drift:expected-${lesson.expectedActivePageCount}-actual-${lesson.activePageCount}`);
        audit.warnings.push(`${lesson.stableLessonKey}:active-page-count-drift`);
      }
      audit.commentedPageCount += lesson.commentedPageCount;
      audit.bomXmlCount += lesson.sourceXml.hasUtf8Bom ? 1 : 0;
      audit.bareAmpersandCount += lesson.warnings
        .filter((warning) => warning.startsWith("bare-ampersands:"))
        .reduce((sum, warning) => sum + Number(warning.split(":")[1] ?? 0), 0);
      audit.canonicalFileCounts.xml += 1;
      const sourceXmlCanonical = `HELP_COURSES/${module.moduleCode}/L${lessonNumber}/index.xml`;
      const sourceXmlView = `G6-G8-shared/${portable(xmlRelative)}`;
      const dependencyHolds = unresolvedDependencyRows(
        lookupDependency(dependencyIndex, sourceXmlCanonical, sourceXmlView),
      );
      lesson.dependencyHolds = dependencyHolds.map((row) => ({
        status: row.status ?? "unresolved-static-reference",
        reference: row.reference ?? null,
        sourcePath: row.sourcePath ?? sourceXmlCanonical,
        candidateCount: row.candidateCount ?? null,
      }));
      lesson.dependencyStatus = lesson.dependencyHolds.length > 0 ? "has-static-review-holds" : "no-indexed-holds";
      audit.dependencyHolds += lesson.dependencyHolds.length;

      const lessonRootAbsolute = pathInside(sourceRoot, path.join(module.moduleCode, `L${lessonNumber}`));
      const allLessonFiles = await walkFiles(lessonRootAbsolute);
      const audioFiles = [];
      for (const absolute of allLessonFiles) {
        const relativeWithin = portable(path.relative(lessonRootAbsolute, absolute));
        const sourceRelative = portable(path.join(module.moduleCode, `L${lessonNumber}`, relativeWithin));
        const extension = path.extname(relativeWithin).toLowerCase();
        if (extension === ".swf") audit.canonicalFileCounts.swf += 1;
        else if (extension === ".mp3") audit.canonicalFileCounts.mp3 += 1;
        else if (extension === ".fla") audit.canonicalFileCounts.fla += 1;
        if (extension !== ".mp3") continue;
        const fileBytes = await readFile(absolute);
        const fileSha = sha256(fileBytes);
        if (/\.mp3$/iu.test(relativeWithin)) {
          audioFiles.push({
            relativePath: relativeWithin,
            sourcePath: `HELP_COURSES/${sourceRelative}`,
            viewPath: `G6-G8-shared/${sourceRelative}`,
            bytes: fileBytes.length,
            sha256: fileSha,
          });
        }
      }
      for (const page of lesson.pages) {
        const pageRelative = page.viewPath.replace(/^g6-g8-shared\//iu, "");
        const pageAbsolute = pathInside(sourceRoot, pageRelative);
        let swfBytes;
        try {
          swfBytes = await readFile(pageAbsolute);
        } catch (error) {
          if (error?.code === "ENOENT") {
            page.sourceStatus = "missing-canonical-source";
            page.sourceStatusReason = "active XML page reference has no canonical NewHelp file";
            audit.missingSources.push(page.sourcePath);
            continue;
          }
          throw error;
        }
        const manifestRow = lookupClassification(classificationIndex, page.sourcePath, page.viewPath);
        const flaRelative = pageRelative.replace(/\.swf$/iu, ".fla");
        let flaExists = false;
        try {
          const info = await lstat(pathInside(sourceRoot, flaRelative));
          flaExists = info.isFile() && !info.isSymbolicLink();
        } catch (error) {
          if (error?.code !== "ENOENT") throw error;
        }
        enrichPageWithClassification(page, manifestRow, swfBytes, flaExists);
        if (page.sourceStatus === "classification-hash-drift") {
          audit.classificationHashDrift.push(page.sourcePath);
        }
        if (!page.swfMagic) audit.unknownSwfMagic.push(page.sourcePath);
        if (page.variants.length > 0) {
          audit.variantPlacements += 1;
          if (!includeVariants) page.variantStatus = "canonical-retained-variant-not-admitted";
        }
      }
      for (const absolute of allLessonFiles.filter((candidate) => path.extname(candidate).toLowerCase() === ".swf")) {
        const swfBytes = await readFile(absolute);
        if (!inferSwfMagic(swfBytes)) {
          const relativeWithin = portable(path.relative(lessonRootAbsolute, absolute));
          audit.unknownCanonicalSwfMagic.push(`HELP_COURSES/${module.moduleCode}/L${lessonNumber}/${relativeWithin}`);
        }
      }
      addAudioCandidates(lesson, audioFiles, classificationIndex);
      audit.audioCandidatePages += lesson.pages.filter((page) => page.audioCueCandidates.length > 0).length;
      audit.audioGroupedCandidateCount += lesson.audioGroupedCandidates.length;
      lessons.push(lesson);
    }
  }
  const geoAlternate = await auditGeoAlternate(sourceRoot);
  audit.geoAlternateLessonCount = geoAlternate.lessonCount;
  audit.geoAlternateActivePageCount = geoAlternate.activePageCount;
  audit.warnings = [...new Set(audit.warnings)].sort(compareText);
  lessons.sort((left, right) => {
    const moduleOrder = MODULES.findIndex((module) => module.moduleCode === left.moduleCode)
      - MODULES.findIndex((module) => module.moduleCode === right.moduleCode);
    return moduleOrder || left.lessonNumber - right.lessonNumber;
  });
  const catalog = {
    $schema: "../schemas/g678-shared-source-catalog-v1.schema.json",
    schemaVersion: 1,
    catalogKind: "help-math-g678-shared-source-catalog",
    profileId: profile?.profileId ?? PROFILE_ID,
    profileVersion: profile?.version ?? "G6-G8-shared-v1",
    generatedFrom: {
      sourceViewKind: "private-external-read-only",
      sourceRoot: "$HELP_MATH_G678_SOURCE_ROOT",
      canonicalArchive: "NewHelpProgram",
      sourceManifestSha256: profile?.sourceManifestSha256
        ?? profile?.witnesses?.["classification-manifest.jsonl"]
        ?? null,
      generatedAt: null,
    },
    gradeScope: GRADE_SCOPE,
    lessons,
    activePagePlacementCount: lessons.reduce((sum, lesson) => sum + lesson.activePageCount, 0),
    canonicalLessonXmlCount: lessons.length,
    uniqueActiveSwfSha256Count: new Set(lessons.flatMap((lesson) => lesson.pages.map((page) => page.sourceSha256).filter(Boolean))).size,
    acceptanceEffects: {...ALL_FALSE_ACCEPTANCE_EFFECTS},
    audit,
  };
  return catalog;
}

export function applyGradeMapping(catalog, mapping) {
  assert(catalog && Array.isArray(catalog.lessons), "catalog lessons are required");
  assert(mapping && Array.isArray(mapping.records), "mapping records are required");
  const byKey = new Map(mapping.records.map((record) => [record.stableLessonKey, record]));
  const lessons = catalog.lessons.map((lesson) => {
    const record = byKey.get(lesson.stableLessonKey);
    if (!record) return lesson;
    const primaryGrade = record.status === "approved" ? record.primaryGrade : null;
    const gradeTags = record.status === "approved" ? [...(record.gradeTags ?? [])] : [];
    return {
      ...lesson,
      courseKey: primaryGrade ? `g${primaryGrade}-${lesson.moduleCode.toLowerCase()}-l${String(lesson.lessonNumber).padStart(2, "0")}` : null,
      primaryGrade,
      gradeTags,
      mappingStatus: record.status === "approved" ? "approved" : "source-mapping-pending",
      ccssStandardCodes: record.status === "approved" ? [...(record.ccssStandardCodes ?? [])] : [],
      mappingId: record.mappingId,
    };
  });
  return {...catalog, lessons};
}

function scoreRecord(record) {
  return [6, 7, 8].map((grade) => Number(record?.scoresByGrade?.[String(grade)] ?? 0));
}

export function validateGradeMapping(mapping, profile = null) {
  const errors = [];
  if (!mapping || typeof mapping !== "object") return ["mapping must be an object"];
  if (mapping.schemaVersion !== 1) errors.push("mapping schemaVersion must be 1");
  if (mapping.artifactType !== "help-math-g678-grade-mapping") errors.push("mapping artifactType mismatch");
  if (mapping.mappingVersion !== MAPPING_VERSION) errors.push(`mappingVersion must be ${MAPPING_VERSION}`);
  if (mapping.gradeScope !== GRADE_SCOPE) errors.push(`gradeScope must be ${GRADE_SCOPE}`);
  const records = Array.isArray(mapping.records) ? mapping.records : [];
  if (records.length !== 44) errors.push(`expected 44 mapping records, found ${records.length}`);
  const seen = new Set();
  const expectedKeys = new Set(MODULES.flatMap((module) =>
    module.lessonNumbers.map((lessonNumber) =>
      stableLessonKey(module.moduleCode, lessonNumber))));
  for (const record of records) {
    if (!record || typeof record !== "object") {
      errors.push("mapping record must be an object");
      continue;
    }
    const key = record.stableLessonKey;
    if (seen.has(key)) errors.push(`duplicate mapping key: ${key}`);
    seen.add(key);
    if (!/^shared-(nms002|geo001|alg001|dat001)-l\d{2}$/u.test(String(key))) errors.push(`invalid stableLessonKey: ${key}`);
    if (!MODULE_BY_CODE.has(record.moduleCode)) errors.push(`invalid mapping moduleCode: ${record.moduleCode}`);
    const expectedModule = MODULE_BY_CODE.get(record.moduleCode);
    if (expectedModule && !expectedModule.lessonNumbers.includes(record.lessonNumber)) errors.push(`${key}: invalid lesson number`);
    if (!Array.isArray(record.gradeTags) || record.gradeTags.some((grade) => ![6, 7, 8].includes(grade))) errors.push(`${key}: invalid gradeTags`);
    if (!Array.isArray(record.ccssStandardCodes)) errors.push(`${key}: ccssStandardCodes must be an array`);
    if (!Array.isArray(record.evidence)) errors.push(`${key}: evidence must be an array`);
    if (!Array.isArray(record.reviewers)) errors.push(`${key}: reviewers must be an array`);
    if (!Object.hasOwn(record, "primaryGrade")) errors.push(`${key}: primaryGrade missing`);
    if (!["pending", "approved", "needs-adjudication", "rejected"].includes(record.status)) errors.push(`${key}: invalid status`);
    const scores = scoreRecord(record);
    if (scores.some((score) => !Number.isFinite(score) || score < 0)) errors.push(`${key}: invalid grade score`);
    if (record.status === "approved") {
      const max = Math.max(...scores);
      const sorted = [...scores].sort((a, b) => b - a);
      const minimum = profile?.gradeMapping?.minimumPrimaryScore ?? 5;
      const margin = profile?.gradeMapping?.minimumMargin ?? 2;
      if (![6, 7, 8].includes(record.primaryGrade)) errors.push(`${key}: approved record requires primaryGrade`);
      if (max < minimum || sorted[0] - sorted[1] < margin) errors.push(`${key}: approved score threshold/margin not met`);
      const primaryScore = [6, 7, 8].includes(record.primaryGrade)
        ? scores[record.primaryGrade - 6]
        : Number.NEGATIVE_INFINITY;
      if (primaryScore !== max) errors.push(`${key}: primaryGrade must have the highest score`);
      const evidenceLevels = new Set((record.evidence ?? []).map((evidence) => evidence.level));
      const required = profile?.gradeMapping?.requiredEvidenceLevels ?? ["A", "B"];
      if (!required.some((level) => evidenceLevels.has(level))) errors.push(`${key}: approved record requires A or B evidence`);
      const reviewerIdentities = new Set((record.reviewers ?? [])
        .map((reviewer) => reviewer?.identity ?? reviewer?.reviewerId ?? reviewer?.id ?? reviewer?.name)
        .filter((identity) => typeof identity === "string" && identity.trim()));
      if (reviewerIdentities.size < 2) errors.push(`${key}: approved record requires two distinct reviewer identities`);
      if (Array.isArray(record.gradeTags) && record.gradeTags.includes(record.primaryGrade)) {
        errors.push(`${key}: primary grade duplicated in gradeTags`);
      }
    } else if (record.primaryGrade !== null) {
      errors.push(`${key}: non-approved record must keep primaryGrade null`);
    }
  }
  for (const key of expectedKeys) {
    if (!seen.has(key)) errors.push(`missing mapping record: ${key}`);
  }
  return errors;
}

export function validateSharedProfile(profile) {
  const errors = [];
  if (!profile || typeof profile !== "object") return ["profile must be an object"];
  if (profile.schemaVersion !== 1) errors.push("profile schemaVersion must be 1");
  if (profile.artifactType !== "help-math-g678-shared-source-profile") errors.push("profile artifactType mismatch");
  if (profile.profileId !== PROFILE_ID) errors.push(`profileId must be ${PROFILE_ID}`);
  if (profile.version !== "G6-G8-shared-v1") errors.push("profile version mismatch");
  if (profile.sourceView?.kind !== "private-external-read-only") errors.push("sourceView must be private-external-read-only");
  if (profile.sourceView?.canonicalArchive !== "NewHelpProgram") errors.push("canonical archive must be NewHelpProgram");
  if (profile.profileId === PROFILE_ID) {
    if (profile.sourceViewPath !== "$HELP_MATH_G678_SOURCE_ROOT") errors.push("sourceViewPath must use the HELP_MATH_G678_SOURCE_ROOT token");
    if (profile.canonicalRootRule?.relativePath !== "G6-G8-shared" ||
      profile.canonicalRootRule?.archive !== "NewHelpProgram" ||
      profile.canonicalRootRule?.sourceRootKind !== "canonical") {
      errors.push("canonicalRootRule must select the NewHelpProgram G6-G8-shared root");
    }
    if (!Array.isArray(profile.alternateRootRules) || profile.alternateRootRules.length < 2) {
      errors.push("alternateRootRules must declare the GEO alternate and Stagingv4 conflict roots");
    }
    if (!Array.isArray(profile.archiveReceipts) || profile.archiveReceipts.length < 2) {
      errors.push("archiveReceipts must retain both raw ZIP/member-manifest custody receipts");
    }
    if (!Array.isArray(profile.moduleDefinitions) || profile.moduleDefinitions.length !== 4) {
      errors.push("moduleDefinitions must declare the four shared modules");
    } else {
      const legacyByCode = new Map((Array.isArray(profile.modules) ? profile.modules : [])
        .filter((module) => module && typeof module === "object")
        .map((module) => [module.moduleCode, module]));
      const definitionCodes = new Set();
      for (const definition of profile.moduleDefinitions) {
        const code = definition?.moduleCode;
        if (definitionCodes.has(code)) errors.push(`duplicate moduleDefinitions module: ${code ?? "<missing>"}`);
        definitionCodes.add(code);
        if (!MODULE_BY_CODE.has(code)) {
          errors.push(`moduleDefinitions contains unknown module: ${code ?? "<missing>"}`);
          continue;
        }
        const legacy = legacyByCode.get(code);
        if (!legacy) {
          errors.push(`moduleDefinitions module has no matching modules entry: ${code}`);
          continue;
        }
        const expectedModule = MODULE_BY_CODE.get(code);
        if (JSON.stringify(definition.lessonNumbers) !== JSON.stringify(legacy.lessonNumbers)) {
          errors.push(`${code}: moduleDefinitions lesson number set mismatch`);
        }
        if (JSON.stringify(definition.activePageCounts) !== JSON.stringify(legacy.activePageCounts)) {
          errors.push(`${code}: moduleDefinitions active page count set mismatch`);
        }
        if (JSON.stringify(definition.lessonNumbers) !== JSON.stringify(expectedModule.lessonNumbers)) {
          errors.push(`${code}: moduleDefinitions lesson number set differs from canonical profile`);
        }
        if (JSON.stringify(definition.activePageCounts) !== JSON.stringify(expectedModule.activePageCounts)) {
          errors.push(`${code}: moduleDefinitions active page count set differs from canonical profile`);
        }
        if (definition.moduleTitle !== expectedModule.moduleTitle) {
          errors.push(`${code}: moduleDefinitions module title mismatch`);
        }
        if (definition.sourceRoot !== code) {
          errors.push(`${code}: moduleDefinitions sourceRoot must be ${code}`);
        }
        if (definition.gradeScope !== GRADE_SCOPE) {
          errors.push(`${code}: moduleDefinitions gradeScope must be ${GRADE_SCOPE}`);
        }
        const expectedXmlPathPattern = `${code}/L{lesson}/index.xml`;
        if (definition.xmlPathPattern !== expectedXmlPathPattern) {
          errors.push(`${code}: moduleDefinitions xmlPathPattern must be ${expectedXmlPathPattern}`);
        }
      }
      for (const expectedModule of MODULES) {
        if (!definitionCodes.has(expectedModule.moduleCode)) {
          errors.push(`moduleDefinitions missing module: ${expectedModule.moduleCode}`);
        }
      }
    }
    if (!profile.toolchainVersions || typeof profile.toolchainVersions !== "object") {
      errors.push("toolchainVersions must be declared");
    }
  }
  for (const field of ["sourceManifestSha256", "mappingManifestSha256"]) {
    if (profile[field] !== undefined && profile[field] !== null && !SHA256_PATTERN.test(String(profile[field]))) {
      errors.push(`profile ${field} must be lowercase SHA-256 or null`);
    }
  }
  if (!Array.isArray(profile.modules) || profile.modules.length !== 4) errors.push("profile must define exactly four modules");
  const moduleCodes = new Set();
  for (const module of Array.isArray(profile.modules) ? profile.modules : []) {
    if (!module || typeof module !== "object") {
      errors.push("profile module must be an object");
      continue;
    }
    if (!MODULE_BY_CODE.has(module.moduleCode)) errors.push(`unsupported profile module: ${module.moduleCode}`);
    if (moduleCodes.has(module.moduleCode)) errors.push(`duplicate profile module: ${module.moduleCode}`);
    moduleCodes.add(module.moduleCode);
    if (!Array.isArray(module.lessonNumbers) || !Array.isArray(module.activePageCounts)) errors.push(`${module.moduleCode}: lesson arrays missing`);
    if ((module.lessonNumbers?.length ?? 0) !== (module.activePageCounts?.length ?? -1)) errors.push(`${module.moduleCode}: lesson/page-count length mismatch`);
  }
  for (const expectedModule of MODULES) {
    const actual = (Array.isArray(profile.modules) ? profile.modules : [])
      .find((module) => module && typeof module === "object" && module.moduleCode === expectedModule.moduleCode);
    if (!actual) {
      errors.push(`missing profile module: ${expectedModule.moduleCode}`);
      continue;
    }
    if (JSON.stringify(actual.lessonNumbers) !== JSON.stringify(expectedModule.lessonNumbers)) {
      errors.push(`${expectedModule.moduleCode}: lesson number set mismatch`);
    }
    if (JSON.stringify(actual.activePageCounts) !== JSON.stringify(expectedModule.activePageCounts)) {
      errors.push(`${expectedModule.moduleCode}: active page count set mismatch`);
    }
  }
  for (const [key, expected] of Object.entries(EXPECTED_COUNTS)) {
    if (profile.expected?.[key] !== expected) errors.push(`profile expected.${key} must be ${expected}`);
  }
  return errors;
}

export function validateSharedCatalog(catalog, profile = null, {strictCounts = false} = {}) {
  const errors = [];
  if (!catalog || typeof catalog !== "object") return ["catalog must be an object"];
  if (catalog.schemaVersion !== 1) errors.push("catalog schemaVersion must be 1");
  if (catalog.catalogKind !== "help-math-g678-shared-source-catalog") errors.push("catalog kind mismatch");
  const lessons = Array.isArray(catalog.lessons) ? catalog.lessons : [];
  const pageIds = new Set();
  const sourcePaths = new Set();
  const audioGroupedIds = new Set();
  const audioGroupedSources = new Set();
  let audioGroupedCandidateCount = 0;
  const expectedProfile = Array.isArray(profile?.modules)
    ? new Map(profile.modules
      .filter((module) => module && typeof module === "object")
      .map((module) => [module.moduleCode, module]))
    : null;
  for (const lesson of lessons) {
    if (!lesson || typeof lesson !== "object" || Array.isArray(lesson)) {
      errors.push("lesson must be an object");
      continue;
    }
    if (!MODULE_BY_CODE.has(lesson.moduleCode)) errors.push(`unsupported lesson module: ${lesson.moduleCode}`);
    const key = stableLessonKey(lesson.moduleCode, lesson.lessonNumber);
    if (lesson.stableLessonKey !== key) errors.push(`${key}: stableLessonKey mismatch`);
    const module = expectedProfile?.get(lesson.moduleCode);
    const expectedPages = module?.activePageCounts?.[lesson.lessonNumber - 1];
    if (strictCounts && expectedPages !== undefined && lesson.activePageCount !== expectedPages) errors.push(`${key}: expected ${expectedPages} pages, found ${lesson.activePageCount}`);
    const groupedCandidates = lesson.audioGroupedCandidates;
    if (strictCounts && !Array.isArray(groupedCandidates)) {
      errors.push(`${key}: audioGroupedCandidates must be an array`);
    }
    for (const candidate of Array.isArray(groupedCandidates) ? groupedCandidates : []) {
      audioGroupedCandidateCount += 1;
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
        errors.push(`${key}: audioGroupedCandidate must be an object`);
        continue;
      }
      if (typeof candidate.id !== "string" || candidate.id.length === 0) {
        errors.push(`${key}: audioGroupedCandidate id is missing`);
      } else if (audioGroupedIds.has(candidate.id)) {
        errors.push(`duplicate audioGroupedCandidate id: ${candidate.id}`);
      } else {
        audioGroupedIds.add(candidate.id);
      }
      if (typeof candidate.source !== "string" || candidate.source.length === 0) {
        errors.push(`${key}: audioGroupedCandidate source is missing`);
      } else if (audioGroupedSources.has(candidate.source)) {
        errors.push(`duplicate audioGroupedCandidate source: ${candidate.source}`);
      } else {
        audioGroupedSources.add(candidate.source);
      }
      if (typeof candidate.sha256 !== "string" || !SHA256_PATTERN.test(candidate.sha256)) {
        errors.push(`${key}: audioGroupedCandidate SHA-256 is invalid`);
      }
      if (candidate.binding !== "FQ/EA") errors.push(`${key}: audioGroupedCandidate binding must be FQ/EA`);
      if (candidate.language !== "undetermined") errors.push(`${key}: audioGroupedCandidate language must remain undetermined`);
      if (candidate.acceptance !== "candidate-index-only") errors.push(`${key}: audioGroupedCandidate acceptance must remain candidate-index-only`);
      if (candidate.required !== null && typeof candidate.required !== "boolean") {
        errors.push(`${key}: audioGroupedCandidate required must be null or boolean`);
      }
      if (candidate.matchDisposition !== "unmatched-page-basename") {
        errors.push(`${key}: audioGroupedCandidate matchDisposition must be unmatched-page-basename`);
      }
      for (const field of ["startSemantics", "hostTrigger", "stopOrCompleteSemantics", "replayBehavior"]) {
        if (typeof candidate[field] !== "string" || candidate[field].length === 0) {
          errors.push(`${key}: audioGroupedCandidate ${field} is missing`);
        }
      }
      if (!Number.isSafeInteger(candidate.bytes) || candidate.bytes <= 0) {
        errors.push(`${key}: audioGroupedCandidate bytes are invalid`);
      }
    }
    if (strictCounts) {
      const hasBom = lesson.sourceXml?.hasUtf8Bom === true;
      const bomWarningCount = (lesson.warnings ?? [])
        .filter((warning) => String(warning).startsWith("utf8-bom:"))
        .length;
      if (hasBom !== (bomWarningCount > 0)) {
        errors.push(`${key}: UTF-8 BOM metadata/warning mismatch`);
      }
      if (bomWarningCount > 1) {
        errors.push(`${key}: duplicate UTF-8 BOM warnings`);
      }
    }
    let previousOrdinal = 0;
    for (const page of lesson.pages ?? []) {
      if (page.xmlOccurrence !== previousOrdinal + 1) errors.push(`${key}: XML occurrence gap at ${page.xmlOccurrence}`);
      previousOrdinal = page.xmlOccurrence;
      if (page.placementId !== placementId(lesson.moduleCode, lesson.lessonNumber, page.xmlOccurrence)) errors.push(`${key}: placement ID mismatch`);
      if (page.animationId !== page.placementId) errors.push(`${key}: animation ID must equal placement ID`);
      if (page.sourcePath && sourcePaths.has(page.sourcePath)) errors.push(`duplicate source path: ${page.sourcePath}`);
      if (page.sourcePath) sourcePaths.add(page.sourcePath);
      if (page.placementId && pageIds.has(page.placementId)) errors.push(`duplicate placement ID: ${page.placementId}`);
      if (page.placementId) pageIds.add(page.placementId);
      if (page.sourceSha256 !== null && !SHA256_PATTERN.test(page.sourceSha256)) errors.push(`${page.placementId}: invalid source SHA-256`);
      if (page.assetId !== null && page.assetId !== `swf-${page.sourceSha256}`) errors.push(`${page.placementId}: assetId/source SHA mismatch`);
      if (strictCounts && page.sourceSha256 === null) errors.push(`${page.placementId}: active source SHA-256 is missing`);
      if (strictCounts && page.sourceStatus === "classification-row-missing") {
        errors.push(`${page.placementId}: classification manifest row is missing`);
      }
      if (strictCounts && page.sourceStatus !== "resolved-canonical") errors.push(`${page.placementId}: active source is not a resolved canonical SWF`);
      if (page.variants?.length > 0 && page.variantDecision !== "hold-source-choice-review") {
        errors.push(`${page.placementId}: source variant is not held for explicit choice review`);
      }
    }
  }
  if (catalog.activePagePlacementCount !== lessons.reduce((sum, lesson) => sum + (lesson.activePageCount ?? 0), 0)) errors.push("catalog active page count is not derived from lessons");
  if (strictCounts) {
    const expected = profile?.expected ?? EXPECTED_COUNTS;
    const actualAudit = catalog.audit ?? {};
    const actualFileCounts = actualAudit.canonicalFileCounts ?? {};
    const expectedAudit = {
      canonicalLessonXmlCount: lessons.length,
      activePagePlacementCount: catalog.activePagePlacementCount,
      uniqueActiveSwfSha256Count: catalog.uniqueActiveSwfSha256Count,
      commentedPageCount: actualAudit.commentedPageCount,
      bomXmlCount: actualAudit.bomXmlCount,
      bareAmpersandCount: actualAudit.bareAmpersandCount,
      canonicalSwfCount: actualFileCounts.swf,
      canonicalMp3Count: actualFileCounts.mp3,
      canonicalFlaCount: actualFileCounts.fla,
      dependencyHolds: actualAudit.dependencyHolds,
      audioCandidatePages: actualAudit.audioCandidatePages,
      audioGroupedCandidateCount: actualAudit.audioGroupedCandidateCount,
      // `variantPlacements` is the source projection's count of active
      // same-path/different-hash decisions. Keep the profile's historical
      // name as the comparison key for compatibility with the source report.
      samePathDifferentHashCount: actualAudit.variantPlacements,
      geoAlternateLessonCount: actualAudit.geoAlternateLessonCount,
      geoAlternateActivePageCount: actualAudit.geoAlternateActivePageCount,
    };
    if (actualAudit.audioGroupedCandidateCount !== audioGroupedCandidateCount) {
      errors.push(`source audit audioGroupedCandidateCount is not derived from lessons, found ${actualAudit.audioGroupedCandidateCount ?? "missing"}`);
    }
    const bomWarningCount = lessons.reduce((sum, lesson) => sum +
      (lesson.warnings ?? []).filter((warning) => String(warning).startsWith("utf8-bom:")).length, 0);
    if (actualAudit.bomXmlCount !== bomWarningCount) {
      errors.push(`source audit bomXmlCount is not derived from parser warnings, found ${actualAudit.bomXmlCount ?? "missing"}`);
    }
    for (const [key, expectedValue] of Object.entries(expected)) {
      if (!Object.hasOwn(expectedAudit, key)) continue;
      const actualValue = expectedAudit[key];
      if (actualValue !== expectedValue) {
        errors.push(`source audit ${key} expected ${expectedValue}, found ${actualValue ?? "missing"}`);
      }
    }
    if (actualAudit.missingSources?.length !== 0) {
      errors.push(`source audit missingSources must be empty, found ${actualAudit.missingSources?.length ?? "missing"}`);
    }
    if (actualAudit.unknownSwfMagic?.length !== 0) {
      errors.push(`source audit unknownSwfMagic must be empty, found ${actualAudit.unknownSwfMagic?.length ?? "missing"}`);
    }
    if (actualAudit.classificationHashDrift?.length !== 0) {
      errors.push(`source audit classification bindings drifted, found ${actualAudit.classificationHashDrift?.length ?? "missing"}`);
    }
  }
  return errors;
}

export async function readJsonl(filePath) {
  const text = await readFile(filePath, "utf8");
  const rows = [];
  for (const [index, line] of text.split(/\r?\n/u).entries()) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line));
    } catch (error) {
      throw new Error(`invalid JSONL at ${filePath}:${index + 1}: ${error.message}`);
    }
  }
  return rows;
}

export function pendingGradeMapping(profile = null) {
  const records = [];
  for (const module of profile?.modules ?? MODULES) {
    for (const lessonNumber of module.lessonNumbers) {
      const key = stableLessonKey(module.moduleCode, lessonNumber);
      records.push({
        mappingId: `g678-map-${module.moduleCode.toLowerCase()}-l${String(lessonNumber).padStart(2, "0")}`,
        stableLessonKey: key,
        moduleCode: module.moduleCode,
        lessonNumber,
        primaryGrade: null,
        gradeTags: [],
        ccssStandardCodes: [],
        evidence: [],
        scoresByGrade: {"6": 0, "7": 0, "8": 0},
        reviewers: [],
        status: "pending",
        decisionReason: "No grade-specific source evidence has been reviewed; do not infer grade from module, path, title, or filename.",
        mappingVersion: MAPPING_VERSION,
        sourceManifestSha256: null,
        courseKey: null,
      });
    }
  }
  return {
    schemaVersion: 1,
    artifactType: "help-math-g678-grade-mapping",
    mappingId: "g678-grade-mapping-v1",
    mappingVersion: MAPPING_VERSION,
    gradeScope: GRADE_SCOPE,
    sourceProfileId: profile?.profileId ?? PROFILE_ID,
    policy: {
      minimumPrimaryScore: profile?.gradeMapping?.minimumPrimaryScore ?? 5,
      minimumMargin: profile?.gradeMapping?.minimumMargin ?? 2,
      requiredEvidenceLevels: profile?.gradeMapping?.requiredEvidenceLevels ?? ["A", "B"],
      independentReviewRequired: profile?.gradeMapping?.independentReviewRequired ?? true,
      pendingDisposition: "source-mapping-pending",
    },
    status: "pending-review",
    records,
  };
}

export function profileExpectedPageCount(profile = null) {
  return (profile?.modules ?? MODULES).reduce(
    (sum, module) => sum + (module.activePageCounts ?? []).reduce((inner, count) => inner + count, 0),
    0,
  );
}

export function moduleExpectedPageCount(moduleCode, profile = null) {
  const module = moduleConfig(profile, moduleCode);
  return (module?.activePageCounts ?? []).reduce((sum, count) => sum + count, 0);
}
