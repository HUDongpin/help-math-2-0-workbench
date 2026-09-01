#!/usr/bin/env node

/**
 * Validate the human-reviewed Common Core grade mapping for the G6-G8 shared
 * source scope.  This command never infers a grade from a module code, path,
 * filename, or lesson title.  It emits a deterministic readiness projection
 * and keeps learner route generation closed until every required record meets
 * the evidence, score, and independent-review contract.
 */

import {createHash} from "node:crypto";
import {access, mkdir, readFile, rename, rm, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {
  MODULES,
  stableJson,
  validateGradeMapping,
  validateSharedProfile,
} from "./lib/g678-shared-catalog.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const DEFAULT_PROFILE = "catalog/g678-shared-source-profile.v1.json";
export const DEFAULT_MAPPING = "catalog/g678-grade-mapping.v1.json";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function projectPath(value, label) {
  invariant(typeof value === "string" && value.length > 0, `${label} requires a path`);
  const resolved = path.isAbsolute(value) ? path.resolve(value) : path.resolve(PROJECT_ROOT, value);
  return resolved;
}

function portableProjectPath(value) {
  const relative = path.relative(PROJECT_ROOT, value);
  if (relative === ".." || relative.startsWith(`..${path.sep}`)) {
    return `$EXTERNAL/${path.basename(value)}`;
  }
  return relative.split(path.sep).join("/");
}

async function readJson(value, label) {
  const filePath = projectPath(value, label);
  const bytes = await readFile(filePath);
  let parsed;
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
  return {filePath, bytes, parsed, sha256: sha256(bytes)};
}

async function exists(value) {
  try {
    await access(value);
    return true;
  } catch {
    return false;
  }
}

function identityOfReviewer(reviewer) {
  if (!reviewer || typeof reviewer !== "object") return null;
  const value = reviewer.identity ?? reviewer.reviewerId ?? reviewer.id ?? reviewer.name;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function roleOfReviewer(reviewer) {
  if (!reviewer || typeof reviewer !== "object") return "";
  return String(reviewer.role ?? reviewer.reviewerRole ?? "").toLowerCase();
}

function recordReadiness(record, profile) {
  const blockers = [];
  const status = record.status;
  const scores = [6, 7, 8].map((grade) => Number(record.scoresByGrade?.[String(grade)] ?? 0));
  const identities = new Set((record.reviewers ?? []).map(identityOfReviewer).filter(Boolean));
  const roles = (record.reviewers ?? []).map(roleOfReviewer);
  const evidenceLevels = new Set((record.evidence ?? []).map((entry) => entry?.level));
  const requiredLevels = profile.gradeMapping?.requiredEvidenceLevels ?? ["A", "B"];
  const sourceManifestSha256 = profile.sourceManifestSha256
    ?? profile.witnesses?.["classification-manifest.jsonl"]
    ?? null;

  if (status !== "approved") blockers.push(`mapping-status-${status}`);
  if (![6, 7, 8].includes(record.primaryGrade)) blockers.push("primary-grade-not-approved");
  if (!requiredLevels.some((level) => evidenceLevels.has(level))) blockers.push("missing-A-or-B-evidence");
  if (identities.size < 2) blockers.push("two-independent-reviewer-identities-required");
  if (!roles.some((role) => /(?:math|ccss)/u.test(role))) blockers.push("math-ccss-reviewer-required");
  if (!(record.reviewers ?? []).some((reviewer) =>
    reviewer?.independent === true || /independent/u.test(roleOfReviewer(reviewer)))) {
    blockers.push("independent-reviewer-required");
  }
  if (!sourceManifestSha256 || record.sourceManifestSha256 !== sourceManifestSha256) {
    blockers.push("source-manifest-binding-missing-or-stale");
  }
  if ((record.ccssStandardCodes ?? []).length === 0) blockers.push("ccss-standard-codes-required");
  if ([6, 7, 8].includes(record.primaryGrade)) {
    const primaryIndex = Number(record.primaryGrade) - 6;
    const primaryScore = scores[primaryIndex];
    const competitors = scores.filter((_score, index) => index !== primaryIndex).sort((left, right) => right - left);
    if (primaryScore < (profile.gradeMapping?.minimumPrimaryScore ?? 5)) {
      blockers.push("primary-score-below-threshold");
    }
    if (primaryScore - (competitors[0] ?? 0) < (profile.gradeMapping?.minimumMargin ?? 2)) {
      blockers.push("primary-score-margin-not-met");
    }
  }

  return {
    stableLessonKey: record.stableLessonKey,
    moduleCode: record.moduleCode,
    lessonNumber: record.lessonNumber,
    mappingVersion: record.mappingVersion ?? null,
    sourceManifestSha256: record.sourceManifestSha256 ?? null,
    status,
    primaryGrade: record.primaryGrade,
    gradeTags: [...(record.gradeTags ?? [])],
    ccssStandardCodes: [...(record.ccssStandardCodes ?? [])],
    scoresByGrade: {...(record.scoresByGrade ?? {})},
    evidenceLevels: [...evidenceLevels].filter(Boolean).sort(),
    reviewerIdentityCount: identities.size,
    ready: status === "approved" && blockers.length === 0,
    blockers,
  };
}

export async function buildGradeMappingReadiness({
  profileIdentity,
  mappingIdentity,
  ccssId = "ccss-math-2010-v1",
  ccssSnapshot = null,
  ccssAuthorityReceipt = null,
}) {
  const profileErrors = validateSharedProfile(profileIdentity.parsed);
  const mappingErrors = validateGradeMapping(mappingIdentity.parsed, profileIdentity.parsed);
  invariant(profileErrors.length === 0, profileErrors.join("; "));
  invariant(mappingErrors.length === 0, mappingErrors.join("; "));
  invariant(ccssId === profileIdentity.parsed.gradeMapping?.mappingVersion,
    `CCSS mapping version mismatch: expected ${profileIdentity.parsed.gradeMapping?.mappingVersion}, found ${ccssId}`);

  let ccss = {
    mappingVersion: ccssId,
    snapshotPath: null,
    snapshotSha256: null,
    status: "pending-official-snapshot",
    authorityReceiptPath: null,
    authorityReceiptSha256: null,
    authorityReviewer: null,
  };
  let snapshotSha256 = null;
  if (ccssSnapshot) {
    const snapshotPath = projectPath(ccssSnapshot, "CCSS snapshot");
    const bytes = await readFile(snapshotPath);
    snapshotSha256 = sha256(bytes);
    ccss = {
      mappingVersion: ccssId,
      snapshotPath: portableProjectPath(snapshotPath),
      snapshotSha256,
      status: "hash-observed-pending-authority-review",
      authorityReceiptPath: null,
      authorityReviewer: null,
    };
  }
  if (ccssAuthorityReceipt) {
    invariant(snapshotSha256, "CCSS authority receipt requires a hash-bound snapshot");
    const receiptPath = projectPath(ccssAuthorityReceipt, "CCSS authority receipt");
    const receiptBytes = await readFile(receiptPath);
    let receipt;
    try {
      receipt = JSON.parse(receiptBytes.toString("utf8"));
    } catch (error) {
      invariant(false, `CCSS authority receipt is not valid JSON: ${error.message}`);
    }
    invariant(receipt?.schemaVersion === 1 &&
      receipt?.artifactType === "ccss-authority-receipt-v1" &&
      receipt?.status === "approved" &&
      receipt?.mappingVersion === ccssId &&
      receipt?.snapshotSha256 === snapshotSha256 &&
      typeof receipt?.reviewerId === "string" && receipt.reviewerId.trim() &&
      typeof receipt?.reviewedAt === "string" && receipt.reviewedAt,
    "CCSS authority receipt is not hash-bound to the selected snapshot");
    ccss = {
      ...ccss,
      status: "authority-approved",
      authorityReceiptPath: portableProjectPath(receiptPath),
      authorityReceiptSha256: receiptBytes.length > 0 ? sha256(receiptBytes) : null,
      authorityReviewer: receipt.reviewerId.trim(),
    };
  }

  const records = mappingIdentity.parsed.records.map((record) =>
    recordReadiness(record, profileIdentity.parsed),
  );
  const expectedKeys = new Set(MODULES.flatMap((module) =>
    module.lessonNumbers.map((lesson) =>
      `shared-${module.moduleCode.toLowerCase()}-l${String(lesson).padStart(2, "0")}`)));
  invariant(records.length === expectedKeys.size, `expected ${expectedKeys.size} mapping records`);
  invariant(records.every((record) => expectedKeys.has(record.stableLessonKey)),
    "mapping contains an unexpected or missing stable lesson key");

  const approved = records.filter((record) => record.ready).length;
  const statusCounts = Object.fromEntries(
    ["pending", "approved", "needs-adjudication", "rejected"].map((status) => [
      status,
      records.filter((record) => record.status === status).length,
    ]),
  );
  const blockers = [];
  const declaredMappingSha256 = profileIdentity.parsed.mappingManifestSha256 ?? null;
  if (declaredMappingSha256 && declaredMappingSha256 !== mappingIdentity.sha256) {
    blockers.push("mapping-manifest-hash-drift");
  }
  if (ccss.status !== "authority-approved") blockers.push(
    ccss.status === "pending-official-snapshot"
      ? "official-ccss-snapshot-not-hash-observed"
      : "official-ccss-authority-review-pending",
  );
  if (approved !== records.length) blockers.push(`${records.length - approved}-lesson-mappings-not-approved`);

  return {
    $schema: "../schemas/g678-grade-mapping-readiness-v1.schema.json",
    schemaVersion: 1,
    artifactType: "help-math-g678-grade-mapping-readiness",
    reportId: "g678-grade-mapping-readiness-v1",
    generatedAt: null,
    source: {
      profilePath: portableProjectPath(profileIdentity.filePath),
      profileSha256: profileIdentity.sha256,
      mappingPath: portableProjectPath(mappingIdentity.filePath),
      mappingSha256: mappingIdentity.sha256,
      sourceManifestSha256: profileIdentity.parsed.sourceManifestSha256 ??
        profileIdentity.parsed.witnesses?.["classification-manifest.jsonl"] ?? null,
    },
    ccss,
    summary: {
      recordCount: records.length,
      approvedAndReadyCount: approved,
      statusCounts,
      gradeRouteGenerationAllowed: approved === records.length && blockers.length === 0,
      blockers,
    },
    records,
    acceptanceEffects: {
      currentJavaScriptRegistered: false,
      authoritativeOriginalRuntime: false,
      visualFidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      released: false,
      published: false,
    },
  };
}

export function parseArguments(argv) {
  const options = {
    profile: DEFAULT_PROFILE,
    mapping: DEFAULT_MAPPING,
    ccss: "ccss-math-2010-v1",
    ccssSnapshot: null,
    ccssAuthorityReceipt: null,
    output: null,
    mode: "check",
    requireApproved: false,
  };
  let explicitMode = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check" || argument === "--write") {
      invariant(!explicitMode, "choose exactly one of --check or --write");
      explicitMode = true;
      options.mode = argument.slice(2);
      continue;
    }
    if (argument === "--require-approved") {
      options.requireApproved = true;
      continue;
    }
    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }
    const keyByFlag = {
      "--profile": "profile",
      "--mapping": "mapping",
      "--ccss": "ccss",
      "--ccss-snapshot": "ccssSnapshot",
      "--ccss-authority-receipt": "ccssAuthorityReceipt",
      "--output": "output",
    };
    const key = keyByFlag[argument];
    invariant(key, `unknown argument: ${argument}`);
    invariant(index + 1 < argv.length, `${argument} requires a value`);
    options[key] = argv[++index];
  }
  if (options.mode === "write") invariant(options.output, "--write requires --output");
  return Object.freeze(options);
}

async function publishNoReplace(filePath, bytes) {
  invariant(!(await exists(filePath)), `refusing to overwrite existing output: ${filePath}`);
  await mkdir(path.dirname(filePath), {recursive: true});
  const staging = `${filePath}.staging-${process.pid}-${Date.now()}`;
  try {
    await writeFile(staging, bytes, {encoding: "utf8", flag: "wx"});
    await rename(staging, filePath);
  } catch (error) {
    await rm(staging, {force: true}).catch(() => {});
    throw error;
  }
}

export async function run(options) {
  if (options.help) return {help: true};
  const [profileIdentity, mappingIdentity] = await Promise.all([
    readJson(options.profile, "profile"),
    readJson(options.mapping, "mapping"),
  ]);
  const report = await buildGradeMappingReadiness({
    profileIdentity,
    mappingIdentity,
    ccssId: options.ccss,
    ccssSnapshot: options.ccssSnapshot,
    ccssAuthorityReceipt: options.ccssAuthorityReceipt,
  });
  if (options.output) {
    const outputPath = projectPath(options.output, "output");
    const bytes = stableJson(report);
    if (options.mode === "write") await publishNoReplace(outputPath, bytes);
    else {
      const current = await readFile(outputPath, "utf8");
      invariant(current === bytes, `grade mapping readiness drift: ${outputPath}`);
    }
  }
  if (options.requireApproved) {
    invariant(report.summary.gradeRouteGenerationAllowed,
      `GRADE_MAPPING_NOT_APPROVED: ${report.summary.blockers.join(", ")}`);
  }
  return {
    status: report.summary.gradeRouteGenerationAllowed ? "approved" : "blocked",
    report: options.output ? options.output : report,
    summary: report.summary,
  };
}

const invokedDirectly = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;

if (invokedDirectly) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log("Usage: node scripts/map-shared-grade.mjs --check [--profile <file>] [--mapping <file>] [--ccss ccss-math-2010-v1] [--ccss-snapshot <official-file>] [--ccss-authority-receipt <receipt>] [--output <report>] [--require-approved]");
    } else {
      console.log(stableJson(await run(options)));
    }
  } catch (error) {
    console.error(stableJson({status: "error", message: error.message}));
    process.exitCode = 1;
  }
}
