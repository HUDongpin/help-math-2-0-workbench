import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const P009_SA_SHA = '3ccbe37ecfabff0506ef3daafc7db4b9fd8b770f0baefd6a70efeaaa27ca6fd4';
export const P009_SA_BYTES = 325584;
function pinned(file: string, size: number, sha256: string): Buffer {
  if (realpathSync(file) !== file) throw Error('P009 SA physical path required');
  const before = lstatSync(file, {bigint: true});
  if (!before.isFile() || before.nlink !== 1n || before.size !== BigInt(size))
    throw Error('P009 SA ordinary bounded source required');
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  if ((['dev', 'ino', 'size', 'mode', 'mtimeNs', 'ctimeNs', 'nlink'] as const)
    .some(key => before[key] !== after[key]) || bytes.length !== size ||
    createHash('sha256').update(bytes).digest('hex') !== sha256)
    throw Error('P009 SA source or host evidence drift');
  return bytes;
}

/** Exact optional SA resource; source-host role does not establish listening. */
export function algL12P009SpanishAudio(): {bytes: Buffer; sha256: string} {
  if (!isG678LocalPreviewEnabled() || process.env.HELP_MATH_G678_SOURCE_ROOT !== SOURCE_ROOT ||
      realpathSync(SOURCE_ROOT) !== SOURCE_ROOT || !lstatSync(SOURCE_ROOT).isDirectory())
    throw Error('P009 local optional SA required');
  pinned(path.join(SOURCE_ROOT, 'G6-G8-shared/ALG001/L12/VB/L12VB04.swf'), 165405,
    'd8bb6bfb4632fc528a0e14092277d95b2d96998aaeab2f0c1252a0233f35f533');
  pinned(path.join(SOURCE_ROOT, 'G6-G8-shared/ALG001/L12/index.xml'), 11927,
    '0755afb5645d3179fb1105641b0d1f1b06d8c803c02484bfbdc703ba5bb6f325');
  pinned(path.join(getWorkspaceRoot(), 'migrations/shared-alg001-l12-p009/evidence/SA_HOST_DISPOSITION_2026-09-27.md'),
    13734, 'fe486452d84efa8ea5609aedf5e94d43cb5d80d27a3bd1a9e48eb6e5ca08e861');
  return {bytes: pinned(path.join(SOURCE_ROOT, 'G6-G8-shared/ALG001/L12/SA/L12VB04.mp3'),
    P009_SA_BYTES, P009_SA_SHA), sha256: P009_SA_SHA};
}
