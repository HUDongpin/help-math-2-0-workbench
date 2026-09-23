#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  buildCandidatePackage,
  checkPackage,
} from "./build-g4-l10-vb003-static-specification-candidate-package-v1.mjs";
import {
  JSON_OUTPUT_RELATIVE as REVIEW_JSON_RELATIVE,
  MARKDOWN_OUTPUT_RELATIVE as REVIEW_MARKDOWN_RELATIVE,
  buildReviewInput,
  checkReviewInput,
} from "./build-g4-l10-vb003-static-specification-candidate-v1-review-input.mjs";

const scriptPath = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");
export const REPORT_RELATIVE =
  "reports/g4-l10-vb003-static-specification-adopter-readiness-v1.json";

const CANDIDATE_DIRECTORY_RELATIVE =
  "migrations/course-g04-l10-vb-003/audit/vb003-static-specification-candidate-v1";
const CANDIDATE_RECEIPT_RELATIVE =
  `${CANDIDATE_DIRECTORY_RELATIVE}/candidate-receipt.json`;
const CANDIDATE_NESTED_RELATIVE =
  `${CANDIDATE_DIRECTORY_RELATIVE}/nested-structural-keyframes.candidate.csv`;
const COVERAGE_RELATIVE =
  "migrations/course-g04-l10-vb-003/evidence/full-frame-coverage.json";
const DISPOSITION_RELATIVE =
  "migrations/course-g04-l10-vb-003/audit/frame-domain-disposition.json";
const DEFINITION_TARGET_RELATIVE =
  "migrations/course-g04-l10-vb-003/audit/machine/swf-definition-inventory.csv";
const ADOPTION_RECEIPT_TARGET_RELATIVE =
  "migrations/course-g04-l10-vb-003/audit/machine/vb003-static-specification-adoption-receipt-v1.json";

const REQUIRED_PREIMAGE_SET_SHA256 =
  "e472ce78ecab8658194af162c93eff1cfa7c42117dfa1851f0e78b1372cff043";
const CANDIDATE_PATCH_FINGERPRINT_SHA256 =
  "4f2d311e007c79b867c7d8eaf660dd9c7c80b793f562ae10f607e35bc1730954";
const CANDIDATE_RECEIPT_FILE_SHA256 =
  "389299f633cdbcfff3317396ba9a059978308d1538931216ee51a67f58c73a26";
const CANDIDATE_RECEIPT_FINGERPRINT_SHA256 =
  "704e5c0cffff9fa818f02f8925c0c22ba5a1461ab0c1de0e2262957500ee9098";
const REVIEW_INPUT_FINGERPRINT_SHA256 =
  "98eb757b566173d92e4a739557cadfd69150e9d884aed33bc2fc4b8538827811";
const REVIEW_JSON_SHA256 =
  "7f3f3cad3c6d08f5b78a7be37effad11f638bbbefcd9483fe3d37f3009023108";
const REVIEW_MARKDOWN_SHA256 =
  "456aaa117a15d00bd8a430623efb3a094412a1f561702b6e4efb6f24747ace51";
const COVERAGE_SHA256 =
  "98b85bc001b4538af82ba8cb92b82e482687a3bdd68ccece50f27854095bf4e2";
const DISPOSITION_SHA256 =
  "d69f282c571ed3ec19228372db425f52ae0d099c6b47bf27de9d9b680f92df68";
const SHA256 = /^[a-f0-9]{64}$/u;

const CANONICAL_KEYFRAME_HEADER = [
  "frame",
  "requirement_id",
  "frame_domain_id",
  "trace_id",
  "entry_state_sha256",
  "time_ms",
  "scenario",
  "language",
  "kind",
  "expected_state",
  "trigger",
  "baseline_file",
  "baseline_sha256",
  "implementation_file",
  "implementation_sha256",
  "diff_file",
  "diff_sha256",
  "normalized_rmse",
  "timing_result",
  "visual_result",
  "evidence_source",
  "reviewer",
  "notes",
];

const AUTHORITY_EFFECT_KEYS = Object.freeze([
  "reviewTaskAuthorization",
  "reviewVerdict",
  "candidateAdoption",
  "specificationAcceptance",
  "canonicalWorkspaceMutation",
  "sourcePromotion",
  "sourceMutation",
  "productionHelperImplementation",
  "productionHelperTest",
  "protectedInstallation",
  "helperExecution",
  "originalRuntimeLaunch",
  "authoritativeOriginalRuntimeEvidence",
  "baselineAdoption",
  "rendererAdoption",
  "behaviorAcceptance",
  "visualRmseAcceptance",
  "audioAcceptance",
  "humanVisualAcceptance",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictCompletion",
  "lessonBatchAdmission",
  "wholeLessonIntegration",
  "remainingGrade4BatchStart",
  "wholeCourseIntegration",
  "release",
  "publication",
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

function compareText(left, right) {
  return Buffer.compare(Buffer.from(left), Buffer.from(right));
}

function modeString(info) {
  const mode = typeof info.mode === "bigint" ? info.mode : BigInt(info.mode);
  return Number(mode & 0o777n).toString(8).padStart(4, "0");
}

function statIdentity(info) {
  return [
    info.dev,
    info.ino,
    info.mode,
    info.nlink,
    info.uid,
    info.gid,
    info.size,
    info.mtimeNs,
    info.ctimeNs,
  ].map(String).join(":");
}

function contained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function canonicalRoot(projectRoot) {
  const lexical = path.resolve(projectRoot);
  const info = await lstat(lexical);
  assert.ok(info.isDirectory() && !info.isSymbolicLink(),
    `Project root must be an ordinary directory: ${lexical}`);
  assert.equal(await realpath(lexical), lexical,
    `Project root resolves through a symlink: ${lexical}`);
  return lexical;
}

function resolveInside(root, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false,
    `Absolute path is forbidden: ${relativePath}`);
  assert.equal(relativePath.includes("\\"), false,
    `Non-portable path is forbidden: ${relativePath}`);
  const absolute = path.resolve(root, relativePath);
  assert.ok(contained(root, absolute), `Path escapes root: ${relativePath}`);
  return absolute;
}

async function assertOrdinaryAncestors(root, absoluteParent) {
  assert.ok(absoluteParent === root || contained(root, absoluteParent));
  const relative = path.relative(root, absoluteParent);
  let cursor = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const info = await lstat(cursor);
    assert.ok(info.isDirectory() && !info.isSymbolicLink(),
      `Path ancestor must be an ordinary directory: ${cursor}`);
    assert.equal(await realpath(cursor), cursor,
      `Path ancestor resolves through a symlink: ${cursor}`);
  }
}

async function stableRead(root, relativePath, expected = {}) {
  const absolute = resolveInside(root, relativePath);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `Input must be an ordinary non-symlink file: ${relativePath}`);
  assert.equal(await realpath(absolute), absolute,
    `Input resolves through a symlink: ${relativePath}`);
  assert.equal(before.nlink, 1n, `Input must have one hard link: ${relativePath}`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `Input changed while read: ${relativePath}`);
  assert.equal(BigInt(bytes.length), before.size,
    `Input byte count drifted: ${relativePath}`);
  const digest = sha256(bytes);
  if (expected.sha256) assert.equal(digest, expected.sha256,
    `Input SHA-256 drifted: ${relativePath}`);
  if (expected.bytes !== undefined) assert.equal(bytes.length, expected.bytes,
    `Input byte count drifted: ${relativePath}`);
  if (expected.mode) assert.equal(modeString(before), expected.mode,
    `Input mode drifted: ${relativePath}`);
  return {
    path: relativePath,
    bytes,
    byteCount: bytes.length,
    sha256: digest,
    mode: modeString(before),
  };
}

async function assertAbsent(root, relativePath) {
  const absolute = resolveInside(root, relativePath);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  try {
    await lstat(absolute);
  } catch (error) {
    if (error?.code === "ENOENT") return true;
    throw error;
  }
  assert.fail(`Target must be absent: ${relativePath}`);
}

function csvField(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function renderCsvRows(rows) {
  return rows.map((row) => CANONICAL_KEYFRAME_HEADER
    .map((header) => csvField(row[header])).join(",")).join("\n");
}

function evidenceSource() {
  return [
    `${CANDIDATE_NESTED_RELATIVE}@sha256:99b123ab80b4cd487e04973a0d9833d87dbefe65936540cc7276a26800686c24`,
    `${CANDIDATE_RECEIPT_RELATIVE}@sha256:${CANDIDATE_RECEIPT_FILE_SHA256}`,
    `${COVERAGE_RELATIVE}@sha256:${COVERAGE_SHA256}`,
    `${DISPOSITION_RELATIVE}@sha256:${DISPOSITION_SHA256}`,
  ].join("; ");
}

function canonicalNestedRow(row) {
  assert.equal(row.frameDomainId, "sprite-120");
  assert.ok(Number.isInteger(row.frame) && row.frame >= 1 && row.frame <= 203);
  assert.ok(["en", "es"].includes(row.language));
  assert.equal(row.runtimeReachability, "unresolved");
  assert.equal(row.adoptionStatus,
    "candidate-only-do-not-write-current-keyframes");
  for (const key of [
    "baselineFile",
    "baselineSha256",
    "implementationFile",
    "implementationSha256",
    "diffFile",
    "diffSha256",
    "normalizedRmse",
    "timingResult",
    "visualResult",
    "reviewer",
  ]) assert.equal(row[key], null, `Candidate evidence field must remain empty: ${key}`);
  return {
    frame: row.frame,
    requirement_id: row.requirementId,
    frame_domain_id: row.frameDomainId,
    trace_id: row.traceId,
    entry_state_sha256: row.entryStateSha256,
    time_ms: row.timeMs,
    scenario: row.scenario,
    language: row.language,
    kind: row.kind,
    expected_state: [
      "source-static-nested-domain-specification-only",
      "frameDomain=sprite-120",
      `localFrame=${row.frame}/203`,
      `structuralReasons=${row.structuralReasons.join("|")}`,
      "runtimeReachability=unresolved",
    ].join("; "),
    trigger: [
      "source-static-independent-domain-selection-only",
      "natural entry and runtime causality unproven",
      "strictAcceptanceEffect=none",
    ].join("; "),
    baseline_file: "",
    baseline_sha256: "",
    implementation_file: "",
    implementation_sha256: "",
    diff_file: "",
    diff_sha256: "",
    normalized_rmse: "",
    timing_result: "",
    visual_result: "",
    evidence_source: evidenceSource(),
    reviewer: "",
    notes: [
      "Acceptance-neutral source-static structural specification only.",
      "Admission requires a separately recorded independent-review verdict and guarded-adopter receipt; this row does not encode either.",
      "Runtime reachability, natural playback, timing, interaction causality, language/audio behavior, baseline, renderer, visual/RMSE, human, owner, strict completion, integration, release, and publication remain unresolved.",
      "strictAcceptanceEffect=none.",
    ].join(" "),
  };
}

export function buildCanonicalKeyframesPostimage(currentBytes, proposedRows) {
  assert.ok(Buffer.isBuffer(currentBytes));
  assert.equal(currentBytes.includes(0x0d), false,
    "Canonical keyframes preimage must not contain CR bytes");
  assert.equal(currentBytes.at(-1), 0x0a,
    "Canonical keyframes preimage must end in LF");
  const currentText = currentBytes.toString("utf8");
  const lines = currentText.trimEnd().split("\n");
  assert.equal(lines[0], CANONICAL_KEYFRAME_HEADER.join(","),
    "Canonical keyframes schema drifted");
  assert.equal(lines.length - 1, 8,
    "Canonical keyframes preimage must contain exactly eight root rows");
  assert.equal(proposedRows.length, 12);
  const rows = proposedRows.map(canonicalNestedRow);
  assert.equal(new Set(rows.map((row) => [
    row.requirement_id,
    row.frame_domain_id,
    row.frame,
    row.language,
  ].join("\0"))).size, 12, "Projected nested keyframe identities collide");
  const appended = `${renderCsvRows(rows)}\n`;
  const postimage = Buffer.concat([currentBytes, Buffer.from(appended, "utf8")]);
  assert.equal(postimage.toString("utf8").trimEnd().split("\n").length - 1, 20);
  return {postimage, rows};
}

function futureTarget({path: targetPath, operation, preimage, postimage, source}) {
  const target = {
    path: targetPath,
    operation,
    preimage,
    postimage: {
      bytes: postimage.length,
      sha256: sha256(postimage),
      intendedMode: "0644",
    },
    source,
    writtenByThisArtifact: false,
  };
  assert.match(target.postimage.sha256, SHA256);
  return target;
}

function postimageSetSha256(targets) {
  const payload = [...targets].sort((left, right) =>
    compareText(left.path, right.path)).map((target) =>
    `${target.path}\0${target.postimage.sha256}\n`).join("");
  return sha256(payload);
}

export async function buildAdopterReadiness(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const candidatePackage = await buildCandidatePackage(root);
  await checkPackage(candidatePackage);
  const reviewBundle = await buildReviewInput(root);
  await checkReviewInput(reviewBundle);
  assert.equal(candidatePackage.receipt.receiptFingerprintSha256,
    CANDIDATE_RECEIPT_FINGERPRINT_SHA256);
  assert.equal(reviewBundle.document.reviewInputFingerprintSha256,
    REVIEW_INPUT_FINGERPRINT_SHA256);
  assert.equal(reviewBundle.document.reviewTasks.authorized, false);
  assert.equal(reviewBundle.document.reviewTasks.verdictPresent, false);
  assert.equal(candidatePackage.plan.preimageSetSha256,
    REQUIRED_PREIMAGE_SET_SHA256);
  assert.equal(candidatePackage.plan.guardedAdopterContract
    .candidatePatchFingerprintSha256, CANDIDATE_PATCH_FINGERPRINT_SHA256);

  const reviewJson = await stableRead(root, REVIEW_JSON_RELATIVE, {
    sha256: REVIEW_JSON_SHA256,
    bytes: 35790,
    mode: "0444",
  });
  const reviewMarkdown = await stableRead(root, REVIEW_MARKDOWN_RELATIVE, {
    sha256: REVIEW_MARKDOWN_SHA256,
    bytes: 4016,
    mode: "0444",
  });
  const candidateReceipt = await stableRead(root, CANDIDATE_RECEIPT_RELATIVE, {
    sha256: CANDIDATE_RECEIPT_FILE_SHA256,
    bytes: 4300,
    mode: "0444",
  });
  const coverage = await stableRead(root, COVERAGE_RELATIVE, {
    sha256: COVERAGE_SHA256,
    bytes: 16564,
    mode: "0644",
  });
  const disposition = await stableRead(root, DISPOSITION_RELATIVE, {
    sha256: DISPOSITION_SHA256,
    bytes: 15617,
    mode: "0644",
  });

  const migrationExpected = candidatePackage.plan.inputBindings.migration;
  const briefExpected = candidatePackage.plan.inputBindings.brief;
  const keyframesExpected = candidatePackage.plan.inputBindings.keyframes;
  const migration = await stableRead(root, migrationExpected.path, migrationExpected);
  const brief = await stableRead(root, briefExpected.path, briefExpected);
  const keyframes = await stableRead(root, keyframesExpected.path, keyframesExpected);
  await assertAbsent(root, DEFINITION_TARGET_RELATIVE);
  await assertAbsent(root, ADOPTION_RECEIPT_TARGET_RELATIVE);

  const keyframeProjection = buildCanonicalKeyframesPostimage(
    keyframes.bytes,
    candidatePackage.plan.proposedChanges.find((change) =>
      change.id === "P1-D-nested-structural-keyframe-candidates")?.proposed.rows ?? [],
  );
  assert.deepEqual(keyframeProjection.rows.map((row) => row.frame),
    [1, 3, 4, 51, 130, 203, 1, 3, 4, 51, 130, 203]);
  assert.deepEqual(keyframeProjection.rows.map((row) => row.language),
    ["en", "en", "en", "en", "en", "en", "es", "es", "es", "es", "es", "es"]);

  const targets = [
    futureTarget({
      path: migration.path,
      operation: "replace-exact-preimage",
      preimage: {bytes: migration.byteCount, sha256: migration.sha256, mode: migration.mode},
      postimage: Buffer.from(candidatePackage.outputs.migration, "utf8"),
      source: `${CANDIDATE_DIRECTORY_RELATIVE}/migration.candidate.json`,
    }),
    futureTarget({
      path: brief.path,
      operation: "replace-exact-preimage",
      preimage: {bytes: brief.byteCount, sha256: brief.sha256, mode: brief.mode},
      postimage: Buffer.from(candidatePackage.outputs.brief, "utf8"),
      source: `${CANDIDATE_DIRECTORY_RELATIVE}/MIGRATION_BRIEF.candidate.md`,
    }),
    futureTarget({
      path: keyframes.path,
      operation: "replace-exact-preimage-with-schema-preserving-append",
      preimage: {bytes: keyframes.byteCount, sha256: keyframes.sha256, mode: keyframes.mode},
      postimage: keyframeProjection.postimage,
      source: `${CANDIDATE_NESTED_RELATIVE} transformed into the canonical 23-column schema`,
    }),
    futureTarget({
      path: DEFINITION_TARGET_RELATIVE,
      operation: "create-only-if-absent",
      preimage: {requiredState: "absent"},
      postimage: Buffer.from(candidatePackage.outputs.definitionInventory, "utf8"),
      source: `${CANDIDATE_DIRECTORY_RELATIVE}/swf-definition-inventory.candidate.csv`,
    }),
  ];

  const authorityEffects = Object.fromEntries(
    AUTHORITY_EFFECT_KEYS.map((key) => [key, false]));
  const documentWithoutFingerprint = {
    schemaVersion: 1,
    artifactType: "g4-l10-vb003-static-specification-adopter-readiness-v1",
    status: "frozen-postimage-projection-no-review-verdict-do-not-apply",
    decision: "DO_NOT_APPLY",
    releaseId: "lesson-g04-l10-perimeter-area",
    animationId: "course-g04-l10-vb-003",
    purpose: [
      "Freeze a deterministic, schema-preserving postimage projection for a future separately authorized guarded adopter.",
      "Expose the exact semantic mapping for independent review without changing canonical workspace files.",
    ],
    evidenceInputs: {
      candidateReceipt: {
        path: candidateReceipt.path,
        bytes: candidateReceipt.byteCount,
        sha256: candidateReceipt.sha256,
        mode: candidateReceipt.mode,
        receiptFingerprintSha256: CANDIDATE_RECEIPT_FINGERPRINT_SHA256,
      },
      reviewInputJson: {
        path: reviewJson.path,
        bytes: reviewJson.byteCount,
        sha256: reviewJson.sha256,
        mode: reviewJson.mode,
        reviewInputFingerprintSha256: REVIEW_INPUT_FINGERPRINT_SHA256,
      },
      reviewInputMarkdown: {
        path: reviewMarkdown.path,
        bytes: reviewMarkdown.byteCount,
        sha256: reviewMarkdown.sha256,
        mode: reviewMarkdown.mode,
      },
      coverage: {
        path: coverage.path,
        bytes: coverage.byteCount,
        sha256: coverage.sha256,
        mode: coverage.mode,
      },
      frameDomainDisposition: {
        path: disposition.path,
        bytes: disposition.byteCount,
        sha256: disposition.sha256,
        mode: disposition.mode,
      },
    },
    guards: {
      requiredPreimageSetSha256: REQUIRED_PREIMAGE_SET_SHA256,
      candidatePatchFingerprintSha256: CANDIDATE_PATCH_FINGERPRINT_SHA256,
      exactPreimagesRevalidated: true,
      candidatePackageRevalidated: true,
      frozenReviewInputRevalidated: true,
      noClobberRequired: true,
      definitionInventoryTargetCurrentlyAbsent: true,
      adoptionReceiptTargetCurrentlyAbsent: true,
    },
    canonicalKeyframeProjection: {
      schemaColumns: CANONICAL_KEYFRAME_HEADER.length,
      preservedRootRows: 8,
      projectedNestedRows: 12,
      projectedTotalRows: 20,
      nestedDomain: "sprite-120",
      nestedFramesByLanguage: {
        en: [1, 3, 4, 51, 130, 203],
        es: [1, 3, 4, 51, 130, 203],
      },
      runtimeReachabilityEstablished: false,
      runtimeEvidenceFieldsPopulated: false,
      specificationAcceptanceEstablished: false,
    },
    futureCanonicalTargets: targets,
    futureCanonicalPostimageSetSha256: postimageSetSha256(targets),
    futureAdoptionReceipt: {
      path: ADOPTION_RECEIPT_TARGET_RELATIVE,
      requiredPreimageState: "absent",
      postimageNotDerivableUntilIndependentReviewVerdictExists: true,
      createdByThisArtifact: false,
    },
    independentReviewGate: {
      priorReviewInputIsEvidenceOnly: true,
      reviewerTasksAuthorized: false,
      reviewerTasksCreated: false,
      reviewerTaskIds: [],
      verdictPresent: false,
      minimumRequiredResultBeforeAnyFutureAdopter: "independent exact-preimage and semantic-boundary PASS bound to this exact readiness artifact",
      aPassWouldNotByItselfAuthorizeAdoption: true,
    },
    implementationBoundary: {
      artifactIsAdopter: false,
      actualCanonicalWriteSupported: false,
      applySupported: false,
      recoverSupported: false,
      rollbackSupported: false,
      protectedInstallationSupported: false,
      helperExecutionSupported: false,
      originalRuntimeLaunchSupported: false,
      reportPublicationOnly: true,
    },
    supportedCliModes: ["--dry-run", "--write-no-clobber", "--check"],
    writeNoClobberMeaning: `publish only ${REPORT_RELATIVE}; never write a projected canonical target`,
    authorityEffects,
    nextPermittedAction: "Freeze a successor independent-review input that includes this exact generator, test, report, candidate package, and prior no-verdict review evidence. Do not create reviewer tasks without explicit user authorization.",
  };
  assert.equal(targets.length, 4);
  assert.ok(Object.values(authorityEffects).every((value) => value === false));
  assert.equal(documentWithoutFingerprint.independentReviewGate.verdictPresent, false);
  assert.equal(documentWithoutFingerprint.implementationBoundary.applySupported, false);
  const readinessFingerprintSha256 = sha256(Buffer.from(
    canonicalJson(documentWithoutFingerprint), "utf8"));
  const document = {...documentWithoutFingerprint, readinessFingerprintSha256};
  const json = `${JSON.stringify(document, null, 2)}\n`;
  return {root, candidatePackage, reviewBundle, document, json, keyframeProjection};
}

async function assertInputsCurrent(bundle) {
  const current = await buildAdopterReadiness(bundle.root);
  assert.equal(current.json, bundle.json,
    "Adopter-readiness inputs changed after derivation");
}

export async function checkAdopterReadiness(bundle, outputRoot = bundle.root) {
  const root = await canonicalRoot(outputRoot);
  await assertInputsCurrent(bundle);
  const expected = Buffer.from(bundle.json, "utf8");
  const observed = await stableRead(root, REPORT_RELATIVE, {
    bytes: expected.length,
    sha256: sha256(expected),
    mode: "0444",
  });
  assert.deepEqual(observed.bytes, expected,
    "Adopter-readiness report bytes drifted");
  return {
    disposition: "checked",
    status: bundle.document.status,
    report: REPORT_RELATIVE,
    reportSha256: observed.sha256,
    futureCanonicalTargets: bundle.document.futureCanonicalTargets.length,
    projectedKeyframeRows:
      bundle.document.canonicalKeyframeProjection.projectedTotalRows,
    readinessFingerprintSha256: bundle.document.readinessFingerprintSha256,
    reviewerTaskAuthorized: false,
    verdictPresent: false,
    applySupported: false,
    acceptanceEffect: false,
  };
}

export async function publishReadinessNoClobber(bundle, options = {}) {
  const outputRoot = await canonicalRoot(options.outputRoot ?? bundle.root);
  await assertInputsCurrent(bundle);
  const absolute = resolveInside(outputRoot, REPORT_RELATIVE);
  await assertOrdinaryAncestors(outputRoot, path.dirname(absolute));
  await assertAbsent(outputRoot, REPORT_RELATIVE);
  await (options.beforeWrite ?? (async () => {}))();
  await assertInputsCurrent(bundle);
  await writeFile(absolute, bundle.json, {flag: "wx", mode: 0o600});
  await chmod(absolute, 0o444);
  await assertInputsCurrent(bundle);
  return checkAdopterReadiness(bundle, outputRoot);
}

export function parseArguments(argv) {
  assert.equal(argv.length, 1,
    "Choose exactly one of --dry-run, --write-no-clobber, or --check");
  assert.ok(["--dry-run", "--write-no-clobber", "--check"].includes(argv[0]),
    "Only --dry-run, --write-no-clobber, and --check are supported");
  return argv[0];
}

export async function runCli(
  argv = process.argv.slice(2),
  projectRoot = PROJECT_ROOT,
) {
  const mode = parseArguments(argv);
  const bundle = await buildAdopterReadiness(projectRoot);
  if (mode === "--write-no-clobber") return publishReadinessNoClobber(bundle);
  if (mode === "--check") return checkAdopterReadiness(bundle);
  return {
    disposition: "dry-run",
    status: bundle.document.status,
    report: REPORT_RELATIVE,
    futureCanonicalTargets: bundle.document.futureCanonicalTargets.length,
    projectedKeyframeRows:
      bundle.document.canonicalKeyframeProjection.projectedTotalRows,
    readinessFingerprintSha256: bundle.document.readinessFingerprintSha256,
    reviewerTaskAuthorized: false,
    verdictPresent: false,
    applySupported: false,
    acceptanceEffect: false,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  runCli().then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
