import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_SHA = '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6';
const RECEIPT_SHA = 'c3f1c26102fb9b7e0cb41a60a0de764b8cc68da559a7d20be7ccb42f557f4f78';
const AUDIO_SHA = '801d34dc684341a2644a7fcc3373bea98cbc14bdf91f4364db0e37c30e7c1803';

function readPinned(file: string, size: number, sha256: string): Buffer {
  if (realpathSync(file) !== file) throw Error('P006 physical path required');
  const before = lstatSync(file, {bigint: true});
  if (!before.isFile() || before.nlink !== 1n || before.size !== BigInt(size)) {
    throw Error('P006 ordinary bounded file required');
  }
  const bytes = readFileSync(file);
  const after = lstatSync(file, {bigint: true});
  if (before.dev !== after.dev || before.ino !== after.ino ||
      before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs ||
      before.size !== after.size || before.nlink !== after.nlink ||
      before.mode !== after.mode || bytes.length !== size ||
      createHash('sha256').update(bytes).digest('hex') !== sha256) {
    throw Error('P006 source/audio drift');
  }
  return bytes;
}

/** Private local engineering audio; extraction and decode do not establish listening acceptance. */
export function algL12P006Audio() {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV ||
      process.env.HELP_MATH_G678_SOURCE_ROOT !== SOURCE_ROOT ||
      realpathSync(SOURCE_ROOT) !== SOURCE_ROOT ||
      !lstatSync(SOURCE_ROOT).isDirectory()) throw Error('P006 local source required');
  readPinned(path.join(SOURCE_ROOT, 'G6-G8-shared/ALG001/L12/RW/L12RW06.swf'),
    708053, SOURCE_SHA);
  const audioRoot = path.join(getWorkspaceRoot(),
    'migrations/shared-alg001-l12-p006/audio-source-v1');
  const receipt = JSON.parse(readPinned(path.join(audioRoot, 'stream-source-receipt.json'),
    142839, RECEIPT_SHA).toString('utf8'));
  if (receipt.animationId !== 'shared-alg001-l12-p006' ||
      receipt.sourceSwf?.sha256 !== SOURCE_SHA ||
      receipt.extraction?.sha256 !== AUDIO_SHA ||
      receipt.extraction?.bytes !== 140920) throw Error('P006 audio receipt drift');
  const bytes = readPinned(path.join(audioRoot, 'sprite-53-source-stream.mp3'),
    140920, AUDIO_SHA);
  return {bytes, sha256: AUDIO_SHA};
}
