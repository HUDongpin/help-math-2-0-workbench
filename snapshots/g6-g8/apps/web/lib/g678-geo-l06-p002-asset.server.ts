import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';
import {GEO_L06_P002_SHEET_SHA256, GEO_L06_P002_STREAM_SHA256} from
  './g678-geo-l06-p002-asset-access';

const AUDIT_ROOT = 'migrations/shared-geo001-l06-p002/audit';

function readGeoL06P002Asset(name: string, expectedBytes: number,
  expectedSha256: string, root = getWorkspaceRoot()): Buffer {
  if (process.env.NODE_ENV === 'production') throw Error('GEO_P002_LOCAL_ONLY');
  let directory = root;
  for (const part of AUDIT_ROOT.split('/')) {
    const stat = lstatSync(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink() || realpathSync(directory) !== directory) {
      throw Error('GEO_P002_DIRECTORY_DRIFT');
    }
    directory = path.join(directory, part);
  }
  const parent = lstatSync(directory);
  if (!parent.isDirectory() || parent.isSymbolicLink() || realpathSync(directory) !== directory) {
    throw Error('GEO_P002_DIRECTORY_DRIFT');
  }
  const target = path.join(directory, name);
  const before = lstatSync(target, {bigint: true});
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1n ||
      realpathSync(target) !== target) throw Error('GEO_P002_ASSET_DRIFT');
  const bytes = readFileSync(target);
  const after = lstatSync(target, {bigint: true});
  if (before.dev !== after.dev || before.ino !== after.ino ||
      before.size !== after.size || before.mtimeNs !== after.mtimeNs ||
      before.nlink !== after.nlink || bytes.length !== expectedBytes ||
      createHash('sha256').update(bytes).digest('hex') !== expectedSha256) {
    throw Error('GEO_P002_ASSET_DRIFT');
  }
  return bytes;
}

export function readGeoL06P002Sheet(root = getWorkspaceRoot()): Buffer {
  return readGeoL06P002Asset('source-symbol-sheet-v1.svg', 8122158,
    GEO_L06_P002_SHEET_SHA256, root);
}

export function readGeoL06P002Stream(root = getWorkspaceRoot()): Buffer {
  return readGeoL06P002Asset('sprite-230-source-stream-v1.mp3', 496600,
    GEO_L06_P002_STREAM_SHA256, root);
}
