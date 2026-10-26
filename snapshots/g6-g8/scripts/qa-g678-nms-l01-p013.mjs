#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT, pin, encode} from './lib/g678-nms-l01-p013-generator-v1.mjs';
const ID='shared-nms002-l01-p013',FREEZE='catalog/product-bridge-calibrations/g678-nms-l01-p013-current-js-v1.json';
const BASE='http://127.0.0.1:3343',TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222';
assert(process.argv.length===4&&process.argv[2]==='--run'&&/^v[1-9]\d*$/u.test(process.argv[3]));
const profiles=process.env.P013_QA_PROFILE==='desktop-only'?[['en',1440,false]]:[['en',1440,false],['es',390,false],['en',370,true]];
assert(!process.env.P013_QA_PROFILE||process.env.P013_QA_PROFILE==='desktop-only');
const OUT=`${TASK}/nms-l01-p013-my-lesson-${process.argv[3]}`,packet=JSON.parse(await readFile(path.join(ROOT,FREEZE)));
const paths=[...new Set([FREEZE,'packages/demos/private-current-js-registry.json','packages/demos/src/registry.local-only.generated.ts','packages/demos/src/registry.local-only.metadata.generated.ts','apps/web/lib/g678-nms-l01-p013.server.ts','apps/web/lib/g678-current-js-extensions.server.ts','scripts/qa-g678-nms-l01-p013.mjs',...packet.inputs.map(b=>b.path),...packet.outputs.map(b=>b.path),...[2,3,4,5,7,8,9,10,11,13].map(n=>`apps/web/app/[locale]/migration-status/g678-calibration/shared-nms002-l01-p${String(n).padStart(3,'0')}/page.tsx`)])];
const bind=()=>Promise.all(paths.map(async file=>pin(file,await readFile(path.resolve(ROOT,file))))),inputs=await bind();
await mkdir(OUT);const save=(f,v)=>writeFile(path.join(OUT,f),encode(v),{flag:'wx'});
await save('inputs.json',inputs);await writeFile(path.join(OUT,'runner.mjs'),await readFile(new URL(import.meta.url)),{flag:'wx'});
const receipt={schemaVersion:1,animationId:ID,scope:'Actual private My Lesson integer drag/drop, all eight source identities, early Help and all three active native audio streams. Current-JS evidence only.',inputs,records:[],status:'running',productCalibrationPassed:false,scaleOutAuthorized:false,originalRuntimeAccepted:false,audioAccepted:false,humanAccepted:false,ownerAccepted:false,strictComplete:false,published:false};
const browser=await chromium.launch({headless:true,args:['--mute-audio','--autoplay-policy=document-user-activation-required']});
async function run(locale,width,reduced){
 const name=`${locale}-${width}-${reduced?'reduced':'natural'}`,record={name,status:'running',observations:[],errors:[],requests:[],screenshots:[],autoplayWarnings:[],pixelComparisons:[],branches:[],glossaryChecks:[],consoleDetails:[]};receipt.records.push(record);
 const context=await browser.newContext({viewport:{width,height:width<500?844:1000},reducedMotion:reduced?'reduce':'no-preference',serviceWorkers:'block',hasTouch:width<500});
 await context.route('**/*',route=>{const u=new URL(route.request().url()),allowed=u.origin===BASE;record.requests.push({url:u.href,allowed});return allowed?route.continue():route.abort();});
 const page=await context.newPage();page.setDefaultTimeout(25000);page.setDefaultNavigationTimeout(90000);
 await page.addInitScript(()=>{
  window.__p013Audio={events:[],contexts:[],nextNode:0,hashes:[]};window.__p013Console=[];for(const level of ['error','warn']){const original=console[level];console[level]=function(...args){window.__p013Console.push({level,args:args.map(String),stack:new Error().stack,page:document.querySelector('[data-lesson-player]')?.getAttribute('data-current-animation-id'),phase:document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-clock-phase')});return original.apply(this,args);};}const Original=window.AudioContext;
  window.AudioContext=class extends Original{
   constructor(options){super(options);this.sourceAnimationId=document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-course-canvas');this.auditId=window.__p013Audio.contexts.length;window.__p013Audio.contexts.push(this);window.__p013Audio.events.push({kind:'context',id:this.sourceAnimationId,contextId:this.auditId,rate:this.sampleRate});}
   close(){window.__p013Audio.events.push({kind:'close',id:this.sourceAnimationId,contextId:this.auditId});return super.close();}
  };
  const start=AudioBufferSourceNode.prototype.start,stop=AudioBufferSourceNode.prototype.stop,volume=AudioParam.prototype.setValueAtTime;
  AudioBufferSourceNode.prototype.start=function(...args){this.auditId=window.__p013Audio.nextNode++;window.__p013Audio.events.push({kind:'start',id:this.context.sourceAnimationId,nodeId:this.auditId,contextId:this.context.auditId,args,samples:this.buffer?.length,channels:this.buffer?.numberOfChannels,contextTime:this.context.currentTime,frame:document.querySelector('canvas[data-course-canvas]')?.getAttribute('data-flash-frame')});const e=window.__p013Audio.events.at(-1),samples=this.buffer.getChannelData(0),bytes=new ArrayBuffer(samples.length*4),view=new DataView(bytes);for(let i=0;i<samples.length;i++)view.setFloat32(i*4,samples[i],true);window.__p013Audio.hashes.push(crypto.subtle.digest('SHA-256',bytes).then(h=>{e.pcmSha256=Array.from(new Uint8Array(h),n=>n.toString(16).padStart(2,'0')).join('');}));this.addEventListener('ended',()=>window.__p013Audio.events.push({kind:'ended',id:this.context.sourceAnimationId,nodeId:this.auditId,contextTime:this.context.currentTime}));return start.apply(this,args);};
  AudioParam.prototype.setValueAtTime=function(value,time){window.__p013Audio.events.push({kind:'volume',value});return volume.call(this,value,time);};
  AudioBufferSourceNode.prototype.stop=function(...args){window.__p013Audio.events.push({kind:'stop',id:this.context.sourceAnimationId,nodeId:this.auditId,contextTime:this.context.currentTime});return stop.apply(this,args);};
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
 const compare=async(frame,label,reference=`main-${frame}`)=>{const img=(await readFile(`${TASK}/nms-l01-p013-canvas-v1/${reference}.png`)).toString('base64'),value=await page.evaluate(async b=>{
  const i=new Image();i.src='data:image/png;base64,'+b;await i.decode();const expected=document.createElement('canvas'),actual=document.createElement('canvas');for(const c of[expected,actual]){c.width=800;c.height=600;}
  const e=expected.getContext('2d',{willReadFrequently:true}),a=actual.getContext('2d',{willReadFrequently:true});e.drawImage(i,10,10,800,600,0,0,800,600);a.drawImage(document.querySelector('canvas[data-course-canvas]'),0,0);
  const ea=e.getImageData(0,0,800,600).data,aa=a.getImageData(0,0,800,600).data;let differences=0;for(let j=0;j<aa.length;j++)if(aa[j]!==ea[j])differences++;return{differences};
 },img);record.pixelComparisons.push({label,...value});assert.equal(value.differences,0);};
 const checkGlossary=async(selector,id)=>{
  const trigger=page.locator(selector);await trigger.click();const dialog=page.locator(`[data-p013-dialog="${id}"]`);await dialog.waitFor();
  assert((await dialog.innerText()).includes(packet.sourceGlossary.entries.find(e=>e.id===id).definitions[locale]));
  const before=[await root().getAttribute('data-source-wrong-frame'),await root().getAttribute('data-source-solved-count')];await page.waitForTimeout(100);
  await page.keyboard.press('Tab');assert(await dialog.evaluate(n=>n.contains(document.activeElement)));
  await page.keyboard.press('Shift+Tab');assert(await dialog.evaluate(n=>n.contains(document.activeElement)));
  await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
  await page.waitForFunction(selector=>document.activeElement===document.querySelector(selector),selector);
  assert.deepEqual([await root().getAttribute('data-source-wrong-frame'),await root().getAttribute('data-source-solved-count')],before);record.glossaryChecks.push({selector,id,focusRestored:true});
 };
 const select=async i=>act(`[data-p013-companion] [data-p013-piece="${i}"]`);
 const target=async i=>act(`[data-p013-companion] [data-p013-target="${i}"]`);
 const sourceDrag=async(index,targetIndex,cancel=false)=>{
  const piece=page.locator(`[data-p013-source-piece="${index}"]`);await piece.scrollIntoViewIfNeeded();const b=await piece.boundingBox(),stage=await canvas().boundingBox();assert(b&&stage);
  const target=targetIndex===null?{x:stage.x+stage.width*.05,y:stage.y+stage.height*.9}:await page.locator(`[data-p013-source-target="${targetIndex}"]`).boundingBox();assert(target);
  const start={x:b.x+b.width/2,y:b.y+b.height/2},end={x:target.x+(target.width??0)/2,y:target.y+(target.height??0)/2};
  if(width<500){const touch=await context.newCDPSession(page);try{await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});for(let step=1;step<=8;step++)await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*step/8,y:start.y+(end.y-start.y)*step/8,id:1}]});await touch.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});}finally{await touch.detach();}}
  else{await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:8});if(cancel){await page.locator(`[data-p013-source-piece="${index}"]`).dispatchEvent('pointercancel',{pointerId:1});}await page.mouse.up();}
 };
 const endedPictureCompare=async()=>{
  const expected=await page.evaluate(id=>{const actual=document.querySelector(`canvas[data-course-canvas="${id}"]`),c=document.createElement('canvas');c.width=800;c.height=600;window.HELP_MATH_CANVAS_ASSETS[id].render(c,{frame:243,scenario:'source-static-frame',lang:'en',seed:0,interaction:{solvedIndices:[1,2,3,4,5,6,7,8],selectedIndex:null,drag:null,inputEnabled:false,helpEnabled:false,helpVisible:false,wrongVisible:false,wrongFrame:1,coachFrame:1,correctFrame:1}});const measured=document.createElement('canvas');measured.width=800;measured.height=600;const m=measured.getContext('2d',{willReadFrequently:true}),reference=document.createElement('canvas');reference.width=800;reference.height=600;const ref=reference.getContext('2d',{willReadFrequently:true});m.drawImage(actual,0,0);ref.drawImage(c,0,0);const a=m.getImageData(0,0,800,600).data,b=ref.getImageData(0,0,800,600).data;let differences=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])differences++;return differences;},ID);
  record.pixelComparisons.push({label:'ended-product-agrees-with-queryable-complete-state',differences:expected,scope:'internal product/pure-state consistency; not original-runtime comparison'});assert.equal(expected,0);
 };
 try{
  const response=await page.goto(`${BASE}/${locale}/migration-status/g678-calibration/${ID}`,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);await ready(ID);await pause();
  if(reduced)assert.equal(await canvas().getAttribute('data-flash-frame'),'1');
  await inspect(196);await phase('question');await compare(196,'inspected-question');await shot('question');
  assert.equal(await page.locator('[data-p013-companion]').count(),1);assert.equal(await page.locator('[data-p013-companion] [data-p013-piece]').count(),8);assert.equal(await page.locator('[data-p013-source-piece]').count(),8);
  for(const [id,n] of [['number-line',17],['integers',18],['position',19]]){await checkGlossary(`[data-source-hotspot="${n}"]`,id);await phase('question');await checkGlossary(`[data-p013-primary-term="${id}"]`,id);}
  await inspect(171);await act('[data-p013-source-help]');assert.equal(await root().getAttribute('data-source-help-visible'),'true');await shot('help-171');
  await checkGlossary('[data-p013-source-help-term="set"]','set');await act('[data-p013-source-close-help]');assert.equal(await root().getAttribute('data-source-help-visible'),'false');assert.equal(await root().getAttribute('data-source-audio-frame'),'171');
  await button('pause').click();await phase('playing');await page.waitForTimeout(150);await act('[data-p013-help]');const helpFrame=await root().getAttribute('data-source-audio-frame');
  await page.waitForTimeout(180);assert.equal(await root().getAttribute('data-source-audio-frame'),helpFrame);await act('[data-p013-close-help]');await phase('playing');await pause();
  await inspect(196);await act('[data-p013-source-help]');await compare(196,'source-help-at196','help196');
  assert.equal(await page.locator('[data-p013-companion] [data-p013-piece]:enabled').count(),0);
  for(const id of ['integers','set','natural-number','counting-numbers']){await checkGlossary(`[data-p013-source-help-term="${id}"]`,id);await checkGlossary(`[data-p013-help-term="${id}"]`,id);}
  await act('[data-p013-close-help]');await phase('question');await inspect(243);
  assert.equal(await root().getAttribute('data-runtime-playback-complete'),'false');assert.equal(await root().getAttribute('data-source-correct-answer'),'false');
  for(let round=0;round<2;round++){
   await replay();await phase('question');await observe(`natural-question-${round}`);assert.equal(await canvas().getAttribute('data-flash-frame'),'196');
   if(round===0){await button('mute').click();const mute=page.locator('.lesson-shell2__volume-mute-action:visible').first();await mute.click();await page.waitForFunction(()=>window.__p013Audio.events.filter(e=>e.kind==='volume').at(-1)?.value===0);await mute.click();await page.waitForFunction(()=>window.__p013Audio.events.filter(e=>e.kind==='volume').at(-1)?.value>0);await button('mute').click();}
   const order=round?[8,7,6,5,4,3,2,1]:[1,2,3,4,5,6,7,8];
   if(round===0){
    await sourceDrag(3,4,true);await phase('question');assert.equal(await root().getAttribute('data-source-answer-attempts'),'0');
    await sourceDrag(3,4);await phase('wrong-wait');assert.equal(await root().getAttribute('data-source-solved-count'),'0');assert.equal(await root().getAttribute('data-source-wrong-frame'),'15');
    await shot('wrong-target');await compare(196,'wrong-source-picture','wrongFrame-15');
    const starts=await page.evaluate(()=>window.__p013Audio.events.filter(e=>e.kind==='start').length);await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>window.__p013Audio.events.filter(e=>e.kind==='start').length),starts);
    await act('[data-p013-source-close-wrong]');await phase('question');record.branches.push({kind:'wrong-target',piece:3,target:4});
    await sourceDrag(1,null);await phase('playing');await act('[data-p013-close-wrong]');await phase('question');record.branches.push({kind:'outside-early-close',piece:1});
    assert.equal(await root().getAttribute('data-source-answer-attempts'),'2');
   }
   for(let step=0;step<8;step++){
    const i=order[step],before=await page.evaluate(()=>window.__p013Audio.events.length);
    if(round===0)await sourceDrag(i,i);else{await select(i);assert.equal(await root().getAttribute('data-source-selected-index'),String(i));await target(i);}
    await phase('playing');assert.equal(await root().getAttribute('data-source-solved-count'),String(step+1));
    assert.equal(await page.locator('[data-p013-piece]:enabled').count(),0);assert.equal(await page.locator('[data-p013-help]:enabled').count(),0);
    if(step<7){await phase('question');assert.equal(await page.locator('[data-p013-piece]:enabled').count(),7-step);}
    else{
      const events=await page.evaluate(n=>window.__p013Audio.events.slice(n),before),outro=events.find(e=>e.kind==='start'&&e.samples===431424);assert(outro,'final future main narration scheduled before visual ticks');
      assert.equal(outro.args[1],(1673+188*22050/12)/22050);assert(outro.args[0]-outro.contextTime>3.3);
      await page.waitForFunction(()=>Number(document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-correct-frame'))>1);
      await pause();await observe(`final-feedback-paused-${round}`);await shot(`final-feedback-${round}`);
      const ev=await page.evaluate(()=>window.__p013Audio.events);assert(ev.some(e=>e.kind==='stop'&&e.nodeId===outro.nodeId));
      await button('pause').click();await phase('playing');await phase('ended');
    }
    record.branches.push({kind:'correct',sourceIndex:i,round,mode:round?'keyboard-or-tap':width<500?'touch-drag':'mouse-drag'});
    if(step===2){await act('[data-p013-help]');assert.equal(await root().getAttribute('data-source-solved-count'),'3');await act('[data-p013-close-help]');await phase('question');assert.equal(await root().getAttribute('data-source-solved-count'),'3');await shot('partial-three-'+round);}
   }
   const end=await observe(`natural-end-${round}`);assert.equal(end.frame,243);assert.equal(end['data-source-correct-answer'],'true');assert.equal(end['data-source-solved-count'],'8');
   assert.equal(end['data-runtime-playback-complete'],reduced?'false':'true');assert.equal(end['data-source-answer-attempts'],String(round?8:10));
   await endedPictureCompare();await page.waitForTimeout(180);assert.equal(await canvas().getAttribute('data-flash-frame'),'243');
  }
  await shot('natural-end');await replay();await phase('question');await select(2);await target(1);await phase('wrong-wait');
  await act('[data-p013-close-wrong]');await act('[data-p013-help]');
  await checkGlossary('[data-p013-help-term="set"]','set');
  await act('[data-p013-close-help]');await page.waitForFunction(()=>document.querySelector('[data-source-clock-runtime]')?.getAttribute('data-source-help-visible')==='false');await replay();
  assert.equal(await root().getAttribute('data-source-solved-count'),'0');assert.equal(await root().getAttribute('data-source-help-visible'),'false');
  await pause();await page.evaluate(()=>Promise.all(window.__p013Audio.hashes));record.audioBeforeReload=await page.evaluate(()=>window.__p013Audio.events);record.consoleBeforeReload=await page.evaluate(()=>window.__p013Console);
  const sourceStarts=record.audioBeforeReload.filter(e=>e.kind==='start'&&e.id===ID);assert.deepEqual([...new Set(sourceStarts.map(e=>e.pcmSha256))].sort(),packet.audioPlan.clips.map(c=>c.decoder.pcmSha256).sort());assert(sourceStarts.every(e=>e.channels===1&&e.args.length===3));
  record.nativeStreamsVerified=packet.audioPlan.clips.map(c=>({domain:c.frameDomain,samples:c.decoder.decodedSamples,pcmSha256:c.decoder.pcmSha256,startCount:sourceStarts.filter(e=>e.pcmSha256===c.decoder.pcmSha256).length}));
  await page.reload({waitUntil:'domcontentloaded'});await ready(ID);await pause();assert.equal(await root().getAttribute('data-source-answer-attempts'),'0');await observe('reload-reset');
  const oldContext=await page.evaluate(()=>window.__p013Audio.contexts.at(-1).auditId);
  await button('previous').click();await root().waitFor({state:'detached'});await page.waitForFunction(i=>window.__p013Audio.contexts[i].state==='closed',oldContext);
  assert.equal(await page.locator('[data-lesson-player]').getAttribute('data-current-animation-id'),'shared-nms002-l01-p012');
  await button('next').click();await ready(ID);await pause();assert.equal(await root().getAttribute('data-source-solved-count'),'0');await observe('returned-from-p012');
  const p13Context=await page.evaluate(()=>window.__p013Audio.contexts.at(-1).auditId);
  await button('next').click();await root().waitFor({state:'detached'});await page.waitForFunction(i=>window.__p013Audio.contexts[i].state==='closed',p13Context);
  assert.equal(await page.locator('[data-lesson-player]').getAttribute('data-current-animation-id'),'shared-nms002-l01-p014');
  await button('previous').click();await ready(ID);await pause();await observe('returned-from-p014');
  await page.evaluate(()=>Promise.all(window.__p013Audio.hashes));record.audioEvents=await page.evaluate(()=>window.__p013Audio.events);record.consoleDetails=await page.evaluate(()=>window.__p013Console);
  const geometry=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(geometry.scroll<=geometry.width+1);
  assert.deepEqual(record.errors,[]);assert(record.requests.every(r=>r.allowed));assert.equal(record.branches.filter(b=>b.kind==='correct').length,16);record.status='passed';
 }catch(error){record.status='failed';record.failure=error.stack;await observe('failure-state').catch(()=>{});await shot('failure').catch(()=>{});}
 finally{record.audioEvents??=await page.evaluate(()=>window.__p013Audio?.events).catch(()=>[]);record.consoleDetails=await page.evaluate(()=>window.__p013Console).catch(()=>[]);await context.close();await save(`${name}.json`,record);console.log(encode({name,status:record.status,failure:record.failure?.split('\n')[0]}));}
}
try{
 const warm=await browser.newContext();try{const p=await warm.newPage();await p.goto(`${BASE}/en/migration-status/g678-calibration/${ID}`,{waitUntil:'domcontentloaded',timeout:90000});await p.waitForFunction(()=>document.querySelector('[data-source-clock-ready]')?.getAttribute('data-source-clock-ready')==='true',null,{timeout:60000});}finally{await warm.close();}
 await Promise.all(profiles.map(args=>run(...args)));
}finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(await bind())===JSON.stringify(inputs);receipt.status=receipt.records.length===profiles.length&&receipt.records.every(r=>r.status==='passed')&&receipt.inputsUnchanged?'passed':'failed';await save('receipt.json',receipt);console.log(encode({output:OUT,status:receipt.status,inputsUnchanged:receipt.inputsUnchanged}));if(receipt.status!=='passed')process.exitCode=1;}
