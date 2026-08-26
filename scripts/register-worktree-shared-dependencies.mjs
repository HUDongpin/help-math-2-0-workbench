#!/usr/bin/env node

import {execFileSync} from "node:child_process";
import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";
import {registerHooks} from "node:module";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const bootstrapUrl = pathToFileURL(scriptPath).href;
const DEPENDENCY_FIELDS = Object.freeze([
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
  "engines",
  "workspaces",
]);
const LOCK_IDENTITY_FIELDS = Object.freeze([
  "version",
  "resolved",
  "integrity",
  "link",
]);

function readJson(filePath, label = filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read ${label}: ${error.message}`);
  }
}

function selectedFields(value, fields) {
  return Object.fromEntries(fields
    .filter((field) => value?.[field] !== undefined)
    .map((field) => [field, value[field]]));
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function assertDependencyMetadataMatches(currentValue, sharedValue, label) {
  const current = selectedFields(currentValue, DEPENDENCY_FIELDS);
  const shared = selectedFields(sharedValue, DEPENDENCY_FIELDS);
  if (stable(current) !== stable(shared)) {
    throw new Error(`${label} dependency metadata differs between the worktree and shared installation`);
  }
}

function inferSharedCheckoutRoot(root = projectRoot) {
  const commonDirectory = execFileSync(
    "git",
    ["rev-parse", "--path-format=absolute", "--git-common-dir"],
    {cwd: root, encoding: "utf8"},
  ).trim();
  if (!commonDirectory) throw new Error("Git returned an empty common directory");
  return path.dirname(commonDirectory);
}

function packageLockKeyForResolvedPath(resolvedPath, sharedNodeModules) {
  const relative = path.relative(path.dirname(sharedNodeModules), resolvedPath);
  if (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return null;
  const segments = relative.split(path.sep);
  let nodeModulesIndex = -1;
  for (let index = 0; index < segments.length; index += 1) {
    if (segments[index] === "node_modules") nodeModulesIndex = index;
  }
  if (nodeModulesIndex < 0 || nodeModulesIndex + 1 >= segments.length) return null;
  const packageNameIndex = nodeModulesIndex + 1;
  const packageEnd = segments[packageNameIndex].startsWith("@")
    ? packageNameIndex + 2
    : packageNameIndex + 1;
  if (packageEnd > segments.length) return null;
  return segments.slice(0, packageEnd).join("/");
}

function assertLockIdentityMatches(currentRecord, sharedRecord, key) {
  if (!currentRecord || !sharedRecord) {
    throw new Error(`Shared dependency ${key} is missing from one of the lockfiles`);
  }
  if (currentRecord.link || sharedRecord.link) {
    throw new Error(`Refusing to resolve workspace link ${key} from another checkout`);
  }
  const current = selectedFields(currentRecord, LOCK_IDENTITY_FIELDS);
  const shared = selectedFields(sharedRecord, LOCK_IDENTITY_FIELDS);
  if (stable(current) !== stable(shared)) {
    throw new Error(`Shared dependency ${key} does not match the current package lock`);
  }
}

function exportTarget(value) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value.import ?? value.default ?? Object.values(value)
    .find((candidate) => typeof candidate === "string") ?? null;
}

function buildLocalWorkspaceMap(currentRoot, currentLock) {
  const workspaces = new Map();
  for (const [workspacePath, record] of Object.entries(currentLock.packages ?? {})) {
    if (!workspacePath || workspacePath.startsWith("node_modules/") || !record?.name) continue;
    const workspaceRoot = path.join(currentRoot, workspacePath);
    const packagePath = path.join(workspaceRoot, "package.json");
    if (!existsSync(packagePath)) continue;
    const manifest = readJson(packagePath, `${workspacePath}/package.json`);
    if (manifest.name !== record.name) {
      throw new Error(`Workspace ${workspacePath} name differs between package.json and package lock`);
    }
    workspaces.set(manifest.name, Object.freeze({workspaceRoot, manifest}));
  }
  return workspaces;
}

function resolveLocalWorkspace(specifier, context) {
  for (const [packageName, workspace] of context.localWorkspaces) {
    if (specifier !== packageName && !specifier.startsWith(`${packageName}/`)) continue;
    const subpath = specifier === packageName
      ? "."
      : `.${specifier.slice(packageName.length)}`;
    const target = exportTarget(workspace.manifest.exports?.[subpath]);
    if (!target) throw new Error(`Workspace ${packageName} does not export ${subpath}`);
    const targetPath = path.resolve(workspace.workspaceRoot, target);
    const relative = path.relative(workspace.workspaceRoot, targetPath);
    if (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative) || !existsSync(targetPath)) {
      throw new Error(`Workspace export ${specifier} is missing or escapes its package: ${target}`);
    }
    return {url: pathToFileURL(targetPath).href, shortCircuit: true};
  }
  return null;
}

function appendBootstrapToNodeOptions() {
  const option = `--import=${bootstrapUrl}`;
  const current = process.env.NODE_OPTIONS?.trim() ?? "";
  if (!current.split(/\s+/u).includes(option)) {
    process.env.NODE_OPTIONS = [current, option].filter(Boolean).join(" ");
  }
}

function createSharedDependencyContext({
  currentRoot = projectRoot,
  sharedRoot = process.env.HELP_MATH_SHARED_DEPENDENCY_ROOT
    || inferSharedCheckoutRoot(currentRoot),
} = {}) {
  const resolvedCurrentRoot = realpathSync(currentRoot);
  const localNodeModules = path.join(resolvedCurrentRoot, "node_modules");
  const localNodeModulesInfo = lstatSync(localNodeModules, {throwIfNoEntry: false});
  if (localNodeModulesInfo) {
    if (localNodeModulesInfo.isSymbolicLink()) {
      throw new Error(`Refusing a node_modules symlink: ${localNodeModules}`);
    }
    if (!localNodeModulesInfo.isDirectory()) {
      throw new Error(`Local node_modules must be a real directory: ${localNodeModules}`);
    }
    return Object.freeze({enabled: false, mode: "local-node-modules", currentRoot: resolvedCurrentRoot});
  }

  const resolvedSharedRoot = realpathSync(sharedRoot);
  const sharedNodeModules = path.join(resolvedSharedRoot, "node_modules");
  if (resolvedCurrentRoot === resolvedSharedRoot || !existsSync(sharedNodeModules)
      || !statSync(sharedNodeModules).isDirectory()) {
    throw new Error(`No compatible shared node_modules directory is available at ${sharedNodeModules}`);
  }

  const currentPackage = readJson(path.join(resolvedCurrentRoot, "package.json"), "worktree package.json");
  const sharedPackage = readJson(path.join(resolvedSharedRoot, "package.json"), "shared package.json");
  assertDependencyMetadataMatches(currentPackage, sharedPackage, "Root package");

  const currentLock = readJson(path.join(resolvedCurrentRoot, "package-lock.json"), "worktree package-lock.json");
  const sharedLock = readJson(
    path.join(sharedNodeModules, ".package-lock.json"),
    "shared installed package lock",
  );
  for (const workspaceKey of ["apps/web", "packages/demos"]) {
    assertDependencyMetadataMatches(
      currentLock.packages?.[workspaceKey],
      sharedLock.packages?.[workspaceKey],
      `Workspace ${workspaceKey}`,
    );
  }

  return Object.freeze({
    enabled: true,
    mode: "shared-lock-matched-node-modules",
    currentRoot: resolvedCurrentRoot,
    sharedRoot: resolvedSharedRoot,
    sharedNodeModules,
    currentLock,
    sharedLock,
    localWorkspaces: buildLocalWorkspaceMap(resolvedCurrentRoot, currentLock),
    anchorUrl: pathToFileURL(path.join(resolvedSharedRoot, "package.json")).href,
  });
}

function createResolveHook(context) {
  return function resolve(specifier, resolveContext, nextResolve) {
    const isBare = !specifier.startsWith(".")
      && !specifier.startsWith("/")
      && !specifier.startsWith("#")
      && !/^[a-z][a-z+.-]*:/iu.test(specifier);
    if (!isBare) return nextResolve(specifier, resolveContext);

    const workspaceResolution = resolveLocalWorkspace(specifier, context);
    if (workspaceResolution) return workspaceResolution;

    let result;
    try {
      result = nextResolve(specifier, resolveContext);
    } catch (error) {
      if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
      result = nextResolve(specifier, {
        ...resolveContext,
        parentURL: context.anchorUrl,
      });
    }
    if (result?.url?.startsWith("node:")) return result;
    if (!result?.url?.startsWith("file:")) {
      throw new Error(`Shared dependency ${specifier} did not resolve to a local file URL`);
    }
    const resolvedPath = fileURLToPath(result.url);
    const key = packageLockKeyForResolvedPath(resolvedPath, context.sharedNodeModules);
    if (key) {
      assertLockIdentityMatches(
        context.currentLock.packages?.[key],
        context.sharedLock.packages?.[key],
        key,
      );
      return result;
    }

    const relativeToCurrent = path.relative(context.currentRoot, resolvedPath);
    if (!relativeToCurrent.startsWith(`..${path.sep}`)
        && !path.isAbsolute(relativeToCurrent)) {
      return result;
    }
    throw new Error(
      `Refusing dependency ${specifier} outside the current worktree and shared node_modules: ${resolvedPath}`,
    );
  };
}

function registerSharedDependencies(options) {
  const context = createSharedDependencyContext(options);
  if (!context.enabled) return context;
  registerHooks({resolve: createResolveHook(context)});
  appendBootstrapToNodeOptions();
  process.env.HELP_MATH_SHARED_DEPENDENCIES_ACTIVE = "1";
  return context;
}

const activeContext = registerSharedDependencies();

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  console.log(JSON.stringify({
    enabled: activeContext.enabled,
    mode: activeContext.mode,
    currentRoot: activeContext.currentRoot,
    sharedRoot: activeContext.sharedRoot ?? null,
    sharedNodeModules: activeContext.sharedNodeModules ?? null,
  }, null, 2));
}

export {
  activeContext,
  assertDependencyMetadataMatches,
  assertLockIdentityMatches,
  createResolveHook,
  createSharedDependencyContext,
  packageLockKeyForResolvedPath,
  registerSharedDependencies,
  resolveLocalWorkspace,
};
