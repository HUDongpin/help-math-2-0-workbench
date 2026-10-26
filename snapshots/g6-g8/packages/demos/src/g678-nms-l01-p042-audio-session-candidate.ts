// PURE engineering building block, deliberately not an AnimationModule or an audio transport.
// There are no browser/runtime/host imports, audio nodes, URLs, timers or side effects.
import {G678_NMS_L01_P042_AUDIO_TIMING_IR as IR} from './generated/g678-nms-l01-p042-audio-timing-ir-v1';

function freezeSource(value:unknown):void {
  if(value&&typeof value==='object'&&!Object.isFrozen(value)) {for(const child of Object.values(value))freezeSource(child);Object.freeze(value);}
}
freezeSource(IR);

export {IR as G678_NMS_L01_P042_AUDIO_SESSION_IR};
export type P042DecoderProfileId = typeof IR.decoderProfiles[number]['id'];
export type P042AudioPhase = 'idle' | 'loading' | 'ready' | 'start-pending' | 'playing' | 'paused' |
  'load-failed' | 'play-rejected' | 'source-boundary-pending' | 'decoder-eof-pending' | 'closed';
export type P042AudioSession = Readonly<{
  version: 1; profileId: P042DecoderProfileId; uiLocale: 'en' | 'es'; reducedMotion: boolean;
  phase: P042AudioPhase; epoch: number; playRequest: number; bufferReady: boolean;
  cursorDecodedSamples: number; anchorDecodedSamples: number; anchorTimeMs: number | null;
  lastObservedTimeMs: number; sourceAlignment: 'unresolved'; lessonCompleted: false;
}>;
export type P042AudioIntent =
  | {type:'request-load'; nowMs:number}
  | {type:'buffer-ready'; nowMs:number; epoch:number; sampleRate:number; length:number; channels:number; pcmSha256:string}
  | {type:'load-failed'; nowMs:number; epoch:number}
  | {type:'request-play'; nowMs:number; activation:'automatic'|'user'}
  | {type:'play-result'; nowMs:number; epoch:number; playRequest:number; allowed:boolean}
  | {type:'tick'|'pause'|'replay'|'close'; nowMs:number}
  | {type:'seek-decoder'; nowMs:number; decodedSample:number}
  | {type:'source-frame-entry'|'source-terminal'; nowMs:number; frame:number}
  | {type:'set-locale'; nowMs:number; uiLocale:'en'|'es'};
export type P042AudioEffect = Readonly<
  | {type:'request-buffer'; epoch:number; profileId:P042DecoderProfileId}
  | {type:'request-start'; epoch:number; playRequest:number; decodedSample:number}
  | {type:'cancel-epoch'; epoch:number}
  | {type:'hold'; reason:'candidate-source125-safety-hold'|'decoder-eof-not-lesson-completion'}>;
export type P042AudioDecision = Readonly<{accepted:boolean; reason:string; state:P042AudioSession; effects:readonly P042AudioEffect[]}>;

const profile = (id: unknown) => IR.decoderProfiles.find(p => p.id === id);
const time = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const integer = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;
const PHASES: readonly string[] = ['idle','loading','ready','start-pending','playing','paused','load-failed','play-rejected','source-boundary-pending','decoder-eof-pending','closed'];
const STATE_KEYS=['version','profileId','uiLocale','reducedMotion','phase','epoch','playRequest','bufferReady','cursorDecodedSamples',
  'anchorDecodedSamples','anchorTimeMs','lastObservedTimeMs','sourceAlignment','lessonCompleted'];
const INTENT_KEYS: Record<string, readonly string[]> = {
  'request-load':[], 'buffer-ready':['epoch','sampleRate','length','channels','pcmSha256'], 'load-failed':['epoch'],
  'request-play':['activation'], 'play-result':['epoch','playRequest','allowed'], tick:[], pause:[], replay:[], close:[],
  'seek-decoder':['decodedSample'], 'source-frame-entry':['frame'], 'source-terminal':['frame'], 'set-locale':['uiLocale'],
};
function exactKeys(object: object, keys: readonly string[]) {const actual=Object.keys(object);return actual.length===keys.length&&actual.every(key=>keys.includes(key));}
function validState(state: P042AudioSession) {
  if(!state||!exactKeys(state,STATE_KEYS))return false;
  const p=profile(state.profileId);
  return Boolean(p&&state.version===1&&['en','es'].includes(state.uiLocale)&&typeof state.reducedMotion==='boolean'&&
    PHASES.includes(state.phase)&&integer(state.epoch)&&integer(state.playRequest)&&typeof state.bufferReady==='boolean'&&
    time(state.cursorDecodedSamples)&&state.cursorDecodedSamples<=p.length&&time(state.anchorDecodedSamples)&&state.anchorDecodedSamples<=p.length&&
    time(state.lastObservedTimeMs)&&state.sourceAlignment==='unresolved'&&state.lessonCompleted===false&&
    (state.phase==='playing'?state.bufferReady&&time(state.anchorTimeMs)&&state.anchorTimeMs<=state.lastObservedTimeMs&&state.anchorDecodedSamples<=state.cursorDecodedSamples:
      state.anchorTimeMs===null)&&(!['ready','start-pending','play-rejected','decoder-eof-pending'].includes(state.phase)||state.bufferReady)&&
    (!['idle','loading','load-failed','closed'].includes(state.phase)||!state.bufferReady));
}
export function createP042AudioSession(profileId:P042DecoderProfileId,uiLocale:'en'|'es',options:{nowMs?:number;reducedMotion?:boolean}={}):P042AudioSession {
  if(!profile(profileId)||!['en','es'].includes(uiLocale)||!exactKeys(options,Object.keys(options).filter(k=>['nowMs','reducedMotion'].includes(k)))||
    !time(options.nowMs??0)||typeof(options.reducedMotion??false)!=='boolean')throw new Error('Invalid p042 decoder session configuration');
  return Object.freeze({version:1,profileId,uiLocale,reducedMotion:options.reducedMotion??false,phase:'idle',epoch:0,playRequest:0,bufferReady:false,
    cursorDecodedSamples:0,anchorDecodedSamples:0,anchorTimeMs:null,lastObservedTimeMs:options.nowMs??0,sourceAlignment:'unresolved',lessonCompleted:false});
}
export function inspectP042FrameEntry(frame:number) {
  if(!Number.isSafeInteger(frame)||frame<1||frame>125)return Object.freeze({status:'invalid-source-frame' as const,frame});
  const block=IR.sourceTiming.blocks.find(b=>b.frame===frame);
  return Object.freeze({status:block?'source-seek-policy-unresolved' as const:'pre-stream-source-frame' as const,frame,
    frameDomain:IR.timeline.frameDomain,fps:12,block:block??null,latencyField:1673,
    decodedSampleTarget:null,sourceAlignmentProven:false as const,
    explanation:'Block prefix/sampleCount/seekSamples are source facts, not an accepted browser seek formula.'});
}
export function inspectP042DecoderCursor(state:P042AudioSession) {
  if(!validState(state))throw new Error('Invalid p042 decoder state');
  const p=profile(state.profileId)!;
  return Object.freeze({decodedSamples:state.cursorDecodedSamples,sampleRate:p.sampleRate,decodedSeconds:state.cursorDecodedSamples/p.sampleRate,
    nativeReferenceSamples:state.cursorDecodedSamples*22050/p.sampleRate,nativeReferenceRate:22050,
    relativeOriginSamples:p.relativeOriginSamples,referenceExcludedSuffix:p.referenceExcludedSuffix,
    fractionalElapsedSinceAnchorMs:state.anchorTimeMs===null?0:state.lastObservedTimeMs-state.anchorTimeMs,
    sourceTimelinePosition:null,sourceAlignment:'unresolved' as const,sourceLatencyApplied:0,lessonCompleted:false as const});
}
export function reduceP042AudioSession(state:P042AudioSession,intent:P042AudioIntent):P042AudioDecision {
  const reject=(reason:string):P042AudioDecision=>Object.freeze({accepted:false,reason,state,effects:Object.freeze([])});
  if(!validState(state))return reject('invalid-session-state');
  if(!intent||typeof intent!=='object'||!Object.hasOwn(INTENT_KEYS,intent.type)||
    !exactKeys(intent,['type','nowMs',...INTENT_KEYS[intent.type]]))return reject('undeclared-intent-shape');
  if(!time(intent.nowMs)||intent.nowMs<state.lastObservedTimeMs)return reject('nonmonotonic-or-invalid-clock');
  if(state.phase==='closed')return reject('closed-session');
  if(state.epoch>=Number.MAX_SAFE_INTEGER-1||state.playRequest>=Number.MAX_SAFE_INTEGER-1)return reject('epoch-or-token-exhausted');
  if('epoch'in intent&&(!integer(intent.epoch)||intent.epoch!==state.epoch))return reject('stale-or-invalid-epoch');
  const p=profile(state.profileId)!,now=intent.nowMs;
  const cursor=state.phase==='playing'?Math.min(p.length,state.anchorDecodedSamples+(now-state.anchorTimeMs!)*p.sampleRate/1000):state.cursorDecodedSamples;
  const held={...state,cursorDecodedSamples:cursor,anchorDecodedSamples:cursor,anchorTimeMs:null,lastObservedTimeMs:now};
  const accept=(patch:Partial<P042AudioSession>,reason:string,effects:P042AudioEffect[]=[]):P042AudioDecision=>{
    const next=Object.freeze({...held,...patch});if(!validState(next))throw new Error('Internal p042 state invariant violation');
    return Object.freeze({accepted:true,reason,state:next,effects:Object.freeze(effects.map(effect=>Object.freeze(effect)))});
  };
  const cancel:P042AudioEffect={type:'cancel-epoch',epoch:state.epoch};
  switch(intent.type){
    case 'request-load':
      if(!['idle','load-failed','paused'].includes(state.phase)||state.bufferReady)return reject('load-not-needed-or-already-pending');
      return accept({phase:'loading',epoch:state.epoch+1,bufferReady:false},'buffer-requested',[cancel,{type:'request-buffer',epoch:state.epoch+1,profileId:state.profileId}]);
    case 'buffer-ready':
      if(state.phase!=='loading')return reject('no-current-load');
      if(intent.sampleRate!==p.sampleRate||intent.length!==p.length||intent.channels!==p.channels||intent.pcmSha256!==p.pcmSha256)return reject('decoder-profile-mismatch');
      return accept({phase:'ready',bufferReady:true},'measured-buffer-ready');
    case 'load-failed':
      if(state.phase!=='loading')return reject('no-current-load');
      return accept({phase:'load-failed',epoch:state.epoch+1,bufferReady:false},'load-failed-no-clock-start',[cancel]);
    case 'request-play':
      if(!['automatic','user'].includes(intent.activation))return reject('invalid-activation');
      if(!state.bufferReady||!['ready','paused','play-rejected'].includes(state.phase))return reject('buffer-not-ready-or-play-not-available');
      if(cursor>=p.length)return reject('decoder-eof-needs-explicit-replay-or-seek');
      if(intent.activation==='automatic'&&(state.reducedMotion||state.phase==='play-rejected'))return reject('automatic-start-not-permitted');
      return accept({phase:'start-pending',playRequest:state.playRequest+1},'await-current-play-ack',[
        {type:'request-start',epoch:state.epoch,playRequest:state.playRequest+1,decodedSample:cursor}]);
    case 'play-result':
      if(!integer(intent.playRequest)||intent.playRequest!==state.playRequest||state.phase!=='start-pending')return reject('stale-or-invalid-play-token');
      if(typeof intent.allowed!=='boolean')return reject('invalid-play-result');
      if(!intent.allowed)return accept({phase:'play-rejected'},'play-denied-no-clock-start');
      return accept({phase:'playing',anchorTimeMs:now,anchorDecodedSamples:cursor},'play-acknowledged-clock-starts-now');
    case 'tick':
      if(state.phase!=='playing')return reject('clock-not-playing');
      if(cursor>=p.length)return accept({phase:'decoder-eof-pending',epoch:state.epoch+1},'decoder-eof-is-not-source-stop-or-completion',
        [cancel,{type:'hold',reason:'decoder-eof-not-lesson-completion'}]);
      return accept({phase:'playing',anchorTimeMs:state.anchorTimeMs,anchorDecodedSamples:state.anchorDecodedSamples},'fractional-decoder-clock-advanced');
    case 'pause':
      if(!['playing','start-pending','loading'].includes(state.phase))return reject('no-active-or-pending-session-to-pause');
      return accept({phase:'paused',epoch:state.epoch+1},'fractional-cursor-held-pending-callbacks-retired',[cancel]);
    case 'seek-decoder':
      if(!state.bufferReady||!time(intent.decodedSample)||intent.decodedSample>p.length)return reject('invalid-decoder-coordinate-or-buffer-not-ready');
      return accept({phase:intent.decodedSample===p.length?'decoder-eof-pending':'paused',epoch:state.epoch+1,
        cursorDecodedSamples:intent.decodedSample,anchorDecodedSamples:intent.decodedSample},'engineering-decoder-seek-not-source-frame-seek',[cancel]);
    case 'source-frame-entry':
      return reject(inspectP042FrameEntry(intent.frame).status==='invalid-source-frame'?'invalid-source-frame':'source-frame-seek-policy-unresolved');
    case 'source-terminal':
      if(intent.frame!==125)return reject('undeclared-source-terminal-frame');
      return accept({phase:'source-boundary-pending',epoch:state.epoch+1},'candidate-safety-hold-not-proof-of-Flash-stop-phase',
        [cancel,{type:'hold',reason:'candidate-source125-safety-hold'}]);
    case 'replay':
      return accept({phase:state.bufferReady?'ready':'idle',epoch:state.epoch+1,playRequest:0,cursorDecodedSamples:0,anchorDecodedSamples:0},
        'replay-reset-no-automatic-play-or-priming-trim',[cancel]);
    case 'set-locale':
      if(!['en','es'].includes(intent.uiLocale))return reject('invalid-ui-locale');
      return accept({phase:'idle',epoch:state.epoch+1,playRequest:0,uiLocale:intent.uiLocale,bufferReady:false,cursorDecodedSamples:0,anchorDecodedSamples:0},
        'locale-change-retires-session-not-spoken-language-claim',[cancel]);
    case 'close':
      return accept({phase:'closed',epoch:state.epoch+1,bufferReady:false},'closed-memory-session',[cancel]);
  }
}
