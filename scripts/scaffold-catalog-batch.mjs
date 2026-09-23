#!/usr/bin/env node

import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {checkCompletionLedger} from "./build-completion-ledger.mjs";
import {validateLessonReleases} from "./build-lesson-release-ledger.mjs";
import {scaffoldPilotMigrations} from "./scaffold-pilot-migrations.mjs";
import {syncMigrationsFromCatalog} from "./sync-migrations-from-catalog.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const archivePrefix = "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const defaultLedgerPath = path.join(projectRoot, "catalog", "completion-ledger.json");
const defaultReleasePath = path.join(projectRoot, "catalog", "lesson-releases.json");

export function orderedCatalogBatches(batchDocument) {
  if (!Array.isArray(batchDocument?.queues)) throw new Error("Batch catalog must contain a queues array");
  const batches = batchDocument.queues.flatMap((queue) => {
    if (!Array.isArray(queue?.batches)) throw new Error(`Batch queue ${queue?.queueId || "unknown"} must contain a batches array`);
    return queue.batches.map((batch) => ({...batch, queueId: batch.queueId || queue.queueId}));
  });
  const ids = batches.map((batch) => batch.batchId);
  if (ids.some((id) => typeof id !== "string" || !id)) throw new Error("Every catalog batch must have a non-empty batchId");
  if (new Set(ids).size !== ids.length) throw new Error("Catalog batch IDs must be unique");
  return batches;
}

export function selectCatalogBatch(batchDocument, batchId) {
  const batches = orderedCatalogBatches(batchDocument);
  const matches = batches.filter((batch) => batch.batchId === batchId);
  if (matches.length !== 1) throw new Error(matches.length ? `Batch ID is not unique: ${batchId}` : `Unknown batch: ${batchId}`);
  const batch = matches[0];
  if (!Array.isArray(batch.items) || batch.items.length < 1 || batch.items.length > 25) {
    throw new Error(`${batchId}: canonical asset count must be from 1 to 25`);
  }
  const assetIds = new Set(batch.items.map((item) => item.assetId));
  if (assetIds.size !== batch.items.length) throw new Error(`${batchId}: duplicate assetId in batch`);
  return batch;
}

export function selectCatalogRelease(releaseDocument, releaseId, shardId = null) {
  validateLessonReleases(releaseDocument);
  const matches = releaseDocument.releases.filter((release) => release.releaseId === releaseId);
  if (matches.length !== 1) {
    throw new Error(matches.length ? `Release ID is not unique: ${releaseId}` : `Unknown release: ${releaseId}`);
  }
  const release = matches[0];
  let shard = null;
  if (shardId !== null && shardId !== undefined) {
    if (typeof shardId !== "string" || !shardId) throw new Error("--shard-id requires a non-empty value");
    const shardMatches = release.shards.filter((candidate) => candidate.shardId === shardId);
    if (shardMatches.length !== 1) {
      throw new Error(shardMatches.length
        ? `Shard ID is not unique in ${releaseId}: ${shardId}`
        : `Unknown shard for ${releaseId}: ${shardId}`);
    }
    shard = shardMatches[0];
  }
  const members = shard
    ? release.members.filter((member) => member.shardId === shard.shardId)
    : release.members;
  if (members.length !== (shard?.memberCount ?? release.expectedCounts.members)) {
    throw new Error(`${releaseId}${shard ? `/${shard.shardId}` : ""}: declared member count drifted`);
  }
  return {
    selectionKind: "release",
    selectionId: shard ? `${releaseId}/${shard.shardId}` : releaseId,
    batchId: shard?.batchId ?? releaseId,
    queueId: release.queueId,
    releaseId,
    shardId: shard?.shardId ?? null,
    canonicalAssetCount: members.length,
    scaffoldingPrerequisite: {kind: "none"},
    items: members.map((member) => ({
      assetId: member.assetId,
      canonicalAnimationId: member.animationId,
      releaseRole: member.releaseRole,
      batchId: member.batchId,
      shardId: member.shardId,
      source: member.source,
      xmlOccurrence: member.xmlOccurrence,
    })),
  };
}

function inspectCompletionLedger(ledger) {
  if (!ledger || typeof ledger !== "object" || Array.isArray(ledger)) {
    return {ok: false, error: "ledger must be an object", admittedIds: new Set()};
  }
  if (ledger.schemaVersion !== 1) {
    return {ok: false, error: "ledger schemaVersion must be 1", admittedIds: new Set()};
  }
  if (typeof ledger.generatedMarker !== "string" || !/^sha256:[a-f0-9]{64}$/.test(ledger.generatedMarker)) {
    return {ok: false, error: "ledger generatedMarker is malformed", admittedIds: new Set()};
  }
  if (!Array.isArray(ledger.entries) || !Array.isArray(ledger.diagnostics)) {
    return {ok: false, error: "ledger entries and diagnostics must be arrays", admittedIds: new Set()};
  }
  if (!ledger.summary || ledger.summary.strictComplete !== ledger.entries.length) {
    return {ok: false, error: "ledger strictComplete summary does not match its entries", admittedIds: new Set()};
  }

  const admittedIds = new Set();
  for (const entry of ledger.entries) {
    if (!entry || typeof entry.animationId !== "string" || !entry.animationId) {
      return {ok: false, error: "ledger entry animationId is malformed", admittedIds: new Set()};
    }
    if (admittedIds.has(entry.animationId)) {
      return {ok: false, error: `ledger contains duplicate entry ${entry.animationId}`, admittedIds: new Set()};
    }
    if (entry.validation?.mode !== "strict" || entry.validation?.generatedMarker !== ledger.generatedMarker) {
      return {ok: false, error: `ledger entry ${entry.animationId} is not bound to strict validation`, admittedIds: new Set()};
    }
    admittedIds.add(entry.animationId);
  }
  return {ok: true, error: null, admittedIds};
}

function prerequisiteForBatch(batchDocument, batchId) {
  const batch = selectCatalogBatch(batchDocument, batchId);
  const declaration = batch.scaffoldingPrerequisite;
  if (!declaration || typeof declaration !== "object" || Array.isArray(declaration)) {
    throw new Error(`${batchId}: scaffoldingPrerequisite must be a declarative object`);
  }
  if (declaration.kind === "none") {
    return {
      kind: "none",
      prerequisiteBatchId: null,
      prerequisiteReleaseId: null,
      animationIds: [],
    };
  }
  if (declaration.kind === "batch-strict") {
    if (typeof declaration.batchId !== "string" || !declaration.batchId || declaration.batchId === batchId) {
      throw new Error(`${batchId}: batch-strict prerequisite must name another batch`);
    }
    const prerequisiteBatch = selectCatalogBatch(batchDocument, declaration.batchId);
    return {
      kind: "batch-strict",
      prerequisiteBatchId: prerequisiteBatch.batchId,
      prerequisiteReleaseId: null,
      animationIds: prerequisiteBatch.items.map((item) => item.canonicalAnimationId),
    };
  }
  if (declaration.kind === "release-strict") {
    if (typeof declaration.releaseId !== "string" || !declaration.releaseId) {
      throw new Error(`${batchId}: release-strict prerequisite must name a release`);
    }
    const releaseBatches = orderedCatalogBatches(batchDocument)
      .filter((candidate) => candidate.releaseId === declaration.releaseId);
    if (!releaseBatches.length) {
      throw new Error(`${batchId}: unknown prerequisite release ${declaration.releaseId}`);
    }
    const animationIds = releaseBatches.flatMap((candidate) =>
      selectCatalogBatch(batchDocument, candidate.batchId).items.map((item) => item.canonicalAnimationId));
    if (new Set(animationIds).size !== animationIds.length) {
      throw new Error(`${batchId}: prerequisite release ${declaration.releaseId} contains duplicate animation IDs`);
    }
    return {
      kind: "release-strict",
      prerequisiteBatchId: null,
      prerequisiteReleaseId: declaration.releaseId,
      animationIds,
    };
  }
  throw new Error(`${batchId}: unsupported scaffoldingPrerequisite kind ${declaration.kind || "missing"}`);
}

export function evaluateBatchScaffoldingGate({
  batchDocument,
  batchId,
  ledger,
  ledgerCurrent = false,
  ledgerReason = ledgerCurrent ? "current" : "stale",
} = {}) {
  const prerequisite = prerequisiteForBatch(batchDocument, batchId);
  const inspected = inspectCompletionLedger(ledger);
  const admittedIds = inspected.admittedIds;
  const admittedAnimationIds = prerequisite.animationIds.filter((animationId) => admittedIds.has(animationId));
  const missingAnimationIds = prerequisite.animationIds.filter((animationId) => !admittedIds.has(animationId));
  const ledgerState = !inspected.ok ? "malformed" : ledgerCurrent ? "current" : ledgerReason || "stale";
  const open = inspected.ok && ledgerCurrent && missingAnimationIds.length === 0;
  let reason;
  if (!inspected.ok) reason = `strict completion ledger is malformed: ${inspected.error}`;
  else if (!ledgerCurrent) reason = `strict completion ledger is ${ledgerState}`;
  else if (missingAnimationIds.length) {
    const source = prerequisite.kind === "release-strict"
      ? `release ${prerequisite.prerequisiteReleaseId}`
      : `batch ${prerequisite.prerequisiteBatchId}`;
    reason = `${source} is incomplete (${missingAnimationIds.length} missing)`;
  } else if (prerequisite.kind === "none") {
    reason = "this parallel development shard has no strict-completion prerequisite and the completion ledger is current";
  } else reason = "all declarative prerequisites are admitted by the current strict completion ledger";
  return {
    open,
    batchId,
    ledgerState,
    reason,
    prerequisiteKind: prerequisite.kind,
    prerequisiteBatchId: prerequisite.prerequisiteBatchId,
    prerequisiteReleaseId: prerequisite.prerequisiteReleaseId,
    requiredAnimationIds: prerequisite.animationIds,
    admittedAnimationIds,
    missingAnimationIds,
  };
}

export function evaluateReleaseScaffoldingGate({
  selection,
  ledger,
  ledgerCurrent = false,
  ledgerReason = ledgerCurrent ? "current" : "stale",
} = {}) {
  if (selection?.selectionKind !== "release" || typeof selection.releaseId !== "string") {
    throw new Error("Release scaffolding gate requires an exact release selection");
  }
  const inspected = inspectCompletionLedger(ledger);
  const ledgerState = !inspected.ok ? "malformed" : ledgerCurrent ? "current" : ledgerReason || "stale";
  const open = inspected.ok && ledgerCurrent;
  const reason = !inspected.ok
    ? `strict completion ledger is malformed: ${inspected.error}`
    : !ledgerCurrent
      ? `strict completion ledger is ${ledgerState}`
      : "this release development selection has no strict-completion prerequisite and the completion ledger is current";
  return {
    open,
    batchId: selection.batchId,
    releaseId: selection.releaseId,
    shardId: selection.shardId,
    ledgerState,
    reason,
    prerequisiteKind: "none",
    prerequisiteBatchId: null,
    prerequisiteReleaseId: null,
    requiredAnimationIds: [],
    admittedAnimationIds: [],
    missingAnimationIds: [],
  };
}

export function selectNextCatalogBatch(batchDocument, ledger) {
  const inspected = inspectCompletionLedger(ledger);
  if (!inspected.ok) throw new Error(`Cannot select next batch: ${inspected.error}`);
  for (const batch of orderedCatalogBatches(batchDocument)) {
    const selected = selectCatalogBatch(batchDocument, batch.batchId);
    if (selected.items.some((item) => !inspected.admittedIds.has(item.canonicalAnimationId))) return selected;
  }
  return null;
}

export function pilotsForBatch(batch, catalogDocument) {
  if (!Array.isArray(catalogDocument.animations)) throw new Error("Catalog must contain an animations array");
  const canonicalById = new Map(catalogDocument.animations
    .filter((animation) => animation.isCanonical)
    .map((animation) => [animation.animationId, animation]));
  return batch.items.map((item) => {
    const animation = canonicalById.get(item.canonicalAnimationId);
    if (!animation) throw new Error(`${batch.batchId}: missing canonical catalog animation ${item.canonicalAnimationId}`);
    if (animation.assetId !== item.assetId) throw new Error(`${batch.batchId}: assetId mismatch for ${item.canonicalAnimationId}`);
    if (!animation.source?.path) throw new Error(`${batch.batchId}: missing SWF source path for ${item.canonicalAnimationId}`);
    if (item.source) {
      if (
        item.source.path !== animation.source.path ||
        item.source.sha256 !== animation.source.sha256 ||
        item.assetId !== `swf-${item.source.sha256}`
      ) {
        throw new Error(`${batch.batchId}: release source identity mismatch for ${item.canonicalAnimationId}`);
      }
    }
    return {
      id: animation.animationId,
      swf: `${archivePrefix}${animation.source.path}`,
      ...(animation.pairedFla?.path ? {fla: `${archivePrefix}${animation.pairedFla.path}`} : {}),
    };
  });
}

export async function scaffoldCatalogBatch({
  batchId,
  next = false,
  releaseId,
  shardId,
  batchPath = path.join(projectRoot, "catalog", "batches.json"),
  releasePath = defaultReleasePath,
  catalogPath = path.join(projectRoot, "catalog", "animations.json"),
  ledgerPath = defaultLedgerPath,
  output = path.join(projectRoot, "migrations"),
  dryRun = false,
  completionLedgerCheck = checkCompletionLedger,
  scaffoldMigrations = scaffoldPilotMigrations,
  syncMigrations = syncMigrationsFromCatalog,
} = {}) {
  const selectorCount = Number(Boolean(batchId)) + Number(next === true) + Number(Boolean(releaseId));
  if (shardId && !releaseId) throw new Error("--shard-id requires --release-id");
  if (selectorCount !== 1) throw new Error("Specify exactly one of --batch, --next, or --release-id");
  const [selectionDocument, catalogDocument] = await Promise.all([
    readFile(releaseId ? releasePath : batchPath, "utf8").then(JSON.parse),
    readFile(catalogPath, "utf8").then(JSON.parse),
  ]);
  const ledgerCheck = await completionLedgerCheck({
    migrationsRoot: path.resolve(output),
    output: path.resolve(ledgerPath),
  });
  const currentLedger = ledgerCheck?.ledger;
  const batchDocument = releaseId ? null : selectionDocument;
  const batch = releaseId
    ? selectCatalogRelease(selectionDocument, releaseId, shardId)
    : next
      ? selectNextCatalogBatch(batchDocument, currentLedger)
      : selectCatalogBatch(batchDocument, batchId);
  if (!batch) {
    const ledgerState = ledgerCheck.ok ? "current" : ledgerCheck.reason || "stale";
    if (!dryRun && !ledgerCheck.ok) {
      throw new Error(`Declarative scaffolding gate is closed: strict completion ledger is ${ledgerState}`);
    }
    return {
      batch: null,
      results: [],
      gate: {
        open: false,
        allBatchesComplete: ledgerCheck.ok === true,
        ledgerState,
        reason: ledgerCheck.ok
          ? "all catalog batches are already admitted"
          : `generated strict results contain every batch, but the stored completion ledger is ${ledgerState}`,
      },
    };
  }
  const gate = releaseId
    ? evaluateReleaseScaffoldingGate({
        selection: batch,
        ledger: currentLedger,
        ledgerCurrent: ledgerCheck.ok === true,
        ledgerReason: ledgerCheck.reason,
      })
    : evaluateBatchScaffoldingGate({
        batchDocument,
        batchId: batch.batchId,
        ledger: currentLedger,
        ledgerCurrent: ledgerCheck.ok === true,
        ledgerReason: ledgerCheck.reason,
      });
  if (!dryRun && !gate.open) {
    throw new Error(`${batch.batchId}: declarative scaffolding gate is closed: ${gate.reason}`);
  }
  const pilots = pilotsForBatch(batch, catalogDocument);
  const results = await scaffoldMigrations({pilots, output, dryRun});
  if (!dryRun) await syncMigrations({catalogPath, migrationsRoot: path.resolve(output)});
  return {batch, results, gate};
}

function usage() {
  return `Usage:
  node scripts/scaffold-catalog-batch.mjs
      (--batch <batch-NNN> | --next | --release-id <id> [--shard-id <id>])
      [--dry-run] [--output <directory>] [--catalog <file>]
      [--batches <file>] [--releases <file>] [--ledger <file>]

Selects canonical migration workspaces from the deterministic batch queue or an
exact atomic lesson release/shard. Write mode fails closed unless the strict
completion ledger is current and admits the selected declarative prerequisite.
Parallel development shards may explicitly declare no strict prerequisite. Dry-run
reports the gate and previews without writing. --next selects the first batch not
fully admitted.`;
}

export function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--dry-run") options.dryRun = true;
    else if (value === "--next") options.next = true;
    else if ([
      "--batch",
      "--release-id",
      "--shard-id",
      "--output",
      "--catalog",
      "--batches",
      "--releases",
      "--ledger",
    ].includes(value)) {
      const nextValue = argv[index + 1];
      if (!nextValue || nextValue.startsWith("--")) throw new Error(`${value} requires a value`);
      if (value === "--batch") options.batchId = nextValue;
      else if (value === "--release-id") options.releaseId = nextValue;
      else if (value === "--shard-id") options.shardId = nextValue;
      else if (value === "--output") options.output = path.resolve(nextValue);
      else if (value === "--catalog") options.catalogPath = path.resolve(nextValue);
      else if (value === "--batches") options.batchPath = path.resolve(nextValue);
      else if (value === "--releases") options.releasePath = path.resolve(nextValue);
      else options.ledgerPath = path.resolve(nextValue);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const {batch, results, gate} = await scaffoldCatalogBatch(options);
  if (!batch) {
    console.log(`${gate.allBatchesComplete ? "ALL COMPLETE" : "GATE CLOSED"}: ${gate.reason}.`);
    return;
  }
  const prerequisite = gate.prerequisiteKind === "none"
    ? "no strict prerequisite"
    : gate.prerequisiteKind === "release-strict"
      ? `release ${gate.prerequisiteReleaseId}`
      : `batch ${gate.prerequisiteBatchId}`;
  console.log(
    `GATE ${gate.open ? "OPEN" : "CLOSED"}: ${batch.batchId}; ${prerequisite}; ` +
    `${gate.admittedAnimationIds.length}/${gate.requiredAnimationIds.length} admitted; ledger ${gate.ledgerState}.`,
  );
  for (const result of results) console.log(`${options.dryRun ? "DRY-RUN " : ""}${result.action.toUpperCase()}: ${result.id}`);
  const createCount = results.filter((result) => result.action === "create").length;
  console.log(`${batch.batchId} (${batch.queueId}): ${results.length} canonical asset(s), ${createCount} ${options.dryRun ? "would be created" : "created"}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
