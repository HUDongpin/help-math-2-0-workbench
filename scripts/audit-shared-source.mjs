#!/usr/bin/env node

/**
 * Audit the private G6-G8 shared source view and emit a deterministic,
 * source-backed lesson/page projection.  This command is intentionally an
 * audit/intake boundary: it never copies source bytes into the repository and
 * never changes Current-JS, fidelity, audio, review, Owner, strict, release,
 * or publication state.
 */

import {access, mkdir, readFile, rename, rm, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {pathToFileURL} from "node:url";

import {
  ExternalSourceRootMissingError,
  buildSharedCatalog,
  readJsonl,
  stableJson,
  validateGradeMapping,
  validateSharedCatalog,
  validateSharedProfile,
} from "./lib/g678-shared-catalog.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const DEFAULT_PROFILE = "catalog/g678-shared-source-profile.v1.json";
export const DEFAULT_MAPPING = "catalog/g678-grade-mapping.v1.json";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function parsePath(value, label) {
  invariant(typeof value === "string" && value.length > 0, `${label} requires a path`);
  return value;
}

export function parseArguments(argv) {
  const options = {
    mode: "check",
    profile: DEFAULT_PROFILE,
    mapping: DEFAULT_MAPPING,
    sourceRoot: null,
    classificationManifest: null,
    dependencyManifest: null,
    output: null,
    strictCounts: false,
    requireSource: false,
    includeVariants: false,
  };
  let explicitMode = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check" || argument === "--write") {
      invariant(!explicitMode, "choose exactly one of --check or --write");
      explicitMode = true;
      options.mode = argument.slice(2);
      continue;
    }
    const next = () => {
      index += 1;
      invariant(index < argv.length, `${argument} requires a value`);
      return argv[index];
    };
    if (argument === "--profile") {
      options.profile = parsePath(next(), "--profile");
      continue;
    }
    if (argument === "--mapping") {
      options.mapping = parsePath(next(), "--mapping");
      continue;
    }
    if (argument === "--source-root") {
      options.sourceRoot = parsePath(next(), "--source-root");
      continue;
    }
    if (argument === "--classification-manifest") {
      options.classificationManifest = parsePath(next(), "--classification-manifest");
      continue;
    }
    if (argument === "--missing-dependencies") {
      options.dependencyManifest = parsePath(next(), "--missing-dependencies");
      continue;
    }
    if (argument === "--output") {
      options.output = parsePath(next(), "--output");
      continue;
    }
    if (argument === "--strict-counts") {
      options.strictCounts = true;
      continue;
    }
    if (argument === "--require-source") {
      options.requireSource = true;
      continue;
    }
    if (argument === "--include-variants") {
      options.includeVariants = true;
      continue;
    }
    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }
    throw new Error(`unknown argument: ${argument}`);
  }
  if (options.mode === "write") {
    invariant(options.output, "--write requires --output");
    invariant(
      options.sourceRoot || process.env.HELP_MATH_G678_SOURCE_ROOT,
      "--write requires --source-root or HELP_MATH_G678_SOURCE_ROOT",
    );
  }
  return Object.freeze(options);
}

function projectPath(value) {
  if (path.isAbsolute(value)) return value;
  return path.resolve(PROJECT_ROOT, value);
}

async function readJsonFile(filePath, label) {
  const absolute = projectPath(filePath);
  let text;
  try {
    text = await readFile(absolute, "utf8");
  } catch (error) {
    throw new Error(`${label} unavailable: ${absolute}: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} invalid JSON: ${absolute}: ${error.message}`);
  }
}

async function optionalJsonl(filePath, label) {
  if (!filePath) return [];
  try {
    return await readJsonl(projectPath(filePath));
  } catch (error) {
    throw new Error(`${label} unavailable: ${error.message}`);
  }
}

async function pathExists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function resolveSourceRoot(options, profile) {
  const configured = options.sourceRoot || process.env[profile.sourceView?.rootEnv ?? "HELP_MATH_G678_SOURCE_ROOT"];
  if (!configured) return null;
  const absolute = projectPath(configured);
  if (await pathExists(path.join(absolute, profile.sourceView?.relativeRoot ?? "G6-G8-shared"))) {
    return path.join(absolute, profile.sourceView?.relativeRoot ?? "G6-G8-shared");
  }
  return absolute;
}

export function helpText() {
  return `G6-G8 shared source audit\n\nUsage:\n  node scripts/audit-shared-source.mjs --check [options]\n  node scripts/audit-shared-source.mjs --write --source-root <private-root> --output <catalog.json> [options]\n\nOptions:\n  --profile <path>                 source profile (default ${DEFAULT_PROFILE})\n  --mapping <path>                 Common Core mapping (default ${DEFAULT_MAPPING})\n  --source-root <path>             private G6-G8-shared root (or parent)\n  --classification-manifest <path> optional classification JSONL\n  --missing-dependencies <path>    optional dependency JSONL\n  --output <path>                  deterministic catalog output/check target\n  --strict-counts                  enforce profile lesson/page denominators\n  --require-source                 fail when private source root is absent\n  --include-variants               retain variant candidates in projection\n`;
}

function summary(catalog) {
  return {
    catalogKind: catalog.catalogKind,
    profileId: catalog.profileId,
    status: "source-audit-complete",
    canonicalLessonXmlCount: catalog.canonicalLessonXmlCount,
    activePagePlacementCount: catalog.activePagePlacementCount,
    uniqueActiveSwfSha256Count: catalog.uniqueActiveSwfSha256Count,
    missingSources: catalog.audit.missingSources.length,
    unknownSwfMagic: catalog.audit.unknownSwfMagic.length,
    variantPlacements: catalog.audit.variantPlacements,
    dependencyHolds: catalog.audit.dependencyHolds,
    audioCandidatePages: catalog.audit.audioCandidatePages,
    acceptanceEffects: catalog.acceptanceEffects,
  };
}

async function writeNoReplace(outputPath, bytes) {
  const absolute = projectPath(outputPath);
  invariant(!(await pathExists(absolute)), `refusing to overwrite existing output: ${absolute}`);
  await mkdir(path.dirname(absolute), {recursive: true});
  const temporary = `${absolute}.staging-${process.pid}-${Date.now()}`;
  try {
    await writeFile(temporary, bytes, {encoding: "utf8", flag: "wx"});
    await rename(temporary, absolute);
  } catch (error) {
    await rm(temporary, {force: true}).catch(() => {});
    throw error;
  }
}

export async function runAudit(options) {
  if (options.help) return {help: helpText()};
  const profile = await readJsonFile(options.profile, "profile");
  const mapping = await readJsonFile(options.mapping, "mapping");
  const profileErrors = validateSharedProfile(profile);
  const mappingErrors = validateGradeMapping(mapping, profile);
  invariant(profileErrors.length === 0, profileErrors.join("; "));
  invariant(mappingErrors.length === 0, mappingErrors.join("; "));
  const sourceRoot = await resolveSourceRoot(options, profile);
  if (!sourceRoot) {
    const result = {
      status: "blocked",
      code: "BLOCKED_EXTERNAL_SOURCE_ROOT_MISSING",
      message: `Set ${profile.sourceView?.rootEnv ?? "HELP_MATH_G678_SOURCE_ROOT"} or pass --source-root to audit private bytes.`,
      profileId: profile.profileId,
      mappingId: mapping.mappingId,
      acceptanceEffects: profile.acceptanceEffects,
    };
    if (options.requireSource || options.mode === "write") {
      const error = new ExternalSourceRootMissingError(profile.sourceView?.rootEnv ?? "<unset>");
      error.result = result;
      throw error;
    }
    return result;
  }
  const classificationRows = await optionalJsonl(options.classificationManifest, "classification manifest");
  const dependencyRows = await optionalJsonl(options.dependencyManifest, "dependency manifest");
  const catalog = await buildSharedCatalog({
    sourceRoot,
    profile,
    classificationRows,
    dependencyRows,
    includeVariants: options.includeVariants,
  });
  const catalogErrors = validateSharedCatalog(catalog, profile, {strictCounts: options.strictCounts});
  invariant(catalogErrors.length === 0, catalogErrors.join("; "));
  const bytes = stableJson(catalog);
  if (options.output) {
    const outputPath = projectPath(options.output);
    if (options.mode === "check") {
      let existing;
      try {
        existing = await readFile(outputPath, "utf8");
      } catch (error) {
        if (error?.code === "ENOENT") throw new Error(`check output missing: ${outputPath}`);
        throw error;
      }
      invariant(existing === bytes, `deterministic output drift: ${outputPath}`);
    } else {
      await writeNoReplace(options.output, bytes);
    }
  }
  return {status: "ok", summary: summary(catalog), catalog: options.output ? undefined : catalog};
}

const invokedDirectly = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;

if (invokedDirectly) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(helpText());
    } else {
      const result = await runAudit(options);
      process.stdout.write(`${JSON.stringify(result.summary ?? result)}\n`);
    }
  } catch (error) {
    if (error?.result) {
      process.stdout.write(`${JSON.stringify(error.result)}\n`);
    } else {
      process.stderr.write(`${error.message}\n`);
    }
    process.exitCode = 1;
  }
}
