import assert from "node:assert/strict";
import {execFile as execFileCallback, spawn} from "node:child_process";
import {once} from "node:events";
import {link, lstat, mkdir, mkdtemp, readFile, realpath, rename, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {promisify} from "node:util";

import {
  DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
  DARWIN_ATOMIC_DIRECTORY_SWAP_COMMIT_UNCERTAIN,
  DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE,
  DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_SOURCE_PATH,
  DARWIN_ATOMIC_DIRECTORY_SWAP_UNSUPPORTED,
  assertAtomicDirectorySwapSameDevice,
  assertDarwinAtomicDirectorySwapSupported,
  atomicSwapSiblingDirectoriesDarwin,
  atomicSwapSiblingRegularFilesDarwin,
  buildDarwinAtomicDirectorySwapNativeWitness,
  describeDarwinAtomicDirectorySwapBuildContract,
  nativeFailureCodeForObservedState,
} from "./lib/darwin-atomic-directory-swap.mjs";

const execFile = promisify(execFileCallback);

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

test("native failure classification treats every non-unchanged observation as commit-uncertain", () => {
  assert.equal(
    nativeFailureCodeForObservedState("unchanged"),
    DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE,
  );
  for (const state of ["swapped", "indeterminate", undefined]) {
    assert.equal(
      nativeFailureCodeForObservedState(state),
      DARWIN_ATOMIC_DIRECTORY_SWAP_COMMIT_UNCERTAIN,
    );
  }
});

test(
  "atomically exchanges two sibling directories and reports the parent fsync",
  {skip: process.platform !== "darwin"},
  async () => {
    const fixture = await temporaryFixture();
    try {
      const firstBefore = await lstat(fixture.firstDirectory, {bigint: true});
      const secondBefore = await lstat(fixture.secondDirectory, {bigint: true});
      const expectedFirstNode = {
        dev: String(firstBefore.dev),
        ino: String(firstBefore.ino),
      };
      const expectedSecondNode = {
        dev: String(secondBefore.dev),
        ino: String(secondBefore.ino),
      };
      const expectedNativeBuildContract =
        await describeDarwinAtomicDirectorySwapBuildContract();
      const expectedNativeBuildReceipt =
        await buildDarwinAtomicDirectorySwapNativeWitness({
          expectedNativeSourceSha256: expectedNativeBuildContract.source.sha256,
          expectedNativeBuildContract,
        });
      const result = await atomicSwapSiblingDirectoriesDarwin({
        ...fixture,
        expectedFirstNode,
        expectedSecondNode,
        expectedNativeBuildContract,
        expectedNativeBuildReceipt,
      });

      assert.equal(result.status, "swapped-and-parent-fsynced");
      assert.equal(result.native.status, "swapped");
      assert.equal(result.native.parentFsynced, true);
      assert.equal(result.nativeBuild.schemaVersion,
        "help-math-darwin-atomic-directory-swap-native-build/v1");
      assert.deepEqual(result.nativeBuild.source,
        expectedNativeBuildContract.source);
      assert.deepEqual(result.nativeBuild.compiler,
        expectedNativeBuildContract.compiler);
      assert.ok(result.nativeBuild.executable.bytes > 0);
      assert.match(result.nativeBuild.executable.sha256, /^[a-f0-9]{64}$/u);
      assert.deepEqual(result.nativeBuild, expectedNativeBuildReceipt);
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
      await assert.rejects(
        atomicSwapSiblingDirectoriesDarwin({
          ...fixture,
          expectedFirstNode,
          expectedSecondNode,
        }),
        (error) => error.code === DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
      );
      const reverse = await atomicSwapSiblingDirectoriesDarwin({
        ...fixture,
        expectedFirstNode: {dev: String(firstAfter.dev), ino: String(firstAfter.ino)},
        expectedSecondNode: {dev: String(secondAfter.dev), ino: String(secondAfter.ino)},
        expectedNativeBuildContract,
        expectedNativeBuildReceipt,
      });
      assert.deepEqual(reverse.nativeBuild, result.nativeBuild,
        "independent native builds must produce identical executable bytes");
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  },
);

test(
  "instrumented native final-window pathname replacement fails and classifies commit-uncertain",
  {skip: process.platform !== "darwin"},
  async () => {
    const root = await realpath(await mkdtemp(
      path.join(os.tmpdir(), "helpmath-swap-final-window-"),
    ));
    const parent = path.join(root, "allowed");
    const first = path.join(parent, "first");
    const second = path.join(parent, "second");
    const foreign = path.join(parent, "foreign");
    const retainedFirst = path.join(parent, "retained-first");
    const executable = path.join(root, "swap-native-test-sentinel");
    try {
      await mkdir(first, {recursive: true});
      await mkdir(second);
      await mkdir(foreign);
      await writeFile(path.join(first, "identity.txt"), "first\n");
      await writeFile(path.join(second, "identity.txt"), "second\n");
      await writeFile(path.join(foreign, "identity.txt"), "foreign\n");
      await execFile("/usr/bin/xcrun", [
        "--sdk", "macosx", "clang", "-std=c17", "-O2", "-Wall", "-Wextra",
        "-Werror", "-DHELP_MATH_SWAP_TEST_SENTINEL=1",
        DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_SOURCE_PATH,
        "-o", executable,
      ], {env: {LANG: "C", LC_ALL: "C", PATH: "/usr/bin:/bin"}});
      const [parentNode, firstNode, secondNode] = await Promise.all([
        lstat(parent, {bigint: true}),
        lstat(first, {bigint: true}),
        lstat(second, {bigint: true}),
      ]);
      const child = spawn(executable, [
        parent,
        "first",
        "second",
        String(parentNode.dev),
        String(parentNode.ino),
        String(firstNode.dev),
        String(firstNode.ino),
        String(secondNode.dev),
        String(secondNode.ino),
        "directory",
      ], {
        env: {LANG: "C", LC_ALL: "C", PATH: "/usr/bin:/bin"},
        stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"],
      });
      let stderr = "";
      child.stderr.setEncoding("utf8");
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      const timeout = setTimeout(() => child.kill("SIGKILL"), 10_000);
      try {
        const [ready] = await once(child.stdio[3], "data");
        assert.equal(Buffer.from(ready).toString("utf8"), "R");
        await rename(first, retainedFirst);
        await rename(foreign, first);
        child.stdio[4].end("G");
        const [code, signal] = await once(child, "close");
        assert.notEqual(code, 0);
        assert.equal(signal, null);
      } finally {
        clearTimeout(timeout);
      }
      assert.match(stderr, /required exchanged identities/u);
      assert.equal(await readFile(path.join(first, "identity.txt"), "utf8"), "second\n");
      assert.equal(await readFile(path.join(second, "identity.txt"), "utf8"), "foreign\n");
      assert.equal(await readFile(path.join(retainedFirst, "identity.txt"), "utf8"), "first\n");
      assert.equal(
        nativeFailureCodeForObservedState("indeterminate"),
        DARWIN_ATOMIC_DIRECTORY_SWAP_COMMIT_UNCERTAIN,
      );
    } finally {
      await rm(root, {recursive: true, force: true});
    }
  },
);

test(
  "prepared native executable witness is enforced before a directory mutation",
  {skip: process.platform !== "darwin"},
  async () => {
    const fixture = await temporaryFixture();
    try {
      const expectedNativeBuildContract =
        await describeDarwinAtomicDirectorySwapBuildContract();
      const exactWitness = await buildDarwinAtomicDirectorySwapNativeWitness({
        expectedNativeSourceSha256: expectedNativeBuildContract.source.sha256,
        expectedNativeBuildContract,
      });
      const forgedWitness = structuredClone(exactWitness);
      forgedWitness.executable.sha256 = "0".repeat(64);
      await assert.rejects(
        atomicSwapSiblingDirectoriesDarwin({
          ...fixture,
          expectedNativeSourceSha256: expectedNativeBuildContract.source.sha256,
          expectedNativeBuildContract,
          expectedNativeBuildReceipt: forgedWitness,
        }),
        (error) => error.code === DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE
          && /prepared executable witness/u.test(error.message),
      );
      assert.equal(
        await readFile(path.join(fixture.firstDirectory, "identity.txt"), "utf8"),
        "first\n",
      );
      assert.equal(
        await readFile(path.join(fixture.secondDirectory, "identity.txt"), "utf8"),
        "second\n",
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  },
);

test(
  "atomically exchanges two sibling single-link files with inode-bound preflight and post-verification",
  {skip: process.platform !== "darwin"},
  async () => {
    const root = await realpath(await mkdtemp(path.join(os.tmpdir(), "helpmath-file-swap-test-")));
    const firstFile = path.join(root, "first.txt");
    const secondFile = path.join(root, "second.txt");
    try {
      await writeFile(firstFile, "first\n");
      await writeFile(secondFile, "second\n");
      const firstBefore = await lstat(firstFile, {bigint: true});
      const secondBefore = await lstat(secondFile, {bigint: true});
      const expectedFirstNode = {dev: String(firstBefore.dev), ino: String(firstBefore.ino)};
      const expectedSecondNode = {dev: String(secondBefore.dev), ino: String(secondBefore.ino)};
      const result = await atomicSwapSiblingRegularFilesDarwin({
        allowedParent: root,
        firstFile,
        secondFile,
        expectedFirstNode,
        expectedSecondNode,
      });
      assert.equal(result.status, "swapped-and-parent-fsynced");
      assert.equal(result.native.parentFsynced, true);
      assert.equal(await readFile(firstFile, "utf8"), "second\n");
      assert.equal(await readFile(secondFile, "utf8"), "first\n");
      assert.deepEqual(result.after.first, expectedSecondNode);
      assert.deepEqual(result.after.second, expectedFirstNode);
      await assert.rejects(
        atomicSwapSiblingRegularFilesDarwin({
          allowedParent: root,
          firstFile,
          secondFile,
          expectedFirstNode,
          expectedSecondNode,
        }),
        (error) => error.code === DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
      );
      const firstContents = await readFile(firstFile, "utf8");
      const secondContents = await readFile(secondFile, "utf8");
      await assert.rejects(
        atomicSwapSiblingRegularFilesDarwin({
          allowedParent: root,
          firstFile,
          secondFile,
          expectedNativeSourceSha256: "0".repeat(64),
        }),
        (error) => error.code === DARWIN_ATOMIC_DIRECTORY_SWAP_NATIVE_FAILURE,
      );
      assert.equal(await readFile(firstFile, "utf8"), firstContents);
      assert.equal(await readFile(secondFile, "utf8"), secondContents);
    } finally {
      await rm(root, {recursive: true, force: true});
    }
  },
);

test(
  "regular-file exchange rejects hard-linked and symbolic-link targets before mutation",
  {skip: process.platform !== "darwin"},
  async () => {
    const root = await realpath(await mkdtemp(path.join(os.tmpdir(), "helpmath-file-swap-guard-")));
    const firstFile = path.join(root, "first.txt");
    const secondFile = path.join(root, "second.txt");
    try {
      await writeFile(firstFile, "first\n");
      await writeFile(secondFile, "second\n");
      await link(firstFile, path.join(root, "first-hardlink.txt"));
      await assert.rejects(
        atomicSwapSiblingRegularFilesDarwin({allowedParent: root, firstFile, secondFile}),
        (error) => error.code === DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
      );
      await rm(path.join(root, "first-hardlink.txt"));
      const alias = path.join(root, "alias.txt");
      await symlink(firstFile, alias);
      await assert.rejects(
        atomicSwapSiblingRegularFilesDarwin({
          allowedParent: root,
          firstFile: alias,
          secondFile,
        }),
        (error) => error.code === DARWIN_ATOMIC_DIRECTORY_SWAP_INVALID_SCOPE,
      );
      assert.equal(await readFile(firstFile, "utf8"), "first\n");
      assert.equal(await readFile(secondFile, "utf8"), "second\n");
    } finally {
      await rm(root, {recursive: true, force: true});
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
  assert.match(source, /regular-file/);
  assert.match(source, /st_nlink != 1/);
});
