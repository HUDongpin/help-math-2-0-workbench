/** Literal frame-695 handler candidate for course-g04-l09-in-004.
 * Source SWF 0b850b5a0c8ab48d1af46d6ba009a975ab3026237cca266f422b17a77ba771b9.
 * No eval, local timer, implicit New Expression, or three-answer progression.
 * Integer parsing uses an explicit decimal-prefix policy. Number.charAt/length
 * act as absent string members after the authored x mutation. Those primitive
 * choices and browser event dispatch are not original AVM1 execution proof. */
export const G4L9_IN004_EXPRESSIONS = ['12','8 + 7','4 × 6','21','3 × 10','24 – 4 ','45 ÷ 5','5 + 8','4 + 4 ','36'] as const;
export type In004LeftValue = string | number | undefined;
export type In004ScaleLabel = 'leftdown' | 'leftbalance' | 'rightdown' | 'rightbalance';
export const G4L9_IN004_SCALE = {leftdown:[2,10],leftbalance:[11,20],rightdown:[21,30],rightbalance:[31,40]} as const;
export interface In004BalanceState {
 readonly leftText:string;readonly expression:string|undefined;readonly comparison:In004LeftValue;
 readonly rightText:string;readonly history:string;readonly count:number|undefined;
 readonly feedbackSerial:number;readonly activeFeedback:number|null;readonly quizSection:false|undefined;
 readonly focusSerial:number;
}
export type In004BalanceAction =
 | {readonly type:'new-expression';readonly index:number}
 | {readonly type:'key-down'}
 | {readonly type:'right-changed';readonly text:string;readonly scaleFrame:number}
 | {readonly type:'operator';readonly symbol:'+'|'-'|'×'|'÷'}
 | {readonly type:'feedback-complete';readonly serial:number;readonly frame:number};
export type In004BalanceEffect =
 | {readonly kind:'scale';readonly label:In004ScaleLabel;readonly start:number;readonly end:number}
 | {readonly kind:'feedback';readonly serial:number;readonly start:2;readonly end:25};
export const createIn004BalanceState=():In004BalanceState=>({leftText:'                ',expression:undefined,comparison:undefined,rightText:'',history:'',count:undefined,feedbackSerial:0,activeFeedback:null,quizSection:undefined,focusSerial:0});
const integer=(v:string|number)=>Number.parseInt(String(v),10);
const sourceChar=(v:In004LeftValue,i:number)=>typeof v==='string'?v.charAt(i):'';
const sourceLength=(v:In004LeftValue)=>typeof v==='string'?v.length:0;
/** Retains the authored split limit i and x's string-to-number mutation. */
export function evaluateIn004Left(expression:string|undefined):In004LeftValue {
 let x:In004LeftValue=expression;
 for(let i=0;i<sourceLength(x);i++)for(const op of ['+','–','×','÷'] as const)if(sourceChar(x,i)===op){
  const values=(x as string).split(op,i),a=integer(values[0]??'undefined'),b=integer(values[1]??'undefined');
  x=op==='+'?a+b:op==='–'?a-b:op==='×'?a*b:a/b;
 }
 return x;
}
export interface In004RightEvaluation {readonly accumulator:number;readonly comparisonValue:number;readonly pendingOperator:string|null}
/** Pending operations run before recognizing the next character. substr(j,i)
 * uses i as a length, including the source's multi-digit and mixed-op quirks. */
export function evaluateIn004Right(arr:string):In004RightEvaluation {
 let a='',j=0,temp=0,b=false,ad=false,su=false,mu=false,di=false;
 for(let i=0;i<arr.length;i++){
  if(ad){temp=integer(b?temp:a)+integer(arr.substr(j,i));b=true;ad=false;}
  if(su){temp=integer(b?temp:a)-integer(arr.substr(j,i));b=true;su=false;}
  if(mu){temp=integer(b?temp:a)*integer(arr.substr(j,i));b=true;mu=false;}
  if(di){temp=integer(b?temp:a)/integer(arr.substr(j,i));b=true;di=false;}
  if(arr.charAt(i)==='+'){a=arr.substr(j,i);j=i+1;ad=true;}
  if(arr.charAt(i)==='-'){a=arr.substr(j,i);j=i+1;su=true;}
  if(['×','*','x','X'].includes(arr.charAt(i))){a=arr.substr(j,i);j=i+1;mu=true;}
  if(['÷','/'].includes(arr.charAt(i))){a=arr.substr(j,i);j=i+1;di=true;}
 }
 return{accumulator:temp,comparisonValue:temp?temp:integer(arr),pendingOperator:ad?'+':su?'-':mu?'×':di?'÷':null};
}
/** String/string equality remains textual; string/number equality is numeric. */
export function in004SourceEquals(a:In004LeftValue,b:string|number):boolean {
 if(a===undefined)return false;
 return typeof a===typeof b?a===b:Number(a)===Number(b);
}
export function reduceIn004Balance(s:In004BalanceState,a:In004BalanceAction,paused=false):{state:In004BalanceState;effects:readonly In004BalanceEffect[]} {
 if(paused)return{state:s,effects:[]};
 const scale=(label:In004ScaleLabel):In004BalanceEffect=>({kind:'scale',label,start:G4L9_IN004_SCALE[label][0],end:G4L9_IN004_SCALE[label][1]});
 if(a.type==='new-expression'){
  if(!Number.isInteger(a.index)||a.index<0||a.index>=G4L9_IN004_EXPRESSIONS.length)throw new Error('Exact source expression index required');
  const expression=G4L9_IN004_EXPRESSIONS[a.index]!;
  return{state:{...s,leftText:expression,expression,rightText:'',history:'',count:0},effects:[scale('leftdown')]};
 }
 if(a.type==='key-down')return{state:{...s,comparison:evaluateIn004Left(s.expression)},effects:[]};
 if(a.type==='operator')return{state:{...s,rightText:s.rightText+a.symbol,focusSerial:s.focusSerial+1},effects:[]};
 if(a.type==='feedback-complete')return a.frame===25&&a.serial===s.activeFeedback?{state:{...s,rightText:'',activeFeedback:null,quizSection:false},effects:[]}:{state:s,effects:[]};
 if(!Number.isInteger(a.scaleFrame)||a.scaleFrame<1||a.scaleFrame>40)throw new Error('Actual owned source scale frame required');
 const arr=a.text,evaluation=evaluateIn004Right(arr);let state={...s,rightText:arr},frame=a.scaleFrame;const effects:In004BalanceEffect[]=[];
 const move=(label:In004ScaleLabel)=>{frame=G4L9_IN004_SCALE[label][0];const previous=effects.findIndex(e=>e.kind==='scale');if(previous>=0)effects.splice(previous,1);effects.push(scale(label));};
 if(arr===''&&frame!==10)move('leftdown');
 if(Number(s.comparison)>evaluation.comparisonValue&&frame!==10)move('leftdown');
 if(Number(s.comparison)<evaluation.comparisonValue&&frame!==30)move('rightdown');
 if(in004SourceEquals(s.comparison,evaluation.accumulator)||in004SourceEquals(s.comparison,arr)){
  // The source removes a trailing '+' only from local arr, and skips feedback.
  if(arr.charAt(arr.length-1)!=='+'){
   move(frame===30?'rightbalance':'leftbalance');const serial=s.feedbackSerial+1;
   state={...state,count:Number(s.count)+1,history:s.history+'\n '+s.expression+' = '+arr,feedbackSerial:serial,activeFeedback:serial};
   effects.push({kind:'feedback',serial,start:2,end:25});
  }
 }
 return{state,effects};
}
