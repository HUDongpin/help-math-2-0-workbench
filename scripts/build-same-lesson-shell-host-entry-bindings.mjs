#!/usr/bin/env node

import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {createReadStream, statSync} from "node:fs";
import {
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
  SCENARIO_INVENTORY_PROJECTION,
  scenarioInventorySha256,
} from "./evidence-projections.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

const ARCHIVE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const EXPECTED_FFDEC_VERSION = "JPEXS Free Flash Decompiler v.26.2.1";
const EXPECTED_FFDEC_JAR_SHA256 = "090ab695053ad94cba6408574c7d7eea20ec60b6ae789ee6056a23f45106762f";
const EXPECTED_SWFMILL_VERSION = "swfmill 0.3.6";
const EXPECTED_SWFMILL_SHA256 = "b1299adad7f32d8e489574539e79b0f42c4960148170bc1ca48736e07ccbd311";

const CHILD_ENTRY_SCRIPT = Object.freeze({
  role: "child-root-preloader-request-and-stop",
  relativePath: "frame_1/DoAction.as",
  mustContain: [
    '_level0.InternalPreloader.gotoAndPlay("jump_check")',
    "stop()",
  ],
});

const G3_HOST_SCRIPTS = Object.freeze([
  Object.freeze({
    role: "g3-preloader-jump-check-completion-handoff",
    relativePath: "DefineSprite_179/frame_2/DoAction.as",
    timelineId: "sprite-179",
    frame: 2,
    mustContain: [
      "_root.animation_mc.getBytesLoaded()",
      "_root.animation_mc.getBytesTotal()",
      'this.gotoAndStop(1)',
      '_root.animation_mc.gotoAndPlay("begin")',
    ],
  }),
  Object.freeze({
    role: "g3-preloader-done-completion-handoff",
    relativePath: "DefineSprite_179/frame_3/DoAction.as",
    timelineId: "sprite-179",
    frame: 3,
    mustContain: [
      "getPercent = bytes_loaded / bytes_total",
      '_root.animation_mc.gotoAndPlay("begin")',
      "this.gotoAndPlay(2)",
    ],
  }),
]);

const G4_HOST_SCRIPTS = Object.freeze([
  Object.freeze({
    role: "g4-preloader-load-progress-enter-frame",
    relativePath: "DefineSprite_176/frame_11/PlaceObject2_174_2/CLIPACTIONRECORD onClipEvent(enterFrame).as",
    timelineId: "sprite-176",
    frame: 11,
    placedObjectId: 174,
    placementDepth: 2,
    mustContain: [
      "_root.animation_mc.getBytesLoaded()",
      "_root.animation_mc.getBytesTotal()",
      '_root.InternalPreloader.gotoAndPlay("done")',
    ],
  }),
  Object.freeze({
    role: "g4-preloader-done-completion-handoff-and-spanish-check",
    relativePath: "DefineSprite_176/frame_20/DoAction.as",
    timelineId: "sprite-176",
    frame: 20,
    mustContain: [
      "_parent.animation_mc._framesloaded",
      "_parent.animation_mc._totalframes",
      '_parent.animation_mc.gotoAndPlay("begin")',
      '_root.InternalPreloader.gotoAndStop("inactive")',
      "_root.doCheckSpanishAudio()",
      'gotoAndStop("jump_check")',
    ],
  }),
]);

function boundaryMonitorScripts({monitorObjectId, monitorDepth, functionLineStart, functionLineEnd}) {
  return Object.freeze([
    Object.freeze({
      role: "root-frame-50-full-shell-prev-next-monitor",
      relativePath: `frame_50/PlaceObject2_${monitorObjectId}_${monitorDepth}/CLIPACTIONRECORD onClipEvent(enterFrame).as`,
      timelineId: "root",
      frame: 50,
      placedObjectId: monitorObjectId,
      placementDepth: monitorDepth,
      mustContain: [
        "onClipEvent(enterFrame)",
        "_root.doCheckPrevAndNext()",
      ],
    }),
    Object.freeze({
      role: "root-frame-35-full-shell-prev-next-terminal-boundary-function",
      relativePath: "frame_35/DoAction.as",
      timelineId: "root",
      frame: 35,
      lineStart: functionLineStart,
      lineEnd: functionLineEnd,
      mustContain: [
        "function doCheckPrevAndNext()",
        "_root.InternalPreloader._currentframe == 1",
        "_root.animation_mc.animation._currentframe >= _root.animation_mc.animation._totalframes",
        "_root.nextani.gotoAndPlay(\"nextani\")",
        "_root.doCheckSpanishAudio()",
        "_root.animation_mc.animation.stop()",
      ],
    }),
  ]);
}

const G3_BOUNDARY_SCRIPTS = boundaryMonitorScripts({
  monitorObjectId: 589,
  monitorDepth: 78,
  functionLineStart: 1635,
  functionLineEnd: 1707,
});
const G4_L1_BOUNDARY_SCRIPTS = boundaryMonitorScripts({
  monitorObjectId: 595,
  monitorDepth: 72,
  functionLineStart: 1714,
  functionLineEnd: 1786,
});
const G4_L3_BOUNDARY_SCRIPTS = boundaryMonitorScripts({
  monitorObjectId: 596,
  monitorDepth: 72,
  functionLineStart: 1541,
  functionLineEnd: 1613,
});

export const TARGETS = Object.freeze([
  Object.freeze({
    animationId: "course-g03-l01-vb-004",
    protocol: "help-math-g3-shell-preloader-v1",
    preloaderObjectId: 179,
    preloaderFrameCount: 3,
    preloaderLabels: Object.freeze({inactive: 1, jump_check: 2, done: 3}),
    hostScripts: Object.freeze([...G3_HOST_SCRIPTS, ...G3_BOUNDARY_SCRIPTS]),
  }),
  Object.freeze({
    animationId: "course-g04-l01-ir-001",
    protocol: "help-math-g4-shell-preloader-v1",
    preloaderObjectId: 176,
    preloaderFrameCount: 28,
    preloaderLabels: Object.freeze({inactive: 1, jump_check: 11, done: 20}),
    hostScripts: Object.freeze([...G4_HOST_SCRIPTS, ...G4_L1_BOUNDARY_SCRIPTS]),
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-009",
    protocol: "help-math-g4-shell-preloader-v1",
    preloaderObjectId: 176,
    preloaderFrameCount: 28,
    preloaderLabels: Object.freeze({inactive: 1, jump_check: 11, done: 20}),
    hostScripts: Object.freeze([...G4_HOST_SCRIPTS, ...G4_L3_BOUNDARY_SCRIPTS]),
  }),
]);

const TARGET_BY_ID = new Map(TARGETS.map((target) => [target.animationId, target]));

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

async function exists(candidate) {
  try {
    await stat(candidate);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function invariant(condition, message) {
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
      // Continue searching for the explicitly requested executable.
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
    ids: [],
  };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else if (["--ffdec", "--swfmill", "--root", "--id"].includes(value)) {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--ffdec") options.ffdec = next;
      else if (value === "--swfmill") options.swfmill = next;
      else if (value === "--root") options.root = path.resolve(next);
      else options.ids.push(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  const selectedIds = options.ids.length ? [...new Set(options.ids)] : TARGETS.map(({animationId}) => animationId);
  for (const id of selectedIds) invariant(TARGET_BY_ID.has(id), `Unsupported animation ID: ${id}`);
  options.ids = selectedIds;
  return options;
}

export function normalizeActionScript(raw) {
  const normalized = raw.toString("utf8").replace(/\r\n?/g, "\n").replace(/\n*$/g, "");
  return `${normalized}\n`;
}

function buildActionScriptExcerpt(record, definition) {
  if (!record) return null;
  const wholeText = normalizeActionScript(record.raw);
  const wholeLines = wholeText.trimEnd().split("\n");
  const lineStart = definition.lineStart || 1;
  const lineEnd = definition.lineEnd || wholeLines.length;
  invariant(lineStart >= 1 && lineEnd >= lineStart && lineEnd <= wholeLines.length,
    `${definition.relativePath} excerpt ${lineStart}-${lineEnd} exceeds ${wholeLines.length} lines`);
  const text = `${wholeLines.slice(lineStart - 1, lineEnd).join("\n")}\n`;
  const missingTokens = definition.mustContain.filter((token) => !text.includes(token));
  return {
    role: definition.role,
    artifact: definition.relativePath,
    timelineId: definition.timelineId || "root",
    frame: definition.frame || 1,
    ...(definition.placedObjectId ? {placedObjectId: definition.placedObjectId} : {}),
    ...(definition.placementDepth ? {placementDepth: definition.placementDepth} : {}),
    rawBytes: record.raw.length,
    rawSha256: sha256Buffer(record.raw),
    normalization: "CRLF-or-CR-to-LF; remove terminal newlines; append exactly one LF",
    normalizedBytes: Buffer.byteLength(text, "utf8"),
    normalizedSha256: sha256Buffer(Buffer.from(text, "utf8")),
    lineStart,
    lineEnd,
    text,
    requiredTokens: [...definition.mustContain],
    missingTokens,
    exact: missingTokens.length === 0,
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

async function exportScripts({sourceAbsolute, ffdec, definitions, temporaryPrefix}) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), temporaryPrefix));
  invariant(path.dirname(temporaryRoot) === path.resolve(os.tmpdir()), `unsafe temporary FFDec path: ${temporaryRoot}`);
  try {
    await run(ffdec.launcherPath, ["-onerror", "abort", "-export", "script", temporaryRoot, sourceAbsolute]);
    const scriptsRoot = path.join(temporaryRoot, "scripts");
    const files = await listFilesRecursively(scriptsRoot);
    const records = [];
    for (const file of files) {
      const raw = await readFile(file.absolute);
      records.push({relativePath: file.relativePath, raw});
    }
    const byPath = new Map(records.map((record) => [record.relativePath, record]));
    const index = records.map((record) => ({
      path: record.relativePath,
      bytes: record.raw.length,
      sha256: sha256Buffer(record.raw),
    }));
    return {
      fullExportFileCount: records.length,
      fullExportIndexHashMode: "stable-key-sorted-pretty-json-array-v1",
      fullExportIndexSha256: sha256Buffer(Buffer.from(stableJson(index), "utf8")),
      excerpts: definitions.map((definition) => buildActionScriptExcerpt(byPath.get(definition.relativePath), definition)),
      missingArtifacts: definitions.filter((definition) => !byPath.has(definition.relativePath)).map(({relativePath}) => relativePath),
    };
  } finally {
    await rm(temporaryRoot, {recursive: true, force: false});
  }
}

function parseAttributes(sourceLine) {
  return Object.fromEntries([...sourceLine.matchAll(/([A-Za-z0-9_]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]));
}

export function parseHostStructure(xmlRaw, config) {
  const lines = xmlRaw.toString("utf8").replace(/\r\n?/g, "\n").split("\n");
  const timelineStack = [];
  const definitions = [];
  const labels = [];
  const namedRootPlacements = [];
  let rootFrame = 1;
  for (let index = 0; index < lines.length; index += 1) {
    const sourceLine = lines[index].trim();
    const definitionMatch = sourceLine.match(/^<DefineSprite objectID="(\d+)" frames="(\d+)">$/);
    if (definitionMatch) {
      const definition = {
        timelineId: `sprite-${definitionMatch[1]}`,
        objectId: Number(definitionMatch[1]),
        frameCount: Number(definitionMatch[2]),
        line: index + 1,
        sourceLine,
      };
      definitions.push(definition);
      timelineStack.push({timelineId: definition.timelineId, frame: 1});
      continue;
    }
    const labelMatch = sourceLine.match(/^<FrameLabel label="([^"]+)">$/);
    if (labelMatch) {
      const context = timelineStack.at(-1);
      labels.push({
        timelineId: context?.timelineId || "root",
        frame: context?.frame || rootFrame,
        label: labelMatch[1],
        line: index + 1,
        sourceLine,
      });
    }
    if (sourceLine.startsWith("<PlaceObject2 ")) {
      const attributes = parseAttributes(sourceLine);
      if (!timelineStack.length && ["animation_mc", "InternalPreloader"].includes(attributes.name)) {
        namedRootPlacements.push({
          timelineId: "root",
          frame: rootFrame,
          depth: Number(attributes.depth),
          objectId: Number(attributes.objectID),
          instanceName: attributes.name,
          line: index + 1,
          sourceLine,
        });
      }
    }
    if (sourceLine === "<ShowFrame/>") {
      if (timelineStack.length) timelineStack.at(-1).frame += 1;
      else rootFrame += 1;
    }
    if (sourceLine === "</DefineSprite>") timelineStack.pop();
  }

  const issues = [];
  const preloaderDefinitions = definitions.filter(({objectId}) => objectId === config.preloaderObjectId);
  if (preloaderDefinitions.length !== 1) issues.push(`expected exactly one DefineSprite ${config.preloaderObjectId}; observed ${preloaderDefinitions.length}`);
  else if (preloaderDefinitions[0].frameCount !== config.preloaderFrameCount) {
    issues.push(`preloader frame count expected ${config.preloaderFrameCount}; observed ${preloaderDefinitions[0].frameCount}`);
  }
  const preloaderTimelineId = `sprite-${config.preloaderObjectId}`;
  const observedLabels = labels.filter(({timelineId}) => timelineId === preloaderTimelineId);
  for (const [label, expectedFrame] of Object.entries(config.preloaderLabels)) {
    const matches = observedLabels.filter((item) => item.label === label && item.frame === expectedFrame);
    if (matches.length !== 1) issues.push(`expected ${preloaderTimelineId} label ${label} at frame ${expectedFrame}; observed ${matches.length}`);
  }
  const animationPlacements = namedRootPlacements.filter(({instanceName}) => instanceName === "animation_mc");
  const preloaderPlacements = namedRootPlacements.filter(({instanceName}) => instanceName === "InternalPreloader");
  if (animationPlacements.length !== 1) issues.push(`expected exactly one root animation_mc placement; observed ${animationPlacements.length}`);
  if (preloaderPlacements.length !== 1) issues.push(`expected exactly one root InternalPreloader placement; observed ${preloaderPlacements.length}`);
  else if (preloaderPlacements[0].objectId !== config.preloaderObjectId) {
    issues.push(`InternalPreloader object expected ${config.preloaderObjectId}; observed ${preloaderPlacements[0].objectId}`);
  }
  if (animationPlacements.length === 1 && preloaderPlacements.length === 1
    && animationPlacements[0].frame !== preloaderPlacements[0].frame) {
    issues.push(`animation_mc and InternalPreloader are not introduced on the same root frame`);
  }
  return {
    status: issues.length ? "blocked-unresolved" : "source-structure-proven-runtime-unverified",
    issues,
    rootFrameCount: rootFrame - 1,
    preloaderDefinition: preloaderDefinitions.length === 1 ? preloaderDefinitions[0] : null,
    preloaderLabels: observedLabels,
    animationMcPlacement: animationPlacements.length === 1 ? animationPlacements[0] : null,
    internalPreloaderPlacement: preloaderPlacements.length === 1 ? preloaderPlacements[0] : null,
  };
}

async function buildHostStructure({root, sourceHost, swfmill, config}) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-same-lesson-host-structure-"));
  invariant(path.dirname(temporaryRoot) === path.resolve(os.tmpdir()), `unsafe temporary swfmill path: ${temporaryRoot}`);
  const xmlPath = path.join(temporaryRoot, "index_local.xml");
  try {
    await run(swfmill.executablePath, ["-n", "swf2xml", path.join(root, sourceHost.path), xmlPath]);
    const xmlRaw = await readFile(xmlPath);
    return {
      transientXml: {
        retained: false,
        bytes: xmlRaw.length,
        sha256: sha256Buffer(xmlRaw),
        command: ["swfmill", "-n", "swf2xml", sourceHost.path, "<temporary-xml>"],
      },
      ...parseHostStructure(xmlRaw, config),
    };
  } finally {
    await rm(temporaryRoot, {recursive: true, force: false});
  }
}

function deriveLessonPaths(childPath) {
  invariant(childPath.startsWith(ARCHIVE_PREFIX), `child source is outside the preserved archive: ${childPath}`);
  const sectionRoot = path.posix.dirname(childPath);
  const lessonRoot = path.posix.dirname(sectionRoot);
  invariant(/\/HELP_COURSES\/ELMGR\d+\/L\d+$/.test(lessonRoot), `cannot derive a lesson root from ${childPath}`);
  return {
    lessonRoot,
    childRelativeToLesson: childPath.slice(`${lessonRoot}/`.length),
    sourceHostPath: `${lessonRoot}/index_local.swf`,
    courseXmlPath: `${lessonRoot}/index.xml`,
  };
}

export function deriveTargetEntryBinding(inventory) {
  const issues = [];
  const sourcePath = inventory?.source?.swf;
  if (typeof sourcePath !== "string") {
    return {status: "blocked-unresolved", issues: ["scenario inventory has no source.swf"], observations: {}, entryTarget: null};
  }
  const {lessonRoot, childRelativeToLesson, sourceHostPath, courseXmlPath} = deriveLessonPaths(sourcePath);
  if (inventory?.courseXml?.artifact?.path !== courseXmlPath) {
    issues.push(`course XML is not the derived same-lesson index.xml (${courseXmlPath})`);
  }
  const currentPlacement = inventory?.courseXml?.currentPlacement;
  if (currentPlacement?.matchStatus !== "exact-active-page") issues.push("course XML current placement is not exact-active-page");
  if (currentPlacement?.sourceRelativePath !== childRelativeToLesson) issues.push("course XML sourceRelativePath does not match the child source path");
  if (currentPlacement?.exactPlacement?.path !== childRelativeToLesson) issues.push("course XML exactPlacement does not match the child source path");
  const timelines = inventory?.coverage?.timelineStateCoverage || [];
  const roots = timelines.filter(({timelineId}) => timelineId === "root");
  if (roots.length !== 1) issues.push(`expected exactly one root timeline; observed ${roots.length}`);
  const root = roots.length === 1 ? roots[0] : null;
  const beginLabels = (root?.frameLabels || []).filter(({label}) => label === "begin");
  const animationPlacements = (root?.namedPlacements || []).filter(({name}) => name === "animation");
  if (beginLabels.length !== 1) issues.push(`expected exactly one child root begin label; observed ${beginLabels.length}`);
  if (animationPlacements.length !== 1) issues.push(`expected exactly one child root animation placement; observed ${animationPlacements.length}`);
  if (beginLabels.length === 1 && animationPlacements.length === 1
    && beginLabels[0].frame !== animationPlacements[0].frame) {
    issues.push("child root begin label and animation placement are on different frames");
  }
  const targetTimelineId = animationPlacements.length === 1 ? `sprite-${animationPlacements[0].objectId}` : null;
  if (targetTimelineId) {
    const targetTimelines = timelines.filter(({timelineId}) => timelineId === targetTimelineId);
    if (targetTimelines.length !== 1) issues.push(`target timeline ${targetTimelineId} is not uniquely inventoried`);
    else if (targetTimelines[0].structuralReachability !== "reachable-from-root-placement-graph") {
      issues.push(`target timeline ${targetTimelineId} is not proven reachable from the root placement graph`);
    }
  }
  return {
    status: issues.length ? "blocked-unresolved" : "source-structure-proven-runtime-unverified",
    issues,
    observations: {
      lessonRoot,
      childRelativeToLesson,
      sourceHostPath,
      courseXmlPath,
      beginLabels,
      animationPlacements,
    },
    entryTarget: issues.length ? null : {
      rootTimelineId: "root",
      label: "begin",
      frame: beginLabels[0].frame,
      instanceName: "animation",
      objectId: Number(animationPlacements[0].objectId),
      timelineId: targetTimelineId,
      depth: Number(animationPlacements[0].depth),
      placementTag: animationPlacements[0].tag,
      hasClipActions: Boolean(animationPlacements[0].hasClipActions),
    },
  };
}

async function loadFrozenSourceContext(root) {
  const freezePath = path.join(root, "catalog/source-freeze.json");
  const catalogPath = path.join(root, "catalog/source-files.json");
  const freeze = JSON.parse(await readFile(freezePath, "utf8"));
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  invariant(freeze.canonicalRoot === ARCHIVE_PREFIX.slice(0, -1), "source-freeze canonicalRoot changed");
  invariant(freeze.manifest === "catalog/source-manifest.sha256", "source-freeze manifest path changed");
  const manifestSha256 = await sha256File(path.join(root, freeze.manifest));
  invariant(manifestSha256 === freeze.manifestSha256, "source freeze manifest hash is stale");
  invariant(catalog.fileCount === freeze.fileCount && catalog.totalBytes === freeze.totalBytes,
    "source-files catalog totals do not match source-freeze.json");
  return {
    freeze: {
      path: "catalog/source-freeze.json",
      sha256: await sha256File(freezePath),
      manifest: freeze.manifest,
      manifestSha256,
      fileCount: freeze.fileCount,
      totalBytes: freeze.totalBytes,
    },
    catalog: {
      path: "catalog/source-files.json",
      sha256: await sha256File(catalogPath),
      checksumSetSha256: catalog.checksumSetSha256,
      byPath: new Map(catalog.files.map((file) => [file.path, file])),
    },
  };
}

async function inspectFrozenSource(root, sourceContext, projectRelativePath, role) {
  invariant(projectRelativePath.startsWith(ARCHIVE_PREFIX), `${role} is outside the source archive: ${projectRelativePath}`);
  const archiveRelativePath = projectRelativePath.slice(ARCHIVE_PREFIX.length);
  const catalogRecord = sourceContext.catalog.byPath.get(archiveRelativePath);
  invariant(catalogRecord, `${role} is absent from catalog/source-files.json: ${archiveRelativePath}`);
  const absolute = path.join(root, projectRelativePath);
  const sourceStat = await stat(absolute);
  invariant(sourceStat.isFile(), `${role} is not a regular file: ${projectRelativePath}`);
  const sha256 = await sha256File(absolute);
  invariant(sourceStat.size === catalogRecord.bytes, `${role} byte size differs from the frozen catalog`);
  invariant(sha256 === catalogRecord.sha256, `${role} SHA-256 differs from the frozen catalog`);
  return {path: projectRelativePath, archiveRelativePath, bytes: sourceStat.size, sha256, role};
}

async function inspectMachineEvidence(root, animationId, inventory, artifactId) {
  const records = (inventory.evidenceIndex || []).filter((record) => record.artifactId === artifactId);
  invariant(records.length === 1, `${animationId}: expected one ${artifactId} evidence binding; observed ${records.length}`);
  const record = records[0];
  const workspaceRelative = `migrations/${animationId}`;
  const projectRelativePath = `${workspaceRelative}/${record.path}`;
  const raw = await readFile(path.join(root, projectRelativePath));
  invariant(sha256Buffer(raw) === record.sha256, `${animationId}: ${artifactId} compressed SHA-256 is stale`);
  if (record.uncompressedSha256) {
    invariant(sha256Buffer(gunzipSync(raw)) === record.uncompressedSha256,
      `${animationId}: ${artifactId} uncompressed SHA-256 is stale`);
  }
  return {
    artifactId,
    path: projectRelativePath,
    sha256: record.sha256,
    ...(record.uncompressedSha256 ? {uncompressedSha256: record.uncompressedSha256} : {}),
  };
}

function courseXmlLineEvidence(raw, currentPlacement, expectedRelativePath) {
  const line = currentPlacement?.exactPlacement?.evidence?.line;
  if (!Number.isInteger(line) || line < 1) return {status: "blocked-unresolved", issue: "exact course XML placement has no valid source line"};
  const lines = raw.toString("utf8").replace(/\r\n?/g, "\n").split("\n");
  const sourceLine = lines[line - 1];
  if (sourceLine === undefined || !sourceLine.includes(`>${expectedRelativePath}</Page>`)) {
    return {status: "blocked-unresolved", issue: `course XML line ${line} does not contain the exact target placement`};
  }
  const text = `${sourceLine}\n`;
  return {
    status: "source-line-proven",
    line,
    normalization: "CRLF-or-CR-to-LF; selected line plus one LF",
    text,
    sha256: sha256Buffer(Buffer.from(text, "utf8")),
  };
}

async function createReport({root, config, ffdec, swfmill, sourceContext, generatedBy}) {
  const animationId = config.animationId;
  const workspaceRelative = `migrations/${animationId}`;
  const inventoryRelative = `${workspaceRelative}/audit/scenario-inventory.json`;
  const inventoryRaw = await readFile(path.join(root, inventoryRelative));
  const inventory = JSON.parse(inventoryRaw);
  invariant(inventory.animationId === animationId, `${animationId}: scenario inventory animationId mismatch`);
  const targetBinding = deriveTargetEntryBinding(inventory);
  const childSource = await inspectFrozenSource(root, sourceContext, inventory.source.swf, "target-child-swf");
  invariant(childSource.sha256 === inventory.source.swfSha256,
    `${animationId}: scenario inventory child SHA-256 differs from frozen source`);
  const sourceHost = await inspectFrozenSource(root, sourceContext, targetBinding.observations.sourceHostPath, "same-lesson-index-local-swf");
  const courseXml = await inspectFrozenSource(root, sourceContext, targetBinding.observations.courseXmlPath, "same-lesson-course-xml");
  invariant(courseXml.sha256 === inventory.courseXml?.artifact?.sha256,
    `${animationId}: scenario inventory course XML SHA-256 differs from frozen source`);
  const inventoryTechnicalSha256 = scenarioInventorySha256(inventory);
  const machineEvidence = await Promise.all([
    inspectMachineEvidence(root, animationId, inventory, "swfmill-xml"),
    inspectMachineEvidence(root, animationId, inventory, "ffdec-scripts"),
  ]);
  const [hostStructure, hostScripts, childScripts] = await Promise.all([
    buildHostStructure({root, sourceHost, swfmill, config}),
    exportScripts({
      sourceAbsolute: path.join(root, sourceHost.path),
      ffdec,
      definitions: config.hostScripts,
      temporaryPrefix: `help-math-${animationId}-host-`,
    }),
    exportScripts({
      sourceAbsolute: path.join(root, childSource.path),
      ffdec,
      definitions: [CHILD_ENTRY_SCRIPT],
      temporaryPrefix: `help-math-${animationId}-child-`,
    }),
  ]);
  const xmlLine = courseXmlLineEvidence(
    await readFile(path.join(root, courseXml.path)),
    inventory.courseXml?.currentPlacement,
    targetBinding.observations.childRelativeToLesson,
  );
  const qualificationIssues = [
    ...targetBinding.issues,
    ...hostStructure.issues,
    ...hostScripts.missingArtifacts.map((artifact) => `host FFDec script is missing: ${artifact}`),
    ...hostScripts.excerpts.filter(Boolean).flatMap((excerpt) => excerpt.missingTokens.map((token) => `host excerpt ${excerpt.artifact} lacks ${JSON.stringify(token)}`)),
    ...childScripts.missingArtifacts.map((artifact) => `child FFDec script is missing: ${artifact}`),
    ...childScripts.excerpts.filter(Boolean).flatMap((excerpt) => excerpt.missingTokens.map((token) => `child excerpt ${excerpt.artifact} lacks ${JSON.stringify(token)}`)),
    ...(xmlLine.status === "blocked-unresolved" ? [xmlLine.issue] : []),
  ];
  const bindingStatus = qualificationIssues.length ? "blocked-unresolved" : "static-candidate-runtime-unverified";
  const selectedHostExcerpts = hostScripts.excerpts.filter(Boolean);
  const spanishCheckObserved = selectedHostExcerpts.some(({text}) => text.includes("_root.doCheckSpanishAudio()"));
  const boundaryEvidence = selectedHostExcerpts
    .filter(({role}) => role.includes("full-shell-prev-next"))
    .map(({role, artifact, timelineId, frame, lineStart, lineEnd, normalizedSha256}) => ({
      role,
      artifact,
      timelineId,
      frame,
      lineStart,
      lineEnd,
      normalizedSha256,
    }));
  const boundarySourceProven = boundaryEvidence.length === 2
    && boundaryEvidence.some(({role}) => role === "root-frame-50-full-shell-prev-next-monitor")
    && boundaryEvidence.some(({role}) => role === "root-frame-35-full-shell-prev-next-terminal-boundary-function");

  return {
    schemaVersion: 1,
    artifactType: "help-math-same-lesson-shell-host-entry-binding",
    animationId,
    bindingStatus,
    scope: "deterministic-read-only-static-same-lesson-shell-handoff-candidate",
    generatedBy,
    sourceFreeze: sourceContext.freeze,
    sources: {
      targetChild: childSource,
      sameLessonHost: sourceHost,
      courseXml: {...courseXml, exactActivePlacementLine: xmlLine},
    },
    scenarioInventory: {
      path: inventoryRelative,
      fullFileSha256: sha256Buffer(inventoryRaw),
      hashMode: CANONICAL_PROJECTION_ENCODING,
      projection: SCENARIO_INVENTORY_PROJECTION.id,
      excludedPaths: [...SCENARIO_INVENTORY_PROJECTION.excludedPaths],
      sha256: inventoryTechnicalSha256,
      technicalSha256: inventoryTechnicalSha256,
      machineEvidence,
    },
    protocol: {
      id: config.protocol,
      childEntryRequest: childScripts,
      sameLessonHostStructure: hostStructure,
      sameLessonHostActionScript: hostScripts,
      targetRootEntry: targetBinding.entryTarget,
      targetObservations: targetBinding.observations,
      targetBindingStatus: targetBinding.status,
      sourceDerivedCandidateSequence: bindingStatus === "static-candidate-runtime-unverified" ? [
        "The target child root frame 1 requests _level0.InternalPreloader.gotoAndPlay(\"jump_check\") and stops.",
        "The same-lesson index_local.swf places animation_mc and InternalPreloader together on its root timeline.",
        "The shell InternalPreloader source checks the loaded child and calls animation_mc.gotoAndPlay(\"begin\").",
        "The target child has exactly one root label begin aligned with exactly one root placement named animation.",
      ] : [],
      qualificationIssues,
    },
    fullShellBoundaryQualification: {
      status: boundarySourceProven ? "source-monitor-proven-runtime-ordering-unresolved" : "blocked-unresolved",
      evidence: boundaryEvidence,
      sourceMonitorMayStopNestedAnimationAtOrBeyondTotalFrames: boundarySourceProven,
      firstCycleBoundaryPlayingClassification: "admissible-only-as-a-minimal-child-entry-adapter-candidate-if-separately-source-proven; not-proven-for-the-complete-same-lesson-shell",
      fullShellEventFreeTerminalProofAllowed: false,
      authorizedRuntimeEventOrderingRequired: true,
      statement: "The root-frame-50 enterFrame monitor calls doCheckPrevAndNext; that function can stop _root.animation_mc.animation when its current frame reaches or exceeds its total frames. Therefore a first-cycle-boundary-playing state is only a minimal child-entry adapter candidate. Complete same-lesson shell stop/wrap ordering must be determined by authorized execution.",
    },
    spanishQualification: {
      sourceCallObservedInSelectedHostExcerpt: spanishCheckObserved,
      observedCall: spanishCheckObserved ? "_root.doCheckSpanishAudio()" : null,
      globalSpanishEntryProtocolProven: false,
      status: "separate-blocker-unresolved",
      statement: "A local doCheckSpanishAudio call, when present, does not prove a global Spanish shell-entry protocol, Spanish language state, Spanish narration traversal, or audio synchronization.",
    },
    authority: {
      staticSameLessonHandoffCandidateProven: bindingStatus === "static-candidate-runtime-unverified",
      authorizedOriginalRuntimeReachedTarget: false,
      naturalEntryTimingProven: false,
      globalSpanishProtocolProven: false,
      feedbackFunctionsProven: false,
      audioExecutedOrListened: false,
      terminalOrReplayProven: false,
      fullShellTerminalSemanticsProven: false,
      eventFreeFullShellTerminalProof: false,
      fidelityClaimed: false,
      strictCompletionEffect: "none",
      migrationStatusChanged: false,
    },
    limitations: [
      "This artifact proves only a hash-bound static candidate for the generic same-lesson shell handoff; it is not an authorized original-runtime execution log.",
      "The active course XML placement corroborates lesson membership, but this artifact does not claim that index_local.swf reads that XML or naturally navigates to the target child.",
      "Static ActionScript and placement evidence does not establish load completion timing, natural entry timing, or that gotoAndPlay(\"begin\") executed for this target.",
      "The global Spanish entry protocol, language state, Spanish audio, audio timing, and pause/resume behavior remain unresolved.",
      "Host feedback functions, interaction branches, scoring, terminal behavior, and complete Replay state reset remain unresolved.",
      "The full shell's root-frame-50 doCheckPrevAndNext monitor may stop the nested animation at its total-frame boundary. first-cycle-boundary-playing is only a minimal child-entry adapter candidate; it is not event-free or full-shell terminal proof, and authorized execution must establish event ordering.",
      "This artifact performs no visual comparison, human review, owner acceptance, fidelity approval, strict validation, or migration status change.",
    ],
  };
}

async function compareOrWrite({root, relativePath, desired, check}) {
  const absolute = path.join(root, relativePath);
  if (check) {
    invariant(await exists(absolute), `${relativePath}: missing`);
    const observed = await readFile(absolute);
    invariant(observed.equals(desired),
      `${relativePath}: stale; expected ${sha256Buffer(desired)}, observed ${sha256Buffer(observed)}`);
  } else {
    await mkdir(path.dirname(absolute), {recursive: true});
    await writeFile(absolute, desired);
  }
  return {path: relativePath, sha256: sha256Buffer(desired)};
}

export async function buildSameLessonShellHostEntryBindings({
  root = projectRoot,
  ffdec: ffdecArgument = "ffdec",
  swfmill: swfmillArgument = "swfmill",
  ids = TARGETS.map(({animationId}) => animationId),
  check = false,
} = {}) {
  for (const id of ids) invariant(TARGET_BY_ID.has(id), `Unsupported animation ID: ${id}`);
  const [scriptRaw, sourceContext, ffdec, swfmill] = await Promise.all([
    readFile(scriptPath),
    loadFrozenSourceContext(root),
    inspectFfdec(ffdecArgument),
    inspectSwfmill(swfmillArgument),
  ]);
  const generatedBy = {
    script: "scripts/build-same-lesson-shell-host-entry-bindings.mjs",
    scriptSha256: sha256Buffer(scriptRaw),
    sourceCatalog: {
      path: sourceContext.catalog.path,
      sha256: sourceContext.catalog.sha256,
      checksumSetSha256: sourceContext.catalog.checksumSetSha256,
    },
    toolchain: {
      ffdec: {version: ffdec.version, jarSha256: ffdec.jarSha256},
      swfmill: {version: swfmill.version, executableSha256: swfmill.executableSha256},
    },
  };
  const outputs = [];
  for (const id of ids) {
    const report = await createReport({
      root,
      config: TARGET_BY_ID.get(id),
      ffdec,
      swfmill,
      sourceContext,
      generatedBy,
    });
    const relativePath = `migrations/${id}/audit/same-lesson-shell-host-entry-binding.json`;
    outputs.push(await compareOrWrite({
      root,
      relativePath,
      desired: Buffer.from(stableJson(report), "utf8"),
      check,
    }));
  }
  return outputs;
}

function helpText() {
  return `Usage: node scripts/build-same-lesson-shell-host-entry-bindings.mjs [options]\n\nOptions:\n  --id <animation-id>   Select one of the three registered targets; repeatable\n  --check               Re-extract and verify checked-in reports without writing\n  --ffdec <command>     FFDec 26.2.1 launcher (default: ffdec)\n  --swfmill <command>   swfmill 0.3.6 launcher (default: swfmill)\n  --root <directory>    Project root (default: repository root)\n  -h, --help            Show this help\n`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(helpText());
    return;
  }
  const outputs = await buildSameLessonShellHostEntryBindings(options);
  process.stdout.write(`${options.check ? "Verified" : "Generated"} ${outputs.length} same-lesson shell host-entry binding report(s):\n`);
  for (const output of outputs) process.stdout.write(`- ${output.path} sha256:${output.sha256}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
