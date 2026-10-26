import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {ALG_L06_P001_GLYPHS} from '../../../packages/demos/src/alg-l06-p001-glyph-paths';
import {getWorkspaceRoot} from './catalog';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';


const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_SWF = 'G6-G8-shared/ALG001/L6/IR/L6IR01.swf';
const SOURCE_SHA = '9daa5ffe3a1ea275d9467eadafc7addbbb26d14ad1c289e84b3f66f6b0ab9d35';
const AUDIO_SHA = 'b214a1d96c7dadcf509fe1702e3f11694d50c1cfd584978d13ef30d39139633a';

function readPinned(file: string, sha256: string): Buffer {
  const before = lstatSync(file, {bigint: true});
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1n ||
      realpathSync(file) !== file) throw new Error('P001 physical source unavailable');
  const bytes = readFileSync(file);
  const after = lstatSync(file, {bigint: true});
  if (['dev', 'ino', 'size', 'mtimeNs', 'nlink'].some(key =>
    before[key as keyof typeof before] !== after[key as keyof typeof after]) ||
      createHash('sha256').update(bytes).digest('hex') !== sha256) {
    throw new Error('P001 source hash changed');
  }
  return bytes;
}

/** Binds the source SWF and its two exact FFDec glyph exports; no public asset route. */
export function loadP001LocalGlyphs(): readonly [string, string] {
  if (!isG678LocalPreviewEnabled() ||
      process.env.HELP_MATH_G678_SOURCE_ROOT !== SOURCE_ROOT ||
      !lstatSync(SOURCE_ROOT).isDirectory() || lstatSync(SOURCE_ROOT).isSymbolicLink() ||
      realpathSync(SOURCE_ROOT) !== SOURCE_ROOT) {
    throw new Error('P001 local source boundary unavailable');
  }
  readPinned(path.join(SOURCE_ROOT, SOURCE_SWF), SOURCE_SHA);
  const root = getWorkspaceRoot();
  const uris = ALG_L06_P001_GLYPHS.map(({id, sha256}) => {
    const bytes = readPinned(path.join(root,
      `migrations/shared-alg001-l06-p001/assets/title-svg/${id}.svg`), sha256);
    return `data:image/svg+xml;base64,${bytes.toString('base64')}`;
  });
  return uris as [string, string];
}

/** Exact source stream for an opt-in loopback diagnostic, not listening acceptance. */
export function loadP001LocalAudio(): Buffer {
  if (!isG678LocalPreviewEnabled() ||
      process.env.HELP_MATH_G678_SOURCE_ROOT !== SOURCE_ROOT ||
      !lstatSync(SOURCE_ROOT).isDirectory() || lstatSync(SOURCE_ROOT).isSymbolicLink() ||
      realpathSync(SOURCE_ROOT) !== SOURCE_ROOT) {
    throw new Error('P001 local source boundary unavailable');
  }
  readPinned(path.join(SOURCE_ROOT, SOURCE_SWF), SOURCE_SHA);
  return readPinned(path.join(getWorkspaceRoot(),
    'migrations/shared-alg001-l06-p001/assets/source-stream-142.mp3'), AUDIO_SHA);
}
