#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {gunzipSync} from "node:zlib";
import {fileURLToPath} from "node:url";

import {
  atomicPublishDirectoryNoReplace,
  assertRealDirectoryAncestors,
  ensureRealDirectoryPathFromNearestExistingAncestor,
} from "./lib/g5-l4-atomic-directory-publish.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SOURCE_ARCHIVE_RELATIVE = "source-assets/flash/HELP MATH_ORIGINAL FILES";
export const DEFAULT_G5_L4_HOST_TREE_ROOT = path.join(
  DEFAULT_PROJECT_ROOT,
  "work/original-runtime-host-trees/g5-l4-shell-rw002/root",
);
export const G5_L4_HOST_TREE_MANIFEST_NAME = "staging-manifest.json";
export const G5_L4_FORBIDDEN_RUNTIME_REQUESTS = Object.freeze([
  "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml",
  "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml",
]);

export const G5_L4_TRACE_SCOPED_RESOURCES = Object.freeze([
  Object.freeze({
    role: "lesson-shell",
    path: "HELP_COURSES/ELMGR5/L4/index_local.swf",
    bytes: 658851,
    sha256: "7865195a07666e8123bef33f52aea36e06b7e0a9987fbbea605bc92cbe9b0301",
  }),
  Object.freeze({
    role: "lesson-index-source-record",
    path: "HELP_COURSES/ELMGR5/L4/index.xml",
    bytes: 11841,
    sha256: "b6f1718da8f5e909cb96c883902009887eb965d41e41588318b4bfb36c8f7a36",
  }),
  Object.freeze({
    role: "natural-introduction-target",
    path: "HELP_COURSES/ELMGR5/L4/IR/L4RW01.swf",
    bytes: 167329,
    sha256: "14b8f7639027b324e9411c5d1e753432ed81c1fb3c23e211291c4b53f36c52dd",
  }),
  Object.freeze({
    role: "natural-next-rw002-target",
    path: "HELP_COURSES/ELMGR5/L4/RW/L4RW02.swf",
    bytes: 495690,
    sha256: "eaea3b8e3efe6ec9e095bb09980476577686d09c94b29439dfb07015c7abb81c",
  }),
  Object.freeze({
    role: "rw002-spanish-audio-candidate",
    path: "HELP_COURSES/ELMGR5/L4/SA/L4RW02.mp3",
    bytes: 243936,
    sha256: "b5e7f4cc6d36842db58edc63d96681c8eab31ccd3e109384b8194368809157de",
  }),
  Object.freeze({
    role: "canonical-elementary-keyterms-english",
    path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml",
    bytes: 378783,
    sha256: "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749",
  }),
  Object.freeze({
    role: "canonical-elementary-keyterms-spanish",
    path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml",
    bytes: 374466,
    sha256: "7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00",
  }),
]);

const SHELL_SCRIPT_AUDIT_RELATIVE =
  "migrations/shell-course-g05-l04-index-local/audit/machine/ffdec-scripts.txt.gz";
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;

function invariant(condition, message) {
  if (!condition) throw new Error(`G5 L4 host-tree successor: ${message}`);
}

function assertExactKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  invariant(
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort()),
    `${label} keys drifted`,
  );
}

export function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isContained(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function assertNoSymlinkComponents(root, relativePath, label) {
  invariant(!path.isAbsolute(relativePath) && portable(path.normalize(relativePath)) === relativePath,
    `${label} must be a normalized relative path`);
  let cursor = root;
  const rootInfo = await lstat(root);
  invariant(rootInfo.isDirectory() && !rootInfo.isSymbolicLink(), `${label} root must be a real directory`);
  for (const component of relativePath.split("/")) {
    cursor = path.join(cursor, component);
    const info = await lstat(cursor);
    invariant(!info.isSymbolicLink(), `${label} contains a symbolic-link component: ${relativePath}`);
  }
  const [rootReal, targetReal] = await Promise.all([realpath(root), realpath(cursor)]);
  invariant(isContained(rootReal, targetReal), `${label} resolves outside its declared root`);
  return cursor;
}

async function bindRegularFile(root, relativePath, label, {requiredMode = null} = {}) {
  const absolutePath = await assertNoSymlinkComponents(root, relativePath, label);
  const before = await lstat(absolutePath);
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${label} must be one ordinary non-linked file`);
  if (requiredMode !== null) {
    invariant((before.mode & 0o777) === requiredMode, `${label} mode must be ${requiredMode.toString(8)}`);
  }
  const bytes = await readFile(absolutePath);
  const after = await lstat(absolutePath);
  invariant(after.isFile() && after.dev === before.dev && after.ino === before.ino
    && after.size === bytes.length && after.mtimeMs === before.mtimeMs,
  `${label} changed while it was read`);
  return {
    absolutePath,
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256Bytes(bytes),
    mode: (after.mode & 0o777).toString(8).padStart(4, "0"),
    contents: bytes,
  };
}

function countLiteral(value, literal) {
  let count = 0;
  let offset = 0;
  while ((offset = value.indexOf(literal, offset)) !== -1) {
    count += 1;
    offset += literal.length;
  }
  return count;
}

function fileSetSha256(files) {
  return sha256Bytes(Buffer.from(files.map((file) =>
    `${file.path}\t${file.bytes}\t${file.sha256}\t${file.mode}`,
  ).join("\n")));
}

export function validateG5L4HostTreeManifest(manifest) {
  assertExactKeys(manifest, [
    "schemaVersion", "manifestType", "releaseId", "shellAnimationId",
    "introductionAnimationId", "targetAnimationId", "status", "stagedRoot",
    "sourceArchiveRoot", "files", "fileSetSha256", "summary", "requestPolicy",
    "staticRequestEvidence", "sourceGapException", "runtimeSessionsExecuted",
    "launchesProjector", "launchesAnimate", "acceptanceEffects",
    "manifestFingerprintSha256",
  ], "manifest");
  invariant(manifest?.schemaVersion === 1
    && manifest.manifestType === "g5-l4-shell-rw002-trace-scoped-read-only-host-tree"
    && manifest.releaseId === "lesson-g05-l04-number-lines"
    && manifest.shellAnimationId === "shell-course-g05-l04-index-local"
    && manifest.introductionAnimationId === "course-g05-l04-ir-001-a662633d"
    && manifest.targetAnimationId === "course-g05-l04-rw-002"
    && manifest.status === "materialized-candidate-not-launched-not-authoritative",
  "manifest identity drifted");
  assertExactKeys(manifest.stagedRoot, [
    "path", "directoryMode", "fileMode", "regularCopiedFilesOnly", "symbolicLinks",
    "hardLinks",
  ], "manifest stagedRoot");
  invariant(manifest.stagedRoot?.directoryMode === "0555"
    && manifest.stagedRoot?.fileMode === "0444"
    && manifest.stagedRoot?.regularCopiedFilesOnly === true
    && manifest.stagedRoot?.symbolicLinks === 0
    && manifest.stagedRoot?.hardLinks === 0,
  "manifest read-only/no-link contract drifted");
  invariant(Array.isArray(manifest.files)
    && manifest.files.length === G5_L4_TRACE_SCOPED_RESOURCES.length,
  "manifest resource count drifted");
  for (const [index, expected] of G5_L4_TRACE_SCOPED_RESOURCES.entries()) {
    const actual = manifest.files[index];
    assertExactKeys(actual, ["role", "path", "bytes", "sha256", "mode"],
      `${expected.path}: manifest resource`);
    invariant(actual?.role === expected.role && actual.path === expected.path
      && actual.bytes === expected.bytes && actual.sha256 === expected.sha256
      && actual.mode === "0444",
    `${expected.path}: manifest resource binding drifted`);
  }
  assertExactKeys(manifest.summary, ["files", "bytes", "swf", "xml", "mp3"],
    "manifest summary");
  invariant(manifest.fileSetSha256 === fileSetSha256(manifest.files), "manifest file-set digest drifted");
  assertExactKeys(manifest.requestPolicy, [
    "mode", "allowedPaths", "forbiddenRequests", "abortOnForbiddenRequest",
    "abortOnUnallowlistedRequest", "renameOrSubstituteMissingLessonXml",
    "runtimeObserverContractRequiredBeforeRuntimeLaunch",
  ], "manifest request policy");
  invariant(manifest.requestPolicy?.mode === "exact-local-resource-allowlist-fail-closed"
    && JSON.stringify(manifest.requestPolicy.allowedPaths) ===
      JSON.stringify(G5_L4_TRACE_SCOPED_RESOURCES.map((item) => item.path))
    && JSON.stringify(manifest.requestPolicy.forbiddenRequests) ===
      JSON.stringify(G5_L4_FORBIDDEN_RUNTIME_REQUESTS)
    && manifest.requestPolicy.abortOnForbiddenRequest === true
    && manifest.requestPolicy.abortOnUnallowlistedRequest === true
    && manifest.requestPolicy.renameOrSubstituteMissingLessonXml === false,
  "manifest request policy drifted");
  assertExactKeys(manifest.staticRequestEvidence, [
    "shellScriptAudit", "missingLessonXmlLiteralCounts", "canonicalMasterLiteralCounts",
    "authority",
  ], "manifest static request evidence");
  assertExactKeys(manifest.staticRequestEvidence.shellScriptAudit, ["path", "bytes", "sha256"],
    "manifest shell script audit");
  assertExactKeys(manifest.staticRequestEvidence.missingLessonXmlLiteralCounts,
    ["L4KTE01", "L4KTS01"], "manifest missing lesson XML counts");
  assertExactKeys(manifest.staticRequestEvidence.canonicalMasterLiteralCounts,
    ["ELKTEG4", "ELKTSG4"], "manifest canonical master counts");
  invariant(manifest.staticRequestEvidence?.missingLessonXmlLiteralCounts?.L4KTE01 === 0
    && manifest.staticRequestEvidence?.missingLessonXmlLiteralCounts?.L4KTS01 === 0
    && manifest.staticRequestEvidence?.canonicalMasterLiteralCounts?.ELKTEG4 === 2
    && manifest.staticRequestEvidence?.canonicalMasterLiteralCounts?.ELKTSG4 === 1
    && SHA256_PATTERN.test(manifest.staticRequestEvidence?.shellScriptAudit?.sha256 || ""),
  "manifest static request evidence drifted");
  assertExactKeys(manifest.sourceGapException, [
    "exactMissingPaths", "exactLessonXmlStillMissing", "canonicalMastersStagedUnderOriginalNames",
    "canonicalMastersAreNotRenamedSubstitutes", "runtimeMustAbortIfMissingLessonXmlIsRequested",
    "strictSourceGapClosed",
  ], "manifest source-gap exception");
  invariant(manifest.sourceGapException?.exactLessonXmlStillMissing === true
    && manifest.sourceGapException?.canonicalMastersAreNotRenamedSubstitutes === true
    && manifest.sourceGapException?.strictSourceGapClosed === false,
  "manifest source-gap boundary drifted");
  assertExactKeys(manifest.acceptanceEffects, [
    "authoritativeOriginalRuntime", "audioAccepted", "humanVisualAccepted", "ownerAccepted",
    "strictComplete", "published",
  ], "manifest acceptance effects");
  invariant(Object.values(manifest.acceptanceEffects || {}).every((value) => value === false)
    && manifest.runtimeSessionsExecuted === 0
    && manifest.launchesProjector === false
    && manifest.launchesAnimate === false,
  "manifest improperly claims execution or acceptance");
  const {manifestFingerprintSha256, ...withoutFingerprint} = manifest;
  invariant(SHA256_PATTERN.test(manifestFingerprintSha256 || "")
    && manifestFingerprintSha256 === sha256Bytes(Buffer.from(stableJson(withoutFingerprint))),
  "manifest fingerprint drifted");
  return manifest;
}

export async function buildG5L4HostTreePlan({
  projectRoot: projectRootOption = DEFAULT_PROJECT_ROOT,
  outputRoot: outputRootOption = DEFAULT_G5_L4_HOST_TREE_ROOT,
} = {}) {
  const projectRoot = path.resolve(projectRootOption);
  const sourceRoot = path.join(projectRoot, SOURCE_ARCHIVE_RELATIVE);
  const outputRoot = path.resolve(outputRootOption);
  invariant(!isContained(sourceRoot, outputRoot), "output root may not be inside preserved sources");
  const resources = [];
  for (const expected of G5_L4_TRACE_SCOPED_RESOURCES) {
    const record = await bindRegularFile(sourceRoot, expected.path, expected.path);
    invariant(record.bytes === expected.bytes && record.sha256 === expected.sha256,
      `${expected.path}: preserved source bytes or hash drifted`);
    resources.push({...expected, absolutePath: record.absolutePath, mode: "0444"});
  }
  const audit = await bindRegularFile(projectRoot, SHELL_SCRIPT_AUDIT_RELATIVE, "shell FFDec ActionScript audit");
  const scripts = gunzipSync(audit.contents).toString("utf8");
  const literalCounts = {
    L4KTE01: countLiteral(scripts, "L4KTE01.xml"),
    L4KTS01: countLiteral(scripts, "L4KTS01.xml"),
    ELKTEG4: countLiteral(scripts, "ELKTEG4.xml"),
    ELKTSG4: countLiteral(scripts, "ELKTSG4.xml"),
  };
  invariant(literalCounts.L4KTE01 === 0 && literalCounts.L4KTS01 === 0
    && literalCounts.ELKTEG4 === 2 && literalCounts.ELKTSG4 === 1,
  "hash-bound shipped-shell ActionScript request literals drifted");
  const fileRows = resources.map(({role, path: resourcePath, bytes, sha256}) => ({
    role,
    path: resourcePath,
    bytes,
    sha256,
    mode: "0444",
  }));
  const base = {
    schemaVersion: 1,
    manifestType: "g5-l4-shell-rw002-trace-scoped-read-only-host-tree",
    releaseId: "lesson-g05-l04-number-lines",
    shellAnimationId: "shell-course-g05-l04-index-local",
    introductionAnimationId: "course-g05-l04-ir-001-a662633d",
    targetAnimationId: "course-g05-l04-rw-002",
    status: "materialized-candidate-not-launched-not-authoritative",
    stagedRoot: {
      path: portable(path.relative(projectRoot, outputRoot)),
      directoryMode: "0555",
      fileMode: "0444",
      regularCopiedFilesOnly: true,
      symbolicLinks: 0,
      hardLinks: 0,
    },
    sourceArchiveRoot: SOURCE_ARCHIVE_RELATIVE,
    files: fileRows,
    fileSetSha256: fileSetSha256(fileRows),
    summary: {
      files: fileRows.length,
      bytes: fileRows.reduce((sum, file) => sum + file.bytes, 0),
      swf: fileRows.filter((file) => file.path.endsWith(".swf")).length,
      xml: fileRows.filter((file) => file.path.endsWith(".xml")).length,
      mp3: fileRows.filter((file) => file.path.endsWith(".mp3")).length,
    },
    requestPolicy: {
      mode: "exact-local-resource-allowlist-fail-closed",
      allowedPaths: fileRows.map((file) => file.path),
      forbiddenRequests: [...G5_L4_FORBIDDEN_RUNTIME_REQUESTS],
      abortOnForbiddenRequest: true,
      abortOnUnallowlistedRequest: true,
      renameOrSubstituteMissingLessonXml: false,
      runtimeObserverContractRequiredBeforeRuntimeLaunch: true,
    },
    staticRequestEvidence: {
      shellScriptAudit: {
        path: SHELL_SCRIPT_AUDIT_RELATIVE,
        bytes: audit.bytes,
        sha256: audit.sha256,
      },
      missingLessonXmlLiteralCounts: {
        L4KTE01: literalCounts.L4KTE01,
        L4KTS01: literalCounts.L4KTS01,
      },
      canonicalMasterLiteralCounts: {
        ELKTEG4: literalCounts.ELKTEG4,
        ELKTSG4: literalCounts.ELKTSG4,
      },
      authority: "static-hash-bound-shell-actionscript-only-not-runtime-reachability",
    },
    sourceGapException: {
      exactMissingPaths: [...G5_L4_FORBIDDEN_RUNTIME_REQUESTS],
      exactLessonXmlStillMissing: true,
      canonicalMastersStagedUnderOriginalNames: [
        "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml",
        "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml",
      ],
      canonicalMastersAreNotRenamedSubstitutes: true,
      runtimeMustAbortIfMissingLessonXmlIsRequested: true,
      strictSourceGapClosed: false,
    },
    runtimeSessionsExecuted: 0,
    launchesProjector: false,
    launchesAnimate: false,
    acceptanceEffects: {
      authoritativeOriginalRuntime: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
  };
  const manifest = {
    ...base,
    manifestFingerprintSha256: sha256Bytes(Buffer.from(stableJson(base))),
  };
  validateG5L4HostTreeManifest(manifest);
  return {
    projectRoot,
    sourceRoot,
    outputRoot,
    resources,
    manifest,
    manifestBytes: Buffer.from(stableJson(manifest)),
  };
}

async function listTree(root) {
  const files = [];
  const directories = [];
  async function visit(directory, relative = "") {
    const info = await lstat(directory);
    invariant(info.isDirectory() && !info.isSymbolicLink(), `${relative || "."}: expected a real directory`);
    directories.push({absolutePath: directory, path: portable(relative), mode: info.mode & 0o777});
    const entries = await readdir(directory, {withFileTypes: true});
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, "en"))) {
      const child = path.join(directory, entry.name);
      const childRelative = portable(path.join(relative, entry.name));
      const childInfo = await lstat(child);
      invariant(!childInfo.isSymbolicLink(), `${childRelative}: symbolic links are forbidden`);
      if (childInfo.isDirectory()) await visit(child, childRelative);
      else {
        invariant(childInfo.isFile() && childInfo.nlink === 1, `${childRelative}: expected one ordinary file`);
        files.push({absolutePath: child, path: childRelative, mode: childInfo.mode & 0o777});
      }
    }
  }
  await visit(root);
  return {files, directories};
}

export async function verifyG5L4HostTree(plan) {
  await assertRealDirectoryAncestors(plan.outputRoot);
  const {files, directories} = await listTree(plan.outputRoot);
  invariant(directories.every((directory) => directory.mode === 0o555), "one or more host-tree directories are not 0555");
  const expectedPaths = [
    ...G5_L4_TRACE_SCOPED_RESOURCES.map((item) => item.path),
    G5_L4_HOST_TREE_MANIFEST_NAME,
  ].sort((left, right) => left.localeCompare(right, "en"));
  invariant(JSON.stringify(files.map((file) => file.path).sort((left, right) => left.localeCompare(right, "en")))
    === JSON.stringify(expectedPaths),
  "host tree contains a missing or unallowlisted file");
  invariant(files.every((file) => file.mode === 0o444), "one or more host-tree files are not 0444");
  for (const expected of G5_L4_TRACE_SCOPED_RESOURCES) {
    const actual = files.find((file) => file.path === expected.path);
    const bytes = await readFile(actual.absolutePath);
    invariant(bytes.length === expected.bytes && sha256Bytes(bytes) === expected.sha256,
      `${expected.path}: staged bytes drifted`);
  }
  const manifestBytes = await readFile(path.join(plan.outputRoot, G5_L4_HOST_TREE_MANIFEST_NAME));
  invariant(manifestBytes.equals(plan.manifestBytes), "staged manifest bytes are stale");
  validateG5L4HostTreeManifest(JSON.parse(manifestBytes));
  return {
    status: "verified-read-only-candidate-not-launched",
    manifestPath: path.join(plan.outputRoot, G5_L4_HOST_TREE_MANIFEST_NAME),
    manifestSha256: sha256Bytes(manifestBytes),
    fileSetSha256: plan.manifest.fileSetSha256,
    files: G5_L4_TRACE_SCOPED_RESOURCES.length,
    bytes: plan.manifest.summary.bytes,
    runtimeSessionsExecuted: 0,
    acceptanceEffect: "none",
  };
}

async function makeDirectoriesReadOnly(root) {
  const {directories} = await listTree(root);
  for (const directory of [...directories].sort((left, right) => right.absolutePath.length - left.absolutePath.length)) {
    await chmod(directory.absolutePath, 0o555);
  }
}

export async function materializeG5L4HostTree(options = {}) {
  const plan = await buildG5L4HostTreePlan(options);
  const existing = await lstat(plan.outputRoot).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (existing) {
    invariant(existing.isDirectory() && !existing.isSymbolicLink(), "existing output is not a real directory");
    return {...await verifyG5L4HostTree(plan), changed: 0};
  }
  invariant(options.check !== true, `host tree is missing: ${plan.outputRoot}`);
  const parent = path.dirname(plan.outputRoot);
  await ensureRealDirectoryPathFromNearestExistingAncestor(parent);
  const temporary = await mkdtemp(path.join(parent, ".g5-l4-shell-rw002-stage-"));
  try {
    for (const resource of plan.resources) {
      const destination = path.join(temporary, resource.path);
      await mkdir(path.dirname(destination), {recursive: true});
      await copyFile(resource.absolutePath, destination, fsConstants.COPYFILE_EXCL);
      await chmod(destination, 0o444);
    }
    await writeFile(path.join(temporary, G5_L4_HOST_TREE_MANIFEST_NAME), plan.manifestBytes, {
      flag: "wx",
      mode: 0o444,
    });
    await makeDirectoriesReadOnly(temporary);
    await verifyG5L4HostTree({...plan, outputRoot: temporary});
    await atomicPublishDirectoryNoReplace({
      temporaryPath: temporary,
      targetPath: plan.outputRoot,
      beforePublishHook: options.beforePublishHook,
    });
  } catch (error) {
    throw new Error(
      `${error.message}; staged directory was deliberately preserved because pathname-safe recursive cleanup is outside this transaction`,
      {cause: error},
    );
  }
  return {...await verifyG5L4HostTree(plan), changed: 1};
}

export function parseArguments(argv) {
  const options = {check: false};
  for (const value of argv) {
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write("Usage: node scripts/materialize-g5-l4-shell-rw002-read-only-host-tree.mjs [--check]\n");
    return;
  }
  const result = await materializeG5L4HostTree(options);
  process.stdout.write(`${stableJson(result)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
