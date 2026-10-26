import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {P054_FEEDBACK_AUDIO, type P054FeedbackKind}
  from '../../../packages/demos/src/nms-l02-p054-feedback-audio-v1';

const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const sourceFile = path.join(sourceRoot, 'G6-G8-shared/NMS002/L2/GS/L2GS03.swf');
const swfSha256 = '06bde171fe294f555f983c15b50afbb53344851cdc2f76e31e5eb5a4719cabb8';
const audioRoot = '/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/p054-audio-streams-v1';
const manifestSha256 = 'fd31b5e1208eaf54ef3c14fd28d55d61b2fdb3fc47d7b1f41a097d7e40d2dca0';
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

type AudioManifest = {sourceSwf: {sha256: string}; audioAccepted: boolean;
  streams: Array<{sourceCharacterId: number; encoded: {path: string; bytes: number; sha256: string}}>};

/** Local engineering audio only; accepted product assets require separate promotion. */
export function readP054FeedbackAudio(kind: P054FeedbackKind): Buffer {
  if (!Object.hasOwn(P054_FEEDBACK_AUDIO, kind) || process.env.NODE_ENV === 'production' ||
      process.env.VERCEL_ENV || process.env.HELP_MATH_G678_SOURCE_ROOT !== sourceRoot ||
      !lstatSync(sourceRoot).isDirectory() || lstatSync(sourceRoot).isSymbolicLink() ||
      !lstatSync(audioRoot).isDirectory() || lstatSync(audioRoot).isSymbolicLink() ||
      hash(readFileSync(sourceFile)) !== swfSha256) throw new Error('P054 audio source unavailable');
  const manifestBytes = readFileSync(path.join(audioRoot, 'stream-manifest-v1.json'));
  if (hash(manifestBytes) !== manifestSha256) throw new Error('P054 audio manifest changed');
  const manifest = JSON.parse(manifestBytes.toString('utf8')) as AudioManifest;
  const source = P054_FEEDBACK_AUDIO[kind];
  const file = path.join(audioRoot, `sprite-${source.spriteId}-source-stream-v1.mp3`);
  const entry = manifest.streams.find(item => item.sourceCharacterId === source.spriteId);
  if (manifest.sourceSwf.sha256 !== swfSha256 || manifest.audioAccepted !== false ||
      entry?.encoded.path !== file || entry.encoded.bytes !== source.bytes ||
      entry.encoded.sha256 !== source.sha256 ||
      !lstatSync(file).isFile() || lstatSync(file).isSymbolicLink()) {
    throw new Error('P054 feedback audio binding changed');
  }
  const bytes = readFileSync(file);
  if (bytes.length !== source.bytes || hash(bytes) !== source.sha256) {
    throw new Error('P054 feedback audio changed');
  }
  return bytes;
}
