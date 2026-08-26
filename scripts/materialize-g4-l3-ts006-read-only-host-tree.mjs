#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SOURCE_ARCHIVE_RELATIVE = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const SOURCE_ARCHIVE_ROOT = path.join(PROJECT_ROOT, ...SOURCE_ARCHIVE_RELATIVE.split("/"));
const OUTPUT_RELATIVE = "work/original-runtime-host-trees/course-g04-l03-ts-006/root";
const OUTPUT_ROOT = path.join(PROJECT_ROOT, ...OUTPUT_RELATIVE.split("/"));
const MANIFEST_NAME = "staging-manifest.json";
const CONTRACT_RELATIVE = "reports/g4-l3-authoritative-runtime-acquisition-contract.json";
const INCLUDED_ROOTS = Object.freeze([
  "HELP_COURSES/ELMGR4/L3",
  "HELP_KEYTERMS/KT/ELEMENTARY",
]);
const INCLUDED_EXTENSIONS = new Set([".swf", ".mp3", ".xml"]);
const EXPECTED_COUNTS = Object.freeze({mp3: 146, swf: 508, xml: 3});
const EXPECTED_FILE_COUNT = 657;
const EXPECTED_BYTES = 35_469_789;
const SELECTED_ANIMATION_ID = "course-g04-l03-ts-006";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function projectRelative(file) {
  const candidate = portable(path.relative(PROJECT_ROOT, file));
  invariant(candidate && !candidate.startsWith("../") && !path.isAbsolute(candidate), `${file} escapes project root`);
  return candidate;
}

async function fileBinding(file) {
  const bytes = await readFile(file);
  return {file: projectRelative(file), bytes: bytes.length, sha256: sha256(bytes)};
}

async function walkIncludedFiles(relativeRoot) {
  const root = path.join(SOURCE_ARCHIVE_ROOT, ...relativeRoot.split("/"));
  const rootReal = await realpath(root);
  invariant(rootReal.startsWith(`${await realpath(SOURCE_ARCHIVE_ROOT)}${path.sep}`), `${relativeRoot} escapes source archive`);
  const files = [];
  async function visit(directory, current = "") {
    const entries = await readdir(directory, {withFileTypes: true});
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, "en"))) {
      const child = path.join(directory, entry.name);
      const childRelative = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(child, childRelative);
      else if (entry.isFile() && INCLUDED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        const metadata = await lstat(child);
        invariant(metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
          `${child} must be one regular source file`);
        const bytes = await readFile(child);
        files.push({
          sourceAbsolute: child,
          archiveRelativePath: portable(path.join(relativeRoot, childRelative)),
          bytes: bytes.length,
          sha256: sha256(bytes),
          extension: path.extname(entry.name).slice(1).toLowerCase(),
        });
      }
    }
  }
  await visit(root);
  return files;
}

function countsByExtension(files) {
  const counts = {};
  for (const file of files) counts[file.extension] = (counts[file.extension] || 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right, "en")));
}

async function buildPlan() {
  const [contractBytes, generator] = await Promise.all([
    readFile(path.join(PROJECT_ROOT, CONTRACT_RELATIVE)),
    fileBinding(SCRIPT_PATH),
  ]);
  const contract = JSON.parse(contractBytes);
  invariant(contract.reportType === "g4-l3-authoritative-runtime-acquisition-contract"
    && contract.schemaVersion === 1 && contract.summary.canonicalItems === 40,
  "G4 L3 runtime acquisition contract identity drifted");
  const item = contract.items.find((candidate) => candidate.animationId === SELECTED_ANIMATION_ID);
  invariant(item
    && item.source.swf.sha256 === "fa8962a6ca72c0bb213605a9836b62600992cb5c1cf955f7c871e857e90ddf47"
    && item.source.fla.sha256 === "3f500c60b73b735eb001993b31ff101bf1615384c86b6a28987a84feef5b70dd"
    && item.authoringGate.authoringAuditEstablished === true
    && item.runtimeContainmentPrerequisite.exactExternalOperationCount === 0
    && item.runtimeContainmentPrerequisite.sideEffectContainmentApproved === false,
  "Selected TS006 runtime candidate identity drifted or was promoted");

  const nested = await Promise.all(INCLUDED_ROOTS.map(walkIncludedFiles));
  const files = nested.flat().sort((left, right) =>
    left.archiveRelativePath.localeCompare(right.archiveRelativePath, "en"));
  invariant(files.length === EXPECTED_FILE_COUNT
    && files.reduce((sum, file) => sum + file.bytes, 0) === EXPECTED_BYTES
    && stableJson(countsByExtension(files)) === stableJson(EXPECTED_COUNTS),
  "Read-only host-tree allowlist count or byte total drifted");
  invariant(new Set(files.map((file) => file.archiveRelativePath)).size === files.length,
    "Read-only host-tree allowlist contains duplicate paths");
  const requiredPaths = [
    "HELP_COURSES/ELMGR4/L3/index_local.swf",
    "HELP_COURSES/ELMGR4/L3/index.xml",
    "HELP_COURSES/ELMGR4/L3/TS/L3TS06.swf",
    "HELP_COURSES/ELMGR4/L3/SA/L3TS06.mp3",
    "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml",
    "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml",
  ];
  invariant(requiredPaths.every((required) => files.some((file) => file.archiveRelativePath === required)),
    "Read-only host-tree allowlist is missing a required lesson or keyterm resource");
  const fileRows = files.map(({archiveRelativePath, bytes, sha256: fileSha256, extension}) => ({
    path: archiveRelativePath,
    bytes,
    sha256: fileSha256,
    extension,
    stagedMode: "0444",
  }));
  const manifestWithoutFingerprint = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-read-only-original-runtime-host-tree",
    generator,
    ownership: {
      purpose: "unapproved original-runtime containment control CR-02 technical preparation only",
      sourceAssetsModified: false,
      sourceFilesHardLinked: false,
      runtimeExecuted: false,
      acceptanceEffect: "none",
    },
    selectedCandidate: {
      animationId: item.animationId,
      sourceSwf: item.source.swf,
      sourceFlaSha256: item.source.fla.sha256,
    },
    sourceBindings: {
      runtimeAcquisitionContract: {
        file: CONTRACT_RELATIVE,
        bytes: contractBytes.length,
        sha256: sha256(contractBytes),
        reportType: contract.reportType,
        schemaVersion: contract.schemaVersion,
      },
      archiveRoot: SOURCE_ARCHIVE_RELATIVE,
      includedRoots: INCLUDED_ROOTS,
      includedExtensions: [...INCLUDED_EXTENSIONS].sort(),
    },
    stagedRoot: {
      path: OUTPUT_RELATIVE,
      directoryMode: "0555",
      fileMode: "0444",
      regularCopiedFilesOnly: true,
      symbolicLinks: 0,
      hardLinks: 0,
    },
    summary: {
      files: fileRows.length,
      bytes: fileRows.reduce((sum, file) => sum + file.bytes, 0),
      filesByExtension: countsByExtension(fileRows),
      sourceRoots: INCLUDED_ROOTS.length,
      sourceFlasCopied: 0,
      sourceActionScriptFilesCopied: 0,
      runtimeSessionsExecuted: 0,
      containmentControlsApproved: 0,
      strictCompletions: 0,
    },
    fileSetSha256: sha256(Buffer.from(fileRows.map((file) =>
      `${file.path}\t${file.bytes}\t${file.sha256}\t${file.stagedMode}`,
    ).join("\n"))),
    files: fileRows,
    executionGate: {
      state: "read-only-host-tree-materialized-runtime-not-authorized",
      cr02TechnicalArtifactPrepared: true,
      cr02Approved: false,
      originalRuntimeExecutionReady: false,
      launchesRuntimeByThisMaterializer: false,
      launchesAnimateByThisMaterializer: false,
      legacyEndpointsExecutedByThisMaterializer: false,
    },
    acceptance: {
      acceptanceNeutral: true,
      readOnlyHostTreeMaterialized: true,
      containmentApproved: false,
      runtimeApproved: false,
      authoritativeOriginalRuntimeAccepted: false,
      implementationAuthorized: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      statement: "This manifest proves only that a separate hash-bound, read-only runtime resource tree was copied from preserved sources. It contains no FLA or AS files, launches nothing, approves no containment or runtime session, and establishes no baseline, fidelity, acceptance, parity, or completion.",
    },
  };
  const manifest = {
    ...manifestWithoutFingerprint,
    manifestFingerprintSha256: sha256(Buffer.from(stableJson(manifestWithoutFingerprint))),
  };
  return {files, manifest, manifestBytes: Buffer.from(stableJson(manifest))};
}

async function verifyTree({files, manifest, manifestBytes}, outputRoot = OUTPUT_ROOT) {
  const outputInfo = await lstat(outputRoot);
  invariant(outputInfo.isDirectory() && !outputInfo.isSymbolicLink(), "Read-only host-tree root is not a real directory");
  invariant((outputInfo.mode & 0o777) === 0o555, "Read-only host-tree root mode drifted");
  const outputReal = await realpath(outputRoot);
  const expectedParentReal = await realpath(path.dirname(outputRoot));
  invariant(outputReal.startsWith(`${expectedParentReal}${path.sep}`), "Read-only host-tree root escapes its parent");
  const currentManifest = await readFile(path.join(outputRoot, MANIFEST_NAME));
  invariant(currentManifest.equals(manifestBytes), "Read-only host-tree manifest is stale");
  const seenDirectories = new Set([outputRoot]);
  for (const file of files) {
    const staged = path.join(outputRoot, ...file.archiveRelativePath.split("/"));
    const metadata = await lstat(staged);
    invariant(metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
      `${file.archiveRelativePath}: staged file is not one regular copy`);
    invariant((metadata.mode & 0o777) === 0o444, `${file.archiveRelativePath}: staged mode drifted`);
    const bytes = await readFile(staged);
    invariant(bytes.length === file.bytes && sha256(bytes) === file.sha256,
      `${file.archiveRelativePath}: staged bytes drifted`);
    let directory = path.dirname(staged);
    while (directory !== outputRoot && directory.startsWith(`${outputRoot}${path.sep}`)) {
      seenDirectories.add(directory);
      directory = path.dirname(directory);
    }
  }
  const manifestInfo = await lstat(path.join(outputRoot, MANIFEST_NAME));
  invariant(manifestInfo.isFile() && !manifestInfo.isSymbolicLink() && manifestInfo.nlink === 1
    && (manifestInfo.mode & 0o777) === 0o444,
  "Read-only host-tree manifest mode or identity drifted");
  for (const directory of seenDirectories) {
    const metadata = await lstat(directory);
    invariant(metadata.isDirectory() && !metadata.isSymbolicLink() && (metadata.mode & 0o777) === 0o555,
      `${projectRelative(directory)}: staged directory mode drifted`);
  }
  invariant(manifest.summary.files === EXPECTED_FILE_COUNT && manifest.summary.bytes === EXPECTED_BYTES,
    "Read-only host-tree manifest summary drifted");
  return {
    mode: "check",
    output: `${OUTPUT_RELATIVE}/${MANIFEST_NAME}`,
    files: files.length,
    bytes: manifest.summary.bytes,
    fileSetSha256: manifest.fileSetSha256,
    manifestFingerprintSha256: manifest.manifestFingerprintSha256,
    changed: 0,
    runtimeSessionsExecuted: 0,
    acceptanceChanges: 0,
  };
}

async function setDirectoriesReadOnly(root) {
  const directories = [];
  async function visit(directory) {
    directories.push(directory);
    const entries = await readdir(directory, {withFileTypes: true});
    for (const entry of entries) if (entry.isDirectory()) await visit(path.join(directory, entry.name));
  }
  await visit(root);
  directories.sort((left, right) => right.length - left.length);
  for (const directory of directories) await chmod(directory, 0o555);
}

async function restoreDirectoryWriteAccessForCleanup(root) {
  const directories = [];
  async function visit(directory) {
    directories.push(directory);
    const entries = await readdir(directory, {withFileTypes: true});
    for (const entry of entries) if (entry.isDirectory()) await visit(path.join(directory, entry.name));
  }
  await visit(root);
  directories.sort((left, right) => left.length - right.length);
  for (const directory of directories) await chmod(directory, 0o755);
}

async function buildStagedTree(plan, outputParent) {
  const temporaryRoot = await mkdtemp(path.join(outputParent, ".stage-"));
  try {
    for (const file of plan.files) {
      const destination = path.join(temporaryRoot, ...file.archiveRelativePath.split("/"));
      await mkdir(path.dirname(destination), {recursive: true});
      await copyFile(file.sourceAbsolute, destination, fsConstants.COPYFILE_EXCL);
      await chmod(destination, 0o444);
    }
    const manifestPath = path.join(temporaryRoot, MANIFEST_NAME);
    await writeFile(manifestPath, plan.manifestBytes, {flag: "wx", mode: 0o444});
    await chmod(manifestPath, 0o444);
    await setDirectoriesReadOnly(temporaryRoot);
    await verifyTree(plan, temporaryRoot);
    return temporaryRoot;
  } catch (error) {
    await restoreDirectoryWriteAccessForCleanup(temporaryRoot).catch(() => {});
    await rm(temporaryRoot, {recursive: true, force: true}).catch(() => {});
    throw error;
  }
}

export async function materializeReadOnlyHostTree({check = false, refresh = false} = {}) {
  const plan = await buildPlan();
  const existing = await lstat(OUTPUT_ROOT).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (existing && !refresh) return verifyTree(plan);
  invariant(!check, `Read-only host tree is missing: ${OUTPUT_RELATIVE}`);
  const outputParent = path.dirname(OUTPUT_ROOT);
  await mkdir(outputParent, {recursive: true});
  const outputParentReal = await realpath(outputParent);
  const workRootReal = await realpath(path.join(PROJECT_ROOT, "work"));
  invariant(outputParentReal.startsWith(`${workRootReal}${path.sep}`), "Read-only host-tree parent escapes work/");
  const temporaryRoot = await buildStagedTree(plan, outputParent);
  let archivedOutput = null;
  if (existing) {
    invariant(existing.isDirectory() && !existing.isSymbolicLink(), "Existing host tree is not a real directory");
    const oldManifestBytes = await readFile(path.join(OUTPUT_ROOT, MANIFEST_NAME));
    archivedOutput = `${OUTPUT_ROOT}.superseded-${sha256(oldManifestBytes).slice(0, 16)}`;
    const archivedInfo = await lstat(archivedOutput).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    invariant(!archivedInfo, `Refusing to overwrite preserved host-tree archive ${projectRelative(archivedOutput)}`);
    await rename(OUTPUT_ROOT, archivedOutput);
  }
  try {
    await rename(temporaryRoot, OUTPUT_ROOT);
  } catch (error) {
    if (archivedOutput) await rename(archivedOutput, OUTPUT_ROOT).catch(() => {});
    throw error;
  }
  return {
    ...await verifyTree(plan),
    mode: refresh ? "refresh" : "write",
    changed: 1,
    preservedSupersededTree: archivedOutput ? projectRelative(archivedOutput) : null,
  };
}

export function parseArguments(argv) {
  const options = {check: false, refresh: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else if (argument === "--refresh") options.refresh = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  invariant(!(options.check && options.refresh), "--check and --refresh are mutually exclusive");
  return options;
}

function usage() {
  return [
    "Usage: node scripts/materialize-g4-l3-ts006-read-only-host-tree.mjs [--check | --refresh]",
    "",
    `Writes only ${OUTPUT_RELATIVE}/ from hash-verified SWF/MP3/XML sources.`,
    "It copies no FLA/AS file, launches no runtime, approves no control, and changes no migration or acceptance state.",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = await materializeReadOnlyHostTree(options);
  const label = options.check ? "PASS" : result.changed ? "WROTE" : "PASS";
  process.stdout.write(`${label}: ${result.files} read-only runtime files / ${result.bytes} bytes; `
    + `set ${result.fileSetSha256}; runtime sessions 0; acceptance effect none.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
