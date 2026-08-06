#!/usr/bin/env node

import {readFile, readdir, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const archivePrefix = "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const audioHeader = "cue_id,language,source_file,sha256,start_frame,duration_ms,format,channels,sample_rate_hz,source_character_id,notes";

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function catalogRelativeSource(value = "") {
  const normalized = portable(value);
  const marker = "HELP MATH_ORIGINAL FILES/";
  const markerIndex = normalized.indexOf(marker);
  return markerIndex >= 0 ? normalized.slice(markerIndex + marker.length) : normalized;
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function renderAudioInventory(entries) {
  const rows = entries.map((entry, index) => [
    `catalog-audio-${String(index + 1).padStart(2, "0")}`,
    entry.language || "unknown",
    `${archivePrefix}${entry.path}`,
    entry.sha256 || "",
    "",
    "",
    path.extname(entry.path).slice(1).toLowerCase(),
    "",
    "",
    "",
    "Catalog association only; start frame, duration, and stream metadata require timeline/audio audit.",
  ].map(csvCell).join(","));
  return `${[audioHeader, ...rows].join("\n")}\n`;
}

function classificationFromCatalog(animation) {
  const source = animation.classification || {};
  const shell = Boolean(animation.flags?.shell);
  const page = source.page || {};
  return {
    collection: source.collection || "unknown",
    grade: source.grade === "elementary" ? "elementary/shared" : source.grade ?? null,
    lesson: source.lesson ?? null,
    section: source.section?.code || null,
    page: page.number ?? page.ordinal ?? null,
    domain: shell ? "platform-shell" : source.domain || "unknown",
    knowledgePoint: {
      en: source.titleEnglish || source.titleDisplay || "",
      es: source.titleSpanish || "",
    },
    titleRaw: source.titleRaw || "",
    titleDisplay: source.titleDisplay || source.titleRaw || "",
    status: source.status || "unresolved",
    evidence: Array.isArray(source.evidence) ? source.evidence : [],
  };
}

async function isDirectory(value) {
  try {
    return (await stat(value)).isDirectory();
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

export async function syncMigrationsFromCatalog({
  catalogPath = path.join(projectRoot, "catalog", "animations.json"),
  migrationsRoot = path.join(projectRoot, "migrations"),
  dryRun = false,
} = {}) {
  const catalogDocument = JSON.parse(await readFile(catalogPath, "utf8"));
  if (!Array.isArray(catalogDocument.animations)) throw new Error("Catalog must contain an animations array");
  const byId = new Map(catalogDocument.animations.map((animation) => [animation.animationId, animation]));
  const bySource = new Map(catalogDocument.animations.map((animation) => [catalogRelativeSource(animation.source?.path), animation]));
  const entries = (await readdir(migrationsRoot, {withFileTypes: true}))
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => compareText(left.name, right.name));
  const results = [];

  for (const entry of entries) {
    const workspace = path.join(migrationsRoot, entry.name);
    const manifestPath = path.join(workspace, "migration.json");
    if (!(await isDirectory(workspace))) continue;
    let manifest;
    try {
      manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw new Error(`${entry.name}: cannot read migration.json (${error.message})`);
    }

    const sourceKey = catalogRelativeSource(manifest.source?.placementPath || manifest.source?.swf);
    const animation = byId.get(manifest.animationId) || bySource.get(sourceKey);
    if (!animation) {
      results.push({id: manifest.animationId || entry.name, action: "unmatched"});
      continue;
    }
    if (manifest.assetId && animation.assetId && manifest.assetId !== animation.assetId) {
      throw new Error(`${entry.name}: assetId conflicts with catalog evidence`);
    }
    if (manifest.source?.swfSha256 && animation.source?.sha256 && manifest.source.swfSha256 !== animation.source.sha256) {
      throw new Error(`${entry.name}: SWF SHA-256 conflicts with catalog evidence`);
    }

    const classificationUnresolved = !manifest.classification || manifest.classification.status === "unresolved";
    if (classificationUnresolved) manifest.classification = classificationFromCatalog(animation);
    manifest.implementation ??= {};
    if (!Object.hasOwn(manifest.implementation, "registryModule")) {
      // Preserved/audited workspaces must carry the current schema without
      // pretending that a renderer module exists. Strict validation requires
      // this to become ./modules/<animation-id> and verifies that file later.
      manifest.implementation.registryModule = "";
    }
    manifest.source.aliasOf = animation.duplicateOf || null;
    manifest.source.variantOf = animation.flags?.variant ? animation.canonicalAnimationId : null;
    const audioUnresolved = !Array.isArray(manifest.audio?.catalogExactAssociations);
    manifest.catalogEvidence = {
      schemaVersion: catalogDocument.schemaVersion || 1,
      animationId: animation.animationId,
      canonicalAnimationId: animation.canonicalAnimationId,
      catalogSourcePath: animation.source?.path || "",
      classificationImported: Boolean(manifest.catalogEvidence?.classificationImported) || classificationUnresolved,
      audioAssociationsImported: Boolean(manifest.catalogEvidence?.audioAssociationsImported) || audioUnresolved,
      migrationStatusImported: false,
    };

    const exactAudio = Array.isArray(animation.audio?.exact) ? animation.audio.exact : [];
    const audioGroupIds = Array.isArray(animation.audio?.groupIds) ? animation.audio.groupIds : [];
    if (audioUnresolved) {
      manifest.audio.required = exactAudio.length > 0 || audioGroupIds.length > 0;
      manifest.audio.reasonNotRequired = manifest.audio.required
        ? ""
        : "No catalog association was found; manual SWF/FLA timeline audit must confirm that audio is not required.";
      manifest.audio.languages = [...new Set(exactAudio.map((item) => item.language).filter(Boolean))].sort(compareText);
      manifest.audio.catalogGroupCandidates = audioGroupIds;
      manifest.audio.catalogExactAssociations = exactAudio.map((item) => ({
        sourceFile: `${archivePrefix}${item.path}`,
        sha256: item.sha256 || "",
        language: item.language || "unknown",
        bytes: item.bytes ?? null,
        association: item.association || "catalog",
      }));
    }

    if (!dryRun) {
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
      if (audioUnresolved) await writeFile(path.join(workspace, "audio-inventory.csv"), renderAudioInventory(exactAudio), "utf8");
    }
    results.push({id: manifest.animationId || entry.name, action: dryRun ? "would-sync" : "synced", audioAssociations: exactAudio.length});
  }
  return results;
}

function usage() {
  return `Usage:
  node scripts/sync-migrations-from-catalog.mjs [--dry-run] [--catalog <file>] [--migrations <directory>]

Imports only catalog-backed intake classification, alias/variant, and audio-association
evidence. It never advances migration status or claims that audio timing is audited.`;
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
    else if (value === "--catalog" || value === "--migrations") {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--catalog") options.catalogPath = path.resolve(next);
      else options.migrationsRoot = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  const results = await syncMigrationsFromCatalog(options);
  for (const result of results) console.log(`${result.action.toUpperCase()}: ${result.id}${result.audioAssociations == null ? "" : ` (${result.audioAssociations} exact audio)`}`);
  const counts = Object.groupBy(results, (result) => result.action);
  console.log(`Catalog sync checked ${results.length} migration workspace(s); ${counts.unmatched?.length || 0} unmatched.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
