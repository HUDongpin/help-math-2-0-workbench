#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT, pin, encode} from './lib/g678-nms-l01-p030-generator-v1.mjs';
const ID='shared-nms002-l01-p030',FREEZE='catalog/product-bridge-calibrations/g678-nms-l01-p030-current-js-v1.json';
const BASE='http://127.0.0.1:3343',TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222';
assert(process.argv.length===4&&process.argv[2]==='--run'&&/^v[1-9]\d*$/u.test(process.argv[3]));
const profiles=process.env.P030_QA_PROFILE==='desktop-only'?[['en',1440,false]]:[['en',1440,false],['es',768,false],['es',390,false],['en',370,true]];
assert(!process.env.P030_QA_PROFILE||process.env.P030_QA_PROFILE==='desktop-only');
const OUT=`${TASK}/nms-l01-p030-my-lesson-${process.argv[3]}`,packet=JSON.parse(await readFile(path.join(ROOT,FREEZE)));
const paths=[...new Set([FREEZE,'packages/demos/private-current-js-registry.json','packages/demos/src/registry.local-only.generated.ts','packages/demos/src/registry.local-only.metadata.generated.ts','apps/web/lib/g678-nms-l01-p030.server.ts','apps/web/lib/g678-current-js-extensions.server.ts','scripts/qa-g678-nms-l01-p030-v1.mjs',...packet.inputs.map(b=>b.path),...packet.outputs.map(b=>b.path),...[29,30].map(n=>`apps/web/app/[locale]/migration-status/g678-calibration/shared-nms002-l01-p${String(n).padStart(3,'0')}/page.tsx`)])];
const bind=()=>Promise.all(paths.map(async file=>pin(file,await readFile(path.resolve(ROOT,file))))),inputs=await bind();
await mkdir(OUT);const save=(f,v)=>writeFile(path.join(OUT,f),encode(v),{flag:'wx'});
await save('inputs.json',inputs);await writeFile(path.join(OUT,'runner.mjs'),await readFile(new URL(import.meta.url)),{flag:'wx'});
const receipt={schemaVersion:1,animationId:ID,scope:'Actual private My Lesson 15 absolute-value tokens,8 distinct rows,4 paired-token moves,7 distractors, Help449 and450 immediate stop and three active native audio streams. Current-JS evidence only.',inputs,records:[],status:'running',productCalibrationPassed:false,scaleOutAuthorized:false,originalRuntimeAccepted:false,audioAccepted:false,humanAccepted:false,ownerAccepted:false,strictComplete:false,published:false};
const browser=await chromium.launch({headless:true,args:['--mute-audio','--autoplay-policy=document-user-activation-required']});
async function run(locale,width,reduced){
 const name=`${locale}-${width}-${reduced?'reduced':'natural'}`,record={name,status:'running',observations:[],errors:[],requests:[],screenshots:[],autoplayWarnings:[],pixelComparisons:[],branches:[],glossaryChecks:[],consoleDetails:[],stageGeometry:[],pictureChecks:[],fullRuns:0,pointerChecks:[]};receipt.records.push(record);
 const context=await browser.newContext({viewport:{width,height:width<500?844:1000},reducedMotion:reduced?'reduce':'no-preference',serviceWorkers:'block',hasTouch:width<500});
 await context.route('**/*',route=>{const u=new URL(route.request().url()),allowed=u.origin===BASE;record.requests.push({url:u.href,allowed});return allowed?route.continue():route.abort();});
 const page=await context.newPage();page.setDefaultTimeout(25000);page.setDefaultNavigationTimeout(90000);
 await page.addInitScript(()=>{
  window.__p030Audio={events:[],contexts:[],nextNode:0};const Original=window.AudioContext;
  const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  const decode=Original.prototype.decodeAudioData;Original.prototype.decodeAudioData=async function(bytes){const source=bytes.slice(0),b=await decode.call(this,bytes),pcm=b.getChannelData(0),raw=new ArrayBuffer(pcm.length*4),v=new DataView(raw);for(let i=0;i<pcm.length;i++)v.setFloat32(i*4,pcm[i],true);window.__p030Audio.events.push({kind:'decode',id:this.sourceAnimationId,contextId:this.auditId,sourceSha256:await digest(source),pcmSha256:await digest(raw),sourceBytes:source.byteLength,samples:b.length,rate:b.sampleRate,channels:b.numberOfChannels});return b;};
  window.AudioContext=class extends Original{constructor(options){super(options);this.sourceAnimationId=document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-course-canvas');this.auditId=window.__p030Audio.contexts.length;window.__p030Audio.contexts.push(this);window.__p030Audio.events.push({kind:'context',id:this.sourceAnimationId,contextId:this.auditId,rate:this.sampleRate});}close(){window.__p030Audio.events.push({kind:'close',id:this.sourceAnimationId,contextId:this.auditId});return super.close();}};
  const start=AudioBufferSourceNode.prototype.start,stop=AudioBufferSourceNode.prototype.stop,volume=AudioParam.prototype.setValueAtTime;
  AudioBufferSourceNode.prototype.start=function(...args){this.auditId=window.__p030Audio.nextNode++;window.__p030Audio.events.push({kind:'start',id:this.context.sourceAnimationId,nodeId:this.auditId,contextId:this.context.auditId,args,samples:this.buffer?.length,channels:this.buffer?.numberOfChannels,contextTime:this.context.currentTime,frame:document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-flash-frame')});this.addEventListener('ended',()=>window.__p030Audio.events.push({kind:'ended',id:this.context.sourceAnimationId,nodeId:this.auditId,contextTime:this.context.currentTime}));return start.apply(this,args);};
  AudioBufferSourceNode.prototype.stop=function(...args){window.__p030Audio.events.push({kind:'stop',id:this.context.sourceAnimationId,nodeId:this.auditId,contextTime:this.context.currentTime});return stop.apply(this,args);};
  AudioParam.prototype.setValueAtTime=function(value,time){window.__p030Audio.events.push({kind:'volume',value});return volume.call(this,value,time);};
 });
 page.on('pageerror',e=>record.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)record.errors.push(`HTTP ${r.status()} ${r.url()}`);});
 page.on('console',m=>{if(['error','warning'].includes(m.type())){if(m.text().startsWith('The AudioContext was not allowed to start.'))record.autoplayWarnings.push(m.text());else record.errors.push(m.text());}});
 const root=()=>page.locator(`[data-source-clock-runtime="${ID}"]`),canvas=()=>page.locator(`canvas[data-course-canvas="${ID}"]`),button=k=>page.locator(`[data-responsive-focus-key="${k}"]:visible`).first();
 const observe=async label=>{console.log(encode({stage:label,name}));const row={label,...await root().evaluate(n=>Object.fromEntries([...n.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value]))),frame:Number(await canvas().getAttribute('data-flash-frame'))};record.observations.push(row);return row;};
 const ready=async id=>page.waitForFunction(id=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-runtime')===id&&document.querySelector('[data-source-clock-ready]')?.getAttribute('data-source-clock-ready')==='true',id,{timeout:60000});
 const phase=async(expected,timeout=45000)=>page.waitForFunction(expected=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase')===expected,expected,{timeout});
 const pause=async()=>{if(await root().getAttribute('data-runtime-paused')!=='true')await button('pause').click();await page.waitForFunction(()=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-runtime-paused')==='true'&&document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase')!=='playing');};
 const replay=async()=>{await button('replay').click();await phase('playing');assert.equal(await root().getAttribute('data-source-answer-attempts'),'0');assert.equal(await root().getAttribute('data-source-inspection'),'false');};
 const inspect=async frame=>{const t=page.locator('input[data-responsive-focus-key="timeline"]:visible').first();await t.evaluate((n,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(n,String(v));n.dispatchEvent(new Event('input',{bubbles:true}));n.dispatchEvent(new Event('change',{bubbles:true}));},frame);await page.waitForFunction(frame=>document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-flash-frame')===String(frame)&&document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-audio-frame')===String(frame),frame);await observe(`inspect-${frame}`);};
 const checkGeometry=async label=>{const g=await canvas().evaluate(n=>{const c=n.getBoundingClientRect();return {canvas:{x:c.x,y:c.y,right:c.right,bottom:c.bottom,width:c.width,height:c.height},clips:[...function*(){let p=n.parentElement;while(p){if(['lesson-shell2__stage','lesson-shell2__legacy-stage'].some(cls=>p.classList.contains(cls))){const r=p.getBoundingClientRect();yield {cls:p.className,scrollTop:p.scrollTop,scrollLeft:p.scrollLeft,scrollHeight:p.scrollHeight,clientHeight:p.clientHeight,rect:{x:r.x,y:r.y,right:r.right,bottom:r.bottom}};}p=p.parentElement;}}()],reducedNoteInStage:!!n.closest('.lesson-shell2__stage')?.querySelector('[data-p030-reduced-note]')};});record.stageGeometry.push({label,...g});assert.equal(g.reducedNoteInStage,false);for(const c of g.clips){assert.equal(c.scrollTop,0,label+':internal-scroll');assert.equal(c.scrollLeft,0);assert(g.canvas.x>=c.rect.x-1&&g.canvas.right<=c.rect.right+1&&g.canvas.y>=c.rect.y-1&&g.canvas.bottom<=c.rect.bottom+1,label+':source-canvas-cropped');}};
 const shot=async label=>{await checkGeometry(label);await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));const file=path.join(OUT,`${name}-${label}.png`);await page.screenshot({path:file,fullPage:true,animations:'disabled'});record.screenshots.push(pin(file,await readFile(file)));if(['question','pictures-all','natural-end','wrong-target'].includes(label)){const file=path.join(OUT,`${name}-${label}-viewport.png`);await canvas().scrollIntoViewIfNeeded();await page.screenshot({path:file,fullPage:false,animations:'disabled'});record.screenshots.push(pin(file,await readFile(file)));}};
 const act=async selector=>{const loc=page.locator(selector);await page.waitForFunction(s=>{const n=document.querySelector(s);return n&&!n.disabled;},selector);if(width<500)await loc.tap();else{await loc.focus();await loc.press('Enter');}};
 const compare=async(file,label)=>{const img=(await readFile(file)).toString('base64'),value=await page.evaluate(async b=>{const i=new Image();i.src='data:image/png;base64,'+b;await i.decode();const expected=document.createElement('canvas'),actual=document.createElement('canvas');for(const c of[expected,actual]){c.width=800;c.height=600;}const e=expected.getContext('2d',{willReadFrequently:true}),a=actual.getContext('2d',{willReadFrequently:true});e.drawImage(i,0,0);a.drawImage(document.querySelector('canvas[data-course-canvas]'),0,0);const ea=e.getImageData(0,0,800,600).data,aa=a.getImageData(0,0,800,600).data;let differences=0;for(let j=0;j<aa.length;j++)if(aa[j]!==ea[j])differences++;return{differences};},img);record.pixelComparisons.push({label,...value});assert.equal(value.differences,0);};
 const checkGlossary=async(selector,id)=>{
  const trigger=page.locator(selector);await trigger.click();const dialog=page.locator(`[data-p030-dialog="${id}"]`);await dialog.waitFor();
  assert((await dialog.innerText()).includes(packet.sourceGlossary.entries.find(e=>e.id===id).definitions[locale]));
  const before=[await root().getAttribute('data-source-wrong-frame'),await root().getAttribute('data-source-solved-count')];await page.waitForTimeout(100);
  await page.keyboard.press('Tab');assert(await dialog.evaluate(n=>n.contains(document.activeElement)));
  await page.keyboard.press('Shift+Tab');assert(await dialog.evaluate(n=>n.contains(document.activeElement)));
  await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
  await page.waitForFunction(selector=>document.activeElement===document.querySelector(selector),selector);
  assert.deepEqual([await root().getAttribute('data-source-wrong-frame'),await root().getAttribute('data-source-solved-count')],before);record.glossaryChecks.push({selector,id,focusRestored:true});
 };
 const select=async i=>act(`[data-p030-companion] [data-p030-piece="${i}"]`);
 const target=async i=>act(`[data-p030-companion] [data-p030-target="${i}"]`);
 const sourceDrag=async(index,targetIndex,cancel=false)=>{
  const piece=page.locator(`[data-p030-source-piece="${index}"]`);await piece.scrollIntoViewIfNeeded();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.waitForFunction(index=>{const b=document.querySelector(`[data-p030-source-piece="${index}"]`);if(!b||b.disabled)return false;const r=b.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===b;},index);
  const b=await piece.boundingBox(),stage=await canvas().boundingBox();assert(b&&stage);
  const target=targetIndex===null?{x:stage.x+stage.width*.05,y:stage.y+stage.height*.9}:await page.locator(`[data-p030-source-target="${targetIndex}"]`).boundingBox();assert(target);
  const start={x:b.x+b.width/2,y:b.y+b.height/2},end={x:target.x+(target.width??0)/2,y:target.y+(target.height??0)/2};
  record.pointerChecks.push({index,targetIndex,cancel,start,end,sourceVisibleAndHit:true});
  const accepted=()=>page.waitForFunction(index=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-selected-index')===String(index),index,{timeout:3000});
  if(width<500){const touch=await context.newCDPSession(page);try{await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});await accepted();for(let step=1;step<=8;step++)await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*step/8,y:start.y+(end.y-start.y)*step/8,id:1}]});await touch.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});}finally{await touch.detach();}}
  else{await page.mouse.move(start.x,start.y);await page.mouse.down();await accepted();await page.mouse.move(end.x,end.y,{steps:8});if(cancel){await page.locator(`[data-p030-source-piece="${index}"]`).dispatchEvent('pointercancel',{pointerId:1});}await page.mouse.up();}
 };

 const reference=name=>`${TASK}/nms-l01-p030-canvas-v1/${name}.png`;
 const valid=[];
 function enumerate(index,assignments){if(index===9){valid.push(assignments);return;}enumerate(index+1,assignments);for(const targetIndex of packet.practice.choices.find(c=>c.sourceIndex===index).permittedTargets){if(assignments.some(a=>a.targetIndex===targetIndex))continue;enumerate(index+1,[...assignments,{sourceIndex:index,targetIndex}]);}}
 enumerate(1,[]);assert.equal(valid.length,784);const full=valid.filter(a=>a.length===8);
 const assignments=async()=>JSON.parse(await root().getAttribute('data-source-assignments'));
 const assignmentKey=a=>JSON.stringify([...a].sort((a,b)=>a.sourceIndex-b.sourceIndex));
 const assignedReference=a=>{const n=valid.findIndex(v=>assignmentKey(v)===assignmentKey(a));assert(n>=0);return reference('assignment-'+n);};
 const completeReference=a=>{const n=full.findIndex(v=>assignmentKey(v)===assignmentKey(a));assert(n>=0);return reference('complete-'+n+'-main-450');};
 const assertTop=async index=>{const n=page.locator(`[data-p030-source-piece="${index}"]`);await n.scrollIntoViewIfNeeded();const hit=await n.evaluate(n=>{const r=n.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.getAttribute('data-p030-source-piece');});assert.equal(hit,String(index));record.tokenInstanceChecks.push({index,sourceTopmost:true});};
 try{
  const response=await page.goto(`${BASE}/${locale}/migration-status/g678-calibration/${ID}`,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);await ready(ID);await pause();
  record.beforeReload=await page.evaluate(()=>({origin:performance.timeOrigin,progress:JSON.parse(localStorage.getItem('helpmath:shared-nms002-l01:g678-calibration:v1'))}));assert.equal(record.beforeReload.progress.currentAnimationId,ID);
  await page.reload({waitUntil:'domcontentloaded'});await ready(ID);record.afterReload=await page.evaluate(()=>({origin:performance.timeOrigin,progress:JSON.parse(localStorage.getItem('helpmath:shared-nms002-l01:g678-calibration:v1'))}));assert.notEqual(record.afterReload.origin,record.beforeReload.origin);assert.equal(record.afterReload.progress.currentAnimationId,ID);await pause();
  await inspect(400);await compare(reference('main-400'),'intro-example');assert.equal(await page.locator('[data-p030-source-help],[data-p030-help]').count(),0);await shot('example');
  await inspect(449);await phase('question');await compare(reference('main-449'),'inspected-question');await shot('question');
  assert.equal(await page.locator('[data-p030-companion]').count(),1);assert.equal(await page.locator('[data-p030-companion] [data-p030-piece]').count(),15);assert.equal(await page.locator('[data-p030-source-piece]').count(),15);assert.equal(await page.locator('[data-p030-target]').count(),8);assert.equal(await page.locator('[data-p030-source-target]').count(),8);
  record.tokenInstanceChecks=[];record.assignmentGuardChecks=[];record.finalSilenceChecks=[];
  await assertTop(2);await assertTop(7);
  for(const pair of [[2,4],[6,7]]){const labels=await Promise.all(pair.map(i=>page.locator(`[data-p030-piece="${i}"]`).getAttribute('aria-label')));assert.notEqual(labels[0],labels[1]);record.tokenInstanceChecks.push({pair,distinctAccessibleNames:labels});}
  for(const t of packet.practice.targets){const text=await page.locator(`[data-p030-target="${t.targetIndex}"]`).innerText();assert(text.includes('?'));assert(text.includes(String(t.givenValue).replace('-','−')));}
  for(const [id,n,occurrences]of [['integers',20,1],['absolute-value',21,2],['column',22,1]]){
   assert.equal(await page.locator(`[data-source-hotspot="${n}"]`).count(),occurrences);for(let occurrence=0;occurrence<occurrences;occurrence++)await checkGlossary(`[data-source-hotspot="${n}"][data-source-hotspot-occurrence="${occurrence}"]`,id);
   await checkGlossary(`[data-p030-primary-term="${id}"]`,id);
  }
  await select(7);await act('[data-p030-source-help]');assert.equal(await root().getAttribute('data-source-help-visible'),'true');await compare(reference('help-0'),'source-help449');await shot('help');assert.equal(await page.locator('[data-p030-piece]:enabled').count(),0);
  for(const id of ['absolute-value','distance','number-line']){await checkGlossary(`[data-p030-source-help-term="${id}"]`,id);await checkGlossary(`[data-p030-help-term="${id}"]`,id);}
  await act('[data-p030-close-help]');await phase('question');assert.deepEqual(await assignments(),[]);assert.equal(await root().getAttribute('data-source-selected-index'),'7');
  for(const selector of ['[data-p030-companion] [data-p030-piece]','[data-p030-companion] [data-p030-target]','[data-p030-help]'])for(const el of await page.locator(selector).all()){const b=await el.boundingBox();assert(b.height>=44&&b.width>=44);}
  await replay();await page.waitForTimeout(1800);await pause();const held=await canvas().getAttribute('data-flash-frame');await page.waitForTimeout(200);assert.equal(await canvas().getAttribute('data-flash-frame'),held);await button('pause').click();await phase('playing');
  await button('mute').click();const mute=page.locator('.lesson-shell2__volume-mute-action:visible').first();await mute.click();await page.waitForFunction(()=>window.__p030Audio.events.filter(e=>e.kind==='volume').at(-1)?.value===0);await mute.click();await page.waitForFunction(()=>window.__p030Audio.events.filter(e=>e.kind==='volume').at(-1)?.value>0);await button('mute').click();
  await inspect(450);assert.equal(await root().getAttribute('data-runtime-playback-complete'),'false');assert.equal(await root().getAttribute('data-source-correct-answer'),'false');assert(await page.locator('[data-p030-piece="2"]').isDisabled());assert.equal(await page.locator('[data-p030-source-help],[data-p030-help]').count(),0);
  record.introMotion=[];
  for(let round=0;round<2;round++){
   await replay();await page.evaluate(()=>{window.__p030IntroMotion=[];window.__p030MotionTimer=setInterval(()=>window.__p030IntroMotion.push(Number(document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-flash-frame'))),20);});
   await phase('question');await observe(`natural-question-${round}`);assert.equal(await canvas().getAttribute('data-flash-frame'),'449');assert.equal(await root().getAttribute('data-source-help-visible'),'false');
   const motion=await page.evaluate(()=>{clearInterval(window.__p030MotionTimer);return [...new Set(window.__p030IntroMotion)];});if(reduced)assert(motion.every(f=>packet.practice.introMotionKeyframes.includes(f)),`unexpected reduced intro ${motion}`);record.introMotion.push({round,reduced,frames:motion});
   const alternate=width===768||width===370,swapped4=round?!alternate:alternate,swapped1=round===1;
   const destination={1:1,2:swapped4?4:2,3:3,4:swapped4?2:4,5:5,6:swapped1?7:6,7:swapped1?6:7,8:8};
   const order=round?[4,6,2,7,8,5,3,1]:[2,7,4,6,1,3,5,8];
   if(round===0){
    await sourceDrag(2,1,true);await phase('question');assert.equal(await root().getAttribute('data-source-answer-attempts'),'0');
    await sourceDrag(1,2);await phase('wrong-wait');assert.deepEqual(await assignments(),[]);assert.equal(await root().getAttribute('data-source-wrong-frame'),'15');await compare(reference(reduced?'wrongFrame-2':'wrongFrame-15'),'wrong-source-picture');await shot('wrong-target');
    assert.equal(await page.locator('[data-p030-source-wrong-term],[data-p030-wrong-term]').count(),0);await act('[data-p030-source-close-wrong]');await phase('question');record.branches.push({kind:'wrong-target',piece:1,target:2});
    await sourceDrag(8,null);await phase('playing');await act('[data-p030-close-wrong]');await phase('question');record.branches.push({kind:'outside-early-close',piece:8});
    for(let i=9;i<=15;i++){await sourceDrag(i,i-8);await phase('wrong-wait');assert.deepEqual(await assignments(),[]);await act('[data-p030-close-wrong]');await phase('question');record.branches.push({kind:'distractor',sourceIndex:i,target:i-8});}
    assert.equal(await root().getAttribute('data-source-answer-attempts'),'9');
   }
   for(let step=0;step<8;step++){
    const source=order[step],row=destination[source],before=await page.evaluate(()=>window.__p030Audio.events.length);
    if(round===0)await sourceDrag(source,row);else{await select(source);assert.equal(await root().getAttribute('data-source-selected-index'),String(source));await target(row);}
    await phase('playing');assert.equal(await root().getAttribute('data-source-solved-count'),String(step+1));assert.equal(await page.locator('[data-p030-piece]:enabled').count(),0);assert.equal(await page.locator('[data-p030-help]:enabled').count(),0);
    const current=await assignments();assert(current.some(a=>a.sourceIndex===source&&a.targetIndex===row));assert.equal(new Set(current.map(a=>a.targetIndex)).size,step+1);
    if(step<7){await phase('question');assert.equal(await page.locator('[data-p030-piece]:enabled').count(),14-step);}
    else{
     const events=await page.evaluate(n=>window.__p030Audio.events.slice(n),before);assert.equal(events.filter(e=>e.kind==='start'&&e.samples===811584).length,0,'main450 stops immediately');assert.equal(events.filter(e=>e.kind==='start'&&e.samples===34560).length,1);
     await page.waitForFunction(()=>Number(document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-correct-frame'))>1);await pause();await observe(`final-feedback-paused-${round}`);await shot(`final-feedback-${round}`);
     const count=await page.evaluate(id=>window.__p030Audio.events.filter(e=>e.kind==='start'&&e.id===id).length,ID);await button('pause').click();await phase('playing');await phase('ended');assert.equal(await page.evaluate(id=>window.__p030Audio.events.filter(e=>e.kind==='start'&&e.id===id).length,ID),count);record.finalSilenceChecks.push({round,noOutroNode:true,resumeAddedNoNativeNode:true});
    }
    record.branches.push({kind:'correct',sourceIndex:source,targetIndex:row,round,mode:round?'keyboard-or-tap':width<500?'touch-drag':'mouse-drag'});
    assert((await page.locator(`[data-p030-target="${row}"]`).innerText()).includes('✓'));assert(await page.locator(`[data-p030-piece="${source}"]`).isDisabled());
    if(round===0&&step===0){
     await compare(assignedReference(current),'first-paired-token-moved');await assertTop(4);
     await sourceDrag(4,row);await phase('wrong-wait');assert.deepEqual(await assignments(),current);assert.equal(await root().getAttribute('data-source-solved-count'),'1');await act('[data-p030-close-wrong]');await phase('question');
     record.branches.push({kind:'occupied-target',sourceIndex:4,targetIndex:row});record.assignmentGuardChecks.push({placedToken:2,placedTokenDisabled:true,occupiedRowRejected:true,assignmentsUnchanged:true});
    }
    if(round===0&&step===1)await assertTop(6);
    if(step===1){await select(order[step+1]);const selected=await root().getAttribute('data-source-selected-index');await act('[data-p030-help]');assert.equal(await root().getAttribute('data-source-solved-count'),'2');await checkGlossary('[data-p030-help-term="distance"]','distance');await act('[data-p030-close-help]');await phase('question');assert.equal(await root().getAttribute('data-source-selected-index'),selected);assert.equal(await root().getAttribute('data-source-solved-count'),'2');await shot('partial-two-'+round);}
   }
   const end=await observe(`natural-end-${round}`),a=await assignments();assert.equal(end.frame,450);assert.equal(end['data-source-correct-answer'],'true');assert.equal(end['data-source-solved-count'],'8');assert.equal(end['data-runtime-playback-complete'],reduced?'false':'true');assert.equal(end['data-source-answer-attempts'],String(round?8:18));
   assert.equal(new Set(a.map(p=>p.targetIndex)).size,8);await compare(completeReference(a),'source-completed-eight-'+round);assert.equal(await page.locator('[data-p030-source-help],[data-p030-help]').count(),0);await page.waitForTimeout(180);assert.equal(await canvas().getAttribute('data-flash-frame'),'450');record.fullRuns++;
  }
  await shot('natural-end');await replay();await phase('question');await select(2);await target(1);await phase('wrong-wait');await act('[data-p030-close-wrong]');await act('[data-p030-help]');await replay();
  assert.deepEqual(await assignments(),[]);assert.equal(await root().getAttribute('data-source-help-visible'),'false');await observe('replay-resets-all');
  await button('previous').click();await root().waitFor({state:'detached'});await ready('shared-nms002-l01-p029');await page.waitForFunction(id=>window.__p030Audio.contexts.filter(c=>c.sourceAnimationId===id).every(c=>c.state==='closed'),ID);
  await button('next').click();await ready(ID);await pause();assert.deepEqual(await assignments(),[]);await observe('return-from-previous-reset');
  await button('next').click();await root().waitFor({state:'detached'});assert.equal(await page.locator('[data-lesson-player]').getAttribute('data-current-animation-id'),'shared-nms002-l01-p031');await page.waitForFunction(()=>window.__p030Audio.contexts.every(c=>c.state==='closed'));
  await button('previous').click();await ready(ID);await pause();await observe('return-from-next-reset');await checkGeometry('final-return');
  record.audioEvents=await page.evaluate(()=>window.__p030Audio.events);const starts=record.audioEvents.filter(e=>e.kind==='start'&&e.id===ID),decoded=record.audioEvents.filter(e=>e.kind==='decode'&&e.id===ID);
  for(const clip of packet.audioPlan.clips){const d=clip.decoder,rows=decoded.filter(e=>e.samples===d.decodedSamples);assert(rows.length>=3);for(const e of rows){assert.equal(e.sourceSha256,d.sourceSha256);assert.equal(e.pcmSha256,d.pcmSha256);assert.equal(e.sourceBytes,d.sourceBytes);assert.equal(e.rate,22050);assert.equal(e.channels,1);}}
  assert(decoded.every(e=>packet.audioPlan.clips.some(c=>c.decoder.decodedSamples===e.samples)));record.nativeDecodeChecks=decoded.length;
  assert.deepEqual([...new Set(starts.map(e=>e.samples))].sort((a,b)=>a-b),[27072,34560,811584]);assert(starts.every(e=>e.channels===1&&e.args.length===3));
  for(const e of starts){assert(e.args[1]*22050>=1673-.001);assert((e.args[1]+e.args[2])*22050<=(e.samples===811584?810173:e.samples)+.001);}
  const initial=starts.filter(e=>e.samples===811584&&e.frame==='1');assert(initial.length>=3);for(const e of initial){assert(Math.abs(e.args[1]-1673/22050)<1e-8);assert(Math.abs(e.args[2]-440/12)<1e-8);assert(Math.abs(e.args[0]-e.contextTime-8/12)<.03);}
  const g=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(g.scroll<=g.width+1);assert.deepEqual(record.errors,[]);assert.deepEqual(record.autoplayWarnings,[]);assert(record.requests.every(r=>r.allowed));assert.equal(record.branches.filter(b=>b.kind==='correct').length,16);assert.equal(record.branches.filter(b=>b.kind==='distractor').length,7);record.status='passed';
 }catch(error){record.status='failed';record.failure=error.stack;await observe('failure-state').catch(()=>{});record.failureContext=await page.evaluate(()=>({contexts:window.__p030Audio?.contexts.map(c=>({state:c.state,time:c.currentTime}))})).catch(()=>null);await shot('failure').catch(()=>{});}
 finally{record.audioEvents??=await page.evaluate(()=>window.__p030Audio?.events).catch(()=>[]);await context.close();await save(`${name}.json`,record);console.log(encode({name,status:record.status,failure:record.failure?.split('\n')[0]}));}
}
try{const warm=await browser.newContext();try{const page=await warm.newPage();for(const id of [ID,'shared-nms002-l01-p029']){console.log('Warming '+id);await page.goto(`${BASE}/en/migration-status/g678-calibration/${id}`,{waitUntil:'domcontentloaded',timeout:180000});await page.waitForFunction(id=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-runtime')===id&&document.querySelector('[data-source-clock-ready]')?.getAttribute('data-source-clock-ready')==='true',id,{timeout:90000});}}finally{await warm.close();}await Promise.all(profiles.map(args=>run(...args)));}
finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(await bind())===JSON.stringify(inputs);receipt.status=receipt.records.length===profiles.length&&receipt.records.every(r=>r.status==='passed')&&receipt.inputsUnchanged?'passed':'failed';await save('receipt.json',receipt);console.log(encode({output:OUT,status:receipt.status,inputsUnchanged:receipt.inputsUnchanged}));if(receipt.status!=='passed')process.exitCode=1;}
