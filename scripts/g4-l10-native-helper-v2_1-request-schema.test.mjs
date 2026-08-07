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
const tlvHeader = path.join(sourceRoot, "canonical_tlv.h");
const tlvSource = path.join(sourceRoot, "canonical_tlv.c");
const header = path.join(sourceRoot, "request_schema.h");
const source = path.join(sourceRoot, "request_schema.c");
const unit = path.join(sourceRoot, "request_schema_test.c");
const fuzz = path.join(sourceRoot, "request_schema_fuzz.c");
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
  [tlvHeader, "acc37747417eb5072279e2e600819a72e29aab4fe3c67f35ce757cb6fce7cfde"],
  [tlvSource, "45621ae7a46058facc7c3f9dfd7dff88f2b83413d6a616d0e8e3c5e0fba475ea"],
  [header, "92875c995f6c27b22c091a3a26289f5552ad80933d57db3489f6a3d36618a5e2"],
  [source, "f4d4f4de8fd85ddb2ee54f0a6e8bd48fda663594b212e542cbc6c1af249073fb"],
  [unit, "c141e07263d7711451b48f5e95a3ccb6c2118f82ceaaf58b8673832d68b31501"],
  [fuzz, "0dfdbb2102bb3429dac03d45a8e25b69de83a5ecffd24fc20408cb18efa21ddc"],
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
  const root = await mkdtemp(path.join(tmpdir(), `hmg4v21-request-${label}-`));
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

test("request schema binds the frozen successor, Gate-A, TLV, and source preimages", async () => {
  for (const [file, expected] of expectedHashes) {
    assert.equal(sha256(await readFile(file)), expected, path.basename(file));
  }
});

test("request schema production layer exposes no ambient authority or dispatcher", async () => {
  const production = `${await readFile(header, "utf8")}\n${await readFile(source, "utf8")}`;
  for (const name of [
    "malloc", "calloc", "realloc", "free", "open", "openat", "close",
    "read", "write", "poll", "fcntl", "flock", "fsync", "unlink",
    "unlinkat", "remove", "rmdir", "rename", "renameat", "renameatx_np",
    "link", "linkat", "clonefile", "fork", "vfork", "posix_spawn",
    "execv", "execve", "system", "popen", "dlopen", "dlsym", "socket",
    "connect", "send", "recv", "getentropy",
  ]) {
    assert.doesNotMatch(production, new RegExp(`\\b${name}\\s*\\(`, "u"), name);
  }
  assert.doesNotMatch(production, /\bint\s+main\s*\(/u);
});

test("strict successor request operation matrices and cross-bindings pass", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateRoot("strict");
  const executable = path.join(root, "request-schema-test");
  await run("/usr/bin/clang", [
    ...strictFlags, coreSource, tlvSource, source, unit, "-o", executable,
  ]);
  const result = await run(executable, []);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout, "request-schema assertions=69608\n");
});

test("request schema unit and 1,024-case mutation fuzz pass ASan and UBSan", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateRoot("san");
  const unitExecutable = path.join(root, "request-schema-test-san");
  const fuzzExecutable = path.join(root, "request-schema-fuzz-san");
  await run("/usr/bin/clang", [
    ...sanitizerFlags, coreSource, tlvSource, source, unit, "-o", unitExecutable,
  ]);
  await run("/usr/bin/clang", [
    ...sanitizerFlags, coreSource, tlvSource, source, fuzz, "-o", fuzzExecutable,
  ]);
  const env = {
    ...fixedEnvironment,
    ASAN_OPTIONS: "detect_leaks=0:halt_on_error=1",
    UBSAN_OPTIONS: "halt_on_error=1",
  };
  const unitResult = await run(unitExecutable, [], {env});
  assert.equal(unitResult.stderr, "");
  assert.equal(unitResult.stdout, "request-schema assertions=69608\n");
  const fuzzResult = await run(fuzzExecutable, [], {env});
  assert.equal(fuzzResult.stderr, "");
  assert.equal(fuzzResult.stdout, "request-schema fuzz cases=1024\n");
});

test("request schema object has exact symbols and reproducible bytes", {
  skip: process.platform !== "darwin",
}, async () => {
  const first = await privateRoot("repro-a");
  const second = await privateRoot("repro-b");
  const firstObject = path.join(first, "request-schema.o");
  const secondObject = path.join(second, "request-schema.o");
  for (const output of [firstObject, secondObject]) {
    await run("/usr/bin/clang", [...strictFlags, "-c", source, "-o", output]);
  }
  const undefinedResult = await run("/usr/bin/nm", ["-u", firstObject]);
  assert.equal(undefinedResult.stderr, "");
  assert.deepEqual(undefinedResult.stdout.trim().split("\n").sort(), [
    "___stack_chk_fail",
    "___stack_chk_guard",
    "_hmg4v21_approved_abs_root_is_lexically_safe",
    "_hmg4v21_parse_custody_leaf",
    "_hmg4v21_policy_rel_path_is_lexically_safe",
    "_hmg4v21_read_u32_be",
    "_hmg4v21_read_u64_be",
    "_hmg4v21_successor_sha256",
    "_hmg4v21_tlv_cursor_init",
    "_hmg4v21_tlv_next_raw",
    "_hmg4v21_validate_evidence_path",
    "_hmg4v21_validate_tlv_schema",
    "_memcmp",
  ]);
  const definedResult = await run("/usr/bin/nm", ["-gU", firstObject]);
  assert.equal(definedResult.stderr, "");
  const definedSymbols = definedResult.stdout.trim().split("\n")
    .map((line) => line.trim().split(/\s+/u).at(-1)).sort();
  assert.deepEqual(definedSymbols, [
    "_hmg4v21_request_result_name",
    "_hmg4v21_validate_request_payload",
  ]);
  assert.equal(sha256(await readFile(firstObject)), sha256(await readFile(secondObject)));
});
