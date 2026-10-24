import {DecodedSourceStreamTransport,type DecodedSourceStreamBinding} from './decoded-source-stream-transport';
import {createMemoryOnlyLessonHost} from './lesson-host-contract';
import {P050_SOURCE as S} from './alg-l08-p050-source-v1';
import {initialP050Quiz,answerP050Question,enterP050Review,advanceP050ReviewIntro,nextP050Review,requestP050Exit,p050ElapsedText,type P050Option} from './alg-l08-p050-quiz-state-v1';
export type P050AudioId=`${'EA'|'SA'}/Q${number}${''|'A'|'B'|'C'|'D'}`;
export type P050Owner=Readonly<{epoch:number;questionId:number}>;
export type P050Audio=Pick<DecodedSourceStreamTransport,'snapshot'|'prepare'|'play'|'pause'|'replay'|'setVolume'|'close'|'subscribe'>;
export interface P050AudioPolicy {question:boolean;questionSpanish:boolean;answers:boolean;answersSpanish:boolean;}
export const P050_LOCAL_AUDIO_POLICY:P050AudioPolicy={question:true,questionSpanish:true,answers:true,answersSpanish:true};
export interface P050SessionOptions {seed:number;audioPolicy:P050AudioPolicy;load:(id:P050AudioId,signal:AbortSignal)=>Promise<ArrayBuffer>;changed:()=>void;now?:()=>number;makeAudio?:(binding:DecodedSourceStreamBinding)=>P050Audio;}
/** Exact reviewed source reducer, plus explicit modern clock/audio/ephemeral-score adapters.
 * No persistence, reporting, legacy host calls, assessment posting or completion event. */
export class P050Session {
 private rng:number;private state;private epoch=1;private serial=0;private paused=false;private closed=false;private resetting=false;private failure:string|null=null;private volume=.8;
 private active:{id:P050AudioId;audio:P050Audio;unsubscribe:()=>void}|null=null;private preparing:P050Audio|null=null;private pendingId:P050AudioId|null=null;private abort:AbortController|null=null;
 private closingOwners=new WeakMap<P050Audio,Promise<void>>();private retiring=new Set<Promise<void>>();private closing?:Promise<void>;
 private timerHeld=0;private timerAnchor:number|null;private introPosition=28;private introAnchor:number|null=null;
 private readonly host=createMemoryOnlyLessonHost({releaseId:'p050-local-product',releaseMemberIds:[S.animationId],currentAnimationId:S.animationId,enabledCapabilities:['fq-scoring'],mode:'audit'});
 constructor(private readonly options:P050SessionOptions){if(!Number.isSafeInteger(options.seed))throw Error('P050 invalid seed');for(const k of ['question','questionSpanish','answers','answersSpanish']as const)if(typeof options.audioPolicy[k]!=='boolean')throw Error('P050 explicit audio policy required');this.rng=options.seed>>>0;this.state=initialP050Quiz(this.index(24));this.timerAnchor=this.now();}
 private index(length:number){this.rng=(Math.imul(this.rng,1664525)+1013904223)>>>0;return Math.floor(this.rng/4294967296*length);}
 private now(){return this.options.now?.()??performance.now();}
 private emit(){if(!this.closed)this.options.changed();}
 private ownerMatches(o:P050Owner){return !this.closed&&!this.resetting&&o.epoch===this.epoch&&o.questionId===this.state.currentQuestionId;}
 private retire(audio:P050Audio){const prior=this.closingOwners.get(audio);if(prior)return prior;const p=Promise.resolve().then(()=>audio.close());this.closingOwners.set(audio,p);this.retiring.add(p);void p.then(()=>{this.retiring.delete(p);},()=>{});return p;}
 private stopAudio(){this.serial++;this.abort?.abort();this.abort=null;this.pendingId=null;if(this.preparing){this.retire(this.preparing);this.preparing=null;}if(this.active){this.active.unsubscribe();this.retire(this.active.audio);this.active=null;}}
 private elapsed(){return this.timerHeld+(this.timerAnchor===null?0:Math.max(0,this.now()-this.timerAnchor));}
 private holdClock(){this.timerHeld=this.elapsed();this.timerAnchor=null;if(this.introAnchor!==null){this.introPosition+=Math.max(0,this.now()-this.introAnchor)*12/1000;this.introAnchor=null;}}
 snapshot(){const a=this.active?.audio.snapshot();return{state:this.state,owner:{epoch:this.epoch,questionId:this.state.currentQuestionId},paused:this.paused,closed:this.closed,resetting:this.resetting,loading:this.pendingId!==null,activeAudioId:a?.phase==='buffer-ended'?null:this.active?.id??null,pendingAudioId:this.pendingId,audioPhase:a?.phase??'idle',decodedSample:a?.decodedSample??0,failure:this.failure,elapsedText:p050ElapsedText(this.elapsed()),introPosition:this.introPosition,score:this.host.snapshot().fqScore,storage:'memory-only' as const,lessonCompleted:false as const};}
 canAudio(owner:P050Owner,language:'en'|'es',target:0|P050Option){if(!this.ownerMatches(owner)||this.state.phase!=='question'||!['en','es'].includes(language)||![0,1,2,3,4].includes(target))return false;const p=this.options.audioPolicy;if(target===0?(!p.question||language==='es'&&!p.questionSpanish):(!p.answers||language==='es'&&!p.answersSpanish))return false;return S.questions[this.state.currentQuestionId-1]!.question.audioTargets.includes(target);}
 async audio(owner:P050Owner,language:'en'|'es',target:0|P050Option){if(!this.canAudio(owner,language,target))return false;const id=`${language==='es'?'SA':'EA'}/Q${owner.questionId}${target?'ABCD'[target-1]:''}`as P050AudioId;
  if(this.pendingId===id||this.active?.id===id&&this.active.audio.snapshot().phase!=='buffer-ended'){this.stopAudio();this.emit();return true;}
  this.stopAudio();this.failure=null;const serial=this.serial,abort=new AbortController();this.abort=abort;this.pendingId=id;this.paused=false;if(this.timerAnchor===null)this.timerAnchor=this.now();this.emit();
  let audio:P050Audio|undefined;const current=()=>this.ownerMatches(owner)&&serial===this.serial&&!abort.signal.aborted&&this.state.phase==='question';
  const retainsActiveOwner=()=>audio!==undefined&&this.active?.audio===audio&&this.ownerMatches(owner)&&this.state.phase==='question';
  try{await Promise.all([...this.retiring]);if(!current())return false;const bytes=await this.options.load(id,abort.signal);if(!current())return false;audio=this.options.makeAudio?.(S.audio[id]!)??new DecodedSourceStreamTransport(S.audio[id]!);this.preparing=audio;audio.setVolume(this.volume);const ready=await audio.prepare(bytes);if(this.preparing===audio)this.preparing=null;if(!current()){this.retire(audio);return false;}if(!ready.accepted)throw Error(ready.reason);
   const held=audio;this.active={id,audio,unsubscribe:audio.subscribe(()=>{if(this.active?.audio===held)this.emit();})};const played=await audio.play({activation:'user',reducedMotion:false});if(!current()){if(!retainsActiveOwner())this.retire(audio);return false;}if(!played.accepted)throw Error(played.reason);this.pendingId=null;this.abort=null;this.emit();return true;
  }catch(e){
   // Pause can cancel a command while the same transport belongs to the paused or resumed question.
   if(!current()&&retainsActiveOwner())return false;
   if(audio){if(this.preparing===audio)this.preparing=null;if(this.active?.audio===audio){this.active.unsubscribe();this.active=null;}this.retire(audio);}if(!current())return false;this.pendingId=null;this.abort=null;this.failure=e instanceof Error?e.message:String(e);this.emit();return false;}
 }
 answer(owner:P050Owner,option:P050Option){if(!this.ownerMatches(owner)||this.state.phase!=='question'||![1,2,3,4].includes(option))return false;const next=answerP050Question(this.state,owner.questionId,option,this.state.responses.length===9?undefined:this.index(this.state.remainingQuestionIds.length));const response=next.responses[next.responses.length-1]!;const decision=this.host.dispatch({type:'record-fq-score',questionId:`${S.animationId}:Q${owner.questionId}`,correct:response.correct,pointsAwarded:response.correct?1:0,pointsPossible:1});if(decision.status!=='allowed')throw Error('P050 local score rejected: '+decision.reason);this.stopAudio();this.epoch++;this.state=next;this.failure=null;this.emit();return true;}
 review(owner:P050Owner){if(!this.ownerMatches(owner)||this.state.phase!=='finish')return false;this.stopAudio();this.epoch++;this.state=enterP050Review(this.state);this.introPosition=28;this.introAnchor=this.paused?null:this.now();this.emit();return true;}
 tick(){if(this.closed||this.paused||this.resetting)return;if(this.state.phase==='review-intro'&&this.introAnchor!==null){const frame=Math.min(44,Math.floor(this.introPosition+Math.max(0,this.now()-this.introAnchor)*12/1000+1e-8));if(frame>this.state.mainFrame)this.state=advanceP050ReviewIntro(this.state,frame);if(frame===44){this.introPosition=44;this.introAnchor=null;}}this.emit();}
 nextReview(owner:P050Owner){if(!this.ownerMatches(owner)||!((this.state.phase==='review-intro'&&this.state.mainFrame===44)||this.state.phase==='review'))return false;this.stopAudio();this.epoch++;this.state=nextP050Review(this.state);if(this.state.phase==='exit-requested')this.holdClock();this.emit();return true;}
 exit(owner:P050Owner){if(!this.ownerMatches(owner)||!(this.state.phase==='finish'||this.state.phase==='review'&&this.state.reviewOrdinal===10))return false;this.stopAudio();this.holdClock();this.epoch++;this.state=requestP050Exit(this.state);this.emit();return true;}
 pause(){if(this.closed)return;this.tick();this.holdClock();this.paused=true;this.serial++;this.abort?.abort();this.abort=null;this.pendingId=null;if(this.preparing){this.retire(this.preparing);this.preparing=null;}this.active?.audio.pause();this.emit();}
 async play(){if(this.closed||this.resetting||this.state.phase==='exit-requested')return false;this.paused=false;if(this.timerAnchor===null)this.timerAnchor=this.now();if(this.state.phase==='review-intro'&&this.state.mainFrame<44&&this.introAnchor===null)this.introAnchor=this.now();const active=this.active,serial=this.serial;if(active&&['paused','interrupted','play-rejected'].includes(active.audio.snapshot().phase)){const r=await active.audio.play({activation:'user',reducedMotion:false});if(this.closed||serial!==this.serial||this.active!==active)return false;if(!r.accepted){this.failure=r.reason;this.emit();return false;}}this.emit();return true;}
 setVolume(value:number){if(!Number.isFinite(value)||this.closed)return;this.volume=Math.max(0,Math.min(1,value));this.active?.audio.setVolume(this.volume);this.preparing?.setVolume(this.volume);}
 async replay(){
  if(this.closed||this.resetting)return false;
  this.stopAudio();this.holdClock();const serial=this.serial,epoch=++this.epoch;
  this.resetting=true;this.failure=null;this.emit();
  try{
   await Promise.all([...this.retiring]);
   if(this.closed||serial!==this.serial||epoch!==this.epoch)return false;
   this.rng=this.options.seed>>>0;this.state=initialP050Quiz(this.index(24));this.host.reset();
   this.timerHeld=0;this.timerAnchor=this.now();this.introPosition=28;this.introAnchor=null;
   this.paused=false;this.resetting=false;this.emit();return true;
  }catch(e){
   if(!this.closed&&epoch===this.epoch){this.paused=true;this.failure=e instanceof Error?e.message:String(e);}
   throw e;
  }finally{
   // Pause may cancel this Replay while retirement is pending. Release only its own reset.
   if(!this.closed&&epoch===this.epoch&&this.resetting){this.resetting=false;this.emit();}
  }
 }
 close(){if(this.closing)return this.closing;this.stopAudio();this.holdClock();this.closed=true;this.epoch++;this.closing=Promise.all([...this.retiring]).then(()=>undefined);return this.closing;}
}
