import assert from 'node:assert/strict';
import test from 'node:test';
import {resolveUnregisteredPrivateRuntimeCandidate, selectG678PrivateRuntimeAdapter} from '../lib/g678-private-runtime-adapters-v1';
import type {PrivateLessonRuntimeAdapter} from '../lib/lesson-runtime-adapter';
const id='shared-nms002-l07-p001',sha='a'.repeat(64);
const adapter:PrivateLessonRuntimeAdapter={animationId:id,audioEnabled:false,Component:()=>null,
 candidateBinding:{kind:'source-bound-unregistered-candidate-v1',sourceSha256:sha,moduleKey:id,
 runtimeQuery:{frameDomain:'sprite-113',language:'fixed-en',scenario:'hfr',seed:'12345'}}};
const context={animationId:id,rendererKind:'unavailable' as const,sourceAssetId:`swf-${sha}`,
 nodeEnv:'development',candidateMode:true,reviewerMode:true,releasePublished:false};

test('one exact unregistered placement may render on the development reviewer host without changing its availability',()=>{
 const original=JSON.stringify(context);
 const candidate=resolveUnregisteredPrivateRuntimeCandidate(adapter,context);
 assert.deepEqual(candidate,{animationId:id,sourceSha256:sha,moduleKey:id,runtimeQuery:adapter.candidateBinding!.runtimeQuery});
 assert.equal(context.rendererKind,'unavailable');assert.equal(JSON.stringify(context),original);
 assert.ok(Object.isFrozen(candidate));assert.ok(Object.isFrozen(candidate!.runtimeQuery));
});

test('production, non-review, published, already registered or unbound source candidates remain unavailable',()=>{
 for(const changed of [{nodeEnv:'production'},{nodeEnv:'test'},{nodeEnv:undefined},{candidateMode:false},
  {reviewerMode:false},{releasePublished:true},{rendererKind:'registered' as const},
  {animationId:'shared-nms002-l07-p002'},{sourceAssetId:`swf-${'b'.repeat(64)}`},{sourceAssetId:undefined}]){
  assert.equal(resolveUnregisteredPrivateRuntimeCandidate(adapter,{...context,...changed}),undefined,JSON.stringify(changed));
 }
 assert.equal(resolveUnregisteredPrivateRuntimeCandidate(undefined,context),undefined);
 assert.equal(resolveUnregisteredPrivateRuntimeCandidate({...adapter,candidateBinding:undefined},context),undefined);
});

test('candidate identity and query cannot silently substitute another module, seed, domain or source',()=>{
 const binding=adapter.candidateBinding!;
 const changedBindings=[{...binding,moduleKey:'shared-nms002-l07-p002'}, {...binding,sourceSha256:'invalid'},
  {...binding,runtimeQuery:{...binding.runtimeQuery,frameDomain:'stream:113'}},
  {...binding,runtimeQuery:{...binding.runtimeQuery,scenario:''}},
  ...['-1','1.5','01','4294967296','9007199254740992'].map(seed=>({...binding,runtimeQuery:{...binding.runtimeQuery,seed}}))];
 for(const candidateBinding of changedBindings) assert.equal(resolveUnregisteredPrivateRuntimeCandidate({...adapter,candidateBinding},context),undefined);
});

test('existing registered adapter selection and duplicate rejection keep their prior contract',()=>{
 const registered:PrivateLessonRuntimeAdapter={animationId:id,audioEnabled:true,Component:()=>null};
 assert.equal(selectG678PrivateRuntimeAdapter(id,registered),registered);
 assert.equal(resolveUnregisteredPrivateRuntimeCandidate(registered,{...context,rendererKind:'registered'}),undefined);
 assert.throws(()=>selectG678PrivateRuntimeAdapter(id,registered,[registered]),/duplicate-or-empty/u);
});
