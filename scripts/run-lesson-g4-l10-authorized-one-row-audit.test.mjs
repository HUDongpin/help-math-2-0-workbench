import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";

import {
  parseDedicatedArguments,
} from "./run-lesson-g4-l10-authorized-one-row-audit.mjs";
import {
  runAuthorizedLessonG4L10OneRowAudit,
} from "./run-assisted-animate-authoring-audit.mjs";

const execFileAsync = promisify(execFile);
const SCRIPT = fileURLToPath(new URL("./run-lesson-g4-l10-authorized-one-row-audit.mjs",
  import.meta.url));
const GENERIC = fileURLToPath(new URL("./run-assisted-animate-authoring-audit.mjs",
  import.meta.url));
const CORE = fileURLToPath(new URL("./lib/lesson-animate-authoring-audit-core.mjs",
  import.meta.url));

test("dedicated L10 CLI accepts only three ordered lowercase receipt hashes or read-only help", () => {
  const hashes = ["a".repeat(64), "b".repeat(64), "c".repeat(64)];
  assert.deepEqual(parseDedicatedArguments(hashes), {
    help: false,
    assignmentSha256: hashes[0],
    authorizationSha256: hashes[1],
    executionCodeClosureSha256: hashes[2],
  });
  assert.deepEqual(parseDedicatedArguments(["--help"]), {help: true});
  assert.deepEqual(parseDedicatedArguments(["-h"]), {help: true});
  for (const injected of [
    [],
    hashes.slice(0, 2),
    [...hashes, "--timeout-ms=30000"],
    [hashes[0], "--operator", hashes[2]],
    [hashes[0].toUpperCase(), hashes[1], hashes[2]],
    [hashes[0], "/tmp/caller-path", hashes[2]],
    ["--help", hashes[0], hashes[1]],
  ]) assert.throws(() => parseDedicatedArguments(injected),
    /exactly three receipt SHA-256|exact lowercase SHA-256/u);
});

test("dedicated CLI help is read-only and does not enter trust verification", async () => {
  const {stdout, stderr} = await execFileAsync(process.execPath, [SCRIPT, "--help"], {
    env: {PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C"},
  });
  assert.match(stdout, /exactly one owner-authorized/u);
  assert.match(stdout, /does\s+not grant original-runtime/u);
  assert.equal(stderr, "");
});

test("production direct execution reaches the fixed external-trust fail-closed gate without launching Animate", async () => {
  const hash = "a".repeat(64);
  await assert.rejects(execFileAsync(process.execPath, [SCRIPT, hash, hash, hash], {
    env: {PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C"},
  }), (error) => {
    assert.equal(error.code, 1);
    assert.match(error.stderr,
      /PRODUCTION_TRUST_ANCHOR_UNAVAILABLE|production trust root/u);
    assert.doesNotMatch(error.stderr, /ACTION REQUIRED/u);
    return true;
  });
});

test("clone, spread, JSON, fabricated, and extra-argument claims fail before the dedicated core", async () => {
  const fake = Object.freeze({
    ok: true,
    diagnosticOnly: false,
    executionClaimed: true,
    animationId: "course-g04-l10-vb-003",
  });
  for (const candidate of [fake, {...fake}, structuredClone(fake),
    JSON.parse(JSON.stringify(fake))]) {
    await assert.rejects(runAuthorizedLessonG4L10OneRowAudit(candidate),
      /opaque production claim token/u);
  }
  await assert.rejects(runAuthorizedLessonG4L10OneRowAudit(fake, {root: "/tmp"}),
    /exactly one opaque v2 claim token/u);
});

test("unexecutable production branch source-contract binds module-derived root, exact runId directory, durable intent, and immediate launch transition", async () => {
  const [entrySource, genericSource, coreSource] = await Promise.all([
    readFile(SCRIPT, "utf8"),
    readFile(GENERIC, "utf8"),
    readFile(CORE, "utf8"),
  ]);
  assert.match(entrySource,
    /verifyLessonAnimateOneRowAuthorizationV2[\s\S]*consumeLessonAnimateOneRowAuthorizationV2[\s\S]*claimLessonAnimateOneRowExecutionV2[\s\S]*runAuthorizedLessonG4L10OneRowAudit/u);
  assert.match(entrySource, /const PROJECT_ROOT = await realpath\(fileURLToPath\(new URL\("\.\.\/"/u);
  assert.match(entrySource,
    /from "\.\/lib\/lesson-animate-authoring-audit-core\.mjs"/u);
  assert.doesNotMatch(entrySource, /run-assisted-animate-authoring-audit/u);
  assert.doesNotMatch(entrySource, /timeoutMs:|operatorFullName:|animateBinary:|replayRoot:/u);

  const dedicatedStart = coreSource.indexOf(
    "export async function runAuthorizedLessonG4L10OneRowAudit(claimToken)",
  );
  const dedicatedEnd = coreSource.length;
  assert.ok(dedicatedStart >= 0 && dedicatedEnd > dedicatedStart);
  const dedicated = coreSource.slice(dedicatedStart, dedicatedEnd);
  assert.match(dedicated, /arguments\.length === 1/u);
  assert.match(dedicated,
    /takeLessonAnimateOneRowExecutionContextV2\(claimToken\)[\s\S]*const root = CORE_PROJECT_ROOT[\s\S]*assertExecutionContext\(context, root\)/u);
  assert.doesNotMatch(dedicated, /context\.projectRoot|process\.cwd\(\)|mkdtemp|prepareOnly/u);
  assert.match(coreSource,
    /const CORE_PROJECT_ROOT = await realpath\(fileURLToPath\(new URL\("\.\.\/\.\.\/"/u);
  assert.match(coreSource, /createRunDirectory\(mapping\.runDirectory, mapping\.evidenceDir\)/u);
  assert.match(coreSource, /writeDurableExclusiveJson\(path\.join\(runDir, "launch-intent\.json"\)/u);
  const intent = dedicated.indexOf("writeDurableExclusiveJson(");
  const transition = dedicated.indexOf("beginLessonAnimateOneRowLaunchAttemptV2(");
  const spawn = dedicated.indexOf("processResult = await runChild(", transition);
  assert.ok(intent >= 0 && transition > intent && spawn > transition,
    "durable intent must precede the one-time transition, immediately followed by spawn");
  assert.doesNotMatch(dedicated.slice(transition, spawn), /await (?!beginLessonAnimate)/u);
  assert.match(coreSource,
    /await mkdir\(runDirectory, \{mode: 0o700\}\)/u);
  assert.doesNotMatch(coreSource.slice(
    coreSource.indexOf("async function createRunDirectory"),
    coreSource.indexOf("async function writeDurableExclusiveJson"),
  ), /recursive: true|mkdtemp/u);
  assert.match(coreSource, /runtimeLaunched: "possible-or-unknown-after-this-receipt"/u);
  assert.match(coreSource, /authorizationEffect: "execution-only-never-review-or-acceptance"/u);
  assert.match(coreSource, /acceptanceEffect: "none"/u);
  assert.match(coreSource, /execFile\("\/bin\/ps"/u);
  assert.match(dedicated, /remaining = await runningAnimate\(context\.audit\.animateExecutable\)/u);
  assert.match(dedicated, /postProbeSucceeded && Array\.isArray\(remaining\) && remaining\.length === 0/u);
  assert.match(dedicated, /cleanAnimateEnvironment\(\), \{detachedProcessGroup: true, cwd: root\}/u);
  assert.match(coreSource, /killConfirmationTimer = setTimeout/u);
  assert.match(coreSource, /maxOutputBytes = 16 \* 1024 \* 1024/u);
  assert.match(coreSource, /mode differs from its owner-signed descriptor/u);
  assert.match(genericSource,
    /return coreRunAuthorizedLessonG4L10OneRowAudit\(claimToken\)/u);
});

test("the JS-only process identity remains explicitly blocked pending a fixed root-owned native capability", async () => {
  const source = await readFile(fileURLToPath(new URL(
    "./lib/lesson-animate-one-row-authorization-v2.mjs", import.meta.url)), "utf8");
  assert.match(source, /process\.execArgv\.length === 0/u);
  assert.match(source, /process\.argv\.length === 5/u);
  for (const name of ["NODE_OPTIONS", "NODE_PATH", "NODE_REPL_EXTERNAL_MODULE",
    "NODE_V8_COVERAGE", "NODE_INSPECT_RESUME_ON_START"]) assert.ok(source.includes(name));
  assert.match(source,
    /LESSON_ANIMATE_ONE_ROW_V2_NATIVE_LAUNCH_CAPABILITY_ENABLED = false/u);
  assert.match(source,
    /fixed root-owned native launcher\/capability replaces mutable JavaScript process identity and plain-context handoff/u);
  assert.equal(path.basename(SCRIPT),
    "run-lesson-g4-l10-authorized-one-row-audit.mjs");
});
