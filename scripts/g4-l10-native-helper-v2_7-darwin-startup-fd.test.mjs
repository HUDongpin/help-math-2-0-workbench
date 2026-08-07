import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(projectRoot, "scripts/native/g4-l10-successor-v2_7");
const header = path.join(sourceRoot, "darwin_startup_fd.h");
const source = path.join(sourceRoot, "darwin_startup_fd.c");
const unit = path.join(sourceRoot, "darwin_startup_fd_test.c");
const fuzz = path.join(sourceRoot, "darwin_startup_fd_fuzz.c");
const childSource = path.join(sourceRoot, "darwin_startup_fd_child.c");
const launcherSource = path.join(sourceRoot, "darwin_startup_fd_launcher_test.c");

const expectedHashes = new Map([
  [header, "ffe192bbacf43440c0c3f78e636fbdb8ef3ed072e1c7f635d05bc89310b5af7e"],
  [source, "8a99a70a6f8a78014c0c4eb42ae1230e0d2b40475a8bae2f1eafd175eefc253b"],
  [unit, "e35c0fb0a0216eee99307a17a099a6653cc4ed76247b56607f1cec2518a4c8d4"],
  [fuzz, "f2abe750ff7f9d3feb3867701e70f5923a4ee64f81c4d09d685f5ec7465d6f17"],
  [childSource, "3a8f6f963144860eab3dd2d63e3eafc3bfe442202a4883d7242e6f234bd81f82"],
  [launcherSource, "893dabaa0cbded4cf84ea3b9f66ecc94a88f2c55df29c868293eb4e763b04359"],
]);

const strictFlags = [
  "-std=c11", "-Wall", "-Wextra", "-Wpedantic", "-Wconversion",
  "-Wsign-conversion", "-Wshadow", "-Wformat=2", "-Werror", "-O2",
];
const sanitizerFlags = [
  "-std=c11", "-Wall", "-Wextra", "-Werror", "-O1", "-g",
  "-fno-omit-frame-pointer", "-fsanitize=address,undefined",
];
const fixedEnvironment = {
  PATH: "/usr/bin:/bin:/usr/sbin:/sbin",
  LANG: "C",
  LC_ALL: "C",
};
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function privateRoot(label) {
  const root = await mkdtemp(path.join(tmpdir(), `hmg4v27-startup-${label}-`));
  const info = await stat(root);
  assert(info.isDirectory());
  assert.equal(path.resolve(root).startsWith(`${projectRoot}${path.sep}`), false);
  return root;
}

function run(command, args, options = {}) {
  return execFileAsync(command, args, {
    encoding: "utf8",
    timeout: 120_000,
    maxBuffer: 4 * 1024 * 1024,
    env: fixedEnvironment,
    ...options,
  });
}

test("Darwin startup-FD layer is bound to exact v2.7 source preimages", async () => {
  for (const [file, expected] of expectedHashes) {
    assert.equal(sha256(await readFile(file)), expected, path.basename(file));
  }
});

test("production startup-FD layer has only its closed Darwin FD inspection surface", async () => {
  const production = `${await readFile(header, "utf8")}\n${await readFile(source, "utf8")}`;
  for (const forbidden of [
    "open", "openat", "fopen", "opendir", "chdir", "fchdir", "unlink",
    "rename", "link", "socket", "connect", "send", "recv", "fork",
    "vfork", "posix_spawn", "execv", "execve", "system", "popen", "dlopen",
    "dlsym", "getenv", "setenv", "read", "write", "poll",
  ]) {
    assert.doesNotMatch(production, new RegExp(`\\b${forbidden}\\s*\\(`, "u"), forbidden);
  }
  assert.doesNotMatch(production, /\bint\s+main\s*\(/u);
  assert.match(production, /\bproc_pidinfo\s*\(/u);
  assert.match(production, /\bproc_pidfdinfo\s*\(/u);
  assert.match(production, /\bfstat\s*\(/u);
  assert.match(production, /\bfcntl\s*\(/u);
  assert.match(production, /\bmalloc\s*\(/u);
  assert.match(production, /\bfree\s*\(/u);
});

test("strict normalized startup-FD validators pass", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateRoot("strict");
  const executable = path.join(root, "unit");
  await run("/usr/bin/clang", [...strictFlags, source, unit, "-o", executable]);
  const result = await run(executable, []);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout, "darwin_startup_fd deterministic assertions: 21\n");
});

test("startup-FD validator passes 300,000-case ASan and UBSan fuzz", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateRoot("san");
  const executable = path.join(root, "fuzz");
  await run("/usr/bin/clang", [...sanitizerFlags, source, fuzz, "-o", executable]);
  const result = await run(executable, [], {
    env: {
      ...fixedEnvironment,
      ASAN_OPTIONS: "detect_leaks=0:halt_on_error=1",
      UBSAN_OPTIONS: "halt_on_error=1",
    },
  });
  assert.equal(result.stderr, "");
  assert.equal(result.stdout, "darwin_startup_fd deterministic fuzz cases: 300000\n");
});

test("real exec boundary admits only the exact three nonblocking pipe endpoints", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateRoot("launcher");
  const child = path.join(root, "child");
  const launcher = path.join(root, "launcher");
  await run("/usr/bin/clang", [...strictFlags, source, childSource, "-o", child]);
  await run("/usr/bin/clang", [...strictFlags, launcherSource, "-o", launcher]);
  for (const mode of ["valid", "extra", "blocking", "alias"]) {
    const result = await run(launcher, [child, mode]);
    assert.equal(result.stderr, "", mode);
    assert.equal(result.stdout, `darwin_startup_fd launcher mode ${mode}: pass\n`);
  }
});

test("startup-FD production object has a closed undefined-symbol surface and reproducible bytes", {
  skip: process.platform !== "darwin",
}, async () => {
  const first = await privateRoot("object-a");
  const second = await privateRoot("object-b");
  const firstObject = path.join(first, "startup.o");
  const secondObject = path.join(second, "startup.o");
  for (const output of [firstObject, secondObject]) {
    await run("/usr/bin/clang", [...strictFlags, "-c", source, "-o", output]);
  }
  const undefinedResult = await run("/usr/bin/nm", ["-u", firstObject]);
  assert.equal(undefinedResult.stderr, "");
  assert.deepEqual(undefinedResult.stdout.trim().split("\n").sort(), [
    "___stack_chk_fail", "___stack_chk_guard", "_bzero", "_fcntl", "_free",
    "_fstat", "_getpid", "_malloc", "_proc_pidfdinfo", "_proc_pidinfo",
  ]);
  assert.equal(sha256(await readFile(firstObject)), sha256(await readFile(secondObject)));
});
