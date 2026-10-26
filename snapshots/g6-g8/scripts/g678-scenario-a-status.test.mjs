import test from 'node:test';
import assert from 'node:assert/strict';
import {ordinaryCredits} from './g678-scenario-a-status.mjs';
const id='shared-nms002-l07-p006',sha='a'.repeat(64),members=[{animationId:id,source:{sha256:sha}}];
const row=(locale='en')=>({animationId:id,locale,status:'ordinary-calibration-pass',logs:[],checks:[{status:'pass',identity:{animationId:id,sourceSha256:sha}}]});
test('one language or a readiness result cannot receive ordinary page credit',()=>{
  assert.equal(ordinaryCredits([{results:[row()]}],members).passed.size,0);
  assert.equal(ordinaryCredits([{results:[{...row(),status:'renderer-ready'},{...row('es'),status:'renderer-ready'}]}],members).passed.size,0);
});
test('languages from different runs cannot be silently joined',()=>assert.equal(ordinaryCredits([{results:[row()]},{results:[row('es')]}],members).passed.size,0));
test('repeated valid bilingual runs count the placement once',()=>assert.equal(ordinaryCredits([{results:[row(),row('es')]},{results:[row(),row('es')]}],members).passed.size,1));
test('claimed passes with logs, failed checks, or wrong source are rejected',()=>{
  for(const mutate of [r=>r.logs.push({error:'ERR_ABORTED'}),r=>r.checks[0].status='fail',r=>r.checks[0].identity.sourceSha256='b'.repeat(64)]){const r=row();mutate(r);assert.throws(()=>ordinaryCredits([{results:[r,row('es')]}],members));}
});
test('a failed language keeps the page flagged without credit',()=>{const r=ordinaryCredits([{results:[row(),{...row('es'),status:'failed',failureCode:'AUDIO_NOT_ACTIVE'}]}],members);assert.equal(r.passed.size,0);assert.equal(r.flagged.get(id),'AUDIO_NOT_ACTIVE');});
test('an older pass cannot hide a later failed ordinary check',()=>{const r=ordinaryCredits([{results:[row(),row('es')]},{results:[row(),{...row('es'),status:'failed',failureCode:'AUDIO_NOT_ACTIVE'}]}],members);assert.equal(r.passed.size,0);assert.equal(r.flagged.get(id),'AUDIO_NOT_ACTIVE');});
