import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {realpathSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {resolveG678HistoricalEvidencePath} from '../../../lib/g678-life-root-binding-v1.mjs';
import {readG678P042PhysicalPin, resolveG678P042PhysicalPath} from '../lib/g678-nms-l01-p042-companion-authority.server';
import {readG678P044PhysicalPin, resolveG678P044PhysicalPath} from '../lib/g678-nms-l01-p044-authority.server';

// Read-only. Recorded absolute pins from the frozen P044 candidate and the P042 readable run.
const root = realpathSync(new URL('../../../', import.meta.url));
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const P044_ACORN = {path: '/Volumes/WestWorld/HELP MATH 2.0/node_modules/acorn/dist/acorn.mjs', bytes: 232769,
  sha256: '1cbcbf252a5800e496dc505c706f309a9dd4e1789392e12963c77ae9497ff6f7'};
const P042_REACT_DOM = {path: '/Volumes/WestWorld/HELP MATH 2.0/node_modules/.pnpm/react-dom@19.2.7_react@19.2.7/node_modules/react-dom/index.js',
  bytes: 1359, sha256: 'ba1a3e33489f868371561777607e3ee5091df0f7ea3f1a10f789d6b86e4c1505'};
const readers = [
  ['P044', resolveG678P044PhysicalPath, readG678P044PhysicalPin, P044_ACORN, /physical drift/],
  ['P042', resolveG678P042PhysicalPath, readG678P042PhysicalPin, P042_REACT_DOM, /physical input changed/],
] as const;

for (const [label, resolve, read, recorded, drift] of readers) {
  test(`${label} reads a recorded absolute pin through the reviewed Life binding, byte-exact`, () => {
    assert.equal(resolve(root, recorded.path), resolveG678HistoricalEvidencePath(recorded.path, root));
    assert.equal(sha(read(root, recorded)), recorded.sha256);
    assert.throws(() => read(root, {...recorded, sha256: '0'.repeat(64)}), drift);
    assert.throws(() => read(root, {...recorded, bytes: recorded.bytes + 1}), drift);
  });
  test(`${label} keeps workspace-relative paths and rejects aliases`, () => {
    assert.equal(resolve(root, 'catalog/animations.json'), path.join(root, 'catalog/animations.json'));
    assert.throws(() => resolve(root, recorded.path.replace('/node_modules/', '/node_modules/./')));
  });
}
