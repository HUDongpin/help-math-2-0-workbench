#!/usr/bin/env node
// Actual registered My Lesson only. Coordinator starts/authorizes the server.
// No fixture loader, injected module/host, fake clock, style override or hidden
// overflow-ancestor scrolling is used by this runner.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'http://127.0.0.1:3324';
const args = process.argv.slice(2);
assert.ok(args.length === 4 && args[0] === '--run' && /^[a-z0-9-]+$/.test(args[1]) &&
  args[2] === '--activated-registry-sha256' && /^[a-f0-9]{64}$/.test(args[3]),
  'After server GO only: --run <exclusive-name> --activated-registry-sha256 <approved-v3-sha>');
const OUTPUT = `output/playwright/g678-feedback-host-score-my-lesson-${args[1]}`;
const HOST = '[data-lesson-player][data-current-animation-id]';
const RUNTIME = `${HOST} .runtime-shell[data-runtime-transport]`;
const STAGE = `${HOST} .runtime-stage[data-animation-module]`;
const P034 = 'shared-alg001-l11-p034', P044 = 'shared-alg001-l11-p044';
const FEEDBACK = `${STAGE} [data-p034-feedback-successor="v1"]`;
const SCORE = `${STAGE} [data-host-score-successor="g678-alg-l11-p044-host-score-v1"]`;
const FREEZE = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v3.json';
const FRAGMENT = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v3.fragment.json';
const ACTIVATION = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v3.activation.json';
const REGISTRY = 'packages/demos/private-current-js-registry.json';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const readJson = async file => JSON.parse(await readFile(path.resolve(ROOT, file), 'utf8'));
async function binding(file) {
  const absolute = path.resolve(ROOT, file), info = await lstat(absolute, {bigint: true});
  assert.ok(info.isFile() && !info.isSymbolicLink() && info.nlink === 1n);
  const bytes = await readFile(absolute), after = await lstat(absolute, {bigint: true});
  for (const key of ['ino', 'dev', 'size', 'mtimeNs']) assert.equal(info[key], after[key], `Input read drift: ${file}`);
  return {path: file, bytes: bytes.length, sha256: sha(bytes)};
}
const pinned = async (file, hash) => assert.equal((await binding(file)).sha256, hash, `Approved input drift: ${file}`);
await pinned(FREEZE, 'c0e02b23fde786d5399ab6d49d203e7873345439fd05699ee788191c1d66fe93');
await pinned(FRAGMENT, 'fb9e37cc96cc00cb99606c6c6ed38394cbf0118c54630241202c3feac469e9b7');
await pinned(ACTIVATION, '5552d2e281733e780a201e30913371106a3ba7b3667d74516ed928fa41ff02c0');
assert.equal(args[3], '16739e3db4ff80febb5fd69053892b8d8cb77a28047774cb7a19d7d3fafe5eb3');
await pinned(REGISTRY, args[3]);
const [freeze, fragment, registry, activation] = await Promise.all([FREEZE, FRAGMENT, REGISTRY, ACTIVATION].map(readJson));
assert.deepEqual(registry.calibrations.find(c => c.calibrationId === freeze.calibrationId), fragment.calibration);
assert.equal(activation.changedModuleCount, 2); assert.equal(activation.preservedPageCount, 375);
assert.equal(activation.proposed.registry.sha256, args[3]);
const byId = new Map(freeze.selectedPages.map(page => [page.animationId, page]));
const critical = new Set([FREEZE, FRAGMENT, ACTIVATION, REGISTRY,
  'scripts/qa-g678-feedback-host-score-my-lesson.mjs', 'scripts/run-g678-feedback-host-score-local-preview.mjs',
  'scripts/prepare-g678-alg-l11-feedback-host-score-registration.mjs', 'scripts/activate-g678-alg-l11-feedback-host-score-registration.mjs',
  'apps/web/app/[locale]/migration-status/g678-calibration/[placementId]/page.tsx',
  'apps/web/lib/g678-calibration-product-bridge.server.ts', 'apps/web/lib/g678-instructional-behavior-delta-authority.server.ts',
  'apps/web/lib/g678-shared-course-catalog.server.ts', 'apps/web/lib/load-animation-module.client.ts',
  'apps/web/lib/whole-lesson-player-descriptor.ts', 'apps/web/lib/whole-lesson-host-presentation.ts',
  'apps/web/components/descriptor-driven-whole-lesson-player.tsx', 'apps/web/components/legacy-responsive-lesson-shell.tsx',
  'apps/web/components/animation-runtime.tsx', 'apps/web/app/globals.css', 'apps/web/public/learning-theme-bootstrap.js',
  'apps/web/i18n/routing.ts', 'packages/demos/src/contract.ts', 'packages/demos/src/runtime.ts',
  'packages/demos/src/lesson-host-contract.ts', 'packages/demos/src/registry.generated.ts',
  'packages/demos/src/registry.metadata.generated.ts', 'packages/demos/src/registry.local-only.generated.ts',
  'packages/demos/src/registry.local-only.metadata.generated.ts',
  'catalog/g678-alg-l11-advanced3-tranche-d-audit-v1.json']);
const verified = new Map();
async function verifyFile(item) {
  assert.deepEqual(await binding(item.path), item, `Dynamic artifact drift: ${item.path}`);
  critical.add(item.path); verified.set(item.path, item);
}
for (const id of [P034, P044]) {
  const page = byId.get(id), artifacts = page.runtime.rendererBinding;
  assert.equal(artifacts.kind, 'maintained-dom-module-v1');
  for (const [kind, item] of Object.entries(artifacts)) if (kind !== 'kind') await verifyFile(item);
  const run = await readJson(artifacts.sourceRun.path);
  await verifyFile(run.outputInventory);
  for (const item of (await readJson(run.outputInventory.path)).files) await verifyFile(item);
  for (const item of run.codeDependencyClosure) await verifyFile(item);
  const member = await readJson(artifacts.memberManifest.path);
  assert.deepEqual(member.runtimeContract, Object.fromEntries(Object.entries(page.runtime).filter(([key]) => key !== 'rendererBinding')));
  for (const item of member.instructionalInputs) {
    await verifyFile(item);
    const sourceManifest = await readJson(item.path);
    for (const sourceFile of sourceManifest.files) await verifyFile(sourceFile);
    await verifyFile(sourceManifest.validation.evidence);
    await verifyFile(sourceManifest.validation.receipt);
  }
}
async function generatedData(file) {
  critical.add(file);
  const text = await readFile(path.join(ROOT, file), 'utf8');
  return JSON.parse(text.slice(text.indexOf('= ') + 2).replace(/ as const;\s*$/u, ''));
}
const visuals = await generatedData('packages/demos/src/generated/g678-alg-l11-tranche-d-instructional-visuals-v1.ts');
const feedbackSource = await generatedData('packages/demos/src/generated/g678-alg-l11-p034-feedback-v1.ts');
const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;
assert.ok(sourceRoot && path.isAbsolute(sourceRoot) && await realpath(sourceRoot) === sourceRoot);
for (const id of [P034, P044]) {
  const page = byId.get(id), member = await readJson(page.runtime.rendererBinding.memberManifest.path);
  const file = path.join(sourceRoot, member.source.path), observed = await binding(file);
  assert.equal(observed.bytes, member.source.bytes); assert.equal(observed.sha256, member.source.sha256);
  assert.equal((await lstat(file)).mode & 0o222, 0); critical.add(file);
}
const inputFiles = [...critical].sort(), inputs = await Promise.all(inputFiles.map(binding));
await mkdir(path.join(ROOT, OUTPUT));
const save = (file, bytes) => writeFile(path.join(ROOT, OUTPUT, file), bytes, {flag: 'wx'});
await save('inputs.json', json(inputs));
await save('qa-runner-source.mjs', await readFile(fileURLToPath(import.meta.url)));
const records = [], network = [], errors = [];
const evidence = {artifactType: 'g678-v3-feedback-host-score-actual-my-lesson-delta-qa-v1',
  generatedAt: new Date().toISOString(), baseUrl: BASE, inputs, records, network, errors,
  scope: 'actual-registered-p034-p044-desktop-natural-mobile390-reduced',
  boundary: 'Official registered loader and actual source-ordered My Lesson host. No injected module/host, fake clock, style override or overflow-ancestor scrolling.',
  hostObservation: 'Real host DOM score aggregates and active-feedback state plus source-bound component acknowledgments; no private host hooks or raw-answer interception.',
  productCalibrationPassed: false, engineeringPreviewReady: false, authoritativeOriginalRuntime: false,
  visualFidelityAccepted: false, audioIntegrated: false, audioAccepted: false, humanVisualAccepted: false,
  ownerAccepted: false, strictComplete: false, released: false, published: false,
  remainingBlockers: ['source-stream-audio-delivery-pause-resume-and-listening-acceptance-pending',
    'mobile-mathematical-readability-and-text-alternatives-require-separate-review',
    'authoritative-original-runtime-fidelity-human-owner-acceptance-pending']};
const browser = await chromium.launch({headless: true});
evidence.browser = {version: browser.version(), executable: await binding(chromium.executablePath())};
const ui = (page, key) => page.locator(`${HOST} button[data-responsive-focus-key="${key}"]:visible`).first();

async function state(page) {
  return page.evaluate(({HOST, RUNTIME, STAGE, FEEDBACK, SCORE}) => {
    const host = document.querySelector(HOST), runtime = document.querySelector(RUNTIME), stage = document.querySelector(STAGE);
    const feedback = document.querySelector(FEEDBACK), score = document.querySelector(SCORE);
    const number = (node, attr) => Number(node?.getAttribute(attr));
    return {active: host?.getAttribute('data-current-animation-id'), hydrated: host?.getAttribute('data-hydrated'),
      module: stage?.getAttribute('data-animation-module'), domain: stage?.getAttribute('data-flash-frame-domain'),
      scenario: stage?.getAttribute('data-runtime-scenario'), frame: number(stage, 'data-flash-frame'),
      paused: runtime?.getAttribute('data-runtime-paused'), held: runtime?.getAttribute('data-runtime-interactive-stop-held'),
      resolved: number(runtime, 'data-runtime-interactive-stop-resolved-count'), complete: runtime?.getAttribute('data-runtime-playback-complete'),
      replay: number(runtime, 'data-runtime-replay'), hostFeedback: host?.getAttribute('data-lesson-host-practice-feedback-active'),
      hostScore: {attempted: number(host, 'data-lesson-host-fq-attempted'), correct: number(host, 'data-lesson-host-fq-correct'),
        awarded: number(host, 'data-lesson-host-fq-points-awarded'), possible: number(host, 'data-lesson-host-fq-points-possible')},
      feedback: feedback ? {level: number(feedback, 'data-source-level'), gate: feedback.getAttribute('data-host-feedback-gate'),
        phase: feedback.getAttribute('data-feedback-phase'), score: number(feedback, 'data-source-score'),
        pairs: number(feedback, 'data-source-completed-pair-count'), revealing: number(feedback, 'data-source-revealing-pair-count'),
        frame: number(feedback, 'data-source-feedback-frame'), visualFrame: number(feedback, 'data-source-feedback-visual-frame'),
        elapsed: number(feedback, 'data-source-feedback-elapsed'), character: feedback.getAttribute('data-source-feedback-character')} : null,
      quiz: score ? {gate: score.getAttribute('data-host-score-gate'),
        acknowledged: (score.getAttribute('data-host-acknowledged-source-questions') || '').split(',').filter(Boolean),
        completionEligible: score.getAttribute('data-host-score-completion-eligible'),
        question: document.querySelector(`${SCORE} [data-source-question]`)?.getAttribute('data-source-question'),
        selection: (document.querySelector(`${SCORE} [data-random-selection]`)?.getAttribute('data-random-selection') || '').split(',').filter(Boolean).map(Number)} : null,
      documentWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth,
      unexpectedTestLoader: Boolean(document.querySelector('[data-test-loader]')),
      unexpectedInjectedModules: ['__P034_TEST_MODULES', '__D_SCORE_MODULES', '__A7_TEST_MODULES'].some(key => key in window)};
  }, {HOST, RUNTIME, STAGE, FEEDBACK, SCORE});
}
async function shot(page, name) {const bytes = await page.screenshot({fullPage: true}); await save(`${name}.png`, bytes);
  return {path: `${OUTPUT}/${name}.png`, bytes: bytes.length, sha256: sha(bytes)};}
async function teachingShot(page,record,rootSelector,label){
  const view=await page.locator(rootSelector).evaluate(root=>{
    const before={x:scrollX,y:scrollY},rect=root.getBoundingClientRect();
    const headerHeight=[...document.querySelectorAll('header,[role="banner"]')].reduce((height,node)=>{
      const s=getComputedStyle(node),b=node.getBoundingClientRect();
      return ['sticky','fixed'].includes(s.position)&&b.top<=1&&b.bottom>0?Math.max(height,b.height):height;
    },0);
    window.scrollTo(0,Math.max(0,rect.top+scrollY-headerHeight-12));
    return{before,after:{x:scrollX,y:scrollY},headerHeight,operation:'explicit-document-scroll-to-teaching-view'};
  });
  record.geometry.push({label,phase:'teaching-screenshot-view',...view});
  const name=`${record.name}-${label}`;
  record.screenshots.push(await shot(page,name));
  const bytes=await page.screenshot({fullPage:false});await save(`${name}-viewport.png`,bytes);
  record.screenshots.push({path:`${OUTPUT}/${name}-viewport.png`,bytes:bytes.length,sha256:sha(bytes),viewportOnly:true});
}
async function geometry(locator) {
  return locator.evaluate(node => {
    const box = n => {const r = n.getBoundingClientRect(); return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    const b = box(node), ancestors = [], clipping = [];
    for (let a = node.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
      const style = getComputedStyle(a), rect = box(a);
      const item = {tag:a.tagName,className:typeof a.className === 'string' ? a.className : '',box:rect,
        overflowX:style.overflowX,overflowY:style.overflowY,scrollTop:a.scrollTop,scrollLeft:a.scrollLeft};
      ancestors.push(item);
      if ((['hidden','clip','auto','scroll'].includes(style.overflowX) && (b.left<rect.left-1||b.right>rect.right+1)) ||
        (['hidden','clip','auto','scroll'].includes(style.overflowY) && (b.top<rect.top-1||b.bottom>rect.bottom+1))) clipping.push(item);
    }
    const x=(b.left+b.right)/2,y=(b.top+b.bottom)/2,hit=document.elementFromPoint(x,y);
    return {box:b,ancestors,clipping,documentScroll:{x:scrollX,y:scrollY},viewport:{width:innerWidth,height:innerHeight},
      fullyInViewport:b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight,
      hitMatches:Boolean(hit&&(hit===node||node.contains(hit))),label:node.getAttribute('aria-label')||node.textContent.trim().slice(0,100)};
  });
}
async function clickVisible(page, locator, record, label, keyboard = false) {
  await locator.waitFor({state:'visible'}); assert.equal(await locator.count(),1);
  assert.equal(await locator.isDisabled(),false,`${label}: disabled`);
  let before=await geometry(locator); assert.deepEqual(before.clipping,[],`${label}: source control clipped BEFORE any focus/click`);
  if(!before.fullyInViewport){
    record.geometry.push({label,phase:'before-explicit-document-scroll',...before});
    const unchanged=before.ancestors.map(a=>({tag:a.tag,className:a.className,scrollTop:a.scrollTop,scrollLeft:a.scrollLeft}));
    await page.evaluate(({top,height})=>window.scrollBy(0,top+height/2-innerHeight/2),before.box);
    before=await geometry(locator);
    assert.deepEqual(before.ancestors.map(a=>({tag:a.tag,className:a.className,scrollTop:a.scrollTop,scrollLeft:a.scrollLeft})),unchanged,
      `${label}: overflow ancestor scrolled`);
  }
  assert.equal(before.fullyInViewport,true,`${label}: not visibly reachable by document scrolling`);
  assert.deepEqual(before.clipping,[]); assert.equal(before.hitMatches,true,`${label}: control center covered`);
  record.geometry.push({label,phase:'before-input',...before});
  if(keyboard){await locator.focus();const focused=await geometry(locator);
    assert.deepEqual(focused.ancestors.map(a=>[a.scrollTop,a.scrollLeft]),before.ancestors.map(a=>[a.scrollTop,a.scrollLeft]),'Focus must not scroll an overflow ancestor');
    await page.keyboard.press('Enter');}
  else await page.mouse.click((before.box.left+before.box.right)/2,(before.box.top+before.box.bottom)/2);
}
async function geometryAudit(page, record, label, rootSelector) {
  const nodes=page.locator(rootSelector).locator('button,h2,p,[role="img"],[role="alert"]');
  const checks=[];
  for(let i=0;i<await nodes.count();i++)if(await nodes.nth(i).isVisible())checks.push(await geometry(nodes.nth(i)));
  const clipped=checks.filter(g=>g.clipping.length>0);
  record.geometry.push({label,phase:'all-visible-source-elements',elements:checks});
  assert.deepEqual(clipped.map(g=>g.label),[],`${label}: visible source content clipped`);
  assert.ok((await state(page)).documentWidth<=record.viewport.width,`${label}: horizontal page overflow`);
}
async function compareSourceSvg(page, locator, expected, record, label) {
  assert.equal(await locator.count(),1,`${label}: SVG missing or ambiguous`);
  const proof=await locator.evaluate((svg,expected)=>{
    const parsed=new DOMParser().parseFromString(expected,'image/svg+xml');if(parsed.querySelector('parsererror'))throw Error('Invalid source SVG');
    const tree=n=>n.nodeType===3?n.textContent.trim()||null:n.nodeType===1?{tag:n.localName,
      attrs:[...n.attributes].map(a=>[a.name.toLowerCase(),a.value]).filter(([k])=>!k.startsWith('xmlns')).sort(([a],[b])=>a.localeCompare(b)),
      children:[...n.childNodes].map(tree).filter(v=>v!==null)}:null;
    const children=n=>[...n.childNodes].map(tree).filter(v=>v!==null);
    return{actual:children(svg),expected:children(parsed.documentElement),svg:svg.outerHTML,
      primitives:svg.querySelectorAll('path,text,line,rect,circle,image,use,polygon,polyline').length};
  },expected);
  assert.deepEqual(proof.actual,proof.expected,`${label}: original source vector content differs`);assert.ok(proof.primitives>0);
  record.sourceProofs.push({label,sha256:sha(proof.svg),bytes:Buffer.byteLength(proof.svg),primitives:proof.primitives});
}
async function ready(page,id){
  await page.waitForFunction(({HOST,STAGE,id})=>document.querySelector(HOST)?.getAttribute('data-hydrated')==='true'&&
    document.querySelector(HOST)?.getAttribute('data-current-animation-id')===id&&document.querySelector(STAGE)?.getAttribute('data-animation-module')===id,{HOST,STAGE,id});
  await page.locator(id===P034?`${FEEDBACK}[data-host-feedback-gate="ready"]`:`${SCORE}[data-host-score-gate="ready"]`).waitFor();
  const s=await state(page);assert.equal(s.unexpectedTestLoader,false);assert.equal(s.unexpectedInjectedModules,false);
  assert.equal(s.domain,byId.get(id).runtime.frameDomain);assert.equal(s.scenario,byId.get(id).runtime.scenario);
  assert.equal(s.complete,'false');assert.equal(s.resolved,0);return s;
}
async function pause(page,record,value){if((await state(page)).paused!==String(value))await clickVisible(page,ui(page,'pause'),record,value?'host-pause':'host-resume');
  await page.waitForFunction(({RUNTIME,value})=>document.querySelector(RUNTIME)?.getAttribute('data-runtime-paused')===String(value),{RUNTIME,value});
  await page.waitForTimeout(100);
}
async function replay(page,record,footer=true){
  const before=await state(page),old=await page.locator(STAGE).elementHandle();
  await clickVisible(page,footer?ui(page,'replay'):page.locator(record.id===P034?FEEDBACK:SCORE).getByRole('button',{name:'Replay',exact:true}),record,footer?'host-footer-replay':'source-replay');
  if(footer)await page.waitForFunction(node=>!node.isConnected,old);
  else await page.waitForFunction(({RUNTIME,replay})=>Number(document.querySelector(RUNTIME)?.getAttribute('data-runtime-replay'))>replay,{RUNTIME,replay:before.replay});
  await old.dispose();
  const s=await ready(page,record.id);assert.equal(s.hostFeedback,'false');assert.deepEqual(s.hostScore,{attempted:0,correct:0,awarded:0,possible:0});
  record.trace.push({step:footer?'actual-footer-replay-reset':'actual-source-replay-reset',
    declaredSeed:byId.get(record.id).runtime.seed,replaySeedCycle:byId.get(record.id).runtime.replaySeedCycle??null,
    before,state:s,policy:footer?'host-remount-uses-declared-deterministic-seed':'source-control-increments-runtime-replay-identity'});return s;
}
const card=(page,id)=>page.locator(`${FEEDBACK} [data-source-card-id="${id}"]`);
async function pair(page,record,level,pairId){const cards=visuals.cards.filter(c=>c.level===level&&c.pairId===pairId);assert.equal(cards.length,2);
  for(const [i,c]of cards.entries())await clickVisible(page,card(page,c.id),record,`pair-${level}-${pairId}-${i}`,i===1&&pairId%2===0);}
async function choosing(page){await page.locator(`${FEEDBACK}[data-feedback-phase="choosing"][data-host-feedback-gate="ready"]`).waitFor();
  await page.waitForFunction(HOST=>document.querySelector(HOST)?.getAttribute('data-lesson-host-practice-feedback-active')==='false',HOST);}
async function feedbackProof(page,record,label){
  const s=await state(page),source=feedbackSource.feedback.find(f=>String(f.characterId)===s.feedback.character);
  assert.ok(source);const art=source.frames[s.feedback.visualFrame-1];assert.ok(art);
  await compareSourceSvg(page,page.locator(`${FEEDBACK} [data-source-vector-sha256="${art.sha256}"] > svg`),art.svg,record,label);
  await geometryAudit(page,record,label,FEEDBACK);await teachingShot(page,record,FEEDBACK,label);
}
async function p034Flow(page,record){
  await geometryAudit(page,record,'initial',FEEDBACK);
  for(const c of visuals.cards.filter(c=>c.level===1))await compareSourceSvg(page,card(page,c.id).locator('[role="img"] > svg'),c.visual.svg,record,`initial-${c.id}`);
  await teachingShot(page,record,FEEDBACK,'initial');
  assert.equal((await state(page)).hostFeedback,'false');
  const first=visuals.cards.find(c=>c.level===1&&c.pairId===1),wrong=visuals.cards.find(c=>c.level===1&&c.pairId===2);
  await clickVisible(page,card(page,first.id),record,'wrong-first');await clickVisible(page,card(page,wrong.id),record,'wrong-second',true);
  await page.waitForFunction(FEEDBACK=>Number(document.querySelector(FEEDBACK)?.getAttribute('data-source-feedback-frame'))>=5,FEEDBACK);
  await pause(page,record,true);let s=await state(page);
  assert.equal(s.feedback.phase,'wrong-feedback');assert.equal(s.feedback.score,-2);assert.equal(s.feedback.pairs,0);assert.equal(s.feedback.character,'105');assert.equal(s.hostFeedback,'true');
  await feedbackProof(page,record,'wrong-paused');await page.waitForTimeout(2400);assert.equal((await state(page)).feedback.frame,s.feedback.frame);
  await pause(page,record,false);await choosing(page);s=await state(page);assert.equal(s.feedback.score,-2);assert.equal(s.feedback.pairs,0);
  record.trace.push({step:'wrong-source-terminal-and-host-reset-after-real-pause',state:s});
  await pair(page,record,1,1);s=await state(page);assert.equal(s.feedback.score,8);assert.equal(s.feedback.revealing,1);assert.equal(s.feedback.pairs,0);assert.equal(s.hostFeedback,'true');
  await page.waitForTimeout(500);await pause(page,record,true);s=await state(page);
  assert.equal(s.feedback.character,'118');assert.equal(s.feedback.pairs,0);
  assert.equal(await page.locator(`${FEEDBACK} [data-source-fade-tick="4"]`).count(),2);
  await feedbackProof(page,record,'correct-paused-source-fade');await page.waitForTimeout(2200);assert.equal((await state(page)).feedback.frame,s.feedback.frame);
  await pause(page,record,false);await choosing(page);assert.equal((await state(page)).feedback.pairs,1);
  record.trace.push({step:'correct-pair-count-after-source-terminal-source-fade-retained',state:await state(page)});
  await pair(page,record,1,2);await replay(page,record,true);
  await page.waitForTimeout(2250);s=await state(page);assert.equal(s.feedback.score,0);assert.equal(s.feedback.pairs,0);assert.equal(s.feedback.revealing,0);assert.equal(s.hostFeedback,'false');
  await clickVisible(page,page.locator(FEEDBACK).getByRole('button',{name:'Level 2',exact:true}),record,'source-level2');
  assert.equal((await state(page)).feedback.level,2);
  for(let pairId=1;pairId<=6;pairId++){
    assert.equal((await state(page)).complete,'false');await pair(page,record,2,pairId);
    s=await state(page);assert.equal(s.feedback.pairs,pairId-1);assert.equal(s.feedback.score,pairId*10);assert.equal(s.hostFeedback,'true');
    if(pairId<6)await choosing(page);else await page.locator(`${FEEDBACK}[data-feedback-phase="complete"]`).waitFor();
    record.trace.push({step:`actual-source-feedback-terminal-${pairId}`,state:await state(page)});
  }
  await page.waitForFunction(RUNTIME=>document.querySelector(RUNTIME)?.getAttribute('data-runtime-playback-complete')==='true',RUNTIME);
  s=await state(page);assert.equal(s.resolved,1);assert.equal(s.feedback.pairs,6);assert.equal(s.feedback.revealing,6);assert.equal(s.feedback.score,60);assert.equal(s.hostFeedback,'false');
  assert.equal(await page.locator(`${FEEDBACK} [data-source-revealed-tile]`).count(),12);
  await geometryAudit(page,record,'six-pair-complete',FEEDBACK);await teachingShot(page,record,FEEDBACK,'complete');
  assert.equal(await page.locator(FEEDBACK).getByRole('button',{name:'Continue',exact:true}).count(),0);
  await replay(page,record,false);
}
async function quizProof(page,record,label){
  const s=await state(page),q=Number(s.quiz.question?.slice(1)),question=visuals.questions.find(item=>item.number===q);assert.ok(question);
  for(const [part,art]of [['prompt',question.prompt],...question.choices.map(c=>[`option-${c.option}`,c.visual])])
    await compareSourceSvg(page,page.locator(`${SCORE} [data-source-vector-sha256="${art.sha256}"] > svg`),art.svg,record,`${label}-q${q}-${part}`);
  await geometryAudit(page,record,label,SCORE);return question;
}
async function answer(page,record,index){const before=await state(page),q=Number(before.quiz.question.slice(1)),question=visuals.questions.find(item=>item.number===q);
  const correct=index%2===1,option=correct?question.correctOption:question.correctOption%4+1;
  await clickVisible(page,page.locator(`${SCORE} [data-source-instance-name="A${q}Opt${option}"]`),record,`answer-source-q${q}`,index%2===1);
  await page.waitForFunction(({HOST,n})=>Number(document.querySelector(HOST)?.getAttribute('data-lesson-host-fq-attempted'))===n,{HOST,n:before.hostScore.attempted+1});
  const after=await state(page);assert.equal(after.quiz.gate,'ready');
  assert.deepEqual(after.quiz.acknowledged,after.quiz.selection.slice(0,after.hostScore.attempted).map(q=>`${P044}-q${q}`));
  assert.equal(after.hostScore.possible,after.hostScore.attempted);assert.equal(after.hostScore.awarded,after.hostScore.correct);
  assert.equal(after.hostScore.correct,before.hostScore.correct+(correct?1:0));
  record.trace.push({step:'actual-host-acknowledged-source-response',answeredSourceQuestionId:`${P044}-q${q}`,expectedCorrect:correct,state:after});
}
async function p044Flow(page,record){
  await quizProof(page,record,'initial');await teachingShot(page,record,SCORE,'initial');
  await pause(page,record,true);assert.equal(await page.locator(`${SCORE} button[data-source-instance-name]:disabled`).count(),4);await pause(page,record,false);
  await answer(page,record,0);await answer(page,record,1);const beforeReplay=await state(page);const reset=await replay(page,record,true);
  assert.deepEqual(reset.quiz.acknowledged,[]);
  assert.equal(byId.get(P044).runtime.seed,'0');assert.equal(byId.get(P044).runtime.replaySeedCycle,undefined);
  assert.deepEqual(reset.quiz.selection,beforeReplay.quiz.selection,'Fixed-seed host remount must reproduce the declared sequence');
  record.trace.push({step:'footer-replay-declared-fixed-seed-policy',seed:'0',replaySeedCycle:null,
    beforeReplay:beforeReplay.replay,afterReplay:reset.replay,beforeSequence:beforeReplay.quiz.selection,afterSequence:reset.quiz.selection,
    originalFlashRandomnessParity:'not-established'});
  for(let index=0;index<10;index++){
    const s=await state(page);assert.equal(s.hostScore.attempted,index);assert.equal(s.complete,'false');
    await quizProof(page,record,`question-${index+1}`);await answer(page,record,index);
  }
  await page.locator(SCORE).getByText('Score: 5 / 10',{exact:true}).waitFor();
  await page.waitForFunction(RUNTIME=>document.querySelector(RUNTIME)?.getAttribute('data-runtime-playback-complete')==='true',RUNTIME);
  let s=await state(page);assert.equal(s.resolved,1);assert.equal(s.quiz.acknowledged.length,10);
  assert.deepEqual(s.hostScore,{attempted:10,correct:5,awarded:5,possible:10});
  record.trace.push({step:'ten-host-acknowledgments-before-runtime-complete',state:s});
  await geometryAudit(page,record,'quiz-results',SCORE);await teachingShot(page,record,SCORE,'results');
  await clickVisible(page,page.locator(SCORE).getByRole('button',{name:'Review answers',exact:true}),record,'review-answers');
  const finalSelection=s.quiz.selection;
  for(let index=0;index<10;index++){
    s=await state(page);assert.equal(s.quiz.question,`Q${finalSelection[index]}`);assert.deepEqual(s.hostScore,{attempted:10,correct:5,awarded:5,possible:10});
    await quizProof(page,record,`review-${index+1}`);
    assert.equal(await page.locator(`${SCORE} [data-review-selected="true"]`).count(),1);
    assert.equal(await page.locator(`${SCORE} [data-review-correct="true"]`).count(),1);
    const name=index<9?'Next review':'Finish review';
    if(finalSelection[index]===12){
      const controls=[];
      for(const label of [name,'Replay']){
        const control=await geometry(page.locator(SCORE).getByRole('button',{name:label,exact:true}));
        assert.deepEqual(control.clipping,[],`Q12 review ${label} must be fully within source stage bounds`);
        controls.push({label,...control});
      }
      record.trace.push({step:'source-Q12-review-next-and-replay-unclipped',controls,state:await state(page)});
      await teachingShot(page,record,SCORE,'q12-review-unclipped');
    }
    if(index===0){await pause(page,record,true);assert.equal(await page.locator(SCORE).getByRole('button',{name,exact:true}).isDisabled(),true);
      await teachingShot(page,record,SCORE,'review-paused');await pause(page,record,false);}
    await clickVisible(page,page.locator(SCORE).getByRole('button',{name,exact:true}),record,`review-next-${index}`,index%2===1);
  }
  s=await state(page);assert.deepEqual(s.hostScore,{attempted:10,correct:5,awarded:5,possible:10});assert.equal(s.resolved,1);
  record.trace.push({step:'source-review-preserved-no-rescoring',state:s});const sourceReset=await replay(page,record,false);
  assert.notDeepEqual(sourceReset.quiz.selection,finalSelection,'Source Replay identity must produce its deterministic replay selection');
}

async function runCase(id,layout,viewport,motion){
  const name=`${layout}-${id.slice(-4)}`,record={name,id,viewport,motion,clock:'actual-wall-clock',status:'running',trace:[],geometry:[],screenshots:[],sourceProofs:[],requests:[],errors:[]};records.push(record);
  const context=await browser.newContext({viewport,reducedMotion:motion,serviceWorkers:'block'}),page=await context.newPage();page.setDefaultTimeout(20_000);
  await context.route('**/*',route=>{const request=route.request(),url=new URL(request.url());
    const allowed=url.origin===BASE&&['GET','HEAD','POST'].includes(request.method())&&
      (/^\/(?:en\/|es\/)?migration-status\/g678-calibration\/shared-alg001-l11-p\d{3}$/.test(url.pathname)||url.pathname.startsWith('/_next/')||url.pathname.startsWith('/flash-assets/')||
        ['/favicon.ico','/learning-theme-bootstrap.js','/__nextjs_original-stack-frames'].includes(url.pathname));
    const row={case:name,url:request.url(),method:request.method(),allowed};network.push(row);record.requests.push(row);
    if(!allowed){errors.push(`Unexpected outbound ${request.method()} ${request.url()}`);return route.abort();}return route.continue();});
  await context.routeWebSocket('**/*',socket=>{const url=new URL(socket.url()),allowed=url.origin==='ws://127.0.0.1:3324'&&url.pathname.startsWith('/_next/');
    const row={case:name,url:socket.url(),method:'WEBSOCKET',allowed};network.push(row);record.requests.push(row);
    if(allowed)socket.connectToServer();else{errors.push(`Unexpected WebSocket ${socket.url()}`);socket.close();}});
  page.on('pageerror',error=>record.errors.push(error.message));page.on('console',message=>{if(message.type()==='error')record.errors.push(message.text());});
  page.on('response',response=>{if(response.status()>=400)record.errors.push(`HTTP ${response.status()} ${response.url()}`);});
  try{
    const response=await page.goto(`${BASE}/en/migration-status/g678-calibration/${id}`,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);
    record.ready=await ready(page,id);await pause(page,record,false);
    record.trace.push({step:'actual-v3-registered-host-ready',state:await state(page)});
    if(id===P034)await p034Flow(page,record);else await p044Flow(page,record);
    record.final=await state(page);assert.deepEqual(record.errors,[]);assert.ok(record.requests.every(r=>r.allowed));record.status='passed';
  }catch(error){record.status='failed';record.failure=error.stack??String(error);record.failureState=await state(page).catch(()=>null);
    record.failureScreenshot=await shot(page,`${name}-failure`).catch(()=>null);await save(`${name}-failure.html`,await page.content().catch(()=>''));}
  finally{await save(`${name}.json`,json(record));await context.close();console.log(JSON.stringify({case:name,status:record.status,failure:record.failure?.split('\n')[0]}));}
}
try{
  for(const [layout,viewport,motion]of [['desktop',{width:1440,height:1000},'no-preference'],['mobile390',{width:390,height:844},'reduce']])
    for(const id of [P034,P044])await runCase(id,layout,viewport,motion);
}finally{
  await browser.close();const after=await Promise.all(inputFiles.map(binding));evidence.inputsUnchanged=JSON.stringify(after)===JSON.stringify(inputs);
  evidence.status=records.length===4&&records.every(r=>r.status==='passed')&&evidence.inputsUnchanged&&errors.length===0&&network.every(r=>r.allowed)?'passed':'failed';
  evidence.namedHumanVisualReviewAccepted=false;
  await save('evidence.json',json(evidence));console.log(JSON.stringify({output:OUTPUT,status:evidence.status,cases:records.length,inputsUnchanged:evidence.inputsUnchanged,productCalibrationPassed:false}));
}
process.exitCode=evidence.status==='passed'?0:1;
