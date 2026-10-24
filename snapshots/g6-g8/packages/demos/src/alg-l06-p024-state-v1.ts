/** Maintained P024 branch semantics, not an AVM1 interpreter or original-runtime evidence.
 * The source audits and pinned compatibility Close scope are recorded in P024's brief. */
export const P024_STATE_SOURCE={
 swfSha256:'e36c6c293f1e620f82fa84d57a1b91fd0a977d24d365772126f87333ce359d05',
 behaviorSha256:'ea5f12623231299c2c8b310db63732e86a3eae88037b0467db624c9925fd49f8',
 closeScopeSha256:'b3f10e3093a2b9559be355d7f5cb6dd9d021229ba8697896bb18a272b366cc18',
 originalRuntimeObserved:false, fps:12, rootEntryFrame:6, mainFrames:381, quizFrame:154,
} as const;
export const P024_ANSWERS={
 A:{text:'{0, 10, 100}',button:198,depth:145,correct:false},
 B:{text:'0, 10, 100',button:198,depth:149,correct:false},
 C:{text:'{–1, 0, 1}',button:197,depth:143,correct:true},
 D:{text:'–1, 0, 1',button:199,depth:147,correct:false},
} as const;
/** Host random(N)+1 names, not physical character order or Adobe RNG parity. */
export const P024_FEEDBACK={
 'sprite-69':{kind:'wrong',variant:1,stop:22,close:23,end:31},
 'sprite-83':{kind:'wrong',variant:2,stop:23,close:24,end:29},
 'sprite-97':{kind:'wrong',variant:3,stop:20,close:21,end:28},
 'sprite-155':{kind:'right',variant:1,stop:null,close:null,end:25},
 'sprite-196':{kind:'right',variant:2,stop:null,close:null,end:27},
 'sprite-123':{kind:'right',variant:3,stop:null,close:null,end:31},
 'sprite-188':{kind:'right',variant:4,stop:null,close:null,end:27},
} as const;
export type P024Answer=keyof typeof P024_ANSWERS;
export type P024FeedbackId=keyof typeof P024_FEEDBACK;
export type P024Phase='idle'|'main'|'quiz'|'feedback'|'popup'|'ended';
export type P024GlossaryKey='Range'|'Function'|'Output'|'Set'|'Function table';
export interface P024State {
 locale:'en'|'es'; phase:P024Phase; mainFrame:number; playing:boolean;
 quizSection:boolean; wrongCount:0|1; selected:P024Answer|null;
 feedback:P024FeedbackId|null; feedbackFrame:number; wrongText:string;
 glossary:P024GlossaryKey|null; glossaryReturnPlaying:boolean;
 sa:'idle'|'playing'|'ended'; saReturnPlaying:boolean;
}
export type P024Event=
 |{type:'play'}|{type:'pause'}|{type:'tick';frames:number}
 |{type:'answer';answer:P024Answer;variant:number}|{type:'close-wrong'}
 |{type:'glossary-open';key:P024GlossaryKey;nativeReady:boolean}|{type:'glossary-close'}
 |{type:'sa-start'}|{type:'sa-ended'}|{type:'sa-return'}|{type:'replay'}
 |{type:'locale';locale:'en'|'es'};
export function p024InitialState(locale:'en'|'es'='en'):P024State {
 return {locale,phase:'idle',mainFrame:1,playing:false,quizSection:false,
  wrongCount:0,selected:null,feedback:null,feedbackFrame:1,wrongText:'',
  glossary:null,glossaryReturnPlaying:false,sa:'idle',saReturnPlaying:false};
}
function moving(s:P024State){return s.playing&&!s.glossary&&s.sa==='idle'&&
 (s.phase==='main'||s.phase==='feedback');}
function advanceOne(s:P024State):P024State {
 if(!moving(s))return s;
 if(s.phase==='main'){
  const mainFrame=Math.min(381,s.mainFrame+1);
  if(mainFrame===154&&!s.quizSection&&s.mainFrame<154)
   return {...s,mainFrame,phase:'quiz',playing:false,quizSection:true,wrongCount:0};
  return {...s,mainFrame,phase:mainFrame===381?'ended':'main',playing:mainFrame<381};
 }
 const feedback=s.feedback!;const spec=P024_FEEDBACK[feedback];
 const feedbackFrame=s.feedbackFrame+1;
 if(spec.stop===feedbackFrame)
  return {...s,feedbackFrame,phase:'popup',playing:false};
 if(feedbackFrame>=spec.end){
  const retry=spec.kind==='wrong'&&s.wrongCount===0;
  return {...s,feedback:null,feedbackFrame:1,selected:null,wrongText:'',
   wrongCount:spec.kind==='wrong'?(retry?1:0):s.wrongCount,
   quizSection:retry,phase:retry?'quiz':'main',playing:!retry};
 }
 return {...s,feedbackFrame};
}
/** Event reduction cannot seek past the source quiz or consume a terminal's next main frame. */
export function p024Reduce(s:P024State,event:P024Event):P024State {
 switch(event.type){
  case 'replay':return p024InitialState(s.locale);
  case 'locale':return {...s,locale:event.locale};
  case 'pause':return {...s,playing:false};
  case 'play':return s.glossary||s.sa!=='idle'||['quiz','popup','ended'].includes(s.phase)?s:
   {...s,phase:s.phase==='idle'?'main':s.phase,playing:true};
  case 'tick':{
   if(!Number.isSafeInteger(event.frames)||event.frames<0||event.frames>1000)
    throw new RangeError('P024_INVALID_TICK');
   let next=s;
   for(let i=0;i<event.frames;i++){
    const before=next;next=advanceOne(next);
    if(next===before||next.phase!==before.phase||next.feedback!==before.feedback)break;
   }
   return next;
  }
  case 'answer':{
   if(s.phase!=='quiz'||!s.quizSection||s.glossary||s.sa!=='idle')return s;
   if(!Object.hasOwn(P024_ANSWERS,event.answer))throw new RangeError('P024_INVALID_ANSWER');
   const right=P024_ANSWERS[event.answer].correct;
   if(!Number.isInteger(event.variant)||event.variant<1||event.variant>(right?4:3))
    throw new RangeError('P024_INVALID_FEEDBACK_VARIANT');
   const feedback=(Object.keys(P024_FEEDBACK) as P024FeedbackId[]).find(id=>
    P024_FEEDBACK[id].kind===(right?'right':'wrong')&&P024_FEEDBACK[id].variant===event.variant)!;
   const base=event.answer==='D'?'Since the range is a set, you must put braces around it.':
    'The range is the set of outputs.';
   return {...s,phase:'feedback',playing:true,selected:event.answer,feedback,feedbackFrame:2,
    wrongText:right?'':base+(s.wrongCount===0?' Try again.':'')};
  }
  case 'close-wrong':{
   if(s.phase!=='popup'||!s.feedback||s.glossary||s.sa!=='idle')return s;
   const close=P024_FEEDBACK[s.feedback].close;
   return close===null?s:{...s,feedbackFrame:close,phase:'feedback',playing:true};
  }
  case 'glossary-open':return !event.nativeReady||s.glossary||s.sa!=='idle'?s:
   {...s,glossary:event.key,glossaryReturnPlaying:s.playing,playing:false};
  case 'glossary-close':return !s.glossary?s:{...s,glossary:null,
   // Main remains at quiz154; a separately active feedback child restores its own play state.
   playing:s.glossaryReturnPlaying&&(s.phase==='main'||s.phase==='feedback'),glossaryReturnPlaying:false};
  case 'sa-start':return s.glossary||s.sa!=='idle'?s:
   {...s,sa:'playing',saReturnPlaying:s.playing,playing:false};
  case 'sa-ended':return s.sa!=='playing'?s:{...s,sa:'ended'};
  case 'sa-return':return s.sa==='idle'?s:
   {...s,sa:'idle',playing:s.saReturnPlaying,saReturnPlaying:false};
 }
}
/** Intent only. AudioContext ownership, decoding/seek alignment and disposal belong to the player. */
export function p024AudioIntent(s:P024State){
 if(s.sa==='playing')return {owner:'separate-sa',frame:null} as const;
 if(!moving(s))return null;
 return s.phase==='main'?{owner:'sprite-208',frame:s.mainFrame} as const:
  {owner:s.feedback!,frame:s.feedbackFrame} as const;
}
