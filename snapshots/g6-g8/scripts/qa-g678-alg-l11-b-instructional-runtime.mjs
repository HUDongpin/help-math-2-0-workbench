#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),run=args[args.indexOf('--run')+1];
assert.ok(args.includes('--run')&&/^[a-z0-9-]+$/.test(run),'--run <exclusive-name> required');
const selected=args.includes('--page')?args[args.indexOf('--page')+1]:null;
const OUTPUT=`output/playwright/g678-alg-l11-b-instructional-${run}`,out=path.join(ROOT,OUTPUT);
const sha=b=>createHash('sha256').update(b).digest('hex'),json=v=>JSON.stringify(v,null,2)+'\n';
const save=(name,bytes)=>writeFile(path.join(out,name),bytes,{flag:'wx'});
const bind=async file=>{const bytes=await readFile(path.resolve(ROOT,file));return {path:file,bytes:bytes.length,sha256:sha(bytes)};};
const suffixes=['026','027','028','029','030','031','032','040','041','042'];
const fixture=new Map();const paths=[];
for(const suffix of suffixes){
 const id=`shared-alg001-l11-p${suffix}`,v=Number(suffix)>=40?4:3;
 const b=`work/g678-shared-page-factory/g678-alg-l11-b-instructional-visuals-v${v}/${id}/vector-bundle.json`;
 const g=`work/g678-shared-page-factory/g678-alg-l11-b-source-glossary-v1/${id}.json`;
 const e=Number(suffix)>=40?`work/g678-shared-page-factory/g678-alg-l11-b-guided-explanation-vectors-v1/${id}/explanation-bundle.json`:null;
 paths.push(b,g,...e?[e]:[]);
 fixture.set(id,{animationId:id,bundle:JSON.parse(await readFile(path.join(ROOT,b))),glossary:JSON.parse(await readFile(path.join(ROOT,g))),
  ...e?{explanations:JSON.parse(await readFile(path.join(ROOT,e)))}:{}});
}
const audit=JSON.parse(await readFile(path.join(ROOT,'catalog/g678-alg-l11-behavior10-tranche-b-audit-v1.json')));
const ENTRY='scripts/harness-g678-alg-l11-b-instructional-runtime.tsx';
const inputFiles=[ENTRY,'scripts/qa-g678-alg-l11-b-instructional-runtime.mjs','apps/web/components/animation-runtime.tsx',
 'apps/web/components/loaded-swf-host-canvas.tsx','apps/web/lib/descriptor-driven-glossary-pause.ts',
 'packages/demos/src/runtime.ts','packages/demos/src/contract.ts','packages/demos/src/lesson-host-contract.ts',
 'packages/demos/src/g678-alg-l11-b-instructional-visuals.tsx','packages/demos/src/g678-alg-l11-b-source-feedback.generated.ts',
 'packages/demos/src/g678-alg-l11-b-nested-help-close.generated.ts',
 'packages/demos/src/g678-alg-l11-behavior10-tranche-b-candidate-core.tsx','packages/demos/src/g678-alg-l11-behavior10-tranche-b-state.ts',
 ...paths];
await mkdir(out);
const inputs=await Promise.all(inputFiles.map(bind));await save('inputs.json',json(inputs));
const compiled=await build({entryPoints:[path.join(ROOT,ENTRY)],bundle:true,write:false,platform:'browser',format:'iife',
 jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},metafile:true,
 alias:{'@helpmath/demos/runtime':path.join(ROOT,'packages/demos/src/runtime.ts'),
  '@helpmath/demos/prototype-manifest':path.join(ROOT,'packages/demos/src/prototype-manifest.ts')},
 plugins:[{name:'explicit-unregistered-b10-test-loader',setup(b){
  b.onResolve({filter:/^@\/lib\/load-animation-module\.client$/},()=>({path:'b10-only',namespace:'b10-test-loader'}));
  b.onLoad({filter:/.*/,namespace:'b10-test-loader'},()=>({contents:'export async function loadClientAnimationModule(key){return window.__B10_TEST_MODULES[key];}',loader:'js'}));
 }}]});
const script=compiled.outputFiles[0].text;
await save('harness.js',script);await save('esbuild-inputs.json',json(compiled.metafile.inputs));
assert.deepEqual(await Promise.all(inputFiles.map(bind)),inputs,'Source changed during build');
const browser=await chromium.launch({headless:true});
const records=[];
const evidence={artifactType:'g678-alg-l11-b10-mounted-runtime-qa-v1',generatedAt:new Date().toISOString(),output:OUTPUT,
 boundary:'actual-AnimationRuntime-real-memory-host-explicit-local-test-loader-no-registry-no-Next-no-server',
 virtualClock:'Playwright Clock runFor drives Date/performance/RAF in-order; source runtime and stop engine unmodified; no frame query or seek injected',
 inputs,harness:{bytes:Buffer.byteLength(script),sha256:sha(script)},browser:{version:browser.version(),executable:await bind(chromium.executablePath())},
 records,registered:false,productCalibrationPassed:false,authoritativeOriginalRuntime:false,visualFidelityAccepted:false,audioAccepted:false,
 humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,released:false,published:false};
async function snapshot(page){return page.evaluate(()=>{
 const r=document.querySelector('[data-runtime-transport]'),b=document.querySelector('[data-vector-successor]'),h=document.querySelector('[data-test-loader]');
 return {frame:Number(b?.getAttribute('data-main-frame')),phase:b?.getAttribute('data-phase'),
  held:r?.getAttribute('data-runtime-interactive-stop-held'),resolved:Number(r?.getAttribute('data-runtime-interactive-stop-resolved-count')),
  paused:r?.getAttribute('data-runtime-paused'),replay:Number(r?.getAttribute('data-runtime-replay')),
  explanationFrame:b?.getAttribute('data-explanation-child-frame'),hostFeedback:h?.getAttribute('data-host-feedback-active'),
  glossary:h?.getAttribute('data-host-glossary-entry'),completions:Number(h?.getAttribute('data-test-completion-count')),
  controls:[...document.querySelectorAll('[data-vector-successor] [role="button"]')].map(e=>({label:e.getAttribute('aria-label'),disabled:e.getAttribute('aria-disabled'),
   id:e.getAttribute('data-source-hit-instance')})),audit:window.__B10_AUDIT};
 });}
async function capture(page,name){const bytes=await page.screenshot({fullPage:true});await save(name+'.png',bytes);return {path:`${OUTPUT}/${name}.png`,bytes:bytes.length,sha256:sha(bytes)};}
async function advance(page,ms,virtual){if(virtual)await page.clock.runFor(ms);else await page.waitForTimeout(ms);}
async function expect(page,want,virtual){
 for(let i=0;i<30;i++){const s=await snapshot(page);if(Object.entries(want).every(([k,v])=>s[k]===v))return s;await advance(page,virtual?40:60,virtual);}
 assert.deepEqual(Object.fromEntries(Object.keys(want).map(k=>[k,undefined])),want,`State timeout: ${JSON.stringify(await snapshot(page))}`);
}
async function heldAt(page,frame,virtual){
 for(let i=0;i<8;i++){const s=await snapshot(page);if(s.frame===frame&&s.held==='true')return s;
  const ms=Math.max(120,Math.ceil((frame-(s.frame||1))*1000/12)+150);await advance(page,ms,virtual);}
 throw Error(`No source stop at ${frame}: ${JSON.stringify(await snapshot(page))}`);
}
async function activate(page,locator,input,virtual){
 assert.equal(await locator.count(),1,'Ambiguous/missing control');
 assert.notEqual(await locator.getAttribute('aria-disabled'),'true','Source control disabled');
 assert.equal(await locator.isDisabled(),false,'Native control disabled');
 if(input==='mouse'){
  const box=await locator.boundingBox();assert.ok(box&&box.width>0&&box.height>0);
  await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
 }else{await locator.focus();await page.keyboard.press(input);}
 await advance(page,50,virtual);
}
async function button(page,name,input,virtual){await activate(page,page.getByRole('button',{name,exact:true}),input,virtual);}
async function replay(page,virtual){const old=(await snapshot(page)).replay;await button(page,'Replay','mouse',virtual);
 for(let i=0;i<10;i++){const s=await snapshot(page);if(s.replay>old){assert.equal(s.resolved,0);assert.equal(s.hostFeedback,'false');return s;}await advance(page,50,virtual);}throw Error('Replay epoch did not change');}

async function traverse(page,f,record,virtual,exercise){
 const m=audit.members.find(m=>m.animationId===f.animationId);
 const frames=[...new Set(m.sourceStateMachine.guidedHits.map(h=>h.frame))];
 for(const frame of frames){
  await heldAt(page,frame,virtual);await expect(page,{phase:'guided-stop'},virtual);
  const branch=f.explanations?.branches.find(b=>b.mainFrame===frame);
  if(branch&&exercise){
   record.step=`guided-${frame}-wrong-open`;
   await button(page,'Show the explanation for this answer','mouse',virtual);
   await advance(page,1400,virtual);await expect(page,{explanationFrame:'15',held:'true',frame},virtual);
   record.trace.push({step:`explanation-${branch.name}-stopped15`,state:await snapshot(page)});
   record.screenshots.push(await capture(page,`${record.name}-${branch.name}-15`));
   await button(page,'Pause test runtime','mouse',virtual);await expect(page,{paused:'true'},virtual);
   await advance(page,400,virtual);assert.equal((await snapshot(page)).explanationFrame,'15');
   assert.equal(await page.getByRole('button',{name:'Close explanation',exact:true}).getAttribute('aria-disabled'),'true');
   await button(page,'Pause test runtime','mouse',virtual);await expect(page,{paused:'false'},virtual);
   record.step=`guided-${frame}-close`;
   await button(page,'Close explanation','Enter',virtual);await advance(page,500,virtual);
   await expect(page,{explanationFrame:'none',frame,held:'true'},virtual);
   record.trace.push({step:`explanation-${branch.name}-closed16-to20`,state:await snapshot(page)});
  }
  record.step=`guided-${frame}-correct`;
  const authored=page.getByRole('button',{name:'Continue the guided solution',exact:true});
  if(await authored.count())await activate(page,authored.first(),exercise?'Space':'mouse',virtual);
  else{
   const maintained=page.locator('button[data-maintained-empty-source-hit-adapter="true"]');
   assert.equal(await maintained.count(),1,'Missing explicit empty-source-hit adapter');
   await activate(page,maintained,exercise?'Enter':'mouse',virtual);
  }
  const expected=frames.indexOf(frame)+1;
  await expect(page,{resolved:expected},virtual);
  record.trace.push({step:`guided-${frame}-resolved`,state:await snapshot(page)});
 }
 await heldAt(page,m.sourceStateMachine.quizFrame,virtual);await expect(page,{phase:'choosing',held:'true'},virtual);
 return m;
}
async function glossaryCheck(page,f,record,virtual){
 const first=page.getByRole('button',{name:/^Define /}).first();assert.ok(await first.count());
 const label=await first.getAttribute('aria-label'),key=label.replace(/^Define /,'');
 const entry=f.glossary.entries.find(e=>e.key===key);assert.ok(entry,'Source bilingual definition missing');
 await activate(page,first,'Enter',virtual);await expect(page,{paused:'true',glossary:entry.id},virtual);
 assert.equal(await page.locator('[data-glossary-definition]').textContent(),entry.definitions.en);
 const pausedFrame=(await snapshot(page)).frame;await advance(page,500,virtual);assert.equal((await snapshot(page)).frame,pausedFrame);
 await button(page,'Toggle glossary language','mouse',virtual);
 assert.equal(await page.locator('[data-glossary-definition]').textContent(),entry.definitions.es);
 record.trace.push({step:'source-glossary-en-es-pauses-clock',entryId:entry.id,en:entry.definitions.en,es:entry.definitions.es,state:await snapshot(page)});
 record.screenshots.push(await capture(page,`${record.name}-glossary-es`));
 await button(page,'Close glossary','Space',virtual);await expect(page,{paused:'false',glossary:''},virtual);
 await button(page,'Toggle glossary language','mouse',virtual);
}
async function p030Math(page){
 const stage=await page.locator('[data-vector-successor]').boundingBox();const png=PNG.sync.read(await page.screenshot());
 const scale=stage.width/800;const pixel=(x,y)=>{const i=(Math.round(stage.y+y*scale)*png.width+Math.round(stage.x+x*scale))*4;return [...png.data.subarray(i,i+3)];};
 const left=pixel(181,150),right=pixel(365,150);assert.ok(left.every(c=>c<50)&&right.every(c=>c<50),'Closed source endpoints became open');
 return {sourceExpression:'|x| ≤ 5',sourceBoundary:'closed -5 and5',left,right,
  inspectedSourceVectorQuizFrame:63};
}

const cases=[];
for(const id of fixture.keys())if(!selected||id.endsWith(selected))cases.push({id,virtual:true,motion:'no-preference',viewport:{width:1100,height:950}});
if(!selected||selected==='026')cases.push({id:'shared-alg001-l11-p026',virtual:true,motion:'reduce',viewport:{width:390,height:844}});
if(!selected||selected==='040')cases.push({id:'shared-alg001-l11-p040',virtual:true,motion:'reduce',viewport:{width:1100,height:950}});
if(!selected)for(const suffix of ['029','030'])cases.push({id:`shared-alg001-l11-p${suffix}`,virtual:false,motion:'no-preference',viewport:{width:1100,height:950}});
async function runCase(c){
 const f=fixture.get(c.id),name=`${c.id}-${c.virtual?'virtual':'natural'}-${c.motion}`;
 const page=await browser.newPage({viewport:c.viewport,reducedMotion:c.motion});
 const record={name,animationId:c.id,clock:c.virtual?'Playwright deterministic virtual clock':'actual browser wall clock',motion:c.motion,viewport:c.viewport,
  status:'running',step:'mount',trace:[],screenshots:[],errors:[],requests:[]};records.push(record);
 page.on('pageerror',e=>record.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')record.errors.push(m.text());});
 await page.route('**/*',route=>{record.requests.push(route.request().url());return route.abort();});
 try{
  if(c.virtual)await page.clock.install({time:new Date('2026-09-06T00:00:00Z')});
  await page.setContent('<html><head><meta http-equiv="Content-Security-Policy" content="default-src \'none\';script-src \'unsafe-inline\';style-src \'unsafe-inline\';img-src data:"><style>body{margin:0;background:#fff;font-family:Arial}button{min-height:36px;margin:3px}*{box-sizing:border-box}</style></head><body><div id="root"></div></body></html>');
  await page.evaluate(data=>{window.__B10_CASE=data;},f);await page.addScriptTag({content:script});
  await page.locator('[data-vector-successor]').waitFor({timeout:10_000});
  if(c.virtual)await page.clock.pauseAt((await page.evaluate(()=>Date.now()))+50);
  record.initial=await snapshot(page);
  record.step='first-source-traversal';const m=await traverse(page,f,record,c.virtual,true);
  record.screenshots.push(await capture(page,`${name}-quiz`));
  if(c.id.endsWith('030'))record.math=await p030Math(page);
  record.step='pause';await button(page,'Pause test runtime','mouse',c.virtual);await expect(page,{paused:'true'},c.virtual);
  assert.ok((await snapshot(page)).controls.every(x=>x.disabled==='true'),'Paused source control remained enabled');
  assert.equal(await page.getByRole('button',{name:'Replay',exact:true}).isDisabled(),true);
  await button(page,'Pause test runtime','mouse',c.virtual);await expect(page,{paused:'false'},c.virtual);
  record.step='help';await button(page,'Need more help','Enter',c.virtual);await expect(page,{phase:'help-open'},c.virtual);
  record.screenshots.push(await capture(page,`${name}-help`));
  await glossaryCheck(page,f,record,c.virtual);
  await button(page,'Close help','Space',c.virtual);await expect(page,{phase:'choosing'},c.virtual);
  const right=m.answerVisibleGeometryCrosswalk.correct.visibleLabel;
  const wrong=m.answerVisibleGeometryCrosswalk.rows.filter(x=>!x.correct).map(x=>x.visibleLabel);
  record.step='wrong1';await button(page,`Answer ${wrong[0]}`,'mouse',c.virtual);await expect(page,{phase:'wrong-feedback-1',hostFeedback:'true'},c.virtual);
  await button(page,'Try again','Enter',c.virtual);await expect(page,{phase:'choosing',hostFeedback:'false'},c.virtual);
  record.step='wrong2';await button(page,`Answer ${wrong[1]}`,'Space',c.virtual);await expect(page,{phase:'wrong-feedback-2',hostFeedback:'true'},c.virtual);
  await button(page,'Continue','mouse',c.virtual);await expect(page,{hostFeedback:'false',held:'false'},c.virtual);
  record.trace.push({step:'both-wrong-attempts-resolve',state:await snapshot(page)});
  await replay(page,c.virtual);await traverse(page,f,record,c.virtual,false);
  if(c.virtual){
   record.step='third-wrong-and-Replay';await button(page,`Answer ${wrong[2]}`,'Enter',c.virtual);await expect(page,{phase:'wrong-feedback-1',hostFeedback:'true'},c.virtual);
   await replay(page,c.virtual);await traverse(page,f,record,c.virtual,false);
  }
  if(c.virtual&&c.id.endsWith('026')){
   record.step='real-host-invalid-record-rejection';await button(page,'Reject answer record in real host','mouse',c.virtual);
   await button(page,`Answer ${right}`,'mouse',c.virtual);await expect(page,{phase:'choosing',hostFeedback:'false',held:'true'},c.virtual);
   assert.equal(await page.getByRole('alert').count(),1);
   record.trace.push({step:'real-host-rejected-invalid-branch-record-without-progress',state:await snapshot(page)});
   await button(page,'Reject answer record in real host','mouse',c.virtual);
  }
  record.step='correct';await button(page,`Answer ${right}`,'Space',c.virtual);await expect(page,{phase:'right-feedback',hostFeedback:'true'},c.virtual);
  await button(page,'Continue','mouse',c.virtual);await expect(page,{hostFeedback:'false',held:'false'},c.virtual);
  record.trace.push({step:'correct-resolves-real-runtime-stop',state:await snapshot(page)});
  assert.deepEqual(record.errors,[]);assert.deepEqual(record.requests,[]);record.status='passed';
 }catch(error){record.status='failed';record.error=error.stack??String(error);record.failureState=await snapshot(page).catch(()=>null);
  record.failureScreenshot=await capture(page,`${name}-failure`).catch(()=>null);await save(`${name}-failure.html`,await page.content());
 }finally{await save(`${name}.json`,json(record));console.log(JSON.stringify({name,status:record.status,step:record.step,error:record.error?.split('\n')[0]}));await page.close();}
}
try{
 let next=0;await Promise.all(Array.from({length:Math.min(3,cases.length)},async()=>{while(next<cases.length)await runCase(cases[next++]);}));
}finally{
 await browser.close();evidence.inputsUnchanged=JSON.stringify(await Promise.all(inputFiles.map(bind)))===JSON.stringify(inputs);
 evidence.status=evidence.inputsUnchanged&&records.length===cases.length&&records.every(r=>r.status==='passed')?'mounted-successor-runtime-checks-passed-unregistered':'failed-preserved-for-diagnosis';
 await save('evidence.json',json(evidence));
}
console.log(JSON.stringify({output:OUTPUT,status:evidence.status,passed:records.filter(r=>r.status==='passed').length,failed:records.filter(r=>r.status==='failed').length}));
if(evidence.status.startsWith('failed'))process.exitCode=1;
