import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {CASES, CONTROL_MATRIX, assertSourceVectorCount, expectedSourceRating, networkAllowed, parseArgs, validateActivatedV4} from './qa-g678-alg-l11-v4-math-companion-my-lesson.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = async p => JSON.parse(await readFile(path.join(ROOT, p), 'utf8'));
const sha = 'a'.repeat(64);
const args = ['--run', 'unit-only-not-browser', '--registry-sha256', sha, '--freeze-sha256', sha,
  '--fragment-sha256', sha, '--activation-sha256', sha];
test('exact 12 direct locale/layout cases and three source handoffs', () => {
  assert.equal(CASES.length, 15); assert.equal(new Set(CASES.map(c => c.name)).size, 15);
  assert.equal(CASES.filter(c => c.kind === 'full').length, 12);
  assert.deepEqual(CASES.filter(c => c.kind === 'handoff').map(c => c.width), [370, 390, 1440]);
  assert.ok(CASES.filter(c => c.kind === 'full' && c.width === 1440).every(c => c.motion === 'no-preference'));
  assert.match(CONTROL_MATRIX.desktop.help, /not-tested/);
  assert.match(CONTROL_MATRIX.mobile.help, /naturally-visible/);
});
test('CLI requires every explicit physical activation pin', () => {
  assert.equal(parseArgs(args)['--run'], 'unit-only-not-browser');
  assert.throws(() => parseArgs(args.slice(0, -2)));
  assert.throws(() => parseArgs([...args, '--clock', 'virtual']));
  assert.throws(() => parseArgs([...args, '--run', 'duplicate']));
  assert.throws(() => parseArgs([...args, '--only-case', 'unknown']));
  assert.throws(() => parseArgs(['--run', '../overwrite', ...args.slice(2)]));
  assert.equal(parseArgs([...args, '--only-case', CASES[0].name])['--only-case'], CASES[0].name);
});
test('network allowlist is exact loopback and existing routes/assets only', () => {
  for (const p of ['/en/migration-status/g678-calibration/shared-alg001-l11-p034', '/es/migration-status/g678-calibration/shared-alg001-l11-p044', '/_next/static/a.js', '/learning-theme-bootstrap.js'])
    assert.equal(networkAllowed(`http://127.0.0.1:3324${p}`), true);
  for (const u of ['http://127.0.0.1:3214/en/migration-status/g678-calibration/shared-alg001-l11-p034', 'http://localhost:3324/_next/a', 'https://example.com/a', 'http://127.0.0.1:3324/api/source-audio', 'http://127.0.0.1:3324/en/courses'])
    assert.equal(networkAllowed(u), false);
  assert.equal(networkAllowed('ws://127.0.0.1:3324/_next/webpack-hmr', true), true);
  assert.equal(networkAllowed('ws://127.0.0.1:3324/other', true), false);
});
test('p044 source-defined text-only results are not mistaken for a missing question diagram', () => {
  assertSourceVectorCount(44, 'results', 0);
  assertSourceVectorCount(44, 'answering', 5);
  assertSourceVectorCount(44, 'review', 5);
  assertSourceVectorCount(34, 'complete', 12);
  assert.throws(() => assertSourceVectorCount(44, 'answering', 0));
  assert.throws(() => assertSourceVectorCount(44, 'review', 0));
  assert.throws(() => assertSourceVectorCount(34, 'complete', 0));
  assert.throws(() => assertSourceVectorCount(44, 'results', 5));
});
for (const [score, rating] of [[3, 'Unsatisfactory'], [4, 'Partially Proficient'], [5, 'Partially Proficient'],
  [6, 'Partially Proficient'], [7, 'Proficient'], [8, 'Proficient'], [9, 'Advanced'], [10, 'Advanced']])
  test(`source-exact result boundary ${score}/10`, () => assert.equal(expectedSourceRating(score), rating));

// Read sealed real predecessors/candidates. This in-memory proposal is only a
// validator unit input; it is never saved, activated, served or called evidence.
async function unitProposal() {
  const prefix = 'catalog/product-bridge-calibrations/';
  const fragment = await read(`${prefix}g678-current-js-377-page-registration-v3.fragment.json`);
  const freeze = await read(`${prefix}g678-current-js-377-page-registration-v3.json`);
  const companion = await read(`${prefix}g678-alg-l11-two-page-companion-successor-v1.fragment.json`);
  const runBinding = companion.companionCompilerRun;
  fragment.freeze.path = `${prefix}g678-current-js-377-page-registration-v4.json`;
  fragment.calibration.freezeManifest = fragment.freeze.path;
  for (const number of [34, 44]) {
    const id = `shared-alg001-l11-p0${number}`, candidate = companion.entries.find(e => e.key === id);
    const entry = fragment.calibration.entries.find(e => e.key === id);
    entry.module = candidate.module;
    entry.artifacts = {kind: 'maintained-dom-module-v1', module: candidate.moduleFile, timeline: candidate.timeline,
      memberManifest: candidate.memberManifest, sourceRun: runBinding};
    const page = freeze.selectedPages.find(p => p.animationId === id);
    page.runtime = {...candidate.runtimeContract, rendererBinding: entry.artifacts};
    page.presentation = {pageInteractionCompanionTargetIdSuffix: `alg-l11-p0${number}-math-companion`};
  }
  const registryBinding = {path: 'packages/demos/private-current-js-registry.json', bytes: 1, sha256: '0'.repeat(64)};
  return {fragment, freeze, companion, runBinding, registryBinding, registry: {calibrations: [fragment.calibration]},
    activation: {registryChanged: true, registrationCount: 377, proposed: {registry: registryBinding}, acceptanceEffects: {productCalibrationPassed: false}}};
}
test('read-only actual V3 cannot be labeled V4', async () => {
  const p = await unitProposal();
  p.fragment = await read('catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v3.fragment.json');
  assert.throws(() => validateActivatedV4(p));
});
test('exact sealed member projection is accepted only by in-memory binding validator', async () => {
  validateActivatedV4(await unitProposal());
});
for (const [name, mutate] of [
  ['stale wrapper mixed with companion member', p => {p.fragment.calibration.entries.find(e => e.key === 'shared-alg001-l11-p034').module = './modules/g678-alg-l11-instructional-feedback-host-score-successor-p034';}],
  ['crossed source identity', p => {p.freeze.selectedPages.find(e => e.animationId === 'shared-alg001-l11-p044').sourceSha256 = '0'.repeat(64);}],
  ['runtime scenario drift', p => {p.freeze.selectedPages.find(e => e.animationId === 'shared-alg001-l11-p034').runtime.scenario = 'test-loader';}],
  ['missing companion slot', p => {delete p.freeze.selectedPages.find(e => e.animationId === 'shared-alg001-l11-p034').presentation;}],
  ['activation registry mismatch', p => {p.activation.proposed.registry = {...p.registryBinding, sha256: 'f'.repeat(64)};}],
  ['incorrect count', p => {p.activation.registrationCount = 378;}],
  ['false product calibration promotion', p => {p.freeze.productCalibrationPassed = true;}],
]) test(`reject ${name}`, async () => {const p = await unitProposal(); mutate(p); assert.throws(() => validateActivatedV4(p));});

test('runner source has no virtual clock or hidden forced-action implementation', async () => {
  const code = await readFile(path.join(ROOT, 'scripts/qa-g678-alg-l11-v4-math-companion-my-lesson.mjs'), 'utf8');
  assert.doesNotMatch(code, /\.clock\.(?:install|runFor|pauseAt)|force:\s*true|addInitScript\(|addScriptTag\(|setContent\(/u);
  assert.doesNotMatch(code, /\.scrollTop\s*=|\.scrollIntoView\(/u);
});
