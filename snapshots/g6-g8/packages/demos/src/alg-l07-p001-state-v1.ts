import {ALG_L07_P001_SOURCE as SOURCE} from './generated/alg-l07-p001-source-v1';
import type {RuntimeContext} from './contract';
export {ALG_L07_P001_SOURCE} from './generated/alg-l07-p001-source-v1';

export function algL07P001Frame(frame:number,context:RuntimeContext){
  const domain=context.frameDomain??SOURCE.frameDomain;
  const max=domain==='root'?10:domain===SOURCE.frameDomain?138:0;
  if(!Number.isSafeInteger(frame)||frame<1||frame>max||context.scenario!=='source-introduction'||
    !['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>0xffffffff||
    !Number.isSafeInteger(context.replay??0)||(context.replay??0)<0||
    (domain===SOURCE.frameDomain&&context.rootFrame!==undefined&&context.rootFrame!==6))throw Error('ALG_L07_P001_FRAME_IDENTITY');
  const mainFrame=domain==='root'?(frame>=6?frame-5:null):frame;
  const pose=mainFrame===null?null:SOURCE.frames[mainFrame-1];
  return Object.freeze({animationId:SOURCE.animationId,frame,frameDomain:domain,rootFrame:domain==='root'?frame:6,
    mainFrame,language:context.lang,seed:context.seed,replay:context.replay??0,scenario:context.scenario,title:SOURCE.title,
    alpha:pose?pose[0]/256:0,scaleX:pose?.[1]??.5,scaleY:pose?.[2]??.5,
    sourceTextIds:Object.freeze(pose&&pose[0]>0?[140,141]:[])});
}
export type AlgL07P001Frame=ReturnType<typeof algL07P001Frame>;

/** The nested source has no terminal stop. The last frame lasts a full 1/12 second. */
export function algL07P001FrameAtMilliseconds(ms:number){
  if(!Number.isFinite(ms)||ms<0||ms>Number.MAX_SAFE_INTEGER/12)throw Error('ALG_L07_P001_TIME');
  return Math.floor(ms*12/1000)%138+1;
}
