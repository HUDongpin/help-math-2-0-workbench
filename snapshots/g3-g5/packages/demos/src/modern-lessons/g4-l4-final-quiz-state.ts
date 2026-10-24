import {gradeCourseG04L03Fq003LegacyScore as gradeLegacy25} from '../timelines/course-g04-l03-fq-003-quiz-interaction';
// Maintained own G4L4 quiz semantics; source and acceptance gates remain independent.
export type QuizMode = 'random-ten' | 'sequential-twenty-five' | 'sequential-twenty-four' | 'sequential-thirty';
export type QuizOption = 'A' | 'B' | 'C' | 'D';
export interface QuizQuestion {readonly id:number;readonly questionFrame:number;readonly reviewFrame:number;readonly options:readonly {readonly option:string;readonly correct:boolean}[]}
export interface QuizResponse {readonly questionId:number;readonly option:QuizOption;readonly correct:boolean}
export interface QuizState {readonly mode:QuizMode;readonly seed:number;readonly order:readonly number[];readonly phase:'question'|'results'|'review'|'finish';readonly questionIndex:number;readonly responses:readonly QuizResponse[];readonly reviewIndex:number|null;readonly finishOverlayVisible:boolean;readonly resultOverlayVisible:boolean;readonly nextDisabled:boolean;readonly legacyCloseRequested:boolean}
const freeze=(s:QuizState):QuizState=>Object.freeze({...s,order:Object.freeze([...s.order]),responses:Object.freeze(s.responses.map(r=>Object.freeze({...r})))});
export function createQuizState(mode:QuizMode,seed:number,drawTen:(seed:number)=>readonly number[],questionPoolSize:24|25|30=25):QuizState {
 if(questionPoolSize!==24&&questionPoolSize!==25&&questionPoolSize!==30)throw new Error('Unsupported source question pool');
 if(mode==='sequential-twenty-five'&&questionPoolSize!==25)throw new Error('Sequential mode is only source-bound to the25question member');
 if(mode==='sequential-twenty-four'&&questionPoolSize!==24)throw new Error('Sequential24 mode requires the exact source24question member');
 if(mode==='sequential-thirty'&&questionPoolSize!==30)throw new Error('Sequential30 mode requires the exact source30question member');
 const normalized=Number.isSafeInteger(seed)?seed>>>0:0,order=mode==='random-ten'?[...drawTen(normalized)]:Array.from({length:questionPoolSize},(_,i)=>i+1);
 if(order.length!==(mode==='random-ten'?10:questionPoolSize)||new Set(order).size!==order.length||order.some(q=>!Number.isInteger(q)||q<1||q>questionPoolSize))throw new Error('Own source question selection contract violated');
 return freeze({mode,seed:normalized,order,phase:'question',questionIndex:0,responses:[],reviewIndex:null,finishOverlayVisible:false,resultOverlayVisible:false,nextDisabled:false,legacyCloseRequested:false});
}
export function answerQuestion(s:QuizState,bank:readonly QuizQuestion[],questionId:number,option:QuizOption):QuizState {
 if(s.phase!=='question'||s.order[s.questionIndex]!==questionId)return s;
 const question=bank.find(q=>q.id===questionId),chosen=question?.options.find(o=>o.option===option);if(!chosen)return s;
 const responses=[...s.responses,{questionId,option,correct:chosen.correct}],index=s.questionIndex+1;
 return freeze({...s,responses,questionIndex:index,phase:index===s.order.length?'results':'question',finishOverlayVisible:index===s.order.length});
}
// Local modern review bridge; legacy report delivery is not executed or claimed.
export function startReview(s:QuizState):QuizState {return s.phase==='results'?freeze({...s,phase:'review',reviewIndex:0,finishOverlayVisible:false}):s}
export function nextReview(s:QuizState):QuizState {
 if(s.phase!=='review'||s.reviewIndex===null||s.nextDisabled)return s;
 const next=s.reviewIndex+1;
 if(next===s.order.length)return freeze({...s,phase:'finish',reviewIndex:next,resultOverlayVisible:true,nextDisabled:s.mode!=='random-ten',legacyCloseRequested:s.mode==='random-ten'});
 return freeze({...s,reviewIndex:next,resultOverlayVisible:s.mode==='random-ten'&&next===s.order.length-1});
}
export function sourceFrame(s:QuizState,bank:readonly QuizQuestion[]):number {
 if(s.phase==='results')return bank.find(q=>q.id===s.order.at(-1))!.questionFrame;
 if(s.phase==='finish')return bank.find(q=>q.id===s.order.at(-1))!.reviewFrame;
 const id=s.phase==='question'?s.order[s.questionIndex]:s.order[s.reviewIndex!],q=bank.find(q=>q.id===id);if(!q)throw new Error('Own source question is missing');return s.phase==='question'?q.questionFrame:q.reviewFrame;
}

/** Own L8 FQ002 has24source questions. The existing deterministic engineering
 * PRNG and without-replacement draw are retained; this is not Flash RNG parity. */
function drawBoundedQuestionOrder(seed:number,questionPoolSize:24|30):readonly number[] {
 let rng=Number.isSafeInteger(seed)?seed>>>0:0;const pool=Array.from({length:questionPoolSize},(_,i)=>i+1),order:number[]=[];
 while(order.length<10){rng=(rng+0x6d2b79f5)>>>0;let value=rng;value=Math.imul(value^(value>>>15),value|1);value^=value+Math.imul(value^(value>>>7),value|61);const random=((value^(value>>>14))>>>0)/4294967296;order.push(pool.splice(Math.floor(random*pool.length),1)[0]!);}
 return Object.freeze(order);
}

export const drawTwentyFourQuestionOrder=(seed=0):readonly number[]=>drawBoundedQuestionOrder(seed,24);
/** Own L9 FQ002: deterministic engineering10-of30; no Flash RNG parity claim. */
export const drawThirtyQuestionOrder=(seed=0):readonly number[]=>drawBoundedQuestionOrder(seed,30);

/** Source score bands remain unnormalized; own sequential30 extends the valid
 * count domain only. The source-specific25member helper stays unchanged. */
export function gradeFinalQuizScore(score:number,questionPoolSize:24|25|30=25):ReturnType<typeof gradeLegacy25> {
 if((questionPoolSize!==24&&questionPoolSize!==25&&questionPoolSize!==30)||!Number.isInteger(score)||score<0||score>questionPoolSize)return null;
 return score>25?'Advanced':gradeLegacy25(score);
}
