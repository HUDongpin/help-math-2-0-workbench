import{P026_AUDIO_SOURCE as SOURCE}from'./nms-l02-p026-audio-source-v1';
/** Decode the entire source stream, remove its 1673-sample latency once,
 * then place it at the 12863-sample frame8 offset; preserve the complete stream. The separate clock applies interactive stops. */
export function p026PrepareSourcePcm(samples:Float32Array):Float32Array {
 if(samples.length!==SOURCE.decodedSamples)throw Error('P026_AUDIO_DECODE');
 const prepared=new Float32Array(SOURCE.stopSamples);let previousSource:number=SOURCE.latencySamples,previousOutput=0,peak=0;
 for(const sample of samples){if(!Number.isFinite(sample))throw Error('P026_AUDIO_NONFINITE');peak=Math.max(peak,Math.abs(sample));}
 if(peak===0)throw Error('P026_AUDIO_SILENT');
 for(const segment of SOURCE.segments){
  if(segment.sourceStartSample!==previousSource||segment.sourceEndSample<=segment.sourceStartSample||segment.outputStartSample<previousOutput||segment.outputEndSample>prepared.length||segment.outputEndSample-segment.outputStartSample!==segment.sourceEndSample-segment.sourceStartSample)throw Error('P026_AUDIO_PARTITION');
  prepared.set(samples.subarray(segment.sourceStartSample,segment.sourceEndSample),segment.outputStartSample);
  previousSource=segment.sourceEndSample;previousOutput=segment.outputEndSample;
 }
 if(previousSource!==samples.length)throw Error('P026_AUDIO_PARTITION');
 return prepared;
}
