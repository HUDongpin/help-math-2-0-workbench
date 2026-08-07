import assert from "node:assert/strict";
import {lstat, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
  DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_SOURCE_PATH,
  DARWIN_ATOMIC_DIRECTORY_SWAP_UNSUPPORTED,
  assertAtomicDirectorySwapSameDevice,
  assertDarwinAtomicDirectorySwapSupported,
  atomicSwapSiblingDirectoriesDarwin,
} from "./lib/darwin-atomic-directory-swap.mjs";

async function temporaryFixture() {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), "helpmath-swap-test-")));
  const allowedParent = path.join(root, "allowed");
  const firstDirectory = path.join(allowedParent, "first");
  const secondDirectory = path.join(allowedParent, "second");
  await mkdir(firstDirectory, {recursive: true});
  await mkdir(secondDirectory);
  await writeFile(path.join(firstDirectory, "identity.txt"), "first\n");
  await writeFile(path.join(secondDirectory, "identity.txt"), "second\n");
  return {root, allowedParent, firstDirectory, secondDirectory};
}

test("platform and device guards fail closed", () => {
  assert.throws(
    () => assertDarwinAtomicDirectorySwapSupported("linux"),
    (error) => error.code === DARWIN_ATOMIC_DIRECTORY_SWAP_UNSUPPORTED,
  );
  assert.equal(assertDarwinAtomicDirectorySwapSupported("darwin"), true);
  assert.equal(assertAtomicDirectorySwapSameDevice({
    parent: {dev: "7"},
    first: {dev: "7"},
    second: {dev: "7"},
  }), true);
  assert.throws(
    () => assertAtomicDirectorySwapSameDevice({
      parent: {dev: "7"},
      first: {dev: "8"},
      second: {dev: "7"},
    }),
    (error) => error.code === DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
  );
});

test(
  "atomically exchanges two sibling directories and reports the parent fsync",
  {skip: process.platform !== "darwin"},
  async () => {
    const fixture = await temporaryFixture();
    try {
      const firstBefore = await lstat(fixture.firstDirectory, {bigint: true});
      const secondBefore = await lstat(fixture.secondDirectory, {bigint: true});
      const result = await atomicSwapSiblingDirectoriesDarwin(fixture);

      assert.equal(result.status, "swapped-and-parent-fsynced");
      assert.equal(result.native.status, "swapped");
      assert.equal(result.native.parentFsynced, true);
      assert.equal(result.cleanupWarning, null);
      assert.equal(
        await readFile(path.join(fixture.firstDirectory, "identity.txt"), "utf8"),
        "second\n",
      );
      assert.equal(
        await readFile(path.join(fixture.secondDirectory, "identity.txt"), "utf8"),
        "first\n",
      );

      const firstAfter = await lstat(fixture.firstDirectory, {bigint: true});
      const secondAfter = await lstat(fixture.secondDirectory, {bigint: true});
      assert.equal(firstAfter.dev, secondBefore.dev);
      assert.equal(firstAfter.ino, secondBefore.ino);
      assert.equal(secondAfter.dev, firstBefore.dev);
      assert.equal(secondAfter.ino, firstBefore.ino);
      assert.deepEqual(result.after.first, result.before.second);
      assert.deepEqual(result.after.second, result.before.first);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  },
);

test(
  "rejects symlinks, non-siblings, duplicate targets, and a symlink parent before mutation",
  {skip: process.platform !== "darwin"},
  async (t) => {
    await t.test("final symlink", async () => {
      const fixture = await temporaryFixture();
      try {
        const alias = path.join(fixture.allowedParent, "alias");
        await symlink(fixture.firstDirectory, alias);
        await assert.rejects(
          atomicSwapSiblingDirectoriesDarwin({
            allowedParent: fixture.allowedParent,
            firstDirectory: alias,
            secondDirectory: fixture.secondDirectory,
          }),
          (error) => error.code === DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
        );
        assert.equal(
          await readFile(path.join(fixture.firstDirectory, "identity.txt"), "utf8"),
          "first\n",
        );
      } finally {
        await rm(fixture.root, {recursive: true, force: true});
      }
    });

    await t.test("non-sibling", async () => {
      const fixture = await temporaryFixture();
      try {
        const nested = path.join(fixture.allowedParent, "nested", "child");
        await mkdir(nested, {recursive: true});
        await assert.rejects(
          atomicSwapSiblingDirectoriesDarwin({
            allowedParent: fixture.allowedParent,
            firstDirectory: nested,
            secondDirectory: fixture.secondDirectory,
          }),
          (error) => error.code === DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
        );
      } finally {
        await rm(fixture.root, {recursive: true, force: true});
      }
    });

    await t.test("duplicate target", async () => {
      const fixture = await temporaryFixture();
      try {
        await assert.rejects(
          atomicSwapSiblingDirectoriesDarwin({
            allowedParent: fixture.allowedParent,
            firstDirectory: fixture.firstDirectory,
            secondDirectory: fixture.firstDirectory,
          }),
          (error) => error.code === DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
        );
      } finally {
        await rm(fixture.root, {recursive: true, force: true});
      }
    });

    await t.test("symlink allowed parent", async () => {
      const fixture = await temporaryFixture();
      try {
        const parentAlias = path.join(fixture.root, "allowed-alias");
        await symlink(fixture.allowedParent, parentAlias);
        await assert.rejects(
          atomicSwapSiblingDirectoriesDarwin({
            allowedParent: parentAlias,
            firstDirectory: path.join(parentAlias, "first"),
            secondDirectory: path.join(parentAlias, "second"),
          }),
          (error) => error.code === DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
        );
      } finally {
        await rm(fixture.root, {recursive: true, force: true});
      }
    });
  },
);

test("native helper contract names renameatx_np swap and parent durability", async () => {
  const source = await readFile(DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_SOURCE_PATH, "utf8");
  assert.match(source, /renameatx_np\([\s\S]*RENAME_SWAP/);
  assert.match(source, /RENAME_NOFOLLOW_ANY/);
  assert.match(source, /RENAME_RESOLVE_BENEATH/);
  assert.match(source, /fsync\(parent_fd\)/);
  assert.match(source, /parent_stat\.st_dev != first_stat\.st_dev/);
  assert.match(source, /parent_stat\.st_dev != second_stat\.st_dev/);
});
