import {P044_AUDIO_PLANS,P044_WRONG_WINDOWS} from './generated/nms-l02-p044-audio-plan-v1';
export type P044AudioDomain=keyof typeof P044_AUDIO_PLANS;
/** Retain every decoded sample after source-declared latency, inserting source gaps. */
export function p044PrepareSourcePcm(domain:P044AudioDomain,samples:Float32Array):Float32Array {
  const plan=P044_AUDIO_PLANS[domain];
  if(!plan||samples.length!==plan.decodedSamples)throw Error('P044_AUDIO_IDENTITY');
  let peak=0;for(const value of samples){if(!Number.isFinite(value))throw Error('P044_AUDIO_NONFINITE');peak=Math.max(peak,Math.abs(value));}
  if(!peak)throw Error('P044_AUDIO_SILENT');
  const output=new Float32Array(plan.totalSamples);let cursor:number=plan.latencySamples,end=0;
  for(const segment of plan.segments){
    if(segment.sourceStart!==cursor||segment.sourceEnd<=cursor||segment.sourceEnd>samples.length
      ||segment.outputStart<end||segment.outputEnd>output.length
      ||segment.outputEnd-segment.outputStart!==segment.sourceEnd-segment.sourceStart)throw Error('P044_AUDIO_PARTITION');
    output.set(samples.subarray(segment.sourceStart,segment.sourceEnd),segment.outputStart);
    cursor=segment.sourceEnd;end=segment.outputEnd;
  }
  if(cursor!==samples.length||end!==output.length)throw Error('P044_AUDIO_PARTITION');
  return output;
}
export function p044WrongWindow(index:number){
  if(!Number.isInteger(index)||index<0||index>=P044_WRONG_WINDOWS.length)throw Error('P044_WRONG_BRANCH');
  return P044_WRONG_WINDOWS[index];
}
/** Slice only prepared PCM, never the encoded stream. End is exclusive. */
export function p044WrongPcm(samples:Float32Array,index:number):Float32Array {
  const window=p044WrongWindow(index);
  if(samples.length!==P044_AUDIO_PLANS['242'].totalSamples)throw Error('P044_WRONG_PCM');
  return samples.slice(window.start,window.end);
}
