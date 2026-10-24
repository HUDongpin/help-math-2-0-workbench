/** ALG001 L7 FQ02: source random-without-replacement, immediate response, Finish/Continue exit.
 * The separate Review label has no in-page entry. Its pure reconstruction below
 * is retained for source audit; ordinary Finish never invokes it.
 */
export type P062Option = 1 | 2 | 3 | 4;
export const P062_ANSWER_KEY: readonly P062Option[] = [2,3,1,1,2,3,4,4,3,3,1,1,2,4,4,1,3,3,1,1,2,3,4,3,4,1,2,3,4,1];
export interface P062Response {readonly questionId:number;readonly option:P062Option;readonly instance:string;readonly correct:boolean;}
export interface P062State {
 readonly phase:'question'|'finish'|'exited'|'left';readonly epoch:number;readonly replay:number;
 readonly currentQuestionId:number;readonly remaining:readonly number[];readonly selectedQuestionIds:readonly number[];
 readonly responses:readonly P062Response[];readonly quizCount:number;readonly reportDispatchCount:0|2;readonly lessonCompleted:false;
}
function draw(s:P062State,index:number):P062State {
 if(!Number.isInteger(index)||index<0||index>=s.remaining.length)throw RangeError('P062_RANDOM_INDEX');
 const id=s.remaining[index]!;
 return {...s,currentQuestionId:id,remaining:s.remaining.filter((_,i)=>i!==index),selectedQuestionIds:[...s.selectedQuestionIds,id],quizCount:s.quizCount+1};
}
export function p062InitialState(index:number,epoch=0,replay=0):P062State {
 return draw({phase:'question',epoch,replay,currentQuestionId:0,remaining:Array.from({length:30},(_,i)=>i+1),selectedQuestionIds:[],responses:[],quizCount:0,reportDispatchCount:0,lessonCompleted:false},index);
}
export type P062Action = {readonly type:'choose';readonly epoch:number;readonly questionId:number;readonly option:P062Option;readonly nextIndex?:number}
 | {readonly type:'continue';readonly epoch:number}
 | {readonly type:'leave';readonly epoch:number}
 | {readonly type:'replay';readonly epoch:number;readonly firstIndex:number};
export function p062Reduce(s:P062State,a:P062Action):P062State {
 if(s.phase==='left'||a.epoch!==s.epoch)return s;
 if(a.type==='leave')return {...s,phase:'left',epoch:s.epoch+1};
 if(a.type==='replay')return p062InitialState(a.firstIndex,s.epoch+1,s.replay+1);
 if(a.type==='continue')return s.phase==='finish'?{...s,phase:'exited',epoch:s.epoch+1}:s;
 if(s.phase!=='question'||a.questionId!==s.currentQuestionId||![1,2,3,4].includes(a.option))return s;
 const responses=[...s.responses,{questionId:a.questionId,option:a.option,instance:`A${a.questionId}Opt${a.option}`,correct:a.option===P062_ANSWER_KEY[a.questionId-1]}];
 // Source increments totQuizCount to 11 before showing Finish; it keeps the last Q on stage.
 if(responses.length===10){if(a.nextIndex!==undefined)throw Error('P062_DRAW_AFTER_TENTH');return {...s,responses,phase:'finish',quizCount:11,reportDispatchCount:2};}
 if(a.nextIndex===undefined)throw Error('P062_NEXT_DRAW_REQUIRED');
 return draw({...s,responses},a.nextIndex);
}
export function p062Grade(correct:number):'Unsatisfactory'|'Partially Proficient'|'Proficient'|'Advanced' {
 if(!Number.isInteger(correct)||correct<0||correct>10)throw RangeError('P062_SCORE');
 return correct<=3?'Unsatisfactory':correct<=6?'Partially Proficient':correct<=8?'Proficient':'Advanced';
}
export function p062Score(s:P062State){const correct=s.responses.filter(r=>r.correct).length;return{correct,total:s.responses.length,wrong:s.responses.length-correct,grade:s.responses.length===10?p062Grade(correct):null};}
export function p062Time(elapsedMs:number){if(!Number.isFinite(elapsedMs)||elapsedMs<0)throw RangeError('P062_ELAPSED');const t=Math.floor(elapsedMs/10);return[Math.floor(t/360000),Math.floor(t/6000)%60,Math.floor(t/100)%60,t%100].map(v=>String(v).padStart(2,'0')).join(':');}
/** Exactly the source doShowReview write order, including its intermediate ordinal comparison. */
export function p062SourceReview(responses:readonly P062Response[],ordinal:number){
 if(responses.length!==10||!Number.isInteger(ordinal)||ordinal<1||ordinal>11)throw Error('P062_REVIEW_RECORD');
 if(ordinal===11)return{kind:'exit' as const,ordinal};
 const r=responses[ordinal-1]!,correct=P062_ANSWER_KEY[r.questionId-1]!;
 const firstComparison=r.instance===`A${ordinal}Opt${P062_ANSWER_KEY[ordinal-1]}`;
 const feedback:('Correct'|'Incorrect'|null)[]=[null,null,null,null];feedback[r.option-1]=firstComparison?'Correct':'Incorrect';feedback[correct-1]='Correct';
 return{kind:'review' as const,ordinal,questionId:r.questionId,frame:r.questionId+50,selected:r.option,correct,feedback,firstComparison,resultWriteTargetsMissing:ordinal===10};
}
/** Deterministic engineering seed only; no assertion that this is Flash's PRNG. */
export function p062Random(seed:number){let a=seed>>>0;return(length:number)=>{if(!Number.isSafeInteger(length)||length<1)throw RangeError('P062_RANDOM_LENGTH');a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return Math.floor(((t^(t>>>14))>>>0)/4294967296*length);};}
