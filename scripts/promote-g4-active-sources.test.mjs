import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { lstat, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { atomicSwapSiblingDirectoriesDarwin } from
  "./lib/darwin-atomic-directory-swap.mjs";
import {
  EXPECTED,
  cloneTreeCopyOnWrite,
  installFinalReceiptExclusive,
  observeSwapPair,
  parseArguments,
  portablePath,
  restoreSwapPair,
  syncTreeDurably,
  transactionIdentifier,
  validatePlan,
  validateParentModeSnapshots,
} from "./promote-g4-active-sources.mjs";

function nodeIdentity(information) {
  return { dev: String(information.dev), ino: String(information.ino) };
}

test("parses only explicit promotion modes and normalized path overrides", () => {
  assert.deepEqual(parseArguments(["--preflight"]), { mode: "preflight" });
  assert.equal(parseArguments(["--help"]).help, true);
  assert.throws(() => parseArguments([]), /Choose exactly one/);
  assert.throws(() => parseArguments(["--apply", "--recover"]), /Choose exactly one/);
  assert.throws(() => parseArguments(["--apply", "--unknown"]), /Unknown argument/);
});

test("rejects non-normalized, escaping, nonportable, and non-Grade-4 paths", () => {
  assert.equal(
    portablePath("HELP_COURSES/ELMGR4/L1/RW/L1RW02.swf", "target", { requireG4: true }),
    "HELP_COURSES/ELMGR4/L1/RW/L1RW02.swf",
  );
  for (const candidate of [
    "/HELP_COURSES/ELMGR4/L1/RW/L1RW02.swf",
    "../ELMGR4/L1/RW/L1RW02.swf",
    "HELP_COURSES/ELMGR4/L1/../L2/RW/L2RW01.swf",
    "HELP_COURSES\\ELMGR4\\L1RW02.swf",
    "HELP_COURSES//ELMGR4/L1RW02.swf",
  ]) {
    assert.throws(
      () => portablePath(candidate, "target", { requireG4: true }),
      /relative|escapes|normalized|forbidden|outside Grade 4/,
    );
  }
  assert.throws(
    () => portablePath("HELP_COURSES/ELMGR5/L1/RW/L1RW02.swf", "target", { requireG4: true }),
    /outside Grade 4/,
  );
});

test("accepts only the exact dated selective plan", async () => {
  const plan = JSON.parse(await readFile(
    new URL("../catalog/source-promotions/g4-active-source-promotion-2026-08-02.json", import.meta.url),
    "utf8",
  ));
  assert.equal(validatePlan(plan, { planSha256: EXPECTED.planSha256 }), plan);

  const expanded = structuredClone(plan);
  expanded.copyRecords.push(structuredClone(expanded.copyRecords[0]));
  assert.throws(() => validatePlan(expanded), /Copy-record count drift/);

  const overclaim = structuredClone(plan);
  overclaim.transaction.sourceDependencyClosureComplete = true;
  assert.throws(() => validatePlan(overclaim), /incomplete dependency closure/);
});

test("observes and reverses a real Darwin directory exchange without blind fallback", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "g4-source-swap-test-"));
  const live = path.join(temporaryRoot, "live");
  const recovery = path.join(temporaryRoot, "recovery");
  try {
    await mkdir(live);
    await mkdir(recovery);
    const before = {
      live: nodeIdentity(await lstat(live, { bigint: true })),
      staged: nodeIdentity(await lstat(recovery, { bigint: true })),
    };
    assert.equal((await observeSwapPair({ livePath: live, recoveryPath: recovery, before, label: "fixture" })).state, "unchanged");
    await atomicSwapSiblingDirectoriesDarwin({
      allowedParent: temporaryRoot,
      firstDirectory: live,
      secondDirectory: recovery,
    });
    assert.equal((await observeSwapPair({ livePath: live, recoveryPath: recovery, before, label: "fixture" })).state, "swapped");
    const restored = await restoreSwapPair({
      allowedParent: temporaryRoot,
      livePath: live,
      recoveryPath: recovery,
      before,
      label: "fixture",
    });
    assert.equal(restored.action, "swapped-back-to-base");
    assert.equal((await observeSwapPair({ livePath: live, recoveryPath: recovery, before, label: "fixture" })).state, "unchanged");

    await assert.rejects(
      restoreSwapPair({
        allowedParent: temporaryRoot,
        livePath: live,
        recoveryPath: recovery,
        before: { live: { dev: "0", ino: "0" }, staged: { dev: "0", ino: "1" } },
        label: "indeterminate-fixture",
      }),
      /indeterminate; refusing a blind rollback/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("installs one immutable final receipt and refuses replacement", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "g4-source-receipt-test-"));
  const catalogRoot = path.join(temporaryRoot, "catalog");
  const receiptPath = path.join(
    catalogRoot,
    "source-promotions/g4-active-source-promotion-2026-08-02-applied.json",
  );
  const configuration = { catalogRoot, receiptPath };
  const receipt = {
    artifactType: "help-math-g4-active-source-promotion-applied-receipt",
    lifecycle: "final",
    applied: true,
    claim: "partial-source-promotion-only",
  };
  try {
    await mkdir(path.dirname(receiptPath), { recursive: true });
    const evidence = await installFinalReceiptExclusive(configuration, receipt);
    assert.equal(evidence.path, "catalog/source-promotions/g4-active-source-promotion-2026-08-02-applied.json");
    assert.equal(evidence.mode, "0444");
    const information = await lstat(receiptPath);
    assert.equal(information.isFile(), true);
    assert.equal(information.mode & 0o222, 0);
    assert.deepEqual(JSON.parse(await readFile(receiptPath, "utf8")), receipt);
    await assert.rejects(
      installFinalReceiptExclusive(configuration, receipt),
      /Applied receipt already exists/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("durably syncs every staged regular file and directory and refuses links", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "g4-source-durability-test-"));
  try {
    await mkdir(path.join(temporaryRoot, "nested"));
    await writeFile(path.join(temporaryRoot, "one.bin"), "one");
    await writeFile(path.join(temporaryRoot, "nested/two.bin"), "two-two");
    assert.deepEqual(await syncTreeDurably(temporaryRoot), {
      fileCount: 2,
      directoryCount: 2,
      totalBytes: 10,
    });
    await symlink(path.join(temporaryRoot, "one.bin"), path.join(temporaryRoot, "unsafe-link"));
    await assert.rejects(syncTreeDurably(temporaryRoot), /refuses a symbolic link/);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("clones a tree with the native APFS backend and validates its exact structure", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "g4-source-native-clone-test-"));
  const source = path.join(temporaryRoot, "source");
  const destination = path.join(temporaryRoot, "destination");
  try {
    await mkdir(path.join(source, "nested"), { recursive: true });
    await writeFile(path.join(source, "one.bin"), "one");
    await writeFile(path.join(source, "nested/two.bin"), "two-two");
    const result = await cloneTreeCopyOnWrite(source, destination);
    assert.equal(result.backend, "/bin/cp -c -R -p -P");
    assert.equal(result.sourceStructure.structureSha256, result.destinationStructure.structureSha256);
    assert.equal(await readFile(path.join(destination, "nested/two.bin"), "utf8"), "two-two");
    assert.equal((await lstat(path.join(destination, "one.bin"))).nlink, 1);

    const unsafeSource = path.join(temporaryRoot, "unsafe-source");
    await mkdir(unsafeSource);
    await symlink(path.join(source, "one.bin"), path.join(unsafeSource, "link"));
    await assert.rejects(
      cloneTreeCopyOnWrite(unsafeSource, path.join(temporaryRoot, "unsafe-destination")),
      /refuses a symbolic link/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("recovery parent modes are confined to the two reviewed exact parents", () => {
  const configuration = {
    sourceRoot: "/reviewed/source-parent/live-source",
    catalogRoot: "/reviewed/catalog-parent/live-catalog",
  };
  const snapshots = [
    { path: "/reviewed/source-parent", mode: 0o555, node: { dev: "1", ino: "2" } },
    { path: "/reviewed/catalog-parent", mode: 0o755, node: { dev: "1", ino: "3" } },
  ];
  assert.equal(validateParentModeSnapshots(configuration, snapshots).length, 2);
  assert.throws(
    () => validateParentModeSnapshots(configuration, [
      snapshots[0],
      { ...snapshots[1], path: "/tmp/unreviewed" },
    ]),
    /outside the reviewed transaction scope/,
  );
  assert.throws(
    () => validateParentModeSnapshots(configuration, [
      snapshots[0],
      { ...snapshots[1], mode: 0o666 },
    ]),
    /Invalid transaction parent mode/,
  );
  assert.deepEqual(validateParentModeSnapshots(configuration, [], {
    directoryNodesBeforeSwap: null,
    swapReceipts: {},
  }), []);
  assert.throws(
    () => validateParentModeSnapshots(configuration, [], {
      directoryNodesBeforeSwap: { source: {}, catalog: {} },
      swapReceipts: {},
    }),
    /lost parent-mode snapshots/,
  );
});

test("the immutable applied receipt is the forward-only commit point", async () => {
  const source = await readFile(
    new URL("./promote-g4-active-sources.mjs", import.meta.url),
    "utf8",
  );
  assert.match(source, /phase: "ready-to-publish-receipt"[\s\S]+receiptDraft:/);
  assert.match(
    source,
    /if \(receiptKind === "file"\) \{[\s\S]+verifyPublishedCommit[\s\S]+phase: "committed"/,
  );
  assert.match(
    source,
    /receiptKind !== "missing"[\s\S]+refusing an automatic rollback/,
  );
  assert.match(
    source,
    /receiptCommitPointPresent: true/,
  );
});

test("transaction identifiers are path-safe and deterministic for injected inputs", () => {
  assert.equal(
    transactionIdentifier(
      new Date("2026-08-02T03:04:05.678Z"),
      "12345678-90ab-cdef-1234-567890abcdef",
    ),
    "20260802T030405678Z-1234567890ab",
  );
});
