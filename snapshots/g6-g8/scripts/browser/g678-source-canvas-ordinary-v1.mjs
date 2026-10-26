// Shared ordinary Scenario A collection for exact source-bound Canvas loops.
// Promoted once from the retained P006/P007 runner; historical evidence stays untouched.
// Full configuration/recorded-output conformance remains a separate sample gate.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {installG678TechnicalObserver} from './g678-technical-observer-v1.mjs';
import {createG678CommittedRuntimeAdapter} from './g678-committed-runtime-adapter-v1.mjs';
import {visibleControl} from './g678-course-technical-collector-v1.mjs';
import {waitForRendererReady,assessRendererReady} from '../lib/g678-renderer-ready-smoke-v1.mjs';
import {observeHomeMetadataFailures} from './g678-home-metadata-prefetch-v1.mjs';

/** A pass-bearing checkpoint must be the current rendered source owner.
 * Retired/remount observations may be retained separately, never as a pass. */
export function assertOrdinarySourceHealth(sample, expected, phase = 'source checkpoint') {
  const commit=sample?.commit,identity=commit?.identity,source=commit?.source,render=commit?.render,lifecycle=commit?.lifecycle;
  assert(sample?.hidden===false && sample.currentAnimationId===expected.animationId && sample.sourceSha===expected.sourceSha256,`${phase}: current visible source required`);
  assert(sample.sessionError===null && sample.runtimeUnavailable===false,`${phase}: runtime failure surface`);
  assert(commit?.status==='ready' && identity?.ownerKind==='source-vm' && identity.animationId===expected.animationId && identity.sourceSha256===expected.sourceSha256 && typeof identity.playerId==='string' && identity.playerId.length>0,`${phase}: ready source owner required`);
  assert(Array.isArray(source?.errors) && source.errors.length===0,`${phase}: source VM errors`);
  assert(Array.isArray(source?.missing) && source.missing.length===0,`${phase}: source VM missing operations`);
  assert(render?.status==='ready' && render.animationId===expected.animationId && typeof render.commitId==='string' && render.commitId.length>0 && render.sourceFrame===source.frame && render.sourceFrameDomain===source.frameDomain && render.sourceTick===source.tick,`${phase}: successful matching render commit required`);
  assert(lifecycle?.pageLeaseCurrent===true && lifecycle.pageSessionCurrent===true && lifecycle.ownsActiveLoad===true && lifecycle.playerDestroyed===false,`${phase}: current live source lease required`);
  assert.deepEqual(lifecycle.identity,identity,`${phase}: lifecycle owner mismatch`);
  return sample;
}

/** Close first: requestfailed can be delivered while context.close() retires media. */
export async function closeOrdinaryCase(row, closeContext, {networkObserver,retainNetwork}={}) {
  networkObserver?.beginClose();
  try {await closeContext();row.cleanup={contextClosed:true};}
  catch(error) {row.cleanup={contextClosed:false,error:String(error)};row.status='failed';row.error??=`context cleanup failed: ${String(error)}`;}
  if(networkObserver)try {
    const observed=networkObserver.finish();retainNetwork?.(observed);
    row.networkDiagnostics=observed.diagnostics.map(d=>({id:d.id,classification:d.classification,reason:d.reason}));
    assert.equal(observed.observationComplete,true,'network observation must finish after the page closes');
  }catch(error){row.cleanup.networkError=String(error);row.status='failed';row.error??=`network cleanup failed: ${String(error)}`;}
  if(row.logs.length>0) {row.status='failed';row.error??='page/console/required-resource errors, including context cleanup';}
  if(row.status==='checks-complete-pending-cleanup' && row.cleanup.contextClosed && row.logs.length===0)row.status='ordinary-calibration-pass';
  return row;
}

async function runOrdinaryCanvasBatch() {
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const {chromium}=createRequire(path.join(root,'package.json'))('playwright');
// Optional source-bound compatible batch; default preserves the original pair.
const familyInputPath=process.argv[3]==='--family-records'?process.argv[4]:null;
assert(process.argv.length===3 || process.argv.length===5&&familyInputPath,'<new-output> [--family-records <pinned-record-json>]');
const verifyPin=(p)=>{const b=fs.readFileSync(path.resolve(root,p.path));assert.equal(b.length,p.bytes,p.path);assert.equal(createHash('sha256').update(b).digest('hex'),p.sha256,p.path);return b;};
const family=familyInputPath?JSON.parse(fs.readFileSync(familyInputPath,'utf8')):null;
if(family) {assert.equal(family.kind,'nms-l07-ordinary-existing-runner-inputs-v1');assert.deepEqual(family.animationIds,['shared-nms002-l07-p010','shared-nms002-l07-p016','shared-nms002-l07-p017','shared-nms002-l07-p019','shared-nms002-l07-p021']);family.inputPins.forEach(verifyPin);}
const source=family?JSON.parse(verifyPin(family.source)):JSON.parse(fs.readFileSync(path.join(root,'work/hfr-typescript/scenario-a-20261024-01a16a17/continuation-01/source-calibration/SOURCE-CALIBRATION-COMPACT.json'),'utf8'));
const contractPath='catalog/g678-nms-l07-canvas-glossary-v1.json';
const contract=family?JSON.parse(verifyPin({...family.profiles,path:contractPath})):JSON.parse(fs.readFileSync(path.join(root,contractPath),'utf8'));
const ids=family?.animationIds??['shared-nms002-l07-p006','shared-nms002-l07-p007'];
const profiles=contract.pages.filter(p=>ids.includes(p.meta.key));assert.deepEqual(profiles.map(p=>p.meta.key),ids);
// Navigation checks read the actual destination source, never a retired old surface.
const registryPath='packages/demos/private-current-js-registry.json',registryBytes=fs.readFileSync(path.join(root,registryPath));
const runtimeInputPins=[{path:registryPath,bytes:registryBytes.length,sha256:createHash('sha256').update(registryBytes).digest('hex')}];
const entries=JSON.parse(registryBytes).calibrations.flatMap(calibration=>calibration.entries),identities=new Map();
for(const animationId of new Set(profiles.flatMap(profile=>[profile.meta.key,profile.meta.nextKey]))) {
  assert(typeof animationId==='string');const matches=entries.filter(entry=>entry.key===animationId);assert.equal(matches.length,1);
  const entry=matches[0];assert.equal(entry.artifacts.kind,'generated-typescript-hfr-v1');
  const module=verifyPin(entry.artifacts.module).toString('utf8'),match=module.match(/const meta: HfrPageMeta = (\{.*?\n\});/su);assert(match,'exact generated HFR module metadata');
  const meta=JSON.parse(match[1]);assert.equal(meta.key,animationId);identities.set(animationId,{animationId,sourceSha256:meta.sourceSha256});runtimeInputPins.push(entry.artifacts.module);
}
for(const profile of profiles)assert.equal(identities.get(profile.meta.key).sourceSha256,profile.binding.sourceSwfSha256);
const out=path.resolve(root,process.argv[2]);assert(out.startsWith(root+'/output/playwright/')&&!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});
const origin='http://127.0.0.1:3331',serverPid=Number(process.env.G678_SERVER_PID);
const buildId=process.env.G678_COMPILED_BUILD_ID;
const verifyServer=()=>{
  assert(Number.isSafeInteger(serverPid)&&serverPid>0);
  assert(buildId&&fs.readFileSync(path.join(root,'apps/web/.next-g678-compiled-local-qa/BUILD_ID'),'utf8').trim()===buildId,'exact compiled QA build');
  const pids=execFileSync('lsof',['-nP','-a','-iTCP:3331','-sTCP:LISTEN','-Fp'],{encoding:'utf8'}).trim().split('\n').filter(s=>/^p\d+$/.test(s));
  assert.deepEqual(pids,[`p${serverPid}`]);
  assert(execFileSync('lsof',['-a','-p',String(serverPid),'-d','cwd','-Fn'],{encoding:'utf8'}).includes('n'+root+'/apps/web\n'));
  const command=execFileSync('ps',['-p',String(serverPid),'-o','command='],{encoding:'utf8'});
  assert(!/next dev/u.test(command),'compiled local QA only');
};
verifyServer();
const put=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const results=[],browser=await chromium.launch({channel:'chrome',headless:false,ignoreDefaultArgs:['--mute-audio'],args:['--autoplay-policy=user-gesture-required']});
try {for(const profile of profiles)for(const locale of ['en','es']) {
  const id=profile.meta.key,binding=profile.binding,src=source.pages.find(p=>p.id===id);assert(src);const expected=identities.get(id),nextExpected=identities.get(profile.meta.nextKey);
  const name=id+'-'+locale,row={animationId:id,locale,startedAt:new Date().toISOString(),status:'running',checks:[],logs:[],media:[],actions:[]};results.push(row);
  console.log(JSON.stringify({animationId:id,locale,phase:'ordinary-calibration-start',at:row.startedAt}));
  const context=await browser.newContext({viewport:{width:1360,height:900},deviceScaleFactor:1,locale,reducedMotion:'no-preference'});
  const selector=`[data-hfr-page="${id}"]`,surface=selector+' canvas';
  await context.addInitScript({content:`window.__g678CommittedRuntimeAdapter=(${createG678CommittedRuntimeAdapter.toString()})(${JSON.stringify({surfaceSelector:surface})});(${installG678TechnicalObserver.toString()})(${JSON.stringify({animationId:id,sourceSha256:binding.sourceSwfSha256,rendererFamily:'generated-typescript-hfr-v1',runtimeObserverKey:'__g678CommittedRuntimeAdapter',audioRequired:true})});`});
  const page=await context.newPage(),cdp=await context.newCDPSession(page);await cdp.send('Media.enable');
  let networkPhase='ordinary-collection';
  const networkObserver=observeHomeMetadataFailures({page,origin,expectedCourseUrl:`${origin}/${locale}/migration-status/g678-course/nms002/7`,networkErrors:row.logs,phase:()=>networkPhase});
  for(const event of ['playerEventsAdded','playerErrorsRaised'])cdp.on('Media.'+event,value=>row.media.push({event,value,at:new Date().toISOString()}));
  page.on('pageerror',e=>row.logs.push({kind:'pageerror',error:String(e)}));
  page.on('console',m=>{if(m.type()==='error')row.logs.push({kind:'console',error:m.text()});});
  page.on('response',r=>{if(r.status()>=400)row.logs.push({kind:'http',url:r.url(),status:r.status()});});
  const sample=(animationId=id)=>page.evaluate(animationId=>{const stage=document.querySelector(`[data-hfr-page="${animationId}"]`),canvas=stage?.querySelector('canvas'),dialog=document.querySelector('[role="dialog"][data-glossary-entry-id]');return {atMs:performance.now(),currentAnimationId:document.querySelector('[data-lesson-player]')?.getAttribute('data-current-animation-id')??null,commit:canvas?.__g678TechnicalRead?.()??null,frame:Number(stage?.getAttribute('data-hfr-progress-frame')),tick:Number(stage?.getAttribute('data-hfr-tick-count')),running:stage?.getAttribute('data-hfr-running'),narration:stage?.getAttribute('data-hfr-narration-state'),sourceSha:stage?.getAttribute('data-hfr-source-sha256'),sessionError:stage?.getAttribute('data-hfr-session-error')??null,runtimeUnavailable:Boolean(stage?.querySelector('.runtime-unavailable')),dialog:dialog?{entry:dialog.getAttribute('data-glossary-entry-id'),text:dialog.textContent}:null,hidden:document.hidden};},animationId);
  const checked=async(phase='current-source',identity=expected)=>assertOrdinarySourceHealth(await sample(identity.animationId),identity,phase);
  const click=async(query,label,{beforeIdentity=expected,afterIdentity=expected,transition=false,unbound=false}={})=>{
    const control=await visibleControl(page,query),before=unbound?await sample(beforeIdentity.animationId):await checked(label+'-before',beforeIdentity);
    await control.click();const after=await sample(afterIdentity.animationId);
    if(!transition&&!unbound)assertOrdinarySourceHealth(after,afterIdentity,label+'-after');
    row.actions.push({label,before,after,force:false,beforeHealth:unbound?'normal-entry-not-yet-selected':'checked',afterHealth:transition||unbound?'transitional-diagnostic-await-ready-checkpoint':'checked'});
  };
  const frame=async(min,max=binding.frames)=>page.waitForFunction(({selector,min,max,domain})=>{const value=document.querySelector(selector)?.querySelector('canvas')?.__g678TechnicalRead?.();return value?.status==='ready'&&value.source.frameDomain===domain&&value.source.frame>=min&&value.source.frame<=max;},{selector,min,max,domain:`sprite-${binding.characterId}`},{timeout:Math.ceil(binding.frames/12*1000+15000),polling:20});
  const replay=async()=>{const before=await checked('replay-before');await click('[data-responsive-focus-key="replay"]','replay',{transition:true});await page.waitForFunction(({selector,owner})=>{const r=document.querySelector(selector)?.querySelector('canvas')?.__g678TechnicalRead?.();return r?.status==='ready'&&r.identity.playerId!==owner&&r.source.frame<20;},{selector,owner:before.commit?.identity.playerId},{timeout:20000,polling:20});return {before,after:await checked('replay-after-ready')};};
  try {
    const response=await page.goto(`${origin}/${locale}/migration-status/g678-course/nms002/7`,{waitUntil:'domcontentloaded',timeout:120000});assert.equal(response?.status(),200);
    await page.locator('[data-lesson-player][data-hydrated="true"]').waitFor({timeout:30000});
    await click('[data-responsive-focus-key="map"]','open-map',{unbound:true,transition:true});await click(`button[data-animation-id="${id}"]`,'select-page',{unbound:true,transition:true});
    assert(assessRendererReady(id,await waitForRendererReady(page,id,45000)).rendererReady);
    assert.equal((await checked()).sourceSha,binding.sourceSwfSha256);
    if(await page.locator('[data-playback-action="pause"]').count())await click('[data-playback-action="pause"]','pause');
    await click('[data-playback-action="play"]','play');
    await page.evaluate(selector=>{window.__sourceTrace=[];const read=()=>{const r=document.querySelector(selector)?.querySelector('canvas')?.__g678TechnicalRead?.();if(r?.status==='ready')window.__sourceTrace.push({atMs:performance.now(),hidden:document.hidden,...r});};window.__sourceObserver=new MutationObserver(read);window.__sourceObserver.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['data-hfr-progress-frame','data-hfr-tick-count']});read();},selector);
    const reset=await replay(),owner=reset.after.commit.identity.playerId;
    await frame(binding.frames-2);await page.locator(selector).screenshot({path:path.join(out,name+'-near-loop-end.png'),animations:'allow'});
    await page.waitForFunction(({owner,last})=>{const rows=window.__sourceTrace.filter(r=>r.identity.playerId===owner);return rows.some((r,i)=>r.source.frame===last&&rows.slice(i+1).some(s=>s.source.frame===1));},{owner,last:binding.frames},{timeout:12000,polling:20});
    const afterLoop=await checked(),trace=await page.evaluate(()=>{window.__sourceObserver.disconnect();return window.__sourceTrace;});put(name+'-natural-trace.json',trace);
    const own=trace.filter(r=>r.identity.playerId===owner&&r.source.frameDomain===`sprite-${binding.characterId}`);
    assert(own.some(r=>r.source.frame<20)&&own.some(r=>r.source.frame===binding.frames)&&own.some((r,i)=>r.source.frame===binding.frames&&own.slice(i+1).some(s=>s.source.frame===1)));
    assert(own.every(r=>!r.hidden&&r.source.errors.length===0&&r.source.missing.length===0));
    assert(afterLoop.atMs-reset.after.atMs>(binding.frames-20)/12*1000,'natural cycle too short');
    await page.locator(selector).screenshot({path:path.join(out,name+'-looped.png'),animations:'allow'});
    row.checks.push({kind:'natural-loop',status:'pass',reset,afterLoop,trace:name+'-natural-trace.json',frames:binding.frames});
    for(const sourceControl of src.controls) {
      await frame(Math.max(sourceControl.frames[0]+1,sourceControl.fullOpacityFromFrame??3));
      const box=await page.locator(surface).boundingBox();assert(box);
      const hit=sourceControl.stageHitBox,point={x:(hit.left+hit.right)/2/800*box.width,y:(hit.top+hit.bottom)/2/600*box.height};
      const before=await checked();await page.locator(surface).click({position:point});
      const expected=binding.controls.find(c=>c.sourceButtonCharacterId===sourceControl.buttonId),dialog=page.locator(`[role="dialog"][data-glossary-entry-id="${expected.dictionaryEntryId}"]`);await dialog.waitFor({state:'visible',timeout:10000});
      const opened=await checked();await page.waitForTimeout(250);const held=await checked();assert.equal(held.tick,opened.tick);assert.equal(held.frame,opened.frame);assert.equal(held.running,'false');
      const definition=profile.descriptorEntries.find(e=>e.id===expected.dictionaryEntryId).definitions[locale];assert(held.dialog.text.includes(definition));
      await dialog.getByRole('button',{name:locale==='es'?'Cerrar':'Close',exact:true}).click();await dialog.waitFor({state:'hidden'});
      const closed=await checked();assert.equal(closed.frame,held.frame);assert.equal(closed.running,'false');
      // The maintained host restores its captured trigger in requestAnimationFrame.
      // Observe that real completion without moving focus or advancing source state.
      await page.waitForFunction(selector=>{const canvas=document.querySelector(selector)?.querySelector('canvas');return canvas?.isConnected&&!canvas.closest('[inert]')&&document.activeElement===canvas;},selector,{timeout:1000,polling:'raf'});
      const focused=await checked();assert.equal(focused.frame,closed.frame);assert.equal(focused.tick,closed.tick);assert.equal(focused.running,'false');
      for(const current of [closed,focused]) {assert.deepEqual(current.commit.identity,held.commit.identity);assert.equal(current.commit.render.surfaceId,held.commit.render.surfaceId);assert.equal(current.commit.source.frame,held.commit.source.frame);assert.equal(current.commit.source.tick,held.commit.source.tick);assert.equal(current.commit.host.paused,true);}
      await click('[data-playback-action="play"]','explicit-play-after-glossary');await frame(closed.frame+1);row.checks.push({kind:'source-glossary',buttonId:sourceControl.buttonId,entry:expected.dictionaryEntryId,status:'pass',before,opened,held,closed,focused,resumed:await checked()});
    }
    // The exact source has no terminal stop: a glossary hold on the last frame
    // must resume its loop through public Play, without setting source state.
    await replay();
    const endControl=src.controls[0],endTerm=binding.controls[0],endBox=await page.locator(surface).boundingBox();assert(endBox);
    const endPoint={x:(endControl.stageHitBox.left+endControl.stageHitBox.right)/2/800*endBox.width,y:(endControl.stageHitBox.top+endControl.stageHitBox.bottom)/2/600*endBox.height};
    // Move before the 83 ms source boundary, then send the real pointer click
    // without adding locator stability waits inside that final source frame.
    await page.mouse.move(endBox.x+endPoint.x,endBox.y+endPoint.y);
    await frame(binding.frames,binding.frames);await page.mouse.click(endBox.x+endPoint.x,endBox.y+endPoint.y);
    const endDialog=page.locator(`[role="dialog"][data-glossary-entry-id="${endTerm.dictionaryEntryId}"]`);await endDialog.waitFor({state:'visible',timeout:10000});
    const endHeld=await checked();assert.equal(endHeld.frame,binding.frames,'real pointer release reached the reviewed last-frame boundary');assert.equal(endHeld.running,'false');
    await endDialog.getByRole('button',{name:locale==='es'?'Cerrar':'Close',exact:true}).click();await endDialog.waitFor({state:'hidden'});
    assert.equal((await checked()).frame,binding.frames);await click('[data-playback-action="play"]','play-from-loop-end');await frame(1,10);
    row.checks.push({kind:'last-frame-glossary-resume',status:'pass',endHeld,resumed:await checked()});
    const repeat=await replay();assert(repeat.before.commit.identity.playerId!==repeat.after.commit.identity.playerId);row.checks.push({kind:'replay',status:'pass',...repeat});
    await click('[data-playback-action="pause"]','pause');const paused=await checked();await page.waitForTimeout(250);assert.equal((await checked()).tick,paused.tick);await click('[data-playback-action="play"]','resume');await frame(paused.frame+1);row.checks.push({kind:'pause-resume',status:'pass',paused,resumed:await checked()});
    const records=await page.evaluate(()=>window.__g678TechnicalObserver.records);put(name+'-observer.json',records);
    if(locale==='en') {
      const audioSource=src.audio.find(a=>a.role==='EN-source-stream');assert(audioSource);
      const currentStarts=records.starts.filter(s=>s.started&&s.owner?.animationId===id&&s.owner?.sourceSha256===binding.sourceSwfSha256&&records.decodes.some(d=>d.state==='fulfilled'&&d.bufferId===s.bufferId&&d.sha256===audioSource.sha256)&&records.contextOps.some(o=>o.contextId===s.contextId&&o.method==='resume'&&o.fulfilled&&o.after==='running'));
      assert(currentStarts.length>0,'native English stream activity');row.checks.push({kind:'native-audio-activity',language:'en',starts:currentStarts,status:'pass'});
    } else {
      const players=new Map();for(const m of row.media)if(m.event==='playerEventsAdded')for(const e of m.value.events){let v;try{v=JSON.parse(e.value);}catch{continue;}const a=players.get(m.value.playerId)??[];a.push(v);players.set(m.value.playerId,a);}
      const active=[...players].filter(([,events])=>events.some(e=>e.event==='kLoad'&&e.url===origin+'/flash-assets/g678-local/'+id+'/hfr/media/spanish.mp3')&&events.some(e=>e.event==='kPlay'));
      assert(active.length>0,'native Spanish source activity');row.checks.push({kind:'native-audio-activity',language:'es',players:active,status:'pass'});
    }
    await click('[data-lesson-nav="action-next"], [data-lesson-nav="footer-next"]','next',{afterIdentity:nextExpected,transition:true});assert(assessRendererReady(profile.meta.nextKey,await waitForRendererReady(page,profile.meta.nextKey,45000)).rendererReady);
    const next=await checked('next-target-ready',nextExpected);
    await click('[data-lesson-nav="action-previous"], [data-lesson-nav="footer-previous"]','previous',{beforeIdentity:nextExpected,transition:true});assert(assessRendererReady(id,await waitForRendererReady(page,id,45000)).rendererReady);
    const returned=await checked('returned-page-ready');row.checks.push({kind:'public-navigation',status:'pass',next,returned});
    row.finalCurrent=await checked('final-current-page');
    assert.equal(row.logs.length,0,'page/console/required-resource errors');row.status='checks-complete-pending-cleanup';row.language={sourceVisibleText:'en',route:locale,narration:locale,translationAcceptance:false};
  } catch(error) {row.status='failed';row.error=String(error);try{row.last=await sample();await page.screenshot({path:path.join(out,name+'-failure.png')});}catch{}}
  finally {networkPhase='cleanup';await closeOrdinaryCase(row,()=>context.close(),{networkObserver,retainNetwork:observed=>{put(name+'-network.json',observed);row.networkObservationFile=name+'-network.json';}});row.finishedAt=new Date().toISOString();put(name+'-result.json',row);console.log(JSON.stringify({animationId:id,locale,phase:'ordinary-calibration-finished',status:row.status,error:row.error??null,at:row.finishedAt}));}
}}
finally {await browser.close();verifyServer();runtimeInputPins.forEach(verifyPin);if(family)family.inputPins.forEach(verifyPin);put('RESULT.json',{scope:'Ordinary Scenario A natural loops, exact source pointer glossary actions, native audio activity, Replay and public navigation. No six-configuration/PCM/human gate.',requestedAnimationIds:ids,runtimeInputPins,buildId,results,conformanceSamples:0});}
process.exitCode=results.length===ids.length*2&&results.every(r=>r.status==='ordinary-calibration-pass')?0:1;

}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await runOrdinaryCanvasBatch();
