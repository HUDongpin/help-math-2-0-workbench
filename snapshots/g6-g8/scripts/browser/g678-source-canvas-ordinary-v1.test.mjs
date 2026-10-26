import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {assertOrdinarySourceHealth,closeOrdinaryCase} from './g678-source-canvas-ordinary-v1.mjs';
// Synthetic committed-source fixture. These counterexamples grant no page evidence.
const here=path.dirname(fileURLToPath(import.meta.url));
const expected={animationId:'shared-nms002-l07-p010',sourceSha256:'a'.repeat(64)};
const healthy=()=>{const identity={...expected,playerId:'fixture-player:1',ownerKind:'source-vm',leaseToken:1,replay:0};return {
  hidden:false,currentAnimationId:expected.animationId,sourceSha:expected.sourceSha256,sessionError:null,runtimeUnavailable:false,
  commit:{status:'ready',identity,source:{frame:10,frameDomain:'sprite-61',tick:12,errors:[],missing:[]},
    render:{status:'ready',animationId:expected.animationId,commitId:'fixture-render:1',sourceFrame:10,sourceFrameDomain:'sprite-61',sourceTick:12},
    lifecycle:{identity:{...identity},pageLeaseCurrent:true,pageSessionCurrent:true,ownsActiveLoad:true,playerDestroyed:false}}
};};
for(const phase of ['source-glossary-before','opened','held','closed','focused','resumed','last-frame-held','last-frame-closed','last-frame-resumed','replay-before','replay-after-ready','pause','pause-held','resume','next-target-ready','returned-page-ready','final-current-page']) {
 test(phase+': visible result cannot hide VM errors or missing operations',()=>{
  const ok=healthy();assert.equal(assertOrdinarySourceHealth(ok,expected,phase),ok);
  for(const mutate of [s=>s.commit.source.errors.push('ActionScript error after visible result'),s=>s.commit.source.missing.push({kind:'shell',key:'unimplemented'})]){const bad=healthy();mutate(bad);assert.throws(()=>assertOrdinarySourceHealth(bad,expected,phase),/source VM/);}
 });
}
test('health requires real current source, render and lifecycle, never missing-field defaults',()=>{
 for(const [name,mutate] of [
  ['no errors observation',s=>delete s.commit.source.errors],['no missing observation',s=>delete s.commit.source.missing],
  ['no commit',s=>s.commit=null],['not ready',s=>s.commit.status='failed'],['foreign source',s=>s.commit.identity.sourceSha256='0'.repeat(64)],
  ['foreign current page',s=>s.currentAnimationId='shared-nms002-l07-p007'],['retired page lease',s=>s.commit.lifecycle.pageLeaseCurrent=false],
  ['retired source session',s=>s.commit.lifecycle.pageSessionCurrent=false],['destroyed player',s=>s.commit.lifecycle.playerDestroyed=true],
  ['foreign lifecycle',s=>s.commit.lifecycle.identity.playerId='foreign'],['failed render',s=>s.commit.render.status='failed'],
  ['mismatched source render',s=>s.commit.render.sourceFrame++],['runtime failure surface',s=>s.runtimeUnavailable=true],
  ['runtime session error',s=>s.sessionError='SOURCE_RUNTIME_FAILED'],['hidden page',s=>s.hidden=true],
 ]) {const sample=healthy();mutate(sample);assert.throws(()=>assertOrdinarySourceHealth(sample,expected,name),undefined,name);}
});
test('Next health is bound to its actual source, not the retired previous source',()=>{
 const next={animationId:'shared-nms002-l07-p011',sourceSha256:'a'.repeat(64)},sample=healthy();sample.currentAnimationId=next.animationId;sample.sourceSha=next.sourceSha256;sample.commit.identity={...sample.commit.identity,...next};sample.commit.lifecycle.identity={...sample.commit.identity};sample.commit.render.animationId=next.animationId;
 assert.equal(assertOrdinarySourceHealth(sample,next,'next-target-ready'),sample);assert.throws(()=>assertOrdinarySourceHealth(sample,expected,'old-page-after-next'));
});
const pending=()=>({status:'checks-complete-pending-cleanup',logs:[],checks:[{kind:'natural-loop',status:'pass'}]});
test('ordinary pass is assigned only after context.close completes',async()=>{const row=pending();let closed=false;const result=await closeOrdinaryCase(row,async()=>{assert.equal(row.status,'checks-complete-pending-cleanup');await Promise.resolve();assert.equal(row.status,'checks-complete-pending-cleanup');closed=true;});assert(closed);assert.equal(result,row);assert.equal(row.status,'ordinary-calibration-pass');assert.deepEqual(row.cleanup,{contextClosed:true});});
test('late requestfailed during context.close rejects an otherwise passing row',async()=>{const row=pending();await closeOrdinaryCase(row,async()=>{await Promise.resolve();row.logs.push({kind:'requestfailed',error:'net::ERR_ABORTED',url:'http://127.0.0.1:3331/required.mp3'});});assert.equal(row.status,'failed');assert.equal(row.logs.length,1);assert.match(row.error,/required-resource/);});
test('cleanup exception rejects pass and retains the cleanup error',async()=>{const row=pending();await closeOrdinaryCase(row,async()=>{throw Error('actual context close failed');});assert.equal(row.status,'failed');assert.equal(row.cleanup.contextClosed,false);assert.match(row.cleanup.error,/actual context close failed/);});
test('existing page failure or strict logs cannot become a pass during clean shutdown',async()=>{const row={...pending(),status:'failed',error:'source VM failed'};await closeOrdinaryCase(row,async()=>{});assert.equal(row.status,'failed');assert.equal(row.error,'source VM failed');const late=pending();late.logs.push({kind:'pageerror'});await closeOrdinaryCase(late,async()=>{});assert.equal(late.status,'failed');});
test('network observations finish and are retained after awaited context close',async()=>{
 const row=pending(),events=[],observed={observationComplete:true,diagnostics:[{id:'request-1',classification:'qualified-metadata',reason:'same request'}]},networkObserver={beginClose(){events.push('begin')},finish(){events.push('finish');assert.deepEqual(events,['begin','closed','finish']);return observed}};
 let retained;await closeOrdinaryCase(row,async()=>{await Promise.resolve();events.push('closed')},{networkObserver,retainNetwork:value=>retained=value});assert.equal(retained,observed);assert.equal(row.status,'ordinary-calibration-pass');assert.equal(row.networkDiagnostics.length,1);
});
test('unfinished or failed network retention cannot receive a pass',async()=>{
 for(const broken of ['open','throw']){const row=pending(),networkObserver={beginClose(){},finish(){return {observationComplete:broken!=='open',diagnostics:[]}}};await closeOrdinaryCase(row,async()=>{},{networkObserver,retainNetwork:()=>{if(broken==='throw')throw Error('retention failed')}});assert.equal(row.status,'failed');assert(row.cleanup.networkError);}
});
test('late unclassified request failure is not hidden by qualified diagnostics',async()=>{
 const row=pending(),networkObserver={beginClose(){},finish(){row.logs.push({error:'ERR_ABORTED',classification:'unclassified-required-failure'});return {observationComplete:true,diagnostics:[{id:'metadata-1'}]}}};await closeOrdinaryCase(row,async()=>{},{networkObserver});assert.equal(row.status,'failed');assert.equal(row.logs.length,1);
});
test('shared runner checks each retained ready phase and finalizes after cleanup',()=>{
 const source=fs.readFileSync(here+'/g678-source-canvas-ordinary-v1.mjs','utf8');
 const body=source.slice(source.indexOf('  try {\n    const response='),source.indexOf('  } catch(error)'));
 assert(!body.includes('await sample('),'pass-bearing phase body uses checked snapshots');
 for(const token of ['const before=await checked()','const opened=await checked()','const held=await checked()','const closed=await checked()','const focused=await checked()','resumed:await checked()','const endHeld=await checked()','const paused=await checked()',"checked('next-target-ready',nextExpected)","checked('returned-page-ready')","checked('final-current-page')"])assert(body.includes(token),token);
 assert(source.includes("after:await checked('replay-after-ready')"));
 assert(source.includes("afterHealth:transition||unbound?'transitional-diagnostic-await-ready-checkpoint':'checked'"));
 assert(source.includes("finally {networkPhase='cleanup';await closeOrdinaryCase(row,()=>context.close(),{networkObserver,retainNetwork:"));
 assert.equal((source.match(/row\.status='ordinary-calibration-pass'/g)??[]).length,1,'only the post-cleanup helper can grant pass');
 assert(source.includes("if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await runOrdinaryCanvasBatch();"));
});
