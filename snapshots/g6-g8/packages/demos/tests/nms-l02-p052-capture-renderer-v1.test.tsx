import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {P052CaptureRenderer,p052BoundCapture,type P052CaptureIdentityRequest} from '../src/nms-l02-p052-capture-renderer-v1';
const plan=JSON.parse(fs.readFileSync(new URL('../../../migrations/shared-nms002-l02-p052/audit/native-main-capture-plan-v1.json',import.meta.url),'utf8'));
function request(row:typeof plan.requirements[number],frame=row.range.first):P052CaptureIdentityRequest{
 return {frameDomain:row.frameDomainId,scenario:row.scenario,language:row.language,seed:row.seed,frame,rootFrame:6,
  requirementId:`req-${row.id}`,traceId:row.id,entryStateSha256:row.entryStateSha256};
}
test('all160 plan identities and1704 frames bind the original entry state without changing phase',()=>{
 let frames=0;for(const row of plan.requirements)for(let frame=row.range.first;frame<=row.range.last;frame++){
  const result=p052BoundCapture(request(row,frame));assert.equal(result.frame,frame);
  assert.deepEqual(result.entryState,row.entryState);assert.equal(result.frameDomain,'sprite-350');frames++;
 }
 assert.equal(plan.requirements.length,160);assert.equal(frames,1704);
});
test('every planned scene renders exact candidate identity with noninteractive controls',()=>{
 for(const row of plan.requirements){
  const html=renderToStaticMarkup(<P052CaptureRenderer request={request(row)}/>);
  for(const [name,value] of Object.entries({'animation-id':plan.animationId,'flash-frame':row.range.first,
   'flash-frame-domain':'sprite-350','flash-root-frame':6,'flash-requirement-id':`req-${row.id}`,
   'flash-trace-id':row.id,'flash-entry-state-sha256':row.entryStateSha256,
   'flash-scenario':row.scenario,'flash-language':row.language,'flash-seed':row.seed})){
   assert.ok(html.includes(`data-${name}="${value}"`),`${row.id} ${name}`);
  }
  assert.ok(html.includes('data-source-alignment="candidate-not-accepted"'));
  for(const input of html.matchAll(/<(?:input|button)\b[^>]*>/g))assert.match(input[0],/disabled=""/);
 }
});
test('malformed, cross-language, cross-scenario and undeclared seed identities fail closed',()=>{
 const base=request(plan.requirements[0]);
 for(const delta of [{rootFrame:1},{frameDomain:'root'},{traceId:'invented'},
  {requirementId:'req-other'},{entryStateSha256:'0'.repeat(64)},{language:'es'},
  {scenario:'practice-zero',frame:115},{seed:99}]){
  assert.throws(()=>renderToStaticMarkup(<P052CaptureRenderer request={{...base,...delta} as P052CaptureIdentityRequest}/>));
 }
});
