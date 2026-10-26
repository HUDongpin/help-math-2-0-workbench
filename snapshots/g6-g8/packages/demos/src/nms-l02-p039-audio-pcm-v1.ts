import {P039_AUDIO_SOURCE as SOURCE} from './generated/nms-l02-p039-audio-source-v1';
export type P039AudioDomain='223'|'234'|'237';
function validate(samples:Float32Array,length:number){
 if(samples.length!==length)throw Error('P039_PCM_LENGTH');
 let peak=0;for(const value of samples){if(!Number.isFinite(value))throw Error('P039_PCM_NONFINITE');peak=Math.max(peak,Math.abs(value));}
 if(!peak)throw Error('P039_PCM_SILENT');
}
/** Copy a full decoded source stream into its source-frame schedule. Never split encoded MP3 bytes. */
export function p039PreparePcm(samples:Float32Array,domain:P039AudioDomain):Float32Array {
 if(!['223','234','237'].includes(domain))throw Error('P039_PCM_DOMAIN');
 const plan=SOURCE.streams[domain];validate(samples,plan.decodedSamples);
 const output=new Float32Array(plan.totalSamples);let sourceCursor:number=plan.latencySamples,outputCursor=0;
 for(const part of plan.segments){
  if(part.sourceStart!==sourceCursor||part.sourceEnd<=part.sourceStart||part.sourceEnd>samples.length||part.outputStart<outputCursor||part.outputEnd>output.length||part.outputEnd-part.outputStart!==part.sourceEnd-part.sourceStart)throw Error('P039_PCM_PARTITION');
  output.set(samples.subarray(part.sourceStart,part.sourceEnd),part.outputStart);sourceCursor=part.sourceEnd;outputCursor=part.outputEnd;
 }
 if(sourceCursor!==samples.length)throw Error('P039_PCM_PARTITION');return output;
}
/** Coach branches retain their audited tails beyond local timeline stop, including nonzero source EOF. */
export function p039PrepareCoachPcm(samples:Float32Array,branch:0|1|2|3):Float32Array{
 if(!Number.isInteger(branch)||branch<0||branch>3)throw Error('P039_PCM_BRANCH');
 validate(samples,SOURCE.coach.decodedSamples);
 const part=SOURCE.coach.branches[branch];return samples.slice(part.sourceStart,part.sourceEnd);
}
