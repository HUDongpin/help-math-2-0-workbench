import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {CASES, contrastRatio, buildFixture, parseArgs, pureCandidateChecks, reverseInstanceNamespace} from './qa-g678-nms-l01-p042-readable-mounted.mjs';
test('seven exact normal, enlargement and lifecycle profiles', () => {
  assert.equal(CASES.length, 7);
  assert.deepEqual(CASES.filter(c=>c.kind==='normal').map(c=>[c.width,c.height]),[[1440,1000],[390,844],[370,844],[844,390]]);
  const zoom=CASES.find(c=>c.kind==='zoom-reflow-emulation');
  assert.equal(zoom.width,195);assert.equal(zoom.deviceScaleFactor,2);
  assert.equal(CASES.filter(c=>c.kind==='lifecycle').length,1);
});
test('readable native contrast is calculated, not a boolean fixture claim',()=>{
  assert.equal(contrastRatio('rgb(0, 0, 0)','rgb(255, 255, 255)'),21);
  assert.ok(contrastRatio('rgb(19, 40, 76)','rgb(255, 255, 255)')>4.5);
  assert.equal(contrastRatio('rgb(255, 255, 255)','rgb(255, 255, 255)'),1);
  assert.throws(()=>contrastRatio('rgba(0, 0, 0, 0.5)','rgb(255, 255, 255)'));
});
test('stable GO hashes required before a mounted run', () => {
  const sha = 'a'.repeat(64), args = ['--run', 'unit-only', '--module-sha256', sha, '--visual-sha256', sha, '--source-run-sha256', sha];
  assert.equal(parseArgs(args)['--run'], 'unit-only'); assert.throws(() => parseArgs(args.slice(0, -2)));
  assert.throws(() => parseArgs([...args, '--url', 'http://127.0.0.1:3324']));
  assert.throws(() => parseArgs(['--run', '../existing', ...args.slice(2)]));
});
test('only declared ID/reference prefixes reverse, not vector geometry or literal text', () => {
  const raw = '<svg><path id="p042-a-shape" d="M1 2" fill="url(#p042-a-gradient)"/><use href="#p042-a-shape"/><text>p042-a-visible</text></svg>';
  assert.equal(reverseInstanceNamespace(raw, 'p042-a-'), '<svg><path id="shape" d="M1 2" fill="url(#gradient)"/><use href="#shape"/><text>p042-a-visible</text></svg>');
  assert.throws(() => reverseInstanceNamespace(raw, '.*'));
});
test('actual candidate has125 valid invariant visual states and rejects14 invalid contexts', async () => {
  const result = await pureCandidateChecks(); assert.equal(result.validFrameStates, 125); assert.equal(result.distinctVisualStateHashes, 1); assert.equal(result.invalidContextsBlocked, 14);
});
test('actual browser fixture bundles with exact test-loader and no product registry loader', async () => {
  const bundle = await buildFixture(); assert.ok(bundle.outputFiles[0].text.length > 10000);
  assert.ok(Object.keys(bundle.metafile.inputs).some(p => p.startsWith('p042-test:')));
  assert.equal(Object.keys(bundle.metafile.inputs).some(p => /registry\.local-only|private-current-js-registry|load-animation-module\.client\.ts/u.test(p)), false);
});
test('isolated fixture is explicit and has no product navigation or virtual clock', async () => {
  const source = await readFile(new URL('./qa-g678-nms-l01-p042-readable-mounted.mjs', import.meta.url), 'utf8');
  assert.match(source, /page\.setContent\(/u); assert.match(source, /route\.abort\(/u);
  assert.doesNotMatch(source, /page\.goto\(|\.clock\.(?:install|runFor|pauseAt)|force:\s*true/u);
  const fixture = await readFile(new URL('./qa-g678-nms-l01-p042-readable-mounted-fixture.tsx', import.meta.url), 'utf8');
  assert.match(fixture, /data-not-my-lesson="true" data-not-registered="true"/u);
  assert.match(fixture, /presentation="workbench"/u); assert.match(fixture, /enabledCapabilities: \[\]/u);
});

test('fixture uses native owner slots and explicit invalid/lifecycle modes',async()=>{
  const fixture=await readFile(new URL('./qa-g678-nms-l01-p042-readable-mounted-fixture.tsx',import.meta.url),'utf8');
  assert.match(fixture,/lesson-shell2__learning-column/u);
  for(const mode of ['unmarked','button','duplicate','outside','missing','wrong-id'])assert.ok(fixture.includes(mode));
  assert.match(fixture,/Toggle modal containment/u);
  assert.match(fixture,/Remount primary runtime/u);
  const runner=await readFile(new URL('./qa-g678-nms-l01-p042-readable-mounted.mjs',import.meta.url),'utf8');
  assert.match(runner,/fixture-only-text200-not-product-style-change/u);
  assert.match(runner,/no-action/u);
  assert.doesNotMatch(runner,/setPageScaleFactor|page\.goto\(/u);
});
