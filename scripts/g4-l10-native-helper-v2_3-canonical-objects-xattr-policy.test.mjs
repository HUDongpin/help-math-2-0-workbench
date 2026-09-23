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
const successor = path.join(projectRoot,
  "docs/G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR.md");
const gateA = path.join(projectRoot,
  "docs/G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md");

const coreSource = file("contract_core.c");
const tlvSource = file("canonical_tlv.c");
const canonicalHeader = file("canonical_objects.h");
const canonicalSource = file("canonical_objects.c");
const canonicalUnit = file("canonical_objects_test.c");
const canonicalFuzz = file("canonical_objects_fuzz.c");
const policyHeader = file("xattr_policy.h");
const policySource = file("xattr_policy.c");
const policyUnit = file("xattr_policy_test.c");
const policyFuzz = file("xattr_policy_fuzz.c");

const expectedHashes = new Map([
  [successor, "bf0abed59f8db5be0ef83657530bc81cc93d85c9ae466461142c06933e569320"],
  [gateA, "eea802daf175c9235170e8758c564b52bef4371aa44b6746a8d89d2371c793c8"],
  [canonicalHeader, "e242f5a60236492d65196080adb4f18d1ac4834e5b44ad9dace458f8fdcb6b33"],
  [canonicalSource, "bd467ae812aded9bc0c633f965f7e248cdd12caf3e75681987df7ef12e9d9e4b"],
  [canonicalUnit, "7bbbf4c8392777a5d53fe8b159fd2f981d0cdc2b33e4e1dc34e7989cfe591635"],
  [canonicalFuzz, "090af67cbf5c5ef45e54119ce205dba5ae86b56e693cc6f817fc22ce93413da4"],
  [policyHeader, "99b72b161f179df8aa1872a2e23501292323e8cffcefd7a3c46f1bc6c474809f"],
  [policySource, "f36f4040e117e911e2496ae388dc3025b4c124485f1dbb408873d462d58eede1"],
  [policyUnit, "6aca9541e571cb5224dc02faf36394bdf63ff291e4f3368d71e74a4c1b583286"],
  [policyFuzz, "752570df1c693f5c2afd47855f7eeaa2785a577d3821ee2ed9128c557e0d2bad"],
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
  const root = await mkdtemp(path.join(tmpdir(), `hmg4v23-xattr-${label}-`));
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

test("canonical objects and HMG4Y2 policy bind exact frozen preimages", async () => {
  for (const [artifact, expected] of expectedHashes) {
    assert.equal(sha256(await readFile(artifact)), expected, path.basename(artifact));
  }
});

test("canonical-object and HMG4Y2 production sources have no ambient authority", async () => {
  const production = [canonicalHeader, canonicalSource, policyHeader, policySource]
    .map(async (artifact) => readFile(artifact, "utf8"));
  const bytes = (await Promise.all(production)).join("\n");
  for (const forbidden of [
    "malloc", "calloc", "realloc", "free", "open", "openat", "fopen",
    "opendir", "close", "read", "write", "poll", "fcntl", "flock",
    "fsync", "unlink", "rename", "link", "socket", "connect", "send",
    "recv", "fork", "vfork", "posix_spawn", "execv", "execve", "system",
    "popen", "dlopen", "dlsym", "getenv", "setenv",
  ]) {
    assert.doesNotMatch(bytes, new RegExp(`\\b${forbidden}\\s*\\(`, "u"), forbidden);
  }
  assert.doesNotMatch(bytes, /\bint\s+main\s*\(/u);
});

test("strict canonical ACL, HMG4X2, symlink, and HMG4Y2 vectors pass", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateRoot("strict");
  const canonicalExecutable = path.join(root, "canonical-unit");
  const policyExecutable = path.join(root, "policy-unit");
  await run("/usr/bin/clang", [...strictFlags,
    canonicalSource, canonicalUnit, "-o", canonicalExecutable]);
  await run(canonicalExecutable, []);
  await run("/usr/bin/clang", [...strictFlags,
    coreSource, tlvSource, canonicalSource, policySource, policyUnit,
    "-o", policyExecutable]);
  const policyResult = await run(policyExecutable, []);
  assert.equal(policyResult.stderr, "");
  assert.equal(policyResult.stdout, "xattr_policy assertions=27\n");
});

test("canonical objects and HMG4Y2 pass 420,000 sanitizer fuzz cases", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateRoot("san");
  const canonicalExecutable = path.join(root, "canonical-fuzz");
  const policyExecutable = path.join(root, "policy-fuzz");
  const env = {
    ...fixedEnvironment,
    ASAN_OPTIONS: "detect_leaks=0:halt_on_error=1",
    UBSAN_OPTIONS: "halt_on_error=1",
  };
  await run("/usr/bin/clang", [...sanitizerFlags,
    canonicalSource, canonicalFuzz, "-o", canonicalExecutable]);
  const canonicalResult = await run(canonicalExecutable, [], { env });
  assert.match(canonicalResult.stdout, /^canonical_objects_fuzz cases=120000 /u);
  assert.equal(canonicalResult.stderr, "");
  await run("/usr/bin/clang", [...sanitizerFlags,
    coreSource, tlvSource, canonicalSource, policySource, policyFuzz,
    "-o", policyExecutable]);
  const policyResult = await run(policyExecutable, [], { env });
  assert.equal(policyResult.stderr, "");
  assert.match(policyResult.stdout,
    /^xattr_policy fuzz cases=300000 accepted=[0-9]+ rejected=[0-9]+\n$/u);
});

test("canonical-object and HMG4Y2 objects have closed symbol surfaces and reproducible bytes", {
  skip: process.platform !== "darwin",
}, async () => {
  const first = await privateRoot("object-a");
  const second = await privateRoot("object-b");
  const modules = [
    {
      source: canonicalSource,
      name: "canonical",
      undefinedSymbols: [
        "_CC_SHA256_Final", "_CC_SHA256_Init", "_CC_SHA256_Update",
        "___stack_chk_fail", "___stack_chk_guard", "_memcmp", "_memcpy",
      ],
    },
    {
      source: policySource,
      name: "policy",
      undefinedSymbols: [
        "_CC_SHA256_Final", "_CC_SHA256_Init", "_CC_SHA256_Update",
        "___stack_chk_fail", "___stack_chk_guard", "_bzero",
        "_hmg4v23_read_u32_be", "_hmg4v23_read_u64_be",
        "_hmg4v23_successor_sha256", "_hmg4v23_tlv_cursor_init",
        "_hmg4v23_tlv_next_raw", "_hmg4v23_validate_authority_envelope",
        "_hmg4v23_validate_tlv_schema", "_memcmp",
      ],
    },
  ];
  for (const module of modules) {
    const one = path.join(first, `${module.name}.o`);
    const two = path.join(second, `${module.name}.o`);
    await run("/usr/bin/clang", [...strictFlags, "-c", module.source, "-o", one]);
    await run("/usr/bin/clang", [...strictFlags, "-c", module.source, "-o", two]);
    const undefinedResult = await run("/usr/bin/nm", ["-u", one]);
    assert.deepEqual(undefinedResult.stdout.trim().split("\n").sort(),
      [...module.undefinedSymbols].sort(), module.name);
    assert.equal(sha256(await readFile(one)), sha256(await readFile(two)), module.name);
  }
});
