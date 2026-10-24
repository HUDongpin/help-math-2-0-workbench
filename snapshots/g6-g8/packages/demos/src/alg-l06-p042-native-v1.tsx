import React from 'react';
import {
  P042_GLOSSARY, P042_SOURCE,
  type P042Choice, type P042GlossaryButton, type P042State,
} from './alg-l06-p042-state-v1';

/** Curated from native-model-v1.json SHA-256 746677e6... with original
 * 800×600 source-stage coordinates. These are evidence metadata, not a
 * calibrated HTML overlay or a replacement for Canvas glyphs. */
export const P042_NATIVE = Object.freeze({
  nativeModelSha256: '746677e644824564427e48c4636f88fb407e65d1bc95a2b76f9d3426799432f0',
  stage: {width: 800, height: 600},
  quizFrame: 279,
  options: {
    A: {instance: 'AnsBtn2', buttonId: 171, value: '–3', letterTextId: 52,
      valueTextId: 162, hitBoxPx: [90, 236.45, 166.1103, 268.0961]},
    B: {instance: 'AnsBtn1', buttonId: 169, value: '3', letterTextId: 37,
      valueTextId: 164, hitBoxPx: [91.35, 280.6, 165.0214, 313.4122]},
    C: {instance: 'AnsBtn3', buttonId: 170, value: '10', letterTextId: 60,
      valueTextId: 166, hitBoxPx: [90.55, 322.239, 165.9489, 358.5056]},
    D: {instance: 'AnsBtn4', buttonId: 170, value: '25', letterTextId: 49,
      valueTextId: 168, hitBoxPx: [90.8, 369.5, 166.123, 402.4732]},
  },
  nmh: {openButtonId: 146, closeButtonId: 181,
    openMainMatrixTwips: [5726, -3082], closeMainMatrixTwips: [6461, -2373],
    popupSpriteId: 145},
  wrong: {spriteId: 292, popupSpriteId: 288, popupFirstFrame: 16,
    holdFrame: 22, editTextId: 287, closeButtonId: 285,
    textLocalMatrixTwips: [-2064, -618], closeLocalMatrixTwips: [5086, -896],
    /** Root→main→wrong feedback→popup→EditText bounds, in source pixels. */
    textStageBoxPx: [144.9, 161.9, 633.25, 227.8],
    closeStageBoxPx: [552.7, 132.45, 642.5, 160.45]},
  glossary: {
    135: {ownerSpriteId: 145, localMatrixTwips: [-14232, 5201]},
    136: {ownerSpriteId: 145, localMatrixTwips: [-11752, 5221]},
    137: {ownerSpriteId: 145, localMatrixTwips: [-10772, 5221]},
    140: {ownerSpriteId: 145, localMatrixTwips: [-14229, 7299]},
    141: {ownerSpriteId: 145, localMatrixTwips: [-12109, 7299]},
    142: {ownerSpriteId: 145, localMatrixTwips: [-7709, 7299]},
    143: {ownerSpriteId: 145, localMatrixTwips: [-3569, 7299]},
    152: {ownerSpriteId: 341, localMatrixTwips: [294, -3939]},
    153: {ownerSpriteId: 341, localMatrixTwips: [-4979, -3923]},
    154: {ownerSpriteId: 341, localMatrixTwips: [3504, -3939]},
  },
} as const);

if (P042_SOURCE.animationId !== 'shared-alg001-l06-p042' ||
    P042_SOURCE.quizFrame !== P042_NATIVE.quizFrame ||
    P042_NATIVE.stage.width !== 800 || P042_NATIVE.stage.height !== 600)
  throw new Error('P042_NATIVE_SOURCE_IDENTITY_MISMATCH');

const SOURCE_ORDER: readonly P042Choice[] = ['A', 'B', 'C', 'D'];
const NMH_GLOSSARY: readonly P042GlossaryButton[] = [135, 136, 137, 140, 141, 142, 143];
const MAIN_GLOSSARY: readonly P042GlossaryButton[] = [153, 152, 154];

export function p042NativeOptions(state: P042State) {
  if (state.phase !== 'quiz-held' || state.mainFrame !== 279 ||
      !state.quizButtonsEnabled || state.feedback) return [];
  return SOURCE_ORDER.map(choice => ({choice, ...P042_NATIVE.options[choice],
    epoch: state.epoch, quizGeneration: state.quizGeneration}));
}

export function p042NativeWrongFeedback(state: P042State) {
  const feedback = state.feedback;
  if (!feedback || feedback.spriteId !== 292 ||
      !['wrong-feedback-playing', 'wrong-feedback-held'].includes(state.phase) ||
      feedback.frame < P042_NATIVE.wrong.popupFirstFrame ||
      feedback.frame > P042_NATIVE.wrong.holdFrame || !state.wrongFeedText) return null;
  return {text: state.wrongFeedText, frame: feedback.frame, token: feedback.token,
    epoch: state.epoch, canClose: state.phase === 'wrong-feedback-held' &&
      feedback.frame === P042_NATIVE.wrong.holdFrame,
    ...P042_NATIVE.wrong};
}

export function p042NativeGlossary(state: P042State) {
  const visibleIds = state.phase === 'nmh-popup' && state.nmhPopupVisible
    ? NMH_GLOSSARY
    : state.mainFrame >= 2 && !state.nmhPopupVisible &&
      ['prequiz', 'quiz-held', 'postquiz'].includes(state.phase)
      ? MAIN_GLOSSARY : [];
  return visibleIds.map(buttonId => ({buttonId, term: P042_GLOSSARY[buttonId],
    ...P042_NATIVE.glossary[buttonId],
    epoch: state.epoch, quizGeneration: state.quizGeneration}));
}

export interface P042NativeCompanionPropsV1 {
  state: P042State;
  language?: 'en' | 'es';
  rootRef?: React.Ref<HTMLElement>;
  onChoose?: (choice: P042Choice, epoch: number, quizGeneration: number) => void;
  onOpenNmh?: (epoch: number, quizGeneration: number) => void;
  onCloseNmh?: (epoch: number, quizGeneration: number) => void;
  onCloseWrong?: (epoch: number, token: string) => void;
  onGlossary?: (buttonId: P042GlossaryButton, epoch: number, quizGeneration: number,
    trigger: HTMLButtonElement) => void;
}

/** Source-English controls sit after the stage. Canvas keeps its original glyphs;
 * placement as a stage overlay awaits real My Lesson browser calibration. */
export function P042NativeCompanionV1({state, language = 'en', rootRef,
  onChoose, onOpenNmh, onCloseNmh, onCloseWrong, onGlossary}: P042NativeCompanionPropsV1) {
  const options = p042NativeOptions(state);
  const wrong = p042NativeWrongFeedback(state);
  const glossary = p042NativeGlossary(state);
  const nmhOpen = state.phase === 'quiz-held' && state.nmhButtonEnabled &&
    state.mainFrame === 279;
  const nmhPopup = state.phase === 'nmh-popup' && state.nmhPopupVisible;
  const fallback = language === 'es';
  return <section ref={rootRef} lang="en" aria-label="Original lesson text in English"
    data-p042-native-companion="true" data-p042-source-sha256={P042_SOURCE.swfSha256}
    data-p042-native-model-sha256={P042_NATIVE.nativeModelSha256}
    data-p042-stage-size="800,600" data-p042-phase={state.phase}
    data-p042-epoch={state.epoch} data-p042-language-policy={fallback ? 'source-en-fallback' : 'source-en'}
    data-p042-canvas-glyphs="preserved" data-p042-overlay-calibration="pending"
    style={{display: 'grid', gap: '0.75em', minWidth: 0, maxWidth: '100%',
      boxSizing: 'border-box', padding: '0.75em', color: '#15344c',
      fontFamily: 'var(--font-lesson-sans, Arial), sans-serif', fontSize: '1rem', lineHeight: 1.5}}>
    {fallback && <small lang="es">Texto original en inglés</small>}
    {options.length > 0 && <div role="group" aria-label="Answer choices"
      data-p042-section="source-quiz-options"
      style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 12rem), 1fr))',
        gap: '0.5em', minWidth: 0}}>
      {options.map(option => <button key={option.choice} type="button"
        data-source-choice={option.choice} data-source-instance={option.instance}
        data-source-button-id={option.buttonId} data-source-hit-box={option.hitBoxPx.join(',')}
        data-source-letter-text-id={option.letterTextId} data-source-value-text-id={option.valueTextId}
        onClick={() => onChoose?.(option.choice, option.epoch, option.quizGeneration)} disabled={!onChoose}
        style={{minHeight: 44, maxWidth: '100%', overflowWrap: 'anywhere', textAlign: 'left',
          border: '1px solid currentColor', borderRadius: '0.4em', background: '#edf6fc',
          color: 'inherit', font: 'inherit', padding: '0.5em 0.75em'}}>
        <strong>{option.choice}.</strong> {option.value}
      </button>)}
    </div>}
    {nmhOpen && <button type="button" data-p042-section="source-nmh-open"
      data-source-button-id={P042_NATIVE.nmh.openButtonId}
      data-source-main-matrix-twips={P042_NATIVE.nmh.openMainMatrixTwips.join(',')}
      onClick={() => onOpenNmh?.(state.epoch, state.quizGeneration)} disabled={!onOpenNmh}
      style={{minHeight: 44, justifySelf: 'start', font: 'inherit', padding: '0.45em 0.8em'}}>
      Need More Help
    </button>}
    {wrong && <div role="status" aria-live="polite" data-p042-section="source-wrong-feedback"
      data-source-sprite-id={wrong.spriteId} data-source-popup-sprite-id={wrong.popupSpriteId}
      data-source-edit-text-id={wrong.editTextId}
      data-source-text-stage-box={wrong.textStageBoxPx.join(',')}
      data-source-close-stage-box={wrong.closeStageBoxPx.join(',')}
      style={{display: 'grid', gap: '0.5em', minWidth: 0}}>
      <p style={{margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>{wrong.text}</p>
      {wrong.canClose && <button type="button" data-source-button-id={wrong.closeButtonId}
        onClick={() => onCloseWrong?.(wrong.epoch, wrong.token)} disabled={!onCloseWrong}
        style={{minHeight: 44, justifySelf: 'start', font: 'inherit', padding: '0.45em 0.8em'}}>
        Close
      </button>}
    </div>}
    {nmhPopup && <div role="dialog" aria-label="Need More Help" data-p042-section="source-nmh-popup"
      data-source-popup-sprite-id={P042_NATIVE.nmh.popupSpriteId}
      style={{display: 'grid', gap: '0.5em', minWidth: 0}}>
      <strong>Need More Help</strong>
      <div role="group" aria-label="Glossary terms"
        style={{display: 'flex', flexWrap: 'wrap', gap: '0.5em'}}>
        {glossary.map(item => <button key={item.buttonId} type="button"
          data-source-glossary-button-id={item.buttonId}
          data-source-owner-sprite-id={item.ownerSpriteId}
          data-source-local-matrix-twips={item.localMatrixTwips.join(',')}
          onClick={event => onGlossary?.(item.buttonId, item.epoch,
            item.quizGeneration, event.currentTarget)}
          disabled={!onGlossary}
          style={{minHeight: 44, font: 'inherit', padding: '0.45em 0.8em'}}>
          {item.term}
        </button>)}
      </div>
      <button type="button" data-source-button-id={P042_NATIVE.nmh.closeButtonId}
        data-source-main-matrix-twips={P042_NATIVE.nmh.closeMainMatrixTwips.join(',')}
        onClick={() => onCloseNmh?.(state.epoch, state.quizGeneration)} disabled={!onCloseNmh}
        style={{minHeight: 44, justifySelf: 'start', font: 'inherit', padding: '0.45em 0.8em'}}>
        Close
      </button>
    </div>}
    {!nmhPopup && glossary.length > 0 && <div role="group" aria-label="Glossary terms"
      data-p042-section="source-main-glossary"
      style={{display: 'flex', flexWrap: 'wrap', gap: '0.5em'}}>
      {glossary.map(item => <button key={item.buttonId} type="button"
        data-source-glossary-button-id={item.buttonId}
        data-source-owner-sprite-id={item.ownerSpriteId}
        data-source-local-matrix-twips={item.localMatrixTwips.join(',')}
          onClick={event => onGlossary?.(item.buttonId, item.epoch,
            item.quizGeneration, event.currentTarget)}
        disabled={!onGlossary}
        style={{minHeight: 44, font: 'inherit', padding: '0.45em 0.8em'}}>
        {item.term}
      </button>)}
    </div>}
  </section>;
}
