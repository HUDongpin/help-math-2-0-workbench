import {P030_TEACHING_DATA as DATA} from './generated/nms-l02-p030-teaching-data-v1';
import type {P030TeachingState} from './nms-l02-p030-source-contract-v1';
function freeze<T>(value:T):T{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;}
freeze(DATA);
export const P030_ID='shared-nms002-l02-p030';
export const P030_SHA256='a67fd2cd208277a695c01be67fe9346852bca4ff4a76ec88dd7902a63a048c48';
const EMPTY:P030TeachingState=Object.freeze({"modelAlpha":0,"shadedTenths":0,"outlineAlpha":0,"highlightStrip":null,"tableAlpha":0,"decimalAlpha":0,"tableNumberAlpha":0,"fractionAlpha":0,"example":null,"numberBlink":false,"onesTermAlpha":0,"decimalTermAlpha":0});
export interface P030FrameState {
  readonly animationId:typeof P030_ID;readonly sourceSha256:typeof P030_SHA256;
  readonly frame:number;readonly frameDomain:'root'|'sprite-67';readonly rootFrame:number;readonly mainFrame:number|null;
  readonly language:'en'|'es';readonly seed:number;readonly replay:number;readonly teaching:P030TeachingState;
}
export function getNmsL2P030FrameState(frame:number,c:{frameDomain?:string;rootFrame?:number;seed:number;lang:'en'|'es';replay?:number}):P030FrameState{
  const domain=c.frameDomain??'sprite-67',max=domain==='root'?10:domain==='sprite-67'?299:0,replay=c.replay??0;
  if(!Number.isSafeInteger(frame)||frame<1||frame>max||!['en','es'].includes(c.lang)||!Number.isSafeInteger(c.seed)||c.seed<0||c.seed>0xffffffff||!Number.isSafeInteger(replay)||replay<0)throw Error('P030_FRAME_IDENTITY');
  const rootFrame=domain==='root'?frame:6;if(c.rootFrame!==undefined&&c.rootFrame!==rootFrame)throw Error('P030_ROOT_FRAME');
  const mainFrame=domain==='root'?(frame>=6?frame-5:null):frame;
  return Object.freeze({animationId:P030_ID,sourceSha256:P030_SHA256,frame,frameDomain:domain as P030FrameState['frameDomain'],rootFrame,mainFrame,language:c.lang,seed:c.seed,replay,teaching:mainFrame===null?EMPTY:DATA.states[DATA.frames[mainFrame-1]]});
}
/** Source22 is erroneously reused at the Decimals region until12; native actions wait for the exact correct binding. */
export function p030CanOpenTerm(s:P030FrameState,id:string){return s.frameDomain==='sprite-67'&&(id==='ones-group'?s.teaching.tableAlpha===1&&s.teaching.onesTermAlpha===1:id==='decimal'?s.teaching.tableAlpha===1&&s.teaching.decimalTermAlpha===1:false);}
export function p030PresentationTeaching(s:P030FrameState,reducedMotion=false){return Object.freeze({...s.teaching,numberBlink:reducedMotion?s.mainFrame!==null&&s.mainFrame>=276&&s.mainFrame<=284:s.teaching.numberBlink});}
function time(ms:number){if(!Number.isFinite(ms)||ms<0||ms>Number.MAX_SAFE_INTEGER/12)throw Error('P030_TIME');return Math.floor(ms*12/1000);}
/** The source loops; the modern host presents one full cycle and holds299. */
export function p030SourceFrameAtMilliseconds(ms:number){return time(ms)%299+1;}
export function p030FrameAtMilliseconds(ms:number){return Math.min(time(ms)+1,299);}
