import {P040_AUDIO_SOURCE as source} from './generated/nms-l02-p040-audio-plan-v1';
export function p040PrepareSourcePcm(samples:Float32Array):Float32Array{
 if(samples.length!==source.decodedSamples)throw Error('P040_AUDIO_DECODE');
 let peak=0;for(const value of samples){if(!Number.isFinite(value))throw Error('P040_AUDIO_NONFINITE');peak=Math.max(peak,Math.abs(value));}if(!peak)throw Error('P040_AUDIO_SILENT');
 const output=new Float32Array(source.totalSamples);let cursor:number=source.latencySamples,end=0;
 for(const segment of source.segments){
  if(segment.sourceStart!==cursor||segment.sourceEnd<=cursor||segment.sourceEnd>samples.length||segment.outputStart<end||segment.outputEnd>output.length||segment.outputEnd-segment.outputStart!==segment.sourceEnd-segment.sourceStart)throw Error('P040_AUDIO_PARTITION');
  output.set(samples.subarray(segment.sourceStart,segment.sourceEnd),segment.outputStart);cursor=segment.sourceEnd;end=segment.outputEnd;
 }
 if(cursor!==samples.length)throw Error('P040_AUDIO_PARTITION');return output;
}
