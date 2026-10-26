import assert from "node:assert/strict";
import test from "node:test";
import {advanceAlgL11P034RevealClock,algL11P034FadeState,syncAlgL11P034RevealClock} from "../src/g678-alg-l11-p034-source-fade";
test("source100ms interval gives exact alpha, picture visibility, and final card removal boundaries",()=>{
  const expected=[
    [0,0,100,true,false],[99.999,0,100,true,false],
    [100,1,60,true,true],[199.999,1,60,true,true],
    [200,2,20,true,true],[299.999,2,20,true,true],
    [300,3,-20,true,true],[399.999,3,-20,true,true],
    [400,4,-20,false,true],[9000,4,-20,false,true],
  ] as const;
  for(const[elapsed,tick,alpha,cardVisible,tileVisible]of expected){
    assert.deepEqual(algL11P034FadeState(elapsed,true),{tick,sourceAlpha:alpha,
      opacity:Math.max(0,alpha)/100,cardVisible,tileVisible,settled:tick===4});
  }
});
test("Pause preserves fractional source time, new matches have their own clock, and Replay/level reset clears prior fades",()=>{
  let clock=syncAlgL11P034RevealClock({identity:"",elapsedByPair:{}},"replay0:level1",[1]);
  clock=advanceAlgL11P034RevealClock(clock,150,false,false);
  assert.equal(clock.elapsedByPair[1],150);
  assert.equal(advanceAlgL11P034RevealClock(clock,5000,true,false),clock);
  clock=advanceAlgL11P034RevealClock(clock,50,false,false);
  assert.equal(algL11P034FadeState(clock.elapsedByPair[1],true).sourceAlpha,20);
  clock=syncAlgL11P034RevealClock(clock,clock.identity,[1,3]);
  assert.deepEqual(clock.elapsedByPair,{1:200,3:0});
  clock=advanceAlgL11P034RevealClock(clock,100,false,false);
  assert.deepEqual(clock.elapsedByPair,{1:300,3:100});
  assert.deepEqual(syncAlgL11P034RevealClock(clock,"replay1:level1",[]).elapsedByPair,{});
  assert.deepEqual(syncAlgL11P034RevealClock(clock,"replay0:level2",[3]).elapsedByPair,{3:0});
});
test("reduced motion reveals the settled matched picture immediately without a timing loop",()=>{
  const clock=syncAlgL11P034RevealClock({identity:"",elapsedByPair:{}},"a",[1,2]);
  assert.deepEqual(advanceAlgL11P034RevealClock(clock,0,true,true).elapsedByPair,{1:400,2:400});
  assert.deepEqual(algL11P034FadeState(0,true,true),{tick:4,sourceAlpha:-20,opacity:0,cardVisible:false,tileVisible:true,settled:true});
  assert.equal(algL11P034FadeState(400,false,true).tileVisible,false);
  assert.throws(()=>advanceAlgL11P034RevealClock(clock,-1,false,false));
  assert.throws(()=>syncAlgL11P034RevealClock(clock,"a",[1,1]));
});
