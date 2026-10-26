import assert from 'node:assert/strict';import test from 'node:test';
import {P002ReturnGuard} from './alg-l07-p002-return-v1';
for(const action of ['Pause','hidden','Replay','stop','new-SA','unmount'])test(`delayed P002 SA close cannot overwrite ${action}`,async()=>{
 const gate=new P002ReturnGuard();let release!:()=>void,resumed=0;
 const pending=gate.afterClose(()=>new Promise<void>(r=>{release=r;}),()=>true,()=>{resumed++;});
 assert.equal(gate.pending,true);gate.cancel();release();assert.equal(await pending,false);assert.equal(resumed,0);assert.equal(gate.pending,false);
});
test('normal SA close resumes the same retained main operation exactly once',async()=>{
 const gate=new P002ReturnGuard();let release!:()=>void,resumed=0;
 const pending=gate.afterClose(()=>new Promise<void>(r=>{release=r;}),()=>true,()=>{resumed++;});assert.equal(resumed,0);
 release();assert.equal(await pending,true);assert.equal(resumed,1);assert.equal(gate.pending,false);
});
