import React from 'react';
import bindings from '../../../migrations/shared-alg001-l06-p044/native-v1/native-bindings-v1.json';

export type P044ChoiceV1 = 'A' | 'B' | 'C' | 'D';
export interface P044StateViewV1 {
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

export const P044_NATIVE_BINDING_SHA256 =
  'd803b8a65c1d52530dead0bbe742af776c6e8b8adb651609473ef8b8c041f37b' as const;

if (bindings.animationId !== 'shared-alg001-l06-p044' ||
    bindings.quizFrame !== 53 || bindings.stage.width !== 800 ||
    bindings.stage.height !== 600 ||
    bindings.source.physicalSwfSha256 !==
      '50952b58f10d24b5d649930817aff9f6b779ebb1f698f14392eda00d8afdec34')
  throw new Error('P044_NATIVE_BINDING_IDENTITY_MISMATCH');

const SOURCE_ORDER: readonly P044ChoiceV1[] = ['A', 'B', 'C', 'D'];
const POPUP_GLOSSARY = [137, 138, 139, 140, 141] as const;
const MAIN_GLOSSARY = [149, 150] as const;

export function p044NativeOptions(state: P044StateViewV1) {
  if (state.phase !== 'quiz-held' || state.mainFrame !== 53 ||
      !state.quizButtonsEnabled || state.feedback) return [];
  return SOURCE_ORDER.map(choice => ({choice,
    ...bindings.options[choice], epoch: state.epoch,
    quizGeneration: state.quizGeneration}));
}

/** Source sprite 336 places popup 333 at frame 13. Only 333's EditText 332
 * is reachable by the observed wrong4 answer path. This is native text after
 * the stage, not a browser-calibrated source-pixel overlay. */
export function p044NativeWrong4(state: P044StateViewV1) {
  const feedback = state.feedback;
  if (!feedback || feedback.spriteId !== 336 || !state.wrongFeedText ||
      !['wrong-feedback-playing', 'wrong-feedback-held'].includes(state.phase) ||
      feedback.frame < bindings.wrong4.popupFirstFrame ||
      feedback.frame > bindings.wrong4.holdFrame) return null;
  return {text: state.wrongFeedText, epoch: state.epoch,
    token: feedback.token, frame: feedback.frame,
    canClose: state.phase === 'wrong-feedback-held' &&
      feedback.frame === bindings.wrong4.holdFrame,
    ...bindings.wrong4};
}

export function p044NativeGlossary(state: P044StateViewV1) {
  const ids = state.phase === 'nmh-popup' && state.nmhPopupVisible
    ? POPUP_GLOSSARY
    : state.mainFrame >= 2 && !state.nmhPopupVisible &&
      ['prequiz', 'quiz-held', 'postquiz'].includes(state.phase)
      ? MAIN_GLOSSARY : [];
  return ids.filter(buttonId => {
    const item = bindings.glossary[String(buttonId) as keyof typeof bindings.glossary];
    const localFrame = item.ownerSpriteId === 142 ? 1 : state.mainFrame;
    return localFrame >= item.firstFrame && localFrame <= item.lastFrame;
  }).map(buttonId => ({buttonId,
    ...bindings.glossary[String(buttonId) as keyof typeof bindings.glossary],
    epoch: state.epoch, quizGeneration: state.quizGeneration}));
}

export interface P044NativeV1Props {
  state: P044StateViewV1;
  language?: 'en' | 'es';
  rootRef?: React.Ref<HTMLElement>;
  onChoose?: (choice: P044ChoiceV1, epoch: number, generation: number) => void;
  onOpenNmh?: (epoch: number, generation: number) => void;
  onCloseNmh?: (epoch: number, generation: number) => void;
  onCloseWrong?: (epoch: number, token: string) => void;
  onGlossary?: (buttonId: number, epoch: number, generation: number,
    trigger: HTMLButtonElement) => void;
}

export function P044NativeV1({state, language = 'en', rootRef,
  onChoose, onOpenNmh, onCloseNmh, onCloseWrong,
  onGlossary}: P044NativeV1Props) {
  const options = p044NativeOptions(state);
  const wrong = p044NativeWrong4(state);
  const glossary = p044NativeGlossary(state);
  const sourceQuestion = state.mainFrame >= bindings.question.firstFrame &&
    state.mainFrame <= bindings.question.lastFrame ? bindings.question : null;
  const nmhOpen = state.phase === 'quiz-held' && state.nmhButtonEnabled &&
    state.mainFrame === 53;
  const nmhPopup = state.phase === 'nmh-popup' && state.nmhPopupVisible;
  return <section ref={rootRef} lang="en" aria-label="Original lesson text in English"
    data-p044-native-v1="true" data-p044-phase={state.phase}
    data-p044-source-sha256={bindings.source.physicalSwfSha256}
    data-p044-native-model-sha256={bindings.source.nativeModelSha256}
    data-p044-native-binding-sha256={P044_NATIVE_BINDING_SHA256}
    data-p044-language-policy={language === 'es' ? 'source-en-fallback' : 'source-en'}
    data-p044-overlay-calibration="pending"
    style={{display: 'grid', gap: '0.75em', minWidth: 0, maxWidth: '100%',
      boxSizing: 'border-box', padding: '0.75em', fontSize: '1rem', lineHeight: 1.5}}>
    {language === 'es' && <small lang="es">Texto original en inglés</small>}
    {sourceQuestion && <div data-p044-section="source-question-text"
      data-source-question-text-id={sourceQuestion.objectId}
      style={{display: 'grid', gap: '0.5em', minWidth: 0}}>
      <p style={{margin: 0}}>{sourceQuestion.text}</p>
    </div>}
    {options.length > 0 && <div role="group" aria-label="Answer choices"
      data-p044-section="source-quiz-options"
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
    {nmhOpen && <button type="button" data-p044-section="source-nmh-open"
      data-source-button-id={bindings.nmh.openButtonId}
      onClick={() => onOpenNmh?.(state.epoch, state.quizGeneration)}
      disabled={!onOpenNmh} style={{minHeight: 44, justifySelf: 'start',
        font: 'inherit', padding: '0.45em 0.8em'}}>
      Need More Help
    </button>}
    {wrong && <div role="status" aria-live="polite"
      data-p044-section="source-wrong4-text"
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
      data-p044-section="source-nmh-popup"
      data-source-popup-sprite-id={bindings.nmh.popupSpriteId}
      style={{display: 'grid', gap: '0.5em', minWidth: 0}}>
      <strong>Need More Help</strong>
      {bindings.nmhText.map(row => <p key={row.objectId}
        data-source-nmh-text-id={row.objectId}
        style={{margin:0,overflowWrap:'anywhere'}}>{row.text}</p>)}
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
      data-p044-section="source-main-glossary"
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
