import assert from "node:assert/strict";
import {spawn, execFile as execFileCallback} from "node:child_process";
import {
  createHash,
  generateKeyPairSync,
  sign as cryptoSign,
} from "node:crypto";
import {
  access,
  chmod,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {
  buildPromotionV2DiagnosticNativeRequest,
  executePromotionV2NativeSecurityCandidate,
  PROMOTION_V2_NATIVE_SECURITY_DISABLED_CODE,
  PROMOTION_V2_NATIVE_SECURITY_EXECUTOR_CONNECTED,
  PROMOTION_V2_NATIVE_SECURITY_PRODUCTION_ENABLED,
  PROMOTION_V2_NATIVE_SECURITY_WRITES_ENABLED,
  recoverPromotionV2NativeSecurityCandidate,
  promotionV2DiagnosticOperationsSha256,
  verifyPromotionV2DiagnosticPlanEnvelope,
} from "./lib/promotion-v2-native-security-candidate.mjs";

const execFile = promisify(execFileCallback);
const projectRoot = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const helperSource = path.join(
  projectRoot,
  "native/promotion-v2-darwin/PromotionV2NativeHelper.swift",
);
const boundarySource = path.join(
  projectRoot,
  "scripts/lib/promotion-v2-native-security-candidate.mjs",
);
const disposablePrefix = "/Volumes/WestWorld/.codex-help-math-promotion-v2-native-tests-";

function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

function canonicalJson(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
    .join(",")}}`;
}

function publishOperation(ordinal, relativePath, content, mode = 0o600) {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content);
  return {
    ordinal,
    kind: "publish-file-no-replace",
    relativePath,
    mode,
    contentBase64: bytes.toString("base64"),
    sha256: sha256(bytes),
  };
}

function mkdirOperation(ordinal, relativePath, mode = 0o700) {
  return {ordinal, kind: "mkdir-no-replace", relativePath, mode};
}

function swiftString(value) {
  return JSON.stringify(value);
}

function helperInvocation(helperPath, request) {
  const child = spawn(helperPath, [], {stdio: ["pipe", "pipe", "pipe"]});
  const stdout = [];
  const stderr = [];
  child.stdout.on("data", (chunk) => stdout.push(chunk));
  child.stderr.on("data", (chunk) => stderr.push(chunk));
  const result = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => {
      const stdoutText = Buffer.concat(stdout).toString("utf8");
      const stderrText = Buffer.concat(stderr).toString("utf8");
      let json = null;
      if (stdoutText.trim()) {
        try {
          json = JSON.parse(stdoutText);
        } catch (error) {
          reject(
            new Error(
              `native helper emitted invalid JSON: ${error.message}; stdout=${stdoutText}; stderr=${stderrText}`,
            ),
          );
          return;
        }
      }
      resolve({code, signal, stdout: stdoutText, stderr: stderrText, json});
    });
  });
  child.stdin.end(`${JSON.stringify(request)}\n`);
  return {child, result};
}

async function runHelper(helperPath, request) {
  return helperInvocation(helperPath, request).result;
}

function assertSuccess(result) {
  assert.equal(result.code, 0, `helper failed: ${result.stderr}\n${result.stdout}`);
  assert.equal(result.signal, null);
  assert.equal(result.json?.ok, true);
  assert.equal(result.json?.productionEnabled, false);
  return result.json;
}

function assertFailure(result, expectedCode) {
  assert.equal(result.code, 1, `expected fail-closed exit: ${result.stderr}\n${result.stdout}`);
  assert.equal(result.signal, null);
  assert.equal(result.json?.ok, false);
  assert.equal(result.json?.status, "diagnostic-failed-closed");
  assert.equal(result.json?.error?.code, expectedCode);
  return result.json;
}

async function pathExists(value) {
  try {
    await access(value);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function waitForPath(value, timeoutMilliseconds = 10_000) {
  const deadline = Date.now() + timeoutMilliseconds;
  while (Date.now() < deadline) {
    if (await pathExists(value)) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.fail(`timed out waiting for ${value}`);
}

async function captureDisposableDirectory(value) {
  const canonical = await realpath(value);
  const parent = await realpath(path.dirname(value));
  const info = await lstat(value, {bigint: true});
  assert.equal(canonical, value);
  assert.equal(parent, "/Volumes/WestWorld");
  assert.match(path.basename(value), /^\.codex-help-math-promotion-v2-native-tests-/);
  assert.equal(info.isDirectory(), true);
  assert.equal(info.isSymbolicLink(), false);
  return {path: value, device: info.dev, inode: info.ino};
}

async function removeCapturedDisposableDirectory(captured) {
  const canonical = await realpath(captured.path);
  const parent = await realpath(path.dirname(captured.path));
  const info = await lstat(captured.path, {bigint: true});
  assert.equal(canonical, captured.path, "cleanup target realpath drifted");
  assert.equal(parent, "/Volumes/WestWorld", "cleanup target parent drifted");
  assert.match(path.basename(captured.path), /^\.codex-help-math-promotion-v2-native-tests-/);
  assert.equal(info.isDirectory(), true, "cleanup target is no longer a directory");
  assert.equal(info.isSymbolicLink(), false, "cleanup target became a symlink");
  assert.equal(info.dev, captured.device, "cleanup target device drifted");
  assert.equal(info.ino, captured.inode, "cleanup target inode drifted");
  await rm(captured.path, {recursive: true, force: false});
}

test(
  "Promotion V2 Darwin native-security helper remains isolated and fails closed under APFS adversarial cases",
  {timeout: 180_000},
  async (t) => {
    if (process.platform !== "darwin") {
      t.skip("Darwin-only kernel semantics");
      return;
    }

    const diagnosticRoot = await mkdtemp(disposablePrefix);
    const diagnosticRootCapture = await captureDisposableDirectory(diagnosticRoot);
    const externalRoots = [];
    t.after(async () => {
      await removeCapturedDisposableDirectory(diagnosticRootCapture);
      for (const externalRoot of externalRoots) {
        await removeCapturedDisposableDirectory(externalRoot);
      }
    });

    assert.equal(await realpath(diagnosticRoot), diagnosticRoot);
    const {stdout: diskInfo} = await execFile("/usr/sbin/diskutil", ["info", "/Volumes/WestWorld"], {
      maxBuffer: 2 * 1024 * 1024,
    });
    assert.match(diskInfo, /APFS/i, "disposable security test root must be APFS");

    const {privateKey: diagnosticPrivateKey, publicKey: diagnosticPublicKey} =
      generateKeyPairSync("ed25519");
    const diagnosticPublicKeyPem = diagnosticPublicKey.export({
      type: "spki",
      format: "pem",
    });
    const diagnosticPublicKeyDer = diagnosticPublicKey.export({
      type: "spki",
      format: "der",
    });
    assert.equal(diagnosticPublicKeyDer.length, 44);
    const diagnosticPublicKeyRawBase64 = diagnosticPublicKeyDer
      .subarray(diagnosticPublicKeyDer.length - 32)
      .toString("base64");

    const buildDirectory = path.join(diagnosticRoot, ".diagnostic-build");
    await mkdir(buildDirectory, {mode: 0o700});
    const buildConfig = path.join(buildDirectory, "PromotionV2DiagnosticBuildConfig.swift");
    const helperPath = path.join(buildDirectory, "promotion-v2-native-helper");
    await writeFile(
      buildConfig,
      [
        "enum PromotionV2DiagnosticBuildConfig {",
        `    static let compiledDiagnosticRootPath = ${swiftString(diagnosticRoot)}`,
        `    static let compiledProjectRootPath = ${swiftString(projectRoot)}`,
        `    static let diagnosticPublicKeyBase64 = ${swiftString(diagnosticPublicKeyRawBase64)}`,
        "    static let productionEnabled = false",
        "}",
        "",
      ].join("\n"),
      {mode: 0o600},
    );
    const {stdout: swiftVersion} = await execFile("/usr/bin/xcrun", ["swift", "--version"]);
    const compile = await execFile(
      "/usr/bin/xcrun",
      ["swiftc", "-O", "-o", helperPath, buildConfig, helperSource],
      {maxBuffer: 8 * 1024 * 1024},
    );
    assert.equal(compile.stderr, "");
    await chmod(helperPath, 0o500);
    const expectedRoot = {
      device: String(diagnosticRootCapture.device),
      inode: String(diagnosticRootCapture.inode),
    };

    function batchRequest(
      transactionId,
      operations,
      {
        recovery = false,
        crashAfterOrdinal,
        rootPath = diagnosticRoot,
        rootIdentity = expectedRoot,
      } = {},
    ) {
      const plan = {
        schemaVersion: 1,
        diagnosticOnly: true,
        evidenceType: "promotion-v2-native-security-diagnostic-plan",
        transactionId,
        nonce: createHash("sha256").update(transactionId).digest("base64url"),
        operationsSha256: promotionV2DiagnosticOperationsSha256(operations),
        rootIdentity,
      };
      const signatureBase64 = cryptoSign(
        null,
        Buffer.from(canonicalJson(plan), "utf8"),
        diagnosticPrivateKey,
      ).toString("base64");
      const verifiedEnvelope = verifyPromotionV2DiagnosticPlanEnvelope({
        plan,
        signature: {algorithm: "Ed25519", signatureBase64},
        publicKeyPem: diagnosticPublicKeyPem,
      });
      return buildPromotionV2DiagnosticNativeRequest({
        verifiedEnvelope,
        rootPath,
        expectedRoot: rootIdentity,
        operations,
        recovery,
        crashAfterOrdinal,
      });
    }

    await mkdir(path.join(diagnosticRoot, "cases"), {mode: 0o700});
    t.diagnostic(`compiled with ${swiftVersion.trim().replaceAll("\n", "; ")}`);
    t.diagnostic(`disposable APFS root: ${diagnosticRoot}`);

    await t.test("capability surface and JavaScript boundary are diagnostic-only", async () => {
      const capabilities = assertSuccess(
        await runHelper(helperPath, {
          schemaVersion: 1,
          diagnosticOnly: true,
          action: "capabilities",
        }),
      );
      assert.equal(capabilities.status, "diagnostic-capabilities-only");
      assert.deepEqual(
        new Set(capabilities.operations),
        new Set(["openat", "fstatat", "mkdirat", "linkat", "renameatx_np", "unlinkat", "fsync"]),
      );
      for (const flag of [
        "O_NOFOLLOW_ANY",
        "O_RESOLVE_BENEATH",
        "AT_SYMLINK_NOFOLLOW_ANY",
        "AT_RESOLVE_BENEATH",
        "RENAME_EXCL",
        "RENAME_NOFOLLOW_ANY",
        "RENAME_RESOLVE_BENEATH",
      ]) {
        assert.ok(capabilities.flags[flag] > 0, `${flag} must be compiled in`);
      }
      assertFailure(
        await runHelper(helperPath, {
          schemaVersion: 1,
          diagnosticOnly: 1,
          action: "capabilities",
        }),
        "INVALID_BOOLEAN",
      );
      assert.equal(PROMOTION_V2_NATIVE_SECURITY_PRODUCTION_ENABLED, false);
      assert.equal(PROMOTION_V2_NATIVE_SECURITY_EXECUTOR_CONNECTED, false);
      assert.equal(PROMOTION_V2_NATIVE_SECURITY_WRITES_ENABLED, false);
      for (const disabledCall of [
        executePromotionV2NativeSecurityCandidate,
        recoverPromotionV2NativeSecurityCandidate,
      ]) {
        assert.throws(disabledCall, (error) => error.code === PROMOTION_V2_NATIVE_SECURITY_DISABLED_CODE);
      }
      const boundaryText = await readFile(boundarySource, "utf8");
      assert.doesNotMatch(boundaryText, /node:(?:fs|child_process)/);
      assert.doesNotMatch(boundaryText, /PromotionV2NativeHelper|swiftc|spawn\s*\(/);
    });

    await t.test("ephemeral Ed25519 plan is hash-bound to native operations and rejects tampering", async () => {
      const signatureCase = path.join(diagnosticRoot, "cases/signature");
      await mkdir(signatureCase, {mode: 0o700});
      const sentinel = path.join(signatureCase, "must-not-exist");
      const operations = [
        publishOperation(1, "cases/signature/verified-output", "signed operations\n"),
      ];
      const plan = {
        schemaVersion: 1,
        diagnosticOnly: true,
        evidenceType: "promotion-v2-native-security-diagnostic-plan",
        transactionId: "native-v2-signature-0001",
        nonce: "ephemeral_nonce_fixture_0000000001",
        operationsSha256: promotionV2DiagnosticOperationsSha256(operations),
        rootIdentity: expectedRoot,
      };
      const signatureBase64 = cryptoSign(
        null,
        Buffer.from(canonicalJson(plan), "utf8"),
        diagnosticPrivateKey,
      ).toString("base64");
      const verified = verifyPromotionV2DiagnosticPlanEnvelope({
        plan,
        signature: {algorithm: "Ed25519", signatureBase64},
        publicKeyPem: diagnosticPublicKeyPem,
      });
      assert.equal(verified.verified, true);
      assert.equal(verified.productionEnabled, false);
      assert.ok(Object.isFrozen(verified));
      const request = buildPromotionV2DiagnosticNativeRequest({
        verifiedEnvelope: verified,
        rootPath: diagnosticRoot,
        expectedRoot,
        operations,
      });
      const nativeResult = assertSuccess(await runHelper(helperPath, request));
      assert.equal(nativeResult.operationsSha256, plan.operationsSha256);
      assert.equal(nativeResult.signedPlanSha256, verified.planSha256);
      assert.equal(
        await readFile(path.join(signatureCase, "verified-output"), "utf8"),
        "signed operations\n",
      );
      assert.throws(
        () =>
          buildPromotionV2DiagnosticNativeRequest({
            verifiedEnvelope: verified,
            rootPath: diagnosticRoot,
            expectedRoot,
            operations: [publishOperation(1, "cases/signature/must-not-exist", "tampered\n")],
          }),
        /operations do not match the signed plan/,
      );
      const nativeTamper = structuredClone(request);
      nativeTamper.operations[0].relativePath = "cases/signature/must-not-exist";
      assertFailure(
        await runHelper(helperPath, nativeTamper),
        "SIGNED_OPERATIONS_MISMATCH",
      );
      assert.throws(
        () =>
          verifyPromotionV2DiagnosticPlanEnvelope({
            plan: {...plan, nonce: "ephemeral_nonce_fixture_0000000002"},
            signature: {algorithm: "Ed25519", signatureBase64},
            publicKeyPem: diagnosticPublicKeyPem,
          }),
        /signature is invalid/,
      );
      assert.throws(
        () =>
          verifyPromotionV2DiagnosticPlanEnvelope({
            plan,
            signature: {algorithm: "Ed25519", signatureBase64: Buffer.alloc(64).toString("base64")},
            publicKeyPem: diagnosticPublicKeyPem,
          }),
        /signature is invalid/,
      );
      assert.equal(await pathExists(sentinel), false);
    });

    await t.test("wrong root and unsafe relative paths fail before mutation", async () => {
      const otherRoot = await mkdtemp(`${disposablePrefix}wrong-root-`);
      const otherRootCapture = await captureDisposableDirectory(otherRoot);
      externalRoots.push(otherRootCapture);
      const otherStat = await lstat(otherRoot, {bigint: true});
      const wrongRootRequest = batchRequest(
        "native-v2-wrong-root-0001",
        [publishOperation(1, "must-not-exist", "wrong root")],
        {
          rootPath: otherRoot,
          rootIdentity: {device: String(otherStat.dev), inode: String(otherStat.ino)},
        },
      );
      assertFailure(await runHelper(helperPath, wrongRootRequest), "COMPILED_ROOT_MISMATCH");
      assert.equal(await pathExists(path.join(otherRoot, "must-not-exist")), false);

      await mkdir(path.join(diagnosticRoot, "cases/unsafe"), {recursive: true, mode: 0o700});
      for (const [index, unsafePath] of [
        "/absolute",
        "cases/unsafe/../escape",
        "cases/unsafe/back\\slash",
        "cases/unsafe/\u212B-non-normalized",
      ].entries()) {
        const result = await runHelper(
          helperPath,
          batchRequest(`native-v2-unsafe-${String(index).padStart(4, "0")}`, [
            publishOperation(1, unsafePath, "unsafe"),
          ]),
        );
        assertFailure(result, "UNSAFE_RELATIVE_PATH");
      }
    });

    await t.test("immutable no-replace publication is durable and exactly replayable", async () => {
      await mkdir(path.join(diagnosticRoot, "cases/basic"), {mode: 0o700});
      const operations = [
        mkdirOperation(1, "cases/basic/objects"),
        mkdirOperation(2, "cases/basic/nonces"),
        mkdirOperation(3, "cases/basic/commits"),
        publishOperation(4, "cases/basic/objects/object-a", "object bytes\n"),
        publishOperation(5, "cases/basic/nonces/nonce-a", "nonce reservation\n"),
        publishOperation(6, "cases/basic/commits/commit-a", "immutable commit\n"),
      ];
      const first = assertSuccess(
        await runHelper(helperPath, batchRequest("native-v2-basic-0001", operations)),
      );
      assert.equal(first.status, "diagnostic-batch-complete");
      assert.ok(first.results.slice(3).every((item) => item.status === "published-no-replace"));
      assert.ok(first.results.slice(3).every((item) => item.fullSync === true));
      const replay = assertSuccess(
        await runHelper(
          helperPath,
          batchRequest("native-v2-basic-0001", operations, {recovery: true}),
        ),
      );
      assert.equal(replay.status, "diagnostic-recovery-complete");
      assert.ok(replay.results.every((item) => item.status === "already-durable"));
    });

    await t.test("symlink ancestors and final symlinks are rejected", async () => {
      const symlinkCase = path.join(diagnosticRoot, "cases/symlink");
      await mkdir(path.join(symlinkCase, "real"), {recursive: true, mode: 0o700});
      await symlink("real", path.join(symlinkCase, "ancestor-link"));
      const ancestorResult = await runHelper(
        helperPath,
        batchRequest("native-v2-symlink-0001", [
          publishOperation(1, "cases/symlink/ancestor-link/out", "must not traverse"),
        ]),
      );
      assert.ok(
        ["SYMLINK_REJECTED", "ANCESTOR_OPEN_FAILED"].includes(ancestorResult.json?.error?.code),
        ancestorResult.stdout,
      );
      assert.equal(ancestorResult.code, 1);
      assert.equal(await pathExists(path.join(symlinkCase, "real/out")), false);

      await writeFile(path.join(symlinkCase, "real/external"), "external\n", {mode: 0o600});
      await symlink("real/external", path.join(symlinkCase, "final-link"));
      const finalResult = await runHelper(
        helperPath,
        batchRequest(
          "native-v2-symlink-0002",
          [publishOperation(1, "cases/symlink/final-link", "external\n")],
          {recovery: true},
        ),
      );
      assertFailure(finalResult, "SYMLINK_REJECTED");
      assert.equal(await readFile(path.join(symlinkCase, "real/external"), "utf8"), "external\n");
    });

    await t.test("external hard link at a canonical target is rejected without overwrite", async () => {
      const hardlinkCase = path.join(diagnosticRoot, "cases/hardlink");
      await mkdir(hardlinkCase, {mode: 0o700});
      const externalRoot = await mkdtemp(`${disposablePrefix}external-hardlink-`);
      externalRoots.push(await captureDisposableDirectory(externalRoot));
      const externalFile = path.join(externalRoot, "external");
      const bytes = Buffer.from("hard-linked foreign bytes\n");
      await writeFile(externalFile, bytes, {mode: 0o600});
      await link(externalFile, path.join(hardlinkCase, "target"));
      assert.equal((await lstat(externalFile)).nlink, 2);
      assertFailure(
        await runHelper(
          helperPath,
          batchRequest(
            "native-v2-hardlink-0001",
            [publishOperation(1, "cases/hardlink/target", bytes)],
            {recovery: true},
          ),
        ),
        "HARDLINK_REJECTED",
      );
      assert.deepEqual(await readFile(externalFile), bytes);
      assert.equal((await lstat(externalFile)).nlink, 2);
    });

    await t.test("two concurrent writers preserve one complete no-replace winner", async () => {
      const concurrentCase = path.join(diagnosticRoot, "cases/concurrent");
      await mkdir(concurrentCase, {mode: 0o700});
      const target = "cases/concurrent/commit";
      const left = helperInvocation(
        helperPath,
        batchRequest("native-v2-concurrent-left", [publishOperation(1, target, "left winner\n")]),
      );
      const right = helperInvocation(
        helperPath,
        batchRequest("native-v2-concurrent-right", [publishOperation(1, target, "right winner\n")]),
      );
      const results = await Promise.all([left.result, right.result]);
      assert.equal(results.filter((result) => result.code === 0).length, 1);
      const loser = results.find((result) => result.code === 1);
      assert.equal(loser?.json?.error?.code, "NO_REPLACE_CONFLICT");
      const winnerContent = await readFile(path.join(diagnosticRoot, target), "utf8");
      assert.ok(["left winner\n", "right winner\n"].includes(winnerContent));
      const retainedTemporaryLeaves = (await readdir(concurrentCase)).filter(
        (leaf) => leaf.startsWith(".p2-") && leaf.endsWith(".tmp"),
      );
      assert.equal(retainedTemporaryLeaves.length, 1);
      const retainedTemporary = path.join(concurrentCase, retainedTemporaryLeaves[0]);
      const retainedInfo = await lstat(retainedTemporary);
      assert.equal(retainedInfo.isFile(), true);
      assert.equal(retainedInfo.nlink, 1);
      assert.equal(
        await readFile(retainedTemporary, "utf8"),
        winnerContent === "left winner\n" ? "right winner\n" : "left winner\n",
      );
    });

    await t.test("stale nonce replay with a different plan fails as foreign drift", async () => {
      const nonceCase = path.join(diagnosticRoot, "cases/stale-nonce");
      await mkdir(nonceCase, {mode: 0o700});
      const target = "cases/stale-nonce/nonce";
      assertSuccess(
        await runHelper(
          helperPath,
          batchRequest("native-v2-stale-nonce-a", [publishOperation(1, target, "plan A\n")]),
        ),
      );
      assertFailure(
        await runHelper(
          helperPath,
          batchRequest(
            "native-v2-stale-nonce-b",
            [publishOperation(1, target, "plan B\n")],
            {recovery: true},
          ),
        ),
        "FOREIGN_DRIFT",
      );
      assert.equal(await readFile(path.join(diagnosticRoot, target), "utf8"), "plan A\n");
    });

    await t.test("owned link and unlink primitives require exact descriptor-relative identity", async () => {
      const ownedCase = path.join(diagnosticRoot, "cases/owned-link");
      await mkdir(ownedCase, {mode: 0o700});
      const source = "cases/owned-link/private-source";
      const target = "cases/owned-link/private-link";
      const published = assertSuccess(
        await runHelper(
          helperPath,
          batchRequest("native-v2-owned-publish", [publishOperation(1, source, "owned bytes\n")]),
        ),
      );
      const fileIdentity = published.results[0].file;
      const expectedSource = {device: fileIdentity.device, inode: fileIdentity.inode};
      assertSuccess(
        await runHelper(
          helperPath,
          batchRequest("native-v2-owned-link-0001", [
            {
              ordinal: 1,
              kind: "link-owned-no-replace",
              relativePath: target,
              sourceRelativePath: source,
              expectedSource,
            },
          ]),
        ),
      );
      assert.equal((await lstat(path.join(diagnosticRoot, source))).nlink, 2);
      const replay = assertSuccess(
        await runHelper(
          helperPath,
          batchRequest(
            "native-v2-owned-link-0001",
            [
              {
                ordinal: 1,
                kind: "link-owned-no-replace",
                relativePath: target,
                sourceRelativePath: source,
                expectedSource,
              },
            ],
            {recovery: true},
          ),
        ),
      );
      assert.equal(replay.results[0].status, "already-durable");
      assertSuccess(
        await runHelper(
          helperPath,
          batchRequest("native-v2-owned-unlink", [
            {ordinal: 1, kind: "unlink-owned", relativePath: target, expected: expectedSource},
          ]),
        ),
      );
      assert.equal(await pathExists(path.join(diagnosticRoot, target)), false);
      assert.equal((await lstat(path.join(diagnosticRoot, source))).nlink, 1);
    });

    await t.test("crash after every durable ordinal is exactly recoverable", async () => {
      for (let crashAfterOrdinal = 1; crashAfterOrdinal <= 4; crashAfterOrdinal += 1) {
        const relativeBase = `cases/crash-${crashAfterOrdinal}`;
        await mkdir(path.join(diagnosticRoot, relativeBase), {mode: 0o700});
        for (const child of ["nonces", "objects", "journal", "commits"]) {
          await mkdir(path.join(diagnosticRoot, relativeBase, child), {mode: 0o700});
        }
        const targets = [
          `${relativeBase}/nonces/nonce`,
          `${relativeBase}/objects/object`,
          `${relativeBase}/journal/record`,
          `${relativeBase}/commits/commit`,
        ];
        const operations = targets.map((target, index) =>
          publishOperation(index + 1, target, `crash ${crashAfterOrdinal} ordinal ${index + 1}\n`),
        );
        const crashed = await runHelper(
          helperPath,
          batchRequest(`native-v2-crash-${String(crashAfterOrdinal).padStart(4, "0")}`, operations, {
            crashAfterOrdinal,
          }),
        );
        assert.equal(crashed.code, 86);
        assert.equal(crashed.json, null);
        for (let index = 0; index < targets.length; index += 1) {
          assert.equal(
            await pathExists(path.join(diagnosticRoot, targets[index])),
            index < crashAfterOrdinal,
          );
        }
        const recovery = assertSuccess(
          await runHelper(
            helperPath,
            batchRequest(
              `native-v2-crash-${String(crashAfterOrdinal).padStart(4, "0")}`,
              operations,
              {recovery: true},
            ),
          ),
        );
        assert.ok(
          recovery.results.slice(0, crashAfterOrdinal).every((item) => item.status === "already-durable"),
        );
        assert.ok(
          recovery.results.slice(crashAfterOrdinal).every((item) => item.status === "published-no-replace"),
        );
      }
    });

    await t.test("foreign drift after a crash stops recovery without overwriting or advancing", async () => {
      const relativeBase = "cases/foreign-drift";
      await mkdir(path.join(diagnosticRoot, relativeBase), {mode: 0o700});
      const targets = ["nonce", "object", "commit"].map((leaf) => `${relativeBase}/${leaf}`);
      const operations = targets.map((target, index) =>
        publishOperation(index + 1, target, `intended ${index + 1}\n`),
      );
      const crashed = await runHelper(
        helperPath,
        batchRequest("native-v2-foreign-drift", operations, {crashAfterOrdinal: 1}),
      );
      assert.equal(crashed.code, 86);
      const foreignBytes = Buffer.from("foreign writer bytes\n");
      await writeFile(path.join(diagnosticRoot, targets[1]), foreignBytes, {mode: 0o600});
      assertFailure(
        await runHelper(
          helperPath,
          batchRequest("native-v2-foreign-drift", operations, {recovery: true}),
        ),
        "FOREIGN_DRIFT",
      );
      assert.deepEqual(await readFile(path.join(diagnosticRoot, targets[1])), foreignBytes);
      assert.equal(await pathExists(path.join(diagnosticRoot, targets[2])), false);
    });

    await t.test("replacing an opened ancestor cannot redirect publication", async () => {
      const control = path.join(diagnosticRoot, ".control");
      const original = path.join(diagnosticRoot, "cases/ancestor/original");
      const held = path.join(diagnosticRoot, "cases/ancestor/held");
      await mkdir(control, {mode: 0o700});
      await mkdir(original, {recursive: true, mode: 0o700});
      const content = "descriptor-pinned destination\n";
      const operation = publishOperation(1, "cases/ancestor/original/result", content);
      operation.pauseAfterParentOpen = {
        markerRelativePath: ".control/parent-opened",
        continueRelativePath: ".control/continue",
        timeoutMilliseconds: 15_000,
      };
      const running = helperInvocation(
        helperPath,
        batchRequest("native-v2-ancestor-race", [operation]),
      );
      await waitForPath(path.join(control, "parent-opened"));
      await rename(original, held);
      await mkdir(original, {mode: 0o700});
      await writeFile(path.join(control, "continue"), "continue\n", {mode: 0o600});
      assertSuccess(await running.result);
      assert.equal(await readFile(path.join(held, "result"), "utf8"), content);
      assert.equal(await pathExists(path.join(original, "result")), false);
    });
  },
);
