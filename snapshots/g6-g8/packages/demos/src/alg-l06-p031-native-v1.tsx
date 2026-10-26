import React from 'react';
import {p031SourceState, type P031Choice} from './alg-l06-p031-source-v1';

export interface P031NativeProps {
  frame: number;
  language?: 'en' | 'es';
  reducedMotion?: boolean;
  onGlossary?: (key: string, trigger: HTMLButtonElement) => void;
  onAnswerRequest?: (choice: P031Choice) => void;
}
const button: React.CSSProperties = {font: 'inherit', minHeight: 44, padding: '.55em .75em',
  color: '#203a60', background: '#f3f7fc', border: '1px solid #8b9dbb', borderRadius: '.35em',
  textAlign: 'left', maxWidth: '100%', overflowWrap: 'anywhere'};

export function P031NativeV1({frame, language = 'en', reducedMotion = false, onGlossary, onAnswerRequest}: P031NativeProps) {
  const state = p031SourceState(frame), en = language === 'en';
  const emphasized = (letter: P031Choice) => letter !== 'A' && state.emphasis[letter];
  const equationEmphasis = reducedMotion ? frame >= 768 && frame <= 778 : state.emphasis.equation;
  const fEmphasis = reducedMotion ? frame >= 818 && frame <= 826 : state.emphasis.variableF;
  const highlight: React.CSSProperties = {outline: '2px solid #b23b27', outlineOffset: 3, fontWeight: 700};
  return <section data-p031-native data-source-sha256={state.sourceSha256} data-p031-frame={frame}
    aria-label={en ? 'Identifying domain and range' : 'Identificar dominio y rango'}
    style={{display: 'grid', gap: '.65em', fontSize: '1rem', lineHeight: 1.5, padding: '.75em',
      minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', overflowWrap: 'anywhere', color: '#203a60'}}>
    {[[6, 8, 10], [14, 15], [16], [18]].map(ids => {
      const rows = state.narrative.filter(row => ids.includes(row.textId));
      return rows.length === 0 ? null : <p key={ids[0]} lang="en" data-source-text-group={ids.join(',')}
        style={{margin: 0, ...(ids[0] === 14 && equationEmphasis ? highlight : {})}}>
        {rows.map(row => <span key={row.textId} data-source-text-id={row.textId}>
          {row.textId === 15 && fEmphasis ? <>0.5<span style={highlight}>F</span></> : row.text}
        </span>)}
      </p>;
    })}
    {state.options.length > 0 && <div role="group" aria-label={en ? 'Answer choices' : 'Opciones de respuesta'}
      style={{display: 'grid', gap: '.5em'}}>{state.options.map(row => <div key={row.letter}
      data-source-text-id={row.textId} data-source-choice={row.letter} data-p031-emphasized={String(emphasized(row.letter))}
      style={emphasized(row.letter) ? highlight : undefined}>
      {row.sourceButtonPresent && onAnswerRequest ? <button type="button" lang="en" style={button}
        data-source-button-id={row.buttonId} onClick={() => onAnswerRequest(row.letter)}>{row.letter}. {row.text}</button>
        : <span lang="en">{row.letter}. {row.text}</span>}
    </div>)}</div>}
    {state.glossary.length > 0 && <div style={{display: 'flex', flexWrap: 'wrap', gap: '.5em'}}>
      {state.glossary.map(row => <button key={row.buttonId} type="button" style={button}
        data-source-glossary-id={row.buttonId} disabled={!onGlossary}
        onClick={event => onGlossary?.(row.key, event.currentTarget)}>{row.key}</button>)}
    </div>}
  </section>;
}
