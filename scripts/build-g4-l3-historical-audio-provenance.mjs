#!/usr/bin/env node

import {constants as fsConstants} from "node:fs";
import {createHash} from "node:crypto";
import {chmod, copyFile, lstat, mkdir, readFile, readdir, realpath, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEFAULT_ARCHIVE_ROOT =
  "/Volumes/WestWorld/HELP MATH Related Files/Historical Office Documents of HELP MATH Program";
const CATALOG_ROOT = path.join(ROOT, "private-archive", "historical-office-catalog-2026-07-25");
const CROSSWALK = path.join(CATALOG_ROOT, "technical-source-crosswalk.json");
const FILES_JSONL = path.join(CATALOG_ROOT, "files.jsonl");
const SOURCE_ROOT = path.join(ROOT, "source-assets", "flash", "HELP MATH_ORIGINAL FILES");
const PRIVATE_INTAKE = path.join(ROOT, "private-archive", "g4-l3-supplemental-audio-intake-2026-07-25");
const DEFAULT_JSON = path.join(ROOT, "reports", "g4-l3-historical-audio-provenance.json");
const DEFAULT_MARKDOWN = path.join(ROOT, "reports", "g4-l3-historical-audio-provenance.md");
const LESSON_PREFIX = "HELP_COURSES/ELMGR4/L3/";
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
  invariant(relative && !relative.startsWith("../") && !path.isAbsolute(relative), `${file} escapes ${root}`);
  return relative;
}

function lessonRelativePath(historicalPath) {
  const normalized = historicalPath.replaceAll("\\", "/");
  const index = normalized.indexOf(LESSON_PREFIX);
  invariant(index >= 0, `historical technical path is outside G4 L3: ${historicalPath}`);
  const relative = normalized.slice(index);
  invariant(path.posix.normalize(relative) === relative && !relative.includes("../"), `unsafe lesson-relative path: ${relative}`);
  return relative;
}

async function physicalFile(file, label) {
  const information = await lstat(file);
  invariant(information.isFile() && !information.isSymbolicLink(), `${label} is not a regular file`);
  const bytes = await readFile(file);
  return {bytes, binding: {sha256: digest(bytes), bytes: bytes.length,
    mode: (information.mode & 0o777).toString(8).padStart(4, "0")}};
}

async function lstatMaybe(file) {
  try {
    return await lstat(file);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function rejectSymlinks(base, candidate, label) {
  const baseReal = await realpath(base);
  const relative = path.relative(base, candidate);
  invariant(relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), `${label} escapes its base`);
  let cursor = base;
  for (const component of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    const information = await lstatMaybe(cursor);
    if (!information) continue;
    invariant(!information.isSymbolicLink(), `${label} contains a symbolic link`);
    const currentReal = await realpath(cursor);
    invariant(currentReal === baseReal || currentReal.startsWith(`${baseReal}${path.sep}`), `${label} resolves outside its base`);
  }
}

function parseJsonLines(bytes, label) {
  const rows = [];
  for (const [index, line] of bytes.toString("utf8").split(/\r?\n/u).entries()) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line));
    } catch (error) {
      throw new Error(`${label} line ${index + 1} is invalid JSON: ${error.message}`);
    }
  }
  return rows;
}

async function collectReferenceInputs(root, animationIds) {
  const candidates = [path.join(root, "reports", "g4-l3-source-operation-index-v2.json")];
  for (const animationId of animationIds) {
    candidates.push(path.join(root, "migrations", animationId, "audit", "machine", "g4-l3-audio-source-candidates.csv"));
    candidates.push(path.join(root, "migrations", animationId, "audit", "machine", "g4-l3-source-audit.json"));
  }
  const inputs = [];
  for (const file of candidates) {
    const information = await lstatMaybe(file);
    if (!information) continue;
    invariant(information.isFile() && !information.isSymbolicLink(), `${file} is not a regular reference input`);
    const bytes = await readFile(file);
    inputs.push({file: portable(root, file), sha256: digest(bytes), bytes: bytes.length, text: bytes.toString("utf8")});
  }
  return inputs;
}

function exactReferenceEvidence(inputs, relative) {
  const withinLesson = relative.slice(LESSON_PREFIX.length);
  return inputs
    .filter(({text}) => text.includes(relative) || text.includes(withinLesson))
    .map(({file, sha256, bytes}) => ({file, sha256, bytes, match: "exact G4 L3 path or exact lesson-relative path"}));
}

async function ensureDirectory(directory) {
  await mkdir(directory, {recursive: true, mode: 0o700});
}

async function stageFile({archiveFile, destination, expectedSha256, expectedBytes}) {
  await ensureDirectory(path.dirname(destination));
  const existing = await lstatMaybe(destination);
  if (!existing) {
    await copyFile(archiveFile, destination, fsConstants.COPYFILE_EXCL);
    await chmod(destination, 0o400);
  }
  const staged = await physicalFile(destination, "private intake file");
  invariant(staged.binding.sha256 === expectedSha256 && staged.binding.bytes === expectedBytes,
    `private intake file differs: ${destination}`);
  invariant(staged.binding.mode === "0400", `private intake file is not mode 0400: ${destination}`);
  return staged.binding;
}

async function lockDirectoryTree(directory) {
  const entries = await readdir(directory, {withFileTypes: true});
  for (const entry of entries) {
    if (entry.isSymbolicLink()) throw new Error(`private intake contains symbolic link: ${entry.name}`);
    if (entry.isDirectory()) await lockDirectoryTree(path.join(directory, entry.name));
  }
  await chmod(directory, 0o500);
}

async function writeOrCheck(file, bytes, check, label) {
  if (check) {
    invariant((await readFile(file)).equals(bytes), `${label} is stale`);
    return;
  }
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, bytes);
}

export async function buildG4L3HistoricalAudioProvenance({
  root = ROOT,
  archiveRoot = DEFAULT_ARCHIVE_ROOT,
  jsonOutput = path.join(root, path.relative(ROOT, DEFAULT_JSON)),
  markdownOutput = path.join(root, path.relative(ROOT, DEFAULT_MARKDOWN)),
  privateIntake = path.join(root, path.relative(ROOT, PRIVATE_INTAKE)),
  stagePrivateIntake = false,
  check = false,
} = {}) {
  invariant(!(stagePrivateIntake && check), "--stage-private-intake cannot be combined with --check");
  const [crosswalkBytes, filesBytes, releaseBytes, generatorBytes] = await Promise.all([
    readFile(path.join(root, path.relative(ROOT, CROSSWALK))),
    readFile(path.join(root, path.relative(ROOT, FILES_JSONL))),
    readFile(path.join(root, "catalog", "lesson-releases.json")),
    readFile(path.join(root, "scripts", "build-g4-l3-historical-audio-provenance.mjs")),
  ]);
  const crosswalk = JSON.parse(crosswalkBytes);
  const releaseCatalog = JSON.parse(releaseBytes);
  const release = releaseCatalog.releases.find(({releaseId}) => releaseId === "lesson-g04-l03-negative-numbers");
  invariant(release?.members?.length === 40, "G4 L3 40-member release authority is missing");
  const classifications = new Map(parseJsonLines(filesBytes, "historical files catalog").map((row) => [row.path, row]));
  const lessonTechnical = crosswalk.files.filter(({historicalPath}) => historicalPath?.replaceAll("\\", "/").includes(LESSON_PREFIX));
  invariant(lessonTechnical.length === 36, `expected 36 G4 L3 historical technical files, found ${lessonTechnical.length}`);
  const audio = lessonTechnical.filter(({family}) => family === "audio");
  invariant(audio.length === 31, `expected 31 G4 L3 historical audio files, found ${audio.length}`);
  const unmatched = audio.filter(({matchStatus}) => matchStatus === "no-exact-source-assets-match");
  invariant(unmatched.length === 15, `expected 15 unmatched G4 L3 audio files, found ${unmatched.length}`);
  const referenceInputs = await collectReferenceInputs(root, release.members.map(({animationId}) => animationId));
  if (stagePrivateIntake) {
    await ensureDirectory(privateIntake);
    await rejectSymlinks(path.dirname(privateIntake), privateIntake, "private intake root");
  }

  const assets = [];
  const privateEntries = [];
  for (const row of audio.sort((left, right) => left.historicalPath.localeCompare(right.historicalPath))) {
    invariant(row.archivePresence === "present" && SHA256.test(row.sha256 || "") && row.bytes > 0,
      `historical audio row is not physically available: ${row.historicalPath}`);
    const relative = lessonRelativePath(row.historicalPath);
    const archiveFile = path.join(archiveRoot, row.historicalPath);
    await rejectSymlinks(archiveRoot, archiveFile, `historical archive audio ${relative}`);
    const physical = await physicalFile(archiveFile, `historical archive audio ${relative}`);
    invariant(physical.binding.sha256 === row.sha256 && physical.binding.bytes === row.bytes,
      `historical archive audio hash drifted: ${relative}`);
    const classification = classifications.get(row.historicalPath);
    invariant(classification?.sha256 === row.sha256 && classification?.bytes === row.bytes,
      `historical classification binding is missing: ${relative}`);
    const currentMatches = [];
    for (const candidate of row.sourceAssetsPaths || []) {
      const current = await physicalFile(path.join(SOURCE_ROOT, candidate), `canonical source match ${candidate}`);
      invariant(current.binding.sha256 === row.sha256, `canonical source exact match drifted: ${candidate}`);
      currentMatches.push({path: candidate, sha256: current.binding.sha256, bytes: current.binding.bytes});
    }
    const expectedCanonicalPath = relative;
    const expectedCanonicalFile = path.join(SOURCE_ROOT, expectedCanonicalPath);
    const expectedCanonicalInfo = await lstatMaybe(expectedCanonicalFile);
    let expectedCanonicalBinding = null;
    if (expectedCanonicalInfo) {
      const current = await physicalFile(expectedCanonicalFile, `expected canonical path ${expectedCanonicalPath}`);
      expectedCanonicalBinding = current.binding;
    }
    const referenceEvidence = exactReferenceEvidence(referenceInputs, relative);
    const needsIntake = row.matchStatus === "no-exact-source-assets-match";
    let staged = null;
    if (needsIntake) {
      const stagedFile = path.join(privateIntake, "files", relative);
      if (stagePrivateIntake) staged = await stageFile({archiveFile, destination: stagedFile,
        expectedSha256: row.sha256, expectedBytes: row.bytes});
      else if (await lstatMaybe(stagedFile)) staged = (await physicalFile(stagedFile, `private intake ${relative}`)).binding;
      invariant(!staged || staged.sha256 === row.sha256 && staged.bytes === row.bytes,
        `private intake binding drifted: ${relative}`);
      if (staged) privateEntries.push({path: `files/${relative}`, sha256: staged.sha256, bytes: staged.bytes, mode: staged.mode});
    }
    assets.push({
      lessonRelativePath: relative,
      sha256: row.sha256,
      bytes: row.bytes,
      format: classification.format,
      archivePresence: row.archivePresence,
      archiveBytesRehashed: true,
      authority: {value: classification.authority, confidence: classification.authorityConfidence},
      sensitivity: {value: classification.sensitivity, tags: classification.sensitivityTags,
        confidence: classification.sensitivityConfidence},
      currentSourceExactMatches: currentMatches,
      expectedCanonicalPath: {
        path: expectedCanonicalPath,
        exists: Boolean(expectedCanonicalInfo),
        observedSha256: expectedCanonicalBinding?.sha256 ?? null,
        exactHistoricalHash: expectedCanonicalBinding?.sha256 === row.sha256,
      },
      referenceEvidence,
      privateIntake: staged ? {status: "staged-read-only-private-intake", sha256: staged.sha256, bytes: staged.bytes,
        mode: staged.mode} : {status: needsIntake ? "not-staged" : "not-required-already-matched"},
      importDecision: needsIntake
        ? "blocked-pending-authoritative-runtime-or-source-reference-and-owner-provenance-approval"
        : "already-represented-in-current-source-assets-by-exact-hash",
      copiedToCanonicalSource: false,
      acceptanceEffect: false,
    });
  }

  if (stagePrivateIntake) {
    const manifest = {
      schemaVersion: 1,
      evidenceType: "g4-l3-private-historical-audio-intake",
      sourceArchiveRoot: archiveRoot,
      files: privateEntries,
      fileCount: privateEntries.length,
      copiedToCanonicalSource: false,
      ownerProvenanceApproval: null,
      runtimeReferenceApproval: null,
    };
    const manifestFile = path.join(privateIntake, "manifest.json");
    await writeFile(manifestFile, Buffer.from(stableJson(manifest)), {mode: 0o400});
    await chmod(manifestFile, 0o400);
    await lockDirectoryTree(privateIntake);
  }

  const stagedUnmatched = assets.filter(({privateIntake: intake, currentSourceExactMatches}) =>
    currentSourceExactMatches.length === 0 && intake.status === "staged-read-only-private-intake");
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-historical-audio-provenance-ledger",
    status: "private-intake-staged-canonical-import-blocked",
    inputs: {
      technicalCrosswalk: {file: portable(root, path.join(root, path.relative(ROOT, CROSSWALK))),
        sha256: digest(crosswalkBytes), bytes: crosswalkBytes.length},
      historicalFilesCatalog: {file: portable(root, path.join(root, path.relative(ROOT, FILES_JSONL))),
        sha256: digest(filesBytes), bytes: filesBytes.length},
      releaseCatalog: {file: "catalog/lesson-releases.json", sha256: digest(releaseBytes), bytes: releaseBytes.length},
      generator: {file: "scripts/build-g4-l3-historical-audio-provenance.mjs", sha256: digest(generatorBytes),
        bytes: generatorBytes.length},
      referenceInputs: referenceInputs.map(({text: _text, ...binding}) => binding),
    },
    summary: {
      historicalG4L3TechnicalFiles: lessonTechnical.length,
      historicalG4L3AudioFiles: audio.length,
      currentExactMatchedAudioFiles: assets.filter(({currentSourceExactMatches}) => currentSourceExactMatches.length > 0).length,
      unmatchedAudioCandidates: unmatched.length,
      stagedPrivateIntakeCandidates: stagedUnmatched.length,
      candidatesWithExactCurrentReferenceEvidence: assets.filter(({currentSourceExactMatches, referenceEvidence}) =>
        currentSourceExactMatches.length === 0 && referenceEvidence.length > 0).length,
      canonicalSourceFilesCopied: 0,
      ownerProvenanceApprovals: 0,
      strictAcceptanceEffect: false,
    },
    assets,
    privacyAndAuthorityBoundary: {
      externalArchiveModified: false,
      privateIntakeExcludedFromGitAndWeb: true,
      canonicalSourceModified: false,
      filenameOrHashMatchIsRuntimeProof: false,
      audioLanguageCueOrSynchronizationEstablished: false,
      ownerApprovalEstablished: false,
      strictAcceptanceEstablished: false,
    },
  };
  const jsonBytes = Buffer.from(stableJson(report));
  const jsonSha = digest(jsonBytes);
  const markdown = [
    "# G4 L3 historical audio provenance ledger",
    "",
    `- Historical G4 L3 audio files: ${report.summary.historicalG4L3AudioFiles}`,
    `- Already exact-matched in current source assets: ${report.summary.currentExactMatchedAudioFiles}`,
    `- Unmatched candidates: ${report.summary.unmatchedAudioCandidates}`,
    `- Staged in read-only private intake: ${report.summary.stagedPrivateIntakeCandidates}`,
    `- Copied into canonical source: 0`,
    `- Owner provenance approvals: 0`,
    `- JSON SHA-256: \`${jsonSha}\``,
    "",
    "The 15 unmatched files remain blocked until an exact runtime/source reference and Owner provenance approval are recorded.",
    "Hash identity or a matching filename does not establish language, cue, synchronization, runtime behavior, fidelity, or acceptance.",
    "",
  ].join("\n");
  await writeOrCheck(jsonOutput, jsonBytes, check, "G4 L3 historical audio provenance JSON");
  await writeOrCheck(markdownOutput, Buffer.from(markdown), check, "G4 L3 historical audio provenance Markdown");
  return {report, json: {file: portable(root, jsonOutput), sha256: jsonSha, bytes: jsonBytes.length}};
}

function parseArguments(argv) {
  const options = {check: false, stagePrivateIntake: false};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--stage-private-intake") options.stagePrivateIntake = true;
    else if (value === "--archive-root") options.archiveRoot = path.resolve(argv[++index] || invariant(false, "--archive-root requires a path"));
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log("Usage: node scripts/build-g4-l3-historical-audio-provenance.mjs [--stage-private-intake] [--check] [--archive-root <path>]");
    return;
  }
  const result = await buildG4L3HistoricalAudioProvenance(options);
  console.log(JSON.stringify({status: options.check ? "checked" : "built", ...result.report.summary,
    report: result.json}, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
