import{P033_TEACHING_DATA as DATA}from'./generated/nms-l02-p033-teaching-data-v1';
import type{P033SessionState}from'./nms-l02-p033-state-v1';
export interface P033QuestionRun{readonly sourceTextId:string;readonly text:string;readonly termId:string|null;readonly fractions:readonly number[];}
export interface P033Highlight{readonly characterId:number;readonly matrix:readonly number[];readonly alpha:number;}
export interface P033TeachingState{
 readonly questionAlpha:number;readonly questionRuns:readonly P033QuestionRun[];readonly modelAlpha:number;
 readonly optionAlphas:readonly number[];readonly helpLabelAlpha:number;readonly chartAlpha:number;
 readonly highlights:readonly P033Highlight[];readonly decimalEmphasis:boolean;readonly tenthsEmphasis:boolean;
 readonly hundredthsEmphasis:boolean;readonly chartTermsAvailable:boolean;
}
export interface P033TeachingData{readonly animationId:string;readonly sourceSha256:string;readonly states:readonly P033TeachingState[];readonly frames:readonly number[];}
function freeze<T>(v:T):T{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const child of Object.values(v))freeze(child);}return v;}freeze(DATA);
export function p033Teaching(s:Pick<P033SessionState,'mainFrame'>):P033TeachingState{
 if(!Number.isSafeInteger(s.mainFrame)||s.mainFrame<1||s.mainFrame>298)throw Error('P033_TEACHING_FRAME');
 return DATA.states[DATA.frames[s.mainFrame-1]];
}
export function p033QuestionText(s:Pick<P033SessionState,'mainFrame'>){const t=p033Teaching(s);if(t.questionAlpha<=0)return '';let text='';for(const run of t.questionRuns)for(let i=0;i<run.text.length;i++){if(run.fractions[i]!==1)return text;text+=run.text[i];}return text;}
export function p033QuestionDecimalReadable(s:Pick<P033SessionState,'mainFrame'>){const t=p033Teaching(s),run=t.questionRuns.find(r=>r.termId==='decimal');return t.questionAlpha>0&&!!run&&run.fractions.every(f=>f===1);}
export function p033Highlights(s:Pick<P033SessionState,'mainFrame'>,reducedMotion=false){
 const f=s.mainFrame,t=p033Teaching(s);
 if(!reducedMotion)return t.highlights;
 if(f>=214&&f<=224)return p033Teaching({mainFrame:214}).highlights;
 if(f>=234&&f<=242)return p033Teaching({mainFrame:234}).highlights;
 return t.highlights;
}
export function p033DecimalEmphasis(s:Pick<P033SessionState,'mainFrame'>,reducedMotion=false){return reducedMotion?s.mainFrame>=183&&s.mainFrame<=193:p033Teaching(s).decimalEmphasis;}
