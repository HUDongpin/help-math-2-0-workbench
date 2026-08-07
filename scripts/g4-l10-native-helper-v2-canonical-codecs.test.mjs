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
const sourceDirectory = path.join(
  projectRoot,
  "scripts/native/g4-l10-successor-v2",
);
const contractPath = path.join(
  projectRoot,
  "docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md",
);
const protocolSource = path.join(sourceDirectory, "protocol_core.c");
const canonicalSource = path.join(sourceDirectory, "canonical_objects.c");
const canonicalHeader = path.join(sourceDirectory, "canonical_objects.h");
const canonicalTest = path.join(sourceDirectory, "canonical_objects_test.c");
const canonicalFuzz = path.join(sourceDirectory, "canonical_objects_fuzz.c");
const bundleSource = path.join(sourceDirectory, "bundle_codec.c");
const bundleHeader = path.join(sourceDirectory, "bundle_codec.h");
const bundleTest = path.join(sourceDirectory, "bundle_codec_test.c");
const bundleFuzz = path.join(sourceDirectory, "bundle_codec_fuzz.c");

const expectedContractSha256 =
  "77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583";
const expectedSourceHashes = new Map([
  [canonicalHeader,
    "0af4f7e0eb3d8453a4db77b6b8de8b5b4f1ac3ebc7ac14be38c189bd41bf7514"],
  [canonicalSource,
    "e04ddd26dd29b5c1ff3deaf1f7cb947b4b252ccbf6d8cab467791b72dc0ae139"],
  [canonicalTest,
    "ed6e0b36a00489470dd72089333df6f3c3e7eac617fc711e8ed2513b7710a4c4"],
  [canonicalFuzz,
    "282f092e979296544e7eef915816a94e793df4afd553ee26ffb7e4cbb30bd493"],
  [bundleHeader,
    "f65659662251816c6d3db9d590c8b0089faba29971b339045ca4a00e9e27598c"],
  [bundleSource,
    "5be58699b15c9448b9776a9b447d92eed2f068a323ae002012ce9591ea0c4a02"],
  [bundleTest,
    "dde961c963febdd59d513d58b1ba8887661ba823f125dabcdf70cd9b76e8e8a9"],
  [bundleFuzz,
    "5a407a16780dcecf32df318c343f468133e04ffe5db2ce6a6ad55b91781582fe"],
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

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function privateBuildRoot(label) {
  const root = await mkdtemp(path.join(tmpdir(), `hmg4v2-${label}-`));
  const info = await stat(root);
  assert.ok(info.isDirectory());
  assert.equal(path.resolve(root).startsWith(`${projectRoot}${path.sep}`), false);
  return root;
}

async function run(command, args, options = {}) {
  return execFileAsync(command, args, {
    encoding: "utf8",
    timeout: 120_000,
    maxBuffer: 4 * 1024 * 1024,
    env: fixedEnvironment,
    ...options,
  });
}

function sanitizerEnvironment() {
  return {
    ...fixedEnvironment,
    ASAN_OPTIONS: "halt_on_error=1",
    UBSAN_OPTIONS: "halt_on_error=1",
  };
}

test("canonical and bundle sources match the independently frozen snapshot", async () => {
  const contract = await readFile(contractPath);
  assert.equal(sha256(contract), expectedContractSha256);
  for (const [file, expected] of expectedSourceHashes) {
    assert.equal(sha256(await readFile(file)), expected, path.basename(file));
  }
});

test("canonical and bundle production modules expose no ambient authority", async () => {
  const productionSource = (
    await Promise.all([
      readFile(canonicalSource, "utf8"),
      readFile(canonicalHeader, "utf8"),
      readFile(bundleSource, "utf8"),
      readFile(bundleHeader, "utf8"),
    ])
  ).join("\n");
  const forbiddenCalls = [
    "malloc", "calloc", "realloc", "free", "qsort", "unlink", "unlinkat",
    "remove", "rmdir", "system", "popen", "nftw", "fts", "syscall",
    "dlopen", "dlsym", "fork", "vfork", "posix_spawn", "posix_spawnp",
    "execv", "execve", "execvp", "execl", "execlp", "execle", "open",
    "openat", "rename", "renameat", "renameatx_np", "socket", "connect",
    "send", "recv",
  ];
  for (const name of forbiddenCalls) {
    assert.doesNotMatch(productionSource,
      new RegExp(`\\b${name}\\s*\\(`, "u"), name);
  }
  assert.doesNotMatch(productionSource, /\bint\s+main\s*\(/u);
});

test("strict canonical vectors and rejection matrix pass", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateBuildRoot("canonical-strict");
  const executable = path.join(root, "canonical-objects-test");
  await run("/usr/bin/clang", [
    ...strictFlags, canonicalSource, canonicalTest, "-o", executable,
  ]);
  const result = await run(executable, []);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
});

test("canonical vectors and 120,000-case fuzz pass ASan and UBSan", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateBuildRoot("canonical-san");
  const unitExecutable = path.join(root, "canonical-objects-test-san");
  const fuzzExecutable = path.join(root, "canonical-objects-fuzz-san");
  for (const [source, output] of [
    [canonicalTest, unitExecutable],
    [canonicalFuzz, fuzzExecutable],
  ]) {
    await run("/usr/bin/clang", [
      ...sanitizerFlags, canonicalSource, source, "-o", output,
    ]);
  }
  const unit = await run(unitExecutable, [], {env: sanitizerEnvironment()});
  assert.equal(unit.stdout, "");
  assert.equal(unit.stderr, "");
  const fuzz = await run(fuzzExecutable, [], {env: sanitizerEnvironment()});
  assert.equal(fuzz.stderr, "");
  assert.equal(fuzz.stdout,
    "canonical_objects_fuzz cases=120000 checksum=354897f3ec03ef99 " +
    "acl=72125/152797/52461/67539 xattr=67472/152682/50077/69923 " +
    "symlink=157445/182475/109960/10040 aligned=572498 misaligned=572498\n");
});

test("strict bundle vectors and rejection matrix pass", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateBuildRoot("bundle-strict");
  const executable = path.join(root, "bundle-codec-test");
  await run("/usr/bin/clang", [
    ...strictFlags, protocolSource, bundleSource, bundleTest, "-o", executable,
  ]);
  const result = await run(executable, []);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout, "bundle_codec_test: all checks passed\n");
});

test("bundle vectors and 120,000-case fuzz pass ASan and UBSan", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateBuildRoot("bundle-san");
  const unitExecutable = path.join(root, "bundle-codec-test-san");
  const fuzzExecutable = path.join(root, "bundle-codec-fuzz-san");
  for (const [source, output] of [
    [bundleTest, unitExecutable],
    [bundleFuzz, fuzzExecutable],
  ]) {
    await run("/usr/bin/clang", [
      ...sanitizerFlags,
      protocolSource,
      bundleSource,
      source,
      "-o",
      output,
    ]);
  }
  const unit = await run(unitExecutable, [], {env: sanitizerEnvironment()});
  assert.equal(unit.stderr, "");
  assert.equal(unit.stdout, "bundle_codec_test: all checks passed\n");
  const fuzz = await run(fuzzExecutable, [], {env: sanitizerEnvironment()});
  assert.equal(fuzz.stderr, "");
  assert.equal(fuzz.stdout,
    "bundle_codec_fuzz: malformed=120000 aligned=60000 misaligned=60000 " +
    "raw-valid-mutations=2048 rehash-table=512 rehash-data=512 " +
    "checksum=535c3e7f2680d73a\n");
});

test("codec objects have exact reviewed symbols and reproducible bytes", {
  skip: process.platform !== "darwin",
}, async () => {
  const firstRoot = await privateBuildRoot("codec-repro-a");
  const secondRoot = await privateBuildRoot("codec-repro-b");
  const definitions = [
    {
      source: canonicalSource,
      name: "canonical-objects.o",
      symbols: [
        "_CC_SHA256_Final", "_CC_SHA256_Init", "_CC_SHA256_Update",
        "___stack_chk_fail", "___stack_chk_guard", "_memcmp", "_memcpy",
      ],
    },
    {
      source: bundleSource,
      name: "bundle-codec.o",
      symbols: [
        "_CC_SHA256_Final", "_CC_SHA256_Init", "_CC_SHA256_Update",
        "___chkstk_darwin", "___stack_chk_fail", "___stack_chk_guard",
        "_hmg4v2_checked_add_size",
        "_hmg4v2_policy_rel_path_is_lexically_safe", "_hmg4v2_range_within",
        "_hmg4v2_read_u32_be", "_hmg4v2_read_u64_be",
        "_hmg4v2_tlv_cursor_init", "_hmg4v2_tlv_next", "_memcmp", "_memcpy",
      ],
    },
  ];
  for (const definition of definitions) {
    const first = path.join(firstRoot, definition.name);
    const second = path.join(secondRoot, definition.name);
    for (const output of [first, second]) {
      await run("/usr/bin/clang", [
        ...strictFlags, "-c", definition.source, "-o", output,
      ]);
    }
    const symbols = await run("/usr/bin/nm", ["-u", first]);
    assert.deepEqual(
      symbols.stdout.trim().split(/\r?\n/u).filter(Boolean).sort(),
      [...definition.symbols].sort(),
      definition.name,
    );
    const [firstBytes, secondBytes] = await Promise.all([
      readFile(first),
      readFile(second),
    ]);
    assert.equal(sha256(firstBytes), sha256(secondBytes), definition.name);
    assert.deepEqual(firstBytes, secondBytes, definition.name);
  }
});
