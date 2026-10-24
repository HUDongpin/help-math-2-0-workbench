import React from 'react';
import bindings from '../../../migrations/shared-alg001-l06-p045/native-v1/native-bindings-v1.json';

export type P045ChoiceV1 = 'A' | 'B' | 'C' | 'D';
export interface P045StateViewV1 {
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

export const P045_NATIVE_BINDING_SHA256 =
  'feb076bd3eb4689beab49be74a461a64f2dd182021a732da6dd8d3aca35e0a83' as const;

if (bindings.animationId !== 'shared-alg001-l06-p045' ||
    bindings.quizFrame !== 53 || bindings.stage.width !== 800 ||
    bindings.stage.height !== 600 ||
    bindings.source.physicalSwfSha256 !==
      '9dfff51a15bb0010b98ca10c1fac954bee5d9451ceb649d8ac202e98f2c05b9d')
  throw new Error('P045_NATIVE_BINDING_IDENTITY_MISMATCH');

const SOURCE_ORDER: readonly P045ChoiceV1[] = ['A', 'B', 'C', 'D'];
const POPUP_GLOSSARY = [138, 139, 140, 141, 142, 143] as const;
const MAIN_GLOSSARY = [151, 152, 153] as const;

export function p045NativeOptions(state: P045StateViewV1) {
  if (state.phase !== 'quiz-held' || state.mainFrame !== 53 ||
      !state.quizButtonsEnabled || state.feedback) return [];
  return SOURCE_ORDER.map(choice => ({choice,
    ...bindings.options[choice], epoch: state.epoch,
    quizGeneration: state.quizGeneration}));
}

/** Source sprite 307 places popup 303 at frame 16. Only 303's EditText 302
 * is reachable by the observed wrong4 answer path. This is native text after
 * the stage, not a browser-calibrated source-pixel overlay. */
export function p045NativeWrong4(state: P045StateViewV1) {
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

export function p045NativeGlossary(state: P045StateViewV1) {
  const ids = state.phase === 'nmh-popup' && state.nmhPopupVisible
    ? POPUP_GLOSSARY
    : state.mainFrame >= 2 && !state.nmhPopupVisible &&
      ['prequiz', 'quiz-held', 'postquiz'].includes(state.phase)
      ? MAIN_GLOSSARY : [];
  return ids.filter(buttonId => {
    const item = bindings.glossary[String(buttonId) as keyof typeof bindings.glossary];
    const localFrame = item.ownerSpriteId === 144 ? 1 : state.mainFrame;
    return localFrame >= item.firstFrame && localFrame <= item.lastFrame;
  }).map(buttonId => ({buttonId,
    ...bindings.glossary[String(buttonId) as keyof typeof bindings.glossary],
    epoch: state.epoch, quizGeneration: state.quizGeneration}));
}

export interface P045NativeV1Props {
  state: P045StateViewV1;
  answerButtonsOnStage?: boolean;
  language?: 'en' | 'es';
  rootRef?: React.Ref<HTMLElement>;
  onChoose?: (choice: P045ChoiceV1, epoch: number, generation: number) => void;
  onOpenNmh?: (epoch: number, generation: number) => void;
  onCloseNmh?: (epoch: number, generation: number) => void;
  onCloseWrong?: (epoch: number, token: string) => void;
  onGlossary?: (buttonId: number, epoch: number, generation: number,
    trigger: HTMLButtonElement) => void;
}

export function P045NativeV1({state, language = 'en', rootRef, answerButtonsOnStage = false,
  onChoose, onOpenNmh, onCloseNmh, onCloseWrong,
  onGlossary}: P045NativeV1Props) {
  const options = p045NativeOptions(state);
  const wrong = p045NativeWrong4(state);
  const glossary = p045NativeGlossary(state);
  const sourceQuestion = state.mainFrame >= bindings.question.firstFrame &&
    state.mainFrame <= bindings.question.lastFrame ? bindings.question : null;
  const nmhOpen = state.phase === 'quiz-held' && state.nmhButtonEnabled &&
    state.mainFrame === 53;
  const nmhPopup = state.phase === 'nmh-popup' && state.nmhPopupVisible;
  return <section ref={rootRef} lang="en" aria-label="Original lesson text in English"
    data-p045-native-v1="true" data-p045-phase={state.phase}
    data-p045-source-sha256={bindings.source.physicalSwfSha256}
    data-p045-native-model-sha256={bindings.source.nativeModelSha256}
    data-p045-native-binding-sha256={P045_NATIVE_BINDING_SHA256}
    data-p045-language-policy={language === 'es' ? 'source-en-fallback' : 'source-en'}
    data-p045-overlay-calibration="pending"
    style={{display: 'grid', gap: '0.75em', minWidth: 0, maxWidth: '100%',
      boxSizing: 'border-box', padding: '0.75em', fontSize: '1rem', lineHeight: 1.5}}>
    {language === 'es' && <small lang="es">Texto original en inglés</small>}
    {sourceQuestion && <div data-p045-section="source-question-text"
      data-source-question-text-id={sourceQuestion.objectId}
      style={{display: 'grid', gap: '0.5em', minWidth: 0}}>
      <p style={{margin: 0}}>{sourceQuestion.text}</p>
    </div>}
    {!answerButtonsOnStage && options.length > 0 && <div role="group" aria-label="Answer choices"
      data-p045-section="source-quiz-options"
      style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 12rem), 1fr))',
        gap: '0.5em', minWidth: 0}}>
      {options.map(option => <button key={option.choice} type="button"
        data-source-choice={option.choice} data-source-instance={option.instance}
        data-source-button-id={option.buttonId}
        data-source-hit-box={option.hitBoxPx.join(',')}
        data-source-letter-text-id={option.letterTextId}
        onClick={() => onChoose?.(option.choice, option.epoch, option.quizGeneration)}
        disabled={!onChoose}
        style={{minHeight: 44, maxWidth: '100%', overflowWrap: 'anywhere', textAlign: 'left',
          border: '1px solid currentColor', borderRadius: '0.4em', background: '#edf6fc',
          color: 'inherit', font: 'inherit', padding: '0.5em 0.75em'}}>
        {option.sourceValue}
      </button>)}
    </div>}
    {nmhOpen && <button type="button" data-p045-section="source-nmh-open"
      data-source-button-id={bindings.nmh.openButtonId}
      onClick={() => onOpenNmh?.(state.epoch, state.quizGeneration)}
      disabled={!onOpenNmh} style={{minHeight: 44, justifySelf: 'start',
        font: 'inherit', padding: '0.45em 0.8em'}}>
      Need More Help
    </button>}
    {wrong && <div role="status" aria-live="polite"
      data-p045-section="source-wrong4-text"
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
      data-p045-section="source-nmh-popup"
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
      data-p045-section="source-main-glossary"
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

/** The visible source letters are mapped by glyph and geometry, not by AnsBtn number. */
export function P045GraphHitTargetsV1({state, onChoose}: Pick<P045NativeV1Props, 'state' | 'onChoose'>) {
  const positions = {A: 'upper left', B: 'upper right', C: 'lower left', D: 'lower right'};
  return <div role="group" aria-label="Choose a graph" data-p045-graph-targets="true"
    style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
    <style>{'[data-p045-graph-targets] > button:focus-visible { outline: 3px solid #124eab; outline-offset: 2px; box-shadow: 0 0 0 2px #fff; }'}</style>
    {p045NativeOptions(state).map(option => {
      const [left, top, right, bottom] = option.hitBoxPx;
      return <button key={option.choice} type="button"
        aria-label={`Choose graph ${option.choice}, ${positions[option.choice]}`}
        data-source-choice={option.choice} data-source-instance={option.instance}
        data-source-letter-text-id={option.letterTextId}
        data-source-button-id={option.buttonId} data-source-hit-box={option.hitBoxPx.join(',')}
        onClick={() => onChoose?.(option.choice, option.epoch, option.quizGeneration)}
        disabled={!onChoose} style={{position: 'absolute', pointerEvents: 'auto',
          left: `${left / 8}%`, top: `${top / 6}%`, width: `${(right - left) / 8}%`,
          height: `${(bottom - top) / 6}%`, padding: 0, border: '2px solid transparent',
          borderRadius: 4, background: 'transparent', cursor: 'pointer'}}/>;
    })}
  </div>;
}
