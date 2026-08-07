#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  lstat,
  mkdir,
  opendir,
  readFile,
  realpath,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { inflateSync } from "node:zlib";
import { pathToFileURL } from "node:url";

const SOURCE_DIRECTORY_NAME = "HELP MATH_ORIGINAL FILES";
const DEFAULT_OUTPUT = "catalog";
const DEFAULT_CONCURRENCY = 4;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

const KNOWN_COUNTS = Object.freeze({
  files: 9_147,
  totalBytes: 3_214_585_414,
  checksumSetSha256: "30dfa12b7cd76e7200fb89115155e7d32af1356247c07e3a4f79227e93f34875",
  swf: 2_096,
  fla: 1_541,
  mp3: 5_448,
  xml: 31,
  courseXml: 29,
  swfByCollection: {
    course: 1_587,
    keyterm: 459,
    formula: 50,
  },
  uniqueSwfAssets: 2_074,
  duplicatePlacements: 22,
  pairedSwfFla: 1_344,
  swfOnly: 752,
  flaOnly: 197,
  compoundBinaryFla: 1_540,
  zipArchiveFla: 1,
  unrecognizedFla: 0,
  swfFrames: 34_169,
  courseShells: 33,
  courseReferences: {
    unique: 1_750,
    resolved: 1_361,
    missing: 389,
    unreferenced: 226,
  },
  keytermReferences: {
    unique: 760,
    resolved: 443,
    missing: 317,
    unreferenced: 16,
  },
  xmlWithBareAmpersands: 8,
});

const SECTION_LABELS = Object.freeze({
  IR: "Introduction",
  RW: "Your World",
  VB: "Important Words",
  IN: "Learn It",
  TI: "Try It",
  GS: "Play It",
  TS: "Practice Test",
  FQ: "Final Quiz",
  RE: "Review",
});

const DISPLAY_TITLE_CORRECTIONS = Object.freeze({
  "Mathemetical Expressions": "Mathematical Expressions",
  "Divisin Skills": "Division Skills",
});

const COURSE_DOMAIN_RULES = Object.freeze([
  [/(place value)/i, "number-sense-place-value"],
  [/(fraction|decimal|percent)/i, "fractions-decimals-percents"],
  [/(negative number|number line)/i, "negative-numbers-number-line"],
  [/(expression|equation|factor|exponent|prime)/i, "expressions-equations-number-theory"],
  [/(measurement|money)/i, "measurement-money"],
  [/(geometry|coordinate|perimeter|area)/i, "geometry-coordinates"],
  [/(addition|subtraction|multiplication|division skills|^division$|add, subtract, multiply)/i, "integer-operations"],
]);

export const LESSON_RELEASE_DEFINITIONS = Object.freeze([
  Object.freeze({
    releaseOrder: 1,
    queueId: "release-g04-l03-negative-numbers",
    releaseId: "lesson-g04-l03-negative-numbers",
    releaseType: "complete-lesson",
    publicationMode: "atomic",
    developmentMode: "parallel-shards",
    sequenceAuthority: "active-course-xml-global-page-order",
    grade: 4,
    lesson: 3,
    titleDisplay: "Negative Numbers",
    domain: "negative-numbers-number-line",
    sourceLessonPath: "HELP_COURSES/ELMGR4/L3/index.xml",
    sourceLessonBytes: 8_976,
    sourceLessonSha256: "0f1109321a5b65507c36fb8fd30380c4899cb7f381c2959aa7092d59bba990b0",
    shellAnimationId: "shell-course-g04-l03-index-local",
    shellSourceSha256: "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e",
    expectedActiveXmlReferencedPageAssetCount: 39,
    expectedCourseShellAssetCount: 1,
    expectedPairedSwfFlaCount: 29,
    expectedSwfOnlyCount: 11,
    catalogQueueBinding: true,
    shards: Object.freeze([
      Object.freeze({
        shardId: "shard-01",
        batchId: "batch-001",
        ordinal: 1,
        parallelGroup: "g04-l03-mvp",
        memberCount: 25,
        firstXmlOccurrence: 1,
        lastXmlOccurrence: 25,
        includeShell: false,
      }),
      Object.freeze({
        shardId: "shard-02",
        batchId: "batch-002",
        ordinal: 2,
        parallelGroup: "g04-l03-mvp",
        memberCount: 15,
        firstXmlOccurrence: 26,
        lastXmlOccurrence: 39,
        includeShell: true,
      }),
    ]),
  }),
  Object.freeze({
    releaseOrder: 2,
    queueId: "release-g05-l04-number-lines",
    releaseId: "lesson-g05-l04-number-lines",
    releaseType: "complete-lesson",
    publicationMode: "atomic",
    developmentMode: "parallel-shards",
    sequenceAuthority: "active-course-xml-global-page-order",
    grade: 5,
    lesson: 4,
    titleDisplay: "Number Lines",
    domain: "negative-numbers-number-line",
    sourceLessonPath: "HELP_COURSES/ELMGR5/L4/index.xml",
    sourceLessonBytes: 11_841,
    sourceLessonSha256: "b6f1718da8f5e909cb96c883902009887eb965d41e41588318b4bfb36c8f7a36",
    shellAnimationId: "shell-course-g05-l04-index-local",
    shellSourceSha256: "7865195a07666e8123bef33f52aea36e06b7e0a9987fbbea605bc92cbe9b0301",
    expectedActiveXmlReferencedPageAssetCount: 54,
    expectedCourseShellAssetCount: 1,
    expectedPairedSwfFlaCount: 44,
    expectedSwfOnlyCount: 11,
    catalogQueueBinding: false,
    shards: Object.freeze([
      Object.freeze({
        shardId: "g05-l04-host-language",
        batchId: "g05-l04-host-language",
        ordinal: 1,
        parallelGroup: "g05-l04-mvp",
        memberCount: 15,
        firstXmlOccurrence: 1,
        lastXmlOccurrence: 14,
        includeShell: true,
      }),
      Object.freeze({
        shardId: "g05-l04-instruction",
        batchId: "g05-l04-instruction",
        ordinal: 2,
        parallelGroup: "g05-l04-mvp",
        memberCount: 21,
        firstXmlOccurrence: 15,
        lastXmlOccurrence: 35,
        includeShell: false,
      }),
      Object.freeze({
        shardId: "g05-l04-practice-assessment",
        batchId: "g05-l04-practice-assessment",
        ordinal: 3,
        parallelGroup: "g05-l04-mvp",
        memberCount: 19,
        firstXmlOccurrence: 36,
        lastXmlOccurrence: 54,
        includeShell: false,
      }),
    ]),
  }),
  Object.freeze({
    releaseOrder: 3,
    queueId: "release-g05-l05-add-subtract-negative-numbers",
    releaseId: "lesson-g05-l05-add-subtract-negative-numbers",
    releaseType: "complete-lesson",
    publicationMode: "atomic",
    developmentMode: "parallel-shards",
    sequenceAuthority: "active-course-xml-global-page-order",
    grade: 5,
    lesson: 5,
    titleDisplay: "Add & Subtract Negative Numbers",
    domain: "negative-numbers-number-line",
    sourceLessonPath: "HELP_COURSES/ELMGR5/L5/index.xml",
    sourceLessonBytes: 11_084,
    sourceLessonSha256: "b6aef32a4be5684cccc7a4f105fe5ca92129c2292f19a71cf975f24bb133fa9e",
    shellAnimationId: "shell-course-g05-l05-index-local",
    shellSourceSha256: "5375c535f0761ae580f00eeda29c00d34d0de901239a7d2c65acf968a8290c66",
    expectedActiveXmlReferencedPageAssetCount: 56,
    expectedCourseShellAssetCount: 1,
    expectedPairedSwfFlaCount: 49,
    expectedSwfOnlyCount: 8,
    catalogQueueBinding: false,
    shards: Object.freeze([
      Object.freeze({
        shardId: "g05-l05-host-language",
        batchId: "g05-l05-host-language",
        ordinal: 1,
        parallelGroup: "g05-l05-mvp",
        memberCount: 18,
        firstXmlOccurrence: 1,
        lastXmlOccurrence: 17,
        includeShell: true,
      }),
      Object.freeze({
        shardId: "g05-l05-instruction",
        batchId: "g05-l05-instruction",
        ordinal: 2,
        parallelGroup: "g05-l05-mvp",
        memberCount: 19,
        firstXmlOccurrence: 18,
        lastXmlOccurrence: 36,
        includeShell: false,
      }),
      Object.freeze({
        shardId: "g05-l05-practice-assessment",
        batchId: "g05-l05-practice-assessment",
        ordinal: 3,
        parallelGroup: "g05-l05-mvp",
        memberCount: 20,
        firstXmlOccurrence: 37,
        lastXmlOccurrence: 56,
        includeShell: false,
      }),
    ]),
  }),
  Object.freeze({
    releaseOrder: 4,
    queueId: "release-g04-l10-perimeter-area",
    releaseId: "lesson-g04-l10-perimeter-area",
    releaseType: "complete-lesson",
    publicationMode: "atomic",
    developmentMode: "parallel-shards",
    sequenceAuthority: "active-course-xml-global-page-order",
    grade: 4,
    lesson: 10,
    titleDisplay: "Perimeter & Area",
    domain: "geometry-coordinates",
    sourceLessonPath: "HELP_COURSES/ELMGR4/L10/index.xml",
    sourceLessonBytes: 10_209,
    sourceLessonSha256: "652b236f1ad46077e75accc6fe7acb091cbd0bd24b8d99fa0b1f5ffeb1a379e9",
    shellAnimationId: "shell-course-g04-l10-index-local",
    shellSourceSha256: "050d4181f8d679e6232871371b70aeaa02dbecb4c7e16cfbc732437307cf6072",
    expectedActiveXmlReferencedPageAssetCount: 46,
    expectedCourseShellAssetCount: 1,
    expectedPairedSwfFlaCount: 34,
    expectedSwfOnlyCount: 13,
    catalogQueueBinding: false,
    shards: Object.freeze([
      Object.freeze({
        shardId: "g04-l10-host-language",
        batchId: "g04-l10-host-language",
        ordinal: 1,
        parallelGroup: "g04-l10-mvp",
        memberCount: 16,
        firstXmlOccurrence: 1,
        lastXmlOccurrence: 15,
        includeShell: true,
      }),
      Object.freeze({
        shardId: "g04-l10-instruction",
        batchId: "g04-l10-instruction",
        ordinal: 2,
        parallelGroup: "g04-l10-mvp",
        memberCount: 15,
        firstXmlOccurrence: 16,
        lastXmlOccurrence: 30,
        includeShell: false,
      }),
      Object.freeze({
        shardId: "g04-l10-practice-assessment",
        batchId: "g04-l10-practice-assessment",
        ordinal: 3,
        parallelGroup: "g04-l10-mvp",
        memberCount: 16,
        firstXmlOccurrence: 31,
        lastXmlOccurrence: 46,
        includeShell: false,
      }),
    ]),
  }),
]);

const PRIORITY_LESSON_RELEASE = LESSON_RELEASE_DEFINITIONS[0];

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function portablePath(value) {
  return value.split(path.sep).join("/");
}

function extensionOf(value) {
  return path.posix.extname(value).slice(1).toLowerCase();
}

function withoutExtension(value) {
  return value.slice(0, value.length - path.posix.extname(value).length);
}

function lowerPath(value) {
  return value.normalize("NFC").toLowerCase();
}

function slug(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "untitled";
}

function prettyStem(value) {
  return value
    .replace(/^(?:copy of )/i, "Copy of ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function displayTitle(rawTitle) {
  return DISPLAY_TITLE_CORRECTIONS[rawTitle] ?? rawTitle;
}

function decodeEntities(value) {
  const named = { amp: "&", apos: "'", gt: ">", lt: "<", quot: '"' };
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|apos|gt|lt|quot);/gi, (match, entity) => {
    if (entity[0] === "#") {
      const hexadecimal = entity[1].toLowerCase() === "x";
      const codePoint = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return named[entity.toLowerCase()] ?? match;
  });
}

function cleanText(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function stripLeadingOrdinal(value) {
  return value.replace(/^\s*\d+\s*[.)-]\s*/, "").trim();
}

function extractTagText(text, tagName) {
  const match = text.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? cleanText(match[1]) : null;
}

function parseAttributes(source) {
  const attributes = {};
  const pattern = /([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  for (const match of source.matchAll(pattern)) {
    attributes[match[1]] = decodeEntities(match[2] ?? match[3] ?? "");
  }
  return attributes;
}

function countBareAmpersands(text) {
  return [...text.matchAll(/&(?!#\d+;|#x[0-9a-f]+;|[a-z][a-z0-9._-]*;)/gi)].length;
}

function normalizeReferencePath(value) {
  return path.posix.normalize(value.trim().replaceAll("\\", "/").replace(/^\/+/, ""));
}

function classifyLessonDomain(title) {
  for (const [pattern, domain] of COURSE_DOMAIN_RULES) {
    if (pattern.test(title)) return domain;
  }
  return "unknown";
}

async function collectFiles(sourceRoot, currentDirectory = sourceRoot, files = []) {
  const directory = await opendir(currentDirectory);
  for await (const entry of directory) {
    const absolutePath = path.join(currentDirectory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`A symbolic link was found inside the preserved archive: ${absolutePath}`);
    }
    if (entry.isDirectory()) {
      await collectFiles(sourceRoot, absolutePath, files);
      continue;
    }
    if (!entry.isFile()) {
      throw new Error(`Unsupported filesystem entry in the preserved archive: ${absolutePath}`);
    }
    files.push({
      absolutePath,
      path: portablePath(path.relative(sourceRoot, absolutePath)),
    });
  }
  return files;
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, items.length)) }, run));
  return results;
}

export function classifyFlaContainer(prefix) {
  const signature = prefix.toString("hex");
  if (signature.startsWith("d0cf11e0a1b11ae1")) return "compound-binary";
  if (signature.startsWith("504b0304")) return "zip-archive";
  return "unrecognized";
}

async function hashSourceFile(file) {
  const before = await stat(file.absolutePath);
  const hash = createHash("sha256");
  let prefix = Buffer.alloc(0);
  await new Promise((resolve, reject) => {
    const stream = createReadStream(file.absolutePath);
    stream.on("data", (chunk) => {
      hash.update(chunk);
      if (prefix.length < 8) prefix = Buffer.concat([prefix, chunk.subarray(0, 8 - prefix.length)]);
    });
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  const after = await stat(file.absolutePath);
  if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) {
    throw new Error(`Source changed while being cataloged: ${file.absolutePath}`);
  }
  const sha256 = hash.digest("hex");
  if (!SHA256_PATTERN.test(sha256)) throw new Error(`Unable to hash ${file.absolutePath}`);
  const extension = extensionOf(file.path);
  return {
    path: file.path,
    bytes: before.size,
    sha256,
    extension,
    ...(extension === "fla" ? {
      flaContainer: classifyFlaContainer(prefix),
    } : {}),
  };
}

class BitReader {
  constructor(buffer) {
    this.buffer = buffer;
    this.position = 0;
  }

  unsigned(length) {
    if (length < 0 || this.position + length > this.buffer.length * 8) {
      throw new Error("SWF bit field exceeds the available header bytes");
    }
    let value = 0;
    for (let index = 0; index < length; index += 1) {
      const byte = this.buffer[Math.floor(this.position / 8)];
      value = value * 2 + ((byte >> (7 - (this.position % 8))) & 1);
      this.position += 1;
    }
    return value;
  }

  signed(length) {
    const value = this.unsigned(length);
    const sign = 2 ** (length - 1);
    return value >= sign ? value - 2 ** length : value;
  }
}

export function parseSwfHeader(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) throw new Error("SWF is shorter than its required header");
  const signature = buffer.subarray(0, 3).toString("ascii");
  if (!new Set(["FWS", "CWS", "ZWS"]).has(signature)) throw new Error(`Invalid SWF signature: ${signature}`);
  const version = buffer[3];
  const declaredFileLength = buffer.readUInt32LE(4);
  let body;
  let compression;
  if (signature === "FWS") {
    compression = "none";
    body = buffer.subarray(8);
  } else if (signature === "CWS") {
    compression = "zlib";
    body = inflateSync(buffer.subarray(8));
  } else {
    throw new Error("ZWS/LZMA header parsing requires an external LZMA decoder");
  }

  const bits = new BitReader(body);
  const coordinateBits = bits.unsigned(5);
  if (coordinateBits < 1 || coordinateBits > 31) throw new Error(`Invalid SWF RECT width: ${coordinateBits} bits`);
  const xMinTwips = bits.signed(coordinateBits);
  const xMaxTwips = bits.signed(coordinateBits);
  const yMinTwips = bits.signed(coordinateBits);
  const yMaxTwips = bits.signed(coordinateBits);
  const byteOffset = Math.ceil(bits.position / 8);
  if (byteOffset + 4 > body.length) throw new Error("SWF header ends before frame metadata");
  const fps = body.readUInt16LE(byteOffset) / 256;
  const frameCount = body.readUInt16LE(byteOffset + 2);
  if (!(fps > 0)) throw new Error(`Invalid SWF frame rate: ${fps}`);

  const normalizeNumber = (value) => Number(value.toFixed(6));
  return {
    status: "parsed",
    signature,
    version,
    compression,
    declaredFileLength,
    uncompressedLengthObserved: body.length + 8,
    stage: {
      units: "px",
      twipsPerPixel: 20,
      xMinTwips,
      xMaxTwips,
      yMinTwips,
      yMaxTwips,
      xMin: normalizeNumber(xMinTwips / 20),
      xMax: normalizeNumber(xMaxTwips / 20),
      yMin: normalizeNumber(yMinTwips / 20),
      yMax: normalizeNumber(yMaxTwips / 20),
      width: normalizeNumber((xMaxTwips - xMinTwips) / 20),
      height: normalizeNumber((yMaxTwips - yMinTwips) / 20),
    },
    fps: normalizeNumber(fps),
    frameCount,
    durationMs: normalizeNumber((frameCount / fps) * 1_000),
  };
}

async function inspectSwf(sourceRoot, sourceFile) {
  try {
    return parseSwfHeader(await readFile(path.join(sourceRoot, sourceFile.path)));
  } catch (error) {
    const signature = await readFile(path.join(sourceRoot, sourceFile.path)).then((buffer) => buffer.subarray(0, 3).toString("ascii"));
    return {
      status: "error",
      signature,
      error: error.message,
    };
  }
}

function parseCourseXml(text, xmlPath) {
  const bareAmpersandCount = countBareAmpersands(text);
  const activeText = text.replace(/<!--[\s\S]*?-->/g, "");
  const gradeMatch = xmlPath.match(/(?:^|\/)ELMGR(\d+)\/L(\d+)\/index\.xml$/i);
  if (!gradeMatch) throw new Error(`Course XML path does not identify grade and lesson: ${xmlPath}`);
  const grade = Number(gradeMatch[1]);
  const lessonFromPath = Number(gradeMatch[2]);
  const rawTitle = extractTagText(activeText, "NewTitle1") ?? extractTagText(activeText, "LessonName") ?? `Lesson ${lessonFromPath}`;
  const lesson = Number(extractTagText(activeText, "LessonNumber")) || lessonFromPath;
  const lessonRoot = `HELP_COURSES/ELMGR${grade}/L${lessonFromPath}`;
  const sections = [];
  const references = [];

  for (const sectionMatch of activeText.matchAll(/<Section\b([^>]*)>([\s\S]*?)<\/Section>/gi)) {
    const sectionAttributes = parseAttributes(sectionMatch[1]);
    const sectionBody = sectionMatch[2];
    const code = (sectionAttributes.SName ?? "unknown").toUpperCase();
    const titleBody = sectionBody.match(/<Title\b[^>]*>([\s\S]*?)<\/Title>/i)?.[1] ?? "";
    const section = {
      code,
      number: Number(sectionAttributes.SNumber) || null,
      titleEnglish: extractTagText(titleBody, "English") ?? SECTION_LABELS[code] ?? code,
      titleSpanish: extractTagText(titleBody, "Spanish"),
      pages: [],
      subpages: [],
    };

    for (const pageMatch of sectionBody.matchAll(/<Page\b([^>]*)>([\s\S]*?)<\/Page>/gi)) {
      const attributes = parseAttributes(pageMatch[1]);
      const reference = normalizeReferencePath(cleanText(pageMatch[2]));
      if (!reference || !/\.swf$/i.test(reference)) continue;
      section.pages.push({
        reference,
        expectedPath: normalizeReferencePath(path.posix.join(lessonRoot, reference)),
        titleRaw: attributes.Title?.trim() || null,
        attributes,
      });
    }

    for (const subpageMatch of sectionBody.matchAll(/<SubPageTitle\b([^>]*)>([\s\S]*?)<\/SubPageTitle>/gi)) {
      const attributes = parseAttributes(subpageMatch[1]);
      const reference = normalizeReferencePath(cleanText(subpageMatch[2]));
      section.subpages.push({
        reference,
        expectedPath: normalizeReferencePath(path.posix.join(lessonRoot, reference)),
        titleEnglish: stripLeadingOrdinal(attributes.EngSubTitleName ?? "") || null,
        titleSpanish: stripLeadingOrdinal(attributes.SpanSubTitleName ?? "") || null,
      });
    }

    const subpageStarts = section.subpages
      .map((subpage) => ({ ...subpage, start: section.pages.findIndex((page) => lowerPath(page.expectedPath) === lowerPath(subpage.expectedPath)) }))
      .filter((subpage) => subpage.start >= 0)
      .sort((left, right) => left.start - right.start);

    section.pages.forEach((page, index) => {
      let knowledgePoint = null;
      for (const candidate of subpageStarts) {
        if (candidate.start > index) break;
        knowledgePoint = candidate;
      }
      const titleEnglish = knowledgePoint?.titleEnglish ?? page.titleRaw ?? section.titleEnglish;
      const referenceRecord = {
        sourceXmlPath: xmlPath,
        occurrence: references.length + 1,
        grade,
        lesson,
        lessonTitleRaw: rawTitle,
        lessonTitleDisplay: displayTitle(rawTitle),
        lessonDomain: classifyLessonDomain(displayTitle(rawTitle)),
        section: {
          code,
          number: section.number,
          label: SECTION_LABELS[code] ?? section.titleEnglish,
          titleEnglish: section.titleEnglish,
          titleSpanish: section.titleSpanish,
        },
        page: {
          ordinal: index + 1,
          titleRaw: page.titleRaw,
          attributes: page.attributes,
        },
        knowledgePoint: {
          titleEnglish,
          titleSpanish: knowledgePoint?.titleSpanish ?? null,
        },
        reference: page.reference,
        expectedPath: page.expectedPath,
      };
      references.push(referenceRecord);
      page.referenceRecord = referenceRecord;
    });
    sections.push(section);
  }

  return {
    path: xmlPath,
    grade,
    lesson,
    courseName: extractTagText(activeText, "CourseName"),
    titleRaw: rawTitle,
    titleDisplay: displayTitle(rawTitle),
    domain: classifyLessonDomain(displayTitle(rawTitle)),
    pageRoot: extractTagText(activeText, "PageRoot"),
    bareAmpersandCount,
    tolerantParsingApplied: bareAmpersandCount > 0,
    sections,
    references,
  };
}

function decodeLegacyKeytermName(rawName) {
  const [english, spanish] = rawName.split("~LNG~");
  const decodePart = (part) => part
    ?.replaceAll("~/~", "/")
    .replaceAll("~", " ")
    .replace(/\s+/g, " ")
    .trim() || null;
  return { english: decodePart(english), spanish: decodePart(spanish) };
}

function parseKeytermXml(text, xmlPath) {
  const activeText = text.replace(/<!--[\s\S]*?-->/g, "");
  const references = [];
  const pattern = /\bExFileName\s*=\s*(?:"([^"]+)"|'([^']+)')/gi;
  for (const match of activeText.matchAll(pattern)) {
    const filename = (match[1] ?? match[2] ?? "").trim();
    if (!/\.swf$/i.test(filename)) continue;
    const tagStart = activeText.lastIndexOf("<", match.index);
    const tagEnd = activeText.indexOf(">", match.index);
    if (tagStart < 0 || tagEnd < 0) continue;
    const openTag = activeText.slice(tagStart + 1, tagEnd);
    if (openTag.startsWith("/") || openTag.startsWith("!")) continue;
    const rawName = openTag.match(/^([^\s]+)/)?.[1] ?? withoutExtension(filename);
    const attributes = parseAttributes(openTag);
    const names = decodeLegacyKeytermName(rawName);
    const beforeEquals = activeText.slice(match.index, activeText.indexOf("=", match.index));
    references.push({
      sourceXmlPath: xmlPath,
      occurrence: references.length + 1,
      filename,
      normalizedFilename: filename.toLowerCase(),
      expectedPath: `HELP_KEYTERMS/KT/ELEMENTARY/DIG/${filename}`,
      titleEnglish: attributes.ScreenkeyTerm?.trim() || names.english || prettyStem(withoutExtension(filename)),
      titleSpanish: names.spanish,
      categories: {
        english: attributes.EngCategory ?? null,
        spanish: attributes.SpanCategory ?? null,
      },
      syntax: /\s$/.test(beforeEquals) ? "whitespace-before-equals" : "canonical",
    });
  }
  return {
    path: xmlPath,
    bareAmpersandCount: countBareAmpersands(text),
    references,
  };
}

function collectionForPath(sourcePath) {
  if (sourcePath.startsWith("HELP_COURSES/")) return "course";
  if (sourcePath.startsWith("HELP_KEYTERMS/")) return "keyterm";
  if (sourcePath.startsWith("HELP_FORMULAS/")) return "formula";
  return "unknown";
}

function coursePathParts(sourcePath) {
  const match = sourcePath.match(/^HELP_COURSES\/ELMGR(\d+)\/L(\d+)(?:\/(.*))?$/i);
  if (!match) return null;
  const remainder = match[3] ?? "";
  const segments = remainder.split("/").filter(Boolean);
  const filename = segments.at(-1) ?? "";
  const directories = segments.slice(0, -1);
  const sectionCode = directories[0]?.toUpperCase() ?? null;
  const stem = withoutExtension(filename);
  const basenameMatch = stem.match(/^L\d+[A-Z]{2}(\d+)$/i);
  return {
    grade: Number(match[1]),
    lesson: Number(match[2]),
    remainder,
    segments,
    filename,
    stem,
    directories,
    sectionCode,
    pageNumber: basenameMatch ? Number(basenameMatch[1]) : null,
    nestedVariantPath: directories.length > 1 ? directories.slice(1).join("/") : null,
  };
}

function formulaStemSlug(stem) {
  return stem
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => /^\d+$/.test(part) ? part.padStart(2, "0") : slug(part))
    .join("-");
}

function baseAnimationId(sourcePath) {
  const collection = collectionForPath(sourcePath);
  const stem = withoutExtension(path.posix.basename(sourcePath));
  if (collection === "course") {
    const parts = coursePathParts(sourcePath);
    if (!parts) return /^index/i.test(stem)
      ? `shell-course-elementary-${slug(stem)}`
      : `course-${slug(withoutExtension(sourcePath))}`;
    const prefix = `g${String(parts.grade).padStart(2, "0")}-l${String(parts.lesson).padStart(2, "0")}`;
    if (/^index/i.test(parts.stem)) return `shell-course-${prefix}-${slug(parts.stem)}`;
    const section = parts.sectionCode ? slug(parts.sectionCode) : "unknown";
    const page = parts.pageNumber === null ? slug(parts.stem) : String(parts.pageNumber).padStart(3, "0");
    const variant = parts.nestedVariantPath ? `-${slug(parts.nestedVariantPath)}` : "";
    return `course-${prefix}-${section}-${page}${variant}`;
  }
  if (collection === "keyterm") {
    const corrected = sourcePath.includes("/CORRECTED FILES/") ? "-corrected-files" : "";
    return `keyterm-elementary-${slug(stem)}${corrected}`;
  }
  if (collection === "formula") return `formula-elementary-${formulaStemSlug(stem)}`;
  return `legacy-${slug(withoutExtension(sourcePath))}`;
}

function assignUniqueAnimationIds(sourceFiles) {
  const candidates = sourceFiles.map((file) => ({ file, candidate: baseAnimationId(file.path) }));
  const groups = new Map();
  for (const item of candidates) {
    if (!groups.has(item.candidate)) groups.set(item.candidate, []);
    groups.get(item.candidate).push(item);
  }
  const results = new Map();
  for (const [candidate, items] of groups) {
    items.sort((left, right) => compareText(left.file.path, right.file.path));
    if (items.length === 1) {
      results.set(items[0].file.path, candidate);
      continue;
    }
    for (const item of items) {
      const suffix = createHash("sha256").update(item.file.path).digest("hex").slice(0, 8);
      results.set(item.file.path, `${candidate}-${suffix}`);
    }
  }
  return results;
}

function variantForPath(sourcePath, referenced) {
  if (/\/index[^/]*\.swf$/i.test(sourcePath)) return { variant: false, kind: "shell" };
  if (/\/RE\//i.test(sourcePath)) return { variant: true, kind: "auxiliary-review" };
  if (/\/Review\//i.test(sourcePath)) return { variant: true, kind: "review" };
  if (/\/Missing_AudioBtn_/i.test(sourcePath)) return { variant: true, kind: "missing-audio-button-revision" };
  if (/\/CORRECTED FILES\//i.test(sourcePath)) return { variant: true, kind: "corrected" };
  if (/\/Copy of [^/]+\.swf$/i.test(sourcePath)) return { variant: true, kind: "copy" };
  if (!referenced && collectionForPath(sourcePath) === "course") return { variant: true, kind: "unreferenced-legacy" };
  return { variant: false, kind: null };
}

function languageForAudioPath(sourcePath) {
  if (/\/(?:EAD|EA)\//i.test(sourcePath)) return "en";
  if (/\/(?:SAD)\//i.test(sourcePath)) return "es";
  if (/\/FQ\/SA\//i.test(sourcePath)) return "es";
  return "und";
}

function buildAudioIndexes(audioFiles) {
  const exact = new Map();
  const groups = new Map();
  for (const file of audioFiles) {
    const collection = collectionForPath(file.path);
    const stem = lowerPath(withoutExtension(path.posix.basename(file.path)));
    let scope;
    if (collection === "course") {
      const match = file.path.match(/^(HELP_COURSES\/ELMGR\d+\/L\d+)\//i);
      scope = match?.[1].toLowerCase() ?? "course-unknown";
      const quizMatch = file.path.match(/^HELP_COURSES\/ELMGR(\d+)\/L(\d+)\/FQ\/(EA|SA)\//i);
      if (quizMatch) {
        const groupId = `course-g${quizMatch[1].padStart(2, "0")}-l${quizMatch[2].padStart(2, "0")}-fq-audio`;
        if (!groups.has(groupId)) groups.set(groupId, []);
        groups.get(groupId).push(file);
      }
    } else {
      scope = collection;
    }
    const key = `${scope}|${stem}`;
    if (!exact.has(key)) exact.set(key, []);
    exact.get(key).push(file);
  }
  for (const files of exact.values()) files.sort((left, right) => compareText(left.path, right.path));
  for (const files of groups.values()) files.sort((left, right) => compareText(left.path, right.path));
  return { exact, groups };
}

function audioForAnimation(sourcePath, audioIndexes) {
  const collection = collectionForPath(sourcePath);
  const stem = lowerPath(withoutExtension(path.posix.basename(sourcePath)));
  let scope = collection;
  if (collection === "course") {
    scope = sourcePath.match(/^(HELP_COURSES\/ELMGR\d+\/L\d+)\//i)?.[1].toLowerCase() ?? "course-unknown";
  }
  const files = audioIndexes.exact.get(`${scope}|${stem}`) ?? [];
  const exact = files.map((file) => ({
    path: file.path,
    bytes: file.bytes,
    sha256: file.sha256,
    language: languageForAudioPath(file.path),
    association: "matching-basename",
  }));
  const groupIds = [];
  const course = coursePathParts(sourcePath);
  if (course?.sectionCode === "FQ") {
    const groupId = `course-g${String(course.grade).padStart(2, "0")}-l${String(course.lesson).padStart(2, "0")}-fq-audio`;
    if (audioIndexes.groups.has(groupId)) groupIds.push(groupId);
  }
  return { exact, groupIds };
}

function classificationForAnimation(sourcePath, courseReference, keytermReference, lessonCatalog) {
  const collection = collectionForPath(sourcePath);
  if (collection === "course") {
    const parts = coursePathParts(sourcePath);
    const lesson = parts ? lessonCatalog.get(`${parts.grade}:${parts.lesson}`) : null;
    const sectionCode = courseReference?.section.code ?? parts?.sectionCode ?? null;
    const sourceStem = parts?.stem ?? withoutExtension(path.posix.basename(sourcePath));
    const shell = /^index/i.test(sourceStem);
    const pageTitle = courseReference?.page.titleRaw ?? (shell ? lesson?.titleRaw ?? prettyStem(sourceStem) : prettyStem(sourceStem));
    const lessonDomain = courseReference?.lessonDomain ?? lesson?.domain ?? "unknown";
    let domain = lessonDomain;
    if (shell) domain = "platform-shell";
    else if (sectionCode === "VB") domain = "vocabulary";
    else if (new Set(["TS", "FQ"]).has(sectionCode)) domain = "assessment";
    const status = courseReference ? "confirmed" : lesson || shell ? "inferred" : "unresolved";
    const evidence = [];
    if (lesson) evidence.push({ source: "course-xml", path: lesson.path, field: "NewTitle1", value: lesson.titleRaw });
    evidence.push({ source: "source-path", path: sourcePath });
    return {
      collection,
      grade: parts?.grade ?? null,
      lesson: parts?.lesson ?? null,
      lessonTitleRaw: courseReference?.lessonTitleRaw ?? lesson?.titleRaw ?? null,
      lessonTitleDisplay: courseReference?.lessonTitleDisplay ?? lesson?.titleDisplay ?? null,
      lessonDomain,
      section: sectionCode ? {
        code: sectionCode,
        label: courseReference?.section.label ?? SECTION_LABELS[sectionCode] ?? sectionCode,
        titleEnglish: courseReference?.section.titleEnglish ?? SECTION_LABELS[sectionCode] ?? sectionCode,
        titleSpanish: courseReference?.section.titleSpanish ?? null,
      } : null,
      page: {
        number: parts?.pageNumber ?? null,
        ordinal: courseReference?.page.ordinal ?? null,
      },
      titleRaw: pageTitle ?? null,
      titleDisplay: pageTitle ? displayTitle(pageTitle) : null,
      titleEnglish: courseReference?.knowledgePoint.titleEnglish ?? pageTitle ?? null,
      titleSpanish: courseReference?.knowledgePoint.titleSpanish ?? null,
      domain,
      evidence,
      status,
    };
  }
  if (collection === "keyterm") {
    const fallback = prettyStem(withoutExtension(path.posix.basename(sourcePath)));
    return {
      collection,
      grade: "elementary",
      lesson: null,
      lessonTitleRaw: null,
      lessonTitleDisplay: null,
      lessonDomain: "vocabulary",
      section: null,
      page: { number: null, ordinal: null },
      titleRaw: keytermReference?.titleEnglish ?? fallback,
      titleDisplay: keytermReference?.titleEnglish ?? fallback,
      titleEnglish: keytermReference?.titleEnglish ?? fallback,
      titleSpanish: keytermReference?.titleSpanish ?? null,
      domain: "vocabulary",
      evidence: keytermReference
        ? [{ source: "keyterm-xml", path: keytermReference.sourceXmlPath, field: "ExFileName", value: keytermReference.filename }]
        : [{ source: "source-path", path: sourcePath }],
      status: keytermReference ? "confirmed" : "inferred",
    };
  }
  const fallback = prettyStem(withoutExtension(path.posix.basename(sourcePath)));
  return {
    collection,
    grade: collection === "formula" ? "elementary" : null,
    lesson: null,
    lessonTitleRaw: null,
    lessonTitleDisplay: null,
    lessonDomain: collection === "formula" ? "formula-reference" : "unknown",
    section: null,
    page: { number: null, ordinal: null },
    titleRaw: fallback,
    titleDisplay: fallback,
    titleEnglish: fallback,
    titleSpanish: null,
    domain: collection === "formula" ? "formula-reference" : "unknown",
    evidence: [{ source: "source-path", path: sourcePath }],
    status: collection === "formula" ? "inferred" : "unresolved",
  };
}

function chooseCanonical(group) {
  return [...group].sort((left, right) => {
    const score = (animation) =>
      (animation.flags.referenced ? 0 : 100) +
      (animation.flags.variant ? 20 : 0) +
      (animation.flags.shell ? 10 : 0);
    return score(left) - score(right) || compareText(left.animationId, right.animationId);
  })[0];
}

function csvCell(value) {
  const text = value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function renderAnimationCsv(animations) {
  const columns = [
    "animationId", "assetId", "canonicalAnimationId", "isCanonical", "sourcePath", "sourceSha256",
    "collection", "grade", "lesson", "lessonTitleRaw", "lessonTitleDisplay", "section", "pageNumber",
    "titleEnglish", "titleSpanish", "domain", "classificationStatus", "referenced", "unreferenced",
    "variant", "variantKind", "shell", "pairedFlaPath", "swfSignature", "swfVersion", "stageWidth",
    "stageHeight", "fps", "frameCount", "durationMs", "audioExactCount", "audioGroupIds", "migrationStatus",
  ];
  const rows = [columns.join(",")];
  for (const animation of animations) {
    const values = {
      animationId: animation.animationId,
      assetId: animation.assetId,
      canonicalAnimationId: animation.canonicalAnimationId,
      isCanonical: animation.isCanonical,
      sourcePath: animation.source.path,
      sourceSha256: animation.source.sha256,
      collection: animation.classification.collection,
      grade: animation.classification.grade,
      lesson: animation.classification.lesson,
      lessonTitleRaw: animation.classification.lessonTitleRaw,
      lessonTitleDisplay: animation.classification.lessonTitleDisplay,
      section: animation.classification.section?.code,
      pageNumber: animation.classification.page.number,
      titleEnglish: animation.classification.titleEnglish,
      titleSpanish: animation.classification.titleSpanish,
      domain: animation.classification.domain,
      classificationStatus: animation.classification.status,
      referenced: animation.flags.referenced,
      unreferenced: animation.flags.unreferenced,
      variant: animation.flags.variant,
      variantKind: animation.flags.variantKind,
      shell: animation.flags.shell,
      pairedFlaPath: animation.pairedFla?.path,
      swfSignature: animation.source.swf.signature,
      swfVersion: animation.source.swf.version,
      stageWidth: animation.source.swf.stage?.width,
      stageHeight: animation.source.swf.stage?.height,
      fps: animation.source.swf.fps,
      frameCount: animation.source.swf.frameCount,
      durationMs: animation.source.swf.durationMs,
      audioExactCount: animation.audio.exact.length,
      audioGroupIds: animation.audio.groupIds,
      migrationStatus: animation.migration.status,
    };
    rows.push(columns.map((column) => csvCell(values[column])).join(","));
  }
  return `${rows.join("\n")}\n`;
}

function renderSourceCsv(files) {
  const rows = ["path,extension,bytes,sha256"];
  for (const file of files) rows.push([file.path, file.extension, file.bytes, file.sha256].map(csvCell).join(","));
  return `${rows.join("\n")}\n`;
}

function renderSha256(files) {
  for (const file of files) {
    if (/[\r\n]/.test(file.path)) throw new Error(`Cannot write a checksum entry for a filename containing a newline: ${file.path}`);
  }
  return `${files.map((file) => `${file.sha256}  ${file.path}`).join("\n")}\n`;
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function jsonl(values) {
  return `${values.map((value) => JSON.stringify(value)).join("\n")}\n`;
}

function isPriorityLessonReleaseAsset(asset) {
  const classification = asset.classification;
  if (
    classification.collection !== "course" ||
    classification.grade !== PRIORITY_LESSON_RELEASE.grade ||
    classification.lesson !== PRIORITY_LESSON_RELEASE.lesson
  ) {
    return false;
  }
  if (asset.canonicalAnimationId === PRIORITY_LESSON_RELEASE.shellAnimationId) {
    return asset.flags.shell === true;
  }
  return asset.flags.referenced === true && asset.flags.variant === false && asset.flags.shell === false;
}

export function buildBatchQueues(assets, { verifyKnownCounts = false } = {}) {
  const sectionOrder = new Map(["IR", "RW", "VB", "IN", "TI", "GS", "TS", "FQ", "RE"].map((code, index) => [code, index]));
  const compareForMigration = (left, right) => {
    const leftGrade = typeof left.classification.grade === "number" ? left.classification.grade : 99;
    const rightGrade = typeof right.classification.grade === "number" ? right.classification.grade : 99;
    return leftGrade - rightGrade ||
      (left.classification.lesson ?? 99) - (right.classification.lesson ?? 99) ||
      (sectionOrder.get(left.classification.section?.code) ?? 99) - (sectionOrder.get(right.classification.section?.code) ?? 99) ||
      (left.classification.page.number ?? 9_999) - (right.classification.page.number ?? 9_999) ||
      compareText(left.canonicalAnimationId, right.canonicalAnimationId);
  };
  const assigned = new Set();
  const definitions = [
    {
      queueId: PRIORITY_LESSON_RELEASE.queueId,
      queueType: "complete-lesson-release",
      release: PRIORITY_LESSON_RELEASE,
      predicate: isPriorityLessonReleaseAsset,
    },
    {
      queueId: "grade-3-active",
      predicate: (asset) => asset.classification.collection === "course" && asset.classification.grade === 3 && asset.flags.referenced && !asset.flags.variant && !asset.flags.shell,
    },
    {
      queueId: "grade-4-active",
      predicate: (asset) => asset.classification.collection === "course" && asset.classification.grade === 4 && asset.flags.referenced && !asset.flags.variant && !asset.flags.shell,
    },
    {
      queueId: "grade-5-active",
      predicate: (asset) => asset.classification.collection === "course" && asset.classification.grade === 5 && asset.flags.referenced && !asset.flags.variant && !asset.flags.shell,
    },
    {
      queueId: "shared-keyterms",
      predicate: (asset) => asset.classification.collection === "keyterm" && asset.flags.referenced,
    },
    {
      queueId: "shared-formulas",
      predicate: (asset) => asset.classification.collection === "formula",
    },
    { queueId: "legacy-exceptions", predicate: () => true },
  ];
  const queues = [];
  let sequence = 1;
  for (const { queueId, queueType, release, predicate } of definitions) {
    const selected = assets.filter((asset) => !assigned.has(asset.assetId) && predicate(asset)).sort(compareForMigration);
    for (const asset of selected) assigned.add(asset.assetId);
    const releasePartCount = release ? Math.ceil(selected.length / 25) : null;
    const activeXmlReferencedPageAssetCount = release
      ? selected.filter((asset) => !asset.flags.shell).length
      : null;
    const courseShellAssetCount = release
      ? selected.filter((asset) => asset.flags.shell).length
      : null;
    if (
      release &&
      verifyKnownCounts &&
      (
        activeXmlReferencedPageAssetCount !== release.expectedActiveXmlReferencedPageAssetCount ||
        courseShellAssetCount !== release.expectedCourseShellAssetCount
      )
    ) {
      throw new Error(
        `${release.releaseId}: expected ${release.expectedActiveXmlReferencedPageAssetCount} active XML-referenced page assets ` +
        `and ${release.expectedCourseShellAssetCount} course shell asset, got ` +
        `${activeXmlReferencedPageAssetCount} and ${courseShellAssetCount}`,
      );
    }
    const batches = [];
    for (let offset = 0; offset < selected.length; offset += 25) {
      const releasePart = release ? Math.floor(offset / 25) + 1 : null;
      const items = selected.slice(offset, offset + 25).map((asset) => ({
        assetId: asset.assetId,
        canonicalAnimationId: asset.canonicalAnimationId,
        placementCount: asset.animationIds.length,
        ...(release ? {
          releaseRole: asset.flags.shell ? "course-shell" : "active-xml-referenced-page",
        } : {}),
      }));
      batches.push({
        batchId: `batch-${String(sequence).padStart(3, "0")}`,
        queueId,
        canonicalAssetCount: items.length,
        ...(release ? {
          releaseId: release.releaseId,
          releasePart,
          releasePartCount,
          releaseComplete: releasePart === releasePartCount,
        } : {}),
        items,
      });
      sequence += 1;
    }
    queues.push({
      queueId,
      ...(queueType ? { queueType } : {}),
      canonicalAssetCount: selected.length,
      ...(release ? {
        releaseId: release.releaseId,
        releaseType: release.releaseType,
        grade: release.grade,
        lesson: release.lesson,
        titleDisplay: release.titleDisplay,
        domain: release.domain,
        activeXmlReferencedPageAssetCount,
        courseShellAssetCount,
        releasePartCount,
      } : {}),
      batches,
    });
  }
  const orderedBatches = queues.flatMap((queue) => queue.batches);
  for (const [index, batch] of orderedBatches.entries()) {
    if (batch.releaseId === PRIORITY_LESSON_RELEASE.releaseId) {
      batch.scaffoldingPrerequisite = {kind: "none"};
      continue;
    }
    const previousBatch = orderedBatches[index - 1];
    if (!previousBatch) {
      batch.scaffoldingPrerequisite = {kind: "none"};
    } else if (previousBatch.releaseId && previousBatch.releaseId !== batch.releaseId) {
      batch.scaffoldingPrerequisite = {
        kind: "release-strict",
        releaseId: previousBatch.releaseId,
      };
    } else {
      batch.scaffoldingPrerequisite = {
        kind: "batch-strict",
        batchId: previousBatch.batchId,
      };
    }
  }
  return {
    schemaVersion: 1,
    maxCanonicalAssetsPerBatch: 25,
    canonicalAssetCount: assets.length,
    batchCount: sequence - 1,
    queues,
  };
}

export function buildLessonReleases({animations, batches, lessons}) {
  if (!Array.isArray(animations)) throw new Error("Lesson releases require an animations array");
  if (!Array.isArray(batches?.queues)) throw new Error("Lesson releases require a batch queues array");
  if (!Array.isArray(lessons?.lessons)) throw new Error("Lesson releases require a lessons array");
  const canonicalById = new Map(animations
    .filter((animation) => animation.isCanonical)
    .map((animation) => [animation.animationId, animation]));

  const releases = [];
  for (const definition of LESSON_RELEASE_DEFINITIONS) {
    const lesson = lessons.lessons.find((candidate) =>
      candidate.grade === definition.grade && candidate.lesson === definition.lesson);
    if (!lesson) continue;
    if (
      lesson.path !== definition.sourceLessonPath ||
      lesson.bytes !== definition.sourceLessonBytes ||
      lesson.sha256 !== definition.sourceLessonSha256 ||
      lesson.titleDisplay !== definition.titleDisplay ||
      lesson.domain !== definition.domain
    ) {
      throw new Error(`${definition.releaseId}: source lesson identity drifted`);
    }

    const orderedPages = animations
      .filter((animation) =>
        animation.isCanonical === true &&
        animation.classification?.collection === "course" &&
        animation.classification.grade === definition.grade &&
        animation.classification.lesson === definition.lesson &&
        animation.flags?.referenced === true &&
        animation.flags?.variant === false &&
        animation.flags?.shell === false)
      .map((animation) => {
        const references = (animation.references?.courseXml || []).filter((reference) =>
          reference.sourceXmlPath === lesson.path);
        if (references.length !== 1 || !Number.isSafeInteger(references[0].occurrence)) {
          throw new Error(`${animation.animationId}: expected one ${definition.releaseId} XML occurrence`);
        }
        return {animation, xmlOccurrence: references[0].occurrence};
      })
      .sort((left, right) => left.xmlOccurrence - right.xmlOccurrence);
    if (orderedPages.length !== definition.expectedActiveXmlReferencedPageAssetCount) {
      throw new Error(
        `${definition.releaseId}: expected ${definition.expectedActiveXmlReferencedPageAssetCount} active XML pages, ` +
        `got ${orderedPages.length}`,
      );
    }
    for (const [index, binding] of orderedPages.entries()) {
      if (binding.xmlOccurrence !== index + 1) {
        throw new Error(
          `${definition.releaseId}: active XML occurrences must be exactly 1 through ` +
          `${definition.expectedActiveXmlReferencedPageAssetCount}`,
        );
      }
    }

    const shellAnimation = canonicalById.get(definition.shellAnimationId);
    if (
      !shellAnimation ||
      shellAnimation.classification?.collection !== "course" ||
      shellAnimation.classification.grade !== definition.grade ||
      shellAnimation.classification.lesson !== definition.lesson ||
      shellAnimation.flags?.shell !== true ||
      shellAnimation.source?.sha256 !== definition.shellSourceSha256 ||
      shellAnimation.assetId !== `swf-${definition.shellSourceSha256}`
    ) {
      throw new Error(`${definition.releaseId}: course shell binding drifted`);
    }

    const sourceBindings = [
      ...orderedPages.map(({animation, xmlOccurrence}) => ({
        animation,
        xmlOccurrence,
        releaseRole: "active-xml-referenced-page",
      })),
      {animation: shellAnimation, xmlOccurrence: null, releaseRole: "course-shell"},
    ];
    const animationIds = sourceBindings.map(({animation}) => animation.animationId);
    const assetIds = sourceBindings.map(({animation}) => animation.assetId);
    if (new Set(animationIds).size !== sourceBindings.length || new Set(assetIds).size !== sourceBindings.length) {
      throw new Error(`${definition.releaseId}: release members are not unique canonical source assets`);
    }
    const pairedSwfFlaCount = sourceBindings.filter(({animation}) => animation.pairedFla).length;
    const swfOnlyCount = sourceBindings.length - pairedSwfFlaCount;
    if (
      pairedSwfFlaCount !== definition.expectedPairedSwfFlaCount ||
      swfOnlyCount !== definition.expectedSwfOnlyCount
    ) {
      throw new Error(
        `${definition.releaseId}: expected ${definition.expectedPairedSwfFlaCount} paired FLA/SWF and ` +
        `${definition.expectedSwfOnlyCount} SWF-only members, got ${pairedSwfFlaCount} and ${swfOnlyCount}`,
      );
    }

    const members = sourceBindings.map((binding, index) => {
      const matchingShards = definition.shards.filter((shard) => binding.releaseRole === "course-shell"
        ? shard.includeShell
        : binding.xmlOccurrence >= shard.firstXmlOccurrence && binding.xmlOccurrence <= shard.lastXmlOccurrence);
      if (matchingShards.length !== 1) {
        throw new Error(`${definition.releaseId}: ${binding.animation.animationId} must map to exactly one development shard`);
      }
      const shard = matchingShards[0];
      return {
        ordinal: index + 1,
        animationId: binding.animation.animationId,
        assetId: binding.animation.assetId,
        releaseRole: binding.releaseRole,
        batchId: shard.batchId,
        shardId: shard.shardId,
        source: {
          path: binding.animation.source.path,
          sha256: binding.animation.source.sha256,
        },
        xmlOccurrence: binding.xmlOccurrence,
      };
    });
    for (const shard of definition.shards) {
      const observed = members.filter(({shardId}) => shardId === shard.shardId).length;
      if (observed !== shard.memberCount) {
        throw new Error(`${definition.releaseId}: ${shard.shardId} expected ${shard.memberCount} members, got ${observed}`);
      }
    }

    if (definition.catalogQueueBinding) {
      const queue = batches.queues.find((candidate) => candidate.queueId === definition.queueId);
      if (
        !queue ||
        queue.releaseId !== definition.releaseId ||
        queue.releaseType !== definition.releaseType ||
        queue.activeXmlReferencedPageAssetCount !== definition.expectedActiveXmlReferencedPageAssetCount ||
        queue.courseShellAssetCount !== definition.expectedCourseShellAssetCount ||
        queue.canonicalAssetCount !== members.length ||
        queue.batches.length !== definition.shards.length
      ) {
        throw new Error(`${definition.releaseId}: catalog batch queue scope drifted`);
      }
      const queueMembers = queue.batches.flatMap((batch, shardIndex) => {
        const shard = definition.shards[shardIndex];
        if (batch.batchId !== shard.batchId || batch.canonicalAssetCount !== shard.memberCount) {
          throw new Error(`${definition.releaseId}: catalog batch queue shard drifted`);
        }
        return batch.items;
      });
      if (queueMembers.some((item, index) =>
        item.canonicalAnimationId !== members[index].animationId ||
        item.assetId !== members[index].assetId ||
        item.releaseRole !== members[index].releaseRole)) {
        throw new Error(`${definition.releaseId}: catalog batch order differs from active XML order plus the shell`);
      }
    }

    releases.push({
      releaseOrder: definition.releaseOrder,
      releaseId: definition.releaseId,
      releaseType: definition.releaseType,
      publicationMode: definition.publicationMode,
      developmentMode: definition.developmentMode,
      queueId: definition.queueId,
      grade: definition.grade,
      lesson: definition.lesson,
      titleDisplay: definition.titleDisplay,
      domain: definition.domain,
      sourceLesson: {
        path: lesson.path,
        bytes: lesson.bytes,
        sha256: lesson.sha256,
        sequenceAuthority: definition.sequenceAuthority,
      },
      expectedCounts: {
        activeXmlReferencedPages: definition.expectedActiveXmlReferencedPageAssetCount,
        courseShells: definition.expectedCourseShellAssetCount,
        members: members.length,
        shards: definition.shards.length,
      },
      scope: {
        collection: "course",
        grade: definition.grade,
        lesson: definition.lesson,
        excludeNonMembers: true,
      },
      shards: definition.shards.map((shard) => ({
        shardId: shard.shardId,
        batchId: shard.batchId,
        ordinal: shard.ordinal,
        parallelGroup: shard.parallelGroup,
        memberCount: shard.memberCount,
        developmentPrerequisites: [],
      })),
      members,
    });
  }

  return {schemaVersion: 1, releases};
}

function assertKnownCounts(summary) {
  const checks = [
    ["files", summary.source.fileCount, KNOWN_COUNTS.files],
    ["source bytes", summary.source.totalBytes, KNOWN_COUNTS.totalBytes],
    ["source checksum set", summary.source.checksumSetSha256, KNOWN_COUNTS.checksumSetSha256],
    ["SWFs", summary.source.extensions.swf, KNOWN_COUNTS.swf],
    ["FLAs", summary.source.extensions.fla, KNOWN_COUNTS.fla],
    ["MP3s", summary.source.extensions.mp3, KNOWN_COUNTS.mp3],
    ["XML files", summary.source.extensions.xml, KNOWN_COUNTS.xml],
    ["course XML files", summary.xml.courseFiles, KNOWN_COUNTS.courseXml],
    ["course SWFs", summary.swf.byCollection.course, KNOWN_COUNTS.swfByCollection.course],
    ["keyterm SWFs", summary.swf.byCollection.keyterm, KNOWN_COUNTS.swfByCollection.keyterm],
    ["formula SWFs", summary.swf.byCollection.formula, KNOWN_COUNTS.swfByCollection.formula],
    ["unique SWF assets", summary.swf.uniqueAssets, KNOWN_COUNTS.uniqueSwfAssets],
    ["duplicate SWF placements", summary.swf.duplicatePlacements, KNOWN_COUNTS.duplicatePlacements],
    ["paired SWF/FLA", summary.pairing.pairedSwfFla, KNOWN_COUNTS.pairedSwfFla],
    ["SWF-only", summary.pairing.swfOnly, KNOWN_COUNTS.swfOnly],
    ["FLA-only", summary.pairing.flaOnly, KNOWN_COUNTS.flaOnly],
    ["compound-binary FLAs", summary.fla.compoundBinary, KNOWN_COUNTS.compoundBinaryFla],
    ["ZIP-archive FLAs", summary.fla.zipArchive, KNOWN_COUNTS.zipArchiveFla],
    ["unrecognized FLAs", summary.fla.unrecognized, KNOWN_COUNTS.unrecognizedFla],
    ["SWF frames", summary.swf.totalFrames, KNOWN_COUNTS.swfFrames],
    ["course/index shells", summary.swf.courseShells, KNOWN_COUNTS.courseShells],
    ["unique course references", summary.references.course.unique, KNOWN_COUNTS.courseReferences.unique],
    ["resolved course references", summary.references.course.resolved, KNOWN_COUNTS.courseReferences.resolved],
    ["missing course references", summary.references.course.missing, KNOWN_COUNTS.courseReferences.missing],
    ["unreferenced course SWFs", summary.references.course.unreferencedExisting, KNOWN_COUNTS.courseReferences.unreferenced],
    ["unique keyterm references", summary.references.keyterm.unique, KNOWN_COUNTS.keytermReferences.unique],
    ["resolved keyterm references", summary.references.keyterm.resolved, KNOWN_COUNTS.keytermReferences.resolved],
    ["missing keyterm references", summary.references.keyterm.missing, KNOWN_COUNTS.keytermReferences.missing],
    ["unreferenced keyterm SWFs", summary.references.keyterm.unreferencedExisting, KNOWN_COUNTS.keytermReferences.unreferenced],
    ["XML files with bare ampersands", summary.xml.filesWithBareAmpersands, KNOWN_COUNTS.xmlWithBareAmpersands],
  ];
  const failures = checks.filter(([, actual, expected]) => actual !== expected);
  if (failures.length) {
    throw new Error(`Known-count verification failed:\n${failures.map(([label, actual, expected]) => `- ${label}: expected ${expected}, got ${actual}`).join("\n")}`);
  }
  if (summary.swf.headerParseErrors !== 0) throw new Error(`Known-count verification failed: ${summary.swf.headerParseErrors} SWF header parse error(s)`);
  if (summary.swf.fpsValues.length !== 1 || summary.swf.fpsValues[0] !== 12) {
    throw new Error(`Known-count verification failed: expected every SWF to use 12 fps, got ${summary.swf.fpsValues.join(", ")}`);
  }
}

async function resolveSourceRoot(explicitSource) {
  const candidates = explicitSource
    ? [explicitSource]
    : [path.join("source-assets", "flash", SOURCE_DIRECTORY_NAME), SOURCE_DIRECTORY_NAME];
  for (const candidate of candidates) {
    const absolute = path.resolve(candidate);
    const info = await stat(absolute).catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error));
    if (info?.isDirectory()) return { sourceRoot: await realpath(absolute), requestedPath: absolute };
  }
  throw new Error(`Cannot find ${SOURCE_DIRECTORY_NAME}; checked ${candidates.map((candidate) => path.resolve(candidate)).join(" and ")}`);
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

export async function buildHelpMathCatalog({
  source,
  output = DEFAULT_OUTPUT,
  concurrency = DEFAULT_CONCURRENCY,
  verifyKnownCounts = false,
  check = false,
} = {}) {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32) {
    throw new Error("concurrency must be an integer from 1 to 32");
  }
  const { sourceRoot } = await resolveSourceRoot(source);
  const outputRoot = path.resolve(output);
  const outputInfo = await lstat(outputRoot).catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error));
  if (outputInfo?.isSymbolicLink()) throw new Error(`Catalog output cannot be a symbolic link: ${outputRoot}`);
  const parentReal = await realpath(path.dirname(outputRoot)).catch(() => path.resolve(path.dirname(outputRoot)));
  const prospectiveOutput = path.join(parentReal, path.basename(outputRoot));
  if (isWithin(sourceRoot, prospectiveOutput)) throw new Error(`Refusing to write catalog files inside the preserved source archive: ${outputRoot}`);

  const discovered = await collectFiles(sourceRoot);
  discovered.sort((left, right) => compareText(left.path, right.path));
  const sourceFiles = await mapWithConcurrency(discovered, concurrency, hashSourceFile);
  const filesByPath = new Map(sourceFiles.map((file) => [lowerPath(file.path), file]));
  const byExtension = new Map();
  for (const file of sourceFiles) {
    if (!byExtension.has(file.extension)) byExtension.set(file.extension, []);
    byExtension.get(file.extension).push(file);
  }
  const swfFiles = byExtension.get("swf") ?? [];
  const flaFiles = byExtension.get("fla") ?? [];
  const mp3Files = byExtension.get("mp3") ?? [];
  const xmlFiles = byExtension.get("xml") ?? [];
  const swfHeaders = await mapWithConcurrency(swfFiles, concurrency, (file) => inspectSwf(sourceRoot, file));
  const headerByPath = new Map(swfFiles.map((file, index) => [file.path, swfHeaders[index]]));

  const courseXmlFiles = xmlFiles.filter((file) => /^HELP_COURSES\/ELMGR\d+\/L\d+\/index\.xml$/i.test(file.path));
  const keytermXmlFiles = xmlFiles.filter((file) => /^HELP_KEYTERMS\/.*\/XML\/[^/]+\.xml$/i.test(file.path));
  const courseCatalog = [];
  for (const file of courseXmlFiles) {
    courseCatalog.push({
      ...parseCourseXml(await readFile(path.join(sourceRoot, file.path), "utf8"), file.path),
      bytes: file.bytes,
      sha256: file.sha256,
    });
  }
  courseCatalog.sort((left, right) => left.grade - right.grade || left.lesson - right.lesson);
  const lessonCatalog = new Map(courseCatalog.map((lesson) => [`${lesson.grade}:${lesson.lesson}`, lesson]));
  const courseOccurrences = courseCatalog.flatMap((lesson) => lesson.references);
  const courseReferencesByExpected = new Map();
  for (const reference of courseOccurrences) {
    const key = lowerPath(reference.expectedPath);
    if (!courseReferencesByExpected.has(key)) courseReferencesByExpected.set(key, []);
    courseReferencesByExpected.get(key).push(reference);
  }
  const courseUniqueReferences = [...courseReferencesByExpected.entries()].map(([key, occurrences]) => {
    const resolved = filesByPath.get(key);
    return {
      expectedPath: occurrences[0].expectedPath,
      resolvedPath: resolved?.extension === "swf" ? resolved.path : null,
      exists: resolved?.extension === "swf",
      occurrences,
    };
  }).sort((left, right) => compareText(left.expectedPath, right.expectedPath));

  const keytermCatalog = [];
  for (const file of keytermXmlFiles) {
    keytermCatalog.push({
      ...parseKeytermXml(await readFile(path.join(sourceRoot, file.path), "utf8"), file.path),
      bytes: file.bytes,
      sha256: file.sha256,
    });
  }
  keytermCatalog.sort((left, right) => compareText(left.path, right.path));
  const keytermOccurrences = keytermCatalog.flatMap((document) => document.references);
  const keytermReferencesByFilename = new Map();
  for (const reference of keytermOccurrences) {
    const key = reference.normalizedFilename;
    if (!keytermReferencesByFilename.has(key)) keytermReferencesByFilename.set(key, []);
    keytermReferencesByFilename.get(key).push(reference);
  }
  const keytermSwfsByFilename = new Map();
  for (const file of swfFiles.filter((file) => collectionForPath(file.path) === "keyterm")) {
    keytermSwfsByFilename.set(path.posix.basename(file.path).toLowerCase(), file);
  }
  const keytermUniqueReferences = [...keytermReferencesByFilename.entries()].map(([key, occurrences]) => {
    const resolved = keytermSwfsByFilename.get(key);
    return {
      filename: occurrences[0].filename,
      expectedPath: occurrences[0].expectedPath,
      resolvedPath: resolved?.path ?? null,
      exists: Boolean(resolved),
      occurrences,
    };
  }).sort((left, right) => compareText(left.filename.toLowerCase(), right.filename.toLowerCase()));

  const flaByStemPath = new Map(flaFiles.map((file) => [lowerPath(withoutExtension(file.path)), file]));
  const swfStemPaths = new Set(swfFiles.map((file) => lowerPath(withoutExtension(file.path))));
  const flaOnly = flaFiles.filter((file) => !swfStemPaths.has(lowerPath(withoutExtension(file.path)))).map((file) => ({
    flaId: `fla-${file.sha256}`,
    expectedAnimationId: baseAnimationId(`${withoutExtension(file.path)}.swf`),
    source: file,
    classification: classificationForAnimation(`${withoutExtension(file.path)}.swf`, null, null, lessonCatalog),
    status: "fla-only",
  }));

  const animationIds = assignUniqueAnimationIds(swfFiles);
  const audioIndexes = buildAudioIndexes(mp3Files);
  const animations = swfFiles.map((file) => {
    const collection = collectionForPath(file.path);
    const courseRefs = courseReferencesByExpected.get(lowerPath(file.path)) ?? [];
    const keytermRefs = collection === "keyterm"
      ? keytermReferencesByFilename.get(path.posix.basename(file.path).toLowerCase()) ?? []
      : [];
    const referenced = courseRefs.length > 0 || keytermRefs.length > 0;
    const variant = variantForPath(file.path, referenced);
    const pairedFla = flaByStemPath.get(lowerPath(withoutExtension(file.path))) ?? null;
    const classification = classificationForAnimation(file.path, courseRefs[0] ?? null, keytermRefs[0] ?? null, lessonCatalog);
    const courseParts = coursePathParts(file.path);
    const shell = collection === "course" && /^index/i.test(courseParts?.stem ?? withoutExtension(path.posix.basename(file.path)));
    return {
      animationId: animationIds.get(file.path),
      assetId: `swf-${file.sha256}`,
      canonicalAnimationId: null,
      isCanonical: false,
      duplicateOf: null,
      duplicateGroupSize: 1,
      source: {
        path: file.path,
        bytes: file.bytes,
        sha256: file.sha256,
        swf: headerByPath.get(file.path),
      },
      pairedFla: pairedFla ? { path: pairedFla.path, bytes: pairedFla.bytes, sha256: pairedFla.sha256 } : null,
      classification,
      references: {
        courseXml: courseRefs.map((reference) => ({
          sourceXmlPath: reference.sourceXmlPath,
          expectedPath: reference.expectedPath,
          occurrence: reference.occurrence,
        })),
        keytermXml: keytermRefs.map((reference) => ({
          sourceXmlPath: reference.sourceXmlPath,
          filename: reference.filename,
          occurrence: reference.occurrence,
          syntax: reference.syntax,
        })),
      },
      audio: audioForAnimation(file.path, audioIndexes),
      flags: {
        referenced,
        unreferenced: !referenced,
        variant: variant.variant,
        variantKind: variant.kind,
        shell,
      },
      migration: {
        status: "discovered",
        fidelityClaim: "not-audited",
      },
    };
  });

  const animationsByAsset = new Map();
  for (const animation of animations) {
    if (!animationsByAsset.has(animation.assetId)) animationsByAsset.set(animation.assetId, []);
    animationsByAsset.get(animation.assetId).push(animation);
  }
  const assets = [];
  const duplicates = [];
  for (const [assetId, group] of animationsByAsset) {
    const canonical = chooseCanonical(group);
    for (const animation of group) {
      animation.canonicalAnimationId = canonical.animationId;
      animation.isCanonical = animation === canonical;
      animation.duplicateOf = animation === canonical ? null : canonical.animationId;
      animation.duplicateGroupSize = group.length;
    }
    group.sort((left, right) => compareText(left.animationId, right.animationId));
    const asset = {
      assetId,
      sha256: canonical.source.sha256,
      bytes: canonical.source.bytes,
      canonicalAnimationId: canonical.animationId,
      animationIds: group.map((animation) => animation.animationId),
      sourcePaths: group.map((animation) => animation.source.path),
      classification: canonical.classification,
      flags: canonical.flags,
      swf: canonical.source.swf,
      migration: canonical.migration,
    };
    assets.push(asset);
    if (group.length > 1) duplicates.push({
      assetId,
      sha256: canonical.source.sha256,
      canonicalAnimationId: canonical.animationId,
      placementCount: group.length,
      placements: group.map((animation) => ({
        animationId: animation.animationId,
        sourcePath: animation.source.path,
        isCanonical: animation.isCanonical,
        duplicateOf: animation.duplicateOf,
      })),
    });
  }
  animations.sort((left, right) => compareText(left.animationId, right.animationId));
  assets.sort((left, right) => compareText(left.canonicalAnimationId, right.canonicalAnimationId));
  duplicates.sort((left, right) => compareText(left.canonicalAnimationId, right.canonicalAnimationId));

  const courseAnimations = animations.filter((animation) => animation.classification.collection === "course");
  const keytermAnimations = animations.filter((animation) => animation.classification.collection === "keyterm");
  const missingCourse = courseUniqueReferences.filter((reference) => !reference.exists);
  const missingKeyterm = keytermUniqueReferences.filter((reference) => !reference.exists);
  const unreferencedCourse = courseAnimations.filter((animation) => animation.flags.unreferenced);
  const unreferencedKeyterm = keytermAnimations.filter((animation) => animation.flags.unreferenced);
  const parsedHeaders = animations.map((animation) => animation.source.swf).filter((header) => header.status === "parsed");
  const checksumText = renderSha256(sourceFiles);
  const extensions = Object.fromEntries([...byExtension.entries()].map(([extension, files]) => [extension, files.length]).sort(([left], [right]) => compareText(left, right)));
  const byCollection = { course: 0, keyterm: 0, formula: 0, unknown: 0 };
  for (const animation of animations) byCollection[animation.classification.collection] += 1;
  const discrepancies = [{
    id: "keyterm-missing-reference-count",
    approvedPlanValue: 316,
    evidenceCorrectValue: missingKeyterm.length,
    explanation: "The earlier count skipped Cubed_root.swf because both keyterm XML files spell the attribute as `ExFileName =\"Cubed_root.swf\"` (whitespace before `=`). Tolerant parsing includes it; no matching SWF or FLA exists.",
    sourcePaths: keytermOccurrences.filter((reference) => reference.filename.toLowerCase() === "cubed_root.swf").map((reference) => reference.sourceXmlPath),
  }];
  const summary = {
    schemaVersion: 1,
    source: {
      directory: SOURCE_DIRECTORY_NAME,
      fileCount: sourceFiles.length,
      totalBytes: sourceFiles.reduce((total, file) => total + file.bytes, 0),
      checksumSetSha256: createHash("sha256").update(checksumText).digest("hex"),
      extensions,
    },
    swf: {
      placements: animations.length,
      uniqueAssets: assets.length,
      duplicateGroups: duplicates.length,
      duplicatePlacements: animations.length - assets.length,
      byCollection,
      headerParseErrors: animations.length - parsedHeaders.length,
      signatures: [...new Set(parsedHeaders.map((header) => header.signature))].sort(compareText),
      fpsValues: [...new Set(parsedHeaders.map((header) => header.fps))].sort((left, right) => left - right),
      totalFrames: parsedHeaders.reduce((total, header) => total + header.frameCount, 0),
      courseShells: animations.filter((animation) => animation.flags.shell).length,
    },
    pairing: {
      pairedSwfFla: animations.filter((animation) => animation.pairedFla).length,
      swfOnly: animations.filter((animation) => !animation.pairedFla).length,
      flaOnly: flaOnly.length,
    },
    fla: {
      files: flaFiles.length,
      compoundBinary: flaFiles.filter((file) => file.flaContainer === "compound-binary").length,
      zipArchive: flaFiles.filter((file) => file.flaContainer === "zip-archive").length,
      unrecognized: flaFiles.filter((file) => file.flaContainer === "unrecognized").length,
    },
    xml: {
      files: xmlFiles.length,
      courseFiles: courseCatalog.length,
      keytermFiles: keytermCatalog.length,
      filesWithBareAmpersands: [...courseCatalog, ...keytermCatalog].filter((document) => document.bareAmpersandCount > 0).length,
    },
    audio: {
      files: mp3Files.length,
      exactAssociations: animations.reduce((total, animation) => total + animation.audio.exact.length, 0),
      groupCount: audioIndexes.groups.size,
    },
    references: {
      course: {
        occurrences: courseOccurrences.length,
        unique: courseUniqueReferences.length,
        resolved: courseUniqueReferences.filter((reference) => reference.exists).length,
        missing: missingCourse.length,
        unreferencedExisting: unreferencedCourse.length,
      },
      keyterm: {
        occurrences: keytermOccurrences.length,
        unique: keytermUniqueReferences.length,
        resolved: keytermUniqueReferences.filter((reference) => reference.exists).length,
        missing: missingKeyterm.length,
        unreferencedExisting: unreferencedKeyterm.length,
      },
    },
    migration: {
      status: "intake-catalog-only",
      complete: 0,
      discoveredPlacements: animations.length,
      discoveredCanonicalAssets: assets.length,
    },
    discrepancies,
  };

  if (verifyKnownCounts) assertKnownCounts(summary);

  const missingReferences = {
    schemaVersion: 1,
    summary: summary.references,
    discrepancies,
    course: missingCourse,
    keyterm: missingKeyterm,
  };
  const unreferenced = {
    schemaVersion: 1,
    summary: {
      course: unreferencedCourse.length,
      keyterm: unreferencedKeyterm.length,
    },
    course: unreferencedCourse.map((animation) => ({ animationId: animation.animationId, assetId: animation.assetId, sourcePath: animation.source.path, flags: animation.flags })),
    keyterm: unreferencedKeyterm.map((animation) => ({ animationId: animation.animationId, assetId: animation.assetId, sourcePath: animation.source.path, flags: animation.flags })),
  };
  const audioGroups = {
    schemaVersion: 1,
    groups: [...audioIndexes.groups.entries()].sort(([left], [right]) => compareText(left, right)).map(([groupId, files]) => ({
      groupId,
      files: files.map((file) => ({ path: file.path, bytes: file.bytes, sha256: file.sha256, language: languageForAudioPath(file.path) })),
    })),
  };
  const lessons = {
    schemaVersion: 1,
    lessons: courseCatalog.map((lesson) => ({
      path: lesson.path,
      bytes: lesson.bytes,
      sha256: lesson.sha256,
      grade: lesson.grade,
      lesson: lesson.lesson,
      courseName: lesson.courseName,
      titleRaw: lesson.titleRaw,
      titleDisplay: lesson.titleDisplay,
      domain: lesson.domain,
      pageRoot: lesson.pageRoot,
      bareAmpersandCount: lesson.bareAmpersandCount,
      tolerantParsingApplied: lesson.tolerantParsingApplied,
      sectionCount: lesson.sections.length,
      pageReferenceCount: lesson.references.length,
      sections: lesson.sections.map((section) => ({
        code: section.code,
        number: section.number,
        titleEnglish: section.titleEnglish,
        titleSpanish: section.titleSpanish,
        pageReferenceCount: section.pages.length,
      })),
    })),
  };
  const batches = buildBatchQueues(assets, { verifyKnownCounts });
  const lessonReleases = buildLessonReleases({animations, batches, lessons});

  const outputs = new Map([
    ["summary.json", json(summary)],
    ["animations.json", json({ schemaVersion: 1, summary, animations })],
    ["animations.jsonl", jsonl(animations)],
    ["animations.csv", renderAnimationCsv(animations)],
    ["assets.json", json({ schemaVersion: 1, assets })],
    ["duplicates.json", json({ schemaVersion: 1, duplicateGroupCount: duplicates.length, duplicatePlacementCount: animations.length - assets.length, groups: duplicates })],
    ["missing-references.json", json(missingReferences)],
    ["unreferenced.json", json(unreferenced)],
    ["fla-only.json", json({ schemaVersion: 1, count: flaOnly.length, files: flaOnly })],
    ["lessons.json", json(lessons)],
    ["audio-groups.json", json(audioGroups)],
    ["batches.json", json(batches)],
    ["lesson-releases.json", json(lessonReleases)],
    ["source-files.json", json({ schemaVersion: 1, sourceDirectory: SOURCE_DIRECTORY_NAME, fileCount: sourceFiles.length, totalBytes: summary.source.totalBytes, checksumSetSha256: summary.source.checksumSetSha256, files: sourceFiles })],
    ["source-files.jsonl", jsonl(sourceFiles)],
    ["source-files.csv", renderSourceCsv(sourceFiles)],
    ["source-files.sha256", checksumText],
  ]);
  if (check) {
    const stale = [];
    for (const [filename, contents] of outputs) {
      const actual = await readFile(path.join(outputRoot, filename), "utf8")
        .catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error));
      if (actual !== contents) stale.push(filename);
    }
    if (stale.length > 0) throw new Error(`Catalog check failed; stale or missing outputs: ${stale.join(", ")}`);
  } else {
    await mkdir(outputRoot, { recursive: true });
    await Promise.all([...outputs.entries()].map(([filename, contents]) =>
      writeFile(path.join(outputRoot, filename), contents, "utf8")));
  }

  return {
    sourceRoot,
    outputRoot,
    summary,
    animations,
    assets,
    duplicates,
    missingReferences,
    flaOnly,
    batches,
    lessonReleases,
    check,
    outputFiles: [...outputs.keys()],
  };
}

function usage() {
  return `Build the deterministic HELP Math SWF intake catalog without modifying legacy sources.

Usage:
  node scripts/build-help-math-catalog.mjs [options]

Options:
  --source <directory>      Legacy source root; auto-detected when omitted
  --output <directory>      Catalog output directory (default: ${DEFAULT_OUTPUT})
  --concurrency <1-32>      Concurrent hashing/header workers (default: ${DEFAULT_CONCURRENCY})
  --verify-known-counts     Fail unless the approved full-archive totals match
  --check                   Recompute and byte-check every catalog output without writing
  --help                    Show this help
`;
}

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") return { help: true };
    if (argument === "--verify-known-counts") {
      options.verifyKnownCounts = true;
      continue;
    }
    if (argument === "--check") {
      options.check = true;
      continue;
    }
    if (!new Set(["--source", "--output", "--concurrency"]).has(argument)) throw new Error(`Unknown option: ${argument}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${argument}`);
    const key = argument.slice(2);
    if (options[key] !== undefined) throw new Error(`Option provided more than once: ${argument}`);
    options[key] = key === "concurrency" ? Number(value) : value;
    index += 1;
  }
  return options;
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(usage());
      return;
    }
    const result = await buildHelpMathCatalog(options);
    process.stdout.write(result.check
      ? `PASS: all ${result.outputFiles.length} catalog outputs are current at ${result.outputRoot}\n`
      : `Cataloged ${result.summary.swf.placements} SWF placements as ${result.summary.swf.uniqueAssets} canonical assets.\n` +
        `Source: ${result.sourceRoot}\nCatalog: ${result.outputRoot}\n` +
        `Migration status remains intake-only; no animation was marked complete.\n`);
  } catch (error) {
    process.stderr.write(`HELP Math catalog failed: ${error.message}\n\n${usage()}`);
    process.exitCode = 1;
  }
}

const invokedUrl = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (invokedUrl === import.meta.url) await main();
