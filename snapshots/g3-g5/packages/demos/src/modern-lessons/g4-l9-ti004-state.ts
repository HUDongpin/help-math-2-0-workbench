/** Own source134 interactive frame118. Pure proposals only: a host adapter must
 * commit effects atomically after exact source-owned clock/frame acceptance.
 * Keyboard selection is a modern equivalent to authored startDrag/drop, not an
 * AVM1 or original-runtime claim. Help/final gating is specific to this page. */
export const TI004_CARDS=[
 {id:'Scr_1',text:'10 × 2 ',target:null},
 {id:'Scr_4',text:'18 – 2',target:'Mc_Tar_4'},
 {id:'Scr_5',text:'3 × 4',target:'Mc_Tar_5'},
 {id:'Scr_6',text:'4 + 4',target:null},
 {id:'Scr_2',text:'(3 +4) × 2',target:'Mc_Tar_2'},
 {id:'Scr_3',text:'2 × 9',target:'Mc_Tar_3'},
] as const;
export type Ti004Card=typeof TI004_CARDS[number]['id'];
export type Ti004Child='wrong'|'highlight'|'coach'|'final';
export interface Ti004State {
 readonly placed:readonly Ti004Card[];readonly selected:Ti004Card|null;
 readonly wrongOpen:boolean;readonly helpOpen:boolean;readonly cardsEnabled:boolean;readonly helpEnabled:boolean;readonly phase:'idle'|'coach'|'final'|'continued';
 readonly quizSection:boolean;readonly quizDragCount:number;readonly eventSerial:number;
 readonly active:Readonly<Partial<Record<Ti004Child,number>>>;readonly wrongStoppedAt:1|15;readonly highlightVisible:boolean;
}
export const createTi004State=():Ti004State=>({placed:[],selected:null,wrongOpen:false,helpOpen:false,cardsEnabled:true,helpEnabled:true,phase:'idle',quizSection:true,quizDragCount:0,eventSerial:0,active:{},wrongStoppedAt:1,highlightVisible:false});
export type Ti004Action={type:'select';card:Ti004Card}|{type:'drop';card?:Ti004Card;target:string|null}|{type:'help';open:boolean}|{type:'close-wrong'}|{type:'source-complete';child:Ti004Child;serial:number;frame:number};
export type Ti004Effect={kind:'children';serial:number;children:readonly {child:Ti004Child;start:number;end:number}[]}|{kind:'parent';from:118;to:119;stop:119};
const CHILD_RANGES={wrong:[2,15],highlight:[2,7],coach:[2,20],final:[2,25]} as const;
export const ti004CardsEnabled=(s:Ti004State)=>s.phase!=='continued'&&s.cardsEnabled&&!s.helpOpen;
export const ti004HelpEnabled=(s:Ti004State)=>s.phase!=='continued'&&s.helpEnabled&&!s.helpOpen;
export function proposeTi004(s:Ti004State,a:Ti004Action,paused=false):{state:Ti004State;effects:readonly Ti004Effect[]}{
 const stay=()=>({state:s,effects:[]});if(paused)return stay();if(s.phase==='continued'&&a.type!=='close-wrong'&&!(a.type==='source-complete'&&a.child==='wrong'))return stay();
 if(a.type==='help'){
  if(a.open){if(!ti004HelpEnabled(s))return stay();return{state:{...s,helpOpen:true,selected:null,cardsEnabled:false,helpEnabled:false},effects:[]};}
  return s.helpOpen?{state:{...s,helpOpen:false,cardsEnabled:true,helpEnabled:true},effects:[]}:stay();
 }
 if(a.type==='close-wrong')return s.wrongOpen?{state:{...s,wrongOpen:false,cardsEnabled:s.phase!=='continued',helpEnabled:s.phase!=='continued'},effects:[]}:stay();
 if(a.type==='source-complete'){
  if(s.active[a.child]!==a.serial||a.frame!==CHILD_RANGES[a.child][1])return stay();
  const active={...s.active};delete active[a.child];
  if(a.child==='wrong')return{state:{...s,active,wrongStoppedAt:15},effects:[]};
  if(a.child==='highlight')return{state:{...s,active,highlightVisible:false},effects:[]};
  if(a.child==='coach'){
   if(s.phase!=='coach')return stay();
   if(s.quizDragCount<4)return{state:{...s,active,phase:'idle',cardsEnabled:true,helpEnabled:true},effects:[]};
   const serial=s.eventSerial+1;return{state:{...s,active:{...active,final:serial},phase:'final',eventSerial:serial,cardsEnabled:false,helpEnabled:true},effects:[{kind:'children',serial,children:[{child:'final',start:2,end:25}]}]};
  }
  if(s.phase!=='final'||s.quizDragCount!==4)return stay();
  delete active.highlight;return{state:{...s,active,phase:'continued',quizSection:false,selected:null,helpOpen:false,cardsEnabled:false,helpEnabled:false,highlightVisible:false},effects:[{kind:'parent',from:118,to:119,stop:119}]};
 }
 if(!ti004CardsEnabled(s))return stay();
 const id=a.type==='select'?a.card:a.card??s.selected,card=TI004_CARDS.find(c=>c.id===id);if(!card||s.placed.includes(card.id))return stay();
 if(a.type==='select')return s.selected===card.id?stay():{state:{...s,selected:card.id},effects:[]};
 const correct=card.target!==null&&a.target===card.target,serial=s.eventSerial+1;
 if(correct)return{state:{...s,selected:null,placed:[...s.placed,card.id],quizDragCount:s.quizDragCount+1,phase:'coach',eventSerial:serial,cardsEnabled:false,helpEnabled:false,active:{...s.active,coach:serial}},effects:[{kind:'children',serial,children:[{child:'coach',start:2,end:20}]}]};
 return{state:{...s,selected:null,wrongOpen:true,wrongStoppedAt:1,highlightVisible:true,eventSerial:serial,cardsEnabled:false,helpEnabled:false,active:{...s.active,wrong:serial,highlight:serial}},effects:[{kind:'children',serial,children:[{child:'wrong',start:2,end:15},{child:'highlight',start:2,end:7}]}]};
}
