#!/usr/bin/env node

import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { scaffoldMigration, sha256File } from "./create-flash-migration.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const originalRoot = "source-assets/flash/HELP MATH_ORIGINAL FILES";

function original(relative) {
  return `${originalRoot}/${relative}`;
}

export const PILOT_MIGRATIONS = Object.freeze([
  { id: "formula-elementary-conversion-01-01", swf: original("HELP_FORMULAS/ELEMENTARY/SWF/Conversion_1_1.swf"), fla: original("HELP_FORMULAS/ELEMENTARY/SWF/Conversion_1_1.fla") },
  { id: "formula-elementary-conversion-01-02", swf: original("HELP_FORMULAS/ELEMENTARY/SWF/Conversion_1_2.swf"), fla: original("HELP_FORMULAS/ELEMENTARY/SWF/Conversion_1_2.fla") },
  { id: "formula-elementary-conversion-01-03", swf: original("HELP_FORMULAS/ELEMENTARY/SWF/Conversion_1_3.swf"), fla: original("HELP_FORMULAS/ELEMENTARY/SWF/Conversion_1_3.fla") },
  { id: "formula-elementary-conversion-01-04", swf: original("HELP_FORMULAS/ELEMENTARY/SWF/Conversion_1_4.swf"), fla: original("HELP_FORMULAS/ELEMENTARY/SWF/Conversion_1_4.fla") },
  { id: "keyterm-elementary-acute-angle", swf: original("HELP_KEYTERMS/KT/ELEMENTARY/DIG/acute_angle.swf"), fla: original("HELP_KEYTERMS/KT/ELEMENTARY/DIG/acute_angle.fla") },
  { id: "keyterm-elementary-computeghgh", swf: original("HELP_KEYTERMS/KT/ELEMENTARY/DIG/computeghgh.swf"), fla: original("HELP_KEYTERMS/KT/ELEMENTARY/DIG/computeghgh.fla") },
  { id: "course-g03-l01-vb-004", swf: original("HELP_COURSES/ELMGR3/L1/VB/L1VB04.swf"), fla: original("HELP_COURSES/ELMGR3/L1/VB/L1VB04.fla") },
  { id: "course-g04-l01-ir-001", swf: original("HELP_COURSES/ELMGR4/L1/IR/L1RW01.swf"), fla: original("HELP_COURSES/ELMGR4/L1/IR/L1RW01.fla") },
  { id: "course-g03-l06-ti-001", swf: original("HELP_COURSES/ELMGR3/L6/TI/L6TI01.swf") },
  { id: "course-g04-l03-in-009", swf: original("HELP_COURSES/ELMGR4/L3/IN/L3IN09.swf") },
  { id: "course-g04-l09-gs-002", swf: original("HELP_COURSES/ELMGR4/L9/GS/L9GS02.swf") },
  { id: "course-g05-l13-rw-002", swf: original("HELP_COURSES/ELMGR5/L13/RW/L13RW02.swf") },
  { id: "course-g03-l01-ts-008", swf: original("HELP_COURSES/ELMGR3/L1/TS/L1TS08.swf") },
  { id: "course-g03-l06-fq-002-review", swf: original("HELP_COURSES/ELMGR3/L6/FQ/Review/L6FQ02.swf") },
  { id: "course-g03-l08-re-001", swf: original("HELP_COURSES/ELMGR3/L8/RE/L8RE01.swf") },
  { id: "shell-course-g04-l01-index-local", swf: original("HELP_COURSES/ELMGR4/L1/index_local.swf") },
]);

function usage() {
  return `Usage:
  node scripts/scaffold-pilot-migrations.mjs [--dry-run] [--output <directory>]

Creates or verifies the approved 16 pilot migration workspaces. Existing workspaces
with matching IDs, source paths, hashes, and asset IDs are skipped; conflicts fail.`;
}

export function parseArguments(argv) {
  const options = { output: path.join(projectRoot, "migrations"), dryRun: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--dry-run") options.dryRun = true;
    else if (value === "--output") {
      const next = argv[index + 1];
      if (!next) throw new Error("--output requires a value");
      options.output = next;
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function resolveProjectPath(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath);
}

function sameResolvedPath(left, right) {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return resolveProjectPath(left) === resolveProjectPath(right);
}

async function inspectPilot(pilot, outputRoot) {
  const swfPath = resolveProjectPath(pilot.swf);
  const flaPath = pilot.fla ? resolveProjectPath(pilot.fla) : null;
  if (!(await fileExists(swfPath))) throw new Error(`${pilot.id}: SWF source does not exist: ${pilot.swf}`);
  if (flaPath && !(await fileExists(flaPath))) throw new Error(`${pilot.id}: FLA source does not exist: ${pilot.fla}`);
  const swfSha256 = await sha256File(swfPath);
  const flaSha256 = flaPath ? await sha256File(flaPath) : "";
  const destination = path.join(outputRoot, pilot.id);
  if (!(await fileExists(destination))) return { action: "create", pilot, destination, swfSha256, flaSha256 };

  const manifestPath = path.join(destination, "migration.json");
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    throw new Error(`${pilot.id}: existing workspace conflicts (${error.message})`);
  }
  const expectedAssetId = `swf-${swfSha256}`;
  const expectedFlaStatus = pilot.fla ? "present" : "missing";
  const preservedOrLater = new Set(["preserved", "audited", "baseline-ready", "specified", "implementing", "validating", "complete", "blocked"]);
  const correct = manifest.id === pilot.id &&
    manifest.animationId === pilot.id &&
    manifest.assetId === expectedAssetId &&
    preservedOrLater.has(manifest.status) &&
    sameResolvedPath(manifest.source?.swf, pilot.swf) &&
    sameResolvedPath(manifest.source?.fla, pilot.fla || "") &&
    sameResolvedPath(manifest.source?.placementPath, pilot.swf) &&
    manifest.source?.swfSha256 === swfSha256 &&
    manifest.source?.flaSha256 === flaSha256 &&
    manifest.source?.pairedFlaStatus === expectedFlaStatus;
  if (!correct) throw new Error(`${pilot.id}: existing workspace conflicts with the approved pilot identity or source evidence`);
  return { action: "skip", pilot, destination, swfSha256, flaSha256 };
}

export async function scaffoldPilotMigrations({
  pilots = PILOT_MIGRATIONS,
  output = path.join(projectRoot, "migrations"),
  dryRun = false,
} = {}) {
  const outputRoot = path.resolve(output);
  const ids = new Set();
  for (const pilot of pilots) {
    if (!pilot.id || ids.has(pilot.id)) throw new Error(`Pilot IDs must be non-empty and unique: ${pilot.id || "empty"}`);
    ids.add(pilot.id);
  }
  const planned = [];
  for (const pilot of pilots) planned.push(await inspectPilot(pilot, outputRoot));
  if (!dryRun) {
    for (const item of planned) {
      if (item.action !== "create") continue;
      await scaffoldMigration({
        id: item.pilot.id,
        output: outputRoot,
        swf: resolveProjectPath(item.pilot.swf),
        fla: item.pilot.fla ? resolveProjectPath(item.pilot.fla) : undefined,
      });
    }
  }
  return planned.map(({ action, pilot, destination }) => ({ action, id: pilot.id, destination }));
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const results = await scaffoldPilotMigrations(options);
    for (const result of results) console.log(`${options.dryRun ? "DRY-RUN " : ""}${result.action.toUpperCase()}: ${result.id}`);
    const creates = results.filter(({ action }) => action === "create").length;
    const skips = results.length - creates;
    console.log(`${options.dryRun ? "Would create" : "Created"} ${creates}; ${skips} already correct; ${results.length} approved pilot(s) checked.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
