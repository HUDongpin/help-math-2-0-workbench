import assert from "node:assert/strict";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildG4CurriculumRuntimeDependencyMap,
  deriveWholeCourseAudioRequirements,
  parseArguments,
  parseGrade4CourseXml,
  reconcileKeyTerms,
  stableJson,
} from "./build-g4-curriculum-runtime-dependency-map.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("CLI rejects duplicate or conflicting write/check modes", () => {
  assert.throws(
    () => parseArguments(["--write", "--check"]),
    /Choose exactly one of --write or --check/u,
  );
  assert.throws(
    () => parseArguments(["--check", "--write"]),
    /Choose exactly one of --write or --check/u,
  );
  assert.throws(
    () => parseArguments(["--write", "--write"]),
    /Choose exactly one of --write or --check/u,
  );
  assert.equal(parseArguments(["--check"]).mode, "check");
});

test("stableJson recursively sorts object keys without reordering arrays", () => {
  assert.equal(
    stableJson({z: 1, a: {z: 2, a: 3}, list: [{z: 4, a: 5}]}) ,
    '{\n  "a": {\n    "a": 3,\n    "z": 2\n  },\n  "list": [\n    {\n      "a": 5,\n      "z": 4\n    }\n  ],\n  "z": 1\n}\n',
  );
});

test("course XML parser ignores commented pages and preserves XML page order", () => {
  const xml = `
    <Lesson>
      <CourseName>Counting on Numbers</CourseName>
      <NewTitle1>Fixture</NewTitle1>
      <LessonNumber>10</LessonNumber>
      <PageRoot>HELP_COURSES/ELMGR4/L10</PageRoot>
      <Keyterms><English>E.xml</English><Spanish>S.xml</Spanish><DigDir>DIG</DigDir></Keyterms>
      <Section SName="VB" SNumber="3">
        <Title><English>Words</English><Spanish>Palabras</Spanish></Title>
        <!--<Page Title="Old">VB/OLD.swf</Page>-->
        <Page Title="First">VB/A.swf</Page>
        <Page Title="Second">VB/B.swf</Page>
        <SubPageTitle EngSubTitleName="1. Exact" SpanSubTitleName="Exacto">VB/A.swf</SubPageTitle>
      </Section>
    </Lesson>`;
  const parsed = parseGrade4CourseXml(xml, "HELP_COURSES/ELMGR4/L10/index.xml");
  assert.equal(parsed.pages.length, 2);
  assert.deepEqual(parsed.pages.map(({expectedPath}) => expectedPath), [
    "HELP_COURSES/ELMGR4/L10/VB/A.swf",
    "HELP_COURSES/ELMGR4/L10/VB/B.swf",
  ]);
  assert.equal(parsed.pages[0].titleEnglish, "Exact");
  assert.equal(parsed.pages[0].titleSpanish, "Exacto");
  assert.equal(parsed.pages[1].titleEnglish, "Exact");
  assert.equal(parsed.pages[1].titleSpanish, "Exacto");
  assert.equal(parsed.keyTerms.english, "E.xml");
});

test("ordinary audio route includes sections 2-6 and section 7 after ordinal one", () => {
  const lessons = [{
    lessonNumber: 1,
    pages: [
      {sectionNumber: 1, sectionPageOrdinal: 1, sectionCode: "IR", expectedPath: `${prefix}IR/I.swf`},
      {sectionNumber: 2, sectionPageOrdinal: 1, sectionCode: "RW", expectedPath: `${prefix}RW/R.swf`},
      {sectionNumber: 7, sectionPageOrdinal: 1, sectionCode: "TS", expectedPath: `${prefix}TS/H.swf`},
      {sectionNumber: 7, sectionPageOrdinal: 2, sectionCode: "TS", expectedPath: `${prefix}TS/T.swf`},
      {sectionNumber: 8, sectionPageOrdinal: 1, sectionCode: "FQ", expectedPath: `${prefix}FQ/F.swf`},
    ],
  }];
  const result = deriveWholeCourseAudioRequirements({lessons, fqTargetEvidence: []});
  assert.deepEqual(result.ordinary.map(({canonicalPath}) => canonicalPath), [
    `${prefix}SA/R.mp3`,
    `${prefix}SA/T.mp3`,
  ]);
});

test("final quiz labels are deduplicated per lesson while retaining all target wrappers", () => {
  const lessons = [{
    lessonNumber: 2,
    pages: [
      {sectionNumber: 8, sectionPageOrdinal: 1, sectionCode: "FQ", expectedPath: `${prefix2}FQ/A.swf`},
      {sectionNumber: 8, sectionPageOrdinal: 2, sectionCode: "FQ", expectedPath: `${prefix2}FQ/B.swf`},
    ],
  }];
  const evidence = ["A", "B"].map((name) => ({
    canonicalPath: `${prefix2}FQ/${name}.swf`,
    audioBound: true,
    questionLabels: ["Q1", "Q2"],
    questionCount: 2,
  }));
  const result = deriveWholeCourseAudioRequirements({lessons, fqTargetEvidence: evidence});
  assert.equal(result.finalQuizUniqueQuestionLabelCount, 2);
  assert.equal(result.finalQuiz.length, 20);
  assert.deepEqual(result.finalQuiz[0].requiredBy, [`${prefix2}FQ/A.swf`, `${prefix2}FQ/B.swf`]);
});

test("final quiz contract rejects non-contiguous labels", () => {
  const lessons = [{
    lessonNumber: 2,
    pages: [{sectionNumber: 8, sectionPageOrdinal: 1, sectionCode: "FQ", expectedPath: `${prefix2}FQ/A.swf`}],
  }];
  assert.throws(
    () => deriveWholeCourseAudioRequirements({
      lessons,
      fqTargetEvidence: [{
        canonicalPath: `${prefix2}FQ/A.swf`,
        audioBound: true,
        questionLabels: ["Q2"],
        questionCount: 1,
      }],
    }),
    /Non-contiguous FQ labels/u,
  );
});

test("Key Term reconciliation separates case variants from exact-placement SHA review and leaves Polynomial.swf unresolved", () => {
  const missingReferences = {
    summary: {keyterm: {occurrences: 3, unique: 2, resolved: 0}},
    keyterm: [
      {expectedPath: `${digPrefix}Accurate.swf`, occurrences: [{}, {}]},
      {expectedPath: `${digPrefix}Exact.swf`, occurrences: [{}]},
      {expectedPath: `${digPrefix}Polynomial.swf`, occurrences: [{}]},
    ],
  };
  const digIntakePlan = {records: [
    {
      canonicalPath: `${digPrefix}accurate.swf`,
      extension: "swf",
      bytes: 4,
      sha256: "a".repeat(64),
    },
    {
      canonicalPath: `${digPrefix}polynomial.fla`,
      extension: "fla",
      bytes: 5,
      sha256: "b".repeat(64),
    },
    {
      canonicalPath: `${digPrefix}Exact.swf`,
      extension: "swf",
      bytes: 6,
      sha256: "d".repeat(64),
    },
  ]};
  const data = (language) => ({
    source: {assetId: `${language}.xml`, bytes: 1, sha256: "c".repeat(64)},
    extraction: {entryCount: 1, warningCount: 0},
    lessonBinding: {runtimeResolutionVerified: false},
    authority: {ownerAccepted: false},
  });
  const result = reconcileKeyTerms({
    missingReferences,
    digIntakePlan,
    englishData: data("en"),
    spanishData: data("es"),
    lessonDeclarations: [],
  });
  assert.equal(result.diagramObligations.totalCandidateReviewHolds, 2);
  assert.equal(result.diagramObligations.caseVariantPlacementReviewCandidates, 1);
  assert.equal(result.diagramObligations.exactPlacementShaReceiptReviewCandidates, 1);
  assert.equal(result.diagramObligations.stillUnresolvedAfterAllCandidateReviews, 1);
  assert.equal(result.diagramObligations.missing[0].candidate.sameExactPlacement, false);
  assert.equal(
    result.diagramObligations.missing[1].status,
    "hold-exact-placement-sha-and-receipt-review",
  );
  assert.equal(result.diagramObligations.automaticExactPlacementAdmissionAuthorized, false);
  assert.equal(result.diagramObligations.polynomialDisposition.runtimeSwfPresent, false);
  assert.equal(result.diagramObligations.automaticCaseNormalizationAuthorized, false);
});

test("current Grade 4 alignment rebuilds exact known counts and keeps all acceptance gates false", async () => {
  const result = await buildG4CurriculumRuntimeDependencyMap({root: ROOT, mode: "memory"});
  assert.deepEqual(
    {
      lessons: result.report.course.lessonCount,
      pages: result.report.course.activePageCount,
      shells: result.report.course.shellCount,
      sourceMembers: result.report.course.sourceMemberCount,
      quizWrappers: result.report.quiz.activeWrapperCount,
      audioExpected: result.report.audio.expected,
      audioPresent: result.report.audio.present,
      audioMissing: result.report.audio.missing,
    },
    {
      lessons: 12,
      pages: 645,
      shells: 12,
      sourceMembers: 657,
      quizWrappers: 36,
      audioExpected: 2086,
      audioPresent: 2070,
      audioMissing: 16,
    },
  );
  assert.equal(result.report.successorPromotionAdmission.filenameOrBasenameAdmissionAuthorized, false);
  assert.equal(result.report.successorPromotionAdmission.bulkIntakePromotionAuthorized, false);
  assert.equal(result.report.authorityBoundary.originalRuntimeFidelity, false);
  assert.equal(result.report.authorityBoundary.ownerAccepted, false);
  assert.equal(result.report.authorityBoundary.publication, false);
});

test("write/check is byte deterministic and check rejects stale output", async () => {
  const temporary = await mkdtemp(path.join(ROOT, "output", ".g4-alignment-test-"));
  const output = path.join(temporary, "alignment.json");
  try {
    const written = await buildG4CurriculumRuntimeDependencyMap({root: ROOT, output, mode: "write"});
    await buildG4CurriculumRuntimeDependencyMap({root: ROOT, output, mode: "check"});
    const bytes = await readFile(output);
    assert.equal(bytes.length, written.output.bytes);
    await writeFile(output, Buffer.concat([bytes, Buffer.from(" ")]));
    await assert.rejects(
      buildG4CurriculumRuntimeDependencyMap({root: ROOT, output, mode: "check"}),
      /is stale/u,
    );
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
});

const prefix = "HELP_COURSES/ELMGR4/L1/";
const prefix2 = "HELP_COURSES/ELMGR4/L2/";
const digPrefix = "HELP_KEYTERMS/KT/ELEMENTARY/DIG/";
