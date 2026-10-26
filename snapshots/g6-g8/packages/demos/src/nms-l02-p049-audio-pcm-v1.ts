import {P049_AUDIO_PLANS} from './generated/nms-l02-p049-audio-plan-v1';
export type P049AudioDomain=keyof typeof P049_AUDIO_PLANS;
/** Prepare complete decoded PCM, removing only source seek latency and inserting authored stream gaps.
 * Phase/feedback windows are intentionally separate from encoded bytes and this full buffer.
 */
export function p049PrepareSourcePcm(domain:P049AudioDomain,samples:Float32Array):Float32Array{
 if(!Object.hasOwn(P049_AUDIO_PLANS,domain))throw Error('P049_AUDIO_DOMAIN');
 const plan=P049_AUDIO_PLANS[domain];if(samples.length!==plan.decodedSamples)throw Error('P049_AUDIO_LENGTH');
 let peak=0;for(const value of samples){if(!Number.isFinite(value))throw Error('P049_AUDIO_NONFINITE');peak=Math.max(peak,Math.abs(value));}if(!peak)throw Error('P049_AUDIO_SILENT');
 const out=new Float32Array(plan.totalSamples);let cursor:number=plan.latencySamples,end=0;
 for(const segment of plan.segments){if(segment.sourceStart!==cursor||segment.sourceEnd<=cursor||segment.sourceEnd>samples.length||segment.outputStart<end||segment.outputEnd>out.length||segment.outputEnd-segment.outputStart!==segment.sourceEnd-segment.sourceStart)throw Error('P049_AUDIO_PARTITION');
  out.set(samples.subarray(segment.sourceStart,segment.sourceEnd),segment.outputStart);cursor=segment.sourceEnd;end=segment.outputEnd;
 }
 if(cursor!==samples.length||end!==out.length)throw Error('P049_AUDIO_PARTITION');return out;
}
