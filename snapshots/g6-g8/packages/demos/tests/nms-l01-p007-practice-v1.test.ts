import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {createP007Interaction,reduceP007Interaction,p007TargetAtPoint,type P007Card} from '../src/nms-l01-p007-interaction-v1';
import {P007SourceClockV1,type P007AudioPlan} from '../src/nms-l01-p007-source-clock-v1';
const cards=[-5,0,5,8].map((value,i)=>({id:(['Scr_1','Scr_2','Scr_3','Scr_4'] as const)[i],targetId:(['Mc_Tar_1','Mc_Tar_2','Mc_Tar_3','Mc_Tar_4'] as const)[i],value,label:String(value),sourceCharacterId:84-i,targetCharacterId:[79,77,80,78][i],sourceDepth:87-i*3,targetDepth:[71,65,75,68][i],accessibleLabels:{en:String(value),es:String(value)},originTwips:{x:[-1386,34,1454,2914][i],y:2055},targetTwips:{x:[-3029,111,3279,5051][i],y:i===3?-1056:-1058},sourceBounds:{x:300+i*70,y:368,width:31.5,height:35.1},targetBounds:{x:240+i*140,y:209,width:36,height:40},neighborValues:[value-1,value+1]})) as P007Card[];
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const raws=[Uint8Array.of(1,2,3),Uint8Array.of(4,5),Uint8Array.of(6)],pcms=[new Float32Array(391104),new Float32Array(27072),new Float32Array(34560)];
const plan:P007AudioPlan={version:1,animationId:'shared-nms002-l01-p007',sourceSwfSha256:'d6af65fff8de6958b8125fb45516df0f70ebc71c8e60ff8cd31efe138f27365c',fps:12,mainFrameCount:220,questionFrame:178,mainAudioFirstFrame:8,rightFeedbackDomain:'sprite-119',rightFeedbackFirstFrame:2,rightFeedbackLastFrame:25,sourceAlignment:'unaccepted-test-native-clock',clips:['sprite-120','sprite-111','sprite-113'].map((frameDomain,i)=>({frameDomain,frameCount:[220,15,20][i],rawAudioFirstFrame:[8,1,2][i],visualEntryFrame:i?2:1,latencySamples:1673,decoder:{sourceBytes:raws[i].length,sourceSha256:hash(raws[i]),sampleRate:22050,channels:1,decodedSamples:pcms[i].length,pcmSha256:hash(new Uint8Array(pcms[i].buffer))}}))};
const payloads=()=>new Map(plan.clips.map((c,i)=>[c.frameDomain,raws[i].slice().buffer]));
const user={activation:'user' as const,reducedMotion:false};
class Context extends EventTarget {
 currentTime=0;state='suspended';sampleRate=22050;destination={};resumeWait?:Promise<void>;nodes:{buffer:unknown;onended:null|(()=>void);starts:number[][];stops:number;disconnected:boolean;connect():void;disconnect():void;start(...args:number[]):void;stop():void}[]=[];
 createGain(){return{gain:{setValueAtTime(){}},connect(){},disconnect(){}};}
 createBufferSource(){const n={buffer:null,onended:null,starts:[] as number[][],stops:0,disconnected:false,connect(){},disconnect(){this.disconnected=true;},start(...args:number[]){this.starts.push(args);},stop(){this.stops++;}};this.nodes.push(n);return n;}
 async decodeAudioData(b:ArrayBuffer){const i=raws.findIndex(r=>r[0]===new Uint8Array(b)[0]),pcm=pcms[i];return{sampleRate:22050,numberOfChannels:1,length:pcm.length,getChannelData:()=>pcm};}
 async resume(){if(this.resumeWait)await this.resumeWait;this.state='running';}
 async close(){this.state='closed';}
}
const near=(a:number,b:number)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
async function fixture(){const context=new Context(),clock=new P007SourceClockV1(plan,cards,{createContext:()=>context as unknown as AudioContext,commitPicture:()=>true});assert.equal(clock.snapshot().picture.mainFrame,1);assert.equal(clock.snapshot().sourceQuizActive,false);assert((await clock.prepare(payloads())).accepted);return{context,clock};}
function permutations<T>(items:T[]):T[][]{return items.length?items.flatMap((v,i)=>permutations(items.filter((_,j)=>i!==j)).map(p=>[v,...p])):[[]];}
test('all24 orders lock only matching values once and Replay restores all origins',()=>{
 for(const order of permutations(cards)){
  let s=createP007Interaction(cards);for(const c of order){s=reduceP007Interaction(cards,s,{type:'select',cardId:c.id});s=reduceP007Interaction(cards,s,{type:'drop',targetId:c.targetId});assert.equal(s.result,'correct');assert(s.locked.includes(c.id));assert.equal(reduceP007Interaction(cards,s,{type:'select',cardId:c.id}),s);assert.equal(reduceP007Interaction(cards,s,{type:'drop',targetId:c.targetId}),s);}
  assert.equal(s.attempts,4);assert.equal(s.locked.length,4);const replay=reduceP007Interaction(cards,s,{type:'replay'});assert.equal(replay.epoch,1);assert.equal(replay.locked.length,0);for(const c of cards)assert.deepEqual(replay.positions[c.id],c.originTwips);
 }
});
test('wrong target/outside/cancel restore the card with no retry-limit auto-fill',()=>{
 let s=createP007Interaction(cards);for(let i=0;i<8;i++){s=reduceP007Interaction(cards,s,{type:'select',cardId:'Scr_1'});s=reduceP007Interaction(cards,s,{type:'move',point:{x:1800,y:2500}});s=reduceP007Interaction(cards,s,{type:'drop',targetId:i%2?'Mc_Tar_2':null});assert.equal(s.result,'wrong');assert.equal(s.locked.length,0);assert.deepEqual(s.positions.Scr_1,cards[0].originTwips);}
 s=reduceP007Interaction(cards,s,{type:'select',cardId:'Scr_3'});s=reduceP007Interaction(cards,s,{type:'cancel'});assert.equal(s.attempts,8);assert.equal(s.result,'none');assert.equal(s.selected,null);
 for(const c of cards)assert.equal(p007TargetAtPoint(cards,{x:c.targetBounds.x+1,y:c.targetBounds.y+1}),c.targetId);assert.equal(p007TargetAtPoint(cards,{x:0,y:0}),null);
});
test('intro starts after7 sourceframes and stops exactly at the exercise178',async()=>{
 const{clock,context}=await fixture();await clock.play(user);near(context.nodes[0].starts[0][0],7/12);near(context.nodes[0].starts[0][1],1673/22050);near(context.nodes[0].starts[0][2],170/12);
 context.currentTime=14.749;assert.equal(clock.snapshot().picture.mainFrame,177);assert.equal(clock.snapshot().sourceQuizActive,false);context.currentTime=14.75;assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().picture.mainFrame,178);assert.equal(clock.snapshot().sourceQuizActive,true);assert.equal(clock.snapshot().audioNodePlaying,false);await clock.close();
});
test('wrong SFX plays through its measured end and stays modal until close',async()=>{
 const{clock,context}=await fixture();clock.inspect(178);clock.select('Scr_1');await clock.drop(null,user);assert.equal(clock.snapshot().picture.interaction.popup,'wrong');context.currentTime=13/12;assert.equal(clock.snapshot().picture.interaction.feedbackFrame,15);assert.equal(clock.snapshot().audioNodePlaying,true);context.currentTime=(27072-1673)/22050;assert.equal(clock.snapshot().phase,'wrong-wait');assert.equal(clock.select('Scr_2').accepted,false);assert(clock.closePopup().accepted);assert.equal(clock.snapshot().phase,'question');assert.equal(clock.snapshot().interaction.attempts,1);assert(clock.openHelp().accepted);assert.equal(clock.snapshot().picture.interaction.popup,'help');assert(clock.closePopup().accepted);await clock.close();
});
test('fourth drop schedules feedback and future narration in one native chain before any tick',async()=>{
 const{clock,context}=await fixture();clock.inspect(178);
 for(const c of cards.slice(0,3)){clock.select(c.id);await clock.drop(c.targetId,user);context.currentTime+=1.5;assert.equal(clock.snapshot().phase,'question');}
 clock.select('Scr_4');const before=context.nodes.length,t0=context.currentTime;await clock.drop('Mc_Tar_4',user);
 assert.equal(context.nodes.length,before+2);const[correct,outro]=context.nodes.slice(before);near(correct.starts[0][0],t0);near(outro.starts[0][0],t0+41/12);near(outro.starts[0][1],314048/22050);near(outro.starts[0][2],77056/22050);
 context.currentTime=t0+1.5;assert.equal(clock.snapshot().picture.interaction.rightFrame,2);context.currentTime=t0+40/12;assert.equal(clock.snapshot().picture.interaction.rightFrame,24);
 context.currentTime=t0+41/12;assert.equal(clock.snapshot().sourceQuizActive,false);assert.equal(clock.snapshot().picture.mainFrame,178);assert.equal(clock.snapshot().audioDomain,'sprite-120');
 context.currentTime=t0+83/12;assert.equal(clock.snapshot().phase,'ended');assert.equal(clock.snapshot().picture.mainFrame,220);assert.equal(clock.snapshot().correctDrops,4);assert.equal(clock.snapshot().lessonCompleted,false);await clock.close();
});
test('pause and Replay cancel the future narration and resume the exact remaining delay',async()=>{
 const{clock,context}=await fixture();clock.inspect(178);for(const c of cards.slice(0,3)){clock.select(c.id);await clock.drop(c.targetId,user);context.currentTime+=1.5;clock.tick();}clock.select('Scr_4');await clock.drop('Mc_Tar_4',user);context.currentTime+=2;clock.pause();assert(context.nodes.every(n=>n.stops===1));const count=context.nodes.length;context.currentTime=100;await clock.play(user);assert.equal(context.nodes.length,count+1);near(context.nodes.at(-1)!.starts[0][0],100+41/12-2);clock.replay();assert.equal(clock.snapshot().picture.mainFrame,1);assert.equal(clock.snapshot().correctDrops,0);assert.equal(clock.snapshot().inspectionMode,false);assert(context.nodes.every(n=>n.stops===1));await clock.close();
});
test('pending start is invalidated by pause, Replay or closing the page',async()=>{
 for(const action of ['pause','replay','close'] as const){const{clock,context}=await fixture();let release!:()=>void;context.resumeWait=new Promise(r=>release=r);const pending=clock.play(user);await clock[action]();release();assert.equal((await pending).accepted,false);assert.equal(context.nodes.length,0);await clock.close();}
});
test('untrusted bytes/PCM and failed Canvas commit close the audio context',async()=>{
 for(const mode of ['bytes','pcm','paint']){const context=new Context(),p=mode==='pcm'?{...plan,clips:plan.clips.map((c,i)=>i?c:{...c,decoder:{...c.decoder,pcmSha256:'0'.repeat(64)}})}:plan,clock=new P007SourceClockV1(p,cards,{createContext:()=>context as unknown as AudioContext,commitPicture:()=>mode!=='paint'});const b=payloads();if(mode==='bytes')b.set('sprite-120',Uint8Array.of(9).buffer);assert.equal((await clock.prepare(b)).accepted,false);assert.equal(clock.snapshot().phase,'failed');assert.equal(context.nodes.length,0);if(mode!=='bytes')assert.equal(context.state,'closed');await clock.close();}
 const{clock,context}=await fixture();assert.equal((await clock.play({activation:'automatic',reducedMotion:true})).accepted,false);assert.equal(context.nodes.length,0);assert.equal(clock.inspect(221).accepted,false);clock.inspect(220);assert.equal(clock.snapshot().correctDrops,0);assert.equal(clock.snapshot().inspectionMode,true);assert.equal(clock.snapshot().lessonCompleted,false);await clock.close();
});
