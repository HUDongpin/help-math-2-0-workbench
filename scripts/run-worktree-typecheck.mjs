#!/usr/bin/env node

import {spawnSync} from "node:child_process";
import {existsSync, readFileSync, readdirSync} from "node:fs";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {activeContext} from "./register-worktree-shared-dependencies.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

function parseArguments(argv) {
  const options = {project: null, precheck: null};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument !== "--project" && argument !== "--precheck") {
      throw new Error(`Unknown argument: ${argument}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${argument} requires one repository-relative path`);
    }
    index += 1;
    if (argument === "--project") options.project = value;
    else options.precheck = value;
  }
  if (!options.project) throw new Error("--project is required");
  return options;
}

function dependencyRoot(context = activeContext) {
  return context.enabled
    ? context.sharedNodeModules
    : path.join(context.currentRoot, "node_modules");
}

function absolutePathMappings(paths, configDirectory) {
  return Object.fromEntries(Object.entries(paths ?? {}).map(([key, values]) => [
    key,
    values.map((value) => path.resolve(configDirectory, value)),
  ]));
}

function exportTargets(value) {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const orderedKeys = ["types", "import", "default", "node", "browser"];
  const values = [
    ...orderedKeys.filter((key) => value[key] !== undefined)
      .map((key) => value[key]),
    ...Object.entries(value)
      .filter(([key]) => !orderedKeys.includes(key))
      .map(([, target]) => target),
  ];
  return [...new Set(values.flatMap(exportTargets))];
}

function packageExportPathMappings(manifest, packageRoot) {
  const mappings = {};
  if (!manifest?.name || !manifest.exports) return mappings;
  const withDeclarations = (target) => {
    const resolved = path.resolve(packageRoot, target);
    const candidates = [];
    if (resolved.endsWith(".mjs")) {
      candidates.push(resolved.replace(/\.mjs$/u, ".d.mts"));
      candidates.push(resolved.replace(/\.mjs$/u, ".d.ts"));
    } else if (resolved.endsWith(".cjs")) {
      candidates.push(resolved.replace(/\.cjs$/u, ".d.cts"));
      candidates.push(resolved.replace(/\.cjs$/u, ".d.ts"));
    } else if (resolved.endsWith(".js")) {
      candidates.push(resolved.replace(/\.js$/u, ".d.ts"));
    }
    return [...candidates.filter(existsSync), resolved];
  };
  if (typeof manifest.exports === "string") {
    mappings[manifest.name] = [
      ...(manifest.types || manifest.typings
        ? [path.resolve(packageRoot, manifest.types ?? manifest.typings)]
        : []),
      ...withDeclarations(manifest.exports),
    ];
    return mappings;
  }
  if (typeof manifest.exports !== "object" || Array.isArray(manifest.exports)) {
    return mappings;
  }
  const entries = Object.keys(manifest.exports).some((key) => key.startsWith("."))
    ? Object.entries(manifest.exports)
    : [[".", manifest.exports]];
  for (const [subpath, value] of entries) {
    if (!subpath.startsWith(".")) continue;
    const key = subpath === "."
      ? manifest.name
      : `${manifest.name}${subpath.slice(1)}`;
    const targets = [
      ...(subpath === "." && (manifest.types || manifest.typings)
        ? [path.resolve(packageRoot, manifest.types ?? manifest.typings)]
        : []),
      ...exportTargets(value).flatMap(withDeclarations),
    ];
    if (targets.length) mappings[key] = [...new Set(targets)];
  }
  return mappings;
}

function installedPackageExportMappings(currentLock, nodeModules) {
  const mappings = {};
  for (const [lockKey, record] of Object.entries(currentLock.packages ?? {})) {
    if (record?.link || !/^node_modules\/(?:@[^/]+\/[^/]+|[^/]+)$/u.test(lockKey)) {
      continue;
    }
    const packageRoot = path.join(path.dirname(nodeModules), lockKey);
    const manifestPath = path.join(packageRoot, "package.json");
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    Object.assign(mappings, packageExportPathMappings(manifest, packageRoot));
  }
  return mappings;
}

function workspacePathMappings(context = activeContext) {
  const mappings = {};
  for (const [packageName, workspace] of context.localWorkspaces ?? []) {
    for (const [subpath, value] of Object.entries(
      workspace.manifest.exports ?? {},
    )) {
      const key = subpath === "."
        ? packageName
        : `${packageName}${subpath.slice(1)}`;
      const targets = exportTargets(value).map((target) =>
        path.resolve(workspace.workspaceRoot, target));
      if (targets.length) mappings[key] = targets;
    }
  }
  return mappings;
}

function runtimeNameForTypesPackage(typesPackage) {
  const name = typesPackage.slice("@types/".length);
  const separator = name.indexOf("__");
  return separator < 0
    ? name
    : `@${name.slice(0, separator)}/${name.slice(separator + 2)}`;
}

function installedTypePathMappings(rootPackage, nodeModules) {
  const mappings = {};
  const dependencies = {
    ...rootPackage.dependencies,
    ...rootPackage.devDependencies,
  };
  for (const typesPackage of Object.keys(dependencies)) {
    if (!typesPackage.startsWith("@types/")) continue;
    const runtimeName = runtimeNameForTypesPackage(typesPackage);
    const runtimeRoot = path.join(nodeModules, ...runtimeName.split("/"));
    const typesRoot = path.join(nodeModules, "@types",
      typesPackage.slice("@types/".length));
    mappings[runtimeName] = [path.join(typesRoot, "index.d.ts"), runtimeRoot];
    mappings[`${runtimeName}/*`] = [
      path.join(typesRoot, "*"),
      path.join(runtimeRoot, "*"),
    ];
    if (existsSync(typesRoot)) {
      const pending = [typesRoot];
      while (pending.length) {
        const directory = pending.pop();
        for (const entry of readdirSync(directory, {withFileTypes: true})) {
          const entryPath = path.join(directory, entry.name);
          if (entry.isDirectory()) {
            pending.push(entryPath);
            continue;
          }
          if (!entry.name.endsWith(".d.ts")) continue;
          const relative = path.relative(typesRoot, entryPath)
            .split(path.sep).join("/")
            .replace(/\.d\.ts$/u, "");
          if (relative === "index") continue;
          mappings[`${runtimeName}/${relative}`] = [entryPath];
        }
      }
    }
  }
  return mappings;
}

function buildOverrideConfig({
  projectPath,
  projectConfig,
  nodeModules,
  rootPackage = {},
  currentLock = {},
  context = activeContext,
}) {
  const configDirectory = path.dirname(projectPath);
  return {
    extends: projectPath,
    compilerOptions: {
      incremental: false,
      paths: {
        ...installedPackageExportMappings(currentLock, nodeModules),
        ...workspacePathMappings(context),
        ...installedTypePathMappings(rootPackage, nodeModules),
        ...absolutePathMappings(projectConfig.compilerOptions?.paths,
          configDirectory),
        "*": [path.join(nodeModules, "*")],
      },
      typeRoots: [path.join(nodeModules, "@types")],
    },
  };
}

function runNode(args, label, {env = process.env} = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: projectRoot,
    env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`);
  }
}

async function runTypecheck(options, context = activeContext) {
  const projectPath = path.resolve(projectRoot, options.project);
  const projectConfig = JSON.parse(await readFile(projectPath, "utf8"));
  const rootPackage = JSON.parse(await readFile(
    path.join(projectRoot, "package.json"),
    "utf8",
  ));
  const currentLock = JSON.parse(await readFile(
    path.join(projectRoot, "package-lock.json"),
    "utf8",
  ));
  const nodeModules = dependencyRoot(context);
  if (options.precheck) {
    runNode([path.resolve(projectRoot, options.precheck), "--check"],
      "Typecheck precheck");
  }

  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(),
    "help-math-worktree-typecheck-"));
  const overridePath = path.join(temporaryRoot, "tsconfig.json");
  try {
    const override = buildOverrideConfig({
      projectPath,
      projectConfig,
      nodeModules,
      rootPackage,
      currentLock,
      context,
    });
    await writeFile(overridePath, `${JSON.stringify(override, null, 2)}\n`, {
      flag: "wx",
    });
    runNode([
      path.join(nodeModules, "typescript", "bin", "tsc"),
      "--project",
      overridePath,
      "--noEmit",
    ], `TypeScript project ${options.project}`);
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  await runTypecheck(options);
  process.stdout.write(`PASS: ${options.project}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

export {
  absolutePathMappings,
  buildOverrideConfig,
  installedTypePathMappings,
  installedPackageExportMappings,
  packageExportPathMappings,
  parseArguments,
  runTypecheck,
  workspacePathMappings,
};
