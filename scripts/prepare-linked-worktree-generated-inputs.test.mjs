import assert from "node:assert/strict";
import {lstat, mkdtemp, mkdir, readlink, rm, symlink} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  ensureGeneratedInputAlias,
  parseArguments,
} from "./prepare-linked-worktree-generated-inputs.mjs";

const generatedInputRelative = path.join(
  "work",
  "g5-l5-ffdec-canvas-pcode-factory",
  "full-v2",
);

test("parses only explicit generated-input check or write modes", () => {
  assert.deepEqual(parseArguments([]), {write: false});
  assert.deepEqual(parseArguments(["--check"]), {write: false});
  assert.deepEqual(parseArguments(["--write"]), {write: true});
  assert.throws(() => parseArguments(["--write", "extra"]), /Usage/u);
});

test("creates one exact shared generated-input alias and checks it", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-generated-input-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  const worktreeRoot = path.join(root, "worktree");
  const sharedCheckoutRoot = path.join(root, "shared");
  const sourcePath = path.join(sharedCheckoutRoot, generatedInputRelative);
  const aliasPath = path.join(worktreeRoot, generatedInputRelative);
  await mkdir(sourcePath, {recursive: true});

  await assert.rejects(
    ensureGeneratedInputAlias({worktreeRoot, sharedCheckoutRoot}),
    /alias is missing/u,
  );
  const created = await ensureGeneratedInputAlias({
    worktreeRoot,
    sharedCheckoutRoot,
    write: true,
  });
  assert.equal(created.changed, true);
  assert.equal((await lstat(aliasPath)).isSymbolicLink(), true);
  assert.equal(await readlink(aliasPath), sourcePath);

  const checked = await ensureGeneratedInputAlias({
    worktreeRoot,
    sharedCheckoutRoot,
  });
  assert.equal(checked.changed, false);
  assert.equal(checked.mode, "shared-generated-input-alias");
});

test("rejects a generated-input alias to a different directory", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-generated-input-wrong-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  const worktreeRoot = path.join(root, "worktree");
  const sharedCheckoutRoot = path.join(root, "shared");
  const sourcePath = path.join(sharedCheckoutRoot, generatedInputRelative);
  const wrongSourcePath = path.join(root, "wrong-source");
  const aliasPath = path.join(worktreeRoot, generatedInputRelative);
  await mkdir(sourcePath, {recursive: true});
  await mkdir(wrongSourcePath, {recursive: true});
  await mkdir(path.dirname(aliasPath), {recursive: true});
  await symlink(wrongSourcePath, aliasPath, "dir");

  await assert.rejects(
    ensureGeneratedInputAlias({worktreeRoot, sharedCheckoutRoot}),
    /expected/u,
  );
});
