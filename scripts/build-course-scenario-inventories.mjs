#!/usr/bin/env node

import {spawn} from "node:child_process";
import {createHash, randomUUID} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";
import {
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultMigrationsRoot = path.join(projectRoot, "migrations");
const defaultLessonReleasesPath = path.join(projectRoot, "catalog", "lesson-releases.json");
const preservedSourceRoot = path.join(projectRoot, "source-assets", "flash", "HELP MATH_ORIGINAL FILES");
const SAFE_CATALOG_ID = /^[a-z0-9][a-z0-9-]{2,127}$/;
const PRESERVED_SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const READINESS_SCENARIO_PROJECTION_IDS = new Set([
  "course-g04-l03-ts-006",
  "course-g05-l04-fq-001",
  "shell-course-g04-l03-index-local",
]);
const READINESS_SCENARIO_INCLUDED_PATHS = Object.freeze([
  "animationId",
  "machineAudit.observedBehaviorFromExtractedScripts",
  "branchCaptureReadiness.requiredScenarioInventory",
  "branchCaptureReadiness.missing",
]);

export const COURSE_PILOT_IDS = Object.freeze([
  "course-g03-l01-ts-008",
  "course-g03-l01-vb-004",
  "course-g03-l06-fq-002-review",
  "course-g03-l06-ti-001",
  "course-g03-l08-re-001",
  "course-g04-l01-ir-001",
  "course-g04-l03-in-009",
  "course-g04-l09-gs-002",
  "course-g05-l13-rw-002",
  "shell-course-g04-l01-index-local",
]);

export const G4_L3_LESSON_AUDIT_IDS = Object.freeze([
  "course-g04-l03-ir-001-341242cc",
  "course-g04-l03-rw-002",
  "course-g04-l03-rw-003",
  "course-g04-l03-rw-004",
  "course-g04-l03-vb-002",
  "course-g04-l03-vb-003",
  "course-g04-l03-vb-004",
  "course-g04-l03-vb-005",
  "course-g04-l03-vb-006",
  "course-g04-l03-vb-007",
  "course-g04-l03-vb-008",
  "course-g04-l03-vb-009",
  "course-g04-l03-in-002",
  "course-g04-l03-in-003",
  "course-g04-l03-in-004",
  "course-g04-l03-in-005",
  "course-g04-l03-in-006",
  "course-g04-l03-in-007",
  "course-g04-l03-in-008",
  "course-g04-l03-in-009",
  "course-g04-l03-in-010",
  "course-g04-l03-in-011",
  "course-g04-l03-in-012",
  "course-g04-l03-ti-002",
  "course-g04-l03-ti-003",
  "course-g04-l03-ti-004",
  "course-g04-l03-ti-005",
  "course-g04-l03-ti-006",
  "course-g04-l03-gs-002",
  "course-g04-l03-ts-002",
  "course-g04-l03-ts-003",
  "course-g04-l03-ts-004",
  "course-g04-l03-ts-005",
  "course-g04-l03-ts-006",
  "course-g04-l03-ts-007",
  "course-g04-l03-ts-008",
  "course-g04-l03-fq-001",
  "course-g04-l03-fq-002",
  "course-g04-l03-fq-003",
  "shell-course-g04-l03-index-local",
]);

export const COURSE_AUDIT_IDS = Object.freeze([
  ...new Set([...COURSE_PILOT_IDS, ...G4_L3_LESSON_AUDIT_IDS]),
]);

const PYTHON_SWFMILL_EXTRACTOR = String.raw`
import gzip
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

def descendants_named(node, name):
    return [item for item in node.iter() if local_name(item.tag) == name]

with gzip.open(source, "rb") as handle:
    tree = ET.parse(handle)

root = tree.getroot()
header = next((item for item in root.iter() if local_name(item.tag) == "Header"), None)
if header is None:
    raise RuntimeError("swfmill XML has no Header")
root_tags = child_named(header, "tags")
if root_tags is None:
    raise RuntimeError("swfmill XML Header has no tags")

definitions = {}
sprites = {}
buttons = {}
edit_texts = {}
exports = []

for node in list(root_tags):
    name = local_name(node.tag)
    object_id = node.attrib.get("objectID")
    if object_id and name.startswith("Define"):
        definitions[object_id] = name
    if name == "DefineSprite" and object_id:
        sprites[object_id] = node
    elif name in ("DefineButton", "DefineButton2") and object_id:
        hit_records = []
        buttons_node = child_named(node, "buttons")
        if buttons_node is not None:
            for record in list(buttons_node):
                if local_name(record.tag) != "Button" or record.attrib.get("hitTest") != "1":
                    continue
                transform_node = next((item for item in record.iter() if local_name(item.tag) == "Transform"), None)
                hit_records.append({
                    "shapeObjectId": record.attrib.get("objectID"),
                    "depth": record.attrib.get("depth"),
                    "transform": dict(transform_node.attrib) if transform_node is not None else {},
                })
        conditions = []
        conditions_node = child_named(node, "conditions")
        if conditions_node is not None:
            conditions = [dict(item.attrib) for item in list(conditions_node) if local_name(item.tag) == "Condition"]
        buttons[object_id] = {
            "objectId": object_id,
            "definitionTag": name,
            "hitRecords": hit_records,
            "conditions": conditions,
        }
    elif name == "DefineEditText" and object_id:
        bounds_node = next((item for item in node.iter() if local_name(item.tag) == "Rectangle"), None)
        edit_texts[object_id] = {
            "objectId": object_id,
            "attributes": dict(node.attrib),
            "boundsTwips": dict(bounds_node.attrib) if bounds_node is not None else {},
        }
    elif name == "Export":
        for symbol in descendants_named(node, "Symbol"):
            exports.append({"objectId": symbol.attrib.get("objectID"), "name": symbol.attrib.get("name", "")})

def inspect_timeline(timeline_id, object_id, tags_node, declared_frames):
    current_frame = 1
    labels = []
    action_frames = []
    placements = []
    remove_frames = []
    for node in list(tags_node):
        name = local_name(node.tag)
        if name == "ShowFrame":
            current_frame += 1
        elif name == "FrameLabel":
            labels.append({"frame": current_frame, "label": node.attrib.get("label", "")})
        elif name in ("DoAction", "DoInitAction"):
            action_frames.append({"frame": current_frame, "tag": name})
        elif name in ("PlaceObject", "PlaceObject2", "PlaceObject3"):
            placements.append({
                "frame": current_frame,
                "tag": name,
                "objectId": node.attrib.get("objectID"),
                "depth": node.attrib.get("depth"),
                "name": node.attrib.get("name", ""),
                "replace": node.attrib.get("replace", ""),
                "hasClipActions": any(local_name(item.tag) in ("ClipActionRecord", "CLIPACTIONRECORD") for item in node.iter()),
            })
        elif name in ("RemoveObject", "RemoveObject2"):
            remove_frames.append({"frame": current_frame, "tag": name, "depth": node.attrib.get("depth")})
    observed_frames = sum(1 for node in list(tags_node) if local_name(node.tag) == "ShowFrame")
    return {
        "timelineId": timeline_id,
        "objectId": object_id,
        "declaredFrameCount": int(declared_frames) if str(declared_frames).isdigit() else None,
        "observedShowFrameCount": observed_frames,
        "frameLabels": labels,
        "actionFrames": action_frames,
        "placements": placements,
        "removeFrames": remove_frames,
    }

timelines = [inspect_timeline("root", None, root_tags, header.attrib.get("frames"))]
for object_id, node in sorted(sprites.items(), key=lambda item: int(item[0])):
    tags_node = child_named(node, "tags")
    if tags_node is None:
        continue
    timelines.append(inspect_timeline("sprite-" + object_id, object_id, tags_node, node.attrib.get("frames")))

timeline_by_object = {item["objectId"]: item for item in timelines if item["objectId"] is not None}
reachable_objects = set()
frontier = [placement["objectId"] for placement in timelines[0]["placements"] if placement["objectId"]]
while frontier:
    object_id = frontier.pop()
    if object_id in reachable_objects:
        continue
    reachable_objects.add(object_id)
    timeline = timeline_by_object.get(object_id)
    if timeline is not None:
        frontier.extend(placement["objectId"] for placement in timeline["placements"] if placement["objectId"])

all_placements = [
    dict(placement, timelineId=timeline["timelineId"])
    for timeline in timelines
    for placement in timeline["placements"]
]
for button in buttons.values():
    button["placements"] = [item for item in all_placements if item["objectId"] == button["objectId"]]
for edit_text in edit_texts.values():
    edit_text["placements"] = [item for item in all_placements if item["objectId"] == edit_text["objectId"]]

for timeline in timelines:
    timeline["structuralReachability"] = "root" if timeline["timelineId"] == "root" else (
        "reachable-from-root-placement-graph" if timeline["objectId"] in reachable_objects else "not-proven-by-root-placement-graph"
    )
    timeline["placementCount"] = len(timeline["placements"])
    timeline["namedPlacements"] = [item for item in timeline["placements"] if item["name"]]
    del timeline["placements"]

print(json.dumps({
    "parser": "Python xml.etree.ElementTree over gzip stream",
    "header": dict(header.attrib),
    "definitionTypes": definitions,
    "timelines": timelines,
    "buttons": [buttons[key] for key in sorted(buttons, key=lambda value: int(value))],
    "editTexts": [edit_texts[key] for key in sorted(edit_texts, key=lambda value: int(value))],
    "exports": exports,
    "structurallyReachableObjectIds": sorted(reachable_objects, key=lambda value: int(value)),
}, sort_keys=True, separators=(",", ":")))
`;

const PYTHON_COURSE_XML_EXTRACTOR = String.raw`
import json
import re
import sys
import xml.etree.ElementTree as ET

source = sys.argv[1]
with open(source, "r", encoding="utf-8-sig") as handle:
    raw = handle.read()

bare_ampersand = re.compile(r"&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9A-Fa-f]+;)")
sanitized, replacement_count = bare_ampersand.subn("&amp;", raw)
root = ET.fromstring(sanitized)

def text(node, child_name):
    child = node.find(child_name)
    return "" if child is None or child.text is None else child.text.strip()

sections = []
for section in root.findall("Section"):
    title = section.find("Title")
    pages = []
    for page in section.findall("Page"):
        pages.append({
            "path": "" if page.text is None else page.text.strip(),
            "attributes": dict(page.attrib),
        })
    subpages = []
    for page in section.findall("SubPageTitle"):
        subpages.append({
            "path": "" if page.text is None else page.text.strip(),
            "attributes": dict(page.attrib),
        })
    sections.append({
        "name": section.attrib.get("SName", ""),
        "attributes": dict(section.attrib),
        "titles": {
            "english": text(title, "English") if title is not None else "",
            "spanish": text(title, "Spanish") if title is not None else "",
        },
        "pages": pages,
        "subpages": subpages,
    })

print(json.dumps({
    "parser": "Python xml.etree.ElementTree after in-memory bare-ampersand repair",
    "bareAmpersandRepairs": replacement_count,
    "lesson": {
        "courseName": text(root, "CourseName"),
        "title": text(root, "NewTitle1"),
        "lessonName": text(root, "LessonName"),
        "lessonNumber": text(root, "LessonNumber"),
        "pageRoot": text(root, "PageRoot"),
    },
    "sections": sections,
}, sort_keys=True, separators=(",", ":")))
`;

const CALL_KEYWORDS = new Set(["if", "for", "while", "switch", "catch", "function", "on", "else"]);
const SIDE_EFFECT_APIS = Object.freeze([
  {pattern: /\bgetURL\s*\(/g, api: "getURL", kind: "network-or-host-navigation", safeMode: "blocked-record-only"},
  {pattern: /\bfscommand\s*\(/g, api: "fscommand", kind: "host-command", safeMode: "blocked-record-only"},
  {pattern: /\bloadMovie(?:Num)?\s*\(/g, api: "loadMovie", kind: "dynamic-movie-load", safeMode: "local-allowlist-only"},
  {pattern: /\.loadMovie\s*\(/g, api: "loadMovie", kind: "dynamic-movie-load", safeMode: "local-allowlist-only"},
  {pattern: /\bunloadMovie(?:Num)?\s*\(/g, api: "unloadMovie", kind: "dynamic-movie-unload", safeMode: "local-fixture-only"},
  {pattern: /\.unloadMovie\s*\(/g, api: "unloadMovie", kind: "dynamic-movie-unload", safeMode: "local-fixture-only"},
  {pattern: /\bloadVariables(?:Num)?\s*\(/g, api: "loadVariables", kind: "network-data-load", safeMode: "blocked-local-fixture-only"},
  {pattern: /\bSharedObject\b/g, api: "SharedObject", kind: "persistent-storage", safeMode: "ephemeral-memory-only"},
  {pattern: /\.flush\s*\(/g, api: "SharedObject.flush-candidate", kind: "persistent-storage-write", safeMode: "ephemeral-memory-only"},
  {pattern: /\b(?:new\s+)?XML\s*\(/g, api: "XML", kind: "xml-object-or-load", safeMode: "local-fixture-only"},
  {pattern: /\.[Ll]oad\s*\(/g, api: "object.load-candidate", kind: "xml-or-data-load", safeMode: "blocked-local-fixture-only"},
  {pattern: /\.loadSound\s*\(/g, api: "loadSound", kind: "dynamic-audio-load", safeMode: "local-allowlist-only"},
  {pattern: /\.sendAndLoad\s*\(/g, api: "sendAndLoad", kind: "network-data-send", safeMode: "blocked-record-only"},
  {pattern: /\bExternalInterface\b/g, api: "ExternalInterface", kind: "javascript-bridge", safeMode: "blocked-record-only"},
  {pattern: /\bLocalConnection\b/g, api: "LocalConnection", kind: "local-process-bridge", safeMode: "blocked-record-only"},
  {pattern: /\bXMLSocket\b|\bSocket\b|\bNetConnection\b/g, api: "socket-or-net-connection", kind: "network-connection", safeMode: "blocked"},
  {pattern: /javascript:/gi, api: "javascript-url", kind: "javascript-bridge", safeMode: "blocked-record-only"},
]);

function portable(value) {
  return value.split(path.sep).join("/");
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort(compareText);
}

function hashText(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
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

function isContainedPath(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

async function lstatOrNull(candidate) {
  try {
    return await lstat(candidate);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function inputStatIdentity(information) {
  return {
    dev: String(information.dev),
    ino: String(information.ino),
    mode: String(information.mode),
    size: String(information.size),
    mtimeNs: String(information.mtimeNs),
    ctimeNs: String(information.ctimeNs),
    nlink: String(information.nlink),
  };
}

function sameInputStatIdentity(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function assertOrdinaryInputAncestors(
  containmentRoot,
  candidate,
  label,
) {
  const resolvedRoot = path.resolve(containmentRoot);
  const resolvedCandidate = path.resolve(candidate);
  if (!isContainedPath(resolvedRoot, resolvedCandidate)) {
    throw new Error(`${label} escapes its containment root`);
  }
  const rootInformation = await lstat(resolvedRoot, {bigint: true});
  if (
    !rootInformation.isDirectory() ||
    rootInformation.isSymbolicLink()
  ) {
    throw new Error(`${label} containment root must be a real directory`);
  }
  const realRoot = await realpath(resolvedRoot);
  let cursor = resolvedRoot;
  const relativeParent = path.relative(
    resolvedRoot,
    path.dirname(resolvedCandidate),
  );
  for (const segment of relativeParent.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const information = await lstat(cursor, {bigint: true});
    if (!information.isDirectory() || information.isSymbolicLink()) {
      throw new Error(`${label} ancestor must be a real directory`);
    }
    if (!isContainedPath(realRoot, await realpath(cursor))) {
      throw new Error(`${label} ancestor escapes its containment root`);
    }
  }
  return {resolvedCandidate, realRoot};
}

export async function readScenarioInputSnapshot(
  candidate,
  {
    containmentRoot = projectRoot,
    label = candidate,
  } = {},
) {
  const {resolvedCandidate, realRoot} =
    await assertOrdinaryInputAncestors(
      containmentRoot,
      candidate,
      label,
    );
  const before = await lstat(resolvedCandidate, {bigint: true});
  if (
    !before.isFile() ||
    before.isSymbolicLink() ||
    before.nlink !== 1n
  ) {
    throw new Error(`${label} must be one ordinary single-link file`);
  }
  const realFile = await realpath(resolvedCandidate);
  if (!isContainedPath(realRoot, realFile)) {
    throw new Error(`${label} resolves outside its containment root`);
  }
  const handle = await open(
    resolvedCandidate,
    fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW || 0),
  );
  let descriptorBefore;
  let descriptorAfter;
  let bytes;
  try {
    descriptorBefore = await handle.stat({bigint: true});
    if (
      !descriptorBefore.isFile() ||
      descriptorBefore.nlink !== 1n ||
      !sameInputStatIdentity(
        inputStatIdentity(before),
        inputStatIdentity(descriptorBefore),
      )
    ) {
      throw new Error(`${label} changed before stable input read`);
    }
    bytes = await handle.readFile();
    descriptorAfter = await handle.stat({bigint: true});
    if (
      !sameInputStatIdentity(
        inputStatIdentity(descriptorBefore),
        inputStatIdentity(descriptorAfter),
      )
    ) {
      throw new Error(`${label} changed during stable input read`);
    }
  } finally {
    await handle.close();
  }
  const after = await lstat(resolvedCandidate, {bigint: true});
  if (
    !sameInputStatIdentity(
      inputStatIdentity(descriptorAfter),
      inputStatIdentity(after),
    ) ||
    (await realpath(resolvedCandidate)) !== realFile ||
    bytes.length !== Number(after.size)
  ) {
    throw new Error(`${label} changed after stable input read`);
  }
  return {
    kind: "file",
    path: resolvedCandidate,
    containmentRoot: path.resolve(containmentRoot),
    label,
    realPath: realFile,
    bytes,
    byteLength: bytes.length,
    sha256: hashText(bytes),
    stat: inputStatIdentity(after),
  };
}

async function readScenarioDirectorySnapshot(
  candidate,
  {
    containmentRoot = projectRoot,
    label = candidate,
  } = {},
) {
  const {resolvedCandidate, realRoot} =
    await assertOrdinaryInputAncestors(
      containmentRoot,
      path.join(candidate, ".directory-snapshot"),
      label,
    );
  const resolvedDirectory = path.dirname(resolvedCandidate);
  const before = await lstat(resolvedDirectory, {bigint: true});
  if (!before.isDirectory() || before.isSymbolicLink()) {
    throw new Error(`${label} must be one ordinary directory`);
  }
  const realDirectory = await realpath(resolvedDirectory);
  if (!isContainedPath(realRoot, realDirectory)) {
    throw new Error(`${label} resolves outside its containment root`);
  }
  return {
    kind: "directory",
    path: resolvedDirectory,
    containmentRoot: path.resolve(containmentRoot),
    label,
    realPath: realDirectory,
    stat: inputStatIdentity(before),
  };
}

async function readOptionalScenarioInputSnapshot(
  candidate,
  {
    containmentRoot = projectRoot,
    label = candidate,
  } = {},
) {
  const {resolvedCandidate} = await assertOrdinaryInputAncestors(
    containmentRoot,
    candidate,
    label,
  );
  const information = await lstatOrNull(resolvedCandidate);
  if (!information) {
    return {
      kind: "absent",
      path: resolvedCandidate,
      containmentRoot: path.resolve(containmentRoot),
      label,
    };
  }
  return readScenarioInputSnapshot(resolvedCandidate, {
    containmentRoot,
    label,
  });
}

async function assertScenarioInputSnapshotUnchanged(snapshot) {
  if (snapshot.kind === "absent") {
    await assertOrdinaryInputAncestors(
      snapshot.containmentRoot,
      snapshot.path,
      snapshot.label,
    );
    if (await lstatOrNull(snapshot.path)) {
      throw new Error(`${snapshot.label} appeared after preflight`);
    }
    return;
  }
  if (snapshot.kind === "directory") {
    await assertOrdinaryInputAncestors(
      snapshot.containmentRoot,
      path.join(snapshot.path, ".directory-snapshot"),
      snapshot.label,
    );
    const information = await lstat(snapshot.path, {bigint: true});
    if (
      !information.isDirectory() ||
      information.isSymbolicLink() ||
      (await realpath(snapshot.path)) !== snapshot.realPath ||
      !sameInputStatIdentity(
        snapshot.stat,
        inputStatIdentity(information),
      )
    ) {
      throw new Error(`${snapshot.label} changed after preflight`);
    }
    return;
  }
  const current = await readScenarioInputSnapshot(snapshot.path, {
    containmentRoot: snapshot.containmentRoot,
    label: snapshot.label,
  });
  if (
    current.realPath !== snapshot.realPath ||
    current.byteLength !== snapshot.byteLength ||
    current.sha256 !== snapshot.sha256 ||
    !sameInputStatIdentity(current.stat, snapshot.stat)
  ) {
    throw new Error(`${snapshot.label} changed after preflight`);
  }
}

async function assertScenarioInputSetUnchanged(snapshots) {
  const unique = new Map(
    snapshots.map((snapshot) => [
      `${snapshot.kind}:${snapshot.path}`,
      snapshot,
    ]),
  );
  for (const snapshot of unique.values()) {
    await assertScenarioInputSnapshotUnchanged(snapshot);
  }
}

async function ensureOrdinaryDirectoryTree(root, directory, {create = true} = {}) {
  const resolvedRoot = path.resolve(root);
  const resolvedDirectory = path.resolve(directory);
  if (!isContainedPath(resolvedRoot, resolvedDirectory)) {
    throw new Error(`Scenario output parent escapes the migration root: ${resolvedDirectory}`);
  }
  const rootMetadata = await lstat(resolvedRoot);
  if (!rootMetadata.isDirectory() || rootMetadata.isSymbolicLink()) {
    throw new Error("Migration root must be an ordinary directory");
  }
  const rootReal = await realpath(resolvedRoot);
  let cursor = resolvedRoot;
  const relative = path.relative(resolvedRoot, resolvedDirectory);
  for (const segment of relative ? relative.split(path.sep) : []) {
    cursor = path.join(cursor, segment);
    let metadata = await lstatOrNull(cursor);
    if (!metadata) {
      if (!create) {
        throw new Error(`Scenario output directory is missing: ${cursor}`);
      }
      await mkdir(cursor, {mode: 0o700});
      metadata = await lstat(cursor);
    }
    if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
      throw new Error(`Scenario output ancestor must be an ordinary directory: ${cursor}`);
    }
    const cursorReal = await realpath(cursor);
    if (!isContainedPath(rootReal, cursorReal)) {
      throw new Error(`Scenario output ancestor resolves outside the migration root: ${cursor}`);
    }
  }
  return rootReal;
}

async function readOrdinaryTargetBinding(candidate, rootReal, {allowMissing = true} = {}) {
  const metadata = await lstatOrNull(candidate);
  if (!metadata) {
    if (allowMissing) return {exists: false};
    throw new Error(`Scenario inventory is missing: ${candidate}`);
  }
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.nlink !== 1) {
    throw new Error(`Scenario output must be one ordinary, non-linked file: ${candidate}`);
  }
  const targetReal = await realpath(candidate);
  if (!isContainedPath(rootReal, targetReal)) {
    throw new Error(`Scenario output resolves outside the migration root: ${candidate}`);
  }
  const bytes = await readFile(candidate);
  return {
    exists: true,
    dev: String(metadata.dev),
    ino: String(metadata.ino),
    size: metadata.size,
    mtimeMs: metadata.mtimeMs,
    sha256: hashText(bytes),
    bytes,
  };
}

function sameTargetBinding(left, right) {
  if (left.exists !== right.exists) return false;
  if (!left.exists) return true;
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.size === right.size &&
    left.mtimeMs === right.mtimeMs &&
    left.sha256 === right.sha256
  );
}

async function writeExclusiveOrdinaryFile(candidate, bytes, rootReal) {
  await writeFile(candidate, bytes, {flag: "wx", mode: 0o600});
  const binding = await readOrdinaryTargetBinding(candidate, rootReal, {allowMissing: false});
  if (binding.sha256 !== hashText(bytes)) {
    throw new Error(`Staged scenario output changed while it was being written: ${candidate}`);
  }
}

async function unlinkOwnedTemporary(candidate, expectedSha256, rootReal) {
  const binding = await readOrdinaryTargetBinding(candidate, rootReal, {allowMissing: true});
  if (!binding.exists) return;
  if (binding.sha256 !== expectedSha256) {
    throw new Error(`Refusing to remove a changed scenario transaction file: ${candidate}`);
  }
  await unlink(candidate);
}

async function writeScenarioInventoryTransaction(prepared, migrationsRoot, transactionHooks = {}) {
  const nonce = randomUUID();
  const staged = [];
  const inputSnapshots = prepared.flatMap(
    ({inputSnapshots = []}) => inputSnapshots,
  );
  let rootReal = null;

  try {
    await assertScenarioInputSetUnchanged(inputSnapshots);
    for (const [index, item] of prepared.entries()) {
      const expectedOutput = path.resolve(
        migrationsRoot,
        item.id,
        "audit",
        "scenario-inventory.json",
      );
      if (path.resolve(item.outputPath) !== expectedOutput) {
        throw new Error(`${item.id}: inventory builder returned an unexpected workspace`);
      }
      rootReal = await ensureOrdinaryDirectoryTree(migrationsRoot, path.dirname(expectedOutput));
      const initial = await readOrdinaryTargetBinding(expectedOutput, rootReal);
      const stagePath = path.join(
        path.dirname(expectedOutput),
        `.scenario-inventory.${nonce}.${index}.stage`,
      );
      const backupPath = initial.exists
        ? path.join(path.dirname(expectedOutput), `.scenario-inventory.${nonce}.${index}.backup`)
        : null;
      const renderedBytes = Buffer.from(item.rendered, "utf8");
      await writeExclusiveOrdinaryFile(stagePath, renderedBytes, rootReal);
      if (backupPath) {
        await writeExclusiveOrdinaryFile(backupPath, initial.bytes, rootReal);
      }
      staged.push({
        ...item,
        expectedOutput,
        rootReal,
        initial,
        stagePath,
        stageSha256: hashText(renderedBytes),
        backupPath,
        backupSha256: initial.exists ? initial.sha256 : null,
        committed: false,
      });
    }

    // Compare-and-swap guard: no selected target may change after staging and
    // before the transaction starts committing.
    for (const item of staged) {
      const current = await readOrdinaryTargetBinding(item.expectedOutput, item.rootReal);
      if (!sameTargetBinding(item.initial, current)) {
        throw new Error(`${item.id}: scenario output changed during transaction staging`);
      }
    }
    await assertScenarioInputSetUnchanged(inputSnapshots);

    for (const [index, item] of staged.entries()) {
      await assertScenarioInputSetUnchanged(inputSnapshots);
      const current = await readOrdinaryTargetBinding(item.expectedOutput, item.rootReal);
      if (!sameTargetBinding(item.initial, current)) {
        throw new Error(`${item.id}: scenario output changed immediately before commit`);
      }
      if (transactionHooks.beforeCommit) {
        await transactionHooks.beforeCommit({id: item.id, index, outputPath: item.expectedOutput});
      }
      await assertScenarioInputSetUnchanged(inputSnapshots);
      await rename(item.stagePath, item.expectedOutput);
      item.committed = true;
      const committed = await readOrdinaryTargetBinding(item.expectedOutput, item.rootReal, {
        allowMissing: false,
      });
      if (committed.sha256 !== item.stageSha256) {
        throw new Error(`${item.id}: committed scenario output failed verification`);
      }
    }
    await assertScenarioInputSetUnchanged(inputSnapshots);

    for (const item of staged) {
      if (item.backupPath) {
        await unlinkOwnedTemporary(item.backupPath, item.backupSha256, item.rootReal);
      }
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const item of [...staged].reverse()) {
      try {
        if (item.committed) {
          if (item.backupPath) {
            const backup = await readOrdinaryTargetBinding(item.backupPath, item.rootReal, {
              allowMissing: false,
            });
            if (backup.sha256 !== item.backupSha256) {
              throw new Error(`${item.id}: scenario rollback backup changed`);
            }
            await rename(item.backupPath, item.expectedOutput);
          } else {
            await unlinkOwnedTemporary(item.expectedOutput, item.stageSha256, item.rootReal);
          }
        } else {
          await unlinkOwnedTemporary(item.stagePath, item.stageSha256, item.rootReal);
          if (item.backupPath) {
            await unlinkOwnedTemporary(item.backupPath, item.backupSha256, item.rootReal);
          }
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError.message);
      }
    }
    if (rollbackErrors.length) {
      throw new Error(`${error.message}; rollback also failed: ${rollbackErrors.join("; ")}`, {
        cause: error,
      });
    }
    throw error;
  }
}

function run(command, argumentsList, {timeoutMs = 120_000} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argumentsList, {
      cwd: projectRoot,
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

export function parseArguments(argumentsList) {
  const options = {
    migrationsRoot: defaultMigrationsRoot,
    lessonReleasesPath: defaultLessonReleasesPath,
    releaseId: "",
    ids: [],
    python: "python3",
    check: false,
  };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--check") options.check = true;
    else if (["--migrations", "--lesson-releases", "--release-id", "--id", "--python"].includes(value)) {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--migrations") options.migrationsRoot = path.resolve(next);
      else if (value === "--lesson-releases") options.lessonReleasesPath = path.resolve(next);
      else if (value === "--release-id") options.releaseId = next;
      else if (value === "--id") options.ids.push(next);
      else options.python = next;
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function assertSafeCatalogId(value, label) {
  if (!SAFE_CATALOG_ID.test(value || "")) throw new Error(`${label} is not a safe catalog ID: ${value}`);
}

function assertSafeCatalogSourcePath(value, label) {
  if (
    typeof value !== "string" ||
    !value.endsWith(".swf") ||
    path.posix.isAbsolute(value) ||
    value.includes("\\") ||
    value.split("/").includes("..") ||
    path.posix.normalize(value) !== value
  ) {
    throw new Error(`${label} is not a safe catalog SWF path`);
  }
}

export function selectVerifiedLessonReleaseMembers(catalog, requestedIds, {releaseId = ""} = {}) {
  if (catalog?.schemaVersion !== 1 || !Array.isArray(catalog.releases)) {
    throw new Error("Lesson release catalog is malformed");
  }
  if (!Array.isArray(requestedIds) || !requestedIds.length) {
    throw new Error("Explicit lesson-release member IDs are required");
  }
  if (new Set(requestedIds).size !== requestedIds.length) {
    throw new Error("Explicit lesson-release member IDs must not be repeated");
  }
  for (const id of requestedIds) assertSafeCatalogId(id, "Requested animationId");
  if (!releaseId) throw new Error("Exact lesson release ID is required");
  assertSafeCatalogId(releaseId, "Requested lesson release ID");

  const requested = new Set(requestedIds);
  const matches = new Map();
  const allAnimationIds = new Set();
  const selectedReleases = catalog.releases.filter((release) => release?.releaseId === releaseId);
  if (selectedReleases.length !== 1) {
    throw new Error(
      selectedReleases.length
        ? `Lesson release ID is duplicated: ${releaseId}`
        : `Unknown lesson release: ${releaseId}`,
    );
  }
  for (const release of selectedReleases) {
    assertSafeCatalogId(release?.releaseId, "Lesson release ID");
    if (release.publicationMode !== "atomic") {
      throw new Error(`${release.releaseId}: publicationMode must remain atomic`);
    }
    if (
      !Number.isSafeInteger(release.expectedCounts?.members) ||
      release.expectedCounts.members <= 0 ||
      !Array.isArray(release.members) ||
      release.members.length !== release.expectedCounts.members
    ) {
      throw new Error(`${release.releaseId}: release membership is incomplete`);
    }
    for (const [index, member] of release.members.entries()) {
      if (member?.ordinal !== index + 1) {
        throw new Error(`${release.releaseId}: member ordinals must be contiguous`);
      }
      assertSafeCatalogId(member.animationId, `${release.releaseId} member animationId`);
      if (allAnimationIds.has(member.animationId)) {
        throw new Error(`Duplicate lesson-release animationId: ${member.animationId}`);
      }
      allAnimationIds.add(member.animationId);
      if (!/^[a-f0-9]{64}$/.test(member.source?.sha256 || "")) {
        throw new Error(`${member.animationId}: release source SHA-256 is malformed`);
      }
      if (member.assetId !== `swf-${member.source.sha256}`) {
        throw new Error(`${member.animationId}: release assetId does not match source SHA-256`);
      }
      assertSafeCatalogSourcePath(member.source.path, `${member.animationId} release source path`);
      if (typeof member.releaseRole !== "string" || !member.releaseRole.length) {
        throw new Error(`${member.animationId}: releaseRole is missing`);
      }
      if (!requested.has(member.animationId)) continue;
      matches.set(member.animationId, {
        releaseId: release.releaseId,
        publicationMode: release.publicationMode,
        expectedMemberCount: release.expectedCounts.members,
        ordinal: member.ordinal,
        animationId: member.animationId,
        assetId: member.assetId,
        releaseRole: member.releaseRole,
        source: {
          path: member.source.path,
          sha256: member.source.sha256,
        },
      });
    }
  }
  const missing = requestedIds.filter((id) => !matches.has(id));
  if (missing.length) {
    throw new Error(`Explicit ID(s) are not verified lesson-release members: ${missing.join(", ")}`);
  }
  return requestedIds.map((id) => matches.get(id));
}

async function loadVerifiedLessonReleaseMemberships(lessonReleasesPath, requestedIds, releaseId) {
  const absolutePath = path.resolve(lessonReleasesPath);
  const relativePath = portable(path.relative(projectRoot, absolutePath));
  if (!relativePath || relativePath === ".." || relativePath.startsWith("../")) {
    throw new Error("Lesson release catalog must stay inside the project root");
  }
  const snapshot = await readScenarioInputSnapshot(absolutePath, {
    containmentRoot: projectRoot,
    label: "Lesson release catalog",
  });
  const bytes = snapshot.bytes;
  const catalog = JSON.parse(bytes.toString("utf8"));
  let selectedIds = [...requestedIds];
  if (!selectedIds.length) {
    if (catalog?.schemaVersion !== 1 || !Array.isArray(catalog.releases)) {
      throw new Error("Lesson release catalog is malformed");
    }
    const selectedReleases = catalog.releases.filter(
      (release) => release?.releaseId === releaseId,
    );
    if (selectedReleases.length !== 1) {
      throw new Error(
        selectedReleases.length
          ? `Lesson release ID is duplicated: ${releaseId}`
          : `Unknown lesson release: ${releaseId}`,
      );
    }
    if (!Array.isArray(selectedReleases[0].members)) {
      throw new Error(`${releaseId}: release membership is incomplete`);
    }
    selectedIds = selectedReleases[0].members.map(
      (member) => member?.animationId,
    );
  }
  const members = selectVerifiedLessonReleaseMembers(
    catalog,
    selectedIds,
    {releaseId},
  );
  const catalogBinding = {
    path: relativePath,
    bytes: bytes.length,
    sha256: hashText(bytes),
  };
  return {
    ids: selectedIds,
    members: new Map(members.map((member) => [
      member.animationId,
      {...member, catalogBinding},
    ])),
    inputSnapshots: [snapshot],
  };
}

function evidenceRef(block, line, scriptsArtifactId = "ffdec-scripts") {
  return {
    artifactId: scriptsArtifactId,
    script: block.script,
    line,
  };
}

function collectLineSignals(line, lineNumber, block) {
  const calls = [];
  const assignments = [];
  const transitions = [];
  const scopeReferences = [];
  const conditionals = [];
  const randomCalls = [];
  const sideEffects = [];
  const callPattern = /((?:_root|_parent|_global|_level\d+|this|[A-Za-z_$][\w$]*)(?:(?:\.[A-Za-z_$][\w$]*)|(?:\[[^\]\n]+\]))*)\s*\(([^;]*)\)/g;
  for (const match of line.matchAll(callPattern)) {
    const target = match[1];
    const last = target.split(".").at(-1)?.replace(/\[.*$/, "") || target;
    if (CALL_KEYWORDS.has(last)) continue;
    const item = {target, arguments: match[2].trim(), evidence: evidenceRef(block, lineNumber)};
    calls.push(item);
    if (/^(?:gotoAndStop|gotoAndPlay|play|stop|nextFrame|prevFrame)$/.test(last)) transitions.push(item);
    if (last === "random") randomCalls.push(item);
  }
  const assignmentPattern = /((?:_root|_parent|_global|_level\d+)(?:(?:\.[A-Za-z_$][\w$]*)|(?:\[[^\]\n]+\]))*)\s*(\+\+|--|[+\-*/]?=)\s*([^;]*)/g;
  for (const match of line.matchAll(assignmentPattern)) {
    assignments.push({target: match[1], operator: match[2], expression: match[3].trim(), evidence: evidenceRef(block, lineNumber)});
  }
  const referencePattern = /\b(_(?:root|parent|global|level\d+)(?:(?:\.[A-Za-z_$][\w$]*)|(?:\[[^\]\n]+\]))*)/g;
  for (const match of line.matchAll(referencePattern)) scopeReferences.push(match[1]);
  const conditionalPattern = /\b(?:if|else\s+if|while)\s*\((.+)\)\s*$/g;
  for (const match of line.matchAll(conditionalPattern)) {
    conditionals.push({condition: match[1].trim(), evidence: evidenceRef(block, lineNumber)});
  }
  for (const descriptor of SIDE_EFFECT_APIS) {
    descriptor.pattern.lastIndex = 0;
    if (!descriptor.pattern.test(line)) continue;
    sideEffects.push({
      api: descriptor.api,
      kind: descriptor.kind,
      safeFixtureMode: descriptor.safeMode,
      sourceLine: line.trim().slice(0, 500),
      evidence: evidenceRef(block, lineNumber),
    });
  }
  const uniqueSideEffects = [...new Map(sideEffects.map((item) => [`${item.api}:${item.kind}:${item.evidence.line}:${item.sourceLine}`, item])).values()];
  return {calls, assignments, transitions, scopeReferences, conditionals, randomCalls, sideEffects: uniqueSideEffects};
}

function classifyBlock(block) {
  const value = block.body;
  const categories = [];
  if (/showRightFeed|arrayCorrectAnswer|\bCorrect\b/i.test(value)) categories.push("correct-outcome");
  if (/showWrongFeed|arrayWrongAnswer|\bIncorrect\b|WrongFeed/i.test(value)) categories.push("wrong-outcome");
  if (/KeyAttribute|DoHyperLinks|Glossary|glossary/i.test(value)) categories.push("glossary-or-hyperlink");
  if (/random\s*\(/i.test(value)) categories.push("random-selection");
  if (/startDrag|stopDrag|dragger|scrollDragger/i.test(value)) categories.push("drag");
  if (/Replay|replay|repeat|restart/i.test(`${block.script}\n${value}`)) categories.push("replay-explicit");
  if (/Final|Finish|Result|complete/i.test(`${block.script}\n${value}`)) categories.push("terminal-or-result");
  if (/loadMovie|unloadMovie|loadAnimationPage|gotoAnd|nextFrame|prevFrame/i.test(value)) categories.push("navigation-or-timeline");
  if (/Sound|Audio|Mute|Volume|spanSound|gSound/i.test(value)) categories.push("audio-control");
  if (/popup|Mc_Popup/i.test(value)) categories.push("popup");
  if (/calculator|AddDigit|DoOperator|operand|decimal/i.test(value)) categories.push("calculator");
  if (/Key\.isDown|on\(key|Selection|onChanged|onScroller/i.test(value)) categories.push("keyboard-or-input");
  if (/getURL|fscommand|SharedObject|loadMovie|loadVariables|ExternalInterface|javascript:/i.test(value)) categories.push("side-effect");
  return uniqueSorted(categories);
}

export function summarizeFfdecTags(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const counts = {};
  const frameLabels = [];
  const definitions = [];
  const scriptTags = [];
  const exports = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.match(/^([0-9a-f]+):\s+\d+\.\s+([A-Za-z][A-Za-z0-9]+)/i);
    if (!match) continue;
    const [, byteOffset, tag] = match;
    counts[tag] = (counts[tag] || 0) + 1;
    const evidence = {artifactId: "ffdec-tags", line: index + 1, byteOffset: `0x${byteOffset}`};
    const character = line.match(/\bchid:\s*(-?\d+)/)?.[1] || null;
    if (/^Define/.test(tag)) definitions.push({tag, characterId: character, evidence});
    if (/^(?:DoAction|DoInitAction)$/.test(tag)) scriptTags.push({tag, characterId: character, evidence});
    if (tag === "FrameLabel") frameLabels.push({name: line.match(/name:\s*"([^"]*)"/)?.[1] || "", evidence});
    if (/^Export/.test(tag)) exports.push({tag, characterId: character, exportName: line.match(/exp:\s*"([^"]*)"/)?.[1] || "", evidence});
  }
  return {tagCounts: counts, definitions, scriptTags, frameLabels, exports};
}

export function parseScriptBundle(text, {
  compressedSha256 = "",
  contentSha256 = hashText(text),
  artifactId = "ffdec-scripts",
} = {}) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const headings = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^===== (.+) =====$/);
    if (match) headings.push({index, script: match[1]});
  }
  const blocks = headings.map((heading, position) => {
    const endIndex = (headings[position + 1]?.index ?? lines.length) - 1;
    const bodyLines = lines.slice(heading.index + 1, endIndex + 1);
    while (bodyLines.at(-1) === "") bodyLines.pop();
    const body = bodyLines.join("\n");
    const spriteMatch = heading.script.match(/DefineSprite_(\d+)\/frame_(\d+)/);
    const buttonMatch = heading.script.match(/DefineButton2?_(\d+)/);
    const clipMatch = heading.script.match(/PlaceObject2?_(\d+)_(\d+)/);
    const rootFrameMatch = heading.script.match(/^frame_(\d+)/);
    const eventMatch = `${heading.script}\n${body}`.match(/\bon\(([^)]*)\)/);
    const block = {
      id: `script-${String(position + 1).padStart(4, "0")}`,
      script: heading.script,
      bodySha256: hashText(body),
      lineStart: heading.index + 1,
      lineEnd: heading.index + 1 + bodyLines.length,
      scope: spriteMatch ? {kind: "sprite", objectId: spriteMatch[1], frame: Number(spriteMatch[2])}
        : rootFrameMatch ? {kind: "root", objectId: null, frame: Number(rootFrameMatch[1])}
          : buttonMatch ? {kind: "button-definition", objectId: buttonMatch[1], frame: null}
            : {kind: "other", objectId: null, frame: null},
      hitTargetCandidate: clipMatch ? {objectId: clipMatch[1], depth: clipMatch[2]} : null,
      event: eventMatch ? eventMatch[1].split(",").map((item) => item.trim()).filter(Boolean) : [],
      categories: [],
      signals: {
        calls: [],
        assignments: [],
        transitions: [],
        scopeReferences: [],
        conditionals: [],
        randomCalls: [],
        sideEffects: [],
      },
      evidence: {artifactId, script: heading.script, lineStart: heading.index + 1, lineEnd: heading.index + 1 + bodyLines.length},
    };
    for (let offset = 0; offset < bodyLines.length; offset += 1) {
      const signals = collectLineSignals(bodyLines[offset], heading.index + 2 + offset, block);
      for (const [key, values] of Object.entries(signals)) block.signals[key].push(...values);
    }
    block.signals.scopeReferences = uniqueSorted(block.signals.scopeReferences);
    block.categories = classifyBlock({...block, body});
    return block;
  });
  return {
    artifact: {
      artifactId,
      path: "audit/machine/ffdec-scripts.txt.gz",
      sha256: compressedSha256,
      uncompressedSha256: contentSha256,
      uncompressedLineCount: lines.length,
    },
    blocks,
  };
}

export async function extractSwfmillEvidence(xmlGzipPath, {python = "python3"} = {}) {
  const {stdout} = await run(python, ["-c", PYTHON_SWFMILL_EXTRACTOR, xmlGzipPath]);
  return JSON.parse(stdout);
}

export async function extractCourseXmlEvidence(xmlPath, {python = "python3"} = {}) {
  const {stdout} = await run(python, ["-c", PYTHON_COURSE_XML_EXTRACTOR, xmlPath]);
  return JSON.parse(stdout);
}

function annotateHitTargets(blocks, swfmill) {
  const buttons = new Map(swfmill.buttons.map((item) => [item.objectId, item]));
  const timelines = new Map(swfmill.timelines.map((item) => [item.timelineId, item]));
  const contextFor = (timelineId, frame) => {
    const timeline = timelines.get(timelineId);
    if (!timeline || !Number.isInteger(frame)) return {timelineId, frame, activeFrameLabel: null};
    const active = timeline.frameLabels.filter((item) => item.frame <= frame).sort((left, right) => right.frame - left.frame)[0] || null;
    return {timelineId, frame, activeFrameLabel: active};
  };
  return blocks.map((block) => {
    const direct = block.scope.kind === "button-definition" ? buttons.get(block.scope.objectId) : null;
    const timelineId = block.scope.kind === "root" ? "root" : block.scope.kind === "sprite" ? `sprite-${block.scope.objectId}` : null;
    const timelineContext = timelineId ? contextFor(timelineId, block.scope.frame) : null;
    if (!direct && !block.hitTargetCandidate) return {...block, timelineContext};
    return {
      ...block,
      timelineContext,
      hitTarget: direct ? {
        source: "DefineButton hit-test records and placement graph",
        buttonObjectId: direct.objectId,
        hitRecords: direct.hitRecords,
        placements: direct.placements.map((placement) => ({
          ...placement,
          timelineContext: contextFor(placement.timelineId, placement.frame),
        })),
        exactStageBoundsStatus: "not-derived-from-hit-shape-geometry",
      } : {
        source: "placed clip event handler path",
        objectId: block.hitTargetCandidate.objectId,
        depth: block.hitTargetCandidate.depth,
        exactStageBoundsStatus: "not-derived-from-placement-matrix-and-shape-geometry",
      },
    };
  });
}

function annotateCourseXml(text, parsed, manifest, xmlPath, xmlSha256) {
  const rawLines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const sections = parsed.sections.map((section) => ({
    ...section,
    pages: section.pages.map((page) => {
      const line = rawLines.findIndex((candidate) => candidate.includes(`>${page.path}</Page>`)) + 1;
      return {...page, evidence: {artifactId: "course-xml", line: line || null}};
    }),
    subpages: section.subpages.map((page) => {
      const line = rawLines.findIndex((candidate) => candidate.includes(`>${page.path}</SubPageTitle>`)) + 1;
      return {...page, evidence: {artifactId: "course-xml", line: line || null}};
    }),
  }));
  const lessonBase = manifest.source.swf.split("/").slice(0, -1);
  const lessonMarker = lessonBase.findIndex((part) => /^L\d+$/.test(part));
  const relativeFromLesson = lessonMarker >= 0 ? manifest.source.swf.split("/").slice(lessonMarker + 1).join("/") : path.basename(manifest.source.swf);
  const activePages = sections.flatMap((section) => section.pages.map((page) => ({...page, section: section.name})));
  const exactPlacement = activePages.find((page) => page.path === relativeFromLesson) || null;
  const basenameMatches = activePages.filter((page) => path.basename(page.path) === path.basename(manifest.source.swf));
  return {
    artifact: {artifactId: "course-xml", path: portable(path.relative(projectRoot, xmlPath)), sha256: xmlSha256},
    parseMethod: parsed.parser,
    parserSha256: hashText(PYTHON_COURSE_XML_EXTRACTOR),
    bareAmpersandRepairs: parsed.bareAmpersandRepairs,
    lesson: parsed.lesson,
    sections,
    activePageCount: activePages.length,
    currentPlacement: {
      sourceRelativePath: relativeFromLesson,
      matchStatus: exactPlacement ? "exact-active-page" : basenameMatches.length ? "basename-only-conflict" : "not-present-as-active-page",
      exactPlacement,
      basenameMatches,
    },
  };
}

function courseXmlPathForManifest(manifest) {
  const match = manifest.source.swf.match(/(.*\/HELP_COURSES\/ELMGR\d+\/L\d+)\//);
  if (!match) throw new Error(`${manifest.animationId}: could not derive lesson index.xml path`);
  return path.join(projectRoot, match[1], "index.xml");
}

function topBinding(reference) {
  const match = reference.match(/^(_(?:root|parent|global|level\d+))(?:\.([A-Za-z_$][\w$]*))?/);
  return match ? `${match[1]}${match[2] ? `.${match[2]}` : ""}` : reference;
}

function literalValue(expression) {
  const value = expression.trim();
  if (value === "true") return {kind: "boolean", value: true};
  if (value === "false") return {kind: "boolean", value: false};
  if (value === "null") return {kind: "null", value: null};
  if (value === "undefined") return {kind: "undefined", value: "undefined"};
  if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(value)) return {kind: "number", value: Number(value)};
  const stringMatch = value.match(/^(["'])([\s\S]*)\1$/);
  if (stringMatch) return {kind: "string", value: stringMatch[2]};
  if (/^new\s+Array\s*\(\s*\)$/.test(value) || /^\[\s*\]$/.test(value)) return {kind: "empty-array", value: []};
  if (/^\[[\s\S]*\]$/.test(value)) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return {kind: "array-literal", value: parsed};
    } catch {
      // Preserve the exact expression below when it is not strict JSON; never eval legacy code.
    }
  }
  return null;
}

function buildDependencies(blocks) {
  const byBinding = new Map();
  for (const block of blocks) {
    for (const reference of block.signals.scopeReferences) {
      const binding = topBinding(reference);
      if (!byBinding.has(binding)) byBinding.set(binding, {binding, references: new Set(), evidence: [], calls: [], assignments: []});
      const item = byBinding.get(binding);
      item.references.add(reference);
      item.evidence.push(block.evidence);
    }
    for (const call of block.signals.calls) {
      if (!/^_(?:root|parent|global|level\d+)\b/.test(call.target)) continue;
      const binding = topBinding(call.target);
      if (!byBinding.has(binding)) byBinding.set(binding, {binding, references: new Set(), evidence: [], calls: [], assignments: []});
      byBinding.get(binding).calls.push(call);
    }
    for (const assignment of block.signals.assignments) {
      const binding = topBinding(assignment.target);
      if (!byBinding.has(binding)) byBinding.set(binding, {binding, references: new Set(), evidence: [], calls: [], assignments: []});
      byBinding.get(binding).assignments.push(assignment);
    }
  }
  const bindings = [...byBinding.values()].sort((left, right) => compareText(left.binding, right.binding)).map((item) => {
    const literalCandidates = item.assignments.map((assignment) => ({
      expression: assignment.expression,
      parsedLiteral: literalValue(assignment.expression),
      evidence: assignment.evidence,
    }));
    const externallyScoped = /^_(?:root|parent|level\d+)\b/.test(item.binding);
    const unassigned = item.assignments.length === 0;
    return {
      binding: item.binding,
      scope: item.binding.split(".")[0],
      references: uniqueSorted(item.references),
      observedCalls: item.calls,
      observedAssignments: item.assignments,
      sourceInitializationCandidates: literalCandidates,
      fixtureRequirement: externallyScoped || unassigned ? "required-or-explicitly-proven-absent" : "shared-state-must-be-initialized-per-scenario",
      originalDefaultStatus: literalCandidates.length === 1 && literalCandidates[0].parsedLiteral ? "single-source-literal-candidate-not-runtime-proven" : "unresolved-or-multiple-runtime-values",
      safeFixture: item.calls.length ? {
        mode: "recording-inert-function-or-object-until-state-effects-are-specified",
        originalBehaviorClaimed: false,
      } : {
        mode: "explicit-scenario-value-required; no guessed legacy default",
        originalBehaviorClaimed: false,
      },
      evidence: item.evidence[0] || item.assignments[0]?.evidence || item.calls[0]?.evidence,
    };
  });
  const flashVarsCandidates = bindings.filter((item) => item.scope === "_root" && item.observedAssignments.length === 0).map((item) => ({
    binding: item.binding,
    status: "external-host-or-FlashVars-candidate-not-proven-as-FlashVars",
    evidence: item.evidence,
  }));
  return {bindings, flashVarsCandidates};
}

const STATIC_BINDING_DISPOSITIONS = new Set([
  "intrinsic-avm1-global-namespace",
  "child-embedded-component-bootstrap",
  "child-self-initialized-before-use",
  "intrinsic-display-list-parent",
]);

export function applyHostBindingResolution(dependencies, report) {
  if (!report) return dependencies;
  if (report.schemaVersion !== 1) throw new Error("host-binding resolution schemaVersion must be 1");
  const byBinding = new Map(dependencies.bindings.map((item) => [item.binding, item]));
  const resolutions = new Map();
  for (const item of report.bindings || []) {
    if (!byBinding.has(item.binding)) throw new Error(`host-binding resolution names an absent binding: ${item.binding}`);
    if (!STATIC_BINDING_DISPOSITIONS.has(item.disposition)) throw new Error(`${item.binding}: unsupported static binding disposition ${item.disposition}`);
    if (item.fixturePolicy !== "do-not-inject-or-override") throw new Error(`${item.binding}: resolved bindings must fail closed against fixture injection`);
    if (!Array.isArray(item.evidence) || !item.evidence.length || !item.evidence.every((entry) => typeof entry.artifactId === "string" && entry.artifactId)) {
      throw new Error(`${item.binding}: resolved binding requires evidence`);
    }
    if (resolutions.has(item.binding)) throw new Error(`${item.binding}: duplicate host-binding resolution`);
    resolutions.set(item.binding, item);
  }
  return {
    ...dependencies,
    bindings: dependencies.bindings.map((binding) => {
      const resolution = resolutions.get(binding.binding);
      if (!resolution) return binding;
      return {
        ...binding,
        fixtureRequirement: "none-intrinsic-or-child-self-initialized",
        originalDefaultStatus: "not-applicable-no-host-default",
        safeFixture: {
          mode: "do-not-inject-or-override",
          originalBehaviorClaimed: false,
        },
        staticResolution: {
          status: "resolved-by-hash-verified-static-source-evidence",
          disposition: resolution.disposition,
          rationale: resolution.rationale,
          evidence: resolution.evidence,
          strictAcceptanceEffect: resolution.strictAcceptanceEffect,
        },
      };
    }),
    hostBindingResolution: {
      status: report.status,
      resolvedBindings: [...resolutions.keys()].sort(compareText),
      bindingsNotCoveredByThisReport: dependencies.bindings
        .map((item) => item.binding)
        .filter((binding) => !resolutions.has(binding)),
      entryHandoff: report.entryHandoff || null,
      evidence: {artifactId: "host-binding-resolution"},
      strictAcceptanceEffect: report.strictAcceptanceEffect,
    },
  };
}

function buildTimelineStates(blocks, swfmill) {
  const blocksByTimeline = new Map();
  for (const block of blocks) {
    if (!Number.isInteger(block.scope.frame)) continue;
    const timelineId = block.scope.kind === "root" ? "root" : `sprite-${block.scope.objectId}`;
    if (!blocksByTimeline.has(timelineId)) blocksByTimeline.set(timelineId, []);
    blocksByTimeline.get(timelineId).push(block);
  }
  return swfmill.timelines.map((timeline) => {
    const frameReasons = new Map();
    const add = (frame, reason, evidence = null) => {
      if (!Number.isInteger(frame) || frame < 1) return;
      if (!frameReasons.has(frame)) frameReasons.set(frame, {frame, reasons: [], evidence: []});
      const item = frameReasons.get(frame);
      item.reasons.push(reason);
      if (evidence) item.evidence.push(evidence);
    };
    add(1, "initial-one-indexed-frame", {artifactId: "swfmill-xml", timelineId: timeline.timelineId});
    add(timeline.declaredFrameCount || timeline.observedShowFrameCount, "terminal-structural-frame", {artifactId: "swfmill-xml", timelineId: timeline.timelineId});
    for (const label of timeline.frameLabels) add(label.frame, `frame-label:${label.label}`, {artifactId: "swfmill-xml", timelineId: timeline.timelineId});
    for (const action of timeline.actionFrames) add(action.frame, `structural-action:${action.tag}`, {artifactId: "swfmill-xml", timelineId: timeline.timelineId});
    for (const block of blocksByTimeline.get(timeline.timelineId) || []) {
      add(block.scope.frame, block.event.length ? `event-handler:${block.event.join("+")}` : "exported-action-script", block.evidence);
      if (block.signals.calls.some((call) => /(?:^|\.)stop$/.test(call.target)) || /(^|\n)stop\s*\(\s*\)/.test(block.body || "")) {
        add(block.scope.frame, "script-stop-state", block.evidence);
      }
    }
    return {
      timelineId: timeline.timelineId,
      objectId: timeline.objectId,
      frameCount: timeline.declaredFrameCount || timeline.observedShowFrameCount,
      frameDomain: {
        indexing: "one-indexed",
        start: 1,
        endInclusive: timeline.declaredFrameCount || timeline.observedShowFrameCount,
        captureRequirement: "every-frame-for-every-reachable-runtime-scenario",
      },
      structuralReachability: timeline.structuralReachability,
      controlStates: [...frameReasons.values()].sort((left, right) => left.frame - right.frame).map((item) => ({
        ...item,
        reasons: uniqueSorted(item.reasons),
      })),
      frameLabels: timeline.frameLabels,
      namedPlacements: timeline.namedPlacements,
      evidence: {artifactId: "swfmill-xml", timelineId: timeline.timelineId},
    };
  });
}

function handlerBehaviorGroups(blocks) {
  const handlers = blocks.filter((block) => block.event.length);
  const groups = new Map();
  for (const block of handlers) {
    const key = `${block.bodySha256}:${block.event.join(",")}`;
    if (!groups.has(key)) groups.set(key, {bodySha256: block.bodySha256, events: block.event, targets: [], categories: new Set()});
    const group = groups.get(key);
    group.targets.push({
      scriptId: block.id,
      script: block.script,
      scope: block.scope,
      hitTarget: block.hitTarget || null,
      evidence: block.evidence,
    });
    for (const category of block.categories) group.categories.add(category);
  }
  return [...groups.values()].sort((left, right) => compareText(left.bodySha256, right.bodySha256)).map((group, index) => ({
    scenarioId: `handler-group-${String(index + 1).padStart(3, "0")}`,
    purpose: "Execute every listed target; exact-identical handler bodies share expected behavior but placement context is still validated separately.",
    events: group.events,
    categories: [...group.categories].sort(compareText),
    bodySha256: group.bodySha256,
    executionRule: "each-target",
    targets: group.targets,
    expectedEvidenceSource: "the calls, assignments, transitions, and side effects in each target's script catalog entry",
  }));
}

function buildConditionObligations(blocks) {
  const conditions = new Map();
  for (const block of blocks) {
    for (const item of block.signals.conditionals) {
      if (!conditions.has(item.condition)) conditions.set(item.condition, []);
      conditions.get(item.condition).push(item.evidence);
    }
  }
  return [...conditions.entries()].sort(([left], [right]) => compareText(left, right)).map(([condition, evidence], index) => ({
    obligationId: `condition-${String(index + 1).padStart(3, "0")}`,
    condition,
    requiredOutcomes: ["true", "false"],
    feasibility: "runtime reachability must be proven; infeasible outcomes require a written exception, not silent omission",
    evidence,
  }));
}

function buildRandomObligations(blocks) {
  const calls = blocks.flatMap((block) => block.signals.randomCalls.map((call) => ({...call, scriptId: block.id})));
  return calls.map((call, index) => {
    const numeric = call.arguments.match(/^\s*(\d+)\s*$/);
    return {
      obligationId: `random-${String(index + 1).padStart(3, "0")}`,
      expression: `random(${call.arguments})`,
      requiredOutcomes: numeric ? Array.from({length: Number(numeric[1])}, (_, value) => value) : `each integer index in [0, ${call.arguments}) under a controlled fixture`,
      deterministicHarness: "record and inject the random result without enabling network, storage, or host side effects",
      evidence: call.evidence,
    };
  });
}

function buildLabelObligations(scriptText, timelines) {
  const labels = new Map();
  for (const timeline of timelines) {
    for (const item of timeline.frameLabels) {
      if (!/^(?:Q|R)\d+$/i.test(item.label) && !/^(?:Final|Finish|Result|Review)$/i.test(item.label)) continue;
      if (!labels.has(item.label)) labels.set(item.label, []);
      labels.get(item.label).push({artifactId: "swfmill-xml", timelineId: timeline.timelineId, frame: item.frame});
    }
  }
  for (const match of scriptText.matchAll(/["']((?:Q|R)\d+|Final|Finish|Result|Review)["']/g)) {
    if (!labels.has(match[1])) labels.set(match[1], []);
  }
  return [...labels.entries()].sort(([left], [right]) => left.localeCompare(right, undefined, {numeric: true})).map(([label, evidence]) => ({
    label,
    requiredCapture: "enter label with controlled prerequisite state, capture every frame through its next stop/transition, and exercise every handler placed in that state",
    outcomeRequirement: /^Q\d+$/i.test(label) ? "all response handlers, including correct and wrong where present" : /^R\d+$/i.test(label) ? "controlled correct/wrong/selected-answer review fixture" : "terminal/navigation state",
    evidence: evidence.length ? evidence : [{artifactId: "ffdec-scripts", note: "literal label in exported ActionScript"}],
  }));
}

function buildGlossaryObligations(blocks) {
  const terms = new Map();
  for (const block of blocks) {
    const assignments = block.signals.assignments.filter((item) => item.target === "_global.KeyAttribute");
    for (const assignment of assignments) {
      const parsed = literalValue(assignment.expression);
      if (parsed?.kind !== "string") continue;
      if (!terms.has(parsed.value)) terms.set(parsed.value, []);
      terms.get(parsed.value).push({scriptId: block.id, script: block.script, event: block.event, evidence: assignment.evidence});
    }
  }
  return [...terms.entries()].sort(([left], [right]) => compareText(left, right)).map(([term, handlers]) => ({
    term,
    executionRule: "activate every listed placement and assert the exact KeyAttribute plus the observed DoHyperLinks/stop behavior",
    handlers,
  }));
}

function buildReplayAndTerminal(blocks, timelineStates) {
  const replayCandidates = blocks.filter((block) => block.categories.includes("replay-explicit") || (
    block.event.length && block.signals.transitions.some((item) => /gotoAnd(?:Play|Stop)$/.test(item.target) && /^1\b/.test(item.arguments))
  )).map((block) => ({scriptId: block.id, script: block.script, status: block.categories.includes("replay-explicit") ? "explicit-name-or-text" : "frame-1-transition-candidate", evidence: block.evidence}));
  const terminalCandidates = blocks.filter((block) => block.categories.includes("terminal-or-result")).map((block) => ({scriptId: block.id, script: block.script, evidence: block.evidence}));
  for (const timeline of timelineStates) {
    terminalCandidates.push({timelineId: timeline.timelineId, frame: timeline.frameCount, status: "structural-last-frame-only-runtime-terminal-not-proven", evidence: timeline.evidence});
  }
  return {replayCandidates, terminalCandidates};
}

function buildRouteObligations(courseXml, swfmill, isShell) {
  const namedPlacements = swfmill.timelines.flatMap((timeline) => timeline.namedPlacements.map((item) => ({...item, timelineId: timeline.timelineId})));
  const pages = courseXml.sections.flatMap((section) => section.pages.map((page) => ({...page, section: section.name})));
  if (!isShell) return courseXml.currentPlacement.exactPlacement ? [{
    routeId: `current-${path.basename(courseXml.currentPlacement.exactPlacement.path, ".swf")}`,
    sourcePage: courseXml.currentPlacement.exactPlacement,
    action: "load the exact current placement through the inert course-shell fixture",
  }] : [];
  return pages.map((page) => {
    const buttonName = path.basename(page.path, ".swf");
    const placements = namedPlacements.filter((item) => item.name === buttonName || item.name.endsWith(buttonName));
    return {
      routeId: `page-${page.section.toLowerCase()}-${buttonName.toLowerCase()}`,
      sourcePage: page,
      expectedButtonName: buttonName,
      handlerPlacementEvidence: placements,
      action: "open the section menu, activate the exact named page target, and assert the local allowlisted SWF/modern route without network",
      mappingStatus: placements.length ? "named-placement-found" : "button-name-or-dynamic-map-unresolved",
    };
  });
}

function buildUnknowns({manifest, readiness, courseXml, swfmill, replayAndTerminal, dependencies, blocks}) {
  const unresolvedBindings = dependencies.bindings.filter((item) => item.fixtureRequirement !== "none-intrinsic-or-child-self-initialized");
  const unknowns = [
    {
      id: "runtime-reachability",
      statement: "Static placement reachability and exported scripts do not prove every state is reachable in Adobe runtime with the original parent shell.",
      resolution: "Traverse every generated state/handler/branch obligation in an authorized runtime and record the fixture plus capture hash.",
      evidence: {artifactId: "swfmill-xml"},
    },
    {
      id: "hit-geometry",
      statement: "Button hit shape object IDs and placements are known, but exact stage-space hit bounds were not derived from vector geometry and all nested matrices.",
      resolution: "Resolve matrices and hit shapes or record authoritative pointer-coordinate probes for every target.",
      evidence: {artifactId: "swfmill-xml"},
    },
    ...(unresolvedBindings.length ? [{
      id: "host-defaults",
      statement: dependencies.hostBindingResolution
        ? `${unresolvedBindings.length} external or unassigned runtime binding(s) remain after the hash-verified static resolution: ${unresolvedBindings.map((item) => item.binding).join(", ")}.`
        : "External _root/_parent/_level0 values and unassigned _global values have no guessed original defaults in this inventory.",
      resolution: "Use source initialization candidates where present; otherwise capture the original host values or keep the scenario unresolved.",
      evidence: unresolvedBindings[0]?.evidence || {artifactId: "ffdec-scripts"},
    }] : []),
    ...readiness.branchCaptureReadiness.missing.map((statement, index) => ({
      id: `readiness-missing-${String(index + 1).padStart(2, "0")}`,
      statement,
      resolution: "Must be supplied and evidenced before strict acceptance.",
      evidence: {artifactId: "strict-readiness"},
    })),
  ];
  const unreachable = swfmill.timelines.filter((timeline) => timeline.structuralReachability === "not-proven-by-root-placement-graph");
  if (unreachable.length) unknowns.push({
    id: "unproven-nested-timelines",
    statement: `${unreachable.length} DefineSprite timelines are not reached by the static root placement graph; attachMovie/exported-symbol or dead-code status is unresolved.`,
    affectedTimelineIds: unreachable.map((item) => item.timelineId),
    resolution: "Resolve dynamic linkage calls and runtime traversal; do not discard these timelines from acceptance coverage without proof.",
    evidence: {artifactId: "swfmill-xml"},
  });
  if (!replayAndTerminal.replayCandidates.length) unknowns.push({
    id: "replay-target",
    statement: "No exported handler is unambiguously named Replay/repeat/restart; frame-1 transitions alone do not prove Replay semantics.",
    resolution: "Identify the runtime Replay target and prove reset of timeline, score, random state, language, and audio.",
    evidence: {artifactId: "ffdec-scripts"},
  });
  if (courseXml.currentPlacement.matchStatus !== "exact-active-page" && manifest.animationId !== "shell-course-g04-l01-index-local") unknowns.push({
    id: "course-xml-placement-conflict",
    statement: `The source path is ${courseXml.currentPlacement.matchStatus} in active course XML.`,
    details: courseXml.currentPlacement,
    resolution: "Preserve the historical/Review placement and separately prove how the original shell reached it.",
    evidence: {artifactId: "course-xml"},
  });
  if (blocks.some((block) => block.signals.transitions.some((item) => /_global|_root|_parent|\[/.test(item.arguments)))) unknowns.push({
    id: "dynamic-timeline-targets",
    statement: "One or more goto transitions use dynamic expressions, so the finite destination set requires fixture/runtime proof.",
    resolution: "Enumerate every resolved destination under controlled fixture values and capture it.",
    evidence: {artifactId: "ffdec-scripts"},
  });
  return unknowns;
}

function validateEvidenceRef(reference) {
  return reference && typeof reference === "object" && typeof reference.artifactId === "string" && reference.artifactId.length > 0;
}

function readinessScenarioProjection(readiness) {
  return {
    animationId: readiness.animationId,
    machineAudit: {
      observedBehaviorFromExtractedScripts: readiness.machineAudit.observedBehaviorFromExtractedScripts,
    },
    branchCaptureReadiness: {
      requiredScenarioInventory: readiness.branchCaptureReadiness.requiredScenarioInventory,
      missing: readiness.branchCaptureReadiness.missing,
    },
  };
}

function readinessEvidenceRecord(manifest, readiness, readinessText) {
  if (!READINESS_SCENARIO_PROJECTION_IDS.has(manifest.animationId)) {
    return {artifactId: "strict-readiness", path: "audit/strict-readiness.json", sha256: hashText(readinessText)};
  }
  return {
    artifactId: "strict-readiness",
    sourcePath: "audit/strict-readiness.json",
    hashMode: "canonical-json-v1",
    projection: "course-scenario-readiness-inputs-v1",
    includedPaths: [...READINESS_SCENARIO_INCLUDED_PATHS],
    sha256: hashText(JSON.stringify(stable(readinessScenarioProjection(readiness)))),
    authorityBoundary: "The scenario inventory binds only the readiness fields it consumes, preventing a circular hash dependency on downstream protocol, disposition, or acquisition receipts.",
  };
}

function catalogSourcePath(sourcePath, label) {
  const portablePath = portable(sourcePath || "");
  if (!portablePath.startsWith(PRESERVED_SOURCE_PREFIX)) {
    throw new Error(`${label}: source path is outside the preserved source catalog`);
  }
  return portablePath.slice(PRESERVED_SOURCE_PREFIX.length);
}

function verifyLessonReleaseMembership(manifest, membership) {
  if (!membership) return null;
  if (
    membership.animationId !== manifest.animationId ||
    membership.assetId !== manifest.assetId ||
    membership.source.sha256 !== manifest.source.swfSha256 ||
    membership.source.path !== catalogSourcePath(manifest.source.swf, manifest.animationId) ||
    (
      manifest.source.placementPath &&
      membership.source.path !== catalogSourcePath(manifest.source.placementPath, manifest.animationId)
    )
  ) {
    throw new Error(`${manifest.animationId}: workspace identity differs from verified lesson-release membership`);
  }
  return {
    artifactId: "lesson-release-membership",
    path: membership.catalogBinding.path,
    sha256: membership.catalogBinding.sha256,
    bytes: membership.catalogBinding.bytes,
    releaseId: membership.releaseId,
    publicationMode: membership.publicationMode,
    expectedMemberCount: membership.expectedMemberCount,
    ordinal: membership.ordinal,
    animationId: membership.animationId,
    assetId: membership.assetId,
    releaseRole: membership.releaseRole,
    sourcePath: membership.source.path,
    sourceSha256: membership.source.sha256,
    authorityBoundary: "Exact lesson-release membership authorizes this static scenario-inventory input only; it does not establish runtime, implementation, review, strict completion, or publication.",
  };
}

export function validateScenarioInventory(inventory) {
  const errors = [];
  if (inventory.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  const releaseMembership = (inventory.evidenceIndex || []).filter(({artifactId}) => artifactId === "lesson-release-membership");
  if (!COURSE_AUDIT_IDS.includes(inventory.animationId)) {
    if (releaseMembership.length !== 1) {
      errors.push("non-legacy animationId requires one verified lesson-release membership");
    } else {
      const [membership] = releaseMembership;
      if (
        membership.animationId !== inventory.animationId ||
        membership.assetId !== `swf-${inventory.source?.swfSha256}` ||
        membership.sourceSha256 !== inventory.source?.swfSha256 ||
        !SAFE_CATALOG_ID.test(membership.releaseId || "") ||
        !Number.isSafeInteger(membership.ordinal) ||
        membership.ordinal <= 0
      ) {
        errors.push("lesson-release membership does not match inventory identity");
      }
    }
  } else if (releaseMembership.length > 1) {
    errors.push("legacy animationId has duplicate lesson-release membership evidence");
  }
  if (inventory.migrationStatusChanged !== false) errors.push("migrationStatusChanged must be false");
  if (inventory.inventoryStatus !== "static-exhaustive-runtime-unverified") errors.push("inventoryStatus must fail closed");
  if (!/^[a-f0-9]{64}$/.test(inventory.source?.swfSha256 || "")) errors.push("source SWF hash is invalid");
  if (!inventory.evidenceIndex?.every((item) => /^[a-f0-9]{64}$/.test(item.sha256 || ""))) errors.push("all evidence artifacts require SHA-256");
  if (!inventory.timelineInventory?.length || inventory.timelineInventory[0].timelineId !== "root") errors.push("root timeline is missing");
  if (!inventory.interactions?.handlers?.every((item) => validateEvidenceRef(item.evidence))) errors.push("every handler requires evidence");
  if (!inventory.coverage?.handlerBehaviorGroups?.every((item) => item.targets.length && item.targets.every((target) => validateEvidenceRef(target.evidence)))) errors.push("handler groups require evidenced targets");
  if (!Array.isArray(inventory.unknowns) || !inventory.unknowns.length || !inventory.unknowns.every((item) => validateEvidenceRef(item.evidence))) errors.push("unknowns must be explicit and evidenced");
  if (!inventory.dependencies?.safeSideEffectPolicy?.every((item) => item.safeFixtureMode && validateEvidenceRef(item.evidence))) errors.push("side effects require safe evidenced fixtures");
  if (errors.length) throw new Error(`${inventory.animationId || "inventory"}: ${errors.join("; ")}`);
  return true;
}

async function loadWorkspace(migrationsRoot, id) {
  const workspace = path.join(migrationsRoot, id);
  const manifestPath = path.join(workspace, "migration.json");
  const readinessPath = path.join(workspace, "audit", "strict-readiness.json");
  const reportPath = path.join(workspace, "audit", "machine", "report.json");
  const scriptsPath = path.join(workspace, "audit", "machine", "ffdec-scripts.txt.gz");
  const tagsPath = path.join(workspace, "audit", "machine", "ffdec-tags.txt.gz");
  const swfmillPath = path.join(workspace, "audit", "machine", "swfmill.xml.gz");
  const inputPaths = [
    ["manifest", manifestPath],
    ["strict readiness", readinessPath],
    ["machine report", reportPath],
    ["FFDec scripts", scriptsPath],
    ["FFDec tags", tagsPath],
    ["swfmill XML", swfmillPath],
  ];
  const inputSnapshots = [];
  for (const [label, candidate] of inputPaths) {
    try {
      inputSnapshots.push(
        await readScenarioInputSnapshot(candidate, {
          containmentRoot: migrationsRoot,
          label: `${id}: ${label}`,
        }),
      );
    } catch (error) {
      if (error?.code === "ENOENT" || /ENOENT/.test(error.message)) {
        throw new Error(
          `${id}: required evidence is missing: ${portable(
            path.relative(projectRoot, candidate),
          )}`,
          {cause: error},
        );
      }
      throw error;
    }
  }
  const [
    manifestSnapshot,
    readinessSnapshot,
    reportSnapshot,
    scriptsSnapshot,
    tagsSnapshot,
    swfmillSnapshot,
  ] = inputSnapshots;
  const manifestText = manifestSnapshot.bytes.toString("utf8");
  const readinessText = readinessSnapshot.bytes.toString("utf8");
  const reportText = reportSnapshot.bytes.toString("utf8");
  const scriptsGzip = scriptsSnapshot.bytes;
  const tagsGzip = tagsSnapshot.bytes;
  const swfmillGzip = swfmillSnapshot.bytes;
  const manifest = JSON.parse(manifestText);
  const readiness = JSON.parse(readinessText);
  const report = JSON.parse(reportText);
  if (manifest.animationId !== id || readiness.animationId !== id || report.animationId !== id) throw new Error(`${id}: identity mismatch in evidence`);
  const sourcePath = path.resolve(projectRoot, manifest.source.swf);
  const relativeSource = path.relative(preservedSourceRoot, sourcePath);
  if (relativeSource.startsWith("..") || path.isAbsolute(relativeSource)) throw new Error(`${id}: SWF is outside preserved source root`);
  const sourceSnapshot = await readScenarioInputSnapshot(sourcePath, {
    containmentRoot: preservedSourceRoot,
    label: `${id}: preserved SWF`,
  });
  if (sourceSnapshot.sha256 !== manifest.source.swfSha256) throw new Error(`${id}: preserved SWF hash differs from manifest`);
  inputSnapshots.push(sourceSnapshot);
  const reportScriptOutput = report.outputs.find((item) => item.path.endsWith("ffdec-scripts.txt.gz"));
  const reportTagsOutput = report.outputs.find((item) => item.path.endsWith("ffdec-tags.txt.gz"));
  const reportXmlOutput = report.outputs.find((item) => item.path.endsWith("swfmill.xml.gz"));
  const scriptsSha256 = hashText(scriptsGzip);
  const tagsSha256 = hashText(tagsGzip);
  const swfmillSha256 = hashText(swfmillGzip);
  if (scriptsSha256 !== reportScriptOutput?.sha256 || tagsSha256 !== reportTagsOutput?.sha256 || swfmillSha256 !== reportXmlOutput?.sha256) throw new Error(`${id}: machine evidence hash mismatch`);
  const scriptText = gunzipSync(scriptsGzip).toString("utf8");
  const tagsText = gunzipSync(tagsGzip).toString("utf8");
  if (hashText(scriptText) !== reportScriptOutput.uncompressedSha256) throw new Error(`${id}: uncompressed script hash mismatch`);
  if (hashText(tagsText) !== reportTagsOutput.uncompressedSha256) throw new Error(`${id}: uncompressed FFDec tag hash mismatch`);
  return {
    workspace,
    manifestPath,
    readinessPath,
    reportPath,
    scriptsPath,
    tagsPath,
    swfmillPath,
    manifestText,
    readinessText,
    reportText,
    manifest,
    readiness,
    report,
    scriptText,
    tagsText,
    scriptsGzip,
    tagsGzip,
    swfmillGzip,
    reportScriptOutput,
    reportTagsOutput,
    reportXmlOutput,
    inputSnapshots,
  };
}

async function loadHostBindingResolution(workspace, manifest) {
  const resolutionPath = path.join(workspace, "audit", "host-binding-resolution.json");
  const inputSnapshots = [];
  const resolutionSnapshot = await readOptionalScenarioInputSnapshot(
    resolutionPath,
    {
      containmentRoot: workspace,
      label: `${manifest.animationId}: optional host-binding resolution`,
    },
  );
  inputSnapshots.push(resolutionSnapshot);
  if (resolutionSnapshot.kind === "absent") {
    return {resolution: null, inputSnapshots};
  }
  const text = resolutionSnapshot.bytes.toString("utf8");
  const report = JSON.parse(text);
  if (report.animationId !== manifest.animationId) throw new Error(`${manifest.animationId}: host-binding resolution identity mismatch`);
  if (report.source?.swfSha256 !== manifest.source.swfSha256) throw new Error(`${manifest.animationId}: host-binding resolution source hash mismatch`);
  for (const artifact of report.evidenceArtifacts || []) {
    if (!/^[a-f0-9]{64}$/.test(artifact.sha256 || "")) throw new Error(`${manifest.animationId}: invalid host-binding evidence hash for ${artifact.path}`);
    const candidate = artifact.path.startsWith("migrations/") || artifact.path.startsWith("source-assets/")
      ? path.join(projectRoot, artifact.path)
      : path.join(workspace, artifact.path);
    const containmentRoot = artifact.path.startsWith("migrations/") ||
      artifact.path.startsWith("source-assets/")
      ? projectRoot
      : workspace;
    const snapshot = await readScenarioInputSnapshot(candidate, {
      containmentRoot,
      label: `${manifest.animationId}: host-binding evidence ${artifact.path}`,
    });
    inputSnapshots.push(snapshot);
    if (snapshot.sha256 !== artifact.sha256) throw new Error(`${manifest.animationId}: host-binding evidence hash mismatch: ${artifact.path}`);
  }
  return {
    resolution: {
      report,
      artifact: {
        artifactId: "host-binding-resolution",
        path: "audit/host-binding-resolution.json",
        sha256: hashText(text),
      },
    },
    inputSnapshots,
  };
}

async function loadAdobeRuntimeEvidence(workspace, manifest) {
  const baselineDirectory = path.join(workspace, "baseline");
  const inputSnapshots = [
    await readScenarioDirectorySnapshot(baselineDirectory, {
      containmentRoot: workspace,
      label: `${manifest.animationId}: baseline directory`,
    }),
  ];
  const entries = (await readdir(baselineDirectory, {withFileTypes: true}))
    .filter((entry) => entry.isFile() && /^adobe-flash-player-.*\.json$/.test(entry.name))
    .sort((left, right) => compareText(left.name, right.name));
  const reports = [];
  for (const [index, entry] of entries.entries()) {
    const reportPath = path.join(baselineDirectory, entry.name);
    const snapshot = await readScenarioInputSnapshot(reportPath, {
      containmentRoot: workspace,
      label: `${manifest.animationId}: Adobe runtime report ${entry.name}`,
    });
    inputSnapshots.push(snapshot);
    const text = snapshot.bytes.toString("utf8");
    const report = JSON.parse(text);
    if (report.animationId !== manifest.animationId) throw new Error(`${manifest.animationId}: Adobe runtime report identity mismatch: ${entry.name}`);
    if (report.source?.swfSha256 !== manifest.source.swfSha256) throw new Error(`${manifest.animationId}: Adobe runtime report source hash mismatch: ${entry.name}`);
    const artifactId = `adobe-runtime-${String(index + 1).padStart(2, "0")}`;
    reports.push({
      artifact: {artifactId, path: `baseline/${entry.name}`, sha256: hashText(text)},
      status: report.status,
      authority: report.authority,
      runtime: report.runtime,
      capturedFrames: (report.frames || []).map((frame) => ({frame: frame.frame, sha256: frame.sha256, width: frame.width, height: frame.height})),
      evidence: {artifactId},
    });
  }
  await assertScenarioInputSetUnchanged(inputSnapshots);
  return {reports, inputSnapshots};
}

export async function buildOneInventory(id, {
  migrationsRoot = defaultMigrationsRoot,
  python = "python3",
  releaseMembership = null,
} = {}) {
  const loaded = await loadWorkspace(migrationsRoot, id);
  const {workspace, manifest, readiness, report, scriptText, tagsText, reportScriptOutput, reportTagsOutput, reportXmlOutput} = loaded;
  const releaseMembershipEvidence = verifyLessonReleaseMembership(manifest, releaseMembership);
  const hostBindingResult = await loadHostBindingResolution(
    workspace,
    manifest,
  );
  const hostBindingResolution = hostBindingResult.resolution;
  const courseXmlPath = courseXmlPathForManifest(manifest);
  const courseXmlSnapshot = await readScenarioInputSnapshot(
    courseXmlPath,
    {
      containmentRoot: projectRoot,
      label: `${id}: course XML`,
    },
  );
  const [parsedCourseXml, swfmill, adobeRuntimeResult] = await Promise.all([
    extractCourseXmlEvidence(courseXmlPath, {python}),
    extractSwfmillEvidence(loaded.swfmillPath, {python}),
    loadAdobeRuntimeEvidence(workspace, manifest),
  ]);
  const inputSnapshots = [
    ...loaded.inputSnapshots,
    ...hostBindingResult.inputSnapshots,
    courseXmlSnapshot,
    ...adobeRuntimeResult.inputSnapshots,
  ];
  await assertScenarioInputSetUnchanged(inputSnapshots);
  const courseXmlText = courseXmlSnapshot.bytes.toString("utf8");
  const courseXmlSha256 = courseXmlSnapshot.sha256;
  const adobeRuntimeEvidence = adobeRuntimeResult.reports;
  const parsedScripts = parseScriptBundle(scriptText, {
    compressedSha256: reportScriptOutput.sha256,
    contentSha256: reportScriptOutput.uncompressedSha256,
  });
  const ffdecTagDump = summarizeFfdecTags(tagsText);
  const blocks = annotateHitTargets(parsedScripts.blocks, swfmill);
  const courseXml = annotateCourseXml(courseXmlText, parsedCourseXml, manifest, courseXmlPath, courseXmlSha256);
  const dependencies = applyHostBindingResolution(buildDependencies(blocks), hostBindingResolution?.report || null);
  const timelineInventory = buildTimelineStates(blocks, swfmill);
  const replayAndTerminal = buildReplayAndTerminal(blocks, timelineInventory);
  const sideEffects = blocks.flatMap((block) => block.signals.sideEffects.map((item) => ({...item, scriptId: block.id})));
  const buttonTargetObligations = swfmill.buttons.map((button) => ({
    buttonObjectId: button.objectId,
    eventsEncodedByConditions: button.conditions,
    hitRecords: button.hitRecords,
    placements: button.placements,
    executionRule: "exercise every encoded event at every placement; capture up/over/down/hit visual states where the definition supplies them",
    evidence: {artifactId: "swfmill-xml", objectId: button.objectId},
  }));
  const inputObligations = swfmill.editTexts.filter((item) => item.attributes.readOnly === "0").map((item) => ({
    objectId: item.objectId,
    variableName: item.attributes.variableName || "",
    sourceInitialText: item.attributes.initialText ?? null,
    boundsTwips: item.boundsTwips,
    placements: item.placements,
    requiredStates: ["initial", "focus", "empty", "accepted-value", "rejected-or-invalid-value-if-source-handler-defines-one", "keyboard-submit-or-change-if-source-handler-defines-one"],
    constraintStatus: "derive only from exported handlers/runtime; unspecified constraints remain unknown",
    evidence: {artifactId: "swfmill-xml", objectId: item.objectId},
  }));
  const dragObligations = blocks.filter((block) => block.categories.includes("drag")).map((block) => ({
    scriptId: block.id,
    script: block.script,
    events: block.event,
    requiredStates: ["before", "press-or-start", "minimum-bound", "intermediate", "maximum-bound", "release", "releaseOutside-if-encoded"],
    boundEvidence: block.signals.calls.filter((call) => /startDrag$/.test(call.target)),
    evidence: block.evidence,
  }));
  const correctWrongObligations = [
    ...blocks.filter((block) => block.categories.includes("correct-outcome")).map((block) => ({outcome: "correct", scriptId: block.id, script: block.script, timelineContext: block.timelineContext, hitTarget: block.hitTarget || null, executionRule: "execute in every reachable placement/question context", evidence: block.evidence})),
    ...blocks.filter((block) => block.categories.includes("wrong-outcome")).map((block) => ({outcome: "wrong", scriptId: block.id, script: block.script, timelineContext: block.timelineContext, hitTarget: block.hitTarget || null, executionRule: "execute first and repeated attempts wherever retry state is referenced", evidence: block.evidence})),
  ];
  const extractedReleaseHandlerCount = blocks.filter((block) => block.event.includes("release")).length;
  const readinessReleaseClaims = readiness.machineAudit.observedBehaviorFromExtractedScripts.flatMap((statement) => {
    const match = statement.match(/(?:^|\D)(\d+)\s+(?:on\(release\)|release)\s+handlers?/i);
    return match ? [{statement, claimedCount: Number(match[1])}] : [];
  });
  const releaseCountConflicts = readinessReleaseClaims.filter((item) => item.claimedCount !== extractedReleaseHandlerCount).map((item) => ({
    id: "readiness-release-count-vs-exported-blocks",
    statement: `Strict-readiness text says ${item.claimedCount} release handlers, while the deterministic FFDec bundle parser finds ${extractedReleaseHandlerCount} exported script blocks whose event list explicitly includes release. The counting-method conflict is preserved and neither value is silently rewritten.`,
    readinessStatement: item.statement,
    evidence: [{artifactId: "strict-readiness"}, {artifactId: "ffdec-scripts"}],
  }));
  const evidenceIndex = [
    {artifactId: "source-swf", path: manifest.source.swf, sha256: manifest.source.swfSha256},
    ...(releaseMembershipEvidence ? [releaseMembershipEvidence] : []),
    {
      artifactId: "migration-technical-contract",
      path: "migration.json",
      sha256: technicalManifestSha256(manifest),
      hashMode: "canonical-json-v1",
      projection: TECHNICAL_MANIFEST_PROJECTION.id,
      excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
    },
    readinessEvidenceRecord(manifest, readiness, loaded.readinessText),
    {artifactId: "machine-report", path: "audit/machine/report.json", sha256: hashText(loaded.reportText)},
    {artifactId: "ffdec-scripts", path: "audit/machine/ffdec-scripts.txt.gz", sha256: reportScriptOutput.sha256, uncompressedSha256: reportScriptOutput.uncompressedSha256},
    {artifactId: "ffdec-tags", path: "audit/machine/ffdec-tags.txt.gz", sha256: reportTagsOutput.sha256, uncompressedSha256: reportTagsOutput.uncompressedSha256},
    {artifactId: "swfmill-xml", path: "audit/machine/swfmill.xml.gz", sha256: reportXmlOutput.sha256, uncompressedSha256: reportXmlOutput.uncompressedSha256},
    courseXml.artifact,
    ...(hostBindingResolution ? [hostBindingResolution.artifact] : []),
    ...adobeRuntimeEvidence.map((item) => item.artifact),
  ];
  const inventory = {
    schemaVersion: 1,
    animationId: id,
    inventoryStatus: "static-exhaustive-runtime-unverified",
    migrationStatusChanged: false,
    authorityStatement: [
      "This inventory exhaustively indexes the currently exported AVM1 scripts, swfmill timeline/definition structure, migration/readiness records, and active lesson XML.",
      "Static evidence does not prove Adobe-runtime reachability, original host defaults, audio timing, or visual fidelity; unresolved items remain explicit.",
      "No legacy network, JavaScript bridge, persistent storage, host command, or remote load was executed while generating this file.",
      ...(releaseMembershipEvidence ? ["The selected animation ID and workspace source identity are hash-bound to an exact atomic lesson-release member; that membership authorizes only this static audit output."] : []),
      ...(hostBindingResolution ? ["The hash-verified host-binding resolution may remove scanner-only or child-self-initialized names from the parent-fixture blocker list; it does not satisfy runtime, branch, audio, visual, human, or owner acceptance."] : []),
    ],
    source: {
      swf: manifest.source.swf,
      swfSha256: manifest.source.swfSha256,
      fla: manifest.source.fla || null,
      flaSha256: manifest.source.flaSha256 || null,
      pairedFlaStatus: manifest.source.pairedFlaStatus,
      stage: manifest.runtime.stage,
      fps: manifest.runtime.fps,
      rootFrameCount: manifest.runtime.frameCount,
      actionScriptVersion: manifest.runtime.actionScriptVersion,
    },
    courseXml,
    evidenceIndex,
    authoritativeRuntimeEvidence: adobeRuntimeEvidence,
    staticExtraction: {
      ffdecExportedScriptCount: report.findings.exportedScriptFileCount,
      indexedScriptBlockCount: blocks.length,
      ffdecTagDump,
      swfmillParser: swfmill.parser,
      swfmillExtractorSha256: hashText(PYTHON_SWFMILL_EXTRACTOR),
      definitionTypeCounts: Object.values(swfmill.definitionTypes).reduce((counts, name) => ({...counts, [name]: (counts[name] || 0) + 1}), {}),
      structurallyReachableObjectCount: swfmill.structurallyReachableObjectIds.length,
      exportedSymbols: swfmill.exports,
    },
    timelineInventory,
    interactions: {
      handlers: blocks.filter((block) => block.event.length),
      nonEventScripts: blocks.filter((block) => !block.event.length),
      buttonDefinitions: swfmill.buttons,
      editTexts: swfmill.editTexts.map((item) => ({
        ...item,
        fieldKind: item.attributes.readOnly === "0" ? "editable-input" : "dynamic-or-read-only-text",
        evidence: {artifactId: "swfmill-xml", objectId: item.objectId},
      })),
      dragHandlers: blocks.filter((block) => block.categories.includes("drag")).map((block) => ({scriptId: block.id, script: block.script, event: block.event, evidence: block.evidence})),
      correctHandlers: blocks.filter((block) => block.categories.includes("correct-outcome")).map((block) => ({scriptId: block.id, script: block.script, evidence: block.evidence})),
      wrongHandlers: blocks.filter((block) => block.categories.includes("wrong-outcome")).map((block) => ({scriptId: block.id, script: block.script, evidence: block.evidence})),
      replayAndTerminal,
    },
    dependencies: {
      ...dependencies,
      safeSideEffectPolicy: sideEffects,
      fixtureRule: "Every scenario must state all referenced external bindings. Source initialization candidates are evidence, not automatically assumed runtime defaults. Unresolved values remain unresolved.",
    },
    coverage: {
      acceptanceObligationsFromReadiness: readiness.branchCaptureReadiness.requiredScenarioInventory.map((statement, index) => ({
        obligationId: `readiness-${String(index + 1).padStart(2, "0")}`,
        statement,
        evidence: {artifactId: "strict-readiness"},
      })),
      timelineStateCoverage: timelineInventory,
      handlerBehaviorGroups: handlerBehaviorGroups(blocks),
      buttonTargetObligations,
      inputObligations,
      dragObligations,
      correctWrongObligations,
      conditionalBranchObligations: buildConditionObligations(blocks),
      randomObligations: buildRandomObligations(blocks),
      labeledStateObligations: buildLabelObligations(scriptText, timelineInventory),
      glossaryAndHyperlinkObligations: buildGlossaryObligations(blocks),
      sectionMenuObligations: id.startsWith("shell-course-") ? courseXml.sections.map((section) => ({
        section: section.name,
        titles: section.titles,
        sourceAttributes: section.attributes,
        activePageCount: section.pages.length,
        requiredStates: ["closed", "open", "hover-each-active-target", "select-each-active-target", "return-from-child"],
        evidence: {artifactId: "course-xml"},
      })) : [],
      courseRouteObligations: buildRouteObligations(courseXml, swfmill, id.startsWith("shell-course-")),
      replayAndTerminalObligations: replayAndTerminal,
      sideEffectObligations: sideEffects,
      dependencyFixtureObligations: dependencies.bindings,
      authoritativeRuntimeCoverage: adobeRuntimeEvidence.map((item) => ({
        status: item.status,
        scenario: item.runtime.scenario,
        language: item.runtime.lang,
        declaredFrameCount: item.runtime.frameCount,
        capturedFrameCount: item.runtime.capturedFrameCount,
        capturedFrames: item.capturedFrames.map(({frame, sha256}) => ({frame, sha256})),
        missingDeclaredRootFrames: Array.from({length: item.runtime.frameCount}, (_, offset) => offset + 1)
          .filter((frame) => !item.capturedFrames.some((captured) => captured.frame === frame)),
        evidence: item.evidence,
      })),
      minimumSetRule: [
        "Capture every one-indexed frame in each timeline frameDomain for every reachable runtime scenario; controlStates identify labels/actions/stops/boundaries but do not replace intervening-frame capture.",
        "Prove or disposition timelines whose reachability is not statically established; do not assume they are dead code.",
        "Execute every target in each exact-body handler group; grouping reduces duplicated expected behavior, not placement coverage.",
        "Exercise both outcomes of every reachable condition and every listed random outcome/index under a recorded deterministic fixture.",
        "Exercise every Q/R/terminal label, glossary term, editable input, drag path, Replay candidate, side-effect boundary, and course route obligation.",
      ],
    },
    conflicts: [
      ...releaseCountConflicts,
      ...(courseXml.currentPlacement.matchStatus === "exact-active-page" || id.startsWith("shell-course-") ? [] : [{
        id: "active-course-xml-vs-source-placement",
        statement: `Preserved source placement is ${courseXml.currentPlacement.matchStatus} in active course XML; neither source is rewritten or silently preferred.`,
        evidence: [{artifactId: "source-swf"}, {artifactId: "course-xml"}],
      }]),
      ...(manifest.runtime.frameCount === Math.max(...timelineInventory.map((item) => item.frameCount || 0)) ? [] : [{
        id: "root-vs-nested-duration",
        statement: "The short root timeline and longer nested timelines are both authoritative structural facts; root frameCount is not treated as total behavioral duration.",
        evidence: [{artifactId: "migration-technical-contract"}, {artifactId: "swfmill-xml"}],
      }]),
    ],
    unknowns: [
      ...buildUnknowns({manifest, readiness, courseXml, swfmill, replayAndTerminal, dependencies, blocks}),
      ...adobeRuntimeEvidence.filter((item) => item.status.startsWith("partial-")).map((item, index) => ({
        id: `partial-authoritative-runtime-${String(index + 1).padStart(2, "0")}`,
        statement: item.authority.limitations.at(-1) || "The authoritative runtime report is partial and does not cover the declared root timeline.",
        capturedFrames: item.capturedFrames.map(({frame}) => frame),
        declaredRootFrameCount: item.runtime.frameCount,
        resolution: "Do not infer missing frames. Reproduce the required parent/host fixture or use another authorized runtime protocol, then capture and hash every missing frame and interaction branch.",
        evidence: item.evidence,
      })),
    ],
    strictAcceptanceEffect: "none; this inventory is an audit/specification artifact and does not advance migration status or satisfy runtime, visual, audio, human, or owner gates",
  };
  validateScenarioInventory(inventory);
  await assertScenarioInputSetUnchanged(inputSnapshots);
  return {workspace, inventory, inputSnapshots};
}

export async function buildCourseScenarioInventories(options = {}) {
  const migrationsRoot = path.resolve(options.migrationsRoot || defaultMigrationsRoot);
  let ids = options.ids?.length
    ? [...options.ids]
    : options.releaseId
      ? []
      : [...COURSE_PILOT_IDS];
  const releaseMembershipResult = options.releaseId
    ? await loadVerifiedLessonReleaseMemberships(
      options.lessonReleasesPath || defaultLessonReleasesPath,
      ids,
      options.releaseId,
    )
    : {ids: [], members: new Map(), inputSnapshots: []};
  if (options.releaseId && !ids.length) {
    ids = [...releaseMembershipResult.ids];
  }
  if (new Set(ids).size !== ids.length) throw new Error("Course/shell audit IDs must not be repeated");
  for (const id of ids) assertSafeCatalogId(id, "Course/shell audit ID");
  const nonLegacyIds = ids.filter((id) => !COURSE_AUDIT_IDS.includes(id));
  if (nonLegacyIds.length && !options.releaseId) {
    throw new Error("Explicit non-legacy IDs require --release-id");
  }
  const releaseMemberships = releaseMembershipResult.members;
  const inventoryBuilder = options.inventoryBuilder || buildOneInventory;
  const prepared = [];

  // Preflight every selected workspace and every hash-bound dependency before
  // touching any output. A late stale dependency must not leave earlier pilots
  // rewritten from a failed batch.
  for (const id of ids) {
    const {
      workspace,
      inventory,
      inputSnapshots = [],
    } = await inventoryBuilder(id, {
      migrationsRoot,
      python: options.python || "python3",
      releaseMembership: releaseMemberships.get(id) || null,
    });
    const outputPath = path.join(workspace, "audit", "scenario-inventory.json");
    const rendered = `${JSON.stringify(inventory, null, 2)}\n`;
    prepared.push({
      id,
      outputPath,
      rendered,
      inputSnapshots: [
        ...releaseMembershipResult.inputSnapshots,
        ...inputSnapshots,
      ],
    });
  }

  const results = [];
  const allInputSnapshots = prepared.flatMap(
    ({inputSnapshots = []}) => inputSnapshots,
  );
  await assertScenarioInputSetUnchanged(allInputSnapshots);
  if (options.check) {
    for (const {id, outputPath, rendered} of prepared) {
      await assertScenarioInputSetUnchanged(allInputSnapshots);
      const expectedOutput = path.resolve(
        migrationsRoot,
        id,
        "audit",
        "scenario-inventory.json",
      );
      if (path.resolve(outputPath) !== expectedOutput) {
        throw new Error(`${id}: inventory builder returned an unexpected workspace`);
      }
      const rootReal = await ensureOrdinaryDirectoryTree(
        migrationsRoot,
        path.dirname(expectedOutput),
        {create: false},
      );
      const existing = await readOrdinaryTargetBinding(expectedOutput, rootReal, {
        allowMissing: false,
      });
      if (existing.bytes.toString("utf8") !== rendered) {
        throw new Error(`${id}: scenario inventory is stale`);
      }
      results.push({id, action: "verified", output: portable(path.relative(projectRoot, outputPath))});
    }
    await assertScenarioInputSetUnchanged(allInputSnapshots);
  } else {
    await writeScenarioInventoryTransaction(
      prepared,
      migrationsRoot,
      options.transactionHooks || {},
    );
    for (const {id, outputPath} of prepared) {
      results.push({id, action: "written", output: portable(path.relative(projectRoot, outputPath))});
    }
  }
  return results;
}

function usage() {
  return `Usage: node scripts/build-course-scenario-inventories.mjs [options]\n\nOptions:\n  --id <animation-id>             Generate one legacy pilot or exact verified lesson-release member; repeatable\n  --release-id <release-id>       Select an exact release; without --id, select all members in ordinal order\n  --migrations <directory>        Migration root (default: migrations)\n  --lesson-releases <file>        Lesson release catalog (default: catalog/lesson-releases.json)\n  --python <command>              Python with xml.etree.ElementTree (default: python3)\n  --check                         Verify checked-in inventories without writing\n\nThe command reads preserved sources and machine evidence but writes only\nmigrations/<id>/audit/scenario-inventory.json. Explicit non-legacy IDs require an\nexact --release-id and must all be hash-bound members of that release. It never\nchanges migration status.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
  } else {
    const results = await buildCourseScenarioInventories(options);
    for (const result of results) process.stdout.write(`${result.action}: ${result.id} -> ${result.output}\n`);
  }
}
