/** Source family recovered from ALG001 L7 P039: named feedback4, wrong count
 * at feedback exit, static help, nested glossary and a stopped final frame.
 * Existing looping and hold-only Close reducers have different source contracts. */
export type FixedExitHelpBranchV1<I extends number>={readonly spriteId:I;readonly terminal:number}&({readonly kind:'right'}|{readonly kind:'wrong';readonly closeFirst:number;readonly hold:number;readonly closeJump:number});
export interface FixedExitHelpSourceV1<T extends string,I extends number>{readonly mainFrameCount:number;readonly quizFrame:number;readonly postQuizFrame:number;readonly correctAnswer:1|2|3|4;readonly branches:readonly FixedExitHelpBranchV1<I>[];readonly answers:readonly {readonly answer:1|2|3|4;readonly wrongFirst:string|null;readonly wrongLater:string|null}[];readonly helpTerms:readonly T[];readonly visualStates:readonly {readonly first:number;readonly last:number;readonly value:{readonly terms:readonly T[]}}[];}
export type FixedExitHelpStateV1<T extends string,I extends number>={epoch:number;replay:number;phase:'prequiz'|'quiz-held'|'feedback'|'postquiz'|'ended'|'left';mainFrame:number;playing:boolean;quizSection:boolean;quizTryCount:0|1;quizButtonsEnabled:boolean;help:boolean;selected:1|2|3|4|null;feedback:null|{spriteId:I;kind:'wrong'|'right';frame:number;closing:boolean;serial:number};selectionSerial:number;wrongText:string|null;glossary:T|null;lessonCompleted:false};
export type FixedExitHelpEventV1<T extends string>={type:'play'|'pause'|'replay'|'leave'|'close-feedback'|'close-glossary'|'open-help'|'close-help';epoch:number}|{type:'advance-main'|'advance-feedback';epoch:number;frame:number}|{type:'choose';epoch:number;answer:1|2|3|4}|{type:'open-glossary';epoch:number;term:T};
export function createFixedExitHelpQuizV1<T extends string,I extends number>(S:FixedExitHelpSourceV1<T,I>){
 if(S.postQuizFrame!==S.quizFrame+1||S.mainFrameCount<=S.postQuizFrame||S.branches.length!==2||S.branches.filter(b=>b.kind==='wrong').length!==1||S.branches.filter(b=>b.kind==='right').length!==1||new Set(S.answers.map(a=>a.answer)).size!==4||S.helpTerms.length===0)throw Error('FIXED_EXIT_HELP_SOURCE_CONTRACT');
 const wrong=S.branches.find(b=>b.kind==='wrong')!;if(wrong.kind!=='wrong'||wrong.closeFirst>wrong.hold||wrong.hold>=wrong.closeJump||wrong.closeJump>=wrong.terminal)throw Error('FIXED_EXIT_HELP_CLOSE_CONTRACT');
 function initialState(epoch=0,replay=0):FixedExitHelpStateV1<T,I>{return{epoch,replay,phase:'prequiz',mainFrame:1,playing:false,quizSection:false,quizTryCount:0,quizButtonsEnabled:false,help:false,selected:null,feedback:null,selectionSerial:0,wrongText:null,glossary:null,lessonCompleted:false};}
 const branch=(id:I)=>S.branches.find(b=>b.spriteId===id)!;
 const terms=(s:FixedExitHelpStateV1<T,I>)=>s.help?S.helpTerms:S.visualStates.find(v=>s.mainFrame>=v.first&&s.mainFrame<=v.last)!.value.terms;
 function canClose(s:FixedExitHelpStateV1<T,I>){const f=s.feedback;if(!f||f.kind!=='wrong'||f.closing||s.glossary||s.help)return false;const b=branch(f.spriteId);return b.kind==='wrong'&&f.frame>=b.closeFirst&&f.frame<=b.hold;}
 function canPlay(s:FixedExitHelpStateV1<T,I>){if(s.glossary||s.help||['left','ended','quiz-held'].includes(s.phase))return false;const f=s.feedback;if(f){const b=branch(f.spriteId);if(b.kind==='wrong'&&!f.closing&&f.frame===b.hold)return false;}return true;}
 function reduce(s:FixedExitHelpStateV1<T,I>,e:FixedExitHelpEventV1<T>):FixedExitHelpStateV1<T,I>{
  if(e.epoch!==s.epoch||s.phase==='left')return s;
  if(e.type==='replay'||e.type==='leave')return{...initialState(s.epoch+1,s.replay+(e.type==='replay'?1:0)),phase:e.type==='leave'?'left':'prequiz'};
  if(e.type==='pause')return s.playing?{...s,playing:false}:s;
  if(e.type==='play')return canPlay(s)&&!s.playing?{...s,playing:true}:s;
  if(e.type==='close-glossary')return s.glossary?{...s,glossary:null,playing:false}:s;
  if(e.type==='open-glossary')return !s.glossary&&terms(s).includes(e.term)?{...s,glossary:e.term,playing:false}:s;
  if(s.glossary)return s;
  if(e.type==='open-help')return s.phase==='quiz-held'&&s.quizButtonsEnabled&&!s.help?{...s,help:true,quizButtonsEnabled:false,playing:false}:s;
  if(e.type==='close-help')return s.help?{...s,help:false,quizButtonsEnabled:true,playing:false}:s;
  if(s.help)return s;
  if(e.type==='advance-main'){
   if(!s.playing||!['prequiz','postquiz'].includes(s.phase)||!Number.isSafeInteger(e.frame)||e.frame<=s.mainFrame||e.frame>S.mainFrameCount)return s;
   if(s.phase==='prequiz'&&e.frame>=S.quizFrame)return{...s,mainFrame:S.quizFrame,phase:'quiz-held',playing:false,quizSection:true,quizTryCount:0,quizButtonsEnabled:true};
   return{...s,mainFrame:e.frame,phase:e.frame===S.mainFrameCount?'ended':s.phase,playing:e.frame!==S.mainFrameCount,quizSection:false,quizButtonsEnabled:false};
  }
  if(e.type==='choose'){
   if(s.phase!=='quiz-held'||!s.quizButtonsEnabled||s.feedback||![1,2,3,4].includes(e.answer))return s;
   const kind=e.answer===S.correctAnswer?'right':'wrong',b=S.branches.find(b=>b.kind===kind)!,a=S.answers.find(a=>a.answer===e.answer)!;
   return{...s,epoch:s.epoch+1,phase:'feedback',playing:true,quizButtonsEnabled:false,selected:e.answer,selectionSerial:s.selectionSerial+1,wrongText:kind==='wrong'?(s.quizTryCount===1?a.wrongLater:a.wrongFirst):null,feedback:{spriteId:b.spriteId,kind,frame:2,closing:false,serial:s.selectionSerial+1}};
  }
  if(e.type==='close-feedback'){
   if(!canClose(s))return s;const b=branch(s.feedback!.spriteId);if(b.kind!=='wrong')return s;
   return{...s,epoch:s.epoch+1,playing:true,selected:null,feedback:{...s.feedback!,frame:b.closeJump,closing:true}};
  }
  if(e.type==='advance-feedback'){
   const f=s.feedback;if(s.phase!=='feedback'||!s.playing||!f||!Number.isSafeInteger(e.frame)||e.frame<=f.frame)return s;
   const b=branch(f.spriteId),limit=b.kind==='wrong'&&!f.closing?b.hold:b.terminal;if(e.frame>limit)return s;
   if(b.kind==='wrong'&&!f.closing&&e.frame===b.hold)return{...s,playing:false,feedback:{...f,frame:e.frame}};
   if(e.frame===b.terminal){const second=b.kind==='wrong'&&s.quizTryCount===1,proceed=b.kind==='right'||second;return{...s,epoch:s.epoch+1,phase:proceed?'postquiz':'quiz-held',mainFrame:proceed?S.postQuizFrame:S.quizFrame,playing:proceed,quizSection:!proceed,quizTryCount:b.kind==='wrong'?(second?0:1):s.quizTryCount,quizButtonsEnabled:!proceed,feedback:null,selected:null,wrongText:null};}
   return{...s,feedback:{...f,frame:e.frame}};
  }
  return s;
 }
 return{initialState,reduce,canPlay,canClose};
}
