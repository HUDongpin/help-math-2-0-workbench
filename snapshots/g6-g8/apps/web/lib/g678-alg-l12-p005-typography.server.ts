import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import meta from '../../../migrations/shared-alg001-l12-p005/typography-v1/runtime-meta.json';
import {algL12P005Canvas} from './g678-alg-l12-p005.server';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';
import {getWorkspaceRoot} from './catalog';

export function algL12P005Typography() {
  if (!isG678LocalPreviewEnabled()) throw Error('P005 local typography opt-in required');
  algL12P005Canvas(); // Physical source SWF and unchanged mask-corrected original adapter.
  const file = path.join(getWorkspaceRoot(), 'migrations/shared-alg001-l12-p005/typography-v1/canvas-renderer.js');
  const before = lstatSync(file, {bigint: true});
  if (realpathSync(file) !== file || !before.isFile() || before.nlink !== 1n ||
    before.size !== BigInt(meta.runtimeBytes)) throw Error('P005 typography ordinary file required');
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
    before.mtimeNs !== after.mtimeNs || before.mode !== after.mode || before.nlink !== after.nlink ||
    bytes.length !== meta.runtimeBytes || createHash('sha256').update(bytes).digest('hex') !== meta.runtimeSha256) {
    throw Error('P005 typography bytes changed');
  }
  return {bytes, sha256: meta.runtimeSha256};
}
