import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';
import {buildP003SourceRuns} from './build-g678-alg-l06-p003-source-runs-v1.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const AUDIT = '/Volumes/American Dream/hudongpin/g678-p003-audit.11qugt';
const OUTPUT = path.join(ROOT, 'packages/demos/src/alg-l06-p003-source-runs.generated.ts');
const SHA = 'd07b1f3429b8f806d23ff852a285dd58c85b7b014715b53b8c169883d2d59b8f';

test('P003 registered-module source runs regenerate exactly from pinned extracted audio', () => {
  const built = buildP003SourceRuns(AUDIT, SOURCE);
  const current = readFileSync(OUTPUT);
  assert.equal(built.sha256, SHA);
  assert.equal(built.bytes, current.length);
  assert.equal(createHash('sha256').update(current).digest('hex'), SHA);
  assert.equal(current.toString('utf8'), built.text);
});

test('P003 source-run generation rejects a non-real source root', () => {
  assert.throws(() => buildP003SourceRuns(AUDIT,
    '/Volumes/WestWorld/HELP MATH 2.0/source-assets'),
  /Source must be a real directory, not symlink/u);
});
