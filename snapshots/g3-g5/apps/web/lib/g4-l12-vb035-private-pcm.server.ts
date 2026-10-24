import 'server-only';

import {constants, type BigIntStats} from 'node:fs';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

const ROOT = '/Volumes/American Dream/g4-l12-vb035-pcm-calibration-20260905.GzebTj/untrimmed-v1';
const WAV_FILE = 'vb035-sprite35-stream0001-untrimmed-s16le-22050-mono.wav';
const RECEIPT_FILE = 'g4-l12-vb035-pcm-calibration-v1.receipt.json';
const WAV_SHA = '081fa3562e96948e31b940131c9f6ee5b1e954cfc8e49a194b29ddc7cc1ed089';
const PCM_SHA = 'f5bcffae645f6bccc84068d1806e5d4fa06e92effff28c4652c714e9ab49c6a2';
const RECEIPT_SHA = 'fb3ac7790b007413b2e6bb1ac90bf5daa89d513ca1ed4a375747986bff29c397';
const FILES = [RECEIPT_FILE, WAV_FILE].sort();
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

function requireFact(condition: unknown): asserts condition {
  if (!condition) throw new Error('Private VB035 PCM binding is invalid');
}

function currentUid() {
  requireFact(typeof process.geteuid === 'function');
  return BigInt(process.geteuid());
}

function metadata(info: BigIntStats) {
  return [info.dev, info.ino, info.uid, info.mode, info.nlink, info.size, info.mtimeNs, info.ctimeNs].map(String).join(':');
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

async function inspectRoot() {
  const directories = new Map<string, string>();
  for (let cursor = ROOT; ; cursor = path.dirname(cursor)) {
    const info = await fs.lstat(cursor, {bigint: true});
    requireFact(info.isDirectory() && !info.isSymbolicLink() && await fs.realpath(cursor) === cursor);
    if (cursor === ROOT) requireFact((info.mode & 0o777n) === 0o555n && info.uid === currentUid());
    if (cursor === path.dirname(ROOT)) requireFact((info.mode & 0o777n) === 0o700n && info.uid === currentUid());
    directories.set(cursor, metadata(info));
    const marker = await fs.lstat(path.join(cursor, '.git')).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    requireFact(marker === null);
    if (path.dirname(cursor) === cursor) break;
  }
  const entries = await fs.readdir(ROOT, {withFileTypes: true});
  requireFact(entries.length === 2 && entries.every((entry) => entry.isFile() && !entry.isSymbolicLink()));
  requireFact(JSON.stringify(entries.map(({name}) => name).sort()) === JSON.stringify(FILES));
  return directories;
}

async function readFixedFile(name: string, expectedBytes: number, expectedSha: string) {
  const absolute = path.join(ROOT, name);
  requireFact(await fs.realpath(absolute) === absolute);
  const handle = await fs.open(absolute, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const before = await handle.stat({bigint: true});
    requireFact(before.isFile() && before.nlink === 1n && before.uid === currentUid() &&
      (before.mode & 0o777n) === 0o444n && before.size === BigInt(expectedBytes));
    const bytes = await handle.readFile();
    requireFact(metadata(before) === metadata(await handle.stat({bigint: true})) &&
      metadata(before) === metadata(await fs.lstat(absolute, {bigint: true})));
    requireFact(bytes.length === expectedBytes && sha256(bytes) === expectedSha);
    return {bytes, metadata: metadata(before), absolute};
  } finally { await handle.close(); }
}

function verifyReceipt(bytes: Buffer) {
  const receipt = record(JSON.parse(bytes.toString('utf8')));
  const output = record(receipt.output), transformation = record(receipt.transformation);
  const stream = record(receipt.sourceStream), head = record(stream.head), payload = record(stream.payload);
  const custody = record(receipt.inputCustody), acceptance = record(receipt.acceptance);
  requireFact(receipt.schemaVersion === 1 && receipt.receiptType === 'g4-l12-vb035-pcm-calibration-v1' &&
    receipt.animationId === 'course-g04-l12-vb-035' &&
    receipt.assetId === 'swf-401bfc128c0ecfbb250316b9831959554a317c8b243dc3273ba0d46ee19def80');
  requireFact(output.path === WAV_FILE && output.bytes === 458_540 && output.sha256 === WAV_SHA &&
    output.pcmBytes === 458_496 && output.pcmSha256 === PCM_SHA && output.sampleFrames === 229_248 &&
    output.sampleRateHz === 22_050 && output.channels === 1 && output.bitsPerSample === 16);
  requireFact(stream.ownerDomainId === 'sprite-35' && stream.streamIndex === 1 && stream.blockCount === 125 &&
    stream.totalBlockHeaderSampleCount === 229_248 && head.mp3LatencySeek === 1673 &&
    payload.byteLength === 51_740 && payload.sha256 === 'd41d032c3870b3d93a9003fd9510c886d32e9493b8d01e5b66ecff72e4c335df');
  requireFact(Array.isArray(stream.blocks) && stream.blocks.length === 125 && stream.blocks.every((value, index) => {
    const block = record(value), wrapper = record(block.codecWrapperHeader), blockPayload = record(block.payload);
    return block.blockIndex === index + 1 && block.localFrame === index + 5 &&
      Number.isInteger(wrapper.explicitSampleCount) && Number.isInteger(wrapper.mp3SeekSamples) &&
      Number.isInteger(blockPayload.byteOffsetInStreamArchive);
  }));
  requireFact(custody.unchanged === true && Array.isArray(custody.observedBefore) && custody.observedBefore.length === 9 &&
    JSON.stringify(custody.observedBefore) === JSON.stringify(custody.observedAfter));
  requireFact(transformation.appliedLatencyTrimSamples === 0 && transformation.blockSeekSamplesApplied === false &&
    transformation.sourceToWebAudioMapping === 'unestablished' && transformation.spokenLanguage === 'undetermined');
  requireFact(Object.keys(acceptance).length === 10 && Object.values(acceptance).every((value) => value === false));
}

function verifyCanonicalWav(wav: Buffer) {
  requireFact(wav.length === 458_540 && wav.toString('ascii', 0, 4) === 'RIFF' &&
    wav.readUInt32LE(4) === 458_532 && wav.toString('ascii', 8, 16) === 'WAVEfmt ' &&
    wav.readUInt32LE(16) === 16 && wav.readUInt16LE(20) === 1 && wav.readUInt16LE(22) === 1 &&
    wav.readUInt32LE(24) === 22_050 && wav.readUInt32LE(28) === 44_100 &&
    wav.readUInt16LE(32) === 2 && wav.readUInt16LE(34) === 16 && wav.toString('ascii', 36, 40) === 'data' &&
    wav.readUInt32LE(40) === 458_496 && sha256(wav.subarray(44)) === PCM_SHA);
}

/** Fixed private file custody only. The caller must separately enforce request admission. No cache or decoder. */
export async function readG4L12Vb035PrivatePcm(): Promise<Buffer | null> {
  try {
    const before = await inspectRoot();
    const receipt = await readFixedFile(RECEIPT_FILE, 103_699, RECEIPT_SHA);
    verifyReceipt(receipt.bytes);
    const wav = await readFixedFile(WAV_FILE, 458_540, WAV_SHA);
    verifyCanonicalWav(wav.bytes);
    const after = await inspectRoot();
    requireFact(JSON.stringify([...before]) === JSON.stringify([...after]));
    for (const file of [receipt, wav]) requireFact(file.metadata === metadata(await fs.lstat(file.absolute, {bigint: true})));
    return wav.bytes;
  } catch {
    // Do not expose external paths, decoder inputs, or filesystem diagnostics through the route.
    return null;
  }
}
