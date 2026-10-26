#!/usr/bin/env node
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS as CARDS} from '../packages/demos/src/g678-alg-l11-advanced3-tranche-d-state.ts';
import {G678_ALG_L11_P034_LEARNER_MATH as MATH} from '../packages/demos/src/generated/g678-alg-l11-p034-learner-math-v1.ts';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);assert.ok(args.length===2&&args[0]==='--run'&&/^[a-z0-9-]+$/.test(args[1]));
const OUTPUT=`output/playwright/g678-alg-l11-p034-companion-${args[1]}`,out=path.join(ROOT,OUTPUT);await mkdir(out);
const ENTRY='scripts/harness-g678-alg-l11-p034-companion.tsx';
const hash=b=>createHash('sha256').update(b).digest('hex'),json=x=>JSON.stringify(x,null,2)+'\n';
const save=(p,b)=>writeFile(path.join(out,p),b,{flag:'wx'});
async function binding(p){const b=await readFile(path.resolve(ROOT,p));return{path:p,bytes:b.length,sha256:hash(b)};}
const predecessor=JSON.parse(await readFile(path.join(ROOT,'catalog/g678-alg-l11-p034-feedback-candidate-v1.json'),'utf8'));
const files=[...new Set([...predecessor.files.map(f=>f.path),ENTRY,'scripts/qa-g678-alg-l11-p034-companion.mjs',
  'packages/demos/src/g678-alg-l11-p034-companion-candidate.tsx','packages/demos/src/g678-alg-l11-p034-companion-controller.ts',
  'packages/demos/src/generated/g678-alg-l11-p034-learner-math-v1.ts','packages/demos/tests/g678-alg-l11-p034-companion-candidate.test.tsx',
  'catalog/g678-alg-l11-p034-math-source-map-v1.json','scripts/build-g678-alg-l11-p034-learner-math.mjs',
  'work/g678-shared-page-factory/g678-alg-l11-p034-learner-math-v1/run.json'])];
const inputs=await Promise.all(files.map(binding));await save('inputs.json',json(inputs));
const bundle=await build({entryPoints:[path.join(ROOT,ENTRY)],bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',
  define:{'process.env.NODE_ENV':'"production"'},metafile:true,
  alias:{'@helpmath/demos/runtime':path.join(ROOT,'packages/demos/src/runtime.ts'),'@helpmath/demos/prototype-manifest':path.join(ROOT,'packages/demos/src/prototype-manifest.ts')},
  plugins:[{name:'p034-companion-test-loader',setup(b){b.onResolve({filter:/^@\/lib\/load-animation-module\.client$/},()=>({path:'p034-companion-loader',namespace:'p034-companion-test'}));
    b.onLoad({filter:/.*/,namespace:'p034-companion-test'},()=>({contents:'export async function loadClientAnimationModule(key){return window.__P034_COMPANION_MODULES[key];}',loader:'js'}));}}]});
const script=bundle.outputFiles[0].text;await save('harness.js',script);await save('esbuild-inputs.json',json(bundle.metafile.inputs));
assert.ok(!Object.keys(bundle.metafile.inputs).some(p=>/math-source-map|math-transcription/.test(p)),'reviewer source map entered learner bundle');
assert.ok(!script.includes('reviewerOnly')&&!script.includes('solutionSet'),'reviewer semantics entered learner bundle');
const browser=await chromium.launch({headless:true}),records=[];let step='mount',activePage;
const evidence={artifactType:'p034-math-companion-typed-host-mounted-candidate-qa',inputs,harness:{bytes:Buffer.byteLength(script),sha256:hash(script)},
  browser:{version:browser.version(),executable:await binding(chromium.executablePath())},records,reviewerSolutionMetadataInBundle:false,
  boundary:'Actual AnimationRuntime + real memory-only host, explicit unregistered test-loader and fixed-source-plane/marked-companion fixture. Not actual registered My Lesson. No server/network/audio.',
  registered:false,productCalibrationPassed:false,authoritativeOriginalRuntime:false,visualFidelityAccepted:false,audioIntegrated:false,audioAccepted:false,
  humanVisualAccepted:false,ownerAccepted:false,screenReaderHumanAccepted:false,strictComplete:false,released:false,published:false};
async function snapshot(page){return page.evaluate(()=>{const s=document.querySelector('[data-p034-companion-successor]'),h=document.querySelector('[data-test-loader]');
  return{level:Number(s?.getAttribute('data-source-level')),gate:s?.getAttribute('data-host-feedback-gate'),phase:s?.getAttribute('data-feedback-phase'),
    score:Number(s?.getAttribute('data-source-score')),pairs:Number(s?.getAttribute('data-source-completed-pair-count')),revealing:Number(s?.getAttribute('data-source-revealing-pair-count')),
    frame:Number(s?.getAttribute('data-source-feedback-frame')),elapsed:Number(s?.getAttribute('data-source-feedback-elapsed')),
    host:JSON.parse(h?.getAttribute('data-real-host-feedback')||'null'),completions:Number(h?.getAttribute('data-completions')),
    treeCount:document.querySelectorAll('[data-p034-action-tree]').length,placement:document.querySelector('[data-companion-placement]')?.getAttribute('data-companion-placement'),
    selected:document.querySelector('[data-source-card-id][aria-pressed="true"]')?.getAttribute('data-source-card-id')??null,
    audit:window.__P034_COMPANION_AUDIT};});}
async function shot(page,name){const b=await page.screenshot({fullPage:true});await save(name+'.png',b);return{path:`${OUTPUT}/${name}.png`,bytes:b.length,sha256:hash(b)};}
async function mount(config){const page=await browser.newPage({viewport:{width:config.width,height:1000},reducedMotion:config.motion,hasTouch:config.touch??false});activePage=page;
  const record={config,errors:[],requests:[],trace:[],geometry:[],screenshots:[],status:'running'};records.push(record);
  page.on('pageerror',e=>record.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')record.errors.push(m.text());});
  await page.route('**/*',route=>{record.requests.push(route.request().url());return route.abort();});
  await page.setContent('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:"><style>body{margin:0;font-family:Arial}.runtime-stage{width:100%;max-width:800px}.runtime-stage svg{max-width:100%}</style></head><body><div id="root"></div></body></html>');
  await page.evaluate(c=>{window.__P034_COMPANION_CASE=c;},config);await page.addScriptTag({content:script});
  await page.locator(`[data-host-feedback-gate="${config.permission?'ready':'blocked'}"]`).waitFor();
  await page.locator(`[data-companion-placement="${config.provided&&config.present&&config.valid?'portal':'fallback'}"]`).waitFor();return{page,record};}
const card=(page,id)=>page.locator(`[data-source-card-id="${id}"]`);
async function action(page,locator,input){if(input==='touch')await locator.tap();else if(input==='Enter'||input==='Space'){await locator.focus();await page.keyboard.press(input);}else await locator.click();}
async function pair(page,level,pairId,input='mouse'){const cards=CARDS.filter(c=>c.level===level&&c.pairId===pairId);await action(page,card(page,cards[0].id),input);await action(page,card(page,cards[1].id),input);}
async function choosing(page){await page.locator('[data-feedback-phase="choosing"][data-host-feedback-gate="ready"]').waitFor();}
async function replay(page){await page.locator('[data-p034-action-tree]').getByRole('button',{name:'Replay',exact:true}).click();
  await page.waitForFunction(()=>{const s=document.querySelector('[data-p034-companion-successor]');return s?.getAttribute('data-host-feedback-gate')==='ready'&&s?.getAttribute('data-source-score')==='0'&&s?.getAttribute('data-feedback-phase')==='choosing';});}
async function geometry(page,record){
  const bounds=await page.locator('[data-p034-action-tree]').evaluate(root=>{const grid=root.querySelector('.p034-math-companion__cards');return{
    viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,gridColumns:getComputedStyle(grid).gridTemplateColumns,gap:parseFloat(getComputedStyle(grid).gap),
    cards:[...root.querySelectorAll('[data-source-card-id]')].map(button=>{const expression=button.querySelector('.p034-math-companion__expression'),b=button.getBoundingClientRect(),e=expression.getBoundingClientRect();
      return{id:button.getAttribute('data-source-card-id'),label:button.getAttribute('aria-label'),expression:expression.textContent,fontSize:parseFloat(getComputedStyle(expression).fontSize),
        lineHeight:parseFloat(getComputedStyle(expression).lineHeight),x:b.x,y:b.y,width:b.width,height:b.height,textWidth:e.width,textHeight:e.height,scrollWidth:button.scrollWidth,clientWidth:button.clientWidth};}),
    sourceButtons:document.querySelectorAll('[data-p034-source-plane] button').length,actionTrees:document.querySelectorAll('[data-p034-action-tree]').length,
    portalOutsideSourcePlane:root.closest('[data-p034-source-plane]')===null};});
  assert.equal(bounds.actionTrees,1);assert.equal(bounds.sourceButtons,0);assert.equal(bounds.cards.length,12);assert.equal(bounds.portalOutsideSourcePlane,true);
  assert.ok(bounds.gap>=8);assert.ok(bounds.documentWidth<=bounds.viewport+1,'horizontal page overflow');
  for(const b of bounds.cards){const literal=MATH.find(c=>c.cardId===b.id);assert.equal(b.expression,literal.expression);assert.equal(b.label,literal.spoken);
    assert.equal(b.fontSize,20);assert.ok(b.width>=44&&b.height>=44);assert.ok(b.textHeight>=29.9);assert.ok(b.scrollWidth<=b.clientWidth+1,'math card overflow');}
  if(bounds.viewport<=480)assert.equal(new Set(bounds.cards.map(c=>Math.round(c.x))).size,1,'small-screen cards not single column');
  record.geometry.push(bounds);return bounds;
}
async function finish(page,record){record.final=await snapshot(page);assert.equal(record.final.treeCount,1);assert.deepEqual(record.errors,[]);assert.deepEqual(record.requests,[]);
  assert.equal(await page.getByRole('button',{name:'Continue',exact:true}).count(),0);record.status='passed';await page.close();}
try{
  for(const[width,motion,touch]of[[1100,'no-preference',false],[390,'reduce',true]]){
    const name=`portal-${width}-${motion}`;step=name;const{page,record}=await mount({width,motion,touch,permission:true,provided:true,present:true,valid:true});
    await geometry(page,record);record.screenshots.push(await shot(page,`${name}-literal-level1`));
    await card(page,CARDS[0].id).focus();await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>parseFloat(getComputedStyle(document.activeElement).outlineWidth)>=3));
    step=`${name}-blocked-record`;await page.getByRole('button',{name:'Host fault: record',exact:true}).click();await pair(page,1,1,touch?'touch':'Enter');
    let state=await snapshot(page);assert.equal(state.gate,'blocked');assert.equal(state.score,0);assert.equal(state.revealing,0);assert.equal(state.host,null);record.trace.push({step:'blocked-record-no-local-result',state});
    await page.getByRole('button',{name:'Host fault: none',exact:true}).click();await replay(page);
    step=`${name}-wrong-pause`;await action(page,card(page,CARDS.find(c=>c.level===1&&c.pairId===1).id),touch?'touch':'Enter');await action(page,card(page,CARDS.find(c=>c.level===1&&c.pairId===2).id),touch?'touch':'Space');
    await page.getByRole('button',{name:'Pause test runtime',exact:true}).click();state=await snapshot(page);assert.equal(state.score,-2);assert.equal(state.host.branchIndex,1);
    await page.waitForTimeout(2300);assert.equal((await snapshot(page)).frame,state.frame);assert.equal((await snapshot(page)).pairs,0);
    record.screenshots.push(await shot(page,`${name}-paused-wrong`));await page.getByRole('button',{name:'Pause test runtime',exact:true}).click();await choosing(page);
    record.trace.push({step:'wrong-auto-feedback-pause-and-host-reset',state:await snapshot(page)});
    step=`${name}-blocked-terminal`;await pair(page,1,1,touch?'touch':'Space');assert.equal((await snapshot(page)).pairs,0);
    await page.getByRole('button',{name:'Host fault: reset',exact:true}).click();await page.locator('[data-host-feedback-gate="blocked"]').waitFor();
    state=await snapshot(page);assert.equal(state.frame,27);assert.equal(state.pairs,0);assert.equal(state.completions,0);record.trace.push({step:'blocked-terminal-reset-preserves-gate',state});
    await page.getByRole('button',{name:'Host fault: none',exact:true}).click();await replay(page);
    step=`${name}-replay-active`;await pair(page,1,1,touch?'touch':'Enter');await replay(page);state=await snapshot(page);assert.equal(state.host,null);assert.equal(state.pairs,0);assert.equal(state.revealing,0);
    await pair(page,1,1,touch?'touch':'mouse');await choosing(page);await page.getByRole('button',{name:'Level 2',exact:true}).click();
    state=await snapshot(page);assert.equal(state.score,0);assert.equal(state.pairs,0);assert.equal(state.level,2);await geometry(page,record);
    record.screenshots.push(await shot(page,`${name}-literal-level2`));record.accessibility=await page.locator('[data-p034-action-tree]').ariaSnapshot();
    step=`${name}-six-pairs`;for(let id=1;id<=6;id++){assert.equal((await snapshot(page)).completions,0);await pair(page,2,id,touch?'touch':id%2?'Enter':'Space');
      assert.equal((await snapshot(page)).pairs,id-1);if(id<6)await choosing(page);else await page.locator('[data-feedback-phase="complete"]').waitFor();}
    await page.waitForFunction(()=>document.querySelector('[data-test-loader]')?.getAttribute('data-completions')==='1');state=await snapshot(page);
    assert.equal(state.pairs,6);assert.equal(state.score,60);assert.equal(state.host,null);record.trace.push({step:'six-source-terminals-before-completion',state});
    record.screenshots.push(await shot(page,`${name}-complete`));await replay(page);await finish(page,record);
  }
  step='standalone-fallback-390';{const{page,record}=await mount({width:390,motion:'no-preference',touch:true,permission:true,provided:false,present:false,valid:false});
    await geometry(page,record);record.screenshots.push(await shot(page,'standalone-390-literal-level1'));await pair(page,1,1,'touch');await choosing(page);
    assert.equal((await snapshot(page)).pairs,1);await page.getByRole('button',{name:'Level 2',exact:true}).click();await geometry(page,record);
    await pair(page,2,1,'Space');await replay(page);assert.equal((await snapshot(page)).host,null);record.trace.push({step:'standalone-native-math-and-state',state:await snapshot(page)});await finish(page,record);}
  step='target-lifecycle';{const{page,record}=await mount({width:390,motion:'no-preference',touch:true,permission:true,provided:true,present:false,valid:true});
    await card(page,CARDS[0].id).click();const before=await snapshot(page);assert.equal(before.selected,CARDS[0].id);
    await page.getByRole('button',{name:'Toggle companion target',exact:true}).click();await page.locator('[data-companion-placement="portal"]').waitFor();
    let state=await snapshot(page);assert.equal(state.selected,before.selected);assert.equal(state.audit.length,before.audit.length);await geometry(page,record);
    const second=CARDS.find(c=>c.level===1&&c.pairId===1&&c.id!==CARDS[0].id);await card(page,second.id).tap();await page.getByRole('button',{name:'Pause test runtime',exact:true}).click();
    const held=await snapshot(page);await page.getByRole('button',{name:'Toggle companion target',exact:true}).click();await page.locator('[data-companion-placement="fallback"]').waitFor();
    assert.equal((await snapshot(page)).treeCount,1);assert.equal((await snapshot(page)).host.interactionId,held.host.interactionId);await page.waitForTimeout(2200);assert.equal((await snapshot(page)).frame,held.frame);
    await page.getByRole('button',{name:'Toggle companion target',exact:true}).click();await page.locator('[data-companion-placement="portal"]').waitFor();assert.equal((await snapshot(page)).host.interactionId,held.host.interactionId);
    await page.getByRole('button',{name:'Pause test runtime',exact:true}).click();await choosing(page);assert.equal((await snapshot(page)).pairs,1);
    await page.getByRole('button',{name:'Toggle valid target marker',exact:true}).click();await page.locator('[data-companion-placement="fallback"]').waitFor();
    await page.getByRole('button',{name:'Toggle valid target marker',exact:true}).click();await page.locator('[data-companion-placement="portal"]').waitFor();
    assert.equal((await snapshot(page)).pairs,1);record.trace.push({step:'target-delayed-removed-invalid-with-single-controller',state:await snapshot(page)});
    await page.setViewportSize({width:375,height:1000});await geometry(page,record);record.screenshots.push(await shot(page,'portal-375-preserved-state'));
    await page.setViewportSize({width:844,height:390});await geometry(page,record);record.screenshots.push(await shot(page,'portal-landscape-844'));
    await page.setViewportSize({width:390,height:1000});await page.locator('[data-p034-action-tree]').evaluate(node=>node.style.fontSize='32px');
    await geometry(page,record);record.trace.push({step:'larger-body-text-keeps-math-and-controls-readable',state:await snapshot(page)});await finish(page,record);}
  step='missing-capability';{const{page,record}=await mount({width:390,motion:'reduce',touch:true,permission:false,provided:true,present:true,valid:true});
    assert.equal(await page.locator('[data-source-card-id]:disabled').count(),12);assert.equal((await snapshot(page)).completions,0);await geometry(page,record);await finish(page,record);}
  assert.deepEqual(await Promise.all(files.map(binding)),inputs,'source changed during mounted QA');evidence.status='passed';await save('evidence.json',json(evidence));
  console.log(json({status:'passed',output:OUTPUT,records:records.length}));
}catch(error){evidence.status='failed';evidence.failure={step,message:error.message,state:activePage&&!activePage.isClosed()?await snapshot(activePage):null};
  if(activePage&&!activePage.isClosed())evidence.failure.screenshot=await shot(activePage,'failed-state');await save('evidence.failed.json',json(evidence));
  console.error(json({status:'failed',output:OUTPUT,step,message:error.message}));process.exitCode=1;
}finally{await browser.close();}
