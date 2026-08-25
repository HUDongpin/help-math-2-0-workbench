#!/usr/bin/env node

/** Canonicalize the exact G5 L3 v1 generator, corpus, and source-bound IR. */

import {createHash} from "node:crypto";
import {gunzipSync} from "node:zlib";
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
const EXTERNAL_ROOT = "/Volumes/WestWorld/HELP MATH 2.0-g5-l3-faithful-migration";
const CANONICAL_SOURCE_ROOT =
  "/Volumes/WestWorld/HELP MATH 2.0/source-assets/flash/HELP MATH_ORIGINAL FILES";
const TOOLCHAIN_ROOT = "work/gate0a/g5-l3-canonical-toolchain-v1";
const RECEIPT_PATH = "work/gate0a/g5-l3-toolchain-canonicalization.v1.json";
const SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES/";

const FIXED_INPUTS = Object.freeze([
  {
    path: "scripts/build-g5-l3-source-static-product-slice.mjs",
    bytes: 41_946,
    sha256: "2d59fe966fbe88927d2c66b85ccc5e2600284f6ce8e5af0022666c0b9ae40ab7",
    install: "scripts/build-g5-l3-source-static-product-slice.mjs",
    evidence: `${TOOLCHAIN_ROOT}/build-g5-l3-source-static-product-slice.original.mjs`,
    role: "canonical-v1-current-js-generator",
  },
  {
    path: "scripts/build-g5-l3-source-static-product-slice.test.mjs",
    bytes: 5_727,
    sha256: "0f84e4ed0c0909a481e8f69442bbf3ad9dc8bdf61e5d2e6ae606f6ac643d42be",
    evidence: `${TOOLCHAIN_ROOT}/build-g5-l3-source-static-product-slice.test.mjs`,
    role: "canonical-v1-generator-test",
  },
  {
    path: "scripts/materialize-g5-l3-source-static-product-slice-modules.mjs",
    bytes: 14_551,
    sha256: "458db6070eb6f7a69a72ce303b36ce894dd38155b6f637e09013dcc8ad7801fb",
    evidence: `${TOOLCHAIN_ROOT}/materialize-g5-l3-source-static-product-slice-modules.mjs`,
    role: "canonical-v1-product-materializer",
  },
  {
    path: "scripts/materialize-g5-l3-source-static-product-slice-modules.test.mjs",
    bytes: 2_137,
    sha256: "6c33959c4ef8aa6f0bb71e34b23b2deb9f4c3905afb11f1bfef61c1b8cb6dab5",
    evidence: `${TOOLCHAIN_ROOT}/materialize-g5-l3-source-static-product-slice-modules.test.mjs`,
    role: "canonical-v1-product-materializer-test",
  },
  {
    path: "scripts/build-safe-ffdec-canvas-adapter.mjs",
    bytes: 93_308,
    sha256: "11a2b244569df361bd8299b51789156862a2895765b704453b3452604fe6b41d",
    evidence: `${TOOLCHAIN_ROOT}/build-safe-ffdec-canvas-adapter.mjs`,
    role: "canonical-v1-safe-ffdec-adapter",
  },
  {
    path: "tools/g5-l3-migration/corpus.json",
    bytes: 121_563,
    sha256: "59cf73906633e56abd61f97bb7331689a4e84fb16480d6e6fed31bc301c56538",
    install: "tools/g5-l3-migration/corpus.json",
    evidence: `${TOOLCHAIN_ROOT}/corpus.json`,
    role: "canonical-page-only-corpus",
  },
]);

const MEMBER_FILES = Object.freeze([
  "audit/machine/report.json",
  "audit/machine/swfmill.xml.gz",
  "audit/machine/ffdec-scripts.txt.gz",
  "audit/audio-runtime-evidence.json",
  "migration.json",
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
  invariant(typeof relativePath === "string" && relativePath.length > 0 && !path.isAbsolute(relativePath),
    `${label}: project-relative path required`);
  const resolved = path.resolve(root, relativePath);
  invariant(resolved.startsWith(`${root}${path.sep}`), `${label}: path escapes root`);
  return resolved;
}

async function stableRead(filePath, label, expected = null) {
  const pathInfo = await lstat(filePath);
  invariant(pathInfo.isFile() && !pathInfo.isSymbolicLink(), `${label}: ordinary file required`);
  const handle = await open(filePath, "r");
  try {
    const before = await handle.stat({bigint: true});
    const bytes = await handle.readFile();
    const after = await handle.stat({bigint: true});
    for (const key of ["dev", "ino", "size", "mtimeNs", "ctimeNs"]) {
      invariant(before[key] === after[key], `${label}: unstable read (${key})`);
    }
    const identity = {bytes: bytes.length, sha256: sha256(bytes)};
    if (expected) {
      invariant(identity.bytes === expected.bytes && identity.sha256 === expected.sha256,
        `${label}: frozen identity mismatch`);
    }
    return {bytes, identity, physical: {
      dev: String(before.dev), ino: String(before.ino), size: String(before.size),
      mtimeNs: String(before.mtimeNs), ctimeNs: String(before.ctimeNs),
    }};
  } finally {
    await handle.close();
  }
}

async function install(relativePath, bytes, expected) {
  const target = resolveBelow(PROJECT_ROOT, relativePath, "install target");
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
  await stableRead(target, `installed ${relativePath}`, expected);
  await chmod(target, 0o444);
  return {path: relativePath, ...expected};
}

function transformGenerator(source) {
  let output = source;
  const browserImport = 'import {chromium} from "playwright";\n\n';
  invariant(output.split(browserImport).length === 2, "Chromium import transform site drifted");
  output = output.replace(browserImport, "");

  const rootNeedle = 'const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");';
  const rootReplacement =
    'const ROOT = path.resolve(process.env.HELP_MATH_GATE0A_PROJECT_ROOT ?? path.resolve(path.dirname(SCRIPT_PATH), ".."));\n' +
    'const GATE0A_SOURCE_ROOT = process.env.HELP_MATH_GATE0A_SOURCE_ROOT\n' +
    '  ? path.resolve(process.env.HELP_MATH_GATE0A_SOURCE_ROOT)\n' +
    '  : null;\n' +
    'const GATE0A_EVIDENCE_ROOT = process.env.HELP_MATH_GATE0A_EVIDENCE_ROOT\n' +
    '  ? path.resolve(process.env.HELP_MATH_GATE0A_EVIDENCE_ROOT)\n' +
    '  : null;\n' +
    'const GATE0A_RUNTIME_ONLY = process.env.HELP_MATH_GATE0A_RUNTIME_ONLY === "1";';
  invariant(output.split(rootNeedle).length === 2, "ROOT transform site drifted");
  output = output.replace(rootNeedle, rootReplacement);

  const adapterNeedle =
    'const SAFE_ADAPTER_RELATIVE = "scripts/build-safe-ffdec-canvas-adapter.mjs";';
  const adapterReplacement =
    `const SAFE_ADAPTER_RELATIVE = "${TOOLCHAIN_ROOT}/build-safe-ffdec-canvas-adapter.mjs";`;
  invariant(output.split(adapterNeedle).length === 2, "adapter binding transform site drifted");
  output = output.replace(adapterNeedle, adapterReplacement);

  const projectPathNeedle = `function projectPath(relativePath) {\n  invariant(typeof relativePath === "string" && relativePath.length > 0,\n    "project-relative path is required");`;
  const projectPathReplacement = `function projectPath(relativePath) {\n  invariant(typeof relativePath === "string" && relativePath.length > 0,\n    "project-relative path is required");\n  if (relativePath === SOURCE_PREFIX || relativePath.startsWith(\`${"${SOURCE_PREFIX}"}/\`)) {\n    invariant(GATE0A_SOURCE_ROOT, "HELP_MATH_GATE0A_SOURCE_ROOT is required for source reads");\n    const suffix = relativePath === SOURCE_PREFIX ? "" : relativePath.slice(SOURCE_PREFIX.length + 1);\n    const sourcePath = path.resolve(GATE0A_SOURCE_ROOT, suffix);\n    invariant(sourcePath === GATE0A_SOURCE_ROOT || sourcePath.startsWith(\`${"${GATE0A_SOURCE_ROOT}"}${"${path.sep}"}\`),\n      \`source path escapes Gate 0A source root: ${"${relativePath}"}\`);\n    return sourcePath;\n  }`;
  invariant(output.split(projectPathNeedle).length === 2, "projectPath transform site drifted");
  output = output.replace(projectPathNeedle, projectPathReplacement);

  const browserQaNeedle =
    "const browserQa = await browserSweep(browser, built.runtime, compatibilitySpec);";
  const browserQaReplacement = `const browserQa = Object.freeze({\n    status: "not-run-gate0a-browser-prohibited",\n    renderedFrameCount: 0,\n    blockedFrameCount: resolvedProfile.blockedLocalFrameRanges.reduce(\n      (sum, range) => sum + range.lastFrame - range.firstFrame + 1, 0),\n    consoleErrorCount: 0,\n    pageErrorCount: 0,\n    unexpectedNetworkRequestCount: 0,\n    browserStarted: false,\n  });`;
  invariant(output.split(browserQaNeedle).length === 2, "browser QA transform site drifted");
  output = output.replace(browserQaNeedle, browserQaReplacement);

  const emitNeedle = `async function emit(output, check) {\n  if (check) {`;
  const emitReplacement = `async function emit(output, check) {\n  if (GATE0A_RUNTIME_ONLY && !output.path.endsWith("/canvas-renderer.js")) return;\n  if (check) {`;
  invariant(output.split(emitNeedle).length === 2, "runtime-only emit transform site drifted");
  output = output.replace(emitNeedle, emitReplacement);

  const browserLaunchNeedle = "const browser = await chromium.launch({headless: true});";
  invariant(output.split(browserLaunchNeedle).length === 2, "browser launch transform site drifted");
  output = output.replace(browserLaunchNeedle, "const browser = null;");

  const temporaryNeedle =
    'const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "g5-l3-source-static-slice-"));';
  const temporaryReplacement = `invariant(GATE0A_EVIDENCE_ROOT,\n    "HELP_MATH_GATE0A_EVIDENCE_ROOT is required for browser-free regeneration");\n  await mkdir(path.dirname(GATE0A_EVIDENCE_ROOT), {recursive: true});\n  await mkdir(GATE0A_EVIDENCE_ROOT, {recursive: false});\n  const temporaryRoot = GATE0A_EVIDENCE_ROOT;`;
  invariant(output.split(temporaryNeedle).length === 2, "evidence root transform site drifted");
  output = output.replace(temporaryNeedle, temporaryReplacement);

  const cleanupNeedle = `  } finally {\n    await withinTimeout(browser.close(), 20_000, "G5 L3 factory browser close");\n    await rm(temporaryRoot, {recursive: true, force: true});\n  }`;
  const cleanupReplacement = `  } finally {\n    // Gate 0A retains the fresh FFDec compiler inputs as immutable evidence.\n  }`;
  invariant(output.split(cleanupNeedle).length === 2, "browser cleanup transform site drifted");
  output = output.replace(cleanupNeedle, cleanupReplacement);

  const returnNeedle = `    browserQa,\n    target: evidence.target,\n    runtime: {bytes: runtimeBytes.length, sha256: sha256(runtimeBytes)},`;
  const returnReplacement = `    browserQa,\n    target: evidence.target,\n    sourceFirstCompilerInput: Object.freeze({\n      source: {path: member.source.path, bytes: member.source.bytes, sha256: member.source.sha256},\n      helper: {bytes: fresh.helper.length, sha256: sha256(fresh.helper)},\n      framesHtml: {bytes: fresh.frames.length, sha256: sha256(fresh.frames)},\n      evidenceDirectory: portable(path.relative(ROOT, path.join(temporaryRoot, member.animationId))),\n      browserStarted: false,\n    }),\n    runtime: {bytes: runtimeBytes.length, sha256: sha256(runtimeBytes)},`;
  invariant(output.split(returnNeedle).length === 2, "source-first result transform site drifted");
  output = output.replace(returnNeedle, returnReplacement);
  return Buffer.from(output);
}

async function main() {
  invariant(await realpath(EXTERNAL_ROOT) === EXTERNAL_ROOT, "external G5 L3 worktree aliases are forbidden");
  invariant((await stat(EXTERNAL_ROOT)).isDirectory(), "external G5 L3 worktree missing");
  const sourceRootReal = await realpath(CANONICAL_SOURCE_ROOT);
  invariant((await stat(sourceRootReal)).isDirectory(), "canonical source root missing");

  const fixedRecords = [];
  let generatorBytes = null;
  for (const input of FIXED_INPUTS) {
    const observed = await stableRead(resolveBelow(EXTERNAL_ROOT, input.path, "fixed input"),
      `external ${input.path}`, input);
    if (input.path === "scripts/build-g5-l3-source-static-product-slice.mjs") {
      generatorBytes = observed.bytes;
    }
    const installed = [];
    for (const target of [input.install, input.evidence].filter(Boolean)) {
      installed.push(await install(target, observed.bytes, input));
    }
    fixedRecords.push({path: input.path, role: input.role, bytes: input.bytes,
      sha256: input.sha256, physical: observed.physical, installed});
  }
  invariant(generatorBytes, "G5 L3 generator bytes missing");

  const corpus = JSON.parse((await stableRead(
    resolveBelow(EXTERNAL_ROOT, "tools/g5-l3-migration/corpus.json", "corpus"),
    "G5 L3 corpus",
    FIXED_INPUTS.find(({path: inputPath}) => inputPath === "tools/g5-l3-migration/corpus.json"),
  )).bytes.toString("utf8"));
  invariant(corpus.release?.uniqueAnimationRenderers === 64 && corpus.members?.length === 64,
    "G5 L3 corpus denominator drifted");

  const memberRecords = [];
  for (const member of corpus.members) {
    const sourceLogical = member.source.path;
    invariant(sourceLogical.startsWith(SOURCE_PREFIX), `${member.animationId}: source prefix drifted`);
    const sourcePath = resolveBelow(sourceRootReal,
      sourceLogical.slice(SOURCE_PREFIX.length), `${member.animationId} source`);
    const source = await stableRead(sourcePath, `${member.animationId} canonical SWF`, member.source);
    const sourceInfo = await stat(sourcePath);
    invariant((sourceInfo.mode & 0o222) === 0, `${member.animationId}: canonical SWF is writable`);
    let pairedFla = null;
    if (member.pairedFla) {
      const flaPath = resolveBelow(sourceRootReal,
        member.pairedFla.path.slice(SOURCE_PREFIX.length), `${member.animationId} FLA`);
      const observed = await stableRead(flaPath, `${member.animationId} canonical FLA`, member.pairedFla);
      invariant(((await stat(flaPath)).mode & 0o222) === 0,
        `${member.animationId}: canonical FLA is writable`);
      pairedFla = {...observed.identity, logicalPath: member.pairedFla.path};
    }

    const evidence = [];
    for (const suffix of MEMBER_FILES) {
      const relative = `migrations/${member.animationId}/${suffix}`;
      const external = await stableRead(resolveBelow(EXTERNAL_ROOT, relative, "member evidence"),
        `${member.animationId} ${suffix}`);
      if (suffix.endsWith(".json")) JSON.parse(external.bytes.toString("utf8"));
      if (suffix.endsWith(".gz")) invariant(gunzipSync(external.bytes).length > 0,
        `${member.animationId} ${suffix}: empty gzip evidence`);
      evidence.push(await install(relative, external.bytes, external.identity));
    }
    const report = JSON.parse((await readFile(resolveBelow(PROJECT_ROOT,
      `migrations/${member.animationId}/audit/machine/report.json`, "installed report"), "utf8")));
    invariant(report.animationId === member.animationId && report.source?.hashMatches === true &&
      report.source?.expectedSha256 === member.source.sha256 &&
      report.findings?.runtimeCrossCheck?.allMatch === true,
    `${member.animationId}: source-bound machine report drifted`);
    memberRecords.push({
      animationId: member.animationId,
      firstOrdinal: member.firstOrdinal,
      source: {logicalPath: sourceLogical, ...source.identity},
      pairedFla,
      evidence,
    });
  }
  invariant(memberRecords.length === 64 &&
    new Set(memberRecords.map(({animationId}) => animationId)).size === 64,
  "G5 L3 canonical member denominator drifted");

  const transformed = transformGenerator(generatorBytes.toString("utf8"));
  const transformedIdentity = {bytes: transformed.length, sha256: sha256(transformed)};
  const transformedPath = `${TOOLCHAIN_ROOT}/build-g5-l3-source-static-product-slice.gate0a.mjs`;
  await install(transformedPath, transformed, transformedIdentity);

  const payload = {
    status: "canonicalized-no-authorization-effect",
    scope: "gate0a-g5-l3-64-page-renderers",
    sourceWorktree: {
      path: EXTERNAL_ROOT,
      observedHead: "71485baa601fe600e8f63c88fb0139492a4ad31e",
      dirtyStateAcceptedOnlyAsInputCustody: true,
      bytesTrustedOnlyAfterExactHashVerification: true,
    },
    canonicalSourceRoot: sourceRootReal,
    fixedRecords,
    memberRecords,
    transformedReadOnlyRunner: {
      path: transformedPath,
      ...transformedIdentity,
      runtimeOnly: true,
      browserImportRemoved: true,
      freshFfdecEvidenceRetained: true,
    },
    boundaries: {
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
    receiptType: "adaptive-canvas-g5-l3-gate0a-toolchain-canonicalization-v1",
    payloadSha256: sha256(payloadBytes),
    payload,
  };
  const receiptBytes = canonicalBytes(document);
  const receiptIdentity = {bytes: receiptBytes.length, sha256: sha256(receiptBytes)};
  await install(RECEIPT_PATH, receiptBytes, receiptIdentity);
  process.stdout.write(`${JSON.stringify({
    receipt: {path: RECEIPT_PATH, ...receiptIdentity, payloadSha256: document.payloadSha256},
    memberCount: memberRecords.length,
    installedEvidenceFileCount: memberRecords.length * MEMBER_FILES.length,
    transformedRunner: {path: transformedPath, ...transformedIdentity},
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
