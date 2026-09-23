#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  access,
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
import {promisify} from "node:util";
import {fileURLToPath, pathToFileURL} from "node:url";

import {
  assertSafeReportOutput,
  writeOrCheckReport,
} from "./build-g4-l3-machine-source-audits.mjs";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

const SCHEMA_VERSION = 2;
const REPORT_TYPE = "g4-l3-actionscript-source-operation-index";
const SOURCE_ROOT_RELATIVE = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const MACHINE_AUDIT_RELATIVE = "reports/g4-l3-machine-source-audits.json";
const STATIC_INDEX_RELATIVE = "reports/g4-l3-static-source-event-index.json";
const SHELL_CONTRACT_RELATIVE = "reports/g4-l3-shell-legacy-host-dependency-contract.json";
const DEFAULT_JSON_RELATIVE = "reports/g4-l3-source-operation-index-v2.json";
const DEFAULT_MARKDOWN_RELATIVE = "reports/g4-l3-source-operation-index-v2.md";

const TIMELINE_METHODS = new Map([
  ["gotoandplay", "gotoAndPlay"],
  ["gotoandstop", "gotoAndStop"],
  ["nextframe", "nextFrame"],
  ["prevframe", "prevFrame"],
  ["play", "play"],
  ["stop", "stop"],
]);

const DIRECT_EXTERNAL_METHODS = new Map([
  ["fscommand", "fscommand"],
  ["geturl", "getURL"],
  ["loadmovie", "loadMovie"],
  ["loadmovienum", "loadMovieNum"],
  ["loadvariables", "loadVariables"],
  ["loadvariablesnum", "loadVariablesNum"],
  ["navigatetourl", "navigateToURL"],
]);

const EXTERNAL_LEXICAL_DEFINITIONS = Object.freeze([
  {api: "ExternalInterface", pattern: /\bExternalInterface\b/gi},
  {api: "FlashVars", pattern: /\bFlashVars\b/gi},
  {api: "Loader", pattern: /\bLoader\b/gi},
  {api: "MovieClipLoader", pattern: /\bMovieClipLoader\b/gi},
  {api: "NetConnection", pattern: /\bNetConnection\b/gi},
  {api: "SharedObject", pattern: /\bSharedObject\b/gi},
  {api: "Socket", pattern: /\bSocket\b/gi},
  {api: "URLRequest", pattern: /\bURLRequest\b/gi},
  {api: "XMLSocket", pattern: /\bXMLSocket\b/gi},
]);

const LEXICAL_DEFINITIONS = Object.freeze([
  {
    category: "input",
    signalType: "input-identifier",
    pattern: /\b(?:TextField|Selection|onChanged|input|keyCode|onKeyDown|onKeyUp|isDown|setFocus|getFocus|startDrag|stopDrag|hitTest)\b/gi,
  },
  {
    category: "scoring",
    signalType: "scoring-identifier",
    pattern: /\b(?=[A-Za-z_$])[\w$]*(?:score|correct|incorrect|answer|attempt|points|result)[\w$]*\b/gi,
  },
  {
    category: "replay-reset",
    signalType: "replay-reset-identifier",
    pattern: /\b(?=[A-Za-z_$])[\w$]*(?:replay|reset|rewind|restart)[\w$]*\b/gi,
  },
  {
    category: "language",
    signalType: "language-identifier",
    pattern: /\b(?:Spanish|English|Language|language|locale|Lang|lang|SP|EN|ES)\b/gi,
  },
  {
    category: "language",
    signalType: "language-path-literal",
    pattern: /(?:^|["'\/])(?:SA|SAD|EA|EAD)(?=[\/"'])/g,
  },
  {
    category: "audio",
    signalType: "audio-identifier",
    pattern: /\b(?=[A-Za-z_$])[\w$]*(?:sound|audio|snd|volume|mute|pause)[\w$]*\b/gi,
  },
]);

const CATEGORY_ORDER = Object.freeze([
  "timeline",
  "lifecycle",
  "random",
  "input",
  "scoring",
  "replay-reset",
  "external",
  "language",
  "audio",
  "global",
]);

const POINTER_EVENT_PATTERN = /\b(?:releaseOutside|release|press|rollOver|rollOut|dragOver|dragOut|mouseDown|mouseUp|mouseMove)\b/i;
const INPUT_EVENT_PATTERN = /\b(?:releaseOutside|release|press|rollOver|rollOut|dragOver|dragOut|mouseDown|mouseUp|mouseMove|keyPress|keyDown|keyUp)\b/i;
const LIFECYCLE_EVENT_PATTERN = /\b(?:load|unload|enterFrame|initialize|data|construct)\b/i;
const SHELL_STATIC_CANDIDATE_IDS = Object.freeze(
  Array.from({length: 20}, (_, index) => `static-${String(index + 1).padStart(3, "0")}`),
);
const SHELL_EXACT_OPERATION_MATCH_MODE = "exact-operation-expression";
const SHELL_LINE_CONTAINING_MATCH_MODE = "exact-normalized-source-line-containing-operation";

const SCENARIO_FAMILY_DEFINITIONS = Object.freeze([
  {familyId: "root-natural-entry-and-playback", categories: ["timeline"], always: true},
  {familyId: "clip-and-button-lifecycle-paths", categories: ["lifecycle"]},
  {familyId: "pointer-and-clip-handler-paths", categories: ["input"], eventPattern: POINTER_EVENT_PATTERN},
  {familyId: "keyboard-and-input-state-paths", categories: ["input"], eventPattern: /key|change|focus|input/i},
  {familyId: "scoring-and-answer-paths", categories: ["scoring"]},
  {familyId: "random-outcome-paths", categories: ["random"]},
  {familyId: "terminal-and-replay-reset-paths", categories: ["replay-reset"]},
  {familyId: "english-spanish-host-state-paths", categories: ["language", "global"]},
  {familyId: "audio-control-and-cue-paths", categories: ["audio"]},
  {familyId: "legacy-external-side-effect-disposition-paths", categories: ["external"]},
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function compareText(left, right) {
  return String(left).localeCompare(String(right), "en");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function projectPath(root, value) {
  return portable(path.relative(root, value));
}

function normalizeText(value) {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

async function readBoundJson(root, relativePath) {
  const absolute = path.join(root, relativePath);
  const bytes = await readFile(absolute);
  return {
    value: JSON.parse(bytes.toString("utf8")),
    binding: {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)},
  };
}

async function walkFiles(directory, current = directory) {
  let entries;
  try {
    entries = await readdir(current, {withFileTypes: true});
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const files = [];
  for (const entry of entries.sort((left, right) => compareText(left.name, right.name))) {
    const candidate = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(directory, candidate));
    else if (entry.isFile()) files.push(portable(path.relative(directory, candidate)));
  }
  return files;
}

async function mapWithConcurrency(values, concurrency, mapper) {
  invariant(Number.isInteger(concurrency) && concurrency >= 1 && concurrency <= 8,
    "concurrency must be an integer from 1 through 8");
  const output = new Array(values.length);
  let cursor = 0;
  const workers = Array.from({length: Math.min(concurrency, values.length)}, async () => {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await mapper(values[index], index);
    }
  });
  await Promise.all(workers);
  return output;
}

async function resolveExecutable(command) {
  const candidates = command.includes(path.sep)
    ? [path.resolve(command)]
    : (process.env.PATH || "").split(path.delimiter).filter(Boolean).map((directory) => path.join(directory, command));
  for (const candidate of candidates) {
    try {
      await access(candidate, fsConstants.X_OK);
      return realpath(candidate);
    } catch {
      // Keep searching the exact selected command.
    }
  }
  throw new Error(`Executable not found: ${command}`);
}

async function inspectFfdec(command) {
  const launcher = await resolveExecutable(command);
  const {stdout, stderr} = await execFileAsync(command, ["-help"], {
    timeout: 30_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  const version = `${stdout}\n${stderr}`
    .replace(/\u001b\[[0-9;]*m/g, "")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  invariant(/^JPEXS Free Flash Decompiler v\.?\d/.test(version || ""), "Unrecognized FFDec version output");
  const launcherBytes = await readFile(launcher);
  const jarPath = path.join(path.dirname(launcher), "ffdec.jar");
  const jarBytes = await readFile(jarPath).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  return {
    command,
    version,
    launcherSha256: sha256(launcherBytes),
    ffdecJarSha256: jarBytes ? sha256(jarBytes) : null,
  };
}

async function exportScriptsWithFfdec({command, sourcePath, outputRoot, animationId}) {
  const target = path.join(outputRoot, animationId.replace(/[^a-zA-Z0-9._-]/g, "_"));
  try {
    await execFileAsync(command, [
      "-onerror", "abort",
      "-timeout", "30",
      "-exportTimeout", "120",
      "-exportFileTimeout", "30",
      "-export", "script",
      target,
      sourcePath,
    ], {timeout: 180_000, maxBuffer: 8 * 1024 * 1024});
  } catch (error) {
    throw new Error(`FFDec script export failed for ${animationId}: ${error.stderr || error.message}`);
  }
  const scriptsRoot = path.join(target, "scripts");
  const files = (await walkFiles(scriptsRoot)).filter((candidate) => candidate.toLowerCase().endsWith(".as"));
  return Promise.all(files.map(async (scriptRelativePath) => ({
    path: scriptRelativePath,
    text: normalizeText(await readFile(path.join(scriptsRoot, scriptRelativePath), "utf8")),
  })));
}

function scriptManifest(scripts) {
  const ordered = scripts.map((script) => ({path: portable(script.path), text: normalizeText(script.text)}))
    .sort((left, right) => compareText(left.path, right.path));
  const files = ordered.map((script) => ({
    path: script.path,
    bytes: Buffer.byteLength(script.text),
    sha256: sha256(script.text),
  }));
  return {
    files,
    exportedScriptFileCount: files.length,
    normalizedBytes: files.reduce((total, file) => total + file.bytes, 0),
    contentManifestSha256: sha256(stableJson(files)),
    normalizedBundleSha256: sha256(ordered.map((file) => `${file.path}\0${file.text.length}\0${file.text}\0`).join("")),
  };
}

async function verifiedSourceSwf({root, archiveReal, machineItem}) {
  const declared = machineItem.source?.swf;
  invariant(declared?.path?.startsWith(`${SOURCE_ROOT_RELATIVE}/`), `${machineItem.animationId}: invalid source path`);
  const absolute = path.join(root, declared.path);
  const direct = await lstat(absolute);
  invariant(direct.isFile() && !direct.isSymbolicLink(), `${machineItem.animationId}: SWF must be a regular non-symlink file`);
  const resolved = await realpath(absolute);
  invariant(resolved !== archiveReal && resolved.startsWith(`${archiveReal}${path.sep}`),
    `${machineItem.animationId}: SWF resolves outside frozen source archive`);
  const bytes = await readFile(resolved);
  invariant(bytes.length === declared.bytes, `${machineItem.animationId}: SWF byte count differs from machine audit`);
  invariant(sha256(bytes) === declared.sha256, `${machineItem.animationId}: SWF SHA-256 differs from machine audit`);
  return {absolute, bytes: bytes.length, sha256: declared.sha256};
}

function offsetLocation(text, offset) {
  const before = text.slice(0, offset);
  const lineNumber = before.split("\n").length;
  const lastNewline = before.lastIndexOf("\n");
  return {lineNumber, columnNumber: offset - lastNewline};
}

function lineAt(text, lineNumber) {
  return text.split("\n")[lineNumber - 1] ?? "";
}

function splitReceiver(calleeExpression) {
  let squareDepth = 0;
  for (let index = calleeExpression.length - 1; index >= 0; index -= 1) {
    const character = calleeExpression[index];
    if (character === "]") squareDepth += 1;
    else if (character === "[") squareDepth -= 1;
    else if (character === "." && squareDepth === 0) {
      return {
        receiverExpression: calleeExpression.slice(0, index).trim(),
        method: calleeExpression.slice(index + 1).trim(),
      };
    }
  }
  return {receiverExpression: null, method: calleeExpression.trim()};
}

function matchingCloseParen(text, openIndex) {
  let depth = 0;
  let state = "code";
  for (let index = openIndex; index < text.length; index += 1) {
    const current = text[index];
    const next = text[index + 1];
    if (state === "single") {
      if (current === "\\") index += 1;
      else if (current === "'") state = "code";
      continue;
    }
    if (state === "double") {
      if (current === "\\") index += 1;
      else if (current === '"') state = "code";
      continue;
    }
    if (state === "line-comment") {
      if (current === "\n") state = "code";
      continue;
    }
    if (state === "block-comment") {
      if (current === "*" && next === "/") {
        state = "code";
        index += 1;
      }
      continue;
    }
    if (current === "'") state = "single";
    else if (current === '"') state = "double";
    else if (current === "/" && next === "/") {
      state = "line-comment";
      index += 1;
    } else if (current === "/" && next === "*") {
      state = "block-comment";
      index += 1;
    } else if (current === "(") depth += 1;
    else if (current === ")") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return null;
}

function splitArguments(value) {
  const argumentsList = [];
  let start = 0;
  let round = 0;
  let square = 0;
  let curly = 0;
  let state = "code";
  for (let index = 0; index < value.length; index += 1) {
    const current = value[index];
    const next = value[index + 1];
    if (state === "single") {
      if (current === "\\") index += 1;
      else if (current === "'") state = "code";
      continue;
    }
    if (state === "double") {
      if (current === "\\") index += 1;
      else if (current === '"') state = "code";
      continue;
    }
    if (state === "line-comment") {
      if (current === "\n") state = "code";
      continue;
    }
    if (state === "block-comment") {
      if (current === "*" && next === "/") {
        state = "code";
        index += 1;
      }
      continue;
    }
    if (current === "'") state = "single";
    else if (current === '"') state = "double";
    else if (current === "/" && next === "/") {
      state = "line-comment";
      index += 1;
    } else if (current === "/" && next === "*") {
      state = "block-comment";
      index += 1;
    } else if (current === "(") round += 1;
    else if (current === ")") round -= 1;
    else if (current === "[") square += 1;
    else if (current === "]") square -= 1;
    else if (current === "{") curly += 1;
    else if (current === "}") curly -= 1;
    else if (current === "," && round === 0 && square === 0 && curly === 0) {
      argumentsList.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  const tail = value.slice(start).trim();
  if (tail || argumentsList.length) argumentsList.push(tail);
  return argumentsList;
}

function classifyCall({calleeExpression, receiverExpression, method, argumentExpressions, exactCallText}) {
  const categories = new Set();
  const normalizedMethod = method.toLowerCase();
  const normalizedReceiver = (receiverExpression || "").replace(/\s+/g, "").toLowerCase();
  const combined = `${calleeExpression} ${argumentExpressions.join(" ")} ${exactCallText}`;
  let externalApi = null;

  if (TIMELINE_METHODS.has(normalizedMethod)) categories.add("timeline");
  if (normalizedMethod === "random" && (!receiverExpression || normalizedReceiver === "math")) categories.add("random");

  if (DIRECT_EXTERNAL_METHODS.has(normalizedMethod)) {
    categories.add("external");
    externalApi = DIRECT_EXTERNAL_METHODS.get(normalizedMethod);
  }
  if (normalizedMethod === "loadsound") {
    categories.add("external");
    categories.add("audio");
    externalApi = "Sound.loadSound";
  } else if (normalizedMethod === "getlocal" && /(?:^|\.)sharedobject$/.test(normalizedReceiver)) {
    categories.add("external");
    categories.add("global");
    externalApi = "SharedObject.getLocal";
  } else if (normalizedMethod === "load" && /(?:xml|f_x|keyterm)/i.test(receiverExpression || "")) {
    categories.add("external");
    externalApi = "XML.load";
  } else if (["send", "sendandload", "connect"].includes(normalizedMethod) &&
    /(?:xml|socket|connection|interface)/i.test(receiverExpression || "")) {
    categories.add("external");
    externalApi = `${receiverExpression}.${method}`;
  }

  if (/\b(?:Key|Selection|TextField)\b|(?:isDown|isToggled|getCode|setFocus|getFocus|startDrag|stopDrag|hitTest)$/i.test(calleeExpression)) {
    categories.add("input");
  }
  if (/(?:score|correct|incorrect|answer|attempt|points|result)/i.test(calleeExpression)) categories.add("scoring");
  if (/(?:replay|reset|rewind|restart)/i.test(combined) ||
    (["gotoandplay", "gotoandstop"].includes(normalizedMethod) && argumentExpressions.some((argument) => /^(?:1|"1"|'1'|"begin"|'begin'|"replay"|'replay'|"restart"|'restart')$/i.test(argument.trim())))) {
    categories.add("replay-reset");
  }
  if (/(?:Spanish|English|Language|locale|\bLang\b|["'\/](?:SA|SAD|EA|EAD)[\/"'])/i.test(combined)) categories.add("language");
  if (/(?:sound|audio|snd|volume|mute|pause|attachSound|loadSound|setPan)/i.test(combined)) categories.add("audio");
  if (normalizedReceiver.startsWith("_global") || calleeExpression.toLowerCase().startsWith("_global.")) categories.add("global");

  if (["start", "stop", "setvolume", "setpan", "attachsound"].includes(normalizedMethod) &&
    /(?:sound|audio|snd|voice|gSound|s_aud)/i.test(receiverExpression || "")) categories.add("audio");

  return {
    categories: CATEGORY_ORDER.filter((category) => categories.has(category)),
    externalApi,
    canonicalTimelineMethod: TIMELINE_METHODS.get(normalizedMethod) || null,
  };
}

function parseCalls(text) {
  const calls = [];
  let state = "code";
  for (let index = 0; index < text.length; index += 1) {
    const current = text[index];
    const next = text[index + 1];
    if (state === "single") {
      if (current === "\\") index += 1;
      else if (current === "'") state = "code";
      continue;
    }
    if (state === "double") {
      if (current === "\\") index += 1;
      else if (current === '"') state = "code";
      continue;
    }
    if (state === "line-comment") {
      if (current === "\n") state = "code";
      continue;
    }
    if (state === "block-comment") {
      if (current === "*" && next === "/") {
        state = "code";
        index += 1;
      }
      continue;
    }
    if (current === "'") {
      state = "single";
      continue;
    }
    if (current === '"') {
      state = "double";
      continue;
    }
    if (current === "/" && next === "/") {
      state = "line-comment";
      index += 1;
      continue;
    }
    if (current === "/" && next === "*") {
      state = "block-comment";
      index += 1;
      continue;
    }
    if (current !== "(") continue;

    const lineStart = text.lastIndexOf("\n", index - 1) + 1;
    const prefix = text.slice(lineStart, index);
    const match = prefix.match(/((?:[A-Za-z_$][\w$]*)(?:\s*(?:\.\s*[A-Za-z_$][\w$]*|\[[^\]\r\n]*\]))*)\s*$/);
    if (!match) continue;
    const calleeExpression = match[1].trim();
    const calleeStart = lineStart + (match.index ?? 0);
    const beforeCallee = text.slice(lineStart, calleeStart);
    if (/\bfunction\s*$/i.test(beforeCallee)) continue;
    const {receiverExpression, method} = splitReceiver(calleeExpression);
    if (["if", "for", "while", "switch", "catch", "with", "on", "onClipEvent"].includes(method)) continue;
    const closeIndex = matchingCloseParen(text, index);
    invariant(closeIndex !== null, `Unterminated call expression at offset ${index}`);
    let expressionEnd = closeIndex + 1;
    while (text[expressionEnd] === " " || text[expressionEnd] === "\t") expressionEnd += 1;
    if (text[expressionEnd] === ";") expressionEnd += 1;
    const exactCallText = text.slice(calleeStart, expressionEnd);
    const argumentExpressions = splitArguments(text.slice(index + 1, closeIndex));
    const classification = classifyCall({calleeExpression, receiverExpression, method, argumentExpressions, exactCallText});
    if (!classification.categories.length) continue;
    calls.push({
      offset: calleeStart,
      methodOffset: calleeStart + calleeExpression.lastIndexOf(method),
      endOffset: expressionEnd,
      operationKind: "call",
      calleeExpression,
      receiverExpression,
      method,
      canonicalTimelineMethod: classification.canonicalTimelineMethod,
      argumentExpressions,
      exactCallText,
      expressionSha256: sha256(exactCallText),
      categories: classification.categories,
      externalApi: classification.externalApi,
    });
  }
  return calls;
}

function eventExpressionFromPath(scriptPath, text) {
  const body = text.match(/\b(?:onClipEvent|on)\s*\([^)]*\)/);
  if (body) return {expression: body[0], offset: body.index ?? 0, basis: "exported-source-body"};
  const file = scriptPath.match(/((?:onClipEvent|on)\([^/]*\))(?=\.as$)/);
  return file ? {expression: file[1], offset: 0, basis: "ffdec-export-path"} : null;
}

function eventCategories(expression) {
  const categories = new Set();
  if (INPUT_EVENT_PATTERN.test(expression)) categories.add("input");
  if (LIFECYCLE_EVENT_PATTERN.test(expression)) categories.add("lifecycle");
  invariant(categories.size > 0, `Unsupported ActionScript event handler: ${expression}`);
  return CATEGORY_ORDER.filter((category) => categories.has(category));
}

function parseScope(scriptPath) {
  const sprite = scriptPath.match(/(?:^|\/)DefineSprite_(\d+)/i);
  const frame = scriptPath.match(/(?:^|\/)frame_(\d+)(?:\/|$)/i);
  const button = scriptPath.match(/(?:^|\/)DefineButton2?_(\d+)/i);
  const placed = scriptPath.match(/PlaceObject\d?_(\d+)_(\d+)/i);
  return {
    frameDomainCandidate: sprite ? `sprite-${Number(sprite[1])}` : "root",
    sourceFrame: frame ? Number(frame[1]) : null,
    buttonCharacterId: button ? Number(button[1]) : null,
    placedCharacterId: placed ? Number(placed[1]) : null,
    placementDepth: placed ? Number(placed[2]) : null,
  };
}

function parseGlobalAccesses(text) {
  const output = [];
  for (const match of text.matchAll(/\b_global\s*\.\s*([A-Za-z_$][\w$]*)/g)) {
    const offset = match.index ?? 0;
    let cursor = offset + match[0].length;
    while (/\s/.test(text[cursor] || "")) cursor += 1;
    let access = "read";
    const suffix = text.slice(cursor, cursor + 3);
    if (/^(?:\+\+|--)/.test(suffix)) access = "read-write";
    else if (/^(?:\+=|-=|\*=|\/=|%=)/.test(suffix)) access = "read-write";
    else if (/^=(?!=)/.test(suffix)) access = "write";
    else if (/^\(/.test(suffix)) access = "call";
    output.push({
      offset,
      category: "global",
      signalType: "global-access",
      exactExpression: match[0],
      identifier: match[1],
      access,
    });
  }
  return output;
}

function parseLexicalSignals(text) {
  const output = [];
  for (const definition of LEXICAL_DEFINITIONS) {
    const pattern = new RegExp(definition.pattern.source, definition.pattern.flags);
    for (const match of text.matchAll(pattern)) {
      output.push({
        offset: match.index ?? 0,
        category: definition.category,
        signalType: definition.signalType,
        exactExpression: match[0],
      });
    }
  }
  for (const definition of EXTERNAL_LEXICAL_DEFINITIONS) {
    const pattern = new RegExp(definition.pattern.source, definition.pattern.flags);
    for (const match of text.matchAll(pattern)) {
      output.push({
        offset: match.index ?? 0,
        category: "external",
        signalType: "external-api-identifier",
        exactExpression: match[0],
        externalApi: definition.api,
      });
    }
  }
  output.push(...parseGlobalAccesses(text));
  return output.sort((left, right) => left.offset - right.offset || compareText(left.category, right.category) ||
    compareText(left.signalType, right.signalType) || compareText(left.exactExpression, right.exactExpression));
}

function sourceEventMap(staticItem) {
  const map = new Map();
  for (const event of staticItem.sourceEvents || []) {
    const existing = map.get(event.script.path) || [];
    existing.push(event);
    map.set(event.script.path, existing);
  }
  return map;
}

export function parseActionScriptSource({scriptPath, text, scriptSha256 = sha256(normalizeText(text)), sourceEvents = []}) {
  const normalized = normalizeText(text);
  const scope = parseScope(scriptPath);
  const event = eventExpressionFromPath(scriptPath, normalized);
  const operations = [];
  if (event) {
    const location = offsetLocation(normalized, event.offset);
    operations.push({
      offset: event.offset,
      endOffset: event.offset + event.expression.length,
      operationKind: "event-handler",
      calleeExpression: null,
      receiverExpression: null,
      method: "handler",
      canonicalTimelineMethod: null,
      argumentExpressions: [event.expression.slice(event.expression.indexOf("(") + 1, -1)],
      exactCallText: event.expression,
      expressionSha256: sha256(event.expression),
      categories: eventCategories(event.expression),
      externalApi: null,
      eventExpression: event.expression,
      eventExpressionBasis: event.basis,
      ...location,
    });
  }
  for (const call of parseCalls(normalized)) operations.push({...call, ...offsetLocation(normalized, call.offset)});
  operations.sort((left, right) => left.offset - right.offset || left.endOffset - right.endOffset || compareText(left.exactCallText, right.exactCallText));

  const eventIds = sourceEvents.map((candidate) => candidate.sourceEventId).sort(compareText);
  const projectedOperations = operations.map((operation, index) => ({
    operationId: `operation-${String(index + 1).padStart(4, "0")}`,
    scriptPath,
    scriptSha256,
    sourceEventIds: eventIds,
    scope,
    lineNumber: operation.lineNumber,
    columnNumber: operation.columnNumber,
    methodColumnNumber: operation.methodOffset === undefined
      ? operation.columnNumber
      : offsetLocation(normalized, operation.methodOffset).columnNumber,
    sourceLineText: lineAt(normalized, operation.lineNumber),
    operationKind: operation.operationKind,
    eventExpression: operation.eventExpression || event?.expression || null,
    eventExpressionBasis: operation.eventExpressionBasis || (event ? event.basis : null),
    calleeExpression: operation.calleeExpression,
    receiverExpression: operation.receiverExpression,
    method: operation.method,
    canonicalTimelineMethod: operation.canonicalTimelineMethod,
    argumentExpressions: operation.argumentExpressions,
    exactExpression: operation.exactCallText,
    expressionSha256: operation.expressionSha256,
    categories: operation.categories,
    externalApi: operation.externalApi,
  }));

  const signals = parseLexicalSignals(normalized).map((signal, index) => {
    const location = offsetLocation(normalized, signal.offset);
    return {
      signalId: `signal-${String(index + 1).padStart(4, "0")}`,
      scriptPath,
      scriptSha256,
      sourceEventIds: eventIds,
      scope,
      lineNumber: location.lineNumber,
      columnNumber: location.columnNumber,
      sourceLineText: lineAt(normalized, location.lineNumber),
      category: signal.category,
      signalType: signal.signalType,
      exactExpression: signal.exactExpression,
      expressionSha256: sha256(signal.exactExpression),
      externalApi: signal.externalApi || null,
      identifier: signal.identifier || null,
      access: signal.access || null,
    };
  });

  return {operations: projectedOperations, signals};
}

function reidentify(records, prefix) {
  return records.map((record, index) => ({
    ...record,
    [`${prefix}Id`]: `${prefix}-${String(index + 1).padStart(5, "0")}`,
  }));
}

function categoryCounts(records, key) {
  const counts = Object.fromEntries(CATEGORY_ORDER.map((category) => [category, 0]));
  for (const record of records) {
    const categories = key === "categories" ? record.categories : [record[key]];
    for (const category of categories) if (counts[category] !== undefined) counts[category] += 1;
  }
  return Object.fromEntries(Object.entries(counts).filter(([, count]) => count > 0));
}

function scenarioTraceCandidates(operations, signals) {
  return SCENARIO_FAMILY_DEFINITIONS.flatMap((definition) => {
    const matchingOperations = operations.filter((operation) => operation.categories.some((category) => definition.categories.includes(category)) &&
      (!definition.eventPattern || definition.eventPattern.test(operation.eventExpression || operation.exactExpression)));
    const matchingSignals = signals.filter((signal) => definition.categories.includes(signal.category) &&
      (!definition.eventPattern || definition.eventPattern.test(signal.exactExpression)));
    if (!definition.always && !matchingOperations.length && !matchingSignals.length) return [];
    return [{
      candidateId: definition.familyId,
      classification: "source-bound-scenario-and-trace-candidate-only",
      sourceOperationIds: matchingOperations.map((operation) => operation.operationId),
      sourceSignalIds: matchingSignals.map((signal) => signal.signalId),
      sourceEventIds: [...new Set([
        ...matchingOperations.flatMap((operation) => operation.sourceEventIds),
        ...matchingSignals.flatMap((signal) => signal.sourceEventIds),
      ])].sort(compareText),
      orderedScheduleEstablished: false,
      runtimeReachabilityEstablished: false,
      runtimeScenarioIds: [],
      authoritativeTraceIds: [],
      naturalExecutionProofEstablished: false,
      captureScheduleEstablished: false,
      deterministicSeedBindingEstablished: false,
      acceptanceEffect: "none",
    }];
  });
}

function expectedUpstreamTimelineOccurrences(machineItem) {
  return (machineItem.scripts.signals || []).find((signal) => signal.id === "timeline-navigation")?.occurrences || 0;
}

function expectedUpstreamSignal(machineItem, id) {
  return (machineItem.scripts.signals || []).find((signal) => signal.id === id)?.occurrences || 0;
}

function assertManifestMatchesUpstream(animationId, manifest, upstream) {
  invariant(manifest.exportedScriptFileCount === upstream.exportedScriptFileCount,
    `${animationId}: re-exported script count differs from machine audit`);
  invariant(manifest.normalizedBytes === upstream.normalizedBytes,
    `${animationId}: re-exported normalized bytes differ from machine audit`);
  invariant(manifest.contentManifestSha256 === upstream.contentManifestSha256,
    `${animationId}: re-exported content manifest differs from machine audit`);
  invariant(manifest.normalizedBundleSha256 === upstream.normalizedBundleSha256,
    `${animationId}: re-exported normalized bundle differs from machine audit`);
  invariant(stableJson(manifest.files) === stableJson(upstream.files),
    `${animationId}: re-exported script file manifest differs from machine audit`);
}

function bindStaticEvents(animationId, scripts, staticItem) {
  const scriptsByPath = new Map(scripts.map((script) => [script.path, script]));
  for (const event of staticItem.sourceEvents || []) {
    const script = scriptsByPath.get(event.script.path);
    invariant(script, `${animationId}: static source event references absent script ${event.script.path}`);
    invariant(script.sha256 === event.script.sha256,
      `${animationId}: static source event hash differs for ${event.script.path}`);
  }
}

function bindShellContract({shellItem, shellContract}) {
  const operations = shellItem.operations;
  const staticCandidates = shellContract.candidates.filter((candidate) => candidate.evidenceKind === "static-exact-source-call");
  const matches = staticCandidates.map((candidate) => {
    const found = operations.find((operation) =>
      operation.scriptPath === candidate.source.scriptPath &&
      operation.scriptSha256 === candidate.source.scriptSha256 &&
      operation.lineNumber === candidate.source.lineNumber &&
      (operation.exactExpression === candidate.source.exactCallText ||
        operation.sourceLineText.trim() === candidate.source.exactCallText.trim() ||
        candidate.source.exactCallText.includes(operation.exactExpression)));
    invariant(found, `Shell contract candidate ${candidate.candidateId} not reproduced by v2 parser`);
    if (!found.externalApi) found.externalApi = candidate.api;
    if (!found.categories.includes("external")) {
      found.categories = CATEGORY_ORDER.filter((category) => new Set([...found.categories, "external"]).has(category));
    }
    found.shellContractCandidateId = candidate.candidateId;
    return {
      candidateId: candidate.candidateId,
      operationId: found.operationId,
      contractColumnNumber: candidate.source.columnNumber,
      parsedExpressionColumnNumber: found.columnNumber,
      parsedMethodColumnNumber: found.methodColumnNumber,
      exactCallMatchMode: found.exactExpression === candidate.source.exactCallText
        ? "exact-operation-expression"
        : "exact-normalized-source-line-containing-operation",
      note: "The existing shell contract's API-specific column convention is retained separately from the v2 parser's exact expression-start and method-start columns.",
    };
  });

  let supportingExpressionLinesMatched = 0;
  const scripts = new Map(shellItem.reexportedScripts.map((script) => [script.path, script]));
  for (const group of shellContract.sourceSupportingExpressions || []) {
    for (const evidence of group.evidence || []) {
      const script = scripts.get(evidence.scriptPath);
      invariant(script?.sha256 === evidence.scriptSha256,
        `Shell supporting expression ${evidence.scriptPath} is not bound to the re-export`);
      invariant(lineAt(script.text, evidence.lineNumber).trim() === evidence.exactSourceText.trim(),
        `Shell supporting expression changed at ${evidence.scriptPath}:${evidence.lineNumber}`);
      supportingExpressionLinesMatched += 1;
    }
  }
  return {
    staticExactCandidateCount: staticCandidates.length,
    staticExactCandidatesMatched: matches.length,
    candidateOperationBindings: matches,
    supportingExpressionLinesMatched,
  };
}

function sourceSetSha256(items) {
  return sha256(stableJson(items.map((item) => ({
    animationId: item.animationId,
    path: item.source.swf.path,
    bytes: item.source.swf.bytes,
    sha256: item.source.swf.sha256,
  }))));
}

function reexportSetSha256(items) {
  return sha256(stableJson(items.map((item) => ({
    animationId: item.animationId,
    sourceSha256: item.source.swf.sha256,
    contentManifestSha256: item.reexport.contentManifestSha256,
    normalizedBundleSha256: item.reexport.normalizedBundleSha256,
  }))));
}

function itemSetSha256(items) {
  return sha256(stableJson(items.map((item) => ({
    animationId: item.animationId,
    sourceSha256: item.source.swf.sha256,
    operationsSha256: sha256(stableJson(item.operations)),
    signalsSha256: sha256(stableJson(item.signals)),
    candidatesSha256: sha256(stableJson(item.scenarioTraceCandidates)),
  }))));
}

function expectedItemCounts(item) {
  const operationsByCategory = categoryCounts(item.operations, "categories");
  return {
    operations: item.operations.length,
    operationsByCategory,
    signals: item.signals.length,
    signalsByCategory: categoryCounts(item.signals, "category"),
    exactTimelineOperationCount: operationsByCategory.timeline || 0,
    exactEventHandlerOperationCount: item.operations.filter((operation) => operation.operationKind === "event-handler").length,
    exactExternalCallCount: item.operations.filter((operation) => operation.categories.includes("external")).length,
    sourceEventOperationBindings: item.operations.filter((operation) => operation.sourceEventIds.length).length,
  };
}

function reportItem({machineItem, staticItem, source, scripts, manifest}) {
  const staticByPath = sourceEventMap(staticItem);
  const parsed = scripts.flatMap((script) => {
    const result = parseActionScriptSource({
      scriptPath: script.path,
      text: script.text,
      scriptSha256: script.sha256,
      sourceEvents: staticByPath.get(script.path) || [],
    });
    return [{scriptPath: script.path, ...result}];
  });
  const operations = reidentify(parsed.flatMap((entry) => entry.operations), "operation");
  const signals = reidentify(parsed.flatMap((entry) => entry.signals), "signal");

  const exactTimelineOperationCount = operations.filter((operation) => operation.categories.includes("timeline")).length;
  const upstreamTimelineOccurrenceCount = expectedUpstreamTimelineOccurrences(machineItem);
  invariant(exactTimelineOperationCount === upstreamTimelineOccurrenceCount,
    `${machineItem.animationId}: exact timeline call count ${exactTimelineOperationCount} differs from upstream ${upstreamTimelineOccurrenceCount}`);

  const value = {
    sequence: machineItem.sequence,
    animationId: machineItem.animationId,
    assetId: machineItem.assetId,
    releaseRole: machineItem.releaseRole,
    batch: machineItem.batch,
    classification: machineItem.classification,
    source: {
      swf: {...machineItem.source.swf, physicalHashVerifiedNow: true},
      fla: machineItem.source.fla ? {
        path: machineItem.source.fla.path,
        bytes: machineItem.source.fla.bytes,
        sha256: machineItem.source.fla.sha256,
        readByThisGenerator: false,
      } : null,
    },
    reexport: {
      protocol: "complete FFDec script export in a unique temporary directory; LF normalization; path sort; temporary tree removed",
      ...manifest,
      fullManifestMatchesMachineAudit: true,
      normalizedBundleMatchesMachineAudit: true,
      temporaryExportRetained: false,
    },
    upstreamBindings: {
      machineAuditFingerprintSha256: machineItem.auditFingerprintSha256,
      staticSourceEventItemFingerprintSha256: staticItem.itemFingerprintSha256,
      sourceEventCount: staticItem.sourceEvents.length,
      sourceEventRecordsBound: staticItem.sourceEvents.length,
      uniqueSourceEventScriptsBound: new Set(staticItem.sourceEvents.map((event) => event.script.path)).size,
      upstreamCategoryOccurrences: {
        timeline: upstreamTimelineOccurrenceCount,
        random: expectedUpstreamSignal(machineItem, "random-calls"),
        input: expectedUpstreamSignal(machineItem, "input-fields"),
        scoring: expectedUpstreamSignal(machineItem, "score-or-answer-state"),
        replayReset: expectedUpstreamSignal(machineItem, "replay-or-reset"),
      },
    },
    operations,
    signals,
    counts: {
      operations: operations.length,
      operationsByCategory: categoryCounts(operations, "categories"),
      signals: signals.length,
      signalsByCategory: categoryCounts(signals, "category"),
      exactTimelineOperationCount,
      exactEventHandlerOperationCount: operations.filter((operation) => operation.operationKind === "event-handler").length,
      exactExternalCallCount: operations.filter((operation) => operation.categories.includes("external")).length,
      sourceEventOperationBindings: operations.filter((operation) => operation.sourceEventIds.length).length,
    },
    scenarioTraceCandidates: [],
    runtimeBoundary: {
      runtimeLaunched: false,
      runtimeReachabilityEstablished: false,
      orderedNaturalExecutionEstablished: false,
      authoritativeScenarioInventoryEstablished: false,
      authoritativeTraceSpecsEstablished: false,
      deterministicSeedBindingsEstablished: false,
      originalRuntimeBaselineEstablished: false,
      visualOrBehavioralParityEstablished: false,
      audioSynchronizationOrListeningEstablished: false,
      humanReviewEstablished: false,
      ownerAcceptanceEstablished: false,
      strictCompletionEstablished: false,
    },
    reexportedScripts: scripts,
  };
  value.scenarioTraceCandidates = scenarioTraceCandidates(value.operations, value.signals);
  return value;
}

function stripTransientScriptText(item) {
  const {reexportedScripts, ...retained} = item;
  return retained;
}

function summarize(items, shellBinding) {
  const totals = (selector) => items.reduce((sum, item) => sum + selector(item), 0);
  const operationCounts = Object.fromEntries(CATEGORY_ORDER.map((category) => [category,
    totals((item) => item.counts.operationsByCategory[category] || 0)]).filter(([, count]) => count));
  const signalCounts = Object.fromEntries(CATEGORY_ORDER.map((category) => [category,
    totals((item) => item.counts.signalsByCategory[category] || 0)]).filter(([, count]) => count));
  return {
    canonicalItems: items.length,
    physicallyRehashedSwfs: items.filter((item) => item.source.swf.physicalHashVerifiedNow).length,
    completeFfdecReexports: items.filter((item) => item.reexport.fullManifestMatchesMachineAudit).length,
    exportedScriptFileCount: totals((item) => item.reexport.exportedScriptFileCount),
    normalizedScriptBytes: totals((item) => item.reexport.normalizedBytes),
    exactOperationCount: totals((item) => item.counts.operations),
    exactOperationsByCategory: operationCounts,
    exactTimelineOperationMethodsResolved: operationCounts.timeline || 0,
    exactEventHandlerExpressionsResolved: totals((item) => item.counts.exactEventHandlerOperationCount),
    exactExternalCallsResolved: operationCounts.external || 0,
    exactSignalCount: totals((item) => item.counts.signals),
    exactSignalsByCategory: signalCounts,
    sourceBoundScenarioTraceCandidateCount: totals((item) => item.scenarioTraceCandidates.length),
    itemsWithSourceBoundScenarioTraceCandidates: items.filter((item) => item.scenarioTraceCandidates.length).length,
    shellStaticExactCandidatesMatched: shellBinding.staticExactCandidatesMatched,
    shellStaticExactCandidateCount: shellBinding.staticExactCandidateCount,
    shellSupportingExpressionLinesMatched: shellBinding.supportingExpressionLinesMatched,
    itemsWithRuntimeReachability: 0,
    authoritativeScenarioInventories: 0,
    authoritativeTraceSpecs: 0,
    acceptanceChanges: 0,
  };
}

function markdownReport(report) {
  const rows = report.items.map((item) => {
    const operationCounts = item.counts.operationsByCategory;
    return `| ${item.sequence} | \`${item.animationId}\` | ${item.reexport.exportedScriptFileCount} | ${item.counts.operations} | ${operationCounts.timeline || 0} | ${operationCounts.lifecycle || 0} | ${operationCounts.random || 0} | ${operationCounts.input || 0} | ${operationCounts.scoring || 0} | ${operationCounts["replay-reset"] || 0} | ${operationCounts.external || 0} | ${operationCounts.language || 0} | ${operationCounts.audio || 0} | ${operationCounts.global || 0} | ${item.scenarioTraceCandidates.length} |`;
  });
  const counts = report.summary.exactOperationsByCategory;
  return [
    "# G4 L3 ActionScript Source-Operation Index v2",
    "",
    "> Deterministic, acceptance-neutral static source evidence only. No Animate, Ruffle, original runtime, legacy endpoint, migration, renderer, route, review, approval, status, or ledger operation is performed.",
    "",
    "## Result",
    "",
    `- Physically re-hashed SWFs: **${report.summary.physicallyRehashedSwfs}/40**.`,
    `- Complete temporary FFDec re-exports matching the existing machine manifests and normalized bundles: **${report.summary.completeFfdecReexports}/40**.`,
    `- Exported scripts: **${report.summary.exportedScriptFileCount.toLocaleString("en-US")}** / ${report.summary.normalizedScriptBytes.toLocaleString("en-US")} normalized bytes.`,
    `- Exact source operations: **${report.summary.exactOperationCount.toLocaleString("en-US")}**; timeline ${counts.timeline || 0}, lifecycle ${counts.lifecycle || 0}, random ${counts.random || 0}, input ${counts.input || 0}, scoring ${counts.scoring || 0}, Replay/reset ${counts["replay-reset"] || 0}, external ${counts.external || 0}, language ${counts.language || 0}, audio ${counts.audio || 0}, global ${counts.global || 0}.`,
    `- Exact event-handler expressions: **${report.summary.exactEventHandlerExpressionsResolved.toLocaleString("en-US")}**.`,
    `- Source-bound scenario/trace candidates: **${report.summary.sourceBoundScenarioTraceCandidateCount.toLocaleString("en-US")}** across **${report.summary.itemsWithSourceBoundScenarioTraceCandidates}/40** items.`,
    `- Shell contract reproduction: **${report.summary.shellStaticExactCandidatesMatched}/${report.summary.shellStaticExactCandidateCount}** exact calls and **${report.summary.shellSupportingExpressionLinesMatched}** supporting source lines.`,
    "- Runtime reachability, authoritative scenarios/traces, acceptance, and completion: **0**.",
    "",
    "## Evidence bindings",
    "",
    `- Machine audit: \`${report.sourceBindings.machineAudit.path}\` / \`${report.sourceBindings.machineAudit.sha256}\``,
    `- Static source-event index: \`${report.sourceBindings.staticSourceEventIndex.path}\` / \`${report.sourceBindings.staticSourceEventIndex.sha256}\``,
    `- Shell dependency contract: \`${report.sourceBindings.shellLegacyHostDependencyContract.path}\` / \`${report.sourceBindings.shellLegacyHostDependencyContract.sha256}\``,
    `- Source-set SHA-256: \`${report.sourceBindings.sourceSetSha256}\``,
    `- Re-export-set SHA-256: \`${report.sourceBindings.reexportSetSha256}\``,
    `- FFDec: \`${report.sourceBindings.tool.ffdec.version}\` / JAR \`${report.sourceBindings.tool.ffdec.ffdecJarSha256}\``,
    "",
    "## Per-item source operation counts",
    "",
    "| # | Animation | Scripts | Ops | Timeline | Lifecycle | Random | Input | Score | Replay | External | Lang | Audio | Global | Candidates |",
    "|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ...rows,
    "",
    "## Authority boundary",
    "",
    "- Exact methods, receivers, arguments, lines, event expressions, lexical signals, source paths, and hashes are static FFDec/source facts.",
    "- A decompiled call or handler is not proof that its symbol is placed, dispatched, reachable, ordered, or observed in the shipped runtime.",
    "- Scenario/trace candidates contain no authoritative schedule, execution receipt, seed binding, frame capture, or acceptance decision.",
    "- No legacy external call was executed. External candidates remain disabled or unresolved until reviewed through a separate product/runtime process.",
    "- Every runtime, audio, visual, human, owner, and strict-completion gate remains false.",
    "",
  ].join("\n");
}

export function validateReport(report) {
  invariant(report?.schemaVersion === SCHEMA_VERSION && report.reportType === REPORT_TYPE,
    "Unexpected source-operation report schema/type");
  invariant(report.generator?.path === "scripts/build-g4-l3-source-operation-index-v2.mjs" && /^[a-f0-9]{64}$/.test(report.generator.sha256 || ""),
    "Invalid generator binding");
  invariant(report.items?.length === 40 && report.summary?.canonicalItems === 40,
    "Source-operation report must contain exactly 40 G4 L3 items");
  invariant(report.sourceBindings?.sourceSetSha256 === sourceSetSha256(report.items),
    "Source-operation source-set SHA-256 is stale");
  invariant(report.sourceBindings?.reexportSetSha256 === reexportSetSha256(report.items),
    "Source-operation re-export-set SHA-256 is stale");
  invariant(report.summary.physicallyRehashedSwfs === 40 && report.summary.completeFfdecReexports === 40,
    "Every G4 L3 SWF must be physically rehashed and completely re-exported");
  invariant(report.summary.exportedScriptFileCount === 1809,
    "Expected the current 1,809-file G4 L3 FFDec export set");
  invariant(report.summary.exactTimelineOperationMethodsResolved === 1577,
    "Exact timeline operations must reproduce all 1,577 upstream occurrences");
  invariant(report.summary.shellStaticExactCandidatesMatched === report.summary.shellStaticExactCandidateCount &&
    report.summary.shellStaticExactCandidateCount === 20,
  "All 20 static shell calls must be reproduced exactly");
  invariant(report.summary.itemsWithRuntimeReachability === 0 && report.summary.authoritativeScenarioInventories === 0 &&
    report.summary.authoritativeTraceSpecs === 0 && report.summary.acceptanceChanges === 0,
  "Machine source-operation evidence must not promote runtime or acceptance state");
  invariant(report.authority?.sourceBoundStaticOperationsEstablished === true &&
    report.authority.exactMethodsReceiversArgumentsLinesAndEventExpressionsEstablished === true &&
    report.authority.sourceBoundScenarioTraceCandidatesEstablished === true,
  "Static source-operation authority fields are incomplete");
  for (const field of [
    "runtimeReachabilityEstablished",
    "authoritativeScenarioInventoryEstablished",
    "authoritativeTraceSpecsEstablished",
    "originalRuntimeBaselineEstablished",
    "visualOrBehavioralParityEstablished",
    "audioSynchronizationOrListeningEstablished",
    "humanReviewEstablished",
    "ownerAcceptanceEstablished",
    "strictCompletionEstablished",
  ]) invariant(report.authority[field] === false, `Report authority ${field} must remain false`);
  const forbiddenTruthy = [
    "runtimeLaunched",
    "runtimeReachabilityEstablished",
    "orderedNaturalExecutionEstablished",
    "authoritativeScenarioInventoryEstablished",
    "authoritativeTraceSpecsEstablished",
    "deterministicSeedBindingsEstablished",
    "originalRuntimeBaselineEstablished",
    "visualOrBehavioralParityEstablished",
    "audioSynchronizationOrListeningEstablished",
    "humanReviewEstablished",
    "ownerAcceptanceEstablished",
    "strictCompletionEstablished",
  ];
  const animationIds = new Set();
  const sourcePaths = new Set();
  for (const item of report.items) {
    invariant(!animationIds.has(item.animationId), `Duplicate animation ID ${item.animationId}`);
    animationIds.add(item.animationId);
    invariant(!sourcePaths.has(item.source.swf.path), `Duplicate source path ${item.source.swf.path}`);
    sourcePaths.add(item.source.swf.path);
    invariant(item.assetId === `swf-${item.source.swf.sha256}` && /^[a-f0-9]{64}$/.test(item.source.swf.sha256),
      `${item.animationId}: invalid source asset binding`);
    invariant(item.reexport.fullManifestMatchesMachineAudit && item.reexport.normalizedBundleMatchesMachineAudit,
      `${item.animationId}: incomplete FFDec/machine binding`);
    invariant(item.reexport.files.length === item.reexport.exportedScriptFileCount &&
      item.reexport.files.reduce((sum, file) => sum + file.bytes, 0) === item.reexport.normalizedBytes &&
      sha256(stableJson(item.reexport.files)) === item.reexport.contentManifestSha256,
    `${item.animationId}: retained complete script manifest is internally inconsistent`);
    invariant(item.upstreamBindings.sourceEventRecordsBound === item.upstreamBindings.sourceEventCount &&
      item.upstreamBindings.uniqueSourceEventScriptsBound <= item.upstreamBindings.sourceEventRecordsBound,
    `${item.animationId}: static source-event binding counts are inconsistent`);
    invariant(stableJson(item.counts) === stableJson(expectedItemCounts(item)),
      `${item.animationId}: operation/signal counts are stale`);
    const operationIds = new Set(item.operations.map((operation) => operation.operationId));
    const signalIds = new Set(item.signals.map((signal) => signal.signalId));
    invariant(operationIds.size === item.operations.length && signalIds.size === item.signals.length,
      `${item.animationId}: duplicate operation or signal ID`);
    for (const operation of item.operations) {
      invariant(/^operation-\d{5}$/.test(operation.operationId) && operation.scriptPath.endsWith(".as") &&
        /^[a-f0-9]{64}$/.test(operation.scriptSha256) && Number.isInteger(operation.lineNumber) && operation.lineNumber >= 1 &&
        Number.isInteger(operation.columnNumber) && operation.columnNumber >= 1 &&
        Number.isInteger(operation.methodColumnNumber) && operation.methodColumnNumber >= 1 &&
        typeof operation.method === "string" && operation.method.length > 0 &&
        (operation.receiverExpression === null || typeof operation.receiverExpression === "string") &&
        Array.isArray(operation.argumentExpressions) && typeof operation.exactExpression === "string" &&
        sha256(operation.exactExpression) === operation.expressionSha256 && operation.categories.length > 0 &&
        operation.categories.every((category) => CATEGORY_ORDER.includes(category)),
      `${item.animationId}: invalid exact operation ${operation.operationId}`);
      invariant(operation.operationKind !== "event-handler" ||
        (operation.method === "handler" && /^on(?:ClipEvent)?\s*\(/.test(operation.eventExpression || "")),
      `${item.animationId}: invalid event-handler expression ${operation.operationId}`);
    }
    for (const signal of item.signals) {
      invariant(/^signal-\d{5}$/.test(signal.signalId) && signal.scriptPath.endsWith(".as") &&
        /^[a-f0-9]{64}$/.test(signal.scriptSha256) && Number.isInteger(signal.lineNumber) && signal.lineNumber >= 1 &&
        Number.isInteger(signal.columnNumber) && signal.columnNumber >= 1 &&
        CATEGORY_ORDER.includes(signal.category) && typeof signal.exactExpression === "string" &&
        sha256(signal.exactExpression) === signal.expressionSha256,
      `${item.animationId}: invalid exact lexical signal ${signal.signalId}`);
    }
    for (const field of forbiddenTruthy) invariant(item.runtimeBoundary[field] === false,
      `${item.animationId}: ${field} must remain false`);
    for (const candidate of item.scenarioTraceCandidates) {
      invariant(candidate.classification === "source-bound-scenario-and-trace-candidate-only" &&
        candidate.runtimeReachabilityEstablished === false && candidate.naturalExecutionProofEstablished === false &&
        candidate.captureScheduleEstablished === false && candidate.orderedScheduleEstablished === false &&
        candidate.deterministicSeedBindingEstablished === false && candidate.runtimeScenarioIds.length === 0 &&
        candidate.authoritativeTraceIds.length === 0 && candidate.acceptanceEffect === "none" &&
        candidate.sourceOperationIds.every((id) => operationIds.has(id)) &&
        candidate.sourceSignalIds.every((id) => signalIds.has(id)),
      `${item.animationId}: scenario/trace candidate crosses the machine-only boundary`);
    }
  }
  const shellItems = report.items.filter((item) => item.animationId === "shell-course-g04-l03-index-local");
  invariant(shellItems.length === 1, "Source-operation report must contain exactly one G4 L3 shell item");
  const shellOperations = new Map(shellItems[0].operations.map((operation) => [operation.operationId, operation]));
  const shellBindings = report.shellCrosscheck?.candidateOperationBindings;
  invariant(report.shellCrosscheck?.staticExactCandidateCount === 20 &&
    report.shellCrosscheck.staticExactCandidatesMatched === 20 &&
    report.shellCrosscheck.supportingExpressionLinesMatched === 30,
  "Shell crosscheck must retain exactly 20 matched candidates and 30 supporting source lines");
  invariant(Array.isArray(shellBindings) && shellBindings.length === 20,
    "Shell crosscheck must retain exactly 20 candidate-operation bindings");
  const boundCandidateIds = new Set(shellBindings.map((binding) => binding.candidateId));
  const boundOperationIds = new Set(shellBindings.map((binding) => binding.operationId));
  invariant(boundCandidateIds.size === 20 && boundOperationIds.size === 20,
    "Shell crosscheck candidate and operation IDs must each be unique");
  invariant(SHELL_STATIC_CANDIDATE_IDS.every((candidateId) => boundCandidateIds.has(candidateId)),
    "Shell crosscheck must retain the exact authoritative candidate IDs static-001 through static-020");
  for (const binding of shellBindings) {
    const operation = shellOperations.get(binding.operationId);
    invariant(operation, `Shell crosscheck operation ${binding.operationId} does not resolve to the G4 L3 shell item`);
    invariant(operation.shellContractCandidateId === binding.candidateId,
      `Shell crosscheck ${binding.candidateId}/${binding.operationId} disagrees with the shell operation binding`);
    invariant(Number.isInteger(binding.contractColumnNumber) && binding.contractColumnNumber >= 1,
      `Shell crosscheck ${binding.candidateId} contract column must be a positive integer`);
    invariant(binding.parsedExpressionColumnNumber === operation.columnNumber &&
      binding.parsedMethodColumnNumber === operation.methodColumnNumber,
    `Shell crosscheck ${binding.candidateId} parsed columns disagree with the resolved operation`);
    const expectedMatchMode = binding.candidateId === "static-019"
      ? SHELL_LINE_CONTAINING_MATCH_MODE
      : SHELL_EXACT_OPERATION_MATCH_MODE;
    invariant((binding.exactCallMatchMode === SHELL_EXACT_OPERATION_MATCH_MODE ||
      binding.exactCallMatchMode === SHELL_LINE_CONTAINING_MATCH_MODE) &&
      binding.exactCallMatchMode === expectedMatchMode,
    `Shell crosscheck ${binding.candidateId} has an invalid or inconsistent exact-call match mode`);
  }
  const annotatedShellOperations = shellItems[0].operations.filter((operation) => operation.shellContractCandidateId);
  invariant(annotatedShellOperations.length === 20 && annotatedShellOperations.every((operation) =>
    boundCandidateIds.has(operation.shellContractCandidateId) && boundOperationIds.has(operation.operationId)),
  "Shell operation annotations and candidate-operation bindings must be an exact 20-item set");
  const expectedSummary = {
    ...summarize(report.items, report.shellCrosscheck),
    itemSetSha256: itemSetSha256(report.items),
  };
  invariant(stableJson(report.summary) === stableJson(expectedSummary),
    "Source-operation summary aggregates or item-set SHA-256 are stale");
  const acceptance = report.acceptance;
  invariant(acceptance.acceptanceNeutral === true && acceptance.sourceAssetChanges === 0 &&
    acceptance.migrationWorkspaceChanges === 0 && acceptance.rendererChanges === 0 &&
    acceptance.routeChanges === 0 && acceptance.reviewOrApprovalChanges === 0 &&
    acceptance.statusChanges === 0 && acceptance.completionLedgerChanges === 0 &&
    acceptance.legacyEndpointExecutions === 0 && acceptance.runtimeSessions === 0 &&
    acceptance.strictAcceptanceEffect === false,
  "Acceptance boundary is not fail-closed");
  return true;
}

export async function buildG4L3SourceOperationIndexV2({
  root = projectRoot,
  ffdec = "ffdec",
  concurrency = 2,
  scriptExporter = exportScriptsWithFfdec,
  toolProbe = inspectFfdec,
} = {}) {
  const [machineBound, staticBound, shellBound] = await Promise.all([
    readBoundJson(root, MACHINE_AUDIT_RELATIVE),
    readBoundJson(root, STATIC_INDEX_RELATIVE),
    readBoundJson(root, SHELL_CONTRACT_RELATIVE),
  ]);
  const machine = machineBound.value;
  const staticIndex = staticBound.value;
  const shellContract = shellBound.value;
  invariant(machine.schemaVersion === 1 && machine.reportType === "g4-l3-machine-source-audits" && machine.items.length === 40,
    "Unexpected G4 L3 machine source audit");
  invariant(staticIndex.schemaVersion === 1 && staticIndex.reportType === "g4-l3-static-source-event-index" && staticIndex.items.length === 40,
    "Unexpected G4 L3 static source-event index");
  invariant(shellContract.schemaVersion === 1 && shellContract.reportType === "g4-l3-shell-legacy-host-dependency-disposition-contract",
    "Unexpected G4 L3 shell dependency contract");
  invariant(shellContract.sourceBindings.machineSourceAudit.sha256 === machineBound.binding.sha256,
    "Shell contract is not bound to the selected machine audit");
  invariant(shellContract.sourceBindings.staticSourceEventIndex.sha256 === staticBound.binding.sha256,
    "Shell contract is not bound to the selected static source-event index");

  const staticByAnimation = new Map(staticIndex.items.map((item) => [item.animationId, item]));
  invariant(staticByAnimation.size === 40, "Static source-event item IDs are not unique");
  const archiveReal = await realpath(path.join(root, SOURCE_ROOT_RELATIVE));
  const scratchRoot = await mkdtemp(path.join(os.tmpdir(), "g4-l3-source-operation-v2-"));
  let tool;
  let built;
  try {
    tool = await toolProbe(ffdec);
    built = await mapWithConcurrency(machine.items, concurrency, async (machineItem) => {
      const staticItem = staticByAnimation.get(machineItem.animationId);
      invariant(staticItem, `${machineItem.animationId}: no static source-event item`);
      invariant(staticItem.assetId === machineItem.assetId, `${machineItem.animationId}: asset ID differs across inputs`);
      const source = await verifiedSourceSwf({root, archiveReal, machineItem});
      const exported = await scriptExporter({
        command: ffdec,
        sourcePath: source.absolute,
        outputRoot: scratchRoot,
        animationId: machineItem.animationId,
      });
      const manifest = scriptManifest(exported);
      assertManifestMatchesUpstream(machineItem.animationId, manifest, machineItem.scripts);
      const scripts = exported.map((script) => ({
        path: portable(script.path),
        text: normalizeText(script.text),
        bytes: Buffer.byteLength(normalizeText(script.text)),
        sha256: sha256(normalizeText(script.text)),
      })).sort((left, right) => compareText(left.path, right.path));
      bindStaticEvents(machineItem.animationId, scripts, staticItem);
      return reportItem({machineItem, staticItem, source, scripts, manifest});
    });
  } finally {
    await rm(scratchRoot, {recursive: true, force: true});
  }

  const shellItem = built.find((item) => item.animationId === "shell-course-g04-l03-index-local");
  invariant(shellItem, "G4 L3 shell item is absent");
  const shellBinding = bindShellContract({shellItem, shellContract});
  shellItem.counts.operationsByCategory = categoryCounts(shellItem.operations, "categories");
  shellItem.counts.exactExternalCallCount = shellItem.operations.filter((operation) => operation.categories.includes("external")).length;
  shellItem.scenarioTraceCandidates = scenarioTraceCandidates(shellItem.operations, shellItem.signals);

  const retainedItems = built.map(stripTransientScriptText);
  const generatorBytes = await readFile(scriptPath);
  const report = {
    schemaVersion: SCHEMA_VERSION,
    reportType: REPORT_TYPE,
    generator: {
      path: "scripts/build-g4-l3-source-operation-index-v2.mjs",
      version: SCHEMA_VERSION,
      parserVersion: 1,
      sha256: sha256(generatorBytes),
    },
    sourceBindings: {
      machineAudit: machineBound.binding,
      staticSourceEventIndex: staticBound.binding,
      shellLegacyHostDependencyContract: shellBound.binding,
      sourceArchive: {
        path: SOURCE_ROOT_RELATIVE,
        physicalFilesRead: 40,
        writes: 0,
      },
      sourceSetSha256: sourceSetSha256(retainedItems),
      reexportSetSha256: reexportSetSha256(retainedItems),
      tool: {ffdec: tool},
    },
    method: {
      completeTemporaryFfdecReexport: true,
      scriptBodyRetention: "No complete ActionScript body is retained in this report; exact selected operation/signal expressions plus the complete file manifest and normalized-bundle hash are retained.",
      parser: "deterministic lexical and balanced-parenthesis parser over LF-normalized FFDec ActionScript export",
      exactCallFields: ["method", "receiverExpression", "argumentExpressions", "lineNumber", "columnNumber", "methodColumnNumber", "eventExpression", "exactExpression"],
      staticSourceOnly: true,
      temporaryExportRemoved: true,
      legacyEndpointsExecuted: false,
    },
    shellCrosscheck: shellBinding,
    summary: summarize(retainedItems, shellBinding),
    items: retainedItems,
    authority: {
      sourceBoundStaticOperationsEstablished: true,
      exactMethodsReceiversArgumentsLinesAndEventExpressionsEstablished: true,
      sourceBoundScenarioTraceCandidatesEstablished: true,
      runtimeReachabilityEstablished: false,
      authoritativeScenarioInventoryEstablished: false,
      authoritativeTraceSpecsEstablished: false,
      originalRuntimeBaselineEstablished: false,
      visualOrBehavioralParityEstablished: false,
      audioSynchronizationOrListeningEstablished: false,
      humanReviewEstablished: false,
      ownerAcceptanceEstablished: false,
      strictCompletionEstablished: false,
      statement: "Static exact source operations and candidates are not execution evidence. Every runtime, visual, audio, review, acceptance, and completion authority remains false.",
    },
    acceptance: {
      acceptanceNeutral: true,
      sourceAssetChanges: 0,
      migrationWorkspaceChanges: 0,
      rendererChanges: 0,
      routeChanges: 0,
      reviewOrApprovalChanges: 0,
      statusChanges: 0,
      completionLedgerChanges: 0,
      legacyEndpointExecutions: 0,
      runtimeSessions: 0,
      strictAcceptanceEffect: false,
      statement: "This report adds deterministic static machine evidence only and changes no source, migration, implementation, route, review, approval, status, ledger, or strict gate.",
    },
  };
  report.summary.itemSetSha256 = itemSetSha256(report.items);
  validateReport(report);
  return {report, json: stableJson(report), markdown: markdownReport(report)};
}

function parseArguments(argv) {
  const options = {
    root: projectRoot,
    ffdec: "ffdec",
    concurrency: 2,
    jsonOutput: DEFAULT_JSON_RELATIVE,
    markdownOutput: DEFAULT_MARKDOWN_RELATIVE,
    check: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--root") options.root = path.resolve(argv[++index]);
    else if (argument === "--ffdec") options.ffdec = argv[++index];
    else if (argument === "--concurrency") options.concurrency = Number(argv[++index]);
    else if (argument === "--json-output") options.jsonOutput = argv[++index];
    else if (argument === "--markdown-output") options.markdownOutput = argv[++index];
    else if (argument === "-h" || argument === "--help") options.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  invariant(options.help || (Number.isInteger(options.concurrency) && options.concurrency >= 1 && options.concurrency <= 8),
    "--concurrency must be an integer from 1 through 8");
  return options;
}

function resolveReportOutput(root, declaredPath, label) {
  invariant(typeof declaredPath === "string" && declaredPath.trim(), `${label} must be a non-empty path`);
  return path.isAbsolute(declaredPath)
    ? path.resolve(declaredPath)
    : path.resolve(root, declaredPath);
}

async function assertRegularReportTarget(filePath, label) {
  const metadata = await lstat(filePath).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  invariant(!metadata || metadata.isFile(), `${label} must be missing or an existing regular file`);
}

export async function assertSafeSourceOperationReportOutputs({
  root = projectRoot,
  jsonOutput = DEFAULT_JSON_RELATIVE,
  markdownOutput = DEFAULT_MARKDOWN_RELATIVE,
} = {}) {
  const resolvedRoot = path.resolve(root);
  const outputs = {
    root: resolvedRoot,
    jsonOutput: resolveReportOutput(resolvedRoot, jsonOutput, "JSON output"),
    markdownOutput: resolveReportOutput(resolvedRoot, markdownOutput, "Markdown output"),
  };
  await Promise.all([
    (async () => {
      await assertSafeReportOutput(outputs.jsonOutput, {root: resolvedRoot, extension: ".json"});
      await assertRegularReportTarget(outputs.jsonOutput, "JSON output");
    })(),
    (async () => {
      await assertSafeReportOutput(outputs.markdownOutput, {root: resolvedRoot, extension: ".md"});
      await assertRegularReportTarget(outputs.markdownOutput, "Markdown output");
    })(),
  ]);
  return outputs;
}

export async function writeOrCheckSourceOperationReports({
  root = projectRoot,
  jsonOutput = DEFAULT_JSON_RELATIVE,
  markdownOutput = DEFAULT_MARKDOWN_RELATIVE,
  expectedJson,
  expectedMarkdown,
  check = false,
} = {}) {
  invariant(typeof expectedJson === "string", "expectedJson must be a string");
  invariant(typeof expectedMarkdown === "string", "expectedMarkdown must be a string");
  const outputs = await assertSafeSourceOperationReportOutputs({root, jsonOutput, markdownOutput});
  await Promise.all([
    writeOrCheckReport(outputs.jsonOutput, expectedJson, {
      root: outputs.root,
      extension: ".json",
      check,
    }),
    writeOrCheckReport(outputs.markdownOutput, expectedMarkdown, {
      root: outputs.root,
      extension: ".md",
      check,
    }),
  ]);
  return outputs;
}

function usage() {
  return `Usage: node scripts/build-g4-l3-source-operation-index-v2.mjs [options]\n\n` +
    `  --check                 Re-export and compare both retained reports without writing\n` +
    `  --ffdec <command>       FFDec command (default: ffdec)\n` +
    `  --concurrency <1..8>    Concurrent temporary exports (default: 2)\n` +
    `  --root <directory>      Project root\n` +
    `  --json-output <path>    JSON report path inside project reports/\n` +
    `  --markdown-output <path> Markdown report path inside project reports/\n`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const outputs = await assertSafeSourceOperationReportOutputs(options);
  const result = await buildG4L3SourceOperationIndexV2({
    root: options.root,
    ffdec: options.ffdec,
    concurrency: options.concurrency,
  });
  await writeOrCheckSourceOperationReports({
    ...outputs,
    expectedJson: result.json,
    expectedMarkdown: result.markdown,
    check: options.check,
  });
  process.stdout.write(`${options.check ? "Verified" : "Generated"} ${projectPath(outputs.root, outputs.jsonOutput)} and ${projectPath(outputs.root, outputs.markdownOutput)}.\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
