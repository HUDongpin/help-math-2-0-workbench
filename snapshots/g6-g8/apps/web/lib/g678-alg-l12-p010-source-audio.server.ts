import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_PATH = `${SOURCE_ROOT}/G6-G8-shared/ALG001/L12/VB/L12VB05.swf`;
const SOURCE_SHA = 'a846950547f7c3ab7b0445dfc2118d534565ffd352b6e9687ba8211e5d4a3fcd';
const AUDIO_PATH = 'migrations/shared-alg001-l12-p010/audit/source-stream.mp3';
const AUDIO_SHA = '2ab17de87e12c5f83c97ee15f95af50e5a9aa434977bfea970e60c087624482f';
const AUDIO_BYTES = 189020;
const BLOCKS_PATH = 'migrations/shared-alg001-l12-p010/audit/source-stream-blocks.json';
const BLOCKS_SHA = '656ccb77ccea9737b88c946d4101a759c2441f93522cfd34c3d872fff8080d2e';
const NATIVE_RESULT_PATH = 'output/p010-browser-native-decode-20260927-v1/browser-native-result.json';
const NATIVE_RESULT_SHA = 'f051dc2ba559b8ffb66b99025c2aa222bf32905848d1ac3a0db2ca87f9520ce8';

function readPinned(file: string, size: number, sha256: string): Buffer {
  if (realpathSync(file) !== file) throw Error('P010 audio physical path required');
  const before = lstatSync(file, {bigint: true});
  if (!before.isFile() || before.nlink !== 1n || before.size !== BigInt(size))
    throw Error('P010 audio ordinary bounded file required');
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
      before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs ||
      before.mode !== after.mode || before.nlink !== after.nlink || bytes.length !== size ||
      createHash('sha256').update(bytes).digest('hex') !== sha256)
    throw Error('P010 audio source or evidence drift');
  return bytes;
}

/** Exact extracted stream for the private local candidate. Delivery and technical
 * decode establish no playback schedule, original Flash behavior or listening acceptance. */
export function algL12P010SourceAudio(): {bytes: Buffer; sha256: string} {
  if (!isG678LocalPreviewEnabled() || process.env.HELP_MATH_G678_SOURCE_ROOT !== SOURCE_ROOT ||
      realpathSync(SOURCE_ROOT) !== SOURCE_ROOT || !lstatSync(SOURCE_ROOT).isDirectory())
    throw Error('P010 local audio source required');
  readPinned(SOURCE_PATH, 183770, SOURCE_SHA);
  const root = getWorkspaceRoot();
  readPinned(path.join(root, BLOCKS_PATH), 274267, BLOCKS_SHA);
  // Exact independent browser result binds full native buffer facts. It is
  // evidence for decode guards only, never a Flash/audio acceptance record.
  readPinned(path.join(root, NATIVE_RESULT_PATH), 5102, NATIVE_RESULT_SHA);
  return {bytes: readPinned(path.join(root, AUDIO_PATH), AUDIO_BYTES, AUDIO_SHA), sha256: AUDIO_SHA};
}
