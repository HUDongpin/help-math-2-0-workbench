import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const LESSON = 'G6-G8-shared/ALG001/L12';
const AUDIO_SHA = '86fdbdeb0fec8cd6b9682d75ec436e4db370d56ba23e48efc47cf00c374c64bf';

function pinned(relative: string, size: number, sha256: string): Buffer {
  const file = path.join(SOURCE_ROOT, LESSON, relative);
  if (realpathSync(file) !== file) throw Error('P006 SA physical file required');
  const before = lstatSync(file, {bigint: true});
  if (!before.isFile() || before.nlink !== 1n || before.size !== BigInt(size))
    throw Error('P006 SA bounded ordinary file required');
  const bytes = readFileSync(file);
  const after = lstatSync(file, {bigint: true});
  for (const key of ['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs', 'nlink', 'mode'] as const)
    if (before[key] !== after[key]) throw Error('P006 SA file changed during read');
  if (bytes.length !== size || createHash('sha256').update(bytes).digest('hex') !== sha256)
    throw Error('P006 SA source drift');
  return bytes;
}

/** Exact optional SA source. No autoplay, locale mapping or listening claim.
 * See SA_HOST_DISPOSITION_2026-09-27.md for the conditional original-host binding. */
export function algL12P006SpanishAudio() {
  if (!isG678LocalPreviewEnabled() ||
      process.env.HELP_MATH_G678_SOURCE_ROOT !== SOURCE_ROOT ||
      realpathSync(SOURCE_ROOT) !== SOURCE_ROOT || !lstatSync(SOURCE_ROOT).isDirectory())
    throw Error('P006 SA local source and opt-in required');
  pinned('index.xml', 11927, '0755afb5645d3179fb1105641b0d1f1b06d8c803c02484bfbdc703ba5bb6f325');
  pinned('RW/L12RW06.swf', 708053, '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6');
  const bytes = pinned('SA/L12RW06.mp3', 214704, AUDIO_SHA);
  return {bytes, sha256: AUDIO_SHA, intendedRole: 'explicit-spanish-audio-control' as const,
    spokenLanguageVerified: false as const};
}
