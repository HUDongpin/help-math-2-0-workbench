import {P029_TEACHING_DATA as DATA} from './generated/nms-l02-p029-teaching-data-v1';
import type {P029TeachingState} from './nms-l02-p029-source-contract-v1';
function freeze<T>(value:T):T{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;}
freeze(DATA);
export const P029_ID='shared-nms002-l02-p029';
export const P029_SHA256='4def014cda62cdfee43006ddbc1ce5b194ee89740f6576c886503b70c905fe30';
export const P029_SHADED_CELLS=DATA.shadedCells;
const EMPTY:P029TeachingState=Object.freeze({tableAlpha:0,placeValueAlpha:0,highlightCell:null,reducedMotionCell:null,placeValueBlink:false,emphasisTargets:Object.freeze([])});
export interface P029FrameState {
  readonly animationId:typeof P029_ID;readonly sourceSha256:typeof P029_SHA256;
  readonly frame:number;readonly frameDomain:'root'|'sprite-49';readonly rootFrame:number;readonly mainFrame:number|null;
  readonly language:'en'|'es';readonly seed:number;readonly replay:number;readonly teaching:P029TeachingState;
}
export function getNmsL2P029FrameState(frame:number,c:{frameDomain?:string;rootFrame?:number;seed:number;lang:'en'|'es';replay?:number}):P029FrameState{
  const domain=c.frameDomain??'sprite-49',max=domain==='root'?10:domain==='sprite-49'?383:0,replay=c.replay??0;
  if(!Number.isSafeInteger(frame)||frame<1||frame>max||!['en','es'].includes(c.lang)||!Number.isSafeInteger(c.seed)||c.seed<0||c.seed>0xffffffff||!Number.isSafeInteger(replay)||replay<0)throw Error('P029_FRAME_IDENTITY');
  const rootFrame=domain==='root'?frame:6;if(c.rootFrame!==undefined&&c.rootFrame!==rootFrame)throw Error('P029_ROOT_FRAME');
  const mainFrame=domain==='root'?(frame>=6?frame-5:null):frame;
  return Object.freeze({animationId:P029_ID,sourceSha256:P029_SHA256,frame,frameDomain:domain as P029FrameState['frameDomain'],rootFrame,mainFrame,language:c.lang,seed:c.seed,replay,teaching:mainFrame===null?EMPTY:DATA.states[DATA.frames[mainFrame-1]]});
}
export function p029CanOpenTerm(s:P029FrameState,id:string){return s.frameDomain==='sprite-49'&&(id==='ones-group'||id==='decimal'?s.teaching.tableAlpha>0:id==='place-value'?s.teaching.placeValueAlpha>0:false);}
export function p029PresentationTeaching(s:P029FrameState,reducedMotion=false){return Object.freeze({...s.teaching,highlightCell:reducedMotion?s.teaching.reducedMotionCell:s.teaching.highlightCell,placeValueBlink:reducedMotion?s.mainFrame!==null&&s.mainFrame>=187&&s.mainFrame<=195:s.teaching.placeValueBlink});}
function time(ms:number){if(!Number.isFinite(ms)||ms<0||ms>Number.MAX_SAFE_INTEGER/12)throw Error('P029_TIME');return Math.floor(ms*12/1000);}
/** The source loops; the modern host presents one full cycle and holds383. */
export function p029SourceFrameAtMilliseconds(ms:number){return time(ms)%383+1;}
export function p029FrameAtMilliseconds(ms:number){return Math.min(time(ms)+1,383);}
