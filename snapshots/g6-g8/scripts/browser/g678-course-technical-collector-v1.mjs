/** Actual public-input collection. Missing observations remain gaps, never defaults. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createRequire} from 'node:module';
import {installG678TechnicalObserver} from './g678-technical-observer-v1.mjs';
import {createG678CommittedRuntimeAdapter} from './g678-committed-runtime-adapter-v1.mjs';
import {DEFAULT_CELLS,REQUIRED_SUPPLEMENT_IDS} from '../lib/g678-technical-assessor-v1.mjs';
import {qualifyAudioTools,inspectOwnedAudioBrowser,runFreshAudioNegatives,beginActualAudioCapture,finishActualAudioCapture,exportActualFlowAudio,assessActualLifecycleAudio} from './g678-actual-audio-collector-v1.mjs';
import {sourceVmOwnerChanged,sourceVmReplayCause,sourceVmRetired,readRetainedSourceSurface} from '../lib/g678-source-vm-lifecycle-v1.mjs';
import {P005_ID,assertP005Parameters,createP005RuntimeAdapter,p005CaptureGroups,p005GlossaryIssues,p005TerminalHeld,p005AudioBoundaryReady,p005AudioAdvanced,p005GroupImageCoverage,readP005Destination} from './g678-nms-l07-p005-flow-v1.mjs';
import {installSourceVmHtmlMediaObserver} from './g678-source-vm-html-media-observer-v1.mjs';
import {retainSourceMediaResponse} from './g678-source-vm-media-response-v1.mjs';
import {observeHomeMetadataFailures} from './g678-home-metadata-prefetch-v1.mjs';

const run=promisify(execFile),sha=b=>createHash('sha256').update(b).digest('hex');
export function sourceStateMatches(value,expected) {
 return !!value&&!!expected&&Object.entries(expected).every(([key,want])=>{
  const actual=key.split('.').reduce((v,k)=>v?.[k],value);return JSON.stringify(actual)===JSON.stringify(want);
 });
}
export function sameCommit(a,b) {
 return !!a&&!!b&&a.identity?.playerId===b.identity?.playerId&&a.identity?.runToken===b.identity?.runToken&&
  a.identity?.leaseToken===b.identity?.leaseToken&&a.render?.surfaceId===b.render?.surfaceId&&
  a.render?.commitId===b.render?.commitId&&a.source?.frame===b.source?.frame&&a.source?.tick===b.source?.tick;
}
export function normalizeDispatchedEvents(events,trace) {
 return events.map(event=>{
  const matches=trace.filter(command=>command.executed&&command.force===false&&event.atMs>=command.beforeMs&&event.atMs<=command.afterMs&&
   command.observedEventSequences.includes(event.sequence)&&event.trusted===true&&!event.synthetic);
  return matches.length===1?{...event,forced:false,dispatcherCommandId:matches[0].id,
   ...(['next','previous','play','pause','replay'].includes(matches[0].action)?{action:matches[0].action}:{})}:event;
 });
}
function actualPin(root,pin) {
 const file=path.resolve(root,pin.path);assert.equal(fs.realpathSync(file),file,'physical evidence input');
 const before=fs.statSync(file,{bigint:true}),bytes=fs.readFileSync(file),after=fs.statSync(file,{bigint:true});
 assert(before.isFile()&&before.size===after.size&&before.mtimeNs===after.mtimeNs&&before.ctimeNs===after.ctimeNs,'stable evidence input');
 assert.equal(bytes.length,pin.bytes,'input length');assert.equal(sha(bytes),pin.sha256,'input hash');return bytes;
}
export function requireFrozenPin(root,inputPins,pin) {
 assert(pin&&typeof pin.path==='string','required exact dependency pin');
 const file=path.resolve(root,pin.path);assert(inputPins.some(p=>path.resolve(root,p.path)===file&&p.bytes===pin.bytes&&p.sha256===pin.sha256),'dependency is in frozen inputs: '+pin.path);
 return actualPin(root,pin);
}
function put(directory,name,value) {
 const file=path.join(directory,name);assert(file.startsWith(directory+'/'),'bounded output');fs.mkdirSync(path.dirname(file),{recursive:true});
 const bytes=Buffer.isBuffer(value)?value:Buffer.from(typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');fs.writeFileSync(file,bytes,{flag:'wx'});
 return {path:file,bytes:bytes.length,sha256:sha(bytes)};
}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function routeFor(parameters,origin,locale) {
 const url=new URL(parameters.route.replace('{locale}',locale),origin),base=new URL(origin);
 assert(url.origin===base.origin&&['127.0.0.1','localhost','[::1]'].includes(url.hostname)&&url.protocol==='http:'&&!url.username&&!url.password,'exact local course route');return url.href;
}
async function browserNow(page) {return page.evaluate(()=>({atMs:performance.now(),unixMs:Date.now()}));}
async function snapshot(page) {return page.evaluate(()=>{window.__g678SourceVmHtmlMediaObserver?.sample();return window.__g678TechnicalObserver?.sample()??null;});}
async function observedRecords(page) {return page.evaluate(()=>{const records=window.__g678TechnicalObserver?.records;return records?structuredClone({...records,
  ...(window.__g678SourceVmHtmlMediaObserver?{htmlMedia:window.__g678SourceVmHtmlMediaObserver.records}:{})}):null;});}

async function currentAudioDocument(page) {return page.evaluate(()=>({documentId:window.__g678TechnicalObserver?.records.documentId,
 documentTimeOrigin:performance.timeOrigin,href:location.href,unixMs:Date.now()}));}
/** Early proof from the actual media response, before allocating a long recording.
 * A later public Replay can reuse bytes in this same document, never another one. */
export function assertCurrentHtmlMediaProvenance({cue,records,mediaResources,document,expectedUrl}) {
 assert(cue?.transport==='html-media'&&typeof document?.documentId==='string'&&document.documentId&&
  Number.isFinite(document.documentTimeOrigin)&&Number.isFinite(document.unixMs)&&document.href===expectedUrl,
 'actual current HTML media document required');
 const html=records?.htmlMedia;
 assert(records.documentId===document.documentId&&html?.documentId===document.documentId&&
  html.documentTimeOrigin===document.documentTimeOrigin&&html.errors.length===0&&html.unsupported.length===0,
 'technical and native media observers belong to the same current document');
 const responses=mediaResources.filter(row=>row.documentId===document.documentId&&row.url===cue.sourceUrl);
 assert(responses.length>0&&responses.every(row=>row.kind==='browser-media-response-body-v1'&&
  row.documentTimeOrigin===document.documentTimeOrigin&&row.requestMethod==='GET'&&row.resourceType==='media'&&row.redirected===false&&
  (row.status===200&&row.contentRange===null||row.status===206&&row.contentRange===`bytes 0-${cue.source.bytes-1}/${cue.source.bytes}`)&&
  Number.isFinite(row.requestStartUnixMs)&&row.requestStartUnixMs>=document.documentTimeOrigin&&
  Number.isFinite(row.responseEndUnixMs)&&row.responseEndUnixMs>=row.requestStartUnixMs&&row.responseEndUnixMs<=document.unixMs&&
  row.body?.bytes===cue.source.bytes&&row.body.sha256===cue.source.sha256),
 'complete current-document media response, time origin, range and source hash required before recording');
 return {kind:'current-document-html-media-provenance-preflight-v1',document,source:cue.source,sourceUrl:cue.sourceUrl,responses,
  outputWaveformCompared:false,coldDocumentEntryCaptured:false,scenario:'public-replay-after-same-document-source-warmup'};
}

export function ownedCdpEndpoint(browser,inspection,activePortText) {
 assert.equal(browser.mode,'attach-owned');assert(path.isAbsolute(browser.profile),'actual absolute owned profile');
 assert(Number.isSafeInteger(browser.mainPid)&&browser.mainPid>1&&Number.isFinite(browser.launchUnixMs)&&browser.launchUnixMs>0&&/^[a-f0-9]{64}$/.test(browser.executableSHA256),'actual browser process identity');
 assert.equal(inspection.kind,'browser-audio-target-inspection-v1');assert.equal(inspection.ownedProfile,browser.profile);
 assert.equal(inspection.identity.pid,browser.mainPid);assert.equal(inspection.identity.launchUnixMs,browser.launchUnixMs);assert.equal(inspection.identity.executableSHA256,browser.executableSHA256);
 const lines=activePortText.trim().split(/\r?\n/),port=Number(lines[0]);assert(Number.isSafeInteger(port)&&port>0&&port<=65535&&/^\/devtools\/browser\/[a-zA-Z0-9-]+$/.test(lines[1]??''),'actual DevToolsActivePort');
 const url=new URL(browser.cdpEndpoint);assert(['http:','ws:'].includes(url.protocol)&&['127.0.0.1','localhost','[::1]'].includes(url.hostname)&&Number(url.port)===port&&!url.username&&!url.password&&!url.search&&!url.hash,'exact loopback CDP endpoint');
 assert(url.protocol==='ws:'?url.pathname===lines[1]:['','/'].includes(url.pathname),'CDP path matches actual profile endpoint');
 return `ws://${url.host}${lines[1]}`;
}
export function assertPreparedBrowser(browser,inspection) {
 assert.equal(inspection.identity.pid,browser.mainPid,'same prepared browser PID');
 assert.equal(inspection.identity.launchUnixMs,browser.launchUnixMs,'same actual browser launch');
 assert.equal(inspection.identity.executableSHA256,browser.executableSHA256,'same actual browser executable');
 assert.equal(inspection.windows.length,1,'one actual owned cell window');assert.equal(inspection.windows[0].pid,browser.mainPid);
 return inspection;
}
/** Inspect only this already-owned cell context; never close or alter a target. */
export async function readOwnedContextWindows(context,currentPage) {
 const result={kind:'owned-cell-context-window-observation-v1',observedAt:new Date().toISOString(),readOnly:true,acceptance:false,pages:[],
  windowIdScope:'CDP window IDs; correspondence to native capture window IDs is not assumed'};
 for(const ownedPage of context.pages()) {
  const row={currentPage:ownedPage===currentPage,url:ownedPage.url(),closed:ownedPage.isClosed()};result.pages.push(row);let session;
  try {
   session=await context.newCDPSession(ownedPage);
   const {targetInfo}=await session.send('Target.getTargetInfo');
   row.target={targetId:targetInfo.targetId,type:targetInfo.type,browserContextId:targetInfo.browserContextId??null};
   row.window=await session.send('Browser.getWindowForTarget',{targetId:targetInfo.targetId});
  } catch(error){row.error=String(error);}
  finally{if(session)try{await session.detach();}catch(error){row.detachError=String(error);}}
 }
 return result;
}
export function actualCaptureDuration(contract,locale,allowance=0) {
 const cues=(contract.audio?.cues??[]).filter(c=>c.locale===locale);assert(cues.length,'actual locale source cue required');
 const durations=cues.map(c=>{assert(c.sourcePCM&&Number.isFinite(c.sampleRate)&&c.sampleRate>0&&Number.isSafeInteger(c.sourceFirstDecodedSample)&&Number.isSafeInteger(c.sourceEndDecodedSample)&&c.sourceEndDecodedSample>c.sourceFirstDecodedSample,'measured native source duration required');return(c.sourceEndDecodedSample-c.sourceFirstDecodedSample)/c.sampleRate;});
 const source=(contract.terminal.nominalDurationMs??contract.terminal.minimumDurationMs)/1000;
 assert(source>0&&allowance>=0&&allowance<=120);return Math.ceil(Math.max(source,...durations)+10+allowance);
}
export async function recordLifecycleAudioResult(cell,produce) {
 try {
  cell.audioLifecycle=await produce();
  assert(cell.audioLifecycle?.result?.passed===true&&cell.audioLifecycle.result.status==='DECLARED_AUDIO_WINDOWS_PASS',
   'Actual lifecycle output assessment did not pass: '+String(cell.audioLifecycle?.result?.status??'missing-result'));
 } catch(error) {
  cell.diagnostics.push({stage:'audio-lifecycle',status:'fail',reason:String(error),report:cell.audioLifecycle?.report??null});
  cell.errors.push({phase:'audio-lifecycle',message:String(error),at:new Date().toISOString()});
 }
 return cell.audioLifecycle;
}
export function requireP005LifecycleAudioResult(cell) {
 if(cell.audioLifecycle?.result?.passed===true&&cell.audioLifecycle.result.status==='DECLARED_AUDIO_WINDOWS_PASS')return;
 const reason=cell.audioLifecycle?'required P005 lifecycle output has no complete passing result':'required P005 lifecycle output capture/result was not obtained';
 cell.diagnostics.push({stage:'audio-lifecycle',status:cell.audioLifecycle?'fail':'not-run',reason});
 cell.errors.push({phase:'audio-lifecycle-required',message:reason,at:new Date().toISOString()});
}
async function waitSample(page,predicate,timeoutMs,diagnostics,label,retainedAfterSequence=null) {
 const start=Date.now();let last=null;
 while(Date.now()-start<timeoutMs) {last=await snapshot(page);if(last&&predicate(last))return last;
  if(retainedAfterSequence!==null){const records=await page.evaluate(sequence=>window.__g678TechnicalObserver?.records.samples.filter(s=>s.sequence>sequence)??[],retainedAfterSequence);const observed=records.find(predicate);if(observed)return observed;}
  await delay(40);}
 diagnostics.push({stage:label,status:'not-run',reason:'required actual sample not reached',last});return null;
}
export async function visibleControl(page,selector,timeoutMs=5000) {
 const candidates=page.locator(selector),deadline=Date.now()+timeoutMs;
 do {
  for(let i=0;i<await candidates.count();i++){const item=candidates.nth(i);if(await item.isVisible()&&await item.isEnabled())return item;}
  const remaining=deadline-Date.now();if(remaining<=0)break;await delay(Math.min(40,remaining));
 } while(Date.now()<=deadline);
 throw Error('PUBLIC_CONTROL_NOT_VISIBLE_OR_ENABLED: '+selector);
}
async function dispatch(page,selector,action,cell,trace,{key,timeoutMs}={}) {
 const locator=await visibleControl(page,selector,timeoutMs),before=await browserNow(page),prior=await page.evaluate(()=>window.__g678TechnicalObserver?.records.events.at(-1)?.sequence??0);
 const target=await locator.evaluate(node=>({tag:node.tagName,id:node.id,role:node.getAttribute('role'),name:node.getAttribute('aria-label'),text:node.textContent?.trim(),focusKey:node.getAttribute('data-responsive-focus-key'),playbackAction:node.getAttribute('data-playback-action'),lessonNav:node.getAttribute('data-lesson-nav'),animationId:node.getAttribute('data-animation-id')}));
 const command={id:'input-'+(trace.length+1),action,selector,method:key?'press':cell.touch?'tap':'click',key:key??null,force:false,target,beforeMs:before.atMs,beforeUnixMs:before.unixMs,executed:false,observedEventSequences:[]};
 trace.push(command);
 try {if(key)await locator.press(key);else if(cell.touch)await locator.tap();else await locator.click();command.executed=true;}
 finally {const after=await browserNow(page);command.afterMs=after.atMs;command.afterUnixMs=after.unixMs;command.observedEventSequences=await page.evaluate(prior=>window.__g678TechnicalObserver?.records.events.filter(e=>e.sequence>prior).map(e=>e.sequence)??[],prior);}
 return command;
}
export async function enterCourse(page,parameters,animationId,config,cell,trace,diagnostics) {
 const requestedUrl=routeFor(parameters,config.origin,cell.locale);
 const response=await page.goto(requestedUrl,{waitUntil:'domcontentloaded',timeout:config.timeouts?.navigationMs??90000});
 // SSR controls can be visible before their handlers are attached.
 await page.waitForFunction(()=>Boolean(document.querySelector('[data-lesson-player][data-hydrated="true"]')),null,{timeout:config.timeouts?.readyMs??60000});
 const entry={requestedUrl,committedUrl:page.url(),responseStatus:response?.status()??null,
  navigation:await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return n?{name:n.name,type:n.type,startTime:n.startTime,responseEnd:n.responseEnd,domContentLoadedEventEnd:n.domContentLoadedEventEnd}:null;}),
  sourceActionsCalled:false,sourceStateWritten:false};
 const current=async()=>page.locator('[data-lesson-player]').getAttribute('data-current-animation-id');
 const controlOptions={timeoutMs:config.timeouts?.controlMs??5000};
 // This waits only for the public host selection to commit. The caller still
 // requires the exact source/owner and actual renderer commit via waitSample.
 const selected=async id=>page.waitForFunction(id=>document.querySelector('[data-lesson-player]')?.getAttribute('data-current-animation-id')===id,id,{timeout:config.timeouts?.selectionMs??config.timeouts?.readyMs??60000});
 if(await current()===animationId)return entry;
 const target=parameters.normalEntry?.fromAnimationId;
 if(target&&await current()!==target) {
  const selector=`button[data-animation-id="${target}"]`;let requested=false;
  try {await dispatch(page,selector,'select-prior',cell,trace,controlOptions);requested=true;}
  catch {
   try {await dispatch(page,'[data-responsive-focus-key="map"]','open-map',cell,trace,controlOptions);await dispatch(page,selector,'select-prior',cell,trace,controlOptions);requested=true;}
   catch(error){diagnostics.push({stage:'normal-entry',status:'not-run',reason:String(error),actualAnimationId:await current()});}
  }
  if(requested)await selected(target);
 }
 if(target&&await current()===target){await dispatch(page,parameters.normalEntry.actionSelector??parameters.actions.next,'next',cell,trace,controlOptions);await selected(animationId);}
 if(await current()!==animationId){const selector=`button[data-animation-id="${animationId}"]`;
  try{await dispatch(page,selector,'select-page',cell,trace,controlOptions);}
  catch(error){if(!String(error).includes('PUBLIC_CONTROL_NOT_VISIBLE_OR_ENABLED'))throw error;await dispatch(page,'[data-responsive-focus-key="map"]','open-map',cell,trace,controlOptions);await dispatch(page,selector,'select-page',cell,trace,controlOptions);}
  await selected(animationId);}
 assert.equal(await current(),animationId,'real course selected exact target');
 return entry;
}
export async function observeLayout(page,parameters,stateId,sample,assertions,{contentWithinLayoutTargets=false}={}) {
 return page.evaluate(({parameters,stateId,sample,assertions,contentWithinLayoutTargets})=>{
  const rect=node=>{const r=node.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  const measured=node=>{const r=rect(node),css=getComputedStyle(node),points=[[.1,.1],[.9,.1],[.5,.5],[.1,.9],[.9,.9]];
   let clipped=Math.max(0,-r.left)+Math.max(0,-r.top)+Math.max(0,r.right-innerWidth)+Math.max(0,r.bottom-innerHeight),obscured=0;
   for(let parent=node.parentElement;parent;parent=parent.parentElement){const s=getComputedStyle(parent),p=rect(parent);if(['hidden','clip','scroll','auto'].includes(s.overflowX))clipped+=Math.max(0,p.left-r.left)+Math.max(0,r.right-p.right);if(['hidden','clip','scroll','auto'].includes(s.overflowY))clipped+=Math.max(0,p.top-r.top)+Math.max(0,r.bottom-p.bottom);}
   for(const [x,y] of points){const px=r.left+r.width*x,py=r.top+r.height*y,hit=document.elementFromPoint(px,py);if(!hit||hit!==node&&!node.contains(hit))obscured++;}
   return{rect:r,computed:{display:css.display,visibility:css.visibility,opacity:Number(css.opacity)},clippedPixels:clipped,obscuredPixels:obscured};};
  const targets=[],targetNodes=[],contentChecks=[],unsupported=[],outsideGroupAssertions=[];
  for(const [id,selector] of Object.entries(parameters.layoutTargets??{})){
   const nodes=document.querySelectorAll(selector);
   if(contentWithinLayoutTargets&&nodes.length!==1){unsupported.push({targetId:id,reason:'layout target selector absent or ambiguous'});continue;}
   const node=nodes[0];if(node){targetNodes.push({id,node});const m=measured(node);targets.push({id,...m,hitTargetId:m.obscuredPixels===0?id:null});}
  }
  for(const assertion of assertions) {
   if(assertion.stateId!==stateId)continue;
   if(assertion.method==='rendered-object'){unsupported.push({assertionId:assertion.id,reason:'actual committed object/display-list hook unavailable'});continue;}
   const nodes=document.querySelectorAll(assertion.selector);if(nodes.length!==1){unsupported.push({assertionId:assertion.id,reason:'content selector absent or ambiguous'});continue;}
   const node=nodes[0],containingTargetIds=targetNodes.filter(target=>target.node===node||target.node.contains(node)).map(target=>target.id);
   if(contentWithinLayoutTargets&&!containingTargetIds.length){outsideGroupAssertions.push({assertionId:assertion.id,selector:assertion.selector});continue;}
   contentChecks.push({...(contentWithinLayoutTargets?{containingTargetIds}:{}),assertionId:assertion.id,stateId,selector:assertion.selector,sampleSequence:sample.sequence,method:assertion.method??'innerText',text:node.innerText??node.textContent??'',namespaceURI:node.namespaceURI,...measured(node)});
  }
  const root=document.documentElement,rootStyle=getComputedStyle(root);
  const documentGeometry={viewportWidth:innerWidth,viewportHeight:innerHeight,rootRect:rect(root),
   rootClientHeight:root.clientHeight,rootScrollHeight:root.scrollHeight,overflowY:rootStyle.overflowY,scrollbarGutter:rootStyle.scrollbarGutter};
  return{layout:{stateId,sampleSequence:sample.sequence,rootScrollWidth:root.scrollWidth,rootClientWidth:root.clientWidth,documentGeometry,targets},contentChecks,unsupported,...(contentWithinLayoutTargets?{outsideGroupAssertions}: {})};
 },{parameters,stateId,sample,assertions,contentWithinLayoutTargets});
}
async function captureState(page,parameters,stateId,contract,cell,directory,diagnostics) {
 if(parameters.animationId===P005_ID) {
  let last=null;const observedAssertions=new Set();
  for(const group of p005CaptureGroups(parameters,contract,stateId)) {
   const target=page.locator(group.selector);await target.scrollIntoViewIfNeeded();await delay(80);
   const before=await snapshot(page),predicate=stateId==='initial'?contract.terminal.initialState:stateId==='terminal'?contract.terminal.expectedState:contract.layout.statePredicates?.[stateId];
   if(!sourceStateMatches(before,predicate)){diagnostics.push({stage:'capture-'+stateId,status:'not-run',reason:'actual source state differs from requested held state',sampleSequence:before?.sequence});return null;}
   const selected={...parameters,layoutTargets:Object.fromEntries(group.targetIds.map(id=>[id,parameters.layoutTargets[id]]))};
   const observation=await observeLayout(page,selected,stateId,before,contract.contentAssertions??[],{contentWithinLayoutTargets:true});
   const imageCoverage=p005GroupImageCoverage(group,observation);
   const bytes=await target.screenshot({animations:'allow',timeout:15000}),after=await snapshot(page);
   const name=`screenshots/${stateId}-${group.targetId}-${before.sequence}`,image=put(directory,name+'.png',bytes);
   put(directory,name+'.json',{before,after,observation,image,group,imageCoverage});
   for(const row of observation.unsupported){diagnostics.push({stage:'content',status:'unsupported',...row});cell.errors.push({phase:'capture-'+stateId,message:row.reason+': '+(row.assertionId??row.targetId),at:new Date().toISOString()});}
   if(!imageCoverage.complete){const reason='actual screenshot target does not cover every measured group member';diagnostics.push({stage:'capture-'+stateId,status:'fail',reason,imageCoverage});cell.errors.push({phase:'capture-'+stateId,message:reason,at:new Date().toISOString()});continue;}
   if(!sameCommit(before,after)){diagnostics.push({stage:'capture-'+stateId,status:'not-run',reason:'source commit changed during real target capture',image});continue;}
   cell.layoutChecks.push(observation.layout);cell.contentChecks.push(...observation.contentChecks);for(const check of observation.contentChecks)observedAssertions.add(check.assertionId);
   cell.screenshots.push({stateId,sampleSequence:before.sequence,surfaceId:before.render.surfaceId,scope:group.scope,...(group.scope==='target'?{targetId:group.targetId}:{}),pin:image});
   last=before;
  }
  for(const assertion of (contract.contentAssertions??[]).filter(row=>row.stateId===stateId))if(!observedAssertions.has(assertion.id)){
   const reason='declared content has no same-commit observation inside an actually captured target group: '+assertion.id;
   diagnostics.push({stage:'content',status:'not-run',reason});cell.errors.push({phase:'capture-'+stateId,message:reason,at:new Date().toISOString()});
  }
  return last;
 }
 const before=await snapshot(page);if(!before)return null;
 const predicate=stateId==='initial'?contract.terminal.initialState:stateId==='terminal'?contract.terminal.expectedState:contract.layout.statePredicates?.[stateId];
 if(!sourceStateMatches(before,predicate)){diagnostics.push({stage:'capture-'+stateId,status:'not-run',reason:'actual source state does not match capture state',sampleSequence:before.sequence});return null;}
 const observation=await observeLayout(page,parameters,stateId,before,contract.contentAssertions??[]);
 const target=page.locator(parameters.surfaceSelector);const bytes=await target.screenshot({animations:'allow',timeout:15000});
 const after=await snapshot(page),image=put(directory,`screenshots/${stateId}-${before.sequence}.png`,bytes);
 put(directory,`screenshots/${stateId}-${before.sequence}.json`,{before,after,observation,image});
 if(!sameCommit(before,after)){diagnostics.push({stage:'capture-'+stateId,status:'not-run',reason:'source owner/frame/commit changed during screenshot',image,beforeSequence:before.sequence,afterSequence:after?.sequence});return null;}
 cell.layoutChecks.push(observation.layout);cell.contentChecks.push(...observation.contentChecks);cell.screenshots.push({stateId,sampleSequence:before.sequence,surfaceId:before.render.surfaceId,scope:'stage',pin:image});
 diagnostics.push(...observation.unsupported.map(row=>({stage:'content',status:'unsupported',...row})));return before;
}
async function natural(page,contract,start,eventSequences,cell,timeoutMs,diagnostics,extra={}) {
 const terminal=await waitSample(page,s=>sourceStateMatches(s,contract.terminal.expectedState)&&s.identity.playerId===start.identity.playerId,timeoutMs,diagnostics,'natural-terminal');
 if(terminal)cell.flows.push({kind:'natural-playback',before:start.sequence,after:terminal.sequence,eventSequences,...extra});return terminal;
}
async function pauseResume(page,parameters,cell,trace,diagnostics,{warmMs=500,holdMs=350,afterResumeMs=0,audioCue=null}={}) {
 const before=await snapshot(page);if(!before)return;
 await delay(warmMs);const pause=await dispatch(page,parameters.actions.pause,'pause',cell.config,trace);
 const paused=await waitSample(page,s=>s.host.paused===true&&(!audioCue||p005AudioBoundaryReady(s,audioCue,true)),5000,diagnostics,'paused');await delay(holdMs);const held=await snapshot(page);
 const play=await dispatch(page,parameters.actions.play,'play',cell.config,trace);
 let resumed=held&&await waitSample(page,s=>s.host.paused===false&&s.source.tick>held.source.tick&&(!audioCue||p005AudioAdvanced(held,s,audioCue)),5000,diagnostics,'resumed');
 if(resumed&&afterResumeMs){await delay(afterResumeMs);resumed=await snapshot(page);if(audioCue)assert(p005AudioAdvanced(held,resumed,audioCue),'actual audio clock continued after explicit Play');}
 if(paused&&held&&resumed)cell.flows.push({kind:'pause-resume',before:before.sequence,paused:paused.sequence,held:held.sequence,resumed:resumed.sequence,eventSequences:[...pause.observedEventSequences,...play.observedEventSequences]});
}
async function retireSnapshot(page,identity) {
 const media=await page.evaluate(id=>window.__g678TechnicalObserver.ownedMedia(id),identity.playerId);
 return identity.ownerKind==='surface-run'?{kind:'surface-run',playerId:identity.playerId,runEpoch:identity.runEpoch,sourceNodeIds:media.sourceNodeIds,activeSourceNodes:media.activeSourceNodes,pendingMediaStarts:media.pendingMediaStarts,media}:null;
}
async function retireSourceSurface(surface,before,diagnostics,label,timeoutMs=15000) {
 const deadline=Date.now()+timeoutMs;let actual=null;
 try {
  do {actual=await surface.evaluate(readRetainedSourceSurface);if(sourceVmRetired(actual,before))return actual;await delay(40);}while(Date.now()<deadline);
  diagnostics.push({stage:label,status:'fail',reason:'old source lease/media did not retire',actual});return actual;
 } finally {await surface.dispose();}
}
async function resetP005(page,parameters,contract,cell,trace,diagnostics,{kind='control-reset'}={}) {
 const before=await snapshot(page);assert(before,'actual source owner before public Replay');
 const surface=await page.locator(parameters.surfaceSelector).elementHandle();assert(surface,'retained exact old source surface');
 let retained=false;
 try {
  const command=await dispatch(page,parameters.actions.replay,'replay',cell.config,trace);
  // This is a real public Pause while the fresh renderer loads, never a frame
  // setter. If it misses root/frame1, retain the failed attempt instead of seeking.
  const transport=await visibleControl(page,parameters.actions.pause+', '+parameters.actions.play);
  if(await transport.getAttribute('data-playback-action')==='pause')await dispatch(page,parameters.actions.pause,'pause',cell.config,trace);
  const reset=await waitSample(page,s=>sourceVmOwnerChanged(before.identity,s.identity)&&sourceStateMatches(s,contract.terminal.initialState)&&s.host.paused===true,
    15000,diagnostics,'public-replay-paused-initial');assert(reset,'public Replay/Pause did not hold the real initial source state');
  retained=true;const retired=await retireSourceSurface(surface,before,diagnostics,'public-replay-old-owner-retirement');
  const records=await observedRecords(page),events=normalizeDispatchedEvents(records.events,trace);
  assert(command.observedEventSequences.some(sequence=>sourceVmReplayCause({before,after:reset,event:events.find(e=>e.sequence===sequence),retired,initialState:contract.terminal.initialState})),'actual source-vm Replay cause and retirement');
  const flow={kind,before:before.sequence,after:reset.sequence,eventSequences:command.observedEventSequences,retired};
  if(kind==='control-reset')flow.purpose='separate public-input scenario; not an additional complete natural playback claim';
  cell.flows.push(flow);return {reset,flow};
 } finally {if(!retained)await surface.dispose();}
}
async function naturalP005(page,parameters,contract,start,cell,trace,diagnostics,timeoutMs) {
 const play=await dispatch(page,parameters.actions.play,'play',cell.config,trace);
 const terminal=await waitSample(page,s=>s.identity.playerId===start.identity.playerId&&sourceStateMatches(s,contract.terminal.expectedState),timeoutMs,diagnostics,'P005-source-terminal');
 if(!terminal)return null;
 await delay(400);let complete=await snapshot(page);assert(p005TerminalHeld(terminal,complete),'actual source stays at authored157 while the runtime clock continues');
 cell.terminalHolds??=[];cell.terminalHolds.push({first:terminal.sequence,last:complete.sequence,minimumHoldMs:350,sourceStopFrame:157});
 const cue=contract.audio.cues.find(c=>c.locale===cell.config.locale);
 if(cue?.transport==='html-media') {
  const deadline=Date.now()+timeoutMs;let ended=null;
  do {
   ended=await page.evaluate(({owner,url})=>{const o=window.__g678SourceVmHtmlMediaObserver;o?.sample();return o?.records.events.findLast(e=>e.type==='ended'&&e.owner?.playerId===owner&&e.state.currentSrc===url&&e.state.ended===true)??null;},
     {owner:start.identity.playerId,url:new URL(cue.sourceUrl,page.url()).href});
   if(ended)break;await delay(50);
  }while(Date.now()<deadline);
  assert(ended,'actual same-owner HTML narration ended event required');await delay(500);complete=await snapshot(page);
  assert(p005TerminalHeld(terminal,complete),'source terminal held through real narration tail');
 }
 const records=await observedRecords(page);assert(!records.samples.some(s=>s.identity.playerId===start.identity.playerId&&s.atMs>=start.atMs&&s.atMs<=complete.atMs&&s.dom?.documentHidden!==false),'P005 natural run stayed actually visible');
 const flow={kind:'natural-playback',startKind:'play',before:start.sequence,after:complete.sequence,eventSequences:play.observedEventSequences};cell.flows.push(flow);return {terminal:complete,flow};
}
async function p005Glossaries(page,parameters,contract,cell,trace,diagnostics,directory) {
 cell.glossaryChecks??=[];
 for(const control of parameters.pageInteractions) {
  await resetP005(page,parameters,contract,cell,trace,diagnostics);
  await dispatch(page,parameters.actions.play,'play',cell.config,trace);
  const before=await waitSample(page,s=>s.source.frameDomain==='sprite-40'&&s.source.frame>=142&&s.source.frame<=154,25000,diagnostics,'P005-'+control.entryId+'-source-window');assert(before,'actual source glossary window');
  const trigger=await page.locator(control.selector).elementHandle();assert(trigger,'real source glossary trigger');
  try {
   const openedInput=await dispatch(page,control.selector,'glossary-'+control.entryId,cell.config,trace,cell.config.touch?{}:{key:'Enter'});
   const opened=await waitSample(page,s=>s.dom?.glossary?.entryId===control.entryId&&s.host.paused===true,5000,diagnostics,'P005-'+control.entryId+'-opened');assert(opened,'real source glossary opened');
   await delay(350);const held=await snapshot(page);
   cell.flows.push({kind:'interaction',caseId:control.entryId+'-open',before:before.sequence,after:opened.sequence,eventSequences:openedInput.observedEventSequences});
   await captureState(page,parameters,control.entryId+'-open',contract,cell,directory,diagnostics);
   const close=await dispatch(page,`[role="dialog"][data-glossary-entry-id="${control.entryId}"] button`,'close-'+control.entryId,cell.config,trace);
   const closed=await waitSample(page,s=>s.dom?.glossary?.entryId===null&&s.dom?.focusButtonId===control.buttonId,5000,diagnostics,'P005-'+control.entryId+'-closed');assert(closed,'actual glossary closed and focus returned');
   assert(await trigger.evaluate(node=>node.isConnected&&document.activeElement===node),'focus returned to the actual retained source trigger');
   cell.flows.push({kind:'interaction',caseId:control.entryId+'-close',before:held.sequence,after:closed.sequence,eventSequences:close.observedEventSequences});
   await captureState(page,parameters,control.entryId+'-closed',contract,cell,directory,diagnostics);
   const play=await dispatch(page,parameters.actions.play,'play',cell.config,trace);
   const resumed=await waitSample(page,s=>s.identity.playerId===closed.identity.playerId&&s.host.paused===false&&s.source.frame>closed.source.frame&&s.source.tick>closed.source.tick,5000,diagnostics,'P005-'+control.entryId+'-explicit-resume');
   const evidence={control,locale:cell.config.locale,before,opened,held,closed,resumed,events:{open:openedInput.observedEventSequences,close:close.observedEventSequences,play:play.observedEventSequences}};
   cell.glossaryChecks.push(evidence);put(directory,'glossary-'+control.entryId+'.json',evidence);
   assert.deepEqual(p005GlossaryIssues(evidence),[],'source-bound glossary hold/Close/focus/explicit Play');
  } finally {await trigger.dispose();}
 }
}
async function p005Next(page,parameters,contract,cell,trace,diagnostics,directory) {
 const paused=await snapshot(page);if(paused?.host.paused)await dispatch(page,parameters.actions.play,'play',cell.config,trace);
 const before=await snapshot(page),surface=await page.locator(parameters.surfaceSelector).elementHandle();assert(before&&surface,'actual P005 before navigation');let retained=false;
 try {
  const command=await dispatch(page,parameters.actions.next,'next',cell.config,trace);
  const destination=parameters.navigation.next,handle=await page.waitForFunction(readP005Destination,destination,{timeout:30000});
  let actual;try{actual=await handle.jsonValue();}finally{await handle.dispose();}
  retained=true;const retired=await retireSourceSurface(surface,before,diagnostics,'P005-navigation-old-owner-retirement');assert(sourceVmRetired(retired,before),'actual old-page navigation cleanup');
  await dispatch(page,parameters.actions.pause,'pause-destination',cell.config,trace);
  const selector=`[data-hfr-page="${destination.animationId}"] canvas`,image=put(directory,'navigation-next.png',await page.locator(selector).screenshot({animations:'allow'}));
  const after=await page.evaluate(readP005Destination,destination);assert(after&&after.observation.identity.playerId===actual.observation.identity.playerId,'same actual destination owner through screenshot');
  const records=await observedRecords(page),events=normalizeDispatchedEvents(records.events,trace);
  const event=events.find(event=>command.observedEventSequences.includes(event.sequence)&&event.playerId===before.identity.playerId&&event.action==='next'&&['click','keydown'].includes(event.type));assert(event,'actual old-owner public Next event');
  cell.navigationChecks.push({action:'next',before:before.sequence,eventSequence:event.sequence,
   observedAtMs:after.atMs,actualDestinationAnimationId:after.animationId,renderer:after.observation.render,
   screenshot:{scope:'stage',surfaceId:after.observation.render.surfaceId,pin:image},retired,destinationObservation:after});
 } finally {if(!retained)await surface.dispose();}
}
async function ownedBrowserIdentity(profile) {
 const {stdout}=await run('/bin/ps',['-axo','pid=,ppid=,command='],{maxBuffer:8*1024*1024});
 const rows=stdout.split('\n').flatMap(line=>{const m=/^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(line);return m?[{pid:Number(m[1]),parentPid:Number(m[2]),command:m[3]}]:[];});
 const main=rows.filter(r=>r.command.includes('--user-data-dir='+profile)&&!r.command.includes('--type='));assert.equal(main.length,1,'one owned browser main process');
 assert(!main[0].command.includes('--headless')&&!main[0].command.includes('--mute-audio'),'headed unmuted browser');
 const audio=rows.filter(r=>r.parentPid===main[0].pid&&r.command.includes('audio.mojom.AudioService'));
 return{mainPid:main[0].pid,audioPids:audio.map(r=>r.pid),profile,headed:true,muteAudio:false,observedAt:new Date().toISOString()};
}
export async function collectPage({root,animationId,contract,contractPin,inputPins,outputDirectory,runId,collectionConfig}) {
 const config=collectionConfig,isP005=animationId===P005_ID;assert.equal(contract.animationId,animationId);assert(['launch','attach-owned'].includes(config.browser?.mode),'explicit owned launch/attachment mode required');
 assert(['shared-alg001-l06-p002','shared-alg001-l06-p040',P005_ID].includes(animationId),'collector requires an exact calibrated page adapter');
 const parameterPin=config.pages?.[animationId]?.parameters;const parameters=JSON.parse(requireFrozenPin(root,inputPins,parameterPin));assert.equal(parameters.animationId,animationId);
 if(isP005)assertP005Parameters(parameters,contract);
 for(const pin of inputPins)actualPin(root,pin);
 const selectedCells=config.cellIds??DEFAULT_CELLS.map(c=>c.cellId);assert(selectedCells.length&&new Set(selectedCells).size===selectedCells.length&&selectedCells.every(id=>DEFAULT_CELLS.some(c=>c.cellId===id)),'exact main-cell subset');
 const raw={kind:'g678-full-technical-raw-v1',animationId,source:contract.source,contractPin,startedAt:new Date().toISOString(),finishedAt:null,preflightPins:inputPins,postflightPins:[],cells:[],supplements:[],collection:{runId,gaps:[],acceptanceEffects:{technicalPassed:false}}};
 let audioTools=null;
 if(config.audio?.enabled)try{audioTools=await qualifyAudioTools({root,inputPins,audioConfig:config.audio,outputDirectory:path.join(outputDirectory,'audio-tool-qualification')});}catch(error){raw.collection.gaps.push({gate:'audio',status:'fail',reason:String(error)});}
 const playwright=createRequire(path.join(root,'package.json'))('playwright');
 let attachedBrowser=null,attachmentFailure=null;
 try {
 if(config.browser.mode==='attach-owned') {
  assert(audioTools,'owned attachment requires the existing native browser identity inspector');
  const prepared=JSON.parse(requireFrozenPin(root,inputPins,config.browser.inspection)),profile=config.browser.profile;
  assert.equal(fs.realpathSync(profile),profile,'physical owned browser profile');
  const portFile=path.join(profile,'DevToolsActivePort');assert.equal(fs.realpathSync(portFile),portFile,'physical actual CDP endpoint file');
  const endpoint=ownedCdpEndpoint(config.browser,prepared,fs.readFileSync(portFile,'utf8'));
  const identity=await ownedBrowserIdentity(profile);assert.equal(identity.mainPid,config.browser.mainPid,'same prepared browser profile PID');
  const {stdout}=await run('/usr/sbin/lsof',['-nP','-a','-p',String(identity.mainPid),'-iTCP:'+new URL(endpoint).port,'-sTCP:LISTEN','-Fp']);
  assert.deepEqual(stdout.trim().split('\n').filter(row=>/^p\d+$/.test(row)),['p'+identity.mainPid],'CDP socket belongs to the exact prepared browser');
  attachedBrowser=await playwright.chromium.connectOverCDP(endpoint,{artifactsDir:path.join(outputDirectory,'cdp-artifacts')});
  assert(attachedBrowser.contexts().every(context=>context.pages().length===0),'root warmup pages must be retired before collection; do not close someone else’s page');
  raw.browserAttachment=put(outputDirectory,'owned-browser-attachment.json',{mode:'attach-owned',endpoint,prepared:config.browser.inspection,profile,mainPid:identity.mainPid,existingContexts:attachedBrowser.contexts().length,rootBrowserCloseOwnedBy:'launching process'});
 }
 for(const expected of DEFAULT_CELLS.filter(c=>selectedCells.includes(c.cellId))) {
  if(attachmentFailure){raw.collection.gaps.push({gate:'owned-browser-identity',cellId:expected.cellId,status:'not-run',reason:attachmentFailure});continue;}
  const {cellId,...requested}=expected,directory=path.join(outputDirectory,cellId);fs.mkdirSync(directory,{recursive:true});
  const profile=attachedBrowser?config.browser.profile:path.join(directory,'chrome-profile');if(!attachedBrowser)assert(!fs.existsSync(profile),'fresh owned browser profile');
  const audioCue=isP005?contract.audio.cues.find(c=>c.locale===requested.locale):null;
  const trace=[],diagnostics=[],logs={errors:[],consoleErrors:[],networkErrors:[],cleanupErrors:[]};
  const cell={cellId,config:requested,startedAt:new Date().toISOString(),finishedAt:null,languages:{visual:null,audio:null},...logs,documents:[],flows:[],layoutChecks:[],screenshots:[],contentChecks:[],mediaChecks:[],silenceChecks:[],navigationChecks:[],diagnostics};raw.cells.push(cell);
  let context,page,phase=attachedBrowser?'owned-context':'launch',audioInspection=null,firstAudio=null,warmupEvidence=null,networkObserver=null,warmEntry=null,formalAudioDocument=null;const requests=[],captures=[],mediaResources=[],resourceTasks=[];
  const captureFlow=async(label,{preEntry=false,durationSeconds}={})=>{if(!audioTools||!audioInspection)return null;const audioDirectory=path.join(directory,'audio');fs.mkdirSync(audioDirectory,{recursive:true});
   const allowance=preEntry?(config.audio.preEntryAllowanceSeconds??30):0;assert(allowance>=0&&allowance<=120,'bounded pre-entry capture allowance');
   try {const h=await beginActualAudioCapture({audio:audioTools,inspection:audioInspection,outputDirectory:path.join(audioDirectory,label+'-native'),runId:runId+'-'+cellId+'-'+label,durationSeconds:durationSeconds??(isP005?actualCaptureDuration(contract,requested.locale,allowance):Math.ceil((contract.terminal.nominalDurationMs??contract.terminal.minimumDurationMs)/1000+10+allowance))});captures.push(h);return h;}
   catch(error){if(error.captureHandle)captures.push(error.captureHandle);diagnostics.push({stage:'audio-'+label,status:'fail',reason:String(error)});return null;}
  };
  const completeFlowAudio=async(handle,flow,label)=>{if(!handle)return;try{const capture=await finishActualAudioCapture(handle);handle.finished=true;cell.audioCaptures??=[];cell.audioCaptures.push(capture);
   if(flow){await Promise.all(resourceTasks);const original=await observedRecords(page),records={...original,mediaResources,events:normalizeDispatchedEvents(original.events,trace)};
    const exported=await exportActualFlowAudio({audio:audioTools,capture,contract,contractPin,records,flow,replayFlow:flow.replayFlow,entry:cell.entry,entryPin:cell.entryPin,outputDirectory:path.join(directory,'audio',label+'-analysis'),buildId:contractPin.sha256});cell.mediaChecks.push(...exported.mediaChecks);cell.silenceChecks.push(...exported.silenceChecks);cell.languages.audio=exported.language;cell.audioCaptures.at(-1).export=exported.reportPin;diagnostics.push(...exported.missing.map(m=>({stage:'audio-'+label,status:'fail',...m})));}
   else diagnostics.push({stage:'audio-'+label,status:'not-run',reason:'captured output retained, but no complete natural source flow exists for matching'});
  }catch(error){diagnostics.push({stage:'audio-'+label,status:'fail',reason:String(error)});}};
  try {
   const contextOptions={viewport:{width:requested.width,height:requested.height},deviceScaleFactor:requested.dpr,hasTouch:requested.touch,isMobile:requested.touch,locale:requested.locale,reducedMotion:'no-preference'};
   context=attachedBrowser?await attachedBrowser.newContext(contextOptions):await playwright.chromium.launchPersistentContext(profile,{channel:config.browser.channel??'chrome',headless:false,...contextOptions,ignoreDefaultArgs:['--mute-audio'],args:['--autoplay-policy=user-gesture-required']});
   const htmlOptions={animationId,sourceSha256:contract.source.sha256,runtimeObserverKey:'__g678CommittedRuntimeAdapter',sourceUrls:(contract.audio?.cues??[]).filter(c=>c.transport==='html-media').map(c=>new URL(c.sourceUrl,config.origin).href)};
   await context.addInitScript({content:`window.__g678CommittedRuntimeAdapter=(${createG678CommittedRuntimeAdapter.toString()})(${JSON.stringify({surfaceSelector:parameters.surfaceSelector})});${isP005?`window.__g678CommittedRuntimeAdapter=(${createP005RuntimeAdapter.toString()})(window.__g678CommittedRuntimeAdapter);`:''}(${installG678TechnicalObserver.toString()})(${JSON.stringify({animationId,sourceSha256:contract.source.sha256,rendererFamily:contract.rendererFamily,runtimeObserverKey:'__g678CommittedRuntimeAdapter',audioRequired:contract.audio?.status!=='not-required',audioSourceHashes:(contract.audio?.cues??[]).map(c=>c.source.sha256)})});${isP005?`(${installSourceVmHtmlMediaObserver.toString()})(${JSON.stringify(htmlOptions)});`:''}`});
   if(isP005&&requested.rootFontPx!==16)await context.addInitScript(size=>{document.addEventListener('DOMContentLoaded',()=>document.documentElement.style.setProperty('font-size',size+'px','important'),{once:true});},requested.rootFontPx);
   page=context.pages()[0]??await context.newPage();
   if(isP005)networkObserver=observeHomeMetadataFailures({page,origin:config.origin,expectedCourseUrl:routeFor(parameters,config.origin,requested.locale),networkErrors:logs.networkErrors,phase:()=>phase});
   page.on('pageerror',error=>logs.errors.push({phase,message:String(error),at:new Date().toISOString()}));
   page.on('console',message=>{if(message.type()==='error')logs.consoleErrors.push({phase,message:message.text(),location:message.location(),at:new Date().toISOString()});});
   page.on('request',request=>{const url=request.url(),owner=/\/g678-local\/(shared-[^/?]+)/.exec(url)?.[1]??null;requests.push({url,method:request.method(),resourceType:request.resourceType(),sourceOwner:owner,phase,at:new Date().toISOString()});});
   page.on('response',response=>{if(response.status()>=400)logs.networkErrors.push({url:response.url(),status:response.status(),sourceOwner:/\/g678-local\/(shared-[^/?]+)/.exec(response.url())?.[1]??null,phase,at:new Date().toISOString()});});
   if(isP005)page.on('response',response=>{
    const cue=contract.audio?.cues?.find(c=>c.locale===requested.locale&&c.transport==='html-media'&&new URL(c.sourceUrl,config.origin).href===response.url());if(!cue)return;
    const observedPhase=phase,number=resourceTasks.length+1;
    resourceTasks.push((async()=>{const document=await page.evaluate(()=>({documentId:window.__g678TechnicalObserver?.records.documentId,documentTimeOrigin:performance.timeOrigin,documentHref:location.href}));
      const row=await retainSourceMediaResponse({page,response,source:cue.source,sourceUrl:response.url(),...document,outputDirectory:path.join(directory,'media-responses'),artifactName:`response-${number}.mp3`});mediaResources.push(row);
    })().catch(error=>{diagnostics.push({stage:'actual-html-media-response',phase:observedPhase,status:'fail',reason:String(error),retainedBody:error.retainedBody??null});logs.errors.push({phase:observedPhase,message:String(error),at:new Date().toISOString()});}));
   });
   if(!isP005)page.on('requestfailed',request=>logs.networkErrors.push({url:request.url(),status:null,error:request.failure()?.errorText,sourceOwner:/\/g678-local\/(shared-[^/?]+)/.exec(request.url())?.[1]??null,phase,at:new Date().toISOString()}));
   if(audioTools) {
    phase='audio-browser-warmup';warmupEvidence={startedAt:new Date().toISOString(),trace:[],diagnostics:[],acceptance:false};const warmTrace=warmupEvidence.trace,warmDiagnostics=warmupEvidence.diagnostics;warmEntry=await enterCourse(page,parameters,animationId,config,requested,warmTrace,warmDiagnostics);
    const warmReady=await waitSample(page,()=>true,config.timeouts?.readyMs??60000,warmDiagnostics,'warmup-source-ready');assert(warmReady,'actual warm-up source ready');
    try {await visibleControl(page,parameters.actions.play);}catch{await dispatch(page,parameters.actions.pause,'pause',requested,warmTrace);}
    await dispatch(page,parameters.actions.play,'play',requested,warmTrace);
    let identity=null;const deadline=Date.now()+15000;while(Date.now()<deadline){identity=await ownedBrowserIdentity(profile);if(identity.audioPids.length===1)break;await delay(100);}
    assert(identity?.audioPids.length===1,'normal source gesture established one AudioService');
    await dispatch(page,parameters.actions.pause,'pause',requested,warmTrace);
    const warmPaused=await waitSample(page,s=>s.host.paused===true,5000,warmDiagnostics,'warmup-paused');assert(warmPaused,'warm-up source paused before capture');
    await Promise.all(resourceTasks);const warmRecords=await observedRecords(page);cell.warmup=put(directory,'warmup.json',{...warmupEvidence,entry:warmEntry,identity,observer:warmRecords,logs:structuredClone(logs),networkObservation:networkObserver?.snapshot()??null,finishedAt:new Date().toISOString()});
    if(isP005&&audioCue?.transport==='html-media') {
     phase='same-document-media-preflight';formalAudioDocument=await currentAudioDocument(page);
     cell.preCaptureMediaProvenance=put(directory,'pre-capture-media-provenance.json',assertCurrentHtmlMediaProvenance({cue:audioCue,records:warmRecords,mediaResources,document:formalAudioDocument,expectedUrl:routeFor(parameters,config.origin,requested.locale)}));
    }
    let inspected;
    try {
     inspected=await inspectOwnedAudioBrowser({audio:audioTools,profile,mainPid:identity.mainPid,outputDirectory:path.join(directory,'audio-identity')});
     if(attachedBrowser)assertPreparedBrowser(config.browser,inspected.inspection);
    } catch(error) {
     if(attachedBrowser)attachmentFailure=String(error);
     if(error.inspectionPin)cell.rejectedAudioInspection=error.inspectionPin;
     if(error.inspectionRetentionError)diagnostics.push({stage:'retain-rejected-audio-inspection',status:'fail',reason:error.inspectionRetentionError});
     try{cell.audioWindowObservation=put(directory,'audio-window-observation.json',{...await readOwnedContextWindows(context,page),inspection:cell.rejectedAudioInspection??null,reason:String(error)});}
     catch(observationError){diagnostics.push({stage:'owned-window-observation',status:'fail',reason:String(observationError)});}
     throw error;
    }
    cell.audioIdentity=inspected.receipt;cell.audioNegativeControls=await runFreshAudioNegatives({audio:audioTools,inspection:inspected.inspection,inspectionPin:inspected.receipt,outputDirectory:path.join(directory,'audio-identity')});audioInspection=inspected.inspection;
    firstAudio=await captureFlow('natural-first',{preEntry:formalAudioDocument===null});
    // ES P005 stays in the proved document and starts a new owner through public
    // Replay below. Other paths retain the existing fresh-document entry capture.
    await Promise.all(resourceTasks);if(!formalAudioDocument)for(const [key,values]of Object.entries(logs))if(!isP005||key!=='networkErrors')values.length=0;
   }
   phase=formalAudioDocument?'same-document-public-replay-entry':'normal-entry';
   if(formalAudioDocument) {
    const current=await currentAudioDocument(page);assert(current.documentId===formalAudioDocument.documentId&&current.documentTimeOrigin===formalAudioDocument.documentTimeOrigin&&current.href===formalAudioDocument.href,'formal source document unchanged before public Replay');
    cell.entry={...warmEntry,scenario:'public-replay-after-same-document-source-warmup',documentId:current.documentId,documentTimeOrigin:current.documentTimeOrigin,coldDocumentEntryCaptured:false};
   } else cell.entry=await enterCourse(page,parameters,animationId,config,requested,trace,diagnostics);
   cell.entryPin=put(directory,'normal-entry.json',cell.entry);
   if(requested.rootFontPx!==16)await page.addStyleTag({content:`html{font-size:${requested.rootFontPx}px!important}`});
   let initial=await waitSample(page,s=>isP005||sourceStateMatches(s,contract.terminal.initialState),config.timeouts?.readyMs??60000,diagnostics,'source-initial');
   assert(initial,'real initial source state missing');cell.config=initial.viewport;cell.observationStartMs=initial.atMs;
   if(isP005){const prepared=await resetP005(page,parameters,contract,cell,trace,diagnostics);cell.entryReset=prepared.flow;initial=prepared.reset;
    if(formalAudioDocument){const current=await currentAudioDocument(page);assert(current.documentId===formalAudioDocument.documentId&&current.documentTimeOrigin===formalAudioDocument.documentTimeOrigin&&current.href===formalAudioDocument.href,'public Replay retained the exact proved media document');}}
   cell.languages=await page.evaluate(({ownerSelector,surfaceSelector})=>{const node=document.querySelector(ownerSelector),surface=document.querySelector(surfaceSelector);const explicit=node?.querySelector('[lang]')?.getAttribute('lang')??surface?.getAttribute('lang');return{visual:explicit??null,audio:null};},parameters);
   // Source-bound language is separately observed in exact renderer metadata; absent metadata stays unknown.
   const sourceLanguage=await page.evaluate(id=>window.HELP_MATH_CANVAS_ASSETS?.[id]?.metadata?.sourceLanguage??null,animationId);
   if(sourceLanguage)cell.languages.visual=sourceLanguage;
   else if(['en','es'].includes(initial.source.language))cell.languages.visual=initial.source.language;
   cell.browser={version:context.browser()?.version()??await page.evaluate(()=>navigator.userAgent),identity:await ownedBrowserIdentity(profile)};
   await captureState(page,parameters,'initial',contract,cell,directory,diagnostics);
   phase='natural-first';let startEvents=[],startKind='normal-entry',terminal;
   const naturalTimeout=config.timeouts?.naturalMs??Math.ceil((contract.terminal.nominalDurationMs??contract.terminal.minimumDurationMs)*1.35+15000);
   if(isP005){initial=await snapshot(page);const completed=await naturalP005(page,parameters,contract,initial,cell,trace,diagnostics,naturalTimeout);terminal=completed?.terminal;
    if(terminal){cell.languages.visual=terminal.dom.contentLanguage;await dispatch(page,parameters.actions.pause,'pause',requested,trace);await waitSample(page,s=>s.host.paused===true,5000,diagnostics,'P005-terminal-public-pause');}}
   else {if(initial.host.paused===true){const play=await dispatch(page,parameters.actions.play,'play',requested,trace);startEvents=play.observedEventSequences;startKind='play';}
    terminal=await natural(page,contract,initial,startEvents,cell,naturalTimeout,diagnostics,{startKind});}
   if(terminal)await captureState(page,parameters,'terminal',contract,cell,directory,diagnostics);
   await completeFlowAudio(firstAudio,cell.flows.find(f=>f.kind==='natural-playback'&&f.before===initial.sequence),'natural-first');
   if(terminal) {
    const replayAudio=await captureFlow('natural-replay');
    phase='replay';let replay,reset,replayFlow;
    if(isP005){const prepared=await resetP005(page,parameters,contract,cell,trace,diagnostics,{kind:'replay'});reset=prepared.reset;replayFlow=prepared.flow;}
    else {replay=await dispatch(page,parameters.actions.replay,'replay',requested,trace);reset=await waitSample(page,s=>s.identity.playerId!==terminal.identity.playerId&&sourceStateMatches(s,contract.terminal.initialState),5000,diagnostics,'replay-initial',terminal.sequence);}
    if(reset) {
     if(!isP005){const retired=await retireSnapshot(page,terminal.identity);cell.flows.push({kind:'replay',before:terminal.sequence,after:reset.sequence,eventSequences:replay.observedEventSequences,retired});}
     // Replay may autoplay the fresh run. Its old-owner input is retained as the real causal start.
     phase='natural-replay';if(isP005){const completed=await naturalP005(page,parameters,contract,reset,cell,trace,diagnostics,naturalTimeout);if(completed)completed.flow.replayFlow=replayFlow;}
     else await natural(page,contract,reset,replay.observedEventSequences,cell,naturalTimeout,diagnostics,{startKind:'replay',replayFlowBefore:terminal.sequence,replayFlowAfter:reset.sequence});
     await completeFlowAudio(replayAudio,cell.flows.find(f=>f.kind==='natural-playback'&&f.before===reset.sequence),'natural-replay');
     const lifecycleAudio=await captureFlow('control-lifecycle',{durationSeconds:12});
     let controlInitial;
     if(isP005){const prepared=await resetP005(page,parameters,contract,cell,trace,diagnostics);controlInitial=prepared.reset;await dispatch(page,parameters.actions.play,'play',requested,trace);}
     else {const beforeControlReset=await snapshot(page),controlReplay=await dispatch(page,parameters.actions.replay,'replay',requested,trace);
      controlInitial=await waitSample(page,s=>s.identity.playerId!==beforeControlReset.identity.playerId&&sourceStateMatches(s,contract.terminal.initialState),5000,diagnostics,'control-run-initial',beforeControlReset.sequence);
      if(controlInitial)cell.flows.push({kind:'control-reset',before:beforeControlReset.sequence,after:controlInitial.sequence,eventSequences:controlReplay.observedEventSequences,purpose:'separate actual pause-resume scenario; no additional complete natural playback claim'});}
     if(controlInitial){phase='pause-resume';await pauseResume(page,parameters,cell,trace,diagnostics,{warmMs:2500,holdMs:1000,afterResumeMs:1000,audioCue});
      const pauseFlow=cell.flows.findLast(f=>f.kind==='pause-resume'),stop=await dispatch(page,parameters.actions.pause,'pause',requested,trace);
      const stopped=await waitSample(page,s=>s.host.paused===true&&(!audioCue||p005AudioBoundaryReady(s,audioCue,true)),5000,diagnostics,'control-stopped');await delay(800);const afterStop=await snapshot(page);
      const stopFlow=stopped&&afterStop?{kind:'control-stop',stopped:stopped.sequence,after:afterStop.sequence,eventSequences:stop.observedEventSequences}:null;if(stopFlow)cell.flows.push(stopFlow);
      if(lifecycleAudio)await recordLifecycleAudioResult(cell,async()=>{const capture=await finishActualAudioCapture(lifecycleAudio);lifecycleAudio.finished=true;cell.audioCaptures??=[];cell.audioCaptures.push(capture);await Promise.all(resourceTasks);const original=await observedRecords(page),records={...original,mediaResources,events:normalizeDispatchedEvents(original.events,trace)};return assessActualLifecycleAudio({audio:audioTools,capture,contract,records,pauseFlow,stopFlow,outputDirectory:path.join(directory,'audio/control-lifecycle-analysis'),buildId:contractPin.sha256});});
     }

    }
   }
   if(isP005){phase='source-glossary';await p005Glossaries(page,parameters,contract,cell,trace,diagnostics,directory);phase='public-navigation';await p005Next(page,parameters,contract,cell,trace,diagnostics,directory);}
   if(!cell.mediaChecks.length)diagnostics.push({stage:'audio',status:'not-run',reason:'no complete actual-output cue passed its source comparison; native traces alone give no output audio credit'});
   if(isP005)requireP005LifecycleAudioResult(cell);
   else if(!cell.audioLifecycle)diagnostics.push({stage:'audio-lifecycle',status:'not-run',reason:'no complete measured pause/resume/stop PCM result; native traces alone give no output credit'});
   diagnostics.push({stage:'audio-navigation-cleanup',status:'not-run',reason:'destination audio isolation and old-run navigation cleanup still require actual evidence'});
   if(!isP005)diagnostics.push({stage:'navigation',status:'not-run',reason:'destination drawing/retirement observation not yet connected; no navigation passed flag is supplied'});
   for(const stateId of contract.layout.requiredStateIds)if(!cell.screenshots.some(s=>s.stateId===stateId))diagnostics.push({stage:'layout',stateId,status:'not-run',reason:'no same-commit screenshot was obtained; natural trace samples are preserved separately'});
  } catch(error) {logs.errors.push({phase,message:String(error),at:new Date().toISOString()});diagnostics.push({stage:phase,status:'fail',reason:String(error)});}
  finally {
   networkObserver?.beginClose();
   for(const handle of captures.filter(h=>!h.finished))try{const retained=await finishActualAudioCapture(handle);handle.finished=true;cell.audioCaptures??=[];cell.audioCaptures.push({...retained,unassessed:true});}catch(error){logs.cleanupErrors.push({phase:'native-capture-finish',message:String(error)});}
   if(page&&!page.isClosed())try {
    await Promise.all(resourceTasks);const records=await observedRecords(page);if(warmupEvidence&&!cell.warmup)cell.warmup=put(directory,'warmup-failed.json',{...warmupEvidence,observer:records,logs:structuredClone(logs),finishedAt:new Date().toISOString(),status:'fail'});if(records){put(directory,'observer-original.json',{...records,mediaResources});cell.documents=[{documentId:records.documentId,samples:records.samples.filter(sample=>sample.atMs>=cell.observationStartMs),events:normalizeDispatchedEvents(records.events.filter(event=>event.atMs>=cell.observationStartMs),trace),errors:records.errors}];cell.observerCapabilities={unsupported:records.unsupported,statuses:records.statuses};if(records.htmlMedia)cell.htmlMedia=put(directory,'html-media-observations.json',records.htmlMedia);if(mediaResources.length)cell.mediaResources=put(directory,'media-response-bindings.json',mediaResources);}
    put(directory,'requests.json',requests);put(directory,'dispatcher.json',trace);cell.dispatcherTrace=put(directory,'dispatcher-pinned.json',{kind:'public-input-dispatcher-v1',commands:trace});
    if(logs.errors.length)put(directory,'failure.png',await page.screenshot({fullPage:false,animations:'allow'}));
   } catch(error){logs.cleanupErrors.push({phase:'retain',message:String(error)});}
   try {await context?.close();
    if(context&&attachedBrowser){assert(!attachedBrowser.contexts().includes(context),'only this cell context closed');const actual=await ownedBrowserIdentity(profile);assert.equal(actual.mainPid,config.browser.mainPid);cell.browserCleanup={profile,contextClosed:true,rootBrowserStillPresent:true,mainPid:actual.mainPid,observedAt:new Date().toISOString()};}
    else if(context){let present=true;const deadline=Date.now()+10000;while(present&&Date.now()<deadline){const {stdout}=await run('/bin/ps',['-axo','command='],{maxBuffer:8*1024*1024});present=stdout.split('\n').some(command=>command.includes('--user-data-dir='+profile)&&!command.includes('--type='));if(present)await delay(100);}
      cell.browserCleanup={profile,ownedMainAbsent:!present,observedAt:new Date().toISOString()};if(present)throw Error('owned browser main remained after context.close');}
   }catch(error){if(attachedBrowser)attachmentFailure=String(error);logs.cleanupErrors.push({phase:'close-owned-browser',message:String(error)});}
   if(networkObserver)try{const observed=networkObserver.finish();cell.networkObservation=put(directory,'network-observations.json',observed);cell.networkDiagnostics=observed.diagnostics.map(row=>({networkFailureId:row.id,url:row.request?.url,classification:row.classification,reason:row.reason,phase:row.failedPhase}));}catch(error){logs.cleanupErrors.push({phase:'retain-network-observations',message:String(error)});}
   cell.finishedAt=new Date().toISOString();cell.logPin=put(directory,'logs.json',logs);put(directory,'cell.json',cell);
  }
 }
 } finally {
  if(attachedBrowser)try{await attachedBrowser.close();const actual=await ownedBrowserIdentity(config.browser.profile);assert.equal(actual.mainPid,config.browser.mainPid);raw.browserAttachmentCleanup={cdpDisconnected:true,rootBrowserStillPresent:true,mainPid:actual.mainPid,rootBrowserFinalExit:'owned by launching process; not performed by collector',observedAt:new Date().toISOString()};}
   catch(error){raw.collection.gaps.push({gate:'browser-attachment-cleanup',status:'fail',reason:String(error)});}
 }
 for(const locale of ['en','es'])for(const stateId of contract.layout.requiredStateIds)for(const id of REQUIRED_SUPPLEMENT_IDS)raw.collection.gaps.push({gate:'supplement',locale,stateId,id,status:'not-run',reason:'supplement observation not executed by this first collector'});
 for(const pin of inputPins)actualPin(root,pin);raw.postflightPins=inputPins;raw.finishedAt=new Date().toISOString();put(outputDirectory,'raw-v1.json',raw);return raw;
}
