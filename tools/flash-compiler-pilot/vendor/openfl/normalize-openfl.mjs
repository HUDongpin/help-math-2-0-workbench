#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const [dataPath, catalogPath, animationId, outputPath] = process.argv.slice(2);

if (!dataPath || !catalogPath || !animationId || !outputPath) {
  console.error(
    "usage: node normalize-openfl.mjs <data.json> <catalog/animations.json> <animationId> <output.json>",
  );
  process.exit(2);
}

const stableStringify = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

const sha256 = (value) =>
  createHash("sha256").update(stableStringify(value)).digest("hex");

const symbolTypes = Object.freeze({
  0: "bitmap",
  1: "button",
  2: "dynamic-text",
  3: "font",
  4: "shape",
  5: "sprite",
  6: "static-text",
});

const operationTypes = Object.freeze({ 0: "create", 1: "update", 2: "destroy" });

const data = JSON.parse(await readFile(dataPath, "utf8"));
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const catalogEntry = catalog.animations.find((entry) => entry.animationId === animationId);

if (!catalogEntry) throw new Error(`catalog animation not found: ${animationId}`);
if (catalogEntry.flags?.shell !== false) {
  throw new Error(`${animationId}: pilot accepts page SWFs only; shell flag must be false`);
}
if (catalogEntry.flags?.referenced !== true || catalogEntry.flags?.unreferenced !== false) {
  throw new Error(`${animationId}: pilot corpus must be an active referenced page`);
}
if (data.root !== 0 || data.symbols?.[0]?.type !== 5) {
  throw new Error(`${animationId}: OpenFL root symbol contract changed`);
}

const definedIds = new Set(
  data.symbols.filter((symbol) => Number.isInteger(symbol.id)).map((symbol) => symbol.id),
);
const danglingReferences = [];
const scriptSources = [];
const soundLikeFields = [];

for (const [symbolIndex, symbol] of data.symbols.entries()) {
  const symbolId = symbolIndex === data.root ? "root" : symbol.id;
  for (const [frameIndex, frame] of (symbol.frames ?? []).entries()) {
    if (Object.hasOwn(frame, "scriptSource")) {
      scriptSources.push({ symbolId, frame: frameIndex + 1 });
    }
    for (const object of frame.objects ?? []) {
      if (Number.isInteger(object.symbol) && !definedIds.has(object.symbol)) {
        danglingReferences.push({
          parentSymbolId: symbolId,
          frame: frameIndex + 1,
          depth: object.depth,
          operation: operationTypes[object.type] ?? `unknown-${object.type}`,
          missingSymbolId: object.symbol,
          placementId: object.id,
        });
      }
    }
  }
  for (const key of Object.keys(symbol)) {
    if (/sound|audio/i.test(key)) soundLikeFields.push({ symbolId, key });
  }
}

const normalizedSymbols = data.symbols.map((symbol, symbolIndex) => {
  const result = { ...symbol };
  result.id = symbolIndex === data.root ? "root" : symbol.id;
  result.type = symbolTypes[symbol.type] ?? `unknown-${symbol.type}`;
  if (result.frames) {
    result.frames = result.frames.map((frame) => ({
      ...frame,
      objects: frame.objects?.map((object) => ({
        ...object,
        operation: operationTypes[object.type] ?? `unknown-${object.type}`,
      })),
    }));
  }
  return result;
});

const staticFacts = {
  stage: catalogEntry.source.swf.stage,
  backgroundColor: null,
  fps: catalogEntry.source.swf.fps,
  rootFrameCount: catalogEntry.source.swf.frameCount,
};

const unsupported = [];
if (danglingReferences.length > 0) {
  unsupported.push({
    code: "dangling-symbol-reference",
    severity: "blocking",
    count: danglingReferences.length,
    details: danglingReferences,
  });
}
unsupported.push({
  code: "avm1-not-lowered",
  severity: "blocking",
  detail: "OpenFL FrameScriptParser converts selected AVM2 frame scripts only; HELP SWFs are AVM1/AS1-2.",
});
unsupported.push({
  code: "audio-not-exported",
  severity: "blocking-when-audio-required",
  detail: "OpenFL AnimateLibraryExporter.addSound is TODO and emitted no sound assets or sound events.",
});
unsupported.push({
  code: "stage-background-not-emitted",
  severity: "supplement-required",
  detail: "Stage and background are supplied from the hash-bound HELP catalog, not OpenFL data.json.",
});

const normalized = {
  schemaVersion: "help-flash-visual-ir.pilot.v1",
  identity: {
    animationId,
    assetId: catalogEntry.assetId,
    sourcePath: catalogEntry.source.path,
    sourceSha256: catalogEntry.source.sha256,
    pageOnly: true,
    referenced: true,
    shell: false,
  },
  backend: {
    id: "openfl-swf-animate",
    swfLibraryVersion: "3.4.0",
    swfCommit: "82b3aa5864030580c74316de30c9cce1fce7f377",
    openflVersion: "9.5.2",
    limeVersion: "8.3.2",
    haxeVersion: "4.3.7",
    sourceDataVersion: data.version,
    sourceUuidDiscardedAsNondeterministic: true,
  },
  document: staticFacts,
  encoding: {
    displayCoordinates: "twips",
    twipsPerPixel: 20,
    matrixLayout: ["a", "b", "c", "d", "txTwips", "tyTwips"],
    colorTransformLayout: [
      "redMultiplierTimes20",
      "greenMultiplierTimes20",
      "blueMultiplierTimes20",
      "alphaMultiplierTimes20",
      "redOffsetTimes20",
      "greenOffsetTimes20",
      "blueOffsetTimes20",
      "alphaOffsetTimes20",
    ],
    note: "OpenFL Animate JSON quantizes translations, rectangles, shape points, and color-transform values through its twip() serializer.",
  },
  rootSymbolId: "root",
  symbols: normalizedSymbols,
  audit: {
    sourceSymbolCount: data.symbols.length,
    scriptSourceCount: scriptSources.length,
    soundLikeFieldCount: soundLikeFields.length,
    danglingReferenceCount: danglingReferences.length,
    unsupported,
    visualIrStatus: danglingReferences.length === 0 ? "structurally-normalized-candidate" : "incomplete-blocked",
    behaviorStatus: "missing-avm1",
    audioStatus: "missing",
    fidelityStatus: "not-evaluated",
  },
};

normalized.deterministicPayloadSha256 = sha256(normalized);
await writeFile(outputPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify({
    animationId,
    outputPath: path.resolve(outputPath),
    deterministicPayloadSha256: normalized.deterministicPayloadSha256,
    visualIrStatus: normalized.audit.visualIrStatus,
    symbolCount: normalized.symbols.length,
    danglingReferenceCount: danglingReferences.length,
    scriptSourceCount: scriptSources.length,
    soundLikeFieldCount: soundLikeFields.length,
  }),
);
