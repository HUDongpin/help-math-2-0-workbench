import {test} from 'node:test';import assert from 'node:assert/strict';
import {P052Controller} from '../src/nms-l02-p052-controller-v1';
import {p052HostPlaybackState} from '../src/nms-l02-p052-host-state-v1';
import {isP052RuntimeScope,isP052RuntimeModule,P052_RUNTIME_ID as ID} from '../../../apps/web/lib/nms-l02-p052-runtime-access';
import candidate from '../src/modules/g678-nms-l02-percent-practice-p052';
const props={audioEnabled:true,animationId:ID,moduleKey:ID,query:{frameDomain:'sprite-350',scenario:'intro',lang:'en',seed:'0'}};
test('host scope rejects production, capture, other pages and malformed seeds',()=>{
 assert.equal(isP052RuntimeScope(props,{NODE_ENV:'development'}),true);
 for(const env of [{NODE_ENV:'production'},{VERCEL_ENV:'preview'}])assert.equal(isP052RuntimeScope(props,env),false);
 for(const change of [{audioEnabled:false},{animationId:'other'},{moduleKey:'other'}])assert.equal(isP052RuntimeScope({...props,...change},{}),false);
 for(const change of [{capture:'1'},{frameDomain:'root'},{frame:'115'},{rootFrame:'1'},{scenario:'first-wrong'},{seed:'-1'},{seed:'01'},{seed:'4294967296'},{seed:['0']},{lang:'fr'}])
  assert.equal(isP052RuntimeScope({...props,query:{...props.query,...change}},{}),false);
});
test('private module shape requires exact source/audio/text/domain; legacy maturity is denied',()=>{
 assert.equal(isP052RuntimeModule({...candidate,maturity:'legacy-prototype'}),false);
 const fixture={...candidate,maturity:'private-current-js'};assert.equal(isP052RuntimeModule(fixture),true);
 for(const value of [null,{}, {...fixture,privateP052PercentPractice:{...fixture.privateP052PercentPractice,sourceSwfSha256:'0'.repeat(64)}},
  {...fixture,privateP052PercentPractice:{...fixture.privateP052PercentPractice,audio:{}}},
  {...fixture,runtime:{...fixture.runtime,frameDomains:[...fixture.runtime!.frameDomains!,{id:'root',frameCount:10}]}},
  {...fixture,textPresentation:undefined}])assert.equal(isP052RuntimeModule(value),false);
});
test('host narration reports actual cue activity, not merely an unpaused visual timeline',async()=>{
 let now=0,ended=()=>{},notifications=0;
 const session={play:async(_cue:unknown,callback:()=>void)=>{ended=callback;return true;},pause(){},resume:async()=>true,cancel(){},close:async()=>{},setVolume(_v:number){}};
 const c=new P052Controller({narration:session,click:{...session},now:()=>now,changed:()=>{notifications++;}});
 const host=()=>p052HostPlaybackState(c.snapshot());assert.equal(host().narration,'idle');
 await c.start();assert.equal(host().narration,'playing');
 const before=notifications;c.setNarration(false);assert.ok(notifications>before);assert.equal(host().narration,'idle');
 c.setNarration(true);assert.equal(host().narration,'playing');
 ended();assert.equal(host().narration,'idle');assert.equal(c.snapshot().state.phase,'intro');
 now=10;c.tick();assert.equal(c.snapshot().state.phase,'practice');assert.equal(host().narration,'idle');
 assert.equal(host().frameDomain,'sprite-350');assert.equal(host().frameCount,156);assert.equal(host().seekAvailable,false);
 await c.close();assert.equal(host().narration,'unavailable');assert.equal(host().playbackProgress,null);
});
test('loading and failed source audio cannot report ready playhead progress',async()=>{
 let fail!:(error:Error)=>void;
 const session={play:async()=>new Promise<boolean>((_r,reject)=>{fail=reject;}),pause(){},resume:async()=>true,cancel(){},close:async()=>{},setVolume(_v:number){}};
 const c=new P052Controller({narration:session,click:session,now:()=>0,changed:()=>{}});
 const pending=c.start();assert.equal(p052HostPlaybackState(c.snapshot()).playbackProgress,null);
 fail(Error('missing source'));await pending;assert.equal(p052HostPlaybackState(c.snapshot()).audioAvailable,false);
});
