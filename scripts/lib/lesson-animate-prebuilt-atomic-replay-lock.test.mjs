import assert from "node:assert/strict";
import childProcess, {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {EventEmitter} from "node:events";
import {
  chmod,
  copyFile,
  link,
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  readdir,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  renameSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import {PassThrough} from "node:stream";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";
import test, {after, before} from "node:test";

import {
  buildLessonAnimateExecutionCodeClosureManifest,
  validateLessonAnimateExecutionCodeClosureManifest,
} from "./lesson-animate-execution-code-closure.mjs";
import {
  createLessonAnimatePrebuiltAtomicReplayLock,
  createLessonAnimatePrebuiltAtomicReplayLockDiagnostic,
  lessonAnimateReplayHelperAclOutputHasExtendedAclDiagnostic,
  LESSON_ANIMATE_REPLAY_LOCK_ATOMIC_PRIMITIVE,
  LESSON_ANIMATE_REPLAY_LOCK_HELPER_KILL_CONFIRM_MS,
  LESSON_ANIMATE_REPLAY_LOCK_HELPER_TERM_GRACE_MS,
  LESSON_ANIMATE_REPLAY_LOCK_HELPER_TIMEOUT_MS,
  LESSON_ANIMATE_REPLAY_LOCK_MAX_RECEIPT_BYTES,
  superviseLessonAnimateReplayHelperDiagnostic,
} from "./lesson-animate-prebuilt-atomic-replay-lock.mjs";
import {
  LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH,
  LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_ROOT,
} from "./lesson-animate-production-trust.mjs";

const execFile = promisify(execFileCallback);
const MODULE_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const NATIVE_SOURCE = path.resolve(
  MODULE_DIRECTORY,
  "../native/lesson-animate-atomic-replay-lock.c",
);
const BRIDGE_SOURCE = path.resolve(
  MODULE_DIRECTORY,
  "lesson-animate-prebuilt-atomic-replay-lock.mjs",
);
const RUN_NATIVE_TESTS = process.platform === "darwin";
const RECEIPT = Buffer.from('{"receipt":"acceptance-neutral-fixture"}\n', "utf8");

let compiledRoot = null;
let compiledHelper = null;
let hangingHelper = null;

before(async () => {
  if (!RUN_NATIVE_TESTS) return;
  compiledRoot = await realpath(await mkdtemp(path.join(os.tmpdir(), "l10-replay-helper-build-")));
  compiledHelper = path.join(compiledRoot, "lesson-animate-atomic-replay-lock");
  await execFile("/usr/bin/cc", [
    "-std=c11",
    "-Wall",
    "-Wextra",
    "-Werror",
    "-Os",
    NATIVE_SOURCE,
    "-o",
    compiledHelper,
  ], {encoding: "utf8", timeout: 30_000});
  await chmod(compiledHelper, 0o555);

  const hangingSource = path.join(compiledRoot, "ignore-term.c");
  hangingHelper = path.join(compiledRoot, "ignore-term");
  await writeFile(hangingSource, [
    "#include <signal.h>",
    "#include <unistd.h>",
    "int main(void) {",
    "  if (signal(SIGTERM, SIG_IGN) == SIG_ERR) return 91;",
    "  for (;;) pause();",
    "}",
    "",
  ].join("\n"));
  await execFile("/usr/bin/cc", [
    "-std=c11",
    "-Wall",
    "-Wextra",
    "-Werror",
    "-Os",
    hangingSource,
    "-o",
    hangingHelper,
  ], {encoding: "utf8", timeout: 30_000});
  await chmod(hangingHelper, 0o555);
});

after(async () => {
  if (compiledRoot) await rm(compiledRoot, {recursive: true, force: true});
});

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function neverClosingHelperFixture(t) {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.signals = [];
  child.unrefCalls = 0;
  const activeHandle = setInterval(() => {}, 60_000);
  t.after(() => clearInterval(activeHandle));
  child.kill = (signal) => {
    child.signals.push(signal);
    return false;
  };
  child.unref = () => {
    child.unrefCalls += 1;
    activeHandle.unref();
  };
  return {child, activeHandle};
}

function leafFor(bytes = RECEIPT) {
  return `${digest(bytes)}.lock.json`;
}

async function put(root, relative, contents, mode = 0o644) {
  const target = path.join(root, ...relative.split("/"));
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(target, contents);
  await chmod(target, mode);
  return target;
}

async function fixture(t, {helperBinary = compiledHelper} = {}) {
  assert.ok(helperBinary, "native fixture helper was compiled");
  const base = await realpath(await mkdtemp(path.join(os.tmpdir(), "l10-prebuilt-replay-")));
  t.after(async () => rm(base, {recursive: true, force: true}));
  const projectRoot = path.join(base, "project");
  const replayRoot = path.join(base, "authority-replay-root");
  await mkdir(projectRoot, {mode: 0o700});
  await mkdir(replayRoot, {mode: 0o700});
  await chmod(replayRoot, 0o700);

  const entrypoint = "scripts/entry.mjs";
  await put(projectRoot, entrypoint,
    "export const acceptanceNeutralReplayBridgeFixture = true;\n");
  await put(projectRoot, "tools/animate-export.jsfl", "fl.trace('fixture');\n");
  const animateExecutable = await put(
    projectRoot,
    "tools/fake-animate",
    "#!/bin/sh\nexit 0\n",
    0o555,
  );
  const helperRelative = "tools/lesson-animate-atomic-replay-lock";
  const helper = path.join(projectRoot, ...helperRelative.split("/"));
  await copyFile(helperBinary, helper);
  await chmod(helper, 0o555);

  const toolchain = {
    aclProbe: await realpath("/bin/ls"),
    nodeExecutable: await realpath(process.execPath),
    processProbe: await realpath("/bin/ps"),
    jsfl: "tools/animate-export.jsfl",
    animateExecutable,
    replayLockHelper: helperRelative,
  };
  const manifest = await buildLessonAnimateExecutionCodeClosureManifest({
    projectRoot,
    entrypoint,
    toolchain,
  });
  const token = await validateLessonAnimateExecutionCodeClosureManifest({
    projectRoot,
    manifest,
  });
  return Object.freeze({
    base,
    projectRoot,
    replayRoot,
    entrypoint,
    helper,
    helperRelative,
    manifest,
    token,
    toolchain,
  });
}

function inputFor(fix, overrides = {}) {
  return {
    validatedCodeClosureToken: fix.token,
    replayRoot: fix.replayRoot,
    receiptBytes: RECEIPT,
    ...overrides,
  };
}

async function directNativeInvocation({
  helper = compiledHelper,
  replayRoot,
  receiptBytes,
  leaf = leafFor(receiptBytes),
  expectedHelper = helper,
  inheritedHelper = expectedHelper,
}) {
  const root = await lstat(replayRoot, {bigint: true});
  const helperInfo = await lstat(expectedHelper, {bigint: true});
  const helperBytes = await readFile(expectedHelper);
  const inherited = await open(inheritedHelper, "r");
  try {
    return childProcess.spawnSync(helper, [
      replayRoot,
      leaf,
      root.dev.toString(),
      root.ino.toString(),
      helperInfo.dev.toString(),
      helperInfo.ino.toString(),
      helperInfo.size.toString(),
      digest(helperBytes),
    ], {
      encoding: "utf8",
      input: receiptBytes,
      maxBuffer: 2_000_000,
      stdio: ["pipe", "pipe", "pipe", inherited.fd],
    });
  } finally {
    await inherited.close();
  }
}

test("diagnostic bridge executes only its rebound fixture and commits exact 0400 bytes", {
  skip: !RUN_NATIVE_TESTS,
}, async (t) => {
  const fix = await fixture(t);
  const originalSpawn = childProcess.spawn;
  const spawnCalls = [];
  t.mock.method(childProcess, "spawn", function observedSpawn(file, args, options) {
    spawnCalls.push({file, args: [...args], options});
    return originalSpawn.call(this, file, args, options);
  });

  const result = await createLessonAnimatePrebuiltAtomicReplayLockDiagnostic(inputFor(fix));
  assert.equal(result.ok, true);
  assert.equal(result.production, false);
  assert.equal(result.diagnosticOnly, true);
  assert.equal(result.primitive, LESSON_ANIMATE_REPLAY_LOCK_ATOMIC_PRIMITIVE);
  assert.equal(result.bytes, RECEIPT.length);
  assert.equal(result.receiptSha256, digest(RECEIPT));
  assert.deepEqual(result.helperDescriptor, fix.manifest.toolchain.replayLockHelper);
  assert.equal(result.validatedCodeClosureToken.stillBound, true);
  assert.match(result.helperExecutionBinding, /^diagnostic-/u);
  assert.deepEqual(Object.values(result.authorityBoundary),
    Array(Object.keys(result.authorityBoundary).length).fill(false));

  assert.equal(spawnCalls.length, 1);
  assert.equal(spawnCalls[0].file, fix.helper);
  assert.deepEqual(spawnCalls[0].args.slice(0, 2), [fix.replayRoot, leafFor()]);
  assert.equal(spawnCalls[0].options.stdio[3] > 2, true);
  assert.deepEqual(Object.keys(spawnCalls[0].options.env).sort(), ["LANG", "LC_ALL", "PATH"]);

  const lockPath = path.join(fix.replayRoot, leafFor());
  assert.deepEqual(await readFile(lockPath), RECEIPT);
  const lock = await lstat(lockPath, {bigint: true});
  assert.equal(lock.isFile(), true);
  assert.equal(lock.nlink, 1n);
  assert.equal(lock.mode & 0o7777n, 0o400n);
  assert.equal(result.replayLockIdentity.leaf, leafFor());
  assert.equal(result.replayLockIdentity.device, lock.dev.toString());
  assert.equal(result.replayLockIdentity.inode, lock.ino.toString());
  assert.equal(result.replayLockIdentity.sha256, digest(RECEIPT));
});

test("receipt snapshot fixes both derived leaf and payload before the first await", {
  skip: !RUN_NATIVE_TESTS,
}, async (t) => {
  const fix = await fixture(t);
  const mutable = Buffer.from(RECEIPT);
  const original = Buffer.from(mutable);
  const pending = createLessonAnimatePrebuiltAtomicReplayLockDiagnostic(
    inputFor(fix, {receiptBytes: mutable}),
  );
  mutable.fill(0x78);
  const result = await pending;
  assert.equal(result.receiptSha256, digest(original));
  assert.equal(result.replayLockIdentity.leaf, leafFor(original));
  assert.deepEqual(await readFile(path.join(fix.replayRoot, leafFor(original))), original);
  assert.equal(await readdir(fix.replayRoot).then((entries) => entries.length), 1);
});

test("caller cannot select or vary a replay-lock leaf", {
  skip: !RUN_NATIVE_TESTS,
}, async (t) => {
  const fix = await fixture(t);
  await assert.rejects(
    createLessonAnimatePrebuiltAtomicReplayLockDiagnostic({
      ...inputFor(fix),
      lockLeaf: leafFor(Buffer.from("caller-choice")),
    }),
    /keys do not match the fixed schema/u,
  );
  await assert.rejects(
    createLessonAnimatePrebuiltAtomicReplayLockDiagnostic({
      ...inputFor(fix),
      helperPath: "/tmp/caller-selected-helper",
    }),
    /keys do not match the fixed schema/u,
  );
  assert.deepEqual(await readdir(fix.replayRoot), []);
});

test("two deterministic-receipt calls have exactly one O_EXCL winner", {
  skip: !RUN_NATIVE_TESTS,
}, async (t) => {
  const fix = await fixture(t);
  const outcomes = await Promise.allSettled([
    createLessonAnimatePrebuiltAtomicReplayLockDiagnostic(inputFor(fix)),
    createLessonAnimatePrebuiltAtomicReplayLockDiagnostic(inputFor(fix)),
  ]);
  const winners = outcomes.filter(({status}) => status === "fulfilled");
  const losers = outcomes.filter(({status}) => status === "rejected");
  assert.equal(winners.length, 1);
  assert.equal(losers.length, 1);
  assert.equal(losers[0].reason.code, "EEXIST");
  assert.equal(losers[0].reason.helperExitCode, 73);
  assert.equal(losers[0].reason.retrySameLeafAllowed, false);
  assert.equal(losers[0].reason.replayLockDisposition,
    "if-created-sealed-never-delete-or-overwrite");
  assert.deepEqual(await readdir(fix.replayRoot), [leafFor()]);
  assert.deepEqual(await readFile(path.join(fix.replayRoot, leafFor())), RECEIPT);
});

test("production rejects a project-relative closure and a missing fixed helper fails closed", {
  skip: !RUN_NATIVE_TESTS,
}, async (t) => {
  const fix = await fixture(t);
  await assert.rejects(
    createLessonAnimatePrebuiltAtomicReplayLock({
      ...inputFor(fix),
      replayRoot: LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_ROOT,
    }),
    /requires a closure bound to the fixed production replay helper/u,
  );

  const fixedHelperMissing = await lstat(LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH)
    .then(() => false, (error) => {
      if (error?.code === "ENOENT") return true;
      throw error;
    });
  if (fixedHelperMissing) {
    await assert.rejects(
      buildLessonAnimateExecutionCodeClosureManifest({
        projectRoot: fix.projectRoot,
        entrypoint: fix.entrypoint,
        toolchain: {
          ...fix.toolchain,
          replayLockHelper: LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH,
        },
      }),
      (error) => error?.code === "ENOENT",
    );
  }
  assert.deepEqual(await readdir(fix.replayRoot), []);
});

test("closure rebound rejects helper drift, symlink, hardlink, and non-executable mode", {
  skip: !RUN_NATIVE_TESTS,
}, async (t) => {
  await t.test("byte drift", async (child) => {
    const fix = await fixture(child);
    await chmod(fix.helper, 0o755);
    await writeFile(fix.helper, Buffer.from("drift\n"));
    await chmod(fix.helper, 0o555);
    await assert.rejects(
      createLessonAnimatePrebuiltAtomicReplayLockDiagnostic(inputFor(fix)),
      /no longer physically bound/u,
    );
    assert.deepEqual(await readdir(fix.replayRoot), []);
  });

  await t.test("symlink replacement", async (child) => {
    const fix = await fixture(child);
    await rm(fix.helper);
    await symlink(compiledHelper, fix.helper);
    await assert.rejects(
      createLessonAnimatePrebuiltAtomicReplayLockDiagnostic(inputFor(fix)),
      /ordinary file/u,
    );
    assert.deepEqual(await readdir(fix.replayRoot), []);
  });

  await t.test("hardlink replacement", async (child) => {
    const fix = await fixture(child);
    await rm(fix.helper);
    await link(compiledHelper, fix.helper);
    await assert.rejects(
      createLessonAnimatePrebuiltAtomicReplayLockDiagnostic(inputFor(fix)),
      /exactly one physical link/u,
    );
    assert.deepEqual(await readdir(fix.replayRoot), []);
  });

  await t.test("non-executable mode", async (child) => {
    const fix = await fixture(child);
    await chmod(fix.helper, 0o444);
    await assert.rejects(
      createLessonAnimatePrebuiltAtomicReplayLockDiagnostic(inputFor(fix)),
      /must have an executable mode/u,
    );
    assert.deepEqual(await readdir(fix.replayRoot), []);
  });
});

test("helper pathname replacement immediately after spawn is detected before receipt release", {
  skip: !RUN_NATIVE_TESTS,
}, async (t) => {
  const fix = await fixture(t);
  const originalSpawn = childProcess.spawn;
  const moved = `${fix.helper}.opened-original`;
  t.mock.method(childProcess, "spawn", function replaceAfterSpawn(file, args, options) {
    const child = originalSpawn.call(this, file, args, options);
    renameSync(fix.helper, moved);
    copyFileSync(compiledHelper, fix.helper);
    chmodSync(fix.helper, 0o555);
    return child;
  });

  await assert.rejects(
    createLessonAnimatePrebuiltAtomicReplayLockDiagnostic(inputFor(fix)),
    (error) => /(?:descriptor changed|pathname no longer identifies the opened helper) immediately after spawn/u
      .test(error?.message || "")
      && error?.retrySameLeafAllowed === false,
  );
  assert.deepEqual(await readdir(fix.replayRoot), []);
});

test("kernel helper returns the stable root-mismatch exit code on pre-spawn root swap", {
  skip: !RUN_NATIVE_TESTS,
}, async (t) => {
  const fix = await fixture(t);
  const oldRoot = `${fix.replayRoot}-old-pinned`;
  const originalSpawn = childProcess.spawn;
  t.mock.method(childProcess, "spawn", function swapBeforeSpawn(file, args, options) {
    renameSync(fix.replayRoot, oldRoot);
    mkdirSync(fix.replayRoot, {mode: 0o700});
    return originalSpawn.call(this, file, args, options);
  });

  await assert.rejects(
    createLessonAnimatePrebuiltAtomicReplayLockDiagnostic(inputFor(fix)),
    (error) => error?.code === "EREPLAYROOT"
      && error?.helperExitCode === 75
      && error?.retrySameLeafAllowed === false,
  );
  assert.deepEqual(await readdir(fix.replayRoot), []);
  assert.deepEqual(await readdir(oldRoot), []);
});

test("fixed timeout escalates from SIGTERM to bounded SIGKILL", {
  skip: !RUN_NATIVE_TESTS,
}, async (t) => {
  const fix = await fixture(t, {helperBinary: hangingHelper});
  const originalSpawn = childProcess.spawn;
  const observedSignals = [];
  t.mock.method(childProcess, "spawn", function observeKills(file, args, options) {
    const child = originalSpawn.call(this, file, args, options);
    const originalKill = child.kill.bind(child);
    child.kill = (signal) => {
      observedSignals.push(signal);
      return originalKill(signal);
    };
    return child;
  });
  const started = Date.now();
  await assert.rejects(
    createLessonAnimatePrebuiltAtomicReplayLockDiagnostic(inputFor(fix)),
    (error) => error?.code === "EHELPERTIMEOUT"
      && error?.retrySameLeafAllowed === false
      && error?.helperTerminationSignals?.join(",") === "SIGTERM,SIGKILL",
  );
  const elapsed = Date.now() - started;
  assert.equal(observedSignals.includes("SIGTERM"), true);
  assert.equal(observedSignals.includes("SIGKILL"), true);
  assert.equal(elapsed >= LESSON_ANIMATE_REPLAY_LOCK_HELPER_TIMEOUT_MS, true);
  assert.equal(elapsed < LESSON_ANIMATE_REPLAY_LOCK_HELPER_TIMEOUT_MS
    + LESSON_ANIMATE_REPLAY_LOCK_HELPER_TERM_GRACE_MS
    + LESSON_ANIMATE_REPLAY_LOCK_HELPER_KILL_CONFIRM_MS + 3_000, true);
  assert.deepEqual(await readdir(fix.replayRoot), []);
});

test("kill-unconfirmed helper destroys stdio, unrefs its active handle, and rejects once", async (t) => {
  t.mock.timers.enable({apis: ["setTimeout"]});
  const fixture = neverClosingHelperFixture(t);
  const supervisor = superviseLessonAnimateReplayHelperDiagnostic(fixture.child);
  supervisor.sendReceipt(RECEIPT);

  t.mock.timers.tick(LESSON_ANIMATE_REPLAY_LOCK_HELPER_TIMEOUT_MS);
  assert.deepEqual(fixture.child.signals, ["SIGTERM"]);
  t.mock.timers.tick(LESSON_ANIMATE_REPLAY_LOCK_HELPER_TERM_GRACE_MS);
  assert.deepEqual(fixture.child.signals, ["SIGTERM", "SIGKILL"]);
  t.mock.timers.tick(LESSON_ANIMATE_REPLAY_LOCK_HELPER_KILL_CONFIRM_MS);

  await assert.rejects(supervisor.promise, (error) =>
    error?.code === "EHELPERKILLUNCONFIRMED"
      && error?.helperTerminationSignals?.join(",") === "SIGTERM,SIGKILL");
  assert.equal(fixture.child.stdin.destroyed, true);
  assert.equal(fixture.child.stdout.destroyed, true);
  assert.equal(fixture.child.stderr.destroyed, true);
  assert.equal(fixture.child.unrefCalls, 1);
  assert.equal(fixture.activeHandle.hasRef(), false);

  t.mock.timers.runAll();
  assert.deepEqual(fixture.child.signals, ["SIGTERM", "SIGKILL"]);
  assert.equal(fixture.child.unrefCalls, 1);
});

test("native helper independently binds leaf to receipt and uses stable exit codes", {
  skip: !RUN_NATIVE_TESTS,
}, async (t) => {
  const fix = await fixture(t);
  const mismatched = await directNativeInvocation({
    replayRoot: fix.replayRoot,
    receiptBytes: RECEIPT,
    leaf: leafFor(Buffer.from("different receipt")),
  });
  assert.equal(mismatched.status, 65);
  assert.deepEqual(await readdir(fix.replayRoot), []);

  const empty = await directNativeInvocation({
    replayRoot: fix.replayRoot,
    receiptBytes: Buffer.alloc(0),
    leaf: leafFor(Buffer.from("empty-placeholder")),
  });
  assert.equal(empty.status, 65);
  const oversized = await directNativeInvocation({
    replayRoot: fix.replayRoot,
    receiptBytes: Buffer.alloc(LESSON_ANIMATE_REPLAY_LOCK_MAX_RECEIPT_BYTES + 1),
  });
  assert.equal(oversized.status, 65);
  assert.deepEqual(await readdir(fix.replayRoot), []);

  const first = await directNativeInvocation({
    replayRoot: fix.replayRoot,
    receiptBytes: RECEIPT,
  });
  assert.equal(first.status, 0);
  const replay = await directNativeInvocation({
    replayRoot: fix.replayRoot,
    receiptBytes: RECEIPT,
  });
  assert.equal(replay.status, 73);
  assert.deepEqual(await readdir(fix.replayRoot), [leafFor()]);
});

test("native helper rejects an inherited descriptor identity mismatch with exit 77", {
  skip: !RUN_NATIVE_TESTS,
}, async (t) => {
  const fix = await fixture(t);
  const other = path.join(fix.base, "different-helper-bytes");
  await writeFile(other, Buffer.from("not the expected executable\n"));
  await chmod(other, 0o555);
  const result = await directNativeInvocation({
    helper: compiledHelper,
    expectedHelper: compiledHelper,
    inheritedHelper: other,
    replayRoot: fix.replayRoot,
    receiptBytes: RECEIPT,
  });
  assert.equal(result.status, 77);
  assert.deepEqual(await readdir(fix.replayRoot), []);
});

test("input bounds and forged tokens fail without creating a lock", {
  skip: !RUN_NATIVE_TESTS,
}, async (t) => {
  const fix = await fixture(t);
  await assert.rejects(
    createLessonAnimatePrebuiltAtomicReplayLockDiagnostic(
      inputFor(fix, {receiptBytes: Buffer.alloc(0)}),
    ),
    /must not be empty/u,
  );
  await assert.rejects(
    createLessonAnimatePrebuiltAtomicReplayLockDiagnostic(inputFor(fix, {
      receiptBytes: Buffer.alloc(LESSON_ANIMATE_REPLAY_LOCK_MAX_RECEIPT_BYTES + 1),
    })),
    /exceeds 1048576 bytes/u,
  );
  await assert.rejects(
    createLessonAnimatePrebuiltAtomicReplayLockDiagnostic(inputFor(fix, {
      validatedCodeClosureToken: {...fix.token},
    })),
    /absent, stale, or forged/u,
  );
  assert.deepEqual(await readdir(fix.replayRoot), []);
});

test("runtime bridge contains no build path and exposes no helper or leaf input", async () => {
  const source = await readFile(BRIDGE_SOURCE, "utf8");
  assert.doesNotMatch(source, /\/usr\/bin\/cc|\bclang\b|compileNative/u);
  assert.match(source, /productionReplayLockHelperBound === true/u);
  assert.match(source, /LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH/u);
  assert.match(source, /stdio: \["pipe", "pipe", "pipe", helper\.handle\.fd\]/u);
  assert.match(source, /const lockLeaf = `\$\{receiptSha256\}\.lock\.json`/u);
  assert.doesNotMatch(source, /options\.(?:helper|helperPath|helperHash|helperDescriptor|lockLeaf)/u);
  assert.deepEqual([...INPUT_KEYS_FOR_ASSERTION(source)], [
    "receiptBytes",
    "replayRoot",
    "validatedCodeClosureToken",
  ]);
});

test("production helper ACL parser distinguishes ACL entries from a bare xattr marker", () => {
  assert.equal(lessonAnimateReplayHelperAclOutputHasExtendedAclDiagnostic(
    "-r-xr-xr-x@ 1 root wheel - 100 Aug 4 00:00 helper\n"), false);
  assert.equal(lessonAnimateReplayHelperAclOutputHasExtendedAclDiagnostic(
    "-r-xr-xr-x+ 1 root wheel - 100 Aug 4 00:00 helper\n"), true);
  assert.equal(lessonAnimateReplayHelperAclOutputHasExtendedAclDiagnostic([
    "-r-xr-xr-x@ 1 root wheel - 100 Aug 4 00:00 helper",
    " 0: user:someone allow read,write,execute,delete",
    "",
  ].join("\n")), true);
  assert.throws(() => lessonAnimateReplayHelperAclOutputHasExtendedAclDiagnostic(
    "unrecognized ACL output\n"), /unrecognized mode/u);
});

test("replay root rejects a real Darwin ACL while allowing a bare xattr marker", {
  skip: !RUN_NATIVE_TESTS,
}, async (t) => {
  await t.test("bare xattr marker", async (child) => {
    const fix = await fixture(child);
    await execFile("/usr/bin/xattr", [
      "-w",
      "com.help-math.replay-lock-test",
      "bare-xattr-marker",
      fix.replayRoot,
    ], {encoding: "utf8", timeout: 5_000});
    const {stdout} = await execFile("/bin/ls", ["-ldeO", fix.replayRoot], {
      encoding: "utf8",
      timeout: 5_000,
    });
    assert.match(stdout.split(/\r?\n/u)[0], /^d[rwx-]{9}@/u,
      "fixture should expose a bare xattr mode marker");
    assert.doesNotMatch(stdout, /^\s*\d+:\s/mu,
      "bare xattr fixture must not carry numbered ACL rows");
    const result = await createLessonAnimatePrebuiltAtomicReplayLockDiagnostic(inputFor(fix));
    assert.equal(result.ok, true);
    assert.deepEqual(await readFile(path.join(fix.replayRoot, leafFor())), RECEIPT);
  });

  await t.test("numbered ACL", async (child) => {
    const fix = await fixture(child);
    await execFile("/bin/chmod", ["+a", "everyone deny write", fix.replayRoot], {
      encoding: "utf8",
      timeout: 5_000,
    });
    const {stdout} = await execFile("/bin/ls", ["-ldeO", fix.replayRoot], {
      encoding: "utf8",
      timeout: 5_000,
    });
    assert.match(stdout, /^\s*\d+:\s/mu,
      "fixture should carry a numbered extended ACL row");
    await assert.rejects(
      createLessonAnimatePrebuiltAtomicReplayLockDiagnostic(inputFor(fix)),
      /may not carry an extended ACL/u,
    );
    assert.deepEqual(await readdir(fix.replayRoot), []);
  });
});

function INPUT_KEYS_FOR_ASSERTION(source) {
  const match = /const INPUT_KEYS = Object\.freeze\(\[([\s\S]*?)\]\);/u.exec(source);
  assert.ok(match, "bridge fixed input schema is present");
  return [...match[1].matchAll(/"([^"]+)"/gu)].map((entry) => entry[1]);
}
