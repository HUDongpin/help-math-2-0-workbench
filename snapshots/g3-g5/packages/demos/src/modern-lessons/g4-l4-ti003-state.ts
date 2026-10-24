import {G4_L4_TI003_SOURCE_DATA as SOURCE} from './generated/g4-l4-ti003-source-v1';
export const TI003_QUESTIONS=SOURCE.questions;
export type Ti003Question=typeof TI003_QUESTIONS[number];
export interface Ti003PracticeState {
  readonly seed:number;readonly bag:readonly number[];readonly current:number|null;
  readonly draws:number;readonly answer:string;readonly mode:'intro'|'answering'|'wrong'|'correct';readonly help:boolean;
}
export function createTi003Practice(seed:number):Ti003PracticeState{return{seed:seed>>>0,bag:[],current:null,draws:0,answer:'',mode:'intro',help:false};}
/** A deterministic replacement for source random(bag.length), retaining its
 * without-replacement bag and refill rule. It is not Flash PRNG equivalence. */
export function drawTi003Question(state:Ti003PracticeState):Ti003PracticeState {
  if(state.mode!=='intro'&&state.mode!=='correct')return state;
  const bag=state.bag.length?[...state.bag]:TI003_QUESTIONS.map((_,i)=>i);
  const seed=(Math.imul(state.seed,1664525)+1013904223)>>>0,index=Math.floor(seed/4294967296*bag.length),[current]=bag.splice(index,1);
  return{...state,seed,bag,current:current!,draws:state.draws+1,answer:'',mode:'answering',help:false};
}
export type Ti003PracticeAction={type:'reset';seed:number}|{type:'new-problem'}|{type:'type';value:string}|{type:'submit'}|{type:'close-wrong'}|{type:'open-help'}|{type:'close-help'};
export function reduceTi003Practice(state:Ti003PracticeState,action:Ti003PracticeAction):Ti003PracticeState {
  if(action.type==='reset')return createTi003Practice(action.seed);
  if(action.type==='new-problem')return state.help?state:drawTi003Question(state);
  if(action.type==='close-help')return{...state,help:false};
  if(action.type==='open-help')return state.mode==='answering'&&state.current!==10?{...state,help:true}:state;
  if(state.help)return state;
  if(action.type==='type')return state.mode==='answering'?{...state,answer:action.value}:state;
  if(action.type==='submit'&&state.current!==null&&state.mode==='answering'){
    // The source compares two strings, including punctuation and whitespace.
    return{...state,mode:state.answer===TI003_QUESTIONS[state.current]!.answer?'correct':'wrong'};
  }
  if(action.type==='close-wrong'&&state.mode==='wrong')return{...state,answer:'',mode:'answering'};
  return state;
}
export function ti003PlaceDigits(value:string,decimal:boolean){
  const number=Number(value.replaceAll(',',''));const scaled=Math.round(number*(decimal?100:1));
  return[1000,100,10,1].map(place=>Math.floor(scaled/place)%10);
}
export function getTi003Prelude(frame:number){
  const demo=SOURCE.demoFrames.filter(value=>value.frame<=frame).at(-1);
  const pointer=demo?.pointer&&demo.pointer.alpha>0?demo.pointer:null;
  return{instruction:SOURCE.instructionFrames.filter(value=>value.frame<=frame).at(-1)?.instruction??'',
    graph:frame>=2,buttons:frame>=7,operands:frame>=100,blocks:frame>=214,
    pointer,pointedControl:pointer?(frame<106?'new':frame<166?'operands':frame<195?'answer':'enter'):null,
    newPressed:demo?.newPressed??false,enterPressed:demo?.enterPressed??false,caretVisible:demo?.caretVisible??false,
    answer:frame>=191?'5,680':frame>=188?'568':frame>=185?'56':frame>=182?'5':''};
}
