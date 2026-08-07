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
const sourceRoot = path.join(projectRoot, "scripts/native/g4-l10-successor-v2_7");
const readme = path.join(sourceRoot, "README.md");
const coreHeader = path.join(sourceRoot, "contract_core.h");
const coreSource = path.join(sourceRoot, "contract_core.c");
const header = path.join(sourceRoot, "canonical_tlv.h");
const source = path.join(sourceRoot, "canonical_tlv.c");
const unit = path.join(sourceRoot, "canonical_tlv_test.c");
const fuzz = path.join(sourceRoot, "canonical_tlv_fuzz.c");
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
  [readme, "2a17280ad11b8ec6cf78172434202cef276957a62be563122affdc65d23db779"],
  [header, "03326b2217eded7803a1b0337b2f32fe99cdb4f9e63eec8d08c6962d09de4518"],
  [source, "6d17612a96a6d1dce994e3caa2fde62431a82bb326037032cde5958b8e00c47c"],
  [unit, "a12954996c64ee11e1c77c3bce007acb38133c6dedaba365e610f2cb75b37876"],
  [fuzz, "c7450d86145ca3e989689a358b8188b6709ce50bd518e73439a648dfb0042803"],
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
  const root = await mkdtemp(path.join(tmpdir(), `hmg4v27-tlv-${label}-`));
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
  assert.doesNotMatch(production, /G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR\.md/u);
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
    "_hmg4v27_read_u32_be",
    "_hmg4v27_read_u64_be",
    "_hmg4v27_tlv_type_site_is_legal",
    "_memcmp",
  ]);
  const definedResult = await run("/usr/bin/nm", ["-gU", firstObject]);
  assert.equal(definedResult.stderr, "");
  const definedSymbols = definedResult.stdout.trim().split("\n")
    .map((line) => line.trim().split(/\s+/u).at(-1)).sort();
  assert.deepEqual(definedSymbols, [
    "_hmg4v27_approved_abs_root_is_lexically_safe",
    "_hmg4v27_build_rel_path_is_lexically_safe",
    "_hmg4v27_observed_custody_leaf_is_lexically_safe",
    "_hmg4v27_parse_custody_leaf",
    "_hmg4v27_parse_fixture_attempt",
    "_hmg4v27_parse_fixture_root",
    "_hmg4v27_policy_rel_path_is_lexically_safe",
    "_hmg4v27_tlv_cursor_init",
    "_hmg4v27_tlv_next_raw",
    "_hmg4v27_tlv_result_name",
    "_hmg4v27_validate_evidence_path",
    "_hmg4v27_validate_fixture_claim",
    "_hmg4v27_validate_fixture_root",
    "_hmg4v27_validate_tlv_schema",
  ].sort());
  assert.equal(sha256(await readFile(firstObject)), sha256(await readFile(secondObject)));
});
