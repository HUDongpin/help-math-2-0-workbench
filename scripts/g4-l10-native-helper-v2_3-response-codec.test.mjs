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
const sourceRoot = path.join(projectRoot, "scripts/native/g4-l10-successor-v2_3");
const file = (name) => path.join(sourceRoot, name);
const coreSource = file("contract_core.c");
const coreHeader = file("contract_core.h");
const tlvSource = file("canonical_tlv.c");
const tlvHeader = file("canonical_tlv.h");
const header = file("response_codec.h");
const source = file("response_codec.c");
const unit = file("response_codec_test.c");
const fuzz = file("response_codec_fuzz.c");
const successor = path.join(projectRoot,
  "docs/G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR.md");
const gateA = path.join(projectRoot,
  "docs/G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md");

const expectedHashes = new Map([
  [successor, "bf0abed59f8db5be0ef83657530bc81cc93d85c9ae466461142c06933e569320"],
  [gateA, "eea802daf175c9235170e8758c564b52bef4371aa44b6746a8d89d2371c793c8"],
  [coreSource, "eb26ff27c1ff0261003fbc524c7a45f78be222068a33be8421da395b73999f52"],
  [coreHeader, "0c05d082730fc595a40f12e02e9be91ef6dff02609ed6362f2d036eb20d2de36"],
  [tlvSource, "6d17612a96a6d1dce994e3caa2fde62431a82bb326037032cde5958b8e00c47c"],
  [tlvHeader, "03326b2217eded7803a1b0337b2f32fe99cdb4f9e63eec8d08c6962d09de4518"],
  [header, "fb4c1bbeb426a35e8e88e5206ef3e1fe378e739cfd44dc76db90f3143b00b8f0"],
  [source, "f625224b26d907d62d4e2774a0937c8e0e098af5a4ac0db41405dfce183ba83a"],
  [unit, "b1b8ac43c306f76a63090dc647aac7e044a193b192d638c64c94997f6d3c0af1"],
  [fuzz, "3b23baf5fa4ec5a5033d93b0fc9e117010b0a74153f278f7f7862c1d8b7aa64f"],
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
  const root = await mkdtemp(path.join(tmpdir(), `hmg4v23-response-${label}-`));
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

test("HMG4R2 codec binds the exact successor, Gate-A, core, and TLV preimages", async () => {
  for (const [artifact, expected] of expectedHashes) {
    assert.equal(sha256(await readFile(artifact)), expected, path.basename(artifact));
  }
});

test("HMG4R2 production codec has no ambient authority or transport surface", async () => {
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

test("strict HMG4R2 operation, status, diagnostic, custody, and framing vectors pass", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateRoot("strict");
  const executable = path.join(root, "unit");
  await run("/usr/bin/clang", [...strictFlags,
    coreSource, tlvSource, source, unit, "-o", executable]);
  const result = await run(executable, []);
  assert.equal(result.stderr, "");
  assert.match(result.stdout,
    /^response_codec_test: all checks passed \(assertions=1474\)\n$/u);
});

test("HMG4R2 codec passes 300,000 ASan and UBSan malformed and semantic cases", {
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
    /^response_codec_fuzz: total=300000 random=100000 mutated=100000 fields=100000 checksum=[0-9a-f]{16}\n$/u);
});

test("HMG4R2 object has a closed symbol surface and reproducible bytes", {
  skip: process.platform !== "darwin",
}, async () => {
  const first = await privateRoot("object-a");
  const second = await privateRoot("object-b");
  const firstObject = path.join(first, "response.o");
  const secondObject = path.join(second, "response.o");
  for (const output of [firstObject, secondObject]) {
    await run("/usr/bin/clang", [...strictFlags, "-c", source, "-o", output]);
  }
  const undefinedResult = await run("/usr/bin/nm", ["-u", firstObject]);
  assert.deepEqual(undefinedResult.stdout.trim().split("\n").sort(), [
    "___stack_chk_fail", "___stack_chk_guard", "_hmg4v23_checked_add_size",
    "_hmg4v23_parse_custody_leaf", "_hmg4v23_range_within",
    "_hmg4v23_read_u32_be", "_hmg4v23_read_u64_be", "_hmg4v23_sha256",
    "_hmg4v23_tlv_cursor_init", "_hmg4v23_tlv_next_raw",
    "_hmg4v23_validate_diagnostic_status", "_hmg4v23_write_u16_be",
    "_hmg4v23_write_u32_be", "_hmg4v23_write_u64_be", "_memmove",
  ].sort());
  assert.equal(sha256(await readFile(firstObject)), sha256(await readFile(secondObject)));
});
