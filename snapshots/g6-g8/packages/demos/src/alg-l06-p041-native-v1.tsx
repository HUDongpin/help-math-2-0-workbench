import React from 'react';
import nativeModel from '../../../migrations/shared-alg001-l06-p041/native-v1/native-model-v1.json';
import type {P041State} from './alg-l06-p041-state-v1';

type Option={answerInstance:string;mainFrame:number;buttonObjectId:number;
  buttonDepth:number;sourceBranch:'wrong'|'right';sourceStageHitBoxPx:number[];
  letter:{text:string;textId:number};optionText:{text:string;textId:number}};
type Wrong={spriteId:number;popupFirstFrame:number;editTextId:number;
  closeButtonId:number;holdFrame:number;resumeFrame:number};
const model=nativeModel as unknown as {
  animationId:string;source:{physicalSwf:{sha256:string}};
  quiz:{holdFrame:number;options:Option[]};wrongFeedback:Wrong[];
  readOnlyPopupTextContract:{sourceAssignment:string};
};
if(model.animationId!=='shared-alg001-l06-p041'||
  model.source.physicalSwf.sha256!==
    'bb10cab8e835f2c3267e0add3774dc47fa38863fe12dab67f3199e4c0efadd85'||
  model.quiz.holdFrame!==752||model.quiz.options.length!==4||
  model.readOnlyPopupTextContract.sourceAssignment!==
    'txtFeed.text = _global.WrongFeed')
  throw Error('P041_NATIVE_SOURCE_IDENTITY_MISMATCH');

export function p041NativeOptions(state:P041State){
  if(state.phase!=='quiz-held'||state.mainFrame!==752||
     !state.quizButtonsEnabled||state.feedback)return [];
  return model.quiz.options.map((option,index)=>({
    answer:(index+1) as 1|2|3|4,letter:option.letter.text,
    text:option.optionText.text,buttonObjectId:option.buttonObjectId,
    sourceBranch:option.sourceBranch,
    sourceStageHitBoxPx:option.sourceStageHitBoxPx,
    letterTextId:option.letter.textId,optionTextId:option.optionText.textId,
    sourceName:option.answerInstance,
  }));
}
export function p041NativeWrongPopup(state:P041State){
  const feedback=state.feedback;
  if(!feedback||feedback.kind!=='wrong'||!state.wrongFeedText)return null;
  const source=model.wrongFeedback.find(x=>x.spriteId===feedback.spriteId);
  if(!source||feedback.frame<source.popupFirstFrame)return null;
  return {spriteId:feedback.spriteId,frame:feedback.frame,
    text:state.wrongFeedText,editTextId:source.editTextId,
    closeButtonId:source.closeButtonId,
    canClose:!feedback.closeRequested&&feedback.frame<=source.holdFrame,
    generation:feedback.generation};
}

export interface P041NativeCompanionPropsV1{
  state:P041State;language?:'en'|'es';
  rootRef?:React.Ref<HTMLElement>;
  onChoose?:(answer:1|2|3|4)=>void;
  onCloseWrong?:(generation:number)=>void;
}
/** Responsive source-English companion. Canvas keeps all original glyphs;
 * browser text is below the stage until exact overlay geometry is calibrated. */
export function P041NativeCompanionV1({state,language='en',rootRef,onChoose,onCloseWrong}
  :P041NativeCompanionPropsV1){
  const options=p041NativeOptions(state),popup=p041NativeWrongPopup(state);
  const fallback=language==='es';
  return <section ref={rootRef} lang="en" aria-label="Original lesson text (English)"
    data-p041-native-companion="true" data-p041-frame={state.mainFrame}
    data-p041-phase={state.phase} data-p041-state-epoch={state.epoch}
    data-p041-source-sha256={model.source.physicalSwf.sha256}
    data-p041-language-policy={fallback?'source-en-fallback':'source-en'}
    data-p041-canvas-glyphs="preserved" data-p041-overlay-calibration="pending"
    style={{display:'grid',gap:'0.75em',minWidth:0,maxWidth:'100%',boxSizing:'border-box',
      padding:'0.75em',fontFamily:'var(--font-lesson-sans, Arial), sans-serif',
      fontSize:'1rem',lineHeight:1.5,color:'#15344c'}}>
    {options.length>0&&<div role="group" aria-label={fallback?'Opciones (texto original en inglés)':'Answer choices'}
      data-p041-section="source-quiz-options"
      style={{display:'grid',gap:'0.5em',minWidth:0}}>
      {options.map(option=><button key={option.sourceName} type="button"
        data-source-answer={option.answer} data-source-button-id={option.buttonObjectId}
        data-source-letter-text-id={option.letterTextId}
        data-source-option-text-id={option.optionTextId}
        data-source-hit-box={option.sourceStageHitBoxPx.join(',')}
        data-source-branch={option.sourceBranch}
        onClick={()=>onChoose?.(option.answer)} disabled={!onChoose}
        style={{minHeight:44,textAlign:'left',border:'1px solid currentColor',
          borderRadius:'0.4em',background:'#edf6fc',color:'inherit',font:'inherit',
          padding:'0.5em 0.75em',maxWidth:'100%',overflowWrap:'anywhere'}}>
        <strong>{option.letter}.</strong> {option.text}
      </button>)}
    </div>}
    {popup&&<div role="status" aria-live="polite" data-p041-section="source-wrong-feedback"
      data-source-edit-text-id={popup.editTextId} data-feedback-sprite={popup.spriteId}
      style={{display:'grid',gap:'0.5em',minWidth:0}}>
      <p style={{margin:0,whiteSpace:'pre-wrap'}}>{popup.text}</p>
      {popup.canClose&&<button type="button" onClick={()=>onCloseWrong?.(popup.generation)}
        disabled={!onCloseWrong} data-source-button-id={popup.closeButtonId}
        style={{minHeight:44,justifySelf:'start',font:'inherit',padding:'0.45em 0.8em'}}>
        {fallback?'Cerrar':'Close'}
      </button>}
    </div>}
  </section>;
}
