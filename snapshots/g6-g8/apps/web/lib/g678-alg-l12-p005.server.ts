import {resolveG678PhysicalPath} from '../../../lib/g678-life-root-binding-v1.mjs';
import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const RUNTIME_SHA = '48efbca3ddebf218565cdd635ffa130ae3a402c5693dd1ebcf359b2c30d500dd';

function readPinned(file: string, size: number, hash: string): Buffer {
  if (realpathSync(file) !== file) throw Error('P005 physical path required');
  const before = lstatSync(file, {bigint: true});
  if (!before.isFile() || before.nlink !== 1n || before.size !== BigInt(size)) {
    throw Error('P005 ordinary bounded file required');
  }
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  if (before.dev !== after.dev || before.ino !== after.ino ||
      before.mtimeNs !== after.mtimeNs || before.size !== after.size ||
      before.nlink !== after.nlink || before.mode !== after.mode ||
      bytes.length !== size || createHash('sha256').update(bytes).digest('hex') !== hash) {
    throw Error('P005 source/candidate drift');
  }
  return bytes;
}

/** Local engineering bytes only. No registration, publication, or audio claim. */
export function algL12P005Canvas() {
  const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT === SOURCE_ROOT
    ? SOURCE_ROOT : resolveG678PhysicalPath(SOURCE_ROOT);
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV ||
      process.env.HELP_MATH_G678_SOURCE_ROOT !== sourceRoot ||
      realpathSync(sourceRoot) !== sourceRoot ||
      !lstatSync(sourceRoot).isDirectory()) throw Error('P005 local source required');
  readPinned(path.join(sourceRoot, 'G6-G8-shared/ALG001/L12/RW/L12RW05.swf'),
    1950595, 'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe');
  const bytes = readPinned(path.join(getWorkspaceRoot(),
    'migrations/shared-alg001-l12-p005/candidate-v2/canvas-renderer.js'),
  19449678, RUNTIME_SHA);
  return {bytes, sha256: RUNTIME_SHA};
}
