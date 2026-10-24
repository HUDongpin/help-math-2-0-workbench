import React from 'react';
import {P010_TEXT_STATE_SOURCE, p010TextState} from './generated/alg-l06-p010-text-state-v1';

export interface P010NativeTextV1Props {
  frame: number;
  language?: 'en' | 'es';
  onGlossary?: (key: 'Function', trigger: HTMLButtonElement) => void;
}

/** Source-timed native reading companion. The Canvas artwork retains its glyphs. */
export function P010NativeTextV1({frame, language = 'en', onGlossary}: P010NativeTextV1Props) {
  const state = p010TextState(frame);
  const cell: React.CSSProperties = {
    padding: '0.45em 0.6em',
    borderBottom: '1px solid #b6c4ce',
    textAlign: 'start',
    whiteSpace: 'nowrap',
  };
  const tableVisible = state.tableHeaders.cups.semanticVisible && state.tableHeaders.money.semanticVisible;
  const graphVisible = state.graph.cups.some(label => label.semanticVisible) ||
    state.graph.money.some(label => label.semanticVisible);

  return <section lang="en" aria-label="Lesson text" data-p010-native-text="true"
    data-p010-text-frame={frame} data-p010-frame-domain={state.frameDomain}
    data-p010-source-sha256={P010_TEXT_STATE_SOURCE.sourceSwfSha256}
    data-p010-language-policy={language === 'es' ? 'source-en-fallback' : 'source-en'}
    data-p010-canvas-suppression="none"
    style={{fontFamily: 'var(--font-lesson-sans, Arial), sans-serif', fontSize: '1rem',
      lineHeight: 1.5, color: '#15344c', minWidth: 0, padding: '1rem',
      background: '#fff', borderRadius: '0.75rem'}}>
    <h2 data-p010-title="true"
      data-source-text-ids={`character-${P010_TEXT_STATE_SOURCE.offstageTitle.characterId}`}
      data-source-shape-ids={P010_TEXT_STATE_SOURCE.offstageTitle.sourceShapeIds.join(' ')}
      style={{fontSize: '1.3em', lineHeight: 1.35, margin: '0 0 0.75em'}}>
      {P010_TEXT_STATE_SOURCE.offstageTitle.text}
    </h2>
    {state.heading.semanticVisible && <h3 data-source-text-ids={state.heading.sourceTextIds.join(' ')}
      data-source-instance-ids={state.heading.instanceIds.join(' ')}
      style={{fontSize: '1.15em', lineHeight: 1.35, margin: '0 0 0.75em'}}>
      {state.heading.text}
    </h3>}
    {state.equation.semanticVisible && <p aria-label="Money made equals fifty cents times cups sold"
      data-p010-equation="true" data-source-text-ids={state.equation.sourceTextIds.join(' ')}
      data-source-instance-ids={state.equation.instanceIds.join(' ')}
      style={{fontSize: '1.2em', fontWeight: 650, fontVariantNumeric: 'tabular-nums',
        margin: '0 0 0.75em'}}>{state.equation.text}</p>}
    {tableVisible && <div role="region" aria-label="Lemonade sales table" tabIndex={0}
      style={{overflowX: 'auto', marginBottom: '0.75em'}}>
      <table data-p010-table="lemonade" style={{borderCollapse: 'collapse', minWidth: '18em',
        width: '100%', fontVariantNumeric: 'tabular-nums'}}>
        <thead><tr>
          <th scope="col" data-source-text-ids={state.tableHeaders.cups.sourceTextIds.join(' ')}
            style={cell}>{state.tableHeaders.cups.text}</th>
          <th scope="col" data-source-text-ids={state.tableHeaders.money.sourceTextIds.join(' ')}
            style={{...cell, textAlign: 'end'}}>{state.tableHeaders.money.text}</th>
        </tr></thead>
        <tbody>{state.tableRows.filter(row => row.semanticVisible).map(row => <tr key={row.id}
          data-p010-row={row.id} data-source-instance-ids={[...row.cups.instanceIds,
            ...row.money.instanceIds].join(' ')}>
          <th scope="row" data-source-text-ids={row.cups.sourceTextIds.join(' ')}
            style={cell}>{row.cups.text}</th>
          <td data-source-text-ids={row.money.sourceTextIds.join(' ')}
            style={{...cell, textAlign: 'end'}}>{row.money.text}</td>
        </tr>)}</tbody>
      </table>
    </div>}
    {graphVisible && <div role="group" aria-label="Graph number labels" data-p010-graph-labels="true"
      style={{display: 'flex', flexWrap: 'wrap', gap: '0.5em 2em', marginBottom: '0.75em'}}>
      <div><strong>Cups sold values</strong><p data-p010-graph-label-group="cups" style={{margin: 0}}
        data-source-text-ids={state.graph.cups.flatMap(label => label.sourceTextIds).join(' ')}>
        {state.graph.cups.filter(label => label.semanticVisible).map(label => label.text).join(', ')}
      </p></div>
      <div><strong>Money values</strong><p data-p010-graph-label-group="money" style={{margin: 0}}
        data-source-text-ids={state.graph.money.flatMap(label => label.sourceTextIds).join(' ')}>
        {state.graph.money.filter(label => label.semanticVisible).map(label => label.text).join(', ')}
      </p></div>
    </div>}
    {state.question.semanticVisible && <p data-p010-question="true"
      data-source-text-ids={state.question.sourceTextIds.join(' ')}
      data-source-instance-ids={state.question.instanceIds.join(' ')}
      style={{margin: '0 0 0.75em', fontWeight: 600}}>{state.question.text}</p>}
    {state.functionControl.available && <button type="button" data-p010-glossary-key="Function"
      data-source-button-id={state.functionControl.sourceCharacterId}
      data-source-button-visual-state={state.functionControl.sourceVisualState}
      disabled={!onGlossary}
      onClick={event => onGlossary?.('Function', event.currentTarget)}
      style={{padding: '0.45em 0.8em', border: '1px solid currentColor', borderRadius: '0.35em',
        background: '#f3f8fb', color: 'inherit', font: 'inherit', cursor: 'pointer'}}>
      Function <span className="sr-only">glossary</span>
    </button>}
  </section>;
}
