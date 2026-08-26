#!/usr/bin/env node

import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {createReadStream, statSync} from "node:fs";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

const ANIMATION_ID = "course-g03-l06-fq-002-review";
const ARCHIVE_ROOT = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const MIGRATION_ROOT = `migrations/${ANIMATION_ID}`;
const OUTPUT_RELATIVE = `${MIGRATION_ROOT}/audit/fq002-review-variant-binding.json`;
const SCENARIO_INVENTORY_RELATIVE = `${MIGRATION_ROOT}/audit/scenario-inventory.json`;
const COURSE_XML_RELATIVE = `${ARCHIVE_ROOT}/HELP_COURSES/ELMGR3/L6/index.xml`;
const CATALOG_RELATIVE = "catalog/source-files.json";

const EXPECTED_FFDEC_VERSION = "JPEXS Free Flash Decompiler v.26.2.1";
const EXPECTED_FFDEC_JAR_SHA256 = "090ab695053ad94cba6408574c7d7eea20ec60b6ae789ee6056a23f45106762f";

export const VARIANTS = Object.freeze([
  Object.freeze({
    id: "active-course-placement",
    role: "active-course-xml-placement-not-the-pilot-source",
    sourceRelative: "HELP_COURSES/ELMGR3/L6/FQ/L6FQ02.swf",
    projectRelative: `${ARCHIVE_ROOT}/HELP_COURSES/ELMGR3/L6/FQ/L6FQ02.swf`,
  }),
  Object.freeze({
    id: "review-pilot-source",
    role: "preserved-review-variant-selected-as-the-pilot-source",
    sourceRelative: "HELP_COURSES/ELMGR3/L6/FQ/Review/L6FQ02.swf",
    projectRelative: `${ARCHIVE_ROOT}/HELP_COURSES/ELMGR3/L6/FQ/Review/L6FQ02.swf`,
  }),
  Object.freeze({
    id: "missing-audio-button-history",
    role: "preserved-historical-variant-not-the-pilot-source",
    sourceRelative: "HELP_COURSES/ELMGR3/L6/FQ/Missing_AudioBtn_March21_2015/L6FQ02.swf",
    projectRelative: `${ARCHIVE_ROOT}/HELP_COURSES/ELMGR3/L6/FQ/Missing_AudioBtn_March21_2015/L6FQ02.swf`,
  }),
]);

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort(compareText).map((key) => [key, stable(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256Buffer(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(candidate) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(candidate)) hash.update(chunk);
  return hash.digest("hex");
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function run(command, argumentsList, {cwd = projectRoot, timeoutMs = 180_000} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argumentsList, {
      cwd,
      env: {...process.env, LC_ALL: "C"},
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${command} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (code, signal) => {
      clearTimeout(timer);
      if (code === 0) resolve({stdout, stderr});
      else reject(new Error(`${command} exited ${code ?? signal}: ${(stderr || stdout).trim()}`));
    });
  });
}

function findOnPath(name, pathValue = process.env.PATH || "") {
  if (path.isAbsolute(name) || name.includes(path.sep)) return path.resolve(name);
  for (const directory of pathValue.split(path.delimiter)) {
    if (!directory) continue;
    const candidate = path.join(directory, name);
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      // Keep looking for the explicitly requested executable.
    }
  }
  return null;
}

export function parseArguments(argumentsList) {
  const options = {check: false, ffdec: "ffdec", root: projectRoot};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else if (["--ffdec", "--root"].includes(value)) {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--ffdec") options.ffdec = next;
      else options.root = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

export function normalizeActionScript(raw) {
  const normalized = raw.toString("utf8").replace(/\r\n?/g, "\n").replace(/\n*$/g, "");
  return `${normalized}\n`;
}

async function listFilesRecursively(root, current = root) {
  const entries = await readdir(current, {withFileTypes: true});
  const files = [];
  for (const entry of entries.sort((left, right) => compareText(left.name, right.name))) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await listFilesRecursively(root, absolute));
    else if (entry.isFile()) files.push({absolute, relativePath: portable(path.relative(root, absolute))});
    else throw new Error(`FFDec export contains a non-file entry: ${absolute}`);
  }
  return files;
}

async function inspectFfdec(ffdecArgument) {
  const commandPath = findOnPath(ffdecArgument);
  invariant(commandPath, `FFDec executable not found: ${ffdecArgument}`);
  const launcherPath = await realpath(commandPath);
  const {stdout, stderr} = await run(commandPath, ["-help"], {timeoutMs: 30_000});
  const help = (stdout || stderr).replace(/\u001b\[[0-9;]*m/g, "");
  const version = help.split(/\r?\n/).find((line) => line.startsWith("JPEXS Free Flash Decompiler v."));
  invariant(version === EXPECTED_FFDEC_VERSION,
    `FFDec version changed: expected ${EXPECTED_FFDEC_VERSION}, observed ${version || "unknown"}`);
  const jarPath = path.join(path.dirname(launcherPath), "ffdec.jar");
  const jarSha256 = await sha256File(jarPath);
  invariant(jarSha256 === EXPECTED_FFDEC_JAR_SHA256,
    `FFDec jar changed: expected ${EXPECTED_FFDEC_JAR_SHA256}, observed ${jarSha256}`);
  return {launcherPath, version, jarSha256};
}

async function exportScripts({ffdec, sourceAbsolute, temporaryRoot, variantId}) {
  const outputRoot = path.join(temporaryRoot, variantId);
  await mkdir(outputRoot, {recursive: false});
  await run(ffdec.launcherPath, ["-onerror", "abort", "-export", "script", outputRoot, sourceAbsolute]);
  const scriptsRoot = path.join(outputRoot, "scripts");
  const files = await listFilesRecursively(scriptsRoot);
  const records = [];
  for (const file of files) {
    const raw = await readFile(file.absolute);
    const normalized = normalizeActionScript(raw);
    records.push({
      path: file.relativePath,
      bytes: raw.length,
      rawSha256: sha256Buffer(raw),
      normalizedBytes: Buffer.byteLength(normalized, "utf8"),
      normalizedSha256: sha256Buffer(Buffer.from(normalized, "utf8")),
      normalized,
    });
  }
  const index = records.map(({normalized, ...record}) => record);
  const counts = new Map();
  for (const record of records) counts.set(record.normalizedSha256, (counts.get(record.normalizedSha256) || 0) + 1);
  const bodyMultiset = [...counts.entries()].sort(([left], [right]) => compareText(left, right))
    .map(([sha256, count]) => ({sha256, count}));
  return {
    records,
    summary: {
      scriptCount: records.length,
      pathAndBytesIndexHashMode: "stable-key-sorted-pretty-json-array-v1",
      pathAndBytesIndexSha256: sha256Buffer(Buffer.from(stableJson(index), "utf8")),
      normalizedBodyMultisetHashMode: "stable-key-sorted-pretty-json-array-v1",
      normalizedBodyMultisetSha256: sha256Buffer(Buffer.from(stableJson(bodyMultiset), "utf8")),
      normalization: "CRLF-or-CR-to-LF; remove terminal newlines; append exactly one LF",
    },
  };
}

function recordsByBody(records) {
  const groups = new Map();
  for (const record of records) {
    if (!groups.has(record.normalizedSha256)) groups.set(record.normalizedSha256, []);
    groups.get(record.normalizedSha256).push(record);
  }
  return groups;
}

function unmatchedBodies(leftRecords, rightRecords) {
  const left = recordsByBody(leftRecords);
  const right = recordsByBody(rightRecords);
  const hashes = [...new Set([...left.keys(), ...right.keys()])].sort(compareText);
  const leftOnly = [];
  const rightOnly = [];
  let sharedBodyCount = 0;
  for (const hash of hashes) {
    const leftGroup = left.get(hash) || [];
    const rightGroup = right.get(hash) || [];
    sharedBodyCount += Math.min(leftGroup.length, rightGroup.length);
    if (leftGroup.length > rightGroup.length) {
      leftOnly.push({
        normalizedSha256: hash,
        count: leftGroup.length - rightGroup.length,
        paths: leftGroup.slice(rightGroup.length).map(({path: relativePath}) => relativePath),
      });
    }
    if (rightGroup.length > leftGroup.length) {
      rightOnly.push({
        normalizedSha256: hash,
        count: rightGroup.length - leftGroup.length,
        paths: rightGroup.slice(leftGroup.length).map(({path: relativePath}) => relativePath),
      });
    }
  }
  return {sharedBodyCount, leftOnly, rightOnly};
}

export function compareScriptExports(leftId, leftExport, rightId, rightExport) {
  const unmatched = unmatchedBodies(leftExport.records, rightExport.records);
  return {
    leftVariantId: leftId,
    rightVariantId: rightId,
    leftScriptCount: leftExport.records.length,
    rightScriptCount: rightExport.records.length,
    ...unmatched,
    normalizedBodyMultisetsEqual: unmatched.leftOnly.length === 0 && unmatched.rightOnly.length === 0,
    pathAndBytesIndexesEqual:
      leftExport.summary.pathAndBytesIndexSha256 === rightExport.summary.pathAndBytesIndexSha256,
  };
}

async function inspectFrozenSource(root, catalogByPath, variant) {
  const absolute = path.join(root, variant.projectRelative);
  const archiveAbsolute = path.join(root, ARCHIVE_ROOT);
  const resolvedArchive = await realpath(archiveAbsolute);
  const resolvedSource = await realpath(absolute);
  invariant(resolvedSource.startsWith(`${resolvedArchive}${path.sep}`), `${variant.id} resolves outside the preserved archive`);
  const metadata = await lstat(absolute);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${variant.id} is not a regular source file`);
  invariant((metadata.mode & 0o222) === 0, `${variant.id} source is writable`);
  const catalogEntry = catalogByPath.get(variant.sourceRelative);
  invariant(catalogEntry, `${variant.id} is missing from ${CATALOG_RELATIVE}`);
  const sha256 = await sha256File(absolute);
  invariant(metadata.size === catalogEntry.bytes, `${variant.id} byte count differs from the frozen catalog`);
  invariant(sha256 === catalogEntry.sha256, `${variant.id} SHA-256 differs from the frozen catalog`);
  return {
    id: variant.id,
    role: variant.role,
    path: variant.projectRelative,
    bytes: metadata.size,
    sha256,
    catalogPath: variant.sourceRelative,
    catalogBindingStatus: "verified-current-frozen-source",
    sourceMode: (metadata.mode & 0o777).toString(8).padStart(4, "0"),
  };
}

function exactRecord(exported, relativePath) {
  const matches = exported.records.filter((record) => record.path === relativePath);
  invariant(matches.length === 1, `expected exactly one FFDec script ${relativePath}; observed ${matches.length}`);
  return matches[0];
}

function scriptBinding(record) {
  return {
    path: record.path,
    rawBytes: record.bytes,
    rawSha256: record.rawSha256,
    normalizedBytes: record.normalizedBytes,
    normalizedSha256: record.normalizedSha256,
  };
}

export async function buildReport({root = projectRoot, ffdecArgument = "ffdec"} = {}) {
  const catalogRaw = await readFile(path.join(root, CATALOG_RELATIVE));
  const catalog = JSON.parse(catalogRaw);
  invariant(catalog.schemaVersion === 1 && Array.isArray(catalog.files), `${CATALOG_RELATIVE} has an unsupported schema`);
  const catalogByPath = new Map(catalog.files.map((entry) => [entry.path, entry]));
  const sources = [];
  for (const variant of VARIANTS) sources.push(await inspectFrozenSource(root, catalogByPath, variant));

  const courseXmlRaw = await readFile(path.join(root, COURSE_XML_RELATIVE));
  const courseXmlLines = courseXmlRaw.toString("utf8").replace(/\r\n?/g, "\n").split("\n");
  const basenameMatches = courseXmlLines.flatMap((text, index) => (
    text.includes("L6FQ02.swf") ? [{line: index + 1, text: text.trim()}] : []
  ));
  invariant(basenameMatches.length === 1, `expected one active XML basename match; observed ${basenameMatches.length}`);
  invariant(basenameMatches[0].text.includes(">FQ/L6FQ02.swf</Page>"), "active XML placement changed");
  invariant(!courseXmlRaw.includes(Buffer.from("FQ/Review/L6FQ02.swf")), "Review variant unexpectedly became an exact active XML placement");
  invariant(!courseXmlRaw.includes(Buffer.from("FQ/Missing_AudioBtn_March21_2015/L6FQ02.swf")),
    "Missing_AudioBtn variant unexpectedly became an exact active XML placement");

  const inventoryRaw = await readFile(path.join(root, SCENARIO_INVENTORY_RELATIVE));
  const inventory = JSON.parse(inventoryRaw);
  const reviewSource = sources.find(({id}) => id === "review-pilot-source");
  invariant(inventory.animationId === ANIMATION_ID, "scenario inventory animation ID changed");
  invariant(inventory.source?.swf === reviewSource.path && inventory.source?.swfSha256 === reviewSource.sha256,
    "scenario inventory no longer binds the Review pilot source");
  invariant(inventory.courseXml?.currentPlacement?.matchStatus === "basename-only-conflict",
    "scenario inventory no longer preserves the basename-only placement conflict");
  invariant(inventory.courseXml?.currentPlacement?.exactPlacement === null,
    "scenario inventory unexpectedly claims an exact active placement");

  const ffdec = await inspectFfdec(ffdecArgument);
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-fq002-review-variants-"));
  invariant(path.dirname(temporaryRoot) === path.resolve(os.tmpdir()), `unsafe temporary FFDec path: ${temporaryRoot}`);
  const exportsById = new Map();
  try {
    for (const source of sources) {
      exportsById.set(source.id, await exportScripts({
        ffdec,
        sourceAbsolute: path.join(root, source.path),
        temporaryRoot,
        variantId: source.id,
      }));
    }
  } finally {
    await rm(temporaryRoot, {recursive: true, force: false});
  }

  const active = exportsById.get("active-course-placement");
  const review = exportsById.get("review-pilot-source");
  const missing = exportsById.get("missing-audio-button-history");
  for (const [id, exported] of exportsById) invariant(exported.records.length === 150, `${id} expected 150 scripts; observed ${exported.records.length}`);

  const activeReview = compareScriptExports("active-course-placement", active, "review-pilot-source", review);
  const activeMissing = compareScriptExports("active-course-placement", active, "missing-audio-button-history", missing);
  const reviewMissing = compareScriptExports("review-pilot-source", review, "missing-audio-button-history", missing);
  invariant(activeReview.sharedBodyCount === 148 && activeReview.leftOnly.length === 2 && activeReview.rightOnly.length === 2,
    "active/Review script-body relationship changed");
  invariant(activeMissing.sharedBodyCount === 148 && activeMissing.leftOnly.length === 2 && activeMissing.rightOnly.length === 2,
    "active/Missing_AudioBtn script-body relationship changed");
  invariant(reviewMissing.sharedBodyCount === 150 && reviewMissing.normalizedBodyMultisetsEqual,
    "Review/Missing_AudioBtn script-body relationship changed");

  const activeFinish = exactRecord(active, "DefineSprite_213/frame_2/DoAction.as");
  const reviewFinish = exactRecord(review, "DefineSprite_212/frame_2/DoAction.as");
  const activeClose = exactRecord(active, "DefineButton2_209/BUTTONCONDACTION on(release).as");
  const reviewHandoff = exactRecord(review, "DefineButton2_210/BUTTONCONDACTION on(release).as");
  invariant(activeFinish.normalized.includes('_parent.Mc_Finish.TxtScore.text = _global.CorAns + " / " + _global.TotQuiz + ".";'),
    "active result script no longer writes the finish score");
  invariant(!reviewFinish.normalized.includes("Mc_Finish.TxtScore.text"),
    "Review result script unexpectedly writes the finish score");
  invariant(activeClose.normalized.includes("_root.doCloseApp()") && activeClose.normalized.includes("getURL(strURL"),
    "active terminal button no longer contains the close/report branch");
  invariant(reviewHandoff.normalized.includes('_parent.gotoAndPlay("Review")') && !reviewHandoff.normalized.includes("getURL("),
    "Review terminal button no longer contains the local Review handoff");

  const scriptRaw = await readFile(scriptPath);
  return {
    schemaVersion: 1,
    artifactType: "help-math-fq002-review-variant-binding",
    animationId: ANIMATION_ID,
    bindingStatus: "source-variant-relationship-proven-runtime-host-unresolved",
    scope: "deterministic-read-only-frozen-source-and-ffdec-script-body-comparison",
    authorityStatement: [
      "The active course XML references FQ/L6FQ02.swf, while the pilot source is the distinct preserved FQ/Review/L6FQ02.swf binary.",
      "The three frozen SWFs are compared by byte identity and complete normalized FFDec ActionScript body multisets; matching script bodies do not make distinct SWF binaries aliases.",
      "This report does not prove which historical host loaded the Review variant, runtime reachability, random outcomes, audio timing, visual fidelity, or strict acceptance.",
    ],
    generator: {
      path: portable(path.relative(root, scriptPath)),
      sha256: sha256Buffer(scriptRaw),
      serialization: "recursive-key-sorted-pretty-json-with-terminal-lf-v1",
    },
    frozenCatalog: {
      path: CATALOG_RELATIVE,
      sha256: sha256Buffer(catalogRaw),
      schemaVersion: catalog.schemaVersion,
      fileCount: catalog.fileCount,
      totalBytes: catalog.totalBytes,
      checksumSetSha256: catalog.checksumSetSha256,
    },
    courseXml: {
      path: COURSE_XML_RELATIVE,
      bytes: courseXmlRaw.length,
      sha256: sha256Buffer(courseXmlRaw),
      activeBasenameMatches: basenameMatches,
      reviewExactPlacementCount: 0,
      missingAudioButtonExactPlacementCount: 0,
      disposition: "active-page-is-a-different-binary; no-original-review-host-inferred",
    },
    scenarioInventory: {
      path: SCENARIO_INVENTORY_RELATIVE,
      bytes: inventoryRaw.length,
      sha256: sha256Buffer(inventoryRaw),
      sourcePath: inventory.source.swf,
      sourceSha256: inventory.source.swfSha256,
      currentPlacementMatchStatus: inventory.courseXml.currentPlacement.matchStatus,
      exactPlacement: inventory.courseXml.currentPlacement.exactPlacement,
    },
    sources,
    toolchain: {
      ffdec: {
        version: ffdec.version,
        jarSha256: ffdec.jarSha256,
        command: ["ffdec", "-onerror", "abort", "-export", "script", "<temporary-output>", "<frozen-source-swf>"],
        retainedTemporaryExports: false,
      },
    },
    scriptExports: Object.fromEntries([...exportsById].map(([id, exported]) => [id, exported.summary])),
    pairwiseScriptBodyComparisons: [activeReview, activeMissing, reviewMissing],
    provenSemanticDeltasBetweenActiveAndReview: [
      {
        id: "finish-score-field",
        active: scriptBinding(activeFinish),
        review: scriptBinding(reviewFinish),
        disposition: "active-adds-Mc_Finish-score-text; Review-does-not",
      },
      {
        id: "terminal-button-release",
        active: scriptBinding(activeClose),
        review: scriptBinding(reviewHandoff),
        disposition: "active-closes-or-reports; Review-hides-button-and-hands-off-to-parent-Review-label",
      },
    ],
    variantRelationships: [
      {
        left: "active-course-placement",
        right: "review-pilot-source",
        relationship: "distinct-binaries-with-148-of-150-normalized-script-bodies-shared",
        aliasEligible: false,
      },
      {
        left: "review-pilot-source",
        right: "missing-audio-button-history",
        relationship: "distinct-binaries-with-all-150-normalized-FFDec-script-bodies-identical-but-shifted-definition-paths",
        aliasEligible: false,
        limitation: "Whole-SWF bytes and FFDec definition paths differ, so non-script assets/tags, object IDs, and runtime behavior still require independent audit.",
      },
    ],
    unresolvedHostQuestions: [
      "The active lesson XML does not name the Review or Missing_AudioBtn path.",
      "No source-proven historical shell entry, parent globals, deterministic random state, or complete event schedule has been bound to the Review pilot.",
      "The current two sprite-1168 default coverage requirements do not replace the inventory's question, feedback, branch, terminal, dependency, and random obligations.",
    ],
    strictAcceptanceEffect: "none; keep Review natural trace requirements blocked until a source-hash-bound authorized historical-host or explicitly accepted isolated-adapter execution covers every required branch/state",
  };
}

export async function writeOrCheckReport({root = projectRoot, ffdecArgument = "ffdec", check = false} = {}) {
  const report = await buildReport({root, ffdecArgument});
  const expected = Buffer.from(stableJson(report), "utf8");
  const outputPath = path.join(root, OUTPUT_RELATIVE);
  if (check) {
    const observed = await readFile(outputPath);
    invariant(observed.equals(expected), `${OUTPUT_RELATIVE} is stale; regenerate it`);
  } else {
    await mkdir(path.dirname(outputPath), {recursive: true});
    await writeFile(outputPath, expected);
  }
  return {path: OUTPUT_RELATIVE, bytes: expected.length, sha256: sha256Buffer(expected)};
}

function usage() {
  return `Usage: node scripts/build-fq002-review-variant-binding.mjs [options]\n\nOptions:\n  --check            Re-extract all three SWFs and verify the checked-in report\n  --ffdec <command>  FFDec 26.2.1 launcher (default: ffdec)\n  --root <directory> Project root (default: repository root)\n  -h, --help         Show this help\n`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const result = await writeOrCheckReport({root: options.root, ffdecArgument: options.ffdec, check: options.check});
  process.stdout.write(`${options.check ? "Verified" : "Generated"} ${result.path} (${result.bytes} bytes, sha256:${result.sha256})\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
