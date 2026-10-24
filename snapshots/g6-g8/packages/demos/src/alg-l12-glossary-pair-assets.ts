export interface PairNativeAssetConfig {
 readonly animationId:string;readonly sourceSha256:string;readonly runtimeSha256:string;
}
export interface PairNativeAsset {
 readonly metadata:{animationId:string;sourceSwfSha256:string;renderScale:number;requiredCanvas:{width:number;height:number}};
 ready():Promise<void>;
 renderWithText(canvas:HTMLCanvasElement,request:Record<string,unknown>):{
  state:Record<string,unknown>;suppressedInstanceIds:readonly string[];unfulfilledSuppressionIds:readonly string[];
 };
}
declare global {interface Window {HELP_MATH_GLOSSARY_PAIR_NATIVE_ASSETS?:Record<string,PairNativeAsset>;}}
const pending=new Map<string,Promise<PairNativeAsset>>();
/** SRI and the server's independent source/asset pins both bind this pair's
 * local native-text runtime. No source-only Canvas is accepted as native. */
export function loadPairNativeAsset(config:PairNativeAssetConfig):Promise<PairNativeAsset>{
 if(process.env.NODE_ENV==='production')return Promise.reject(Error('Local pair asset only'));
 if(!['shared-alg001-l12-p013','shared-alg001-l12-p015'].includes(config.animationId)||
  !/^[a-f0-9]{64}$/.test(config.sourceSha256)||!/^[a-f0-9]{64}$/.test(config.runtimeSha256))
  return Promise.reject(Error('Invalid pair asset identity'));
 const key=[config.animationId,config.sourceSha256,config.runtimeSha256].join(':');
 const existing=pending.get(key);if(existing)return existing;
 const loaded=(async()=>{
  const registry=window.HELP_MATH_GLOSSARY_PAIR_NATIVE_ASSETS;
  if(registry&&Object.prototype.hasOwnProperty.call(registry,config.animationId)){
   if(!Object.getOwnPropertyDescriptor(registry,config.animationId)?.configurable||!Reflect.deleteProperty(registry,config.animationId))
    throw Error('Stale pair asset cannot be replaced');
  }
  await new Promise<void>((resolve,reject)=>{
   const script=document.createElement('script');
   script.src=`/flash-assets/g678-local/${config.animationId}/typography.js?sha256=${config.runtimeSha256}`;
   script.integrity='sha256-'+btoa(String.fromCharCode(...config.runtimeSha256.match(/../g)!.map(part=>parseInt(part,16))));
   script.crossOrigin='anonymous';
   script.onload=()=>{script.remove();resolve();};script.onerror=()=>{script.remove();reject(Error('Pair asset unavailable'));};
   document.head.append(script);
  });
  const asset=window.HELP_MATH_GLOSSARY_PAIR_NATIVE_ASSETS?.[config.animationId];
  if(!asset||asset.metadata.animationId!==config.animationId||asset.metadata.sourceSwfSha256!==config.sourceSha256||
   asset.metadata.renderScale!==2||asset.metadata.requiredCanvas.width!==1600||asset.metadata.requiredCanvas.height!==1200||
   typeof asset.renderWithText!=='function')throw Error('Pair native asset identity mismatch');
  await asset.ready();return asset;
 })().catch(error=>{pending.delete(key);throw error;});
 pending.set(key,loaded);return loaded;
}
