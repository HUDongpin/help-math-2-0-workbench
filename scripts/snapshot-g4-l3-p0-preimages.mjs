#!/usr/bin/env node

import {createHash} from "node:crypto";
import {chmod, lstat, mkdir, open, readFile, readdir} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const outputRelative = "reports/g4-l3-p0-preimage-snapshot-2026-07-29.json";

const fixedTargets = [
  "reports/g4-l3-ts006-current-javascript-candidate.json",
  "reports/g4-l3-ts006-current-javascript-candidate.md",
  "reports/g4-l3-current-javascript-progress.json",
  "reports/g4-l3-current-javascript-progress.md",
  "reports/g4-l3-current-javascript-product-qa.json",
  "reports/g4-l3-current-javascript-product-qa.md",
  "reports/g4-l3-controlled-ceo-preview-qa.json",
  "reports/g4-l3-controlled-ceo-preview-qa.md",
  "reports/g4-l3-lesson-product-navigation-contract.json",
  "reports/g4-l3-lesson-product-navigation-contract.md",
  "reports/g4-l3-shell-current-javascript-contract.json",
  "reports/g4-l3-shell-current-javascript-contract.md",
  "reports/g4-l3-shell-pending-full-frame-coverage.json",
  "reports/g4-l3-shell-pending-full-frame-coverage.md",
  "reports/g4-l3-shell-strict-readiness.json",
  "reports/g4-l3-shell-strict-readiness.md",
  "reports/g4-l3-frame-domain-planning-closure.json",
  "reports/g4-l3-frame-domain-planning-closure.md",
  "reports/g4-l3-renderer-frame-domain-support-index.json",
  "reports/g4-l3-renderer-gap-closure.json",
  "reports/g4-l3-renderer-gap-closure.md",
  "catalog/completion-ledger.json",
  "catalog/lesson-release-ledger.json",
  "reports/g4-l3-renderer-live-drift-successor-2026-07-29.json",
  "reports/g4-l3-renderer-live-drift-successor-2026-07-29-v2.json",
  "reports/g4-l3-v2-execution-checkpoint.json",
  "reports/g4-l3-v2-execution-checkpoint.md",
];

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function projectPath(relativePath) {
  const resolved = path.resolve(projectRoot, relativePath);
  const rel = path.relative(projectRoot, resolved);
  if (rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new Error(`Path escapes project: ${relativePath}`);
  }
  return resolved;
}

async function rendererTargets() {
  const migrationRoot = projectPath("migrations");
  const entries = await readdir(migrationRoot, {withFileTypes: true});
  return entries
    .filter((entry) => entry.isDirectory()
      && (entry.name.startsWith("course-g04-l03-") || entry.name === "shell-course-g04-l03-index-local"))
    .map((entry) => `migrations/${entry.name}/audit/renderer-frame-domain-support.json`)
    .sort();
}

async function inspect(relativePath) {
  const absolutePath = projectPath(relativePath);
  const metadata = await lstat(absolutePath).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!metadata) return {path: relativePath, exists: false};
  const identity = {
    path: relativePath,
    exists: true,
    kind: metadata.isFile() ? "file" : metadata.isSymbolicLink() ? "symlink" : "other",
    bytes: metadata.size,
    device: metadata.dev,
    inode: metadata.ino,
    linkCount: metadata.nlink,
    mode: metadata.mode & 0o777,
  };
  if (metadata.isFile()) identity.sha256 = sha256(await readFile(absolutePath));
  return identity;
}

async function main() {
  if (process.argv.length !== 2) {
    throw new Error("Usage: node scripts/snapshot-g4-l3-p0-preimages.mjs");
  }
  const targets = [...new Set([...fixedTargets, ...await rendererTargets()])].sort();
  const snapshot = {
    schemaVersion: 1,
    reportType: "g4-l3-p0-preimage-snapshot",
    capturedAt: new Date().toISOString(),
    scope: "P0 current-JavaScript, shell, renderer, ledger, and checkpoint fixed-point rebuild",
    mutationEffect: "none-on-snapshotted-targets",
    targetCount: targets.length,
    targets: await Promise.all(targets.map(inspect)),
    note: "This append-only snapshot records pre-build path, byte, hash, inode, link-count, and mode identities. It grants no fidelity, human, owner, strict-completion, publication, or capture authority.",
  };
  const fingerprintPayload = JSON.stringify(snapshot);
  snapshot.snapshotFingerprintSha256 = sha256(fingerprintPayload);
  const bytes = Buffer.from(`${JSON.stringify(snapshot, null, 2)}\n`);
  const output = projectPath(outputRelative);
  await mkdir(path.dirname(output), {recursive: true});
  const handle = await open(output, "wx", 0o444);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await chmod(output, 0o444);
  process.stdout.write(`wrote ${outputRelative}: ${snapshot.targetCount} preimage identities\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
