#!/usr/bin/env node

import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {scaffoldPilotMigrations} from "./scaffold-pilot-migrations.mjs";
import {syncMigrationsFromCatalog} from "./sync-migrations-from-catalog.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const archivePrefix = "source-assets/flash/HELP MATH_ORIGINAL FILES/";

export function selectCatalogBatch(batchDocument, batchId) {
  const batches = (batchDocument.queues || []).flatMap((queue) =>
    (queue.batches || []).map((batch) => ({...batch, queueId: batch.queueId || queue.queueId})),
  );
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
    return {
      id: animation.animationId,
      swf: `${archivePrefix}${animation.source.path}`,
      ...(animation.pairedFla?.path ? {fla: `${archivePrefix}${animation.pairedFla.path}`} : {}),
    };
  });
}

export async function scaffoldCatalogBatch({
  batchId,
  batchPath = path.join(projectRoot, "catalog", "batches.json"),
  catalogPath = path.join(projectRoot, "catalog", "animations.json"),
  output = path.join(projectRoot, "migrations"),
  dryRun = false,
} = {}) {
  if (!batchId) throw new Error("--batch is required");
  const [batchDocument, catalogDocument] = await Promise.all([
    readFile(batchPath, "utf8").then(JSON.parse),
    readFile(catalogPath, "utf8").then(JSON.parse),
  ]);
  const batch = selectCatalogBatch(batchDocument, batchId);
  const pilots = pilotsForBatch(batch, catalogDocument);
  const results = await scaffoldPilotMigrations({pilots, output, dryRun});
  if (!dryRun) await syncMigrationsFromCatalog({catalogPath, migrationsRoot: path.resolve(output)});
  return {batch, results};
}

function usage() {
  return `Usage:
  node scripts/scaffold-catalog-batch.mjs --batch <batch-NNN> [--dry-run]
      [--output <directory>] [--catalog <file>] [--batches <file>]

Creates at most 25 canonical migration workspaces from the deterministic batch
queue, preflights every source and conflict before writing, then imports catalog
intake evidence without advancing migration status.`;
}

async function main() {
  const options = {};
  const argumentsList = process.argv.slice(2);
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--help" || value === "-h") {
      console.log(usage());
      return;
    }
    if (value === "--dry-run") options.dryRun = true;
    else if (["--batch", "--output", "--catalog", "--batches"].includes(value)) {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--batch") options.batchId = next;
      else if (value === "--output") options.output = path.resolve(next);
      else if (value === "--catalog") options.catalogPath = path.resolve(next);
      else options.batchPath = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  const {batch, results} = await scaffoldCatalogBatch(options);
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
