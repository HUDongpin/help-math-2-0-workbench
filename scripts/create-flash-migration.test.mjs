import assert from "node:assert/strict";
import {mkdtemp, mkdir, readFile, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {initializeCapturePlanning, scaffoldMigration} from "./create-flash-migration.mjs";

function fixtureSwf() {
  const bits = [];
  const pushBits = (value, count) => {
    const normalized = value < 0 ? 2 ** count + value : value;
    for (let shift = count - 1; shift >= 0; shift -= 1) bits.push((normalized >> shift) & 1);
  };
  pushBits(15, 5);
  for (const value of [0, 16_000, 0, 12_000]) pushBits(value, 15);
  while (bits.length % 8) bits.push(0);
  const rect = Buffer.alloc(bits.length / 8);
  bits.forEach((bit, index) => { rect[Math.floor(index / 8)] |= bit << (7 - (index % 8)); });
  const body = Buffer.concat([rect, Buffer.from([
    0x00, 0x0c, // 12 FPS
    0x03, 0x00, // three root frames
    0x00, 0x00, // End tag
  ])]);
  const header = Buffer.alloc(8);
  header.write("FWS", 0, "ascii");
  header[3] = 6;
  header.writeUInt32LE(header.length + body.length, 4);
  return Buffer.concat([header, body]);
}

test("capture planning never emits an invalid 1..0 range", () => {
  const manifest = {implementation: {frameDomains: [{id: "root", frameCount: null}]}};
  const coverage = {requirements: [{language: "en", requiredRange: null}]};
  initializeCapturePlanning(manifest, coverage, null);
  assert.equal(manifest.implementation.frameDomains[0].frameCount, null);
  assert.equal(coverage.requirements[0].requiredRange, null);
  assert.match(coverage.requirements[0].entryStateSha256, /^[a-f0-9]{64}$/);
});

test("SWF-backed scaffold binds the root domain and bilingual pending coverage to the real frame count", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "flash-scaffold-"));
  const sources = path.join(root, "sources");
  const output = path.join(root, "migrations");
  await mkdir(sources, {recursive: true});
  const swf = path.join(sources, "fixture.swf");
  await writeFile(swf, fixtureSwf());
  const destination = await scaffoldMigration({id: "fixture", swf, output});
  const manifest = JSON.parse(await readFile(path.join(destination, "migration.json"), "utf8"));
  const coverage = JSON.parse(await readFile(path.join(destination, "evidence", "full-frame-coverage.json"), "utf8"));
  assert.equal(manifest.runtime.frameCount, 3);
  assert.equal(manifest.implementation.frameDomains[0].frameCount, 3);
  assert.deepEqual(coverage.requirements.map(({requiredRange}) => requiredRange), [
    {firstFrame: 1, lastFrame: 3},
    {firstFrame: 1, lastFrame: 3},
  ]);
  assert.ok(coverage.requirements.every(({missingFrames}) => missingFrames.join(",") === "1,2,3"));
  assert.ok(coverage.requirements.every(({entryStateSha256}) => /^[a-f0-9]{64}$/.test(entryStateSha256)));
});
