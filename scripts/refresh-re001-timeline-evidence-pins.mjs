#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  chmod,
  lstat,
  open,
  readFile,
  realpath,
  rename,
  stat,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SHA256 = /^[a-f0-9]{64}$/;
const SOURCE_BLOCK_START = "export const COURSE_G03_L08_RE_001_SOURCE = Object.freeze({";
const SOURCE_BLOCK_END = "export const COURSE_G03_L08_RE_001_RUNTIME";

export const RE001_TIMELINE_EVIDENCE_PIN_CONTRACT = Object.freeze({
  animationId: "course-g03-l08-re-001",
  sourceSwf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L8/RE/L8RE01.swf",
  sourceSwfSha256: "e4a6403f6b45a3b4aecb48e0659aa20113acb0644e37b027a19fb51f34417f9b",
  timelinePath: "packages/demos/src/timelines/course-g03-l08-re-001.ts",
  bindings: Object.freeze([
    Object.freeze({
      property: "scenarioInventorySha256",
      evidencePath: "migrations/course-g03-l08-re-001/audit/scenario-inventory.json",
      schemaVersion: 1,
      evidenceKind: "scenario-inventory",
    }),
    Object.freeze({
      property: "strictReadinessSha256",
      evidencePath: "migrations/course-g03-l08-re-001/audit/strict-readiness.json",
      schemaVersion: 2,
      evidenceKind: "course-shell-strict-readiness",
    }),
    Object.freeze({
      property: "audioAuditSha256",
      evidencePath: "migrations/course-g03-l08-re-001/audit/audio-runtime-evidence.json",
      schemaVersion: 2,
      evidenceKind: "pilot-audio-runtime-evidence",
    }),
  ]),
});

const APPROVAL_EFFECT =
  "Current-JavaScript approval remains stale after this JavaScript source change. "
  + "This generator never reads, rewrites, records, renews, or promotes approval.";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validatePortablePath(relative, label) {
  invariant(typeof relative === "string" && relative.length > 0, `${label}: path is missing`);
  invariant(
    !path.isAbsolute(relative) && !relative.includes("\\") && !relative.includes("\0"),
    `${label}: path must be portable and relative`,
  );
  invariant(
    path.posix.normalize(relative) === relative
      && relative !== ".."
      && !relative.startsWith("../"),
    `${label}: path is not normalized or escapes the project root`,
  );
}

async function resolveRegularFile(root, relative, label) {
  validatePortablePath(relative, label);
  const rootReal = await realpath(root);
  const candidate = path.resolve(rootReal, ...relative.split("/"));
  const expected = path.join(rootReal, ...relative.split("/"));
  invariant(candidate === expected, `${label}: resolved path drifted`);
  const relativeToRoot = path.relative(rootReal, candidate);
  invariant(
    relativeToRoot !== ".."
      && !relativeToRoot.startsWith(`..${path.sep}`)
      && !path.isAbsolute(relativeToRoot),
    `${label}: path escapes the project root`,
  );
  const [linkInfo, fileInfo, actual] = await Promise.all([
    lstat(candidate),
    stat(candidate),
    realpath(candidate),
  ]);
  invariant(!linkInfo.isSymbolicLink(), `${label}: symbolic links are forbidden`);
  invariant(fileInfo.isFile(), `${label}: expected a regular file`);
  invariant(actual === candidate, `${label}: intermediate symbolic links or path drift are forbidden`);
  return {file: candidate, mode: fileInfo.mode & 0o777};
}

function validateEvidenceIdentity(document, binding, contract) {
  invariant(
    document && typeof document === "object" && !Array.isArray(document),
    `${binding.property}: evidence must be one JSON object`,
  );
  invariant(
    document.schemaVersion === binding.schemaVersion,
    `${binding.property}: evidence schema version changed`,
  );
  invariant(
    document.animationId === contract.animationId,
    `${binding.property}: evidence animation identity changed`,
  );

  if (binding.evidenceKind === "scenario-inventory") {
    invariant(
      document.inventoryStatus === "static-exhaustive-runtime-unverified",
      `${binding.property}: scenario inventory kind/status changed`,
    );
    invariant(
      document.source?.swf === contract.sourceSwf
        && document.source?.swfSha256 === contract.sourceSwfSha256,
      `${binding.property}: scenario inventory source identity changed`,
    );
  } else if (binding.evidenceKind === "course-shell-strict-readiness") {
    invariant(
      document.evidenceKind === binding.evidenceKind,
      `${binding.property}: readiness evidence kind changed`,
    );
    invariant(
      document.generatedBy?.script === "scripts/build-course-strict-readiness.mjs"
        && document.generatedBy?.deterministic === true,
      `${binding.property}: readiness generator identity changed`,
    );
    invariant(
      document.source?.swf === contract.sourceSwf
        && document.source?.swfSha256 === contract.sourceSwfSha256
        && document.source?.sourceHashVerified === true,
      `${binding.property}: readiness source identity changed`,
    );
  } else if (binding.evidenceKind === "pilot-audio-runtime-evidence") {
    invariant(
      document.generatedBy === "scripts/audit-pilot-audio.mjs",
      `${binding.property}: audio-audit generator identity changed`,
    );
    invariant(
      document.source?.swf === contract.sourceSwf
        && document.source?.expectedSha256 === contract.sourceSwfSha256
        && document.source?.observedSha256 === contract.sourceSwfSha256
        && document.source?.hashMatches === true,
      `${binding.property}: audio-audit source identity changed`,
    );
  } else {
    throw new Error(`${binding.property}: unsupported evidence kind`);
  }
}

async function readEvidence(root, binding, contract) {
  const {file} = await resolveRegularFile(root, binding.evidencePath, binding.property);
  const bytes = await readFile(file);
  let document;
  try {
    document = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${binding.property}: invalid evidence JSON (${error.message})`);
  }
  validateEvidenceIdentity(document, binding, contract);
  return {
    property: binding.property,
    evidencePath: binding.evidencePath,
    file,
    sha256: sha256(bytes),
    bytes: bytes.length,
  };
}

function validateContract(contract) {
  const production = RE001_TIMELINE_EVIDENCE_PIN_CONTRACT;
  invariant(contract.animationId === production.animationId, "RE001 contract animation identity changed");
  invariant(contract.sourceSwf === production.sourceSwf, "RE001 contract source path changed");
  invariant(
    contract.sourceSwfSha256 === production.sourceSwfSha256,
    "RE001 contract source SHA-256 changed",
  );
  invariant(contract.timelinePath === production.timelinePath, "RE001 contract timeline path changed");
  invariant(contract.bindings?.length === 3, "RE001 contract must contain exactly three bindings");
  invariant(
    new Set(contract.bindings.map(({property}) => property)).size === 3,
    "RE001 contract contains duplicate binding properties",
  );
  for (let index = 0; index < production.bindings.length; index += 1) {
    const actual = contract.bindings[index];
    const expected = production.bindings[index];
    invariant(actual?.property === expected.property, `RE001 binding ${index + 1} property changed`);
    invariant(
      actual?.evidencePath === expected.evidencePath,
      `${expected.property}: evidence path changed`,
    );
    invariant(
      actual?.schemaVersion === expected.schemaVersion,
      `${expected.property}: contract schema changed`,
    );
    invariant(
      actual?.evidenceKind === expected.evidenceKind,
      `${expected.property}: contract evidence kind changed`,
    );
  }
}

function sourceBlockRange(text) {
  const start = text.indexOf(SOURCE_BLOCK_START);
  const end = text.indexOf(SOURCE_BLOCK_END);
  invariant(start >= 0, "RE001 timeline source binding block is missing");
  invariant(end > start, "RE001 timeline runtime marker is missing or reordered");
  invariant(text.indexOf(SOURCE_BLOCK_START, start + 1) === -1, "RE001 timeline source block is duplicated");
  invariant(text.indexOf(SOURCE_BLOCK_END, end + 1) === -1, "RE001 timeline runtime marker is duplicated");
  return {start, end};
}

function locateBindings(text, contract) {
  const range = sourceBlockRange(text);
  return contract.bindings.map((binding) => {
    const expression = new RegExp(
      `(^[ \\t]*${escapeRegExp(binding.property)}:[ \\t]*)'([a-f0-9]{64})'([ \\t]*,?[ \\t]*$)`,
      "gm",
    );
    const matches = [...text.matchAll(expression)];
    invariant(matches.length === 1, `${binding.property}: expected exactly one canonical SHA-256 literal`);
    const match = matches[0];
    invariant(
      match.index >= range.start && match.index < range.end,
      `${binding.property}: binding moved outside the RE001 source block`,
    );
    const valueOffset = match.index + match[1].length + 1;
    return {
      ...binding,
      currentSha256: match[2],
      valueOffset,
      valueEnd: valueOffset + match[2].length,
    };
  });
}

export function redactRe001TimelineEvidencePins(
  text,
  contract = RE001_TIMELINE_EVIDENCE_PIN_CONTRACT,
) {
  const located = locateBindings(text, contract);
  let redacted = text;
  for (const binding of [...located].sort((left, right) => right.valueOffset - left.valueOffset)) {
    redacted =
      `${redacted.slice(0, binding.valueOffset)}`
      + `<RE001:${binding.property}>`
      + redacted.slice(binding.valueEnd);
  }
  return redacted;
}

function replaceBindings(text, targets, contract) {
  const located = locateBindings(text, contract);
  const targetByProperty = new Map(targets.map((target) => [target.property, target.sha256]));
  invariant(targetByProperty.size === contract.bindings.length, "RE001 target binding set is incomplete");
  let updated = text;
  for (const binding of [...located].sort((left, right) => right.valueOffset - left.valueOffset)) {
    const target = targetByProperty.get(binding.property);
    invariant(SHA256.test(target || ""), `${binding.property}: target evidence SHA-256 is invalid`);
    updated =
      `${updated.slice(0, binding.valueOffset)}`
      + target
      + updated.slice(binding.valueEnd);
  }
  invariant(
    redactRe001TimelineEvidencePins(updated, contract)
      === redactRe001TimelineEvidencePins(text, contract),
    "RE001 timeline update attempted to change semantics outside the three allowlisted SHA literals",
  );
  const updatedBindings = locateBindings(updated, contract);
  for (const binding of updatedBindings) {
    invariant(
      binding.currentSha256 === targetByProperty.get(binding.property),
      `${binding.property}: generated binding does not equal current evidence bytes`,
    );
  }
  return {updated, beforeBindings: located, afterBindings: updatedBindings};
}

export async function planRe001TimelineEvidencePinRefresh({
  root = PROJECT_ROOT,
  contract = RE001_TIMELINE_EVIDENCE_PIN_CONTRACT,
} = {}) {
  validateContract(contract);
  const timeline = await resolveRegularFile(root, contract.timelinePath, "RE001 timeline");
  const [beforeBytes, ...targets] = await Promise.all([
    readFile(timeline.file),
    ...contract.bindings.map((binding) => readEvidence(root, binding, contract)),
  ]);
  const beforeText = beforeBytes.toString("utf8");
  const replacement = replaceBindings(beforeText, targets, contract);
  const beforeSha256 = sha256(beforeBytes);
  const updatedBytes = Buffer.from(replacement.updated, "utf8");
  const updatedSha256 = sha256(updatedBytes);
  const changedProperties = replacement.afterBindings
    .filter((binding, index) =>
      binding.currentSha256 !== replacement.beforeBindings[index].currentSha256)
    .map(({property}) => property);
  return {
    timelineFile: timeline.file,
    timelinePath: contract.timelinePath,
    mode: timeline.mode,
    beforeBytes,
    beforeText,
    beforeSha256,
    updatedBytes,
    updatedText: replacement.updated,
    updatedSha256,
    changed: beforeSha256 !== updatedSha256,
    changedProperties,
    evidenceTargets: targets,
    bindings: replacement.afterBindings.map(({property, evidencePath, currentSha256}) => ({
      property,
      evidencePath,
      sha256: currentSha256,
    })),
    approvalEffect: APPROVAL_EFFECT,
  };
}

async function verifyEvidenceTargetsCurrent(targets) {
  for (const target of targets) {
    const [linkInfo, fileInfo, actual, bytes] = await Promise.all([
      lstat(target.file),
      stat(target.file),
      realpath(target.file),
      readFile(target.file),
    ]);
    invariant(!linkInfo.isSymbolicLink(), `${target.property}: evidence became a symbolic link`);
    invariant(fileInfo.isFile(), `${target.property}: evidence is no longer a regular file`);
    invariant(actual === target.file, `${target.property}: evidence path drifted before commit`);
    invariant(
      sha256(bytes) === target.sha256,
      `${target.property}: evidence changed after preflight; CAS refused the write`,
    );
  }
}

export async function atomicCasWriteRe001TimelinePlan(plan) {
  const lock = `${plan.timelineFile}.re001-evidence-pin.lock`;
  const temporary =
    `${plan.timelineFile}.re001-evidence-pin-${process.pid}-${randomUUID()}.tmp`;
  let lockHandle;
  let temporaryHandle;
  try {
    lockHandle = await open(lock, "wx", 0o600);
    const currentBefore = await readFile(plan.timelineFile);
    invariant(
      sha256(currentBefore) === plan.beforeSha256,
      "RE001 timeline changed after preflight; CAS refused the write",
    );
    await verifyEvidenceTargetsCurrent(plan.evidenceTargets);
    temporaryHandle = await open(temporary, "wx", plan.mode);
    await temporaryHandle.writeFile(plan.updatedBytes);
    await temporaryHandle.sync();
    await temporaryHandle.close();
    temporaryHandle = null;
    await chmod(temporary, plan.mode);
    const currentAtCommit = await readFile(plan.timelineFile);
    invariant(
      sha256(currentAtCommit) === plan.beforeSha256,
      "RE001 timeline changed before atomic commit; CAS refused the write",
    );
    await verifyEvidenceTargetsCurrent(plan.evidenceTargets);
    await rename(temporary, plan.timelineFile);
    const committed = await readFile(plan.timelineFile);
    invariant(
      sha256(committed) === plan.updatedSha256,
      "RE001 timeline atomic commit hash mismatch",
    );
  } finally {
    await temporaryHandle?.close().catch(() => {});
    await lockHandle?.close().catch(() => {});
    await unlink(temporary).catch(() => {});
    await unlink(lock).catch(() => {});
  }
}

export async function refreshRe001TimelineEvidencePins({
  root = PROJECT_ROOT,
  contract = RE001_TIMELINE_EVIDENCE_PIN_CONTRACT,
  check = false,
} = {}) {
  const plan = await planRe001TimelineEvidencePinRefresh({root, contract});
  if (check) {
    invariant(
      !plan.changed,
      `RE001 timeline evidence pins are stale (${plan.changedProperties.join(", ")}); `
        + "run refresh-re001-timeline-evidence-pins.mjs",
    );
    return {...plan, action: "verified"};
  }
  if (plan.changed) await atomicCasWriteRe001TimelinePlan(plan);
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
  return `Usage: node scripts/refresh-re001-timeline-evidence-pins.mjs [--check]\n\n`
    + "Re-hashes exactly the current RE001 scenario inventory, strict-readiness report,\n"
    + "and audio-runtime evidence, then atomically refreshes only their three allowlisted\n"
    + "SHA-256 literals in the RE001 pure timeline. Source, renderer behavior, migration\n"
    + "status, reviews, and approvals are never changed. Current-JavaScript approval\n"
    + "remains stale and requires a new human approval after the JavaScript stabilizes.";
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) return console.log(usage());
    const result = await refreshRe001TimelineEvidencePins(options);
    console.log(JSON.stringify({
      action: result.action,
      timeline: result.timelinePath,
      beforeSha256: result.beforeSha256,
      afterSha256: result.updatedSha256,
      changedProperties: result.changedProperties,
      bindings: result.bindings,
      approvalEffect: result.approvalEffect,
    }, null, 2));
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) await main();
