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
const header = path.join(sourceRoot, "contract_core.h");
const source = path.join(sourceRoot, "contract_core.c");
const unit = path.join(sourceRoot, "contract_core_test.c");
const fuzz = path.join(sourceRoot, "contract_core_fuzz.c");
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
  [header, "fb7030c4f021495641da6a75874002307d8dbd30527d3f4bf6ec8deb249ea3c8"],
  [source, "4055593a0b72fb9a19c7746c3bd93fe45377cbf23600eccfd88e64a702ec1920"],
  [unit, "4798fa4cb29de8004f796c3842ec8862dd7c89e5713095464c38bbc52c4c7764"],
  [fuzz, "f3bc5abd34477521b752f4c1d96a9ffa83ba4ae0b615543ab900d79fe741cd01"],
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
  const root = await mkdtemp(path.join(tmpdir(), `hmg4v21-${label}-`));
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

test("v2.1 core binds the exact frozen contract, Gate-A, and source preimages", async () => {
  for (const [file, expected] of expectedHashes) {
    assert.equal(sha256(await readFile(file)), expected, path.basename(file));
  }
});

test("v2.1 core exposes no ambient filesystem, process, network, or allocator authority", async () => {
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

test("strict v2.1 registry, framing, direction, and transport matrix passes", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateRoot("strict");
  const executable = path.join(root, "contract-core-test");
  await run("/usr/bin/clang", [...strictFlags, source, unit, "-o", executable]);
  const result = await run(executable, []);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout, "contract-core assertions=755\n");
});

test("v2.1 unit and 300,000-case fuzz pass ASan and UBSan", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateRoot("san");
  const unitExecutable = path.join(root, "contract-core-test-san");
  const fuzzExecutable = path.join(root, "contract-core-fuzz-san");
  await run("/usr/bin/clang", [...sanitizerFlags, source, unit, "-o", unitExecutable]);
  await run("/usr/bin/clang", [...sanitizerFlags, source, fuzz, "-o", fuzzExecutable]);
  const env = {...fixedEnvironment,
    ASAN_OPTIONS: "detect_leaks=0:halt_on_error=1", UBSAN_OPTIONS: "halt_on_error=1"};
  const unitResult = await run(unitExecutable, [], {env});
  assert.equal(unitResult.stderr, "");
  assert.equal(unitResult.stdout, "contract-core assertions=755\n");
  const fuzzResult = await run(fuzzExecutable, [], {env});
  assert.equal(fuzzResult.stderr, "");
  assert.equal(fuzzResult.stdout, "contract-core fuzz cases=300000\n");
});

test("v2.1 core object has exact symbols and reproducible bytes", {
  skip: process.platform !== "darwin",
}, async () => {
  const first = await privateRoot("repro-a");
  const second = await privateRoot("repro-b");
  const firstObject = path.join(first, "contract-core.o");
  const secondObject = path.join(second, "contract-core.o");
  for (const output of [firstObject, secondObject]) {
    await run("/usr/bin/clang", [...strictFlags, "-c", source, "-o", output]);
  }
  const undefinedResult = await run("/usr/bin/nm", ["-u", firstObject]);
  assert.equal(undefinedResult.stderr, "");
  assert.deepEqual(undefinedResult.stdout.trim().split("\n").sort(), [
    "_CC_SHA256", "___stack_chk_fail", "___stack_chk_guard",
  ]);
  assert.equal(sha256(await readFile(firstObject)), sha256(await readFile(secondObject)));
});
