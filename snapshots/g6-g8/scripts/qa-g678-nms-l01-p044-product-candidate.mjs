#!/usr/bin/env node
// Isolated real AnimationRuntime + exact candidate loader. No product registration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {chromium} from 'playwright';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const PREPARED=process.argv[4]==='--prepared';
const SELF='scripts/qa-g678-nms-l01-p044-product-candidate.mjs',FIXTURE=PREPARED?'scripts/qa-g678-nms-l01-p044-prepared-fixture.tsx':'scripts/qa-g678-nms-l01-p044-product-fixture.tsx';
const sha=b=>createHash('sha256').update(b).digest('hex');
const binding=async p=>{const b=await readFile(path.resolve(ROOT,p));return{path:p,bytes:b.length,sha256:sha(b)};};
assert.equal(process.argv.length,PREPARED?5:4);assert.equal(process.argv[2],'--run');assert.match(process.argv[3],/^[a-z0-9-]+$/);
const output=`output/playwright/g678-nms-l01-p044-product-${process.argv[3]}`;await mkdir(path.join(ROOT,output));
const save=(p,b)=>writeFile(path.join(ROOT,output,p),b,{flag:'wx'});
const evidence={scope:'Isolated actual AnimationRuntime; not MyLesson/registered/audio/acceptance/publication',preparedLoader:PREPARED,loadGates:[],records:[],screenshots:[],errors:[],requests:[],status:'running'};
const compiled=await build({entryPoints:[path.join(ROOT,FIXTURE)],bundle:true,write:false,metafile:true,platform:'browser',format:PREPARED?'esm':'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},
  alias:{'@helpmath/demos/runtime':path.join(ROOT,'packages/demos/src/runtime.ts'),'@helpmath/demos/prototype-manifest':path.join(ROOT,'packages/demos/src/prototype-manifest.ts')},
  plugins:[{name:'p044-explicit-unregistered-loader',setup(builder){
    builder.onResolve({filter:/^@\/lib\/load-animation-module\.client$/},()=>({path:'p044-loader',namespace:'p044-only'}));
    builder.onLoad({filter:/.*/,namespace:'p044-only'},()=>({contents:PREPARED?'export async function loadClientAnimationModule(key){return window.__P044_PREPARED_MODULE_LOADERS[key]?.();}':'export async function loadClientAnimationModule(key){return window.__P044_PRODUCT_MODULES[key];}',loader:'js'}));
  }}]});
const files=[...new Set([SELF,...Object.keys(compiled.metafile.inputs).filter(p=>!p.startsWith('p044-only:')),
  'packages/demos/private-current-js-registry.json','catalog/product-bridge-calibrations/g678-current-js-378-page-registration-v1.json',
  'packages/demos/src/contract.ts','apps/web/components/animation-runtime.tsx'])];
evidence.inputs=await Promise.all(files.map(binding));
await save('fixture.js',compiled.outputFiles[0].contents);await save('runner.mjs',await readFile(path.join(ROOT,SELF)));
evidence.executedFixture={path:`${output}/fixture.js`,bytes:compiled.outputFiles[0].contents.length,sha256:sha(compiled.outputFiles[0].contents),
  execution:'Exact in-memory esbuild output text passed to addScriptTag; same bytes retained before execution.'};
const bundle=compiled.outputFiles[0].text;let browser,page;
const SEL='[data-p044-candidate-view="v1"]';
async function mountFixture(label,reduced=true,fail=false){
  if(PREPARED)await page.evaluate(fail=>{
    let release;const gate=new Promise(resolve=>{release=resolve;}),original=HTMLImageElement.prototype.decode;
    const trace={decodeCalls:0,nativeDecoded:0,released:false,firstRuntimeFrame:null,firstVisualFrame:null,fail};window.__P044_DECODE_TRACE=trace;
    window.__P044_RELEASE_DECODE=()=>{trace.released=true;release();};
    HTMLImageElement.prototype.decode=async function(){const index=++trace.decodeCalls;await original.call(this);trace.nativeDecoded++;await gate;if(fail&&index===1)throw new Error('Deliberate decode-admission failure');};
    new MutationObserver(()=>{const runtime=document.querySelector('.runtime-stage'),visual=document.querySelector('[data-p044-candidate-view]');
      if(runtime&&trace.firstRuntimeFrame===null)trace.firstRuntimeFrame=Number(runtime.dataset.flashFrame);
      if(visual?.dataset.visualStatus==='ready'&&trace.firstVisualFrame===null)trace.firstVisualFrame=Number(visual.dataset.sourceFrame);
    }).observe(document.body,{subtree:true,attributes:true,childList:true});
  },fail);
  await page.addScriptTag({content:bundle,type:PREPARED?'module':'text/javascript'});
  if(PREPARED){
    await page.waitForFunction(()=>window.__P044_DECODE_TRACE?.nativeDecoded===11);
    await page.waitForTimeout(250);
    const before=await page.evaluate(()=>({...window.__P044_DECODE_TRACE,admitted:Boolean(window.__P044_ADMITTED_PREPARATION),
      runtimeCount:document.querySelectorAll('.runtime-stage').length,loading:document.body.innerText.includes('Loading candidate'),externalHold:document.querySelector('[data-no-external-visual-ready-hold]')?.getAttribute('data-no-external-visual-ready-hold')}));
    assert.equal(before.decodeCalls,11);assert.equal(before.runtimeCount,0);assert.equal(before.admitted,false);assert.equal(before.loading,true);assert.equal(before.externalHold,'true');
    await page.evaluate(()=>window.__P044_RELEASE_DECODE());
    if(fail){await page.getByText('Candidate unavailable',{exact:true}).waitFor();const after=await page.evaluate(()=>({admitted:Boolean(window.__P044_ADMITTED_PREPARATION),runtimeCount:document.querySelectorAll('.runtime-stage').length}));assert.deepEqual(after,{admitted:false,runtimeCount:0});evidence.loadGates.push({label,before,after});return;}
    await page.waitForSelector(`${SEL}[data-visual-status="ready"]`);
    const after=await page.evaluate(()=>({...window.__P044_DECODE_TRACE,preparation:window.__P044_ADMITTED_PREPARATION}));
    assert.equal(after.firstRuntimeFrame,reduced?312:1);assert.equal(after.firstVisualFrame,reduced?312:1);assert.equal(after.preparation.loaderAwaitedDecode,true);
    evidence.loadGates.push({label,before,after});
  }else await page.waitForSelector(`${SEL}[data-visual-status="ready"]`);
}
async function snapshot(label){const result=await page.locator(SEL).evaluate(e=>({frame:Number(e.dataset.sourceFrame),phase:e.dataset.sourcePhase,epoch:e.dataset.sourceEpoch,
  visual:e.dataset.visualStatus,nested:e.dataset.sourceNestedFrames,alerts:[...document.querySelectorAll('[role="alert"]')].map(e=>e.textContent),
  completions:Number(document.querySelector('[data-p044-isolated-fixture]').dataset.completions),
  overflow:document.documentElement.scrollWidth>innerWidth,buttons:[...e.querySelectorAll('button')].map(b=>({text:b.textContent,disabled:b.disabled}))}));
  result.readable=await page.locator(SEL).evaluate(e=>{
    const scope=e.closest('.lesson-shell2__learning-column')??e;
    const root=scope.querySelector('[data-p044-readable-instruction]');
    if(!root)return null;
    const text=[...root.querySelectorAll('p,h3,figcaption')].map(t=>({text:t.textContent,fontPx:parseFloat(getComputedStyle(t).fontSize),linePx:parseFloat(getComputedStyle(t).lineHeight)}));
    const diagrams=[...root.querySelectorAll('svg')].map(svg=>({summary:svg.getAttribute('aria-label'),
      labels:[...svg.querySelectorAll('text')].map(t=>{const r=t.getBoundingClientRect(),s=svg.getBoundingClientRect();return{text:t.textContent,screenFontPx:parseFloat(getComputedStyle(t).fontSize)*Math.abs(t.getScreenCTM().a),inside:r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1};}),
      jumps:[...svg.querySelectorAll('[data-jump-from]')].map(g=>({from:Number(g.dataset.jumpFrom),to:Number(g.dataset.jumpTo)}))}));
    return{sections:[...root.querySelectorAll('[data-readable-section]')].map(s=>s.dataset.readableSection),text,diagrams,
      companionPlacement:scope.querySelector('[data-p044-maintained-controls]')?.dataset.p044CompanionPlacement};
  });
  evidence.records.push({label,...result});assert.deepEqual(result.alerts,[],label);assert.equal(result.overflow,false,label);
  if(result.readable){for(const t of result.readable.text){assert.ok(t.fontPx>=20,label+' readable font');assert.ok(t.linePx>=30,label+' readable line height');}
    for(const d of result.readable.diagrams)for(const t of d.labels){assert.ok(t.screenFontPx>=16,label+' number-line font');assert.equal(t.inside,true,label+' number-line text bounds');}}
  return result;}
async function shot(label){const png=await page.screenshot({fullPage:true});await save(`${label}.png`,png);evidence.screenshots.push({path:`${output}/${label}.png`,bytes:png.length,sha256:sha(png)});}
async function wait(frame,phase){await page.waitForFunction(({sel,frame,phase})=>{const e=document.querySelector(sel);return e?.dataset.sourceFrame===String(frame)&&e.dataset.sourcePhase===phase&&e.dataset.visualStatus==='ready';},{sel:SEL,frame,phase},{timeout:35000});}
async function click(selector){const b=page.locator(selector);await b.scrollIntoViewIfNeeded();await b.click();}
async function glossary(term){
  if(term==='solve'){const b=page.locator('[data-p044-glossary="solve"]');await b.scrollIntoViewIfNeeded();await b.focus();await b.press('Space');}
  else await click(`[data-p044-glossary="${term}"]`);
  await page.locator('[data-p044-fixture-glossary]').waitFor();
  if(term==='solve'){const close=page.locator('[data-fixture-glossary-close]');await close.focus();await close.press('Enter');}
  else await click('[data-fixture-glossary-close]');
  await page.locator('[data-p044-fixture-glossary]').waitFor({state:'detached'});
}
async function toQuiz(label){await wait(312,'guided');await snapshot(`${label}-312`);
  await click('[data-p044-continue]');await wait(449,'guided');await click('[data-p044-continue]');await wait(575,'guided');
  await click('[data-p044-explanation]');await wait(575,'explanation-held');await snapshot(`${label}-explanation106`);await shot(`${label}-explanation106`);
  await click('[data-p044-explanation-close]');await wait(575,'guided');await click('[data-p044-continue]');await wait(697,'guided');
  await click('[data-p044-explanation]');await wait(697,'explanation-held');await snapshot(`${label}-explanation139`);await shot(`${label}-explanation139`);
  await click('[data-p044-explanation-close]');await wait(697,'guided');await click('[data-p044-continue]');await wait(737,'quiz');
  await click('[data-p044-help]');await wait(737,'popup');await glossary('multiplication');await glossary('solve');await snapshot(`${label}-popup`);await shot(`${label}-popup`);
  await click('[data-p044-help-close]');await wait(737,'quiz');await glossary('total');await snapshot(`${label}-quiz`);}
try{
  browser=await chromium.launch({headless:true});evidence.browser=browser.version();
  for(const width of [370,390,1440]){
    const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce',serviceWorkers:'block',hasTouch:width===390});
    await context.route('**/*',route=>{evidence.requests.push({scheme:route.request().url().split(':')[0],urlSha256:sha(route.request().url())});return route.abort();});
    page=await context.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')evidence.errors.push(m.text());});
    await page.setContent('<!doctype html><html lang="en"><head><meta charset="utf-8"><style>body{margin:0;font-family:system-ui}button,select{min-height:44px;font-size:16px}*{box-sizing:border-box}</style></head><body><div id="root"></div></body></html>');
    await page.evaluate(locale=>{window.__P044_FIXTURE_LOCALE=locale;},width===390?'es':'en');
    await mountFixture(`${width}-initial`);await snapshot(`${width}-initial`);
    if(PREPARED&&width===370){evidence.preparedDefaultPixels=await page.evaluate(()=>window.__P044_COMPARE_PREPARED_DEFAULTS());for(const row of evidence.preparedDefaultPixels)assert.equal(row.differingBytes,0);}
    await wait(312,'guided');
    for(const mode of ['unmarked','duplicate','missing','valid']){
      await page.locator('[data-fixture-slot]').selectOption(mode);
      await page.waitForFunction(expected=>{const targets=[...document.querySelectorAll('[data-p044-maintained-controls]')];return targets.length===1&&targets[0].dataset.p044CompanionPlacement===expected;},mode==='valid'?'portal':'fallback');
      const state=await snapshot(`${width}-slot-${mode}`);assert.equal(state.frame,312);assert.equal(state.phase,'guided');
    }
    for(let seed=0;seed<4;seed++){
      if(seed)await page.locator('[data-fixture-seed]').selectOption(String(seed));
      const label=`${width}-seed${seed}`;await toQuiz(label);
      // For seeds0..2 exercise all three wrong variants then a right answer;
      // seed3 exercises the fourth right variant without a first wrong.
      if(seed<3){await click('[data-p044-answer="AnsBtn1"]');await wait(737,'quiz');await snapshot(`${label}-wrong-retry`);}
      await click('[data-p044-answer="AnsBtn3"]');await wait(756,'complete');const completed=await snapshot(`${label}-complete`);assert.equal(completed.completions,1);
      await click('[data-p044-replay]');await wait(312,'guided');const replayed=await snapshot(`${label}-replay`);assert.equal(replayed.phase,'guided');
    }
    // A two-wrong exit is not the same branch as wrong-then-right.
    await toQuiz(`${width}-two-wrong`);await click('[data-p044-answer="AnsBtn4"]');await wait(737,'quiz');
    await click('[data-p044-answer="AnsBtn2"]');await wait(756,'complete');await snapshot(`${width}-two-wrong-complete`);
    await click('[data-p044-replay]');await toQuiz(`${width}-denied-host`);await click('[data-fixture-deny]');
    await click('[data-p044-answer="AnsBtn3"]');await page.locator('[role="alert"]').waitFor();
    const denied=await page.locator(SEL).evaluate(e=>({phase:e.dataset.sourcePhase,frame:e.dataset.sourceFrame,feedback:e.dataset.sourceNestedFrames}));
    assert.equal(denied.phase,'quiz');assert.equal(denied.frame,'737');evidence.records.push({label:`${width}-host-denial-keeps-quiz`,...denied});
    await click('[data-fixture-deny]');await click('[data-p044-replay]');await wait(312,'guided');await snapshot(`${width}-denial-replay-recovered`);
    if(PREPARED)assert.equal(await page.evaluate(()=>window.__P044_DECODE_TRACE.decodeCalls),11,'Replay and seed remounts reuse already decoded source images');
    await context.close();page=null;
  }
  // Real 12fps main and nested clocks, including a pause during feedback.
  const natural=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference',serviceWorkers:'block'});
  await natural.route('**/*',route=>{evidence.requests.push({scheme:route.request().url().split(':')[0],urlSha256:sha(route.request().url())});return route.abort();});
  page=await natural.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')evidence.errors.push(m.text());});
  await page.setContent('<!doctype html><html lang="en"><head><meta charset="utf-8"><style>body{margin:0;font-family:system-ui}button,select{min-height:44px;font-size:16px}*{box-sizing:border-box}</style></head><body><div id="root"></div></body></html>');
  await mountFixture('natural-initial',false);
  const started=Date.now();await toQuiz('natural');evidence.naturalMainElapsedMs=Date.now()-started;
  await click('[data-p044-answer="AnsBtn1"]');await wait(737,'feedback');await page.waitForTimeout(500);await click('[data-fixture-pause]');
  const held=await snapshot('natural-feedback-paused');await page.waitForTimeout(350);const heldAgain=await snapshot('natural-feedback-still-paused');
  assert.equal(held.nested,heldAgain.nested);await shot('natural-feedback-paused');await click('[data-fixture-pause]');await wait(737,'quiz');
  await click('[data-p044-answer="AnsBtn3"]');await wait(737,'feedback');await page.waitForTimeout(500);await shot('natural-right-feedback');await wait(756,'complete');await snapshot('natural-complete');
  await natural.close();page=null;
  if(PREPARED){const failure=await browser.newContext({viewport:{width:800,height:900},serviceWorkers:'block'});page=await failure.newPage();
    await failure.route('**/*',r=>r.abort());await page.setContent('<!doctype html><html><body><div id="root"></div></body></html>');
    await mountFixture('decode-rejection',false,true);await shot('decode-rejection');await failure.close();page=null;}
  assert.deepEqual(evidence.errors,[]);assert.deepEqual(evidence.requests,[]);evidence.status='passed-isolated-product-candidate-not-registered';
}catch(error){evidence.status='failed';evidence.failure={message:error.message,stack:error.stack};if(page){await shot('failure');evidence.failureDom=await page.locator('body').innerText();}process.exitCode=1;}
finally{if(browser)await browser.close();evidence.inputsAfter=await Promise.all(files.map(binding));evidence.inputsUnchanged=JSON.stringify(evidence.inputsAfter)===JSON.stringify(evidence.inputs);
  if(!evidence.inputsUnchanged){evidence.status='invalidated-input-drift';evidence.failure={...evidence.failure,inputDrift:true};process.exitCode=1;}
  await save('evidence.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify({status:evidence.status,records:evidence.records.length,errors:evidence.errors,failure:evidence.failure,output,evidence:await binding(`${output}/evidence.json`)},null,2));}
