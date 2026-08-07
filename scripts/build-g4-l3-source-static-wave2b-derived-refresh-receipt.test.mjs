import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {
  chmod,
  copyFile,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import test from "node:test";

import {
  applyDerivedRefreshReceipt,
  checkDerivedRefreshReceipt,
  dryRunDerivedRefreshReceipt,
  EXPECTED_DERIVED_REFRESH_BINDINGS,
  parseDerivedRefreshArguments,
  validateDerivedRefreshSemanticState,
  WAVE2B_DERIVED_REFRESH_PATHS,
} from "./build-g4-l3-source-static-wave2b-derived-refresh-receipt.mjs";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const WAVE2B_TRANSACTION_ID =
  "05b68e54281b0602929d769ca59f101bf8dcdba9937d49cb0dbe39eb0a5523f1";
const WAVE2B_TRANSACTION_ROOT =
  `work/g4-l3-source-static-source-audit-wave2b-closure/transactions/${WAVE2B_TRANSACTION_ID}`;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function exists(absolutePath) {
  try {
    await lstat(absolutePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function waitForPath(absolutePath, child, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await exists(absolutePath)) return;
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(
        `crash fixture exited before checkpoint: ${child.exitCode}/${
          child.signalCode
        }`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`timed out waiting for crash checkpoint: ${absolutePath}`);
}

async function crashApplyAt(root, hookName) {
  const signalPath = path.join(root, `crash-${hookName}.signal`);
  const writerUrl = pathToFileURL(path.join(
    PROJECT_ROOT,
    "scripts/build-g4-l3-source-static-wave2b-derived-refresh-receipt.mjs",
  )).href;
  const program = `
    import {writeFile} from "node:fs/promises";
    const {applyDerivedRefreshReceipt} = await import(${JSON.stringify(
      writerUrl,
    )});
    await applyDerivedRefreshReceipt({
      root: ${JSON.stringify(root)},
      hooks: {
        ${hookName}: async () => {
          await writeFile(
            ${JSON.stringify(signalPath)},
            "ready\\n",
            {flag: "wx"},
          );
          await new Promise(() => {
            setInterval(() => {}, 1_000);
          });
        },
      },
    });
  `;
  const child = spawn(
    process.execPath,
    ["--input-type=module", "-e", program],
    {stdio: ["ignore", "pipe", "pipe"]},
  );
  await waitForPath(signalPath, child);
  assert.equal(child.kill("SIGKILL"), true);
  const exit = await new Promise((resolve) => {
    child.once("exit", (code, signal) => resolve({code, signal}));
  });
  assert.equal(exit.signal, "SIGKILL");
  return {signalPath};
}

async function copyTree(source, destination) {
  const metadata = await lstat(source);
  if (metadata.isDirectory() && !metadata.isSymbolicLink()) {
    await mkdir(destination, {
      recursive: true,
      mode: metadata.mode & 0o777,
    });
    const entries = await readdir(source, {withFileTypes: true});
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
    for (const entry of entries) {
      await copyTree(
        path.join(source, entry.name),
        path.join(destination, entry.name),
      );
    }
    await chmod(destination, metadata.mode & 0o777);
    return;
  }
  assert.equal(metadata.isFile() && !metadata.isSymbolicLink(), true);
  await mkdir(path.dirname(destination), {recursive: true});
  await copyFile(source, destination);
  await chmod(destination, metadata.mode & 0o777);
}

async function copyRelative(root, relativePath) {
  await copyTree(
    path.join(PROJECT_ROOT, ...relativePath.split("/")),
    path.join(root, ...relativePath.split("/")),
  );
}

async function fixture() {
  const canonicalTemporaryRoot = await realpath(os.tmpdir());
  const root = await mkdtemp(
    path.join(canonicalTemporaryRoot, "g4-l3-wave2b-derived-refresh-"),
  );
  const receipt = JSON.parse(await readFile(
    path.join(
      PROJECT_ROOT,
      ...WAVE2B_DERIVED_REFRESH_PATHS.wave2bReceipt.split("/"),
    ),
    "utf8",
  ));
  await copyRelative(root, WAVE2B_TRANSACTION_ROOT);
  const paths = new Set([
    WAVE2B_DERIVED_REFRESH_PATHS.script,
    WAVE2B_DERIVED_REFRESH_PATHS.casModule,
    WAVE2B_DERIVED_REFRESH_PATHS.wave2bReceipt,
    ...receipt.items.map((item) => item.spec.postimage.path),
    ...receipt.protectedPins.map((pin) => pin.path),
    ...EXPECTED_DERIVED_REFRESH_BINDINGS.map((binding) => binding.path),
  ]);
  for (const relativePath of [...paths].sort()) {
    await copyRelative(root, relativePath);
  }
  return {root, receipt};
}

async function fileRows(root, relativePaths) {
  const rows = [];
  for (const relativePath of [...relativePaths].sort()) {
    const absolute = path.join(root, ...relativePath.split("/"));
    const metadata = await lstat(absolute);
    const bytes = await readFile(absolute);
    rows.push({
      path: relativePath,
      bytes: bytes.length,
      sha256: sha256(bytes),
      mode: metadata.mode & 0o777,
      nlink: metadata.nlink,
      dev: String(metadata.dev),
      ino: String(metadata.ino),
      mtimeMs: String(metadata.mtimeMs),
      ctimeMs: String(metadata.ctimeMs),
    });
  }
  return rows;
}

async function transactionFilePaths(root, relativeDirectory) {
  const rows = [];
  async function visit(relativePath) {
    const entries = await readdir(
      path.join(root, ...relativePath.split("/")),
      {withFileTypes: true},
    );
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
    for (const entry of entries) {
      const child = `${relativePath}/${entry.name}`;
      if (entry.isDirectory() && !entry.isSymbolicLink()) {
        await visit(child);
      } else {
        rows.push(child);
      }
    }
  }
  await visit(relativeDirectory);
  return rows;
}

async function upstreamPreservationDigest(root, receipt) {
  const paths = new Set([
    WAVE2B_DERIVED_REFRESH_PATHS.wave2bReceipt,
    ...await transactionFilePaths(root, WAVE2B_TRANSACTION_ROOT),
    ...receipt.items.map((item) => item.spec.postimage.path),
    ...receipt.protectedPins.map((pin) => pin.path),
  ]);
  return sha256(Buffer.from(JSON.stringify(await fileRows(root, paths))));
}

async function semanticMap(root) {
  const entries = await Promise.all(
    EXPECTED_DERIVED_REFRESH_BINDINGS
      .filter((binding) => binding.path.endsWith(".json"))
      .map(async (binding) => [
        binding.path,
        {
          path: binding.path,
          contents: await readFile(
            path.join(root, ...binding.path.split("/")),
          ),
        },
      ]),
  );
  return new Map(entries);
}

async function rewriteJson(root, relativePath, mutate, mode = 0o644) {
  const absolute = path.join(root, ...relativePath.split("/"));
  await chmod(absolute, 0o644);
  const value = JSON.parse(await readFile(absolute, "utf8"));
  mutate(value);
  await writeFile(absolute, `${JSON.stringify(value, null, 2)}\n`);
  await chmod(absolute, mode);
}

test("CLI is dry-run by default and requires one explicit mode", () => {
  assert.deepEqual(parseDerivedRefreshArguments([]).mode, "dry-run");
  assert.equal(
    parseDerivedRefreshArguments(["--apply", "--root", "/tmp/example"]).mode,
    "apply",
  );
  assert.equal(parseDerivedRefreshArguments(["--check"]).mode, "check");
  assert.throws(
    () => parseDerivedRefreshArguments(["--apply", "--check"]),
    /mutually exclusive/u,
  );
  assert.throws(
    () => parseDerivedRefreshArguments(["--unknown"]),
    /unknown argument/u,
  );
});

test("default dry-run proves exact scope and writes nothing", async (t) => {
  const {root} = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));
  const result = await dryRunDerivedRefreshReceipt({root});
  assert.equal(result.mode, "dry-run");
  assert.equal(result.status, "ready-no-write");
  assert.equal(result.protectedPinTransitionCount, 10);
  assert.equal(result.intentionalDerivedRefreshCount, 2);
  assert.equal(result.derivedRefreshArtifactCount, 12);
  assert.equal(result.sourceSpecCount, 19);
  assert.equal(result.strictComplete, 0);
  assert.equal(result.published, false);
  assert.equal(await exists(path.join(
    root,
    ...WAVE2B_DERIVED_REFRESH_PATHS.receipt.split("/"),
  )), false);
  assert.equal(await exists(path.join(
    root,
    ...WAVE2B_DERIVED_REFRESH_PATHS.workRoot.split("/"),
  )), false);
});

test("explicit apply is no-replace, immutable, preserving, and replay-safe",
  async (t) => {
    const {root, receipt} = await fixture();
    t.after(() => rm(root, {recursive: true, force: true}));
    const before = await upstreamPreservationDigest(root, receipt);
    const first = await applyDerivedRefreshReceipt({root});
    assert.equal(first.mode, "apply");
    assert.equal(first.status, "created-and-verified");
    assert.equal(first.strictComplete, 0);
    assert.equal(first.published, false);
    const receiptAbsolute = path.join(
      root,
      ...WAVE2B_DERIVED_REFRESH_PATHS.receipt.split("/"),
    );
    const metadata = await lstat(receiptAbsolute);
    assert.equal(metadata.mode & 0o777, 0o444);
    assert.equal(metadata.nlink, 1);
    const planAbsolute = path.join(
      root,
      ...WAVE2B_DERIVED_REFRESH_PATHS.plan.split("/"),
    );
    const plan = JSON.parse(await readFile(planAbsolute, "utf8"));
    assert.match(plan.transactionId, /^[a-f0-9]{64}$/u);
    assert.equal(plan.lockBinding.transactionId, plan.transactionId);
    assert.match(plan.lockBinding.acquisitionId, /^[a-f0-9]{64}$/u);
    assert.match(plan.lockBinding.ownerSha256, /^[a-f0-9]{64}$/u);
    assert.match(plan.lockBinding.ownerDev, /^(?:0|[1-9][0-9]*)$/u);
    assert.match(plan.lockBinding.ownerIno, /^(?:0|[1-9][0-9]*)$/u);
    assert.equal((await lstat(planAbsolute)).mode & 0o777, 0o444);
    const journalAbsolute = path.join(
      root,
      ...WAVE2B_DERIVED_REFRESH_PATHS.journal.split("/"),
    );
    const journalLines = (await readFile(journalAbsolute, "utf8"))
      .trimEnd()
      .split("\n");
    let previousRecordSha256 = null;
    for (const [index, line] of journalLines.entries()) {
      const record = JSON.parse(line);
      assert.equal(record.sequence, index + 1);
      assert.equal(record.transactionId, plan.transactionId);
      assert.equal(record.previousRecordSha256, previousRecordSha256);
      previousRecordSha256 = sha256(Buffer.from(`${line}\n`));
    }
    assert.equal(JSON.parse(journalLines.at(-1)).event, "committed");
    assert.equal((await lstat(journalAbsolute)).mode & 0o777, 0o600);
    assert.equal(
      await upstreamPreservationDigest(root, receipt),
      before,
    );
    assert.equal(await exists(path.join(
      root,
      ...WAVE2B_DERIVED_REFRESH_PATHS.lock.split("/"),
    )), false);
    const reportEntries = await readdir(path.dirname(receiptAbsolute));
    assert.equal(reportEntries.some((entry) =>
      entry.includes("derived-refresh-receipt.json.tmp-")), false);
    const second = await applyDerivedRefreshReceipt({root});
    assert.equal(second.mode, "replay");
    assert.equal(second.status, "already-created-and-verified");
    assert.deepEqual(second.receipt, first.receipt);
    assert.deepEqual(await checkDerivedRefreshReceipt({root}), second);
  });

test("a forced partial write exposes no canonical receipt or temp file",
  async (t) => {
    const {root} = await fixture();
    t.after(() => rm(root, {recursive: true, force: true}));
    await assert.rejects(
      applyDerivedRefreshReceipt({
        root,
        hooks: {
          afterTempWrite() {
            throw new Error("injected partial-write interruption");
          },
        },
      }),
      /injected partial-write interruption/u,
    );
    assert.equal(await exists(path.join(
      root,
      ...WAVE2B_DERIVED_REFRESH_PATHS.receipt.split("/"),
    )), false);
    assert.equal(await exists(path.join(
      root,
      ...WAVE2B_DERIVED_REFRESH_PATHS.lock.split("/"),
    )), false);
    const reports = await readdir(path.join(root, "reports"));
    assert.equal(reports.some((entry) => entry.includes(".tmp-")), false);
  });

test("tampered immutable Wave2B commit is rejected", async (t) => {
  const {root} = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));
  const relative =
    `${WAVE2B_TRANSACTION_ROOT}/commit.json`;
  await rewriteJson(root, relative, (commit) => {
    commit.strictAcceptanceEffect = "promoted";
  }, 0o444);
  await assert.rejects(
    dryRunDerivedRefreshReceipt({root}),
    /exact binding drifted|transaction tree drifted/u,
  );
});

test("leaf/ancestor symlinks and hardlinked source specs fail identity checks",
  async (t) => {
    const first = await fixture();
    t.after(() => rm(first.root, {recursive: true, force: true}));
    const spec = first.receipt.items[0].spec.postimage.path;
    const specAbsolute = path.join(first.root, ...spec.split("/"));
    await rm(specAbsolute);
    await symlink(
      path.join(
        first.root,
        ...WAVE2B_DERIVED_REFRESH_PATHS.wave2bReceipt.split("/"),
      ),
      specAbsolute,
    );
    await assert.rejects(
      dryRunDerivedRefreshReceipt({root: first.root}),
      /unsafe regular file\/link count/u,
    );

    const second = await fixture();
    t.after(() => rm(second.root, {recursive: true, force: true}));
    const secondSpec = second.receipt.items[0].spec.postimage.path;
    await link(
      path.join(second.root, ...secondSpec.split("/")),
      path.join(second.root, "extra-hardlink"),
    );
    await assert.rejects(
      dryRunDerivedRefreshReceipt({root: second.root}),
      /unsafe regular file\/link count/u,
    );

    const third = await fixture();
    t.after(() => rm(third.root, {recursive: true, force: true}));
    const thirdSpec = third.receipt.items[0].spec.postimage.path;
    const thirdParent = path.dirname(
      path.join(third.root, ...thirdSpec.split("/")),
    );
    const relocatedParent = path.join(third.root, "relocated-audit");
    await copyTree(thirdParent, relocatedParent);
    await rm(thirdParent, {recursive: true});
    await symlink(relocatedParent, thirdParent);
    await assert.rejects(
      dryRunDerivedRefreshReceipt({root: third.root}),
      /unsafe directory component/u,
    );
  });

test("unexpected old protected-pin drift is rejected", async (t) => {
  const {root} = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));
  await writeFile(path.join(root, ".gitignore"), "unexpected drift\n");
  await assert.rejects(
    dryRunDerivedRefreshReceipt({root}),
    /unexpected old protected-pin drift/u,
  );
});

test("reviewed ledger hashes are exact and semantic promotion still fails",
  async (t) => {
    const {root} = await fixture();
    t.after(() => rm(root, {recursive: true, force: true}));
    await rewriteJson(root, "catalog/completion-ledger.json", (ledger) => {
      ledger.summary.strictComplete = 1;
    });
    await assert.rejects(
      dryRunDerivedRefreshReceipt({root}),
      /exact binding drifted/u,
    );

    const clean = await fixture();
    t.after(() => rm(clean.root, {recursive: true, force: true}));
    const map = await semanticMap(clean.root);
    const completion = JSON.parse(
      map.get("catalog/completion-ledger.json").contents.toString("utf8"),
    );
    completion.summary.strictComplete = 1;
    map.get("catalog/completion-ledger.json").contents =
      Buffer.from(`${JSON.stringify(completion)}\n`);
    assert.throws(
      () => validateDerivedRefreshSemanticState(map),
      /strict zero/u,
    );
  });

test("published or strict G4 L3 release semantics are rejected", async (t) => {
  const {root} = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));
  const map = await semanticMap(root);
  const release = JSON.parse(
    map.get("catalog/lesson-release-ledger.json").contents.toString("utf8"),
  );
  release.summary.publishedReleaseCount = 1;
  const g4 = release.releases.find((entry) =>
    entry.releaseId === "lesson-g04-l03-negative-numbers");
  g4.published = true;
  g4.status = "published";
  g4.strictCompleteCount = 40;
  g4.missingCount = 0;
  g4.gate.open = true;
  g4.gate.admittedCount = 40;
  map.get("catalog/lesson-release-ledger.json").contents =
    Buffer.from(`${JSON.stringify(release)}\n`);
  assert.throws(
    () => validateDerivedRefreshSemanticState(map),
    /unpublished strict zero/u,
  );
});

test("foreign canonical receipt is never replaced", async (t) => {
  const {root} = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));
  const target = path.join(
    root,
    ...WAVE2B_DERIVED_REFRESH_PATHS.receipt.split("/"),
  );
  const foreign = Buffer.from("foreign successor receipt\n");
  await writeFile(target, foreign);
  await chmod(target, 0o444);
  await assert.rejects(
    applyDerivedRefreshReceipt({root}),
    /stale or foreign/u,
  );
  assert.deepEqual(await readFile(target), foreign);
});

test("atomic no-replace preserves a target created after the temp write",
  async (t) => {
    const {root} = await fixture();
    t.after(() => rm(root, {recursive: true, force: true}));
    const target = path.join(
      root,
      ...WAVE2B_DERIVED_REFRESH_PATHS.receipt.split("/"),
    );
    const foreign = Buffer.from("concurrent foreign successor receipt\n");
    await assert.rejects(
      applyDerivedRefreshReceipt({
        root,
        hooks: {
          async afterTempWrite() {
            await writeFile(target, foreign, {flag: "wx", mode: 0o444});
          },
        },
      }),
      /foreign or uncertain state was preserved/u,
    );
    assert.deepEqual(await readFile(target), foreign);
    assert.equal(await exists(path.join(
      root,
      ...WAVE2B_DERIVED_REFRESH_PATHS.lock.split("/"),
    )), true);
    assert.equal(await exists(path.join(
      root,
      ...WAVE2B_DERIVED_REFRESH_PATHS.temp.split("/"),
    )), false);
    const targetName = path.basename(target);
    const parentEntries = await readdir(path.dirname(target));
    assert.deepEqual(
      parentEntries.filter((entry) => entry.startsWith(`${targetName}.tmp-`)),
      [],
    );
  });

test("input drift after temp and after link rolls back every owned artifact",
  async (t) => {
    for (const hookName of ["afterTempWrite", "afterLink"]) {
      const {root} = await fixture();
      t.after(() => rm(root, {recursive: true, force: true}));
      await assert.rejects(
        applyDerivedRefreshReceipt({
          root,
          hooks: {
            async [hookName]() {
              await rewriteJson(
                root,
                "reports/g4-l3-current-javascript-progress.json",
                (progress) => {
                  progress.summary.strictCompletePages = 1;
                },
              );
            },
          },
        }),
        /transaction-time derived|exact binding drifted|strict migration/u,
      );
      for (const relativePath of [
        WAVE2B_DERIVED_REFRESH_PATHS.receipt,
        WAVE2B_DERIVED_REFRESH_PATHS.temp,
        WAVE2B_DERIVED_REFRESH_PATHS.lock,
        WAVE2B_DERIVED_REFRESH_PATHS.workRoot,
      ]) {
        assert.equal(
          await exists(path.join(root, ...relativePath.split("/"))),
          false,
          `${hookName}: ${relativePath}`,
        );
      }
    }
  });

test("SIGKILL before and after link resumes through stale-lock adoption",
  async (t) => {
    for (const hookName of ["afterTempWrite", "afterLink"]) {
      const {root} = await fixture();
      t.after(() => rm(root, {recursive: true, force: true}));
      await crashApplyAt(root, hookName);
      assert.equal(await exists(path.join(
        root,
        ...WAVE2B_DERIVED_REFRESH_PATHS.lock.split("/"),
      )), true);
      const recovered = await applyDerivedRefreshReceipt({root});
      assert.equal(recovered.status, "recovered-created-and-verified");
      assert.equal(recovered.recovered, true);
      assert.equal(recovered.strictComplete, 0);
      assert.equal(recovered.published, false);
      assert.equal(await exists(path.join(
        root,
        ...WAVE2B_DERIVED_REFRESH_PATHS.temp.split("/"),
      )), false);
      assert.equal(await exists(path.join(
        root,
        ...WAVE2B_DERIVED_REFRESH_PATHS.lock.split("/"),
      )), false);
      const replay = await checkDerivedRefreshReceipt({root});
      assert.equal(replay.status, "already-created-and-verified");
    }
  });

test("a live lock rejects a simultaneous second apply", async (t) => {
  const {root} = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));
  let reached;
  const reachedPromise = new Promise((resolve) => {
    reached = resolve;
  });
  let resume;
  const resumePromise = new Promise((resolve) => {
    resume = resolve;
  });
  const first = applyDerivedRefreshReceipt({
    root,
    hooks: {
      async afterTempWrite() {
        reached();
        await resumePromise;
      },
    },
  });
  await reachedPromise;
  await assert.rejects(
    applyDerivedRefreshReceipt({root}),
    /owner is still alive|dead owner-liveness/u,
  );
  resume();
  const completed = await first;
  assert.equal(completed.status, "created-and-verified");
  assert.equal(await exists(path.join(
    root,
    ...WAVE2B_DERIVED_REFRESH_PATHS.lock.split("/"),
  )), false);
});

test("restart preserves foreign temp, target, and symlink inodes",
  async (t) => {
    const foreignTemp = await fixture();
    t.after(() => rm(foreignTemp.root, {recursive: true, force: true}));
    await crashApplyAt(foreignTemp.root, "afterTempWrite");
    const tempPath = path.join(
      foreignTemp.root,
      ...WAVE2B_DERIVED_REFRESH_PATHS.temp.split("/"),
    );
    const tempBytes = await readFile(tempPath);
    const priorTemp = await lstat(tempPath);
    await unlink(tempPath);
    await writeFile(tempPath, tempBytes);
    await chmod(tempPath, 0o444);
    const replacementTemp = await lstat(tempPath);
    assert.notEqual(replacementTemp.ino, priorTemp.ino);
    await assert.rejects(
      applyDerivedRefreshReceipt({root: foreignTemp.root}),
      /foreign|ownership|preserved/u,
    );
    assert.equal((await lstat(tempPath)).ino, replacementTemp.ino);

    const symlinkTemp = await fixture();
    t.after(() => rm(symlinkTemp.root, {recursive: true, force: true}));
    await crashApplyAt(symlinkTemp.root, "afterTempWrite");
    const symlinkPath = path.join(
      symlinkTemp.root,
      ...WAVE2B_DERIVED_REFRESH_PATHS.temp.split("/"),
    );
    await unlink(symlinkPath);
    await symlink(
      path.join(
        symlinkTemp.root,
        ...WAVE2B_DERIVED_REFRESH_PATHS.wave2bReceipt.split("/"),
      ),
      symlinkPath,
    );
    await assert.rejects(
      applyDerivedRefreshReceipt({root: symlinkTemp.root}),
      /symlink|foreign|preserved/u,
    );
    assert.equal((await lstat(symlinkPath)).isSymbolicLink(), true);

    const foreignTarget = await fixture();
    t.after(() => rm(foreignTarget.root, {recursive: true, force: true}));
    await crashApplyAt(foreignTarget.root, "afterLink");
    const targetPath = path.join(
      foreignTarget.root,
      ...WAVE2B_DERIVED_REFRESH_PATHS.receipt.split("/"),
    );
    await unlink(targetPath);
    const foreign = Buffer.from("foreign post-link target\n");
    await writeFile(targetPath, foreign);
    await chmod(targetPath, 0o444);
    const foreignIdentity = await lstat(targetPath);
    await assert.rejects(
      applyDerivedRefreshReceipt({root: foreignTarget.root}),
      /foreign|ownership|preserved/u,
    );
    assert.equal((await lstat(targetPath)).ino, foreignIdentity.ino);
    assert.deepEqual(await readFile(targetPath), foreign);
    assert.equal(await exists(path.join(
      foreignTarget.root,
      ...WAVE2B_DERIVED_REFRESH_PATHS.temp.split("/"),
    )), false);
  });

test("tampered successor receipt fails replay", async (t) => {
  const {root} = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));
  await applyDerivedRefreshReceipt({root});
  const target = path.join(
    root,
    ...WAVE2B_DERIVED_REFRESH_PATHS.receipt.split("/"),
  );
  await chmod(target, 0o644);
  const receipt = JSON.parse(await readFile(target, "utf8"));
  receipt.semanticState.completionLedger.strictComplete = 1;
  await writeFile(target, `${JSON.stringify(receipt, null, 2)}\n`);
  await chmod(target, 0o444);
  await assert.rejects(
    checkDerivedRefreshReceipt({root}),
    /stale or foreign/u,
  );
});

test("drift after lock acquisition aborts before canonical publication",
  async (t) => {
    const {root} = await fixture();
    t.after(() => rm(root, {recursive: true, force: true}));
    await assert.rejects(
      applyDerivedRefreshReceipt({
        root,
        hooks: {
          async afterLockedSnapshot() {
            await rewriteJson(
              root,
              "reports/g4-l3-current-javascript-progress.json",
              (progress) => {
                progress.summary.strictCompletePages = 1;
              },
            );
          },
        },
      }),
      /exact binding drifted|strict-zero|strict migration/u,
    );
    assert.equal(await exists(path.join(
      root,
      ...WAVE2B_DERIVED_REFRESH_PATHS.receipt.split("/"),
    )), false);
    assert.equal(await exists(path.join(
      root,
      ...WAVE2B_DERIVED_REFRESH_PATHS.lock.split("/"),
    )), false);
  });
