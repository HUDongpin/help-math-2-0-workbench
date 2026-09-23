#!/usr/bin/env node

import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {chmod, lstat, readFile, stat, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

export const TS006_ASSET_INVENTORY_SUCCESSOR_R2 = Object.freeze({
  jsonPath: "reports/g4-l3-ts006-asset-inventory-currentness-successor-2026-08-08-r2.json",
  markdownPath: "reports/g4-l3-ts006-asset-inventory-currentness-successor-2026-08-08-r2.md",
});

const HEAD = "42e7f80ce70aaa3819af2f7158e15f5da5470cce";
const INVENTORY = "migrations/course-g04-l03-ts-006/asset-inventory.csv";
const MANIFEST = "public/flash-assets/courses/course-g04-l03-ts-006/manifest.json";
const RUNTIME = "public/flash-assets/courses/course-g04-l03-ts-006/canvas-renderer.js";
const CANDIDATE = "reports/g4-l3-ts006-current-javascript-candidate.json";
const HISTORICAL_PRODUCT_QA =
  "migrations/course-g04-l03-ts-006/evidence/spanish-host-audio-current-js-product-qa.json";
const PREDECESSOR_R1 = Object.freeze({
  json: Object.freeze({
    path: "reports/g4-l3-ts006-asset-inventory-currentness-successor-2026-08-07-r1.json",
    sha256: "4b49ef2bfc76a438db401eeaaefe6d97ff75a1f3db64320dfdd030a0a7271ef3",
  }),
  markdown: Object.freeze({
    path: "reports/g4-l3-ts006-asset-inventory-currentness-successor-2026-08-07-r1.md",
    sha256: "33310805f463ac6ce7b0ec390db4bd99bc494b19db71ec6d2c4e7573155de162",
  }),
});
const PREDECESSOR_INVENTORY = Object.freeze({
  path: INVENTORY,
  bytes: 1470,
  sha256: "916210a15c8e293d9de89b9e2f0c1ad725d411f43ebc4873084fdb2265ed90e7",
});
const CURRENT_INVENTORY = Object.freeze({
  path: INVENTORY,
  bytes: 1470,
  sha256: "3838911e74007727a277223c1dbbf7b2d09d21ea9fb10f024582d92e8d98b9cd",
});
const OLD_MANIFEST_SHA256 =
  "eea637df94f8c7e9ba149138bcf05426e4f8fec1fc894e2703dc4a9b39a626a0";
const CURRENT_MANIFEST_SHA256 =
  "424fb84965b48be6b7ddcd25ed770cac4d9e4e6db7c8e2d599daa295f12222aa";
const CURRENT_RUNTIME_SHA256 =
  "162d67f65d72f307d27339d7a5f4d7945936b47854cc0fa8b6055455ac843252";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function absolute(root, relativePath) {
  invariant(!path.isAbsolute(relativePath), `${relativePath}: absolute path rejected`);
  const resolved = path.resolve(root, relativePath);
  invariant(resolved.startsWith(`${root}${path.sep}`), `${relativePath}: path escapes project root`);
  return resolved;
}

async function bind(root, relativePath, {parseJson = false} = {}) {
  const resolved = absolute(root, relativePath);
  const before = await lstat(resolved);
  const physical = await stat(resolved);
  invariant(before.isFile() && !before.isSymbolicLink(), `${relativePath}: ordinary file required`);
  invariant(physical.nlink === 1, `${relativePath}: hard link rejected`);
  const content = await readFile(resolved);
  const after = await lstat(resolved);
  invariant(
    before.dev === after.dev && before.ino === after.ino && before.size === after.size,
    `${relativePath}: changed while read`,
  );
  return {
    descriptor: {path: relativePath, bytes: content.length, sha256: sha256(content)},
    content,
    value: parseJson ? JSON.parse(content.toString("utf8")) : undefined,
  };
}

function bindHeadInventory(root) {
  const observedHead = execFileSync("/usr/bin/git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  invariant(observedHead === HEAD, "repository HEAD changed; a new successor is required");
  const content = execFileSync("/usr/bin/git", ["show", `${HEAD}:${INVENTORY}`], {
    cwd: root,
    encoding: null,
    maxBuffer: 1024 * 1024,
  });
  const descriptor = {path: INVENTORY, bytes: content.length, sha256: sha256(content)};
  invariant(
    descriptor.bytes === PREDECESSOR_INVENTORY.bytes
      && descriptor.sha256 === PREDECESSOR_INVENTORY.sha256,
    "HEAD predecessor inventory changed",
  );
  return {head: HEAD, descriptor, content};
}

export function applyExactManifestTransition(predecessorText) {
  const oldOccurrences = (predecessorText.match(new RegExp(OLD_MANIFEST_SHA256, "g")) ?? []).length;
  invariant(oldOccurrences === 1, "predecessor inventory must contain the prior manifest SHA-256 exactly once");
  const nextText = predecessorText.replace(OLD_MANIFEST_SHA256, CURRENT_MANIFEST_SHA256);
  const nextOccurrences = (nextText.match(new RegExp(CURRENT_MANIFEST_SHA256, "g")) ?? []).length;
  invariant(nextOccurrences === 1, "successor inventory must contain the current manifest SHA-256 exactly once");
  return nextText;
}

function allAcceptanceFalse(acceptance) {
  return acceptance
    && typeof acceptance === "object"
    && !Array.isArray(acceptance)
    && Object.values(acceptance).every((value) => value === false);
}

export async function buildTs006AssetInventoryCurrentnessSuccessorR2({projectRoot = PROJECT_ROOT} = {}) {
  const root = path.resolve(projectRoot);
  const [r1Json, r1Markdown, inventory, manifest, runtime, candidate, historicalProductQa] =
    await Promise.all([
      bind(root, PREDECESSOR_R1.json.path, {parseJson: true}),
      bind(root, PREDECESSOR_R1.markdown.path),
      bind(root, INVENTORY),
      bind(root, MANIFEST, {parseJson: true}),
      bind(root, RUNTIME),
      bind(root, CANDIDATE, {parseJson: true}),
      bind(root, HISTORICAL_PRODUCT_QA, {parseJson: true}),
    ]);
  const predecessor = bindHeadInventory(root);

  invariant(r1Json.descriptor.sha256 === PREDECESSOR_R1.json.sha256, "r1 JSON predecessor byte identity changed");
  invariant(r1Markdown.descriptor.sha256 === PREDECESSOR_R1.markdown.sha256, "r1 Markdown predecessor byte identity changed");
  invariant(
    r1Json.value?.successorInventory?.sha256 === CURRENT_INVENTORY.sha256
      && r1Json.value?.exactTransition?.predecessor === OLD_MANIFEST_SHA256
      && r1Json.value?.exactTransition?.successor === CURRENT_MANIFEST_SHA256,
    "r1 predecessor does not describe the expected inventory transition",
  );
  invariant(
    inventory.descriptor.bytes === CURRENT_INVENTORY.bytes
      && inventory.descriptor.sha256 === CURRENT_INVENTORY.sha256,
    "TS006 r2 inventory is not the exact current successor",
  );
  invariant(
    applyExactManifestTransition(predecessor.content.toString("utf8")) === inventory.content.toString("utf8"),
    "asset inventory changed beyond the exact manifest SHA-256 transition",
  );
  invariant(
    manifest.descriptor.sha256 === CURRENT_MANIFEST_SHA256
      && runtime.descriptor.sha256 === CURRENT_RUNTIME_SHA256,
    "current TS006 renderer outputs drifted",
  );
  invariant(
    candidate.value?.reportType === "current-javascript-engineering-candidate"
      && candidate.value?.animationId === "course-g04-l03-ts-006"
      && candidate.value?.outputs?.canvasManifest?.sha256 === CURRENT_MANIFEST_SHA256
      && candidate.value?.outputs?.canvasRuntime?.sha256 === CURRENT_RUNTIME_SHA256
      && allAcceptanceFalse(candidate.value?.acceptance),
    "TS006 candidate output or acceptance boundary changed",
  );
  invariant(
    historicalProductQa.value?.bindings?.assetInventory?.sha256 === PREDECESSOR_INVENTORY.sha256,
    "historical product QA no longer binds the retained predecessor inventory",
  );

  return {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-asset-inventory-currentness-successor",
    issuedOn: "2026-08-08",
    revision: "r2",
    status: "exact-inventory-transition-current-r1-retained-historical-product-qa-stale-acceptance-neutral",
    generator: await bind(root, "scripts/build-g4-l3-ts006-asset-inventory-currentness-successor-2026-08-08-r2.mjs").then((entry) => entry.descriptor),
    predecessor: {
      r1: {
        json: r1Json.descriptor,
        markdown: r1Markdown.descriptor,
        disposition: "retained immutable predecessor; r2 does not modify or backdate r1",
      },
      headInventory: {head: predecessor.head, ...predecessor.descriptor},
    },
    currentInventory: inventory.descriptor,
    exactTransition: {
      changedFieldCount: 1,
      assetId: "ts006-source-static-canvas-manifest",
      field: "sha256",
      predecessor: OLD_MANIFEST_SHA256,
      successor: CURRENT_MANIFEST_SHA256,
      otherInventoryBytesChanged: false,
    },
    currentRenderer: {
      manifest: manifest.descriptor,
      runtime: runtime.descriptor,
      candidateReport: candidate.descriptor,
    },
    historicalEvidence: {
      productQa: {
        ...historicalProductQa.descriptor,
        currentnessInherited: false,
        disposition: "retained historical current-JavaScript QA bound to the predecessor inventory; it is not refreshed by r2",
      },
      r1CurrentnessOutput: {
        currentnessInherited: false,
        disposition: "retained predecessor only; r2 is the current transition receipt",
      },
    },
    nextMachineStep: {
      freshCurrentJavascriptCaptureRequired: true,
      historicalHumanApprovalRenewed: false,
      originalRuntimeRequiredForThisMachineStep: false,
    },
    acceptanceEffects: {
      implementationAccepted: false,
      authoritativeOriginalRuntime: false,
      fullFrameRmseAccepted: false,
      audioAccepted: false,
      interactionAccepted: false,
      replayAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
  };
}

export function renderTs006AssetInventoryCurrentnessSuccessorR2Markdown(report) {
  return `# G4 L3 TS006 asset-inventory currentness successor r2\n\n`
    + `Status: **${report.status}**.\n\n`
    + `R2 preserves the r1 JSON and Markdown byte-for-byte, then independently binds the live one-field CSV transition from the Git-head manifest SHA-256 \`${report.exactTransition.predecessor}\` to the current renderer manifest SHA-256 \`${report.exactTransition.successor}\`. The Canvas runtime remains hash-bound at \`${report.currentRenderer.runtime.sha256}\`.\n\n`
    + `The prior product-QA file remains a retained historical record bound to the predecessor inventory. R2 does not relabel it as current, renew any human approval, or authorize a capture adoption. A new current-JavaScript capture is still required under a fresh output root.\n\n`
    + `No original-runtime, RMSE, audio, interaction, Replay, human, Owner, strict-completion, release, or publication gate changes.\n`;
}

export function parseMode(argv) {
  const allowed = new Set(["--json", "--check", "--write-no-clobber"]);
  invariant(argv.length === 1 && allowed.has(argv[0]), "choose exactly one explicit mode");
  return argv[0];
}

async function readIfPresent(root, relativePath) {
  try {
    return await readFile(absolute(root, relativePath));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function writeOutputs(root, artifacts) {
  const jsonPath = absolute(root, TS006_ASSET_INVENTORY_SUCCESSOR_R2.jsonPath);
  const markdownPath = absolute(root, TS006_ASSET_INVENTORY_SUCCESSOR_R2.markdownPath);
  invariant(!(await readIfPresent(root, TS006_ASSET_INVENTORY_SUCCESSOR_R2.jsonPath)), "r2 JSON output already exists");
  invariant(!(await readIfPresent(root, TS006_ASSET_INVENTORY_SUCCESSOR_R2.markdownPath)), "r2 Markdown output already exists");
  let jsonWritten = false;
  try {
    await writeFile(jsonPath, artifacts.json, {flag: "wx", mode: 0o444});
    jsonWritten = true;
    await writeFile(markdownPath, artifacts.markdown, {flag: "wx", mode: 0o444});
    await Promise.all([chmod(jsonPath, 0o444), chmod(markdownPath, 0o444)]);
  } catch (error) {
    if (jsonWritten) await unlink(jsonPath).catch(() => {});
    throw error;
  }
}

async function checkOutputs(root, artifacts) {
  const [json, markdown] = await Promise.all([
    readIfPresent(root, TS006_ASSET_INVENTORY_SUCCESSOR_R2.jsonPath),
    readIfPresent(root, TS006_ASSET_INVENTORY_SUCCESSOR_R2.markdownPath),
  ]);
  invariant(json?.equals(artifacts.json), "r2 JSON output is stale or missing");
  invariant(markdown?.equals(artifacts.markdown), "r2 Markdown output is stale or missing");
}

async function main() {
  const mode = parseMode(process.argv.slice(2));
  const report = await buildTs006AssetInventoryCurrentnessSuccessorR2();
  const artifacts = {
    json: Buffer.from(stableJson(report)),
    markdown: Buffer.from(renderTs006AssetInventoryCurrentnessSuccessorR2Markdown(report)),
  };
  if (mode === "--json") {
    process.stdout.write(artifacts.json);
  } else if (mode === "--check") {
    await checkOutputs(PROJECT_ROOT, artifacts);
    process.stdout.write("TS006 asset-inventory currentness successor r2: PASS\n");
  } else {
    await writeOutputs(PROJECT_ROOT, artifacts);
    process.stdout.write(
      `wrote ${TS006_ASSET_INVENTORY_SUCCESSOR_R2.jsonPath} and ${TS006_ASSET_INVENTORY_SUCCESSOR_R2.markdownPath}\n`,
    );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
