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
const readme = path.join(sourceRoot, "README.md");
const coreHeader = path.join(sourceRoot, "contract_core.h");
const coreSource = path.join(sourceRoot, "contract_core.c");
const header = path.join(sourceRoot, "canonical_tlv.h");
const source = path.join(sourceRoot, "canonical_tlv.c");
const unit = path.join(sourceRoot, "canonical_tlv_test.c");
const fuzz = path.join(sourceRoot, "canonical_tlv_fuzz.c");
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
  [readme, "ee16c7efe688efc9466b98d2c728feafadb806aad7fdccfe6c1cd420e20b5ade"],
  [header, "acc37747417eb5072279e2e600819a72e29aab4fe3c67f35ce757cb6fce7cfde"],
  [source, "45621ae7a46058facc7c3f9dfd7dff88f2b83413d6a616d0e8e3c5e0fba475ea"],
  [unit, "a3e7dceba3d15a7e5ac9cb99b4695da77d923904c25a5c93bf639f610c98d8cc"],
  [fuzz, "a9e9715fc177c57cd1b19b0a619f5f3c08e524717fae3b642c23a6d1fbdf8387"],
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
  const root = await mkdtemp(path.join(tmpdir(), `hmg4v21-tlv-${label}-`));
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

test("canonical TLV layer binds the frozen contract, Gate-A, core, and source preimages", async () => {
  for (const [file, expected] of expectedHashes) {
    assert.equal(sha256(await readFile(file)), expected, path.basename(file));
  }
});

test("canonical TLV production layer exposes no ambient authority or dispatcher", async () => {
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
  assert.doesNotMatch(production, /G4_L10_NATIVE_HELPER_V2_1_SECURITY_CONTRACT_SUCCESSOR\.md/u);
});

test("strict canonical framing, schema, path, custody, and list tests pass", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateRoot("strict");
  const executable = path.join(root, "canonical-tlv-test");
  await run("/usr/bin/clang", [
    ...strictFlags, coreSource, source, unit, "-o", executable,
  ]);
  const result = await run(executable, []);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout, "canonical-tlv assertions=218\n");
});

test("canonical TLV unit and 300,000-case fuzz pass ASan and UBSan", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateRoot("san");
  const unitExecutable = path.join(root, "canonical-tlv-test-san");
  const fuzzExecutable = path.join(root, "canonical-tlv-fuzz-san");
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
  assert.equal(unitResult.stdout, "canonical-tlv assertions=218\n");
  const fuzzResult = await run(fuzzExecutable, [], {env});
  assert.equal(fuzzResult.stderr, "");
  assert.equal(fuzzResult.stdout, "canonical-tlv fuzz cases=300000\n");
});

test("canonical TLV object has exact symbols and reproducible bytes", {
  skip: process.platform !== "darwin",
}, async () => {
  const first = await privateRoot("repro-a");
  const second = await privateRoot("repro-b");
  const firstObject = path.join(first, "canonical-tlv.o");
  const secondObject = path.join(second, "canonical-tlv.o");
  for (const output of [firstObject, secondObject]) {
    await run("/usr/bin/clang", [...strictFlags, "-c", source, "-o", output]);
  }
  const undefinedResult = await run("/usr/bin/nm", ["-u", firstObject]);
  assert.equal(undefinedResult.stderr, "");
  assert.deepEqual(undefinedResult.stdout.trim().split("\n").sort(), [
    "_hmg4v21_read_u32_be",
    "_hmg4v21_read_u64_be",
    "_hmg4v21_tlv_type_site_is_legal",
    "_memcmp",
  ]);
  const definedResult = await run("/usr/bin/nm", ["-gU", firstObject]);
  assert.equal(definedResult.stderr, "");
  const definedSymbols = definedResult.stdout.trim().split("\n")
    .map((line) => line.trim().split(/\s+/u).at(-1)).sort();
  assert.deepEqual(definedSymbols, [
    "_hmg4v21_approved_abs_root_is_lexically_safe",
    "_hmg4v21_build_rel_path_is_lexically_safe",
    "_hmg4v21_observed_custody_leaf_is_lexically_safe",
    "_hmg4v21_parse_custody_leaf",
    "_hmg4v21_parse_fixture_attempt",
    "_hmg4v21_parse_fixture_root",
    "_hmg4v21_policy_rel_path_is_lexically_safe",
    "_hmg4v21_tlv_cursor_init",
    "_hmg4v21_tlv_next_raw",
    "_hmg4v21_tlv_result_name",
    "_hmg4v21_validate_evidence_path",
    "_hmg4v21_validate_fixture_claim",
    "_hmg4v21_validate_fixture_root",
    "_hmg4v21_validate_tlv_schema",
  ].sort());
  assert.equal(sha256(await readFile(firstObject)), sha256(await readFile(secondObject)));
});
