#!/usr/bin/env node
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS as CARDS} from '../packages/demos/src/g678-alg-l11-advanced3-tranche-d-state.ts';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);assert.ok(args.length===2&&args[0]==='--run'&&/^[a-z0-9-]+$/.test(args[1]));
const OUTPUT=`output/playwright/g678-alg-l11-p034-feedback-${args[1]}`,out=path.join(ROOT,OUTPUT);await mkdir(out);
const ENTRY='scripts/harness-g678-alg-l11-p034-feedback.tsx';
const hash=b=>createHash('sha256').update(b).digest('hex'),json=x=>JSON.stringify(x,null,2)+'\n';
const save=(p,b)=>writeFile(path.join(out,p),b,{flag:'wx'});
async function binding(p){const b=await readFile(path.resolve(ROOT,p));return{path:p,bytes:b.length,sha256:hash(b)};}
const predecessor=JSON.parse(await readFile(path.join(ROOT,'catalog/g678-alg-l11-d-instructional-candidate-v1.json'),'utf8'));
const files=[...new Set([...predecessor.files.map(f=>f.path),ENTRY,'scripts/qa-g678-alg-l11-p034-feedback.mjs',
  'packages/demos/src/g678-alg-l11-p034-feedback-candidate.tsx','packages/demos/src/generated/g678-alg-l11-p034-feedback-v1.ts',
  'packages/demos/tests/g678-alg-l11-p034-feedback-candidate.test.ts','work/g678-shared-page-factory/g678-alg-l11-p034-feedback-generated-v1/run.json'])];
const inputs=await Promise.all(files.map(binding));await save('inputs.json',json(inputs));
const bundle=await build({entryPoints:[path.join(ROOT,ENTRY)],bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',
  define:{'process.env.NODE_ENV':'"production"'},metafile:true,
  alias:{'@helpmath/demos/runtime':path.join(ROOT,'packages/demos/src/runtime.ts'),'@helpmath/demos/prototype-manifest':path.join(ROOT,'packages/demos/src/prototype-manifest.ts')},
  plugins:[{name:'p034-feedback-test-loader',setup(b){b.onResolve({filter:/^@\/lib\/load-animation-module\.client$/},()=>({path:'p034-loader',namespace:'p034-test'}));
    b.onLoad({filter:/.*/,namespace:'p034-test'},()=>({contents:'export async function loadClientAnimationModule(key){return window.__P034_TEST_MODULES[key];}',loader:'js'}));}}]});
const script=bundle.outputFiles[0].text;await save('harness.js',script);await save('esbuild-inputs.json',json(bundle.metafile.inputs));
const browser=await chromium.launch({headless:true}),records=[];let step='mount',activePage;
const evidence={artifactType:'p034-source-feedback-typed-host-mounted-candidate-qa',inputs,harness:{bytes:Buffer.byteLength(script),sha256:hash(script)},
  browser:{version:browser.version(),executable:await binding(chromium.executablePath())},records,
  boundary:'Actual AnimationRuntime and real memory-only practice host via explicit unregistered test-loader; original audio extracted but NOT routed/played; no network/server',
  registered:false,productCalibrationPassed:false,authoritativeOriginalRuntime:false,visualFidelityAccepted:false,audioIntegrated:false,audioAccepted:false,
  humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,released:false,published:false};
async function snapshot(page){return page.evaluate(()=>{const s=document.querySelector('[data-p034-feedback-successor]'),h=document.querySelector('[data-test-loader]');
  return{level:Number(s?.getAttribute('data-source-level')),gate:s?.getAttribute('data-host-feedback-gate'),phase:s?.getAttribute('data-feedback-phase'),
    score:Number(s?.getAttribute('data-source-score')),pairs:Number(s?.getAttribute('data-source-completed-pair-count')),
    revealing:Number(s?.getAttribute('data-source-revealing-pair-count')),frame:Number(s?.getAttribute('data-source-feedback-frame')),
    visualFrame:Number(s?.getAttribute('data-source-feedback-visual-frame')),elapsed:Number(s?.getAttribute('data-source-feedback-elapsed')),
    character:s?.getAttribute('data-source-feedback-character'),host:JSON.parse(h?.getAttribute('data-real-host-feedback')||'null'),
    completions:Number(h?.getAttribute('data-completions')),audit:window.__P034_AUDIT};});}
async function shot(page,name){const b=await page.screenshot({fullPage:true});await save(name+'.png',b);return{path:`${OUTPUT}/${name}.png`,bytes:b.length,sha256:hash(b)};}
async function mount(permission,motion,width){const page=await browser.newPage({viewport:{width,height:1100},reducedMotion:motion});activePage=page;
  const record={permission,motion,width,errors:[],requests:[],trace:[],status:'running'};records.push(record);
  page.on('pageerror',e=>record.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')record.errors.push(m.text());});
  await page.route('**/*',route=>{record.requests.push(route.request().url());return route.abort();});
  await page.setContent('<html><head><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:"><style>body{margin:0;font-family:Arial}.runtime-stage{width:100%;max-width:800px}.runtime-stage svg{max-width:100%}button:focus-visible{outline:3px solid #b45309}</style></head><body><div id="root"></div></body></html>');
  await page.evaluate(value=>{window.__P034_CASE={permission:value};},permission);await page.addScriptTag({content:script});
  await page.locator(`[data-host-feedback-gate="${permission?'ready':'blocked'}"]`).waitFor();return{page,record};}
const card=(page,id)=>page.locator(`[data-source-card-id="${id}"]`);
async function pair(page,level,pairId,keyboard=false){const cards=CARDS.filter(c=>c.level===level&&c.pairId===pairId);
  await card(page,cards[0].id).click();if(keyboard){await card(page,cards[1].id).focus();await page.keyboard.press('Enter');}else await card(page,cards[1].id).click();}
async function waitChoosing(page){await page.locator('[data-feedback-phase="choosing"][data-host-feedback-gate="ready"]').waitFor();}
async function replay(page){await page.locator('[data-p034-feedback-successor]').getByRole('button',{name:'Replay',exact:true}).click();
  await page.waitForFunction(()=>{const s=document.querySelector('[data-p034-feedback-successor]');return s?.getAttribute('data-host-feedback-gate')==='ready'&&s?.getAttribute('data-source-score')==='0'&&s?.getAttribute('data-feedback-phase')==='choosing';});}
async function finish(page,record){record.final=await snapshot(page);assert.deepEqual(record.errors,[]);assert.deepEqual(record.requests,[]);
  for(const entry of record.final.audit)assert.deepEqual(Object.keys(entry.request),entry.request.type==='record-practice-feedback'
    ?['type','interactionId','outcome','branchIndex','branchCount']:entry.request.interactionId?['type','interactionId']:['type']);
  assert.equal(await page.getByRole('button',{name:'Continue',exact:true}).count(),0);
  record.status='passed';await page.close();}
try{
  for(const[motion,width]of[['no-preference',1100],['reduce',390]]){
    const name=`${motion}-${width}`;step=`${name}:mount`;const{page,record}=await mount(true,motion,width);
    assert.equal((await snapshot(page)).completions,0);
    step=`${name}:blocked-record`;await page.getByRole('button',{name:'Host fault: record',exact:true}).click();await pair(page,1,1);
    let state=await snapshot(page);assert.equal(state.gate,'blocked');assert.equal(state.score,0);assert.equal(state.pairs,0);assert.equal(state.revealing,0);assert.equal(state.host,null);
    record.trace.push({step:'blocked-record-before-local-outcome',state});await page.getByRole('button',{name:'Host fault: none',exact:true}).click();await replay(page);
    step=`${name}:wrong-auto-pause`;
    await card(page,CARDS.find(c=>c.level===1&&c.pairId===1).id).click();await card(page,CARDS.find(c=>c.level===1&&c.pairId===2).id).click();
    await page.waitForFunction(()=>Number(document.querySelector('[data-source-feedback-frame]')?.getAttribute('data-source-feedback-frame'))>=5);
    await page.getByRole('button',{name:'Pause test runtime',exact:true}).click();state=await snapshot(page);
    assert.equal(state.score,-2);assert.equal(state.pairs,0);assert.equal(state.character,'105');assert.equal(state.host.branchIndex,1);
    await page.waitForTimeout(2400);const held=await snapshot(page);assert.equal(held.frame,state.frame);assert.equal(held.pairs,0);assert.equal(held.phase,'wrong-feedback');
    record.wrongScreenshot=await shot(page,`wrong-paused-${name}`);await page.getByRole('button',{name:'Pause test runtime',exact:true}).click();await waitChoosing(page);
    state=await snapshot(page);assert.equal(state.host,null);assert.equal(state.score,-2);record.trace.push({step:'wrong-terminal-automatic-reset-after-pause',state});
    step=`${name}:correct-pair-counter`;
    await pair(page,1,1,true);state=await snapshot(page);assert.equal(state.score,8);assert.equal(state.revealing,1);assert.equal(state.pairs,0);assert.equal(state.character,'118');assert.equal(state.host.branchIndex,2);
    await page.waitForTimeout(480);await page.getByRole('button',{name:'Pause test runtime',exact:true}).click();state=await snapshot(page);
    assert.equal(state.pairs,0);assert.equal(await page.locator('[data-source-fade-tick="4"]').count(),2);
    record.correctScreenshot=await shot(page,`correct-paused-${name}`);await page.waitForTimeout(2200);assert.equal((await snapshot(page)).frame,state.frame);
    await page.getByRole('button',{name:'Pause test runtime',exact:true}).click();await waitChoosing(page);assert.equal((await snapshot(page)).pairs,1);
    record.trace.push({step:'correct-pair-count-only-at-terminal',state:await snapshot(page)});
    step=`${name}:blocked-terminal-reset`;await pair(page,1,2);await page.getByRole('button',{name:'Host fault: reset',exact:true}).click();
    await page.locator('[data-host-feedback-gate="blocked"]').waitFor();state=await snapshot(page);assert.equal(state.pairs,1);assert.equal(state.frame,27);assert.equal(state.completions,0);assert.ok(state.host);
    record.trace.push({step:'blocked-terminal-reset-holds-pair-count',state});await page.getByRole('button',{name:'Host fault: none',exact:true}).click();await replay(page);
    step=`${name}:replay-mid-feedback`;await pair(page,1,1);await replay(page);state=await snapshot(page);assert.equal(state.host,null);assert.equal(state.revealing,0);assert.equal(state.pairs,0);assert.equal(state.frame,1);
    step=`${name}:level-full-reset`;await pair(page,1,1);await waitChoosing(page);await page.getByRole('button',{name:'Level 2',exact:true}).click();state=await snapshot(page);
    assert.equal(state.level,2);assert.equal(state.score,0);assert.equal(state.pairs,0);assert.equal(state.revealing,0);assert.equal(state.host,null);
    record.trace.push({step:'level-change-clears-game-clock-and-host',state});
    step=`${name}:six-automatic-pairs`;
    for(let pairId=1;pairId<=6;pairId++){
      assert.equal((await snapshot(page)).completions,0);await pair(page,2,pairId,pairId%2===0);assert.equal((await snapshot(page)).pairs,pairId-1);
      if(pairId<6)await waitChoosing(page);else await page.locator('[data-feedback-phase="complete"]').waitFor();
    }
    await page.waitForFunction(()=>document.querySelector('[data-test-loader]')?.getAttribute('data-completions')==='1');
    state=await snapshot(page);assert.equal(state.score,60);assert.equal(state.pairs,6);assert.equal(state.host,null);assert.equal(state.revealing,6);
    assert.equal(await page.locator('[data-source-revealed-tile]').count(),12);record.completeScreenshot=await shot(page,`source-six-pair-complete-${name}`);
    record.trace.push({step:'six-source-feedback-terminals-before-completion',state});await replay(page);assert.equal((await snapshot(page)).host,null);await finish(page,record);
  }
  step='missing-practice-capability';{const{page,record}=await mount(false,'reduce',390);const state=await snapshot(page);
    assert.equal(state.gate,'blocked');assert.equal(state.completions,0);assert.equal(await page.locator('[data-source-card-id]:disabled').count(),12);record.screenshot=await shot(page,'missing-practice-capability');await finish(page,record);}
  assert.deepEqual(await Promise.all(files.map(binding)),inputs,'source changed during mounted QA');evidence.status='passed';await save('evidence.json',json(evidence));
  console.log(json({status:'passed',output:OUTPUT,records:records.length}));
}catch(error){evidence.status='failed';evidence.failure={step,message:error.message,state:activePage&&!activePage.isClosed()?await snapshot(activePage):null};
  if(activePage&&!activePage.isClosed())evidence.failure.screenshot=await shot(activePage,'failed-state');await save('evidence.failed.json',json(evidence));
  console.error(json({status:'failed',output:OUTPUT,step,message:error.message}));process.exitCode=1;
}finally{await browser.close();}
