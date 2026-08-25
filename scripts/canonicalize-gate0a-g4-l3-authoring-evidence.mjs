#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  open,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(scriptPath), "..");
const RECEIPT_PATH =
  "work/gate0a/g4-l3-authoring-evidence-canonicalization.v1.json";
const RECEIPT_TYPE =
  "gate0a-g4-l3-authoring-evidence-canonicalization-v1";
const SPEC_SUFFIX =
  "/audit/source-static-current-js-candidate-spec.json";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [
      key,
      canonical(value[key]),
    ]));
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonical(value));
}

function documentBytes(document) {
  return Buffer.from(`${JSON.stringify(canonical(document), null, 2)}\n`);
}

function safeProjectPath(root, relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0,
    `${label} path is required`);
  invariant(!path.isAbsolute(relativePath), `${label} path must be relative`);
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, relativePath);
  invariant(resolved.startsWith(`${resolvedRoot}${path.sep}`),
    `${label} path escapes its root`);
  return resolved;
}

async function stableOrdinaryFile(absolutePath, label) {
  const handle = await open(absolutePath, "r");
  try {
    const before = await handle.stat({bigint: true});
    invariant(before.isFile(), `${label} must be an ordinary file`);
    invariant(before.nlink === 1n, `${label} must have exactly one hard link`);
    const bytes = await handle.readFile();
    const after = await handle.stat({bigint: true});
    for (const field of ["dev", "ino", "size", "mtimeNs", "ctimeNs", "mode"]) {
      invariant(before[field] === after[field], `${label} changed while read`);
    }
    invariant(BigInt(bytes.length) === after.size, `${label} size changed`);
    return {
      bytes,
      identity: {
        bytes: bytes.length,
        sha256: sha256(bytes),
        mode: `0${Number(after.mode & 0o777n).toString(8)}`,
      },
    };
  } finally {
    await handle.close();
  }
}

async function listSourceStaticSpecs(projectRoot) {
  const migrationsRoot = path.join(projectRoot, "migrations");
  const entries = await import("node:fs/promises").then(({readdir}) =>
    readdir(migrationsRoot, {withFileTypes: true}));
  return entries
    .filter((entry) => entry.isDirectory() &&
      entry.name.startsWith("course-g04-l03-"))
    .map((entry) => `migrations/${entry.name}${SPEC_SUFFIX}`)
    .sort();
}

async function existingSpecPaths(projectRoot) {
  const candidates = await listSourceStaticSpecs(projectRoot);
  const result = [];
  for (const candidate of candidates) {
    try {
      const metadata = await lstat(safeProjectPath(
        projectRoot,
        candidate,
        "candidate specification",
      ));
      if (metadata.isFile() && !metadata.isSymbolicLink()) result.push(candidate);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return result;
}

async function loadPlanIdentity(projectRoot) {
  const relativePath = "work/adaptive-canvas-production-five.plan.v9.json";
  const file = await stableOrdinaryFile(
    safeProjectPath(projectRoot, relativePath, "v9 plan"),
    "v9 plan",
  );
  const document = JSON.parse(file.bytes);
  invariant(document?.payload?.runtimes?.length === 284,
    "v9 plan runtime denominator changed");
  return {path: relativePath, ...file.identity};
}

async function writeCreateExclusive(absolutePath, bytes) {
  await mkdir(path.dirname(absolutePath), {recursive: true});
  await writeFile(absolutePath, bytes, {flag: "wx", mode: 0o444});
  await chmod(absolutePath, 0o444);
}

export async function canonicalizeG4L3AuthoringEvidence({
  projectRoot = ROOT,
  sourceWorktreeRoot,
  check = false,
} = {}) {
  invariant(typeof sourceWorktreeRoot === "string" &&
    path.isAbsolute(sourceWorktreeRoot),
  "--source-worktree-root must be an explicit absolute path");
  const root = path.resolve(projectRoot);
  const sourceRoot = path.resolve(sourceWorktreeRoot);
  invariant(sourceRoot !== root,
    "source worktree root must differ from the isolated target worktree");
  const sourceRootReal = await realpath(sourceRoot);
  invariant(sourceRootReal === sourceRoot,
    "source worktree root may not be a symlink or path alias");
  const specPaths = await existingSpecPaths(root);
  invariant(specPaths.length === 32,
    `expected 32 G4 L3 source-static specs, observed ${specPaths.length}`);
  const records = [];
  let createdCount = 0;
  for (const specPath of specPaths) {
    const specFile = await stableOrdinaryFile(
      safeProjectPath(root, specPath, "candidate specification"),
      `${specPath} candidate specification`,
    );
    const spec = JSON.parse(specFile.bytes);
    const binding = spec?.evidence?.authoringAudit;
    if (!binding) continue;
    invariant(typeof binding.path === "string" &&
      binding.path.startsWith("work/animate/dependency-authoring-audits/") &&
      binding.path.endsWith(".fla-authoring-audit.json"),
    `${spec.animationId}: authoring evidence path is outside the allowlist`);
    invariant(Number.isSafeInteger(binding.bytes) && binding.bytes > 0 &&
      /^[a-f0-9]{64}$/u.test(binding.sha256),
    `${spec.animationId}: authoring evidence identity is invalid`);
    const sourcePath = safeProjectPath(
      sourceRoot,
      binding.path,
      `${spec.animationId} source evidence`,
    );
    const source = await stableOrdinaryFile(
      sourcePath,
      `${spec.animationId} source evidence`,
    );
    invariant(source.identity.bytes === binding.bytes &&
      source.identity.sha256 === binding.sha256,
    `${spec.animationId}: source authoring evidence differs from the spec`);
    const destinationPath = safeProjectPath(
      root,
      binding.path,
      `${spec.animationId} destination evidence`,
    );
    try {
      const destination = await stableOrdinaryFile(
        destinationPath,
        `${spec.animationId} destination evidence`,
      );
      invariant(destination.identity.bytes === binding.bytes &&
        destination.identity.sha256 === binding.sha256,
      `${spec.animationId}: existing destination evidence differs`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      invariant(!check,
        `${spec.animationId}: destination evidence is absent in --check mode`);
      await writeCreateExclusive(destinationPath, source.bytes);
      createdCount += 1;
    }
    const destination = await stableOrdinaryFile(
      destinationPath,
      `${spec.animationId} installed evidence`,
    );
    invariant(destination.identity.bytes === binding.bytes &&
      destination.identity.sha256 === binding.sha256,
    `${spec.animationId}: installed evidence differs from the spec`);
    records.push({
      animationId: spec.animationId,
      spec: {path: specPath, ...specFile.identity},
      binding: {path: binding.path, bytes: binding.bytes, sha256: binding.sha256},
      source: {root: sourceRoot, path: binding.path, ...source.identity},
      destination: {root, path: binding.path, ...destination.identity},
      installationContract: "create-exclusive-or-existing-identical",
    });
  }
  invariant(records.length === 23,
    `expected 23 authoring evidence records, observed ${records.length}`);
  const payload = {
    status: "pass",
    authority: "gate0a-supporting-evidence-canonicalization-only",
    boundary: {
      browserStarted: false,
      applyExecuted: false,
      productionRendererModified: false,
      v2ProfileModified: false,
      activeBindingModified: false,
      deploymentModified: false,
      applySentinelModified: false,
      acceptanceChanged: false,
    },
    v9Plan: await loadPlanIdentity(root),
    sourceWorktreeRoot: sourceRoot,
    sourceWorktreeRootReal: sourceRootReal,
    targetWorktreeRoot: root,
    specCount: specPaths.length,
    evidenceCount: records.length,
    records,
  };
  const document = {
    schemaVersion: 1,
    receiptType: RECEIPT_TYPE,
    payloadSha256: sha256(Buffer.from(canonicalJson(payload))),
    payload,
  };
  const bytes = documentBytes(document);
  const receipt = safeProjectPath(root, RECEIPT_PATH, "receipt");
  if (check) {
    const existing = await stableOrdinaryFile(receipt, "existing receipt");
    invariant(existing.bytes.equals(bytes), "existing receipt is stale");
  } else {
    await writeCreateExclusive(receipt, bytes);
  }
  return {
    receiptPath: RECEIPT_PATH,
    receiptBytes: bytes.length,
    receiptSha256: sha256(bytes),
    payloadSha256: document.payloadSha256,
    evidenceCount: records.length,
    createdCount,
    existingIdenticalCount: records.length - createdCount,
  };
}

function usage() {
  return [
    "Usage:",
    "  node scripts/canonicalize-gate0a-g4-l3-authoring-evidence.mjs \\",
    "    --source-worktree-root <absolute-path> [--check]",
    "",
    "This tool only installs/checks exact spec-pinned authoring-audit evidence.",
  ].join("\n");
}

function parseArguments(argv) {
  const options = {sourceWorktreeRoot: null, check: false};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--source-worktree-root") {
      const value = argv[index + 1];
      invariant(value && !value.startsWith("--"),
        "--source-worktree-root requires a value");
      options.sourceWorktreeRoot = value;
      index += 1;
    } else throw new Error(`unknown argument: ${argument}`);
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) process.stdout.write(`${usage()}\n`);
  else process.stdout.write(`${JSON.stringify(
    await canonicalizeG4L3AuthoringEvidence(options),
    null,
    2,
  )}\n`);
}
