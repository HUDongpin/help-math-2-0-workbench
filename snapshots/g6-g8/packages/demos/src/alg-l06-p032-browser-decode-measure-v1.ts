import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
import {P032_MAIN_ASSET,P032_SA_ASSET} from './alg-l06-p032-audio-schedule-v1';

const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes),
 n=>n.toString(16).padStart(2,'0')).join('');
const sha=async(bytes:ArrayBuffer)=>hex(await crypto.subtle.digest('SHA-256',bytes));
export type P032AudioKind='main'|'separate-sa';

/** Browser-only measurement draft. Run against the exact served source bytes
 * in a frozen candidate, then review the returned browser/asset association.
 * The FFmpeg PCM candidate is not used as a browser binding. */
export async function measureP032BrowserDecode(kind:P032AudioKind,
 source:ArrayBuffer,createContext?:(rate:number)=>AudioContext):
 Promise<DecodedSourceStreamBinding>{
 const asset=kind==='main'?P032_MAIN_ASSET:P032_SA_ASSET;
 const bytes=source.slice(0);
 if(bytes.byteLength!==asset.sourceBytes||await sha(bytes)!==asset.sourceSha256)
  throw Error('P032_BROWSER_MEASURE_SOURCE_MISMATCH');
 const context=createContext?.(asset.sampleRate)??
  new AudioContext({sampleRate:asset.sampleRate,latencyHint:'interactive'});
 try{
  if(context.sampleRate!==asset.sampleRate)
   throw Error('P032_BROWSER_MEASURE_CONTEXT_RATE_MISMATCH');
  const decoded=await context.decodeAudioData(bytes);
  if(decoded.sampleRate!==asset.sampleRate||decoded.numberOfChannels!==1||
    !Number.isSafeInteger(decoded.length)||decoded.length<=0)
   throw Error('P032_BROWSER_MEASURE_DECODE_MISMATCH');
  const samples=new ArrayBuffer(decoded.length*4),view=new DataView(samples);
  const channel=decoded.getChannelData(0);
  for(let i=0;i<decoded.length;i++){
   const value=channel[i];
   if(!Number.isFinite(value))throw Error('P032_BROWSER_MEASURE_NONFINITE_PCM');
   view.setFloat32(i*4,value,true);
  }
  return Object.freeze({sourceSha256:asset.sourceSha256,
   sourceBytes:asset.sourceBytes,sampleRate:asset.sampleRate,channels:1,
   decodedSamples:decoded.length,pcmSha256:await sha(samples)});
 }finally{if(context.state!=='closed')await context.close();}
}
