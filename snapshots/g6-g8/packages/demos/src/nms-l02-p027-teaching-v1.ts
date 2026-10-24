import{P027_SOURCE_IR as IR}from'./generated/nms-l02-p027-source-ir-v1';
import{p027LocalPoses,p027SourceTeaching}from'./nms-l02-p027-source-query-v1';
export const P027_QUESTION_RUNS=IR.texts.find(t=>t.characterId===12)!.runs;
export const P027_TERM_RUNS:Readonly<Record<number,string>>=Object.freeze({1:'pictorial-model',3:'represent',5:'fraction',7:'pictorial-model',10:'show',12:'equivalent-fraction'});
const direct:Readonly<Record<number,number>>={21:3,22:5,23:10,24:12};
const point=(m:readonly number[],x:number,y:number)=>[m[0]!*x+m[2]!*y+m[4]!,m[1]!*x+m[3]!*y+m[5]!]as const;
const emphasis=Array.from({length:384},(_,i)=>{
 const t=p027SourceTeaching(i+1),q=p027LocalPoses('207',i+1).find(p=>p.characterId===12)!,text=IR.texts.find(t=>t.characterId===12)!;
 return t.emphasis.filter(e=>e.alpha>0).map(e=>{if(e.characterId!==20)return direct[e.characterId]!;const a=IR.texts.find(t=>t.characterId===20)!,r=a.runs[0]!,p=point(a.matrix,r.chars[0]!.x,r.y),x=point(e.matrix,...p)[0];return[1,7].sort((ia,ib)=>{const at=(n:number)=>{const run=P027_QUESTION_RUNS[n]!,p=point(text.matrix,run.chars[0]!.x,run.y);return Math.abs(point(q.matrix,...p)[0]-x);};return at(ia)-at(ib);})[0]!;});
});
const reduced=emphasis.map(a=>[...a]);for(const key of[1,3,5,7,10,12]){const frames=emphasis.flatMap((a,i)=>a.includes(key)?[i]:[]);for(let i=1;i<frames.length;i++)if(frames[i]!-frames[i-1]!<=3)for(let j=frames[i-1]!;j<=frames[i]!;j++)if(!reduced[j]!.includes(key))reduced[j]!.push(key);}
for(const a of[emphasis,reduced]){for(const r of a)Object.freeze(r);Object.freeze(a);}
export function p027EmphasisRuns(frame:number,reducedMotion=false):readonly number[]{p027SourceTeaching(frame);return(reducedMotion?reduced:emphasis)[frame-1]!;}
const smoothFlags=Object.fromEntries((['helpEmphasis','equivalenceEmphasis']as const).map(key=>{const values=Array.from({length:384},(_,i)=>p027SourceTeaching(i+1)[key]),frames=values.flatMap((v,i)=>v?[i]:[]);for(let i=1;i<frames.length;i++)if(frames[i]!-frames[i-1]!<=3)for(let j=frames[i-1]!;j<=frames[i]!;j++)values[j]=true;return[key,Object.freeze(values)];}))as Readonly<Record<'helpEmphasis'|'equivalenceEmphasis',readonly boolean[]>>;
export function p027EmphasisFlag(frame:number,key:'helpEmphasis'|'equivalenceEmphasis',reduced=false){const row=p027SourceTeaching(frame);return reduced?smoothFlags[key][frame-1]!:row[key];}
