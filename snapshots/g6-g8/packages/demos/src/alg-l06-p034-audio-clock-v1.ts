import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';

/** Maintained engineering reducer: no AudioContext, timers, or transport calls.
 * Source-declared sample boundaries are observations, never decoder seeks. */
export const P034_SOURCE={
 swfSha256:'32ddbfde743b785610360f38b7030ab2dbd289438f6c4433e6699ce3004a629a',
 mainSha256:'9f75303ceb0bd281d47f92583f1c40aa34b4974695a0c019199682b507131e2d',
 spanishSha256:'2bebaa57aee0e80591e80cd542dc98f51839593820c9ec16d6a720dbfd9dab30',
 mainPcmSha256:'337c5ff5833df48a5234844c1e1ada31a72514229d6524c47eec3f0bbba59e3b',
 spanishPcmSha256:'dea44bb9bbc761714b74a6b90f402bc5dcba6aa8b334898e36fe67e6a5c84b61',
 ledgerSha256:'0282f01ddad554f0b1d14e3eb1a9a7d8a2b3ceec91c5644aceddc9692da977b6',
 sourcePlanSha256:'85e8310dda320985e6b153364a854d73be70502db0f5861695121dc6c9af5eb9',
 stopActionSha256:'27e72a1e0a0ec105a01676d2b1677576d0aa968405a1fd744c56f52d016ab07d',
 decodeReceiptSha256:'e938383da2d84012a0f87da418485a5b0d70c1badf705687ba74254b2cbfaeb2',
} as const;

export interface P034FrameLedgerRow{
 readonly frame:number;readonly visualTickStart:number;readonly visualTickEnd:number;
 readonly blockPresent:boolean;readonly samples:number;readonly seek:number|null;
 readonly rawBytes:number;readonly mp3Bytes:number;readonly mp3Offset:number|null;
 readonly declaredSampleStart:number;readonly declaredSampleEnd:number;
}
export interface P034FrameLedger{
 readonly frameDomain:string;readonly fps:number;readonly sourceSampleRate:number;
 readonly latencySeekSamples:number;readonly sourceVisualFrames:number;
 readonly blockCount:number;readonly declaredSamples:number;
 readonly sourceSwf:Readonly<{sha256:string}>;
 readonly frames:readonly P034FrameLedgerRow[];
}
export interface P034DecodeRow{
 readonly id:string;readonly sourceSha256:string;readonly sourceBytes:number;
 readonly sampleRate:number;readonly channels:number;readonly samples:number;
 readonly pcmSha256:string;
}
export interface P034DecodeReceipt{readonly kind:string;readonly results:readonly P034DecodeRow[]}
export interface P034StopAction{readonly path:string;readonly bytes:number;
 readonly sha256:string;readonly text:string}
export interface P034PiecewisePlan{
 readonly frames:readonly Readonly<P034FrameLedgerRow>[];
 readonly mainBinding:DecodedSourceStreamBinding;
 readonly spanishBinding:DecodedSourceStreamBinding;
 readonly frameDomain:'sprite-40';readonly fps:12;readonly sourceStopFrame:433;
 readonly finalEncodedFrame:434;readonly gapFrames:readonly [198,226];
 readonly gapDeclaredSampleBoundary:359424;
 readonly negativeSeek:{readonly frame:197;readonly seek:-2300;readonly runtimeEffect:'unresolved'};
 readonly sourceFrameToBrowserSampleAlignmentAccepted:false;
 readonly originalRuntimeAccepted:false;
}

const exact=(actual:unknown,expected:unknown,label:string)=>{
 if(actual!==expected)throw Error(`P034_${label}_DRIFT`);
};
const binding=(row:P034DecodeRow):DecodedSourceStreamBinding=>Object.freeze({
 sourceSha256:row.sourceSha256,sourceBytes:row.sourceBytes,
 sampleRate:row.sampleRate,channels:row.channels as 1,
 decodedSamples:row.samples,pcmSha256:row.pcmSha256,
});

/** Validate exact physical block semantics and measured decode identity.
 * Equal sample counts do not establish per-frame decoded PCM alignment. */
export function p034PiecewisePlan(ledger:P034FrameLedger,decode:P034DecodeReceipt,
 stopAction:P034StopAction):P034PiecewisePlan{
 exact(stopAction.path,'source-export/scripts/DefineSprite_40/frame_433/DoAction.as','STOP_PATH');
 exact(stopAction.bytes,38,'STOP_BYTES');
 exact(stopAction.sha256,P034_SOURCE.stopActionSha256,'STOP_SHA');
 exact(stopAction.text,'stop();\n_global.quizSection = true;\n','STOP_TEXT');
 exact(ledger.sourceSwf.sha256,P034_SOURCE.swfSha256,'SWF');
 exact(ledger.frameDomain,'sprite-40','FRAME_DOMAIN');exact(ledger.fps,12,'FPS');
 exact(ledger.sourceSampleRate,22050,'RATE');
 exact(ledger.latencySeekSamples,1673,'HEADER_LATENCY');
 exact(ledger.sourceVisualFrames,434,'VISUAL_FRAMES');
 exact(ledger.blockCount,405,'BLOCK_COUNT');exact(ledger.declaredSamples,741312,'SAMPLES');
 exact(ledger.frames.length,434,'LEDGER_LENGTH');
 let samples=0,offset=0,blocks=0;
 const frames=ledger.frames.map((source,index)=>{
  const f=index+1,active=f<=197||f>=227,zero=f===2||f===197;
  exact(source.frame,f,'FRAME_ORDER');exact(source.visualTickStart,f-1,'TICK_START');
  exact(source.visualTickEnd,f,'TICK_END');
  exact(source.blockPresent,active,'BLOCK_SPAN');
  exact(source.declaredSampleStart,samples,'SAMPLE_START');
  exact(source.declaredSampleEnd,samples+source.samples,'SAMPLE_END');
  if(active){
   blocks++;
   exact(source.mp3Offset,offset,'MP3_OFFSET');
   if(zero){exact(source.samples,0,'ZERO_SAMPLE');exact(source.mp3Bytes,0,'ZERO_PAYLOAD');
    exact(source.rawBytes,4,'ZERO_RAW_BYTES');
   }else if(!(source.samples>0&&source.mp3Bytes>0&&source.rawBytes===source.mp3Bytes+4))
    throw Error('P034_SAMPLE_BLOCK_DRIFT');
   if(f===197)exact(source.seek,-2300,'NEGATIVE_SEEK');
   else if(typeof source.seek!=='number'||source.seek<0)throw Error('P034_OTHER_SEEK_DRIFT');
   offset+=source.mp3Bytes;
  }else{
   exact(source.samples,0,'GAP_SAMPLES');exact(source.seek,null,'GAP_SEEK');
   exact(source.rawBytes,0,'GAP_RAW');exact(source.mp3Bytes,0,'GAP_MP3');
   exact(source.mp3Offset,null,'GAP_OFFSET');
  }
  samples=source.declaredSampleEnd;
  return Object.freeze({...source});
 });
 exact(blocks,405,'BLOCK_COUNT');exact(offset,167310,'MP3_BYTES');
 exact(samples,741312,'FINAL_SAMPLE');
 exact(frames[196]?.declaredSampleStart,359424,'MARKER_SAMPLE');
 exact(frames[225]?.declaredSampleEnd,359424,'GAP_SAMPLE');
 exact(frames[226]?.declaredSampleStart,359424,'RESUME_SAMPLE');
 exact(decode.kind,'p034-browser-native-decode-only','DECODE_KIND');
 exact(decode.results.length,2,'DECODE_COUNT');
 const main=decode.results.find(row=>row.id==='sprite-40');
 const spanish=decode.results.find(row=>row.id==='separate-sa');
 if(!main||!spanish)throw Error('P034_DECODE_DOMAIN_MISSING');
 for(const [row,hash,bytes,rate,count,pcm] of [
  [main,P034_SOURCE.mainSha256,167310,22050,741312,P034_SOURCE.mainPcmSha256],
  [spanish,P034_SOURCE.spanishSha256,438816,48000,1504512,P034_SOURCE.spanishPcmSha256],
 ] as const){
  exact(row.sourceSha256,hash,'SOURCE_HASH');exact(row.sourceBytes,bytes,'SOURCE_BYTES');
  exact(row.sampleRate,rate,'DECODE_RATE');exact(row.channels,1,'DECODE_CHANNELS');
  exact(row.samples,count,'DECODE_SAMPLES');exact(row.pcmSha256,pcm,'PCM_HASH');
 }
 return Object.freeze({frames:Object.freeze(frames),mainBinding:binding(main),
  spanishBinding:binding(spanish),frameDomain:'sprite-40',fps:12,
  sourceStopFrame:433,finalEncodedFrame:434,
  gapFrames:Object.freeze([198,226] as const),gapDeclaredSampleBoundary:359424,
  negativeSeek:Object.freeze({frame:197,seek:-2300,runtimeEffect:'unresolved' as const}),
  sourceFrameToBrowserSampleAlignmentAccepted:false,originalRuntimeAccepted:false});
}

export type P034ClockPhase='held'|'playing'|'paused'|'source-stop-held'|'closed';
export interface P034ClockState{
 readonly phase:P034ClockPhase;readonly frame:number;readonly epoch:number;
 readonly mainEpoch:number;readonly spanishEpoch:number;
 readonly selectedAudio:'main'|'spanish';
 readonly mainPlayRequested:boolean;readonly spanishPlayRequested:boolean;
 readonly mainNativeEofPending:boolean;readonly mainNativeEofObserved:boolean;
 readonly spanishNativeEofObserved:boolean;
 readonly lessonCompleted:false;
 readonly sourceAlignment:'candidate-unverified';
}
export type P034ClockEvent=
 |{readonly type:'play-main-user'}|{readonly type:'visual-tick'}|{readonly type:'pause'}
 |{readonly type:'replay'}|{readonly type:'start-spanish-user'}|{readonly type:'return-main'}
 |{readonly type:'main-native-eof-pending';readonly mainEpoch:number}
 |{readonly type:'main-native-onended';readonly mainEpoch:number}
 |{readonly type:'spanish-native-onended';readonly spanishEpoch:number}
 |{readonly type:'close'};
export type P034ClockEffect=
 |{readonly kind:'commit-frame';readonly frame:number}
 |{readonly kind:'request-main-start';readonly sourceFrame:number;readonly decoderSeek:'not-requested'}
 |{readonly kind:'request-main-pause'|'request-main-replay'|'request-spanish-start'|'request-spanish-stop'}
 |{readonly kind:'source-stop-held';readonly frame:433};
export interface P034Transition{readonly state:P034ClockState;
 readonly accepted:boolean;readonly reason:string;readonly effects:readonly P034ClockEffect[]}
const done=(state:P034ClockState,accepted:boolean,reason:string,
 effects:readonly P034ClockEffect[]=[]):P034Transition=>Object.freeze({state:Object.freeze(state),
 accepted,reason,effects:Object.freeze(effects)});

export function p034InitialClockState():P034ClockState{return Object.freeze({
 phase:'held',frame:1,epoch:0,mainEpoch:0,spanishEpoch:0,selectedAudio:'main',
 mainPlayRequested:false,spanishPlayRequested:false,mainNativeEofPending:false,
 mainNativeEofObserved:false,spanishNativeEofObserved:false,
 lessonCompleted:false,sourceAlignment:'candidate-unverified',
});}

/** A visual tick is supplied by a future host. No AudioContext or native EOF is
 * inferred from ticks, declared samples, elapsed wall time, or buffer length. */
export function p034ReduceClock(plan:P034PiecewisePlan,state:P034ClockState,
 event:P034ClockEvent):P034Transition{
 if(state.phase==='closed')return done(state,false,'closed');
 switch(event.type){
  case 'play-main-user':{
   if(state.selectedAudio!=='main'||!['held','paused'].includes(state.phase)||
    (state.frame>=plan.sourceStopFrame&&state.mainNativeEofObserved)||
    state.mainNativeEofPending)
    return done(state,false,'main-play-unavailable');
   const startsMain=!state.mainNativeEofObserved;
   return done({...state,phase:'playing',mainPlayRequested:startsMain,
    mainEpoch:startsMain?state.mainEpoch+1:state.mainEpoch},
    true,startsMain?'main-start-requested':'visual-tail-only',
    startsMain?[{kind:'request-main-start',sourceFrame:state.frame,
     decoderSeek:'not-requested'}]:[]);
  }
  case 'visual-tick':{
   if(state.phase!=='playing'||state.selectedAudio!=='main')
    return done(state,false,'visual-not-playing');
   if(state.frame>=plan.sourceStopFrame)return done(state,false,'source-stop-held');
   const next=state.frame+1,row=plan.frames[next-1];
   if(!row||row.frame!==next)throw Error('P034_LEDGER_DRIFT');
   const effects:P034ClockEffect[]=[{kind:'commit-frame',frame:next}];
   const stopped=next===plan.sourceStopFrame;
   if(stopped)effects.push({kind:'source-stop-held',frame:433});
   return done({...state,frame:next,phase:stopped?'source-stop-held':'playing',
    mainPlayRequested:state.mainPlayRequested,mainEpoch:state.mainEpoch},true,
    stopped?'authored-stop-held':'visual-advanced',effects);
  }
  case 'pause':{
   if(state.selectedAudio==='spanish'){
    if(!state.spanishPlayRequested)return done(state,false,'spanish-not-playing');
    return done({...state,spanishPlayRequested:false,spanishEpoch:state.spanishEpoch+1},
     true,'spanish-held',[{kind:'request-spanish-stop'}]);
   }
   if(!['playing','source-stop-held'].includes(state.phase))return done(state,false,'main-not-playing');
   const preserve=state.mainNativeEofPending&&state.mainPlayRequested;
   return done({...state,phase:'paused',mainPlayRequested:preserve,
    mainEpoch:preserve?state.mainEpoch:state.mainEpoch+1},
    true,preserve?'visual-held-awaiting-native-eof':'main-held',
    state.mainPlayRequested&&!preserve?[{kind:'request-main-pause'}]:[]);
  }
  case 'main-native-eof-pending':{
   if(event.mainEpoch!==state.mainEpoch||state.selectedAudio!=='main'||
    !state.mainPlayRequested||state.mainNativeEofObserved)
    return done(state,false,'stale-or-unowned-main');
   return done({...state,mainNativeEofPending:true},true,'awaiting-native-main-onended');
  }
  case 'main-native-onended':{
   if(event.mainEpoch!==state.mainEpoch||state.selectedAudio!=='main'||
    (!state.mainPlayRequested&&!state.mainNativeEofPending))
    return done(state,false,'stale-or-unowned-main');
   return done({...state,mainNativeEofPending:false,mainNativeEofObserved:true,
    mainPlayRequested:false},true,'native-main-eof-recorded');
  }
  case 'start-spanish-user':{
   if(state.selectedAudio!=='main'||state.mainNativeEofPending)
    return done(state,false,'main-native-eof-pending-or-spanish-selected');
   const effects:P034ClockEffect[]=[];
   if(state.mainPlayRequested)effects.push({kind:'request-main-pause'});
   effects.push({kind:'request-spanish-start'});
   return done({...state,phase:'paused',selectedAudio:'spanish',mainEpoch:state.mainEpoch+1,
    spanishEpoch:state.spanishEpoch+1,mainPlayRequested:false,spanishPlayRequested:true,
    spanishNativeEofObserved:false},true,'explicit-spanish-owner',effects);
  }
  case 'spanish-native-onended':{
   if(state.selectedAudio!=='spanish'||!state.spanishPlayRequested||
    event.spanishEpoch!==state.spanishEpoch)
    return done(state,false,'stale-or-unowned-spanish');
   return done({...state,spanishPlayRequested:false,spanishNativeEofObserved:true},
    true,'native-spanish-eof-recorded');
  }
  case 'return-main':{
   if(state.selectedAudio!=='spanish')return done(state,false,'spanish-not-selected');
   return done({...state,selectedAudio:'main',spanishEpoch:state.spanishEpoch+1,
    spanishPlayRequested:false,phase:'paused'},true,'main-owner-held',
    state.spanishPlayRequested?[{kind:'request-spanish-stop'}]:[]);
  }
  case 'replay':{
   const effects:P034ClockEffect[]=[];
   if(state.mainPlayRequested)effects.push({kind:'request-main-pause'});
   if(state.spanishPlayRequested)effects.push({kind:'request-spanish-stop'});
   effects.push({kind:'request-main-replay'},{kind:'commit-frame',frame:1});
   return done({...p034InitialClockState(),epoch:state.epoch+1,
    mainEpoch:state.mainEpoch+1,spanishEpoch:state.spanishEpoch+1},
    true,'replayed-held-no-autostart',effects);
  }
  case 'close':{
   const effects:P034ClockEffect[]=[];
   if(state.mainPlayRequested)effects.push({kind:'request-main-pause'});
   if(state.spanishPlayRequested)effects.push({kind:'request-spanish-stop'});
   return done({...state,phase:'closed',epoch:state.epoch+1,
    mainEpoch:state.mainEpoch+1,spanishEpoch:state.spanishEpoch+1,
    mainPlayRequested:false,spanishPlayRequested:false,mainNativeEofPending:false},
    true,'closed',effects);
  }
 }
 throw Error('P034_UNKNOWN_EVENT');
}
