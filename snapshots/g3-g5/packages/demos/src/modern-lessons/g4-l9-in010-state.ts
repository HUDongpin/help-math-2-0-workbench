/** Literal own IN010 terminal actions. Source anomalies stay explicit;
 * deterministic seeded draws do not claim Flash RNG or original-runtime parity. */
export const IN010_PROBLEMS=[{text:'x + 4 = 9',drop:4,put:9},{text:'x + 2 = 6',drop:2,put:6},{text:'x + 1 = 8',drop:1,put:8},{text:'x + 5 = 7',drop:5,put:7}]as const;
export type In010Error='lx'|'lone'|'rx'|'rone';
export interface In010Model {readonly pool:readonly string[];readonly random:number;readonly problem:number;readonly round:number;readonly lpos:number;readonly rpos:number;readonly xpos:0|1;readonly lequal:0|1;readonly requal:0|1;readonly cpos:number;readonly leftUnits:readonly number[];readonly leftX:readonly number[];readonly rightUnits:readonly number[];readonly errors:readonly In010Error[];readonly disabledCards:readonly string[];readonly cardPositions:Readonly<Record<string,readonly[number,number]>>;readonly solveEnabled:boolean;readonly newEnabled:boolean;readonly answer:string;readonly highlightVisible:boolean;readonly unboundCalls:readonly string[]}
export type In010Effect={readonly kind:'scale';readonly start:number;readonly end:number}|{readonly kind:'coach';readonly variant:'correct'|'S1'|'S2'|'S3'|'S4'};
export type In010Action={readonly type:'drop';readonly card:string;readonly target:'left'|'right'|null;readonly scaleFrame:number;readonly point?:readonly[number,number]}|{readonly type:'solve'}|{readonly type:'close-error';readonly error:In010Error}|{readonly type:'coach-completed';readonly variant:'correct'|'S1'|'S2'|'S3'|'S4';readonly frame:number}|{readonly type:'highlight-frame9'};
export const in010Card=(id:string)=>id==='x-30'?{kind:'x'as const,lower:true}:id==='x-33'?{kind:'x'as const,lower:false}:/^one-\d{2}$/.test(id)&&Number(id.slice(4))>=36&&Number(id.slice(4))<=96&&Number(id.slice(4))%3===0?{kind:'one'as const,lower:false}:undefined;
export function in010Draw(random:number,size:number){const next=(Math.imul(random>>>0,1664525)+1013904223)>>>0;return{random:next,index:Math.floor(next/4294967296*size)};}
export function selectIn010Problem(pool:readonly string[],index:number){if(pool.length!==4||!Number.isInteger(index)||index<0||index>3)throw Error('Own source pool and draw required');let values=[...pool],selected=index;if(values[selected]===''){for(let i=0;i<values.length;i++){if(values[i]!==''){selected=i;break;}if(i===values.length-1)values=IN010_PROBLEMS.map(p=>p.text);}}const text=values[selected];if(text!==IN010_PROBLEMS[selected]!.text)throw Error('Own source pool membership changed');values[selected]='';return{pool:values,problem:selected};}
export function createIn010Model(seed=0,pool:readonly string[]=IN010_PROBLEMS.map(p=>p.text),round=0):In010Model {const draw=in010Draw(seed,4),p=selectIn010Problem(pool,draw.index);return{...p,random:draw.random,round,lpos:1,rpos:1,xpos:0,lequal:0,requal:0,cpos:0,leftUnits:[],leftX:[],rightUnits:[],errors:[],disabledCards:[],cardPositions:{},solveEnabled:false,newEnabled:false,answer:'',highlightVisible:false,unboundCalls:[]};}
export const in010Complete=(s:In010Model)=>s.lequal===1&&s.requal===1&&s.xpos===1;
export function reduceIn010Model(before:In010Model,a:In010Action):{state:In010Model;effects:readonly In010Effect[]}{
 const none=()=>({state:before,effects:[]});if(a.type==='close-error'){if(!before.errors.includes(a.error))return none();return{state:{...before,errors:before.errors.filter(e=>e!==a.error),unboundCalls:[...before.unboundCalls,'Close:NMHBtn/BtnNew/BtnCheck/BtnDone/BtnS/BtnR']},effects:[]};}
 if(a.type==='coach-completed'){const end={correct:20,S1:16,S2:27,S3:36,S4:54}[a.variant];if(a.frame!==end)return none();return a.variant==='correct'?{state:{...before,solveEnabled:true,highlightVisible:true,unboundCalls:[...before.unboundCalls,'Coach134:BtnNew/NMHBtn']},effects:[]}:none();}
 if(a.type==='highlight-frame9')return before.highlightVisible?{state:{...before,highlightVisible:false},effects:[]}:none();
 if(a.type==='solve'){
  if(!before.solveEnabled)return none();const p=IN010_PROBLEMS[before.problem]!;let leftUnits=[...before.leftUnits],leftX=[...before.leftX],rightUnits=[...before.rightUnits];
  if(in010Complete(before)){leftUnits=leftUnits.filter(i=>i>before.lpos);rightUnits=rightUnits.filter(i=>!(i<=p.put&&i>p.put-p.drop));let temp=0;for(let i=2;i<12;i++)if(leftX.includes(i)){temp=i;break;}leftX=leftX.filter(i=>i>=12);leftX.push(temp%2?1:2);}
  return{state:{...before,leftUnits,leftX,rightUnits,answer:' x = '+(p.put-p.drop),newEnabled:true,solveEnabled:false},effects:[]};
 }
 const card=in010Card(a.card);if(!card)throw Error('Unknown own source drag instance');if(before.disabledCards.includes(a.card))return none();if(!Number.isInteger(a.scaleFrame)||a.scaleFrame<1||a.scaleFrame>40)throw Error('Actual own source scale frame required');const p=IN010_PROBLEMS[before.problem]!,effects:In010Effect[]=[];let s:In010Model={...before},frame=a.scaleFrame;
 const error=(id:In010Error,correct=false)=>{s={...s,errors:[...new Set([...s.errors,id])]};if(correct)effects.push({kind:'coach',variant:'correct'});else{const draw=in010Draw(s.random,4);s={...s,random:draw.random};effects.push({kind:'coach',variant:(['S1','S2','S3','S4']as const)[draw.index]!});}};
 if(card.lower){const positions={...s.cardPositions};if(a.target==='left'&&!s.xpos)delete positions[a.card];else if(a.point)positions[a.card]=a.point;s={...s,cardPositions:positions};}
 if(card.kind==='x'){
  if(a.target==='left'){if(s.xpos)error('lx',card.lower);else s={...s,leftX:[...s.leftX,s.lpos],xpos:1,lpos:s.lpos+1};}
  if(a.target==='right')error('rx',card.lower);
  if(in010Complete(s)){if(card.lower)s={...s,unboundCalls:[...s.unboundCalls,'Mc_Right_Feed(random5):absent-own-definition']};else{effects.push({kind:'coach',variant:'correct'});s={...s,disabledCards:[...s.disabledCards,a.card]};}}
  s={...s,cpos:s.xpos?p.put-p.drop+s.lpos-1:s.lpos-1};
 }else{
  if(a.target==='left'){if(s.lequal)error('lone');else s={...s,leftUnits:[...s.leftUnits,s.lpos],lpos:s.lpos+1};if(s.lpos>p.drop+(s.xpos?1:0))s={...s,lequal:1};}
  if(a.target==='right'){if(s.requal)error('lone');else s={...s,rightUnits:[...s.rightUnits,s.rpos],rpos:s.rpos+1};if(s.rpos>p.put)s={...s,requal:1};}
  if(in010Complete(s)){effects.push({kind:'coach',variant:'correct'});s={...s,disabledCards:[...s.disabledCards,a.card]};}
  s={...s,cpos:s.xpos?p.put-p.drop+s.lpos-1:s.lpos};
 }
 const scale=(start:number,end:number)=>{frame=start;const old=effects.findIndex(e=>e.kind==='scale');if(old>=0)effects.splice(old,1);effects.push({kind:'scale',start,end});};
 if(s.cpos>s.rpos&&frame!==10)scale(2,10);
 if(s.cpos<s.rpos&&frame!==30)scale(frame===10?11:20,20);
 if(s.cpos===s.rpos){if(frame===30)scale(31,40);if(frame===10)scale(11,20);}
 return{state:s,effects};
}
