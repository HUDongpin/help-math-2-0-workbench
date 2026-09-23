#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readFile,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const relatedFilesRoot = path.resolve(
  defaultProjectRoot,
  "..",
  "HELP MATH Related Files",
);

export const OUTPUT_PREFIX =
  "catalog/source-promotions/g4-missing-mp3-resolution-plan-v1";

const QUARANTINE_ROOT = path.join(
  relatedFilesRoot,
  "Google Drive Source Intake",
  "2026-08-02-HELP-ELM-FINAL-Dec21-2015",
);
const FREEZE_ROOT = path.join(
  relatedFilesRoot,
  "Google Drive Source Intake",
  "2026-08-04-BOULDER-LEARNING-V7-V8-COMBINED-FREEZE-CLOSURE",
);

const INPUTS = Object.freeze({
  runtimeAlignment: Object.freeze({
    path: "catalog/alignments/g4-curriculum-runtime-dependency-map-v1.json",
    bytes: 2_272_953,
    sha256:
      "05357658e7c5f70b9d305ea64063130f1b1d816663748af45cfa1950319a670b",
  }),
  successorV3: Object.freeze({
    path:
      "catalog/source-promotions/g4-runtime-dependency-successor-v3-2026-08-04.json",
    bytes: 23_456,
    sha256:
      "789ddbd809b8fb8a8d8e3d7ab4b5d3c7c5cddb81cb6f358133575dd63e8ad07f",
  }),
  sourceCatalog: Object.freeze({
    path: "catalog/source-files.json",
    bytes: 1_894_761,
    sha256:
      "c5ba348ea968b4ae7292d86f7624a77ec105bc8f929bd61b4837c59623f33b29",
  }),
  historicalTechnicalCrosswalk: Object.freeze({
    path:
      "private-archive/historical-office-catalog-2026-07-25/technical-source-crosswalk.json",
    bytes: 891_921,
    sha256:
      "43f7d983a0b81b85e3f4e0ff682cae876936409f3a65ae58e3a5bfa49a70f1e4",
  }),
  quarantineReadme: Object.freeze({
    absolutePath: path.join(QUARANTINE_ROOT, "README.md"),
    name: "README.md",
    bytes: 9_784,
    sha256:
      "fd3f300739e63e84b9a263d724fdbeda55dd3a1b4eee077b472de5228cc76f5e",
  }),
  quarantineReceipt: Object.freeze({
    absolutePath: path.join(QUARANTINE_ROOT, "manifests", "intake-receipt.json"),
    name: "manifests/intake-receipt.json",
    bytes: 7_858,
    sha256:
      "3633334999488f1df0c95fc7bece4669d7d9db86845f1aeab1924fd560802fd4",
  }),
  quarantineGrade4Manifest: Object.freeze({
    absolutePath: path.join(QUARANTINE_ROOT, "manifests", "elmgr4-files.json"),
    name: "manifests/elmgr4-files.json",
    bytes: 798_533,
    sha256:
      "27c0dc167ed771ffa4f560d71f03f4e373c0d08ff3a52d2868db2bdef11ede4c",
  }),
  frozenAppliedReceipt: Object.freeze({
    absolutePath: path.join(
      FREEZE_ROOT,
      "combined-freeze-applied-receipt-v1.json",
    ),
    name: "combined-freeze-applied-receipt-v1.json",
    bytes: 8_375,
    sha256:
      "fd0ae61d347ab71abdc68581a2fb89761358f7d9fb1f7e5f8dc8326a54d8f751",
  }),
});

const EXPECTED = Object.freeze({
  obligationCount: 16,
  englishFinalQuizCount: 8,
  spanishOrdinaryCount: 8,
  lessonCounts: Object.freeze({2: 14, 6: 1, 8: 1}),
  basenameObservedCount: 14,
  basenameNotObservedCount: 2,
  missingPathSetSha256:
    "439fce1e41ef10591c165f0eed65638d1a7afc81080db182770911bd1d8c4286",
  sourceCatalogFileCount: 9_147,
  sourceCatalogTotalBytes: 3_214_585_414,
  sourceCatalogChecksumSetSha256:
    "30dfa12b7cd76e7200fb89115155e7d32af1356247c07e3a4f79227e93f34875",
  quarantineGrade4FileCount: 5_209,
  historicalTechnicalFileCount: 1_455,
  historicalAudioFileCount: 933,
  historicalCrosswalkSourceCatalogSha256:
    "3c69ff32fd641910f63b24709b3c0225418ba1eee823155a99b307456eb1ee6c",
  frozenV7ObjectCount: 5_793,
  frozenV8ObjectCount: 267,
  frozenUnionObjectCount: 6_060,
  frozenUnionDigestSetSha256:
    "705c93bd496e8979e14a10b66e3cb376c1f00d9d417a6c4a6acc4790169ac9ed",
});

const ACCEPTANCE_EFFECTS = Object.freeze({
  canonicalSourcePromotion: false,
  sourceDependencyClosure: false,
  javascriptImplementation: false,
  authoritativeOriginalRuntimeEvidence: false,
  runtimeFidelity: false,
  audioCorrectnessOrAcceptance: false,
  humanVisualAcceptance: false,
  ownerAcceptance: false,
  strictCompletion: false,
  wholeCourseIntegration: false,
  publication: false,
});

const RECOVERY_PROTOCOL = Object.freeze([
  Object.freeze({
    order: 1,
    state: "blocked-expected-identity-unknown",
    condition: "expectedSha256 or expectedBytes is unknown",
    machineRule:
      "select no candidate; retain the obligation as required-unresolved-source",
    nextStateRequires:
      "owner-authorized, hash-bound Grade 4 source authority establishing expectedSha256 and expectedBytes",
    promotionEffect: false,
  }),
  Object.freeze({
    order: 2,
    state: "blocked-exact-bytes-not-found-in-checked-scopes",
    condition:
      "expectedSha256 and expectedBytes are known but exactMatchCount is zero",
    machineRule:
      "retain the obligation and record the bounded checked scopes; do not infer nonexistence elsewhere",
    nextStateRequires:
      "a newly reviewed source scope or receipt containing the exact SHA-256 plus byte count",
    promotionEffect: false,
  }),
  Object.freeze({
    order: 3,
    state: "candidate-only-pending-provenance-review",
    condition:
      "at least one exact SHA-256 plus byte-count match exists but Grade 4 custody or provenance is unresolved",
    machineRule:
      "record only privacy-safe candidate counts and immutable identity; copy nothing",
    nextStateRequires:
      "reviewed Grade 4 provenance, placement, custody, and conflict disposition",
    promotionEffect: false,
  }),
  Object.freeze({
    order: 4,
    state: "eligible-for-new-successor-plan",
    condition:
      "exact identity and reviewed Grade 4 provenance are both established",
    machineRule:
      "create a new hash-bound successor plan; never mutate the frozen closure or apply automatically",
    nextStateRequires:
      "separate reviewed promotion authorization and a separately implemented executor",
    promotionEffect: false,
  }),
]);

const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
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

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error(`${label}: invalid JSON`);
  }
}

function nodeIdentity(metadata) {
  return `${metadata.dev}:${metadata.ino}`;
}

async function readStableBoundFile(absolutePath, expected, label) {
  const before = await lstat(absolutePath, {bigint: true});
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${label}: expected one ordinary non-linked file`,
  );
  const handle = await open(absolutePath, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const opened = await handle.stat({bigint: true});
    invariant(
      nodeIdentity(before) === nodeIdentity(opened),
      `${label}: path identity changed before read`,
    );
    const bytes = await handle.readFile();
    const [afterOpen, afterPath] = await Promise.all([
      handle.stat({bigint: true}),
      lstat(absolutePath, {bigint: true}),
    ]);
    invariant(
      nodeIdentity(opened) === nodeIdentity(afterOpen) &&
        nodeIdentity(opened) === nodeIdentity(afterPath) &&
        opened.size === afterOpen.size &&
        opened.mtimeNs === afterOpen.mtimeNs &&
        BigInt(bytes.length) === afterOpen.size,
      `${label}: file changed during read`,
    );
    const observed = {
      bytes: bytes.length,
      sha256: sha256Bytes(bytes),
      contents: bytes,
    };
    invariant(observed.bytes === expected.bytes, `${label}: byte count changed`);
    invariant(observed.sha256 === expected.sha256, `${label}: SHA-256 changed`);
    return observed;
  } finally {
    await handle.close();
  }
}

async function readProjectInput(projectRoot, expected, label) {
  const absolutePath = path.resolve(projectRoot, expected.path);
  invariant(isWithin(projectRoot, absolutePath), `${label}: path escapes project root`);
  invariant(
    portable(path.relative(projectRoot, absolutePath)) === expected.path,
    `${label}: path is not normalized`,
  );
  return readStableBoundFile(absolutePath, expected, label);
}

function publicProjectDescriptor(expected, observed, role) {
  return {
    role,
    path: expected.path,
    bytes: observed.bytes,
    sha256: observed.sha256,
  };
}

function publicExternalDescriptor(expected, observed, role, extra = {}) {
  return {
    role,
    artifactToken: role,
    name: expected.name,
    bytes: observed.bytes,
    sha256: observed.sha256,
    ...extra,
  };
}

function basenameOf(value) {
  return path.posix.basename(value).toLowerCase();
}

function basenameEvidence(records, pathKey, targetBasename) {
  const matches = records.filter(
    (record) => basenameOf(record[pathKey]) === targetBasename,
  );
  return {
    recordCount: matches.length,
    distinctSha256Count: new Set(matches.map((record) => record.sha256)).size,
    sha256: matches.map((record) => record.sha256),
    records: matches,
  };
}

function canonicalGradeSummary(records) {
  return [...new Set(records.map((record) => {
    const match = /^HELP_COURSES\/ELMGR([0-9]+)\//.exec(record.path);
    return match ? Number(match[1]) : null;
  }).filter((value) => value !== null))].sort((left, right) => left - right);
}

function missingPathSetSha256(records) {
  const paths = records.map((record) => record.canonicalPath).sort();
  return sha256Bytes(Buffer.from(`${paths.join("\n")}\n`));
}

function assertAllFalse(value, label) {
  invariant(value && typeof value === "object", `${label}: missing object`);
  invariant(
    JSON.stringify(Object.keys(value).sort()) ===
      JSON.stringify(Object.keys(ACCEPTANCE_EFFECTS).sort()),
    `${label}: fields changed`,
  );
  for (const key of Object.keys(ACCEPTANCE_EFFECTS)) {
    invariant(value[key] === false, `${label}.${key}: must remain false`);
  }
}

function validateBoundDocuments(documents) {
  const {alignment, successor, sourceCatalog, quarantineReceipt,
    quarantineManifest, frozenReceipt, historicalCrosswalk} = documents;

  invariant(
    alignment.schemaVersion === 1 &&
      alignment.artifactType === "g4-curriculum-runtime-dependency-alignment" &&
      alignment.course?.grade === 4 &&
      alignment.course?.lessonCount === 12,
    "runtime alignment: schema or course identity changed",
  );
  invariant(
    alignment.audio?.expected === 2_086 &&
      alignment.audio?.present === 2_070 &&
      alignment.audio?.missing === EXPECTED.obligationCount &&
      alignment.audio?.dependencyClosureComplete === false &&
      alignment.audio?.missingPathSetSha256 === EXPECTED.missingPathSetSha256,
    "runtime alignment: audio closure changed",
  );
  invariant(
    Array.isArray(alignment.audio?.missingDependencies) &&
      alignment.audio.missingDependencies.length === EXPECTED.obligationCount &&
      missingPathSetSha256(alignment.audio.missingDependencies) ===
        EXPECTED.missingPathSetSha256,
    "runtime alignment: missing dependency set changed",
  );

  invariant(
    successor.schemaVersion === "help-math-g4-ledger-successor-promotion-plan/v3" &&
      successor.artifactType === "help-math-g4-runtime-dependency-successor-plan" &&
      successor.mode === "plan-only-no-executor",
    "successor v3: schema or mode changed",
  );
  invariant(
    Array.isArray(successor.requiredUnresolvedSources) &&
      successor.requiredUnresolvedSources.length === EXPECTED.obligationCount &&
      missingPathSetSha256(successor.requiredUnresolvedSources) ===
        EXPECTED.missingPathSetSha256 &&
      successor.requiredUnresolvedSources.every((record) =>
        record.expectedSha256 === null &&
        record.ledgerExactSha256MatchCount === 0 &&
        record.filenameCaseOrPlacementAdmissionUsed === false),
    "successor v3: unresolved-source identity boundary changed",
  );
  invariant(
    successor.verifiedEvidence?.intersections
      ?.requiredMissingMp3ExactSha256Matches === 0 &&
      successor.decision?.promotionRecordCount === 0 &&
      successor.decision?.successorPlanMayBeApplied === false &&
      successor.controls?.executable === false &&
      successor.controls?.executorPresent === false &&
      successor.controls?.filenameBasenameCaseOrPlacementAdmissionUsed === false,
    "successor v3: execution or filename-admission boundary changed",
  );
  assertAllFalse(successor.acceptanceEffects, "successor v3 acceptance effects");

  const alignedByPath = new Map(
    alignment.audio.missingDependencies.map((record) => [record.canonicalPath, record]),
  );
  for (const record of successor.requiredUnresolvedSources) {
    const aligned = alignedByPath.get(record.canonicalPath);
    invariant(aligned, `${record.canonicalPath}: absent from alignment`);
    invariant(
      aligned.expectedSha256 === record.expectedSha256 &&
        aligned.language === record.language &&
        aligned.audioBindingKind === record.audioBindingKind &&
        JSON.stringify(aligned.requiredBy) === JSON.stringify(record.requiredBy) &&
        aligned.nearNameOrBasenameMatchAuthorized === false,
      `${record.canonicalPath}: alignment and successor disagree`,
    );
  }

  invariant(
    sourceCatalog.fileCount === EXPECTED.sourceCatalogFileCount &&
      sourceCatalog.totalBytes === EXPECTED.sourceCatalogTotalBytes &&
      sourceCatalog.checksumSetSha256 === EXPECTED.sourceCatalogChecksumSetSha256 &&
      Array.isArray(sourceCatalog.files) &&
      sourceCatalog.files.length === EXPECTED.sourceCatalogFileCount,
    "current source catalog: summary changed",
  );

  invariant(
    quarantineReceipt.grade4?.manifestSha256 ===
      INPUTS.quarantineGrade4Manifest.sha256 &&
      quarantineReceipt.grade4?.canonicalSamePathConflict === 0 &&
      quarantineReceipt.grade4?.lessonCount === 12,
    "2026-08-02 quarantine receipt: Grade 4 binding changed",
  );
  invariant(
    Array.isArray(quarantineManifest.files) &&
      quarantineManifest.files.length === EXPECTED.quarantineGrade4FileCount,
    "2026-08-02 quarantine Grade 4 manifest: file count changed",
  );

  invariant(
    frozenReceipt.schemaVersion ===
      "help-math-drive-intake-combined-freeze-applied/v1" &&
      frozenReceipt.outcome ===
      "frozen-read-only-with-unresolved-independent-review" &&
      frozenReceipt.ledgerClosure?.v7?.objectCount === EXPECTED.frozenV7ObjectCount &&
      frozenReceipt.ledgerClosure?.v8?.objectCount === EXPECTED.frozenV8ObjectCount &&
      frozenReceipt.ledgerClosure?.union?.uniqueSha256Count ===
        EXPECTED.frozenUnionObjectCount &&
      frozenReceipt.ledgerClosure?.union?.digestSetSha256 ===
        EXPECTED.frozenUnionDigestSetSha256 &&
      frozenReceipt.unresolved?.grade4MissingMp3Count === EXPECTED.obligationCount &&
      frozenReceipt.unresolved?.successorPromotionPlanApplied === false &&
      frozenReceipt.lifecycle?.futureWritesRequireNewSuccessorRoot === true,
    "v7/v8 frozen closure: identity or unresolved boundary changed",
  );
  invariant(
    frozenReceipt.claims?.quarantineFrozen === true &&
      frozenReceipt.claims?.canonicalPromotion === false &&
      frozenReceipt.claims?.audioCorrectnessOrAcceptance === false &&
      frozenReceipt.claims?.strictCompletion === false &&
      frozenReceipt.claims?.publication === false &&
      frozenReceipt.privacyBoundary?.rawPathsAndClaimsRemainPrivate === true,
    "v7/v8 frozen closure: claims or privacy boundary changed",
  );

  invariant(
    historicalCrosswalk.summary?.fileCount ===
      EXPECTED.historicalTechnicalFileCount &&
      historicalCrosswalk.summary?.families?.audio ===
      EXPECTED.historicalAudioFileCount &&
      historicalCrosswalk.summary?.sourceCatalog?.sha256 ===
      EXPECTED.historicalCrosswalkSourceCatalogSha256 &&
      Array.isArray(historicalCrosswalk.files) &&
      historicalCrosswalk.files.length === EXPECTED.historicalTechnicalFileCount,
    "historical technical crosswalk: aggregate identity changed",
  );
}

function dispositionFor(record, basenameObserved) {
  if (!basenameObserved) {
    return "blocked-expected-sha256-unknown-basename-not-observed-in-checked-scopes";
  }
  if (record.audioBindingKind === "final-quiz-question-answer") {
    return "blocked-expected-sha256-unknown-generic-fq-basename-ambiguous";
  }
  return "blocked-expected-sha256-unknown-cross-grade-basename-only";
}

function buildObligation({record, sourceCatalog, quarantineManifest,
  historicalCrosswalk}) {
  const targetBasename = basenameOf(record.canonicalPath);
  const quarantinePath = record.canonicalPath.replace(
    /^HELP_COURSES\/ELMGR4\//,
    "",
  );
  invariant(quarantinePath !== record.canonicalPath, "target escaped Grade 4 course scope");

  const canonicalBasename = basenameEvidence(
    sourceCatalog.files,
    "path",
    targetBasename,
  );
  const quarantineBasename = basenameEvidence(
    quarantineManifest.files,
    "path",
    targetBasename,
  );
  const historicalBasename = basenameEvidence(
    historicalCrosswalk.files,
    "historicalPath",
    targetBasename,
  );
  const allHashes = new Set([
    ...canonicalBasename.sha256,
    ...quarantineBasename.sha256,
    ...historicalBasename.sha256,
  ]);
  const basenameObserved =
    canonicalBasename.recordCount +
      quarantineBasename.recordCount +
      historicalBasename.recordCount > 0;
  const lessonMatch = /\/L([0-9]+)\//.exec(record.canonicalPath);
  invariant(lessonMatch, `${record.canonicalPath}: lesson is not encoded`);

  const exactCanonical = sourceCatalog.files.filter(
    (candidate) => candidate.path === record.canonicalPath,
  ).length;
  const exactQuarantine = quarantineManifest.files.filter(
    (candidate) => candidate.path === quarantinePath,
  ).length;
  const exactHistorical = historicalCrosswalk.files.filter(
    (candidate) => candidate.historicalPath === record.canonicalPath ||
      candidate.historicalPath.endsWith(`/${record.canonicalPath}`),
  ).length;
  invariant(
    exactCanonical === 0 && exactQuarantine === 0 && exactHistorical === 0,
    `${record.canonicalPath}: exact target path is no longer absent`,
  );

  return {
    obligationId: `g4-missing-mp3-${String(record.canonicalPath)
      .replace(/^HELP_COURSES\/ELMGR4\//, "")
      .replace(/\.mp3$/i, "")
      .replaceAll("/", "-")
      .toLowerCase()}`,
    canonicalPath: record.canonicalPath,
    lesson: Number(lessonMatch[1]),
    sourceType: record.sourceType,
    audioBindingKind: record.audioBindingKind,
    language: record.language,
    requiredBy: [...record.requiredBy],
    bindingReason: record.bindingReason,
    expectedSha256: null,
    expectedBytes: null,
    exactSha256CandidateCount: 0,
    selectedCandidate: null,
    exactTargetPathAbsence: {
      currentCanonicalCatalogCount: exactCanonical,
      grade4QuarantineManifestCount: exactQuarantine,
      historicalTechnicalCrosswalkCount: exactHistorical,
      allCheckedPathBearingCatalogsAbsent: true,
      proofScope:
        "bounded to the three named path-bearing catalogs; not proof of universal byte nonexistence",
    },
    basenameDiscoveryOnly: {
      basename: path.posix.basename(record.canonicalPath),
      observed: basenameObserved,
      admissionAllowed: false,
      filenameInferenceUsed: false,
      currentCanonicalCatalog: {
        recordCount: canonicalBasename.recordCount,
        distinctSha256Count: canonicalBasename.distinctSha256Count,
        observedGrades: canonicalGradeSummary(canonicalBasename.records),
      },
      grade4QuarantineManifest: {
        recordCount: quarantineBasename.recordCount,
        distinctSha256Count: quarantineBasename.distinctSha256Count,
      },
      historicalTechnicalCrosswalk: {
        recordCount: historicalBasename.recordCount,
        distinctSha256Count: historicalBasename.distinctSha256Count,
        rawPathsEmitted: 0,
      },
      aggregate: {
        recordCount:
          canonicalBasename.recordCount +
          quarantineBasename.recordCount +
          historicalBasename.recordCount,
        distinctSha256Count: allHashes.size,
        identityAuthority: false,
      },
    },
    frozenLedgerDisposition: {
      expectedIdentityKnown: false,
      exactSha256MatchCount: record.ledgerExactSha256MatchCount,
      pathOrBasenameAdmissionApplicable: false,
      conclusion:
        "no frozen object is admissible while the expected SHA-256 plus byte-count identity is unknown",
      universalNonexistenceProven: false,
    },
    disposition: dispositionFor(record, basenameObserved),
  };
}

export function validateResolutionPlan(plan) {
  invariant(
    plan.schemaVersion === "help-math-g4-missing-mp3-resolution-plan/v1" &&
      plan.artifactType === "g4-missing-mp3-resolution-plan-v1" &&
      plan.status === "acceptance-neutral-required-sources-unresolved" &&
      plan.mode === "resolution-plan-only-no-executor",
    "resolution plan: schema, status, or mode changed",
  );
  invariant(
    Array.isArray(plan.obligations) &&
      plan.obligations.length === EXPECTED.obligationCount &&
      new Set(plan.obligations.map((record) => record.canonicalPath)).size ===
      EXPECTED.obligationCount &&
      missingPathSetSha256(plan.obligations) === EXPECTED.missingPathSetSha256,
    "resolution plan: obligation set changed",
  );
  invariant(
    plan.obligations.every((record) =>
      record.expectedSha256 === null &&
      record.expectedBytes === null &&
      record.exactSha256CandidateCount === 0 &&
      record.selectedCandidate === null &&
      record.basenameDiscoveryOnly?.admissionAllowed === false &&
      record.basenameDiscoveryOnly?.filenameInferenceUsed === false &&
      record.exactTargetPathAbsence?.allCheckedPathBearingCatalogsAbsent === true &&
      record.frozenLedgerDisposition?.expectedIdentityKnown === false &&
      record.frozenLedgerDisposition?.universalNonexistenceProven === false),
    "resolution plan: an unknown identity or filename candidate was admitted",
  );

  const englishFq = plan.obligations.filter((record) =>
    record.language === "en" &&
    record.audioBindingKind === "final-quiz-question-answer");
  const spanishOrdinary = plan.obligations.filter((record) =>
    record.language === "es" &&
    record.audioBindingKind === "ordinary-spanish-page");
  invariant(
    englishFq.length === EXPECTED.englishFinalQuizCount &&
      spanishOrdinary.length === EXPECTED.spanishOrdinaryCount,
    "resolution plan: language or binding distribution changed",
  );
  for (const [lesson, count] of Object.entries(EXPECTED.lessonCounts)) {
    invariant(
      plan.obligations.filter((record) => record.lesson === Number(lesson)).length === count,
      `resolution plan: Lesson ${lesson} distribution changed`,
    );
  }
  invariant(
    plan.obligations.filter((record) => record.basenameDiscoveryOnly.observed).length ===
      EXPECTED.basenameObservedCount &&
      plan.obligations.filter((record) => !record.basenameDiscoveryOnly.observed).length ===
      EXPECTED.basenameNotObservedCount,
    "resolution plan: basename observation distribution changed",
  );

  invariant(
    Array.isArray(plan.promotionRecords) && plan.promotionRecords.length === 0 &&
      plan.controls?.executable === false &&
      plan.controls?.executorPresent === false &&
      plan.controls?.writeOrApplySupported === false &&
      plan.controls?.sourceAssetsMutationAuthorized === false &&
      plan.controls?.sourceAssetsMutationPerformed === false &&
      plan.controls?.quarantineMutationPerformed === false &&
      plan.controls?.frozenLedgerMutationPerformed === false &&
      plan.controls?.historicalArchiveBytesRead === false &&
      plan.controls?.historicalRawPathsEmitted === 0 &&
      plan.controls?.personalRecordsEmitted === 0 &&
      plan.controls?.filenameBasenameCaseOrPlacementAdmissionUsed === false,
    "resolution plan: execution, mutation, or privacy boundary changed",
  );
  assertAllFalse(plan.acceptanceEffects, "resolution plan acceptance effects");

  invariant(
    Array.isArray(plan.recoveryProtocol) &&
      plan.recoveryProtocol.length === 4 &&
      plan.recoveryProtocol.every((state, index) =>
        state.order === index + 1 && state.promotionEffect === false) &&
      JSON.stringify(plan.recoveryProtocol.map((state) => state.state)) ===
      JSON.stringify(RECOVERY_PROTOCOL.map((state) => state.state)),
    "resolution plan: recovery protocol changed",
  );
  invariant(
    plan.summary?.obligationCount === EXPECTED.obligationCount &&
      plan.summary?.englishFinalQuizCount === EXPECTED.englishFinalQuizCount &&
      plan.summary?.spanishOrdinaryCount === EXPECTED.spanishOrdinaryCount &&
      plan.summary?.basenameObservedCount === EXPECTED.basenameObservedCount &&
      plan.summary?.basenameNotObservedCount === EXPECTED.basenameNotObservedCount &&
      plan.summary?.selectedCandidateCount === 0 &&
      plan.summary?.promotionRecordCount === 0,
    "resolution plan: summary changed",
  );

  const serialized = JSON.stringify(plan);
  for (const forbidden of [
    "historicalPath",
    "private-archive/",
    "/Volumes/",
    "firstObservedSource",
    "firstObservedDriveRootRelativePath",
  ]) {
    invariant(!serialized.includes(forbidden), `resolution plan leaks ${forbidden}`);
  }
  invariant(
    !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(serialized),
    "resolution plan contains an email-like value",
  );
  return plan;
}

export async function buildResolutionPlan({
  projectRoot: projectRootOption = defaultProjectRoot,
} = {}) {
  const projectRoot = path.resolve(projectRootOption);
  const [alignmentInput, successorInput, sourceCatalogInput,
    historicalCrosswalkInput, quarantineReadmeInput, quarantineReceiptInput,
    quarantineManifestInput, frozenReceiptInput] = await Promise.all([
    readProjectInput(projectRoot, INPUTS.runtimeAlignment, "runtime alignment"),
    readProjectInput(projectRoot, INPUTS.successorV3, "successor v3"),
    readProjectInput(projectRoot, INPUTS.sourceCatalog, "current source catalog"),
    readProjectInput(
      projectRoot,
      INPUTS.historicalTechnicalCrosswalk,
      "historical technical crosswalk metadata",
    ),
    readStableBoundFile(
      INPUTS.quarantineReadme.absolutePath,
      INPUTS.quarantineReadme,
      "2026-08-02 quarantine README",
    ),
    readStableBoundFile(
      INPUTS.quarantineReceipt.absolutePath,
      INPUTS.quarantineReceipt,
      "2026-08-02 quarantine receipt",
    ),
    readStableBoundFile(
      INPUTS.quarantineGrade4Manifest.absolutePath,
      INPUTS.quarantineGrade4Manifest,
      "2026-08-02 quarantine Grade 4 manifest",
    ),
    readStableBoundFile(
      INPUTS.frozenAppliedReceipt.absolutePath,
      INPUTS.frozenAppliedReceipt,
      "v7/v8 combined freeze applied receipt",
    ),
  ]);

  const documents = {
    alignment: parseJson(alignmentInput.contents, "runtime alignment"),
    successor: parseJson(successorInput.contents, "successor v3"),
    sourceCatalog: parseJson(sourceCatalogInput.contents, "current source catalog"),
    historicalCrosswalk: parseJson(
      historicalCrosswalkInput.contents,
      "historical technical crosswalk metadata",
    ),
    quarantineReceipt: parseJson(
      quarantineReceiptInput.contents,
      "2026-08-02 quarantine receipt",
    ),
    quarantineManifest: parseJson(
      quarantineManifestInput.contents,
      "2026-08-02 quarantine Grade 4 manifest",
    ),
    frozenReceipt: parseJson(
      frozenReceiptInput.contents,
      "v7/v8 combined freeze applied receipt",
    ),
  };
  validateBoundDocuments(documents);

  const obligations = documents.successor.requiredUnresolvedSources.map((record) =>
    buildObligation({
      record,
      sourceCatalog: documents.sourceCatalog,
      quarantineManifest: documents.quarantineManifest,
      historicalCrosswalk: documents.historicalCrosswalk,
    }));

  const plan = {
    schemaVersion: "help-math-g4-missing-mp3-resolution-plan/v1",
    artifactType: "g4-missing-mp3-resolution-plan-v1",
    planDate: "2026-08-04",
    status: "acceptance-neutral-required-sources-unresolved",
    mode: "resolution-plan-only-no-executor",
    scope: {
      grade: 4,
      obligationCount: EXPECTED.obligationCount,
      purpose:
        "bind the 16 unresolved runtime MP3 obligations, preserve bounded absence and ambiguity evidence, and define fail-closed recovery states",
      identityRule: "complete lowercase SHA-256 plus byte count",
      exactPathRule:
        "path absence is reported only for named path-bearing catalogs and is not universal byte nonexistence proof",
      frozenLedgerRule:
        "frozen SHA identities cannot be admitted while an obligation's expected SHA-256 plus byte count is unknown",
      basenameRule:
        "basename, filename case, grade resemblance, placement resemblance, and audio similarity are discovery-only",
    },
    sourceBindings: {
      runtimeAlignment: publicProjectDescriptor(
        INPUTS.runtimeAlignment,
        alignmentInput,
        "current-g4-runtime-dependency-alignment",
      ),
      successorV3: publicProjectDescriptor(
        INPUTS.successorV3,
        successorInput,
        "acceptance-neutral-g4-ledger-successor-v3",
      ),
      currentSourceCatalog: publicProjectDescriptor(
        INPUTS.sourceCatalog,
        sourceCatalogInput,
        "current-canonical-source-catalog",
      ),
      quarantine20260802: {
        artifactToken: "google-drive-source-intake-2026-08-02",
        custody: "private-acceptance-neutral-quarantine",
        readme: publicExternalDescriptor(
          INPUTS.quarantineReadme,
          quarantineReadmeInput,
          "quarantine-readme",
        ),
        intakeReceipt: publicExternalDescriptor(
          INPUTS.quarantineReceipt,
          quarantineReceiptInput,
          "quarantine-intake-receipt",
          {grade4CanonicalSamePathConflictCount: 0},
        ),
        grade4Manifest: publicExternalDescriptor(
          INPUTS.quarantineGrade4Manifest,
          quarantineManifestInput,
          "quarantine-grade4-file-manifest",
          {fileCount: documents.quarantineManifest.files.length},
        ),
        canonicalPromotionAuthority: false,
      },
      frozenV7V8Closure: publicExternalDescriptor(
        INPUTS.frozenAppliedReceipt,
        frozenReceiptInput,
        "frozen-v7-v8-combined-closure",
        {
          outcome: documents.frozenReceipt.outcome,
          v7ObjectCount: EXPECTED.frozenV7ObjectCount,
          v8ObjectCount: EXPECTED.frozenV8ObjectCount,
          uniqueSha256Count: EXPECTED.frozenUnionObjectCount,
          digestSetSha256: EXPECTED.frozenUnionDigestSetSha256,
          independentReviewReceiptPresent: false,
          futureWritesRequireNewSuccessorRoot: true,
        },
      ),
      historicalTechnicalCrosswalk: {
        role: "historical-technical-crosswalk-aggregate-only",
        artifactToken: "historical-technical-crosswalk-2026-07-25",
        bytes: historicalCrosswalkInput.bytes,
        sha256: historicalCrosswalkInput.sha256,
        schemaVersion: documents.historicalCrosswalk.schemaVersion,
        technicalFileCount: EXPECTED.historicalTechnicalFileCount,
        audioFileCount: EXPECTED.historicalAudioFileCount,
        historicalRawPathsEmitted: 0,
        rawArchiveBytesRead: false,
        priorSourceCatalogMatchStatusesReused: false,
        priorSourceCatalogSha256:
          EXPECTED.historicalCrosswalkSourceCatalogSha256,
        currentSourceCatalogCheckedSeparately: true,
      },
    },
    distribution: {
      byLesson: {L2: 14, L6: 1, L8: 1},
      byBindingAndLanguage: {
        englishFinalQuizQuestionAnswer: 8,
        spanishOrdinaryPage: 8,
      },
    },
    obligations,
    recoveryProtocol: RECOVERY_PROTOCOL.map((state) => ({...state})),
    promotionRecords: [],
    controls: {
      planOnly: true,
      executable: false,
      executorPresent: false,
      writeOrApplySupported: false,
      sourceAssetsMutationAuthorized: false,
      sourceAssetsMutationPerformed: false,
      quarantineMutationPerformed: false,
      frozenLedgerMutationPerformed: false,
      historicalArchiveMutationPerformed: false,
      historicalArchiveBytesRead: false,
      historicalRawPathsEmitted: 0,
      personalRecordsEmitted: 0,
      filenameBasenameCaseOrPlacementAdmissionUsed: false,
      futureExactCandidateRequiresKnownExpectedSha256AndBytes: true,
      futureCandidateRequiresNewReviewedSuccessorPlan: true,
      generatorWritesOnlyNewJsonAndMarkdownOutputs: true,
      generatorWriteModeNoClobber: true,
      generatorCheckModeReadOnly: true,
    },
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    summary: {
      outcome: "all-16-obligations-remain-fail-closed",
      obligationCount: obligations.length,
      englishFinalQuizCount: obligations.filter((record) => record.language === "en").length,
      spanishOrdinaryCount: obligations.filter((record) => record.language === "es").length,
      lessonCounts: {L2: 14, L6: 1, L8: 1},
      expectedSha256KnownCount: 0,
      expectedSha256UnknownCount: obligations.length,
      exactTargetPathAbsentCount: obligations.filter((record) =>
        record.exactTargetPathAbsence.allCheckedPathBearingCatalogsAbsent).length,
      basenameObservedCount: obligations.filter((record) =>
        record.basenameDiscoveryOnly.observed).length,
      basenameNotObservedCount: obligations.filter((record) =>
        !record.basenameDiscoveryOnly.observed).length,
      selectedCandidateCount: 0,
      promotionRecordCount: 0,
      executorPresent: false,
      acceptanceEffect: false,
    },
  };
  return validateResolutionPlan(plan);
}

function markdownCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function descriptorLine(label, descriptor) {
  return `| ${label} | ${descriptor.bytes} | \`${descriptor.sha256}\` |`;
}

export function renderMarkdown(plan) {
  validateResolutionPlan(plan);
  const rows = plan.obligations.map((record, index) => {
    const discovery = record.basenameDiscoveryOnly;
    const counts = [
      `C ${discovery.currentCanonicalCatalog.recordCount}/${discovery.currentCanonicalCatalog.distinctSha256Count}`,
      `Q4 ${discovery.grade4QuarantineManifest.recordCount}/${discovery.grade4QuarantineManifest.distinctSha256Count}`,
      `H ${discovery.historicalTechnicalCrosswalk.recordCount}/${discovery.historicalTechnicalCrosswalk.distinctSha256Count}`,
    ].join("; ");
    return `| ${index + 1} | \`${markdownCell(record.canonicalPath)}\` | L${record.lesson} | ${record.audioBindingKind} | ${record.language} | null | ${counts} | \`${record.disposition}\` |`;
  });
  const protocolRows = plan.recoveryProtocol.map((state) =>
    `| ${state.order} | \`${state.state}\` | ${markdownCell(state.condition)} | ${markdownCell(state.machineRule)} |`);
  const bindings = plan.sourceBindings;
  const inputRows = [
    descriptorLine("Runtime alignment", bindings.runtimeAlignment),
    descriptorLine("Successor v3", bindings.successorV3),
    descriptorLine("Current source catalog", bindings.currentSourceCatalog),
    descriptorLine("Quarantine README", bindings.quarantine20260802.readme),
    descriptorLine("Quarantine intake receipt", bindings.quarantine20260802.intakeReceipt),
    descriptorLine("Quarantine Grade 4 manifest", bindings.quarantine20260802.grade4Manifest),
    descriptorLine("Frozen v7/v8 applied receipt", bindings.frozenV7V8Closure),
    descriptorLine(
      "Historical technical crosswalk aggregate",
      bindings.historicalTechnicalCrosswalk,
    ),
  ];
  return `# Grade 4 missing MP3 resolution plan v1

Status: **acceptance-neutral; all 16 required runtime sources remain unresolved**.

This document is a deterministic, non-executable resolution plan. It copies no
source, mutates no canonical/quarantine/frozen/archive custody, selects no
candidate, and changes no acceptance or publication gate.

## Bound evidence

| Evidence | Bytes | SHA-256 |
|---|---:|---|
${inputRows.join("\n")}

The historical source is represented only by an aggregate descriptor: 1,455
technical records, including 933 audio records. No historical raw path, Drive
display path, claim path, personal record, or archive byte is emitted. Its old
source-catalog match status is not reused; the current catalog is checked
separately.

## Result

- Obligations: 16.
- Binding/language: 8 English final-quiz question/answer dependencies and 8
  ordinary Spanish page dependencies.
- Lesson distribution: L2 = 14, L6 = 1, L8 = 1.
- Expected SHA-256 identities known: 0; unknown: 16.
- Exact target path absent from each named path-bearing catalog: 16/16.
- Basename observed in at least one checked catalog: 14; not observed: 2.
- Selected candidates: 0; promotion records: 0; executor: absent.

Exact-path absence is bounded to the current canonical catalog, the 2026-08-02
Grade 4 quarantine manifest, and the historical technical crosswalk. It is not
proof that the target bytes do not exist elsewhere. The frozen v7/v8 closure
contains 6,060 unique SHA-256 identities, but no frozen object is admissible
until the target's expected SHA-256 and byte count are known.

Counts below are discovery-only \`records/distinct SHA-256 identities\`:
\`C\` = current canonical catalog, \`Q4\` = Grade 4 quarantine manifest, and
\`H\` = privacy-safe historical aggregate. Basename counts never establish
identity.

## Obligations

| # | Exact runtime dependency | Lesson | Binding | Lang | Expected SHA | Basename observations | Disposition |
|---:|---|---:|---|---|---|---|---|
${rows.join("\n")}

## Four-state recovery protocol

| State | Machine status | Condition | Required machine behavior |
|---:|---|---|---|
${protocolRows.join("\n")}

State 4 authorizes only creation of a new, reviewed, hash-bound successor plan.
It does not authorize source promotion. Any future promotion requires separate
review, separate authorization, and a separately implemented executor.

## Fixed boundaries

- \`promotionRecords\` remains empty and no write/apply executor exists.
- Filename, basename, case, grade resemblance, placement resemblance, size,
  audio similarity, or listening judgment cannot establish byte identity.
- Cross-grade \`L2IN21.mp3\` through \`L2IN26.mp3\` observations are not Grade 4
  candidates without exact expected identity and reviewed provenance.
- \`L6GS03.mp3\` and \`L8GS03.mp3\` were not observed by basename in the named
  checked catalogs; that bounded result is not universal nonexistence proof.
- Canonical source promotion, dependency closure, JavaScript implementation,
  original-runtime evidence, runtime/audio fidelity, human/owner acceptance,
  strict completion, whole-course integration, and publication all remain
  false.
`;
}

function resolveOutputPaths(projectRoot, outputPrefix = OUTPUT_PREFIX) {
  invariant(
    typeof outputPrefix === "string" &&
      outputPrefix.startsWith("catalog/source-promotions/") &&
      !outputPrefix.includes("\\") &&
      !path.posix.isAbsolute(outputPrefix) &&
      path.posix.normalize(outputPrefix) === outputPrefix &&
      !outputPrefix.endsWith(".json") &&
      !outputPrefix.endsWith(".md"),
    "output prefix must be an extensionless normalized path below catalog/source-promotions",
  );
  const json = path.resolve(projectRoot, `${outputPrefix}.json`);
  const markdown = path.resolve(projectRoot, `${outputPrefix}.md`);
  invariant(
    isWithin(projectRoot, json) && isWithin(projectRoot, markdown),
    "output escapes project root",
  );
  return {json, markdown};
}

async function existingFile(file) {
  try {
    const metadata = await lstat(file);
    invariant(
      metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
      `${file}: output is not one ordinary non-linked file`,
    );
    return await readFile(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

export async function writeNoClobberOrCheck({
  plan,
  projectRoot: projectRootOption = defaultProjectRoot,
  outputPrefix = OUTPUT_PREFIX,
  mode,
} = {}) {
  validateResolutionPlan(plan);
  invariant(mode === "write" || mode === "check", "mode must be write or check");
  const projectRoot = path.resolve(projectRootOption);
  const outputs = resolveOutputPaths(projectRoot, outputPrefix);
  const expected = {
    json: stableJson(plan),
    markdown: renderMarkdown(plan),
  };
  if (mode === "check") {
    const [json, markdown] = await Promise.all([
      existingFile(outputs.json),
      existingFile(outputs.markdown),
    ]);
    invariant(json !== null, "resolution-plan JSON output is missing");
    invariant(markdown !== null, "resolution-plan Markdown output is missing");
    invariant(json === expected.json, "resolution-plan JSON output is stale");
    invariant(markdown === expected.markdown, "resolution-plan Markdown output is stale");
    return {action: "verified", outputs};
  }

  invariant(
    await existingFile(outputs.json) === null &&
      await existingFile(outputs.markdown) === null,
    "write-no-clobber refused: one or more outputs already exist",
  );
  await mkdir(path.dirname(outputs.json), {recursive: true});
  const directory = await lstat(path.dirname(outputs.json));
  invariant(
    directory.isDirectory() && !directory.isSymbolicLink(),
    "output directory is not an ordinary directory",
  );
  const created = [];
  try {
    await writeFile(outputs.json, expected.json, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o644,
    });
    created.push(outputs.json);
    await writeFile(outputs.markdown, expected.markdown, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o644,
    });
    created.push(outputs.markdown);
  } catch (error) {
    for (const file of created.reverse()) await unlink(file).catch(() => {});
    throw error;
  }
  return {action: "written-new-files", outputs};
}

export function parseArguments(argv) {
  const options = {help: false, mode: null};
  for (const argument of argv) {
    if (argument === "--write") {
      invariant(options.mode === null, "choose exactly one of --write or --check");
      options.mode = "write";
    } else if (argument === "--check") {
      invariant(options.mode === null, "choose exactly one of --write or --check");
      options.mode = "check";
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  if (!options.help) {
    invariant(options.mode !== null, "choose exactly one of --write or --check");
  }
  return options;
}

function usage() {
  return `Usage: node scripts/build-g4-missing-mp3-resolution-plan-v1.mjs (--write|--check)

  --write   Create the JSON and Markdown outputs only when neither exists
  --check   Read-only verification of both deterministic outputs
  --help    Show this help

This acceptance-neutral generator reads only bound catalogs and receipts. It
does not read historical archive bytes, copy sources, promote candidates,
mutate quarantine or frozen ledgers, or provide an apply executor.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
  } else {
    const plan = await buildResolutionPlan();
    const result = await writeNoClobberOrCheck({plan, mode: options.mode});
    process.stdout.write(`${JSON.stringify({
      action: result.action,
      artifactType: plan.artifactType,
      obligationCount: plan.summary.obligationCount,
      basenameObservedCount: plan.summary.basenameObservedCount,
      basenameNotObservedCount: plan.summary.basenameNotObservedCount,
      promotionRecordCount: plan.summary.promotionRecordCount,
      executorPresent: plan.summary.executorPresent,
      acceptanceEffect: plan.summary.acceptanceEffect,
    }, null, 2)}\n`);
  }
}
