#!/usr/bin/env node

import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  animationModuleRegistration,
  hasAnimationModule,
} from "../packages/demos/src/animation-registry.ts";
import {wholeLessonCourseRegistrations} from
  "../apps/web/lib/whole-lesson-course-registry.ts";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const TASK_ID =
  "HELP-MATH-P1-1751-PAGE-ONLY-MIGRATION-CONTROL-LEDGER-20260823";
export const PREDECESSOR_HEAD =
  "60f356be9b34cabd3ca1aad15b6dd00babfc7e35";
export const BASE_PREDECESSOR =
  "93fb79aa16e68d32edb43b864a1c8972d59b219f";
export const INPUT_PLAN = Object.freeze({
  path: "/Volumes/WestWorld/HELP MATH 2.0-g4-l5-l10-l11-integration/reports/help-math-426-page-only-baseline-input-plan-2026-08-22.json",
  sha256: "6d181ad88f0c0cd0e6094a4fff2ac4056a883f442e402b3aa9c69ac8c94a4764",
});
export const INPUT_RECEIPT = Object.freeze({
  path: "/Volumes/WestWorld/HELP MATH 2.0-g4-l5-l10-l11-integration/artifacts/handoffs/help-math-p0-426-page-only-baseline-final-receipt-2026-08-23.json",
  sha256: "5c4c96d98f76977c8bb05438af6b2b7c22ceb8b96193b1d291166fac950bb028",
  bytes: 280_799,
  mode: "0444",
  flags: ["uchg"],
});

const LEDGER_SCHEMA_VERSION = 1;
const GENERATOR_VERSION = "1.0.0";
const DEFAULT_LEDGER_PATH = path.join(
  projectRoot,
  "catalog",
  "page-only-migration-control-ledger.json",
);
const DEFAULT_DASHBOARD_PATH = path.join(
  projectRoot,
  "reports",
  "page-only-migration-control-dashboard.md",
);

const EXPECTED = Object.freeze({
  lessonCount: 29,
  occurrenceCount: 1_751,
  gradeOccurrences: Object.freeze({"3": 546, "4": 645, "5": 560}),
  resolvedSourceOccurrences: 1_361,
  missingSourceOccurrences: 390,
  uniqueMissingExpectedPaths: 389,
  registeredOccurrences: 426,
  registeredUniqueRenderers: 425,
  registeredLessons: 8,
  remainingOccurrences: 1_325,
  courseShellCount: 0,
  candidateOnlyOccurrences: 5,
  candidateOnlyUniqueRenderers: 5,
  complexityClassified: 198,
  factoryPages: 47,
  advancedManualPages: 0,
  sharedRegisteredRendererId: "course-g05-l03-in-028",
});

const REGISTERED_LESSONS = Object.freeze([
  Object.freeze({grade: 3, lesson: 2, occurrences: 70}),
  Object.freeze({grade: 4, lesson: 3, occurrences: 39}),
  Object.freeze({grade: 4, lesson: 5, occurrences: 53}),
  Object.freeze({grade: 4, lesson: 10, occurrences: 46}),
  Object.freeze({grade: 4, lesson: 11, occurrences: 43}),
  Object.freeze({grade: 5, lesson: 3, occurrences: 65}),
  Object.freeze({grade: 5, lesson: 4, occurrences: 54}),
  Object.freeze({grade: 5, lesson: 5, occurrences: 56}),
]);

const CURRENT_WAVES = Object.freeze([
  Object.freeze({
    waveId: "W1",
    sourceReadiness: "source-ready",
    lessons: Object.freeze([
      Object.freeze({grade: 4, lesson: 9}),
      Object.freeze({grade: 4, lesson: 8}),
      Object.freeze({grade: 4, lesson: 7}),
      Object.freeze({grade: 4, lesson: 6}),
      Object.freeze({grade: 4, lesson: 4}),
      Object.freeze({grade: 4, lesson: 2}),
      Object.freeze({grade: 4, lesson: 12}),
      Object.freeze({grade: 4, lesson: 1}),
    ]),
  }),
  Object.freeze({
    waveId: "W2",
    sourceReadiness: "source-ready-behavior-complex",
    lessons: Object.freeze([
      Object.freeze({grade: 5, lesson: 2}),
      Object.freeze({grade: 5, lesson: 13}),
      Object.freeze({grade: 5, lesson: 6}),
    ]),
  }),
  Object.freeze({
    waveId: "W3",
    sourceReadiness: "requires-source-promotion",
    lessons: Object.freeze([
      Object.freeze({grade: 5, lesson: 1}),
      Object.freeze({grade: 5, lesson: 7}),
      Object.freeze({grade: 5, lesson: 8}),
    ]),
  }),
  Object.freeze({
    waveId: "W4",
    sourceReadiness: "requires-source-promotion",
    lessons: Object.freeze([
      Object.freeze({grade: 3, lesson: 6}),
      Object.freeze({grade: 3, lesson: 8}),
      Object.freeze({grade: 3, lesson: 5}),
      Object.freeze({grade: 3, lesson: 3}),
      Object.freeze({grade: 3, lesson: 4}),
      Object.freeze({grade: 3, lesson: 1}),
      Object.freeze({grade: 3, lesson: 9}),
    ]),
  }),
]);

const AUTHORITATIVE_INPUTS = Object.freeze([
  Object.freeze({
    path: "catalog/lessons.json",
    expectedSha256: "96602f48c3c2089ab90d63262645de267a58522dc2bae57ab3e87745f3547905",
    role: "29-lesson source-order denominator",
  }),
  Object.freeze({
    path: "catalog/animations.json",
    expectedSha256: "ab27270c1f6a6618bae5e52f6e48ebf3ef646b6232dd087c1c86f755a6a3ce10",
    role: "resolved canonical course-page source join",
  }),
  Object.freeze({
    path: "catalog/missing-references.json",
    expectedSha256: "80159400ba05e6b32ceb1b3a24e8dbe839ffcf049af08403adf5049296416136",
    role: "missing canonical course-page source join",
  }),
  Object.freeze({
    path: "catalog/completion-ledger.json",
    expectedSha256: "53baa34d74b22af1e6199f6413d4706ca84786c3fe1c2f31f6c194c80b30aa8b",
    role: "strict workspace diagnostics evidence only",
  }),
  Object.freeze({
    path: "catalog/lesson-release-ledger.json",
    expectedSha256: "62733b4c2f2932532bec8eae8a9a7a0213764942e03ff55abee31880cbfbcce5",
    role: "atomic release and publication evidence",
  }),
  Object.freeze({
    path: "catalog/lesson-releases.json",
    expectedSha256: "26db29732898997f7db2fdf659e3e9cc1692d41cc1c16227e1a8c198cf7b6129",
    role: "source-ordered lesson release declarations",
  }),
  Object.freeze({
    path: "catalog/page-only-current-js-product-releases.json",
    expectedSha256: "07a5148793fbfc84df85867d9209cea219d8752d294006ee6450f9020919f697",
    role: "page-only Current-JS product release declarations",
  }),
  Object.freeze({
    path: "apps/web/lib/whole-lesson-course-registry.ts",
    expectedSha256: "53063aec0fd72dd1c84bd25017d70695fded2b63fc4fbb7b686621b0da47ca1f",
    role: "formal runnable lesson registry",
  }),
  Object.freeze({
    path: "scripts/verify-current-js-426-page-only-baseline.mjs",
    expectedSha256: "cb477d5a0aa8660f765604eb52554e351733fbb7638233e40ee1e54166e77d27",
    role: "frozen 426 occurrence baseline verifier",
  }),
]);

const SUPPLEMENTAL_INPUTS = Object.freeze([
  Object.freeze({
    path: "catalog/source-freeze.json",
    expectedSha256: "93de47703ed3eb044eb005c223d70f4c576c84cbbb043c5c5c00fa975455fa9c",
    role: "physical source freeze summary",
  }),
  Object.freeze({
    path: "catalog/source-manifest.sha256",
    expectedSha256: "f4de727e98372ca550b9f87220305c8b4d5b226b26e06573ae4ca7c7d40b9549",
    role: "physical source manifest",
  }),
  Object.freeze({
    path: "packages/demos/src/registry.generated.ts",
    expectedSha256: "c29579a33fced3b75fffd372af890e264e465f349dce6496aeaead64d7d830c0",
    role: "runnable module registry",
  }),
  Object.freeze({
    path: "packages/demos/src/animation-registry.ts",
    expectedSha256: "a78fc4abab38110be2e92c69e685c7a6721a195e88127c5843385fea5d5b467b",
    role: "runnable module lookup",
  }),
  Object.freeze({
    path: "apps/web/lib/learning-lesson-availability.server.ts",
    expectedSha256: "c9cfdd8668915d69d8d092d2de1360109d55a319b3badeed947ea129e2e51f96",
    role: "modern My Lessons availability derivation",
  }),
  Object.freeze({
    path: "apps/web/config/current-js-candidate-assets.v1.json",
    expectedSha256: "b88760d0b561f16c46d35ab060e737520309363c7c62fc618cf6600bd730268c",
    role: "candidate asset stock and authority boundary",
  }),
  Object.freeze({
    path: "catalog/product-bridge-calibrations/g4-l5-page-only-current-js-53-v1.json",
    expectedSha256: "ad068bd7bc812c4ab4e62ce244a474726c46b2b797688608741133104a350dac",
    role: "G4 L5 complexity and implementation observations",
  }),
  Object.freeze({
    path: "catalog/product-bridge-calibrations/g4-l10-page-only-current-js-46-v1.json",
    expectedSha256: "9bf77a765065f7e4c04a7e01c925f1d3082520860d1fb0f9805d2f691d10e10f",
    role: "G4 L10 complexity and implementation observations",
  }),
  Object.freeze({
    path: "catalog/product-bridge-calibrations/g4-l11-page-only-current-js-43-v1.json",
    expectedSha256: "40727f3d2e490ef0caae7a0d9b1016356e10062010c7f16dd8579f8117712989",
    role: "G4 L11 complexity and implementation observations",
  }),
  Object.freeze({
    path: "catalog/product-bridge-calibrations/g5-l5-page-only-current-js-56-v1.json",
    expectedSha256: "7048801916b87acb395b12cce4cdf9773f98f2012f819be5ed57efb40686edf8",
    role: "G5 L5 complexity observations",
  }),
]);

const CALIBRATION_PATHS = Object.freeze(SUPPLEMENTAL_INPUTS
  .filter(({path: inputPath}) => inputPath.includes("product-bridge-calibrations"))
  .map(({path: inputPath}) => inputPath));

const ROW_KEYS = Object.freeze([
  "assetId",
  "audio",
  "blockers",
  "candidate",
  "catalogAnimationId",
  "catalogOccurrenceOrdinal",
  "complexity",
  "expectedSwfPath",
  "globalPageOrdinal",
  "grade",
  "humanReview",
  "implementationLane",
  "lesson",
  "lessonTitle",
  "myLessons",
  "originalRuntime",
  "ownerAcceptance",
  "pairedFla",
  "pageTitle",
  "placementId",
  "production",
  "provenance",
  "registeredCurrentJs",
  "release",
  "sectionCode",
  "sectionOrdinal",
  "sectionPageOrdinal",
  "sharedRendererGroup",
  "sourceCustody",
  "sourceOccurrence",
  "sourceXml",
  "strictCompletion",
  "swfSha256",
  "technicalFidelity",
  "uniqueRendererId",
]);

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const SOURCE_XML_KEYS = Object.freeze(["path", "sha256"]);
const STATE_GATE_KEYS = Object.freeze(["evidence", "satisfied", "state"]);
const SOURCE_CUSTODY_EVIDENCE_KEYS = Object.freeze([
  "canonicalSwfPath",
  "expectedSwfPath",
  "joinPath",
]);
const COMPLEXITY_EVIDENCE_KEYS = Object.freeze(["animationId", "path"]);
const IMPLEMENTATION_EVIDENCE_KEYS = Object.freeze([
  "observedLabel",
  "path",
]);
const CANDIDATE_EVIDENCE_KEYS = Object.freeze([
  "moduleKey",
  "moduleMaturity",
  "moduleRegistryPath",
  "moduleScope",
]);
const REGISTRATION_EVIDENCE_KEYS = Object.freeze([
  "descriptorId",
  "formalRegistryPath",
  "moduleKey",
  "moduleMaturity",
  "moduleScope",
  "placementId",
  "registeredAssetId",
  "registeredSwfSha256",
  "releaseDeclarationPaths",
  "releaseId",
]);
const MY_LESSONS_EVIDENCE_KEYS = Object.freeze([
  "descriptorId",
  "environmentBoundary",
  "formalRegistryPath",
  "hostPath",
]);
const STRICT_EVIDENCE_KEYS = Object.freeze([
  "boundary",
  "generatedMarker",
  "path",
  "strictEntry",
]);
const RELEASE_EVIDENCE_KEYS = Object.freeze([
  "declarationPaths",
  "releaseId",
  "releaseLedgerPath",
  "releaseLedgerStatus",
]);
const PROVENANCE_KEYS = Object.freeze([
  "baselineReceiptSha256",
  "generatorPath",
  "occurrenceJoinPath",
  "predecessorHead",
  "sourceOrderPath",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function lessonKey(grade, lesson) {
  return `${grade}:${lesson}`;
}

function occurrenceKey(grade, lesson, occurrence) {
  return `${grade}:${lesson}:${occurrence}`;
}

function placementId(grade, lesson, occurrence) {
  return `g${String(grade).padStart(2, "0")}-l${String(lesson).padStart(2, "0")}-placement-${String(occurrence).padStart(3, "0")}`;
}

function projectRelative(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

function normalizeSourceXmlPath(value) {
  return value
    .replace(/^source-assets\/flash\/HELP MATH_ORIGINAL FILES\//u, "")
    .replace(/^HELP MATH_ORIGINAL FILES\//u, "");
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort(compareText).map((key) => [
      key,
      canonicalize(value[key]),
    ]));
  }
  return value;
}

export function stableJson(value) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

function exactKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value),
    `${label} must be an object`);
  const actual = Object.keys(value).sort(compareText);
  const wanted = [...expected].sort(compareText);
  invariant(JSON.stringify(actual) === JSON.stringify(wanted),
    `${label} fields must be exactly: ${wanted.join(", ")}`);
}

function isSha256(value) {
  return typeof value === "string" && SHA256_PATTERN.test(value);
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(projectRoot, relativePath), "utf8"));
}

async function bindInputs() {
  const bindings = [];
  for (const input of [...AUTHORITATIVE_INPUTS, ...SUPPLEMENTAL_INPUTS]) {
    const absolutePath = path.join(projectRoot, input.path);
    const actualSha256 = await sha256File(absolutePath);
    invariant(actualSha256 === input.expectedSha256,
      `${input.path}: expected SHA-256 ${input.expectedSha256}, found ${actualSha256}`);
    bindings.push(Object.freeze({
      path: input.path,
      sha256: actualSha256,
      role: input.role,
      authority: AUTHORITATIVE_INPUTS.includes(input)
        ? "authoritative-current-input"
        : "supplemental-current-evidence",
    }));
  }
  return bindings;
}

function deriveAnimationIdFromMissingOccurrence(occurrence, expectedSwfPath) {
  const basename = path.posix.basename(expectedSwfPath);
  const suffix = basename.match(/(\d+)\.swf$/iu)?.[1];
  invariant(suffix, `${expectedSwfPath}: cannot derive page number`);
  return `course-g${String(occurrence.grade).padStart(2, "0")}-l${String(occurrence.lesson).padStart(2, "0")}-${occurrence.section.code.toLowerCase()}-${String(Number(suffix)).padStart(3, "0")}`;
}

function buildSourceOccurrences({lessonsDocument, animationsDocument,
  missingDocument}) {
  invariant(lessonsDocument.schemaVersion === 1,
    "catalog/lessons.json schemaVersion must be 1");
  invariant(Array.isArray(lessonsDocument.lessons),
    "catalog/lessons.json lessons must be an array");
  invariant(lessonsDocument.lessons.length === EXPECTED.lessonCount,
    `expected ${EXPECTED.lessonCount} Lessons`);

  const lessons = [...lessonsDocument.lessons].sort((left, right) =>
    left.grade - right.grade || left.lesson - right.lesson);
  const lessonByKey = new Map(lessons.map((lesson) => [
    lessonKey(lesson.grade, lesson.lesson),
    lesson,
  ]));
  invariant(lessonByKey.size === EXPECTED.lessonCount,
    "lesson grade/lesson identities must be unique");

  const rows = [];
  let resolvedSourceOccurrences = 0;
  for (const animation of animationsDocument.animations ?? []) {
    const courseReferences = animation.references?.courseXml ?? [];
    if (courseReferences.length === 0) continue;
    invariant(animation.classification?.collection === "course",
      `${animation.animationId}: active course reference must be classified course`);
    invariant(animation.flags?.shell === false,
      `${animation.animationId}: legacy course shell cannot enter occurrence rows`);
    for (const reference of courseReferences) {
      const {grade, lesson} = animation.classification;
      const lessonRecord = lessonByKey.get(lessonKey(grade, lesson));
      invariant(lessonRecord, `${animation.animationId}: unknown Lesson G${grade} L${lesson}`);
      invariant(reference.sourceXmlPath === lessonRecord.path,
        `${animation.animationId}: source XML path drift`);
      invariant(reference.expectedPath === animation.source.path,
        `${animation.animationId}: resolved expected/source path drift`);
      const section = lessonRecord.sections.find(
        ({code}) => code === animation.classification.section.code,
      );
      invariant(section, `${animation.animationId}: unknown section`);
      rows.push({
        grade,
        lesson,
        lessonRecord,
        sourceOccurrence: reference.occurrence,
        sectionCode: section.code,
        sectionOrdinal: section.number,
        sectionPageOrdinal: animation.classification.page.ordinal,
        pageTitle: animation.classification.titleDisplay
          ?? animation.classification.titleRaw
          ?? null,
        expectedSwfPath: reference.expectedPath,
        sourceState: "resolved-canonical",
        assetId: animation.assetId,
        swfSha256: animation.source.sha256,
        pairedFla: animation.pairedFla
          ? {
              path: animation.pairedFla.path,
              sha256: animation.pairedFla.sha256,
            }
          : null,
        catalogAnimationId: animation.animationId,
        sourceJoinPath: "catalog/animations.json",
      });
      resolvedSourceOccurrences += 1;
    }
  }

  let missingSourceOccurrences = 0;
  for (const missing of missingDocument.course ?? []) {
    invariant(missing.exists === false && missing.resolvedPath === null,
      `${missing.expectedPath}: missing-reference row must remain unresolved`);
    for (const occurrence of missing.occurrences ?? []) {
      const lessonRecord = lessonByKey.get(
        lessonKey(occurrence.grade, occurrence.lesson),
      );
      invariant(lessonRecord,
        `${missing.expectedPath}: unknown Lesson G${occurrence.grade} L${occurrence.lesson}`);
      invariant(occurrence.sourceXmlPath === lessonRecord.path,
        `${missing.expectedPath}: missing source XML path drift`);
      invariant(occurrence.expectedPath === missing.expectedPath,
        `${missing.expectedPath}: nested expected path drift`);
      const section = lessonRecord.sections.find(
        ({code}) => code === occurrence.section.code,
      );
      invariant(section && section.number === occurrence.section.number,
        `${missing.expectedPath}: missing section identity drift`);
      rows.push({
        grade: occurrence.grade,
        lesson: occurrence.lesson,
        lessonRecord,
        sourceOccurrence: occurrence.occurrence,
        sectionCode: occurrence.section.code,
        sectionOrdinal: occurrence.section.number,
        sectionPageOrdinal: occurrence.page.ordinal,
        pageTitle: occurrence.page.titleRaw ?? null,
        expectedSwfPath: missing.expectedPath,
        sourceState: "missing-canonical-source",
        assetId: null,
        swfSha256: null,
        pairedFla: null,
        catalogAnimationId: deriveAnimationIdFromMissingOccurrence(
          occurrence,
          missing.expectedPath,
        ),
        sourceJoinPath: "catalog/missing-references.json",
      });
      missingSourceOccurrences += 1;
    }
  }

  rows.sort((left, right) => left.grade - right.grade
    || left.lesson - right.lesson
    || left.sourceOccurrence - right.sourceOccurrence);
  invariant(rows.length === EXPECTED.occurrenceCount,
    `expected ${EXPECTED.occurrenceCount} occurrence rows, found ${rows.length}`);
  invariant(resolvedSourceOccurrences === EXPECTED.resolvedSourceOccurrences,
    `expected ${EXPECTED.resolvedSourceOccurrences} resolved source occurrences`);
  invariant(missingSourceOccurrences === EXPECTED.missingSourceOccurrences,
    `expected ${EXPECTED.missingSourceOccurrences} missing source occurrences`);
  invariant(resolvedSourceOccurrences + missingSourceOccurrences === rows.length,
    "resolved + missing source occurrences must equal the full denominator");
  invariant((missingDocument.course ?? []).length ===
    EXPECTED.uniqueMissingExpectedPaths,
  `expected ${EXPECTED.uniqueMissingExpectedPaths} unique missing expected paths`);

  const occurrenceKeys = new Set();
  const placementIds = new Set();
  rows.forEach((row, index) => {
    row.catalogOccurrenceOrdinal = index + 1;
    row.globalPageOrdinal = row.sourceOccurrence;
    row.placementId = placementId(row.grade, row.lesson, row.sourceOccurrence);
    const key = occurrenceKey(row.grade, row.lesson, row.sourceOccurrence);
    invariant(!occurrenceKeys.has(key), `${key}: duplicate occurrence identity`);
    invariant(!placementIds.has(row.placementId),
      `${row.placementId}: duplicate placement identity`);
    occurrenceKeys.add(key);
    placementIds.add(row.placementId);
  });

  for (const lessonRecord of lessons) {
    const lessonRows = rows.filter(({grade, lesson}) =>
      grade === lessonRecord.grade && lesson === lessonRecord.lesson);
    invariant(lessonRows.length === lessonRecord.pageReferenceCount,
      `G${lessonRecord.grade} L${lessonRecord.lesson}: occurrence count drift`);
    lessonRows.forEach((row, index) => invariant(
      row.sourceOccurrence === index + 1 && row.globalPageOrdinal === index + 1,
      `G${lessonRecord.grade} L${lessonRecord.lesson}: source order is not contiguous`,
    ));
    lessonRecord.sections.forEach((section, sectionIndex) => {
      invariant(section.number === sectionIndex + 1,
        `G${lessonRecord.grade} L${lessonRecord.lesson} ${section.code}: section order drift`);
      const sectionRows = lessonRows.filter(
        ({sectionCode}) => sectionCode === section.code,
      );
      invariant(sectionRows.length === section.pageReferenceCount,
        `G${lessonRecord.grade} L${lessonRecord.lesson} ${section.code}: section count drift`);
      sectionRows.forEach((row, index) => invariant(
        row.sectionOrdinal === section.number
          && row.sectionPageOrdinal === index + 1,
        `G${lessonRecord.grade} L${lessonRecord.lesson} ${section.code}: section page order drift`,
      ));
    });
  }

  const gradeCounts = Object.fromEntries([3, 4, 5].map((grade) => [
    String(grade),
    rows.filter((row) => row.grade === grade).length,
  ]));
  invariant(JSON.stringify(gradeCounts) ===
    JSON.stringify(EXPECTED.gradeOccurrences), "grade denominators drifted");

  const duplicatedExpectedPaths = [...new Set(rows
    .filter((row, index) => rows.findIndex((candidate) =>
      candidate.expectedSwfPath === row.expectedSwfPath) !== index)
    .map(({expectedSwfPath}) => expectedSwfPath))];
  invariant(duplicatedExpectedPaths.length === 1
    && duplicatedExpectedPaths[0] ===
      "HELP_COURSES/ELMGR5/L3/IN/L3IN28.swf",
  "expected exactly the two-placement G5 L3 IN028 source-path duplicate");

  return {
    lessons,
    lessonByKey,
    rows,
    resolvedSourceOccurrences,
    missingSourceOccurrences,
  };
}

function releaseMatchesDescriptor(release, descriptor) {
  return release.releaseId === descriptor.releaseId
    && release.grade === descriptor.course.grade
    && release.lesson === descriptor.course.lesson
    && release.scope?.pageOnly === true
    && release.scope?.legacyFlashCourseShellExcluded === true
    && release.scope?.modernMyLessonHostRetained === true
    && release.expectedCounts?.courseShells === 0
    && release.expectedCounts?.members === descriptor.pages.length
    && release.members?.length === descriptor.pages.length
    && release.members.every((member, index) => {
      const page = descriptor.pages[index];
      return page
        && member.ordinal === index + 1
        && member.releaseRole === "active-xml-referenced-page"
        && member.xmlOccurrence === index + 1
        && member.placementId === page.placementId
        && member.animationId === page.animationId
        && member.assetId === page.source.assetId;
    });
}

function releaseProjection(release) {
  return JSON.stringify({
    releaseId: release.releaseId,
    grade: release.grade,
    lesson: release.lesson,
    members: release.members.map(({ordinal, placementId, animationId,
      assetId, xmlOccurrence, source}) => ({
      ordinal,
      placementId,
      animationId,
      assetId,
      xmlOccurrence,
      source,
    })),
  });
}

function buildFormalRegistrationIndex({sourceRows, lessonByKey,
  lessonReleasesDocument, productReleasesDocument}) {
  const registrations = wholeLessonCourseRegistrations();
  invariant(registrations.length === EXPECTED.registeredLessons,
    `expected ${EXPECTED.registeredLessons} formal registered Lessons`);
  const actualRegisteredLessons = registrations.map(({descriptor}) => ({
    grade: descriptor.course.grade,
    lesson: descriptor.course.lesson,
    occurrences: descriptor.pages.length,
  }));
  invariant(JSON.stringify(actualRegisteredLessons) ===
    JSON.stringify(REGISTERED_LESSONS),
  "formal registered Lesson sequence/count drifted");

  const releaseSources = [
    ...lessonReleasesDocument.releases.map((release) => ({
      release,
      declarationPath: "catalog/lesson-releases.json",
    })),
    ...productReleasesDocument.releases.map((release) => ({
      release,
      declarationPath: "catalog/page-only-current-js-product-releases.json",
    })),
  ];
  const sourceByOccurrence = new Map(sourceRows.map((row) => [
    occurrenceKey(row.grade, row.lesson, row.sourceOccurrence),
    row,
  ]));
  const formalByOccurrence = new Map();

  for (const {descriptor} of registrations) {
    invariant(descriptor.schemaVersion === 2,
      `${descriptor.descriptorId}: schemaVersion must be 2`);
    invariant(descriptor.descriptorKind === "formal-page-only-course",
      `${descriptor.descriptorId}: descriptorKind must be formal-page-only-course`);
    invariant(descriptor.course.courseShellCount === 0,
      `${descriptor.descriptorId}: courseShellCount must be zero`);
    invariant(descriptor.course.expectedReleaseMemberCount ===
      descriptor.pages.length,
    `${descriptor.descriptorId}: page-only release count drift`);
    invariant(!Object.hasOwn(descriptor.course, "shellAnimationId")
      && !Object.hasOwn(descriptor, "shellImplementation"),
    `${descriptor.descriptorId}: legacy course shell entered formal descriptor`);
    const lessonRecord = lessonByKey.get(lessonKey(
      descriptor.course.grade,
      descriptor.course.lesson,
    ));
    invariant(lessonRecord, `${descriptor.descriptorId}: unknown source Lesson`);
    invariant(normalizeSourceXmlPath(descriptor.source.sourceXmlPath) ===
      lessonRecord.path, `${descriptor.descriptorId}: source XML path drift`);
    invariant(descriptor.source.sourceXmlSha256 === lessonRecord.sha256,
      `${descriptor.descriptorId}: source XML SHA-256 drift`);
    invariant(descriptor.source.sequenceAuthority === "course-xml-occurrence",
      `${descriptor.descriptorId}: source ordering authority drift`);

    const matchingReleases = releaseSources.filter(({release}) =>
      releaseMatchesDescriptor(release, descriptor));
    invariant(matchingReleases.length >= 1,
      `${descriptor.descriptorId}: exact source-ordered release membership missing`);
    invariant(new Set(matchingReleases.map(({release}) =>
      releaseProjection(release))).size === 1,
    `${descriptor.descriptorId}: duplicate release declarations disagree`);

    descriptor.pages.forEach((page, index) => {
      const expectedPlacementId = placementId(
        descriptor.course.grade,
        descriptor.course.lesson,
        index + 1,
      );
      invariant(page.globalPageOrdinal === index + 1
        && page.source.sourceOccurrence === index + 1,
      `${descriptor.descriptorId}: formal page source order drift`);
      invariant(page.placementId === expectedPlacementId,
        `${descriptor.descriptorId}: formal placementId drift at ${index + 1}`);
      invariant(page.rendererAvailability.kind === "registered"
        && page.rendererAvailability.moduleKey === page.animationId
        && hasAnimationModule(page.animationId),
      `${descriptor.descriptorId}: ${page.animationId} is not a runnable module`);
      const sourceRow = sourceByOccurrence.get(occurrenceKey(
        descriptor.course.grade,
        descriptor.course.lesson,
        index + 1,
      ));
      invariant(sourceRow, `${descriptor.descriptorId}: source occurrence missing`);
      invariant(sourceRow.sectionCode === page.sectionCode
        && sourceRow.sectionPageOrdinal === page.sectionPageOrdinal,
      `${descriptor.descriptorId}: section/source order drift at ${index + 1}`);
      const member = matchingReleases[0].release.members[index];
      invariant(member.source?.path === sourceRow.expectedSwfPath,
        `${descriptor.descriptorId}: release/source SWF path drift at ${index + 1}`);
      if (sourceRow.sourceState === "resolved-canonical") {
        invariant(member.assetId === sourceRow.assetId
          && member.source.sha256 === sourceRow.swfSha256,
        `${descriptor.descriptorId}: resolved canonical asset drift at ${index + 1}`);
      }
      const key = occurrenceKey(
        descriptor.course.grade,
        descriptor.course.lesson,
        index + 1,
      );
      invariant(!formalByOccurrence.has(key), `${key}: duplicate formal admission`);
      const moduleRegistration = animationModuleRegistration(page.animationId);
      invariant(moduleRegistration,
        `${page.animationId}: runnable module registration metadata missing`);
      formalByOccurrence.set(key, Object.freeze({
        animationId: page.animationId,
        placementId: page.placementId,
        assetId: page.source.assetId,
        registeredSwfSha256: member.source?.sha256 ?? null,
        descriptorId: descriptor.descriptorId,
        releaseId: descriptor.releaseId,
        releaseDeclarationPaths: [...new Set(matchingReleases.map(
          ({declarationPath}) => declarationPath,
        ))].sort(compareText),
        moduleScope: moduleRegistration.scope,
        moduleMaturity: moduleRegistration.maturity,
      }));
    });
  }

  invariant(formalByOccurrence.size === EXPECTED.registeredOccurrences,
    `expected ${EXPECTED.registeredOccurrences} registered occurrences`);
  const rendererIds = [...formalByOccurrence.values()].map(
    ({animationId}) => animationId,
  );
  invariant(new Set(rendererIds).size === EXPECTED.registeredUniqueRenderers,
    `expected ${EXPECTED.registeredUniqueRenderers} unique registered renderers`);
  const duplicates = [...new Set(rendererIds.filter((animationId, index) =>
    rendererIds.indexOf(animationId) !== index))];
  invariant(duplicates.length === 1
    && duplicates[0] === EXPECTED.sharedRegisteredRendererId,
  `expected exactly shared renderer ${EXPECTED.sharedRegisteredRendererId}`);
  return formalByOccurrence;
}

function buildCalibrationIndex(calibrations) {
  const byAnimationId = new Map();
  for (const calibration of calibrations) {
    invariant(Array.isArray(calibration.document.selectedPages),
      `${calibration.path}: selectedPages must be an array`);
    for (const page of calibration.document.selectedPages) {
      invariant(typeof page.animationId === "string",
        `${calibration.path}: selected page animationId missing`);
      invariant(!byAnimationId.has(page.animationId),
        `${page.animationId}: duplicate complexity calibration`);
      invariant(["low", "behavior-heavy", "interactive-understood"]
        .includes(page.complexityLane),
      `${page.animationId}: unknown complexity lane`);
      const observedImplementationLabel = page.implementation?.kind
        ?? page.selectionStatus
        ?? null;
      let implementationLane = "unclassified";
      if (observedImplementationLabel ===
        "hash-bound-ffdec-source-static-current-js") {
        implementationLane = "factory";
      } else if (observedImplementationLabel === "advanced-manual") {
        implementationLane = "advanced-manual";
      }
      byAnimationId.set(page.animationId, Object.freeze({
        path: calibration.path,
        complexityLane: page.complexityLane,
        implementationLane,
        observedImplementationLabel,
      }));
    }
  }
  invariant(byAnimationId.size === EXPECTED.complexityClassified,
    `expected ${EXPECTED.complexityClassified} complexity-classified pages`);
  invariant([...byAnimationId.values()].filter(
    ({implementationLane}) => implementationLane === "factory").length ===
      EXPECTED.factoryPages,
  `expected ${EXPECTED.factoryPages} exact factory pages`);
  invariant([...byAnimationId.values()].filter(
    ({implementationLane}) => implementationLane === "advanced-manual").length ===
      EXPECTED.advancedManualPages,
  `expected ${EXPECTED.advancedManualPages} exact advanced-manual pages`);
  return byAnimationId;
}

function falseGate(evidence) {
  return {
    state: "not-established",
    satisfied: false,
    evidence,
  };
}

function sortedCount(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) =>
    compareText(left, right)));
}

function waveIndex() {
  const index = new Map();
  CURRENT_WAVES.forEach((wave, waveIndexValue) => {
    wave.lessons.forEach((lesson, lessonIndex) => {
      index.set(lessonKey(lesson.grade, lesson.lesson), {
        waveId: wave.waveId,
        waveOrder: waveIndexValue + 1,
        lessonOrder: lessonIndex + 1,
        sourceReadiness: wave.sourceReadiness,
      });
    });
  });
  return index;
}

function buildRows({sourceRows, formalByOccurrence, calibrationByAnimationId,
  completionLedger, releaseLedger}) {
  const releaseLedgerById = new Map((releaseLedger.releases ?? []).map(
    (release) => [release.releaseId, release],
  ));
  const rows = sourceRows.map((sourceRow) => {
    const formal = formalByOccurrence.get(occurrenceKey(
      sourceRow.grade,
      sourceRow.lesson,
      sourceRow.sourceOccurrence,
    ));
    const rendererId = formal?.animationId ?? sourceRow.catalogAnimationId;
    const moduleExists = hasAnimationModule(rendererId);
    const moduleRegistration = moduleExists
      ? animationModuleRegistration(rendererId)
      : undefined;
    const candidateOnly = !formal && moduleExists;
    const calibration = calibrationByAnimationId.get(rendererId);
    const releaseLedgerEntry = formal
      ? releaseLedgerById.get(formal.releaseId)
      : undefined;
    if (releaseLedgerEntry) {
      invariant(releaseLedgerEntry.published === false
        && releaseLedgerEntry.strictCompleteCount === 0,
      `${formal.releaseId}: release/strict evidence unexpectedly open`);
    }

    const registeredCurrentJs = formal
      ? {
          state: "registered-current-js",
          satisfied: true,
          evidence: {
            formalRegistryPath: "apps/web/lib/whole-lesson-course-registry.ts",
            descriptorId: formal.descriptorId,
            releaseId: formal.releaseId,
            releaseDeclarationPaths: formal.releaseDeclarationPaths,
            placementId: formal.placementId,
            moduleKey: formal.animationId,
            moduleScope: formal.moduleScope,
            moduleMaturity: formal.moduleMaturity,
            registeredAssetId: formal.assetId,
            registeredSwfSha256: formal.registeredSwfSha256,
          },
        }
      : {
          state: "not-registered",
          satisfied: false,
          evidence: {
            formalRegistryPath: "apps/web/lib/whole-lesson-course-registry.ts",
            descriptorId: null,
            releaseId: null,
            releaseDeclarationPaths: [],
            placementId: sourceRow.placementId,
            moduleKey: null,
            moduleScope: null,
            moduleMaturity: null,
            registeredAssetId: null,
            registeredSwfSha256: null,
          },
        };

    const candidate = formal
      ? {
          state: "superseded-by-formal-registration",
          candidateOnly: false,
          evidence: {
            moduleKey: rendererId,
            moduleRegistryPath: "packages/demos/src/registry.generated.ts",
            moduleScope: moduleRegistration?.scope ?? null,
            moduleMaturity: moduleRegistration?.maturity ?? null,
          },
        }
      : candidateOnly
        ? {
            state: "runnable-unregistered-candidate",
            candidateOnly: true,
            evidence: {
              moduleKey: rendererId,
              moduleRegistryPath: "packages/demos/src/registry.generated.ts",
              moduleScope: moduleRegistration?.scope ?? null,
              moduleMaturity: moduleRegistration?.maturity ?? null,
            },
          }
        : {
            state: "not-established",
            candidateOnly: false,
            evidence: {
              moduleKey: null,
              moduleRegistryPath: "packages/demos/src/registry.generated.ts",
              moduleScope: null,
              moduleMaturity: null,
            },
          };

    const sourceCustody = sourceRow.sourceState === "resolved-canonical"
      ? {
          state: "resolved-canonical",
          satisfied: true,
          evidence: {
            joinPath: sourceRow.sourceJoinPath,
            expectedSwfPath: sourceRow.expectedSwfPath,
            canonicalSwfPath: sourceRow.expectedSwfPath,
          },
        }
      : {
          state: "missing-canonical-source",
          satisfied: false,
          evidence: {
            joinPath: sourceRow.sourceJoinPath,
            expectedSwfPath: sourceRow.expectedSwfPath,
            canonicalSwfPath: null,
          },
        };

    const complexity = calibration
      ? {
          state: calibration.complexityLane,
          classified: true,
          evidence: {
            path: calibration.path,
            animationId: rendererId,
          },
        }
      : {
          state: "unclassified",
          classified: false,
          evidence: {
            path: null,
            animationId: rendererId,
          },
        };

    const implementationLane = calibration?.implementationLane === "factory"
      || calibration?.implementationLane === "advanced-manual"
      ? {
          state: calibration.implementationLane,
          classified: true,
          evidence: {
            path: calibration.path,
            observedLabel: calibration.observedImplementationLabel,
          },
        }
      : {
          state: "unclassified",
          classified: false,
          evidence: {
            path: calibration?.path ?? null,
            observedLabel: calibration?.observedImplementationLabel ?? null,
          },
        };

    const myLessons = formal
      ? {
          state: "current-code-admitted",
          satisfied: true,
          evidence: {
            hostPath: "apps/web/lib/learning-lesson-availability.server.ts",
            formalRegistryPath: "apps/web/lib/whole-lesson-course-registry.ts",
            descriptorId: formal.descriptorId,
            environmentBoundary: "current-code-not-production-verification",
          },
        }
      : {
          state: "not-admitted",
          satisfied: false,
          evidence: {
            hostPath: "apps/web/lib/learning-lesson-availability.server.ts",
            formalRegistryPath: "apps/web/lib/whole-lesson-course-registry.ts",
            descriptorId: null,
            environmentBoundary: "current-code-not-production-verification",
          },
        };

    const strictCompletion = {
      state: "not-established",
      satisfied: false,
      evidence: {
        path: "catalog/completion-ledger.json",
        generatedMarker: completionLedger.generatedMarker,
        strictEntry: null,
        boundary: "diagnostics-ledger-not-occurrence-denominator",
      },
    };
    const release = formal
      ? {
          state: "declared-unpublished",
          satisfied: false,
          evidence: {
            releaseId: formal.releaseId,
            declarationPaths: formal.releaseDeclarationPaths,
            releaseLedgerPath: "catalog/lesson-release-ledger.json",
            releaseLedgerStatus: releaseLedgerEntry?.status
              ?? "no-release-ledger-admission",
          },
        }
      : {
          state: "not-declared",
          satisfied: false,
          evidence: {
            releaseId: null,
            declarationPaths: [],
            releaseLedgerPath: "catalog/lesson-release-ledger.json",
            releaseLedgerStatus: "not-declared",
          },
        };

    const originalRuntime = falseGate(
      "No exact original-runtime execution receipt is admitted by the P0 baseline.",
    );
    const technicalFidelity = falseGate(
      "Current-JS/source presence does not establish original-runtime technical fidelity.",
    );
    const audio = falseGate(
      "Catalog audio presence does not establish cue correctness or human listening acceptance.",
    );
    const humanReview = falseGate(
      "No exact hash-bound human visual review is admitted by the P0 baseline.",
    );
    const ownerAcceptance = falseGate(
      "No exact Owner product acceptance is admitted by the P0 baseline.",
    );
    const production = {
      state: "not-verified",
      satisfied: false,
      evidence: "No Preview/Staging/Production deployment or production verification is authorized or evidenced.",
    };

    const blockers = [];
    if (!sourceCustody.satisfied) blockers.push("missing-canonical-source");
    if (candidateOnly) blockers.push("candidate-not-formally-registered");
    else if (!formal) blockers.push("current-js-not-registered");
    if (!complexity.classified) blockers.push("complexity-unclassified");
    if (!implementationLane.classified) {
      blockers.push("implementation-lane-unclassified");
    }
    blockers.push(
      "original-runtime-not-established",
      "technical-fidelity-not-established",
      "audio-not-established",
      "human-review-not-established",
      "owner-acceptance-not-established",
      "strict-completion-not-established",
      "release-not-established",
      "production-not-verified",
    );

    return {
      placementId: sourceRow.placementId,
      catalogOccurrenceOrdinal: sourceRow.catalogOccurrenceOrdinal,
      grade: sourceRow.grade,
      lesson: sourceRow.lesson,
      lessonTitle: sourceRow.lessonRecord.titleDisplay,
      globalPageOrdinal: sourceRow.globalPageOrdinal,
      sectionCode: sourceRow.sectionCode,
      sectionOrdinal: sourceRow.sectionOrdinal,
      sectionPageOrdinal: sourceRow.sectionPageOrdinal,
      pageTitle: sourceRow.pageTitle,
      sourceXml: {
        path: sourceRow.lessonRecord.path,
        sha256: sourceRow.lessonRecord.sha256,
      },
      sourceOccurrence: sourceRow.sourceOccurrence,
      expectedSwfPath: sourceRow.expectedSwfPath,
      sourceCustody,
      assetId: sourceRow.assetId,
      swfSha256: sourceRow.swfSha256,
      pairedFla: sourceRow.pairedFla,
      catalogAnimationId: sourceRow.catalogAnimationId,
      uniqueRendererId: moduleExists ? rendererId : null,
      sharedRendererGroup: formal?.animationId ===
        EXPECTED.sharedRegisteredRendererId
        ? EXPECTED.sharedRegisteredRendererId
        : null,
      complexity,
      implementationLane,
      candidate,
      registeredCurrentJs,
      myLessons,
      originalRuntime,
      technicalFidelity,
      audio,
      humanReview,
      ownerAcceptance,
      strictCompletion,
      release,
      production,
      blockers,
      provenance: {
        generatorPath: "scripts/build-page-only-migration-control-ledger.mjs",
        sourceOrderPath: "catalog/lessons.json",
        occurrenceJoinPath: sourceRow.sourceJoinPath,
        predecessorHead: PREDECESSOR_HEAD,
        baselineReceiptSha256: INPUT_RECEIPT.sha256,
      },
    };
  });
  return rows;
}

function lessonSummaries(rows, lessons) {
  const waves = waveIndex();
  return lessons.map((lesson) => {
    const lessonRows = rows.filter((row) => row.grade === lesson.grade
      && row.lesson === lesson.lesson);
    const wave = waves.get(lessonKey(lesson.grade, lesson.lesson)) ?? null;
    return {
      grade: lesson.grade,
      lesson: lesson.lesson,
      title: lesson.titleDisplay,
      sourceXmlPath: lesson.path,
      occurrences: lessonRows.length,
      sourceResolved: lessonRows.filter(
        ({sourceCustody}) => sourceCustody.satisfied).length,
      sourceMissing: lessonRows.filter(
        ({sourceCustody}) => !sourceCustody.satisfied).length,
      candidateOnly: lessonRows.filter(
        ({candidate}) => candidate.candidateOnly).length,
      registeredCurrentJs: lessonRows.filter(
        ({registeredCurrentJs}) => registeredCurrentJs.satisfied).length,
      registeredUniqueRenderers: new Set(lessonRows
        .filter(({registeredCurrentJs}) => registeredCurrentJs.satisfied)
        .map(({uniqueRendererId}) => uniqueRendererId)).size,
      remaining: lessonRows.filter(
        ({registeredCurrentJs}) => !registeredCurrentJs.satisfied).length,
      myLessons: lessonRows.filter(({myLessons}) => myLessons.satisfied).length,
      strictComplete: lessonRows.filter(
        ({strictCompletion}) => strictCompletion.satisfied).length,
      released: lessonRows.filter(({release}) => release.satisfied).length,
      productionVerified: lessonRows.filter(
        ({production}) => production.satisfied).length,
      wave,
    };
  });
}

function gradeSummaries(rows) {
  return [3, 4, 5].map((grade) => {
    const gradeRows = rows.filter((row) => row.grade === grade);
    return {
      grade,
      lessons: new Set(gradeRows.map(({lesson}) => lesson)).size,
      occurrences: gradeRows.length,
      sourceResolved: gradeRows.filter(
        ({sourceCustody}) => sourceCustody.satisfied).length,
      sourceMissing: gradeRows.filter(
        ({sourceCustody}) => !sourceCustody.satisfied).length,
      candidateOnly: gradeRows.filter(
        ({candidate}) => candidate.candidateOnly).length,
      registeredCurrentJs: gradeRows.filter(
        ({registeredCurrentJs}) => registeredCurrentJs.satisfied).length,
      registeredUniqueRenderers: new Set(gradeRows
        .filter(({registeredCurrentJs}) => registeredCurrentJs.satisfied)
        .map(({uniqueRendererId}) => uniqueRendererId)).size,
      remaining: gradeRows.filter(
        ({registeredCurrentJs}) => !registeredCurrentJs.satisfied).length,
      strictComplete: gradeRows.filter(
        ({strictCompletion}) => strictCompletion.satisfied).length,
    };
  });
}

function buildWaveSummary(lessonByKey) {
  return CURRENT_WAVES.map((wave) => ({
    waveId: wave.waveId,
    sourceReadiness: wave.sourceReadiness,
    lessons: wave.lessons.map(({grade, lesson}, index) => {
      const sourceLesson = lessonByKey.get(lessonKey(grade, lesson));
      invariant(sourceLesson, `${wave.waveId}: unknown G${grade} L${lesson}`);
      return {
        order: index + 1,
        grade,
        lesson,
        title: sourceLesson.titleDisplay,
        occurrences: sourceLesson.pageReferenceCount,
      };
    }),
  }));
}

function validateRowSchema(row, index) {
  const label = `rows[${index}]`;
  exactKeys(row, ROW_KEYS, label);
  invariant(Number.isInteger(row.catalogOccurrenceOrdinal)
    && Number.isInteger(row.grade)
    && [3, 4, 5].includes(row.grade)
    && Number.isInteger(row.lesson)
    && row.lesson > 0
    && Number.isInteger(row.globalPageOrdinal)
    && row.globalPageOrdinal > 0
    && Number.isInteger(row.sourceOccurrence)
    && row.sourceOccurrence > 0
    && Number.isInteger(row.sectionOrdinal)
    && row.sectionOrdinal > 0
    && Number.isInteger(row.sectionPageOrdinal)
    && row.sectionPageOrdinal > 0,
  `${label}: occurrence ordinals must be positive integers in Grades 3-5`);
  invariant(typeof row.placementId === "string"
    && typeof row.lessonTitle === "string"
    && row.lessonTitle.length > 0
    && typeof row.sectionCode === "string"
    && row.sectionCode.length > 0
    && (row.pageTitle === null || typeof row.pageTitle === "string")
    && typeof row.expectedSwfPath === "string"
    && /\.swf$/iu.test(row.expectedSwfPath)
    && typeof row.catalogAnimationId === "string"
    && row.catalogAnimationId.length > 0,
  `${label}: placement, Lesson, section, page, or SWF identity is invalid`);

  exactKeys(row.sourceXml, SOURCE_XML_KEYS, `${label}.sourceXml`);
  invariant(typeof row.sourceXml.path === "string"
    && row.sourceXml.path.length > 0
    && isSha256(row.sourceXml.sha256),
  `${label}: source XML path/SHA-256 is invalid`);

  exactKeys(row.sourceCustody, STATE_GATE_KEYS,
    `${label}.sourceCustody`);
  exactKeys(row.sourceCustody.evidence, SOURCE_CUSTODY_EVIDENCE_KEYS,
    `${label}.sourceCustody.evidence`);
  invariant(["resolved-canonical", "missing-canonical-source"].includes(
    row.sourceCustody.state,
  ) && row.sourceCustody.satisfied ===
    (row.sourceCustody.state === "resolved-canonical")
    && row.sourceCustody.evidence.expectedSwfPath === row.expectedSwfPath,
  `${label}: source custody state/evidence is invalid`);
  if (row.sourceCustody.satisfied) {
    invariant(row.sourceCustody.evidence.joinPath ===
      "catalog/animations.json"
      && row.sourceCustody.evidence.canonicalSwfPath === row.expectedSwfPath
      && isSha256(row.swfSha256)
      && row.assetId === `swf-${row.swfSha256}`,
    `${label}: resolved source custody lacks exact canonical asset evidence`);
  } else {
    invariant(row.sourceCustody.evidence.joinPath ===
      "catalog/missing-references.json"
      && row.sourceCustody.evidence.canonicalSwfPath === null
      && row.assetId === null
      && row.swfSha256 === null
      && row.pairedFla === null,
    `${label}: missing source custody contains inferred canonical evidence`);
  }
  if (row.pairedFla !== null) {
    exactKeys(row.pairedFla, ["path", "sha256"], `${label}.pairedFla`);
    invariant(typeof row.pairedFla.path === "string"
      && /\.fla$/iu.test(row.pairedFla.path)
      && isSha256(row.pairedFla.sha256),
    `${label}: paired FLA path/SHA-256 is invalid`);
  }

  exactKeys(row.complexity, ["classified", "evidence", "state"],
    `${label}.complexity`);
  exactKeys(row.complexity.evidence, COMPLEXITY_EVIDENCE_KEYS,
    `${label}.complexity.evidence`);
  invariant(["behavior-heavy", "interactive-understood", "low",
    "unclassified"].includes(row.complexity.state)
    && row.complexity.classified ===
      (row.complexity.state !== "unclassified")
    && row.complexity.evidence.animationId ===
      (row.uniqueRendererId ?? row.catalogAnimationId)
    && (row.complexity.evidence.path === null
      || typeof row.complexity.evidence.path === "string"),
  `${label}: complexity state/evidence is invalid`);

  exactKeys(row.implementationLane,
    ["classified", "evidence", "state"], `${label}.implementationLane`);
  exactKeys(row.implementationLane.evidence, IMPLEMENTATION_EVIDENCE_KEYS,
    `${label}.implementationLane.evidence`);
  invariant(["factory", "advanced-manual", "unclassified"].includes(
    row.implementationLane.state,
  ) && row.implementationLane.classified ===
    (row.implementationLane.state !== "unclassified")
    && (row.implementationLane.evidence.path === null
      || typeof row.implementationLane.evidence.path === "string")
    && (row.implementationLane.evidence.observedLabel === null
      || typeof row.implementationLane.evidence.observedLabel === "string"),
  `${label}: implementation lane/evidence is invalid`);

  exactKeys(row.candidate, ["candidateOnly", "evidence", "state"],
    `${label}.candidate`);
  exactKeys(row.candidate.evidence, CANDIDATE_EVIDENCE_KEYS,
    `${label}.candidate.evidence`);
  invariant(["not-established", "runnable-unregistered-candidate",
    "superseded-by-formal-registration"].includes(row.candidate.state)
    && row.candidate.candidateOnly ===
      (row.candidate.state === "runnable-unregistered-candidate")
    && row.candidate.evidence.moduleRegistryPath ===
      "packages/demos/src/registry.generated.ts",
  `${label}: candidate state/evidence is invalid`);
  if (row.candidate.state === "not-established") {
    invariant(row.candidate.evidence.moduleKey === null
      && row.candidate.evidence.moduleScope === null
      && row.candidate.evidence.moduleMaturity === null,
    `${label}: absent candidate contains inferred module evidence`);
  } else {
    invariant(typeof row.candidate.evidence.moduleKey === "string"
      && row.candidate.evidence.moduleKey === row.uniqueRendererId
      && typeof row.candidate.evidence.moduleScope === "string"
      && typeof row.candidate.evidence.moduleMaturity === "string",
    `${label}: runnable candidate/formal module evidence is incomplete`);
  }

  exactKeys(row.registeredCurrentJs, STATE_GATE_KEYS,
    `${label}.registeredCurrentJs`);
  exactKeys(row.registeredCurrentJs.evidence, REGISTRATION_EVIDENCE_KEYS,
    `${label}.registeredCurrentJs.evidence`);
  invariant(["not-registered", "registered-current-js"].includes(
    row.registeredCurrentJs.state,
  ) && row.registeredCurrentJs.satisfied ===
    (row.registeredCurrentJs.state === "registered-current-js")
    && row.registeredCurrentJs.evidence.formalRegistryPath ===
      "apps/web/lib/whole-lesson-course-registry.ts"
    && row.registeredCurrentJs.evidence.placementId === row.placementId
    && Array.isArray(
      row.registeredCurrentJs.evidence.releaseDeclarationPaths,
    ), `${label}: registered Current-JS state/evidence is invalid`);
  if (!row.registeredCurrentJs.satisfied) {
    invariant(row.registeredCurrentJs.evidence.descriptorId === null
      && row.registeredCurrentJs.evidence.releaseId === null
      && row.registeredCurrentJs.evidence.releaseDeclarationPaths.length === 0
      && row.registeredCurrentJs.evidence.moduleKey === null
      && row.registeredCurrentJs.evidence.moduleScope === null
      && row.registeredCurrentJs.evidence.moduleMaturity === null
      && row.registeredCurrentJs.evidence.registeredAssetId === null
      && row.registeredCurrentJs.evidence.registeredSwfSha256 === null,
    `${label}: unregistered row contains inferred formal evidence`);
  } else {
    invariant(typeof row.registeredCurrentJs.evidence.registeredAssetId ===
      "string"
      && /^swf-[a-f0-9]{64}$/u.test(
        row.registeredCurrentJs.evidence.registeredAssetId,
      )
      && isSha256(
        row.registeredCurrentJs.evidence.registeredSwfSha256,
      ), `${label}: registered asset identity is invalid`);
  }

  exactKeys(row.myLessons, STATE_GATE_KEYS, `${label}.myLessons`);
  exactKeys(row.myLessons.evidence, MY_LESSONS_EVIDENCE_KEYS,
    `${label}.myLessons.evidence`);
  invariant(["not-admitted", "current-code-admitted"].includes(
    row.myLessons.state,
  ) && row.myLessons.satisfied ===
    (row.myLessons.state === "current-code-admitted")
    && row.myLessons.evidence.environmentBoundary ===
      "current-code-not-production-verification",
  `${label}: My Lessons state/evidence is invalid`);

  for (const [gateName, gate] of Object.entries({
    originalRuntime: row.originalRuntime,
    technicalFidelity: row.technicalFidelity,
    audio: row.audio,
    humanReview: row.humanReview,
    ownerAcceptance: row.ownerAcceptance,
  })) {
    exactKeys(gate, STATE_GATE_KEYS, `${label}.${gateName}`);
    invariant(gate.state === "not-established"
      && gate.satisfied === false
      && typeof gate.evidence === "string"
      && gate.evidence.length > 0,
    `${label}: ${gateName} gate is invalid or inferred`);
  }

  exactKeys(row.strictCompletion, STATE_GATE_KEYS,
    `${label}.strictCompletion`);
  exactKeys(row.strictCompletion.evidence, STRICT_EVIDENCE_KEYS,
    `${label}.strictCompletion.evidence`);
  invariant(row.strictCompletion.state === "not-established"
    && row.strictCompletion.satisfied === false
    && row.strictCompletion.evidence.path ===
      "catalog/completion-ledger.json"
    && row.strictCompletion.evidence.strictEntry === null
    && row.strictCompletion.evidence.boundary ===
      "diagnostics-ledger-not-occurrence-denominator",
  `${label}: strict-completion evidence was inflated or repurposed`);

  exactKeys(row.release, STATE_GATE_KEYS, `${label}.release`);
  exactKeys(row.release.evidence, RELEASE_EVIDENCE_KEYS,
    `${label}.release.evidence`);
  invariant(["not-declared", "declared-unpublished"].includes(
    row.release.state,
  ) && row.release.satisfied === false
    && Array.isArray(row.release.evidence.declarationPaths)
    && row.release.evidence.releaseLedgerPath ===
      "catalog/lesson-release-ledger.json",
  `${label}: release state/evidence is invalid or inferred`);
  invariant(row.release.state === "declared-unpublished"
    ? typeof row.release.evidence.releaseId === "string"
      && row.release.evidence.declarationPaths.length >= 1
    : row.release.evidence.releaseId === null
      && row.release.evidence.declarationPaths.length === 0,
  `${label}: release declaration evidence does not match its state`);

  exactKeys(row.production, STATE_GATE_KEYS, `${label}.production`);
  invariant(row.production.state === "not-verified"
    && row.production.satisfied === false
    && typeof row.production.evidence === "string"
    && row.production.evidence.length > 0,
  `${label}: production verification was inferred`);

  invariant(row.uniqueRendererId === null
    || (typeof row.uniqueRendererId === "string"
      && row.uniqueRendererId.length > 0),
  `${label}: unique renderer identity must be explicit string or null`);
  invariant(row.sharedRendererGroup === null
    || row.sharedRendererGroup === EXPECTED.sharedRegisteredRendererId,
  `${label}: shared renderer group is invalid`);
  invariant(Array.isArray(row.blockers)
    && row.blockers.length > 0
    && row.blockers.every((blocker) => typeof blocker === "string")
    && new Set(row.blockers).size === row.blockers.length,
  `${label}: blockers must be a non-empty unique string list`);
  exactKeys(row.provenance, PROVENANCE_KEYS, `${label}.provenance`);
  invariant(row.provenance.generatorPath ===
    "scripts/build-page-only-migration-control-ledger.mjs"
    && row.provenance.sourceOrderPath === "catalog/lessons.json"
    && ["catalog/animations.json", "catalog/missing-references.json"]
      .includes(row.provenance.occurrenceJoinPath)
    && row.provenance.predecessorHead === PREDECESSOR_HEAD
    && row.provenance.baselineReceiptSha256 === INPUT_RECEIPT.sha256,
  `${label}: source/generator provenance is invalid`);
}

export function validateLedgerContract(ledger) {
  invariant(ledger.schemaVersion === LEDGER_SCHEMA_VERSION,
    "ledger schemaVersion drifted");
  invariant(ledger.taskId === TASK_ID, "ledger taskId drifted");
  invariant(Array.isArray(ledger.rows)
    && ledger.rows.length === EXPECTED.occurrenceCount,
  `ledger must contain ${EXPECTED.occurrenceCount} rows`);
  ledger.rows.forEach((row, index) => {
    validateRowSchema(row, index);
    invariant(row.catalogOccurrenceOrdinal === index + 1,
      `rows[${index}]: catalog occurrence order drift`);
    invariant(row.globalPageOrdinal === row.sourceOccurrence,
      `rows[${index}]: global/source occurrence mismatch`);
    invariant(row.placementId === placementId(
      row.grade,
      row.lesson,
      row.sourceOccurrence,
    ), `rows[${index}]: placementId drift`);
    invariant(!row.catalogAnimationId.startsWith("shell-")
      && !row.uniqueRendererId?.startsWith("shell-"),
    `rows[${index}]: legacy course shell entered page-only rows`);
    invariant(row.candidate.candidateOnly
      ? !row.registeredCurrentJs.satisfied
      : true,
    `rows[${index}]: candidate-only row counted as registered`);
    invariant(row.registeredCurrentJs.satisfied === row.myLessons.satisfied,
      `rows[${index}]: My Lessons evidence is not separately aligned`);
    if (row.registeredCurrentJs.satisfied) {
      const registrationEvidence = row.registeredCurrentJs.evidence;
      invariant(registrationEvidence.formalRegistryPath ===
        "apps/web/lib/whole-lesson-course-registry.ts"
        && typeof registrationEvidence.descriptorId === "string"
        && typeof registrationEvidence.releaseId === "string"
        && registrationEvidence.releaseDeclarationPaths.length >= 1
        && registrationEvidence.placementId === row.placementId
        && registrationEvidence.moduleKey === row.uniqueRendererId
        && hasAnimationModule(registrationEvidence.moduleKey),
      `rows[${index}]: formal registry/descriptor/runnable-module evidence is incomplete`);
      invariant(row.myLessons.evidence.hostPath ===
        "apps/web/lib/learning-lesson-availability.server.ts"
        && row.myLessons.evidence.formalRegistryPath ===
          "apps/web/lib/whole-lesson-course-registry.ts"
        && row.myLessons.evidence.descriptorId ===
          registrationEvidence.descriptorId,
      `rows[${index}]: independent My Lessons evidence is incomplete`);
    }
    for (const gate of [
      row.originalRuntime,
      row.technicalFidelity,
      row.audio,
      row.humanReview,
      row.ownerAcceptance,
      row.strictCompletion,
      row.release,
      row.production,
    ]) {
      invariant(gate.satisfied === false,
        `rows[${index}]: independent downstream gate was inferred`);
    }
  });

  invariant(new Set(ledger.rows.map(({placementId: id}) => id)).size ===
    EXPECTED.occurrenceCount, "placement IDs must be globally unique");
  const rowsByLesson = new Map();
  for (const row of ledger.rows) {
    const key = lessonKey(row.grade, row.lesson);
    const lessonRows = rowsByLesson.get(key) ?? [];
    lessonRows.push(row);
    rowsByLesson.set(key, lessonRows);
  }
  invariant(rowsByLesson.size === EXPECTED.lessonCount,
    "row Lesson identities drifted");
  for (const [key, lessonRows] of rowsByLesson) {
    lessonRows.forEach((row, index) => invariant(
      row.sourceOccurrence === index + 1
        && row.globalPageOrdinal === index + 1,
      `${key}: occurrence sequence is not contiguous source order`,
    ));
  }
  invariant(JSON.stringify(ledger.lessons.map(({grade, lesson}) =>
    lessonKey(grade, lesson))) === JSON.stringify([...rowsByLesson.keys()]),
  "Lesson summaries are not in exact row/source order");
  invariant(ledger.scope.lessonCount === EXPECTED.lessonCount
    && ledger.scope.occurrenceCount === EXPECTED.occurrenceCount
    && ledger.scope.courseShellCount === 0,
  "global scope denominator drifted");
  invariant(JSON.stringify(ledger.scope.gradeOccurrences) ===
    JSON.stringify(EXPECTED.gradeOccurrences), "grade scope drifted");
  invariant(ledger.summary.sourceCustody.resolvedOccurrences ===
    EXPECTED.resolvedSourceOccurrences
    && ledger.summary.sourceCustody.missingOccurrences ===
      EXPECTED.missingSourceOccurrences
    && ledger.summary.sourceCustody.resolvedOccurrences
      + ledger.summary.sourceCustody.missingOccurrences ===
        EXPECTED.occurrenceCount,
  "source occurrence join drifted");
  invariant(ledger.summary.currentJs.registeredOccurrences ===
    EXPECTED.registeredOccurrences
    && ledger.summary.currentJs.registeredUniqueRenderers ===
      EXPECTED.registeredUniqueRenderers
    && ledger.summary.currentJs.registeredLessons ===
      EXPECTED.registeredLessons
    && ledger.summary.currentJs.remainingOccurrences ===
      EXPECTED.remainingOccurrences,
  "formal Current-JS baseline drifted");
  const registeredLessons = ledger.lessons
    .filter(({registeredCurrentJs, occurrences}) =>
      registeredCurrentJs === occurrences)
    .map(({grade, lesson, occurrences}) => ({grade, lesson, occurrences}));
  invariant(JSON.stringify(registeredLessons) ===
    JSON.stringify(REGISTERED_LESSONS),
  "formal registered Lesson identities/counts drifted");
  invariant(ledger.summary.currentJs.candidateOnlyOccurrences ===
    EXPECTED.candidateOnlyOccurrences
    && ledger.summary.currentJs.candidateOnlyUniqueRenderers ===
      EXPECTED.candidateOnlyUniqueRenderers,
  "candidate-only inventory drifted");
  invariant(ledger.summary.currentJs.candidateToProductYield.state ===
    "not-established"
    && ledger.summary.currentJs.candidateToProductYield.numerator === null
    && ledger.summary.currentJs.candidateToProductYield.denominator === null,
  "candidate-to-product yield must remain fail-closed");
  invariant(ledger.summary.implementationLanes.factory ===
    EXPECTED.factoryPages
    && ledger.summary.implementationLanes["advanced-manual"] ===
      EXPECTED.advancedManualPages,
  "factory/advanced-manual counts drifted");
  invariant(ledger.summary.strictCompletion.strictCompleteOccurrences === 0,
    "strict completion was inflated");
  invariant(Object.values(ledger.summary.downstreamGates).every(
    (count) => count === 0 || count === EXPECTED.registeredOccurrences),
  "downstream gate summary contains an unsupported count");
  invariant(ledger.summary.downstreamGates.myLessonsCurrentCode ===
    EXPECTED.registeredOccurrences,
  "My Lessons current-code count drifted");
  for (const gateName of [
    "originalRuntime",
    "technicalFidelity",
    "audio",
    "humanReview",
    "ownerAcceptance",
    "strictComplete",
    "released",
    "productionVerified",
  ]) {
    invariant(ledger.summary.downstreamGates[gateName] === 0,
      `${gateName} must remain zero`);
  }
  const sharedRows = ledger.rows.filter(({sharedRendererGroup}) =>
    sharedRendererGroup !== null);
  invariant(sharedRows.length === 2
    && sharedRows.every(({sharedRendererGroup, uniqueRendererId, grade,
      lesson, sourceOccurrence}) =>
      sharedRendererGroup === EXPECTED.sharedRegisteredRendererId
        && uniqueRendererId === EXPECTED.sharedRegisteredRendererId
        && grade === 5
        && lesson === 3
        && [45, 46].includes(sourceOccurrence)),
  "G5 L3 IN028 must remain two placements sharing one renderer");
  invariant(ledger.nextRecommendation.grade === 4
    && ledger.nextRecommendation.lesson === 9
    && ledger.nextRecommendation.created === false,
  "next recommendation must remain uncreated G4 L9");
  return true;
}

export async function buildLedger() {
  const inputBindings = await bindInputs();
  const [
    lessonsDocument,
    animationsDocument,
    missingDocument,
    completionLedger,
    releaseLedger,
    lessonReleasesDocument,
    productReleasesDocument,
    sourceFreeze,
    candidateAssetProfile,
    learningAvailabilitySource,
  ] = await Promise.all([
    readJson("catalog/lessons.json"),
    readJson("catalog/animations.json"),
    readJson("catalog/missing-references.json"),
    readJson("catalog/completion-ledger.json"),
    readJson("catalog/lesson-release-ledger.json"),
    readJson("catalog/lesson-releases.json"),
    readJson("catalog/page-only-current-js-product-releases.json"),
    readJson("catalog/source-freeze.json"),
    readJson("apps/web/config/current-js-candidate-assets.v1.json"),
    readFile(path.join(projectRoot,
      "apps/web/lib/learning-lesson-availability.server.ts"), "utf8"),
  ]);
  const calibrations = await Promise.all(CALIBRATION_PATHS.map(async (
    calibrationPath,
  ) => ({
    path: calibrationPath,
    document: await readJson(calibrationPath),
  })));

  invariant(completionLedger.summary?.strictComplete === 0
    && completionLedger.entries?.length === 0,
  "strict diagnostics ledger must remain zero and must not be repurposed");
  invariant(releaseLedger.summary?.publishedReleaseCount === 0,
    "lesson release ledger unexpectedly contains a published release");
  invariant(productReleasesDocument.acceptanceEffects?.strictCompletion === false
    && productReleasesDocument.acceptanceEffects?.releasePublished === false
    && productReleasesDocument.acceptanceEffects?.ownerAccepted === false,
  "page-only product release authority unexpectedly opened");
  invariant(sourceFreeze.fileCount === 9_313
    && sourceFreeze.totalBytes === 3_308_484_004
    && sourceFreeze.manifestSha256 ===
      "f4de727e98372ca550b9f87220305c8b4d5b226b26e06573ae4ca7c7d40b9549"
    && sourceFreeze.readOnlyEnforced === true
    && sourceFreeze.writableEntriesAfterFreeze === 0,
  "physical source freeze summary drifted");
  invariant(candidateAssetProfile.counts?.runtime === 209
    && candidateAssetProfile.counts?.evidence === 204
    && candidateAssetProfile.authority?.productionApproved === false
    && candidateAssetProfile.authority?.releaseEligible === false
    && candidateAssetProfile.authority?.published === false,
  "candidate asset profile count/authority drifted");
  invariant(learningAvailabilitySource.includes(
    "wholeLessonCourseRegistrations().flatMap"),
  "My Lessons availability no longer derives from the formal registry");
  invariant(learningAvailabilitySource.includes(
    "wholeLessonDescriptorMatchesNavigation"),
  "My Lessons availability no longer checks descriptor/source navigation");
  invariant(learningAvailabilitySource.includes("?mode=focus"),
    "My Lessons focus route evidence drifted");

  const source = buildSourceOccurrences({
    lessonsDocument,
    animationsDocument,
    missingDocument,
  });
  const formalByOccurrence = buildFormalRegistrationIndex({
    sourceRows: source.rows,
    lessonByKey: source.lessonByKey,
    lessonReleasesDocument,
    productReleasesDocument,
  });
  const calibrationByAnimationId = buildCalibrationIndex(calibrations);
  const rows = buildRows({
    sourceRows: source.rows,
    formalByOccurrence,
    calibrationByAnimationId,
    completionLedger,
    releaseLedger,
  });
  const lessons = lessonSummaries(rows, source.lessons);
  const grades = gradeSummaries(rows);
  const registeredRows = rows.filter(
    ({registeredCurrentJs}) => registeredCurrentJs.satisfied,
  );
  const candidateOnlyRows = rows.filter(
    ({candidate}) => candidate.candidateOnly,
  );
  const complexityCounts = sortedCount(rows.map(({complexity}) =>
    complexity.state));
  const implementationLaneCounts = sortedCount(rows.map(
    ({implementationLane}) => implementationLane.state,
  ));
  const observedImplementationLabels = sortedCount(rows
    .map(({implementationLane}) => implementationLane.evidence.observedLabel)
    .filter((value) => value !== null));

  const generatorSha256 = await sha256File(scriptPath);
  const ledger = {
    schemaVersion: LEDGER_SCHEMA_VERSION,
    ledgerKind: "page-only-occurrence-migration-control-ledger",
    taskId: TASK_ID,
    generator: {
      path: projectRelative(scriptPath),
      version: GENERATOR_VERSION,
      sha256: generatorSha256,
      determinism: "no-clock-no-current-head-source-ordered",
      generatedOutputs: [
        projectRelative(DEFAULT_LEDGER_PATH),
        projectRelative(DEFAULT_DASHBOARD_PATH),
      ],
    },
    provenance: {
      predecessorHead: PREDECESSOR_HEAD,
      basePredecessor: BASE_PREDECESSOR,
      predecessorGateResult: "PASS",
      inputPlan: INPUT_PLAN,
      inputReceipt: INPUT_RECEIPT,
      externalInputBoundary:
        "Plan/receipt bytes are preflight-bound external frozen evidence; generation consumes the hash-bound repository inputs below.",
      repositoryInputs: inputBindings,
    },
    scope: {
      ownerDecision: "page-only-active-lesson-animation-occurrences",
      lessonCount: EXPECTED.lessonCount,
      occurrenceCount: EXPECTED.occurrenceCount,
      gradeOccurrences: EXPECTED.gradeOccurrences,
      courseShellCount: EXPECTED.courseShellCount,
      legacyFlashCourseShells: "completely-excluded",
      modernMyLessonHost: "retained",
      occurrenceIdentity: "grade+lesson+sourceOccurrence",
      sourceOrder: "catalog/lessons.json active course XML occurrence order",
    },
    baselineRetained: {
      before: {
        registeredOccurrences: EXPECTED.registeredOccurrences,
        registeredUniqueRenderers: EXPECTED.registeredUniqueRenderers,
        registeredLessons: EXPECTED.registeredLessons,
        remainingOccurrences: EXPECTED.remainingOccurrences,
      },
      after: {
        registeredOccurrences: registeredRows.length,
        registeredUniqueRenderers: new Set(registeredRows.map(
          ({uniqueRendererId}) => uniqueRendererId)).size,
        registeredLessons: lessons.filter(
          ({registeredCurrentJs, occurrences}) =>
            registeredCurrentJs === occurrences).length,
        remainingOccurrences: rows.length - registeredRows.length,
      },
      changedByThisLedgerTask: false,
    },
    summary: {
      sourceCustody: {
        resolvedOccurrences: source.resolvedSourceOccurrences,
        missingOccurrences: source.missingSourceOccurrences,
        uniqueMissingExpectedPaths: missingDocument.course.length,
        joinedOccurrences: rows.length,
        physicalFreeze: {
          summaryPath: "catalog/source-freeze.json",
          manifestPath: sourceFreeze.manifest,
          fileCount: sourceFreeze.fileCount,
          totalBytes: sourceFreeze.totalBytes,
          manifestSha256: sourceFreeze.manifestSha256,
          readOnlyEnforced: sourceFreeze.readOnlyEnforced,
          writableEntries: sourceFreeze.writableEntriesAfterFreeze,
          boundary:
            "Physical custody does not override the authoritative occurrence join or prove implementation/acceptance.",
        },
      },
      currentJs: {
        registeredOccurrences: registeredRows.length,
        registeredUniqueRenderers: new Set(registeredRows.map(
          ({uniqueRendererId}) => uniqueRendererId)).size,
        registeredLessons: lessons.filter(
          ({registeredCurrentJs, occurrences}) =>
            registeredCurrentJs === occurrences).length,
        remainingOccurrences: rows.length - registeredRows.length,
        candidateOnlyOccurrences: candidateOnlyRows.length,
        candidateOnlyUniqueRenderers: new Set(candidateOnlyRows.map(
          ({uniqueRendererId}) => uniqueRendererId)).size,
        runnableCoursePageOccurrences:
          registeredRows.length + candidateOnlyRows.length,
        sharedRegisteredRendererIds: [EXPECTED.sharedRegisteredRendererId],
        candidateAssetProfile: {
          path: "apps/web/config/current-js-candidate-assets.v1.json",
          runtimeAssetRecords: candidateAssetProfile.counts.runtime,
          evidenceAssetRecords: candidateAssetProfile.counts.evidence,
          productionApproved: candidateAssetProfile.authority.productionApproved,
          releaseEligible: candidateAssetProfile.authority.releaseEligible,
          published: candidateAssetProfile.authority.published,
          boundary:
            "Asset-profile records are not candidate-only occurrences and do not count as Current-JS without formal registration.",
        },
        candidateToProductYield: {
          state: "not-established",
          numerator: null,
          denominator: null,
          percentage: null,
          reason:
            "No single frozen attempted-candidate cohort binds both attempted and formally admitted populations; stock counts are not a yield denominator.",
        },
      },
      complexity: complexityCounts,
      implementationLanes: {
        factory: implementationLaneCounts.factory ?? 0,
        "advanced-manual": implementationLaneCounts["advanced-manual"] ?? 0,
        unclassified: implementationLaneCounts.unclassified ?? 0,
        observedLabels: observedImplementationLabels,
        boundary:
          "Only the exact factory label is promoted to factory; manual-source-static-fallback is reported as an observed label, not inferred as advanced-manual.",
      },
      downstreamGates: {
        myLessonsCurrentCode: rows.filter(({myLessons}) =>
          myLessons.satisfied).length,
        originalRuntime: rows.filter(({originalRuntime}) =>
          originalRuntime.satisfied).length,
        technicalFidelity: rows.filter(({technicalFidelity}) =>
          technicalFidelity.satisfied).length,
        audio: rows.filter(({audio}) => audio.satisfied).length,
        humanReview: rows.filter(({humanReview}) =>
          humanReview.satisfied).length,
        ownerAcceptance: rows.filter(({ownerAcceptance}) =>
          ownerAcceptance.satisfied).length,
        strictComplete: rows.filter(({strictCompletion}) =>
          strictCompletion.satisfied).length,
        released: rows.filter(({release}) => release.satisfied).length,
        productionVerified: rows.filter(({production}) =>
          production.satisfied).length,
      },
      strictCompletion: {
        evidencePath: "catalog/completion-ledger.json",
        evidenceMigrationDirectories:
          completionLedger.summary.migrationDirectories,
        evidenceStrictComplete: completionLedger.summary.strictComplete,
        strictCompleteOccurrences: 0,
        boundary:
          "The strict workspace diagnostics ledger is consumed as evidence only and is not the 1,751-occurrence denominator.",
      },
    },
    grades,
    lessons,
    waves: buildWaveSummary(source.lessonByKey),
    nextRecommendation: {
      grade: 4,
      lesson: 9,
      title: source.lessonByKey.get(lessonKey(4, 9)).titleDisplay,
      taskName: "HELP MATH Page-Only G4 L9 Equations Current-JS migration and registration",
      reason: "first not-formally-registered Lesson in Owner-supplied W1 ordering",
      created: false,
      started: false,
    },
    authorizationNeeds: [
      "Separate per-Lesson migration and formal registration authority for any page beyond the retained 426 baseline.",
      "Reviewed source promotion before W3/W4 source-dependent work.",
      "Exact original-runtime execution, technical fidelity, audio listening, human visual review, and Owner acceptance evidence per occurrence.",
      "Separate strict-completion, release, deployment, and production-verification authority.",
    ],
    rows,
  };
  validateLedgerContract(ledger);
  return ledger;
}

function percent(numerator, denominator) {
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function markdownTable(headers, rows) {
  const escape = (value) => String(value).replaceAll("|", "\\|")
    .replaceAll("\n", " ");
  return [
    `| ${headers.map(escape).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escape).join(" | ")} |`),
  ].join("\n");
}

export function renderDashboard(ledger) {
  validateLedgerContract(ledger);
  const {summary} = ledger;
  const sourceGapLessons = ledger.lessons.filter(
    ({sourceMissing}) => sourceMissing > 0);
  const complexityRows = Object.entries(summary.complexity).map(
    ([state, count]) => [state, count, percent(count, ledger.scope.occurrenceCount)],
  );
  const implementationRows = [
    ["factory", summary.implementationLanes.factory,
      percent(summary.implementationLanes.factory, ledger.scope.occurrenceCount)],
    ["advanced-manual", summary.implementationLanes["advanced-manual"],
      percent(summary.implementationLanes["advanced-manual"],
        ledger.scope.occurrenceCount)],
    ["unclassified", summary.implementationLanes.unclassified,
      percent(summary.implementationLanes.unclassified,
        ledger.scope.occurrenceCount)],
  ];
  const waveLines = ledger.waves.map((wave) => {
    const lessons = wave.lessons.map(({grade, lesson, title, occurrences}) =>
      `G${grade} L${lesson} ${title} (${occurrences})`).join(" → ");
    return `- **${wave.waveId} / ${wave.sourceReadiness}:** ${lessons}`;
  }).join("\n");
  const observedLabels = Object.entries(
    summary.implementationLanes.observedLabels,
  ).map(([label, count]) => `- \`${label}\`: ${count}`).join("\n");

  return `<!-- Generated by scripts/build-page-only-migration-control-ledger.mjs. Do not edit. -->
# HELP Math 1,751-page Page-Only migration control dashboard

- Task: \`${ledger.taskId}\`
- Predecessor: \`${ledger.provenance.predecessorHead}\`
- Scope: **${ledger.scope.lessonCount} Lessons / ${ledger.scope.occurrenceCount.toLocaleString("en-US")} active page occurrences / ${ledger.scope.courseShellCount} legacy course shells**

This dashboard is generated from \`catalog/page-only-migration-control-ledger.json\`. It is a control surface, not a second source of truth. Unknown, unclassified, and not-established states remain fail-closed.

## P0 baseline retained

| Measure | Before | After P1 ledger | Change |
| --- | ---: | ---: | ---: |
| Registered Current-JS occurrences | ${ledger.baselineRetained.before.registeredOccurrences} | ${ledger.baselineRetained.after.registeredOccurrences} | 0 |
| Unique registered renderers | ${ledger.baselineRetained.before.registeredUniqueRenderers} | ${ledger.baselineRetained.after.registeredUniqueRenderers} | 0 |
| Formal registered Lessons | ${ledger.baselineRetained.before.registeredLessons} | ${ledger.baselineRetained.after.registeredLessons} | 0 |
| Remaining occurrences | ${ledger.baselineRetained.before.remainingOccurrences.toLocaleString("en-US")} | ${ledger.baselineRetained.after.remainingOccurrences.toLocaleString("en-US")} | 0 |
| Legacy Flash course shells | 0 | 0 | 0 |

The baseline remains **426 / 1,751 occurrences** and **425 unique renderers**. The two G5 L3 IN028 placements remain distinct occurrences 45 and 46 sharing \`${EXPECTED.sharedRegisteredRendererId}\`.

## Grade denominators

${markdownTable(
    ["Grade", "Lessons", "Occurrences", "Resolved source", "Missing source", "Candidate-only", "Current-JS", "Unique renderers", "Remaining", "Strict"],
    ledger.grades.map((grade) => [
      `G${grade.grade}`,
      grade.lessons,
      grade.occurrences,
      grade.sourceResolved,
      grade.sourceMissing,
      grade.candidateOnly,
      grade.registeredCurrentJs,
      grade.registeredUniqueRenderers,
      grade.remaining,
      grade.strictComplete,
    ]),
  )}

## Per-Lesson control table

${markdownTable(
    ["Lesson", "Title", "Occurrences", "Source resolved", "Source missing", "Candidate-only", "Current-JS", "Remaining", "My Lessons", "Strict", "Wave"],
    ledger.lessons.map((lesson) => [
      `G${lesson.grade} L${lesson.lesson}`,
      lesson.title,
      lesson.occurrences,
      lesson.sourceResolved,
      lesson.sourceMissing,
      lesson.candidateOnly,
      lesson.registeredCurrentJs,
      lesson.remaining,
      lesson.myLessons,
      lesson.strictComplete,
      lesson.wave?.waveId ?? "registered baseline",
    ]),
  )}

## Source custody

- Occurrence join: **${summary.sourceCustody.resolvedOccurrences.toLocaleString("en-US")} resolved + ${summary.sourceCustody.missingOccurrences} missing = ${summary.sourceCustody.joinedOccurrences.toLocaleString("en-US")}**.
- Missing identities: **${summary.sourceCustody.uniqueMissingExpectedPaths} unique expected paths / ${summary.sourceCustody.missingOccurrences} occurrences**.
- Frozen physical source evidence: ${summary.sourceCustody.physicalFreeze.fileCount.toLocaleString("en-US")} files, ${summary.sourceCustody.physicalFreeze.totalBytes.toLocaleString("en-US")} bytes, manifest \`${summary.sourceCustody.physicalFreeze.manifestSha256}\`, read-only, 0 writable entries.
- Physical source custody does not override the catalog occurrence join and never proves implementation, runtime fidelity, review, release, or production.

Lessons with catalog source gaps:

${markdownTable(
    ["Lesson", "Title", "Missing occurrences", "Resolved occurrences"],
    sourceGapLessons.map((lesson) => [
      `G${lesson.grade} L${lesson.lesson}`,
      lesson.title,
      lesson.sourceMissing,
      lesson.sourceResolved,
    ]),
  )}

## Complexity distribution

${markdownTable(["State", "Occurrences", "Share"], complexityRows)}

Classified complexity covers ${EXPECTED.complexityClassified} occurrences; the remaining ${summary.complexity.unclassified.toLocaleString("en-US")} stay explicitly unclassified.

## Implementation lanes

${markdownTable(["Lane", "Evidence-classified occurrences", "Share"], implementationRows)}

Factory means only the exact \`hash-bound-ffdec-source-static-current-js\` label. No input uses the exact \`advanced-manual\` lane, so advanced-manual remains 0 rather than being inferred. In particular, the seven \`manual-source-static-fallback-private-current-js\` observations remain an observed label inside the unclassified lane.

Observed implementation labels retained without promotion:

${observedLabels}

## Candidate inventory and yield boundary

- Runnable but not formally registered candidate-only occurrences: **${summary.currentJs.candidateOnlyOccurrences}** (${summary.currentJs.candidateOnlyUniqueRenderers} unique renderers).
- Formally registered Current-JS occurrences: **${summary.currentJs.registeredOccurrences}** (${summary.currentJs.registeredUniqueRenderers} unique renderers).
- Candidate asset profile: ${summary.currentJs.candidateAssetProfile.runtimeAssetRecords} runtime records / ${summary.currentJs.candidateAssetProfile.evidenceAssetRecords} evidence records; production approved = false, release eligible = false, published = false.
- Candidate-to-product yield: **not established**. Numerator and denominator are null because no single frozen attempted-candidate cohort binds both populations. Candidate stock is never counted as Current-JS.

## Independent downstream gates

${markdownTable(
    ["Gate", "Satisfied occurrences", "Boundary"],
    [
      ["My Lessons current-code admission", summary.downstreamGates.myLessonsCurrentCode, "separately derived from the formal registry; not Production proof"],
      ["Original runtime", summary.downstreamGates.originalRuntime, "not established"],
      ["Technical fidelity", summary.downstreamGates.technicalFidelity, "not established"],
      ["Audio", summary.downstreamGates.audio, "not established"],
      ["Human review", summary.downstreamGates.humanReview, "not established"],
      ["Owner acceptance", summary.downstreamGates.ownerAcceptance, "not established"],
      ["Strict complete", summary.downstreamGates.strictComplete, "evidence-derived; diagnostics ledger remains strict 0"],
      ["Released", summary.downstreamGates.released, "false / unpublished"],
      ["Production verified", summary.downstreamGates.productionVerified, "not verified"],
    ],
  )}

Current-JS never implies any later gate. The existing \`catalog/completion-ledger.json\` remains a ${summary.strictCompletion.evidenceMigrationDirectories}-directory strict diagnostics ledger with ${summary.strictCompletion.evidenceStrictComplete} strict passes; it is evidence only, not the 1,751-row denominator.

## Current wave order

${waveLines}

### Exact next recommended Lesson task

**G${ledger.nextRecommendation.grade} L${ledger.nextRecommendation.lesson} — ${ledger.nextRecommendation.title}**: \`${ledger.nextRecommendation.taskName}\`.

Reason: ${ledger.nextRecommendation.reason}. This is a recommendation only; the task was not created or started.

## Blocker categories and authorization needs

- ${summary.sourceCustody.missingOccurrences} occurrence rows retain \`missing-canonical-source\`.
- ${summary.complexity.unclassified.toLocaleString("en-US")} occurrence rows retain \`complexity-unclassified\`.
- ${summary.implementationLanes.unclassified.toLocaleString("en-US")} occurrence rows retain \`implementation-lane-unclassified\`.
- ${summary.currentJs.candidateOnlyOccurrences} candidate-only occurrences require an exact formal Lesson registration before they can count as Current-JS.
- ${summary.currentJs.remainingOccurrences.toLocaleString("en-US")} occurrences remain outside formal Current-JS.
- Original-runtime, technical fidelity, audio, human, Owner, strict, release, and production gates remain independently closed.

Authorization still required:

${ledger.authorizationNeeds.map((need) => `- ${need}`).join("\n")}

## Provenance

- Input plan: \`${ledger.provenance.inputPlan.path}\` / \`${ledger.provenance.inputPlan.sha256}\`.
- Frozen P0 receipt: \`${ledger.provenance.inputReceipt.path}\` / \`${ledger.provenance.inputReceipt.sha256}\`.
- Generator: \`${ledger.generator.path}\` / \`${ledger.generator.sha256}\`.
- Canonical JSON: \`catalog/page-only-migration-control-ledger.json\`.
`;
}

export async function buildArtifacts() {
  const ledger = await buildLedger();
  return {
    ledger,
    ledgerText: stableJson(ledger),
    dashboardText: renderDashboard(ledger),
  };
}

async function atomicWrite(outputPath, content) {
  await mkdir(path.dirname(outputPath), {recursive: true});
  const temporaryPath = path.join(
    path.dirname(outputPath),
    `.${path.basename(outputPath)}.${process.pid}.tmp`,
  );
  try {
    await writeFile(temporaryPath, content, {flag: "wx"});
    await rename(temporaryPath, outputPath);
  } finally {
    await rm(temporaryPath, {force: true});
  }
}

export async function checkArtifacts({
  ledgerPath = DEFAULT_LEDGER_PATH,
  dashboardPath = DEFAULT_DASHBOARD_PATH,
} = {}) {
  const artifacts = await buildArtifacts();
  const [actualLedger, actualDashboard] = await Promise.all([
    readFile(ledgerPath, "utf8").catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    }),
    readFile(dashboardPath, "utf8").catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    }),
  ]);
  return {
    ok: actualLedger === artifacts.ledgerText
      && actualDashboard === artifacts.dashboardText,
    ledgerCurrent: actualLedger === artifacts.ledgerText,
    dashboardCurrent: actualDashboard === artifacts.dashboardText,
    artifacts,
  };
}

export async function writeArtifacts({
  ledgerPath = DEFAULT_LEDGER_PATH,
  dashboardPath = DEFAULT_DASHBOARD_PATH,
} = {}) {
  const artifacts = await buildArtifacts();
  await atomicWrite(ledgerPath, artifacts.ledgerText);
  await atomicWrite(dashboardPath, artifacts.dashboardText);
  return artifacts;
}

export function parseArguments(argv) {
  const options = {check: false, json: false, help: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else if (argument === "--json") options.json = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

function usage() {
  return `Usage:
  node --import tsx scripts/build-page-only-migration-control-ledger.mjs [--json]
  node --import tsx scripts/build-page-only-migration-control-ledger.mjs --check [--json]

Default mode deterministically generates the canonical 1,751-occurrence JSON
ledger and its derived Markdown dashboard. --check is byte-for-byte read-only.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (options.check) {
    const result = await checkArtifacts();
    const status = {
      status: result.ok ? "PASS" : "FAIL",
      ledgerCurrent: result.ledgerCurrent,
      dashboardCurrent: result.dashboardCurrent,
      occurrences: result.artifacts.ledger.scope.occurrenceCount,
      registeredOccurrences:
        result.artifacts.ledger.summary.currentJs.registeredOccurrences,
      registeredUniqueRenderers:
        result.artifacts.ledger.summary.currentJs.registeredUniqueRenderers,
    };
    if (options.json) process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
    else process.stdout.write(
      `${status.status}: page-only migration control ledger/dashboard ${result.ok ? "are current" : "are stale"}\n`,
    );
    if (!result.ok) process.exitCode = 1;
    return;
  }
  const artifacts = await writeArtifacts();
  const status = {
    status: "PASS",
    ledgerPath: projectRelative(DEFAULT_LEDGER_PATH),
    dashboardPath: projectRelative(DEFAULT_DASHBOARD_PATH),
    occurrences: artifacts.ledger.scope.occurrenceCount,
    registeredOccurrences:
      artifacts.ledger.summary.currentJs.registeredOccurrences,
    registeredUniqueRenderers:
      artifacts.ledger.summary.currentJs.registeredUniqueRenderers,
  };
  if (options.json) process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
  else process.stdout.write(
    `PASS: generated ${status.occurrences} page-only occurrence rows; retained ${status.registeredOccurrences}/${status.registeredUniqueRenderers} Current-JS occurrence/renderer counts\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  await main();
}
