#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {chmod, lstat, readFile, realpath, rename, stat, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {PNG} from "pngjs";

import {PILOT_MIGRATIONS} from "./scaffold-pilot-migrations.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export const AUTHORING_AUDIT_FILE = "audit/adobe-animate-2021-authoring-audit.json";
export const AUTHORING_AUDIT_SCHEMA_VERSION = 2;
export const AUTHORING_EVIDENCE_KIND = "adobe-animate-2021-cold-start-authoring-audit";
export const AUTHORING_CONTRACT_STATUS = "verified-current-recursive-authoring-audit";
export const EXPECTED_ANIMATE_VERSION = "MAC 21,0,7,42652";

const EXPECTED_AUTHORITY = "Original owner-provided FLA inspected read-only in Adobe Animate 2021";
const AUDIT_SCRIPT_FILE = "scripts/animate-audit-current-document.jsfl";
const REQUIRED_PROTOCOL_FLAGS = Object.freeze([
  "coldStartPerFla",
  "openedWithoutSaving",
  "originalSourceHashVerified",
  "readOnlyWorkingCopyRequired",
  "readOnlyWorkingCopyPathVerified",
  "readOnlyWorkingCopyHashVerifiedAtFinalize",
  "readOnlyWorkingCopyPermissionsVerifiedAtFinalize",
  "recursiveLibraryTimelineAuditRequired",
  "recursiveLibraryTimelineAuditVerified",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function portableRelative(root, file) {
  const relative = path.relative(root, file);
  invariant(relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), `Path escapes project root: ${file}`);
  return relative.split(path.sep).join("/");
}

function validatePortableRelative(declared, label) {
  invariant(typeof declared === "string" && declared.length > 0, `${label}: path is missing`);
  invariant(!path.isAbsolute(declared) && !declared.includes("\\") && !declared.includes("\0"), `${label}: path must be portable and relative`);
  const normalized = path.posix.normalize(declared);
  invariant(normalized === declared && normalized !== ".." && !normalized.startsWith("../"), `${label}: path escapes its declared root or is not normalized`);
  return declared;
}

async function resolveSafeRegularFile(root, declared, label) {
  validatePortableRelative(declared, label);
  const candidate = path.resolve(root, ...declared.split("/"));
  const [rootReal, info] = await Promise.all([realpath(root), lstat(candidate)]);
  invariant(info.isFile() && !info.isSymbolicLink(), `${label}: must be a regular non-symbolic-link file`);
  const fileReal = await realpath(candidate);
  const relative = path.relative(rootReal, fileReal);
  invariant(relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), `${label}: symlink escapes its declared root`);
  return {file: candidate, real: fileReal, info};
}

function pngDimensions(bytes, label) {
  let image;
  try {
    image = PNG.sync.read(bytes, {checkCRC: true});
  } catch (error) {
    throw new Error(`${label}: PNG is not fully decodable (${error.message})`);
  }
  invariant(Number.isInteger(image.width) && image.width > 0 && Number.isInteger(image.height) && image.height > 0, `${label}: decoded PNG dimensions are invalid`);
  return {width: image.width, height: image.height};
}

function decodeAnimateFileUri(uri) {
  if (typeof uri !== "string" || !uri.startsWith("file:")) return "";
  return decodeURIComponent(uri).replace(/^file:\/\/(?:\/Macintosh HD)?/, "");
}

function assertRecursiveAuthoringAudit(audit, animationId) {
  const embedded = audit.authoringAudit;
  invariant(embedded?.schemaVersion === 1, `${animationId}: embedded authoring audit schema is not current`);
  invariant(embedded?.evidenceKind === "adobe-animate-authoring-audit", `${animationId}: embedded authoring audit kind is invalid`);
  invariant(embedded.recursiveLibraryTimelineAudit === true, `${animationId}: recursive library timeline audit is absent`);
  const timelines = [embedded.timeline];
  for (const item of embedded.library || []) if (item.timeline) timelines.push(item.timeline);
  invariant(timelines.length > 0, `${animationId}: authoring audit has no timelines`);
  for (const timeline of timelines) {
    invariant(Array.isArray(timeline?.layers), `${animationId}: authoring timeline is missing layers`);
    for (const layer of timeline.layers) {
      invariant(Array.isArray(layer.keyframes), `${animationId}: authoring layer is missing keyframes`);
      for (const frame of layer.keyframes) {
        invariant(Array.isArray(frame.elements), `${animationId}: recursive authoring keyframe is missing elements`);
      }
    }
  }
}

function assertNativeMetadata(audit, manifest, animationId) {
  const native = audit.nativeMovie;
  const runtime = manifest.runtime;
  invariant(native?.width === runtime?.stage?.width, `${animationId}: authoring width differs from migration runtime`);
  invariant(native?.height === runtime?.stage?.height, `${animationId}: authoring height differs from migration runtime`);
  invariant(native?.fps === runtime?.fps, `${animationId}: authoring FPS differs from migration runtime`);
  invariant(native?.frameCount === runtime?.frameCount, `${animationId}: authoring frame count differs from migration runtime`);
  invariant(audit.authoringAudit?.document?.width === native.width && audit.authoringAudit?.document?.height === native.height, `${animationId}: embedded authoring stage differs from canonical native movie`);
  invariant(audit.authoringAudit?.document?.frameRate === native.fps, `${animationId}: embedded authoring FPS differs from canonical native movie`);
  invariant(audit.authoringAudit?.timeline?.frameCount === native.frameCount, `${animationId}: embedded authoring root frame count differs from canonical native movie`);
}

function bindingWithPreservedOrder(existing, auditSha256, audit) {
  invariant(existing === undefined || isPlainObject(existing), "authoringEvidence must be an object when present");
  const binding = existing === undefined ? {} : {...existing};
  const desired = {
    schemaVersion: AUTHORING_AUDIT_SCHEMA_VERSION,
    evidenceKind: AUTHORING_EVIDENCE_KIND,
    status: AUTHORING_CONTRACT_STATUS,
    animateVersion: audit.animateVersion,
    file: AUTHORING_AUDIT_FILE,
    sha256: auditSha256,
    openedWithoutSaving: true,
    recursiveLibraryTimelineAudit: true,
  };
  for (const [key, value] of Object.entries(desired)) binding[key] = value;
  return binding;
}

function withoutAuthoringBinding(manifest) {
  const clone = structuredClone(manifest);
  if (clone.audit?.machineEvidence) delete clone.audit.machineEvidence.authoringEvidence;
  return clone;
}

function assertOnlyAuthoringBindingChanged(before, after, animationId) {
  invariant(
    canonicalJson(withoutAuthoringBinding(before)) === canonicalJson(withoutAuthoringBinding(after)),
    `${animationId}: sync attempted to change a field outside audit.machineEvidence.authoringEvidence`,
  );
}

async function inspectPilot({root, pilot}) {
  const animationId = pilot.id;
  invariant(pilot.fla, `${animationId}: pilot is not FLA-backed`);
  validatePortableRelative(pilot.fla, `${animationId}: registered source FLA`);

  const migrationDir = path.join(root, "migrations", animationId);
  const manifestPath = path.join(migrationDir, "migration.json");
  const manifestBytes = await readFile(manifestPath);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  invariant(manifest.animationId === animationId && manifest.id === animationId, `${animationId}: migration identity mismatch`);
  invariant(manifest.source?.fla === pilot.fla, `${animationId}: migration FLA path differs from the pilot registry`);
  invariant(manifest.source?.pairedFlaStatus === "present", `${animationId}: migration does not declare a present paired FLA`);
  invariant(SHA256_PATTERN.test(manifest.source?.flaSha256 || ""), `${animationId}: migration FLA SHA-256 is invalid`);
  invariant(isPlainObject(manifest.audit?.machineEvidence), `${animationId}: migration lacks audit.machineEvidence`);

  const source = await resolveSafeRegularFile(root, manifest.source.fla, `${animationId}: source FLA`);
  const sourceAssetsReal = await realpath(path.join(root, "source-assets"));
  const sourceRelative = path.relative(sourceAssetsReal, source.real);
  invariant(sourceRelative !== ".." && !sourceRelative.startsWith(`..${path.sep}`) && !path.isAbsolute(sourceRelative), `${animationId}: source FLA resolves outside source-assets`);
  const sourceBytes = await readFile(source.file);
  const sourceSha256 = sha256(sourceBytes);
  invariant(sourceSha256 === manifest.source.flaSha256, `${animationId}: source FLA bytes differ from migration.json`);

  const canonicalAuditPath = path.join(migrationDir, AUTHORING_AUDIT_FILE);
  const canonicalAuditRelative = portableRelative(root, canonicalAuditPath);
  const canonicalAudit = await resolveSafeRegularFile(root, canonicalAuditRelative, `${animationId}: canonical Animate audit`);
  invariant(canonicalAudit.file === canonicalAuditPath, `${animationId}: canonical Animate audit path is not normalized`);
  const auditBytes = await readFile(canonicalAudit.file);
  const auditSha256 = sha256(auditBytes);
  const audit = JSON.parse(auditBytes.toString("utf8"));

  invariant(audit.schemaVersion === AUTHORING_AUDIT_SCHEMA_VERSION, `${animationId}: canonical Animate audit must be schema v2`);
  invariant(audit.evidenceKind === AUTHORING_EVIDENCE_KIND, `${animationId}: canonical Animate audit kind is invalid`);
  invariant(audit.authority === EXPECTED_AUTHORITY, `${animationId}: canonical Animate audit authority is invalid`);
  invariant(audit.animationId === animationId, `${animationId}: canonical Animate audit identity mismatch`);
  invariant(audit.animateVersion === EXPECTED_ANIMATE_VERSION, `${animationId}: canonical Animate version is not the approved workstation version`);
  invariant(Number.isFinite(Date.parse(audit.capturedAt || "")), `${animationId}: canonical Animate audit has an invalid capture timestamp`);
  for (const flag of REQUIRED_PROTOCOL_FLAGS) {
    invariant(audit.protocol?.[flag] === true, `${animationId}: canonical Animate protocol flag ${flag} is not true`);
  }
  assertRecursiveAuthoringAudit(audit, animationId);
  assertNativeMetadata(audit, manifest, animationId);

  invariant(audit.source?.fla === manifest.source.fla, `${animationId}: canonical Animate audit FLA path differs from migration.json`);
  invariant(audit.source?.flaSha256 === sourceSha256, `${animationId}: canonical Animate audit FLA hash differs from source bytes`);

  const expectedWorkingCopy = `work/animate/read-only-fla-copies/${animationId}/${path.posix.basename(pilot.fla)}`;
  invariant(audit.source?.workingCopy?.path === expectedWorkingCopy, `${animationId}: canonical Animate working-copy path is not the registered project-relative path`);
  invariant(audit.source?.workingCopy?.sha256 === sourceSha256, `${animationId}: canonical Animate working-copy hash differs from source bytes`);
  invariant(audit.source?.workingCopy?.readOnlyAtFinalize === true, `${animationId}: canonical Animate audit did not verify read-only permissions`);
  invariant(audit.source?.workingCopy?.byteIdenticalToSourceAtFinalize === true, `${animationId}: canonical Animate working copy was not byte-identical at finalize`);
  const workingCopy = await resolveSafeRegularFile(root, expectedWorkingCopy, `${animationId}: Animate working copy`);
  const workingCopyBytes = await readFile(workingCopy.file);
  invariant(sha256(workingCopyBytes) === sourceSha256, `${animationId}: current Animate working-copy bytes differ from source FLA`);
  invariant((workingCopy.info.mode & 0o222) === 0, `${animationId}: current Animate working copy is writable`);
  const decodedDocumentPath = path.resolve(decodeAnimateFileUri(audit.authoringAudit?.document?.pathURI));
  invariant(decodedDocumentPath === workingCopy.file, `${animationId}: embedded Animate document path differs from the registered working copy`);

  invariant(audit.auditScript?.file === AUDIT_SCRIPT_FILE, `${animationId}: canonical Animate audit script path is not current`);
  const auditScript = await resolveSafeRegularFile(root, AUDIT_SCRIPT_FILE, `${animationId}: Animate audit script`);
  invariant(sha256(await readFile(auditScript.file)) === audit.auditScript.sha256, `${animationId}: canonical Animate audit script hash is stale`);

  const frameFile = validatePortableRelative(audit.capturedAuthoringFrame?.file, `${animationId}: authoring frame`);
  const authoringFrame = await resolveSafeRegularFile(migrationDir, frameFile, `${animationId}: authoring frame`);
  const frameBytes = await readFile(authoringFrame.file);
  invariant(sha256(frameBytes) === audit.capturedAuthoringFrame.sha256, `${animationId}: authoring frame hash mismatch`);
  const dimensions = pngDimensions(frameBytes, `${animationId}: authoring frame`);
  invariant(dimensions.width === audit.nativeMovie.width && dimensions.height === audit.nativeMovie.height, `${animationId}: authoring frame is not native stage size`);
  invariant(audit.capturedAuthoringFrame.width === dimensions.width && audit.capturedAuthoringFrame.height === dimensions.height, `${animationId}: authoring frame metadata dimensions are stale`);
  invariant(Number.isInteger(audit.capturedAuthoringFrame.flashFrame) && audit.capturedAuthoringFrame.flashFrame >= 1 && audit.capturedAuthoringFrame.flashFrame <= audit.nativeMovie.frameCount, `${animationId}: captured authoring frame is outside the root timeline`);
  invariant(SHA256_PATTERN.test(audit.rawAuditSha256 || ""), `${animationId}: raw Animate audit SHA-256 is invalid`);

  const updated = structuredClone(manifest);
  updated.audit.machineEvidence.authoringEvidence = bindingWithPreservedOrder(
    updated.audit.machineEvidence.authoringEvidence,
    auditSha256,
    audit,
  );
  assertOnlyAuthoringBindingChanged(manifest, updated, animationId);
  const updatedText = `${JSON.stringify(updated, null, 2)}\n`;
  return {
    animationId,
    manifestPath,
    beforeText: manifestBytes.toString("utf8"),
    updatedText,
    changed: manifestBytes.toString("utf8") !== updatedText,
    binding: updated.audit.machineEvidence.authoringEvidence,
  };
}

async function removeIfPresent(file) {
  try {
    await unlink(file);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

export async function replaceAnimateBindingPlansTransaction(plans, {beforeCommitEntry} = {}) {
  const transactionId = `${process.pid}-${randomUUID()}`;
  const prepared = [];
  try {
    for (let index = 0; index < plans.length; index += 1) {
      const plan = plans[index];
      const info = await stat(plan.manifestPath);
      invariant(info.isFile(), `${plan.animationId}: migration.json is not a regular file`);
      invariant(await readFile(plan.manifestPath, "utf8") === plan.beforeText, `${plan.animationId}: migration.json changed after preflight; no manifests were written`);
      const temporary = `${plan.manifestPath}.animate-binding-${transactionId}-${index}.tmp`;
      const backup = `${plan.manifestPath}.animate-binding-${transactionId}-${index}.bak`;
      await writeFile(temporary, plan.updatedText, {encoding: "utf8", flag: "wx"});
      await chmod(temporary, info.mode & 0o777);
      prepared.push({...plan, temporary, backup, targetMoved: false, committed: false, preserveBackup: false});
    }

    for (let index = 0; index < prepared.length; index += 1) {
      const plan = prepared[index];
      if (beforeCommitEntry) await beforeCommitEntry(plan, index);
      invariant(await readFile(plan.manifestPath, "utf8") === plan.beforeText, `${plan.animationId}: migration.json changed before commit`);
      await rename(plan.manifestPath, plan.backup);
      plan.targetMoved = true;
      await rename(plan.temporary, plan.manifestPath);
      plan.committed = true;
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const plan of [...prepared].reverse()) {
      try {
        if (plan.committed) {
          let currentText;
          try {
            currentText = await readFile(plan.manifestPath, "utf8");
          } catch (readError) {
            if (readError.code !== "ENOENT") throw readError;
            currentText = null;
          }
          if (currentText !== plan.updatedText) {
            plan.preserveBackup = true;
            rollbackErrors.push(
              `${plan.animationId}: committed migration.json changed during rollback; preserving concurrent target bytes and original backup at ${plan.backup}`,
            );
            continue;
          }
          await removeIfPresent(plan.manifestPath);
        } else if (plan.targetMoved) {
          try {
            await lstat(plan.manifestPath);
            plan.preserveBackup = true;
            rollbackErrors.push(
              `${plan.animationId}: migration.json was recreated during rollback; preserving concurrent target bytes and original backup at ${plan.backup}`,
            );
            continue;
          } catch (targetError) {
            if (targetError.code !== "ENOENT") throw targetError;
          }
        }
        if (plan.targetMoved) await rename(plan.backup, plan.manifestPath);
      } catch (rollbackError) {
        plan.preserveBackup = plan.targetMoved;
        rollbackErrors.push(`${plan.animationId}: ${rollbackError.message}`);
      }
    }
    for (const plan of prepared) {
      try {
        await removeIfPresent(plan.temporary);
        if (!plan.preserveBackup) await removeIfPresent(plan.backup);
      } catch (cleanupError) {
        rollbackErrors.push(`${plan.animationId} cleanup: ${cleanupError.message}`);
      }
    }
    if (rollbackErrors.length > 0) {
      throw new Error(`${error.message}\nAnimate binding transaction rollback failed:\n${rollbackErrors.join("\n")}`);
    }
    throw error;
  }

  for (const plan of prepared) {
    await removeIfPresent(plan.temporary);
    await removeIfPresent(plan.backup);
  }
}

export async function syncPilotAnimateAuthoringBindings({
  root = PROJECT_ROOT,
  ids = [],
  check = false,
  pilots = PILOT_MIGRATIONS,
  transactionHooks,
} = {}) {
  const flaBacked = pilots.filter(({fla}) => fla);
  invariant(flaBacked.length === 8 || root !== PROJECT_ROOT, `Expected 8 FLA-backed pilots, received ${flaBacked.length}`);
  const pilotById = new Map();
  for (const pilot of pilots) {
    invariant(pilot.id && !pilotById.has(pilot.id), `Pilot IDs must be non-empty and unique: ${pilot.id || "empty"}`);
    pilotById.set(pilot.id, pilot);
  }
  invariant(new Set(ids).size === ids.length, "Pilot IDs must not be duplicated");
  const selected = ids.length ? ids.map((id) => {
    const pilot = pilotById.get(id);
    invariant(pilot, `Unknown pilot: ${id}`);
    invariant(pilot.fla, `${id}: pilot is not FLA-backed`);
    return pilot;
  }) : flaBacked;

  const plans = [];
  const blockers = [];
  for (const pilot of selected) {
    try {
      plans.push(await inspectPilot({root, pilot}));
    } catch (error) {
      blockers.push(`${pilot.id}: ${error.message}`);
    }
  }
  invariant(blockers.length === 0, `Animate authoring-binding sync blocked; no manifests were written:\n${blockers.join("\n")}`);

  if (check) {
    const stale = plans.filter(({changed}) => changed).map(({animationId}) => animationId);
    invariant(stale.length === 0, `Animate authoring bindings are stale for: ${stale.join(", ")}`);
    return plans;
  }

  const changed = plans.filter((plan) => plan.changed);
  await replaceAnimateBindingPlansTransaction(changed, transactionHooks);
  return plans;
}

export function parseArguments(argv) {
  const options = {ids: [], check: false, help: false};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--check") options.check = true;
    else if (value === "--id") {
      const id = argv[index + 1];
      if (!id) throw new Error("--id requires an animation ID");
      options.ids.push(id);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/sync-pilot-animate-authoring-bindings.mjs [--id <animation-id>] [--check]

Validates the complete current schema-v2 Animate authoring contract for each
selected FLA-backed pilot before writing any manifest. It updates only
audit.machineEvidence.authoringEvidence; acceptance, reviews, status, runtime,
implementation, audio, and source evidence are never changed.`;
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const plans = await syncPilotAnimateAuthoringBindings(options);
    for (const plan of plans) {
      console.log(`${options.check ? "CHECK" : plan.changed ? "WRITE" : "NOOP"} ${plan.animationId}: schema=v${plan.binding.schemaVersion} audit=${plan.binding.sha256}`);
    }
    console.log(`${options.check ? "Verified" : "Synchronized"} ${plans.length} FLA-backed pilot Animate authoring binding(s); all non-binding manifest fields unchanged.`);
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) await main();
