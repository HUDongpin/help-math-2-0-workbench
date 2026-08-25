#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  realpath,
  rm,
} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {
  captureProductionPrecommitClosure,
  createAdaptiveCanvasBatchPlan,
  readStableOrdinaryFile,
} from "./generate-adaptive-canvas-batch.mjs";
import {
  ADAPTIVE_ATOMIC_COMMIT_PROTOCOL,
  ADAPTIVE_ATOMIC_EXPECTED_ENTRY_COUNT,
  adaptiveAtomicStaticContractBytes,
  adaptiveAtomicStaticContractSha256,
  buildAdaptiveAtomicCommitEntries,
  inspectAdaptiveAtomicCommitHelper,
} from "./lib/adaptive-canvas-atomic-commit.mjs";

const execFile = promisify(execFileCallback);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SOURCE_PATH = "scripts/native/adaptive-canvas-atomic-commit.c";
const DRIVER_PATH = "scripts/lib/adaptive-canvas-atomic-commit.mjs";
const NATIVE_TEST_PATH = "scripts/adaptive-canvas-atomic-commit.test.mjs";
const BUILD_SCRIPT_PATH = "scripts/build-adaptive-canvas-atomic-commit.mjs";
const TARGET_PATH = "scripts/native/adaptive-canvas-atomic-commit-v2";
const RECEIPT_PATH = "work/adaptive-canvas-atomic-commit-build.v2.json";
const PLAN_PATH = "work/adaptive-canvas-production-five.plan.v9.json";
const COMPILE_ARGUMENTS = Object.freeze([
  "-std=c17",
  "-O2",
  "-Wall",
  "-Wextra",
  "-Werror",
  "-Wno-deprecated-declarations",
]);
const IDENTIFIER = "ai.helpmath.adaptive-canvas-atomic-commit";
const CLEAN_ENV = Object.freeze({LANG: "C", LC_ALL: "C", PATH: "/usr/bin:/bin"});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object" && !Buffer.isBuffer(value)) {
    return Object.fromEntries(Object.keys(value).sort().map((key) =>
      [key, sortValue(value[key])]
    ));
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(sortValue(value));
}

function receiptBytes(payload) {
  const document = {
    schemaVersion: 1,
    receiptType: "adaptive-canvas-native-atomic-commit-build-v2",
    payloadSha256: sha256(Buffer.from(canonicalJson(payload))),
    payload,
  };
  return Buffer.from(`${JSON.stringify(sortValue(document), null, 2)}\n`);
}

async function toolObservation(tool, arguments_) {
  const bytes = await readFile(tool);
  const {stdout, stderr} = await execFile(tool, arguments_, {
    encoding: "utf8",
    env: CLEAN_ENV,
    timeout: 30_000,
    maxBuffer: 1024 * 1024,
  });
  return {
    path: tool,
    bytes: bytes.length,
    sha256: sha256(bytes),
    output: `${stdout}${stderr}`.trim(),
  };
}

async function nativeToolchain() {
  const {stdout: clangOutput} = await execFile(
    "/usr/bin/xcrun",
    ["--sdk", "macosx", "--find", "clang"],
    {encoding: "utf8", env: CLEAN_ENV, timeout: 30_000},
  );
  const {stdout: sdkOutput} = await execFile(
    "/usr/bin/xcrun",
    ["--sdk", "macosx", "--show-sdk-path"],
    {encoding: "utf8", env: CLEAN_ENV, timeout: 30_000},
  );
  const clang = await realpath(clangOutput.trim());
  const sdk = await realpath(sdkOutput.trim());
  const codesignBytes = await readFile("/usr/bin/codesign");
  return {
    xcrun: await toolObservation("/usr/bin/xcrun", ["--version"]),
    clang: await toolObservation(clang, ["--version"]),
    codesign: {
      path: "/usr/bin/codesign",
      bytes: codesignBytes.length,
      sha256: sha256(codesignBytes),
      output: "identity-bound-system-tool-no-version-flag",
    },
    sdk,
  };
}

function patchUuid(bytes, uuidHex) {
  if (bytes.readUInt32LE(0) !== 0xfeedfacf || !/^[a-f0-9]{32}$/u.test(uuidHex)) {
    throw new Error("native helper is not the expected thin Mach-O64 image");
  }
  const commands = bytes.readUInt32LE(16);
  let offset = 32;
  let uuidCount = 0;
  for (let index = 0; index < commands; index += 1) {
    const command = bytes.readUInt32LE(offset);
    const size = bytes.readUInt32LE(offset + 4);
    if (size < 8 || offset + size > bytes.length) {
      throw new Error("native helper contains an invalid Mach-O load command");
    }
    if (command === 0x1b) {
      if (size !== 24) throw new Error("native helper LC_UUID has an invalid size");
      Buffer.from(uuidHex, "hex").copy(bytes, offset + 8);
      uuidCount += 1;
    }
    offset += size;
  }
  if (uuidCount !== 1) throw new Error("native helper must contain exactly one LC_UUID");
}

async function compileOne({directory, sourcePath, staticContractSha256, uuidHex, toolchain}) {
  const output = path.join(directory, "adaptive-canvas-atomic-commit");
  await execFile("/usr/bin/xcrun", [
    "--sdk", "macosx", "clang", ...COMPILE_ARGUMENTS,
    `-DADAPTIVE_ATOMIC_STATIC_CONTRACT_SHA256=\"${staticContractSha256}\"`,
    `-DADAPTIVE_ATOMIC_EXPECTED_ENTRY_COUNT=${ADAPTIVE_ATOMIC_EXPECTED_ENTRY_COUNT}`,
    "-DADAPTIVE_ATOMIC_PRODUCTION=1",
    sourcePath,
    "-o", output,
  ], {
    encoding: "utf8",
    env: {...CLEAN_ENV, TMPDIR: `${directory}${path.sep}`},
    timeout: 60_000,
    maxBuffer: 1024 * 1024,
  });
  const unsigned = await readFile(output);
  patchUuid(unsigned, uuidHex);
  const handle = await open(output, fsConstants.O_WRONLY | fsConstants.O_TRUNC);
  try {
    await handle.writeFile(unsigned);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await execFile("/usr/bin/codesign", [
    "--force", "--sign", "-", "--timestamp=none", "--identifier", IDENTIFIER,
    output,
  ], {encoding: "utf8", env: CLEAN_ENV, timeout: 30_000, maxBuffer: 1024 * 1024});
  await chmod(output, 0o555);
  const bytes = await readFile(output);
  return {
    path: output,
    bytes,
    identity: {bytes: bytes.length, sha256: sha256(bytes)},
    toolchain,
  };
}

async function installExact(target, bytes) {
  const existing = await readStableOrdinaryFile(target, "installed native helper")
    .catch((error) => error?.code === "MISSING_FILE" ? null : Promise.reject(error));
  if (existing) {
    if (!existing.bytes.equals(bytes) || (existing.identity.mode & 0o777) !== 0o555) {
      throw new Error("installed native helper exists with different bytes or mode");
    }
    return {status: "existing-identical", identity: existing.identity};
  }
  const handle = await open(
    target,
    fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL |
      (fsConstants.O_NOFOLLOW ?? 0),
    0o555,
  );
  try {
    await handle.writeFile(bytes);
    await handle.chmod(0o555);
    await handle.sync();
  } finally {
    await handle.close();
  }
  const parent = await open(path.dirname(target),
    fsConstants.O_RDONLY | (fsConstants.O_DIRECTORY ?? 0) |
      (fsConstants.O_NOFOLLOW ?? 0));
  try {
    await parent.sync();
  } finally {
    await parent.close();
  }
  const installed = await readStableOrdinaryFile(target, "installed native helper");
  if (!installed.bytes.equals(bytes) || (installed.identity.mode & 0o777) !== 0o555) {
    throw new Error("installed native helper failed post-publication verification");
  }
  return {status: "installed-no-replace", identity: installed.identity};
}

async function writeReceiptExact(target, expected) {
  const current = await readStableOrdinaryFile(target, "native helper build receipt")
    .catch((error) => error?.code === "MISSING_FILE" ? null : Promise.reject(error));
  if (current) {
    if (!current.bytes.equals(expected)) throw new Error("build receipt exists with different bytes");
    return {status: "existing-identical", sha256: current.identity.sha256};
  }
  const handle = await open(target,
    fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL |
      (fsConstants.O_NOFOLLOW ?? 0), 0o444);
  try {
    await handle.writeFile(expected);
    await handle.chmod(0o444);
    await handle.sync();
  } finally {
    await handle.close();
  }
  return {status: "created-no-replace", sha256: sha256(expected)};
}

export async function buildAdaptiveCanvasAtomicCommit({checkOnly = false} = {}) {
  if (process.platform !== "darwin") throw new Error("Darwin is required");
  const sourceAbsolute = path.join(PROJECT_ROOT, SOURCE_PATH);
  const targetAbsolute = path.join(PROJECT_ROOT, TARGET_PATH);
  const receiptAbsolute = path.join(PROJECT_ROOT, RECEIPT_PATH);
  const [source, driver, nativeTest, buildScript, planReceipt, toolchain] = await Promise.all([
    readStableOrdinaryFile(sourceAbsolute, "native helper source"),
    readStableOrdinaryFile(path.join(PROJECT_ROOT, DRIVER_PATH), "native helper driver"),
    readStableOrdinaryFile(path.join(PROJECT_ROOT, NATIVE_TEST_PATH), "native helper test"),
    readStableOrdinaryFile(path.join(PROJECT_ROOT, BUILD_SCRIPT_PATH), "native helper build script"),
    readStableOrdinaryFile(path.join(PROJECT_ROOT, PLAN_PATH), "v9 plan"),
    nativeToolchain(),
  ]);
  const plan = await createAdaptiveCanvasBatchPlan({projectRoot: PROJECT_ROOT});
  const precondition = await captureProductionPrecommitClosure({
    projectRoot: PROJECT_ROOT,
    plan,
  });
  const entries = buildAdaptiveAtomicCommitEntries({
    plan,
    precondition,
    projectRoot: PROJECT_ROOT,
  });
  const staticContractBytes = adaptiveAtomicStaticContractBytes(entries);
  const staticContractSha256 = adaptiveAtomicStaticContractSha256(entries);
  const uuidHex = sha256(Buffer.concat([
    source.bytes,
    staticContractBytes,
    Buffer.from(canonicalJson(toolchain)),
  ])).slice(0, 32);
  const temporaryParent = path.join(PROJECT_ROOT, "work");
  await mkdir(temporaryParent, {recursive: true});
  const firstDirectory = await mkdtemp(path.join(temporaryParent, ".atomic-build-a-"));
  const secondDirectory = await mkdtemp(path.join(temporaryParent, ".atomic-build-b-"));
  let first;
  try {
    [first] = await Promise.all([
      compileOne({
        directory: firstDirectory,
        sourcePath: sourceAbsolute,
        staticContractSha256,
        uuidHex,
        toolchain,
      }),
      compileOne({
        directory: secondDirectory,
        sourcePath: sourceAbsolute,
        staticContractSha256,
        uuidHex,
        toolchain,
      }),
    ]).then(([left, right]) => {
      if (!left.bytes.equals(right.bytes)) {
        throw new Error("independent native helper builds are not byte-identical");
      }
      return [left, right];
    });
    const installed = checkOnly
      ? await readStableOrdinaryFile(targetAbsolute, "installed native helper")
      : await installExact(targetAbsolute, first.bytes);
    const installedIdentity = checkOnly ? installed.identity : installed.identity;
    if (installedIdentity.sha256 !== first.identity.sha256 ||
        (installedIdentity.mode & 0o777) !== 0o555) {
      throw new Error("installed helper does not match reproducible build");
    }
    const capability = await inspectAdaptiveAtomicCommitHelper({
      helperPath: targetAbsolute,
      expectedHelperSha256: first.identity.sha256,
    });
    if (capability.capability.staticContractSha256 !== staticContractSha256) {
      throw new Error("installed helper capability binds the wrong static contract");
    }
    const payload = {
      status: "pass",
      boundary: "native-atomic-capability-only-no-browser-no-apply",
      protocol: ADAPTIVE_ATOMIC_COMMIT_PROTOCOL,
      source: {path: SOURCE_PATH, ...source.identity},
      driver: {path: DRIVER_PATH, ...driver.identity},
      nativeTest: {path: NATIVE_TEST_PATH, ...nativeTest.identity},
      buildScript: {path: BUILD_SCRIPT_PATH, ...buildScript.identity},
      predecessorPlan: {path: PLAN_PATH, ...planReceipt.identity},
      staticContract: {
        schemaVersion: 1,
        entryCount: entries.length,
        bytes: staticContractBytes.length,
        sha256: staticContractSha256,
        firstTarget: entries[0].targetPath,
        penultimateTarget: entries.at(-2).targetPath,
        finalTarget: entries.at(-1).targetPath,
      },
      build: {
        compiler: toolchain,
        arguments: COMPILE_ARGUMENTS,
        deterministicUuid: uuidHex,
        codeSignIdentifier: IDENTIFIER,
        independentBuildCount: 2,
        byteIdentical: true,
      },
      installedHelper: {
        path: TARGET_PATH,
        bytes: first.identity.bytes,
        sha256: first.identity.sha256,
        mode: 0o555,
        capability: capability.capability,
      },
      mutationBoundary: {
        browserStarted: false,
        applyInvoked: false,
        productionRendererWritten: false,
        v2ProfileWritten: false,
        activeBindingWritten: false,
        deploymentChanged: false,
      },
    };
    const expectedReceipt = receiptBytes(payload);
    if (checkOnly) {
      const observed = await readStableOrdinaryFile(receiptAbsolute, "native helper build receipt");
      if (!observed.bytes.equals(expectedReceipt)) {
        throw new Error("native helper build receipt is stale");
      }
      return {status: "check-pass", helper: first.identity, receipt: observed.identity};
    }
    const receipt = await writeReceiptExact(receiptAbsolute, expectedReceipt);
    return {
      status: "built-and-reviewed",
      helper: first.identity,
      staticContractSha256,
      receipt: {bytes: expectedReceipt.length, sha256: sha256(expectedReceipt), ...receipt},
    };
  } finally {
    await rm(firstDirectory, {recursive: true, force: true});
    await rm(secondDirectory, {recursive: true, force: true});
  }
}

async function main() {
  const arguments_ = process.argv.slice(2);
  if (arguments_.length > 1 || (arguments_.length === 1 && arguments_[0] !== "--check")) {
    throw new Error("usage: node scripts/build-adaptive-canvas-atomic-commit.mjs [--check]");
  }
  process.stdout.write(`${JSON.stringify(await buildAdaptiveCanvasAtomicCommit({
    checkOnly: arguments_[0] === "--check",
  }))}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`build-adaptive-canvas-atomic-commit: ${error.message}\n`);
    process.exitCode = 1;
  });
}
