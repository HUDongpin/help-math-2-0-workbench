#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import {
  constants as fsConstants,
  createReadStream,
  realpathSync,
} from "node:fs";
import {
  chmod,
  lstat,
  link,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { buildHelpMathCatalog } from "./build-help-math-catalog.mjs";
import {
  buildPromotionPlan,
  serializePlan,
} from "./build-g4-active-source-promotion-plan.mjs";
import {
  verifyManifest,
  writeManifest,
} from "./freeze-help-math-sources.mjs";
import { atomicSwapSiblingDirectoriesDarwin } from
  "./lib/darwin-atomic-directory-swap.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const DEFAULT_QUARANTINE_ROOT =
  "/Volumes/WestWorld/HELP MATH Related Files/Google Drive Source Intake/2026-08-02-HELP-ELM-FINAL-Dec21-2015";
const SOURCE_RELATIVE = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const CATALOG_RELATIVE = "catalog";
const PLAN_RELATIVE =
  "catalog/source-promotions/g4-active-source-promotion-2026-08-02.json";
const RECEIPT_RELATIVE =
  "catalog/source-promotions/g4-active-source-promotion-2026-08-02-applied.json";
const TRANSACTION_ROOT_RELATIVE =
  "work/g4-active-source-promotion-transactions";
const G4_PREFIX = "HELP_COURSES/ELMGR4/";
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;
const DIRECTORY = fsConstants.O_DIRECTORY ?? 0;
const execFile = promisify(execFileCallback);
const CLEAN_ENVIRONMENT = Object.freeze({
  LANG: "C",
  LC_ALL: "C",
  PATH: "/usr/bin:/bin",
});

const EXPECTED = Object.freeze({
  planSha256:
    "61fbb021fbab57c427e1c0459c30cf94a88b449d0080c125d616213687833a87",
  intakeReceiptSha256:
    "3633334999488f1df0c95fc7bece4669d7d9db86845f1aeab1924fd560802fd4",
  intakeReadmeSha256:
    "fd3f300739e63e84b9a263d724fdbeda55dd3a1b4eee077b472de5228cc76f5e",
  intakePlanSha256:
    "ff6b31f75d246f33834af9686b035f614a27ae2bbbc30e4b5975773863a0634f",
  quarantineManifestSha256:
    "27c0dc167ed771ffa4f560d71f03f4e373c0d08ff3a52d2868db2bdef11ede4c",
  baseManifestSha256:
    "a9625fb4a99e026fea09e4a1929edc2fa9d47ccf6cdbca7de4ba9ca75adf211e",
  baseFileCount: 7_919,
  baseTotalBytes: 2_779_928_841,
  baseCatalogChecksumSha256:
    "0d6f20e50576c73aac38aa5a88610c654bbe29430044c2db43d8d6236cf8fe0f",
  copyRecordSetSha256:
    "118691f7e2a301f6a5056f196bd17a77eb3c42d80b73a43244d41445c19a4de6",
  copyRecordCount: 1_228,
  copyBytes: 434_656_573,
  postManifestSha256:
    "f0a33c8a3d15afd7340e9ea5523385428bae7546bd8d4227a3a8977ab8914318",
  postCatalogChecksumSha256:
    "30dfa12b7cd76e7200fb89115155e7d32af1356247c07e3a4f79227e93f34875",
  postFileCount: 9_147,
  postTotalBytes: 3_214_585_414,
  missingDependencyCount: 16,
  missingDependencyPathSetSha256:
    "439fce1e41ef10591c165f0eed65638d1a7afc81080db182770911bd1d8c4286",
  zipFlaPath: "HELP_COURSES/ELMGR4/L1/IN/L1IN07.fla",
  zipFlaSha256:
    "782bd6d283c2eea38798ecda41ec0a5b93c7d5ebedcff3624a2cc48b471cf073",
  zipFlaBytes: 1_513_718,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256Text(text) {
  return createHash("sha256").update(text).digest("hex");
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return (
    relative === ""
    || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))
  );
}

function portablePath(value, label, { requireG4 = false } = {}) {
  invariant(typeof value === "string" && value.length > 0, `${label} must be a non-empty path`);
  invariant(!value.includes("\0") && !value.includes("\\"), `${label} contains a forbidden character`);
  invariant(!path.posix.isAbsolute(value), `${label} must be relative`);
  invariant(path.posix.normalize(value) === value, `${label} must already be POSIX-normalized`);
  invariant(value !== "." && value !== ".." && !value.startsWith("../"), `${label} escapes its root`);
  if (requireG4) invariant(value.startsWith(G4_PREFIX), `${label} is outside Grade 4: ${value}`);
  return value;
}

function nodeIdentity(information) {
  return { dev: String(information.dev), ino: String(information.ino) };
}

function sameNode(left, right) {
  return Boolean(left && right && left.dev === right.dev && left.ino === right.ino);
}

async function pathKind(target) {
  try {
    const information = await lstat(target);
    if (information.isSymbolicLink()) return "symlink";
    if (information.isDirectory()) return "directory";
    if (information.isFile()) return "file";
    return "other";
  } catch (error) {
    if (error.code === "ENOENT") return "missing";
    throw error;
  }
}

async function sha256Handle(handle) {
  const digest = createHash("sha256");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  let position = 0;
  while (true) {
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, position);
    if (bytesRead === 0) break;
    digest.update(buffer.subarray(0, bytesRead));
    position += bytesRead;
  }
  return digest.digest("hex");
}

async function inspectRegularFileNoFollow(filePath, { expectedBytes, expectedSha256 } = {}) {
  const atPathBefore = await lstat(filePath, { bigint: true });
  invariant(
    atPathBefore.isFile() && !atPathBefore.isSymbolicLink(),
    `Expected a real regular file: ${filePath}`,
  );
  const handle = await open(filePath, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const openedBefore = await handle.stat({ bigint: true });
    invariant(
      openedBefore.isFile() && sameNode(nodeIdentity(atPathBefore), nodeIdentity(openedBefore)),
      `File identity changed before hashing: ${filePath}`,
    );
    if (expectedBytes !== undefined) {
      invariant(Number(openedBefore.size) === expectedBytes, `Byte mismatch: ${filePath}`);
    }
    const sha256 = await sha256Handle(handle);
    const openedAfter = await handle.stat({ bigint: true });
    const atPathAfter = await lstat(filePath, { bigint: true });
    invariant(
      sameNode(nodeIdentity(openedBefore), nodeIdentity(openedAfter))
      && sameNode(nodeIdentity(openedBefore), nodeIdentity(atPathAfter))
      && openedBefore.size === openedAfter.size
      && openedBefore.mtimeNs === openedAfter.mtimeNs,
      `File identity changed while hashing: ${filePath}`,
    );
    if (expectedSha256 !== undefined) {
      invariant(sha256 === expectedSha256, `SHA-256 mismatch: ${filePath}`);
    }
    return {
      bytes: Number(openedAfter.size),
      sha256,
      node: nodeIdentity(openedAfter),
      mode: Number(openedAfter.mode & 0o7777n),
    };
  } finally {
    await handle.close();
  }
}

async function readRegularFileNoFollow(filePath, { expectedBytes, expectedSha256 } = {}) {
  const atPathBefore = await lstat(filePath, { bigint: true });
  invariant(atPathBefore.isFile() && !atPathBefore.isSymbolicLink(), `Expected a real regular file: ${filePath}`);
  const handle = await open(filePath, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const openedBefore = await handle.stat({ bigint: true });
    invariant(sameNode(nodeIdentity(atPathBefore), nodeIdentity(openedBefore)), `File identity changed before read: ${filePath}`);
    const bytes = await handle.readFile();
    const openedAfter = await handle.stat({ bigint: true });
    const atPathAfter = await lstat(filePath, { bigint: true });
    invariant(
      sameNode(nodeIdentity(openedBefore), nodeIdentity(openedAfter))
      && sameNode(nodeIdentity(openedBefore), nodeIdentity(atPathAfter))
      && openedBefore.size === openedAfter.size
      && openedBefore.mtimeNs === openedAfter.mtimeNs,
      `File identity changed while reading: ${filePath}`,
    );
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (expectedBytes !== undefined) invariant(bytes.length === expectedBytes, `Byte mismatch: ${filePath}`);
    if (expectedSha256 !== undefined) invariant(sha256 === expectedSha256, `SHA-256 mismatch: ${filePath}`);
    return { bytes, sha256, node: nodeIdentity(openedAfter) };
  } finally {
    await handle.close();
  }
}

async function resolveContainedPath(root, relative, {
  label = "path",
  leaf = "file",
  allowMissingLeaf = false,
} = {}) {
  const safeRelative = portablePath(relative, label);
  const rootInformation = await lstat(root);
  invariant(rootInformation.isDirectory() && !rootInformation.isSymbolicLink(), `${label} root is not a real directory`);
  const rootReal = await realpath(root);
  let current = rootReal;
  const segments = safeRelative.split("/");
  for (let index = 0; index < segments.length; index += 1) {
    current = path.join(current, segments[index]);
    const last = index === segments.length - 1;
    let information;
    try {
      information = await lstat(current);
    } catch (error) {
      if (error.code === "ENOENT" && last && allowMissingLeaf) {
        return { absolutePath: current, rootReal, missing: true };
      }
      throw error;
    }
    invariant(!information.isSymbolicLink(), `${label} traverses a symbolic link: ${current}`);
    if (!last) invariant(information.isDirectory(), `${label} parent is not a directory: ${current}`);
    else if (leaf === "file") invariant(information.isFile(), `${label} is not a regular file: ${current}`);
    else if (leaf === "directory") invariant(information.isDirectory(), `${label} is not a directory: ${current}`);
  }
  const resolved = await realpath(current);
  invariant(isWithin(rootReal, resolved), `${label} resolves outside its root`);
  return { absolutePath: current, realPath: resolved, rootReal, missing: false };
}

function recordSetDigest(records) {
  return sha256Text(
    [...records]
      .sort((left, right) => compareText(left.canonicalPath, right.canonicalPath))
      .map(({ canonicalPath, bytes, sha256 }) => `${canonicalPath}\t${bytes}\t${sha256}\n`)
      .join(""),
  );
}

function validatePlan(plan, { planSha256 } = {}) {
  invariant(plan && typeof plan === "object" && !Array.isArray(plan), "Promotion plan must be an object");
  invariant(plan.schemaVersion === 1, "Unsupported promotion-plan schema");
  invariant(plan.artifactType === "help-math-g4-active-source-promotion-plan", "Wrong promotion-plan type");
  invariant(plan.mode === "plan-only-no-source-mutation", "Promotion plan has a mutating mode");
  if (planSha256 !== undefined) invariant(planSha256 === EXPECTED.planSha256, "Dated promotion-plan SHA-256 drift");
  invariant(plan.inputs?.intakeReceipt?.sha256 === EXPECTED.intakeReceiptSha256, "Intake-receipt input drift");
  invariant(plan.inputs?.intakePlan?.sha256 === EXPECTED.intakePlanSha256, "Grade 4 intake-plan input drift");
  invariant(
    plan.inputs?.quarantineManifest?.sha256 === EXPECTED.quarantineManifestSha256,
    "Grade 4 quarantine-manifest input drift",
  );
  invariant(plan.inputs?.sourceManifest?.sha256 === EXPECTED.baseManifestSha256, "Base source-manifest input drift");

  const copyRecords = plan.copyRecords;
  invariant(Array.isArray(copyRecords), "Promotion plan lacks copyRecords");
  invariant(copyRecords.length === EXPECTED.copyRecordCount, "Copy-record count drift");
  invariant(
    copyRecords.reduce((sum, record) => sum + record.bytes, 0) === EXPECTED.copyBytes,
    "Copy-record byte total drift",
  );
  invariant(recordSetDigest(copyRecords) === EXPECTED.copyRecordSetSha256, "Copy-record set digest drift");
  const seen = new Set();
  for (const record of copyRecords) {
    portablePath(record.canonicalPath, "copy canonicalPath", { requireG4: true });
    const expectedQuarantine = `verified/ELMGR4/${record.canonicalPath.slice(G4_PREFIX.length)}`;
    invariant(record.quarantineRelativePath === expectedQuarantine, `Quarantine placement drift: ${record.canonicalPath}`);
    portablePath(record.quarantineRelativePath, "copy quarantineRelativePath");
    invariant(!seen.has(record.canonicalPath), `Duplicate copy path: ${record.canonicalPath}`);
    seen.add(record.canonicalPath);
    invariant(Number.isSafeInteger(record.bytes) && record.bytes >= 0, `Invalid copy byte count: ${record.canonicalPath}`);
    invariant(/^[a-f0-9]{64}$/.test(record.sha256), `Invalid copy digest: ${record.canonicalPath}`);
    invariant(record.reviewDecision === "promote-in-this-transaction", `Unreviewed copy record: ${record.canonicalPath}`);
  }

  const transaction = plan.transaction;
  invariant(transaction?.copyTransactionReady === true, "Plan is not copy-transaction ready");
  invariant(transaction.copyTransactionConflictCount === 0, "Plan has copy conflicts");
  invariant(transaction.allPreReviewHoldsResolvedInThisPlan === true, "Plan has unresolved review holds");
  invariant(transaction.sourceDependencyClosureComplete === false, "Expected explicit incomplete dependency closure");
  invariant(
    transaction.missingInputsOutsideCopyTransaction === EXPECTED.missingDependencyCount,
    "Missing-dependency count drift",
  );
  const post = transaction.expectedPostManifest;
  for (const [field, expected] of Object.entries({
    baseManifestSha256: EXPECTED.baseManifestSha256,
    baseFileCount: EXPECTED.baseFileCount,
    baseTotalBytes: EXPECTED.baseTotalBytes,
    addedFileCount: EXPECTED.copyRecordCount,
    addedTotalBytes: EXPECTED.copyBytes,
    postFileCount: EXPECTED.postFileCount,
    postTotalBytes: EXPECTED.postTotalBytes,
    manifestSha256: EXPECTED.postManifestSha256,
    checksumSetSha256: EXPECTED.postCatalogChecksumSha256,
  })) {
    invariant(post?.[field] === expected, `Projected manifest ${field} drift`);
  }

  invariant(Array.isArray(plan.missingDependencies), "Plan lacks missingDependencies");
  invariant(plan.missingDependencies.length === EXPECTED.missingDependencyCount, "Missing-dependency list drift");
  const missing = new Set();
  for (const record of plan.missingDependencies) {
    portablePath(record.canonicalPath, "missing dependency", { requireG4: true });
    invariant(!seen.has(record.canonicalPath), `Missing dependency overlaps a copy: ${record.canonicalPath}`);
    invariant(!missing.has(record.canonicalPath), `Duplicate missing dependency: ${record.canonicalPath}`);
    missing.add(record.canonicalPath);
  }
  const missingDigest = sha256Text(
    [...missing].sort(compareText).map((canonicalPath) => `${canonicalPath}\n`).join(""),
  );
  invariant(missingDigest === EXPECTED.missingDependencyPathSetSha256, "Missing-dependency path-set digest drift");

  const zipFla = copyRecords.find(({ canonicalPath }) => canonicalPath === EXPECTED.zipFlaPath);
  invariant(zipFla?.sha256 === EXPECTED.zipFlaSha256, "ZIP-container FLA SHA-256 drift");
  invariant(zipFla?.bytes === EXPECTED.zipFlaBytes, "ZIP-container FLA byte-count drift");
  invariant(zipFla?.sourceType === "same-path-fla", "ZIP-container anomaly is not a same-path FLA");
  return plan;
}

function usage() {
  return `Usage:
  node scripts/promote-g4-active-sources.mjs --apply
  node scripts/promote-g4-active-sources.mjs --preflight
  node scripts/promote-g4-active-sources.mjs --recover

Options:
  --project-root <path>      Override checkout root (tests only).
  --quarantine-root <path>   Override frozen intake root (tests only).
  --transaction-root <path>  Override external transaction root (tests only).

--apply stages, verifies, swaps, post-verifies, and writes an applied receipt.
--preflight performs no source/catalog mutation.
--recover rolls back an interrupted, journaled swap. Live apply is never
implicit.`;
}

function parseArguments(argv, { cwd = process.cwd() } = {}) {
  const options = { mode: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") return { help: true };
    if (["--apply", "--preflight", "--recover"].includes(argument)) {
      invariant(!options.mode, "Choose exactly one mode");
      options.mode = argument.slice(2);
      continue;
    }
    invariant(
      ["--project-root", "--quarantine-root", "--transaction-root"].includes(argument),
      `Unknown argument: ${argument}`,
    );
    const value = argv[index + 1];
    invariant(value && !value.startsWith("--"), `${argument} requires a path`);
    const key = argument.slice(2).replaceAll(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    invariant(options[key] === undefined, `${argument} may be specified only once`);
    options[key] = path.resolve(cwd, value);
    index += 1;
  }
  invariant(options.mode, "Choose exactly one of --apply, --preflight, or --recover");
  return options;
}

function createConfiguration(options = {}) {
  function canonicalExisting(candidate) {
    const absolute = path.resolve(candidate);
    try {
      return realpathSync.native(absolute);
    } catch (error) {
      if (error.code === "ENOENT") return absolute;
      throw error;
    }
  }
  const projectRoot = canonicalExisting(options.projectRoot ?? defaultProjectRoot);
  const quarantineRoot = canonicalExisting(options.quarantineRoot ?? DEFAULT_QUARANTINE_ROOT);
  const transactionRoot = canonicalExisting(
    options.transactionRoot ?? path.join(projectRoot, TRANSACTION_ROOT_RELATIVE),
  );
  return {
    projectRoot,
    quarantineRoot,
    transactionRoot,
    activeRoot: path.join(transactionRoot, "active"),
    sourceRoot: path.join(projectRoot, SOURCE_RELATIVE),
    catalogRoot: path.join(projectRoot, CATALOG_RELATIVE),
    planPath: path.join(projectRoot, PLAN_RELATIVE),
    receiptPath: path.join(projectRoot, RECEIPT_RELATIVE),
    defaultProject: projectRoot === defaultProjectRoot,
  };
}

async function inventoryDirectory(root) {
  const rootInformation = await lstat(root);
  invariant(rootInformation.isDirectory() && !rootInformation.isSymbolicLink(), `Inventory root is not a real directory: ${root}`);
  const records = [];
  async function visit(directory, relativeDirectory = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      const information = await lstat(absolutePath);
      invariant(!information.isSymbolicLink(), `Inventory contains a symbolic link: ${absolutePath}`);
      if (information.isDirectory()) {
        await visit(absolutePath, relativePath);
      } else if (information.isFile()) {
        const evidence = await inspectRegularFileNoFollow(absolutePath);
        records.push({ path: relativePath, bytes: evidence.bytes, sha256: evidence.sha256 });
      } else {
        throw new Error(`Inventory contains an unsupported entry: ${absolutePath}`);
      }
    }
  }
  await visit(root);
  records.sort((left, right) => compareText(left.path, right.path));
  const serialized = records
    .map(({ path: relativePath, bytes, sha256 }) => `${relativePath}\t${bytes}\t${sha256}\n`)
    .join("");
  return {
    fileCount: records.length,
    totalBytes: records.reduce((sum, record) => sum + record.bytes, 0),
    treeSha256: sha256Text(serialized),
    records,
  };
}

async function readJsonFileNoFollow(filePath) {
  const evidence = await readRegularFileNoFollow(filePath);
  const text = evidence.bytes.toString("utf8");
  return { text, value: JSON.parse(text), sha256: evidence.sha256 };
}

async function verifyPlanProjectInputs(configuration, plan, suffix = "") {
  const keys = [
    "sourceCatalog",
    "animationsCatalog",
    "lessonsCatalog",
    "missingReferences",
    "hostAudioEvidence",
    "sourceManifest",
    "hostActionScript",
    "hostSwf",
  ];
  const evidence = {};
  for (const key of keys) {
    const input = plan.inputs?.[key];
    invariant(input && typeof input.path === "string", `Promotion plan lacks ${key} input evidence`);
    portablePath(input.path, `${key} input path`);
    const resolved = await resolveContainedPath(configuration.projectRoot, input.path, {
      label: `${key} input${suffix}`,
    });
    evidence[key] = await inspectRegularFileNoFollow(resolved.absolutePath, {
      expectedBytes: input.bytes,
      expectedSha256: input.sha256,
    });
  }
  return evidence;
}

async function strictPlanEvidence(configuration) {
  const planResolved = await resolveContainedPath(
    configuration.projectRoot,
    path.relative(configuration.projectRoot, configuration.planPath).split(path.sep).join("/"),
    { label: "dated promotion plan" },
  );
  const planFile = await readJsonFileNoFollow(planResolved.absolutePath);
  validatePlan(planFile.value, { planSha256: planFile.sha256 });
  await verifyPlanProjectInputs(configuration, planFile.value, " before plan rebuild");
  const rebuilt = await buildPromotionPlan({
    projectRoot: configuration.projectRoot,
    quarantineRoot: configuration.quarantineRoot,
    enforceKnownCounts: true,
  });
  invariant(
    serializePlan(rebuilt) === planFile.text,
    "Dated promotion plan is stale relative to current hash-bound inputs",
  );
  await verifyPlanProjectInputs(configuration, planFile.value, " after plan rebuild");
  return { plan: planFile.value, sha256: planFile.sha256, bytes: Buffer.byteLength(planFile.text) };
}

async function strictPreflight(configuration, { allowActiveTransaction = false } = {}) {
  for (const [label, directory] of [
    ["project root", configuration.projectRoot],
    ["quarantine root", configuration.quarantineRoot],
    ["canonical source root", configuration.sourceRoot],
    ["catalog root", configuration.catalogRoot],
  ]) {
    const kind = await pathKind(directory);
    invariant(kind === "directory", `${label} must be a real directory, not ${kind}: ${directory}`);
  }
  if (!allowActiveTransaction) {
    invariant(await pathKind(configuration.activeRoot) === "missing", `Active promotion transaction requires recovery: ${configuration.activeRoot}`);
  }
  invariant(await pathKind(configuration.receiptPath) === "missing", `Final applied receipt already exists: ${configuration.receiptPath}`);

  const quarantineEvidenceSpecs = [
    ["README.md", EXPECTED.intakeReadmeSha256, "frozen intake README"],
    ["manifests/intake-receipt.json", EXPECTED.intakeReceiptSha256, "frozen intake receipt"],
    ["manifests/elmgr4-intake-plan.json", EXPECTED.intakePlanSha256, "Grade 4 intake plan"],
    ["manifests/elmgr4-files.json", EXPECTED.quarantineManifestSha256, "Grade 4 quarantine manifest"],
  ];
  const quarantineEvidence = Object.fromEntries(await Promise.all(
    quarantineEvidenceSpecs.map(async ([relative, sha256, label]) => {
      const resolved = await resolveContainedPath(configuration.quarantineRoot, relative, { label });
      const evidence = await inspectRegularFileNoFollow(resolved.absolutePath, { expectedSha256: sha256 });
      return [relative, evidence];
    }),
  ));
  const planEvidence = await strictPlanEvidence(configuration);
  const baseFreeze = await verifyManifest(configuration.sourceRoot, {
    catalogRoot: configuration.catalogRoot,
    defaultPaths: configuration.defaultProject,
  });
  invariant(baseFreeze.manifestSha256 === EXPECTED.baseManifestSha256, "Live base freeze manifest drift");
  invariant(baseFreeze.fileCount === EXPECTED.baseFileCount, "Live base freeze file-count drift");
  invariant(baseFreeze.totalBytes === EXPECTED.baseTotalBytes, "Live base freeze byte-count drift");

  const sourceManifestResolved = await resolveContainedPath(
    configuration.catalogRoot,
    "source-manifest.sha256",
    { label: "base source manifest" },
  );
  const sourceManifestEvidence = await inspectRegularFileNoFollow(sourceManifestResolved.absolutePath, {
    expectedSha256: EXPECTED.baseManifestSha256,
  });
  const summaryResolved = await resolveContainedPath(
    configuration.catalogRoot,
    "summary.json",
    { label: "base catalog summary" },
  );
  const sourceCatalogResolved = await resolveContainedPath(
    configuration.catalogRoot,
    "source-files.json",
    { label: "base source catalog" },
  );
  const [baseSummaryFile, baseSourceCatalogFile] = await Promise.all([
    readJsonFileNoFollow(summaryResolved.absolutePath),
    readJsonFileNoFollow(sourceCatalogResolved.absolutePath),
  ]);
  invariant(
    baseSourceCatalogFile.sha256 === planEvidence.plan.inputs.sourceCatalog.sha256,
    "Base source catalog no longer matches the promotion-plan input",
  );
  const baseSummary = baseSummaryFile.value;
  const baseSourceCatalog = baseSourceCatalogFile.value;
  invariant(baseSummary.source.fileCount === EXPECTED.baseFileCount, "Base catalog file-count drift");
  invariant(baseSummary.source.totalBytes === EXPECTED.baseTotalBytes, "Base catalog byte-count drift");
  invariant(
    baseSummary.source.checksumSetSha256 === EXPECTED.baseCatalogChecksumSha256,
    "Base catalog checksum-set drift",
  );
  invariant(baseSourceCatalog.fileCount === EXPECTED.baseFileCount, "Base source-files count drift");
  invariant(baseSourceCatalog.totalBytes === EXPECTED.baseTotalBytes, "Base source-files byte total drift");
  invariant(
    baseSourceCatalog.checksumSetSha256 === EXPECTED.baseCatalogChecksumSha256,
    "Base source-files checksum-set drift",
  );

  for (const [relative, expectedSha256, label] of quarantineEvidenceSpecs) {
    const resolved = await resolveContainedPath(configuration.quarantineRoot, relative, { label: `${label} post-plan check` });
    await inspectRegularFileNoFollow(resolved.absolutePath, { expectedSha256 });
  }

  const zipRecord = planEvidence.plan.copyRecords.find(
    ({ canonicalPath }) => canonicalPath === EXPECTED.zipFlaPath,
  );
  const zipSource = await resolveContainedPath(
    configuration.quarantineRoot,
    zipRecord.quarantineRelativePath,
    { label: "ZIP-container FLA quarantine source" },
  );
  await inspectRegularFileNoFollow(zipSource.absolutePath, {
    expectedBytes: EXPECTED.zipFlaBytes,
    expectedSha256: EXPECTED.zipFlaSha256,
  });
  const zipHandle = await open(zipSource.absolutePath, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const header = Buffer.alloc(4);
    const { bytesRead } = await zipHandle.read(header, 0, header.length, 0);
    invariant(bytesRead === 4 && header.subarray(0, 2).toString("ascii") === "PK", "Known ZIP-container FLA no longer has a ZIP signature");
  } finally {
    await zipHandle.close();
  }

  const catalogInventory = await inventoryDirectory(configuration.catalogRoot);
  return {
    plan: planEvidence.plan,
    planEvidence: { sha256: planEvidence.sha256, bytes: planEvidence.bytes },
    baseFreeze,
    catalogInventory,
    sourceManifestEvidence,
    intakeEvidence: {
      receiptSha256: quarantineEvidence["manifests/intake-receipt.json"].sha256,
      readmeSha256: quarantineEvidence["README.md"].sha256,
      intakePlanSha256: quarantineEvidence["manifests/elmgr4-intake-plan.json"].sha256,
      quarantineManifestSha256: quarantineEvidence["manifests/elmgr4-files.json"].sha256,
    },
    summary: {
      status: "preflight-passed-no-mutation",
      planSha256: planEvidence.sha256,
      baseFreeze,
      copyRecordCount: planEvidence.plan.copyRecords.length,
      copyBytes: planEvidence.plan.copyRecords.reduce((sum, record) => sum + record.bytes, 0),
      missingDependencyCount: planEvidence.plan.missingDependencies.length,
      catalogTreeSha256: catalogInventory.treeSha256,
      zipFlaAnomaly: {
        path: EXPECTED.zipFlaPath,
        bytes: EXPECTED.zipFlaBytes,
        sha256: EXPECTED.zipFlaSha256,
        containerSignature: "PK-ZIP",
      },
    },
  };
}

async function fsyncDirectory(directory) {
  const handle = await open(
    directory,
    fsConstants.O_RDONLY | DIRECTORY | NOFOLLOW,
  );
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function syncTreeDurably(root) {
  const rootInformation = await lstat(root, { bigint: true });
  invariant(
    rootInformation.isDirectory() && !rootInformation.isSymbolicLink(),
    `Durability-sync root is not a real directory: ${root}`,
  );
  const totals = { fileCount: 0, directoryCount: 0, totalBytes: 0 };

  async function visit(directory) {
    const directoryBefore = await lstat(directory, { bigint: true });
    invariant(
      directoryBefore.isDirectory() && !directoryBefore.isSymbolicLink(),
      `Durability-sync encountered an unsafe directory: ${directory}`,
    );
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const candidate = path.join(directory, entry.name);
      const atPathBefore = await lstat(candidate, { bigint: true });
      invariant(
        !atPathBefore.isSymbolicLink(),
        `Durability-sync refuses a symbolic link: ${candidate}`,
      );
      if (atPathBefore.isDirectory()) {
        await visit(candidate);
        continue;
      }
      invariant(
        atPathBefore.isFile(),
        `Durability-sync encountered an unsupported entry: ${candidate}`,
      );
      const handle = await open(candidate, fsConstants.O_RDONLY | NOFOLLOW);
      try {
        const openedBefore = await handle.stat({ bigint: true });
        invariant(
          sameNode(nodeIdentity(atPathBefore), nodeIdentity(openedBefore)),
          `Durability-sync file identity changed before fsync: ${candidate}`,
        );
        await handle.sync();
        const openedAfter = await handle.stat({ bigint: true });
        const atPathAfter = await lstat(candidate, { bigint: true });
        invariant(
          openedAfter.isFile()
          && atPathAfter.isFile()
          && !atPathAfter.isSymbolicLink()
          && sameNode(nodeIdentity(openedBefore), nodeIdentity(openedAfter))
          && sameNode(nodeIdentity(openedBefore), nodeIdentity(atPathAfter))
          && openedBefore.size === openedAfter.size,
          `Durability-sync file identity changed during fsync: ${candidate}`,
        );
        totals.fileCount += 1;
        totals.totalBytes += Number(openedAfter.size);
      } finally {
        await handle.close();
      }
    }
    await fsyncDirectory(directory);
    const directoryAfter = await lstat(directory, { bigint: true });
    invariant(
      directoryAfter.isDirectory()
      && !directoryAfter.isSymbolicLink()
      && sameNode(nodeIdentity(directoryBefore), nodeIdentity(directoryAfter)),
      `Durability-sync directory identity changed during fsync: ${directory}`,
    );
    totals.directoryCount += 1;
  }

  await visit(root);
  await fsyncDirectory(path.dirname(root));
  return totals;
}

async function writeSyncedExclusive(filePath, contents, { mode = 0o600 } = {}) {
  const handle = await open(
    filePath,
    fsConstants.O_WRONLY
      | fsConstants.O_CREAT
      | fsConstants.O_EXCL
      | NOFOLLOW,
    mode,
  );
  try {
    await handle.writeFile(contents);
    await handle.chmod(mode);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fsyncDirectory(path.dirname(filePath));
}

async function writeAtomicText(filePath, contents, { mode = 0o600 } = {}) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const existingKind = await pathKind(filePath);
  invariant(existingKind === "missing" || existingKind === "file", `Refusing to replace ${existingKind}: ${filePath}`);
  const temporary = `${filePath}.tmp-${process.pid}-${randomUUID()}`;
  try {
    await writeSyncedExclusive(temporary, contents, { mode });
    await rename(temporary, filePath);
    await fsyncDirectory(path.dirname(filePath));
  } catch (error) {
    await rm(temporary, { force: true }).catch(() => {});
    throw error;
  }
}

async function writeAtomicJson(filePath, value) {
  await writeAtomicText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function cloneStructure(root, { requireSingleLinkFiles = false } = {}) {
  const rootInformation = await lstat(root, { bigint: true });
  invariant(
    rootInformation.isDirectory() && !rootInformation.isSymbolicLink(),
    `Clone structure root is unsafe: ${root}`,
  );
  const records = [{ path: ".", type: "directory", mode: Number(rootInformation.mode & 0o7777n) }];
  async function visit(directory, relativeDirectory = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      const information = await lstat(absolutePath, { bigint: true });
      invariant(
        !information.isSymbolicLink(),
        `Copy-on-write clone refuses a symbolic link: ${absolutePath}`,
      );
      if (information.isDirectory()) {
        records.push({
          path: relativePath,
          type: "directory",
          mode: Number(information.mode & 0o7777n),
        });
        await visit(absolutePath, relativePath);
        continue;
      }
      invariant(
        information.isFile(),
        `Copy-on-write clone encountered an unsupported entry: ${absolutePath}`,
      );
      if (requireSingleLinkFiles) {
        invariant(
          information.nlink === 1n,
          `Copy-on-write clone destination is not a single-link file: ${absolutePath}`,
        );
      }
      records.push({
        path: relativePath,
        type: "file",
        mode: Number(information.mode & 0o7777n),
        bytes: Number(information.size),
      });
    }
  }
  await visit(root);
  const serialized = records
    .map((record) => `${record.type}\t${record.path}\t${record.mode}\t${record.bytes ?? ""}\n`)
    .join("");
  return {
    recordCount: records.length,
    fileCount: records.filter(({ type }) => type === "file").length,
    directoryCount: records.filter(({ type }) => type === "directory").length,
    totalBytes: records.reduce((sum, record) => sum + (record.bytes ?? 0), 0),
    structureSha256: sha256Text(serialized),
  };
}

async function cloneTreeCopyOnWrite(sourceRoot, destinationRoot) {
  invariant(await pathKind(sourceRoot) === "directory", `Clone source is not a real directory: ${sourceRoot}`);
  invariant(await pathKind(destinationRoot) === "missing", `Clone destination already exists: ${destinationRoot}`);
  const sourceParent = path.dirname(sourceRoot);
  const destinationParent = path.dirname(destinationRoot);
  const [sourceInformationBefore, destinationParentInformation] = await Promise.all([
    lstat(sourceRoot, { bigint: true }),
    lstat(destinationParent, { bigint: true }),
  ]);
  invariant(
    sourceInformationBefore.isDirectory()
    && !sourceInformationBefore.isSymbolicLink()
    && destinationParentInformation.isDirectory()
    && !destinationParentInformation.isSymbolicLink(),
    "Copy-on-write clone endpoints must be real directories",
  );
  invariant(
    sourceInformationBefore.dev === destinationParentInformation.dev,
    "Copy-on-write clone source and destination must be on one device",
  );
  invariant(
    sourceParent === destinationParent,
    "Copy-on-write clone source and destination must be direct siblings",
  );
  const sourceStructureBefore = await cloneStructure(sourceRoot);
  try {
    await execFile(
      "/bin/cp",
      ["-c", "-R", "-p", "-P", sourceRoot, destinationRoot],
      {
        encoding: "utf8",
        env: CLEAN_ENVIRONMENT,
        maxBuffer: 1024 * 1024,
        timeout: 10 * 60 * 1000,
      },
    );
  } catch (error) {
    const stderr = typeof error.stderr === "string" ? error.stderr.trim() : "";
    throw new Error(
      `Native APFS clone failed${stderr ? `: ${stderr}` : `: ${error.message}`}`,
      { cause: error },
    );
  }
  const [sourceStructureAfter, destinationStructure] = await Promise.all([
    cloneStructure(sourceRoot),
    cloneStructure(destinationRoot, { requireSingleLinkFiles: true }),
  ]);
  invariant(
    sourceStructureAfter.structureSha256 === sourceStructureBefore.structureSha256,
    "Clone source structure changed during native APFS clone",
  );
  invariant(
    destinationStructure.structureSha256 === sourceStructureBefore.structureSha256,
    "Native APFS clone structure differs from its source",
  );
  const sourceInformationAfter = await lstat(sourceRoot, { bigint: true });
  invariant(
    sameNode(nodeIdentity(sourceInformationBefore), nodeIdentity(sourceInformationAfter)),
    "Clone source root identity changed during native APFS clone",
  );
  await fsyncDirectory(destinationParent);
  return {
    backend: "/bin/cp -c -R -p -P",
    sourceStructure: sourceStructureBefore,
    destinationStructure,
    destinationParentFsynced: true,
  };
}

async function ensureContainedDestinationParent(root, canonicalPath) {
  portablePath(canonicalPath, "copy canonicalPath", { requireG4: true });
  const segments = canonicalPath.split("/");
  const filename = segments.pop();
  let current = root;
  for (const segment of segments) {
    current = path.join(current, segment);
    const kind = await pathKind(current);
    if (kind === "missing") {
      const parentInformation = await lstat(path.dirname(current));
      const inheritedNonWrite = (parentInformation.mode & 0o555) | 0o100;
      await mkdir(current, { mode: inheritedNonWrite | 0o200 });
      await chmod(current, inheritedNonWrite | 0o200);
      await fsyncDirectory(path.dirname(current));
    } else {
      invariant(kind === "directory", `Destination parent is not a real directory: ${current}`);
      const information = await lstat(current);
      invariant((information.mode & 0o100) !== 0, `Destination parent lacks owner traverse permission: ${current}`);
      if ((information.mode & 0o200) === 0) await chmod(current, (information.mode & 0o7777) | 0o200);
    }
  }
  const destination = path.join(current, filename);
  invariant(isWithin(path.resolve(root), destination), `Destination escapes staged source: ${canonicalPath}`);
  invariant(await pathKind(destination) === "missing", `Destination already exists: ${canonicalPath}`);
  return destination;
}

async function copyRecordExclusiveSynced({ sourcePath, destinationPath, record }) {
  const sourceAtPath = await lstat(sourcePath, { bigint: true });
  invariant(sourceAtPath.isFile() && !sourceAtPath.isSymbolicLink(), `Copy source is not a regular file: ${sourcePath}`);
  invariant(Number(sourceAtPath.size) === record.bytes, `Copy-source byte mismatch: ${record.canonicalPath}`);
  const sourceHandle = await open(sourcePath, fsConstants.O_RDONLY | NOFOLLOW);
  let destinationHandle;
  try {
    const sourceBefore = await sourceHandle.stat({ bigint: true });
    invariant(sameNode(nodeIdentity(sourceAtPath), nodeIdentity(sourceBefore)), `Copy-source identity changed: ${record.canonicalPath}`);
    destinationHandle = await open(
      destinationPath,
      fsConstants.O_WRONLY
        | fsConstants.O_CREAT
        | fsConstants.O_EXCL
        | NOFOLLOW,
      0o600,
    );
    const digest = createHash("sha256");
    const buffer = Buffer.allocUnsafe(1024 * 1024);
    let readPosition = 0;
    let writePosition = 0;
    while (true) {
      const { bytesRead } = await sourceHandle.read(buffer, 0, buffer.length, readPosition);
      if (bytesRead === 0) break;
      digest.update(buffer.subarray(0, bytesRead));
      readPosition += bytesRead;
      let offset = 0;
      while (offset < bytesRead) {
        const { bytesWritten } = await destinationHandle.write(
          buffer,
          offset,
          bytesRead - offset,
          writePosition,
        );
        invariant(bytesWritten > 0, `Zero-byte destination write: ${record.canonicalPath}`);
        offset += bytesWritten;
        writePosition += bytesWritten;
      }
    }
    const observedSha256 = digest.digest("hex");
    invariant(readPosition === record.bytes, `Copied byte total drift: ${record.canonicalPath}`);
    invariant(observedSha256 === record.sha256, `Copied source SHA-256 drift: ${record.canonicalPath}`);
    await destinationHandle.chmod(Number(sourceBefore.mode & 0o7777n));
    await destinationHandle.sync();
    const destinationInformation = await destinationHandle.stat({ bigint: true });
    invariant(
      destinationInformation.isFile()
      && destinationInformation.nlink === 1n
      && Number(destinationInformation.size) === record.bytes,
      `Copied destination identity mismatch: ${record.canonicalPath}`,
    );
    const sourceAfter = await sourceHandle.stat({ bigint: true });
    const sourceAfterPath = await lstat(sourcePath, { bigint: true });
    invariant(
      sameNode(nodeIdentity(sourceBefore), nodeIdentity(sourceAfter))
      && sameNode(nodeIdentity(sourceBefore), nodeIdentity(sourceAfterPath))
      && sourceBefore.size === sourceAfter.size
      && sourceBefore.mtimeNs === sourceAfter.mtimeNs,
      `Copy source changed during transfer: ${record.canonicalPath}`,
    );
  } finally {
    if (destinationHandle) await destinationHandle.close();
    await sourceHandle.close();
  }
  await fsyncDirectory(path.dirname(destinationPath));
  await inspectRegularFileNoFollow(destinationPath, {
    expectedBytes: record.bytes,
    expectedSha256: record.sha256,
  });
}

async function copyPromotionRecords({ plan, quarantineRoot, stagedSourceRoot }) {
  let copiedBytes = 0;
  for (const record of plan.copyRecords) {
    const source = await resolveContainedPath(
      quarantineRoot,
      record.quarantineRelativePath,
      { label: `quarantine source for ${record.canonicalPath}` },
    );
    await inspectRegularFileNoFollow(source.absolutePath, {
      expectedBytes: record.bytes,
      expectedSha256: record.sha256,
    });
    const destinationPath = await ensureContainedDestinationParent(
      stagedSourceRoot,
      record.canonicalPath,
    );
    await copyRecordExclusiveSynced({
      sourcePath: source.absolutePath,
      destinationPath,
      record,
    });
    copiedBytes += record.bytes;
  }
  invariant(copiedBytes === EXPECTED.copyBytes, "Copied byte total does not match the promotion plan");
  return { copiedFileCount: plan.copyRecords.length, copiedBytes };
}

async function snapshotDirectoryNode(directory, label) {
  const information = await lstat(directory, { bigint: true });
  invariant(information.isDirectory() && !information.isSymbolicLink(), `${label} is not a real directory`);
  return { path: directory, node: nodeIdentity(information) };
}

async function snapshotParentModes(parents) {
  const unique = [...new Set(parents.map((value) => path.resolve(value)))];
  const snapshots = [];
  for (const parent of unique) {
    const information = await lstat(parent, { bigint: true });
    invariant(information.isDirectory() && !information.isSymbolicLink(), `Transaction parent is unsafe: ${parent}`);
    const mode = Number(information.mode & 0o7777n);
    snapshots.push({ path: parent, node: nodeIdentity(information), mode });
  }
  return snapshots;
}

function validateParentModeSnapshots(configuration, snapshots, journal = undefined) {
  invariant(Array.isArray(snapshots), "Transaction parent-mode snapshots must be an array");
  if (snapshots.length === 0) {
    const hasSwapIdentity = Boolean(journal?.directoryNodesBeforeSwap);
    const hasSwapReceipt = Object.keys(journal?.swapReceipts ?? {}).length > 0;
    invariant(
      !hasSwapIdentity && !hasSwapReceipt,
      "Transaction journal lost parent-mode snapshots after reaching a swap boundary",
    );
    return [];
  }
  const expectedPaths = [...new Set([
    path.resolve(path.dirname(configuration.sourceRoot)),
    path.resolve(path.dirname(configuration.catalogRoot)),
  ])].sort(compareText);
  invariant(
    snapshots.length === expectedPaths.length,
    "Transaction journal has an unexpected parent-mode snapshot count",
  );
  const byPath = new Map();
  for (const snapshot of snapshots) {
    invariant(snapshot && typeof snapshot === "object", "Invalid transaction parent-mode snapshot");
    invariant(
      typeof snapshot.path === "string" && path.isAbsolute(snapshot.path),
      "Transaction parent-mode snapshot path must be absolute",
    );
    invariant(!byPath.has(snapshot.path), "Duplicate transaction parent-mode snapshot path");
    invariant(
      Number.isInteger(snapshot.mode)
      && snapshot.mode >= 0
      && snapshot.mode <= 0o7777
      && (snapshot.mode & 0o100) !== 0,
      `Invalid transaction parent mode for ${snapshot.path}`,
    );
    invariant(
      snapshot.node
      && /^\d+$/.test(snapshot.node.dev)
      && /^\d+$/.test(snapshot.node.ino),
      `Invalid transaction parent identity for ${snapshot.path}`,
    );
    byPath.set(snapshot.path, snapshot);
  }
  invariant(
    expectedPaths.every((expected) => byPath.has(expected)),
    "Transaction journal parent-mode paths are outside the reviewed transaction scope",
  );
  return expectedPaths.map((expected) => byPath.get(expected));
}

async function enableParentMutation(snapshots) {
  for (const snapshot of snapshots) {
    const information = await lstat(snapshot.path, { bigint: true });
    invariant(
      information.isDirectory()
      && !information.isSymbolicLink()
      && sameNode(snapshot.node, nodeIdentity(information)),
      `Refusing to enable mutation on a replaced parent: ${snapshot.path}`,
    );
    invariant((snapshot.mode & 0o100) !== 0, `Transaction parent lacks owner traverse permission: ${snapshot.path}`);
    if ((snapshot.mode & 0o200) === 0) await chmod(snapshot.path, snapshot.mode | 0o200);
  }
}

async function restoreParentModes(snapshots) {
  const errors = [];
  for (const snapshot of [...snapshots].reverse()) {
    try {
      const information = await lstat(snapshot.path, { bigint: true });
      invariant(
        information.isDirectory()
        && !information.isSymbolicLink()
        && sameNode(snapshot.node, nodeIdentity(information)),
        `Refusing to restore mode on a replaced parent: ${snapshot.path}`,
      );
      await chmod(snapshot.path, snapshot.mode);
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length) throw new AggregateError(errors, "Failed to restore exact transaction-parent modes");
}

async function ensureTransactionRoot(configuration) {
  const target = path.resolve(configuration.transactionRoot);
  invariant(target !== path.parse(target).root, "Transaction root cannot be a filesystem root");
  invariant(!isWithin(configuration.sourceRoot, target), "Transaction root cannot be inside the source tree");
  invariant(!isWithin(configuration.catalogRoot, target), "Transaction root cannot be inside the catalog tree");

  const missing = [];
  let cursor = target;
  while (await pathKind(cursor) === "missing") {
    missing.push(cursor);
    const parent = path.dirname(cursor);
    invariant(parent !== cursor, "Cannot find an existing transaction-root ancestor");
    cursor = parent;
  }
  const ancestorInformation = await lstat(cursor);
  invariant(ancestorInformation.isDirectory() && !ancestorInformation.isSymbolicLink(), `Transaction-root ancestor is unsafe: ${cursor}`);
  const ancestorReal = await realpath(cursor);
  invariant(ancestorReal === cursor, `Transaction-root ancestor must not traverse a symlink: ${cursor}`);
  for (const directory of missing.reverse()) {
    invariant(path.dirname(directory) === cursor, "Transaction-root ancestry changed unexpectedly");
    await mkdir(directory, { mode: 0o700 });
    await fsyncDirectory(cursor);
    const information = await lstat(directory);
    invariant(information.isDirectory() && !information.isSymbolicLink(), `Created transaction directory is unsafe: ${directory}`);
    cursor = directory;
  }
  invariant(await realpath(target) === target, "Transaction root resolves through a symlink");
  return target;
}

function transactionIdentifier(now = new Date(), random = randomUUID()) {
  const timestamp = now.toISOString().replaceAll(/[-:.]/g, "").replace("Z", "Z");
  const suffix = random.replaceAll("-", "").slice(0, 12).toLowerCase();
  return `${timestamp}-${suffix}`;
}

function transactionPaths(configuration, transactionId) {
  invariant(/^[0-9]{8}T[0-9]{6}[0-9]{3}Z-[a-f0-9]{12}$/.test(transactionId), "Invalid transaction identifier");
  const sourceParent = path.dirname(configuration.sourceRoot);
  const catalogParent = path.dirname(configuration.catalogRoot);
  return {
    sourceParent,
    catalogParent,
    sourceRecovery: path.join(
      sourceParent,
      `.HELP MATH_ORIGINAL FILES.g4-active-source-recovery-${transactionId}`,
    ),
    catalogRecovery: path.join(
      catalogParent,
      `.catalog.g4-active-source-recovery-${transactionId}`,
    ),
    sourceFailed: path.join(
      sourceParent,
      `.HELP MATH_ORIGINAL FILES.g4-active-source-failed-${transactionId}`,
    ),
    catalogFailed: path.join(
      catalogParent,
      `.catalog.g4-active-source-failed-${transactionId}`,
    ),
  };
}

async function beginTransaction(configuration, preflightEvidence, {
  now = new Date(),
  uuid = randomUUID(),
} = {}) {
  await ensureTransactionRoot(configuration);
  invariant(await pathKind(configuration.activeRoot) === "missing", `Active transaction already exists: ${configuration.activeRoot}`);
  await mkdir(configuration.activeRoot, { mode: 0o700 });
  await fsyncDirectory(configuration.transactionRoot);
  const transactionId = transactionIdentifier(now, uuid);
  const paths = transactionPaths(configuration, transactionId);
  for (const candidate of [
    paths.sourceRecovery,
    paths.catalogRecovery,
    paths.sourceFailed,
    paths.catalogFailed,
  ]) {
    invariant(await pathKind(candidate) === "missing", `Transaction sibling already exists: ${candidate}`);
  }
  const journalPath = path.join(configuration.activeRoot, "journal.json");
  const journal = {
    schemaVersion: 1,
    artifactType: "help-math-g4-active-source-promotion-transaction",
    transactionId,
    phase: "locked",
    startedAt: now.toISOString(),
    planSha256: preflightEvidence.planEvidence.sha256,
    paths: {
      projectRoot: configuration.projectRoot,
      quarantineRoot: configuration.quarantineRoot,
      sourceLive: configuration.sourceRoot,
      catalogLive: configuration.catalogRoot,
      ...paths,
    },
    base: {
      freeze: preflightEvidence.baseFreeze,
      catalogTreeSha256: preflightEvidence.catalogInventory.treeSha256,
    },
    parentModes: [],
    directoryNodesBeforeSwap: null,
    swapReceipts: {},
    rollback: null,
  };
  try {
    await writeAtomicJson(journalPath, journal);
  } catch (error) {
    await rm(configuration.activeRoot, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
  return { journal, journalPath, paths };
}

async function persistJournal(transaction, patch) {
  transaction.journal = { ...transaction.journal, ...patch };
  await writeAtomicJson(transaction.journalPath, transaction.journal);
  return transaction.journal;
}

function preparedReceipt({
  transaction,
  plan,
  stagedFreeze,
  stagedCatalog,
  stagedDurability,
  preflightEvidence,
}) {
  return {
    schemaVersion: 1,
    artifactType: "help-math-g4-active-source-promotion-applied-receipt",
    lifecycle: "prepared",
    applied: false,
    transactionId: transaction.journal.transactionId,
    claim: "partial-source-promotion-only",
    plan: {
      path: PLAN_RELATIVE,
      sha256: EXPECTED.planSha256,
      copyRecordSetSha256: EXPECTED.copyRecordSetSha256,
    },
    inputs: {
      intakeReadmeSha256: preflightEvidence.intakeEvidence.readmeSha256,
      intakeReceiptSha256: preflightEvidence.intakeEvidence.receiptSha256,
      grade4IntakePlanSha256: preflightEvidence.intakeEvidence.intakePlanSha256,
      grade4QuarantineManifestSha256:
        preflightEvidence.intakeEvidence.quarantineManifestSha256,
      baseSourceManifestSha256: preflightEvidence.baseFreeze.manifestSha256,
      baseSourceCatalogSha256: plan.inputs.sourceCatalog.sha256,
      baseAnimationsCatalogSha256: plan.inputs.animationsCatalog.sha256,
      baseLessonsCatalogSha256: plan.inputs.lessonsCatalog.sha256,
      baseMissingReferencesSha256: plan.inputs.missingReferences.sha256,
    },
    exactPromotion: {
      copyRecordCount: EXPECTED.copyRecordCount,
      copyBytes: EXPECTED.copyBytes,
      bySourceType: plan.summary.copyRecords.bySourceType,
      priorDispositionCounts: plan.summary.copyByPriorDisposition,
      copiedGenericCandidateCount:
        plan.summary.copyByPriorDisposition["candidate-new-source-in-quarantine"],
      excludedGenericCandidateCount: 1_022,
      existingBindingCount: plan.summary.existingBindings.count,
      existingBindingsBySourceType: plan.summary.existingBindings.bySourceType,
      expectedPostManifestSha256: EXPECTED.postManifestSha256,
      expectedPostCatalogChecksumSha256: EXPECTED.postCatalogChecksumSha256,
    },
    stagedVerification: {
      freeze: stagedFreeze,
      catalog: stagedCatalog,
      durability: stagedDurability,
    },
    unresolvedDependencies: {
      closureComplete: false,
      count: EXPECTED.missingDependencyCount,
      pathSetSha256: EXPECTED.missingDependencyPathSetSha256,
      records: plan.missingDependencies,
      effect: "explicit source gaps and audio-fidelity blockers; not copied, invented, or silently omitted",
    },
    anomalies: {
      zipContainerFla: {
        path: EXPECTED.zipFlaPath,
        bytes: EXPECTED.zipFlaBytes,
        sha256: EXPECTED.zipFlaSha256,
        observedContainerSignature: "PK-ZIP",
        unzipTest: {
          exitStatus: 2,
          compressedEntries: "OK",
          missingBytesWarning: "unzip reports 54 bytes missing from the zipfile",
          centralDirectoryWarning:
            "unzip reports the central-directory length as 54 bytes too long and compensates",
        },
        treatment: "preserved byte-for-byte as an FLA source record; not rewritten or normalized",
      },
    },
    evidenceBoundary: plan.evidenceBoundary,
    swaps: { source: "pending", catalog: "pending" },
    postchecks: null,
    retainedRecoveryRoots: null,
  };
}

function finalReceipt(prepared, { sourceSwap, catalogSwap, postchecks, paths, completedAt }) {
  return {
    ...prepared,
    lifecycle: "final",
    applied: true,
    completedAt,
    swaps: {
      source: sourceSwap,
      catalog: catalogSwap,
    },
    postchecks,
    retainedRecoveryRoots: {
      source: paths.sourceRecovery,
      catalog: paths.catalogRecovery,
      deletionPolicy: "retained; this executor never deletes pre-promotion roots",
    },
  };
}

async function validatePostCatalog({ sourceRoot, catalogRoot, check = true }) {
  const result = await buildHelpMathCatalog({
    source: sourceRoot,
    output: catalogRoot,
    concurrency: 8,
    verifyKnownCounts: true,
    check,
  });
  invariant(result.summary.source.fileCount === EXPECTED.postFileCount, "Post catalog file-count drift");
  invariant(result.summary.source.totalBytes === EXPECTED.postTotalBytes, "Post catalog byte-count drift");
  invariant(
    result.summary.source.checksumSetSha256 === EXPECTED.postCatalogChecksumSha256,
    "Post catalog checksum-set drift",
  );
  const sourceCatalogResolved = await resolveContainedPath(
    catalogRoot,
    "source-files.json",
    { label: "post source catalog" },
  );
  const sourceCatalogFile = await readJsonFileNoFollow(sourceCatalogResolved.absolutePath);
  invariant(sourceCatalogFile.value.fileCount === EXPECTED.postFileCount, "Post source-files count drift");
  invariant(sourceCatalogFile.value.totalBytes === EXPECTED.postTotalBytes, "Post source-files byte total drift");
  invariant(
    sourceCatalogFile.value.checksumSetSha256 === EXPECTED.postCatalogChecksumSha256,
    "Post source-files checksum-set drift",
  );
  const checksumResolved = await resolveContainedPath(
    catalogRoot,
    "source-files.sha256",
    { label: "post catalog checksum set" },
  );
  const checksumEvidence = await inspectRegularFileNoFollow(checksumResolved.absolutePath, {
    expectedSha256: EXPECTED.postCatalogChecksumSha256,
  });
  return {
    fileCount: result.summary.source.fileCount,
    totalBytes: result.summary.source.totalBytes,
    checksumSetSha256: result.summary.source.checksumSetSha256,
    checksumFileSha256: checksumEvidence.sha256,
    swfPlacements: result.summary.swf.placements,
    resolvedCourseReferences: result.summary.references.course.resolved,
    missingCourseReferences: result.summary.references.course.missing,
  };
}

async function validatePostFreeze({ sourceRoot, catalogRoot, defaultPaths = false }) {
  const result = await verifyManifest(sourceRoot, { catalogRoot, defaultPaths });
  invariant(result.fileCount === EXPECTED.postFileCount, "Post freeze file-count drift");
  invariant(result.totalBytes === EXPECTED.postTotalBytes, "Post freeze byte-count drift");
  invariant(result.manifestSha256 === EXPECTED.postManifestSha256, "Post freeze manifest drift");
  invariant(result.readOnlyEnforced === true, "Post freeze is not marked read-only");
  invariant(result.writableEntriesAfterFreeze === 0, "Post freeze contains writable entries");
  return result;
}

async function stagePromotion({ configuration, preflightEvidence, transaction }) {
  await persistJournal(transaction, { phase: "cloning-source" });
  const sourceClone = await cloneTreeCopyOnWrite(
    configuration.sourceRoot,
    transaction.paths.sourceRecovery,
  );
  await persistJournal(transaction, { phase: "copying-reviewed-closure", sourceClone });
  const copyResult = await copyPromotionRecords({
    plan: preflightEvidence.plan,
    quarantineRoot: configuration.quarantineRoot,
    stagedSourceRoot: transaction.paths.sourceRecovery,
  });
  await persistJournal(transaction, { phase: "cloning-catalog" });
  const catalogClone = await cloneTreeCopyOnWrite(
    configuration.catalogRoot,
    transaction.paths.catalogRecovery,
  );
  const clonedCatalogInventory = await inventoryDirectory(transaction.paths.catalogRecovery);
  invariant(
    clonedCatalogInventory.treeSha256 === preflightEvidence.catalogInventory.treeSha256,
    "Native APFS catalog clone differs byte-for-byte from the preflight catalog inventory",
  );
  catalogClone.exactTreeSha256 = clonedCatalogInventory.treeSha256;
  catalogClone.exactFileCount = clonedCatalogInventory.fileCount;
  catalogClone.exactTotalBytes = clonedCatalogInventory.totalBytes;

  await persistJournal(transaction, { phase: "building-staged-catalog", catalogClone });
  await buildHelpMathCatalog({
    source: transaction.paths.sourceRecovery,
    output: transaction.paths.catalogRecovery,
    concurrency: 8,
    verifyKnownCounts: true,
    check: false,
  });
  await persistJournal(transaction, { phase: "freezing-staged-source" });
  const writtenFreeze = await writeManifest(transaction.paths.sourceRecovery, {
    catalogRoot: transaction.paths.catalogRecovery,
    defaultPaths: false,
  });
  invariant(writtenFreeze.fileCount === EXPECTED.postFileCount, "Written staged freeze count drift");
  invariant(writtenFreeze.totalBytes === EXPECTED.postTotalBytes, "Written staged freeze byte drift");
  invariant(writtenFreeze.manifestSha256 === EXPECTED.postManifestSha256, "Written staged freeze SHA drift");

  await persistJournal(transaction, { phase: "verifying-staged-tree" });
  const [stagedFreeze, stagedCatalog] = await Promise.all([
    validatePostFreeze({
      sourceRoot: transaction.paths.sourceRecovery,
      catalogRoot: transaction.paths.catalogRecovery,
    }),
    validatePostCatalog({
      sourceRoot: transaction.paths.sourceRecovery,
      catalogRoot: transaction.paths.catalogRecovery,
      check: true,
    }),
  ]);
  await persistJournal(transaction, { phase: "durability-syncing-staged-trees" });
  const [sourceDurability, catalogDurability] = await Promise.all([
    syncTreeDurably(transaction.paths.sourceRecovery),
    syncTreeDurably(transaction.paths.catalogRecovery),
  ]);
  invariant(
    sourceDurability.fileCount === EXPECTED.postFileCount
    && sourceDurability.totalBytes === EXPECTED.postTotalBytes,
    "Staged source durability inventory drift",
  );
  const stagedDurability = {
    cloneEvidence: {
      source: sourceClone,
      catalog: catalogClone,
    },
    source: sourceDurability,
    catalog: catalogDurability,
    noFollow: true,
    allRegularFilesAndDirectoriesFsynced: true,
  };
  const prepared = preparedReceipt({
    transaction,
    plan: preflightEvidence.plan,
    stagedFreeze,
    stagedCatalog,
    stagedDurability,
    preflightEvidence,
  });
  const preparedReceiptName =
    `g4-active-source-promotion-2026-08-02-prepared-${transaction.journal.transactionId}.json`;
  const preparedReceiptRelative = `source-promotions/${preparedReceiptName}`;
  const stagedReceiptPath = path.join(
    transaction.paths.catalogRecovery,
    preparedReceiptRelative,
  );
  await writeSyncedExclusive(
    stagedReceiptPath,
    `${JSON.stringify(prepared, null, 2)}\n`,
    { mode: 0o444 },
  );
  await fsyncDirectory(transaction.paths.sourceRecovery);
  await fsyncDirectory(transaction.paths.catalogRecovery);
  await persistJournal(transaction, {
    phase: "staged-and-verified",
    staged: {
      copyResult,
      freeze: stagedFreeze,
      catalog: stagedCatalog,
      durability: stagedDurability,
      preparedReceiptSha256: sha256Text(`${JSON.stringify(prepared, null, 2)}\n`),
      preparedReceiptRelative,
    },
  });
  return {
    copyResult,
    stagedFreeze,
    stagedCatalog,
    prepared,
    preparedReceiptRelative,
    stagedReceiptPath,
  };
}

async function postcheckLive(configuration, plan) {
  const [freeze, catalog] = await Promise.all([
    validatePostFreeze({
      sourceRoot: configuration.sourceRoot,
      catalogRoot: configuration.catalogRoot,
      defaultPaths: configuration.defaultProject,
    }),
    validatePostCatalog({
      sourceRoot: configuration.sourceRoot,
      catalogRoot: configuration.catalogRoot,
      check: true,
    }),
  ]);
  const missingResolved = await resolveContainedPath(
    configuration.catalogRoot,
    "missing-references.json",
    { label: "post missing-reference catalog" },
  );
  const missing = (await readJsonFileNoFollow(missingResolved.absolutePath)).value;
  const stillMissing = new Set((missing.course ?? []).map(({ expectedPath }) => expectedPath));
  const promotedActiveSwfs = plan.copyRecords
    .filter(({ sourceType }) => sourceType === "active-page-swf")
    .map(({ canonicalPath }) => canonicalPath);
  invariant(
    promotedActiveSwfs.every((canonicalPath) => !stillMissing.has(canonicalPath)),
    "A promoted active-page SWF remains in the missing-reference catalog",
  );
  return {
    freeze,
    catalog,
    promotedActiveSwfResolvedCount: promotedActiveSwfs.length,
    unresolvedDependencyCount: plan.missingDependencies.length,
    dependencyClosureComplete: false,
  };
}

async function observeSwapPair({ livePath, recoveryPath, before, label }) {
  let liveInformation;
  let recoveryInformation;
  try {
    [liveInformation, recoveryInformation] = await Promise.all([
      lstat(livePath, { bigint: true }),
      lstat(recoveryPath, { bigint: true }),
    ]);
  } catch (error) {
    return { state: "indeterminate", label, error: error.message };
  }
  if (
    !liveInformation.isDirectory()
    || liveInformation.isSymbolicLink()
    || !recoveryInformation.isDirectory()
    || recoveryInformation.isSymbolicLink()
  ) {
    return { state: "indeterminate", label, error: "a swap endpoint is not a real directory" };
  }
  const liveNode = nodeIdentity(liveInformation);
  const recoveryNode = nodeIdentity(recoveryInformation);
  if (sameNode(liveNode, before.live) && sameNode(recoveryNode, before.staged)) {
    return { state: "unchanged", label, liveNode, recoveryNode };
  }
  if (sameNode(liveNode, before.staged) && sameNode(recoveryNode, before.live)) {
    return { state: "swapped", label, liveNode, recoveryNode };
  }
  return { state: "indeterminate", label, liveNode, recoveryNode };
}

async function restoreSwapPair({
  allowedParent,
  livePath,
  recoveryPath,
  before,
  label,
}) {
  const observedBefore = await observeSwapPair({ livePath, recoveryPath, before, label });
  if (observedBefore.state === "unchanged") {
    return { label, action: "already-base", observedBefore };
  }
  invariant(
    observedBefore.state === "swapped",
    `${label} swap state is indeterminate; refusing a blind rollback`,
  );
  const swapReceipt = await atomicSwapSiblingDirectoriesDarwin({
    allowedParent,
    firstDirectory: livePath,
    secondDirectory: recoveryPath,
  });
  const observedAfter = await observeSwapPair({ livePath, recoveryPath, before, label });
  invariant(observedAfter.state === "unchanged", `${label} rollback did not restore base identities`);
  return { label, action: "swapped-back-to-base", observedBefore, observedAfter, swapReceipt };
}

async function verifyBaseState({
  configuration,
  sourceRoot = configuration.sourceRoot,
  catalogRoot = configuration.catalogRoot,
  defaultPaths = false,
  expectedCatalogTreeSha256,
}) {
  const freeze = await verifyManifest(sourceRoot, { catalogRoot, defaultPaths });
  invariant(freeze.fileCount === EXPECTED.baseFileCount, "Recovered base file-count drift");
  invariant(freeze.totalBytes === EXPECTED.baseTotalBytes, "Recovered base byte-count drift");
  invariant(freeze.manifestSha256 === EXPECTED.baseManifestSha256, "Recovered base manifest drift");
  invariant(freeze.readOnlyEnforced === true, "Recovered base tree is not read-only");
  invariant(freeze.writableEntriesAfterFreeze === 0, "Recovered base tree has writable entries");

  const summaryResolved = await resolveContainedPath(catalogRoot, "summary.json", {
    label: "recovered base summary",
  });
  const sourceCatalogResolved = await resolveContainedPath(catalogRoot, "source-files.json", {
    label: "recovered base source catalog",
  });
  const [summaryFile, sourceCatalogFile, catalogInventory] = await Promise.all([
    readJsonFileNoFollow(summaryResolved.absolutePath),
    readJsonFileNoFollow(sourceCatalogResolved.absolutePath),
    inventoryDirectory(catalogRoot),
  ]);
  for (const [label, value] of [
    ["summary", summaryFile.value.source],
    ["source catalog", sourceCatalogFile.value],
  ]) {
    invariant(value.fileCount === EXPECTED.baseFileCount, `Recovered ${label} count drift`);
    invariant(value.totalBytes === EXPECTED.baseTotalBytes, `Recovered ${label} byte drift`);
    invariant(
      value.checksumSetSha256 === EXPECTED.baseCatalogChecksumSha256,
      `Recovered ${label} checksum-set drift`,
    );
  }
  if (expectedCatalogTreeSha256 !== undefined) {
    invariant(
      catalogInventory.treeSha256 === expectedCatalogTreeSha256,
      "Recovered catalog tree differs from its exact pre-transaction inventory",
    );
  }
  return {
    freeze,
    catalog: {
      fileCount: sourceCatalogFile.value.fileCount,
      totalBytes: sourceCatalogFile.value.totalBytes,
      checksumSetSha256: sourceCatalogFile.value.checksumSetSha256,
      treeSha256: catalogInventory.treeSha256,
    },
  };
}

async function rollbackTransactionToBase(configuration, transaction) {
  const before = transaction.journal.directoryNodesBeforeSwap;
  const actions = [];
  const errors = [];
  if (before) {
    for (const descriptor of [
      {
        key: "catalog",
        allowedParent: transaction.paths.catalogParent,
        livePath: configuration.catalogRoot,
        recoveryPath: transaction.paths.catalogRecovery,
      },
      {
        key: "source",
        allowedParent: transaction.paths.sourceParent,
        livePath: configuration.sourceRoot,
        recoveryPath: transaction.paths.sourceRecovery,
      },
    ]) {
      try {
        actions.push(await restoreSwapPair({
          ...descriptor,
          before: before[descriptor.key],
          label: descriptor.key,
        }));
      } catch (error) {
        errors.push(error);
        actions.push({ label: descriptor.key, action: "manual-intervention-required", error: error.message });
      }
    }
  }
  if (errors.length > 0) {
    const aggregate = new AggregateError(errors, "Atomic promotion rollback requires manual intervention");
    aggregate.rollbackActions = actions;
    throw aggregate;
  }
  const verification = await verifyBaseState({
    configuration,
    defaultPaths: configuration.defaultProject,
    expectedCatalogTreeSha256: transaction.journal.base.catalogTreeSha256,
  });
  return { status: "base-restored-and-verified", actions, verification };
}

async function installFinalReceiptExclusive(configuration, receipt) {
  const receiptRelativeToCatalog = path
    .relative(configuration.catalogRoot, configuration.receiptPath)
    .split(path.sep)
    .join("/");
  invariant(
    receiptRelativeToCatalog
      === "source-promotions/g4-active-source-promotion-2026-08-02-applied.json",
    "Applied receipt path is outside its reviewed catalog directory",
  );
  const parentResolved = await resolveContainedPath(
    configuration.catalogRoot,
    "source-promotions",
    { label: "applied-receipt directory", leaf: "directory" },
  );
  const finalPath = path.join(parentResolved.absolutePath, path.posix.basename(receiptRelativeToCatalog));
  invariant(await pathKind(finalPath) === "missing", "Applied receipt already exists");
  const contents = `${JSON.stringify(receipt, null, 2)}\n`;
  const temporary = path.join(
    parentResolved.absolutePath,
    `.g4-active-source-applied-${process.pid}-${randomUUID()}.tmp`,
  );
  try {
    await writeSyncedExclusive(temporary, contents, { mode: 0o444 });
    await link(temporary, finalPath);
    await fsyncDirectory(parentResolved.absolutePath);
    await unlink(temporary);
    await fsyncDirectory(parentResolved.absolutePath);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
  const evidence = await inspectRegularFileNoFollow(finalPath, {
    expectedBytes: Buffer.byteLength(contents),
    expectedSha256: sha256Text(contents),
  });
  invariant((evidence.mode & 0o222) === 0, "Final applied receipt is writable");
  return {
    path: RECEIPT_RELATIVE,
    bytes: evidence.bytes,
    sha256: evidence.sha256,
    mode: (evidence.mode & 0o7777).toString(8).padStart(4, "0"),
  };
}

async function readAndValidateFinalReceipt(configuration) {
  const resolved = await resolveContainedPath(
    configuration.catalogRoot,
    path.relative(configuration.catalogRoot, configuration.receiptPath).split(path.sep).join("/"),
    { label: "final applied receipt" },
  );
  const file = await readJsonFileNoFollow(resolved.absolutePath);
  invariant(file.value.artifactType === "help-math-g4-active-source-promotion-applied-receipt", "Wrong applied-receipt type");
  invariant(file.value.lifecycle === "final" && file.value.applied === true, "Applied receipt is not final");
  invariant(file.value.claim === "partial-source-promotion-only", "Applied receipt overclaims its scope");
  invariant(file.value.plan?.sha256 === EXPECTED.planSha256, "Applied receipt plan binding drift");
  invariant(
    file.value.plan?.copyRecordSetSha256 === EXPECTED.copyRecordSetSha256,
    "Applied receipt copy-record binding drift",
  );
  invariant(
    file.value.exactPromotion?.copyRecordCount === EXPECTED.copyRecordCount
    && file.value.exactPromotion?.copyBytes === EXPECTED.copyBytes,
    "Applied receipt promotion totals drift",
  );
  invariant(file.value.unresolvedDependencies?.closureComplete === false, "Applied receipt hides dependency gaps");
  invariant(file.value.unresolvedDependencies?.count === EXPECTED.missingDependencyCount, "Applied receipt missing-count drift");
  invariant(
    file.value.unresolvedDependencies?.pathSetSha256
      === EXPECTED.missingDependencyPathSetSha256,
    "Applied receipt missing-path binding drift",
  );
  invariant(
    file.value.postchecks?.live?.freeze?.manifestSha256 === EXPECTED.postManifestSha256
    && file.value.postchecks?.live?.catalog?.checksumSetSha256
      === EXPECTED.postCatalogChecksumSha256,
    "Applied receipt postcheck binding drift",
  );
  const evidence = await inspectRegularFileNoFollow(resolved.absolutePath);
  invariant((evidence.mode & 0o222) === 0, "Applied receipt is writable");
  return { value: file.value, evidence };
}

async function verifyPublishedCommit(configuration, transaction, plan) {
  const final = await readAndValidateFinalReceipt(configuration);
  invariant(
    final.value.transactionId === transaction.journal.transactionId,
    "Applied receipt transaction binding drift",
  );
  invariant(
    final.value.retainedRecoveryRoots?.source === transaction.paths.sourceRecovery
    && final.value.retainedRecoveryRoots?.catalog === transaction.paths.catalogRecovery,
    "Applied receipt recovery-root binding drift",
  );
  invariant(
    final.value.swaps?.source?.status === "swapped-and-parent-fsynced"
    && final.value.swaps?.catalog?.status === "swapped-and-parent-fsynced",
    "Applied receipt lacks two durable directory-swap receipts",
  );
  if (transaction.journal.receiptDraft) {
    invariant(
      final.evidence.sha256 === transaction.journal.receiptDraft.sha256
      && final.evidence.bytes === transaction.journal.receiptDraft.bytes,
      "Applied receipt differs from the journaled commit draft",
    );
  }
  if (transaction.journal.finalReceipt) {
    invariant(
      final.evidence.sha256 === transaction.journal.finalReceipt.sha256,
      "Applied receipt differs from the committed journal receipt",
    );
  }
  const [livePostchecks, retainedBase] = await Promise.all([
    postcheckLive(configuration, plan),
    verifyBaseState({
      configuration,
      sourceRoot: transaction.paths.sourceRecovery,
      catalogRoot: transaction.paths.catalogRecovery,
      defaultPaths: false,
      expectedCatalogTreeSha256: transaction.journal.base.catalogTreeSha256,
    }),
  ]);
  return {
    final,
    livePostchecks,
    retainedBase,
  };
}

function receiptEvidenceSummary(evidence) {
  return {
    path: RECEIPT_RELATIVE,
    bytes: evidence.bytes,
    sha256: evidence.sha256,
    mode: (evidence.mode & 0o7777).toString(8).padStart(4, "0"),
  };
}

function committedResult(transaction, verification, { reconciledCommitPoint = false } = {}) {
  return {
    status: reconciledCommitPoint
      ? "committed-receipt-reconciled-and-verified-partial-source-promotion"
      : "committed-and-verified-partial-source-promotion",
    transactionId: transaction.journal.transactionId,
    planSha256: EXPECTED.planSha256,
    copyRecordCount: EXPECTED.copyRecordCount,
    copyBytes: EXPECTED.copyBytes,
    finalReceipt: receiptEvidenceSummary(verification.final.evidence),
    postchecks: {
      live: verification.livePostchecks,
      retainedPrePromotionRoots: verification.retainedBase,
      preparedReceipt: verification.final.value.postchecks.preparedReceipt,
    },
    retainedRecoveryRoots: verification.final.value.retainedRecoveryRoots,
    receiptIsCommitPoint: true,
    reconciledCommitPoint,
  };
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const configuration = createConfiguration(options);
  if (options.mode === "preflight") {
    process.stdout.write(`${JSON.stringify(await preflight(configuration), null, 2)}\n`);
    return;
  }
  if (options.mode === "recover") {
    process.stdout.write(`${JSON.stringify(await recoverPromotion(configuration), null, 2)}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(await executePromotion(configuration), null, 2)}\n`);
}

async function preflight(configuration) {
  return (await strictPreflight(configuration)).summary;
}

async function recoverPromotion(configuration) {
  const activeKind = await pathKind(configuration.activeRoot);
  if (activeKind === "missing") {
    if (await pathKind(configuration.receiptPath) === "file") {
      const final = await readAndValidateFinalReceipt(configuration);
      const planFile = await readJsonFileNoFollow(configuration.planPath);
      validatePlan(planFile.value, { planSha256: planFile.sha256 });
      const postchecks = await postcheckLive(configuration, planFile.value);
      return {
        status: "already-committed-and-verified",
        transactionId: final.value.transactionId,
        receiptSha256: final.evidence.sha256,
        postchecks,
      };
    }
    throw new Error("No active Grade 4 source-promotion transaction exists");
  }
  invariant(activeKind === "directory", `Active transaction is unsafe: ${configuration.activeRoot}`);
  const journalPath = path.join(configuration.activeRoot, "journal.json");
  const journalFile = await readJsonFileNoFollow(journalPath);
  const journal = journalFile.value;
  invariant(journal.schemaVersion === 1, "Unsupported transaction-journal schema");
  invariant(
    journal.artifactType === "help-math-g4-active-source-promotion-transaction",
    "Wrong transaction-journal type",
  );
  invariant(journal.planSha256 === EXPECTED.planSha256, "Transaction journal plan binding drift");
  const expectedPaths = transactionPaths(configuration, journal.transactionId);
  for (const [field, expected] of Object.entries({
    projectRoot: configuration.projectRoot,
    quarantineRoot: configuration.quarantineRoot,
    sourceLive: configuration.sourceRoot,
    catalogLive: configuration.catalogRoot,
    ...expectedPaths,
  })) {
    invariant(journal.paths?.[field] === expected, `Transaction journal path drift: ${field}`);
  }

  const transaction = {
    journal,
    journalPath,
    paths: expectedPaths,
  };
  const planFile = await readJsonFileNoFollow(configuration.planPath);
  validatePlan(planFile.value, { planSha256: planFile.sha256 });
  const parentModes = validateParentModeSnapshots(
    configuration,
    Array.isArray(journal.parentModes) ? journal.parentModes : [],
    journal,
  );
  const receiptKind = await pathKind(configuration.receiptPath);
  if (receiptKind !== "missing") {
    let commitError;
    try {
      invariant(receiptKind === "file", `Applied receipt is unsafe: ${receiptKind}`);
      invariant(
        journal.receiptDraft && typeof journal.receiptDraft.sha256 === "string",
        "Applied receipt exists without a journaled commit draft",
      );
      const verification = await verifyPublishedCommit(
        configuration,
        transaction,
        planFile.value,
      );
      const finalReceipt = receiptEvidenceSummary(verification.final.evidence);
      if (journal.phase !== "committed") {
        await persistJournal(transaction, {
          phase: "committed",
          committedAt: verification.final.value.completedAt,
          commitReconciledAt: new Date().toISOString(),
          finalReceipt,
        });
      }
      await restoreParentModes(parentModes);
      return committedResult(transaction, verification, {
        reconciledCommitPoint: journal.phase !== "committed",
      });
    } catch (error) {
      commitError = error;
      await persistJournal(transaction, {
        phase: "manual-intervention-required",
        commitReconciliationFailedAt: new Date().toISOString(),
        commitReconciliationError: error.message,
        receiptCommitPointPresent: true,
      }).catch(() => {});
      try {
        await restoreParentModes(parentModes);
      } catch (modeError) {
        commitError.parentModeRestoreError = modeError.message;
      }
    }
    throw commitError;
  }
  if (journal.phase === "committed") {
    const error = new Error("Committed journal is missing its immutable applied receipt");
    await persistJournal(transaction, {
      phase: "manual-intervention-required",
      commitReceiptMissingAt: new Date().toISOString(),
      commitReconciliationError: error.message,
    }).catch(() => {});
    try {
      await restoreParentModes(parentModes);
    } catch (modeError) {
      error.parentModeRestoreError = modeError.message;
    }
    throw error;
  }
  if (["rolled-back", "recovered-to-base"].includes(journal.phase)) {
    await restoreParentModes(parentModes);
    const verification = await verifyBaseState({
      configuration,
      defaultPaths: configuration.defaultProject,
      expectedCatalogTreeSha256: journal.base.catalogTreeSha256,
    });
    return {
      status: "already-rolled-back-and-verified",
      transactionId: journal.transactionId,
      verification,
    };
  }

  let recoveryError;
  let result;
  try {
    await enableParentMutation(parentModes);
    await persistJournal(transaction, {
      phase: "recovery-started",
      recoveryStartedAt: new Date().toISOString(),
    });
    const rollback = await rollbackTransactionToBase(configuration, transaction);
    await persistJournal(transaction, {
      phase: "recovered-to-base",
      recoveredAt: new Date().toISOString(),
      rollback,
    });
    result = {
      status: "recovered-to-base-and-verified",
      transactionId: journal.transactionId,
      rollback,
    };
  } catch (error) {
    recoveryError = error;
    await persistJournal(transaction, {
      phase: "manual-intervention-required",
      recoveryFailedAt: new Date().toISOString(),
      recoveryError: error.message,
      rollbackActions: error.rollbackActions ?? null,
    }).catch(() => {});
  } finally {
    try {
      await restoreParentModes(parentModes);
    } catch (modeError) {
      if (recoveryError) recoveryError.parentModeRestoreError = modeError.message;
      else recoveryError = modeError;
    }
  }
  if (recoveryError) throw recoveryError;
  return result;
}

async function executePromotion(configuration) {
  const preflightEvidence = await strictPreflight(configuration);
  invariant(await pathKind(configuration.receiptPath) === "missing", "Applied receipt already exists");

  let transaction;
  let parentModes = [];
  let result;
  let primaryError;
  try {
    transaction = await beginTransaction(configuration, preflightEvidence);
    parentModes = validateParentModeSnapshots(
      configuration,
      await snapshotParentModes([
        transaction.paths.sourceParent,
        transaction.paths.catalogParent,
      ]),
      transaction.journal,
    );
    await persistJournal(transaction, { phase: "parent-modes-pinned", parentModes });
    await enableParentMutation(parentModes);

    const staged = await stagePromotion({
      configuration,
      preflightEvidence,
      transaction,
    });
    const [sourceLive, sourceStaged, catalogLive, catalogStaged] = await Promise.all([
      snapshotDirectoryNode(configuration.sourceRoot, "live source before swap"),
      snapshotDirectoryNode(transaction.paths.sourceRecovery, "staged source before swap"),
      snapshotDirectoryNode(configuration.catalogRoot, "live catalog before swap"),
      snapshotDirectoryNode(transaction.paths.catalogRecovery, "staged catalog before swap"),
    ]);
    const directoryNodesBeforeSwap = {
      source: { live: sourceLive.node, staged: sourceStaged.node },
      catalog: { live: catalogLive.node, staged: catalogStaged.node },
    };
    await persistJournal(transaction, {
      phase: "ready-to-swap",
      directoryNodesBeforeSwap,
    });

    const sourceSwap = await atomicSwapSiblingDirectoriesDarwin({
      allowedParent: transaction.paths.sourceParent,
      firstDirectory: configuration.sourceRoot,
      secondDirectory: transaction.paths.sourceRecovery,
    });
    await persistJournal(transaction, {
      phase: "source-swapped",
      swapReceipts: { ...transaction.journal.swapReceipts, source: sourceSwap },
    });
    const catalogSwap = await atomicSwapSiblingDirectoriesDarwin({
      allowedParent: transaction.paths.catalogParent,
      firstDirectory: configuration.catalogRoot,
      secondDirectory: transaction.paths.catalogRecovery,
    });
    await persistJournal(transaction, {
      phase: "catalog-swapped",
      swapReceipts: { ...transaction.journal.swapReceipts, catalog: catalogSwap },
    });

    const [livePostchecks, retainedBase] = await Promise.all([
      postcheckLive(configuration, preflightEvidence.plan),
      verifyBaseState({
        configuration,
        sourceRoot: transaction.paths.sourceRecovery,
        catalogRoot: transaction.paths.catalogRecovery,
        defaultPaths: false,
        expectedCatalogTreeSha256: preflightEvidence.catalogInventory.treeSha256,
      }),
    ]);
    const postchecks = {
      live: livePostchecks,
      retainedPrePromotionRoots: retainedBase,
      preparedReceipt: {
        relativePath: staged.preparedReceiptRelative,
        sha256: transaction.journal.staged.preparedReceiptSha256,
        immutable: true,
      },
    };
    await persistJournal(transaction, { phase: "postchecks-passed", postchecks });

    const final = finalReceipt(staged.prepared, {
      sourceSwap,
      catalogSwap,
      postchecks,
      paths: transaction.paths,
      completedAt: new Date().toISOString(),
    });
    const finalText = `${JSON.stringify(final, null, 2)}\n`;
    await persistJournal(transaction, {
      phase: "ready-to-publish-receipt",
      receiptDraft: {
        bytes: Buffer.byteLength(finalText),
        sha256: sha256Text(finalText),
      },
    });
    await installFinalReceiptExclusive(configuration, final);
    const committedVerification = await verifyPublishedCommit(
      configuration,
      transaction,
      preflightEvidence.plan,
    );
    const receiptEvidence = receiptEvidenceSummary(committedVerification.final.evidence);
    await persistJournal(transaction, {
      phase: "committed",
      committedAt: final.completedAt,
      finalReceipt: receiptEvidence,
    });
    result = committedResult(transaction, committedVerification);
  } catch (error) {
    primaryError = error;
    if (transaction && transaction.journal.phase !== "committed") {
      let receiptKind;
      try {
        receiptKind = await pathKind(configuration.receiptPath);
      } catch (receiptObservationError) {
        receiptKind = "indeterminate";
        primaryError.receiptObservationError = receiptObservationError.message;
      }
      if (receiptKind === "file") {
        try {
          const committedVerification = await verifyPublishedCommit(
            configuration,
            transaction,
            preflightEvidence.plan,
          );
          const receiptEvidence = receiptEvidenceSummary(
            committedVerification.final.evidence,
          );
          await persistJournal(transaction, {
            phase: "committed",
            committedAt: committedVerification.final.value.completedAt,
            commitReconciledAt: new Date().toISOString(),
            reconciledFromError: error.message,
            finalReceipt: receiptEvidence,
          });
          result = committedResult(transaction, committedVerification, {
            reconciledCommitPoint: true,
          });
          result.reconciledFromError = error.message;
          primaryError = undefined;
        } catch (commitError) {
          const aggregate = new AggregateError(
            [error, commitError],
            "Applied receipt reached the commit point but commit verification failed",
          );
          aggregate.receiptCommitPointPresent = true;
          aggregate.originalError = error.message;
          aggregate.commitVerificationError = commitError.message;
          primaryError = aggregate;
          await persistJournal(transaction, {
            phase: "manual-intervention-required",
            commitReconciliationFailedAt: new Date().toISOString(),
            commitReconciliationError: commitError.message,
            originalError: error.message,
            receiptCommitPointPresent: true,
          }).catch(() => {});
        }
      } else if (receiptKind !== "missing") {
        const aggregate = new Error(
          `Applied-receipt state is ${receiptKind}; refusing an automatic rollback`,
        );
        aggregate.receiptState = receiptKind;
        aggregate.originalError = error.message;
        primaryError = aggregate;
        await persistJournal(transaction, {
          phase: "manual-intervention-required",
          receiptStateObservedAt: new Date().toISOString(),
          receiptState: receiptKind,
          originalError: error.message,
        }).catch(() => {});
      } else {
        await persistJournal(transaction, {
          phase: "rollback-started",
          failedAt: new Date().toISOString(),
          failure: error.message,
        }).catch(() => {});
        try {
          const rollback = await rollbackTransactionToBase(configuration, transaction);
          await persistJournal(transaction, {
            phase: "rolled-back",
            rolledBackAt: new Date().toISOString(),
            rollback,
          });
          primaryError.rollback = rollback;
        } catch (rollbackError) {
          primaryError.rollbackError = rollbackError.message;
          primaryError.rollbackActions = rollbackError.rollbackActions ?? null;
          await persistJournal(transaction, {
            phase: "manual-intervention-required",
            rollbackFailedAt: new Date().toISOString(),
            rollbackError: rollbackError.message,
            rollbackActions: rollbackError.rollbackActions ?? null,
          }).catch(() => {});
        }
      }
    }
  } finally {
    try {
      await restoreParentModes(parentModes);
    } catch (modeError) {
      if (primaryError) primaryError.parentModeRestoreError = modeError.message;
      else if (result) {
        modeError.committedResult = result;
        primaryError = modeError;
      } else {
        primaryError = modeError;
      }
    }
  }
  if (primaryError) throw primaryError;
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`Grade 4 active-source promotion failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}

export {
  EXPECTED,
  cloneTreeCopyOnWrite,
  createConfiguration,
  executePromotion,
  installFinalReceiptExclusive,
  observeSwapPair,
  parseArguments,
  portablePath,
  preflight,
  recoverPromotion,
  restoreSwapPair,
  syncTreeDurably,
  transactionIdentifier,
  transactionPaths,
  validatePlan,
  validateParentModeSnapshots,
};
