import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {scanPublishedBuild} from './check-g678-alg-l06-p003-production-bundle.mjs';

test('P003 production scanner catches a leaked source-run marker in a client chunk', t => {
  const directory = mkdtempSync(path.join(tmpdir(), 'p003-bundle-scan-'));
  t.after(() => rmSync(directory, {recursive: true, force: false}));
  mkdirSync(path.join(directory, 'static'));
  mkdirSync(path.join(directory, 'server'));
  writeFileSync(path.join(directory, 'BUILD_ID'), 'fixture');
  writeFileSync(path.join(directory, 'static', 'page.js'), 'public marker-marker-marker');
  writeFileSync(path.join(directory, 'server', 'page.js'), 'safe');
  assert.deepEqual(scanPublishedBuild(directory, ['marker-marker-marker']),
    {files: 2, hits: ['static/page.js']});
  assert.deepEqual(scanPublishedBuild(directory, ['absent-marker']),
    {files: 2, hits: []});
});
