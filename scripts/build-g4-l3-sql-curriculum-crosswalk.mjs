#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEFAULT_SQL_ROOT =
  "/Volumes/WestWorld/HELP MATH Related Files/Extracted_NewHelpProgram_20210203";
const DEFAULT_JSON = path.join(ROOT, "reports", "g4-l3-sql-curriculum-crosswalk.json");
const DEFAULT_MARKDOWN = path.join(ROOT, "reports", "g4-l3-sql-curriculum-crosswalk.md");
const TABLE_CATALOG = path.join(ROOT, "catalog", "newhelpprogram-20210203-tables.csv");
const RELEASE_CATALOG = path.join(ROOT, "catalog", "lesson-releases.json");
const RELEASE_ID = "lesson-g04-l03-negative-numbers";
const COURSE_ID = 5;
const LESSON_ID = 49;

const TABLES = Object.freeze([
  {name: "dbo.Courses", objectId: "784721848", file: "T_784721848.jsonl.gz", idField: "Course_ID", idValue: COURSE_ID,
    fields: ["Course_ID", "Course_Name", "Course_Desc", "No_Of_Lessons", "Display_Order", "Is_Active", "indexswf"]},
  {name: "dbo.Lessons", objectId: "912722304", file: "T_912722304.jsonl.gz", idField: "Lesson_ID", idValue: LESSON_ID,
    fields: ["Lesson_ID", "Course_ID", "Lesson_Title", "Lesson_Desc", "url", "Quiz_url", "Is_Active", "Date_Modified", "Lesson_number", "Lesson_Type"]},
  {name: "dbo.MetaData", objectId: "1040722760", file: "T_1040722760.jsonl.gz", idField: "Lesson_ID", idValue: LESSON_ID,
    fields: ["Meta_ID", "Lesson_ID", "Section", "Title", "Major", "Detailed", "swf"]},
  {name: "dbo.ssm_LessonsPages", objectId: "61243273", file: "T_61243273.jsonl.gz", idField: "LessonId", idValue: LESSON_ID,
    fields: ["Id", "LessonId", "Section", "PageNumber", "PageTitle", "ConstructedResponse", "FlashFileName"]},
  {name: "dbo.ssm_QuizQuestions", objectId: "125243501", file: "T_125243501.jsonl.gz", idField: "LessonId", idValue: LESSON_ID,
    fields: ["Id", "LessonId", "QuestionNumber", "ConstructedResponse", "FlashFileName"]},
  {name: "dbo.LearningObjectives", objectId: "896722247", file: "T_896722247.jsonl.gz", idField: "Lesson_ID", idValue: LESSON_ID,
    fields: ["Index_ID", "LearningObj", "Section", "Lesson_ID"]},
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function portable(root, file) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  invariant(relative && !relative.startsWith("../") && !path.isAbsolute(relative), `${file} escapes the project root`);
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
  const [header, ...body] = rows;
  return body.map((values) => Object.fromEntries(header.map((name, index) => [name, values[index] ?? ""])));
}

export function projectWhitelistedFields(row, fields) {
  invariant(row && typeof row === "object" && !Array.isArray(row), "SQL curriculum row must be an object");
  return Object.fromEntries(fields.map((field) => [field, Object.hasOwn(row, field) ? row[field] : null]));
}

function parseJsonLines(bytes, label) {
  const text = gunzipSync(bytes).toString("utf8");
  const rows = [];
  for (const [index, line] of text.split(/\r?\n/u).entries()) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line));
    } catch (error) {
      throw new Error(`${label} line ${index + 1} is not valid JSON: ${error.message}`);
    }
  }
  return rows;
}

async function loadTable({sqlRoot, catalogRows, descriptor}) {
  const catalog = catalogRows.find((row) => row.object_id === descriptor.objectId
    && row.qualified_table === descriptor.name);
  invariant(catalog, `${descriptor.name} is missing from the repository SQL table catalog`);
  invariant(catalog.domain === "course_content_taxonomy" && catalog.priority === "high"
    && catalog.sensitivity === "content_metadata" && Number(catalog.sensitive_named_column_count) === 0,
  `${descriptor.name} is not approved for this privacy-safe curriculum crosswalk`);
  const expectedRelative = `extracted_NewHelpProgram_20210203/04_data_jsonl_gzip/data/${descriptor.file}`;
  invariant(catalog.readable_jsonl_path === expectedRelative, `${descriptor.name} catalog path drifted`);
  const file = path.join(sqlRoot, expectedRelative);
  const information = await lstat(file);
  invariant(information.isFile() && !information.isSymbolicLink(), `${descriptor.name} JSONL source is not a regular file`);
  const bytes = await readFile(file);
  const allRows = parseJsonLines(bytes, descriptor.name);
  const selected = allRows
    .filter((row) => row[descriptor.idField] === descriptor.idValue)
    .map((row) => projectWhitelistedFields(row, descriptor.fields));
  return {
    table: descriptor.name,
    objectId: descriptor.objectId,
    source: {
      catalogRelativePath: expectedRelative,
      sha256: sha256(bytes),
      bytes: bytes.length,
      rowCountDeclared: Number(catalog.row_count),
      sensitivity: catalog.sensitivity,
      sensitiveNamedColumnCount: Number(catalog.sensitive_named_column_count),
    },
    selectedRows: selected,
  };
}

function basename(value) {
  return typeof value === "string" && value ? path.posix.basename(value.replaceAll("\\", "/")) : null;
}

function groupByBasename(rows, field) {
  const map = new Map();
  for (const row of rows) {
    const key = basename(row[field]);
    if (!key) continue;
    const list = map.get(key) || [];
    list.push(row);
    map.set(key, list);
  }
  return map;
}

async function writeOrCheck(file, bytes, check, label) {
  if (check) {
    const existing = await readFile(file);
    invariant(existing.equals(bytes), `${label} is stale`);
    return;
  }
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, bytes);
}

export async function buildG4L3SqlCurriculumCrosswalk({
  root = ROOT,
  sqlRoot = DEFAULT_SQL_ROOT,
  jsonOutput = path.join(root, path.relative(ROOT, DEFAULT_JSON)),
  markdownOutput = path.join(root, path.relative(ROOT, DEFAULT_MARKDOWN)),
  check = false,
} = {}) {
  const [tableCatalogBytes, releaseBytes, generatorBytes] = await Promise.all([
    readFile(path.join(root, path.relative(ROOT, TABLE_CATALOG))),
    readFile(path.join(root, path.relative(ROOT, RELEASE_CATALOG))),
    readFile(path.join(root, "scripts", "build-g4-l3-sql-curriculum-crosswalk.mjs")),
  ]);
  const catalogRows = parseCsv(tableCatalogBytes.toString("utf8"));
  const releaseCatalog = JSON.parse(releaseBytes);
  const release = releaseCatalog.releases.find(({releaseId}) => releaseId === RELEASE_ID);
  invariant(release?.expectedCounts?.members === 40 && release.members?.length === 40,
    "G4 L3 release authority is not the expected 39 pages plus one shell");

  const loaded = [];
  for (const descriptor of TABLES) loaded.push(await loadTable({sqlRoot, catalogRows, descriptor}));
  const byName = new Map(loaded.map((table) => [table.table, table]));
  const course = byName.get("dbo.Courses").selectedRows;
  const lesson = byName.get("dbo.Lessons").selectedRows;
  invariant(course.length === 1 && course[0].Course_ID === COURSE_ID && course[0].Is_Active === true,
    "historical SQL course 5 is missing or inactive");
  invariant(lesson.length === 1 && lesson[0].Lesson_ID === LESSON_ID && lesson[0].Course_ID === COURSE_ID
    && lesson[0].Is_Active === true && lesson[0].url === "ELMGR4/L3/index.xml",
  "historical SQL G4 L3 lesson identity drifted");

  const pageRows = byName.get("dbo.ssm_LessonsPages").selectedRows;
  const metadataRows = byName.get("dbo.MetaData").selectedRows;
  const pageIndex = groupByBasename(pageRows, "FlashFileName");
  const metadataIndex = groupByBasename(metadataRows, "swf");
  const pageMembers = release.members.filter(({releaseRole}) => releaseRole === "active-xml-referenced-page");
  const memberCrosswalk = pageMembers.map((member) => {
    const sourceBasename = basename(member.source.path);
    const structuredPages = pageIndex.get(sourceBasename) || [];
    const metadata = metadataIndex.get(sourceBasename) || [];
    return {
      ordinal: member.ordinal,
      animationId: member.animationId,
      canonicalSource: member.source,
      historicalSql: {
        structuredPages,
        metadata,
        matchMethod: structuredPages.length || metadata.length
          ? "unique SWF basename within exact historical Lesson_ID 49 rows"
          : "no historical SQL curriculum-row match",
        pathIdentityProven: false,
        binaryIdentityProven: false,
      },
    };
  });
  const matched = memberCrosswalk.filter(({historicalSql}) => historicalSql.structuredPages.length || historicalSql.metadata.length);
  const sqlBasenames = new Set([...pageIndex.keys(), ...metadataIndex.keys()]);
  const releaseBasenames = new Set(pageMembers.map(({source}) => basename(source.path)));
  const unmatchedSqlBasenames = [...sqlBasenames].filter((value) => !releaseBasenames.has(value)).sort();

  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-privacy-safe-historical-sql-curriculum-crosswalk",
    status: "historical-content-context-only-no-runtime-or-fidelity-authority",
    sourceSnapshotDate: "2021-02-03",
    identity: {
      releaseId: RELEASE_ID,
      historicalCourseId: COURSE_ID,
      historicalLessonId: LESSON_ID,
      canonicalLessonXml: release.sourceLesson,
    },
    inputs: {
      repositoryTableCatalog: {file: portable(root, path.join(root, path.relative(ROOT, TABLE_CATALOG))),
        sha256: sha256(tableCatalogBytes), bytes: tableCatalogBytes.length},
      releaseCatalog: {file: portable(root, path.join(root, path.relative(ROOT, RELEASE_CATALOG))),
        sha256: sha256(releaseBytes), bytes: releaseBytes.length},
      generator: {file: "scripts/build-g4-l3-sql-curriculum-crosswalk.mjs", sha256: sha256(generatorBytes),
        bytes: generatorBytes.length},
      tables: loaded.map(({table, objectId, source}) => ({table, objectId, source})),
    },
    privacyBoundary: {
      allowedDomain: "course_content_taxonomy",
      requiredSensitivity: "content_metadata",
      requiredSensitiveNamedColumnCount: 0,
      projectedFieldsOnly: true,
      accountOrganizationActivityCredentialOrNoteTablesRead: 0,
      personalRecordsWritten: 0,
      rawRowsCopied: 0,
      statement: "Only six catalog-approved content-metadata tables were read, and only explicit curriculum fields for Course_ID 5 / Lesson_ID 49 are retained.",
    },
    historicalContent: {
      course: course[0],
      lesson: lesson[0],
      metadataRows,
      structuredPageRows: pageRows,
      quizDefinitionRows: byName.get("dbo.ssm_QuizQuestions").selectedRows,
      learningObjectiveRows: byName.get("dbo.LearningObjectives").selectedRows,
    },
    memberCrosswalk,
    reconciliation: {
      canonicalActivePages: pageMembers.length,
      canonicalShells: 1,
      historicalStructuredPageRows: pageRows.length,
      historicalMetadataRows: metadataRows.length,
      canonicalPagesWithAnyHistoricalSqlMatch: matched.length,
      canonicalPagesWithoutHistoricalSqlMatch: memberCrosswalk
        .filter(({historicalSql}) => !historicalSql.structuredPages.length && !historicalSql.metadata.length)
        .map(({animationId}) => animationId),
      historicalSqlAssetBasenamesWithoutCanonicalMember: unmatchedSqlBasenames,
      canonicalSequenceAuthority: "index.xml and catalog/lesson-releases.json",
      sqlSequenceAuthority: false,
    },
    authorityBoundary: {
      historicalCurriculumContext: true,
      currentProductionTruth: false,
      sourceBinaryAuthority: false,
      originalRuntimeAuthority: false,
      visualOrBehavioralFidelity: false,
      audioAcceptance: false,
      humanOrOwnerAcceptance: false,
      strictCompletion: false,
      publication: false,
    },
  };
  const jsonBytes = Buffer.from(stableJson(report));
  const jsonSha = sha256(jsonBytes);
  const markdown = [
    "# G4 L3 historical SQL curriculum crosswalk",
    "",
    "This privacy-safe report uses only content-metadata rows for historical Course 5 / Lesson 49.",
    "The current `index.xml` and release catalog remain authoritative for the 39-page sequence.",
    "",
    `- Canonical pages: ${pageMembers.length}`,
    `- Historical structured page rows: ${pageRows.length}`,
    `- Historical metadata rows: ${metadataRows.length}`,
    `- Canonical pages with a historical SQL match: ${matched.length}`,
    `- Raw account/activity/credential/note tables read: 0`,
    `- JSON SHA-256: \`${jsonSha}\``,
    "",
    "A basename match reconciles a historical path reference only. It does not prove byte identity, runtime behavior, fidelity, audio, review, acceptance, or release readiness.",
    "",
  ].join("\n");
  await writeOrCheck(jsonOutput, jsonBytes, check, "G4 L3 SQL curriculum crosswalk JSON");
  await writeOrCheck(markdownOutput, Buffer.from(markdown), check, "G4 L3 SQL curriculum crosswalk Markdown");
  return {report, json: {file: portable(root, jsonOutput), sha256: jsonSha, bytes: jsonBytes.length}};
}

function parseArguments(argv) {
  const options = {check: false};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--sql-root") options.sqlRoot = path.resolve(argv[++index] || invariant(false, "--sql-root requires a path"));
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log("Usage: node scripts/build-g4-l3-sql-curriculum-crosswalk.mjs [--check] [--sql-root <path>]");
    return;
  }
  const result = await buildG4L3SqlCurriculumCrosswalk(options);
  console.log(JSON.stringify({status: options.check ? "checked" : "built", reconciliation: result.report.reconciliation,
    privacyBoundary: result.report.privacyBoundary, report: result.json}, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
