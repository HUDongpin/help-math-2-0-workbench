#!/usr/bin/env node

import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {createReadStream, statSync} from "node:fs";
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {inflateSync} from "node:zlib";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const ANIMATION_ID = "course-g05-l13-rw-002";
export const EXPECTED_FFDEC_VERSION = "JPEXS Free Flash Decompiler v.26.2.1";
export const EXPECTED_FFDEC_JAR_SHA256 = "090ab695053ad94cba6408574c7d7eea20ec60b6ae789ee6056a23f45106762f";
export const EXPECTED_SWFMILL_VERSION = "swfmill 0.3.6";
export const EXPECTED_SWFMILL_SHA256 = "b1299adad7f32d8e489574539e79b0f42c4960148170bc1ca48736e07ccbd311";

const lessonRootRelative = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L13";
const migrationRelative = `migrations/${ANIMATION_ID}`;
const auditRelative = `${migrationRelative}/audit`;
const ffdecArtifactsRelative = `${auditRelative}/original-host-entry/ffdec-scripts`;

const SOURCE_BINDINGS = Object.freeze({
  originalHost: {
    relativePath: `${lessonRootRelative}/index_local.swf`,
    expectedSha256: "956d8e90ca07d59aeb9b3e97bc20f7e2e14221125913d8f774b8c98a61d4292d",
    role: "unmodified-original-lesson-host",
  },
  initialChild: {
    relativePath: `${lessonRootRelative}/IR/L13RW01.swf`,
    expectedSha256: "bf91ca582fab1b414950af18fa10c2e5676804102e26c1b2ceadef338405473e",
    role: "source-script-proven-default-startup-child",
  },
  targetChild: {
    relativePath: `${lessonRootRelative}/RW/L13RW02.swf`,
    expectedSha256: "bf9ab1d12832fbe54c5bef08d0dd51307169eefbae1f75188efd9db94ed9e4e6",
    role: "target-animation-child",
  },
  spanishAudio: {
    relativePath: `${lessonRootRelative}/SA/L13RW02.mp3`,
    expectedSha256: "2e809c69df60cec11427a71d38b37b830a0a9ec805e3c8ff4f68734cb53bfcd2",
    role: "source-script-derived-spanish-user-activated-track",
  },
  lessonXml: {
    relativePath: `${lessonRootRelative}/index.xml`,
    expectedSha256: "71e34cf68f01f43ddd447ce7c858e4ff6fc04b5b8734c0fff272561593d1c524",
    role: "corroborating-authoring-metadata-not-read-by-this-host-entry-path",
  },
  englishKeytermsXml: {
    relativePath: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml",
    expectedSha256: "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749",
    role: "automatic-english-keyterm-xml-read-at-host-root-frame-50",
  },
  spanishKeytermsXml: {
    relativePath: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml",
    expectedSha256: "7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00",
    role: "conditional-glossary-spanish-switch-only",
  },
});

const SELECTED_FFDEC_SCRIPTS = Object.freeze([
  {relativePath: "frame_35/DoAction.as", roles: ["child-load", "embedded-lesson-map", "spanish-audio", "side-effects"]},
  {relativePath: "DefineSprite_179/frame_2/DoAction.as", roles: ["internal-preloader-begin-handoff"]},
  {relativePath: "DefineSprite_179/frame_3/DoAction.as", roles: ["internal-preloader-begin-handoff"]},
  {relativePath: "frame_49/DoAction.as", roles: ["default-startup-child-selection"]},
  {relativePath: "frame_50/DoAction.as", roles: ["default-startup-child-load"]},
  {relativePath: "DefineButton2_344/BUTTONCONDACTION on(release).as", roles: ["target-navigation-next-trigger"]},
  {relativePath: "DefineSprite_696/frame_1/DoAction.as", roles: ["automatic-english-keyterm-read"]},
  {relativePath: "DefineButton2_215/BUTTONCONDACTION on(release).as", roles: ["spanish-audio-stop-trigger"]},
  {relativePath: "DefineButton2_221/BUTTONCONDACTION on(release).as", roles: ["spanish-audio-play-trigger"]},
  {relativePath: "DefineButton2_151/BUTTONCONDACTION on(release).as", roles: ["side-effects"]},
  {relativePath: "DefineButton2_251/BUTTONCONDACTION on(release).as", roles: ["side-effects"]},
  {relativePath: "DefineButton2_560/BUTTONCONDACTION on(release).as", roles: ["side-effects"]},
  {relativePath: "DefineSprite_155/frame_15/DoAction.as", roles: ["side-effects"]},
  {relativePath: "DefineSprite_164/frame_5/DoAction.as", roles: ["side-effects"]},
  {relativePath: "FScrollPaneSymbol.as", roles: ["side-effects"]},
]);

const EXCERPT_DEFINITIONS = Object.freeze([
  {
    excerptId: "host-child-load-setup",
    script: "frame_35/DoAction.as",
    lineStart: 1062,
    lineEnd: 1072,
    mustContain: ["function loadSWFMovie()", "animation_mc.unloadMovie()"],
  },
  {
    excerptId: "host-child-load-call",
    script: "frame_35/DoAction.as",
    lineStart: 1181,
    lineEnd: 1185,
    mustContain: ["FileName = _loc1_.playSwfFileName", "animation_mc.loadMovie(_loc1_.playSwfFileName,1)"],
  },
  {
    excerptId: "internal-preloader-frame-2-begin-handoff",
    script: "DefineSprite_179/frame_2/DoAction.as",
    lineStart: 1,
    lineEnd: 12,
    mustContain: ["getBytesLoaded()", "gotoAndPlay(\"begin\")"],
  },
  {
    excerptId: "internal-preloader-frame-3-begin-handoff",
    script: "DefineSprite_179/frame_3/DoAction.as",
    lineStart: 1,
    lineEnd: 19,
    mustContain: ["getPercent = bytes_loaded / bytes_total", "gotoAndPlay(\"begin\")", "this.gotoAndPlay(2)"],
  },
  {
    excerptId: "default-startup-child-selection",
    script: "frame_49/DoAction.as",
    lineStart: 22,
    lineEnd: 32,
    mustContain: ["_global.sectionNumber = 1", "_global.slideNumber = 2", '"/IR/"'],
  },
  {
    excerptId: "default-startup-child-load",
    script: "frame_50/DoAction.as",
    lineStart: 1,
    lineEnd: 18,
    mustContain: ["_root.doCreateSlide()", "_root.loadSWFMovie()"],
  },
  {
    excerptId: "embedded-lesson-map",
    script: "frame_35/DoAction.as",
    lineStart: 3498,
    lineEnd: 3501,
    mustContain: ["[Section1Details]~IR~L13RW01.swf", "[Section2Details]~RW~L13RW02.swf"],
  },
  {
    excerptId: "target-navigation-next-button",
    script: "DefineButton2_344/BUTTONCONDACTION on(release).as",
    lineStart: 1,
    lineEnd: 7,
    mustContain: ["_root.doPlayNextMovie()"],
  },
  {
    excerptId: "target-navigation-ir-to-rw02",
    script: "frame_35/DoAction.as",
    lineStart: 783,
    lineEnd: 812,
    mustContain: ["function doPlayNextMovie()", "_loc1_.sectionNumber = 2", "_loc1_.slideNumber = 2", '"/RW/"', "_loc2_.loadSWFMovie()"],
  },
  {
    excerptId: "lesson-root-url-derivation",
    script: "frame_35/DoAction.as",
    lineStart: 3645,
    lineEnd: 3648,
    mustContain: ["tempURL = _root._url", "_global.tempURL", "_global.xmlPath"],
  },
  {
    excerptId: "spanish-audio-stop-load-and-completion-resume",
    script: "frame_35/DoAction.as",
    lineStart: 2344,
    lineEnd: 2374,
    mustContain: ["function doPlaySpanishAudio()", "animation.stop()", '"/SA/"', "gSound.loadSound", "onSoundComplete", "animation.play()"],
  },
  {
    excerptId: "spanish-audio-start",
    script: "frame_35/DoAction.as",
    lineStart: 2375,
    lineEnd: 2387,
    mustContain: ["_global.gSound.start()"],
  },
  {
    excerptId: "spanish-audio-manual-stop-resume",
    script: "frame_35/DoAction.as",
    lineStart: 2388,
    lineEnd: 2401,
    mustContain: ["function doStopSpanishAudio()", "gSound.stop()", "quizSection == false", "animation.play()"],
  },
  {
    excerptId: "spanish-audio-play-button",
    script: "DefineButton2_221/BUTTONCONDACTION on(release).as",
    lineStart: 1,
    lineEnd: 3,
    mustContain: ["doPlaySpanishAudio()"],
  },
  {
    excerptId: "spanish-audio-stop-button",
    script: "DefineButton2_215/BUTTONCONDACTION on(release).as",
    lineStart: 1,
    lineEnd: 3,
    mustContain: ["doStopSpanishAudio()"],
  },
  {
    excerptId: "keyterms-instance-auto-init",
    script: "DefineSprite_696/frame_1/DoAction.as",
    lineStart: 9,
    lineEnd: 17,
    mustContain: ["function C_L(M_Name)", "_root.doCreateGlossaryWord(M_Name)", "_root.doInitKeyTerms()"],
  },
  {
    excerptId: "keyterms-english-path-and-load-dispatch",
    script: "frame_35/DoAction.as",
    lineStart: 2858,
    lineEnd: 2872,
    mustContain: ["function doInitKeyTerms()", '"XML/ELKTEG4.xml"', 'C_L("Source")'],
  },
  {
    excerptId: "keyterms-xml-load",
    script: "frame_35/DoAction.as",
    lineStart: 2403,
    lineEnd: 2422,
    mustContain: ["function doCreateGlossaryWord(M_Name)", "F_X = new XML()", "F_X.load(_loc2_.KeyTermVar)"],
  },
  {
    excerptId: "conditional-spanish-glossary-button",
    script: "DefineSprite_696/frame_1/DoAction.as",
    lineStart: 126,
    lineEnd: 129,
    mustContain: ["BtnSpan.onRelease", "doSwitchSpanGloss()"],
  },
  {
    excerptId: "conditional-spanish-glossary-path",
    script: "frame_35/DoAction.as",
    lineStart: 3218,
    lineEnd: 3224,
    mustContain: ["function doSwitchSpanGloss()", '"XML/ELKTSG4.xml"', 'C_L("Source")'],
  },
]);

const SIDE_EFFECT_PATTERNS = Object.freeze([
  {api: "getURL", regex: /\bgetURL\s*\(/},
  {api: "loadVariablesNum", regex: /\bloadVariablesNum\s*\(/},
  {api: "fscommand", regex: /\bfscommand\s*\(/},
  {api: "SharedObject.getLocal", regex: /\bSharedObject\.getLocal\s*\(/},
  {api: "XML.load", regex: /\bF_X\.load\s*\(/},
  {api: "MovieClip.loadMovie", regex: /\.loadMovie\s*\(/},
  {api: "Sound.loadSound", regex: /\.loadSound\s*\(/},
]);

const EXPECTED_SIDE_EFFECT_COUNTS = Object.freeze({
  "getURL": 3,
  "loadVariablesNum": 3,
  "fscommand": 5,
  "SharedObject.getLocal": 1,
  "XML.load": 2,
  "MovieClip.loadMovie": 5,
  "Sound.loadSound": 1,
});

function portable(value) {
  return value.split(path.sep).join("/");
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

function sha256Buffer(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sha256Text(value) {
  return sha256Buffer(Buffer.from(value, "utf8"));
}

async function sha256File(candidate) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(candidate)) hash.update(chunk);
  return hash.digest("hex");
}

async function exists(candidate) {
  try {
    await stat(candidate);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(command, argumentsList, {cwd = projectRoot, timeoutMs = 120_000} = {}) {
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
      // Continue looking for the explicitly requested executable.
    }
  }
  return null;
}

export function parseArguments(argumentsList) {
  const options = {
    check: false,
    ffdec: "ffdec",
    swfmill: "swfmill",
    root: projectRoot,
  };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--ffdec" || value === "--swfmill" || value === "--root") {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--ffdec") options.ffdec = next;
      else if (value === "--swfmill") options.swfmill = next;
      else options.root = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function readSignedBits(buffer, state, bitCount) {
  let value = 0;
  for (let index = 0; index < bitCount; index += 1) {
    const byteIndex = Math.floor(state.bitOffset / 8);
    const bitIndex = 7 - (state.bitOffset % 8);
    value = (value << 1) | ((buffer[byteIndex] >> bitIndex) & 1);
    state.bitOffset += 1;
  }
  const signBit = 2 ** (bitCount - 1);
  return value >= signBit ? value - (2 ** bitCount) : value;
}

function readUnsignedBits(buffer, state, bitCount) {
  let value = 0;
  for (let index = 0; index < bitCount; index += 1) {
    const byteIndex = Math.floor(state.bitOffset / 8);
    const bitIndex = 7 - (state.bitOffset % 8);
    value = (value << 1) | ((buffer[byteIndex] >> bitIndex) & 1);
    state.bitOffset += 1;
  }
  return value;
}

export function parseSwfHeader(buffer) {
  assert(Buffer.isBuffer(buffer) && buffer.length >= 12, "SWF header is truncated");
  const signature = buffer.subarray(0, 3).toString("ascii");
  assert(["FWS", "CWS"].includes(signature), `unsupported SWF signature ${signature}`);
  const version = buffer[3];
  const declaredUncompressedBytes = buffer.readUInt32LE(4);
  const body = signature === "CWS" ? inflateSync(buffer.subarray(8)) : buffer.subarray(8);
  const bitState = {bitOffset: 0};
  const nBits = readUnsignedBits(body, bitState, 5);
  const xMin = readSignedBits(body, bitState, nBits);
  const xMax = readSignedBits(body, bitState, nBits);
  const yMin = readSignedBits(body, bitState, nBits);
  const yMax = readSignedBits(body, bitState, nBits);
  const rectBytes = Math.ceil(bitState.bitOffset / 8);
  assert(body.length >= rectBytes + 4, "SWF header does not contain frame rate/count");
  const rawFrameRateFixed8 = body.readUInt16LE(rectBytes);
  const fps = rawFrameRateFixed8 / 256;
  const frameCount = body.readUInt16LE(rectBytes + 2);
  return {
    signature,
    compression: signature === "CWS" ? "zlib" : "none",
    swfVersion: version,
    actualCompressedBytes: buffer.length,
    declaredUncompressedBytes,
    rectNBits: nBits,
    stageRectTwips: {xMin, xMax, yMin, yMax},
    nativeStage: {
      width: (xMax - xMin) / 20,
      height: (yMax - yMin) / 20,
    },
    rawFrameRateFixed8,
    fps,
    rootFrameCount: frameCount,
  };
}

export function extractLineExcerpt(rawSource, definition) {
  const normalized = rawSource.toString("utf8").replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  if (lines.at(-1) === "") lines.pop();
  assert(definition.lineStart >= 1 && definition.lineEnd >= definition.lineStart, `invalid excerpt ${definition.excerptId}`);
  assert(definition.lineEnd <= lines.length, `${definition.excerptId} exceeds ${definition.script} (${lines.length} lines)`);
  const text = `${lines.slice(definition.lineStart - 1, definition.lineEnd).join("\n")}\n`;
  for (const token of definition.mustContain) {
    assert(text.includes(token), `${definition.excerptId} no longer contains ${JSON.stringify(token)}`);
  }
  return {
    excerptId: definition.excerptId,
    artifact: `${ffdecArtifactsRelative}/${definition.script}`,
    lineStart: definition.lineStart,
    lineEnd: definition.lineEnd,
    lineEndingNormalization: "CRLF-or-CR-to-LF-with-one-terminal-LF",
    excerptSha256: sha256Text(text),
    text,
  };
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

export function classifySideEffects(scriptRecords) {
  const findings = [];
  for (const record of [...scriptRecords].sort((left, right) => compareText(left.relativePath, right.relativePath))) {
    const lines = record.raw.toString("utf8").replace(/\r\n?/g, "\n").split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      for (const pattern of SIDE_EFFECT_PATTERNS) {
        if (pattern.regex.test(lines[index])) {
          findings.push({
            api: pattern.api,
            artifact: `${ffdecArtifactsRelative}/${record.relativePath}`,
            line: index + 1,
            sourceLine: lines[index],
          });
        }
      }
    }
  }
  findings.sort((left, right) => compareText(left.artifact, right.artifact) || left.line - right.line || compareText(left.api, right.api));
  return findings;
}

async function inspectFfdec(ffdecArgument) {
  const commandPath = findOnPath(ffdecArgument);
  assert(commandPath, `FFDec executable not found: ${ffdecArgument}`);
  const launcherPath = await realpath(commandPath);
  const {stdout, stderr} = await run(commandPath, ["-help"], {timeoutMs: 30_000});
  const help = (stdout || stderr).replace(/\u001b\[[0-9;]*m/g, "");
  const version = help.split(/\r?\n/).find((line) => line.startsWith("JPEXS Free Flash Decompiler v."));
  assert(version === EXPECTED_FFDEC_VERSION, `FFDec version changed: expected ${EXPECTED_FFDEC_VERSION}, observed ${version || "unknown"}`);
  const jarPath = path.join(path.dirname(launcherPath), "ffdec.jar");
  assert(await exists(jarPath), `FFDec jar was not found next to launcher: ${jarPath}`);
  const jarSha256 = await sha256File(jarPath);
  assert(jarSha256 === EXPECTED_FFDEC_JAR_SHA256, `FFDec jar hash changed: expected ${EXPECTED_FFDEC_JAR_SHA256}, observed ${jarSha256}`);
  return {
    command: ffdecArgument,
    launcherPath,
    version,
    jarPath,
    jarSha256,
  };
}

async function inspectSwfmill(swfmillArgument) {
  const commandPath = findOnPath(swfmillArgument);
  assert(commandPath, `swfmill executable not found: ${swfmillArgument}`);
  const executablePath = await realpath(commandPath);
  const {stdout, stderr} = await run(commandPath, ["--version"], {timeoutMs: 30_000});
  const version = (stdout || stderr).split(/\r?\n/).find((line) => line.startsWith("swfmill "));
  assert(version === EXPECTED_SWFMILL_VERSION, `swfmill version changed: expected ${EXPECTED_SWFMILL_VERSION}, observed ${version || "unknown"}`);
  const executableSha256 = await sha256File(executablePath);
  assert(executableSha256 === EXPECTED_SWFMILL_SHA256, `swfmill hash changed: expected ${EXPECTED_SWFMILL_SHA256}, observed ${executableSha256}`);
  return {command: swfmillArgument, executablePath, executableSha256, version};
}

export function parseSwfmillPlacementProof(xmlRaw) {
  const lines = xmlRaw.toString("utf8").replace(/\r\n?/g, "\n").split("\n");
  const timelineStack = [];
  let rootFrame = 1;
  const definitions = [];
  const placements = [];
  for (let index = 0; index < lines.length; index += 1) {
    const sourceLine = lines[index];
    const trimmed = sourceLine.trim();
    const definition = trimmed.match(/^<DefineSprite objectID="(\d+)" frames="(\d+)">$/);
    if (definition) {
      const record = {objectId: Number(definition[1]), frameCount: Number(definition[2]), line: index + 1, sourceLine: trimmed};
      definitions.push(record);
      timelineStack.push({timelineId: `sprite-${record.objectId}`, frame: 1});
    }
    if (trimmed.startsWith("<PlaceObject2 ")) {
      const attributes = Object.fromEntries([...trimmed.matchAll(/([A-Za-z0-9_]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]));
      if (!attributes.depth || !attributes.objectID) continue;
      const context = timelineStack.at(-1);
      placements.push({
        timelineId: context?.timelineId || "root",
        frame: context?.frame || rootFrame,
        depth: Number(attributes.depth),
        objectId: Number(attributes.objectID),
        instanceName: attributes.name || null,
        line: index + 1,
        sourceLine: trimmed,
      });
    }
    if (trimmed === "<ShowFrame/>") {
      if (timelineStack.length) timelineStack.at(-1).frame += 1;
      else rootFrame += 1;
    }
    if (trimmed === "</DefineSprite>") timelineStack.pop();
  }
  const sprite696 = definitions.find(({objectId}) => objectId === 696);
  const sprite697 = definitions.find(({objectId}) => objectId === 697);
  const glossaryPlacement = placements.find(({timelineId, objectId, instanceName}) => timelineId === "root" && objectId === 697 && instanceName === "glossary");
  const keytermsPlacement = placements.find(({timelineId, objectId, instanceName}) => timelineId === "sprite-697" && objectId === 696 && instanceName === "keyterms");
  assert(sprite696?.frameCount === 1, "swfmill structure no longer defines sprite 696 as one frame");
  assert(sprite697?.frameCount === 1, "swfmill structure no longer defines sprite 697 as one frame");
  assert(glossaryPlacement?.frame === 50 && glossaryPlacement.depth === 82, "root frame 50 glossary placement changed");
  assert(keytermsPlacement?.frame === 1 && keytermsPlacement.depth === 1, "sprite 697 keyterms placement changed");
  return {definitions: [sprite696, sprite697], placements: [glossaryPlacement, keytermsPlacement]};
}

async function buildSwfmillPlacementProof({root, swfmill, originalHost}) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-rw002-host-structure-"));
  assert(path.dirname(temporaryRoot) === path.resolve(os.tmpdir()), `unsafe temporary structure path: ${temporaryRoot}`);
  const xmlPath = path.join(temporaryRoot, "index_local.xml");
  try {
    await run(swfmill.executablePath, ["-n", "swf2xml", path.join(root, originalHost.path), xmlPath]);
    const xmlRaw = await readFile(xmlPath);
    const structuralChain = parseSwfmillPlacementProof(xmlRaw);
    return {
      schemaVersion: 1,
      artifactType: "help-math-original-host-structural-placement-proof",
      animationId: ANIMATION_ID,
      sourceHost: originalHost,
      tool: {
        version: swfmill.version,
        executablePath: swfmill.executablePath,
        executableSha256: swfmill.executableSha256,
        command: ["swfmill", "-n", "swf2xml", originalHost.path, "<temporary-xml>"],
      },
      transientXml: {
        retained: false,
        bytes: xmlRaw.length,
        sha256: sha256Buffer(xmlRaw),
        rationale: "The complete deterministic XML is reproducible with --check; this durable proof retains the exact selected structural lines instead of an 8.3 MB derivative.",
      },
      structuralChain,
      finding: "Root frame 50 places sprite 697 as glossary; sprite 697 frame 1 places sprite 696 as keyterms; sprite 696 frame 1 ActionScript therefore enters the automatic doInitKeyTerms call chain.",
      runtimeQualification: "Static placement proves reachability and the request chain, not XML parse success or exact within-frame runtime ordering; the execution log must record the observed load result.",
    };
  } finally {
    await rm(temporaryRoot, {recursive: true, force: false});
  }
}

async function inspectBoundSource(root, bindingKey) {
  const binding = SOURCE_BINDINGS[bindingKey];
  const absolute = path.join(root, binding.relativePath);
  const sourceStat = await stat(absolute);
  assert(sourceStat.isFile(), `${binding.relativePath} is not a regular file`);
  const observedSha256 = await sha256File(absolute);
  assert(observedSha256 === binding.expectedSha256, `${binding.relativePath} hash changed: expected ${binding.expectedSha256}, observed ${observedSha256}`);
  return {
    path: binding.relativePath,
    sha256: observedSha256,
    bytes: sourceStat.size,
    role: binding.role,
  };
}

async function exportScripts({root, ffdec}) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-rw002-original-host-"));
  assert(path.dirname(temporaryRoot) === path.resolve(os.tmpdir()), `unsafe temporary export path: ${temporaryRoot}`);
  const sourceHost = path.join(root, SOURCE_BINDINGS.originalHost.relativePath);
  try {
    await run(ffdec.launcherPath, ["-onerror", "abort", "-export", "script", temporaryRoot, sourceHost]);
    const scriptsRoot = path.join(temporaryRoot, "scripts");
    const files = await listFilesRecursively(scriptsRoot);
    const records = [];
    for (const file of files) {
      const raw = await readFile(file.absolute);
      records.push({relativePath: file.relativePath, raw, bytes: raw.length, sha256: sha256Buffer(raw)});
    }
    const selectedByPath = new Map(records.map((record) => [record.relativePath, record]));
    const selected = SELECTED_FFDEC_SCRIPTS.map((definition) => {
      const record = selectedByPath.get(definition.relativePath);
      assert(record, `FFDec did not export required script ${definition.relativePath}`);
      return {...record, roles: definition.roles};
    });
    const fullIndex = records.map(({relativePath, bytes, sha256}) => ({path: relativePath, bytes, sha256}));
    return {
      records,
      selected,
      fullExportFileCount: records.length,
      fullExportIndexSha256: sha256Text(stableJson(fullIndex)),
    };
  } finally {
    await rm(temporaryRoot, {recursive: true, force: false});
  }
}

async function exportChildEntryScript({root, ffdec, source, artifactNamespace, expectedScriptCount}) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), `help-math-rw002-${artifactNamespace}-`));
  assert(path.dirname(temporaryRoot) === path.resolve(os.tmpdir()), `unsafe temporary child export path: ${temporaryRoot}`);
  try {
    await run(ffdec.launcherPath, ["-onerror", "abort", "-export", "script", temporaryRoot, path.join(root, source.path)]);
    const scriptsRoot = path.join(temporaryRoot, "scripts");
    const files = await listFilesRecursively(scriptsRoot);
    const records = [];
    for (const file of files) {
      const raw = await readFile(file.absolute);
      records.push({relativePath: file.relativePath, raw, bytes: raw.length, sha256: sha256Buffer(raw)});
    }
    assert(records.length === expectedScriptCount,
      `${artifactNamespace} FFDec script count changed: expected ${expectedScriptCount}, observed ${records.length}`);
    const sideEffects = classifySideEffects(records);
    assert(sideEffects.length === 0, `${artifactNamespace} now contains external/dynamic load operations: ${JSON.stringify(sideEffects)}`);
    const rootEntry = records.find(({relativePath}) => relativePath === "frame_1/DoAction.as");
    assert(rootEntry, `${artifactNamespace} root frame 1 script is missing`);
    assert(rootEntry.sha256 === "af7188282949f2613421ba9c8be629f489bbe2ee1e370a072024794b2d2cfc19",
      `${artifactNamespace} root frame 1 script hash changed: ${rootEntry.sha256}`);
    const fullIndex = records.map(({relativePath, bytes, sha256}) => ({path: relativePath, bytes, sha256}));
    return {
      artifactNamespace,
      scriptCount: records.length,
      fullExportIndexSha256: sha256Text(stableJson(fullIndex)),
      externalOrDynamicLoadFindingCount: sideEffects.length,
      rootEntry: {
        ...rootEntry,
        outputRelativePath: `${ffdecArtifactsRelative}/${artifactNamespace}/frame_1/DoAction.as`,
      },
    };
  } finally {
    await rm(temporaryRoot, {recursive: true, force: false});
  }
}

async function inspectDirectorySize(directory) {
  const files = await listFilesRecursively(directory);
  let bytes = 0;
  for (const file of files) bytes += (await stat(file.absolute)).size;
  return {fileCount: files.length, bytes};
}

function assertExpectedSideEffects(findings) {
  const counts = Object.fromEntries(Object.keys(EXPECTED_SIDE_EFFECT_COUNTS).map((api) => [api, 0]));
  for (const finding of findings) counts[finding.api] += 1;
  for (const [api, expected] of Object.entries(EXPECTED_SIDE_EFFECT_COUNTS)) {
    assert(counts[api] === expected, `${api} source finding count changed: expected ${expected}, observed ${counts[api]}`);
  }
  return counts;
}

function sourceEvidence(excerpts, ...excerptIds) {
  const byId = new Map(excerpts.map((excerpt) => [excerpt.excerptId, excerpt]));
  return excerptIds.map((excerptId) => {
    const excerpt = byId.get(excerptId);
    assert(excerpt, `missing excerpt ${excerptId}`);
    return excerpt;
  });
}

async function createDesiredOutputs({root, ffdecArgument, swfmillArgument}) {
  const scriptSource = await readFile(scriptPath);
  const generatedBy = {
    path: portable(path.relative(root, scriptPath)),
    sha256: sha256Buffer(scriptSource),
  };
  const ffdec = await inspectFfdec(ffdecArgument);
  const swfmill = await inspectSwfmill(swfmillArgument);
  const [originalHost, initialChild, targetChild, spanishAudio, lessonXml, englishKeytermsXml, spanishKeytermsXml] = await Promise.all([
    inspectBoundSource(root, "originalHost"),
    inspectBoundSource(root, "initialChild"),
    inspectBoundSource(root, "targetChild"),
    inspectBoundSource(root, "spanishAudio"),
    inspectBoundSource(root, "lessonXml"),
    inspectBoundSource(root, "englishKeytermsXml"),
    inspectBoundSource(root, "spanishKeytermsXml"),
  ]);
  const hostRaw = await readFile(path.join(root, originalHost.path));
  const header = parseSwfHeader(hostRaw);
  assert(header.signature === "CWS", `expected zlib-compressed host, observed ${header.signature}`);
  assert(header.swfVersion === 6, `expected SWF version 6, observed ${header.swfVersion}`);
  assert(header.declaredUncompressedBytes === 950711, `expected declared length 950711, observed ${header.declaredUncompressedBytes}`);
  assert(header.nativeStage.width === 800 && header.nativeStage.height === 600, `unexpected host stage ${header.nativeStage.width}x${header.nativeStage.height}`);
  assert(header.fps === 12 && header.rootFrameCount === 50, `unexpected host timeline ${header.fps}fps/${header.rootFrameCount} frames`);

  const lessonTreeSize = await inspectDirectorySize(path.join(root, lessonRootRelative));
  assert(lessonTreeSize.fileCount === 351 && lessonTreeSize.bytes === 204630573,
    `L13 source-tree size changed: expected 351/204630573, observed ${lessonTreeSize.fileCount}/${lessonTreeSize.bytes}`);
  const placementProof = await buildSwfmillPlacementProof({root, swfmill, originalHost});
  const exported = await exportScripts({root, ffdec});
  assert(exported.fullExportFileCount === 570, `FFDec script count changed: expected 570, observed ${exported.fullExportFileCount}`);
  const [initialChildScripts, targetChildScripts] = await Promise.all([
    exportChildEntryScript({root, ffdec, source: initialChild, artifactNamespace: "initial-child", expectedScriptCount: 9}),
    exportChildEntryScript({root, ffdec, source: targetChild, artifactNamespace: "target-child", expectedScriptCount: 6}),
  ]);
  const selectedByPath = new Map(exported.selected.map((record) => [record.relativePath, record]));
  const excerpts = EXCERPT_DEFINITIONS.map((definition) => extractLineExcerpt(selectedByPath.get(definition.script).raw, definition));
  const childEntryExcerpts = [initialChildScripts, targetChildScripts].map((child) => extractLineExcerpt(child.rootEntry.raw, {
    excerptId: `${child.artifactNamespace}-internal-preloader-activation`,
    script: `${child.artifactNamespace}/frame_1/DoAction.as`,
    lineStart: 1,
    lineEnd: 2,
    mustContain: ['_level0.InternalPreloader.gotoAndPlay("jump_check")', "stop()"],
  }));
  const sideEffectFindings = classifySideEffects(exported.records);
  const sideEffectCounts = assertExpectedSideEffects(sideEffectFindings);

  const ffdecArtifacts = exported.selected.map(({relativePath, roles, bytes, sha256}) => ({
    path: `${ffdecArtifactsRelative}/${relativePath}`,
    sha256,
    bytes,
    roles,
    bytePreservation: "raw-FFDec-output-including-CRLF",
  })).concat([initialChildScripts, targetChildScripts].map((child) => ({
    path: child.rootEntry.outputRelativePath,
    sha256: child.rootEntry.sha256,
    bytes: child.rootEntry.bytes,
    roles: ["child-internal-preloader-activation"],
    bytePreservation: "raw-FFDec-output-including-CRLF",
  })));
  const placementProofReport = {...placementProof, generatedBy};
  const placementProofBuffer = Buffer.from(stableJson(placementProofReport), "utf8");
  const placementProofBinding = {
    path: `${auditRelative}/original-host-placement-proof.json`,
    sha256: sha256Buffer(placementProofBuffer),
  };

  const entryContract = {
    schemaVersion: 1,
    artifactType: "help-math-original-host-entry-contract",
    animationId: ANIMATION_ID,
    scope: "read-only-source-derived-original-host-entry-and-audio-control-contract",
    generatedBy,
    sourceHost: {...originalHost, header},
    targetChild,
    toolchain: {
      ffdec: {
        version: ffdec.version,
        launcherPath: ffdec.launcherPath,
        jarPath: ffdec.jarPath,
        jarSha256: ffdec.jarSha256,
        exportCommand: ["ffdec", "-onerror", "abort", "-export", "script", "<temporary-directory>", originalHost.path],
      },
      swfmill: {
        version: swfmill.version,
        executablePath: swfmill.executablePath,
        executableSha256: swfmill.executableSha256,
        structuralProof: placementProofBinding,
      },
    },
    extractedScripts: {
      fullExportFileCount: exported.fullExportFileCount,
      fullExportIndexHashMode: "stable-json-array-of-path-bytes-sha256-v1",
      fullExportIndexSha256: exported.fullExportIndexSha256,
      selectedArtifactCount: ffdecArtifacts.length,
      selectedArtifacts: ffdecArtifacts,
      childDependencyScans: [initialChildScripts, targetChildScripts].map((child) => ({
        artifactNamespace: child.artifactNamespace,
        scriptCount: child.scriptCount,
        fullExportIndexSha256: child.fullExportIndexSha256,
        externalOrDynamicLoadFindingCount: child.externalOrDynamicLoadFindingCount,
        rootEntryArtifact: child.rootEntry.outputRelativePath,
        rootEntrySha256: child.rootEntry.sha256,
      })),
    },
    contracts: {
      childLoad: {
        status: "source-proven",
        behavior: "The original host unloads animation_mc, then calls animation_mc.loadMovie with _global.playSwfFileName and the source's literal second argument 1.",
        evidence: sourceEvidence(excerpts, "host-child-load-setup", "host-child-load-call"),
      },
      internalPreloaderEntryHandoff: {
        status: "source-proven",
        hostSymbol: "DefineSprite 179 (InternalPreloader)",
        behavior: "Both the clean-start IR child and the RW02 target stop on child root frame 1 after sending InternalPreloader to jump_check. After the child reports complete bytes, both host completion branches stop the preloader and call _root.animation_mc.gotoAndPlay(\"begin\").",
        expectedTargetRootFrame: 6,
        targetLabel: "begin",
        evidence: [...childEntryExcerpts, ...sourceEvidence(excerpts, "internal-preloader-frame-2-begin-handoff", "internal-preloader-frame-3-begin-handoff")],
      },
      defaultStartup: {
        status: "source-proven",
        behavior: "With no accepted bookmark, the shell selects section 1 / slide index 2, derives IR/L13RW01.swf, and loads it before target navigation.",
        evidence: sourceEvidence(excerpts, "default-startup-child-selection", "default-startup-child-load", "lesson-root-url-derivation"),
      },
      targetNavigationInventory: {
        status: "source-proven-clean-start-next-control-runtime-navigation-still-to-be-executed",
        behavior: "The embedded map names RW/L13RW02.swf as the first Real World page. From the lone IR page, the source Next control increments beyond section 1, sets section 2 / slide index 2, derives RW/L13RW02.swf, and calls loadSWFMovie.",
        evidence: sourceEvidence(excerpts, "embedded-lesson-map", "target-navigation-next-button", "target-navigation-ir-to-rw02"),
      },
      spanishAudioStopResume: {
        status: "source-proven-control-flow-runtime-listening-still-pending",
        behavior: "The source play control stops the child animation, derives SA/<loaded-page-basename>.mp3, streams it, then resumes only when the child is nonterminal and quizSection is false; both natural completion and manual stop use that guard.",
        expectedResolvedTrack: spanishAudio,
        evidence: sourceEvidence(excerpts, "spanish-audio-play-button", "spanish-audio-stop-load-and-completion-resume", "spanish-audio-start", "spanish-audio-stop-button", "spanish-audio-manual-stop-resume"),
      },
      automaticEnglishKeytermRead: {
        status: "source-proven-request-chain-runtime-load-and-parse-result-pending",
        behavior: "At root frame 50, the host places glossary sprite 697, whose frame 1 places keyterms sprite 696. Sprite 696 immediately calls doInitKeyTerms, resolves the English ELKTEG4.xml path, and dispatches XML.load even though frame 50 later hides the glossary.",
        expectedResolvedFile: englishKeytermsXml,
        structuralPlacementProof: placementProofBinding,
        evidence: sourceEvidence(excerpts, "lesson-root-url-derivation", "keyterms-instance-auto-init", "keyterms-english-path-and-load-dispatch", "keyterms-xml-load", "default-startup-child-load"),
        runtimeRequirement: "Record the attempted resolved path plus onLoad success/failure and parse result; static reachability does not prove successful runtime parsing.",
      },
    },
    authority: {
      sourceDerivationComplete: true,
      originalRuntimeExecutedByThisArtifact: false,
      naturalTraceFramesCapturedByThisArtifact: 0,
      audioListeningPerformedByThisArtifact: false,
      baselineAuthorityClaimed: false,
      strictAcceptanceEffect: "none-until-hash-bound-original-runtime-execution-evidence-validates-this-contract",
    },
    limitations: [
      "FFDec decompilation is hash-bound forensic evidence for compiled control flow; it is not a runtime execution log.",
      "The target-navigation click path, 1,873-frame natural trace, Spanish listening, pause/resume timing, and terminal behavior remain subject to authoritative original-runtime execution.",
      "The automatic ELKTEG4.xml request is structurally proven, but its runtime load/parse outcome remains unobserved.",
      "This report does not alter trace specifications, generate a trace candidate, change migration status, or grant human/owner acceptance.",
    ],
  };

  const minimalTree = {
    schemaVersion: 1,
    artifactType: "help-math-original-host-minimal-lesson-tree-manifest",
    animationId: ANIMATION_ID,
    generatedBy,
    selectionPolicy: {
      scopedOperation: "launch-unmodified-index_local-host-enter-default-startup-then-navigate-to-RW-L13RW02-and-optionally-exercise-Spanish-audio",
      failClosed: true,
      sourceTreeCopiedByThisGenerator: false,
      rationale: "Only byte-preserved source files proven necessary by the scoped original-host path are allowlisted; the remaining lesson tree is neither copied nor inferred as necessary.",
    },
    requiredFiles: [
      {...originalHost, requirement: "always-required", proof: "operator launches this original host"},
      {...initialChild, requirement: "always-required-for-clean-default-entry", proof: "frame 49 selects IR slide index 2 and frame 50 calls loadSWFMovie"},
      {...targetChild, requirement: "always-required", proof: "embedded Real World lesson map names L13RW02.swf"},
      {...spanishAudio, requirement: "required-for-spanish-audio-traversal", proof: "doPlaySpanishAudio derives SA/<current basename>.mp3"},
      {...englishKeytermsXml, requirement: "automatic-ancillary-read", proof: "root frame 50 placement enters sprite 696 doInitKeyTerms → C_L → doCreateGlossaryWord → XML.load"},
    ],
    requiredFileCount: 5,
    requiredTotalBytes: originalHost.bytes + initialChild.bytes + targetChild.bytes + spanishAudio.bytes + englishKeytermsXml.bytes,
    archiveRoot: "source-assets/flash/HELP MATH_ORIGINAL FILES",
    expectedRelativeLayoutFromArchiveRoot: [
      "HELP_COURSES/ELMGR5/L13/index_local.swf",
      "HELP_COURSES/ELMGR5/L13/IR/L13RW01.swf",
      "HELP_COURSES/ELMGR5/L13/RW/L13RW02.swf",
      "HELP_COURSES/ELMGR5/L13/SA/L13RW02.mp3",
      "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml",
    ],
    originalLessonTreeComparison: {
      lessonRoot: lessonRootRelative,
      lessonFileCount: lessonTreeSize.fileCount,
      lessonBytes: lessonTreeSize.bytes,
      requiredLessonFileCount: 4,
      requiredUnionBytesIncludingExternalEnglishKeytermsXml: originalHost.bytes + initialChild.bytes + targetChild.bytes + spanishAudio.bytes + englishKeytermsXml.bytes,
      requiredUnionAsPercentOfLessonBytes: Number((((originalHost.bytes + initialChild.bytes + targetChild.bytes + spanishAudio.bytes + englishKeytermsXml.bytes) / lessonTreeSize.bytes) * 100).toFixed(6)),
    },
    structuralPlacementProof: placementProofBinding,
    pathDerivationEvidence: sourceEvidence(excerpts, "default-startup-child-selection", "default-startup-child-load", "embedded-lesson-map", "target-navigation-next-button", "target-navigation-ir-to-rw02", "lesson-root-url-derivation", "spanish-audio-stop-load-and-completion-resume", "keyterms-instance-auto-init", "keyterms-english-path-and-load-dispatch", "keyterms-xml-load"),
    explicitlyExcludedFromScopedRuntimeTree: [
      {
        ...lessonXml,
        disposition: "not-required-for-this-scoped-host-entry",
        rationale: "The compiled host contains LessonDetails and parses that embedded string; the scoped path does not execute an index.xml load.",
      },
      {
        pathPattern: `${lessonRootRelative}/**/*.fla`,
        disposition: "authoring-evidence-not-runtime-input",
      },
      {
        pathPattern: `${lessonRootRelative}/{RW,VB,IN,TI,GS,TS,FQ,RE}/** except RW/L13RW02.swf`,
        disposition: "not-traversed-by-scoped-entry",
      },
      {
        ...spanishKeytermsXml,
        disposition: "conditional-glossary-spanish-switch-only",
        rationale: "The Spanish narration control only calls doPlaySpanishAudio. ELKTSG4.xml is selected solely by the separate glossary BtnSpan → doSwitchSpanGloss path.",
        evidence: sourceEvidence(excerpts, "conditional-spanish-glossary-button", "conditional-spanish-glossary-path", "spanish-audio-play-button"),
      },
      {
        pathPattern: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/DIG/**",
        disposition: "conditional-term-selection-dependency-not-traversed-and-not-allowlisted",
        operatorConstraint: "Do not open or select glossary/keyterm controls during this scoped capture.",
      },
    ],
    validation: {
      allRequiredFilesExist: true,
      allRequiredHashesMatch: true,
      layoutDerivedFromSourceScripts: true,
      wholeLessonTreeRequired: false,
      automaticKeytermRequestRuntimeResultPending: true,
    },
    minimalityConditions: [
      "Use a fresh ephemeral Flash profile with no incoming bookmark or FlashVars; the bookmark branch otherwise stops before default navigation.",
      "Do not reuse the user's SharedObject state; isolate cookiename reads/writes to the ephemeral runtime profile.",
      "Leave Report_URL and QuizReport_URL unset and deny all reporting/network calls.",
      "Do not open or interact with glossary controls; the automatic English XML request still occurs and must be logged.",
      "End the scoped trace at RW02 local frame 1873; do not press Next into RW03/RW04.",
      "The Spanish trace specification does not itself schedule the host Spanish-audio button; presence of the MP3 in this tree is not proof that narration was executed or heard.",
    ],
  };

  const sideEffectDenyList = {
    schemaVersion: 1,
    artifactType: "help-math-original-host-side-effect-deny-list",
    animationId: ANIMATION_ID,
    generatedBy,
    scope: "original-host-capture-sandbox-and-operator-policy",
    defaultPolicy: "deny-all-external-effects-and-dynamic-loads-except-hash-bound-local-read-allowlist",
    deniedCapabilities: [
      {capability: "network", covers: ["getURL", "loadVariablesNum", "remote XML.load", "remote MovieClip.loadMovie", "remote Sound.loadSound"]},
      {capability: "javascript-or-browser-navigation", covers: ["javascript: getURL", "window.open", "parent.close"]},
      {capability: "persistent-or-user-profile-storage", covers: ["SharedObject reads/writes outside the isolated ephemeral capture profile", "SharedObject state reuse across sessions", "writes outside an isolated ephemeral runtime directory"]},
      {capability: "process-and-window-control", covers: ["fscommand quit", "fullscreen", "allowscale", "showmenu", "trapallkeys"]},
      {capability: "apple-events-launch-services-and-child-processes", covers: ["defense-in-depth sandbox boundary"]},
      {capability: "unmanifested-local-file-read", covers: ["keyterm XML", "keyterm diagram SWFs", "FScrollPane dynamic URL"]},
    ],
    localReadAllowlist: [originalHost, initialChild, targetChild, spanishAudio, englishKeytermsXml],
    sourceFindings: {
      inspectedFfdecScriptCount: exported.fullExportFileCount,
      fullExportIndexSha256: exported.fullExportIndexSha256,
      counts: sideEffectCounts,
      findings: sideEffectFindings,
    },
    operatorConstraints: [
      "Use a sandbox that denies network, Apple Events, LaunchServices open/database changes, child processes, and persistent writes.",
      "Permit SharedObject only inside a new isolated ephemeral capture profile, verify that no incoming cookiename state exists, and never reuse that profile between traces.",
      "Do not activate Close, Help, hyperlink, reporting, final-quiz submission, glossary, or keyterm controls; permit and log only the automatic ELKTEG4.xml read.",
      "Permit dynamic movie/audio reads only when the resolved local path and SHA-256 match the minimal-tree allowlist.",
      "Treat any unallowlisted load attempt, network attempt, unexpected process/window action, or persistent write as a failed capture.",
      "Record denied attempts and unexpected events in the original-runtime execution report; do not silently suppress them from evidence.",
    ],
    authority: {
      sideEffectsExecutedByThisArtifact: false,
      sandboxEnforcedByThisArtifact: false,
      strictAcceptanceEffect: "none-policy-input-for-future-authoritative-execution",
    },
  };

  const outputs = new Map();
  for (const record of exported.selected) {
    outputs.set(`${ffdecArtifactsRelative}/${record.relativePath}`, record.raw);
  }
  outputs.set(initialChildScripts.rootEntry.outputRelativePath, initialChildScripts.rootEntry.raw);
  outputs.set(targetChildScripts.rootEntry.outputRelativePath, targetChildScripts.rootEntry.raw);
  outputs.set(`${auditRelative}/original-host-entry-contract.json`, Buffer.from(stableJson(entryContract), "utf8"));
  outputs.set(`${auditRelative}/original-host-minimal-tree.json`, Buffer.from(stableJson(minimalTree), "utf8"));
  outputs.set(`${auditRelative}/original-host-side-effect-deny-list.json`, Buffer.from(stableJson(sideEffectDenyList), "utf8"));
  outputs.set(`${auditRelative}/original-host-placement-proof.json`, placementProofBuffer);
  return outputs;
}

async function compareOrWriteOutputs({root, outputs, check}) {
  const mismatches = [];
  for (const [relativePath, desired] of outputs) {
    const absolute = path.join(root, relativePath);
    if (check) {
      if (!await exists(absolute)) {
        mismatches.push(`${relativePath}: missing`);
        continue;
      }
      const observed = await readFile(absolute);
      if (!observed.equals(desired)) {
        mismatches.push(`${relativePath}: expected ${sha256Buffer(desired)}, observed ${sha256Buffer(observed)}`);
      }
    } else {
      await mkdir(path.dirname(absolute), {recursive: true});
      await writeFile(absolute, desired);
    }
  }
  if (check && mismatches.length) {
    throw new Error(`RW002 original-host entry evidence is stale:\n${mismatches.map((item) => `- ${item}`).join("\n")}`);
  }
  return {checked: check, fileCount: outputs.size};
}

export async function buildRw002OriginalHostEntryContract({root = projectRoot, ffdec = "ffdec", swfmill = "swfmill", check = false} = {}) {
  const outputs = await createDesiredOutputs({root, ffdecArgument: ffdec, swfmillArgument: swfmill});
  return compareOrWriteOutputs({root, outputs, check});
}

function helpText() {
  return `Usage: node scripts/build-rw002-original-host-entry-contract.mjs [options]\n\nOptions:\n  --check                Re-extract and verify every checked-in report/artifact without writing\n  --ffdec <command>      FFDec 26.2.1 launcher (default: ffdec)\n  --swfmill <command>    swfmill 0.3.6 launcher (default: swfmill)\n  --root <directory>     Project root (default: repository root)\n  -h, --help             Show this help\n`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(helpText());
    return;
  }
  const result = await buildRw002OriginalHostEntryContract(options);
  process.stdout.write(`${options.check ? "Verified" : "Generated"} ${result.fileCount} RW002 original-host entry evidence files.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
