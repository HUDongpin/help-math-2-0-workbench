/** P052 unregistered native state kernel; see NATIVE_BEHAVIOR_CONTRACT_V1.md. */
export type P052Phase='intro'|'practice'|'wrong'|'right'|'outro'|'complete';
export type P052Term='Square'|'Column';
export type P052State=Readonly<{
 seed:number;epoch:number;phase:P052Phase;frame:number;percent:number;tryCount:0|1;
 wrongOrdinal:number;outcome:null|'correct'|'revealed';help:boolean;glossary:P052Term|null;
 paused:boolean;audioCue:string|null;
}>;
export type P052Event={epoch:number}&(
 {type:'frame';frame:number}|{type:'intro-ready'}|{type:'outro-ended'}|
 {type:'value';percent:number}|{type:'submit'}|{type:'reset'}|{type:'close-feedback'}|
 {type:'open-help'}|{type:'close-help'}|{type:'open-glossary';term:P052Term}|
 {type:'close-glossary'}|{type:'pause';paused:boolean}|{type:'replay'}
);
function requireInteger(n:number,min:number,max:number,label:string){
 if(!Number.isSafeInteger(n)||n<min||n>max)throw Error(`P052_${label}`);
}
export function p052WrongCue(seed:number,ordinal:number):string{
 requireInteger(seed,0,0xffffffff,'SEED');requireInteger(ordinal,0,0xffffffff,'ORDINAL');
 let x=(seed^Math.imul(ordinal+1,0x9e3779b9))>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;
 return `wrong-S${(x>>>0)%4+1}`;
}
export function createP052State(seed=0,epoch=0):P052State{
 requireInteger(seed,0,0xffffffff,'SEED');requireInteger(epoch,0,Number.MAX_SAFE_INTEGER-1,'EPOCH');
 return {seed,epoch,phase:'intro',frame:1,percent:0,tryCount:0,wrongOrdinal:0,outcome:null,
  help:false,glossary:null,paused:false,audioCue:'intro'};
}
export function p052CanAnswer(s:P052State):boolean{return s.phase==='practice'&&!s.paused&&!s.help&&!s.glossary;}
export function reduceP052(s:P052State,e:P052Event):P052State{
 if(e.epoch!==s.epoch)return s;
 if(e.type==='replay')return createP052State(s.seed,s.epoch+1);
 if(e.type==='pause')return {...s,paused:e.paused};
 if(s.paused)return s;
 switch(e.type){
  case 'frame':{
   requireInteger(e.frame,1,156,'FRAME');
   if(s.phase!=='intro'&&s.phase!=='outro')return s;
   const end=s.phase==='intro'?115:156;
   return {...s,frame:Math.max(s.frame,Math.min(end,e.frame))};
  }
  case 'intro-ready':return s.phase==='intro'?{...s,phase:'practice',frame:115,audioCue:null}:s;
  case 'outro-ended':return s.phase==='outro'?{...s,phase:'complete',frame:156,audioCue:null}:s;
  case 'value':
   if(!p052CanAnswer(s))return s;
   requireInteger(e.percent,0,100,'PERCENT');return {...s,percent:e.percent};
  case 'reset':return p052CanAnswer(s)?{...s,percent:0}:s;
  case 'submit':{
   if(!p052CanAnswer(s))return s;
   if(s.percent===75)return {...s,phase:'right',outcome:'correct',audioCue:'correct'};
   const audioCue=p052WrongCue(s.seed,s.wrongOrdinal),wrongOrdinal=s.wrongOrdinal+1;
   return s.tryCount===0?{...s,phase:'wrong',tryCount:1,wrongOrdinal,audioCue}:
    {...s,phase:'right',tryCount:0,percent:75,outcome:'revealed',wrongOrdinal,audioCue};
  }
  case 'close-feedback':
   if(s.phase==='wrong')return {...s,phase:'practice',audioCue:null};
   return s.phase==='right'?{...s,phase:'outro',frame:116,audioCue:'outro'}:s;
  case 'open-help':return p052CanAnswer(s)?{...s,help:true}:s;
  case 'close-help':return s.help&&!s.glossary?{...s,help:false}:s;
  case 'open-glossary':
   if(e.term!=='Square'&&e.term!=='Column')throw Error('P052_TERM');
   return s.help&&!s.glossary?{...s,glossary:e.term}:s;
  case 'close-glossary':return s.glossary?{...s,glossary:null}:s;
 }
}
