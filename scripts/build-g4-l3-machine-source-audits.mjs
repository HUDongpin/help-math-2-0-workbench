#!/usr/bin/env node

import {execFile} from "node:child_process";
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
  stat,
  writeFile,
} from "node:fs/promises";
import {createHash} from "node:crypto";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath, pathToFileURL} from "node:url";
import {inflateSync} from "node:zlib";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const REPORT_VERSION = 1;
const PARSER_VERSION = 1;
const QUEUE_ID = "release-g04-l03-negative-numbers";
const SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const DEFAULT_JSON_OUTPUT = path.join(projectRoot, "reports", "g4-l3-machine-source-audits.json");
const DEFAULT_MARKDOWN_OUTPUT = path.join(projectRoot, "reports", "g4-l3-machine-source-audits.md");

const TAG_NAMES = Object.freeze({
  0: "End",
  1: "ShowFrame",
  2: "DefineShape",
  4: "PlaceObject",
  5: "RemoveObject",
  6: "DefineBits",
  7: "DefineButton",
  8: "JPEGTables",
  9: "SetBackgroundColor",
  10: "DefineFont",
  11: "DefineText",
  12: "DoAction",
  13: "DefineFontInfo",
  14: "DefineSound",
  15: "StartSound",
  17: "DefineButtonSound",
  18: "SoundStreamHead",
  19: "SoundStreamBlock",
  20: "DefineBitsLossless",
  21: "DefineBitsJPEG2",
  22: "DefineShape2",
  26: "PlaceObject2",
  28: "RemoveObject2",
  32: "DefineShape3",
  33: "DefineText2",
  34: "DefineButton2",
  35: "DefineBitsJPEG3",
  36: "DefineBitsLossless2",
  37: "DefineEditText",
  39: "DefineSprite",
  43: "FrameLabel",
  45: "SoundStreamHead2",
  46: "DefineMorphShape",
  48: "DefineFont2",
  56: "ExportAssets",
  57: "ImportAssets",
  58: "EnableDebugger",
  59: "DoInitAction",
  60: "DefineVideoStream",
  61: "VideoFrame",
  64: "EnableDebugger2",
  65: "ScriptLimits",
  66: "SetTabIndex",
  69: "FileAttributes",
  70: "PlaceObject3",
  71: "ImportAssets2",
  72: "DoABCDefine",
  73: "DefineFontAlignZones",
  74: "CSMTextSettings",
  75: "DefineFont3",
  76: "SymbolClass",
  77: "Metadata",
  78: "DefineScalingGrid",
  82: "DoABC",
  83: "DefineShape4",
  84: "DefineMorphShape2",
  86: "DefineSceneAndFrameLabelData",
  87: "DefineBinaryData",
  88: "DefineFontName",
  89: "StartSound2",
  90: "DefineBitsJPEG4",
  91: "DefineFont4",
});

const CHARACTER_DEFINITION_TAGS = new Set([
  2, 6, 7, 10, 11, 14, 20, 21, 22, 32, 33, 34, 35, 36, 37, 39, 46, 48,
  60, 75, 83, 84, 87, 90, 91,
]);

const SOUND_FORMATS = Object.freeze({
  0: "uncompressed-native-endian",
  1: "adpcm",
  2: "mp3",
  3: "uncompressed-little-endian",
  4: "nellymoser-16khz",
  5: "nellymoser-8khz",
  6: "nellymoser",
  11: "speex",
});

const SCRIPT_SIGNAL_DEFINITIONS = Object.freeze([
  {id: "branch-statements", pattern: String.raw`\b(?:if|switch)\s*\(`},
  {id: "random-calls", pattern: String.raw`\b(?:Math\s*\.\s*)?random\s*\(`},
  {id: "mouse-events", pattern: String.raw`\bon\s*\(\s*(?:release|press|rollOver|rollOut|dragOver|dragOut)\b`},
  {id: "clip-events", pattern: String.raw`\bonClipEvent\s*\(`},
  {id: "keyboard-events", pattern: String.raw`\b(?:Key\s*\.|keyCode|onKey(?:Down|Up)?)\b`},
  {id: "input-fields", pattern: String.raw`\b(?:TextField|Selection|onChanged|input)\b`},
  {id: "score-or-answer-state", pattern: String.raw`\b(?:score|correct|incorrect|answer|attempt)\b`},
  {id: "replay-or-reset", pattern: String.raw`\b(?:replay|reset)\b|gotoAndPlay\s*\(\s*(?:1|"1")`},
  {id: "timeline-navigation", pattern: String.raw`\b(?:gotoAndPlay|gotoAndStop|nextFrame|prevFrame|play|stop)\s*\(`},
]);

const EXTERNAL_API_DEFINITIONS = Object.freeze([
  {id: "ExternalInterface", pattern: String.raw`\bExternalInterface\b`, kind: "host-bridge"},
  {id: "FlashVars", pattern: String.raw`\bFlashVars\b`, kind: "host-configuration"},
  {id: "Loader", pattern: String.raw`\bLoader\b`, kind: "dynamic-resource"},
  {id: "MovieClipLoader", pattern: String.raw`\bMovieClipLoader\b`, kind: "dynamic-resource"},
  {id: "NetConnection", pattern: String.raw`\bNetConnection\b`, kind: "network"},
  {id: "SharedObject", pattern: String.raw`\bSharedObject\b`, kind: "local-persistence"},
  {id: "Socket", pattern: String.raw`\bSocket\b`, kind: "network"},
  {id: "URLRequest", pattern: String.raw`\bURLRequest\b`, kind: "network-or-resource"},
  {id: "XML.load", pattern: String.raw`\bXML\s*\.\s*load\b`, kind: "network-or-resource"},
  {id: "XMLSocket", pattern: String.raw`\bXMLSocket\b`, kind: "network"},
  {id: "fscommand", pattern: String.raw`\bfscommand\s*\(`, kind: "host-bridge"},
  {id: "getURL", pattern: String.raw`\bgetURL\s*\(`, kind: "navigation-or-network"},
  {id: "loadMovie", pattern: String.raw`\bloadMovie\s*\(`, kind: "dynamic-resource"},
  {id: "loadMovieNum", pattern: String.raw`\bloadMovieNum\s*\(`, kind: "dynamic-resource"},
  {id: "loadVariables", pattern: String.raw`\bloadVariables\s*\(`, kind: "network-or-resource"},
  {id: "loadVariablesNum", pattern: String.raw`\bloadVariablesNum\s*\(`, kind: "network-or-resource"},
  {id: "navigateToURL", pattern: String.raw`\bnavigateToURL\s*\(`, kind: "navigation-or-network"},
  {id: "Sound.loadSound", pattern: String.raw`\b(?:Sound\s*\.\s*)?loadSound\s*\(`, kind: "external-audio"},
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function compareText(left, right) {
  return String(left).localeCompare(String(right), "en");
}

function projectPath(filePath, root = projectRoot) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJsonBinding(filePath, root = projectRoot) {
  const bytes = await readFile(filePath);
  return {
    value: JSON.parse(bytes.toString("utf8")),
    binding: {path: projectPath(filePath, root), bytes: bytes.length, sha256: sha256(bytes)},
  };
}

async function walkFiles(directory, relative = "") {
  let entries;
  try {
    entries = await readdir(path.join(directory, relative), {withFileTypes: true});
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const result = [];
  for (const entry of entries.sort((left, right) => compareText(left.name, right.name))) {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) result.push(...await walkFiles(directory, next));
    else if (entry.isFile()) result.push(next.split(path.sep).join("/"));
  }
  return result;
}

async function mapWithConcurrency(items, concurrency, mapper) {
  invariant(Number.isInteger(concurrency) && concurrency >= 1 && concurrency <= 8,
    "concurrency must be an integer from 1 through 8");
  const result = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({length: Math.min(concurrency, items.length)}, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      result[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return result;
}

function decompressSwf(sourceBytes) {
  invariant(sourceBytes.length >= 12, "SWF is too short");
  const signature = sourceBytes.subarray(0, 3).toString("ascii");
  if (signature === "FWS") return Buffer.from(sourceBytes);
  if (signature === "CWS") {
    const result = Buffer.concat([
      Buffer.from("FWS"),
      sourceBytes.subarray(3, 8),
      inflateSync(sourceBytes.subarray(8)),
    ]);
    result.writeUInt32LE(result.length, 4);
    return result;
  }
  throw new Error(`Unsupported SWF signature ${signature}; ZWS parsing is fail-closed`);
}

function readBits(bytes, bitOffset, width, signed = false) {
  invariant(width >= 0 && width <= 31, `Unsupported SWF bit width ${width}`);
  let value = 0;
  for (let index = 0; index < width; index += 1) {
    const absolute = bitOffset + index;
    const byte = bytes[Math.floor(absolute / 8)];
    invariant(byte !== undefined, "Truncated SWF bit field");
    value = value * 2 + ((byte >> (7 - (absolute % 8))) & 1);
  }
  if (signed && width && value >= 2 ** (width - 1)) value -= 2 ** width;
  return value;
}

function readRect(bytes, offset) {
  const bitOffset = offset * 8;
  const width = readBits(bytes, bitOffset, 5);
  invariant(width >= 1, "Invalid SWF RECT bit width");
  const values = [];
  for (let index = 0; index < 4; index += 1) {
    values.push(readBits(bytes, bitOffset + 5 + index * width, width, true));
  }
  return {
    bytes: Math.ceil((5 + 4 * width) / 8),
    xMinTwips: values[0],
    xMaxTwips: values[1],
    yMinTwips: values[2],
    yMaxTwips: values[3],
  };
}

function readCString(bytes, offset, end) {
  let cursor = offset;
  while (cursor < end && bytes[cursor] !== 0) cursor += 1;
  invariant(cursor < end, "Unterminated SWF string");
  return {value: bytes.subarray(offset, cursor).toString("utf8"), next: cursor + 1};
}

function tagName(code) {
  return TAG_NAMES[code] || `Tag${code}`;
}

function placementCharacterId(bytes, code, start, end) {
  if (code === 4) {
    invariant(start + 4 <= end, "Truncated PlaceObject");
    return bytes.readUInt16LE(start);
  }
  if (code === 26) {
    invariant(start + 3 <= end, "Truncated PlaceObject2");
    const flags = bytes[start];
    if (!(flags & 0x02)) return null;
    invariant(start + 5 <= end, "Truncated PlaceObject2 character ID");
    return bytes.readUInt16LE(start + 3);
  }
  if (code === 70) {
    invariant(start + 4 <= end, "Truncated PlaceObject3");
    const flags1 = bytes[start];
    const flags2 = bytes[start + 1];
    let cursor = start + 4;
    if ((flags2 & 0x08) || ((flags2 & 0x10) && (flags1 & 0x02))) {
      cursor = readCString(bytes, cursor, end).next;
    }
    if (!(flags1 & 0x02)) return null;
    invariant(cursor + 2 <= end, "Truncated PlaceObject3 character ID");
    return bytes.readUInt16LE(cursor);
  }
  return null;
}

function parseAssetNames(bytes, start, end, importTag = false) {
  let cursor = start;
  let url = null;
  if (importTag) {
    const parsed = readCString(bytes, cursor, end);
    url = parsed.value;
    cursor = parsed.next;
    if (importTag === 2) {
      invariant(cursor + 2 <= end, "Truncated ImportAssets2 reserved fields");
      cursor += 2;
    }
  }
  invariant(cursor + 2 <= end, "Truncated SWF asset-name count");
  const count = bytes.readUInt16LE(cursor);
  cursor += 2;
  const assets = [];
  for (let index = 0; index < count; index += 1) {
    invariant(cursor + 2 <= end, "Truncated SWF asset ID");
    const characterId = bytes.readUInt16LE(cursor);
    cursor += 2;
    const parsed = readCString(bytes, cursor, end);
    cursor = parsed.next;
    assets.push({characterId, name: parsed.value});
  }
  return {url, assets};
}

function summarizeDomain(domain, spriteIds, rootReachable, parents) {
  const placementEdges = [...domain.placements.entries()].map(([characterId, value]) => ({
    characterId,
    characterType: value.characterType,
    childSpriteId: spriteIds.has(characterId) ? characterId : null,
    placementCount: value.frames.length,
    firstFrame: Math.min(...value.frames),
    distinctFrames: [...new Set(value.frames)].sort((left, right) => left - right),
  })).sort((left, right) => left.characterId - right.characterId);
  const value = {
    domainId: domain.id,
    kind: domain.kind,
    spriteId: domain.spriteId,
    declaredFrameCount: domain.frameCount,
    observedShowFrameCount: domain.showFrameCount,
    definitionDepth: domain.definitionDepth,
    staticallyRootReachable: rootReachable.has(domain.id),
    parentDomainIds: [...(parents.get(domain.id) || [])].sort(compareText),
    placementEdges,
    placedCharacterCount: placementEdges.length,
    placedSpriteIds: placementEdges.filter((edge) => edge.childSpriteId !== null).map((edge) => edge.childSpriteId),
    tagCounts: Object.fromEntries([...domain.tagCounts.entries()]
      .sort(([left], [right]) => left - right)
      .map(([code, count]) => [tagName(code), count])),
    scriptTagCount: (domain.tagCounts.get(12) || 0) + (domain.tagCounts.get(59) || 0) +
      (domain.tagCounts.get(72) || 0) + (domain.tagCounts.get(82) || 0),
    audioTagCount: (domain.tagCounts.get(14) || 0) + (domain.tagCounts.get(15) || 0) +
      (domain.tagCounts.get(18) || 0) + (domain.tagCounts.get(19) || 0) +
      (domain.tagCounts.get(45) || 0) + (domain.tagCounts.get(89) || 0),
  };
  value.domainFingerprintSha256 = sha256(stableJson(value));
  return value;
}

export function parseSwfSourceFacts(sourceBytes) {
  const compressedSignature = sourceBytes.subarray(0, 3).toString("ascii");
  const bytes = decompressSwf(sourceBytes);
  const declaredLength = sourceBytes.readUInt32LE(4);
  invariant(declaredLength === bytes.length,
    `SWF declared length ${declaredLength} does not match uncompressed length ${bytes.length}`);
  const rect = readRect(bytes, 8);
  const timelineOffset = 8 + rect.bytes;
  invariant(timelineOffset + 4 <= bytes.length, "Truncated SWF timeline header");
  const fps = bytes.readUInt16LE(timelineOffset) / 256;
  const rootFrameCount = bytes.readUInt16LE(timelineOffset + 2);
  const domains = new Map();
  const characterTypes = new Map();
  const defineSounds = [];
  const startSoundIds = [];
  const importedAssets = [];
  const exportedAssets = [];
  const symbolClasses = [];
  let actionScript3Flag = false;

  const makeDomain = ({id, kind, spriteId = null, frameCount, definitionDepth}) => ({
    id,
    kind,
    spriteId,
    frameCount,
    definitionDepth,
    showFrameCount: 0,
    tagCounts: new Map(),
    placements: new Map(),
  });
  const root = makeDomain({id: "root", kind: "root", frameCount: rootFrameCount, definitionDepth: 0});
  domains.set(root.id, root);

  const parseRange = (start, end, domain) => {
    let offset = start;
    let currentFrame = 1;
    while (offset + 2 <= end) {
      const header = bytes.readUInt16LE(offset);
      offset += 2;
      const code = header >> 6;
      let length = header & 0x3f;
      if (length === 0x3f) {
        invariant(offset + 4 <= end, "Truncated long SWF tag length");
        length = bytes.readUInt32LE(offset);
        offset += 4;
      }
      const bodyStart = offset;
      const bodyEnd = bodyStart + length;
      invariant(bodyEnd <= end, `Truncated ${tagName(code)} tag`);
      domain.tagCounts.set(code, (domain.tagCounts.get(code) || 0) + 1);

      if (code === 1) {
        domain.showFrameCount += 1;
        currentFrame += 1;
      }
      if (code === 69 && length >= 4) {
        actionScript3Flag ||= Boolean(bytes.readUInt32LE(bodyStart) & 0x08);
      }
      if (CHARACTER_DEFINITION_TAGS.has(code)) {
        invariant(length >= 2, `Truncated ${tagName(code)} character ID`);
        const characterId = bytes.readUInt16LE(bodyStart);
        characterTypes.set(characterId, tagName(code));
      }
      if (code === 39) {
        invariant(length >= 4, "Truncated DefineSprite");
        const spriteId = bytes.readUInt16LE(bodyStart);
        const frameCount = bytes.readUInt16LE(bodyStart + 2);
        invariant(!domains.has(`sprite-${spriteId}`), `Duplicate DefineSprite ${spriteId}`);
        const sprite = makeDomain({
          id: `sprite-${spriteId}`,
          kind: "sprite",
          spriteId,
          frameCount,
          definitionDepth: domain.definitionDepth + 1,
        });
        domains.set(sprite.id, sprite);
        parseRange(bodyStart + 4, bodyEnd, sprite);
      }
      if (code === 4 || code === 26 || code === 70) {
        const characterId = placementCharacterId(bytes, code, bodyStart, bodyEnd);
        if (characterId !== null) {
          const prior = domain.placements.get(characterId) || {frames: [], characterType: null};
          prior.frames.push(Math.min(currentFrame, domain.frameCount || currentFrame));
          domain.placements.set(characterId, prior);
        }
      }
      if (code === 14) {
        invariant(length >= 7, "Truncated DefineSound");
        const soundId = bytes.readUInt16LE(bodyStart);
        const formatByte = bytes[bodyStart + 2];
        const format = formatByte >> 4;
        const rates = [5512, 11025, 22050, 44100];
        defineSounds.push({
          soundId,
          ownerDomainId: domain.id,
          formatCode: format,
          format: SOUND_FORMATS[format] || `format-${format}`,
          rateHz: rates[(formatByte >> 2) & 0x03],
          sampleSizeBits: formatByte & 0x02 ? 16 : 8,
          channels: formatByte & 0x01 ? 2 : 1,
          sampleCount: bytes.readUInt32LE(bodyStart + 3),
        });
      }
      if (code === 15 && length >= 2) startSoundIds.push(bytes.readUInt16LE(bodyStart));
      if (code === 56) exportedAssets.push(...parseAssetNames(bytes, bodyStart, bodyEnd).assets);
      if (code === 57) importedAssets.push({...parseAssetNames(bytes, bodyStart, bodyEnd, 1), tag: "ImportAssets"});
      if (code === 71) importedAssets.push({...parseAssetNames(bytes, bodyStart, bodyEnd, 2), tag: "ImportAssets2"});
      if (code === 76) symbolClasses.push(...parseAssetNames(bytes, bodyStart, bodyEnd).assets);

      offset = bodyEnd;
      if (code === 0) break;
    }
  };
  parseRange(timelineOffset + 4, bytes.length, root);

  for (const domain of domains.values()) {
    for (const [characterId, placement] of domain.placements) {
      placement.characterType = characterTypes.get(characterId) || "unresolved-character";
    }
  }
  const spriteIds = new Set([...domains.values()].filter((domain) => domain.kind === "sprite")
    .map((domain) => domain.spriteId));
  const parents = new Map();
  for (const domain of domains.values()) {
    for (const characterId of domain.placements.keys()) {
      if (!spriteIds.has(characterId)) continue;
      const childId = `sprite-${characterId}`;
      if (!parents.has(childId)) parents.set(childId, new Set());
      parents.get(childId).add(domain.id);
    }
  }
  const rootReachable = new Set(["root"]);
  const queue = ["root"];
  while (queue.length) {
    const domain = domains.get(queue.shift());
    for (const characterId of domain.placements.keys()) {
      const childId = `sprite-${characterId}`;
      if (domains.has(childId) && !rootReachable.has(childId)) {
        rootReachable.add(childId);
        queue.push(childId);
      }
    }
  }
  const domainList = [...domains.values()]
    .sort((left, right) => left.kind === "root" ? -1 : right.kind === "root" ? 1 : left.spriteId - right.spriteId)
    .map((domain) => summarizeDomain(domain, spriteIds, rootReachable, parents));
  const rootReachableDomains = domainList.filter((domain) => domain.staticallyRootReachable);
  const tagCounts = new Map();
  for (const domain of domains.values()) {
    for (const [code, count] of domain.tagCounts) tagCounts.set(code, (tagCounts.get(code) || 0) + count);
  }
  const actionScriptVersion = actionScript3Flag || (tagCounts.get(72) || 0) || (tagCounts.get(82) || 0)
    ? ((tagCounts.get(12) || 0) || (tagCounts.get(59) || 0) ? "hybrid-avm1-avm2" : "AS3")
    : ((tagCounts.get(12) || 0) || (tagCounts.get(59) || 0) ? "AS1/2" : "none-detected");
  const facts = {
    parserVersion: PARSER_VERSION,
    header: {
      signature: compressedSignature,
      version: sourceBytes[3],
      compressedBytes: sourceBytes.length,
      declaredUncompressedBytes: declaredLength,
      uncompressedSha256: sha256(bytes),
      stage: {
        xMinTwips: rect.xMinTwips,
        xMaxTwips: rect.xMaxTwips,
        yMinTwips: rect.yMinTwips,
        yMaxTwips: rect.yMaxTwips,
        width: (rect.xMaxTwips - rect.xMinTwips) / 20,
        height: (rect.yMaxTwips - rect.yMinTwips) / 20,
      },
      fps,
      rootFrameCount,
    },
    actionScript: {
      version: actionScriptVersion,
      actionScript3Flag,
      tagCounts: {
        DoAction: tagCounts.get(12) || 0,
        DoInitAction: tagCounts.get(59) || 0,
        DoABCDefine: tagCounts.get(72) || 0,
        DoABC: tagCounts.get(82) || 0,
      },
    },
    frameDomains: {
      method: "static recursive SWF tag parse with PlaceObject/PlaceObject2/PlaceObject3 character graph",
      rootFrameCount,
      definitionCount: domainList.length - 1,
      staticallyRootReachableDefinitionCount: rootReachableDomains.length - 1,
      staticallyUnreachableDefinitionCount: domainList.length - rootReachableDomains.length,
      staticallyRootReachableDeclaredFrameCountSum: rootReachableDomains.reduce((sum, domain) => sum + domain.declaredFrameCount, 0),
      allDeclaredFrameCountSum: domainList.reduce((sum, domain) => sum + domain.declaredFrameCount, 0),
      longestStaticallyRootReachableDomain: rootReachableDomains
        .map((domain) => ({domainId: domain.domainId, declaredFrameCount: domain.declaredFrameCount}))
        .sort((left, right) => right.declaredFrameCount - left.declaredFrameCount || compareText(left.domainId, right.domainId))[0],
      caveat:
        "Static definition/placement reachability is not runtime reachability, compositing proof, scenario coverage, or a frame-domain disposition. Dynamic linkage and ActionScript state can add or suppress instances.",
      domains: domainList,
    },
    audio: {
      defineSounds: defineSounds.sort((left, right) => left.soundId - right.soundId),
      startSoundIds: [...new Set(startSoundIds)].sort((left, right) => left - right),
      tagCounts: {
        DefineSound: tagCounts.get(14) || 0,
        StartSound: tagCounts.get(15) || 0,
        SoundStreamHead: tagCounts.get(18) || 0,
        SoundStreamHead2: tagCounts.get(45) || 0,
        SoundStreamBlock: tagCounts.get(19) || 0,
        StartSound2: tagCounts.get(89) || 0,
      },
    },
    linkageAndImports: {
      importedAssets: importedAssets.sort((left, right) => compareText(left.url, right.url)),
      exportedAssets: exportedAssets.sort((left, right) => left.characterId - right.characterId || compareText(left.name, right.name)),
      symbolClasses: symbolClasses.sort((left, right) => left.characterId - right.characterId || compareText(left.name, right.name)),
    },
    tagCounts: Object.fromEntries([...tagCounts.entries()]
      .sort(([left], [right]) => left - right)
      .map(([code, count]) => [tagName(code), count])),
  };
  facts.structureFingerprintSha256 = sha256(stableJson(facts));
  return facts;
}

function normalizeScriptSource(source) {
  return {
    path: source.path.split(path.sep).join("/"),
    text: source.text.replace(/\r\n/g, "\n").replace(/\r/g, "\n"),
  };
}

function patternEvidence(files, definitions) {
  return definitions.map((definition) => {
    const evidence = [];
    let occurrences = 0;
    for (const file of files) {
      const count = [...file.text.matchAll(new RegExp(definition.pattern, "gi"))].length;
      if (!count) continue;
      occurrences += count;
      evidence.push({path: file.path, sha256: file.sha256, occurrences: count});
    }
    return {...definition, occurrences, files: evidence};
  }).filter((entry) => entry.occurrences > 0);
}

export function summarizeScriptSources(sources, structuralActionScript = {}) {
  const normalized = sources.map(normalizeScriptSource).sort((left, right) => compareText(left.path, right.path));
  const files = normalized.map((source) => ({
    path: source.path,
    bytes: Buffer.byteLength(source.text),
    sha256: sha256(source.text),
    text: source.text,
  }));
  const manifest = files.map(({path: filePath, bytes, sha256: contentSha256}) => ({
    path: filePath,
    bytes,
    sha256: contentSha256,
  }));
  const signals = patternEvidence(files, SCRIPT_SIGNAL_DEFINITIONS);
  const externalApiCandidates = patternEvidence(files, EXTERNAL_API_DEFINITIONS);
  const frameScriptFileCount = files.filter((file) => /(?:^|\/)frame_\d+\//i.test(file.path)).length;
  const buttonHandlerFileCount = files.filter((file) => /DefineButton|BUTTONCONDACTION/i.test(file.path)).length;
  const clipHandlerFileCount = files.filter((file) => /CLIPACTION|onClipEvent/i.test(file.path)).length;
  const value = {
    extraction: "FFDec script export; normalized LF; sorted project-independent relative paths",
    actionScriptVersion: structuralActionScript.version || (files.length ? "AS1/2-or-AS3-unresolved" : "none-detected"),
    exportedScriptFileCount: files.length,
    normalizedBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    frameScriptFileCount,
    buttonHandlerFileCount,
    clipHandlerFileCount,
    contentManifestSha256: sha256(stableJson(manifest)),
    normalizedBundleSha256: sha256(files.map((file) => `${file.path}\0${file.text.length}\0${file.text}\0`).join("")),
    files: manifest,
    signals,
    random: signals.find((entry) => entry.id === "random-calls") || {id: "random-calls", occurrences: 0, files: []},
    externalApiCandidates,
    externalCallsExecutedDuringAudit: false,
  };
  value.scriptEvidenceFingerprintSha256 = sha256(stableJson(value));
  return value;
}

async function resolveExecutable(command) {
  const candidates = command.includes(path.sep)
    ? [path.resolve(command)]
    : (process.env.PATH || "").split(path.delimiter).filter(Boolean).map((entry) => path.join(entry, command));
  for (const candidate of candidates) {
    try {
      await access(candidate, fsConstants.X_OK);
      return realpath(candidate);
    } catch {}
  }
  throw new Error(`Executable not found: ${command}`);
}

async function ffdecEvidence(command) {
  const launcher = await resolveExecutable(command);
  const {stdout, stderr} = await execFileAsync(command, ["-help"], {timeout: 30_000, maxBuffer: 4 * 1024 * 1024});
  const version = `${stdout}\n${stderr}`.replace(/\u001b\[[0-9;]*m/g, "").split("\n").map((line) => line.trim()).find(Boolean);
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

async function exportScriptsWithFfdec({command, sourcePath, outputRoot}) {
  const target = path.join(outputRoot, sha256(sourcePath).slice(0, 20));
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
    throw new Error(`FFDec script export failed for ${sourcePath}: ${error.stderr || error.message}`);
  }
  const scriptsRoot = path.join(target, "scripts");
  const files = (await walkFiles(scriptsRoot)).filter((file) => file.toLowerCase().endsWith(".as"));
  return Promise.all(files.map(async (file) => ({
    path: file,
    text: await readFile(path.join(scriptsRoot, file), "utf8"),
  })));
}

function normalizedLanguage(file) {
  if (file.language === "en" || file.language === "es") return file.language;
  if (/\/(?:EAD|EA)\//i.test(file.path)) return "en";
  if (/\/(?:SAD|SA)\//i.test(file.path)) return "es";
  return "und";
}

function countLanguages(files) {
  const result = {en: 0, es: 0, und: 0};
  for (const file of files) result[normalizedLanguage(file)] += 1;
  return result;
}

function safeCatalogRelativePath(relativePath) {
  invariant(typeof relativePath === "string" && relativePath && !path.isAbsolute(relativePath),
    `Invalid catalog source path ${relativePath}`);
  const normalized = path.posix.normalize(relativePath.replaceAll("\\", "/"));
  invariant(normalized !== ".." && !normalized.startsWith("../"), `Catalog source path escapes archive: ${relativePath}`);
  return normalized;
}

async function verifiedSourceFile({root, archiveReal, record}) {
  const relative = safeCatalogRelativePath(record.path);
  const candidate = path.join(root, SOURCE_PREFIX, relative);
  const resolved = await realpath(candidate);
  invariant(resolved !== archiveReal && resolved.startsWith(`${archiveReal}${path.sep}`),
    `Source path resolves outside frozen archive: ${record.path}`);
  const information = await stat(resolved);
  invariant(information.isFile() && information.size === record.bytes,
    `${record.path}: physical byte count does not match catalog`);
  const bytes = await readFile(resolved);
  invariant(sha256(bytes) === record.sha256, `${record.path}: physical SHA-256 does not match catalog`);
  return {path: candidate, bytes};
}

async function readInputCatalogs(root) {
  const relativePaths = {
    animations: "catalog/animations.json",
    batches: "catalog/batches.json",
    lessons: "catalog/lessons.json",
    audioGroups: "catalog/audio-groups.json",
    sourceFiles: "catalog/source-files.json",
    sourceFreeze: "catalog/source-freeze.json",
  };
  return Object.fromEntries(await Promise.all(Object.entries(relativePaths).map(async ([key, relative]) => [
    key,
    await readJsonBinding(path.join(root, relative), root),
  ])));
}

function validateCatalogRecord(sourceFiles, record, label) {
  const catalog = sourceFiles.get(record.path);
  invariant(catalog, `${label}: absent from catalog/source-files.json`);
  invariant(catalog.bytes === record.bytes && catalog.sha256 === record.sha256,
    `${label}: catalog source binding mismatch`);
}

export async function buildG4L3MachineSourceAudits({
  root = projectRoot,
  ffdec = "ffdec",
  concurrency = 4,
  scriptExporter = exportScriptsWithFfdec,
  toolProbe = ffdecEvidence,
} = {}) {
  invariant(Number.isInteger(concurrency) && concurrency >= 1 && concurrency <= 8,
    "concurrency must be an integer from 1 through 8");
  const loaded = await readInputCatalogs(root);
  const queue = loaded.batches.value.queues.find((candidate) => candidate.queueId === QUEUE_ID);
  invariant(queue?.canonicalAssetCount === 40 && queue.activeXmlReferencedPageAssetCount === 39 &&
    queue.courseShellAssetCount === 1, `${QUEUE_ID}: expected 39 pages plus one shell`);
  const lesson = loaded.lessons.value.lessons.find((candidate) => candidate.grade === 4 && candidate.lesson === 3);
  invariant(lesson?.pageReferenceCount === 39, "catalog/lessons.json does not contain the 39-page G4 L3 lesson");
  const animations = new Map(loaded.animations.value.animations
    .filter((animation) => animation.isCanonical)
    .map((animation) => [animation.animationId, animation]));
  const sourceFiles = new Map(loaded.sourceFiles.value.files.map((file) => [file.path, file]));
  const audioGroups = new Map(loaded.audioGroups.value.groups.map((group) => [group.groupId, group]));
  const queueItems = queue.batches.flatMap((batch) => batch.items.map((item, batchIndex) => ({
    ...item,
    batchId: batch.batchId,
    batchOrdinal: batchIndex + 1,
  })));
  invariant(queueItems.length === 40, "G4 L3 release queue does not contain 40 items");
  const selected = queueItems.map((item) => {
    const animation = animations.get(item.canonicalAnimationId);
    invariant(animation, `Missing canonical animation ${item.canonicalAnimationId}`);
    invariant(animation.assetId === item.assetId, `${animation.animationId}: queue asset ID mismatch`);
    validateCatalogRecord(sourceFiles, animation.source, `${animation.animationId} SWF`);
    if (animation.pairedFla) validateCatalogRecord(sourceFiles, animation.pairedFla, `${animation.animationId} FLA`);
    const exact = animation.audio?.exact || [];
    const grouped = (animation.audio?.groupIds || []).flatMap((groupId) => {
      const group = audioGroups.get(groupId);
      invariant(group, `${animation.animationId}: missing audio group ${groupId}`);
      return group.files;
    });
    for (const audio of [...exact, ...grouped]) validateCatalogRecord(sourceFiles, audio, `${animation.animationId} audio`);
    return {item, animation, exact, grouped};
  });

  const archive = path.join(root, SOURCE_PREFIX);
  const archiveReal = await realpath(archive);
  const scratchRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-g4-l3-machine-audit-"));
  let tool;
  let audited;
  try {
    tool = await toolProbe(ffdec);
    audited = await mapWithConcurrency(selected, concurrency, async ({animation}) => {
      const source = await verifiedSourceFile({root, archiveReal, record: animation.source});
      const [scripts, fla] = await Promise.all([
        scriptExporter({command: ffdec, sourcePath: source.path, outputRoot: scratchRoot}),
        animation.pairedFla
          ? verifiedSourceFile({root, archiveReal, record: animation.pairedFla})
          : Promise.resolve(null),
      ]);
      const structure = parseSwfSourceFacts(source.bytes);
      invariant(structure.header.signature === animation.source.swf.signature,
        `${animation.animationId}: SWF signature differs from catalog`);
      invariant(structure.header.version === animation.source.swf.version,
        `${animation.animationId}: SWF version differs from catalog`);
      invariant(structure.header.stage.width === animation.source.swf.stage.width &&
        structure.header.stage.height === animation.source.swf.stage.height,
      `${animation.animationId}: SWF stage differs from catalog`);
      invariant(structure.header.fps === animation.source.swf.fps &&
        structure.header.rootFrameCount === animation.source.swf.frameCount,
      `${animation.animationId}: SWF FPS/root frame count differs from catalog`);
      return {
        structure,
        scripts: summarizeScriptSources(scripts, structure.actionScript),
        flaVerified: Boolean(fla),
      };
    });
  } finally {
    await rm(scratchRoot, {recursive: true, force: true});
  }

  const uniqueAudio = new Map();
  for (const selection of selected) {
    for (const file of [...selection.exact, ...selection.grouped]) uniqueAudio.set(file.path, file);
  }
  const audioRecords = [...uniqueAudio.values()].sort((left, right) => compareText(left.path, right.path));
  const verifiedAudio = await mapWithConcurrency(audioRecords, concurrency, async (record) => {
    await verifiedSourceFile({root, archiveReal, record});
    return {
      path: `${SOURCE_PREFIX}/${record.path}`,
      bytes: record.bytes,
      sha256: record.sha256,
      catalogLanguage: record.language,
      normalizedLanguage: normalizedLanguage(record),
      physicalHashVerified: true,
    };
  });
  const verifiedAudioByPath = new Map(verifiedAudio.map((file) => [file.path.slice(`${SOURCE_PREFIX}/`.length), file]));

  const items = selected.map(({item, animation, exact, grouped}, index) => {
    const associated = [...new Map([...exact, ...grouped].map((file) => [file.path, file])).values()]
      .sort((left, right) => compareText(left.path, right.path));
    const structure = audited[index].structure;
    const scripts = audited[index].scripts;
    const source = {
      sourceKind: animation.pairedFla ? "fla+swf" : "swf-only",
      swf: {
        path: `${SOURCE_PREFIX}/${animation.source.path}`,
        bytes: animation.source.bytes,
        sha256: animation.source.sha256,
        physicalHashVerified: true,
      },
      fla: animation.pairedFla ? {
        path: `${SOURCE_PREFIX}/${animation.pairedFla.path}`,
        bytes: animation.pairedFla.bytes,
        sha256: animation.pairedFla.sha256,
        physicalHashVerified: audited[index].flaVerified,
        authoringAuditPerformed: false,
      } : null,
    };
    const audio = {
      exactFilePaths: exact.map((file) => `${SOURCE_PREFIX}/${file.path}`).sort(compareText),
      sharedGroupIds: [...(animation.audio?.groupIds || [])].sort(compareText),
      sharedGroupFileCount: new Set(grouped.map((file) => file.path)).size,
      associatedFileCount: associated.length,
      languages: countLanguages(associated),
      allAssociatedPhysicalHashesVerified: associated.every((file) => verifiedAudioByPath.has(file.path)),
      cueMappingEstablished: false,
      listeningAcceptanceEstablished: false,
    };
    const audit = {
      sequence: index + 1,
      animationId: animation.animationId,
      assetId: animation.assetId,
      releaseRole: item.releaseRole,
      batch: {batchId: item.batchId, batchOrdinal: item.batchOrdinal},
      classification: {
        section: animation.classification.section?.code || null,
        page: animation.classification.page?.number ?? null,
        titleRaw: animation.classification.titleRaw,
        titleDisplay: animation.classification.titleDisplay,
        domain: animation.classification.domain,
      },
      source,
      swf: structure,
      scripts,
      audio,
      externalDependencies: {
        swfImportTags: structure.linkageAndImports.importedAssets,
        actionScriptApiCandidates: scripts.externalApiCandidates,
        catalogAssociatedExternalAudioFiles: associated.map((file) => `${SOURCE_PREFIX}/${file.path}`),
        legacyEndpointInvocationsDuringAudit: 0,
        disposition: scripts.externalApiCandidates.length || structure.linkageAndImports.importedAssets.length
          ? "candidates-require-reviewed-modern-disposition"
          : "none-detected-by-static-machine-audit",
      },
      evidenceLimits: {
        authoritativeRuntimeLaunched: false,
        animateAuthoringDocumentOpened: false,
        runtimeReachabilityEstablished: false,
        frameDomainDispositionEstablished: false,
        visualBaselineEstablished: false,
        behavioralParityEstablished: false,
        audioAcceptanceEstablished: false,
        humanOrOwnerAcceptanceEstablished: false,
      },
    };
    audit.auditFingerprintSha256 = sha256(stableJson(audit));
    return audit;
  });

  const generatorBytes = await readFile(scriptPath);
  const report = {
    schemaVersion: REPORT_VERSION,
    reportType: "g4-l3-machine-source-audits",
    generator: {
      path: projectPath(scriptPath),
      version: REPORT_VERSION,
      sha256: sha256(generatorBytes),
      parserVersion: PARSER_VERSION,
    },
    acceptance: {
      acceptanceNeutral: true,
      sourceAssetsChanged: 0,
      migrationsScaffoldedOrChanged: 0,
      migrationStatusChanges: 0,
      completionLedgerChanges: 0,
      strictGateChanges: 0,
      reviewOrApprovalChanges: 0,
      authoritativeRuntimeSessions: 0,
      animateDocumentsOpened: 0,
      statement:
        "This is a deterministic static machine source audit only. It does not open batch gates or prove runtime reachability, authoritative baseline, RMSE, behavior, bilingual audio acceptance, human/owner review, parity, or completion.",
    },
    sourceBindings: {
      ...Object.fromEntries(Object.entries(loaded).map(([key, value]) => [key, value.binding])),
      sourceArchive: {
        path: SOURCE_PREFIX,
        fileCount: loaded.sourceFreeze.value.fileCount,
        totalBytes: loaded.sourceFreeze.value.totalBytes,
        manifestSha256: loaded.sourceFreeze.value.manifestSha256,
        checksumSetSha256: loaded.sourceFiles.value.checksumSetSha256,
      },
      tools: {ffdec: tool},
    },
    lesson: {
      queueId: queue.queueId,
      releaseId: queue.releaseId,
      grade: 4,
      lesson: 3,
      titleRaw: lesson.titleRaw,
      titleDisplay: lesson.titleDisplay,
      activeXmlReferencedPages: 39,
      courseShells: 1,
      canonicalItems: 40,
      batches: queue.batches.map((batch) => ({batchId: batch.batchId, canonicalAssetCount: batch.canonicalAssetCount})),
    },
    audioInventory: {
      method: "catalog association plus physical file size and SHA-256 verification",
      uniqueFileCount: verifiedAudio.length,
      languages: countLanguages(audioRecords),
      allPhysicalHashesVerified: verifiedAudio.every((file) => file.physicalHashVerified),
      cueMappingEstablished: false,
      listeningAcceptanceEstablished: false,
      files: verifiedAudio,
    },
    summary: {
      canonicalItems: items.length,
      activePages: items.filter((item) => item.releaseRole === "active-xml-referenced-page").length,
      courseShells: items.filter((item) => item.releaseRole === "course-shell").length,
      flaBacked: items.filter((item) => item.source.fla).length,
      swfOnly: items.filter((item) => !item.source.fla).length,
      rootFrameCountSum: items.reduce((sum, item) => sum + item.swf.header.rootFrameCount, 0),
      spriteDefinitionCount: items.reduce((sum, item) => sum + item.swf.frameDomains.definitionCount, 0),
      staticallyRootReachableSpriteDefinitionCount: items.reduce((sum, item) =>
        sum + item.swf.frameDomains.staticallyRootReachableDefinitionCount, 0),
      allDeclaredTimelineFrameCountSum: items.reduce((sum, item) =>
        sum + item.swf.frameDomains.allDeclaredFrameCountSum, 0),
      staticallyRootReachableDeclaredFrameCountSum: items.reduce((sum, item) =>
        sum + item.swf.frameDomains.staticallyRootReachableDeclaredFrameCountSum, 0),
      exportedScriptFileCount: items.reduce((sum, item) => sum + item.scripts.exportedScriptFileCount, 0),
      itemsWithRandomCandidates: items.filter((item) => item.scripts.random.occurrences > 0).length,
      itemsWithInteractionCandidates: items.filter((item) => item.scripts.signals.some((signal) =>
        ["mouse-events", "clip-events", "keyboard-events", "input-fields", "score-or-answer-state", "replay-or-reset"].includes(signal.id))).length,
      itemsWithExternalDependencyCandidates: items.filter((item) =>
        item.externalDependencies.actionScriptApiCandidates.length || item.externalDependencies.swfImportTags.length).length,
      itemsWithEmbeddedAudioTags: items.filter((item) => Object.values(item.swf.audio.tagCounts).some(Boolean)).length,
      auditSetSha256: sha256(stableJson(items.map((item) => ({
        animationId: item.animationId,
        auditFingerprintSha256: item.auditFingerprintSha256,
      })))),
    },
    items,
  };
  return validateG4L3MachineSourceAudits(report);
}

export function validateG4L3MachineSourceAudits(report) {
  invariant(report?.schemaVersion === REPORT_VERSION && report.reportType === "g4-l3-machine-source-audits",
    "G4 L3 machine source audit schema/report type mismatch");
  invariant(report.generator?.path === "scripts/build-g4-l3-machine-source-audits.mjs" &&
    report.generator.version === REPORT_VERSION && report.generator.parserVersion === PARSER_VERSION &&
    /^[a-f0-9]{64}$/.test(report.generator.sha256 || ""), "G4 L3 machine source audit generator binding is invalid");
  invariant(report.acceptance?.acceptanceNeutral === true, "G4 L3 machine source audit must remain acceptance-neutral");
  for (const field of [
    "sourceAssetsChanged", "migrationsScaffoldedOrChanged", "migrationStatusChanges", "completionLedgerChanges",
    "strictGateChanges", "reviewOrApprovalChanges", "authoritativeRuntimeSessions", "animateDocumentsOpened",
  ]) invariant(report.acceptance[field] === 0, `acceptance.${field} must remain zero`);
  for (const name of ["animations", "batches", "lessons", "audioGroups", "sourceFiles", "sourceFreeze"]) {
    const binding = report.sourceBindings?.[name];
    invariant(binding && typeof binding.path === "string" && Number.isSafeInteger(binding.bytes) && binding.bytes > 0 &&
      /^[a-f0-9]{64}$/.test(binding.sha256 || ""), `Invalid source binding ${name}`);
  }
  invariant(/^JPEXS Free Flash Decompiler v\.?\d/.test(report.sourceBindings?.tools?.ffdec?.version || "") &&
    /^[a-f0-9]{64}$/.test(report.sourceBindings?.tools?.ffdec?.launcherSha256 || ""),
  "Invalid FFDec tool binding");
  invariant(report.lesson?.canonicalItems === 40 && report.lesson.activeXmlReferencedPages === 39 &&
    report.lesson.courseShells === 1, "G4 L3 audit must contain 39 pages plus one shell");
  invariant(Array.isArray(report.items) && report.items.length === 40, "G4 L3 audit must contain 40 items");
  invariant(new Set(report.items.map((item) => item.animationId)).size === 40, "G4 L3 audit animation IDs must be unique");
  invariant(new Set(report.items.map((item) => item.assetId)).size === 40, "G4 L3 audit asset IDs must be unique");
  invariant(report.summary?.flaBacked === 29 && report.summary.swfOnly === 11,
    "G4 L3 audit expected 29 FLA-backed and 11 SWF-only items");
  invariant(report.audioInventory?.uniqueFileCount === 143 && report.audioInventory.languages.en === 60 &&
    report.audioInventory.languages.es === 83 && report.audioInventory.languages.und === 0 &&
    report.audioInventory.allPhysicalHashesVerified === true, "G4 L3 audio inventory must bind 143 verified files (60 en / 83 es)");
  invariant(Array.isArray(report.audioInventory.files) && report.audioInventory.files.length === 143 &&
    new Set(report.audioInventory.files.map((file) => file.path)).size === 143 &&
    report.audioInventory.files.every((file) => file.physicalHashVerified === true &&
      Number.isSafeInteger(file.bytes) && file.bytes > 0 && /^[a-f0-9]{64}$/.test(file.sha256 || "")),
  "G4 L3 audio inventory contains an invalid physical file binding");
  for (const item of report.items) {
    invariant(item.source?.swf?.physicalHashVerified === true && /^[a-f0-9]{64}$/.test(item.source.swf.sha256 || ""),
      `${item.animationId}: invalid SWF source binding`);
    if (item.source.fla) invariant(item.source.fla.physicalHashVerified === true &&
      item.source.fla.authoringAuditPerformed === false, `${item.animationId}: invalid FLA source boundary`);
    invariant(item.swf?.parserVersion === PARSER_VERSION && item.swf.header?.fps === 12 &&
      item.swf.header.rootFrameCount >= 1 && item.swf.frameDomains?.domains?.[0]?.domainId === "root",
    `${item.animationId}: invalid SWF structure audit`);
    invariant(item.swf.frameDomains.domains.length === item.swf.frameDomains.definitionCount + 1,
      `${item.animationId}: frame-domain count mismatch`);
    invariant(item.swf.frameDomains.domains.every((domain) => /^[a-f0-9]{64}$/.test(domain.domainFingerprintSha256 || "")),
      `${item.animationId}: invalid frame-domain fingerprints`);
    invariant(/^[a-f0-9]{64}$/.test(item.scripts?.contentManifestSha256 || "") &&
      /^[a-f0-9]{64}$/.test(item.scripts?.normalizedBundleSha256 || "") &&
      item.scripts.externalCallsExecutedDuringAudit === false, `${item.animationId}: invalid FFDec script evidence`);
    invariant(item.audio?.cueMappingEstablished === false && item.audio.listeningAcceptanceEstablished === false,
      `${item.animationId}: static audio audit must not claim cue/listening acceptance`);
    invariant(Object.values(item.evidenceLimits || {}).every((value) => value === false),
      `${item.animationId}: machine audit crossed an evidence boundary`);
    const copy = structuredClone(item);
    delete copy.auditFingerprintSha256;
    invariant(item.auditFingerprintSha256 === sha256(stableJson(copy)), `${item.animationId}: stale audit fingerprint`);
  }
  const expectedSetHash = sha256(stableJson(report.items.map((item) => ({
    animationId: item.animationId,
    auditFingerprintSha256: item.auditFingerprintSha256,
  }))));
  invariant(report.summary.auditSetSha256 === expectedSetHash, "G4 L3 audit set fingerprint is stale");
  invariant(report.summary.rootFrameCountSum === report.items.reduce((sum, item) => sum + item.swf.header.rootFrameCount, 0),
    "G4 L3 root frame total is stale");
  invariant(report.summary.spriteDefinitionCount === report.items.reduce((sum, item) =>
    sum + item.swf.frameDomains.definitionCount, 0), "G4 L3 sprite-definition total is stale");
  invariant(report.summary.staticallyRootReachableSpriteDefinitionCount === report.items.reduce((sum, item) =>
    sum + item.swf.frameDomains.staticallyRootReachableDefinitionCount, 0),
  "G4 L3 static-root-reachable sprite total is stale");
  invariant(report.summary.allDeclaredTimelineFrameCountSum === report.items.reduce((sum, item) =>
    sum + item.swf.frameDomains.allDeclaredFrameCountSum, 0), "G4 L3 declared-frame total is stale");
  invariant(report.summary.exportedScriptFileCount === report.items.reduce((sum, item) =>
    sum + item.scripts.exportedScriptFileCount, 0), "G4 L3 script-file total is stale");
  return report;
}

export function renderG4L3MachineSourceAuditsMarkdown(report) {
  const rows = report.items.map((item) => {
    const domain = item.swf.frameDomains;
    const embedded = Object.values(item.swf.audio.tagCounts).reduce((sum, value) => sum + value, 0);
    const section = item.releaseRole === "course-shell" ? "shell" : `${item.classification.section}/${item.classification.page}`;
    return `| ${item.sequence} | ${item.batch.batchId} | \`${item.animationId}\` | ${section} | ${item.source.sourceKind} | ` +
      `${item.swf.header.rootFrameCount} / ${domain.staticallyRootReachableDefinitionCount}/${domain.definitionCount} / ` +
      `${domain.longestStaticallyRootReachableDomain.declaredFrameCount} | ${item.scripts.exportedScriptFileCount} | ` +
      `${item.scripts.random.occurrences} | ${item.scripts.externalApiCandidates.length + item.swf.linkageAndImports.importedAssets.length} | ` +
      `${embedded} / ${item.audio.associatedFileCount} |`;
  });
  return [
    "# G4 L3 Static Machine Source Audits",
    "",
    "> Acceptance-neutral, read-only source evidence. These audits do not open batch gates or establish original-runtime authority, visual/behavioral parity, bilingual audio acceptance, human/owner approval, or migration completion.",
    "",
    "## Scope and reproducibility",
    "",
    `- Scope: ${report.summary.canonicalItems} canonical items (${report.summary.activePages} XML pages + ${report.summary.courseShells} shell).`,
    `- Sources: ${report.summary.flaBacked} FLA+SWF and ${report.summary.swfOnly} SWF-only; every selected source hash was physically reverified.`,
    `- Root timelines: ${report.summary.rootFrameCountSum} frames at 12 FPS.`,
    `- Static sprite definitions: ${report.summary.spriteDefinitionCount}; ${report.summary.staticallyRootReachableSpriteDefinitionCount} are reachable through a static placement graph.`,
    `- Declared timeline frames: ${report.summary.allDeclaredTimelineFrameCountSum} across all root/sprite definitions; ${report.summary.staticallyRootReachableDeclaredFrameCountSum} in the static root-reachable graph.`,
    `- FFDec scripts: ${report.summary.exportedScriptFileCount} normalized files, each content-hashed; audit-set SHA-256 \`${report.summary.auditSetSha256}\`.`,
    `- Audio: ${report.audioInventory.uniqueFileCount} catalog-associated MP3 files physically verified (${report.audioInventory.languages.en} en / ${report.audioInventory.languages.es} es). Cue timing and listening acceptance remain unestablished.`,
    "",
    "Static placement reachability is an implementation-planning fact only. Dynamic linkage, ActionScript state, shell hosting, and user actions can change actual runtime reachability; every migration still needs a reviewed frame-domain disposition and authoritative runtime traces.",
    "",
    "## Per-item audit index",
    "",
    "`Domains` is root frames / statically root-reachable sprite definitions / all sprite definitions / longest statically reachable domain. `Deps` counts distinct ActionScript API and SWF import candidates, not executed calls.",
    "",
    "| # | Batch | Animation | Section/page | Source | Domains | AS files | Random | Deps | Embedded/catalog audio |",
    "|---:|---|---|---|---|---|---:|---:|---:|---|",
    ...rows,
    "",
    "## Acceptance boundary",
    "",
    report.acceptance.statement,
    "",
    "The JSON report retains every static frame-domain record, placement edge, script-file SHA-256, signal evidence file, embedded-sound fact, import/linkage fact, external-API candidate, catalog audio association, and per-item audit fingerprint.",
    "",
  ].join("\n");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

export async function assertSafeReportOutput(filePath, {root = projectRoot, extension} = {}) {
  const reportsRoot = path.join(path.resolve(root), "reports");
  const output = path.resolve(filePath);
  invariant(isWithin(reportsRoot, output), `Report output must be a file inside ${reportsRoot}`);
  if (extension) invariant(path.extname(output) === extension, `Report output must end in ${extension}`);
  const relative = path.relative(path.resolve(root), output);
  let cursor = path.resolve(root);
  for (const component of relative.split(path.sep)) {
    cursor = path.join(cursor, component);
    const information = await lstat(cursor).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    invariant(!information?.isSymbolicLink(), `Report output has a symbolic-link path component: ${cursor}`);
  }
  const information = await lstat(output).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  invariant(!information?.isDirectory(), "Report output must be a file");
  invariant(!information || information.nlink === 1, "Report output must not be hard-linked");
  return output;
}

export async function writeOrCheckReport(filePath, expected, {root = projectRoot, extension, check = false} = {}) {
  const output = await assertSafeReportOutput(filePath, {root, extension});
  if (check) {
    const actual = await readFile(output, "utf8").catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    invariant(actual === expected, `${projectPath(output, root)} is missing or stale`);
    return;
  }
  await mkdir(path.dirname(output), {recursive: true});
  await assertSafeReportOutput(output, {root, extension});
  await writeFile(output, expected);
}

export function parseArguments(argv) {
  const options = {
    check: false,
    ffdec: "ffdec",
    concurrency: 4,
    jsonOutput: DEFAULT_JSON_OUTPUT,
    markdownOutput: DEFAULT_MARKDOWN_OUTPUT,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (["--ffdec", "--concurrency", "--json-output", "--markdown-output"].includes(argument)) {
      const value = argv[++index];
      invariant(value, `${argument} requires a value`);
      if (argument === "--ffdec") options.ffdec = value;
      else if (argument === "--concurrency") {
        options.concurrency = Number(value);
        invariant(Number.isInteger(options.concurrency) && options.concurrency >= 1 && options.concurrency <= 8,
          "--concurrency must be an integer from 1 through 8");
      } else if (argument === "--json-output") options.jsonOutput = path.resolve(value);
      else options.markdownOutput = path.resolve(value);
    } else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function usage() {
  return `Usage: node scripts/build-g4-l3-machine-source-audits.mjs [options]\n\n` +
    `  --check                    Re-extract and verify checked-in reports byte-for-byte\n` +
    `  --ffdec <command>          FFDec launcher (default: ffdec)\n` +
    `  --concurrency <1-8>        Concurrent source audits (default: 4)\n` +
    `  --json-output <path>       JSON output inside reports/\n` +
    `  --markdown-output <path>   Markdown output inside reports/\n`;
}

async function main(argv) {
  const options = parseArguments(argv);
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  await Promise.all([
    assertSafeReportOutput(options.jsonOutput, {extension: ".json"}),
    assertSafeReportOutput(options.markdownOutput, {extension: ".md"}),
  ]);
  const report = await buildG4L3MachineSourceAudits({ffdec: options.ffdec, concurrency: options.concurrency});
  const json = stableJson(report);
  const markdown = renderG4L3MachineSourceAuditsMarkdown(report);
  await Promise.all([
    writeOrCheckReport(options.jsonOutput, json, {extension: ".json", check: options.check}),
    writeOrCheckReport(options.markdownOutput, markdown, {extension: ".md", check: options.check}),
  ]);
  process.stdout.write(`${options.check ? "PASS" : "WROTE"}: G4 L3 static machine source audits; ` +
    `${report.summary.canonicalItems} items; ${report.summary.spriteDefinitionCount} sprite definitions; ` +
    `${report.summary.exportedScriptFileCount} script files\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
