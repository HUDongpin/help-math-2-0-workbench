/** Source-only P035 interaction candidate. The host owns time, audio and focus. */
import React from 'react';
import sourceJson from '../../../migrations/shared-alg001-l06-p035/native-v1/interaction-geometry-v1.json';
import {p035NativeTextState} from './alg-l06-p035-native-text-v1';

type Feedback={spriteId:number;frame:number};
export type P035InteractionOwner={
  mainFrame:number;
  /** Opaque owner token. Neither feedbackEpoch nor spanishEpoch may replace it. */
  mainAudioToken:unknown;
  feedbackEpoch:number;
  spanishEpoch:number;
  interactionEpoch:number;
  feedback:Feedback|null;
  wrongTryCount?:0|1;
  inputLocked:boolean;
  glossaryOpen:boolean;
  spanishSelected:boolean;
  canChoose:boolean;
  canOpenGlossary:boolean;
  canCloseFeedback:boolean;
};
type Source=typeof sourceJson;
type Control={kind:'choice'|'glossary'|'close';key:string;buttonId:number;
  buttonInstanceId:string;actionSha256:string;labelInstanceId:string;
  labelTextId:number;sourceFrame:number;feedbackSpriteId:number|null;
  feedbackFrame:number|null;sourceHandler?:'right'|'wrong';letter?:string;value?:string;
  destinationFrame?:number};
export type P035InteractionControl=Control;
const source:Source=sourceJson;
const safeEpoch=(value:number)=>Number.isSafeInteger(value)&&value>=0;

function validateOwner(owner:P035InteractionOwner){
  if(![owner.feedbackEpoch,owner.spanishEpoch,owner.interactionEpoch].every(safeEpoch))
    throw new RangeError('P035_OWNER_EPOCH');
  if(owner.feedback!==null&&(owner.mainFrame!==145||
    !Number.isSafeInteger(owner.feedback.spriteId)||
    !Number.isSafeInteger(owner.feedback.frame)))
    throw new RangeError('P035_FEEDBACK_OWNER_DOMAIN');
  if(owner.wrongTryCount!==undefined&&![0,1].includes(owner.wrongTryCount))
    throw new RangeError('P035_WRONG_TRY_COUNT');
  if(owner.wrongTryCount!==undefined&&
    ![80,95,126].includes(owner.feedback?.spriteId??-1))
    throw new RangeError('P035_WRONG_TRY_FEEDBACK_DOMAIN');
}
function sameOwner(a:P035InteractionOwner,b:P035InteractionOwner):boolean{
  return a.mainFrame===b.mainFrame&&Object.is(a.mainAudioToken,b.mainAudioToken)&&
    a.feedbackEpoch===b.feedbackEpoch&&a.spanishEpoch===b.spanishEpoch&&
    a.interactionEpoch===b.interactionEpoch&&
    a.feedback?.spriteId===b.feedback?.spriteId&&a.feedback?.frame===b.feedback?.frame&&
    a.wrongTryCount===b.wrongTryCount&&a.inputLocked===b.inputLocked&&
    a.glossaryOpen===b.glossaryOpen&&a.spanishSelected===b.spanishSelected&&
    a.canChoose===b.canChoose&&a.canOpenGlossary===b.canOpenGlossary&&
    a.canCloseFeedback===b.canCloseFeedback;
}

/** Source identity and visibility are recomputed for each owner snapshot. */
export function p035InteractionState(owner:P035InteractionOwner){
  validateOwner(owner);
  const feedback=owner.feedback;
  const native=p035NativeTextState(owner.mainFrame,feedback?{
    feedbackSpriteId:feedback.spriteId,feedbackFrame:feedback.frame,
    ...([80,95,126].includes(feedback.spriteId)&&owner.wrongTryCount!==undefined?
      {wrongTryCount:owner.wrongTryCount}:{})}:{});
  const unlocked=!owner.inputLocked&&!owner.glossaryOpen&&!owner.spanishSelected;
  const choices:Control[]=unlocked&&owner.canChoose&&feedback===null&&owner.mainFrame===145?
    source.quizChoices.flatMap(row=>{
      const live=native.choices.find(x=>x.buttonInstanceId===row.buttonInstanceId&&
        x.buttonId===row.buttonId&&x.buttonName===row.buttonName&&
        x.letterTextInstanceId.endsWith(row.letterTextInstanceId)&&
        x.valueTextInstanceId.endsWith(row.valueTextInstanceId)&&
        x.value===row.value&&x.sourceHandler===row.sourceHandler&&
        x.actionSha256===row.actionSha256);
      if(row.sourceHandler!=='right'&&row.sourceHandler!=='wrong')
        throw Error('P035_CHOICE_SOURCE_HANDLER');
      const valueLabel=live?native.allTextInstances.find(x=>
        x.instanceId===live.valueTextInstanceId):null;
      return live&&valueLabel?[{kind:'choice' as const,key:row.buttonName,buttonId:row.buttonId,
        buttonInstanceId:row.buttonInstanceId,actionSha256:row.actionSha256,
        labelInstanceId:live.valueTextInstanceId,labelTextId:valueLabel.sourceTextId,
        sourceFrame:145,feedbackSpriteId:null,feedbackFrame:null,
        sourceHandler:row.sourceHandler,letter:row.letter,value:row.value}]:[];
    }):[];
  const glossary:Control[]=unlocked&&owner.canOpenGlossary&&feedback===null?
    source.glossary.flatMap(row=>{
      const label=native.allTextInstances.find(x=>x.owner==='227'&&
        x.sourceTextId===row.textId&&x.instanceId.endsWith(row.labelTextInstanceId));
      const available=owner.mainFrame>=row.firstReadyFrame&&
        owner.mainFrame<=row.lastReadyFrame&&owner.mainFrame>=row.buttonFirstFrame&&
        !!label&&label.alpha>0&&label.visibleText.startsWith(row.prefixText)&&
        label.clippingMaskInstanceIds.includes(row.maskInstanceId)&&
        row.hitOverlapFraction>=0.75&&row.labelSegment.toLowerCase()===row.key.toLowerCase();
      return available?[{kind:'glossary' as const,key:row.key,buttonId:row.buttonId,
        buttonInstanceId:row.buttonInstanceId,actionSha256:row.actionSha256,
        labelInstanceId:label!.instanceId,labelTextId:row.textId,
        sourceFrame:owner.mainFrame,feedbackSpriteId:null,feedbackFrame:null}]:[];
    }):[];
  const close:Control[]=unlocked&&owner.canCloseFeedback&&feedback!==null?
    source.feedbackClose.flatMap(row=>{
      if(feedback.spriteId!==row.feedbackSpriteId||
        feedback.frame<row.firstReadyFeedbackFrame||
        feedback.frame>row.lastReadyFeedbackFrame)return [];
      const label=native.feedbackText.find(x=>x.sourceTextId===row.labelTextId&&
        x.instanceId===row.labelInstanceId&&x.visibleText==='Close'&&x.complete);
      return label?[{kind:'close' as const,key:'Close',buttonId:row.buttonId,
        buttonInstanceId:row.buttonInstanceId,actionSha256:row.actionSha256,
        labelInstanceId:row.labelInstanceId,labelTextId:row.labelTextId,
        sourceFrame:145,feedbackSpriteId:feedback.spriteId,feedbackFrame:feedback.frame,
        destinationFrame:row.sourceGotoAndPlayFrame}]:[];
    }):[];
  return {frameDomain:'sprite-227' as const,mainFrame:owner.mainFrame,
    choices,glossary,close,sourceLanguage:'en' as const,
    sourceSwfSha256:source.sourceSwf.sha256,
    canvasSourceGlyphsPreserved:true as const,originalRuntimeAccepted:false as const};
}

function sameControl(a:Control,b:Control):boolean{
  return a.kind===b.kind&&a.key===b.key&&a.buttonId===b.buttonId&&
    a.buttonInstanceId===b.buttonInstanceId&&a.actionSha256===b.actionSha256&&
    a.labelInstanceId===b.labelInstanceId&&a.labelTextId===b.labelTextId&&
    a.sourceFrame===b.sourceFrame&&a.feedbackSpriteId===b.feedbackSpriteId&&
    a.feedbackFrame===b.feedbackFrame&&a.sourceHandler===b.sourceHandler&&
    a.letter===b.letter&&a.value===b.value&&a.destinationFrame===b.destinationFrame;
}

/** Read current owner at activation time; stale or foreign DOM cannot dispatch. */
export function p035CanActivate(control:Control,trigger:HTMLButtonElement,
  scope:HTMLElement|null,rendered:P035InteractionOwner,
  readCurrentOwner:()=>P035InteractionOwner|null):boolean{
  if(!scope||!scope.isConnected||!trigger.isConnected||trigger.disabled||
    !scope.contains(trigger)||scope.getAttribute('data-p035-interaction')!=='source-only'||
    trigger.closest('[data-p035-interaction]')!==scope||
    scope.getAttribute('data-p035-main-frame')!==String(rendered.mainFrame)||
    trigger.getAttribute('data-p035-kind')!==control.kind||
    trigger.getAttribute('data-p035-key')!==control.key||
    trigger.getAttribute('data-source-button-id')!==String(control.buttonId)||
    trigger.getAttribute('data-source-button-instance-id')!==control.buttonInstanceId||
    trigger.getAttribute('data-source-action-sha256')!==control.actionSha256||
    trigger.getAttribute('data-source-label-instance-id')!==control.labelInstanceId||
    trigger.getAttribute('data-source-label-text-id')!==String(control.labelTextId)||
    trigger.getAttribute('data-p035-main-frame')!==String(control.sourceFrame)||
    trigger.getAttribute('data-p035-feedback-sprite-id')!==
      String(control.feedbackSpriteId??'')||
    trigger.getAttribute('data-p035-feedback-frame')!==
      String(control.feedbackFrame??''))return false;
  const current=readCurrentOwner();
  if(!current||!sameOwner(rendered,current))return false;
  try{
    const now=p035InteractionState(current);
    return [...now.choices,...now.glossary,...now.close].some(row=>sameControl(row,control));
  }catch{return false;}
}

export function P035NativeInteractionDraft({owner,readCurrentOwner,language='en',
  onChoose,onOpenGlossary,onCloseFeedback}:{owner:P035InteractionOwner;
  readCurrentOwner:()=>P035InteractionOwner|null;language?:'en'|'es';
  onChoose?:(choice:{buttonName:string;letter:string;value:string;sourceHandler:'right'|'wrong';
    sourceActionSha256:string},trigger:HTMLButtonElement)=>void;
  onOpenGlossary?:(key:string,trigger:HTMLButtonElement)=>void;
  /** Owner resumes feedback and restores focus to the appropriate choice. */
  onCloseFeedback?:(close:{feedbackSpriteId:number;sourceGotoAndPlayFrame:number},
    trigger:HTMLButtonElement)=>void}){
  // Snapshot before installing handlers; the host may later mutate its state object.
  const rendered:P035InteractionOwner={...owner,
    feedback:owner.feedback?{...owner.feedback}:null};
  const state=p035InteractionState(rendered);
  const controls=[...state.choices,...state.glossary,...state.close];
  return <section lang="en" aria-label="Original lesson controls (English)"
    data-p035-interaction="source-only" data-p035-main-frame={rendered.mainFrame}
    data-p035-source-sha256={state.sourceSwfSha256}
    data-p035-language-policy={language==='es'?'source-en-fallback':'source-en'}
    data-p035-canvas-source-glyphs="preserved"
    data-p035-focus-policy="owner-restores-after-feedback-or-glossary">
    {controls.map(row=><button key={`${row.kind}/${row.buttonInstanceId}`} type="button"
      style={{minHeight:44,width:'100%',minWidth:0,maxWidth:'100%',
        boxSizing:'border-box',padding:'.45em .8em',font:'inherit',
        overflowWrap:'anywhere'}}
      data-p035-kind={row.kind} data-p035-key={row.key}
      data-source-button-id={row.buttonId}
      data-source-button-instance-id={row.buttonInstanceId}
      data-source-action-sha256={row.actionSha256}
      data-source-label-instance-id={row.labelInstanceId}
      data-source-label-text-id={row.labelTextId}
      data-p035-main-frame={row.sourceFrame}
      data-p035-feedback-sprite-id={row.feedbackSpriteId??''}
      data-p035-feedback-frame={row.feedbackFrame??''}
      data-p035-activation="live-owner-and-source-instance-required"
      disabled={(row.kind==='choice'&&!onChoose)||
        (row.kind==='glossary'&&!onOpenGlossary)||
        (row.kind==='close'&&!onCloseFeedback)}
      onClick={event=>{
        const trigger=event.currentTarget;
        const scope=trigger.closest('[data-p035-interaction]') as HTMLElement|null;
        if(!p035CanActivate(row,trigger,scope,rendered,readCurrentOwner))return;
        if(row.kind==='choice')onChoose?.({buttonName:row.key,letter:row.letter!,value:row.value!,
          sourceHandler:row.sourceHandler!,sourceActionSha256:row.actionSha256},trigger);
        if(row.kind==='glossary')onOpenGlossary?.(row.key,trigger);
        if(row.kind==='close')onCloseFeedback?.({feedbackSpriteId:row.feedbackSpriteId!,
          sourceGotoAndPlayFrame:row.destinationFrame!},trigger);
      }}>
      {row.kind==='choice'?`${row.letter}. ${row.value}`:
        row.kind==='glossary'?`${row.key} glossary`:'Close'}
    </button>)}
  </section>;
}
