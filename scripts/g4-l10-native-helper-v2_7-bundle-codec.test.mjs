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
const file = (name) => path.join(sourceRoot, name);
const coreSource = file("contract_core.c");
const tlvSource = file("canonical_tlv.c");
const header = file("bundle_codec.h");
const source = file("bundle_codec.c");
const unit = file("bundle_codec_test.c");
const fuzz = file("bundle_codec_fuzz.c");
const successor = path.join(projectRoot,
  "docs/G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR.md");
const gateA = path.join(projectRoot,
  "docs/G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md");

const expectedHashes = new Map([
  [successor, "bf0abed59f8db5be0ef83657530bc81cc93d85c9ae466461142c06933e569320"],
  [gateA, "eea802daf175c9235170e8758c564b52bef4371aa44b6746a8d89d2371c793c8"],
  [header, "843fd0e14e41d4883299ad3b52a78e037bad1c44315e7d03fe3388b532cfa164"],
  [source, "1a308f67d0aab16f97c200c7b3eccfd98b0ae2f64a9adbf6e7f2a8e5455d9bad"],
  [unit, "b30ebdb155ecb04e560b16be763ff7e6309c6413f1ea22c4d9483f0a10a4379f"],
  [fuzz, "e28276196bcb8c194f55a77a5046a462ee481d65e33a200ae7d94792349ebce0"],
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
  const root = await mkdtemp(path.join(tmpdir(), `hmg4v27-bundle-${label}-`));
  const info = await stat(root);
  assert(info.isDirectory());
  assert.equal(path.resolve(root).startsWith(`${projectRoot}${path.sep}`), false);
  return root;
}

function run(command, args, options = {}) {
  return execFileAsync(command, args, {
    encoding: "utf8", timeout: 120_000, maxBuffer: 8 * 1024 * 1024,
    env: fixedEnvironment, ...options,
  });
}

test("HMG4B2 codec binds exact v2.7 contract, review, and source preimages", async () => {
  for (const [artifact, expected] of expectedHashes) {
    assert.equal(sha256(await readFile(artifact)), expected, path.basename(artifact));
  }
});

test("HMG4B2 production codec has no ambient authority or mutation surface", async () => {
  const production = `${await readFile(header, "utf8")}\n${await readFile(source, "utf8")}`;
  for (const forbidden of [
    "malloc", "calloc", "realloc", "free", "open", "openat", "fopen",
    "opendir", "close", "read", "write", "poll", "fcntl", "flock",
    "fsync", "unlink", "rename", "link", "socket", "connect", "send",
    "recv", "fork", "vfork", "posix_spawn", "execv", "execve", "system",
    "popen", "dlopen", "dlsym", "getenv", "setenv",
  ]) {
    assert.doesNotMatch(production, new RegExp(`\\b${forbidden}\\s*\\(`, "u"), forbidden);
  }
  assert.doesNotMatch(production, /\bint\s+main\s*\(/u);
});

test("strict HMG4B2 header, table, entry, alignment, range, and hash vectors pass", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateRoot("strict");
  const executable = path.join(root, "unit");
  await run("/usr/bin/clang", [...strictFlags,
    coreSource, tlvSource, source, unit, "-o", executable]);
  const result = await run(executable, []);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout, "bundle_codec_test: all checks passed\n");
});

test("HMG4B2 codec passes 123,072 ASan and UBSan malformed/vector cases", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateRoot("san");
  const executable = path.join(root, "fuzz");
  await run("/usr/bin/clang", [...sanitizerFlags,
    coreSource, tlvSource, source, fuzz, "-o", executable]);
  const result = await run(executable, [], {
    env: {
      ...fixedEnvironment,
      ASAN_OPTIONS: "detect_leaks=0:halt_on_error=1",
      UBSAN_OPTIONS: "halt_on_error=1",
    },
  });
  assert.equal(result.stderr, "");
  assert.match(result.stdout,
    /^bundle_codec_fuzz: malformed=120000 aligned=60000 misaligned=60000 raw-valid-mutations=2048 rehash-table=512 rehash-data=512 checksum=[0-9a-f]{16}\n$/u);
});

test("HMG4B2 object has a closed symbol surface and reproducible bytes", {
  skip: process.platform !== "darwin",
}, async () => {
  const first = await privateRoot("object-a");
  const second = await privateRoot("object-b");
  const firstObject = path.join(first, "bundle.o");
  const secondObject = path.join(second, "bundle.o");
  for (const output of [firstObject, secondObject]) {
    await run("/usr/bin/clang", [...strictFlags, "-c", source, "-o", output]);
  }
  const undefinedResult = await run("/usr/bin/nm", ["-u", firstObject]);
  assert.deepEqual(undefinedResult.stdout.trim().split("\n").sort(), [
    "_CC_SHA256_Final", "_CC_SHA256_Init", "_CC_SHA256_Update",
    "___chkstk_darwin", "___stack_chk_fail", "___stack_chk_guard",
    "_hmg4v27_checked_add_size", "_hmg4v27_policy_rel_path_is_lexically_safe",
    "_hmg4v27_read_u32_be", "_hmg4v27_read_u64_be",
    "_hmg4v27_tlv_cursor_init", "_hmg4v27_tlv_next_raw", "_memcmp", "_memcpy",
  ].sort());
  assert.equal(sha256(await readFile(firstObject)), sha256(await readFile(secondObject)));
});
