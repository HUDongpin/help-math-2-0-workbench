import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ANIMATION_ID = 'shared-nms002-l02-p058';
const SOURCE = {path: 'G6-G8-shared/NMS002/L2/TS/L2TS05.swf', bytes: 113754,
  sha256: 'fc26d0a7049db6b8ce5532cfbed1fcb380c75e503d9c7cb7974bea73b8505d57'} as const;
const LESSON_XML = {path: 'G6-G8-shared/NMS002/L2/index.xml', bytes: 12845,
  sha256: '550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'} as const;
const SOURCE_AUDIT = {path: 'output/nms-l02-p058-source-20260927/source-audit.json', bytes: 22193,
  sha256: 'de06df9ad2434071d8470d14694e2c79543ae5515fdd43df30f1f4809639047a'} as const;
const RAW_INDEX = {path: 'output/nms-l02-p058-audio-20260927/raw-index-v1.json', bytes: 161758,
  sha256: '16ebe7ff8d0ba39cb976a20e12f24b698d623024e44fdcf3236a6fdca45a9690'} as const;
const SEPARATE_SA = {path: 'G6-G8-shared/NMS002/L2/SA/L2TS05.mp3', bytes: 213360,
  sha256: '153f3ec94840fbc958e67c5209abdc25e403c0afe9424529e80343befd8c3c6c'} as const;

/** The SWF's embedded stream alone. The indexed SA file is a separate cue. */
export const P058_ASSET_PINS = Object.freeze({
  'main.mp3': Object.freeze({
    path: 'output/nms-l02-p058-audio-20260927/embedded-source-stream-v1.mp3',
    bytes: 109720,
    sha256: '05f43faf63e470935728be5b54933ebb71760aeb819074b570091a6e4b068f38',
    contentType: 'audio/mpeg',
    role: 'embedded-source-stream-candidate',
  }),
} as const);
export type P058AssetName = keyof typeof P058_ASSET_PINS;
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
type R = Record<string, unknown>;
const record = (value: unknown): R => value && typeof value === 'object' && !Array.isArray(value) ? value as R : {};
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const samePin = (value: unknown, pin: Pin) => {
  const row = record(value);
  return row.path === pin.path && row.bytes === pin.bytes && row.sha256 === pin.sha256;
};

export function isP058AssetName(name: string): name is P058AssetName {
  return Object.prototype.hasOwnProperty.call(P058_ASSET_PINS, name);
}

function readPinned(file: string, pin: Pin): Buffer {
  if (!Number.isSafeInteger(pin.bytes) || pin.bytes < 1 || pin.bytes > 1_000_000 ||
      !/^[a-f0-9]{64}$/u.test(pin.sha256) || realpathSync(file) !== file)
    throw Error('P058_ASSET_PIN_OR_PATH');
  const before = lstatSync(file, {bigint: true});
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1n ||
      before.size !== BigInt(pin.bytes)) throw Error('P058_ASSET_ORDINARY');
  const bytes = readFileSync(file);
  const after = lstatSync(file, {bigint: true});
  for (const key of ['dev', 'ino', 'mode', 'size', 'mtimeNs', 'ctimeNs', 'nlink'] as const)
    if (before[key] !== after[key]) throw Error('P058_ASSET_CHANGED');
  if (bytes.length !== pin.bytes || sha256(bytes) !== pin.sha256)
    throw Error('P058_ASSET_HASH');
  return bytes;
}

function physicalRoots(): string {
  if (!isG678LocalPreviewEnabled() || process.env.HELP_MATH_G678_SOURCE_ROOT !== SOURCE_ROOT ||
      realpathSync(SOURCE_ROOT) !== SOURCE_ROOT) throw Error('P058_ASSET_SOURCE_SCOPE');
  const source = lstatSync(SOURCE_ROOT);
  if (!source.isDirectory() || source.isSymbolicLink()) throw Error('P058_ASSET_SOURCE_ROOT');
  const root = getWorkspaceRoot();
  if (realpathSync(root) !== root) throw Error('P058_ASSET_WORKTREE_PATH');
  const worktree = lstatSync(root);
  if (!worktree.isDirectory() || worktree.isSymbolicLink()) throw Error('P058_ASSET_WORKTREE_ROOT');
  return root;
}

export function verifyP058AssetSource(): Readonly<{animationId: typeof ANIMATION_ID;
  sourceSwfSha256: typeof SOURCE.sha256; lessonXmlSha256: typeof LESSON_XML.sha256}> {
  const root = physicalRoots();
  readPinned(path.join(SOURCE_ROOT, SOURCE.path), SOURCE);
  readPinned(path.join(SOURCE_ROOT, LESSON_XML.path), LESSON_XML);
  const audit: unknown = JSON.parse(readPinned(path.join(root, SOURCE_AUDIT.path), SOURCE_AUDIT).toString('utf8'));
  const index: unknown = JSON.parse(readPinned(path.join(root, RAW_INDEX.path), RAW_INDEX).toString('utf8'));
  const a = record(audit), aPlacement = record(a.placement), aStructure = record(a.sourceStructure),
    aAudio = record(a.audio), aEmbedded = record(aAudio.embeddedStream), aPayload = record(aEmbedded.payload),
    aSa = record(aAudio.separateLessonSa);
  const i = record(index), iSource = record(i.source), iAudit = record(i.sourceAudit),
    iStream = record(i.stream), iPayload = record(iStream.payload), iHeader = record(iStream.header),
    iRange = record(iStream.blockFrameRange), iDecode = record(i.decode),
    iInterpretation = record(i.interpretation), iSa = record(i.separateLessonSa);
  const main = P058_ASSET_PINS['main.mp3'];
  if (a.kind !== 'nms-l02-p058-source-static-audit-v1' || a.animationId !== ANIMATION_ID ||
      a.sourceRoot !== SOURCE_ROOT || !samePin(a.source, SOURCE) ||
      !samePin(a.sourceXml, LESSON_XML) ||
      aPlacement.lessonPageCount !== 64 || aPlacement.globalPageOrdinal !== 58 ||
      aPlacement.sectionCode !== 'TS' || aPlacement.sectionPageOrdinal !== 4 ||
      aPlacement.reference !== 'TS/L2TS05.swf' ||
      aStructure.teachingDomain !== 'sprite-37' || aStructure.teachingFrameCount !== 274 ||
      aEmbedded.domain !== 'sprite-37' || aEmbedded.blockCount !== 265 ||
      aEmbedded.firstBlockFrame !== 10 || aEmbedded.lastBlockFrame !== 274 ||
      aEmbedded.declaredSamples !== 486144 || aEmbedded.decodedSamples !== 486144 ||
      aEmbedded.sampleRateHz !== 22050 || aEmbedded.channels !== 1 ||
      aEmbedded.mp3LatencySeekSamples !== 1673 ||
      aPayload.bytes !== main.bytes || aPayload.sha256 !== main.sha256 ||
      aAudio.sourceAlignmentAccepted !== false || aAudio.listeningAccepted !== false ||
      !samePin(aSa.pin, SEPARATE_SA) || aSa.sourceBinding !== 'catalog-index-only-not-substituted')
    throw Error('P058_ASSET_AUDIT_BINDING');
  if (i.schema !== 'nms-l02-p058-embedded-stream-raw-index-v1' ||
      i.status !== 'source-bound-machine-extraction-only' ||
      iSource.root !== SOURCE_ROOT || iSource.relativePath !== SOURCE.path ||
      iSource.bytes !== SOURCE.bytes || iSource.sha256 !== SOURCE.sha256 ||
      iAudit.path !== SOURCE_AUDIT.path || iAudit.sha256 !== SOURCE_AUDIT.sha256 ||
      iStream.ownerDomainId !== 'sprite-37' || iStream.frameDomain !== 'sprite-37' ||
      iStream.blockCount !== 265 || iRange.first !== 10 || iRange.last !== 274 ||
      iRange.inclusive !== true || iStream.declaredBlockSamples !== 486144 ||
      iPayload.file !== 'embedded-source-stream-v1.mp3' || iPayload.bytes !== main.bytes ||
      iPayload.sha256 !== main.sha256 || iHeader.format !== 'mp3' ||
      iHeader.sampleRateHz !== 22050 || iHeader.channels !== 1 ||
      iHeader.mp3LatencySeek !== 1673 ||
      iDecode.codec !== 'mp3' || iDecode.sampleRateHz !== 22050 || iDecode.channels !== 1 ||
      iDecode.decodedSamples !== 486144 || iDecode.fullEofDecode !== true ||
      !samePin(iSa.source, SEPARATE_SA) || iSa.sourceBinding !== 'catalog-index-only-not-substituted' ||
      iInterpretation.emptyBlockSilenceInserted !== false ||
      iInterpretation.seekTrimApplied !== false || iInterpretation.spanishAudioSpliced !== false ||
      iInterpretation.originalRuntimeSynchronizationEstablished !== false ||
      iInterpretation.audioListeningAccepted !== false)
    throw Error('P058_ASSET_INDEX_BINDING');
  return {animationId: ANIMATION_ID, sourceSwfSha256: SOURCE.sha256,
    lessonXmlSha256: LESSON_XML.sha256};
}

export function p058Asset(name: P058AssetName) {
  const root = physicalRoots();
  verifyP058AssetSource();
  const pin = P058_ASSET_PINS[name];
  if (!pin) throw Error('P058_ASSET_NAME');
  const bytes = readPinned(path.join(root, pin.path), pin);
  if (bytes[0] !== 0xff || (bytes[1]! & 0xe0) !== 0xe0)
    throw Error('P058_ASSET_MP3_HEADER');
  return {name, ...pin, bytes};
}

export function p058AssetManifest() {
  return (Object.keys(P058_ASSET_PINS) as P058AssetName[]).map(name => {
    const asset = p058Asset(name);
    return {name, sha256: asset.sha256, bytes: asset.bytes.length,
      contentType: asset.contentType, role: asset.role,
      url: `/migration-assets/nms-l02-p058/${name}?sha256=${asset.sha256}`};
  });
}
