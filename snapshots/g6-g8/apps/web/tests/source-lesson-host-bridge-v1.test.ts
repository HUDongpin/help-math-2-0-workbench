import assert from 'node:assert/strict';
import test from 'node:test';
import {loadBoundLessonAudio,sourceLessonHostPaused,sourceLessonHostPlayback, type SourceLessonSnapshot} from '../components/source-lesson-host-bridge-v1';
const snapshot:SourceLessonSnapshot={frame:1,phase:'ready',selectedAudio:'main',audio:{phase:'idle'},spanish:{phase:'idle'}};
test('shared pause reporting preserves main start, optional SA loading and Return states',()=>{
 assert.equal(sourceLessonHostPaused(snapshot),true);
 assert.equal(sourceLessonHostPaused({...snapshot,phase:'start-pending'}),false);
 assert.equal(sourceLessonHostPaused({...snapshot,returning:true}),false);
 assert.equal(sourceLessonHostPaused({...snapshot,selectedAudio:'spanish',spanish:{phase:'loading'}}),false);
 assert.equal(sourceLessonHostPaused({...snapshot,selectedAudio:'spanish',spanish:{phase:'idle'}}),true);
});
test('two consumers retain distinct source frame domains and natural ends',()=>{
 for(const [frameCount,frameDomain] of [[721,'sprite-42'],[648,'sprite-32']] as const) {
  const result=sourceLessonHostPlayback({...snapshot,frame:frameCount},{frameCount,frameDomain,fps:12});
  assert.equal(result.playbackProgress,1);assert.equal(result.frameDomain,frameDomain);
  assert.equal(result.seekAvailable,false);assert.equal(result.narration,'idle');
 }
});
test('bounded stream refuses incomplete, oversized and canceled responses',async t=>{
 const options={animationId:'shared-alg001-l06-p017',assetId:'main-1',pin:{sourceBytes:3,sourceSha256:'a'.repeat(64)},origin:'http://127.0.0.1:3331',signal:new AbortController().signal,errorPrefix:'test'};
 for(const [bytes,reason] of [[2,/length-mismatch/],[4,/too-large/]] as const) {
  t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL)=>{
   const response=new Response(new Uint8Array(bytes),{headers:{'content-type':'audio/mpeg','content-length':'3'}});
   Object.defineProperty(response,'url',{value:String(input)});return response;
  });
  await assert.rejects(loadBoundLessonAudio(options),reason);t.mock.restoreAll();
 }
 const controller=new AbortController();controller.abort();
 await assert.rejects(loadBoundLessonAudio({...options,signal:controller.signal}),/load-canceled/);
});

test('bounded stream does not cancel a drained reader, including short EOF; other failures cancel',async t=>{
 const options={animationId:'shared-alg001-l06-p032',assetId:'optional-spanish-audio-v1',
  pin:{sourceBytes:3,sourceSha256:'a'.repeat(64)},origin:'http://127.0.0.1:3331',errorPrefix:'test'};
 for(const kind of ['complete','short','oversize','aborted','error'] as const){
  const controller=new AbortController(),calls={read:0,cancel:0,release:0};
  const payload=kind==='complete'?Uint8Array.of(1,2,3):
   kind==='oversize'?Uint8Array.of(1,2,3,4):Uint8Array.of(1,2);
  const reader={
   async read(){
    calls.read++;
    if(kind==='error')throw Error('fixture-read-error');
    if(calls.read===1){if(kind==='aborted')controller.abort();return {done:false,value:payload};}
    return {done:true,value:undefined};
   },
   async cancel(){calls.cancel++;},
   releaseLock(){calls.release++;},
  };
  t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL)=>({
   ok:true,redirected:false,url:String(input),
   headers:new Headers({'content-type':'audio/mpeg','content-length':'3'}),
   body:{getReader:()=>reader},
  } as unknown as Response));
  try{
   if(kind==='complete'){
    const loaded=await loadBoundLessonAudio({...options,signal:controller.signal});
    assert.deepEqual([...new Uint8Array(loaded)],[1,2,3]);
   }else{
    const reason=kind==='short'?/length-mismatch/:kind==='oversize'?/too-large/:
     kind==='aborted'?/load-canceled/:/fixture-read-error/;
    await assert.rejects(loadBoundLessonAudio({...options,signal:controller.signal}),reason);
   }
   assert.equal(calls.cancel,['complete','short'].includes(kind)?0:1,`${kind} cancel`);
   assert.equal(calls.release,1,`${kind} release`);
  }finally{t.mock.restoreAll();}
 }
});
