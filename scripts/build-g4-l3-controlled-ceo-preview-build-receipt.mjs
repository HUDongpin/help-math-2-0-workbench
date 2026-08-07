#!/usr/bin/env node

import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {lstat, mkdir, open, readFile, readdir, realpath} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const GENERATOR_PATH = "scripts/build-g4-l3-controlled-ceo-preview-build-receipt.mjs";
const REPORT_PATH = "reports/g4-l3-controlled-ceo-preview-build-receipt.json";
const BUILD_ID_PATH = "apps/web/.next/BUILD_ID";
const REPORT_TYPE = "g4-l3-controlled-ceo-preview-production-build-receipt";
const REPORT_STATUS = "pass-production-build";
const SHA256 = /^[a-f0-9]{64}$/u;

const COMMAND = Object.freeze({
  executable: "npm",
  arguments: Object.freeze(["run", "build", "--workspace", "@helpmath/web"]),
  cwd: ".",
});

const FIXED_INPUT_FILES = Object.freeze([
  "apps/web/next-env.d.ts",
  "apps/web/next.config.ts",
  "apps/web/package.json",
  "apps/web/postcss.config.mjs",
  "apps/web/proxy.ts",
  "apps/web/tsconfig.json",
  "catalog/animations.json",
  "catalog/completion-ledger.json",
  "catalog/lesson-release-ledger.json",
  "catalog/lesson-releases.json",
  "package-lock.json",
  "package.json",
  "packages/demos/package.json",
  "packages/demos/prototype-registry.json",
]);

const SOURCE_TREES = Object.freeze([
  "apps/web/app",
  "apps/web/components",
  "apps/web/content",
  "apps/web/i18n",
  "apps/web/lib",
  "apps/web/public",
  "packages/demos/src",
]);

const AUTHORITY_KEYS = Object.freeze([
  "authorizesFlashCapture",
  "authorizesOriginalRuntimeExecution",
  "authorizesPublicDeployment",
  "changesStrictCompletion",
  "provesFlashFidelity",
  "provesHumanAudioVisualReview",
  "provesOriginalRuntimeFullFrameComparison",
  "provesOwnerAcceptance",
  "provesPublicRelease",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function fingerprint(value) {
  return sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sameValue(left, right) {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

function modeString(mode) {
  return (mode & 0o777).toString(8).padStart(4, "0");
}

function assertSafeRelativePath(relativePath, label = "project path") {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0,
    `${label} must be a non-empty string`,
  );
  invariant(!path.isAbsolute(relativePath), `${label} must be relative: ${relativePath}`);
  invariant(!relativePath.includes("\\"), `${label} must use portable separators: ${relativePath}`);
  invariant(
    relativePath === path.posix.normalize(relativePath)
      && relativePath !== "."
      && !relativePath.startsWith("../"),
    `${label} is not canonical or escapes the project root: ${relativePath}`,
  );
  invariant(
    relativePath.split("/").every((part) => part && part !== "." && part !== ".."),
    `${label} contains an unsafe path component: ${relativePath}`,
  );
}

function projectPath(root, relativePath) {
  assertSafeRelativePath(relativePath);
  const resolved = path.resolve(root, ...relativePath.split("/"));
  const relative = path.relative(root, resolved);
  invariant(
    relative && relative !== ".." && !relative.startsWith(`..${path.sep}`),
    `project path escapes the project root: ${relativePath}`,
  );
  return resolved;
}

async function assertRootDirectory(root) {
  const metadata = await lstat(root);
  invariant(metadata.isDirectory() && !metadata.isSymbolicLink(), "project root must be a non-symlink directory");
}

async function assertNoSymlinkComponents(root, relativePath, {
  finalKind = "file",
  finalMayBeMissing = false,
} = {}) {
  assertSafeRelativePath(relativePath);
  await assertRootDirectory(root);
  const parts = relativePath.split("/");
  let current = root;
  for (let index = 0; index < parts.length; index += 1) {
    current = path.join(current, parts[index]);
    let metadata;
    try {
      metadata = await lstat(current);
    } catch (error) {
      if (finalMayBeMissing && index === parts.length - 1 && error?.code === "ENOENT") return;
      throw error;
    }
    invariant(!metadata.isSymbolicLink(), `${relativePath} contains a symbolic-link path component`);
    if (index < parts.length - 1) {
      invariant(metadata.isDirectory(), `${relativePath} has a non-directory parent component`);
    } else if (finalKind === "file") {
      invariant(metadata.isFile(), `${relativePath} must be a regular file`);
    } else if (finalKind === "directory") {
      invariant(metadata.isDirectory(), `${relativePath} must be a directory`);
    }
  }
}

async function assertRealPathWithinRoot(root, absolutePath, label) {
  const [rootRealPath, fileRealPath] = await Promise.all([realpath(root), realpath(absolutePath)]);
  const relative = path.relative(rootRealPath, fileRealPath);
  invariant(
    relative && relative !== ".." && !relative.startsWith(`..${path.sep}`),
    `${label} resolves outside the project root`,
  );
}

async function bindFile(root, relativePath) {
  await assertNoSymlinkComponents(root, relativePath, {finalKind: "file"});
  const absolutePath = projectPath(root, relativePath);
  const metadata = await lstat(absolutePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${relativePath} must be a regular non-symlink file`);
  invariant(metadata.nlink === 1, `${relativePath} must have exactly one hard link`);
  await assertRealPathWithinRoot(root, absolutePath, relativePath);
  const bytes = await readFile(absolutePath);
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

async function listTreeFiles(root, relativeDirectory) {
  await assertNoSymlinkComponents(root, relativeDirectory, {finalKind: "directory"});
  const output = [];

  async function visit(relativePath) {
    const absolutePath = projectPath(root, relativePath);
    const entries = await readdir(absolutePath, {withFileTypes: true});
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      invariant(entry.name !== "." && entry.name !== "..", `${relativePath} contains an unsafe directory entry`);
      const child = `${relativePath}/${entry.name}`;
      invariant(!entry.isSymbolicLink(), `${child} must not be a symbolic link`);
      if (entry.isDirectory()) await visit(child);
      else {
        invariant(entry.isFile(), `${child} must be a regular file or directory`);
        output.push(child);
      }
    }
  }

  await visit(relativeDirectory);
  return output;
}

async function expectedInputPaths(root) {
  const fixedFiles = [...FIXED_INPUT_FILES].sort();
  const sourceTrees = [];
  for (const treePath of SOURCE_TREES) {
    const files = await listTreeFiles(root, treePath);
    invariant(files.length > 0, `${treePath} must contain at least one source file`);
    sourceTrees.push({path: treePath, files});
  }
  const flattened = [
    ...fixedFiles,
    ...sourceTrees.flatMap(({files}) => files),
  ];
  invariant(new Set(flattened).size === flattened.length, "build input path set contains duplicates");
  return {fixedFiles, sourceTrees};
}

async function bindInputSnapshot(root) {
  const paths = await expectedInputPaths(root);
  const fixedFiles = await Promise.all(paths.fixedFiles.map((relativePath) => bindFile(root, relativePath)));
  const sourceTrees = [];
  for (const tree of paths.sourceTrees) {
    const files = await Promise.all(tree.files.map((relativePath) => bindFile(root, relativePath)));
    sourceTrees.push({
      path: tree.path,
      fileCount: files.length,
      files,
      setFingerprintSha256: fingerprint(files),
    });
  }
  const allBindings = [
    ...fixedFiles,
    ...sourceTrees.flatMap(({files}) => files),
  ];
  return {
    bindingPolicy: "exact-sha256-and-bytes-regular-non-symlink-single-hard-link-files",
    fixedFiles,
    sourceTrees,
    totalFiles: allBindings.length,
    setFingerprintSha256: fingerprint(allBindings),
  };
}

function outputBinding(value) {
  const bytes = Buffer.isBuffer(value)
    ? value
    : value == null
      ? Buffer.alloc(0)
      : Buffer.from(String(value), "utf8");
  return {
    bytes: bytes.length,
    sha256: sha256(bytes),
    contentWithheld: true,
  };
}

function sanitizedBuildFailure(result) {
  const stdout = outputBinding(result?.stdout);
  const stderr = outputBinding(result?.stderr);
  const exitCode = Number.isInteger(result?.status) ? result.status : null;
  const signal = typeof result?.signal === "string" ? result.signal : null;
  const launchCode = typeof result?.error?.code === "string" ? result.error.code : null;
  return `production build failed (exit=${exitCode ?? "null"}, signal=${signal ?? "null"}, launchCode=${launchCode ?? "none"}, stdout=${stdout.bytes}B/${stdout.sha256}, stderr=${stderr.bytes}B/${stderr.sha256}); build output text is withheld`;
}

function runProductionBuild(root) {
  const environment = {...process.env};
  environment.G4_L3_CEO_PREVIEW_ENABLED = "1";
  environment.NODE_ENV = "production";
  delete environment.VERCEL_ENV;
  const startedAt = new Date().toISOString();
  const startedMs = Date.now();
  const result = spawnSync(COMMAND.executable, [...COMMAND.arguments], {
    cwd: root,
    env: environment,
    encoding: null,
    maxBuffer: 128 * 1024 * 1024,
    windowsHide: true,
  });
  const completedAt = new Date().toISOString();
  invariant(!result.error && result.status === 0, sanitizedBuildFailure(result));
  return {
    executable: COMMAND.executable,
    arguments: [...COMMAND.arguments],
    cwd: COMMAND.cwd,
    status: "pass",
    exitCode: 0,
    signal: result.signal ?? null,
    startedAt,
    completedAt,
    durationMs: Math.max(0, Date.now() - startedMs),
    environment: {
      overrides: {
        G4_L3_CEO_PREVIEW_ENABLED: "1",
        NODE_ENV: "production",
      },
      removedVariables: ["VERCEL_ENV"],
      inheritedEnvironmentWithheld: true,
    },
    stdout: outputBinding(result.stdout),
    stderr: outputBinding(result.stderr),
  };
}

async function bindBuildId(root) {
  const binding = await bindFile(root, BUILD_ID_PATH);
  const raw = await readFile(projectPath(root, BUILD_ID_PATH), "utf8");
  const value = raw.trim();
  invariant(
    /^[A-Za-z0-9_-]{8,256}$/u.test(value),
    `${BUILD_ID_PATH} is empty or malformed`,
  );
  return {...binding, value};
}

function makeAuthorityBoundary() {
  return Object.fromEntries(AUTHORITY_KEYS.map((key) => [key, false]));
}

function validateLogBinding(value, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label} binding is missing`);
  invariant(Number.isSafeInteger(value.bytes) && value.bytes >= 0, `${label}.bytes is invalid`);
  invariant(SHA256.test(value.sha256), `${label}.sha256 is invalid`);
  invariant(value.contentWithheld === true, `${label} text must remain withheld`);
  invariant(
    Object.keys(value).sort().join(",") === "bytes,contentWithheld,sha256",
    `${label} exposes an unexpected field`,
  );
}

function validateFileBindingShape(value, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label} binding is missing`);
  assertSafeRelativePath(value.path, `${label}.path`);
  invariant(Number.isSafeInteger(value.bytes) && value.bytes >= 0, `${label}.bytes is invalid`);
  invariant(SHA256.test(value.sha256), `${label}.sha256 is invalid`);
}

function validateInputShape(inputs) {
  invariant(
    inputs?.bindingPolicy === "exact-sha256-and-bytes-regular-non-symlink-single-hard-link-files",
    "build input binding policy drifted",
  );
  invariant(Array.isArray(inputs.fixedFiles) && inputs.fixedFiles.length === FIXED_INPUT_FILES.length, "fixed input bindings are incomplete");
  invariant(Array.isArray(inputs.sourceTrees) && inputs.sourceTrees.length === SOURCE_TREES.length, "source-tree bindings are incomplete");
  inputs.fixedFiles.forEach((binding, index) => validateFileBindingShape(binding, `inputs.fixedFiles[${index}]`));
  for (let treeIndex = 0; treeIndex < inputs.sourceTrees.length; treeIndex += 1) {
    const tree = inputs.sourceTrees[treeIndex];
    invariant(tree && typeof tree === "object" && !Array.isArray(tree), `inputs.sourceTrees[${treeIndex}] is invalid`);
    invariant(tree.path === SOURCE_TREES[treeIndex], `${tree.path ?? "source tree"} is out of order or unexpected`);
    invariant(Array.isArray(tree.files) && tree.files.length > 0, `${tree.path} file bindings are missing`);
    invariant(tree.fileCount === tree.files.length, `${tree.path} file count drifted`);
    tree.files.forEach((binding, fileIndex) => validateFileBindingShape(binding, `${tree.path}.files[${fileIndex}]`));
    invariant(tree.setFingerprintSha256 === fingerprint(tree.files), `${tree.path} set fingerprint is stale`);
  }
  const allBindings = [
    ...inputs.fixedFiles,
    ...inputs.sourceTrees.flatMap(({files}) => files),
  ];
  invariant(inputs.totalFiles === allBindings.length, "total bound input count is stale");
  invariant(inputs.setFingerprintSha256 === fingerprint(allBindings), "build input-set fingerprint is stale");
  invariant(
    new Set(allBindings.map(({path: relativePath}) => relativePath)).size === allBindings.length,
    "build input bindings contain duplicate paths",
  );
}

export function validateReceiptShape(report) {
  invariant(report && typeof report === "object" && !Array.isArray(report), "build receipt must be a JSON object");
  invariant(report.schemaVersion === 1, "build receipt schemaVersion must be 1");
  invariant(report.reportType === REPORT_TYPE, "build receipt reportType drifted");
  invariant(report.status === REPORT_STATUS, "build receipt did not record a passing production build");
  invariant(
    typeof report.generatedAt === "string"
      && !Number.isNaN(Date.parse(report.generatedAt))
      && new Date(report.generatedAt).toISOString() === report.generatedAt,
    "build receipt generatedAt is not a canonical ISO timestamp",
  );

  validateFileBindingShape(report.generator, "generator");
  invariant(report.generator.path === GENERATOR_PATH, "generator path drifted");
  invariant(report.generator.stableDuringBuild === true, "generator was not stable during the production build");

  const command = report.command;
  invariant(command?.executable === COMMAND.executable, "build executable drifted");
  invariant(sameValue(command.arguments, [...COMMAND.arguments]), "build arguments drifted");
  invariant(command.cwd === COMMAND.cwd, "build cwd drifted");
  invariant(command.status === "pass" && command.exitCode === 0 && command.signal === null, "production build did not exit cleanly");
  invariant(
    typeof command.startedAt === "string"
      && typeof command.completedAt === "string"
      && !Number.isNaN(Date.parse(command.startedAt))
      && !Number.isNaN(Date.parse(command.completedAt))
      && Date.parse(command.completedAt) >= Date.parse(command.startedAt),
    "build command timestamps are invalid",
  );
  invariant(Number.isSafeInteger(command.durationMs) && command.durationMs >= 0, "build duration is invalid");
  invariant(
    sameValue(command.environment, {
      overrides: {
        G4_L3_CEO_PREVIEW_ENABLED: "1",
        NODE_ENV: "production",
      },
      removedVariables: ["VERCEL_ENV"],
      inheritedEnvironmentWithheld: true,
    }),
    "controlled preview build environment record drifted",
  );
  validateLogBinding(command.stdout, "command.stdout");
  validateLogBinding(command.stderr, "command.stderr");

  validateFileBindingShape(report.build?.buildId, "build.buildId");
  invariant(report.build.workspace === "@helpmath/web", "build workspace drifted");
  invariant(report.build.buildId.path === BUILD_ID_PATH, "BUILD_ID path drifted");
  invariant(
    typeof report.build.buildId.value === "string"
      && /^[A-Za-z0-9_-]{8,256}$/u.test(report.build.buildId.value),
    "recorded BUILD_ID is malformed",
  );

  validateInputShape(report.inputs);
  invariant(
    report.summary?.productionBuildPassed === true
      && report.summary?.boundInputFiles === report.inputs.totalFiles
      && report.summary?.buildIdSha256 === report.build.buildId.sha256
      && report.summary?.stdoutBytes === report.command.stdout.bytes
      && report.summary?.stderrBytes === report.command.stderr.bytes,
    "build receipt summary drifted",
  );

  invariant(
    report.authority
      && typeof report.authority === "object"
      && !Array.isArray(report.authority)
      && Object.keys(report.authority).sort().join(",") === [...AUTHORITY_KEYS].sort().join(",")
      && AUTHORITY_KEYS.every((key) => report.authority[key] === false),
    "build receipt authority must contain only the exact all-false authority boundary",
  );
  invariant(
    report.authorityStatement
      === "This receipt proves only that the exact local controlled-preview production build command exited zero against the bound files. It authorizes no Flash capture, original-runtime execution, remote or public deployment, acceptance, strict completion, or release.",
    "build receipt authority statement drifted",
  );
  invariant(SHA256.test(report.reportFingerprintSha256), "build receipt fingerprint is malformed");
  const {reportFingerprintSha256, ...projected} = report;
  invariant(reportFingerprintSha256 === fingerprint(projected), "build receipt fingerprint is stale");
  return report;
}

async function assertReportPathMissing(root) {
  const absolutePath = projectPath(root, REPORT_PATH);
  try {
    await lstat(absolutePath);
    throw new Error(`${REPORT_PATH} already exists; immutable no-replace build receipt was not written`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

async function writeImmutableReceipt(root, report) {
  const absolutePath = projectPath(root, REPORT_PATH);
  const parentRelative = path.posix.dirname(REPORT_PATH);
  await mkdir(projectPath(root, parentRelative), {recursive: true});
  await assertNoSymlinkComponents(root, parentRelative, {finalKind: "directory"});
  await assertReportPathMissing(root);

  const handle = await open(absolutePath, "wx", 0o444);
  try {
    await handle.writeFile(pretty(report), "utf8");
    await handle.chmod(0o444);
    await handle.sync();
  } finally {
    await handle.close();
  }

  await assertNoSymlinkComponents(root, REPORT_PATH, {finalKind: "file"});
  const metadata = await lstat(absolutePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${REPORT_PATH} must be a regular non-symlink file`);
  invariant(metadata.nlink === 1, `${REPORT_PATH} must have exactly one hard link`);
  invariant((metadata.mode & 0o777) === 0o444, `${REPORT_PATH} mode must be exactly 0444`);
  await assertRealPathWithinRoot(root, absolutePath, REPORT_PATH);
}

async function readImmutableReceipt(root) {
  await assertNoSymlinkComponents(root, REPORT_PATH, {finalKind: "file"});
  const absolutePath = projectPath(root, REPORT_PATH);
  const metadata = await lstat(absolutePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${REPORT_PATH} must be a regular non-symlink file`);
  invariant(metadata.nlink === 1, `${REPORT_PATH} must have exactly one hard link`);
  invariant((metadata.mode & 0o777) === 0o444, `${REPORT_PATH} mode must be exactly 0444, not ${modeString(metadata.mode)}`);
  await assertRealPathWithinRoot(root, absolutePath, REPORT_PATH);
  let report;
  try {
    report = JSON.parse(await readFile(absolutePath, "utf8"));
  } catch (error) {
    throw new Error(`${REPORT_PATH} is not valid JSON (${error.message})`);
  }
  return validateReceiptShape(report);
}

export async function buildReceipt({root = ROOT} = {}) {
  await assertRootDirectory(root);
  await assertReportPathMissing(root);
  const generatorBefore = await bindFile(root, GENERATOR_PATH);
  const inputsBefore = await bindInputSnapshot(root);
  const command = runProductionBuild(root);
  const [generatorAfter, inputsAfter, buildId] = await Promise.all([
    bindFile(root, generatorBefore.path),
    bindInputSnapshot(root),
    bindBuildId(root),
  ]);
  invariant(sameValue(generatorBefore, generatorAfter), "build receipt generator changed during the production build");
  invariant(sameValue(inputsBefore, inputsAfter), "one or more bound production-build inputs changed during the build");

  const base = {
    schemaVersion: 1,
    reportType: REPORT_TYPE,
    status: REPORT_STATUS,
    generatedAt: new Date().toISOString(),
    generator: {
      ...generatorAfter,
      stableDuringBuild: true,
    },
    command,
    build: {
      workspace: "@helpmath/web",
      buildId,
    },
    inputs: inputsAfter,
    summary: {
      productionBuildPassed: true,
      boundInputFiles: inputsAfter.totalFiles,
      buildIdSha256: buildId.sha256,
      stdoutBytes: command.stdout.bytes,
      stderrBytes: command.stderr.bytes,
    },
    authority: makeAuthorityBoundary(),
    authorityStatement: "This receipt proves only that the exact local controlled-preview production build command exited zero against the bound files. It authorizes no Flash capture, original-runtime execution, remote or public deployment, acceptance, strict completion, or release.",
  };
  const report = {
    ...base,
    reportFingerprintSha256: fingerprint(base),
  };
  validateReceiptShape(report);
  await writeImmutableReceipt(root, report);
  return report;
}

export async function checkReceipt({root = ROOT} = {}) {
  await assertRootDirectory(root);
  const report = await readImmutableReceipt(root);
  const [generator, inputs, buildId] = await Promise.all([
    bindFile(root, report.generator.path),
    bindInputSnapshot(root),
    bindBuildId(root),
  ]);
  invariant(
    sameValue(generator, {
      path: report.generator.path,
      bytes: report.generator.bytes,
      sha256: report.generator.sha256,
    }),
    "build receipt generator binding drifted",
  );
  invariant(sameValue(inputs, report.inputs), "bound production-build input files drifted");
  invariant(sameValue(buildId, report.build.buildId), "bound Next.js BUILD_ID drifted");
  return report;
}

export function parseArguments(argv) {
  invariant(
    Array.isArray(argv)
      && argv.length === 1
      && (argv[0] === "--build" || argv[0] === "--check"),
    "Exactly one explicit mode is required: --build or --check",
  );
  return argv[0] === "--build" ? {build: true, check: false} : {build: false, check: true};
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
  if (options) {
    const operation = options.build ? buildReceipt() : checkReceipt();
    operation.then((report) => {
      process.stdout.write(
        `PASS: ${report.status}; ${report.summary.boundInputFiles} inputs and ${report.build.buildId.path} are hash-bound; all authority remains false.\n`,
      );
    }).catch((error) => {
      console.error(error.stack || error.message);
      process.exitCode = 1;
    });
  }
}
