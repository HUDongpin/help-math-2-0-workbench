import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {mkdtemp, readFile, stat} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(projectRoot, "scripts/native/g4-l10-successor-v2_3");
const coreHeader = path.join(sourceRoot, "contract_core.h");
const coreSource = path.join(sourceRoot, "contract_core.c");
const header = path.join(sourceRoot, "request_transport_core.h");
const source = path.join(sourceRoot, "request_transport_core.c");
const unit = path.join(sourceRoot, "request_transport_core_test.c");
const fuzz = path.join(sourceRoot, "request_transport_core_fuzz.c");
const successor = path.join(projectRoot,
  "docs/G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR.md");
const predecessor = path.join(projectRoot,
  "docs/G4_L10_NATIVE_HELPER_V2_2_SECURITY_CONTRACT_SUCCESSOR.md");
const gateA = path.join(projectRoot,
  "docs/G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md");

const expectedHashes = new Map([
  [successor, "bf0abed59f8db5be0ef83657530bc81cc93d85c9ae466461142c06933e569320"],
  [predecessor, "d7bb8755cbd8fb3a7f4d709d1ec2879f8aee4fa8b8ad4cbacfd7e5068a9eeb5c"],
  [gateA, "eea802daf175c9235170e8758c564b52bef4371aa44b6746a8d89d2371c793c8"],
  [coreHeader, "0c05d082730fc595a40f12e02e9be91ef6dff02609ed6362f2d036eb20d2de36"],
  [coreSource, "eb26ff27c1ff0261003fbc524c7a45f78be222068a33be8421da395b73999f52"],
  [header, "a288a488c51195f1463582141c6ec2aa62294609e7a87b9b30ce4bb471b6b8a3"],
  [source, "9beb115aa78a457c9e09a03d1f4cb6305eb232ea490e05c5595864e38b52c2da"],
  [unit, "33379143fa086179531f1a2b3ee278dac54dd1c6077e39a8882a7970ee09d1da"],
  [fuzz, "6201a4402e25d4bea99da199abaaacda58e2059f80ec16aa215a7de21c704e97"],
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
  PATH: "/usr/bin:/bin:/usr/sbin:/sbin", LANG: "C", LC_ALL: "C",
};
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function privateRoot(label) {
  const root = await mkdtemp(path.join(tmpdir(), `hmg4v23-transport-${label}-`));
  const info = await stat(root);
  assert.ok(info.isDirectory());
  assert.equal(path.resolve(root).startsWith(`${projectRoot}${path.sep}`), false);
  return root;
}

function run(command, args, options = {}) {
  return execFileAsync(command, args, {
    encoding: "utf8", timeout: 120_000, maxBuffer: 4 * 1024 * 1024,
    env: fixedEnvironment, ...options,
  });
}

test("request transport core binds the frozen successor, Gate-A, and source preimages", async () => {
  for (const [file, expected] of expectedHashes) {
    assert.equal(sha256(await readFile(file)), expected, path.basename(file));
  }
});

test("request transport core is syscall-free and has no dispatcher", async () => {
  const production = `${await readFile(header, "utf8")}\n${await readFile(source, "utf8")}`;
  for (const name of [
    "malloc", "calloc", "realloc", "free", "open", "openat", "close",
    "read", "write", "poll", "fcntl", "flock", "fsync", "unlink",
    "unlinkat", "remove", "rmdir", "rename", "renameat", "renameatx_np",
    "link", "linkat", "clonefile", "fork", "vfork", "posix_spawn",
    "execv", "execve", "system", "popen", "dlopen", "dlsym", "socket",
    "connect", "send", "recv", "getentropy", "clock_gettime",
  ]) {
    assert.doesNotMatch(production, new RegExp(`\\b${name}\\s*\\(`, "u"), name);
  }
  assert.doesNotMatch(production, /\bint\s+main\s*\(/u);
});

test("strict header, frame, deadline, read, response, and diagnostic tests pass", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateRoot("strict");
  const executable = path.join(root, "request-transport-core-test");
  await run("/usr/bin/clang", [
    ...strictFlags, coreSource, source, unit, "-o", executable,
  ]);
  const result = await run(executable, []);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout, "request-transport-core assertions=101\n");
});

test("request transport unit and 300,000-case fuzz pass ASan and UBSan", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateRoot("san");
  const unitExecutable = path.join(root, "request-transport-core-test-san");
  const fuzzExecutable = path.join(root, "request-transport-core-fuzz-san");
  await run("/usr/bin/clang", [
    ...sanitizerFlags, coreSource, source, unit, "-o", unitExecutable,
  ]);
  await run("/usr/bin/clang", [
    ...sanitizerFlags, coreSource, source, fuzz, "-o", fuzzExecutable,
  ]);
  const env = {
    ...fixedEnvironment,
    ASAN_OPTIONS: "detect_leaks=0:halt_on_error=1",
    UBSAN_OPTIONS: "halt_on_error=1",
  };
  const unitResult = await run(unitExecutable, [], {env});
  assert.equal(unitResult.stderr, "");
  assert.equal(unitResult.stdout, "request-transport-core assertions=101\n");
  const fuzzResult = await run(fuzzExecutable, [], {env});
  assert.equal(fuzzResult.stderr, "");
  assert.equal(fuzzResult.stdout, "request-transport-core fuzz cases=300000\n");
});

test("request transport object has exact symbols and reproducible bytes", {
  skip: process.platform !== "darwin",
}, async () => {
  const first = await privateRoot("repro-a");
  const second = await privateRoot("repro-b");
  const firstObject = path.join(first, "request-transport-core.o");
  const secondObject = path.join(second, "request-transport-core.o");
  for (const output of [firstObject, secondObject]) {
    await run("/usr/bin/clang", [...strictFlags, "-c", source, "-o", output]);
  }
  const undefinedResult = await run("/usr/bin/nm", ["-u", firstObject]);
  assert.equal(undefinedResult.stderr, "");
  assert.deepEqual(undefinedResult.stdout.trim().split("\n").sort(), [
    "_CC_SHA256",
    "___stack_chk_fail",
    "___stack_chk_guard",
    "_hmg4v23_checked_add_size",
    "_hmg4v23_read_u32_be",
    "_hmg4v23_read_u64_be",
  ]);
  const definedResult = await run("/usr/bin/nm", ["-gU", firstObject]);
  assert.equal(definedResult.stderr, "");
  const definedSymbols = definedResult.stdout.trim().split("\n")
    .map((line) => line.trim().split(/\s+/u).at(-1)).sort();
  assert.deepEqual(definedSymbols, [
    "_hmg4v23_checked_add_u64",
    "_hmg4v23_deadline_from_start",
    "_hmg4v23_diagnostic_write_decide",
    "_hmg4v23_parse_request_header",
    "_hmg4v23_poll_timeout_ms",
    "_hmg4v23_request_read_decide",
    "_hmg4v23_response_write_decide",
    "_hmg4v23_timespec_parts_to_ns",
    "_hmg4v23_transport_result_name",
    "_hmg4v23_validate_buffered_request_frame",
  ].sort());
  assert.equal(sha256(await readFile(firstObject)), sha256(await readFile(secondObject)));
});
