#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  readdir,
  realpath,
  rm,
} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  assertRealDirectoryAncestors,
  atomicPublishDirectoryNoReplace,
} from './lib/g5-l4-atomic-directory-publish.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const RELATED_FILES_ROOT =
  '/Volumes/WestWorld/HELP MATH Related Files';
const RECOVERY_ROOT = path.join(
  RELATED_FILES_ROOT,
  'Private Recovery Containers',
  '2026-08-25-BOULDER-LEARNING-AWS-S3-EMERGENCY-V1',
);
const DESTINATION_PARENT = path.join(
  RELATED_FILES_ROOT,
  'Private Recovery Containers',
);
const TARGET_LEAF =
  '2026-08-26-HELP-MATH-HISTORICAL-COURSEWARE-S3-153-V1';
const TARGET_ROOT = path.join(DESTINATION_PARENT, TARGET_LEAF);

const SUMMARY = Object.freeze({
  relativePath: 'receipts/s3-console-presigned-153-summary-v1.json',
  sha256: '47ee4f669947259a3d9db5ade14b649300bfe2c0b9175cdb2f166be128fbc281',
  status: 'COMPLETE_FIXED_153_DOUBLE_GET_CUSTODY',
  boundary: 'CUSTODY_ONLY_NO_PROMOTION',
  objectSha256SetDigest:
    'e36896abdd0212606fd998981fe4d291ba32ba4f60fa9698cec5d5f81916b630',
  toolSha256:
    'ce6080b0ead83b8ac2d697cef65e6f5b63a8691f25fc4eccff3f561501ca5792',
  receiptMappingDigest:
    '724c0263eda4215405f7bd79a07a1d18266a9f6882e075035010e699f551764f',
});

const EXPECTED = Object.freeze({
  fileCount: 153,
  uniqueSha256Count: 153,
  totalBytes: 75_040_600,
  extensionCounts: Object.freeze({mp3: 40, swf: 113}),
  extensionBytes: Object.freeze({mp3: 32_887_340, swf: 42_153_260}),
  magicCounts: Object.freeze({'mpeg-audio': 40, 'swf-cws': 113}),
});

const SOURCE_SPECS = Object.freeze([
  Object.freeze({
    id: 'spark-maria-audio',
    extension: 'mp3',
    count: 40,
    taskPrefix: 'audio',
    receiptDisposition: 'candidate-audio-in-custody',
    magicType: 'mpeg-audio',
    prefix: 'Transfer/FromLiveServer/SPARK & MARIA AUDIO/',
    inventoryRelativePath:
      'manifests/private/s3-spark-maria-audio-visible-inventory-v1.json',
    inventorySha256:
      '4bcb9d38622b62be0404ba420ac5b8b9f3d7900976cc186740d4624ca513ee42',
  }),
  Object.freeze({
    id: 'help-15-corrections',
    extension: 'swf',
    count: 113,
    taskPrefix: 'swf',
    receiptDisposition: 'candidate-source-in-custody',
    magicType: 'swf-cws',
    prefix: 'Transfer/FromStagingServer/HELP 1.5 VERSION CORRECTIONS/',
    inventoryRelativePath:
      'manifests/private/s3-help15-corrections-visible-inventory-v1.json',
    inventorySha256:
      '1841939769d6c42e557615f27891cde094e192231a6df9814b5266eafc299018',
  }),
]);

const RECEIPT_DIRECTORY = 'receipts/s3-console-presigned-153-v1';
const PAYLOAD_ROOT = 'source-paths';
const MANIFEST_PATH = 'manifests/historical-courseware-files-v1.json';
const CHECKSUM_PATH = 'manifests/historical-courseware-files-v1.sha256';
const MATERIALIZATION_RECEIPT_PATH =
  'receipts/historical-courseware-materialization-v1.json';
const README_PATH = 'README.md';
const PUBLISHER_MODULE_PATH =
  'scripts/lib/g5-l4-atomic-directory-publish.mjs';
const PUBLISHER_NATIVE_PATH =
  'scripts/native/g5-l4-atomic-directory-publish.c';
const ARCHIVED_TOOL_PATHS = Object.freeze({
  script: 'provenance/tools/materialize-s3-recovered-153-historical-courseware.mjs',
  publisherModule: 'provenance/tools/g5-l4-atomic-directory-publish.mjs',
  publisherNative: 'provenance/tools/g5-l4-atomic-directory-publish.c',
});

const ACCEPTANCE_EFFECTS = Object.freeze({
  canonicalSourcePromoted: false,
  currentJsRegistered: false,
  authoritativeOriginalRuntime: false,
  audioAccepted: false,
  visualFidelityAccepted: false,
  humanAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  releaseEligible: false,
  published: false,
});

function invariant(condition, message) {
  if (!condition) {
    throw new Error(`S3 recovered 153 historical materialization: ${message}`);
  }
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function modeBits(info) {
  return Number(info.mode & 0o777n);
}

function sameFileIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

async function lstatOrNull(candidate) {
  try {
    return await lstat(candidate, {bigint: true});
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function containedBy(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function readOrdinaryFilePinned(
  absolutePath,
  {expectedSha256, expectedBytes, requirePrivate = false} = {},
) {
  await assertRealDirectoryAncestors(path.dirname(path.resolve(absolutePath)));
  const handle = await open(
    absolutePath,
    fsConstants.O_RDONLY |
      (fsConstants.O_NOFOLLOW ?? 0) |
      (fsConstants.O_CLOEXEC ?? 0),
  );
  let before;
  let bytes;
  let after;
  try {
    before = await handle.stat({bigint: true});
    invariant(
      before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
      `${absolutePath} is not one ordinary single-link file`,
    );
    invariant(
      before.uid === BigInt(process.geteuid()),
      `${absolutePath} is not owned by the effective user`,
    );
    if (requirePrivate) {
      invariant(
        (before.mode & 0o077n) === 0n,
        `${absolutePath} is accessible to group or other users`,
      );
    }
    bytes = await handle.readFile();
    after = await handle.stat({bigint: true});
  } finally {
    await handle.close();
  }
  invariant(
    sameFileIdentity(before, after) &&
      before.size === after.size &&
      before.mtimeNs === after.mtimeNs &&
      after.size === BigInt(bytes.length),
    `${absolutePath} changed while read`,
  );
  const pathnameAfter = await lstat(absolutePath, {bigint: true});
  invariant(
    sameFileIdentity(before, pathnameAfter),
    `${absolutePath} was replaced after the pinned read`,
  );
  if (expectedBytes !== undefined) {
    invariant(
      bytes.length === expectedBytes,
      `${absolutePath} has ${bytes.length} bytes; expected ${expectedBytes}`,
    );
  }
  const observedSha256 = sha256(bytes);
  if (expectedSha256 !== undefined) {
    invariant(
      observedSha256 === expectedSha256,
      `${absolutePath} SHA-256 differs from the frozen binding`,
    );
  }
  return Object.freeze({bytes, sha256: observedSha256, info: before});
}

async function readJsonPinned(absolutePath, options) {
  const observed = await readOrdinaryFilePinned(absolutePath, options);
  let value;
  try {
    value = JSON.parse(observed.bytes.toString('utf8'));
  } catch (error) {
    throw new Error(`${absolutePath} is not valid JSON: ${error.message}`);
  }
  return Object.freeze({...observed, value});
}

function canonicalBase64Utf8(value, label) {
  invariant(
    typeof value === 'string' && value.length > 0,
    `${label} is not a non-empty base64 string`,
  );
  const bytes = Buffer.from(value, 'base64');
  invariant(bytes.toString('base64') === value, `${label} is not canonical base64`);
  const decoded = bytes.toString('utf8');
  invariant(
    Buffer.from(decoded, 'utf8').equals(bytes),
    `${label} is not canonical UTF-8`,
  );
  return decoded;
}

export function validateSafeS3Key(displayKey, expectedPrefix = null) {
  invariant(typeof displayKey === 'string' && displayKey.length > 0,
    'S3 display key is empty');
  invariant(displayKey === displayKey.normalize('NFC'),
    `S3 display key is not NFC: ${displayKey}`);
  invariant(!displayKey.includes('\\') && !displayKey.includes('\0'),
    `S3 display key contains a backslash or NUL: ${displayKey}`);
  invariant(!path.posix.isAbsolute(displayKey),
    `S3 display key is absolute: ${displayKey}`);
  invariant(path.posix.normalize(displayKey) === displayKey,
    `S3 display key is not normalized: ${displayKey}`);
  const components = displayKey.split('/');
  invariant(
    components.every(
      (component) =>
        component.length > 0 &&
        component !== '.' &&
        component !== '..' &&
        Buffer.byteLength(component, 'utf8') <= 255,
    ),
    `S3 display key has an unsafe path component: ${displayKey}`,
  );
  if (expectedPrefix !== null) {
    invariant(displayKey.startsWith(expectedPrefix),
      `S3 display key escapes its frozen prefix: ${displayKey}`);
  }
  return displayKey;
}

function assertMagic(bytes, magicType, label) {
  if (magicType === 'swf-cws') {
    invariant(
      bytes.length >= 3 && bytes.subarray(0, 3).toString('ascii') === 'CWS',
      `${label} is not a CWS SWF`,
    );
    return;
  }
  if (magicType === 'mpeg-audio') {
    const id3 =
      bytes.length >= 3 && bytes.subarray(0, 3).toString('ascii') === 'ID3';
    const frameSync =
      bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
    invariant(id3 || frameSync, `${label} has no MPEG audio signature`);
    return;
  }
  invariant(false, `unsupported frozen magic type: ${magicType}`);
}

export function computeObjectShaSetDigest(hashes) {
  const unique = [...new Set(hashes)];
  return sha256(Buffer.from(`${unique.sort().join('\n')}\n`));
}

export function computeReceiptMappingDigest(records) {
  const rows = records.map((record) => [
    record.taskId,
    record.sourceGroup,
    String(record.sourceOrdinal),
    Buffer.from(record.sourcePath, 'utf8').toString('base64'),
    String(record.bytes),
    record.sha256,
    record.sourceReceipt.sha256,
    record.cas.relativePath,
  ].join('\t'));
  rows.sort();
  return sha256(Buffer.from(`${rows.join('\n')}\n`));
}

function sourceRecordForState(record) {
  return {
    taskId: record.taskId,
    sourceOrdinal: record.sourceOrdinal,
    sourceGroup: record.sourceGroup,
    sourcePath: record.sourcePath,
    archivePath: record.archivePath,
    extension: record.extension,
    bytes: record.bytes,
    sha256: record.sha256,
    magicType: record.magicType,
    sourceInventory: record.sourceInventory,
    sourceReceipt: record.sourceReceipt,
    cas: record.cas,
  };
}

function summarizeRecords(records) {
  const extensionCounts = {};
  const extensionBytes = {};
  const magicCounts = {};
  let totalBytes = 0;
  for (const record of records) {
    extensionCounts[record.extension] =
      (extensionCounts[record.extension] ?? 0) + 1;
    extensionBytes[record.extension] =
      (extensionBytes[record.extension] ?? 0) + record.bytes;
    magicCounts[record.magicType] = (magicCounts[record.magicType] ?? 0) + 1;
    totalBytes += record.bytes;
  }
  return Object.freeze({
    fileCount: records.length,
    uniqueSha256Count: new Set(records.map(({sha256: digest}) => digest)).size,
    totalBytes,
    extensionCounts,
    extensionBytes,
    magicCounts,
  });
}

function assertExactCounts(actual) {
  invariant(actual.fileCount === EXPECTED.fileCount,
    `payload count is ${actual.fileCount}; expected ${EXPECTED.fileCount}`);
  invariant(actual.uniqueSha256Count === EXPECTED.uniqueSha256Count,
    `unique SHA count is ${actual.uniqueSha256Count}; expected ${EXPECTED.uniqueSha256Count}`);
  invariant(actual.totalBytes === EXPECTED.totalBytes,
    `payload bytes are ${actual.totalBytes}; expected ${EXPECTED.totalBytes}`);
  invariant(JSON.stringify(actual.extensionCounts) === JSON.stringify(EXPECTED.extensionCounts),
    'extension counts differ from the fixed 40 MP3 + 113 SWF denominator');
  invariant(JSON.stringify(actual.extensionBytes) === JSON.stringify(EXPECTED.extensionBytes),
    'per-extension byte totals differ from the frozen denominator');
  invariant(JSON.stringify(actual.magicCounts) === JSON.stringify(EXPECTED.magicCounts),
    'magic counts differ from the fixed 40 MPEG + 113 CWS denominator');
}

async function assertPrivateDirectory(directory, expectedMode = null) {
  await assertRealDirectoryAncestors(directory);
  const resolved = await realpath(directory);
  invariant(resolved === path.resolve(directory),
    `${directory} resolves through an alias or symbolic link`);
  const info = await lstat(directory, {bigint: true});
  invariant(info.isDirectory() && !info.isSymbolicLink(),
    `${directory} is not one real directory`);
  invariant(info.uid === BigInt(process.geteuid()),
    `${directory} is not owned by the effective user`);
  invariant((info.mode & 0o077n) === 0n,
    `${directory} is accessible to group or other users`);
  if (expectedMode !== null) {
    invariant(modeBits(info) === expectedMode,
      `${directory} mode is ${modeBits(info).toString(8)}; expected ${expectedMode.toString(8)}`);
  }
  return info;
}

async function verifySourceBatch() {
  await assertPrivateDirectory(RECOVERY_ROOT);
  const summaryAbsolute = path.join(RECOVERY_ROOT, SUMMARY.relativePath);
  const summaryRead = await readJsonPinned(summaryAbsolute, {
    expectedSha256: SUMMARY.sha256,
    requirePrivate: true,
  });
  const summary = summaryRead.value;
  invariant(summary.schemaVersion === 'help-math-s3-console-presigned-batch-summary/v1',
    'source summary schema drifted');
  invariant(summary.status === SUMMARY.status, 'source summary status drifted');
  invariant(summary.boundary === SUMMARY.boundary, 'source summary boundary drifted');
  invariant(summary.objectSha256SetDigest === SUMMARY.objectSha256SetDigest,
    'source summary object-set digest drifted');
  invariant(summary.tool?.sha256 === SUMMARY.toolSha256,
    'source summary tool binding drifted');
  invariant(summary.denominators?.expectedObjects === EXPECTED.fileCount &&
    summary.denominators?.verifiedReceipts === EXPECTED.fileCount &&
    summary.denominators?.logicalBytes === EXPECTED.totalBytes &&
    summary.denominators?.uniqueSha256Objects === EXPECTED.uniqueSha256Count,
  'source summary denominators drifted');
  invariant(
    JSON.stringify(summary.denominators?.extensionCounts) ===
      JSON.stringify(EXPECTED.extensionCounts) &&
    JSON.stringify(summary.denominators?.magicCounts) ===
      JSON.stringify(EXPECTED.magicCounts),
    'source summary extension or magic counts drifted',
  );

  const expectedReceiptNames = [];
  for (const spec of SOURCE_SPECS) {
    for (let ordinal = 1; ordinal <= spec.count; ordinal += 1) {
      expectedReceiptNames.push(
        `${spec.taskPrefix}-${String(ordinal).padStart(4, '0')}.json`,
      );
    }
  }
  const receiptDirectoryAbsolute = path.join(RECOVERY_ROOT, RECEIPT_DIRECTORY);
  const receiptEntries = await readdir(receiptDirectoryAbsolute, {withFileTypes: true});
  const observedReceiptNames = receiptEntries.map(({name}) => name).sort();
  invariant(
    receiptEntries.every((entry) => entry.isFile() && !entry.isSymbolicLink()) &&
      JSON.stringify(observedReceiptNames) ===
        JSON.stringify([...expectedReceiptNames].sort()),
    'object receipt directory is not the exact fixed 153-file universe',
  );

  const records = [];
  const inventories = [];
  for (const spec of SOURCE_SPECS) {
    const inventoryAbsolute = path.join(RECOVERY_ROOT, spec.inventoryRelativePath);
    const inventoryRead = await readJsonPinned(inventoryAbsolute, {
      expectedSha256: spec.inventorySha256,
      requirePrivate: true,
    });
    const inventory = inventoryRead.value;
    invariant(
      inventory.schemaVersion === 'help-math-aws-s3-visible-prefix-inventory/v1' &&
        inventory.status === 'VISIBLE_PATH_ONLY_DOWNLOAD_PENDING' &&
        inventory.custodyBoundary === SUMMARY.boundary,
      `${spec.id} inventory identity or immutable pre-download status drifted`,
    );
    invariant(
      inventory.prefix === spec.prefix &&
        inventory.regularFileCount === spec.count &&
        inventory.objects?.length === spec.count &&
        inventory.extensionCounts?.[spec.extension] === spec.count,
      `${spec.id} inventory prefix or denominator drifted`,
    );
    inventories.push({
      id: spec.id,
      relativePath: spec.inventoryRelativePath,
      sha256: spec.inventorySha256,
      sourcePrefix: spec.prefix,
      fileCount: spec.count,
    });

    for (let ordinal = 1; ordinal <= spec.count; ordinal += 1) {
      const taskId = `${spec.taskPrefix}-${String(ordinal).padStart(4, '0')}`;
      const receiptRelativePath = `${RECEIPT_DIRECTORY}/${taskId}.json`;
      const receiptRead = await readJsonPinned(
        path.join(RECOVERY_ROOT, receiptRelativePath),
        {requirePrivate: true},
      );
      const receipt = receiptRead.value;
      const inventoryObject = inventory.objects[ordinal - 1];
      invariant(
        inventoryObject?.ordinal === ordinal &&
          receipt.sourceOrdinal === ordinal &&
          receipt.taskId === taskId,
        `${taskId} ordinal binding drifted`,
      );
      invariant(
        receipt.schemaVersion ===
          'help-math-s3-console-presigned-object-receipt/v1' &&
          receipt.boundary === SUMMARY.boundary &&
          receipt.disposition === spec.receiptDisposition &&
          receipt.extension === spec.extension &&
          receipt.magicType === spec.magicType,
        `${taskId} receipt identity, boundary, disposition, extension, or magic drifted`,
      );
      invariant(
        receipt.sourceInventory?.relativePath === spec.inventoryRelativePath &&
          receipt.sourceInventory?.sha256 === spec.inventorySha256 &&
          receipt.tool?.sha256 === SUMMARY.toolSha256,
        `${taskId} inventory or tool binding drifted`,
      );
      invariant(
        receipt.remoteObservation?.connections === 2 &&
          receipt.remoteObservation?.byteAndHeaderAgreement === true &&
          receipt.remoteObservation?.presignedUrlPersisted === false &&
          receipt.remoteObservation?.bytes === receipt.bytes,
        `${taskId} two-full-GET observation contract drifted`,
      );
      invariant(
        receipt.keyBase64 === inventoryObject.keyBase64,
        `${taskId} receipt and inventory keyBase64 differ`,
      );
      const decodedKey = canonicalBase64Utf8(receipt.keyBase64, `${taskId} keyBase64`);
      invariant(decodedKey === inventoryObject.displayKey,
        `${taskId} base64 key does not decode to the inventory display key`);
      validateSafeS3Key(decodedKey, spec.prefix);
      invariant(
        inventoryObject.extension === spec.extension &&
          decodedKey.toLowerCase().endsWith(`.${spec.extension}`),
        `${taskId} inventory extension differs from its path`,
      );
      invariant(
        Number.isSafeInteger(receipt.bytes) && receipt.bytes > 0 &&
          /^[0-9a-f]{64}$/.test(receipt.localSha256),
        `${taskId} has an invalid byte count or SHA-256`,
      );
      const expectedCasRelativePath =
        `objects/sha256/${receipt.localSha256.slice(0, 2)}/${receipt.localSha256}`;
      invariant(receipt.cas?.relativePath === expectedCasRelativePath,
        `${taskId} CAS path is not derived from its SHA-256`);
      const casAbsolute = path.join(RECOVERY_ROOT, expectedCasRelativePath);
      invariant(containedBy(RECOVERY_ROOT, casAbsolute), `${taskId} CAS path escapes recovery root`);
      const casRead = await readOrdinaryFilePinned(casAbsolute, {
        expectedSha256: receipt.localSha256,
        expectedBytes: receipt.bytes,
        requirePrivate: true,
      });
      assertMagic(casRead.bytes, spec.magicType, taskId);
      records.push(sourceRecordForState({
        taskId,
        sourceOrdinal: ordinal,
        sourceGroup: spec.id,
        sourcePath: decodedKey,
        archivePath: `${PAYLOAD_ROOT}/${decodedKey}`,
        extension: spec.extension,
        bytes: receipt.bytes,
        sha256: receipt.localSha256,
        magicType: spec.magicType,
        sourceInventory: {
          relativePath: spec.inventoryRelativePath,
          sha256: spec.inventorySha256,
        },
        sourceReceipt: {
          relativePath: receiptRelativePath,
          sha256: receiptRead.sha256,
        },
        cas: {relativePath: expectedCasRelativePath},
      }));
    }
  }

  const pathSet = new Set();
  const foldedPathSet = new Set();
  const taskSet = new Set();
  for (const record of records) {
    invariant(!pathSet.has(record.archivePath),
      `duplicate archive path: ${record.archivePath}`);
    pathSet.add(record.archivePath);
    const folded = record.archivePath.toLowerCase();
    invariant(!foldedPathSet.has(folded),
      `case-folded archive path collision: ${record.archivePath}`);
    foldedPathSet.add(folded);
    invariant(!taskSet.has(record.taskId), `duplicate task ID: ${record.taskId}`);
    taskSet.add(record.taskId);
  }
  const counts = summarizeRecords(records);
  assertExactCounts(counts);
  invariant(
    computeObjectShaSetDigest(records.map((record) => record.sha256)) ===
      SUMMARY.objectSha256SetDigest,
    'recomputed object SHA-256 set digest differs from the source summary',
  );
  invariant(
    computeReceiptMappingDigest(records) === SUMMARY.receiptMappingDigest,
    'receipt/inventory key-to-object mapping differs from the frozen mapping digest',
  );

  const generatedBy = {
    script: {
      path: path.relative(PROJECT_ROOT, SCRIPT_PATH).split(path.sep).join('/'),
      archivePath: ARCHIVED_TOOL_PATHS.script,
      sha256: sha256(await readFile(SCRIPT_PATH)),
    },
    atomicPublisher: {
      module: {
        path: PUBLISHER_MODULE_PATH,
        archivePath: ARCHIVED_TOOL_PATHS.publisherModule,
        sha256: sha256(await readFile(path.join(PROJECT_ROOT, PUBLISHER_MODULE_PATH))),
      },
      nativeSource: {
        path: PUBLISHER_NATIVE_PATH,
        archivePath: ARCHIVED_TOOL_PATHS.publisherNative,
        sha256: sha256(await readFile(path.join(PROJECT_ROOT, PUBLISHER_NATIVE_PATH))),
      },
    },
  };
  const sourceBatch = {
    recoveryRootName: path.basename(RECOVERY_ROOT),
    summary: {
      relativePath: SUMMARY.relativePath,
      sha256: SUMMARY.sha256,
      status: SUMMARY.status,
      boundary: SUMMARY.boundary,
    },
    inventories,
    objectReceiptDirectory: RECEIPT_DIRECTORY,
    objectSha256SetDigest: SUMMARY.objectSha256SetDigest,
    receiptMappingDigest: SUMMARY.receiptMappingDigest,
  };
  const stateDigest = sha256(jsonBytes({sourceBatch, counts, files: records}));
  return Object.freeze({
    sourceBatch,
    counts,
    records: Object.freeze(records),
    generatedBy,
    stateDigest,
  });
}

export function checksumBytesForRecords(records) {
  const sorted = [...records].sort((left, right) =>
    left.archivePath.localeCompare(right.archivePath, 'en'));
  return Buffer.from(
    `${sorted.map((record) => `${record.sha256}  ${record.archivePath}`).join('\n')}\n`,
  );
}

function buildManifest(source, materializedAtUtc) {
  return {
    schemaVersion: 'help-math-historical-courseware-path-materialization/v1',
    artifactType: 'help-math-1-historical-courseware-private-path-manifest',
    status: 'HISTORICAL_COURSEWARE_PATHS_MATERIALIZED',
    boundary: SUMMARY.boundary,
    materializedAtUtc,
    sourceBatch: source.sourceBatch,
    generatedBy: source.generatedBy,
    destination: {
      rootName: TARGET_LEAF,
      payloadRoot: PAYLOAD_ROOT,
      pathPolicy: 'exact-decoded-s3-key-under-source-paths',
      overwritePolicy: 'atomic-directory-publication-no-replace',
    },
    counts: source.counts,
    files: source.records,
    authority:
      'Private historical-courseware custody and exact source-path materialization only.',
    authorityBoundary:
      'No canonical source promotion, placement choice, audio cue binding, Current-JS registration, original-runtime acceptance, fidelity acceptance, human or Owner acceptance, strict completion, release, or publication is granted.',
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  };
}

function buildReadme(materializedAtUtc) {
  return Buffer.from(`# HELP MATH 1.0 historical courseware — recovered S3 153\n\n` +
    `This private, dated archive materializes the fixed recovered batch of ` +
    `153/153 historical objects (40 MP3 + 113 SWF) at their exact decoded S3 ` +
    `paths. It was created at ${materializedAtUtc}.\n\n` +
    `## Courseware paths\n\n` +
    `- \`source-paths/Transfer/FromLiveServer/SPARK & MARIA AUDIO/...\` contains 40 MP3 files.\n` +
    `- \`source-paths/Transfer/FromStagingServer/HELP 1.5 VERSION CORRECTIONS/...\` contains 113 SWF files.\n` +
    `- The two FQ correction branches remain separate. No basename-based merge, rename, or overwrite was performed.\n\n` +
    `## Integrity\n\n` +
    `The payload is 75,040,600 bytes across 153 unique SHA-256 objects. The ` +
    `sorted object-set digest is ` +
    `\`${SUMMARY.objectSha256SetDigest}\`. See \`${MANIFEST_PATH}\`, ` +
    `\`${CHECKSUM_PATH}\`, and \`${MATERIALIZATION_RECEIPT_PATH}\`.\n\n` +
    `The exact receipt/inventory key-to-object mapping digest is ` +
    `\`${SUMMARY.receiptMappingDigest}\`. The materializer and atomic ` +
    `publisher source used for this transaction are frozen under ` +
    `\`provenance/tools/\`.\n\n` +
    `## Boundary\n\n` +
    `This closes the custody gap for this fixed historical 153-object batch. ` +
    `It is \`${SUMMARY.boundary}\`: it does not alter HELP MATH 2.0 ` +
    `\`source-assets\`, catalogs, or missing-reference ledgers and does not ` +
    `grant runtime, fidelity, audio, human, Owner, strict-completion, release, ` +
    `or publication acceptance.\n`);
}

function buildMaterializationReceipt({
  source,
  materializedAtUtc,
  manifestBytes,
  checksumBytes,
  readmeBytes,
  stagedIdentity,
}) {
  return {
    schemaVersion: 'help-math-historical-courseware-materialization-receipt/v1',
    artifactType: 'help-math-1-historical-courseware-private-materialization-receipt',
    status: 'APPLIED_FIXED_153_HISTORICAL_COURSEWARE_PATHS',
    boundary: SUMMARY.boundary,
    materializedAtUtc,
    sourceBatch: source.sourceBatch,
    sourceStateDigest: source.stateDigest,
    generatedBy: source.generatedBy,
    destination: {
      rootName: TARGET_LEAF,
      payloadRoot: PAYLOAD_ROOT,
      privateMode: true,
      filesMode: '0400',
      directoriesMode: '0500',
    },
    publication: {
      primitive: 'renameatx_np(RENAME_EXCL)',
      overwriteAllowed: false,
      committedDirectoryIdentity: stagedIdentity,
    },
    counts: source.counts,
    objectSha256SetDigest: SUMMARY.objectSha256SetDigest,
    receiptMappingDigest: SUMMARY.receiptMappingDigest,
    artifacts: {
      payloadManifest: {
        path: MANIFEST_PATH,
        bytes: manifestBytes.length,
        sha256: sha256(manifestBytes),
      },
      payloadChecksums: {
        path: CHECKSUM_PATH,
        bytes: checksumBytes.length,
        sha256: sha256(checksumBytes),
      },
      readme: {
        path: README_PATH,
        bytes: readmeBytes.length,
        sha256: sha256(readmeBytes),
      },
    },
    authority:
      'Private historical-courseware custody and path materialization only.',
    authorityBoundary:
      'Canonical promotion and every runtime, audio, fidelity, human, Owner, strict-completion, release, and publication gate remain unchanged.',
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  };
}

async function ensureStagingDirectory(stagingRoot, directory) {
  const absolute = path.resolve(directory);
  invariant(containedBy(stagingRoot, absolute),
    `staging directory escapes staging root: ${absolute}`);
  await mkdir(absolute, {recursive: true, mode: 0o700});
  const relative = path.relative(stagingRoot, absolute);
  let cursor = stagingRoot;
  for (const component of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    const info = await lstat(cursor, {bigint: true});
    invariant(
      info.isDirectory() && !info.isSymbolicLink() &&
        info.uid === BigInt(process.geteuid()) &&
        (info.mode & 0o077n) === 0n,
      `staging path component is not a private real directory: ${cursor}`,
    );
  }
}

async function writeExclusive(stagingRoot, relativePath, bytes) {
  validateSafeS3Key(relativePath);
  const absolute = path.join(stagingRoot, ...relativePath.split('/'));
  invariant(containedBy(stagingRoot, absolute) && absolute !== stagingRoot,
    `output escapes staging root: ${relativePath}`);
  await ensureStagingDirectory(stagingRoot, path.dirname(absolute));
  const handle = await open(
    absolute,
    fsConstants.O_WRONLY |
      fsConstants.O_CREAT |
      fsConstants.O_EXCL |
      (fsConstants.O_NOFOLLOW ?? 0) |
      (fsConstants.O_CLOEXEC ?? 0),
    0o600,
  );
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  const written = await readOrdinaryFilePinned(absolute, {
    expectedSha256: sha256(bytes),
    expectedBytes: bytes.length,
    requirePrivate: true,
  });
  invariant(written.bytes.equals(bytes), `${relativePath} write verification differs`);
}

async function walkTree(root) {
  const files = [];
  const directories = [''];
  const stack = [''];
  while (stack.length > 0) {
    const relativeDirectory = stack.pop();
    const absoluteDirectory = relativeDirectory
      ? path.join(root, ...relativeDirectory.split('/'))
      : root;
    const entries = await readdir(absoluteDirectory, {withFileTypes: true});
    for (const entry of entries) {
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      validateSafeS3Key(relativePath);
      const absolutePath = path.join(root, ...relativePath.split('/'));
      const info = await lstat(absolutePath, {bigint: true});
      invariant(!info.isSymbolicLink(), `tree contains symbolic link: ${relativePath}`);
      if (info.isDirectory()) {
        directories.push(relativePath);
        stack.push(relativePath);
      } else {
        invariant(info.isFile() && info.nlink === 1n,
          `tree contains non-regular or linked file: ${relativePath}`);
        files.push(relativePath);
      }
    }
  }
  files.sort();
  directories.sort();
  return {files, directories};
}

async function freezeTree(stagingRoot) {
  const tree = await walkTree(stagingRoot);
  for (const relativePath of tree.files) {
    await chmod(path.join(stagingRoot, ...relativePath.split('/')), 0o400);
  }
  const deepestFirst = [...tree.directories].sort(
    (left, right) => right.split('/').length - left.split('/').length,
  );
  for (const relativePath of deepestFirst) {
    const absolute = relativePath
      ? path.join(stagingRoot, ...relativePath.split('/'))
      : stagingRoot;
    await chmod(absolute, 0o500);
  }
}

function exactExpectedFileSet(source) {
  return new Set([
    ...source.records.map(({archivePath}) => archivePath),
    ...Object.values(ARCHIVED_TOOL_PATHS),
    MANIFEST_PATH,
    CHECKSUM_PATH,
    MATERIALIZATION_RECEIPT_PATH,
    README_PATH,
  ]);
}

async function verifyMaterializedTree(root, source, {allowStagingLeaf = false} = {}) {
  const rootInfo = await assertPrivateDirectory(root, 0o500);
  const tree = await walkTree(root);
  const expectedFiles = exactExpectedFileSet(source);
  invariant(tree.files.length === expectedFiles.size,
    `archive has ${tree.files.length} files; expected ${expectedFiles.size}`);
  for (const relativePath of tree.files) {
    invariant(expectedFiles.has(relativePath), `archive has unexpected file: ${relativePath}`);
    const info = await lstat(path.join(root, ...relativePath.split('/')), {bigint: true});
    invariant(modeBits(info) === 0o400,
      `${relativePath} mode is ${modeBits(info).toString(8)}; expected 400`);
  }
  for (const relativePath of tree.directories) {
    const absolute = relativePath
      ? path.join(root, ...relativePath.split('/'))
      : root;
    const info = await lstat(absolute, {bigint: true});
    invariant(modeBits(info) === 0o500,
      `${relativePath || '.'} mode is ${modeBits(info).toString(8)}; expected 500`);
  }

  for (const record of source.records) {
    const read = await readOrdinaryFilePinned(
      path.join(root, ...record.archivePath.split('/')),
      {
        expectedSha256: record.sha256,
        expectedBytes: record.bytes,
        requirePrivate: true,
      },
    );
    assertMagic(read.bytes, record.magicType, record.archivePath);
  }

  const manifestRead = await readJsonPinned(path.join(root, MANIFEST_PATH), {
    requirePrivate: true,
  });
  const checksumRead = await readOrdinaryFilePinned(path.join(root, CHECKSUM_PATH), {
    requirePrivate: true,
  });
  const readmeRead = await readOrdinaryFilePinned(path.join(root, README_PATH), {
    requirePrivate: true,
  });
  const receiptRead = await readJsonPinned(
    path.join(root, MATERIALIZATION_RECEIPT_PATH),
    {requirePrivate: true},
  );
  const manifest = manifestRead.value;
  const receipt = receiptRead.value;
  invariant(
    manifest.schemaVersion ===
      'help-math-historical-courseware-path-materialization/v1' &&
      manifest.status === 'HISTORICAL_COURSEWARE_PATHS_MATERIALIZED' &&
      manifest.boundary === SUMMARY.boundary,
    'payload manifest identity or boundary drifted',
  );
  invariant(
    JSON.stringify(manifest.sourceBatch) === JSON.stringify(source.sourceBatch) &&
      JSON.stringify(manifest.counts) === JSON.stringify(source.counts) &&
      JSON.stringify(manifest.files) === JSON.stringify(source.records) &&
      JSON.stringify(manifest.acceptanceEffects) === JSON.stringify(ACCEPTANCE_EFFECTS),
    'payload manifest no longer matches the fixed verified source state',
  );
  invariant(
    manifest.destination?.rootName === TARGET_LEAF &&
      manifest.destination?.payloadRoot === PAYLOAD_ROOT &&
      manifest.destination?.pathPolicy ===
        'exact-decoded-s3-key-under-source-paths' &&
      manifest.destination?.overwritePolicy ===
        'atomic-directory-publication-no-replace',
    'payload manifest destination or no-overwrite policy drifted',
  );
  invariant(
    typeof manifest.materializedAtUtc === 'string' &&
      !Number.isNaN(Date.parse(manifest.materializedAtUtc)),
    'payload manifest materialization time is invalid',
  );
  const expectedChecksumBytes = checksumBytesForRecords(source.records);
  invariant(checksumRead.bytes.equals(expectedChecksumBytes),
    'payload SHA-256 text manifest drifted');
  const expectedReadmeBytes = buildReadme(manifest.materializedAtUtc);
  invariant(readmeRead.bytes.equals(expectedReadmeBytes), 'README drifted');
  invariant(
    receipt.schemaVersion ===
      'help-math-historical-courseware-materialization-receipt/v1' &&
      receipt.status === 'APPLIED_FIXED_153_HISTORICAL_COURSEWARE_PATHS' &&
      receipt.boundary === SUMMARY.boundary &&
      receipt.materializedAtUtc === manifest.materializedAtUtc &&
      receipt.sourceStateDigest === source.stateDigest,
    'materialization receipt identity, time, boundary, or source digest drifted',
  );
  invariant(
    JSON.stringify(receipt.sourceBatch) === JSON.stringify(source.sourceBatch) &&
      JSON.stringify(receipt.counts) === JSON.stringify(source.counts) &&
      JSON.stringify(receipt.acceptanceEffects) === JSON.stringify(ACCEPTANCE_EFFECTS),
    'materialization receipt no longer matches the fixed verified source state',
  );
  invariant(
    receipt.destination?.rootName === TARGET_LEAF &&
      receipt.destination?.payloadRoot === PAYLOAD_ROOT &&
      receipt.destination?.privateMode === true &&
      receipt.destination?.filesMode === '0400' &&
      receipt.destination?.directoriesMode === '0500',
    'materialization receipt destination or private-mode contract drifted',
  );
  invariant(
    receipt.objectSha256SetDigest === SUMMARY.objectSha256SetDigest &&
      receipt.receiptMappingDigest === SUMMARY.receiptMappingDigest &&
      receipt.publication?.primitive === 'renameatx_np(RENAME_EXCL)' &&
      receipt.publication?.overwriteAllowed === false,
    'materialization receipt digest or no-replace publication contract drifted',
  );
  invariant(
    JSON.stringify(receipt.generatedBy) === JSON.stringify(manifest.generatedBy),
    'manifest and receipt disagree about the archived generator toolchain',
  );
  const archivedToolBindings = [
    manifest.generatedBy?.script,
    manifest.generatedBy?.atomicPublisher?.module,
    manifest.generatedBy?.atomicPublisher?.nativeSource,
  ];
  const expectedToolBindings = [
    {path: 'scripts/materialize-s3-recovered-153-historical-courseware.mjs',
      archivePath: ARCHIVED_TOOL_PATHS.script},
    {path: PUBLISHER_MODULE_PATH, archivePath: ARCHIVED_TOOL_PATHS.publisherModule},
    {path: PUBLISHER_NATIVE_PATH, archivePath: ARCHIVED_TOOL_PATHS.publisherNative},
  ];
  invariant(archivedToolBindings.length === expectedToolBindings.length,
    'archived generator toolchain cardinality drifted');
  for (let index = 0; index < expectedToolBindings.length; index += 1) {
    const observed = archivedToolBindings[index];
    const expected = expectedToolBindings[index];
    invariant(
      observed?.path === expected.path &&
        observed?.archivePath === expected.archivePath &&
        /^[0-9a-f]{64}$/.test(observed?.sha256 ?? ''),
      `archived generator binding ${index + 1} drifted`,
    );
    await readOrdinaryFilePinned(
      path.join(root, ...observed.archivePath.split('/')),
      {expectedSha256: observed.sha256, requirePrivate: true},
    );
  }
  for (const [key, observed] of Object.entries({
    payloadManifest: manifestRead,
    payloadChecksums: checksumRead,
    readme: readmeRead,
  })) {
    const bound = receipt.artifacts?.[key];
    const expectedPath = {
      payloadManifest: MANIFEST_PATH,
      payloadChecksums: CHECKSUM_PATH,
      readme: README_PATH,
    }[key];
    invariant(
      bound?.path === expectedPath &&
        bound?.bytes === observed.bytes.length &&
        bound?.sha256 === observed.sha256,
      `materialization receipt ${key} binding drifted`,
    );
  }
  const identity = receipt.publication?.committedDirectoryIdentity;
  invariant(
    identity?.device === rootInfo.dev.toString() &&
      identity?.inode === rootInfo.ino.toString(),
    'materialization receipt directory identity differs from the archive root',
  );
  if (!allowStagingLeaf) {
    invariant(path.basename(root) === TARGET_LEAF,
      'verified archive is not at the fixed destination leaf');
  }
  return Object.freeze({
    root,
    payloadFiles: source.counts.fileCount,
    metadataFiles: expectedFiles.size - source.counts.fileCount,
    totalFiles: tree.files.length,
    directoryCount: tree.directories.length,
    counts: source.counts,
    objectSha256SetDigest: SUMMARY.objectSha256SetDigest,
    materializedAtUtc: manifest.materializedAtUtc,
    materializationReceiptSha256: receiptRead.sha256,
    currentGeneratorBytesMatchArchive:
      JSON.stringify(manifest.generatedBy) === JSON.stringify(source.generatedBy),
  });
}

async function stageArchive(stagingRoot, source, materializedAtUtc) {
  for (const record of source.records) {
    const sourceRead = await readOrdinaryFilePinned(
      path.join(RECOVERY_ROOT, ...record.cas.relativePath.split('/')),
      {
        expectedSha256: record.sha256,
        expectedBytes: record.bytes,
        requirePrivate: true,
      },
    );
    assertMagic(sourceRead.bytes, record.magicType, record.taskId);
    await writeExclusive(stagingRoot, record.archivePath, sourceRead.bytes);
  }
  const toolBindings = [
    source.generatedBy.script,
    source.generatedBy.atomicPublisher.module,
    source.generatedBy.atomicPublisher.nativeSource,
  ];
  for (const binding of toolBindings) {
    const toolRead = await readOrdinaryFilePinned(
      path.join(PROJECT_ROOT, ...binding.path.split('/')),
      {expectedSha256: binding.sha256},
    );
    await writeExclusive(stagingRoot, binding.archivePath, toolRead.bytes);
  }
  const manifestBytes = jsonBytes(buildManifest(source, materializedAtUtc));
  const checksumBytes = checksumBytesForRecords(source.records);
  const readmeBytes = buildReadme(materializedAtUtc);
  await writeExclusive(stagingRoot, MANIFEST_PATH, manifestBytes);
  await writeExclusive(stagingRoot, CHECKSUM_PATH, checksumBytes);
  await writeExclusive(stagingRoot, README_PATH, readmeBytes);
  await ensureStagingDirectory(
    stagingRoot,
    path.join(stagingRoot, path.dirname(MATERIALIZATION_RECEIPT_PATH)),
  );
  const stagingInfo = await lstat(stagingRoot, {bigint: true});
  const stagedIdentity = {
    device: stagingInfo.dev.toString(),
    inode: stagingInfo.ino.toString(),
  };
  const materializationReceiptBytes = jsonBytes(buildMaterializationReceipt({
    source,
    materializedAtUtc,
    manifestBytes,
    checksumBytes,
    readmeBytes,
    stagedIdentity,
  }));
  await writeExclusive(
    stagingRoot,
    MATERIALIZATION_RECEIPT_PATH,
    materializationReceiptBytes,
  );
  await freezeTree(stagingRoot);
}

async function thawStagingTreeForCleanup(stagingRoot) {
  const info = await lstatOrNull(stagingRoot);
  if (!info) return;
  invariant(
    path.dirname(stagingRoot) === DESTINATION_PARENT &&
      path.basename(stagingRoot).startsWith(`.${TARGET_LEAF}.staging-`),
    `refusing to thaw a non-staging path: ${stagingRoot}`,
  );
  await chmod(stagingRoot, 0o700);
  const tree = await walkTree(stagingRoot);
  const shallowestFirst = tree.directories
    .filter(Boolean)
    .sort((left, right) => left.split('/').length - right.split('/').length);
  for (const relativePath of shallowestFirst) {
    await chmod(path.join(stagingRoot, ...relativePath.split('/')), 0o700);
  }
}

function resultForSource(source, action) {
  return Object.freeze({
    action,
    sourceStatus: SUMMARY.status,
    boundary: SUMMARY.boundary,
    destination: TARGET_ROOT,
    payloadRoot: path.join(TARGET_ROOT, PAYLOAD_ROOT),
    counts: source.counts,
    objectSha256SetDigest: SUMMARY.objectSha256SetDigest,
    receiptMappingDigest: SUMMARY.receiptMappingDigest,
    sourceStateDigest: source.stateDigest,
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  });
}

async function preflight() {
  const source = await verifySourceBatch();
  await assertPrivateDirectory(DESTINATION_PARENT);
  const targetInfo = await lstatOrNull(TARGET_ROOT);
  invariant(targetInfo === null,
    `destination already exists; use --check instead: ${TARGET_ROOT}`);
  return resultForSource(source, 'PREFLIGHT_READY_FIXED_153');
}

async function applyMaterialization() {
  const source = await verifySourceBatch();
  await assertPrivateDirectory(DESTINATION_PARENT);
  invariant(await lstatOrNull(TARGET_ROOT) === null,
    `destination already exists; refusing replacement: ${TARGET_ROOT}`);
  const stagingRoot = await mkdtemp(
    path.join(DESTINATION_PARENT, `.${TARGET_LEAF}.staging-`),
  );
  await chmod(stagingRoot, 0o700);
  let committed = false;
  try {
    const materializedAtUtc = new Date().toISOString();
    await stageArchive(stagingRoot, source, materializedAtUtc);
    const stagedVerification = await verifyMaterializedTree(
      stagingRoot,
      source,
      {allowStagingLeaf: true},
    );
    invariant(stagedVerification.currentGeneratorBytesMatchArchive,
      'generator toolchain changed while the archive was staged');
    const publication = await atomicPublishDirectoryNoReplace({
      temporaryPath: stagingRoot,
      targetPath: TARGET_ROOT,
      beforePublishHook: async () => {
        const current = await verifySourceBatch();
        invariant(current.stateDigest === source.stateDigest,
          'source batch changed after staging and before atomic publication');
        invariant(
          JSON.stringify(current.generatedBy) === JSON.stringify(source.generatedBy),
          'generator toolchain changed after staging and before publication',
        );
        const currentStagingVerification = await verifyMaterializedTree(
          stagingRoot,
          current,
          {allowStagingLeaf: true},
        );
        invariant(currentStagingVerification.currentGeneratorBytesMatchArchive,
          'generator toolchain changed after staging and before publication');
        invariant(await lstatOrNull(TARGET_ROOT) === null,
          'destination appeared after staging and before atomic publication');
      },
    });
    committed = true;
    const verified = await verifyMaterializedTree(TARGET_ROOT, source);
    invariant(
      publication.committedIdentity.device ===
        (await lstat(TARGET_ROOT, {bigint: true})).dev.toString() &&
        publication.committedIdentity.inode ===
        (await lstat(TARGET_ROOT, {bigint: true})).ino.toString(),
      'publisher result differs from committed destination identity',
    );
    return Object.freeze({
      ...resultForSource(source, 'APPLIED_FIXED_153_HISTORICAL_COURSEWARE_PATHS'),
      publication,
      verification: verified,
    });
  } finally {
    if (!committed && containedBy(DESTINATION_PARENT, stagingRoot) &&
      path.basename(stagingRoot).startsWith(`.${TARGET_LEAF}.staging-`)) {
      await thawStagingTreeForCleanup(stagingRoot).catch(() => {});
      await rm(stagingRoot, {recursive: true, force: true}).catch(() => {});
    }
  }
}

async function checkMaterialization() {
  const source = await verifySourceBatch();
  await assertPrivateDirectory(DESTINATION_PARENT);
  const targetInfo = await lstatOrNull(TARGET_ROOT);
  invariant(targetInfo?.isDirectory() && !targetInfo.isSymbolicLink(),
    `fixed destination is missing or not one real directory: ${TARGET_ROOT}`);
  const verification = await verifyMaterializedTree(TARGET_ROOT, source);
  return Object.freeze({
    ...resultForSource(source, 'VERIFIED_FIXED_153_HISTORICAL_COURSEWARE_PATHS'),
    verification,
  });
}

export function parseArguments(argv) {
  let mode = 'preflight';
  let explicitlySelected = false;
  for (const argument of argv) {
    invariant(['--preflight', '--apply', '--check'].includes(argument),
      `unknown argument: ${argument}`);
    invariant(!explicitlySelected, 'select exactly one execution mode');
    explicitlySelected = true;
    mode = argument.slice(2);
  }
  return Object.freeze({mode});
}

export async function run(options = {}) {
  const mode = options.mode ?? 'preflight';
  if (mode === 'preflight') return preflight();
  if (mode === 'apply') return applyMaterialization();
  if (mode === 'check') return checkMaterialization();
  invariant(false, `unsupported mode: ${mode}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  run(parseArguments(process.argv.slice(2)))
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
