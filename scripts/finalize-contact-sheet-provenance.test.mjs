import assert from "node:assert/strict";
import {link, mkdtemp, mkdir, readFile, readdir, realpath, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  CONTACT_SHEET_PROVENANCE_TARGETS,
  writeOwnedReplacementTransaction,
} from "./finalize-contact-sheet-provenance.mjs";

async function transactionFixture() {
  const created = await mkdtemp(path.join(os.tmpdir(), "contact-sheet-transaction-test-"));
  const root = await realpath(created);
  const directory = path.join(root, "migrations", "fixture", "evidence");
  await mkdir(directory, {recursive: true});
  const first = path.join(directory, "first.json");
  const second = path.join(directory, "second.json");
  const firstBefore = Buffer.from("first-before\n");
  const secondBefore = Buffer.from("second-before\n");
  await writeFile(first, firstBefore);
  await writeFile(second, secondBefore);
  const entries = [
    {
      target: {animationId: "fixture-first"},
      filePath: first,
      expectedBefore: firstBefore,
      intended: Buffer.from("first-after\n"),
    },
    {
      target: {animationId: "fixture-second"},
      filePath: second,
      expectedBefore: secondBefore,
      intended: Buffer.from("second-after\n"),
    },
  ];
  return {root, directory, first, second, firstBefore, secondBefore, entries};
}

async function transactionArtifacts(directory) {
  return (await readdir(directory)).filter((name) => name.includes(".contact-sheet-"));
}

test("contact-sheet provenance registry is bounded to all 14 non-course sheets and the four Spanish coverage bindings", () => {
  assert.equal(CONTACT_SHEET_PROVENANCE_TARGETS.length, 14);
  assert.equal(new Set(CONTACT_SHEET_PROVENANCE_TARGETS.map(({manifest}) => manifest)).size, 14);
  assert.equal(new Set(CONTACT_SHEET_PROVENANCE_TARGETS.map(({animationId}) => animationId)).size, 6);
  assert.equal(CONTACT_SHEET_PROVENANCE_TARGETS.filter(({migrationBinding}) => migrationBinding).length, 12);
  assert.deepEqual(
    CONTACT_SHEET_PROVENANCE_TARGETS.filter(({coverageBinding}) => coverageBinding).map(({manifest}) => manifest).sort(),
    [
      "migrations/formula-elementary-conversion-01-01/evidence/contact-sheets/default-es/manifest.json",
      "migrations/formula-elementary-conversion-01-02/evidence/contact-sheets/default-es/manifest.json",
      "migrations/formula-elementary-conversion-01-03/evidence/contact-sheets/default-es/manifest.json",
      "migrations/formula-elementary-conversion-01-04/evidence/contact-sheets/default-es/manifest.json",
    ],
  );
  assert.deepEqual(
    CONTACT_SHEET_PROVENANCE_TARGETS.filter(({migrationBinding}) => !migrationBinding).map(({manifest}) => manifest).sort(),
    [
      "migrations/keyterm-elementary-acute-angle/evidence/contact-sheets/standalone-default-en/manifest.json",
      "migrations/keyterm-elementary-computeghgh/evidence/contact-sheets/standalone-default-en/manifest.json",
    ],
  );
});

test("owned replacement transaction publishes every entry and removes transaction artifacts", async () => {
  const fixture = await transactionFixture();
  try {
    await writeOwnedReplacementTransaction(fixture.root, fixture.entries);
    assert.equal(await readFile(fixture.first, "utf8"), "first-after\n");
    assert.equal(await readFile(fixture.second, "utf8"), "second-after\n");
    assert.deepEqual(await transactionArtifacts(fixture.directory), []);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("owned replacement transaction rolls all committed entries back after a later failure", async () => {
  const fixture = await transactionFixture();
  try {
    await assert.rejects(
      writeOwnedReplacementTransaction(fixture.root, fixture.entries, {
        beforeCommitEntry(_entry, index) {
          if (index === 1) throw new Error("injected second-entry failure");
        },
      }),
      /injected second-entry failure/,
    );
    assert.deepEqual(await readFile(fixture.first), fixture.firstBefore);
    assert.deepEqual(await readFile(fixture.second), fixture.secondBefore);
    assert.deepEqual(await transactionArtifacts(fixture.directory), []);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("owned replacement transaction rejects hard-linked and symbolic-link targets before publishing", async (t) => {
  await t.test("hard link", async () => {
    const fixture = await transactionFixture();
    try {
      await link(fixture.first, path.join(fixture.root, "hardlink-alias.json"));
      await assert.rejects(
        writeOwnedReplacementTransaction(fixture.root, fixture.entries),
        /must not be hard-linked/,
      );
      assert.deepEqual(await readFile(fixture.first), fixture.firstBefore);
      assert.deepEqual(await readFile(fixture.second), fixture.secondBefore);
      assert.deepEqual(await transactionArtifacts(fixture.directory), []);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });

  await t.test("symbolic link", async () => {
    const fixture = await transactionFixture();
    try {
      const realTarget = path.join(fixture.directory, "real-first.json");
      await writeFile(realTarget, fixture.firstBefore);
      await rm(fixture.first);
      await symlink(realTarget, fixture.first);
      await assert.rejects(
        writeOwnedReplacementTransaction(fixture.root, fixture.entries),
        /symbolic-link component is forbidden/,
      );
      assert.deepEqual(await readFile(realTarget), fixture.firstBefore);
      assert.deepEqual(await readFile(fixture.second), fixture.secondBefore);
      assert.deepEqual(await transactionArtifacts(fixture.directory), []);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("rollback preserves concurrent target bytes and retains the owned original backup", async () => {
  const fixture = await transactionFixture();
  try {
    await assert.rejects(
      writeOwnedReplacementTransaction(fixture.root, fixture.entries, {
        async afterCommitEntry(entry, index) {
          if (index !== 0) return;
          await writeFile(entry.filePath, "concurrent-writer\n");
          throw new Error("injected post-commit failure");
        },
      }),
      /Contact-sheet transaction rollback failed:[\s\S]*concurrent target bytes preserved/,
    );
    assert.equal(await readFile(fixture.first, "utf8"), "concurrent-writer\n");
    assert.deepEqual(await readFile(fixture.second), fixture.secondBefore);
    const artifacts = await transactionArtifacts(fixture.directory);
    assert.equal(artifacts.length, 1);
    assert.match(artifacts[0], /\.bak$/);
    assert.deepEqual(await readFile(path.join(fixture.directory, artifacts[0])), fixture.firstBefore);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});
