/** Source mechanism shared by the P033 candidate and the frozen P041 contract.
 * Wrong releases increment attempts; authored feedback terminals decide retry.
 * Audio, drawing, host selection policy and page strings remain with consumers. */
export type TwoAttemptKind='wrong'|'right';
export type TwoAttemptBranch={spriteId:number;kind:'right';index:number;terminal:number}|
 {spriteId:number;kind:'wrong';index:number;terminal:number;hold:number;closePlacementFirst:number;closeButton:number;closeJump:number};
export interface TwoAttemptBinding {
 readonly mainSpriteId:number;readonly quizFrame:number;readonly postQuizFrame:number;readonly mainLastFrame:number;
 readonly correctAnswer:1|2|3|4;readonly answerCharacters:Readonly<Record<1|2|3|4,number>>;
 readonly wrongFirst:string;readonly wrongLater:string;readonly branches:readonly TwoAttemptBranch[];
}
export type TwoAttemptPhase='prequiz'|'quiz-held'|'host-selection-pending'|'feedback-playing'|
 'wrong-feedback-held'|'postquiz-resume'|'postquiz'|'engineering-end-held'|'left';
export type TwoAttemptFeedback={readonly spriteId:number;readonly kind:TwoAttemptKind;readonly frame:number;
 readonly playing:boolean;readonly closeRequested:boolean;readonly generation:number;readonly hostX:5};
export interface TwoAttemptState {
 readonly phase:TwoAttemptPhase;readonly mainFrame:number;readonly mainTimelinePlaying:boolean;
 readonly quizSection:boolean;readonly quizTryCount:0|1|2;readonly quizButtonsEnabled:boolean;
 readonly wrongFeedText:string|null;readonly pendingHostCall:TwoAttemptKind|null;readonly feedback:TwoAttemptFeedback|null;
 readonly epoch:number;readonly selectionSerial:number;readonly sourceToAudioAlignment:'unresolved';readonly lessonCompleted:false;
}
type CurrentEvent={type:'play'|'pause'|'resolve-host-feedback'}|
 {type:'advance-main';frame:number}|{type:'choose';answer:1|2|3|4}|
 {type:'advance-feedback';frame:number;generation:number}|{type:'close-wrong';generation:number};
export type TwoAttemptEvent=(CurrentEvent&{epoch:number})|{type:'replay'|'leave';epoch:number};
export type TwoAttemptCleanup='retire-selected-feedback'|'abort-pending-work'|'retire-page-owned-media'|'reset-native-stage';
export type TwoAttemptTransition={accepted:boolean;reason:string;state:TwoAttemptState;cleanup:readonly TwoAttemptCleanup[]};
export type TwoAttemptDraw=(maxExclusive:3|4,kind:TwoAttemptKind)=>number;
const frameIn=(n:number,max:number)=>Number.isSafeInteger(n)&&n>=1&&n<=max;
const reject=(state:TwoAttemptState,reason:string):TwoAttemptTransition=>({accepted:false,reason,state,cleanup:[]});
const accept=(state:TwoAttemptState,reason:string,cleanup:readonly TwoAttemptCleanup[]=[]):TwoAttemptTransition=>({accepted:true,reason,state,cleanup});

export function createTwoAttemptFeedbackQuiz(input:TwoAttemptBinding){
 const B:TwoAttemptBinding=Object.freeze({...input,answerCharacters:Object.freeze({...input.answerCharacters}),
  branches:Object.freeze(input.branches.map(b=>Object.freeze({...b})))});
 if(!frameIn(B.mainSpriteId,65535)||!frameIn(B.quizFrame,B.mainLastFrame)||B.postQuizFrame!==B.quizFrame+1||
  B.mainLastFrame<=B.postQuizFrame||!frameIn(B.correctAnswer,4)||!B.wrongFirst||!B.wrongLater||
  Object.keys(B.answerCharacters).sort().join('')!=='1234'||Object.values(B.answerCharacters).some(n=>!frameIn(n,65535))||
  B.branches.length!==7||new Set(B.branches.map(b=>b.spriteId)).size!==7)throw Error('TWO_ATTEMPT_SOURCE_CONTRACT');
 const byId=new Map(B.branches.map(b=>[b.spriteId,b]));
 for(const kind of ['wrong','right'] as const){
  const group=B.branches.filter(b=>b.kind===kind),count=kind==='wrong'?3:4;
  if(group.length!==count||group.map(b=>b.index).sort().join('')!==Array.from({length:count},(_,i)=>i+1).join(''))throw Error('TWO_ATTEMPT_BRANCH_CARDINALITY');
  for(const b of group)if(!frameIn(b.spriteId,65535)||!frameIn(b.terminal,65535)||b.terminal<=2||
   (b.kind==='wrong'&&(!frameIn(b.hold,b.terminal)||!frameIn(b.closePlacementFirst,b.hold)||b.closePlacementFirst<2||
   b.closeJump!==b.hold+1||b.closeJump>=b.terminal||!frameIn(b.closeButton,65535))))throw Error('TWO_ATTEMPT_BRANCH_WINDOW');
 }
 function initialState(epoch=0):TwoAttemptState{
  if(!Number.isSafeInteger(epoch)||epoch<0)throw Error('TWO_ATTEMPT_EPOCH');
  return {phase:'prequiz',mainFrame:1,mainTimelinePlaying:false,quizSection:false,quizTryCount:0,
   quizButtonsEnabled:false,wrongFeedText:null,pendingHostCall:null,feedback:null,epoch,selectionSerial:0,
   sourceToAudioAlignment:'unresolved',lessonCompleted:false};
 }
 function reduce(s:TwoAttemptState,e:TwoAttemptEvent,draw?:TwoAttemptDraw):TwoAttemptTransition{
  if(e.epoch!==s.epoch)return reject(s,'stale page epoch');
  if(s.phase==='left')return reject(s,'session left');
  if(e.type==='replay'||e.type==='leave')return accept({...initialState(s.epoch+1),...(e.type==='leave'?{phase:'left' as const}:{})},
   'reset source state and invalidate pending work',['abort-pending-work','retire-page-owned-media','reset-native-stage']);
  switch(e.type){
   case 'play':
    if(s.phase==='feedback-playing'&&s.feedback&&!s.feedback.playing)return accept({...s,feedback:{...s.feedback,playing:true}},'resume selected feedback');
    if(['prequiz','postquiz-resume','postquiz'].includes(s.phase)&&!s.mainTimelinePlaying)return accept({...s,mainTimelinePlaying:true},'resume main');
    return reject(s,'source stop or already playing');
   case 'pause':
    if(s.phase==='feedback-playing'&&s.feedback?.playing)return accept({...s,feedback:{...s.feedback,playing:false}},'pause feedback');
    if(s.mainTimelinePlaying)return accept({...s,mainTimelinePlaying:false},'pause main');
    return reject(s,'nothing playing');
   case 'advance-main':{
    if(!frameIn(e.frame,B.mainLastFrame))throw Error('TWO_ATTEMPT_MAIN_FRAME');
    if(!s.mainTimelinePlaying||!['prequiz','postquiz-resume','postquiz'].includes(s.phase)||e.frame<=s.mainFrame)return reject(s,'held or non-increasing main frame');
    if(s.phase==='prequiz'){
     const frame=Math.min(e.frame,B.quizFrame);
     return frame===B.quizFrame?accept({...s,phase:'quiz-held',mainFrame:frame,mainTimelinePlaying:false,
      quizSection:true,quizTryCount:0,quizButtonsEnabled:true},'authored quiz stop and count reset'):
      accept({...s,mainFrame:frame},'observed main');
    }
    if(s.phase==='postquiz-resume'&&e.frame<B.postQuizFrame)return reject(s,'parent has not advanced');
    if(e.frame===B.mainLastFrame)return accept({...s,phase:'engineering-end-held',mainFrame:e.frame,
     mainTimelinePlaying:false,quizButtonsEnabled:false},'modern terminal hold; no lesson completion');
    return accept({...s,phase:'postquiz',mainFrame:e.frame,quizSection:false,quizButtonsEnabled:false},'postquiz main');
   }
   case 'choose':{
    if(s.phase!=='quiz-held'||!s.quizButtonsEnabled||s.feedback||!Object.hasOwn(B.answerCharacters,e.answer))return reject(s,'answer unavailable');
    const kind:TwoAttemptKind=e.answer===B.correctAnswer?'right':'wrong';
    const count=kind==='wrong'?s.quizTryCount+1:s.quizTryCount;if(count>2)return reject(s,'two wrong attempts exhausted');
    return accept({...s,phase:'host-selection-pending',mainTimelinePlaying:false,quizTryCount:count as 0|1|2,
     quizButtonsEnabled:false,wrongFeedText:kind==='wrong'?(count===1?B.wrongFirst:B.wrongLater):null,
     pendingHostCall:kind},'source release requests disabled quiz and host feedback');
   }
   case 'resolve-host-feedback':{
    const kind=s.pendingHostCall;if(s.phase!=='host-selection-pending'||!kind)return reject(s,'no feedback request');
    if(!draw)throw Error('TWO_ATTEMPT_HOST_DRAW_REQUIRED');const max=kind==='wrong'?3:4,index=draw(max,kind);
    if(!frameIn(index,max))throw Error('TWO_ATTEMPT_HOST_DRAW_RANGE');
    const b=B.branches.find(b=>b.kind===kind&&b.index===index)!;const generation=s.epoch+1;
    return accept({...s,phase:'feedback-playing',pendingHostCall:null,epoch:generation,selectionSerial:s.selectionSerial+1,
     feedback:{spriteId:b.spriteId,kind,frame:2,playing:true,closeRequested:false,generation,hostX:5}},
     'explicit modern host selection; gotoAndPlay2 and x5');
   }
   case 'advance-feedback':{
    const f=s.feedback;if(!f||s.phase!=='feedback-playing'||!f.playing||e.generation!==f.generation)return reject(s,'feedback absent held or stale');
    const b=byId.get(f.spriteId)!;if(!frameIn(e.frame,b.terminal))throw Error('TWO_ATTEMPT_FEEDBACK_FRAME');
    if(e.frame<=f.frame)return reject(s,'non-increasing feedback frame');
    if(b.kind==='wrong'&&!f.closeRequested){const frame=Math.min(e.frame,b.hold);return accept({...s,
     phase:frame===b.hold?'wrong-feedback-held':s.phase,feedback:{...f,frame,playing:frame!==b.hold}},'authored feedback hold');}
    if(e.frame>=b.terminal){
     const right=b.kind==='right',second=s.quizTryCount>=2,proceed=right||second;
     return accept({...s,phase:proceed?'postquiz-resume':'quiz-held',mainFrame:B.quizFrame,mainTimelinePlaying:proceed,
      quizSection:!proceed,quizTryCount:right?s.quizTryCount:(second?0:1),quizButtonsEnabled:!right,
      wrongFeedText:right?s.wrongFeedText:null,feedback:null},proceed?'feedback terminal resumes parent':'first wrong returns to question',['retire-selected-feedback']);
    }
    return accept({...s,feedback:{...f,frame:e.frame}},'observed feedback');
   }
   case 'close-wrong':{
    const f=s.feedback;if(!f||f.kind!=='wrong'||f.closeRequested||e.generation!==f.generation||
     !['feedback-playing','wrong-feedback-held'].includes(s.phase))return reject(s,'Close unavailable');
    const b=byId.get(f.spriteId)!;if(b.kind!=='wrong'||f.frame<b.closePlacementFirst||f.frame>b.hold)return reject(s,'Close outside authored placement');
    return accept({...s,phase:'feedback-playing',feedback:{...f,frame:b.closeJump,playing:true,closeRequested:true}},
     'nested button parent is feedback; source Close jump and answer-face reset');
   }
  }
 }
 return Object.freeze({binding:B,initialState,reduce});
}
