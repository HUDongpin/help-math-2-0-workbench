#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {copyFile, mkdir, readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_ROOT = "public/flash-assets/audio/courses";

export const COURSE_AUDIO_PILOTS = Object.freeze([
  "course-g03-l01-ts-008",
  "course-g03-l01-vb-004",
  "course-g04-l03-ts-006",
  "course-g04-l03-in-009",
  "course-g04-l09-gs-002",
  "course-g05-l13-rw-002",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function safeLanguage(value, animationId) {
  invariant(value === "en" || value === "es", `${animationId}: external audio language must be en or es`);
  return value;
}

export function buildCourseAudioEntries(animationId, evidence) {
  invariant(COURSE_AUDIO_PILOTS.includes(animationId), `Not an approved course-audio pilot: ${animationId}`);
  invariant(evidence.animationId === animationId, `${animationId}: audio evidence belongs to ${evidence.animationId || "unknown"}`);
  invariant(evidence.acceptance?.structurallyAudited === true, `${animationId}: audio structure is not audited`);
  const associations = evidence.externalAudio?.exactAssociations || [];
  invariant(associations.length > 0, `${animationId}: no exact external audio association exists`);

  const entries = associations.map((association) => {
    const language = safeLanguage(association.languageAssessment?.language, animationId);
    invariant(association.hashMatchesCatalog === true, `${animationId}/${language}: source/catalog hash is not verified`);
    invariant(association.associationStatus === "exact-basename-association", `${animationId}/${language}: association is not exact-basename`);
    invariant(association.startFrame === null && association.startSemantics === "host-user-activated", `${animationId}/${language}: source does not prove user-triggered host activation`);
    invariant(/^[a-f0-9]{64}$/.test(association.observedSha256 || ""), `${animationId}/${language}: source SHA-256 is invalid`);
    invariant(Number(association.probe?.durationMs) > 0, `${animationId}/${language}: duration is missing`);
    const output = `${OUTPUT_ROOT}/${animationId}/${language}.mp3`;
    return Object.freeze({
      animationId,
      id: `${animationId}-${language}-host-audio`,
      language,
      activation: "user",
      sourceEvidence: association.sourceFile,
      sourceSha256: association.observedSha256,
      durationMs: association.probe.durationMs,
      output,
      publicUrl: `/${output.replace(/^public\//, "")}`,
      authority: "exact-basename legacy-host routing only",
      authoritativeListeningComplete: false,
      synchronizationComplete: false,
    });
  });
  invariant(new Set(entries.map(({language}) => language)).size === entries.length, `${animationId}: duplicate language tracks`);
  return entries;
}

async function loadEntries(root) {
  const entries = [];
  for (const animationId of COURSE_AUDIO_PILOTS) {
    const evidencePath = path.join(root, "migrations", animationId, "audit", "audio-runtime-evidence.json");
    entries.push(...buildCourseAudioEntries(animationId, JSON.parse(await readFile(evidencePath, "utf8"))));
  }
  return entries;
}

async function verifiedSource(root, entry) {
  const source = path.resolve(root, entry.sourceEvidence);
  const relative = path.relative(root, source);
  invariant(relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), `${entry.id}: source escapes project root`);
  const bytes = await readFile(source);
  invariant(sha256(bytes) === entry.sourceSha256, `${entry.id}: source MP3 hash mismatch`);
  return {source, bytes};
}

export async function syncCourseAudioAssets({root = ROOT, check = false} = {}) {
  const entries = await loadEntries(root);
  for (const entry of entries) {
    const {source, bytes} = await verifiedSource(root, entry);
    const output = path.join(root, entry.output);
    const outputBytes = await readFile(output).catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
    if (outputBytes) {
      invariant(outputBytes.length === bytes.length && sha256(outputBytes) === entry.sourceSha256, `${entry.id}: public MP3 differs from source`);
    } else if (check) {
      invariant(false, `${entry.id}: public MP3 is missing`);
    } else {
      await mkdir(path.dirname(output), {recursive: true});
      await copyFile(source, output, fsConstants.COPYFILE_EXCL);
      const copiedBytes = await readFile(output);
      invariant(copiedBytes.length === bytes.length && sha256(copiedBytes) === entry.sourceSha256, `${entry.id}: copied MP3 failed integrity verification`);
    }
  }

  const manifest = Object.freeze({
    schemaVersion: 1,
    artifactType: "course-host-audio-public-assets",
    authority: "Exact owner-provided MP3 bytes with source-hash and legacy-host basename routing",
    authorityBoundary: "This manifest does not prove spoken content, listening acceptance, frame synchronization, pause/resume behavior, Replay behavior, human review, owner acceptance, or strict completion.",
    strictAcceptanceEffect: false,
    entries,
  });
  const manifestPath = path.join(root, OUTPUT_ROOT, "manifest.json");
  const encoded = `${JSON.stringify(manifest, null, 2)}\n`;
  if (check) invariant(await readFile(manifestPath, "utf8") === encoded, "Course audio public manifest is stale");
  else {
    await mkdir(path.dirname(manifestPath), {recursive: true});
    await writeFile(manifestPath, encoded);
  }
  for (const entry of entries) invariant((await stat(path.join(root, entry.output))).isFile(), `${entry.output}: output is not a file`);
  return {entries: entries.length, manifest: portable(path.relative(root, manifestPath))};
}

async function main() {
  const unknown = process.argv.slice(2).filter((value) => value !== "--check");
  if (unknown.length) throw new Error(`Unknown argument(s): ${unknown.join(", ")}`);
  console.log(JSON.stringify(await syncCourseAudioAssets({check: process.argv.includes("--check")}), null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
