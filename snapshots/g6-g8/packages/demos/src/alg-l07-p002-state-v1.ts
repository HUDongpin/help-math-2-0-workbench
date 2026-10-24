import {ALG_L07_P002_SOURCE as SOURCE} from './generated/alg-l07-p002-source-v1';
import type {RuntimeContext} from './contract';
export {ALG_L07_P002_SOURCE} from './generated/alg-l07-p002-source-v1';
export function algL07P002Frame(frame:number,context:RuntimeContext){
 const domain=context.frameDomain??SOURCE.frameDomain;
 const max=domain==='root'?10:domain===SOURCE.frameDomain?1195:0;
 if(!Number.isSafeInteger(frame)||frame<1||frame>max||context.scenario!=='source-static-frame'||!['en','es'].includes(context.lang)||
  !Number.isSafeInteger(context.seed)||context.seed<0||context.seed>0xffffffff||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0||
  (domain===SOURCE.frameDomain&&context.rootFrame!==undefined&&context.rootFrame!==6))throw Error('ALG_L07_P002_FRAME_IDENTITY');
 const mainFrame=domain==='root'?(frame>=6?frame-5:null):frame,pose=mainFrame===null?null:SOURCE.frames[mainFrame-1];
 return Object.freeze({animationId:SOURCE.animationId,frame,frameDomain:domain,rootFrame:domain==='root'?frame:6,mainFrame,
  language:context.lang,visualLanguage:'en' as const,visualLanguageFallback:context.lang==='es',seed:context.seed,replay:context.replay??0,scenario:context.scenario,
  title:SOURCE.title,tableVisible:pose?.tableVisible??false,accents:pose?.accents??[],sourceTextIds:pose?.sourceTextIds??[],terminalHeld:mainFrame===1195});
}
export type AlgL07P002Frame=ReturnType<typeof algL07P002Frame>;
/** Source frame1195 executes stop(), so the last drawing remains held. */
export function algL07P002FrameAtMilliseconds(ms:number){if(!Number.isFinite(ms)||ms<0||ms>Number.MAX_SAFE_INTEGER/12)throw Error('ALG_L07_P002_TIME');return Math.min(1195,Math.floor(ms*12/1000)+1);}
