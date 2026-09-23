#!/usr/bin/env node

/**
 * Apply the reviewed G5 L3 active-source copy set to the canonical main
 * checkout after rebasing it onto the current 9,244-file source profile.
 *
 * The 97 G5 L4 FQ audio files added after the predecessor plan are canonical
 * members of the current freeze. They remain in the staging clone unchanged.
 * This executor adds only the predecessor plan's exact 24 SWFs and 19 FLAs,
 * rebuilds a staged catalog and freeze, updates the staged current-source
 * profile, atomically swaps both sibling directories, and retains the prior
 * source and catalog trees as recovery evidence.
 *
 * The applied receipt establishes source custody only. It has no renderer,
 * original-runtime, fidelity, audio-acceptance, human-review, Owner-acceptance,
 * strict-completion, release, or publication effect.
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
import {cloneTreeCopyOnWrite} from "./promote-g4-active-sources.mjs";
import {verifyManifest, writeManifest} from "./freeze-help-math-sources.mjs";
import {atomicSwapSiblingDirectoriesDarwin} from
  "./lib/darwin-atomic-directory-swap.mjs";

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
  "catalog/source-promotions/g5-l3-active-source-promotion-2026-08-21.json";
const SUCCESSOR_PLAN_RELATIVE =
  "catalog/source-promotions/g5-l3-active-source-promotion-main-successor-v1.json";
const RECEIPT_RELATIVE =
  "catalog/source-promotions/g5-l3-active-source-promotion-main-applied-v1.json";
const PLAN_SHA256 =
  "cd07d4f2f1c7a8f3ac4b96a61682deb52006abbaea7a3b62073a9703f9f02d8c";
const SUCCESSOR_PLAN_SHA256 =
  "92dbcecc53851b78cd38b4f7ce554585943e6feea42c173263919636635fba35";
const BASE_MANIFEST_SHA256 =
  "aee72ac1f1c0d0d28f07d36186fb2b049ca0f64a130b61f6a1a3a8a99c5a2fad";
const BASE_CHECKSUM_SET_SHA256 =
  "10173f6dd19e934901a1188ba45d8e22423dbac3212b8f2560e90e2fd536bfcc";
const BASE_FILE_COUNT = 9_244;
const BASE_TOTAL_BYTES = 3_219_753_760;
const COPY_COUNT = 43;
const COPY_BYTES = 51_396_667;
const COPY_RECORD_SET_SHA256 =
  "c87ef94d9ac80fbc3c621a8d8037f50c53c83756e0f97aa353a06b126d5b033b";
const POST_MANIFEST_SHA256 =
  "2bc7bf524436cc21616648bac9b5d3596db862be22be43929708f9433a5897c7";
const POST_CHECKSUM_SET_SHA256 =
  "c916317555e7e5f5aa667b8b200b081d8ee91fd436957673bc0b41711984b247";
const POST_CURRENT_SOURCE_PROFILE_SHA256 =
  "12fe3e319db1f37a354c53f5bb428ccc000a26ed3749dfe1eb6356f159387de4";
const POST_FILE_COUNT = 9_287;
const POST_TOTAL_BYTES = 3_271_150_427;
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

function recordSetDigest(records) {
  return sha256Bytes(
    Buffer.from(
      [...records]
        .sort((left, right) => compareText(left.path, right.path))
        .map(({path: recordPath, bytes, sha256}) =>
          `${recordPath}\t${bytes}\t${sha256}\n`)
        .join(""),
      "utf8",
    ),
  );
}

function safeRelative(value, label) {
  invariant(typeof value === "string" && value.length > 0,
    `${label}: non-empty relative path required`);
  invariant(!path.posix.isAbsolute(value) && !value.includes("\\") && !value.includes("\0"),
    `${label}: unsafe path`);
  invariant(path.posix.normalize(value) === value && !value.startsWith("../"),
    `${label}: path escapes its root`);
  return value;
}

function contained(root, relative, label) {
  const portable = safeRelative(relative, label);
  const resolved = path.resolve(root, ...portable.split("/"));
  const relation = path.relative(path.resolve(root), resolved);
  invariant(relation && !relation.startsWith(`..${path.sep}`) && relation !== ".." &&
    !path.isAbsolute(relation), `${label}: resolved path escapes its root`);
  return resolved;
}

async function regularFileIdentity(filePath) {
  const information = await lstat(filePath);
  invariant(information.isFile() && !information.isSymbolicLink(),
    `Expected ordinary file: ${filePath}`);
  const bytes = await readFile(filePath);
  return {bytes: bytes.length, sha256: sha256Bytes(bytes)};
}

async function realDirectory(directory, label) {
  const information = await lstat(directory);
  invariant(information.isDirectory() && !information.isSymbolicLink(),
    `${label} must be a real directory: ${directory}`);
  return information;
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

async function copyPlanRecords(stagedSourceRoot, plan) {
  let copiedBytes = 0;
  for (const record of plan.copyRecords) {
    safeRelative(record.canonicalPath, "copy canonicalPath");
    safeRelative(record.quarantineRelativePath, "copy quarantineRelativePath");
    invariant(Number.isSafeInteger(record.bytes) && record.bytes >= 0 && SHA256.test(record.sha256),
      `Invalid copy record: ${record.canonicalPath}`);
    const source = contained(QUARANTINE_ROOT, record.quarantineRelativePath,
      "quarantine copy source");
    const sourceIdentity = await regularFileIdentity(source);
    invariant(sourceIdentity.bytes === record.bytes && sourceIdentity.sha256 === record.sha256,
      `Quarantine copy identity drift: ${record.canonicalPath}`);
    const destination = contained(stagedSourceRoot, record.canonicalPath,
      "staged copy destination");
    invariant(!(await exists(destination)), `Copy destination already exists: ${record.canonicalPath}`);
    const parent = path.dirname(destination);
    const parentMode = (await stat(parent)).mode & 0o7777;
    if ((parentMode & 0o200) === 0) await chmod(parent, parentMode | 0o200);
    await copyFile(source, destination,
      fsConstants.COPYFILE_EXCL | (fsConstants.COPYFILE_FICLONE ?? 0));
    await chmod(destination, 0o444);
    const destinationIdentity = await regularFileIdentity(destination);
    invariant(destinationIdentity.bytes === record.bytes &&
      destinationIdentity.sha256 === record.sha256,
    `Copied destination identity drift: ${record.canonicalPath}`);
    copiedBytes += record.bytes;
  }
  invariant(plan.copyRecords.length === COPY_COUNT, "Copy-record count drift");
  invariant(copiedBytes === COPY_BYTES, "Copied byte total drift");
  return {copiedFileCount: plan.copyRecords.length, copiedBytes};
}

function expectedProfileFromSummary(summary, lessonReleases) {
  return {
    files: summary.source.fileCount,
    totalBytes: summary.source.totalBytes,
    checksumSetSha256: summary.source.checksumSetSha256,
    sourceExtensions: summary.source.extensions,
    swf: summary.source.extensions.swf,
    fla: summary.source.extensions.fla,
    mp3: summary.source.extensions.mp3,
    xml: summary.source.extensions.xml,
    courseXml: summary.xml.courseFiles,
    swfByCollection: summary.swf.byCollection,
    uniqueSwfAssets: summary.swf.uniqueAssets,
    duplicateGroups: summary.swf.duplicateGroups,
    duplicatePlacements: summary.swf.duplicatePlacements,
    pairedSwfFla: summary.pairing.pairedSwfFla,
    swfOnly: summary.pairing.swfOnly,
    flaOnly: summary.pairing.flaOnly,
    compoundBinaryFla: summary.fla.compoundBinary,
    zipArchiveFla: summary.fla.zipArchive,
    unrecognizedFla: summary.fla.unrecognized,
    swfFrames: summary.swf.totalFrames,
    swfHeader: {
      signatures: summary.swf.signatures,
      fpsValues: summary.swf.fpsValues,
      headerParseErrors: summary.swf.headerParseErrors,
    },
    courseShells: summary.swf.courseShells,
    courseReferences: {
      unique: summary.references.course.unique,
      resolved: summary.references.course.resolved,
      missing: summary.references.course.missing,
      unreferenced: summary.references.course.unreferencedExisting,
    },
    keytermReferences: {
      unique: summary.references.keyterm.unique,
      resolved: summary.references.keyterm.resolved,
      missing: summary.references.keyterm.missing,
      unreferenced: summary.references.keyterm.unreferencedExisting,
    },
    lessonReleases,
    xmlWithBareAmpersands: summary.xml.filesWithBareAmpersands,
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
    lessonReleases?.totalMembers === 265,
  "Staged page-only lesson-release profile drift");
  profile.expected = expectedProfileFromSummary(summary, lessonReleases);
  const contents = stableJson(profile);
  invariant(sha256Bytes(Buffer.from(contents, "utf8")) ===
    POST_CURRENT_SOURCE_PROFILE_SHA256,
  "Projected post-promotion current-source profile drift");
  const originalMode = (await stat(profilePath)).mode & 0o7777;
  if ((originalMode & 0o200) === 0) await chmod(profilePath, originalMode | 0o200);
  try {
    await writeFile(profilePath, contents, {flag: "w"});
  } finally {
    await chmod(profilePath, 0o444);
  }
  return regularFileIdentity(profilePath);
}

async function loadPlan() {
  const planPath = path.join(PROJECT_ROOT, PLAN_RELATIVE);
  const planFile = await regularFileIdentity(planPath);
  invariant(planFile.sha256 === PLAN_SHA256, "Pinned G5 L3 promotion-plan SHA-256 drift");
  const planText = await readFile(planPath, "utf8");
  const plan = JSON.parse(planText);
  invariant(plan.artifactType === "help-math-g5-l3-active-source-promotion-plan" &&
    plan.scope?.grade === 5 && plan.scope?.lesson === 3,
  "Wrong G5 L3 promotion-plan scope");
  invariant(plan.transaction?.copyTransactionReady === true &&
    plan.transaction?.copyTransactionConflictCount === 0 &&
    plan.transaction?.sourceDependencyClosureComplete === true &&
    plan.missingDependencies?.length === 0,
  "G5 L3 promotion plan is not a closed, conflict-free copy transaction");
  invariant(plan.summary?.copyRecords?.count === COPY_COUNT &&
    plan.summary?.copyRecords?.totalBytes === COPY_BYTES &&
    plan.summary?.copyRecords?.recordSetSha256 === COPY_RECORD_SET_SHA256,
  "G5 L3 promotion-plan copy set drift");
  return {plan, planPath, planFile};
}

async function loadSuccessorPlan() {
  const successorPath = path.join(PROJECT_ROOT, SUCCESSOR_PLAN_RELATIVE);
  const successorFile = await regularFileIdentity(successorPath);
  invariant(successorFile.sha256 === SUCCESSOR_PLAN_SHA256,
    "Pinned G5 L3 main currentness-successor SHA-256 drift");
  const successor = JSON.parse(await readFile(successorPath, "utf8"));
  invariant(
    successor.artifactType ===
      "help-math-g5-l3-main-source-promotion-currentness-successor" &&
    successor.mode === "plan-only-no-source-mutation" &&
    successor.scope?.grade === 5 && successor.scope?.lesson === 3 &&
    successor.scope?.pageOnly === true &&
    successor.scope?.legacyFlashCourseShellExcluded === true,
    "Wrong G5 L3 main currentness-successor scope",
  );
  invariant(
    successor.reviewedCopyAuthority?.predecessorPlanSha256 === PLAN_SHA256 &&
    successor.reviewedCopyAuthority?.copyRecordCount === COPY_COUNT &&
    successor.reviewedCopyAuthority?.copyBytes === COPY_BYTES &&
    successor.reviewedCopyAuthority?.copyRecordSetSha256 === COPY_RECORD_SET_SHA256 &&
    successor.reviewedCopyAuthority?.allPreReviewHoldsResolvedInPredecessorPlan === true,
    "G5 L3 main currentness-successor copy authority drift",
  );
  invariant(
    successor.currentMainBaseline?.sourceManifestSha256 === BASE_MANIFEST_SHA256 &&
    successor.currentMainBaseline?.sourceFileCount === BASE_FILE_COUNT &&
    successor.currentMainBaseline?.sourceTotalBytes === BASE_TOTAL_BYTES &&
    successor.currentMainBaseline?.catalogChecksumSetSha256 ===
      BASE_CHECKSUM_SET_SHA256 &&
    successor.currentMainBaseline?.differenceFromPredecessorBase
      ?.disjointFromG5L3CopySet === true,
    "G5 L3 main currentness-successor baseline drift",
  );
  invariant(
    successor.expectedMainPostState?.sourceManifestSha256 === POST_MANIFEST_SHA256 &&
    successor.expectedMainPostState?.sourceFileCount === POST_FILE_COUNT &&
    successor.expectedMainPostState?.sourceTotalBytes === POST_TOTAL_BYTES &&
    successor.expectedMainPostState?.catalogChecksumSetSha256 ===
      POST_CHECKSUM_SET_SHA256 &&
    successor.expectedMainPostState?.currentSourceProfileSha256 ===
      POST_CURRENT_SOURCE_PROFILE_SHA256 &&
    successor.transaction?.copyTransactionReady === true &&
    successor.transaction?.copyTransactionConflictCount === 0 &&
    successor.transaction?.allPreReviewHoldsResolved === true &&
    successor.transaction?.mainCheckoutSourcePromotionWithinAcceptedExecutionScope === true,
    "G5 L3 main currentness-successor transaction drift",
  );
  return {successor, successorPath, successorFile};
}

function transactionPaths(transactionId) {
  const sourceParent = path.dirname(SOURCE_ROOT);
  const catalogParent = path.dirname(CATALOG_ROOT);
  return {
    sourceStage: path.join(sourceParent,
      `.HELP MATH_ORIGINAL FILES.g5-l3-stage-${transactionId}`),
    catalogStage: path.join(catalogParent, `.catalog.g5-l3-stage-${transactionId}`),
  };
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
    "Main G5 L3 applied receipt already exists");
  const [
    {plan, planFile},
    {successor, successorFile},
    sourceCatalogFile,
    sourceManifestFile,
  ] = await Promise.all([
    loadPlan(),
    loadSuccessorPlan(),
    readFile(path.join(CATALOG_ROOT, "source-files.json"), "utf8"),
    regularFileIdentity(path.join(CATALOG_ROOT, "source-manifest.sha256")),
  ]);
  invariant(sourceManifestFile.sha256 === BASE_MANIFEST_SHA256,
    "Base source-manifest SHA-256 drift");
  const sourceCatalog = JSON.parse(sourceCatalogFile);
  invariant(sourceCatalog.fileCount === BASE_FILE_COUNT &&
    sourceCatalog.totalBytes === BASE_TOTAL_BYTES &&
    sourceCatalog.checksumSetSha256 === BASE_CHECKSUM_SET_SHA256,
  "Base source catalog count/bytes drift");
  const physical = await physicalFiles(SOURCE_ROOT);
  const catalogPaths = sourceCatalog.files.map(({path: sourcePath}) => sourcePath);
  invariant(physical.length === BASE_FILE_COUNT &&
    physical.every((sourcePath, index) => sourcePath === catalogPaths[index]),
  "Main physical source path set does not exactly match the current catalog");
  const baseFreeze = await verifyManifest(SOURCE_ROOT, {
    catalogRoot: CATALOG_ROOT,
    defaultPaths: false,
  });
  invariant(baseFreeze.manifestSha256 === BASE_MANIFEST_SHA256 &&
    baseFreeze.fileCount === BASE_FILE_COUNT &&
    baseFreeze.totalBytes === BASE_TOTAL_BYTES &&
    baseFreeze.writableEntriesAfterFreeze === 0,
  "Main source freeze is not the reviewed current baseline");
  return {
    plan,
    planEvidence: planFile,
    successor,
    successorEvidence: successorFile,
    sourceCatalog,
    summary: {
      status: "preflight-passed-no-mutation",
      baseManifestSha256: sourceManifestFile.sha256,
      baseCatalogFiles: sourceCatalog.fileCount,
      baseCatalogBytes: sourceCatalog.totalBytes,
      retainedCanonicalG5L4FqMp3: 97,
      copyRecords: plan.copyRecords.length,
      copyBytes: COPY_BYTES,
      missingDependencies: plan.missingDependencies.length,
    },
  };
}

async function validateStagedCatalog(stagedSourceRoot, stagedCatalogRoot, plan) {
  const freeze = await verifyManifest(stagedSourceRoot, {
    catalogRoot: stagedCatalogRoot,
    defaultPaths: false,
  });
  invariant(freeze.manifestSha256 === POST_MANIFEST_SHA256 &&
    freeze.fileCount === POST_FILE_COUNT &&
    freeze.totalBytes === POST_TOTAL_BYTES,
  "Staged post-promotion freeze identity drift");
  const [summary, sourceCatalog, currentSourceProfile] = await Promise.all([
    readFile(path.join(stagedCatalogRoot, "summary.json"), "utf8").then(JSON.parse),
    readFile(path.join(stagedCatalogRoot, "source-files.json"), "utf8").then(JSON.parse),
    regularFileIdentity(path.join(stagedCatalogRoot, "current-source-profile.json")),
  ]);
  for (const record of [summary.source, sourceCatalog]) {
    invariant(record.fileCount === POST_FILE_COUNT &&
      record.totalBytes === POST_TOTAL_BYTES &&
      record.checksumSetSha256 === POST_CHECKSUM_SET_SHA256,
    "Staged catalog source identity drift");
  }
  invariant(currentSourceProfile.bytes === 2_084 &&
    currentSourceProfile.sha256 === POST_CURRENT_SOURCE_PROFILE_SHA256,
  "Staged current-source profile identity drift");
  const missing = JSON.parse(await readFile(
    path.join(stagedCatalogRoot, "missing-references.json"), "utf8"));
  const promoted = new Set(plan.copyRecords
    .filter(({sourceType}) => sourceType === "active-page-swf")
    .map(({canonicalPath}) => canonicalPath));
  const stillMissing = missing.course.filter(({expectedPath}) => promoted.has(expectedPath));
  invariant(stillMissing.length === 0,
    `Promoted G5 L3 SWFs remain missing from staged catalog: ${stillMissing.length}`);
  return {
    freeze,
    source: summary.source,
    currentSourceProfile,
    promotedMissingReferences: 0,
  };
}

async function apply() {
  const evidence = await preflight();
  const transactionId = `${new Date().toISOString().replaceAll(/[-:.TZ]/g, "")}-${process.pid}`;
  const paths = transactionPaths(transactionId);
  invariant(!(await exists(paths.sourceStage)) && !(await exists(paths.catalogStage)),
    "Transaction staging path already exists");
  await cloneTreeCopyOnWrite(SOURCE_ROOT, paths.sourceStage);
  const baseFreeze = await verifyManifest(paths.sourceStage, {
    catalogRoot: CATALOG_ROOT,
    defaultPaths: false,
  });
  invariant(baseFreeze.manifestSha256 === BASE_MANIFEST_SHA256 &&
    baseFreeze.fileCount === BASE_FILE_COUNT &&
    baseFreeze.totalBytes === BASE_TOTAL_BYTES,
  "Staging clone does not match the current frozen main baseline");
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
    paths.catalogStage,
    catalogBuild.summary,
  );
  const staged = await validateStagedCatalog(
    paths.sourceStage,
    paths.catalogStage,
    evidence.plan,
  );

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
    const live = await validateStagedCatalog(SOURCE_ROOT, CATALOG_ROOT, evidence.plan);
    const receipt = {
      schemaVersion: 1,
      artifactType: "help-math-g5-l3-main-source-promotion-applied-receipt",
      appliedAt: new Date().toISOString(),
      transactionId,
      scope: {grade: 5, lesson: 3, pageOnly: true},
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
      currentnessSuccessor: {
        path: SUCCESSOR_PLAN_RELATIVE,
        bytes: evidence.successorEvidence.bytes,
        sha256: evidence.successorEvidence.sha256,
      },
      retainedCanonicalBaselineDelta: {
        count: 97,
        totalBytes: 5_168_346,
        extension: "mp3",
        scope: "G5 L4 FQ exact source-profile reconciliation",
        treatment: "retained unchanged in the staged and promoted source tree",
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
      throw new AggregateError([error, ...rollbackErrors.map((message) => new Error(message))],
        "Main G5 L3 promotion failed and rollback was incomplete");
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

export {
  apply,
  parseArguments,
  preflight,
  recordSetDigest,
  expectedProfileFromSummary,
};
