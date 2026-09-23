#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  chmod,
  lstat,
  readFile,
  realpath,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  GS002_ROOT_STRUCTURAL_PIN_CONTRACT,
  planGs002RootStructuralPinRefresh,
} from "./refresh-gs002-root-structural-inspection-pins.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const INVENTORY_PATH = "migrations/course-g04-l09-gs-002/asset-inventory.csv";

const ROWS = Object.freeze([
  Object.freeze({
    assetId: "ffdec-root-frame-assets",
    priorSha256:
      GS002_ROOT_STRUCTURAL_PIN_CONTRACT.expectedPriorAssetManifestSha256,
    currentSha256:
      GS002_ROOT_STRUCTURAL_PIN_CONTRACT.expectedCurrentAssetManifestSha256,
    format: "JSON+PNG",
  }),
  Object.freeze({
    assetId: "root-bilingual-visual-disposition",
    priorSha256:
      GS002_ROOT_STRUCTURAL_PIN_CONTRACT.expectedPriorDispositionSha256,
    currentSha256:
      GS002_ROOT_STRUCTURAL_PIN_CONTRACT.expectedCurrentDispositionSha256,
    format: "JSON",
  }),
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function resolveInventory(root) {
  const rootReal = await realpath(root);
  const file = path.join(rootReal, ...INVENTORY_PATH.split("/"));
  const [linkInfo, fileInfo, actual] = await Promise.all([
    lstat(file),
    stat(file),
    realpath(file),
  ]);
  invariant(!linkInfo.isSymbolicLink(), "GS002 asset inventory must not be a symlink");
  invariant(fileInfo.isFile(), "GS002 asset inventory must be a regular file");
  invariant(actual === file, "GS002 asset inventory path drift is forbidden");
  return {file, mode: fileInfo.mode & 0o777};
}

function splitLines(text) {
  const newline = text.includes("\r\n") ? "\r\n" : "\n";
  return {lines: text.split(newline), newline};
}

function rowState(line, row) {
  if (!line.startsWith(`${row.assetId},`)) return null;
  const priorToken = `,${row.priorSha256},${row.format},`;
  const currentToken = `,${row.currentSha256},${row.format},`;
  const prior = line.includes(priorToken);
  const current = line.includes(currentToken);
  invariant(
    prior !== current,
    `${row.assetId}: SHA cell is neither the authorized prior value nor the current value`,
  );
  return {prior, current, priorToken, currentToken};
}

export function refreshGs002AssetInventoryText(text) {
  invariant(
    text.startsWith(
      "asset_id,swf_character_id,library_symbol,type,source_file,source_frame,exported_file,sha256,format,",
    ),
    "GS002 asset inventory header changed",
  );
  const {lines, newline} = splitLines(text);
  const states = [];
  for (const row of ROWS) {
    const matches = lines
      .map((line, index) => ({line, index, state: rowState(line, row)}))
      .filter((match) => match.state);
    invariant(matches.length === 1, `${row.assetId}: expected exactly one inventory row`);
    states.push({...matches[0], row});
  }
  const staleCount = states.filter(({state}) => state.prior).length;
  invariant(
    staleCount === 0 || staleCount === ROWS.length,
    "GS002 asset inventory pins must move as one pair",
  );
  const updatedLines = [...lines];
  for (const {index, line, state} of states) {
    if (state.prior) {
      const replaced = line.replace(state.priorToken, state.currentToken);
      invariant(replaced !== line, "GS002 asset inventory SHA replacement failed");
      updatedLines[index] = replaced;
    }
  }
  const updatedText = updatedLines.join(newline);
  let redactedBefore = text;
  let redactedAfter = updatedText;
  for (const row of ROWS) {
    redactedBefore = redactedBefore
      .replace(row.priorSha256, `<GS002:${row.assetId}>`)
      .replace(row.currentSha256, `<GS002:${row.assetId}>`);
    redactedAfter = redactedAfter
      .replace(row.priorSha256, `<GS002:${row.assetId}>`)
      .replace(row.currentSha256, `<GS002:${row.assetId}>`);
  }
  invariant(
    redactedBefore === redactedAfter,
    "GS002 asset inventory refresh attempted to change non-target bytes",
  );
  return {
    updatedText,
    changed: staleCount === ROWS.length,
    changedAssetIds: staleCount === ROWS.length
      ? ROWS.map(({assetId}) => assetId)
      : [],
  };
}

export async function planGs002AssetInventoryPinRefresh({
  root = PROJECT_ROOT,
} = {}) {
  // Reuse the stricter manifest/disposition validator so a CSV mirror cannot
  // be rebound after original-runtime or acceptance authority drifts.
  const structural = await planGs002RootStructuralPinRefresh({root});
  invariant(
    !structural.changed,
    "GS002 migration rootStructuralInspection pins must be current first",
  );
  const resolved = await resolveInventory(root);
  const beforeBytes = await readFile(resolved.file);
  const beforeText = beforeBytes.toString("utf8");
  const refreshed = refreshGs002AssetInventoryText(beforeText);
  return {
    ...refreshed,
    file: resolved.file,
    mode: resolved.mode,
    beforeBytes,
    sha256: sha256(Buffer.from(refreshed.updatedText)),
    technicalManifestSha256: structural.technicalManifestSha256,
  };
}

async function atomicCasWrite(plan) {
  invariant(
    (await readFile(plan.file)).equals(plan.beforeBytes),
    "GS002 asset inventory changed after preflight; no write performed",
  );
  const temporary =
    `${plan.file}.gs002-pins-${process.pid}-${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, plan.updatedText, {encoding: "utf8", flag: "wx"});
    await chmod(temporary, plan.mode);
    await rename(temporary, plan.file);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
  invariant(
    sha256(await readFile(plan.file)) === plan.sha256,
    "GS002 asset inventory post-write SHA-256 mismatch",
  );
}

export async function refreshGs002AssetInventoryPins({
  root = PROJECT_ROOT,
  check = false,
} = {}) {
  const plan = await planGs002AssetInventoryPinRefresh({root});
  if (check) {
    invariant(
      !plan.changed,
      "GS002 asset inventory pins are stale; run refresh-gs002-asset-inventory-pins.mjs",
    );
    return {...plan, action: "verified"};
  }
  if (plan.changed) await atomicCasWrite(plan);
  return {...plan, action: plan.changed ? "written" : "unchanged"};
}

export function parseArguments(argv) {
  const options = {check: false, help: false};
  for (const value of argv) {
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function usage() {
  return `Usage: node scripts/refresh-gs002-asset-inventory-pins.mjs [--check]

Validates the current fail-closed GS002 structural manifest, bilingual
disposition, and migration pins, then refreshes only the two corresponding SHA
cells in asset-inventory.csv.`;
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) return console.log(usage());
    const result = await refreshGs002AssetInventoryPins(options);
    console.log(
      `${result.action}: ${INVENTORY_PATH}`
      + ` sha256=${result.sha256}`
      + ` technicalManifestSha256=${result.technicalManifestSha256}`,
    );
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) await main();
