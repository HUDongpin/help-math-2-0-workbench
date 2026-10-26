import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ANIMATION_ID = 'shared-nms002-l02-p057';
const SOURCE = {path: 'G6-G8-shared/NMS002/L2/TS/L2TS04.swf', bytes: 137055,
  sha256: '9cc456a0af745dc31240b3a6d805e8e115c1c1c2725f851fca8e907a767820aa'} as const;
const LESSON_XML = {path: 'G6-G8-shared/NMS002/L2/index.xml', bytes: 12845,
  sha256: '550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'} as const;
const SOURCE_AUDIT = {path: 'output/nms-l02-p057-source-20260927/source-audit.json', bytes: 39609,
  sha256: '4b4ab7a0f1ddb299703add4117036f31b672b309a62bd912804959f81fc88345'} as const;
const RAW_INDEX = {path: 'output/nms-l02-p057-audio-20260927/raw-index-v1.json', bytes: 196972,
  sha256: 'fb0e0bd403255a7a98fd46c5175f48747f7c840b4c5af08c74c53bbf2d64af71'} as const;

/** The extracted embedded stream only. Indexed SA is a separate source cue. */
export const P057_ASSET_PINS = Object.freeze({
  'main.mp3': Object.freeze({
    path: 'output/nms-l02-p057-audio-20260927/embedded-source-stream-v1.mp3',
    bytes: 134290,
    sha256: 'c87ebf7d1117a616ebddd6b3530a7b19c50dfd885bc5e2734817657da026c2dc',
    contentType: 'audio/mpeg',
    role: 'embedded-source-stream-candidate',
  }),
} as const);
export type P057AssetName = keyof typeof P057_ASSET_PINS;
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
type R = Record<string, unknown>;
const record = (value: unknown): R => value && typeof value === 'object' && !Array.isArray(value) ? value as R : {};
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

export function isP057AssetName(name: string): name is P057AssetName {
  return Object.prototype.hasOwnProperty.call(P057_ASSET_PINS, name);
}

function readPinned(file: string, pin: Pin): Buffer {
  if (!Number.isSafeInteger(pin.bytes) || pin.bytes < 1 || pin.bytes > 1_000_000 ||
      !/^[a-f0-9]{64}$/u.test(pin.sha256) || realpathSync(file) !== file)
    throw Error('P057_ASSET_PIN_OR_PATH');
  const before = lstatSync(file, {bigint: true});
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1n ||
      before.size !== BigInt(pin.bytes)) throw Error('P057_ASSET_ORDINARY');
  const bytes = readFileSync(file);
  const after = lstatSync(file, {bigint: true});
  for (const key of ['dev', 'ino', 'mode', 'size', 'mtimeNs', 'ctimeNs', 'nlink'] as const)
    if (before[key] !== after[key]) throw Error('P057_ASSET_CHANGED');
  if (bytes.length !== pin.bytes || sha256(bytes) !== pin.sha256)
    throw Error('P057_ASSET_HASH');
  return bytes;
}

function physicalRoots(): string {
  if (!isG678LocalPreviewEnabled() || process.env.HELP_MATH_G678_SOURCE_ROOT !== SOURCE_ROOT ||
      realpathSync(SOURCE_ROOT) !== SOURCE_ROOT) throw Error('P057_ASSET_SOURCE_SCOPE');
  const source = lstatSync(SOURCE_ROOT);
  if (!source.isDirectory() || source.isSymbolicLink()) throw Error('P057_ASSET_SOURCE_ROOT');
  const root = getWorkspaceRoot();
  if (realpathSync(root) !== root) throw Error('P057_ASSET_WORKTREE_PATH');
  const worktree = lstatSync(root);
  if (!worktree.isDirectory() || worktree.isSymbolicLink()) throw Error('P057_ASSET_WORKTREE_ROOT');
  return root;
}

export function verifyP057AssetSource(): Readonly<{animationId: typeof ANIMATION_ID;
  sourceSwfSha256: typeof SOURCE.sha256; lessonXmlSha256: typeof LESSON_XML.sha256}> {
  const root = physicalRoots();
  readPinned(path.join(SOURCE_ROOT, SOURCE.path), SOURCE);
  readPinned(path.join(SOURCE_ROOT, LESSON_XML.path), LESSON_XML);
  const audit: unknown = JSON.parse(readPinned(path.join(root, SOURCE_AUDIT.path), SOURCE_AUDIT).toString('utf8'));
  const index: unknown = JSON.parse(readPinned(path.join(root, RAW_INDEX.path), RAW_INDEX).toString('utf8'));
  const a = record(audit), aSource = record(a.source), aXml = record(a.lessonXml),
    aStructure = record(a.sourceStructure), aAudio = record(a.audio), aEmbedded = record(aAudio.embeddedMp3);
  const i = record(index), iSource = record(i.source), iStream = record(i.stream),
    iPayload = record(iStream.payload), iHeader = record(iStream.header), iRange = record(iStream.blockFrameRange),
    iDecode = record(i.decode), iInterpretation = record(i.interpretation);
  const main = P057_ASSET_PINS['main.mp3'];
  if (a.kind !== 'nms-l02-p057-source-static-audit-v1' || a.animationId !== ANIMATION_ID ||
      a.sourceRoot !== SOURCE_ROOT ||
      aSource.path !== path.join(SOURCE_ROOT, SOURCE.path) || aSource.bytes !== SOURCE.bytes ||
      aSource.sha256 !== SOURCE.sha256 ||
      aXml.path !== path.join(SOURCE_ROOT, LESSON_XML.path) || aXml.bytes !== LESSON_XML.bytes ||
      aXml.sha256 !== LESSON_XML.sha256 || aXml.globalOrdinal !== 57 ||
      aXml.pageValue !== 'TS/L2TS04.swf' || aXml.exactDeclaredBanksRecovered !== false ||
      aStructure.teachingSprite !== 'sprite-66' || aStructure.teachingFrames !== 328 ||
      aEmbedded.bytes !== main.bytes || aEmbedded.sha256 !== main.sha256 ||
      aEmbedded.ownerDomain !== 'sprite-66' || aEmbedded.streamBlocks !== 324 ||
      aEmbedded.firstBlockFrame !== 5 || aEmbedded.lastBlockFrame !== 328 ||
      aEmbedded.blockHeaderSamples !== 595008 || aEmbedded.decodedSamplesAt22050 !== 595008 ||
      aEmbedded.sampleRateHz !== 22050 || aEmbedded.channels !== 1 ||
      aEmbedded.codec !== 'mp3' || aEmbedded.role !== 'source-evidence-only' ||
      aAudio.originalHostSelectionEstablished !== false || aAudio.humanListeningAccepted !== false)
    throw Error('P057_ASSET_AUDIT_BINDING');
  if (i.schema !== 'nms-l02-p057-embedded-stream-raw-index-v1' ||
      i.status !== 'source-bound-machine-extraction-only' ||
      iSource.root !== SOURCE_ROOT || iSource.relativePath !== SOURCE.path ||
      iSource.bytes !== SOURCE.bytes || iSource.sha256 !== SOURCE.sha256 ||
      iStream.ownerDomainId !== 'sprite-66' || iStream.frameDomain !== 'sprite-66' ||
      iStream.blockCount !== 324 || iRange.first !== 5 || iRange.last !== 328 ||
      iRange.inclusive !== true || iStream.declaredBlockSamples !== 595008 ||
      iPayload.file !== 'embedded-source-stream-v1.mp3' || iPayload.bytes !== main.bytes ||
      iPayload.sha256 !== main.sha256 || iHeader.format !== 'mp3' ||
      iHeader.sampleRateHz !== 22050 || iHeader.channels !== 1 ||
      iHeader.mp3LatencySeek !== 1673 ||
      iDecode.codec !== 'mp3' || iDecode.sampleRateHz !== 22050 || iDecode.channels !== 1 ||
      iDecode.decodedSamples !== 595008 || iDecode.fullEofDecode !== true ||
      iInterpretation.emptyBlockSilenceInserted !== false ||
      iInterpretation.seekTrimApplied !== false ||
      iInterpretation.originalRuntimeSynchronizationEstablished !== false ||
      iInterpretation.audioListeningAccepted !== false)
    throw Error('P057_ASSET_INDEX_BINDING');
  return {animationId: ANIMATION_ID, sourceSwfSha256: SOURCE.sha256,
    lessonXmlSha256: LESSON_XML.sha256};
}

export function p057Asset(name: P057AssetName) {
  const root = physicalRoots();
  verifyP057AssetSource();
  const pin = P057_ASSET_PINS[name];
  if (!pin) throw Error('P057_ASSET_NAME');
  const bytes = readPinned(path.join(root, pin.path), pin);
  if (bytes[0] !== 0xff || (bytes[1]! & 0xe0) !== 0xe0)
    throw Error('P057_ASSET_MP3_HEADER');
  return {name, ...pin, bytes};
}

export function p057AssetManifest() {
  return (Object.keys(P057_ASSET_PINS) as P057AssetName[]).map(name => {
    const asset = p057Asset(name);
    return {name, sha256: asset.sha256, bytes: asset.bytes.length,
      contentType: asset.contentType, role: asset.role,
      url: `/migration-assets/nms-l02-p057/${name}?sha256=${asset.sha256}`};
  });
}
