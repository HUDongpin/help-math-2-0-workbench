#!/usr/bin/env node

import {execFile} from "node:child_process";
import {lstat, mkdir, readlink, realpath, symlink} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const generatedInputRelative = path.join(
  "work",
  "g5-l5-ffdec-canvas-pcode-factory",
  "full-v2",
);

async function pathKind(target) {
  try {
    const info = await lstat(target);
    if (info.isSymbolicLink()) return "symlink";
    if (info.isDirectory()) return "directory";
    if (info.isFile()) return "file";
    return "other";
  } catch (error) {
    if (error.code === "ENOENT") return "missing";
    throw error;
  }
}

async function inferSharedCheckoutRoot(root = projectRoot) {
  const {stdout} = await execFileAsync(
    "git",
    ["rev-parse", "--path-format=absolute", "--git-common-dir"],
    {cwd: root, encoding: "utf8"},
  );
  const commonDirectory = stdout.trim();
  if (!commonDirectory) throw new Error("Git returned an empty common directory");
  return path.dirname(commonDirectory);
}

async function ensureGeneratedInputAlias({
  worktreeRoot = projectRoot,
  sharedCheckoutRoot,
  write = false,
} = {}) {
  const resolvedWorktreeRoot = path.resolve(worktreeRoot);
  const resolvedSharedRoot = path.resolve(
    sharedCheckoutRoot ?? await inferSharedCheckoutRoot(resolvedWorktreeRoot),
  );
  const aliasPath = path.join(resolvedWorktreeRoot, generatedInputRelative);
  const sourcePath = path.join(resolvedSharedRoot, generatedInputRelative);
  const aliasKind = await pathKind(aliasPath);

  if (aliasKind === "directory") {
    return {mode: "local-generated-input-directory", aliasPath, sourcePath: aliasPath, changed: false};
  }
  if (aliasKind === "symlink") {
    const [actualTarget, expectedTarget] = await Promise.all([
      realpath(aliasPath),
      realpath(sourcePath),
    ]);
    if (actualTarget !== expectedTarget) {
      const linkText = await readlink(aliasPath);
      throw new Error(
        `Existing generated-input alias targets ${linkText}; expected ${sourcePath}`,
      );
    }
    return {mode: "shared-generated-input-alias", aliasPath, sourcePath, changed: false};
  }
  if (aliasKind !== "missing") {
    throw new Error(
      `Generated-input alias path must be missing, a directory, or a symlink, not ${aliasKind}: ${aliasPath}`,
    );
  }

  const sourceKind = await pathKind(sourcePath);
  if (sourceKind !== "directory") {
    throw new Error(`Shared generated input must be a real directory, not ${sourceKind}: ${sourcePath}`);
  }
  if (!write) {
    throw new Error(
      `Linked worktree generated-input alias is missing: ${aliasPath}. Run with --write after reviewing ${sourcePath}`,
    );
  }

  await mkdir(path.dirname(aliasPath), {recursive: true});
  await symlink(sourcePath, aliasPath, "dir");
  return {mode: "shared-generated-input-alias", aliasPath, sourcePath, changed: true};
}

function parseArguments(argv) {
  if (argv.length === 0 || (argv.length === 1 && argv[0] === "--check")) {
    return {write: false};
  }
  if (argv.length === 1 && argv[0] === "--write") return {write: true};
  throw new Error(
    "Usage: node scripts/prepare-linked-worktree-generated-inputs.mjs [--check|--write]",
  );
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  console.log(JSON.stringify(await ensureGeneratedInputAlias(options), null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

export {
  ensureGeneratedInputAlias,
  inferSharedCheckoutRoot,
  parseArguments,
};
