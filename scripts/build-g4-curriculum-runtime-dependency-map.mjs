#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEFAULT_OUTPUT = path.join(
  ROOT,
  "catalog",
  "alignments",
  "g4-curriculum-runtime-dependency-map-v1.json",
);
const DEFAULT_SQL_AGGREGATE = path.join(ROOT, "reports", "g4-sql-course-aggregate.json");
const DEFAULT_DIG_PLAN =
  "/Volumes/WestWorld/HELP MATH Related Files/Google Drive Source Intake/2026-08-02-HELP-ELM-FINAL-Dec21-2015/manifests/dig-intake-plan.json";
const G4_PREFIX = "HELP_COURSES/ELMGR4/";
const KEYTERM_DIG_PREFIX = "HELP_KEYTERMS/KT/ELEMENTARY/DIG/";
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;

const INPUTS = Object.freeze({
  sourceCatalog: "catalog/source-files.json",
  lessonsCatalog: "catalog/lessons.json",
  animationsCatalog: "catalog/animations.json",
  missingReferences: "catalog/missing-references.json",
  priorActivePromotionPlan:
    "catalog/source-promotions/g4-active-source-promotion-2026-08-02.json",
  gradeWideKeyTermsEnglish:
    "apps/web/public/generated/g4-grade-wide-keyterms-en.json",
  gradeWideKeyTermsSpanish:
    "apps/web/public/generated/g4-grade-wide-keyterms-es.json",
  sqlAggregate: "reports/g4-sql-course-aggregate.json",
});

const KNOWN = Object.freeze({
  lessons: 12,
  sections: 96,
  pages: 645,
  shells: 12,
  sourceMembers: 657,
  quizWrappers: 36,
  pageLabelsUsingEnglishFallbackForSpanish: 175,
  ordinaryAudioExpected: 516,
  ordinaryAudioPresent: 508,
  ordinaryAudioMissing: 8,
  finalQuizLabels: 157,
  finalQuizAudioExpected: 1_570,
  finalQuizAudioPresent: 1_562,
  finalQuizAudioMissing: 8,
  audioExpected: 2_086,
  audioPresent: 2_070,
  audioMissing: 16,
  fqAudioCandidatePool: 2_209,
  fqAudioCandidatesExcluded: 647,
  keyTermOccurrences: 1_515,
  keyTermUnique: 760,
  keyTermResolved: 443,
  keyTermMissing: 317,
  keyTermCandidateReviewHolds: 316,
  keyTermCaseVariantReviewCandidates: 299,
  keyTermExactPlacementReviewCandidates: 17,
  keyTermStillUnresolvedAfterCandidateReview: 1,
  keyTermEnglishEntries: 761,
  keyTermEnglishWarnings: 6,
  keyTermSpanishEntries: 753,
  keyTermSpanishWarnings: 2,
  missingAudioPathSetSha256:
    "439fce1e41ef10591c165f0eed65638d1a7afc81080db182770911bd1d8c4286",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stable(value) {
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

function compareText(left, right) {
  return String(left).localeCompare(String(right), "en", {sensitivity: "variant"});
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function relativeProjectPath(root, absolutePath) {
  const relative = portable(path.relative(root, absolutePath));
  invariant(
    relative && !relative.startsWith("../") && !path.isAbsolute(relative),
    `${absolutePath} escapes the project root`,
  );
  return relative;
}

function decodeEntities(value) {
  const named = {amp: "&", apos: "'", gt: ">", lt: "<", quot: '"'};
  return value.replace(
    /&(#x[0-9a-f]+|#\d+|amp|apos|gt|lt|quot);/giu,
    (match, entity) => {
      if (entity[0] === "#") {
        const hexadecimal = entity[1].toLowerCase() === "x";
        const codePoint = Number.parseInt(
          entity.slice(hexadecimal ? 2 : 1),
          hexadecimal ? 16 : 10,
        );
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
      }
      return named[entity.toLowerCase()] ?? match;
    },
  );
}

function cleanText(value) {
  return decodeEntities(value.replace(/<[^>]+>/gu, " "))
    .replace(/\s+/gu, " ")
    .trim();
}

function extractTagText(text, tagName) {
  const match = text.match(
    new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"),
  );
  return match ? cleanText(match[1]) : null;
}

function parseAttributes(source) {
  const attributes = {};
  const pattern = /([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gu;
  for (const match of source.matchAll(pattern)) {
    attributes[match[1]] = decodeEntities(match[2] ?? match[3] ?? "");
  }
  return attributes;
}

function stripLeadingOrdinal(value) {
  return value.replace(/^\s*\d+\s*[.)-]\s*/u, "").trim();
}

function normalizeReferencePath(value) {
  return path.posix.normalize(value.trim().replaceAll("\\", "/").replace(/^\/+/, ""));
}

function exactTagBlock(text, tagName) {
  return text.match(
    new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"),
  )?.[1] ?? "";
}

export function parseGrade4CourseXml(text, xmlPath) {
  const match = xmlPath.match(/^HELP_COURSES\/ELMGR4\/L(\d+)\/index\.xml$/u);
  invariant(match, `Not a canonical Grade 4 lesson XML path: ${xmlPath}`);
  const lessonNumber = Number(match[1]);
  const activeText = text.replace(/<!--[\s\S]*?-->/gu, "");
  const keyTermsBody = exactTagBlock(activeText, "Keyterms");
  const lessonRoot = `${G4_PREFIX}L${lessonNumber}`;
  const sections = [];
  const pages = [];

  for (const sectionMatch of activeText.matchAll(
    /<Section\b([^>]*)>([\s\S]*?)<\/Section>/giu,
  )) {
    const sectionAttributes = parseAttributes(sectionMatch[1]);
    const sectionBody = sectionMatch[2];
    const sectionCode = (sectionAttributes.SName ?? "unknown").toUpperCase();
    const sectionNumber = Number(sectionAttributes.SNumber) || null;
    const titleBody = exactTagBlock(sectionBody, "Title");
    const sectionTitleEnglish = extractTagText(titleBody, "English");
    const sectionTitleSpanish = extractTagText(titleBody, "Spanish");
    const sectionPages = [];
    const subpages = [];

    for (const pageMatch of sectionBody.matchAll(/<Page\b([^>]*)>([\s\S]*?)<\/Page>/giu)) {
      const attributes = parseAttributes(pageMatch[1]);
      const reference = normalizeReferencePath(cleanText(pageMatch[2]));
      if (!reference || !/\.swf$/iu.test(reference)) continue;
      sectionPages.push({
        attributes,
        reference,
        expectedPath: normalizeReferencePath(path.posix.join(lessonRoot, reference)),
        titleRaw: attributes.Title?.trim() || null,
      });
    }

    for (const subpageMatch of sectionBody.matchAll(
      /<SubPageTitle\b([^>]*)>([\s\S]*?)<\/SubPageTitle>/giu,
    )) {
      const attributes = parseAttributes(subpageMatch[1]);
      const reference = normalizeReferencePath(cleanText(subpageMatch[2]));
      subpages.push({
        expectedPath: normalizeReferencePath(path.posix.join(lessonRoot, reference)),
        titleEnglish: stripLeadingOrdinal(attributes.EngSubTitleName ?? "") || null,
        titleSpanish: stripLeadingOrdinal(attributes.SpanSubTitleName ?? "") || null,
      });
    }

    const subpageStarts = subpages
      .map((subpage) => ({
        ...subpage,
        start: sectionPages.findIndex(
          (page) => page.expectedPath.toLowerCase() === subpage.expectedPath.toLowerCase(),
        ),
      }))
      .filter(({start}) => start >= 0)
      .sort((left, right) => left.start - right.start);

    sectionPages.forEach((page, index) => {
      let knowledgePoint = null;
      for (const candidate of subpageStarts) {
        if (candidate.start > index) break;
        knowledgePoint = candidate;
      }
      const titleEnglish =
        knowledgePoint?.titleEnglish ?? page.titleRaw ?? sectionTitleEnglish ?? sectionCode;
      const exactSpanishTitle = knowledgePoint?.titleSpanish ?? null;
      const record = {
        globalPageOrdinal: pages.length + 1,
        sectionCode,
        sectionNumber,
        sectionPageOrdinal: index + 1,
        expectedPath: page.expectedPath,
        titleEnglish,
        titleSpanish: exactSpanishTitle ?? titleEnglish,
        spanishTitleDisposition: exactSpanishTitle
          ? "source-subpage-title"
          : "english-fallback-no-source-spanish-page-title",
        pageAttributes: page.attributes,
      };
      sectionPages[index] = {...page, record};
      pages.push(record);
    });

    sections.push({
      sectionCode,
      sectionNumber,
      titleEnglish: sectionTitleEnglish,
      titleSpanish: sectionTitleSpanish,
      pageCount: sectionPages.length,
    });
  }

  return {
    lessonNumber,
    courseName: extractTagText(activeText, "CourseName"),
    title: extractTagText(activeText, "NewTitle1") ?? extractTagText(activeText, "LessonName"),
    pageRoot: extractTagText(activeText, "PageRoot"),
    keyTerms: {
      english: extractTagText(keyTermsBody, "English"),
      spanish: extractTagText(keyTermsBody, "Spanish"),
      diagramDirectory: extractTagText(keyTermsBody, "DigDir"),
    },
    sections,
    pages,
  };
}

function pathSetDigest(paths) {
  return sha256(
    Buffer.from([...paths].sort(compareText).map((value) => `${value}\n`).join("")),
  );
}

function recordSetDigest(records) {
  return sha256(
    Buffer.from(
      [...records]
        .sort((left, right) => compareText(left.canonicalPath, right.canonicalPath))
        .map(({canonicalPath, bytes, sha256: digest}) =>
          `${canonicalPath}\t${bytes}\t${digest}\n`)
        .join(""),
    ),
  );
}

export function deriveWholeCourseAudioRequirements({
  lessons,
  fqTargetEvidence,
  ordinaryBindings = null,
}) {
  const ordinaryCandidateByPath = new Map();
  for (const lesson of lessons) {
    for (const page of lesson.pages) {
      const eligible =
        (page.sectionNumber >= 2 && page.sectionNumber <= 6) ||
        (page.sectionNumber === 7 && page.sectionPageOrdinal !== 1);
      const basename = path.posix.basename(page.expectedPath, ".swf");
      const canonicalPath = `${G4_PREFIX}L${lesson.lessonNumber}/SA/${basename}.mp3`;
      invariant(!ordinaryCandidateByPath.has(canonicalPath),
        `Duplicate ordinary audio route candidate: ${canonicalPath}`);
      ordinaryCandidateByPath.set(canonicalPath, {
        canonicalPath,
        audioBindingKind: "ordinary-spanish-page",
        language: "es",
        hostRouteEligible: eligible,
        bindingEvidence:
          "pinned host AVM1 route: sections 2-6 and section 7 after the first host slide load sibling SA basename",
        requiredBy: [page.expectedPath],
      });
    }
  }
  const ordinary = ordinaryBindings === null
    ? [...ordinaryCandidateByPath.values()].filter(({hostRouteEligible}) => hostRouteEligible)
    : ordinaryBindings.map((binding) => {
        const candidate = ordinaryCandidateByPath.get(binding.canonicalPath);
        invariant(candidate, `Ordinary audio binding has no active page placement: ${binding.canonicalPath}`);
        invariant(!binding.requireHostRouteEligibility || candidate.hostRouteEligible,
          `Required-unresolved ordinary audio is outside the pinned host route: ${binding.canonicalPath}`);
        invariant(
          !binding.requiredBy ||
            (binding.requiredBy.length === 1 && binding.requiredBy[0] === candidate.requiredBy[0]),
          `Ordinary audio requiredBy drift: ${binding.canonicalPath}`,
        );
        return {
          ...candidate,
          bindingBasis: binding.bindingBasis ?? "explicit-provided-binding",
          bindingEvidence: binding.bindingEvidence ?? candidate.bindingEvidence,
        };
      });
  invariant(new Set(ordinary.map(({canonicalPath}) => canonicalPath)).size === ordinary.length,
    "Ordinary audio bindings contain duplicate canonical paths");

  const quizPages = new Set(
    lessons.flatMap((lesson) =>
      lesson.pages.filter(({sectionCode}) => sectionCode === "FQ").map(({expectedPath}) => expectedPath),
    ),
  );
  const labelsByLesson = new Map();
  const requiredByLesson = new Map();
  for (const evidence of fqTargetEvidence) {
    invariant(quizPages.has(evidence.canonicalPath),
      `FQ target evidence is not an active Grade 4 quiz wrapper: ${evidence.canonicalPath}`);
    invariant(evidence.questionLabels.length === evidence.questionCount,
      `FQ question-count drift at ${evidence.canonicalPath}`);
    evidence.questionLabels.forEach((label, index) => {
      invariant(label === `Q${index + 1}`, `Non-contiguous FQ labels at ${evidence.canonicalPath}`);
    });
    if (!evidence.audioBound) {
      invariant(evidence.questionLabels.length === 0, `Unbound FQ target has labels: ${evidence.canonicalPath}`);
      continue;
    }
    const lessonMatch = evidence.canonicalPath.match(/^HELP_COURSES\/ELMGR4\/L(\d+)\//u);
    invariant(lessonMatch, `Cannot derive FQ lesson: ${evidence.canonicalPath}`);
    const lessonNumber = Number(lessonMatch[1]);
    const labels = labelsByLesson.get(lessonNumber) ?? new Set();
    evidence.questionLabels.forEach((label) => labels.add(label));
    labelsByLesson.set(lessonNumber, labels);
    const targets = requiredByLesson.get(lessonNumber) ?? new Set();
    targets.add(evidence.canonicalPath);
    requiredByLesson.set(lessonNumber, targets);
  }

  const finalQuiz = [];
  for (const [lessonNumber, labels] of [...labelsByLesson.entries()].sort(
    ([left], [right]) => left - right,
  )) {
    const requiredBy = [...requiredByLesson.get(lessonNumber)].sort(compareText);
    for (const questionLabel of [...labels].sort((left, right) =>
      Number(left.slice(1)) - Number(right.slice(1)))) {
      for (const languageDirectory of ["EA", "SA"]) {
        for (const suffix of ["", "A", "B", "C", "D"]) {
          finalQuiz.push({
            canonicalPath:
              `${G4_PREFIX}L${lessonNumber}/FQ/${languageDirectory}/${questionLabel}${suffix}.mp3`,
            audioBindingKind: "final-quiz-question-answer",
            language: languageDirectory === "EA" ? "en" : "es",
            bindingEvidence:
              "pinned target SWF quiz labels plus host EA/SA question-and-four-option route",
            requiredBy,
          });
        }
      }
    }
  }

  const all = [...ordinary, ...finalQuiz].sort((left, right) =>
    compareText(left.canonicalPath, right.canonicalPath));
  invariant(new Set(all.map(({canonicalPath}) => canonicalPath)).size === all.length,
    "Whole-course audio requirements contain duplicate canonical paths");
  return {
    ordinary,
    finalQuiz,
    all,
    finalQuizUniqueQuestionLabelCount: [...labelsByLesson.values()].reduce(
      (sum, labels) => sum + labels.size,
      0,
    ),
  };
}

export function reconcileKeyTerms({missingReferences, digIntakePlan, englishData, spanishData, lessonDeclarations}) {
  invariant(Array.isArray(missingReferences.keyterm), "missing-references.keyterm is not an array");
  invariant(Array.isArray(digIntakePlan.records), "DIG intake plan records are missing");
  const swfCandidatesByLowerPath = new Map();
  for (const record of digIntakePlan.records.filter(({extension}) => extension === "swf")) {
    invariant(record.canonicalPath?.startsWith(KEYTERM_DIG_PREFIX),
      `Out-of-scope DIG candidate: ${record.canonicalPath}`);
    invariant(SHA256_PATTERN.test(record.sha256) && Number.isSafeInteger(record.bytes),
      `Invalid DIG candidate identity: ${record.canonicalPath}`);
    const lower = record.canonicalPath.toLowerCase();
    const candidates = swfCandidatesByLowerPath.get(lower) ?? [];
    candidates.push(record);
    swfCandidatesByLowerPath.set(lower, candidates);
  }

  const missing = missingReferences.keyterm.map((record) => {
    const candidates = swfCandidatesByLowerPath.get(record.expectedPath.toLowerCase()) ?? [];
    invariant(candidates.length <= 1, `Ambiguous case-insensitive DIG candidates: ${record.expectedPath}`);
    const candidate = candidates[0];
    const sameExactPlacement = candidate?.canonicalPath === record.expectedPath;
    return {
      expectedPath: record.expectedPath,
      occurrenceCount: record.occurrences.length,
      status: candidate
        ? sameExactPlacement
          ? "hold-exact-placement-sha-and-receipt-review"
          : "hold-case-variant-placement-sha-and-receipt-review"
        : "required-unresolved-source",
      expectedSha256: null,
      candidate: candidate
        ? {
            canonicalPath: candidate.canonicalPath,
            bytes: candidate.bytes,
            sha256: candidate.sha256,
            sameExactPlacement,
            admissionEffect: "none-until-reviewed-placement-receipt",
          }
        : null,
    };
  });
  const candidateReviewHolds = missing.filter(({candidate}) => candidate);
  const caseVariantReview = candidateReviewHolds.filter(
    ({candidate}) => !candidate.sameExactPlacement,
  );
  const exactPlacementReview = candidateReviewHolds.filter(
    ({candidate}) => candidate.sameExactPlacement,
  );
  const noCandidate = missing.filter(({candidate}) => !candidate);
  invariant(noCandidate.length === 1 && noCandidate[0].expectedPath === `${KEYTERM_DIG_PREFIX}Polynomial.swf`,
    "Polynomial.swf is no longer the sole missing Key Term diagram without a cloud SWF candidate");
  const polynomialFla = digIntakePlan.records.find(
    ({canonicalPath, extension}) =>
      extension === "fla" && canonicalPath.toLowerCase() === `${KEYTERM_DIG_PREFIX}polynomial.fla`.toLowerCase(),
  );
  invariant(polynomialFla, "Polynomial.fla companion authoring source is absent from the DIG intake plan");

  return {
    lessonDeclarations,
    gradeWideStaticCandidates: {
      english: {
        source: englishData.source,
        entryCount: englishData.extraction.entryCount,
        warningCount: englishData.extraction.warningCount,
        runtimeResolutionVerified: englishData.lessonBinding.runtimeResolutionVerified,
        ownerAccepted: englishData.authority.ownerAccepted,
      },
      spanish: {
        source: spanishData.source,
        entryCount: spanishData.extraction.entryCount,
        warningCount: spanishData.extraction.warningCount,
        runtimeResolutionVerified: spanishData.lessonBinding.runtimeResolutionVerified,
        ownerAccepted: spanishData.authority.ownerAccepted,
      },
      disposition: "grade-wide-static-candidate-not-lesson-runtime-resolution",
    },
    diagramObligations: {
      occurrences: missingReferences.summary.keyterm.occurrences,
      unique: missingReferences.summary.keyterm.unique,
      canonicalResolved: missingReferences.summary.keyterm.resolved,
      canonicalMissing: missing.length,
      totalCandidateReviewHolds: candidateReviewHolds.length,
      caseVariantPlacementReviewCandidates: caseVariantReview.length,
      exactPlacementShaReceiptReviewCandidates: exactPlacementReview.length,
      stillUnresolvedAfterAllCandidateReviews: noCandidate.length,
      potentialResolvedAfterReview:
        missingReferences.summary.keyterm.resolved + candidateReviewHolds.length,
      missingPathSetSha256: pathSetDigest(missing.map(({expectedPath}) => expectedPath)),
      candidateReviewRecordSetSha256: recordSetDigest(
        candidateReviewHolds.map(({candidate}) => ({
          canonicalPath: candidate.canonicalPath,
          bytes: candidate.bytes,
          sha256: candidate.sha256,
        })),
      ),
      caseVariantReviewRecordSetSha256: recordSetDigest(
        caseVariantReview.map(({candidate}) => ({
          canonicalPath: candidate.canonicalPath,
          bytes: candidate.bytes,
          sha256: candidate.sha256,
        })),
      ),
      exactPlacementReviewRecordSetSha256: recordSetDigest(
        exactPlacementReview.map(({candidate}) => ({
          canonicalPath: candidate.canonicalPath,
          bytes: candidate.bytes,
          sha256: candidate.sha256,
        })),
      ),
      automaticCaseNormalizationAuthorized: false,
      automaticExactPlacementAdmissionAuthorized: false,
      missing,
      polynomialDisposition: {
        expectedRuntimePath: `${KEYTERM_DIG_PREFIX}Polynomial.swf`,
        runtimeSwfPresent: false,
        companionFla: {
          canonicalPath: polynomialFla.canonicalPath,
          bytes: polynomialFla.bytes,
          sha256: polynomialFla.sha256,
        },
        flaDoesNotSubstituteForShippedRuntime: true,
        status: "required-unresolved-source",
      },
    },
    authorityBoundary: {
      runtimeResolutionVerified: false,
      caseVariantPlacementAccepted: false,
      exactPlacementAccepted: false,
      originalRuntimeBaseline: false,
      humanOrOwnerAccepted: false,
      strictCompletion: false,
      publication: false,
    },
  };
}

async function readJsonEvidence(absolutePath, displayPath) {
  const info = await lstat(absolutePath);
  invariant(info.isFile() && !info.isSymbolicLink(), `${displayPath} is not a regular file`);
  const bytes = await readFile(absolutePath);
  return {
    value: JSON.parse(bytes.toString("utf8")),
    evidence: {path: displayPath, bytes: bytes.length, sha256: sha256(bytes)},
  };
}

function assertKnown(actual, expected, label) {
  invariant(actual === expected, `${label} drifted: ${actual} != ${expected}`);
}

function summarizeAudio(records, kind) {
  const selected = records.filter((record) => record.audioBindingKind === kind);
  const present = selected.filter(({sourceStatus}) => sourceStatus === "canonical-source-present");
  const missing = selected.filter(({sourceStatus}) => sourceStatus === "required-unresolved-source");
  return {
    expected: selected.length,
    present: present.length,
    missing: missing.length,
    expectedPathSetSha256: pathSetDigest(selected.map(({canonicalPath}) => canonicalPath)),
    presentRecordSetSha256: recordSetDigest(present),
    missingPathSetSha256: pathSetDigest(missing.map(({canonicalPath}) => canonicalPath)),
  };
}

async function writeOrCheck(file, bytes, mode) {
  if (mode === "check") {
    const existing = await readFile(file);
    invariant(existing.equals(bytes), `${relativeProjectPath(ROOT, file)} is stale`);
    return;
  }
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, bytes);
}

export async function buildG4CurriculumRuntimeDependencyMap({
  root = ROOT,
  output = path.join(root, path.relative(ROOT, DEFAULT_OUTPUT)),
  sqlAggregate = path.join(root, path.relative(ROOT, DEFAULT_SQL_AGGREGATE)),
  digPlan = DEFAULT_DIG_PLAN,
  mode = "check",
} = {}) {
  invariant(mode === "write" || mode === "check" || mode === "memory", `Unsupported mode: ${mode}`);
  const projectInput = (relative) => path.join(root, relative);
  const loadedPairs = await Promise.all(
    Object.entries(INPUTS).map(async ([key, relative]) => {
      const absolute = key === "sqlAggregate" ? sqlAggregate : projectInput(relative);
      return [key, await readJsonEvidence(absolute, relative)];
    }),
  );
  const loaded = Object.fromEntries(loadedPairs);
  const dig = await readJsonEvidence(
    digPlan,
    "private-quarantine/dig-intake-plan.json",
  );
  const sourceCatalog = loaded.sourceCatalog.value;
  const sourceByPath = new Map(sourceCatalog.files.map((record) => [record.path, record]));
  invariant(sourceByPath.size === sourceCatalog.files.length, "Source catalog paths are not unique");
  const lessonCatalog = loaded.lessonsCatalog.value.lessons
    .filter(({grade}) => grade === 4)
    .sort((left, right) => left.lesson - right.lesson);
  assertKnown(lessonCatalog.length, KNOWN.lessons, "Grade 4 lesson catalog count");

  const sqlReport = loaded.sqlAggregate.value;
  invariant(sqlReport.schemaVersion === 1 &&
    sqlReport.reportType === "g4-privacy-safe-historical-sql-course-aggregate",
  "SQL aggregate report schema/type drifted");
  invariant(sqlReport.identity?.historicalCourseId === 5 && sqlReport.identity?.lessonCount === 12,
    "SQL aggregate Grade 4 identity drifted");
  invariant(Array.isArray(sqlReport.lessons) && sqlReport.lessons.length === 12,
    "SQL aggregate must contain exactly 12 lessons");
  const sqlByLesson = new Map(sqlReport.lessons.map((lesson) => [lesson.lessonNumber, lesson]));
  invariant(sqlByLesson.size === 12, "SQL aggregate lesson numbers are not unique");

  const sourceRoot = path.join(root, "source-assets", "flash", sourceCatalog.sourceDirectory);
  const parsedLessons = [];
  for (const catalogLesson of lessonCatalog) {
    const xmlRecord = sourceByPath.get(catalogLesson.path);
    invariant(xmlRecord && SHA256_PATTERN.test(xmlRecord.sha256),
      `Missing source-catalog lesson XML: ${catalogLesson.path}`);
    const xmlPath = path.join(sourceRoot, catalogLesson.path);
    const xmlInfo = await lstat(xmlPath);
    invariant(xmlInfo.isFile() && !xmlInfo.isSymbolicLink(), `Lesson XML is not a regular file: ${catalogLesson.path}`);
    const xmlBytes = await readFile(xmlPath);
    invariant(xmlBytes.length === xmlRecord.bytes && sha256(xmlBytes) === xmlRecord.sha256,
      `Lesson XML bytes drifted: ${catalogLesson.path}`);
    const parsed = parseGrade4CourseXml(xmlBytes.toString("utf8"), catalogLesson.path);
    invariant(parsed.lessonNumber === catalogLesson.lesson && parsed.pages.length === catalogLesson.pageReferenceCount,
      `Lesson XML/catalog page-count drift for lesson ${catalogLesson.lesson}`);
    invariant(parsed.sections.length === catalogLesson.sectionCount,
      `Lesson XML/catalog section-count drift for lesson ${catalogLesson.lesson}`);
    const pages = parsed.pages.map((page) => {
      const source = sourceByPath.get(page.expectedPath);
      invariant(source && path.posix.extname(source.path).toLowerCase() === ".swf",
        `Active Grade 4 page is absent from canonical source custody: ${page.expectedPath}`);
      return {...page, bytes: source.bytes, sha256: source.sha256};
    });
    const shellAnimation = loaded.animationsCatalog.value.animations.find(
      (animation) =>
        animation.classification?.grade === 4 &&
        animation.classification?.lesson === catalogLesson.lesson &&
        animation.flags?.shell === true,
    );
    invariant(shellAnimation, `Grade 4 lesson ${catalogLesson.lesson} shell is missing`);
    const shellSource = sourceByPath.get(shellAnimation.source.path);
    invariant(shellSource?.sha256 === shellAnimation.source.sha256,
      `Grade 4 lesson ${catalogLesson.lesson} shell identity drifted`);
    const sql = sqlByLesson.get(catalogLesson.lesson);
    invariant(sql, `SQL aggregate lacks Grade 4 lesson ${catalogLesson.lesson}`);
    parsedLessons.push({
      lessonNumber: catalogLesson.lesson,
      title: catalogLesson.titleDisplay,
      currentSequenceAuthority: {
        path: catalogLesson.path,
        bytes: xmlRecord.bytes,
        sha256: xmlRecord.sha256,
        authority: "active-course-xml-global-page-order",
      },
      historicalSqlAggregate: {
        historicalLessonId: sql.historicalLessonId,
        title: sql.title,
        url: sql.url,
        quizUrl: sql.quizUrl,
        isActive: sql.isActive,
        aggregates: sql.aggregates,
        sequenceAuthority: false,
      },
      keyTerms: parsed.keyTerms,
      sections: parsed.sections,
      pageCount: pages.length,
      quizWrapperCount: pages.filter(({sectionCode}) => sectionCode === "FQ").length,
      shell: {
        animationId: shellAnimation.animationId,
        path: shellSource.path,
        bytes: shellSource.bytes,
        sha256: shellSource.sha256,
      },
      pages,
    });
  }

  const pageCount = parsedLessons.reduce((sum, lesson) => sum + lesson.pages.length, 0);
  const sectionCount = parsedLessons.reduce((sum, lesson) => sum + lesson.sections.length, 0);
  const quizWrapperCount = parsedLessons.reduce((sum, lesson) => sum + lesson.quizWrapperCount, 0);
  const spanishFallbackCount = parsedLessons.flatMap(({pages}) => pages)
    .filter(({spanishTitleDisposition}) =>
      spanishTitleDisposition === "english-fallback-no-source-spanish-page-title").length;
  const sectionsWithSpanish = parsedLessons.flatMap(({sections}) => sections)
    .filter(({titleSpanish}) => Boolean(titleSpanish)).length;
  assertKnown(pageCount, KNOWN.pages, "Grade 4 active page count");
  assertKnown(sectionCount, KNOWN.sections, "Grade 4 section count");
  assertKnown(quizWrapperCount, KNOWN.quizWrappers, "Grade 4 quiz wrapper count");
  assertKnown(spanishFallbackCount, KNOWN.pageLabelsUsingEnglishFallbackForSpanish,
    "Grade 4 Spanish page-label fallback count");
  assertKnown(sectionsWithSpanish, KNOWN.sections, "Grade 4 sections with Spanish titles");

  const orderedPageDigest = sha256(Buffer.from(parsedLessons.flatMap((lesson) =>
    lesson.pages.map((page) =>
      `${lesson.lessonNumber}\t${page.globalPageOrdinal}\t${page.sectionCode}\t${page.sectionPageOrdinal}\t${page.expectedPath}\t${page.sha256}\n`),
  ).join("")));
  const shellDigest = recordSetDigest(parsedLessons.map(({shell}) => ({
    canonicalPath: shell.path,
    bytes: shell.bytes,
    sha256: shell.sha256,
  })));

  const priorPlan = loaded.priorActivePromotionPlan.value;
  const activeAnimationByPath = new Map();
  for (const animation of loaded.animationsCatalog.value.animations) {
    if (
      animation.classification?.grade !== 4 ||
      !(animation.references?.courseXml?.length > 0)
    ) continue;
    invariant(!activeAnimationByPath.has(animation.source.path),
      `Duplicate active Grade 4 animation placement: ${animation.source.path}`);
    activeAnimationByPath.set(animation.source.path, animation);
  }
  assertKnown(activeAnimationByPath.size, KNOWN.pages, "active Grade 4 animation count");
  const ordinaryBindings = [];
  for (const lesson of parsedLessons) {
    for (const page of lesson.pages) {
      const animation = activeAnimationByPath.get(page.expectedPath);
      invariant(animation, `Active animation catalog lacks ${page.expectedPath}`);
      for (const exactAudio of animation.audio?.exact ?? []) {
        invariant(
          exactAudio.association === "matching-basename" &&
          exactAudio.path === `${G4_PREFIX}L${lesson.lessonNumber}/SA/${path.posix.basename(page.expectedPath, ".swf")}.mp3`,
          `Unexpected ordinary audio association for ${page.expectedPath}`,
        );
        ordinaryBindings.push({
          canonicalPath: exactAudio.path,
          requiredBy: [page.expectedPath],
          bindingBasis: "canonical-animation-exact-matching-basename",
          requireHostRouteEligibility: false,
          bindingEvidence:
            "canonical animation catalog exact matching-basename association; host-route eligibility is recorded separately and runtime reachability plus spoken language remain unverified",
        });
      }
    }
  }
  for (const missing of priorPlan.missingDependencies.filter(
    ({audioBindingKind}) => audioBindingKind === "ordinary-spanish-page",
  )) {
    ordinaryBindings.push({
      canonicalPath: missing.canonicalPath,
      requiredBy: missing.requiredBy,
      bindingBasis: "reviewed-required-unresolved-host-route",
      requireHostRouteEligibility: true,
      bindingEvidence:
        "reviewed 2026-08-02 active-source plan required-unresolved ordinary SA binding plus pinned host route",
    });
  }
  const audioDerived = deriveWholeCourseAudioRequirements({
    lessons: parsedLessons,
    fqTargetEvidence: priorPlan.derivation.audio.finalQuiz.targetEvidence,
    ordinaryBindings,
  });
  assertKnown(audioDerived.ordinary.length, KNOWN.ordinaryAudioExpected, "ordinary audio expected");
  assertKnown(audioDerived.finalQuizUniqueQuestionLabelCount, KNOWN.finalQuizLabels,
    "final quiz unique question-label count");
  assertKnown(audioDerived.finalQuiz.length, KNOWN.finalQuizAudioExpected, "final quiz audio expected");
  assertKnown(audioDerived.all.length, KNOWN.audioExpected, "whole-course audio expected");
  const audioObligations = audioDerived.all.map((requirement) => {
    const source = sourceByPath.get(requirement.canonicalPath);
    return source
      ? {
          ...requirement,
          sourceStatus: "canonical-source-present",
          bytes: source.bytes,
          sha256: source.sha256,
          expectedSha256: source.sha256,
        }
      : {
          ...requirement,
          sourceStatus: "required-unresolved-source",
          bytes: null,
          sha256: null,
          expectedSha256: null,
          allowedSubstitutions: [],
          synthesizedAudioAuthorized: false,
          silenceAuthorized: false,
          nearNameOrBasenameMatchAuthorized: false,
        };
  });
  const ordinarySummary = summarizeAudio(audioObligations, "ordinary-spanish-page");
  const fqSummary = summarizeAudio(audioObligations, "final-quiz-question-answer");
  const missingAudio = audioObligations.filter(({sourceStatus}) => sourceStatus === "required-unresolved-source");
  assertKnown(ordinarySummary.present, KNOWN.ordinaryAudioPresent, "ordinary audio present");
  assertKnown(ordinarySummary.missing, KNOWN.ordinaryAudioMissing, "ordinary audio missing");
  assertKnown(fqSummary.present, KNOWN.finalQuizAudioPresent, "final quiz audio present");
  assertKnown(fqSummary.missing, KNOWN.finalQuizAudioMissing, "final quiz audio missing");
  assertKnown(missingAudio.length, KNOWN.audioMissing, "whole-course audio missing");
  invariant(pathSetDigest(missingAudio.map(({canonicalPath}) => canonicalPath)) === KNOWN.missingAudioPathSetSha256,
    "The 16 missing audio paths drifted");
  invariant(priorPlan.summary.missingDependencies.pathSetSha256 === KNOWN.missingAudioPathSetSha256,
    "Prior promotion-plan missing-audio digest drifted");

  const fqExpectedPaths = new Set(audioDerived.finalQuiz.map(({canonicalPath}) => canonicalPath));
  const fqCandidatePool = sourceCatalog.files.filter(({path: sourcePath}) =>
    /^HELP_COURSES\/ELMGR4\/L\d+\/FQ\/(?:EA|SA)\/[^/]+\.mp3$/u.test(sourcePath));
  const fqCandidatesExcluded = fqCandidatePool.filter(({path: sourcePath}) => !fqExpectedPaths.has(sourcePath));
  assertKnown(fqCandidatePool.length, KNOWN.fqAudioCandidatePool, "FQ audio candidate pool");
  assertKnown(fqCandidatesExcluded.length, KNOWN.fqAudioCandidatesExcluded,
    "FQ candidate-unbound exclusion count");

  const lessonDeclarations = parsedLessons.map(({lessonNumber, keyTerms}) => ({
    lessonNumber,
    ...keyTerms,
    englishCanonicalPresent: sourceByPath.has(keyTerms.english),
    spanishCanonicalPresent: sourceByPath.has(keyTerms.spanish),
    runtimeResolutionVerified: false,
  }));
  const keyTerms = reconcileKeyTerms({
    missingReferences: loaded.missingReferences.value,
    digIntakePlan: dig.value,
    englishData: loaded.gradeWideKeyTermsEnglish.value,
    spanishData: loaded.gradeWideKeyTermsSpanish.value,
    lessonDeclarations,
  });
  assertKnown(keyTerms.diagramObligations.occurrences, KNOWN.keyTermOccurrences,
    "Key Term occurrence count");
  assertKnown(keyTerms.diagramObligations.unique, KNOWN.keyTermUnique, "Key Term unique count");
  assertKnown(keyTerms.diagramObligations.canonicalResolved, KNOWN.keyTermResolved,
    "Key Term resolved count");
  assertKnown(keyTerms.diagramObligations.canonicalMissing, KNOWN.keyTermMissing,
    "Key Term missing count");
  assertKnown(keyTerms.diagramObligations.totalCandidateReviewHolds,
    KNOWN.keyTermCandidateReviewHolds, "Key Term candidate review-hold count");
  assertKnown(keyTerms.diagramObligations.caseVariantPlacementReviewCandidates,
    KNOWN.keyTermCaseVariantReviewCandidates, "Key Term case-variant review count");
  assertKnown(keyTerms.diagramObligations.exactPlacementShaReceiptReviewCandidates,
    KNOWN.keyTermExactPlacementReviewCandidates, "Key Term exact-placement review count");
  assertKnown(keyTerms.diagramObligations.stillUnresolvedAfterAllCandidateReviews,
    KNOWN.keyTermStillUnresolvedAfterCandidateReview, "Key Term residual missing count");
  assertKnown(keyTerms.gradeWideStaticCandidates.english.entryCount, KNOWN.keyTermEnglishEntries,
    "English Key Term entry count");
  assertKnown(keyTerms.gradeWideStaticCandidates.english.warningCount, KNOWN.keyTermEnglishWarnings,
    "English Key Term warning count");
  assertKnown(keyTerms.gradeWideStaticCandidates.spanish.entryCount, KNOWN.keyTermSpanishEntries,
    "Spanish Key Term entry count");
  assertKnown(keyTerms.gradeWideStaticCandidates.spanish.warningCount, KNOWN.keyTermSpanishWarnings,
    "Spanish Key Term warning count");

  const report = {
    schemaVersion: 1,
    artifactType: "g4-curriculum-runtime-dependency-alignment",
    planDate: "2026-08-04",
    status:
      "source-order-and-runtime-obligations-aligned-with-explicit-audio-and-keyterm-blockers",
    inputs: {
      ...Object.fromEntries(Object.entries(loaded).map(([key, value]) => [key, value.evidence])),
      digIntakePlan: dig.evidence,
    },
    evidenceOrder: {
      currentPageSequenceAuthority: "12 active canonical lesson index.xml files",
      historicalSqlRole: "2021 aggregate curriculum context only",
      quizAudioContract:
        "pinned host AVM1 route plus statically audited target SWF contiguous question labels",
      keyTermRole:
        "lesson declarations plus grade-wide XML candidate and exact/case-sensitive diagram custody",
      sourcePresenceDoesNotProveRuntimeOrAcceptance: true,
    },
    course: {
      grade: 4,
      lessonCount: KNOWN.lessons,
      sectionCount,
      activePageCount: pageCount,
      shellCount: KNOWN.shells,
      sourceMemberCount: pageCount + KNOWN.shells,
      sourceMemberCustodyComplete: true,
      orderedPageSet: {
        sha256: orderedPageDigest,
        algorithm:
          "sha256(concat lessonNumber<TAB>globalPageOrdinal<TAB>sectionCode<TAB>sectionPageOrdinal<TAB>expectedPath<TAB>swfSha256<LF> in lesson/XML order)",
      },
      shellRecordSet: {
        sha256: shellDigest,
        algorithm: "sha256(sorted canonicalPath<TAB>bytes<TAB>sha256<LF>)",
      },
      lessons: parsedLessons,
    },
    quiz: {
      activeWrapperCount: quizWrapperCount,
      wrappers: parsedLessons.flatMap(({lessonNumber, pages}) => pages
        .filter(({sectionCode}) => sectionCode === "FQ")
        .map(({globalPageOrdinal, sectionPageOrdinal, expectedPath, bytes, sha256: digest}) => ({
          lessonNumber,
          globalPageOrdinal,
          sectionPageOrdinal,
          expectedPath,
          bytes,
          sha256: digest,
        }))),
      externallyAudioBoundUniqueQuestionLabelCount: audioDerived.finalQuizUniqueQuestionLabelCount,
      targetSwfEvidence: priorPlan.derivation.audio.finalQuiz.targetEvidence,
      sqlAggregateIsDefinitionContextNotRuntimeContract: true,
    },
    localization: {
      sectionsWithEnglishAndSpanishTitles: sectionsWithSpanish,
      totalSections: sectionCount,
      pagesWithSourceSpanishSubpageTitle: pageCount - spanishFallbackCount,
      pagesUsingEnglishFallbackForSpanish: spanishFallbackCount,
      fallbackIsExplicitAndNotTranslationAcceptance: true,
      audioLanguages: ["en", "es"],
    },
    audio: {
      expected: audioObligations.length,
      present: audioObligations.length - missingAudio.length,
      missing: missingAudio.length,
      dependencyClosureComplete: false,
      ordinarySpanishPage: ordinarySummary,
      finalQuizEnglishSpanishQuestionAndOptions: fqSummary,
      allExpectedPathSetSha256: pathSetDigest(audioObligations.map(({canonicalPath}) => canonicalPath)),
      presentRecordSetSha256: recordSetDigest(
        audioObligations.filter(({sourceStatus}) => sourceStatus === "canonical-source-present"),
      ),
      missingPathSetSha256: pathSetDigest(missingAudio.map(({canonicalPath}) => canonicalPath)),
      missingDependencies: missingAudio,
      candidatePoolControl: {
        finalQuizCanonicalCandidateCount: fqCandidatePool.length,
        boundPresentCount: fqSummary.present,
        candidateUnboundExcludedCount: fqCandidatesExcluded.length,
        excludedRecordSetSha256: recordSetDigest(fqCandidatesExcluded.map((record) => ({
          canonicalPath: record.path,
          bytes: record.bytes,
          sha256: record.sha256,
        }))),
        exclusions: fqCandidatesExcluded.map(({path: canonicalPath, bytes, sha256: digest}) => ({
          canonicalPath,
          bytes,
          sha256: digest,
          disposition: "candidate-unbound-excluded",
        })),
      },
      obligations: audioObligations,
      resolutionPolicy: {
        exactSourceRecoveryRequired: true,
        expectedSha256ForMissing: null,
        textToSpeechAuthorized: false,
        silenceAuthorized: false,
        nearestNameAuthorized: false,
        releaseEffect: "fail-closed-until-exact-source-and-named-listening-review",
      },
    },
    keyTerms,
    successorPromotionAdmission: {
      placementUniverse:
        "only exact source/runtime obligations enumerated in this artifact after a reviewed placement decision",
      objectIdentityAuthority: "ledger SHA-256 plus bytes plus ledger-file SHA-256",
      filenameOrBasenameAdmissionAuthorized: false,
      caseInsensitiveAdmissionAuthorized: false,
      missingAudioExpectedSha256Invented: false,
      canonicalMutationAuthorizedByThisArtifact: false,
      bulkIntakePromotionAuthorized: false,
    },
    authorityBoundary: {
      sourceCustody: "657/657 current Grade 4 page-and-shell members",
      runtimeDependencyClosure: false,
      javascriptRendererCompletion: false,
      originalRuntimeFidelity: false,
      audioLanguageContentOrSynchronizationAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictCompletion: false,
      atomicWholeCourseIntegration: false,
      publication: false,
    },
  };

  assertKnown(report.course.sourceMemberCount, KNOWN.sourceMembers, "Grade 4 source member count");
  assertKnown(report.audio.present, KNOWN.audioPresent, "whole-course audio present");
  const bytes = Buffer.from(stableJson(report));
  if (mode !== "memory") await writeOrCheck(output, bytes, mode);
  return {
    report,
    output: {
      path: relativeProjectPath(root, output),
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
  };
}

export function parseArguments(argv) {
  const options = {mode: null};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--write" || value === "--check") {
      invariant(options.mode === null, "Choose exactly one of --write or --check");
      options.mode = value === "--write" ? "write" : "check";
    }
    else if (value === "--output") options.output = path.resolve(argv[++index] ?? "");
    else if (value === "--sql-aggregate") options.sqlAggregate = path.resolve(argv[++index] ?? "");
    else if (value === "--dig-plan") options.digPlan = path.resolve(argv[++index] ?? "");
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  invariant(options.help || options.mode, "Choose exactly one of --write or --check");
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(
      "Usage: node scripts/build-g4-curriculum-runtime-dependency-map.mjs (--write|--check) " +
      "[--sql-aggregate <path>] [--dig-plan <path>] [--output <path>]",
    );
    return;
  }
  const result = await buildG4CurriculumRuntimeDependencyMap(options);
  console.log(JSON.stringify({
    status: options.mode === "write" ? "written" : "checked",
    course: {
      lessons: result.report.course.lessonCount,
      pages: result.report.course.activePageCount,
      shells: result.report.course.shellCount,
      orderedPageSetSha256: result.report.course.orderedPageSet.sha256,
    },
    audio: {
      expected: result.report.audio.expected,
      present: result.report.audio.present,
      missing: result.report.audio.missing,
      missingPathSetSha256: result.report.audio.missingPathSetSha256,
    },
    keyTerms: {
      unique: result.report.keyTerms.diagramObligations.unique,
      resolved: result.report.keyTerms.diagramObligations.canonicalResolved,
      missing: result.report.keyTerms.diagramObligations.canonicalMissing,
      totalCandidateReviewHolds:
        result.report.keyTerms.diagramObligations.totalCandidateReviewHolds,
      caseVariantPlacementReviewCandidates:
        result.report.keyTerms.diagramObligations.caseVariantPlacementReviewCandidates,
      exactPlacementShaReceiptReviewCandidates:
        result.report.keyTerms.diagramObligations.exactPlacementShaReceiptReviewCandidates,
    },
    output: result.output,
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
