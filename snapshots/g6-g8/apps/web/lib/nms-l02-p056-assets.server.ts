import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ANIMATION_ID = 'shared-nms002-l02-p056';
const SOURCE = {path: 'G6-G8-shared/NMS002/L2/TS/L2TS03.swf', bytes: 100959,
  sha256: 'a1872d6c20987340889c1077d6720cbfe046faa3b5228164987e0834f3c639be'} as const;
const LESSON_XML = {path: 'G6-G8-shared/NMS002/L2/index.xml', bytes: 12845,
  sha256: '550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'} as const;
const INTAKE = {path: 'output/nms-l02-p056-source-intake-20260927/source-intake.json', bytes: 4276,
  sha256: '8dcf9aad32083ba741a781c2da82c355e5c622dfb97544ec58005126341acf80'} as const;

/** Extracted from the SWF stream. The separately indexed SA file is not a substitute. */
export const P056_ASSET_PINS = Object.freeze({
  'main.mp3': Object.freeze({
    path: 'migrations/shared-nms002-l02-p056/audit/embedded-source-stream-v1.mp3',
    bytes: 95290,
    sha256: '6ab63ac96194356d22da4335ce4ff121964044fc5dab27cc79b33fa22e2fc811',
    contentType: 'audio/mpeg',
    role: 'embedded-source-stream-candidate',
  }),
} as const);

export type P056AssetName = keyof typeof P056_ASSET_PINS;
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

export function isP056AssetName(name: string): name is P056AssetName {
  return Object.prototype.hasOwnProperty.call(P056_ASSET_PINS, name);
}

function readPinned(file: string, pin: Pin): Buffer {
  if (!Number.isSafeInteger(pin.bytes) || pin.bytes < 1 || pin.bytes > 1_000_000 ||
      !/^[a-f0-9]{64}$/u.test(pin.sha256) || realpathSync(file) !== file)
    throw Error('P056_ASSET_PIN_OR_PATH');
  const before = lstatSync(file, {bigint: true});
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1n ||
      before.size !== BigInt(pin.bytes)) throw Error('P056_ASSET_ORDINARY');
  const bytes = readFileSync(file);
  const after = lstatSync(file, {bigint: true});
  for (const key of ['dev', 'ino', 'mode', 'size', 'mtimeNs', 'ctimeNs', 'nlink'] as const)
    if (before[key] !== after[key]) throw Error('P056_ASSET_CHANGED');
  if (bytes.length !== pin.bytes || sha256(bytes) !== pin.sha256)
    throw Error('P056_ASSET_HASH');
  return bytes;
}

function physicalRoots(): string {
  if (!isG678LocalPreviewEnabled() || process.env.HELP_MATH_G678_SOURCE_ROOT !== SOURCE_ROOT ||
      realpathSync(SOURCE_ROOT) !== SOURCE_ROOT) throw Error('P056_ASSET_SOURCE_SCOPE');
  const sourceStat = lstatSync(SOURCE_ROOT);
  if (!sourceStat.isDirectory() || sourceStat.isSymbolicLink()) throw Error('P056_ASSET_SOURCE_ROOT');
  const root = getWorkspaceRoot();
  if (realpathSync(root) !== root) throw Error('P056_ASSET_WORKTREE_PATH');
  const worktreeStat = lstatSync(root);
  if (!worktreeStat.isDirectory() || worktreeStat.isSymbolicLink())
    throw Error('P056_ASSET_WORKTREE_ROOT');
  return root;
}

export function verifyP056AssetSource(): Readonly<{animationId: typeof ANIMATION_ID;
  sourceSwfSha256: typeof SOURCE.sha256; lessonXmlSha256: typeof LESSON_XML.sha256}> {
  const root = physicalRoots();
  readPinned(path.join(SOURCE_ROOT, SOURCE.path), SOURCE);
  readPinned(path.join(SOURCE_ROOT, LESSON_XML.path), LESSON_XML);
  const intake: unknown = JSON.parse(readPinned(path.join(root, INTAKE.path), INTAKE).toString('utf8'));
  if (!intake || typeof intake !== 'object' || Array.isArray(intake)) throw Error('P056_ASSET_INTAKE');
  const record = intake as Record<string, unknown>;
  if (record.kind !== 'nms-l02-p056-read-only-source-intake-v1' ||
      record.animationId !== ANIMATION_ID || record.sourceRoot !== SOURCE_ROOT ||
      !record.source || typeof record.source !== 'object' ||
      !record.lessonXml || typeof record.lessonXml !== 'object' ||
      !record.audio || typeof record.audio !== 'object') throw Error('P056_ASSET_INTAKE');
  const source = record.source as Record<string, unknown>;
  const xml = record.lessonXml as Record<string, unknown>;
  const audio = record.audio as Record<string, unknown>;
  const embedded = audio.embeddedMp3 as Record<string, unknown> | undefined;
  const pin = P056_ASSET_PINS['main.mp3'];
  if (source.path !== SOURCE.path || source.bytes !== SOURCE.bytes || source.sha256 !== SOURCE.sha256 ||
      xml.path !== LESSON_XML.path || xml.bytes !== LESSON_XML.bytes || xml.sha256 !== LESSON_XML.sha256 ||
      xml.globalOrdinal !== 56 || xml.pageValue !== 'TS/L2TS03.swf' ||
      embedded?.path !== pin.path || embedded.bytes !== pin.bytes || embedded.sha256 !== pin.sha256 ||
      embedded.role !== 'private-source-evidence-not-product-asset' ||
      audio.sourceBindingAccepted !== false || audio.listeningAccepted !== false)
    throw Error('P056_ASSET_INTAKE_BINDING');
  return {animationId: ANIMATION_ID, sourceSwfSha256: SOURCE.sha256,
    lessonXmlSha256: LESSON_XML.sha256};
}

export function p056Asset(name: P056AssetName) {
  const root = physicalRoots();
  verifyP056AssetSource();
  const pin = P056_ASSET_PINS[name];
  if (!pin) throw Error('P056_ASSET_NAME');
  const bytes = readPinned(path.join(root, pin.path), pin);
  if (bytes[0] !== 0xff || (bytes[1]! & 0xe0) !== 0xe0)
    throw Error('P056_ASSET_MP3_HEADER');
  return {name, ...pin, bytes};
}

export function p056AssetManifest() {
  return (Object.keys(P056_ASSET_PINS) as P056AssetName[]).map(name => {
    const resource = p056Asset(name);
    return {name, sha256: resource.sha256, bytes: resource.bytes.length,
      contentType: resource.contentType, role: resource.role,
      url: `/migration-assets/nms-l02-p056/${name}?sha256=${resource.sha256}`};
  });
}
