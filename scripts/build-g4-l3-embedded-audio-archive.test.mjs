import assert from "node:assert/strict";
import {deflateSync} from "node:zlib";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildArchivePlan,
  parseArguments,
  parseEmbeddedAudioPayloads,
  renderG4L3EmbeddedAudioArchiveMarkdown,
  validateG4L3EmbeddedAudioArchive,
  writeOrVerifyArchivePlan,
} from "./build-g4-l3-embedded-audio-archive.mjs";

function tag(code, body = Buffer.alloc(0)) {
  if (body.length < 0x3f) {
    const header = Buffer.alloc(2);
    header.writeUInt16LE((code << 6) | body.length);
    return Buffer.concat([header, body]);
  }
  const header = Buffer.alloc(6);
  header.writeUInt16LE((code << 6) | 0x3f);
  header.writeUInt32LE(body.length, 2);
  return Buffer.concat([header, body]);
}

function defineSound(id, sampleCount, seekSamples, payload) {
  const header = Buffer.alloc(9);
  header.writeUInt16LE(id, 0);
  header[2] = 0x2f;
  header.writeUInt32LE(sampleCount, 3);
  header.writeInt16LE(seekSamples, 7);
  return tag(14, Buffer.concat([header, payload]));
}

function streamHead(code, {sampleRateCode = 3, nominalSamples = 1152, latencySeek = 0} = {}) {
  const body = Buffer.alloc(6);
  body[0] = 0x0f;
  body[1] = (2 << 4) | (sampleRateCode << 2) | 0x03;
  body.writeUInt16LE(nominalSamples, 2);
  body.writeInt16LE(latencySeek, 4);
  return tag(code, body);
}

function streamBlock(sampleCount, seekSamples, payload) {
  const wrapper = Buffer.alloc(4);
  wrapper.writeUInt16LE(sampleCount, 0);
  wrapper.writeInt16LE(seekSamples, 2);
  return tag(19, Buffer.concat([wrapper, payload]));
}

function sprite(id, frameCount, children) {
  const header = Buffer.alloc(4);
  header.writeUInt16LE(id, 0);
  header.writeUInt16LE(frameCount, 2);
  return tag(39, Buffer.concat([header, ...children, tag(0)]));
}

function fwsFixture() {
  const definePayload = Buffer.from("fffb010203", "hex");
  const childOne = Buffer.from("fffb1112", "hex");
  const childTwo = Buffer.from("fffb1314", "hex");
  const rootPayload = Buffer.from("fffb2122", "hex");
  const tags = [
    defineSound(7, 3456, -3, definePayload),
    sprite(9, 2, [
      streamHead(45, {sampleRateCode: 2, nominalSamples: 2048, latencySeek: -2}),
      streamBlock(2000, -1, childOne),
      tag(1),
      streamBlock(2001, 1, childTwo),
      tag(1),
    ]),
    streamHead(18, {sampleRateCode: 3, nominalSamples: 1152, latencySeek: 0}),
    streamBlock(1152, 0, rootPayload),
    tag(1),
    tag(0),
  ];
  const timeline = Buffer.concat([
    Buffer.from([0x08, 0x00]),
    Buffer.from([0x00, 0x0c]),
    Buffer.from([0x01, 0x00]),
    ...tags,
  ]);
  const header = Buffer.alloc(8);
  header.write("FWS", 0, "ascii");
  header[3] = 8;
  header.writeUInt32LE(header.length + timeline.length, 4);
  return {bytes: Buffer.concat([header, timeline]), definePayload, childOne, childTwo, rootPayload};
}

function cwsFixture(fws) {
  return Buffer.concat([
    Buffer.from("CWS"),
    fws.subarray(3, 8),
    deflateSync(fws.subarray(8)),
  ]);
}

test("direct SWF parser distinguishes DefineSound, SoundStreamHead, Head2, and ordered blocks", () => {
  const fixture = fwsFixture();
  const parsed = parseEmbeddedAudioPayloads(fixture.bytes);
  assert.deepEqual(parsed.tagCounts, {
    DefineSound: 1,
    SoundStreamHead: 1,
    SoundStreamHead2: 1,
    SoundStreamBlock: 3,
  });
  assert.equal(parsed.defineSounds.length, 1);
  assert.equal(parsed.defineSounds[0].soundId, 7);
  assert.equal(parsed.defineSounds[0].soundHeader.declaredSampleCount, 3456);
  assert.equal(parsed.defineSounds[0].codecWrapperHeader.mp3SeekSamples, -3);
  assert.deepEqual(parsed.defineSounds[0]._payloadBytes, fixture.definePayload);
  assert.equal(parsed.soundStreams.length, 2);
  const child = parsed.soundStreams[0];
  const root = parsed.soundStreams[1];
  assert.equal(child.ownerDomainId, "sprite-9");
  assert.equal(child.head.tagType, "SoundStreamHead2");
  assert.equal(child.blockCount, 2);
  assert.equal(child.totalBlockHeaderSampleCount, 4001);
  assert.deepEqual(child.blocks.map((block) => [block.blockIndex, block.localFrame, block.payload.byteOffsetInStreamArchive]), [
    [1, 1, 0],
    [2, 2, fixture.childOne.length],
  ]);
  assert.deepEqual(child._payloadBytes, Buffer.concat([fixture.childOne, fixture.childTwo]));
  assert.equal(root.ownerDomainId, "root");
  assert.equal(root.head.tagType, "SoundStreamHead");
  assert.deepEqual(root._payloadBytes, fixture.rootPayload);
});

test("CWS decompression preserves the exact codec payload inventory", () => {
  const fixture = fwsFixture();
  const fws = parseEmbeddedAudioPayloads(fixture.bytes);
  const cws = parseEmbeddedAudioPayloads(cwsFixture(fixture.bytes));
  assert.equal(cws.source.signature, "CWS");
  assert.equal(cws.source.uncompressedSha256, fws.source.uncompressedSha256);
  assert.deepEqual(cws.defineSounds.map((sound) => sound._payloadBytes), fws.defineSounds.map((sound) => sound._payloadBytes));
  assert.deepEqual(cws.soundStreams.map((stream) => stream._payloadBytes), fws.soundStreams.map((stream) => stream._payloadBytes));
});

test("preflight deduplicates by content address and enforces the archive byte cap before writes", () => {
  const fixture = fwsFixture();
  const parsed = parseEmbeddedAudioPayloads(fixture.bytes);
  // Add a second reference to the same DefineSound payload to exercise deduplication.
  const duplicate = structuredClone(parsed.defineSounds[0]);
  duplicate._payloadBytes = Buffer.from(parsed.defineSounds[0]._payloadBytes);
  const items = [{embeddedAudio: {
    defineSounds: [...parsed.defineSounds, duplicate],
    soundStreams: parsed.soundStreams,
  }}];
  const fullPlan = buildArchivePlan(items, 1024 ** 3);
  assert.equal(fullPlan.candidateUnitCount, 4);
  assert.equal(fullPlan.plannedUniqueArchiveFileCount, 3);
  assert.equal(fullPlan.eligible, true);
  assert.equal(fullPlan.deduplicatedBytes, fixture.definePayload.length);
  const blockedPlan = buildArchivePlan(items, fullPlan.plannedUniqueArchiveBytes - 1);
  assert.equal(blockedPlan.eligible, false);
});

test("archive writer creates only ignored content-addressed files and verifies exact bytes", async () => {
  const fixture = fwsFixture();
  const parsed = parseEmbeddedAudioPayloads(fixture.bytes);
  const plan = buildArchivePlan([{embeddedAudio: parsed}], 1024 ** 3);
  const root = await mkdtemp(path.join(os.tmpdir(), "g4-l3-embedded-audio-"));
  try {
    await writeFile(path.join(root, ".gitignore"), "artifacts/g4-l3-embedded-audio/\n");
    const first = await writeOrVerifyArchivePlan(plan, {root, allowWrites: true});
    assert.equal(first.fileCount, plan.plannedUniqueArchiveFileCount);
    assert.equal(first.filesWrittenThisRun, plan.plannedUniqueArchiveFileCount);
    for (const file of plan.files) assert.deepEqual(await readFile(path.join(root, file.path)), file.bytes);
    const second = await writeOrVerifyArchivePlan(plan, {root, allowWrites: false});
    assert.equal(second.filesWrittenThisRun, 0);
    assert.equal(second.filesReusedThisRun, plan.plannedUniqueArchiveFileCount);
    assert.equal(second.archiveSetSha256, first.archiveSetSha256);
    const extra = path.join(root, "artifacts/g4-l3-embedded-audio/sha256/ff/extra.mp3");
    await mkdir(path.dirname(extra), {recursive: true});
    await writeFile(extra, Buffer.from("unexpected"));
    await assert.rejects(
      writeOrVerifyArchivePlan(plan, {root, allowWrites: false}),
      /Archive file set differs: expected 3, found 4/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("checked-in G4 L3 archive report is deterministic and remains acceptance-neutral", async () => {
  const [json, markdown] = await Promise.all([
    readFile(new URL("../reports/g4-l3-embedded-audio-archive.json", import.meta.url), "utf8"),
    readFile(new URL("../reports/g4-l3-embedded-audio-archive.md", import.meta.url), "utf8"),
  ]);
  const report = validateG4L3EmbeddedAudioArchive(JSON.parse(json));
  assert.equal(markdown, renderG4L3EmbeddedAudioArchiveMarkdown(report));
  assert.equal(report.summary.canonicalItems, 40);
  assert.equal(report.summary.defineSoundCount, 5);
  assert.equal(report.summary.soundStreamCount, 354);
  assert.equal(report.summary.soundStreamBlockCount, 14718);
  assert.equal(report.archive.plannedUniqueArchiveBytes, 5710816);
  assert.equal(report.archive.sourceAudioUnitReferenceCount, 359);
  assert.equal(report.archive.uniqueLogicalPayloadIdentityCount, 90);
  assert.equal(report.archive.plannedCasObjectCount, 88);
  assert.equal(report.archive.casObjects.length, 88);
  assert.equal(report.archive.archiveWritten, true);
  assert.equal(report.archive.maxArchiveBytes, 1024 ** 3);
  assert.ok(report.items.every((item) => item.source.swf.physicalHashVerified));
  assert.ok(report.items.every((item) => Object.values(item.evidenceLimits).every((value) => value === false)));
});

test("validator rejects promoted audio acceptance and stale source/item evidence", async () => {
  const source = JSON.parse(await readFile(
    new URL("../reports/g4-l3-embedded-audio-archive.json", import.meta.url),
    "utf8",
  ));
  const cases = [
    [(report) => { report.acceptance.listeningAcceptanceEstablished = true; }, /must remain false/],
    [(report) => { report.items[0].evidenceLimits.ownerAcceptanceEstablished = true; }, /acceptance boundary/],
    [(report) => { report.items[0].source.swf.observedSha256 = "0".repeat(64); }, /physical binding/],
    [(report) => { report.items[0].itemFingerprintSha256 = "0".repeat(64); }, /stale item fingerprint/],
  ];
  for (const [mutate, pattern] of cases) {
    const report = structuredClone(source);
    mutate(report);
    assert.throws(() => validateG4L3EmbeddedAudioArchive(report), pattern);
  }
});

test("CLI keeps the archive cap bounded and check mode non-mutating", () => {
  assert.deepEqual(parseArguments(["--check"]), {
    check: true,
    inventoryOnly: false,
    maxArchiveBytes: 1024 ** 3,
    jsonOutput: "reports/g4-l3-embedded-audio-archive.json",
    markdownOutput: "reports/g4-l3-embedded-audio-archive.md",
  });
  assert.throws(() => parseArguments(["--max-archive-bytes", String(1024 ** 3 + 1)]), /0 through 1073741824/);
  assert.throws(() => parseArguments(["--check", "--inventory-only"]), /cannot be combined/);
});
