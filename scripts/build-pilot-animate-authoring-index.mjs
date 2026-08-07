#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readdir, readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {PILOT_MIGRATIONS} from "./scaffold-pilot-migrations.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEFAULT_JSON = path.join(ROOT, "reports", "pilot-animate-authoring-audit.json");
const DEFAULT_MARKDOWN = path.join(ROOT, "reports", "pilot-animate-authoring-audit.md");

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function readJson(file, label = file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    throw new Error(`${label}: ${error.message}`);
  }
}

async function readHashedJson(file, label = file) {
  const bytes = await readFile(file);
  try {
    return {bytes, sha256: sha256(bytes), value: JSON.parse(bytes.toString("utf8"))};
  } catch (error) {
    throw new Error(`${label}: ${error.message}`);
  }
}

function projectRelative(root, file) {
  const relative = path.relative(root, file);
  invariant(relative && !relative.startsWith("..") && !path.isAbsolute(relative), `Path escapes project root: ${file}`);
  return relative.split(path.sep).join("/");
}

function pngDimensions(bytes, label) {
  invariant(bytes.length >= 24 && bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a", `${label}: not a PNG`);
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

function summarizeAuthoringAudit(audit) {
  const layers = audit.authoringAudit?.timeline?.layers || [];
  const keyframes = layers.flatMap((layer) => layer.keyframes || []);
  const library = audit.authoringAudit?.library || [];
  const libraryTypes = {};
  for (const item of library) libraryTypes[item.itemType || "unknown"] = (libraryTypes[item.itemType || "unknown"] || 0) + 1;
  return {
    rootLayerCount: layers.length,
    rootKeyframeCount: keyframes.length,
    rootActionScriptKeyframeCount: keyframes.filter(({actionScriptLength}) => Number(actionScriptLength) > 0).length,
    rootSoundKeyframeCount: keyframes.filter(({soundName}) => Boolean(soundName)).length,
    maskLayerCount: layers.filter(({layerType}) => layerType === "mask" || layerType === "masked").length,
    libraryItemCount: library.length,
    libraryTypes,
    replayLibraryItems: library.filter(({name}) => /replay/i.test(name || "")).map(({name, itemType}) => ({name, itemType})),
  };
}

async function findLatestPassingProbe(root) {
  const probeRoot = path.join(root, "work", "animate", "jsfl-cli-probes");
  if (!(await exists(probeRoot))) return null;
  const entries = await readdir(probeRoot, {withFileTypes: true});
  const candidates = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const file = path.join(probeRoot, entry.name, "probe-result.json");
    if (!(await exists(file))) continue;
    const document = await readHashedJson(file, `Animate probe ${entry.name}`);
    if (document.value.status !== "passed") continue;
    const capturedAt = document.value.artifacts?.report?.capturedAt;
    const timestamp = Date.parse(capturedAt || "");
    if (!Number.isFinite(timestamp)) continue;
    candidates.push({file, document, timestamp});
  }
  candidates.sort((left, right) => right.timestamp - left.timestamp || left.file.localeCompare(right.file));
  if (!candidates.length) return null;
  const selected = candidates[0];
  const probe = selected.document.value;
  const references = [probe.scripts?.auditTemplate, probe.artifacts?.report, probe.artifacts?.png].filter(Boolean);
  for (const reference of references) {
    const file = path.resolve(root, reference.file);
    const bytes = await readFile(file);
    invariant(sha256(bytes) === reference.sha256, `Animate probe referenced file changed: ${reference.file}`);
  }
  return {
    status: probe.status,
    scope: probe.scope,
    animateVersion: probe.artifacts.report.animateVersion,
    executable: probe.command.executable,
    executableSha256: probe.command.executableSha256,
    capturedAt: probe.artifacts.report.capturedAt,
    receipt: {
      file: projectRelative(root, selected.file),
      sha256: selected.document.sha256,
    },
    auditScript: probe.scripts.auditTemplate,
    limitations: probe.limitations,
  };
}

async function inspectPilot(root, pilot) {
  const migrationDir = path.join(root, "migrations", pilot.id);
  const migrationFile = path.join(migrationDir, "migration.json");
  const migrationDocument = await readHashedJson(migrationFile, `${pilot.id} migration.json`);
  const migration = migrationDocument.value;
  invariant(migration.animationId === pilot.id || migration.id === pilot.id, `${pilot.id}: migration identity mismatch`);
  invariant(migration.source?.swf === pilot.swf, `${pilot.id}: SWF path differs from pilot registry`);

  const swfBytes = await readFile(path.resolve(root, pilot.swf));
  invariant(sha256(swfBytes) === migration.source.swfSha256, `${pilot.id}: SWF hash mismatch`);

  if (!pilot.fla) {
    invariant(!migration.source?.fla, `${pilot.id}: registry says SWF-only but manifest declares an FLA`);
    return {
      animationId: pilot.id,
      sourceKind: "swf-only",
      status: "not-applicable-swf-only",
      migration: {file: projectRelative(root, migrationFile), sha256: migrationDocument.sha256},
      swf: {file: pilot.swf, sha256: migration.source.swfSha256},
      fla: null,
      authoringAudit: null,
      strictAcceptanceEffect: false,
    };
  }

  invariant(migration.source?.fla === pilot.fla, `${pilot.id}: FLA path differs from pilot registry`);
  const flaFile = path.resolve(root, pilot.fla);
  const flaBytes = await readFile(flaFile);
  const flaSha256 = sha256(flaBytes);
  invariant(flaSha256 === migration.source.flaSha256, `${pilot.id}: FLA hash mismatch`);

  const workingCopyFile = path.join(root, "work", "animate", "read-only-fla-copies", pilot.id, path.basename(pilot.fla));
  let workingCopy = null;
  if (await exists(workingCopyFile)) {
    const copyBytes = await readFile(workingCopyFile);
    const copyStat = await stat(workingCopyFile);
    const copySha256 = sha256(copyBytes);
    invariant(copySha256 === flaSha256, `${pilot.id}: read-only working copy differs from source FLA`);
    invariant((copyStat.mode & 0o222) === 0, `${pilot.id}: working copy is writable`);
    workingCopy = {
      file: projectRelative(root, workingCopyFile),
      sha256: copySha256,
      bytes: copyStat.size,
      readOnly: true,
      byteIdenticalToSource: true,
    };
  }

  const auditFile = path.join(migrationDir, "audit", "adobe-animate-2021-authoring-audit.json");
  if (!(await exists(auditFile))) {
    return {
      animationId: pilot.id,
      sourceKind: "fla-and-swf",
      status: "pending-human-assisted-legacy-open",
      migration: {file: projectRelative(root, migrationFile), sha256: migrationDocument.sha256},
      swf: {file: pilot.swf, sha256: migration.source.swfSha256},
      fla: {file: pilot.fla, sha256: flaSha256},
      workingCopy,
      authoringAudit: null,
      missingEvidence: [projectRelative(root, auditFile)],
      nextAction: workingCopy
        ? "Open the pinned read-only FLA in a fresh Animate process, acknowledge the legacy conversion warning, run the pinned JSFL command, close without saving, then finalize."
        : "Create and verify a read-only byte-identical FLA working copy before opening Animate.",
      strictAcceptanceEffect: false,
    };
  }

  const auditDocument = await readHashedJson(auditFile, `${pilot.id} Animate authoring audit`);
  const audit = auditDocument.value;
  invariant(audit.schemaVersion === 1 || audit.schemaVersion === 2, `${pilot.id}: unsupported Animate audit schema`);
  invariant(audit.evidenceKind === "adobe-animate-2021-cold-start-authoring-audit", `${pilot.id}: wrong Animate evidence kind`);
  invariant(audit.animationId === pilot.id, `${pilot.id}: Animate audit identity mismatch`);
  invariant(audit.source?.fla === pilot.fla && audit.source?.flaSha256 === flaSha256, `${pilot.id}: Animate audit FLA binding mismatch`);
  invariant(audit.authoringAudit?.evidenceKind === "adobe-animate-authoring-audit", `${pilot.id}: embedded authoring audit missing`);
  invariant(path.basename(audit.authoringAudit.document?.pathURI || "") === path.basename(pilot.fla), `${pilot.id}: Animate document basename mismatch`);

  const native = audit.nativeMovie;
  const runtime = migration.runtime;
  const metadataMatch = native?.width === runtime?.stage?.width
    && native?.height === runtime?.stage?.height
    && native?.fps === runtime?.fps
    && native?.frameCount === runtime?.frameCount;
  invariant(metadataMatch, `${pilot.id}: FLA authoring metadata differs from shipped runtime manifest`);

  const frameFile = path.join(migrationDir, audit.capturedAuthoringFrame.file);
  const frameBytes = await readFile(frameFile);
  const frameSha256 = sha256(frameBytes);
  invariant(frameSha256 === audit.capturedAuthoringFrame.sha256, `${pilot.id}: authoring PNG hash mismatch`);
  const frameDimensions = pngDimensions(frameBytes, `${pilot.id} authoring PNG`);
  invariant(frameDimensions.width === native.width && frameDimensions.height === native.height, `${pilot.id}: authoring PNG is not native stage size`);

  const rawAuditFile = path.join(root, "work", "animate", `${path.basename(pilot.fla)}-authoring-audit.json`);
  let rawAudit = null;
  if (await exists(rawAuditFile)) {
    const rawBytes = await readFile(rawAuditFile);
    invariant(sha256(rawBytes) === audit.rawAuditSha256, `${pilot.id}: raw authoring audit hash mismatch`);
    rawAudit = {file: projectRelative(root, rawAuditFile), sha256: audit.rawAuditSha256};
  }

  const currentAuditScriptFile = path.join(root, "scripts", "animate-audit-current-document.jsfl");
  const currentAuditScriptSha256 = sha256(await readFile(currentAuditScriptFile));
  const timelines = [audit.authoringAudit?.timeline];
  for (const item of audit.authoringAudit?.library || []) if (item.timeline) timelines.push(item.timeline);
  const recursiveShapeComplete = audit.authoringAudit?.recursiveLibraryTimelineAudit === true
    && timelines.every((timeline) => Array.isArray(timeline?.layers)
      && timeline.layers.every((layer) => Array.isArray(layer.keyframes)
        && layer.keyframes.every((frame) => Array.isArray(frame.elements))));
  const comprehensive = audit.schemaVersion === 2
    && audit.protocol?.recursiveLibraryTimelineAuditVerified === true
    && audit.protocol?.readOnlyWorkingCopyPermissionsVerifiedAtFinalize === true
    && audit.auditScript?.file === "scripts/animate-audit-current-document.jsfl"
    && audit.auditScript?.sha256 === currentAuditScriptSha256
    && recursiveShapeComplete
    && workingCopy?.readOnly === true
    && audit.source?.workingCopy?.path === workingCopy.file
    && audit.source?.workingCopy?.sha256 === workingCopy.sha256
    && audit.source?.workingCopy?.readOnlyAtFinalize === true
    && audit.source?.workingCopy?.byteIdenticalToSourceAtFinalize === true;

  return {
    animationId: pilot.id,
    sourceKind: "fla-and-swf",
    status: comprehensive ? "verified-current-recursive-authoring-audit" : "legacy-partial-authoring-audit-refresh-required",
    migration: {file: projectRelative(root, migrationFile), sha256: migrationDocument.sha256},
    swf: {file: pilot.swf, sha256: migration.source.swfSha256},
    fla: {file: pilot.fla, sha256: flaSha256},
    workingCopy,
    authoringAudit: {
      file: projectRelative(root, auditFile),
      sha256: auditDocument.sha256,
      animateVersion: audit.animateVersion,
      capturedAt: audit.capturedAt,
      nativeMovie: native,
      nativeMetadataMatchesManifest: metadataMatch,
      authoringFrame: {
        file: projectRelative(root, frameFile),
        sha256: frameSha256,
        flashFrame: audit.capturedAuthoringFrame.flashFrame,
        ...frameDimensions,
      },
      rawAudit,
      structure: summarizeAuthoringAudit(audit),
      comprehensiveCurrentContract: comprehensive,
      contractChecks: {
        canonicalSchemaV2: audit.schemaVersion === 2,
        readOnlyWorkingCopyBound: audit.source?.workingCopy?.path === workingCopy?.file
          && audit.source?.workingCopy?.sha256 === workingCopy?.sha256
          && audit.source?.workingCopy?.readOnlyAtFinalize === true,
        currentAuditScriptBound: audit.auditScript?.sha256 === currentAuditScriptSha256,
        recursiveLibraryTimelineAudit: audit.authoringAudit?.recursiveLibraryTimelineAudit === true,
        recursiveElementsPresent: recursiveShapeComplete,
      },
      limitations: audit.limitations,
    },
    nextAction: comprehensive
      ? null
      : "Refresh from the read-only FLA in a fresh Animate process with the current recursive JSFL, close without saving, then finalize with schema v2.",
    strictAcceptanceEffect: false,
  };
}

export async function buildReport({root = ROOT, pilots = PILOT_MIGRATIONS} = {}) {
  invariant(pilots.length === 16 || root !== ROOT, `Expected the 16 approved pilots, received ${pilots.length}`);
  const ids = new Set();
  for (const pilot of pilots) {
    invariant(pilot.id && !ids.has(pilot.id), `Pilot IDs must be non-empty and unique: ${pilot.id || "empty"}`);
    ids.add(pilot.id);
  }
  const animateProbe = await findLatestPassingProbe(root);
  const pilotRows = [];
  for (const pilot of pilots) pilotRows.push(await inspectPilot(root, pilot));
  const flaBacked = pilotRows.filter(({sourceKind}) => sourceKind === "fla-and-swf");
  const verified = flaBacked.filter(({status}) => status === "verified-current-recursive-authoring-audit");
  const legacyPartial = flaBacked.filter(({status}) => status === "legacy-partial-authoring-audit-refresh-required");
  const missing = flaBacked.filter(({authoringAudit}) => !authoringAudit);
  const pending = flaBacked.filter(({status}) => status !== "verified-current-recursive-authoring-audit");
  return {
    schemaVersion: 1,
    evidenceKind: "pilot-adobe-animate-authoring-coverage-index",
    generatedFromEvidenceAt: animateProbe?.capturedAt || null,
    scope: "Adobe Animate authoring structure only; no original-runtime, audio-listening, human-review, owner, or strict acceptance authority",
    authorityBoundary: {
      authoringStructureEvidence: true,
      runtimeBehaviorEvidence: false,
      fullFrameFidelityEvidence: false,
      audioListeningEvidence: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictAcceptanceEffect: false,
    },
    animateProbe,
    summary: {
      pilots: pilotRows.length,
      flaBacked: flaBacked.length,
      swfOnly: pilotRows.length - flaBacked.length,
      verifiedAuthoringAudits: verified.length,
      legacyPartialAuthoringAudits: legacyPartial.length,
      missingAuthoringAudits: missing.length,
      pendingAuthoringAudits: pending.length,
      metadataConsistentLegacyOrCurrentAudits: flaBacked.filter(({authoringAudit}) => authoringAudit?.nativeMetadataMatchesManifest).length,
      readOnlyWorkingCopiesReady: flaBacked.filter(({workingCopy}) => workingCopy?.readOnly && workingCopy?.byteIdenticalToSource).length,
      authoringCoverageComplete: pending.length === 0,
      strictAcceptanceEffect: false,
    },
    pendingAnimationIds: pending.map(({animationId}) => animationId),
    pilots: pilotRows,
  };
}

export function renderMarkdown(report) {
  const lines = [
    "# Adobe Animate pilot authoring coverage",
    "",
    `Latest verified blank-document JSFL probe: ${report.animateProbe ? `\`${report.animateProbe.animateVersion}\` at \`${report.animateProbe.capturedAt}\`` : "MISSING"}.`,
    "",
    "This report proves only hash-bound FLA authoring structure. It does not prove original runtime behavior, audio synchronization/listening, full-frame fidelity, human visual review, owner acceptance, or strict completion.",
    "",
    "## Summary",
    "",
    `- Pilots: ${report.summary.pilots}`,
    `- FLA-backed: ${report.summary.flaBacked}; SWF-only: ${report.summary.swfOnly}`,
    `- Current recursive Animate authoring audits: ${report.summary.verifiedAuthoringAudits}/${report.summary.flaBacked}`,
    `- Legacy partial audits requiring refresh: ${report.summary.legacyPartialAuthoringAudits}`,
    `- Missing audits: ${report.summary.missingAuthoringAudits}`,
    `- Native stage/FPS/frame-count consistency in existing audits: ${report.summary.metadataConsistentLegacyOrCurrentAudits}/${report.summary.flaBacked}`,
    `- Pending authoring audits: ${report.summary.pendingAuthoringAudits}`,
    `- Strict acceptance effect: none`,
    "",
    "## Pilot matrix",
    "",
    "| Animation | Source | Animate authoring status | Native metadata | Working copy |",
    "|---|---|---|---|---|",
  ];
  for (const pilot of report.pilots) {
    const metadata = pilot.authoringAudit?.nativeMetadataMatchesManifest ? "MATCH" : pilot.sourceKind === "swf-only" ? "N/A" : "PENDING";
    const working = pilot.workingCopy?.readOnly ? "READY/READ-ONLY" : pilot.sourceKind === "swf-only" ? "N/A" : "not required/absent";
    lines.push(`| \`${pilot.animationId}\` | ${pilot.sourceKind} | \`${pilot.status}\` | ${metadata} | ${working} |`);
  }
  lines.push("", "## Remaining Animate action", "");
  if (report.pendingAnimationIds.length) {
    lines.push(`The remaining FLA authoring audits are: ${report.pendingAnimationIds.map((id) => `\`${id}\``).join(", ")}.`);
    lines.push("Use `docs/ANIMATE_KEYTERM_AUDIT_OPERATOR_CARD.md`; open one read-only copy per fresh Animate process, acknowledge the legacy conversion warning, run the pinned JSFL command, close without saving, then run the finalizer.");
  } else {
    lines.push("All FLA-backed pilot authoring audits are present and hash-valid.");
  }
  lines.push("");
  return lines.join("\n");
}

export function parseArguments(argv) {
  const options = {check: false, json: DEFAULT_JSON, markdown: DEFAULT_MARKDOWN};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--json") options.json = path.resolve(argv[++index] || invariant(false, "--json requires a path"));
    else if (value === "--markdown") options.markdown = path.resolve(argv[++index] || invariant(false, "--markdown requires a path"));
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function help() {
  return `Usage: node scripts/build-pilot-animate-authoring-index.mjs [--check] [--json <file>] [--markdown <file>]\n\nBuilds a fail-closed, acceptance-neutral index of Adobe Animate authoring evidence for all 16 pilots.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(help());
    return;
  }
  const report = await buildReport();
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = renderMarkdown(report);
  if (options.check) {
    invariant(await readFile(options.json, "utf8") === json, `${projectRelative(ROOT, options.json)} is stale`);
    invariant(await readFile(options.markdown, "utf8") === markdown, `${projectRelative(ROOT, options.markdown)} is stale`);
    console.log(`PASS: ${projectRelative(ROOT, options.json)} and ${projectRelative(ROOT, options.markdown)}`);
    return;
  }
  await writeFile(options.json, json);
  await writeFile(options.markdown, markdown);
  console.log(JSON.stringify(report.summary, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
