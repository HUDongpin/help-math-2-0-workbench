#!/usr/bin/env node

import {createHash} from "node:crypto";
import {chmod, lstat, mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEFAULT_LIVE_JSON = path.join(ROOT, "reports", "g4-l3-animate-authoring-audit-index.json");
const DEFAULT_LIVE_MARKDOWN = path.join(ROOT, "reports", "g4-l3-animate-authoring-audit-index.md");
const DEFAULT_ARCHIVE_JSON = path.join(ROOT, "reports", "relocation-evidence",
  "g4-l3-animate-authoring-audit-index-before-westworld.json");
const DEFAULT_ARCHIVE_MARKDOWN = path.join(ROOT, "reports", "relocation-evidence",
  "g4-l3-animate-authoring-audit-index-before-westworld.md");
const DEFAULT_JSON = path.join(ROOT, "reports", "g4-l3-animate-authoring-relocation-receipt.json");
const DEFAULT_MARKDOWN = path.join(ROOT, "reports", "g4-l3-animate-authoring-relocation-receipt.md");
const DEFAULT_OLD_ROOT = "/Users/peter/Desktop/HELP MATH_Flash_To_JS";
const SHA256 = /^[a-f0-9]{64}$/u;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function portable(root, file) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  invariant(relative && relative !== ".." && !relative.startsWith("../") && !path.isAbsolute(relative),
    `${file} escapes the project root`);
  return relative;
}

function resolveProject(root, relative, label) {
  invariant(typeof relative === "string" && relative.length > 0 && !path.isAbsolute(relative),
    `${label} has no project-relative path`);
  const file = path.resolve(root, relative);
  invariant(portable(root, file) === relative.split(path.sep).join("/"), `${label} has an unsafe path`);
  return file;
}

async function exists(file) {
  try {
    await lstat(file);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function physicalBinding(root, reference, label) {
  invariant(reference?.file && SHA256.test(reference.sha256 || "") && Number.isSafeInteger(reference.bytes),
    `${label} has an invalid archived binding`);
  const file = resolveProject(root, reference.file, label);
  const information = await lstat(file);
  invariant(information.isFile() && !information.isSymbolicLink(), `${label} is not a regular file`);
  const bytes = await readFile(file);
  const binding = {file: portable(root, file), sha256: digest(bytes), bytes: bytes.length};
  invariant(binding.sha256 === reference.sha256 && binding.bytes === reference.bytes,
    `${label} differs from the pre-relocation index`);
  return {...binding, mode: (information.mode & 0o777).toString(8).padStart(4, "0")};
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

export function decodeAnimateFileUri(uri, label = "Animate file URI") {
  invariant(typeof uri === "string" && uri.startsWith("file:"), `${label} is invalid`);
  try {
    return decodeURIComponent(uri).replace(/^file:\/\/(?:\/Macintosh HD)?/u, "");
  } catch (error) {
    throw new Error(`${label} is not valid encoded text: ${error.message}`);
  }
}

export function relocationAttemptKey(evidenceId, runId) {
  invariant(/^[A-Za-z0-9._-]+$/u.test(evidenceId || ""), "relocation evidenceId is unsafe");
  invariant(/^run-[A-Za-z0-9_-]+$/u.test(runId || ""), "relocation runId is unsafe");
  return `${evidenceId}/${runId}`;
}

function artifactReferences(attempt) {
  const references = [
    ["runReceipt", attempt.receipt],
    ["sourceBinding", attempt.sourceBinding],
    ["workingCopy", attempt.workingCopy],
    ["stagedSwf", attempt.stagedSwf],
    ["auditTemplate", attempt.scripts?.auditTemplate],
    ["generatedAudit", attempt.scripts?.generatedAudit],
    ["controller", attempt.scripts?.controller],
    ["stdout", attempt.process?.stdout],
    ["stderr", attempt.process?.stderr],
  ];
  if (attempt.artifacts) {
    references.push(["controllerMarker", attempt.artifacts.marker]);
    references.push(["rawAuthoringReport", attempt.artifacts.report]);
    references.push(["authoringPng", attempt.artifacts.png]);
  }
  if (attempt.workEvidence) references.push(["workEvidence", attempt.workEvidence]);
  if (attempt.failureDiagnostic) references.push(["failureDiagnostic", attempt.failureDiagnostic]);
  return references.filter(([, reference]) => reference?.file);
}

async function captureHistoricalPaths({root, oldRoot, attempt, bindings, label}) {
  const receiptFile = resolveProject(root, bindings.runReceipt.file, `${label} run receipt`);
  const receipt = parseJson(await readFile(receiptFile), `${label} run receipt`);
  invariant(receipt.evidenceId === attempt.evidenceId && receipt.status === attempt.status,
    `${label} run receipt identity drifted`);
  invariant(receipt.workingCopy?.file === bindings.workingCopy.file
    && receipt.workingCopy?.sha256 === bindings.workingCopy.sha256,
  `${label} run receipt working-copy binding drifted`);
  const expectedHistoricalAbsolute = path.join(oldRoot, bindings.workingCopy.file);
  const currentAbsolute = path.join(root, bindings.workingCopy.file);
  const documentPaths = [];

  async function inspect(referenceName, fieldPath) {
    const reference = bindings[referenceName];
    if (!reference) return;
    const document = parseJson(await readFile(resolveProject(root, reference.file, `${label} ${referenceName}`)),
      `${label} ${referenceName}`);
    const uri = fieldPath.reduce((value, key) => value?.[key], document);
    const decoded = decodeAnimateFileUri(uri, `${label} ${referenceName}`);
    invariant(path.resolve(decoded) === path.resolve(expectedHistoricalAbsolute),
      `${label} ${referenceName} does not bind the declared old project root`);
    documentPaths.push({artifact: referenceName, uri, decodedAbsolutePath: decoded, artifactSha256: reference.sha256});
  }

  if (attempt.status === "passed") {
    await inspect("controllerMarker", ["documentPathURI"]);
    await inspect("rawAuthoringReport", ["document", "pathURI"]);
  } else if (bindings.failureDiagnostic) {
    await inspect("failureDiagnostic", ["documentPathURI"]);
  }

  return {
    oldAbsolutePath: expectedHistoricalAbsolute,
    newAbsolutePath: currentAbsolute,
    documentPaths,
  };
}

async function archiveOnce(source, destination, label) {
  invariant(!(await exists(destination)), `${label} already exists; refusing to overwrite immutable relocation evidence`);
  const bytes = await readFile(source);
  await mkdir(path.dirname(destination), {recursive: true});
  await writeFile(destination, bytes, {flag: "wx", mode: 0o444});
  await chmod(destination, 0o444);
  return bytes;
}

async function writeOrCheck(file, bytes, check, label) {
  if (check) {
    invariant(await exists(file), `${label} is missing`);
    invariant((await readFile(file)).equals(bytes), `${label} is stale`);
    return;
  }
  await mkdir(path.dirname(file), {recursive: true});
  if (await exists(file)) {
    const information = await lstat(file);
    invariant(information.isFile() && !information.isSymbolicLink() && information.nlink === 1,
      `${label} must be a plain singly-linked file`);
  }
  await writeFile(file, bytes);
}

export async function buildG4L3AnimateAuthoringRelocationReceipt({
  root = ROOT,
  oldRoot = DEFAULT_OLD_ROOT,
  liveJson = path.join(root, path.relative(ROOT, DEFAULT_LIVE_JSON)),
  liveMarkdown = path.join(root, path.relative(ROOT, DEFAULT_LIVE_MARKDOWN)),
  archiveJson = path.join(root, path.relative(ROOT, DEFAULT_ARCHIVE_JSON)),
  archiveMarkdown = path.join(root, path.relative(ROOT, DEFAULT_ARCHIVE_MARKDOWN)),
  jsonOutput = path.join(root, path.relative(ROOT, DEFAULT_JSON)),
  markdownOutput = path.join(root, path.relative(ROOT, DEFAULT_MARKDOWN)),
  archiveCurrent = false,
  check = false,
} = {}) {
  invariant(path.isAbsolute(oldRoot) && path.resolve(oldRoot) !== path.resolve(root),
    "old root must be an absolute path distinct from the current project root");
  if (archiveCurrent) {
    invariant(!check, "--archive-current cannot be combined with --check");
    await archiveOnce(liveJson, archiveJson, "pre-relocation JSON index");
    await archiveOnce(liveMarkdown, archiveMarkdown, "pre-relocation Markdown index");
  }
  invariant(await exists(archiveJson), "pre-relocation JSON archive is missing; run once with --archive-current");
  invariant(await exists(archiveMarkdown), "pre-relocation Markdown archive is missing; run once with --archive-current");

  const [archiveJsonBytes, archiveMarkdownBytes, generatorBytes] = await Promise.all([
    readFile(archiveJson),
    readFile(archiveMarkdown),
    readFile(path.join(root, "scripts", "build-g4-l3-animate-authoring-relocation-receipt.mjs")),
  ]);
  const archived = parseJson(archiveJsonBytes, "pre-relocation Animate result index");
  invariant(archived.schemaVersion === 1
    && archived.reportType === "g4-l3-adobe-animate-authoring-audit-result-index",
  "pre-relocation Animate result index has an unexpected schema");
  invariant(archived.summary?.queueItems === 29 && archived.summary?.verifiedWorkOnlyAuthoringAudits === 29
    && archived.summary?.authoringCoverageComplete === true,
  "pre-relocation Animate result index did not record 29/29 work-only authoring coverage");

  const entries = [];
  const seen = new Set();
  for (const item of archived.items || []) {
    for (const attempt of item.attempts || []) {
      const key = relocationAttemptKey(attempt.evidenceId, attempt.runId);
      invariant(!seen.has(key), `duplicate pre-relocation attempt: ${key}`);
      seen.add(key);
      const bindings = {};
      for (const [name, reference] of artifactReferences(attempt)) {
        bindings[name] = await physicalBinding(root, reference, `${key} ${name}`);
      }
      const paths = await captureHistoricalPaths({root, oldRoot, attempt, bindings, label: key});
      entries.push({
        key,
        animationId: item.animationId,
        evidenceId: attempt.evidenceId,
        runId: attempt.runId,
        role: attempt.role,
        status: attempt.status,
        archivedAttemptSha256: digest(Buffer.from(stableJson(attempt))),
        workingCopy: bindings.workingCopy,
        sourceFlaSha256: item.sourcePair.fla.sha256,
        shippedSwf: bindings.stagedSwf,
        runReceipt: bindings.runReceipt,
        artifacts: Object.fromEntries(Object.entries(bindings)
          .filter(([name]) => !["workingCopy", "stagedSwf", "runReceipt"].includes(name))),
        relocation: paths,
        acceptanceEffect: false,
      });
    }
  }
  entries.sort((left, right) => left.key.localeCompare(right.key));

  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-animate-authoring-project-relocation-receipt",
    relocation: {
      oldProjectRoot: oldRoot,
      newProjectRoot: root,
      method: "exact project-relative path plus current physical file SHA-256 and archived run/report/PNG bindings",
      rewritesHistoricalEvidence: false,
    },
    sourceIndex: {
      json: {file: portable(root, archiveJson), sha256: digest(archiveJsonBytes), bytes: archiveJsonBytes.length},
      markdown: {file: portable(root, archiveMarkdown), sha256: digest(archiveMarkdownBytes), bytes: archiveMarkdownBytes.length},
    },
    generator: {
      file: "scripts/build-g4-l3-animate-authoring-relocation-receipt.mjs",
      sha256: digest(generatorBytes),
      bytes: generatorBytes.length,
    },
    summary: {
      queueItems: archived.summary.queueItems,
      attempts: entries.length,
      passedAttempts: entries.filter(({status}) => status === "passed").length,
      failedAttempts: entries.filter(({status}) => status === "failed").length,
      relocatedDocumentPathRecords: entries.reduce((sum, entry) => sum + entry.relocation.documentPaths.length, 0),
      workOnlyAuthoringAuditsPreserved: archived.summary.verifiedWorkOnlyAuthoringAudits,
      historicalFilesRewritten: 0,
      originalRuntimeBaselinesEstablished: 0,
      humanReviewsEstablished: 0,
      ownerAcceptancesEstablished: 0,
      strictAcceptancesEstablished: 0,
    },
    entries,
    authorityBoundary: {
      pathRelocationWitnessOnly: true,
      workOnlyAuthoringEvidence: true,
      originalRuntimeBehavior: false,
      javascriptFidelity: false,
      audioAcceptance: false,
      humanReview: false,
      ownerAcceptance: false,
      strictAcceptance: false,
      publication: false,
    },
  };
  const jsonBytes = Buffer.from(stableJson(report));
  const jsonBinding = {file: portable(root, jsonOutput), sha256: digest(jsonBytes), bytes: jsonBytes.length};
  const markdown = [
    "# G4 L3 Animate authoring-evidence relocation receipt",
    "",
    "This receipt preserves the 29/29 work-only Animate audit result after the project moved to WestWorld.",
    "It never rewrites historical reports and establishes no original-runtime, fidelity, human, owner, strict, or release authority.",
    "",
    `- Old root: \`${oldRoot}\``,
    `- Current root: \`${root}\``,
    `- Attempts re-hashed: ${report.summary.attempts}`,
    `- Historical document-path records bound: ${report.summary.relocatedDocumentPathRecords}`,
    `- Preserved work-only coverage: ${report.summary.workOnlyAuthoringAuditsPreserved}/29`,
    `- Receipt SHA-256: \`${jsonBinding.sha256}\``,
    "",
  ].join("\n");
  await writeOrCheck(jsonOutput, jsonBytes, check, "relocation receipt JSON");
  await writeOrCheck(markdownOutput, Buffer.from(markdown), check, "relocation receipt Markdown");
  return {report, jsonBinding, lookup: new Map(entries.map((entry) => [entry.key, entry]))};
}

export function parseArguments(argv) {
  const options = {check: false, archiveCurrent: false};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--archive-current") options.archiveCurrent = true;
    else if (value === "--old-root") options.oldRoot = argv[++index] || invariant(false, "--old-root requires a path");
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log("Usage: node scripts/build-g4-l3-animate-authoring-relocation-receipt.mjs [--archive-current] [--check] [--old-root <path>]");
    return;
  }
  const result = await buildG4L3AnimateAuthoringRelocationReceipt(options);
  console.log(JSON.stringify({status: options.check ? "checked" : "built", ...result.report.summary,
    report: result.jsonBinding}, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
