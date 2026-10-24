/** Pure host projection for the unregistered P035 player draft. */
import {P035_FEEDBACK,P035_SOURCE,p035CanCloseWrong,type P035Choice,type P035FeedbackId,
  type P035State} from './alg-l06-p035-state-v1';
import type {P035InteractionOwner} from './alg-l06-p035-native-interaction-v1';

export type P035OwnerSnapshot={
  state:P035State;phase:'held'|'playing'|'paused'|'failed'|'closed';
  mainAudioToken:number;feedbackEpoch:number;supplementalEpoch:number;
  generation:number;failure:string|null;
};

/** Native buttons remain locked until a source Canvas frame was committed. */
export function p035InteractionOwnerFor(snapshot:P035OwnerSnapshot,
  canvasCommitted:boolean):P035InteractionOwner{
  const state=snapshot.state;
  const unavailable=!canvasCommitted||snapshot.phase==='failed'||snapshot.phase==='closed';
  const feedback=state.feedback;
  const glossaryOpen=state.glossaryOpen!==null;
  const spanishSelected=state.supplemental!=='off';
  return {
    mainFrame:state.mainFrame,mainAudioToken:snapshot.mainAudioToken,
    feedbackEpoch:snapshot.feedbackEpoch,spanishEpoch:snapshot.supplementalEpoch,
    interactionEpoch:snapshot.generation,
    feedback:feedback?{spriteId:feedback.characterId,frame:feedback.frame}:null,
    ...(feedback?.kind==='wrong'?{wrongTryCount:state.quizTryCount}:{}),
    inputLocked:unavailable,glossaryOpen,spanishSelected,
    canChoose:!unavailable&&state.phase==='question'&&state.quizButtonsEnabled&&
      !glossaryOpen&&!spanishSelected&&feedback===null,
    canOpenGlossary:!unavailable&&!glossaryOpen&&!spanishSelected&&
      feedback===null&&state.phase!=='feedback-pending',
    canCloseFeedback:!unavailable&&!glossaryOpen&&!spanishSelected&&
      p035CanCloseWrong(state),
  };
}

export type P035VariantRequest={
  animationId:typeof P035_SOURCE.animationId;choice:P035Choice;
  kind:'right'|'wrong';sourceHostCall:'_root.showRightFeed()'|'_root.showWrongFeed()';
  mainFrame:145;wrongTryCount:0|1;
};
export type P035PlayableFeedbackId=Exclude<P035FeedbackId,179>;

/** The page source names show*Feed(), but not its variant-selection policy. */
export function p035VariantRequest(state:P035State,choice:P035Choice):P035VariantRequest|null{
  if(state.phase!=='feedback-pending'||state.mainFrame!==145||
    !state.pendingHostCall||state.supplemental!=='off')return null;
  const kind=state.pendingHostCall==='_root.showRightFeed()'?'right':'wrong';
  if((choice==='B')!==(kind==='right'))return null;
  return {animationId:P035_SOURCE.animationId,choice,kind,
    sourceHostCall:state.pendingHostCall,mainFrame:145,
    wrongTryCount:state.quizTryCount};
}

export function p035CanResolveVariant(request:P035VariantRequest,
  characterId:number|null|undefined):characterId is P035PlayableFeedbackId{
  if(characterId===null||characterId===undefined||
    !Object.prototype.hasOwnProperty.call(P035_FEEDBACK,characterId))return false;
  const spec=P035_FEEDBACK[characterId as P035FeedbackId];
  return spec.kind===request.kind&&spec.audioStatus!=='incomplete-source-tail';
}

/** This mapping is a required, explicit modern host decision, not a recovered
 * selection policy for the old shell-owned show*Feed() calls. */
export type P035HostVariants={readonly wrongFirst:P035FeedbackId;
  readonly wrongSecond:P035FeedbackId;readonly right:P035FeedbackId};
export function p035HostVariant(request:P035VariantRequest,
  variants:P035HostVariants):P035PlayableFeedbackId{
  const id=request.kind==='right'?variants.right:
    request.wrongTryCount===0?variants.wrongFirst:variants.wrongSecond;
  if(!p035CanResolveVariant(request,id))throw Error('P035_HOST_VARIANT_UNAVAILABLE');
  return id;
}

export function p035ValidateHostVariants(variants:P035HostVariants):P035PlayableFeedbackId[]{
  const wrong:P035VariantRequest={animationId:P035_SOURCE.animationId,
    choice:'A',kind:'wrong',sourceHostCall:'_root.showWrongFeed()',
    mainFrame:145,wrongTryCount:0};
  const right:P035VariantRequest={...wrong,choice:'B',kind:'right',
    sourceHostCall:'_root.showRightFeed()'};
  if(!p035CanResolveVariant(wrong,variants.wrongFirst)||
    !p035CanResolveVariant(wrong,variants.wrongSecond)||
    !p035CanResolveVariant(right,variants.right))
    throw Error('P035_HOST_VARIANT_UNAVAILABLE');
  const selected:P035PlayableFeedbackId[]=[
    variants.wrongFirst as P035PlayableFeedbackId,
    variants.wrongSecond as P035PlayableFeedbackId,
    variants.right as P035PlayableFeedbackId];
  return [...new Set(selected)];
}
