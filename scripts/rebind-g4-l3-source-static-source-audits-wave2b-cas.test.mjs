import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {
  chmod,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  rmdir,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {createHash} from "node:crypto";
import {promisify} from "node:util";

import {
  CAS_STATES,
  acquireWave2bLock,
  adoptWave2bLockForRecovery,
  applyWave2bCasBatch as applyWave2bCasBatchRaw,
  assertWave2bLock,
  inspectWave2bCasItem,
  recoverWave2bCasBatch as recoverWave2bCasBatchRaw,
  releaseWave2bLock,
  safeWave2bRelative,
} from "./rebind-g4-l3-source-static-source-audits-wave2b-cas.mjs";

const execFileAsync = promisify(execFile);

async function testJournal() {}

let testLockSerial = 0;

async function withTestLock(rawOperation, options = {}) {
  const rootPath = options.items[0].rootPath;
  testLockSerial += 1;
  const lock = await acquireWave2bLock({
    rootPath,
    lockPath: path.join(rootPath, ".wave2b-operation.lock"),
    owner: {
      transactionId: `wave2b-test-${testLockSerial}`,
      pid: process.pid,
    },
  });
  try {
    return await rawOperation({
      ...options,
      journal: options.journal ?? testJournal,
      lock,
    });
  } finally {
    await releaseWave2bLock(lock);
  }
}

function applyWave2bCasBatch(options = {}) {
  return withTestLock(applyWave2bCasBatchRaw, options);
}

function recoverWave2bCasBatch(options = {}) {
  return withTestLock(recoverWave2bCasBatchRaw, options);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function jsonClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function refingerprintBinding(binding) {
  const copy = jsonClone(binding);
  delete copy.descriptorSha256;
  copy.descriptorSha256 = sha256(
    Buffer.from(`${JSON.stringify(copy)}\n`),
  );
  return copy;
}

async function acquireRecoveryFixtureLock(context, transactionId) {
  return acquireWave2bLock({
    rootPath: context.root,
    lockPath: context.lockPath,
    owner: {
      transactionId,
      pid: process.pid,
      processStartIdentity: `test-process-${transactionId}`,
    },
  });
}

async function adoptRecoveryFixtureLock(context, lock, overrides = {}) {
  return adoptWave2bLockForRecovery({
    rootPath: context.root,
    lockPath: context.lockPath,
    items: context.items,
    persistedBinding: jsonClone(lock.persistedBinding),
    decideOwnerLiveness: async () => "dead",
    journal: testJournal,
    ...overrides,
  });
}

async function exists(target) {
  return lstat(target).then(() => true, (error) => {
    if (error.code === "ENOENT") return false;
    throw error;
  });
}

async function fixture(t) {
  const root = await mkdtemp(path.join(
    os.tmpdir(),
    "g4-l3-wave2b-cas-test-",
  ));
  t.after(async () => {
    await rm(root, {recursive: true, force: true});
  });
  const transactionRoot = path.join(root, "transaction");
  const items = [];
  for (let index = 0; index < 19; index += 1) {
    const preBytes = Buffer.from(
      `${JSON.stringify({id: index, audit: "wave2"})}\n`,
    );
    const postBytes = Buffer.from(
      `${JSON.stringify({
        id: index,
        audit: "wave2",
        securityClosure: "wave2b",
      })}\n`,
    );
    const targetPath = path.join(root, "specs", `${index}.json`);
    await mkdir(path.dirname(targetPath), {recursive: true});
    await writeFile(targetPath, preBytes, {flag: "wx", mode: 0o644});
    items.push({
      id: `member-${String(index).padStart(2, "0")}`,
      rootPath: root,
      targetPath,
      tempOwnershipPath: path.join(
        transactionRoot,
        "active",
        `${index}.temp.owner`,
      ),
      tempPath: path.join(
        transactionRoot,
        "active",
        `${index}.post.tmp`,
      ),
      quarantinePath: path.join(
        transactionRoot,
        "active",
        `${index}.pre.quarantine`,
      ),
      postArchivePath: path.join(
        transactionRoot,
        "recovery",
        `${index}.post.json`,
      ),
      preimage: {
        bytes: preBytes.length,
        sha256: sha256(preBytes),
      },
      postimage: {
        bytes: postBytes.length,
        sha256: sha256(postBytes),
      },
      postBytes,
      originalMode: 0o644,
    });
  }
  const protectedPath = path.join(root, "protected.json");
  const sourcePath = path.join(root, "source.swf");
  await writeFile(protectedPath, "protected\n", {flag: "wx"});
  await writeFile(sourcePath, "source\n", {flag: "wx"});
  return {
    root,
    items,
    protectedPath,
    sourcePath,
    protectedBytes: await readFile(protectedPath),
    sourceBytes: await readFile(sourcePath),
    receiptPath: path.join(root, "receipt.json"),
    lockPath: path.join(root, ".wave2b.lock"),
  };
}

async function assertPreimageState(context) {
  for (const [index, item] of context.items.entries()) {
    const inspection = await inspectWave2bCasItem(item, index);
    assert.ok(
      inspection.state === CAS_STATES.PREIMAGE ||
        inspection.state === CAS_STATES.RECOVERED,
      `${item.id}: unexpected final state ${inspection.state}`,
    );
    assert.equal(inspection.observed.target.nlink, 1);
    assert.equal(inspection.observed.target.mode, 0o644);
    assert.equal(await exists(item.tempPath), false);
    assert.equal(await exists(item.tempOwnershipPath), false);
    assert.equal(await exists(item.quarantinePath), false);
  }
  assert.equal(await exists(context.receiptPath), false);
  assert.equal(await exists(context.lockPath), false);
  assert.deepEqual(
    await readFile(context.protectedPath),
    context.protectedBytes,
  );
  assert.deepEqual(await readFile(context.sourcePath), context.sourceBytes);
}

async function snapshotItems(items) {
  return Promise.all(items.map((item, index) =>
    inspectWave2bCasItem(item, index)));
}

async function replaceWithForeignInode(target, label) {
  const before = await lstat(target);
  const bytes = await readFile(target);
  await unlink(target);
  await writeFile(target, bytes, {flag: "wx", mode: 0o644});
  await chmod(target, 0o644);
  const after = await lstat(target);
  assert.ok(
    before.dev !== after.dev || before.ino !== after.ino,
    `${label}: replacement must use a foreign inode`,
  );
  return {
    bytes,
    dev: after.dev,
    ino: after.ino,
    mode: after.mode & 0o777,
  };
}

async function assertForeignInodeSurvives(target, foreign) {
  const observed = await lstat(target);
  assert.equal(observed.dev, foreign.dev);
  assert.equal(observed.ino, foreign.ino);
  assert.equal(observed.mode & 0o777, foreign.mode);
  assert.deepEqual(await readFile(target), foreign.bytes);
}

async function replaceWithForeignDirectory(target, label) {
  const before = await lstat(target);
  await rmdir(target);
  await mkdir(target, {recursive: false, mode: 0o700});
  await chmod(target, 0o700);
  const after = await lstat(target);
  assert.ok(
    before.dev !== after.dev || before.ino !== after.ino,
    `${label}: replacement must use a foreign directory inode`,
  );
  return {
    dev: after.dev,
    ino: after.ino,
  };
}

async function assertForeignDirectorySurvives(target, foreign) {
  const observed = await lstat(target);
  assert.equal(observed.isDirectory(), true);
  assert.equal(observed.isSymbolicLink(), false);
  assert.equal(observed.dev, foreign.dev);
  assert.equal(observed.ino, foreign.ino);
  assert.equal(observed.mode & 0o777, 0o700);
}

function errorTreeHasCode(error, code, seen = new Set()) {
  if (error?.code === code) return true;
  if (
    error === null ||
    (typeof error !== "object" && typeof error !== "function") ||
    seen.has(error)
  ) return false;
  seen.add(error);
  if (
    error instanceof AggregateError &&
    error.errors.some((child) =>
      errorTreeHasCode(child, code, seen))
  ) return true;
  return errorTreeHasCode(error.cause, code, seen);
}

async function captureRejection(operation) {
  try {
    await operation();
  } catch (error) {
    return error;
  }
  throw new Error("expected operation to reject");
}

function isRecoveryJournalEvent(event) {
  return typeof event?.event === "string" &&
    /^recover(?:y|ed)/u.test(event.event);
}

test("wave2b apply and recovery fail closed without a journal",
  async (t) => {
    const context = await fixture(t);
    await assert.rejects(
      applyWave2bCasBatchRaw({items: context.items}),
      /requires a durable journal callback/u,
    );
    await assert.rejects(
      recoverWave2bCasBatchRaw({items: context.items}),
      /requires a durable journal callback/u,
    );
    await assert.rejects(
      applyWave2bCasBatchRaw({
        items: context.items,
        journal: testJournal,
      }),
      /lock descriptor is invalid/u,
    );
    await assert.rejects(
      recoverWave2bCasBatchRaw({
        items: context.items,
        journal: testJournal,
      }),
      /lock descriptor is invalid/u,
    );
    await assertPreimageState(context);
  });

test("wave2b CAS installs all 19 specs and recovery restores exact preimages",
  async (t) => {
    const context = await fixture(t);
    const applied = await applyWave2bCasBatch({items: context.items});
    assert.equal(applied.installedCount, 19);
    for (const [index, item] of context.items.entries()) {
      const inspection = await inspectWave2bCasItem(item, index);
      assert.equal(inspection.state, CAS_STATES.QUARANTINE_FROZEN);
      assert.equal(inspection.observed.target.nlink, 1);
      assert.equal(inspection.observed.quarantine.nlink, 1);
      assert.equal(inspection.observed.quarantine.mode, 0o444);
    }
    const recovered = await recoverWave2bCasBatch({
      items: context.items,
    });
    assert.equal(recovered.restoredCount, 19);
    await assertPreimageState(context);
  });

const INTERNAL_FAILURE_STATES = [
  CAS_STATES.TEMP_OWNERSHIP_READY,
  CAS_STATES.OWNED_TEMP_COMPLETE,
  CAS_STATES.TEMP_READY,
  CAS_STATES.PREIMAGE_QUARANTINE_LINKED,
  CAS_STATES.TARGET_QUARANTINED,
  CAS_STATES.TARGET_LINKED,
  CAS_STATES.TEMP_UNLINKED,
  CAS_STATES.QUARANTINE_FROZEN,
  CAS_STATES.VERIFIED,
];

test("wave2b internal S1-S6 failures roll back every canonical spec",
  async (t) => {
    for (const state of INTERNAL_FAILURE_STATES) {
      for (const failureIndex of [0, 2]) {
        await t.test(`${state} at index ${failureIndex}`, async (t) => {
          const context = await fixture(t);
          let hookObserved = false;
          await assert.rejects(
            applyWave2bCasBatch({
              items: context.items,
              hooks: {
                async afterState(event) {
                  if (
                    event.index === failureIndex &&
                    event.state === state
                  ) {
                    hookObserved = true;
                    if (state === CAS_STATES.TARGET_QUARANTINED) {
                      assert.equal(event.observed.target.kind, "absent");
                      assert.equal(event.observed.temporary.nlink, 1);
                      assert.equal(event.observed.quarantine.nlink, 1);
                    }
                    if (
                      state === CAS_STATES.PREIMAGE_QUARANTINE_LINKED
                    ) {
                      assert.equal(event.observed.target.nlink, 2);
                      assert.equal(event.observed.quarantine.nlink, 2);
                      assert.equal(
                        event.observed.target.ino,
                        event.observed.quarantine.ino,
                      );
                    }
                    if (state === CAS_STATES.TARGET_LINKED) {
                      assert.equal(event.observed.target.nlink, 2);
                      assert.equal(event.observed.temporary.nlink, 2);
                      assert.equal(
                        event.observed.target.ino,
                        event.observed.temporary.ino,
                      );
                      assert.equal(
                        event.observed.target.dev,
                        event.observed.temporary.dev,
                      );
                    }
                    if (
                      state === CAS_STATES.TEMP_UNLINKED ||
                      state === CAS_STATES.QUARANTINE_FROZEN ||
                      state === CAS_STATES.VERIFIED
                    ) {
                      assert.equal(event.observed.target.nlink, 1);
                      assert.equal(event.observed.temporary.kind, "absent");
                    }
                    throw new Error(`synthetic ${state} failure`);
                  }
                },
              },
            }),
            /wave2b CAS failed and restored/u,
          );
          assert.equal(hookObserved, true);
          await assertPreimageState(context);
        });
      }
    }
  });

test("wave2b crash recovery classifies real S1-S6 states without applied[]",
  async (t) => {
    for (const state of INTERNAL_FAILURE_STATES) {
      await t.test(state, async (t) => {
        const context = await fixture(t);
        await assert.rejects(
          applyWave2bCasBatch({
            items: context.items,
            leaveInterruptedForTest: true,
            hooks: {
              afterState(event) {
                if (event.index === 2 && event.state === state) {
                  throw new Error(`synthetic ${state} crash`);
                }
              },
            },
          }),
          new RegExp(`synthetic ${state} crash`, "u"),
        );
        const recovered = await recoverWave2bCasBatch({
          items: context.items,
        });
        assert.equal(recovered.restoredCount, 3);
        await assertPreimageState(context);
      });
    }
  });

test("wave2b foreign S3 hardlink drift causes zero recovery mutation",
  async (t) => {
    const context = await fixture(t);
    await assert.rejects(
      applyWave2bCasBatch({
        items: context.items,
        leaveInterruptedForTest: true,
        hooks: {
          afterState(event) {
            if (
              event.index === 2 &&
              event.state === CAS_STATES.TARGET_LINKED
            ) {
              throw new Error("synthetic linked crash");
            }
          },
        },
      }),
      /synthetic linked crash/u,
    );
    const extraLink = path.join(context.root, "foreign-third-link");
    await link(context.items[2].targetPath, extraLink);
    const before = await snapshotItems(context.items);
    const protectedBefore = await readFile(context.protectedPath);
    const sourceBefore = await readFile(context.sourcePath);
    await assert.rejects(
      recoverWave2bCasBatch({items: context.items}),
      /foreign filesystem drift without mutation/u,
    );
    assert.deepEqual(await snapshotItems(context.items), before);
    assert.deepEqual(await readFile(context.protectedPath), protectedBefore);
    assert.deepEqual(await readFile(context.sourcePath), sourceBefore);
    assert.equal((await lstat(extraLink)).nlink, 3);
  });

test("wave2b preflight rejects path, symlink, and hardlink inputs",
  async (t) => {
    assert.throws(() => safeWave2bRelative("."), /normalized/u);
    assert.throws(() => safeWave2bRelative(".."), /normalized/u);
    assert.throws(() => safeWave2bRelative("../escape.json"), /normalized/u);
    assert.throws(() => safeWave2bRelative("/tmp/escape.json"), /normalized/u);

    await t.test("ambiguous read-only preimage mode", async (t) => {
      const context = await fixture(t);
      const ambiguous = {
        ...context.items[0],
        originalMode: 0o444,
      };
      await assert.rejects(
        applyWave2bCasBatch({
          items: [ambiguous, ...context.items.slice(1)],
        }),
        /verified 0644 wave2 spec mode/u,
      );
      await assertPreimageState(context);
    });

    await t.test("symlink target", async (t) => {
      const context = await fixture(t);
      const item = context.items[0];
      await unlink(item.targetPath);
      await symlink(context.protectedPath, item.targetPath);
      await assert.rejects(
        applyWave2bCasBatch({items: context.items}),
        /foreign filesystem drift without mutation/u,
      );
      assert.deepEqual(
        await readFile(context.protectedPath),
        context.protectedBytes,
      );
    });

    await t.test("hardlinked target", async (t) => {
      const context = await fixture(t);
      const extra = path.join(context.root, "foreign-preimage-link");
      await link(context.items[0].targetPath, extra);
      await assert.rejects(
        applyWave2bCasBatch({items: context.items}),
        /foreign filesystem drift without mutation/u,
      );
      assert.equal((await lstat(extra)).nlink, 2);
    });

    await t.test("FIFO target is rejected without blocking", async (t) => {
      const context = await fixture(t);
      const item = context.items[0];
      await unlink(item.targetPath);
      await execFileAsync("/usr/bin/mkfifo", [item.targetPath]);
      await assert.rejects(
        applyWave2bCasBatch({items: context.items}),
        /foreign filesystem drift without mutation/u,
      );
      assert.equal((await lstat(item.targetPath)).isFIFO(), true);
      assert.deepEqual(
        await readFile(context.protectedPath),
        context.protectedBytes,
      );
      assert.deepEqual(
        await readFile(context.sourcePath),
        context.sourceBytes,
      );
    });

    await t.test("parent symlink escape", async (t) => {
      const context = await fixture(t);
      const outside = await mkdtemp(path.join(
        os.tmpdir(),
        "g4-l3-wave2b-outside-",
      ));
      t.after(async () => {
        await rm(outside, {recursive: true, force: true});
      });
      const targetBytesBefore = await Promise.all(
        context.items.map((item) => readFile(item.targetPath)),
      );
      const transactionParent = path.dirname(
        path.dirname(context.items[0].tempPath),
      );
      await symlink(outside, transactionParent);
      await assert.rejects(
        applyWave2bCasBatch({items: context.items}),
        /parent must be a real directory/u,
      );
      assert.deepEqual(
        await Promise.all(
          context.items.map((item) => readFile(item.targetPath)),
        ),
        targetBytesBefore,
      );
      assert.deepEqual(await readFile(context.protectedPath),
        context.protectedBytes);
      assert.equal(
        await exists(path.join(outside, "active", "0.post.tmp")),
        false,
      );
    });

    await t.test("normalized alias and duplicate canonical path", async (t) => {
      const context = await fixture(t);
      const aliased = {
        ...context.items[0],
        tempPath:
          `${context.root}/transaction/active/../active/0.post.tmp`,
      };
      await assert.rejects(
        applyWave2bCasBatch({
          items: [aliased, ...context.items.slice(1)],
        }),
        /normalized absolute path/u,
      );
      const duplicate = {
        ...context.items[1],
        tempPath: context.items[0].tempPath,
      };
      await assert.rejects(
        applyWave2bCasBatch({
          items: [context.items[0], duplicate, ...context.items.slice(2)],
        }),
        /aliases/u,
      );
      await assertPreimageState(context);
    });

    await t.test("ancestor path alias has zero mutation", async (t) => {
      const context = await fixture(t);
      const ownershipAncestor = path.join(
        context.root,
        "transaction",
        "nested-owner",
      );
      const nested = {
        ...context.items[0],
        tempOwnershipPath: ownershipAncestor,
        tempPath: path.join(ownershipAncestor, "post.tmp"),
      };
      const targetBytesBefore = await Promise.all(
        context.items.map((item) => readFile(item.targetPath)),
      );
      await assert.rejects(
        applyWave2bCasBatch({
          items: [nested, ...context.items.slice(1)],
        }),
        /ancestor\/descendant alias/u,
      );
      assert.equal(await exists(ownershipAncestor), false);
      assert.deepEqual(
        await Promise.all(
          context.items.map((item) => readFile(item.targetPath)),
        ),
        targetBytesBefore,
      );
      await assertPreimageState(context);
    });

    await t.test("case-folded path alias has zero mutation", async (t) => {
      const context = await fixture(t);
      const caseVariant = {
        ...context.items[0],
        tempOwnershipPath: path.join(
          context.root,
          "transaction",
          "active",
          "Case-Alias",
        ),
        tempPath: path.join(
          context.root,
          "transaction",
          "active",
          "case-alias",
        ),
      };
      await assert.rejects(
        applyWave2bCasBatch({
          items: [caseVariant, ...context.items.slice(1)],
        }),
        /aliases/u,
      );
      assert.equal(await exists(caseVariant.tempOwnershipPath), false);
      assert.equal(await exists(caseVariant.tempPath), false);
      await assertPreimageState(context);
    });

    await t.test("pre-existing no-replace destination", async (t) => {
      const context = await fixture(t);
      const foreignBytes = Buffer.from("foreign quarantine\n");
      await mkdir(path.dirname(context.items[0].quarantinePath), {
        recursive: true,
      });
      await writeFile(
        context.items[0].quarantinePath,
        foreignBytes,
        {flag: "wx", mode: 0o644},
      );
      const targetBytesBefore = await Promise.all(
        context.items.map((item) => readFile(item.targetPath)),
      );
      await assert.rejects(
        applyWave2bCasBatch({items: context.items}),
        /foreign filesystem drift without mutation/u,
      );
      assert.deepEqual(
        await readFile(context.items[0].quarantinePath),
        foreignBytes,
      );
      assert.deepEqual(
        await Promise.all(
          context.items.map((item) => readFile(item.targetPath)),
        ),
        targetBytesBefore,
      );
    });
  });

const RECOVERY_INTERRUPTION_CASES = [
  {
    initialState: CAS_STATES.QUARANTINE_FROZEN,
    event: "recovery-post-archive-link-state-validated",
  },
  {
    initialState: CAS_STATES.QUARANTINE_FROZEN,
    event: "recovery-target-post-unlink-state-validated",
  },
  {
    initialState: CAS_STATES.TARGET_LINKED,
    event: "recovery-temp-post-unlink-state-validated",
  },
  {
    initialState: CAS_STATES.QUARANTINE_FROZEN,
    event: "recovery-post-archive-freeze-state-validated",
  },
  {
    initialState: CAS_STATES.QUARANTINE_FROZEN,
    event: "recovery-preimage-target-link-state-validated",
  },
  {
    initialState: CAS_STATES.QUARANTINE_FROZEN,
    event: "recovery-quarantine-preimage-unlink-state-validated",
  },
  {
    initialState: CAS_STATES.QUARANTINE_FROZEN,
    event: "recovery-preimage-mode-restore-state-validated",
  },
];

test("wave2b recovery resumes after every validated recovery mutation",
  async (t) => {
    for (const recoveryCase of RECOVERY_INTERRUPTION_CASES) {
      await t.test(recoveryCase.event, async (t) => {
        const context = await fixture(t);
        await assert.rejects(
          applyWave2bCasBatch({
            items: context.items,
            leaveInterruptedForTest: true,
            hooks: {
              afterState(event) {
                if (
                  event.index === 2 &&
                  event.state === recoveryCase.initialState
                ) {
                  throw new Error("synthetic apply crash");
                }
              },
            },
          }),
          /synthetic apply crash/u,
        );
        let interruptionObserved = false;
        await assert.rejects(
          recoverWave2bCasBatch({
            items: context.items,
            journal(event) {
              if (
                !interruptionObserved &&
                event.id === context.items[2].id &&
                event.event === recoveryCase.event
              ) {
                interruptionObserved = true;
                throw new Error("synthetic recovery crash");
              }
            },
          }),
          /synthetic recovery crash/u,
        );
        assert.equal(interruptionObserved, true);
        await recoverWave2bCasBatch({items: context.items});
        await assertPreimageState(context);
      });
    }
  });

test("wave2b journal records intent before each validated state",
  async (t) => {
    const context = await fixture(t);
    const events = [];
    await applyWave2bCasBatch({
      items: context.items,
      journal(event) {
        events.push(event);
      },
    });
    const memberEvents = events
      .filter((event) => event.id === context.items[0].id)
      .map((event) => event.event);
    const operations = [
      "temp-ownership-marker-create",
      "temp-write",
      "temp-ownership-marker-release",
      "preimage-quarantine-link",
      "target-preimage-unlink",
      "postimage-target-link",
      "temp-postimage-unlink",
      "quarantine-freeze",
      "final-verify",
    ];
    for (const operation of operations) {
      const intentIndex = memberEvents.indexOf(`${operation}-intent`);
      const validatedIndex = memberEvents.indexOf(
        `${operation}-state-validated`,
      );
      assert.ok(intentIndex >= 0, `${operation} intent is missing`);
      assert.ok(validatedIndex > intentIndex,
        `${operation} validation must follow intent`);
    }
    assert.equal(
      memberEvents.some((event) =>
        event.endsWith("-state-validated")),
      true,
    );
    await recoverWave2bCasBatch({items: context.items});
    await assertPreimageState(context);
  });

test("wave2b caller mutations during journal cannot redirect the frozen plan",
  async (t) => {
    const context = await fixture(t);
    const callerItems = context.items.map((item) => ({
      ...item,
      preimage: {...item.preimage},
      postimage: {...item.postimage},
      postBytes: Buffer.from(item.postBytes),
    }));
    let mutated = false;
    await applyWave2bCasBatch({
      items: callerItems,
      journal(event) {
        if (!mutated && event.event.endsWith("-intent")) {
          mutated = true;
          callerItems[0].targetPath = context.protectedPath;
          callerItems[0].preimage.sha256 = "0".repeat(64);
          callerItems[0].postimage.sha256 = "f".repeat(64);
          callerItems[0].postBytes.fill(0);
        }
      },
    });
    assert.equal(mutated, true);
    assert.deepEqual(
      await readFile(context.protectedPath),
      context.protectedBytes,
    );
    assert.deepEqual(
      await readFile(context.sourcePath),
      context.sourceBytes,
    );
    for (const [index, item] of context.items.entries()) {
      assert.equal(
        (await inspectWave2bCasItem(item, index)).state,
        CAS_STATES.QUARANTINE_FROZEN,
      );
    }
    await recoverWave2bCasBatch({items: context.items});
    await assertPreimageState(context);
  });

test("wave2b callback member drift is detected before any foreign deletion",
  async (t) => {
    await t.test("intent journal drift before destructive action",
      async (t) => {
        const context = await fixture(t);
        const item = context.items[0];
        let foreign = null;
        await assert.rejects(
          applyWave2bCasBatch({
            items: context.items,
            journal: async (event) => {
              if (
                foreign === null &&
                event.id === item.id &&
                event.event === "target-preimage-unlink-intent"
              ) {
                foreign = await replaceWithForeignInode(
                  item.targetPath,
                  "intent journal",
                );
                throw new Error("intent journal rejected after drift");
              }
            },
          }),
          /post-callback validation detected drift/u,
        );
        assert.ok(foreign);
        await assertForeignInodeSurvives(item.targetPath, foreign);
        assert.equal(await exists(item.quarantinePath), true);
      });

    await t.test("afterValidatedState drift before next transition",
      async (t) => {
        const context = await fixture(t);
        const item = context.items[0];
        let foreign = null;
        await assert.rejects(
          applyWave2bCasBatch({
            items: context.items,
            hooks: {
              afterValidatedState: async (event) => {
                if (
                  foreign === null &&
                  event.id === item.id &&
                  event.state ===
                    CAS_STATES.PREIMAGE_QUARANTINE_LINKED
                ) {
                  foreign = await replaceWithForeignInode(
                    item.targetPath,
                    "afterValidatedState",
                  );
                  throw new Error(
                    "afterValidatedState rejected after drift",
                  );
                }
              },
            },
          }),
          /post-callback validation detected drift/u,
        );
        assert.ok(foreign);
        await assertForeignInodeSurvives(item.targetPath, foreign);
        assert.equal(await exists(item.quarantinePath), true);
      });

    await t.test("final-verify journal drift", async (t) => {
      const context = await fixture(t);
      const item = context.items[0];
      let foreign = null;
      await assert.rejects(
        applyWave2bCasBatch({
          items: context.items,
          journal: async (event) => {
            if (
              foreign === null &&
              event.id === item.id &&
              event.event === "final-verify-state-validated"
            ) {
              foreign = await replaceWithForeignInode(
                item.targetPath,
                "final-verify journal",
              );
              throw new Error("final-verify journal rejected after drift");
            }
          },
        }),
        /post-callback validation detected drift/u,
      );
      assert.ok(foreign);
      await assertForeignInodeSurvives(item.targetPath, foreign);
      assert.equal(await exists(item.quarantinePath), true);
    });

    await t.test("terminal recovery journal drift", async (t) => {
      const context = await fixture(t);
      const item = context.items.at(-1);
      let foreign = null;
      await assert.rejects(
        recoverWave2bCasBatch({
          items: context.items,
          journal: async (event) => {
            if (
              foreign === null &&
              event.id === item.id &&
              event.event ===
                "recovered-preimage-state-validated"
            ) {
              foreign = await replaceWithForeignInode(
                item.targetPath,
                "terminal recovery journal",
              );
              throw new Error(
                "terminal recovery journal rejected after drift",
              );
            }
          },
        }),
        /post-callback validation detected drift/u,
      );
      assert.ok(foreign);
      await assertForeignInodeSurvives(item.targetPath, foreign);
    });

    await t.test("outer recovery-intent journal drift",
      async (t) => {
        const context = await fixture(t);
        const item = context.items[0];
        await assert.rejects(
          applyWave2bCasBatch({
            items: context.items,
            leaveInterruptedForTest: true,
            hooks: {
              afterState(event) {
                if (
                  event.id === item.id &&
                  event.state === CAS_STATES.TEMP_READY
                ) {
                  throw new Error("pause at TEMP_READY");
                }
              },
            },
          }),
          /pause at TEMP_READY/u,
        );
        let foreign = null;
        await assert.rejects(
          recoverWave2bCasBatch({
            items: context.items,
            journal: async (event) => {
              if (
                foreign === null &&
                event.id === item.id &&
                event.event === "recovery-intent"
              ) {
                foreign = await replaceWithForeignInode(
                  item.tempPath,
                  "outer recovery-intent journal",
                );
                throw new Error(
                  "outer recovery-intent rejected after drift",
                );
              }
            },
          }),
          /post-callback validation detected drift/u,
        );
        assert.ok(foreign);
        await assertForeignInodeSurvives(item.tempPath, foreign);
      });
  });

test("wave2b batch-wide callback snapshots reject cross-item drift",
  async (t) => {
    await t.test("resolved journal callback swaps another member",
      async (t) => {
        const context = await fixture(t);
        const active = context.items[0];
        const victim = context.items[1];
        let foreign = null;
        await assert.rejects(
          applyWave2bCasBatch({
            items: context.items,
            journal: async (event) => {
              if (
                foreign === null &&
                event.id === active.id &&
                event.event ===
                  "temp-ownership-marker-create-intent"
              ) {
                foreign = await replaceWithForeignInode(
                  victim.targetPath,
                  "resolved cross-item journal",
                );
              }
            },
          }),
          /member snapshot changed .*batch index 1/u,
        );
        assert.ok(foreign);
        await assertForeignInodeSurvives(victim.targetPath, foreign);
        assert.equal(await exists(active.tempOwnershipPath), false);
      });

    await t.test("rejected temp-write callback swaps another member",
      async (t) => {
        const context = await fixture(t);
        const active = context.items[0];
        const victim = context.items[1];
        let foreign = null;
        await assert.rejects(
          applyWave2bCasBatch({
            items: context.items,
            hooks: {
              writeTempFile: async ({
                handle,
                bytes,
                id,
              }) => {
                await handle.writeFile(bytes);
                if (id !== active.id) return;
                foreign = await replaceWithForeignInode(
                  victim.targetPath,
                  "rejected cross-item temp hook",
                );
                throw new Error(
                  "cross-item temp hook rejected after drift",
                );
              },
            },
          }),
          /post-callback validation detected drift/u,
        );
        assert.ok(foreign);
        await assertForeignInodeSurvives(victim.targetPath, foreign);
        assert.equal(await exists(active.tempPath), false);
        assert.equal(await exists(active.tempOwnershipPath), true);
      });

    await t.test("rejected temp-write callback swaps a non-temp role",
      async (t) => {
        const context = await fixture(t);
        const item = context.items[0];
        const targetBefore = await readFile(item.targetPath);
        let foreign = null;
        await assert.rejects(
          applyWave2bCasBatch({
            items: context.items,
            hooks: {
              writeTempFile: async ({
                handle,
                bytes,
                id,
              }) => {
                await handle.writeFile(bytes);
                if (id !== item.id) return;
                foreign = await replaceWithForeignDirectory(
                  item.tempOwnershipPath,
                  "same-item non-temp projection",
                );
                throw new Error(
                  "same-item temp hook rejected after drift",
                );
              },
            },
          }),
          /post-callback validation detected drift/u,
        );
        assert.ok(foreign);
        await assertForeignDirectorySurvives(
          item.tempOwnershipPath,
          foreign,
        );
        assert.equal(await exists(item.tempPath), false);
        assert.deepEqual(
          await readFile(item.targetPath),
          targetBefore,
        );
      });
  });

test("wave2b post-close snapshots reject same-item and cross-item swaps",
  async (t) => {
    const scenarios = [
      {name: "same-item close resolves", outcome: "resolve", victim: 0},
      {name: "same-item close throws", outcome: "throw", victim: 0},
      {name: "same-item close rejects", outcome: "reject", victim: 0},
      {name: "cross-item close resolves", outcome: "resolve", victim: 1},
    ];
    for (const scenario of scenarios) {
      await t.test(scenario.name, async (t) => {
        const context = await fixture(t);
        const active = context.items[0];
        const victim = context.items[scenario.victim];
        const events = [];
        let exposedHandle = null;
        let foreign = null;
        const rejection = await captureRejection(() =>
          applyWave2bCasBatch({
            items: context.items,
            journal(event) {
              events.push(event);
            },
            hooks: {
              writeTempFile: async ({
                handle,
                bytes,
                id,
              }) => {
                await handle.writeFile(bytes);
                if (id !== active.id) return;
                exposedHandle = handle;
                const close = handle.close.bind(handle);
                handle.close = async () => {
                  await close();
                  foreign = await replaceWithForeignInode(
                    victim.targetPath,
                    scenario.name,
                  );
                  if (scenario.outcome === "throw") {
                    const error = new Error(
                      "synthetic close-time throw",
                    );
                    error.code = "SYNTHETIC_CLOSE_THROW";
                    throw error;
                  }
                  if (scenario.outcome === "reject") {
                    const error = new Error(
                      "synthetic close-time rejection",
                    );
                    error.code = "SYNTHETIC_CLOSE_REJECT";
                    return Promise.reject(error);
                  }
                };
              },
              afterTempHandleClose: () => exposedHandle.close(),
            },
          }));
        assert.equal(
          errorTreeHasCode(
            rejection,
            "WAVE2B_MEMBER_SNAPSHOT_DRIFT",
          ),
          true,
        );
        assert.doesNotMatch(
          rejection.message,
          /wave2b CAS failed and recovery/u,
        );
        if (scenario.outcome === "throw") {
          assert.equal(
            errorTreeHasCode(rejection, "SYNTHETIC_CLOSE_THROW"),
            true,
          );
        }
        if (scenario.outcome === "reject") {
          assert.equal(
            errorTreeHasCode(rejection, "SYNTHETIC_CLOSE_REJECT"),
            true,
          );
        }
        assert.ok(foreign);
        await assertForeignInodeSurvives(victim.targetPath, foreign);
        assert.equal(await exists(active.quarantinePath), false);
        assert.deepEqual(
          events.filter(isRecoveryJournalEvent),
          [],
        );
      });
    }
  });

test("wave2b temp write hook cannot replace, chmod, or delete a foreign inode",
  async (t) => {
    const context = await fixture(t);
    const item = context.items[0];
    let foreign = null;
    await assert.rejects(
      applyWave2bCasBatch({
        items: context.items,
        leaveInterruptedForTest: true,
        hooks: {
          writeTempFile: async ({
            handle,
            bytes,
            id,
            target,
          }) => {
            await handle.writeFile(bytes);
            if (id !== item.id) return;
            await unlink(target);
            await writeFile(target, bytes, {
              flag: "wx",
              mode: 0o600,
            });
            const metadata = await lstat(target);
            foreign = {
              bytes: Buffer.from(bytes),
              dev: metadata.dev,
              ino: metadata.ino,
              mode: metadata.mode & 0o777,
            };
          },
        },
      }),
      /partial temp write identity changed; cleanup refused/u,
    );
    assert.ok(foreign);
    await assertForeignInodeSurvives(item.tempPath, foreign);
    assert.equal((await lstat(item.tempPath)).mode & 0o777, 0o600);
  });

test("wave2b temp cleanup errors preserve nested member drift",
  async (t) => {
    const scenarios = [
      {
        name: "handle close",
        expectedMessage: /temp close validation failed/u,
        secondaryCode: "SYNTHETIC_TEMP_CLOSE",
        afterClose: async () => {
          const error = new Error("synthetic temp handle close failure");
          error.code = "SYNTHETIC_TEMP_CLOSE";
          throw error;
        },
      },
      {
        name: "cleanup lstat",
        expectedMessage: /temp cleanup inspection failed/u,
        afterClose: async ({activeDirectory}) => {
          await rename(
            activeDirectory,
            `${activeDirectory}.displaced`,
          );
          await writeFile(activeDirectory, "not a directory\n", {
            flag: "wx",
            mode: 0o600,
          });
        },
      },
      {
        name: "cleanup unlink",
        expectedMessage: /owned temp cleanup failed/u,
        restoreMode: true,
        afterClose: ({activeDirectory}) =>
          chmod(activeDirectory, 0o500),
      },
      {
        name: "cleanup directory sync",
        expectedMessage: /owned temp cleanup failed/u,
        restoreMode: true,
        afterClose: ({activeDirectory}) =>
          chmod(activeDirectory, 0o300),
      },
    ];

    for (const scenario of scenarios) {
      await t.test(scenario.name, async (t) => {
        const context = await fixture(t);
        const active = context.items[0];
        const victim = context.items[1];
        const activeDirectory = path.dirname(active.tempPath);
        const events = [];
        let foreign = null;
        let exposedHandle = null;
        let rejection;
        try {
          rejection = await captureRejection(() =>
            applyWave2bCasBatch({
              items: context.items,
              journal(event) {
                events.push(event);
              },
              hooks: {
                writeTempFile: async ({
                  handle,
                  bytes,
                  id,
                }) => {
                  await handle.writeFile(bytes);
                  if (id !== active.id) return;
                  exposedHandle = handle;
                  const close = handle.close.bind(handle);
                  handle.close = async () => {
                    await close();
                    foreign = await replaceWithForeignInode(
                      victim.targetPath,
                      `${scenario.name} cross-item replacement`,
                    );
                    await scenario.afterClose({activeDirectory});
                  };
                  throw new Error(
                    `${scenario.name} callback rejected before close`,
                  );
                },
                afterTempHandleClose: () => exposedHandle.close(),
              },
            }));
        } finally {
          if (scenario.restoreMode) {
            await chmod(activeDirectory, 0o700).catch(() => {});
          }
        }
        assert.match(rejection.message, scenario.expectedMessage);
        assert.doesNotMatch(
          rejection.message,
          /wave2b CAS failed and recovery/u,
        );
        assert.equal(
          errorTreeHasCode(
            rejection,
            "WAVE2B_MEMBER_SNAPSHOT_DRIFT",
          ),
          true,
        );
        if (scenario.secondaryCode) {
          assert.equal(
            errorTreeHasCode(rejection, scenario.secondaryCode),
            true,
          );
        }
        assert.ok(foreign);
        await assertForeignInodeSurvives(victim.targetPath, foreign);
        assert.deepEqual(
          events.filter(isRecoveryJournalEvent),
          [],
        );
      });
    }
  });

test("wave2b recovery retry backfills terminal journal validation",
  async (t) => {
    await t.test("recovered postimage archive terminal", async (t) => {
      const context = await fixture(t);
      await applyWave2bCasBatch({items: context.items});
      const targetId = context.items.at(-1).id;
      let interrupted = false;
      await assert.rejects(
        recoverWave2bCasBatch({
          items: context.items,
          journal(event) {
            if (
              !interrupted &&
              event.id === targetId &&
              event.event === "recovered-state-validated"
            ) {
              interrupted = true;
              throw new Error("synthetic terminal journal crash");
            }
          },
        }),
        /synthetic terminal journal crash/u,
      );
      const replayed = [];
      await recoverWave2bCasBatch({
        items: context.items,
        journal(event) {
          replayed.push(event);
        },
      });
      assert.equal(
        replayed.some((event) =>
          event.id === targetId &&
          event.event === "recovered-state-validated"),
        true,
      );
      await assertPreimageState(context);
    });

    await t.test("unchanged preimage terminal", async (t) => {
      const context = await fixture(t);
      const targetId = context.items.at(-1).id;
      let interrupted = false;
      await assert.rejects(
        recoverWave2bCasBatch({
          items: context.items,
          journal(event) {
            if (
              !interrupted &&
              event.id === targetId &&
              event.event === "recovered-preimage-state-validated"
            ) {
              interrupted = true;
              throw new Error("synthetic preimage journal crash");
            }
          },
        }),
        /synthetic preimage journal crash/u,
      );
      const replayed = [];
      await recoverWave2bCasBatch({
        items: context.items,
        journal(event) {
          replayed.push(event);
        },
      });
      assert.equal(
        replayed.some((event) =>
          event.id === targetId &&
          event.event === "recovered-preimage-state-validated"),
        true,
      );
      await assertPreimageState(context);
    });
  });

test("wave2b partial temp write exception cleans only its owned inode",
  async (t) => {
    const context = await fixture(t);
    let injected = false;
    await assert.rejects(
      applyWave2bCasBatch({
        items: context.items,
        hooks: {
          async writeTempFile({handle, bytes, index}) {
            if (index === 2) {
              injected = true;
              await handle.write(bytes.subarray(0, 7));
              throw new Error("synthetic partial write");
            }
            await handle.writeFile(bytes);
          },
        },
      }),
      /wave2b CAS failed and restored/u,
    );
    assert.equal(injected, true);
    await assertPreimageState(context);
  });

test("wave2b ownership marker distinguishes crash residue from foreign temp",
  async (t) => {
    await t.test("owned partial temp", async (t) => {
      const context = await fixture(t);
      const item = context.items[0];
      await mkdir(path.dirname(item.tempOwnershipPath), {recursive: true});
      await mkdir(item.tempOwnershipPath, {
        recursive: false,
        mode: 0o700,
      });
      await chmod(item.tempOwnershipPath, 0o700);
      const partial = item.postBytes.subarray(0, 11);
      await writeFile(item.tempPath, partial, {
        flag: "wx",
        mode: 0o644,
      });
      await chmod(item.tempPath, 0o644);
      assert.equal(
        (await inspectWave2bCasItem(item)).state,
        CAS_STATES.OWNED_TEMP_PARTIAL,
      );
      await recoverWave2bCasBatch({items: context.items});
      await assertPreimageState(context);
    });

    await t.test("owned complete temp at private mode", async (t) => {
      const context = await fixture(t);
      const item = context.items[0];
      await mkdir(path.dirname(item.tempOwnershipPath), {recursive: true});
      await mkdir(item.tempOwnershipPath, {
        recursive: false,
        mode: 0o700,
      });
      await chmod(item.tempOwnershipPath, 0o700);
      await writeFile(item.tempPath, item.postBytes, {
        flag: "wx",
        mode: 0o600,
      });
      await chmod(item.tempPath, 0o600);
      assert.equal(
        (await inspectWave2bCasItem(item)).state,
        CAS_STATES.OWNED_TEMP_COMPLETE,
      );
      await recoverWave2bCasBatch({items: context.items});
      await assertPreimageState(context);
    });

    await t.test("unowned partial temp is foreign and untouched", async (t) => {
      const context = await fixture(t);
      const item = context.items[0];
      await mkdir(path.dirname(item.tempPath), {recursive: true});
      const partial = item.postBytes.subarray(0, 13);
      await writeFile(item.tempPath, partial, {
        flag: "wx",
        mode: 0o644,
      });
      await chmod(item.tempPath, 0o644);
      const targetBefore = await readFile(item.targetPath);
      assert.equal(
        (await inspectWave2bCasItem(item)).state,
        CAS_STATES.FOREIGN,
      );
      await assert.rejects(
        recoverWave2bCasBatch({items: context.items}),
        /foreign filesystem drift without mutation/u,
      );
      assert.deepEqual(await readFile(item.targetPath), targetBefore);
      assert.deepEqual(await readFile(item.tempPath), partial);
    });
  });

test("wave2b lock is no-replace, owner-bound, and releasable",
  async (t) => {
    const context = await fixture(t);
    const lock = await acquireWave2bLock({
      rootPath: context.root,
      lockPath: context.lockPath,
      owner: {transactionId: "wave2b-test", pid: process.pid},
    });
    await assert.rejects(
      acquireWave2bLock({
        rootPath: context.root,
        lockPath: context.lockPath,
        owner: {transactionId: "foreign", pid: process.pid},
      }),
      /EEXIST/u,
    );
    await releaseWave2bLock(lock);
    assert.equal(await exists(context.lockPath), false);
  });

test("wave2b lock release refuses unexpected directory entries",
  async (t) => {
    const context = await fixture(t);
    const lock = await acquireWave2bLock({
      rootPath: context.root,
      lockPath: context.lockPath,
      owner: {transactionId: "wave2b-extra-entry", pid: process.pid},
    });
    const ownerPath = path.join(context.lockPath, "owner.json");
    const extraPath = path.join(context.lockPath, "unexpected");
    await writeFile(extraPath, "foreign\n", {flag: "wx", mode: 0o600});
    await assert.rejects(
      releaseWave2bLock(lock),
      /lock directory entries changed/u,
    );
    assert.equal(await exists(ownerPath), true);
    assert.equal(await exists(extraPath), true);
    assert.equal(await exists(context.lockPath), true);
    assert.deepEqual(
      await readFile(context.protectedPath),
      context.protectedBytes,
    );
    assert.deepEqual(
      await readFile(context.sourcePath),
      context.sourceBytes,
    );
  });

test("wave2b lock descriptor rejects identical-byte ABA replacement",
  async (t) => {
    const context = await fixture(t);
    const owner = {
      transactionId: "wave2b-identical-owner",
      pid: process.pid,
    };
    const original = await acquireWave2bLock({
      rootPath: context.root,
      lockPath: context.lockPath,
      owner,
    });
    await releaseWave2bLock(original);
    const replacement = await acquireWave2bLock({
      rootPath: context.root,
      lockPath: context.lockPath,
      owner,
    });
    await assert.rejects(
      assertWave2bLock(original, context.items),
      /lock directory was replaced/u,
    );
    await assert.rejects(
      applyWave2bCasBatchRaw({
        items: context.items,
        journal: testJournal,
        lock: original,
      }),
      /lock directory was replaced/u,
    );
    await releaseWave2bLock(replacement);
    await assertPreimageState(context);
  });

test("wave2b lock release rejects symlink and hardlink owner drift",
  async (t) => {
    await t.test("hardlink owner", async (t) => {
      const context = await fixture(t);
      const lock = await acquireWave2bLock({
        rootPath: context.root,
        lockPath: context.lockPath,
        owner: {transactionId: "wave2b-hardlink", pid: process.pid},
      });
      const extra = path.join(context.root, "foreign-owner-link");
      await link(path.join(context.lockPath, "owner.json"), extra);
      await assert.rejects(
        releaseWave2bLock(lock),
        /lock owner was replaced/u,
      );
      assert.equal((await lstat(extra)).nlink, 2);
    });

    await t.test("symlink owner", async (t) => {
      const context = await fixture(t);
      const lock = await acquireWave2bLock({
        rootPath: context.root,
        lockPath: context.lockPath,
        owner: {transactionId: "wave2b-symlink", pid: process.pid},
      });
      const ownerPath = path.join(context.lockPath, "owner.json");
      await unlink(ownerPath);
      await symlink(context.protectedPath, ownerPath);
      await assert.rejects(
        releaseWave2bLock(lock),
        /lock owner was replaced/u,
      );
      assert.deepEqual(await readFile(context.protectedPath),
        context.protectedBytes);
    });
  });

test("wave2b acquired lock exposes a frozen serializable persisted binding",
  async (t) => {
    const context = await fixture(t);
    const lock = await acquireRecoveryFixtureLock(
      context,
      "wave2b-persisted-binding",
    );
    assert.equal(lock.schema, "wave2b-lock-descriptor-v1");
    assert.equal(lock.kind, "acquired");
    assert.match(lock.acquisitionId, /^[a-f0-9]{64}$/u);
    assert.match(lock.descriptorSha256, /^[a-f0-9]{64}$/u);
    assert.equal(lock.rootPath, context.root);
    assert.equal(lock.persistedBinding.kind, "acquired");
    assert.equal(
      JSON.stringify(jsonClone(lock.persistedBinding)),
      JSON.stringify(lock.persistedBinding),
    );
    assert.equal(
      JSON.stringify(lock.persistedBinding).includes("\"type\":\"Buffer\""),
      false,
    );
    assert.equal(Object.isFrozen(lock.persistedBinding), true);
    await assertWave2bLock(lock, context.items);
    await releaseWave2bLock(lock);
  });

test("recovery adoption invalidates the original and is recovery-only",
  async (t) => {
    const context = await fixture(t);
    const original = await acquireRecoveryFixtureLock(
      context,
      "wave2b-adoption-success",
    );
    const events = [];
    const adopted = await adoptRecoveryFixtureLock(context, original, {
      journal: async (event) => {
        events.push(event.event);
        assert.equal(Object.isFrozen(event), true);
      },
    });
    assert.equal(adopted.kind, "recovery-adopted");
    assert.notEqual(adopted.descriptorSha256, original.descriptorSha256);
    assert.deepEqual(events, [
      "lock-recovery-adoption-intent",
      "lock-recovery-adoption-state-validated",
    ]);
    await assert.rejects(
      assertWave2bLock(original),
      /lock directory entries changed/u,
    );
    await assertWave2bLock(adopted);
    await assertWave2bLock(adopted, [context.items[0]], {
      recoveryIndexes: [0],
    });
    await assert.rejects(
      assertWave2bLock(adopted, [context.items[0]], {
        recoveryIndexes: [1],
      }),
      /not authorized at its recovery index/u,
    );

    let applyJournalCalls = 0;
    await assert.rejects(
      applyWave2bCasBatchRaw({
        items: context.items,
        lock: adopted,
        journal: async () => {
          applyJournalCalls += 1;
        },
      }),
      /recovery-only and cannot authorize apply/u,
    );
    assert.equal(applyJournalCalls, 0);
    for (const [index, item] of context.items.entries()) {
      assert.equal(
        (await inspectWave2bCasItem(item, index)).state,
        CAS_STATES.PREIMAGE,
      );
    }
    assert.deepEqual(
      await readFile(context.protectedPath),
      context.protectedBytes,
    );
    assert.deepEqual(
      await readFile(context.sourcePath),
      context.sourceBytes,
    );

    let wrongPlanJournalCalls = 0;
    await assert.rejects(
      recoverWave2bCasBatchRaw({
        items: [...context.items].reverse(),
        lock: adopted,
        journal: async () => {
          wrongPlanJournalCalls += 1;
        },
      }),
      /exact ordered recovery plan/u,
    );
    assert.equal(wrongPlanJournalCalls, 0);
    await recoverWave2bCasBatchRaw({
      items: context.items,
      lock: adopted,
      journal: testJournal,
    });
    await releaseWave2bLock(adopted);
    assert.equal(await exists(context.lockPath), false);
  });

test("recovery adoption accepts only the primitive exact dead result",
  async (t) => {
    const context = await fixture(t);
    const original = await acquireRecoveryFixtureLock(
      context,
      "wave2b-dead-only",
    );
    const cases = [
      ["missing", undefined],
      ["live", async () => "live"],
      ["unknown", async () => "unknown"],
      ["case variant", async () => "DEAD"],
      ["boolean", async () => true],
      ["boxed", async () => new String("dead")],
      ["throw", async () => {
        throw new Error("liveness throw");
      }],
      ["reject", async () => Promise.reject(
        new Error("liveness reject"),
      )],
    ];
    for (const [label, callback] of cases) {
      await assert.rejects(
        adoptRecoveryFixtureLock(context, original, {
          decideOwnerLiveness: callback,
        }),
        undefined,
        label,
      );
      assert.equal(
        await exists(path.join(
          context.lockPath,
          "recovery-adoption.json",
        )),
        false,
        label,
      );
      await assertWave2bLock(original);
    }
    await releaseWave2bLock(original);
  });

test("recovery adoption rejects corrupted or mismatched bindings before liveness",
  async (t) => {
    const context = await fixture(t);
    const original = await acquireRecoveryFixtureLock(
      context,
      "wave2b-binding-mismatch",
    );
    const variants = [];

    const badFingerprint = jsonClone(original.persistedBinding);
    badFingerprint.descriptorSha256 = "0".repeat(64);
    variants.push(["fingerprint", badFingerprint]);

    const badTransaction = jsonClone(original.persistedBinding);
    badTransaction.transactionId = "different-transaction";
    variants.push(["transaction", refingerprintBinding(badTransaction)]);

    const badRootIdentity = jsonClone(original.persistedBinding);
    badRootIdentity.rootIno = String(BigInt(badRootIdentity.rootIno) + 1n);
    variants.push(["root identity", refingerprintBinding(badRootIdentity)]);

    const badDirectoryIdentity = jsonClone(original.persistedBinding);
    badDirectoryIdentity.directoryIno = String(
      BigInt(badDirectoryIdentity.directoryIno) + 1n,
    );
    variants.push([
      "directory identity",
      refingerprintBinding(badDirectoryIdentity),
    ]);

    const badOwnerIdentity = jsonClone(original.persistedBinding);
    badOwnerIdentity.ownerIno = String(
      BigInt(badOwnerIdentity.ownerIno) + 1n,
    );
    variants.push([
      "owner identity",
      refingerprintBinding(badOwnerIdentity),
    ]);

    const badOwnerBytes = jsonClone(original.persistedBinding);
    const ownerRecord = JSON.parse(
      Buffer.from(badOwnerBytes.ownerBytesBase64, "base64")
        .subarray(0, -1)
        .toString("utf8"),
    );
    ownerRecord.owner.pid += 1;
    const changedOwnerBytes = Buffer.from(
      `${JSON.stringify(ownerRecord)}\n`,
    );
    badOwnerBytes.ownerBytesBase64 =
      changedOwnerBytes.toString("base64");
    badOwnerBytes.ownerSha256 = sha256(changedOwnerBytes);
    variants.push(["owner bytes", refingerprintBinding(badOwnerBytes)]);

    for (const [label, persistedBinding] of variants) {
      let livenessCalls = 0;
      await assert.rejects(
        adoptRecoveryFixtureLock(context, original, {
          persistedBinding,
          decideOwnerLiveness: async () => {
            livenessCalls += 1;
            return "dead";
          },
        }),
        undefined,
        label,
      );
      assert.equal(livenessCalls, 0, label);
      assert.equal(
        await exists(path.join(
          context.lockPath,
          "recovery-adoption.json",
        )),
        false,
        label,
      );
    }
    await assertWave2bLock(original);
    await releaseWave2bLock(original);
  });

test("recovery adoption rejects identical-owner ABA before liveness",
  async (t) => {
    const context = await fixture(t);
    const original = await acquireRecoveryFixtureLock(
      context,
      "wave2b-adoption-aba",
    );
    const persistedBinding = jsonClone(original.persistedBinding);
    await releaseWave2bLock(original);
    const replacement = await acquireRecoveryFixtureLock(
      context,
      "wave2b-adoption-aba",
    );
    let livenessCalls = 0;
    await assert.rejects(
      adoptRecoveryFixtureLock(context, original, {
        persistedBinding,
        decideOwnerLiveness: async () => {
          livenessCalls += 1;
          return "dead";
        },
      }),
      /lock directory was replaced/u,
    );
    assert.equal(livenessCalls, 0);
    await releaseWave2bLock(replacement);
  });

test("concurrent recovery adoption has exactly one winner and blocks replay",
  async (t) => {
    const context = await fixture(t);
    const original = await acquireRecoveryFixtureLock(
      context,
      "wave2b-adoption-concurrent",
    );
    let arrivals = 0;
    let openBarrier;
    const barrier = new Promise((resolve) => {
      openBarrier = resolve;
    });
    const decideOwnerLiveness = async () => {
      arrivals += 1;
      if (arrivals === 2) openBarrier();
      await barrier;
      return "dead";
    };
    const attempts = await Promise.allSettled([
      adoptRecoveryFixtureLock(context, original, {
        decideOwnerLiveness,
      }),
      adoptRecoveryFixtureLock(context, original, {
        decideOwnerLiveness,
      }),
    ]);
    const fulfilled = attempts.filter(
      ({status}) => status === "fulfilled",
    );
    const rejected = attempts.filter(
      ({status}) => status === "rejected",
    );
    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    assert.equal(
      await exists(path.join(
        context.lockPath,
        "recovery-adoption.json",
      )),
      true,
    );

    let replayLivenessCalls = 0;
    await assert.rejects(
      adoptRecoveryFixtureLock(context, original, {
        decideOwnerLiveness: async () => {
          replayLivenessCalls += 1;
          return "dead";
        },
      }),
      /lock directory entries changed/u,
    );
    assert.equal(replayLivenessCalls, 0);
    await recoverWave2bCasBatchRaw({
      items: context.items,
      lock: fulfilled[0].value,
      journal: testJournal,
    });
    await releaseWave2bLock(fulfilled[0].value);
  });

test("recovery adoption clones caller inputs before liveness and journal awaits",
  async (t) => {
    const context = await fixture(t);
    const original = await acquireRecoveryFixtureLock(
      context,
      "wave2b-adoption-clone-inputs",
    );
    const callerItems = context.items.map((item) => ({
      ...item,
      preimage: {...item.preimage},
      postimage: {...item.postimage},
      postBytes: Buffer.from(item.postBytes),
    }));
    const callerBinding = jsonClone(original.persistedBinding);
    const callerHooks = {};
    let journalCalls = 0;
    const adopted = await adoptWave2bLockForRecovery({
      rootPath: context.root,
      lockPath: context.lockPath,
      items: callerItems,
      persistedBinding: callerBinding,
      hooks: callerHooks,
      decideOwnerLiveness: async (subject) => {
        assert.equal(Object.isFrozen(subject), true);
        assert.equal(Object.isFrozen(subject.owner), true);
        callerItems[0].targetPath = context.protectedPath;
        callerItems[0].postBytes.fill(0);
        callerBinding.rootPath = context.protectedPath;
        callerHooks.writeRecoveryAdoptionMarker = async () => {
          throw new Error("late hook mutation must not run");
        };
        return "dead";
      },
      journal: async (event) => {
        journalCalls += 1;
        assert.equal(Object.isFrozen(event), true);
        callerItems.reverse();
        callerBinding.descriptorSha256 = "0".repeat(64);
      },
    });
    assert.equal(journalCalls, 2);
    await recoverWave2bCasBatchRaw({
      items: context.items,
      lock: adopted,
      journal: testJournal,
    });
    await releaseWave2bLock(adopted);
    await assertPreimageState(context);
  });

test("recovery adoption revalidates after liveness and durable intent awaits",
  async (t) => {
    await t.test("directory ABA during liveness", async (t) => {
      const context = await fixture(t);
      const original = await acquireRecoveryFixtureLock(
        context,
        "wave2b-adoption-liveness-aba",
      );
      let replacement;
      let journalCalls = 0;
      await assert.rejects(
        adoptRecoveryFixtureLock(context, original, {
          decideOwnerLiveness: async () => {
            await releaseWave2bLock(original);
            replacement = await acquireRecoveryFixtureLock(
              context,
              "wave2b-adoption-liveness-aba",
            );
            return "dead";
          },
          journal: async () => {
            journalCalls += 1;
          },
        }),
        /lock directory was replaced/u,
      );
      assert.equal(journalCalls, 0);
      await releaseWave2bLock(replacement);
    });

    await t.test("owner hardlink during intent", async (t) => {
      const context = await fixture(t);
      const original = await acquireRecoveryFixtureLock(
        context,
        "wave2b-adoption-owner-drift",
      );
      const foreignLink = path.join(context.root, "foreign-owner-link");
      await assert.rejects(
        adoptRecoveryFixtureLock(context, original, {
          journal: async () => {
            await link(
              path.join(context.lockPath, "owner.json"),
              foreignLink,
            );
          },
        }),
        /lock owner was replaced/u,
      );
      assert.equal(
        await exists(path.join(
          context.lockPath,
          "recovery-adoption.json",
        )),
        false,
      );
      await unlink(foreignLink);
      await releaseWave2bLock(original);
    });

    await t.test("unexpected entry during intent", async (t) => {
      const context = await fixture(t);
      const original = await acquireRecoveryFixtureLock(
        context,
        "wave2b-adoption-entry-drift",
      );
      const unexpected = path.join(context.lockPath, "unexpected");
      await assert.rejects(
        adoptRecoveryFixtureLock(context, original, {
          journal: async () => {
            await writeFile(unexpected, "foreign\n", {
              flag: "wx",
              mode: 0o600,
            });
          },
        }),
        /lock directory entries changed/u,
      );
      assert.equal(
        await exists(path.join(
          context.lockPath,
          "recovery-adoption.json",
        )),
        false,
      );
      await unlink(unexpected);
      await releaseWave2bLock(original);
    });
  });

test("recovery adoption revalidates member swaps even when callbacks reject",
  async (t) => {
    await t.test("owner-liveness callback", async (t) => {
      const context = await fixture(t);
      const item = context.items[0];
      const original = await acquireRecoveryFixtureLock(
        context,
        "wave2b-adoption-member-liveness",
      );
      let foreign = null;
      await assert.rejects(
        adoptRecoveryFixtureLock(context, original, {
          decideOwnerLiveness: async () => {
            foreign = await replaceWithForeignInode(
              item.targetPath,
              "adoption owner-liveness",
            );
            throw new Error("owner-liveness rejected after drift");
          },
        }),
        /post-callback validation detected drift/u,
      );
      await assertForeignInodeSurvives(item.targetPath, foreign);
      await releaseWave2bLock(original);
    });

    await t.test("intent journal", async (t) => {
      const context = await fixture(t);
      const item = context.items[0];
      const original = await acquireRecoveryFixtureLock(
        context,
        "wave2b-adoption-member-intent",
      );
      let foreign = null;
      await assert.rejects(
        adoptRecoveryFixtureLock(context, original, {
          journal: async ({event}) => {
            if (event === "lock-recovery-adoption-intent") {
              foreign = await replaceWithForeignInode(
                item.targetPath,
                "adoption intent journal",
              );
              throw new Error("adoption intent rejected after drift");
            }
          },
        }),
        /post-callback validation detected drift/u,
      );
      await assertForeignInodeSurvives(item.targetPath, foreign);
      await releaseWave2bLock(original);
    });

    await t.test("marker write hook", async (t) => {
      const context = await fixture(t);
      const item = context.items[0];
      const original = await acquireRecoveryFixtureLock(
        context,
        "wave2b-adoption-member-marker",
      );
      let foreign = null;
      await assert.rejects(
        adoptRecoveryFixtureLock(context, original, {
          hooks: {
            writeRecoveryAdoptionMarker: async ({handle, bytes}) => {
              await handle.writeFile(bytes);
              foreign = await replaceWithForeignInode(
                item.targetPath,
                "adoption marker hook",
              );
              throw new Error("adoption marker hook rejected after drift");
            },
          },
        }),
        /post-callback validation detected drift/u,
      );
      await assertForeignInodeSurvives(item.targetPath, foreign);
      assert.equal(
        await exists(path.join(
          context.lockPath,
          "recovery-adoption.json",
        )),
        true,
      );
    });

    await t.test("marker hook close failure preserves member drift",
      async (t) => {
        const context = await fixture(t);
        const item = context.items[0];
        const original = await acquireRecoveryFixtureLock(
          context,
          "wave2b-adoption-member-marker-close",
        );
        let foreign = null;
        let exposedHandle = null;
        const rejection = await captureRejection(() =>
          adoptRecoveryFixtureLock(context, original, {
            hooks: {
              writeRecoveryAdoptionMarker: async ({
                handle,
                bytes,
              }) => {
                await handle.writeFile(bytes);
                exposedHandle = handle;
                const close = handle.close.bind(handle);
                handle.close = async () => {
                  await close();
                  foreign = await replaceWithForeignInode(
                    item.targetPath,
                    "adoption marker close hook",
                  );
                  const error = new Error(
                    "synthetic adoption marker close failure",
                  );
                  error.code = "SYNTHETIC_ADOPTION_CLOSE";
                  throw error;
                };
                throw new Error(
                  "adoption marker hook rejected before close",
                );
              },
              afterRecoveryAdoptionMarkerClose: () =>
                exposedHandle.close(),
            },
          }));
        assert.match(
          rejection.message,
          /immutable write and handle close both failed/u,
        );
        assert.equal(
          errorTreeHasCode(
            rejection,
            "WAVE2B_MEMBER_SNAPSHOT_DRIFT",
          ),
          true,
        );
        assert.equal(
          errorTreeHasCode(
            rejection,
            "SYNTHETIC_ADOPTION_CLOSE",
          ),
          true,
        );
        await assertForeignInodeSurvives(item.targetPath, foreign);
        assert.equal(
          await exists(path.join(
            context.lockPath,
            "recovery-adoption.json",
          )),
          true,
        );
      });

    await t.test("marker close rejects a cross-item resolved swap",
      async (t) => {
        const context = await fixture(t);
        const item = context.items[1];
        const original = await acquireRecoveryFixtureLock(
          context,
          "wave2b-adoption-cross-member-marker-close",
        );
        const events = [];
        let foreign = null;
        let exposedHandle = null;
        const rejection = await captureRejection(() =>
          adoptRecoveryFixtureLock(context, original, {
            journal(event) {
              events.push(event);
            },
            hooks: {
              writeRecoveryAdoptionMarker: async ({
                handle,
                bytes,
              }) => {
                await handle.writeFile(bytes);
                exposedHandle = handle;
                const close = handle.close.bind(handle);
                handle.close = async () => {
                  await close();
                  foreign = await replaceWithForeignInode(
                    item.targetPath,
                    "adoption cross-item marker close",
                  );
                };
              },
              afterRecoveryAdoptionMarkerClose: () =>
                exposedHandle.close(),
            },
          }));
        assert.equal(
          errorTreeHasCode(
            rejection,
            "WAVE2B_MEMBER_SNAPSHOT_DRIFT",
          ),
          true,
        );
        await assertForeignInodeSurvives(item.targetPath, foreign);
        const markerPath = path.join(
          context.lockPath,
          "recovery-adoption.json",
        );
        assert.equal(await exists(markerPath), true);
        assert.equal((await lstat(markerPath)).mode & 0o777, 0o444);
        assert.equal(
          events.some(({event}) =>
            event ===
              "lock-recovery-adoption-state-validated"),
          false,
        );
      });

    await t.test("state-validated journal", async (t) => {
      const context = await fixture(t);
      const item = context.items[0];
      const original = await acquireRecoveryFixtureLock(
        context,
        "wave2b-adoption-member-final-journal",
      );
      let foreign = null;
      await assert.rejects(
        adoptRecoveryFixtureLock(context, original, {
          journal: async ({event}) => {
            if (
              event ===
                "lock-recovery-adoption-state-validated"
            ) {
              foreign = await replaceWithForeignInode(
                item.targetPath,
                "adoption state-validated journal",
              );
              throw new Error(
                "adoption final journal rejected after drift",
              );
            }
          },
        }),
        /post-callback validation detected drift/u,
      );
      await assertForeignInodeSurvives(item.targetPath, foreign);
      assert.equal(
        await exists(path.join(
          context.lockPath,
          "recovery-adoption.json",
        )),
        true,
      );
    });
  });

test("partial or post-journal adoption failures leave a one-shot blocking marker",
  async (t) => {
    await t.test("partial marker write", async (t) => {
      const context = await fixture(t);
      const original = await acquireRecoveryFixtureLock(
        context,
        "wave2b-adoption-partial-marker",
      );
      await assert.rejects(
        adoptRecoveryFixtureLock(context, original, {
          hooks: {
            writeRecoveryAdoptionMarker: async ({handle, bytes}) => {
              await handle.write(bytes.subarray(0, 17));
              throw new Error("injected partial adoption marker");
            },
          },
        }),
        /injected partial adoption marker/u,
      );
      const markerPath = path.join(
        context.lockPath,
        "recovery-adoption.json",
      );
      assert.equal(await exists(markerPath), true);
      assert.equal((await lstat(markerPath)).mode & 0o777, 0o600);
      let replayLivenessCalls = 0;
      await assert.rejects(
        adoptRecoveryFixtureLock(context, original, {
          decideOwnerLiveness: async () => {
            replayLivenessCalls += 1;
            return "dead";
          },
        }),
        /lock directory entries changed/u,
      );
      assert.equal(replayLivenessCalls, 0);
    });

    await t.test("final durable journal failure", async (t) => {
      const context = await fixture(t);
      const original = await acquireRecoveryFixtureLock(
        context,
        "wave2b-adoption-final-journal",
      );
      let calls = 0;
      await assert.rejects(
        adoptRecoveryFixtureLock(context, original, {
          journal: async () => {
            calls += 1;
            if (calls === 2) {
              throw new Error("injected final adoption journal");
            }
          },
        }),
        /injected final adoption journal/u,
      );
      assert.equal(calls, 2);
      assert.equal(
        await exists(path.join(
          context.lockPath,
          "recovery-adoption.json",
        )),
        true,
      );
      let replayLivenessCalls = 0;
      await assert.rejects(
        adoptRecoveryFixtureLock(context, original, {
          decideOwnerLiveness: async () => {
            replayLivenessCalls += 1;
            return "dead";
          },
        }),
        /lock directory entries changed/u,
      );
      assert.equal(replayLivenessCalls, 0);
    });

    await t.test("marker drift during final journal", async (t) => {
      const context = await fixture(t);
      const original = await acquireRecoveryFixtureLock(
        context,
        "wave2b-adoption-final-drift",
      );
      let calls = 0;
      await assert.rejects(
        adoptRecoveryFixtureLock(context, original, {
          journal: async () => {
            calls += 1;
            if (calls === 2) {
              await chmod(
                path.join(
                  context.lockPath,
                  "recovery-adoption.json",
                ),
                0o644,
              );
            }
          },
        }),
        /recovery-adoption marker was replaced/u,
      );
      assert.equal(calls, 2);
    });
  });

test("adopted recovery revalidates after each state-validated journal callback",
  async (t) => {
    const context = await fixture(t);
    const original = await acquireRecoveryFixtureLock(
      context,
      "wave2b-adopted-transition-revalidation",
    );
    await assert.rejects(
      applyWave2bCasBatchRaw({
        items: context.items,
        lock: original,
        journal: testJournal,
        leaveInterruptedForTest: true,
        hooks: {
          afterState: async ({state}) => {
            if (state === CAS_STATES.TARGET_LINKED) {
              throw new Error("injected interrupted apply");
            }
          },
        },
      }),
      /injected interrupted apply/u,
    );
    const adopted = await adoptRecoveryFixtureLock(context, original);
    let markerChanged = false;
    await assert.rejects(
      recoverWave2bCasBatchRaw({
        items: context.items,
        lock: adopted,
        journal: async ({event}) => {
          if (
            !markerChanged &&
            event.endsWith("-state-validated")
          ) {
            markerChanged = true;
            await chmod(
              path.join(
                context.lockPath,
                "recovery-adoption.json",
              ),
              0o644,
            );
          }
        },
      }),
      /recovery-adoption marker was replaced/u,
    );
    assert.equal(markerChanged, true);
  });

test("recovery adoption rejects lock/member overlap before liveness",
  async (t) => {
    const context = await fixture(t);
    const overlappingLockPath = path.join(context.root, "transaction");
    const lock = await acquireWave2bLock({
      rootPath: context.root,
      lockPath: overlappingLockPath,
      owner: {
        transactionId: "wave2b-adoption-overlap",
        pid: process.pid,
      },
    });
    let livenessCalls = 0;
    await assert.rejects(
      adoptWave2bLockForRecovery({
        rootPath: context.root,
        lockPath: overlappingLockPath,
        items: context.items,
        persistedBinding: lock.persistedBinding,
        decideOwnerLiveness: async () => {
          livenessCalls += 1;
          return "dead";
        },
        journal: testJournal,
      }),
      /lock path overlaps a member path/u,
    );
    assert.equal(livenessCalls, 0);
    await releaseWave2bLock(lock);
  });

test("adopted release refuses unexpected entries without removing owner or marker",
  async (t) => {
    const context = await fixture(t);
    const original = await acquireRecoveryFixtureLock(
      context,
      "wave2b-adopted-release-extra",
    );
    const adopted = await adoptRecoveryFixtureLock(context, original);
    const ownerPath = path.join(context.lockPath, "owner.json");
    const markerPath = path.join(
      context.lockPath,
      "recovery-adoption.json",
    );
    const unexpected = path.join(context.lockPath, "unexpected");
    await writeFile(unexpected, "foreign\n", {
      flag: "wx",
      mode: 0o600,
    });
    await assert.rejects(
      releaseWave2bLock(adopted),
      /lock directory entries changed/u,
    );
    assert.equal(await exists(ownerPath), true);
    assert.equal(await exists(markerPath), true);
    await unlink(unexpected);
    await recoverWave2bCasBatchRaw({
      items: context.items,
      lock: adopted,
      journal: testJournal,
    });
    await releaseWave2bLock(adopted);
    assert.equal(await exists(context.lockPath), false);
  });
