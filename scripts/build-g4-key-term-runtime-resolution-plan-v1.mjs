#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  chmod,
  lstat,
  open,
  readdir,
  readFile,
  realpath,
} from "node:fs/promises";
import path from "node:path";
import {TextDecoder} from "node:util";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");
export const OUTPUT_PREFIX =
  "catalog/source-promotions/g4-key-term-runtime-resolution-plan-v1";

const OUTPUT_MODE = 0o444;
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;
const UTF8 = new TextDecoder("utf-8", {fatal: true});
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const KEY_TERM_PREFIX = "HELP_KEYTERMS/KT/ELEMENTARY/DIG/";
const CANONICAL_SOURCE_ROOT = path.join(
  PROJECT_ROOT,
  "source-assets/flash/HELP MATH_ORIGINAL FILES",
);
const QUARANTINE_ROOT =
  "/Volumes/WestWorld/HELP MATH Related Files/Google Drive Source Intake/" +
  "2026-08-02-HELP-ELM-FINAL-Dec21-2015";
const QUARANTINE_DIG_ROOT = path.join(QUARANTINE_ROOT, "verified/DIG");

const PROJECT_INPUTS = Object.freeze({
  runtimeAlignment: Object.freeze({
    path: "catalog/alignments/g4-curriculum-runtime-dependency-map-v1.json",
    bytes: 2_272_953,
    sha256: "05357658e7c5f70b9d305ea64063130f1b1d816663748af45cfa1950319a670b",
    mode: "0644",
    kind: "json",
  }),
  missingReferences: Object.freeze({
    path: "catalog/missing-references.json",
    bytes: 852_812,
    sha256: "80159400ba05e6b32ceb1b3a24e8dbe839ffcf049af08403adf5049296416136",
    mode: "0644",
    kind: "json",
  }),
  sourceCatalog: Object.freeze({
    path: "catalog/source-files.json",
    bytes: 1_894_761,
    sha256: "c5ba348ea968b4ae7292d86f7624a77ec105bc8f929bd61b4837c59623f33b29",
    mode: "0644",
    kind: "json",
  }),
  gradeWideEnglish: Object.freeze({
    path: "apps/web/public/generated/g4-grade-wide-keyterms-en.json",
    bytes: 969_932,
    sha256: "1a27fb3eadb1c74a1bd705f2f44602d69728051e39477c2af0a3590848618688",
    mode: "0644",
    kind: "json",
  }),
  gradeWideSpanish: Object.freeze({
    path: "apps/web/public/generated/g4-grade-wide-keyterms-es.json",
    bytes: 962_535,
    sha256: "f04bda2ebc89bc1b12a9928c56b5cd38e0a2e00a5fbb2a35604e571e1714b442",
    mode: "0644",
    kind: "json",
  }),
});

const EXTERNAL_INPUTS = Object.freeze({
  quarantineReadme: Object.freeze({
    relativePath: "README.md",
    bytes: 9_784,
    sha256: "fd3f300739e63e84b9a263d724fdbeda55dd3a1b4eee077b472de5228cc76f5e",
    mode: "0444",
    kind: "text",
    artifactToken: "g4-drive-source-intake-readme-2026-08-02",
  }),
  intakeReceipt: Object.freeze({
    relativePath: "manifests/intake-receipt.json",
    bytes: 7_858,
    sha256: "3633334999488f1df0c95fc7bece4669d7d9db86845f1aeab1924fd560802fd4",
    mode: "0444",
    kind: "json",
    artifactToken: "g4-drive-source-intake-receipt-2026-08-02",
  }),
  digManifest: Object.freeze({
    relativePath: "manifests/dig-files.json",
    bytes: 240_179,
    sha256: "eb9542e48cce27add5e178419f8207b5538ea9684a857f1ad8cb8057615be20b",
    mode: "0444",
    kind: "json",
    artifactToken: "elementary-dig-file-manifest-2026-08-01",
  }),
  digChecksumList: Object.freeze({
    relativePath: "manifests/dig-files.sha256",
    bytes: 130_325,
    sha256: "1ebce5a81041a4431e4fcc4b7b9cfeed96a0bd9ad1ce6704a7afe1d4e61410f7",
    mode: "0444",
    kind: "text",
    artifactToken: "elementary-dig-sha256-list-2026-08-01",
  }),
  digIntakePlan: Object.freeze({
    relativePath: "manifests/dig-intake-plan.json",
    bytes: 1_975_727,
    sha256: "2ab69de16a2ef27772e034bf951c53b09e28a58c1b93c88f0ec219243f2f2868",
    mode: "0444",
    kind: "json",
    artifactToken: "elementary-dig-intake-plan-2026-08-01",
  }),
  digZip: Object.freeze({
    relativePath: "downloads/DIG-20260801T183656Z-1-001.zip",
    bytes: 92_213_676,
    sha256: "e367ea90c904894080c4c8e11f9eaaaebf615e14b655991b68820977ecbd6428",
    mode: "0444",
    kind: "binary",
    artifactToken: "elementary-dig-drive-folder-zip-2026-08-01",
  }),
});

const EXPECTED = Object.freeze({
  declaredOccurrenceCount: 1_515,
  uniqueRuntimeCount: 760,
  canonicalResolvedCount: 443,
  canonicalMissingCount: 317,
  candidateCount: 316,
  caseVariantCount: 299,
  exactPlacementCount: 17,
  pairedFlaCount: 313,
  unresolvedCount: 1,
  potentialResolvedCount: 759,
  englishEntryCount: 761,
  englishWarningCount: 6,
  spanishEntryCount: 753,
  spanishWarningCount: 2,
  lessonCount: 12,
  digFileCount: 1_594,
  digFileBytes: 169_045_760,
  digSwfCount: 797,
  digFlaCount: 797,
  digChecksumSetSha256:
    "fe16e6eec0ab36aba449ca15f047583286dbaeb1e5412c61c7a9e26db9083c79",
  missingPathSetSha256:
    "10a4fb0f80281395066ef730d2f5fe4d0a504a43b70f4a2cb95f2e42c856dc99",
  candidateRecordSetSha256:
    "5b965900bbe80ef7ba875def2cdc4f9098ca92e3c863f2ce255dcefd063001cb",
  caseVariantRecordSetSha256:
    "8a8e77b73d19ebfede3ef137e58c7070f30cdbb921bc52f3ce5197b54a9330db",
  exactPlacementRecordSetSha256:
    "950202d2bf0282f567f896450c259eb7de767a50b351ba6c970375df9c4fdb8f",
  polynomialFlaSha256:
    "4281f3dbde526f0f7e8e445efd4f61893566ad6308c0236816d07baa16a89263",
});

const ACCEPTANCE_EFFECTS = Object.freeze({
  canonicalSourcePromotion: false,
  runtimeDependencyClosure: false,
  javascriptImplementation: false,
  authoritativeOriginalRuntimeEvidence: false,
  runtimeFidelity: false,
  keyTermLanguageOrDiagramAcceptance: false,
  audioCorrectnessOrAcceptance: false,
  humanVisualAcceptance: false,
  ownerAcceptance: false,
  strictCompletion: false,
  wholeCourseIntegration: false,
  publication: false,
});

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function assertNoUndefined(value, location = "$") {
  assert.notEqual(value, undefined, `undefined value at ${location}`);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoUndefined(item, `${location}[${index}]`));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      assertNoUndefined(item, `${location}.${key}`);
    }
  }
}

function reportFingerprint(report) {
  const projection = structuredClone(report);
  delete projection.reportFingerprintSha256;
  assertNoUndefined(projection);
  return sha256(canonicalJson(projection));
}

function modeString(info) {
  return Number(info.mode & 0o777n).toString(8).padStart(4, "0");
}

function nodeIdentity(info) {
  return `${info.dev}:${info.ino}`;
}

function statIdentity(info) {
  return [info.dev, info.ino, info.size, info.mtimeNs, info.ctimeNs]
    .map(String).join(":");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function canonicalDirectory(absolutePath, label, expectedMode = null) {
  const lexical = path.resolve(absolutePath);
  const info = await lstat(lexical, {bigint: true});
  assert.ok(info.isDirectory() && !info.isSymbolicLink(),
    `${label}: expected ordinary directory`);
  assert.equal(await realpath(lexical), lexical,
    `${label}: directory resolves through symlink`);
  if (expectedMode !== null) {
    assert.equal(modeString(info), expectedMode, `${label}: mode drifted`);
  }
  return {absolutePath: lexical, info};
}

async function readStableFile(absolutePath, expected, label) {
  const lexical = path.resolve(absolutePath);
  const before = await lstat(lexical, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${label}: expected one ordinary non-linked file`);
  assert.equal(await realpath(lexical), lexical,
    `${label}: file resolves through symlink`);
  const handle = await open(lexical, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const opened = await handle.stat({bigint: true});
    assert.equal(nodeIdentity(opened), nodeIdentity(before),
      `${label}: path identity changed before read`);
    const bytes = await handle.readFile();
    const [afterOpen, afterPath] = await Promise.all([
      handle.stat({bigint: true}),
      lstat(lexical, {bigint: true}),
    ]);
    assert.equal(statIdentity(afterOpen), statIdentity(opened),
      `${label}: descriptor changed while read`);
    assert.equal(statIdentity(afterPath), statIdentity(opened),
      `${label}: pathname changed while read`);
    assert.equal(BigInt(bytes.length), afterOpen.size,
      `${label}: byte count changed while read`);
    const observed = {
      bytes: bytes.length,
      sha256: sha256(bytes),
      mode: modeString(afterOpen),
      contents: bytes,
    };
    if (expected.bytes !== undefined) {
      assert.equal(observed.bytes, expected.bytes, `${label}: byte count drifted`);
    }
    if (expected.sha256 !== undefined) {
      assert.equal(observed.sha256, expected.sha256, `${label}: SHA-256 drifted`);
    }
    if (expected.mode !== undefined) {
      assert.equal(observed.mode, expected.mode, `${label}: mode drifted`);
    }
    if (expected.kind === "json") {
      observed.document = JSON.parse(UTF8.decode(bytes));
    }
    return observed;
  } finally {
    await handle.close();
  }
}

async function readProjectInput(projectRoot, key, specification) {
  const absolute = path.resolve(projectRoot, specification.path);
  assert.ok(isWithin(projectRoot, absolute), `${key}: project path escapes root`);
  assert.equal(path.relative(projectRoot, absolute).split(path.sep).join("/"),
    specification.path, `${key}: project path is not normalized`);
  return {
    key,
    specification,
    ...(await readStableFile(absolute, specification, key)),
  };
}

async function readExternalInput(key, specification) {
  const absolute = path.resolve(QUARANTINE_ROOT, specification.relativePath);
  assert.ok(isWithin(QUARANTINE_ROOT, absolute), `${key}: external path escapes root`);
  return {
    key,
    specification,
    ...(await readStableFile(absolute, specification, key)),
  };
}

function publicBinding(record, external = false) {
  const binding = {
    role: record.key,
    bytes: record.bytes,
    sha256: record.sha256,
    mode: record.mode,
  };
  return external
    ? {...binding, artifactToken: record.specification.artifactToken}
    : {...binding, path: record.specification.path};
}

function recordSetSha256(records) {
  return sha256(`${records.map((record) => canonicalJson(record)).sort(compareText).join("\n")}\n`);
}

function pathSetSha256(paths) {
  return sha256(`${[...paths].sort(compareText).join("\n")}\n`);
}

function alignmentCompareText(left, right) {
  return String(left).localeCompare(String(right), "en", {sensitivity: "variant"});
}

function alignmentPathSetSha256(paths) {
  return sha256([...paths].sort(alignmentCompareText)
    .map((value) => `${value}\n`).join(""));
}

function alignmentRecordSetSha256(records) {
  return sha256([...records]
    .sort((left, right) => alignmentCompareText(left.canonicalPath, right.canonicalPath))
    .map(({canonicalPath, bytes, sha256: digest}) =>
      `${canonicalPath}\t${bytes}\t${digest}\n`)
    .join(""));
}

function validateRelativePath(value, label) {
  assert.equal(typeof value, "string", `${label}: path is not a string`);
  assert.ok(value.length > 0 && !value.includes("\0") && !value.includes("\\"),
    `${label}: invalid path bytes`);
  assert.equal(path.posix.isAbsolute(value), false, `${label}: absolute path`);
  assert.equal(path.posix.normalize(value), value, `${label}: non-normalized path`);
  assert.ok(value !== "." && value !== ".." && !value.startsWith("../"),
    `${label}: path escapes root`);
  return value;
}

function validateManifest(document) {
  assert.equal(document.schemaVersion, 1);
  assert.equal(document.algorithm, "sha256");
  assert.equal(document.sourceDirectory, "DIG");
  assert.equal(document.fileCount, EXPECTED.digFileCount);
  assert.equal(document.totalBytes, EXPECTED.digFileBytes);
  assert.equal(document.checksumSetSha256, EXPECTED.digChecksumSetSha256);
  assert.ok(Array.isArray(document.files));
  assert.equal(document.files.length, EXPECTED.digFileCount);
  let prior = null;
  const exact = new Set();
  const folded = new Set();
  let totalBytes = 0;
  let swfCount = 0;
  let flaCount = 0;
  const checksum = createHash("sha256");
  for (const [index, record] of document.files.entries()) {
    assert.deepEqual(Object.keys(record), ["path", "bytes", "sha256"],
      `DIG manifest row ${index + 1} shape drifted`);
    const relativePath = validateRelativePath(record.path, `DIG manifest row ${index + 1}`);
    assert.ok(Number.isSafeInteger(record.bytes) && record.bytes >= 0);
    assert.match(record.sha256, SHA256_PATTERN);
    assert.equal(exact.has(relativePath), false, `duplicate DIG path ${relativePath}`);
    assert.equal(folded.has(relativePath.toLocaleLowerCase("en-US")), false,
      `case-colliding DIG path ${relativePath}`);
    if (prior !== null) assert.ok(compareText(prior, relativePath) < 0,
      `DIG manifest ordering drifted at row ${index + 1}`);
    exact.add(relativePath);
    folded.add(relativePath.toLocaleLowerCase("en-US"));
    prior = relativePath;
    totalBytes += record.bytes;
    const extension = path.posix.extname(relativePath).toLowerCase();
    if (extension === ".swf") swfCount += 1;
    if (extension === ".fla") flaCount += 1;
    checksum.update(`${JSON.stringify([relativePath, record.bytes, record.sha256])}\n`);
  }
  assert.equal(totalBytes, EXPECTED.digFileBytes);
  assert.equal(swfCount, EXPECTED.digSwfCount);
  assert.equal(flaCount, EXPECTED.digFlaCount);
  assert.equal(checksum.digest("hex"), EXPECTED.digChecksumSetSha256);
  return {totalBytes, swfCount, flaCount};
}

function validateChecksumList(text, manifest) {
  assert.ok(text.endsWith("\n") && !text.includes("\r"),
    "DIG checksum list must use final LF and no CR bytes");
  const lines = text.slice(0, -1).split("\n");
  assert.equal(lines.length, EXPECTED.digFileCount);
  for (const [index, line] of lines.entries()) {
    const expected = manifest.files[index];
    assert.equal(line, `${expected.sha256}  ${expected.path}`,
      `DIG checksum list row ${index + 1} drifted`);
  }
}

function validateIntakePlan(plan, manifest) {
  assert.equal(plan.schemaVersion, 1);
  assert.equal(plan.artifactType, "help-math-drive-zip-source-intake-plan");
  assert.equal(plan.mode, "hash-manifest-plan-only-no-source-mutation");
  assert.equal(plan.policy.canonicalPrefix, KEY_TERM_PREFIX.slice(0, -1));
  assert.equal(plan.policy.automaticSourcePromotion, "prohibited");
  assert.equal(plan.counts.manifestRows, EXPECTED.digFileCount);
  assert.equal(plan.counts.manifestTotalBytes, EXPECTED.digFileBytes);
  assert.deepEqual(plan.counts.bySourceType, {
    "flash-authoring-source": EXPECTED.digFlaCount,
    "shipped-flash-runtime": EXPECTED.digSwfCount,
  });
  assert.equal(plan.counts.byConflictStatus.none, EXPECTED.digFileCount);
  assert.equal(plan.driveProvenance.entryDriveIds,
    "unavailable-in-folder-zip-export");
  assert.equal(plan.driveProvenance.syntheticEntryDriveIds, "prohibited");
  assert.equal(plan.records.length, EXPECTED.digFileCount);
  const manifestByPath = new Map(manifest.files.map((record) => [record.path, record]));
  const seen = new Set();
  for (const [index, record] of plan.records.entries()) {
    const manifestRecord = manifestByPath.get(record.manifestRelativePath);
    assert.ok(manifestRecord, `intake plan row ${index + 1}: path absent from manifest`);
    assert.equal(seen.has(record.manifestRelativePath), false,
      `intake plan duplicate path ${record.manifestRelativePath}`);
    seen.add(record.manifestRelativePath);
    assert.equal(record.canonicalPath,
      `${KEY_TERM_PREFIX}${record.manifestRelativePath}`);
    assert.equal(record.bytes, manifestRecord.bytes);
    assert.equal(record.sha256, manifestRecord.sha256);
    assert.equal(record.conflictStatus, "none");
    assert.equal(record.driveEntryId, null);
    assert.equal(record.driveEntryIdStatus,
      "unavailable-in-folder-zip-export");
  }
  assert.equal(seen.size, EXPECTED.digFileCount);
}

function validateReceipt(receipt, manifestRecord, planRecord, zipRecord) {
  assert.equal(receipt.schemaVersion, 1);
  assert.equal(receipt.authority, "owner-authorized-google-drive-download");
  assert.equal(receipt.keyTerms.manifestSha256, manifestRecord.sha256);
  assert.equal(receipt.keyTerms.intakePlanSha256, planRecord.sha256);
  assert.equal(receipt.keyTerms.currentCanonicalSourceCoverage, "443/760");
  assert.equal(receipt.keyTerms.missingSwfUniqueCasefoldRecovered,
    EXPECTED.candidateCount);
  assert.equal(receipt.keyTerms.recoveredExactFilenameCase,
    EXPECTED.exactPlacementCount);
  assert.equal(receipt.keyTerms.recoveredRequiringReviewedCaseMapping,
    EXPECTED.caseVariantCount);
  assert.equal(receipt.keyTerms.recoveredWithPairedFla, EXPECTED.pairedFlaCount);
  assert.equal(receipt.keyTerms.missingSwfStillMissing, EXPECTED.unresolvedCount);
  assert.equal(receipt.keyTerms.remainingMissingSwf, "Polynomial.swf");
  assert.equal(receipt.keyTerms.remainingFlaPresent, true);
  assert.equal(receipt.keyTerms.potentialSourceCoverage, "759/760");
  const archive = receipt.archives.find(
    ({scope}) => scope === "HELP_KEYTERMS/KT/ELEMENTARY/DIG",
  );
  assert.ok(archive);
  assert.equal(archive.bytes, zipRecord.bytes);
  assert.equal(archive.sha256, zipRecord.sha256);
  assert.equal(archive.zipIntegrityPassed, true);
  assert.deepEqual(archive.zipSafety, {
    unsafePaths: 0,
    duplicatePaths: 0,
    casefoldCollisions: 0,
    symlinks: 0,
  });
  assert.equal(archive.fileCount, EXPECTED.digFileCount);
  assert.equal(archive.logicalBytes, EXPECTED.digFileBytes);
  assert.equal(archive.checksumSetSha256, EXPECTED.digChecksumSetSha256);
  assert.ok(Object.values(receipt.acceptanceEffect).every((value) => value === false));
}

function validateLanguageInput(document, language) {
  const expected = language === "en"
    ? {
        entries: EXPECTED.englishEntryCount,
        warnings: EXPECTED.englishWarningCount,
        assetId: "ELKTEG4.xml",
        bytes: 378_783,
        sha256: "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749",
      }
    : {
        entries: EXPECTED.spanishEntryCount,
        warnings: EXPECTED.spanishWarningCount,
        assetId: "ELKTSG4.xml",
        bytes: 374_466,
        sha256: "7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00",
      };
  assert.equal(document.schemaVersion, 1);
  assert.equal(document.dataKind, "grade-wide-shell-keyterms-static-candidate");
  assert.equal(document.indexLanguage, language);
  assert.equal(document.source.assetId, expected.assetId);
  assert.equal(document.source.bytes, expected.bytes);
  assert.equal(document.source.sha256, expected.sha256);
  assert.equal(document.source.ordering, "source-file-order");
  assert.equal(document.extraction.entryCount, expected.entries);
  assert.equal(document.extraction.warningCount, expected.warnings);
  assert.equal(document.entries.length, expected.entries);
  assert.equal(document.extraction.legacyUrlsExecuted, false);
  assert.equal(document.extraction.diagramAssetsExecuted, false);
  assert.equal(document.lessonBinding.runtimeResolutionVerified, false);
  assert.equal(document.lessonBinding.productDispositionAccepted, false);
  assert.ok(Object.values(document.authority).every((value) => value === false));
  for (const [index, entry] of document.entries.entries()) {
    assert.equal(typeof entry.diagram?.declaredFilename, "string",
      `${language} entry ${index + 1}: missing diagram filename`);
    assert.equal(path.posix.basename(entry.diagram.declaredFilename),
      entry.diagram.declaredFilename,
      `${language} entry ${index + 1}: diagram contains a path`);
    assert.equal(entry.diagram.webResolutionStatus, "not-hash-bound-for-web");
  }
  return expected;
}

function declaredRuntimePaths(english, spanish) {
  const filenames = [...english.entries, ...spanish.entries]
    .map(({diagram}) => diagram.declaredFilename);
  const unique = [...new Set(filenames)].sort(compareText);
  assert.equal(filenames.length,
    EXPECTED.englishEntryCount + EXPECTED.spanishEntryCount);
  assert.equal(unique.length, EXPECTED.uniqueRuntimeCount);
  return unique.map((filename) => `${KEY_TERM_PREFIX}${filename}`);
}

function validateAlignment(alignment, missingReferences, declaredPaths) {
  assert.equal(alignment.schemaVersion, 1);
  assert.equal(alignment.artifactType, "g4-curriculum-runtime-dependency-alignment");
  assert.equal(alignment.status,
    "source-order-and-runtime-obligations-aligned-with-explicit-audio-and-keyterm-blockers");
  assert.equal(alignment.course.lessonCount, EXPECTED.lessonCount);
  assert.equal(alignment.successorPromotionAdmission.bulkIntakePromotionAuthorized, false);
  assert.equal(alignment.successorPromotionAdmission.canonicalMutationAuthorizedByThisArtifact,
    false);
  assert.equal(alignment.successorPromotionAdmission.caseInsensitiveAdmissionAuthorized, false);
  assert.equal(alignment.successorPromotionAdmission.filenameOrBasenameAdmissionAuthorized,
    false);
  assert.equal(alignment.authorityBoundary.runtimeDependencyClosure, false);
  assert.equal(alignment.authorityBoundary.ownerAccepted, false);
  assert.equal(alignment.authorityBoundary.publication, false);

  const obligations = alignment.keyTerms.diagramObligations;
  assert.equal(obligations.occurrences, EXPECTED.declaredOccurrenceCount);
  assert.equal(obligations.unique, EXPECTED.uniqueRuntimeCount);
  assert.equal(obligations.canonicalResolved, EXPECTED.canonicalResolvedCount);
  assert.equal(obligations.canonicalMissing, EXPECTED.canonicalMissingCount);
  assert.equal(obligations.totalCandidateReviewHolds, EXPECTED.candidateCount);
  assert.equal(obligations.caseVariantPlacementReviewCandidates,
    EXPECTED.caseVariantCount);
  assert.equal(obligations.exactPlacementShaReceiptReviewCandidates,
    EXPECTED.exactPlacementCount);
  assert.equal(obligations.stillUnresolvedAfterAllCandidateReviews,
    EXPECTED.unresolvedCount);
  assert.equal(obligations.potentialResolvedAfterReview,
    EXPECTED.potentialResolvedCount);
  assert.equal(obligations.missingPathSetSha256, EXPECTED.missingPathSetSha256);
  assert.equal(obligations.candidateReviewRecordSetSha256,
    EXPECTED.candidateRecordSetSha256);
  assert.equal(obligations.caseVariantReviewRecordSetSha256,
    EXPECTED.caseVariantRecordSetSha256);
  assert.equal(obligations.exactPlacementReviewRecordSetSha256,
    EXPECTED.exactPlacementRecordSetSha256);
  assert.equal(obligations.automaticCaseNormalizationAuthorized, false);
  assert.equal(obligations.automaticExactPlacementAdmissionAuthorized, false);
  assert.equal(obligations.missing.length, EXPECTED.canonicalMissingCount);
  assert.equal(alignmentPathSetSha256(
    obligations.missing.map(({expectedPath}) => expectedPath)),
    EXPECTED.missingPathSetSha256);

  assert.deepEqual(missingReferences.summary.keyterm, {
    occurrences: EXPECTED.declaredOccurrenceCount,
    unique: EXPECTED.uniqueRuntimeCount,
    resolved: EXPECTED.canonicalResolvedCount,
    missing: EXPECTED.canonicalMissingCount,
    unreferencedExisting: 16,
  });
  assert.equal(missingReferences.keyterm.length, EXPECTED.canonicalMissingCount);
  const missingByPath = new Map(missingReferences.keyterm.map((record) => [
    record.expectedPath,
    record,
  ]));
  assert.equal(missingByPath.size, EXPECTED.canonicalMissingCount);
  assert.equal(alignmentPathSetSha256(missingByPath.keys()), EXPECTED.missingPathSetSha256);
  assert.deepEqual(new Set(declaredPaths).size, EXPECTED.uniqueRuntimeCount);
  for (const item of obligations.missing) {
    const reference = missingByPath.get(item.expectedPath);
    assert.ok(reference, `alignment missing path absent from catalog: ${item.expectedPath}`);
    assert.equal(item.occurrenceCount, reference.occurrences.length);
    assert.equal(item.expectedSha256, null);
  }

  assert.equal(alignment.keyTerms.lessonDeclarations.length, EXPECTED.lessonCount);
  for (const [index, lesson] of alignment.keyTerms.lessonDeclarations.entries()) {
    assert.equal(lesson.lessonNumber, index + 1);
    assert.equal(lesson.diagramDirectory, KEY_TERM_PREFIX.slice(0, -1));
    assert.equal(lesson.englishCanonicalPresent, false);
    assert.equal(lesson.spanishCanonicalPresent, false);
    assert.equal(lesson.runtimeResolutionVerified, false);
  }
  assert.ok(Object.values(alignment.keyTerms.authorityBoundary)
    .every((value) => value === false));
  return {obligations, missingByPath};
}

async function walkOrdinaryFiles(root) {
  const records = [];
  async function visit(directory, prefix) {
    const entries = await readdir(directory, {withFileTypes: true});
    entries.sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolute = path.join(directory, entry.name);
      assert.equal(entry.isSymbolicLink(), false,
        `DIG tree contains symlink ${relative}`);
      if (entry.isDirectory()) {
        await visit(absolute, relative);
      } else {
        assert.equal(entry.isFile(), true,
          `DIG tree contains special node ${relative}`);
        records.push(relative);
      }
    }
  }
  await visit(root, "");
  return records.sort(compareText);
}

async function mapConcurrent(values, limit, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(Array.from({length: Math.min(limit, values.length)}, worker));
  return results;
}

async function rehashManifestTree(manifest) {
  const {absolutePath: root} = await canonicalDirectory(
    QUARANTINE_DIG_ROOT,
    "DIG verified root",
    "0555",
  );
  const enumerated = await walkOrdinaryFiles(root);
  const manifestPaths = manifest.files.map(({path: relativePath}) => relativePath);
  assert.deepEqual(enumerated, manifestPaths,
    "DIG verified tree path set differs from manifest");
  const observations = await mapConcurrent(manifest.files, 16, async (record, index) => {
    const absolute = path.resolve(root, record.path);
    assert.ok(isWithin(root, absolute), `DIG payload ${index + 1}: path escapes root`);
    const observed = await readStableFile(absolute, {
      bytes: record.bytes,
      sha256: record.sha256,
      mode: "0444",
    }, `DIG payload ${index + 1}`);
    return {path: record.path, bytes: observed.bytes, sha256: observed.sha256};
  });
  assert.equal(observations.length, EXPECTED.digFileCount);
  const totalBytes = observations.reduce((sum, record) => sum + record.bytes, 0);
  assert.equal(totalBytes, EXPECTED.digFileBytes);
  const checksum = createHash("sha256");
  for (const record of observations) {
    checksum.update(`${JSON.stringify([record.path, record.bytes, record.sha256])}\n`);
  }
  assert.equal(checksum.digest("hex"), EXPECTED.digChecksumSetSha256);
  return {fileCount: observations.length, totalBytes, observations};
}

async function rehashCanonicalRuntimeSet(sourceCatalog, declaredPaths, missingPathSet) {
  assert.equal(sourceCatalog.schemaVersion, 1);
  assert.ok(Array.isArray(sourceCatalog.files));
  const byFoldedBasename = new Map();
  for (const record of sourceCatalog.files.filter(({path: sourcePath, extension}) =>
    sourcePath.startsWith(KEY_TERM_PREFIX) && extension === "swf")) {
    const folded = path.posix.basename(record.path).toLocaleLowerCase("en-US");
    const candidates = byFoldedBasename.get(folded) ?? [];
    candidates.push(record);
    byFoldedBasename.set(folded, candidates);
  }
  const resolvedPaths = declaredPaths.filter((runtimePath) => !missingPathSet.has(runtimePath));
  assert.equal(resolvedPaths.length, EXPECTED.canonicalResolvedCount);
  const observations = await mapConcurrent(resolvedPaths, 16, async (runtimePath, index) => {
    const candidates = byFoldedBasename.get(
      path.posix.basename(runtimePath).toLocaleLowerCase("en-US"),
    ) ?? [];
    assert.equal(candidates.length, 1,
      `canonical Key Term catalog resolution is not unique: ${runtimePath}`);
    const record = candidates[0];
    assert.match(record.sha256, SHA256_PATTERN);
    assert.ok(Number.isSafeInteger(record.bytes) && record.bytes >= 0);
    const absolute = path.resolve(CANONICAL_SOURCE_ROOT, record.path);
    assert.ok(isWithin(CANONICAL_SOURCE_ROOT, absolute),
      `canonical Key Term ${index + 1}: path escapes root`);
    const observed = await readStableFile(absolute, {
      bytes: record.bytes,
      sha256: record.sha256,
    }, `canonical Key Term ${index + 1}`);
    const sameExactPlacement = record.path === runtimePath;
    const sameDirectory = path.posix.dirname(record.path) ===
      path.posix.dirname(runtimePath);
    return {
      expectedRuntimePath: runtimePath,
      catalogPath: record.path,
      sameExactPlacement,
      resolutionKind: sameExactPlacement
        ? "exact-path"
        : sameDirectory
          ? "case-variant-same-directory"
          : "unique-casefolded-basename-other-directory",
      bytes: observed.bytes,
      sha256: observed.sha256,
    };
  });
  const totalBytes = observations.reduce((sum, record) => sum + record.bytes, 0);
  return {
    fileCount: observations.length,
    totalBytes,
    expectedPathSetSha256: pathSetSha256(
      observations.map(({expectedRuntimePath}) => expectedRuntimePath),
    ),
    catalogPathSetSha256: pathSetSha256(
      observations.map(({catalogPath}) => catalogPath),
    ),
    exactPlacementCount: observations.filter(({sameExactPlacement}) =>
      sameExactPlacement).length,
    caseVariantSameDirectoryCount: observations.filter(({resolutionKind}) =>
      resolutionKind === "case-variant-same-directory").length,
    uniqueBasenameOtherDirectoryCount: observations.filter(({resolutionKind}) =>
      resolutionKind === "unique-casefolded-basename-other-directory").length,
    identitySetSha256: recordSetSha256(observations),
    observations,
  };
}

function buildReviewRecords(obligations, intakePlan) {
  const planByCanonicalPath = new Map(intakePlan.records.map((record) => [
    record.canonicalPath,
    record,
  ]));
  const flaByFoldedStem = new Map();
  for (const record of intakePlan.records.filter(({extension}) => extension === "fla")) {
    const stem = record.canonicalPath.slice(0, -4).toLocaleLowerCase("en-US");
    assert.equal(flaByFoldedStem.has(stem), false,
      `ambiguous FLA stem in DIG intake: ${record.canonicalPath}`);
    flaByFoldedStem.set(stem, record);
  }

  const records = obligations.missing.filter(({candidate}) => candidate).map((item) => {
    const candidate = planByCanonicalPath.get(item.candidate.canonicalPath);
    assert.ok(candidate, `alignment candidate absent from DIG plan: ${item.expectedPath}`);
    assert.equal(candidate.bytes, item.candidate.bytes);
    assert.equal(candidate.sha256, item.candidate.sha256);
    assert.equal(candidate.extension, "swf");
    const companion = flaByFoldedStem.get(
      candidate.canonicalPath.slice(0, -4).toLocaleLowerCase("en-US"),
    );
    return {
      expectedRuntimePath: item.expectedPath,
      occurrenceCount: item.occurrenceCount,
      expectedSha256: null,
      reviewClass: item.candidate.sameExactPlacement
        ? "exact-placement-sha-receipt-review"
        : "case-variant-placement-sha-receipt-review",
      candidateRuntime: {
        quarantineCanonicalPath: candidate.canonicalPath,
        bytes: candidate.bytes,
        sha256: candidate.sha256,
        sameExactPlacement: item.candidate.sameExactPlacement,
      },
      companionFla: companion
        ? {
            quarantineCanonicalPath: companion.canonicalPath,
            bytes: companion.bytes,
            sha256: companion.sha256,
          }
        : null,
      admission: {
        selected: false,
        placementAccepted: false,
        receiptAccepted: false,
        promotionAuthorized: false,
      },
    };
  }).sort((left, right) => compareText(left.expectedRuntimePath, right.expectedRuntimePath));

  assert.equal(records.length, EXPECTED.candidateCount);
  assert.equal(records.filter(({reviewClass}) =>
    reviewClass === "case-variant-placement-sha-receipt-review").length,
  EXPECTED.caseVariantCount);
  assert.equal(records.filter(({reviewClass}) =>
    reviewClass === "exact-placement-sha-receipt-review").length,
  EXPECTED.exactPlacementCount);
  assert.equal(records.filter(({companionFla}) => companionFla).length,
    EXPECTED.pairedFlaCount);
  assert.ok(records.every(({admission}) => Object.values(admission)
    .every((value) => value === false)));
  return records;
}

function validateCandidateDigests(reviewRecords, obligations) {
  const projection = reviewRecords.map(({candidateRuntime}) => ({
    canonicalPath: candidateRuntime.quarantineCanonicalPath,
    bytes: candidateRuntime.bytes,
    sha256: candidateRuntime.sha256,
  }));
  const caseVariant = reviewRecords.filter(({reviewClass}) =>
    reviewClass === "case-variant-placement-sha-receipt-review")
    .map(({candidateRuntime}) => ({
      canonicalPath: candidateRuntime.quarantineCanonicalPath,
      bytes: candidateRuntime.bytes,
      sha256: candidateRuntime.sha256,
    }));
  const exact = reviewRecords.filter(({reviewClass}) =>
    reviewClass === "exact-placement-sha-receipt-review")
    .map(({candidateRuntime}) => ({
      canonicalPath: candidateRuntime.quarantineCanonicalPath,
      bytes: candidateRuntime.bytes,
      sha256: candidateRuntime.sha256,
    }));
  assert.equal(alignmentRecordSetSha256(projection),
    obligations.candidateReviewRecordSetSha256);
  assert.equal(alignmentRecordSetSha256(caseVariant),
    obligations.caseVariantReviewRecordSetSha256);
  assert.equal(alignmentRecordSetSha256(exact),
    obligations.exactPlacementReviewRecordSetSha256);
}

function inputSetDigest(bindings) {
  return recordSetSha256(Object.entries(bindings).map(([key, value]) => ({
    key,
    bytes: value.bytes,
    sha256: value.sha256,
    mode: value.mode,
  })));
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const {absolutePath: canonicalProjectRoot} = await canonicalDirectory(
    projectRoot,
    "project root",
  );
  await canonicalDirectory(CANONICAL_SOURCE_ROOT, "canonical source root");
  await canonicalDirectory(QUARANTINE_ROOT, "quarantine root");
  const [projectRecords, externalRecords] = await Promise.all([
    Promise.all(Object.entries(PROJECT_INPUTS).map(([key, specification]) =>
      readProjectInput(canonicalProjectRoot, key, specification))),
    Promise.all(Object.entries(EXTERNAL_INPUTS).map(([key, specification]) =>
      readExternalInput(key, specification))),
  ]);
  const project = Object.fromEntries(projectRecords.map((record) => [record.key, record]));
  const external = Object.fromEntries(externalRecords.map((record) => [record.key, record]));

  const manifest = external.digManifest.document;
  validateManifest(manifest);
  validateChecksumList(UTF8.decode(external.digChecksumList.contents), manifest);
  validateIntakePlan(external.digIntakePlan.document, manifest);
  validateReceipt(
    external.intakeReceipt.document,
    external.digManifest,
    external.digIntakePlan,
    external.digZip,
  );
  validateLanguageInput(project.gradeWideEnglish.document, "en");
  validateLanguageInput(project.gradeWideSpanish.document, "es");
  const declaredPaths = declaredRuntimePaths(
    project.gradeWideEnglish.document,
    project.gradeWideSpanish.document,
  );
  const alignment = validateAlignment(
    project.runtimeAlignment.document,
    project.missingReferences.document,
    declaredPaths,
  );
  const missingPathSet = new Set(alignment.missingByPath.keys());

  const [digTree, canonicalRuntime] = await Promise.all([
    rehashManifestTree(manifest),
    rehashCanonicalRuntimeSet(
      project.sourceCatalog.document,
      declaredPaths,
      missingPathSet,
    ),
  ]);
  const reviewRecords = buildReviewRecords(
    alignment.obligations,
    external.digIntakePlan.document,
  );
  validateCandidateDigests(reviewRecords, alignment.obligations);

  const polynomial = alignment.obligations.missing.find(
    ({expectedPath}) => expectedPath === `${KEY_TERM_PREFIX}Polynomial.swf`,
  );
  assert.ok(polynomial && polynomial.candidate === null);
  assert.equal(polynomial.occurrenceCount, 2);
  const polynomialFla = external.digIntakePlan.document.records.find(
    ({canonicalPath}) =>
      canonicalPath.toLocaleLowerCase("en-US") ===
        `${KEY_TERM_PREFIX}polynomial.fla`.toLocaleLowerCase("en-US"),
  );
  assert.ok(polynomialFla);
  assert.equal(polynomialFla.sha256, EXPECTED.polynomialFlaSha256);
  assert.equal(polynomialFla.bytes, 19_456);
  assert.equal(manifest.files.some(({path: relativePath}) =>
    relativePath.toLocaleLowerCase("en-US") === "polynomial.swf"), false);

  return {
    project,
    external,
    manifest,
    declaredPaths,
    alignment,
    digTree,
    canonicalRuntime,
    reviewRecords,
    polynomial: {
      expectedRuntimePath: polynomial.expectedPath,
      occurrenceCount: polynomial.occurrenceCount,
      expectedSha256: null,
      runtimeSwfCandidate: null,
      companionFla: {
        quarantineCanonicalPath: polynomialFla.canonicalPath,
        bytes: polynomialFla.bytes,
        sha256: polynomialFla.sha256,
      },
    },
  };
}

export function deriveReport(snapshot) {
  const projectBindings = Object.fromEntries(Object.values(snapshot.project)
    .map((record) => [record.key, publicBinding(record)]));
  const externalBindings = Object.fromEntries(Object.values(snapshot.external)
    .map((record) => [record.key, publicBinding(record, true)]));
  const allBindings = {...projectBindings, ...externalBindings};
  const caseVariantRecords = snapshot.reviewRecords.filter(({reviewClass}) =>
    reviewClass === "case-variant-placement-sha-receipt-review");
  const exactPlacementRecords = snapshot.reviewRecords.filter(({reviewClass}) =>
    reviewClass === "exact-placement-sha-receipt-review");
  const report = {
    schemaVersion: "help-math-g4-key-term-runtime-resolution-plan/v1",
    artifactType: "g4-key-term-runtime-resolution-plan-v1",
    planDate: "2026-08-07",
    status:
      "acceptance-neutral-review-batches-prepared-316-holds-polynomial-runtime-unresolved",
    mode: "read-only-resolution-and-review-plan-no-executor",
    successorOf: {
      artifactType: snapshot.project.runtimeAlignment.document.artifactType,
      path: PROJECT_INPUTS.runtimeAlignment.path,
      bytes: snapshot.project.runtimeAlignment.bytes,
      sha256: snapshot.project.runtimeAlignment.sha256,
      keyTermMissingPathSetSha256: EXPECTED.missingPathSetSha256,
    },
    inputs: {
      project: projectBindings,
      privateQuarantine: externalBindings,
      inputSetSha256: inputSetDigest(allBindings),
      rawPrivateAbsolutePathsEmitted: false,
    },
    declarations: {
      lessonCount: EXPECTED.lessonCount,
      declaredDiagramOccurrences: EXPECTED.declaredOccurrenceCount,
      uniqueRuntimeSwfPaths: EXPECTED.uniqueRuntimeCount,
      uniqueRuntimePathSetSha256: pathSetSha256(snapshot.declaredPaths),
      languageSources: {
        english: {
          entryCount: EXPECTED.englishEntryCount,
          warningCount: EXPECTED.englishWarningCount,
          sourceAssetId: "ELKTEG4.xml",
          sourceBytes: 378_783,
          sourceSha256:
            "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749",
          runtimeResolutionVerified: false,
          ownerAccepted: false,
        },
        spanish: {
          entryCount: EXPECTED.spanishEntryCount,
          warningCount: EXPECTED.spanishWarningCount,
          sourceAssetId: "ELKTSG4.xml",
          sourceBytes: 374_466,
          sourceSha256:
            "7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00",
          runtimeResolutionVerified: false,
          ownerAccepted: false,
        },
        lessonSpecificDeclarationsPresent: false,
        gradeWideSubstitutionAuthorized: false,
      },
    },
    canonicalRuntimeEvidence: {
      requiredRuntimeSwfCount: EXPECTED.uniqueRuntimeCount,
      filesRehashed: snapshot.canonicalRuntime.fileCount,
      bytesRehashed: snapshot.canonicalRuntime.totalBytes,
      expectedPathSetSha256: snapshot.canonicalRuntime.expectedPathSetSha256,
      catalogPathSetSha256: snapshot.canonicalRuntime.catalogPathSetSha256,
      exactPlacementCount: snapshot.canonicalRuntime.exactPlacementCount,
      caseVariantSameDirectoryCount:
        snapshot.canonicalRuntime.caseVariantSameDirectoryCount,
      uniqueBasenameOtherDirectoryCount:
        snapshot.canonicalRuntime.uniqueBasenameOtherDirectoryCount,
      identitySetSha256: snapshot.canonicalRuntime.identitySetSha256,
      canonicalResolved: EXPECTED.canonicalResolvedCount,
      canonicalMissing: EXPECTED.canonicalMissingCount,
      sourcePresenceOnly: true,
      runtimeBehaviorVerified: false,
    },
    quarantineEvidence: {
      folderZipRehashed: true,
      folderZipBytes: snapshot.external.digZip.bytes,
      folderZipSha256: snapshot.external.digZip.sha256,
      manifestFileCount: snapshot.manifest.fileCount,
      manifestTotalBytes: snapshot.manifest.totalBytes,
      manifestChecksumSetSha256: snapshot.manifest.checksumSetSha256,
      verifiedTreeFilesRehashed: snapshot.digTree.fileCount,
      verifiedTreeBytesRehashed: snapshot.digTree.totalBytes,
      verifiedTreeChecksumSetSha256: EXPECTED.digChecksumSetSha256,
      ordinaryFileCount: snapshot.digTree.fileCount,
      symlinkCount: 0,
      specialFileCount: 0,
      writableFileCount: 0,
      missingManifestFiles: 0,
      unexpectedFiles: 0,
      perEntryDriveIdsAvailable: false,
      syntheticEntryIdsProhibited: true,
      payloadIdentityDoesNotAuthorizePlacement: true,
    },
    resolutionSummary: {
      canonicalResolved: EXPECTED.canonicalResolvedCount,
      candidateReviewHolds: EXPECTED.candidateCount,
      caseVariantPlacementReviewHolds: EXPECTED.caseVariantCount,
      exactPlacementShaReceiptReviewHolds: EXPECTED.exactPlacementCount,
      candidatesWithCompanionFla: EXPECTED.pairedFlaCount,
      runtimeSwfUnresolved: EXPECTED.unresolvedCount,
      potentialResolvedAfterAllReviewHoldsAccepted: EXPECTED.potentialResolvedCount,
      sourceDependencyClosure: false,
      missingPathSetSha256: EXPECTED.missingPathSetSha256,
      candidateRuntimeIdentitySetSha256: recordSetSha256(
        snapshot.reviewRecords.map(({candidateRuntime}) => candidateRuntime),
      ),
    },
    reviewBatches: {
      exactPlacement: {
        count: exactPlacementRecords.length,
        reviewRecordSetSha256: recordSetSha256(exactPlacementRecords),
        automaticAdmissionAuthorized: false,
        records: exactPlacementRecords,
      },
      caseVariantPlacement: {
        count: caseVariantRecords.length,
        reviewRecordSetSha256: recordSetSha256(caseVariantRecords),
        automaticCaseNormalizationAuthorized: false,
        automaticAdmissionAuthorized: false,
        records: caseVariantRecords,
      },
      unresolvedRuntime: {
        count: 1,
        recordSetSha256: recordSetSha256([snapshot.polynomial]),
        records: [{
          ...snapshot.polynomial,
          status: "required-runtime-swf-source-unresolved",
          flaDoesNotSubstituteForShippedRuntime: true,
          recoveryDecisionRequired:
            "locate a hash-bound shipped SWF or authorize a separately reviewed reconstruction path",
        }],
      },
    },
    controls: {
      executable: false,
      executorPresent: false,
      writeOrApplySupported: false,
      promotionRecordsPresent: false,
      promotionRecordCount: 0,
      bulkV7V8AdmissionAuthorized: false,
      filenameOrBasenameAdmissionAuthorized: false,
      caseInsensitiveAdmissionAuthorized: false,
      expectedSha256Invented: false,
      sourceAssetsMutationPerformed: false,
      quarantineMutationPerformed: false,
      reviewerTasksCreated: false,
      hmg4rb4Created: false,
      helperImplementedOrExecuted: false,
      originalRuntimeLaunched: false,
    },
    promotionRecords: [],
    nextAuthorizedDecisionBoundary: {
      exactPlacementRecordsRequireIndependentPlacementAndReceiptReview: 17,
      caseVariantRecordsRequireIndependentCanonicalCaseDecision: 299,
      polynomialRuntimeSwfRequiresSourceRecoveryOrSeparateReconstructionAuthority: 1,
      noDecisionIsEncodedByThisArtifact: true,
    },
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  };
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateResolutionPlanV1(report);
  return report;
}

export function validateResolutionPlanV1(report) {
  assert.equal(report.schemaVersion,
    "help-math-g4-key-term-runtime-resolution-plan/v1");
  assert.equal(report.artifactType, "g4-key-term-runtime-resolution-plan-v1");
  assert.equal(report.mode, "read-only-resolution-and-review-plan-no-executor");
  assert.equal(report.successorOf.sha256, PROJECT_INPUTS.runtimeAlignment.sha256);
  assert.equal(report.declarations.lessonCount, EXPECTED.lessonCount);
  assert.equal(report.declarations.declaredDiagramOccurrences,
    EXPECTED.declaredOccurrenceCount);
  assert.equal(report.declarations.uniqueRuntimeSwfPaths, EXPECTED.uniqueRuntimeCount);
  assert.equal(report.canonicalRuntimeEvidence.filesRehashed,
    EXPECTED.canonicalResolvedCount);
  assert.equal(report.canonicalRuntimeEvidence.canonicalMissing,
    EXPECTED.canonicalMissingCount);
  assert.equal(report.quarantineEvidence.verifiedTreeFilesRehashed,
    EXPECTED.digFileCount);
  assert.equal(report.quarantineEvidence.verifiedTreeBytesRehashed,
    EXPECTED.digFileBytes);
  assert.equal(report.quarantineEvidence.verifiedTreeChecksumSetSha256,
    EXPECTED.digChecksumSetSha256);
  assert.equal(report.resolutionSummary.candidateReviewHolds, EXPECTED.candidateCount);
  assert.equal(report.reviewBatches.exactPlacement.count, EXPECTED.exactPlacementCount);
  assert.equal(report.reviewBatches.exactPlacement.records.length,
    EXPECTED.exactPlacementCount);
  assert.equal(report.reviewBatches.caseVariantPlacement.count, EXPECTED.caseVariantCount);
  assert.equal(report.reviewBatches.caseVariantPlacement.records.length,
    EXPECTED.caseVariantCount);
  assert.equal(report.reviewBatches.unresolvedRuntime.count, EXPECTED.unresolvedCount);
  assert.equal(report.reviewBatches.unresolvedRuntime.records.length,
    EXPECTED.unresolvedCount);
  const allReviewRecords = [
    ...report.reviewBatches.exactPlacement.records,
    ...report.reviewBatches.caseVariantPlacement.records,
  ];
  assert.equal(allReviewRecords.length, EXPECTED.candidateCount);
  assert.equal(allReviewRecords.filter(({companionFla}) => companionFla).length,
    EXPECTED.pairedFlaCount);
  assert.ok(allReviewRecords.every((record) =>
    record.expectedSha256 === null &&
    Object.values(record.admission).every((value) => value === false)));
  assert.equal(report.reviewBatches.unresolvedRuntime.records[0].expectedRuntimePath,
    `${KEY_TERM_PREFIX}Polynomial.swf`);
  assert.equal(report.reviewBatches.unresolvedRuntime.records[0].runtimeSwfCandidate,
    null);
  assert.equal(report.reviewBatches.unresolvedRuntime.records[0]
    .flaDoesNotSubstituteForShippedRuntime, true);
  assert.equal(report.controls.executable, false);
  assert.equal(report.controls.executorPresent, false);
  assert.equal(report.controls.writeOrApplySupported, false);
  assert.equal(report.controls.promotionRecordsPresent, false);
  assert.equal(report.controls.promotionRecordCount, 0);
  assert.deepEqual(report.promotionRecords, []);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
  assertNoUndefined(report);
  return true;
}

export function renderMarkdown(report) {
  return `# Grade 4 Key Term runtime resolution plan v1\n\n` +
    `Status: **${report.status}**. This is a read-only, acceptance-neutral ` +
    `review plan with no executor and no promotion records.\n\n` +
    `## Bound scope\n\n` +
    `- 12 lessons declare ${report.declarations.declaredDiagramOccurrences.toLocaleString("en-US")} ` +
    `diagram occurrences across ${report.declarations.uniqueRuntimeSwfPaths} unique required SWF paths.\n` +
    `- English: ${report.declarations.languageSources.english.entryCount} source-order entries ` +
    `with ${report.declarations.languageSources.english.warningCount} preserved extraction warnings.\n` +
    `- Spanish: ${report.declarations.languageSources.spanish.entryCount} source-order entries ` +
    `with ${report.declarations.languageSources.spanish.warningCount} preserved extraction warnings.\n` +
    `- The lesson-specific EN/ES XML declarations remain absent; grade-wide substitution and ` +
    `runtime behavior remain unaccepted.\n\n` +
    `## Identity verification\n\n` +
    `- Rehashed ${report.canonicalRuntimeEvidence.filesRehashed} canonical required SWFs ` +
    `(${report.canonicalRuntimeEvidence.bytesRehashed.toLocaleString("en-US")} bytes).\n` +
    `- Rehashed the ${report.quarantineEvidence.folderZipBytes.toLocaleString("en-US")}-byte ` +
    `DIG folder ZIP at SHA-256 \`${report.quarantineEvidence.folderZipSha256}\`.\n` +
    `- Rehashed all ${report.quarantineEvidence.verifiedTreeFilesRehashed.toLocaleString("en-US")} ` +
    `manifest-bound DIG payload files (${report.quarantineEvidence.verifiedTreeBytesRehashed.toLocaleString("en-US")} bytes); ` +
    `checksum-set SHA-256 \`${report.quarantineEvidence.verifiedTreeChecksumSetSha256}\`.\n\n` +
    `## Fail-closed resolution\n\n` +
    `- Canonical now: ${report.resolutionSummary.canonicalResolved}/760.\n` +
    `- Exact-placement SHA/receipt review holds: ` +
    `${report.resolutionSummary.exactPlacementShaReceiptReviewHolds}.\n` +
    `- Case-variant placement/SHA/receipt review holds: ` +
    `${report.resolutionSummary.caseVariantPlacementReviewHolds}.\n` +
    `- Potential only after all 316 independent review decisions: ` +
    `${report.resolutionSummary.potentialResolvedAfterAllReviewHoldsAccepted}/760.\n` +
    `- \`Polynomial.swf\` remains absent. The hash-bound \`polynomial.fla\` ` +
    `is an authoring companion and is not a shipped-runtime substitute.\n\n` +
    `## Authority boundary\n\n` +
    `No case normalization, placement acceptance, promotion, helper execution, original-runtime ` +
    `launch, fidelity conclusion, acceptance, integration, release, or publication is authorized ` +
    `or performed. Report fingerprint: \`${report.reportFingerprintSha256}\`.\n`;
}

export async function writeNoClobber(absolutePath, contents) {
  const handle = await open(
    absolutePath,
    fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | NOFOLLOW,
    OUTPUT_MODE,
  );
  try {
    await handle.writeFile(contents, {encoding: "utf8"});
    await handle.sync();
  } finally {
    await handle.close();
  }
  await chmod(absolutePath, OUTPUT_MODE);
  const info = await lstat(absolutePath, {bigint: true});
  assert.ok(info.isFile() && !info.isSymbolicLink() && info.nlink === 1n);
  assert.equal(modeString(info), "0444");
}

export function parseArguments(argv) {
  assert.equal(argv.length, 1,
    "choose exactly one of --write or --check; operational modes are unsupported");
  assert.ok(["--write", "--check"].includes(argv[0]),
    "choose exactly one of --write or --check; operational modes are unsupported");
  return argv[0];
}

export async function runCli(argv, projectRoot = PROJECT_ROOT) {
  const mode = parseArguments(argv);
  const snapshot = await readSnapshot(projectRoot);
  const report = deriveReport(snapshot);
  const json = stableJson(report);
  const markdown = renderMarkdown(report);
  const outputs = [`${OUTPUT_PREFIX}.json`, `${OUTPUT_PREFIX}.md`];
  if (mode === "--write") {
    const absoluteOutputs = outputs.map((output) => path.resolve(projectRoot, output));
    for (const output of absoluteOutputs) {
      await assert.rejects(readFile(output), (error) => error?.code === "ENOENT",
        `output already exists: ${output}`);
    }
    await writeNoClobber(absoluteOutputs[0], json);
    await writeNoClobber(absoluteOutputs[1], markdown);
  } else {
    assert.equal(await readFile(path.resolve(projectRoot, outputs[0]), "utf8"), json,
      "checked-in JSON differs from live deterministic report");
    assert.equal(await readFile(path.resolve(projectRoot, outputs[1]), "utf8"), markdown,
      "checked-in Markdown differs from live deterministic report");
  }
  return {mode, outputs, report};
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  runCli(process.argv.slice(2)).then(({mode, outputs, report}) => {
    console.log(JSON.stringify({
      status: mode === "--write" ? "written" : "checked",
      outputs,
      canonicalResolved: report.resolutionSummary.canonicalResolved,
      reviewHolds: report.resolutionSummary.candidateReviewHolds,
      polynomialRuntimeUnresolved: report.resolutionSummary.runtimeSwfUnresolved,
      reportFingerprintSha256: report.reportFingerprintSha256,
    }, null, 2));
  }).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
