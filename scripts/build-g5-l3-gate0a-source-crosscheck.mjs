#!/usr/bin/env node

/**
 * Browser-free source crosscheck for all 64 G5 L3 renderer inputs.
 * Fresh swfmill XML and fresh FFDec script exports must be byte-identical to
 * the canonical source-bound IR consumed by the v1 renderer generator.
 */

import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {gunzipSync} from "node:zlib";
import {
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const CORPUS_PATH = "tools/g5-l3-migration/corpus.json";
const V9_PLAN_PATH = "work/adaptive-canvas-production-five.plan.v9.json";
const CANONICALIZATION_PATH = "work/gate0a/g5-l3-toolchain-canonicalization.v1.json";
const DEFAULT_OUTPUT = "work/gate0a/g5-l3-source-crosscheck-v1";
const SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES/";

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

function normalizeText(value) {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    .replace(/\u001b\[[0-9;]*m/g, "");
}

function resolveProject(relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0 && !path.isAbsolute(relativePath),
    `${label}: project-relative path required`);
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  invariant(resolved.startsWith(`${PROJECT_ROOT}${path.sep}`), `${label}: path escapes project`);
  return resolved;
}

async function exists(filePath) {
  try {
    await lstat(filePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
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
        `${label}: bytes/SHA-256 mismatch`);
    }
    return {bytes, identity, physical: {
      dev: String(before.dev), ino: String(before.ino), size: String(before.size),
      mtimeNs: String(before.mtimeNs), ctimeNs: String(before.ctimeNs),
    }};
  } finally {
    await handle.close();
  }
}

async function readJson(relativePath, label) {
  const observed = await stableRead(resolveProject(relativePath, label), label);
  return {value: JSON.parse(observed.bytes.toString("utf8")), path: relativePath, ...observed.identity};
}

function parseArguments(argv) {
  const options = {sourceRoot: null, output: DEFAULT_OUTPUT, check: false};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--source-root") options.sourceRoot = argv[++index];
    else if (argument === "--output") options.output = argv[++index];
    else if (argument === "--check") options.check = true;
    else throw new Error(`unknown argument: ${argument}`);
  }
  invariant(typeof options.sourceRoot === "string" && path.isAbsolute(options.sourceRoot),
    "--source-root must be an explicit absolute path");
  invariant(options.output === DEFAULT_OUTPUT || options.output.startsWith("work/gate0a/"),
    "--output must stay under work/gate0a");
  return Object.freeze(options);
}

async function runCommand(command, args, {cwd, stdoutPath, stderrPath, timeoutMs}) {
  const startedAt = new Date().toISOString();
  const result = await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: {...process.env, NO_COLOR: "1", FORCE_COLOR: "0"},
    });
    const stdout = [];
    const stderr = [];
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", reject);
    child.once("close", (code, signal) => {
      clearTimeout(timer);
      resolve({code, signal, timedOut, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr)});
    });
  });
  await writeFile(stdoutPath, result.stdout, {flag: "wx", mode: 0o444});
  await writeFile(stderrPath, result.stderr, {flag: "wx", mode: 0o444});
  invariant(result.code === 0 && !result.timedOut,
    `${command} failed (${result.code === null ? `signal ${result.signal}` : `exit ${result.code}`})`);
  return {
    command,
    args,
    startedAt,
    exitCode: result.code,
    signal: result.signal,
    timedOut: result.timedOut,
    stdout: (await stableRead(stdoutPath, `${command} stdout`)).identity,
    stderr: (await stableRead(stderrPath, `${command} stderr`)).identity,
  };
}

async function walkFiles(directory, relative = "") {
  const entries = await readdir(path.join(directory, relative), {withFileTypes: true});
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, "en"))) {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(directory, next));
    else {
      invariant(entry.isFile(), `unsupported FFDec script output: ${next}`);
      files.push(next.split(path.sep).join("/"));
    }
  }
  return files;
}

async function buildScriptBundle(scriptRoot) {
  const files = await walkFiles(scriptRoot);
  const pieces = [];
  for (const relative of files) {
    pieces.push(`===== ${relative} =====\n`);
    const content = normalizeText(await readFile(path.join(scriptRoot, relative), "utf8"));
    pieces.push(content);
    if (!content.endsWith("\n")) pieces.push("\n");
    pieces.push("\n");
  }
  return {files, bytes: Buffer.from(pieces.join(""))};
}

async function freezeTree(root) {
  const entries = await readdir(root, {withFileTypes: true});
  for (const entry of entries) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) {
      await freezeTree(target);
      await chmod(target, 0o555);
    } else {
      invariant(entry.isFile(), `unsupported evidence entry: ${target}`);
      await chmod(target, 0o444);
    }
  }
}

async function sourcePathFor(rootReal, logicalPath) {
  invariant(logicalPath.startsWith(SOURCE_PREFIX), `unexpected source prefix: ${logicalPath}`);
  const candidate = path.resolve(rootReal, logicalPath.slice(SOURCE_PREFIX.length));
  invariant(candidate.startsWith(`${rootReal}${path.sep}`), "source path escapes root");
  const resolved = await realpath(candidate);
  invariant(resolved.startsWith(`${rootReal}${path.sep}`), "source realpath escapes root");
  return resolved;
}

function v9Rows(plan) {
  const rows = plan.payload?.runtimes?.filter(({releaseId, pageRenderer}) =>
    releaseId === "lesson-g05-l03-exponents-prime-factorizations-page-only" && pageRenderer) ?? [];
  invariant(rows.length === 64, `v9 G5 L3 denominator drifted: ${rows.length}`);
  return new Map(rows.map((row) => [row.animationId, row]));
}

async function loadContext(options) {
  const [corpus, v9Plan, canonicalization] = await Promise.all([
    readJson(CORPUS_PATH, "G5 L3 corpus"),
    readJson(V9_PLAN_PATH, "v9 plan"),
    readJson(CANONICALIZATION_PATH, "G5 L3 canonicalization receipt"),
  ]);
  invariant(corpus.value.members?.length === 64 &&
    corpus.value.release?.uniqueAnimationRenderers === 64,
  "G5 L3 corpus denominator drifted");
  invariant(canonicalization.value.payload?.memberRecords?.length === 64,
    "G5 L3 canonicalization denominator drifted");
  const sourceRootReal = await realpath(options.sourceRoot);
  const sourceInfo = await stat(sourceRootReal);
  invariant(sourceInfo.isDirectory() && (sourceInfo.mode & 0o222) === 0,
    "canonical source root must be read-only");
  return {
    corpus,
    v9Plan,
    canonicalization,
    v9ById: v9Rows(v9Plan.value),
    sourceRootReal,
    runner: await stableRead(SCRIPT_PATH, "G5 L3 source crosscheck runner"),
  };
}

async function buildMember({member, v9, sourceRootReal, stage}) {
  const sourcePath = await sourcePathFor(sourceRootReal, member.source.path);
  const sourceBefore = await stableRead(sourcePath, `${member.animationId} source`, member.source);
  invariant(((await stat(sourcePath)).mode & 0o222) === 0,
    `${member.animationId}: canonical SWF is writable`);
  const canonicalXmlGzip = await stableRead(resolveProject(
    `migrations/${member.animationId}/audit/machine/swfmill.xml.gz`, "canonical swfmill"),
  `${member.animationId} canonical swfmill gzip`);
  const canonicalScriptsGzip = await stableRead(resolveProject(
    `migrations/${member.animationId}/audit/machine/ffdec-scripts.txt.gz`, "canonical scripts"),
  `${member.animationId} canonical scripts gzip`);
  const canonicalXml = gunzipSync(canonicalXmlGzip.bytes);
  const canonicalScripts = gunzipSync(canonicalScriptsGzip.bytes);

  const memberRoot = path.join(stage, "members", member.animationId);
  const logs = path.join(memberRoot, "logs");
  const scriptsExport = path.join(memberRoot, "ffdec-script-export");
  const xmlPath = path.join(memberRoot, "swfmill.xml");
  await Promise.all([mkdir(logs, {recursive: true}), mkdir(memberRoot, {recursive: true})]);
  const swfmill = await runCommand("swfmill", ["-n", "swf2xml", sourcePath, xmlPath], {
    cwd: PROJECT_ROOT,
    stdoutPath: path.join(logs, "swfmill.stdout.txt"),
    stderrPath: path.join(logs, "swfmill.stderr.txt"),
    timeoutMs: 180_000,
  });
  const ffdecScripts = await runCommand("ffdec", [
    "-onerror", "abort",
    "-timeout", "30",
    "-exportTimeout", "120",
    "-exportFileTimeout", "30",
    "-export", "script",
    scriptsExport,
    sourcePath,
  ], {
    cwd: PROJECT_ROOT,
    stdoutPath: path.join(logs, "ffdec-scripts.stdout.txt"),
    stderrPath: path.join(logs, "ffdec-scripts.stderr.txt"),
    timeoutMs: 180_000,
  });
  const freshXml = await stableRead(xmlPath, `${member.animationId} fresh swfmill XML`);
  const freshBundle = await buildScriptBundle(path.join(scriptsExport, "scripts"));
  invariant(freshXml.bytes.equals(canonicalXml),
    `${member.animationId}: fresh swfmill XML differs from canonical IR`);
  invariant(freshBundle.bytes.equals(canonicalScripts),
    `${member.animationId}: fresh FFDec script bundle differs from canonical IR`);
  const sourceAfter = await stableRead(sourcePath, `${member.animationId} source after`, member.source);
  invariant(sourceBefore.identity.sha256 === sourceAfter.identity.sha256,
    `${member.animationId}: source changed during crosscheck`);
  const detail = {
    animationId: member.animationId,
    firstOrdinal: member.firstOrdinal,
    source: {path: member.source.path, bytes: sourceBefore.identity.bytes,
      sha256: sourceBefore.identity.sha256, before: sourceBefore.physical,
      after: sourceAfter.physical, unchanged: true},
    freshSwfmill: {path: `members/${member.animationId}/swfmill.xml`,
      bytes: freshXml.identity.bytes, sha256: freshXml.identity.sha256,
      canonicalGzip: canonicalXmlGzip.identity, byteIdenticalToCanonicalIr: true},
    freshFfdecScripts: {fileCount: freshBundle.files.length,
      bytes: freshBundle.bytes.length, sha256: sha256(freshBundle.bytes),
      canonicalGzip: canonicalScriptsGzip.identity, byteIdenticalToCanonicalIr: true},
    commands: {swfmill, ffdecScripts},
    v9: {assetPath: v9.assetPath, lane: v9.lane, input: v9.input, output: v9.output},
    browserStarted: false,
    productionRendererWritten: false,
  };
  const manifestBytes = canonicalBytes(detail);
  const manifestPath = path.join(memberRoot, "gate0a-source-crosscheck.json");
  await writeFile(manifestPath, manifestBytes, {flag: "wx", mode: 0o444});
  return {animationId: member.animationId, firstOrdinal: member.firstOrdinal,
    manifestPath: `members/${member.animationId}/gate0a-source-crosscheck.json`,
    manifest: {bytes: manifestBytes.length, sha256: sha256(manifestBytes)},
    sourceSha256: member.source.sha256,
    freshSwfmillSha256: freshXml.identity.sha256,
    freshFfdecScriptsSha256: sha256(freshBundle.bytes),
    v9Input: v9.input,
    v9Output: v9.output};
}

async function build(options) {
  const output = resolveProject(options.output, "output");
  invariant(!(await exists(output)), `output already exists: ${options.output}`);
  const context = await loadContext(options);
  const stage = `${output}.staging-${process.pid}`;
  invariant(!(await exists(stage)), `staging path already exists: ${stage}`);
  await mkdir(path.dirname(output), {recursive: true});
  await mkdir(stage, {recursive: false});
  try {
    const records = [];
    for (const member of context.corpus.value.members) {
      const v9 = context.v9ById.get(member.animationId);
      invariant(v9, `${member.animationId}: v9 row missing`);
      records.push(await buildMember({member, v9, sourceRootReal: context.sourceRootReal, stage}));
      process.stdout.write(`${JSON.stringify({progress: records.length, total: 64,
        animationId: member.animationId})}\n`);
    }
    const run = {
      schemaVersion: 1,
      receiptType: "g5-l3-gate0a-source-ir-crosscheck-v1",
      status: "pass-source-first-ir-crosscheck",
      scope: {releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
        pageRendererCount: 64, placementCount: 65, legacyCourseShellCount: 0},
      inputs: {
        corpus: {path: context.corpus.path, bytes: context.corpus.bytes, sha256: context.corpus.sha256},
        v9Plan: {path: context.v9Plan.path, bytes: context.v9Plan.bytes, sha256: context.v9Plan.sha256},
        canonicalization: {path: context.canonicalization.path,
          bytes: context.canonicalization.bytes, sha256: context.canonicalization.sha256},
        runner: {path: path.relative(PROJECT_ROOT, SCRIPT_PATH),
          bytes: context.runner.identity.bytes, sha256: context.runner.identity.sha256},
        sourceRoot: context.sourceRootReal,
      },
      records,
      boundaries: {browserStarted: false, adaptiveBatchApplyRun: false,
        productionRendererWritten: false, v2ProfileWritten: false,
        activeBindingWritten: false, deploymentRun: false, applySentinelUpdated: false},
    };
    const runBytes = canonicalBytes(run);
    await writeFile(path.join(stage, "gate0a-source-crosscheck-run.json"), runBytes,
      {flag: "wx", mode: 0o444});
    invariant(!(await exists(output)), `output appeared concurrently: ${options.output}`);
    await rename(stage, output);
    await freezeTree(output);
    await chmod(output, 0o555);
    return {output: options.output, memberCount: 64,
      manifest: {bytes: runBytes.length, sha256: sha256(runBytes)}, browserStarted: false};
  } catch (error) {
    throw new Error(`G5 L3 source crosscheck failed; diagnostics retained at ` +
      `${path.relative(PROJECT_ROOT, stage)}: ${error.message}`);
  }
}

async function check(options) {
  const context = await loadContext(options);
  const output = resolveProject(options.output, "output");
  const runObserved = await stableRead(path.join(output, "gate0a-source-crosscheck-run.json"),
    "G5 L3 source crosscheck run");
  const run = JSON.parse(runObserved.bytes.toString("utf8"));
  invariant(run.status === "pass-source-first-ir-crosscheck" && run.records?.length === 64,
    "source crosscheck run contract drifted");
  for (const member of context.corpus.value.members) {
    const record = run.records.find(({animationId}) => animationId === member.animationId);
    invariant(record, `${member.animationId}: crosscheck record missing`);
    const detailObserved = await stableRead(path.join(output, record.manifestPath),
      `${member.animationId} crosscheck manifest`, record.manifest);
    const detail = JSON.parse(detailObserved.bytes.toString("utf8"));
    const sourcePath = await sourcePathFor(context.sourceRootReal, member.source.path);
    await stableRead(sourcePath, `${member.animationId} source`, member.source);
    const xml = await stableRead(path.join(output, `members/${member.animationId}/swfmill.xml`),
      `${member.animationId} stored fresh XML`, detail.freshSwfmill);
    const canonicalXml = gunzipSync((await stableRead(resolveProject(
      `migrations/${member.animationId}/audit/machine/swfmill.xml.gz`, "canonical swfmill"),
    `${member.animationId} canonical swfmill gzip`)).bytes);
    invariant(xml.bytes.equals(canonicalXml), `${member.animationId}: stored fresh XML drifted`);
    const v9 = context.v9ById.get(member.animationId);
    invariant(JSON.stringify(record.v9Input) === JSON.stringify(v9.input) &&
      JSON.stringify(record.v9Output) === JSON.stringify(v9.output),
    `${member.animationId}: v9 identity drifted`);
  }
  return {checked: true, output: options.output, memberCount: 64,
    manifest: runObserved.identity, browserStarted: false};
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const result = options.check ? await check(options) : await build(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
