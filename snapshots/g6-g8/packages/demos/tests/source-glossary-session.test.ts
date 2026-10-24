import assert from 'node:assert/strict';
import test from 'node:test';
import {SourceGlossarySession,type GlossaryTransportSnapshot} from '../src/source-glossary-session';
import {ALG_L12_GLOSSARY_PAIR_CONTROLS} from '../src/generated/alg-l12-glossary-pair-controls';
import {createMemoryOnlyLessonHost} from '../src/lesson-host-contract';

function fixture(index:number){
 const page=ALG_L12_GLOSSARY_PAIR_CONTROLS[index],effects:string[]=[];
 let state:GlossaryTransportSnapshot={phase:'paused',frame:1,timelineSample:0,volume:1,error:null};
 let defer:((value:boolean)=>void)|undefined,slow=false;
 const transport={snapshot:()=>({...state}),play:async()=>{
   effects.push('play');state.phase=slow?'loading':'playing';
   if(slow)return new Promise<boolean>(resolve=>{defer=resolve;});return true;
 },pause(){effects.push('pause');state.phase='paused';},reset(){effects.push('reset');state.frame=1;state.timelineSample=0;state.phase='paused';},
 seekFrame(frame:number){state.frame=frame;state.phase='paused';},setVolume(v:number){state.volume=v;},async close(){effects.push('close');state.phase='closed';}};
 const host=createMemoryOnlyLessonHost({releaseId:'pair-test',releaseMemberIds:ALG_L12_GLOSSARY_PAIR_CONTROLS.map(p=>p.animationId),currentAnimationId:page.animationId,enabledCapabilities:['glossary'],mode:'audit',releasePublished:false});
 const session=new SourceGlossarySession({page,transport,request(request){effects.push(request.type);return host.dispatch(request);},paused(paused){effects.push('paused:'+paused);},complete(){effects.push('complete');}});
 session.setReady(true);
 return {session,page,effects,state,slow(){slow=true;},resolve(){defer?.(true);}};
}
test('both real consumers pause before the exact glossary request and close never resumes',async()=>{
 for(const index of [0,1]){
  const f=fixture(index);f.session.seekFrame(100);await f.session.play();f.effects.length=0;
  assert.equal(f.session.openGlossary(index===0?'quadrant':'plot')?.status,'allowed');
  assert.deepEqual(f.effects,['pause','paused:true','open-glossary']);
  assert.equal(await f.session.play(),false);
  assert.equal(f.session.openGlossary(index===0?'x-axis':'point'),undefined);
  f.session.closeGlossary();assert.equal(f.session.glossary,null);assert.equal(f.state.phase,'paused');
  assert(!f.effects.includes('play'));await f.session.play();assert.equal(f.state.phase,'playing');
 }
});
test('source visibility and seek bounds reject unavailable actions without host effects',()=>{
 const f=fixture(0);f.session.seekFrame(71);f.effects.length=0;
 assert.equal(f.session.openGlossary('quadrant'),undefined);
 assert.equal(f.session.openGlossary('not-a-term'),undefined);
 assert.equal(f.session.seekFrame(373),false);assert.deepEqual(f.effects,[]);
 f.session.seekFrame(72);assert.equal(f.session.openGlossary('quadrant')?.status,'allowed');
 assert.equal(f.session.seekFrame(1),false);
});
test('Replay resets the held page and only played terminal transitions complete once',async()=>{
 const f=fixture(1);f.session.seekFrame(474);f.session.tick();assert(!f.effects.includes('complete'));
 f.session.openGlossary('plot');await f.session.replay();assert.equal(f.state.frame,1);assert.equal(f.session.glossary,null);
 assert.equal(f.state.phase,'playing');f.state.frame=474;f.state.phase='ended';f.session.tick();f.session.tick();
 assert.equal(f.effects.filter(e=>e==='complete').length,1);
});
test('navigation cancels pending Play publication and closes the transport',async()=>{
 const f=fixture(0);f.slow();const playing=f.session.play();await f.session.close();
 const prior=f.effects.length;f.resolve();assert.equal(await playing,false);
 assert.equal(f.state.phase,'closed');assert.equal(f.effects.length,prior);
 assert.equal(await f.session.play(),false);assert.equal(f.session.openGlossary('x-axis'),undefined);
});
