import assert from 'node:assert/strict';
import test from 'node:test';
import {P002SpanishAudio} from './alg-l07-p002-spanish-audio-v1';
for(const action of ['pause','close'] as const)test(`P002 SA ${action} cancels an unresolved load without preparing a late transport`,async()=>{
 let resolve!:(bytes:ArrayBuffer)=>void,signal:AbortSignal|undefined,prepared=0;
 const sa=new P002SpanishAudio({load:s=>{signal=s;return new Promise(r=>{resolve=r;});},changed:()=>{},ended:()=>{throw Error('unexpected EOF');},makeTransport:()=>{prepared++;throw Error('late transport');}});
 assert.equal(sa.snapshot().phase,'idle');const pending=sa.start('user');await Promise.resolve();assert.equal(sa.snapshot().phase,'loading');
 if(action==='close')await sa.close();else sa.pause();assert.equal(signal?.aborted,true);
 resolve(new ArrayBuffer(342384));assert.equal(await pending,false);assert.equal(prepared,0);
 assert.equal(sa.snapshot().phase,action==='close'?'closed':'paused');assert.equal(sa.snapshot().lessonCompleted,false);
 await sa.close();
});
