import {P052_AUDIO_PLANS} from './generated/nms-l02-p052-runtime-audio-v1';
export function p052AudioPlan(domain:string){
 if(!Object.hasOwn(P052_AUDIO_PLANS,domain))throw Error('P052_AUDIO_DOMAIN');
 return P052_AUDIO_PLANS[domain as keyof typeof P052_AUDIO_PLANS];
}
/** Complete stream preparation. Retains the source frame102 discrepancy, not a repair. */
export function p052PrepareSourcePcm(domain:string,input:Float32Array):Float32Array{
 const plan=p052AudioPlan(domain);
 if(input.length!==plan.decodedSamples)throw Error('P052_AUDIO_LENGTH');
 let nonzero=false;
 for(const sample of input){if(!Number.isFinite(sample))throw Error('P052_AUDIO_NONFINITE');nonzero||=sample!==0;}
 if(!nonzero)throw Error('P052_AUDIO_SILENT');
 const output=new Float32Array(plan.totalSamples);let cursor:number=plan.latencySamples,end=0;
 for(const s of plan.segments){
  if(s.sourceStart!==cursor||s.sourceEnd<=cursor||s.sourceEnd>input.length||s.outputStart<end
   ||s.outputEnd>output.length||s.outputEnd-s.outputStart!==s.sourceEnd-s.sourceStart)throw Error('P052_AUDIO_PARTITION');
  output.set(input.subarray(s.sourceStart,s.sourceEnd),s.outputStart);cursor=s.sourceEnd;end=s.outputEnd;
 }
 if(cursor!==input.length||end!==output.length)throw Error('P052_AUDIO_PARTITION');
 return output;
}
