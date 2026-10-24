import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  assertProductionReadyManifest,
  DemoManifestValidationError,
  isProductionReadyManifest,
  parseDemoManifest,
  validateDemoManifest,
} from "../src/contracts.js";
import {
  conversion12Manifest,
  conversion14Manifest,
  demoManifests,
} from "../src/manifests.js";
import {
  GALLON_FLASH_MOVIE,
  LITER_FLASH_MOVIE,
} from "../../../lib/conversionTimeline.js";

const expectedManifestKeys = [
  "durationMs",
  "fps",
  "frameCount",
  "id",
  "sourceHashes",
  "stage",
  "summary",
  "title",
  "validationStatus",
];

test("ships valid bilingual manifests for the two integration targets", () => {
  assert.deepEqual(
    demoManifests.map(({ id }) => id),
    ["Conversion_1_2", "Conversion_1_4"],
  );

  for (const manifest of demoManifests) {
    assert.deepEqual(Object.keys(manifest).sort(), expectedManifestKeys);
    assert.equal(validateDemoManifest(manifest).success, true);
    assert.ok(manifest.title.en.length > 0);
    assert.ok(manifest.title.es.length > 0);
    assert.ok(manifest.summary.en.length > 0);
    assert.ok(manifest.summary.es.length > 0);
    assert.ok(Object.isFrozen(manifest));
    assert.ok(Object.isFrozen(manifest.sourceHashes));
  }
});

test("keeps source-backed timing metadata and hashes explicit", () => {
  assert.deepEqual(conversion12Manifest.stage, GALLON_FLASH_MOVIE.stage);
  assert.equal(conversion12Manifest.fps, GALLON_FLASH_MOVIE.fps);
  assert.equal(conversion12Manifest.frameCount, GALLON_FLASH_MOVIE.frameCount);
  assert.equal(conversion12Manifest.durationMs, GALLON_FLASH_MOVIE.durationMs);
  assert.deepEqual(conversion12Manifest.sourceHashes, [
    "7c59923ebd200f4fb951e1c9a7683861c21af7688d537fa5fca370acf6d9291d",
    "91d63f9f045d2097cd0f46c59ceacd4faefd95851f9039003589d8052c39e758",
  ]);

  assert.deepEqual(conversion14Manifest.stage, LITER_FLASH_MOVIE.stage);
  assert.equal(conversion14Manifest.fps, LITER_FLASH_MOVIE.fps);
  assert.equal(conversion14Manifest.frameCount, LITER_FLASH_MOVIE.frameCount);
  assert.equal(conversion14Manifest.durationMs, LITER_FLASH_MOVIE.durationMs);
  assert.deepEqual(conversion14Manifest.sourceHashes, [
    "d661c776e239fb59c44278c6e4d5fd75812599eb2dc9fa758b1ba37a59251b1c",
    "cbb7f3f529c8c5ca679da864c7c49ab472cac4d0feb2392eed5aa04d21a4e1a9",
  ]);
});

test("source hashes identify the preserved FLA and SWF bytes", async () => {
  const fixtures = [
    [
      conversion12Manifest,
      [
        new URL("../../../source-assets/flash/Conversion_1_2.fla", import.meta.url),
        new URL("../../../source-assets/flash/Conversion_1_2.swf", import.meta.url),
      ],
    ],
    [
      conversion14Manifest,
      [
        new URL("../../../source-assets/flash/Conversion_1_4.fla", import.meta.url),
        new URL("../../../source-assets/flash/Conversion_1_4.swf", import.meta.url),
      ],
    ],
  ];

  for (const [manifest, sourceUrls] of fixtures) {
    const actualHashes = await Promise.all(
      sourceUrls.map(async (sourceUrl) =>
        createHash("sha256").update(await readFile(sourceUrl)).digest("hex"),
      ),
    );
    assert.deepEqual(actualHashes, manifest.sourceHashes);
  }
});

test("does not expose conditionally validated demos as production ready", () => {
  for (const manifest of demoManifests) {
    assert.equal(manifest.validationStatus, "conditional");
    assert.equal(isProductionReadyManifest(manifest), false);
    assert.throws(
      () => assertProductionReadyManifest(manifest),
      DemoManifestValidationError,
    );
  }
});

test("rejects malformed localization, timing, hashes, and statuses", () => {
  const invalid = {
    ...conversion12Manifest,
    title: { en: "", es: "Galones" },
    durationMs: 100,
    sourceHashes: ["not-a-hash"],
    validationStatus: "complete",
  };
  const result = validateDemoManifest(invalid);

  assert.equal(result.success, false);
  assert.ok(result.issues.some((issue) => issue.includes("title.en")));
  assert.ok(result.issues.some((issue) => issue.includes("durationMs")));
  assert.ok(result.issues.some((issue) => issue.includes("sourceHashes[0]")));
  assert.ok(result.issues.some((issue) => issue.includes("validationStatus")));
  assert.throws(() => parseDemoManifest(invalid), DemoManifestValidationError);
});

test("accepts an approved manifest only when the caller explicitly marks it", () => {
  const approved = parseDemoManifest({
    ...conversion12Manifest,
    validationStatus: "approved",
  });

  assert.equal(isProductionReadyManifest(approved), true);
  assert.deepEqual(assertProductionReadyManifest(approved), approved);
});
