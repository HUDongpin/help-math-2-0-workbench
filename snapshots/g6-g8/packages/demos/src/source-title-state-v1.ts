import type {RuntimeContext} from './contract';
import type {SourceStreamCycleClockPlan} from './source-stream-cycle-clock-v1';

/** Source-audited, two-layer introduction titles only. */
export interface SourceTitleConfigV1 {
  readonly animationId:string;readonly sourceSha256:string;readonly title:string;
  readonly courseTitle:string;readonly activityTitle:string;readonly backgroundColor:string;
  readonly fps:12;readonly rootFrameCount:10;readonly rootEntryFrame:6;
  readonly frameDomain:string;readonly frameCount:number;
  readonly sourceTextIds:readonly [number,number];
  readonly frames:readonly (readonly [number,number,number])[];
  readonly clockPlan:SourceStreamCycleClockPlan;
}
export function sourceTitleFrameV1(source:SourceTitleConfigV1,frame:number,context:RuntimeContext){
  const domain=context.frameDomain??source.frameDomain;
  const max=domain==='root'?source.rootFrameCount:domain===source.frameDomain?source.frameCount:0;
  if(!Number.isSafeInteger(frame)||frame<1||frame>max||context.scenario!=='source-introduction'||
    !['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>0xffffffff||
    !Number.isSafeInteger(context.replay??0)||(context.replay??0)<0||
    (domain===source.frameDomain&&context.rootFrame!==undefined&&context.rootFrame!==source.rootEntryFrame))throw Error('SOURCE_TITLE_FRAME_IDENTITY');
  const mainFrame=domain==='root'?(frame>=source.rootEntryFrame?frame-source.rootEntryFrame+1:null):frame;
  const pose=mainFrame===null?null:source.frames[mainFrame-1];
  if(mainFrame!==null&&!pose)throw Error('SOURCE_TITLE_MISSING_POSE');
  return Object.freeze({animationId:source.animationId,frame,frameDomain:domain,rootFrame:domain==='root'?frame:source.rootEntryFrame,
    mainFrame,language:context.lang,seed:context.seed,replay:context.replay??0,scenario:context.scenario,title:source.title,
    alpha:pose?pose[0]/256:0,scaleX:pose?.[1]??.5,scaleY:pose?.[2]??.5,
    sourceTextIds:Object.freeze(pose&&pose[0]>0?[...source.sourceTextIds]:[])});
}
export type SourceTitleFrameV1=ReturnType<typeof sourceTitleFrameV1>;
/** Includes the final frame's complete duration before the authored loop. */
export function sourceTitleFrameAtMillisecondsV1(source:SourceTitleConfigV1,ms:number){
  if(!Number.isFinite(ms)||ms<0||ms>Number.MAX_SAFE_INTEGER/12)throw Error('SOURCE_TITLE_TIME');
  return Math.floor(ms*source.fps/1000)%source.frameCount+1;
}
