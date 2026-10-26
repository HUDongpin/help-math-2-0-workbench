#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, realpath, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inflateSync} from 'node:zlib';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const SOURCE_ENV = 'HELP_MATH_G678_SOURCE_ROOT';
const STRUCTURAL_INVENTORY =
  'catalog/g678-pure-linear-structural-inventory-v1.json';
const FAMILY =
  'catalog/product-bridge-calibrations/g678-pure-linear-family-calibration-v1.json';
const OUTPUT = 'catalog/g678-pure-linear-reviewed-inventory-v1.json';
const REPRESENTATIVE_SHA =
  'cb4b046089166eef2dd0407a921b91c89d33fe6d99071915325de3439b3b2653';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function absolute(relativePath) {
  const result = path.resolve(ROOT, relativePath);
  invariant(result.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return result;
}

async function ordinary(relativePath, json = false) {
  const target = absolute(relativePath);
  const before = await lstat(target, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${relativePath} must be an ordinary single-link file`);
  const bytes = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, bytes: bytes.length,
    sha256: sha256(bytes), buffer: bytes,
    ...(json ? {value: JSON.parse(bytes)} : {})});
}

function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}

function readBits(bytes, bitOffset, width) {
  let value = 0;
  for (let index = 0; index < width; index += 1) {
    const absoluteBit = bitOffset + index;
    const byte = bytes[Math.floor(absoluteBit / 8)];
    invariant(byte !== undefined, 'truncated SWF bit field');
    value = value * 2 + ((byte >> (7 - (absoluteBit % 8))) & 1);
  }
  return value;
}

function decompressed(source) {
  const signature = source.subarray(0, 3).toString('ascii');
  if (signature === 'FWS') return Buffer.from(source);
  invariant(signature === 'CWS', `unsupported SWF signature ${signature}`);
  const result = Buffer.concat([
    Buffer.from('FWS'),
    source.subarray(3, 8),
    inflateSync(source.subarray(8)),
  ]);
  result.writeUInt32LE(result.length, 4);
  return result;
}

/** Extract only top-level DoAction bodies. DefineSprite bodies are skipped as
 * one definition tag, so a successful exact match cannot hide a child script. */
export function rootDoActions(source) {
  const bytes = decompressed(source);
  const rectBits = readBits(bytes, 8 * 8, 5);
  const rectBytes = Math.ceil((5 + 4 * rectBits) / 8);
  let offset = 8 + rectBytes + 4;
  let frame = 1;
  const actions = [];
  while (offset + 2 <= bytes.length) {
    const header = bytes.readUInt16LE(offset);
    offset += 2;
    const code = header >> 6;
    let length = header & 0x3f;
    if (length === 0x3f) {
      invariant(offset + 4 <= bytes.length, 'truncated long SWF tag');
      length = bytes.readUInt32LE(offset);
      offset += 4;
    }
    invariant(offset + length <= bytes.length, 'truncated SWF tag body');
    const body = bytes.subarray(offset, offset + length);
    if (code === 12) {
      actions.push(Object.freeze({frame, bytes: body.length,
        sha256: sha256(body)}));
    }
    if (code === 1) frame += 1;
    offset += length;
    if (code === 0) break;
  }
  return Object.freeze(actions);
}

async function sourceRoot() {
  const requested = process.env[SOURCE_ENV];
  invariant(typeof requested === 'string' && requested.length > 0,
    `${SOURCE_ENV} is required`);
  const root = path.resolve(requested);
  const resolved = await realpath(root);
  const metadata = await lstat(root, {bigint: true});
  invariant(root === resolved && metadata.isDirectory() &&
    !metadata.isSymbolicLink() && (metadata.mode & 0o222n) === 0n,
  `${SOURCE_ENV} must be a real read-only directory`);
  return Object.freeze({root, identity: Object.freeze({
    realPathSha256: sha256(resolved), device: String(metadata.dev),
    inode: String(metadata.ino), mode: Number(metadata.mode & 0o777n),
  })});
}

async function readSource(root, record) {
  const viewPath = record.sourcePaths[0];
  const target = path.join(root, ...viewPath.split('/'));
  invariant(target.startsWith(`${root}${path.sep}`),
    `${viewPath} escapes source root`);
  const before = await lstat(target, {bigint: true});
  const resolved = await realpath(target);
  invariant(resolved === target && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n &&
    (before.mode & 0o222n) === 0n,
  `${viewPath} must be an ordinary read-only source`);
  const bytes = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink &&
    bytes.length === record.sourceBytes &&
    sha256(bytes) === record.sourceSha256,
  `${viewPath} bytes or identity drifted`);
  return bytes;
}

async function mapConcurrent(items, concurrency, mapper) {
  const result = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({length: Math.min(concurrency, items.length)},
    async () => {
      while (cursor < items.length) {
        const index = cursor++;
        result[index] = await mapper(items[index]);
      }
    }));
  return result;
}

async function expectedReview() {
  const [inventory, family, builder, source] = await Promise.all([
    ordinary(STRUCTURAL_INVENTORY, true), ordinary(FAMILY, true),
    ordinary(path.relative(ROOT, SCRIPT_PATH)), sourceRoot(),
  ]);
  invariant(inventory.value.summary?.scannedUniqueSwfs === 2240 &&
    inventory.value.summary?.scannedPlacements === 2282 &&
    inventory.value.summary?.structuralCandidateUniqueSwfs === 156 &&
    inventory.value.summary?.structuralCandidatePlacements === 157,
  'structural inventory denominator drifted');
  invariant(family.value.scaleOutAuthorization?.authorized === true &&
    family.value.scaleOutAuthorization?.scope ===
      'exact-structural-classifier-matches-only',
  'family calibration authorization drifted');
  const candidates = inventory.value.records.filter((record) =>
    record.classification.structuralCandidate);
  const representative = candidates.find((record) =>
    record.sourceSha256 === REPRESENTATIVE_SHA);
  invariant(representative, 'pure-linear representative is absent');
  const representativeActions = rootDoActions(
    await readSource(source.root, representative));
  invariant(representativeActions.length === 2 &&
    representativeActions[0].frame === 1 &&
    representativeActions[1].frame === 6,
  'representative compiled root action boundary drifted');
  const reviewed = await mapConcurrent(candidates, 4, async (record) => {
    const actions = rootDoActions(await readSource(source.root, record));
    const exact = JSON.stringify(actions) ===
      JSON.stringify(representativeActions);
    return Object.freeze({
      sourceSha256: record.sourceSha256,
      sourceBytes: record.sourceBytes,
      sourcePaths: record.sourcePaths,
      placementIds: record.placementIds,
      lessons: record.lessons,
      mainFrameDomain: record.classification.mainFrameDomain,
      mainFrameCount: record.classification.mainFrameCount,
      rootFrameCount: record.classification.rootFrameCount,
      rootDoActions: actions,
      exactRepresentativeCompiledRootActions: exact,
      generationAuthorized: exact,
      disposition: exact
        ? 'authorized-pure-linear-source-static-visual-current-js'
        : 'not-authorized-root-action-bytes-differ',
    });
  });
  const authorized = reviewed.filter((record) => record.generationAuthorized);
  const authorizedPlacements = authorized.flatMap((record) =>
    record.placementIds).sort();
  const authorizedLessons = [...new Set(authorized.flatMap((record) =>
    record.lessons))].sort();
  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-pure-linear-reviewed-inventory-v1',
    inventoryId: 'g678-pure-linear-reviewed-inventory-v1',
    status: 'exact-compiled-root-action-review-complete',
    inputs: Object.freeze({structuralInventory: descriptor(inventory),
      familyCalibration: descriptor(family), builder: descriptor(builder)}),
    sourceRoot: Object.freeze({environmentVariable: SOURCE_ENV,
      ...source.identity, requireReadOnlySources: true}),
    exactScriptContract: Object.freeze({
      representativeSourceSha256: REPRESENTATIVE_SHA,
      rootDoActions: representativeActions,
      childScriptCount: 0,
      matchingRule:
        'ordered frame/byte-count/SHA-256 equality of every top-level compiled DoAction body',
    }),
    summary: Object.freeze({
      scannedUniqueSwfs: 2240,
      scannedPlacements: 2282,
      structuralCandidateUniqueSwfs: candidates.length,
      structuralCandidatePlacements: candidates.reduce((sum, record) =>
        sum + record.placementIds.length, 0),
      exactScriptReviewedUniqueSwfs: reviewed.length,
      generationAuthorizedUniqueSwfs: authorized.length,
      generationAuthorizedPlacements: authorizedPlacements.length,
      generationAuthorizedLessons: authorizedLessons.length,
      rejectedRootActionMismatchUniqueSwfs: reviewed.length - authorized.length,
    }),
    authorizedPlacementIds: authorizedPlacements,
    authorizedLessonKeys: authorizedLessons,
    records: reviewed,
    scaleOutAuthorization: Object.freeze({
      authorized: authorized.length > 0,
      adapterFamily: 'pure-linear-source-static',
      exactReviewedMembersOnly: true,
      generationMustRemainCreateExclusive: true,
      registryAdmissionRequiresArtifactHashes: true,
      wholeLessonPreviewRequiresNN: true,
      audioAcceptanceClaimAllowed: false,
      broaderFamilyInferenceAllowed: false,
    }),
    acceptanceEffects: Object.freeze({
      currentJavaScriptRegistered: false,
      behaviorAccepted: false,
      visualFidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      released: false,
      published: false,
    }),
  });
}

async function writeExclusive(bytes) {
  const target = absolute(OUTPUT);
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, bytes, {flag: 'wx'});
  try {
    await copyFile(temporary, target, fsConstants.COPYFILE_EXCL);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

export async function reviewPureLinearScripts({check = false} = {}) {
  const review = await expectedReview();
  const bytes = stableBytes(review);
  if (check) {
    const current = await ordinary(OUTPUT);
    invariant(current.buffer.equals(bytes),
      'pure-linear exact-script review drifted');
  } else {
    await writeExclusive(bytes);
  }
  return Object.freeze({check, output: OUTPUT, bytes: bytes.length,
    sha256: sha256(bytes), status: review.status, summary: review.summary});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: review-g678-pure-linear-exact-scripts.mjs [--check]');
  reviewPureLinearScripts({check: args[0] === '--check'})
    .then((result) => process.stdout.write(
      `${JSON.stringify(result, null, 2)}\n`,
    )).catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
