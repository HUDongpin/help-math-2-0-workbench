import assert from "node:assert/strict";
import test from "node:test";

import {
  applyExactManifestTransition,
  buildTs006AssetInventoryCurrentnessSuccessorR2,
  parseMode,
} from "./build-g4-l3-ts006-asset-inventory-currentness-successor-2026-08-08-r2.mjs";

test("applies the TS006 manifest inventory transition exactly once", () => {
  const oldHash = "eea637df94f8c7e9ba149138bcf05426e4f8fec1fc894e2703dc4a9b39a626a0";
  const newHash = "424fb84965b48be6b7ddcd25ed770cac4d9e4e6db7c8e2d599daa295f12222aa";
  assert.equal(
    applyExactManifestTransition(`prefix ${oldHash} suffix`),
    `prefix ${newHash} suffix`,
  );
  assert.throws(
    () => applyExactManifestTransition("no expected manifest SHA-256"),
    /exactly once/,
  );
});

test("requires an explicit output mode", () => {
  assert.equal(parseMode(["--check"]), "--check");
  assert.throws(() => parseMode([]), /explicit mode/);
  assert.throws(() => parseMode(["--write"]), /explicit mode/);
});

test("binds the live r2 transition without strict acceptance", async () => {
  const report = await buildTs006AssetInventoryCurrentnessSuccessorR2();
  assert.equal(report.currentInventory.sha256, "3838911e74007727a277223c1dbbf7b2d09d21ea9fb10f024582d92e8d98b9cd");
  assert.equal(report.exactTransition.changedFieldCount, 1);
  assert.equal(report.historicalEvidence.productQa.currentnessInherited, false);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
});
