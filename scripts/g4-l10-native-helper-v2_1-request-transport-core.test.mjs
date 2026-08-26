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
const sourceRoot = path.join(projectRoot, "scripts/native/g4-l10-successor-v2_1");
const coreHeader = path.join(sourceRoot, "contract_core.h");
const coreSource = path.join(sourceRoot, "contract_core.c");
const header = path.join(sourceRoot, "request_transport_core.h");
const source = path.join(sourceRoot, "request_transport_core.c");
const unit = path.join(sourceRoot, "request_transport_core_test.c");
const fuzz = path.join(sourceRoot, "request_transport_core_fuzz.c");
const successor = path.join(projectRoot,
  "docs/G4_L10_NATIVE_HELPER_V2_1_SECURITY_CONTRACT_SUCCESSOR.md");
const predecessor = path.join(projectRoot,
  "docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md");
const gateA = path.join(projectRoot,
  "docs/G4_L10_NATIVE_HELPER_V2_1_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md");

const expectedHashes = new Map([
  [successor, "170bd54b031f1f6e693f152aef885a509b2d4328f5032cc620a41dcf49a884ab"],
  [predecessor, "77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583"],
  [gateA, "7fa23b8b5c4506e9e519c2bc22d063445491295bab27ec433cf6749ee2f70123"],
  [coreHeader, "fb7030c4f021495641da6a75874002307d8dbd30527d3f4bf6ec8deb249ea3c8"],
  [coreSource, "4055593a0b72fb9a19c7746c3bd93fe45377cbf23600eccfd88e64a702ec1920"],
  [header, "a7709aeb0ba4f7c2e9c4c08ab30d81b9979fae9d99be9f61478e9f5d28f91844"],
  [source, "8f27e2ef35eddc090ffe02a6397e7ce75f453582e4a397613d2242bf25de48d1"],
  [unit, "48e8b22aa3cc27415b8624c145a3a9187e4738574824de32aadeb57c9e5a5a5b"],
  [fuzz, "4aaf3f8aff56818377d7e5c6889066cc63057cfd684d2c4cf91269b1d981804f"],
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
  const root = await mkdtemp(path.join(tmpdir(), `hmg4v21-transport-${label}-`));
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
    "_hmg4v21_checked_add_size",
    "_hmg4v21_read_u32_be",
    "_hmg4v21_read_u64_be",
  ]);
  const definedResult = await run("/usr/bin/nm", ["-gU", firstObject]);
  assert.equal(definedResult.stderr, "");
  const definedSymbols = definedResult.stdout.trim().split("\n")
    .map((line) => line.trim().split(/\s+/u).at(-1)).sort();
  assert.deepEqual(definedSymbols, [
    "_hmg4v21_checked_add_u64",
    "_hmg4v21_deadline_from_start",
    "_hmg4v21_diagnostic_write_decide",
    "_hmg4v21_parse_request_header",
    "_hmg4v21_poll_timeout_ms",
    "_hmg4v21_request_read_decide",
    "_hmg4v21_response_write_decide",
    "_hmg4v21_timespec_parts_to_ns",
    "_hmg4v21_transport_result_name",
    "_hmg4v21_validate_buffered_request_frame",
  ].sort());
  assert.equal(sha256(await readFile(firstObject)), sha256(await readFile(secondObject)));
});
