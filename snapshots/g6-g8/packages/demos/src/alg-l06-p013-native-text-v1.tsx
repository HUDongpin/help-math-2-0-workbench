import React from 'react';
import {P013_TEXT_STATE_SOURCE, p013TextState, type P013GlossaryKey}
  from './generated/alg-l06-p013-text-state-v1';

export interface P013NativeTextV1Props {
  frame: number;
  language?: 'en' | 'es';
  onGlossary?: (key: P013GlossaryKey, trigger: HTMLButtonElement) => void;
}

/** Semantic reading companion; source artwork and glyphs remain in the Canvas. */
export function P013NativeTextV1({frame, language = 'en', onGlossary}: P013NativeTextV1Props) {
  const state = p013TextState(frame);
  const buttonStyle: React.CSSProperties = {
    border: '1px solid currentColor', borderRadius: '0.4em', background: '#edf6fc',
    color: 'inherit', cursor: 'pointer', font: 'inherit', padding: '0.45em 0.8em',
  };
  const groupStyle: React.CSSProperties = {
    borderLeft: '0.3em solid #416f98', padding: '0.25em 0.8em', minWidth: 0,
  };
  const glossaryButton = (key: P013GlossaryKey,
    control: typeof state.input.control) => control.available &&
    <button type="button" data-p013-glossary-key={key}
      data-source-button-id={control.sourceCharacterId}
      data-source-action-sha256={control.sourceActionSha256}
      data-source-button-visual-state={control.sourceVisualState}
      disabled={!onGlossary}
      onClick={event => onGlossary?.(key, event.currentTarget)}
      style={buttonStyle} aria-label={`Open ${key} glossary`}>{key} glossary</button>;

  return <section lang="en" aria-label="Lesson text" data-p013-native-text="true"
    data-p013-text-frame={frame} data-p013-frame-domain={state.frameDomain}
    data-p013-source-sha256={P013_TEXT_STATE_SOURCE.sourceSwfSha256}
    data-p013-language-policy={language === 'es' ? 'source-en-fallback' : 'source-en'}
    data-p013-canvas-suppression="none"
    style={{fontFamily: 'var(--font-lesson-sans, Arial), sans-serif', fontSize: '1rem',
      lineHeight: 1.5, color: '#15344c', minWidth: 0, padding: '1rem',
      background: '#fff', borderRadius: '0.75rem', overflowWrap: 'anywhere'}}>
    {(state.formulas.fahrenheit.semanticVisible || state.formulas.area.semanticVisible) &&
      <div role="group" aria-label="Example formulas" data-p013-formulas="true"
        style={{display: 'flex', flexWrap: 'wrap', gap: '0.4em 2em', marginBottom: '0.9em'}}>
        {state.formulas.fahrenheit.semanticVisible && <p data-p013-formula="fahrenheit"
          data-source-text-ids={state.formulas.fahrenheit.sourceTextIds.join(' ')}
          aria-label="F equals nine fifths times C plus 32"
          style={{margin: 0, fontSize: '1.15em', fontVariantNumeric: 'tabular-nums'}}>
          {state.formulas.fahrenheit.text}
        </p>}
        {state.formulas.area.semanticVisible && <p data-p013-formula="area"
          data-source-text-ids={state.formulas.area.sourceTextIds.join(' ')}
          aria-label="A equals l times w"
          style={{margin: 0, fontSize: '1.15em'}}>{state.formulas.area.text}</p>}
      </div>}
    {(state.input.control.available || state.input.labelVisible || state.input.sentenceVisible) &&
      <div role="group" aria-label="Input" data-p013-term="Input" style={groupStyle}>
        {state.input.labelVisible && <h3 data-source-text-ids={state.input.labelSourceTextIds.join(' ')}
          style={{margin: '0 0 0.25em', fontSize: '1.1em'}}>Input</h3>}
        {state.input.sentenceVisible && <p data-p013-sentence="Input"
          data-source-text-ids={state.input.sourceTextIds.join(' ')}
          style={{margin: '0 0 0.5em'}}>{state.input.sentence}</p>}
        {glossaryButton('Input', state.input.control)}
      </div>}
    {(state.output.control.available || state.output.labelVisible || state.output.sentenceVisible) &&
      <div role="group" aria-label="Output" data-p013-term="Output"
        style={{...groupStyle, marginTop: '0.75em'}}>
        {state.output.labelVisible && <h3 data-source-text-ids={state.output.labelSourceTextIds.join(' ')}
          style={{margin: '0 0 0.25em', fontSize: '1.1em'}}>Output</h3>}
        {state.output.sentenceVisible && <p data-p013-sentence="Output"
          data-source-text-ids={state.output.sourceTextIds.join(' ')}
          style={{margin: '0 0 0.5em'}}>{state.output.sentence}</p>}
        {glossaryButton('Output', state.output.control)}
      </div>}
  </section>;
}
