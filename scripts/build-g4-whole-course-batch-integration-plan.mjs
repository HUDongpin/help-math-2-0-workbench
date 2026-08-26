#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const OUTPUT_PATH =
  "catalog/batches/g4-whole-course-batch-integration-plan-v1.json";

const INPUTS = Object.freeze({
  sqlAggregate: {
    path: "reports/g4-sql-course-aggregate.json",
    kind: "json",
    sha256: "7c8343e920cf3326125597bc905400952123942b1c77b383fd4fee07fe21e8b2",
  },
  alignment: {
    path: "catalog/alignments/g4-curriculum-runtime-dependency-map-v1.json",
    kind: "json",
    sha256: "05357658e7c5f70b9d305ea64063130f1b1d816663748af45cfa1950319a670b",
  },
  sourceSuccessor: {
    path: "catalog/source-promotions/g4-runtime-dependency-successor-v3-2026-08-04.json",
    kind: "json",
    sha256: "789ddbd809b8fb8a8d8e3d7ab4b5d3c7c5cddb81cb6f358133575dd63e8ad07f",
  },
  l10Template: {
    path: "reports/g4-l10-complete-migration-template-contract-v4-2026-08-04.json",
    kind: "json",
    sha256: "c8a64fdf766efb56ef03c936fc2e6c9fd0179f81d780ab3d1a5042c1f815f261",
  },
  lessonReleases: {
    path: "catalog/lesson-releases.json",
    kind: "json",
    sha256: "d518f812a19b6038e55bca337b7a4f4f96425dd5599f9d07c9f69c8a0a1ae1cf",
  },
  releaseLedger: {
    path: "catalog/lesson-release-ledger.json",
    kind: "json",
    sha256: "4ea4850993ffb50eb2ba484279457f7e98bbfa339a29a71f6092f23d4b7f4650",
  },
  completionLedger: {
    path: "catalog/completion-ledger.json",
    kind: "json",
    sha256: "62d5b5f71ed8ccbf94ba31132d3347f43ac4918585ece52ead8fbb36a4c0b92d",
  },
  animations: {
    path: "catalog/animations.json",
    kind: "json",
    sha256: "ab27270c1f6a6618bae5e52f6e48ebf3ef646b6232dd087c1c86f755a6a3ce10",
  },
  prototypeRegistry: {
    path: "packages/demos/prototype-registry.json",
    kind: "json",
    sha256: "8ab849e636f064501080238b50cbc69e2186025cda5715fe81bc3906a4148149",
  },
  coverageImplementation: {
    path: "apps/web/lib/g4-course-catalog-coverage.ts",
    kind: "text",
    sha256: "a74713d5b71a1b691d26b1ccae9d5eb0b3696112fabde0c56c0982e626d7e617",
  },
  coverageLoader: {
    path: "apps/web/lib/g4-course-catalog-coverage.server.ts",
    kind: "text",
    sha256: "15e36391f50fbb8e79f816c39ea09c9e53678c7951a0f372e988aa6a7051c62d",
  },
  coverageTests: {
    path: "apps/web/tests/g4-course-catalog-coverage.test.ts",
    kind: "text",
    sha256: "2a21b1c68795fd0a5fef3f5c9ec3b0b43bd3d8215e049e0cc8086a6498ab04a2",
  },
  lessonPublisher: {
    path: "apps/web/lib/lesson-release-publication.ts",
    kind: "text",
    sha256: "000e51fe35cfdf7ed97efb2e212c91e6c6507dfe8c2ed445a702176a89691479",
  },
  lessonPublisherTests: {
    path: "apps/web/tests/lesson-release-publication.test.ts",
    kind: "text",
    sha256: "401e1e51685bc4feba5c7356111bb62a56361334ff202fe80e824283af66ff7a",
  },
});

const WAVE_DEFINITIONS = Object.freeze([
  { waveId: "W1", lessons: [1, 2] },
  { waveId: "W2", lessons: [3, 7, 12] },
  { waveId: "W3", lessons: [4, 8, 11] },
  { waveId: "W4", lessons: [5, 6, 9] },
]);

const LESSON_GATE_DAG = Object.freeze([
  "audit",
  "original-runtime-baseline",
  "specification",
  "renderer",
  "behavior-and-accessibility-tests",
  "visual-rmse",
  "audio-listening",
  "human-review",
  "engineering-review",
  "owner-review",
  "strict-completion",
  "atomic-lesson-release",
]);

const EFFECT_KEYS = Object.freeze([
  "waveAdmission",
  "batchExecution",
  "sourcePromotion",
  "runtimeDependencyClosure",
  "rendererAcceptance",
  "originalRuntimeAcceptance",
  "behaviorAcceptance",
  "accessibilityAcceptance",
  "visualRmseAcceptance",
  "audioAcceptance",
  "localizationAcceptance",
  "keyTermAcceptance",
  "quizAcceptance",
  "humanAcceptance",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictCompletion",
  "atomicLessonPublication",
  "wholeCourseIntegration",
  "wholeCoursePublication",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function fingerprint(value) {
  const projection = structuredClone(value);
  delete projection.planFingerprintSha256;
  return sha256(canonicalJson(projection));
}

function resolveInsideRoot(projectRoot, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false, "Absolute path is forbidden");
  const root = path.resolve(projectRoot);
  const absolute = path.resolve(root, relativePath);
  assert.ok(absolute.startsWith(`${root}${path.sep}`),
    `Path escapes project root: ${relativePath}`);
  return absolute;
}

function identity(info) {
  return [info.dev, info.ino, info.size, info.mtimeNs, info.ctimeNs]
    .map(String).join(":");
}

async function readStable(projectRoot, key, specification) {
  const absolute = resolveInsideRoot(projectRoot, specification.path);
  const before = await lstat(absolute, { bigint: true });
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `${specification.path} must be an ordinary non-symlink file`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, { bigint: true });
  assert.equal(identity(after), identity(before), `${specification.path} changed while read`);
  assert.equal(BigInt(bytes.length), before.size, `${specification.path} size drifted`);
  const digest = sha256(bytes);
  assert.equal(digest, specification.sha256, `${specification.path} epoch drifted`);
  const record = {
    key,
    path: specification.path,
    kind: specification.kind,
    bytes: bytes.length,
    sha256: digest,
    mode: Number(before.mode & 0o777n).toString(8).padStart(4, "0"),
    statIdentity: identity(before),
  };
  record.text = bytes.toString("utf8");
  if (specification.kind === "json") record.document = JSON.parse(record.text);
  return record;
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const entries = await Promise.all(Object.entries(INPUTS).map(([key, specification]) =>
    readStable(projectRoot, key, specification),
  ));
  return {
    projectRoot: path.resolve(projectRoot),
    records: Object.fromEntries(entries.map((entry) => [entry.key, entry])),
  };
}

export async function assertSnapshotUnchanged(snapshot) {
  for (const [key, specification] of Object.entries(INPUTS)) {
    const reread = await readStable(snapshot.projectRoot, key, specification);
    assert.equal(reread.statIdentity, snapshot.records[key].statIdentity,
      `${specification.path} stat identity drifted`);
  }
}

function document(snapshot, key) {
  const value = snapshot.records[key]?.document;
  assert.ok(value, `Missing JSON document ${key}`);
  return value;
}

function binding(record) {
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
    mode: record.mode,
  };
}

function registeredCoverage(alignment, animations, registeredKeys) {
  const registry = new Set(registeredKeys);
  return alignment.course.lessons.map((lesson) => {
    const pageAnimationIds = lesson.pages.map((page) => {
      const matches = animations.animations.filter((animation) =>
        animation.references?.courseXml?.some((reference) =>
          reference.sourceXmlPath === lesson.currentSequenceAuthority.path &&
          reference.expectedPath === page.expectedPath &&
          reference.occurrence === page.globalPageOrdinal,
        ),
      );
      assert.equal(matches.length, 1,
        `L${lesson.lessonNumber} page ${page.globalPageOrdinal} lacks one exact animation binding`);
      return matches[0].animationId;
    });
    const shells = animations.animations.filter((animation) =>
      animation.flags?.shell === true &&
      animation.classification?.grade === 4 &&
      animation.classification?.lesson === lesson.lessonNumber,
    );
    assert.equal(shells.length, 1, `L${lesson.lessonNumber} lacks one shell`);
    const currentPages = pageAnimationIds.filter((id) => registry.has(id)).length;
    const currentShells = registry.has(shells[0].animationId) ? 1 : 0;
    return {
      lesson: lesson.lessonNumber,
      title: lesson.title,
      pageCount: lesson.pageCount,
      shellCount: 1,
      memberCount: lesson.pageCount + 1,
      currentJsPages: currentPages,
      currentJsShells: currentShells,
      currentJsMembers: currentPages + currentShells,
      currentJsGap: lesson.pageCount + 1 - currentPages - currentShells,
      pageAnimationIds,
      shellAnimationId: shells[0].animationId,
    };
  });
}

function pathLesson(canonicalPath) {
  const match = String(canonicalPath).match(/\/L(\d+)\//u);
  assert.ok(match, `Missing lesson segment in ${canonicalPath}`);
  return Number(match[1]);
}

function sum(records, field) {
  return records.reduce((total, record) => total + Number(record[field]), 0);
}

function waveMembershipDigest(waves) {
  const rows = waves.flatMap((wave) => wave.lessons.map((lesson) =>
    `${wave.waveId}\t${lesson}\n`,
  )).join("");
  return sha256(rows);
}

export function derivePlan(snapshot) {
  const sql = document(snapshot, "sqlAggregate");
  const alignment = document(snapshot, "alignment");
  const successor = document(snapshot, "sourceSuccessor");
  const l10 = document(snapshot, "l10Template");
  const releases = document(snapshot, "lessonReleases");
  const releaseLedger = document(snapshot, "releaseLedger");
  const completion = document(snapshot, "completionLedger");
  const animations = document(snapshot, "animations");
  const prototypeRegistry = document(snapshot, "prototypeRegistry");

  assert.equal(sql.totals.activeHistoricalLessons, 12);
  assert.equal(sql.totals.currentXmlPageReferences, 645);
  assert.equal(alignment.course.lessonCount, 12);
  assert.equal(alignment.course.activePageCount, 645);
  assert.equal(alignment.course.shellCount, 12);
  assert.equal(alignment.course.sourceMemberCount, 657);
  assert.equal(alignment.course.sectionCount, 96);
  assert.equal(alignment.course.orderedPageSet.sha256,
    "030d5600305036ae584420beab9baea92e99e20b0f7e5046743e4e7f15c800fd");
  assert.equal(successor.decision.promotionRecordCount, 0);
  assert.equal(successor.decision.successorPlanMayBeApplied, false);
  assert.equal(successor.requiredUnresolvedSources.length, 16);
  assert.ok(successor.requiredUnresolvedSources.every(({ expectedSha256 }) =>
    expectedSha256 === null));
  assert.equal(l10.schemaVersion, 4);
  assert.equal(l10.templateStable, false);
  assert.equal(l10.status, "fail-closed-template-not-stable");
  assert.equal(l10.automationBoundary.templateBatchAdmissionAllowed, false);
  assert.equal(l10.liveWholeLessonClosure.memberLevel.recordCount, 269);
  assert.equal(l10.liveWholeLessonClosure.candidateCode.candidateCount, 24);
  assert.equal(l10.liveWholeLessonClosure.candidateCode.fullLocalCodeClosure.recordCount, 53);
  assert.equal(l10.liveWholeLessonClosure.candidateCode.fullLocalCodeClosure.setSha256,
    "a5105dbfc86efd9111975395cfc2f7c3d6cbda7d2ae072e30dbafb23bbebf893");
  assert.equal(l10.liveWholeLessonClosure.candidateCode.runtimeAssetClosure.recordCount, 24);
  assert.equal(l10.liveWholeLessonClosure.candidateCode.runtimeAssetClosure.setSha256,
    "b736fa0a4434788032dc7fdea4251cd802560ec2c6b9aa29a75ff41f2ed825a8");
  assert.equal(l10.liveWholeLessonClosure.candidateCode.assetDigestMismatchCount, 0);
  assert.equal(l10.liveWholeLessonClosure.candidateCode.registryReferenceCount, 0);
  assert.equal(l10.downstreamTransactionBoundary.decision, "DO_NOT_APPLY");
  assert.ok(Object.values(l10.acceptanceEffects).every((value) => value === false));

  const coverage = registeredCoverage(
    alignment,
    animations,
    prototypeRegistry.entries.map(({ key }) => key),
  );
  const expectedPages = [80, 67, 39, 54, 53, 49, 48, 46, 43, 46, 43, 77];
  const expectedCurrent = [2, 0, 40, 0, 0, 0, 0, 0, 1, 0, 0, 0];
  assert.deepEqual(coverage.map(({ pageCount }) => pageCount), expectedPages);
  assert.deepEqual(coverage.map(({ currentJsMembers }) => currentJsMembers), expectedCurrent);
  assert.equal(sum(coverage, "memberCount"), 657);
  assert.equal(sum(coverage, "currentJsMembers"), 43);
  assert.equal(sum(coverage, "currentJsGap"), 614);

  const missingMp3ByLesson = new Map();
  for (const dependency of successor.requiredUnresolvedSources) {
    const lesson = pathLesson(dependency.canonicalPath);
    missingMp3ByLesson.set(lesson, (missingMp3ByLesson.get(lesson) ?? 0) + 1);
  }
  assert.deepEqual(Object.fromEntries(missingMp3ByLesson), { 2: 14, 6: 1, 8: 1 });

  const releaseDefinitions = releases.releases.filter(({ grade }) => grade === 4);
  const releaseDefinitionLessons = releaseDefinitions.map(({ lesson }) => lesson)
    .sort((left, right) => left - right);
  assert.deepEqual(releaseDefinitionLessons, [3, 10]);
  const missingReleaseDefinitionLessons = Array.from({ length: 12 }, (_, index) => index + 1)
    .filter((lesson) => !releaseDefinitionLessons.includes(lesson));
  assert.deepEqual(missingReleaseDefinitionLessons, [1, 2, 4, 5, 6, 7, 8, 9, 11, 12]);
  const publishedGrade4 = releaseLedger.releases.filter(({ grade, published }) =>
    grade === 4 && published === true).length;
  assert.equal(publishedGrade4, 0);
  assert.equal(releaseLedger.summary.publishedReleaseCount, 0);
  assert.equal(releaseLedger.summary.strictCompleteMemberCount, 0);
  assert.equal(completion.entries.length, 0);
  assert.equal(completion.summary.strictComplete, 0);

  const lessonRecords = coverage.map((record) => {
    const lesson = alignment.course.lessons.find(({ lessonNumber }) =>
      lessonNumber === record.lesson);
    const fallbackCount = lesson.pages.filter(({ spanishTitleDisposition }) =>
      spanishTitleDisposition === "english-fallback-no-source-spanish-page-title").length;
    const spanishTitleCount = lesson.pages.filter(({ spanishTitleDisposition }) =>
      spanishTitleDisposition === "source-subpage-title").length;
    const quizWrappers = alignment.quiz.wrappers.filter(({ lessonNumber }) =>
      lessonNumber === record.lesson).length;
    return {
      ...record,
      sourceCustodyComplete: true,
      strictCompleteMembers: 0,
      releaseDefinitionPresent: releaseDefinitionLessons.includes(record.lesson),
      sections: 8,
      sourceSpanishPageTitles: spanishTitleCount,
      explicitEnglishFallbacks: fallbackCount,
      quizWrappers,
      keyTermDeclarations: 1,
      missingMp3: missingMp3ByLesson.get(record.lesson) ?? 0,
      gateDag: LESSON_GATE_DAG,
      admitted: false,
      executable: false,
      acceptanceEffect: "none",
    };
  });

  const waves = WAVE_DEFINITIONS.map((definition) => {
    const lessons = definition.lessons.map((lesson) =>
      lessonRecords.find((record) => record.lesson === lesson));
    assert.ok(lessons.every(Boolean));
    return {
      waveId: definition.waveId,
      lessonNumbers: definition.lessons,
      lessonCount: lessons.length,
      pages: sum(lessons, "pageCount"),
      shells: sum(lessons, "shellCount"),
      members: sum(lessons, "memberCount"),
      currentJsMembers: sum(lessons, "currentJsMembers"),
      currentJsGap: sum(lessons, "currentJsGap"),
      sections: sum(lessons, "sections"),
      sourceSpanishPageTitles: sum(lessons, "sourceSpanishPageTitles"),
      explicitEnglishFallbacks: sum(lessons, "explicitEnglishFallbacks"),
      quizWrappers: sum(lessons, "quizWrappers"),
      keyTermDeclarations: sum(lessons, "keyTermDeclarations"),
      missingMp3: sum(lessons, "missingMp3"),
      admissionStatus: "planned-not-admitted",
      admittedLessonCount: 0,
      executable: false,
      executorPresent: false,
      acceptanceEffect: "none",
    };
  });
  assert.deepEqual(waves.map(({ members, currentJsMembers, currentJsGap, missingMp3 }) =>
    ({ members, currentJsMembers, currentJsGap, missingMp3 })), [
    { members: 149, currentJsMembers: 2, currentJsGap: 147, missingMp3: 14 },
    { members: 167, currentJsMembers: 40, currentJsGap: 127, missingMp3: 0 },
    { members: 146, currentJsMembers: 0, currentJsGap: 146, missingMp3: 1 },
    { members: 148, currentJsMembers: 1, currentJsGap: 147, missingMp3: 1 },
  ]);
  assert.equal(sum(waves, "members"), 610);
  assert.equal(sum(waves, "currentJsMembers"), 43);
  assert.equal(sum(waves, "currentJsGap"), 567);
  const waveLessons = waves.flatMap(({ lessonNumbers }) => lessonNumbers)
    .sort((left, right) => left - right);
  assert.deepEqual(waveLessons, [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12]);

  const keyTerms = alignment.keyTerms.diagramObligations;
  assert.deepEqual({
    occurrences: keyTerms.occurrences,
    unique: keyTerms.unique,
    resolved: keyTerms.canonicalResolved,
    missing: keyTerms.canonicalMissing,
    caseHolds: keyTerms.caseVariantPlacementReviewCandidates,
    exactHolds: keyTerms.exactPlacementShaReceiptReviewCandidates,
    holds: keyTerms.totalCandidateReviewHolds,
    residual: keyTerms.stillUnresolvedAfterAllCandidateReviews,
  }, {
    occurrences: 1515,
    unique: 760,
    resolved: 443,
    missing: 317,
    caseHolds: 299,
    exactHolds: 17,
    holds: 316,
    residual: 1,
  });
  assert.equal(keyTerms.polynomialDisposition.expectedRuntimePath,
    "HELP_KEYTERMS/KT/ELEMENTARY/DIG/Polynomial.swf");
  assert.equal(keyTerms.polynomialDisposition.runtimeSwfPresent, false);
  assert.equal(keyTerms.polynomialDisposition.flaDoesNotSubstituteForShippedRuntime, true);
  assert.equal(alignment.localization.pagesUsingEnglishFallbackForSpanish, 175);
  assert.equal(alignment.localization.pagesWithSourceSpanishSubpageTitle, 470);
  assert.equal(alignment.quiz.activeWrapperCount, 36);
  assert.equal(alignment.quiz.targetSwfEvidence.length, 12);
  assert.equal(alignment.quiz.targetSwfEvidence.filter(({ audioBound }) => audioBound).length, 8);
  assert.equal(alignment.quiz.targetSwfEvidence
    .filter(({ audioBound }) => audioBound)
    .reduce((total, item) => total + item.questionCount, 0), 212);
  assert.equal(alignment.quiz.externallyAudioBoundUniqueQuestionLabelCount, 157);

  const acceptanceEffects = Object.fromEntries(EFFECT_KEYS.map((key) => [key, false]));
  const plan = {
    schemaVersion: 1,
    artifactType: "g4-whole-course-batch-and-atomic-integration-plan",
    planDate: "2026-08-04",
    status: "planned-not-admitted-not-executable",
    planOnly: true,
    executable: false,
    executorPresent: false,
    waveAdmissionCount: 0,
    template: {
      lesson: 10,
      contractVersion: 4,
      members: 47,
      currentJsMembers: 0,
      currentJsGap: 47,
      contract: binding(snapshot.records.l10Template),
      templateStable: false,
      batchAdmissionAllowed: false,
      downstreamTransactionDecision: "DO_NOT_APPLY",
      recursiveLocalCandidateCodeClosure: {
        records: l10.liveWholeLessonClosure.candidateCode.fullLocalCodeClosure.recordCount,
        sha256: l10.liveWholeLessonClosure.candidateCode.fullLocalCodeClosure.setSha256,
      },
      digestDeclaredRuntimeAssetClosure: {
        records: l10.liveWholeLessonClosure.candidateCode.runtimeAssetClosure.recordCount,
        sha256: l10.liveWholeLessonClosure.candidateCode.runtimeAssetClosure.setSha256,
        digestMismatches: l10.liveWholeLessonClosure.candidateCode.assetDigestMismatchCount,
      },
      rule: "L10 remains inside the 657-member course denominator but outside the four planning waves until a reviewed successor establishes template stability.",
    },
    courseBaseline: {
      grade: 4,
      lessonCount: 12,
      pageCount: 645,
      shellCount: 12,
      memberCount: 657,
      currentJsPages: 41,
      currentJsShells: 2,
      currentJsMembers: 43,
      currentJsGap: 614,
      strictCompleteMembers: 0,
      publishedLessonCount: 0,
      rendererCompleteLessons: [3],
      orderedPageSetSha256: alignment.course.orderedPageSet.sha256,
      custodyIsNotAcceptance: true,
    },
    lessonGateDag: {
      order: LESSON_GATE_DAG,
      noGateMayBeSkipped: true,
      currentJsAvailabilityMayNotSubstituteForStrictCompletion: true,
      waveCompletionHasPublicationEffect: false,
    },
    lessons: lessonRecords.map(({ pageAnimationIds, shellAnimationId, ...record }) => record),
    waves,
    waveMembership: {
      excludedTemplateLesson: 10,
      nonTemplateLessonCount: waveLessons.length,
      uniqueLessonCount: new Set(waveLessons).size,
      lessons: waveLessons,
      setSha256: waveMembershipDigest(WAVE_DEFINITIONS),
      subtotal: {
        pages: sum(waves, "pages"),
        shells: sum(waves, "shells"),
        members: sum(waves, "members"),
        currentJsMembers: sum(waves, "currentJsMembers"),
        currentJsGap: sum(waves, "currentJsGap"),
      },
    },
    blockers: {
      audio: {
        expected: alignment.audio.expected,
        present: alignment.audio.present,
        missing: alignment.audio.missing,
        missingByLesson: Object.fromEntries(missingMp3ByLesson),
        missingByWave: Object.fromEntries(waves.map(({ waveId, missingMp3 }) =>
          [waveId, missingMp3])),
        ordinarySpanishPage: alignment.audio.ordinarySpanishPage,
        finalQuizEnglishSpanishQuestionAndOptions:
          alignment.audio.finalQuizEnglishSpanishQuestionAndOptions,
        unboundFinalQuizCandidatesExcluded:
          alignment.audio.candidatePoolControl.candidateUnboundExcludedCount,
        missingPathSetSha256: alignment.audio.missingPathSetSha256,
        expectedSha256KnownForAllMissing: false,
        dependencyClosureComplete: false,
      },
      keyTerms: {
        occurrences: keyTerms.occurrences,
        unique: keyTerms.unique,
        canonicalResolved: keyTerms.canonicalResolved,
        canonicalMissing: keyTerms.canonicalMissing,
        caseVariantPlacementReviewHolds:
          keyTerms.caseVariantPlacementReviewCandidates,
        exactPlacementShaReceiptReviewHolds:
          keyTerms.exactPlacementShaReceiptReviewCandidates,
        totalReviewHolds: keyTerms.totalCandidateReviewHolds,
        residualUnresolvedRuntimePath:
          keyTerms.polynomialDisposition.expectedRuntimePath,
        companionFlaIsRuntimeSubstitute: false,
        dependencyClosureComplete: false,
      },
      localization: {
        bilingualSections: alignment.localization.sectionsWithEnglishAndSpanishTitles,
        totalSections: alignment.localization.totalSections,
        sourceSpanishPageTitles:
          alignment.localization.pagesWithSourceSpanishSubpageTitle,
        explicitEnglishFallbacks:
          alignment.localization.pagesUsingEnglishFallbackForSpanish,
        fallbackIsTranslationAcceptance: false,
      },
      quiz: {
        wrapperCount: alignment.quiz.activeWrapperCount,
        inspectedTargetSwfCount: alignment.quiz.targetSwfEvidence.length,
        audioBoundTargetSwfCount:
          alignment.quiz.targetSwfEvidence.filter(({ audioBound }) => audioBound).length,
        boundTargetQuestionLabelOccurrences: 212,
        externallyAudioBoundUniqueQuestionLabelCount:
          alignment.quiz.externallyAudioBoundUniqueQuestionLabelCount,
        denominatorsAreInterchangeable: false,
      },
      releaseDefinitions: {
        currentGrade4Count: releaseDefinitionLessons.length,
        currentLessons: releaseDefinitionLessons,
        requiredCount: 12,
        missingCount: missingReleaseDefinitionLessons.length,
        missingLessons: missingReleaseDefinitionLessons,
      },
      sourceSuccessor: {
        promotionRecordCount: 0,
        mayApply: false,
        closesRuntimeDependencies: false,
      },
    },
    atomicWholeCourseIntegration: {
      currentPlatformInvariant: "per-lesson-atomic-only",
      currentPlatformEnforcesWholeCourseZeroOrTwelve: false,
      wholeCourseTrustAdapterPresent: false,
      currentPublishedLessonCount: publishedGrade4,
      permittedPublishedLessonCounts: [0, 12],
      forbiddenPartialPublishedLessonCounts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      currentStateSatisfiesProposedInvariant: publishedGrade4 === 0,
      prepare: {
        requiredGrade4ReleaseDefinitions: 12,
        requiredExactMembers: 657,
        requireNoDuplicateOrOmittedAnimationAssetIdentity: true,
        requireAllMembersStrictComplete: true,
        requireAllLessonAtomicGatesOpen: true,
        requireRuntimeAudioKeyTermLocalizationQuizClosure: true,
        requireHumanEngineeringOwnerAcceptance: true,
        requireCurrentHashBindingsAndAuthorizedSigner: true,
      },
      commit: {
        singleCourseCasRequired: true,
        expectedPreimagePublishedLessonCount: 0,
        successPublishedLessonCount: 12,
        partialCommitAllowed: false,
        wavePublicationAllowed: false,
        durableSignedReceiptRequired: true,
      },
      rollback: {
        preCommitFailureLeavesPublishedLessonCount: 0,
        preservePreimagesAndFailedReceipts: true,
        postCommitVerificationRequiredBeforePublicTrust: true,
        recoveryMustBeIndependentReviewedTransaction: true,
      },
      implementationStatus: "design-only-missing-trust-adapter-and-executor",
      integrationAllowed: false,
      publicationAllowed: false,
    },
    admissionDecision: {
      outcome: "ZERO-WAVES-ADMITTED",
      reasons: [
        "L10 v4 templateStable is false and batch admission is prohibited",
        "downstream L10 transaction remains P0 DO_NOT_APPLY",
        "16 SHA-unresolved MP3 dependencies remain",
        "Key Term review holds and Polynomial.swf remain unresolved",
        "10 Grade 4 lesson release definitions are absent",
        "strict completion is 0 and the whole-course trust adapter does not exist",
      ],
      mayStartRendererBatch: false,
      mayIntegrateCourse: false,
      mayPublishAnyLessonFromWave: false,
    },
    authorityBoundary: {
      sqlIsHistoricalAggregateContextOnly: true,
      alignmentIsPlanningNotAcceptance: true,
      currentJsCoverageIsEngineeringAvailabilityOnly: true,
      L3RendererCompleteIsStrictComplete: false,
      sourceCustodyIsRuntimeDependencyClosure: false,
      planMayCreateReleaseDefinitions: false,
      planMayMutateRegistryOrLedger: false,
      planMayApplySourcePromotion: false,
      planMayExecuteOriginalRuntime: false,
      planMayStartBatch: false,
      planMayIntegrateOrPublish: false,
    },
    acceptanceEffects,
    inputBindings: Object.fromEntries(Object.keys(snapshot.records).sort()
      .map((key) => [key, binding(snapshot.records[key])])),
  };
  plan.planFingerprintSha256 = fingerprint(plan);
  validatePlan(plan);
  return plan;
}

export function validatePlan(plan) {
  assert.equal(plan.status, "planned-not-admitted-not-executable");
  assert.equal(plan.planOnly, true);
  assert.equal(plan.executable, false);
  assert.equal(plan.executorPresent, false);
  assert.equal(plan.waveAdmissionCount, 0);
  assert.equal(plan.template.templateStable, false);
  assert.equal(plan.courseBaseline.memberCount, 657);
  assert.equal(plan.courseBaseline.currentJsMembers, 43);
  assert.equal(plan.courseBaseline.currentJsGap, 614);
  assert.equal(plan.waveMembership.subtotal.members, 610);
  assert.equal(plan.waveMembership.subtotal.currentJsMembers, 43);
  assert.equal(plan.waveMembership.subtotal.currentJsGap, 567);
  assert.equal(plan.waves.length, 4);
  assert.ok(plan.waves.every(({ admittedLessonCount, executable, executorPresent }) =>
    admittedLessonCount === 0 && executable === false && executorPresent === false));
  assert.equal(plan.blockers.releaseDefinitions.currentGrade4Count, 2);
  assert.equal(plan.blockers.releaseDefinitions.missingCount, 10);
  assert.equal(plan.atomicWholeCourseIntegration.currentPlatformEnforcesWholeCourseZeroOrTwelve, false);
  assert.deepEqual(plan.atomicWholeCourseIntegration.permittedPublishedLessonCounts, [0, 12]);
  assert.equal(plan.atomicWholeCourseIntegration.currentPublishedLessonCount, 0);
  assert.equal(plan.atomicWholeCourseIntegration.integrationAllowed, false);
  assert.equal(plan.atomicWholeCourseIntegration.publicationAllowed, false);
  assert.deepEqual(Object.keys(plan.acceptanceEffects), EFFECT_KEYS);
  assert.ok(Object.values(plan.acceptanceEffects).every((value) => value === false));
  assert.equal(plan.planFingerprintSha256, fingerprint(plan));
  return true;
}

export function parseCliArgs(args) {
  assert.equal(args.length, 1, "Usage: ... --write | --check");
  assert.ok(["--write", "--check"].includes(args[0]), "Expected --write or --check");
  return args[0];
}

export async function writeNoClobber(absolute, contents) {
  try {
    const current = await readFile(absolute, "utf8");
    assert.equal(current, contents, `${absolute} exists with different bytes; refusing overwrite`);
    return "already-current";
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await writeFile(absolute, contents, { flag: "wx", mode: 0o644 });
  return "created";
}

export async function runCli(args = process.argv.slice(2), projectRoot = PROJECT_ROOT) {
  const mode = parseCliArgs(args);
  const snapshot = await readSnapshot(projectRoot);
  const plan = derivePlan(snapshot);
  const output = `${JSON.stringify(plan, null, 2)}\n`;
  await assertSnapshotUnchanged(snapshot);
  const outputPath = resolveInsideRoot(projectRoot, OUTPUT_PATH);
  if (mode === "--write") {
    const disposition = await writeNoClobber(outputPath, output);
    await assertSnapshotUnchanged(snapshot);
    return { mode, plan, disposition, written: OUTPUT_PATH };
  }
  assert.equal(await readFile(outputPath, "utf8"), output,
    `${OUTPUT_PATH} is stale; preserve it and create a successor if reviewed inputs change`);
  await assertSnapshotUnchanged(snapshot);
  return { mode, plan, checked: OUTPUT_PATH };
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runCli().then((result) => {
    process.stdout.write(`${result.mode === "--write" ? "WROTE" : "CHECKED"} ${OUTPUT_PATH}\n`);
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
