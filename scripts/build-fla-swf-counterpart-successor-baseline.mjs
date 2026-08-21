#!/usr/bin/env node

import {spawn, execFile as execFileCallback} from "node:child_process";
import {randomUUID} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readdir,
  realpath,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {isDeepStrictEqual, promisify} from "node:util";

import {
  inspectRegularFileNoFollow,
  fsyncDirectory,
  invariant,
  pathKind,
  portableRelativePath,
  publishImmutableBytesNoClobber,
  readJsonArtifactNoFollow,
  sha256Bytes,
} from "./lib/fla-swf-counterpart-transaction.mjs";

const execFile = promisify(execFileCallback);
const scriptPath = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");

export const BASELINE_SCHEMA =
  "help-math-fla-swf-counterpart-successor-implementation-baseline/v1";
export const BASELINE_ARTIFACT_TYPE =
  "help-math-fla-swf-counterpart-successor-implementation-baseline";
export const BASELINE_RECEIPT_RELATIVE_PATH =
  "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v2-implementation-baseline.json";
export const BASELINE_COMPLETION_RELATIVE_PATH =
  "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v2-implementation-baseline-complete.json";
export const BASELINE_ATTEMPTS_RELATIVE_ROOT =
  "work/fla-swf-counterpart-successor-review/implementation-baseline-attempts";

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;
export const BASELINE_NODE_EXECUTABLE_PATH = path.resolve(process.execPath);
export const BASELINE_NPM_CLI_PATH = path.resolve(
  path.dirname(BASELINE_NODE_EXECUTABLE_PATH),
  "../lib/node_modules/npm/bin/npm-cli.js",
);
export const BASELINE_GIT_EXECUTABLE_PATH = "/usr/bin/git";
export const BASELINE_NPM_FIXED_ARGS = Object.freeze([
  "--userconfig=/dev/null",
  "--globalconfig=/private/var/empty/npmrc",
  "--script-shell=/bin/sh",
  "--node-options=",
]);
const TRUSTED_COMMAND_PATH = [
  path.dirname(BASELINE_NODE_EXECUTABLE_PATH),
  "/opt/homebrew/bin",
  "/usr/local/bin",
  "/usr/bin",
  "/bin",
  "/usr/sbin",
  "/sbin",
].join(path.delimiter);

export function trustedCommandEnvironment() {
  return {
    PATH: TRUSTED_COMMAND_PATH,
    LANG: "C",
    LC_ALL: "C",
    TMPDIR: "/private/tmp",
  };
}

const CATALOG_OUTPUTS = Object.freeze([
  "summary.json",
  "animations.json",
  "animations.jsonl",
  "animations.csv",
  "assets.json",
  "duplicates.json",
  "missing-references.json",
  "unreferenced.json",
  "fla-only.json",
  "lessons.json",
  "audio-groups.json",
  "batches.json",
  "lesson-releases.json",
  "source-files.json",
  "source-files.jsonl",
  "source-files.csv",
  "source-files.sha256",
]);

export const BASELINE_COMMANDS = Object.freeze([
  Object.freeze({
    id: "doctor",
    commandText: "npm run doctor",
    executable: BASELINE_NODE_EXECUTABLE_PATH,
    args: [BASELINE_NPM_CLI_PATH, ...BASELINE_NPM_FIXED_ARGS, "run", "doctor"],
    gateClass: "required-targeted",
  }),
  Object.freeze({
    id: "verify-workbench",
    commandText: "npm run verify:workbench",
    executable: BASELINE_NODE_EXECUTABLE_PATH,
    args: [BASELINE_NPM_CLI_PATH, ...BASELINE_NPM_FIXED_ARGS, "run", "verify:workbench"],
    gateClass: "separately-reported-repository",
  }),
  Object.freeze({
    id: "verify-sources",
    commandText: "npm run verify:sources",
    executable: BASELINE_NODE_EXECUTABLE_PATH,
    args: [BASELINE_NPM_CLI_PATH, ...BASELINE_NPM_FIXED_ARGS, "run", "verify:sources"],
    gateClass: "required-targeted",
  }),
  Object.freeze({
    id: "catalog-fail-closed-check",
    commandText:
      "node scripts/build-help-math-catalog.mjs --output catalog --concurrency 8 --verify-known-counts --check",
    executable: BASELINE_NODE_EXECUTABLE_PATH,
    args: [
      "scripts/build-help-math-catalog.mjs",
      "--output",
      "catalog",
      "--concurrency",
      "8",
      "--verify-known-counts",
      "--check",
    ],
    gateClass: "required-targeted",
  }),
  Object.freeze({
    id: "targeted-source-catalog-tests",
    commandText:
      "node --test scripts/freeze-help-math-sources.test.mjs scripts/build-help-math-catalog.test.mjs",
    executable: BASELINE_NODE_EXECUTABLE_PATH,
    args: [
      "--test",
      "scripts/freeze-help-math-sources.test.mjs",
      "scripts/build-help-math-catalog.test.mjs",
    ],
    gateClass: "required-targeted",
  }),
  Object.freeze({
    id: "targeted-successor-transaction-tests",
    commandText:
      "node --test scripts/build-fla-swf-counterpart-successor-baseline.test.mjs scripts/build-fla-swf-counterpart-successor-plan.test.mjs scripts/darwin-atomic-directory-swap.test.mjs scripts/promote-fla-swf-counterpart-successor.test.mjs",
    executable: BASELINE_NODE_EXECUTABLE_PATH,
    args: [
      "--test",
      "scripts/build-fla-swf-counterpart-successor-baseline.test.mjs",
      "scripts/build-fla-swf-counterpart-successor-plan.test.mjs",
      "scripts/darwin-atomic-directory-swap.test.mjs",
      "scripts/promote-fla-swf-counterpart-successor.test.mjs",
    ],
    gateClass: "required-targeted",
  }),
  Object.freeze({
    id: "full-repository-tests",
    commandText: "npm test",
    executable: BASELINE_NODE_EXECUTABLE_PATH,
    args: [BASELINE_NPM_CLI_PATH, ...BASELINE_NPM_FIXED_ARGS, "test"],
    gateClass: "separately-reported-repository",
  }),
]);

export const BASELINE_MANDATORY_SCOPE_PATHS = Object.freeze([
  ".gitignore",
  "README.md",
  "package.json",
  "scripts/build-fla-swf-counterpart-successor-baseline.mjs",
  "scripts/build-fla-swf-counterpart-successor-baseline.test.mjs",
  "scripts/build-fla-swf-counterpart-successor-plan.mjs",
  "scripts/build-fla-swf-counterpart-successor-plan.test.mjs",
  "scripts/check-fla-swf-counterpart-successor-review.mjs",
  "scripts/promote-fla-swf-counterpart-successor.mjs",
  "scripts/promote-fla-swf-counterpart-successor.test.mjs",
  "scripts/darwin-atomic-directory-swap.test.mjs",
  "scripts/lib/darwin-atomic-directory-swap.mjs",
  "scripts/lib/darwin-atomic-directory-swap-native.c",
  "scripts/lib/fla-swf-counterpart-transaction.mjs",
  "scripts/build-help-math-catalog.mjs",
  "scripts/build-help-math-catalog.test.mjs",
  "scripts/freeze-help-math-sources.mjs",
  "scripts/freeze-help-math-sources.test.mjs",
  "catalog/current-source-profile.json",
  "catalog/source-manifest.sha256",
  "catalog/source-freeze.json",
  ...CATALOG_OUTPUTS.map((name) => `catalog/${name}`),
]);

const SUCCESSOR_ARTIFACT_DIRECTORY = "catalog/source-promotions";
const SUCCESSOR_ARTIFACT_PREFIX = "fla-swf-counterpart-successor-2026-08-07";
const POST_BASELINE_EXACT_EXCLUSIONS = Object.freeze([
  BASELINE_RECEIPT_RELATIVE_PATH,
  BASELINE_COMPLETION_RELATIVE_PATH,
  `${SUCCESSOR_ARTIFACT_DIRECTORY}/${SUCCESSOR_ARTIFACT_PREFIX}-v2-trusted-reviewer-registry.json`,
  `${SUCCESSOR_ARTIFACT_DIRECTORY}/${SUCCESSOR_ARTIFACT_PREFIX}-v2-pair-review-ledger.json`,
  `${SUCCESSOR_ARTIFACT_DIRECTORY}/${SUCCESSOR_ARTIFACT_PREFIX}-v2-plan.json`,
  `${SUCCESSOR_ARTIFACT_DIRECTORY}/${SUCCESSOR_ARTIFACT_PREFIX}-v2-applied.json`,
  `${SUCCESSOR_ARTIFACT_DIRECTORY}/${SUCCESSOR_ARTIFACT_PREFIX}-v2-no-copy-closure.json`,
]);
const PREPARED_ARTIFACT_BASENAME_PATTERN = new RegExp(
  `^${SUCCESSOR_ARTIFACT_PREFIX}-v2-prepared-[0-9]{8}T[0-9]{9}Z-[a-f0-9]{12}\\.json$`,
  "u",
);
export const BASELINE_POST_CAPTURE_EXCLUSIONS = Object.freeze([
  ...POST_BASELINE_EXACT_EXCLUSIONS,
  `${SUCCESSOR_ARTIFACT_DIRECTORY}/${SUCCESSOR_ARTIFACT_PREFIX}-v2-prepared-<transaction-id>.json`,
]);
const BASELINE_SCOPE_DEFINITION =
  "mandatory successor scripts/tests and package/README boundaries; current profile, 17 generated catalog outputs, source-manifest and source-freeze; plus the exact pre-existing immutable successor artifacts captured before this baseline. The receipt is usable only with its post-scan immutable completion marker. Later trusted-registry, signed-ledger, plan, prepared, applied, and no-copy artifacts are self-referential exclusions validated by their own contracts.";

const TOP_LEVEL_KEYS = Object.freeze([
  "schemaVersion", "artifactType", "status", "capturedAt", "completedAt",
  "timing", "checkout", "filesystem", "tools", "scopedOwnership", "commands",
  "evidenceArtifacts", "summary", "reportingGate", "evidenceBoundary",
]);
const TOOL_KEYS = Object.freeze([
  "node", "nodeExecutable", "npm", "npmCli", "git", "gitExecutable",
  "commandEnvironment", "npmProjectConfiguration",
  "macOSProductVersion", "macOSBuildVersion",
  "clangPath", "clangVersion", "macosSdkPath", "python", "ffmpeg", "ffprobe",
  "adobeAnimate2021",
]);
const CORE_TOOL_KEYS = new Set([
  "node", "npm", "git", "macOSProductVersion", "macOSBuildVersion",
  "clangPath", "clangVersion", "macosSdkPath",
]);
const NODE_TEST_SUMMARY_KEYS = Object.freeze([
  "tests", "pass", "fail", "cancelled", "skipped", "todo",
]);

function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function exactKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value),
    `${label} must be an object`);
  const observed = Object.keys(value).sort(compareText);
  const required = [...expected].sort(compareText);
  invariant(isDeepStrictEqual(observed, required),
    `${label} keys changed: expected ${required.join(", ")}; observed ${observed.join(", ")}`);
}

function validIsoTimestamp(value) {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)
    && Number.isFinite(Date.parse(value));
}

function nonemptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function fileNode(information) {
  return {dev: String(information.dev), ino: String(information.ino)};
}

function sameFileNode(left, right) {
  return left?.dev === right?.dev && left?.ino === right?.ino;
}

function directoryNodeRecord(absolutePath, information) {
  return {path: absolutePath, ...fileNode(information)};
}

async function snapshotTrustedContainedPath(root, relativePath, {
  leafType = "file",
  label = "trusted contained path",
} = {}) {
  const safe = portableRelativePath(relativePath, label);
  invariant(["file", "directory"].includes(leafType),
    `${label} has an unsupported leaf type`);
  const requestedRoot = path.resolve(root);
  const requestedRootInformation = await lstat(requestedRoot, {bigint: true});
  invariant(requestedRootInformation.isDirectory()
    && !requestedRootInformation.isSymbolicLink(),
  `${label} root is not a real directory`);
  const rootReal = await realpath(requestedRoot);
  invariant(rootReal === requestedRoot,
    `${label} root resolves through a symbolic-link alias`);
  const rootInformation = await lstat(rootReal, {bigint: true});
  invariant(rootInformation.isDirectory() && !rootInformation.isSymbolicLink(),
    `${label} root is not a real directory`);
  const directoryNodes = [directoryNodeRecord(rootReal, rootInformation)];
  let current = rootReal;
  const segments = safe.split("/");
  let leafInformation = null;
  for (const [index, segment] of segments.entries()) {
    current = path.join(current, segment);
    const information = await lstat(current, {bigint: true});
    invariant(!information.isSymbolicLink(),
      `${label} traverses a symbolic link: ${current}`);
    const atLeaf = index === segments.length - 1;
    if (!atLeaf || leafType === "directory") {
      invariant(information.isDirectory(),
        `${label} ancestor is not a directory: ${current}`);
      directoryNodes.push(directoryNodeRecord(current, information));
    } else {
      invariant(information.isFile(), `${label} is not a regular file: ${current}`);
    }
    if (atLeaf) leafInformation = information;
  }
  invariant(leafInformation !== null, `${label} did not resolve a leaf`);
  return {
    absolutePath: current,
    directoryNodes,
    leafNode: fileNode(leafInformation),
    leafInformation,
  };
}

function assertTrustedPathSnapshotStable(before, after, label) {
  invariant(before.absolutePath === after.absolutePath
    && isDeepStrictEqual(before.directoryNodes, after.directoryNodes)
    && sameFileNode(before.leafNode, after.leafNode),
  `${label} ancestor or leaf identity changed while in use`);
}

function assertArtifactReference(reference, label) {
  exactKeys(reference, ["path", "bytes", "sha256"], label);
  portableRelativePath(reference.path, `${label}.path`);
  invariant(Number.isSafeInteger(reference.bytes) && reference.bytes >= 0
    && SHA256_PATTERN.test(reference.sha256),
  `${label} identity is invalid`);
}

function assertCommandSummary(summary, label) {
  exactKeys(summary, ["nodeTestSummary", "markers"], label);
  if (summary.nodeTestSummary !== null) {
    invariant(summary.nodeTestSummary && typeof summary.nodeTestSummary === "object"
      && !Array.isArray(summary.nodeTestSummary),
    `${label}.nodeTestSummary must be null or an object`);
    const keys = Object.keys(summary.nodeTestSummary);
    invariant(keys.length > 0
      && keys.every((key) => NODE_TEST_SUMMARY_KEYS.includes(key)),
    `${label}.nodeTestSummary keys are invalid`);
    for (const [key, value] of Object.entries(summary.nodeTestSummary)) {
      invariant(Number.isSafeInteger(value) && value >= 0,
        `${label}.nodeTestSummary.${key} is invalid`);
    }
  }
  exactKeys(summary.markers, [
    "staleCompletionLedger", "missingExternalOnlineKeyTermsXml",
    "staleTraceSpecification",
  ], `${label}.markers`);
  invariant(Object.values(summary.markers).every((value) => typeof value === "boolean"),
    `${label}.markers values must be booleans`);
}

export function scopedRecordsDigest(records) {
  return sha256Bytes(Buffer.from(records.map((record) => [
    record.path,
    record.bytes,
    record.sha256,
    record.dev,
    record.ino,
    record.mode,
    record.nlink,
    record.mtimeNs,
  ].join("\t") + "\n").join(""), "utf8"));
}

function safeTimestamp(value) {
  return value.replace(/[-:.]/gu, "");
}

export function baselineAttemptIdentifier(startedAt, uuid = randomUUID()) {
  invariant(validIsoTimestamp(startedAt), "Baseline attempt timestamp is invalid");
  const compactUuid = uuid.replaceAll("-", "").toLowerCase();
  invariant(/^[a-f0-9]{32}$/u.test(compactUuid),
    "Baseline attempt UUID is not canonical hexadecimal UUID material");
  return `${safeTimestamp(startedAt)}-${compactUuid.slice(0, 12)}`;
}

export function commandOutputSummary(stdout, stderr) {
  const text = `${stdout.toString("utf8")}\n${stderr.toString("utf8")}`;
  const nodeSummary = {};
  for (const key of ["tests", "pass", "fail", "cancelled", "skipped", "todo"]) {
    const matches = [...text.matchAll(new RegExp(`(?:^|\\n)(?:\\u2139|#)?\\s*${key}\\s+(\\d+)`, "gu"))];
    if (matches.length > 0) nodeSummary[key] = Number(matches.at(-1)[1]);
  }
  return {
    nodeTestSummary: Object.keys(nodeSummary).length > 0 ? nodeSummary : null,
    markers: {
      staleCompletionLedger: /completion-ledger\.json[^\n]*(?:stale|out of date)|completion ledger[^\n]*stale/iu.test(text),
      missingExternalOnlineKeyTermsXml: text.includes("/Volumes/WestWorld/HELP_OnlineKeyTerms_XML"),
      staleTraceSpecification: /trace[^\n]*(?:stale|out of date)|(?:stale|out of date)[^\n]*trace/iu.test(text),
    },
  };
}

async function runCapturedCommand(specification, {
  cwd,
  timeoutMs = 30 * 60 * 1000,
} = {}) {
  const startedAt = new Date().toISOString();
  const stdout = [];
  const stderr = [];
  const child = spawn(specification.executable, specification.args, {
    cwd,
    env: trustedCommandEnvironment(),
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)));
  child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)));
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    child.kill("SIGTERM");
    setTimeout(() => child.kill("SIGKILL"), 5_000).unref();
  }, timeoutMs);
  const result = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (exitCode, signal) => resolve({exitCode, signal}));
  }).finally(() => clearTimeout(timer));
  return {
    startedAt,
    completedAt: new Date().toISOString(),
    exitCode: Number.isInteger(result.exitCode) ? result.exitCode : null,
    signal: result.signal ?? null,
    timedOut,
    stdout: Buffer.concat(stdout),
    stderr: Buffer.concat(stderr),
  };
}

async function execText(executable, args, {
  cwd = PROJECT_ROOT,
  allowFailure = false,
} = {}) {
  try {
    const result = await execFile(executable, args, {
      cwd,
      env: trustedCommandEnvironment(),
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
      timeout: 30_000,
    });
    return String(result.stdout ?? "").trim();
  } catch (error) {
    if (allowFailure) return null;
    throw error;
  }
}

async function stableRegularFileIdentity(root, relativePath) {
  const trustedBefore = await snapshotTrustedContainedPath(root, relativePath, {
    label: "baseline scope path",
  });
  const {absolutePath, leafInformation: information} = trustedBefore;
  const handle = await open(absolutePath, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const before = await handle.stat({bigint: true});
    invariant(before.isFile() && before.nlink === information.nlink
      && before.dev === information.dev && before.ino === information.ino,
    `Baseline scope path changed before open: ${relativePath}`);
    const contents = await handle.readFile();
    const after = await handle.stat({bigint: true});
    const finalAtPath = await lstat(absolutePath, {bigint: true});
    const trustedAfter = await snapshotTrustedContainedPath(root, relativePath, {
      label: "baseline scope path",
    });
    assertTrustedPathSnapshotStable(
      trustedBefore,
      trustedAfter,
      `Baseline scope path ${relativePath}`,
    );
    invariant(after.dev === before.dev && after.ino === before.ino
      && finalAtPath.dev === before.dev && finalAtPath.ino === before.ino
      && after.size === before.size && after.mtimeNs === before.mtimeNs
      && BigInt(contents.length) === after.size,
    `Baseline scope path changed while hashing: ${relativePath}`);
    return {
      path: relativePath,
      bytes: contents.length,
      sha256: sha256Bytes(contents),
      dev: String(after.dev),
      ino: String(after.ino),
      mode: Number(after.mode & 0o7777n),
      nlink: Number(after.nlink),
      mtimeNs: String(after.mtimeNs),
    };
  } finally {
    await handle.close();
  }
}

export async function successorArtifactPaths(root, {
  allowedPostBaselineExactPaths = [],
  allowPreparedArtifacts = false,
} = {}) {
  invariant(Array.isArray(allowedPostBaselineExactPaths)
    && new Set(allowedPostBaselineExactPaths).size === allowedPostBaselineExactPaths.length
    && allowedPostBaselineExactPaths.every((relativePath) =>
      POST_BASELINE_EXACT_EXCLUSIONS.includes(relativePath)),
  "Successor artifact scan has an invalid phase-specific exclusion set");
  const allowedExact = new Set(allowedPostBaselineExactPaths);
  const relativeDirectory = SUCCESSOR_ARTIFACT_DIRECTORY;
  const trustedDirectoryBefore = await snapshotTrustedContainedPath(
    root,
    relativeDirectory,
    {leafType: "directory", label: "successor artifact directory"},
  );
  const absoluteDirectory = trustedDirectoryBefore.absolutePath;
  const entries = await readdir(absoluteDirectory, {withFileTypes: true});
  const captured = [];
  for (const entry of entries) {
    if (!entry.name.startsWith(SUCCESSOR_ARTIFACT_PREFIX)) continue;
    const relativePath = `${relativeDirectory}/${entry.name}`;
    const information = await lstat(path.join(absoluteDirectory, entry.name), {bigint: true});
    invariant(entry.isFile() && !entry.isSymbolicLink()
      && information.isFile() && !information.isSymbolicLink(),
      `Successor artifact path is not a real regular file: ${relativePath}`);
    const exactExcluded = POST_BASELINE_EXACT_EXCLUSIONS.includes(relativePath);
    const preparedExcluded = PREPARED_ARTIFACT_BASENAME_PATTERN.test(entry.name);
    invariant(!exactExcluded || allowedExact.has(relativePath),
      `Post-baseline successor artifact is forbidden in this baseline phase: ${relativePath}`);
    invariant(!preparedExcluded || allowPreparedArtifacts,
      `Prepared successor artifact is forbidden in this baseline phase: ${relativePath}`);
    if (!exactExcluded && !preparedExcluded) captured.push(relativePath);
  }
  const trustedDirectoryAfter = await snapshotTrustedContainedPath(
    root,
    relativeDirectory,
    {leafType: "directory", label: "successor artifact directory"},
  );
  assertTrustedPathSnapshotStable(
    trustedDirectoryBefore,
    trustedDirectoryAfter,
    "Successor artifact directory",
  );
  return captured.sort(compareText);
}

export function assertTrustedBaselineScopePathsCurrent(receiptPaths, trustedPaths) {
  invariant(isDeepStrictEqual(receiptPaths, trustedPaths),
    "Implementation baseline trusted mandatory/dynamic scope contract is no longer current");
  return true;
}

export function assertCommandSummaryMatchesPhysicalLogs(summary, stdout, stderr, label) {
  invariant(isDeepStrictEqual(summary, commandOutputSummary(stdout, stderr)),
    `${label} summary differs from physical logs`);
  return true;
}

async function ensureSafeDirectory(directory) {
  const absolute = path.resolve(directory);
  const parsed = path.parse(absolute);
  let current = parsed.root;
  for (const segment of absolute.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    const next = path.join(current, segment);
    const kind = await pathKind(next);
    if (kind === "missing") {
      await mkdir(next, {mode: 0o700});
      await fsyncDirectory(current);
      await fsyncDirectory(next);
    }
    else invariant(kind === "directory", `Baseline output ancestor is unsafe: ${next}`);
    const information = await lstat(next, {bigint: true});
    invariant(information.isDirectory() && !information.isSymbolicLink(),
      `Baseline output ancestor is not a real directory: ${next}`);
    current = next;
  }
  invariant(await realpath(current) === absolute,
    `Baseline output directory resolves through an alias: ${absolute}`);
  return absolute;
}

export async function baselineScopePaths(root = PROJECT_ROOT, {
  allowedPostBaselineExactPaths = [],
  allowPreparedArtifacts = false,
} = {}) {
  return [...new Set([
    ...BASELINE_MANDATORY_SCOPE_PATHS,
    ...await successorArtifactPaths(root, {
      allowedPostBaselineExactPaths,
      allowPreparedArtifacts,
    }),
  ])].sort(compareText);
}

async function gitScopeEvidence(root, paths) {
  const [status, staged, worktree, untracked] = await Promise.all([
    execText(BASELINE_GIT_EXECUTABLE_PATH, ["status", "--porcelain=v1", "--untracked-files=all", "--", ...paths], {cwd: root}),
    execText(BASELINE_GIT_EXECUTABLE_PATH, ["diff", "--cached", "--raw", "--", ...paths], {cwd: root}),
    execText(BASELINE_GIT_EXECUTABLE_PATH, ["diff", "--raw", "HEAD", "--", ...paths], {cwd: root}),
    execText(BASELINE_GIT_EXECUTABLE_PATH, ["ls-files", "--others", "--exclude-standard", "--", ...paths], {cwd: root}),
  ]);
  const value = {status, staged, worktree, untracked};
  return {
    ...value,
    identitySha256: sha256Bytes(Buffer.from(canonicalJson(value), "utf8")),
  };
}

export async function captureScopedOwnershipSnapshot(root = PROJECT_ROOT, {
  paths: fixedPaths = null,
} = {}) {
  const paths = fixedPaths
    ? [...fixedPaths].map((relativePath) => portableRelativePath(
      relativePath,
      "fixed baseline scope path",
    )).sort(compareText)
    : await baselineScopePaths(root);
  invariant(new Set(paths).size === paths.length,
    "Baseline scope contains duplicate fixed paths");
  const records = [];
  for (const relativePath of paths) records.push(await stableRegularFileIdentity(root, relativePath));
  const git = await gitScopeEvidence(root, paths);
  const identitySha256 = scopedRecordsDigest(records);
  return {records, identitySha256, git};
}

async function checkoutEvidence(root) {
  const [topLevel, branch, head] = await Promise.all([
    execText(BASELINE_GIT_EXECUTABLE_PATH, ["rev-parse", "--show-toplevel"], {cwd: root}),
    execText(BASELINE_GIT_EXECUTABLE_PATH, ["branch", "--show-current"], {cwd: root}),
    execText(BASELINE_GIT_EXECUTABLE_PATH, ["rev-parse", "HEAD"], {cwd: root}),
  ]);
  invariant(path.resolve(topLevel) === path.resolve(root),
    "Baseline checkout root differs from the requested project root");
  invariant(branch.length > 0 && /^[a-f0-9]{40}$/u.test(head),
    "Baseline checkout branch or HEAD is invalid");
  return {projectRoot: await realpath(root), branch, head};
}

function parseDiskutil(text) {
  const field = (label) => text.match(new RegExp(`^\\s*${label}:\\s*(.+)$`, "mu"))?.[1]?.trim() ?? null;
  return {
    deviceNode: field("Device Node"),
    volumeName: field("Volume Name"),
    fileSystemPersonality: field("File System Personality"),
    bundleType: field("Type \\(Bundle\\)"),
    containerFreeSpace: field("Container Free Space"),
  };
}

function parseDf(text) {
  const lines = text.trim().split(/\n/u);
  const fields = lines.at(-1).trim().split(/\s+/u);
  invariant(fields.length >= 6, "df output is incomplete");
  return {
    filesystem: fields[0],
    blocks1024: Number(fields[1]),
    used1024: Number(fields[2]),
    available1024: Number(fields[3]),
    capacity: fields[4],
    mountedOn: fields.slice(5).join(" "),
  };
}

export async function filesystemEvidence(root) {
  const dfText = await execText("/bin/df", ["-Pk", root], {cwd: root});
  const freeSpace = parseDf(dfText);
  invariant(path.isAbsolute(freeSpace.filesystem)
    && (path.resolve(root) === freeSpace.mountedOn
      || path.resolve(root).startsWith(`${freeSpace.mountedOn}${path.sep}`)),
  "df did not resolve the project root to an explicit containing mount");
  const diskutilText = await execText(
    "/usr/sbin/diskutil",
    ["info", freeSpace.filesystem],
    {cwd: root},
  );
  const volume = parseDiskutil(diskutilText);
  invariant(volume.fileSystemPersonality === "APFS" && volume.bundleType === "apfs",
    "Successor baseline requires an APFS project volume");
  return {
    volume,
    freeSpace,
  };
}

async function externalExecutableIdentity(candidate, label) {
  invariant(path.isAbsolute(candidate), `${label} path must be absolute`);
  const candidatePath = path.resolve(candidate);
  const resolved = await realpath(candidatePath);
  const atPathBefore = await lstat(candidatePath, {bigint: true});
  invariant(atPathBefore.isFile() && !atPathBefore.isSymbolicLink(),
    `${label} is not a real regular file: ${candidatePath}`);
  const handle = await open(candidatePath, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const before = await handle.stat({bigint: true});
    invariant(before.isFile()
      && before.dev === atPathBefore.dev && before.ino === atPathBefore.ino,
    `${label} identity changed before hashing`);
    const contents = await handle.readFile();
    const after = await handle.stat({bigint: true});
    const atPathAfter = await lstat(candidatePath, {bigint: true});
    invariant(after.dev === before.dev && after.ino === before.ino
      && atPathAfter.dev === before.dev && atPathAfter.ino === before.ino
      && after.size === before.size && atPathAfter.size === before.size
      && after.mtimeNs === before.mtimeNs && atPathAfter.mtimeNs === before.mtimeNs
      && BigInt(contents.length) === before.size,
    `${label} changed while hashing`);
    return {
      path: candidatePath,
      realPath: resolved,
      bytes: contents.length,
      sha256: sha256Bytes(contents),
    };
  } finally {
    await handle.close();
  }
}

export async function toolEvidence(root) {
  const npmProjectConfigurationPath = path.join(root, ".npmrc");
  invariant(await pathKind(npmProjectConfigurationPath) === "missing",
    "Implementation baseline requires the project-root .npmrc to be absent");
  const optional = async (executable, args) => execText(executable, args, {
    cwd: root,
    allowFailure: true,
  });
  const animateInfo = "/Applications/Adobe Animate 2021/Adobe Animate 2021.app/Contents/Info.plist";
  const tools = {
    node: process.version,
    nodeExecutable: await externalExecutableIdentity(
      BASELINE_NODE_EXECUTABLE_PATH,
      "baseline Node executable",
    ),
    npm: await execText(
      BASELINE_NODE_EXECUTABLE_PATH,
      [BASELINE_NPM_CLI_PATH, "--version"],
      {cwd: root},
    ),
    npmCli: await externalExecutableIdentity(BASELINE_NPM_CLI_PATH, "baseline npm CLI"),
    git: await execText(BASELINE_GIT_EXECUTABLE_PATH, ["--version"], {cwd: root}),
    gitExecutable: await externalExecutableIdentity(
      BASELINE_GIT_EXECUTABLE_PATH,
      "baseline Git executable",
    ),
    commandEnvironment: trustedCommandEnvironment(),
    npmProjectConfiguration: {path: ".npmrc", status: "absent"},
    macOSProductVersion: await execText("/usr/bin/sw_vers", ["-productVersion"], {cwd: root}),
    macOSBuildVersion: await execText("/usr/bin/sw_vers", ["-buildVersion"], {cwd: root}),
    clangPath: await execText("/usr/bin/xcrun", ["--find", "clang"], {cwd: root}),
    clangVersion: await execText("/usr/bin/xcrun", ["--sdk", "macosx", "clang", "--version"], {cwd: root}),
    macosSdkPath: await execText("/usr/bin/xcrun", ["--sdk", "macosx", "--show-sdk-path"], {cwd: root}),
    python: await optional("python3", ["--version"]),
    ffmpeg: await optional("ffmpeg", ["-version"]),
    ffprobe: await optional("ffprobe", ["-version"]),
    adobeAnimate2021: await optional("/usr/libexec/PlistBuddy", [
      "-c",
      "Print :CFBundleShortVersionString",
      animateInfo,
    ]),
  };
  return Object.fromEntries(Object.entries(tools).map(([key, value]) => [
    key,
    typeof value === "string" ? value.split(/\n/u)[0] : value,
  ]));
}

function artifactReference(relativePath, publication) {
  return {
    path: portableRelativePath(relativePath, "baseline output artifact path"),
    bytes: publication.bytes,
    sha256: publication.sha256,
  };
}

function assertExecutableIdentityReference(value, expectedPath, label) {
  exactKeys(value, ["path", "realPath", "bytes", "sha256"], label);
  invariant(value.path === expectedPath
    && path.isAbsolute(value.path)
    && path.isAbsolute(value.realPath)
    && Number.isSafeInteger(value.bytes) && value.bytes > 0
    && SHA256_PATTERN.test(value.sha256),
  `${label} identity is invalid`);
}

export async function readImmutableArtifactBytesNoFollow(root, reference, label) {
  assertArtifactReference(reference, label);
  const trustedBefore = await snapshotTrustedContainedPath(root, reference.path, {label});
  const {absolutePath} = trustedBefore;
  const evidence = await inspectRegularFileNoFollow(absolutePath, {
    expectedBytes: reference.bytes,
    expectedSha256: reference.sha256,
    requireReadOnly: true,
    requireSingleLink: true,
  });
  const handle = await open(absolutePath, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const before = await handle.stat({bigint: true});
    invariant(String(before.dev) === evidence.node.dev
      && String(before.ino) === evidence.node.ino,
    `${label} identity changed before reading`);
    const contents = await handle.readFile();
    const after = await handle.stat({bigint: true});
    const finalAtPath = await lstat(absolutePath, {bigint: true});
    const trustedAfter = await snapshotTrustedContainedPath(root, reference.path, {label});
    assertTrustedPathSnapshotStable(trustedBefore, trustedAfter, label);
    invariant(String(after.dev) === evidence.node.dev
      && String(after.ino) === evidence.node.ino
      && String(finalAtPath.dev) === evidence.node.dev
      && String(finalAtPath.ino) === evidence.node.ino
      && after.size === before.size
      && after.mtimeNs === before.mtimeNs
      && contents.length === reference.bytes
      && sha256Bytes(contents) === reference.sha256,
    `${label} changed while reading`);
    return contents;
  } finally {
    await handle.close();
  }
}

async function readTrustedJsonArtifactNoFollow(root, relativePath, options, label) {
  const trustedBefore = await snapshotTrustedContainedPath(root, relativePath, {label});
  const file = await readJsonArtifactNoFollow(trustedBefore.absolutePath, options);
  const trustedAfter = await snapshotTrustedContainedPath(root, relativePath, {label});
  assertTrustedPathSnapshotStable(trustedBefore, trustedAfter, label);
  invariant(sameFileNode(trustedBefore.leafNode, file.evidence.node),
    `${label} opened an unexpected leaf identity`);
  return file;
}

export function validateImplementationBaselineReceiptValue(receipt) {
  exactKeys(receipt, TOP_LEVEL_KEYS, "Implementation baseline");
  invariant(receipt?.schemaVersion === BASELINE_SCHEMA
    && receipt?.artifactType === BASELINE_ARTIFACT_TYPE,
  "Implementation baseline schema or artifact type changed");
  exactKeys(receipt.timing, [
    "classification", "preCodeMutationArtifact", "preSourceOrCatalogPromotion", "caveat",
  ], "Implementation baseline timing");
  invariant(receipt.status === "frozen-implementation-final-pre-promotion-baseline"
    && receipt.timing?.classification === "implementation-final-pre-promotion"
    && receipt.timing?.preCodeMutationArtifact === false
    && receipt.timing?.preSourceOrCatalogPromotion === true
    && nonemptyString(receipt.timing?.caveat),
  "Implementation baseline timing/status boundary changed");
  exactKeys(receipt.checkout, ["projectRoot", "branch", "head"],
    "Implementation baseline checkout");
  invariant(path.isAbsolute(receipt.checkout?.projectRoot)
    && typeof receipt.checkout.branch === "string" && receipt.checkout.branch.length > 0
    && /^[a-f0-9]{40}$/u.test(receipt.checkout.head),
  "Implementation baseline checkout binding is invalid");
  invariant(validIsoTimestamp(receipt.capturedAt)
    && validIsoTimestamp(receipt.completedAt)
    && Date.parse(receipt.completedAt) >= Date.parse(receipt.capturedAt),
  "Implementation baseline timestamps are invalid");
  exactKeys(receipt.filesystem, ["before", "after"], "Implementation baseline filesystem");
  for (const phase of ["before", "after"]) {
    const snapshot = receipt.filesystem[phase];
    exactKeys(snapshot, ["volume", "freeSpace"],
      `Implementation baseline filesystem.${phase}`);
    exactKeys(snapshot.volume, [
      "deviceNode", "volumeName", "fileSystemPersonality", "bundleType",
      "containerFreeSpace",
    ], `Implementation baseline filesystem.${phase}.volume`);
    invariant(nonemptyString(snapshot.volume.deviceNode)
      && nonemptyString(snapshot.volume.volumeName)
      && snapshot.volume.fileSystemPersonality === "APFS"
      && snapshot.volume.bundleType === "apfs"
      && nonemptyString(snapshot.volume.containerFreeSpace),
    `Implementation baseline filesystem.${phase} lacks a complete APFS volume binding`);
    exactKeys(snapshot.freeSpace, [
      "filesystem", "blocks1024", "used1024", "available1024", "capacity", "mountedOn",
    ], `Implementation baseline filesystem.${phase}.freeSpace`);
    invariant(nonemptyString(snapshot.freeSpace.filesystem)
      && Number.isSafeInteger(snapshot.freeSpace.blocks1024)
      && snapshot.freeSpace.blocks1024 > 0
      && Number.isSafeInteger(snapshot.freeSpace.used1024)
      && snapshot.freeSpace.used1024 >= 0
      && Number.isSafeInteger(snapshot.freeSpace.available1024)
      && snapshot.freeSpace.available1024 > 0
      && snapshot.freeSpace.used1024 + snapshot.freeSpace.available1024
        <= snapshot.freeSpace.blocks1024
      && /^\d{1,3}%$/u.test(snapshot.freeSpace.capacity)
      && Number(snapshot.freeSpace.capacity.slice(0, -1)) <= 100
      && path.isAbsolute(snapshot.freeSpace.mountedOn),
    `Implementation baseline filesystem.${phase}.freeSpace is invalid`);
  }
  invariant(receipt.filesystem.before.volume.deviceNode
      === receipt.filesystem.after.volume.deviceNode
    && receipt.filesystem.before.volume.volumeName
      === receipt.filesystem.after.volume.volumeName
    && receipt.filesystem.before.freeSpace.filesystem
      === receipt.filesystem.after.freeSpace.filesystem
    && receipt.filesystem.before.freeSpace.mountedOn
      === receipt.filesystem.after.freeSpace.mountedOn,
  "Implementation baseline filesystem identity drifted while commands ran");
  exactKeys(receipt.tools, TOOL_KEYS, "Implementation baseline tools");
  assertExecutableIdentityReference(
    receipt.tools.nodeExecutable,
    BASELINE_NODE_EXECUTABLE_PATH,
    "Implementation baseline Node executable",
  );
  assertExecutableIdentityReference(
    receipt.tools.npmCli,
    BASELINE_NPM_CLI_PATH,
    "Implementation baseline npm CLI",
  );
  assertExecutableIdentityReference(
    receipt.tools.gitExecutable,
    BASELINE_GIT_EXECUTABLE_PATH,
    "Implementation baseline Git executable",
  );
  exactKeys(receipt.tools.commandEnvironment, ["PATH", "LANG", "LC_ALL", "TMPDIR"],
    "Implementation baseline command environment");
  invariant(receipt.tools.commandEnvironment.PATH === TRUSTED_COMMAND_PATH
    && receipt.tools.commandEnvironment.LANG === "C"
    && receipt.tools.commandEnvironment.LC_ALL === "C"
    && path.isAbsolute(receipt.tools.commandEnvironment.TMPDIR),
  "Implementation baseline command environment contract is invalid");
  exactKeys(receipt.tools.npmProjectConfiguration, ["path", "status"],
    "Implementation baseline project npm configuration");
  invariant(receipt.tools.npmProjectConfiguration.path === ".npmrc"
    && receipt.tools.npmProjectConfiguration.status === "absent",
  "Implementation baseline project npm configuration contract changed");
  for (const [key, value] of Object.entries(receipt.tools)) {
    if ([
      "nodeExecutable", "npmCli", "gitExecutable", "commandEnvironment",
      "npmProjectConfiguration",
    ].includes(key)) continue;
    invariant(CORE_TOOL_KEYS.has(key)
      ? nonemptyString(value)
      : value === null || nonemptyString(value),
    `Implementation baseline tool ${key} is invalid`);
  }
  invariant(/^v\d+/u.test(receipt.tools.node)
    && /^\d+(?:\.\d+)+/u.test(receipt.tools.npm)
    && /^git version /u.test(receipt.tools.git)
    && path.isAbsolute(receipt.tools.clangPath)
    && path.isAbsolute(receipt.tools.macosSdkPath),
  "Implementation baseline core tool identities are malformed");
  exactKeys(receipt.scopedOwnership, [
    "definition", "mandatoryPaths", "capturedPromotionArtifacts",
    "postBaselineExclusions", "stable", "before", "after",
  ], "Implementation baseline scoped ownership");
  invariant(receipt.scopedOwnership.definition === BASELINE_SCOPE_DEFINITION
    && isDeepStrictEqual(receipt.scopedOwnership.mandatoryPaths,
      BASELINE_MANDATORY_SCOPE_PATHS)
    && isDeepStrictEqual(receipt.scopedOwnership.postBaselineExclusions,
      BASELINE_POST_CAPTURE_EXCLUSIONS),
  "Implementation baseline scope definition changed");
  const capturedPromotionArtifacts = receipt.scopedOwnership.capturedPromotionArtifacts;
  invariant(Array.isArray(capturedPromotionArtifacts)
    && isDeepStrictEqual(capturedPromotionArtifacts,
      [...capturedPromotionArtifacts].sort(compareText))
    && new Set(capturedPromotionArtifacts).size === capturedPromotionArtifacts.length,
  "Implementation baseline captured successor artifacts are not unique and sorted");
  for (const [index, relativePath] of capturedPromotionArtifacts.entries()) {
    portableRelativePath(relativePath,
      `Implementation baseline capturedPromotionArtifacts[${index}]`);
    invariant(relativePath.startsWith(`${SUCCESSOR_ARTIFACT_DIRECTORY}/${SUCCESSOR_ARTIFACT_PREFIX}`)
      && !POST_BASELINE_EXACT_EXCLUSIONS.includes(relativePath)
      && !PREPARED_ARTIFACT_BASENAME_PATTERN.test(path.basename(relativePath)),
    `Implementation baseline captured successor artifact is not in the immutable pre-baseline class: ${relativePath}`);
  }
  const expectedScopePaths = [...new Set([
    ...BASELINE_MANDATORY_SCOPE_PATHS,
    ...capturedPromotionArtifacts,
  ])].sort(compareText);
  invariant(receipt.scopedOwnership?.stable === true
    && receipt.scopedOwnership.before.identitySha256
      === receipt.scopedOwnership.after.identitySha256
    && receipt.scopedOwnership.before.git.identitySha256
      === receipt.scopedOwnership.after.git.identitySha256,
  "Implementation baseline scoped ownership drifted while commands ran");
  for (const [phase, snapshot] of Object.entries({
    before: receipt.scopedOwnership.before,
    after: receipt.scopedOwnership.after,
  })) {
    exactKeys(snapshot, ["records", "identitySha256", "git"],
      `Implementation baseline ${phase} scope`);
    invariant(Array.isArray(snapshot.records)
      && snapshot.records.length === expectedScopePaths.length,
      `Implementation baseline ${phase} scope is incomplete`);
    invariant(isDeepStrictEqual(
      snapshot.records.map(({path: relativePath}) => relativePath),
      expectedScopePaths,
    ), `Implementation baseline ${phase} scope path set differs from the mandatory/captured definition`);
    for (const [index, record] of snapshot.records.entries()) {
      exactKeys(record, [
        "path", "bytes", "sha256", "dev", "ino", "mode", "nlink", "mtimeNs",
      ], `Implementation baseline ${phase} record[${index}]`);
      portableRelativePath(record.path,
        `Implementation baseline ${phase} record[${index}].path`);
      invariant(Number.isSafeInteger(record.bytes) && record.bytes >= 0
        && SHA256_PATTERN.test(record.sha256)
        && /^\d+$/u.test(record.dev) && /^\d+$/u.test(record.ino)
        && Number.isSafeInteger(record.mode) && record.mode >= 0 && record.mode <= 0o7777
        && Number.isSafeInteger(record.nlink)
        && record.nlink >= 1 && /^\d+$/u.test(record.mtimeNs),
      `Implementation baseline ${phase} record[${index}] is invalid`);
      if (capturedPromotionArtifacts.includes(record.path)) {
        invariant(record.mode === 0o444 && record.nlink === 1,
          `Implementation baseline captured immutable successor artifact is not 0444/single-link: ${record.path}`);
      }
    }
    invariant(snapshot.identitySha256 === scopedRecordsDigest(snapshot.records),
      `Implementation baseline ${phase} scope digest is not self-consistent`);
    exactKeys(snapshot.git, ["status", "staged", "worktree", "untracked", "identitySha256"],
      `Implementation baseline ${phase} Git ownership`);
    invariant([snapshot.git.status, snapshot.git.staged, snapshot.git.worktree,
      snapshot.git.untracked].every((value) => typeof value === "string"),
    `Implementation baseline ${phase} Git ownership payload is invalid`);
    const gitPayload = {
      status: snapshot.git.status,
      staged: snapshot.git.staged,
      worktree: snapshot.git.worktree,
      untracked: snapshot.git.untracked,
    };
    invariant(snapshot.git.identitySha256
      === sha256Bytes(Buffer.from(canonicalJson(gitPayload), "utf8")),
    `Implementation baseline ${phase} Git ownership digest is not self-consistent`);
  }
  invariant(JSON.stringify(receipt.scopedOwnership.before)
    === JSON.stringify(receipt.scopedOwnership.after),
  "Implementation baseline before/after scoped evidence differs");
  invariant(Array.isArray(receipt.commands)
    && receipt.commands.length === BASELINE_COMMANDS.length,
  "Implementation baseline command set is incomplete");
  let previousCompletedAt = Date.parse(receipt.capturedAt);
  let attemptRoot = null;
  for (const [index, expected] of BASELINE_COMMANDS.entries()) {
    const observed = receipt.commands[index];
    exactKeys(observed, [
      "id", "commandText", "actualExecutable", "arguments", "gateClass",
      "startedAt", "completedAt", "exitCode", "signal", "timedOut", "stdout",
      "stderr", "summary",
    ], `Implementation baseline command[${index}]`);
    invariant(observed.id === expected.id
      && observed.commandText === expected.commandText
      && observed.actualExecutable === expected.executable
      && isDeepStrictEqual(observed.arguments, expected.args)
      && observed.gateClass === expected.gateClass,
    `Implementation baseline command[${index}] contract changed`);
    invariant(validIsoTimestamp(observed.startedAt)
      && validIsoTimestamp(observed.completedAt)
      && Date.parse(observed.startedAt) >= previousCompletedAt
      && Date.parse(observed.completedAt) >= Date.parse(observed.startedAt)
      && Date.parse(observed.completedAt) <= Date.parse(receipt.completedAt),
    `Implementation baseline command[${index}] timestamps are invalid or out of order`);
    previousCompletedAt = Date.parse(observed.completedAt);
    invariant(Number.isInteger(observed.exitCode) && observed.exitCode >= 0
      && observed.signal === null && observed.timedOut === false,
    `Implementation baseline command[${index}] did not reach an ordinary exit`);
    for (const [streamName, stream] of Object.entries({
      stdout: observed.stdout,
      stderr: observed.stderr,
    })) {
      assertArtifactReference(stream,
        `Implementation baseline command[${index}].${streamName}`);
      const observedAttemptRoot = path.posix.dirname(stream.path);
      attemptRoot ??= observedAttemptRoot;
      invariant(observedAttemptRoot === attemptRoot
        && new RegExp(`^${BASELINE_ATTEMPTS_RELATIVE_ROOT}/[0-9]{8}T[0-9]{9}Z-[a-f0-9]{12}$`, "u")
          .test(observedAttemptRoot),
      `Implementation baseline command[${index}] output is outside the unique attempt root`);
      const expectedPath = `${attemptRoot}/${String(index + 1).padStart(2, "0")}-${expected.id}.${streamName}.log`;
      invariant(stream.path === expectedPath,
        `Implementation baseline command[${index}] ${streamName} path changed`);
    }
    assertCommandSummary(observed.summary,
      `Implementation baseline command[${index}].summary`);
    if (expected.gateClass === "required-targeted") {
      invariant(observed.exitCode === 0,
        `Required targeted baseline command failed: ${expected.id}`);
    }
  }
  exactKeys(receipt.summary, [
    "requiredTargetedGatesPassed", "separatelyReportedRepositoryCommands",
    "sourceOrCatalogMutationPerformed", "failedAttemptLogsRetention",
  ], "Implementation baseline summary");
  const expectedSeparateResults = receipt.commands
    .filter((command) => command.gateClass === "separately-reported-repository")
    .map(({id, exitCode, summary}) => ({id, exitCode, summary}));
  invariant(receipt.summary?.requiredTargetedGatesPassed === true
    && isDeepStrictEqual(receipt.summary.separatelyReportedRepositoryCommands,
      expectedSeparateResults)
    && receipt.summary?.sourceOrCatalogMutationPerformed === false
    && receipt.summary?.failedAttemptLogsRetention
      === "retained; this builder never deletes baseline attempts",
  "Implementation baseline expands its verification/reporting boundary");
  exactKeys(receipt.reportingGate, [
    "canonicalCountsReportable", "promotionAuthorized", "statement",
  ], "Implementation baseline reporting gate");
  invariant(receipt.reportingGate.canonicalCountsReportable === false
    && receipt.reportingGate.promotionAuthorized === false
    && nonemptyString(receipt.reportingGate.statement),
  "Implementation baseline reporting gate changed");
  exactKeys(receipt.evidenceBoundary, [
    "sourceCustodyOnly", "pairReviewCompleted", "javascriptImplementation",
    "originalRuntimeFidelity", "audioAcceptance", "humanVisualApproval",
    "ownerAcceptance", "strictCompletion", "lessonRelease", "publication",
  ], "Implementation baseline evidence boundary");
  invariant(receipt.evidenceBoundary.sourceCustodyOnly === true
    && Object.entries(receipt.evidenceBoundary)
      .filter(([key]) => key !== "sourceCustodyOnly")
      .every(([, value]) => value === false),
  "Implementation baseline evidence boundary expanded");
  invariant(Array.isArray(receipt.evidenceArtifacts)
    && receipt.evidenceArtifacts.length === BASELINE_COMMANDS.length * 2,
  "Implementation baseline output-artifact closure is incomplete");
  const commandArtifacts = receipt.commands.flatMap((command) => [
    command.stdout,
    command.stderr,
  ]);
  invariant(JSON.stringify(commandArtifacts) === JSON.stringify(receipt.evidenceArtifacts),
    "Implementation baseline command/output-artifact closure changed");
  invariant(new Set(receipt.evidenceArtifacts.map(({path: relativePath}) => relativePath)).size
    === receipt.evidenceArtifacts.length,
  "Implementation baseline output-artifact paths are not unique");
  return receipt;
}

function baselineCapturedArtifactSetSha256(paths) {
  return sha256Bytes(Buffer.from(canonicalJson(paths), "utf8"));
}

export function validateBaselineCompletionValue(value) {
  exactKeys(value, [
    "schemaVersion", "artifactType", "status", "completedAt", "receipt",
    "capturedPromotionArtifactsSha256",
  ], "Implementation baseline completion marker");
  invariant(value.schemaVersion
      === "help-math-fla-swf-counterpart-successor-implementation-baseline-completion/v1"
    && value.artifactType
      === "help-math-fla-swf-counterpart-successor-implementation-baseline-completion"
    && value.status === "baseline-post-publication-scan-complete"
    && validIsoTimestamp(value.completedAt)
    && SHA256_PATTERN.test(value.capturedPromotionArtifactsSha256),
  "Implementation baseline completion marker is invalid");
  assertArtifactReference(value.receipt, "Implementation baseline completion receipt");
  invariant(value.receipt.path === BASELINE_RECEIPT_RELATIVE_PATH,
    "Implementation baseline completion marker points to a different receipt");
  return value;
}

async function verifyImplementationBaselineReceiptCurrent({
  root = PROJECT_ROOT,
  reference = null,
} = {}) {
  const file = await readTrustedJsonArtifactNoFollow(
    root,
    BASELINE_RECEIPT_RELATIVE_PATH,
    {
      requireReadOnly: true,
      requireSingleLink: true,
      ...(reference ? {
        expectedBytes: reference.bytes,
        expectedSha256: reference.sha256,
      } : {}),
    },
    "implementation baseline receipt",
  );
  validateImplementationBaselineReceiptValue(file.value);
  invariant(!reference || reference.path === BASELINE_RECEIPT_RELATIVE_PATH,
    "Implementation baseline reference path changed");
  const checkout = await checkoutEvidence(root);
  invariant(JSON.stringify(checkout) === JSON.stringify(file.value.checkout),
    "Implementation baseline checkout/branch/HEAD is no longer current");
  const [currentFilesystem, currentTools, trustedScopePaths] = await Promise.all([
    filesystemEvidence(root),
    toolEvidence(root),
    baselineScopePaths(root, {
      allowedPostBaselineExactPaths: POST_BASELINE_EXACT_EXCLUSIONS,
      allowPreparedArtifacts: true,
    }),
  ]);
  invariant(isDeepStrictEqual(currentTools, file.value.tools),
    "Implementation baseline tool identities are no longer current");
  invariant(currentFilesystem.volume.deviceNode
      === file.value.filesystem.after.volume.deviceNode
    && currentFilesystem.volume.volumeName
      === file.value.filesystem.after.volume.volumeName
    && currentFilesystem.volume.fileSystemPersonality === "APFS"
    && currentFilesystem.volume.bundleType === "apfs"
    && currentFilesystem.freeSpace.filesystem
      === file.value.filesystem.after.freeSpace.filesystem
    && currentFilesystem.freeSpace.mountedOn
      === file.value.filesystem.after.freeSpace.mountedOn
    && currentFilesystem.freeSpace.available1024 > 0,
  "Implementation baseline APFS volume or free-space identity is no longer current");
  const receiptScopePaths = file.value.scopedOwnership.after.records
    .map(({path: relativePath}) => relativePath);
  assertTrustedBaselineScopePathsCurrent(receiptScopePaths, trustedScopePaths);
  const currentScope = await captureScopedOwnershipSnapshot(root, {
    paths: trustedScopePaths,
  });
  invariant(currentScope.identitySha256 === file.value.scopedOwnership.after.identitySha256
    && currentScope.git.identitySha256
      === file.value.scopedOwnership.after.git.identitySha256,
  "Implementation baseline scoped files or Git ownership are no longer current");
  for (const [index, command] of file.value.commands.entries()) {
    const [stdout, stderr] = await Promise.all([
      readImmutableArtifactBytesNoFollow(
        root,
        command.stdout,
        `Implementation baseline command[${index}] stdout log`,
      ),
      readImmutableArtifactBytesNoFollow(
        root,
        command.stderr,
        `Implementation baseline command[${index}] stderr log`,
      ),
    ]);
    assertCommandSummaryMatchesPhysicalLogs(
      command.summary,
      stdout,
      stderr,
      `Implementation baseline command[${index}]`,
    );
  }
  return {
    value: file.value,
    identity: {
      path: BASELINE_RECEIPT_RELATIVE_PATH,
      bytes: file.evidence.bytes,
      sha256: file.evidence.sha256,
    },
  };
}

export async function verifyImplementationBaselineCurrent({
  root = PROJECT_ROOT,
  reference = null,
} = {}) {
  const completionFile = await readTrustedJsonArtifactNoFollow(
    root,
    BASELINE_COMPLETION_RELATIVE_PATH,
    {requireReadOnly: true, requireSingleLink: true},
    "implementation baseline completion marker",
  );
  validateBaselineCompletionValue(completionFile.value);
  invariant(!reference || isDeepStrictEqual(reference, completionFile.value.receipt),
    "Implementation baseline reference differs from its completion marker");
  const baseline = await verifyImplementationBaselineReceiptCurrent({
    root,
    reference: completionFile.value.receipt,
  });
  invariant(Date.parse(completionFile.value.completedAt)
      >= Date.parse(baseline.value.completedAt),
  "Implementation baseline completion predates its receipt");
  invariant(completionFile.value.capturedPromotionArtifactsSha256
      === baselineCapturedArtifactSetSha256(
        baseline.value.scopedOwnership.capturedPromotionArtifacts,
      ),
  "Implementation baseline completion marker captured-set binding changed");
  return {
    ...baseline,
    completionIdentity: {
      path: BASELINE_COMPLETION_RELATIVE_PATH,
      bytes: completionFile.evidence.bytes,
      sha256: completionFile.evidence.sha256,
    },
  };
}

async function readAndReconcileBaselineReceipt(root, {allowCompletion = false} = {}) {
  const receiptFile = await readTrustedJsonArtifactNoFollow(
    root,
    BASELINE_RECEIPT_RELATIVE_PATH,
    {requireReadOnly: true},
    "interrupted implementation baseline receipt",
  );
  validateImplementationBaselineReceiptValue(receiptFile.value);
  invariant(receiptFile.text === canonicalJson(receiptFile.value),
    "Interrupted implementation baseline receipt is not canonical JSON");
  invariant([1, 2].includes(receiptFile.evidence.nlink),
    "Interrupted implementation baseline receipt has an invalid link count");
  const captured = await successorArtifactPaths(root, {
    allowedPostBaselineExactPaths: [
      BASELINE_RECEIPT_RELATIVE_PATH,
      ...(allowCompletion ? [BASELINE_COMPLETION_RELATIVE_PATH] : []),
    ],
  });
  invariant(isDeepStrictEqual(
    captured,
    receiptFile.value.scopedOwnership.capturedPromotionArtifacts,
  ), "Interrupted baseline receipt does not bind the current pre-completion artifact set");
  if (receiptFile.evidence.nlink === 2) {
    await publishImmutableBytesNoClobber(
      path.join(root, BASELINE_RECEIPT_RELATIVE_PATH),
      Buffer.from(receiptFile.text, "utf8"),
      {label: "interrupted implementation baseline receipt"},
    );
  }
  return verifyImplementationBaselineReceiptCurrent({
    root,
    reference: {
      path: BASELINE_RECEIPT_RELATIVE_PATH,
      bytes: receiptFile.evidence.bytes,
      sha256: receiptFile.evidence.sha256,
    },
  });
}

async function publishOrReconcileBaselineCompletion(root, baseline, now) {
  const completionPath = path.join(root, BASELINE_COMPLETION_RELATIVE_PATH);
  const completionKind = await pathKind(completionPath);
  invariant(["missing", "file"].includes(completionKind),
    `Implementation baseline completion path is unsafe: ${completionKind}`);
  let completionValue;
  let completionBytes;
  if (completionKind === "file") {
    const completionFile = await readTrustedJsonArtifactNoFollow(
      root,
      BASELINE_COMPLETION_RELATIVE_PATH,
      {requireReadOnly: true},
      "interrupted implementation baseline completion marker",
    );
    validateBaselineCompletionValue(completionFile.value);
    invariant(completionFile.text === canonicalJson(completionFile.value)
      && [1, 2].includes(completionFile.evidence.nlink),
    "Interrupted implementation baseline completion marker is not canonical and recoverable");
    completionValue = completionFile.value;
    completionBytes = Buffer.from(completionFile.text, "utf8");
  } else {
    completionValue = {
      schemaVersion:
        "help-math-fla-swf-counterpart-successor-implementation-baseline-completion/v1",
      artifactType:
        "help-math-fla-swf-counterpart-successor-implementation-baseline-completion",
      status: "baseline-post-publication-scan-complete",
      completedAt: now().toISOString(),
      receipt: {...baseline.identity},
      capturedPromotionArtifactsSha256:
        baselineCapturedArtifactSetSha256(
          baseline.value.scopedOwnership.capturedPromotionArtifacts,
        ),
    };
    completionBytes = Buffer.from(canonicalJson(completionValue), "utf8");
  }
  invariant(isDeepStrictEqual(completionValue.receipt, baseline.identity)
    && Date.parse(completionValue.completedAt) >= Date.parse(baseline.value.completedAt)
    && completionValue.capturedPromotionArtifactsSha256
      === baselineCapturedArtifactSetSha256(
        baseline.value.scopedOwnership.capturedPromotionArtifacts,
      ),
  "Interrupted implementation baseline completion marker binding drift");
  const capturedBeforeCompletion = await successorArtifactPaths(root, {
    allowedPostBaselineExactPaths: [
      BASELINE_RECEIPT_RELATIVE_PATH,
      ...(completionKind === "file" ? [BASELINE_COMPLETION_RELATIVE_PATH] : []),
    ],
  });
  invariant(isDeepStrictEqual(
    capturedBeforeCompletion,
    baseline.value.scopedOwnership.capturedPromotionArtifacts,
  ), "A forbidden successor artifact exists before baseline completion");
  await publishImmutableBytesNoClobber(completionPath, completionBytes, {
    label: "implementation baseline completion marker",
  });
  return verifyImplementationBaselineCurrent({root, reference: baseline.identity});
}

async function resumeInterruptedImplementationBaseline(root, now) {
  const receiptKind = await pathKind(path.join(root, BASELINE_RECEIPT_RELATIVE_PATH));
  const completionKind = await pathKind(path.join(root, BASELINE_COMPLETION_RELATIVE_PATH));
  invariant(receiptKind === "file",
    "A baseline completion marker cannot be resumed without its receipt");
  invariant(["missing", "file"].includes(completionKind),
    `Implementation baseline completion path is unsafe: ${completionKind}`);
  if (completionKind === "file") {
    try {
      const verified = await verifyImplementationBaselineCurrent({root});
      return {
        status: "implementation-final-pre-promotion-baseline-already-frozen",
        receipt: verified.identity,
        completion: verified.completionIdentity,
        requiredTargetedGatesPassed: true,
        repositoryCommandResults:
          verified.value.summary.separatelyReportedRepositoryCommands,
        canonicalCountsReportable: false,
      };
    } catch (error) {
      if (!/single-link|single-link file|Expected a single-link/u.test(
        String(error?.message ?? error),
      )) throw error;
    }
  }
  const baseline = await readAndReconcileBaselineReceipt(root, {
    allowCompletion: completionKind === "file",
  });
  const verified = await publishOrReconcileBaselineCompletion(root, baseline, now);
  return {
    status: "implementation-final-pre-promotion-baseline-resumed-and-frozen",
    receipt: verified.identity,
    completion: verified.completionIdentity,
    requiredTargetedGatesPassed: true,
    repositoryCommandResults:
      verified.value.summary.separatelyReportedRepositoryCommands,
    canonicalCountsReportable: false,
  };
}

export async function captureImplementationBaseline(options = {}) {
  invariant(options && typeof options === "object" && !Array.isArray(options),
    "Implementation baseline capture options must be an object");
  const unsupported = Object.keys(options).filter((key) => key !== "root");
  invariant(unsupported.length === 0,
    `Implementation baseline capture options are unsupported: ${unsupported.join(", ")}`);
  const root = options.root ?? PROJECT_ROOT;
  const now = () => new Date();
  const [receiptKind, completionKind] = await Promise.all([
    pathKind(path.join(root, BASELINE_RECEIPT_RELATIVE_PATH)),
    pathKind(path.join(root, BASELINE_COMPLETION_RELATIVE_PATH)),
  ]);
  invariant(["missing", "file"].includes(receiptKind)
    && ["missing", "file"].includes(completionKind),
  "Implementation baseline receipt/completion path is unsafe");
  if (receiptKind !== "missing" || completionKind !== "missing") {
    return resumeInterruptedImplementationBaseline(root, now);
  }
  const startedAt = now().toISOString();
  const attemptId = baselineAttemptIdentifier(startedAt);
  const attemptRoot = `${BASELINE_ATTEMPTS_RELATIVE_ROOT}/${attemptId}`;
  await ensureSafeDirectory(path.join(root, attemptRoot));
  const [checkout, filesystemBefore, tools, scopedBefore] = await Promise.all([
    checkoutEvidence(root),
    filesystemEvidence(root),
    toolEvidence(root),
    captureScopedOwnershipSnapshot(root),
  ]);
  const capturedPromotionArtifacts = (await successorArtifactPaths(root));
  const expectedCapturedScope = [...new Set([
    ...BASELINE_MANDATORY_SCOPE_PATHS,
    ...capturedPromotionArtifacts,
  ])].sort(compareText);
  invariant(isDeepStrictEqual(
    scopedBefore.records.map(({path: relativePath}) => relativePath),
    expectedCapturedScope,
  ), "Initial scoped snapshot differs from the trusted baseline scope derivation");
  const commands = [];
  const evidenceArtifacts = [];
  for (const [index, specification] of BASELINE_COMMANDS.entries()) {
    const observed = await runCapturedCommand(specification, {cwd: root});
    const prefix = `${String(index + 1).padStart(2, "0")}-${specification.id}`;
    const stdoutPath = `${attemptRoot}/${prefix}.stdout.log`;
    const stderrPath = `${attemptRoot}/${prefix}.stderr.log`;
    const [stdoutPublication, stderrPublication] = await Promise.all([
      publishImmutableBytesNoClobber(path.join(root, stdoutPath), observed.stdout, {
        label: `${specification.id} stdout baseline log`,
      }),
      publishImmutableBytesNoClobber(path.join(root, stderrPath), observed.stderr, {
        label: `${specification.id} stderr baseline log`,
      }),
    ]);
    const stdoutReference = artifactReference(stdoutPath, stdoutPublication);
    const stderrReference = artifactReference(stderrPath, stderrPublication);
    evidenceArtifacts.push(stdoutReference, stderrReference);
    commands.push({
      id: specification.id,
      commandText: specification.commandText,
      actualExecutable: specification.executable,
      arguments: [...specification.args],
      gateClass: specification.gateClass,
      startedAt: observed.startedAt,
      completedAt: observed.completedAt,
      exitCode: observed.exitCode,
      signal: observed.signal,
      timedOut: observed.timedOut,
      stdout: stdoutReference,
      stderr: stderrReference,
      summary: commandOutputSummary(observed.stdout, observed.stderr),
    });
  }
  const [filesystemAfter, scopedAfter] = await Promise.all([
    filesystemEvidence(root),
    captureScopedOwnershipSnapshot(root),
  ]);
  const stable = scopedBefore.identitySha256 === scopedAfter.identitySha256
    && scopedBefore.git.identitySha256 === scopedAfter.git.identitySha256;
  invariant(stable,
    `Scoped successor/source/catalog baseline drifted during command execution; failed-attempt logs retained at ${attemptRoot}`);
  const capturedAfterCommands = await successorArtifactPaths(root);
  invariant(isDeepStrictEqual(capturedAfterCommands, capturedPromotionArtifacts),
    `Successor artifact membership drifted after baseline commands; failed-attempt logs retained at ${attemptRoot}`);
  const requiredTargetedGatesPassed = commands
    .filter((command) => command.gateClass === "required-targeted")
    .every((command) => command.exitCode === 0 && command.signal === null
      && command.timedOut === false);
  invariant(requiredTargetedGatesPassed,
    `A required targeted baseline gate failed; failed-attempt logs retained at ${attemptRoot}`);
  const receipt = {
    schemaVersion: BASELINE_SCHEMA,
    artifactType: BASELINE_ARTIFACT_TYPE,
    status: "frozen-implementation-final-pre-promotion-baseline",
    capturedAt: startedAt,
    completedAt: now().toISOString(),
    timing: {
      classification: "implementation-final-pre-promotion",
      preCodeMutationArtifact: false,
      preSourceOrCatalogPromotion: true,
      caveat:
        "This unified receipt was materialized after successor implementation edits; it is the final implementation/current-state baseline before any source/catalog promotion, not a retroactively backdated pre-code receipt.",
    },
    checkout,
    filesystem: {before: filesystemBefore, after: filesystemAfter},
    tools,
    scopedOwnership: {
      definition: BASELINE_SCOPE_DEFINITION,
      mandatoryPaths: [...BASELINE_MANDATORY_SCOPE_PATHS],
      capturedPromotionArtifacts,
      postBaselineExclusions: [...BASELINE_POST_CAPTURE_EXCLUSIONS],
      stable,
      before: scopedBefore,
      after: scopedAfter,
    },
    commands,
    evidenceArtifacts,
    summary: {
      requiredTargetedGatesPassed,
      separatelyReportedRepositoryCommands: commands
        .filter((command) => command.gateClass === "separately-reported-repository")
        .map(({id, exitCode, summary}) => ({id, exitCode, summary})),
      sourceOrCatalogMutationPerformed: false,
      failedAttemptLogsRetention: "retained; this builder never deletes baseline attempts",
    },
    reportingGate: {
      canonicalCountsReportable: false,
      promotionAuthorized: false,
      statement:
        "This baseline records verification state only and cannot authorize pair review, source copy, directory swap, acceptance, release, publication, or new canonical pairing figures.",
    },
    evidenceBoundary: {
      sourceCustodyOnly: true,
      pairReviewCompleted: false,
      javascriptImplementation: false,
      originalRuntimeFidelity: false,
      audioAcceptance: false,
      humanVisualApproval: false,
      ownerAcceptance: false,
      strictCompletion: false,
      lessonRelease: false,
      publication: false,
    },
  };
  validateImplementationBaselineReceiptValue(receipt);
  const contents = Buffer.from(canonicalJson(receipt), "utf8");
  const capturedImmediatelyBeforePublication = await successorArtifactPaths(root);
  invariant(isDeepStrictEqual(
    capturedImmediatelyBeforePublication,
    capturedPromotionArtifacts,
  ), `Successor artifact membership drifted before baseline publication; failed-attempt logs retained at ${attemptRoot}`);
  const publication = await publishImmutableBytesNoClobber(
    path.join(root, BASELINE_RECEIPT_RELATIVE_PATH),
    contents,
    {label: "implementation-final pre-promotion baseline receipt"},
  );
  const capturedImmediatelyAfterPublication = await successorArtifactPaths(root, {
    allowedPostBaselineExactPaths: [BASELINE_RECEIPT_RELATIVE_PATH],
  });
  invariant(isDeepStrictEqual(
    capturedImmediatelyAfterPublication,
    capturedPromotionArtifacts,
  ), "A forbidden successor artifact appeared while the baseline receipt was published");
  const completionBytes = Buffer.from(canonicalJson({
    schemaVersion:
      "help-math-fla-swf-counterpart-successor-implementation-baseline-completion/v1",
    artifactType:
      "help-math-fla-swf-counterpart-successor-implementation-baseline-completion",
    status: "baseline-post-publication-scan-complete",
    completedAt: now().toISOString(),
    receipt: {
      path: BASELINE_RECEIPT_RELATIVE_PATH,
      bytes: publication.bytes,
      sha256: publication.sha256,
    },
    capturedPromotionArtifactsSha256:
      baselineCapturedArtifactSetSha256(capturedPromotionArtifacts),
  }), "utf8");
  const completionPublication = await publishImmutableBytesNoClobber(
    path.join(root, BASELINE_COMPLETION_RELATIVE_PATH),
    completionBytes,
    {label: "implementation baseline completion marker"},
  );
  const verified = await verifyImplementationBaselineCurrent({
    root,
    reference: {
      path: BASELINE_RECEIPT_RELATIVE_PATH,
      bytes: publication.bytes,
      sha256: publication.sha256,
    },
  });
  return {
    status: "implementation-final-pre-promotion-baseline-frozen",
    receipt: verified.identity,
    completion: {
      path: BASELINE_COMPLETION_RELATIVE_PATH,
      bytes: completionPublication.bytes,
      sha256: completionPublication.sha256,
    },
    requiredTargetedGatesPassed,
    repositoryCommandResults: receipt.summary.separatelyReportedRepositoryCommands,
    canonicalCountsReportable: false,
  };
}

function usage() {
  return `Usage:
  node scripts/build-fla-swf-counterpart-successor-baseline.mjs --capture
  node scripts/build-fla-swf-counterpart-successor-baseline.mjs --check`;
}

export async function main(argv = process.argv.slice(2)) {
  invariant(argv.length === 1 && ["--capture", "--check"].includes(argv[0]), usage());
  const result = argv[0] === "--capture"
    ? await captureImplementationBaseline()
    : await verifyImplementationBaselineCurrent();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
