#!/usr/bin/env node

/**
 * Apply the reviewed Grade 5 Lesson 6 page-only source promotion to the
 * canonical main checkout. The executor stages and validates the exact
 * 13-SWF/10-FLA copy set before atomically swapping both source and catalog
 * sibling directories. The prior trees remain retained as recovery evidence.
 *
 * The applied receipt establishes source custody only. It does not change a
 * renderer, Current-JS, original-runtime, fidelity, audio, review, strict-
 * completion, release, or publication gate.
 */

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {buildHelpMathCatalog} from "./build-help-math-catalog.mjs";
import {
  expectedProfileFromSummary,
  recordSetDigest,
} from "./apply-g5-l2-source-promotion-main.mjs";
import {writeManifest, verifyManifest} from "./freeze-help-math-sources.mjs";
import {atomicSwapSiblingDirectoriesDarwin} from
  "./lib/darwin-atomic-directory-swap.mjs";
import {cloneTreeCopyOnWrite} from "./promote-g4-active-sources.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SOURCE_ROOT = path.join(
  PROJECT_ROOT,
  "source-assets/flash/HELP MATH_ORIGINAL FILES",
);
const CATALOG_ROOT = path.join(PROJECT_ROOT, "catalog");
const QUARANTINE_ROOT =
  "/Volumes/WestWorld/HELP MATH Related Files/Google Drive Source Intake/2026-08-02-HELP-ELM-FINAL-Dec21-2015";
const PLAN_RELATIVE =
  "catalog/source-promotions/g5-l6-active-source-promotion-v1.json";
const RECEIPT_RELATIVE =
  "catalog/source-promotions/g5-l6-active-source-promotion-main-applied-v1.json";
const PLAN_SHA256 =
  "5a50bf099f8b47f3212e8731c8983be844883733c568dffb8454a34625602d1b";
const BASE_MANIFEST_SHA256 =
  "b98ce8fbf09860f19f96f57f99834fea1486d58d2cc7b578e06e99ecce775162";
const BASE_CHECKSUM_SET_SHA256 =
  "601ef15eac8787d6280dd0b40d9be2bfcd254956747c169c90ab1f990788812d";
const BASE_CURRENT_SOURCE_PROFILE_SHA256 =
  "57479b5e0fc9953af33e852864825958dda72f1115e305a7c2a778704e1e5bd3";
const BASE_FILE_COUNT = 9_290;
const BASE_TOTAL_BYTES = 3_277_781_559;
const COPY_COUNT = 23;
const COPY_BYTES = 30_702_445;
const ACTIVE_SWF_COUNT = 13;
const SAME_PATH_FLA_COUNT = 10;
const COPY_RECORD_SET_SHA256 =
  "f37a914be918168db6cf84924b7cad7e50ae0797a7f105e4b22c43eedd5a516a";
const POST_FILE_COUNT = 9_313;
const POST_TOTAL_BYTES = 3_308_484_004;
const SHA256 = /^[a-f0-9]{64}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function safeRelative(value, label) {
  invariant(typeof value === "string" && value.length > 0,
    `${label}: non-empty relative path required`);
  invariant(!path.posix.isAbsolute(value) && !value.includes("\\") &&
    !value.includes("\0"), `${label}: unsafe path`);
  invariant(path.posix.normalize(value) === value && !value.startsWith("../"),
    `${label}: path escapes its root`);
  return value;
}

function contained(root, relative, label) {
  const portable = safeRelative(relative, label);
  const resolved = path.resolve(root, ...portable.split("/"));
  const relation = path.relative(path.resolve(root), resolved);
  invariant(relation && !relation.startsWith(`..${path.sep}`) &&
    relation !== ".." && !path.isAbsolute(relation),
  `${label}: resolved path escapes its root`);
  return resolved;
}

async function exists(target) {
  try {
    await lstat(target);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function realDirectory(directory, label) {
  const information = await lstat(directory);
  invariant(information.isDirectory() && !information.isSymbolicLink(),
    `${label} must be a real directory: ${directory}`);
}

async function regularFileIdentity(filePath) {
  const information = await lstat(filePath);
  invariant(information.isFile() && !information.isSymbolicLink(),
    `Expected ordinary file: ${filePath}`);
  const bytes = await readFile(filePath);
  return {bytes: bytes.length, sha256: sha256Bytes(bytes)};
}

async function physicalFiles(root) {
  const records = [];
  async function visit(directory, relativeDirectory = "") {
    const entries = await readdir(directory, {withFileTypes: true});
    entries.sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const relative = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      const absolute = path.join(directory, entry.name);
      invariant(!entry.isSymbolicLink(), `Source tree contains symlink: ${relative}`);
      if (entry.isDirectory()) await visit(absolute, relative);
      else if (entry.isFile()) records.push(relative);
      else throw new Error(`Unsupported source entry: ${relative}`);
    }
  }
  await visit(root);
  return records;
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function loadPlan() {
  const planPath = path.join(PROJECT_ROOT, PLAN_RELATIVE);
  const planFile = await regularFileIdentity(planPath);
  invariant(planFile.sha256 === PLAN_SHA256,
    "Pinned G5 L6 promotion-plan SHA-256 drift");
  const plan = JSON.parse(await readFile(planPath, "utf8"));
  invariant(plan.artifactType === "help-math-g5-l6-active-source-promotion-plan" &&
    plan.mode === "reviewed-plan-ready-for-atomic-main-application" &&
    plan.scope?.grade === 5 && plan.scope?.lesson === 6 &&
    plan.scope?.pageOnly === true &&
    plan.scope?.legacyFlashCourseShellExcluded === true,
  "Wrong G5 L6 promotion-plan scope");
  invariant(plan.transaction?.copyTransactionReady === true &&
    plan.transaction?.copyTransactionConflictCount === 0 &&
    plan.transaction?.allPreReviewHoldsResolved === true &&
    plan.transaction?.mainCheckoutSourcePromotionWithinAcceptedExecutionScope === true,
  "G5 L6 plan is not a reviewed, conflict-free main transaction");
  invariant(Array.isArray(plan.copyRecords) &&
    plan.copyRecords.length === COPY_COUNT &&
    plan.summary?.copyRecordCount === COPY_COUNT &&
    plan.summary?.copyBytes === COPY_BYTES &&
    plan.summary?.activePageSwfCount === ACTIVE_SWF_COUNT &&
    plan.summary?.samePathFlaCount === SAME_PATH_FLA_COUNT &&
    plan.summary?.copyRecordSetSha256 === COPY_RECORD_SET_SHA256 &&
    recordSetDigest(plan.copyRecords.map(({canonicalPath: recordPath, bytes, sha256}) =>
      ({path: recordPath, bytes, sha256}))) === COPY_RECORD_SET_SHA256,
  "G5 L6 promotion copy set drift");
  invariant(plan.copyRecords.every((record) =>
    record.priorDisposition === "candidate-new-source-in-quarantine" &&
    record.reviewDecision === "promote-in-this-transaction"),
  "G5 L6 plan includes an unresolved hold or unreviewed copy record");
  invariant(plan.currentMainBaseline?.sourceManifestSha256 ===
    BASE_MANIFEST_SHA256 &&
    plan.currentMainBaseline?.sourceFileCount === BASE_FILE_COUNT &&
    plan.currentMainBaseline?.sourceTotalBytes === BASE_TOTAL_BYTES &&
    plan.currentMainBaseline?.catalogChecksumSetSha256 ===
      BASE_CHECKSUM_SET_SHA256 &&
    plan.currentMainBaseline?.currentSourceProfileSha256 ===
      BASE_CURRENT_SOURCE_PROFILE_SHA256 &&
    plan.expectedMainPostInvariants?.sourceFileCount === POST_FILE_COUNT &&
    plan.expectedMainPostInvariants?.sourceTotalBytes === POST_TOTAL_BYTES,
  "G5 L6 promotion baseline or post invariants drift");
  return {plan, planPath, planFile};
}

async function verifyQuarantineAuthority(plan) {
  const authorityFiles = [
    [plan.quarantineAuthority.intakeReceiptPath,
      plan.quarantineAuthority.intakeReceiptSha256],
    [plan.quarantineAuthority.grade5ManifestPath,
      plan.quarantineAuthority.grade5ManifestSha256],
    [plan.quarantineAuthority.grade5IntakePlanPath,
      plan.quarantineAuthority.grade5IntakePlanSha256],
  ];
  for (const [relative, expectedSha256] of authorityFiles) {
    const identity = await regularFileIdentity(contained(
      QUARANTINE_ROOT, relative, "quarantine authority file"));
    invariant(identity.sha256 === expectedSha256,
      `Quarantine authority drift: ${relative}`);
  }
}

async function copyPlanRecords(stagedSourceRoot, plan) {
  let copiedBytes = 0;
  let activePageSwfs = 0;
  let samePathFlas = 0;
  for (const record of plan.copyRecords) {
    safeRelative(record.canonicalPath, "copy canonicalPath");
    safeRelative(record.quarantineRelativePath, "copy quarantineRelativePath");
    invariant(Number.isSafeInteger(record.bytes) && record.bytes >= 0 &&
      SHA256.test(record.sha256), `Invalid copy record: ${record.canonicalPath}`);
    const source = contained(QUARANTINE_ROOT, record.quarantineRelativePath,
      "quarantine copy source");
    const sourceIdentity = await regularFileIdentity(source);
    invariant(sourceIdentity.bytes === record.bytes &&
      sourceIdentity.sha256 === record.sha256,
    `Quarantine copy identity drift: ${record.canonicalPath}`);
    const destination = contained(stagedSourceRoot, record.canonicalPath,
      "staged copy destination");
    invariant(!(await exists(destination)),
      `Copy destination already exists: ${record.canonicalPath}`);
    const parent = path.dirname(destination);
    const parentMode = (await stat(parent)).mode & 0o7777;
    if ((parentMode & 0o200) === 0) await chmod(parent, parentMode | 0o200);
    await copyFile(source, destination,
      fsConstants.COPYFILE_EXCL | (fsConstants.COPYFILE_FICLONE ?? 0));
    await chmod(destination, 0o444);
    const copied = await regularFileIdentity(destination);
    invariant(copied.bytes === record.bytes && copied.sha256 === record.sha256,
      `Copied destination identity drift: ${record.canonicalPath}`);
    copiedBytes += record.bytes;
    if (record.sourceType === "active-page-swf") activePageSwfs += 1;
    else if (record.sourceType === "same-path-fla") samePathFlas += 1;
    else throw new Error(`Unexpected copy source type: ${record.sourceType}`);
  }
  invariant(copiedBytes === COPY_BYTES && activePageSwfs === ACTIVE_SWF_COUNT &&
    samePathFlas === SAME_PATH_FLA_COUNT, "Copied G5 L6 totals drift");
  return {
    copiedFileCount: plan.copyRecords.length,
    copiedBytes,
    activePageSwfs,
    samePathFlas,
  };
}

async function updateStagedCurrentSourceProfile(stagedCatalogRoot, summary) {
  const profilePath = path.join(stagedCatalogRoot, "current-source-profile.json");
  const profile = JSON.parse(await readFile(profilePath, "utf8"));
  invariant(profile.schemaVersion === 1 &&
    profile.artifactType === "help-math-current-source-profile",
  "Staged current-source profile has the wrong contract");
  const lessonReleases = profile.expected?.lessonReleases;
  invariant(lessonReleases?.outputSha256 ===
    "26db29732898997f7db2fdf659e3e9cc1692d41cc1c16227e1a8c198cf7b6129" &&
    lessonReleases?.releaseCount === 5 &&
    lessonReleases?.totalMembers === 265 &&
    Array.isArray(lessonReleases?.releases) &&
    lessonReleases.releases.reduce((sum, release) =>
      sum + release.memberCount, 0) === 265,
  "Staged page-only lesson-release profile drift");
  profile.expected = expectedProfileFromSummary(summary, lessonReleases);
  const contents = stableJson(profile);
  const originalMode = (await stat(profilePath)).mode & 0o7777;
  if ((originalMode & 0o200) === 0) await chmod(profilePath, originalMode | 0o200);
  try {
    await writeFile(profilePath, contents, {flag: "w"});
  } finally {
    await chmod(profilePath, 0o444);
  }
  return regularFileIdentity(profilePath);
}

async function preflight() {
  await Promise.all([
    realDirectory(PROJECT_ROOT, "main project root"),
    realDirectory(SOURCE_ROOT, "main source root"),
    realDirectory(CATALOG_ROOT, "main catalog root"),
    realDirectory(QUARANTINE_ROOT, "frozen quarantine root"),
  ]);
  invariant(PROJECT_ROOT === "/Volumes/WestWorld/HELP MATH 2.0",
    "This executor refuses to run outside the canonical HELP MATH 2.0 checkout");
  invariant(!(await exists(path.join(PROJECT_ROOT, RECEIPT_RELATIVE))),
    "Main G5 L6 applied receipt already exists");
  const [{plan, planFile}, sourceCatalog, sourceManifest, currentProfile] =
    await Promise.all([
      loadPlan(),
      readFile(path.join(CATALOG_ROOT, "source-files.json"), "utf8").then(JSON.parse),
      regularFileIdentity(path.join(CATALOG_ROOT, "source-manifest.sha256")),
      regularFileIdentity(path.join(CATALOG_ROOT, "current-source-profile.json")),
    ]);
  await verifyQuarantineAuthority(plan);
  invariant(sourceManifest.sha256 === BASE_MANIFEST_SHA256,
    "Base source-manifest SHA-256 drift");
  invariant(currentProfile.sha256 === BASE_CURRENT_SOURCE_PROFILE_SHA256,
    "Base current-source profile SHA-256 drift");
  invariant(sourceCatalog.fileCount === BASE_FILE_COUNT &&
    sourceCatalog.totalBytes === BASE_TOTAL_BYTES &&
    sourceCatalog.checksumSetSha256 === BASE_CHECKSUM_SET_SHA256,
  "Base source catalog identity drift");
  const physical = await physicalFiles(SOURCE_ROOT);
  const catalogPaths = sourceCatalog.files.map(({path: sourcePath}) => sourcePath);
  invariant(physical.length === BASE_FILE_COUNT &&
    physical.every((sourcePath, index) => sourcePath === catalogPaths[index]),
  "Main physical source path set does not match the current catalog");
  const baseFreeze = await verifyManifest(SOURCE_ROOT, {
    catalogRoot: CATALOG_ROOT,
    defaultPaths: false,
  });
  invariant(baseFreeze.manifestSha256 === BASE_MANIFEST_SHA256 &&
    baseFreeze.fileCount === BASE_FILE_COUNT &&
    baseFreeze.totalBytes === BASE_TOTAL_BYTES &&
    baseFreeze.writableEntriesAfterFreeze === 0,
  "Main source freeze is not the reviewed current baseline");
  for (const record of plan.copyRecords) {
    invariant(!(await exists(contained(SOURCE_ROOT, record.canonicalPath,
      "canonical copy destination"))),
    `Canonical copy destination already exists: ${record.canonicalPath}`);
  }
  return {
    plan,
    planEvidence: planFile,
    summary: {
      status: "preflight-passed-no-mutation",
      baseManifestSha256: sourceManifest.sha256,
      baseCatalogFiles: sourceCatalog.fileCount,
      baseCatalogBytes: sourceCatalog.totalBytes,
      copyRecords: plan.copyRecords.length,
      copyBytes: COPY_BYTES,
      activePageSwfs: ACTIVE_SWF_COUNT,
      samePathFlas: SAME_PATH_FLA_COUNT,
      unresolvedReviewHolds: 0,
    },
  };
}

function transactionPaths(transactionId) {
  return {
    sourceStage: path.join(path.dirname(SOURCE_ROOT),
      `.HELP MATH_ORIGINAL FILES.g5-l6-stage-${transactionId}`),
    catalogStage: path.join(path.dirname(CATALOG_ROOT),
      `.catalog.g5-l6-stage-${transactionId}`),
  };
}

async function validateStagedCatalog(stagedSourceRoot, stagedCatalogRoot, plan) {
  const freeze = await verifyManifest(stagedSourceRoot, {
    catalogRoot: stagedCatalogRoot,
    defaultPaths: false,
  });
  invariant(freeze.fileCount === POST_FILE_COUNT &&
    freeze.totalBytes === POST_TOTAL_BYTES &&
    freeze.writableEntriesAfterFreeze === 0,
  "Staged post-promotion freeze count/bytes/mode drift");
  const [summary, sourceCatalog, currentSourceProfile, profile] = await Promise.all([
    readFile(path.join(stagedCatalogRoot, "summary.json"), "utf8").then(JSON.parse),
    readFile(path.join(stagedCatalogRoot, "source-files.json"), "utf8").then(JSON.parse),
    regularFileIdentity(path.join(stagedCatalogRoot, "current-source-profile.json")),
    readFile(path.join(stagedCatalogRoot, "current-source-profile.json"), "utf8")
      .then(JSON.parse),
  ]);
  for (const record of [summary.source, sourceCatalog]) {
    invariant(record.fileCount === POST_FILE_COUNT &&
      record.totalBytes === POST_TOTAL_BYTES &&
      record.checksumSetSha256 === sourceCatalog.checksumSetSha256,
    "Staged source catalog identity drift");
  }
  invariant(sameJson(summary.source.extensions,
    plan.expectedMainPostInvariants.extensions),
  "Staged source extension totals drift");
  invariant(sameJson({
    unique: summary.references.course.unique,
    resolved: summary.references.course.resolved,
    missing: summary.references.course.missing,
  }, plan.expectedMainPostInvariants.courseReferences),
  "Staged course-reference totals drift");
  invariant(sameJson(profile.expected,
    expectedProfileFromSummary(summary, profile.expected.lessonReleases)),
  "Staged current-source profile does not bind the staged catalog");
  const missing = JSON.parse(await readFile(
    path.join(stagedCatalogRoot, "missing-references.json"), "utf8"));
  const promoted = new Set(plan.copyRecords
    .filter(({sourceType}) => sourceType === "active-page-swf")
    .map(({canonicalPath}) => canonicalPath));
  const stillMissing = missing.course.filter(({expectedPath}) =>
    promoted.has(expectedPath));
  invariant(stillMissing.length === 0,
    `Promoted G5 L6 SWFs remain missing: ${stillMissing.length}`);
  return {
    freeze,
    source: summary.source,
    references: summary.references.course,
    currentSourceProfile,
    promotedMissingReferences: 0,
    wholeLessonActivePageSourceCoverage: "40/40",
  };
}

async function apply() {
  const evidence = await preflight();
  const transactionId =
    `${new Date().toISOString().replaceAll(/[-:.TZ]/g, "")}-${process.pid}`;
  const paths = transactionPaths(transactionId);
  invariant(!(await exists(paths.sourceStage)) &&
    !(await exists(paths.catalogStage)), "Transaction staging path already exists");
  await cloneTreeCopyOnWrite(SOURCE_ROOT, paths.sourceStage);
  const baseFreeze = await verifyManifest(paths.sourceStage, {
    catalogRoot: CATALOG_ROOT,
    defaultPaths: false,
  });
  invariant(baseFreeze.manifestSha256 === BASE_MANIFEST_SHA256 &&
    baseFreeze.fileCount === BASE_FILE_COUNT &&
    baseFreeze.totalBytes === BASE_TOTAL_BYTES,
  "Staging clone does not match the frozen main baseline");
  const copied = await copyPlanRecords(paths.sourceStage, evidence.plan);
  await cloneTreeCopyOnWrite(CATALOG_ROOT, paths.catalogStage);
  const catalogBuild = await buildHelpMathCatalog({
    source: paths.sourceStage,
    output: paths.catalogStage,
    concurrency: 8,
    verifyKnownCounts: false,
    check: false,
  });
  await writeManifest(paths.sourceStage, {
    catalogRoot: paths.catalogStage,
    defaultPaths: false,
  });
  const updatedProfile = await updateStagedCurrentSourceProfile(
    paths.catalogStage, catalogBuild.summary);
  const staged = await validateStagedCatalog(
    paths.sourceStage, paths.catalogStage, evidence.plan);

  let sourceSwapped = false;
  let catalogSwapped = false;
  try {
    const sourceSwap = await atomicSwapSiblingDirectoriesDarwin({
      allowedParent: path.dirname(SOURCE_ROOT),
      firstDirectory: SOURCE_ROOT,
      secondDirectory: paths.sourceStage,
    });
    sourceSwapped = true;
    const catalogSwap = await atomicSwapSiblingDirectoriesDarwin({
      allowedParent: path.dirname(CATALOG_ROOT),
      firstDirectory: CATALOG_ROOT,
      secondDirectory: paths.catalogStage,
    });
    catalogSwapped = true;
    const live = await validateStagedCatalog(
      SOURCE_ROOT, CATALOG_ROOT, evidence.plan);
    const receipt = {
      schemaVersion: 1,
      artifactType: "help-math-g5-l6-main-source-promotion-applied-receipt",
      appliedAt: new Date().toISOString(),
      transactionId,
      scope: {grade: 5, lesson: 6, pageOnly: true},
      canonicalBoundary: {
        projectRoot: PROJECT_ROOT,
        canonicalProjectWideSourcePromoted: true,
        mainCheckoutModified: true,
        legacyFlashCourseShellExcluded: true,
        purpose: "canonical-main-source-custody-promotion-only",
      },
      plan: {
        path: PLAN_RELATIVE,
        bytes: evidence.planEvidence.bytes,
        sha256: evidence.planEvidence.sha256,
        copyRecordSetSha256: COPY_RECORD_SET_SHA256,
      },
      predecessorAppliedReceipt: {
        path: evidence.plan.currentMainBaseline.predecessorAppliedReceiptPath,
        bytes: evidence.plan.currentMainBaseline.predecessorAppliedReceiptBytes,
        sha256: evidence.plan.currentMainBaseline.predecessorAppliedReceiptSha256,
      },
      copied,
      updatedProfile,
      staged,
      swaps: {source: sourceSwap, catalog: catalogSwap},
      retainedRecoveryRoots: {
        source: paths.sourceStage,
        catalog: paths.catalogStage,
      },
      postchecks: live,
      acceptanceEffects: {
        sourcePromotionInIsolatedWorktree: false,
        canonicalProjectWideSourcePromotion: true,
        wholeLessonActivePageSourceCoverage: "40/40",
        audioDependencyClosureEstablished: false,
        currentJavaScriptRegistered: false,
        originalRuntimeAccepted: false,
        visualFidelityAccepted: false,
        audioAccepted: false,
        humanVisualAccepted: false,
        ownerAccepted: false,
        strictComplete: false,
        released: false,
        published: false,
      },
    };
    const receiptPath = path.join(PROJECT_ROOT, RECEIPT_RELATIVE);
    await mkdir(path.dirname(receiptPath), {recursive: true});
    await writeFile(receiptPath, stableJson(receipt), {flag: "wx", mode: 0o444});
    return receipt;
  } catch (error) {
    const rollbackErrors = [];
    if (catalogSwapped) {
      try {
        await atomicSwapSiblingDirectoriesDarwin({
          allowedParent: path.dirname(CATALOG_ROOT),
          firstDirectory: CATALOG_ROOT,
          secondDirectory: paths.catalogStage,
        });
      } catch (rollbackError) {
        rollbackErrors.push(`catalog rollback: ${rollbackError.message}`);
      }
    }
    if (sourceSwapped) {
      try {
        await atomicSwapSiblingDirectoriesDarwin({
          allowedParent: path.dirname(SOURCE_ROOT),
          firstDirectory: SOURCE_ROOT,
          secondDirectory: paths.sourceStage,
        });
      } catch (rollbackError) {
        rollbackErrors.push(`source rollback: ${rollbackError.message}`);
      }
    }
    if (rollbackErrors.length) {
      throw new AggregateError([
        error,
        ...rollbackErrors.map((message) => new Error(message)),
      ], "Main G5 L6 promotion failed and rollback was incomplete");
    }
    throw error;
  }
}

function parseArguments(argv) {
  invariant(argv.length === 1 && ["--preflight", "--apply"].includes(argv[0]),
    "Choose exactly one of --preflight or --apply");
  return argv[0].slice(2);
}

async function main(argv = process.argv.slice(2)) {
  const mode = parseArguments(argv);
  const result = mode === "preflight" ? (await preflight()).summary : await apply();
  process.stdout.write(stableJson(result));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}

export {apply, parseArguments, preflight};
