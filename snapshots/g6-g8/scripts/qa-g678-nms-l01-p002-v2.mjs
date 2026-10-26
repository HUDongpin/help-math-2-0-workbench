#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT,pin,encode} from './lib/g678-nms-l01-p002-generator-v1.mjs';
const ID='shared-nms002-l01-p002',FREEZE='catalog/product-bridge-calibrations/g678-nms-l01-p002-current-js-v1.json';
const BASE='http://127.0.0.1:3343',TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222';
assert([4,6].includes(process.argv.length)&&process.argv[2]==='--run'&&/^v[1-9]\d*$/u.test(process.argv[3]));
const selectedCase=process.argv.length===6?process.argv[5]:null;assert(process.argv.length===4||process.argv[4]==='--case'&&selectedCase==='en-370-reduced');
const cases=selectedCase?[['en',370,true]]:[['en',1440,false],['es',390,false],['en',370,true]];
const OUT=`${TASK}/nms-l01-p002-my-lesson-${process.argv[3]}`,packet=JSON.parse(await readFile(path.join(ROOT,FREEZE)));
const paths=[...new Set([FREEZE,'packages/demos/private-current-js-registry.json','packages/demos/src/registry.local-only.generated.ts','packages/demos/src/registry.local-only.metadata.generated.ts',
 'apps/web/lib/g678-nms-l01-p002.server.ts','apps/web/lib/g678-current-js-extensions.server.ts','scripts/qa-g678-nms-l01-p002-v2.mjs','scripts/g678-nms-l01-p002.test.mjs','packages/demos/tests/nms-l01-p002-source-clock-v1.test.ts',
 'apps/web/components/g678-nms-l01-p002-lesson.tsx','apps/web/components/g678-multi-page-lesson-player-v3.generated.tsx','apps/web/lib/g678-private-runtime-adapters-v1.ts','apps/web/lib/g678-preview-entry-v1.ts',
 'apps/web/components/private-audio-glossary-portal.tsx','apps/web/lib/descriptor-driven-glossary-pause.ts','apps/web/lib/learning-lesson-availability.server.ts','apps/web/lib/lesson-runtime-adapter.ts','apps/web/proxy.ts','apps/web/next.config.ts',
 `apps/web/app/[locale]/migration-status/g678-calibration/${ID}/page.tsx`,`apps/web/app/flash-assets/g678-local/${ID}/canvas-renderer.js/route.ts`,...packet.inputs.map(p=>p.path),...packet.outputs.map(p=>p.path)])];
const bind=()=>Promise.all(paths.map(async file=>pin(file,await readFile(path.resolve(ROOT,file))))),inputs=await bind();await mkdir(OUT);
const save=(name,value)=>writeFile(path.join(OUT,name),encode(value),{flag:'wx'});await save('inputs.json',inputs);await writeFile(path.join(OUT,'runner.mjs'),await readFile(new URL(import.meta.url)),{flag:'wx'});
const receipt={schemaVersion:1,animationId:ID,scope:'Actual source-ordered My Lesson with native segmented audio, UI frame inspector, source glossary and page transitions. Instrumentation calls through native browser audio.',inputs,records:[],selectedCase,status:'running',productCalibrationPassed:false,scaleOutAuthorized:false,originalRuntimeAccepted:false,audioAccepted:false,humanAccepted:false,ownerAccepted:false,strictComplete:false,published:false};
const browser=await chromium.launch({headless:true,args:['--mute-audio','--autoplay-policy=document-user-activation-required']});
async function run(locale,width,reduced){
 const name=`${locale}-${width}-${reduced?'reduced':'natural'}`,record={name,status:'running',observations:[],errors:[],requests:[],screenshots:[],autoplayWarnings:[]};receipt.records.push(record);
 const context=await browser.newContext({viewport:{width,height:width<500?844:1000},reducedMotion:reduced?'reduce':'no-preference',serviceWorkers:'block'});
 await context.route('**/*',route=>{const url=new URL(route.request().url()),allowed=url.origin===BASE;record.requests.push({url:url.href,allowed,type:route.request().resourceType()});return allowed?route.continue():route.abort();});
 const page=await context.newPage();page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(90000);
 await page.addInitScript(()=>{
  window.__storyAudio={events:[],contexts:[],nextNode:0};const Original=window.AudioContext;
  window.AudioContext=class extends Original{constructor(options){super(options);this.auditId=window.__storyAudio.contexts.length;window.__storyAudio.contexts.push(this);window.__storyAudio.events.push({kind:'context',contextId:this.auditId,rate:this.sampleRate});}close(){window.__storyAudio.events.push({kind:'close',contextId:this.auditId});return super.close();}};
  const start=AudioBufferSourceNode.prototype.start,stop=AudioBufferSourceNode.prototype.stop,volume=AudioParam.prototype.setValueAtTime;
  AudioBufferSourceNode.prototype.start=function(...args){this.auditId=window.__storyAudio.nextNode++;window.__storyAudio.events.push({kind:'start',nodeId:this.auditId,contextId:this.context.auditId,args,samples:this.buffer?.length,channels:this.buffer?.numberOfChannels,contextTime:this.context.currentTime,frame:document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-flash-frame')});this.addEventListener('ended',()=>window.__storyAudio.events.push({kind:'ended',nodeId:this.auditId,contextTime:this.context.currentTime}));return start.apply(this,args);};
  AudioBufferSourceNode.prototype.stop=function(...args){window.__storyAudio.events.push({kind:'stop',nodeId:this.auditId,contextId:this.context.auditId,contextTime:this.context.currentTime});return stop.apply(this,args);};
  AudioParam.prototype.setValueAtTime=function(value,time){window.__storyAudio.events.push({kind:'volume',value});return volume.call(this,value,time);};
 });
 page.on('pageerror',e=>record.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)record.errors.push(`HTTP ${r.status()} ${r.url()}`);});
 page.on('console',m=>{if(['error','warning'].includes(m.type())){if(m.text().startsWith('The AudioContext was not allowed to start.'))record.autoplayWarnings.push(m.text());else record.errors.push(m.text());}});
 const root=page.locator(`[data-source-clock-runtime="${ID}"]`),canvas=page.locator(`canvas[data-course-canvas="${ID}"]`),reading=page.locator('[data-terminal-source-readable]');
 const button=key=>page.locator(`[data-responsive-focus-key="${key}"]:visible`).first();
 const observe=async label=>{const attrs=await root.evaluate(n=>Object.fromEntries([...n.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value])));const row={label,...attrs,frame:Number(await canvas.getAttribute('data-flash-frame'))};record.observations.push(row);return row;};
 const ready=async()=>{await page.waitForFunction(id=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-runtime')===id&&document.querySelector('[data-source-clock-ready]')?.getAttribute('data-source-clock-ready')==='true',ID);assert.equal(await page.locator('[data-lesson-player]').getAttribute('data-renderer-availability'),'registered');await observe('ready');};
 const pause=async()=>{if(await root.getAttribute('data-runtime-paused')!=='true')await button('pause').click();await page.waitForFunction(()=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-runtime-paused')==='true'&&['ready','paused','timeline-ended'].includes(document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase')));};
 const play=async()=>{await button('pause').click();await page.waitForFunction(()=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase')==='playing');};
 const replay=async()=>{await button('replay').click();await page.waitForFunction(()=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase')==='playing'&&Number(document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-audio-frame'))<8);};
 const inspect=async frame=>{const timeline=page.locator('input[data-responsive-focus-key="timeline"]:visible').first();await timeline.evaluate((input,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,String(value));input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));},frame);await page.waitForFunction(frame=>document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-flash-frame')===String(frame)&&document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-audio-frame')===String(frame),frame);await observe(`inspected-${frame}`);};
 const shot=async label=>{if(await page.getByRole('dialog').count()===0){await canvas.click({position:{x:5,y:5}});await page.evaluate(()=>window.scrollTo(0,0));}await page.waitForTimeout(150);
  const file=path.join(OUT,`${name}-${label}.png`);await page.screenshot({path:file,fullPage:true,animations:'disabled'});record.screenshots.push(pin(file,await readFile(file)));
  const target=await page.getByRole('dialog').isVisible()?page.getByRole('dialog'):reading;
  if(await target.isVisible()){const clip=await target.evaluate(n=>{const r=n.getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height};});const crop=file.replace('.png','-content.png');await page.screenshot({path:crop,fullPage:true,clip,animations:'disabled'});record.screenshots.push({...pin(crop,await readFile(crop)),clip});}
 };
 const starts=()=>page.evaluate(()=>window.__storyAudio.events.filter(e=>e.kind==='start'));
 const glossary=async(entryId,characterId,shouldResume,via)=>{
  const trigger=page.locator(`[data-frozen-glossary-controls="${ID}"] button[data-source-character-id="${characterId}"]`);assert(await trigger.isEnabled());
  await trigger.focus();await trigger.press(via);const dialog=page.getByRole('dialog');await dialog.waitFor({state:'visible'});await pause();
  assert.equal(await dialog.getAttribute('data-glossary-entry-id'),entryId);const entry=packet.sourceGlossary.entries.find(e=>e.id===entryId);
  assert.equal(await dialog.locator('h2').innerText(),entry.labels[locale]);assert((await dialog.innerText()).includes(entry.definitions[locale]));assert.equal(await dialog.getAttribute('data-source-sha256'),entry.source[locale].sha256);
  const geometry=await dialog.boundingBox();assert(geometry.x>=0&&geometry.y>=0&&geometry.x+geometry.width<=width+1&&geometry.y+geometry.height<=(width<500?844:1000)+1);
  const held=await observe(`glossary-${entryId}-opened`);await page.waitForTimeout(220);assert.equal((await observe(`glossary-${entryId}-held`))['data-source-audio-sample'],held['data-source-audio-sample']);await shot(`glossary-${entryId}`);
  await dialog.getByRole('button',{name:locale==='es'?'Cerrar y continuar':'Close and continue'}).click();await dialog.waitFor({state:'detached'});
  await page.waitForFunction(({id,wanted})=>document.querySelector(`[data-source-clock-runtime="${id}"]`)?.getAttribute('data-source-clock-phase')===wanted,{id:ID,wanted:shouldResume?'playing':'paused'});
  await page.waitForFunction(id=>document.activeElement?.getAttribute('data-source-character-id')===String(id),characterId);await observe(`glossary-${entryId}-closed`);
 };
 try{
  const response=await page.goto(`${BASE}/${locale}/migration-status/g678-calibration/${ID}`,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);await ready();await pause();await replay();await page.waitForTimeout(1200);
  const played=await observe('playing');assert(reduced?played.frame===1:played.frame>1);const initial=(await starts()).slice(-2);assert.equal(initial.length,2);assert(initial.every(e=>e.frame==='1'&&e.samples===1759680&&e.channels===1));
  assert.equal(initial[0].args[1],1673/22050);assert.equal(initial[1].args[1],734699/22050);assert(Math.abs(initial[1].args[0]-initial[0].args[0]-427/12)<1e-9);assert.equal(initial[0].args[2],(734400-1673)/22050);assert(Math.abs(initial[1].args[2]-(82-427/12))<1e-9);
  await pause();const held=await observe('paused');await page.waitForTimeout(220);assert.equal((await observe('held'))['data-source-audio-sample'],held['data-source-audio-sample']);await play();
  await button('mute').click();const mute=page.locator('.lesson-shell2__volume-mute-action:visible').first();await mute.click();await page.waitForFunction(()=>window.__storyAudio.events.filter(e=>e.kind==='volume').at(-1)?.value===0);await mute.click();await page.waitForFunction(()=>window.__storyAudio.events.filter(e=>e.kind==='volume').at(-1)?.value>0);await button('mute').click();
  if(!reduced){
   for(const f of [115,116,132,133,401,414,427,428])await inspect(f);
   await inspect(414);assert.equal(await root.getAttribute('data-source-audio-sample'),'734400');const before=(await starts()).length;await play();const scheduled=(await starts()).slice(before);assert.equal(scheduled.length,1);assert.equal(scheduled[0].args[1],734699/22050);assert(Math.abs(scheduled[0].args[0]-scheduled[0].contextTime-14/12)<.02);
   await page.waitForFunction(()=>Number(document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-audio-frame'))>=432);await observe('native-crossed-gap-from-inspection');await pause();
   for(const [f,count] of [[930,0],[931,1],[938,1],[939,2],[952,2],[953,3],[959,3],[960,3]]){await inspect(f);assert.equal(await page.locator(`[data-frozen-glossary-controls="${ID}"] button`).count(),count);assert.equal(await reading.count(),f>=960?1:0);}
   await inspect(985);assert.equal(await reading.locator('p').innerText(),'Adding Positive and Negative Integers on a Number Line');assert(await reading.locator('p').evaluate(n=>parseFloat(getComputedStyle(n).fontSize)>=16));await shot('inspected-end');
   await glossary('positive-integers',707,false,'Enter');await glossary('negative-integers',705,false,'Space');await glossary('number-line',706,false,'Enter');
  }
  // Real navigation occurs while a future sound node is still scheduled.
  await replay();await page.waitForTimeout(900);const beforeNavigation=(await starts()).slice(-2);await button('next').click();await root.waitFor({state:'detached'});await page.waitForFunction(()=>window.__storyAudio.contexts.every(c=>c.state==='closed'));
  assert.equal(await page.locator('[data-lesson-player]').getAttribute('data-current-animation-id'),'shared-nms002-l01-p003');
  const events=await page.evaluate(()=>window.__storyAudio.events);assert(beforeNavigation.every(n=>events.some(e=>e.kind==='stop'&&e.nodeId===n.nodeId)));
  await button('previous').click();await ready();await pause();await replay();assert.equal(await reading.count(),0);assert.equal(await page.locator('[data-frozen-glossary-controls] button').count(),0);
  const natural=(await starts()).slice(-2);record.naturalSourceNodes=natural;
  await page.waitForFunction(()=>Number(document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-audio-frame'))>=404,null,{timeout:50000});await observe('natural-first-run-ended-picture-continues');
  await page.waitForFunction(()=>Number(document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-audio-frame'))>=414);await observe('natural-gap');await shot('natural-gap');
  assert.equal((await starts()).at(-1).nodeId,natural[1].nodeId);
  await page.waitForFunction(()=>Number(document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-audio-frame'))>=435);await observe('natural-second-run');
  await page.waitForFunction(()=>Number(document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-audio-frame'))>=933,null,{timeout:55000});await glossary('positive-integers',707,true,'Enter');
  const explicitHold=await observe('picture-after-explicit-glossary-action');if(reduced){assert(explicitHold.frame>=933&&explicitHold.frame<985);record.reducedExplicitHoldFrame=explicitHold.frame;}
  await page.waitForFunction(()=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase')==='timeline-ended',null,{timeout:20000});const end=await observe('natural-end');assert.equal(end.frame,reduced?record.reducedExplicitHoldFrame:985,'reduced motion must preserve the still picture committed by the explicit glossary action through the remaining native narration');assert.equal(end['data-runtime-playback-complete'],reduced?'false':'true');
  assert.equal(await reading.locator('p').innerText(),'Adding Positive and Negative Integers on a Number Line');await shot('natural-end');
  const geometry=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(geometry.scroll<=geometry.width+1);
  record.audioEvents=await page.evaluate(()=>window.__storyAudio.events);assert(record.audioEvents.filter(e=>e.kind==='start').every(e=>e.samples===1759680&&e.channels===1));assert.deepEqual(record.errors,[]);assert(record.requests.every(r=>r.allowed));record.status='passed';
 }catch(error){record.status='failed';record.failure=error.stack;await shot('failure').catch(()=>{});}
 finally{await context.close();await save(`${name}.json`,record);console.log(encode({name,status:record.status,failure:record.failure?.split('\n')[0]}));}
}
try{
 const warm=await browser.newContext();try{const p=await warm.newPage();await p.goto(`${BASE}/en/migration-status/g678-calibration/${ID}`,{waitUntil:'domcontentloaded',timeout:90000});await p.waitForFunction(()=>document.querySelector('[data-source-clock-ready]')?.getAttribute('data-source-clock-ready')==='true',null,{timeout:30000});}finally{await warm.close();}
 await Promise.all(cases.map(args=>run(...args)));
}finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(await bind())===JSON.stringify(inputs);receipt.status=receipt.records.length===cases.length&&receipt.records.every(r=>r.status==='passed')&&receipt.inputsUnchanged?'passed':'failed';await save('receipt.json',receipt);console.log(encode({output:OUT,status:receipt.status,inputsUnchanged:receipt.inputsUnchanged}));if(receipt.status!=='passed')process.exitCode=1;}
