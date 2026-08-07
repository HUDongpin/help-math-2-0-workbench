import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {access, lstat, readFile, readdir, realpath, stat} from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

export const IMPLEMENTATION_ARTIFACT_CLOSURE_SCHEMA_VERSION = 1;
export const IMPLEMENTATION_ARTIFACT_CLOSURE_ALGORITHM = "sha256-canonical-artifact-and-projection-rows-v2";
export const IMPLEMENTATION_CAPTURE_SCHEMA_VERSION = 4;
export const IMPLEMENTATION_CAPTURE_GENERATOR_PROVENANCE_SCHEMA_VERSION = 1;
export const IMPLEMENTATION_CAPTURE_SCRIPT_PATH = "scripts/capture-animation-keyframes.mjs";

export const IMPLEMENTATION_SHARED_RUNTIME_FILES = Object.freeze([
  "package-lock.json",
  "apps/web/next.config.ts",
  "apps/web/postcss.config.mjs",
  "apps/web/proxy.ts",
  "apps/web/tsconfig.json",
  "apps/web/app/[locale]/layout.tsx",
  "apps/web/app/[locale]/animations/[animationId]/page.tsx",
  "apps/web/app/flash-assets/[...asset]/route.ts",
  "apps/web/components/animation-runtime.tsx",
  "apps/web/components/demo-player.tsx",
  "packages/demos/src/animation-registry.ts",
  "packages/demos/src/contract.ts",
  "packages/demos/tsconfig.json",
]);

const PACKAGE_JSON_RUNTIME_PROJECTIONS = Object.freeze([
  Object.freeze({path: "package.json", scripts: Object.freeze(["dev", "build", "start"])}),
  Object.freeze({path: "apps/web/package.json", scripts: Object.freeze(["dev", "build", "start"])}),
  Object.freeze({path: "packages/demos/package.json", scripts: Object.freeze(["dev", "build", "start"])}),
]);
const PACKAGE_JSON_RUNTIME_FIELDS = Object.freeze([
  "name",
  "version",
  "private",
  "type",
  "packageManager",
  "engines",
  "workspaces",
  "main",
  "module",
  "browser",
  "exports",
  "imports",
  "types",
  "typesVersions",
  "sideEffects",
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "peerDependenciesMeta",
  "optionalDependencies",
  "bundledDependencies",
  "overrides",
  "resolutions",
]);

const RENDERER_OUTPUT_ROOT = "public/flash-assets/";
const PROJECTION_MANAGED_GLOBAL_FILES = new Set([
  "catalog/animations.json",
  "packages/demos/prototype-registry.json",
  "packages/demos/src/prototype-manifest.ts",
  "packages/demos/src/registry.generated.ts",
]);
const REGISTRY_GENERATED_PATH = "packages/demos/src/registry.generated.ts";
const PROTOTYPE_MANIFEST_PATH = "packages/demos/src/prototype-manifest.ts";
const PROTOTYPE_REGISTRY_PATH = "packages/demos/prototype-registry.json";
const ANIMATION_CATALOG_PATH = "catalog/animations.json";
const LOCAL_MODULE_EXTENSIONS = Object.freeze([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css"]);
const PARSED_MODULE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const INVENTORY_JSON_KEYS = Object.freeze([
  "candidateQa",
  "keyframeCsv",
  "behaviorQaFile",
  "productQaFile",
  "productAudioQaFile",
  "formulaEngineeringBehaviorQaFile",
  "formulaEngineeringProductQaFile",
  "candidateProductQa",
  "contactSheetManifest",
  "spanishContactSheetManifest",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function normalizeProjectPath(value) {
  return portable(String(value || "")).replace(/^\.\//, "");
}

function isInside(root, target) {
  const relative = path.relative(root, target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function projectRelative(projectRoot, filePath) {
  const relative = path.relative(projectRoot, filePath);
  invariant(relative && !relative.startsWith("..") && !path.isAbsolute(relative), `Implementation artifact escapes the project root: ${filePath}`);
  return portable(relative);
}

function isForbiddenArtifactPath(relativePath) {
  const normalized = normalizeProjectPath(relativePath);
  if (normalized === "source-assets" || normalized.startsWith("source-assets/")) return true;
  if (normalized === "catalog/completion-ledger.json") return true;
  if (/^reports\/.*(?:approval|acceptance|review|strict)/i.test(normalized)) return true;
  if (/^migrations\/[^/]+\/evidence\/.*(?:approval|acceptance|human-review|owner-review|audio-listening)/i.test(normalized)) return true;
  if (/\/capture-manifest\.json$/i.test(normalized)) return true;
  if (/current-javascript-implementation-capture-adoption\.json$/i.test(normalized)) return true;
  return false;
}

async function assertRealFileWithinProject(projectRoot, filePath, label) {
  const lexical = path.resolve(filePath);
  const relativePath = projectRelative(projectRoot, lexical);
  invariant(!isForbiddenArtifactPath(relativePath), `${label} is excluded from the implementation artifact closure: ${relativePath}`);
  let componentPath = path.resolve(projectRoot);
  for (const component of relativePath.split("/")) {
    componentPath = path.join(componentPath, component);
    const componentMetadata = await lstat(componentPath);
    invariant(!componentMetadata.isSymbolicLink(), `${label} path contains a symbolic-link component: ${portable(path.relative(projectRoot, componentPath))}`);
  }
  const lexicalMetadata = await lstat(lexical);
  invariant(!lexicalMetadata.isSymbolicLink(), `${label} must not be a symbolic link: ${relativePath}`);
  const [realProjectRoot, realFilePath] = await Promise.all([realpath(projectRoot), realpath(lexical)]);
  invariant(isInside(realProjectRoot, realFilePath), `${label} resolves outside the project root: ${relativePath}`);
  const metadata = await stat(realFilePath);
  invariant(metadata.isFile(), `${label} is not a file: ${relativePath}`);
  return {absolutePath: lexical, relativePath, metadata};
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

function canonicalRows(rows) {
  return [...rows]
    .map(({path: artifactPath, bytes, sha256}) => ({
      path: normalizeProjectPath(artifactPath),
      bytes,
      sha256,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function canonicalJson(value) {
  return `${JSON.stringify(stable(value))}\n`;
}

export function implementationArtifactRowsSha256(artifacts, projections = []) {
  return createHash("sha256").update(canonicalJson({
    artifacts: canonicalRows(artifacts),
    projections: canonicalRows(projections),
  })).digest("hex");
}

function projectionRow(relativePath, selection, payload) {
  const bytes = Buffer.from(canonicalJson(payload));
  return {
    path: `${normalizeProjectPath(relativePath)}#selected=${encodeURIComponent(selection)}`,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

function transpileProjectionSource(filePath, sourceText) {
  const result = ts.transpileModule(sourceText, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      removeComments: true,
      newLine: ts.NewLineKind.LineFeed,
    },
    fileName: filePath,
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics || []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  invariant(!errors.length, `${filePath}: cannot transpile projection-managed source (${errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")).join("; ")})`);
  return result.outputText;
}

function unwrapExpression(node) {
  let current = node;
  while (
    ts.isParenthesizedExpression(current)
    || ts.isAsExpression(current)
    || ts.isTypeAssertionExpression(current)
    || ts.isSatisfiesExpression?.(current)
  ) current = current.expression;
  while (
    ts.isCallExpression(current)
    && current.arguments.length === 1
    && ts.isPropertyAccessExpression(current.expression)
    && ts.isIdentifier(current.expression.expression)
    && current.expression.expression.text === "Object"
    && current.expression.name.text === "freeze"
  ) {
    current = current.arguments[0];
    while (
      ts.isParenthesizedExpression(current)
      || ts.isAsExpression(current)
      || ts.isTypeAssertionExpression(current)
      || ts.isSatisfiesExpression?.(current)
    ) current = current.expression;
  }
  return current;
}

function findVariableInitializer(sourceFile, variableName) {
  const matches = [];
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === variableName && node.initializer) {
      matches.push(node.initializer);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  invariant(matches.length === 1, `${sourceFile.fileName}: expected exactly one ${variableName} initializer, found ${matches.length}`);
  return matches[0];
}

function propertyNameText(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name) || ts.isNumericLiteral(name)) return name.text;
  if (ts.isComputedPropertyName(name) && ts.isStringLiteralLike(name.expression)) return name.expression.text;
  return null;
}

function objectProperty(objectLiteral, propertyName) {
  const matches = objectLiteral.properties.filter((property) => (
    (ts.isPropertyAssignment(property) || ts.isMethodDeclaration(property))
    && propertyNameText(property.name) === propertyName
  ));
  invariant(matches.length === 1, `${objectLiteral.getSourceFile().fileName}: expected exactly one ${propertyName} property, found ${matches.length}`);
  return matches[0];
}

function propertyStringValue(objectLiteral, propertyName) {
  const property = objectProperty(objectLiteral, propertyName);
  invariant(ts.isPropertyAssignment(property), `${objectLiteral.getSourceFile().fileName}: ${propertyName} must be a property assignment`);
  const value = unwrapExpression(property.initializer);
  invariant(ts.isStringLiteralLike(value), `${objectLiteral.getSourceFile().fileName}: ${propertyName} must be a string literal`);
  return value.text;
}

function propertyStringArray(objectLiteral, propertyName) {
  const property = objectProperty(objectLiteral, propertyName);
  invariant(ts.isPropertyAssignment(property), `${objectLiteral.getSourceFile().fileName}: ${propertyName} must be a property assignment`);
  const value = unwrapExpression(property.initializer);
  invariant(ts.isArrayLiteralExpression(value), `${objectLiteral.getSourceFile().fileName}: ${propertyName} must be an array literal`);
  return value.elements.map((element) => {
    const unwrapped = unwrapExpression(element);
    invariant(ts.isStringLiteralLike(unwrapped), `${objectLiteral.getSourceFile().fileName}: ${propertyName} must contain only string literals`);
    return unwrapped.text;
  });
}

function selectedAggregateProjection({
  relativePath,
  sourceText,
  variableName,
  expectedContainer,
  selectedNode,
  selection,
  kind,
}) {
  const javascript = transpileProjectionSource(relativePath, sourceText);
  const sourceFile = ts.createSourceFile(`${relativePath}.js`, javascript, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
  const container = unwrapExpression(findVariableInitializer(sourceFile, variableName));
  invariant(expectedContainer(container), `${relativePath}: ${variableName} has an unsupported aggregate shape`);
  const selected = selectedNode({sourceFile, container});
  const sharedSource = `${javascript.slice(0, container.getStart(sourceFile))}/*__HELPMATH_SELECTED_AGGREGATE__*/${javascript.slice(container.getEnd())}`;
  return {
    row: projectionRow(relativePath, selection, {
      schemaVersion: 1,
      kind,
      selection,
      sharedSource,
      selectedSource: selected.getText(sourceFile),
    }),
    sourceFile,
    container,
    selected,
  };
}

export function isUnambiguousLoopbackHttpUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  const hostname = parsed.hostname.toLowerCase();
  return parsed.protocol === "http:"
    && !parsed.username
    && !parsed.password
    && (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1");
}

export function implementationCaptureGeneratorProvenanceErrors(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["generatorProvenance is missing"];
  if (value.schemaVersion !== IMPLEMENTATION_CAPTURE_GENERATOR_PROVENANCE_SCHEMA_VERSION) {
    errors.push(`generatorProvenance.schemaVersion must be ${IMPLEMENTATION_CAPTURE_GENERATOR_PROVENANCE_SCHEMA_VERSION}`);
  }
  const exactKeys = (record, expected, label) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      errors.push(`${label} must be an object`);
      return;
    }
    const actual = Object.keys(record).sort();
    const wanted = [...expected].sort();
    if (JSON.stringify(actual) !== JSON.stringify(wanted)) errors.push(`${label} must contain exactly ${wanted.join(", ")}`);
  };
  exactKeys(value, ["schemaVersion", "script", "playwright", "browser"], "generatorProvenance");
  exactKeys(value.script, ["path", "sha256"], "generatorProvenance.script");
  exactKeys(value.playwright, ["package", "version", "packageJsonPath", "packageJsonSha256"], "generatorProvenance.playwright");
  exactKeys(value.browser, ["type", "version"], "generatorProvenance.browser");
  if (value.script?.path !== IMPLEMENTATION_CAPTURE_SCRIPT_PATH) errors.push(`generatorProvenance.script.path must be ${IMPLEMENTATION_CAPTURE_SCRIPT_PATH}`);
  if (!/^[a-f0-9]{64}$/.test(value.script?.sha256 || "")) errors.push("generatorProvenance.script.sha256 must be a lowercase 64-character SHA-256");
  if (value.playwright?.package !== "@playwright/test") errors.push("generatorProvenance.playwright.package must be @playwright/test");
  if (typeof value.playwright?.version !== "string" || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(value.playwright.version)) {
    errors.push("generatorProvenance.playwright.version must be a non-empty semantic version");
  }
  if (
    typeof value.playwright?.packageJsonPath !== "string"
    || !value.playwright.packageJsonPath.endsWith("/@playwright/test/package.json")
    || path.isAbsolute(value.playwright.packageJsonPath)
    || value.playwright.packageJsonPath.split("/").includes("..")
  ) {
    errors.push("generatorProvenance.playwright.packageJsonPath must be a project-relative @playwright/test package.json path");
  }
  if (!/^[a-f0-9]{64}$/.test(value.playwright?.packageJsonSha256 || "")) errors.push("generatorProvenance.playwright.packageJsonSha256 must be a lowercase 64-character SHA-256");
  if (value.browser?.type !== "chromium") errors.push("generatorProvenance.browser.type must be chromium");
  if (typeof value.browser?.version !== "string" || !value.browser.version.trim()) errors.push("generatorProvenance.browser.version must be a non-empty actual browser version");
  return errors;
}

function localImportBase(projectRoot, importerPath, specifier) {
  if (specifier.startsWith("./") || specifier.startsWith("../")) return path.resolve(path.dirname(importerPath), specifier);
  if (specifier.startsWith("@/")) return path.resolve(projectRoot, "apps/web", specifier.slice(2));
  if (specifier.startsWith("@helpmath/demos/")) {
    return path.resolve(projectRoot, "packages/demos/src", specifier.slice("@helpmath/demos/".length));
  }
  return null;
}

async function resolveLocalModule(projectRoot, importerPath, specifier) {
  const base = localImportBase(projectRoot, importerPath, specifier);
  if (!base) return null;
  projectRelative(projectRoot, base);
  const candidates = [base];
  if (!LOCAL_MODULE_EXTENSIONS.includes(path.extname(base).toLowerCase())) {
    for (const extension of LOCAL_MODULE_EXTENSIONS) candidates.push(`${base}${extension}`);
    for (const extension of LOCAL_MODULE_EXTENSIONS) candidates.push(path.join(base, `index${extension}`));
  }
  for (const candidate of candidates) {
    try {
      const metadata = await lstat(candidate);
      if (!metadata.isFile()) continue;
      await assertRealFileWithinProject(projectRoot, candidate, `local import ${specifier}`);
      return path.resolve(candidate);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  throw new Error(`${projectRelative(projectRoot, importerPath)}: unresolved local import ${specifier}`);
}

function sourceModuleSpecifiers(filePath, sourceText) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".css") {
    const values = [];
    for (const match of sourceText.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/g)) values.push(match[1]);
    for (const match of sourceText.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) values.push(match[1]);
    return values.filter((value) => value.startsWith("./") || value.startsWith("../"));
  }
  if (!PARSED_MODULE_EXTENSIONS.has(extension)) return [];
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);
  const values = [];
  const addLiteral = (node) => {
    if (node && ts.isStringLiteralLike(node)) values.push(node.text);
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) addLiteral(node.moduleSpecifier);
    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) addLiteral(node.argument.literal);
    if (ts.isCallExpression(node) && node.arguments.length === 1) {
      const dynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const commonJsRequire = ts.isIdentifier(node.expression) && node.expression.text === "require";
      if (dynamicImport || commonJsRequire) addLiteral(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return [...new Set(values)];
}

function isProjectionManagedGlobal(projectRoot, filePath) {
  return PROJECTION_MANAGED_GLOBAL_FILES.has(projectRelative(projectRoot, path.resolve(filePath)));
}

async function expandLocalModuleClosure(projectRoot, initialFiles) {
  const closure = new Set(initialFiles
    .map((filePath) => path.resolve(filePath))
    .filter((filePath) => !isProjectionManagedGlobal(projectRoot, filePath)));
  const queue = [...closure].filter((filePath) => {
    const extension = path.extname(filePath).toLowerCase();
    return PARSED_MODULE_EXTENSIONS.has(extension) || extension === ".css";
  });
  for (let index = 0; index < queue.length; index += 1) {
    const importerPath = queue[index];
    const sourceText = await readFile(importerPath, "utf8");
    for (const specifier of sourceModuleSpecifiers(importerPath, sourceText)) {
      const resolved = await resolveLocalModule(projectRoot, importerPath, specifier);
      if (!resolved || isProjectionManagedGlobal(projectRoot, resolved) || closure.has(resolved)) continue;
      closure.add(resolved);
      const extension = path.extname(resolved).toLowerCase();
      if (PARSED_MODULE_EXTENSIONS.has(extension) || extension === ".css") queue.push(resolved);
    }
  }
  return closure;
}

function resolveRegistryModule(projectRoot, registryModule) {
  if (typeof registryModule !== "string" || !registryModule.startsWith("./")) return [];
  const stem = path.resolve(projectRoot, "packages/demos/src", registryModule.slice(2));
  return [".tsx", ".ts", ".jsx", ".js", ".mjs"].map((extension) => `${stem}${extension}`);
}

function registryKeyFromModule(registryModule) {
  invariant(typeof registryModule === "string" && /^\.\/modules\/[^/]+$/.test(registryModule), `implementation.registryModule must be a direct ./modules/<key> path: ${registryModule || "missing"}`);
  return path.posix.basename(registryModule);
}

async function readProjectionSource(projectRoot, relativePath, label) {
  const absolutePath = path.resolve(projectRoot, relativePath);
  await assertRealFileWithinProject(projectRoot, absolutePath, label);
  return readFile(absolutePath, "utf8");
}

function dynamicImports(node) {
  const values = [];
  const visit = (child) => {
    if (
      ts.isCallExpression(child)
      && child.expression.kind === ts.SyntaxKind.ImportKeyword
      && child.arguments.length === 1
      && ts.isStringLiteralLike(child.arguments[0])
    ) values.push(child.arguments[0].text);
    ts.forEachChild(child, visit);
  };
  visit(node);
  return values;
}

async function collectRegistryGeneratedProjection(projectRoot, registryKey, registryModule) {
  const sourceText = await readProjectionSource(projectRoot, REGISTRY_GENERATED_PATH, "generated animation registry");
  const projection = selectedAggregateProjection({
    relativePath: REGISTRY_GENERATED_PATH,
    sourceText,
    variableName: "animationModuleLoaders",
    expectedContainer: ts.isObjectLiteralExpression,
    selection: registryKey,
    kind: "generated-animation-registry",
    selectedNode: ({sourceFile, container}) => {
      const matches = container.properties.filter((property) => property.name && propertyNameText(property.name) === registryKey);
      invariant(matches.length === 1, `${sourceFile.fileName}: expected exactly one registry entry for ${registryKey}, found ${matches.length}`);
      const imports = dynamicImports(matches[0]);
      invariant(imports.length === 1, `${sourceFile.fileName}: registry entry ${registryKey} must contain exactly one dynamic import`);
      invariant(imports[0] === registryModule, `${sourceFile.fileName}: registry entry ${registryKey} remaps ${registryModule} to ${imports[0]}`);
      return matches[0];
    },
  });
  return projection.row;
}

async function collectPrototypeManifestProjection(projectRoot, {
  animationId,
  registryKey,
  sourcePath,
}) {
  const sourceText = await readProjectionSource(projectRoot, PROTOTYPE_MANIFEST_PATH, "prototype manifest");
  const sourceBasename = path.posix.basename(normalizeProjectPath(sourcePath || "")).toLowerCase();
  const projection = selectedAggregateProjection({
    relativePath: PROTOTYPE_MANIFEST_PATH,
    sourceText,
    variableName: "prototypeManifest",
    expectedContainer: ts.isArrayLiteralExpression,
    selection: registryKey,
    kind: "prototype-manifest",
    selectedNode: ({sourceFile, container}) => {
      const entries = container.elements.map((element) => {
        const objectLiteral = unwrapExpression(element);
        invariant(ts.isObjectLiteralExpression(objectLiteral), `${sourceFile.fileName}: prototypeManifest entries must be object literals`);
        return {
          element,
          objectLiteral,
          key: propertyStringValue(objectLiteral, "key"),
          preferredAnimationId: propertyStringValue(objectLiteral, "preferredAnimationId"),
          sourceBasenames: propertyStringArray(objectLiteral, "sourceBasenames"),
        };
      });
      const selected = entries.filter((entry) => entry.key === registryKey);
      invariant(selected.length === 1, `${sourceFile.fileName}: expected exactly one prototype entry for ${registryKey}, found ${selected.length}`);
      invariant(
        selected[0].preferredAnimationId === animationId,
        `${sourceFile.fileName}: prototype entry ${registryKey} remaps preferredAnimationId ${animationId} to ${selected[0].preferredAnimationId}`,
      );
      const routeMatches = entries.filter((entry) => (
        entry.preferredAnimationId === animationId.toLowerCase()
        || entry.key === animationId.toLowerCase()
        || (sourceBasename && entry.sourceBasenames.includes(sourceBasename))
      ));
      invariant(
        routeMatches.length === 1 && routeMatches[0].key === registryKey,
        `${sourceFile.fileName}: matchPrototype routing for ${animationId} is ambiguous or resolves away from ${registryKey}`,
      );
      return selected[0].element;
    },
  });
  return projection.row;
}

async function collectPrototypeRegistryProjection(projectRoot, registryKey, registryModule) {
  const sourceText = await readProjectionSource(projectRoot, PROTOTYPE_REGISTRY_PATH, "prototype registry");
  let registry;
  try {
    registry = JSON.parse(sourceText);
  } catch (error) {
    throw new Error(`${PROTOTYPE_REGISTRY_PATH}: malformed JSON (${error.message})`);
  }
  invariant(registry?.schemaVersion === 1 && Array.isArray(registry.entries), `${PROTOTYPE_REGISTRY_PATH}: malformed prototype registry`);
  const matches = registry.entries.filter((entry) => entry?.key === registryKey);
  invariant(matches.length === 1, `${PROTOTYPE_REGISTRY_PATH}: expected exactly one entry for ${registryKey}, found ${matches.length}`);
  invariant(matches[0].module === registryModule, `${PROTOTYPE_REGISTRY_PATH}: entry ${registryKey} remaps ${registryModule} to ${matches[0].module || "missing"}`);
  return projectionRow(PROTOTYPE_REGISTRY_PATH, registryKey, {
    schemaVersion: registry.schemaVersion,
    entry: matches[0],
  });
}

async function collectPackageJsonRuntimeProjection(projectRoot, descriptor) {
  const sourceText = await readProjectionSource(projectRoot, descriptor.path, "package runtime contract");
  let packageJson;
  try {
    packageJson = JSON.parse(sourceText);
  } catch (error) {
    throw new Error(`${descriptor.path}: malformed JSON (${error.message})`);
  }
  invariant(packageJson && typeof packageJson === "object" && !Array.isArray(packageJson), `${descriptor.path}: package JSON must be an object`);
  const runtimeContract = {};
  for (const field of PACKAGE_JSON_RUNTIME_FIELDS) {
    if (Object.hasOwn(packageJson, field)) runtimeContract[field] = packageJson[field];
  }
  const scripts = {};
  for (const scriptName of descriptor.scripts) {
    if (Object.hasOwn(packageJson.scripts || {}, scriptName)) scripts[scriptName] = packageJson.scripts[scriptName];
  }
  if (Object.keys(scripts).length) runtimeContract.scripts = scripts;
  return projectionRow(descriptor.path, "render-runtime-v1", {
    schemaVersion: 1,
    kind: "package-json-render-runtime-contract",
    runtimeContract,
  });
}

export async function collectSelectedCatalogAnimationProjection(projectRoot, animationId) {
  const sourceText = await readProjectionSource(projectRoot, ANIMATION_CATALOG_PATH, "animation catalog");
  let catalog;
  try {
    catalog = JSON.parse(sourceText);
  } catch (error) {
    throw new Error(`${ANIMATION_CATALOG_PATH}: malformed JSON (${error.message})`);
  }
  invariant(catalog?.schemaVersion === 1 && Array.isArray(catalog.animations), `${ANIMATION_CATALOG_PATH}: malformed animation catalog`);
  const matches = catalog.animations.filter((animation) => animation?.animationId === animationId);
  invariant(matches.length === 1, `${ANIMATION_CATALOG_PATH}: expected exactly one entry for ${animationId}, found ${matches.length}`);
  return {
    animation: matches[0],
    row: projectionRow(ANIMATION_CATALOG_PATH, animationId, {
      schemaVersion: catalog.schemaVersion,
      animation: matches[0],
    }),
  };
}

async function collectImplementationProjections({projectRoot, manifest}) {
  const registryModule = manifest.implementation?.registryModule;
  const registryKey = typeof registryModule === "string" && registryModule.trim()
    ? registryKeyFromModule(registryModule)
    : null;
  const catalogExists = await exists(path.resolve(projectRoot, ANIMATION_CATALOG_PATH));
  const catalogProjection = catalogExists
    ? await collectSelectedCatalogAnimationProjection(projectRoot, manifest.animationId)
    : null;
  const sourcePath = catalogProjection?.animation?.source?.path
    || manifest.source?.swf?.path
    || manifest.source?.path
    || "";
  const projections = [];
  for (const descriptor of PACKAGE_JSON_RUNTIME_PROJECTIONS) {
    if (await exists(path.resolve(projectRoot, descriptor.path))) {
      projections.push(await collectPackageJsonRuntimeProjection(projectRoot, descriptor));
    }
  }
  if (registryKey && await exists(path.resolve(projectRoot, REGISTRY_GENERATED_PATH))) {
    projections.push(await collectRegistryGeneratedProjection(projectRoot, registryKey, registryModule));
  }
  if (registryKey && await exists(path.resolve(projectRoot, PROTOTYPE_MANIFEST_PATH))) {
    projections.push(await collectPrototypeManifestProjection(projectRoot, {
      animationId: manifest.animationId,
      registryKey,
      sourcePath,
    }));
  }
  if (registryKey && await exists(path.resolve(projectRoot, PROTOTYPE_REGISTRY_PATH))) {
    projections.push(await collectPrototypeRegistryProjection(projectRoot, registryKey, registryModule));
  }
  if (catalogProjection) projections.push(catalogProjection.row);
  return canonicalRows(projections);
}

async function addExistingFile(fileSet, filePath, {projectRoot, required = false, label = "implementation artifact"} = {}) {
  if (!filePath) return;
  try {
    const metadata = await lstat(filePath);
    if (!metadata.isFile()) {
      if (required) throw new Error(`Required ${label} is not a file: ${filePath}`);
      return;
    }
    await assertRealFileWithinProject(projectRoot, filePath, label);
    fileSet.add(path.resolve(filePath));
  } catch (error) {
    if (error.code === "ENOENT" && !required) return;
    if (error.code === "ENOENT") throw new Error(`Required ${label} is missing: ${filePath}`);
    throw error;
  }
}

function evidencePath(projectRoot, workspace, value) {
  if (typeof value !== "string" || !value.trim()) return null;
  invariant(!path.isAbsolute(value), `Implementation inventory path must be project-relative: ${value}`);
  if (/^(?:output|artifacts|reports|public|apps|packages|components|lib)\//.test(value)) return path.resolve(projectRoot, value);
  return path.resolve(workspace, value);
}

function collectEmbeddedFileBindings(value, output = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectEmbeddedFileBindings(item, output);
    return output;
  }
  if (!value || typeof value !== "object") return output;
  if (typeof value.path === "string" && /^[a-f0-9]{64}$/.test(value.sha256 || "")) {
    output.push({path: value.path, sha256: value.sha256, bytes: value.bytes});
  }
  for (const child of Object.values(value)) collectEmbeddedFileBindings(child, output);
  return output;
}

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) {
      values.push(value);
      value = "";
    } else value += character;
  }
  values.push(value);
  return values;
}

function publicRendererPath(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.startsWith("public/flash-assets/")) return normalizeProjectPath(trimmed);
  if (trimmed.startsWith("/flash-assets/")) return `public${trimmed.replace(/\/+$/, "")}`;
  return null;
}

async function collectCsvPublicBindings(csvPath) {
  const text = await readFile(csvPath, "utf8");
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  const exportedIndex = headers.indexOf("exported_file");
  const hashIndex = headers.indexOf("sha256");
  if (exportedIndex < 0) return [];
  return lines.slice(1).flatMap((line) => {
    const values = parseCsvLine(line);
    const rendererPath = publicRendererPath(values[exportedIndex]);
    if (!rendererPath) return [];
    const declaredSha256 = /^[a-f0-9]{64}$/.test(values[hashIndex] || "") ? values[hashIndex] : undefined;
    return [{path: rendererPath, sha256: declaredSha256}];
  });
}

async function addPublicRendererFile(rows, projectRoot, filePath, {declaredBytes, declaredSha256} = {}) {
  const {relativePath, metadata} = await assertRealFileWithinProject(projectRoot, filePath, "public renderer artifact");
  invariant(relativePath.startsWith(RENDERER_OUTPUT_ROOT), `Public renderer artifact is outside ${RENDERER_OUTPUT_ROOT}: ${relativePath}`);
  const actualSha256 = await sha256File(filePath);
  invariant(!declaredSha256 || declaredSha256 === actualSha256, `${relativePath}: renderer inventory SHA-256 ${declaredSha256} does not match actual ${actualSha256}`);
  invariant(!Number.isInteger(declaredBytes) || declaredBytes === metadata.size, `${relativePath}: renderer inventory byte count ${declaredBytes} does not match actual ${metadata.size}`);
  const existing = rows.get(relativePath);
  invariant(!existing || (existing.bytes === metadata.size && existing.sha256 === actualSha256), `${relativePath}: conflicting public renderer artifact bytes`);
  rows.set(relativePath, {path: relativePath, bytes: metadata.size, sha256: actualSha256});
}

async function addPublicRendererPath(rows, projectRoot, filePath, binding = {}) {
  const relativePath = projectRelative(projectRoot, filePath);
  invariant(relativePath.startsWith(RENDERER_OUTPUT_ROOT), `Public renderer path is outside ${RENDERER_OUTPUT_ROOT}: ${relativePath}`);
  const metadata = await lstat(filePath);
  invariant(!metadata.isSymbolicLink(), `Public renderer path must not be a symbolic link: ${relativePath}`);
  if (metadata.isDirectory()) {
    const entries = await readdir(filePath, {withFileTypes: true});
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      invariant(!entry.isSymbolicLink(), `Public renderer directory contains a symbolic link: ${portable(path.relative(projectRoot, path.join(filePath, entry.name)))}`);
      await addPublicRendererPath(rows, projectRoot, path.join(filePath, entry.name));
    }
    return;
  }
  invariant(metadata.isFile(), `Public renderer path is neither a file nor directory: ${relativePath}`);
  await addPublicRendererFile(rows, projectRoot, filePath, binding);
  if (path.basename(filePath) !== "manifest.json") return;
  const manifest = JSON.parse(await readFile(filePath, "utf8"));
  if (!manifest.generatedFiles || typeof manifest.generatedFiles !== "object" || Array.isArray(manifest.generatedFiles)) return;
  for (const [generatedName, generatedBinding] of Object.entries(manifest.generatedFiles)) {
    invariant(typeof generatedName === "string" && generatedName.trim() && !path.isAbsolute(generatedName), `${relativePath}: generated file path is invalid`);
    const generatedPath = path.resolve(path.dirname(filePath), generatedName);
    invariant(isInside(path.dirname(filePath), generatedPath), `${relativePath}: generated file escapes its directory: ${generatedName}`);
    await addPublicRendererPath(rows, projectRoot, generatedPath, {
      declaredBytes: generatedBinding?.bytes,
      declaredSha256: generatedBinding?.sha256,
    });
  }
}

async function collectPublicRendererArtifacts({projectRoot, workspace, manifest, sourceFiles}) {
  const rows = new Map();
  const registryKey = typeof manifest.implementation?.registryModule === "string"
    ? path.posix.basename(manifest.implementation.registryModule)
    : "";
  for (const sourcePath of [...sourceFiles].sort()) {
    const extension = path.extname(sourcePath).toLowerCase();
    if (!(PARSED_MODULE_EXTENSIONS.has(extension) || extension === ".css")) continue;
    const source = await readFile(sourcePath, "utf8");
    for (const match of source.matchAll(/\/flash-assets\/[A-Za-z0-9._-][A-Za-z0-9._/-]*/g)) {
      const matchedPath = match[0];
      const suffixSegments = matchedPath.slice("/flash-assets/".length).split("/").filter(Boolean);
      let rendererRelative = `public${matchedPath.replace(/\/+$/, "")}`;
      if (matchedPath.endsWith("/") && registryKey) {
        const animationScoped = `${rendererRelative}/${registryKey}`;
        if (await exists(path.resolve(projectRoot, animationScoped))) rendererRelative = animationScoped;
        else if (suffixSegments.length <= 1) continue;
      } else if (matchedPath.endsWith("/") && suffixSegments.length <= 1) continue;
      const rendererPath = path.resolve(projectRoot, rendererRelative);
      invariant(await exists(rendererPath), `${projectRelative(projectRoot, sourcePath)}: referenced public renderer artifact is missing: ${rendererRelative}`);
      await addPublicRendererPath(rows, projectRoot, rendererPath);
    }
  }

  const inventoryValues = [];
  for (const key of INVENTORY_JSON_KEYS) {
    inventoryValues.push(manifest.implementation?.[key], manifest.evidence?.[key]);
  }
  for (const inventoryValue of [...new Set(inventoryValues.filter((value) => typeof value === "string" && value.trim()))]) {
    const inventoryPath = evidencePath(projectRoot, workspace, inventoryValue);
    if (!(await exists(inventoryPath)) || path.extname(inventoryPath).toLowerCase() !== ".json") continue;
    await assertRealFileWithinProject(projectRoot, inventoryPath, "renderer dependency inventory");
    let inventory;
    try {
      inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
    } catch (error) {
      throw new Error(`${projectRelative(projectRoot, inventoryPath)}: renderer dependency inventory is not valid JSON (${error.message})`);
    }
    for (const binding of collectEmbeddedFileBindings(inventory)) {
      const rendererRelative = publicRendererPath(binding.path);
      if (!rendererRelative) continue;
      const rendererPath = path.resolve(projectRoot, rendererRelative);
      invariant(await exists(rendererPath), `${projectRelative(projectRoot, inventoryPath)}: inventoried public renderer artifact is missing: ${rendererRelative}`);
      await addPublicRendererPath(rows, projectRoot, rendererPath, {
        declaredBytes: binding.bytes,
        declaredSha256: binding.sha256,
      });
    }
  }

  const assetInventoryValue = manifest.evidence?.assetInventory;
  if (typeof assetInventoryValue === "string" && assetInventoryValue.trim()) {
    const inventoryPath = evidencePath(projectRoot, workspace, assetInventoryValue);
    if (await exists(inventoryPath)) {
      await assertRealFileWithinProject(projectRoot, inventoryPath, "asset inventory");
      for (const binding of await collectCsvPublicBindings(inventoryPath)) {
        const rendererPath = path.resolve(projectRoot, binding.path);
        invariant(await exists(rendererPath), `${projectRelative(projectRoot, inventoryPath)}: inventoried public renderer artifact is missing: ${binding.path}`);
        await addPublicRendererPath(rows, projectRoot, rendererPath, {declaredSha256: binding.sha256});
      }
    }
  }
  return rows;
}

export async function collectImplementationArtifactClosure({projectRoot, workspace, manifest}) {
  invariant(projectRoot && workspace && manifest && typeof manifest === "object", "projectRoot, workspace, and manifest are required");
  invariant(typeof manifest.animationId === "string" && manifest.animationId.trim(), "manifest.animationId is required");
  const resolvedProjectRoot = path.resolve(projectRoot);
  const resolvedWorkspace = path.resolve(workspace);
  invariant(isInside(resolvedProjectRoot, resolvedWorkspace), `Migration workspace escapes the project root: ${resolvedWorkspace}`);
  const files = new Set();
  const implementation = manifest.implementation || {};

  for (const key of ["component", "timelineModule", "routeFile"]) {
    const value = implementation[key];
    if (typeof value !== "string" || !value.trim()) continue;
    invariant(!path.isAbsolute(value), `implementation.${key} must use a project-relative path: ${value}`);
    await addExistingFile(files, path.resolve(resolvedProjectRoot, value), {
      projectRoot: resolvedProjectRoot,
      required: true,
      label: `implementation.${key}`,
    });
  }

  if (implementation.registryModule) {
    const candidates = resolveRegistryModule(resolvedProjectRoot, implementation.registryModule);
    let found = false;
    for (const candidate of candidates) {
      if (!(await exists(candidate))) continue;
      await addExistingFile(files, candidate, {
        projectRoot: resolvedProjectRoot,
        required: true,
        label: "implementation.registryModule",
      });
      found = true;
      break;
    }
    invariant(found, `implementation.registryModule cannot be resolved: ${implementation.registryModule}`);
  }

  for (const relativePath of IMPLEMENTATION_SHARED_RUNTIME_FILES) {
    await addExistingFile(files, path.resolve(resolvedProjectRoot, relativePath), {
      projectRoot: resolvedProjectRoot,
    });
  }

  const expandedFiles = await expandLocalModuleClosure(resolvedProjectRoot, [...files]);
  const projections = await collectImplementationProjections({
    projectRoot: resolvedProjectRoot,
    manifest,
  });
  const publicRows = await collectPublicRendererArtifacts({
    projectRoot: resolvedProjectRoot,
    workspace: resolvedWorkspace,
    manifest,
    sourceFiles: expandedFiles,
  });
  const artifacts = [];
  for (const absolutePath of [...expandedFiles].sort()) {
    const {relativePath, metadata} = await assertRealFileWithinProject(resolvedProjectRoot, absolutePath, "implementation artifact");
    artifacts.push({path: relativePath, bytes: metadata.size, sha256: await sha256File(absolutePath)});
  }
  artifacts.push(...publicRows.values());
  const rows = canonicalRows(artifacts);
  invariant(rows.length > 0, `${manifest.animationId || "migration"}: no render-affecting implementation artifacts were found`);
  invariant(new Set(rows.map(({path: artifactPath}) => artifactPath)).size === rows.length, "Implementation artifact closure contains duplicate paths");
  invariant(new Set(projections.map(({path: artifactPath}) => artifactPath)).size === projections.length, "Implementation artifact closure contains duplicate projection paths");
  const allPaths = [...rows, ...projections].map(({path: artifactPath}) => artifactPath);
  invariant(new Set(allPaths).size === allPaths.length, "Implementation artifact closure contains duplicate artifact/projection paths");
  const totalBytes = [...rows, ...projections].reduce((sum, artifact) => sum + artifact.bytes, 0);
  return {
    schemaVersion: IMPLEMENTATION_ARTIFACT_CLOSURE_SCHEMA_VERSION,
    algorithm: IMPLEMENTATION_ARTIFACT_CLOSURE_ALGORITHM,
    artifactCount: rows.length,
    projectionCount: projections.length,
    totalBytes,
    aggregateSha256: implementationArtifactRowsSha256(rows, projections),
    artifacts: rows,
    projections,
  };
}

export function implementationArtifactClosureErrors(recorded, current) {
  const errors = [];
  if (!recorded || typeof recorded !== "object" || Array.isArray(recorded)) return ["implementationArtifactClosure is missing"];
  if (recorded.schemaVersion !== IMPLEMENTATION_ARTIFACT_CLOSURE_SCHEMA_VERSION) {
    errors.push(`implementationArtifactClosure.schemaVersion must be ${IMPLEMENTATION_ARTIFACT_CLOSURE_SCHEMA_VERSION}`);
  }
  if (recorded.algorithm !== IMPLEMENTATION_ARTIFACT_CLOSURE_ALGORITHM) {
    errors.push(`implementationArtifactClosure.algorithm must be ${IMPLEMENTATION_ARTIFACT_CLOSURE_ALGORITHM}`);
  }
  if (!Array.isArray(recorded.artifacts) || !recorded.artifacts.length) {
    errors.push("implementationArtifactClosure.artifacts must be a non-empty array");
    return errors;
  }
  if (!Array.isArray(recorded.projections)) {
    errors.push("implementationArtifactClosure.projections must be an array");
    return errors;
  }
  const normalized = canonicalRows(recorded.artifacts);
  const normalizedProjections = canonicalRows(recorded.projections);
  if (JSON.stringify(normalized) !== JSON.stringify(recorded.artifacts)) {
    errors.push("implementationArtifactClosure.artifacts must be canonical path-sorted {path,bytes,sha256} rows");
  }
  if (JSON.stringify(normalizedProjections) !== JSON.stringify(recorded.projections)) {
    errors.push("implementationArtifactClosure.projections must be canonical path-sorted {path,bytes,sha256} rows");
  }
  for (const [index, artifact] of normalized.entries()) {
    if (!artifact.path || path.isAbsolute(artifact.path) || isForbiddenArtifactPath(artifact.path)) errors.push(`implementationArtifactClosure.artifacts[${index}].path is invalid or excluded`);
    if (!Number.isInteger(artifact.bytes) || artifact.bytes < 0) errors.push(`implementationArtifactClosure.artifacts[${index}].bytes is invalid`);
    if (!/^[a-f0-9]{64}$/.test(artifact.sha256 || "")) errors.push(`implementationArtifactClosure.artifacts[${index}].sha256 is invalid`);
  }
  for (const [index, projection] of normalizedProjections.entries()) {
    const [projectPath, selection] = projection.path.split("#selected=");
    if (!projectPath || !selection || path.isAbsolute(projectPath) || isForbiddenArtifactPath(projectPath)) errors.push(`implementationArtifactClosure.projections[${index}].path is invalid or excluded`);
    if (!Number.isInteger(projection.bytes) || projection.bytes < 0) errors.push(`implementationArtifactClosure.projections[${index}].bytes is invalid`);
    if (!/^[a-f0-9]{64}$/.test(projection.sha256 || "")) errors.push(`implementationArtifactClosure.projections[${index}].sha256 is invalid`);
  }
  if (new Set(normalized.map(({path: artifactPath}) => artifactPath)).size !== normalized.length) errors.push("implementationArtifactClosure.artifacts contains duplicate paths");
  if (new Set(normalizedProjections.map(({path: artifactPath}) => artifactPath)).size !== normalizedProjections.length) errors.push("implementationArtifactClosure.projections contains duplicate paths");
  if (new Set([...normalized, ...normalizedProjections].map(({path: artifactPath}) => artifactPath)).size !== normalized.length + normalizedProjections.length) errors.push("implementationArtifactClosure contains duplicate artifact/projection paths");
  const totalBytes = [...normalized, ...normalizedProjections].reduce((sum, artifact) => sum + artifact.bytes, 0);
  if (recorded.artifactCount !== normalized.length) errors.push("implementationArtifactClosure.artifactCount differs from artifacts");
  if (recorded.projectionCount !== normalizedProjections.length) errors.push("implementationArtifactClosure.projectionCount differs from projections");
  if (recorded.totalBytes !== totalBytes) errors.push("implementationArtifactClosure.totalBytes differs from artifacts and projections");
  if (recorded.aggregateSha256 !== implementationArtifactRowsSha256(normalized, normalizedProjections)) {
    errors.push("implementationArtifactClosure.aggregateSha256 differs from its canonical artifact and projection rows");
  }
  if (current && JSON.stringify(recorded) !== JSON.stringify(current)) {
    errors.push("implementationArtifactClosure is stale: the current render-affecting implementation artifact closure differs from capture time");
  }
  return errors;
}
