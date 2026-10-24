import 'server-only';

import {constants, type BigIntStats} from 'node:fs';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

const ROOT = '/Volumes/American Dream/g4-l12-vb036-pcm-calibration-20260905.a1ZKIn/untrimmed-v1';
const RECEIPT = 'g4-l12-vb036-pcm-calibration-v1.receipt.json';
const RECEIPT_SHA = 'df4e7759b33ab925a80d82aa1ceda1031ce9e61dd3ff51b0d9c290c8d424bcae';
const SOURCE_SHA = '08c76350118e13f0e423692a57881fec48506aed533c780e2662503b08e96f3b';
const ASSETS = Object.freeze([
  Object.freeze({stream: '0001', file: 'vb036-sprite51-stream0001-untrimmed-s16le-22050-mono.wav', owner: 'sprite-51', first: 1, last: 5, blocks: 5,
    samples: 8640, bytes: 17324, sha256: 'c6064d11dd434b655d37ce4caef600bce2bf738db512445fc435ee0fee8f1afe',
    pcmSha256: '9a013bc95969e2d4c1726df02eebc0ea7710f84e68e32c3d01d48095dd52001e', mp3Bytes: 1950, mp3Sha256: 'ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38'}),
  Object.freeze({stream: '0002', file: 'vb036-sprite57-stream0002-untrimmed-s16le-22050-mono.wav', owner: 'sprite-57', first: 3, last: 31, blocks: 29,
    samples: 52992, bytes: 106028, sha256: '0dc4514f641e3e17a99610a6bcfd9c4d123a6f4fd20b79acc8e14613abc9757f',
    pcmSha256: '95fe62d0e44e74b219c3bdb764c76c7914e6acbca207129cff510e1c306a4497', mp3Bytes: 11960, mp3Sha256: '2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77'}),
  Object.freeze({stream: '0003', file: 'vb036-sprite85-stream0003-untrimmed-s16le-22050-mono.wav', owner: 'sprite-85', first: 2, last: 28, blocks: 27,
    samples: 48960, bytes: 97964, sha256: 'c1f75dccc58cd09fc6e0fe237524d2c507a000e4a6bb08596eaf2a22ea102998',
    pcmSha256: '6e3d37c02ec95b20a45ec7d0ac3ef50136dcc49cb1b2efe8e006afce4279dc4c', mp3Bytes: 11050, mp3Sha256: 'f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1'}),
  Object.freeze({stream: '0004', file: 'vb036-sprite96-stream0004-untrimmed-s16le-22050-mono.wav', owner: 'sprite-96', first: 2, last: 28, blocks: 27,
    samples: 48960, bytes: 97964, sha256: 'fee75e8adc79b4459d362bffdcd8c8f49296b8eb5306201b5920b6f5d7b86269',
    pcmSha256: '21fcb950e93fcedf8a6eef48cff7eb6527334f78797395fa3cea6ee1213c51d6', mp3Bytes: 11050, mp3Sha256: 'd7a98a5d899d27fb01a48d98e1a3957f03edfe8c7f68dddfb40fe552e311c0d0'}),
  Object.freeze({stream: '0005', file: 'vb036-sprite108-stream0005-untrimmed-s16le-22050-mono.wav', owner: 'sprite-108', first: 2, last: 31, blocks: 30,
    samples: 52992, bytes: 106028, sha256: '196586b129041f2547a6e4b98722c0d3b4646bd9a7653d98ca5aa62318c58b99',
    pcmSha256: '199317b0694a6802f6b77e7abf588c849c620a1f6491e2493db60907c8e0902a', mp3Bytes: 11960, mp3Sha256: 'c374d3f9cf0f5fd1adfbd46c74abd7d3bd2d0b1d41bf15b3758a87386a6ca7d1'}),
  Object.freeze({stream: '0006', file: 'vb036-sprite134-stream0006-untrimmed-s16le-22050-mono.wav', owner: 'sprite-134', first: 2, last: 31, blocks: 30,
    samples: 52992, bytes: 106028, sha256: 'fcc122e2946071bbfa38a8f1287d37dc311237219176671539bb0bae6b831971',
    pcmSha256: 'd6e2f0ec780c12d2063186a4694ee94c1fc24672d92e65c7aefd9ad2e4ed11cb', mp3Bytes: 11960, mp3Sha256: '70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b'}),
  Object.freeze({stream: '0007', file: 'vb036-sprite151-stream0007-untrimmed-s16le-22050-mono.wav', owner: 'sprite-151', first: 2, last: 28, blocks: 27,
    samples: 48960, bytes: 97964, sha256: 'c48a7dad4531859ca1e02d50185557d22fbd7c043bf1b9d67b8d6df9897e427b',
    pcmSha256: 'b50bb1854af429c0b22f913d851b5ad967247bca21410ebff6f51d221301559f', mp3Bytes: 11050, mp3Sha256: '3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7'}),
  Object.freeze({stream: '0008', file: 'vb036-sprite172-stream0008-untrimmed-s16le-22050-mono.wav', owner: 'sprite-172', first: 3, last: 33, blocks: 31,
    samples: 56448, bytes: 112940, sha256: '0a81192d4e2b00f0b33d4b1badc6e38c631d98b8bfd9ab19ac3d7a9134b37fc7',
    pcmSha256: '9f99e49c4f40c3ea3b486482632b13ebb5f48fd9491fe8e87753cba0e15e0f24', mp3Bytes: 12740, mp3Sha256: 'c9502f3d979684587046242dc9022b8aa89e89c72688dfa4bc027858badd9e6e'}),
  Object.freeze({stream: '0009', file: 'vb036-sprite184-stream0009-untrimmed-s16le-22050-mono.wav', owner: 'sprite-184', first: 1, last: 28, blocks: 28,
    samples: 51264, bytes: 102572, sha256: '02a4c553dea9e88cb9299cecf343f015fd7b02080d00575d59e9cc954b3d4dc3',
    pcmSha256: 'de07aa9f508bb426f56fde9e7f97ac3f5e37c37c30e31ad0b11805b291a5754e', mp3Bytes: 11570, mp3Sha256: 'ede0affb88cb9c7d0378514ff027a74e843f5f1cbac3f751820392dd9420d9e8'}),
  Object.freeze({stream: '0010', file: 'vb036-sprite215-stream0010-untrimmed-s16le-22050-mono.wav', owner: 'sprite-215', first: 2, last: 26, blocks: 25,
    samples: 45504, bytes: 91052, sha256: 'c477bdb734e85c1d7f2ba8809b5bf3703d7735ae86394269623f207c042004c0',
    pcmSha256: 'b5615dad877db1b0a08bcec349e74dff097e345ccc0e7267d7665f91922d39ba', mp3Bytes: 10270, mp3Sha256: 'ab58df41a71899ae2b62d8ca19d773161ce6017ae5741fc587da597236f922af'}),
  Object.freeze({stream: '0011', file: 'vb036-sprite216-stream0011-untrimmed-s16le-22050-mono.wav', owner: 'sprite-216', first: 9, last: 82, blocks: 74,
    samples: 135360, bytes: 270764, sha256: '5dbda3995411e95084f9819e91460e19b76720751fe5ef0b54cf7f9204ab3f76',
    pcmSha256: '9eef4f8b2661758b5b64ccbcfb931ac812cbeeb7e09233b98fb0ed543c425a87', mp3Bytes: 30550, mp3Sha256: '470b836a8b3a6ec206bed0e9cd965ea24e138279f591520a4c4fdee3be55fc19'}),
]);
const FILES = [RECEIPT, ...ASSETS.map((asset) => asset.file)].sort();
const ACCEPTANCE_KEYS = ['sourceToWebAudioMappingEstablished', 'browserSeekPositionsEstablished',
  'sourceAudioBranchTriggerParityEstablished', 'originalRuntimeSynchronizationEstablished', 'spokenLanguageEstablished',
  'listeningAccepted', 'humanAccepted', 'ownerAccepted', 'strictComplete', 'released', 'published'].sort();
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const metadata = (info: BigIntStats) =>
  [info.dev, info.ino, info.uid, info.mode, info.nlink, info.size, info.mtimeNs, info.ctimeNs].map(String).join(':');

function requireFact(value: unknown): asserts value {
  if (!value) throw new Error('Private VB036 PCM binding is invalid');
}
function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function currentUid() {
  requireFact(typeof process.geteuid === 'function');
  return BigInt(process.geteuid());
}

/** Fixed nonsecret routing metadata only. Never use a request value as a file path. */
export function g4L12Vb036PrivatePcmDescriptor(stream: string) {
  const asset = ASSETS.find((candidate) => candidate.stream === stream);
  return asset ? Object.freeze({stream: asset.stream, bytes: asset.bytes, sha256: asset.sha256}) : null;
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
  requireFact(entries.length === 12 && entries.every((entry) => entry.isFile() && !entry.isSymbolicLink()));
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
  } finally {await handle.close();}
}

function verifyReceipt(bytes: Buffer) {
  const receipt = record(JSON.parse(bytes.toString('utf8')));
  const custody = record(receipt.inputCustody), transformation = record(receipt.transformation);
  const parser = record(receipt.sourceParser), source = record(parser.source), tags = record(parser.tagCounts);
  const summary = record(receipt.summary), publication = record(receipt.publicationContract), acceptance = record(receipt.acceptance);
  requireFact(receipt.schemaVersion === 1 && receipt.receiptType === 'g4-l12-vb036-pcm-calibration-v1' &&
    receipt.animationId === 'course-g04-l12-vb-036' && receipt.assetId === 'swf-' + SOURCE_SHA);
  requireFact(custody.unchanged === true && Array.isArray(custody.observedBefore) && custody.observedBefore.length === 9 &&
    JSON.stringify(custody.observedBefore) === JSON.stringify(custody.observedAfter));
  requireFact(source.compressedBytes === 272594 && source.rootFrameCount === 10 &&
    tags.DefineSound === 0 && tags.SoundStreamHead === 11 && tags.SoundStreamHead2 === 0 && tags.SoundStreamBlock === 333);
  requireFact(transformation.retainedZeroSampleBlocks === true && transformation.retainedNegativeSeekSamples === true &&
    transformation.sourceToWebAudioMapping === 'unestablished' && transformation.branchTriggerOrReachabilityAssigned === false &&
    transformation.spokenLanguage === 'undetermined');
  requireFact(summary.streamCount === 11 && summary.blockCount === 333 && summary.totalMp3Bytes === 136110 &&
    summary.totalDecodedSampleFrames === 603072 && summary.totalPcmBytes === 1206144 &&
    summary.totalWavBytes === 1206628 && summary.fullEofVerifiedStreams === 11 && summary.sourceAndInputsUnchanged === true);
  requireFact(publication.outsideGitOnly === true && publication.noReplace === true && publication.webPublishing === false &&
    publication.privateParentMode === '0700' && publication.outputFileMode === '0444' && publication.outputDirectoryMode === '0555' &&
    JSON.stringify(publication.exactFileSet) === JSON.stringify(FILES));
  requireFact(JSON.stringify(Object.keys(acceptance).sort()) === JSON.stringify(ACCEPTANCE_KEYS) &&
    Object.values(acceptance).every((value) => value === false));
  requireFact(Array.isArray(receipt.assets) && receipt.assets.length === ASSETS.length);
  let zeroBlocks = 0, negativeBlocks = 0;
  for (const [index, value] of receipt.assets.entries()) {
    const asset = ASSETS[index]!, entry = record(value), output = record(entry.output);
    const stream = record(entry.sourceStream), head = record(stream.head), payload = record(stream.payload);
    requireFact(entry.streamIndex === index + 1 && entry.ownerDomainId === asset.owner &&
      stream.streamIndex === index + 1 && stream.ownerDomainId === asset.owner && stream.blockCount === asset.blocks &&
      stream.totalBlockHeaderSampleCount === asset.samples && head.mp3LatencySeek === 1673 &&
      head.nominalSamplesPerBlock === 1837 && head.sampleRateHz === 22050 && head.channels === 1 &&
      payload.byteLength === asset.mp3Bytes && payload.sha256 === asset.mp3Sha256);
    requireFact(output.path === asset.file && output.bytes === asset.bytes && output.sha256 === asset.sha256 &&
      output.sampleFrames === asset.samples && output.pcmBytes === asset.samples * 2 && output.pcmSha256 === asset.pcmSha256 &&
      output.sampleRateHz === 22050 && output.channels === 1 && output.bitsPerSample === 16);
    requireFact(entry.sourceWrappersAppliedToPcm === false && entry.appliedLatencyTrimSamples === 0 &&
      entry.fullEofDecodeVerified === true && entry.wavHeaderParsed === true && entry.wavFullEofPcmEqualsSourceDecode === true);
    requireFact(Array.isArray(stream.blocks) && stream.blocks.length === asset.blocks);
    let samples = 0, offset = 0;
    for (const [blockIndex, value] of stream.blocks.entries()) {
      const block = record(value), wrapper = record(block.codecWrapperHeader), part = record(block.payload);
      const count = Number(wrapper.explicitSampleCount), seek = Number(wrapper.mp3SeekSamples), length = Number(part.byteLength);
      requireFact(block.blockIndex === blockIndex + 1 && block.localFrame === asset.first + blockIndex &&
        Number.isInteger(wrapper.explicitSampleCount) && count >= 0 && count <= 65535 &&
        Number.isInteger(wrapper.mp3SeekSamples) && seek >= -32768 && seek <= 32767 &&
        part.byteOffsetInStreamArchive === offset && Number.isInteger(part.byteLength) && length >= 0);
      samples += count; offset += length;
      if (count === 0) zeroBlocks++;
      if (seek < 0) {
        negativeBlocks++;
        requireFact((asset.stream === '0005' || asset.stream === '0006') &&
          block.localFrame === 31 && seek === -1953 && count === 0 && length === 0);
      }
    }
    requireFact(samples === asset.samples && offset === asset.mp3Bytes && asset.first + asset.blocks - 1 === asset.last);
  }
  requireFact(zeroBlocks === 13 && negativeBlocks === 2);
}

function verifyCanonicalWav(wav: Buffer, asset: (typeof ASSETS)[number]) {
  requireFact(wav.length === asset.bytes && wav.toString('ascii', 0, 4) === 'RIFF' &&
    wav.readUInt32LE(4) === asset.bytes - 8 && wav.toString('ascii', 8, 16) === 'WAVEfmt ' &&
    wav.readUInt32LE(16) === 16 && wav.readUInt16LE(20) === 1 && wav.readUInt16LE(22) === 1 &&
    wav.readUInt32LE(24) === 22050 && wav.readUInt32LE(28) === 44100 &&
    wav.readUInt16LE(32) === 2 && wav.readUInt16LE(34) === 16 && wav.toString('ascii', 36, 40) === 'data' &&
    wav.readUInt32LE(40) === asset.samples * 2 && sha256(wav.subarray(44)) === asset.pcmSha256);
}

/** Fresh whole-set file custody only; caller must enforce request admission. No cache, decoder, source mutation or timing claim. */
export async function readG4L12Vb036PrivatePcm(stream: string): Promise<Buffer | null> {
  const selected = ASSETS.find((asset) => asset.stream === stream);
  if (!selected) return null;
  try {
    const before = await inspectRoot();
    const receipt = await readFixedFile(RECEIPT, 320416, RECEIPT_SHA);
    verifyReceipt(receipt.bytes);
    const files = [receipt];
    let result: Buffer | null = null;
    for (const asset of ASSETS) {
      const wav = await readFixedFile(asset.file, asset.bytes, asset.sha256);
      verifyCanonicalWav(wav.bytes, asset);
      files.push(wav);
      if (asset === selected) result = wav.bytes;
    }
    requireFact(JSON.stringify([...before]) === JSON.stringify([...await inspectRoot()]));
    for (const file of files) requireFact(file.metadata === metadata(await fs.lstat(file.absolute, {bigint: true})));
    return result;
  } catch {
    return null;
  }
}
