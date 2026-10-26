import assert from 'node:assert/strict';
import test from 'node:test';
import {p024HostPaused,p024HostPlayback} from '../components/g678-alg-l06-p024-runtime-v1';
import {p024InitialState,type P024State} from '../../../packages/demos/src/alg-l06-p024-state-v1';
import type {P024PlayerSnapshotV1} from '../../../packages/demos/src/alg-l06-p024-player-v1';
function snapshot(state:Partial<P024State>,selected:'source'|'spanish',phase:string,transitioning=false){
 return {state:{...p024InitialState(),...state},audio:{selectedAudio:selected,transitioning,
  spanish:{phase},clock:{phase:'paused'}},visualReady:true,error:null} as P024PlayerSnapshotV1;
}
test('Return preserves intended host playback while SA retires; Pause wins',()=>{
 const returning=snapshot({phase:'main',mainFrame:80,sa:'idle',playing:true},'spanish','idle',true);
 assert.equal(p024HostPaused(returning),false);
 assert.equal(p024HostPaused({...returning,state:{...returning.state,playing:false}}),true);
 const held=snapshot({phase:'quiz',mainFrame:154,sa:'idle',playing:false},'spanish','idle',true);
 assert.equal(p024HostPaused(held),true);
});
test('explicit SA loading/playing remains active; Pause and EOF hold',()=>{
 for(const phase of ['loading','playing'])
  assert.equal(p024HostPaused(snapshot({sa:'playing'},'spanish',phase)),false);
 for(const phase of ['paused','ended','idle'])
  assert.equal(p024HostPaused(snapshot({sa:'ended'},'spanish',phase)),true);
});
test('quiz and popup keep modern host interactive with safe reconstruction disabled',()=>{
 for(const phase of ['quiz','popup'] as const){
  const s=snapshot({phase,mainFrame:154},'source','idle');
  const playback=p024HostPlayback(s);
  assert.equal(playback.narration,'interactive');
  assert.equal(playback.frame,154);assert.equal(playback.frameCount,381);
  assert.equal(playback.seekAvailable,false);assert.equal(playback.frameDomain,'sprite-208');
 }
});
