#!/usr/bin/env node
// Actual378 product-route QA. Preparation is not permission to open the old377 server.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {reverseInstanceNamespace, contrastRatio} from './qa-g678-nms-l01-p042-readable-mounted.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'scripts/qa-g678-nms-l01-p042-readable-my-lesson.mjs';
const PREFIX = 'catalog/product-bridge-calibrations/g678-current-js-378-page-registration-v1';
const PRIOR = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v4';
const REGISTRY = 'packages/demos/private-current-js-registry.json';
const AUTHORITY = 'catalog/product-bridge-calibrations/g678-nms-l01-p042-readable-companion-current-js-v1.fragment.json';
const RUN = 'work/g678-shared-page-factory/g678-nms-l01-p042-readable-current-js-v1/run-manifest.json';
const CANDIDATE = 'catalog/g678-nms-l01-p042-readable-companion-candidate-v1.json';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const VISUAL = 'packages/demos/src/generated/g678-nms-l01-p042-source-visual-v1.ts';
const BASE = 'http://127.0.0.1:3324', ID = 'shared-nms002-l01-p042', SUFFIX = 'nms-l01-p042-readable-companion';
const HOST = '[data-lesson-player][data-current-animation-id]', STAGE = `${HOST} .runtime-stage[data-animation-module]`;
const RUNTIME = `${HOST} .runtime-shell[data-runtime-transport]`, CONTENT = `${HOST} [data-p042-readable-content="true"]`;
const FIGURE = `${STAGE} [data-p042-source-candidate="v1"]`;
const PINS = Object.freeze({
  [AUTHORITY]: '90f82d1efa3de8d5658135a1d7a4b9c6ace6abc4beb8bba9e644d63331fd4921',
  [RUN]: '9691c28d31d3887aebeefc3c05e38f0538acfe0c2fb74341779e396e4657aa23',
  [CANDIDATE]: 'fbc18882c13414365ad5e6f05a89fa0acc7cfeeab8ac9a06c4982a20eded997f',
  [VISUAL]: 'dfbc661cae6e8ed82b8ddf08f8f41560e19c6af9a38c96fc4c759b4ff9dc8897',
  [`${PRIOR}.json`]: '4633c4a3853e44ff1cd58184cf154acc6edc7e2e96ed936c72ce2decc006d358',
  [`${PRIOR}.fragment.json`]: '637006cf11e2b8aed9020faf008d9b34980293a2f47ed3283d9dcf39a0bf6b6d',
});
export const CASES = Object.freeze([370, 390, 1440].flatMap(width => ['en', 'es'].map(locale => ({
  name: `${width}-${locale}`, width, height: width < 500 ? 844 : 1000, locale, touch: width < 500, motion: 'no-preference',
}))));
export const CONTROL_MATRIX = Object.freeze({mobile: ['help', 'key-terms', 'map'], desktop: ['key-terms', 'map'],
  desktopHelp: 'Not exposed by existing Focus policy; not tested or forced.',
  unavailablePages: 'Map availability is checked, but unavailable pages are never activated.'});
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const readJson = async file => JSON.parse(await readFile(path.resolve(ROOT, file), 'utf8'));
const binding = async file => {const b = await readFile(path.resolve(ROOT, file)); return {path: file, bytes: b.length, sha256: hash(b)};};
const pageId = n => `shared-nms002-l01-p${String(n).padStart(3, '0')}`;
const ui = (page, key) => page.locator(`${HOST} button[data-responsive-focus-key="${key}"]:visible`).first();
export function parseArgs(args) {
  const values = {};
  for (let i = 0; i < args.length; i += 2) {
    assert.ok(['--run', '--registry-sha256', '--freeze-sha256', '--fragment-sha256', '--activation-sha256', '--only-case'].includes(args[i]));
    assert.equal(values[args[i]], undefined); assert.ok(args[i + 1]); values[args[i]] = args[i + 1];
  }
  assert.match(values['--run'] ?? '', /^[a-z0-9-]+$/u);
  for (const key of ['registry', 'freeze', 'fragment', 'activation']) assert.match(values[`--${key}-sha256`] ?? '', /^[a-f0-9]{64}$/u);
  if (values['--only-case']) assert.ok(CASES.some(c => c.name === values['--only-case']));
  return values;
}
export function allowedRequest(raw, websocket = false) {
  const url = new URL(raw);
  if (websocket) return url.origin === 'ws://127.0.0.1:3324' && url.pathname.startsWith('/_next/');
  return url.origin === BASE && (/^\/(?:en\/|es\/)?migration-status\/g678-calibration(?:\/shared-nms002-l01-p(?:041|042|043))?$/u.test(url.pathname) ||
    /^\/(?:_next\/|flash-assets\/)/u.test(url.pathname) || ['/favicon.ico', '/learning-theme-bootstrap.js', '/__nextjs_original-stack-frames'].includes(url.pathname));
}
export function decodeObservedGlossary(value) {
  const entities = {'&#x003C;': '<', '&#x00B0;': '°', '&#x00B3;': '³', '&#x2260;': '≠', '&#x2264;': '≤', '&#x2265;': '≥', '&gt;': '>', '&quot;': '"'};
  assert.equal(typeof value, 'string');
  return value.trim().replace(/&(?:#\d+|#x[a-f0-9]+|[a-z]+);/giu, entity => {assert.ok(Object.hasOwn(entities, entity), 'Unreviewed glossary entity'); return entities[entity];});
}
export function viewportIsUnobstructed({top, bottom, offset, height, width, scrollY, documentHeight, points}) {
  if (![top, bottom, offset, height, width, scrollY, documentHeight].every(Number.isFinite) || height <= 0 || width <= 0 || scrollY < 0) return false;
  const maximumScroll = Math.max(0, documentHeight - height), atDocumentEnd = scrollY >= maximumScroll - 1 && scrollY <= maximumScroll + 1;
  // A complete panel may have less than the preferred20px camera margin when
  // document scrolling is clamped. This does not permit clipping or occlusion.
  const bottomLimit = atDocumentEnd ? height : height - 20;
  return top >= Math.max(0, offset - 1) && bottom >= top && bottom <= bottomLimit &&
    points.length === 5 && points.every(p => p.unobstructed && p.x >= 0 && p.x < width && p.y >= 0 && p.y < height);
}
// Runs in the browser; the only overflow exception is a proved viewport-fixed
// actual support modal. A DOM ancestor is not automatically its containing block.
export function measureActionControl(node) {
  const rect = n => {const r = n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
  const style = n => {const s=getComputedStyle(n);return {position:s.position,overflowX:s.overflowX,overflowY:s.overflowY,
    transform:s.transform,translate:s.translate,rotate:s.rotate,scale:s.scale,filter:s.filter,backdropFilter:s.backdropFilter,
    perspective:s.perspective,contain:s.contain,containerType:s.containerType,willChange:s.willChange,
    contentVisibility:s.contentVisibility,clipPath:s.clipPath,maskImage:s.maskImage,display:s.display,visibility:s.visibility,opacity:s.opacity};};
  const b=rect(node), chain=[];for(let a=node;a;a=a.parentElement)chain.push({node:a,tag:a.tagName,className:String(a.className),rect:rect(a),...style(a)});
  const modal=node.closest('.lesson-shell2__side-panel[role="dialog"][aria-modal="true"]');
  const modalIndex=chain.findIndex(c=>c.node===modal), shell=modal?.closest('.lesson-shell2[data-support-modal-open="true"]');
  const inert=Boolean(node.closest('[inert]')), hidden=Boolean(node.closest('[aria-hidden="true"]')) || chain.some(c=>c.display==='none'||c.visibility!=='visible'||Number(c.opacity)===0);
  const fullViewport=b.width>0&&b.height>0&&b.left>=0&&b.top>=0&&b.right<=innerWidth&&b.bottom<=innerHeight;
  const dx=Math.min(4,b.width/4),dy=Math.min(4,b.height/4);
  const points=[[b.left+dx,b.top+dy],[b.right-dx,b.top+dy],[(b.left+b.right)/2,(b.top+b.bottom)/2],[b.left+dx,b.bottom-dy],[b.right-dx,b.bottom-dy]]
    .map(([x,y])=>({x,y,unobstructed:x>=0&&x<innerWidth&&y>=0&&y<innerHeight&&node.contains(document.elementFromPoint(x,y))}));
  const neutral=c=>['transform','translate','rotate','scale','filter','backdropFilter','perspective','clipPath','maskImage'].every(k=>c[k]==='none')&&
    c.contain==='none'&&c.containerType==='normal'&&c.willChange==='auto'&&c.contentVisibility==='visible';
  const viewportFixedModal=Boolean(modal&&shell&&modalIndex>0&&chain[modalIndex].position==='fixed'&&
    chain.slice(modalIndex).every(neutral)&&fullViewport&&points.every(p=>p.unobstructed)&&!inert&&!hidden);
  const clips=[],ignoredOuterOverflow=[];
  for(let i=1;i<chain.length;i++) {const c=chain[i], r=c.rect;
    const modes=viewportFixedModal&&i<=modalIndex?['hidden','clip','auto','scroll']:['hidden','clip'];
    const outside=modes.includes(c.overflowX)&&(b.left<r.left-1||b.right>r.right+1)||modes.includes(c.overflowY)&&(b.top<r.top-1||b.bottom>r.bottom+1);
    if(outside) (viewportFixedModal&&i>modalIndex?ignoredOuterOverflow:clips).push(c.className||c.tag);
  }
  return {clips,inert,hidden,top:scrollY+b.top,height:b.height,width:b.width,rect:b,fullViewport,points,viewportFixedModal,ignoredOuterOverflow,
    fixedModalChain:modal?chain.map(({node:unused,...c})=>c):undefined};
}
export function actionControlHasValidHit(measured) {
  // Ordinary circular controls use their actual center target, as before this
  // modal correction. Only the fixed-modal exception demands rectangular corners.
  return measured.fullViewport && measured.points.length===5 && (measured.fixedModalChain
    ? measured.points.every(p=>p.unobstructed) : measured.points[2].unobstructed);
}
export function validate378({registry, registryBinding, freeze, fragment, activation, authority, runBinding, priorFreeze, priorFragment}) {
  assert.equal(fragment.freeze.path, `${PREFIX}.json`); assert.equal(fragment.calibration.freezeManifest, `${PREFIX}.json`);
  assert.equal(fragment.calibration.entries.length, 378); assert.equal(freeze.selectedPages.length, 378);
  assert.deepEqual(fragment.calibration.entries.filter(e => e.key !== ID), priorFragment.calibration.entries, 'Only p042 may be added to377');
  assert.deepEqual(freeze.selectedPages.filter(e => e.animationId !== ID), priorFreeze.selectedPages, 'Preserve377 exact selected objects/order');
  assert.deepEqual(registry.calibrations.find(c => c.calibrationId === fragment.calibration.calibrationId), fragment.calibration);
  assert.equal(activation.registryChanged, true); assert.equal(activation.registrationCount, 378);
  assert.equal(activation.preservedPageCount, 377); assert.deepEqual(activation.proposed.registry, registryBinding);
  assert.ok(activation.acceptanceEffects && Object.values(activation.acceptanceEffects).every(value => value === false));
  assert.equal(freeze.productCalibrationPassed, false); assert.equal(fragment.productCalibrationPassed, false);
  const entry = fragment.calibration.entries.find(e => e.key === ID), source = authority.entries[0], selected = freeze.selectedPages.find(p => p.animationId === ID);
  assert.equal(authority.entries.length, 1); assert.equal(source.key, ID); assert.ok(entry && selected);
  assert.equal(entry.module, './modules/g678-nms-l01-readable-current-js-p042');
  assert.deepEqual(entry.artifacts, {kind: 'maintained-dom-module-v1', module: source.moduleFile, timeline: source.timeline, memberManifest: source.memberManifest, sourceRun: runBinding});
  assert.deepEqual(selected.runtime.rendererBinding, entry.artifacts);
  const {rendererBinding, ...runtime} = selected.runtime; assert.deepEqual(runtime, source.runtimeContract);
  assert.equal(selected.assetId, `swf-${source.source.sha256}`); assert.equal(selected.sourceSha256, source.source.sha256);
  assert.deepEqual(selected.presentation, {pageInteractionCompanionTargetIdSuffix: SUFFIX});
  assert.equal(selected.productCalibrationPassed, false); assert.equal(selected.engineeringPreviewReady, false);
  assert.deepEqual(runtime.lessonHostCapabilities, []); assert.equal(runtime.frameDomain, 'sprite-23');
  assert.equal(runtime.frameCount, 125); assert.equal(runtime.fps, 12); assert.equal(runtime.language, 'fixed-en');
  assert.equal(freeze.selectedPages.filter(p => p.stableLessonKey === 'shared-nms002-l01').length, 11);
}

async function main(args) {
  const options = parseArgs(args), cases = options['--only-case'] ? CASES.filter(c => c.name === options['--only-case']) : CASES;
  for (const [file, sha256] of Object.entries(PINS)) assert.equal((await binding(file)).sha256, sha256, `Pinned predecessor/source drift: ${file}`);
  for (const [key, file] of [['registry', REGISTRY], ['freeze', `${PREFIX}.json`], ['fragment', `${PREFIX}.fragment.json`], ['activation', `${PREFIX}.activation.json`]])
    assert.equal((await binding(file)).sha256, options[`--${key}-sha256`], `Explicit378 activation pin mismatch: ${file}`);
  const [registry, freeze, fragment, activation, authority, run, candidate, priorFreeze, priorFragment, catalog] = await Promise.all([
    REGISTRY, `${PREFIX}.json`, `${PREFIX}.fragment.json`, `${PREFIX}.activation.json`, AUTHORITY, RUN, CANDIDATE, `${PRIOR}.json`, `${PRIOR}.fragment.json`, CATALOG].map(readJson));
  validate378({registry, freeze, fragment, activation, authority, priorFreeze, priorFragment, runBinding: await binding(RUN), registryBinding: await binding(REGISTRY)});
  const files = new Set([SELF, 'scripts/qa-g678-nms-l01-p042-readable-my-lesson.test.mjs',
    'scripts/qa-g678-nms-l01-p042-readable-mounted.mjs', REGISTRY, `${PREFIX}.json`, `${PREFIX}.fragment.json`, `${PREFIX}.activation.json`,
    ...Object.keys(PINS), CATALOG, 'catalog/g678-shared-source-profile.v1.json',
    'apps/web/components/animation-runtime.tsx', 'apps/web/components/descriptor-driven-whole-lesson-player.tsx',
    'apps/web/components/legacy-responsive-lesson-shell.tsx', 'apps/web/app/globals.css',
    'apps/web/lib/g678-calibration-product-bridge.server.ts', 'apps/web/lib/g678-nms-l01-p042-companion-authority.server.ts',
    'apps/web/lib/load-animation-module.client.ts', 'packages/demos/src/registry.local-only.generated.ts',
    'packages/demos/src/registry.local-only.metadata.generated.ts', 'packages/demos/src/runtime.ts',
    'packages/demos/src/contract.ts', 'packages/demos/src/lesson-host-contract.ts']);
  for (const dependency of [fragment.freeze, authority.compilerRun, authority.baseCandidateManifest, authority.readableCandidateManifest,
    run.outputInventory, ...run.codeDependencyClosure, ...candidate.files,
    ...['moduleFile', 'timeline', 'memberManifest'].map(key => authority.entries[0][key])]) {
    assert.equal((await binding(dependency.path)).bytes, dependency.bytes); assert.equal((await binding(dependency.path)).sha256, dependency.sha256);
    files.add(dependency.path);
  }
  const lesson = catalog.lessons.find(l => l.stableLessonKey === 'shared-nms002-l01'); assert.equal(lesson.pages.length, 47);
  const selectedPages = freeze.selectedPages.filter(p => p.stableLessonKey === lesson.stableLessonKey), selectedIds = new Set(selectedPages.map(p => p.animationId));
  assert.equal(selectedIds.size, 11); for (const n of [41, 42, 43]) assert.ok(selectedIds.has(pageId(n)));
  const sourceCatalogPage = lesson.pages.find(p => p.animationId === ID); assert.equal(sourceCatalogPage.sourceSha256, authority.entries[0].source.sha256);
  const glossaryMap = new Map();
  for (const page of selectedPages) for (const term of page.glossaryEntries ?? []) {
    if (glossaryMap.has(term.id)) assert.deepEqual(glossaryMap.get(term.id), term); else glossaryMap.set(term.id, term);
  }
  assert.equal(glossaryMap.size, 20);
  const sourceText = await readFile(path.join(ROOT, VISUAL), 'utf8');
  const source = JSON.parse(sourceText.slice(sourceText.indexOf(' = ') + 3, sourceText.lastIndexOf(' as const;')));
  assert.equal(hash(source.svg), source.svgSha256);
  const inputPaths = [...files].sort(), inputs = await Promise.all(inputPaths.map(binding));
  const output = `output/playwright/g678-nms-l01-p042-readable-my-lesson-${options['--run']}`;
  await mkdir(path.join(ROOT, output)); const save = (file, data) => writeFile(path.join(ROOT, output, file), data, {flag: 'wx'});
  await save('qa-runner-source.mjs', await readFile(path.join(ROOT, SELF)));
  await save('qa-tests-source.mjs', await readFile(path.join(ROOT, 'scripts/qa-g678-nms-l01-p042-readable-my-lesson.test.mjs')));
  const evidence = {schemaVersion: 1, artifactType: 'actual378-my-lesson-p042-readable-engineering-qa', createdAt: new Date().toISOString(),
    inputs, requestedCases: cases, fullContextCount: 6, visibleControlMatrix: CONTROL_MATRIX, sourceLessonCount: 47, registeredLessonCount: 11,
    unavailableLessonCount: 36, records: [], network: [], errors: [],
    boundary: 'Actual378 official loader/registry/descriptor/modernhost. Native existing controls, no test loader, seed/state/clock injection, seek, forced unavailable navigation, or source audio opt-in.',
    observation: 'Read-only DOM MutationObserver records actual frame/paused/SVG-identity changes after page load; it does not drive the clock or product state.',
    actualMyLessonQaPassed: false, productCalibrationPassed: false, authoritativeOriginalRuntime: false, visualFidelityAccepted: false,
    audioAccepted: false, humanVisualAccepted: false, screenReaderHumanAccepted: false, ownerAccepted: false, strictComplete: false, released: false, published: false};
  let browser, page, record, step = 'launch';
  const snapshot = () => page.evaluate(({HOST, STAGE, RUNTIME, FIGURE}) => {
    const h = document.querySelector(HOST), s = document.querySelector(STAGE), r = document.querySelector(RUNTIME), f = document.querySelector(FIGURE);
    return {id: h?.getAttribute('data-current-animation-id'), placement: h?.getAttribute('data-current-placement-id'), ordinal: Number(h?.getAttribute('data-current-page')),
      hostLang: h?.querySelector('.lesson-shell2')?.getAttribute('lang'), available: h?.getAttribute('data-renderer-availability'),
      module: s?.getAttribute('data-animation-module'), frame: Number(s?.getAttribute('data-flash-frame')), domain: s?.getAttribute('data-flash-frame-domain'),
      rootFrame: Number(s?.getAttribute('data-flash-root-frame')), mathLang: s?.getAttribute('data-flash-lang'), scenario: s?.getAttribute('data-runtime-scenario'),
      paused: r?.getAttribute('data-runtime-paused'), replay: Number(r?.getAttribute('data-runtime-replay')), complete: r?.getAttribute('data-runtime-playback-complete'),
      audioAvailable: r?.getAttribute('data-audio-available'), firstSvgId: f?.querySelector('svg [id]')?.id,
      score: {attempted: Number(h?.getAttribute('data-lesson-host-fq-attempted')), points: Number(h?.getAttribute('data-lesson-host-fq-points-awarded'))},
      feedback: h?.getAttribute('data-lesson-host-practice-feedback-active'), injectedLoader: Boolean(document.querySelector('[data-test-loader]'))};
  }, {HOST, STAGE, RUNTIME, FIGURE});
  async function ready(id = ID) {
    await page.waitForFunction(({HOST, STAGE, id}) => document.querySelector(HOST)?.getAttribute('data-hydrated') === 'true' &&
      document.querySelector(HOST)?.getAttribute('data-current-animation-id') === id && document.querySelector(STAGE)?.getAttribute('data-animation-module') === id, {HOST, STAGE, id}, {timeout: 20000});
    const state = await snapshot(); assert.equal(state.injectedLoader, false); assert.equal(state.available, 'registered'); assert.equal(state.hostLang, record.locale);
    assert.equal(state.placement, id); assert.equal(state.ordinal, Number(id.slice(-3)));
    if (id === ID) {await page.locator(CONTENT).waitFor(); assert.equal(state.domain, 'sprite-23'); assert.equal(state.rootFrame, 6); assert.equal(state.mathLang, 'en');
      assert.equal(state.scenario, 'nms-l01-p042-source-static-frame'); assert.equal(state.audioAvailable, 'false');}
    else {
      assert.equal(await page.locator(CONTENT).count(), 0, 'Stale p042 companion after source-ordered navigation');
      await page.waitForFunction(({STAGE, id}) => {const canvas = document.querySelector(`${STAGE} canvas[data-course-canvas="${id}"]`);
        return canvas && ['ready', 'updating'].includes(canvas.closest('[data-canvas-status]')?.getAttribute('data-canvas-status')) && canvas.width > 0 && canvas.height > 0;
      }, {STAGE, id}, {timeout: 20000});
    }
    return state;
  }
  const shot = async (label, fullPage = true) => {const bytes = await page.screenshot({fullPage}), filename = `${record.name}-${String(record.screenshots.length + 1).padStart(2, '0')}-${label}.png`;
    await save(filename, bytes); record.screenshots.push({path: `${output}/${filename}`, bytes: bytes.length, sha256: hash(bytes), capture: fullPage ? 'full-page' : 'viewport'});};
  // Native activation is allowed only after checking clipping and an actual hit.
  async function act(locator) {
    await locator.waitFor({state: 'visible'}); assert.equal(await locator.count(), 1); assert.equal(await locator.isDisabled(), false);
    const before = await locator.evaluate(measureActionControl);
    record.controlChecks ??= []; record.controlChecks.push({step, phase:'before-scroll',geometry:before});
    assert.deepEqual(before.clips, []); assert.equal(before.inert, false); assert.equal(before.hidden, false);
    assert.ok(before.width>0&&before.height>0);
    if (!before.viewportFixedModal) await page.evaluate(({top, height}) => window.scrollTo({top: Math.max(0, top - Math.max(24, (innerHeight - height) / 2)), behavior: 'instant'}), before);
    const after = await locator.evaluate(measureActionControl);record.controlChecks.push({step,phase:'before-activation',geometry:after});
    assert.deepEqual(after.clips,[]);assert.equal(after.inert,false);assert.equal(after.hidden,false);
    assert.equal(after.fullViewport,true,'Actual control not fully in viewport');assert.ok(actionControlHasValidHit(after),'Actual control obscured before activation');
    const hit={x:after.width/2,y:after.height/2};
    record.actions.push({step, label: await locator.getAttribute('aria-label') ?? await locator.innerText(), input: record.touch ? 'touch' : 'mouse', before});
    if (record.touch) await locator.tap({position: {x: hit.x, y: hit.y}}); else await locator.click({position: {x: hit.x, y: hit.y}});
  }
  async function pause(desired) {
    if ((await snapshot()).paused !== String(desired)) await act(ui(page, 'pause'));
    await page.waitForFunction(({RUNTIME, desired}) => document.querySelector(RUNTIME)?.getAttribute('data-runtime-paused') === String(desired), {RUNTIME, desired});
  }
  async function geometry(label) {
    const result = await page.locator(CONTENT).evaluate(content => {
      const box = n => {const b = n.getBoundingClientRect(); return {left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width, height: b.height};};
      const host = content.closest('[data-lesson-player]'), source = host.querySelector('[data-p042-readable-source-plane]'), figure = source.querySelector('figure'), svg = figure.querySelector('svg');
      const slot = content.closest('[data-page-interaction-companion-host]'), column = source.closest('.lesson-shell2__learning-column');
      const idNodes = [...host.querySelectorAll('svg [id], [data-p042-readable-content] [id]')], byId = new Map(), badReferences = [];
      for (const n of idNodes) {const values = byId.get(n.id) ?? []; values.push(n); byId.set(n.id, values);}
      for (const s of host.querySelectorAll('svg')) for (const n of [s, ...s.querySelectorAll('*')]) for (const a of n.attributes) {
        const refs = [...a.value.matchAll(/url\(#([^)]*)\)/gu)].map(m => m[1]); if (['href', 'xlink:href'].includes(a.name) && a.value.startsWith('#')) refs.push(a.value.slice(1));
        for (const id of refs) {const targets = byId.get(id) ?? []; if (targets.length !== 1 || targets[0].closest('svg') !== s) badReferences.push({id, count: targets.length});}
      }
      const style = getComputedStyle(content);
      return {viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, source: box(figure), content: box(content),
        sourceHiddenFromAT: source.getAttribute('aria-hidden'), sourceDrawing: figure.getAttribute('data-source-drawing-sha256'),
        rawSvg: svg.outerHTML, firstSvgId: svg.querySelector('[id]').id, language: content.lang,
        placement: content.getAttribute('data-companion-placement'), slot: slot ? {id: slot.id, unique: [...document.querySelectorAll('[id]')].filter(n => n.id === slot.id).length,
          correctColumn: slot.parentElement === column && slot.closest('.lesson-shell2__learning-column') === column,
          marker: slot.getAttribute('data-page-interaction-companion-host'), outsideRuntime: !slot.closest('.runtime-stage')} : null,
        contents: host.querySelectorAll('[data-p042-readable-content]').length, fallbacks: host.querySelectorAll('[data-p042-readable-fallback]').length,
        controls: content.querySelectorAll('button,a[href],input,select,[role="button"],[tabindex]').length,
        sourceControls: figure.querySelectorAll('button,a[href],input,[role="button"]').length, media: host.querySelectorAll('audio,video').length,
        colour: style.color, background: style.backgroundColor, orderedLists: content.querySelectorAll('ol').length,
        labelledBy: content.getAttribute('aria-labelledby'), headingId: content.querySelector('h2').id,
        duplicateIds: [...byId].filter(([, values]) => values.length > 1).map(([id]) => id), badReferences,
        text: [...content.querySelectorAll('h2, ol > li')].map(n => {const b = box(n), style = getComputedStyle(n), clips = [];
          for (let a = n.parentElement; a && a !== document.body; a = a.parentElement) {const r = box(a), s = getComputedStyle(a);
            if (['hidden', 'clip'].includes(s.overflowX) && (b.left < r.left - 1 || b.right > r.right + 1) || ['hidden', 'clip'].includes(s.overflowY) && (b.top < r.top - 1 || b.bottom > r.bottom + 1)) clips.push(String(a.className));}
          return {text: n.textContent, id: n.getAttribute('data-source-literal-character-id'), font: parseFloat(style.fontSize), line: parseFloat(style.lineHeight), box: b, clips, scrollWidth: n.scrollWidth, clientWidth: n.clientWidth};})};
    });
    assert.equal(result.contents, 1); assert.equal(result.fallbacks, 0); assert.equal(result.placement, 'portal'); assert.ok(result.slot);
    assert.ok(result.slot.id.endsWith(`-${SUFFIX}`)); assert.equal(result.slot.unique, 1); assert.equal(result.slot.correctColumn, true);
    assert.equal(result.slot.outsideRuntime, true); assert.equal(result.slot.marker, 'true'); assert.equal(result.sourceHiddenFromAT, 'true');
    assert.equal(result.language, 'en'); assert.equal(result.controls, 0); assert.equal(result.sourceControls, 0); assert.equal(result.media, 0);
    assert.equal(result.sourceDrawing, source.svgSha256); assert.deepEqual(result.duplicateIds, []); assert.deepEqual(result.badReferences, []);
    assert.equal(result.orderedLists, 1); assert.equal(result.labelledBy, result.headingId); assert.ok(result.documentWidth <= result.viewport + 1);
    assert.ok(Math.abs(result.source.width / result.source.height - 4 / 3) < .01); assert.ok(result.source.bottom <= result.content.top + 1);
    assert.deepEqual(result.text.map(t => t.text), [source.literalTitle, ...source.literalSteps]); assert.deepEqual(result.text.slice(1).map(t => t.id), ['16', '18', '20', '22']);
    for (const t of result.text) {assert.ok(t.font >= 20); assert.ok(t.line >= t.font * 1.5 - .1); assert.deepEqual(t.clips, []); assert.ok(t.scrollWidth <= t.clientWidth + 1);}
    result.contrastRatio = contrastRatio(result.colour, result.background); assert.ok(result.contrastRatio >= 4.5);
    const expected = await page.evaluate(svg => {const t = document.createElement('template'); t.innerHTML = svg; const s = t.content.querySelector('svg'); return {raw: s.outerHTML, firstId: s.querySelector('[id]').id};}, source.svg);
    assert.ok(result.firstSvgId.endsWith(expected.firstId)); const parsed = reverseInstanceNamespace(result.rawSvg, result.firstSvgId.slice(0, -expected.firstId.length));
    assert.equal(parsed, expected.raw); result.parsedSvgSha256 = hash(parsed); delete result.rawSvg;
    record.geometry.push({label, ...result}); record.accessibility.push({label, snapshot: await page.locator(CONTENT).ariaSnapshot()});
    return result;
  }
  async function viewportNative() {
    const chrome = await page.evaluate(() => [...document.querySelectorAll('header')].map(n => {const s = getComputedStyle(n), b = n.getBoundingClientRect();
      return {position: s.position, visible: s.display !== 'none' && s.visibility !== 'hidden', top: b.top, bottom: b.bottom, width: b.width};})
      .filter(n => n.visible && ['fixed', 'sticky'].includes(n.position) && n.top >= -1 && n.top <= 20 && n.width > innerWidth / 2));
    const offset = Math.ceil(Math.max(0, ...chrome.map(c => c.bottom))) + 16;
    const box = await page.locator(CONTENT).evaluate(n => {const b = n.getBoundingClientRect(); return {top: scrollY + b.top, height: b.height};});
    assert.ok(box.height <= record.height - offset - 24, 'Readable content does not fit the bounded unobstructed viewport');
    await page.evaluate(({top, offset}) => window.scrollTo({top: Math.max(0, top - offset), behavior: 'instant'}), {top: box.top, offset});
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const observed = await page.locator(CONTENT).evaluate(n => {const b = n.getBoundingClientRect();
      const points = [[b.left + 5, b.top + 5], [b.right - 5, b.top + 5], [b.left + b.width / 2, b.top + b.height / 2], [b.left + 5, b.bottom - 5], [b.right - 5, b.bottom - 5]];
      return {top: b.top, bottom: b.bottom, scrollY, documentHeight: document.documentElement.scrollHeight,
        points: points.map(([x, y]) => ({x, y, unobstructed: n.contains(document.elementFromPoint(x, y))}))};});
    record.viewport = {chrome, offset, width: record.width, height: record.height, ...observed};
    record.viewport.atDocumentEnd = observed.scrollY >= Math.max(0, observed.documentHeight - record.height) - 1;
    record.viewport.unobstructedChecksPassed = viewportIsUnobstructed(record.viewport);
    await shot('native-literal-viewport', false);
    assert.ok(record.viewport.unobstructedChecksPassed, 'Native viewport is clipped, header-obscured, or not fully hit-visible');
  }
  async function footerReplay(label) {
    step = `${record.name}-${label}`; const before = await snapshot(), oldStage = await page.locator(STAGE).elementHandle();
    await act(ui(page, 'replay')); await page.waitForFunction(element => !element.isConnected, oldStage, {timeout: 15000});
    const after = await ready(); assert.notEqual(after.firstSvgId, before.firstSvgId, 'Footer Replay did not remount the actual source renderer');
    assert.equal(after.feedback, 'false'); assert.deepEqual(after.score, {attempted: 0, points: 0});
    record.replays.push({label, before, after, previousRuntimeDetached: true}); await oldStage.dispose(); return after.firstSvgId;
  }
  async function installObservation() {
    await page.evaluate(({HOST, FIGURE, RUNTIME}) => {
      const observations = {samples: []}; window.__NMS_P042_ROUTE_QA_OBSERVATION = observations;
      const scan = () => {const host = document.querySelector(HOST), f = document.querySelector(FIGURE), runtime = document.querySelector(RUNTIME);
        if (host?.getAttribute('data-current-animation-id') !== 'shared-nms002-l01-p042' || !f) return;
        const sample = {frame: Number(f.getAttribute('data-source-main-frame')), paused: runtime.getAttribute('data-runtime-paused'),
          identity: f.querySelector('svg [id]')?.id, at: performance.now()};
        const previous = observations.samples.at(-1);
        if (!previous || previous.frame !== sample.frame || previous.paused !== sample.paused || previous.identity !== sample.identity) observations.samples.push(sample);
      };
      scan(); new MutationObserver(scan).observe(document.querySelector(HOST), {childList: true, subtree: true, attributes: true,
        attributeFilter: ['data-source-main-frame', 'data-runtime-paused']});
    }, {HOST, FIGURE, RUNTIME});
  }
  async function naturalClock() {
    await pause(true); await installObservation(); const identity = await footerReplay('first-natural-footer-replay');
    await page.waitForFunction(FIGURE => Number(document.querySelector(FIGURE)?.getAttribute('data-source-main-frame')) >= 18, FIGURE, {timeout: 5000});
    await pause(true); await page.waitForTimeout(100); const held = await snapshot();
    await page.waitForTimeout(600); assert.deepEqual(await snapshot(), held, 'Actual host Pause did not hold source/runtime state');
    await act(page.locator(`${CONTENT} li`).first()); assert.deepEqual(await snapshot(), held, 'Literal content performed an invented action');
    await geometry('paused-native-literal-has-zero-actions'); await pause(false);
    await page.waitForFunction(({FIGURE, RUNTIME}) => document.querySelector(FIGURE)?.getAttribute('data-source-main-frame') === '125' &&
      document.querySelector(RUNTIME)?.getAttribute('data-runtime-playback-complete') === 'true', {FIGURE, RUNTIME}, {timeout: 15000});
    const terminal = await snapshot(); await page.waitForTimeout(650); assert.deepEqual(await snapshot(), terminal, 'Source terminal advanced after125');
    const samples = await page.evaluate(identity => window.__NMS_P042_ROUTE_QA_OBSERVATION.samples.filter(s => s.identity === identity), identity);
    const end = samples.findIndex(s => s.frame === 125); assert.ok(end > 0); assert.equal(samples[0].frame, 1);
    let activeMs = 0; for (let i = 1; i <= end; i++) {
      assert.ok(samples[i].frame >= samples[i - 1].frame && samples[i].frame <= 125);
      if (samples[i - 1].paused === 'false') activeMs += samples[i].at - samples[i - 1].at;
    }
    assert.ok(activeMs >= 10000 && activeMs <= 12000, 'Observed unpaused clock is inconsistent with12fps1→125');
    record.natural = {identity, activeMs, expectedMs: 124 * 1000 / 12, actuallyObservedFrames: [...new Set(samples.slice(0, end + 1).map(s => s.frame))], samples, terminal};
    await geometry('natural-terminal125'); await shot('natural-terminal');
    await footerReplay('second-deterministic-footer-replay');
    await page.waitForFunction(FIGURE => Number(document.querySelector(FIGURE)?.getAttribute('data-source-main-frame')) >= 4, FIGURE);
    await pause(true); const restarted = await snapshot(); assert.ok(restarted.frame < 125); assert.equal(restarted.complete, 'false');
    record.replayRestartState = restarted; await geometry('footer-replay-reset-and-advancing');
  }
  async function mapRows(panel) {
    const rows = await panel.locator('button[data-placement-id]').evaluateAll(nodes => nodes.map(n => ({id: n.getAttribute('data-placement-id'),
      animationId: n.getAttribute('data-animation-id'), availability: n.getAttribute('data-renderer-availability'), disabled: n.disabled})));
    assert.deepEqual(rows.map(r => r.id), lesson.pages.map(p => p.placementId));
    for (const row of rows) {assert.equal(row.animationId, row.id); assert.equal(row.availability, selectedIds.has(row.id) ? 'registered' : 'unavailable');}
    assert.equal(rows.filter(r => r.availability === 'registered').length, 11); assert.equal(rows.filter(r => r.availability === 'unavailable').length, 36);
    return rows;
  }
  async function support() {
    const keys = record.width < 500 ? CONTROL_MATRIX.mobile : CONTROL_MATRIX.desktop;
    for (const key of keys) {
      step = `${record.name}-actual-${key}`; await pause(false); await geometry(`before-${key}`);
      const trigger = ui(page, key); assert.equal(await trigger.isVisible(), true); const panelId = await trigger.getAttribute('aria-controls'); assert.ok(panelId);
      const before = await snapshot(); await act(trigger);
      const panel = page.locator(`[id=${JSON.stringify(panelId)}]`); await panel.waitFor({state: 'visible'});
      await page.waitForFunction(RUNTIME => document.querySelector(RUNTIME)?.getAttribute('data-runtime-paused') === 'true', RUNTIME);
      await page.waitForTimeout(100); const opened = await snapshot(); await page.waitForTimeout(350); assert.equal((await snapshot()).frame, opened.frame);
      const modal = await page.locator(`${HOST} .lesson-shell2`).getAttribute('data-support-modal-open') === 'true';
      const containment = await page.locator(CONTENT).evaluate(n => ({inert: Boolean(n.closest('[inert]')), hidden: Boolean(n.closest('[aria-hidden="true"]')),
        placement: n.getAttribute('data-companion-placement'), count: document.querySelectorAll('[data-p042-readable-content]').length,
        fallbackCount: document.querySelectorAll('[data-p042-readable-fallback]').length, slotId: n.closest('[data-page-interaction-companion-host]')?.id}));
      assert.equal(containment.placement, 'portal'); assert.equal(containment.count, 1); assert.equal(containment.fallbackCount, 0);
      assert.ok(containment.slotId.endsWith(`-${SUFFIX}`)); if (modal) {assert.equal(containment.inert, true); assert.equal(containment.hidden, true);}
      const details = {key, before, opened, modal, containment};
      if (key === 'key-terms') {
        const terms = panel.locator('[data-key-terms-authority="source-bound-g678-bilingual-keyterms-xml"]'); await terms.waitFor();
        const actual = await terms.locator('dl > div').evaluateAll(nodes => nodes.map(n => [n.querySelector('dt').textContent.trim(), n.querySelector('dd').textContent.trim()]));
        const expected = [...glossaryMap.values()].map(e => [decodeObservedGlossary(e.labels[record.locale]), decodeObservedGlossary(e.definitions[record.locale])]);
        assert.equal(actual.length, 20); assert.deepEqual(actual.map(JSON.stringify).sort(), expected.map(JSON.stringify).sort());
        assert.match(await terms.innerText(), new RegExp(record.locale === 'es' ? 'L1KTS01' : 'L1KTE01')); details.glossary = actual;
      } else if (key === 'map') details.rows = await mapRows(panel);
      else assert.ok((await panel.innerText()).trim().length > 0);
      if (modal) for (let i = 0; i < 6; i++) {await page.keyboard.press(i % 2 ? 'Shift+Tab' : 'Tab');
        assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest('[data-p042-readable-content], [data-p042-readable-fallback], [data-p042-readable-source-plane]'))), false);}
      await shot(`${key}-${modal ? 'modal' : 'rail'}`);
      const close = key === 'map' ? page.locator(`${HOST} [data-course-map-close-control]:visible`).first() : panel.getByRole('button', {name: record.locale === 'es' ? 'Cerrar herramienta' : 'Close tool', exact: true});
      await act(close);
      await page.waitForFunction(key => document.activeElement?.getAttribute('data-responsive-focus-key') === key, key);
      await page.waitForFunction(RUNTIME => document.querySelector(RUNTIME)?.getAttribute('data-runtime-paused') === 'false', RUNTIME);
      details.after = await snapshot(); details.focusReturned = true; record.support.push(details); await geometry(`after-${key}`);
    }
  }
  async function navigateNeighbours() {
    // The preceding Map check proves the source47/available11 matrix. Adjacent
    // footer controls exercise actual source order without forcing a deep or
    // unavailable Map item into view.
    step = `${record.name}-source-ordered-neighbours`;
    await act(ui(page, 'previous')); await ready(pageId(41)); record.navigation.push({control: 'previous-to-source-p041', state: await snapshot()});
    for (const [key, target] of [['next', 42], ['next', 43], ['previous', 42], ['previous', 41], ['next', 42]]) {
      const before = await snapshot(); assert.ok(selectedIds.has(pageId(target))); await act(ui(page, key)); await ready(pageId(target));
      record.navigation.push({control: key, before, after: await snapshot()}); if (target === 42) await geometry(`returned-p042-from-${before.id}`);
    }
    assert.equal((await snapshot()).id, ID); await shot('source-ordered-neighbours-returned-p042');
  }
  try {
    browser = await chromium.launch({headless: true}); evidence.browser = {version: browser.version(), executable: await binding(chromium.executablePath())};
    for (const config of cases) {
      record = {...config, status: 'running', errors: [], screenshots: [], geometry: [], accessibility: [], actions: [], replays: [], support: [], navigation: []}; evidence.records.push(record);
      const context = await browser.newContext({viewport: {width: config.width, height: config.height}, hasTouch: config.touch, reducedMotion: 'no-preference', serviceWorkers: 'block'});
      await context.route('**/*', async route => {const request = route.request(), raw = request.url(), allowed = allowedRequest(raw);
        evidence.network.push({case: record.name, step, url: raw, method: request.method(), allowed, external: new URL(raw).origin !== BASE});
        if (allowed) await route.continue(); else await route.abort('blockedbyclient');});
      await context.routeWebSocket('**/*', socket => {const raw = socket.url(), allowed = allowedRequest(raw, true);
        evidence.network.push({case: record.name, step, url: raw, method: 'WEBSOCKET', allowed, external: new URL(raw).origin !== 'ws://127.0.0.1:3324'});
        if (allowed) socket.connectToServer(); else socket.close();});
      page = await context.newPage(); page.setDefaultTimeout(15000);
      const error = text => {record.errors.push(text); evidence.errors.push({case: record.name, error: text});};
      page.on('pageerror', value => error(value.message)); page.on('console', message => {if (message.type() === 'error') error(message.text());});
      page.on('response', response => {if (response.status() >= 400) error(`HTTP ${response.status()} ${response.url()}`);});
      step = `${record.name}-actual378-navigation`;
      const response = await page.goto(`${BASE}/${record.locale}/migration-status/g678-calibration/${ID}`, {waitUntil: 'networkidle', timeout: 45000});
      assert.equal(response.status(), 200); assert.match(response.headers()['x-robots-tag'] ?? await page.locator('meta[name="robots"]').getAttribute('content') ?? '', /noindex/u);
      await ready(); await geometry('initial-official-native-and-source'); await shot('initial-full-page'); await viewportNative();
      await naturalClock(); console.log(json({case: record.name, step: 'natural125-pause-footerReplay-passed'}));
      await support(); await navigateNeighbours(); record.final = await snapshot();
      assert.deepEqual(record.errors, []); assert.equal(evidence.network.some(r => r.case === record.name && !r.allowed), false);
      assert.equal(evidence.network.some(r => r.case === record.name && /\.(?:mp3|m4a|ogg|wav)(?:\?|$)/iu.test(r.url)), false, 'Unexpected source audio request');
      record.status = 'passed'; await save(`${record.name}.json`, json(record)); await context.close();
      console.log(json({case: record.name, status: 'passed', productCalibrationPassed: false}));
    }
    evidence.status = 'actual378-p042-engineering-qa-passed';
  } catch (error) {
    evidence.status = 'actual378-p042-engineering-qa-failed'; evidence.failure = {step, message: error.message, stack: error.stack};
    if (record) record.status = 'failed';
    if (page && !page.isClosed()) {evidence.failure.state = await snapshot().catch(() => null); await shot('failed-state'); await save(`${record.name}-failure.html`, await page.content());}
    console.error(json(evidence.failure));
  } finally {
    if (browser) await browser.close();
    evidence.inputsAfter = await Promise.all(inputPaths.map(binding)); evidence.inputsUnchanged = JSON.stringify(evidence.inputsAfter) === JSON.stringify(inputs);
    evidence.externalRequestCount = evidence.network.filter(r => r.external).length;
    evidence.blockedSameOriginCount = evidence.network.filter(r => !r.allowed && !r.external).length;
    evidence.actualMyLessonQaPassed = evidence.status === 'actual378-p042-engineering-qa-passed' && evidence.records.length === cases.length && evidence.records.every(r => r.status === 'passed') &&
      evidence.inputsUnchanged && evidence.errors.length === 0 && evidence.network.every(r => r.allowed);
    if (!evidence.actualMyLessonQaPassed) evidence.status = 'actual378-p042-engineering-qa-failed';
    evidence.fullSixContextMatrixPassed = evidence.actualMyLessonQaPassed && cases.length === 6;
    evidence.completedAt = new Date().toISOString(); await save('evidence.json', json(evidence));
    console.log(json({output, status: evidence.status, contexts: evidence.records.length, fullSixContextMatrixPassed: evidence.fullSixContextMatrixPassed,
      inputsUnchanged: evidence.inputsUnchanged, externalRequests: evidence.externalRequestCount, productCalibrationPassed: false}));
  }
  process.exitCode = evidence.actualMyLessonQaPassed ? 0 : 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.slice(2).join(' ') === '--help') console.log('After separate378 activation + restarted-server GO: node scripts/qa-g678-nms-l01-p042-readable-my-lesson.mjs --run <exclusive> --registry-sha256 <sha> --freeze-sha256 <sha> --fragment-sha256 <sha> --activation-sha256 <sha> [--only-case <370-en|370-es|390-en|390-es|1440-en|1440-es>]');
  else await main(process.argv.slice(2));
}
