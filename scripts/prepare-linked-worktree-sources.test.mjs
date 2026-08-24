import assert from "node:assert/strict";
import {lstat, mkdtemp, mkdir, readlink, rm, symlink} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  ensureSourceAlias,
  parseArguments,
} from "./prepare-linked-worktree-sources.mjs";

const sourceRelative = path.join(
  "source-assets",
  "flash",
  "HELP MATH_ORIGINAL FILES",
);

test("parses only explicit check or write modes", () => {
  assert.deepEqual(parseArguments([]), {write: false});
  assert.deepEqual(parseArguments(["--check"]), {write: false});
  assert.deepEqual(parseArguments(["--write"]), {write: true});
  assert.throws(() => parseArguments(["--write", "extra"]), /Usage/u);
});

test("creates one exact shared-source alias and then checks it without mutation", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-worktree-source-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  const worktreeRoot = path.join(root, "worktree");
  const sharedCheckoutRoot = path.join(root, "shared");
  const sourcePath = path.join(sharedCheckoutRoot, sourceRelative);
  const aliasPath = path.join(worktreeRoot, sourceRelative);
  await mkdir(sourcePath, {recursive: true});

  await assert.rejects(
    ensureSourceAlias({worktreeRoot, sharedCheckoutRoot}),
    /alias is missing/u,
  );
  const created = await ensureSourceAlias({
    worktreeRoot,
    sharedCheckoutRoot,
    write: true,
  });
  assert.equal(created.changed, true);
  assert.equal((await lstat(aliasPath)).isSymbolicLink(), true);
  assert.equal(await readlink(aliasPath), sourcePath);

  const checked = await ensureSourceAlias({worktreeRoot, sharedCheckoutRoot});
  assert.equal(checked.changed, false);
  assert.equal(checked.mode, "shared-read-only-alias");
});

test("rejects an existing alias to a different source tree", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-worktree-source-wrong-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  const worktreeRoot = path.join(root, "worktree");
  const sharedCheckoutRoot = path.join(root, "shared");
  const sourcePath = path.join(sharedCheckoutRoot, sourceRelative);
  const wrongSourcePath = path.join(root, "wrong-source");
  const aliasPath = path.join(worktreeRoot, sourceRelative);
  await mkdir(sourcePath, {recursive: true});
  await mkdir(wrongSourcePath, {recursive: true});
  await mkdir(path.dirname(aliasPath), {recursive: true});
  await symlink(wrongSourcePath, aliasPath, "dir");

  await assert.rejects(
    ensureSourceAlias({worktreeRoot, sharedCheckoutRoot}),
    /expected/u,
  );
});
