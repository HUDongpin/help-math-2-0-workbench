#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {createReadStream} from "node:fs";
import {access, lstat, mkdir, readFile, readdir, realpath, rename, stat, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import ts from "typescript";

import {collectImplementationArtifactClosure} from "./implementation-artifact-closure.mjs";
import {PILOT_MIGRATIONS} from "./scaffold-pilot-migrations.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

export const CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION = 3;
export const CURRENT_JAVASCRIPT_APPROVAL_GENERATOR_VERSION = "3.0.0";
export const DEFAULT_CURRENT_JAVASCRIPT_APPROVAL_REPORT = "reports/current-javascript-output-human-approval.json";

const RENDERER_OUTPUT_ROOT = "public/flash-assets/";

const CURRENT_JS_SCOPE = "currently-generated-javascript-based-animations-at-review-time";
const CURRENT_JS_AUTHORITY_NOTE = "This records the user's explicit approval of the current JavaScript outputs only. Missing original-runtime evidence and every independent strict gate remain unchanged.";
const CURRENT_JS_ARTIFACT_BINDING_INCLUDED = "Declared renderer, timeline, test, route, registry, shared player runtime, implicit Next.js build/runtime configuration, their transitive local import graph, the route-relevant per-animation catalog projection, deterministic capture manifests, keyframe index, visual contact-sheet/QA evidence, and direct or indirect public renderer/audio dependencies that existed at approval time.";
const CURRENT_JS_ARTIFACT_BINDING_EXCLUDED = "Mutable full-frame coverage/status metadata is excluded except for the route-visible per-animation catalog status projection; unrelated catalog entries are not bound to this animation approval.";

const SHARED_RUNTIME_FILES = Object.freeze([
  "package.json",
  "package-lock.json",
  "apps/web/package.json",
  "apps/web/next.config.ts",
  "apps/web/postcss.config.mjs",
  "apps/web/proxy.ts",
  "apps/web/tsconfig.json",
  "apps/web/app/[locale]/layout.tsx",
  "apps/web/app/[locale]/animations/[animationId]/page.tsx",
  "apps/web/components/animation-runtime.tsx",
  "apps/web/components/demo-player.tsx",
  "packages/demos/package.json",
  "packages/demos/src/animation-registry.ts",
  "packages/demos/src/contract.ts",
  "packages/demos/src/prototype-manifest.ts",
  "packages/demos/tsconfig.json",
]);

const WORKSPACE_EVIDENCE_KEYS = Object.freeze([
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

const IMPLEMENTATION_EVIDENCE_KEYS = Object.freeze(["candidateQa"]);

const CURRENT_JS_AUTHORITY_FALSE_FLAGS = Object.freeze([
  "strictHumanVisualReview",
  "ownerAcceptance",
  "authoritativeFlashBaseline",
  "visualOrBehavioralParity",
  "audioAcceptance",
  "strictMigrationCompletion",
]);

const CURRENT_JS_STRICT_HUMAN_REVIEW_EFFECT = "none; strict human review still requires a named human to accept all required keyframe and full-frame diffs, bilingual audio, and interaction evidence";

const CURRENT_JS_REPORT_KEYS = Object.freeze([
  "schemaVersion",
  "evidenceType",
  "generator",
  "decision",
  "reviewer",
  "reviewedAt",
  "sourceMessage",
  "scope",
  "authorityBoundary",
  "artifactBindingPolicy",
  "summary",
  "animations",
  "bindingAmendment",
]);

const CURRENT_JS_ANIMATION_RECORD_KEYS = Object.freeze([
  "animationId",
  "route",
  "previousApproval",
  "artifactBindingSha256",
  "artifacts",
  "rendererDependencies",
  "catalogProjection",
  "approvalHistory",
]);

const CURRENT_JS_MANIFEST_APPROVAL_KEYS = Object.freeze([
  "decision",
  "reviewer",
  "reviewedAt",
  "sourceMessage",
  "scope",
  "approvalRecord",
  "approvalRecordSha256",
  "artifactBindingSha256",
  "strictHumanReviewEffect",
  "history",
  "bindingAmendedAt",
  "bindingAmendmentReason",
]);

const CURRENT_JS_APPROVAL_HISTORY_KEYS = Object.freeze([
  "decision",
  "priorDecision",
  "reviewer",
  "reviewedAt",
  "invalidatedAt",
  "invalidationReason",
  "scope",
]);

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function normalizeProjectPath(value) {
  return portable(value).replace(/^\.\//, "");
}

function projectRelative(projectRoot, filePath) {
  const relative = path.relative(projectRoot, filePath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Approval artifact escapes the project root: ${filePath}`);
  }
  return portable(relative);
}

function isInside(root, target) {
  const relative = path.relative(root, target);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function assertRealFileWithinProject(projectRoot, filePath, label) {
  const [realProjectRoot, realFilePath] = await Promise.all([realpath(projectRoot), realpath(filePath)]);
  invariant(isInside(realProjectRoot, realFilePath), `${label} resolves outside the project root: ${filePath}`);
  const linkMetadata = await lstat(filePath);
  invariant(!linkMetadata.isSymbolicLink(), `${label} must not be a symbolic link: ${filePath}`);
  return realFilePath;
}

function resolveProjectRelativeRendererPath(projectRoot, value, label) {
  invariant(typeof value === "string" && value.trim(), `${label} path is missing`);
  invariant(!path.isAbsolute(value), `${label} must use a project-relative path: ${value}`);
  const absolutePath = path.resolve(projectRoot, value);
  const relativePath = projectRelative(projectRoot, absolutePath);
  invariant(relativePath === RENDERER_OUTPUT_ROOT.slice(0, -1) || relativePath.startsWith(RENDERER_OUTPUT_ROOT), `${label} is outside ${RENDERER_OUTPUT_ROOT}: ${value}`);
  return {absolutePath, relativePath};
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

const LOCAL_MODULE_EXTENSIONS = Object.freeze([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css"]);
const PARSED_MODULE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

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
      return candidate;
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

async function expandLocalModuleClosure(projectRoot, initialFiles) {
  const closure = new Set(initialFiles);
  const queue = [...initialFiles].filter((filePath) => PARSED_MODULE_EXTENSIONS.has(path.extname(filePath).toLowerCase()) || path.extname(filePath).toLowerCase() === ".css");
  for (let index = 0; index < queue.length; index += 1) {
    const importerPath = queue[index];
    const sourceText = await readFile(importerPath, "utf8");
    for (const specifier of sourceModuleSpecifiers(importerPath, sourceText)) {
      const resolved = await resolveLocalModule(projectRoot, importerPath, specifier);
      if (!resolved || closure.has(resolved)) continue;
      closure.add(resolved);
      const extension = path.extname(resolved).toLowerCase();
      if (PARSED_MODULE_EXTENSIONS.has(extension) || extension === ".css") queue.push(resolved);
    }
  }
  return closure;
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function validReviewedAt(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp <= Date.now() + 60_000;
}

function authorityBoundaryErrors(boundary) {
  const errors = [];
  for (const flag of CURRENT_JS_AUTHORITY_FALSE_FLAGS) {
    if (boundary?.[flag] !== false) errors.push(`approval report authorityBoundary.${flag} must be false`);
  }
  for (const flag of Object.keys(boundary || {})) {
    if (flag !== "note" && !CURRENT_JS_AUTHORITY_FALSE_FLAGS.includes(flag)) errors.push(`approval report authorityBoundary.${flag} is not allowed`);
  }
  if (boundary?.note !== CURRENT_JS_AUTHORITY_NOTE) errors.push("approval report authorityBoundary.note is invalid");
  return errors;
}

function unexpectedKeys(value, allowed, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [`${label} must be an object`];
  return Object.keys(value)
    .filter((key) => !allowed.includes(key))
    .sort()
    .map((key) => `${label}.${key} is not allowed`);
}

function validSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function approvalHistoryEntryErrors(entry, label) {
  const errors = unexpectedKeys(entry, CURRENT_JS_APPROVAL_HISTORY_KEYS, label);
  for (const key of CURRENT_JS_APPROVAL_HISTORY_KEYS) if (!Object.hasOwn(entry || {}, key)) errors.push(`${label}.${key} is missing`);
  const decisions = new Set(["", "accepted", "stale", "pending", "rejected", "invalidated"]);
  if (!decisions.has(entry?.decision)) errors.push(`${label}.decision is invalid`);
  if (!decisions.has(entry?.priorDecision)) errors.push(`${label}.priorDecision is invalid`);
  for (const key of ["reviewer", "reviewedAt", "invalidatedAt", "invalidationReason", "scope"]) {
    if (typeof entry?.[key] !== "string") errors.push(`${label}.${key} must be a string`);
  }
  if (entry?.reviewedAt && !validReviewedAt(entry.reviewedAt)) errors.push(`${label}.reviewedAt is invalid`);
  if (entry?.invalidatedAt && !validReviewedAt(entry.invalidatedAt)) errors.push(`${label}.invalidatedAt is invalid`);
  const safeScope = entry?.scope === "" || entry?.scope === CURRENT_JS_SCOPE || entry?.scope?.startsWith("javascript-output-existing-at-review-time");
  if (!safeScope) errors.push(`${label}.scope exceeds the current-JavaScript-only authority boundary`);
  return errors;
}

function currentApprovalRecordErrors(record) {
  const errors = unexpectedKeys(record, CURRENT_JS_REPORT_KEYS, "approval report");
  if (record?.schemaVersion !== CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION) return errors;

  errors.push(...authorityBoundaryErrors(record.authorityBoundary));

  errors.push(...unexpectedKeys(record.generator, ["script", "version"], "approval report generator"));
  if (record.generator?.script !== "scripts/record-current-javascript-output-approval.mjs") errors.push("approval report generator script is invalid");
  if (record.generator?.version !== CURRENT_JAVASCRIPT_APPROVAL_GENERATOR_VERSION) errors.push("approval report generator version is invalid");

  errors.push(...unexpectedKeys(record.artifactBindingPolicy, ["included", "excluded"], "approval report artifactBindingPolicy"));
  if (record.artifactBindingPolicy?.included !== CURRENT_JS_ARTIFACT_BINDING_INCLUDED) errors.push("approval report artifactBindingPolicy.included is invalid");
  if (record.artifactBindingPolicy?.excluded !== CURRENT_JS_ARTIFACT_BINDING_EXCLUDED) errors.push("approval report artifactBindingPolicy.excluded is invalid");

  errors.push(...unexpectedKeys(record.summary, ["animations", "previouslyAccepted", "renewedFromStale"], "approval report summary"));
  for (const key of ["animations", "previouslyAccepted", "renewedFromStale"]) {
    if (!Number.isInteger(record.summary?.[key]) || record.summary[key] < 0) errors.push(`approval report summary.${key} is invalid`);
  }

  if (record.bindingAmendment !== undefined) {
    errors.push(...unexpectedKeys(record.bindingAmendment, ["amendedAt", "reason", "priorReportSha256", "humanDecisionChanged"], "approval report bindingAmendment"));
    if (!validReviewedAt(record.bindingAmendment?.amendedAt)) errors.push("approval report bindingAmendment.amendedAt is invalid");
    if (typeof record.bindingAmendment?.reason !== "string" || record.bindingAmendment.reason.trim().length < 20) errors.push("approval report bindingAmendment.reason is invalid");
    if (!validSha256(record.bindingAmendment?.priorReportSha256)) errors.push("approval report bindingAmendment.priorReportSha256 is invalid");
    if (record.bindingAmendment?.humanDecisionChanged !== false) errors.push("approval report bindingAmendment.humanDecisionChanged must be false");
  }

  for (const [index, animation] of (Array.isArray(record.animations) ? record.animations : []).entries()) {
    const label = `approval report animations[${index}]`;
    errors.push(...unexpectedKeys(animation, CURRENT_JS_ANIMATION_RECORD_KEYS, label));
    if (typeof animation?.route !== "string") errors.push(`${label}.route is invalid`);
    if (!validSha256(animation?.artifactBindingSha256)) errors.push(`${label}.artifactBindingSha256 is invalid`);
    if (!(animation?.previousApproval === null || (animation?.previousApproval && typeof animation.previousApproval === "object" && !Array.isArray(animation.previousApproval)))) {
      errors.push(`${label}.previousApproval is invalid`);
    } else if (animation.previousApproval) {
      errors.push(...unexpectedKeys(animation.previousApproval, CURRENT_JS_APPROVAL_HISTORY_KEYS, `${label}.previousApproval`));
    }
    if (!Array.isArray(animation?.approvalHistory)) {
      errors.push(`${label}.approvalHistory must be an array`);
    } else {
      for (const [historyIndex, historyEntry] of animation.approvalHistory.entries()) {
        errors.push(...approvalHistoryEntryErrors(historyEntry, `${label}.approvalHistory[${historyIndex}]`));
      }
    }
    if (!Array.isArray(animation?.artifacts)) {
      errors.push(`${label}.artifacts must be an array`);
    } else {
      for (const [artifactIndex, artifact] of animation.artifacts.entries()) {
        const artifactLabel = `${label}.artifacts[${artifactIndex}]`;
        errors.push(...unexpectedKeys(artifact, ["path", "bytes", "sha256"], artifactLabel));
        if (typeof artifact?.path !== "string" || !artifact.path) errors.push(`${artifactLabel}.path is invalid`);
        if (!Number.isInteger(artifact?.bytes) || artifact.bytes < 0) errors.push(`${artifactLabel}.bytes is invalid`);
        if (!validSha256(artifact?.sha256)) errors.push(`${artifactLabel}.sha256 is invalid`);
      }
    }
    if (!Array.isArray(animation?.rendererDependencies)) {
      errors.push(`${label}.rendererDependencies must be an array`);
    } else {
      for (const [dependencyIndex, dependency] of animation.rendererDependencies.entries()) {
        const dependencyLabel = `${label}.rendererDependencies[${dependencyIndex}]`;
        errors.push(...unexpectedKeys(dependency, ["path", "bytes", "sha256", "inventoryPaths", "referencedBy"], dependencyLabel));
        if (typeof dependency?.path !== "string" || !dependency.path) errors.push(`${dependencyLabel}.path is invalid`);
        if (!Number.isInteger(dependency?.bytes) || dependency.bytes < 0) errors.push(`${dependencyLabel}.bytes is invalid`);
        if (!validSha256(dependency?.sha256)) errors.push(`${dependencyLabel}.sha256 is invalid`);
        if (!Array.isArray(dependency?.inventoryPaths) || dependency.inventoryPaths.some((value) => typeof value !== "string")) errors.push(`${dependencyLabel}.inventoryPaths is invalid`);
        if (!Array.isArray(dependency?.referencedBy) || dependency.referencedBy.some((value) => typeof value !== "string")) errors.push(`${dependencyLabel}.referencedBy is invalid`);
      }
    }
    if (!(animation?.catalogProjection === null || (animation?.catalogProjection && typeof animation.catalogProjection === "object" && !Array.isArray(animation.catalogProjection)))) {
      errors.push(`${label}.catalogProjection is invalid`);
    }
  }
  return errors;
}

async function removeIfPresent(filePath) {
  try {
    await unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function readOptionalFile(filePath) {
  try {
    return await readFile(filePath);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function assertPathAbsent(filePath, label) {
  try {
    await lstat(filePath);
    throw new Error(`${label} already exists: ${filePath}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function sameOptionalBytes(left, right) {
  if (left === null || right === null) return left === right;
  return Buffer.from(left).equals(Buffer.from(right));
}

export async function writeApprovalTransaction(entries, {beforeCommit, beforeCommitEntry, afterTargetMoved, beforeRollbackEntry} = {}) {
  invariant(Array.isArray(entries) && entries.length > 0, "Write transaction has no entries");
  const transactionId = `${process.pid}-${randomUUID()}`;
  const prepared = [];
  const targets = new Set();
  try {
    for (let index = 0; index < entries.length; index += 1) {
      const {filePath, value, expectedBefore} = entries[index];
      invariant(expectedBefore === null || typeof expectedBefore === "string" || Buffer.isBuffer(expectedBefore), `Write transaction is missing expected-before bytes: ${filePath}`);
      invariant(!targets.has(filePath), `Write transaction contains duplicate target: ${filePath}`);
      targets.add(filePath);
      await mkdir(path.dirname(filePath), {recursive: true});
      const temporaryPath = `${filePath}.transaction-${transactionId}-${index}.tmp`;
      const backupPath = `${filePath}.transaction-${transactionId}-${index}.bak`;
      await assertPathAbsent(backupPath, "Approval transaction backup path");
      const originalValue = await readOptionalFile(filePath);
      const originalExists = originalValue !== null;
      invariant(sameOptionalBytes(originalValue, expectedBefore), `Approval write target changed during preflight: ${filePath}`);
      await writeFile(temporaryPath, value, {flag: "wx"});
      const intendedValue = Buffer.isBuffer(value) ? Buffer.from(value) : Buffer.from(String(value));
      prepared.push({filePath, temporaryPath, backupPath, originalExists, originalValue, expectedBefore, intendedValue, targetMoved: false, committed: false, rollbackConflict: false});
    }

    if (beforeCommit) await beforeCommit();
    for (let index = 0; index < prepared.length; index += 1) {
      const entry = prepared[index];
      if (beforeCommitEntry) await beforeCommitEntry(entry, index);
      const currentValue = await readOptionalFile(entry.filePath);
      invariant(sameOptionalBytes(currentValue, entry.expectedBefore), `Approval write target changed before commit: ${entry.filePath}`);
      if (entry.originalExists) {
        await rename(entry.filePath, entry.backupPath);
        entry.targetMoved = true;
        if (afterTargetMoved) await afterTargetMoved(entry, index);
      }
      await rename(entry.temporaryPath, entry.filePath);
      entry.committed = true;
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const entry of [...prepared].reverse()) {
      try {
        if (beforeRollbackEntry) await beforeRollbackEntry(entry);
        if (entry.committed) {
          const currentValue = await readOptionalFile(entry.filePath);
          if (!sameOptionalBytes(currentValue, entry.intendedValue)) {
            entry.rollbackConflict = true;
            rollbackErrors.push(`${entry.filePath}: changed after transaction commit; concurrent bytes were preserved${entry.targetMoved ? ` and original bytes remain at ${entry.backupPath}` : ""}`);
            continue;
          }
          await removeIfPresent(entry.filePath);
        }
        if (entry.targetMoved) {
          const replacement = await readOptionalFile(entry.filePath);
          if (replacement !== null) {
            entry.rollbackConflict = true;
            rollbackErrors.push(`${entry.filePath}: recreated before rollback restore; concurrent bytes were preserved and original bytes remain at ${entry.backupPath}`);
            continue;
          }
          try {
            await rename(entry.backupPath, entry.filePath);
          } catch (restoreError) {
            entry.rollbackConflict = true;
            rollbackErrors.push(`${entry.filePath}: original-byte restore failed; backup was preserved at ${entry.backupPath} (${restoreError.message})`);
          }
        }
      } catch (rollbackError) {
        if (entry.targetMoved) entry.rollbackConflict = true;
        rollbackErrors.push(`${entry.filePath}: ${rollbackError.message}`);
      }
    }
    for (const entry of prepared) {
      try {
        await removeIfPresent(entry.temporaryPath);
        if (!entry.rollbackConflict) await removeIfPresent(entry.backupPath);
      } catch (cleanupError) {
        rollbackErrors.push(`${entry.filePath} cleanup: ${cleanupError.message}`);
      }
    }
    if (rollbackErrors.length > 0) {
      throw new Error(`${error.message}\nApproval write transaction rollback failed:\n${rollbackErrors.join("\n")}`);
    }
    throw error;
  }

  for (const entry of prepared) {
    await removeIfPresent(entry.temporaryPath);
    await removeIfPresent(entry.backupPath);
  }
}

function resolveApprovalReportPath(projectRoot, report) {
  invariant(typeof report === "string" && report.trim(), "Approval report path is missing");
  const reportPath = path.isAbsolute(report) ? path.resolve(report) : path.resolve(projectRoot, report);
  projectRelative(projectRoot, reportPath);
  return reportPath;
}

async function assertSafeApprovalReportPath(projectRoot, reportPath, {mustExist = false} = {}) {
  const realProjectRoot = await realpath(projectRoot);
  const parent = path.dirname(reportPath);
  let existingAncestor = parent;
  while (true) {
    try {
      const metadata = await lstat(existingAncestor);
      invariant(!metadata.isSymbolicLink(), `Approval report parent must not be a symbolic link: ${existingAncestor}`);
      invariant(metadata.isDirectory(), `Approval report parent ancestor must be a directory: ${existingAncestor}`);
      break;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      const next = path.dirname(existingAncestor);
      invariant(next !== existingAncestor, `Approval report has no existing parent inside the project root: ${reportPath}`);
      existingAncestor = next;
    }
  }
  const realAncestor = await realpath(existingAncestor);
  invariant(realAncestor === realProjectRoot || isInside(realProjectRoot, realAncestor), `Approval report parent resolves outside the project root: ${reportPath}`);
  if (existingAncestor !== parent) {
    invariant(!mustExist, `Approval report parent does not exist: ${parent}`);
    await mkdir(parent, {recursive: true});
  }
  const realParent = await realpath(parent);
  invariant(realParent === realProjectRoot || isInside(realProjectRoot, realParent), `Approval report parent resolves outside the project root: ${reportPath}`);
  try {
    const metadata = await lstat(reportPath);
    invariant(!metadata.isSymbolicLink(), `Approval report must not be a symbolic link: ${reportPath}`);
    invariant(metadata.isFile(), `Approval report must be a regular file: ${reportPath}`);
    await assertRealFileWithinProject(projectRoot, reportPath, "approval report");
  } catch (error) {
    if (error.code === "ENOENT" && !mustExist) return;
    throw error;
  }
}

function resolveRegistryModule(projectRoot, registryModule) {
  if (typeof registryModule !== "string" || !registryModule.startsWith("./")) return [];
  const stem = path.resolve(projectRoot, "packages/demos/src", registryModule.slice(2));
  return [".tsx", ".ts", ".jsx", ".js", ".mjs"].map((extension) => `${stem}${extension}`);
}

async function addExistingFile(fileSet, filePath, {projectRoot, required = false, label = "artifact"} = {}) {
  if (!filePath) return;
  let metadata;
  try {
    metadata = await stat(filePath);
  } catch (error) {
    if (error.code === "ENOENT" && !required) return;
    if (error.code === "ENOENT") throw new Error(`Required ${label} is missing: ${filePath}`);
    throw error;
  }
  if (!metadata.isFile()) {
    if (required) throw new Error(`Required ${label} is not a file: ${filePath}`);
    return;
  }
  if (projectRoot) await assertRealFileWithinProject(projectRoot, filePath, label);
  fileSet.add(path.resolve(filePath));
}

function evidencePath(projectRoot, workspace, value) {
  if (typeof value !== "string" || !value.trim()) return null;
  if (path.isAbsolute(value)) return path.resolve(value);
  if (/^(?:output|artifacts|reports|public|apps|packages|components|lib)\//.test(value)) {
    return path.resolve(projectRoot, value);
  }
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

function rendererInventoryValues(manifest) {
  const values = [];
  for (const key of IMPLEMENTATION_EVIDENCE_KEYS) values.push(manifest.implementation?.[key]);
  for (const key of WORKSPACE_EVIDENCE_KEYS) values.push(manifest.evidence?.[key]);
  return [...new Set(values
    .filter((value) => typeof value === "string" && value.trim()))];
}

async function addRendererDependency(dependencies, problems, projectRoot, filePath, {
  declaredBytes,
  declaredSha256,
  inventoryPath,
  referencedBy,
} = {}) {
  await assertRealFileWithinProject(projectRoot, filePath, "renderer dependency");
  const metadata = await stat(filePath);
  invariant(metadata.isFile(), `Renderer dependency is not a file: ${filePath}`);
  const relativePath = projectRelative(projectRoot, filePath);
  invariant(relativePath.startsWith(RENDERER_OUTPUT_ROOT), `Renderer dependency is outside ${RENDERER_OUTPUT_ROOT}: ${relativePath}`);
  const actualSha256 = await sha256File(filePath);
  if (declaredSha256 && declaredSha256 !== actualSha256) {
    problems.push(`${relativePath}: renderer inventory SHA-256 ${declaredSha256} does not match actual ${actualSha256}`);
  }
  if (Number.isInteger(declaredBytes) && declaredBytes !== metadata.size) {
    problems.push(`${relativePath}: renderer inventory bytes ${declaredBytes} do not match actual ${metadata.size}`);
  }
  const current = dependencies.get(relativePath) || {
    path: relativePath,
    bytes: metadata.size,
    sha256: actualSha256,
    inventoryPaths: [],
    referencedBy: [],
  };
  invariant(current.sha256 === actualSha256 && current.bytes === metadata.size, `${relativePath}: conflicting renderer dependency bytes`);
  if (inventoryPath) current.inventoryPaths.push(inventoryPath);
  if (referencedBy) current.referencedBy.push(referencedBy);
  current.inventoryPaths = [...new Set(current.inventoryPaths)].sort();
  current.referencedBy = [...new Set(current.referencedBy)].sort();
  dependencies.set(relativePath, current);
  return current;
}

async function addGeneratedManifestClosure(dependencies, problems, projectRoot, manifestPath, provenance = {}) {
  const manifestRelative = projectRelative(projectRoot, manifestPath);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (!manifest.generatedFiles || typeof manifest.generatedFiles !== "object" || Array.isArray(manifest.generatedFiles)) return;
  const manifestDirectory = path.dirname(manifestPath);
  for (const [generatedName, binding] of Object.entries(manifest.generatedFiles)) {
    invariant(typeof generatedName === "string" && generatedName.trim(), `${manifestRelative}: generatedFiles contains an empty path`);
    invariant(!path.isAbsolute(generatedName), `${manifestRelative}: generated file must be relative: ${generatedName}`);
    if (!/^[a-f0-9]{64}$/.test(binding?.sha256 || "")) {
      problems.push(`${manifestRelative}: generated file ${generatedName} is missing a valid SHA-256 binding`);
    }
    if (!Number.isInteger(binding?.bytes) || binding.bytes < 0) {
      problems.push(`${manifestRelative}: generated file ${generatedName} is missing a valid byte-count binding`);
    }
    const generatedPath = path.resolve(manifestDirectory, generatedName);
    invariant(isInside(manifestDirectory, generatedPath), `${manifestRelative}: generated file escapes its directory: ${generatedName}`);
    await addRendererDependency(dependencies, problems, projectRoot, generatedPath, {
      declaredBytes: binding?.bytes,
      declaredSha256: binding?.sha256,
      inventoryPath: provenance.inventoryPath || manifestRelative,
      referencedBy: manifestRelative,
    });
  }
}

async function addRendererPath(dependencies, problems, projectRoot, filePath, provenance = {}) {
  await assertRealFileWithinProject(projectRoot, filePath, "renderer dependency path");
  const metadata = await lstat(filePath);
  invariant(!metadata.isSymbolicLink(), `Renderer dependency path must not be a symbolic link: ${filePath}`);
  if (metadata.isDirectory()) {
    const entries = await readdir(filePath, {withFileTypes: true});
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      invariant(!entry.isSymbolicLink(), `Renderer dependency directory contains a symbolic link: ${path.join(filePath, entry.name)}`);
      await addRendererPath(dependencies, problems, projectRoot, path.join(filePath, entry.name), provenance);
    }
    return;
  }
  invariant(metadata.isFile(), `Renderer dependency path is neither a file nor directory: ${filePath}`);
  await addRendererDependency(dependencies, problems, projectRoot, filePath, provenance);
  if (path.basename(filePath) === "manifest.json") {
    await addGeneratedManifestClosure(dependencies, problems, projectRoot, filePath, provenance);
  }
  if (path.basename(filePath) === "index.html") {
    const siblingManifest = path.join(path.dirname(filePath), "manifest.json");
    if (await exists(siblingManifest)) {
      await addRendererDependency(dependencies, problems, projectRoot, siblingManifest, {
        referencedBy: projectRelative(projectRoot, filePath),
      });
      await addGeneratedManifestClosure(dependencies, problems, projectRoot, siblingManifest, provenance);
    }
  }
}

async function collectRendererDependencies(projectRoot, workspace, manifest, approvalArtifacts = []) {
  const dependencies = new Map();
  const problems = [];

  const sourcePaths = [...new Set(approvalArtifacts
    .map((artifact) => artifact.path)
    .filter((artifactPath) => PARSED_MODULE_EXTENSIONS.has(path.extname(artifactPath).toLowerCase()) || path.extname(artifactPath).toLowerCase() === ".css"))]
    .sort();
  for (const relativeSourcePath of sourcePaths) {
    const sourcePath = path.resolve(projectRoot, relativeSourcePath);
    await assertRealFileWithinProject(projectRoot, sourcePath, "approval source artifact");
    const source = await readFile(sourcePath, "utf8");
    for (const match of source.matchAll(/\/flash-assets\/[A-Za-z0-9._/-]+/g)) {
      const webPath = match[0].replace(/\/+$/, "");
      const {absolutePath} = resolveProjectRelativeRendererPath(projectRoot, `public${webPath}`, `${relativeSourcePath} renderer reference`);
      if (!(await exists(absolutePath))) {
        problems.push(`${relativeSourcePath}: referenced renderer output is missing: public${webPath}`);
        continue;
      }
      await addRendererPath(dependencies, problems, projectRoot, absolutePath, {referencedBy: relativeSourcePath});
    }
  }

  for (const inventoryValue of rendererInventoryValues(manifest)) {
    if (path.isAbsolute(inventoryValue)) {
      problems.push(`renderer dependency inventory must use a project-relative path: ${inventoryValue}`);
      continue;
    }
    const inventoryPath = evidencePath(projectRoot, workspace, inventoryValue);
    if (!(await exists(inventoryPath)) || path.extname(inventoryPath).toLowerCase() !== ".json") continue;
    await assertRealFileWithinProject(projectRoot, inventoryPath, "renderer dependency inventory");
    const inventoryRelative = projectRelative(projectRoot, inventoryPath);
    let inventory;
    try {
      inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
    } catch (error) {
      problems.push(`${inventoryRelative}: renderer dependency inventory is not valid JSON (${error.message})`);
      continue;
    }
    for (const binding of collectEmbeddedFileBindings(inventory)) {
      if (path.isAbsolute(binding.path)) {
        problems.push(`${inventoryRelative}: renderer binding must not be absolute: ${binding.path}`);
        continue;
      }
      const normalized = portable(path.normalize(binding.path));
      if (!normalized.startsWith(RENDERER_OUTPUT_ROOT)) continue;
      const {absolutePath} = resolveProjectRelativeRendererPath(projectRoot, normalized, `${inventoryRelative} renderer binding`);
      if (!(await exists(absolutePath))) {
        problems.push(`${inventoryRelative}: renderer dependency is missing: ${normalized}`);
        continue;
      }
      await addRendererPath(dependencies, problems, projectRoot, absolutePath, {
        declaredBytes: binding.bytes,
        declaredSha256: binding.sha256,
        inventoryPath: inventoryRelative,
      });
    }
  }

  return {
    dependencies: [...dependencies.values()].sort((left, right) => left.path.localeCompare(right.path)),
    problems: [...new Set(problems)].sort(),
  };
}

async function collectApprovalArtifacts(projectRoot, workspace, manifest, {
  schemaVersion = CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION,
  implementationClosure,
} = {}) {
  const files = new Set();
  const implementation = manifest.implementation || {};

  for (const artifact of implementationClosure?.artifacts || []) {
    if (artifact.path.startsWith(RENDERER_OUTPUT_ROOT)) continue;
    await addExistingFile(files, path.resolve(projectRoot, artifact.path), {
      projectRoot,
      required: true,
      label: "implementation artifact closure",
    });
  }

  for (const key of ["component", "timelineModule", "testFile", "routeFile"]) {
    const value = implementation[key];
    if (typeof value === "string" && value.trim()) {
      if (schemaVersion >= CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION) {
        invariant(!path.isAbsolute(value), `implementation.${key} must use a project-relative path: ${value}`);
      }
      await addExistingFile(files, path.resolve(projectRoot, value), {projectRoot, required: true, label: `implementation.${key}`});
    }
  }

  if (schemaVersion >= CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION) {
    for (const key of IMPLEMENTATION_EVIDENCE_KEYS) {
      const value = implementation[key];
      if (typeof value === "string" && value.trim()) {
        invariant(!path.isAbsolute(value), `implementation.${key} must use a project-relative path: ${value}`);
        await addExistingFile(files, evidencePath(projectRoot, workspace, value), {
          projectRoot,
          required: true,
          label: `implementation.${key}`,
        });
      }
    }
  }

  if (implementation.registryModule) {
    const candidates = resolveRegistryModule(projectRoot, implementation.registryModule);
    let found = false;
    for (const candidate of candidates) {
      if (await exists(candidate)) {
        await addExistingFile(files, candidate, {projectRoot, required: true, label: "implementation.registryModule"});
        found = true;
        break;
      }
    }
    invariant(found, `implementation.registryModule cannot be resolved: ${implementation.registryModule}`);
  }

  for (const relativePath of SHARED_RUNTIME_FILES) {
    await addExistingFile(files, path.resolve(projectRoot, relativePath), {projectRoot});
  }

  const evidence = manifest.evidence || {};
  for (const key of WORKSPACE_EVIDENCE_KEYS) {
    if (schemaVersion >= CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION && typeof evidence[key] === "string") {
      invariant(!path.isAbsolute(evidence[key]), `evidence.${key} must use a project-relative path: ${evidence[key]}`);
    }
    await addExistingFile(files, evidencePath(projectRoot, workspace, evidence[key]), {projectRoot});
  }

  const adoptionPath = evidence.currentJavaScriptImplementationCaptureAdoption?.path;
  if (schemaVersion >= CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION && typeof adoptionPath === "string") {
    invariant(!path.isAbsolute(adoptionPath), `evidence.currentJavaScriptImplementationCaptureAdoption.path must be project-relative: ${adoptionPath}`);
  }
  await addExistingFile(files, evidencePath(projectRoot, workspace, adoptionPath), {projectRoot});

  for (const capture of evidence.candidateCaptureManifests || []) {
    if (schemaVersion >= CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION && typeof capture?.path === "string") {
      invariant(!path.isAbsolute(capture.path), `evidence.candidateCaptureManifests path must be project-relative: ${capture.path}`);
    }
    await addExistingFile(files, evidencePath(projectRoot, workspace, capture?.path), {projectRoot});
  }

  const expandedFiles = await expandLocalModuleClosure(projectRoot, files);
  const artifacts = [];
  for (const absolutePath of [...expandedFiles].sort()) {
    const metadata = await stat(absolutePath);
    artifacts.push({
      path: projectRelative(projectRoot, absolutePath),
      bytes: metadata.size,
      sha256: await sha256File(absolutePath),
    });
  }
  invariant(artifacts.length > 0, `${manifest.animationId}: no current JavaScript artifacts were found`);
  return artifacts;
}

async function collectCatalogRouteProjection(projectRoot, animationId, artifacts) {
  if (!artifacts.some((artifact) => normalizeProjectPath(artifact.path) === "apps/web/lib/catalog.ts")) return null;

  const animationsPath = path.resolve(projectRoot, "catalog/animations.json");
  const ledgerPath = path.resolve(projectRoot, "catalog/completion-ledger.json");
  await assertRealFileWithinProject(projectRoot, animationsPath, "animation catalog");
  await assertRealFileWithinProject(projectRoot, ledgerPath, "completion ledger");
  const [catalog, ledger] = await Promise.all([
    readFile(animationsPath, "utf8").then(JSON.parse),
    readFile(ledgerPath, "utf8").then(JSON.parse),
  ]);
  invariant(catalog?.schemaVersion === 1 && Array.isArray(catalog.animations), "Malformed animation catalog");
  invariant(ledger?.schemaVersion === 1 && Array.isArray(ledger.entries) && Array.isArray(ledger.diagnostics), "Malformed completion ledger");
  const matches = catalog.animations.filter((animation) => animation?.animationId === animationId);
  invariant(matches.length === 1, `${animationId}: animation catalog must contain exactly one matching entry`);
  const animation = matches[0];
  const complete = new Map(ledger.entries.filter((entry) => typeof entry?.animationId === "string").map((entry) => [entry.animationId, entry])).get(animationId);
  const diagnostic = new Map(ledger.diagnostics.filter((entry) => typeof entry?.animationId === "string").map((entry) => [entry.animationId, entry])).get(animationId);
  const migrationStatus = complete?.assetId === animation.assetId
    ? "complete"
    : diagnostic?.status === "complete"
      ? "validating"
      : typeof diagnostic?.status === "string" && diagnostic.status
        ? diagnostic.status
        : "discovered";
  return {animation, migrationStatus};
}

function approvalProjection(manifest, artifacts, rendererDependencies, catalogProjection, schemaVersion) {
  const projection = {
    animationId: manifest.animationId,
    sourceSwfSha256: manifest.source?.swf?.sha256 || manifest.source?.sha256 || "",
    movie: manifest.movie || null,
    implementation: manifest.implementation || null,
    artifacts,
  };
  if (schemaVersion >= CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION) {
    projection.rendererDependencies = rendererDependencies;
    projection.catalogProjection = catalogProjection;
  }
  return projection;
}

function previousApprovalSnapshot(value) {
  if (!value || typeof value !== "object") return null;
  const snapshot = {
    decision: value.decision || "",
    priorDecision: value.priorDecision || "",
    reviewer: value.reviewer || "",
    reviewedAt: value.reviewedAt || "",
    invalidatedAt: value.invalidatedAt || "",
    invalidationReason: value.invalidationReason || "",
    scope: value.scope || "",
  };
  return Object.values(snapshot).some(Boolean) ? snapshot : null;
}

function approvalHistory(value) {
  const history = Array.isArray(value?.history)
    ? value.history.map(previousApprovalSnapshot).filter(Boolean)
    : [];
  const snapshot = previousApprovalSnapshot(value);
  if (snapshot) history.push(snapshot);
  return history;
}

function amendmentMutableEvidencePrefix(animationId) {
  return `migrations/${animationId}/evidence/`;
}

function protectedArtifactPaths(pilot) {
  const protectedPaths = new Set();
  const implementation = pilot.manifest?.implementation || {};
  for (const key of ["component", "timelineModule", "testFile", "routeFile"]) {
    const value = implementation[key];
    if (typeof value === "string" && value.trim()) protectedPaths.add(normalizeProjectPath(value));
  }
  for (const dependency of pilot.rendererDependencies || []) protectedPaths.add(normalizeProjectPath(dependency.path));
  for (const artifact of pilot.artifacts || []) {
    const artifactPath = normalizeProjectPath(artifact.path);
    if (!artifactPath.startsWith(amendmentMutableEvidencePrefix(pilot.animationId))) protectedPaths.add(artifactPath);
  }
  return protectedPaths;
}

function normalizedBoundFile(value) {
  return {
    path: normalizeProjectPath(value.path),
    bytes: value.bytes,
    sha256: value.sha256,
  };
}

function normalizedRendererDependency(value) {
  return {
    ...normalizedBoundFile(value),
    inventoryPaths: [...(value.inventoryPaths || [])].map(normalizeProjectPath).sort(),
    referencedBy: [...(value.referencedBy || [])].map(normalizeProjectPath).sort(),
  };
}

function assertSameBoundSet(recordedValues, currentValues, label) {
  const recorded = [...recordedValues].map(normalizedBoundFile).sort((a, b) => a.path.localeCompare(b.path));
  const current = [...currentValues].map(normalizedBoundFile).sort((a, b) => a.path.localeCompare(b.path));
  invariant(
    JSON.stringify(recorded) === JSON.stringify(current),
    `${label} changed; fresh human approval is required`,
  );
}

function assertSafeBindingAmendment(recorded, current) {
  invariant(recorded, `${current.animationId}: existing approval animation record is missing`);
  invariant(recorded.route === current.route, `${current.animationId}: implementation route changed; fresh human approval is required`);
  invariant(
    stableJson(recorded.catalogProjection) === stableJson(current.catalogProjection),
    `${current.animationId}: route-visible catalog projection changed; fresh human approval is required`,
  );

  const protectedPaths = protectedArtifactPaths(current);
  for (const artifact of recorded.artifacts || []) {
    const artifactPath = normalizeProjectPath(artifact.path);
    if (!artifactPath.startsWith(amendmentMutableEvidencePrefix(current.animationId))) protectedPaths.add(artifactPath);
  }
  const recordedArtifacts = (recorded.artifacts || []).filter((artifact) => protectedPaths.has(normalizeProjectPath(artifact.path)));
  const currentArtifacts = (current.artifacts || []).filter((artifact) => protectedPaths.has(normalizeProjectPath(artifact.path)));
  assertSameBoundSet(recordedArtifacts, currentArtifacts, `${current.animationId}: protected JavaScript artifact set`);

  const recordedRenderer = [...(recorded.rendererDependencies || [])]
    .map(normalizedRendererDependency)
    .sort((a, b) => a.path.localeCompare(b.path));
  const currentRenderer = [...(current.rendererDependencies || [])]
    .map(normalizedRendererDependency)
    .sort((a, b) => a.path.localeCompare(b.path));
  invariant(
    JSON.stringify(recordedRenderer) === JSON.stringify(currentRenderer),
    `${current.animationId}: renderer dependency closure changed; fresh human approval is required`,
  );
}

function parseArguments(argv) {
  const options = {animationIds: []};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--check") options.check = true;
    else if (value === "--amend-binding") options.amendBinding = true;
    else if (value === "--all-pilots") options.allPilots = true;
    else if (["--reviewer", "--reviewed-at", "--source-message", "--animation", "--project-root", "--report", "--amendment-reason"].includes(value)) {
      const next = argv[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--reviewer") options.reviewer = next;
      else if (value === "--reviewed-at") options.reviewedAt = next;
      else if (value === "--source-message") options.sourceMessage = next;
      else if (value === "--animation") options.animationIds.push(next);
      else if (value === "--project-root") options.projectRoot = next;
      else if (value === "--report") options.report = next;
      else if (value === "--amendment-reason") options.amendmentReason = next;
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/record-current-javascript-output-approval.mjs --all-pilots \\
    --reviewer <human-source-label> --reviewed-at <ISO timestamp> \\
    --source-message <exact approval statement>

  node scripts/record-current-javascript-output-approval.mjs --check
  node scripts/record-current-javascript-output-approval.mjs --amend-binding \
    [--amendment-reason <why bindings changed while JavaScript output did not>]

This records only the project user's scope-limited approval of the JavaScript
outputs that exist at the stated review time. It never signs strict human visual
review, owner acceptance, audio acceptance, Flash fidelity, or completion.
Binding amendments allow migration evidence refreshes only and fail if protected
JavaScript, routes, tests, shared runtime, or renderer dependencies changed.`;
}

function selectedPilotIds(options) {
  const known = PILOT_MIGRATIONS.map((pilot) => pilot.id);
  if (options.allPilots) return known;
  if (options.animationIds?.length) {
    for (const animationId of options.animationIds) invariant(known.includes(animationId), `Unknown pilot: ${animationId}`);
    return [...new Set(options.animationIds)];
  }
  throw new Error("Select --all-pilots or one or more --animation values");
}

async function inspectPilot(projectRoot, animationId, {schemaVersion = CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION} = {}) {
  const workspace = path.resolve(projectRoot, "migrations", animationId);
  const manifestPath = path.join(workspace, "migration.json");
  await assertRealFileWithinProject(projectRoot, manifestPath, "migration manifest");
  const manifestText = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestText);
  invariant(manifest.animationId === animationId, `${animationId}: migration.json animationId mismatch`);
  const implementationClosure = await collectImplementationArtifactClosure({projectRoot, workspace, manifest});
  const artifacts = await collectApprovalArtifacts(projectRoot, workspace, manifest, {
    schemaVersion,
    implementationClosure,
  });
  const renderer = await collectRendererDependencies(projectRoot, workspace, manifest, artifacts);
  const catalogProjection = schemaVersion >= CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION
    ? await collectCatalogRouteProjection(projectRoot, animationId, artifacts)
    : null;
  const projection = approvalProjection(manifest, artifacts, renderer.dependencies, catalogProjection, schemaVersion);
  return {
    animationId,
    workspace,
    manifestPath,
    manifestText,
    manifest,
    route: manifest.implementation?.route || "",
    previousApproval: previousApprovalSnapshot(manifest.acceptance?.currentJavaScriptOutputApproval),
    artifacts,
    rendererDependencies: renderer.dependencies,
    rendererDependencyProblems: renderer.problems,
    catalogProjection,
    artifactBindingSha256: sha256(stableJson(projection)),
  };
}

async function assertNoExistingApprovalSetIsOrphaned(projectRoot, requestedAnimationIds, inspected) {
  const requested = new Set(requestedAnimationIds);
  const checkedReports = new Map();
  for (const pilot of inspected) {
    const previous = pilot.manifest.acceptance?.currentJavaScriptOutputApproval;
    if (previous?.decision !== "accepted" || typeof previous.approvalRecord !== "string" || !previous.approvalRecord.trim()) continue;
    let existingIds = checkedReports.get(previous.approvalRecord);
    if (!existingIds) {
      const existingPath = resolveApprovalReportPath(projectRoot, previous.approvalRecord);
      await assertSafeApprovalReportPath(projectRoot, existingPath, {mustExist: true});
      const existing = JSON.parse(await readFile(existingPath, "utf8"));
      invariant(existing?.evidenceType === "human-current-javascript-output-approval" && Array.isArray(existing.animations), `${pilot.animationId}: referenced approval report is invalid; refusing to replace a possibly shared approval slot`);
      existingIds = existing.animations.map((animation) => animation?.animationId);
      invariant(existingIds.every((animationId) => typeof animationId === "string" && animationId.trim()) && new Set(existingIds).size === existingIds.length, `${pilot.animationId}: referenced approval report animation set is invalid`);
      checkedReports.set(previous.approvalRecord, existingIds);
    }
    const omitted = existingIds.filter((animationId) => !requested.has(animationId));
    invariant(omitted.length === 0, `${pilot.animationId}: selected manifest belongs to a larger existing approval set; reapprove the complete set to avoid orphaning ${omitted.join(", ")}`);
  }
}

export async function recordCurrentJavaScriptOutputApproval({
  projectRoot = defaultProjectRoot,
  report = DEFAULT_CURRENT_JAVASCRIPT_APPROVAL_REPORT,
  animationIds,
  reviewer,
  reviewedAt,
  sourceMessage,
}) {
  projectRoot = path.resolve(projectRoot);
  const reportPath = resolveApprovalReportPath(projectRoot, report);
  await assertSafeApprovalReportPath(projectRoot, reportPath);
  const reportExpectedBefore = await readOptionalFile(reportPath);
  invariant(typeof reviewer === "string" && reviewer.trim(), "--reviewer is required");
  invariant(validReviewedAt(reviewedAt), "--reviewed-at must be a valid, non-future timestamp");
  invariant(typeof sourceMessage === "string" && sourceMessage.trim(), "--source-message is required");
  invariant(Array.isArray(animationIds) && animationIds.length > 0, "At least one animationId is required");
  invariant(new Set(animationIds).size === animationIds.length, "animationIds must be unique");
  if (reportExpectedBefore !== null) {
    let existingRecord;
    try {
      existingRecord = JSON.parse(reportExpectedBefore.toString("utf8"));
    } catch (error) {
      throw new Error(`Existing approval report is invalid JSON and will not be overwritten: ${error.message}`);
    }
    invariant(existingRecord?.evidenceType === "human-current-javascript-output-approval", "Existing report path is not a current JavaScript approval record; use a distinct report path");
    invariant(Array.isArray(existingRecord.animations), "Existing approval report has no animation set; use a distinct report path");
    const existingIds = existingRecord.animations.map((animation) => animation?.animationId);
    invariant(existingIds.every((animationId) => typeof animationId === "string" && animationId.trim()) && new Set(existingIds).size === existingIds.length, "Existing approval report animation set is invalid; use a distinct report path");
    const existingSet = [...existingIds].sort();
    const requestedSet = [...animationIds].sort();
    invariant(JSON.stringify(existingSet) === JSON.stringify(requestedSet), "Existing approval report animation set differs; reapprove the complete existing set instead of replacing a subset");
  }

  const inspected = [];
  for (const animationId of animationIds) inspected.push(await inspectPilot(projectRoot, animationId));
  for (const pilot of inspected) {
    invariant(pilot.rendererDependencyProblems.length === 0, `${pilot.animationId}: renderer dependency closure is invalid\n${pilot.rendererDependencyProblems.join("\n")}`);
  }
  await assertNoExistingApprovalSetIsOrphaned(projectRoot, animationIds, inspected);

  const record = {
    schemaVersion: CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION,
    evidenceType: "human-current-javascript-output-approval",
    generator: {
      script: "scripts/record-current-javascript-output-approval.mjs",
      version: CURRENT_JAVASCRIPT_APPROVAL_GENERATOR_VERSION,
    },
    decision: "accepted",
    reviewer,
    reviewedAt,
    sourceMessage,
    scope: CURRENT_JS_SCOPE,
    authorityBoundary: {
      strictHumanVisualReview: false,
      ownerAcceptance: false,
      authoritativeFlashBaseline: false,
      visualOrBehavioralParity: false,
      audioAcceptance: false,
      strictMigrationCompletion: false,
      note: CURRENT_JS_AUTHORITY_NOTE,
    },
    artifactBindingPolicy: {
      included: CURRENT_JS_ARTIFACT_BINDING_INCLUDED,
      excluded: CURRENT_JS_ARTIFACT_BINDING_EXCLUDED,
    },
    summary: {
      animations: inspected.length,
      previouslyAccepted: inspected.filter((pilot) => pilot.previousApproval?.decision === "accepted").length,
      renewedFromStale: inspected.filter((pilot) => pilot.previousApproval?.decision === "stale").length,
    },
    animations: inspected.map((pilot) => ({
      animationId: pilot.animationId,
      route: pilot.route,
      previousApproval: pilot.previousApproval,
      artifactBindingSha256: pilot.artifactBindingSha256,
      artifacts: pilot.artifacts,
      rendererDependencies: pilot.rendererDependencies,
      catalogProjection: pilot.catalogProjection,
      approvalHistory: approvalHistory(pilot.manifest.acceptance?.currentJavaScriptOutputApproval),
    })),
  };

  const recordProblems = currentApprovalRecordErrors(record);
  invariant(recordProblems.length === 0, recordProblems.join("\n"));

  const reportText = stableJson(record);
  const reportSha256 = sha256(reportText);
  const reportRelative = projectRelative(projectRoot, reportPath);

  const writes = [{filePath: reportPath, value: reportText, expectedBefore: reportExpectedBefore}];
  for (const pilot of inspected) {
    const manifest = pilot.manifest;
    manifest.acceptance ||= {};
    const previous = manifest.acceptance.currentJavaScriptOutputApproval;
    manifest.acceptance.currentJavaScriptOutputApproval = {
      decision: "accepted",
      reviewer,
      reviewedAt,
      sourceMessage,
      scope: CURRENT_JS_SCOPE,
      approvalRecord: reportRelative,
      approvalRecordSha256: reportSha256,
      artifactBindingSha256: pilot.artifactBindingSha256,
      strictHumanReviewEffect: CURRENT_JS_STRICT_HUMAN_REVIEW_EFFECT,
      history: record.animations.find((animation) => animation.animationId === pilot.animationId).approvalHistory,
    };
    // Preserve the migration manifest's established key order. Re-sorting the
    // entire document would create unrelated byte churn and stale downstream
    // technical evidence even though only the approval record changed.
    writes.push({filePath: pilot.manifestPath, value: `${JSON.stringify(manifest, null, 2)}\n`, expectedBefore: pilot.manifestText});
  }
  await writeApprovalTransaction(writes);

  return {reportPath, reportSha256, record};
}

function manifestApprovalMirrorErrors({approval, record, recorded, reportRelative, reportSha256, label}) {
  const errors = unexpectedKeys(approval, CURRENT_JS_MANIFEST_APPROVAL_KEYS, `${label} manifest currentJavaScriptOutputApproval`);
  if (approval?.decision !== "accepted") errors.push(`${label}: manifest current JavaScript approval is not accepted`);
  if (approval?.reviewer !== record.reviewer) errors.push(`${label}: manifest approval reviewer does not match approval report`);
  if (approval?.reviewedAt !== record.reviewedAt) errors.push(`${label}: manifest approval reviewedAt does not match approval report`);
  if (approval?.sourceMessage !== record.sourceMessage) errors.push(`${label}: manifest approval sourceMessage does not match approval report`);
  if (approval?.scope !== record.scope) errors.push(`${label}: manifest approval scope does not match approval report`);
  if (approval?.approvalRecord !== reportRelative) errors.push(`${label}: manifest approvalRecord path does not match approval report`);
  if (approval?.approvalRecordSha256 !== reportSha256) errors.push(`${label}: manifest approval report hash mismatch`);
  if (approval?.artifactBindingSha256 !== recorded?.artifactBindingSha256) errors.push(`${label}: manifest artifact binding mismatch`);
  if (approval?.strictHumanReviewEffect !== CURRENT_JS_STRICT_HUMAN_REVIEW_EFFECT) errors.push(`${label}: manifest strictHumanReviewEffect is invalid`);
  if (!Array.isArray(approval?.history)) {
    errors.push(`${label}: manifest approval history must be an array`);
  } else {
    for (const [index, historyEntry] of approval.history.entries()) {
      errors.push(...approvalHistoryEntryErrors(historyEntry, `${label} manifest approval history[${index}]`));
    }
    if (!Array.isArray(recorded?.approvalHistory) || stableJson(approval.history) !== stableJson(recorded.approvalHistory)) {
      errors.push(`${label}: manifest approval history does not match approval report`);
    }
  }
  if (record.bindingAmendment) {
    if (approval?.bindingAmendedAt !== record.bindingAmendment.amendedAt) errors.push(`${label}: manifest bindingAmendedAt does not match approval report`);
    if (approval?.bindingAmendmentReason !== record.bindingAmendment.reason) errors.push(`${label}: manifest bindingAmendmentReason does not match approval report`);
  } else if (approval?.bindingAmendedAt !== undefined || approval?.bindingAmendmentReason !== undefined) {
    errors.push(`${label}: manifest contains binding-amendment fields that are absent from the approval report`);
  }
  return errors;
}

export async function amendCurrentJavaScriptOutputApprovalBinding({
  projectRoot = defaultProjectRoot,
  report = DEFAULT_CURRENT_JAVASCRIPT_APPROVAL_REPORT,
  amendmentReason = "Corrected the artifact binding boundary so mutable coverage/status bookkeeping cannot invalidate an unchanged JavaScript output. The human decision, reviewer label, review time, source statement, scope, and authority limits are unchanged.",
} = {}) {
  projectRoot = path.resolve(projectRoot);
  const reportPath = resolveApprovalReportPath(projectRoot, report);
  await assertSafeApprovalReportPath(projectRoot, reportPath, {mustExist: true});
  const previousText = await readFile(reportPath, "utf8");
  const previous = JSON.parse(previousText);
  invariant(previous.evidenceType === "human-current-javascript-output-approval", "Existing approval report has the wrong evidenceType");
  invariant(previous.decision === "accepted", "Existing approval report is not accepted");
  invariant(previous.schemaVersion === CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION, `Approval schema v${previous.schemaVersion || "unknown"} cannot be amended to v${CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION}; the expanded renderer dependency boundary requires fresh human approval`);
  const recordProblems = currentApprovalRecordErrors(previous);
  invariant(recordProblems.length === 0, recordProblems.join("\n"));
  invariant(validReviewedAt(previous.reviewedAt), "Existing approval report reviewedAt is invalid");
  invariant(typeof previous.reviewer === "string" && previous.reviewer.trim(), "Existing approval report reviewer is missing");
  invariant(typeof previous.sourceMessage === "string" && previous.sourceMessage.trim(), "Existing approval report sourceMessage is missing");
  invariant(previous.scope === CURRENT_JS_SCOPE, "Existing approval report scope is invalid");
  invariant(Array.isArray(previous.animations) && previous.animations.length > 0, "Existing approval report has no animations");

  const inspected = [];
  for (const recorded of previous.animations) inspected.push(await inspectPilot(projectRoot, recorded.animationId));
  for (const pilot of inspected) {
    invariant(pilot.rendererDependencyProblems.length === 0, `${pilot.animationId}: renderer dependency closure is invalid\n${pilot.rendererDependencyProblems.join("\n")}`);
  }
  const previousById = new Map(previous.animations.map((animation) => [animation.animationId, animation]));
  invariant(previousById.size === inspected.length, "Existing approval animation set changed; fresh human approval is required");
  const previousReportSha256 = sha256(previousText);
  const reportRelative = projectRelative(projectRoot, reportPath);
  for (const pilot of inspected) {
    const recorded = previousById.get(pilot.animationId);
    const mirrorProblems = manifestApprovalMirrorErrors({
      approval: pilot.manifest.acceptance?.currentJavaScriptOutputApproval,
      record: previous,
      recorded,
      reportRelative,
      reportSha256: previousReportSha256,
      label: pilot.animationId,
    });
    invariant(mirrorProblems.length === 0, mirrorProblems.join("\n"));
  }
  for (const pilot of inspected) assertSafeBindingAmendment(previousById.get(pilot.animationId), pilot);
  const amendedAt = new Date().toISOString();
  invariant(typeof amendmentReason === "string" && amendmentReason.trim().length >= 20, "Binding amendment reason must explain why the JavaScript output is unchanged");
  const record = {
    ...previous,
    generator: {
      script: "scripts/record-current-javascript-output-approval.mjs",
      version: CURRENT_JAVASCRIPT_APPROVAL_GENERATOR_VERSION,
    },
    artifactBindingPolicy: {
      included: CURRENT_JS_ARTIFACT_BINDING_INCLUDED,
      excluded: CURRENT_JS_ARTIFACT_BINDING_EXCLUDED,
    },
    bindingAmendment: {
      amendedAt,
      reason: amendmentReason,
      priorReportSha256: sha256(previousText),
      humanDecisionChanged: false,
    },
    animations: inspected.map((pilot) => ({
      animationId: pilot.animationId,
      route: pilot.route,
      previousApproval: previousById.get(pilot.animationId)?.previousApproval || null,
      artifactBindingSha256: pilot.artifactBindingSha256,
      artifacts: pilot.artifacts,
      rendererDependencies: pilot.rendererDependencies,
      catalogProjection: pilot.catalogProjection,
      approvalHistory: previousById.get(pilot.animationId)?.approvalHistory || [],
    })),
  };

  const amendedRecordProblems = currentApprovalRecordErrors(record);
  invariant(amendedRecordProblems.length === 0, amendedRecordProblems.join("\n"));

  const reportText = stableJson(record);
  const reportSha256 = sha256(reportText);
  const writes = [{filePath: reportPath, value: reportText, expectedBefore: previousText}];
  for (const pilot of inspected) {
    const manifest = pilot.manifest;
    const approval = manifest.acceptance?.currentJavaScriptOutputApproval;
    invariant(approval?.decision === "accepted", `${pilot.animationId}: current JavaScript approval is not accepted`);
    approval.approvalRecord = reportRelative;
    approval.approvalRecordSha256 = reportSha256;
    approval.artifactBindingSha256 = pilot.artifactBindingSha256;
    approval.bindingAmendedAt = amendedAt;
    approval.bindingAmendmentReason = amendmentReason;
    writes.push({filePath: pilot.manifestPath, value: `${JSON.stringify(manifest, null, 2)}\n`, expectedBefore: pilot.manifestText});
  }
  await writeApprovalTransaction(writes);
  return {reportPath, reportSha256, record};
}

export async function verifyCurrentJavaScriptOutputApproval({
  projectRoot = defaultProjectRoot,
  report = DEFAULT_CURRENT_JAVASCRIPT_APPROVAL_REPORT,
} = {}) {
  projectRoot = path.resolve(projectRoot);
  const reportPath = resolveApprovalReportPath(projectRoot, report);
  await assertSafeApprovalReportPath(projectRoot, reportPath, {mustExist: true});
  const reportText = await readFile(reportPath, "utf8");
  const record = JSON.parse(reportText);
  const reportSha256 = sha256(reportText);
  const errors = [];

  if (record.evidenceType !== "human-current-javascript-output-approval") errors.push("approval report evidenceType is invalid");
  if (record.decision !== "accepted") errors.push("approval report decision is not accepted");
  if (record.schemaVersion !== CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION) {
    errors.push(`approval report schemaVersion ${record.schemaVersion || "unknown"} is unsupported`);
  }
  if (record.schemaVersion === CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION) errors.push(...currentApprovalRecordErrors(record));
  if (!validReviewedAt(record.reviewedAt)) errors.push("approval report reviewedAt is invalid");
  if (typeof record.reviewer !== "string" || !record.reviewer.trim()) errors.push("approval report reviewer is missing");
  if (typeof record.sourceMessage !== "string" || !record.sourceMessage.trim()) errors.push("approval report sourceMessage is missing");
  if (record.scope !== CURRENT_JS_SCOPE) errors.push("approval report scope is invalid");
  if (record.schemaVersion !== CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION) errors.push(...authorityBoundaryErrors(record.authorityBoundary));
  if (!Array.isArray(record.animations) || record.animations.length === 0) {
    errors.push("approval report must bind at least one animation");
  } else {
    const animationIds = record.animations.map((animation) => animation?.animationId);
    if (animationIds.some((animationId) => typeof animationId !== "string" || !animationId.trim())) {
      errors.push("approval report contains an animation without a valid animationId");
    }
    if (new Set(animationIds).size !== animationIds.length) errors.push("approval report contains duplicate animationIds");
    if (record.summary?.animations !== record.animations.length) errors.push("approval report summary animation count mismatch");
  }

  const reportRelative = projectRelative(projectRoot, reportPath);
  for (const recorded of Array.isArray(record.animations) ? record.animations : []) {
    try {
      const schemaVersion = CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION;
      const current = await inspectPilot(projectRoot, recorded.animationId, {schemaVersion});
      for (const problem of current.rendererDependencyProblems) errors.push(`${recorded.animationId}: ${problem}`);
      if (current.artifactBindingSha256 !== recorded.artifactBindingSha256) {
        errors.push(`${recorded.animationId}: current JavaScript artifact binding changed`);
      }
      if (!Array.isArray(recorded.rendererDependencies)) {
        errors.push(`${recorded.animationId}: approval schema v3 renderer dependency closure is missing`);
      }
      if (schemaVersion >= CURRENT_JAVASCRIPT_APPROVAL_SCHEMA_VERSION && stableJson(recorded.catalogProjection) !== stableJson(current.catalogProjection)) {
        errors.push(`${recorded.animationId}: route-visible catalog projection changed`);
      }
      errors.push(...manifestApprovalMirrorErrors({
        approval: current.manifest.acceptance?.currentJavaScriptOutputApproval,
        record,
        recorded,
        reportRelative,
        reportSha256,
        label: recorded.animationId,
      }));
    } catch (error) {
      errors.push(`${recorded.animationId}: ${error.message}`);
    }
  }

  return {ok: errors.length === 0, errors, reportPath, reportSha256, animations: record.animations?.length || 0};
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (options.check) {
    const result = await verifyCurrentJavaScriptOutputApproval({projectRoot: options.projectRoot, report: options.report});
    if (!result.ok) throw new Error(result.errors.join("\n"));
    process.stdout.write(`${JSON.stringify({status: "pass", animations: result.animations, report: projectRelative(path.resolve(options.projectRoot || defaultProjectRoot), result.reportPath), sha256: result.reportSha256}, null, 2)}\n`);
    return;
  }
  if (options.amendBinding) {
    const result = await amendCurrentJavaScriptOutputApprovalBinding({projectRoot: options.projectRoot, report: options.report, amendmentReason: options.amendmentReason});
    process.stdout.write(`${JSON.stringify({status: "binding-amended", animations: result.record.animations.length, report: projectRelative(path.resolve(options.projectRoot || defaultProjectRoot), result.reportPath), sha256: result.reportSha256, humanDecisionChanged: false}, null, 2)}\n`);
    return;
  }
  const pilotIds = selectedPilotIds(options);
  const result = await recordCurrentJavaScriptOutputApproval({
    projectRoot: options.projectRoot,
    report: options.report,
    animationIds: pilotIds,
    reviewer: options.reviewer,
    reviewedAt: options.reviewedAt,
    sourceMessage: options.sourceMessage,
  });
  process.stdout.write(`${JSON.stringify({status: "recorded", animations: pilotIds.length, report: projectRelative(path.resolve(options.projectRoot || defaultProjectRoot), result.reportPath), sha256: result.reportSha256}, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
