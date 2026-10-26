import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {resolveSourceGlossary} from './build-g678-alg-l11-instructional-successor-glossary.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(root, 'scripts/extract-g678-alg-l12-p003-glossary.mjs');
const output = path.join(root, 'migrations/shared-alg001-l12-p003/audit/source-glossary-v1.json');
const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
const requested = ['Graph', 'Relation', 'Function', 'Equation', 'Linear equation', 'Linear function'];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const run = (...args) => spawnSync(process.execPath, [script, ...args], {cwd: root, encoding: 'utf8'});

test('P003 source-bound artifact has the six exact SWF requests and passes --check', async () => {
  const bytes = await readFile(output);
  const artifact = JSON.parse(bytes);
  assert.equal(artifact.animationId, 'shared-alg001-l12-p003');
  assert.equal(artifact.sourceDirectory, sourceRoot);
  assert.deepEqual(artifact.buttonSources.map(button => button.requestedSourceKey), requested);
  assert.equal(artifact.entries.length, 6);
  assert.deepEqual(new Set(artifact.entries.map(entry => entry.requestedSourceKey)), new Set(requested));
  assert.equal(new Set(artifact.entries.map(entry => entry.id)).size, 6);
  for (const entry of artifact.entries) {
    assert.equal(entry.sourceKeyAttribute, entry.requestedSourceKey);
    assert.equal(entry.rawScreenkeyTerm.toLowerCase(), entry.requestedSourceKey.toLowerCase());
    assert.equal(typeof entry.definitions.en, 'string');
    assert.equal(typeof entry.definitions.es, 'string');
    assert(entry.definitions.en.length > 0 && entry.definitions.es.length > 0);
    assert(['exact', 'Unique case-insensitive ScreenkeyTerm and English element-label match to the exact SWF request; original host lookup unverified.'].includes(entry.keyMappingDecision));
  }
  assert.equal(artifact.originalHostLookupVerified, false);
  assert.equal(artifact.companionMediaVerified, false);
  const checked = run('--check');
  assert.equal(checked.status, 0, checked.stderr);
  assert.equal(JSON.parse(checked.stdout).sha256, sha256(bytes));
});

test('source root cannot be redirected and --write cannot overwrite the audit', async () => {
  const before = await readFile(output);
  const redirected = spawnSync(process.execPath, [script, '--check', '--source-root', '/tmp'],
    {cwd: root, encoding: 'utf8', env: {...process.env, HELP_MATH_GLOSSARY_SOURCE_ROOT: '/tmp'}});
  assert.notEqual(redirected.status, 0);
  const write = run('--write');
  assert.notEqual(write.status, 0);
  assert.match(write.stderr, /EEXIST/u);
  assert.deepEqual(await readFile(output), before);
});

test('maintained bilingual resolver fails closed on missing and ambiguous entries', () => {
  const item = '<Graph~LNG~Gráfico ScreenkeyTerm="Graph" ExFileName="Graph.swf">Definition~LNG~Definición</Graph~LNG~Gráfico>';
  const source = {en: {}, es: {}};
  assert.throws(() => resolveSourceGlossary({en: item, es: ''}, ['Graph'], source), /missing or ambiguous exact bilingual entry/u);
  assert.throws(() => resolveSourceGlossary({en: item + item, es: item}, ['Graph'], source), /missing or ambiguous exact bilingual entry/u);
});
