import React from 'react';
import bindings from '../../../migrations/shared-alg001-l06-p043/native-v1/native-bindings-v1.json';
import {p043QuestionAtFrame} from './alg-l06-p043-question-v1';

export type P043ChoiceV1 = 'A' | 'B' | 'C' | 'D';
export interface P043StateViewV1 {
  readonly epoch: number;
  readonly phase: string;
  readonly mainFrame: number;
  readonly quizGeneration: number;
  readonly quizButtonsEnabled: boolean;
  readonly nmhButtonEnabled: boolean;
  readonly nmhPopupVisible: boolean;
  readonly wrongFeedbackPopupVisible: boolean;
  readonly wrongFeedText: string | null;
  readonly feedback: null | {readonly spriteId: number; readonly frame: number;
    readonly token: string};
}

export const P043_NATIVE_BINDING_SHA256 =
  '220ad3977f3c63c1e1ebcb3b545d7e3fbdefc5c0dbe6e36df157814004ea5f0c' as const;

if (bindings.animationId !== 'shared-alg001-l06-p043' ||
    bindings.quizFrame !== 62 || bindings.stage.width !== 800 ||
    bindings.stage.height !== 600 ||
    bindings.source.physicalSwfSha256 !==
      '8bec405895d09cc8f7dd9f0da197f67726cb45cab6cc8dec3d15b103bc04a97b')
  throw new Error('P043_NATIVE_BINDING_IDENTITY_MISMATCH');

const SOURCE_ORDER: readonly P043ChoiceV1[] = ['A', 'B', 'C', 'D'];
const POPUP_GLOSSARY = [136, 137, 138, 142, 143, 144, 145] as const;
const MAIN_GLOSSARY = [155, 156, 338, 339] as const;

export function p043NativeOptions(state: P043StateViewV1) {
  if (state.phase !== 'quiz-held' || state.mainFrame !== 62 ||
      !state.quizButtonsEnabled || state.feedback) return [];
  return SOURCE_ORDER.map(choice => ({choice,
    ...bindings.options[choice], epoch: state.epoch,
    quizGeneration: state.quizGeneration}));
}

/** Source sprite 307 places popup 304 at frame 16. Only 304's EditText 303
 * is reachable by the observed wrong4 answer path. This is native text after
 * the stage, not a browser-calibrated source-pixel overlay. */
export function p043NativeWrong4(state: P043StateViewV1) {
  const feedback = state.feedback;
  if (!feedback || feedback.spriteId !== 307 || !state.wrongFeedText ||
      !['wrong-feedback-playing', 'wrong-feedback-held'].includes(state.phase) ||
      feedback.frame < bindings.wrong4.popupFirstFrame ||
      feedback.frame > bindings.wrong4.holdFrame) return null;
  return {text: state.wrongFeedText, epoch: state.epoch,
    token: feedback.token, frame: feedback.frame,
    canClose: state.phase === 'wrong-feedback-held' &&
      feedback.frame === bindings.wrong4.holdFrame,
    ...bindings.wrong4};
}

export function p043NativeGlossary(state: P043StateViewV1) {
  const ids = state.phase === 'nmh-popup' && state.nmhPopupVisible
    ? POPUP_GLOSSARY
    : state.mainFrame >= 2 && !state.nmhPopupVisible &&
      ['prequiz', 'quiz-held', 'postquiz'].includes(state.phase)
      ? MAIN_GLOSSARY : [];
  return ids.filter(buttonId => {
    const item = bindings.glossary[String(buttonId) as keyof typeof bindings.glossary];
    const localFrame = item.ownerSpriteId === 146 ? 1 : state.mainFrame;
    return localFrame >= item.firstFrame && localFrame <= item.lastFrame;
  }).map(buttonId => ({buttonId,
    ...bindings.glossary[String(buttonId) as keyof typeof bindings.glossary],
    epoch: state.epoch, quizGeneration: state.quizGeneration}));
}

export interface P043NativeV1Props {
  state: P043StateViewV1;
  language?: 'en' | 'es';
  rootRef?: React.Ref<HTMLElement>;
  onChoose?: (choice: P043ChoiceV1, epoch: number, generation: number) => void;
  onOpenNmh?: (epoch: number, generation: number) => void;
  onCloseNmh?: (epoch: number, generation: number) => void;
  onCloseWrong?: (epoch: number, token: string) => void;
  onGlossary?: (buttonId: number, epoch: number, generation: number,
    trigger: HTMLButtonElement) => void;
}

export function P043NativeV1({state, language = 'en', rootRef,
  onChoose, onOpenNmh, onCloseNmh, onCloseWrong,
  onGlossary}: P043NativeV1Props) {
  const options = p043NativeOptions(state);
  const wrong = p043NativeWrong4(state);
  const glossary = p043NativeGlossary(state);
  const sourceQuestion = p043QuestionAtFrame(state.mainFrame);
  const nmhOpen = state.phase === 'quiz-held' && state.nmhButtonEnabled &&
    state.mainFrame === 62;
  const nmhPopup = state.phase === 'nmh-popup' && state.nmhPopupVisible;
  return <section ref={rootRef} lang="en" aria-label="Original lesson text in English"
    data-p043-native-v1="true" data-p043-phase={state.phase}
    data-p043-source-sha256={bindings.source.physicalSwfSha256}
    data-p043-native-model-sha256={bindings.source.nativeModelSha256}
    data-p043-native-binding-sha256={P043_NATIVE_BINDING_SHA256}
    data-p043-language-policy={language === 'es' ? 'source-en-fallback' : 'source-en'}
    data-p043-overlay-calibration="pending"
    style={{display: 'grid', gap: '0.75em', minWidth: 0, maxWidth: '100%',
      boxSizing: 'border-box', padding: '0.75em', fontSize: '1rem', lineHeight: 1.5}}>
    {language === 'es' && <small lang="es">Texto original en inglés</small>}
    {sourceQuestion && <div data-p043-section="source-question-text"
      data-source-instruction-text-id={sourceQuestion.instruction.objectId}
      data-source-story-text-id={sourceQuestion.story.objectId}
      data-source-question-text-id={sourceQuestion.question.objectId}
      style={{display: 'grid', gap: '0.5em', minWidth: 0}}>
      <p style={{margin: 0}}>{sourceQuestion.instruction.text}</p>
      <p style={{margin: 0, overflowWrap: 'anywhere'}}>{sourceQuestion.story.text}</p>
      <p style={{margin: 0}}>{sourceQuestion.question.text}</p>
    </div>}
    {options.length > 0 && <div role="group" aria-label="Answer choices"
      data-p043-section="source-quiz-options"
      style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 12rem), 1fr))',
        gap: '0.5em', minWidth: 0}}>
      {options.map(option => <button key={option.choice} type="button"
        data-source-choice={option.choice} data-source-instance={option.instance}
        data-source-button-id={option.buttonId}
        data-source-hit-box={option.hitBoxPx.join(',')}
        data-source-letter-text-id={option.letterTextId}
        data-source-value-text-id={option.valueTextId}
        onClick={() => onChoose?.(option.choice, option.epoch, option.quizGeneration)}
        disabled={!onChoose}
        style={{minHeight: 44, maxWidth: '100%', overflowWrap: 'anywhere', textAlign: 'left',
          border: '1px solid currentColor', borderRadius: '0.4em', background: '#edf6fc',
          color: 'inherit', font: 'inherit', padding: '0.5em 0.75em'}}>
        <strong>{option.choice}.</strong> {option.sourceValue}
      </button>)}
    </div>}
    {nmhOpen && <button type="button" data-p043-section="source-nmh-open"
      data-source-button-id={bindings.nmh.openButtonId}
      onClick={() => onOpenNmh?.(state.epoch, state.quizGeneration)}
      disabled={!onOpenNmh} style={{minHeight: 44, justifySelf: 'start',
        font: 'inherit', padding: '0.45em 0.8em'}}>
      Need More Help
    </button>}
    {wrong && <div role="status" aria-live="polite"
      data-p043-section="source-wrong4-text"
      data-source-sprite-id={wrong.spriteId}
      data-source-popup-sprite-id={wrong.popupSpriteId}
      data-source-edit-text-id={wrong.editTextId}
      data-source-text-stage-box={wrong.textStageBoxPx.join(',')}
      data-source-close-stage-box={wrong.closeStageBoxPx.join(',')}
      style={{display: 'grid', gap: '0.5em', minWidth: 0}}>
      <p style={{margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>
        {wrong.text}
      </p>
      {wrong.canClose && <button type="button"
        data-source-button-id={wrong.closeButtonId}
        onClick={() => onCloseWrong?.(wrong.epoch, wrong.token)}
        disabled={!onCloseWrong} style={{minHeight: 44, justifySelf: 'start',
          font: 'inherit', padding: '0.45em 0.8em'}}>
        Close
      </button>}
    </div>}
    {nmhPopup && <div role="dialog" aria-label="Need More Help"
      data-p043-section="source-nmh-popup"
      data-source-popup-sprite-id={bindings.nmh.popupSpriteId}
      style={{display: 'grid', gap: '0.5em', minWidth: 0}}>
      <strong>Need More Help</strong>
      <div role="group" aria-label="Glossary terms"
        style={{display: 'flex', flexWrap: 'wrap', gap: '0.5em'}}>
        {glossary.map(item => <button key={item.buttonId} type="button"
          data-source-glossary-button-id={item.buttonId}
          data-source-owner-sprite-id={item.ownerSpriteId}
          onClick={event => onGlossary?.(item.buttonId, item.epoch,
            item.quizGeneration, event.currentTarget)} disabled={!onGlossary}
          style={{minHeight: 44, font: 'inherit', padding: '0.45em 0.8em'}}>
          {item.term}</button>)}
      </div>
      <button type="button" data-source-button-id={bindings.nmh.closeButtonId}
        onClick={() => onCloseNmh?.(state.epoch, state.quizGeneration)}
        disabled={!onCloseNmh} style={{minHeight: 44, font: 'inherit',
          padding: '0.45em 0.8em'}}>
        Close
      </button>
    </div>}
    {!nmhPopup && glossary.length > 0 && <div role="group" aria-label="Glossary terms"
      data-p043-section="source-main-glossary"
      style={{display: 'flex', flexWrap: 'wrap', gap: '0.5em'}}>
      {glossary.map(item => <button key={item.buttonId} type="button"
        data-source-glossary-button-id={item.buttonId}
        data-source-owner-sprite-id={item.ownerSpriteId}
        onClick={event => onGlossary?.(item.buttonId, item.epoch,
          item.quizGeneration, event.currentTarget)} disabled={!onGlossary}
        style={{minHeight: 44, font: 'inherit', padding: '0.45em 0.8em'}}>
        {item.term}</button>)}
    </div>}
  </section>;
}
