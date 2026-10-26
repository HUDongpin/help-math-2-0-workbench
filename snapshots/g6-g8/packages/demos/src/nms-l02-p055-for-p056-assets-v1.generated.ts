import {P055_ID,P055_SOURCE} from './nms-l02-ts-pilot-text';

export const P055_NATIVE_ASSET=Object.freeze({
 animationId:P055_ID,sourceSha256:P055_SOURCE,
 runtimeSha256:'47e796237e5520140a760175865f09c3f218ac942cf3cadc8fb9f56c38bd358d',
 url:'/migration-assets/nms-l02-p056-predecessors/p055-typography.js?sha256=47e796237e5520140a760175865f09c3f218ac942cf3cadc8fb9f56c38bd358d',
});

export interface P055NativeAsset {
 readonly metadata:{animationId:string;sourceSwfSha256:string;renderScale:number;requiredCanvas:{width:number;height:number}};
 ready():Promise<void>;
 renderWithText(canvas:HTMLCanvasElement,request:Record<string,unknown>):{
  state:{frame?:number;localFrame?:number;frameDomain:string;rootFrame:number};
  suppressedInstanceIds:readonly string[];unfulfilledSuppressionIds:readonly string[];
 };
}
let pending:Promise<P055NativeAsset>|undefined;
const registry=()=>((window as unknown as {HELP_MATH_CANVAS_ASSETS?:Record<string,P055NativeAsset>}).HELP_MATH_CANVAS_ASSETS);

/** Browser SRI complements the pilot server's independent physical-file pins. */
export function loadP055NativeAsset():Promise<P055NativeAsset>{
 if(process.env.NODE_ENV==='production')return Promise.reject(Error('P055 local candidate only'));
 if(pending)return pending;
 pending=(async()=>{
  const previous=registry();
  if(previous&&Object.prototype.hasOwnProperty.call(previous,P055_ID)&&
   !Reflect.deleteProperty(previous,P055_ID))throw Error('Stale P055 drawing cannot be replaced');
  await new Promise<void>((resolve,reject)=>{
   const script=document.createElement('script');
   script.src=P055_NATIVE_ASSET.url;
   script.crossOrigin='anonymous';
   script.integrity='sha256-'+btoa(String.fromCharCode(...P055_NATIVE_ASSET.runtimeSha256.match(/../g)!.map(x=>parseInt(x,16))));
   script.onload=()=>{script.remove();resolve();};
   script.onerror=()=>{script.remove();reject(Error('P055 drawing unavailable'));};
   document.head.append(script);
  });
  const asset=registry()?.[P055_ID];
  if(!asset||asset.metadata.animationId!==P055_ID||asset.metadata.sourceSwfSha256!==P055_SOURCE||
   asset.metadata.renderScale!==2||asset.metadata.requiredCanvas.width!==1600||
   asset.metadata.requiredCanvas.height!==1200||typeof asset.renderWithText!=='function')
   throw Error('P055 drawing identity mismatch');
  await asset.ready();return asset;
 })().catch(error=>{pending=undefined;throw error;});
 return pending!;
}
