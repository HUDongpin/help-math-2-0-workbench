#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT, pin, encode} from './lib/g678-nms-l01-p029-generator-v1.mjs';
const ID='shared-nms002-l01-p029',FREEZE='catalog/product-bridge-calibrations/g678-nms-l01-p029-current-js-v1.json';
const BASE='http://127.0.0.1:3343',TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222';
assert(process.argv.length===4&&process.argv[2]==='--run'&&/^v[1-9]\d*$/u.test(process.argv[3]));
const profiles=[['es',768,false]];
const OUT=`${TASK}/nms-l01-p029-pointer-diagnostic-${process.argv[3]}`,packet=JSON.parse(await readFile(path.join(ROOT,FREEZE)));
const paths=[...new Set([FREEZE,'packages/demos/private-current-js-registry.json','packages/demos/src/registry.local-only.generated.ts','packages/demos/src/registry.local-only.metadata.generated.ts','apps/web/lib/g678-nms-l01-p029.server.ts','apps/web/lib/g678-current-js-extensions.server.ts','scripts/qa-g678-nms-l01-p029-pointer-diagnostic-v1.mjs',...packet.inputs.map(b=>b.path),...packet.outputs.map(b=>b.path),...[28,29].map(n=>`apps/web/app/[locale]/migration-status/g678-calibration/shared-nms002-l01-p${String(n).padStart(3,'0')}/page.tsx`)])];
const bind=()=>Promise.all(paths.map(async file=>pin(file,await readFile(path.resolve(ROOT,file))))),inputs=await bind();
await mkdir(OUT);const save=(f,v)=>writeFile(path.join(OUT,f),encode(v),{flag:'wx'});
await save('inputs.json',inputs);await writeFile(path.join(OUT,'runner.mjs'),await readFile(new URL(import.meta.url)),{flag:'wx'});
const receipt={schemaVersion:1,animationId:ID,scope:'Actual private My Lesson 13 opposite-integer choices,5 correct pairs,8 distractors, Help396, wrong glossary and397..437 continuation and three active native audio streams. Current-JS evidence only.',inputs,records:[],status:'running',productCalibrationPassed:false,scaleOutAuthorized:false,originalRuntimeAccepted:false,audioAccepted:false,humanAccepted:false,ownerAccepted:false,strictComplete:false,published:false};
const browser=await chromium.launch({headless:true,args:['--mute-audio','--autoplay-policy=document-user-activation-required']});
async function run(locale,width,reduced){
 const name=`${locale}-${width}-${reduced?'reduced':'natural'}`,record={name,status:'running',observations:[],errors:[],requests:[],screenshots:[],autoplayWarnings:[],pixelComparisons:[],branches:[],glossaryChecks:[],consoleDetails:[],stageGeometry:[],pictureChecks:[],fullRuns:0};receipt.records.push(record);
 const context=await browser.newContext({viewport:{width,height:width<500?844:1000},reducedMotion:reduced?'reduce':'no-preference',serviceWorkers:'block',hasTouch:width<500});
 await context.route('**/*',route=>{const u=new URL(route.request().url()),allowed=u.origin===BASE;record.requests.push({url:u.href,allowed});return allowed?route.continue():route.abort();});
 const page=await context.newPage();page.setDefaultTimeout(25000);page.setDefaultNavigationTimeout(90000);
 await page.addInitScript(()=>{
  window.__pointerEvents=[];for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,e=>{const n=e.target;window.__pointerEvents.push({type,x:e.clientX,y:e.clientY,pointerId:e.pointerId,scrollY,tag:n.tagName,attrs:Object.fromEntries([...n.attributes].filter(a=>a.name.startsWith('data-p029')).map(a=>[a.name,a.value]))});},true);
  window.__p029Audio={events:[],contexts:[],nextNode:0};const Original=window.AudioContext;
  const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  const decode=Original.prototype.decodeAudioData;Original.prototype.decodeAudioData=async function(bytes){const source=bytes.slice(0),b=await decode.call(this,bytes),pcm=b.getChannelData(0),raw=new ArrayBuffer(pcm.length*4),v=new DataView(raw);for(let i=0;i<pcm.length;i++)v.setFloat32(i*4,pcm[i],true);window.__p029Audio.events.push({kind:'decode',id:this.sourceAnimationId,contextId:this.auditId,sourceSha256:await digest(source),pcmSha256:await digest(raw),sourceBytes:source.byteLength,samples:b.length,rate:b.sampleRate,channels:b.numberOfChannels});return b;};
  window.AudioContext=class extends Original{constructor(options){super(options);this.sourceAnimationId=document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-course-canvas');this.auditId=window.__p029Audio.contexts.length;window.__p029Audio.contexts.push(this);window.__p029Audio.events.push({kind:'context',id:this.sourceAnimationId,contextId:this.auditId,rate:this.sampleRate});}close(){window.__p029Audio.events.push({kind:'close',id:this.sourceAnimationId,contextId:this.auditId});return super.close();}};
  const start=AudioBufferSourceNode.prototype.start,stop=AudioBufferSourceNode.prototype.stop,volume=AudioParam.prototype.setValueAtTime;
  AudioBufferSourceNode.prototype.start=function(...args){this.auditId=window.__p029Audio.nextNode++;window.__p029Audio.events.push({kind:'start',id:this.context.sourceAnimationId,nodeId:this.auditId,contextId:this.context.auditId,args,samples:this.buffer?.length,channels:this.buffer?.numberOfChannels,contextTime:this.context.currentTime,frame:document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-flash-frame')});this.addEventListener('ended',()=>window.__p029Audio.events.push({kind:'ended',id:this.context.sourceAnimationId,nodeId:this.auditId,contextTime:this.context.currentTime}));return start.apply(this,args);};
  AudioBufferSourceNode.prototype.stop=function(...args){window.__p029Audio.events.push({kind:'stop',id:this.context.sourceAnimationId,nodeId:this.auditId,contextTime:this.context.currentTime});return stop.apply(this,args);};
  AudioParam.prototype.setValueAtTime=function(value,time){window.__p029Audio.events.push({kind:'volume',value});return volume.call(this,value,time);};
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
 const checkGeometry=async label=>{const g=await canvas().evaluate(n=>{const c=n.getBoundingClientRect();return {canvas:{x:c.x,y:c.y,right:c.right,bottom:c.bottom,width:c.width,height:c.height},clips:[...function*(){let p=n.parentElement;while(p){if(['lesson-shell2__stage','lesson-shell2__legacy-stage'].some(cls=>p.classList.contains(cls))){const r=p.getBoundingClientRect();yield {cls:p.className,scrollTop:p.scrollTop,scrollLeft:p.scrollLeft,scrollHeight:p.scrollHeight,clientHeight:p.clientHeight,rect:{x:r.x,y:r.y,right:r.right,bottom:r.bottom}};}p=p.parentElement;}}()],reducedNoteInStage:!!n.closest('.lesson-shell2__stage')?.querySelector('[data-p029-reduced-note]')};});record.stageGeometry.push({label,...g});assert.equal(g.reducedNoteInStage,false);for(const c of g.clips){assert.equal(c.scrollTop,0,label+':internal-scroll');assert.equal(c.scrollLeft,0);assert(g.canvas.x>=c.rect.x-1&&g.canvas.right<=c.rect.right+1&&g.canvas.y>=c.rect.y-1&&g.canvas.bottom<=c.rect.bottom+1,label+':source-canvas-cropped');}};
 const shot=async label=>{await checkGeometry(label);await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));const file=path.join(OUT,`${name}-${label}.png`);await page.screenshot({path:file,fullPage:true,animations:'disabled'});record.screenshots.push(pin(file,await readFile(file)));if(['question','pictures-all','natural-end','wrong-target'].includes(label)){const file=path.join(OUT,`${name}-${label}-viewport.png`);await canvas().scrollIntoViewIfNeeded();await page.screenshot({path:file,fullPage:false,animations:'disabled'});record.screenshots.push(pin(file,await readFile(file)));}};
 const act=async selector=>{const loc=page.locator(selector);await page.waitForFunction(s=>{const n=document.querySelector(s);return n&&!n.disabled;},selector);if(width<500)await loc.tap();else{await loc.focus();await loc.press('Enter');}};
 const compare=async(file,label)=>{const img=(await readFile(file)).toString('base64'),value=await page.evaluate(async b=>{const i=new Image();i.src='data:image/png;base64,'+b;await i.decode();const expected=document.createElement('canvas'),actual=document.createElement('canvas');for(const c of[expected,actual]){c.width=800;c.height=600;}const e=expected.getContext('2d',{willReadFrequently:true}),a=actual.getContext('2d',{willReadFrequently:true});e.drawImage(i,0,0);a.drawImage(document.querySelector('canvas[data-course-canvas]'),0,0);const ea=e.getImageData(0,0,800,600).data,aa=a.getImageData(0,0,800,600).data;let differences=0;for(let j=0;j<aa.length;j++)if(aa[j]!==ea[j])differences++;return{differences};},img);record.pixelComparisons.push({label,...value});assert.equal(value.differences,0);};
 const checkGlossary=async(selector,id)=>{
  const trigger=page.locator(selector);await trigger.click();const dialog=page.locator(`[data-p029-dialog="${id}"]`);await dialog.waitFor();
  assert((await dialog.innerText()).includes(packet.sourceGlossary.entries.find(e=>e.id===id).definitions[locale]));
  const before=[await root().getAttribute('data-source-wrong-frame'),await root().getAttribute('data-source-solved-count')];await page.waitForTimeout(100);
  await page.keyboard.press('Tab');assert(await dialog.evaluate(n=>n.contains(document.activeElement)));
  await page.keyboard.press('Shift+Tab');assert(await dialog.evaluate(n=>n.contains(document.activeElement)));
  await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
  await page.waitForFunction(selector=>document.activeElement===document.querySelector(selector),selector);
  assert.deepEqual([await root().getAttribute('data-source-wrong-frame'),await root().getAttribute('data-source-solved-count')],before);record.glossaryChecks.push({selector,id,focusRestored:true});
 };
 const select=async i=>act(`[data-p029-companion] [data-p029-piece="${i}"]`);
 const target=async i=>act(`[data-p029-companion] [data-p029-target="${i}"]`);
 const sourceDrag=async(index,targetIndex,cancel=false)=>{
  const piece=page.locator(`[data-p029-source-piece="${index}"]`);await piece.scrollIntoViewIfNeeded();const b=await piece.boundingBox(),stage=await canvas().boundingBox();assert(b&&stage);
  const target=targetIndex===null?{x:stage.x+stage.width*.05,y:stage.y+stage.height*.9}:await page.locator(`[data-p029-source-target="${targetIndex}"]`).boundingBox();assert(target);
  const start={x:b.x+b.width/2,y:b.y+b.height/2},end={x:target.x+(target.width??0)/2,y:target.y+(target.height??0)/2};
  if(width<500){const touch=await context.newCDPSession(page);try{await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});for(let step=1;step<=8;step++)await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*step/8,y:start.y+(end.y-start.y)*step/8,id:1}]});await touch.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});}finally{await touch.detach();}}
  else{await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:8});if(cancel){await page.locator(`[data-p029-source-piece="${index}"]`).dispatchEvent('pointercancel',{pointerId:1});}await page.mouse.up();}
 };


 try{
  await page.goto(`${BASE}/${locale}/migration-status/g678-calibration/${ID}`,{waitUntil:'domcontentloaded'});await ready(ID);await pause();
  record.pointerChecks=[];
  for(let run=0;run<5;run++){
   await inspect(396);await sourceDrag(0,4);await phase('wrong-wait');
   for(const id of ['opposite-integers','value','distance','direction']){await checkGlossary(`[data-p029-source-wrong-term="${id}"]`,id);await checkGlossary(`[data-p029-wrong-term="${id}"]`,id);}
   await act('[data-p029-source-close-wrong]');await phase('question');
   await page.evaluate(()=>{window.__pointerEvents=[];});
   const before=await page.evaluate(()=>({scrollY,active:document.activeElement?.outerHTML,phase:document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase')}));
   await sourceDrag(1,null);await page.waitForTimeout(100);
   const after=await observe('outside-'+run),events=await page.evaluate(()=>window.__pointerEvents);
   record.pointerChecks.push({run,before,after,events});
   if(after['data-source-answer-attempts']!=='2'){await shot('missing-submit-'+run);break;}
   await act('[data-p029-close-wrong]');await phase('question');
  }
  record.status='diagnostic-complete';
 }catch(error){record.status='failed';record.failure=error.stack;record.pointerEvents=await page.evaluate(()=>window.__pointerEvents);await shot('failure').catch(()=>{});}
 finally{record.audioEvents=await page.evaluate(()=>window.__p029Audio.events);await context.close();await save(`${name}.json`,record);console.log(encode({name,status:record.status,pointerChecks:record.pointerChecks,failure:record.failure}));}
}
try{for(const profile of profiles)await run(...profile);}finally{await browser.close();await save('receipt.json',receipt);}
