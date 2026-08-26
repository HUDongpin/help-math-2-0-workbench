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
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

import {
  CANONICAL_PROJECTION_ENCODING,
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const OUTPUT_PATH = "migrations/course-g03-l01-vb-004/audit/source-branch-candidates.json";
const EXPECTED_FFDEC_VERSION = "JPEXS Free Flash Decompiler v.26.2.1";
const EXPECTED_FFDEC_JAR_SHA256 = "090ab695053ad94cba6408574c7d7eea20ec60b6ae789ee6056a23f45106762f";
const SHA256 = /^[a-f0-9]{64}$/;

export const VB004_SOURCE_BRANCH_CANDIDATE_SCHEMA_VERSION = 1;
export const VB004_SOURCE_BRANCH_CANDIDATE_GENERATOR_VERSION = "1.2.0";

export const VB004_SOURCE_BRANCH_CONTRACT = deepFreeze({
  animationId: "course-g03-l01-vb-004",
  outputPath: OUTPUT_PATH,
  hostExport: {
    fileCount: 547,
    indexSha256: "d028db1e5af6808bc422f971efe06cfb10a8dd987c72d1b22eacdbdbf2b9ef27",
  },
  inputs: [
    ["source-swf", "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/VB/L1VB04.swf", "8c9860663714843b4d858a50528ad82d6783d8446c38d6f1cc77ec03a07ec72e"],
    ["source-fla", "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/VB/L1VB04.fla", "49f1694f1a7ec200d4d3455c1bc29699b83146043b7c0f25165228b32a9e3a1a"],
    ["same-lesson-host-swf", "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/index_local.swf", "69d0f39b3e7b4e93f7354f7096a2c38f2335277aec116b8d9bf35d740a571a8f"],
    ["course-xml", "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/index.xml", "f803cd0f01016385e8fd6d2ad11ee2b5379c82f252015999c62727c7fd581443"],
    ["spanish-mp3", "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/SA/L1VB04.mp3", "b594513fbc63da6f76cef1cfe55ed7e76dc5bb257a7007d4dda1d5295f6cf4f4"],
    ["authoring-audit", "migrations/course-g03-l01-vb-004/audit/adobe-animate-2021-authoring-audit.json", "38cbdd18a6d3f1fa2b75843fd6eb640ae59d6c36b670a100f7fb8bc018135e83"],
    ["scenario-inventory", "migrations/course-g03-l01-vb-004/audit/scenario-inventory.json", "ea40576e9ff190c818d180088ecc6389f7f0b1a821df59da4ceb77cf1334334c"],
    ["same-lesson-host-binding", "migrations/course-g03-l01-vb-004/audit/same-lesson-shell-host-entry-binding.json", "44d3398edfc9f38001d69f695e215e04520b22e3add9c1ec7fae781d19cc912a"],
    ["strict-readiness", "migrations/course-g03-l01-vb-004/audit/strict-readiness.json", "1cad9b8fb879daa40143ddc6687874711e330cbce0567fb8641f70ad57179d4d"],
    ["audio-runtime-evidence", "migrations/course-g03-l01-vb-004/audit/audio-runtime-evidence.json", "c4b948d2893d27477e7592e3657a85097f01054b83369beae2f512991e249184"],
    ["audio-listening-acceptance", "migrations/course-g03-l01-vb-004/evidence/audio-listening-acceptance.json", "1deaf7e4442d140cf87116c44c5dcdae9373d5c8cb6e071b4c39befb44f7d4c5"],
    ["full-frame-coverage", "migrations/course-g03-l01-vb-004/evidence/full-frame-coverage.json", "488213e7ffd844865260cc438793944b26eb646bd03b758d690c57b9b5d29a52"],
    ["trace-spec-en", "migrations/course-g03-l01-vb-004/audit/trace-specs/req-sprite-231-linear-to-quiz-stop-en.json", "d1cf82573fbea4935dd045ebd8cfc5a81d796aa9d7fe0b2df60a7a22f0de8912"],
    ["trace-spec-es", "migrations/course-g03-l01-vb-004/audit/trace-specs/req-sprite-231-linear-to-quiz-stop-es.json", "1e657f78e31e2214c77d96fe81eb6d90240f2024ce81e45ee3b084b3537bff21"],
    ["adapter-spec", "migrations/course-g03-l01-vb-004/audit/animate-createjs-adapter-spec.json", "56ae25c82a9ffe52e4f198bcda4badeb2f3680d40decc1078ef85cf1b33a8a49"],
    [
      "migration-manifest",
      "migrations/course-g03-l01-vb-004/migration.json",
      "1a7edf0137ee83cfc1a8e364fd50e315b0136edb984afa74cd21e11a89b322b2",
      undefined,
      CANONICAL_PROJECTION_ENCODING,
      TECHNICAL_MANIFEST_PROJECTION.id,
    ],
    ["machine-report", "migrations/course-g03-l01-vb-004/audit/machine/report.json", "160973b850ddc01139f31eeeaa39d2389e94051d4c6ddb014096491d9764d02f"],
    ["child-ffdec-scripts", "migrations/course-g03-l01-vb-004/audit/machine/ffdec-scripts.txt.gz", "e963fdcfa9648663d0c4abbe4c37b85e333f8d54a5761b227ef116a75e061538", "9cc062e1b3aa1a44aa421607db08b2c744e5a9f7296cf5093c01a0ae7daf7263"],
    ["child-swfmill-xml", "migrations/course-g03-l01-vb-004/audit/machine/swfmill.xml.gz", "1ded3d50d0d77bf74875b2eb922a37d50a4f5dc12322d1ade6cc43e6c54f7fd6", "6ca43b6b1b3bbe6bc3b50ede3e7568ccc648904ed4a247e1d6f91b9b78bdd7cf"],
  ].map(([evidenceId, filePath, sha256, uncompressedSha256, hashMode, projection]) => ({
    evidenceId,
    path: filePath,
    sha256,
    uncompressedSha256,
    ...(hashMode ? {hashMode, projection} : {}),
  })),
});

export const HOST_SCRIPT_DEFINITIONS = deepFreeze([
  {
    role: "host-feedback-random-selection",
    relativePath: "frame_35/DoAction.as",
    lineStart: 1134,
    lineEnd: 1148,
    rawSha256: "b57dbad5ab4970f2f8e126af6c4e64ed05a6e263208522f2f917a710a261dbb8",
    normalizedSha256: "f73d57f8a113e421cfa2af337e38ea182512be8433fcab45477c3bb40fd80cd2",
    mustContain: ["function showWrongFeed()", "random(3)", "function showRightFeed()", "random(4)", "gotoAndPlay(2)"],
  },
  {
    role: "host-terminal-monitor",
    relativePath: "frame_35/DoAction.as",
    lineStart: 1635,
    lineEnd: 1707,
    rawSha256: "b57dbad5ab4970f2f8e126af6c4e64ed05a6e263208522f2f917a710a261dbb8",
    normalizedSha256: "e8947f523ba7efed833d3ba70fc3e0550c3b4a0522251bfda9af41ea2145719a",
    mustContain: ["function doCheckPrevAndNext()", "_root.doCheckSpanishAudio()", "_root.animation_mc.animation.stop()"],
  },
  {
    role: "host-rewind-function",
    relativePath: "frame_35/DoAction.as",
    lineStart: 1972,
    lineEnd: 2012,
    rawSha256: "b57dbad5ab4970f2f8e126af6c4e64ed05a6e263208522f2f917a710a261dbb8",
    normalizedSha256: "cf48366ed5427e85f2426247a37e8023ed1c0e851cfdb59b68bf439cf4ab301c",
    mustContain: ["function doForAndRew()", "val -= 20", "gotoAndPlay(1)"],
  },
  {
    role: "host-glossary-function",
    relativePath: "frame_35/DoAction.as",
    lineStart: 2038,
    lineEnd: 2058,
    rawSha256: "b57dbad5ab4970f2f8e126af6c4e64ed05a6e263208522f2f917a710a261dbb8",
    normalizedSha256: "9ba8fc1ac23d11d507b19dfdeedd2b3929baabb16ad2ce468455affb9c91ac58",
    mustContain: ["function DoHyperLinks()", "KeyAttribute += \"~English\"", "doGetSubLink"],
  },
  {
    role: "host-spanish-audio-functions",
    relativePath: "frame_35/DoAction.as",
    lineStart: 2261,
    lineEnd: 2319,
    rawSha256: "b57dbad5ab4970f2f8e126af6c4e64ed05a6e263208522f2f917a710a261dbb8",
    normalizedSha256: "abb340898358f226930e03caeea1dfd476433cf292d6ecddcbcaf625e3b738b3",
    mustContain: ["function doPlaySpanishAudio()", "animation.stop()", '"/SA/"', "loadSound", "onSoundComplete", "function doStopSpanishAudio()"],
  },
  {
    role: "spanish-play-button",
    relativePath: "DefineButton2_221/BUTTONCONDACTION on(release).as",
    rawSha256: "e064aea52a09a1bb080d2194628fd7518587fae66bd4a20440df81d4c89e31d3",
    normalizedSha256: "0c57432147b74831cde8fae46320b50acfeef71d34d4dbeb4f64d0fc8561c6e6",
    mustContain: ["on(release)", "_root.doPlaySpanishAudio()"],
  },
  {
    role: "spanish-stop-button",
    relativePath: "DefineButton2_215/BUTTONCONDACTION on(release).as",
    rawSha256: "5dacf94a56789afb84d10eb6e3682c23241e82724da2a706c7d1f0fdf55cff15",
    normalizedSha256: "9da466c1795521bca9b460b3235d3b539279cd92c6fee91da647cb5ffdd7118f",
    mustContain: ["on(release)", "_root.doStopSpanishAudio()"],
  },
  {
    role: "replay-rollover",
    relativePath: "DefineButton2_244/BUTTONCONDACTION on(rollOver).as",
    rawSha256: "07cf022112b7b7bf0bc7d67e3b7a69b5dd7ad6f04adbc014c18d4ffc1b037e0e",
    normalizedSha256: "cca75be6b88d2a9c9f58eddb17523396fcca3b008c6841da51754a7d6b8aea63",
    mustContain: ["on(rollOver)", 'gotoAndPlay("replay")'],
  },
  {
    role: "replay-release",
    relativePath: "DefineButton2_244/BUTTONCONDACTION on(release).as",
    rawSha256: "3519f9dbc9e30c4c2bbe04fb78b21fa849d6c1949afa0582857b0cf23346386a",
    normalizedSha256: "22acd57ac5aaeecf5d096276afc511192c78a1c7c874dd11fbf5805b5fb8a080",
    mustContain: ["on(release)", "quizSection = false", "gSound.stop()", "_root.loadSWFMovie()"],
  },
  {
    role: "rewind-press",
    relativePath: "DefineButton2_585/BUTTONCONDACTION on(press).as",
    rawSha256: "0cf751e903bc567871946de354aa4f1ea40fa7a8caa053c28b222c612eed70e9",
    normalizedSha256: "33c16011b475d4f5ceedde8786365b8597c6bad0ef465b9d71ce9d58fcedf249",
    mustContain: ["on(press)", "quizSection = false", "animation.start = true", "rewind = 1"],
  },
  {
    role: "rewind-release",
    relativePath: "DefineButton2_585/BUTTONCONDACTION on(release, releaseOutside).as",
    rawSha256: "155184e06d60d591c11901ccd566953f5c6039e4cea1e4a9e42edb6e83f2bd0d",
    normalizedSha256: "e8978cba3017c32ddd71b6326ca1e08ca417fb460fd3d11c6920550eae32fd01",
    mustContain: ["on(release, releaseOutside)", "animation.start = false", "rewind = 0"],
  },
  {
    role: "rewind-enter-frame",
    relativePath: "frame_50/PlaceObject2_117_forward&rewind clip_74/CLIPACTIONRECORD onClipEvent(enterFrame).as",
    rawSha256: "f2e7defbc4410659333f2fc65590e09a49ffb9f0fafce09863fe188248841886",
    normalizedSha256: "1d8150f4f092ecb851235d6838b914d64a8dd783e0461352c19fe0b9959206c9",
    mustContain: ["onClipEvent(enterFrame)", "_root.doForAndRew()"],
  },
  {
    role: "terminal-enter-frame",
    relativePath: "frame_50/PlaceObject2_589_78/CLIPACTIONRECORD onClipEvent(enterFrame).as",
    rawSha256: "0f74c16ab4c673bd21f5d82f4c7bd77f2c003198d8870bda7764b3cd7699c035",
    normalizedSha256: "c9b24d3bf25d6a41fd70cdcfd7fc0d0c9a7edd4b6ae0a94fb89f542441940da2",
    mustContain: ["onClipEvent(enterFrame)", "_root.doCheckPrevAndNext()"],
  },
]);

const CORRECT_FEEDBACK = deepFreeze([
  [1, 213, 27, "DefineSprite_213/frame_27/DoAction.as"],
  [2, 188, 27, "DefineSprite_188/frame_27/DoAction.as"],
  [3, 229, 28, "DefineSprite_229/frame_28/DoAction.as"],
  [4, 121, 27, "DefineSprite_121/frame_27/DoAction.as"],
].map(([number, objectId, terminalFrame, script]) => ({number, objectId, terminalFrame, script})));

const WRONG_FEEDBACK = deepFreeze([
  [1, 97, 29, "DefineSprite_97/frame_29/DoAction.as"],
  [2, 109, 31, "DefineSprite_109/frame_31/DoAction.as"],
  [3, 85, 28, "DefineSprite_85/frame_28/DoAction.as"],
].map(([number, objectId, terminalFrame, script]) => ({number, objectId, terminalFrame, script})));

const GLOSSARY = deepFreeze([
  [10, "Digit"],
  [11, "Tens place"],
  [12, "Value"],
  [22, "Place value chart"],
].map(([objectId, keyAttribute]) => ({objectId, keyAttribute})));

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort(compareText).map((key) => [key, stable(value[key])]));
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

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function findOnPath(name, pathValue = process.env.PATH || "") {
  if (path.isAbsolute(name) || name.includes(path.sep)) return path.resolve(name);
  for (const directory of pathValue.split(path.delimiter)) {
    if (!directory) continue;
    const candidate = path.join(directory, name);
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      // Keep searching for the explicitly requested executable.
    }
  }
  return null;
}

function run(command, args, {timeoutMs = 60_000} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {stdio: ["ignore", "pipe", "pipe"]});
    const stdout = [];
    const stderr = [];
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${command} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      const result = {stdout: Buffer.concat(stdout).toString("utf8"), stderr: Buffer.concat(stderr).toString("utf8")};
      if (code === 0) resolve(result);
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}\n${result.stderr || result.stdout}`));
    });
  });
}

export function parseArguments(argumentsList, {projectRoot = defaultProjectRoot} = {}) {
  const options = {check: false, ffdec: "ffdec", root: projectRoot};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--ffdec" || value === "--root") {
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
  return `${raw.toString("utf8").replace(/\r\n?/g, "\n").replace(/\n*$/g, "")}\n`;
}

export function buildActionScriptExcerpt(record, definition) {
  invariant(record, `${definition.role}: exported host script is missing (${definition.relativePath})`);
  const normalized = normalizeActionScript(record.raw);
  const lines = normalized.trimEnd().split("\n");
  const lineStart = definition.lineStart || 1;
  const lineEnd = definition.lineEnd || lines.length;
  invariant(lineStart >= 1 && lineEnd >= lineStart && lineEnd <= lines.length,
    `${definition.role}: invalid line range ${lineStart}-${lineEnd} for ${lines.length} lines`);
  const text = `${lines.slice(lineStart - 1, lineEnd).join("\n")}\n`;
  const missingTokens = definition.mustContain.filter((token) => !text.includes(token));
  const excerpt = {
    role: definition.role,
    artifact: definition.relativePath,
    lineStart,
    lineEnd,
    rawBytes: record.raw.length,
    rawSha256: sha256(record.raw),
    normalization: "CRLF-or-CR-to-LF; remove terminal newlines; append exactly one LF",
    normalizedBytes: Buffer.byteLength(text, "utf8"),
    normalizedSha256: sha256(text),
    requiredTokens: [...definition.mustContain],
    missingTokens,
    exact: missingTokens.length === 0,
    text,
  };
  invariant(excerpt.rawSha256 === definition.rawSha256,
    `${definition.role}: raw SHA-256 mismatch (expected ${definition.rawSha256}, observed ${excerpt.rawSha256})`);
  invariant(excerpt.normalizedSha256 === definition.normalizedSha256,
    `${definition.role}: normalized SHA-256 mismatch (expected ${definition.normalizedSha256}, observed ${excerpt.normalizedSha256})`);
  invariant(excerpt.exact, `${definition.role}: missing required tokens: ${missingTokens.join(", ")}`);
  return excerpt;
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
  invariant(await exists(jarPath), `FFDec jar is missing next to launcher: ${jarPath}`);
  const jarSha256 = await sha256File(jarPath);
  invariant(jarSha256 === EXPECTED_FFDEC_JAR_SHA256,
    `FFDec jar hash changed: expected ${EXPECTED_FFDEC_JAR_SHA256}, observed ${jarSha256}`);
  return {launcherPath, version, jarSha256};
}

export async function extractHostActionScript({sourceSwf, ffdec = "ffdec", contract = VB004_SOURCE_BRANCH_CONTRACT} = {}) {
  invariant(sourceSwf, "sourceSwf is required");
  const tool = await inspectFfdec(ffdec);
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-vb004-source-branches-"));
  invariant(path.dirname(temporaryRoot) === path.resolve(os.tmpdir()), `unsafe temporary path: ${temporaryRoot}`);
  try {
    await run(tool.launcherPath, ["-onerror", "abort", "-export", "script", temporaryRoot, sourceSwf]);
    const scriptsRoot = path.join(temporaryRoot, "scripts");
    const files = await listFilesRecursively(scriptsRoot);
    const records = await Promise.all(files.map(async ({absolute, relativePath}) => ({relativePath, raw: await readFile(absolute)})));
    const index = records.map(({relativePath, raw}) => ({path: relativePath, bytes: raw.length, sha256: sha256(raw)}));
    const fullExportIndexSha256 = sha256(stableJson(index));
    invariant(records.length === contract.hostExport.fileCount,
      `host FFDec export file count changed: expected ${contract.hostExport.fileCount}, observed ${records.length}`);
    invariant(fullExportIndexSha256 === contract.hostExport.indexSha256,
      `host FFDec export index changed: expected ${contract.hostExport.indexSha256}, observed ${fullExportIndexSha256}`);
    const byPath = new Map(records.map((record) => [record.relativePath, record]));
    return {
      toolchain: {version: tool.version, jarSha256: tool.jarSha256},
      fullExportFileCount: records.length,
      fullExportIndexHashMode: "stable-key-sorted-pretty-json-array-v1",
      fullExportIndexSha256,
      excerpts: HOST_SCRIPT_DEFINITIONS.map((definition) => buildActionScriptExcerpt(byPath.get(definition.relativePath), definition)),
    };
  } finally {
    await rm(temporaryRoot, {recursive: true, force: false});
  }
}

function validateInjectedHostActionScript(hostActionScript, contract = VB004_SOURCE_BRANCH_CONTRACT) {
  invariant(hostActionScript?.fullExportFileCount === contract.hostExport.fileCount, "host action-script fixture has the wrong file count");
  invariant(hostActionScript?.fullExportIndexSha256 === contract.hostExport.indexSha256, "host action-script fixture has the wrong export index hash");
  invariant(hostActionScript?.toolchain?.version === EXPECTED_FFDEC_VERSION, "host action-script fixture has the wrong FFDec version");
  invariant(hostActionScript?.toolchain?.jarSha256 === EXPECTED_FFDEC_JAR_SHA256, "host action-script fixture has the wrong FFDec jar hash");
  invariant(Array.isArray(hostActionScript.excerpts) && hostActionScript.excerpts.length === HOST_SCRIPT_DEFINITIONS.length,
    "host action-script fixture has the wrong excerpt count");
  for (const definition of HOST_SCRIPT_DEFINITIONS) {
    const matches = hostActionScript.excerpts.filter(({role}) => role === definition.role);
    invariant(matches.length === 1, `${definition.role}: expected exactly one injected excerpt`);
    const excerpt = matches[0];
    invariant(excerpt.artifact === definition.relativePath, `${definition.role}: injected artifact path changed`);
    invariant(excerpt.rawSha256 === definition.rawSha256, `${definition.role}: injected raw hash changed`);
    invariant(excerpt.normalizedSha256 === definition.normalizedSha256, `${definition.role}: injected normalized hash changed`);
    invariant(excerpt.lineStart === (definition.lineStart || 1), `${definition.role}: injected lineStart changed`);
    invariant(typeof excerpt.text === "string" && sha256(excerpt.text) === definition.normalizedSha256,
      `${definition.role}: injected text does not match its normalized hash`);
    for (const token of definition.mustContain) invariant(excerpt.text.includes(token), `${definition.role}: injected text is missing ${token}`);
  }
  return hostActionScript;
}

async function readBoundInput(root, definition) {
  invariant(SHA256.test(definition.sha256), `${definition.evidenceId}: invalid expected SHA-256`);
  const absolute = path.resolve(root, definition.path);
  const relative = path.relative(root, absolute);
  invariant(relative && !relative.startsWith("..") && !path.isAbsolute(relative), `${definition.evidenceId}: path escapes project root`);
  const metadata = await lstat(absolute);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${definition.evidenceId}: expected a regular non-symlink file`);
  const bytes = await readFile(absolute);
  const fileSha256 = sha256(bytes);
  let observedSha256 = fileSha256;
  if (definition.hashMode || definition.projection) {
    invariant(
      definition.hashMode === CANONICAL_PROJECTION_ENCODING
        && definition.projection === TECHNICAL_MANIFEST_PROJECTION.id,
      `${definition.evidenceId}: unsupported projection binding`,
    );
    let manifest;
    try {
      manifest = JSON.parse(bytes.toString("utf8"));
    } catch (error) {
      throw new Error(`${definition.evidenceId}: invalid projected manifest JSON (${error.message})`);
    }
    observedSha256 = technicalManifestSha256(manifest);
  }
  invariant(observedSha256 === definition.sha256,
    `${definition.evidenceId}: SHA-256 mismatch (expected ${definition.sha256}, observed ${observedSha256})`);
  let uncompressed = null;
  if (definition.uncompressedSha256) {
    uncompressed = gunzipSync(bytes);
    const observedUncompressedSha256 = sha256(uncompressed);
    invariant(observedUncompressedSha256 === definition.uncompressedSha256,
      `${definition.evidenceId}: uncompressed SHA-256 mismatch (expected ${definition.uncompressedSha256}, observed ${observedUncompressedSha256})`);
  }
  return {
    definition,
    absolute,
    bytes,
    uncompressed,
    evidence: {
      evidenceId: definition.evidenceId,
      path: portable(definition.path),
      sha256: observedSha256,
      ...(definition.hashMode
        ? {hashMode: definition.hashMode, projection: definition.projection}
        : {bytes: bytes.length}),
      ...(uncompressed
        ? {uncompressedBytes: uncompressed.length, uncompressedSha256: definition.uncompressedSha256}
        : {}),
    },
  };
}

function parseJson(input) {
  try {
    return JSON.parse(input.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${input.definition.evidenceId}: invalid JSON (${error.message})`);
  }
}

function findOne(items, predicate, label) {
  const matches = (items || []).filter(predicate);
  invariant(matches.length === 1, `${label}: expected exactly one match, observed ${matches.length}`);
  return matches[0];
}

function evidenceReference(evidenceById, evidenceId, locator = {}) {
  const evidence = evidenceById.get(evidenceId);
  invariant(evidence, `unknown evidence ID: ${evidenceId}`);
  return {evidenceId, path: evidence.path, sha256: evidence.sha256, ...locator};
}

function hostEvidenceReference(evidenceById, hostActionScript, role) {
  const excerpt = findOne(hostActionScript.excerpts, (candidate) => candidate.role === role, `host excerpt ${role}`);
  return {
    ...evidenceReference(evidenceById, "same-lesson-host-swf"),
    extraction: {
      ffdecVersion: hostActionScript.toolchain.version,
      ffdecJarSha256: hostActionScript.toolchain.jarSha256,
      fullExportFileCount: hostActionScript.fullExportFileCount,
      fullExportIndexSha256: hostActionScript.fullExportIndexSha256,
      artifact: excerpt.artifact,
      lineStart: excerpt.lineStart,
      lineEnd: excerpt.lineEnd,
      rawSha256: excerpt.rawSha256,
      normalizedSha256: excerpt.normalizedSha256,
    },
  };
}

function handlerForObject(inventory, objectId) {
  return findOne(inventory.interactions?.handlers, (handler) => String(handler.scope?.objectId) === String(objectId), `button handler ${objectId}`);
}

function timelineForObject(inventory, objectId) {
  return findOne(inventory.timelineInventory, (timeline) => String(timeline.objectId) === String(objectId), `timeline object ${objectId}`);
}

function scriptLocator(handler) {
  return {
    artifact: handler.evidence?.script,
    lineStart: handler.evidence?.lineStart,
    lineEnd: handler.evidence?.lineEnd,
    bodySha256: handler.bodySha256,
  };
}

function feedbackCandidate({kind, definition, localTimeline, inventory, evidenceById, hostActionScript}) {
  const prefix = kind === "correct" ? "Mc_Right_Feed" : "Mc_Wrong_Feed";
  const placement = findOne(
    localTimeline.namedPlacements,
    ({frame, name, objectId}) => frame === 56 && name === `${prefix}${definition.number}` && String(objectId) === String(definition.objectId),
    `${prefix}${definition.number} placement`,
  );
  const timeline = timelineForObject(inventory, definition.objectId);
  invariant(timeline.frameCount === definition.terminalFrame, `${prefix}${definition.number}: terminal frame changed`);
  const terminal = findOne(timeline.controlStates, ({frame}) => frame === definition.terminalFrame, `${prefix}${definition.number} terminal control state`);
  const scriptEvidenceMatches = terminal.evidence.filter(
    ({artifactId, script}) => artifactId === "ffdec-scripts" && script === definition.script,
  );
  invariant(scriptEvidenceMatches.length >= 1, `${prefix}${definition.number}: terminal script evidence is missing`);
  const scriptEvidence = scriptEvidenceMatches[0];
  invariant(scriptEvidenceMatches.every(({lineStart, lineEnd}) => (
    lineStart === scriptEvidence.lineStart && lineEnd === scriptEvidence.lineEnd
  )), `${prefix}${definition.number}: duplicate terminal script evidence disagrees`);
  return {
    candidateId: `${kind}-feedback-${definition.number}`,
    classification: "static-source-branch-candidate-runtime-unverified",
    readySchedule: false,
    randomSelectionCandidate: {
      sourceExpression: kind === "correct" ? "random(4) + 1" : "random(3) + 1",
      resultValue: definition.number,
      traceSeedBindingProven: false,
    },
    sourcePlacement: {
      timelineId: "sprite-231",
      entryFrame: 56,
      instanceName: placement.name,
      objectId: Number(placement.objectId),
      depth: Number(placement.depth),
    },
    feedbackTimeline: {
      timelineId: timeline.timelineId,
      objectId: Number(timeline.objectId),
      playFromFrameCandidate: 2,
      terminalFrame: definition.terminalFrame,
      terminalScript: definition.script,
      terminalControlReasons: terminal.reasons,
      continuationCandidate: kind === "correct"
        ? "terminal script clears quizSection, resets the feedback clip, and calls _parent.play()"
        : "terminal script re-enables quiz controls; _parent.play() is conditional on quizTryCount >= 2",
    },
    evidence: [
      hostEvidenceReference(evidenceById, hostActionScript, "host-feedback-random-selection"),
      evidenceReference(evidenceById, "scenario-inventory", {jsonLocator: `timelineInventory[timelineId=${timeline.timelineId}]`}),
      evidenceReference(evidenceById, "child-ffdec-scripts", {
        artifact: scriptEvidence.script,
        lineStart: scriptEvidence.lineStart,
        lineEnd: scriptEvidence.lineEnd,
      }),
      evidenceReference(evidenceById, "child-swfmill-xml", {timelineId: "sprite-231", frame: 56}),
    ],
    blockers: ["feedback-random-unbound-to-trace-seed", "runtime-reachability", "terminal-shell-event-ordering"],
  };
}

function derivedBlocker(id, statement, requiredResolution, evidence) {
  return {id, status: "unresolved", statement, requiredResolution, evidence};
}

export async function buildVb004SourceBranchCandidates({
  root = defaultProjectRoot,
  generatorPath = scriptPath,
  ffdec = "ffdec",
  hostActionScript: injectedHostActionScript = null,
  contract = VB004_SOURCE_BRANCH_CONTRACT,
} = {}) {
  const loaded = await Promise.all(contract.inputs.map((definition) => readBoundInput(root, definition)));
  const byId = new Map(loaded.map((input) => [input.definition.evidenceId, input]));
  const evidenceIndex = loaded.map(({evidence}) => evidence);
  const evidenceById = new Map(evidenceIndex.map((evidence) => [evidence.evidenceId, evidence]));

  const inventory = parseJson(byId.get("scenario-inventory"));
  const hostBinding = parseJson(byId.get("same-lesson-host-binding"));
  const readiness = parseJson(byId.get("strict-readiness"));
  const audio = parseJson(byId.get("audio-runtime-evidence"));
  const audioAcceptance = parseJson(byId.get("audio-listening-acceptance"));
  const coverage = parseJson(byId.get("full-frame-coverage"));
  const traceEn = parseJson(byId.get("trace-spec-en"));
  const traceEs = parseJson(byId.get("trace-spec-es"));
  const adapter = parseJson(byId.get("adapter-spec"));
  const authoring = parseJson(byId.get("authoring-audit"));
  const childScripts = byId.get("child-ffdec-scripts").uncompressed.toString("utf8");

  invariant(inventory.animationId === contract.animationId, "scenario inventory animation ID changed");
  invariant(inventory.inventoryStatus === "static-exhaustive-runtime-unverified", "scenario inventory authority changed");
  invariant(hostBinding.bindingStatus === "static-candidate-runtime-unverified", "same-lesson host binding authority changed");
  invariant(readiness.conclusion?.strictAcceptanceReady === false, "strict readiness unexpectedly became ready");
  invariant(audio.acceptance?.strictAudioAcceptance === "pending", "audio acceptance unexpectedly changed");
  invariant(audioAcceptance.status === "pending" && audioAcceptance.review?.decision === "pending", "audio listening acceptance unexpectedly changed");
  invariant(traceEn.traceSpecStatus === "unresolved" && traceEs.traceSpecStatus === "unresolved", "nested trace spec unexpectedly became resolved");
  invariant(traceEn.schedule?.orderedSteps?.length === 0 && traceEs.schedule?.orderedSteps?.length === 0, "nested trace schedule is no longer empty");

  const hostSourcePath = byId.get("same-lesson-host-swf").absolute;
  const hostActionScript = validateInjectedHostActionScript(
    injectedHostActionScript || await extractHostActionScript({sourceSwf: hostSourcePath, ffdec, contract}),
    contract,
  );

  const rootTimeline = findOne(inventory.timelineInventory, ({timelineId}) => timelineId === "root", "root timeline");
  const localTimeline = findOne(inventory.timelineInventory, ({timelineId}) => timelineId === "sprite-231", "sprite-231 timeline");
  invariant(rootTimeline.frameCount === 10 && localTimeline.frameCount === 222, "root or sprite-231 frame count changed");
  const rootPlacement = findOne(
    rootTimeline.namedPlacements,
    ({frame, name, objectId}) => frame === 6 && name === "animation" && String(objectId) === "231",
    "root begin animation placement",
  );
  const stopState = findOne(localTimeline.controlStates, ({frame}) => frame === 56, "sprite-231 frame-56 control state");
  invariant(stopState.reasons.includes("script-stop-state"), "sprite-231 frame 56 is no longer a script stop");
  invariant(childScripts.includes("_global.quizSection = true;") && childScripts.includes("_global.quizTryCount = 0;"),
    "sprite-231 frame-56 quiz initialization changed");
  invariant(childScripts.includes("===== DefineSprite_231/frame_57/DoAction.as =====\n_global.quizSection = false;"),
    "sprite-231 frame-57 continuation script changed");

  const correctHandler = handlerForObject(inventory, 32);
  const wrongHandlers = [handlerForObject(inventory, 31), handlerForObject(inventory, 33)];
  invariant(correctHandler.categories.includes("correct-outcome"), "object 32 is no longer classified correct");
  for (const handler of wrongHandlers) invariant(handler.categories.includes("wrong-outcome"), `object ${handler.scope.objectId} is no longer classified wrong`);

  const correctFeedback = CORRECT_FEEDBACK.map((definition) => feedbackCandidate({
    kind: "correct", definition, localTimeline, inventory, evidenceById, hostActionScript,
  }));
  const wrongFeedback = WRONG_FEEDBACK.map((definition) => feedbackCandidate({
    kind: "wrong", definition, localTimeline, inventory, evidenceById, hostActionScript,
  }));

  const glossaryHyperlink = GLOSSARY.map(({objectId, keyAttribute}) => {
    const handler = handlerForObject(inventory, objectId);
    const assignment = findOne(
      handler.signals?.assignments,
      ({target, expression}) => target === "_global.KeyAttribute" && expression === JSON.stringify(keyAttribute),
      `glossary object ${objectId} KeyAttribute assignment`,
    );
    invariant(handler.signals?.calls?.some(({target}) => target === "_root.DoHyperLinks"), `glossary object ${objectId} no longer calls DoHyperLinks`);
    return {
      candidateId: `glossary-${keyAttribute.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      classification: "static-source-interaction-candidate-runtime-unverified",
      readySchedule: false,
      sourceTarget: {
        buttonObjectId: objectId,
        event: "release",
        keyAttribute,
        placements: handler.hitTarget?.placements,
        exactStageBoundsStatus: handler.hitTarget?.exactStageBoundsStatus,
      },
      hostEffectCandidate: {
        function: "DoHyperLinks",
        sourceAppendsLanguageSuffix: "~English",
        closeOrResumeEventProven: false,
      },
      evidence: [
        evidenceReference(evidenceById, "scenario-inventory", {jsonLocator: `interactions.handlers[id=${handler.id}]`}),
        evidenceReference(evidenceById, "child-ffdec-scripts", {artifact: handler.script, line: assignment.evidence?.line}),
        hostEvidenceReference(evidenceById, hostActionScript, "host-glossary-function"),
        evidenceReference(evidenceById, "child-swfmill-xml", {buttonObjectId: objectId}),
      ],
      blockers: ["hit-geometry", "host-defaults", "glossary-return-path-unresolved", "runtime-reachability"],
    };
  });

  const quizTryLines = childScripts.split(/\r?\n/)
    .map((text, index) => ({bundleLine: index + 1, text}))
    .filter(({text}) => text.includes("quizTryCount"));
  invariant(quizTryLines.length === 7, `quizTryCount reference count changed: expected 7, observed ${quizTryLines.length}`);
  invariant(quizTryLines.every(({text}) => text.includes(">= 2") || text.includes("= 0")),
    "an unreviewed quizTryCount mutation appeared in the child script bundle");
  const attemptBinding = findOne(inventory.dependencies?.bindings, ({binding}) => binding === "_global.quizTryCount", "quizTryCount dependency binding");
  invariant(attemptBinding.observedAssignments.every(({operator, expression}) => operator === "=" && expression === "0"),
    "quizTryCount dependency now includes a non-reset assignment");

  const externalSpanishAudio = findOne(
    audio.externalAudio?.exactAssociations,
    ({sourceFile, observedSha256}) => sourceFile.endsWith("/SA/L1VB04.mp3") && observedSha256 === evidenceById.get("spanish-mp3").sha256,
    "Spanish L1VB04 MP3 association",
  );
  const embeddedStream = findOne(audio.embeddedAudio?.soundStreams, ({context}) => context?.characterId === 231, "sprite-231 embedded stream");
  const enRequirement = findOne(coverage.requirements, ({requirementId}) => requirementId === "req:sprite-231:linear-to-quiz-stop:en", "EN coverage requirement");
  const esRequirement = findOne(coverage.requirements, ({requirementId}) => requirementId === "req:sprite-231:linear-to-quiz-stop:es", "ES coverage requirement");
  invariant(enRequirement.requiredRange.lastFrame === 222 && esRequirement.requiredRange.lastFrame === 222, "nested coverage range changed");
  for (const requirement of [enRequirement, esRequirement]) {
    invariant(
      requirement.status === "blocked" &&
        requirement.baselineAuthority === "unresolved" &&
        requirement.baselineCaptureManifest === "" &&
        requirement.baselineCaptureManifestSha256 === "" &&
        requirement.metricsFile === "" &&
        requirement.metricsSha256 === "",
      `${requirement.requirementId}: current-JavaScript capture was promoted beyond its acceptance-neutral boundary`,
    );
    invariant(
      requirement.capturedFrameCount === 222 &&
        Array.isArray(requirement.missingFrames) &&
        requirement.missingFrames.length === 0 &&
        typeof requirement.captureManifest === "string" &&
        requirement.captureManifest.length > 0 &&
        SHA256.test(String(requirement.captureManifestSha256)),
      `${requirement.requirementId}: deterministic current-JavaScript coverage is incomplete or unbound`,
    );
  }

  const generatorBytes = await readFile(generatorPath);
  const inputReference = (evidenceId, locator = {}) => evidenceReference(evidenceById, evidenceId, locator);
  const derivedBlockers = [
    derivedBlocker(
      "coverage-range-requires-post-stop-actions",
      "Both current linear-to-quiz-stop requirements demand frames 1-222, while static source stops natural no-action playback at local frame 56.",
      "Split the first-stop trace from each source-proven interaction/random branch before defining an executable schedule.",
      [inputReference("full-frame-coverage"), inputReference("child-ffdec-scripts", {artifact: "DefineSprite_231/frame_56/DoAction.as", lineStart: 152, lineEnd: 155})],
    ),
    derivedBlocker(
      "feedback-random-unbound-to-trace-seed",
      "The host selects correct feedback with random(4)+1 and wrong feedback with random(3)+1, but the trace seed has no proven binding to AVM1 random state.",
      "Capture and bind each original random outcome or prove a source-faithful deterministic fixture.",
      [hostEvidenceReference(evidenceById, hostActionScript, "host-feedback-random-selection"), inputReference("trace-spec-en"), inputReference("trace-spec-es")],
    ),
    derivedBlocker(
      "wrong-attempt-counter-has-no-observed-increment",
      "The child bundle has four resets and three >=2 tests for quizTryCount, but no observed increment; second-wrong forced continuation is not statically reachable from the visible assignments.",
      "Use authorized runtime observation or additional source evidence to resolve whether this is a legacy bug or an external mutation.",
      [inputReference("child-ffdec-scripts", {bundleLines: quizTryLines}), inputReference("scenario-inventory", {jsonLocator: "dependencies.bindings[binding=_global.quizTryCount]"})],
    ),
    derivedBlocker(
      "glossary-return-path-unresolved",
      "The four child handlers stop the animation and call the host glossary function, but close/resume ordering is not bound to this child.",
      "Traverse every glossary activation and return path in the authorized same-lesson host.",
      [hostEvidenceReference(evidenceById, hostActionScript, "host-glossary-function"), inputReference("scenario-inventory")],
    ),
    derivedBlocker(
      "spanish-trigger-and-synchronization-unresolved",
      "Spanish audio is a user-activated host path that stops the child, loads SA/L1VB04.mp3, and conditionally resumes; no exact trigger frame, listening result, or synchronization trace is accepted.",
      "Record source button placement, trigger time, spoken-language listening, pause/resume, completion, and frame synchronization in the authorized host.",
      [hostEvidenceReference(evidenceById, hostActionScript, "host-spanish-audio-functions"), inputReference("audio-runtime-evidence"), inputReference("audio-listening-acceptance"), inputReference("spanish-mp3")],
    ),
    derivedBlocker(
      "replay-full-reset-unresolved",
      "A shell control labeled by rollover as replay reloads the current SWF, and a separate rewind control can return toward frame 1, but neither candidate proves the complete reset vector.",
      "Execute the actual Replay control and verify timeline, quiz attempts, feedback, random state, language, audio, overlays, and host navigation before/after reset.",
      [hostEvidenceReference(evidenceById, hostActionScript, "replay-rollover"), hostEvidenceReference(evidenceById, hostActionScript, "replay-release"), hostEvidenceReference(evidenceById, hostActionScript, "host-rewind-function")],
    ),
    derivedBlocker(
      "terminal-shell-event-ordering",
      "The child has no frame-222 stop action; the full shell enterFrame monitor may stop it at the total-frame boundary, so draw/monitor/stop order is runtime-unverified.",
      "Capture the complete same-lesson shell at frame 222 with event-order and terminal-state logging.",
      [hostEvidenceReference(evidenceById, hostActionScript, "terminal-enter-frame"), hostEvidenceReference(evidenceById, hostActionScript, "host-terminal-monitor"), inputReference("same-lesson-host-binding")],
    ),
    derivedBlocker(
      "adapter-scenario-pin-stale",
      `The adapter records scenario inventory SHA ${adapter.evidence?.scenarioInventorySha256}, while the current bound inventory SHA is ${evidenceById.get("scenario-inventory").sha256}.`,
      "A named human must separately review any semantic pin refresh; this artifact must not update it.",
      [inputReference("adapter-spec"), inputReference("scenario-inventory")],
    ),
    derivedBlocker(
      "authoritative-captures-rmse-and-review-missing",
      "EN and ES nested requirements each have complete deterministic current-JavaScript implementation captures, but zero accepted original-runtime baseline frames, no paired RMSE metrics, and no terminal/audio/human/owner acceptance.",
      "Complete source-authoritative capture, per-frame metrics, diff review, audio acceptance, product QA, human review, and owner acceptance.",
      [inputReference("full-frame-coverage"), inputReference("strict-readiness"), inputReference("audio-listening-acceptance")],
    ),
  ];

  return {
    schemaVersion: VB004_SOURCE_BRANCH_CANDIDATE_SCHEMA_VERSION,
    artifactType: "help-math-vb004-acceptance-neutral-source-branch-candidates",
    animationId: contract.animationId,
    artifactStatus: "static-source-candidates-runtime-unverified",
    scope: "deterministic hash-bound static evidence only",
    generatedBy: {
      script: portable(path.relative(root, generatorPath)),
      scriptSha256: sha256(generatorBytes),
      version: VB004_SOURCE_BRANCH_CANDIDATE_GENERATOR_VERSION,
      toolchain: {
        ffdec: hostActionScript.toolchain,
      },
    },
    writeBoundary: {
      onlyOutput: contract.outputPath,
      modifiesTraceSpecs: false,
      modifiesCoverage: false,
      modifiesScenarioInventory: false,
      modifiesAdapterOrSemanticPin: false,
      modifiesMigrationStatus: false,
      modifiesHumanOrOwnerApproval: false,
      modifiesSourceAssets: false,
    },
    authorityBoundary: {
      readySchedule: false,
      originalRuntimeExecutionLog: false,
      authoritativeBaseline: false,
      runtimeReachabilityProven: false,
      audioListeningOrSynchronizationAccepted: false,
      rmseOrVisualFidelityProven: false,
      replayOrTerminalAccepted: false,
      humanReviewRecorded: false,
      ownerAcceptanceRecorded: false,
      strictAcceptanceEffect: "none",
      completionClaimAllowed: false,
    },
    evidenceIndex,
    hostActionScriptEvidence: {
      sourceEvidence: inputReference("same-lesson-host-swf"),
      fullExportFileCount: hostActionScript.fullExportFileCount,
      fullExportIndexHashMode: hostActionScript.fullExportIndexHashMode,
      fullExportIndexSha256: hostActionScript.fullExportIndexSha256,
      excerpts: hostActionScript.excerpts,
    },
    sourceFacts: {
      nativeStage: {width: 800, height: 600},
      fps: 12,
      rootFrameCount: 10,
      childFrameDomain: {timelineId: "sprite-231", objectId: 231, frameCount: 222},
      rootEntryCandidate: {
        rootFrame: 6,
        label: "begin",
        instanceName: rootPlacement.name,
        objectId: Number(rootPlacement.objectId),
        depth: Number(rootPlacement.depth),
        localEntryFrame: 1,
      },
      authoringAuditSchemaVersion: authoring.schemaVersion,
      scenarioInventoryStatus: inventory.inventoryStatus,
      sameLessonHostBindingStatus: hostBinding.bindingStatus,
    },
    branchCandidates: {
      naturalToFirstQuizStop: {
        candidateId: "natural-to-first-quiz-stop",
        classification: "partial-static-source-path-runtime-unverified",
        readySchedule: false,
        sourceStructuredFrameRange: {firstFrame: 1, lastFrame: 56},
        noUserActionCandidateWithinRange: true,
        entryCandidate: hostBinding.protocol?.sourceDerivedCandidateSequence,
        firstStopCheckpointCandidate: {
          localFrame: 56,
          playback: "stopped",
          quizSection: true,
          quizTryCount: 0,
        },
        postStopRange: {firstFrame: 57, lastFrame: 222, sourceEvidencedActionRequired: true},
        evidence: [
          inputReference("same-lesson-host-binding"),
          inputReference("scenario-inventory", {jsonLocator: "timelineInventory[timelineId=sprite-231].controlStates[frame=56]"}),
          inputReference("child-ffdec-scripts", {artifact: "DefineSprite_231/frame_56/DoAction.as", lineStart: 152, lineEnd: 155}),
          inputReference("child-swfmill-xml", {timelineId: "sprite-231", frameRange: [1, 56]}),
          inputReference("authoring-audit", {jsonLocator: "authoringAudit.library[name=Animation03]"}),
        ],
        blockers: ["runtime-reachability", "readiness-missing-01", "coverage-range-requires-post-stop-actions"],
      },
      correctTrigger: {
        classification: "static-source-handler-candidate-runtime-unverified",
        readySchedule: false,
        stopFrame: 56,
        event: "release",
        sourceTarget: {
          buttonObjectId: 32,
          handler: correctHandler.script,
          placements: correctHandler.hitTarget?.placements,
          exactStageBoundsStatus: correctHandler.hitTarget?.exactStageBoundsStatus,
        },
        candidateEffect: "disable quiz buttons, optionally report click, then call showRightFeed()",
        evidence: [inputReference("scenario-inventory", {jsonLocator: `interactions.handlers[id=${correctHandler.id}]`}), inputReference("child-ffdec-scripts", scriptLocator(correctHandler))],
      },
      correctFeedback,
      wrongTriggers: wrongHandlers.map((handler) => ({
        classification: "static-source-handler-candidate-runtime-unverified",
        readySchedule: false,
        stopFrame: 56,
        event: "release",
        sourceTarget: {
          buttonObjectId: Number(handler.scope.objectId),
          handler: handler.script,
          placements: handler.hitTarget?.placements,
          exactStageBoundsStatus: handler.hitTarget?.exactStageBoundsStatus,
        },
        candidateEffect: "set WrongFeed, disable quiz buttons, optionally report click, then call showWrongFeed()",
        evidence: [inputReference("scenario-inventory", {jsonLocator: `interactions.handlers[id=${handler.id}]`}), inputReference("child-ffdec-scripts", scriptLocator(handler))],
      })),
      wrongFeedback,
      attemptCounterAudit: {
        classification: "exhaustive-child-script-static-observation",
        referenceCount: quizTryLines.length,
        observedLines: quizTryLines,
        observedAssignments: attemptBinding.observedAssignments,
        incrementObserved: false,
        forcedContinuationReachabilityProven: false,
        evidence: [inputReference("child-ffdec-scripts"), inputReference("scenario-inventory", {jsonLocator: "dependencies.bindings[binding=_global.quizTryCount]"})],
      },
      glossaryHyperlink,
      spanishAudio: {
        candidateId: "spanish-audio-user-activated-host-path",
        classification: "static-source-host-audio-candidate-runtime-and-listening-unverified",
        readySchedule: false,
        languageTimelineBranchProven: false,
        playButtonDefinition: 221,
        stopButtonDefinition: 215,
        buttonPlacementAndExactTriggerFrameProven: false,
        candidateBehavior: [
          "release button 221 calls doPlaySpanishAudio()",
          "the host stops sprite-231 and loads the sibling SA MP3 by basename",
          "onSoundComplete resumes only when not at the terminal frame and quizSection is false",
          "release button 215 stops Spanish audio and applies the same conditional resume rule",
        ],
        externalTrack: {
          path: externalSpanishAudio.sourceFile,
          sha256: externalSpanishAudio.observedSha256,
          durationMs: externalSpanishAudio.probe?.durationMs,
          codec: externalSpanishAudio.probe?.codecName,
          channels: externalSpanishAudio.probe?.channels,
          startSemantics: externalSpanishAudio.startSemantics,
        },
        childEmbeddedStream: {
          context: embeddedStream.contextLabel,
          firstBlockFrame: embeddedStream.firstBlockFrame,
          lastBlockFrame: embeddedStream.lastBlockFrame,
          durationMs: embeddedStream.durationMs,
          language: "und",
        },
        listeningAccepted: false,
        synchronizationAccepted: false,
        evidence: [
          hostEvidenceReference(evidenceById, hostActionScript, "spanish-play-button"),
          hostEvidenceReference(evidenceById, hostActionScript, "spanish-stop-button"),
          hostEvidenceReference(evidenceById, hostActionScript, "host-spanish-audio-functions"),
          inputReference("audio-runtime-evidence"),
          inputReference("audio-listening-acceptance"),
          inputReference("spanish-mp3"),
        ],
        blockers: ["spanish-trigger-and-synchronization-unresolved", "readiness-missing-04", "host-defaults", "runtime-reachability"],
      },
      replayAndTerminal: {
        classification: "static-source-host-candidates-runtime-unverified",
        readySchedule: false,
        replayCandidates: [
          {
            candidateId: "shell-reload-current-page",
            buttonObjectId: 244,
            rolloverLabelCandidate: "replay",
            releaseEffectCandidate: "clear selected host flags, stop global sound, and call loadSWFMovie()",
            completeResetVectorProven: false,
            evidence: [hostEvidenceReference(evidenceById, hostActionScript, "replay-rollover"), hostEvidenceReference(evidenceById, hostActionScript, "replay-release")],
          },
          {
            candidateId: "shell-rewind-to-frame-one",
            buttonObjectId: 585,
            pressEffectCandidate: "set rewind mode; host doForAndRew subtracts 20 frames per monitor call and gotoAndPlay(1) at the lower boundary",
            completeResetVectorProven: false,
            evidence: [
              hostEvidenceReference(evidenceById, hostActionScript, "rewind-press"),
              hostEvidenceReference(evidenceById, hostActionScript, "rewind-release"),
              hostEvidenceReference(evidenceById, hostActionScript, "rewind-enter-frame"),
              hostEvidenceReference(evidenceById, hostActionScript, "host-rewind-function"),
            ],
          },
        ],
        terminalCandidate: {
          childStructuralLastFrame: 222,
          childStopActionAtFrame222Observed: false,
          fullShellMonitorMayStopAtTotalFrame: true,
          authorizedEventOrderingProven: false,
          evidence: [hostEvidenceReference(evidenceById, hostActionScript, "terminal-enter-frame"), hostEvidenceReference(evidenceById, hostActionScript, "host-terminal-monitor"), inputReference("same-lesson-host-binding")],
        },
        blockers: ["replay-full-reset-unresolved", "terminal-shell-event-ordering", "readiness-missing-05", "runtime-reachability"],
      },
      structurallyPresentButNotSelectedByObservedHostRandom: [
        {
          instanceName: "Mc_Right_Feed5",
          objectId: 149,
          reason: "showRightFeed uses random(4)+1, whose static result domain is 1-4",
          runtimeDeadCodeProven: false,
        },
        {
          instanceName: "Mc_Wrong_Feed4",
          objectId: 74,
          reason: "showWrongFeed uses random(3)+1, whose static result domain is 1-3",
          runtimeDeadCodeProven: false,
        },
      ],
    },
    coverageQualification: {
      currentRequirements: [
        {
          requirementId: enRequirement.requirementId,
          language: enRequirement.language,
          requiredRange: enRequirement.requiredRange,
          entryStateSha256: enRequirement.entryStateSha256,
          status: enRequirement.status,
          capturedFrameCount: enRequirement.capturedFrameCount,
          captureManifestSha256: enRequirement.captureManifestSha256,
          baselineAuthority: enRequirement.baselineAuthority,
          baselineCaptureManifestSha256: enRequirement.baselineCaptureManifestSha256,
          metricsSha256: enRequirement.metricsSha256,
        },
        {
          requirementId: esRequirement.requirementId,
          language: esRequirement.language,
          requiredRange: esRequirement.requiredRange,
          entryStateSha256: esRequirement.entryStateSha256,
          status: esRequirement.status,
          capturedFrameCount: esRequirement.capturedFrameCount,
          captureManifestSha256: esRequirement.captureManifestSha256,
          baselineAuthority: esRequirement.baselineAuthority,
          baselineCaptureManifestSha256: esRequirement.baselineCaptureManifestSha256,
          metricsSha256: esRequirement.metricsSha256,
        },
      ],
      qualification: "Current 1-222 requirements cannot be treated as no-action linear schedules because source-structured playback stops at frame 56.",
      recommendedRequirementFamilies: [
        "natural-to-first-quiz-stop",
        "correct-feedback-1-through-4-to-terminal",
        "wrong-feedback-1-through-3-retry-and-any-source-proven-forced-continuation",
        "four-glossary-open-and-return-paths",
        "Spanish-audio-user-trigger-and-completion-paths",
        "Replay-and-terminal-full-state-reset",
      ],
      modifiesCurrentRequirements: false,
    },
    blockers: {
      upstreamScenarioInventoryUnknowns: inventory.unknowns.map((unknown) => ({
        ...unknown,
        status: "unresolved",
        evidenceFile: inputReference("scenario-inventory"),
      })),
      strictGateBlockers: readiness.strictGateBlockers.map((statement, index) => ({
        id: `strict-gate-${String(index + 1).padStart(2, "0")}`,
        status: "unresolved",
        statement,
        evidence: [inputReference("strict-readiness")],
      })),
      branchCaptureMissing: readiness.branchCaptureReadiness.missing.map((statement, index) => ({
        id: `branch-readiness-missing-${String(index + 1).padStart(2, "0")}`,
        status: "unresolved",
        statement,
        evidence: [inputReference("strict-readiness")],
      })),
      derived: derivedBlockers,
    },
    finalQualification: {
      statement: "This artifact is an acceptance-neutral deterministic inventory of static source branch candidates. It is not a ready event schedule, runtime execution, baseline, RMSE result, audio acceptance, fidelity proof, human review, owner acceptance, or completion record.",
      migrationStatusAtGeneration: parseJson(byId.get("migration-manifest")).status,
      migrationStatusChanged: false,
      traceSpecsChanged: false,
      coverageChanged: false,
      scenarioInventoryChanged: false,
      adapterOrSemanticPinChanged: false,
      approvalChanged: false,
    },
  };
}

export async function generateVb004SourceBranchCandidates({
  root = defaultProjectRoot,
  ffdec = "ffdec",
  check = false,
  hostActionScript = null,
  contract = VB004_SOURCE_BRANCH_CONTRACT,
  generatorPath = scriptPath,
} = {}) {
  const report = await buildVb004SourceBranchCandidates({root, ffdec, hostActionScript, contract, generatorPath});
  const desired = Buffer.from(stableJson(report), "utf8");
  const output = path.resolve(root, contract.outputPath);
  const relative = path.relative(root, output);
  invariant(relative && !relative.startsWith("..") && !path.isAbsolute(relative), "output path escapes project root");
  if (check) {
    invariant(await exists(output), `${contract.outputPath}: missing`);
    const current = await readFile(output);
    invariant(current.equals(desired),
      `${contract.outputPath}: stale (expected ${sha256(desired)}, observed ${sha256(current)})`);
  } else {
    await mkdir(path.dirname(output), {recursive: true});
    await writeFile(output, desired);
  }
  return {path: contract.outputPath, sha256: sha256(desired), bytes: desired.length, check};
}

function helpText() {
  return `Usage: node scripts/build-vb004-source-branch-candidates.mjs [options]\n\nOptions:\n  --check             Re-extract and verify the checked-in artifact without writing\n  --ffdec <command>   FFDec 26.2.1 launcher (default: ffdec)\n  --root <directory>  Project root (default: repository root)\n  -h, --help          Show this help\n`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(helpText());
    return;
  }
  const result = await generateVb004SourceBranchCandidates(options);
  process.stdout.write(`${result.check ? "Verified" : "Generated"} ${result.path} sha256:${result.sha256}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
