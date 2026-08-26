import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  buildOverrideConfig,
  packageExportPathMappings,
  parseArguments,
} from "./run-worktree-typecheck.mjs";

test("requires one project and permits one explicit precheck", () => {
  assert.deepEqual(parseArguments([
    "--project", "packages/demos/tsconfig.json",
    "--precheck", "packages/demos/scripts/generate-registry.mjs",
  ]), {
    project: "packages/demos/tsconfig.json",
    precheck: "packages/demos/scripts/generate-registry.mjs",
  });
  assert.throws(() => parseArguments([]), /--project is required/u);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown argument/u);
});

test("preserves project aliases as absolute paths and adds exact dependency fallback", () => {
  const projectPath = path.join(path.sep, "worktree", "apps", "web", "tsconfig.json");
  const nodeModules = path.join(path.sep, "shared", "node_modules");
  const override = buildOverrideConfig({
    projectPath,
    nodeModules,
    projectConfig: {
      compilerOptions: {
        paths: {"@/*": ["./*"]},
      },
    },
    rootPackage: {
      dependencies: {"@types/react": "1", react: "1"},
    },
    context: {localWorkspaces: new Map()},
    currentLock: {packages: {}},
  });
  assert.equal(override.extends, projectPath);
  assert.deepEqual(override.compilerOptions.paths, {
    react: [
      path.join(nodeModules, "@types", "react", "index.d.ts"),
      path.join(nodeModules, "react"),
    ],
    "react/*": [
      path.join(nodeModules, "@types", "react", "*"),
      path.join(nodeModules, "react", "*"),
    ],
    "@/*": [path.join(path.sep, "worktree", "apps", "web", "*")],
    "*": [path.join(nodeModules, "*")],
  });
  assert.deepEqual(override.compilerOptions.typeRoots, [
    path.join(nodeModules, "@types"),
  ]);
  assert.equal(override.compilerOptions.incremental, false);
});

test("maps explicit and wildcard package exports with type targets first", () => {
  const packageRoot = path.join(path.sep, "shared", "node_modules", "@scope", "package");
  assert.deepEqual(packageExportPathMappings({
    name: "@scope/package",
    exports: {
      ".": {types: "./index.d.ts", import: "./index.js"},
      "./feature": {types: "./feature.d.ts", default: "./feature.js"},
      "./*": {types: "./dist/*.d.ts", import: "./dist/*.js"},
    },
  }, packageRoot), {
    "@scope/package": [
      path.join(packageRoot, "index.d.ts"),
      path.join(packageRoot, "index.js"),
    ],
    "@scope/package/feature": [
      path.join(packageRoot, "feature.d.ts"),
      path.join(packageRoot, "feature.js"),
    ],
    "@scope/package/*": [
      path.join(packageRoot, "dist", "*.d.ts"),
      path.join(packageRoot, "dist", "*.js"),
    ],
  });
});
