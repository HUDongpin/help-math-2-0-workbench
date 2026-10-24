/** Maintained projection of L7GS03, sprite303. Matching is by source instance
 * name. Source display-list/card text is generated separately; no RNG or
 * mathematical correction is introduced. Original AVM1 execution is unaccepted. */
export type P052Level=1|2;
export type P052Card=`Mc${1|2|3|4|5|6}_${1|2}`;
export type P052FeedbackId=157|170;
export interface P052Feedback {readonly frame:number;readonly generation:number;readonly playing:boolean;}
export interface P052Fade {readonly pair:number;readonly elapsedMs:number;readonly generation:number;}
export interface P052State {
 readonly epoch:number;readonly replay:number;readonly entryLevel:P052Level;readonly level:P052Level;
 readonly phase:'game'|'complete'|'left';readonly mainFrame:2|3|4|5;readonly paused:boolean;
 readonly score:number;readonly completedFeedbackCount:number;readonly selected:P052Card|null;
 readonly matched:readonly number[];readonly fades:readonly P052Fade[];readonly selectionSerial:number;
 readonly feedback:Readonly<Partial<Record<P052FeedbackId,P052Feedback>>>;
 readonly cardsEnabled:boolean;readonly popup:boolean;readonly nextLevel:P052Level|null;
 readonly quizSection:boolean;readonly lessonCompleted:false;
}
export type P052Action={readonly epoch:number}&(
 |{type:'choose';card:P052Card}
 |{type:'advance-feedback';id:P052FeedbackId;frame:number;generation:number}
 |{type:'advance-fades';elapsedMs:number;generation:number}
 |{type:'select-level';level:P052Level}
 |{type:'pause'|'play'|'open-directions'|'close-directions'|'start'|'replay'|'leave'}
);
const validLevel=(v:unknown):v is P052Level=>v===1||v===2;
export function p052InitialState(entryLevel:P052Level=1,epoch=0,replay=0):P052State{
 if(!validLevel(entryLevel)||!Number.isSafeInteger(epoch)||epoch<0||!Number.isSafeInteger(replay)||replay<0)throw new RangeError('P052 invalid identity');
 return{epoch,replay,entryLevel,level:entryLevel,phase:'game',mainFrame:entryLevel===1?2:4,paused:false,
 score:0,completedFeedbackCount:0,selected:null,matched:[],fades:[],selectionSerial:0,feedback:{},cardsEnabled:true,popup:false,nextLevel:null,quizSection:true,lessonCompleted:false};
}
export function p052CardPair(card:P052Card):number{
 if(!/^Mc[1-6]_[12]$/.test(card))throw new RangeError('P052 unknown card');return Number(card[2]);
}
export function p052CardAppearance(s:P052State,card:P052Card){
 const pair=p052CardPair(card),matched=s.matched.includes(pair),fade=s.fades.find(f=>f.pair===pair),steps=fade?Math.floor((fade.elapsedMs+1e-7)/100):0;
 const sourceAlpha=matched?(fade?100-Math.min(steps,3)*40:-20):100;
 return{sourceFrame:s.selected===card?2:1,selected:s.selected===card,matched,sourceAlpha,
 opacity:Math.max(0,sourceAlpha)/100,visible:!matched||Boolean(fade&&steps<4),revealed:matched&&(!fade||steps>=1),
 enabled:s.phase==='game'&&s.cardsEnabled&&!s.popup&&!matched};
}
export function p052Reduce(s:P052State,a:P052Action):P052State{
 if(a.epoch!==s.epoch||s.phase==='left')return s;
 switch(a.type){
  case'choose':{
   const pair=p052CardPair(a.card);if(!p052CardAppearance(s,a.card).enabled)return s;
   if(s.selected===null)return{...s,selected:a.card,selectionSerial:s.selectionSerial+1};
   const correct=s.selected!==a.card&&p052CardPair(s.selected)===pair,id:P052FeedbackId=correct?170:157;
   const generation=(s.feedback[id]?.generation??0)+1;
   return{...s,selected:null,selectionSerial:s.selectionSerial+1,cardsEnabled:false,paused:false,
    score:s.score+(correct?10:-2),matched:correct?[...s.matched,pair]:s.matched,
    fades:correct?[...s.fades,{pair,elapsedMs:0,generation:s.selectionSerial+1}]:s.fades,
    feedback:{...s.feedback,[id]:{frame:2,generation,playing:true}}};
  }
  case'advance-feedback':{
   const f=s.feedback[a.id],last=a.id===170?27:28;
   if(!f||!f.playing||s.paused||f.generation!==a.generation)return s;
   if(!Number.isSafeInteger(a.frame)||a.frame<f.frame||a.frame>last)throw new RangeError('P052 invalid feedback cursor');
   if(a.frame===f.frame)return s;
   const feedback={...s.feedback,[a.id]:{...f,frame:a.frame,playing:a.frame<last}};
   if(a.frame<last)return{...s,feedback};
   const count=s.completedFeedbackCount+(a.id===170?1:0);
   // Both source feedback endings call enableMc, even if a directions popup
   // was opened. The modal still shields cards until Close, which enables them.
   if(count>=6)return{...s,feedback:{},phase:'complete',mainFrame:s.level===1?3:5,completedFeedbackCount:0,
    selected:null,cardsEnabled:false,popup:false,quizSection:false,nextLevel:null,fades:[]};
   return{...s,feedback,cardsEnabled:true,completedFeedbackCount:count};
  }
  case'advance-fades':{
   if(s.paused||s.phase!=='game'||a.generation!==s.selectionSerial)return s;
   if(!Number.isFinite(a.elapsedMs)||a.elapsedMs<0)throw new RangeError('P052 invalid fade delta');
   if(!s.fades.length||a.elapsedMs===0)return s;
   return{...s,fades:s.fades.map(f=>({...f,elapsedMs:Math.min(400,f.elapsedMs+a.elapsedMs)})).filter(f=>f.elapsedMs<400)};
  }
  case'pause':return s.paused?s:{...s,paused:true};
  case'play':return!s.paused?s:{...s,paused:false};
  case'open-directions':return s.popup?s:{...s,popup:true,cardsEnabled:false};
  case'close-directions':return!s.popup?s:{...s,popup:false,cardsEnabled:s.phase==='game'};
  case'select-level':if(!validLevel(a.level))throw new RangeError('P052 invalid level');return s.phase!=='complete'||s.popup?s:{...s,nextLevel:a.level};
  case'start':{
   if(s.phase!=='complete'||s.popup||s.nextLevel===null)return s;
   return{...p052InitialState(s.entryLevel,s.epoch+1,s.replay),level:s.nextLevel,mainFrame:s.nextLevel===1?2:4};
  }
  case'replay':return p052InitialState(s.entryLevel,s.epoch+1,s.replay+1);
  case'leave':return{...s,epoch:s.epoch+1,phase:'left',paused:true,cardsEnabled:false,popup:false,selected:null,feedback:{},fades:[],quizSection:false};
 }
}
