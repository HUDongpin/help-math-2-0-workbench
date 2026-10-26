#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT, pin, encode} from './lib/g678-nms-l01-p011-generator-v1.mjs';
const ID='shared-nms002-l01-p011',FREEZE='catalog/product-bridge-calibrations/g678-nms-l01-p011-current-js-v1.json';
const BASE='http://127.0.0.1:3343',TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222';
assert(process.argv.length===4&&process.argv[2]==='--run'&&/^v[1-9]\d*$/u.test(process.argv[3]));
const OUT=`${TASK}/nms-l01-p011-my-lesson-${process.argv[3]}`,packet=JSON.parse(await readFile(path.join(ROOT,FREEZE)));
const paths=[...new Set([FREEZE,'packages/demos/private-current-js-registry.json','packages/demos/src/registry.local-only.generated.ts','packages/demos/src/registry.local-only.metadata.generated.ts','apps/web/lib/g678-nms-l01-p011.server.ts','apps/web/lib/g678-current-js-extensions.server.ts','scripts/qa-g678-nms-l01-p011.mjs',...packet.inputs.map(b=>b.path),...packet.outputs.map(b=>b.path),...[2,3,4,5,7,8,9,10,11].map(n=>`apps/web/app/[locale]/migration-status/g678-calibration/shared-nms002-l01-p${String(n).padStart(3,'0')}/page.tsx`)])];
const bind=()=>Promise.all(paths.map(async file=>pin(file,await readFile(path.resolve(ROOT,file))))),inputs=await bind();
await mkdir(OUT);const save=(f,v)=>writeFile(path.join(OUT,f),encode(v),{flag:'wx'});
await save('inputs.json',inputs);await writeFile(path.join(OUT,'runner.mjs'),await readFile(new URL(import.meta.url)),{flag:'wx'});
const receipt={schemaVersion:1,animationId:ID,scope:'Actual private My Lesson absolute-value practice, seven source host feedback branches and all eight native audio streams. Current-JS evidence only.',inputs,records:[],status:'running',productCalibrationPassed:false,scaleOutAuthorized:false,originalRuntimeAccepted:false,audioAccepted:false,humanAccepted:false,ownerAccepted:false,strictComplete:false,published:false};
const browser=await chromium.launch({headless:true,args:['--mute-audio','--autoplay-policy=document-user-activation-required']});
async function run(locale,width,reduced){
 const name=`${locale}-${width}-${reduced?'reduced':'natural'}`,record={name,status:'running',observations:[],errors:[],requests:[],screenshots:[],autoplayWarnings:[],pixelComparisons:[],branches:[],glossaryChecks:[],consoleDetails:[]};receipt.records.push(record);
 const context=await browser.newContext({viewport:{width,height:width<500?844:1000},reducedMotion:reduced?'reduce':'no-preference',serviceWorkers:'block',hasTouch:width<500});
 await context.route('**/*',route=>{const u=new URL(route.request().url()),allowed=u.origin===BASE;record.requests.push({url:u.href,allowed});return allowed?route.continue():route.abort();});
 const page=await context.newPage();page.setDefaultTimeout(25000);page.setDefaultNavigationTimeout(90000);
 await page.addInitScript(()=>{
  window.__p011Audio={events:[],contexts:[],nextNode:0,hashes:[]};window.__p011Console=[];for(const level of ['error','warn']){const original=console[level];console[level]=function(...args){window.__p011Console.push({level,args:args.map(String),stack:new Error().stack,page:document.querySelector('[data-lesson-player]')?.getAttribute('data-current-animation-id'),phase:document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase')});return original.apply(this,args);};}const Original=window.AudioContext;
  window.AudioContext=class extends Original{
   constructor(options){super(options);this.sourceAnimationId=document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-course-canvas');this.auditId=window.__p011Audio.contexts.length;window.__p011Audio.contexts.push(this);window.__p011Audio.events.push({kind:'context',id:this.sourceAnimationId,contextId:this.auditId,rate:this.sampleRate});}
   close(){window.__p011Audio.events.push({kind:'close',id:this.sourceAnimationId,contextId:this.auditId});return super.close();}
  };
  const start=AudioBufferSourceNode.prototype.start,stop=AudioBufferSourceNode.prototype.stop;
  AudioBufferSourceNode.prototype.start=function(...args){this.auditId=window.__p011Audio.nextNode++;window.__p011Audio.events.push({kind:'start',id:this.context.sourceAnimationId,nodeId:this.auditId,contextId:this.context.auditId,args,samples:this.buffer?.length,channels:this.buffer?.numberOfChannels,contextTime:this.context.currentTime,frame:document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-flash-frame')});const e=window.__p011Audio.events.at(-1),samples=this.buffer.getChannelData(0),bytes=new ArrayBuffer(samples.length*4),view=new DataView(bytes);for(let i=0;i<samples.length;i++)view.setFloat32(i*4,samples[i],true);window.__p011Audio.hashes.push(crypto.subtle.digest('SHA-256',bytes).then(h=>{e.pcmSha256=Array.from(new Uint8Array(h),n=>n.toString(16).padStart(2,'0')).join('');}));this.addEventListener('ended',()=>window.__p011Audio.events.push({kind:'ended',id:this.context.sourceAnimationId,nodeId:this.auditId,contextTime:this.context.currentTime}));return start.apply(this,args);};
  AudioBufferSourceNode.prototype.stop=function(...args){window.__p011Audio.events.push({kind:'stop',id:this.context.sourceAnimationId,nodeId:this.auditId,contextTime:this.context.currentTime});return stop.apply(this,args);};
 });
 page.on('pageerror',e=>record.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)record.errors.push(`HTTP ${r.status()} ${r.url()}`);});
 page.on('console',m=>{if(['error','warning'].includes(m.type())){if(m.text().startsWith('The AudioContext was not allowed to start.'))record.autoplayWarnings.push(m.text());else record.errors.push(m.text());}});
 const root=()=>page.locator(`[data-source-clock-runtime="${ID}"]`),canvas=()=>page.locator(`canvas[data-course-canvas="${ID}"]`),button=k=>page.locator(`[data-responsive-focus-key="${k}"]:visible`).first();
 const observe=async label=>{const row={label,...await root().evaluate(n=>Object.fromEntries([...n.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value]))),frame:Number(await canvas().getAttribute('data-flash-frame'))};record.observations.push(row);return row;};
 const ready=async id=>page.waitForFunction(id=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-runtime')===id&&document.querySelector('[data-source-clock-ready]')?.getAttribute('data-source-clock-ready')==='true',id,{timeout:60000});
 const phase=async expected=>page.waitForFunction(expected=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase')===expected,expected);
 const pause=async()=>{if(await root().getAttribute('data-runtime-paused')!=='true')await button('pause').click();await page.waitForFunction(()=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-runtime-paused')==='true'&&document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase')!=='playing');};
 const replay=async()=>{await button('replay').click();await phase('playing');assert.equal(await root().getAttribute('data-source-answer-attempts'),'0');assert.equal(await root().getAttribute('data-source-inspection'),'false');};
 const inspect=async frame=>{const t=page.locator('input[data-responsive-focus-key="timeline"]:visible').first();await t.evaluate((n,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(n,String(v));n.dispatchEvent(new Event('input',{bubbles:true}));n.dispatchEvent(new Event('change',{bubbles:true}));},frame);await page.waitForFunction(frame=>document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-flash-frame')===String(frame)&&document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-audio-frame')===String(frame),frame);await observe(`inspect-${frame}`);};
 const shot=async label=>{await page.evaluate(()=>window.scrollTo(0,0));const file=path.join(OUT,`${name}-${label}.png`);await page.screenshot({path:file,fullPage:true,animations:'disabled'});record.screenshots.push(pin(file,await readFile(file)));};
 const act=async selector=>{const loc=page.locator(selector);await page.waitForFunction(s=>{const n=document.querySelector(s);return n&&!n.disabled;},selector);if(width<500)await loc.tap();else{await loc.focus();await loc.press('Enter');}};
 const compare=async(frame,label)=>{const img=(await readFile(`${TASK}/nms-l01-p011-canvas-v1/main-${frame}.png`)).toString('base64'),value=await page.evaluate(async b=>{
  const i=new Image();i.src='data:image/png;base64,'+b;await i.decode();const expected=document.createElement('canvas'),actual=document.createElement('canvas');for(const c of[expected,actual]){c.width=800;c.height=600;}
  const e=expected.getContext('2d',{willReadFrequently:true}),a=actual.getContext('2d',{willReadFrequently:true});e.drawImage(i,10,10,800,600,0,0,800,600);a.drawImage(document.querySelector('canvas[data-course-canvas]'),0,0);
  const ea=e.getImageData(0,0,800,600).data,aa=a.getImageData(0,0,800,600).data;let differences=0;for(let j=0;j<aa.length;j++)if(aa[j]!==ea[j])differences++;return{differences};
 },img);record.pixelComparisons.push({label,...value});assert.equal(value.differences,0);};
 const checkGlossary=async(selector,id)=>{
  const trigger=page.locator(selector);await trigger.click();const dialog=page.locator(`[data-p011-dialog="${id}"]`);await dialog.waitFor();
  assert((await dialog.innerText()).includes(packet.sourceGlossary.entries.find(e=>e.id===id).definitions[locale]));
  const before=await root().getAttribute('data-source-feedback-frame');await page.waitForTimeout(100);
  await page.keyboard.press('Tab');assert(await dialog.evaluate(n=>n.contains(document.activeElement)));
  await page.keyboard.press('Shift+Tab');assert(await dialog.evaluate(n=>n.contains(document.activeElement)));
  await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
  await page.waitForFunction(selector=>document.activeElement===document.querySelector(selector),selector);
  assert.equal(await root().getAttribute('data-source-feedback-frame'),before);record.glossaryChecks.push({selector,id,focusRestored:true});
 };
 try{
  const response=await page.goto(`${BASE}/${locale}/migration-status/g678-calibration/${ID}`,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);await ready(ID);await pause();
  if(reduced)assert.equal(await canvas().getAttribute('data-flash-frame'),'1');
  await inspect(102);await phase('question');await compare(102,'inspected-question');await shot('question');
  assert.equal(await page.locator('[data-p011-companion]').count(),1);assert.equal(await page.locator('[data-p011-companion] [data-p011-choice]').count(),3);
  assert.equal(await page.locator('[data-p011-source-choice]').count(),3);
  for(const [id,n] of [['absolute-value',9],['represent',10]]){await checkGlossary(`[data-source-hotspot="${n}"]`,id);await phase('question');await checkGlossary(`[data-p011-primary-term="${id}"]`,id);}
  await inspect(145);assert.equal(await root().getAttribute('data-runtime-playback-complete'),'false');assert.equal(await root().getAttribute('data-source-correct-answer'),'false');
  for(let round=0;round<4;round++){
   await replay();await phase('question');await observe(`natural-question-round-${round}`);assert.equal(await canvas().getAttribute('data-flash-frame'),'102');
   assert.equal(await root().getAttribute('data-source-inspection'),'false');
   for(let attempt=0;attempt<round;attempt++){
    // Alternate source hit regions with the accessible companion. The expected branch follows prior attempts.
    const source=attempt%2===0,wrong=attempt%2===0?'answer-depth-25':'answer-depth-21';
    await act(source?`[data-p011-source-choice="${wrong}"]`:`[data-p011-choice="${wrong}"]`);await phase('wrong-wait');
    const domain=['sprite-92','sprite-68','sprite-80'][attempt%3];assert.equal(await root().getAttribute('data-source-feedback-domain'),domain);
    assert.equal(await root().getAttribute('data-source-feedback-frame'),'22');assert.equal(await page.locator('[data-p011-choice]:enabled').count(),0);
    const starts=await page.evaluate(()=>window.__p011Audio.events.filter(e=>e.kind==='start').length);await page.waitForTimeout(180);
    assert.equal(await page.evaluate(()=>window.__p011Audio.events.filter(e=>e.kind==='start').length),starts);
    record.branches.push({kind:'wrong',domain,round,attempt,waitFrame:22});
    if(round===3){await shot(`wrong-${attempt+1}`);}
    if(round===1&&attempt===0){
     for(const id of ['absolute-value','distance','number-line']){
      await checkGlossary(`[data-p011-companion] [data-p011-feedback-term="${id}"]`,id);await phase('wrong-wait');
      await checkGlossary(`[data-p011-source-feedback-text] [data-p011-feedback-term="${id}"]`,id);await phase('wrong-wait');
     }
     const fit=await page.locator('[data-p011-source-feedback-text]').evaluate(n=>({height:n.getBoundingClientRect().height,available:n.parentElement.getBoundingClientRect().height}));
     assert(fit.height<=fit.available+1,'source feedback text must fit the authored text box');record.sourceTextFit=fit;
    }
    await act(source?'[data-p011-source-close]':'[data-p011-companion] [data-p011-close-wrong]');await phase('question');
    assert.equal(await root().getAttribute('data-source-answer-attempts'),String(attempt+1));assert.equal(await page.locator('[data-p011-choice]:enabled').count(),3);
   }
   const before=await page.evaluate(()=>window.__p011Audio.events.length);
   await act(round%2?'[data-p011-source-choice="answer-depth-23"]':'[data-p011-choice="answer-depth-23"]');await phase('playing');
   const domain=['sprite-155','sprite-183','sprite-207','sprite-143'][round];assert.equal(await root().getAttribute('data-source-feedback-domain'),domain);
   await page.waitForTimeout(500);await pause();await observe(`right-${round+1}-paused`);await shot(`right-${round+1}`);
   const events=await page.evaluate(n=>window.__p011Audio.events.slice(n),before),outro=events.find(e=>e.kind==='start'&&e.samples===256896);
   assert(outro,'main narration is scheduled before a frame tick reaches its start');assert.equal(outro.args[1],(1673+97*22050/12)/22050);
   assert(outro.args[0]-outro.contextTime>1.8);assert(events.some(e=>e.kind==='stop'&&e.nodeId===outro.nodeId));
   await button('pause').click();await phase('playing');await phase('ended');
   const end=await observe(`right-${round+1}-end`);assert.equal(end.frame,145);assert.equal(end['data-source-correct-answer'],'true');
   assert.equal(end['data-runtime-playback-complete'],reduced?'false':'true');assert.equal(end['data-source-answer-attempts'],String(round+1));
   await compare(145,`source-end-round-${round}`);await page.waitForTimeout(200);assert.equal(await canvas().getAttribute('data-flash-frame'),'145');
   record.branches.push({kind:'right',domain,round,terminalMainFrame:145});
  }
  await shot('natural-end');
  await replay();await phase('question');await act('[data-p011-choice="answer-depth-25"]');await phase('wrong-wait');
  await page.locator('[data-p011-companion] [data-p011-feedback-term="distance"]').click();await page.locator('[data-p011-dialog="distance"]').waitFor();
  // The modern Replay control must reset every source and nested overlay state.
  await page.keyboard.press('Escape');await page.locator('[data-p011-dialog]').waitFor({state:'detached'});await replay();
  assert.equal(await page.locator('[data-p011-source-feedback-text]').count(),0);assert.equal(await root().getAttribute('data-source-answer-attempts'),'0');
  await pause();await page.evaluate(()=>Promise.all(window.__p011Audio.hashes));record.audioBeforeReload=await page.evaluate(()=>window.__p011Audio.events);record.consoleBeforeReload=await page.evaluate(()=>window.__p011Console);const sourceStarts=record.audioBeforeReload.filter(e=>e.kind==='start'&&e.id===ID);const playedHashes=[...new Set(sourceStarts.map(e=>e.pcmSha256))].sort();assert.deepEqual(playedHashes,packet.audioPlan.clips.map(c=>c.decoder.pcmSha256).sort());assert(sourceStarts.every(e=>e.channels===1&&e.args.length===3));record.nativeStreamsVerified=packet.audioPlan.clips.map(c=>({domain:c.frameDomain,samples:c.decoder.decodedSamples,pcmSha256:c.decoder.pcmSha256,startCount:sourceStarts.filter(e=>e.pcmSha256===c.decoder.pcmSha256).length}));await page.reload({waitUntil:'domcontentloaded'});await ready(ID);await pause();assert.equal(await root().getAttribute('data-source-answer-attempts'),'0');await observe('reload-reset');
  const oldContext=await page.evaluate(()=>window.__p011Audio.contexts.at(-1).auditId);
  await button('previous').click();await ready('shared-nms002-l01-p010');await page.waitForFunction(i=>window.__p011Audio.contexts[i].state==='closed',oldContext);
  await button('next').click();await ready(ID);await pause();assert.equal(await root().getAttribute('data-source-answer-attempts'),'0');await observe('returned-from-p010');
  const p11Context=await page.evaluate(()=>window.__p011Audio.contexts.at(-1).auditId);
  await button('next').click();await root().waitFor({state:'detached'});await page.waitForFunction(i=>window.__p011Audio.contexts[i].state==='closed',p11Context);
  assert.equal(await page.locator('[data-lesson-player]').getAttribute('data-current-animation-id'),'shared-nms002-l01-p012');
  await button('previous').click();await ready(ID);await pause();await observe('returned-from-p012');
  await page.evaluate(()=>Promise.all(window.__p011Audio.hashes));record.audioEvents=await page.evaluate(()=>window.__p011Audio.events);record.consoleDetails=await page.evaluate(()=>window.__p011Console);
  const geometry=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(geometry.scroll<=geometry.width+1);
  assert.deepEqual(record.errors,[]);assert(record.requests.every(r=>r.allowed));
  assert.deepEqual([...new Set(record.branches.filter(b=>b.kind==='wrong').map(b=>b.domain))].sort(),['sprite-68','sprite-80','sprite-92']);
  assert.deepEqual(record.branches.filter(b=>b.kind==='right').map(b=>b.domain),['sprite-155','sprite-183','sprite-207','sprite-143']);
  record.status='passed';
 }catch(error){record.status='failed';record.failure=error.stack;await observe('failure-state').catch(()=>{});await shot('failure').catch(()=>{});}
 finally{record.audioEvents??=await page.evaluate(()=>window.__p011Audio?.events).catch(()=>[]);record.consoleDetails=await page.evaluate(()=>window.__p011Console).catch(()=>[]);await context.close();await save(`${name}.json`,record);console.log(encode({name,status:record.status,failure:record.failure?.split('\n')[0]}));}
}
try{
 const warm=await browser.newContext();try{const p=await warm.newPage();await p.goto(`${BASE}/en/migration-status/g678-calibration/${ID}`,{waitUntil:'domcontentloaded',timeout:90000});await p.waitForFunction(()=>document.querySelector('[data-source-clock-ready]')?.getAttribute('data-source-clock-ready')==='true',null,{timeout:60000});}finally{await warm.close();}
 await Promise.all([['en',1440,false],['es',390,false],['en',370,true]].map(args=>run(...args)));
}finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(await bind())===JSON.stringify(inputs);receipt.status=receipt.records.length===3&&receipt.records.every(r=>r.status==='passed')&&receipt.inputsUnchanged?'passed':'failed';await save('receipt.json',receipt);console.log(encode({output:OUT,status:receipt.status,inputsUnchanged:receipt.inputsUnchanged}));if(receipt.status!=='passed')process.exitCode=1;}
