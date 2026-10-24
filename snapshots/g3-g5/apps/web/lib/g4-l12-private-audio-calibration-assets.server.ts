import 'server-only';

import {createHash} from 'node:crypto';
import {lstat, readFile, readdir, realpath} from 'node:fs/promises';
import path from 'node:path';

export const G4_L12_PRIVATE_AUDIO_CALIBRATION_ROOT =
  '/Volumes/American Dream/current-js-audio-calibration-v1.C6g6ei/frozen-slice-v1';
export const G4_L12_PRIVATE_AUDIO_CALIBRATION_RECEIPT_SHA256 =
  'd7a1c14566c9ee5ccf4a902564ef549bb14a01af312b2c46f12fdfe2040b8593';
export const G4_L12_PRIVATE_AUDIO_CALIBRATION_AUTHORITY =
  'private-source-audio-engineering-calibration-only; no listening, fidelity, human, Owner, strict-completion, release, deployment, or publication effect';

export interface G4L12PrivateAudioCalibrationAsset {
  readonly animationId: string;
  readonly id: string;
  readonly assetFile: string;
  readonly url: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly durationMs: number;
  readonly sourceKind: 'external' | 'embedded';
  readonly ownerFrameDomain: string | null;
  readonly spokenLanguage: 'undetermined';
}

export interface G4L12PrivateAudioCalibrationAssetRead {
  readonly asset: G4L12PrivateAudioCalibrationAsset;
  readonly bytes: Buffer;
}

type ByteRange = Readonly<{start: number; end: number}>;

export function resolveG4L12PrivateAudioByteRange(
  header: string | null,
  byteLength: number,
): ByteRange | null | 'unsatisfiable' {
  if (header === null) return null;
  const match = /^bytes=(\d*)-(\d*)$/u.exec(header);
  if (!match || (!match[1] && !match[2]) || byteLength < 1) {
    return 'unsatisfiable';
  }
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength < 1) {
      return 'unsatisfiable';
    }
    return Object.freeze({
      start: Math.max(0, byteLength - suffixLength),
      end: byteLength - 1,
    });
  }
  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : byteLength - 1;
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(requestedEnd) ||
    start < 0 ||
    start >= byteLength ||
    requestedEnd < start
  ) {
    return 'unsatisfiable';
  }
  return Object.freeze({
    start,
    end: Math.min(requestedEnd, byteLength - 1),
  });
}

type FixedAsset = G4L12PrivateAudioCalibrationAsset & Readonly<{
  receiptOutputPath: string;
}>;

type FixedAssetRow = readonly [
  id: string,
  animationId: string,
  assetFile: string,
  receiptOutputPath: string,
  bytes: number,
  sha256: string,
  durationMs: number,
  sourceKind: 'external' | 'embedded',
  ownerFrameDomain: string | null,
];

const FIXED_ASSET_ROWS: readonly FixedAssetRow[] = Object.freeze([
  ['course-g04-l12-vb-035-external-host-associated-01', 'course-g04-l12-vb-035', 'external-host-associated.mp3', 'assets/course-g04-l12-vb-035/external-host-associated.mp3', 241_248, '023ee37f3125c2896e62e5c816767b8e43fd2bd995544848c9d1ebf3bd7330d4', 17_232, 'external', null],
  ['course-g04-l12-vb-035-embedded-stream-0001', 'course-g04-l12-vb-035', 'embedded-stream-0001--sprite-35--frames-0005-0129.mp3', 'assets/course-g04-l12-vb-035/embedded-stream-0001--sprite-35--frames-0005-0129.mp3', 51_740, 'd41d032c3870b3d93a9003fd9510c886d32e9493b8d01e5b66ecff72e4c335df', 10_397, 'embedded', 'sprite-35'],
  ['course-g04-l12-vb-036-external-host-associated-01', 'course-g04-l12-vb-036', 'external-host-associated.mp3', 'assets/course-g04-l12-vb-036/external-host-associated.mp3', 92_736, '60d110000e1dd02cee4cedb6222243f0df1931559ae1922a2940ad896dcddc06', 6_624, 'external', null],
  ['course-g04-l12-vb-036-embedded-stream-0001', 'course-g04-l12-vb-036', 'embedded-stream-0001--sprite-51--frames-0001-0005.mp3', 'assets/course-g04-l12-vb-036/embedded-stream-0001--sprite-51--frames-0001-0005.mp3', 1_950, 'ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38', 392, 'embedded', 'sprite-51'],
  ['course-g04-l12-vb-036-embedded-stream-0002', 'course-g04-l12-vb-036', 'embedded-stream-0002--sprite-57--frames-0003-0031.mp3', 'assets/course-g04-l12-vb-036/embedded-stream-0002--sprite-57--frames-0003-0031.mp3', 11_960, '2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77', 2_403, 'embedded', 'sprite-57'],
  ['course-g04-l12-vb-036-embedded-stream-0003', 'course-g04-l12-vb-036', 'embedded-stream-0003--sprite-85--frames-0002-0028.mp3', 'assets/course-g04-l12-vb-036/embedded-stream-0003--sprite-85--frames-0002-0028.mp3', 11_050, 'f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1', 2_220, 'embedded', 'sprite-85'],
  ['course-g04-l12-vb-036-embedded-stream-0004', 'course-g04-l12-vb-036', 'embedded-stream-0004--sprite-96--frames-0002-0028.mp3', 'assets/course-g04-l12-vb-036/embedded-stream-0004--sprite-96--frames-0002-0028.mp3', 11_050, 'd7a98a5d899d27fb01a48d98e1a3957f03edfe8c7f68dddfb40fe552e311c0d0', 2_220, 'embedded', 'sprite-96'],
  ['course-g04-l12-vb-036-embedded-stream-0005', 'course-g04-l12-vb-036', 'embedded-stream-0005--sprite-108--frames-0002-0031.mp3', 'assets/course-g04-l12-vb-036/embedded-stream-0005--sprite-108--frames-0002-0031.mp3', 11_960, 'c374d3f9cf0f5fd1adfbd46c74abd7d3bd2d0b1d41bf15b3758a87386a6ca7d1', 2_403, 'embedded', 'sprite-108'],
  ['course-g04-l12-vb-036-embedded-stream-0006', 'course-g04-l12-vb-036', 'embedded-stream-0006--sprite-134--frames-0002-0031.mp3', 'assets/course-g04-l12-vb-036/embedded-stream-0006--sprite-134--frames-0002-0031.mp3', 11_960, '70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b', 2_403, 'embedded', 'sprite-134'],
  ['course-g04-l12-vb-036-embedded-stream-0007', 'course-g04-l12-vb-036', 'embedded-stream-0007--sprite-151--frames-0002-0028.mp3', 'assets/course-g04-l12-vb-036/embedded-stream-0007--sprite-151--frames-0002-0028.mp3', 11_050, '3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7', 2_220, 'embedded', 'sprite-151'],
  ['course-g04-l12-vb-036-embedded-stream-0008', 'course-g04-l12-vb-036', 'embedded-stream-0008--sprite-172--frames-0003-0033.mp3', 'assets/course-g04-l12-vb-036/embedded-stream-0008--sprite-172--frames-0003-0033.mp3', 12_740, 'c9502f3d979684587046242dc9022b8aa89e89c72688dfa4bc027858badd9e6e', 2_560, 'embedded', 'sprite-172'],
  ['course-g04-l12-vb-036-embedded-stream-0009', 'course-g04-l12-vb-036', 'embedded-stream-0009--sprite-184--frames-0001-0028.mp3', 'assets/course-g04-l12-vb-036/embedded-stream-0009--sprite-184--frames-0001-0028.mp3', 11_570, 'ede0affb88cb9c7d0378514ff027a74e843f5f1cbac3f751820392dd9420d9e8', 2_325, 'embedded', 'sprite-184'],
  ['course-g04-l12-vb-036-embedded-stream-0010', 'course-g04-l12-vb-036', 'embedded-stream-0010--sprite-215--frames-0002-0026.mp3', 'assets/course-g04-l12-vb-036/embedded-stream-0010--sprite-215--frames-0002-0026.mp3', 10_270, 'ab58df41a71899ae2b62d8ca19d773161ce6017ae5741fc587da597236f922af', 2_064, 'embedded', 'sprite-215'],
  ['course-g04-l12-vb-036-embedded-stream-0011', 'course-g04-l12-vb-036', 'embedded-stream-0011--sprite-216--frames-0009-0082.mp3', 'assets/course-g04-l12-vb-036/embedded-stream-0011--sprite-216--frames-0009-0082.mp3', 30_550, '470b836a8b3a6ec206bed0e9cd965ea24e138279f591520a4c4fdee3be55fc19', 6_139, 'embedded', 'sprite-216'],
]);

const FIXED_ASSETS: readonly FixedAsset[] = Object.freeze(
  FIXED_ASSET_ROWS.map(([
    id,
    animationId,
    assetFile,
    receiptOutputPath,
    bytes,
    sha256,
    durationMs,
    sourceKind,
    ownerFrameDomain,
  ]) => Object.freeze({
    animationId,
    id,
    assetFile,
    url: `/flash-assets/current-js-audio-calibration-v1/${animationId}/${assetFile}?sha256=${sha256}`,
    bytes,
    sha256,
    durationMs,
    sourceKind,
    ownerFrameDomain,
    spokenLanguage: 'undetermined' as const,
    receiptOutputPath,
  })),
);

const RECEIPT_FILE = 'current-js-audio-calibration-v1.receipt.json';
const EXPECTED_DIRECTORIES = Object.freeze([
  '.',
  'assets',
  'assets/course-g04-l12-vb-035',
  'assets/course-g04-l12-vb-036',
]);
const EXPECTED_FILES = Object.freeze([
  RECEIPT_FILE,
  ...FIXED_ASSETS.map(({receiptOutputPath}) => receiptOutputPath),
].sort());

type JsonRecord = Record<string, unknown>;

function isJsonRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function jsonRecord(value: unknown): JsonRecord {
  return isJsonRecord(value) ? value : {};
}

function sha256(bytes: Buffer) {
  return createHash('sha256').update(bytes).digest('hex');
}

function isInside(parent: string, candidate: string) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function stableFileMetadata(information: Awaited<ReturnType<typeof lstat>>) {
  return Object.freeze({
    dev: information.dev,
    ino: information.ino,
    mode: information.mode,
    nlink: information.nlink,
    size: information.size,
    mtimeMs: information.mtimeMs,
    ctimeMs: information.ctimeMs,
  });
}

async function readStableReadonlyFile(
  absolute: string,
  root: string,
  expectedBytes?: number,
) {
  if (!isInside(root, absolute) || absolute === root) {
    throw new Error('audio calibration file escapes its fixed root');
  }
  const before = await lstat(absolute);
  if (
    !before.isFile() ||
    before.isSymbolicLink() ||
    before.nlink !== 1 ||
    (before.mode & 0o777) !== 0o444 ||
    (expectedBytes !== undefined && before.size !== expectedBytes)
  ) {
    throw new Error('audio calibration file metadata is invalid');
  }
  const real = await realpath(absolute);
  if (real !== absolute || !isInside(root, real)) {
    throw new Error('audio calibration file is not canonical');
  }
  const bytes = await readFile(absolute);
  const after = await lstat(absolute);
  if (
    JSON.stringify(stableFileMetadata(before)) !==
      JSON.stringify(stableFileMetadata(after)) ||
    bytes.length !== before.size
  ) {
    throw new Error('audio calibration file changed while reading');
  }
  return bytes;
}

async function assertNoGitAncestorMarker(start: string) {
  let cursor = start;
  while (true) {
    try {
      await lstat(path.join(cursor, '.git'));
      throw new Error('audio calibration root has a Git ancestor');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    const parent = path.dirname(cursor);
    if (parent === cursor) return;
    cursor = parent;
  }
}

async function inspectExactTree(root: string) {
  const directories: string[] = [];
  const files: string[] = [];
  const directoryMetadata = new Map<string, ReturnType<typeof stableFileMetadata>>();
  const visit = async (absolute: string, relative: string) => {
    const information = await lstat(absolute);
    if (
      !information.isDirectory() ||
      information.isSymbolicLink() ||
      (information.mode & 0o777) !== 0o555 ||
      await realpath(absolute) !== absolute
    ) {
      throw new Error('audio calibration directory metadata is invalid');
    }
    directories.push(relative);
    directoryMetadata.set(relative, stableFileMetadata(information));
    const entries = await readdir(absolute, {withFileTypes: true});
    for (const entry of entries.sort((left, right) =>
      left.name.localeCompare(right.name))) {
      const childRelative = relative === '.'
        ? entry.name
        : `${relative}/${entry.name}`;
      const child = path.join(absolute, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error('audio calibration tree contains a symbolic link');
      }
      if (entry.isDirectory()) await visit(child, childRelative);
      else if (entry.isFile()) {
        const information = await lstat(child);
        if (
          information.isSymbolicLink() ||
          information.nlink !== 1 ||
          (information.mode & 0o777) !== 0o444
        ) {
          throw new Error('audio calibration tree contains an unsafe file');
        }
        files.push(childRelative);
      } else throw new Error('audio calibration tree contains a special file');
    }
  };
  await visit(root, '.');
  if (
    JSON.stringify(directories.sort()) !== JSON.stringify([...EXPECTED_DIRECTORIES].sort()) ||
    JSON.stringify(files.sort()) !== JSON.stringify(EXPECTED_FILES)
  ) {
    throw new Error('audio calibration tree differs from its exact allowlist');
  }
  return directoryMetadata;
}

function receiptProjection(receipt: JsonRecord) {
  const assets = Array.isArray(receipt.assets) ? receipt.assets : [];
  return assets.map((value) => {
    const asset = jsonRecord(value);
    const audio = jsonRecord(asset.audio);
    const duration = jsonRecord(audio.duration);
    const sourceStructure = jsonRecord(asset.sourceStructure);
    const semantics = jsonRecord(asset.semantics);
    return {
      id: asset.assetId,
      animationId: asset.animationId,
      assetFile: path.posix.basename(String(asset.outputPath ?? '')),
      receiptOutputPath: asset.outputPath,
      bytes: asset.bytes,
      sha256: asset.sha256,
      durationMs: duration.roundedMilliseconds,
      sourceKind: asset.kind === 'external-host-associated-mp3'
        ? 'external'
        : asset.kind === 'embedded-soundstream-mp3-payload'
          ? 'embedded'
          : null,
      ownerFrameDomain: sourceStructure.ownerDomainId ?? null,
      spokenLanguage: audio.spokenLanguage,
      currentJsPlaybackAssigned: semantics.currentJsPlaybackAssigned,
      linearTimelineCueAuthorized:
        semantics.linearTimelineCueAuthorized ?? null,
      branchAssignment: semantics.branchAssignment ?? null,
      rootTriggerFrame: semantics.rootTriggerFrame ?? null,
    };
  });
}

function expectedReceiptProjection() {
  return FIXED_ASSETS.map((asset) => ({
    id: asset.id,
    animationId: asset.animationId,
    assetFile: asset.assetFile,
    receiptOutputPath: asset.receiptOutputPath,
    bytes: asset.bytes,
    sha256: asset.sha256,
    durationMs: asset.durationMs,
    sourceKind: asset.sourceKind,
    ownerFrameDomain: asset.ownerFrameDomain,
    spokenLanguage: 'undetermined',
    currentJsPlaybackAssigned: false,
    linearTimelineCueAuthorized: asset.sourceKind === 'embedded' ? false : null,
    branchAssignment: null,
    rootTriggerFrame: null,
  }));
}

function assertReceipt(receipt: JsonRecord) {
  const scope = jsonRecord(receipt.scope);
  const summary = jsonRecord(receipt.summary);
  const publicationContract = jsonRecord(receipt.publicationContract);
  const acceptanceValues = Object.values(jsonRecord(receipt.acceptance));
  if (
    receipt.schemaVersion !== 1 ||
    receipt.receiptType !== 'current-js-audio-calibration-v1' ||
    receipt.sliceId !== 'g4-l12-vb035-vb036-audio-source-assets-v1' ||
    scope.pageCount !== 2 ||
    scope.externalHostAssociatedAssetCount !== 2 ||
    scope.embeddedStreamAssetCount !== 12 ||
    scope.totalAssetCount !== 14 ||
    summary.assetCount !== 14 ||
    summary.uniqueAssetSha256Count !== 14 ||
    summary.totalAssetBytes !== 521_834 ||
    summary.ffmpegEofDecodePassedCount !== 14 ||
    summary.sourceFilesUnchanged !== true ||
    summary.strictAcceptanceEffect !== 'none' ||
    acceptanceValues.length !== 13 ||
    !acceptanceValues.every((value) => value === false) ||
    publicationContract.fileMode !== '0444' ||
    publicationContract.directoryMode !== '0555' ||
    publicationContract.overwritesExistingAssets !== false ||
    publicationContract.modifiesSourceFiles !== false ||
    JSON.stringify(publicationContract.directoryPaths) !==
      JSON.stringify(EXPECTED_DIRECTORIES) ||
    JSON.stringify(receiptProjection(receipt)) !==
      JSON.stringify(expectedReceiptProjection())
  ) {
    throw new Error('audio calibration receipt identity or boundary is invalid');
  }
}

function publicMetadata(asset: FixedAsset): G4L12PrivateAudioCalibrationAsset {
  return Object.freeze({
    animationId: asset.animationId,
    id: asset.id,
    assetFile: asset.assetFile,
    url: asset.url,
    bytes: asset.bytes,
    sha256: asset.sha256,
    durationMs: asset.durationMs,
    sourceKind: asset.sourceKind,
    ownerFrameDomain: asset.ownerFrameDomain,
    spokenLanguage: 'undetermined',
  });
}

async function loadCurrentCalibrationSnapshot() {
  const root = G4_L12_PRIVATE_AUDIO_CALIBRATION_ROOT;
  if (await realpath(root) !== root) {
    throw new Error('audio calibration root is not canonical');
  }
  await assertNoGitAncestorMarker(root);
  const directoryMetadataBefore = await inspectExactTree(root);
  const receiptBytes = await readStableReadonlyFile(
    path.join(root, RECEIPT_FILE),
    root,
  );
  if (sha256(receiptBytes) !== G4_L12_PRIVATE_AUDIO_CALIBRATION_RECEIPT_SHA256) {
    throw new Error('audio calibration receipt SHA-256 changed');
  }
  const parsedReceipt: unknown = JSON.parse(receiptBytes.toString('utf8'));
  if (!isJsonRecord(parsedReceipt)) {
    throw new Error('audio calibration receipt is not an object');
  }
  const receipt = parsedReceipt;
  assertReceipt(receipt);

  const bytesByKey = new Map<string, Buffer>();
  for (const asset of FIXED_ASSETS) {
    const bytes = await readStableReadonlyFile(
      path.join(root, asset.receiptOutputPath),
      root,
      asset.bytes,
    );
    if (sha256(bytes) !== asset.sha256) {
      throw new Error('audio calibration asset SHA-256 changed');
    }
    bytesByKey.set(`${asset.animationId}/${asset.assetFile}`, bytes);
  }
  const directoryMetadataAfter = await inspectExactTree(root);
  if (
    JSON.stringify([...directoryMetadataBefore.entries()].sort()) !==
      JSON.stringify([...directoryMetadataAfter.entries()].sort())
  ) {
    throw new Error('audio calibration directory tree changed while reading');
  }
  return {bytesByKey};
}

export async function readG4L12PrivateAudioCalibrationAssets(): Promise<
  readonly G4L12PrivateAudioCalibrationAsset[] | null
> {
  try {
    await loadCurrentCalibrationSnapshot();
    return Object.freeze(FIXED_ASSETS.map(publicMetadata));
  } catch {
    return null;
  }
}

export async function readG4L12PrivateAudioCalibrationAsset(
  animationId: string,
  assetFile: string,
): Promise<G4L12PrivateAudioCalibrationAssetRead | null> {
  try {
    const snapshot = await loadCurrentCalibrationSnapshot();
    const asset = FIXED_ASSETS.find((candidate) =>
      candidate.animationId === animationId &&
      candidate.assetFile === assetFile);
    const bytes = snapshot.bytesByKey.get(`${animationId}/${assetFile}`);
    if (!asset || !bytes) return null;
    return Object.freeze({asset: publicMetadata(asset), bytes});
  } catch {
    return null;
  }
}
