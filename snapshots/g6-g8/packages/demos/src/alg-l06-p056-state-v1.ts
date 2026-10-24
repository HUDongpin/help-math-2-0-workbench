import {P056_BEHAVIOR_SOURCE as B} from './generated/alg-l06-p056-behavior-v1';
import {selectHostFeedback} from './g678-advanced-manual/host-feedback-selector';
export {P056_BEHAVIOR_SOURCE} from './generated/alg-l06-p056-behavior-v1';

export type P056Choice='A'|'B'|'C'|'D';
export type P056FeedbackKind='right'|'wrong';
export type P056Phase='main'|'step-held'|'quiz-held'|'host-selection-pending'|
  'feedback-playing'|'engineering-end-held'|'left';
export type P056FeedbackId=typeof B.feedback[number]['spriteId'];
export interface P056Box {
  readonly spriteId:250|270;readonly frame:number;readonly playing:boolean;
  readonly visible:true;readonly closing:boolean;readonly sourceStopped:boolean;readonly generation:number;
}
export interface P056Feedback {
  readonly spriteId:P056FeedbackId;readonly kind:P056FeedbackKind;readonly frame:number;
  readonly playing:boolean;readonly generation:number;readonly hostX:5;
}
export interface P056State {
  readonly phase:P056Phase;readonly mainFrame:number;readonly mainPlaying:boolean;
  readonly stepBox:P056Box|null;readonly quizSection:boolean;readonly quizTryCount:0|1;
  readonly quizButtonsEnabled:boolean;readonly nmhButtonEnabled:boolean;
  readonly selected:P056Choice|null;readonly feedback:P056Feedback|null;
  readonly pendingHostCall:P056FeedbackKind|null;readonly helpVisible:boolean;
  readonly glossaryTerm:string|null;readonly glossaryButtonId:number|null;
  readonly epoch:number;readonly selectionSerial:number;readonly boxSerial:number;
  readonly lessonCompleted:false;
}
type P056Action={type:'play'|'pause'|'step-click'|'continue-step'|'close-box'|
  'resolve-host-feedback'|'open-help'|'close-help'|'close-glossary'|'replay'|'leave'}|
  {type:'advance-main';frame:number}|{type:'advance-box';frame:number;generation:number}|
  {type:'choose';choice:P056Choice}|{type:'advance-feedback';frame:number;generation:number}|
  {type:'glossary';buttonId:number;ownerSpriteId:305|270|288};
export type P056Event=P056Action&{epoch:number};
export type P056Cleanup='abort-pending-work'|'retire-page-owned-media'|'retire-selected-feedback'|'reset-native-stage';
export interface P056Transition {
  readonly accepted:boolean;readonly reason:string;readonly state:P056State;
  readonly cleanup:readonly P056Cleanup[];
}
const reject=(state:P056State,reason:string):P056Transition=>({accepted:false,reason,state,cleanup:[]});
const accept=(state:P056State,reason:string,cleanup:readonly P056Cleanup[]=[]):P056Transition=>({accepted:true,reason,state,cleanup});
const validFrame=(n:number,max:number)=>Number.isSafeInteger(n)&&n>=1&&n<=max;

export function p056InitialState(epoch=0):P056State {
  if(!Number.isSafeInteger(epoch)||epoch<0)throw Error('P056_EPOCH');
  return {phase:'main',mainFrame:1,mainPlaying:false,stepBox:null,quizSection:false,
    quizTryCount:0,quizButtonsEnabled:false,nmhButtonEnabled:false,selected:null,
    feedback:null,pendingHostCall:null,helpVisible:false,glossaryTerm:null,
    glossaryButtonId:null,epoch,selectionSerial:0,boxSerial:0,lessonCompleted:false};
}

/** Page-owned state: four walkthrough stops, optional step boxes, then host-selected
 * feedback. Unlike P033/P041, wrong count changes only at feedback terminal and
 * these seven feedback timelines have no authored hold/Close. Shared deterministic
 * selection is a modern host contract; no Adobe PRNG or original-host claim. */
export function p056Reduce(s:P056State,e:P056Event,seed=0):P056Transition {
  if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('P056_SEED');
  if(e.epoch!==s.epoch)return reject(s,'stale page epoch');
  if(s.phase==='left')return reject(s,'page left');
  if(e.type==='replay'||e.type==='leave')return accept({...p056InitialState(s.epoch+1),
    ...(e.type==='leave'?{phase:'left' as const}:{})},'reset every page-owned state and invalidate callbacks',
    ['abort-pending-work','retire-page-owned-media','reset-native-stage']);
  if(s.glossaryTerm&&e.type!=='close-glossary'&&e.type!=='pause')return reject(s,'dictionary overlay active');
  switch(e.type){
    case 'play':
      if(s.feedback&&!s.feedback.playing)return accept({...s,feedback:{...s.feedback,playing:true}},'resume selected feedback');
      if(s.stepBox&&!s.stepBox.playing&&!s.stepBox.sourceStopped)
        return accept({...s,stepBox:{...s.stepBox,playing:true}},'resume step-box transition');
      if(s.phase==='main'&&!s.mainPlaying)return accept({...s,mainPlaying:true},'resume main');
      return reject(s,'source hold or already playing');
    case 'pause':
      if(!s.mainPlaying&&!s.feedback?.playing&&!s.stepBox?.playing)return reject(s,'already held');
      return accept({...s,mainPlaying:false,feedback:s.feedback?{...s.feedback,playing:false}:null,
        stepBox:s.stepBox?{...s.stepBox,playing:false}:null},'pause active page clocks');
    case 'advance-main':{
      if(!validFrame(e.frame,B.mainLastFrame))throw Error('P056_MAIN_FRAME');
      if(s.phase!=='main'||!s.mainPlaying||e.frame<=s.mainFrame)return reject(s,'main held or non-increasing');
      const next=B.steps.find(step=>step.frame>s.mainFrame);
      if(next&&e.frame>=next.frame)return accept({...s,phase:'step-held',mainFrame:next.frame,
        mainPlaying:false,quizSection:true,stepBox:null},'authored walkthrough stop');
      if(s.mainFrame<B.quizFrame&&e.frame>=B.quizFrame)return accept({...s,phase:'quiz-held',
        mainFrame:B.quizFrame,mainPlaying:false,quizSection:true,quizTryCount:0,
        quizButtonsEnabled:true,nmhButtonEnabled:true,helpVisible:false},'authored final quiz stop/count reset');
      if(e.frame===B.mainLastFrame)return accept({...s,phase:'engineering-end-held',mainFrame:e.frame,
        mainPlaying:false,quizSection:false,quizButtonsEnabled:false,nmhButtonEnabled:false},
        'modern final hold; source has no completion stop or mastery signal');
      return accept({...s,mainFrame:e.frame,...(e.frame>=B.postQuizFrame?{
        quizSection:false,quizButtonsEnabled:false,nmhButtonEnabled:false}: {})},'observed source main frame');
    }
    case 'step-click':{
      if(s.phase!=='step-held'||s.stepBox?.playing)return reject(s,'step unavailable or box animating');
      const step=B.steps.find(x=>x.frame===s.mainFrame);if(!step)return reject(s,'no source step');
      if(!('box'in step))return accept({...s,phase:'main',mainPlaying:true,quizSection:false},'source step release plays parent');
      const generation=s.boxSerial+1;
      return accept({...s,boxSerial:generation,stepBox:{spriteId:step.box.spriteId,frame:1,
        playing:true,visible:true,closing:false,sourceStopped:false,generation}},'source same-frame gotoAndPlay1 opens step box');
    }
    case 'continue-step':
      if(s.phase!=='step-held'||s.stepBox?.playing)return reject(s,'step unavailable or box animating');
      // Native button projects the authored sprite181 release, including its empty hit area.
      // It is not a claim that an invisible empty clip was mouse-clickable in original Flash.
      return accept({...s,phase:'main',mainPlaying:true,quizSection:false,stepBox:null},'authored continue release clears quizSection and plays parent');
    case 'advance-box':{
      const box=s.stepBox;if(!box||!box.playing||e.generation!==box.generation)return reject(s,'box held absent or stale');
      if(!validFrame(e.frame,20))throw Error('P056_BOX_FRAME');
      if(e.frame<=box.frame)return reject(s,'non-increasing box frame');
      if(!box.closing){const frame=Math.min(e.frame,15);return accept({...s,
        stepBox:{...box,frame,playing:frame!==15,sourceStopped:frame===15}},'authored box frame15 hold');}
      if(e.frame===20)return accept({...s,stepBox:{...box,frame:1,playing:false,closing:false,sourceStopped:true}},
        'source box20 resets box1; parent stays held');
      return accept({...s,stepBox:{...box,frame:e.frame}},'observed box closing frame');
    }
    case 'close-box':
      if(!s.stepBox||s.stepBox.frame!==15||s.stepBox.playing||s.stepBox.closing)return reject(s,'Close is authored only on box frame15');
      return accept({...s,quizSection:false,stepBox:{...s.stepBox,playing:true,closing:true,sourceStopped:false}},
        'source Close clears quizSection and plays box, not parent');
    case 'choose':{
      if(s.phase!=='quiz-held'||!s.quizButtonsEnabled||s.helpVisible)return reject(s,'answer unavailable');
      const option=B.options.find(o=>o.letter===e.choice);if(!option)return reject(s,'unknown source choice');
      return accept({...s,phase:'host-selection-pending',selected:e.choice,
        quizButtonsEnabled:false,nmhButtonEnabled:false,pendingHostCall:option.right?'right':'wrong'},
        'source release requests host feedback without incrementing attempts');
    }
    case 'resolve-host-feedback':{
      if(s.phase!=='host-selection-pending'||!s.pendingHostCall)return reject(s,'no host feedback request');
      const kind=s.pendingHostCall,index=selectHostFeedback(kind,(seed+s.selectionSerial)>>>0).branchIndex;
      const branch=B.feedback.find(b=>b.kind===kind&&b.index===index);if(!branch)throw Error('P056_BRANCH_BINDING');
      const generation=s.epoch+1;
      return accept({...s,phase:'feedback-playing',epoch:generation,selectionSerial:s.selectionSerial+1,
        pendingHostCall:null,feedback:{spriteId:branch.spriteId,kind,frame:2,playing:true,generation,hostX:5}},
        'explicit modern host branch; source named clip gotoAndPlay2');
    }
    case 'advance-feedback':{
      const f=s.feedback;if(s.phase!=='feedback-playing'||!f||!f.playing||e.generation!==f.generation)
        return reject(s,'feedback held absent or stale');
      const branch=B.feedback.find(b=>b.spriteId===f.spriteId)!;
      if(!validFrame(e.frame,branch.terminal))throw Error('P056_FEEDBACK_FRAME');
      if(e.frame<=f.frame)return reject(s,'non-increasing feedback frame');
      if(e.frame<branch.terminal)return accept({...s,feedback:{...f,frame:e.frame}},'observed feedback frame; no intermediate source hold');
      const right=f.kind==='right',second=s.quizTryCount===1,proceed=right||second;
      return accept({...s,feedback:null,phase:proceed?'main':'quiz-held',mainPlaying:proceed,
        quizTryCount:right?s.quizTryCount:(second?0:1),quizSection:!proceed,
        quizButtonsEnabled:!right,nmhButtonEnabled:!right},
        right?'source right terminal resumes parent':second?'source second wrong terminal resets count and resumes parent':'source first wrong terminal increments count and retries',
        ['retire-selected-feedback']);
    }
    case 'open-help':
      if(s.phase!=='quiz-held'||!s.nmhButtonEnabled||s.helpVisible)return reject(s,'Need More Help unavailable');
      return accept({...s,helpVisible:true,quizButtonsEnabled:false,nmhButtonEnabled:false},'source help opens function popup288');
    case 'close-help':
      if(!s.helpVisible)return reject(s,'help absent');
      return accept({...s,helpVisible:false,quizButtonsEnabled:true,nmhButtonEnabled:true},'source popup Close re-enables quiz');
    case 'glossary':{
      if(s.phase==='feedback-playing'||s.phase==='host-selection-pending')return reject(s,'feedback owns the stage');
      const owner=e.ownerSpriteId;
      const frame=owner===305?s.mainFrame:owner===288?(s.helpVisible?1:0):s.stepBox?.spriteId===270?s.stepBox.frame:0;
      if(owner===305&&(s.helpVisible||s.stepBox&&s.stepBox.frame!==1))return reject(s,'foreground help owns native controls');
      const g=B.glossary.find(g=>g.ownerSpriteId===owner&&g.buttonId===e.buttonId&&frame>=g.firstFrame&&frame<=g.lastFrame);
      if(!g)return reject(s,'glossary button outside source lifetime');
      return accept({...s,mainPlaying:false,stepBox:s.stepBox?{...s.stepBox,playing:false}:null,
        glossaryTerm:g.key,glossaryButtonId:g.buttonId},'source dictionary request; modern overlay suspends page clocks');
    }
    case 'close-glossary':
      if(!s.glossaryTerm)return reject(s,'dictionary absent');
      return accept({...s,glossaryTerm:null,glossaryButtonId:null},'modern dictionary close keeps page paused');
  }
}
