#!/usr/bin/env node

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_SOURCE =
  "/Volumes/WestWorld/HELP MATH Related Files/Extracted_NewHelpProgram_20210203";
const DEFAULT_OUTPUT = path.resolve(
  "catalog/newhelpprogram-20210203-files.csv",
);
const DEFAULT_TABLE_OUTPUT = path.resolve(
  "catalog/newhelpprogram-20210203-tables.csv",
);

const CONTENT_TABLES = new Set([
  "Courses",
  "Languages",
  "LearningObjectives",
  "Lessons",
  "MetaData",
  "ssm_DetailedSkills",
  "ssm_Grades",
  "ssm_Interactives",
  "ssm_LessonsPages",
  "ssm_ManipulativePractices",
  "ssm_Metatags",
  "ssm_QuizQuestions",
  "ssm_Standards",
  "ssm_Tools",
]);

const ORGANIZATION_TABLES = new Set([
  "Admin",
  "Classes",
  "ClassEnrollment",
  "DemoUserLogins",
  "DemoUsers",
  "Districts",
  "PJAdmins",
  "PJAdmin_Assignments",
  "Schools",
  "States",
  "Students",
  "Teachers",
  "TrialUsers",
]);

const BEHAVIOR_TABLES = new Set([
  "Bookmarks",
  "Clicks_Global",
  "LoginLogout",
  "Notepad",
  "Teacher_LoginLogout",
  "TimeInTask",
  "TrainingRecordings",
  "TrainingRecordingsUsage",
  "clicktype",
  "studentnotes",
]);

const ASSESSMENT_TABLES = new Set([
  "Completed_AdaptiveTests",
  "Completed_Lessons",
  "Completed_Tests",
  "CustomPreAndPostTestsQuestions",
  "DCCRecommendations",
  "DCCRecPrescriptions",
  "DCCRecStandards",
  "PreAndPostTests",
  "PreAndPostTestsQuestions",
  "PreAndPostTestsQuestions_2",
  "PreAndPostTests_2",
  "PrePostDistricts",
  "PrePostDistricts_1",
  "QuestionAnswered",
  "Quizes",
  "X_PreAndPostTestsQuestions",
]);

const DEFINITION_TABLES = new Set([
  "CustomPreAndPostTestsQuestions",
  "DCCRecommendations",
  "DCCRecPrescriptions",
  "DCCRecStandards",
  "PreAndPostTests",
  "PreAndPostTestsQuestions",
  "PreAndPostTestsQuestions_2",
  "PreAndPostTests_2",
  "PrePostDistricts",
  "PrePostDistricts_1",
  "X_PreAndPostTestsQuestions",
]);

const TEMP_TABLES = new Set([
  "PostTestsQuestionsTemp",
  "PreTestsQuestionsTemp",
  "Sample",
  "Student$",
  "Student_Form$",
  "instu$",
  "sin",
  "stin",
  "tin",
]);

const ASSIGNMENT_TABLES = new Set([
  "Class_Lesson_Assignments",
  "Class_Lesson_Assignments_Attributes",
  "CourseActivations",
  "CourseActivationsSchools",
  "DemoUser_Assignments",
  "DemoUser_Bookmarks",
  "Student_Lesson_Assignments",
  "Student_Lesson_Assignments_Attributes",
]);

const SENSITIVE_COLUMN_PATTERN =
  /(?:password|login|email|phone|address|firstname|lastname|middle|birthday|zipcode|notes?)/i;

function parseArgs(argv) {
  const result = {
    source: DEFAULT_SOURCE,
    output: DEFAULT_OUTPUT,
    tableOutput: DEFAULT_TABLE_OUTPUT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--source") {
      result.source = path.resolve(argv[++index]);
    } else if (argument === "--output") {
      result.output = path.resolve(argv[++index]);
    } else if (argument === "--table-output") {
      result.tableOutput = path.resolve(argv[++index]);
    } else if (argument === "--help") {
      process.stdout.write(
        [
          "Usage: node scripts/build-newhelpprogram-catalog.mjs [options]",
          "",
          `  --source <path>        Source folder (default: ${DEFAULT_SOURCE})`,
          `  --output <path>        File catalog CSV (default: ${DEFAULT_OUTPUT})`,
          `  --table-output <path>  Table catalog CSV (default: ${DEFAULT_TABLE_OUTPUT})`,
          "",
        ].join("\n"),
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return result;
}

async function walkFiles(root) {
  const files = [];

  async function visit(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));

    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(absolutePath);
      } else if (entry.isFile() || entry.isSymbolicLink()) {
        files.push(absolutePath);
      }
    }
  }

  await visit(root);
  return files;
}

function parseTabular(text, delimiter = "\t", skipSeparator = true) {
  const lines = text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = lines[0].split(delimiter);
  const dataLines =
    skipSeparator && lines[1]?.split(delimiter).every((value) => /^-+$/.test(value))
      ? lines.slice(2)
      : lines.slice(1);

  return dataLines.map((line) => {
    const values = line.split(delimiter);
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
  });
}

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(rows, columns) {
  return [
    columns.map(csvCell).join(","),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")),
    "",
  ].join("\n");
}

function domainForTable(tableName) {
  if (CONTENT_TABLES.has(tableName) || tableName.startsWith("ssm_X")) {
    return "course_content_taxonomy";
  }
  if (ORGANIZATION_TABLES.has(tableName)) {
    return "accounts_organizations_classes";
  }
  if (BEHAVIOR_TABLES.has(tableName)) {
    return "behavior_session_notes";
  }
  if (ASSESSMENT_TABLES.has(tableName)) {
    return "assessment_outcomes_recommendations";
  }
  if (TEMP_TABLES.has(tableName)) {
    return "legacy_temp_import";
  }
  if (ASSIGNMENT_TABLES.has(tableName)) {
    return "assignments_activation_configuration";
  }
  return "system_reference_other";
}

function tableAssessment(tableName, domain, sensitiveColumnCount) {
  if (domain === "course_content_taxonomy") {
    return {
      priority: "high",
      sensitivity:
        sensitiveColumnCount > 0 ? "review_columns_before_use" : "content_metadata",
      recommendedUse:
        "Recover course structure, lesson/page order, bilingual taxonomy, learning objectives, standards, and legacy asset references.",
    };
  }

  if (
    domain === "assessment_outcomes_recommendations" &&
    DEFINITION_TABLES.has(tableName)
  ) {
    return {
      priority: "high",
      sensitivity:
        sensitiveColumnCount > 0 ? "restricted_review" : "assessment_content",
      recommendedUse:
        "Recover assessment definitions, bilingual question content, recommendation rules, and diagnostic mappings after editorial review.",
    };
  }

  if (
    domain === "assessment_outcomes_recommendations" ||
    domain === "behavior_session_notes"
  ) {
    return {
      priority: "restricted_high",
      sensitivity: "student_activity_or_outcome_data",
      recommendedUse:
        "Use only for de-identified aggregate analysis and to design the HELP Math 2.0 event, mastery, progress, and reporting models.",
    };
  }

  if (domain === "assignments_activation_configuration") {
    return {
      priority: "restricted_medium",
      sensitivity: "student_teacher_or_school_links",
      recommendedUse:
        "Use the schema and aggregate relationships to design assignment, activation, and roster workflows; do not import raw historical links by default.",
    };
  }

  if (domain === "accounts_organizations_classes") {
    return {
      priority: "schema_only",
      sensitivity: "direct_identifiers_or_credentials",
      recommendedUse:
        "Use only as a legacy entity-model reference for districts, schools, classes, teachers, students, and enrollment; do not migrate credentials or personal records.",
    };
  }

  if (domain === "legacy_temp_import") {
    return {
      priority: "reference_only",
      sensitivity: "mixed_legacy_or_personal_data",
      recommendedUse:
        "Treat as duplicate, staging, or import-era data until reconciled with authoritative content tables; exclude from direct migration.",
    };
  }

  return {
    priority: "reference_only",
    sensitivity:
      sensitiveColumnCount > 0 ? "review_columns_before_use" : "low_or_unknown",
    recommendedUse:
      "Retain for provenance and inspect only when a concrete HELP Math 2.0 requirement depends on it.",
  };
}

function classifyFile(relativePath, table) {
  const normalized = relativePath.replaceAll(path.sep, "/");
  const basename = path.posix.basename(normalized);
  const extension =
    basename.includes(".") ? basename.slice(basename.lastIndexOf(".") + 1).toLowerCase() : "";

  if (basename === ".DS_Store" || extension === "pyc") {
    return {
      category: "generated_system_file",
      priority: "low",
      sensitivity: "none",
      useful: "Not useful for HELP Math 2.0; safe to exclude from future archival packages.",
    };
  }

  if (normalized === "NewHelpProgram_20210203.bak") {
    return {
      category: "original_sql_server_backup",
      priority: "critical_archive",
      sensitivity: "restricted_complete_database",
      useful: "Preserve as immutable recovery evidence; do not deploy or commit it to application or public repositories.",
    };
  }

  if (normalized === "analysis/analysis_results.json") {
    return {
      category: "aggregate_privacy_safe_analysis",
      priority: "high",
      sensitivity: "aggregate_only",
      useful: "Best first machine-readable summary of content, assessment, activity, integrity, and privacy findings.",
    };
  }

  if (
    normalized === "analysis/NewHelpProgram_content_audit.ipynb" ||
    normalized === "analysis/newhelp_content_audit.py"
  ) {
    return {
      category: "aggregate_analysis_reproduction",
      priority: "high",
      sensitivity: "code_only",
      useful: "Reproduces the aggregate-only audit while intentionally suppressing personal values.",
    };
  }

  if (
    normalized === "analysis/report_artifact.json" ||
    normalized === "analysis/build_report_artifact.py"
  ) {
    return {
      category: "aggregate_report_source",
      priority: "high",
      sensitivity: "aggregate_only_or_code",
      useful: "Builds or stores the stakeholder-facing aggregate report source.",
    };
  }

  if (normalized.endsWith("/README_CN.md")) {
    return {
      category: "extraction_package_guide",
      priority: "high",
      sensitivity: "provenance_only",
      useful: "Authoritative package map, extraction facts, validation status, and recovery boundaries.",
    };
  }

  if (normalized.includes("/00_backup_assessment/")) {
    return {
      category: "backup_integrity_and_restore_evidence",
      priority: "high",
      sensitivity: "infrastructure_metadata",
      useful: "Establishes backup identity, SQL Server version, restore health, and DBCC integrity; not application content.",
    };
  }

  if (normalized.includes("/01_catalog/")) {
    const essentialCatalogs = new Set([
      "columns.tsv",
      "dependencies.tsv",
      "exact_row_counts.tsv",
      "foreign_key_columns.tsv",
      "foreign_keys.tsv",
      "modules.tsv",
      "table_storage.tsv",
      "tables.tsv",
      "tables_export.psv",
    ]);
    return {
      category: "database_structure_catalog",
      priority: essentialCatalogs.has(basename) ? "high" : "medium",
      sensitivity:
        /principal|permission|role/i.test(basename)
          ? "security_metadata"
          : "schema_metadata",
      useful: essentialCatalogs.has(basename)
        ? "Primary structural evidence for tables, columns, row counts, relationships, storage, and database logic."
        : "Supporting database schema, indexing, constraint, security, or inventory metadata.",
    };
  }

  if (normalized.includes("/02_schema/SqlProject/Security/")) {
    return {
      category: "legacy_database_security_schema",
      priority: "reference_only",
      sensitivity: "legacy_account_or_permission_names",
      useful: "Do not reuse directly; consult only to understand legacy database roles and least-privilege gaps.",
    };
  }

  if (normalized.includes("/02_schema/")) {
    return {
      category: "database_schema_and_business_logic",
      priority: "high",
      sensitivity: "schema_may_reference_legacy_security",
      useful: "Recover table design, constraints, functions, views, procedures, and business rules for a clean HELP Math 2.0 redesign.",
    };
  }

  if (normalized.includes("/03_data_native/")) {
    if (normalized.includes("/data/")) {
      return {
        category: "native_bcp_table_data",
        priority: "critical_archive",
        sensitivity: "restricted_raw_table_data",
        useful: table
          ? `Lossless recovery copy of ${table.qualifiedName}; use only in an isolated migration environment.`
          : "Lossless database recovery data; use only in an isolated migration environment.",
      };
    }
    return {
      category: "native_bcp_support",
      priority: extension === "fmt" ? "medium" : "low",
      sensitivity: extension === "log" ? "operational_metadata" : "none",
      useful: "Supports lossless native BCP recovery and export verification.",
    };
  }

  if (normalized.includes("/04_data_jsonl_gzip/")) {
    if (normalized.includes("/data/")) {
      const assessment = table
        ? tableAssessment(table.tableName, table.domain, table.sensitiveColumnCount)
        : {
            priority: "restricted_medium",
            sensitivity: "restricted_raw_table_data",
            recommendedUse: "Readable raw table export; inspect only in a controlled environment.",
          };
      return {
        category: "readable_jsonl_table_data",
        priority: assessment.priority,
        sensitivity: assessment.sensitivity,
        useful: table
          ? `${table.qualifiedName}: ${assessment.recommendedUse}`
          : assessment.recommendedUse,
      };
    }
    return {
      category: "jsonl_export_support",
      priority: "low",
      sensitivity: extension === "log" ? "operational_metadata" : "none",
      useful: "Supports readable JSONL export verification; marker and empty error files are operational evidence.",
    };
  }

  if (normalized.includes("/05_validation/")) {
    return {
      category: "extraction_validation",
      priority: "high",
      sensitivity: "provenance_only",
      useful: "Confirms per-table counts and package hashes; use before relying on any extracted table.",
    };
  }

  if (normalized.includes("/scripts/")) {
    return {
      category: "extraction_reproduction_script",
      priority: "medium",
      sensitivity: "code_only",
      useful: "Documents and reproduces catalog, count, export, and validation procedures without stored database passwords.",
    };
  }

  return {
    category: "other",
    priority: "reference_only",
    sensitivity: "unknown",
    useful: "Retain for completeness; inspect before any downstream use.",
  };
}

function decodeShaManifestPath(value) {
  return value
    .replaceAll("\\\\", "\\")
    .replaceAll("\\n", "\n")
    .replaceAll("\\r", "\r");
}

async function readManifestedHashes(sourceRoot, extractedRootName) {
  const result = new Map();
  const manifestPath = path.join(
    sourceRoot,
    extractedRootName,
    "05_validation",
    "SHA256SUMS.txt",
  );
  const manifest = await fs.readFile(manifestPath, "utf8");

  for (const rawLine of manifest.split(/\r?\n/)) {
    if (!rawLine.trim()) continue;
    const line = rawLine.startsWith("\\") ? rawLine.slice(1) : rawLine;
    const match = line.match(/^([0-9a-f]{64}) [ *](.+)$/i);
    if (!match) continue;
    const manifestRelative = decodeShaManifestPath(match[2]);
    result.set(
      `${extractedRootName}/${manifestRelative.replaceAll(path.sep, "/")}`,
      match[1].toLowerCase(),
    );
  }

  const sourceHashPath = path.join(
    sourceRoot,
    extractedRootName,
    "00_backup_assessment",
    "source_bak.sha256",
  );
  const sourceHashText = await fs.readFile(sourceHashPath, "utf8");
  const sourceHash = sourceHashText.match(/[0-9a-f]{64}/i)?.[0];
  if (sourceHash) {
    result.set("NewHelpProgram_20210203.bak", sourceHash.toLowerCase());
  }

  return result;
}

function pathIdentity(relativePath) {
  return createHash("sha256").update(relativePath).digest("hex");
}

function displayPath(relativePath) {
  const normalized = relativePath.replaceAll(path.sep, "/");
  if (!normalized.includes("/02_schema/SqlProject/Security/")) return normalized;
  const directory = path.posix.dirname(normalized);
  return `${directory}/[redacted-security-object-${pathIdentity(normalized).slice(0, 12)}]`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceRoot = path.resolve(args.source);
  const sourceStat = await fs.stat(sourceRoot);
  if (!sourceStat.isDirectory()) {
    throw new Error(`Source is not a directory: ${sourceRoot}`);
  }

  const extractedRootName = "extracted_NewHelpProgram_20210203";
  const extractedRoot = path.join(sourceRoot, extractedRootName);
  const catalogRoot = path.join(extractedRoot, "01_catalog");

  const [tablesText, countsText, columnsText, files, manifestedHashes] =
    await Promise.all([
      fs.readFile(path.join(catalogRoot, "tables_export.psv"), "utf8"),
      fs.readFile(path.join(catalogRoot, "exact_row_counts.tsv"), "utf8"),
      fs.readFile(path.join(catalogRoot, "columns.tsv"), "utf8"),
      walkFiles(sourceRoot),
      readManifestedHashes(sourceRoot, extractedRootName),
    ]);

  const countRows = parseTabular(countsText);
  const countsByObjectId = new Map(
    countRows.map((row) => [row.object_id, Number(row.row_count)]),
  );
  const columns = parseTabular(columnsText);
  const columnsByObjectId = new Map();
  const sensitiveColumnsByObjectId = new Map();
  for (const column of columns) {
    columnsByObjectId.set(
      column.object_id,
      (columnsByObjectId.get(column.object_id) ?? 0) + 1,
    );
    if (SENSITIVE_COLUMN_PATTERN.test(column.column_name)) {
      sensitiveColumnsByObjectId.set(
        column.object_id,
        (sensitiveColumnsByObjectId.get(column.object_id) ?? 0) + 1,
      );
    }
  }

  const tableByObjectId = new Map();
  for (const line of tablesText.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const [objectId, qualifiedName, rowCountText] = line.split("|");
    const separatorIndex = qualifiedName.indexOf(".");
    const schemaName = qualifiedName.slice(0, separatorIndex);
    const tableName = qualifiedName.slice(separatorIndex + 1);
    tableByObjectId.set(objectId, {
      objectId,
      qualifiedName,
      schemaName,
      tableName,
      rowCount: countsByObjectId.get(objectId) ?? Number(rowCountText),
      columnCount: columnsByObjectId.get(objectId) ?? 0,
      sensitiveColumnCount: sensitiveColumnsByObjectId.get(objectId) ?? 0,
      domain: domainForTable(tableName),
    });
  }

  const fileRows = [];
  let totalBytes = 0;
  for (const absolutePath of files) {
    const stat = await fs.lstat(absolutePath);
    const relativePath = path.relative(sourceRoot, absolutePath);
    const normalized = relativePath.replaceAll(path.sep, "/");
    const objectId = path.basename(absolutePath).match(/^T_(\d+)\./)?.[1] ?? "";
    const table = objectId ? tableByObjectId.get(objectId) : null;
    const classification = classifyFile(normalized, table);
    totalBytes += stat.size;
    fileRows.push({
      relative_path: displayPath(normalized),
      path_sha256: pathIdentity(normalized),
      bytes: stat.size,
      modified_utc: stat.mtime.toISOString(),
      extension:
        path.basename(absolutePath).includes(".")
          ? path.extname(absolutePath).slice(1).toLowerCase()
          : "",
      category: classification.category,
      priority: classification.priority,
      sensitivity: classification.sensitivity,
      database_table: table?.qualifiedName ?? "",
      table_row_count: table?.rowCount ?? "",
      manifest_sha256: manifestedHashes.get(normalized) ?? "",
      integrity_evidence: manifestedHashes.has(normalized)
        ? "listed_in_existing_sha256_evidence"
        : "not_listed_in_existing_sha256_evidence",
      useful_for_help_math_2_0: classification.useful,
    });
  }

  fileRows.sort((left, right) =>
    left.relative_path.localeCompare(right.relative_path, "en"),
  );

  const tableRows = [...tableByObjectId.values()]
    .map((table) => {
      const assessment = tableAssessment(
        table.tableName,
        table.domain,
        table.sensitiveColumnCount,
      );
      return {
        object_id: table.objectId,
        qualified_table: table.qualifiedName,
        row_count: table.rowCount,
        column_count: table.columnCount,
        sensitive_named_column_count: table.sensitiveColumnCount,
        domain: table.domain,
        priority: assessment.priority,
        sensitivity: assessment.sensitivity,
        useful_for_help_math_2_0: assessment.recommendedUse,
        readable_jsonl_path: `${extractedRootName}/04_data_jsonl_gzip/data/T_${table.objectId}.jsonl.gz`,
        lossless_bcp_path: `${extractedRootName}/03_data_native/data/T_${table.objectId}.bcp`,
      };
    })
    .sort(
      (left, right) =>
        right.row_count - left.row_count ||
        left.qualified_table.localeCompare(right.qualified_table, "en"),
    );

  const fileColumns = [
    "relative_path",
    "path_sha256",
    "bytes",
    "modified_utc",
    "extension",
    "category",
    "priority",
    "sensitivity",
    "database_table",
    "table_row_count",
    "manifest_sha256",
    "integrity_evidence",
    "useful_for_help_math_2_0",
  ];
  const tableColumns = [
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

  await Promise.all([
    fs.mkdir(path.dirname(args.output), { recursive: true }),
    fs.mkdir(path.dirname(args.tableOutput), { recursive: true }),
  ]);
  await Promise.all([
    fs.writeFile(args.output, toCsv(fileRows, fileColumns), "utf8"),
    fs.writeFile(args.tableOutput, toCsv(tableRows, tableColumns), "utf8"),
  ]);

  process.stdout.write(
    `${JSON.stringify(
      {
        source: sourceRoot,
        files: fileRows.length,
        totalBytes,
        manifestedFiles: fileRows.filter((row) => row.manifest_sha256).length,
        tables: tableRows.length,
        totalRows: tableRows.reduce((sum, row) => sum + row.row_count, 0),
        fileCatalog: args.output,
        tableCatalog: args.tableOutput,
      },
      null,
      2,
    )}\n`,
  );
}

await main();
