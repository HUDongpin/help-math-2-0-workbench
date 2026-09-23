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

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEFAULT_QUARANTINE_ROOT =
  "/Volumes/WestWorld/HELP MATH Related Files/Google Drive Source Intake/2026-08-02-HELP-ELM-FINAL-Dec21-2015";

const REPORT_JSON =
  "catalog/source-promotions/g5-l4-fq-audio-promotion-review-v1.json";
const REPORT_MARKDOWN =
  "catalog/source-promotions/g5-l4-fq-audio-promotion-review-v1.md";
const CURRENT_AUDIO_REPORT = "reports/g5-l4-current-js-audio-candidates.json";
const INTAKE_README = "README.md";
const INTAKE_RECEIPT = "manifests/intake-receipt.json";
const GRADE5_INTAKE_PLAN = "manifests/elmgr5-intake-plan.json";
const QUARANTINE_LOGICAL_ID =
  "google-drive-source-intake-2026-08-02-help-elm-final-dec21-2015";
const SOURCE_PREFIX =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const CANONICAL_G5_PREFIX = "HELP_COURSES/ELMGR5/";
const EXPECTED_MISSING_COUNT = 97;
const EXPECTED_CANDIDATE_COUNT = 91;
const EXPECTED_HOLD_COUNT = 6;
const EXPECTED_MISSING_BYTES = 5_168_346;
const EXPECTED_README_SHA256 =
  "fd3f300739e63e84b9a263d724fdbeda55dd3a1b4eee077b472de5228cc76f5e";
const EXPECTED_RECEIPT_SHA256 =
  "3633334999488f1df0c95fc7bece4669d7d9db86845f1aeab1924fd560802fd4";
const EXPECTED_PLAN_SHA256 =
  "b9fa136fc471f30c2386b1a1f2801bfa7c56a23281cf9feaa6d42b93bb9e2742";
const EXPECTED_GRADE5_ARCHIVE = Object.freeze({
  scope: "HELP_COURSES/ELMGR5",
  bytes: 1_097_547_166,
  sha256: "3bdd32a5ed6f25ffdefdbf56417a3efe03fa55c414ea8a03dabc473bdd109ecb",
  checksumSetSha256:
    "4595979c909440a083f614e53180d44d527095371220838044de028cac538238",
});
const HOLD_PATHS = Object.freeze([
  "HELP_COURSES/ELMGR5/L4/FQ/EA/Q13C.mp3",
  "HELP_COURSES/ELMGR5/L4/FQ/EA/Q18A.mp3",
  "HELP_COURSES/ELMGR5/L4/FQ/SA/Q10A.mp3",
  "HELP_COURSES/ELMGR5/L4/FQ/SA/Q11B.mp3",
  "HELP_COURSES/ELMGR5/L4/FQ/SA/Q11C.mp3",
  "HELP_COURSES/ELMGR5/L4/FQ/SA/Q9C.mp3",
]);

const ACCEPTANCE_EFFECT_KEYS = Object.freeze([
  "canonicalSourcePromoted",
  "currentJsAudioExpanded",
  "spokenLanguageEstablished",
  "originalRuntimeReachabilityEstablished",
  "originalRuntimeSynchronizationEstablished",
  "listeningAccepted",
  "ownerAccepted",
  "strictComplete",
  "released",
  "published",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
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

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveContained(root, relativePath, label) {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0 &&
      !path.isAbsolute(relativePath) && !relativePath.includes("\\"),
    `${label}: path must be portable and relative`,
  );
  const resolved = path.resolve(root, relativePath);
  invariant(isWithin(root, resolved), `${label}: path escapes its root`);
  invariant(
    portable(path.relative(root, resolved)) === relativePath,
    `${label}: path is not normalized`,
  );
  return resolved;
}

async function readOrdinaryFile(root, relativePath, label = relativePath) {
  const absolute = resolveContained(root, relativePath, label);
  const before = await lstat(absolute);
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${label}: expected one ordinary non-linked file`,
  );
  const [bytes, realRoot, realFile] = await Promise.all([
    readFile(absolute),
    realpath(root),
    realpath(absolute),
  ]);
  invariant(isWithin(realRoot, realFile), `${label}: resolves outside its root`);
  const after = await lstat(absolute);
  invariant(
    after.isFile() && !after.isSymbolicLink() && after.nlink === 1 &&
      before.dev === after.dev && before.ino === after.ino &&
      before.size === after.size && before.mtimeMs === after.mtimeMs &&
      bytes.length === after.size,
    `${label}: changed while being read`,
  );
  return {
    relativePath,
    absolute,
    bytes,
    size: bytes.length,
    sha256: sha256(bytes),
  };
}

function descriptor(record, pathLabel = record.relativePath) {
  return {path: pathLabel, bytes: record.size, sha256: record.sha256};
}

async function assertDestinationAbsent(projectRoot, relativePath) {
  const absolute = resolveContained(projectRoot, relativePath, relativePath);
  const metadata = await lstat(absolute).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  invariant(metadata === null, `${relativePath}: destination is no longer absent`);
}

function assertFalseEnvelope(value, label) {
  invariant(
    value && typeof value === "object" && !Array.isArray(value),
    `${label}: expected object`,
  );
  invariant(
    JSON.stringify(Object.keys(value).sort()) ===
      JSON.stringify([...ACCEPTANCE_EFFECT_KEYS].sort()),
    `${label}: key set changed`,
  );
  for (const key of ACCEPTANCE_EFFECT_KEYS) {
    invariant(value[key] === false, `${label}.${key}: must remain false`);
  }
}

function expectedId(row) {
  const suffix = row.kind === "question"
    ? "question"
    : String(row.option).toLowerCase();
  return `g5-l4-fq-${row.language}-q${String(row.questionNumber).padStart(2, "0")}-${suffix}`;
}

function validateCurrentAudioReport(document) {
  invariant(document?.schemaVersion === 1, "current audio report schema changed");
  invariant(
    document?.releaseId === "lesson-g05-l04-number-lines" &&
      document?.scope ===
        "54 active lesson-page occurrences; legacy course shell excluded",
    "current audio report release scope changed",
  );
  invariant(
    document?.summary?.runtimeAudioCandidatePageCount === 53 &&
      document?.summary?.fqExpectedPathCount === 180 &&
      document?.summary?.fqPresentPathCount === 83 &&
      document?.summary?.fqMissingPathCount === EXPECTED_MISSING_COUNT,
    "current audio report FQ boundary changed",
  );
  invariant(
    document?.finalQuiz?.unresolvedOwnerAnimationId === "course-g05-l04-fq-001" &&
      document?.finalQuiz?.missingPaths?.length === EXPECTED_MISSING_COUNT,
    "current audio report missing-path set changed",
  );
  invariant(
    Object.values(document.acceptance || {}).every((value) => value === false),
    "current audio report crossed an acceptance gate",
  );
}

function selectGrade5Archive(receipt) {
  const matches = (receipt?.archives || []).filter(
    (entry) => entry.scope === EXPECTED_GRADE5_ARCHIVE.scope,
  );
  invariant(matches.length === 1, "Grade 5 intake archive is not unique");
  const archive = matches[0];
  invariant(
    archive.bytes === EXPECTED_GRADE5_ARCHIVE.bytes &&
      archive.sha256 === EXPECTED_GRADE5_ARCHIVE.sha256 &&
      archive.checksumSetSha256 === EXPECTED_GRADE5_ARCHIVE.checksumSetSha256 &&
      archive.zipIntegrityPassed === true &&
      archive.zipSafety?.unsafePaths === 0 &&
      archive.zipSafety?.duplicatePaths === 0 &&
      archive.zipSafety?.casefoldCollisions === 0 &&
      archive.zipSafety?.symlinks === 0,
    "Grade 5 intake archive custody changed",
  );
  return {
    scope: archive.scope,
    bytes: archive.bytes,
    sha256: archive.sha256,
    checksumSetSha256: archive.checksumSetSha256,
    zipIntegrityPassed: true,
    unsafePathCount: 0,
    duplicatePathCount: 0,
    casefoldCollisionCount: 0,
    symlinkCount: 0,
  };
}

function reportPathToCanonical(sourceFile) {
  invariant(
    typeof sourceFile === "string" && sourceFile.startsWith(SOURCE_PREFIX),
    `${sourceFile}: expected canonical source prefix`,
  );
  const canonicalPath = sourceFile.slice(SOURCE_PREFIX.length);
  invariant(
    canonicalPath.startsWith(`${CANONICAL_G5_PREFIX}L4/FQ/`) &&
      /\/L4\/FQ\/(EA|SA)\/Q(?:[1-9]|1[0-8])(?:[A-D])?\.mp3$/.test(`/${canonicalPath}`),
    `${sourceFile}: unexpected G5 L4 FQ path`,
  );
  return canonicalPath;
}

export function validatePromotionReview(report) {
  invariant(report?.schemaVersion === 1, "promotion review schema changed");
  invariant(
    report?.artifactType === "g5-l4-fq-audio-source-promotion-review" &&
      report?.reviewId === "g5-l4-fq-audio-promotion-review-v1" &&
      report?.status === "blocked-awaiting-owner-and-custody-review" &&
      report?.authority === "acceptance-neutral-source-custody-review-input",
    "promotion review identity changed",
  );
  invariant(
    report?.summary?.expectedFqPathCount === 180 &&
      report?.summary?.canonicalPresentPathCount === 83 &&
      report?.summary?.reviewPathCount === EXPECTED_MISSING_COUNT &&
      report?.summary?.candidateNewSourceCount === EXPECTED_CANDIDATE_COUNT &&
      report?.summary?.historicalCustodyHoldCount === EXPECTED_HOLD_COUNT &&
      report?.summary?.reviewBytes === EXPECTED_MISSING_BYTES &&
      report?.summary?.englishPathCount === 49 &&
      report?.summary?.spanishPathCount === 48 &&
      report?.summary?.questionPathCount === 21 &&
      report?.summary?.answerPathCount === 76,
    "promotion review summary changed",
  );
  invariant(
    Array.isArray(report.records) && report.records.length === EXPECTED_MISSING_COUNT,
    "promotion review record count changed",
  );
  invariant(
    new Set(report.records.map((record) => record.id)).size === EXPECTED_MISSING_COUNT &&
      new Set(report.records.map((record) => record.destinationPath)).size === EXPECTED_MISSING_COUNT &&
      new Set(report.records.map((record) => record.sha256)).size === EXPECTED_MISSING_COUNT,
    "promotion review records are not one-to-one",
  );
  for (const record of report.records) {
    invariant(record.id === expectedId(record), `${record.id}: identity changed`);
    invariant(
      record.destinationInitiallyAbsent === true &&
        record.promotionEligible === false &&
        record.promotionApplied === false &&
        record.ownerDisposition === null &&
        record.custodyDisposition === null,
      `${record.id}: record crossed the unsigned review boundary`,
    );
    invariant(
      record.intakeDisposition === "candidate-new-source-in-quarantine" ||
        record.intakeDisposition === "hold-historical-custody-review",
      `${record.id}: unexpected intake disposition`,
    );
    invariant(/^[a-f0-9]{64}$/.test(record.sha256), `${record.id}: invalid SHA-256`);
  }
  invariant(
    JSON.stringify(
      report.records
        .filter((record) => record.intakeDisposition === "hold-historical-custody-review")
        .map((record) => record.canonicalPath)
        .sort(),
    ) === JSON.stringify([...HOLD_PATHS].sort()),
    "historical-custody hold set changed",
  );
  invariant(
    report?.reviewGate?.ownerCandidateDecisionRequired === true &&
      report?.reviewGate?.historicalCustodyDecisionRequired === true &&
      report?.reviewGate?.reviewerIdentity === null &&
      report?.reviewGate?.reviewedAt === null &&
      report?.reviewGate?.decisionRecord === null &&
      report?.execution?.copyAuthorized === false &&
      report?.execution?.transactionPrepared === false &&
      report?.execution?.transactionApplied === false &&
      report?.execution?.catalogRebuilt === false,
    "promotion review gate changed",
  );
  assertFalseEnvelope(report.acceptanceEffect, "acceptanceEffect");
  return true;
}

export async function buildPromotionReview({
  projectRoot = DEFAULT_PROJECT_ROOT,
  quarantineRoot = DEFAULT_QUARANTINE_ROOT,
} = {}) {
  const normalizedProjectRoot = path.resolve(projectRoot);
  const normalizedQuarantineRoot = path.resolve(quarantineRoot);
  const [generator, currentAudio, intakeReadme, intakeReceipt, intakePlan] =
    await Promise.all([
      readOrdinaryFile(normalizedProjectRoot, portable(path.relative(normalizedProjectRoot, SCRIPT_PATH)), "generator"),
      readOrdinaryFile(normalizedProjectRoot, CURRENT_AUDIO_REPORT, "current audio report"),
      readOrdinaryFile(normalizedQuarantineRoot, INTAKE_README, "intake README"),
      readOrdinaryFile(normalizedQuarantineRoot, INTAKE_RECEIPT, "intake receipt"),
      readOrdinaryFile(normalizedQuarantineRoot, GRADE5_INTAKE_PLAN, "Grade 5 intake plan"),
    ]);

  invariant(intakeReadme.sha256 === EXPECTED_README_SHA256, "intake README hash changed");
  invariant(intakeReceipt.sha256 === EXPECTED_RECEIPT_SHA256, "intake receipt hash changed");
  invariant(intakePlan.sha256 === EXPECTED_PLAN_SHA256, "Grade 5 intake plan hash changed");

  const currentAudioDocument = JSON.parse(currentAudio.bytes.toString("utf8"));
  const receiptDocument = JSON.parse(intakeReceipt.bytes.toString("utf8"));
  const intakePlanDocument = JSON.parse(intakePlan.bytes.toString("utf8"));
  validateCurrentAudioReport(currentAudioDocument);
  const grade5Archive = selectGrade5Archive(receiptDocument);

  const intakeByCanonicalPath = new Map();
  for (const record of intakePlanDocument?.records || []) {
    if (typeof record?.canonicalPath !== "string") continue;
    invariant(
      !intakeByCanonicalPath.has(record.canonicalPath),
      `${record.canonicalPath}: duplicate Grade 5 intake record`,
    );
    intakeByCanonicalPath.set(record.canonicalPath, record);
  }

  const records = [];
  for (const missing of currentAudioDocument.finalQuiz.missingPaths) {
    const canonicalPath = reportPathToCanonical(missing.sourceFile);
    const intake = intakeByCanonicalPath.get(canonicalPath);
    invariant(intake, `${canonicalPath}: missing from Grade 5 intake plan`);
    invariant(
      intake.extension === "mp3" && intake.sourceType === "audio" &&
        intake.canonicalPath === canonicalPath &&
        intake.pathStatus === "canonical-exact-path-missing" &&
        intake.canonicalExact === null && intake.conflictStatus === "none" &&
        (intake.disposition === "candidate-new-source-in-quarantine" ||
          intake.disposition === "hold-historical-custody-review"),
      `${canonicalPath}: intake disposition is not reviewable`,
    );

    const quarantineRelativePath = `verified/ELMGR5/${intake.manifestRelativePath}`;
    const source = await readOrdinaryFile(
      normalizedQuarantineRoot,
      quarantineRelativePath,
      `${canonicalPath} quarantine source`,
    );
    invariant(
      source.size === intake.bytes && source.sha256 === intake.sha256,
      `${canonicalPath}: quarantine bytes differ from the intake plan`,
    );
    const destinationPath = `${SOURCE_PREFIX}${canonicalPath}`;
    await assertDestinationAbsent(normalizedProjectRoot, destinationPath);

    records.push({
      id: expectedId(missing),
      language: missing.language,
      questionNumber: missing.questionNumber,
      kind: missing.kind,
      option: missing.option,
      canonicalPath,
      destinationPath,
      quarantineLocator: `${QUARANTINE_LOGICAL_ID}/${quarantineRelativePath}`,
      bytes: source.size,
      sha256: source.sha256,
      intakeDecision: intake.intakeDecision,
      intakeDisposition: intake.disposition,
      historicalExactHashMatchCount:
        Array.isArray(intake.historicalHashMatchRefs)
          ? intake.historicalHashMatchRefs.length
          : 0,
      conflictStatus: "none",
      destinationInitiallyAbsent: true,
      ownerDisposition: null,
      custodyDisposition: null,
      promotionEligible: false,
      promotionApplied: false,
    });
  }

  const count = (predicate) => records.filter(predicate).length;
  const sum = (predicate = () => true) => records
    .filter(predicate)
    .reduce((total, record) => total + record.bytes, 0);

  const report = {
    schemaVersion: 1,
    artifactType: "g5-l4-fq-audio-source-promotion-review",
    reviewId: "g5-l4-fq-audio-promotion-review-v1",
    releaseId: "lesson-g05-l04-number-lines",
    status: "blocked-awaiting-owner-and-custody-review",
    authority: "acceptance-neutral-source-custody-review-input",
    authorityBoundary:
      "This artifact proves that 97 exact quarantine files match the frozen Grade 5 intake and the current missing FQ path set. It does not authorize source promotion, copy files, establish spoken language or runtime behavior, accept audio, approve Owner review, complete the migration, release the lesson, or publish audio.",
    generator: descriptor(generator, "scripts/build-g5-l4-fq-audio-promotion-review.mjs"),
    sourceBindings: {
      currentAudioCandidateReport: descriptor(currentAudio),
      intakeReadme: descriptor(
        intakeReadme,
        `${QUARANTINE_LOGICAL_ID}/${INTAKE_README}`,
      ),
      intakeReceipt: descriptor(
        intakeReceipt,
        `${QUARANTINE_LOGICAL_ID}/${INTAKE_RECEIPT}`,
      ),
      grade5IntakePlan: descriptor(
        intakePlan,
        `${QUARANTINE_LOGICAL_ID}/${GRADE5_INTAKE_PLAN}`,
      ),
      grade5Archive,
    },
    summary: {
      expectedFqPathCount: 180,
      canonicalPresentPathCount: 83,
      reviewPathCount: records.length,
      candidateNewSourceCount: count(
        (record) => record.intakeDisposition === "candidate-new-source-in-quarantine",
      ),
      historicalCustodyHoldCount: count(
        (record) => record.intakeDisposition === "hold-historical-custody-review",
      ),
      reviewBytes: sum(),
      candidateNewSourceBytes: sum(
        (record) => record.intakeDisposition === "candidate-new-source-in-quarantine",
      ),
      historicalCustodyHoldBytes: sum(
        (record) => record.intakeDisposition === "hold-historical-custody-review",
      ),
      englishPathCount: count((record) => record.language === "en"),
      spanishPathCount: count((record) => record.language === "es"),
      questionPathCount: count((record) => record.kind === "question"),
      answerPathCount: count((record) => record.kind === "answer"),
      destinationPresentCount: 0,
      promotionEligibleCount: 0,
      promotionAppliedCount: 0,
    },
    reviewGate: {
      ownerCandidateDecisionRequired: true,
      candidateRecordCount: EXPECTED_CANDIDATE_COUNT,
      historicalCustodyDecisionRequired: true,
      historicalCustodyRecordCount: EXPECTED_HOLD_COUNT,
      reviewerIdentity: null,
      reviewedAt: null,
      decisionRecord: null,
      requiredOutcome:
        "A separate immutable external review must explicitly dispose every one of the 97 records. The six historical matches require custody and placement review; no repository artifact may self-authorize them.",
    },
    execution: {
      copyAuthorized: false,
      transactionPrepared: false,
      transactionApplied: false,
      catalogRebuilt: false,
      sourceFilesCopied: 0,
      sourceBytesCopied: 0,
    },
    records,
    acceptanceEffect: Object.fromEntries(
      ACCEPTANCE_EFFECT_KEYS.map((key) => [key, false]),
    ),
  };
  validatePromotionReview(report);
  return report;
}

function markdownFor(report) {
  const rows = report.records.map((record) =>
    `| ${record.id} | ${record.canonicalPath} | ${record.language} | ${record.kind}${record.option ? ` ${record.option}` : ""} | ${record.intakeDisposition} | ${record.bytes} | \`${record.sha256}\` |`,
  );
  return `# G5 L4 FQ audio source-promotion review v1\n\n` +
    `Status: **${report.status}**. This is an unsigned, non-executable source-custody review input. It copies no files and changes no acceptance or publication state.\n\n` +
    `## Exact scope\n\n` +
    `- Expected FQ paths: **180**.\n` +
    `- Already canonical: **83**.\n` +
    `- Exact quarantine paths requiring review: **${report.summary.reviewPathCount}**, ${report.summary.reviewBytes} bytes.\n` +
    `- Candidate-new-source: **${report.summary.candidateNewSourceCount}**.\n` +
    `- Historical-custody hold: **${report.summary.historicalCustodyHoldCount}**.\n` +
    `- English/Spanish: **${report.summary.englishPathCount}/${report.summary.spanishPathCount}**.\n` +
    `- Question/answer tracks: **${report.summary.questionPathCount}/${report.summary.answerPathCount}**.\n\n` +
    `Every row was re-hashed from the frozen quarantine and matched to the exact Grade 5 intake-plan record. Every canonical destination was absent at generation time. Those facts do not authorize promotion.\n\n` +
    `## Required external decisions\n\n` +
    `1. Explicitly approve or reject all ${report.summary.candidateNewSourceCount} candidate-new-source rows.\n` +
    `2. Resolve custody and canonical placement for all ${report.summary.historicalCustodyHoldCount} historical-hash matches.\n` +
    `3. Return a separate immutable, signed/attested decision record. Do not fill or sign this generated artifact.\n` +
    `4. Only after that record is independently verified may a no-overwrite atomic copy transaction be prepared.\n\n` +
    `## Records\n\n` +
    `| ID | Canonical path | Lang | Role | Intake disposition | Bytes | SHA-256 |\n` +
    `|---|---|---|---|---|---:|---|\n` +
    `${rows.join("\n")}\n\n` +
    `## Acceptance boundary\n\n` +
    `Canonical promotion, current-JS expansion, spoken-language validation, original-runtime reachability/synchronization, listening acceptance, Owner acceptance, strict completion, release, and publication all remain **false**.\n`;
}

async function writeAtomic(projectRoot, relativePath, bytes) {
  const absolute = resolveContained(projectRoot, relativePath, relativePath);
  await mkdir(path.dirname(absolute), {recursive: true});
  const existing = await readFile(absolute).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (existing?.equals(bytes)) return;
  if (existing) {
    invariant(
      relativePath === REPORT_MARKDOWN ||
        JSON.parse(existing.toString("utf8"))?.artifactType ===
          "g5-l4-fq-audio-source-promotion-review",
      `${relativePath}: refusing to replace an unmanaged file`,
    );
  }
  const temporary = `${absolute}.tmp-${process.pid}-${randomUUID()}`;
  try {
    await writeFile(temporary, bytes, {flag: "wx", mode: 0o644});
    await rename(temporary, absolute);
  } finally {
    await unlink(temporary).catch((error) => {
      if (error?.code !== "ENOENT") throw error;
    });
  }
}

export async function writeOrCheckPromotionReview({
  projectRoot = DEFAULT_PROJECT_ROOT,
  quarantineRoot = DEFAULT_QUARANTINE_ROOT,
  check = true,
} = {}) {
  const report = await buildPromotionReview({projectRoot, quarantineRoot});
  const outputs = [
    {path: REPORT_JSON, bytes: Buffer.from(stableJson(report))},
    {path: REPORT_MARKDOWN, bytes: Buffer.from(markdownFor(report))},
  ];
  if (check) {
    for (const output of outputs) {
      const actual = await readFile(resolveContained(projectRoot, output.path, output.path));
      invariant(actual.equals(output.bytes), `${output.path}: generated output is stale`);
    }
  } else {
    for (const output of outputs) {
      await writeAtomic(projectRoot, output.path, output.bytes);
    }
  }
  return report;
}

export function parseArguments(argv) {
  let check = true;
  let explicitMode = false;
  let quarantineRoot = DEFAULT_QUARANTINE_ROOT;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check" || argument === "--write") {
      invariant(!explicitMode, "choose exactly one mode");
      explicitMode = true;
      check = argument === "--check";
    } else if (argument === "--quarantine-root") {
      const value = argv[++index];
      invariant(value && path.isAbsolute(value), "--quarantine-root requires an absolute path");
      quarantineRoot = value;
    } else if (argument === "--help") {
      return {help: true, check, quarantineRoot};
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return {help: false, check, quarantineRoot};
}

function usage() {
  return `Usage: node scripts/build-g5-l4-fq-audio-promotion-review.mjs [--check|--write] [--quarantine-root <absolute-path>]\n\nDefault mode is --check. The command only builds or verifies an unsigned, non-executable review input. It never copies source files or changes an acceptance, release, or publication gate.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
  } else {
    await writeOrCheckPromotionReview(options);
    process.stdout.write(
      `G5 L4 FQ audio promotion review ${options.check ? "check" : "write"}: ${EXPECTED_MISSING_COUNT} records; copyAuthorized=false\n`,
    );
  }
}
