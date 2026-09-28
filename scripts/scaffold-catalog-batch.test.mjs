import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {pilotsForBatch, selectCatalogBatch} from "./scaffold-catalog-batch.mjs";

test("checked-in batches are unique, bounded, and resolve canonical sources", async () => {
  const [batches, catalog] = await Promise.all([
    readFile(new URL("../catalog/batches.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../catalog/animations.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  const ids = batches.queues.flatMap((queue) => queue.batches.map((batch) => batch.batchId));
  assert.equal(ids.length, 77);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    const batch = selectCatalogBatch(batches, id);
    const pilots = pilotsForBatch(batch, catalog);
    assert.equal(pilots.length, batch.canonicalAssetCount);
    assert.ok(pilots.length >= 1 && pilots.length <= 25);
    assert.ok(pilots.every((pilot) => pilot.swf.endsWith(".swf")));
  }
});

test("invalid batch size and unknown IDs fail", () => {
  assert.throws(() => selectCatalogBatch({queues: []}, "batch-999"), /Unknown batch/);
  assert.throws(
    () => selectCatalogBatch({queues: [{queueId: "bad", batches: [{batchId: "batch-bad", items: Array.from({length: 26}, (_, index) => ({assetId: String(index)}))}]}]}, "batch-bad"),
    /1 to 25/,
  );
});


test("historical batch identities resolve through exact assets and reject ambiguous or changed assets", () => {
  const assetId = "swf-" + "a".repeat(64);
  const batch = {batchId: "renamed", items: [{canonicalAnimationId: "old-name", assetId}]};
  const canonical = {animationId: "current-name", assetId, isCanonical: true, source: {path: "lesson.swf"}};
  const alias = {animationId: "old-name", assetId, isCanonical: false};
  for (const animations of [[canonical], [canonical, alias]]) {
    assert.deepEqual(pilotsForBatch(batch, {animations}), [{id: "current-name", swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/lesson.swf"}]);
  }
  assert.throws(() => pilotsForBatch(batch, {animations: []}), /found 0/);
  assert.throws(() => pilotsForBatch(batch, {animations: [canonical, {...canonical, animationId: "duplicate"}]}), /found 2/);
  assert.throws(() => pilotsForBatch(batch, {animations: [canonical, {...alias, assetId: "swf-" + "b".repeat(64)}]}), /assetId mismatch/);
});
