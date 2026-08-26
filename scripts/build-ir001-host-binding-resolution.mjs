#!/usr/bin/env node

import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {createReadStream, statSync} from "node:fs";
import {
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

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const IR001 = Object.freeze({
  animationId: "course-g04-l01-ir-001",
  migrationRoot: "migrations/course-g04-l01-ir-001",
  output: "migrations/course-g04-l01-ir-001/audit/host-binding-resolution.json",
  childSwf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/IR/L1RW01.swf",
  childSwfSha256: "b21b16d1e5756820b5703136708f625dcc3a324d629b2337b1dc42af64559e46",
  pairedFla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/IR/L1RW01.fla",
  pairedFlaSha256: "c4ba5fd0b37b1a1ad622f4fdf89295a6b76c820588a8000b239b0f4d68984fb9",
  shellSwf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/index_local.swf",
  shellSwfSha256: "ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e",
  savedFfdec: "migrations/course-g04-l01-ir-001/audit/machine/ffdec-scripts.txt.gz",
  savedFfdecSha256: "0cacaa6ea5de3d6b08015d04c06c4aa23aa42f54ed8d58f0c62059268b6ad723",
  savedFfdecContentSha256: "2a69507ec8f16fe0fff7d64b460a41fe5850b196ee8e329080bb7f8f76c67b9e",
  savedSwfmill: "migrations/course-g04-l01-ir-001/audit/machine/swfmill.xml.gz",
  savedSwfmillSha256: "1fcd12a83f15f09becb8f12be8007f42e11953990c89297dc9d74e90963ea173",
  savedSwfmillContentSha256: "399ed473ccd73100f21254d77a2b5c81bc844353077c8cf8206edd80f7504ec6",
  authoringAudit: "migrations/course-g04-l01-ir-001/audit/adobe-animate-2021-authoring-audit.json",
  authoringAuditSha256: "27de76cabebadbf1dd58dc9562c15b4786c93ffb5cc7be350aadaa07dc5241d7",
});

const EXPECTED_FFDEC_VERSION = "JPEXS Free Flash Decompiler v.26.2.1";
const EXPECTED_FFDEC_JAR_SHA256 = "090ab695053ad94cba6408574c7d7eea20ec60b6ae789ee6056a23f45106762f";
const EXPECTED_SWFMILL_VERSION = "swfmill 0.3.6";
const EXPECTED_SWFMILL_SHA256 = "b1299adad7f32d8e489574539e79b0f42c4960148170bc1ca48736e07ccbd311";

const REQUIRED_CHILD_SCRIPTS = Object.freeze([
  "frame_1/DoAction.as",
  "DefineSprite_58/frame_1/DoAction.as",
  "DefineSprite_58/frame_5/DoAction.as",
  "FScrollBarSymbol.as",
  "FUIComponentSymbol.as",
]);

const EXPECTED_BODY_SHA256 = Object.freeze({
  "DefineSprite_58/frame_1/DoAction.as": "534196db1b9352db95897e78166465293f70844f5b18292d5da450cfeb3e9cbe",
  "DefineSprite_58/frame_5/DoAction.as": "4b2a8ea86d7a09876c10ea6d2e0abd838f294518275642d3c7f68c2257c8f16e",
  "FScrollBarSymbol.as": "cea42171056b8a7fbd274041fdc51c6c3021465fe247911f9ede21695b61bdb2",
  "FUIComponentSymbol.as": "47897188622e3ec0d4584baca8b36c0c15c2735295d2127392dcc3263946cd64",
});

const SHELL_SCRIPTS = Object.freeze([
  Object.freeze({
    role: "preloader-jump-check-load-progress",
    path: "DefineSprite_176/frame_11/PlaceObject2_174_2/CLIPACTIONRECORD onClipEvent(enterFrame).as",
    mustContain: Object.freeze([
      "_root.animation_mc.getBytesLoaded()",
      "_root.animation_mc.getBytesTotal()",
      '_root.InternalPreloader.gotoAndPlay("done")',
    ]),
  }),
  Object.freeze({
    role: "preloader-done-entry-handoff",
    path: "DefineSprite_176/frame_20/DoAction.as",
    mustContain: Object.freeze([
      "_parent.animation_mc._framesloaded",
      "_parent.animation_mc._totalframes",
      '_parent.animation_mc.gotoAndPlay("begin")',
      '_root.InternalPreloader.gotoAndStop("inactive")',
      "_root.doCheckSpanishAudio()",
      'gotoAndStop("jump_check")',
    ]),
  }),
]);

const PYTHON_SWFMILL_EXTRACTOR = String.raw`
import json
import sys
import xml.etree.ElementTree as ET

source = sys.argv[1]

def local_name(tag):
    return tag.rsplit("}", 1)[-1]

def child_named(node, name):
    for child in list(node):
        if local_name(child.tag) == name:
            return child
    return None

tree = ET.parse(source)
root = tree.getroot()
header = next((item for item in root.iter() if local_name(item.tag) == "Header"), None)
if header is None:
    raise RuntimeError("swfmill XML has no Header")
root_tags = child_named(header, "tags")
if root_tags is None:
    raise RuntimeError("swfmill XML Header has no tags")

definitions = {}
exports = []
sprites = {}
init_actions = []
for node in list(root_tags):
    name = local_name(node.tag)
    object_id = node.attrib.get("objectID")
    if name == "DefineSprite" and object_id:
        definitions[object_id] = int(node.attrib.get("frames", "0"))
        sprites[object_id] = node
    elif name == "Export":
        for item in node.iter():
            if local_name(item.tag) == "Symbol":
                exports.append({"objectId": item.attrib.get("objectID"), "name": item.attrib.get("name", "")})
    elif name == "DoInitAction":
        init_actions.append(node.attrib.get("sprite"))

def inspect_timeline(timeline_id, object_id, tags_node, declared_frames):
    current_frame = 1
    labels = []
    placements = []
    for node in list(tags_node):
        name = local_name(node.tag)
        if name == "ShowFrame":
            current_frame += 1
        elif name == "FrameLabel":
            labels.append({"frame": current_frame, "label": node.attrib.get("label", "")})
        elif name in ("PlaceObject", "PlaceObject2", "PlaceObject3"):
            placements.append({
                "frame": current_frame,
                "tag": name,
                "objectId": node.attrib.get("objectID"),
                "depth": node.attrib.get("depth"),
                "name": node.attrib.get("name", ""),
            })
    return {
        "timelineId": timeline_id,
        "objectId": object_id,
        "declaredFrameCount": int(declared_frames),
        "observedShowFrameCount": current_frame - 1,
        "labels": labels,
        "placements": placements,
    }

timelines = [inspect_timeline("root", None, root_tags, header.attrib.get("frames", "0"))]
for object_id, node in sorted(sprites.items(), key=lambda pair: int(pair[0])):
    tags = child_named(node, "tags")
    if tags is not None:
        timelines.append(inspect_timeline("sprite-" + object_id, object_id, tags, node.attrib.get("frames", "0")))

print(json.dumps({
    "parser": "Python xml.etree.ElementTree over transient swfmill XML",
    "header": dict(header.attrib),
    "definitions": definitions,
    "exports": exports,
    "initActionSpriteIds": init_actions,
    "timelines": timelines,
}, sort_keys=True, separators=(",", ":")))
`;

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

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
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

function portable(value) {
  return value.split(path.sep).join("/");
}

function run(command, argumentList, {cwd = projectRoot, timeoutMs = 120_000} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argumentList, {
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
      // Keep looking for the explicitly selected executable.
    }
  }
  return null;
}

export function parseArguments(argumentList) {
  const options = {
    check: false,
    ffdec: "ffdec",
    swfmill: "swfmill",
    python: "python3",
    root: projectRoot,
  };
  for (let index = 0; index < argumentList.length; index += 1) {
    const value = argumentList[index];
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else if (["--ffdec", "--swfmill", "--python", "--root"].includes(value)) {
      const next = argumentList[index + 1];
      invariant(next, `${value} requires a value`);
      if (value === "--ffdec") options.ffdec = next;
      else if (value === "--swfmill") options.swfmill = next;
      else if (value === "--python") options.python = next;
      else options.root = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function normalizeBody(value) {
  return value.replace(/\r\n?/g, "\n").replace(/\n+$/g, "");
}

export function parseFfdecScriptBundle(value) {
  const text = value.toString("utf8").replace(/\r\n?/g, "\n");
  const lines = text.split("\n");
  const headings = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^===== (.+) =====$/);
    if (match) headings.push({index, script: match[1]});
  }
  invariant(headings.length > 0, "FFDec script bundle contains no script headings");
  const scripts = new Map();
  for (let position = 0; position < headings.length; position += 1) {
    const heading = headings[position];
    const end = (headings[position + 1]?.index ?? lines.length) - 1;
    const bodyLines = lines.slice(heading.index + 1, end + 1);
    while (bodyLines.at(-1) === "") bodyLines.pop();
    invariant(!scripts.has(heading.script), `duplicate FFDec script heading: ${heading.script}`);
    scripts.set(heading.script, bodyLines.join("\n"));
  }
  return scripts;
}

async function listFilesRecursively(root, current = root) {
  const entries = await readdir(current, {withFileTypes: true});
  const files = [];
  for (const entry of entries.sort((left, right) => compareText(left.name, right.name))) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await listFilesRecursively(root, absolute));
    else if (entry.isFile()) files.push({absolute, relative: portable(path.relative(root, absolute))});
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
  invariant(await exists(jarPath), `FFDec jar was not found next to launcher: ${jarPath}`);
  const jarSha256 = await sha256File(jarPath);
  invariant(jarSha256 === EXPECTED_FFDEC_JAR_SHA256,
    `FFDec jar hash changed: expected ${EXPECTED_FFDEC_JAR_SHA256}, observed ${jarSha256}`);
  return {launcherPath, version, jarSha256};
}

async function inspectSwfmill(swfmillArgument) {
  const commandPath = findOnPath(swfmillArgument);
  invariant(commandPath, `swfmill executable not found: ${swfmillArgument}`);
  const executablePath = await realpath(commandPath);
  const {stdout, stderr} = await run(commandPath, ["--version"], {timeoutMs: 30_000});
  const version = (stdout || stderr).split(/\r?\n/).find((line) => line.startsWith("swfmill "));
  invariant(version === EXPECTED_SWFMILL_VERSION,
    `swfmill version changed: expected ${EXPECTED_SWFMILL_VERSION}, observed ${version || "unknown"}`);
  const executableSha256 = await sha256File(executablePath);
  invariant(executableSha256 === EXPECTED_SWFMILL_SHA256,
    `swfmill hash changed: expected ${EXPECTED_SWFMILL_SHA256}, observed ${executableSha256}`);
  return {executablePath, version, executableSha256};
}

async function inspectPython(pythonArgument) {
  const commandPath = findOnPath(pythonArgument);
  invariant(commandPath, `Python executable not found: ${pythonArgument}`);
  const executablePath = await realpath(commandPath);
  const {stdout, stderr} = await run(commandPath, ["--version"], {timeoutMs: 30_000});
  const version = (stdout || stderr).trim();
  invariant(/^Python 3\./.test(version), `Python 3 is required; observed ${version || "unknown"}`);
  return {executablePath, version};
}

async function exportScripts({source, ffdec, prefix}) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), prefix));
  invariant(path.dirname(temporaryRoot) === path.resolve(os.tmpdir()), `unsafe FFDec temp root: ${temporaryRoot}`);
  try {
    await run(ffdec.launcherPath, ["-onerror", "abort", "-export", "script", temporaryRoot, source]);
    const scriptsRoot = path.join(temporaryRoot, "scripts");
    const files = await listFilesRecursively(scriptsRoot);
    const scripts = new Map();
    const index = [];
    for (const file of files) {
      const raw = await readFile(file.absolute);
      const body = normalizeBody(raw.toString("utf8"));
      scripts.set(file.relative, body);
      index.push({path: file.relative, bytes: raw.length, rawSha256: sha256(raw), bodySha256: sha256(body)});
    }
    return {
      scripts,
      fileCount: files.length,
      indexSha256: sha256(stableJson(index)),
    };
  } finally {
    await rm(temporaryRoot, {recursive: true, force: false});
  }
}

async function extractSwfmill({source, swfmill, python, prefix}) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), prefix));
  invariant(path.dirname(temporaryRoot) === path.resolve(os.tmpdir()), `unsafe swfmill temp root: ${temporaryRoot}`);
  const xmlPath = path.join(temporaryRoot, "source.xml");
  try {
    await run(swfmill.executablePath, ["-n", "swf2xml", source, xmlPath]);
    const raw = await readFile(xmlPath);
    const {stdout} = await run(python.executablePath, ["-c", PYTHON_SWFMILL_EXTRACTOR, xmlPath]);
    return {raw, facts: JSON.parse(stdout)};
  } finally {
    await rm(temporaryRoot, {recursive: true, force: false});
  }
}

function allLocations(scripts, pattern) {
  const locations = [];
  for (const [script, body] of [...scripts.entries()].sort(([left], [right]) => compareText(left, right))) {
    const lines = body.split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      pattern.lastIndex = 0;
      if (pattern.test(lines[index])) locations.push({script, line: index + 1, text: lines[index].trim()});
    }
  }
  return locations;
}

function exactScript(scripts, script) {
  invariant(scripts.has(script), `required FFDec script is absent: ${script}`);
  return scripts.get(script);
}

export function deriveChildBindingFacts(scripts) {
  for (const script of REQUIRED_CHILD_SCRIPTS) exactScript(scripts, script);
  for (const [script, expectedHash] of Object.entries(EXPECTED_BODY_SHA256)) {
    const observedHash = sha256(exactScript(scripts, script));
    invariant(observedHash === expectedHash,
      `${script} body changed: expected ${expectedHash}, observed ${observedHash}`);
  }

  const bareGlobal = allLocations(scripts, /\b_global\b(?!\s*\.)/g);
  const styleFormat = allLocations(scripts, /\b_global\.FStyleFormat\b/g);
  const randomSound = allLocations(scripts, /\b_global\.tempRandomSoundMc\b/g);
  const parent = allLocations(scripts, /\b_parent\b/g);
  const preloader = allLocations(scripts, /\b_level0\.InternalPreloader\b/g);

  invariant(bareGlobal.length === 1, `expected one bare _global reference; observed ${bareGlobal.length}`);
  invariant(bareGlobal[0].script === "FUIComponentSymbol.as"
    && bareGlobal[0].text === "var _loc3_ = _global;", "bare _global is no longer the embedded FUIComponent namespace alias");
  invariant(styleFormat.length === 2, `expected two _global.FStyleFormat references; observed ${styleFormat.length}`);
  invariant(styleFormat.every(({script}) => script === "FUIComponentSymbol.as"),
    "_global.FStyleFormat escaped the embedded FUIComponent bootstrap");
  invariant(styleFormat.some(({text}) => text === "_global.FStyleFormat = function()"),
    "FUIComponent no longer defines _global.FStyleFormat");
  invariant(styleFormat.some(({text}) => text === "_global.FStyleFormat.prototype = new Object();"),
    "FUIComponent no longer defines the FStyleFormat prototype");
  const fui = exactScript(scripts, "FUIComponentSymbol.as");
  invariant(fui.includes("_loc3_.globalStyleFormat == undefined")
    && fui.includes("_loc3_.globalStyleFormat = new FStyleFormat();"),
  "FUIComponent no longer lazily initializes globalStyleFormat");

  invariant(randomSound.length === 2, `expected two _global.tempRandomSoundMc references; observed ${randomSound.length}`);
  invariant(randomSound[0].script === "DefineSprite_58/frame_1/DoAction.as"
    && randomSound[0].text === '_global.tempRandomSoundMc = "Mc_Sound_" + tempNum;',
  "tempRandomSoundMc is not initialized by sprite 58 frame 1");
  invariant(randomSound[1].script === "DefineSprite_58/frame_5/DoAction.as"
    && randomSound[1].text === "eval(_global.tempRandomSoundMc).gotoAndPlay(2);",
  "tempRandomSoundMc is not consumed by sprite 58 frame 5");
  invariant(exactScript(scripts, "DefineSprite_58/frame_1/DoAction.as").includes("tempNum = random(2);"),
    "sprite 58 random(2) selector changed");

  invariant(parent.length === 2, `expected two intrinsic _parent references; observed ${parent.length}`);
  invariant(parent.some(({script, text}) => script === "FScrollBarSymbol.as"
    && text === "_loc1_.setScrollTarget(_loc1_._parent[_loc1_._targetInstanceName]);"),
  "FScrollBar display-list parent lookup changed");
  invariant(parent.some(({script, text}) => script === "FUIComponentSymbol.as"
    && text === "_loc1_.handlerObj = obj != undefined ? obj : _loc1_._parent;"),
  "FUIComponent handler parent default changed");

  invariant(preloader.length === 1, `expected one _level0.InternalPreloader reference; observed ${preloader.length}`);
  invariant(preloader[0].script === "frame_1/DoAction.as"
    && preloader[0].text === '_level0.InternalPreloader.gotoAndPlay("jump_check");',
  "root preloader request changed");
  invariant(exactScript(scripts, "frame_1/DoAction.as").trimEnd().endsWith("stop();"),
    "root frame 1 no longer stops after requesting the shell preloader");

  const scrollbar = exactScript(scripts, "FScrollBarSymbol.as");
  const attachTargets = [...scrollbar.matchAll(/attachMovie\("([^"]+)"/g)].map((match) => match[1]);
  invariant(JSON.stringify(attachTargets) === JSON.stringify(["ScrollThumb", "UpArrow", "DownArrow"]),
    `unexpected FScrollBar attachMovie targets: ${attachTargets.join(", ")}`);
  invariant(!/attachMovie\("(?:FScrollBarSymbol|FUIComponentSymbol)"/.test(scrollbar + "\n" + fui),
    "component linkage is now explicitly attached by component code");

  return {
    referenceCounts: {
      bareGlobal: bareGlobal.length,
      globalFStyleFormat: styleFormat.length,
      globalTempRandomSoundMc: randomSound.length,
      parent: parent.length,
      level0InternalPreloader: preloader.length,
    },
    locations: {bareGlobal, styleFormat, randomSound, parent, preloader},
    bodySha256: Object.fromEntries(Object.keys(EXPECTED_BODY_SHA256).map((script) => [script, sha256(scripts.get(script))])),
    componentAttachTargets: attachTargets,
  };
}

function timeline(facts, timelineId) {
  const matches = facts.timelines.filter((item) => item.timelineId === timelineId);
  invariant(matches.length === 1, `expected one ${timelineId} timeline; observed ${matches.length}`);
  return matches[0];
}

function exactItem(items, predicate, message) {
  const matches = items.filter(predicate);
  invariant(matches.length === 1, `${message}; observed ${matches.length}`);
  return matches[0];
}

export function deriveStructuralProof(child, shell) {
  invariant(child.header.frames === "10" && child.header.framerate === "12",
    `child header changed: ${JSON.stringify(child.header)}`);
  const childRoot = timeline(child, "root");
  invariant(childRoot.declaredFrameCount === 10 && childRoot.observedShowFrameCount === 10,
    "child root frame domain is not exactly 10 frames");
  exactItem(childRoot.labels, (item) => item.label === "begin" && item.frame === 6,
    "child begin label is not uniquely on frame 6");
  const entryPlacement = exactItem(childRoot.placements,
    (item) => item.name === "animation" && item.frame === 6 && item.objectId === "58" && item.depth === "1",
    "child animation entry placement is not uniquely object 58/depth 1/frame 6");
  const sprite58 = timeline(child, "sprite-58");
  invariant(sprite58.declaredFrameCount === 142 && sprite58.observedShowFrameCount === 142,
    "sprite 58 frame domain is not exactly 142 frames");
  const sound0 = exactItem(sprite58.placements,
    (item) => item.frame === 1 && item.name === "Mc_Sound_0" && item.objectId === "7" && item.depth === "234",
    "sprite 58 no longer places Mc_Sound_0/object 7/depth 234 on frame 1");
  const sound1 = exactItem(sprite58.placements,
    (item) => item.frame === 1 && item.name === "Mc_Sound_1" && item.objectId === "8" && item.depth === "236",
    "sprite 58 no longer places Mc_Sound_1/object 8/depth 236 on frame 1");
  invariant(child.definitions["1"] === 1 && child.definitions["5"] === 1,
    "embedded FUIComponent/FScrollBar timelines are no longer one-frame symbols");
  exactItem(child.exports, (item) => item.objectId === "1" && item.name === "FUIComponentSymbol",
    "FUIComponentSymbol export changed");
  exactItem(child.exports, (item) => item.objectId === "5" && item.name === "FScrollBarSymbol",
    "FScrollBarSymbol export changed");
  invariant(child.initActionSpriteIds.filter((id) => id === "1").length === 1
    && child.initActionSpriteIds.filter((id) => id === "5").length === 1,
  "component DoInitAction bindings changed");
  invariant(childRoot.placements.every((item) => !["1", "5"].includes(item.objectId)),
    "component runtime symbols are now directly root-placed");

  const shellRoot = timeline(shell, "root");
  const shellPreloader = timeline(shell, "sprite-176");
  invariant(shellPreloader.declaredFrameCount === 28 && shellPreloader.observedShowFrameCount === 28,
    "same-lesson shell preloader is not exactly 28 frames");
  for (const [label, frame] of [["inactive", 1], ["jump_check", 11], ["done", 20]]) {
    exactItem(shellPreloader.labels, (item) => item.label === label && item.frame === frame,
      `same-lesson shell preloader label ${label} is not uniquely at frame ${frame}`);
  }
  const animationMc = exactItem(shellRoot.placements, (item) => item.name === "animation_mc",
    "same-lesson shell animation_mc placement is not unique");
  const internalPreloader = exactItem(shellRoot.placements,
    (item) => item.name === "InternalPreloader" && item.objectId === "176",
    "same-lesson shell InternalPreloader/object 176 placement is not unique");
  invariant(animationMc.frame === internalPreloader.frame,
    "same-lesson shell does not co-place animation_mc and InternalPreloader");

  return {
    child: {
      rootFrameCount: 10,
      fps: 12,
      entryLabel: {label: "begin", frame: 6},
      entryPlacement,
      animationTimeline: {timelineId: "sprite-58", frameCount: 142},
      randomSoundPlacements: [sound0, sound1],
      componentSymbols: [
        {objectId: 1, exportName: "FUIComponentSymbol", rootPlaced: false, doInitAction: true},
        {objectId: 5, exportName: "FScrollBarSymbol", rootPlaced: false, doInitAction: true},
      ],
    },
    shell: {
      preloader: {objectId: 176, frameCount: 28, labels: {inactive: 1, jump_check: 11, done: 20}},
      coPlacementFrame: animationMc.frame,
      animationMc,
      internalPreloader,
    },
  };
}

function keyframes(timelineValue) {
  return (timelineValue?.layers || []).flatMap((layer) => (layer.keyframes || []).map((frame) => ({layer: layer.name, ...frame})));
}

export function validateAuthoringAudit(audit) {
  invariant(audit.schemaVersion === 2, `authoring audit schema must be 2; observed ${audit.schemaVersion}`);
  invariant(audit.evidenceKind === "adobe-animate-2021-cold-start-authoring-audit",
    `unexpected authoring evidence kind: ${audit.evidenceKind}`);
  invariant(audit.animationId === IR001.animationId, `authoring audit animationId changed: ${audit.animationId}`);
  invariant(audit.animateVersion === "MAC 21,0,7,42652", `Animate version changed: ${audit.animateVersion}`);
  invariant(audit.source?.fla === IR001.pairedFla && audit.source?.flaSha256 === IR001.pairedFlaSha256,
    "authoring audit is not bound to the preserved IR001 FLA");
  invariant(audit.source?.workingCopy?.readOnlyAtFinalize === true
    && audit.source?.workingCopy?.byteIdenticalToSourceAtFinalize === true
    && audit.source?.workingCopy?.sha256 === IR001.pairedFlaSha256,
  "authoring working copy was not finalized read-only and byte-identical");
  invariant(audit.protocol?.recursiveLibraryTimelineAuditRequired === true
    && audit.protocol?.recursiveLibraryTimelineAuditVerified === true
    && audit.authoringAudit?.recursiveLibraryTimelineAudit === true,
  "schema-v2 recursive library audit is not fully verified");
  invariant(JSON.stringify(audit.nativeMovie) === JSON.stringify({
    width: 800,
    height: 600,
    fps: 12,
    frameCount: 10,
    backgroundColor: "#B8D8F7",
    rootLayerCount: 4,
    libraryItemCount: 52,
  }), "authoring native movie metadata changed");

  const rootFrames = keyframes(audit.authoringAudit?.timeline);
  exactItem(rootFrames, (frame) => frame.flashFrame === 6 && frame.name === "begin",
    "authoring root begin label is not unique on frame 6");
  const entry = exactItem(rootFrames.flatMap((frame) => (frame.elements || []).map((element) => ({frame: frame.flashFrame, ...element}))),
    (element) => element.frame === 6 && element.name === "animation" && element.libraryItemName === "Animation03",
    "authoring root animation/Animation03 placement is not unique on frame 6");
  const library = audit.authoringAudit?.library || [];
  const animation = exactItem(library, (item) => item.name === "Animation03" && item.itemType === "movie clip",
    "Animation03 library item is not unique");
  invariant(animation.timeline?.frameCount === 142, "Animation03 authoring timeline is not 142 frames");
  const actionFrames = keyframes(animation.timeline)
    .filter((frame) => frame.actionScriptLength > 0)
    .map(({flashFrame, actionScriptLength}) => ({flashFrame, actionScriptLength}));
  invariant(JSON.stringify(actionFrames) === JSON.stringify([
    {flashFrame: 1, actionScriptLength: 74},
    {flashFrame: 5, actionScriptLength: 47},
    {flashFrame: 142, actionScriptLength: 7},
  ]), `Animation03 authoring action frames changed: ${JSON.stringify(actionFrames)}`);
  const soundInstances = keyframes(animation.timeline)
    .filter((frame) => frame.layer === "Rnd_Sound" && frame.flashFrame === 1)
    .flatMap((frame) => frame.elements || [])
    .filter((element) => ["Mc_Sound_0", "Mc_Sound_1"].includes(element.name))
    .map((element) => ({name: element.name, libraryItemName: element.libraryItemName}))
    .sort((left, right) => compareText(left.name, right.name));
  invariant(JSON.stringify(soundInstances) === JSON.stringify([
    {name: "Mc_Sound_0", libraryItemName: "Mc_Sound_1"},
    {name: "Mc_Sound_1", libraryItemName: "Mc_Sound_1 copy"},
  ]), `Animation03 authored random-sound placements changed: ${JSON.stringify(soundInstances)}`);
  const scrollbar = exactItem(library,
    (item) => item.name === "Flash UI Components/ ScrollBar" && item.itemType === "component",
    "authored ScrollBar component is not unique");
  const fui = exactItem(library,
    (item) => item.name === "Flash UI Components/Core Assets - Developer Only/FUIComponent Class Tree/FUIComponent"
      && item.itemType === "component",
    "authored FUIComponent is not unique");
  invariant(scrollbar.linkageClassName === "FScrollBarSymbol" && scrollbar.linkageIdentifier === "FScrollBarSymbol"
    && scrollbar.timeline?.frameCount === 1, "authored FScrollBar linkage/timeline changed");
  invariant(fui.linkageClassName === "FUIComponentSymbol" && fui.linkageIdentifier === "FUIComponentSymbol"
    && fui.timeline?.frameCount === 1, "authored FUIComponent linkage/timeline changed");

  return {
    schemaVersion: 2,
    evidenceKind: audit.evidenceKind,
    animateVersion: audit.animateVersion,
    sourceFlaSha256: audit.source.flaSha256,
    workingCopyReadOnlyAndByteIdentical: true,
    recursiveLibraryTimelineAudit: true,
    nativeMovie: audit.nativeMovie,
    entry: {flashFrame: entry.frame, instanceName: entry.name, libraryItemName: entry.libraryItemName},
    animation03: {frameCount: 142, actionFrames, soundInstances},
    components: [
      {name: scrollbar.name, linkageClassName: scrollbar.linkageClassName, frameCount: 1},
      {name: fui.name, linkageClassName: fui.linkageClassName, frameCount: 1},
    ],
  };
}

function assertMapEquality(observed, expected, role) {
  invariant(observed.size === expected.size,
    `${role} script count changed: expected ${expected.size}, observed ${observed.size}`);
  for (const [script, expectedBody] of expected) {
    invariant(observed.has(script), `${role} is missing ${script}`);
    const observedHash = sha256(observed.get(script));
    const expectedHash = sha256(expectedBody);
    invariant(observedHash === expectedHash,
      `${role} ${script} changed: expected ${expectedHash}, observed ${observedHash}`);
  }
}

async function inspectArtifact(root, relativePath, expectedSha256, artifactId) {
  const absolute = path.join(root, relativePath);
  invariant(await exists(absolute), `${artifactId} is absent: ${relativePath}`);
  const observedSha256 = await sha256File(absolute);
  invariant(observedSha256 === expectedSha256,
    `${artifactId} hash changed: expected ${expectedSha256}, observed ${observedSha256}`);
  const details = await stat(absolute);
  return {artifactId, path: relativePath, bytes: details.size, sha256: observedSha256};
}

function buildReport({
  artifacts,
  ffdec,
  swfmill,
  python,
  childExport,
  childXml,
  shellExport,
  shellXml,
  childBindings,
  structure,
  authoring,
  scriptSha256,
}) {
  const evidenceArtifacts = artifacts.map(({artifactId, path: artifactPath, sha256: artifactSha256}) => ({
    artifactId,
    path: artifactPath.startsWith(IR001.migrationRoot)
      ? artifactPath.slice(`${IR001.migrationRoot}/`.length)
      : artifactPath,
    sha256: artifactSha256,
  }));
  const evidence = (script, lineOrRange) => ({artifactId: "ffdec-scripts", script, ...lineOrRange});
  const location = (group, script) => {
    const item = childBindings.locations[group].find((candidate) => candidate.script === script);
    invariant(item, `missing derived ${group} location in ${script}`);
    return item.line;
  };
  const shellScriptEvidence = SHELL_SCRIPTS.map((definition) => ({
    role: definition.role,
    script: definition.path,
    bodySha256: sha256(shellExport.scripts.get(definition.path)),
    requiredTokens: [...definition.mustContain],
  }));

  return {
    schemaVersion: 1,
    animationId: IR001.animationId,
    status: "binding-names-resolved-runtime-scenarios-pending",
    source: {
      swf: IR001.childSwf,
      swfSha256: IR001.childSwfSha256,
      pairedFla: IR001.pairedFla,
      pairedFlaSha256: IR001.pairedFlaSha256,
    },
    authority: {
      method: "Deterministic static derivation from the untouched IR001 SWF, fresh pinned FFDec and swfmill extraction, the exact same-lesson shell SWF and scripts, saved machine bundles, and the hash-bound schema-v2 Adobe Animate authoring audit.",
      originalRuntimeExecuted: false,
      originalShellExecuted: false,
      unknownEndpointExecuted: false,
      sourceFilesModified: false,
      circularDependenciesExcluded: [
        "audit/scenario-inventory.json",
        "audit/same-lesson-shell-host-entry-binding.json",
      ],
      claim: "This report resolves four scanner-reported names as AVM1 intrinsics or child-owned initialization and preserves _level0.InternalPreloader as a host adapter requirement. It does not prove runtime traversal, random coverage, audio sync, visual fidelity, human review, owner acceptance, or strict completion.",
    },
    evidenceArtifacts,
    generatedBy: {
      script: "scripts/build-ir001-host-binding-resolution.mjs",
      scriptSha256,
      deterministic: true,
    },
    staticExtraction: {
      ffdec: {
        version: ffdec.version,
        jarSha256: ffdec.jarSha256,
        childCommand: ["ffdec", "-onerror", "abort", "-export", "script", "<temporary-output>", IR001.childSwf],
        shellCommand: ["ffdec", "-onerror", "abort", "-export", "script", "<temporary-output>", IR001.shellSwf],
        childExportFileCount: childExport.fileCount,
        childExportIndexSha256: childExport.indexSha256,
        savedChildBundleExactBodyMatch: true,
        shellScripts: shellScriptEvidence,
        temporaryOutputsRetained: false,
      },
      swfmill: {
        version: swfmill.version,
        executableSha256: swfmill.executableSha256,
        childCommand: ["swfmill", "-n", "swf2xml", IR001.childSwf, "<temporary-xml>"],
        shellCommand: ["swfmill", "-n", "swf2xml", IR001.shellSwf, "<temporary-xml>"],
        childXmlSha256: sha256(childXml.raw),
        savedChildXmlExactByteMatch: true,
        shellXmlSha256: sha256(shellXml.raw),
        temporaryOutputsRetained: false,
      },
      xmlParser: {version: python.version, method: childXml.facts.parser},
    },
    authoringEvidence: authoring,
    structuralProof: structure,
    childReferenceProof: {
      referenceCounts: childBindings.referenceCounts,
      componentAttachTargets: childBindings.componentAttachTargets,
      scriptBodySha256: childBindings.bodySha256,
    },
    entryHandoff: {
      status: "source-evidenced-safe-adapter-required",
      label: "begin",
      childRootFrame: 6,
      childPlacementAtEntry: {
        instanceName: "animation",
        characterId: 58,
        evidence: {
          artifactId: "swfmill-xml",
          rootTimeline: "FrameLabel(begin) and PlaceObject2(name=animation, objectID=58, depth=1) both occur on one-indexed frame 6",
        },
      },
      sameLessonShellBehavior: {
        condition: "After animation_mc frames/bytes are fully loaded",
        effect: '_parent.animation_mc.gotoAndPlay("begin")',
        evidence: [{artifactId: "same-lesson-shell", script: SHELL_SCRIPTS[1].path}],
      },
      fixtureAdapter: 'MovieClipLoader.onLoadInit(target) must call target.gotoAndPlay("begin") only after the exact child is initialized; the fixture must also provide the isolated InternalPreloader protocol adapter described below.',
      authorityBoundary: "The entry jump and preloader protocol are statically source-evidenced. An adapter is not a recreation of the full shell and grants no runtime or acceptance authority.",
    },
    bindings: [
      {
        binding: "_global",
        disposition: "intrinsic-avm1-global-namespace",
        fixturePolicy: "do-not-inject-or-override",
        rationale: "The only bare reference is `var _loc3_ = _global` inside the child-embedded FUIComponent class. `_global` is the intrinsic AVM1 global namespace, not a value supplied by the HELP lesson shell.",
        evidence: [
          evidence("FUIComponentSymbol.as", {line: location("bareGlobal", "FUIComponentSymbol.as")}),
          {artifactId: "authoring-audit", libraryItem: "Flash UI Components/Core Assets - Developer Only/FUIComponent Class Tree/FUIComponent"},
        ],
        strictAcceptanceEffect: "removes only this false parent-value blocker; no runtime or acceptance gate is satisfied",
      },
      {
        binding: "_global.FStyleFormat",
        disposition: "child-embedded-component-bootstrap",
        fixturePolicy: "do-not-inject-or-override",
        rationale: "The child FUIComponent DoInitAction defines `_global.FStyleFormat`, installs its prototype, and lazily constructs globalStyleFormat when absent. The schema-v2 FLA audit independently identifies the linked one-frame FUIComponent authoring symbol.",
        evidence: [
          evidence("FUIComponentSymbol.as", {
            lineStart: Math.min(...childBindings.locations.styleFormat.map(({line}) => line)),
            lineEnd: Math.max(...childBindings.locations.styleFormat.map(({line}) => line)),
          }),
          {artifactId: "swfmill-xml", exportName: "FUIComponentSymbol", objectId: 1, doInitAction: true},
          {artifactId: "authoring-audit", linkageClassName: "FUIComponentSymbol"},
        ],
        strictAcceptanceEffect: "removes only this child-bootstrap parent-value blocker; no runtime or acceptance gate is satisfied",
      },
      {
        binding: "_global.tempRandomSoundMc",
        disposition: "child-self-initialized-before-use",
        fixturePolicy: "do-not-inject-or-override",
        rationale: "Sprite 58 frame 1 assigns `Mc_Sound_` plus the untouched random(2) result before frame 5 dispatches it. That same sprite places Mc_Sound_0/object 7 and Mc_Sound_1/object 8 on frame 1, corroborated by the authored Animation03 random-sound layer. Injecting a parent value would overwrite shipped random behavior.",
        evidence: [
          evidence("DefineSprite_58/frame_1/DoAction.as", {line: location("randomSound", "DefineSprite_58/frame_1/DoAction.as")}),
          evidence("DefineSprite_58/frame_5/DoAction.as", {line: location("randomSound", "DefineSprite_58/frame_5/DoAction.as")}),
          {artifactId: "swfmill-xml", timelineId: "sprite-58", namedPlacements: ["Mc_Sound_0", "Mc_Sound_1"]},
          {artifactId: "authoring-audit", libraryItem: "Animation03", layer: "Rnd_Sound"},
        ],
        strictAcceptanceEffect: "removes only the parent-value blocker; both random outcomes plus listening, sync, stop, and Replay remain mandatory",
      },
      {
        binding: "_parent",
        disposition: "intrinsic-display-list-parent",
        fixturePolicy: "do-not-inject-or-override",
        rationale: "There are exactly two references: FScrollBar resolves its target from its own display-list parent, and FUIComponent defaults handlerObj to its own display-list parent. AVM1 assigns `_parent` intrinsically. The component symbols are exported/DoInitAction-bound and not root-placed; their only attachMovie targets are their own ScrollThumb/UpArrow/DownArrow assets.",
        evidence: [
          evidence("FScrollBarSymbol.as", {line: location("parent", "FScrollBarSymbol.as")}),
          evidence("FUIComponentSymbol.as", {line: location("parent", "FUIComponentSymbol.as")}),
          {artifactId: "swfmill-xml", componentObjectIds: [1, 5], rootPlaced: false},
          {artifactId: "authoring-audit", linkageClassNames: ["FScrollBarSymbol", "FUIComponentSymbol"]},
        ],
        strictAcceptanceEffect: "removes only this intrinsic-reference parent-value blocker; component reachability and behavior remain runtime questions",
      },
    ],
    resolvedParentValueBindingCount: 4,
    unresolvedParentValueBindingCount: 0,
    unresolvedBindingCountAfterStaticResolution: 0,
    remainingAdapterRequirements: [
      {
        binding: "_level0.InternalPreloader",
        disposition: "host-adapter-required",
        fixturePolicy: "provide-minimal-isolated-protocol-adapter; do-not-run-or-recreate-unknown-shell-endpoints",
        request: '_level0.InternalPreloader.gotoAndPlay("jump_check") on child root frame 1, followed by stop()',
        sameLessonProtocol: {
          objectId: 176,
          labels: {inactive: 1, jump_check: 11, done: 20},
          completionHandoff: '_parent.animation_mc.gotoAndPlay("begin")',
          spanishHookObserved: "_root.doCheckSpanishAudio()",
        },
        rationale: "Unlike the four resolved names, InternalPreloader is a real object supplied by the same-lesson host shell. A safe isolated fixture must emulate only the statically proven entry protocol and must not execute legacy network/LMS behavior.",
        evidence: [
          evidence("frame_1/DoAction.as", {line: location("preloader", "frame_1/DoAction.as")}),
          {artifactId: "same-lesson-shell", script: SHELL_SCRIPTS[0].path},
          {artifactId: "same-lesson-shell", script: SHELL_SCRIPTS[1].path},
        ],
        strictAcceptanceEffect: "none; adapter implementation and authorized-runtime validation remain pending",
      },
    ],
    remainingAdapterRequirementCount: 1,
    remainingAuthoritativeBlockers: [
      "The isolated fixture must implement and validate the source-evidenced InternalPreloader/entry adapter without enabling legacy external side effects.",
      "Untouched AVM1 random(2) cannot be parent-forced; both naturally observed outcomes still require authoritative runtime capture.",
      "Both embedded SoundStream branches still require listening, language/content classification, cue/sync, stop, and Replay validation.",
      "All reachable runtime states still require baseline capture, implementation comparison, human review, and owner acceptance.",
    ],
    strictAcceptanceEffect: "none; four parent-value names are statically dispositioned and one real shell-adapter requirement is preserved, but runtime, visual, audio, human, and owner gates remain pending",
  };
}

export async function buildIr001HostBindingResolution({
  root = projectRoot,
  ffdec: ffdecArgument = "ffdec",
  swfmill: swfmillArgument = "swfmill",
  python: pythonArgument = "python3",
  check = false,
} = {}) {
  const artifacts = await Promise.all([
    inspectArtifact(root, IR001.childSwf, IR001.childSwfSha256, "source-swf"),
    inspectArtifact(root, IR001.pairedFla, IR001.pairedFlaSha256, "paired-fla"),
    inspectArtifact(root, IR001.shellSwf, IR001.shellSwfSha256, "same-lesson-shell"),
    inspectArtifact(root, IR001.savedFfdec, IR001.savedFfdecSha256, "ffdec-scripts"),
    inspectArtifact(root, IR001.savedSwfmill, IR001.savedSwfmillSha256, "swfmill-xml"),
    inspectArtifact(root, IR001.authoringAudit, IR001.authoringAuditSha256, "authoring-audit"),
  ]);
  const [ffdec, swfmill, python] = await Promise.all([
    inspectFfdec(ffdecArgument),
    inspectSwfmill(swfmillArgument),
    inspectPython(pythonArgument),
  ]);

  const savedFfdecRaw = gunzipSync(await readFile(path.join(root, IR001.savedFfdec)));
  invariant(sha256(savedFfdecRaw) === IR001.savedFfdecContentSha256,
    "saved FFDec bundle uncompressed hash changed");
  const savedScripts = parseFfdecScriptBundle(savedFfdecRaw);
  const savedSwfmillRaw = gunzipSync(await readFile(path.join(root, IR001.savedSwfmill)));
  invariant(sha256(savedSwfmillRaw) === IR001.savedSwfmillContentSha256,
    "saved swfmill XML uncompressed hash changed");

  const [childExport, childXml, shellExport, shellXml] = await Promise.all([
    exportScripts({source: path.join(root, IR001.childSwf), ffdec, prefix: "help-math-ir001-child-ffdec-"}),
    extractSwfmill({source: path.join(root, IR001.childSwf), swfmill, python, prefix: "help-math-ir001-child-swfmill-"}),
    exportScripts({source: path.join(root, IR001.shellSwf), ffdec, prefix: "help-math-ir001-shell-ffdec-"}),
    extractSwfmill({source: path.join(root, IR001.shellSwf), swfmill, python, prefix: "help-math-ir001-shell-swfmill-"}),
  ]);
  assertMapEquality(childExport.scripts, savedScripts, "fresh child FFDec export versus saved machine bundle");
  invariant(sha256(childXml.raw) === IR001.savedSwfmillContentSha256,
    `fresh child swfmill XML differs from saved machine XML: ${sha256(childXml.raw)}`);
  for (const definition of SHELL_SCRIPTS) {
    const body = exactScript(shellExport.scripts, definition.path);
    for (const token of definition.mustContain) {
      invariant(body.includes(token), `${definition.path} is missing required token: ${token}`);
    }
  }

  const childBindings = deriveChildBindingFacts(childExport.scripts);
  const structure = deriveStructuralProof(childXml.facts, shellXml.facts);
  const authoringAudit = JSON.parse(await readFile(path.join(root, IR001.authoringAudit), "utf8"));
  const authoring = validateAuthoringAudit(authoringAudit);
  const scriptSha256 = await sha256File(path.join(root, "scripts/build-ir001-host-binding-resolution.mjs"));
  const report = buildReport({
    artifacts,
    ffdec,
    swfmill,
    python,
    childExport,
    childXml,
    shellExport,
    shellXml,
    childBindings,
    structure,
    authoring,
    scriptSha256,
  });
  const desired = stableJson(report);
  const output = path.join(root, IR001.output);
  if (check) {
    invariant(await exists(output), `host-binding report is absent: ${IR001.output}`);
    const current = await readFile(output, "utf8");
    invariant(current === desired, `${IR001.output} is stale; rerun the builder without --check`);
  } else {
    await writeFile(output, desired);
  }
  return {report, output, check, sha256: sha256(desired)};
}

function usage() {
  return [
    "Usage: node scripts/build-ir001-host-binding-resolution.mjs [options]",
    "",
    "Options:",
    "  --check             Re-derive and fail if the checked-in report differs",
    "  --root <path>       Override the project root",
    "  --ffdec <path>      Override the pinned FFDec launcher",
    "  --swfmill <path>    Override the pinned swfmill executable",
    "  --python <path>     Override the Python 3 XML parser executable",
    "  -h, --help          Show this help",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = await buildIr001HostBindingResolution(options);
  process.stdout.write(`${options.check ? "verified" : "wrote"} ${portable(result.output)} (${result.sha256})\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
