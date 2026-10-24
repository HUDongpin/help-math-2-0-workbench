import React, {useEffect, useRef} from 'react';
import bindings from '../../../migrations/shared-alg001-l06-p050/native-v1/native-bindings-v1.json';
import {p050PresentationState, type P050Choice, type P050Event, type P050State} from './alg-l06-p050-state-v1';

type Graph = (typeof bindings.questions)[number]['graphs'][number];
const buttonStyle: React.CSSProperties = {font: 'inherit', lineHeight: 1.5, minHeight: '2.75rem',
  padding: '.55em .8em', border: '1px solid #8298b8', borderRadius: '.35em', background: '#f3f7fc',
  color: '#203a60', maxWidth: '100%', minWidth: 0, overflowWrap: 'anywhere'};
const grid = Array.from({length: 21}, (_, n) => n - 10);
const ticks = [-10, -5, 5, 10];

/** Preserve the recovered source curve. HTML axis labels keep the user's
 * font size independently of the SVG's geometry and responsive width. */
const SourceGraph = React.memo(function SourceGraph({graph, label}: {graph: Graph; label: string}) {
  const ends = graph.approximateEndpoints;
  const description = `The red line runs from approximately (${ends[0]![0]}, ${ends[0]![1]}) to (${ends[1]![0]}, ${ends[1]![1]}). Both axes show −10 to 10.`;
  return <span role="img" aria-label={`${label}. ${description}`} lang="en"
    data-p050-graph={graph.sourceShapeId} style={{display: 'block', position: 'relative', aspectRatio: '1',
      width: '100%', maxWidth: '24rem', margin: 'auto', color: '#203a60', background: '#fff'}}>
    <svg aria-hidden="true" viewBox="-12.5 -12.5 25 25" style={{display: 'block', width: '100%', height: '100%'}}>
      {grid.map(n => <g key={n} stroke="#cad5e5" strokeWidth=".035">
        <path d={`M ${n} -10 L ${n} 10 M -10 ${n} L 10 ${n}`} />
      </g>)}
      <path d="M -11 0 H 11 M 0 -11 V 11 M 10.5 -.3 L 11 0 10.5 .3 M -.3 -10.5 L 0 -11 .3 -10.5"
        fill="none" stroke="#34455f" strokeWidth=".1" />
      <path d={graph.path} fill="none" stroke="#c92323" strokeWidth=".18" strokeLinecap="round" />
    </svg>
    {ticks.map(n => <React.Fragment key={n}>
      <span aria-hidden="true" style={{position: 'absolute', left: `${50 + n * 4}%`, top: '51%',
        transform: 'translateX(-50%)', fontSize: '1rem', lineHeight: 1.1, background: '#ffffffdd'}}>{n}</span>
      <span aria-hidden="true" style={{position: 'absolute', left: '51%', top: `${50 - n * 4}%`,
        transform: 'translateY(-50%)', fontSize: '1rem', lineHeight: 1.1, background: '#ffffffdd'}}>{n}</span>
    </React.Fragment>)}
    <span aria-hidden="true" style={{position: 'absolute', right: '0', top: '42%', fontSize: '1rem'}}>x</span>
    <span aria-hidden="true" style={{position: 'absolute', left: '43%', top: '0', fontSize: '1rem'}}>y</span>
  </span>;
});

export interface P050NativeProps {
  state: P050State; language?: 'en' | 'es';
  onEvent?: (event: P050Event) => void;
}
export function P050NativeV1({state, language = 'en', onEvent}: P050NativeProps) {
  const en = language === 'en', view = p050PresentationState(state);
  const question = bindings.questions.find(q => q.number === state.questionId);
  const heading = useRef<HTMLHeadingElement>(null), repeat = useRef<HTMLButtonElement>(null);
  const closeDirections = useRef<HTMLButtonElement>(null), closeWrong = useRef<HTMLButtonElement>(null);
  const previousDirections = useRef(false);
  useEffect(() => {if (state.questionId !== null) heading.current?.focus();}, [state.questionGeneration]);
  useEffect(() => {
    if (state.directionsOpen) closeDirections.current?.focus();
    else if (previousDirections.current) repeat.current?.focus();
    previousDirections.current = state.directionsOpen;
  }, [state.directionsOpen]);
  useEffect(() => {if (state.phase === 'wrong-held') closeWrong.current?.focus();}, [state.phase]);
  const send = (type: P050Event['type'], fields: Partial<P050Event> = {}) =>
    onEvent?.({type, epoch: state.epoch, questionGeneration: state.questionGeneration, ...fields});
  return <section data-p050-native-v1 data-p050-phase={state.phase} data-p050-question={state.questionId ?? 'none'}
    data-p050-source-sha256={bindings.sourceSwfSha256} aria-label={en ? 'Understanding Functions: Game' : 'Juego de funciones'}
    style={{display: 'grid', gap: '.8em', fontSize: '1rem', lineHeight: 1.5, minWidth: 0, maxWidth: '100%',
      boxSizing: 'border-box', padding: '.75em', color: '#203a60'}}>
    <h3 lang="en" style={{font: 'inherit', fontWeight: 700, margin: 0}}>Understanding Functions: Game</h3>
    <p style={{margin: 0}} data-p050-score aria-live="polite">{en ? 'Score' : 'Puntuación'}: ${state.score}</p>
    {['intro', 'begin'].includes(state.phase) && <div lang="en" data-p050-intro>
      <p>Lemonade: $10 per cup</p>
      {bindings.intro.filter(row => state.mainFrame >= row.firstFrame && state.mainFrame <= row.lastFrame)
        .map(row => <p key={row.textId} data-source-text-id={row.textId}>{row.text}</p>)}
    </div>}
    {question && <>
      <h4 ref={heading} tabIndex={-1} data-p050-question-heading style={{font: 'inherit', fontWeight: 700, margin: 0}}>
        {en ? 'Question' : 'Pregunta'} {state.drawCount} / 10
      </h4>
      <p lang="en" style={{margin: 0}}>{question.kind === 'choose-graph'
        ? <>Choose the graph that matches <strong>{question.promptFormula}</strong>.</>
        : 'Choose the function that matches the graph.'}</p>
      {question.kind === 'choose-function' && <SourceGraph graph={question.graphs[0]!} label="Question graph" />}
      <div role="group" aria-label={en ? 'Answer choices' : 'Opciones de respuesta'} data-p050-answers
        style={{display: 'grid', gridTemplateColumns: question.kind === 'choose-graph'
          ? 'repeat(auto-fit,minmax(min(100%,14rem),1fr))' : 'repeat(auto-fit,minmax(min(100%,16rem),1fr))',
          gap: '.7em', minWidth: 0, maxWidth: '40rem'}}>
        {(['A', 'B', 'C', 'D'] as P050Choice[]).map(letter => {
          const graph = question.graphs.find(g => g.letter === letter);
          return <button key={letter} type="button" lang="en" data-source-choice={letter}
            style={{...buttonStyle, textAlign: 'left'}} disabled={!onEvent || !view.questionEnabled}
            onClick={() => send('choose', {choice: letter})}>
            <span style={{display: 'block', fontWeight: 700}}>{letter}{question.optionFormulas ? `. ${question.optionFormulas[letter]}` : ''}</span>
            {graph && <SourceGraph graph={graph} label={`Graph ${letter}`} />}
          </button>;
        })}
      </div>
    </>}
    {['intro', 'begin', 'final'].includes(state.phase) && <button type="button" data-p050-start style={buttonStyle}
      disabled={!onEvent || state.directionsOpen || state.startRequested} onClick={() => send('start-game')}>
      {en ? 'Start' : 'Iniciar'}</button>}
    {state.phase === 'intro' && <button type="button" data-p050-skip style={buttonStyle}
      disabled={!onEvent} onClick={() => send('skip-intro')}>{en ? 'Skip introduction' : 'Saltar introducción'}</button>}
    {['begin', 'question', 'final'].includes(state.phase) && <button type="button" ref={repeat} data-p050-directions-open
      style={buttonStyle} disabled={!onEvent || state.directionsOpen || state.startRequested} onClick={() => send('open-directions')}>
      {en ? 'Repeat Directions' : 'Repetir instrucciones'}</button>}
    {state.directionsOpen && <div role="region" aria-label={en ? 'Directions' : 'Instrucciones'} data-p050-directions
      style={{padding: '.8em', border: '1px solid #8298b8'}}>
      <p lang="en" data-source-text-ids={bindings.directions.map(r => r.textId).join(',')}>
        {bindings.directions.map(r => r.text).join(' ')}
      </p>
      <button ref={closeDirections} type="button" data-p050-directions-close style={buttonStyle}
        disabled={!onEvent} onClick={() => send('close-directions')}>{en ? 'Close' : 'Cerrar'}</button>
    </div>}
    <div aria-live="polite" aria-atomic="true">
      {state.phase === 'correct-feedback' && <p lang="en" data-p050-correct>
        {state.feedback?.spriteId === 479 ? 'Correct!' : 'Great Job!'}</p>}
      {view.wrongPopupVisible && <div data-p050-wrong-popup style={{padding: '.8em', border: '2px solid #a74724'}}>
        <p lang="en">{state.wrongText}</p>
        <button ref={closeWrong} type="button" data-p050-wrong-close style={buttonStyle}
          disabled={!onEvent || !view.closeWrongEnabled}
          onClick={() => send('close-wrong', {token: state.feedback!.token})}>{en ? 'Close' : 'Cerrar'}</button>
      </div>}
    </div>
  </section>;
}
