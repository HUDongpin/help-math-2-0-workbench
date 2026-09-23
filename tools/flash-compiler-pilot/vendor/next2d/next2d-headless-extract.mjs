#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import zlib from "node:zlib";

const TAG_NAMES = new Map([
  [0, "End"], [1, "ShowFrame"], [2, "DefineShape"], [3, "FreeCharacter"],
  [4, "PlaceObject"], [5, "RemoveObject"], [6, "DefineBits"], [7, "DefineButton"],
  [8, "JPEGTables"], [9, "SetBackgroundColor"], [10, "DefineFont"], [11, "DefineText"],
  [12, "DoAction"], [13, "DefineFontInfo"], [14, "DefineSound"], [15, "StartSound"],
  [16, "StopSound"], [17, "DefineButtonSound"], [18, "SoundStreamHead"], [19, "SoundStreamBlock"],
  [20, "DefineBitsLossless"], [21, "DefineBitsJPEG2"], [22, "DefineShape2"], [23, "DefineButtonCxform"],
  [24, "Protect"], [25, "PathsArePostScript"], [26, "PlaceObject2"], [28, "RemoveObject2"],
  [29, "SyncFrame"], [31, "FreeAll"], [32, "DefineShape3"], [33, "DefineText2"],
  [34, "DefineButton2"], [35, "DefineBitsJPEG3"], [36, "DefineBitsLossless2"], [37, "DefineEditText"],
  [38, "DefineVideo"], [39, "DefineSprite"], [40, "NameCharacter"], [41, "ProductInfo"],
  [42, "DefineTextFormat"], [43, "FrameLabel"], [44, "DefineBehavior"], [45, "SoundStreamHead2"],
  [46, "DefineMorphShape"], [47, "FrameTag"], [48, "DefineFont2"], [49, "GenCommand"],
  [52, "FontRef"], [53, "DefineFunction"], [54, "PlaceFunction"], [55, "GenTagObject"],
  [56, "ExportAssets"], [57, "ImportAssets"], [58, "EnableDebugger"], [59, "DoInitAction"],
  [60, "DefineVideoStream"], [61, "VideoFrame"], [62, "DefineFontInfo2"], [63, "DebugID"],
  [64, "EnableDebugger2"], [65, "ScriptLimits"], [66, "SetTabIndex"], [69, "FileAttributes"],
  [70, "PlaceObject3"], [71, "ImportAssets2"], [72, "DoABC"], [73, "DefineFontAlignZones"],
  [74, "CSMTextSettings"], [75, "DefineFont3"], [76, "SymbolClass"], [77, "Metadata"],
  [78, "DefineScalingGrid"], [82, "DoABC2"], [83, "DefineShape4"], [84, "DefineMorphShape2"],
  [86, "DefineSceneAndFrameLabelData"], [87, "DefineBinaryData"], [88, "DefineFontName"],
  [89, "StartSound2"], [90, "DefineBitsJPEG4"], [91, "DefineFont4"], [93, "EnableTelemetry"],
]);

const SUPPORTED_TAGS = new Set([
  0, 1, 2, 4, 5, 6, 7, 8, 10, 11, 13, 14, 15, 17, 18, 19, 20, 21,
  22, 26, 28, 32, 33, 34, 35, 36, 37, 39, 43, 45, 46, 48, 62, 70, 73,
  74, 75, 76, 78, 83, 84, 88, 89, 90,
]);
const SKIPPED_TAGS = new Set([
  9, 12, 24, 40, 41, 56, 59, 60, 61, 63, 64, 65, 69, 72, 77, 82, 86, 87,
]);
const TODO_TAGS = new Set([
  3, 16, 23, 25, 29, 31, 38, 42, 44, 47, 49, 52, 53, 54, 55, 57, 58,
  66, 71, 91, 93,
]);
const INVALID_TAGS = new Set([27, 30, 67, 68, 79, 80, 81, 85, 92]);
const SCRIPT_TAGS = new Set([12, 59, 72, 82]);

function usage(message = "") {
  if (message) console.error(message);
  console.error("Usage: next2d-headless-extract.mjs --worker <SwfParserWorker.js> --catalog <animations.json> --out <dir> --input <id>=<swf> [--input ...]");
  process.exit(message ? 2 : 0);
}

function parseArgs(argv) {
  const result = { inputs: [] };
  for (let i = 0; i < argv.length; ++i) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") usage();
    if (arg === "--worker" || arg === "--catalog" || arg === "--out" || arg === "--input") {
      if (i + 1 >= argv.length) usage(`Missing value after ${arg}`);
      const value = argv[++i];
      if (arg === "--worker") result.worker = value;
      if (arg === "--catalog") result.catalog = value;
      if (arg === "--out") result.out = value;
      if (arg === "--input") {
        const equal = value.indexOf("=");
        if (equal <= 0 || equal === value.length - 1) usage(`Invalid --input ${value}`);
        result.inputs.push({ id: value.slice(0, equal), file: value.slice(equal + 1) });
      }
      continue;
    }
    usage(`Unknown argument ${arg}`);
  }
  if (!result.worker || !result.catalog || !result.out || !result.inputs.length) usage("--worker, --catalog, --out, and at least one --input are required");
  return result;
}

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function exactReplace(source, needle, replacement, label) {
  const first = source.indexOf(needle);
  if (first < 0 || source.indexOf(needle, first + needle.length) >= 0) {
    throw new Error(`Fail closed: ${label} instrumentation anchor was not found exactly once`);
  }
  return source.slice(0, first) + replacement + source.slice(first + needle.length);
}

function instrumentWorker(source) {
  source = exactReplace(
    source,
    `    parseTag (tag_type, length, parent, frame, tags, cache_place_objects)\n    {\n        switch (tag_type) {`,
    `    parseTag (tag_type, length, parent, frame, tags, cache_place_objects)\n    {\n        globalThis.__next2dMetrics.tagCounts[tag_type] = (globalThis.__next2dMetrics.tagCounts[tag_type] || 0) + 1;\n        globalThis.__next2dMetrics.tagBytes[tag_type] = (globalThis.__next2dMetrics.tagBytes[tag_type] || 0) + length;\n        switch (tag_type) {`,
    "parseTag",
  );
  source = exactReplace(
    source,
    `            offset = endOffset - this.byteStream.byte_offset | 0;\n\n            this.byteStream.byte_offset += offset;`,
    `            offset = endOffset - this.byteStream.byte_offset | 0;\n            if (offset > 0) {\n                globalThis.__next2dMetrics.buttonActionContainerCount++;\n                globalThis.__next2dMetrics.buttonActionPayloadBytes += offset;\n            }\n\n            this.byteStream.byte_offset += offset;`,
    "DefineButton action payload",
  );
  source = exactReplace(
    source,
    `        } else if (offset > 0) {\n            button._$actions = this.buttonActions(endOffset);`,
    `        } else if (offset > 0) {\n            globalThis.__next2dMetrics.buttonActionContainerCount++;\n            globalThis.__next2dMetrics.buttonActionPayloadBytes += Math.max(0, endOffset - this.byteStream.byte_offset);\n            button._$actions = this.buttonActions(endOffset);`,
    "DefineButton2 action payload",
  );
  source = exactReplace(
    source,
    `            const ActionRecordSize = this.byteStream.getUI32();\n            if (EventFlags.keyPress) {`,
    `            const ActionRecordSize = this.byteStream.getUI32();\n            globalThis.__next2dMetrics.clipActionRecordCount++;\n            globalThis.__next2dMetrics.clipActionPayloadBytes += ActionRecordSize;\n            if (EventFlags.keyPress) {`,
    "clip action payload",
  );
  return source;
}

function inflateSwf(raw) {
  if (raw.length < 8) throw new Error("SWF shorter than its fixed header");
  const signature = raw.subarray(0, 3).toString("ascii");
  const version = raw[3];
  const declaredFileLength = raw.readUInt32LE(4);
  let full;
  if (signature === "FWS") {
    full = Buffer.from(raw);
  } else if (signature === "CWS") {
    const header = Buffer.alloc(8);
    header.write("FWS", 0, "ascii");
    header[3] = version;
    header.writeUInt32LE(declaredFileLength, 4);
    full = Buffer.concat([header, zlib.inflateSync(raw.subarray(8))]);
  } else if (signature === "ZWS") {
    throw new Error("Fail closed: ZWS/LZMA is not implemented by this dependency-free wrapper");
  } else {
    throw new Error(`Not a SWF signature: ${JSON.stringify(signature)}`);
  }
  if (full.length !== declaredFileLength) {
    throw new Error(`Fail closed: declared SWF length ${declaredFileLength} != decompressed length ${full.length}`);
  }
  return { signature, version, declaredFileLength, full };
}

function readSwfHeader(full) {
  let bitOffset = 8 * 8;
  const readBits = (count) => {
    let value = 0;
    for (let i = 0; i < count; ++i) {
      const byte = full[bitOffset >> 3];
      if (byte === undefined) throw new Error("Unexpected EOF in SWF RECT");
      value = value * 2 + ((byte >> (7 - (bitOffset & 7))) & 1);
      ++bitOffset;
    }
    return value;
  };
  const readSigned = (count) => {
    const value = readBits(count);
    const sign = 2 ** (count - 1);
    return value >= sign ? value - 2 ** count : value;
  };
  const nbits = readBits(5);
  const xMinTwips = readSigned(nbits);
  const xMaxTwips = readSigned(nbits);
  const yMinTwips = readSigned(nbits);
  const yMaxTwips = readSigned(nbits);
  let offset = Math.ceil(bitOffset / 8);
  if (offset + 4 > full.length) throw new Error("Unexpected EOF in SWF frame header");
  const frameRateRaw = full.readUInt16LE(offset);
  const fps = frameRateRaw / 256;
  offset += 2;
  const declaredFrameCount = full.readUInt16LE(offset);
  offset += 2;
  return {
    tagOffset: offset,
    fps,
    declaredFrameCount,
    stage: {
      xMinTwips, xMaxTwips, yMinTwips, yMaxTwips,
      xMin: xMinTwips / 20, xMax: xMaxTwips / 20,
      yMin: yMinTwips / 20, yMax: yMaxTwips / 20,
      width: (xMaxTwips - xMinTwips) / 20,
      height: (yMaxTwips - yMinTwips) / 20,
    },
  };
}

function safeLogPart(value) {
  if (typeof value === "string") return value;
  try { return JSON.stringify(value); } catch { return String(value); }
}

function encode(value, seen = new WeakSet()) {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "undefined") return { $type: "undefined" };
  if (typeof value === "bigint") return { $type: "BigInt", value: value.toString() };
  if (ArrayBuffer.isView(value)) {
    return {
      $type: value.constructor.name,
      length: "length" in value ? value.length : value.byteLength,
      base64: Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString("base64"),
    };
  }
  if (value instanceof ArrayBuffer) {
    return { $type: "ArrayBuffer", byteLength: value.byteLength, base64: Buffer.from(value).toString("base64") };
  }
  if (typeof value !== "object") return { $type: typeof value, value: String(value) };
  if (seen.has(value)) throw new Error("Fail closed: cyclic object in Next2D worker event");
  seen.add(value);
  let result;
  if (Array.isArray(value)) {
    result = value.map((entry) => encode(entry, seen));
  } else if (value instanceof Map) {
    result = { $type: "Map", entries: [...value.entries()].map(([key, entry]) => [encode(key, seen), encode(entry, seen)]) };
  } else if (value instanceof Set) {
    result = { $type: "Set", values: [...value].map((entry) => encode(entry, seen)) };
  } else {
    result = {};
    for (const key of Object.keys(value).sort()) result[key] = encode(value[key], seen);
  }
  seen.delete(value);
  return result;
}

function summarizeTags(metrics) {
  const details = Object.keys(metrics.tagCounts)
    .map(Number)
    .sort((a, b) => a - b)
    .map((code) => {
      const classification = SUPPORTED_TAGS.has(code) ? "parsed"
        : SKIPPED_TAGS.has(code) ? "skipped"
          : TODO_TAGS.has(code) ? "todo"
            : INVALID_TAGS.has(code) ? "invalid"
              : "unknown";
      return {
        code,
        name: TAG_NAMES.get(code) || `Tag${code}`,
        classification,
        count: metrics.tagCounts[code],
        payloadBytes: metrics.tagBytes[code],
      };
    });
  const reduce = (classification) => details.filter((entry) => entry.classification === classification)
    .reduce((acc, entry) => ({ tags: acc.tags + entry.count, payloadBytes: acc.payloadBytes + entry.payloadBytes }), { tags: 0, payloadBytes: 0 });
  return {
    details,
    totals: {
      all: details.reduce((acc, entry) => acc + entry.count, 0),
      parsed: reduce("parsed"),
      skipped: reduce("skipped"),
      todo: reduce("todo"),
      invalid: reduce("invalid"),
      unknown: reduce("unknown"),
    },
    scriptTagsDiscarded: details.filter((entry) => SCRIPT_TAGS.has(entry.code)),
  };
}

function summarizeEvents(events, header) {
  const characters = new Map();
  const fontIds = new Set();
  let fontShapeChunkCount = 0;
  let fontZoneChunkCount = 0;
  let symbolClassMappingCount = 0;
  const eventTypes = {};
  for (const event of events) {
    const key = event.infoKey || "unknown";
    eventTypes[key] = (eventTypes[key] || 0) + 1;
    if (key === "character") characters.set(event.characterId, event.piece);
    if (key === "font") fontIds.add(event.index);
    if (key === "font_shape") ++fontShapeChunkCount;
    if (key === "font_zone") ++fontZoneChunkCount;
    if (key === "_$symbols") symbolClassMappingCount += event.pieces?.length || 0;
  }
  const objects = [...characters.entries()].map(([characterId, piece]) => ({ characterId, piece }));
  const typeCounts = {};
  for (const { piece } of objects) {
    const type = piece?._$name || "unknown";
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }
  const domains = objects
    .filter(({ piece }) => piece?._$name === "MovieClip")
    .map(({ characterId, piece }) => ({
      characterId,
      frames: Math.max(0, (piece._$controller?.length || 0) - 1),
      labels: piece._$labels?.length || 0,
      placements: piece._$placeObjects?.length || 0,
      instances: piece._$dictionary?.length || 0,
      namedInstances: piece._$dictionary?.filter((entry) => Boolean(entry?.Name)).length || 0,
      soundFrames: piece._$sounds?.length || 0,
      soundCues: piece._$sounds?.reduce((count, entry) => count + (entry?.data?.length || 0), 0) || 0,
    }))
    .sort((a, b) => a.characterId - b.characterId);
  const root = domains.find((entry) => entry.characterId === 0) || null;
  const nested = domains.filter((entry) => entry.characterId !== 0);
  return {
    eventCount: events.length,
    eventTypes,
    characterCountIncludingRoot: characters.size,
    symbolCountExcludingRoot: characters.has(0) ? characters.size - 1 : characters.size,
    typeCounts,
    fontCount: fontIds.size,
    fontShapeChunkCount,
    fontZoneChunkCount,
    symbolClassMappingCount,
    root: {
      declaredFrames: header.declaredFrameCount,
      parsedFrames: root?.frames ?? null,
      frameCountMatches: root?.frames === header.declaredFrameCount,
      placements: root?.placements ?? null,
      instances: root?.instances ?? null,
      namedInstances: root?.namedInstances ?? null,
      labels: root?.labels ?? null,
      soundFrames: root?.soundFrames ?? null,
      soundCues: root?.soundCues ?? null,
    },
    frameDomains: {
      countIncludingRoot: domains.length,
      nestedCount: nested.length,
      totalFrames: domains.reduce((sum, entry) => sum + entry.frames, 0),
      maxNestedFrames: nested.reduce((max, entry) => Math.max(max, entry.frames), 0),
      nestedOverRootFrameCount: nested.filter((entry) => entry.frames > header.declaredFrameCount).length,
      domains,
    },
    placementsAcrossAllDomains: domains.reduce((sum, entry) => sum + entry.placements, 0),
    instancesAcrossAllDomains: domains.reduce((sum, entry) => sum + entry.instances, 0),
    namedInstancesAcrossAllDomains: domains.reduce((sum, entry) => sum + entry.namedInstances, 0),
    soundCuesAcrossAllDomains: domains.reduce((sum, entry) => sum + entry.soundCues, 0),
  };
}

function extractOne({ id, file, catalogRecord }, workerSource, workerPath, outputRoot) {
  const start = process.hrtime.bigint();
  const raw = fs.readFileSync(file);
  const sourceSha256 = sha256(raw);
  if (sourceSha256 !== catalogRecord.source.sha256 || raw.length !== catalogRecord.source.bytes) {
    throw new Error(`Fail closed: ${id} input bytes do not match the catalog source binding`);
  }
  const inflated = inflateSwf(raw);
  const header = readSwfHeader(inflated.full);
  const catalogSwf = catalogRecord.source.swf;
  if (inflated.signature !== catalogSwf.signature
    || inflated.version !== catalogSwf.version
    || header.fps !== catalogSwf.fps
    || header.declaredFrameCount !== catalogSwf.frameCount
    || header.stage.width !== catalogSwf.stage.width
    || header.stage.height !== catalogSwf.stage.height
  ) {
    throw new Error(`Fail closed: ${id} parsed SWF header does not match the catalog`);
  }
  const events = [];
  const logs = [];
  let messageHandler = null;
  const metrics = {
    tagCounts: {},
    tagBytes: {},
    buttonActionContainerCount: 0,
    buttonActionPayloadBytes: 0,
    clipActionRecordCount: 0,
    clipActionPayloadBytes: 0,
  };
  const sandbox = {
    ArrayBuffer, BigInt, Boolean, DataView, Date, Error, Infinity,
    Int8Array, Int16Array, Int32Array, JSON, Map, Math, NaN, Number,
    Object, Promise, RangeError, ReferenceError, RegExp, Set, String,
    SyntaxError, TextDecoder, TextEncoder, TypeError, URIError,
    Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, WeakMap, WeakSet,
    decodeURI, decodeURIComponent, encodeURI, encodeURIComponent,
    escape, isFinite, isNaN, parseFloat, parseInt, unescape,
    __next2dMetrics: metrics,
    console: {
      log: (...parts) => logs.push({ level: "log", message: parts.map(safeLogPart).join(" ") }),
      warn: (...parts) => logs.push({ level: "warn", message: parts.map(safeLogPart).join(" ") }),
      error: (...parts) => logs.push({ level: "error", message: parts.map(safeLogPart).join(" ") }),
    },
    postMessage: (message) => events.push(structuredClone(message)),
    addEventListener: (type, handler) => {
      if (type !== "message" || messageHandler) throw new Error(`Unexpected worker listener: ${type}`);
      messageHandler = handler;
    },
  };
  vm.createContext(sandbox, { name: `next2d:${id}` });
  vm.runInContext(workerSource, sandbox, { filename: workerPath, timeout: 10_000 });
  if (typeof messageHandler !== "function") throw new Error("Fail closed: worker did not register one message handler");
  sandbox.__next2dEvent = {
    data: {
      version: inflated.version,
      offset: header.tagOffset,
      buffer: new Uint8Array(inflated.full),
    },
  };
  sandbox.__next2dMessageHandler = messageHandler;
  vm.runInContext("__next2dMessageHandler(__next2dEvent)", sandbox, { timeout: 60_000 });
  if (!events.some((event) => event.infoKey === "character" && event.characterId === 0)) {
    throw new Error("Fail closed: Next2D worker emitted no root character 0");
  }

  const itemOut = path.join(outputRoot, id);
  fs.mkdirSync(itemOut, { recursive: true });
  const eventStream = `${events.map((event) => JSON.stringify(encode(event))).join("\n")}\n`;
  const eventFile = path.join(itemOut, "next2d-worker-events.ndjson");
  fs.writeFileSync(eventFile, eventStream);
  const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  const tagSummary = summarizeTags(metrics);
  const eventSummary = summarizeEvents(events, header);
  const result = {
    schemaVersion: 1,
    extractor: {
      kind: "instrumented-next2d-swf-worker",
      workerPath,
      workerSha256: sha256(fs.readFileSync(workerPath)),
      wrapperSha256: sha256(fs.readFileSync(new URL(import.meta.url))),
      node: process.version,
      limitations: [
        "The upstream worker emits display-list data but discards AVM1 DoAction/DoInitAction payloads.",
        "Button and clip event condition metadata may be parsed, but their ActionScript payload bytes are skipped.",
        "SetBackgroundColor is skipped by the upstream worker.",
        "SoundStreamHead/SoundStreamBlock bytes are consumed but are not emitted in worker events.",
        "The upstream authoring-tool adapter leaves SimpleButton as TODO, does not materialize MorphShape, and has its StaticText glyph conversion commented out.",
        "This wrapper supports FWS and CWS; ZWS fails closed.",
        "Output is a Current-JS visual-IR candidate only, not fidelity or acceptance evidence.",
      ],
    },
    source: {
      id,
      path: path.resolve(file),
      bytes: raw.length,
      sha256: sourceSha256,
      signature: inflated.signature,
      swfVersion: inflated.version,
      declaredFileLength: inflated.declaredFileLength,
      decompressedBytes: inflated.full.length,
      catalog: {
        animationId: catalogRecord.animationId,
        canonicalAnimationId: catalogRecord.canonicalAnimationId,
        canonicalPath: catalogRecord.source.path,
        collection: catalogRecord.classification.collection,
        grade: catalogRecord.classification.grade,
        lesson: catalogRecord.classification.lesson,
        section: catalogRecord.classification.section.code,
        page: catalogRecord.classification.page.number,
        pairedFlaPath: catalogRecord.pairedFla?.path || null,
        referencedActivePage: catalogRecord.flags.referenced,
        shell: catalogRecord.flags.shell,
        unreferenced: catalogRecord.flags.unreferenced,
        variant: catalogRecord.flags.variant,
      },
    },
    header,
    parse: {
      elapsedMs,
      logs,
      tagSummary,
      discardedActionPayloads: {
        timelineScriptTags: tagSummary.scriptTagsDiscarded,
        timelineScriptTagCount: tagSummary.scriptTagsDiscarded.reduce((sum, entry) => sum + entry.count, 0),
        timelineScriptPayloadBytes: tagSummary.scriptTagsDiscarded.reduce((sum, entry) => sum + entry.payloadBytes, 0),
        buttonActionContainerCount: metrics.buttonActionContainerCount,
        buttonActionPayloadBytes: metrics.buttonActionPayloadBytes,
        clipActionRecordCount: metrics.clipActionRecordCount,
        clipActionPayloadBytes: metrics.clipActionPayloadBytes,
      },
      knownNonEmittingData: {
        setBackgroundColorTags: tagSummary.details.filter((entry) => entry.code === 9).reduce((sum, entry) => sum + entry.count, 0),
        soundStreamHeadTags: tagSummary.details.filter((entry) => entry.code === 18 || entry.code === 45).reduce((sum, entry) => sum + entry.count, 0),
        soundStreamBlockTags: tagSummary.details.filter((entry) => entry.code === 19).reduce((sum, entry) => sum + entry.count, 0),
        soundStreamBlockPayloadBytes: tagSummary.details.filter((entry) => entry.code === 19).reduce((sum, entry) => sum + entry.payloadBytes, 0),
        exportAssetsTags: tagSummary.details.filter((entry) => entry.code === 56).reduce((sum, entry) => sum + entry.count, 0),
      },
      output: {
        eventFile: path.basename(eventFile),
        eventBytes: Buffer.byteLength(eventStream),
        eventSha256: sha256(eventStream),
      },
      ...eventSummary,
    },
  };
  fs.writeFileSync(path.join(itemOut, "summary.json"), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

const args = parseArgs(process.argv.slice(2));
const workerPath = path.resolve(args.worker);
const catalogPath = path.resolve(args.catalog);
const outputRoot = path.resolve(args.out);
fs.mkdirSync(outputRoot, { recursive: true });
const catalogBytes = fs.readFileSync(catalogPath);
const catalog = JSON.parse(catalogBytes);
const catalogById = new Map(catalog.animations.map((record) => [record.animationId, record]));
const seenIds = new Set();
for (const input of args.inputs) {
  if (seenIds.has(input.id)) throw new Error(`Fail closed: duplicate input id ${input.id}`);
  seenIds.add(input.id);
  const record = catalogById.get(input.id);
  if (!record) throw new Error(`Fail closed: input id ${input.id} is absent from the animation catalog`);
  if (!record.isCanonical
    || record.flags.shell
    || !record.flags.referenced
    || record.flags.unreferenced
    || record.flags.variant
    || record.classification.collection !== "course"
    || !record.classification.section?.code
    || !record.classification.page?.number
  ) {
    throw new Error(`Fail closed: ${input.id} is not one canonical active lesson page with shell=false`);
  }
  input.catalogRecord = record;
}
const rawWorker = fs.readFileSync(workerPath, "utf8");
const workerSource = instrumentWorker(rawWorker);
const results = [];
for (const input of args.inputs) {
  const result = extractOne({
    id: input.id,
    file: path.resolve(input.file),
    catalogRecord: input.catalogRecord,
  }, workerSource, workerPath, outputRoot);
  results.push(result);
  console.log(`${input.id}\t${result.parse.elapsedMs.toFixed(1)} ms\t${result.parse.symbolCountExcludingRoot} symbols\t${result.parse.frameDomains.countIncludingRoot} frame domains\t${result.parse.discardedActionPayloads.timelineScriptTagCount} discarded script tags`);
}
const aggregate = {
  schemaVersion: 1,
  pageOnlyCorpus: true,
  legacyCourseShellCount: 0,
  catalog: {
    path: catalogPath,
    sha256: sha256(catalogBytes),
  },
  itemCount: results.length,
  results: results.map((result) => ({
    id: result.source.id,
    sourceSha256: result.source.sha256,
    summary: path.join(result.source.id, "summary.json"),
    eventStream: path.join(result.source.id, result.parse.output.eventFile),
    eventSha256: result.parse.output.eventSha256,
  })),
  totals: {
    sourceBytes: results.reduce((sum, result) => sum + result.source.bytes, 0),
    decompressedBytes: results.reduce((sum, result) => sum + result.source.decompressedBytes, 0),
    parseElapsedMs: results.reduce((sum, result) => sum + result.parse.elapsedMs, 0),
    eventBytes: results.reduce((sum, result) => sum + result.parse.output.eventBytes, 0),
    symbols: results.reduce((sum, result) => sum + result.parse.symbolCountExcludingRoot, 0),
    frameDomains: results.reduce((sum, result) => sum + result.parse.frameDomains.countIncludingRoot, 0),
    parsedFramesAcrossDomains: results.reduce((sum, result) => sum + result.parse.frameDomains.totalFrames, 0),
    placementsAcrossDomains: results.reduce((sum, result) => sum + result.parse.placementsAcrossAllDomains, 0),
    timelineScriptTagsDiscarded: results.reduce((sum, result) => sum + result.parse.discardedActionPayloads.timelineScriptTagCount, 0),
    timelineScriptPayloadBytesDiscarded: results.reduce((sum, result) => sum + result.parse.discardedActionPayloads.timelineScriptPayloadBytes, 0),
    buttonActionPayloadBytesDiscarded: results.reduce((sum, result) => sum + result.parse.discardedActionPayloads.buttonActionPayloadBytes, 0),
    clipActionPayloadBytesDiscarded: results.reduce((sum, result) => sum + result.parse.discardedActionPayloads.clipActionPayloadBytes, 0),
    setBackgroundColorTagsNotEmitted: results.reduce((sum, result) => sum + result.parse.knownNonEmittingData.setBackgroundColorTags, 0),
    soundStreamHeadTagsNotEmitted: results.reduce((sum, result) => sum + result.parse.knownNonEmittingData.soundStreamHeadTags, 0),
    soundStreamBlockTagsNotEmitted: results.reduce((sum, result) => sum + result.parse.knownNonEmittingData.soundStreamBlockTags, 0),
    soundStreamBlockPayloadBytesNotEmitted: results.reduce((sum, result) => sum + result.parse.knownNonEmittingData.soundStreamBlockPayloadBytes, 0),
    rawStaticTextCharactersNeedingCustomAdapter: results.reduce((sum, result) => sum + (result.parse.typeCounts.StaticText || 0), 0),
    rawSimpleButtonCharactersNeedingCustomAdapter: results.reduce((sum, result) => sum + (result.parse.typeCounts.SimpleButton || 0), 0),
    rawMorphShapeCharactersNeedingCustomAdapter: results.reduce((sum, result) => sum + (result.parse.typeCounts.MorphShape || 0), 0),
  },
};
fs.writeFileSync(path.join(outputRoot, "aggregate.json"), `${JSON.stringify(aggregate, null, 2)}\n`);
