#!/usr/bin/env node
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {G678_ALG_L11_ADVANCED3_TRANCHE_D_ANSWER_KEY} from '../packages/demos/src/g678-alg-l11-advanced3-tranche-d-state.ts';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);assert.ok(args.length===2&&args[0]==='--run'&&/^[a-z0-9-]+$/.test(args[1]));
const OUTPUT=`output/playwright/g678-alg-l11-p044-host-score-${args[1]}`,out=path.join(ROOT,OUTPUT);await mkdir(out);
const ENTRY='scripts/harness-g678-alg-l11-p044-host-score.tsx';
const hash=b=>createHash('sha256').update(b).digest('hex'),json=v=>JSON.stringify(v,null,2)+'\n';
const save=(p,b)=>writeFile(path.join(out,p),b,{flag:'wx'});
async function binding(p){const b=await readFile(path.resolve(ROOT,p));return{path:p,bytes:b.length,sha256:hash(b)};}
const visual=JSON.parse(await readFile(path.join(ROOT,'catalog/g678-alg-l11-d-instructional-candidate-v1.json'),'utf8'));
const paths=[...new Set([...visual.files.map(f=>f.path),ENTRY,'scripts/qa-g678-alg-l11-p044-host-score.mjs',
  'packages/demos/src/g678-alg-l11-p044-host-score-candidate.tsx','packages/demos/tests/g678-alg-l11-p044-host-score-candidate.test.ts',
  'catalog/g678-alg-l11-d-instructional-candidate-v1.json'])];
for(const f of visual.files)assert.deepEqual(await binding(f.path),f,'frozen D visual candidate changed');
const inputs=await Promise.all(paths.map(binding));await save('inputs.json',json(inputs));
const bundle=await build({entryPoints:[path.join(ROOT,ENTRY)],bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',
  define:{'process.env.NODE_ENV':'"production"'},metafile:true,
  alias:{'@helpmath/demos/runtime':path.join(ROOT,'packages/demos/src/runtime.ts'),'@helpmath/demos/prototype-manifest':path.join(ROOT,'packages/demos/src/prototype-manifest.ts')},
  plugins:[{name:'p044-score-only-test-loader',setup(b){b.onResolve({filter:/^@\/lib\/load-animation-module\.client$/},()=>({path:'p044-score-loader',namespace:'score-test'}));
    b.onLoad({filter:/.*/,namespace:'score-test'},()=>({contents:'export async function loadClientAnimationModule(key){return window.__D_SCORE_MODULES[key];}',loader:'js'}));}}]});
const script=bundle.outputFiles[0].text;await save('harness.js',script);await save('esbuild-inputs.json',json(bundle.metafile.inputs));
const browser=await chromium.launch({headless:true});const records=[];let step='mount',activePage;
const evidence={artifactType:'p044-source-typed-host-score-mounted-candidate-qa',inputs,harness:{bytes:Buffer.byteLength(script),sha256:hash(script)},
  browser:{version:browser.version(),executable:await binding(chromium.executablePath())},records,
  boundary:'Actual AnimationRuntime and real memory-only fq-scoring host via explicit unregistered test-loader; no raw answer in host payload',
  registered:false,productCalibrationPassed:false,authoritativeOriginalRuntime:false,visualFidelityAccepted:false,audioAccepted:false,
  humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,released:false,published:false};
async function snapshot(page){return page.evaluate(()=>{const host=document.querySelector('[data-test-loader]'),adapter=document.querySelector('[data-host-score-successor]');
  return{question:document.querySelector('[data-source-question]')?.getAttribute('data-source-question'),selection:document.querySelector('[data-random-selection]')?.getAttribute('data-random-selection'),
    gate:adapter?.getAttribute('data-host-score-gate'),ack:adapter?.getAttribute('data-host-acknowledged-source-questions'),
    attempted:Number(host?.getAttribute('data-real-host-attempted')),correct:Number(host?.getAttribute('data-real-host-correct')),
    awarded:Number(host?.getAttribute('data-real-host-awarded')),possible:Number(host?.getAttribute('data-real-host-possible')),
    sourceIds:host?.getAttribute('data-real-host-source-ids'),completions:Number(host?.getAttribute('data-completions')),
    audit:window.__D_SCORE_AUDIT};});}
async function shot(page,name){const bytes=await page.screenshot({fullPage:true});await save(name+'.png',bytes);return{path:`${OUTPUT}/${name}.png`,bytes:bytes.length,sha256:hash(bytes)};}
async function mount(permission,motion){const page=await browser.newPage({viewport:{width:1100,height:1000},reducedMotion:motion});activePage=page;
  const record={permission,motion,errors:[],requests:[],trace:[],status:'running'};records.push(record);
  page.on('pageerror',error=>record.errors.push(error.message));page.on('console',message=>{if(message.type()==='error')record.errors.push(message.text());});
  await page.route('**/*',route=>{record.requests.push(route.request().url());return route.abort();});
  await page.setContent('<html><head><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:"><style>body{margin:0;font-family:Arial}.runtime-stage{width:800px}.runtime-stage svg{max-width:100%}button:focus-visible{outline:3px solid #b45309}</style></head><body><div id="root"></div></body></html>');
  await page.evaluate(config=>{window.__D_SCORE_CASE=config;},{permission,seed:31});await page.addScriptTag({content:script});
  await page.locator(`[data-host-score-gate="${permission?'ready':'blocked'}"]`).waitFor();return{page,record};}
async function finish(page,record){record.final=await snapshot(page);assert.deepEqual(record.errors,[]);assert.deepEqual(record.requests,[]);
  for(const entry of record.final.audit){const keys=Object.keys(entry.request);if(entry.request.type==='record-fq-score')assert.deepEqual(keys,['type','questionId','correct','pointsAwarded','pointsPossible']);else assert.deepEqual(keys,['type']);}
  record.status='passed';await page.close();}
async function answer(page,index){const before=await snapshot(page);const q=Number(before.question.slice(1));
  const correct=G678_ALG_L11_ADVANCED3_TRANCHE_D_ANSWER_KEY[q-1],option=index%2?correct:correct%4+1;
  const button=page.locator(`[data-source-instance-name="A${q}Opt${option}"]`);if(index%2){await button.focus();await page.keyboard.press('Enter');}else await button.click();return before;}
async function waitReset(page){await page.waitForFunction(()=>document.querySelector('[data-host-score-gate]')?.getAttribute('data-host-score-gate')==='ready'&&document.querySelector('[data-test-loader]')?.getAttribute('data-real-host-attempted')==='0');}
try{
  for(const motion of['no-preference','reduce']){
    step=`${motion}:bootstrap`;const{page,record}=await mount(true,motion);assert.equal((await snapshot(page)).attempted,0);assert.equal((await snapshot(page)).completions,0);
    await answer(page,0);await answer(page,1);let state=await snapshot(page);assert.equal(state.attempted,2);assert.equal(state.ack.split(',').length,2);
    record.trace.push({step:'two-real-host-records',state});
    step=`${motion}:blocked-score`;
    await page.getByRole('button',{name:'Reject next score records in real host',exact:true}).click();const before=await snapshot(page);
    await answer(page,2);await page.locator('[data-host-score-gate="blocked"]').waitFor();state=await snapshot(page);
    assert.equal(state.question,before.question);assert.equal(state.attempted,2);assert.equal(state.ack,before.ack);assert.equal(state.completions,0);
    assert.equal(await page.locator('button[data-source-instance-name]:disabled').count(),4);
    assert.equal(state.audit.at(-1).status,'blocked');assert.equal(state.audit.at(-1).code,'invalid-request');
    record.blockedScreenshot=await shot(page,`blocked-score-${motion}`);record.trace.push({step:'real-host-rejected-no-local-advance',state});
    step=`${motion}:replay-real-reset`;
    await page.getByRole('button',{name:'Reject next score records in real host',exact:true}).click();
    await page.getByRole('button',{name:'Replay quiz and reset score',exact:true}).click();await waitReset(page);state=await snapshot(page);
    assert.equal(state.awarded,0);assert.equal(state.possible,0);assert.equal(state.sourceIds,'');assert.equal(state.ack,'');assert.notEqual(state.selection,before.selection);
    record.trace.push({step:'replay-reset-real-host',state});
    step=`${motion}:ten-allowed-before-completion`;
    for(let index=0;index<10;index++){
      state=await snapshot(page);assert.equal(state.completions,0);assert.equal(state.attempted,index);assert.equal(state.gate,'ready');
      await answer(page,index);await page.waitForFunction(n=>document.querySelector('[data-test-loader]')?.getAttribute('data-real-host-attempted')===String(n),index+1);
    }
    await page.getByText('Score: 5 / 10',{exact:true}).waitFor();await page.waitForFunction(()=>document.querySelector('[data-test-loader]')?.getAttribute('data-completions')==='1');
    state=await snapshot(page);assert.equal(state.awarded,5);assert.equal(state.correct,5);assert.equal(state.possible,10);
    assert.deepEqual(state.sourceIds.split(','),state.selection.split(',').map(q=>`shared-alg001-l11-p044-q${q}`));assert.equal(state.ack,state.sourceIds);
    record.resultScreenshot=await shot(page,`real-host-score-results-${motion}`);record.trace.push({step:'ten-real-host-acks-before-completion',state});
    step=`${motion}:review-preserved`;
    await page.getByRole('button',{name:'Review answers',exact:true}).click();
    for(let index=0;index<10;index++){
      const label=index<9?'Next review':'Finish review';await page.getByRole('button',{name:'Pause test runtime',exact:true}).click();
      assert.equal(await page.getByRole('button',{name:label,exact:true}).isDisabled(),true);
      await page.getByRole('button',{name:'Pause test runtime',exact:true}).click();
      assert.equal(await page.locator('[data-review-selected="true"]').count(),1);assert.equal(await page.locator('[data-review-correct="true"]').count(),1);
      assert.equal((await snapshot(page)).attempted,10);await page.getByRole('button',{name:label,exact:true}).click();
    }
    assert.equal((await snapshot(page)).awarded,5);assert.equal((await snapshot(page)).completions,1);
    await page.locator('[data-host-score-successor]').getByRole('button',{name:'Replay',exact:true}).click();await waitReset(page);
    record.trace.push({step:'post-review-replay-cleared-real-score',state:await snapshot(page)});await finish(page,record);
  }
  step='missing-host-capability-fail-closed';{
    const{page,record}=await mount(false,'reduce');assert.equal((await snapshot(page)).gate,'blocked');assert.equal((await snapshot(page)).completions,0);
    assert.equal(await page.locator('button[data-source-instance-name]:disabled').count(),4);assert.equal((await snapshot(page)).audit[0].status,'blocked');
    record.screenshot=await shot(page,'missing-host-scoring-capability');await finish(page,record);
  }
  assert.deepEqual(await Promise.all(paths.map(binding)),inputs);evidence.status='passed';await save('evidence.json',json(evidence));
  console.log(json({status:'passed',output:OUTPUT,records:records.length}));
}catch(error){evidence.status='failed';evidence.failure={step,message:error.message,state:activePage&&!activePage.isClosed()?await snapshot(activePage):null};
  if(activePage&&!activePage.isClosed())evidence.failure.screenshot=await shot(activePage,'failed-state');await save('evidence.failed.json',json(evidence));
  console.error(json({status:'failed',output:OUTPUT,...evidence.failure}));process.exitCode=1;
}finally{await browser.close();}
