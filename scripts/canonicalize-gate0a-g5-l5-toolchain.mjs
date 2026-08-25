#!/usr/bin/env node

/**
 * Canonicalize the exact G5 L5 Current-JS v1 generator inputs that currently
 * live in the historical, dirty factory worktree.  This is a Gate 0A evidence
 * operation only: it never writes a renderer, profile, active binding, or
 * deployment artifact.
 */

import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  stat,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const EXTERNAL_ROOT =
  "/Volumes/WestWorld/HELP MATH 2.0-g5-l5-ffdec-canvas-pcode-factory";
const RECEIPT_PATH = "work/gate0a/g5-l5-toolchain-canonicalization.v3.json";
const TOOLCHAIN_ROOT = "work/gate0a/g5-l5-canonical-toolchain-v3";
const SHA256 = /^[a-f0-9]{64}$/;

const INPUTS = Object.freeze([
  {
    source: "scripts/build-g5-l5-private-current-js.mjs",
    target: "scripts/build-g5-l5-private-current-js.mjs",
    evidenceTarget: `${TOOLCHAIN_ROOT}/build-g5-l5-private-current-js.original.mjs`,
    bytes: 31_402,
    sha256: "27305d8959441089dc89df288a4ceecc71734d48f6c073d9f3fb8e1b5ae0fd03",
    role: "canonical-v1-current-js-generator",
  },
  {
    source: "scripts/build-g5-l5-safe-canvas-successor.mjs",
    evidenceTarget: `${TOOLCHAIN_ROOT}/build-g5-l5-safe-canvas-successor.mjs`,
    bytes: 87_975,
    sha256: "ab562b72b9749888eb6d471f1cf9231fcbadc4fa4fd41407d283aba3bb627b28",
    role: "canonical-v1-root-transform-successor",
  },
  {
    source: "scripts/build-safe-ffdec-canvas-adapter.mjs",
    evidenceTarget: `${TOOLCHAIN_ROOT}/build-safe-ffdec-canvas-adapter.mjs`,
    bytes: 112_148,
    sha256: "04593402aa69ea4d8512aeda1c09d8909608d1f2f3299c960a3e63e6c2a23893",
    role: "canonical-v1-safe-ffdec-adapter",
  },
  {
    source: "scripts/build-g5-l5-ffdec-canvas-pcode-factory.mjs",
    evidenceTarget: `${TOOLCHAIN_ROOT}/build-g5-l5-ffdec-canvas-pcode-factory.original.mjs`,
    bytes: 30_639,
    sha256: "5c66404977f4ffc01871fcc7f607844d1e87203f8e06796b1eee9dfeab5ca78f",
    role: "historical-source-first-factory-generator",
  },
  {
    source: "tools/g5-l5-ffdec-canvas-pcode-factory/corpus.json",
    evidenceTarget: `${TOOLCHAIN_ROOT}/corpus.json`,
    bytes: 2_014,
    sha256: "fa80a891b841c5ec93306e1e27f321010d37201b8a1760b155c06c50940d68f6",
    role: "canonical-factory-corpus",
  },
  {
    source: "scripts/build-g5-l5-root-placement-audit.mjs",
    evidenceTarget: `${TOOLCHAIN_ROOT}/build-g5-l5-root-placement-audit.mjs`,
    bytes: 25_615,
    sha256: "78782f5acce2248834a96fd7abdc903deb54559d905bb2a3ce61adae05c76cc8",
    role: "source-bound-root-placement-generator",
  },
  {
    source: "scripts/build-g5-l5-root-placement-audit.test.mjs",
    evidenceTarget: `${TOOLCHAIN_ROOT}/build-g5-l5-root-placement-audit.test.mjs`,
    bytes: 3_453,
    sha256: "c393783289e1b52b1760187ce79e698636feb004a9fa4fdc33201d88eb37294f",
    role: "source-bound-root-placement-test",
  },
  {
    source: "scripts/build-g5-l5-safe-canvas-draft-queue.mjs",
    evidenceTarget: `${TOOLCHAIN_ROOT}/build-g5-l5-safe-canvas-draft-queue.mjs`,
    bytes: 17_076,
    sha256: "bded6520fff6e8c94e23c835da6cda4e990bc68d43bd38eb4562d422289a9dca",
    role: "source-bound-draft-queue-generator",
  },
  {
    source: "scripts/build-g5-l5-safe-canvas-draft-queue.test.mjs",
    evidenceTarget: `${TOOLCHAIN_ROOT}/build-g5-l5-safe-canvas-draft-queue.test.mjs`,
    bytes: 3_122,
    sha256: "2c5a422e927df18e33b8bca1b961a68f4873a7d5ad8e37e5f363154c9f6ef375",
    role: "source-bound-draft-queue-test",
  },
  {
    source: "scripts/build-g5-l5-avm1-behavior-allowlist-successor.mjs",
    evidenceTarget: `${TOOLCHAIN_ROOT}/build-g5-l5-avm1-behavior-allowlist-successor.mjs`,
    bytes: 21_565,
    sha256: "f584fb9568c5faa7ab1cd42f64587b63f363b92197f747f10e715188a0362db4",
    role: "source-bound-avm1-allowlist-generator",
  },
  {
    source: "scripts/build-g5-l5-avm1-behavior-allowlist-successor.test.mjs",
    evidenceTarget: `${TOOLCHAIN_ROOT}/build-g5-l5-avm1-behavior-allowlist-successor.test.mjs`,
    bytes: 3_874,
    sha256: "4719a9590bae65b5e9c5c96c100b7fe3054453ac7a107c5ef6fec195abdc7393",
    role: "source-bound-avm1-allowlist-test",
  },
  {
    source: "work/g5-l5-root-placement-audit/v1/run-manifest.json",
    target: "work/g5-l5-root-placement-audit/v1/run-manifest.json",
    bytes: 211_816,
    sha256: "bc22c42c091a65ee9e618c0c955731ae1b79d6cca4e61dc3102324204f021566",
    role: "canonical-root-placement-ir",
  },
  {
    source: "work/g5-l5-safe-canvas-draft-queue/v1/run-manifest.json",
    target: "work/g5-l5-safe-canvas-draft-queue/v1/run-manifest.json",
    bytes: 210_823,
    sha256: "948708720f46da9484fcbe686f19856cc54b21ca7aaa7e88ac51bee0c36b538f",
    role: "canonical-source-bound-draft-queue",
  },
  {
    source: "work/g5-l5-avm1-behavior-allowlist/v2/run-manifest.json",
    target: "work/g5-l5-avm1-behavior-allowlist/v2/run-manifest.json",
    bytes: 735_833,
    sha256: "ba16997993b90b4d33d76c6fd36d05877ded17bf996ad9f04e03b5e8b3bb69bc",
    role: "canonical-source-bound-avm1-allowlist",
  },
]);

function invariant(value, message) {
  if (!value) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

function canonicalBytes(value) {
  return Buffer.from(`${JSON.stringify(canonical(value))}\n`);
}

function resolveBelow(root, relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0,
    `${label}: non-empty relative path required`);
  invariant(!path.isAbsolute(relativePath), `${label}: absolute path forbidden`);
  const resolved = path.resolve(root, relativePath);
  invariant(resolved.startsWith(`${root}${path.sep}`), `${label}: path escapes root`);
  return resolved;
}

async function stableReadOrdinary(filePath, expected, label) {
  const before = await lstat(filePath);
  invariant(before.isFile() && !before.isSymbolicLink(), `${label}: ordinary file required`);
  const handle = await open(filePath, "r");
  try {
    const first = await handle.stat({bigint: true});
    const bytes = await handle.readFile();
    const second = await handle.stat({bigint: true});
    for (const key of ["dev", "ino", "size", "mtimeNs", "ctimeNs"]) {
      invariant(first[key] === second[key], `${label}: unstable read (${key})`);
    }
    const identity = {bytes: bytes.length, sha256: sha256(bytes)};
    invariant(identity.bytes === expected.bytes && identity.sha256 === expected.sha256,
      `${label}: frozen identity mismatch`);
    return {bytes, identity, physical: {
      dev: String(first.dev),
      ino: String(first.ino),
      size: String(first.size),
      mtimeNs: String(first.mtimeNs),
      ctimeNs: String(first.ctimeNs),
    }};
  } finally {
    await handle.close();
  }
}

async function installExact(relativePath, bytes, expected) {
  const target = resolveBelow(PROJECT_ROOT, relativePath, "target");
  await mkdir(path.dirname(target), {recursive: true});
  try {
    const handle = await open(target, "wx", 0o444);
    try {
      await handle.writeFile(bytes);
      await handle.sync();
    } finally {
      await handle.close();
    }
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
  }
  const actual = await stableReadOrdinary(target, expected, `installed ${relativePath}`);
  await chmod(target, 0o444);
  return {path: relativePath, ...actual.identity};
}

function transformPrivateGenerator(source) {
  let transformed = source;
  const rootNeedle =
    'const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");';
  const rootReplacement =
    'const ROOT = path.resolve(process.env.HELP_MATH_GATE0A_PROJECT_ROOT ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));\n' +
    'const GATE0A_SOURCE_ROOT = process.env.HELP_MATH_GATE0A_SOURCE_ROOT\n' +
    '  ? path.resolve(process.env.HELP_MATH_GATE0A_SOURCE_ROOT)\n' +
    '  : null;\n' +
    'const GATE0A_FACTORY_ROOT = process.env.HELP_MATH_GATE0A_FACTORY_ROOT\n' +
    '  ? path.resolve(process.env.HELP_MATH_GATE0A_FACTORY_ROOT)\n' +
    '  : null;\n' +
    'const HISTORICAL_FACTORY_ROOT = "work/g5-l5-ffdec-canvas-pcode-factory/full-v2";\n' +
    'const GATE0A_RUNTIME_ONLY = process.env.HELP_MATH_GATE0A_RUNTIME_ONLY === "1";';
  invariant(transformed.split(rootNeedle).length === 2,
    "private generator ROOT transform site drifted");
  transformed = transformed.replace(rootNeedle, rootReplacement);

  const projectPathNeedle = `async function readBytes(relativePath) {\n  return readFile(projectPath(relativePath));\n}`;
  const projectPathReplacement = `async function readBytes(relativePath) {\n  if (relativePath === SOURCE_ROOT || relativePath.startsWith(\`${"${SOURCE_ROOT}"}/\`)) {\n    invariant(GATE0A_SOURCE_ROOT, "HELP_MATH_GATE0A_SOURCE_ROOT is required for source reads");\n    const suffix = relativePath === SOURCE_ROOT ? "" : relativePath.slice(SOURCE_ROOT.length + 1);\n    const sourcePath = path.resolve(GATE0A_SOURCE_ROOT, suffix);\n    invariant(sourcePath === GATE0A_SOURCE_ROOT || sourcePath.startsWith(\`${"${GATE0A_SOURCE_ROOT}"}${"${path.sep}"}\`),\n      \`source path escapes Gate 0A source root: ${"${relativePath}"}\`);\n    return readFile(sourcePath);\n  }\n  if (relativePath === HISTORICAL_FACTORY_ROOT || relativePath.startsWith(\`${"${HISTORICAL_FACTORY_ROOT}"}/\`)) {\n    invariant(GATE0A_FACTORY_ROOT, "HELP_MATH_GATE0A_FACTORY_ROOT is required for factory reads");\n    const suffix = relativePath === HISTORICAL_FACTORY_ROOT\n      ? ""\n      : relativePath.slice(HISTORICAL_FACTORY_ROOT.length + 1);\n    const factoryPath = path.resolve(GATE0A_FACTORY_ROOT, suffix);\n    invariant(factoryPath === GATE0A_FACTORY_ROOT || factoryPath.startsWith(\`${"${GATE0A_FACTORY_ROOT}"}${"${path.sep}"}\`),\n      \`factory path escapes Gate 0A factory root: ${"${relativePath}"}\`);\n    return readFile(factoryPath);\n  }\n  return readFile(projectPath(relativePath));\n}`;
  invariant(transformed.split(projectPathNeedle).length === 2,
    "private generator readBytes transform site drifted");
  transformed = transformed.replace(projectPathNeedle, projectPathReplacement);

  const statNeedle = `const sourceMode = (await stat(projectPath(sourcePath))).mode;`;
  const statReplacement = `const sourceMode = (await stat(path.resolve(\n      GATE0A_SOURCE_ROOT,\n      sourcePath.slice(SOURCE_ROOT.length + 1),\n    ))).mode;`;
  invariant(transformed.split(statNeedle).length === 2,
    "private generator source stat transform site drifted");
  transformed = transformed.replace(statNeedle, statReplacement);

  const synchronizeNeedle = `async function synchronize(relativePath, bytes, check) {\n  const target = projectPath(relativePath);`;
  const synchronizeReplacement = `async function synchronize(relativePath, bytes, check) {\n  if (GATE0A_RUNTIME_ONLY && !relativePath.endsWith("/canvas-renderer.js")) return;\n  const target = projectPath(relativePath);`;
  invariant(transformed.split(synchronizeNeedle).length === 2,
    "private generator synchronize transform site drifted");
  transformed = transformed.replace(synchronizeNeedle, synchronizeReplacement);
  return Buffer.from(transformed);
}

async function main() {
  const externalReal = await realpath(EXTERNAL_ROOT);
  invariant(externalReal === EXTERNAL_ROOT, "external worktree root must not be a symlink");
  const externalInfo = await stat(EXTERNAL_ROOT);
  invariant(externalInfo.isDirectory(), "external G5 L5 worktree missing");

  const records = [];
  let privateGeneratorBytes = null;
  for (const input of INPUTS) {
    invariant(SHA256.test(input.sha256), `${input.source}: invalid expected SHA-256`);
    const sourcePath = resolveBelow(EXTERNAL_ROOT, input.source, "external input");
    const observed = await stableReadOrdinary(sourcePath, input, `external ${input.source}`);
    if (input.source === "scripts/build-g5-l5-private-current-js.mjs") {
      privateGeneratorBytes = observed.bytes;
    }
    const installed = [];
    for (const target of [input.target, input.evidenceTarget].filter(Boolean)) {
      installed.push(await installExact(target, observed.bytes, input));
    }
    records.push({
      sourcePath: input.source,
      sourceBytes: input.bytes,
      sourceSha256: input.sha256,
      sourcePhysical: observed.physical,
      role: input.role,
      installed,
    });
  }

  invariant(privateGeneratorBytes, "private generator was not read");
  const transformed = transformPrivateGenerator(privateGeneratorBytes.toString("utf8"));
  const transformedIdentity = {bytes: transformed.length, sha256: sha256(transformed)};
  const transformedPath = `${TOOLCHAIN_ROOT}/build-g5-l5-private-current-js.gate0a.mjs`;
  await installExact(transformedPath, transformed, transformedIdentity);

  const payload = {
    status: "canonicalized-no-authorization-effect",
    scope: "gate0a-g5-l5-v1-generator-and-source-bound-ir",
    sourceWorktree: {
      path: EXTERNAL_ROOT,
      observedHead: "7e5e31975158147aff36e2e43a23c927ea5e27fb",
      dirtyStateAcceptedOnlyAsInputCustody: true,
      bytesTrustedOnlyAfterExactHashVerification: true,
    },
    records,
    transformedReadOnlyRunner: {
      path: transformedPath,
      ...transformedIdentity,
      transformations: [
        "project-root-selected-by-explicit-gate0a-environment",
        "source-read-routed-to-explicit-canonical-read-only-source-root",
        "source-stat-routed-to-the-same-canonical-source-root",
        "factory-artifact-reads-routed-to-explicit-fresh-gate0a-root",
        "runtime-only-check-skips-non-renderer-product-artifacts",
      ],
      productionWriteModeUsed: false,
      intendedInvocation: "HELP_MATH_GATE0A_RUNTIME_ONLY=1 HELP_MATH_GATE0A_FACTORY_ROOT=<fresh-root> --scope all --check",
    },
    forbiddenEffects: {
      browserStarted: false,
      adaptiveBatchApplyRun: false,
      productionRendererWritten: false,
      v2ProfileWritten: false,
      activeBindingWritten: false,
      deploymentRun: false,
      applySentinelUpdated: false,
    },
  };
  const payloadBytes = canonicalBytes(payload);
  const document = {
    schemaVersion: 1,
    receiptType: "adaptive-canvas-g5-l5-gate0a-toolchain-canonicalization-v3",
    payloadSha256: sha256(payloadBytes),
    payload,
  };
  const receiptBytes = canonicalBytes(document);
  const receiptIdentity = {bytes: receiptBytes.length, sha256: sha256(receiptBytes)};
  await installExact(RECEIPT_PATH, receiptBytes, receiptIdentity);
  process.stdout.write(`${JSON.stringify({
    receipt: {path: RECEIPT_PATH, ...receiptIdentity, payloadSha256: document.payloadSha256},
    copiedRecordCount: records.length,
    transformedRunner: {path: transformedPath, ...transformedIdentity},
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
