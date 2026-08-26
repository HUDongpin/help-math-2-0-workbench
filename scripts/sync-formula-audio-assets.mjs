#!/usr/bin/env node

import {createHash} from "node:crypto";
import {copyFile, mkdir, readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_ROOT = path.join(ROOT, "public", "flash-assets", "audio", "formulas");

export const FORMULA_PILOTS = Object.freeze([
  Object.freeze({animationId: "formula-elementary-conversion-01-01", assetName: "conversion-1-1"}),
  Object.freeze({animationId: "formula-elementary-conversion-01-02", assetName: "conversion-1-2"}),
  Object.freeze({animationId: "formula-elementary-conversion-01-03", assetName: "conversion-1-3"}),
  Object.freeze({animationId: "formula-elementary-conversion-01-04", assetName: "conversion-1-4"}),
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

export function buildFormulaAudioEntries(pilot, evidence) {
  if (evidence.animationId !== pilot.animationId) {
    throw new Error(`${pilot.animationId}: audio evidence belongs to ${evidence.animationId}`);
  }
  const associations = evidence.externalAudio?.exactAssociations || [];
  const byLanguage = new Map(associations.map((association) => [association.languageAssessment?.language, association]));
  if (associations.length !== 2 || !byLanguage.has("en") || !byLanguage.has("es")) {
    throw new Error(`${pilot.animationId}: expected one exact English and one exact Spanish MP3`);
  }
  return ["en", "es"].map((language) => {
    const association = byLanguage.get(language);
    if (!association.hashMatchesCatalog || association.associationStatus !== "exact-basename-association") {
      throw new Error(`${pilot.animationId}/${language}: association is not exact and hash-verified`);
    }
    if (association.startFrame !== null || association.startSemantics !== "host-user-activated") {
      throw new Error(`${pilot.animationId}/${language}: evidence does not prove user-triggered host audio`);
    }
    return {
      animationId: pilot.animationId,
      id: `formula-${pilot.assetName}-${language}`,
      language,
      activation: "user",
      sourceEvidence: association.sourceFile,
      sourceSha256: association.observedSha256,
      durationMs: association.probe?.durationMs,
      output: `public/flash-assets/audio/formulas/${pilot.assetName}/${language}.mp3`,
      publicUrl: `/flash-assets/audio/formulas/${pilot.assetName}/${language}.mp3`,
    };
  });
}

async function loadEntries(root = ROOT) {
  const entries = [];
  for (const pilot of FORMULA_PILOTS) {
    const evidencePath = path.join(root, "migrations", pilot.animationId, "audit", "audio-runtime-evidence.json");
    const evidence = JSON.parse(await readFile(evidencePath, "utf8"));
    entries.push(...buildFormulaAudioEntries(pilot, evidence));
  }
  return entries;
}

async function validateSource(root, entry) {
  const source = path.join(root, entry.sourceEvidence);
  const bytes = await readFile(source);
  const observed = sha256(bytes);
  if (observed !== entry.sourceSha256) {
    throw new Error(`${entry.animationId}/${entry.language}: source MP3 hash mismatch`);
  }
  return {source, bytes};
}

export async function syncFormulaAudioAssets({root = ROOT, check = false} = {}) {
  const entries = await loadEntries(root);
  for (const entry of entries) {
    const {source, bytes} = await validateSource(root, entry);
    const output = path.join(root, entry.output);
    if (check) {
      const outputBytes = await readFile(output);
      if (sha256(outputBytes) !== entry.sourceSha256) {
        throw new Error(`${entry.animationId}/${entry.language}: public MP3 hash mismatch`);
      }
    } else {
      await mkdir(path.dirname(output), {recursive: true});
      await copyFile(source, output);
      const copied = await readFile(output);
      if (sha256(copied) !== entry.sourceSha256 || copied.length !== bytes.length) {
        throw new Error(`${entry.animationId}/${entry.language}: copied MP3 failed integrity verification`);
      }
    }
  }
  const manifest = {
    schemaVersion: 1,
    authority: "Exact EAD/SAD associations and user-trigger behavior recovered from the original HELP Math indexELM host",
    entries,
  };
  const manifestPath = path.join(root, "public", "flash-assets", "audio", "formulas", "manifest.json");
  const encoded = `${JSON.stringify(manifest, null, 2)}\n`;
  if (check) {
    if ((await readFile(manifestPath, "utf8")) !== encoded) throw new Error("Formula audio manifest is stale");
  } else {
    await mkdir(path.dirname(manifestPath), {recursive: true});
    await writeFile(manifestPath, encoded);
  }
  for (const entry of entries) {
    const info = await stat(path.join(root, entry.output));
    if (!info.isFile()) throw new Error(`${portable(entry.output)} is not a file`);
  }
  return {entries: entries.length, manifest: portable(path.relative(root, manifestPath))};
}

async function main() {
  const unknown = process.argv.slice(2).filter((value) => value !== "--check");
  if (unknown.length) throw new Error(`Unknown argument(s): ${unknown.join(", ")}`);
  console.log(JSON.stringify(await syncFormulaAudioAssets({check: process.argv.includes("--check")}), null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
