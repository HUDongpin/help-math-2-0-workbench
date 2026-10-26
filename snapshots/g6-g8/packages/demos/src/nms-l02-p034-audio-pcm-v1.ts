import{P034_AUDIO_SOURCES}from'./nms-l02-p034-audio-source-v1';
export function p034AudioSource(domain:string){if(!Object.hasOwn(P034_AUDIO_SOURCES,domain))throw Error('P034_AUDIO_DOMAIN');return P034_AUDIO_SOURCES[domain as keyof typeof P034_AUDIO_SOURCES];}
/** One full decoded stream per source MovieClip. Trim header latency once,
 * preserve every remaining sample, and leave source-frame silence as silence.
 * Holds and close jumps belong to the separate state/audio clock, never to MP3
 * byte slicing. Main and Reset button-down streams retain their independent offsets. */
export function p034PrepareSourcePcm(samples:Float32Array,domain:string):Float32Array{
 const source=p034AudioSource(domain);if(samples.length!==source.decodedSamples)throw Error('P034_AUDIO_DECODE');
 let peak=0;for(const sample of samples){if(!Number.isFinite(sample))throw Error('P034_AUDIO_NONFINITE');peak=Math.max(peak,Math.abs(sample));}if(!peak)throw Error('P034_AUDIO_SILENT');
 const count=source.decodedSamples-source.latencySamples;
 if(count<=0||source.outputStartSample<0||source.outputEndSample>source.totalSamples||source.outputEndSample-source.outputStartSample!==count)throw Error('P034_AUDIO_PARTITION');
 const output=new Float32Array(source.totalSamples);output.set(samples.subarray(source.latencySamples),source.outputStartSample);return output;
}
