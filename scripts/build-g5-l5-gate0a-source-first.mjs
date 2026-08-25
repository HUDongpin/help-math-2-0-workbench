#!/usr/bin/env node

/**
 * Fresh, browser-free G5 L5 source-first regeneration for Gate 0A.
 *
 * This intentionally materializes compiler evidence only under work/.  It
 * never writes the Current-JS renderer, product registry, v2 profile, active
 * binding, deployment, or any acceptance state.
 */

import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
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
const DEFAULT_OUTPUT = "work/g5-l5-ffdec-canvas-pcode-factory/full-v2";
const ROOT_AUDIT_PATH = "work/g5-l5-root-placement-audit/v1/run-manifest.json";
const SOURCE_SCOPE_PATH = "reports/g5-l5-source-scope-freeze.json";
const V9_PLAN_PATH = "work/adaptive-canvas-production-five.plan.v9.json";
const CANONICALIZATION_RECEIPT =
  "work/gate0a/g5-l5-toolchain-canonicalization.v1.json";
const CANVAS_FORMATS =
  "frame:canvas,sprite:canvas,shape:canvas,morphshape:canvas,button:svg_combined,script:as";
const CANVAS_ITEMS = "frame,sprite,shape,morphshape,button,script,image,sound";
const SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const SHA256 = /^[a-f0-9]{64}$/;

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

function resolveProject(relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0,
    `${label}: non-empty project-relative path required`);
  invariant(!path.isAbsolute(relativePath), `${label}: absolute path forbidden`);
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

async function stableIdentity(filePath, label, expected = null) {
  const beforePath = await lstat(filePath);
  invariant(beforePath.isFile() && !beforePath.isSymbolicLink(), `${label}: ordinary file required`);
  const handle = await open(filePath, "r");
  try {
    const first = await handle.stat({bigint: true});
    const bytes = await handle.readFile();
    const second = await handle.stat({bigint: true});
    for (const key of ["dev", "ino", "size", "mtimeNs", "ctimeNs"]) {
      invariant(first[key] === second[key], `${label}: unstable read (${key})`);
    }
    const identity = {
      bytes: bytes.length,
      sha256: sha256(bytes),
      physical: {
        dev: String(first.dev),
        ino: String(first.ino),
        size: String(first.size),
        mtimeNs: String(first.mtimeNs),
        ctimeNs: String(first.ctimeNs),
      },
    };
    if (expected) {
      invariant(identity.bytes === expected.bytes && identity.sha256 === expected.sha256,
        `${label}: bytes/SHA-256 mismatch`);
    }
    return {bytes, identity};
  } finally {
    await handle.close();
  }
}

async function readJsonProject(relativePath, label) {
  const filePath = resolveProject(relativePath, label);
  const observed = await stableIdentity(filePath, label);
  return {value: JSON.parse(observed.bytes.toString("utf8")), path: relativePath, ...observed.identity};
}

function parseArguments(argv) {
  const options = {sourceRoot: null, output: DEFAULT_OUTPUT, check: false, resumeStage: null};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--source-root") {
      invariant(!options.sourceRoot, "--source-root may be supplied only once");
      options.sourceRoot = argv[++index];
    } else if (argument === "--output") {
      invariant(options.output === DEFAULT_OUTPUT, "--output may be supplied only once");
      options.output = argv[++index];
    } else if (argument === "--check") {
      options.check = true;
    } else if (argument === "--resume-stage") {
      invariant(!options.resumeStage, "--resume-stage may be supplied only once");
      options.resumeStage = argv[++index];
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  invariant(typeof options.sourceRoot === "string" && path.isAbsolute(options.sourceRoot),
    "--source-root must be an explicit absolute path");
  invariant(options.output === DEFAULT_OUTPUT || options.output.startsWith("work/gate0a/"),
    "--output must be the fixed full-v2 evidence path or a work/gate0a child");
  if (options.resumeStage) {
    invariant(options.resumeStage.startsWith(`${options.output}.gate0a-staging-`),
      "--resume-stage must be the retained staging child for the selected output");
  }
  return Object.freeze(options);
}

async function sourcePathFor(rootReal, sourceLogicalPath) {
  invariant(sourceLogicalPath.startsWith(SOURCE_PREFIX),
    `unexpected source prefix: ${sourceLogicalPath}`);
  const relative = sourceLogicalPath.slice(SOURCE_PREFIX.length);
  const candidate = path.resolve(rootReal, relative);
  invariant(candidate.startsWith(`${rootReal}${path.sep}`), "source path escapes canonical root");
  const resolved = await realpath(candidate);
  invariant(resolved.startsWith(`${rootReal}${path.sep}`), "source realpath escapes canonical root");
  return resolved;
}

async function runCommand({command, args, cwd, stdoutPath, stderrPath, timeoutMs}) {
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
    `${command} failed (${result.timedOut ? "timeout" :
      result.code === null ? `signal ${result.signal ?? "unknown"}` : `exit ${result.code}`}); ` +
    `see ${path.relative(PROJECT_ROOT, stderrPath)}`);
  const [stdout, stderr] = await Promise.all([
    stableIdentity(stdoutPath, `${command} stdout`),
    stableIdentity(stderrPath, `${command} stderr`),
  ]);
  return {
    command,
    args,
    startedAt,
    exitCode: result.code,
    signal: result.signal,
    timedOut: result.timedOut,
    stdout: stdout.identity,
    stderr: stderr.identity,
  };
}

async function freezeTree(root) {
  const entries = await readdir(root, {withFileTypes: true});
  entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
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

function sourceMembersById(sourceScope) {
  invariant(sourceScope.reportType === "g5-l5-source-scope-freeze",
    "source scope type drifted");
  invariant(sourceScope.summary?.pageCount === 56 && sourceScope.members?.length === 57,
    "source scope denominator drifted");
  const pages = sourceScope.members.slice(0, 56);
  invariant(pages.every((member, index) => member.role === "lesson-page" && member.ordinal === index + 1),
    "source scope page ordering drifted");
  invariant(sourceScope.members[56].role === "lesson-shell", "legacy shell boundary drifted");
  return new Map(pages.map((member) => [member.animationId, member]));
}

function v9G5L5ById(plan) {
  const rows = plan.payload?.runtimes?.filter((row) =>
    row.releaseId === "lesson-g05-l05-add-subtract-negative-numbers" && row.pageRenderer === true) ?? [];
  invariant(rows.length === 56, `v9 G5 L5 denominator drifted: ${rows.length}`);
  return new Map(rows.map((row) => [row.animationId, row]));
}

async function loadContext(options) {
  const [rootAudit, sourceScope, v9Plan, canonicalization] = await Promise.all([
    readJsonProject(ROOT_AUDIT_PATH, "G5 L5 root audit"),
    readJsonProject(SOURCE_SCOPE_PATH, "G5 L5 source scope"),
    readJsonProject(V9_PLAN_PATH, "v9 plan"),
    readJsonProject(CANONICALIZATION_RECEIPT, "G5 L5 canonicalization receipt"),
  ]);
  invariant(rootAudit.value.members?.length === 56, "root audit must contain 56 page members");
  invariant(canonicalization.value.payload?.forbiddenEffects?.productionRendererWritten === false,
    "canonicalization receipt boundary missing");
  const sourceRootReal = await realpath(options.sourceRoot);
  const sourceRootInfo = await stat(sourceRootReal);
  invariant(sourceRootInfo.isDirectory() && (sourceRootInfo.mode & 0o222) === 0,
    "canonical source root must be a read-only directory");
  return {
    rootAudit,
    sourceScope,
    v9Plan,
    canonicalization,
    sourceRootReal,
    sourceMembers: sourceMembersById(sourceScope.value),
    v9ById: v9G5L5ById(v9Plan.value),
    runner: await stableIdentity(SCRIPT_PATH, "Gate 0A G5 L5 source-first runner"),
  };
}

async function buildMember({member, sourceMember, v9, sourceRootReal, stage}) {
  invariant(member.ordinal === sourceMember.ordinal, `${member.animationId}: ordinal drifted`);
  invariant(member.sourceSwf.sha256 === sourceMember.source?.swf?.sha256,
    `${member.animationId}: source scope/root audit hash drifted`);
  invariant(v9.input?.sha256 && v9.output?.sha256 && SHA256.test(v9.input.sha256),
    `${member.animationId}: invalid v9 identity`);
  const sourcePath = await sourcePathFor(sourceRootReal, member.sourceSwf.path);
  const sourceBefore = await stableIdentity(sourcePath, `${member.animationId} source`, member.sourceSwf);
  const sourceMode = (await stat(sourcePath)).mode;
  invariant((sourceMode & 0o222) === 0, `${member.animationId}: canonical source is writable`);

  const memberRoot = path.join(stage, "members", member.animationId);
  const canvasRoot = path.join(memberRoot, "canvas");
  const swfmillRoot = path.join(memberRoot, "swfmill");
  const logsRoot = path.join(memberRoot, "gate0a-logs");
  await Promise.all([
    mkdir(canvasRoot, {recursive: true}),
    mkdir(swfmillRoot, {recursive: true}),
    mkdir(logsRoot, {recursive: true}),
  ]);
  const swfmillXml = path.join(swfmillRoot, "source.xml");
  const swfmill = await runCommand({
    command: "swfmill",
    args: ["-n", "swf2xml", sourcePath, swfmillXml],
    cwd: PROJECT_ROOT,
    stdoutPath: path.join(logsRoot, "swfmill.stdout.txt"),
    stderrPath: path.join(logsRoot, "swfmill.stderr.txt"),
    timeoutMs: 180_000,
  });
  const ffdec = await runCommand({
    command: "ffdec",
    args: [
      "-config", "packJavaScripts=false",
      "-onerror", "abort",
      "-timeout", "120",
      "-exportTimeout", "600",
      "-format", CANVAS_FORMATS,
      "-export", CANVAS_ITEMS,
      canvasRoot,
      sourcePath,
    ],
    cwd: PROJECT_ROOT,
    stdoutPath: path.join(logsRoot, "ffdec-canvas.stdout.txt"),
    stderrPath: path.join(logsRoot, "ffdec-canvas.stderr.txt"),
    timeoutMs: 660_000,
  });

  const relativeHelper = member.targetSprite.helper.path.split(`/members/${member.animationId}/`)[1];
  const relativeFrames = member.targetSprite.framesHtml.path.split(`/members/${member.animationId}/`)[1];
  invariant(relativeHelper && relativeFrames, `${member.animationId}: root audit artifact path drifted`);
  const [helper, frames, xml, sourceAfter] = await Promise.all([
    stableIdentity(path.join(memberRoot, relativeHelper), `${member.animationId} helper`, member.targetSprite.helper),
    stableIdentity(path.join(memberRoot, relativeFrames), `${member.animationId} frames`, member.targetSprite.framesHtml),
    stableIdentity(swfmillXml, `${member.animationId} swfmill XML`, member.swfmillXml?.freshRegeneration),
    stableIdentity(sourcePath, `${member.animationId} source after`, member.sourceSwf),
  ]);
  invariant(sourceBefore.identity.sha256 === sourceAfter.identity.sha256,
    `${member.animationId}: source changed during regeneration`);
  invariant(member.swfmillXml?.byteIdentical === true &&
    member.swfmillXml?.stored?.sha256 === xml.identity.sha256,
  `${member.animationId}: swfmill source-first crosswalk drifted`);

  const record = {
    animationId: member.animationId,
    ordinal: member.ordinal,
    source: {
      logicalPath: member.sourceSwf.path,
      physicalRoot: sourceRootReal,
      bytes: sourceBefore.identity.bytes,
      sha256: sourceBefore.identity.sha256,
      physicalBefore: sourceBefore.identity.physical,
      physicalAfter: sourceAfter.identity.physical,
      unchanged: true,
    },
    rootPlacement: member.rootPlacement,
    targetSprite: {
      objectId: member.targetSprite.objectId,
      functionName: member.targetSprite.functionName,
      frameCount: member.targetSprite.frameCount,
      helper: {path: relativeHelper, bytes: helper.identity.bytes, sha256: helper.identity.sha256},
      framesHtml: {path: relativeFrames, bytes: frames.identity.bytes, sha256: frames.identity.sha256},
    },
    swfmillXml: {path: `members/${member.animationId}/swfmill/source.xml`, bytes: xml.identity.bytes,
      sha256: xml.identity.sha256, exactHistoricalCrosswalk: true},
    commands: {swfmill, ffdec},
    v9: {
      assetPath: v9.assetPath,
      lane: v9.lane,
      input: v9.input,
      output: v9.output,
    },
    browserStarted: false,
    currentJsRuntimeWritten: false,
  };
  const manifestPath = path.join(memberRoot, "gate0a-source-first-manifest.json");
  const bytes = canonicalBytes(record);
  await writeFile(manifestPath, bytes, {flag: "wx", mode: 0o444});
  return {
    animationId: member.animationId,
    ordinal: member.ordinal,
    manifestPath: `members/${member.animationId}/gate0a-source-first-manifest.json`,
    manifest: {bytes: bytes.length, sha256: sha256(bytes)},
    sourceSha256: record.source.sha256,
    helperSha256: record.targetSprite.helper.sha256,
    framesHtmlSha256: record.targetSprite.framesHtml.sha256,
    swfmillSha256: record.swfmillXml.sha256,
    v9Input: v9.input,
    v9Output: v9.output,
  };
}

async function completedMemberFromStage({member, sourceMember, v9, sourceRootReal, stage}) {
  const memberRoot = path.join(stage, "members", member.animationId);
  const manifestPath = path.join(memberRoot, "gate0a-source-first-manifest.json");
  if (!(await exists(manifestPath))) return null;
  const manifestObserved = await stableIdentity(manifestPath, `${member.animationId} resumed manifest`);
  const detail = JSON.parse(manifestObserved.bytes.toString("utf8"));
  invariant(detail.animationId === member.animationId && detail.ordinal === member.ordinal,
    `${member.animationId}: resumed manifest identity drifted`);
  invariant(detail.source?.sha256 === sourceMember.source?.swf?.sha256,
    `${member.animationId}: resumed source binding drifted`);
  invariant(JSON.stringify(detail.v9?.input) === JSON.stringify(v9.input) &&
    JSON.stringify(detail.v9?.output) === JSON.stringify(v9.output),
  `${member.animationId}: resumed v9 identity drifted`);
  const sourcePath = await sourcePathFor(sourceRootReal, member.sourceSwf.path);
  await stableIdentity(sourcePath, `${member.animationId} resumed source`, member.sourceSwf);
  await Promise.all([
    stableIdentity(path.join(memberRoot, detail.targetSprite.helper.path),
      `${member.animationId} resumed helper`, member.targetSprite.helper),
    stableIdentity(path.join(memberRoot, detail.targetSprite.framesHtml.path),
      `${member.animationId} resumed frames`, member.targetSprite.framesHtml),
    stableIdentity(path.join(memberRoot, "swfmill/source.xml"),
      `${member.animationId} resumed swfmill XML`, member.swfmillXml.freshRegeneration),
  ]);
  return {
    animationId: member.animationId,
    ordinal: member.ordinal,
    manifestPath: `members/${member.animationId}/gate0a-source-first-manifest.json`,
    manifest: {bytes: manifestObserved.identity.bytes, sha256: manifestObserved.identity.sha256},
    sourceSha256: detail.source.sha256,
    helperSha256: detail.targetSprite.helper.sha256,
    framesHtmlSha256: detail.targetSprite.framesHtml.sha256,
    swfmillSha256: detail.swfmillXml.sha256,
    v9Input: v9.input,
    v9Output: v9.output,
  };
}

async function preserveIncompleteMember(stage, animationId) {
  const memberRoot = path.join(stage, "members", animationId);
  if (!(await exists(memberRoot))) return null;
  let ordinal = 1;
  let preserved;
  do {
    preserved = path.join(stage, "failed-attempts", `${animationId}-attempt-${ordinal}`);
    ordinal += 1;
  } while (await exists(preserved));
  await mkdir(path.dirname(preserved), {recursive: true});
  await rename(memberRoot, preserved);
  return path.relative(stage, preserved).split(path.sep).join("/");
}

async function build(options) {
  const output = resolveProject(options.output, "output");
  invariant(!(await exists(output)), `output already exists: ${options.output}`);
  const context = await loadContext(options);
  await mkdir(path.dirname(output), {recursive: true});
  const stage = options.resumeStage
    ? resolveProject(options.resumeStage, "resume stage")
    : `${output}.gate0a-staging-${process.pid}`;
  if (options.resumeStage) {
    const stageInfo = await lstat(stage).catch(() => null);
    invariant(stageInfo?.isDirectory() && !stageInfo.isSymbolicLink(),
      `resume stage is missing or invalid: ${options.resumeStage}`);
  } else {
    invariant(!(await exists(stage)), `staging path already exists: ${stage}`);
    await mkdir(stage, {recursive: false});
  }
  try {
    const records = [];
    for (const member of context.rootAudit.value.members) {
      const sourceMember = context.sourceMembers.get(member.animationId);
      const v9 = context.v9ById.get(member.animationId);
      invariant(sourceMember && v9, `${member.animationId}: missing source/v9 row`);
      let record = await completedMemberFromStage({
        member, sourceMember, v9, sourceRootReal: context.sourceRootReal, stage,
      });
      let resumed = true;
      let preservedFailedAttempt = null;
      if (!record) {
        resumed = false;
        preservedFailedAttempt = await preserveIncompleteMember(stage, member.animationId);
        record = await buildMember({
          member,
          sourceMember,
          v9,
          sourceRootReal: context.sourceRootReal,
          stage,
        });
      }
      records.push(record);
      process.stdout.write(`${JSON.stringify({
        progress: records.length,
        total: 56,
        animationId: member.animationId,
        resumed,
        preservedFailedAttempt,
      })}\n`);
    }
    invariant(records.length === 56 && new Set(records.map(({animationId}) => animationId)).size === 56,
      "source-first record denominator drifted");
    const run = {
      schemaVersion: 1,
      receiptType: "g5-l5-gate0a-browser-free-source-first-run-v1",
      status: "pass-source-first-compiler-input-regeneration",
      scope: {
        releaseId: "lesson-g05-l05-add-subtract-negative-numbers",
        pageRendererCount: 56,
        legacyCourseShellCount: 0,
      },
      inputs: {
        rootAudit: {path: context.rootAudit.path, bytes: context.rootAudit.bytes,
          sha256: context.rootAudit.sha256},
        sourceScope: {path: context.sourceScope.path, bytes: context.sourceScope.bytes,
          sha256: context.sourceScope.sha256},
        v9Plan: {path: context.v9Plan.path, bytes: context.v9Plan.bytes,
          sha256: context.v9Plan.sha256},
        canonicalization: {path: context.canonicalization.path, bytes: context.canonicalization.bytes,
          sha256: context.canonicalization.sha256},
        runner: {path: path.relative(PROJECT_ROOT, SCRIPT_PATH), bytes: context.runner.identity.bytes,
          sha256: context.runner.identity.sha256},
        sourceRoot: context.sourceRootReal,
      },
      records,
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
    const runBytes = canonicalBytes(run);
    await writeFile(path.join(stage, "gate0a-source-first-run-manifest.json"), runBytes,
      {flag: "wx", mode: 0o444});
    invariant(!(await exists(output)), `output appeared concurrently: ${options.output}`);
    await rename(stage, output);
    await freezeTree(output);
    await chmod(output, 0o555);
    return {
      output: options.output,
      memberCount: records.length,
      manifest: {bytes: runBytes.length, sha256: sha256(runBytes)},
      browserStarted: false,
    };
  } catch (error) {
    throw new Error(`G5 L5 Gate 0A source-first regeneration failed; diagnostics retained at ` +
      `${path.relative(PROJECT_ROOT, stage)}: ${error.message}`);
  }
}

async function check(options) {
  const context = await loadContext(options);
  const output = resolveProject(options.output, "output");
  const manifestPath = path.join(output, "gate0a-source-first-run-manifest.json");
  const manifestObserved = await stableIdentity(manifestPath, "source-first run manifest");
  const manifest = JSON.parse(manifestObserved.bytes.toString("utf8"));
  invariant(manifest.receiptType === "g5-l5-gate0a-browser-free-source-first-run-v1" &&
    manifest.status === "pass-source-first-compiler-input-regeneration",
  "source-first run manifest contract drifted");
  invariant(manifest.records?.length === 56, "source-first run manifest denominator drifted");
  for (const member of context.rootAudit.value.members) {
    const record = manifest.records.find(({animationId}) => animationId === member.animationId);
    invariant(record, `${member.animationId}: source-first record missing`);
    const sourcePath = await sourcePathFor(context.sourceRootReal, member.sourceSwf.path);
    await stableIdentity(sourcePath, `${member.animationId} source`, member.sourceSwf);
    const memberManifest = await stableIdentity(
      path.join(output, `members/${member.animationId}/gate0a-source-first-manifest.json`),
      `${member.animationId} member manifest`,
      record.manifest,
    );
    const detail = JSON.parse(memberManifest.bytes.toString("utf8"));
    const helper = path.join(output, "members", member.animationId, detail.targetSprite.helper.path);
    const frames = path.join(output, "members", member.animationId, detail.targetSprite.framesHtml.path);
    const xml = path.join(output, "members", member.animationId, "swfmill/source.xml");
    await Promise.all([
      stableIdentity(helper, `${member.animationId} helper`, member.targetSprite.helper),
      stableIdentity(frames, `${member.animationId} frames`, member.targetSprite.framesHtml),
      stableIdentity(xml, `${member.animationId} swfmill XML`, member.swfmillXml.freshRegeneration),
    ]);
    const v9 = context.v9ById.get(member.animationId);
    invariant(JSON.stringify(record.v9Input) === JSON.stringify(v9.input) &&
      JSON.stringify(record.v9Output) === JSON.stringify(v9.output),
    `${member.animationId}: v9 identity drifted`);
  }
  return {
    checked: true,
    output: options.output,
    memberCount: 56,
    manifest: {bytes: manifestObserved.identity.bytes, sha256: manifestObserved.identity.sha256},
    browserStarted: false,
  };
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
