import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {deflateSync} from "node:zlib";

import {
  buildReuseGroups,
  collectSwfAssetDefinitions,
  decompressSwf,
  parseArguments,
  renderAssetDefinitionCensusMarkdown,
  validateAssetDefinitionCensus,
} from "./build-g4-l3-swf-asset-definition-census.mjs";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function tag(code, payload = Buffer.alloc(0)) {
  if (payload.length < 0x3f) {
    const header = Buffer.alloc(2);
    header.writeUInt16LE((code << 6) | payload.length);
    return Buffer.concat([header, payload]);
  }
  const header = Buffer.alloc(6);
  header.writeUInt16LE((code << 6) | 0x3f);
  header.writeUInt32LE(payload.length, 2);
  return Buffer.concat([header, payload]);
}

function ui16(value) {
  const bytes = Buffer.alloc(2);
  bytes.writeUInt16LE(value);
  return bytes;
}

function defineFont2(id = 2) {
  const name = Buffer.from("Arial\0", "utf8");
  return Buffer.concat([
    ui16(id),
    Buffer.from([0x00, 0x00, name.length]), // flags, language, name length
    name,
    ui16(2), // NumGlyphs
    ui16(6), ui16(6), // empty glyph shapes
    ui16(6), // CodeTableOffset, relative to OffsetTable
    Buffer.from([0x41, 0x42]),
  ]);
}

function defineText(id = 3, fontId = 2) {
  return Buffer.concat([
    ui16(id),
    Buffer.from([0x08, 0x00]), // zero RECT
    Buffer.from([0x00]), // identity MATRIX
    Buffer.from([0x01, 0x01]), // GlyphBits, AdvanceBits
    Buffer.from([0x88]), // TextRecordType + HasFont
    ui16(fontId),
    ui16(240), // TextHeight
    Buffer.from([0x02, 0x20]), // two glyphs: indexes 0 and 1; zero advances
    Buffer.from([0x00]), // end of TEXTRECORD array
  ]);
}

function defineEditText(id = 4) {
  return Buffer.concat([
    ui16(id),
    Buffer.from([0x08, 0x00]), // zero RECT
    Buffer.from([0x80, 0x00]), // HasText and no other flags
    Buffer.from("answer\0hello\0", "utf8"),
  ]);
}

function fixtureFws({shapeId = 1} = {}) {
  const shapePayload = Buffer.concat([ui16(shapeId), Buffer.from([0xaa, 0xbb, 0xcc])]);
  const spritePayload = Buffer.concat([ui16(5), ui16(1), tag(1), tag(0)]);
  const tagBytes = Buffer.concat([
    tag(2, shapePayload),
    tag(48, defineFont2()),
    tag(11, defineText()),
    tag(37, defineEditText()),
    tag(39, spritePayload),
    tag(0),
  ]);
  const movieBody = Buffer.concat([
    Buffer.from([0x08, 0x00]), // zero RECT
    Buffer.from([0x00, 0x0c]), // 12 FPS
    ui16(1),
    tagBytes,
  ]);
  const header = Buffer.alloc(8);
  header.write("FWS", 0, "ascii");
  header[3] = 8;
  header.writeUInt32LE(header.length + movieBody.length, 4);
  return Buffer.concat([header, movieBody]);
}

function asCws(fws) {
  return Buffer.concat([
    Buffer.from("CWS"),
    fws.subarray(3, 8),
    deflateSync(fws.subarray(8)),
  ]);
}

test("binary parser retains exact definition identities for FWS and CWS", () => {
  const fws = fixtureFws();
  const cws = asCws(fws);
  assert.equal(decompressSwf(cws).bytes.compare(fws), 0);
  const plain = collectSwfAssetDefinitions(fws);
  const compressed = collectSwfAssetDefinitions(cws);
  assert.equal(plain.sourceFormat.signature, "FWS");
  assert.equal(compressed.sourceFormat.signature, "CWS");
  assert.equal(plain.sourceFormat.fps, 12);
  assert.equal(plain.sourceFormat.rootFrameCount, 1);
  assert.deepEqual(plain.tagStream.categoryCounts, {
    shape: 1,
    morph: 0,
    bitmap: 0,
    font: 1,
    text: 2,
    button: 0,
    sprite: 1,
    sound: 0,
    video: 0,
    binary: 0,
  });
  assert.deepEqual(
    plain.definitions.map((definition) => definition.rawTagPayloadSha256),
    compressed.definitions.map((definition) => definition.rawTagPayloadSha256),
  );
  assert.equal(plain.definitions[0].rawTagPayloadSha256, sha256(Buffer.concat([ui16(1), Buffer.from([0xaa, 0xbb, 0xcc])])));
});

test("font and text facts are emitted only from exactly parsed structures", () => {
  const parsed = collectSwfAssetDefinitions(fixtureFws());
  assert.equal(parsed.fontFacts.length, 1);
  assert.equal(parsed.fontFacts[0].exactName, "Arial");
  assert.equal(parsed.fontFacts[0].nameFieldNullTerminated, true);
  assert.equal(parsed.fontFacts[0].glyphCount, 2);
  assert.equal(parsed.fontFacts[0].codePointCount, 2);
  assert.equal(parsed.fontFacts[0].codePointMin, 65);
  assert.equal(parsed.fontFacts[0].codePointMax, 66);
  assert.ok(/^[a-f0-9]{64}$/.test(parsed.fontFacts[0].codePointTableSha256));
  const exactTexts = parsed.exactTextOccurrences.map((occurrence) => occurrence.exactText).sort();
  assert.deepEqual(exactTexts, ["AB", "hello"]);
  assert.ok(parsed.textFacts.every((fact) => !Object.hasOwn(fact, "runs")));
});

test("reuse groups require the same tag code and every exact payload byte", () => {
  const first = collectSwfAssetDefinitions(fixtureFws());
  const same = collectSwfAssetDefinitions(asCws(fixtureFws()));
  const changedId = collectSwfAssetDefinitions(fixtureFws({shapeId: 9}));
  const model = buildReuseGroups([
    {sequence: 1, animationId: "a", source: {path: "a.swf", sha256: "a".repeat(64)}, definitions: first.definitions},
    {sequence: 2, animationId: "b", source: {path: "b.swf", sha256: "b".repeat(64)}, definitions: same.definitions},
  ]);
  assert.equal(model.crossSwfReuseGroups.length, first.definitions.length);
  assert.ok(model.crossSwfReuseGroups.every((group) => group.sourceSwfCount === 2));
  assert.notEqual(
    first.definitions.find((definition) => definition.tagName === "DefineShape").rawTagPayloadSha256,
    changedId.definitions.find((definition) => definition.tagName === "DefineShape").rawTagPayloadSha256,
  );
});

test("checked-in census binds all 40 sources without opening acceptance gates", async () => {
  const report = validateAssetDefinitionCensus(JSON.parse(await readFile(
    new URL("../reports/g4-l3-swf-asset-definition-census.json", import.meta.url),
    "utf8",
  )));
  assert.equal(report.scope.canonicalItems, 40);
  assert.equal(report.scope.uniqueSourceSwfBinaries, 40);
  assert.equal(report.sourceBindings.physicalRehash.verifiedItems, 40);
  assert.equal(report.summary.totalDefinitions, 8068);
  assert.equal(report.summary.uniqueExactDefinitionIdentities, 6727);
  assert.equal(report.summary.crossSwfExactReuseGroups, 1107);
  assert.equal(report.summary.withinSingleSwfOnlyExactDuplicateGroups, 0);
  assert.equal(Object.values(report.summary.crossSwfExactReuseGroupsByCategory).reduce((sum, value) => sum + value, 0), 1107);
  assert.equal(report.summary.structuralCountCrossChecksPassed, 40);
  assert.ok(report.items.every((item) => item.source.physicalHashVerified));
  assert.ok(Object.values(report.acceptance.gates).every((value) => value === false));
  const markdown = renderAssetDefinitionCensusMarkdown(report);
  assert.match(markdown, /byte identity only|prove only equal tag code/);
  assert.match(markdown, /does not establish runtime visibility/);
  assert.match(markdown, /39 active pages \+ 1 course shell/);
});

test("CLI is direct-node, deterministic, and rejects unknown options", () => {
  assert.equal(parseArguments(["--check"]).check, true);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});
