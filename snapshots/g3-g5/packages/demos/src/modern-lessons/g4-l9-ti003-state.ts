/** Own sprite-502 frame-658 handlers for source91e855e2b86547b38e18b8c84258756db03ea90ada96541116a7a4858065e5d8.
 * The own cached AS comparison establishes the same parser and scale labels as
 * IN004. Pool, history, quiz initialization and popup remain own-page state.
 * Decimal-prefix/coercion policy remains an engineering mapping, not original
 * AVM1 execution proof. No automatic expression, answer count or progression. */
import {evaluateIn004Left,evaluateIn004Right,in004SourceEquals,G4L9_IN004_SCALE,type In004LeftValue,type In004ScaleLabel} from './g4-l9-in004-state';
export const G4L9_TI003_EXPRESSIONS=['18','5 + 6','6 × 6','35','4 × 10','35 – 10','24 ÷ 2','9 + 12','8 + 6','24'] as const;
export const G4L9_TI003_SCALE=G4L9_IN004_SCALE;
export interface Ti003BalanceState {
 readonly leftText:string;readonly expression:string|undefined;readonly comparison:In004LeftValue;
 readonly rightText:string;readonly history:string;readonly quizSection:boolean;readonly quizDragCount:0;
 readonly feedbackSerial:number;readonly activeFeedback:number|null;readonly focusSerial:number;readonly popupVisible:boolean;
}
export type Ti003BalanceAction=
 |{readonly type:'new-expression';readonly index:number}
 |{readonly type:'key-down'}
 |{readonly type:'right-changed';readonly text:string;readonly scaleFrame:number}
 |{readonly type:'operator';readonly symbol:'+'|'-'|'×'|'÷'}
 |{readonly type:'feedback-complete';readonly serial:number;readonly frame:number}
 |{readonly type:'open-help'}|{readonly type:'close-help'};
export type Ti003BalanceEffect=
 |{readonly kind:'scale';readonly label:In004ScaleLabel;readonly start:number;readonly end:number}
 |{readonly kind:'feedback';readonly serial:number;readonly start:2;readonly end:25};
export const createTi003BalanceState=():Ti003BalanceState=>({leftText:'                ',expression:undefined,comparison:undefined,rightText:'',history:'',quizSection:true,quizDragCount:0,feedbackSerial:0,activeFeedback:null,focusSerial:0,popupVisible:false});
export function reduceTi003Balance(s:Ti003BalanceState,a:Ti003BalanceAction,paused=false):{state:Ti003BalanceState;effects:readonly Ti003BalanceEffect[]}{
 if(paused)return{state:s,effects:[]};
 const scale=(label:In004ScaleLabel):Ti003BalanceEffect=>({kind:'scale',label,start:G4L9_TI003_SCALE[label][0],end:G4L9_TI003_SCALE[label][1]});
 if(a.type==='open-help'||a.type==='close-help'){const popupVisible=a.type==='open-help';return{state:s.popupVisible===popupVisible?s:{...s,popupVisible},effects:[]};}
 if(a.type==='new-expression'){
  if(!Number.isInteger(a.index)||a.index<0||a.index>=G4L9_TI003_EXPRESSIONS.length)throw Error('Exact own TI003 source expression index required');
  const expression=G4L9_TI003_EXPRESSIONS[a.index]!;return{state:{...s,leftText:expression,expression,rightText:'',history:''},effects:[scale('leftdown')]};
 }
 if(a.type==='key-down')return{state:{...s,comparison:evaluateIn004Left(s.expression)},effects:[]};
 if(a.type==='operator')return{state:{...s,rightText:s.rightText+a.symbol,focusSerial:s.focusSerial+1},effects:[]};
 if(a.type==='feedback-complete')return a.frame===25&&a.serial===s.activeFeedback?{state:{...s,rightText:'',activeFeedback:null,quizSection:false},effects:[]}:{state:s,effects:[]};
 if(!Number.isInteger(a.scaleFrame)||a.scaleFrame<1||a.scaleFrame>40)throw Error('Actual owned TI003 source scale frame required');
 const arr=a.text,evaluation=evaluateIn004Right(arr);let state={...s,rightText:arr},frame=a.scaleFrame;const effects:Ti003BalanceEffect[]=[];
 const move=(label:In004ScaleLabel)=>{frame=G4L9_TI003_SCALE[label][0];const previous=effects.findIndex(e=>e.kind==='scale');if(previous>=0)effects.splice(previous,1);effects.push(scale(label));};
 if(arr===''&&frame!==10)move('leftdown');
 if(Number(s.comparison)>evaluation.comparisonValue&&frame!==10)move('leftdown');
 if(Number(s.comparison)<evaluation.comparisonValue&&frame!==30)move('rightdown');
 if(in004SourceEquals(s.comparison,evaluation.accumulator)||in004SourceEquals(s.comparison,arr)){
  if(arr.charAt(arr.length-1)!=='+'){
   move(frame===30?'rightbalance':'leftbalance');const serial=s.feedbackSerial+1;
   state={...state,history:s.history+'\n   '+s.expression+' = '+arr,feedbackSerial:serial,activeFeedback:serial};
   effects.push({kind:'feedback',serial,start:2,end:25});
  }
 }
 return{state,effects};
}
