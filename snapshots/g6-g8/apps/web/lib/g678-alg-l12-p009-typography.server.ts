import {resolveG678PhysicalPath} from '../../../lib/g678-life-root-binding-v1.mjs';
import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import meta from '../../../migrations/shared-alg001-l12-p009/typography-v1/runtime-meta.json';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';
import {getWorkspaceRoot} from './catalog';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE = `${SOURCE_ROOT}/G6-G8-shared/ALG001/L12/VB/L12VB04.swf`;
const SOURCE_SHA = 'd8bb6bfb4632fc528a0e14092277d95b2d96998aaeab2f0c1252a0233f35f533';
function pinned(file: string, size: number, sha: string) {
  const before = lstatSync(file, {bigint: true});
  if (realpathSync(file) !== file || !before.isFile() || before.nlink !== 1n || before.size !== BigInt(size))
    throw Error('P009 ordinary pinned file required');
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
    before.mtimeNs !== after.mtimeNs || before.mode !== after.mode || before.nlink !== after.nlink ||
    bytes.length !== size || createHash('sha256').update(bytes).digest('hex') !== sha)
    throw Error('P009 pinned bytes changed');
  return bytes;
}
export function algL12P009Typography() {
  const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT === SOURCE_ROOT
    ? SOURCE_ROOT : resolveG678PhysicalPath(SOURCE_ROOT);
  if (!isG678LocalPreviewEnabled() ||
    process.env.HELP_MATH_G678_SOURCE_ROOT !== sourceRoot ||
    meta.animationId !== 'shared-alg001-l12-p009' ||
    meta.sourceSha256 !== SOURCE_SHA || meta.registered !== false || meta.audioEnabled !== false ||
    meta.acceptanceEffect !== 'none' || meta.renderScale !== 2 || meta.bitmapCount !== 0 ||
    meta.canvas.width !== 1600 || meta.canvas.height !== 1200) throw Error('P009 local typography binding required');
  pinned(sourceRoot === SOURCE_ROOT ? SOURCE : resolveG678PhysicalPath(SOURCE), 165405, SOURCE_SHA);
  const file = path.join(getWorkspaceRoot(), 'migrations/shared-alg001-l12-p009/typography-v1/canvas-renderer.js');
  return {bytes: pinned(file, meta.runtimeBytes, meta.runtimeSha256), sha256: meta.runtimeSha256};
}
