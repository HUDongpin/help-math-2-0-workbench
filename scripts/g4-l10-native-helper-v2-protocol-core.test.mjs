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
const coreSource = path.join(sourceDirectory, "protocol_core.c");
const coreHeader = path.join(sourceDirectory, "protocol_core.h");
const unitSource = path.join(sourceDirectory, "protocol_core_test.c");
const fuzzSource = path.join(sourceDirectory, "protocol_core_fuzz.c");
const contractPath = path.join(
  projectRoot,
  "docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md",
);
const expectedContractSha256 =
  "77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583";

const strictFlags = [
  "-std=c11",
  "-Wall",
  "-Wextra",
  "-Wpedantic",
  "-Wconversion",
  "-Wsign-conversion",
  "-Wshadow",
  "-Wformat=2",
  "-Werror",
  "-O2",
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
    timeout: 60_000,
    maxBuffer: 4 * 1024 * 1024,
    env: fixedEnvironment,
    ...options,
  });
}

test("workspace protocol core is bound to the exact reviewed contract", async () => {
  const contract = await readFile(contractPath);
  assert.equal(sha256(contract), expectedContractSha256);
  const [source, header] = await Promise.all([
    readFile(coreSource, "utf8"),
    readFile(coreHeader, "utf8"),
  ]);
  const normalizedHeader = header.replace(/\\\r?\n\s*/gu, "");
  const macroMatch = normalizedHeader.match(
    /#define\s+HMG4V2_PROTOCOL_SPEC_SHA256_HEX\s+"([0-9a-f]{64})"/u,
  );
  assert.ok(macroMatch);
  assert.equal(macroMatch[1], expectedContractSha256);
  const arrayMatch = source.match(
    /const\s+uint8_t\s+hmg4v2_protocol_spec_sha256\[32\]\s*=\s*\{([^}]*)\}/u,
  );
  assert.ok(arrayMatch);
  const arrayHex = [...arrayMatch[1].matchAll(/0x([0-9a-f]{2})/gu)]
    .map((match) => match[1]).join("");
  assert.equal(arrayHex.length, 64);
  assert.equal(arrayHex, expectedContractSha256);
  assert.match(header, /hmg4v2_authority_validation_status/u);
  assert.match(source,
    /return HMG4V2_CORE_UNFROZEN_AUTHORITY;/u);
  assert.doesNotMatch(source, /\bint\s+main\s*\(/u);
});

test("core source exposes no namespace, process, dynamic-symbol, or network primitive", async () => {
  const [source, header] = await Promise.all([
    readFile(coreSource, "utf8"),
    readFile(coreHeader, "utf8"),
  ]);
  const productionCore = `${source}\n${header}`;
  const forbiddenCalls = [
    "unlink", "unlinkat", "remove", "rmdir", "system", "popen",
    "nftw", "fts", "syscall", "dlopen", "dlsym", "fork", "vfork",
    "posix_spawn", "posix_spawnp", "execv", "execve", "execvp",
    "execl", "execlp", "execle", "open", "openat", "rename",
    "renameat", "renameatx_np", "socket", "connect", "send", "recv",
  ];
  for (const name of forbiddenCalls) {
    assert.doesNotMatch(productionCore,
      new RegExp(`\\b${name}\\s*\\(`, "u"), name);
  }
  for (const headerName of [
    "fcntl.h", "unistd.h", "sys/stat.h", "sys/socket.h", "spawn.h",
    "dlfcn.h", "netdb.h",
  ]) {
    assert.doesNotMatch(productionCore,
      new RegExp(`#include\\s*[<\"]${headerName.replace(".", "\\.")}`, "u"),
      headerName);
  }
});

test("strict native build and 177-assertion corpus pass", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateBuildRoot("strict");
  const executable = path.join(root, "protocol-core-test");
  await run("/usr/bin/clang", [
    ...strictFlags,
    coreSource,
    unitSource,
    "-o",
    executable,
  ]);
  const result = await run(executable, []);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout,
    "HMG4V2_PROTOCOL_CORE_TEST_PASS assertions=177\n");
});

test("ASan and UBSan native build passes the same corpus", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateBuildRoot("san");
  const executable = path.join(root, "protocol-core-test-san");
  await run("/usr/bin/clang", [
    "-std=c11", "-Wall", "-Wextra", "-Werror", "-O1", "-g",
    "-fno-omit-frame-pointer", "-fsanitize=address,undefined",
    coreSource, unitSource, "-o", executable,
  ]);
  const result = await run(executable, [], {
    env: {
      ...fixedEnvironment,
      ASAN_OPTIONS: "halt_on_error=1",
      UBSAN_OPTIONS: "halt_on_error=1",
    },
  });
  assert.equal(result.stderr, "");
  assert.equal(result.stdout,
    "HMG4V2_PROTOCOL_CORE_TEST_PASS assertions=177\n");
});

test("ASan and UBSan pass 200,000 deterministic aligned and misaligned inputs", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateBuildRoot("fuzz");
  const executable = path.join(root, "protocol-core-fuzz-san");
  await run("/usr/bin/clang", [
    "-std=c11", "-Wall", "-Wextra", "-Werror", "-O1", "-g",
    "-fno-omit-frame-pointer", "-fsanitize=address,undefined",
    coreSource, fuzzSource, "-o", executable,
  ]);
  const result = await run(executable, [], {
    timeout: 120_000,
    env: {
      ...fixedEnvironment,
      ASAN_OPTIONS: "halt_on_error=1",
      UBSAN_OPTIONS: "halt_on_error=1",
    },
  });
  assert.equal(result.stderr, "");
  assert.equal(result.stdout,
    "HMG4V2_PROTOCOL_CORE_FUZZ_PASS cases=200000 checks=82 " +
    "seed_final=67e28be985e085bd\n");
});

test("optimized core object has the exact reviewed undefined-symbol surface", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateBuildRoot("symbols");
  const objectPath = path.join(root, "protocol-core.o");
  const executable = path.join(root, "protocol-core-test");
  await run("/usr/bin/clang", [
    ...strictFlags,
    "-c",
    coreSource,
    "-o",
    objectPath,
  ]);
  const symbols = await run("/usr/bin/nm", ["-u", objectPath]);
  assert.deepEqual(
    symbols.stdout.trim().split(/\r?\n/u).filter(Boolean).sort(),
    ["_CC_SHA256", "___stack_chk_fail", "___stack_chk_guard", "_memcmp"],
  );
  await run("/usr/bin/clang", [
    ...strictFlags,
    coreSource,
    unitSource,
    "-o",
    executable,
  ]);
  const libraries = await run("/usr/bin/otool", ["-L", executable]);
  const libraryLines = libraries.stdout.trim().split(/\r?\n/u).slice(1)
    .map((line) => line.trim().split(/\s+/u)[0]);
  assert.deepEqual(libraryLines, ["/usr/lib/libSystem.B.dylib"]);
});

test("two independent optimized object builds are byte-identical", {
  skip: process.platform !== "darwin",
}, async () => {
  const firstRoot = await privateBuildRoot("repro-a");
  const secondRoot = await privateBuildRoot("repro-b");
  const first = path.join(firstRoot, "protocol-core.o");
  const second = path.join(secondRoot, "protocol-core.o");
  for (const output of [first, second]) {
    await run("/usr/bin/clang", [
      ...strictFlags,
      "-c",
      coreSource,
      "-o",
      output,
    ]);
  }
  const [firstBytes, secondBytes] = await Promise.all([
    readFile(first),
    readFile(second),
  ]);
  assert.equal(sha256(firstBytes), sha256(secondBytes));
  assert.deepEqual(firstBytes, secondBytes);
});
