import {P051_AUDIO_PLANS} from './generated/nms-l02-p051-audio-plan-v1';
export type P051AudioDomain=keyof typeof P051_AUDIO_PLANS;
/** Prepare complete decoded PCM, removing only source seek latency and inserting authored stream gaps.
 * Phase/feedback windows are intentionally separate from encoded bytes and this full buffer.
 */
export function p051PrepareSourcePcm(domain:P051AudioDomain,samples:Float32Array):Float32Array{
 if(!Object.hasOwn(P051_AUDIO_PLANS,domain))throw Error('P051_AUDIO_DOMAIN');
 const plan=P051_AUDIO_PLANS[domain];if(samples.length!==plan.decodedSamples)throw Error('P051_AUDIO_LENGTH');
 let peak=0;for(const value of samples){if(!Number.isFinite(value))throw Error('P051_AUDIO_NONFINITE');peak=Math.max(peak,Math.abs(value));}if(!peak)throw Error('P051_AUDIO_SILENT');
 const out=new Float32Array(plan.totalSamples);let cursor:number=plan.latencySamples,end=0;
 for(const segment of plan.segments){if(segment.sourceStart!==cursor||segment.sourceEnd<=cursor||segment.sourceEnd>samples.length||segment.outputStart<end||segment.outputEnd>out.length||segment.outputEnd-segment.outputStart!==segment.sourceEnd-segment.sourceStart)throw Error('P051_AUDIO_PARTITION');
  out.set(samples.subarray(segment.sourceStart,segment.sourceEnd),segment.outputStart);cursor=segment.sourceEnd;end=segment.outputEnd;
 }
 if(cursor!==samples.length||end!==out.length)throw Error('P051_AUDIO_PARTITION');return out;
}
