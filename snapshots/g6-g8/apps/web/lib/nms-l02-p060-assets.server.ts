import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ANIMATION_ID = 'shared-nms002-l02-p060';
const SOURCE = {path: 'G6-G8-shared/NMS002/L2/TS/L2TS07.swf', bytes: 577367,
  sha256: '80410162eebca2f85b9aaccec9c91c8d74250c0cba6051595579b4df206215c1'} as const;
const LESSON_XML = {path: 'G6-G8-shared/NMS002/L2/index.xml', bytes: 12845,
  sha256: '550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'} as const;
const SOURCE_AUDIT = {path:'output/nms-l02-p060-source-20260927/source-audit.json', bytes:280886,
 sha256:'ab7eea1b04c185dd118240316a83361688dc301e73d0f973cbb3add76b79ef0d'} as const;
const RAW_INDEX = {path:'output/nms-l02-p060-source-20260927/audio-raw-index.json', bytes:669897,
 sha256:'5883a745fb6c5f69fc5ad8cd12cf6d94d616c3c03d0c056528a70bebf38d88ca'} as const;
/** Source stream domains only; indexed Spanish Audio is not an embedded cue. */
export const P060_ASSET_PINS = Object.freeze({
  "sprite-104.mp3": {
    "path": "output/nms-l02-p060-source-20260927/extraction/audio/sprite-104.mp3",
    "bytes": 28470,
    "sha256": "cc86fd730e1738e0f1a19976fe0cbdd06b3f92eef3a291bdd3a13b84b83b57c0",
    "contentType": "audio/mpeg",
    "role": "embedded-source-stream-candidate"
  },
  "sprite-205.mp3": {
    "path": "output/nms-l02-p060-source-20260927/extraction/audio/sprite-205.mp3",
    "bytes": 11570,
    "sha256": "770ce8a109fb78c238d218e479047529e8cb39f006f8c70747be376556e2a541",
    "contentType": "audio/mpeg",
    "role": "embedded-source-stream-candidate"
  },
  "sprite-217.mp3": {
    "path": "output/nms-l02-p060-source-20260927/extraction/audio/sprite-217.mp3",
    "bytes": 11050,
    "sha256": "3506fcffbe07e726fd4cf1c750cd2641d2aa06f4ca14379b4407ea5843e4f0f0",
    "contentType": "audio/mpeg",
    "role": "embedded-source-stream-candidate"
  },
  "sprite-245.mp3": {
    "path": "output/nms-l02-p060-source-20260927/extraction/audio/sprite-245.mp3",
    "bytes": 11050,
    "sha256": "f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1",
    "contentType": "audio/mpeg",
    "role": "embedded-source-stream-candidate"
  },
  "sprite-258.mp3": {
    "path": "output/nms-l02-p060-source-20260927/extraction/audio/sprite-258.mp3",
    "bytes": 11960,
    "sha256": "2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77",
    "contentType": "audio/mpeg",
    "role": "embedded-source-stream-candidate"
  },
  "sprite-275.mp3": {
    "path": "output/nms-l02-p060-source-20260927/extraction/audio/sprite-275.mp3",
    "bytes": 11050,
    "sha256": "3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7",
    "contentType": "audio/mpeg",
    "role": "embedded-source-stream-candidate"
  },
  "sprite-296.mp3": {
    "path": "output/nms-l02-p060-source-20260927/extraction/audio/sprite-296.mp3",
    "bytes": 12740,
    "sha256": "c9502f3d979684587046242dc9022b8aa89e89c72688dfa4bc027858badd9e6e",
    "contentType": "audio/mpeg",
    "role": "embedded-source-stream-candidate"
  },
  "sprite-322.mp3": {
    "path": "output/nms-l02-p060-source-20260927/extraction/audio/sprite-322.mp3",
    "bytes": 11960,
    "sha256": "70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b",
    "contentType": "audio/mpeg",
    "role": "embedded-source-stream-candidate"
  },
  "sprite-354.mp3": {
    "path": "output/nms-l02-p060-source-20260927/extraction/audio/sprite-354.mp3",
    "bytes": 11856,
    "sha256": "113258636df75e97cc83ceb37ed3f476453cf091834633480aaa6ebe63fd5875",
    "contentType": "audio/mpeg",
    "role": "embedded-source-stream-candidate"
  },
  "sprite-368.mp3": {
    "path": "output/nms-l02-p060-source-20260927/extraction/audio/sprite-368.mp3",
    "bytes": 12350,
    "sha256": "7e9810de5390cdc982dac2795e046343157a6ad9fe4a2ab13e1020b401b2ad11",
    "contentType": "audio/mpeg",
    "role": "embedded-source-stream-candidate"
  },
  "sprite-391.mp3": {
    "path": "output/nms-l02-p060-source-20260927/extraction/audio/sprite-391.mp3",
    "bytes": 290940,
    "sha256": "78a98c5d3158f1fd41c9fd874380fe2a4a239d786e231597886a94cd1d6b67d0",
    "contentType": "audio/mpeg",
    "role": "embedded-source-stream-candidate"
  }
} as const);
export type P060AssetName = keyof typeof P060_ASSET_PINS;
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
type R = Record<string, unknown>;
const record = (value: unknown): R => value && typeof value === 'object' && !Array.isArray(value) ? value as R : {};
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const samePin = (value: unknown, pin: Pin) => {
  const row = record(value);
  return row.path === pin.path && row.bytes === pin.bytes && row.sha256 === pin.sha256;
};

export function isP060AssetName(name: string): name is P060AssetName {
  return Object.prototype.hasOwnProperty.call(P060_ASSET_PINS, name);
}

function readPinned(file: string, pin: Pin): Buffer {
  if (!Number.isSafeInteger(pin.bytes) || pin.bytes < 1 || pin.bytes > 1_000_000 ||
      !/^[a-f0-9]{64}$/u.test(pin.sha256) || realpathSync(file) !== file)
    throw Error('P060_ASSET_PIN_OR_PATH');
  const before = lstatSync(file, {bigint: true});
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1n ||
      before.size !== BigInt(pin.bytes)) throw Error('P060_ASSET_ORDINARY');
  const bytes = readFileSync(file);
  const after = lstatSync(file, {bigint: true});
  for (const key of ['dev', 'ino', 'mode', 'size', 'mtimeNs', 'ctimeNs', 'nlink'] as const)
    if (before[key] !== after[key]) throw Error('P060_ASSET_CHANGED');
  if (bytes.length !== pin.bytes || sha256(bytes) !== pin.sha256)
    throw Error('P060_ASSET_HASH');
  return bytes;
}

function physicalRoots(): string {
  if (!isG678LocalPreviewEnabled() || process.env.HELP_MATH_G678_SOURCE_ROOT !== SOURCE_ROOT ||
      realpathSync(SOURCE_ROOT) !== SOURCE_ROOT) throw Error('P060_ASSET_SOURCE_SCOPE');
  const source = lstatSync(SOURCE_ROOT);
  if (!source.isDirectory() || source.isSymbolicLink()) throw Error('P060_ASSET_SOURCE_ROOT');
  const root = getWorkspaceRoot();
  if (realpathSync(root) !== root) throw Error('P060_ASSET_WORKTREE_PATH');
  const worktree = lstatSync(root);
  if (!worktree.isDirectory() || worktree.isSymbolicLink()) throw Error('P060_ASSET_WORKTREE_ROOT');
  return root;
}

export function verifyP060AssetSource(): Readonly<{animationId: typeof ANIMATION_ID;
  sourceSwfSha256: typeof SOURCE.sha256; lessonXmlSha256: typeof LESSON_XML.sha256}> {
  const root = physicalRoots();
  readPinned(path.join(SOURCE_ROOT, SOURCE.path), SOURCE);
  readPinned(path.join(SOURCE_ROOT, LESSON_XML.path), LESSON_XML);
  const audit: unknown = JSON.parse(readPinned(path.join(root, SOURCE_AUDIT.path), SOURCE_AUDIT).toString('utf8'));
  const index: unknown = JSON.parse(readPinned(path.join(root, RAW_INDEX.path), RAW_INDEX).toString('utf8'));
  const a = record(audit), i = record(index), placement=record(a.placement), audio=record(a.audio);
  if(a.kind!=='nms-l02-p060-source-static-audit-v1'||a.animationId!==ANIMATION_ID||
    a.sourceRoot!==SOURCE_ROOT||!samePin(a.source,SOURCE)||!samePin(a.sourceXml,LESSON_XML)||
    placement.lessonPageCount!==64||placement.globalPageOrdinal!==60||placement.section!=='TS'||
    placement.sectionPageOrdinal!==6||placement.reference!=='TS/L2TS07.swf'||
    record(a.sourceStructure).teachingSpriteId!==391||
    !samePin(audio.rawIndex,RAW_INDEX)||audio.emptyBlockSilenceInserted!==false||
    audio.seekTrimApplied!==false||audio.originalRuntimeSynchronizationEstablished!==false||audio.listeningAccepted!==false||
    i.kind!=='nms-l02-p060-embedded-stream-raw-index-v1'||i.animationId!==ANIMATION_ID||
    i.sourceRoot!==SOURCE_ROOT||!samePin(i.source,SOURCE)||i.emptyBlockSilenceInserted!==false||i.seekTrimApplied!==false)
      throw Error('P060_ASSET_SOURCE_BINDING');
  const streams=audio.streams, raw=i.streams;
  if(!Array.isArray(streams)||!Array.isArray(raw)||streams.length!==11||raw.length!==11)
    throw Error('P060_ASSET_STREAM_COUNT');
  for(const [name,pin] of Object.entries(P060_ASSET_PINS)) {
    const domain=name.slice(0,-4), matches=streams.filter(s=>record(s).ownerDomainId===domain),
      rawMatches=raw.filter(s=>record(s).ownerDomainId===domain);
    if(matches.length!==1||rawMatches.length!==1)throw Error('P060_ASSET_DOMAIN');
    const s=record(matches[0]),r=record(rawMatches[0]),decode=record(s.decode),header=record(r.header);
    if(!samePin(s.payload,pin)||!samePin(r.payload,pin)||decode.fullEofDecode!==true||
      decode.decodedSamples!==r.declaredSamples||decode.sampleRateHz!==22050||
      decode.channels!==(domain==='sprite-354'?2:1)||decode.channels!==header.channels||
      s.blockCount!==r.blockCount)throw Error('P060_ASSET_STREAM_BINDING');
  }
  return {animationId: ANIMATION_ID, sourceSwfSha256: SOURCE.sha256,
    lessonXmlSha256: LESSON_XML.sha256};
}

export function p060Asset(name: P060AssetName) {
  const root = physicalRoots();
  verifyP060AssetSource();
  const pin = P060_ASSET_PINS[name];
  if (!pin) throw Error('P060_ASSET_NAME');
  const bytes = readPinned(path.join(root, pin.path), pin);
  if (bytes[0] !== 0xff || (bytes[1]! & 0xe0) !== 0xe0)
    throw Error('P060_ASSET_MP3_HEADER');
  return {name, ...pin, bytes};
}

export function p060AssetManifest() {
  return (Object.keys(P060_ASSET_PINS) as P060AssetName[]).map(name => {
    const asset = p060Asset(name);
    return {name, sha256: asset.sha256, bytes: asset.bytes.length,
      contentType: asset.contentType, role: asset.role,
      url: `/migration-assets/nms-l02-p060/${name}?sha256=${asset.sha256}`};
  });
}
