import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {mkdtempSync, mkdirSync, rmSync, symlinkSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  activeContext,
  assertDependencyMetadataMatches,
  assertLockIdentityMatches,
  createSharedDependencyContext,
  packageLockKeyForResolvedPath,
  resolveLocalWorkspace,
} from "./register-worktree-shared-dependencies.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");

test("matches only dependency-bearing package metadata", () => {
  assert.doesNotThrow(() => assertDependencyMetadataMatches(
    {scripts: {test: "old"}, dependencies: {react: "1"}, engines: {node: ">=22"}},
    {scripts: {test: "new"}, dependencies: {react: "1"}, engines: {node: ">=22"}},
    "fixture",
  ));
  assert.throws(() => assertDependencyMetadataMatches(
    {dependencies: {react: "1"}},
    {dependencies: {react: "2"}},
    "fixture",
  ), /differs/u);
});

test("requires exact installed lock identity and refuses workspace links", () => {
  const record = {version: "1.2.3", integrity: "sha512-fixture", dev: true};
  assert.doesNotThrow(() => assertLockIdentityMatches(record, {...record}, "node_modules/fixture"));
  assert.throws(() => assertLockIdentityMatches(
    record,
    {...record, version: "1.2.4"},
    "node_modules/fixture",
  ), /does not match/u);
  assert.throws(() => assertLockIdentityMatches(
    {resolved: "packages/demos", link: true},
    {resolved: "packages/demos", link: true},
    "node_modules/@helpmath/demos",
  ), /workspace link/u);
});

test("refuses a repository node_modules symlink", (t) => {
  const root = mkdtempSync(path.join(os.tmpdir(), "help-math-node-modules-link-"));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  const currentRoot = path.join(root, "worktree");
  mkdirSync(currentRoot, {recursive: true});
  symlinkSync(path.join(root, "shared-node-modules"),
    path.join(currentRoot, "node_modules"), "dir");
  assert.throws(
    () => createSharedDependencyContext({currentRoot, sharedRoot: root}),
    /Refusing a node_modules symlink/u,
  );
});

test("derives scoped and nested package-lock keys", () => {
  const sharedNodeModules = path.join(path.sep, "shared", "node_modules");
  assert.equal(
    packageLockKeyForResolvedPath(
      path.join(sharedNodeModules, "@scope", "package", "dist", "index.js"),
      sharedNodeModules,
    ),
    "node_modules/@scope/package",
  );
  assert.equal(
    packageLockKeyForResolvedPath(
      path.join(sharedNodeModules, "outer", "node_modules", "inner", "index.js"),
      sharedNodeModules,
    ),
    "node_modules/outer/node_modules/inner",
  );
});

test("resolves workspace exports from the current worktree, never the shared checkout", () => {
  if (!activeContext.enabled) return;
  const resolution = resolveLocalWorkspace(
    "@helpmath/demos/animation-registry",
    activeContext,
  );
  assert.ok(resolution?.url.startsWith("file:"));
  assert.match(resolution.url, /codex\/worktrees\/e355/u);
  assert.doesNotMatch(resolution.url, /Volumes\/WestWorld/u);
  assert.throws(
    () => resolveLocalWorkspace("@helpmath/demos/not-exported", activeContext),
    /does not export/u,
  );
});

test("loads exact-lock tsx and pngjs from the shared installation in a clean child", () => {
  if (!activeContext.enabled) return;
  const bootstrap = path.join(scriptDirectory, "register-worktree-shared-dependencies.mjs");
  const output = execFileSync(process.execPath, [
    "--import",
    bootstrap,
    "--input-type=module",
    "--eval",
    "await import('tsx'); await import('pngjs'); console.log(process.env.HELP_MATH_SHARED_DEPENDENCIES_ACTIVE)",
  ], {
    cwd: projectRoot,
    encoding: "utf8",
    env: {...process.env, NODE_OPTIONS: ""},
  });
  assert.equal(output.trim(), "1");
});
