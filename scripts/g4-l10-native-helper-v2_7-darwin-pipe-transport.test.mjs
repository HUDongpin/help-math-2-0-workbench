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
const file = (name) => path.join(sourceRoot, name);
const successor = path.join(projectRoot,
  "docs/G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR.md");
const gateA = path.join(projectRoot,
  "docs/G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md");
const coreHeader = file("contract_core.h");
const coreSource = file("contract_core.c");
const tlvHeader = file("canonical_tlv.h");
const tlvSource = file("canonical_tlv.c");
const requestHeader = file("request_transport_core.h");
const requestSource = file("request_transport_core.c");
const responseHeader = file("response_codec.h");
const responseSource = file("response_codec.c");
const startupHeader = file("darwin_startup_fd.h");
const startupSource = file("darwin_startup_fd.c");
const header = file("darwin_pipe_transport.h");
const testingHeader = file("darwin_pipe_transport_testing.h");
const source = file("darwin_pipe_transport.c");
const unit = file("darwin_pipe_transport_test.c");
const childSource = file("darwin_pipe_transport_child.c");
const launcherSource = file("darwin_pipe_transport_launcher_test.c");
const readme = file("README.md");

const expectedHashes = new Map([
  [successor, "bf0abed59f8db5be0ef83657530bc81cc93d85c9ae466461142c06933e569320"],
  [gateA, "eea802daf175c9235170e8758c564b52bef4371aa44b6746a8d89d2371c793c8"],
  [coreHeader, "0c05d082730fc595a40f12e02e9be91ef6dff02609ed6362f2d036eb20d2de36"],
  [coreSource, "eb26ff27c1ff0261003fbc524c7a45f78be222068a33be8421da395b73999f52"],
  [tlvHeader, "03326b2217eded7803a1b0337b2f32fe99cdb4f9e63eec8d08c6962d09de4518"],
  [tlvSource, "6d17612a96a6d1dce994e3caa2fde62431a82bb326037032cde5958b8e00c47c"],
  [requestHeader, "a288a488c51195f1463582141c6ec2aa62294609e7a87b9b30ce4bb471b6b8a3"],
  [requestSource, "9beb115aa78a457c9e09a03d1f4cb6305eb232ea490e05c5595864e38b52c2da"],
  [responseHeader, "fb4c1bbeb426a35e8e88e5206ef3e1fe378e739cfd44dc76db90f3143b00b8f0"],
  [responseSource, "f625224b26d907d62d4e2774a0937c8e0e098af5a4ac0db41405dfce183ba83a"],
  [startupHeader, "ffe192bbacf43440c0c3f78e636fbdb8ef3ed072e1c7f635d05bc89310b5af7e"],
  [startupSource, "8a99a70a6f8a78014c0c4eb42ae1230e0d2b40475a8bae2f1eafd175eefc253b"],
  [header, "d751f5cccc1d7ba6076dce0e0970c380d7aa2fa40a5b8b0530f60db506645cdb"],
  [testingHeader, "18b7be60d482459928ee73aa7685aee3f9a8a9df780ba7f62c8d3821b7dc2bde"],
  [source, "173442156cd75b3fff5dec7a45290118ea6b7ad508e631c8fe67107e58a8ef16"],
  [unit, "ceb965a3e321ad365f285a9a138e01d9d23ab46fc37999ec69331b6d0e641563"],
  [childSource, "09a2ba982e8148de65085e9187bd8dd8ab5e94f61f62a9aa24c7ac29063c0f6d"],
  [launcherSource, "9fb567ba9fe88827944609f032e361b45f39bc30b6f33577a061721159dfa449"],
  [readme, "2a17280ad11b8ec6cf78172434202cef276957a62be563122affdc65d23db779"],
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
const sharedCodecSources = [
  coreSource, tlvSource, requestSource, responseSource,
];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function privateRoot(label) {
  const root = await mkdtemp(path.join(tmpdir(), `hmg4v27-darwin-pipe-${label}-`));
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

test("Darwin pipe transport binds the exact contract, Gate-A, and source preimages", async () => {
  for (const [artifact, expected] of expectedHashes) {
    assert.equal(sha256(await readFile(artifact)), expected, path.basename(artifact));
  }
});

test("production transport exposes no caller-injected backend, dispatcher, path, or mutation API", async () => {
  const productionHeader = await readFile(header, "utf8");
  const productionSource = await readFile(source, "utf8");
  assert.doesNotMatch(productionHeader, /test_backend|TRANSPORT_TESTING/u);
  assert.match(productionSource, /#ifdef HMG4V27_TRANSPORT_TESTING/u);
  assert.doesNotMatch(productionSource, /\bint\s+main\s*\(/u);
  for (const forbidden of [
    "open", "openat", "fopen", "opendir", "fstat", "stat", "lstat",
    "flock", "fsync", "unlink", "unlinkat", "remove", "rmdir",
    "rename", "renameat", "renameatx_np", "link", "linkat", "clonefile",
    "socket", "connect", "send", "recv", "fork", "vfork", "posix_spawn",
    "execv", "execve", "system", "popen", "dlopen", "dlsym", "getenv",
    "setenv", "getentropy",
  ]) {
    assert.doesNotMatch(productionSource,
      new RegExp(`\\b${forbidden}\\s*\\(`, "u"), forbidden);
  }
});

test("strict injected transport boundary vectors pass", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateRoot("strict");
  const executable = path.join(root, "unit");
  await run("/usr/bin/clang", [
    "-DHMG4V27_TRANSPORT_TESTING=1", ...strictFlags,
    ...sharedCodecSources, source, unit, "-o", executable,
  ]);
  const result = await run(executable, []);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout,
    "darwin_pipe_transport_test: all checks passed (assertions=133)\n");
});

test("injected transport vectors pass ASan and UBSan", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateRoot("san");
  const executable = path.join(root, "unit-san");
  await run("/usr/bin/clang", [
    "-DHMG4V27_TRANSPORT_TESTING=1", ...sanitizerFlags,
    ...sharedCodecSources, source, unit, "-o", executable,
  ]);
  const result = await run(executable, [], {
    env: {
      ...fixedEnvironment,
      ASAN_OPTIONS: "detect_leaks=0:halt_on_error=1",
      UBSAN_OPTIONS: "halt_on_error=1",
    },
  });
  assert.equal(result.stderr, "");
  assert.equal(result.stdout,
    "darwin_pipe_transport_test: all checks passed (assertions=133)\n");
});

test("real exec boundary carries one valid frame and one fixed invalid-header token", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateRoot("real");
  const child = path.join(root, "child");
  const launcher = path.join(root, "launcher");
  await run("/usr/bin/clang", [
    ...strictFlags, ...sharedCodecSources, startupSource, source, childSource,
    "-o", child,
  ]);
  await run("/usr/bin/clang", [
    ...strictFlags, coreSource, tlvSource, responseSource, launcherSource,
    "-o", launcher,
  ]);
  for (const mode of ["valid", "invalid-header"]) {
    const result = await run(launcher, [child, mode]);
    assert.equal(result.stderr, "");
    assert.equal(result.stdout,
      `darwin_pipe_transport launcher mode ${mode}: pass\n`);
  }
});

test("Clang static analyzer accepts production and test-bound transport builds", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await privateRoot("analyze");
  for (const [label, prefix] of [
    ["production", []],
    ["test", ["-DHMG4V27_TRANSPORT_TESTING=1"]],
  ]) {
    const output = path.join(root, `${label}.plist`);
    const result = await run("/usr/bin/clang", [
      "--analyze", ...prefix, ...strictFlags.slice(0, -1), source, "-o", output,
    ]);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr, "");
    assert((await stat(output)).size > 0);
  }
});

test("production transport object has a closed symbol surface and reproducible bytes", {
  skip: process.platform !== "darwin",
}, async () => {
  const first = await privateRoot("object-a");
  const second = await privateRoot("object-b");
  const firstObject = path.join(first, "transport.o");
  const secondObject = path.join(second, "transport.o");
  for (const output of [firstObject, secondObject]) {
    await run("/usr/bin/clang", [...strictFlags, "-c", source, "-o", output]);
  }
  const definedResult = await run("/usr/bin/nm", ["-gU", firstObject]);
  const defined = definedResult.stdout.trim().split("\n")
    .map((line) => line.trim().split(/\s+/u).at(-1)).sort();
  assert.deepEqual(defined, [
    "_hmg4v27_emit_response_fd1",
    "_hmg4v27_install_and_verify_sigpipe_ignore",
    "_hmg4v27_pipe_result_diagnostic_code",
    "_hmg4v27_pipe_result_exit_code",
    "_hmg4v27_pipe_result_name",
    "_hmg4v27_receive_request_fd0",
    "_hmg4v27_release_received_request",
  ].sort());
  assert.equal(defined.some((symbol) => symbol.includes("test")), false);
  const undefinedResult = await run("/usr/bin/nm", ["-u", firstObject]);
  assert.deepEqual(undefinedResult.stdout.trim().split("\n").sort(), [
    "___error", "___stack_chk_fail", "___stack_chk_guard", "_clock_gettime",
    "_fcntl", "_free", "_hmg4v27_checked_add_size",
    "_hmg4v27_deadline_from_start", "_hmg4v27_diagnostic_write_decide",
    "_hmg4v27_parse_request_header", "_hmg4v27_poll_decide",
    "_hmg4v27_poll_timeout_ms", "_hmg4v27_request_read_decide",
    "_hmg4v27_response_write_decide", "_hmg4v27_sha256",
    "_hmg4v27_timespec_parts_to_ns", "_hmg4v27_validate_buffered_request_frame",
    "_hmg4v27_validate_response_frame", "_malloc", "_poll", "_read",
    "_sigaction", "_write",
  ].sort());
  assert.equal(sha256(await readFile(firstObject)), sha256(await readFile(secondObject)));
});
