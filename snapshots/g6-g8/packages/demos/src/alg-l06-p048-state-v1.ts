import bindings from '../../../migrations/shared-alg001-l06-p048/native-v1/native-bindings-v2.json';

export type P048Choice = 'A' | 'B' | 'C' | 'D';
export type P048Phase = 'prequiz' | 'quiz-held' | 'nmh-popup' | 'host-glossary' |
  'right-feedback-playing' | 'wrong-feedback-playing' | 'wrong-feedback-held' |
  'wrong-feedback-tail' | 'postquiz' | 'engineering-end-held' | 'left';
export type P048Feedback = {kind:'right'|'wrong';spriteId:number;frame:number;token:string};
type GlossaryReturn = {phase:P048Phase;quizButtonsEnabled:boolean;
  nmhButtonEnabled:boolean;nmhPopupVisible:boolean};
export interface P048State {
  epoch:number;phase:P048Phase;mainFrame:number;mainPlaying:boolean;paused:boolean;
  quizTryCount:0|1;quizGeneration:number;selectionSerial:number;quizSection:boolean;
  selected:P048Choice|null;feedback:P048Feedback|null;wrongFeedText:string|null;
  quizButtonsEnabled:boolean;nmhButtonEnabled:boolean;nmhPopupVisible:boolean;
  wrongFeedbackPopupVisible:boolean;glossaryTerm:string|null;
  glossaryReturn:GlossaryReturn|null;audioOwner:string|null;
  sourceToAudioAlignment:'unresolved';lessonCompleted:false;
}
export interface P048Event {type:string;epoch:number;frame?:number;choice?:P048Choice;
  quizGeneration?:number;token?:string;buttonId?:number;owner?:string}
export type P048Effect = {type:string;[key:string]:unknown};
export type P048Transition = {accepted:boolean;reason:string;state:P048State;effects:P048Effect[]};

export const P048_SOURCE = Object.freeze({animationId:bindings.animationId,
  swfSha256:bindings.sourceSha256,mainSprite:348,quizFrame:224,resumeFrame:225,lastFrame:327,
  wrongFeedbackSprite:304,wrongHoldFrame:22,wrongCloseButton:297,wrongCloseJump:23,
  wrongTerminalFrame:31,rightFeedbackSprite:217,rightTerminalFrame:25});
export const P048_CHOICES = bindings.options;
const R = bindings.runtime, W = bindings.behavior.wrong4, C = bindings.behavior.right4;
const answerInstances = ['AnsBtn1','AnsBtn2','AnsBtn3','AnsBtn4'];
const playable = new Set<P048Phase>(['prequiz','postquiz','right-feedback-playing',
  'wrong-feedback-playing','wrong-feedback-tail']);
const mainPhases = new Set<P048Phase>(['prequiz','postquiz']);

export function initialP048State(epoch=0):P048State {
  if(!Number.isSafeInteger(epoch)||epoch<0)throw new RangeError('P048_INVALID_EPOCH');
  return {epoch,phase:'prequiz',mainFrame:1,mainPlaying:false,paused:false,
    quizTryCount:0,quizGeneration:0,selectionSerial:0,quizSection:false,selected:null,
    feedback:null,wrongFeedText:null,quizButtonsEnabled:false,nmhButtonEnabled:false,
    nmhPopupVisible:false,wrongFeedbackPopupVisible:false,glossaryTerm:null,
    glossaryReturn:null,audioOwner:null,sourceToAudioAlignment:'unresolved',lessonCompleted:false};
}
const accepted=(state:P048State,reason:string,effects:P048Effect[]=[]):P048Transition=>
  ({accepted:true,reason,state,effects});
const rejected=(state:P048State,reason:string):P048Transition=>
  ({accepted:false,reason,state,effects:[]});
const cancel=():P048Effect=>({type:'audio:cancelAll'});
const frameIn=(frame:unknown,last:number):frame is number=>
  typeof frame==='number'&&Number.isSafeInteger(frame)&&frame>=1&&frame<=last;

/** P048's exact fixed-feedback4 semantics. The state owns no browser resource.
 * Existing decoded-stream transport and My Lesson bridge own playback and UI. */
export function reduceP048(state:P048State,event:P048Event):P048Transition {
  if(event.epoch!==state.epoch)return rejected(state,'stale run epoch');
  if(state.phase==='left')return rejected(state,'page already left');
  if(event.type==='replay'||event.type==='leave'){
    const next=initialP048State(state.epoch+1);
    if(event.type==='leave')next.phase='left';
    return accepted(next,'invalidate every pending run callback',
      [cancel(),{type:'stage:reset'},...(event.type==='leave'?[{type:'host:cleanup'}]:[])]);
  }
  if(event.type==='audio-complete'){
    return event.owner&&event.owner===state.audioOwner?
      accepted({...state,audioOwner:null},'current audio ended'):
      rejected(state,'stale audio owner');
  }
  if(event.type==='pause-clock'){
    if(!playable.has(state.phase)||state.paused)return rejected(state,'nothing playing');
    return accepted({...state,paused:true,mainPlaying:false,audioOwner:null},'hold current source clocks',[cancel()]);
  }
  if(event.type==='start-main'||event.type==='resume-clock'){
    if(!playable.has(state.phase)||(!state.paused&&
       (state.mainPlaying||state.feedback))||
       (event.type==='start-main'&&(state.phase!=='prequiz'||state.mainFrame!==1)))
      return rejected(state,'clock start unavailable');
    const stream=state.feedback?(state.feedback.kind==='wrong'?'wrong4':'right4'):'main';
    const frame=state.feedback?.frame??state.mainFrame;
    const owner=`${stream}:${state.epoch}:${state.selectionSerial}:${frame}`;
    return accepted({...state,paused:false,mainPlaying:mainPhases.has(state.phase),audioOwner:owner},
      'start or resume source clock',[{type:'audio:intent',stream,frame,owner}]);
  }
  if(event.type==='advance-main'){
    if(!frameIn(event.frame,R.mainFrames)||!state.mainPlaying||state.paused||event.frame<=state.mainFrame)
      return rejected(state,'main held or invalid frame');
    if(state.phase==='prequiz'&&event.frame>=R.quizFrame)
      return accepted({...state,phase:'quiz-held',mainFrame:R.quizFrame,mainPlaying:false,
        quizSection:true,quizTryCount:0,quizGeneration:state.quizGeneration+1,
        quizButtonsEnabled:true,nmhButtonEnabled:true,audioOwner:null},'source quiz hold224',
        [cancel(),{type:'timeline:stop',frame:R.quizFrame},{type:'host:enableQuizButton'}]);
    if(!mainPhases.has(state.phase))return rejected(state,'not a main timeline phase');
    if(event.frame===R.terminalFrame)
      return accepted({...state,phase:'engineering-end-held',mainFrame:event.frame,
        mainPlaying:false,audioOwner:null},'source stops327; no lesson completion',
        [cancel(),{type:'timeline:stop',frame:event.frame}]);
    return accepted({...state,mainFrame:event.frame},'observed main frame');
  }
  if(event.type==='choose'){
    if(state.phase!=='quiz-held'||!state.quizButtonsEnabled||event.quizGeneration!==state.quizGeneration||
       !event.choice||!Object.prototype.hasOwnProperty.call(P048_CHOICES,event.choice))
      return rejected(state,'answer unavailable or stale generation');
    const wrong=P048_CHOICES[event.choice].branch==='wrong4';
    const token=`${state.epoch}:${state.selectionSerial+1}`,owner=`feedback:${token}`;
    const feedback:P048Feedback={kind:wrong?'wrong':'right',spriteId:wrong?W.spriteId:C.spriteId,frame:2,token};
    return accepted({...state,phase:wrong?'wrong-feedback-playing':'right-feedback-playing',paused:false,
      selected:event.choice,selectionSerial:state.selectionSerial+1,feedback,
      wrongFeedText:wrong?(state.quizTryCount===1?W.secondText:W.firstText):null,
      quizButtonsEnabled:false,nmhButtonEnabled:false,audioOwner:owner},'fixed feedback4 starts at2',
      [cancel(),{type:'host:disableQuizButton'},
       {type:'feedback:seekPlay',spriteId:feedback.spriteId,frame:2,token},
       {type:'audio:intent',stream:wrong?'wrong4':'right4',frame:2,owner}]);
  }
  if(event.type==='open-nmh'||event.type==='close-nmh'){
    const open=event.type==='open-nmh';
    if(event.quizGeneration!==state.quizGeneration||
       (open?(state.phase!=='quiz-held'||!state.nmhButtonEnabled):state.phase!=='nmh-popup'))
      return rejected(state,'help transition unavailable');
    return accepted({...state,phase:open?'nmh-popup':'quiz-held',nmhPopupVisible:open,
      quizButtonsEnabled:!open,nmhButtonEnabled:!open},'source static help transition',
      [{type:open?'host:disableQuizButton':'host:enableQuizButton'}]);
  }
  if(event.type==='glossary'){
    const item=bindings.glossary.find(row=>row.buttonId===event.buttonId);
    if(!item||event.quizGeneration!==state.quizGeneration)return rejected(state,'absent or stale glossary');
    const onHelp=item.ownerSpriteId===139&&state.phase==='nmh-popup'&&state.nmhPopupVisible;
    const onMain=item.ownerSpriteId===348&&['prequiz','quiz-held','postquiz'].includes(state.phase)&&
      state.mainFrame>=item.firstFrame&&state.mainFrame<=item.lastFrame;
    if(!onHelp&&!onMain)return rejected(state,'glossary not currently reachable');
    return accepted({...state,phase:'host-glossary',mainPlaying:false,paused:true,
      quizButtonsEnabled:false,glossaryTerm:item.term,audioOwner:null,
      glossaryReturn:{phase:state.phase,quizButtonsEnabled:state.quizButtonsEnabled,
        nmhButtonEnabled:state.nmhButtonEnabled,nmhPopupVisible:state.nmhPopupVisible}},
      'delegate source term to My Lesson',[cancel(),{type:'host:DoHyperLinks',keyAttribute:item.term}]);
  }
  if(event.type==='close-glossary'){
    if(state.phase!=='host-glossary'||!state.glossaryReturn||event.quizGeneration!==state.quizGeneration)
      return rejected(state,'glossary return unavailable');
    return accepted({...state,...state.glossaryReturn,mainPlaying:false,paused:true,
      glossaryTerm:null,glossaryReturn:null,audioOwner:null},'return held and preserve parent help');
  }
  if(event.type==='close-wrong'){
    const f=state.feedback;
    if(state.phase!=='wrong-feedback-held'||!f||f.token!==event.token||f.frame!==W.holdFrame)
      return rejected(state,'wrong Close unavailable');
    const owner=`feedbackTail:${f.token}`;
    return accepted({...state,phase:'wrong-feedback-tail',paused:false,
      feedback:{...f,frame:W.closeJump},wrongFeedbackPopupVisible:false,audioOwner:owner},
      'Close starts tail23; attempt unchanged until31',[
        {type:'feedback:seekPlay',spriteId:W.spriteId,frame:W.closeJump,token:f.token},
        {type:'answerClips:reset',instances:answerInstances,frame:1},
        {type:'audio:intent',stream:'wrong4',frame:W.closeJump,owner}]);
  }
  if(event.type==='advance-feedback'){
    const f=state.feedback;
    if(!f||f.token!==event.token||state.paused||!frameIn(event.frame,f.kind==='wrong'?W.terminalFrame:C.terminalFrame)||
       event.frame<=f.frame)return rejected(state,'stale, held or invalid feedback');
    if(state.phase==='wrong-feedback-playing'){
      const held=event.frame>=W.holdFrame,frame=Math.min(event.frame,W.holdFrame);
      return accepted({...state,phase:held?'wrong-feedback-held':state.phase,feedback:{...f,frame},
        wrongFeedbackPopupVisible:frame>=W.popupFirstFrame,audioOwner:held?null:state.audioOwner},
        held?'feedback held22; explicit Close required':'observed wrong head',held?[cancel()]:[]);
    }
    const tail=state.phase==='wrong-feedback-tail';
    const right=state.phase==='right-feedback-playing';
    if(!tail&&!right)return rejected(state,'feedback held at a source stop');
    const terminal=tail?W.terminalFrame:C.terminalFrame;
    if(event.frame<terminal)return accepted({...state,feedback:{...f,frame:event.frame}},'observed feedback frame');
    const proceed=right||state.quizTryCount===1;
    const owner=proceed?`main:${state.epoch}:${state.selectionSerial}:225`:null;
    return accepted({...state,phase:proceed?'postquiz':'quiz-held',mainFrame:proceed?R.resumeFrame:R.quizFrame,
      mainPlaying:proceed,paused:false,quizSection:!proceed,
      quizTryCount:right?state.quizTryCount:(proceed?0:1),
      quizGeneration:state.quizGeneration+(proceed?0:1),feedback:null,
      wrongFeedText:null,wrongFeedbackPopupVisible:false,
      quizButtonsEnabled:!proceed,nmhButtonEnabled:!proceed,audioOwner:owner},
      proceed?'resume main225':'first wrong enables fresh retry',[
        cancel(),{type:'feedback:reset',spriteId:f.spriteId,frame:1},
        {type:proceed?'host:disableQuizButton':'host:enableQuizButton'},
        ...(proceed?[{type:'timeline:seekPlay',frame:R.resumeFrame},
          {type:'audio:intent',stream:'main',frame:R.resumeFrame,owner}]:[])]);
  }
  return rejected(state,'unknown event');
}
