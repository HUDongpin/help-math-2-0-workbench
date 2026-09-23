import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtemp, mkdir, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {gzipSync} from "node:zlib";

import {
  APPROVED_TABLE_DEFINITIONS,
  buildG4SqlCourseAggregate,
} from "./build-g4-sql-course-aggregate.mjs";

const TABLE_CATALOG_HEADER = [
  "object_id",
  "qualified_table",
  "row_count",
  "column_count",
  "sensitive_named_column_count",
  "domain",
  "priority",
  "sensitivity",
  "useful_for_help_math_2_0",
  "readable_jsonl_path",
  "lossless_bcp_path",
];

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function csv(rows) {
  return `${[TABLE_CATALOG_HEADER, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\n")}\n`;
}

function cloneDefinitions() {
  return APPROVED_TABLE_DEFINITIONS.map((descriptor) => ({
    ...descriptor,
    fields: [...descriptor.fields],
  }));
}

async function createFixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "g4-sql-aggregate-"));
  t.after(async () => rm(root, {recursive: true, force: true}));
  const sqlRoot = path.join(root, "private-sql-root");
  const sqlDataRoot = path.join(
    sqlRoot,
    "extracted_NewHelpProgram_20210203/04_data_jsonl_gzip/data",
  );
  const catalogRoot = path.join(root, "catalog");
  const sourceRoot = path.join(root, "source-authority");
  const jsonOutput = path.join(root, "reports/g4-sql-course-aggregate.json");
  const markdownOutput = path.join(root, "reports/g4-sql-course-aggregate.md");
  await Promise.all([
    mkdir(sqlDataRoot, {recursive: true}),
    mkdir(catalogRoot, {recursive: true}),
    mkdir(sourceRoot, {recursive: true}),
  ]);

  const rowsByTable = new Map();
  rowsByTable.set("dbo.Courses", [
    {
      Course_ID: 5,
      Course_Name: "Fixture Grade 4",
      No_Of_Lessons: 12,
      Display_Order: 2,
      Is_Active: true,
      indexswf: "indexELM.swf",
      Password: "SECRET-COURSE-PASSWORD",
      Student_Email: "private@example.invalid",
    },
  ]);
  rowsByTable.set(
    "dbo.Lessons",
    Array.from({length: 12}, (_, index) => {
      const lessonNumber = 12 - index;
      return {
        Lesson_ID: 1000 + lessonNumber,
        Course_ID: 5,
        Lesson_Title: `Fixture Lesson ${lessonNumber}`,
        url: `ELMGR4/L${lessonNumber}/index.xml`,
        Quiz_url: `ELMGR4/L${lessonNumber}/RE/L${lessonNumber}RE01.swf`,
        Is_Active: true,
        Lesson_number: lessonNumber,
        Teacher_Notes: `SECRET-LESSON-NOTE-${lessonNumber}`,
      };
    }),
  );
  rowsByTable.set(
    "dbo.MetaData",
    Array.from({length: 12}, (_, index) => index + 1).flatMap((lessonNumber) =>
      Array.from({length: lessonNumber}, () => ({
        Lesson_ID: 1000 + lessonNumber,
        Student_ID: `SECRET-STUDENT-${lessonNumber}`,
      })),
    ),
  );
  rowsByTable.set(
    "dbo.ssm_LessonsPages",
    Array.from({length: 12}, (_, index) => index + 1).flatMap((lessonNumber) =>
      Array.from({length: 13 - lessonNumber}, () => ({
        LessonId: 1000 + lessonNumber,
        PageText: `SECRET-PAGE-${lessonNumber}`,
      })),
    ),
  );
  rowsByTable.set(
    "dbo.ssm_QuizQuestions",
    Array.from({length: 12}, (_, index) => index + 1).flatMap((lessonNumber) =>
      Array.from({length: 2}, () => ({
        LessonId: 1000 + lessonNumber,
        QuestionText: `SECRET-QUIZ-${lessonNumber}`,
      })),
    ),
  );
  rowsByTable.set(
    "dbo.LearningObjectives",
    Array.from({length: 12}, (_, index) => index + 1).flatMap((lessonNumber) =>
      Array.from({length: lessonNumber % 3}, () => ({
        Lesson_ID: 1000 + lessonNumber,
        ObjectiveText: `SECRET-OBJECTIVE-${lessonNumber}`,
      })),
    ),
  );

  const tableCatalogRows = [];
  for (const descriptor of APPROVED_TABLE_DEFINITIONS) {
    const rows = rowsByTable.get(descriptor.name);
    const jsonl = `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
    await writeFile(path.join(sqlDataRoot, descriptor.file), gzipSync(jsonl));
    tableCatalogRows.push([
      descriptor.objectId,
      descriptor.name,
      rows.length,
      descriptor.fields.length,
      0,
      "course_content_taxonomy",
      "high",
      "content_metadata",
      "yes",
      `extracted_NewHelpProgram_20210203/04_data_jsonl_gzip/data/${descriptor.file}`,
      `extracted_NewHelpProgram_20210203/03_data_native_bcp/${descriptor.file.replace(".jsonl.gz", ".bcp")}`,
    ]);
  }
  const tableCatalogPath = path.join(
    catalogRoot,
    "newhelpprogram-20210203-tables.csv",
  );
  await writeFile(tableCatalogPath, csv(tableCatalogRows));

  const currentLessons = [];
  for (let lessonNumber = 1; lessonNumber <= 12; lessonNumber += 1) {
    const relative = `HELP_COURSES/ELMGR4/L${lessonNumber}/index.xml`;
    const bytes = Buffer.from(
      `<lesson number="${lessonNumber}">${"x".repeat(lessonNumber)}</lesson>\n`,
    );
    const destination = path.join(sourceRoot, relative);
    await mkdir(path.dirname(destination), {recursive: true});
    await writeFile(destination, bytes);
    currentLessons.unshift({
      grade: 4,
      lesson: lessonNumber,
      path: relative,
      sha256: sha256(bytes),
      bytes: bytes.length,
      pageReferenceCount: 20 + lessonNumber,
      titleDisplay: `Fixture Lesson ${lessonNumber}`,
    });
  }
  const lessonCatalogPath = path.join(catalogRoot, "lessons.json");
  await writeFile(
    lessonCatalogPath,
    `${JSON.stringify({lessons: currentLessons}, null, 2)}\n`,
  );

  const options = {
    root,
    sqlRoot,
    sourceRoot,
    tableCatalogPath,
    lessonCatalogPath,
    jsonOutput,
    markdownOutput,
  };
  return {
    root,
    sqlRoot,
    tableCatalogPath,
    tableCatalogRows,
    jsonOutput,
    markdownOutput,
    options,
  };
}

test("builds a sorted 12-lesson aggregate map without leaking raw or sensitive rows", async (t) => {
  const fixture = await createFixture(t);
  const result = await buildG4SqlCourseAggregate(fixture.options);
  const {report} = result;

  assert.equal(report.schemaVersion, 1);
  assert.equal(
    report.reportType,
    "g4-privacy-safe-historical-sql-course-aggregate",
  );
  assert.deepEqual(report.identity, {
    historicalCourseId: 5,
    grade: 4,
    lessonCount: 12,
  });
  assert.deepEqual(
    report.lessons.map(({lessonNumber}) => lessonNumber),
    Array.from({length: 12}, (_, index) => index + 1),
  );
  assert.deepEqual(report.lessons[0].aggregates, {
    metadataRows: 1,
    structuredPageRows: 12,
    quizDefinitionRows: 2,
    learningObjectiveRows: 1,
  });
  assert.deepEqual(report.lessons[11].aggregates, {
    metadataRows: 12,
    structuredPageRows: 1,
    quizDefinitionRows: 2,
    learningObjectiveRows: 0,
  });
  assert.deepEqual(report.totals, {
    activeHistoricalLessons: 12,
    currentXmlPageReferences: 318,
    metadata: 78,
    structuredPages: 78,
    structuredQuizQuestions: 24,
    learningObjectives: 12,
  });
  assert.deepEqual(
    report.inputs.sqlTables.map(({table}) => table),
    APPROVED_TABLE_DEFINITIONS.map(({name}) => name),
  );
  assert.equal(report.privacyBoundary.approvedSqlTableCount, 6);
  assert.equal(report.privacyBoundary.restrictedSqlTablesRead, 0);
  assert.equal(report.privacyBoundary.rawCurriculumRowsEmitted, 0);
  assert.equal(report.sequenceAuthority.historicalSqlIsSequenceAuthority, false);
  for (const key of [
    "runtimeEffect",
    "fidelityEffect",
    "audioEffect",
    "humanReviewEffect",
    "ownerAcceptanceEffect",
    "strictCompletionEffect",
    "publicationEffect",
  ]) {
    assert.equal(report.authorityBoundary[key], false, `${key} must remain false`);
  }

  const json = await readFile(fixture.jsonOutput, "utf8");
  const markdown = await readFile(fixture.markdownOutput, "utf8");
  for (const forbidden of [
    "SECRET-",
    "Password",
    "Student_Email",
    "Teacher_Notes",
    "QuestionText",
    "ObjectiveText",
    fixture.sqlRoot,
  ]) {
    assert.equal(json.includes(forbidden), false, `JSON leaked ${forbidden}`);
    assert.equal(markdown.includes(forbidden), false, `Markdown leaked ${forbidden}`);
  }
  assert.match(markdown, /current 12 canonical Grade 4 lesson XML files/iu);
  await buildG4SqlCourseAggregate({...fixture.options, check: true});
});

test("rejects catalog classification drift before emitting a report", async (t) => {
  const fixture = await createFixture(t);
  const drifted = fixture.tableCatalogRows.map((row) => [...row]);
  drifted[0][TABLE_CATALOG_HEADER.indexOf("sensitivity")] = "restricted";
  await writeFile(fixture.tableCatalogPath, csv(drifted));
  await assert.rejects(
    buildG4SqlCourseAggregate(fixture.options),
    /not an approved privacy-safe content_metadata table/iu,
  );
});

test("rejects an extra SQL table and a sensitive field added to the allowlist", async (t) => {
  const fixture = await createFixture(t);
  const extraTable = [
    ...cloneDefinitions(),
    {
      name: "dbo.UserActivity",
      objectId: "999",
      file: "T_999.jsonl.gz",
      fields: ["Student_ID"],
    },
  ];
  await assert.rejects(
    buildG4SqlCourseAggregate({...fixture.options, tableDefinitions: extraTable}),
    /extra or missing tables are forbidden/iu,
  );

  const sensitiveField = cloneDefinitions();
  sensitiveField[0].fields.push("Password");
  await assert.rejects(
    buildG4SqlCourseAggregate({...fixture.options, tableDefinitions: sensitiveField}),
    /field allowlist drifted/iu,
  );
});

test("--check semantics reject stale JSON and Markdown outputs", async (t) => {
  const fixture = await createFixture(t);
  await buildG4SqlCourseAggregate(fixture.options);
  await writeFile(fixture.jsonOutput, "{}\n");
  await assert.rejects(
    buildG4SqlCourseAggregate({...fixture.options, check: true}),
    /aggregate JSON is stale/iu,
  );

  await buildG4SqlCourseAggregate(fixture.options);
  await writeFile(fixture.markdownOutput, "# stale\n");
  await assert.rejects(
    buildG4SqlCourseAggregate({...fixture.options, check: true}),
    /aggregate Markdown is stale/iu,
  );
});
