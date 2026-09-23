import assert from "node:assert/strict";
import {
  chmod,
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
  inventory,
  parseArguments,
  parseManifest,
  replaceFreezeFilesAtomically,
  serializeManifest,
  verifyCompatibilitySymlink,
  verifyManifest,
  writeManifest,
} from "./freeze-help-math-sources.mjs";

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
    await Promise.all(entries.map((entry) => thaw(path.join(target, entry))));
    return;
  }
  await chmod(target, 0o600);
}

async function removeFixture(root) {
  await thaw(root);
  await rm(root, { recursive: true, force: true });
}

async function createFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-freeze-"));
  const source = path.join(root, "source");
  const catalog = path.join(root, "catalog");
  const nested = path.join(source, "nested");
  const executable = path.join(source, "player.swf");
  const document = path.join(nested, "lesson.fla");
  await mkdir(nested, { recursive: true });
  await writeFile(executable, "flash-z");
  await writeFile(document, "flash-a");
  await chmod(source, 0o775);
  await chmod(nested, 0o775);
  await chmod(executable, 0o755);
  await chmod(document, 0o664);
  return { root, source, catalog, nested, executable, document };
}

function permissionBits(info) {
  return info.mode & 0o777;
}

test("inventories a source tree with stable relative paths and hashes", async () => {
  const fixture = await createFixture();
  try {
    const snapshot = await inventory(fixture.source);
    assert.equal(snapshot.records.length, 2);
    assert.equal(snapshot.bytes, 14);
    assert.deepEqual(
      snapshot.records.map((record) => record.path),
      ["nested/lesson.fla", "player.swf"],
    );
    assert.match(snapshot.records[0].sha256, /^[a-f0-9]{64}$/);

    const manifest = serializeManifest(snapshot.records);
    assert.deepEqual(
      parseManifest(manifest),
      snapshot.records.map(({ path: relativePath, sha256 }) => ({
        path: relativePath,
        sha256,
      })),
    );
  } finally {
    await removeFixture(fixture.root);
  }
});

test("rejects malformed and unsafe source manifest lines", () => {
  assert.throws(() => parseManifest("not-a-hash  source.swf\n"), /line 1/);
  assert.throws(
    () => parseManifest(`${"a".repeat(64)}  ../outside.swf\n`),
    /Unsafe manifest path/,
  );
});

test("parses explicit staging paths and rejects path overrides for relocation", () => {
  const cwd = path.join(path.sep, "tmp", "freeze-cli");
  assert.deepEqual(
    parseArguments(
      ["--write", "--source", "source", "--catalog-root", "catalog"],
      { cwd },
    ),
    {
      help: false,
      mode: "write",
      sourceRoot: path.join(cwd, "source"),
      catalogRoot: path.join(cwd, "catalog"),
      defaultPaths: false,
    },
  );
  assert.throws(
    () => parseArguments(["--relocate", "--source", "source"], { cwd }),
    /project-default/,
  );
  assert.throws(
    () => parseArguments(["--write", "--verify"], { cwd }),
    /exactly one mode/,
  );
});

test("write freezes every entry, preserves execute bits, and verifies staging metadata", async () => {
  const fixture = await createFixture();
  try {
    const summary = await writeManifest(fixture.source, {
      catalogRoot: fixture.catalog,
      defaultPaths: false,
    });
    assert.equal(summary.fileCount, 2);
    assert.equal(summary.totalBytes, 14);
    assert.equal(summary.readOnlyEnforced, true);
    assert.equal(summary.writableEntriesAfterFreeze, 0);
    assert.match(summary.manifestSha256, /^[a-f0-9]{64}$/);

    assert.equal(permissionBits(await lstat(fixture.source)), 0o555);
    assert.equal(permissionBits(await lstat(fixture.nested)), 0o555);
    assert.equal(permissionBits(await lstat(fixture.executable)), 0o555);
    assert.equal(permissionBits(await lstat(fixture.document)), 0o444);
    assert.equal(
      permissionBits(await lstat(fixture.executable)) & 0o111,
      0o111,
      "freezing must preserve executable bits",
    );

    const storedSummary = JSON.parse(
      await readFile(path.join(fixture.catalog, "source-freeze.json"), "utf8"),
    );
    assert.deepEqual(storedSummary, summary);
    assert.deepEqual(
      await verifyManifest(fixture.source, {
        catalogRoot: fixture.catalog,
        defaultPaths: false,
      }),
      {
        fileCount: 2,
        totalBytes: 14,
        manifestSha256: summary.manifestSha256,
        readOnlyEnforced: true,
        writableEntriesAfterFreeze: 0,
      },
    );
  } finally {
    await removeFixture(fixture.root);
  }
});

test("verification rejects summary, manifest, and permission drift", async () => {
  const fixture = await createFixture();
  const summaryPath = path.join(fixture.catalog, "source-freeze.json");
  const manifestPath = path.join(fixture.catalog, "source-manifest.sha256");
  try {
    await writeManifest(fixture.source, {
      catalogRoot: fixture.catalog,
      defaultPaths: false,
    });
    const originalSummaryContents = await readFile(summaryPath, "utf8");
    const originalSummary = JSON.parse(originalSummaryContents);
    const originalManifest = await readFile(manifestPath, "utf8");

    await writeFile(
      summaryPath,
      `${JSON.stringify({ ...originalSummary, fileCount: originalSummary.fileCount + 1 }, null, 2)}\n`,
    );
    await assert.rejects(
      verifyManifest(fixture.source, { catalogRoot: fixture.catalog }),
      /fileCount/,
    );

    await writeFile(
      summaryPath,
      `${JSON.stringify({ ...originalSummary, totalBytes: originalSummary.totalBytes + 1 }, null, 2)}\n`,
    );
    await assert.rejects(
      verifyManifest(fixture.source, { catalogRoot: fixture.catalog }),
      /totalBytes/,
    );

    await writeFile(
      summaryPath,
      `${JSON.stringify({ ...originalSummary, manifestSha256: "0".repeat(64) }, null, 2)}\n`,
    );
    await assert.rejects(
      verifyManifest(fixture.source, { catalogRoot: fixture.catalog }),
      /manifestSha256/,
    );

    await writeFile(summaryPath, originalSummaryContents);
    await writeFile(manifestPath, `${originalManifest}# drift\n`);
    await assert.rejects(
      verifyManifest(fixture.source, { catalogRoot: fixture.catalog }),
      /Invalid manifest line|manifestSha256/,
    );

    await writeFile(manifestPath, originalManifest);
    await chmod(fixture.document, 0o644);
    await assert.rejects(
      verifyManifest(fixture.source, { catalogRoot: fixture.catalog }),
      /writable entr/,
    );
  } finally {
    await removeFixture(fixture.root);
  }
});

test("catalog pair replacement restores both original files when validation fails", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-freeze-transaction-"));
  const manifestPath = path.join(root, "source-manifest.sha256");
  const summaryPath = path.join(root, "source-freeze.json");
  try {
    await writeFile(manifestPath, "original manifest\n");
    await writeFile(summaryPath, "original summary\n");
    await assert.rejects(
      replaceFreezeFilesAtomically({
        manifestPath,
        manifestContents: "new manifest\n",
        summaryPath,
        summaryContents: "new summary\n",
        validate: async () => {
          throw new Error("injected validation failure");
        },
      }),
      /injected validation failure/,
    );
    assert.equal(await readFile(manifestPath, "utf8"), "original manifest\n");
    assert.equal(await readFile(summaryPath, "utf8"), "original summary\n");
    assert.deepEqual(
      (await readdir(root)).sort(),
      ["source-freeze.json", "source-manifest.sha256"],
      "transaction rollback must not leave temporary or backup files",
    );
  } finally {
    await removeFixture(root);
  }
});

test("compatibility verification accepts only a symlink to the canonical directory", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-freeze-link-"));
  const canonical = path.join(root, "canonical");
  const other = path.join(root, "other");
  const compatibility = path.join(root, "compatibility");
  try {
    await mkdir(canonical);
    await mkdir(other);
    await symlink(path.relative(root, canonical), compatibility, "dir");
    await verifyCompatibilitySymlink({ compatibility, canonical });

    await rm(compatibility);
    await symlink(path.relative(root, other), compatibility, "dir");
    await assert.rejects(
      verifyCompatibilitySymlink({ compatibility, canonical }),
      /not .*canonical|not \/|not.*source/i,
    );
  } finally {
    await removeFixture(root);
  }
});
