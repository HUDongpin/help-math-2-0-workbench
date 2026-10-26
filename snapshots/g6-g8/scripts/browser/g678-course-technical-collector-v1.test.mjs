import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {fixture} from '../lib/g678-technical-assessor-fixture-v1.mjs';
import {assessPage} from '../lib/g678-technical-assessor-v1.mjs';
import {visibleControl,enterCourse,ownedCdpEndpoint,assertPreparedBrowser,actualCaptureDuration,recordLifecycleAudioResult,requireP005LifecycleAudioResult,observeLayout} from './g678-course-technical-collector-v1.mjs';

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function controlsFixture() {
 const states=new Map(),counts=new Map();
 const page={locator(selector){return {
  async count(){counts.set(selector,(counts.get(selector)??0)+1);return states.get(selector)?.attached?1:0;},
  nth(){return {
   async isVisible(){return states.get(selector).visible;},
   async isEnabled(){return states.get(selector).enabled;},
  };},
 };}};
 return {states,counts,page};
}

test('waits for an asynchronously attached, visible and enabled public control',async()=>{
 const f=controlsFixture(),control={attached:false,visible:false,enabled:false};f.states.set('#delayed',control);
 const timers=[setTimeout(()=>{control.attached=true;},5),setTimeout(()=>{control.visible=true;},15),setTimeout(()=>{control.enabled=true;},25)];
 try {
  const result=await visibleControl(f.page,'#delayed',200);
  assert.equal(await result.isVisible(),true);assert.equal(await result.isEnabled(),true);
  assert(f.counts.get('#delayed')>1,'control was re-observed after its initial absence');
 } finally {timers.forEach(clearTimeout);}
});

test('a persistently disabled visible control fails within the bounded wait',async()=>{
 const f=controlsFixture();f.states.set('#disabled',{attached:true,visible:true,enabled:false});const before=Date.now();
 await assert.rejects(visibleControl(f.page,'#disabled',45),/PUBLIC_CONTROL_NOT_VISIBLE_OR_ENABLED: #disabled/);
 assert(Date.now()-before>=40,'disabled state must be retried before timeout');
 assert(f.counts.get('#disabled')>1);
});

test('a missing selector remains an explicit bounded failure',async()=>{
 const f=controlsFixture(),before=Date.now();
 await assert.rejects(visibleControl(f.page,'#missing',45),/PUBLIC_CONTROL_NOT_VISIBLE_OR_ENABLED: #missing/);
 assert(Date.now()-before>=40,'absence must be retried before timeout');assert(f.counts.get('#missing')>1);
});

const prior='shared-alg001-l06-p039',target='shared-alg001-l06-p040';
const priorSelector=`button[data-animation-id="${prior}"]`,targetSelector=`button[data-animation-id="${target}"]`;
const mapSelector='[data-responsive-focus-key="map"]',nextSelector='[data-lesson-nav="footer-next"]';
function navigationFixture({initial='shared-alg001-l06-p001',mapRequired=false,neverCommit=false,normalEntry=true,touch=false,hydrated=true,hydrateAfterMs=null,targetNeedsMap=false,failInput=null}={}) {
 const state={current:initial,mapOpen:!mapRequired,url:'about:blank',hydrated,hydrationWaits:0,events:[],actions:[],commits:[],waits:[],timers:[]};
 const schedule=(callback,ms=12)=>state.timers.push(setTimeout(callback,ms));
 const player={getAttribute(name){return name==='data-current-animation-id'?state.current:null;}};
 const document={querySelector(selector){if(selector==='[data-lesson-player][data-hydrated="true"]')return state.hydrated?player:null;assert.equal(selector,'[data-lesson-player]');return player;}};
 const window={__g678TechnicalObserver:{records:{events:state.events}}};
 const performance={now:()=>globalThis.performance.now(),getEntriesByType:()=>[{name:state.url,type:'navigate',startTime:0,responseEnd:1,domContentLoadedEventEnd:2}]};
 const node=selector=>({tagName:'BUTTON',id:'',textContent:selector,getAttribute(name){return name==='data-responsive-focus-key'&&selector===mapSelector?'map':name==='data-animation-id'&&selector===priorSelector?prior:name==='data-animation-id'&&selector===targetSelector?target:null;}});
 const present=selector=>selector===mapSelector||selector===nextSelector||selector===targetSelector&&(!targetNeedsMap||state.mapOpen)||selector===priorSelector&&state.mapOpen;
 const activate=(selector,method,args)=>{
  assert.equal(args.length,0,'public click/tap receives no force option');
  if(failInput===selector)throw Error('Actual input dispatch failed');
  state.actions.push({selector,method,current:state.current,hydrated:state.hydrated});
  state.events.push({sequence:state.events.length+1,trusted:true,synthetic:false});
  if(!state.hydrated)return; // Visible SSR controls do not yet have their React handlers.
  if(selector===mapSelector){schedule(()=>{state.mapOpen=true;});return;}
  if(selector===nextSelector)assert.equal(state.current,prior,'Next may run only after the previous selection committed');
  const id=selector===priorSelector?prior:target;
  if(!neverCommit)schedule(()=>{state.current=id;state.commits.push(id);});
 };
 const page={
  async goto(url){state.url=url;if(hydrateAfterMs!==null)schedule(()=>{state.hydrated=true;},hydrateAfterMs);return {status:()=>200};},url:()=>state.url,
  async evaluate(callback,arg){return vm.runInNewContext(`(${callback.toString()})(arg)`,{document,window,performance,arg});},
  locator(selector){
   if(selector==='[data-lesson-player]')return {async getAttribute(name){return player.getAttribute(name);}};
   return {async count(){return present(selector)?1:0;},nth(){return {
    async isVisible(){return present(selector);},async isEnabled(){return true;},async evaluate(callback){return callback(node(selector));},
    async click(...args){activate(selector,'click',args);},async tap(...args){activate(selector,'tap',args);},
   };}};
  },
  async waitForFunction(callback,arg,{timeout}){
   if(arg===null)state.hydrationWaits++;else state.waits.push(arg);const deadline=Date.now()+timeout;
   do {if(await this.evaluate(callback,arg))return;await sleep(2);}while(Date.now()<deadline);
   throw Error(arg===null?'Lesson host hydration timed out':'Selection did not commit: '+arg);
  },
 };
 const parameters={route:'/{locale}/migration-status/g678-course/alg001/6',actions:{next:nextSelector},...(normalEntry?{normalEntry:{fromAnimationId:prior}}:{})};
 const config={origin:'http://127.0.0.1:3331',timeouts:{controlMs:50,selectionMs:80,readyMs:160}};
 const cell={locale:'en',touch},trace=[],diagnostics=[];
 return {page,state,trace,diagnostics,enter:()=>enterCourse(page,parameters,target,config,cell,trace,diagnostics),cleanup:()=>state.timers.forEach(clearTimeout)};
}

test('waits for prior-page commit before Next and target commit before returning',async()=>{
 const f=navigationFixture();
 try {
  const entry=await f.enter();assert.equal(entry.responseStatus,200);assert.equal(entry.sourceActionsCalled,false);assert.equal(entry.sourceStateWritten,false);
  assert.deepEqual(f.state.actions.map(a=>a.selector),[priorSelector,nextSelector]);
  assert.deepEqual(f.state.commits,[prior,target]);assert.deepEqual(f.state.waits,[prior,target]);
  assert.equal(f.state.current,target);assert(f.trace.every(t=>t.executed&&t.force===false&&t.method==='click'));
 } finally {f.cleanup();}
});

test('waits for asynchronous Map contents and keeps touch dispatch public and unforced',async()=>{
 const f=navigationFixture({mapRequired:true,touch:true});
 try {
  await f.enter();assert.deepEqual(f.state.actions.map(a=>a.selector),[mapSelector,priorSelector,nextSelector]);
  assert.deepEqual(f.state.commits,[prior,target]);assert.equal(f.diagnostics.length,0);
  assert(f.trace.every(t=>t.executed&&t.force===false&&t.method==='tap'));
 } finally {f.cleanup();}
});

test('direct public target selection waits for asynchronous host commit',async()=>{
 const f=navigationFixture({normalEntry:false});
 try {await f.enter();assert.deepEqual(f.state.actions.map(a=>a.selector),[targetSelector]);assert.deepEqual(f.state.waits,[target]);assert.equal(f.state.current,target);}
 finally {f.cleanup();}
});

test('a public click without a selection commit fails without dispatching Next',async()=>{
 const f=navigationFixture({neverCommit:true});
 try {
  await assert.rejects(f.enter(),/Selection did not commit/);
  assert.deepEqual(f.state.actions.map(a=>a.selector),[priorSelector]);assert.equal(f.state.commits.length,0);
 } finally {f.cleanup();}
});

test('an already selected target retains the existing no-extra-input behavior',async()=>{
 const f=navigationFixture({initial:target});
 try {await f.enter();assert.equal(f.state.actions.length,0);assert.equal(f.trace.length,0);}
 finally {f.cleanup();}
});


test('delayed hydration is observed before a visible SSR Map receives public input',async()=>{
 const f=navigationFixture({mapRequired:true,hydrated:false,hydrateAfterMs:90});
 try {
  await f.enter();assert.equal(f.state.hydrationWaits,1);
  assert.deepEqual(f.state.actions.map(a=>a.selector),[mapSelector,priorSelector,nextSelector]);
  assert(f.state.actions.every(a=>a.hydrated===true),'no input may be dispatched to unhydrated SSR controls');
  assert(f.trace.every(t=>t.executed&&t.force===false));assert.equal(f.state.current,target);
 } finally {f.cleanup();}
});

test('never-hydrated host times out without dispatching any public input',async()=>{
 const f=navigationFixture({mapRequired:true,hydrated:false});
 try {
  await assert.rejects(f.enter(),/Lesson host hydration timed out/);
  assert.equal(f.state.hydrationWaits,1);assert.equal(f.state.actions.length,0);assert.equal(f.trace.length,0);
  assert.equal(f.state.events.length,0);assert.equal(f.state.waits.length,0);
 } finally {f.cleanup();}
});


test('direct target on narrow host opens public Map then waits for exact target selection',async()=>{
 const f=navigationFixture({normalEntry:false,mapRequired:true,targetNeedsMap:true,touch:true});
 try {await f.enter();assert.deepEqual(f.state.actions.map(a=>a.selector),[mapSelector,targetSelector]);assert.deepEqual(f.state.waits,[target]);assert.equal(f.state.current,target);assert(f.trace.every(t=>t.force===false&&t.method==='tap'));}
 finally {f.cleanup();}
});
test('direct target dispatch failure is retained and never disguised as a hidden Map',async()=>{
 const f=navigationFixture({normalEntry:false,failInput:targetSelector});
 try {await assert.rejects(f.enter(),/Actual input dispatch failed/);assert.equal(f.trace.length,1);assert.equal(f.trace[0].executed,false);assert.equal(f.state.actions.length,0);assert.equal(f.state.waits.length,0);}
 finally {f.cleanup();}
});
function preparedBrowser() {
 const browser={mode:'attach-owned',profile:'/synthetic-test-profile',mainPid:12345,launchUnixMs:1800000000123,executableSHA256:'a'.repeat(64),cdpEndpoint:'http://127.0.0.1:38175'};
 const inspection={kind:'browser-audio-target-inspection-v1',ownedProfile:browser.profile,identity:{pid:browser.mainPid,launchUnixMs:browser.launchUnixMs,executableSHA256:browser.executableSHA256},windows:[{pid:browser.mainPid,id:98}]};
 return {browser,inspection,port:'38175\n/devtools/browser/abc-123\n'};
}
test('owned CDP attachment is derived from exact profile endpoint and frozen process identity',()=>{
 const f=preparedBrowser();assert.equal(ownedCdpEndpoint(f.browser,f.inspection,f.port),'ws://127.0.0.1:38175/devtools/browser/abc-123');assert.strictEqual(assertPreparedBrowser(f.browser,f.inspection),f.inspection);
 f.browser.cdpEndpoint='ws://localhost:38175/devtools/browser/abc-123';assert.equal(ownedCdpEndpoint(f.browser,f.inspection,f.port),f.browser.cdpEndpoint);
});
for(const [name,mutate] of [
 ['foreign host',f=>{f.browser.cdpEndpoint='http://example.com:38175';}],
 ['credential-bearing endpoint',f=>{f.browser.cdpEndpoint='http://user:password@127.0.0.1:38175';}],
 ['guessed port',f=>{f.browser.cdpEndpoint='http://127.0.0.1:9222';}],
 ['wrong browser websocket',f=>{f.browser.cdpEndpoint='ws://127.0.0.1:38175/devtools/browser/another';}],
 ['query on endpoint',f=>{f.browser.cdpEndpoint+='?target=all';}],
 ['wrong prepared PID',f=>{f.inspection.identity.pid++;}],
 ['wrong prepared launch',f=>{f.inspection.identity.launchUnixMs++;}],
 ['wrong prepared executable',f=>{f.inspection.identity.executableSHA256='b'.repeat(64);}],
 ['foreign profile',f=>{f.inspection.ownedProfile='/another-profile';}],
 ['invalid actual port file',f=>{f.port='38175\n/devtools/page/not-a-browser';}],
])test('owned CDP rejects '+name,()=>{const f=preparedBrowser();mutate(f);assert.throws(()=>ownedCdpEndpoint(f.browser,f.inspection,f.port));});
test('fresh native capture identity must still have one window in the prepared browser',()=>{
 for(const mutate of [f=>{f.inspection.identity.pid++;},f=>{f.inspection.identity.launchUnixMs++;},f=>{f.inspection.identity.executableSHA256='b'.repeat(64);},f=>{f.inspection.windows.push({...f.inspection.windows[0]});},f=>{f.inspection.windows[0].pid++;}]){const f=preparedBrowser();mutate(f);assert.throws(()=>assertPreparedBrowser(f.browser,f.inspection));}
});
test('capture duration uses actual locale PCM duration and never truncates Spanish to English',()=>{
 const make=(locale,samples)=>({locale,sourcePCM:{path:'synthetic-native.f32le',bytes:samples*4,sha256:'a'.repeat(64)},sampleRate:22050,sourceFirstDecodedSample:0,sourceEndDecodedSample:samples});
 const contract={terminal:{nominalDurationMs:13416.6667},audio:{cues:[make('en',282240),make('es',496125)]}};
 assert.equal(actualCaptureDuration(contract,'en'),24);assert.equal(actualCaptureDuration(contract,'es'),33);assert.equal(actualCaptureDuration(contract,'es',30),63);
 contract.audio.cues.pop();assert.throws(()=>actualCaptureDuration(contract,'es'),/actual locale source cue/);
 delete contract.audio.cues[0].sourcePCM;assert.throws(()=>actualCaptureDuration(contract,'en'),/measured native source duration/);
});


test('nonthrowing audio lifecycle FAIL retains its report and prevents the actual page assessor from passing',async t=>{
 const directory=fs.mkdtempSync(path.join(path.dirname(fileURLToPath(import.meta.url)),'.test-lifecycle-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
 const f=fixture(directory);assert.equal(assessPage(f).status,'pass');
 const cell=f.raw.cells[0];cell.diagnostics=[];
 const result={passed:false,status:'FAIL',failures:['pause RMS above threshold']},observed={report:f.put('failed-lifecycle-analysis.json',result),result};
 await recordLifecycleAudioResult(cell,async()=>observed);
 assert.strictEqual(cell.audioLifecycle,observed);assert.equal(cell.diagnostics[0].stage,'audio-lifecycle');assert.strictEqual(cell.diagnostics[0].report,observed.report);assert.equal(cell.errors[0].phase,'audio-lifecycle');
 // This is the collector's retained LOG_KEYS boundary, then the real assessor.
 cell.logPin=f.put('failed-lifecycle-logs.json',Object.fromEntries(['errors','consoleErrors','networkErrors','cleanupErrors'].map(key=>[key,cell[key]])));
 const assessed=assessPage(f);assert.equal(assessed.status,'fail');assert(assessed.issues.some(i=>i.code==='errors-missing-or-nonempty'&&i.cellId===cell.cellId));
});
test('missing lifecycle result, contradictory status and thrown assessment all enter the error log',async()=>{
 for(const observed of [{report:{path:'retained.json'}},{result:{passed:true,status:'FAIL'}},{result:{passed:false,status:'DECLARED_AUDIO_WINDOWS_PASS'}},null]){const cell={diagnostics:[],errors:[]};await recordLifecycleAudioResult(cell,async()=>observed);assert.strictEqual(cell.audioLifecycle,observed);assert.equal(cell.errors.length,1);}
 const thrown={diagnostics:[],errors:[]};await recordLifecycleAudioResult(thrown,async()=>{throw Error('actual capture failed');});assert.equal(thrown.errors.length,1);assert.match(thrown.errors[0].message,/actual capture failed/);
 const cell={diagnostics:[],errors:[]},observed={result:{passed:true,status:'DECLARED_AUDIO_WINDOWS_PASS'}};await recordLifecycleAudioResult(cell,async()=>observed);assert.strictEqual(cell.audioLifecycle,observed);assert.equal(cell.errors.length,0);assert.equal(cell.diagnostics.length,0);
});


function captureGroupFixture() {
 const nodes=[],selectors=new Map();
 const node=(selector,parent,box,text)=>{const value={parentElement:parent,innerText:text,namespaceURI:'http://www.w3.org/1999/xhtml',box,
  getBoundingClientRect(){const [left,top,width,height]=this.box;return {left,top,width,height,right:left+width,bottom:top+height};},
  contains(other){for(let current=other;current;current=current.parentElement)if(current===this)return true;return false;}};nodes.push(value);selectors.set(selector,[value]);return value;};
 const section=node('.sentence',null,[10,20,300,220],''),title=node('h2',section,[20,40,270,40],'Exact title'),sentence=node('p',section,[20,100,270,100],'Complete source sentence');
 node('.comparison',sentence,[40,125,80,30],'comparison');node('.proportion',sentence,[150,125,100,30],'proportion');const canvas=node('canvas',null,[10,900,300,220],'');
 const root={scrollWidth:320,clientWidth:320,clientHeight:844,scrollHeight:1120,
  getBoundingClientRect(){return {left:0,top:0,right:this.clientWidth,bottom:this.scrollHeight,width:this.clientWidth,height:this.scrollHeight};}};
 const rootStyle={overflowY:'visible',scrollbarGutter:'auto'};
 const document={documentElement:root,querySelectorAll:selector=>selectors.get(selector)??[],
  elementFromPoint(x,y){return [...nodes].reverse().find(n=>{const r=n.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;})??null;}};
 const viewport={innerWidth:320,innerHeight:844};
 const page={evaluate(callback,arg){return vm.runInNewContext(`(${callback.toString()})(arg)`,{arg,document,...viewport,getComputedStyle:node=>node===root?rootStyle:({display:'block',visibility:'visible',opacity:'1',overflowX:'visible',overflowY:'visible'})});}};
 const assertions=[{id:'title',stateId:'terminal',selector:'h2',text:'Exact title'},{id:'sentence',stateId:'terminal',selector:'p',text:'Complete source sentence'}];
 return {page,assertions,selectors,root,rootStyle,viewport,showCanvas(){for(const n of nodes)if(n!==canvas)n.box[1]-=700;canvas.box[1]=20;}};
}
test('layout retains actual viewport, root client/content geometry and gutter style independently of sample claims',async()=>{
 const f=captureGroupFixture();f.viewport.innerWidth=1440;f.viewport.innerHeight=900;f.root.clientWidth=f.root.scrollWidth=1425;f.root.clientHeight=900;f.root.scrollHeight=1200;f.rootStyle.scrollbarGutter='stable';
 const observed=await observeLayout(f.page,{layoutTargets:{sentence:'.sentence'}},'terminal',{sequence:7,viewport:{width:999,height:999}},f.assertions);
 const layout=JSON.parse(JSON.stringify(observed.layout));
 assert.equal(layout.rootClientWidth,1425);assert.equal(layout.rootScrollWidth,1425);
 assert.deepEqual(layout.documentGeometry,{viewportWidth:1440,viewportHeight:900,rootRect:{left:0,top:0,right:1425,bottom:1200,width:1425,height:1200},rootClientHeight:900,rootScrollHeight:1200,overflowY:'visible',scrollbarGutter:'stable'});
 f.root.scrollWidth=1460;const overflow=await observeLayout(f.page,{layoutTargets:{sentence:'.sentence'}},'terminal',{sequence:8},f.assertions);
 assert.equal(overflow.layout.rootScrollWidth,1460,'actual overflow is retained even when a gutter exists');
});
test('actual group containment captures source words once and does not repeat offscreen text for the Canvas group',async()=>{
 const f=captureGroupFixture(),sample={sequence:7};
 const sentence=await observeLayout(f.page,{layoutTargets:{sentence:'.sentence',comparison:'.comparison',proportion:'.proportion'}},'terminal',sample,f.assertions,{contentWithinLayoutTargets:true});
 assert.deepEqual(Array.from(sentence.contentChecks,c=>c.assertionId),['title','sentence']);assert(sentence.contentChecks.every(c=>c.containingTargetIds.includes('sentence')));
 f.showCanvas();const stage=await observeLayout(f.page,{layoutTargets:{stage:'canvas'}},'terminal',{sequence:8},f.assertions,{contentWithinLayoutTargets:true});
 assert.equal(stage.contentChecks.length,0);assert.deepEqual(Array.from(stage.outsideGroupAssertions,c=>c.assertionId),['title','sentence']);assert.equal(stage.unsupported.length,0);
 const covered=new Set([...sentence.contentChecks,...stage.contentChecks].map(c=>c.assertionId));assert(f.assertions.every(a=>covered.has(a.id)),'the complete state retains coverage of every declaration across actual groups');
});
test('missing or ambiguous content is preserved as unsupported before any containment filter',async()=>{
 for(const mutate of [f=>f.selectors.delete('h2'),f=>f.selectors.set('h2',[...f.selectors.get('h2'),...f.selectors.get('h2')])]){
  const f=captureGroupFixture();mutate(f);f.showCanvas();const stage=await observeLayout(f.page,{layoutTargets:{stage:'canvas'}},'terminal',{sequence:8},f.assertions,{contentWithinLayoutTargets:true});
  assert(stage.unsupported.some(row=>row.assertionId==='title'&&row.reason==='content selector absent or ambiguous'));assert(!stage.outsideGroupAssertions.some(row=>row.assertionId==='title'));
 }
});
test('P005 lifecycle capture absence remains a failing cell even when both natural audio runs are complete',t=>{
 const directory=fs.mkdtempSync(path.join(path.dirname(fileURLToPath(import.meta.url)),'.test-lifecycle-missing-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
 const f=fixture(directory),cell=f.raw.cells[0];assert.equal(cell.mediaChecks.length,2);cell.diagnostics=[{stage:'audio-control-lifecycle',status:'fail',reason:'native capture exited before ready'},{stage:'audio-lifecycle',status:'not-run',reason:'no handle'}];
 delete cell.audioLifecycle;assert.equal(assessPage(f).status,'pass','documents the prior diagnostics-only counterexample');
 requireP005LifecycleAudioResult(cell);assert.equal(cell.audioLifecycle,undefined,'no result or zero output is fabricated');assert(cell.diagnostics.some(row=>row.reason==='native capture exited before ready'));
 cell.logPin=f.put('missing-lifecycle-logs.json',Object.fromEntries(['errors','consoleErrors','networkErrors','cleanupErrors'].map(key=>[key,cell[key]])));
 const result=assessPage(f);assert.equal(result.status,'fail');assert(result.issues.some(i=>i.code==='errors-missing-or-nonempty'&&i.cellId===cell.cellId));
});
