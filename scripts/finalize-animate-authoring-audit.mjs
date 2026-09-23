#!/usr/bin/env node

import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_RAW_ROOT = path.join(ROOT, "work", "animate");
const DEFAULT_WORKING_COPY_ROOT = path.join(ROOT, "work", "animate", "read-only-fla-copies");
const AUDIT_SCRIPT = path.join(ROOT, "scripts", "animate-audit-current-document.jsfl");

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const options = { rawRoot: DEFAULT_RAW_ROOT, workingCopyRoot: DEFAULT_WORKING_COPY_ROOT, animationIds: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--raw-root") {
      options.rawRoot = path.resolve(argv[++index] || fail("--raw-root requires a path"));
    } else if (value === "--working-copy-root") {
      options.workingCopyRoot = path.resolve(argv[++index] || fail("--working-copy-root requires a path"));
    } else if (value === "--help" || value === "-h") {
      options.help = true;
    } else if (value.startsWith("-")) {
      fail(`Unknown option: ${value}`);
    } else {
      options.animationIds.push(value);
    }
  }
  return options;
}

function help() {
  return [
    "Usage: node scripts/finalize-animate-authoring-audit.mjs [--raw-root <dir>] [--working-copy-root <dir>] <animation-id> [...]",
    "",
    "Validates a cold-start Adobe Animate authoring audit and stores canonical, hashed",
    "evidence under migrations/<animation-id>/audit/. It never writes to source-assets/.",
  ].join("\n");
}

function decodeFileUri(uri) {
  if (!uri || !uri.startsWith("file:")) return "";
  return decodeURIComponent(uri).replace(/^file:\/\/(?:\/Macintosh HD)?/, "");
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function fileExists(filePath) {
  try {
    await readFile(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function pngDimensions(buffer, label) {
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    fail(`${label} is not a PNG`);
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function resolveInside(base, candidate, label) {
  const resolvedBase = path.resolve(base);
  const resolved = path.resolve(base, candidate);
  if (resolved !== resolvedBase && !resolved.startsWith(`${resolvedBase}${path.sep}`)) {
    fail(`${label} escapes ${resolvedBase}`);
  }
  return resolved;
}

async function writeOnceOrVerify(file, bytes, label) {
  if (await fileExists(file)) {
    const existing = await readFile(file);
    if (!existing.equals(bytes)) fail(`${label} already exists with different bytes: ${file}`);
    return;
  }
  await writeFile(file, bytes, { flag: "wx" });
}

async function archiveSupersededAudit({animationId, migrationDir, auditDir, outputPath, nextCanonicalBytes}) {
  if (!(await fileExists(outputPath))) return null;
  const existingBytes = await readFile(outputPath);
  if (existingBytes.equals(nextCanonicalBytes)) return {status: "already-current", archived: false};
  let existing;
  try {
    existing = JSON.parse(existingBytes.toString("utf8"));
  } catch (error) {
    fail(`${animationId}: existing canonical Animate audit is invalid JSON (${error.message})`);
  }
  if (existing.animationId !== animationId || existing.evidenceKind !== "adobe-animate-2021-cold-start-authoring-audit") {
    fail(`${animationId}: existing canonical Animate audit has an unexpected identity or evidence kind`);
  }
  const existingSha256 = sha256(existingBytes);
  const existingFrameRelative = existing.capturedAuthoringFrame?.file;
  const existingFrameSha256 = existing.capturedAuthoringFrame?.sha256;
  if (!existingFrameRelative || !existingFrameSha256) {
    fail(`${animationId}: existing canonical Animate audit does not bind its authoring frame`);
  }
  const existingFramePath = resolveInside(migrationDir, existingFrameRelative, `${animationId}: existing authoring frame`);
  const existingFrameBytes = await readFile(existingFramePath);
  if (sha256(existingFrameBytes) !== existingFrameSha256) {
    fail(`${animationId}: existing canonical authoring frame hash mismatch; refusing to overwrite evidence`);
  }
  const historyDir = path.join(auditDir, "history", existingSha256);
  await mkdir(historyDir, {recursive: true});
  const archivedCanonicalName = "adobe-animate-2021-authoring-audit.json";
  const archivedFrameName = path.basename(existingFramePath);
  await writeOnceOrVerify(path.join(historyDir, archivedCanonicalName), existingBytes, `${animationId}: archived canonical audit`);
  await writeOnceOrVerify(path.join(historyDir, archivedFrameName), existingFrameBytes, `${animationId}: archived authoring frame`);
  const archiveManifest = {
    schemaVersion: 1,
    evidenceKind: "superseded-adobe-animate-authoring-audit-archive",
    animationId,
    acceptanceEffect: "none",
    archivedCanonical: {file: archivedCanonicalName, sha256: existingSha256},
    archivedAuthoringFrame: {file: archivedFrameName, sha256: existingFrameSha256},
    supersededByCanonicalSha256: sha256(nextCanonicalBytes),
  };
  const archiveManifestBytes = Buffer.from(`${JSON.stringify(archiveManifest, null, 2)}\n`);
  const archiveManifestPath = path.join(historyDir, "archive-manifest.json");
  await writeOnceOrVerify(archiveManifestPath, archiveManifestBytes, `${animationId}: archive manifest`);
  return {
    status: "archived-superseded",
    archived: true,
    canonicalSha256: existingSha256,
    manifest: path.relative(migrationDir, archiveManifestPath).split(path.sep).join("/"),
    manifestSha256: sha256(archiveManifestBytes),
  };
}

function assertRecursiveAudit(report, animationId) {
  if (report.recursiveLibraryTimelineAudit !== true) {
    fail(`${animationId}: authoring audit predates the recursive library-timeline contract`);
  }
  const timelines = [report.timeline];
  for (const item of report.library || []) if (item.timeline) timelines.push(item.timeline);
  for (const timeline of timelines) {
    if (!timeline || !Array.isArray(timeline.layers)) {
      fail(`${animationId}: recursive authoring timeline is missing layers`);
    }
    for (const layer of timeline.layers) {
      if (!Array.isArray(layer.keyframes)) fail(`${animationId}: authoring layer is missing keyframes`);
      for (const frame of layer.keyframes) {
        if (!Array.isArray(frame.elements)) {
          fail(`${animationId}: authoring keyframe is missing recursive elements`);
        }
      }
    }
  }
}

async function finalizeOne(animationId, rawRoot, root = ROOT, workingCopyRoot = path.join(root, "work", "animate", "read-only-fla-copies")) {
  const migrationDir = path.join(root, "migrations", animationId);
  const migrationPath = path.join(migrationDir, "migration.json");
  const migration = await readJson(migrationPath);
  const flaRelative = migration.source?.fla;
  const expectedFlaHash = migration.source?.flaSha256;
  if (!flaRelative || !expectedFlaHash) {
    fail(`${animationId}: migration.json does not declare source.fla and source.flaSha256`);
  }

  const flaPath = path.join(root, flaRelative);
  const flaBytes = await readFile(flaPath);
  const actualFlaHash = sha256(flaBytes);
  if (actualFlaHash !== expectedFlaHash) {
    fail(`${animationId}: source FLA hash mismatch (${actualFlaHash} != ${expectedFlaHash})`);
  }

  const flaName = path.basename(flaPath);
  const reportPath = path.join(rawRoot, `${flaName}-authoring-audit.json`);
  const reportBytes = await readFile(reportPath);
  const report = JSON.parse(reportBytes.toString("utf8"));
  const decodedReportDocumentPath = decodeFileUri(report.document?.pathURI);
  const reportPathName = path.basename(decodedReportDocumentPath);

  if (report.schemaVersion !== 1) {
    fail(`${animationId}: unexpected raw audit schemaVersion ${report.schemaVersion}`);
  }
  if (report.evidenceKind !== "adobe-animate-authoring-audit") {
    fail(`${animationId}: unexpected evidenceKind ${report.evidenceKind}`);
  }
  if (report.document?.name !== flaName || reportPathName !== flaName) {
    fail(`${animationId}: authoring audit belongs to ${report.document?.name || reportPathName}, not ${flaName}`);
  }

  const expectedWorkingCopy = path.join(workingCopyRoot, animationId, flaName);
  if (!(await fileExists(expectedWorkingCopy))) {
    fail(`${animationId}: required read-only working copy is missing: ${expectedWorkingCopy}`);
  }
  const reportDocumentPath = path.resolve(decodedReportDocumentPath);
  if (reportDocumentPath !== path.resolve(expectedWorkingCopy)) {
    fail(`${animationId}: authoring audit must come from the read-only working copy ${expectedWorkingCopy}, not ${reportDocumentPath}`);
  }
  const workingCopyBytes = await readFile(expectedWorkingCopy);
  const workingCopySha256 = sha256(workingCopyBytes);
  if (workingCopySha256 !== actualFlaHash) {
    fail(`${animationId}: working-copy FLA hash mismatch (${workingCopySha256} != ${actualFlaHash}); close without saving and recreate the copy`);
  }
  const workingCopyStat = await stat(expectedWorkingCopy);
  if ((workingCopyStat.mode & 0o222) !== 0) {
    fail(`${animationId}: working-copy FLA is writable; make it read-only before opening Animate`);
  }
  const workingCopy = {
    path: path.relative(root, expectedWorkingCopy).split(path.sep).join("/"),
    sha256: workingCopySha256,
    bytes: workingCopyStat.size,
    readOnlyAtFinalize: true,
    byteIdenticalToSourceAtFinalize: true,
  };

  assertRecursiveAudit(report, animationId);
  const auditScriptBytes = await readFile(path.join(root, path.relative(ROOT, AUDIT_SCRIPT)));
  const auditScriptSha256 = sha256(auditScriptBytes);

  const expectedRuntime = migration.runtime || {};
  const checks = [
    ["width", report.document?.width, expectedRuntime.stage?.width],
    ["height", report.document?.height, expectedRuntime.stage?.height],
    ["fps", report.document?.frameRate, expectedRuntime.fps],
    ["frameCount", report.timeline?.frameCount, expectedRuntime.frameCount],
  ];
  for (const [label, actual, expected] of checks) {
    if (actual !== expected) {
      fail(`${animationId}: ${label} mismatch (${actual} != ${expected})`);
    }
  }

  const capturedFrame = report.timeline?.currentFlashFrame;
  if (!Number.isInteger(capturedFrame) || capturedFrame < 1 || capturedFrame > report.timeline.frameCount) {
    fail(`${animationId}: invalid currentFlashFrame ${capturedFrame}`);
  }
  const rawPngName = `${flaName}-frame-${capturedFrame}.png`;
  const rawPngPath = path.join(rawRoot, rawPngName);
  const rawPng = await readFile(rawPngPath);
  const rawPngDimensions = pngDimensions(rawPng, `${animationId}: ${rawPngName}`);
  if (rawPngDimensions.width !== report.document.width || rawPngDimensions.height !== report.document.height) {
    fail(`${animationId}: authoring PNG dimensions ${rawPngDimensions.width}x${rawPngDimensions.height} do not match native stage ${report.document.width}x${report.document.height}`);
  }

  const auditDir = path.join(migrationDir, "audit");
  await mkdir(auditDir, { recursive: true });
  const frameName = `adobe-animate-2021-authoring-frame-${String(capturedFrame).padStart(4, "0")}.png`;
  const framePath = path.join(auditDir, frameName);

  const canonical = {
    schemaVersion: 2,
    evidenceKind: "adobe-animate-2021-cold-start-authoring-audit",
    authority: "Original owner-provided FLA inspected read-only in Adobe Animate 2021",
    animationId,
    capturedAt: report.capturedAt,
    animateVersion: report.animateVersion,
    protocol: {
      coldStartPerFla: true,
      openedWithoutSaving: true,
      originalSourceHashVerified: true,
      readOnlyWorkingCopyRequired: true,
      readOnlyWorkingCopyPathVerified: true,
      readOnlyWorkingCopyHashVerifiedAtFinalize: true,
      readOnlyWorkingCopyPermissionsVerifiedAtFinalize: true,
      recursiveLibraryTimelineAuditRequired: true,
      recursiveLibraryTimelineAuditVerified: true,
      reason: "Animate 2021 can reuse the first legacy FLA document state when multiple ActionScript 1 documents are opened in one process.",
    },
    auditScript: {
      file: "scripts/animate-audit-current-document.jsfl",
      sha256: auditScriptSha256,
    },
    source: {
      fla: flaRelative,
      flaSha256: actualFlaHash,
      workingCopy,
    },
    nativeMovie: {
      width: report.document.width,
      height: report.document.height,
      fps: report.document.frameRate,
      frameCount: report.timeline.frameCount,
      backgroundColor: report.document.backgroundColor,
      rootLayerCount: report.timeline.layerCount,
      libraryItemCount: report.document.libraryItemCount,
    },
    capturedAuthoringFrame: {
      flashFrame: capturedFrame,
      file: `audit/${frameName}`,
      sha256: sha256(rawPng),
      width: rawPngDimensions.width,
      height: rawPngDimensions.height,
    },
    rawAuditSha256: sha256(reportBytes),
    authoringAudit: report,
    limitations: [
      "Animate 2021 converts this unsupported ActionScript 1 document to ActionScript 3 in memory and may remove attached ActionScript 1 code.",
      "The original shipped SWF bytecode and Adobe Flash Player runtime capture remain authoritative for runtime behavior.",
      "This authoring-stage capture does not prove host variables, interaction branches, localization selection, audio synchronization, or Replay behavior.",
    ],
  };

  const outputPath = path.join(auditDir, "adobe-animate-2021-authoring-audit.json");
  const canonicalBytes = Buffer.from(`${JSON.stringify(canonical, null, 2)}\n`);
  const historyArchive = await archiveSupersededAudit({
    animationId,
    migrationDir,
    auditDir,
    outputPath,
    nextCanonicalBytes: canonicalBytes,
  });
  await copyFile(rawPngPath, framePath);
  await writeFile(outputPath, canonicalBytes);
  return {
    animationId,
    output: path.relative(root, outputPath),
    frame: path.relative(root, framePath),
    flaSha256: actualFlaHash,
    frameSha256: canonical.capturedAuthoringFrame.sha256,
    frameCount: canonical.nativeMovie.frameCount,
    canonicalSha256: sha256(canonicalBytes),
    historyArchive,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(help());
    return;
  }
  if (options.animationIds.length === 0) {
    fail("At least one animation-id is required. Use --help for usage.");
  }
  const rawFiles = await readdir(options.rawRoot);
  if (rawFiles.length === 0) fail(`Raw audit directory is empty: ${options.rawRoot}`);
  const results = [];
  for (const animationId of options.animationIds) {
    results.push(await finalizeOne(animationId, options.rawRoot, ROOT, options.workingCopyRoot));
  }
  console.log(JSON.stringify({ finalized: results.length, results }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

export { archiveSupersededAudit, assertRecursiveAudit, finalizeOne, parseArgs, pngDimensions, sha256 };
