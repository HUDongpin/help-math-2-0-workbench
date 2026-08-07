#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const GENERATOR_PATH =
  "scripts/build-g5-l5-missing-keyterm-recovery-readiness.mjs";
const RELEASE_ID = "lesson-g05-l05-add-subtract-negative-numbers";
const DEFAULT_OUTPUT_PREFIX =
  "reports/g5-l5-missing-keyterm-recovery-readiness";
const PRIVATE_ARCHIVE_ROOT =
  "/Volumes/WestWorld/HELP MATH Related Files/Historical Office Documents of HELP MATH Program";
const SQL_AGGREGATE_PATH =
  "/Volumes/WestWorld/HELP MATH Related Files/Extracted_NewHelpProgram_20210203/analysis/analysis_results.json";
const SHA256 = /^[a-f0-9]{64}$/;

const PROJECT_INPUTS = Object.freeze({
  sourceCatalog: "catalog/source-files.json",
  sourceGap: "reports/g5-l5-source-gap-forensics.json",
  technicalCrosswalk:
    "private-archive/historical-office-catalog-2026-07-25/technical-source-crosswalk.json",
  historicalFileCatalog:
    "private-archive/historical-office-catalog-2026-07-25/files.jsonl",
  sqlCatalog: "catalog/NEWHELPPROGRAM_20210203.md",
  sqlFileCatalog: "catalog/newhelpprogram-20210203-files.csv",
  sqlTableCatalog: "catalog/newhelpprogram-20210203-tables.csv",
});

const TARGETS = Object.freeze([
  {language: "english", basename: "L5KTE01.xml"},
  {language: "spanish", basename: "L5KTS01.xml"},
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function normalizedBasename(value) {
  return path.basename(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resolveProjectPath(projectRoot, relativePath, label) {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0,
    `${label}: path is empty`,
  );
  invariant(
    !path.isAbsolute(relativePath) && !relativePath.includes("\\"),
    `${label}: path must be project-relative and portable`,
  );
  const absolutePath = path.resolve(projectRoot, relativePath);
  invariant(
    isWithin(projectRoot, absolutePath),
    `${label}: path escapes the project root`,
  );
  invariant(
    portable(path.relative(projectRoot, absolutePath)) === relativePath,
    `${label}: path is not normalized`,
  );
  return absolutePath;
}

async function assertOrdinaryFile(absolutePath, label) {
  const metadata = await lstat(absolutePath).catch((error) => {
    throw new Error(`${label}: unavailable (${error.message})`);
  });
  invariant(
    metadata.isFile() &&
      !metadata.isSymbolicLink() &&
      metadata.nlink === 1,
    `${label}: expected one ordinary non-linked file`,
  );
  return metadata;
}

async function readAbsoluteFileRecord(absolutePath, allowedRoot, label) {
  const resolvedRoot = path.resolve(allowedRoot);
  const resolvedPath = path.resolve(absolutePath);
  invariant(
    isWithin(resolvedRoot, resolvedPath),
    `${label}: path escapes its allowed root`,
  );
  const before = await assertOrdinaryFile(resolvedPath, label);
  const [contents, realRoot, realFile] = await Promise.all([
    readFile(resolvedPath),
    realpath(resolvedRoot),
    realpath(resolvedPath),
  ]);
  invariant(
    isWithin(realRoot, realFile),
    `${label}: resolves outside its allowed root`,
  );
  const after = await assertOrdinaryFile(resolvedPath, label);
  invariant(
    before.dev === after.dev &&
      before.ino === after.ino &&
      before.mtimeMs === after.mtimeMs &&
      after.size === contents.length,
    `${label}: changed during read`,
  );
  return {
    absolutePath: resolvedPath,
    bytes: contents.length,
    sha256: sha256Bytes(contents),
    contents,
  };
}

export async function readFileRecord(
  projectRoot,
  relativePath,
  label = relativePath,
) {
  const resolvedRoot = path.resolve(projectRoot);
  const absolutePath = resolveProjectPath(resolvedRoot, relativePath, label);
  const record = await readAbsoluteFileRecord(
    absolutePath,
    resolvedRoot,
    label,
  );
  return {...record, path: relativePath};
}

async function readJsonRecord(projectRoot, relativePath, label) {
  const record = await readFileRecord(projectRoot, relativePath, label);
  try {
    return {
      ...record,
      document: JSON.parse(record.contents.toString("utf8")),
    };
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`);
  }
}

function publicDescriptor(record, sourceId, extra = {}) {
  return {
    sourceId,
    bytes: record.bytes,
    sha256: record.sha256,
    ...extra,
  };
}

function countToken(contents, token) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (contents.toString("utf8").match(new RegExp(escaped, "gi")) || [])
    .length;
}

function parseJsonLines(contents, label) {
  return contents.toString("utf8").split(/\r?\n/).filter(Boolean).map(
    (line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(
          `${label}: invalid JSONL row ${index + 1} (${error.message})`,
        );
      }
    },
  );
}

function validateSourceCatalog(document) {
  invariant(
    document?.schemaVersion === 1 &&
      document.fileCount === 7919 &&
      document.totalBytes === 2779928841 &&
      Array.isArray(document.files) &&
      document.files.length === document.fileCount &&
      SHA256.test(document.checksumSetSha256 || ""),
    "source catalog identity or completeness drifted",
  );
}

function validateSourceGap(document, sourceCatalogRecord) {
  invariant(
    document?.schemaVersion === 1 &&
      document.reportType === "lesson-release-source-gap-forensics" &&
      document.releaseId === RELEASE_ID &&
      document.evidenceState ===
        "static-source-forensics-only-runtime-and-content-gaps-fail-closed",
    "G5 L5 source-gap identity drifted",
  );
  invariant(
    document.inputs?.sourceCatalog?.bytes === sourceCatalogRecord.bytes &&
      document.inputs.sourceCatalog.sha256 === sourceCatalogRecord.sha256,
    "source-gap source-catalog binding drifted",
  );
  const declarations = document.keytermGap?.declarations;
  invariant(
    document.keytermGap?.status ===
      "declared-dependencies-missing-from-current-preserved-source-catalog-and-physical-source-root" &&
      Array.isArray(declarations) &&
      declarations.length === 2,
    "source-gap keyterm state drifted",
  );
  for (const target of TARGETS) {
    const matches = declarations.filter(
      (entry) =>
        entry.language === target.language &&
        path.basename(entry.path) === target.basename,
    );
    invariant(
      matches.length === 1 &&
        matches[0].physicalPresence === false &&
        Array.isArray(matches[0].exactCatalogMatches) &&
        matches[0].exactCatalogMatches.length === 0 &&
        Array.isArray(matches[0].basenameCatalogMatches) &&
        matches[0].basenameCatalogMatches.length === 0,
      `${target.basename}: source-gap evidence drifted`,
    );
  }
  invariant(
    Object.values(document.acceptanceEffects || {}).every(
      (value) => value === false,
    ),
    "source-gap report was promoted",
  );
  return declarations;
}

function validateTechnicalCrosswalk(document, sourceCatalogRecord) {
  invariant(
    document?.schemaVersion === 1 &&
      Array.isArray(document.files) &&
      document.summary?.fileCount === 1455 &&
      document.files.length === document.summary.fileCount &&
      document.summary.families?.XML === 11 &&
      document.summary.sourceCatalog?.sha256 === sourceCatalogRecord.sha256,
    "historical technical-source crosswalk identity or completeness drifted",
  );
  const familyCounts = Object.fromEntries(
    Object.keys(document.summary.families).map((family) => [family, 0]),
  );
  for (const entry of document.files) {
    invariant(
      typeof entry.historicalPath === "string" &&
        entry.historicalPath.length > 0 &&
        Number.isInteger(entry.bytes) &&
        entry.bytes >= 0 &&
        SHA256.test(entry.sha256 || ""),
      "historical technical-source entry is malformed",
    );
    invariant(
      Object.hasOwn(familyCounts, entry.family),
      "historical technical-source family drifted",
    );
    familyCounts[entry.family] += 1;
  }
  invariant(
    JSON.stringify(familyCounts) ===
      JSON.stringify(document.summary.families),
    "historical technical-source family counts drifted",
  );
}

function safeReportBoundary(report) {
  const serialized = stableJson(report);
  for (const forbidden of [
    "/Volumes/",
    "historicalPath",
    "physicalPath",
    "Extracted_NewHelpProgram",
    "Historical Office Documents",
  ]) {
    invariant(
      !serialized.includes(forbidden),
      `public report leaked forbidden private path data: ${forbidden}`,
    );
  }
  invariant(
    !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(serialized),
    "public report leaked an email-like identifier",
  );
}

export async function buildG5L5MissingKeytermRecoveryReadiness({
  projectRoot: projectRootOption = defaultProjectRoot,
  privateArchiveRoot: privateArchiveRootOption = PRIVATE_ARCHIVE_ROOT,
  sqlAggregatePath: sqlAggregatePathOption = SQL_AGGREGATE_PATH,
} = {}) {
  const projectRoot = path.resolve(projectRootOption);
  const records = {
    generator: await readFileRecord(projectRoot, GENERATOR_PATH, "generator"),
    sourceCatalog: await readJsonRecord(
      projectRoot,
      PROJECT_INPUTS.sourceCatalog,
      "source catalog",
    ),
    sourceGap: await readJsonRecord(
      projectRoot,
      PROJECT_INPUTS.sourceGap,
      "G5 L5 source-gap report",
    ),
    technicalCrosswalk: await readJsonRecord(
      projectRoot,
      PROJECT_INPUTS.technicalCrosswalk,
      "historical technical-source crosswalk",
    ),
    historicalFileCatalog: await readFileRecord(
      projectRoot,
      PROJECT_INPUTS.historicalFileCatalog,
      "historical file authority catalog",
    ),
    sqlCatalog: await readFileRecord(
      projectRoot,
      PROJECT_INPUTS.sqlCatalog,
      "privacy-safe SQL catalog",
    ),
    sqlFileCatalog: await readFileRecord(
      projectRoot,
      PROJECT_INPUTS.sqlFileCatalog,
      "privacy-safe SQL file catalog",
    ),
    sqlTableCatalog: await readFileRecord(
      projectRoot,
      PROJECT_INPUTS.sqlTableCatalog,
      "privacy-safe SQL table catalog",
    ),
  };
  records.sqlAggregate = await readAbsoluteFileRecord(
    path.resolve(sqlAggregatePathOption),
    path.dirname(path.resolve(sqlAggregatePathOption)),
    "privacy-safe SQL aggregate",
  );

  validateSourceCatalog(records.sourceCatalog.document);
  const declarations = validateSourceGap(
    records.sourceGap.document,
    records.sourceCatalog,
  );
  validateTechnicalCrosswalk(
    records.technicalCrosswalk.document,
    records.sourceCatalog,
  );

  const authorityRows = parseJsonLines(
    records.historicalFileCatalog.contents,
    "historical file authority catalog",
  );
  invariant(
    authorityRows.length === 3713,
    "historical file authority catalog completeness drifted",
  );

  const crosswalkFiles = records.technicalCrosswalk.document.files;
  const leadEntries = crosswalkFiles.filter(
    (entry) =>
      normalizedBasename(entry.historicalPath) === "l1kte01xml" &&
      entry.family === "XML",
  );
  invariant(
    leadEntries.length === 1,
    "different-basename master-glossary lead identity drifted",
  );
  const lead = leadEntries[0];
  invariant(
    lead.archivePresence === "present" &&
      lead.sourceAssetsExactMatchCount === 0 &&
      lead.matchStatus === "no-exact-source-assets-match",
    "master-glossary lead source-match boundary drifted",
  );
  const authorityMatches = authorityRows.filter(
    (entry) => entry.sha256 === lead.sha256,
  );
  invariant(
    authorityMatches.length === 1 &&
      authorityMatches[0].archivePresence === "present" &&
      authorityMatches[0].authority === "technical-source-file" &&
      authorityMatches[0].authorityConfidence === "high",
    "master-glossary lead authority drifted",
  );

  const archiveRoot = path.resolve(privateArchiveRootOption);
  const leadAbsolutePath = path.resolve(archiveRoot, lead.historicalPath);
  invariant(
    isWithin(archiveRoot, leadAbsolutePath),
    "master-glossary lead escapes the read-only archive",
  );
  const leadRecord = await readAbsoluteFileRecord(
    leadAbsolutePath,
    archiveRoot,
    "different-basename master-glossary lead",
  );
  invariant(
    leadRecord.bytes === lead.bytes &&
      leadRecord.sha256 === lead.sha256,
    "master-glossary lead physical identity drifted",
  );
  const leadText = leadRecord.contents.toString("utf8");
  const keyTermRecordCount = (leadText.match(/<KeyTerm\b/g) || []).length;
  invariant(
    keyTermRecordCount === 659,
    "master-glossary lead KeyTerm record count drifted",
  );
  const targetNameReferences = TARGETS.reduce(
    (sum, target) => sum + countToken(leadRecord.contents, target.basename),
    0,
  );
  invariant(
    targetNameReferences === 0,
    "master-glossary lead unexpectedly claims an exact target identity",
  );

  const sqlCatalogRecords = [
    records.sqlCatalog,
    records.sqlFileCatalog,
    records.sqlTableCatalog,
  ];
  const targetFindings = TARGETS.map((target) => {
    const sourceMatches = records.sourceCatalog.document.files.filter(
      (entry) =>
        path.basename(entry.path).toLowerCase() ===
          target.basename.toLowerCase(),
    );
    const historicalExactMatches = crosswalkFiles.filter(
      (entry) =>
        path.basename(entry.historicalPath).toLowerCase() ===
          target.basename.toLowerCase(),
    );
    const historicalNormalizedMatches = crosswalkFiles.filter(
      (entry) =>
        normalizedBasename(entry.historicalPath) ===
          normalizedBasename(target.basename),
    );
    const declaration = declarations.find(
      (entry) =>
        entry.language === target.language &&
        path.basename(entry.path) === target.basename,
    );
    const sqlCatalogReferenceCount = sqlCatalogRecords.reduce(
      (sum, record) => sum + countToken(record.contents, target.basename),
      0,
    );
    const sqlAggregateReferenceCount = countToken(
      records.sqlAggregate.contents,
      target.basename,
    );
    invariant(
      sourceMatches.length === 0 &&
        historicalExactMatches.length === 0 &&
        historicalNormalizedMatches.length === 0 &&
        declaration.exactCatalogMatches.length === 0 &&
        declaration.basenameCatalogMatches.length === 0 &&
        declaration.physicalPresence === false &&
        sqlCatalogReferenceCount === 0 &&
        sqlAggregateReferenceCount === 0,
      `${target.basename}: an exact or alias candidate appeared`,
    );
    return {
      language: target.language,
      basename: target.basename,
      currentSourceCatalogExactBasenameCount: sourceMatches.length,
      sourceGapExactCatalogMatchCount:
        declaration.exactCatalogMatches.length,
      sourceGapBasenameMatchCount:
        declaration.basenameCatalogMatches.length,
      currentPreservedPhysicalPresence: false,
      historicalTechnicalCrosswalkExactBasenameCount:
        historicalExactMatches.length,
      historicalTechnicalCrosswalkNormalizedAliasCount:
        historicalNormalizedMatches.length,
      sqlPrivacySafeCatalogReferenceCount: sqlCatalogReferenceCount,
      sqlPrivacySafeAggregateReferenceCount:
        sqlAggregateReferenceCount,
      exactCandidateCount: 0,
      exactCandidateSha256: [],
      contentRecovered: false,
      importAuthorized: false,
      reviewedExceptionEstablished: false,
    };
  });

  const report = {
    schemaVersion: 1,
    reportType: "g5-l5-missing-keyterm-recovery-readiness",
    releaseId: RELEASE_ID,
    evidenceState:
      "hash-bound-public-safe-recovery-search-complete-no-exact-candidate",
    authority:
      "This deterministic report exposes only public-safe source identifiers, hashes, counts, and acceptance-neutral conclusions. It reads but does not copy or modify preserved sources. It discloses no historical archive raw path or personal data, treats the different-basename master-glossary file only as a forensic lead, authorizes no substitution or import, and changes no fidelity, strict-completion, or publication gate.",
    generator: {
      path: GENERATOR_PATH,
      bytes: records.generator.bytes,
      sha256: records.generator.sha256,
    },
    identity: {
      grade: 5,
      lesson: 5,
      titleDisplay: "Add & Subtract Negative Numbers",
      expectedReleaseMembers: 57,
      publicationMode: "atomic",
    },
    sourceBindings: {
      currentSourceCatalog: publicDescriptor(
        records.sourceCatalog,
        "current-preserved-source-catalog",
        {
          schemaVersion: records.sourceCatalog.document.schemaVersion,
          fileCount: records.sourceCatalog.document.fileCount,
          totalBytes: records.sourceCatalog.document.totalBytes,
          checksumSetSha256:
            records.sourceCatalog.document.checksumSetSha256,
        },
      ),
      g5L5SourceGap: publicDescriptor(
        records.sourceGap,
        "g5-l5-source-gap-forensics",
        {
          schemaVersion: records.sourceGap.document.schemaVersion,
          reportType: records.sourceGap.document.reportType,
        },
      ),
      historicalTechnicalCrosswalk: publicDescriptor(
        records.technicalCrosswalk,
        "historical-office-technical-source-crosswalk-2026-07-25",
        {
          schemaVersion:
            records.technicalCrosswalk.document.schemaVersion,
          fileCount:
            records.technicalCrosswalk.document.summary.fileCount,
          xmlFileCount:
            records.technicalCrosswalk.document.summary.families.XML,
          completeCatalogBound: true,
        },
      ),
      historicalAuthorityCatalog: publicDescriptor(
        records.historicalFileCatalog,
        "historical-office-file-authority-catalog-2026-07-25",
        {fileCount: authorityRows.length},
      ),
      sqlPrivacySafeCatalog: publicDescriptor(
        records.sqlCatalog,
        "newhelpprogram-20210203-privacy-safe-catalog",
      ),
      sqlPrivacySafeFileCatalog: publicDescriptor(
        records.sqlFileCatalog,
        "newhelpprogram-20210203-privacy-safe-file-catalog",
      ),
      sqlPrivacySafeTableCatalog: publicDescriptor(
        records.sqlTableCatalog,
        "newhelpprogram-20210203-privacy-safe-table-catalog",
      ),
      sqlPrivacySafeAggregate: publicDescriptor(
        records.sqlAggregate,
        "newhelpprogram-20210203-privacy-safe-aggregate-analysis",
      ),
    },
    targets: targetFindings,
    differentBasenameMasterGlossaryLead: {
      leadCount: 1,
      leadClass: "different-basename-master-glossary-lead",
      sha256: leadRecord.sha256,
      bytes: leadRecord.bytes,
      physicalPresence: true,
      authority: "technical-source-file",
      authorityConfidence: "high",
      keyTermRecordCount,
      exactTargetBasenameReferenceCount: targetNameReferences,
      sourceAssetsExactMatchCount: 0,
      migrationWorkspaceMatchCount: 0,
      exactTargetCandidate: false,
      substitutionAuthorized: false,
      importAuthorized: false,
      interpretation:
        "A content-structure lead only. Its different basename and lack of an exact current-source match prohibit renaming, substitution, or target recovery claims.",
    },
    recoveryGate: {
      state:
        "closed-no-exact-hash-bound-target-candidate-and-no-reviewed-exception",
      exactTargetCandidates: 0,
      recoveredTargets: 0,
      requiredTargets: 2,
      sourceGapClosed: false,
      importAuthorized: false,
      substitutionAuthorized: false,
      implementationAuthorized: false,
      reviewedExceptionEstablished: false,
    },
    nextSteps: [
      "Ask the owner or designated source custodian to search original KeyTerm build outputs or deployment backups for the two exact target basenames.",
      "For any recovered file, record physical custody, bytes, and SHA-256 before comparing schema or content; do not overwrite preserved sources.",
      "Use the different-basename master-glossary lead only to guide format and provenance questions; never rename or substitute it for either target.",
      "If recovery is exhausted, record a validator-supported reviewed exception without inventing English or Spanish content.",
    ],
    strictCompletion: {
      completeMembers: 0,
      expectedMembers: 57,
      fraction: "0/57",
      complete: false,
    },
    publication: {
      published: false,
      publicationCount: 0,
      atomicReleaseEligible: false,
    },
    acceptanceEffects: {
      authoritativeOriginalRuntime: false,
      audioAccepted: false,
      behaviorAccepted: false,
      humanReviewAccepted: false,
      implementationAuthorized: false,
      ownerFidelityAccepted: false,
      published: false,
      recoveryAccepted: false,
      sourceGapClosed: false,
      strictComplete: false,
    },
    strictAcceptanceEffect:
      "none; the hash-bound search records zero exact candidates for both missing KeyTerm targets and cannot authorize import, substitution, implementation, acceptance, strict completion, or publication",
  };

  report.reportFingerprintSha256 = sha256Bytes(
    Buffer.from(stableJson(report)),
  );
  validateG5L5MissingKeytermRecoveryReadiness(report);
  safeReportBoundary(report);
  return report;
}

export function validateG5L5MissingKeytermRecoveryReadiness(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType ===
        "g5-l5-missing-keyterm-recovery-readiness" &&
      report.releaseId === RELEASE_ID &&
      report.evidenceState ===
        "hash-bound-public-safe-recovery-search-complete-no-exact-candidate",
    "recovery-readiness report identity drifted",
  );
  invariant(
    report.identity?.grade === 5 &&
      report.identity.lesson === 5 &&
      report.identity.titleDisplay ===
        "Add & Subtract Negative Numbers" &&
      report.identity.expectedReleaseMembers === 57 &&
      report.identity.publicationMode === "atomic",
    "recovery-readiness lesson identity drifted",
  );
  invariant(
    report.generator?.path === GENERATOR_PATH &&
      Number.isInteger(report.generator.bytes) &&
      report.generator.bytes > 0 &&
      SHA256.test(report.generator.sha256 || ""),
    "recovery-readiness generator binding drifted",
  );
  const bindings = report.sourceBindings;
  invariant(
    bindings?.currentSourceCatalog?.sourceId ===
        "current-preserved-source-catalog" &&
      bindings.currentSourceCatalog.fileCount === 7919 &&
      bindings.g5L5SourceGap?.sourceId ===
        "g5-l5-source-gap-forensics" &&
      bindings.historicalTechnicalCrosswalk?.sourceId ===
        "historical-office-technical-source-crosswalk-2026-07-25" &&
      bindings.historicalTechnicalCrosswalk.fileCount === 1455 &&
      bindings.historicalTechnicalCrosswalk.xmlFileCount === 11 &&
      bindings.historicalTechnicalCrosswalk.completeCatalogBound === true &&
      bindings.historicalAuthorityCatalog?.fileCount === 3713 &&
      bindings.sqlPrivacySafeCatalog?.sourceId ===
        "newhelpprogram-20210203-privacy-safe-catalog" &&
      bindings.sqlPrivacySafeAggregate?.sourceId ===
        "newhelpprogram-20210203-privacy-safe-aggregate-analysis" &&
      Object.values(bindings).every(
        (binding) =>
          Number.isInteger(binding.bytes) &&
          binding.bytes > 0 &&
          SHA256.test(binding.sha256 || ""),
      ),
    "recovery-readiness source bindings drifted",
  );
  invariant(
    Array.isArray(report.targets) &&
      report.targets.length === 2 &&
      report.targets.every((target, index) =>
        target.language === TARGETS[index].language &&
        target.basename === TARGETS[index].basename &&
        target.currentSourceCatalogExactBasenameCount === 0 &&
        target.sourceGapExactCatalogMatchCount === 0 &&
        target.sourceGapBasenameMatchCount === 0 &&
        target.currentPreservedPhysicalPresence === false &&
        target.historicalTechnicalCrosswalkExactBasenameCount === 0 &&
        target.historicalTechnicalCrosswalkNormalizedAliasCount === 0 &&
        target.sqlPrivacySafeCatalogReferenceCount === 0 &&
        target.sqlPrivacySafeAggregateReferenceCount === 0 &&
        target.exactCandidateCount === 0 &&
        Array.isArray(target.exactCandidateSha256) &&
        target.exactCandidateSha256.length === 0 &&
        target.contentRecovered === false &&
        target.importAuthorized === false &&
        target.reviewedExceptionEstablished === false),
    "a missing KeyTerm target was promoted or drifted",
  );
  const lead = report.differentBasenameMasterGlossaryLead;
  invariant(
    lead?.leadCount === 1 &&
      lead.leadClass === "different-basename-master-glossary-lead" &&
      lead.sha256 ===
        "c7d92527369fe98f3cba813acc2ea421a1a5de955465a565c2081dcebcdd1adf" &&
      lead.bytes === 342317 &&
      lead.physicalPresence === true &&
      lead.authority === "technical-source-file" &&
      lead.authorityConfidence === "high" &&
      lead.keyTermRecordCount === 659 &&
      lead.exactTargetBasenameReferenceCount === 0 &&
      lead.sourceAssetsExactMatchCount === 0 &&
      lead.migrationWorkspaceMatchCount === 0 &&
      lead.exactTargetCandidate === false &&
      lead.substitutionAuthorized === false &&
      lead.importAuthorized === false,
    "different-basename master-glossary lead was promoted or drifted",
  );
  invariant(
    report.recoveryGate?.state ===
        "closed-no-exact-hash-bound-target-candidate-and-no-reviewed-exception" &&
      report.recoveryGate.exactTargetCandidates === 0 &&
      report.recoveryGate.recoveredTargets === 0 &&
      report.recoveryGate.requiredTargets === 2 &&
      report.recoveryGate.sourceGapClosed === false &&
      report.recoveryGate.importAuthorized === false &&
      report.recoveryGate.substitutionAuthorized === false &&
      report.recoveryGate.implementationAuthorized === false &&
      report.recoveryGate.reviewedExceptionEstablished === false,
    "recovery gate was opened",
  );
  invariant(
    report.strictCompletion?.completeMembers === 0 &&
      report.strictCompletion.expectedMembers === 57 &&
      report.strictCompletion.fraction === "0/57" &&
      report.strictCompletion.complete === false,
    "strict completion was promoted",
  );
  invariant(
    report.publication?.published === false &&
      report.publication.publicationCount === 0 &&
      report.publication.atomicReleaseEligible === false,
    "publication was promoted",
  );
  invariant(
    Object.values(report.acceptanceEffects || {}).every(
      (value) => value === false,
    ),
    "recovery-readiness report changed an acceptance gate",
  );
  invariant(
    typeof report.strictAcceptanceEffect === "string" &&
      report.strictAcceptanceEffect.startsWith("none;"),
    "recovery-readiness report claims strict acceptance",
  );
  const fingerprint = report.reportFingerprintSha256;
  invariant(
    SHA256.test(fingerprint || ""),
    "recovery-readiness report fingerprint is missing",
  );
  const copy = {...report};
  delete copy.reportFingerprintSha256;
  invariant(
    fingerprint === sha256Bytes(Buffer.from(stableJson(copy))),
    "recovery-readiness report fingerprint drifted",
  );
  safeReportBoundary(report);
  return report;
}

export function renderMarkdown(report) {
  validateG5L5MissingKeytermRecoveryReadiness(report);
  const targetRows = report.targets.map((target) =>
    `| ${target.language} | \`${target.basename}\` | ${target.exactCandidateCount} | ${target.currentPreservedPhysicalPresence ? "yes" : "no"} | no |`)
    .join("\n");
  return `# G5 L5 Missing KeyTerm Recovery Readiness

Release: \`${report.releaseId}\` — **Add & Subtract Negative Numbers**  
State: **public-safe, hash-bound, fail-closed; no exact recovery candidate**

This acceptance-neutral report binds the complete current source catalog, G5 L5
source-gap report, complete historical technical-source crosswalk and authority
catalog, and privacy-safe SQL catalog/aggregate. It exposes no historical raw
path or personal data and copies or modifies no preserved source.

## Missing targets

| Language | Target basename | Exact candidates | Physically present | Import authorized |
| --- | --- | ---: | --- | --- |
${targetRows}

Both targets also have **0** normalized historical filename aliases and **0**
privacy-safe SQL catalog or aggregate references.

## Different-basename master-glossary lead

- Class: **different-basename master-glossary lead only**
- SHA-256: \`${report.differentBasenameMasterGlossaryLead.sha256}\`
- Bytes: **${report.differentBasenameMasterGlossaryLead.bytes}**
- Physical presence: **true**
- Authority: **technical-source-file / high confidence**
- KeyTerm records: **${report.differentBasenameMasterGlossaryLead.keyTermRecordCount}**
- Exact current source matches: **0**
- Exact target basename references: **0**
- Exact target candidate / substitution / import: **false / false / false**

The lead may inform format and provenance questions only. It must not be
renamed, copied, or substituted for either missing target.

## Recovery and acceptance boundary

- Exact recovered targets: **0/2**
- Source gap closed: **false**
- Implementation or import authorized: **false**
- Strict completion: **0/57**
- Published: **false**

Next action: the owner or designated source custodian should search original
KeyTerm build outputs or deployment backups for the two exact basenames and
hash-bind any recovered file before review. If recovery is exhausted, use a
validator-supported reviewed exception without inventing bilingual content.
`;
}

function outputPaths(projectRoot, outputPrefix) {
  invariant(
    typeof outputPrefix === "string" &&
      outputPrefix.startsWith("reports/") &&
      outputPrefix !== "reports/" &&
      !outputPrefix.includes("\\") &&
      !path.posix.isAbsolute(outputPrefix) &&
      path.posix.normalize(outputPrefix) === outputPrefix &&
      path.posix.extname(outputPrefix) === "",
    "--output-prefix must be a normalized extensionless path below reports/",
  );
  return {
    json: resolveProjectPath(projectRoot, `${outputPrefix}.json`, "JSON output"),
    markdown: resolveProjectPath(
      projectRoot,
      `${outputPrefix}.md`,
      "Markdown output",
    ),
  };
}

async function ensureSafeOutputDirectory(projectRoot, directory, create) {
  invariant(isWithin(projectRoot, directory), "output directory escapes project root");
  const relative = path.relative(projectRoot, directory);
  let cursor = projectRoot;
  for (const component of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    let metadata = await lstat(cursor).catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
    if (!metadata && create) {
      await mkdir(cursor);
      metadata = await lstat(cursor);
    }
    invariant(
      metadata?.isDirectory() && !metadata.isSymbolicLink(),
      `${portable(path.relative(projectRoot, cursor))}: output ancestor must be an ordinary directory`,
    );
  }
  const [realRoot, realDirectory] = await Promise.all([
    realpath(projectRoot),
    realpath(directory),
  ]);
  invariant(
    isWithin(realRoot, realDirectory),
    "output directory resolves outside project root",
  );
}

async function existingOutput(file, projectRoot) {
  const metadata = await lstat(file).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!metadata) return null;
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `${portable(path.relative(projectRoot, file))}: output target must be one ordinary non-linked file`,
  );
  const contents = await readFile(file);
  return {
    bytes: contents.length,
    sha256: sha256Bytes(contents),
    contents,
  };
}

async function unlinkExpected(file, expectedSha256, projectRoot) {
  const state = await existingOutput(file, projectRoot);
  if (!state) return;
  invariant(
    state.sha256 === expectedSha256,
    `${portable(path.relative(projectRoot, file))}: refusing to remove an unowned file`,
  );
  await unlink(file);
}

export async function writeOrCheck({
  report,
  projectRoot: projectRootOption = defaultProjectRoot,
  outputPrefix = DEFAULT_OUTPUT_PREFIX,
  check = false,
} = {}) {
  validateG5L5MissingKeytermRecoveryReadiness(report);
  const projectRoot = path.resolve(projectRootOption);
  const outputs = outputPaths(projectRoot, outputPrefix);
  await ensureSafeOutputDirectory(
    projectRoot,
    path.dirname(outputs.json),
    !check,
  );
  const expected = {
    json: stableJson(report),
    markdown: renderMarkdown(report),
  };
  if (check) {
    const [json, markdown] = await Promise.all([
      readFile(outputs.json, "utf8"),
      readFile(outputs.markdown, "utf8"),
    ]);
    invariant(json === expected.json, "recovery-readiness JSON output is stale");
    invariant(
      markdown === expected.markdown,
      "recovery-readiness Markdown output is stale",
    );
    return {action: "verified"};
  }

  const transactionId = randomUUID();
  const entries = [
    {file: outputs.json, contents: expected.json},
    {file: outputs.markdown, contents: expected.markdown},
  ].map((entry) => ({
    ...entry,
    temporary: `${entry.file}.tmp-${transactionId}`,
    backup: `${entry.file}.bak-${transactionId}`,
    expectedSha256: sha256Bytes(Buffer.from(entry.contents)),
  }));
  let installed = 0;
  try {
    for (const entry of entries) {
      invariant(
        await existingOutput(entry.temporary, projectRoot) === null &&
          await existingOutput(entry.backup, projectRoot) === null,
        "transaction scratch path already exists",
      );
      entry.prior = await existingOutput(entry.file, projectRoot);
      await writeFile(entry.temporary, entry.contents, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o644,
      });
    }
    for (const entry of entries) {
      if (entry.prior) await rename(entry.file, entry.backup);
    }
    for (const entry of entries) {
      await rename(entry.temporary, entry.file);
      installed += 1;
    }
    for (const entry of entries) {
      const current = await existingOutput(entry.file, projectRoot);
      invariant(
        current?.sha256 === entry.expectedSha256,
        "post-write verification failed",
      );
      if (entry.prior) {
        await unlinkExpected(entry.backup, entry.prior.sha256, projectRoot);
      }
    }
  } catch (error) {
    for (let index = installed - 1; index >= 0; index -= 1) {
      const entry = entries[index];
      await unlinkExpected(entry.file, entry.expectedSha256, projectRoot)
        .catch(() => {});
    }
    for (const entry of [...entries].reverse()) {
      const backup = await existingOutput(entry.backup, projectRoot)
        .catch(() => null);
      if (backup && entry.prior?.sha256 === backup.sha256) {
        await rename(entry.backup, entry.file).catch(() => {});
      }
      await unlinkExpected(entry.temporary, entry.expectedSha256, projectRoot)
        .catch(() => {});
    }
    throw error;
  }
  return {
    action: "written",
    outputs: entries.map((entry) => ({
      bytes: Buffer.byteLength(entry.contents),
      sha256: entry.expectedSha256,
    })),
  };
}

export function parseArguments(argv) {
  const options = {
    check: false,
    outputPrefix: DEFAULT_OUTPUT_PREFIX,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--output-prefix") {
      const value = argv[index + 1];
      invariant(
        value && !value.startsWith("--"),
        "--output-prefix requires a value",
      );
      options.outputPrefix = value;
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  outputPaths(defaultProjectRoot, options.outputPrefix);
  return options;
}

function usage() {
  return `Usage: node scripts/build-g5-l5-missing-keyterm-recovery-readiness.mjs [options]

Options:
  --check                    Verify JSON and Markdown without writing
  --output-prefix <path>     Extensionless project-relative prefix below reports/
  --help                     Show this help

The command performs a public-safe, read-only, hash-bound recovery search. It
copies no source, exposes no historical raw path or personal data, authorizes no
import or substitution, and changes no acceptance or publication gate.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
  } else {
    const report = await buildG5L5MissingKeytermRecoveryReadiness();
    const result = await writeOrCheck({report, ...options});
    process.stdout.write(`${JSON.stringify({
      action: result.action,
      releaseId: RELEASE_ID,
      targets: report.targets.map(({basename, exactCandidateCount}) => ({
        basename,
        exactCandidateCount,
      })),
      importAuthorized: report.recoveryGate.importAuthorized,
      strictCompletion: report.strictCompletion.fraction,
      published: report.publication.published,
    }, null, 2)}\n`);
  }
}
