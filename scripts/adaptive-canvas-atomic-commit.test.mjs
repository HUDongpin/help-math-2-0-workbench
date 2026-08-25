import assert from "node:assert/strict";
import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  link,
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {promisify} from "node:util";

import {
  adaptiveAtomicManifestBytes,
  adaptiveAtomicPreconditionSha256,
  adaptiveAtomicStaticContractSha256,
  invokePinnedAdaptiveAtomicHelper,
  recoverAdaptiveAtomicCommitFromStoredManifest,
} from "./lib/adaptive-canvas-atomic-commit.mjs";

const execFile = promisify(execFileCallback);
const SOURCE = path.resolve("scripts/native/adaptive-canvas-atomic-commit.c");
const CLEAN_ENV = {LANG: "C", LC_ALL: "C", PATH: "/usr/bin:/bin"};

function hash(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function outputEntry({ordinal, targetPath, inputBytes, outputBytes, identity}) {
  return Object.freeze({
    ordinal,
    targetPath,
    prestate: inputBytes === null ? "absent" : "present",
    outputMode: 0o644,
    input: inputBytes === null
      ? {bytes: 0, sha256: "0".repeat(64)}
      : {bytes: inputBytes.length, sha256: hash(inputBytes)},
    output: {bytes: outputBytes.length, sha256: hash(outputBytes)},
    dynamicIdentity: inputBytes === null ? null : {
      dev: String(identity.dev),
      ino: String(identity.ino),
      mode: String(identity.mode),
      uid: String(identity.uid),
      gid: String(identity.gid),
      nlink: String(identity.nlink),
      mtimeNs: String(identity.mtimeNs),
      ctimeNs: String(identity.ctimeNs),
    },
    outputBytes,
  });
}

async function compileHelper(root, entries, {testing = true} = {}) {
  const executable = path.join(root, "adaptive-canvas-atomic-commit");
  const staticSha = adaptiveAtomicStaticContractSha256(entries);
  await execFile("/usr/bin/xcrun", [
    "--sdk", "macosx", "clang", "-std=c17", "-O2", "-Wall", "-Wextra",
    "-Werror", "-Wno-deprecated-declarations",
    `-DADAPTIVE_ATOMIC_STATIC_CONTRACT_SHA256=\"${staticSha}\"`,
    `-DADAPTIVE_ATOMIC_EXPECTED_ENTRY_COUNT=${entries.length}`,
    `-DADAPTIVE_ATOMIC_PRODUCTION=${testing ? 0 : 1}`,
    ...(testing ? ["-DADAPTIVE_ATOMIC_TESTING=1"] : []),
    SOURCE,
    "-o", executable,
  ], {
    env: {...CLEAN_ENV, TMPDIR: `${root}${path.sep}`},
    timeout: 30_000,
    maxBuffer: 1024 * 1024,
  });
  const bytes = await readFile(executable);
  return {executable, sha256: hash(bytes), staticSha};
}

async function fixture(count = 3, {productionShape = false} = {}) {
  if (productionShape) assert.equal(count, 286);
  const root = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "adaptive-canvas-atomic-fixture-"),
  ));
  await mkdir(path.join(root, "work"));
  if (!productionShape) await mkdir(path.join(root, "targets"));
  const entries = [];
  for (let index = 0; index < count; index += 1) {
    const targetPath = productionShape
      ? (index < 284
          ? `apps/web/public/flash-assets/courses/unit-${String(index + 1).padStart(3, "0")}/canvas-renderer.js`
          : index === 284
            ? "apps/web/config/current-js-production-assets.v2.json"
            : "packages/demos/src/adaptive-canvas-production-bindings.generated.ts")
      : `targets/t${String(index + 1).padStart(3, "0")}.bin`;
    const absolute = path.join(root, targetPath);
    await mkdir(path.dirname(absolute), {recursive: true});
    const inputBytes = index === count - 2 ? null : Buffer.from(`old-${index + 1}\n`);
    const outputBytes = Buffer.from(`new-${index + 1}\n`);
    let identity = null;
    if (inputBytes !== null) {
      await writeFile(absolute, inputBytes, {mode: 0o644});
      identity = await lstat(absolute, {bigint: true});
    }
    entries.push(outputEntry({
      ordinal: index + 1,
      targetPath,
      inputBytes,
      outputBytes,
      identity,
    }));
  }
  const rootIdentity = await lstat(root, {bigint: true});
  const bundlePath = path.join(root, "bundle.bin");
  const bundleBytes = Buffer.concat(entries.map((entry) => entry.outputBytes));
  await writeFile(bundlePath, bundleBytes, {mode: 0o600});
  const bundleHandle = await open(bundlePath, fsConstants.O_RDONLY);
  const evidence = {
    planReceiptSha256: hash(Buffer.from("plan")),
    provenanceReceiptSha256: hash(Buffer.from("provenance")),
    proofReceiptSha256: hash(Buffer.from("proof")),
  };
  const manifest = adaptiveAtomicManifestBytes({
    entries,
    rootIdentity: {dev: String(rootIdentity.dev), ino: String(rootIdentity.ino)},
    bundle: {bytes: bundleBytes.length, sha256: hash(bundleBytes)},
    evidence,
  });
  const plan = productionShape ? {
    runtimeRecords: entries.slice(0, 284).map((entry) => ({
      relativePath: entry.targetPath.slice(
        "apps/web/public/flash-assets/courses/".length,
      ),
    })),
    outputBytesByAssetPath: new Map(entries.slice(0, 284).map((entry) => [
      entry.targetPath.slice("apps/web/public/flash-assets/".length),
      entry.outputBytes,
    ])),
    v2ProfileBytes: entries[284].outputBytes,
    bindingsBytes: entries[285].outputBytes,
  } : null;
  return {
    root,
    entries,
    manifest,
    bundleHandle,
    bundlePath,
    evidence,
    plan,
  };
}

async function invoke(fixtureValue, helper, action, environment = {}) {
  return invokePinnedAdaptiveAtomicHelper({
    helperPath: helper.executable,
    expectedHelperSha256: helper.sha256,
    arguments: [`--${action}`, fixtureValue.root],
    manifestBytes: fixtureValue.manifest.bytes,
    bundleHandle: fixtureValue.bundleHandle,
    environment,
  });
}

async function invokeManifest(
  fixtureValue,
  helper,
  action,
  manifestBytes,
  environment = {},
) {
  return invokePinnedAdaptiveAtomicHelper({
    helperPath: helper.executable,
    expectedHelperSha256: helper.sha256,
    arguments: [`--${action}`, fixtureValue.root],
    manifestBytes,
    bundleHandle: fixtureValue.bundleHandle,
    environment,
  });
}

async function waitForFile(absolutePath, pattern, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const content = await readFile(absolutePath, "utf8").catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
    if (content !== null && pattern.test(content)) return content;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`timed out waiting for ${absolutePath}`);
}

function transactionRoot(value) {
  return path.join(
    value.root,
    "work",
    ".adaptive-canvas-atomic-v1",
    `tx-${value.manifest.transactionId}`,
  );
}

async function closeFixture(value) {
  await value.bundleHandle.close();
  await rm(value.root, {recursive: true, force: true});
}

test("native helper commits binding-last and retains exact preimages for rollback", async () => {
  const value = await fixture(3);
  try {
    const helper = await compileHelper(value.root, value.entries);
    const capability = await invokePinnedAdaptiveAtomicHelper({
      helperPath: helper.executable,
      expectedHelperSha256: helper.sha256,
      arguments: ["--capabilities"],
    });
    assert.equal(capability.receipt.staticContractSha256, helper.staticSha);
    assert.equal(capability.receipt.production, false);

    const applied = await invoke(value, helper, "apply");
    assert.equal(applied.receipt.status, "committed-with-preimage-custody");
    assert.equal(applied.receipt.bindingCommittedLast, true);
    assert.equal(applied.receipt.entryCount, 3);
    for (const entry of value.entries) {
      assert.deepEqual(
        await readFile(path.join(value.root, entry.targetPath)),
        entry.outputBytes,
      );
    }
    const transactionRoot = path.join(
      value.root,
      "work",
      ".adaptive-canvas-atomic-v1",
      `tx-${value.manifest.transactionId}`,
    );
    assert.equal(
      await readFile(path.join(transactionRoot, "stage", "000001.bin"), "utf8"),
      "old-1\n",
    );
    await assert.rejects(
      readFile(path.join(transactionRoot, "stage", "000002.bin")),
      (error) => error.code === "ENOENT",
    );

    const rolledBack = await invoke(value, helper, "recover-rollback");
    assert.equal(rolledBack.receipt.status, "rolled-back-with-custody");
    assert.equal(
      await readFile(path.join(value.root, value.entries[0].targetPath), "utf8"),
      "old-1\n",
    );
    await assert.rejects(
      readFile(path.join(value.root, value.entries[1].targetPath)),
      (error) => error.code === "ENOENT",
    );
  } finally {
    await closeFixture(value);
  }
});

test("crash after an atomic rename is recovered forward from observed inode states", async () => {
  const value = await fixture(3);
  try {
    const helper = await compileHelper(value.root, value.entries);
    await assert.rejects(
      invoke(value, helper, "apply", {
        HELP_MATH_ADAPTIVE_ATOMIC_CRASH_POINT: "after-rename:2",
      }),
      (error) => error.code === "NATIVE_HELPER_FAILED" &&
        error.details?.code === 86,
    );
    const recovered = await invoke(value, helper, "recover-forward");
    assert.equal(recovered.receipt.status, "committed-with-preimage-custody");
    for (const entry of value.entries) {
      assert.deepEqual(
        await readFile(path.join(value.root, entry.targetPath)),
        entry.outputBytes,
      );
    }
  } finally {
    await closeFixture(value);
  }
});

test("crashes at every durable boundary recover from the persisted transaction", async (t) => {
  for (const crashPoint of [
    "after-prepare",
    "after-journal:2",
    "after-terminal",
  ]) {
    await t.test(crashPoint, async () => {
      const value = await fixture(3);
      try {
        const helper = await compileHelper(value.root, value.entries);
        await assert.rejects(
          invoke(value, helper, "apply", {
            HELP_MATH_ADAPTIVE_ATOMIC_CRASH_POINT: crashPoint,
          }),
          (error) => error.code === "NATIVE_HELPER_FAILED" &&
            error.details?.code === 86,
        );
        const recovered = await invoke(value, helper, "recover-forward");
        assert.equal(recovered.receipt.status, "committed-with-preimage-custody");
        for (const entry of value.entries) {
          assert.deepEqual(
            await readFile(path.join(value.root, entry.targetPath)),
            entry.outputBytes,
          );
        }
      } finally {
        await closeFixture(value);
      }
    });
  }
});

test("a crash during staging retains the partial inode and can restage safely", async () => {
  const value = await fixture(3);
  try {
    const helper = await compileHelper(value.root, value.entries);
    await assert.rejects(
      invoke(value, helper, "apply", {
        HELP_MATH_ADAPTIVE_ATOMIC_CRASH_POINT: "after-stage-chunk:1",
      }),
      (error) => error.code === "NATIVE_HELPER_FAILED" &&
        error.details?.code === 86,
    );
    const stage = path.join(transactionRoot(value), "stage");
    const crashCustody = (await readdir(stage)).filter((leaf) =>
      /^\.000001\.candidate\./u.test(leaf)
    );
    assert.equal(crashCustody.length, 1);
    await assert.rejects(
      readFile(path.join(stage, "000001.bin")),
      (error) => error.code === "ENOENT",
    );
    const recovered = await invoke(value, helper, "recover-forward");
    assert.equal(recovered.receipt.status, "committed-with-preimage-custody");
    assert.ok((await readdir(stage)).includes(crashCustody[0]));
    for (const entry of value.entries) {
      assert.deepEqual(
        await readFile(path.join(value.root, entry.targetPath)),
        entry.outputBytes,
      );
    }
  } finally {
    await closeFixture(value);
  }
});

test("the transaction lock rejects a concurrent helper on the same manifest", async () => {
  const value = await fixture(3);
  try {
    const helper = await compileHelper(value.root, value.entries);
    const first = invoke(value, helper, "apply", {
      HELP_MATH_ADAPTIVE_ATOMIC_PAUSE_POINT: "after-prepare",
    });
    await waitForFile(
      path.join(transactionRoot(value), "journal.log"),
      /^prepared\t000000\t/mu,
    );
    await assert.rejects(
      invoke(value, helper, "apply"),
      (error) => error.code === "NATIVE_HELPER_FAILED" &&
        error.details?.receipt?.error?.code === "TRANSACTION_BUSY",
    );
    const completed = await first;
    assert.equal(completed.receipt.status, "committed-with-preimage-custody");
  } finally {
    await closeFixture(value);
  }
});

test("an ancestor-directory replacement during preparation fails before commit", async () => {
  const value = await fixture(3);
  try {
    const helper = await compileHelper(value.root, value.entries);
    const operation = invoke(value, helper, "apply", {
      HELP_MATH_ADAPTIVE_ATOMIC_PAUSE_POINT: "after-prepare",
    });
    await waitForFile(
      path.join(transactionRoot(value), "journal.log"),
      /^prepared\t000000\t/mu,
    );
    await rename(path.join(value.root, "targets"), path.join(value.root, "targets-retained"));
    await mkdir(path.join(value.root, "targets"));
    await assert.rejects(
      operation,
      (error) => error.code === "NATIVE_HELPER_FAILED" &&
        error.details?.receipt?.error?.code === "ANCESTOR_IDENTITY_MISMATCH",
    );
    for (const [index, entry] of value.entries.entries()) {
      if (entry.prestate === "absent") continue;
      assert.equal(
        await readFile(
          path.join(value.root, "targets-retained", path.basename(entry.targetPath)),
          "utf8",
        ),
        `old-${index + 1}\n`,
      );
    }
  } finally {
    await closeFixture(value);
  }
});

test("dynamic preimage identity is cryptographically bound to the transaction id", async () => {
  const value = await fixture(3);
  try {
    const helper = await compileHelper(value.root, value.entries);
    const lines = value.manifest.bytes.toString("utf8").split("\n");
    const fields = lines[12].split("\t");
    fields[9] = String(BigInt(fields[9]) + 1n);
    lines[12] = fields.join("\t");
    const tampered = Buffer.from(lines.join("\n"));
    assert.notEqual(
      adaptiveAtomicPreconditionSha256(value.entries),
      "0".repeat(64),
    );
    await assert.rejects(
      invokeManifest(value, helper, "apply", tampered),
      (error) => error.code === "NATIVE_HELPER_FAILED" &&
        error.details?.receipt?.error?.code === "TRANSACTION_IDENTITY_MISMATCH",
    );
  } finally {
    await closeFixture(value);
  }
});

test("bundle bytes are rehashed by the native helper before any staging", async () => {
  const value = await fixture(3);
  try {
    const helper = await compileHelper(value.root, value.entries);
    const original = await readFile(value.bundlePath);
    const tampered = Buffer.from(original);
    tampered[0] ^= 0xff;
    await writeFile(value.bundlePath, tampered);
    await assert.rejects(
      invoke(value, helper, "apply"),
      (error) => error.code === "NATIVE_HELPER_FAILED" &&
        error.details?.receipt?.error?.code === "BUNDLE_HASH_MISMATCH",
    );
    await assert.rejects(
      readFile(transactionRoot(value)),
      (error) => ["ENOENT", "EISDIR"].includes(error.code),
    );
  } finally {
    await closeFixture(value);
  }
});

test("symlink, hardlink, and same-byte inode replacement preconditions fail closed", async (t) => {
  await t.test("final symlink", async () => {
    const value = await fixture(3);
    try {
      const helper = await compileHelper(value.root, value.entries);
      const target = path.join(value.root, value.entries[0].targetPath);
      const retained = `${target}.retained`;
      await rename(target, retained);
      await symlink(retained, target);
      await assert.rejects(
        invoke(value, helper, "apply"),
        (error) => error.code === "NATIVE_HELPER_FAILED" &&
          error.details?.receipt?.error?.code === "SYMLINK_REJECTED",
      );
      assert.equal(await readFile(retained, "utf8"), "old-1\n");
    } finally {
      await closeFixture(value);
    }
  });

  await t.test("hardlink", async () => {
    const value = await fixture(3);
    try {
      const helper = await compileHelper(value.root, value.entries);
      const target = path.join(value.root, value.entries[0].targetPath);
      await link(target, `${target}.hardlink`);
      await assert.rejects(
        invoke(value, helper, "apply"),
        (error) => error.code === "NATIVE_HELPER_FAILED" &&
          error.details?.receipt?.error?.code === "UNSAFE_FILE_TYPE",
      );
    } finally {
      await closeFixture(value);
    }
  });

  await t.test("same bytes, new inode", async () => {
    const value = await fixture(3);
    try {
      const helper = await compileHelper(value.root, value.entries);
      const target = path.join(value.root, value.entries[0].targetPath);
      const replacement = `${target}.replacement`;
      await writeFile(replacement, await readFile(target), {mode: 0o644});
      await rename(replacement, target);
      await assert.rejects(
        invoke(value, helper, "apply"),
        (error) => error.code === "NATIVE_HELPER_FAILED" &&
          error.details?.receipt?.error?.code === "TRANSACTION_STATE_FOREIGN",
      );
    } finally {
      await closeFixture(value);
    }
  });
});

test("a complete 286-entry fixture commits and rolls back without deleting custody", async () => {
  const value = await fixture(286);
  try {
    const helper = await compileHelper(value.root, value.entries);
    const applied = await invoke(value, helper, "apply");
    assert.equal(applied.receipt.entryCount, 286);
    assert.equal(applied.receipt.status, "committed-with-preimage-custody");
    for (const entry of value.entries) {
      assert.deepEqual(
        await readFile(path.join(value.root, entry.targetPath)),
        entry.outputBytes,
      );
    }
    const journal = await readFile(
      path.join(transactionRoot(value), "journal.log"),
      "utf8",
    );
    const committedOrdinals = journal.split("\n")
      .filter((line) => line.startsWith("committed\t"))
      .map((line) => Number(line.split("\t")[1]));
    assert.deepEqual(
      committedOrdinals,
      Array.from({length: 286}, (_, index) => index + 1),
    );
    const rolledBack = await invoke(value, helper, "recover-rollback");
    assert.equal(rolledBack.receipt.status, "rolled-back-with-custody");
    for (const [index, entry] of value.entries.entries()) {
      const target = path.join(value.root, entry.targetPath);
      if (entry.prestate === "absent") {
        await assert.rejects(readFile(target), (error) => error.code === "ENOENT");
      } else {
        assert.equal(await readFile(target, "utf8"), `old-${index + 1}\n`);
      }
      assert.deepEqual(
        await readFile(path.join(
          transactionRoot(value),
          "stage",
          `${String(index + 1).padStart(6, "0")}.bin`,
        )),
        entry.outputBytes,
      );
    }
  } finally {
    await closeFixture(value);
  }
});

test("stored-manifest recovery reconstructs the exact 286-output bundle", async () => {
  const value = await fixture(286, {productionShape: true});
  try {
    const helper = await compileHelper(value.root, value.entries);
    await assert.rejects(
      invoke(value, helper, "apply", {
        HELP_MATH_ADAPTIVE_ATOMIC_CRASH_POINT: "after-rename:143",
      }),
      (error) => error.code === "NATIVE_HELPER_FAILED" &&
        error.details?.code === 86,
    );
    const recovered = await recoverAdaptiveAtomicCommitFromStoredManifest({
      action: "recover-forward",
      transactionId: value.manifest.transactionId,
      helperPath: helper.executable,
      expectedHelperSha256: helper.sha256,
      expectedStaticContractSha256: helper.staticSha,
      plan: value.plan,
      projectRoot: value.root,
      expectedEvidence: value.evidence,
    });
    assert.equal(recovered.receipt.status, "committed-with-preimage-custody");
    assert.equal(recovered.receipt.entryCount, 286);
    for (const entry of value.entries) {
      assert.deepEqual(
        await readFile(path.join(value.root, entry.targetPath)),
        entry.outputBytes,
      );
    }
  } finally {
    await closeFixture(value);
  }
});

test("production build ignores crash-injection environment", async () => {
  const value = await fixture(3);
  try {
    const helper = await compileHelper(value.root, value.entries, {testing: false});
    const applied = await invoke(value, helper, "apply", {
      HELP_MATH_ADAPTIVE_ATOMIC_CRASH_POINT: "after-rename:1",
      HELP_MATH_ADAPTIVE_ATOMIC_PAUSE_POINT: "after-prepare",
    });
    assert.equal(applied.receipt.status, "committed-with-preimage-custody");
  } finally {
    await closeFixture(value);
  }
});
