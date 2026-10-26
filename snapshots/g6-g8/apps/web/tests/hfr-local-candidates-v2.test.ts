import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {HFR_LOCAL_CANDIDATE_SOURCES, loadHfrLocalCandidate} from '../lib/hfr-local-candidates-v2.generated';

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(web, '../..');
const env = process.env as Record<string, string | undefined>;
async function withNodeEnv(mode: string | undefined, run: () => Promise<void>) {
  const previous = env.NODE_ENV;
  const set = (value: string | undefined) => {if (value === undefined) delete env.NODE_ENV; else env.NODE_ENV = value;};
  set(mode);
  try {await run();} finally {set(previous);}
}
// Read independently of the generator: the server's pins and the packets they bind.
const server = fs.readFileSync(path.join(web, 'lib/hfr-local-pages.server.ts'), 'utf8');
const map = server.slice(server.indexOf('const CANDIDATES:'), server.indexOf('\n});', server.indexOf('const CANDIDATES:')));
const pins = [...map.matchAll(/^  '([^']+)': Object\.freeze\((?:\{"path":"([^"]+)"|\{\n    path: '([^']+)')/gm)].map(match => [match[1]!, match[2] ?? match[3]!] as const);

test('the candidate table is the source sha256 of each server-pinned packet, in server order', () => {
  assert(Object.isFrozen(HFR_LOCAL_CANDIDATE_SOURCES));
  assert(pins.length > 0);
  assert.deepEqual(Object.entries(HFR_LOCAL_CANDIDATE_SOURCES), pins.map(([key, packet]) =>
    [key, (JSON.parse(fs.readFileSync(path.join(root, packet), 'utf8')) as {source: {sha256: string}}).source.sha256]));
});

test('outside development no candidate module is imported', async () => {
  for (const mode of ['production', 'test', undefined]) await withNodeEnv(mode, async () => {
    for (const key of Object.keys(HFR_LOCAL_CANDIDATE_SOURCES)) assert.equal(await loadHfrLocalCandidate(key), null, `${mode}: ${key}`);
  });
});

test('unknown and prototype keys never reach a loader', () => withNodeEnv('development', async () => {
  for (const key of ['', 'shared-nms002-l11-p099', 'SHARED-NMS002-L11-P023', '__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf'])
    assert.equal(await loadHfrLocalCandidate(key), null, key);
}));

test('in development every candidate loads its own module', () => withNodeEnv('development', async () => {
  for (const key of Object.keys(HFR_LOCAL_CANDIDATE_SOURCES)) assert.equal((await loadHfrLocalCandidate(key))?.default.key, key);
}));
