import {P031_TEACHING_DATA as DATA}from'./generated/nms-l02-p031-teaching-data-v1';
import type {P031SessionState}from'./nms-l02-p031-state-v1';
export interface P031SourcePose {readonly characterId:number;readonly depth:number;readonly matrix:readonly number[];readonly color:readonly number[];readonly ratio:number;readonly clipDepth:number;readonly name:string|null;readonly birthFrame:number;readonly generation:number;}
export interface P031QuestionRun {readonly sourceTextId:string;readonly text:string;readonly termId:string|null;readonly fractions:readonly number[];}
export interface P031TeachingState {
 readonly questionAlpha:number;readonly questionRuns:readonly P031QuestionRun[];readonly modelAlpha:number;readonly modelPoses:readonly P031SourcePose[];readonly optionAlphas:readonly number[];readonly optionTextPoses:readonly P031SourcePose[];
 readonly sevenDigitAlpha:number;readonly zeroDigitAlpha:number;readonly pointAlpha:number;readonly digitPoses:readonly P031SourcePose[];readonly highlightPoses:readonly P031SourcePose[];
 readonly chartAlpha:number;readonly chartPoses:readonly P031SourcePose[];readonly chartTextPoses:readonly P031SourcePose[];readonly sourceTermPoses:readonly P031SourcePose[];readonly helpButtonPoses:readonly P031SourcePose[];
}
export interface P031TeachingData {readonly sourceSha256:string;readonly states:readonly P031TeachingState[];readonly frames:readonly number[];}
function freeze<T>(v:T):T{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const child of Object.values(v))freeze(child);}return v;}freeze(DATA);
/** Query the preserved main frame; feedback clocks do not advance the question. */
export function p031Teaching(s:Pick<P031SessionState,'mainFrame'>):P031TeachingState {
 if(!Number.isSafeInteger(s.mainFrame)||s.mainFrame<1||s.mainFrame>339)throw Error('P031_TEACHING_FRAME');
 return DATA.states[DATA.frames[s.mainFrame-1]];
}
/** Accessible text stops at the first partial glyph; later no-ink spaces cannot skip that glyph. */
export function p031QuestionText(s:Pick<P031SessionState,'mainFrame'>){const t=p031Teaching(s);if(t.questionAlpha<=0)return '';let text='';for(const r of t.questionRuns)for(let i=0;i<r.text.length;i++){if(r.fractions[i]!==1)return text;text+=r.text[i];}return text;}
export function p031QuestionDecimalReadable(s:Pick<P031SessionState,'mainFrame'>){const t=p031Teaching(s),r=t.questionRuns.find(r=>r.termId==='decimal');return t.questionAlpha>0&&!!r&&r.fractions.every(v=>v===1);}
