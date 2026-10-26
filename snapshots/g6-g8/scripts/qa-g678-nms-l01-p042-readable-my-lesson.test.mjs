import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {chromium} from 'playwright';
import {CASES, CONTROL_MATRIX, allowedRequest, decodeObservedGlossary, parseArgs, validate378, viewportIsUnobstructed, measureActionControl, actionControlHasValidHit} from './qa-g678-nms-l01-p042-readable-my-lesson.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = async p => JSON.parse(await readFile(path.join(ROOT, p), 'utf8'));
const binding = async p => {const b = await readFile(path.join(ROOT, p)); return {path: p, bytes: b.length, sha256: createHash('sha256').update(b).digest('hex')};};
const PREFIX = 'catalog/product-bridge-calibrations/g678-current-js-378-page-registration-v1';
const PRIOR = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v4';
const AUTHORITY = 'catalog/product-bridge-calibrations/g678-nms-l01-p042-readable-companion-current-js-v1.fragment.json';
const RUN = 'work/g678-shared-page-factory/g678-nms-l01-p042-readable-current-js-v1/run-manifest.json';
const ID = 'shared-nms002-l01-p042';
async function current() {
  const [registry, freeze, fragment, activation, authority, priorFreeze, priorFragment] = await Promise.all([
    'packages/demos/private-current-js-registry.json', `${PREFIX}.json`, `${PREFIX}.fragment.json`, `${PREFIX}.activation.json`,
    AUTHORITY, `${PRIOR}.json`, `${PRIOR}.fragment.json`].map(read));
  return {registry, freeze, fragment, activation, authority, priorFreeze, priorFragment,
    registryBinding: await binding('packages/demos/private-current-js-registry.json'), runBinding: await binding(RUN)};
}
test('exact six normal real-host contexts and supported visible matrix', () => {
  assert.equal(CASES.length, 6); assert.deepEqual(CASES.map(c => c.name), ['370-en', '370-es', '390-en', '390-es', '1440-en', '1440-es']);
  assert.ok(CASES.every(c => c.motion === 'no-preference'));
  assert.deepEqual(CONTROL_MATRIX.desktop, ['key-terms', 'map']); assert.match(CONTROL_MATRIX.desktopHelp, /not tested/i);
});
test('four explicit activation hashes and bounded case name are required', () => {
  const args = ['--run', 'test-only', ...['registry', 'freeze', 'fragment', 'activation'].flatMap(k => [`--${k}-sha256`, 'a'.repeat(64)])];
  assert.equal(parseArgs(args)['--run'], 'test-only'); assert.throws(() => parseArgs(args.slice(0, -2)));
  assert.throws(() => parseArgs([...args, '--only-case', 'other'])); assert.throws(() => parseArgs([...args, '--seed', '1']));
});
test('only exact loopback, existing assets and scoped available routes are allowed', () => {
  for (const p of ['/en/migration-status/g678-calibration/shared-nms002-l01-p042', '/es/migration-status/g678-calibration/shared-nms002-l01-p041', '/flash-assets/g678-local/shared-nms002-l01-p043/canvas-renderer.js'])
    assert.equal(allowedRequest(`http://127.0.0.1:3324${p}`), true);
  for (const u of ['http://127.0.0.1:3324/en/migration-status/g678-calibration/shared-nms002-l01-p044', 'http://127.0.0.1:3214/_next/a.js', 'https://example.com/a', 'http://localhost:3324/_next/a.js'])
    assert.equal(allowedRequest(u), false);
  assert.equal(allowedRequest('ws://127.0.0.1:3324/_next/webpack-hmr', true), true);
});
test('glossary uses only the actual bridge-reviewed XML entity set', () => {
  assert.equal(decodeObservedGlossary(' x &#x2264; 3 '), 'x ≤ 3');
  assert.equal(decodeObservedGlossary('&#x003C; &gt; &quot;'), '< > "'); assert.throws(() => decodeObservedGlossary('&unknown;'));
});
const viewport = () => ({top: 760.984375, bottom: 985.984375, offset: 88, height: 1000, width: 1440,
  scrollY: 373, documentHeight: 1373, points: [0, 1, 2, 3, 4].map(i => ({x: 500 + i, y: 800 + i, unobstructed: true}))});
test('actual max-document-scroll clamp permits fully visible panel with14px bottom space', () => {
  assert.equal(viewportIsUnobstructed(viewport()), true);
  assert.equal(viewportIsUnobstructed({...viewport(), documentHeight: 2000}), false, 'Non-clamped camera still keeps its preferred margin');
});
test('max-scroll branch never permits clipping or header overlap', () => {
  assert.equal(viewportIsUnobstructed({...viewport(), bottom: 1000.1}), false);
  assert.equal(viewportIsUnobstructed({...viewport(), top: 70}), false);
  assert.equal(viewportIsUnobstructed({...viewport(), scrollY: 400}), false);
});
test('max-scroll branch still requires exactly five real in-viewport hit points', () => {
  const p = viewport(); p.points[2].unobstructed = false; assert.equal(viewportIsUnobstructed(p), false);
  assert.equal(viewportIsUnobstructed({...viewport(), points: viewport().points.slice(0, 4)}), false);
  const q = viewport(); q.points[0].y = 1001; assert.equal(viewportIsUnobstructed(q), false);
});
test('real DOM fixed-modal exception retains actual clipping, containing-block and hit protections', async t => {
  const browser=await chromium.launch({headless:true}), page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.route('**/*',r=>r.abort());
  const fixture=async({outer='',panel='',button='',extra='',modal=true,wrapper=''}={})=>{
    await page.setContent(`<style>body{margin:0}.lesson-shell2__body{margin-top:120px;height:900px;overflow:hidden;${outer}}.lesson-shell2__side-panel{position:fixed;right:32px;top:16px;width:720px;height:968px;overflow:auto;background:white;${panel}}button{width:44px;height:44px;margin:22px 12px;float:right;${button}}</style><main class="lesson-shell2" data-support-modal-open="true"><div class="lesson-shell2__body" ${wrapper}><div class="lesson-shell2__side-panel" ${modal?'role="dialog" aria-modal="true"':''}><button>Close</button></div></div></main>${extra}`);
    return page.locator('button').evaluate(measureActionControl);
  };
  try {
    await t.test('viewport-fixed real modal ignores only irrelevant outer overflow with all five hits',async()=>{const r=await fixture();assert.equal(r.viewportFixedModal,true);assert.deepEqual(r.clips,[]);assert.deepEqual(r.ignoredOuterOverflow,['lesson-shell2__body']);assert.ok(r.fullViewport&&r.points.every(p=>p.unobstructed));});
    await t.test('unmarked fixed content is not broadly exempt',async()=>{const r=await fixture({modal:false});assert.equal(r.viewportFixedModal,false);assert.ok(r.clips.length);});
    await t.test('static modal remains subject to body overflow',async()=>{const r=await fixture({panel:'position:relative;top:-110px'});assert.equal(r.viewportFixedModal,false);assert.ok(r.clips.length);});
    for(const outer of ['transform:translateX(0)','filter:blur(0)','perspective:1000px','contain:layout','will-change:transform','clip-path:inset(0)','container-type:inline-size'])
      await t.test(`non-neutral outer boundary ${outer} cannot use the exception`,async()=>assert.equal((await fixture({outer})).viewportFixedModal,false));
    await t.test('actual child clipping inside modal is rejected',async()=>{const r=await fixture({panel:'overflow:hidden;height:25px'});assert.equal(r.viewportFixedModal,false);assert.ok(r.clips.length||!r.points.every(p=>p.unobstructed));});
    await t.test('inert and aria-hidden modal ancestry rejected',async()=>{for(const wrapper of ['inert','aria-hidden="true"']){const r=await fixture({wrapper});assert.equal(r.viewportFixedModal,false);assert.ok(r.inert||r.hidden);}});
    await t.test('transparent/zero/offscreen controls rejected',async()=>{for(const button of ['opacity:0','width:0;height:0;padding:0;border:0','position:fixed;top:-80px']){const r=await fixture({button});assert.equal(r.viewportFixedModal,false);assert.ok(r.hidden||!r.fullViewport);}});
    await t.test('actual overlay covering even a corner disallows exemption',async()=>{const r=await fixture({extra:'<div style="position:fixed;z-index:10;right:40px;top:36px;width:20px;height:20px;background:red"></div>'});assert.equal(r.viewportFixedModal,false);assert.ok(r.points.some(p=>!p.unobstructed));});
    await t.test('ordinary circular control uses its actual painted center, not unpainted bounding corners',async()=>{
      await page.setContent('<button style="position:absolute;left:20px;top:200px;width:58px;height:58px;border-radius:50%;background:orange">Pause</button>');
      const r=await page.locator('button').evaluate(measureActionControl);assert.equal(r.fullViewport,true);assert.equal(r.points[2].unobstructed,true);
      assert.equal(r.points.filter(p=>p.unobstructed).length,1);assert.equal(actionControlHasValidHit(r),true);assert.deepEqual(r.clips,[]);
      await page.evaluate(()=>{const d=document.createElement('div');d.style.cssText='position:absolute;left:40px;top:220px;width:20px;height:20px;background:red';document.body.append(d);});
      assert.equal(actionControlHasValidHit(await page.locator('button').evaluate(measureActionControl)),false);
    });
  } finally {await browser.close();}
});
test('actual activated378 files preserve exact377 and source-bound p042 delta', async () => validate378(await current()));
for (const [name, mutate] of [
  ['377 freeze masquerading as378', p => {p.freeze = p.priorFreeze;}],
  ['changed pre-existing page', p => {p.freeze.selectedPages.find(e => e.animationId !== ID).assetId = 'wrong';}],
  ['stale unregistered wrapper', p => {p.fragment.calibration.entries.find(e => e.key === ID).module = './modules/shared-nms002-l01-p042';}],
  ['crossed source SHA', p => {p.freeze.selectedPages.find(e => e.animationId === ID).sourceSha256 = '0'.repeat(64);}],
  ['root domain substitution', p => {p.freeze.selectedPages.find(e => e.animationId === ID).runtime.frameDomain = 'root';}],
  ['foreign companion suffix', p => {p.freeze.selectedPages.find(e => e.animationId === ID).presentation.pageInteractionCompanionTargetIdSuffix = 'alg-l11-p044-math-companion';}],
  ['receipt registry mismatch', p => {p.activation.proposed.registry.sha256 = '0'.repeat(64);}],
  ['acceptance effects crossed', p => {p.activation.acceptanceEffects.audioAccepted = true;}],
]) test(`reject ${name}`, async () => {const p = await current(); mutate(p); assert.throws(() => validate378(p));});
test('source authority/member/candidate physical closure rehashes without browser', async () => {
  const authority = await read(AUTHORITY), run = await read(RUN), candidate = await read(authority.readableCandidateManifest.path);
  for (const item of [authority.compilerRun, authority.baseCandidateManifest, authority.readableCandidateManifest, run.outputInventory,
    ...run.codeDependencyClosure, ...candidate.files, ...['moduleFile', 'timeline', 'memberManifest'].map(k => authority.entries[0][k])]) {
    const b = await readFile(path.resolve(ROOT, item.path)); assert.equal(b.length, item.bytes);
    assert.equal(createHash('sha256').update(b).digest('hex'), item.sha256, item.path);
  }
});
test('actual runner has no test-loader, clock, forced navigation or unavailable click implementation', async () => {
  const code = await readFile(new URL('./qa-g678-nms-l01-p042-readable-my-lesson.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(code, /setContent\(|addScriptTag\(|addInitScript\(|\.clock\.(?:install|runFor|pauseAt)|force:\s*true|\.scrollTop\s*=/u);
  assert.match(code, /Read-only DOM MutationObserver/u); assert.match(code, /11\); assert\.equal\(rows\.filter/u);
  assert.ok(!code.includes("['next', 44]"));
});
