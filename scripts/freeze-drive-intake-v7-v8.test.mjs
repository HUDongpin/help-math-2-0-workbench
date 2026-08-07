import assert from "node:assert/strict";
import {
  chmod,
  link,
  lstat,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  enforceFrozenModes,
  inventoryRoot,
  parseArguments,
  parseRecordManifest,
  serializeRecordManifest,
  sha256Bytes,
  validateLedger,
  validateUnion,
  verifyFrozenModes,
  verifyResumableModes,
  verifyStagingEmpty,
  verifyWorkingModes,
  writeExclusive,
} from "./freeze-drive-intake-v7-v8.mjs";

async function thaw(target) {
  let info;
  try {
    info = await lstat(target);
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  if (info.isSymbolicLink()) return;
  if (info.isDirectory()) {
    await chmod(target, 0o700);
    const entries = await readdir(target);
    for (const entry of entries) await thaw(path.join(target, entry));
  } else {
    await chmod(target, 0o600);
  }
}

async function removeFixture(root) {
  await thaw(root);
  await rm(root, { recursive: true, force: true });
}

async function writeObjectLedger(root, ledgerBase, contents) {
  const bytes = Buffer.from(contents);
  const sha256 = sha256Bytes(bytes);
  const bucket = sha256.slice(0, 2);
  const objectRelativePath = `downloads/sha256/${bucket}/${sha256}`;
  const ledgerRelativePath = `${ledgerBase}/sha256/${bucket}/${sha256}.json`;
  await mkdir(path.join(root, "downloads", "sha256", bucket), { recursive: true, mode: 0o700 });
  await mkdir(path.join(root, ...ledgerBase.split("/"), "sha256", bucket), { recursive: true, mode: 0o700 });
  await writeFile(path.join(root, ...objectRelativePath.split("/")), bytes, { mode: 0o600 });
  const ledger = {
    schemaVersion: "help-math-drive-dedupe-object-ledger/v1",
    sha256,
    bytes: bytes.length,
    objectRelativePath,
    objectMode: "0600",
    state: "installed-and-verified",
    policy: {
      identity: "complete SHA-256 plus byte count",
      intakeExcludedFromLocalIndex: true,
    },
    claims: {
      byteIdentityOnly: true,
      canonicalPromotion: false,
      acceptance: false,
      runtimeFidelity: false,
      publication: false,
    },
  };
  await writeFile(
    path.join(root, ...ledgerRelativePath.split("/")),
    `${JSON.stringify(ledger, null, 2)}\n`,
    { mode: 0o600 },
  );
  return { sha256, objectRelativePath, ledgerRelativePath };
}

async function createFixture() {
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-v7-v8-freeze-"));
  const roots = { v7: path.join(fixtureRoot, "v7"), v8: path.join(fixtureRoot, "v8") };
  for (const root of Object.values(roots)) {
    await mkdir(path.join(root, "downloads", ".dedupe-staging"), { recursive: true, mode: 0o700 });
  }
  const v7Object = await writeObjectLedger(roots.v7, "manifests/ledger-v7", "v7-object");
  const v8Object = await writeObjectLedger(roots.v8, "manifests/ledger-v8", "v8-object");
  return { fixtureRoot, roots, v7Object, v8Object };
}

function makeRecordMap(...inventories) {
  return new Map(inventories.flatMap((inventory) => inventory.records.map((record) => [
    `${record.root}\0${record.path}`,
    record,
  ])));
}

test("parses only explicit apply or check modes", () => {
  assert.deepEqual(parseArguments(["--apply"]), { help: false, mode: "apply" });
  assert.deepEqual(parseArguments(["--resume"]), { help: false, mode: "resume" });
  assert.deepEqual(parseArguments(["--check"]), { help: false, mode: "check" });
  assert.deepEqual(parseArguments(["--help"]), { help: true });
  assert.throws(() => parseArguments([]), /Choose exactly one/);
  assert.throws(() => parseArguments(["--apply", "--check"]), /Choose exactly one/);
  assert.throws(() => parseArguments(["--root", "/tmp"]), /Unknown argument/);
});

test("record manifest is canonical, sorted, and path-safe", () => {
  const records = [
    { root: "v8", path: "b.bin", bytes: 2, sha256: "b".repeat(64) },
    { root: "v7", path: "a.bin", bytes: 1, sha256: "a".repeat(64) },
  ];
  const contents = serializeRecordManifest(records);
  assert.deepEqual(parseRecordManifest(contents), [records[1], records[0]]);
  const encodedEscape = {
    root: "v8",
    relativePathBytesBase64: Buffer.from("../escape", "utf8").toString("base64"),
    bytes: 2,
    sha256: "b".repeat(64),
  };
  assert.throws(
    () => parseRecordManifest(`${JSON.stringify(encodedEscape)}\n`),
    /escapes its root/,
  );
  assert.throws(() => parseRecordManifest(contents.trimEnd()), /end with a newline/);
});

test("inventories every regular file with stable byte identity", async () => {
  const fixture = await createFixture();
  try {
    const inventory = await inventoryRoot(fixture.roots.v7, "v7");
    assert.equal(inventory.records.length, 2);
    assert.equal(inventory.directoryCount, 9);
    assert.equal(inventory.records.find((record) => record.path === fixture.v7Object.objectRelativePath).sha256, fixture.v7Object.sha256);
  } finally {
    await removeFixture(fixture.fixtureRoot);
  }
});

test("inventory rejects symlinks and hard-linked files", async () => {
  const fixture = await createFixture();
  try {
    await symlink("missing", path.join(fixture.roots.v7, "bad-link"));
    await assert.rejects(inventoryRoot(fixture.roots.v7, "v7"), /Symbolic links are not allowed/);
    await rm(path.join(fixture.roots.v7, "bad-link"));
    const original = path.join(fixture.roots.v7, ...fixture.v7Object.objectRelativePath.split("/"));
    await link(original, path.join(fixture.roots.v7, "hard-link"));
    await assert.rejects(inventoryRoot(fixture.roots.v7, "v7"), /Hard-linked files are not allowed/);
  } finally {
    await removeFixture(fixture.fixtureRoot);
  }
});

test("validates object ledgers and a disjoint SHA-only union", async () => {
  const fixture = await createFixture();
  try {
    const [v7Inventory, v8Inventory] = await Promise.all([
      inventoryRoot(fixture.roots.v7, "v7"),
      inventoryRoot(fixture.roots.v8, "v8"),
    ]);
    const records = makeRecordMap(v7Inventory, v8Inventory);
    const v7 = await validateLedger({
      roots: fixture.roots,
      records,
      rootLabel: "v7",
      ledgerPrefix: "manifests/ledger-v7/sha256/",
      expectedCount: 1,
    });
    const v8 = await validateLedger({
      roots: fixture.roots,
      records,
      rootLabel: "v8",
      ledgerPrefix: "manifests/ledger-v8/sha256/",
      expectedCount: 1,
    });
    const union = validateUnion(v7, v8, { expectedCount: 2 });
    assert.equal(union.uniqueSha256Count, 2);
    assert.equal(union.overlapCount, 0);
    assert.match(union.rootedObjectAndLedgerSetSha256, /^[0-9a-f]{64}$/);
  } finally {
    await removeFixture(fixture.fixtureRoot);
  }
});

test("ledger validation fails closed on object byte drift", async () => {
  const fixture = await createFixture();
  try {
    const objectPath = path.join(fixture.roots.v7, ...fixture.v7Object.objectRelativePath.split("/"));
    await writeFile(objectPath, "changed", { mode: 0o600 });
    const [v7Inventory, v8Inventory] = await Promise.all([
      inventoryRoot(fixture.roots.v7, "v7"),
      inventoryRoot(fixture.roots.v8, "v8"),
    ]);
    await assert.rejects(
      validateLedger({
        roots: fixture.roots,
        records: makeRecordMap(v7Inventory, v8Inventory),
        rootLabel: "v7",
        ledgerPrefix: "manifests/ledger-v7/sha256/",
        expectedCount: 1,
      }),
      /object SHA-256 mismatch|object byte count mismatch/,
    );
  } finally {
    await removeFixture(fixture.fixtureRoot);
  }
});

test("staging check requires both intake staging trees to remain empty", async () => {
  const fixture = await createFixture();
  try {
    assert.deepEqual(await verifyStagingEmpty(fixture.roots), {
      v7: { path: "downloads/.dedupe-staging", entryCount: 0 },
      v8: { path: "downloads/.dedupe-staging", entryCount: 0 },
    });
    await writeFile(path.join(fixture.roots.v8, "downloads", ".dedupe-staging", "residue"), "x");
    await assert.rejects(verifyStagingEmpty(fixture.roots), /staging contains 1/);
  } finally {
    await removeFixture(fixture.fixtureRoot);
  }
});

test("permission transaction enforces exact 0400 files and 0500 directories", async () => {
  const fixture = await createFixture();
  try {
    const working = await verifyWorkingModes(fixture.roots);
    assert.equal(working.wrongModes, 0);
    await enforceFrozenModes(fixture.roots);
    const resumable = await verifyResumableModes(fixture.roots);
    assert.equal(resumable.frozenEntries, resumable.files + resumable.directories);
    const frozen = await verifyFrozenModes(fixture.roots);
    assert.equal(frozen.files, 4);
    assert.equal(frozen.writableEntries, 0);
    assert.equal(frozen.wrongModes, 0);
    const sample = await lstat(path.join(fixture.roots.v7, ...fixture.v7Object.objectRelativePath.split("/")));
    assert.equal(sample.mode & 0o777, 0o400);
    await chmod(path.join(fixture.roots.v7, ...fixture.v7Object.objectRelativePath.split("/")), 0o600);
    await assert.rejects(verifyFrozenModes(fixture.roots), /writable entries|outside exact/);
    await chmod(path.join(fixture.roots.v7, ...fixture.v7Object.objectRelativePath.split("/")), 0o666);
    await assert.rejects(verifyResumableModes(fixture.roots), /outside the exact working\/frozen mode pair/);
  } finally {
    await removeFixture(fixture.fixtureRoot);
  }
});

test("fixture ledger bytes are canonical JSON inputs", async () => {
  const fixture = await createFixture();
  try {
    const ledger = JSON.parse(await readFile(path.join(fixture.roots.v7, ...fixture.v7Object.ledgerRelativePath.split("/")), "utf8"));
    assert.equal(ledger.sha256, fixture.v7Object.sha256);
    assert.equal(ledger.claims.canonicalPromotion, false);
  } finally {
    await removeFixture(fixture.fixtureRoot);
  }
});

test("exclusive closure writes publish atomically without leaving a preparing hard link", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-freeze-output-"));
  try {
    const output = path.join(root, "receipt.json");
    await writeExclusive(output, "complete\n");
    assert.equal(await readFile(output, "utf8"), "complete\n");
    assert.equal((await lstat(output)).nlink, 1);
    assert.deepEqual(await readdir(root), ["receipt.json"]);
    await assert.rejects(writeExclusive(output, "replacement\n"), /Refusing to overwrite/);
    assert.deepEqual(await readdir(root), ["receipt.json"]);
  } finally {
    await removeFixture(root);
  }
});
