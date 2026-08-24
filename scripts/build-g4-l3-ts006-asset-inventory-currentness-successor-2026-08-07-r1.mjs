#!/usr/bin/env node

import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {chmod, lstat, readFile, stat, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const GENERATOR =
  "scripts/build-g4-l3-ts006-asset-inventory-currentness-successor-2026-08-07-r1.mjs";
const INVENTORY = "migrations/course-g04-l03-ts-006/asset-inventory.csv";
const MANIFEST = "public/flash-assets/courses/course-g04-l03-ts-006/manifest.json";
const RUNTIME = "public/flash-assets/courses/course-g04-l03-ts-006/canvas-renderer.js";
const CANDIDATE = "reports/g4-l3-ts006-current-javascript-candidate.json";
const HISTORICAL_APPROVAL =
  "reports/g4-l3-current-javascript-output-human-approval-page-001.json";
const HISTORICAL_ADOPTION =
  "migrations/course-g04-l03-ts-006/evidence/current-javascript-implementation-capture-adoption.json";
const JSON_OUTPUT =
  "reports/g4-l3-ts006-asset-inventory-currentness-successor-2026-08-07-r1.json";
const MARKDOWN_OUTPUT =
  "reports/g4-l3-ts006-asset-inventory-currentness-successor-2026-08-07-r1.md";

const HEAD = "42e7f80ce70aaa3819af2f7158e15f5da5470cce";
const PREDECESSOR_INVENTORY = Object.freeze({
  path: INVENTORY,
  bytes: 1470,
  sha256: "916210a15c8e293d9de89b9e2f0c1ad725d411f43ebc4873084fdb2265ed90e7",
});
const SUCCESSOR_INVENTORY = Object.freeze({
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

function absolute(relativePath) {
  invariant(!path.isAbsolute(relativePath), `${relativePath}: absolute path rejected`);
  const resolved = path.resolve(ROOT, relativePath);
  invariant(resolved.startsWith(`${ROOT}${path.sep}`), `${relativePath}: path escapes root`);
  return resolved;
}

async function bind(relativePath, parseJson = false) {
  const resolved = absolute(relativePath);
  const before = await lstat(resolved);
  const physical = await stat(resolved);
  invariant(before.isFile() && !before.isSymbolicLink(), `${relativePath}: ordinary file required`);
  invariant(physical.nlink === 1, `${relativePath}: hard link rejected`);
  const bytes = await readFile(resolved);
  const after = await lstat(resolved);
  invariant(before.dev === after.dev && before.ino === after.ino && before.size === after.size, `${relativePath}: changed while read`);
  return {
    descriptor: {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)},
    bytes,
    value: parseJson ? JSON.parse(bytes.toString("utf8")) : null,
  };
}

function bindGitPredecessor() {
  const observedHead = execFileSync("/usr/bin/git", ["rev-parse", "HEAD"], {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
  invariant(observedHead === HEAD, "repository HEAD changed; a new successor is required");
  const bytes = execFileSync("/usr/bin/git", ["show", `${HEAD}:${INVENTORY}`], {
    cwd: ROOT,
    encoding: null,
    maxBuffer: 1024 * 1024,
  });
  invariant(bytes.length === PREDECESSOR_INVENTORY.bytes, "HEAD predecessor byte count changed");
  invariant(sha256(bytes) === PREDECESSOR_INVENTORY.sha256, "HEAD predecessor SHA-256 changed");
  return {head: HEAD, ...PREDECESSOR_INVENTORY};
}

export async function buildTs006AssetInventoryCurrentnessSuccessor() {
  const [generator, inventory, manifest, runtime, candidate, approval, adoption] =
    await Promise.all([
      bind(GENERATOR),
      bind(INVENTORY),
      bind(MANIFEST, true),
      bind(RUNTIME),
      bind(CANDIDATE, true),
      bind(HISTORICAL_APPROVAL, true),
      bind(HISTORICAL_ADOPTION, true),
    ]);
  const predecessor = bindGitPredecessor();
  invariant(
    inventory.descriptor.bytes === SUCCESSOR_INVENTORY.bytes &&
      inventory.descriptor.sha256 === SUCCESSOR_INVENTORY.sha256,
    "TS006 successor asset inventory is not current",
  );
  invariant(
    manifest.descriptor.sha256 === CURRENT_MANIFEST_SHA256 &&
      runtime.descriptor.sha256 === CURRENT_RUNTIME_SHA256,
    "TS006 current renderer outputs drifted",
  );
  const predecessorText = execFileSync(
    "/usr/bin/git",
    ["show", `${HEAD}:${INVENTORY}`],
    {cwd: ROOT, encoding: "utf8", maxBuffer: 1024 * 1024},
  );
  const successorText = inventory.bytes.toString("utf8");
  invariant(
    predecessorText.replace(OLD_MANIFEST_SHA256, CURRENT_MANIFEST_SHA256) ===
      successorText,
    "asset inventory changed beyond the one manifest SHA-256 field",
  );
  invariant(
    (predecessorText.match(new RegExp(OLD_MANIFEST_SHA256, "g")) ?? []).length === 1 &&
      (successorText.match(new RegExp(CURRENT_MANIFEST_SHA256, "g")) ?? []).length === 1,
    "manifest SHA-256 transition must occur exactly once",
  );
  invariant(
    candidate.value.reportType === "current-javascript-engineering-candidate" &&
      candidate.value.animationId === "course-g04-l03-ts-006" &&
      candidate.value.outputs?.canvasManifest?.sha256 === CURRENT_MANIFEST_SHA256 &&
      candidate.value.outputs?.canvasRuntime?.sha256 === CURRENT_RUNTIME_SHA256 &&
      Object.values(candidate.value.acceptance ?? {}).every((value) => value === false),
    "TS006 candidate output or acceptance boundary changed",
  );
  invariant(
    approval.value.schemaVersion === 3 &&
      approval.value.decision === "accepted" &&
      approval.value.reviewer === "Dr. Peter Hu" &&
      approval.bytes.includes(Buffer.from(OLD_MANIFEST_SHA256)),
    "historical TS006 current-JS approval binding changed",
  );
  invariant(
    adoption.value.evidenceType === "current-javascript-implementation-capture-adoption" &&
      adoption.value.status === "partial-non-authoritative-implementation-capture" &&
      adoption.value.strictAcceptanceEffect === "none",
    "historical TS006 capture adoption boundary changed",
  );

  return {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-asset-inventory-currentness-successor",
    issuedOn: "2026-08-07",
    status:
      "manifest-inventory-current-historical-approval-and-capture-retained-stale-no-acceptance",
    generator: generator.descriptor,
    predecessorInventory: predecessor,
    successorInventory: inventory.descriptor,
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
      currentJavascriptHumanApproval: approval.descriptor,
      implementationCaptureAdoption: adoption.descriptor,
      rewritten: false,
      currentnessInherited: false,
      disposition:
        "retained immutable historical evidence; current manifest/shared-runtime bytes require fresh capture and later human re-review",
    },
    nextMachineStep: {
      currentJavascriptRecaptureAllowed: true,
      adoptionIntoHistoricalApprovalAuthorized: false,
      freshOutputRootRequired: true,
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

function renderMarkdown(report) {
  return `# G4 L3 TS006 asset-inventory currentness successor r1\n\n` +
    `Status: **${report.status}**.\n\n` +
    `Exactly one CSV field changed: the \`ts006-source-static-canvas-manifest\` SHA-256 moved from \`${report.exactTransition.predecessor}\` to the current manifest \`${report.exactTransition.successor}\`. The runtime hash remains \`${report.currentRenderer.runtime.sha256}\`.\n\n` +
    `The 2026-07-27 schema-v3 current-JavaScript human approval and the prior 128-frame implementation capture adoption remain untouched historical evidence. They do not inherit currentness. A fresh current-JavaScript capture may be produced under a fresh output root, but it may not be adopted as renewed human approval by this successor.\n\n` +
    `No original-runtime, RMSE, audio, interaction, Replay, human, Owner, strict, or publication gate changes.\n`;
}

async function readIfPresent(relativePath) {
  try {
    return await readFile(absolute(relativePath));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export function parseMode(argv) {
  const allowed = new Set(["--json", "--check", "--write-no-clobber"]);
  invariant(argv.length === 1 && allowed.has(argv[0]), "choose exactly one explicit mode");
  return argv[0].slice(2);
}

async function emit(mode, report) {
  const jsonBytes = Buffer.from(stableJson(report));
  const markdownBytes = Buffer.from(renderMarkdown(report));
  if (mode === "json") {
    process.stdout.write(jsonBytes);
    return;
  }
  if (mode === "check") {
    const [actualJson, actualMarkdown] = await Promise.all([
      readIfPresent(JSON_OUTPUT),
      readIfPresent(MARKDOWN_OUTPUT),
    ]);
    invariant(actualJson?.equals(jsonBytes), `${JSON_OUTPUT} is stale or missing`);
    invariant(actualMarkdown?.equals(markdownBytes), `${MARKDOWN_OUTPUT} is stale or missing`);
    process.stdout.write("TS006 asset-inventory currentness successor: PASS\n");
    return;
  }
  invariant(mode === "write-no-clobber", `unsupported mode: ${mode}`);
  invariant(!(await readIfPresent(JSON_OUTPUT)), `${JSON_OUTPUT} already exists`);
  invariant(!(await readIfPresent(MARKDOWN_OUTPUT)), `${MARKDOWN_OUTPUT} already exists`);
  let jsonWritten = false;
  try {
    await writeFile(absolute(JSON_OUTPUT), jsonBytes, {flag: "wx", mode: 0o444});
    jsonWritten = true;
    await writeFile(absolute(MARKDOWN_OUTPUT), markdownBytes, {flag: "wx", mode: 0o444});
    await Promise.all([
      chmod(absolute(JSON_OUTPUT), 0o444),
      chmod(absolute(MARKDOWN_OUTPUT), 0o444),
    ]);
  } catch (error) {
    if (jsonWritten) await unlink(absolute(JSON_OUTPUT)).catch(() => {});
    throw error;
  }
  process.stdout.write(`wrote ${JSON_OUTPUT} and ${MARKDOWN_OUTPUT}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  buildTs006AssetInventoryCurrentnessSuccessor()
    .then((report) => emit(parseMode(process.argv.slice(2)), report))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
