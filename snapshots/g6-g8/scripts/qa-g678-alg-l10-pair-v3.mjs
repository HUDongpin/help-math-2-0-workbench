#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT,IDS,FREEZE,pin,encode} from './build-g678-alg-l10-pair-v3.mjs';
const BASE='http://127.0.0.1:3343',TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222';
assert(process.argv.length===4&&process.argv[2]==='--run'&&/^v[1-9]\d*$/u.test(process.argv[3]));
const OUT=`${TASK}/alg-l10-pair-my-lesson-${process.argv[3]}`,packet=JSON.parse(await readFile(path.join(ROOT,FREEZE)));
const paths=[...new Set([FREEZE,'packages/demos/private-current-js-registry.json','packages/demos/src/registry.local-only.generated.ts','packages/demos/src/registry.local-only.metadata.generated.ts',
 'apps/web/lib/g678-alg-l10-pair.server.ts','apps/web/lib/g678-current-js-extensions.server.ts','scripts/qa-g678-alg-l10-pair-v3.mjs','scripts/g678-alg-l10-pair.test.mjs',
 'apps/web/lib/learning-lesson-availability.server.ts','apps/web/lib/lesson-runtime-adapter.ts','apps/web/proxy.ts','apps/web/next.config.ts',
 ...IDS.flatMap(id=>[`apps/web/app/[locale]/migration-status/g678-calibration/${id}/page.tsx`,`apps/web/app/flash-assets/g678-local/${id}/canvas-renderer.js/route.ts`]),...packet.inputs.map(p=>p.path),...packet.outputs.map(p=>p.path)])];
const bind=()=>Promise.all(paths.map(async file=>pin(file,await readFile(path.resolve(ROOT,file))))),inputs=await bind();await mkdir(OUT);
const save=(name,value)=>writeFile(path.join(OUT,name),encode(value),{flag:'wx'});await save('inputs.json',inputs);await writeFile(path.join(OUT,'runner.mjs'),await readFile(new URL(import.meta.url)),{flag:'wx'});
const receipt={schemaVersion:1,animationIds:IDS,scope:'Actual source-ordered paired My Lesson with native audio, UI controls and page transitions. Audio API instrumentation observes calls only.',inputs,records:[],status:'running',productCalibrationPassed:false,scaleOutAuthorized:false,originalRuntimeAccepted:false,audioAccepted:false,humanAccepted:false,ownerAccepted:false,strictComplete:false,published:false};
const browser=await chromium.launch({headless:true,args:['--mute-audio','--autoplay-policy=document-user-activation-required']});
let arrived=0,releaseRefreshBarrier;const refreshBarrier=Promise.race([new Promise(resolve=>{releaseRefreshBarrier=resolve;}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('refresh probe barrier timeout')),90000))]);
async function probeColdSecondRoute(){const context=await browser.newContext();try{const page=await context.newPage();await context.route('**/*',route=>new URL(route.request().url()).origin===BASE?route.continue():route.abort());await page.goto(`${BASE}/en/migration-status/g678-calibration/${IDS[1]}`,{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>document.querySelector('[data-source-clock-ready]')?.getAttribute('data-source-clock-ready')==='true',null,{timeout:30000});receipt.refreshProbe={route:page.url(),status:'loaded-real-second-route'};}finally{await context.close();}}
async function run(locale,width,reduced){
 const name=`${locale}-${width}-${reduced?'reduced':'natural'}`,record={name,status:'running',observations:[],errors:[],requests:[],screenshots:[],autoplayWarnings:[],descriptorRefreshes:[],documentNavigations:[]};receipt.records.push(record);
 const context=await browser.newContext({viewport:{width,height:width<500?844:1000},reducedMotion:reduced?'reduce':'no-preference',serviceWorkers:'block'});
 await context.route('**/*',route=>{const url=new URL(route.request().url()),allowed=url.origin===BASE;record.requests.push({url:url.href,allowed,type:route.request().resourceType(),at:new Date().toISOString()});return allowed?route.continue():route.abort();});
 const page=await context.newPage();page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(90000);
 await page.addInitScript(()=>{
  window.__pairAudio={events:[],contexts:[],pageChanges:[]};let lastPage;new MutationObserver(()=>{const id=document.querySelector('[data-lesson-player]')?.getAttribute('data-current-animation-id');if(id&&id!==lastPage){lastPage=id;window.__pairAudio.pageChanges.push({id,at:performance.now()});}}).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['data-current-animation-id']});const Original=window.AudioContext;
  window.AudioContext=class extends Original{constructor(options){super(options);this.sourceAnimationId=document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-course-canvas');window.__pairAudio.contexts.push(this);window.__pairAudio.events.push({kind:'context',id:this.sourceAnimationId,rate:this.sampleRate});}close(){window.__pairAudio.events.push({kind:'close',id:this.sourceAnimationId});return super.close();}};
  const start=AudioBufferSourceNode.prototype.start,stop=AudioBufferSourceNode.prototype.stop,volume=AudioParam.prototype.setValueAtTime;
  AudioBufferSourceNode.prototype.start=function(...args){window.__pairAudio.events.push({kind:'start',id:this.context.sourceAnimationId,args,samples:this.buffer?.length,channels:this.buffer?.numberOfChannels,contextTime:this.context.currentTime,frame:document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-flash-frame')});return start.apply(this,args);};
  AudioBufferSourceNode.prototype.stop=function(...args){window.__pairAudio.events.push({kind:'stop',id:this.context.sourceAnimationId});return stop.apply(this,args);};
  AudioParam.prototype.setValueAtTime=function(value,time){window.__pairAudio.events.push({kind:'volume',value});return volume.call(this,value,time);};
 });
 page.on('framenavigated',frame=>{if(frame===page.mainFrame())record.documentNavigations.push({url:frame.url(),at:new Date().toISOString()});});
 page.on('request',r=>{if(new URL(r.url()).searchParams.has('_rsc'))record.descriptorRefreshes.push({url:r.url(),at:new Date().toISOString()});});
 page.on('pageerror',e=>record.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)record.errors.push(`HTTP ${r.status()} ${r.url()}`);});
 page.on('console',m=>{if(['error','warning'].includes(m.type())){if(m.text().startsWith('The AudioContext was not allowed to start.'))record.autoplayWarnings.push(m.text());else record.errors.push(m.text());}});
 const button=key=>page.locator(`[data-responsive-focus-key="${key}"]:visible`).first();
 const root=()=>page.locator('[data-source-clock-runtime]'),canvas=()=>page.locator('canvas[data-course-canvas]'),reading=()=>page.locator('[data-terminal-source-readable]'),table=()=>page.locator('[data-source-reading-table]');
 const observe=async label=>{const attrs=await root().evaluate(n=>Object.fromEntries([...n.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value])));const row={label,...attrs,frame:Number(await canvas().getAttribute('data-flash-frame'))};record.observations.push(row);return row;};
 const ready=async id=>{await page.waitForFunction(id=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-runtime')===id&&document.querySelector('[data-source-clock-ready]')?.getAttribute('data-source-clock-ready')==='true',id);assert.equal(await page.locator('[data-lesson-player]').getAttribute('data-renderer-availability'),'registered');await observe(`ready-${id}`);};
 const onlyCurrentContext=async id=>{await page.waitForFunction(id=>window.__pairAudio.contexts.every(c=>c.sourceAnimationId===id||c.state==='closed'),id);};
 const shot=async label=>{
  await canvas().click({position:{x:5,y:5}});await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(150);
  if(await reading().isVisible()){
   const clip=await reading().evaluate(n=>{const r=n.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height};});
   const file=path.join(OUT,`${name}-${label}-readable.png`);await page.screenshot({path:file,fullPage:true,clip,animations:'disabled'});record.screenshots.push({...pin(file,await readFile(file)),clip});
  }
  const file=path.join(OUT,`${name}-${label}.png`);await page.screenshot({path:file,fullPage:true,animations:'disabled'});record.screenshots.push(pin(file,await readFile(file)));
 };
 const pause=async()=>{if(await root().getAttribute('data-runtime-paused')!=='true')await button('pause').click();await page.waitForFunction(()=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-runtime-paused')==='true'&&['ready','paused','timeline-ended'].includes(document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase')));};
 const replay=async()=>{await button('replay').click();await page.waitForFunction(()=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase')==='playing'&&Number(document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-audio-frame'))<8);};
 const cell=(row,col)=>table().locator('tbody tr').nth(row).locator('td').nth(col);
 const inspect=async frame=>{const timeline=page.locator('input[data-responsive-focus-key="timeline"]:visible').first();await timeline.evaluate((input,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,String(value));input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));},frame);await page.waitForFunction(frame=>document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-flash-frame')===String(frame),frame);await observe(`inspected-${frame}`);};
 const expectBlank=async(row,col)=>assert.equal((await cell(row,col).innerText()).trim(),'');
 try{
  const response=await page.goto(`${BASE}/${locale}/migration-status/g678-calibration/${IDS[0]}`,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);await ready(IDS[0]);await pause();await replay();await page.waitForTimeout(1350);
  await observe('first-page-playing-before-next');await button('next').click();await ready(IDS[1]);await onlyCurrentContext(IDS[1]);
  record.beforeRefresh=await page.evaluate(()=>({timeOrigin:performance.timeOrigin,storedProgress:JSON.parse(localStorage.getItem('helpmath:shared-alg001-l10:g678-calibration:v1')),audioEvents:window.__pairAudio.events,pageChanges:window.__pairAudio.pageChanges}));assert.equal(record.beforeRefresh.storedProgress.currentAnimationId,IDS[1]);
  if(++arrived===3){try{await probeColdSecondRoute();}catch(error){receipt.refreshProbe={status:'failed',error:String(error)};}finally{releaseRefreshBarrier();}}
  await refreshBarrier;await page.waitForLoadState('networkidle',{timeout:30000});await ready(IDS[1]);await page.waitForTimeout(1500);assert.equal(await root().getAttribute('data-source-clock-runtime'),IDS[1],'same source entry must restore the currently selected second page after refresh');record.afterRefresh=await page.evaluate(()=>({timeOrigin:performance.timeOrigin,storedProgress:JSON.parse(localStorage.getItem('helpmath:shared-alg001-l10:g678-calibration:v1'))}));record.fullDocumentReload=record.afterRefresh.timeOrigin!==record.beforeRefresh.timeOrigin;await observe('second-page-after-cold-route-refresh');await pause();await replay();await page.waitForTimeout(1050);await observe('second-page-playing-before-previous');
  await button('previous').click();await ready(IDS[0]);await onlyCurrentContext(IDS[0]);
  for(let index=0;index<2;index++){
   const id=IDS[index],member=packet.members[index],plan=member.audioPlan;await ready(id);await pause();await replay();await page.waitForTimeout(1350);const played=await observe(`page-${index}-playing`);assert(reduced?played.frame===1:played.frame>1);
   const starts=await page.evaluate(id=>window.__pairAudio.events.filter(e=>e.kind==='start'&&e.id===id),id);assert(starts.length>0);assert(starts.every(e=>e.samples===plan.decoder.decodedSamples&&e.channels===1));
   const first=starts.find(e=>e.frame==='1');assert(first);assert.equal(first.args[1],plan.latencySamples/plan.decoder.sampleRate);assert(Math.abs(first.args[0]-first.contextTime-(plan.audioFirstFrame-1)/12)<.02);
   await pause();const held=await observe(`page-${index}-paused`);await page.waitForTimeout(240);const after=await observe(`page-${index}-held`);assert.equal(held.frame,after.frame);assert.equal(held['data-source-audio-sample'],after['data-source-audio-sample']);
   await button('pause').click();await page.waitForFunction(()=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase')==='playing');await observe(`page-${index}-resumed`);
   await button('mute').click();const mute=page.locator('.lesson-shell2__volume-mute-action:visible').first();await mute.click();await page.waitForFunction(()=>window.__pairAudio.events.filter(e=>e.kind==='volume').at(-1)?.value===0);await mute.click();await page.waitForFunction(()=>window.__pairAudio.events.filter(e=>e.kind==='volume').at(-1)?.value>0);await button('mute').click();
   if(!reduced){
    await inspect(1);assert.equal(await table().locator('tbody tr').count(),9);assert.equal(await table().locator('thead th').count(),3);
    if(index===0){
     await expectBlank(3,0);await expectBlank(4,1);await expectBlank(8,1);
     await inspect(443);assert.equal(await table().locator('sup').count(),0);await inspect(444);assert.deepEqual(await table().locator('sup').allTextContents(),['0']);
     await inspect(655);assert.deepEqual(await table().locator('sup').allTextContents(),['0','1','2','3','4','5','6','7','8']);await expectBlank(8,1);await shot('page-005-powers');
     await inspect(853);assert.equal(await page.locator('[data-source-reading-steps] p').count(),2);await inspect(913);assert.equal(await page.locator('[data-source-reading-steps] p').count(),6);assert((await page.locator('[data-source-reading-steps]').innerText()).endsWith('= 3'));
     await inspect(963);assert.equal(await page.locator('[data-source-reading-steps]').count(),0);
     await inspect(1054);assert.equal(await page.locator('[data-source-reading-steps] p').count(),2);await inspect(1083);assert((await page.locator('[data-source-reading-steps]').innerText()).endsWith('= 16'));
     await inspect(1097);assert.equal(await table().locator('sup').count(),0);assert.equal(await cell(4,0).innerText(),'16');await expectBlank(4,1);
     await inspect(1177);assert.equal(await page.locator('[data-source-reading-steps] p').count(),2);await inspect(1203);assert((await page.locator('[data-source-reading-steps]').innerText()).endsWith('= 31'));await expectBlank(4,1);
     await inspect(1268);assert.equal(await cell(4,1).innerText(),'31');await expectBlank(8,1);
    }else{
     assert.equal(await cell(4,0).innerText(),'16');assert.equal(await cell(4,1).innerText(),'31');await expectBlank(8,0);await expectBlank(8,1);assert.equal(await page.locator('[data-source-reading-steps]').count(),0);
     await inspect(329);assert.equal(await page.locator('[data-source-reading-steps] p').count(),2);await inspect(510);assert.equal(await page.locator('[data-source-reading-steps] p').count(),5);await inspect(570);assert((await page.locator('[data-source-reading-steps]').innerText()).endsWith('= 511'));await expectBlank(8,1);
     await inspect(573);assert.equal(await cell(8,1).innerText(),'511');await expectBlank(8,0);await expectBlank(5,1);await expectBlank(6,1);await expectBlank(7,1);
     await inspect(1095);assert(!(await reading().innerText()).includes('The essential question:'));await inspect(1096);assert((await reading().innerText()).includes('The essential question: why are mathematical rules necessary?'));
    }
    await inspect(plan.lastFrame);await shot(`page-${index}-inspected-end`);
    assert(await table().locator('th,td').evaluateAll(nodes=>nodes.every(n=>parseFloat(getComputedStyle(n).fontSize)>=16)));
    assert(await reading().locator('[role="math"]').count()>0);assert(await reading().locator('[role="math"]').evaluateAll(nodes=>nodes.every(n=>n.getAttribute('aria-label')?.includes('to the power'))));
   }
   await replay();await observe(`page-${index}-replay`);await expectBlank(8,1);assert.equal(await page.locator('[data-source-reading-steps]').count(),0);
   await page.waitForFunction(()=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase')==='timeline-ended',null,{timeout:150000});
   const end=await observe(`page-${index}-natural-end`);assert.equal(end.frame,reduced?1:plan.lastFrame);assert.equal(end['data-runtime-playback-complete'],reduced?'false':'true');
   assert.equal(await cell(4,1).innerText(),'31');if(index===1){assert.equal(await cell(8,1).innerText(),'511');await expectBlank(8,0);}await shot(`page-${index}-natural-end`);
   if(index===0){await button('next').click();await ready(IDS[1]);await onlyCurrentContext(IDS[1]);}
  }
  await button('next').click();await root().waitFor({state:'detached'});await page.waitForFunction(()=>window.__pairAudio.contexts.every(c=>c.state==='closed'));assert.equal(await page.locator('[data-lesson-player]').getAttribute('data-current-animation-id'),'shared-alg001-l10-p007');
  await button('previous').click();await ready(IDS[1]);await expectBlank(8,1);assert.equal(await page.locator('[data-source-reading-steps]').count(),0);await observe('returned-to-second-reset');
  await button('previous').click();await ready(IDS[0]);await onlyCurrentContext(IDS[0]);await expectBlank(3,0);await observe('returned-to-first-reset');await shot('returned-first');
  const geometry=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(geometry.scroll<=geometry.width+1);record.audioEvents=await page.evaluate(()=>window.__pairAudio.events);record.pageChanges=await page.evaluate(()=>window.__pairAudio.pageChanges);
  assert(record.requests.every(r=>r.allowed));assert.deepEqual(record.errors,[]);record.status='passed';
 }catch(e){record.status='failed';record.failure=e.stack;await observe('failure-state').catch(()=>{});record.audioEvents=await page.evaluate(()=>window.__pairAudio?.events).catch(()=>[]);record.pageChanges=await page.evaluate(()=>window.__pairAudio?.pageChanges).catch(()=>[]);await shot('failure').catch(()=>{});}finally{await context.close();await save(`${name}.json`,record);console.log(encode({name,status:record.status,failure:record.failure?.split('\n')[0]}));}
}
try{await Promise.all([['en',1440,false],['es',390,false],['en',370,true]].map(args=>run(...args)));}finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(await bind())===JSON.stringify(inputs);receipt.status=receipt.records.every(r=>r.status==='passed')&&receipt.inputsUnchanged?'passed':'failed';await save('receipt.json',receipt);console.log(encode({output:OUT,status:receipt.status,inputsUnchanged:receipt.inputsUnchanged}));if(receipt.status!=='passed')process.exitCode=1;}
