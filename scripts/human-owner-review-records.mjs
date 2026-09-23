import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, readdir, realpath, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {PNG} from "pngjs";

import {
  CANONICAL_PROJECTION_ENCODING,
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";
import {
  IMPLEMENTATION_CAPTURE_SCHEMA_VERSION,
  collectImplementationArtifactClosure,
  implementationArtifactClosureErrors,
  implementationCaptureGeneratorProvenanceErrors,
} from "./implementation-artifact-closure.mjs";
import {
  classifyStrictFullDomainRequirement,
  validateSupplementalPartialRequirementBoundary,
} from "./lib/strict-full-domain-requirement.mjs";
import {validateRequirementCoverageGroups} from "./lib/trace-frame-selection.mjs";

export const HUMAN_VISUAL_REVIEW_INPUT_SCHEMA_VERSION = 1;
export const HUMAN_VISUAL_REVIEW_RECORD_SCHEMA_VERSION = 1;
export const OWNER_REVIEW_RECORD_SCHEMA_VERSION = 1;
export const HUMAN_VISUAL_REVIEW_SCOPE = "all-keyframe-and-full-frame-diffs";
export const HUMAN_VISUAL_REVIEW_ATTESTATION =
  "I personally reviewed every requirement, frame comparison, diff, and contact-sheet page bound by this record.";
export const OWNER_REVIEW_SCOPE =
  "human-review-audio-behavior-product-quality-and-known-exceptions";
export const OWNER_REVIEW_ATTESTATION =
  "I am the owner or an authorized owner representative, and I personally reviewed the exact evidence and exceptions bound by this record.";

const INPUT_EVIDENCE_TYPE = "human-visual-review-input";
const HUMAN_RECORD_EVIDENCE_TYPE = "human-visual-review-record";
const OWNER_RECORD_EVIDENCE_TYPE = "owner-acceptance-record";
const INPUT_ROOT = "evidence/review-inputs";
const HUMAN_ROOT = "evidence/reviews/human";
const OWNER_ROOT = "evidence/reviews/owner";
const ARTIFACT_SET_ALGORITHM = "sha256-canonical-review-artifact-rows-json-v1";
const AUTOMATION_IDENTITY_PATTERN =
  /(?:^|[^a-z])(?:ai|llm|gpt|model|robot|codex|chatgpt|openai|service account|artificial intelligence|large language model|continuous integration|ci|automation|automated|bot|script|generator|machine|agent)(?:$|[^a-z])/i;
const TIMEZONE_TIMESTAMP_PATTERN =
  /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})T(?<hour>\d{2}):(?<minute>\d{2}):(?<second>\d{2})(?:\.(?<millisecond>\d{1,3}))?(?<zone>Z|[+-](?<offsetHour>\d{2}):(?<offsetMinute>\d{2}))$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const PROJECT_ROOT_PREFIX_PATTERN =
  /^(?:apps|artifacts|catalog|components|lib|migrations|output|packages|public|reports|schemas|scripts)\//;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isInside(root, target) {
  const relative = path.relative(root, target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function normalizeProjectPath(value) {
  return portable(path.normalize(String(value || ""))).replace(/^\.\//, "");
}

function projectRelative(projectRoot, filePath) {
  const relative = path.relative(projectRoot, filePath);
  invariant(relative && !relative.startsWith("..") && !path.isAbsolute(relative), `Path escapes the project root: ${filePath}`);
  return portable(relative);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function stableReviewJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function assertExactKeys(value, keys, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  invariant(JSON.stringify(actual) === JSON.stringify(expected), `${label} keys differ; expected ${expected.join(", ")}`);
}

function assertNonEmptyString(value, label) {
  invariant(typeof value === "string" && value.trim(), `${label} must be a non-empty string`);
}

function assertSha256(value, label) {
  invariant(SHA256_PATTERN.test(value || ""), `${label} must be a lowercase SHA-256`);
}

function assertTimezoneTimestamp(value, label, now = Date.now()) {
  const match = typeof value === "string" ? TIMEZONE_TIMESTAMP_PATTERN.exec(value) : null;
  invariant(match, `${label} must be an ISO timestamp with an explicit timezone`);
  const year = Number(match.groups.year);
  const month = Number(match.groups.month);
  const day = Number(match.groups.day);
  const hour = Number(match.groups.hour);
  const minute = Number(match.groups.minute);
  const second = Number(match.groups.second);
  const offsetHour = match.groups.zone === "Z" ? 0 : Number(match.groups.offsetHour);
  const offsetMinute = match.groups.zone === "Z" ? 0 : Number(match.groups.offsetMinute);
  invariant(year >= 1 && month >= 1 && month <= 12, `${label} has an invalid calendar date`);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  invariant(day >= 1 && day <= daysInMonth, `${label} has an invalid calendar date`);
  invariant(hour <= 23 && minute <= 59 && second <= 59, `${label} has an invalid clock time`);
  invariant(
    offsetHour <= 14 && offsetMinute <= 59 && !(offsetHour === 14 && offsetMinute !== 0),
    `${label} has an invalid timezone offset`,
  );
  const timestamp = Date.parse(value);
  invariant(Number.isFinite(timestamp), `${label} is invalid`);
  invariant(timestamp <= now, `${label} must not be in the future`);
  return timestamp;
}

function assertSortedUniqueStrings(values, label) {
  invariant(Array.isArray(values) && values.length > 0, `${label} must be a non-empty array`);
  for (const value of values) assertNonEmptyString(value, `${label} item`);
  const sorted = [...new Set(values)].sort();
  invariant(sorted.length === values.length && JSON.stringify(sorted) === JSON.stringify(values), `${label} must be unique and sorted`);
}

async function assertSafeExistingFile(projectRoot, filePath, label) {
  const resolvedProjectRoot = path.resolve(projectRoot);
  const resolvedFile = path.resolve(filePath);
  const relative = projectRelative(resolvedProjectRoot, resolvedFile);
  let cursor = resolvedProjectRoot;
  for (const component of relative.split("/")) {
    cursor = path.join(cursor, component);
    const metadata = await lstat(cursor);
    invariant(!metadata.isSymbolicLink(), `${label} path contains a symbolic link: ${portable(path.relative(resolvedProjectRoot, cursor))}`);
  }
  const [realProjectRoot, realFile] = await Promise.all([realpath(resolvedProjectRoot), realpath(resolvedFile)]);
  invariant(isInside(realProjectRoot, realFile), `${label} resolves outside the project root: ${relative}`);
  const metadata = await stat(realFile);
  invariant(metadata.isFile(), `${label} is not a regular file: ${relative}`);
  return {absolutePath: resolvedFile, relativePath: relative, metadata};
}

async function assertSafeWorkspace(projectRoot, workspace) {
  const resolvedProjectRoot = path.resolve(projectRoot);
  const resolvedWorkspace = path.resolve(workspace);
  invariant(isInside(resolvedProjectRoot, resolvedWorkspace) && resolvedWorkspace !== resolvedProjectRoot, "Migration workspace must be inside the project root");
  const relative = projectRelative(resolvedProjectRoot, resolvedWorkspace);
  let cursor = resolvedProjectRoot;
  for (const component of relative.split("/")) {
    cursor = path.join(cursor, component);
    const metadata = await lstat(cursor);
    invariant(!metadata.isSymbolicLink(), `Migration workspace path contains a symbolic link: ${portable(path.relative(resolvedProjectRoot, cursor))}`);
    invariant(metadata.isDirectory(), `Migration workspace path component is not a directory: ${portable(path.relative(resolvedProjectRoot, cursor))}`);
  }
  const [realProjectRoot, realWorkspace] = await Promise.all([realpath(resolvedProjectRoot), realpath(resolvedWorkspace)]);
  invariant(isInside(realProjectRoot, realWorkspace), "Migration workspace resolves outside the project root");
  return {projectRoot: resolvedProjectRoot, workspace: resolvedWorkspace};
}

async function ensureSafeDirectory(projectRoot, workspace, relativeDirectory) {
  const safe = await assertSafeWorkspace(projectRoot, workspace);
  const target = path.resolve(safe.workspace, relativeDirectory);
  invariant(isInside(safe.workspace, target), `Review output directory escapes the migration workspace: ${relativeDirectory}`);
  let cursor = safe.workspace;
  for (const component of normalizeProjectPath(relativeDirectory).split("/")) {
    cursor = path.join(cursor, component);
    try {
      const metadata = await lstat(cursor);
      invariant(!metadata.isSymbolicLink(), `Review output path contains a symbolic link: ${portable(path.relative(safe.projectRoot, cursor))}`);
      invariant(metadata.isDirectory(), `Review output path component is not a directory: ${portable(path.relative(safe.projectRoot, cursor))}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await mkdir(cursor);
    }
  }
  const realTarget = await realpath(target);
  const realWorkspace = await realpath(safe.workspace);
  invariant(isInside(realWorkspace, realTarget), `Review output directory resolves outside the migration workspace: ${relativeDirectory}`);
  return target;
}

function resolveProjectDescriptorPath(projectRoot, value, label) {
  assertNonEmptyString(value, `${label}.path`);
  invariant(!path.isAbsolute(value), `${label}.path must be project-relative`);
  const normalized = normalizeProjectPath(value);
  invariant(normalized !== ".." && !normalized.startsWith("../"), `${label}.path escapes the project root`);
  const resolved = path.resolve(projectRoot, normalized);
  invariant(isInside(path.resolve(projectRoot), resolved), `${label}.path escapes the project root`);
  return resolved;
}

function resolveEvidenceReference(projectRoot, referringFile, value, label) {
  assertNonEmptyString(value, label);
  invariant(!path.isAbsolute(value), `${label} must not be absolute`);
  const normalized = normalizeProjectPath(value);
  invariant(normalized !== ".." && !normalized.startsWith("../"), `${label} escapes the project root`);
  const resolved = PROJECT_ROOT_PREFIX_PATTERN.test(normalized)
    ? path.resolve(projectRoot, normalized)
    : path.resolve(path.dirname(referringFile), normalized);
  invariant(isInside(path.resolve(projectRoot), resolved), `${label} escapes the project root`);
  return resolved;
}

async function descriptorForFile(projectRoot, filePath, label) {
  const safe = await assertSafeExistingFile(projectRoot, filePath, label);
  const bytes = await readFile(safe.absolutePath);
  return {
    path: safe.relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

function assertDescriptorShape(descriptor, label) {
  assertExactKeys(descriptor, ["path", "bytes", "sha256"], label);
  assertNonEmptyString(descriptor.path, `${label}.path`);
  invariant(!path.isAbsolute(descriptor.path), `${label}.path must be project-relative`);
  const normalized = normalizeProjectPath(descriptor.path);
  invariant(
    normalized === descriptor.path && normalized !== ".." && !normalized.startsWith("../"),
    `${label}.path must be a canonical project-relative path`,
  );
  invariant(Number.isInteger(descriptor.bytes) && descriptor.bytes >= 0, `${label}.bytes is invalid`);
  assertSha256(descriptor.sha256, `${label}.sha256`);
}

async function verifyDescriptor(projectRoot, descriptor, label) {
  assertDescriptorShape(descriptor, label);
  const filePath = resolveProjectDescriptorPath(projectRoot, descriptor.path, label);
  const current = await descriptorForFile(projectRoot, filePath, label);
  invariant(
    current.bytes === descriptor.bytes && current.sha256 === descriptor.sha256,
    `${label} bytes are stale: ${descriptor.path}`,
  );
  return {descriptor: current, filePath};
}

async function readJsonFile(projectRoot, filePath, label) {
  const safe = await assertSafeExistingFile(projectRoot, filePath, label);
  const bytes = await readFile(safe.absolutePath);
  const descriptor = {
    path: safe.relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
  return {descriptor, value};
}

async function descriptorForPng(projectRoot, filePath, label, {
  expectedWidth,
  expectedHeight,
} = {}) {
  const safe = await assertSafeExistingFile(projectRoot, filePath, label);
  const bytes = await readFile(safe.absolutePath);
  let image;
  try {
    image = PNG.sync.read(bytes);
  } catch (error) {
    throw new Error(`${label} is not a decodable PNG: ${error.message}`);
  }
  invariant(image.width > 0 && image.height > 0, `${label} has invalid PNG dimensions`);
  if (expectedWidth !== undefined || expectedHeight !== undefined) {
    invariant(
      image.width === expectedWidth && image.height === expectedHeight,
      `${label} is ${image.width}x${image.height}; expected ${expectedWidth}x${expectedHeight}`,
    );
  }
  return {
    descriptor: {
      path: safe.relativePath,
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
    width: image.width,
    height: image.height,
  };
}

function addArtifact(artifacts, descriptor, label) {
  assertDescriptorShape(descriptor, label);
  const existing = artifacts.get(descriptor.path);
  invariant(
    !existing || (existing.bytes === descriptor.bytes && existing.sha256 === descriptor.sha256),
    `${label} conflicts with another artifact binding for ${descriptor.path}`,
  );
  artifacts.set(descriptor.path, descriptor);
}

function reviewArtifactRowsSha256(rows) {
  const canonicalRows = [...rows]
    .map(({path: artifactPath, bytes, sha256: digest}) => ({
      path: artifactPath,
      bytes,
      sha256: digest,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
  return sha256(`${JSON.stringify(canonicalRows)}\n`);
}

function artifactSet(artifacts) {
  const rows = [...artifacts.values()]
    .map(({path: artifactPath, bytes, sha256: digest}) => ({path: artifactPath, bytes, sha256: digest}))
    .sort((left, right) => left.path.localeCompare(right.path));
  return {
    schemaVersion: 1,
    algorithm: ARTIFACT_SET_ALGORITHM,
    artifactCount: rows.length,
    totalBytes: rows.reduce((sum, row) => sum + row.bytes, 0),
    aggregateSha256: reviewArtifactRowsSha256(rows),
    artifacts: rows,
  };
}

function assertArtifactSetShape(value, label) {
  assertExactKeys(value, ["schemaVersion", "algorithm", "artifactCount", "totalBytes", "aggregateSha256", "artifacts"], label);
  invariant(value.schemaVersion === 1, `${label}.schemaVersion must be 1`);
  invariant(value.algorithm === ARTIFACT_SET_ALGORITHM, `${label}.algorithm is unsupported`);
  invariant(Array.isArray(value.artifacts) && value.artifacts.length > 0, `${label}.artifacts must be non-empty`);
  const rows = value.artifacts;
  for (const [index, row] of rows.entries()) assertDescriptorShape(row, `${label}.artifacts[${index}]`);
  const sorted = [...rows].sort((left, right) => left.path.localeCompare(right.path));
  invariant(JSON.stringify(sorted) === JSON.stringify(rows), `${label}.artifacts must be path-sorted`);
  invariant(new Set(rows.map((row) => row.path)).size === rows.length, `${label}.artifacts contains duplicate paths`);
  invariant(value.artifactCount === rows.length, `${label}.artifactCount differs from artifacts`);
  invariant(value.totalBytes === rows.reduce((sum, row) => sum + row.bytes, 0), `${label}.totalBytes differs from artifacts`);
  invariant(value.aggregateSha256 === reviewArtifactRowsSha256(rows), `${label}.aggregateSha256 differs from artifacts`);
}

function directoryDigest(frames) {
  return sha256(frames.map(({frame, sha256: digest}) => `${frame}\0${digest}\n`).join(""));
}

async function inspectImplementationCapture({
  projectRoot,
  manifest,
  captureManifest,
  currentClosure,
  artifacts,
}) {
  const capturePath = resolveProjectDescriptorPath(projectRoot, captureManifest, "capture manifest");
  const parsed = await readJsonFile(projectRoot, capturePath, "schema-v4 implementation capture");
  addArtifact(artifacts, parsed.descriptor, "schema-v4 implementation capture");
  const capture = parsed.value;
  invariant(capture.schemaVersion === IMPLEMENTATION_CAPTURE_SCHEMA_VERSION, `Implementation capture schemaVersion must be ${IMPLEMENTATION_CAPTURE_SCHEMA_VERSION}`);
  invariant(capture.status === "complete", "Implementation capture status must be complete");
  const generatorErrors = implementationCaptureGeneratorProvenanceErrors(capture.generatorProvenance);
  invariant(generatorErrors.length === 0, `Implementation capture generator provenance is invalid: ${generatorErrors.join("; ")}`);
  invariant(capture.animationId === manifest.animationId, "Implementation capture animationId differs from migration");
  for (const key of ["requirementId", "frameDomainId", "traceId", "entryStateSha256", "scenario", "language"]) {
    assertNonEmptyString(capture[key], `Implementation capture ${key}`);
  }
  assertSha256(capture.entryStateSha256, "Implementation capture entryStateSha256");
  assertNonEmptyString(String(capture.seed ?? ""), "Implementation capture seed");
  for (const field of ["consoleErrors", "failedRequests", "httpErrors", "unexpectedRequests"]) {
    invariant(Array.isArray(capture[field]) && capture[field].length === 0, `Implementation capture ${field} must be an empty array`);
  }
  const closureErrors = implementationArtifactClosureErrors(capture.implementationArtifactClosure, currentClosure);
  invariant(closureErrors.length === 0, `Implementation capture artifact closure is stale: ${closureErrors.join("; ")}`);
  invariant(Array.isArray(capture.captured) && capture.captured.length > 0, "Implementation capture must contain frames");
  const frames = new Map();
  for (const [index, frame] of capture.captured.entries()) {
    invariant(Number.isInteger(frame.frame) && frame.frame >= 1, `Implementation capture frame ${index + 1} is invalid`);
    invariant(!frames.has(frame.frame), `Implementation capture contains duplicate frame ${frame.frame}`);
    assertSha256(frame.sha256, `Implementation capture frame ${frame.frame} SHA-256`);
    const framePath = resolveEvidenceReference(projectRoot, capturePath, frame.file, `Implementation capture frame ${frame.frame} file`);
    const png = await descriptorForPng(projectRoot, framePath, `Implementation capture frame ${frame.frame}`, {
      expectedWidth: manifest.runtime?.stage?.width,
      expectedHeight: manifest.runtime?.stage?.height,
    });
    const descriptor = png.descriptor;
    invariant(descriptor.sha256 === frame.sha256, `Implementation capture frame ${frame.frame} PNG hash is stale`);
    if (frame.width !== undefined || frame.height !== undefined) {
      invariant(frame.width === png.width && frame.height === png.height, `Implementation capture frame ${frame.frame} PNG metadata is stale`);
    }
    addArtifact(artifacts, descriptor, `Implementation capture frame ${frame.frame}`);
    frames.set(frame.frame, descriptor);
  }
  const orderedFrames = [...frames.keys()].sort((left, right) => left - right);
  invariant(
    orderedFrames.every((frame, index) => frame === index + 1),
    "Implementation capture frames must be a complete one-indexed sequence",
  );
  return {capturePath, descriptor: parsed.descriptor, capture, frames, orderedFrames};
}

async function inspectMetrics({
  projectRoot,
  manifest,
  metricsFile,
  captureInspection,
  artifacts,
}) {
  const metricsPath = resolveProjectDescriptorPath(projectRoot, metricsFile, "metrics report");
  const parsed = await readJsonFile(projectRoot, metricsPath, "schema-v2 metrics report");
  addArtifact(artifacts, parsed.descriptor, "schema-v2 metrics report");
  const metrics = parsed.value;
  invariant(metrics.schemaVersion === 2 && metrics.status === "complete", "Metrics report must be schemaVersion 2 complete");
  invariant(metrics.evidenceType === "full-frame-directory-comparison", "Metrics evidenceType is invalid");
  invariant(metrics.animationId === manifest.animationId, "Metrics animationId differs from migration");
  for (const key of ["requirementId", "frameDomainId", "traceId", "entryStateSha256", "scenario", "language"]) {
    invariant(metrics[key] === captureInspection.capture[key], `Metrics ${key} differs from implementation capture`);
  }
  invariant(String(metrics.seed) === String(captureInspection.capture.seed), "Metrics seed differs from implementation capture");
  invariant(
    metrics.implementationCaptureManifestSha256 === captureInspection.descriptor.sha256,
    "Metrics implementation capture SHA-256 differs from schema-v4 capture",
  );
  const declaredCapturePath = resolveEvidenceReference(
    projectRoot,
    metricsPath,
    metrics.implementationCaptureManifest,
    "Metrics implementationCaptureManifest",
  );
  invariant(declaredCapturePath === captureInspection.capturePath, "Metrics implementation capture path differs from schema-v4 capture");
  invariant(Array.isArray(metrics.frames) && metrics.frames.length === captureInspection.orderedFrames.length, "Metrics frame count differs from implementation capture");

  const baselineCapturePath = resolveEvidenceReference(
    projectRoot,
    metricsPath,
    metrics.baselineCaptureManifest,
    "Metrics baselineCaptureManifest",
  );
  const baselineCapture = await descriptorForFile(projectRoot, baselineCapturePath, "baseline capture manifest");
  invariant(baselineCapture.sha256 === metrics.baselineCaptureManifestSha256, "Metrics baseline capture manifest hash is stale");
  addArtifact(artifacts, baselineCapture, "baseline capture manifest");

  const baselineFrames = [];
  const implementationFrames = [];
  const diffFrames = [];
  const seenFrames = new Set();
  for (const [index, frame] of metrics.frames.entries()) {
    invariant(Number.isInteger(frame.frame) && frame.frame >= 1 && !seenFrames.has(frame.frame), `Metrics frame ${index + 1} is invalid or duplicate`);
    seenFrames.add(frame.frame);
    const expectedImplementation = captureInspection.frames.get(frame.frame);
    invariant(expectedImplementation, `Metrics frame ${frame.frame} is absent from implementation capture`);
    for (const [kind, fileField, hashField, target] of [
      ["baseline", "baselineFile", "baselineSha256", baselineFrames],
      ["implementation", "implementationFile", "implementationSha256", implementationFrames],
      ["diff", "diffFile", "diffSha256", diffFrames],
    ]) {
      assertSha256(frame[hashField], `Metrics frame ${frame.frame} ${kind} SHA-256`);
      const filePath = resolveEvidenceReference(projectRoot, metricsPath, frame[fileField], `Metrics frame ${frame.frame} ${kind} file`);
      const png = await descriptorForPng(projectRoot, filePath, `Metrics frame ${frame.frame} ${kind}`, {
        expectedWidth: manifest.runtime?.stage?.width,
        expectedHeight: manifest.runtime?.stage?.height,
      });
      const descriptor = png.descriptor;
      invariant(descriptor.sha256 === frame[hashField], `Metrics frame ${frame.frame} ${kind} bytes are stale`);
      addArtifact(artifacts, descriptor, `Metrics frame ${frame.frame} ${kind}`);
      target.push({frame: frame.frame, sha256: descriptor.sha256});
      if (kind === "implementation") {
        invariant(
          descriptor.path === expectedImplementation.path && descriptor.sha256 === expectedImplementation.sha256,
          `Metrics frame ${frame.frame} implementation does not match schema-v4 capture`,
        );
      }
    }
    invariant(
      frame.width === manifest.runtime?.stage?.width
        && frame.height === manifest.runtime?.stage?.height,
      `Metrics frame ${frame.frame} PNG metadata does not match the native stage`,
    );
  }
  for (const [label, declared, rows] of [
    ["baseline", metrics.inputs?.baseline?.directorySha256, baselineFrames],
    ["implementation", metrics.inputs?.implementation?.directorySha256, implementationFrames],
    ["diff", metrics.diffArchive?.directorySha256, diffFrames],
  ]) {
    assertSha256(declared, `Metrics ${label} directory SHA-256`);
    invariant(declared === directoryDigest(rows), `Metrics ${label} directory digest is stale`);
  }
  invariant(metrics.summary?.frameCount === metrics.frames.length, "Metrics summary frameCount differs from frames");
  const requiredRange = metrics.contract?.requiredRange;
  invariant(
    requiredRange?.firstFrame === 1 && requiredRange?.lastFrame === metrics.frames.length,
    "Metrics requiredRange must cover every one-indexed frame",
  );
  return {
    metricsPath,
    descriptor: parsed.descriptor,
    metrics,
    baselineCapture,
    requiredRange,
  };
}

async function inspectContactSheet({
  projectRoot,
  manifest,
  contactSheetManifest,
  captureInspection,
  metricsInspection,
  artifacts,
}) {
  const contactPath = resolveProjectDescriptorPath(projectRoot, contactSheetManifest, "contact-sheet manifest");
  const parsed = await readJsonFile(projectRoot, contactPath, "contact-sheet manifest");
  addArtifact(artifacts, parsed.descriptor, "contact-sheet manifest");
  const contact = parsed.value;
  invariant(contact.schemaVersion === 1 && contact.evidenceType === "full-frame-contact-sheet", "Contact-sheet manifest schema/evidenceType is invalid");
  invariant(contact.animationId === manifest.animationId, "Contact-sheet animationId differs from migration");
  const comparison = contact.sourceEvidence?.comparison;
  assertSha256(comparison?.sha256, "Contact-sheet comparison SHA-256");
  const comparisonPath = resolveEvidenceReference(projectRoot, contactPath, comparison?.file, "Contact-sheet comparison file");
  invariant(
    comparisonPath === metricsInspection.metricsPath && comparison.sha256 === metricsInspection.descriptor.sha256,
    "Contact-sheet comparison binding differs from metrics report",
  );
  const implementationCapture = contact.sourceEvidence?.implementationCaptureManifest;
  assertSha256(implementationCapture?.sha256, "Contact-sheet implementation capture SHA-256");
  const implementationCapturePath = resolveEvidenceReference(
    projectRoot,
    contactPath,
    implementationCapture?.file,
    "Contact-sheet implementation capture file",
  );
  invariant(
    implementationCapturePath === captureInspection.capturePath
      && implementationCapture.sha256 === captureInspection.descriptor.sha256,
    "Contact-sheet implementation capture binding differs from schema-v4 capture",
  );
  invariant(Array.isArray(contact.pages) && contact.pages.length > 0, "Contact-sheet manifest must contain pages");
  const representedFrames = [];
  for (const [index, page] of contact.pages.entries()) {
    invariant(Number.isInteger(page.page) && page.page === index + 1, `Contact-sheet page ${index + 1} number is invalid`);
    assertSha256(page.sha256, `Contact-sheet page ${page.page} SHA-256`);
    const pagePath = resolveEvidenceReference(projectRoot, contactPath, page.file, `Contact-sheet page ${page.page} file`);
    const png = await descriptorForPng(projectRoot, pagePath, `Contact-sheet page ${page.page}`, {
      expectedWidth: page.width,
      expectedHeight: page.height,
    });
    const descriptor = png.descriptor;
    invariant(descriptor.sha256 === page.sha256, `Contact-sheet page ${page.page} bytes are stale`);
    addArtifact(artifacts, descriptor, `Contact-sheet page ${page.page}`);
    invariant(Array.isArray(page.frames) && page.frames.length > 0, `Contact-sheet page ${page.page} frames are missing`);
    representedFrames.push(...page.frames);
  }
  invariant(
    JSON.stringify(representedFrames) === JSON.stringify(captureInspection.orderedFrames),
    "Contact-sheet pages do not represent every frame exactly once in order",
  );
  invariant(contact.contract?.frameCount === captureInspection.orderedFrames.length, "Contact-sheet frameCount differs from capture");
  invariant(
    contact.contract?.stage?.width === manifest.runtime?.stage?.width
      && contact.contract?.stage?.height === manifest.runtime?.stage?.height,
    "Contact-sheet stage differs from migration",
  );
  for (const key of [
    "comparisonSummaryRecomputed",
    "completeSequentialFrameCoverage",
    "everyFrameRepresentedExactlyOnce",
    "implementationCaptureHashesMatchActualPngs",
    "diffHashesMatchActualPngs",
    "nativeStageDimensionsMatch",
    "captureStatusComplete",
  ]) {
    invariant(contact.verification?.[key] === true, `Contact-sheet verification.${key} must be true`);
  }
  return {contactPath, descriptor: parsed.descriptor, contact};
}

function requirementIdentity(capture, requiredRange) {
  return {
    requirementId: capture.requirementId,
    frameDomainId: capture.frameDomainId,
    traceId: capture.traceId,
    entryStateSha256: capture.entryStateSha256,
    scenario: capture.scenario,
    language: capture.language,
    seed: String(capture.seed),
    requiredRange,
  };
}

async function assertCurrentTechnicalManifest({projectRoot, workspace, manifest}) {
  const manifestPath = path.join(workspace, "migration.json");
  const current = await readJsonFile(projectRoot, manifestPath, "current migration manifest");
  invariant(current.value?.animationId === manifest.animationId, "Current migration manifest animationId differs from the supplied manifest");
  invariant(
    technicalManifestSha256(current.value) === technicalManifestSha256(manifest),
    "Supplied manifest technical projection differs from current migration.json",
  );
  return {path: manifestPath, value: current.value};
}

function canonicalExpectedRequirementIds(values, label = "expectedRequirementIds") {
  invariant(Array.isArray(values) && values.length > 0, `${label} must be a non-empty array from current coverage`);
  for (const value of values) assertNonEmptyString(value, `${label} item`);
  invariant(new Set(values).size === values.length, `${label} must not contain duplicates`);
  return [...values].sort();
}

function canonicalExpectedRequirements(requirements, expectedRequirementIds) {
  invariant(
    Array.isArray(requirements) && requirements.length > 0,
    "expectedRequirements must be a non-empty array derived from current validated coverage and contact-sheet bindings",
  );
  const canonical = [...requirements].sort((left, right) => (
    String(left?.requirementId || "").localeCompare(String(right?.requirementId || ""))
  ));
  const ids = canonical.map((requirement) => requirement?.requirementId);
  invariant(
    JSON.stringify(ids) === JSON.stringify(expectedRequirementIds),
    "expectedRequirements do not exactly match expectedRequirementIds",
  );
  return canonical;
}

function frameDomainForRequirement(manifest, identity) {
  const domains = Array.isArray(manifest.implementation?.frameDomains)
    ? manifest.implementation.frameDomains
    : [];
  const domain = domains.find(({id}) => id === identity.frameDomainId);
  if (domain) return domain;
  const defaultDomainId = manifest.implementation?.defaultFrameDomainId || "root";
  if (identity.frameDomainId === defaultDomainId && Number.isInteger(manifest.runtime?.frameCount)) {
    return {
      id: defaultDomainId,
      frameCount: manifest.runtime.frameCount,
      scenarioIds: (manifest.scenarios || []).map(({id}) => id),
    };
  }
  throw new Error(`Review requirement ${identity.requirementId} uses unknown frame domain ${identity.frameDomainId}`);
}

async function currentReviewCoverage({
  projectRoot,
  workspace,
  manifest,
}) {
  const coverageRelative = manifest.evidence?.fullFrameCoverageFile;
  assertNonEmptyString(coverageRelative, "migration evidence.fullFrameCoverageFile");
  const coveragePath = await resolveCurrentCoverageReference({
    projectRoot,
    workspace,
    value: coverageRelative,
    label: "current full-frame coverage",
  });
  const coverage = (await readJsonFile(projectRoot, coveragePath, "current full-frame coverage")).value;
  invariant(coverage.animationId === manifest.animationId, "Current full-frame coverage animationId differs from migration");
  invariant(coverage.schemaVersion === 1 || coverage.schemaVersion === 2, "Current full-frame coverage schemaVersion must be 1 or 2");
  const rows = coverage.schemaVersion === 2 ? coverage.requirements : coverage.combinations;
  invariant(Array.isArray(rows) && rows.length > 0, "Current full-frame coverage has no requirements");

  if (coverage.schemaVersion === 2) {
    const frameCountsByDomain = Object.fromEntries(rows.map((row) => {
      const domain = frameDomainForRequirement(manifest, row);
      return [domain.id, domain.frameCount];
    }));
    validateRequirementCoverageGroups(rows, frameCountsByDomain);
  }

  const canonicalRows = [];
  const supplementalPartialRows = [];
  const seenTraceKeys = new Set();
  for (const [index, row] of rows.entries()) {
    const label = coverage.schemaVersion === 2
      ? `coverage requirement ${index + 1} (${row?.requirementId || "unknown"})`
      : `coverage combination ${index + 1}`;
    const domain = coverage.schemaVersion === 2
      ? frameDomainForRequirement(manifest, row)
      : {
          id: manifest.implementation?.defaultFrameDomainId || "root",
          frameCount: manifest.runtime?.frameCount,
        };
    const selectionRequirement = coverage.schemaVersion === 2
      ? row
      : {
          requiredRange: {
            firstFrame: row?.firstFrame,
            lastFrame: row?.lastFrame,
          },
          coverageRole: "full-domain",
        };
    if (coverage.schemaVersion === 2) {
      assertNonEmptyString(row.traceId, `${label} traceId`);
      const traceKey = `${row.frameDomainId}\0${row.traceId}\0${row.language}`;
      invariant(!seenTraceKeys.has(traceKey), `${label} duplicates a frameDomainId/traceId/language requirement`);
      seenTraceKeys.add(traceKey);
      invariant(
        domain.scenarioIds?.includes(row.scenario),
        `${label} scenario is not declared for ${row.frameDomainId}`,
      );
      invariant(
        (manifest.localization?.languages || []).includes(row.language),
        `${label} language is not declared by the current migration`,
      );
    }
    const classification = classifyStrictFullDomainRequirement(
      selectionRequirement,
      domain.frameCount,
      label,
    );
    if (classification.eligible) {
      canonicalRows.push(row);
    } else {
      validateSupplementalPartialRequirementBoundary(row, classification.selection, label);
      supplementalPartialRows.push(row);
    }
  }
  invariant(
    canonicalRows.length > 0,
    "Current full-frame coverage has no canonical full-domain requirements eligible for human/owner review",
  );
  return {coveragePath, coverage, rows: canonicalRows, supplementalPartialRows};
}

async function resolveCurrentCoverageReference({
  projectRoot,
  workspace,
  value,
  label,
}) {
  assertNonEmptyString(value, label);
  invariant(!path.isAbsolute(value), `${label} must be project- or migration-relative`);
  const normalized = normalizeProjectPath(value);
  const candidates = PROJECT_ROOT_PREFIX_PATTERN.test(normalized) && normalized !== ".." && !normalized.startsWith("../")
    ? [path.resolve(projectRoot, normalized)]
    : [path.resolve(workspace, normalized), path.resolve(projectRoot, normalized)];
  const uniqueCandidates = [...new Set(candidates)].filter((candidate) => isInside(path.resolve(projectRoot), candidate));
  for (const candidate of uniqueCandidates) {
    try {
      await assertSafeExistingFile(projectRoot, candidate, label);
      return candidate;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  throw new Error(`${label} does not exist: ${value}`);
}

async function walkContactSheetManifests(projectRoot, directory) {
  let entries;
  try {
    entries = await readdir(directory, {withFileTypes: true});
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const manifests = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const filePath = path.join(directory, entry.name);
    invariant(!entry.isSymbolicLink(), `Contact-sheet search path contains a symbolic link: ${projectRelative(projectRoot, filePath)}`);
    if (entry.isDirectory()) {
      manifests.push(...await walkContactSheetManifests(projectRoot, filePath));
    } else if (entry.isFile() && entry.name === "manifest.json") {
      manifests.push(filePath);
    }
  }
  return manifests;
}

async function contactSheetMatches({
  projectRoot,
  contactSheetPath,
  capturePath,
  captureDescriptor,
  metricsPath,
  metricsDescriptor,
}) {
  const parsed = await readJsonFile(projectRoot, contactSheetPath, "contact-sheet candidate");
  const value = parsed.value;
  if (value?.schemaVersion !== 1 || value?.evidenceType !== "full-frame-contact-sheet") return false;
  const comparison = value.sourceEvidence?.comparison;
  const implementation = value.sourceEvidence?.implementationCaptureManifest;
  if (!comparison?.file || !implementation?.file) return false;
  let declaredMetricsPath;
  let declaredCapturePath;
  try {
    declaredMetricsPath = resolveEvidenceReference(
      projectRoot,
      contactSheetPath,
      comparison.file,
      "contact-sheet comparison file",
    );
    declaredCapturePath = resolveEvidenceReference(
      projectRoot,
      contactSheetPath,
      implementation.file,
      "contact-sheet implementation capture file",
    );
  } catch {
    return false;
  }
  return declaredMetricsPath === metricsPath
    && declaredCapturePath === capturePath
    && comparison.sha256 === metricsDescriptor.sha256
    && implementation.sha256 === captureDescriptor.sha256;
}

async function findCurrentContactSheetManifest({
  projectRoot,
  workspace,
  declaredContactSheetManifest,
  capturePath,
  captureDescriptor,
  metricsPath,
  metricsDescriptor,
  requirementId,
}) {
  if (declaredContactSheetManifest) {
    const contactSheetPath = await resolveCurrentCoverageReference({
      projectRoot,
      workspace,
      value: declaredContactSheetManifest,
      label: `${requirementId} contactSheetManifest`,
    });
    invariant(
      await contactSheetMatches({
        projectRoot,
        contactSheetPath,
        capturePath,
        captureDescriptor,
        metricsPath,
        metricsDescriptor,
      }),
      `${requirementId}: declared contact-sheet manifest does not bind the exact current capture and metrics`,
    );
    return contactSheetPath;
  }
  const candidates = await walkContactSheetManifests(
    projectRoot,
    path.join(workspace, "evidence", "contact-sheets"),
  );
  const matches = [];
  for (const candidate of candidates) {
    if (await contactSheetMatches({
      projectRoot,
      contactSheetPath: candidate,
      capturePath,
      captureDescriptor,
      metricsPath,
      metricsDescriptor,
    })) matches.push(candidate);
  }
  invariant(
    matches.length === 1,
    `${requirementId}: expected exactly one contact-sheet manifest bound to the current capture and metrics; found ${matches.length}`,
  );
  return matches[0];
}

export async function deriveHumanReviewExpectations({
  projectRoot,
  workspace,
  manifest,
}) {
  const safe = await assertSafeWorkspace(projectRoot, workspace);
  const {coverage, rows: currentRows} = await currentReviewCoverage({
    projectRoot: safe.projectRoot,
    workspace: safe.workspace,
    manifest,
  });
  const specifications = [];
  for (const [index, row] of currentRows.entries()) {
    const rowLabel = coverage.schemaVersion === 2
      ? `coverage requirement ${index + 1}`
      : `coverage combination ${index + 1}`;
    invariant(row?.status === "complete", `${rowLabel} is ${row?.status || "missing"}, not complete`);
    const capturePath = await resolveCurrentCoverageReference({
      projectRoot: safe.projectRoot,
      workspace: safe.workspace,
      value: row.captureManifest,
      label: `${rowLabel} captureManifest`,
    });
    const metricsPath = await resolveCurrentCoverageReference({
      projectRoot: safe.projectRoot,
      workspace: safe.workspace,
      value: row.metricsFile,
      label: `${rowLabel} metricsFile`,
    });
    const captureParsed = await readJsonFile(safe.projectRoot, capturePath, `${rowLabel} implementation capture`);
    const metricsParsed = await readJsonFile(safe.projectRoot, metricsPath, `${rowLabel} metrics`);
    const requirementId = coverage.schemaVersion === 2 ? row.requirementId : captureParsed.value?.requirementId;
    assertNonEmptyString(requirementId, `${rowLabel} requirementId`);
    invariant(captureParsed.value?.requirementId === requirementId, `${rowLabel} capture requirementId differs`);
    if (coverage.schemaVersion === 2) {
      invariant(metricsParsed.value?.requirementId === requirementId, `${rowLabel} metrics requirementId differs`);
      if (row.captureManifestSha256) {
        invariant(row.captureManifestSha256 === captureParsed.descriptor.sha256, `${rowLabel} captureManifestSha256 is stale`);
      }
      if (row.metricsSha256) {
        invariant(row.metricsSha256 === metricsParsed.descriptor.sha256, `${rowLabel} metricsSha256 is stale`);
      }
    }
    const contactSheetPath = await findCurrentContactSheetManifest({
      projectRoot: safe.projectRoot,
      workspace: safe.workspace,
      declaredContactSheetManifest: row.contactSheetManifest,
      capturePath,
      captureDescriptor: captureParsed.descriptor,
      metricsPath,
      metricsDescriptor: metricsParsed.descriptor,
      requirementId,
    });
    specifications.push({
      requirementId,
      captureManifest: projectRelative(safe.projectRoot, capturePath),
      metricsFile: projectRelative(safe.projectRoot, metricsPath),
      contactSheetManifest: projectRelative(safe.projectRoot, contactSheetPath),
    });
  }
  const expectedRequirements = specifications.sort((left, right) => left.requirementId.localeCompare(right.requirementId));
  const expectedRequirementIds = expectedRequirements.map(({requirementId}) => requirementId);
  invariant(new Set(expectedRequirementIds).size === expectedRequirementIds.length, "Current full-frame coverage contains duplicate requirementIds");
  return {expectedRequirementIds, expectedRequirements};
}

async function existingOwnerEvidenceDescriptor(projectRoot, workspace, relativePath, label, {required = true} = {}) {
  const filePath = path.resolve(workspace, normalizeProjectPath(relativePath));
  invariant(isInside(workspace, filePath), `${label} escapes the migration workspace`);
  try {
    return await descriptorForFile(projectRoot, filePath, label);
  } catch (error) {
    if (!required && error.code === "ENOENT") return null;
    throw error;
  }
}

export async function deriveOwnerReviewEvidence({
  projectRoot,
  workspace,
  manifest,
}) {
  const safe = await assertSafeWorkspace(projectRoot, workspace);
  const audioInventory = manifest.audio?.inventoryFile || manifest.evidence?.audioInventory || "audio-inventory.csv";
  const audioEvidence = [
    await existingOwnerEvidenceDescriptor(safe.projectRoot, safe.workspace, audioInventory, "owner audio inventory"),
    await existingOwnerEvidenceDescriptor(safe.projectRoot, safe.workspace, "audit/audio-runtime-evidence.json", "owner audio runtime evidence"),
  ];
  const listening = await existingOwnerEvidenceDescriptor(
    safe.projectRoot,
    safe.workspace,
    "evidence/audio-listening-acceptance.json",
    "owner audio listening acceptance",
    {required: manifest.audio?.required === true},
  );
  if (listening) audioEvidence.push(listening);

  const behaviorEvidence = [
    await existingOwnerEvidenceDescriptor(safe.projectRoot, safe.workspace, "evidence/behavior-qa.json", "owner behavior QA"),
  ];
  const scenarioInventory = await existingOwnerEvidenceDescriptor(
    safe.projectRoot,
    safe.workspace,
    "audit/scenario-inventory.json",
    "owner scenario inventory",
    {required: false},
  );
  if (scenarioInventory) behaviorEvidence.push(scenarioInventory);

  const productEvidence = [
    await existingOwnerEvidenceDescriptor(safe.projectRoot, safe.workspace, "evidence/product-qa.json", "owner product QA"),
  ];
  const productAudioControls = await existingOwnerEvidenceDescriptor(
    safe.projectRoot,
    safe.workspace,
    "evidence/product-audio-controls-qa.json",
    "owner product audio-controls QA",
    {required: false},
  );
  if (productAudioControls) productEvidence.push(productAudioControls);

  const byPath = (left, right) => left.path.localeCompare(right.path);
  return {
    audioEvidence: audioEvidence.sort(byPath),
    behaviorEvidence: behaviorEvidence.sort(byPath),
    productEvidence: productEvidence.sort(byPath),
  };
}

export async function buildHumanVisualReviewInput({
  projectRoot,
  workspace,
  manifest,
  requirements,
  expectedRequirementIds,
}) {
  const safe = await assertSafeWorkspace(projectRoot, workspace);
  invariant(manifest && typeof manifest === "object" && manifest.animationId, "Migration manifest with animationId is required");
  const currentManifest = await assertCurrentTechnicalManifest({
    projectRoot: safe.projectRoot,
    workspace: safe.workspace,
    manifest,
  });
  const reviewCoverage = await currentReviewCoverage({
    projectRoot: safe.projectRoot,
    workspace: safe.workspace,
    manifest,
  });
  invariant(Array.isArray(requirements) && requirements.length > 0, "At least one review requirement is required");
  const requirementIds = requirements.map((requirement) => requirement?.requirementId);
  assertSortedUniqueStrings([...requirementIds].sort(), "review requirement IDs");
  invariant(new Set(requirementIds).size === requirementIds.length, "Review requirements contain duplicate IDs");
  const expectedIds = canonicalExpectedRequirementIds(expectedRequirementIds);
  if (reviewCoverage.coverage.schemaVersion === 2) {
    const canonicalCoverageIds = reviewCoverage.rows
      .map((row) => row.requirementId)
      .sort();
    invariant(
      JSON.stringify(expectedIds) === JSON.stringify(canonicalCoverageIds),
      "expectedRequirementIds must exactly match canonical full-domain coverage requirements; supplemental partial paths are excluded",
    );
  }
  invariant(
    JSON.stringify([...requirementIds].sort()) === JSON.stringify(expectedIds),
    "Review requirements do not exactly match expectedRequirementIds from current coverage",
  );
  const currentClosure = await collectImplementationArtifactClosure({
    projectRoot: safe.projectRoot,
    workspace: safe.workspace,
    manifest,
  });
  const artifacts = new Map();
  for (const artifact of currentClosure.artifacts) addArtifact(artifacts, artifact, "implementation artifact closure");

  const reviewedRequirements = [];
  for (const requirement of [...requirements].sort((left, right) => left.requirementId.localeCompare(right.requirementId))) {
    assertExactKeys(requirement, ["requirementId", "captureManifest", "metricsFile", "contactSheetManifest"], `review requirement ${requirement.requirementId || "missing"}`);
    assertNonEmptyString(requirement.requirementId, "review requirementId");
    const capture = await inspectImplementationCapture({
      projectRoot: safe.projectRoot,
      workspace: safe.workspace,
      manifest,
      captureManifest: requirement.captureManifest,
      currentClosure,
      artifacts,
    });
    invariant(capture.capture.requirementId === requirement.requirementId, `${requirement.requirementId}: capture requirementId differs`);
    const metrics = await inspectMetrics({
      projectRoot: safe.projectRoot,
      manifest,
      metricsFile: requirement.metricsFile,
      captureInspection: capture,
      artifacts,
    });
    const contact = await inspectContactSheet({
      projectRoot: safe.projectRoot,
      manifest,
      contactSheetManifest: requirement.contactSheetManifest,
      captureInspection: capture,
      metricsInspection: metrics,
      artifacts,
    });
    const identity = requirementIdentity(capture.capture, metrics.requiredRange);
    const domain = frameDomainForRequirement(manifest, identity);
    invariant(
      metrics.requiredRange.firstFrame === 1 && metrics.requiredRange.lastFrame === domain.frameCount,
      `${requirement.requirementId}: requiredRange does not cover the complete current frame domain`,
    );
    invariant(
      !Array.isArray(domain.scenarioIds) || domain.scenarioIds.includes(identity.scenario),
      `${requirement.requirementId}: scenario is not declared for the current frame domain`,
    );
    invariant(
      (manifest.localization?.languages || []).includes(identity.language),
      `${requirement.requirementId}: language is not declared by the current migration`,
    );
    reviewedRequirements.push({
      ...identity,
      implementationCapture: capture.descriptor,
      metrics: metrics.descriptor,
      contactSheet: contact.descriptor,
      baselineCapture: metrics.baselineCapture,
    });
  }

  return {
    schemaVersion: HUMAN_VISUAL_REVIEW_INPUT_SCHEMA_VERSION,
    evidenceType: INPUT_EVIDENCE_TYPE,
    animationId: manifest.animationId,
    technicalManifest: {
      path: projectRelative(safe.projectRoot, currentManifest.path),
      projection: TECHNICAL_MANIFEST_PROJECTION.id,
      hashMode: CANONICAL_PROJECTION_ENCODING,
      excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
      sha256: technicalManifestSha256(manifest),
    },
    implementationArtifactClosure: currentClosure,
    requirementIds: reviewedRequirements.map(({requirementId}) => requirementId),
    requirements: reviewedRequirements,
    artifactSet: artifactSet(artifacts),
    authorityBoundary: {
      signsHumanVisualReview: false,
      signsOwnerAcceptance: false,
      promotesOriginalRuntimeEvidence: false,
      changesMigrationStatus: false,
    },
    strictAcceptanceEffect: "none; this is an unsigned, immutable review-input snapshot",
  };
}

function assertReviewRequirementShape(requirement, label) {
  assertExactKeys(requirement, [
    "requirementId",
    "frameDomainId",
    "traceId",
    "entryStateSha256",
    "scenario",
    "language",
    "seed",
    "requiredRange",
    "implementationCapture",
    "metrics",
    "contactSheet",
    "baselineCapture",
  ], label);
  for (const key of ["requirementId", "frameDomainId", "traceId", "scenario", "language", "seed"]) {
    assertNonEmptyString(requirement[key], `${label}.${key}`);
  }
  assertSha256(requirement.entryStateSha256, `${label}.entryStateSha256`);
  assertExactKeys(requirement.requiredRange, ["firstFrame", "lastFrame"], `${label}.requiredRange`);
  invariant(
    requirement.requiredRange.firstFrame === 1
      && Number.isInteger(requirement.requiredRange.lastFrame)
      && requirement.requiredRange.lastFrame >= 1,
    `${label}.requiredRange must be a complete one-indexed range`,
  );
  for (const field of ["implementationCapture", "metrics", "contactSheet", "baselineCapture"]) {
    assertDescriptorShape(requirement[field], `${label}.${field}`);
  }
}

function assertImplementationClosureShape(closure) {
  assertExactKeys(closure, [
    "schemaVersion",
    "algorithm",
    "artifactCount",
    "projectionCount",
    "totalBytes",
    "aggregateSha256",
    "artifacts",
    "projections",
  ], "human visual review input implementationArtifactClosure");
  invariant(Array.isArray(closure.artifacts), "human visual review input implementationArtifactClosure.artifacts must be an array");
  invariant(Array.isArray(closure.projections), "human visual review input implementationArtifactClosure.projections must be an array");
  for (const [index, descriptor] of closure.artifacts.entries()) {
    assertExactKeys(descriptor, ["path", "bytes", "sha256"], `implementationArtifactClosure.artifacts[${index}]`);
  }
  for (const [index, descriptor] of closure.projections.entries()) {
    assertExactKeys(descriptor, ["path", "bytes", "sha256"], `implementationArtifactClosure.projections[${index}]`);
  }
  const canonical = {
    ...closure,
    artifacts: closure.artifacts.map(({path: artifactPath, bytes, sha256: digest}) => ({
      path: artifactPath,
      bytes,
      sha256: digest,
    })),
    projections: closure.projections.map(({path: artifactPath, bytes, sha256: digest}) => ({
      path: artifactPath,
      bytes,
      sha256: digest,
    })),
  };
  const closureErrors = implementationArtifactClosureErrors(canonical, null);
  invariant(
    closureErrors.length === 0,
    `human visual review input implementationArtifactClosure is invalid: ${closureErrors.join("; ")}`,
  );
}

function assertInputShape(input) {
  assertExactKeys(input, [
    "schemaVersion",
    "evidenceType",
    "animationId",
    "technicalManifest",
    "implementationArtifactClosure",
    "requirementIds",
    "requirements",
    "artifactSet",
    "authorityBoundary",
    "strictAcceptanceEffect",
  ], "human visual review input");
  invariant(input.schemaVersion === HUMAN_VISUAL_REVIEW_INPUT_SCHEMA_VERSION, "Human visual review input schemaVersion is unsupported");
  invariant(input.evidenceType === INPUT_EVIDENCE_TYPE, "Human visual review input evidenceType is invalid");
  assertNonEmptyString(input.animationId, "human visual review input animationId");
  assertExactKeys(input.technicalManifest, [
    "path",
    "projection",
    "hashMode",
    "excludedPaths",
    "sha256",
  ], "human visual review input technicalManifest");
  assertNonEmptyString(input.technicalManifest.path, "human visual review input technicalManifest.path");
  invariant(
    !path.isAbsolute(input.technicalManifest.path)
      && normalizeProjectPath(input.technicalManifest.path) === input.technicalManifest.path
      && input.technicalManifest.path !== ".."
      && !input.technicalManifest.path.startsWith("../"),
    "human visual review input technicalManifest.path must be canonical and project-relative",
  );
  invariant(
    input.technicalManifest.projection === TECHNICAL_MANIFEST_PROJECTION.id,
    "human visual review input technicalManifest.projection is unsupported",
  );
  invariant(
    input.technicalManifest.hashMode === CANONICAL_PROJECTION_ENCODING,
    "human visual review input technicalManifest.hashMode is unsupported",
  );
  invariant(
    JSON.stringify(input.technicalManifest.excludedPaths) === JSON.stringify([...TECHNICAL_MANIFEST_PROJECTION.excludedPaths]),
    "human visual review input technicalManifest.excludedPaths differ from the projection contract",
  );
  assertSha256(input.technicalManifest.sha256, "human visual review input technicalManifest.sha256");
  assertImplementationClosureShape(input.implementationArtifactClosure);
  assertSortedUniqueStrings(input.requirementIds, "human visual review input requirementIds");
  invariant(Array.isArray(input.requirements) && input.requirements.length === input.requirementIds.length, "Human visual review input requirements differ from requirementIds");
  for (const [index, requirement] of input.requirements.entries()) {
    assertReviewRequirementShape(requirement, `human visual review input requirements[${index}]`);
  }
  invariant(
    JSON.stringify(input.requirements.map(({requirementId}) => requirementId)) === JSON.stringify(input.requirementIds),
    "Human visual review input requirements are not sorted to match requirementIds",
  );
  assertArtifactSetShape(input.artifactSet, "human visual review input artifactSet");
  const artifactRows = new Map(input.artifactSet.artifacts.map((artifact) => [artifact.path, artifact]));
  const requiredDescriptors = [
    ...input.implementationArtifactClosure.artifacts,
    ...input.requirements.flatMap((requirement) => [
      requirement.implementationCapture,
      requirement.metrics,
      requirement.contactSheet,
      requirement.baselineCapture,
    ]),
  ];
  for (const descriptor of requiredDescriptors) {
    invariant(
      stableReviewJson(artifactRows.get(descriptor.path)) === stableReviewJson(descriptor),
      `human visual review input artifactSet does not exactly contain ${descriptor.path}`,
    );
  }
  assertExactKeys(input.authorityBoundary, [
    "signsHumanVisualReview",
    "signsOwnerAcceptance",
    "promotesOriginalRuntimeEvidence",
    "changesMigrationStatus",
  ], "human visual review input authorityBoundary");
  invariant(Object.values(input.authorityBoundary).every((value) => value === false), "Human visual review input cannot grant authority");
  invariant(input.strictAcceptanceEffect === "none; this is an unsigned, immutable review-input snapshot", "Human visual review input strictAcceptanceEffect is invalid");
}

export async function validateHumanVisualReviewInput({
  projectRoot,
  workspace,
  manifest,
  inputPath,
  expectedRequirementIds,
  expectedRequirements,
}) {
  const safe = await assertSafeWorkspace(projectRoot, workspace);
  const expectedIds = canonicalExpectedRequirementIds(expectedRequirementIds);
  const expectedSpecifications = canonicalExpectedRequirements(expectedRequirements, expectedIds);
  const allowedRoot = path.resolve(safe.workspace, INPUT_ROOT);
  const resolvedInput = path.resolve(inputPath);
  invariant(isInside(allowedRoot, resolvedInput), "Human visual review input must be under evidence/review-inputs");
  const parsed = await readJsonFile(safe.projectRoot, resolvedInput, "human visual review input");
  assertInputShape(parsed.value);
  invariant(parsed.value.animationId === manifest.animationId, "Human visual review input animationId differs from migration");
  invariant(
    JSON.stringify(parsed.value.requirementIds) === JSON.stringify(expectedIds),
    "Human visual review input does not exactly match expectedRequirementIds from current coverage",
  );
  const current = await buildHumanVisualReviewInput({
    projectRoot: safe.projectRoot,
    workspace: safe.workspace,
    manifest,
    requirements: expectedSpecifications,
    expectedRequirementIds: expectedIds,
  });
  invariant(
    stableReviewJson(parsed.value) === stableReviewJson(current),
    "Human visual review input is stale or non-canonical",
  );
  for (const [index, artifact] of parsed.value.artifactSet.artifacts.entries()) {
    await verifyDescriptor(safe.projectRoot, artifact, `human visual review input artifactSet[${index}]`);
  }
  return {value: parsed.value, descriptor: parsed.descriptor, path: resolvedInput};
}

function validateReviewer(reviewer, label, {owner = false} = {}) {
  const keys = owner
    ? ["kind", "fullName", "role", "organizationOrOwnerId", "contact", "authority"]
    : ["kind", "fullName", "role", "organizationOrOwnerId", "contact"];
  assertExactKeys(reviewer, keys, label);
  invariant(reviewer.kind === "human", `${label}.kind must be human`);
  for (const key of ["fullName", "role", "organizationOrOwnerId", "contact"]) {
    assertNonEmptyString(reviewer[key], `${label}.${key}`);
  }
  const identityText = [
    reviewer.fullName,
    reviewer.role,
    reviewer.organizationOrOwnerId,
    reviewer.contact,
  ].join(" ");
  invariant(!AUTOMATION_IDENTITY_PATTERN.test(identityText), `${label} must not identify automation, Codex, CI, a bot, or an agent`);
  if (owner) {
    invariant(
      reviewer.authority === "owner" || reviewer.authority === "authorized-owner-representative",
      `${label}.authority must be owner or authorized-owner-representative`,
    );
  }
}

function assertRecordDescriptor(descriptor, label) {
  assertDescriptorShape(descriptor, label);
}

export function buildHumanVisualReviewRecord({
  animationId,
  decision,
  reviewer,
  reviewedAt,
  reviewInput,
  requirementIds,
  notes,
  previousRecord = null,
}) {
  return {
    schemaVersion: HUMAN_VISUAL_REVIEW_RECORD_SCHEMA_VERSION,
    evidenceType: HUMAN_RECORD_EVIDENCE_TYPE,
    animationId,
    decision,
    reviewer,
    reviewedAt,
    scope: HUMAN_VISUAL_REVIEW_SCOPE,
    attestation: HUMAN_VISUAL_REVIEW_ATTESTATION,
    reviewInput,
    requirementIds: [...requirementIds].sort(),
    notes,
    previousRecord,
  };
}

export function projectKnownExceptions(manifest) {
  return (manifest.acceptance?.knownExceptions || [])
    .map((exception) => ({
      id: String(exception?.id || ""),
      reason: String(exception?.reason || ""),
      evidenceIds: [...new Set((exception?.evidenceIds || []).map(String))].sort(),
      ownerDecision: String(exception?.ownerDecision || ""),
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function buildOwnerReviewRecord({
  animationId,
  decision,
  reviewer,
  reviewedAt,
  reason,
  humanVisualReview,
  audioEvidence,
  behaviorEvidence,
  productEvidence,
  knownExceptions,
  notes,
  previousRecord = null,
}) {
  const sortDescriptors = (descriptors) => [...descriptors].sort((left, right) => left.path.localeCompare(right.path));
  return {
    schemaVersion: OWNER_REVIEW_RECORD_SCHEMA_VERSION,
    evidenceType: OWNER_RECORD_EVIDENCE_TYPE,
    animationId,
    decision,
    reviewer,
    reviewedAt,
    scope: OWNER_REVIEW_SCOPE,
    attestation: OWNER_REVIEW_ATTESTATION,
    reason,
    humanVisualReview,
    audioEvidence: sortDescriptors(audioEvidence),
    behaviorEvidence: sortDescriptors(behaviorEvidence),
    productEvidence: sortDescriptors(productEvidence),
    knownExceptions: [...knownExceptions].sort((left, right) => left.id.localeCompare(right.id)),
    notes,
    previousRecord,
  };
}

function assertHumanRecordShape(record, now) {
  assertExactKeys(record, [
    "schemaVersion",
    "evidenceType",
    "animationId",
    "decision",
    "reviewer",
    "reviewedAt",
    "scope",
    "attestation",
    "reviewInput",
    "requirementIds",
    "notes",
    "previousRecord",
  ], "human visual review record");
  invariant(record.schemaVersion === HUMAN_VISUAL_REVIEW_RECORD_SCHEMA_VERSION, "Human visual review record schemaVersion is unsupported");
  invariant(record.evidenceType === HUMAN_RECORD_EVIDENCE_TYPE, "Human visual review record evidenceType is invalid");
  assertNonEmptyString(record.animationId, "human visual review record animationId");
  invariant(record.decision === "accepted" || record.decision === "rejected", "Human visual review decision must be accepted or rejected");
  validateReviewer(record.reviewer, "human visual reviewer");
  assertTimezoneTimestamp(record.reviewedAt, "human visual review reviewedAt", now);
  invariant(record.scope === HUMAN_VISUAL_REVIEW_SCOPE, "Human visual review scope is invalid");
  invariant(record.attestation === HUMAN_VISUAL_REVIEW_ATTESTATION, "Human visual review attestation is invalid");
  assertRecordDescriptor(record.reviewInput, "human visual review input descriptor");
  assertSortedUniqueStrings(record.requirementIds, "human visual review requirementIds");
  assertNonEmptyString(record.notes, "human visual review notes");
  invariant(record.previousRecord === null || typeof record.previousRecord === "object", "human visual review previousRecord must be null or a descriptor");
  if (record.previousRecord) assertRecordDescriptor(record.previousRecord, "human visual review previousRecord");
}

function assertOwnerRecordShape(record, now) {
  assertExactKeys(record, [
    "schemaVersion",
    "evidenceType",
    "animationId",
    "decision",
    "reviewer",
    "reviewedAt",
    "scope",
    "attestation",
    "reason",
    "humanVisualReview",
    "audioEvidence",
    "behaviorEvidence",
    "productEvidence",
    "knownExceptions",
    "notes",
    "previousRecord",
  ], "owner review record");
  invariant(record.schemaVersion === OWNER_REVIEW_RECORD_SCHEMA_VERSION, "Owner review record schemaVersion is unsupported");
  invariant(record.evidenceType === OWNER_RECORD_EVIDENCE_TYPE, "Owner review record evidenceType is invalid");
  assertNonEmptyString(record.animationId, "owner review record animationId");
  invariant(record.decision === "accepted" || record.decision === "rejected", "Owner review decision must be accepted or rejected");
  validateReviewer(record.reviewer, "owner reviewer", {owner: true});
  assertTimezoneTimestamp(record.reviewedAt, "owner review reviewedAt", now);
  invariant(record.scope === OWNER_REVIEW_SCOPE, "Owner review scope is invalid");
  invariant(record.attestation === OWNER_REVIEW_ATTESTATION, "Owner review attestation is invalid");
  invariant(typeof record.reason === "string" && record.reason.trim().length >= 20, "Owner review reason must explicitly describe the accepted or rejected scope");
  assertRecordDescriptor(record.humanVisualReview, "owner humanVisualReview descriptor");
  for (const field of ["audioEvidence", "behaviorEvidence", "productEvidence"]) {
    invariant(Array.isArray(record[field]) && record[field].length > 0, `Owner ${field} must be non-empty`);
    const paths = record[field].map((descriptor) => descriptor.path);
    for (const [index, descriptor] of record[field].entries()) assertRecordDescriptor(descriptor, `owner ${field}[${index}]`);
    invariant(JSON.stringify([...new Set(paths)].sort()) === JSON.stringify(paths), `Owner ${field} must be unique and path-sorted`);
  }
  invariant(Array.isArray(record.knownExceptions), "Owner knownExceptions must be an array");
  for (const [index, exception] of record.knownExceptions.entries()) {
    assertExactKeys(exception, ["id", "reason", "evidenceIds", "ownerDecision"], `owner knownExceptions[${index}]`);
    assertNonEmptyString(exception.id, `owner knownExceptions[${index}].id`);
    assertNonEmptyString(exception.reason, `owner knownExceptions[${index}].reason`);
    invariant(Array.isArray(exception.evidenceIds), `owner knownExceptions[${index}].evidenceIds must be an array`);
    const sortedEvidence = [...new Set(exception.evidenceIds)].sort();
    invariant(JSON.stringify(sortedEvidence) === JSON.stringify(exception.evidenceIds), `owner knownExceptions[${index}].evidenceIds must be unique and sorted`);
    invariant(exception.ownerDecision === "accepted" || exception.ownerDecision === "rejected", `owner knownExceptions[${index}].ownerDecision must be accepted or rejected`);
  }
  const sortedExceptions = [...record.knownExceptions].sort((left, right) => left.id.localeCompare(right.id));
  invariant(JSON.stringify(sortedExceptions) === JSON.stringify(record.knownExceptions), "Owner knownExceptions must be sorted by id");
  assertNonEmptyString(record.notes, "owner review notes");
  invariant(record.previousRecord === null || typeof record.previousRecord === "object", "owner previousRecord must be null or a descriptor");
  if (record.previousRecord) assertRecordDescriptor(record.previousRecord, "owner previousRecord");
}

function canonicalExpectedOwnerEvidence(expectedOwnerEvidence) {
  assertExactKeys(expectedOwnerEvidence, [
    "audioEvidence",
    "behaviorEvidence",
    "productEvidence",
  ], "expectedOwnerEvidence");
  const result = {};
  for (const field of ["audioEvidence", "behaviorEvidence", "productEvidence"]) {
    invariant(
      Array.isArray(expectedOwnerEvidence[field]) && expectedOwnerEvidence[field].length > 0,
      `expectedOwnerEvidence.${field} must be a non-empty descriptor array from current validated evidence`,
    );
    for (const [index, descriptor] of expectedOwnerEvidence[field].entries()) {
      assertDescriptorShape(descriptor, `expectedOwnerEvidence.${field}[${index}]`);
    }
    const sorted = [...expectedOwnerEvidence[field]].sort((left, right) => left.path.localeCompare(right.path));
    invariant(
      new Set(sorted.map(({path: artifactPath}) => artifactPath)).size === sorted.length,
      `expectedOwnerEvidence.${field} contains duplicate paths`,
    );
    result[field] = sorted;
  }
  return result;
}

async function resolveRecordFile({
  projectRoot,
  workspace,
  recordPath,
  expectedRoot,
  label,
  seen,
}) {
  const safe = await assertSafeWorkspace(projectRoot, workspace);
  const allowedRoot = path.resolve(safe.workspace, expectedRoot);
  const resolved = path.resolve(recordPath);
  invariant(isInside(allowedRoot, resolved), `${label} must be under ${expectedRoot}`);
  if (seen.has(resolved)) throw new Error(`${label} previous-record cycle detected at ${projectRelative(safe.projectRoot, resolved)}`);
  seen.add(resolved);
  const parsed = await readJsonFile(safe.projectRoot, resolved, label);
  return {...parsed, path: resolved, safe};
}

async function validateHumanRecordNode({
  projectRoot,
  workspace,
  manifest,
  recordPath,
  expectedDescriptor,
  now,
  seen,
  current,
  expectedRequirementIds,
  expectedRequirements,
}) {
  const parsed = await resolveRecordFile({
    projectRoot,
    workspace,
    recordPath,
    expectedRoot: HUMAN_ROOT,
    label: "human visual review record",
    seen,
  });
  if (expectedDescriptor) {
    invariant(
      parsed.descriptor.path === expectedDescriptor.path
        && parsed.descriptor.bytes === expectedDescriptor.bytes
        && parsed.descriptor.sha256 === expectedDescriptor.sha256,
      `human visual review ${current ? "record descriptor" : "previous-record"} bytes are stale: ${expectedDescriptor.path}`,
    );
  }
  assertHumanRecordShape(parsed.value, now);
  invariant(parsed.value.animationId === manifest.animationId, "Human visual review record animationId differs from migration");
  const inputVerification = await verifyDescriptor(parsed.safe.projectRoot, parsed.value.reviewInput, "human visual review input descriptor");
  let input;
  if (current) {
    input = await validateHumanVisualReviewInput({
      projectRoot: parsed.safe.projectRoot,
      workspace: parsed.safe.workspace,
      manifest,
      inputPath: inputVerification.filePath,
      expectedRequirementIds,
      expectedRequirements,
    });
    invariant(
      JSON.stringify(parsed.value.requirementIds) === JSON.stringify(input.value.requirementIds),
      "Human visual review record does not bind the exact review-input requirement set",
    );
  } else {
    const historicalInputRoot = path.resolve(parsed.safe.workspace, INPUT_ROOT);
    invariant(
      isInside(historicalInputRoot, inputVerification.filePath),
      "Historical human visual review input must be under evidence/review-inputs",
    );
    const historicalInput = await readJsonFile(parsed.safe.projectRoot, inputVerification.filePath, "historical human visual review input");
    assertInputShape(historicalInput.value);
    invariant(
      historicalInput.value.animationId === manifest.animationId,
      "Historical human visual review input animationId differs from migration",
    );
    invariant(
      JSON.stringify(parsed.value.requirementIds) === JSON.stringify(historicalInput.value.requirementIds),
      "Historical human visual review record requirement set differs from its input",
    );
  }
  let previous = null;
  if (parsed.value.previousRecord) {
    const previousPath = resolveProjectDescriptorPath(parsed.safe.projectRoot, parsed.value.previousRecord.path, "human visual review previousRecord");
    previous = await validateHumanRecordNode({
      projectRoot: parsed.safe.projectRoot,
      workspace: parsed.safe.workspace,
      manifest,
      recordPath: previousPath,
      expectedDescriptor: parsed.value.previousRecord,
      now,
      seen,
      current: false,
      expectedRequirementIds: null,
      expectedRequirements: null,
    });
    invariant(Date.parse(previous.value.reviewedAt) < Date.parse(parsed.value.reviewedAt), "Human visual review previousRecord must be older than the current record");
  }
  return {...parsed, input, previous};
}

export async function validateHumanVisualReviewRecord({
  projectRoot,
  workspace,
  manifest,
  recordPath,
  expectedRecordDescriptor = null,
  expectedRequirementIds,
  expectedRequirements,
  now = Date.now(),
}) {
  const expectedIds = canonicalExpectedRequirementIds(expectedRequirementIds);
  const expectedSpecifications = canonicalExpectedRequirements(expectedRequirements, expectedIds);
  return validateHumanRecordNode({
    projectRoot,
    workspace,
    manifest,
    recordPath,
    expectedDescriptor: expectedRecordDescriptor,
    now,
    seen: new Set(),
    current: true,
    expectedRequirementIds: expectedIds,
    expectedRequirements: expectedSpecifications,
  });
}

async function validateOwnerRecordNode({
  projectRoot,
  workspace,
  manifest,
  recordPath,
  expectedDescriptor,
  now,
  seen,
  current,
  expectedRequirementIds,
  expectedRequirements,
  expectedOwnerEvidence,
}) {
  const parsed = await resolveRecordFile({
    projectRoot,
    workspace,
    recordPath,
    expectedRoot: OWNER_ROOT,
    label: "owner review record",
    seen,
  });
  if (expectedDescriptor) {
    invariant(
      parsed.descriptor.path === expectedDescriptor.path
        && parsed.descriptor.bytes === expectedDescriptor.bytes
        && parsed.descriptor.sha256 === expectedDescriptor.sha256,
      `owner ${current ? "record descriptor" : "previous-record"} bytes are stale: ${expectedDescriptor.path}`,
    );
  }
  assertOwnerRecordShape(parsed.value, now);
  invariant(parsed.value.animationId === manifest.animationId, "Owner review record animationId differs from migration");
  const humanDescriptor = await verifyDescriptor(parsed.safe.projectRoot, parsed.value.humanVisualReview, "owner humanVisualReview descriptor");
  const human = await validateHumanRecordNode({
    projectRoot: parsed.safe.projectRoot,
    workspace: parsed.safe.workspace,
    manifest,
    recordPath: humanDescriptor.filePath,
    expectedDescriptor: parsed.value.humanVisualReview,
    now,
    seen: new Set(),
    current,
    expectedRequirementIds,
    expectedRequirements,
  });
  invariant(human.value.decision === "accepted", "Owner review must bind an accepted human visual review");
  invariant(
    Date.parse(human.value.reviewedAt) <= Date.parse(parsed.value.reviewedAt),
    "Owner review cannot predate its bound human visual review",
  );
  if (current) {
    for (const field of ["audioEvidence", "behaviorEvidence", "productEvidence"]) {
      invariant(
        stableReviewJson(parsed.value[field]) === stableReviewJson(expectedOwnerEvidence[field]),
        `Owner ${field} differs from expected current validated evidence`,
      );
    }
  }
  for (const field of ["audioEvidence", "behaviorEvidence", "productEvidence"]) {
    for (const [index, descriptor] of parsed.value[field].entries()) {
      await verifyDescriptor(parsed.safe.projectRoot, descriptor, `owner ${field}[${index}]`);
    }
  }
  if (current) {
    invariant(
      stableReviewJson(parsed.value.knownExceptions) === stableReviewJson(projectKnownExceptions(manifest)),
      "Owner review knownExceptions differ from the current migration",
    );
  }
  let previous = null;
  if (parsed.value.previousRecord) {
    const previousPath = resolveProjectDescriptorPath(parsed.safe.projectRoot, parsed.value.previousRecord.path, "owner previousRecord");
    previous = await validateOwnerRecordNode({
      projectRoot: parsed.safe.projectRoot,
      workspace: parsed.safe.workspace,
      manifest,
      recordPath: previousPath,
      expectedDescriptor: parsed.value.previousRecord,
      now,
      seen,
      current: false,
      expectedRequirementIds: null,
      expectedRequirements: null,
      expectedOwnerEvidence: null,
    });
    invariant(Date.parse(previous.value.reviewedAt) < Date.parse(parsed.value.reviewedAt), "Owner previousRecord must be older than the current record");
  }
  return {...parsed, human, previous};
}

export async function validateOwnerReviewRecord({
  projectRoot,
  workspace,
  manifest,
  recordPath,
  expectedRecordDescriptor = null,
  expectedRequirementIds,
  expectedRequirements,
  expectedOwnerEvidence,
  now = Date.now(),
}) {
  const expectedIds = canonicalExpectedRequirementIds(expectedRequirementIds);
  const expectedSpecifications = canonicalExpectedRequirements(expectedRequirements, expectedIds);
  const expectedEvidence = canonicalExpectedOwnerEvidence(expectedOwnerEvidence);
  return validateOwnerRecordNode({
    projectRoot,
    workspace,
    manifest,
    recordPath,
    expectedDescriptor: expectedRecordDescriptor,
    now,
    seen: new Set(),
    current: true,
    expectedRequirementIds: expectedIds,
    expectedRequirements: expectedSpecifications,
    expectedOwnerEvidence: expectedEvidence,
  });
}

export async function writeImmutableReviewArtifact({
  projectRoot,
  workspace,
  kind,
  value,
}) {
  invariant(kind === "input" || kind === "human" || kind === "owner", "Immutable review artifact kind must be input, human, or owner");
  const relativeRoot = kind === "input" ? INPUT_ROOT : kind === "human" ? HUMAN_ROOT : OWNER_ROOT;
  const outputRoot = await ensureSafeDirectory(projectRoot, workspace, relativeRoot);
  const bytes = Buffer.from(stableReviewJson(value));
  const digest = sha256(bytes);
  const timestamp = kind === "input"
    ? ""
    : `${String(value.reviewedAt || "undated").replace(/[^0-9A-Za-z]+/g, "-").replace(/^-|-$/g, "")}-`;
  const prefix = kind === "input" ? "human-visual-input-" : kind === "human" ? "human-review-" : "owner-review-";
  const filePath = path.join(outputRoot, `${prefix}${timestamp}${digest}.json`);
  await writeFile(filePath, bytes, {flag: "wx", mode: 0o444});
  return descriptorForFile(path.resolve(projectRoot), filePath, `immutable ${kind} review artifact`);
}
