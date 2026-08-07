#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {inflateSync} from "node:zlib";
import {fileURLToPath, pathToFileURL} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const REPORT_VERSION = 1;
const WORK_CARDS_PATH = path.join(projectRoot, "reports", "g4-l3-implementation-work-cards.json");
const DEFAULT_JSON_OUTPUT = path.join(projectRoot, "reports", "g4-l3-swf-asset-definition-census.json");
const DEFAULT_MARKDOWN_OUTPUT = path.join(projectRoot, "reports", "g4-l3-swf-asset-definition-census.md");

const DEFINITION_TAGS = new Map([
  [2, {name: "DefineShape", category: "shape"}],
  [22, {name: "DefineShape2", category: "shape"}],
  [32, {name: "DefineShape3", category: "shape"}],
  [83, {name: "DefineShape4", category: "shape"}],
  [46, {name: "DefineMorphShape", category: "morph"}],
  [84, {name: "DefineMorphShape2", category: "morph"}],
  [6, {name: "DefineBits", category: "bitmap"}],
  [20, {name: "DefineBitsLossless", category: "bitmap"}],
  [21, {name: "DefineBitsJPEG2", category: "bitmap"}],
  [35, {name: "DefineBitsJPEG3", category: "bitmap"}],
  [36, {name: "DefineBitsLossless2", category: "bitmap"}],
  [90, {name: "DefineBitsJPEG4", category: "bitmap"}],
  [10, {name: "DefineFont", category: "font"}],
  [48, {name: "DefineFont2", category: "font"}],
  [75, {name: "DefineFont3", category: "font"}],
  [91, {name: "DefineFont4", category: "font"}],
  [11, {name: "DefineText", category: "text"}],
  [33, {name: "DefineText2", category: "text"}],
  [37, {name: "DefineEditText", category: "text"}],
  [7, {name: "DefineButton", category: "button"}],
  [34, {name: "DefineButton2", category: "button"}],
  [39, {name: "DefineSprite", category: "sprite"}],
  [14, {name: "DefineSound", category: "sound"}],
  [60, {name: "DefineVideoStream", category: "video"}],
  [87, {name: "DefineBinaryData", category: "binary"}],
]);

const COMPANION_TAGS = new Map([
  [8, {name: "JPEGTables", category: "bitmap-companion"}],
  [13, {name: "DefineFontInfo", category: "font-companion"}],
  [62, {name: "DefineFontInfo2", category: "font-companion"}],
  [73, {name: "DefineFontAlignZones", category: "font-companion"}],
  [88, {name: "DefineFontName", category: "font-companion"}],
  [18, {name: "SoundStreamHead", category: "sound-stream"}],
  [45, {name: "SoundStreamHead2", category: "sound-stream"}],
  [19, {name: "SoundStreamBlock", category: "sound-stream"}],
  [61, {name: "VideoFrame", category: "video-frame"}],
]);

const CATEGORY_ORDER = ["shape", "morph", "bitmap", "font", "text", "button", "sprite", "sound", "video", "binary"];
const utf8Decoder = new TextDecoder("utf-8", {fatal: true});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function relative(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function countBy(values, selector) {
  const result = {};
  for (const value of values) {
    const key = selector(value);
    result[key] = (result[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right, "en")));
}

function emptyCategoryCounts() {
  return Object.fromEntries(CATEGORY_ORDER.map((category) => [category, 0]));
}

function decodeUtf8Exact(bytes) {
  try {
    return utf8Decoder.decode(bytes);
  } catch {
    return null;
  }
}

function parseLengthPrefixedSwfName(fieldBytes) {
  const terminated = fieldBytes.length > 0 && fieldBytes.at(-1) === 0;
  const nameBytes = terminated ? fieldBytes.subarray(0, fieldBytes.length - 1) : fieldBytes;
  return {
    exactName: decodeUtf8Exact(nameBytes),
    nameRawSha256: sha256(nameBytes),
    nameFieldRawSha256: sha256(fieldBytes),
    nameFieldNullTerminated: terminated,
  };
}

function readNullTerminated(bytes, start, label) {
  invariant(start >= 0 && start <= bytes.length, `${label}: invalid string offset`);
  const end = bytes.indexOf(0, start);
  invariant(end !== -1, `${label}: unterminated SWF string`);
  const raw = bytes.subarray(start, end);
  return {
    nextOffset: end + 1,
    byteLength: raw.length,
    rawSha256: sha256(raw),
    utf8: decodeUtf8Exact(raw),
  };
}

class BitReader {
  constructor(bytes, byteOffset = 0) {
    this.bytes = bytes;
    this.bitOffset = byteOffset * 8;
  }

  ensure(bits, label = "bit field") {
    invariant(this.bitOffset + bits <= this.bytes.length * 8, `Truncated ${label}`);
  }

  readUnsigned(bits, label) {
    invariant(Number.isInteger(bits) && bits >= 0 && bits <= 32, `Invalid ${label || "bit field"} width ${bits}`);
    this.ensure(bits, label);
    let value = 0;
    for (let index = 0; index < bits; index += 1) {
      const absolute = this.bitOffset + index;
      const bit = (this.bytes[absolute >> 3] >> (7 - (absolute & 7))) & 1;
      value = value * 2 + bit;
    }
    this.bitOffset += bits;
    return value;
  }

  readSigned(bits, label) {
    if (bits === 0) return 0;
    const value = this.readUnsigned(bits, label);
    const sign = 2 ** (bits - 1);
    return value >= sign ? value - 2 ** bits : value;
  }

  align() {
    this.bitOffset = Math.ceil(this.bitOffset / 8) * 8;
  }

  get byteOffset() {
    invariant(this.bitOffset % 8 === 0, "Bit reader is not byte aligned");
    return this.bitOffset / 8;
  }
}

function readRect(reader) {
  const bits = reader.readUnsigned(5, "RECT Nbits");
  const values = Array.from({length: 4}, () => reader.readSigned(bits, "RECT coordinate"));
  reader.align();
  return values;
}

function readMatrix(reader) {
  if (reader.readUnsigned(1, "MATRIX HasScale")) {
    const bits = reader.readUnsigned(5, "MATRIX scale Nbits");
    reader.readSigned(bits, "MATRIX ScaleX");
    reader.readSigned(bits, "MATRIX ScaleY");
  }
  if (reader.readUnsigned(1, "MATRIX HasRotate")) {
    const bits = reader.readUnsigned(5, "MATRIX rotate Nbits");
    reader.readSigned(bits, "MATRIX RotateSkew0");
    reader.readSigned(bits, "MATRIX RotateSkew1");
  }
  const translateBits = reader.readUnsigned(5, "MATRIX translate Nbits");
  reader.readSigned(translateBits, "MATRIX TranslateX");
  reader.readSigned(translateBits, "MATRIX TranslateY");
  reader.align();
}

function parseFontDefinition(record) {
  const bytes = record.payload;
  const result = {
    characterId: record.characterId,
    tagCode: record.tagCode,
    tagName: record.tagName,
    exactName: null,
    nameRawSha256: null,
    glyphCount: null,
    codePointCount: null,
    codePoints: null,
    parseStatus: "metadata-not-available-in-tag",
  };
  try {
    if (record.tagCode === 10) {
      invariant(bytes.length >= 4, "DefineFont is too short");
      const firstOffset = bytes.readUInt16LE(2);
      invariant(firstOffset >= 2 && firstOffset % 2 === 0, "DefineFont first offset is invalid");
      result.glyphCount = firstOffset / 2;
      result.parseStatus = "exact-glyph-count; name-and-code-table-require-companion-tag";
      return result;
    }
    if (record.tagCode === 48 || record.tagCode === 75) {
      invariant(bytes.length >= 7, `${record.tagName} is too short`);
      const flags = bytes[2];
      const wideOffsets = Boolean(flags & 0x08);
      const wideCodes = Boolean(flags & 0x04);
      const nameLength = bytes[4];
      const nameStart = 5;
      const nameEnd = nameStart + nameLength;
      invariant(nameEnd + 2 <= bytes.length, `${record.tagName} font name is truncated`);
      const nameBytes = bytes.subarray(nameStart, nameEnd);
      Object.assign(result, parseLengthPrefixedSwfName(nameBytes));
      const glyphCount = bytes.readUInt16LE(nameEnd);
      result.glyphCount = glyphCount;
      const offsetTableStart = nameEnd + 2;
      const offsetWidth = wideOffsets ? 4 : 2;
      const codeTableOffsetPosition = offsetTableStart + glyphCount * offsetWidth;
      invariant(codeTableOffsetPosition + offsetWidth <= bytes.length, `${record.tagName} offset table is truncated`);
      const codeTableOffset = wideOffsets
        ? bytes.readUInt32LE(codeTableOffsetPosition)
        : bytes.readUInt16LE(codeTableOffsetPosition);
      const codeTableStart = offsetTableStart + codeTableOffset;
      const codeWidth = wideCodes ? 2 : 1;
      invariant(codeTableStart + glyphCount * codeWidth <= bytes.length, `${record.tagName} code table is truncated`);
      const codePoints = [];
      for (let index = 0; index < glyphCount; index += 1) {
        codePoints.push(codeWidth === 2
          ? bytes.readUInt16LE(codeTableStart + index * 2)
          : bytes[codeTableStart + index]);
      }
      result.codePointCount = codePoints.length;
      result.codePoints = codePoints;
      result.parseStatus = result.exactName === null
        ? "exact-glyph-and-code-table; name-bytes-not-valid-utf8"
        : "exact-name-glyph-and-code-table";
      return result;
    }
    if (record.tagCode === 91) {
      invariant(bytes.length >= 4, "DefineFont4 is too short");
      const parsedName = readNullTerminated(bytes, 3, "DefineFont4 name");
      result.exactName = parsedName.utf8;
      result.nameRawSha256 = parsedName.rawSha256;
      result.parseStatus = parsedName.utf8 === null
        ? "exact-name-bytes-not-valid-utf8; glyph-count-opaque-cff"
        : "exact-name; glyph-count-opaque-cff";
      return result;
    }
  } catch (error) {
    result.parseStatus = `parse-failed: ${error.message}`;
  }
  return result;
}

function parseFontCompanion(record) {
  const bytes = record.payload;
  const result = {
    tagCode: record.tagCode,
    tagName: record.tagName,
    fontId: null,
    exactName: null,
    nameRawSha256: null,
    codePoints: null,
    parseStatus: "not-parsed",
  };
  try {
    invariant(bytes.length >= 2, `${record.tagName} is too short`);
    result.fontId = bytes.readUInt16LE(0);
    if (record.tagCode === 13 || record.tagCode === 62) {
      invariant(bytes.length >= 4, `${record.tagName} is too short`);
      const nameLength = bytes[2];
      const nameStart = 3;
      const nameEnd = nameStart + nameLength;
      invariant(nameEnd + 1 <= bytes.length, `${record.tagName} name is truncated`);
      const nameBytes = bytes.subarray(nameStart, nameEnd);
      Object.assign(result, parseLengthPrefixedSwfName(nameBytes));
      const flags = bytes[nameEnd];
      const codeStart = nameEnd + 1 + (record.tagCode === 62 ? 1 : 0);
      invariant(codeStart <= bytes.length, `${record.tagName} code table start is truncated`);
      const wideCodes = Boolean(flags & 0x01);
      const codeWidth = wideCodes ? 2 : 1;
      invariant((bytes.length - codeStart) % codeWidth === 0, `${record.tagName} code table has a partial code`);
      const codePoints = [];
      for (let offset = codeStart; offset < bytes.length; offset += codeWidth) {
        codePoints.push(codeWidth === 2 ? bytes.readUInt16LE(offset) : bytes[offset]);
      }
      result.codePoints = codePoints;
      result.parseStatus = result.exactName === null
        ? "exact-name-bytes-not-valid-utf8-and-code-table"
        : "exact-name-and-code-table";
    } else if (record.tagCode === 88) {
      const name = readNullTerminated(bytes, 2, "DefineFontName name");
      const copyright = readNullTerminated(bytes, name.nextOffset, "DefineFontName copyright");
      invariant(copyright.nextOffset === bytes.length, "DefineFontName has unexpected trailing bytes");
      result.exactName = name.utf8;
      result.nameRawSha256 = name.rawSha256;
      result.copyright = copyright.utf8;
      result.copyrightRawSha256 = copyright.rawSha256;
      result.parseStatus = name.utf8 === null || copyright.utf8 === null
        ? "exact-string-bytes-not-valid-utf8"
        : "exact-name-and-copyright";
    }
  } catch (error) {
    result.parseStatus = `parse-failed: ${error.message}`;
  }
  return result;
}

function parseEditText(record) {
  const bytes = record.payload;
  try {
    invariant(bytes.length >= 4, "DefineEditText is too short");
    const reader = new BitReader(bytes, 2);
    readRect(reader);
    const flags = {
      hasText: Boolean(reader.readUnsigned(1, "DefineEditText HasText")),
      wordWrap: Boolean(reader.readUnsigned(1, "DefineEditText WordWrap")),
      multiline: Boolean(reader.readUnsigned(1, "DefineEditText Multiline")),
      password: Boolean(reader.readUnsigned(1, "DefineEditText Password")),
      readOnly: Boolean(reader.readUnsigned(1, "DefineEditText ReadOnly")),
      hasTextColor: Boolean(reader.readUnsigned(1, "DefineEditText HasTextColor")),
      hasMaxLength: Boolean(reader.readUnsigned(1, "DefineEditText HasMaxLength")),
      hasFont: Boolean(reader.readUnsigned(1, "DefineEditText HasFont")),
      hasFontClass: Boolean(reader.readUnsigned(1, "DefineEditText HasFontClass")),
      autoSize: Boolean(reader.readUnsigned(1, "DefineEditText AutoSize")),
      hasLayout: Boolean(reader.readUnsigned(1, "DefineEditText HasLayout")),
      noSelect: Boolean(reader.readUnsigned(1, "DefineEditText NoSelect")),
      border: Boolean(reader.readUnsigned(1, "DefineEditText Border")),
      wasStatic: Boolean(reader.readUnsigned(1, "DefineEditText WasStatic")),
      html: Boolean(reader.readUnsigned(1, "DefineEditText HTML")),
      useOutlines: Boolean(reader.readUnsigned(1, "DefineEditText UseOutlines")),
    };
    reader.align();
    let offset = reader.byteOffset;
    let fontId = null;
    if (flags.hasFont) {
      invariant(offset + 2 <= bytes.length, "DefineEditText FontID is truncated");
      fontId = bytes.readUInt16LE(offset);
      offset += 2;
    }
    let fontClass = null;
    if (flags.hasFontClass) {
      fontClass = readNullTerminated(bytes, offset, "DefineEditText FontClass");
      offset = fontClass.nextOffset;
    }
    if (flags.hasFont) offset += 2;
    if (flags.hasTextColor) offset += 4;
    if (flags.hasMaxLength) offset += 2;
    if (flags.hasLayout) offset += 9;
    invariant(offset <= bytes.length, "DefineEditText optional fields are truncated");
    const variableName = readNullTerminated(bytes, offset, "DefineEditText VariableName");
    offset = variableName.nextOffset;
    let initialText = null;
    if (flags.hasText) {
      initialText = readNullTerminated(bytes, offset, "DefineEditText InitialText");
      offset = initialText.nextOffset;
    }
    invariant(offset === bytes.length, "DefineEditText has unexpected trailing bytes");
    return {
      characterId: record.characterId,
      tagCode: record.tagCode,
      tagName: record.tagName,
      parseStatus: [variableName, initialText, fontClass].filter(Boolean).every((entry) => entry.utf8 !== null)
        ? "exact"
        : "exact-string-bytes-not-valid-utf8",
      flags,
      fontId,
      fontClass: fontClass?.utf8 ?? null,
      variableName: variableName.utf8,
      initialText: initialText?.utf8 ?? null,
      initialTextRawSha256: initialText?.rawSha256 ?? null,
    };
  } catch (error) {
    return {
      characterId: record.characterId,
      tagCode: record.tagCode,
      tagName: record.tagName,
      parseStatus: `parse-failed: ${error.message}`,
      initialText: null,
    };
  }
}

function parseStaticText(record, fontCodeTables) {
  const bytes = record.payload;
  const runs = [];
  try {
    invariant(bytes.length >= 5, `${record.tagName} is too short`);
    const headerReader = new BitReader(bytes, 2);
    readRect(headerReader);
    readMatrix(headerReader);
    let offset = headerReader.byteOffset;
    invariant(offset + 2 <= bytes.length, `${record.tagName} glyph widths are truncated`);
    const glyphBits = bytes[offset];
    const advanceBits = bytes[offset + 1];
    offset += 2;
    let fontId = null;
    while (offset < bytes.length) {
      const flags = bytes[offset];
      offset += 1;
      if (flags === 0) break;
      invariant((flags & 0x80) !== 0, `${record.tagName} TextRecordType is not set`);
      const hasFont = Boolean(flags & 0x08);
      const hasColor = Boolean(flags & 0x04);
      const hasYOffset = Boolean(flags & 0x02);
      const hasXOffset = Boolean(flags & 0x01);
      if (hasFont) {
        invariant(offset + 2 <= bytes.length, `${record.tagName} FontID is truncated`);
        fontId = bytes.readUInt16LE(offset);
        offset += 2;
      }
      if (hasColor) offset += record.tagCode === 33 ? 4 : 3;
      if (hasXOffset) offset += 2;
      if (hasYOffset) offset += 2;
      if (hasFont) offset += 2;
      invariant(offset + 1 <= bytes.length, `${record.tagName} style fields are truncated`);
      const glyphCount = bytes[offset];
      offset += 1;
      const glyphReader = new BitReader(bytes, offset);
      const glyphIndexes = [];
      for (let index = 0; index < glyphCount; index += 1) {
        glyphIndexes.push(glyphReader.readUnsigned(glyphBits, `${record.tagName} GlyphIndex`));
        glyphReader.readSigned(advanceBits, `${record.tagName} GlyphAdvance`);
      }
      glyphReader.align();
      offset = glyphReader.byteOffset;
      const codeTable = fontCodeTables.get(fontId);
      const codePoints = codeTable && glyphIndexes.every((index) => index < codeTable.length)
        ? glyphIndexes.map((index) => codeTable[index])
        : null;
      let exactText = null;
      if (codePoints) {
        try {
          exactText = String.fromCodePoint(...codePoints);
        } catch {
          exactText = null;
        }
      }
      runs.push({fontId, glyphCount, glyphIndexes, codePoints, exactText});
    }
    invariant(offset === bytes.length, `${record.tagName} has unexpected trailing bytes`);
    return {
      characterId: record.characterId,
      tagCode: record.tagCode,
      tagName: record.tagName,
      parseStatus: runs.every((run) => run.exactText !== null)
        ? "exact-glyph-index-to-embedded-code-table"
        : "glyph-records-exact; one-or-more-code-tables-unavailable",
      runs,
    };
  } catch (error) {
    return {
      characterId: record.characterId,
      tagCode: record.tagCode,
      tagName: record.tagName,
      parseStatus: `parse-failed: ${error.message}`,
      runs: [],
    };
  }
}

function parseDefinitionSpecificFacts(record) {
  const bytes = record.payload;
  try {
    if (record.tagCode === 39) {
      invariant(bytes.length >= 4, "DefineSprite is too short");
      return {declaredFrameCount: bytes.readUInt16LE(2)};
    }
    if (record.tagCode === 14) {
      invariant(bytes.length >= 7, "DefineSound is too short");
      const packed = bytes[2];
      return {
        soundFormat: packed >> 4,
        soundRate: (packed >> 2) & 0x03,
        soundSize: (packed >> 1) & 0x01,
        soundType: packed & 0x01,
        sampleCount: bytes.readUInt32LE(3),
        encodedAudioBytes: bytes.length - 7,
      };
    }
    if (record.tagCode === 60) {
      invariant(bytes.length >= 10, "DefineVideoStream is too short");
      return {
        declaredFrameCount: bytes.readUInt16LE(2),
        width: bytes.readUInt16LE(4),
        height: bytes.readUInt16LE(6),
        codecId: bytes[9],
      };
    }
    if (record.tagCode === 87) {
      invariant(bytes.length >= 6, "DefineBinaryData is too short");
      return {binaryBytes: bytes.length - 6};
    }
  } catch (error) {
    return {parseError: error.message};
  }
  return null;
}

export function decompressSwf(sourceBytes) {
  invariant(sourceBytes.length >= 12, "SWF is too short");
  const signature = sourceBytes.subarray(0, 3).toString("ascii");
  let bytes;
  if (signature === "FWS") {
    bytes = Buffer.from(sourceBytes);
  } else if (signature === "CWS") {
    bytes = Buffer.concat([
      Buffer.from("FWS"),
      sourceBytes.subarray(3, 8),
      inflateSync(sourceBytes.subarray(8)),
    ]);
  } else {
    throw new Error(`Unsupported SWF signature ${signature}; ZWS parsing is deliberately fail-closed`);
  }
  const declaredLength = sourceBytes.readUInt32LE(4);
  invariant(bytes.length === declaredLength, `SWF declared length ${declaredLength} differs from decompressed length ${bytes.length}`);
  return {bytes, signature, declaredLength, version: sourceBytes[3]};
}

function swfTagOffset(bytes) {
  const reader = new BitReader(bytes, 8);
  readRect(reader);
  const timelineHeaderOffset = reader.byteOffset;
  invariant(timelineHeaderOffset + 4 <= bytes.length, "SWF timeline header is truncated");
  return {
    tagOffset: timelineHeaderOffset + 4,
    fps: bytes[timelineHeaderOffset + 1] + bytes[timelineHeaderOffset] / 256,
    rootFrameCount: bytes.readUInt16LE(timelineHeaderOffset + 2),
  };
}

function parseTagStream(bytes, start, end, records, streams, containerPath = "root", definitionDepth = 0) {
  let offset = start;
  let terminated = false;
  while (offset < end) {
    invariant(offset + 2 <= end, `${containerPath}: truncated SWF tag header`);
    const headerStart = offset;
    const tagHeader = bytes.readUInt16LE(offset);
    offset += 2;
    const tagCode = tagHeader >> 6;
    let payloadLength = tagHeader & 0x3f;
    let headerLength = 2;
    if (payloadLength === 0x3f) {
      invariant(offset + 4 <= end, `${containerPath}: truncated long SWF tag length`);
      payloadLength = bytes.readUInt32LE(offset);
      offset += 4;
      headerLength = 6;
    }
    const payloadStart = offset;
    const payloadEnd = payloadStart + payloadLength;
    invariant(payloadEnd <= end, `${containerPath}: truncated SWF tag ${tagCode}`);
    const payload = bytes.subarray(payloadStart, payloadEnd);
    const definition = DEFINITION_TAGS.get(tagCode);
    const companion = COMPANION_TAGS.get(tagCode);
    const record = {
      ordinal: records.length + 1,
      containerPath,
      definitionDepth,
      tagCode,
      tagName: definition?.name || companion?.name || `TagCode${tagCode}`,
      tagKind: definition ? "definition" : companion ? "companion" : "other",
      category: definition?.category || companion?.category || null,
      headerOffset: headerStart,
      headerLength,
      payloadOffset: payloadStart,
      payloadLength,
      rawTagPayloadSha256: sha256(payload),
      exactTagIdentitySha256: sha256(Buffer.concat([
        Buffer.from([tagCode & 0xff, (tagCode >> 8) & 0xff]),
        payload,
      ])),
      characterId: definition && payload.length >= 2 ? payload.readUInt16LE(0) : null,
      payload,
    };
    records.push(record);
    if (tagCode === 39) {
      invariant(payload.length >= 4, `${containerPath}: truncated DefineSprite`);
      const spriteId = payload.readUInt16LE(0);
      parseTagStream(bytes, payloadStart + 4, payloadEnd, records, streams, `${containerPath}/sprite-${spriteId}`, definitionDepth + 1);
    }
    offset = payloadEnd;
    if (tagCode === 0) {
      terminated = true;
      break;
    }
  }
  invariant(terminated, `${containerPath}: tag stream has no End tag`);
  const trailing = bytes.subarray(offset, end);
  streams.push({
    containerPath,
    definitionDepth,
    declaredPayloadEndOffset: end,
    parsedEndOffset: offset,
    trailingBytesAfterEnd: trailing.length,
    trailingBytesSha256: trailing.length ? sha256(trailing) : null,
    trailingBytesAllZero: trailing.length ? trailing.every((value) => value === 0) : true,
  });
  return offset;
}

function summarizeExactText(textFacts) {
  const occurrences = [];
  for (const fact of textFacts) {
    if (fact.tagCode === 37 && fact.parseStatus === "exact" && fact.initialText !== null) {
      occurrences.push({
        characterId: fact.characterId,
        tagName: fact.tagName,
        source: "DefineEditText.InitialText",
        exactText: fact.initialText,
        rawSha256: fact.initialTextRawSha256,
        exactTextUtf8Sha256: sha256(Buffer.from(fact.initialText, "utf8")),
      });
    }
    if ((fact.tagCode === 11 || fact.tagCode === 33) && fact.runs) {
      fact.runs.forEach((run, runIndex) => {
        if (run.exactText !== null) occurrences.push({
          characterId: fact.characterId,
          tagName: fact.tagName,
          source: `TextRecord[${runIndex}] glyph indexes resolved through embedded font code table`,
          fontId: run.fontId,
          exactText: run.exactText,
          exactTextUtf8Sha256: sha256(Buffer.from(run.exactText, "utf8")),
          codePointSequenceSha256: sha256(Buffer.from(JSON.stringify(run.codePoints))),
        });
      });
    }
  }
  return occurrences;
}

export function collectSwfAssetDefinitions(sourceBytes) {
  const decompressed = decompressSwf(sourceBytes);
  const header = swfTagOffset(decompressed.bytes);
  const records = [];
  const streams = [];
  const rootEndOffset = parseTagStream(decompressed.bytes, header.tagOffset, decompressed.bytes.length, records, streams);
  const definitions = records.filter((record) => record.tagKind === "definition");
  const companions = records.filter((record) => record.tagKind === "companion");
  for (const record of definitions) {
    invariant(record.payloadLength >= 2, `${record.tagName} definition is too short to contain CharacterID`);
  }

  const fontFacts = definitions.filter((record) => record.category === "font").map(parseFontDefinition);
  const fontCompanionFacts = companions.filter((record) => record.category === "font-companion").map(parseFontCompanion);
  const fontCodeTables = new Map();
  for (const fact of fontFacts) {
    if (Array.isArray(fact.codePoints)) fontCodeTables.set(fact.characterId, fact.codePoints);
  }
  for (const companion of fontCompanionFacts) {
    if (Array.isArray(companion.codePoints)) fontCodeTables.set(companion.fontId, companion.codePoints);
    const font = fontFacts.find((candidate) => candidate.characterId === companion.fontId);
    if (font && companion.exactName !== null && font.exactName === null) {
      font.exactName = companion.exactName;
      font.nameRawSha256 = companion.nameRawSha256;
      font.nameSourceTag = companion.tagName;
    }
    if (font && Array.isArray(companion.codePoints) && font.codePoints === null) {
      font.codePoints = companion.codePoints;
      font.codePointCount = companion.codePoints.length;
      font.codeTableSourceTag = companion.tagName;
    }
  }

  const textFacts = definitions.filter((record) => record.category === "text").map((record) => {
    if (record.tagCode === 37) return parseEditText(record);
    return parseStaticText(record, fontCodeTables);
  });
  const categoryCounts = emptyCategoryCounts();
  for (const definition of definitions) categoryCounts[definition.category] += 1;
  const tagCounts = countBy(definitions, (definition) => definition.tagName);
  const companionTagCounts = countBy(companions, (companion) => companion.tagName);
  const reportedFontFacts = fontFacts.map((fact) => {
    const {codePoints, ...rest} = fact;
    return {
      ...rest,
      codePointTableSha256: Array.isArray(codePoints) ? sha256(Buffer.from(JSON.stringify(codePoints))) : null,
      codePointMin: Array.isArray(codePoints) && codePoints.length ? Math.min(...codePoints) : null,
      codePointMax: Array.isArray(codePoints) && codePoints.length ? Math.max(...codePoints) : null,
    };
  });
  const reportedFontCompanionFacts = fontCompanionFacts.map((fact) => {
    const {codePoints, ...rest} = fact;
    return {
      ...rest,
      codePointCount: Array.isArray(codePoints) ? codePoints.length : null,
      codePointTableSha256: Array.isArray(codePoints) ? sha256(Buffer.from(JSON.stringify(codePoints))) : null,
      codePointMin: Array.isArray(codePoints) && codePoints.length ? Math.min(...codePoints) : null,
      codePointMax: Array.isArray(codePoints) && codePoints.length ? Math.max(...codePoints) : null,
    };
  });
  const reportedTextFacts = textFacts.map((fact) => {
    if (!Array.isArray(fact.runs)) return fact;
    return {
      characterId: fact.characterId,
      tagCode: fact.tagCode,
      tagName: fact.tagName,
      parseStatus: fact.parseStatus,
      runCount: fact.runs.length,
      exactRunCount: fact.runs.filter((run) => run.exactText !== null).length,
      unresolvedRunCount: fact.runs.filter((run) => run.exactText === null).length,
      fontIds: [...new Set(fact.runs.map((run) => run.fontId).filter(Number.isInteger))].sort((left, right) => left - right),
    };
  });

  return {
    sourceFormat: {
      signature: decompressed.signature,
      version: decompressed.version,
      declaredUncompressedBytes: decompressed.declaredLength,
      actualUncompressedBytes: decompressed.bytes.length,
      rootFrameCount: header.rootFrameCount,
      fps: header.fps,
      rootTagStreamEndOffset: rootEndOffset,
    },
    tagStream: {
      recursiveTagCount: records.length,
      definitionCount: definitions.length,
      companionCount: companions.length,
      categoryCounts,
      tagCounts,
      companionTagCounts,
      streams,
    },
    definitions: definitions.map((record) => {
      const specificFacts = parseDefinitionSpecificFacts(record);
      return {
        ordinal: record.ordinal,
        containerPath: record.containerPath,
        definitionDepth: record.definitionDepth,
        tagCode: record.tagCode,
        tagName: record.tagName,
        category: record.category,
        characterId: record.characterId,
        payloadLength: record.payloadLength,
        rawTagPayloadSha256: record.rawTagPayloadSha256,
        exactTagIdentitySha256: record.exactTagIdentitySha256,
        ...(specificFacts ? {specificFacts} : {}),
      };
    }),
    companions: companions.map((record) => ({
      ordinal: record.ordinal,
      containerPath: record.containerPath,
      tagCode: record.tagCode,
      tagName: record.tagName,
      category: record.category,
      payloadLength: record.payloadLength,
      rawTagPayloadSha256: record.rawTagPayloadSha256,
    })),
    fontFacts: reportedFontFacts,
    fontCompanionFacts: reportedFontCompanionFacts,
    textFacts: reportedTextFacts,
    exactTextOccurrences: summarizeExactText(textFacts),
  };
}

export function buildReuseGroups(items) {
  const groups = new Map();
  for (const item of items) {
    for (const definition of item.definitions) {
      const key = `${definition.tagCode}:${definition.rawTagPayloadSha256}`;
      if (!groups.has(key)) groups.set(key, {
        tagCode: definition.tagCode,
        tagName: definition.tagName,
        category: definition.category,
        payloadLength: definition.payloadLength,
        rawTagPayloadSha256: definition.rawTagPayloadSha256,
        exactTagIdentitySha256: definition.exactTagIdentitySha256,
        occurrences: [],
      });
      groups.get(key).occurrences.push({
        sequence: item.sequence,
        animationId: item.animationId,
        sourceSwfPath: item.source.path,
        sourceSwfSha256: item.source.sha256,
        ordinal: definition.ordinal,
        containerPath: definition.containerPath,
        characterId: definition.characterId,
      });
    }
  }
  const duplicateGroups = [...groups.values()]
    .filter((group) => group.occurrences.length > 1)
    .map((group) => ({
      ...group,
      occurrenceCount: group.occurrences.length,
      sourceSwfCount: new Set(group.occurrences.map((occurrence) => occurrence.sourceSwfSha256)).size,
      itemCount: new Set(group.occurrences.map((occurrence) => occurrence.animationId)).size,
    }))
    .sort((left, right) =>
      right.sourceSwfCount - left.sourceSwfCount ||
      right.occurrenceCount - left.occurrenceCount ||
      left.tagCode - right.tagCode ||
      left.rawTagPayloadSha256.localeCompare(right.rawTagPayloadSha256, "en"));
  return {
    allIdentityCount: groups.size,
    duplicateGroups,
    crossSwfReuseGroups: duplicateGroups.filter((group) => group.sourceSwfCount > 1),
  };
}

function uniqueExactTextInventory(items) {
  const values = new Map();
  for (const item of items) {
    for (const occurrence of item.exactTextOccurrences) {
      const key = JSON.stringify([
        occurrence.exactText,
        occurrence.rawSha256 || null,
        occurrence.codePointSequenceSha256 || null,
      ]);
      if (!values.has(key)) values.set(key, {
        exactText: occurrence.exactText,
        rawSha256: occurrence.rawSha256 || null,
        exactTextUtf8Sha256: occurrence.exactTextUtf8Sha256,
        codePointSequenceSha256: occurrence.codePointSequenceSha256 || null,
        occurrences: [],
      });
      values.get(key).occurrences.push({
        animationId: item.animationId,
        characterId: occurrence.characterId,
        tagName: occurrence.tagName,
        source: occurrence.source,
        fontId: occurrence.fontId ?? null,
      });
    }
  }
  return [...values.values()]
    .map((value) => ({...value, occurrenceCount: value.occurrences.length}))
    .sort((left, right) => left.exactText.localeCompare(right.exactText, "en") || right.occurrenceCount - left.occurrenceCount);
}

function exactFontNameInventory(items) {
  const names = new Map();
  for (const item of items) {
    for (const font of item.fontFacts) {
      if (font.exactName === null) continue;
      const key = JSON.stringify([font.exactName, font.nameRawSha256]);
      if (!names.has(key)) names.set(key, {
        exactName: font.exactName,
        nameRawSha256: font.nameRawSha256,
        occurrences: [],
      });
      names.get(key).occurrences.push({
        animationId: item.animationId,
        characterId: font.characterId,
        tagName: font.tagName,
        glyphCount: font.glyphCount,
        codePointCount: font.codePointCount,
        nameSourceTag: font.nameSourceTag || font.tagName,
      });
    }
  }
  return [...names.values()]
    .map((value) => ({...value, occurrenceCount: value.occurrences.length}))
    .sort((left, right) => left.exactName.localeCompare(right.exactName, "en") || right.occurrenceCount - left.occurrenceCount);
}

export function validateAssetDefinitionCensus(report) {
  invariant(report.schemaVersion === REPORT_VERSION, "asset-definition census schemaVersion mismatch");
  invariant(report.reportType === "g4-l3-swf-asset-definition-census", "asset-definition census report type mismatch");
  invariant(report.acceptance?.acceptanceNeutral === true, "asset-definition census must remain acceptance-neutral");
  for (const gate of ["originalRuntime", "visualParity", "behaviorParity", "audioAcceptance", "humanReview", "ownerAcceptance", "migrationCompletion"]) {
    invariant(report.acceptance.gates?.[gate] === false, `asset-definition census gate ${gate} must remain false`);
  }
  invariant(report.scope?.canonicalItems === 40 && report.scope?.activePages === 39 && report.scope?.courseShells === 1, "asset-definition census must retain 39 pages plus shell");
  invariant(report.scope?.uniqueSourceSwfPaths === 40 && report.scope?.uniqueSourceSwfBinaries === 40, "asset-definition census requires 40 unique source SWFs");
  invariant(report.items?.length === 40, "asset-definition census requires 40 item records");
  invariant(report.items.every((item) => item.source.physicalHashVerified === true), "every source SWF must be physically rehashed");
  invariant(report.summary.totalDefinitions === report.items.reduce((sum, item) => sum + item.tagStream.definitionCount, 0), "definition total mismatch");
  invariant(report.summary.uniqueExactDefinitionIdentities === report.reuse.allIdentityCount, "unique definition identity total mismatch");
  invariant(report.reuse.crossSwfReuseGroups.every((group) => group.sourceSwfCount > 1), "cross-SWF reuse group must span multiple source binaries");
  invariant(report.method.runtimeVisibilityEstablished === false && report.method.authoringSemanticsEstablished === false && report.method.rendererReuseAuthorized === false, "asset-definition method must not imply runtime or authoring proof");
  return report;
}

export async function buildAssetDefinitionCensus() {
  const [workCardBytes, workCards, generatorBytes] = await Promise.all([
    readFile(WORK_CARDS_PATH),
    readJson(WORK_CARDS_PATH),
    readFile(scriptPath),
  ]);
  invariant(workCards.reportType === "g4-l3-implementation-work-cards", "unexpected G4 L3 work-card report type");
  invariant(workCards.cards?.length === 40, "G4 L3 work cards must contain 40 canonical items");
  invariant(workCards.summary.activePages === 39 && workCards.summary.courseShells === 1, "G4 L3 work-card scope mismatch");
  invariant(new Set(workCards.cards.map((card) => card.animationId)).size === 40, "G4 L3 animation IDs are not unique");
  invariant(new Set(workCards.cards.map((card) => card.source.swf.path)).size === 40, "G4 L3 source SWF paths are not unique");
  invariant(new Set(workCards.cards.map((card) => card.source.swf.sha256)).size === 40, "G4 L3 source SWF binaries are not unique");

  const items = [];
  for (const card of [...workCards.cards].sort((left, right) => left.sequence - right.sequence)) {
    const sourcePath = path.join(projectRoot, card.source.swf.path);
    const sourceBytes = await readFile(sourcePath);
    const physicalSha256 = sha256(sourceBytes);
    invariant(physicalSha256 === card.source.swf.sha256, `${card.animationId}: physical SWF SHA-256 mismatch`);
    invariant(sourceBytes.length === card.source.swf.bytes, `${card.animationId}: physical SWF byte count mismatch`);
    invariant(card.assetId === `swf-${physicalSha256}`, `${card.animationId}: assetId does not bind the physical SWF`);
    const parsed = collectSwfAssetDefinitions(sourceBytes);
    invariant(parsed.sourceFormat.rootFrameCount === card.runtime.rootFrameCount, `${card.animationId}: parsed root FrameCount mismatch`);
    invariant(parsed.sourceFormat.fps === 12, `${card.animationId}: parsed FPS must remain 12`);
    for (const [category, workCardField] of [
      ["shape", "vectorShapeDefinitionCount"],
      ["morph", "morphShapeDefinitionCount"],
      ["bitmap", "rasterDefinitionCount"],
      ["text", "textDefinitionCount"],
      ["button", "buttonDefinitionCount"],
      ["sprite", "spriteDefinitionCount"],
    ]) {
      invariant(
        parsed.tagStream.categoryCounts[category] === card.signals.structural[workCardField],
        `${card.animationId}: ${category} definition count differs from the independently generated work-card fact`,
      );
    }
    items.push({
      sequence: card.sequence,
      animationId: card.animationId,
      assetId: card.assetId,
      releaseRole: card.releaseRole,
      batchId: card.batch.batchId,
      classification: {
        section: card.classification.section,
        page: card.classification.page,
        titleRaw: card.classification.titleRaw,
      },
      source: {
        path: card.source.swf.path,
        bytes: sourceBytes.length,
        sha256: physicalSha256,
        physicalHashVerified: true,
        signature: parsed.sourceFormat.signature,
        swfVersion: parsed.sourceFormat.version,
        declaredUncompressedBytes: parsed.sourceFormat.declaredUncompressedBytes,
      },
      runtime: {
        fps: parsed.sourceFormat.fps,
        rootFrameCount: parsed.sourceFormat.rootFrameCount,
      },
      tagStream: parsed.tagStream,
      definitionInventorySha256: sha256(Buffer.from(JSON.stringify(parsed.definitions.map((definition) => [
        definition.ordinal,
        definition.containerPath,
        definition.tagCode,
        definition.characterId,
        definition.payloadLength,
        definition.rawTagPayloadSha256,
      ])))),
      definitions: parsed.definitions,
      companions: parsed.companions,
      fontFacts: parsed.fontFacts,
      fontCompanionFacts: parsed.fontCompanionFacts,
      textFacts: parsed.textFacts,
      exactTextOccurrences: parsed.exactTextOccurrences,
    });
  }
  const reuse = buildReuseGroups(items);
  const categoryCounts = emptyCategoryCounts();
  for (const item of items) {
    for (const category of CATEGORY_ORDER) categoryCounts[category] += item.tagStream.categoryCounts[category];
  }
  const totalDefinitions = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
  const exactFontNames = exactFontNameInventory(items);
  const exactTextInventory = uniqueExactTextInventory(items);
  const reportItems = items.map(({companions, textFacts, exactTextOccurrences, ...item}) => ({
    ...item,
    exactTextOccurrenceCount: exactTextOccurrences.length,
  }));
  const report = {
    schemaVersion: REPORT_VERSION,
    reportType: "g4-l3-swf-asset-definition-census",
    generator: {
      path: relative(scriptPath),
      version: REPORT_VERSION,
      sha256: sha256(generatorBytes),
    },
    acceptance: {
      acceptanceNeutral: true,
      migrationStatusChanges: 0,
      reviewOrApprovalChanges: 0,
      protectedEvidenceChanges: 0,
      sourceAssetChanges: 0,
      gates: {
        originalRuntime: false,
        visualParity: false,
        behaviorParity: false,
        audioAcceptance: false,
        humanReview: false,
        ownerAcceptance: false,
        migrationCompletion: false,
      },
      statement: "This static, source-bound asset-definition census changes no migration or acceptance state and proves none of the strict fidelity gates.",
    },
    sourceBindings: {
      workCards: {
        path: relative(WORK_CARDS_PATH),
        bytes: workCardBytes.length,
        sha256: sha256(workCardBytes),
        schemaVersion: workCards.schemaVersion,
        reportType: workCards.reportType,
      },
      physicalRehash: {
        algorithm: "SHA-256 over every exact compressed source SWF byte sequence read from its catalog-bound path",
        requiredItems: 40,
        verifiedItems: items.length,
        sourceWrites: 0,
      },
    },
    scope: {
      releaseId: workCards.lesson.releaseId,
      canonicalItems: 40,
      activePages: 39,
      courseShells: 1,
      uniqueSourceSwfPaths: new Set(items.map((item) => item.source.path)).size,
      uniqueSourceSwfBinaries: new Set(items.map((item) => item.source.sha256)).size,
      sourceSwfBytes: items.reduce((sum, item) => sum + item.source.bytes, 0),
    },
    method: {
      parser: "direct binary SWF tag parse after zlib inflation of each hash-verified CWS source",
      definitionSet: Object.fromEntries([...DEFINITION_TAGS].map(([code, value]) => [String(code), value])),
      exactIdentity: "same SWF tag code plus SHA-256 of the complete uncompressed raw tag payload; CharacterID and all referenced local IDs remain included",
      recursion: "root tag stream plus any structurally nested DefineSprite tag streams",
      tagStreamTerminationPolicy: "End terminates each root/sprite tag stream; any retained bytes after End are hashed and reported but never interpreted as additional tags",
      exactStringPolicy: "emit a Unicode string only when null-terminated bytes decode as strict UTF-8 or when every DefineText glyph index resolves through an exactly parsed embedded font code table",
      exclusions: [
        "control tags, placement, script execution, and runtime visibility are not asset definitions",
        "streaming SoundStreamBlock and VideoFrame payloads are companion facts, not character definitions",
        "semantically equivalent definitions with different raw bytes or local CharacterIDs do not form an exact reuse group",
      ],
      runtimeVisibilityEstablished: false,
      authoringSemanticsEstablished: false,
      rendererReuseAuthorized: false,
      caveat: "An exact tag-payload match is byte identity only. It does not prove that the definition is placed or visible, that an authoring-library symbol was shared, that referenced local IDs resolve to identical dependencies, or that a renderer may safely reuse it.",
    },
    summary: {
      totalDefinitions,
      categoryCounts,
      tagCounts: countBy(items.flatMap((item) => item.definitions), (definition) => definition.tagName),
      uniqueExactDefinitionIdentities: reuse.allIdentityCount,
      exactDuplicateGroups: reuse.duplicateGroups.length,
      withinSingleSwfOnlyExactDuplicateGroups: reuse.duplicateGroups.filter((group) => group.sourceSwfCount === 1).length,
      crossSwfExactReuseGroups: reuse.crossSwfReuseGroups.length,
      crossSwfExactReuseOccurrences: reuse.crossSwfReuseGroups.reduce((sum, group) => sum + group.occurrenceCount, 0),
      crossSwfExactReuseGroupsByCategory: countBy(reuse.crossSwfReuseGroups, (group) => group.category),
      itemsWithFonts: items.filter((item) => item.tagStream.categoryCounts.font > 0).length,
      itemsWithExactlyDecodedText: items.filter((item) => item.exactTextOccurrences.length > 0).length,
      exactFontNameCount: exactFontNames.length,
      uniqueExactTextCount: exactTextInventory.length,
      tagStreamsWithTrailingBytesAfterEnd: items.flatMap((item) => item.tagStream.streams).filter((stream) => stream.trailingBytesAfterEnd > 0).length,
      nonzeroTrailingByteStreamsAfterEnd: items.flatMap((item) => item.tagStream.streams).filter((stream) => stream.trailingBytesAfterEnd > 0 && !stream.trailingBytesAllZero).length,
      structuralCountCrossChecksPassed: 40,
    },
    reuse,
    exactFontNames,
    exactTextInventory,
    items: reportItems,
  };
  return validateAssetDefinitionCensus(report);
}

function formatInteger(value) {
  return value.toLocaleString("en-US");
}

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

export function renderAssetDefinitionCensusMarkdown(report) {
  const categoryHeader = CATEGORY_ORDER.map((category) => `| ${category}`).join(" ");
  const itemRows = report.items.map((item) => {
    const counts = CATEGORY_ORDER.map((category) => `| ${item.tagStream.categoryCounts[category]}`).join(" ");
    return `| ${item.sequence} | \`${item.animationId}\` | ${item.tagStream.definitionCount} ${counts} |`;
  });
  const topReuse = report.reuse.crossSwfReuseGroups.slice(0, 30).map((group) =>
    `| ${group.tagName} | ${group.payloadLength} | ${group.sourceSwfCount} | ${group.occurrenceCount} | \`${group.rawTagPayloadSha256}\` |`,
  );
  const fontRows = report.exactFontNames.map((font) => {
    const glyphCounts = [...new Set(font.occurrences.map((occurrence) => occurrence.glyphCount).filter(Number.isInteger))].sort((a, b) => a - b);
    return `| ${escapeCell(font.exactName)} | ${font.occurrenceCount} | ${glyphCounts.length ? glyphCounts.join(", ") : "opaque/not available"} | \`${font.nameRawSha256}\` |`;
  });
  return [
    "# G4 L3 SWF Asset-definition Identity Census",
    "",
    "> Acceptance-neutral static source evidence only. This report does not establish runtime visibility, original-runtime behavior, visual/behavioral parity, audio acceptance, human/owner approval, renderer reuse safety, or migration completion.",
    "",
    "## Bound scope and method",
    "",
    `- Scope: ${report.scope.canonicalItems} canonical items (${report.scope.activePages} active pages + ${report.scope.courseShells} course shell), ${report.scope.uniqueSourceSwfPaths} source paths, ${report.scope.uniqueSourceSwfBinaries} distinct SWF binaries, ${formatInteger(report.scope.sourceSwfBytes)} compressed bytes.`,
    `- Physical source verification: ${report.sourceBindings.physicalRehash.verifiedItems}/${report.sourceBindings.physicalRehash.requiredItems} SWFs re-read and SHA-256 matched to the work-card binding.`,
    `- Exact identity rule: ${report.method.exactIdentity}.`,
    `- Definitions parsed recursively: ${formatInteger(report.summary.totalDefinitions)} total; ${formatInteger(report.summary.uniqueExactDefinitionIdentities)} unique exact identities.`,
    `- Exact duplicate groups: ${formatInteger(report.summary.exactDuplicateGroups)}; groups confined to one SWF: ${formatInteger(report.summary.withinSingleSwfOnlyExactDuplicateGroups)}; groups spanning multiple SWF binaries: ${formatInteger(report.summary.crossSwfExactReuseGroups)} (${formatInteger(report.summary.crossSwfExactReuseOccurrences)} occurrences).`,
    `- Structural count cross-checks: ${report.summary.structuralCountCrossChecksPassed}/40 items agree with the independent machine work-card shape/morph/bitmap/text/button/sprite facts. ${report.summary.nonzeroTrailingByteStreamsAfterEnd} sprite tag streams retain nonzero bytes after their End tag; those bytes remain covered by the enclosing DefineSprite payload hash but are not reinterpreted as tags.`,
    "",
    "The reuse groups below prove only equal tag code and equal complete raw payload bytes. Character IDs remain in the hash. A match does not prove placement/visibility, shared FLA-library origin, identical referenced dependencies, semantic equivalence, or safe renderer reuse. Conversely, definitions that differ only by a local ID remain separate by design.",
    "",
    "## Totals by definition category",
    "",
    "| Category | Definitions |",
    "|---|---:|",
    ...CATEGORY_ORDER.map((category) => `| ${category} | ${formatInteger(report.summary.categoryCounts[category])} |`),
    "",
    "## Per-item counts",
    "",
    `| # | Animation | Total ${categoryHeader} |`,
    `|---:|---|---:${CATEGORY_ORDER.map(() => "|---:").join("")}|`,
    ...itemRows,
    "",
    "## Largest cross-SWF exact payload-reuse groups",
    "",
    "| Tag | Payload bytes | SWFs | Occurrences | Raw payload SHA-256 |",
    "|---|---:|---:|---:|---|",
    ...(topReuse.length ? topReuse : ["| _None_ | 0 | 0 | 0 | — |"]),
    "",
    "The complete duplicate and cross-SWF group inventories, including every occurrence and file-local CharacterID, are retained in the JSON report.",
    "",
    "## Exactly parsed font names",
    "",
    `Exactly decoded name identities: ${report.summary.exactFontNameCount}. Glyph counts are emitted only when the SWF font structure exposes and validates them.`,
    "",
    "| Font name | Occurrences | Exact glyph-count facts | Name-byte SHA-256 |",
    "|---|---:|---|---|",
    ...(fontRows.length ? fontRows : ["| _No exact UTF-8 font name decoded_ | 0 | — | — |"]),
    "",
    "## Exactly parsed text",
    "",
    `Exactly decoded unique text values: ${report.summary.uniqueExactTextCount}, across ${report.summary.itemsWithExactlyDecodedText}/40 items. The JSON report retains exact occurrences. Static DefineText values are emitted only when every glyph index resolves through an exactly parsed embedded code table; unresolved glyph records are not guessed.`,
    "",
    "## Acceptance boundary",
    "",
    report.acceptance.statement,
    "",
  ].join("\n");
}

export function parseArguments(argv) {
  const options = {
    check: false,
    jsonOutput: DEFAULT_JSON_OUTPUT,
    markdownOutput: DEFAULT_MARKDOWN_OUTPUT,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--json-output") options.jsonOutput = path.resolve(argv[++index]);
    else if (argument === "--markdown-output") options.markdownOutput = path.resolve(argv[++index]);
    else if (argument === "--help") options.help = true;
    else throw new Error(`Unknown option ${argument}`);
  }
  return options;
}

function assertSafeOutput(filePath, extension) {
  invariant(path.extname(filePath) === extension, `Output must end in ${extension}`);
  const reportsRoot = path.join(projectRoot, "reports");
  const relativePath = path.relative(reportsRoot, filePath);
  invariant(!relativePath.startsWith("..") && !path.isAbsolute(relativePath), "Output must remain inside reports/");
}

async function main(argv) {
  const options = parseArguments(argv);
  if (options.help) {
    process.stdout.write("node scripts/build-g4-l3-swf-asset-definition-census.mjs [--check] [--json-output reports/file.json] [--markdown-output reports/file.md]\n");
    return;
  }
  assertSafeOutput(options.jsonOutput, ".json");
  assertSafeOutput(options.markdownOutput, ".md");
  const report = await buildAssetDefinitionCensus();
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = renderAssetDefinitionCensusMarkdown(report);
  if (options.check) {
    const [existingJson, existingMarkdown] = await Promise.all([
      readFile(options.jsonOutput, "utf8"),
      readFile(options.markdownOutput, "utf8"),
    ]);
    validateAssetDefinitionCensus(JSON.parse(existingJson));
    invariant(existingJson === json, "G4 L3 asset-definition census JSON is missing or stale");
    invariant(existingMarkdown === markdown, "G4 L3 asset-definition census Markdown is missing or stale");
    process.stdout.write(`PASS: G4 L3 asset-definition census; ${report.scope.canonicalItems} SWFs, ${report.summary.totalDefinitions} definitions, ${report.summary.crossSwfExactReuseGroups} cross-SWF exact reuse groups\n`);
    return;
  }
  await Promise.all([
    writeFile(options.jsonOutput, json),
    writeFile(options.markdownOutput, markdown),
  ]);
  process.stdout.write(`WROTE: G4 L3 asset-definition census; ${report.scope.canonicalItems} SWFs, ${report.summary.totalDefinitions} definitions, ${report.summary.crossSwfExactReuseGroups} cross-SWF exact reuse groups\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
