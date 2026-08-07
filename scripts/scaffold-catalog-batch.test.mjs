import assert from "node:assert/strict";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  evaluateBatchScaffoldingGate,
  parseArguments,
  pilotsForBatch,
  scaffoldCatalogBatch,
  selectCatalogBatch,
  selectCatalogRelease,
  selectNextCatalogBatch,
} from "./scaffold-catalog-batch.mjs";

const GENERATED_MARKER = `sha256:${"a".repeat(64)}`;
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function strictLedger(animationIds) {
  return {
    schemaVersion: 1,
    generatedMarker: GENERATED_MARKER,
    summary: {strictComplete: animationIds.length},
    diagnostics: [],
    entries: animationIds.map((animationId) => ({
      animationId,
      validation: {
        mode: "strict",
        generatedMarker: GENERATED_MARKER,
      },
    })),
  };
}

function smallBatchDocument() {
  return {
    queues: [
      {
        queueId: "first",
        batches: [{
          batchId: "batch-001",
          items: [
            {assetId: "swf-a", canonicalAnimationId: "animation-a"},
            {assetId: "swf-b", canonicalAnimationId: "animation-b"},
          ],
          scaffoldingPrerequisite: {kind: "none"},
        }],
      },
      {
        queueId: "second",
        batches: [{
          batchId: "batch-002",
          items: [{assetId: "swf-c", canonicalAnimationId: "animation-c"}],
          scaffoldingPrerequisite: {kind: "batch-strict", batchId: "batch-001"},
        }],
      },
    ],
  };
}

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

test("the checked-in G4 L3 release exposes two parallel development shards and an atomic release prerequisite", async () => {
  const batches = JSON.parse(await readFile(new URL("../catalog/batches.json", import.meta.url), "utf8"));
  const first = selectCatalogBatch(batches, "batch-001");
  const second = selectCatalogBatch(batches, "batch-002");
  const third = selectCatalogBatch(batches, "batch-003");
  assert.equal(first.queueId, "release-g04-l03-negative-numbers");
  assert.equal(first.releaseId, "lesson-g04-l03-negative-numbers");
  assert.equal(first.releasePart, 1);
  assert.equal(first.releasePartCount, 2);
  assert.equal(first.canonicalAssetCount, 25);
  assert.equal(second.queueId, "release-g04-l03-negative-numbers");
  assert.equal(second.releaseId, first.releaseId);
  assert.equal(second.releasePart, 2);
  assert.equal(second.releasePartCount, 2);
  assert.equal(second.canonicalAssetCount, 15);
  assert.deepEqual(first.scaffoldingPrerequisite, {kind: "none"});
  assert.deepEqual(second.scaffoldingPrerequisite, {kind: "none"});
  assert.deepEqual(third.scaffoldingPrerequisite, {
    kind: "release-strict",
    releaseId: "lesson-g04-l03-negative-numbers",
  });

  const firstGate = evaluateBatchScaffoldingGate({
    batchDocument: batches,
    batchId: first.batchId,
    ledger: strictLedger([]),
    ledgerCurrent: true,
  });
  assert.equal(firstGate.open, true);
  assert.equal(firstGate.prerequisiteKind, "none");
  assert.deepEqual(firstGate.requiredAnimationIds, []);

  const secondGate = evaluateBatchScaffoldingGate({
    batchDocument: batches,
    batchId: second.batchId,
    ledger: strictLedger([]),
    ledgerCurrent: true,
  });
  assert.equal(secondGate.open, true);
  assert.equal(secondGate.prerequisiteKind, "none");
  assert.deepEqual(secondGate.requiredAnimationIds, []);

  const releaseIds = [...first.items, ...second.items].map((item) => item.canonicalAnimationId);
  const closedThirdGate = evaluateBatchScaffoldingGate({
    batchDocument: batches,
    batchId: third.batchId,
    ledger: strictLedger(releaseIds.slice(0, -1)),
    ledgerCurrent: true,
  });
  assert.equal(closedThirdGate.open, false);
  assert.equal(closedThirdGate.prerequisiteKind, "release-strict");
  assert.equal(closedThirdGate.prerequisiteReleaseId, "lesson-g04-l03-negative-numbers");
  assert.deepEqual(closedThirdGate.missingAnimationIds, [releaseIds.at(-1)]);

  const openThirdGate = evaluateBatchScaffoldingGate({
    batchDocument: batches,
    batchId: third.batchId,
    ledger: strictLedger(releaseIds),
    ledgerCurrent: true,
  });
  assert.equal(openThirdGate.open, true);
  assert.equal(openThirdGate.requiredAnimationIds.length, 40);

  const ordered = batches.queues.flatMap((queue) => queue.batches);
  for (let index = 3; index < ordered.length; index += 1) {
    assert.deepEqual(ordered[index].scaffoldingPrerequisite, {
      kind: "batch-strict",
      batchId: ordered[index - 1].batchId,
    });
  }
});

test("the checked-in G5 L4 release selects the exact 55 members and 15/21/19 development shards", async () => {
  const [releases, catalog] = await Promise.all([
    readFile(new URL("../catalog/lesson-releases.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../catalog/animations.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  const releaseId = "lesson-g05-l04-number-lines";
  const full = selectCatalogRelease(releases, releaseId);
  assert.equal(full.selectionKind, "release");
  assert.equal(full.selectionId, releaseId);
  assert.equal(full.canonicalAssetCount, 55);
  assert.equal(full.items.length, 55);
  assert.deepEqual(full.items.slice(0, 54).map(({xmlOccurrence}) => xmlOccurrence),
    Array.from({length: 54}, (_, index) => index + 1));
  assert.equal(full.items.at(-1).canonicalAnimationId, "shell-course-g05-l04-index-local");
  assert.equal(full.items.at(-1).shardId, "g05-l04-host-language");

  const pilots = pilotsForBatch(full, catalog);
  assert.equal(pilots.length, 55);
  assert.equal(pilots.filter(({fla}) => fla).length, 44);
  assert.equal(pilots.filter(({fla}) => !fla).length, 11);

  const expectedShards = [
    ["g05-l04-host-language", 15],
    ["g05-l04-instruction", 21],
    ["g05-l04-practice-assessment", 19],
  ];
  const selectedIds = new Set();
  for (const [shardId, expectedCount] of expectedShards) {
    const shard = selectCatalogRelease(releases, releaseId, shardId);
    assert.equal(shard.selectionId, `${releaseId}/${shardId}`);
    assert.equal(shard.shardId, shardId);
    assert.equal(shard.canonicalAssetCount, expectedCount);
    assert.equal(pilotsForBatch(shard, catalog).length, expectedCount);
    for (const item of shard.items) {
      assert.equal(item.shardId, shardId);
      assert.equal(selectedIds.has(item.canonicalAnimationId), false);
      selectedIds.add(item.canonicalAnimationId);
    }
  }
  assert.equal(selectedIds.size, 55);
  assert.deepEqual(selectedIds, new Set(full.items.map(({canonicalAnimationId}) => canonicalAnimationId)));
});

test("the checked-in G5 L5 release selects the exact 57 members and 18/19/20 development shards", async () => {
  const [releases, catalog] = await Promise.all([
    readFile(new URL("../catalog/lesson-releases.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../catalog/animations.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  const releaseId = "lesson-g05-l05-add-subtract-negative-numbers";
  const full = selectCatalogRelease(releases, releaseId);
  assert.equal(full.selectionKind, "release");
  assert.equal(full.selectionId, releaseId);
  assert.equal(full.canonicalAssetCount, 57);
  assert.equal(full.items.length, 57);
  assert.deepEqual(
    full.items.slice(0, 56).map(({xmlOccurrence}) => xmlOccurrence),
    Array.from({length: 56}, (_, index) => index + 1),
  );
  assert.equal(full.items.at(-1).canonicalAnimationId, "shell-course-g05-l05-index-local");
  assert.equal(full.items.at(-1).shardId, "g05-l05-host-language");

  const pilots = pilotsForBatch(full, catalog);
  assert.equal(pilots.length, 57);
  assert.equal(pilots.filter(({fla}) => fla).length, 49);
  assert.equal(pilots.filter(({fla}) => !fla).length, 8);

  const expectedShards = [
    ["g05-l05-host-language", 18],
    ["g05-l05-instruction", 19],
    ["g05-l05-practice-assessment", 20],
  ];
  const selectedIds = new Set();
  for (const [shardId, expectedCount] of expectedShards) {
    const shard = selectCatalogRelease(releases, releaseId, shardId);
    assert.equal(shard.selectionId, `${releaseId}/${shardId}`);
    assert.equal(shard.shardId, shardId);
    assert.equal(shard.canonicalAssetCount, expectedCount);
    assert.equal(pilotsForBatch(shard, catalog).length, expectedCount);
    for (const item of shard.items) {
      assert.equal(item.shardId, shardId);
      assert.equal(selectedIds.has(item.canonicalAnimationId), false);
      selectedIds.add(item.canonicalAnimationId);
    }
  }
  assert.equal(selectedIds.size, 57);
  assert.deepEqual(
    selectedIds,
    new Set(full.items.map(({canonicalAnimationId}) => canonicalAnimationId)),
  );
});

test("release and shard selection fail closed on zero, duplicate, wrong-shard, or source identity drift", async () => {
  const [releases, catalog] = await Promise.all([
    readFile(new URL("../catalog/lesson-releases.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../catalog/animations.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  const releaseId = "lesson-g05-l04-number-lines";
  assert.throws(() => selectCatalogRelease(releases, "lesson-missing"), /Unknown release/);
  assert.throws(() => selectCatalogRelease(releases, releaseId, "shard-missing"), /Unknown shard/);

  const duplicate = structuredClone(releases);
  duplicate.releases.push(structuredClone(duplicate.releases.find((release) => release.releaseId === releaseId)));
  assert.throws(() => selectCatalogRelease(duplicate, releaseId), /duplicate releaseId/);

  const wrongShard = structuredClone(releases);
  const wrongShardRelease = wrongShard.releases.find((release) => release.releaseId === releaseId);
  wrongShardRelease.members[14].shardId = "g05-l04-host-language";
  wrongShardRelease.members[14].batchId = "g05-l04-host-language";
  assert.throws(() => selectCatalogRelease(wrongShard, releaseId), /memberCount does not match members/);

  const sourceDrift = selectCatalogRelease(releases, releaseId, "g05-l04-host-language");
  sourceDrift.items[0].source.path = "HELP_COURSES/ELMGR5/L4/IR/not-the-source.swf";
  assert.throws(() => pilotsForBatch(sourceDrift, catalog), /release source identity mismatch/);
});

test("release CLI parsing preserves batch modes and accepts release plus optional shard paths", () => {
  assert.deepEqual(parseArguments(["--batch", "batch-001", "--dry-run"]), {
    batchId: "batch-001",
    dryRun: true,
  });
  assert.deepEqual(parseArguments(["--next"]), {next: true});
  const release = parseArguments([
    "--release-id", "lesson-g05-l04-number-lines",
    "--shard-id", "g05-l04-instruction",
    "--releases", "catalog/releases.test.json",
  ]);
  assert.equal(release.releaseId, "lesson-g05-l04-number-lines");
  assert.equal(release.shardId, "g05-l04-instruction");
  assert.equal(release.releasePath, path.resolve("catalog/releases.test.json"));
  assert.throws(() => parseArguments(["--release-id"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("invalid batch size and unknown IDs fail", () => {
  assert.throws(() => selectCatalogBatch({queues: []}, "batch-999"), /Unknown batch/);
  assert.throws(
    () => selectCatalogBatch({queues: [{queueId: "bad", batches: [{batchId: "batch-bad", items: Array.from({length: 26}, (_, index) => ({assetId: String(index)}))}]}]}, "batch-bad"),
    /1 to 25/,
  );
  const missingPrerequisite = smallBatchDocument();
  delete missingPrerequisite.queues[0].batches[0].scaffoldingPrerequisite;
  assert.throws(
    () => evaluateBatchScaffoldingGate({
      batchDocument: missingPrerequisite,
      batchId: "batch-001",
      ledger: strictLedger([]),
      ledgerCurrent: true,
    }),
    /scaffoldingPrerequisite must be a declarative object/,
  );
});

test("a no-prerequisite development shard opens only with a current well-formed ledger", () => {
  const batches = smallBatchDocument();
  const open = evaluateBatchScaffoldingGate({
    batchDocument: batches,
    batchId: "batch-001",
    ledger: strictLedger([]),
    ledgerCurrent: true,
  });
  assert.equal(open.open, true);
  assert.equal(open.prerequisiteKind, "none");
  assert.deepEqual(open.requiredAnimationIds, []);

  const stale = evaluateBatchScaffoldingGate({
    batchDocument: batches,
    batchId: "batch-001",
    ledger: strictLedger([]),
    ledgerCurrent: false,
  });
  assert.equal(stale.open, false);
  assert.equal(stale.ledgerState, "stale");
});

test("later batches require every canonical animation in the immediately previous catalog batch", () => {
  const batches = smallBatchDocument();
  const closed = evaluateBatchScaffoldingGate({
    batchDocument: batches,
    batchId: "batch-002",
    ledger: strictLedger(["animation-a"]),
    ledgerCurrent: true,
  });
  assert.equal(closed.open, false);
  assert.equal(closed.prerequisiteKind, "batch-strict");
  assert.equal(closed.prerequisiteBatchId, "batch-001");
  assert.deepEqual(closed.missingAnimationIds, ["animation-b"]);

  const open = evaluateBatchScaffoldingGate({
    batchDocument: batches,
    batchId: "batch-002",
    ledger: strictLedger(["animation-a", "animation-b"]),
    ledgerCurrent: true,
  });
  assert.equal(open.open, true);
});

test("stale and malformed ledgers fail closed", () => {
  const batches = smallBatchDocument();
  const stale = evaluateBatchScaffoldingGate({
    batchDocument: batches,
    batchId: "batch-001",
    ledger: strictLedger([]),
    ledgerCurrent: false,
    ledgerReason: "stale",
  });
  assert.equal(stale.open, false);
  assert.equal(stale.ledgerState, "stale");

  const malformed = evaluateBatchScaffoldingGate({
    batchDocument: batches,
    batchId: "batch-001",
    ledger: {schemaVersion: 1, entries: []},
    ledgerCurrent: true,
  });
  assert.equal(malformed.open, false);
  assert.equal(malformed.ledgerState, "malformed");
  assert.match(malformed.reason, /malformed/);
});

test("--next selection returns the first catalog batch not fully admitted", () => {
  const batches = smallBatchDocument();
  assert.equal(selectNextCatalogBatch(batches, strictLedger([])).batchId, "batch-001");
  assert.equal(selectNextCatalogBatch(batches, strictLedger(["animation-a", "animation-b"])).batchId, "batch-002");
  assert.equal(selectNextCatalogBatch(batches, strictLedger(["animation-a", "animation-b", "animation-c"])), null);
  assert.throws(() => selectNextCatalogBatch(batches, {schemaVersion: 1}), /Cannot select next batch/);
});

test("stale ledger cannot claim all batches complete in --next write mode", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "catalog-batch-next-stale-"));
  try {
    const batchPath = path.join(root, "batches.json");
    const catalogPath = path.join(root, "animations.json");
    await Promise.all([
      writeFile(batchPath, `${JSON.stringify(smallBatchDocument())}\n`),
      writeFile(catalogPath, `${JSON.stringify({animations: []})}\n`),
    ]);
    const completionLedgerCheck = async () => ({
      ok: false,
      reason: "stale",
      ledger: strictLedger(["animation-a", "animation-b", "animation-c"]),
    });
    const preview = await scaffoldCatalogBatch({
      next: true,
      batchPath,
      catalogPath,
      output: path.join(root, "migrations"),
      dryRun: true,
      completionLedgerCheck,
    });
    assert.equal(preview.batch, null);
    assert.equal(preview.gate.allBatchesComplete, false);
    assert.equal(preview.gate.ledgerState, "stale");
    await assert.rejects(
      scaffoldCatalogBatch({
        next: true,
        batchPath,
        catalogPath,
        output: path.join(root, "migrations"),
        completionLedgerCheck,
      }),
      /gate is closed.*ledger is stale/i,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("release dry-run reports a stale gate without writing while release write mode remains closed", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "catalog-release-stale-"));
  try {
    const scaffoldCalls = [];
    const syncCalls = [];
    const scaffoldMigrations = async (options) => {
      scaffoldCalls.push(options);
      return options.pilots.map((pilot) => ({action: "create", id: pilot.id}));
    };
    const syncMigrations = async (options) => syncCalls.push(options);
    const completionLedgerCheck = async () => ({
      ok: false,
      reason: "stale",
      ledger: strictLedger([]),
    });
    const common = {
      releaseId: "lesson-g05-l04-number-lines",
      shardId: "g05-l04-instruction",
      releasePath: path.join(PROJECT_ROOT, "catalog/lesson-releases.json"),
      catalogPath: path.join(PROJECT_ROOT, "catalog/animations.json"),
      batchPath: path.join(root, "must-not-be-read.json"),
      output: path.join(root, "migrations"),
      completionLedgerCheck,
      scaffoldMigrations,
      syncMigrations,
    };
    const preview = await scaffoldCatalogBatch({...common, dryRun: true});
    assert.equal(preview.batch.selectionKind, "release");
    assert.equal(preview.batch.releaseId, "lesson-g05-l04-number-lines");
    assert.equal(preview.batch.shardId, "g05-l04-instruction");
    assert.equal(preview.batch.items.length, 21);
    assert.equal(preview.results.length, 21);
    assert.equal(preview.gate.open, false);
    assert.equal(preview.gate.ledgerState, "stale");
    assert.equal(preview.gate.prerequisiteKind, "none");
    assert.equal(scaffoldCalls.length, 1);
    assert.equal(scaffoldCalls[0].dryRun, true);
    assert.equal(syncCalls.length, 0);

    await assert.rejects(
      scaffoldCatalogBatch(common),
      /declarative scaffolding gate is closed: strict completion ledger is stale/,
    );
    assert.equal(scaffoldCalls.length, 1, "closed release write mode must not call the scaffolder");
    assert.equal(syncCalls.length, 0);

    await assert.rejects(
      scaffoldCatalogBatch({batchId: "batch-001", releaseId: common.releaseId}),
      /Specify exactly one/,
    );
    await assert.rejects(
      scaffoldCatalogBatch({shardId: common.shardId}),
      /--shard-id requires --release-id/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("closed dry-run remains a write-free preview while closed write mode stops before scaffolding", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "catalog-batch-gate-"));
  try {
    const batchPath = path.join(root, "batches.json");
    const catalogPath = path.join(root, "animations.json");
    const batchDocument = smallBatchDocument();
    const catalogDocument = {
      animations: [
        {animationId: "animation-a", assetId: "swf-a", isCanonical: true, source: {path: "a.swf"}},
        {animationId: "animation-b", assetId: "swf-b", isCanonical: true, source: {path: "b.swf"}},
        {animationId: "animation-c", assetId: "swf-c", isCanonical: true, source: {path: "c.swf"}},
      ],
    };
    await Promise.all([
      writeFile(batchPath, `${JSON.stringify(batchDocument)}\n`),
      writeFile(catalogPath, `${JSON.stringify(catalogDocument)}\n`),
    ]);
    const completionLedgerCheck = async () => ({
      ok: true,
      reason: "current",
      ledger: strictLedger([]),
    });
    const scaffoldCalls = [];
    const syncCalls = [];
    const scaffoldMigrations = async (options) => {
      scaffoldCalls.push(options);
      return options.pilots.map((pilot) => ({action: "create", id: pilot.id}));
    };
    const syncMigrations = async (options) => syncCalls.push(options);

    const preview = await scaffoldCatalogBatch({
      batchId: "batch-002",
      batchPath,
      catalogPath,
      output: path.join(root, "migrations"),
      dryRun: true,
      completionLedgerCheck,
      scaffoldMigrations,
      syncMigrations,
    });
    assert.equal(preview.gate.open, false);
    assert.equal(scaffoldCalls.length, 1);
    assert.equal(scaffoldCalls[0].dryRun, true);
    assert.equal(syncCalls.length, 0);

    await assert.rejects(
      scaffoldCatalogBatch({
        batchId: "batch-002",
        batchPath,
        catalogPath,
        output: path.join(root, "migrations"),
        completionLedgerCheck,
        scaffoldMigrations,
        syncMigrations,
      }),
      /declarative scaffolding gate is closed/,
    );
    assert.equal(scaffoldCalls.length, 1, "closed write mode must not call the scaffolder");
    assert.equal(syncCalls.length, 0);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
