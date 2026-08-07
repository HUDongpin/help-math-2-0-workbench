#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEFAULT_SQL_ROOT =
  "/Volumes/WestWorld/HELP MATH Related Files/Extracted_NewHelpProgram_20210203";
const TABLE_CATALOG_RELATIVE = "catalog/newhelpprogram-20210203-tables.csv";
const LESSON_CATALOG_RELATIVE = "catalog/lessons.json";
const SOURCE_ROOT_RELATIVE = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const DEFAULT_JSON_RELATIVE = "reports/g4-sql-course-aggregate.json";
const DEFAULT_MARKDOWN_RELATIVE = "reports/g4-sql-course-aggregate.md";
const COURSE_ID = 5;
const GRADE = 4;
const EXPECTED_LESSON_COUNT = 12;

function definition({name, objectId, file, fields}) {
  return Object.freeze({
    name,
    objectId,
    file,
    fields: Object.freeze([...fields]),
  });
}

export const APPROVED_TABLE_DEFINITIONS = Object.freeze([
  definition({
    name: "dbo.Courses",
    objectId: "784721848",
    file: "T_784721848.jsonl.gz",
    fields: [
      "Course_ID",
      "Course_Name",
      "No_Of_Lessons",
      "Display_Order",
      "Is_Active",
      "indexswf",
    ],
  }),
  definition({
    name: "dbo.Lessons",
    objectId: "912722304",
    file: "T_912722304.jsonl.gz",
    fields: [
      "Lesson_ID",
      "Course_ID",
      "Lesson_Title",
      "url",
      "Quiz_url",
      "Is_Active",
      "Lesson_number",
    ],
  }),
  definition({
    name: "dbo.MetaData",
    objectId: "1040722760",
    file: "T_1040722760.jsonl.gz",
    fields: ["Lesson_ID"],
  }),
  definition({
    name: "dbo.ssm_LessonsPages",
    objectId: "61243273",
    file: "T_61243273.jsonl.gz",
    fields: ["LessonId"],
  }),
  definition({
    name: "dbo.ssm_QuizQuestions",
    objectId: "125243501",
    file: "T_125243501.jsonl.gz",
    fields: ["LessonId"],
  }),
  definition({
    name: "dbo.LearningObjectives",
    objectId: "896722247",
    file: "T_896722247.jsonl.gz",
    fields: ["Lesson_ID"],
  }),
]);

const FORBIDDEN_OUTPUT_KEY =
  /(?:password|credential|login|email|address|birthday|student|teacher|account|activity|free.?text|note)/iu;

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
      .sort()
      .map((key) => [key, stable(value[key])]),
  );
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function portable(root, file) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  invariant(
    relative && !relative.startsWith("../") && !path.isAbsolute(relative),
    `${file} escapes the project root`,
  );
  return relative;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell.replace(/\r$/u, ""));
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else cell += character;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  invariant(rows.length > 0, "SQL table catalog is empty");
  const [header, ...body] = rows;
  invariant(new Set(header).size === header.length, "SQL table catalog has duplicate columns");
  return body.map((values) =>
    Object.fromEntries(header.map((name, index) => [name, values[index] ?? ""])),
  );
}

function sameArray(left, right) {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

export function validateTableDefinitions(
  definitions,
  approved = APPROVED_TABLE_DEFINITIONS,
) {
  invariant(Array.isArray(definitions), "SQL table definitions must be an array");
  invariant(
    definitions.length === approved.length,
    `Exactly ${approved.length} approved SQL content-metadata tables are required; extra or missing tables are forbidden`,
  );
  const approvedByName = new Map(approved.map((item) => [item.name, item]));
  invariant(approvedByName.size === approved.length, "Approved SQL table names are not unique");
  const observedNames = definitions.map(({name}) => name);
  invariant(
    new Set(observedNames).size === definitions.length,
    "SQL table definitions contain a duplicate table",
  );
  for (const descriptor of definitions) {
    const expected = approvedByName.get(descriptor.name);
    invariant(expected, `Unapproved SQL table requested: ${descriptor.name}`);
    invariant(
      descriptor.objectId === expected.objectId && descriptor.file === expected.file,
      `${descriptor.name} object identity drifted`,
    );
    invariant(
      sameArray(descriptor.fields, expected.fields),
      `${descriptor.name} field allowlist drifted; sensitive or extra fields are forbidden`,
    );
  }
  for (const expected of approved) {
    invariant(
      observedNames.includes(expected.name),
      `Approved SQL table is missing: ${expected.name}`,
    );
  }
}

export function projectWhitelistedFields(row, fields, tableName = "SQL table") {
  invariant(
    row && typeof row === "object" && !Array.isArray(row),
    `${tableName} row must be an object`,
  );
  const projected = {};
  for (const field of fields) {
    invariant(Object.hasOwn(row, field), `${tableName} row is missing required field ${field}`);
    projected[field] = row[field];
  }
  return projected;
}

function parseProjectedJsonLines(bytes, descriptor) {
  let text;
  try {
    text = gunzipSync(bytes).toString("utf8");
  } catch (error) {
    throw new Error(`${descriptor.name} source is not valid gzip JSONL: ${error.message}`);
  }
  const rows = [];
  for (const [index, line] of text.split(/\r?\n/u).entries()) {
    if (!line.trim()) continue;
    let raw;
    try {
      raw = JSON.parse(line);
    } catch (error) {
      throw new Error(`${descriptor.name} line ${index + 1} is invalid JSON: ${error.message}`);
    }
    rows.push(projectWhitelistedFields(raw, descriptor.fields, descriptor.name));
  }
  return rows;
}

async function loadSqlTable({sqlRoot, catalogRows, descriptor}) {
  const matches = catalogRows.filter(
    (row) =>
      row.object_id === descriptor.objectId && row.qualified_table === descriptor.name,
  );
  invariant(matches.length === 1, `${descriptor.name} catalog identity is missing or ambiguous`);
  const catalog = matches[0];
  invariant(
    catalog.domain === "course_content_taxonomy" &&
      catalog.priority === "high" &&
      catalog.sensitivity === "content_metadata" &&
      Number(catalog.sensitive_named_column_count) === 0,
    `${descriptor.name} is not an approved privacy-safe content_metadata table`,
  );
  const expectedRelative =
    `extracted_NewHelpProgram_20210203/04_data_jsonl_gzip/data/${descriptor.file}`;
  invariant(
    catalog.readable_jsonl_path === expectedRelative,
    `${descriptor.name} catalog path drifted`,
  );
  const sourceFile = path.join(sqlRoot, expectedRelative);
  const information = await lstat(sourceFile);
  invariant(
    information.isFile() && !information.isSymbolicLink(),
    `${descriptor.name} source is not a regular file`,
  );
  const bytes = await readFile(sourceFile);
  const rows = parseProjectedJsonLines(bytes, descriptor);
  const declaredRows = Number(catalog.row_count);
  invariant(
    Number.isSafeInteger(declaredRows) && declaredRows === rows.length,
    `${descriptor.name} catalog row-count drifted`,
  );
  return {
    table: descriptor.name,
    objectId: descriptor.objectId,
    projectedFields: [...descriptor.fields],
    source: {
      fileBasename: descriptor.file,
      catalogReadablePathSha256: sha256(Buffer.from(expectedRelative)),
      sha256: sha256(bytes),
      bytes: bytes.length,
      rowCountDeclared: declaredRows,
      domain: catalog.domain,
      sensitivity: catalog.sensitivity,
      sensitiveNamedColumnCount: Number(catalog.sensitive_named_column_count),
    },
    rows,
  };
}

function countByLesson(rows, field, lessonIds) {
  const counts = new Map([...lessonIds].map((lessonId) => [lessonId, 0]));
  for (const row of rows) {
    const lessonId = row[field];
    if (counts.has(lessonId)) counts.set(lessonId, counts.get(lessonId) + 1);
  }
  return counts;
}

function normalizedCanonicalHistoricalUrl(value) {
  if (typeof value !== "string" || !value) return null;
  const normalized = value.replaceAll("\\", "/").replace(/^\/+|\/+$/gu, "");
  return normalized.startsWith("HELP_COURSES/")
    ? normalized
    : `HELP_COURSES/${normalized}`;
}

async function loadCurrentLessonAuthority({root, sourceRoot, lessonCatalogPath}) {
  const lessonCatalogBytes = await readFile(lessonCatalogPath);
  const catalog = JSON.parse(lessonCatalogBytes);
  invariant(Array.isArray(catalog.lessons), "Current lesson catalog is malformed");
  const lessons = catalog.lessons
    .filter(({grade}) => grade === GRADE)
    .sort((left, right) => left.lesson - right.lesson);
  invariant(
    lessons.length === EXPECTED_LESSON_COUNT,
    "Current Grade 4 lesson catalog does not contain exactly 12 XML authorities",
  );
  const expectedNumbers = Array.from(
    {length: EXPECTED_LESSON_COUNT},
    (_, index) => index + 1,
  );
  invariant(
    lessons.every(({lesson}, index) => lesson === expectedNumbers[index]),
    "Current Grade 4 XML lesson sequence is not exactly 1..12",
  );
  const verified = [];
  for (const lesson of lessons) {
    const expectedPath = `HELP_COURSES/ELMGR4/L${lesson.lesson}/index.xml`;
    invariant(lesson.path === expectedPath, `Current Grade 4 L${lesson.lesson} XML path drifted`);
    invariant(
      typeof lesson.sha256 === "string" && /^[a-f0-9]{64}$/u.test(lesson.sha256),
      `Current Grade 4 L${lesson.lesson} XML SHA-256 is invalid`,
    );
    invariant(
      Number.isSafeInteger(lesson.bytes) && lesson.bytes > 0,
      `Current Grade 4 L${lesson.lesson} XML byte count is invalid`,
    );
    invariant(
      Number.isSafeInteger(lesson.pageReferenceCount) && lesson.pageReferenceCount > 0,
      `Current Grade 4 L${lesson.lesson} XML page count is invalid`,
    );
    const physicalFile = path.join(sourceRoot, lesson.path);
    const information = await lstat(physicalFile);
    invariant(
      information.isFile() && !information.isSymbolicLink(),
      `Current Grade 4 L${lesson.lesson} XML is not a regular file`,
    );
    const physicalBytes = await readFile(physicalFile);
    invariant(
      physicalBytes.length === lesson.bytes && sha256(physicalBytes) === lesson.sha256,
      `Current Grade 4 L${lesson.lesson} XML physical identity drifted`,
    );
    verified.push({
      lessonNumber: lesson.lesson,
      canonicalXmlPath: lesson.path,
      canonicalTitle: lesson.titleDisplay,
      xmlSha256: lesson.sha256,
      xmlBytes: lesson.bytes,
      activePageReferenceCount: lesson.pageReferenceCount,
    });
  }
  return {
    catalogInput: {
      file: portable(root, lessonCatalogPath),
      sha256: sha256(lessonCatalogBytes),
      bytes: lessonCatalogBytes.length,
    },
    lessons: verified,
  };
}

function assertPrivacySafeAggregate(report) {
  const visit = (value, location) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${location}[${index}]`));
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      invariant(
        !FORBIDDEN_OUTPUT_KEY.test(key),
        `Privacy boundary rejected output key ${location}.${key}`,
      );
      visit(child, `${location}.${key}`);
    }
  };
  visit(report, "report");
  invariant(
    report.lessons.every(
      ({aggregates}) =>
        sameArray(Object.keys(aggregates).sort(), [
          "learningObjectiveRows",
          "metadataRows",
          "quizDefinitionRows",
          "structuredPageRows",
        ].sort()),
    ),
    "Aggregate output contains a raw or unapproved lesson field",
  );
}

function markdownCell(value) {
  return String(value ?? "")
    .replaceAll("|", "\\|")
    .replace(/[\r\n]+/gu, " ");
}

function renderMarkdown(report, jsonSha256) {
  const lines = [
    "# Grade 4 historical SQL aggregate course map",
    "",
    "The current 12 canonical Grade 4 lesson XML files are the sequence authority. The 2021-02-03 SQL snapshot is historical aggregate curriculum context only.",
    "",
    `- Historical course: ${report.historicalSqlCourse.courseName} (Course_ID ${report.historicalSqlCourse.courseId})`,
    `- Active historical lessons: ${report.totals.activeHistoricalLessons}`,
    `- Current XML page references: ${report.totals.currentXmlPageReferences}`,
    `- Historical metadata rows counted: ${report.totals.metadata}`,
    `- Historical structured page rows counted: ${report.totals.structuredPages}`,
    `- Historical structured quiz rows counted: ${report.totals.structuredQuizQuestions}`,
    `- Historical objective rows counted: ${report.totals.learningObjectives}`,
    `- Raw metadata/page/quiz/objective rows emitted: ${report.privacyBoundary.rawCurriculumRowsEmitted}`,
    `- JSON SHA-256: \`${jsonSha256}\``,
    "",
    "| Lesson | Current XML authority | Historical Lesson_ID | Historical title | Historical URL | Historical quiz URL | Metadata | Pages | Quiz | Objectives |",
    "|---:|---|---:|---|---|---|---:|---:|---:|---:|",
  ];
  for (const lesson of report.lessons) {
    lines.push(
      `| ${lesson.lessonNumber} | ${markdownCell(lesson.currentSequenceAuthority.canonicalXmlPath)} | ${lesson.historicalLessonId} | ${markdownCell(lesson.title)} | ${markdownCell(lesson.url)} | ${markdownCell(lesson.quizUrl)} | ${lesson.aggregates.metadataRows} | ${lesson.aggregates.structuredPageRows} | ${lesson.aggregates.quizDefinitionRows} | ${lesson.aggregates.learningObjectiveRows} |`,
    );
  }
  lines.push(
    "",
    "Counts are aggregate-only. SQL paths and titles do not prove source-byte identity, page order, runtime behavior, Flash fidelity, language/audio correctness, review, acceptance, strict completion, or publication.",
    "",
  );
  return lines.join("\n");
}

async function writeOrCheck(file, bytes, check, label) {
  if (check) {
    const existing = await readFile(file);
    invariant(existing.equals(bytes), `${label} is stale`);
    return;
  }
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, bytes, {mode: 0o600});
}

export async function buildG4SqlCourseAggregate({
  root = PROJECT_ROOT,
  sqlRoot = DEFAULT_SQL_ROOT,
  sourceRoot = path.join(root, SOURCE_ROOT_RELATIVE),
  tableCatalogPath = path.join(root, TABLE_CATALOG_RELATIVE),
  lessonCatalogPath = path.join(root, LESSON_CATALOG_RELATIVE),
  generatorPath = SCRIPT_PATH,
  tableDefinitions = APPROVED_TABLE_DEFINITIONS,
  jsonOutput = path.join(root, DEFAULT_JSON_RELATIVE),
  markdownOutput = path.join(root, DEFAULT_MARKDOWN_RELATIVE),
  check = false,
} = {}) {
  validateTableDefinitions(tableDefinitions);
  const [tableCatalogBytes, generatorBytes, currentAuthority] = await Promise.all([
    readFile(tableCatalogPath),
    readFile(generatorPath),
    loadCurrentLessonAuthority({root, sourceRoot, lessonCatalogPath}),
  ]);
  const catalogRows = parseCsv(tableCatalogBytes.toString("utf8"));
  const loaded = [];
  for (const descriptor of tableDefinitions) {
    loaded.push(await loadSqlTable({sqlRoot, catalogRows, descriptor}));
  }
  invariant(
    loaded.length === APPROVED_TABLE_DEFINITIONS.length,
    "Unexpected SQL table read count",
  );
  const byName = new Map(loaded.map((table) => [table.table, table]));
  const courseRows = byName
    .get("dbo.Courses")
    .rows.filter(({Course_ID}) => Course_ID === COURSE_ID);
  invariant(
    courseRows.length === 1 &&
      courseRows[0].Is_Active === true &&
      courseRows[0].No_Of_Lessons === EXPECTED_LESSON_COUNT,
    "Historical SQL Course_ID 5 is missing, inactive, duplicated, or not a 12-lesson course",
  );
  const lessonRows = byName
    .get("dbo.Lessons")
    .rows.filter(({Course_ID, Is_Active}) => Course_ID === COURSE_ID && Is_Active === true)
    .sort((left, right) => left.Lesson_number - right.Lesson_number);
  invariant(
    lessonRows.length === EXPECTED_LESSON_COUNT,
    "Historical SQL Course_ID 5 does not contain exactly 12 active lessons",
  );
  invariant(
    lessonRows.every(({Lesson_number}, index) => Lesson_number === index + 1),
    "Historical SQL active lessons are not a unique 1..12 Lesson_number sequence",
  );
  invariant(
    new Set(lessonRows.map(({Lesson_ID}) => Lesson_ID)).size === EXPECTED_LESSON_COUNT,
    "Historical SQL active lesson IDs are not unique",
  );

  const lessonIds = new Set(lessonRows.map(({Lesson_ID}) => Lesson_ID));
  const metadataCounts = countByLesson(
    byName.get("dbo.MetaData").rows,
    "Lesson_ID",
    lessonIds,
  );
  const pageCounts = countByLesson(
    byName.get("dbo.ssm_LessonsPages").rows,
    "LessonId",
    lessonIds,
  );
  const quizCounts = countByLesson(
    byName.get("dbo.ssm_QuizQuestions").rows,
    "LessonId",
    lessonIds,
  );
  const objectiveCounts = countByLesson(
    byName.get("dbo.LearningObjectives").rows,
    "Lesson_ID",
    lessonIds,
  );

  const currentByNumber = new Map(
    currentAuthority.lessons.map((lesson) => [lesson.lessonNumber, lesson]),
  );
  const lessons = lessonRows.map((historical) => {
    const current = currentByNumber.get(historical.Lesson_number);
    invariant(current, `Current Grade 4 L${historical.Lesson_number} XML authority is absent`);
    const historicalCanonicalUrl = normalizedCanonicalHistoricalUrl(historical.url);
    return {
      historicalLessonId: historical.Lesson_ID,
      lessonNumber: historical.Lesson_number,
      title: historical.Lesson_Title,
      url: historical.url,
      quizUrl: historical.Quiz_url,
      isActive: historical.Is_Active,
      aggregates: {
        metadataRows: metadataCounts.get(historical.Lesson_ID),
        structuredPageRows: pageCounts.get(historical.Lesson_ID),
        quizDefinitionRows: quizCounts.get(historical.Lesson_ID),
        learningObjectiveRows: objectiveCounts.get(historical.Lesson_ID),
      },
      currentSequenceAuthority: current,
      alignment: {
        historicalUrlMatchesCurrentCanonicalXml:
          historicalCanonicalUrl === current.canonicalXmlPath,
        historicalTitleMatchesCurrentCatalog:
          historical.Lesson_Title === current.canonicalTitle,
        sqlStructuredPageCountMatchesCurrentXmlPageReferences:
          pageCounts.get(historical.Lesson_ID) === current.activePageReferenceCount,
        pathOrTitleMatchProvesBinaryIdentity: false,
      },
    };
  });

  const sum = (selector) => lessons.reduce((total, lesson) => total + selector(lesson), 0);
  const course = courseRows[0];
  const report = {
    schemaVersion: 1,
    reportType: "g4-privacy-safe-historical-sql-course-aggregate",
    status: "historical-aggregate-context-only-current-xml-sequence-authority",
    sourceSnapshotDate: "2021-02-03",
    identity: {
      historicalCourseId: COURSE_ID,
      grade: GRADE,
      lessonCount: EXPECTED_LESSON_COUNT,
    },
    inputs: {
      repositoryTableCatalog: {
        file: portable(root, tableCatalogPath),
        sha256: sha256(tableCatalogBytes),
        bytes: tableCatalogBytes.length,
      },
      currentLessonCatalog: currentAuthority.catalogInput,
      generator: {
        file: path.basename(generatorPath),
        sha256: sha256(generatorBytes),
        bytes: generatorBytes.length,
      },
      sqlTables: loaded.map(({table, objectId, projectedFields, source}) => ({
        table,
        objectId,
        projectedFields,
        source,
      })),
    },
    privacyBoundary: {
      approvedSqlTablesRead: loaded.map(({table}) => table),
      approvedSqlTableCount: loaded.length,
      requiredDomain: "course_content_taxonomy",
      requiredSensitivity: "content_metadata",
      requiredSensitiveNamedColumnCount: 0,
      explicitFieldProjectionOnly: true,
      restrictedSqlTablesRead: 0,
      rawCurriculumRowsEmitted: 0,
      personalRecordsEmitted: 0,
      sourceAbsolutePathsEmitted: 0,
    },
    sequenceAuthority: {
      authority: "current 12 canonical Grade 4 lesson XML files",
      historicalSqlIsSequenceAuthority: false,
      lessonNumbers: Array.from({length: EXPECTED_LESSON_COUNT}, (_, index) => index + 1),
      statement:
        "The current hash-bound Grade 4 L1-L12 index.xml files and their catalog records are the sequence authority. SQL Lesson_number and URLs are 2021 historical aggregate context only.",
    },
    historicalSqlCourse: {
      courseId: course.Course_ID,
      courseName: course.Course_Name,
      declaredLessonCount: course.No_Of_Lessons,
      displayOrder: course.Display_Order,
      isActive: course.Is_Active,
      historicalIndexSwf: course.indexswf,
    },
    lessons,
    totals: {
      activeHistoricalLessons: lessons.length,
      currentXmlPageReferences: sum(
        ({currentSequenceAuthority}) => currentSequenceAuthority.activePageReferenceCount,
      ),
      metadata: sum(({aggregates}) => aggregates.metadataRows),
      structuredPages: sum(({aggregates}) => aggregates.structuredPageRows),
      structuredQuizQuestions: sum(({aggregates}) => aggregates.quizDefinitionRows),
      learningObjectives: sum(({aggregates}) => aggregates.learningObjectiveRows),
    },
    alignmentSummary: {
      historicalUrlsMatchingCurrentXml: lessons.filter(
        ({alignment}) => alignment.historicalUrlMatchesCurrentCanonicalXml,
      ).length,
      historicalTitlesMatchingCurrentCatalog: lessons.filter(
        ({alignment}) => alignment.historicalTitleMatchesCurrentCatalog,
      ).length,
      sqlPageCountsMatchingCurrentXmlPageReferences: lessons.filter(
        ({alignment}) => alignment.sqlStructuredPageCountMatchesCurrentXmlPageReferences,
      ).length,
      placementPathMatchIsByteIdentity: false,
    },
    authorityBoundary: {
      historicalAggregateContext: true,
      currentXmlSequenceAuthority: true,
      historicalSqlSequenceAuthority: false,
      runtimeEffect: false,
      fidelityEffect: false,
      audioEffect: false,
      humanReviewEffect: false,
      ownerAcceptanceEffect: false,
      strictCompletionEffect: false,
      publicationEffect: false,
      canonicalSourcePromotionEffect: false,
    },
  };
  assertPrivacySafeAggregate(report);
  const jsonBytes = Buffer.from(stableJson(report));
  const jsonSha = sha256(jsonBytes);
  const markdownBytes = Buffer.from(renderMarkdown(report, jsonSha));
  await writeOrCheck(jsonOutput, jsonBytes, check, "Grade 4 SQL aggregate JSON");
  await writeOrCheck(
    markdownOutput,
    markdownBytes,
    check,
    "Grade 4 SQL aggregate Markdown",
  );
  return {
    report,
    outputs: {
      json: {
        file: portable(root, jsonOutput),
        sha256: jsonSha,
        bytes: jsonBytes.length,
      },
      markdown: {
        file: portable(root, markdownOutput),
        sha256: sha256(markdownBytes),
        bytes: markdownBytes.length,
      },
    },
  };
}

function parseArguments(argv) {
  const options = {check: false};
  let selectedMode = null;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check" || value === "--write") {
      invariant(selectedMode === null, "Choose exactly one of --write or --check");
      selectedMode = value;
      options.check = value === "--check";
    } else if (value === "--sql-root") {
      const supplied = argv[++index];
      invariant(supplied, "--sql-root requires a path");
      options.sqlRoot = path.resolve(supplied);
    } else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(
      "Usage: node scripts/build-g4-sql-course-aggregate.mjs [--write|--check] [--sql-root <path>]",
    );
    return;
  }
  const result = await buildG4SqlCourseAggregate(options);
  console.log(
    JSON.stringify(
      {
        status: options.check ? "checked" : "built",
        totals: result.report.totals,
        alignmentSummary: result.report.alignmentSummary,
        privacyBoundary: result.report.privacyBoundary,
        outputs: result.outputs,
      },
      null,
      2,
    ),
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
