import {P028_TEACHING_DATA as DATA} from './generated/nms-l02-p028-teaching-data-v1';
import type {P028Run} from './nms-l02-p028-source-contract-v1';

function freeze<T>(value:T):T {
  if(value && typeof value==='object' && !Object.isFrozen(value)) {
    Object.freeze(value); for(const child of Object.values(value)) freeze(child);
  }
  return value;
}
freeze(DATA);
export const P028_ID = 'shared-nms002-l02-p028';
export interface P028VisibleRun extends P028Run {
  readonly fractions: readonly number[];
  readonly visiblePrefix: string;
  readonly fullyVisible: boolean;
}
export interface P028FrameState {
  readonly animationId: typeof P028_ID;
  readonly sourceSha256: string;
  readonly frame: number;
  readonly frameDomain: 'root'|'sprite-29';
  readonly rootFrame: number;
  readonly mainFrame: number|null;
  readonly language: 'en'|'es';
  readonly seed: number;
  readonly replay: number;
  readonly lines: readonly Readonly<{characterId:number;runs:readonly P028VisibleRun[]}>[];
  readonly gridAlpha: number;
}
export function getNmsL2P028FrameState(frame:number, context:{frameDomain?:string;rootFrame?:number;seed:number;replay?:number;lang:'en'|'es'}):P028FrameState {
  const domain=context.frameDomain??'sprite-29';
  const max=domain==='root'?10:domain==='sprite-29'?199:0;
  const replay=context.replay??0;
  if(!Number.isSafeInteger(frame)||frame<1||frame>max||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>0xffffffff||!Number.isSafeInteger(replay)||replay<0)throw Error('P028_FRAME_IDENTITY');
  const rootFrame=domain==='root'?frame:6;
  if(context.rootFrame!==undefined&&context.rootFrame!==rootFrame)throw Error('P028_ROOT_FRAME');
  // Root diagnostics query placement age. Actual playback holds root6 and
  // advances the explicitly named child domain; root is never relabelled199.
  const mainFrame=domain==='root'?(frame>=6?frame-5:null):frame;
  const fractions=mainFrame===null?null:DATA.states[DATA.frames[mainFrame-1]];
  const lines=DATA.lines.map((line,index)=>{
    let offset=0;
    return Object.freeze({characterId:line.characterId,runs:Object.freeze(line.runs.map(run=>{
      const values=fractions?.[index].slice(offset,offset+run.text.length)??Array<number>(run.text.length).fill(0);
      offset+=run.text.length;
      let prefix='';
      for(let i=0;i<values.length;i++){if(values[i]!==1)break;prefix+=run.text[i];}
      return Object.freeze({...run,fractions:Object.freeze(values),visiblePrefix:prefix,fullyVisible:values.every(v=>v===1)});
    }))});
  });
  return Object.freeze({animationId:P028_ID,sourceSha256:DATA.sourceSha256,frame,frameDomain:domain as P028FrameState['frameDomain'],rootFrame,mainFrame,language:context.lang,seed:context.seed,replay,lines:Object.freeze(lines),gridAlpha:mainFrame===null?0:DATA.gridAlpha[mainFrame-1]});
}
export function p028CanOpenTerm(state:P028FrameState,entryId:string):boolean {
  return state.frameDomain==='sprite-29'&&state.lines.some(line=>line.runs.some(run=>run.termId===entryId&&run.fullyVisible));
}
function validTime(ms:number){if(!Number.isFinite(ms)||ms<0||ms>Number.MAX_SAFE_INTEGER/12)throw Error('P028_TIME');}
export function p028SourceFrameAtMilliseconds(ms:number){validTime(ms);return Math.floor(ms*12/1000)%199+1;}
/** Qualified modern once policy; the unmodified source child itself loops. */
export function p028FrameAtMilliseconds(ms:number){validTime(ms);return Math.min(Math.floor(ms*12/1000)+1,199);}
