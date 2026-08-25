#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {
  lstat,
  open,
  readFile,
} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');

export const DEFAULT_PLAN_PATH =
  'work/adaptive-canvas-production-five.plan.v9.json';
export const DEFAULT_FREEZE_PATH =
  'work/adaptive-canvas-production-five.gate0a-freeze.v1.json';
export const DEFAULT_SOURCE_FIRST_INVENTORY_PATH =
  'work/adaptive-canvas-production-five.source-first-regeneration-inventory.v1.json';
export const DEFAULT_ADVANCED_MANUAL_INVENTORY_PATH =
  'work/adaptive-canvas-production-five.canonical-advanced-manual-inventory.v1.json';
export const DEFAULT_OUTPUT_PATH =
  'work/adaptive-canvas-production-five.regeneration-provenance-review.v1.json';
export const REVIEW_RECEIPT_TYPE =
  'adaptive-canvas-production-five-regeneration-provenance-review-v1';
export const FREEZE_RECEIPT_TYPE =
  'adaptive-canvas-production-five-gate0a-freeze-v1';
export const SOURCE_FIRST_INVENTORY_RECEIPT_TYPE =
  'adaptive-canvas-production-five-source-first-regeneration-inventory-v1';
export const ADVANCED_MANUAL_INVENTORY_RECEIPT_TYPE =
  'adaptive-canvas-production-five-canonical-advanced-manual-inventory-v1';

const MAIN_RELEASE_CATALOG = 'catalog/lesson-releases.json';
const PAGE_ONLY_RELEASE_CATALOG =
  'catalog/page-only-current-js-product-releases.json';
const PAGE_RENDERER_ASSET =
  /^courses\/(course-g(?:03|04|05)-l\d{2}-[^/]+)\/canvas-renderer\.js$/u;
const LOADED_HOST_ANIMATION_ID =
  'course-g04-l03-ir-001-341242cc-loaded-swf-host';
const LOADED_HOST_PARENT_ANIMATION_ID =
  'course-g04-l03-ir-001-341242cc';
const LOADED_HOST_ASSET_PATH =
  'courses/shell-course-g04-l03-index-local/host-composite-assets/' +
  'course-g04-l03-ir-001-loaded-swf-canvas-renderer.js';
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const SAFE_ANIMATION_ID = /^course-g(?:03|04|05)-l\d{2}-[a-z0-9-]+$/u;
const EXPECTED_COUNTS = Object.freeze({
  placements: 284,
  pageRuntimes: 283,
  loadedHosts: 1,
  runtimes: 284,
  freezeCandidateFiles: 56,
  freezeEvidenceInputs: 7,
  freezeFiles: 63,
});
const APPROVED_RELEASE_IDS = Object.freeze([
  'lesson-g03-l02-addition-subtraction-page-only-current-js',
  'lesson-g04-l03-negative-numbers',
  'lesson-g05-l03-exponents-prime-factorizations-page-only',
  'lesson-g05-l04-number-lines',
  'lesson-g05-l05-add-subtract-negative-numbers',
]);

const FORBIDDEN_PROOF_PATH_PREFIXES = Object.freeze([
  'apps/web/public/flash-assets/',
  'public/flash-assets/',
  'flash-assets/',
  'apps/web/config/current-js-production-assets.',
  'packages/demos/src/adaptive-canvas-production-bindings.generated.ts',
  'work/adaptive-canvas-production-five.regeneration-provenance.v1.json',
]);
const ALLOWED_PROJECT_EVIDENCE_ROOTS = Object.freeze([
  'catalog/',
  'migrations/',
  'packages/',
  'reports/',
  'scripts/',
  'skills/',
  'work/',
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value, keys) {
  return isObject(value) &&
    canonicalJson(Object.keys(value).sort()) === canonicalJson([...keys].sort());
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function canonicalDocumentBytes(value) {
  return Buffer.from(`${canonicalJson(value)}\n`);
}

function canonicalPrettyDocumentBytes(value) {
  return Buffer.from(`${JSON.stringify(canonicalize(value), null, 2)}\n`);
}

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function portable(candidate) {
  return candidate.split(path.sep).join('/');
}

function isInside(candidate, root) {
  const relative = path.relative(root, candidate);
  return relative === '' || (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function safeRelativePath(value, label) {
  invariant(typeof value === 'string' && value.length > 0, `${label} is empty`);
  invariant(!path.isAbsolute(value), `${label} must be project-relative`);
  const normalized = portable(path.posix.normalize(value.replaceAll('\\', '/')));
  invariant(normalized === value && normalized !== '..' &&
    !normalized.startsWith('../'), `${label} is unsafe`);
  return normalized;
}

function resolveInside(root, candidate, label) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, safeRelativePath(candidate, label));
  invariant(isInside(resolved, resolvedRoot), `${label} escapes its root`);
  return resolved;
}

function validateByteIdentity(value, label) {
  invariant(exactKeys(value, ['bytes', 'sha256']),
    `${label} must contain exactly bytes/sha256`);
  invariant(Number.isSafeInteger(value.bytes) && value.bytes > 0,
    `${label}.bytes must be positive`);
  invariant(SHA256_PATTERN.test(value.sha256 || ''),
    `${label}.sha256 is invalid`);
  return {bytes: value.bytes, sha256: value.sha256};
}

function validateFileDescriptor(value, label, {allowExtra = false} = {}) {
  invariant(isObject(value), `${label} must be an object`);
  if (!allowExtra) {
    invariant(exactKeys(value, ['path', 'bytes', 'sha256']),
      `${label} must contain exactly path/bytes/sha256`);
  }
  const filePath = safeRelativePath(value.path, `${label}.path`);
  invariant(Number.isSafeInteger(value.bytes) && value.bytes > 0,
    `${label}.bytes must be positive`);
  invariant(SHA256_PATTERN.test(value.sha256 || ''),
    `${label}.sha256 is invalid`);
  return {path: filePath, bytes: value.bytes, sha256: value.sha256};
}

function statIdentity(stat) {
  return {
    dev: stat.dev.toString(),
    ino: stat.ino.toString(),
    size: stat.size.toString(),
    mtimeNs: stat.mtimeNs.toString(),
    ctimeNs: stat.ctimeNs.toString(),
    mode: stat.mode.toString(),
    uid: stat.uid.toString(),
    gid: stat.gid.toString(),
    nlink: stat.nlink.toString(),
  };
}

async function readStableOrdinaryFile(absolutePath, label) {
  let handle;
  try {
    handle = await open(
      absolutePath,
      fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW || 0),
    );
    const before = await handle.stat({bigint: true});
    invariant(before.isFile(), `${label} must be an ordinary file`);
    const bytes = await handle.readFile();
    const after = await handle.stat({bigint: true});
    invariant(canonicalJson(statIdentity(before)) ===
      canonicalJson(statIdentity(after)), `${label} changed while read`);
    invariant(bytes.length === Number(after.size), `${label} size drifted`);
    return {
      bytes,
      sha256: sha256(bytes),
      physicalIdentity: statIdentity(after),
    };
  } finally {
    await handle?.close();
  }
}

async function readProjectFile(projectRoot, descriptor, label) {
  const expected = validateFileDescriptor(descriptor, label, {allowExtra: true});
  const absolutePath = resolveInside(projectRoot, expected.path, `${label}.path`);
  const actual = await readStableOrdinaryFile(absolutePath, label);
  invariant(actual.bytes.length === expected.bytes &&
    actual.sha256 === expected.sha256,
  `${label} differs from its frozen identity`);
  return {...expected, physicalIdentity: actual.physicalIdentity};
}

async function readJsonFile(absolutePath, label) {
  const binding = await readStableOrdinaryFile(absolutePath, label);
  let document;
  try {
    document = JSON.parse(binding.bytes.toString('utf8'));
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
  return {...binding, document};
}

function verifyHashBoundReceipt(document, receiptType, label, {
  requireCanonicalBytes = null,
} = {}) {
  invariant(exactKeys(document, [
    'schemaVersion',
    'receiptType',
    'payloadSha256',
    'payload',
  ]), `${label} has unexpected top-level keys`);
  invariant(document.schemaVersion === 1, `${label} schemaVersion must be 1`);
  invariant(document.receiptType === receiptType,
    `${label} receiptType is invalid`);
  invariant(SHA256_PATTERN.test(document.payloadSha256 || ''),
    `${label} payloadSha256 is invalid`);
  const expected = sha256(Buffer.from(canonicalJson(document.payload)));
  invariant(document.payloadSha256 === expected,
    `${label} payloadSha256 mismatch`);
  if (requireCanonicalBytes !== null) {
    invariant(canonicalDocumentBytes(document).equals(requireCanonicalBytes),
      `${label} bytes are not canonical JSON`);
  }
  return document.payload;
}

function runtimeSetIdentity(runtimes) {
  invariant(Array.isArray(runtimes) && runtimes.length === EXPECTED_COUNTS.runtimes,
    'v9 plan must contain exactly 284 runtimes');
  const pageRendererCount = runtimes.filter(({pageRenderer}) =>
    pageRenderer === true).length;
  const loadedHostCount = runtimes.filter(({pageRenderer}) =>
    pageRenderer === false).length;
  invariant(pageRendererCount === EXPECTED_COUNTS.pageRuntimes &&
    loadedHostCount === EXPECTED_COUNTS.loadedHosts,
  'v9 runtime denominator must be 283 page renderers plus one loaded host');
  const animationIds = new Set();
  const assetPaths = new Set();
  const inputRows = [];
  const outputRows = [];
  for (const [index, runtime] of runtimes.entries()) {
    const label = `v9 runtime ${index}`;
    invariant(isObject(runtime), `${label} must be an object`);
    invariant(typeof runtime.animationId === 'string' &&
      SAFE_ANIMATION_ID.test(runtime.animationId), `${label} animationId is invalid`);
    invariant(typeof runtime.pageRenderer === 'boolean',
      `${label} pageRenderer is invalid`);
    const assetPath = safeRelativePath(runtime.assetPath, `${label}.assetPath`);
    invariant(typeof runtime.lane === 'string' && runtime.lane.length > 0,
      `${label}.lane is invalid`);
    const input = validateByteIdentity(runtime.input, `${label}.input`);
    const output = validateByteIdentity(runtime.output, `${label}.output`);
    invariant(!animationIds.has(runtime.animationId),
      `${label} duplicates animationId ${runtime.animationId}`);
    invariant(!assetPaths.has(assetPath),
      `${label} duplicates assetPath ${assetPath}`);
    animationIds.add(runtime.animationId);
    assetPaths.add(assetPath);
    inputRows.push(
      `${input.sha256} ${input.bytes} ${runtime.animationId} ${assetPath}`,
    );
    outputRows.push(
      `${output.sha256} ${output.bytes} ${runtime.animationId} ${assetPath}`,
    );
  }
  inputRows.sort(compareText);
  outputRows.sort(compareText);
  return {
    totalRuntimeCount: runtimes.length,
    pageRendererCount,
    loadedHostCount,
    inputChecksumSetSha256: sha256(Buffer.from(inputRows.join('\n'))),
    outputChecksumSetSha256: sha256(Buffer.from(outputRows.join('\n'))),
  };
}

function exactRuntimeIdentity(runtime) {
  return {
    animationId: runtime.animationId,
    pageRenderer: runtime.pageRenderer,
    assetPath: runtime.assetPath,
    lane: runtime.lane,
    input: validateByteIdentity(runtime.input, `${runtime.animationId}.input`),
    output: validateByteIdentity(runtime.output, `${runtime.animationId}.output`),
  };
}

async function loadPlan(projectRoot, planPath) {
  const normalizedPath = safeRelativePath(planPath, 'plan path');
  const absolutePath = resolveInside(projectRoot, normalizedPath, 'plan path');
  const binding = await readJsonFile(absolutePath, 'exact v9 plan');
  const payload = verifyHashBoundReceipt(
    binding.document,
    'adaptive-canvas-production-five-batch-plan',
    'exact v9 plan',
  );
  invariant(payload.status === 'pass' && payload.operation === 'plan',
    'v9 plan must be a successful plan-only artifact');
  invariant(exactKeys(payload.boundary, [
    'pageRendererCount',
    'loadedHostRuntimeCount',
    'totalAdaptiveRuntimeCount',
    'placementCount',
    'courseShellCount',
    'profileEntryCount',
    'approvedReleaseIds',
    'forbiddenG4LessonsExcluded',
  ]), 'v9 boundary shape changed');
  invariant(payload.boundary.pageRendererCount === EXPECTED_COUNTS.pageRuntimes &&
    payload.boundary.loadedHostRuntimeCount === EXPECTED_COUNTS.loadedHosts &&
    payload.boundary.totalAdaptiveRuntimeCount === EXPECTED_COUNTS.runtimes &&
    payload.boundary.placementCount === EXPECTED_COUNTS.placements &&
    payload.boundary.courseShellCount === 0,
  'v9 boundary denominator changed');
  invariant(canonicalJson(payload.boundary.approvedReleaseIds) ===
    canonicalJson(APPROVED_RELEASE_IDS), 'v9 approved release IDs changed');
  invariant(Array.isArray(payload.runtimes), 'v9 plan runtimes are absent');
  const runtimeSet = runtimeSetIdentity(payload.runtimes);
  const pageRuntimes = payload.runtimes.filter(({pageRenderer}) => pageRenderer);
  for (const runtime of pageRuntimes) {
    const match = PAGE_RENDERER_ASSET.exec(runtime.assetPath);
    invariant(match !== null && match[1] === runtime.animationId,
      `${runtime.animationId}: page assetPath identity changed`);
  }
  const loadedHosts = payload.runtimes.filter(({pageRenderer}) => !pageRenderer);
  invariant(loadedHosts[0].animationId === LOADED_HOST_ANIMATION_ID &&
    loadedHosts[0].metadataAnimationId === LOADED_HOST_PARENT_ANIMATION_ID &&
    loadedHosts[0].assetPath === LOADED_HOST_ASSET_PATH,
  'loaded-host runtime identity changed');
  return {
    path: normalizedPath,
    bytes: binding.bytes.length,
    sha256: binding.sha256,
    payloadSha256: binding.document.payloadSha256,
    payload,
    runtimeSet,
  };
}

function normalizeFreezeRecord(record, label) {
  const descriptor = validateFileDescriptor(record, label, {allowExtra: true});
  invariant(typeof record.mode === 'string' && /^[0-7]{3,6}$/u.test(record.mode),
    `${label}.mode is invalid`);
  if (Object.hasOwn(record, 'gitStatus')) {
    invariant(typeof record.gitStatus === 'string' && record.gitStatus.length > 0,
      `${label}.gitStatus is invalid`);
  }
  return {
    ...descriptor,
    ...(Object.hasOwn(record, 'gitStatus') ? {gitStatus: record.gitStatus} : {}),
    mode: record.mode,
  };
}

function validateChecksumSet(records, expected, label, {includeGitStatus = false} = {}) {
  const rows = [...records]
    .sort((left, right) => compareText(left.path, right.path))
    .map(({path: filePath, bytes, sha256: digest, mode, gitStatus}) =>
      includeGitStatus ?
        `${digest} ${bytes} ${mode} ${gitStatus} ${filePath}` :
        `${digest} ${bytes} ${mode} ${filePath}`);
  const actual = sha256(Buffer.from(rows.join('\n')));
  invariant(actual === expected, `${label} checksumSetSha256 mismatch`);
  return actual;
}

async function verifyFreezeFileSet(projectRoot, value, count, label) {
  invariant(isObject(value) && Array.isArray(value.files),
    `${label}.files is absent`);
  invariant(value.files.length === count, `${label} count changed`);
  invariant(value.fileCount === count,
    `${label} declared count changed`);
  invariant(Number.isSafeInteger(value.totalBytes) && value.totalBytes > 0,
    `${label}.totalBytes is invalid`);
  invariant(SHA256_PATTERN.test(value.checksumSetSha256 || ''),
    `${label}.checksumSetSha256 is invalid`);
  const records = value.files.map((record, index) =>
    normalizeFreezeRecord(record, `${label}.files[${index}]`));
  const paths = new Set();
  for (const record of records) {
    invariant(!paths.has(record.path), `${label} duplicates ${record.path}`);
    paths.add(record.path);
  }
  invariant(records.reduce((sum, {bytes}) => sum + bytes, 0) === value.totalBytes,
    `${label}.totalBytes mismatch`);
  const includeGitStatus = value.checksumRowFormat ===
    '<sha256> <bytes> <mode-octal> <git-status-2> <path>';
  invariant(includeGitStatus || value.checksumRowFormat ===
    '<sha256> <bytes> <mode-octal> <path>',
  `${label}.checksumRowFormat is unsupported`);
  if (includeGitStatus) {
    invariant(records.every((record) => typeof record.gitStatus === 'string' &&
      record.gitStatus.length === 2), `${label} git status row is incomplete`);
  }
  validateChecksumSet(records, value.checksumSetSha256, label, {includeGitStatus});
  const verified = [];
  for (const [index, record] of records.entries()) {
    const current = await readProjectFile(
      projectRoot,
      record,
      `${label}.files[${index}]`,
    );
    const stat = await lstat(resolveInside(projectRoot, record.path, record.path));
    const mode = (stat.mode & 0o7777).toString(8).padStart(4, '0');
    invariant(mode === record.mode || mode.replace(/^0/u, '') === record.mode,
      `${record.path}: file mode differs from freeze`);
    verified.push({...record, physicalIdentity: current.physicalIdentity});
  }
  return verified;
}

async function loadFreeze(projectRoot, freezePath, plan) {
  const normalizedPath = safeRelativePath(freezePath, 'freeze path');
  const absolutePath = resolveInside(projectRoot, normalizedPath, 'freeze path');
  const binding = await readJsonFile(absolutePath, 'Gate0A freeze');
  const payload = verifyHashBoundReceipt(
    binding.document,
    FREEZE_RECEIPT_TYPE,
    'Gate0A freeze',
  );
  invariant(canonicalPrettyDocumentBytes(binding.document).equals(binding.bytes),
    'Gate0A freeze bytes are not canonical pretty JSON');
  invariant(payload.status ===
    'frozen-for-independent-regeneration-provenance-review',
  'Gate0A freeze status is invalid');
  const frozenPlan = validateFileDescriptor(payload.plan, 'freeze.plan', {
    allowExtra: true,
  });
  invariant(frozenPlan.path === plan.path && frozenPlan.bytes === plan.bytes &&
    frozenPlan.sha256 === plan.sha256 &&
    payload.plan.payloadSha256 === plan.payloadSha256,
  'Gate0A freeze binds a different v9 plan');
  const candidateRecords = await verifyFreezeFileSet(
    projectRoot,
    payload.candidateFileSet,
    EXPECTED_COUNTS.freezeCandidateFiles,
    'freeze.candidateFileSet',
  );
  const evidenceRecords = await verifyFreezeFileSet(
    projectRoot,
    payload.evidenceInputSet,
    EXPECTED_COUNTS.freezeEvidenceInputs,
    'freeze.evidenceInputSet',
  );
  invariant(isObject(payload.fullFreezeSet), 'freeze.fullFreezeSet is absent');
  invariant(payload.fullFreezeSet.fileCount === EXPECTED_COUNTS.freezeFiles &&
    Number.isSafeInteger(payload.fullFreezeSet.totalBytes) &&
    SHA256_PATTERN.test(payload.fullFreezeSet.checksumSetSha256 || ''),
  'freeze.fullFreezeSet identity is invalid');
  const fullRecords = [...candidateRecords, ...evidenceRecords];
  invariant(new Set(fullRecords.map(({path: filePath}) => filePath)).size ===
    EXPECTED_COUNTS.freezeFiles, 'freeze file sets overlap or changed');
  invariant(fullRecords.reduce((sum, {bytes}) => sum + bytes, 0) ===
    payload.fullFreezeSet.totalBytes, 'freeze.fullFreezeSet totalBytes mismatch');
  validateChecksumSet(
    fullRecords,
    payload.fullFreezeSet.checksumSetSha256,
    'freeze.fullFreezeSet',
  );
  const generator = validateFileDescriptor(payload.generator, 'freeze.generator', {
    allowExtra: true,
  });
  const batchTest = validateFileDescriptor(payload.batchTest, 'freeze.batchTest', {
    allowExtra: true,
  });
  invariant(candidateRecords.some((record) =>
    canonicalJson(validateFileDescriptor(record, record.path, {allowExtra: true})) ===
      canonicalJson(generator)), 'freeze generator is not in candidateFileSet');
  invariant(candidateRecords.some((record) =>
    canonicalJson(validateFileDescriptor(record, record.path, {allowExtra: true})) ===
      canonicalJson(batchTest)), 'freeze batch test is not in candidateFileSet');
  return {
    path: normalizedPath,
    bytes: binding.bytes.length,
    sha256: binding.sha256,
    payloadSha256: binding.document.payloadSha256,
    baseCommit: payload.baseCommit,
    branch: payload.branch,
    candidateFileSet: {
      count: candidateRecords.length,
      totalBytes: payload.candidateFileSet.totalBytes,
      checksumSetSha256: payload.candidateFileSet.checksumSetSha256,
    },
    evidenceInputSet: {
      count: evidenceRecords.length,
      totalBytes: payload.evidenceInputSet.totalBytes,
      checksumSetSha256: payload.evidenceInputSet.checksumSetSha256,
    },
    fullFreezeSet: {
      count: fullRecords.length,
      totalBytes: payload.fullFreezeSet.totalBytes,
      checksumSetSha256: payload.fullFreezeSet.checksumSetSha256,
    },
  };
}

function releaseDocuments(documents) {
  const releases = [];
  for (const document of documents) {
    invariant(isObject(document) && Array.isArray(document.releases),
      'release catalog must contain releases[]');
    releases.push(...document.releases);
  }
  return releases;
}

export function resolveProductionPlacements({releaseCatalogDocuments}) {
  const releases = releaseDocuments(releaseCatalogDocuments);
  const placements = [];
  for (const releaseId of APPROVED_RELEASE_IDS) {
    const matches = releases.filter((release) => release.releaseId === releaseId);
    invariant(matches.length === 1,
      `${releaseId} must appear in exactly one release catalog`);
    const release = matches[0];
    const members = release.members.filter((member) =>
      member.releaseRole === 'active-xml-referenced-page');
    invariant(members.length === release.expectedCounts.activeXmlReferencedPages,
      `${releaseId} active page count changed`);
    members.forEach((member, index) => {
      const ordinal = index + 1;
      invariant(member.ordinal === ordinal && member.xmlOccurrence === ordinal,
        `${releaseId} source order changed at ${ordinal}`);
      invariant(typeof member.animationId === 'string' &&
        SAFE_ANIMATION_ID.test(member.animationId),
      `${releaseId} member ${ordinal} animationId is invalid`);
      invariant(isObject(member.source) &&
        typeof member.source.path === 'string' &&
        SHA256_PATTERN.test(member.source.sha256 || ''),
      `${releaseId} member ${ordinal} source identity is invalid`);
      const sourcePath = safeRelativePath(
        member.source.path,
        `${releaseId} member ${ordinal} source.path`,
      );
      const placementId = member.placementId ?? null;
      invariant(placementId === null ||
        (typeof placementId === 'string' && /^[A-Za-z0-9._-]+$/u.test(placementId)),
      `${releaseId} member ${ordinal} placementId is invalid`);
      placements.push({
        placementKey: placementId ??
          `${releaseId}-ordinal-${String(ordinal).padStart(3, '0')}`,
        placementId,
        releaseId,
        grade: release.grade,
        lesson: release.lesson,
        ordinal,
        animationId: member.animationId,
        xmlOccurrence: member.xmlOccurrence,
        source: {path: sourcePath, sha256: member.source.sha256},
      });
    });
  }
  invariant(placements.length === EXPECTED_COUNTS.placements,
    'production placement denominator changed');
  invariant(new Set(placements.map(({placementKey}) => placementKey)).size ===
    placements.length, 'production placement keys are duplicated');
  invariant(new Set(placements.map(({animationId}) => animationId)).size ===
    EXPECTED_COUNTS.pageRuntimes,
  'production unique page-renderer denominator changed');
  return placements;
}

async function loadCatalog(projectRoot, relativePath, label) {
  const absolutePath = resolveInside(projectRoot, relativePath, label);
  const binding = await readJsonFile(absolutePath, label);
  return {
    path: relativePath,
    bytes: binding.bytes.length,
    sha256: binding.sha256,
    document: binding.document,
  };
}

function mapPlacementsToRuntimes(placements, runtimes) {
  const byAnimationId = new Map();
  for (const placement of placements) {
    const existing = byAnimationId.get(placement.animationId) ?? [];
    existing.push(placement);
    byAnimationId.set(placement.animationId, existing);
  }
  const pageRuntimeIds = new Set(
    runtimes.filter(({pageRenderer}) => pageRenderer)
      .map(({animationId}) => animationId),
  );
  invariant(pageRuntimeIds.size === EXPECTED_COUNTS.pageRuntimes,
    'v9 page runtime IDs are not unique');
  invariant([...pageRuntimeIds].every((animationId) =>
    byAnimationId.has(animationId)) &&
    [...byAnimationId.keys()].every((animationId) =>
      pageRuntimeIds.has(animationId)),
  'v9 page runtime IDs differ from the exact production placement catalog');
  const mapped = new Map();
  for (const [animationId, runtimePlacements] of byAnimationId) {
    const sourceKeys = new Set(runtimePlacements.map(({source}) =>
      canonicalJson(source)));
    invariant(sourceKeys.size === 1,
      `${animationId}: duplicate placements disagree on canonical source`);
    mapped.set(animationId, {
      mappingClass: 'active-page-placement',
      source: runtimePlacements[0].source,
      placements: runtimePlacements.map((placement) => ({
        placementKey: placement.placementKey,
        placementId: placement.placementId,
        releaseId: placement.releaseId,
        ordinal: placement.ordinal,
        xmlOccurrence: placement.xmlOccurrence,
      })),
    });
  }
  invariant(mapped.has(LOADED_HOST_PARENT_ANIMATION_ID),
    'loaded-host parent page is absent from production placements');
  const parent = mapped.get(LOADED_HOST_PARENT_ANIMATION_ID);
  mapped.set(LOADED_HOST_ANIMATION_ID, {
    mappingClass: 'loaded-swf-host-parent-page',
    parentAnimationId: LOADED_HOST_PARENT_ANIMATION_ID,
    source: parent.source,
    placements: parent.placements,
  });
  invariant(mapped.size === EXPECTED_COUNTS.runtimes,
    'runtime-to-source map must contain exactly 284 records');
  return mapped;
}

async function verifyCanonicalSources(canonicalSourceRoot, runtimeMappings) {
  const resolvedRoot = path.resolve(canonicalSourceRoot);
  const rootStat = await lstat(resolvedRoot);
  invariant(rootStat.isDirectory() && !rootStat.isSymbolicLink(),
    'canonical source root must be an ordinary directory, not a symlink');
  const cache = new Map();
  const results = new Map();
  for (const [animationId, mapping] of runtimeMappings) {
    const expected = mapping.source;
    const key = canonicalJson(expected);
    let verification = cache.get(key);
    if (!verification) {
      const absolutePath = resolveInside(
        resolvedRoot,
        expected.path,
        `${animationId} canonical SWF`,
      );
      try {
        const actual = await readStableOrdinaryFile(
          absolutePath,
          `${animationId} canonical SWF`,
        );
        verification = actual.sha256 === expected.sha256 ? {
          status: 'verified',
          path: expected.path,
          bytes: actual.bytes.length,
          sha256: actual.sha256,
        } : {
          status: 'no-go',
          path: expected.path,
          expectedSha256: expected.sha256,
          actualBytes: actual.bytes.length,
          actualSha256: actual.sha256,
          reasonCode: 'CANONICAL_SWF_HASH_MISMATCH',
        };
      } catch (error) {
        verification = {
          status: 'no-go',
          path: expected.path,
          expectedSha256: expected.sha256,
          reasonCode: 'CANONICAL_SWF_UNREADABLE',
          detail: error.message,
        };
      }
      cache.set(key, verification);
    }
    results.set(animationId, verification);
  }
  return results;
}

function isForbiddenProofPath(filePath) {
  const portablePath = portable(filePath);
  return FORBIDDEN_PROOF_PATH_PREFIXES.some((prefix) =>
    portablePath === prefix || portablePath.startsWith(prefix)) ||
    portablePath.includes('/public/flash-assets/') ||
    portablePath.includes('/flash-assets/courses/');
}

function validateProjectEvidencePath(filePath, label) {
  const normalized = safeRelativePath(filePath, label);
  invariant(ALLOWED_PROJECT_EVIDENCE_ROOTS.some((prefix) =>
    normalized.startsWith(prefix)), `${label} is outside approved evidence roots`);
  invariant(!isForbiddenProofPath(normalized),
    `${label} may not use a production runtime/profile/binding/apply receipt`);
  return normalized;
}

async function rehashEvidenceDescriptor(projectRoot, value, label) {
  const descriptor = validateFileDescriptor(value, label, {allowExtra: true});
  validateProjectEvidencePath(descriptor.path, `${label}.path`);
  await readProjectFile(projectRoot, descriptor, label);
  return descriptor;
}

function inventoryRecords(payload, label) {
  invariant(isObject(payload), `${label} payload must be an object`);
  invariant(Array.isArray(payload.records), `${label} payload.records is absent`);
  invariant(payload.records.length === EXPECTED_COUNTS.runtimes,
    `${label} must contain exactly 284 records`);
  const byAnimationId = new Map();
  for (const [index, record] of payload.records.entries()) {
    const animationId = record?.identity?.animationId ?? record?.animationId;
    invariant(isObject(record) && typeof animationId === 'string',
      `${label}.records[${index}] identity is invalid`);
    invariant(!byAnimationId.has(animationId),
      `${label} duplicates ${animationId}`);
    byAnimationId.set(animationId, record);
  }
  return byAnimationId;
}

async function loadOptionalInventory({
  projectRoot,
  relativePath,
  receiptType,
  label,
}) {
  if (!relativePath) return null;
  const normalizedPath = safeRelativePath(relativePath, `${label} path`);
  const absolutePath = resolveInside(projectRoot, normalizedPath, `${label} path`);
  let binding;
  try {
    binding = await readJsonFile(absolutePath, label);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  const payload = verifyHashBoundReceipt(
    binding.document,
    receiptType,
    label,
  );
  const insertionOrderPretty = Buffer.from(
    `${JSON.stringify(binding.document, null, 2)}\n`,
  );
  const exactInventoryEnvelopeOrder = canonicalJson(
    Object.keys(binding.document),
  ) === canonicalJson([
    'schemaVersion',
    'receiptType',
    'payloadSha256',
    'payload',
  ]);
  invariant(canonicalDocumentBytes(binding.document).equals(binding.bytes) ||
    canonicalPrettyDocumentBytes(binding.document).equals(binding.bytes) ||
    (exactInventoryEnvelopeOrder && insertionOrderPretty.equals(binding.bytes)),
  `${label} bytes are not deterministic canonical JSON`);
  return {
    path: normalizedPath,
    bytes: binding.bytes.length,
    sha256: binding.sha256,
    payloadSha256: binding.document.payloadSha256,
    payload,
    recordsByAnimationId: inventoryRecords(payload, label),
  };
}

function exactIdentityMatches(record, runtime) {
  const identity = record.identity ?? record;
  const v9 = record.v9 ?? record;
  return identity.animationId === runtime.animationId &&
    identity.pageRenderer === runtime.pageRenderer &&
    identity.assetPath === runtime.assetPath &&
    identity.lane === runtime.lane &&
    canonicalJson(v9.input) === canonicalJson(runtime.input) &&
    canonicalJson(v9.output) === canonicalJson(runtime.output);
}

function getEvidenceList(record, names) {
  for (const name of names) {
    if (Array.isArray(record[name])) return record[name];
  }
  return null;
}

function looksLikeRootedDescriptor(value) {
  return isObject(value) && typeof value.root === 'string' &&
    typeof value.path === 'string' && Number.isSafeInteger(value.bytes) &&
    typeof value.sha256 === 'string';
}

function collectRootedDescriptors(value, output = []) {
  if (looksLikeRootedDescriptor(value)) {
    output.push(value);
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectRootedDescriptors(item, output));
  } else if (isObject(value)) {
    Object.values(value).forEach((item) => collectRootedDescriptors(item, output));
  }
  return output;
}

async function rehashRootedEvidenceDescriptor(value, label, {
  purpose = 'evidence',
  projectRoot,
} = {}) {
  invariant(looksLikeRootedDescriptor(value), `${label} is not a rooted descriptor`);
  invariant(path.isAbsolute(value.root), `${label}.root must be absolute`);
  const evidenceRoot = path.resolve(value.root);
  const relativePath = safeRelativePath(value.path, `${label}.path`);
  invariant(Number.isSafeInteger(value.bytes) && value.bytes > 0,
    `${label}.bytes is invalid`);
  invariant(SHA256_PATTERN.test(value.sha256 || ''), `${label}.sha256 is invalid`);
  const rootStat = await lstat(evidenceRoot);
  invariant(rootStat.isDirectory() && !rootStat.isSymbolicLink(),
    `${label}.root must be an ordinary directory`);
  const absolutePath = resolveInside(evidenceRoot, relativePath, `${label}.path`);
  const actual = await readStableOrdinaryFile(absolutePath, label);
  invariant(actual.bytes.length === value.bytes && actual.sha256 === value.sha256,
    `${label} differs from its inventory identity`);
  const resolvedProjectRoot = path.resolve(projectRoot);
  const withinCurrentProject = isInside(absolutePath, resolvedProjectRoot);
  if (purpose !== 'materialization') {
    invariant(!isForbiddenProofPath(relativePath) &&
      !(withinCurrentProject && isForbiddenProofPath(
        portable(path.relative(resolvedProjectRoot, absolutePath)),
      )), `${label} may not use a production runtime/profile/binding`);
  }
  if (purpose === 'generator') {
    invariant(!relativePath.endsWith('/canvas-renderer.js') &&
      !relativePath.endsWith('canvas-renderer.js'),
    `${label} may not use a runtime as its generator`);
  }
  return {
    role: typeof value.role === 'string' ? value.role : purpose,
    root: evidenceRoot,
    path: relativePath,
    bytes: value.bytes,
    sha256: value.sha256,
  };
}

async function verifyRootedHashBoundJsonLinks(value, label, requiredDigests) {
  const evidenceRoot = path.resolve(value.root);
  const relativePath = safeRelativePath(value.path, `${label}.path`);
  invariant(relativePath.endsWith('.json'), `${label} must be JSON`);
  const binding = await readJsonFile(
    resolveInside(evidenceRoot, relativePath, `${label}.path`),
    label,
  );
  const document = binding.document;
  invariant(isObject(document) && isObject(document.payload),
    `${label} must contain a hash-bound payload`);
  if (typeof document.payloadSha256 === 'string') {
    invariant(document.payloadSha256 ===
      sha256(Buffer.from(canonicalJson(document.payload))),
    `${label} payloadSha256 mismatch`);
  } else if (typeof document.contentSha256 === 'string') {
    invariant(typeof document.artifactType === 'string' &&
      document.contentSha256 === sha256(Buffer.from(canonicalJson({
        schemaVersion: document.schemaVersion,
        artifactType: document.artifactType,
        payload: document.payload,
      }))), `${label} contentSha256 mismatch`);
  } else {
    throw new Error(`${label} lacks payloadSha256/contentSha256`);
  }
  const payloadText = canonicalJson(document.payload);
  for (const digest of requiredDigests) {
    invariant(payloadText.includes(digest),
      `${label} does not link required digest ${digest}`);
  }
  return true;
}

function sourceFirstMethod(record) {
  return record.method ?? record.regenerationMethod ??
    (Array.isArray(record.runEvidence) ?
      record.runEvidence.find((run) =>
        typeof (run?.method ?? run?.regenerationMethod) === 'string')?.method ??
        record.runEvidence.find((run) =>
          typeof run?.regenerationMethod === 'string')?.regenerationMethod :
      record.runEvidence?.method) ?? record.outputEvidence?.method ?? null;
}

function isGenuineSourceFirstMethod(method) {
  return method === 'fresh-source-factory-check-plus-current-js-check' ||
    method === 'fresh-source-generator-check';
}

async function assessCompactEvidenceGroup({
  projectRoot,
  runtime,
  canonicalSource,
  inventoryRecord,
}) {
  const reasons = [];
  const evidence = [];
  let generator = null;
  const group = inventoryRecord.__evidenceGroup;
  if (!isObject(group)) {
    return {
      qualified: false,
      reasons: [...new Set([
        ...(Array.isArray(inventoryRecord.blockerCodes) ?
          inventoryRecord.blockerCodes : []),
        'SOURCE_FIRST_EVIDENCE_GROUP_MISSING',
      ])],
      evidence,
      generator,
    };
  }
  if (inventoryRecord.verdict !== 'pass') {
    reasons.push(...(inventoryRecord.blockerCodes ?? [
      'SOURCE_FIRST_INVENTORY_NOT_PASS',
    ]));
  }
  if (group.verdict !== 'pass') reasons.push('SOURCE_FIRST_GROUP_NOT_PASS');
  const freshMethods = new Set([
    'fresh-source-first-no-browser-check',
    'fresh-source-bound-loaded-host-no-browser-check',
  ]);
  if (!freshMethods.has(group.closureMethod)) {
    reasons.push('SOURCE_FIRST_GROUP_NOT_CANONICAL_FRESH_SOURCE_FIRST');
  }
  const limitationText = [
    ...(Array.isArray(group.limitations) ? group.limitations : []),
    ...(Array.isArray(inventoryRecord.limitations) ?
      inventoryRecord.limitations : []),
  ].join(' ').toLowerCase();
  if (/(historic|ignored|dirty|intermediate|does not rerun)/u.test(limitationText)) {
    reasons.push('SOURCE_FIRST_GROUP_CANONICALITY_LIMITATION');
  }
  const descriptorTexts = [];
  let generatorCount = 0;
  for (const [index, item] of (group.descriptors ?? []).entries()) {
    try {
      const purpose = /generator|adapter|dependency/u.test(item.role ?? '') ?
        'generator' : 'materialization';
      const descriptor = await rehashRootedEvidenceDescriptor(
        item,
        `${runtime.animationId} evidence group descriptor ${index}`,
        {purpose, projectRoot},
      );
      invariant(!descriptor.path.endsWith('/canvas-renderer.js'),
        'evidence group descriptor may not be a runtime');
      evidence.push(descriptor);
      if (purpose === 'generator') {
        generatorCount += 1;
        generator ??= {
          path: `${descriptor.root}/${descriptor.path}`,
          bytes: descriptor.bytes,
          sha256: descriptor.sha256,
        };
      }
      if (descriptor.path.endsWith('.json')) {
        const bytes = await readFile(path.join(descriptor.root, descriptor.path));
        descriptorTexts.push(bytes.toString('utf8'));
      }
    } catch (error) {
      reasons.push(`SOURCE_FIRST_GROUP_DESCRIPTOR_INVALID:${error.message}`);
    }
  }
  if (generatorCount === 0) reasons.push('SOURCE_FIRST_GROUP_GENERATOR_MISSING');
  const replays = Array.isArray(group.replays) ? group.replays : [];
  if (replays.length === 0) reasons.push('SOURCE_FIRST_GROUP_REPLAY_MISSING');
  for (const [index, replay] of replays.entries()) {
    const valid = isObject(replay) && typeof replay.command === 'string' &&
      replay.command.length > 0 && replay.exitCode === 0 &&
      replay.browserLaunched === false && isObject(replay.observed) &&
      !/(--apply|playwright|chromium|deploy|vercel)/iu.test(replay.command);
    if (!valid) reasons.push(`SOURCE_FIRST_GROUP_REPLAY_INVALID:${index}`);
  }
  const materialization = inventoryRecord.observedV1Materialization;
  if (!looksLikeRootedDescriptor(materialization)) {
    reasons.push('SOURCE_FIRST_OBSERVED_V1_MATERIALIZATION_MISSING');
  } else {
    try {
      const descriptor = await rehashRootedEvidenceDescriptor(
        materialization,
        `${runtime.animationId} observed v1 materialization`,
        {purpose: 'materialization', projectRoot},
      );
      evidence.push(descriptor);
      if (descriptor.bytes !== runtime.input.bytes ||
        descriptor.sha256 !== runtime.input.sha256) {
        reasons.push('SOURCE_FIRST_OBSERVED_V1_MATERIALIZATION_MISMATCH');
      }
    } catch (error) {
      reasons.push(`SOURCE_FIRST_OBSERVED_V1_MATERIALIZATION_INVALID:${error.message}`);
    }
  }
  const linkedText = descriptorTexts.join('\n');
  if (!linkedText.includes(runtime.animationId) ||
    !linkedText.includes(runtime.input.sha256) ||
    !linkedText.includes(canonicalSource.sha256)) {
    reasons.push('SOURCE_FIRST_GROUP_MEMBER_SOURCE_OUTPUT_LINK_INCOMPLETE');
  }
  if (inventoryRecord.plannedAdaptiveOutputMaterializedOrRehashedByThisTask !==
    false) {
    reasons.push('SOURCE_FIRST_INVENTORY_BOUNDARY_INVALID');
  }
  return {qualified: reasons.length === 0, reasons, evidence, generator};
}

async function assessSourceFirstRecord({
  projectRoot,
  runtime,
  canonicalSource,
  inventoryRecord,
}) {
  const reasons = [];
  const evidence = [];
  let generator = null;
  if (!inventoryRecord) {
    reasons.push('SOURCE_FIRST_INVENTORY_RECORD_MISSING');
    return {qualified: false, reasons, evidence, generator};
  }
  if (Object.hasOwn(inventoryRecord, 'evidenceGroupId')) {
    if (!exactIdentityMatches(inventoryRecord, runtime)) {
      return {
        qualified: false,
        reasons: ['SOURCE_FIRST_PLAN_IDENTITY_MISMATCH'],
        evidence,
        generator,
      };
    }
    return assessCompactEvidenceGroup({
      projectRoot,
      runtime,
      canonicalSource,
      inventoryRecord,
    });
  }
  if (!exactIdentityMatches(inventoryRecord, runtime)) {
    reasons.push('SOURCE_FIRST_PLAN_IDENTITY_MISMATCH');
  }
  if (inventoryRecord.verdict !== 'pass') {
    reasons.push('SOURCE_FIRST_INVENTORY_NOT_PASS');
  }
  const method = sourceFirstMethod(inventoryRecord);
  if (!isGenuineSourceFirstMethod(method)) {
    reasons.push('SOURCE_FIRST_METHOD_NOT_GENUINE_SOURCE_FIRST');
  }
  const sourceDescriptors = Array.isArray(inventoryRecord.canonicalSources) ?
    inventoryRecord.canonicalSources : [];
  let canonicalSourceMatched = false;
  for (const [index, item] of sourceDescriptors.entries()) {
    try {
      const descriptor = await rehashRootedEvidenceDescriptor(
        item,
        `${runtime.animationId} canonical source ${index}`,
        {purpose: 'source', projectRoot},
      );
      evidence.push(descriptor);
      if (descriptor.path === canonicalSource.path &&
        descriptor.bytes === canonicalSource.bytes &&
        descriptor.sha256 === canonicalSource.sha256) {
        canonicalSourceMatched = true;
      }
    } catch (error) {
      reasons.push(`SOURCE_FIRST_CANONICAL_SOURCE_INVALID:${error.message}`);
    }
  }
  if (!canonicalSourceMatched) {
    reasons.push('SOURCE_FIRST_CANONICAL_SOURCE_MISMATCH');
  }
  const generatorDescriptors = collectRootedDescriptors(
    inventoryRecord.generatorEvidence ?? inventoryRecord.generator,
  );
  const generatorDigests = [];
  if (generatorDescriptors.length === 0) {
    reasons.push('SOURCE_FIRST_GENERATOR_MISSING');
  } else {
    for (const [index, item] of generatorDescriptors.entries()) {
      try {
        const descriptor = await rehashRootedEvidenceDescriptor(
          item,
          `${runtime.animationId} source-first generator ${index}`,
          {purpose: 'generator', projectRoot},
        );
        evidence.push(descriptor);
        generatorDigests.push(descriptor.sha256);
        generator ??= {
          path: `${descriptor.root}/${descriptor.path}`,
          bytes: descriptor.bytes,
          sha256: descriptor.sha256,
        };
      } catch (error) {
        reasons.push(`SOURCE_FIRST_GENERATOR_INVALID:${error.message}`);
      }
    }
  }
  const runDescriptors = collectRootedDescriptors(inventoryRecord.runEvidence);
  let validRunContractCount = 0;
  if (runDescriptors.length === 0) {
    reasons.push('SOURCE_FIRST_RUN_EVIDENCE_MISSING');
  } else {
    for (const [index, item] of runDescriptors.entries()) {
      try {
        evidence.push(await rehashRootedEvidenceDescriptor(
          item,
          `${runtime.animationId} source-first run evidence ${index}`,
          {purpose: 'run', projectRoot},
        ));
        await verifyRootedHashBoundJsonLinks(
          item,
          `${runtime.animationId} source-first run evidence ${index}`,
          [canonicalSource.sha256, runtime.input.sha256, ...generatorDigests.slice(0, 1)],
        );
      } catch (error) {
        reasons.push(`SOURCE_FIRST_RUN_EVIDENCE_INVALID:${error.message}`);
      }
    }
  }
  const runObjects = Array.isArray(inventoryRecord.runEvidence) ?
    inventoryRecord.runEvidence : [];
  for (const [index, run] of runObjects.entries()) {
    const hasDescriptor = collectRootedDescriptors(run).length > 0;
    const valid = isObject(run) && typeof run.command === 'string' &&
      run.command.length > 0 && run.mode === 'check' &&
      run.browserLaunched === false && run.applyRun !== true &&
      run.exitCode === 0 && hasDescriptor &&
      (typeof run.observedSummary === 'string' || isObject(run.observedSummary));
    if (valid) validRunContractCount += 1;
    else reasons.push(`SOURCE_FIRST_RUN_CONTRACT_INVALID:${index}`);
  }
  if (validRunContractCount === 0) {
    reasons.push('SOURCE_FIRST_RUN_CONTRACT_MISSING');
  }
  const memberDescriptors = collectRootedDescriptors(inventoryRecord.memberEvidence);
  if (memberDescriptors.length === 0) {
    reasons.push('SOURCE_FIRST_MEMBER_EVIDENCE_MISSING');
  } else {
    for (const [index, item] of memberDescriptors.entries()) {
      try {
        evidence.push(await rehashRootedEvidenceDescriptor(
          item,
          `${runtime.animationId} source-first member evidence ${index}`,
          {purpose: 'member', projectRoot},
        ));
        await verifyRootedHashBoundJsonLinks(
          item,
          `${runtime.animationId} source-first member evidence ${index}`,
          [canonicalSource.sha256, runtime.input.sha256],
        );
      } catch (error) {
        reasons.push(`SOURCE_FIRST_MEMBER_EVIDENCE_INVALID:${error.message}`);
      }
    }
  }
  const outputDescriptors = collectRootedDescriptors(inventoryRecord.outputEvidence);
  const matchingInputs = [];
  if (outputDescriptors.length > 0) {
    for (const [index, item] of outputDescriptors.entries()) {
      try {
        const descriptor = await rehashRootedEvidenceDescriptor(
          item,
          `${runtime.animationId} source-first output evidence ${index}`,
          {purpose: 'materialization', projectRoot},
        );
        evidence.push(descriptor);
        if (descriptor.bytes === runtime.input.bytes &&
          descriptor.sha256 === runtime.input.sha256) {
          matchingInputs.push(descriptor);
        }
      } catch (error) {
        reasons.push(`SOURCE_FIRST_OUTPUT_EVIDENCE_INVALID:${error.message}`);
      }
    }
  }
  const inputAttestation = inventoryRecord.outputEvidence?.v9InputMaterialization ??
    inventoryRecord.outputEvidence?.v9Input ??
    inventoryRecord.outputEvidence?.inputIdentity ?? null;
  if (isObject(inputAttestation) &&
    inputAttestation.bytes === runtime.input.bytes &&
    inputAttestation.sha256 === runtime.input.sha256 &&
    inputAttestation.matchesV9Input === true &&
    validRunContractCount > 0 && memberDescriptors.length > 0) {
    matchingInputs.push({
      role: 'v9-input-materialization-attestation',
      bytes: inputAttestation.bytes,
      sha256: inputAttestation.sha256,
      boundByRunAndMemberEvidence: true,
    });
  }
  if (outputDescriptors.length === 0 && !isObject(inputAttestation)) {
    reasons.push('SOURCE_FIRST_OUTPUT_EVIDENCE_MISSING');
  }
  if (matchingInputs.length === 0) {
    reasons.push('SOURCE_FIRST_REGENERATED_V9_INPUT_MISMATCH');
  }
  if (runObjects.some((run) => run.browserLaunched === true ||
    run.applyRun === true || run.mode === 'apply')) {
    reasons.push('SOURCE_FIRST_RUN_BOUNDARY_VIOLATION');
  }
  return {
    qualified: reasons.length === 0,
    reasons,
    evidence,
    generator,
  };
}

async function assessAdvancedManualRecord({
  projectRoot,
  runtime,
  canonicalSource,
  inventoryRecord,
}) {
  const reasons = [];
  const evidence = [];
  let generator = null;
  if (!inventoryRecord) {
    reasons.push('CANONICAL_ADVANCED_MANUAL_RECORD_MISSING');
    return {qualified: false, reasons, evidence, generator};
  }
  if (!exactIdentityMatches(inventoryRecord, runtime)) {
    reasons.push('CANONICAL_ADVANCED_MANUAL_PLAN_IDENTITY_MISMATCH');
  }
  if (inventoryRecord.verdict !== 'pass' && inventoryRecord.status !== 'pass') {
    reasons.push('CANONICAL_ADVANCED_MANUAL_NOT_PASS');
  }
  if (inventoryRecord.canonicalAdvancedManualContract !== true ||
    inventoryRecord.sourceBound !== true ||
    inventoryRecord.runtimeSelfProof === true) {
    reasons.push('CANONICAL_ADVANCED_MANUAL_CONTRACT_NOT_PROVEN');
  }
  const source = inventoryRecord.canonicalSource ?? inventoryRecord.source;
  if (!isObject(source) || source.path !== canonicalSource.path ||
    source.bytes !== canonicalSource.bytes || source.sha256 !== canonicalSource.sha256) {
    reasons.push('CANONICAL_ADVANCED_MANUAL_SOURCE_MISMATCH');
  }
  const contractEvidence = getEvidenceList(inventoryRecord, [
    'contractEvidence',
    'sourceEvidence',
    'evidence',
  ]);
  const requiredRoles = new Set([
    'source-analysis',
    'lane-selection',
    'implementation-contract',
    'deterministic-test',
  ]);
  if (!contractEvidence || contractEvidence.length === 0) {
    reasons.push('CANONICAL_ADVANCED_MANUAL_EVIDENCE_MISSING');
  } else {
    for (const [index, item] of contractEvidence.entries()) {
      try {
        const descriptor = await rehashEvidenceDescriptor(
          projectRoot,
          item,
          `${runtime.animationId} advanced-manual evidence ${index}`,
        );
        if (typeof item.role === 'string') requiredRoles.delete(item.role);
        evidence.push({role: item.role ?? 'advanced-manual-evidence', ...descriptor});
      } catch (error) {
        reasons.push(`CANONICAL_ADVANCED_MANUAL_EVIDENCE_INVALID:${error.message}`);
      }
    }
  }
  if (requiredRoles.size > 0) {
    reasons.push(
      `CANONICAL_ADVANCED_MANUAL_REQUIRED_ROLES_MISSING:${[...requiredRoles].sort(compareText).join(',')}`,
    );
  }
  if (!isObject(inventoryRecord.generator)) {
    reasons.push('CANONICAL_ADVANCED_MANUAL_GENERATOR_MISSING');
  } else {
    try {
      generator = await rehashEvidenceDescriptor(
        projectRoot,
        inventoryRecord.generator,
        `${runtime.animationId} advanced-manual generator`,
      );
    } catch (error) {
      reasons.push(`CANONICAL_ADVANCED_MANUAL_GENERATOR_INVALID:${error.message}`);
    }
  }
  const generatedInput = inventoryRecord.regeneratedInput ??
    inventoryRecord.regeneratedInputArtifact;
  const generatedOutput = inventoryRecord.regeneratedOutput ??
    inventoryRecord.regeneratedOutputArtifact;
  for (const [name, artifact, expected] of [
    ['input', generatedInput, runtime.input],
    ['output', generatedOutput, runtime.output],
  ]) {
    if (!isObject(artifact)) {
      reasons.push(`CANONICAL_ADVANCED_MANUAL_${name.toUpperCase()}_MISSING`);
      continue;
    }
    try {
      const descriptor = await rehashEvidenceDescriptor(
        projectRoot,
        artifact,
        `${runtime.animationId} advanced-manual ${name}`,
      );
      if (descriptor.bytes !== expected.bytes || descriptor.sha256 !== expected.sha256) {
        reasons.push(`CANONICAL_ADVANCED_MANUAL_${name.toUpperCase()}_MISMATCH`);
      } else {
        evidence.push({role: `canonical-advanced-manual-${name}`, ...descriptor});
      }
    } catch (error) {
      reasons.push(`CANONICAL_ADVANCED_MANUAL_${name.toUpperCase()}_INVALID:${error.message}`);
    }
  }
  return {
    qualified: reasons.length === 0,
    reasons,
    evidence,
    generator,
  };
}

function makeReviewDocument(payload) {
  return {
    schemaVersion: 1,
    receiptType: REVIEW_RECEIPT_TYPE,
    payloadSha256: sha256(Buffer.from(canonicalJson(payload))),
    payload,
  };
}

export function validateReviewDocument(document) {
  const payload = verifyHashBoundReceipt(
    document,
    REVIEW_RECEIPT_TYPE,
    'regeneration provenance review',
  );
  invariant(payload.applyAuthorization === false,
    'review artifact must never authorize apply');
  invariant(payload.status === 'pass' || payload.status === 'no-go',
    'review status is invalid');
  invariant(Array.isArray(payload.records) &&
    payload.records.length === EXPECTED_COUNTS.runtimes,
  'review must contain exactly 284 records');
  return true;
}

async function writeCreateExclusive(destination, bytes) {
  let handle;
  try {
    handle = await open(destination, 'wx', 0o444);
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle?.close();
  }
}

async function writeOrCheckReview({projectRoot, outputPath, bytes, check}) {
  const normalized = safeRelativePath(outputPath, 'review output path');
  invariant(path.posix.dirname(normalized) === 'work' &&
    path.posix.basename(normalized) ===
      path.posix.basename(DEFAULT_OUTPUT_PATH),
  'review output must be the fixed direct-child non-apply review path');
  invariant(normalized !==
    'work/adaptive-canvas-production-five.regeneration-provenance.v1.json',
  'review tool may not write the apply provenance receipt');
  const destination = resolveInside(projectRoot, normalized, 'review output path');
  if (check) {
    const actual = await readStableOrdinaryFile(destination, 'existing review');
    invariant(actual.bytes.equals(bytes),
      'existing review artifact is absent, stale, or byte-mismatched');
  } else {
    await writeCreateExclusive(destination, bytes);
  }
  return normalized;
}

export async function buildRegenerationProvenanceReview({
  projectRoot = DEFAULT_PROJECT_ROOT,
  planPath = DEFAULT_PLAN_PATH,
  freezePath = DEFAULT_FREEZE_PATH,
  sourceFirstInventoryPath = DEFAULT_SOURCE_FIRST_INVENTORY_PATH,
  advancedManualInventoryPath = null,
  canonicalSourceRoot,
}) {
  invariant(typeof canonicalSourceRoot === 'string' &&
    path.isAbsolute(canonicalSourceRoot),
  '--canonical-source-root must be an explicit absolute read-only source root');
  const root = path.resolve(projectRoot);
  const plan = await loadPlan(root, planPath);
  const freeze = await loadFreeze(root, freezePath, plan);
  const catalogs = [
    await loadCatalog(root, MAIN_RELEASE_CATALOG, 'main release catalog'),
    await loadCatalog(root, PAGE_ONLY_RELEASE_CATALOG, 'page-only release catalog'),
  ];
  const placements = resolveProductionPlacements({
    releaseCatalogDocuments: catalogs.map(({document}) => document),
  });
  const runtimeMappings = mapPlacementsToRuntimes(placements, plan.payload.runtimes);
  const canonicalSources = await verifyCanonicalSources(
    canonicalSourceRoot,
    runtimeMappings,
  );
  const sourceFirstInventory = await loadOptionalInventory({
    projectRoot: root,
    relativePath: sourceFirstInventoryPath,
    receiptType: SOURCE_FIRST_INVENTORY_RECEIPT_TYPE,
    label: 'source-first regeneration inventory',
  });
  const advancedManualInventory = await loadOptionalInventory({
    projectRoot: root,
    relativePath: advancedManualInventoryPath,
    receiptType: ADVANCED_MANUAL_INVENTORY_RECEIPT_TYPE,
    label: 'canonical advanced-manual inventory',
  });

  const records = [];
  for (const runtimeRecord of plan.payload.runtimes) {
    const runtime = exactRuntimeIdentity(runtimeRecord);
    const mapping = runtimeMappings.get(runtime.animationId);
    invariant(mapping, `${runtime.animationId}: canonical source mapping is absent`);
    const canonicalSource = canonicalSources.get(runtime.animationId);
    const baseReasons = canonicalSource.status === 'verified' ? [] : [
      canonicalSource.reasonCode,
    ];
    const rawSourceFirstRecord = sourceFirstInventory?.recordsByAnimationId.get(
      runtime.animationId,
    );
    const sourceFirstRecord = rawSourceFirstRecord ? {
      ...rawSourceFirstRecord,
      __evidenceGroup: sourceFirstInventory.payload.evidenceGroups?.[
        rawSourceFirstRecord.evidenceGroupId
      ],
    } : undefined;
    const sourceFirst = await assessSourceFirstRecord({
      projectRoot: root,
      runtime,
      canonicalSource: canonicalSource.status === 'verified' ?
        canonicalSource : {...mapping.source, bytes: null},
      inventoryRecord: sourceFirstRecord,
    });
    const advancedManual = await assessAdvancedManualRecord({
      projectRoot: root,
      runtime,
      canonicalSource: canonicalSource.status === 'verified' ?
        canonicalSource : {...mapping.source, bytes: null},
      inventoryRecord: advancedManualInventory?.recordsByAnimationId.get(
        runtime.animationId,
      ),
    });
    const sourceFirstQualified = baseReasons.length === 0 && sourceFirst.qualified;
    const advancedManualQualified = baseReasons.length === 0 &&
      advancedManual.qualified;
    const qualified = sourceFirstQualified || advancedManualQualified;
    const chosen = sourceFirstQualified ? sourceFirst :
      advancedManualQualified ? advancedManual : null;
    const reasons = qualified ? [] : [...new Set([
      ...baseReasons,
      ...sourceFirst.reasons,
      ...advancedManual.reasons,
    ])].sort(compareText);
    records.push({
      ...runtime,
      sourceMapping: {
        mappingClass: mapping.mappingClass,
        ...(mapping.parentAnimationId ?
          {parentAnimationId: mapping.parentAnimationId} : {}),
        placements: mapping.placements,
      },
      canonicalSource,
      disposition: qualified ? 'pass' : 'no-go',
      provenanceClass: sourceFirstQualified ? 'source-first-regeneration' :
        advancedManualQualified ? 'canonical-advanced-manual' : null,
      sourceEvidence: chosen?.evidence ?? [],
      generator: chosen?.generator ?? null,
      noGoReasons: reasons,
    });
  }
  invariant(records.length === EXPECTED_COUNTS.runtimes,
    'review record denominator changed');
  const passCount = records.filter(({disposition}) => disposition === 'pass').length;
  const noGoCount = records.length - passCount;
  const payload = {
    status: noGoCount === 0 ? 'pass' : 'no-go',
    authorityClass:
      'independent-non-authorizing-gate0a-regeneration-provenance-review',
    provenancePolicy: 'source-first-or-canonical-advanced-manual-v1',
    applyAuthorization: false,
    boundary: {
      browserStarted: false,
      applyExecuted: false,
      productionRendererModified: false,
      v2ProfileModified: false,
      activeBindingModified: false,
      deploymentModified: false,
      applySentinelModified: false,
      flashFidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictCompletionChanged: false,
      releaseEligibilityChanged: false,
      publicationChanged: false,
    },
    frozenInputs: {
      plan: {
        path: plan.path,
        bytes: plan.bytes,
        sha256: plan.sha256,
        payloadSha256: plan.payloadSha256,
      },
      freeze,
      releaseCatalogs: catalogs.map(({path: filePath, bytes, sha256: digest}) => ({
        path: filePath,
        bytes,
        sha256: digest,
      })),
      sourceFirstInventory: sourceFirstInventory ? {
        path: sourceFirstInventory.path,
        bytes: sourceFirstInventory.bytes,
        sha256: sourceFirstInventory.sha256,
        payloadSha256: sourceFirstInventory.payloadSha256,
      } : null,
      advancedManualInventory: advancedManualInventory ? {
        path: advancedManualInventory.path,
        bytes: advancedManualInventory.bytes,
        sha256: advancedManualInventory.sha256,
        payloadSha256: advancedManualInventory.payloadSha256,
      } : null,
    },
    placementSet: {
      placementCount: placements.length,
      uniquePageRendererCount: new Set(
        placements.map(({animationId}) => animationId),
      ).size,
      duplicatePlacementAnimationIds: [...new Set(
        placements.map(({animationId}) => animationId)
          .filter((animationId, index, values) =>
            values.indexOf(animationId) !== index),
      )].sort(compareText),
    },
    runtimeSet: plan.runtimeSet,
    summary: {
      totalRuntimeCount: records.length,
      passCount,
      noGoCount,
      sourceFirstPassCount: records.filter(({provenanceClass}) =>
        provenanceClass === 'source-first-regeneration').length,
      canonicalAdvancedManualPassCount: records.filter(({provenanceClass}) =>
        provenanceClass === 'canonical-advanced-manual').length,
      canonicalSourceVerifiedCount: records.filter(({canonicalSource}) =>
        canonicalSource.status === 'verified').length,
      candidateInventoryClaimedPassCount: sourceFirstInventory ?
        [...sourceFirstInventory.recordsByAnimationId.values()].filter(
          ({verdict}) => verdict === 'pass',
        ).length : 0,
      candidateInventoryClaimedNoGoCount: sourceFirstInventory ?
        [...sourceFirstInventory.recordsByAnimationId.values()].filter(
          ({verdict}) => verdict !== 'pass',
        ).length : 0,
    },
    records,
  };
  const document = makeReviewDocument(payload);
  validateReviewDocument(document);
  return {document, bytes: canonicalDocumentBytes(document)};
}

function usage() {
  return [
    'Usage:',
    '  node scripts/build-adaptive-canvas-regeneration-provenance-review.mjs \\',
    '    --canonical-source-root <absolute-read-only-source-root> \\',
    '    [--source-first-inventory <work/*.json>] \\',
    '    [--advanced-manual-inventory <work/*.json>] [--check]',
    '',
    'This command only writes/checks the fixed non-apply review artifact.',
    'It never creates the apply provenance receipt and has no --apply mode.',
  ].join('\n');
}

function parseArgs(argv) {
  const options = {
    projectRoot: DEFAULT_PROJECT_ROOT,
    planPath: DEFAULT_PLAN_PATH,
    freezePath: DEFAULT_FREEZE_PATH,
    sourceFirstInventoryPath: DEFAULT_SOURCE_FIRST_INVENTORY_PATH,
    advancedManualInventoryPath: null,
    outputPath: DEFAULT_OUTPUT_PATH,
    canonicalSourceRoot: null,
    check: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') return {help: true};
    if (arg === '--check') {
      options.check = true;
      continue;
    }
    invariant(arg !== '--apply', 'this review-only tool has no --apply mode');
    const next = argv[index + 1];
    invariant(typeof next === 'string' && !next.startsWith('--'),
      `${arg} requires a value`);
    index += 1;
    if (arg === '--project-root') options.projectRoot = path.resolve(next);
    else if (arg === '--plan') options.planPath = next;
    else if (arg === '--freeze') options.freezePath = next;
    else if (arg === '--source-first-inventory') {
      options.sourceFirstInventoryPath = next;
    } else if (arg === '--advanced-manual-inventory') {
      options.advancedManualInventoryPath = next;
    } else if (arg === '--canonical-source-root') {
      options.canonicalSourceRoot = path.resolve(next);
    } else if (arg === '--output') options.outputPath = next;
    else throw new Error(`unknown argument: ${arg}`);
  }
  return options;
}

export async function runCli(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return null;
  }
  const built = await buildRegenerationProvenanceReview(options);
  await writeOrCheckReview({
    projectRoot: options.projectRoot,
    outputPath: options.outputPath,
    bytes: built.bytes,
    check: options.check,
  });
  const summary = built.document.payload.summary;
  process.stdout.write(`${JSON.stringify({
    status: built.document.payload.status,
    output: options.outputPath,
    sha256: sha256(built.bytes),
    ...summary,
  })}\n`);
  return built.document;
}

if (path.resolve(process.argv[1] ?? '') === SCRIPT_PATH) {
  runCli().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
