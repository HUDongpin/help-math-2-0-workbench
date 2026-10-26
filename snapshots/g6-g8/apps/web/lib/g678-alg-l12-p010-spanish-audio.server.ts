import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const P010_SA_SHA = '685174141928210d8190f02a778f28db993dfb3f8a7576852264e539ed8b4644';
export const P010_SA_BYTES = 215376;
function pinned(file: string, size: number, sha256: string): Buffer {
  if (realpathSync(file) !== file) throw Error('P010 SA physical path required');
  const before = lstatSync(file, {bigint: true});
  if (!before.isFile() || before.nlink !== 1n || before.size !== BigInt(size))
    throw Error('P010 SA ordinary bounded source required');
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  if ((['dev', 'ino', 'size', 'mode', 'mtimeNs', 'ctimeNs', 'nlink'] as const)
    .some(key => before[key] !== after[key]) || bytes.length !== size ||
    createHash('sha256').update(bytes).digest('hex') !== sha256)
    throw Error('P010 SA source or host evidence drift');
  return bytes;
}

/** Exact optional SA resource; source-host role does not establish listening. */
export function algL12P010SpanishAudio(): {bytes: Buffer; sha256: string} {
  if (!isG678LocalPreviewEnabled() || process.env.HELP_MATH_G678_SOURCE_ROOT !== SOURCE_ROOT ||
      realpathSync(SOURCE_ROOT) !== SOURCE_ROOT || !lstatSync(SOURCE_ROOT).isDirectory())
    throw Error('P010 local optional SA required');
  pinned(path.join(SOURCE_ROOT, 'G6-G8-shared/ALG001/L12/VB/L12VB05.swf'), 183770,
    'a846950547f7c3ab7b0445dfc2118d534565ffd352b6e9687ba8211e5d4a3fcd');
  pinned(path.join(SOURCE_ROOT, 'G6-G8-shared/ALG001/L12/index.xml'), 11927,
    '0755afb5645d3179fb1105641b0d1f1b06d8c803c02484bfbdc703ba5bb6f325');
  pinned(path.join(getWorkspaceRoot(), 'output/p010-sa-host-disposition-20260927-v1/SA_HOST_DISPOSITION_2026-09-27.md'),
    12811, '8fac333536efd5f164ed980083f8c056b6a7668a3a100f768371ed85b57d710d');
  return {bytes: pinned(path.join(SOURCE_ROOT, 'G6-G8-shared/ALG001/L12/SA/L12VB05.mp3'),
    P010_SA_BYTES, P010_SA_SHA), sha256: P010_SA_SHA};
}
