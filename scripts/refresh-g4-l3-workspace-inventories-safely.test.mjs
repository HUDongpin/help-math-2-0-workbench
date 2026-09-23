import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  cp,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  enumerateInventoryRefreshScope,
  parseArguments,
  recoverInventoryRefreshTransaction,
  refreshG4L3WorkspaceInventoriesSafely,
} from "./refresh-g4-l3-workspace-inventories-safely.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const WRAPPER_PATH =
  "scripts/refresh-g4-l3-workspace-inventories-safely.mjs";
const MATERIALIZER_PATH =
  "scripts/materialize-g4-l3-workspace-inventories.mjs";
const PRIVATE_ROOT =
  "work/g4-l3-workspace-inventory-refresh-preimages";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function neutralSummary({check = false, dryRun = false} = {}) {
  return {
    check,
    dryRun,
    members: 40,
    outputs: 120,
    canonicalInventoryRestorations: 0,
    canonicalInventoryFilesChanged: false,
    assetDefinitionRows: 40,
    embeddedAudioRows: 40,
    catalogAudioAssociationRows: 40,
    strictAcceptanceEffect: "none",
  };
}

function fixtureRelease() {
  return {
    schemaVersion: 1,
    releases: [{
      releaseId: "lesson-g04-l03-negative-numbers",
      publicationMode: "atomic",
      expectedCounts: {members: 40},
      members: Array.from({length: 40}, (_, index) => ({
        ordinal: index + 1,
        animationId: `course-g04-l03-fixture-${String(index + 1).padStart(2, "0")}`,
        assetId: `fixture-asset-${String(index + 1).padStart(2, "0")}`,
        source: {
          path: `source-assets/fixture-${String(index + 1).padStart(2, "0")}.swf`,
          sha256: sha256(`source-${index + 1}`),
        },
      })),
    }],
  };
}

async function binding(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  const [content, info] = await Promise.all([
    readFile(absolutePath),
    lstat(absolutePath, {bigint: true}),
  ]);
  return {
    path: relativePath,
    bytes: content.length,
    sha256: sha256(content),
    stat: {
      dev: info.dev.toString(),
      ino: info.ino.toString(),
      size: info.size.toString(),
      mtimeNs: info.mtimeNs.toString(),
      ctimeNs: info.ctimeNs.toString(),
      mode: Number(info.mode & 0o777n),
      nlink: Number(info.nlink),
    },
    content,
  };
}

async function createFixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "g4-l3-safe-inventory-refresh-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  const releaseDocument = fixtureRelease();
  const release = releaseDocument.releases[0];
  const scope = enumerateInventoryRefreshScope(release);
  await mkdir(path.join(root, "catalog"), {recursive: true});
  await mkdir(path.join(root, "scripts"), {recursive: true});
  await writeFile(
    path.join(root, "catalog/lesson-releases.json"),
    `${JSON.stringify(releaseDocument, null, 2)}\n`,
  );
  await cp(path.join(repositoryRoot, WRAPPER_PATH), path.join(root, WRAPPER_PATH));
  await cp(path.join(repositoryRoot, MATERIALIZER_PATH), path.join(root, MATERIALIZER_PATH));
  const initialByPath = new Map();
  const desiredByPath = new Map();
  const canonicalByPath = new Map();
  for (const relativePath of scope.machinePaths) {
    await mkdir(path.dirname(path.join(root, relativePath)), {recursive: true});
    const initial = Buffer.from(`initial:${relativePath}\n`);
    const desired = Buffer.from(`desired:${relativePath}\n`);
    await writeFile(path.join(root, relativePath), initial);
    initialByPath.set(relativePath, initial);
    desiredByPath.set(relativePath, desired);
  }
  for (const relativePath of scope.canonicalPaths) {
    await mkdir(path.dirname(path.join(root, relativePath)), {recursive: true});
    const bytes = Buffer.from(`canonical-owner-bytes:${relativePath}\n`);
    await writeFile(path.join(root, relativePath), bytes);
    canonicalByPath.set(relativePath, bytes);
  }
  const materializer = async ({root: observedRoot, check = false, dryRun = false}) => {
    assert.equal(observedRoot, root);
    if (check) {
      for (const [relativePath, desired] of desiredByPath) {
        assert.deepEqual(await readFile(path.join(root, relativePath)), desired);
      }
    }
    return neutralSummary({check, dryRun});
  };
  const desiredBuilder = async ({transactionRoot}) => {
    const desiredRoot = path.join(transactionRoot, "desired");
    await mkdir(desiredRoot, {recursive: false});
    const desiredBindings = [];
    for (const relativePath of scope.machinePaths) {
      const output = path.join(desiredRoot, relativePath);
      await mkdir(path.dirname(output), {recursive: true});
      await writeFile(output, desiredByPath.get(relativePath), {flag: "wx"});
      await chmod(output, 0o444);
      desiredBindings.push(await binding(desiredRoot, relativePath));
    }
    return {
      desiredBindings,
      desiredRoot,
      writeSummary: neutralSummary(),
      checkSummary: neutralSummary({check: true}),
    };
  };
  return {
    root,
    release,
    scope,
    initialByPath,
    desiredByPath,
    canonicalByPath,
    materializer,
    desiredBuilder,
  };
}

async function assertFixtureState(fixture, {machine = "initial"} = {}) {
  const expectedMachine =
    machine === "desired" ? fixture.desiredByPath : fixture.initialByPath;
  for (const [relativePath, bytes] of expectedMachine) {
    assert.deepEqual(await readFile(path.join(fixture.root, relativePath)), bytes);
    assert.equal((await lstat(path.join(fixture.root, relativePath))).nlink, 1);
  }
  for (const [relativePath, bytes] of fixture.canonicalByPath) {
    assert.deepEqual(await readFile(path.join(fixture.root, relativePath)), bytes);
  }
}

test("CLI is fail-closed: dry-run is default and apply/recover are explicit", () => {
  assert.deepEqual(parseArguments([]).mode, "dry-run");
  assert.deepEqual(parseArguments(["--check"]).mode, "check");
  assert.deepEqual(parseArguments(["--apply"]).mode, "apply");
  assert.deepEqual(
    parseArguments(["--recover", "a".repeat(64)]),
    {
      mode: "recover",
      root: repositoryRoot,
      transactionId: "a".repeat(64),
    },
  );
  assert.throws(
    () => parseArguments(["--apply", "--check"]),
    /choose exactly one mode/,
  );
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
});

test("dry-run proves exact 40/120/80 scope and performs no write", async (t) => {
  const fixture = await createFixture(t);
  const result = await refreshG4L3WorkspaceInventoriesSafely({
    ...fixture,
    mode: "dry-run",
  });
  assert.equal(result.memberCount, 40);
  assert.equal(result.machineOutputCount, 120);
  assert.equal(result.canonicalInventoryCount, 80);
  assert.equal(result.writesPerformed, 0);
  assert.equal(result.strictAcceptanceEffect, "none");
  assert.equal(result.acceptance.strictComplete, false);
  assert.equal(
    await lstat(path.join(fixture.root, PRIVATE_ROOT)).then(
      () => true,
      (error) => error.code === "ENOENT" ? false : Promise.reject(error),
    ),
    false,
  );
  await assertFixtureState(fixture);
});

test("apply archives all 120 preimages as 0444, preserves 80 canonicals, checks, and rejects replay", async (t) => {
  const fixture = await createFixture(t);
  const transactionId = "1".repeat(64);
  const result = await refreshG4L3WorkspaceInventoriesSafely({
    ...fixture,
    mode: "apply",
    transactionId,
  });
  assert.equal(result.machineOutputCount, 120);
  assert.equal(result.canonicalInventoriesUnchanged, true);
  assert.equal(result.strictAcceptanceEffect, "none");
  await assertFixtureState(fixture, {machine: "desired"});
  const receiptPath = path.join(
    fixture.root,
    PRIVATE_ROOT,
    "transactions",
    transactionId,
    "receipt.json",
  );
  const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  assert.equal(receipt.acceptance.authoritativeRuntimeComplete, false);
  assert.equal(receipt.acceptance.independentHumanVisualReviewComplete, false);
  assert.equal(receipt.acceptance.ownerAccepted, false);
  assert.equal(receipt.acceptance.releasePublished, false);
  assert.equal(receipt.strictAcceptanceEffect, "none");
  assert.equal((await lstat(receiptPath)).mode & 0o777, 0o444);
  const archiveRoot = path.join(fixture.root, result.archive.relativeRoot);
  const archiveManifest = JSON.parse(
    await readFile(path.join(archiveRoot, "manifest.json"), "utf8"),
  );
  assert.equal(archiveManifest.fileCount, 120);
  for (const relativePath of fixture.scope.machinePaths) {
    const archived = path.join(archiveRoot, "files", relativePath);
    assert.equal((await lstat(archived)).mode & 0o777, 0o444);
    assert.equal((await lstat(archived)).nlink, 1);
  }
  await assert.rejects(
    refreshG4L3WorkspaceInventoriesSafely({
      ...fixture,
      mode: "apply",
      transactionId,
    }),
    /transaction replay detected/,
  );
});

test("preflight rejects symlink and hardlink attacks", async (t) => {
  const symlinkFixture = await createFixture(t);
  const symlinkPath = symlinkFixture.scope.machinePaths[0];
  const originalPath = `${path.join(symlinkFixture.root, symlinkPath)}.original`;
  await writeFile(originalPath, symlinkFixture.initialByPath.get(symlinkPath));
  await unlink(path.join(symlinkFixture.root, symlinkPath));
  await symlink(originalPath, path.join(symlinkFixture.root, symlinkPath));
  await assert.rejects(
    refreshG4L3WorkspaceInventoriesSafely({
      ...symlinkFixture,
      mode: "dry-run",
    }),
    /ELOOP|symbolic|regular file/,
  );

  const hardlinkFixture = await createFixture(t);
  const hardlinkPath = hardlinkFixture.scope.canonicalPaths[0];
  const linkedCopy = `${path.join(hardlinkFixture.root, hardlinkPath)}.linked`;
  await link(path.join(hardlinkFixture.root, hardlinkPath), linkedCopy);
  await assert.rejects(
    refreshG4L3WorkspaceInventoriesSafely({
      ...hardlinkFixture,
      mode: "dry-run",
    }),
    /multiple hard links/,
  );
});

test("no-replace lock refuses a concurrent refresh", async (t) => {
  const fixture = await createFixture(t);
  const lockRoot = path.join(fixture.root, PRIVATE_ROOT, ".refresh.lock");
  await mkdir(lockRoot, {recursive: true});
  await writeFile(
    path.join(lockRoot, "owner.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      transactionId: "2".repeat(64),
      pid: process.pid,
    })}\n`,
  );
  await assert.rejects(
    refreshG4L3WorkspaceInventoriesSafely({
      ...fixture,
      mode: "apply",
      transactionId: "3".repeat(64),
    }),
    /inventory refresh lock is held/,
  );
  await assertFixtureState(fixture);
});

test("partial failure rolls all machine outputs back without touching canonicals", async (t) => {
  const fixture = await createFixture(t);
  await assert.rejects(
    refreshG4L3WorkspaceInventoriesSafely({
      ...fixture,
      mode: "apply",
      transactionId: "4".repeat(64),
      hooks: {
        afterMachineWrite({ordinal}) {
          if (ordinal === 5) throw new Error("injected partial failure");
        },
      },
    }),
    /injected partial failure/,
  );
  await assertFixtureState(fixture);
});

test("canonical drift aborts and is never overwritten while machine outputs roll back", async (t) => {
  const fixture = await createFixture(t);
  const canonicalPath = fixture.scope.canonicalPaths[0];
  const drift = Buffer.from("concurrent canonical owner edit\n");
  let injected = false;
  await assert.rejects(
    refreshG4L3WorkspaceInventoriesSafely({
      ...fixture,
      mode: "apply",
      transactionId: "5".repeat(64),
      hooks: {
        async afterMachineWrite({ordinal}) {
          if (ordinal === 1 && !injected) {
            injected = true;
            await writeFile(path.join(fixture.root, canonicalPath), drift);
          }
        },
      },
    }),
    /canonical inventory after writes drifted/,
  );
  for (const [relativePath, bytes] of fixture.initialByPath) {
    assert.deepEqual(await readFile(path.join(fixture.root, relativePath)), bytes);
  }
  assert.deepEqual(await readFile(path.join(fixture.root, canonicalPath)), drift);
  for (const [relativePath, bytes] of fixture.canonicalByPath) {
    if (relativePath === canonicalPath) continue;
    assert.deepEqual(await readFile(path.join(fixture.root, relativePath)), bytes);
  }
});

test("rollback preserves concurrent machine drift and reports a recovery conflict", async (t) => {
  const fixture = await createFixture(t);
  const driftPath = fixture.scope.machinePaths[1];
  const drift = Buffer.from("concurrent machine edit during rollback\n");
  let injected = false;
  await assert.rejects(
    refreshG4L3WorkspaceInventoriesSafely({
      ...fixture,
      mode: "apply",
      transactionId: "6".repeat(64),
      hooks: {
        afterMachineWrite({ordinal}) {
          if (ordinal === 2) throw new Error("force rollback");
        },
        async onCasBoundary({phase, relativePath}) {
          if (
            phase === "before-rollback" &&
            relativePath === driftPath &&
            !injected
          ) {
            injected = true;
            await writeFile(path.join(fixture.root, driftPath), drift);
          }
        },
      },
    }),
    /concurrent drift was preserved/,
  );
  assert.deepEqual(await readFile(path.join(fixture.root, driftPath)), drift);
  for (const [relativePath, bytes] of fixture.initialByPath) {
    if (relativePath === driftPath) continue;
    assert.deepEqual(await readFile(path.join(fixture.root, relativePath)), bytes);
  }
});

test("an interrupted journal is recoverable and recovery restores the exact preimage set", async (t) => {
  const fixture = await createFixture(t);
  const transactionId = "7".repeat(64);
  await assert.rejects(
    refreshG4L3WorkspaceInventoriesSafely({
      ...fixture,
      mode: "apply",
      transactionId,
      testOnlyLeaveInterrupted: true,
      hooks: {
        afterMachineWrite({ordinal}) {
          if (ordinal === 3) throw new Error("simulated process interruption");
        },
      },
    }),
    /simulated process interruption/,
  );
  assert.deepEqual(
    await readFile(path.join(fixture.root, fixture.scope.machinePaths[0])),
    fixture.desiredByPath.get(fixture.scope.machinePaths[0]),
  );
  const recovered = await recoverInventoryRefreshTransaction({
    root: fixture.root,
    transactionId,
  });
  assert.equal(recovered.mode, "recover");
  assert.equal(recovered.conflicts, 0);
  assert.equal(recovered.strictAcceptanceEffect, "none");
  await assertFixtureState(fixture);
});

test("tampered content-addressed preimage is rejected before a second transaction", async (t) => {
  const fixture = await createFixture(t);
  await assert.rejects(
    refreshG4L3WorkspaceInventoriesSafely({
      ...fixture,
      mode: "apply",
      transactionId: "8".repeat(64),
      hooks: {
        afterMachineWrite({ordinal}) {
          if (ordinal === 1) throw new Error("create reusable preimage set");
        },
      },
    }),
    /create reusable preimage set/,
  );
  const setsRoot = path.join(fixture.root, PRIVATE_ROOT, "sets");
  const [setName] = await readdir(setsRoot);
  const victim = path.join(
    setsRoot,
    setName,
    "files",
    fixture.scope.machinePaths[0],
  );
  await chmod(victim, 0o644);
  await writeFile(victim, "tampered archive bytes\n");
  await chmod(victim, 0o444);
  await assert.rejects(
    refreshG4L3WorkspaceInventoriesSafely({
      ...fixture,
      mode: "apply",
      transactionId: "9".repeat(64),
    }),
    /preimage is tampered|manifest is tampered/,
  );
  await assertFixtureState(fixture);
});
