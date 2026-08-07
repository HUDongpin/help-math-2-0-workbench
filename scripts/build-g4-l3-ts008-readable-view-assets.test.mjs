import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import test from "node:test";

import {PNG} from "pngjs";

import {
  ANIMATION_ID,
  DESKTOP_SCALE,
  FRAME_DOMAIN,
  NATIVE_PADDING,
  READABLE_VIEW_CROPS,
  RENDERER_SHA256,
  SOURCE_FRAME,
  SOURCE_SWF_SHA256,
  buildManifest,
  cropPng,
  paddedCropRect,
  parseArguments,
} from "./build-g4-l3-ts008-readable-view-assets.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("readable-view asset CLI requires exactly one bounded mode", () => {
  assert.equal(parseArguments(["--build"]), "build");
  assert.equal(parseArguments(["--check"]), "check");
  assert.throws(() => parseArguments([]), /Exactly one mode/);
  assert.throws(() => parseArguments(["--build", "--check"]), /Exactly one mode/);
  assert.throws(() => parseArguments(["--publish"]), /Exactly one mode/);
});

test("approved source identity and padded native crop geometry stay exact", () => {
  assert.equal(ANIMATION_ID, "course-g04-l03-ts-008");
  assert.equal(SOURCE_SWF_SHA256, "9c7288f67f764e02f4320655b64dbb57d3d690a75951b549ee5113f385e6b885");
  assert.equal(RENDERER_SHA256, "30d1272b3ce20cbf8ecbe76219351b78336bf24a71e921ae63bf48174fb267e6");
  assert.equal(FRAME_DOMAIN, "sprite-350");
  assert.equal(SOURCE_FRAME, 789);
  assert.equal(NATIVE_PADDING, 4);
  assert.equal(DESKTOP_SCALE, 2.5);
  assert.deepEqual(paddedCropRect(READABLE_VIEW_CROPS[0].sourceRect), {
    x: 288,
    y: 143,
    width: 244,
    height: 157,
  });
  assert.deepEqual(paddedCropRect(READABLE_VIEW_CROPS[1].sourceRect), {
    x: 288,
    y: 292,
    width: 244,
    height: 199,
  });
});

test("PNG crop copies only the requested deterministic pixels", () => {
  const source = new PNG({width: 4, height: 3});
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const offset = (y * source.width + x) * 4;
      source.data[offset] = x;
      source.data[offset + 1] = y;
      source.data[offset + 2] = x + y;
      source.data[offset + 3] = 255;
    }
  }
  const result = PNG.sync.read(
    cropPng(PNG.sync.write(source), {x: 1, y: 1, width: 2, height: 2}),
  );
  assert.equal(result.width, 2);
  assert.equal(result.height, 2);
  assert.deepEqual([...result.data.slice(0, 4)], [1, 1, 2, 255]);
  assert.deepEqual([...result.data.slice(12, 16)], [2, 2, 4, 255]);
});

test("manifest binds crops, transcript, and acceptance-neutral presentation", () => {
  const source = Buffer.from("source frame fixture");
  const crops = new Map([
    ["step-3", Buffer.from("step 3 fixture")],
    ["step-4", Buffer.from("step 4 fixture")],
  ]);
  const manifest = buildManifest({
    sourceFrame: source,
    crops,
    scriptBytes: Buffer.from("generator fixture"),
    rendererMetadata: {sourceSwfSha256: SOURCE_SWF_SHA256},
  });
  assert.equal(manifest.source.frame, 789);
  assert.equal(manifest.source.frameDomain, "sprite-350");
  assert.equal(manifest.presentation.defaultExpanded, true);
  assert.equal(manifest.presentation.originalStageRemainsVisible, true);
  assert.equal(manifest.presentation.strictAcceptanceEffect, "none");
  assert.equal(manifest.generator.manualScreenshotUsed, false);
  assert.equal(manifest.generator.secondLiveRuntimeUsed, false);
  assert.equal(manifest.files.sourceFrame.sha256, sha256(source));
  assert.deepEqual(
    manifest.transcriptBinding.map(({id, sourceCharacterIds}) => ({
      id,
      sourceCharacterIds,
    })),
    [
      {id: "step-3", sourceCharacterIds: [99, 100, 101, 133]},
      {id: "step-4", sourceCharacterIds: [144, 145, 146, 147, 148, 149, 150, 151, 152]},
    ],
  );
  assert.equal(
    manifest.transcriptBinding[1].sourceCharacterTypes["150"],
    "DefineShape-minus-glyph",
  );
});
