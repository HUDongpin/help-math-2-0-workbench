import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtemp, mkdir, readFile, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {PNG} from "pngjs";

import {parseArguments, reindexAdobeRuntimeCapture} from "./reindex-adobe-runtime-capture.mjs";

function png(color) {
  const image = new PNG({width: 2, height: 3});
  for (let index = 0; index < image.data.length; index += 4) {
    image.data[index] = color;
    image.data[index + 1] = color;
    image.data[index + 2] = color;
    image.data[index + 3] = 255;
  }
  return PNG.sync.write(image);
}

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "adobe-reindex-"));
  const id = "sample";
  const migrationsRoot = path.join(root, "migrations");
  const archiveRoot = path.join(root, "archive");
  const oldRawRoot = path.join(root, "old");
  const directRoot = path.join(root, "direct");
  const correctedRoot = path.join(root, "corrected");
  const workspace = path.join(migrationsRoot, id);
  const archive = path.join(archiveRoot, id, "adobe-flash-player-32-standalone-default");
  await Promise.all([
    mkdir(path.join(workspace, "baseline"), {recursive: true}),
    mkdir(archive, {recursive: true}),
    mkdir(path.join(oldRawRoot, id), {recursive: true}),
    mkdir(path.join(directRoot, id), {recursive: true}),
  ]);
  const sourceHash = "a".repeat(64);
  await writeFile(path.join(workspace, "migration.json"), JSON.stringify({
    animationId: id,
    source: {swfSha256: sourceHash},
    runtime: {stage: {width: 2, height: 2}, frameCount: 3},
  }));
  const frames = [png(20), png(30), png(30)];
  for (let index = 0; index < frames.length; index += 1) {
    const number = String(index + 1).padStart(4, "0");
    await writeFile(path.join(archive, `frame-${number}.png`), frames[index]);
    await writeFile(path.join(oldRawRoot, id, `window-frame-${number}.png`), frames[index]);
  }
  const direct = png(10);
  await writeFile(path.join(directRoot, id, "window-frame-0001.png"), direct);
  await writeFile(path.join(workspace, "baseline", "adobe-flash-player-32-standalone-default.json"), JSON.stringify({
    animationId: id,
    status: "authoritative-standalone-runtime-baseline",
    source: {swfSha256: sourceHash},
    runtime: {frameCount: 3},
    capture: {archiveDirectory: "old"},
    authority: {captureProtocol: "old"},
    frames: frames.map((bytes, index) => ({frame: index + 1, sha256: hash(bytes)})),
  }));
  return {root, id, migrationsRoot, archiveRoot, oldRawRoot, directRoot, correctedRoot, direct};
}

test("parseArguments resolves paths and preserves the id", () => {
  const options = parseArguments(["--id", "sample", "--corrected-root", "/tmp/corrected"]);
  assert.equal(options.id, "sample");
  assert.equal(options.correctedRoot, "/tmp/corrected");
});

test("reindex uses direct Rewind frame 1 and shifts prior raw frames", async () => {
  const data = await fixture();
  const result = await reindexAdobeRuntimeCapture(data);
  assert.equal(result.frameCount, 3);
  const corrected = path.join(data.correctedRoot, data.id);
  assert.equal(hash(await readFile(path.join(corrected, "window-frame-0001.png"))), hash(data.direct));
  assert.equal(
    hash(await readFile(path.join(corrected, "window-frame-0002.png"))),
    hash(await readFile(path.join(data.oldRawRoot, data.id, "window-frame-0001.png"))),
  );
  const invalid = JSON.parse(await readFile(
    path.join(data.migrationsRoot, data.id, "baseline", "adobe-flash-player-32-standalone-default.invalidated-off-by-one.json"),
    "utf8",
  ));
  assert.equal(invalid.status, "invalidated-off-by-one-after-rewind");
  assert.match(invalid.authority.captureProtocol, /^INVALID:/);
});

test("reindex refuses to overwrite an existing corrected directory", async () => {
  const data = await fixture();
  await mkdir(path.join(data.correctedRoot, data.id), {recursive: true});
  await assert.rejects(reindexAdobeRuntimeCapture(data), /corrected raw directory already exists/);
});
