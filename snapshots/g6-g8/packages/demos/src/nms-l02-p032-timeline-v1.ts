import {P032_TEACHING_DATA as DATA}from'./generated/nms-l02-p032-teaching-data-v1';
import type{P032TeachingState}from'./nms-l02-p032-source-contract-v1';
function freeze<T>(value:T):T{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;}
freeze(DATA);
export const P032_ID='shared-nms002-l02-p032';
export const P032_SHA256='3172ad7f4cb8ddef009d1b9948e2f3c5b782144c9a5ed092c08ce61b5213bc51';
export const P032_SCENARIOS=['default','term-decimal','term-ones-group','term-place-value-chart']as const;
export interface P032FrameState{
 readonly animationId:typeof P032_ID;readonly sourceSha256:typeof P032_SHA256;
 readonly frame:number;readonly frameDomain:'root'|'sprite-176';readonly rootFrame:number;readonly mainFrame:number|null;
 readonly language:'en'|'es';readonly seed:number;readonly replay:number;readonly scenario:typeof P032_SCENARIOS[number];readonly activeTerm:'decimal'|'ones-group'|'place-value-chart'|null;readonly teaching:P032TeachingState|null;
}
export function getNmsL2P032FrameState(frame:number,c:{frameDomain?:string;rootFrame?:number;seed:number;lang:'en'|'es';replay?:number;scenario?:string}):P032FrameState{
 const domain=c.frameDomain??'sprite-176',max=domain==='root'?10:domain==='sprite-176'?451:0,replay=c.replay??0,scenario=c.scenario??'default';
 if(!Number.isSafeInteger(frame)||frame<1||frame>max||!['en','es'].includes(c.lang)||!Number.isSafeInteger(c.seed)||c.seed<0||c.seed>0xffffffff||!Number.isSafeInteger(replay)||replay<0||!P032_SCENARIOS.some(s=>s===scenario)||(domain==='root'&&scenario!=='default'))throw Error('P032_FRAME_IDENTITY');
 const rootFrame=domain==='root'?frame:6;if(c.rootFrame!==undefined&&c.rootFrame!==rootFrame)throw Error('P032_ROOT_FRAME');
 const mainFrame=domain==='root'?(frame>=6?frame-5:null):frame;
 const activeTerm=scenario==='default'?null:scenario.slice(5) as P032FrameState['activeTerm'];
 return Object.freeze({animationId:P032_ID,sourceSha256:P032_SHA256,frame,frameDomain:domain as P032FrameState['frameDomain'],rootFrame,mainFrame,language:c.lang,seed:c.seed,replay,scenario:scenario as P032FrameState['scenario'],activeTerm,teaching:mainFrame===null?null:DATA.states[DATA.frames[mainFrame-1]]});
}
/** Each of these exact source buttons is placed from main frame1; the source also duplicates them in the second chart. */
export function p032CanOpenTerm(s:P032FrameState,id:string){return s.frameDomain==='sprite-176'&&s.mainFrame!==null&&['decimal','ones-group','place-value-chart'].includes(id);}
export function p032PresentationTeaching(s:P032FrameState,reducedMotion=false){const t=s.teaching;if(!t)return null;const f=s.mainFrame!;return Object.freeze({...t,primaryBlink:reducedMotion?f>=289&&f<=299:t.primaryBlink,secondaryBlink:reducedMotion?f>=429&&f<=445:t.secondaryBlink});}
function time(ms:number){if(!Number.isFinite(ms)||ms<0||ms>Number.MAX_SAFE_INTEGER/12)throw Error('P032_TIME');return Math.floor(ms*12/1000);}
export function p032SourceFrameAtMilliseconds(ms:number){return time(ms)%451+1;}
/** Preserve the final full frame interval, then let the modern host hold451 until Replay. */
export function p032FrameAtMilliseconds(ms:number){return Math.min(time(ms)+1,451);}
