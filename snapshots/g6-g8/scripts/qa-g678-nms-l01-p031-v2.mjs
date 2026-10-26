#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT, pin, encode} from './lib/g678-nms-l01-p031-generator-v1.mjs';
const ID='shared-nms002-l01-p031',FREEZE='catalog/product-bridge-calibrations/g678-nms-l01-p031-current-js-v1.json';
const BASE='http://127.0.0.1:3343',TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222';
assert(process.argv.length===4&&process.argv[2]==='--run'&&/^v[1-9]\d*$/u.test(process.argv[3]));
const profiles=[['es',768,false],['es',390,false],['en',370,true]];
assert(!process.env.P031_QA_PROFILE);
const OUT=`${TASK}/nms-l01-p031-my-lesson-${process.argv[3]}`,packet=JSON.parse(await readFile(path.join(ROOT,FREEZE)));
const paths=[...new Set([FREEZE,'packages/demos/private-current-js-registry.json','packages/demos/src/registry.local-only.generated.ts','packages/demos/src/registry.local-only.metadata.generated.ts','apps/web/lib/g678-nms-l01-p031.server.ts','apps/web/lib/g678-current-js-extensions.server.ts','scripts/qa-g678-nms-l01-p031-v2.mjs',...packet.inputs.map(b=>b.path),...packet.outputs.map(b=>b.path),...[30,31].map(n=>`apps/web/app/[locale]/migration-status/g678-calibration/shared-nms002-l01-p${String(n).padStart(3,'0')}/page.tsx`)])];
const bind=()=>Promise.all(paths.map(async file=>pin(file,await readFile(path.resolve(ROOT,file))))),inputs=await bind();
await mkdir(OUT);const save=(f,v)=>writeFile(path.join(OUT,f),encode(v),{flag:'wx'});
await save('inputs.json',inputs);await writeFile(path.join(OUT,'runner.mjs'),await readFile(new URL(import.meta.url)),{flag:'wx'});
const receipt={schemaVersion:1,animationId:ID,scope:'Actual private My Lesson four input additions, first retry/second reveal, bounded3wrong/4right variants, native11 audio streams, source549..604 fourth-answer repair, New Problem/refill, Help/glossary and keyboard/touch. Current-JS evidence only.',inputs,records:[],status:'running',productCalibrationPassed:false,scaleOutAuthorized:false,originalRuntimeAccepted:false,audioAccepted:false,humanAccepted:false,ownerAccepted:false,strictComplete:false,published:false};
const browser=await chromium.launch({headless:true,args:['--mute-audio','--autoplay-policy=document-user-activation-required']});
async function run(locale,width,reduced){
 const name=`${locale}-${width}-${reduced?'reduced':'natural'}`,record={name,status:'running',observations:[],errors:[],requests:[],screenshots:[],autoplayWarnings:[],pixelComparisons:[],branches:[],glossaryChecks:[],consoleDetails:[],stageGeometry:[],pictureChecks:[],fullRuns:0,pointerChecks:[]};receipt.records.push(record);
 const context=await browser.newContext({viewport:{width,height:width<500?844:1000},reducedMotion:reduced?'reduce':'no-preference',serviceWorkers:'block',hasTouch:width<500});
 await context.route('**/*',route=>{const u=new URL(route.request().url()),allowed=u.origin===BASE;record.requests.push({url:u.href,allowed});return allowed?route.continue():route.abort();});
 const page=await context.newPage();page.setDefaultTimeout(25000);page.setDefaultNavigationTimeout(90000);
 await page.addInitScript(()=>{
  window.__p031Audio={events:[],contexts:[],nextNode:0};const Original=window.AudioContext;
  const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  const decode=Original.prototype.decodeAudioData;Original.prototype.decodeAudioData=async function(bytes){const source=bytes.slice(0),b=await decode.call(this,bytes),pcm=b.getChannelData(0),raw=new ArrayBuffer(pcm.length*4),v=new DataView(raw);for(let i=0;i<pcm.length;i++)v.setFloat32(i*4,pcm[i],true);b.auditSourceSha256=await digest(source);window.__p031Audio.events.push({kind:'decode',id:this.sourceAnimationId,contextId:this.auditId,sourceSha256:await digest(source),pcmSha256:await digest(raw),sourceBytes:source.byteLength,samples:b.length,rate:b.sampleRate,channels:b.numberOfChannels});return b;};
  window.AudioContext=class extends Original{constructor(options){super(options);this.sourceAnimationId=document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-course-canvas');this.auditId=window.__p031Audio.contexts.length;window.__p031Audio.contexts.push(this);window.__p031Audio.events.push({kind:'context',id:this.sourceAnimationId,contextId:this.auditId,rate:this.sampleRate});}close(){window.__p031Audio.events.push({kind:'close',id:this.sourceAnimationId,contextId:this.auditId});return super.close();}};
  const start=AudioBufferSourceNode.prototype.start,stop=AudioBufferSourceNode.prototype.stop,volume=AudioParam.prototype.setValueAtTime;
  AudioBufferSourceNode.prototype.start=function(...args){this.auditId=window.__p031Audio.nextNode++;window.__p031Audio.events.push({kind:'start',id:this.context.sourceAnimationId,nodeId:this.auditId,contextId:this.context.auditId,args,sourceSha256:this.buffer?.auditSourceSha256,samples:this.buffer?.length,channels:this.buffer?.numberOfChannels,contextTime:this.context.currentTime,frame:document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-flash-frame')});this.addEventListener('ended',()=>window.__p031Audio.events.push({kind:'ended',id:this.context.sourceAnimationId,nodeId:this.auditId,contextTime:this.context.currentTime}));return start.apply(this,args);};
  AudioBufferSourceNode.prototype.stop=function(...args){window.__p031Audio.events.push({kind:'stop',id:this.context.sourceAnimationId,nodeId:this.auditId,contextTime:this.context.currentTime});return stop.apply(this,args);};
  AudioParam.prototype.setValueAtTime=function(value,time){window.__p031Audio.events.push({kind:'volume',value});return volume.call(this,value,time);};
 });
 page.on('pageerror',e=>record.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)record.errors.push(`HTTP ${r.status()} ${r.url()}`);});
 page.on('console',m=>{if(['error','warning'].includes(m.type())){if(m.text().startsWith('The AudioContext was not allowed to start.'))record.autoplayWarnings.push(m.text());else record.errors.push(m.text());}});
 const root=()=>page.locator(`[data-source-clock-runtime="${ID}"]`),canvas=()=>page.locator(`canvas[data-course-canvas="${ID}"]`),button=k=>page.locator(`[data-responsive-focus-key="${k}"]:visible`).first();
 const observe=async label=>{console.log(encode({stage:label,name}));const row={label,...await root().evaluate(n=>Object.fromEntries([...n.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value]))),frame:Number(await canvas().getAttribute('data-flash-frame'))};record.observations.push(row);return row;};
 const ready=async id=>page.waitForFunction(id=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-runtime')===id&&document.querySelector('[data-source-clock-ready]')?.getAttribute('data-source-clock-ready')==='true',id,{timeout:60000});
 const phase=async(expected,timeout=45000)=>page.waitForFunction(expected=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase')===expected,expected,{timeout});
 const pause=async()=>{if(await button('pause').getAttribute('data-frame-inspection-action')==='resume-current-js-from-inspected-frame')await button('pause').click();if(await root().getAttribute('data-runtime-paused')!=='true')await button('pause').click();await page.waitForFunction(()=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-runtime-paused')==='true'&&document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase')!=='playing');};
 const replay=async()=>{await button('replay').click();await phase('playing');assert.equal(await root().getAttribute('data-source-answer-attempts'),'0');assert.equal(await root().getAttribute('data-source-inspection'),'false');};
 const inspect=async frame=>{const t=page.locator('input[data-responsive-focus-key="timeline"]:visible').first();await t.evaluate((n,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(n,String(v));n.dispatchEvent(new Event('input',{bubbles:true}));n.dispatchEvent(new Event('change',{bubbles:true}));},frame);await page.waitForFunction(frame=>document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-flash-frame')===String(frame)&&document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-audio-frame')===String(frame),frame);await observe(`inspect-${frame}`);};
 const checkGeometry=async label=>{const g=await canvas().evaluate(n=>{const c=n.getBoundingClientRect();return {canvas:{x:c.x,y:c.y,right:c.right,bottom:c.bottom,width:c.width,height:c.height},clips:[...function*(){let p=n.parentElement;while(p){if(['lesson-shell2__stage','lesson-shell2__legacy-stage'].some(cls=>p.classList.contains(cls))){const r=p.getBoundingClientRect();yield {cls:p.className,scrollTop:p.scrollTop,scrollLeft:p.scrollLeft,scrollHeight:p.scrollHeight,clientHeight:p.clientHeight,rect:{x:r.x,y:r.y,right:r.right,bottom:r.bottom}};}p=p.parentElement;}}()],reducedNoteInStage:!!n.closest('.lesson-shell2__stage')?.querySelector('[data-p031-reduced-note]')};});record.stageGeometry.push({label,...g});assert.equal(g.reducedNoteInStage,false);for(const c of g.clips){assert.equal(c.scrollTop,0,label+':internal-scroll');assert.equal(c.scrollLeft,0);assert(g.canvas.x>=c.rect.x-1&&g.canvas.right<=c.rect.right+1&&g.canvas.y>=c.rect.y-1&&g.canvas.bottom<=c.rect.bottom+1,label+':source-canvas-cropped');}};
 const shot=async label=>{await checkGeometry(label);await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));const file=path.join(OUT,`${name}-${label}.png`);await page.screenshot({path:file,fullPage:true,animations:'disabled'});record.screenshots.push(pin(file,await readFile(file)));if(['question','pictures-all','natural-end','wrong-target'].includes(label)){const file=path.join(OUT,`${name}-${label}-viewport.png`);await canvas().scrollIntoViewIfNeeded();await page.screenshot({path:file,fullPage:false,animations:'disabled'});record.screenshots.push(pin(file,await readFile(file)));}};
 const act=async selector=>{const loc=page.locator(selector);await page.waitForFunction(s=>{const n=document.querySelector(s);return n&&!n.disabled;},selector);if(width<500)await loc.tap();else{await loc.focus();await loc.press('Enter');}};
 const compare=async(file,label)=>{const img=(await readFile(file)).toString('base64'),value=await page.evaluate(async b=>{const i=new Image();i.src='data:image/png;base64,'+b;await i.decode();const expected=document.createElement('canvas'),actual=document.createElement('canvas');for(const c of[expected,actual]){c.width=800;c.height=600;}const e=expected.getContext('2d',{willReadFrequently:true}),a=actual.getContext('2d',{willReadFrequently:true});e.drawImage(i,0,0);a.drawImage(document.querySelector('canvas[data-course-canvas]'),0,0);const ea=e.getImageData(0,0,800,600).data,aa=a.getImageData(0,0,800,600).data;let differences=0;for(let j=0;j<aa.length;j++)if(aa[j]!==ea[j])differences++;return{differences};},img);record.pixelComparisons.push({label,...value});assert.equal(value.differences,0);};
 const checkGlossary=async(selector,id)=>{
  const trigger=page.locator(selector);await trigger.click();const dialog=page.locator(`[data-p031-dialog="${id}"]`);await dialog.waitFor();
  assert((await dialog.innerText()).includes(packet.sourceGlossary.entries.find(e=>e.id===id).definitions[locale]));
  const before=[await root().getAttribute('data-source-feedback-frame'),await root().getAttribute('data-source-question-index')];await page.waitForTimeout(100);
  await page.keyboard.press('Tab');assert(await dialog.evaluate(n=>n.contains(document.activeElement)));
  await page.keyboard.press('Shift+Tab');assert(await dialog.evaluate(n=>n.contains(document.activeElement)));
  await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
  await page.waitForFunction(selector=>document.activeElement===document.querySelector(selector),selector);
  assert.deepEqual([await root().getAttribute('data-source-feedback-frame'),await root().getAttribute('data-source-question-index')],before);record.glossaryChecks.push({selector,id,focusRestored:true});
 };
 const reference=name=>`${TASK}/nms-l01-p031-canvas-v1/${name}.png`;
 const value=async text=>{await page.locator('[data-p031-companion] [data-p031-input]').fill(text);await page.waitForFunction(text=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-input')===text,text);};
 const sourceValue=async text=>{await page.locator('[data-p031-source-input]').fill(text);await page.waitForFunction(text=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-input')===text,text);};
 const closeWrong=async(source=false)=>{await act(source?'[data-p031-source-close-wrong]':'[data-p031-close-wrong]');};
 const nextQuestion=async index=>{await act('[data-p031-new-problem]');await phase('question');assert.equal(await root().getAttribute('data-source-question-index'),String(index));assert.equal(await canvas().getAttribute('data-flash-frame'),String(542+index*2));assert.equal(await root().getAttribute('data-source-input'),'');};
 const wrongWait=async()=>{await phase('wrong-wait');const id=Number(await root().getAttribute('data-source-feedback-id')),b=packet.practice.branches.find(b=>b.sourceCharacterId===id);assert(b?.kind==='wrong');assert.equal(await root().getAttribute('data-source-feedback-frame'),String(b.waitFrame));record.branches.push({kind:'wrong',id});return b;};
 try{
  const response=await page.goto(`${BASE}/${locale}/migration-status/g678-calibration/${ID}`,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);await ready(ID);await pause();
  record.beforeReload=await page.evaluate(()=>({origin:performance.timeOrigin,progress:JSON.parse(localStorage.getItem('helpmath:shared-nms002-l01:g678-calibration:v1'))}));assert.equal(record.beforeReload.progress.currentAnimationId,ID);
  await page.reload({waitUntil:'domcontentloaded'});await ready(ID);record.afterReload=await page.evaluate(()=>({origin:performance.timeOrigin,progress:JSON.parse(localStorage.getItem('helpmath:shared-nms002-l01:g678-calibration:v1'))}));assert.notEqual(record.afterReload.origin,record.beforeReload.origin);assert.equal(record.afterReload.progress.currentAnimationId,ID);await pause();
  await inspect(400);await compare(reference('main-400'),'intro-example');await shot('example');
  await inspect(542);await phase('question');await compare(reference('main-542'),'source-question');await shot('question');assert.equal(await page.locator('[data-p031-companion]').count(),1);
  await sourceValue('15');assert.equal(await page.locator('[data-p031-input]').inputValue(),'15');await compare(reference('input-0-15'),'restored-input');
  await checkGlossary('[data-source-hotspot="77"][data-source-hotspot-occurrence="0"]','solution');await checkGlossary('[data-p031-primary-term="solution"]','solution');
  await act('[data-p031-source-help]');assert.equal(await root().getAttribute('data-source-help-visible'),'true');await compare(reference('help-0'),'source-help');await shot('help');assert.equal(await page.locator('[data-p031-enter]:enabled').count(),0);
  await checkGlossary('[data-p031-source-help-term="number-line"]','number-line');await checkGlossary('[data-p031-help-term="number-line"]','number-line');
  await act('[data-p031-source-close-help]');assert.equal(await root().getAttribute('data-source-input'),'15');
  await value('bad');await act('[data-p031-enter]');assert.equal(await root().getAttribute('data-source-answer-attempts'),'0');assert(await page.locator('[data-p031-input]').getAttribute('aria-invalid')==='true');
  await value('0');await act('[data-p031-enter]');let b=await wrongWait();await compare(reference(`feedback-${b.sourceCharacterId}-${b.waitFrame}`),'wrong-source-text');await shot('wrong-target');
  const wrongStarts=await page.evaluate(id=>window.__p031Audio.events.filter(e=>e.kind==='start'&&e.id===id).length,ID);await pause();await button('pause').click();await phase('wrong-wait');assert.equal(await page.evaluate(id=>window.__p031Audio.events.filter(e=>e.kind==='start'&&e.id===id).length,ID),wrongStarts);
  await closeWrong(true);await phase('question');assert.equal(await root().getAttribute('data-source-input'),'');assert.equal(await root().getAttribute('data-source-wrong-attempts'),'1');
  await sourceValue('0');await act('[data-p031-source-enter]');b=await wrongWait();await compare(reference(`second-wrong-0-${b.sourceCharacterId}`),'second-wrong-source-text');await closeWrong();await phase('answered');assert.equal(await canvas().getAttribute('data-flash-frame'),'543');assert.equal(await page.locator('[data-p031-result]').innerText(),'15');await nextQuestion(1);
  await sourceValue('27');await act('[data-p031-help]');await act('[data-p031-close-help]');assert.equal(await root().getAttribute('data-source-input'),'27');
  for(const selector of ['[data-p031-enter]','[data-p031-new-problem]','[data-p031-help]']){const box=await page.locator(selector).boundingBox();assert(box.width>=44&&box.height>=44);}
  await replay();await page.waitForTimeout(1000);await pause();const held=await canvas().getAttribute('data-flash-frame');await page.waitForTimeout(180);assert.equal(await canvas().getAttribute('data-flash-frame'),held);await button('pause').click();await phase('playing');
  await button('mute').click();const mute=page.locator('.lesson-shell2__volume-mute-action:visible').first();await mute.click();await page.waitForFunction(()=>window.__p031Audio.events.filter(e=>e.kind==='volume').at(-1)?.value===0);await mute.click();await page.waitForFunction(()=>window.__p031Audio.events.filter(e=>e.kind==='volume').at(-1)?.value>0);await button('mute').click();
  await inspect(605);assert.equal(await root().getAttribute('data-runtime-playback-complete'),'false');assert.equal(await root().getAttribute('data-source-correct-count'),'0');
  record.introMotion=[];
  for(let round=0;round<2;round++){
   await replay();await page.evaluate(()=>{window.__p031IntroMotion=[];window.__p031MotionTimer=setInterval(()=>window.__p031IntroMotion.push(Number(document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-flash-frame'))),20);});
   await phase('question',65000);await observe(`natural-question-${round}`);
   const motion=await page.evaluate(()=>{clearInterval(window.__p031MotionTimer);return [...new Set(window.__p031IntroMotion)];});if(reduced)assert(motion.every(f=>packet.practice.introMotionKeyframes.includes(f)),`unexpected reduced intro ${motion}`);record.introMotion.push({round,reduced,frames:motion});
   for(let index=0;index<4;index++){
    assert.equal(await root().getAttribute('data-source-question-index'),String(index));const p=packet.practice.problems[index];
    if(round===0){
     await sourceValue(String(p.result));await page.locator('[data-p031-source-input]').press('Enter');await phase('playing');const right=Number(await root().getAttribute('data-source-feedback-id'));assert(packet.practice.branches.some(b=>b.kind==='right'&&b.sourceCharacterId===right));record.branches.push({kind:'right',id:right,index,round,via:'source-input-Enter'});
    }else{
     for(let attempt=0;attempt<2;attempt++){
      await value('0');await act('[data-p031-enter]');await wrongWait();
      assert.equal(await root().getAttribute('data-source-wrong-attempts'),String(attempt+1));await closeWrong(attempt===0);
      if(attempt===0){await phase('question');assert.equal(await root().getAttribute('data-source-input'),'');}
     }
     record.branches.push({kind:'revealed',index,round});
    }
    await page.waitForFunction(()=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-next-id')!=='');
    assert.equal(await root().getAttribute('data-source-next-id'),String(p.nextCharacterId));
    if(index===3){
     await pause();const before=await observe(`fourth-coaching-held-${round}`);await page.waitForTimeout(160);assert.equal(await root().getAttribute('data-source-next-frame'),before['data-source-next-frame']);await button('pause').click();await phase('playing');
     await page.waitForFunction(()=>Number(document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-audio-frame'))>=549);
     const transition=await observe(`fourth-answer-${round}`);assert(transition.frame>=549&&transition.frame<=604);assert.equal(await root().getAttribute('data-source-question-index'),'3');await phase('ended');assert.equal(await canvas().getAttribute('data-flash-frame'),'604');await compare(reference('main-604'),'final-source54');
    }else{await phase('answered');assert.equal(await canvas().getAttribute('data-flash-frame'),String(p.answerFrame));await compare(reference('main-'+p.answerFrame),`answer-${index}-${round}`);}
    assert.equal(await page.locator('[data-p031-result]').innerText(),String(p.result));
    if(index<3)await nextQuestion(index+1);
   }
   assert.deepEqual(JSON.parse(await root().getAttribute('data-source-outcomes')),Array(4).fill(round===0?'correct':'revealed'));
   assert.equal(await root().getAttribute('data-source-answer-attempts'),String(round===0?4:8));assert.equal(await root().getAttribute('data-runtime-playback-complete'),reduced?'false':'true');await shot(`natural-end-${round}`);record.fullRuns++;
   await act('[data-p031-source-new-problem]');await phase('question');assert.equal(await canvas().getAttribute('data-flash-frame'),'542');assert.equal(await root().getAttribute('data-source-answer-attempts'),'0');assert.deepEqual(JSON.parse(await root().getAttribute('data-source-outcomes')),Array(4).fill('unanswered'));
  }
  await nextQuestion(1);await nextQuestion(2);await nextQuestion(3);assert(await page.locator('[data-p031-new-problem]').isDisabled());assert.equal(await page.locator('[data-p031-source-new-problem]').count(),0);record.skipCheck=true;
  await value('54');await act('[data-p031-help]');await replay();assert.equal(await root().getAttribute('data-source-help-visible'),'false');assert.equal(await root().getAttribute('data-source-input'),'');assert.equal(await root().getAttribute('data-source-question-index'),'0');
  await button('previous').click();await root().waitFor({state:'detached'});await ready('shared-nms002-l01-p030');await page.waitForFunction(id=>window.__p031Audio.contexts.filter(c=>c.sourceAnimationId===id).every(c=>c.state==='closed'),ID);
  await button('next').click();await ready(ID);await pause();assert.equal(await root().getAttribute('data-source-question-index'),'0');assert.equal(await root().getAttribute('data-source-input'),'');
  await button('next').click();await root().waitFor({state:'detached'});assert.equal(await page.locator('[data-lesson-player]').getAttribute('data-current-animation-id'),'shared-nms002-l01-p032');await page.waitForFunction(()=>window.__p031Audio.contexts.every(c=>c.state==='closed'));
  await button('previous').click();await ready(ID);await pause();await checkGeometry('final-return');
  record.audioEvents=await page.evaluate(()=>window.__p031Audio.events);const starts=record.audioEvents.filter(e=>e.kind==='start'&&e.id===ID),decoded=record.audioEvents.filter(e=>e.kind==='decode'&&e.id===ID);
  for(const clip of packet.audioPlan.clips){const d=clip.decoder,rows=decoded.filter(e=>e.sourceSha256===d.sourceSha256);assert(rows.length>=3);for(const e of rows){assert.equal(e.pcmSha256,d.pcmSha256);assert.equal(e.sourceBytes,d.sourceBytes);assert.equal(e.samples,d.decodedSamples);assert.equal(e.rate,22050);assert.equal(e.channels,1);}}
  assert(decoded.every(e=>packet.audioPlan.clips.some(c=>c.decoder.sourceSha256===e.sourceSha256)));record.nativeDecodeChecks=decoded.length;
  assert(starts.every(e=>e.channels===1&&e.args.length===3));for(const e of starts){assert(e.args[1]*22050>=1673-.001);assert((e.args[1]+e.args[2])*22050<=e.samples+.001);assert(packet.audioPlan.clips.some(c=>c.decoder.sourceSha256===e.sourceSha256));}
  const initial=starts.filter(e=>e.samples===1105344&&e.frame==='1');assert(initial.length>=3);for(const e of initial){assert(Math.abs(e.args[1]-1673/22050)<1e-8);assert(Math.abs(e.args[2]-538/12)<1e-8);assert(Math.abs(e.args[0]-e.contextTime-3/12)<.03);}
  const outro=starts.filter(e=>e.samples===1105344&&e.args[1]*22050>=1003100);assert(outro.length>=2);record.nativeOutroChecks=outro.length;
  const g=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(g.scroll<=g.width+1);assert.deepEqual(record.errors,[]);assert.deepEqual(record.autoplayWarnings,[]);assert(record.requests.every(r=>r.allowed));assert.equal(record.fullRuns,2);record.status='passed';
 }catch(error){record.status='failed';record.failure=error.stack;await observe('failure-state').catch(()=>{});record.failureContext=await page.evaluate(()=>({contexts:window.__p031Audio?.contexts.map(c=>({state:c.state,time:c.currentTime}))})).catch(()=>null);await shot('failure').catch(()=>{});}
 finally{record.audioEvents??=await page.evaluate(()=>window.__p031Audio?.events).catch(()=>[]);await context.close();await save(`${name}.json`,record);console.log(encode({name,status:record.status,failure:record.failure?.split('\n')[0]}));}
}
try{const warm=await browser.newContext();try{const page=await warm.newPage();for(const id of [ID,'shared-nms002-l01-p030']){console.log('Warming '+id);await page.goto(`${BASE}/en/migration-status/g678-calibration/${id}`,{waitUntil:'domcontentloaded',timeout:180000});await page.waitForFunction(id=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-runtime')===id&&document.querySelector('[data-source-clock-ready]')?.getAttribute('data-source-clock-ready')==='true',id,{timeout:90000});}}finally{await warm.close();}await Promise.all(profiles.map(args=>run(...args)));}
finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(await bind())===JSON.stringify(inputs);receipt.status=receipt.records.length===profiles.length&&receipt.records.every(r=>r.status==='passed')&&receipt.inputsUnchanged?'passed':'failed';await save('receipt.json',receipt);console.log(encode({output:OUT,status:receipt.status,inputsUnchanged:receipt.inputsUnchanged}));if(receipt.status!=='passed')process.exitCode=1;}
