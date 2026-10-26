'use client';
import React, {useEffect, useRef} from 'react';
import {LessonTextPresentation} from './lesson-text-presentation';
import {p047TextSnapshot} from './nms-l01-p047-text-v1';
import {p047InputIdentity, p047Question, p047Results, p047Review, p047AudioAsset,
  type P047Action, type P047Choice, type P047InputIdentity, type P047Question, type P047QuizState} from './nms-l01-p047-quiz-v1';

interface Props {
  readonly state: P047QuizState;
  readonly uiLanguage: 'en' | 'es';
  readonly paused?: boolean;
  readonly elapsedMs: () => number;
  readonly onAction: (action: P047Action) => void;
  readonly onAudio?: (assetId: string, identity: P047InputIdentity) => void;
  readonly audioEnabled?: boolean;
  readonly activeAudioId?: string | null;
  readonly audioLanguage?: 'en' | 'es';
  readonly onAudioLanguage?: (language: 'en' | 'es') => void;
  readonly audioError?: string | null;
  readonly audioPhase?: string;
}

function MathValue({value}: {readonly value: string}) {
  const fraction = /^(−?)(\d+)\/(\d+)$/.exec(value);
  if (!fraction) return <span>{value}</span>;
  // React creates actual MathML elements; the fraction is neither an image nor
  // a digit-concatenated fallback. A zero denominator remains a literal distractor.
  return React.createElement('math', {xmlns: 'http://www.w3.org/1998/Math/MathML', displaystyle: 'true', 'aria-label': value},
    React.createElement('mrow', null, fraction[1] ? React.createElement('mo', null, '−') : null,
      React.createElement('mfrac', null, React.createElement('mn', null, fraction[2]), React.createElement('mn', null, fraction[3]))));
}
function QuizFigure({question}: {readonly question: P047Question}) {
  const figure = question.figure;
  if (!figure) return null;
  if (figure.kind === 'source-illustration') return <img className="p047-quiz__illustration" src={figure.source}
    width={figure.width} height={figure.height} alt={figure.label} data-source-shape={figure.sourceShapeIds[0]}/>;
  if (figure.kind === 'temperature-table') return <table className="p047-quiz__table" lang="en" data-source-text-ids={figure.sourceTextIds.join(' ')}>
    <caption data-lesson-text-block={`q${question.id}-city`}>{figure.city}</caption>
    <thead><tr><th scope="col" data-lesson-text-block={`q${question.id}-month-heading`}>Month</th><th scope="col" data-lesson-text-block={`q${question.id}-temperature-heading`}>Average Temperature ({figure.unit})</th></tr></thead>
    <tbody>{figure.months.map((month, index) => <tr key={month}><th scope="row" data-lesson-text-block={`q${question.id}-month-${index}`}>{month}</th><td data-lesson-text-block={`q${question.id}-temperature-${index}`}>{figure.values[index]}</td></tr>)}</tbody>
  </table>;
  const percent = (number: number) => `${5 + (number + 9) * 5}%`;
  const color = (number: number) => number < 0 ? '#b91c1c' : number > 0 ? '#6633ff' : 'currentColor';
  return <div className="p047-quiz__numberline" tabIndex={0} role="group" aria-label="Number line from negative 9 to 9" lang="en">
    <svg width="100%" height="112" role="img" aria-label={`Number line from negative 9 to 9; point P is at ${figure.point}.`}>
      <defs>
        <marker id={`p047-left-${question.id}`} viewBox="0 0 8 8" refX="0" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M8 0L0 4L8 8Z" fill="#b91c1c"/></marker>
        <marker id={`p047-right-${question.id}`} viewBox="0 0 8 8" refX="8" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#6633ff"/></marker>
      </defs>
      <line x1="2%" y1="64" x2="50%" y2="64" stroke="#b91c1c" strokeWidth="2" markerStart={`url(#p047-left-${question.id})`}/>
      <line x1="50%" y1="64" x2="98%" y2="64" stroke="#6633ff" strokeWidth="2" markerEnd={`url(#p047-right-${question.id})`}/>
      {Array.from({length: 19}, (_, index) => index - 9).map(number => <g key={number}>
        <line x1={percent(number)} x2={percent(number)} y1="57" y2="71" stroke={color(number)} strokeWidth="2"/>
        <text x={percent(number)} y="96" textAnchor="middle" fill={color(number)} data-lesson-text-block={`q${question.id}-tick-${number}`}>{String(number).replace('-', '−')}</text>
      </g>)}
      <circle cx={percent(figure.point)} cy="64" r="5" fill="#155e75"/>
      <text x={percent(figure.point)} y="38" textAnchor="middle" fontWeight="700" data-lesson-text-block={`q${question.id}-point-label`}>P</text>
    </svg>
  </div>;
}

export function P047QuizPresentation({state, uiLanguage, paused = false, elapsedMs, onAction, onAudio,
  audioEnabled = false, activeAudioId, audioLanguage = uiLanguage, onAudioLanguage, audioError, audioPhase = 'idle'}: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const identity = p047InputIdentity(state), snapshot = p047TextSnapshot(state, uiLanguage);
  const question = identity.questionId === null ? null : p047Question(identity.questionId);
  const review = p047Review(state), result = p047Results(state);
  useEffect(() => { if (state.revision > 0) heading.current?.focus(); }, [state.revision]);
  const es = uiLanguage === 'es';
  const title = state.phase === 'review' ? (es ? 'Repaso del cuestionario' : 'Quiz Review')
    : state.phase === 'result' ? (es ? 'Cuestionario terminado' : 'Quiz complete')
      : state.phase === 'closed' ? (es ? 'Cuestionario cerrado' : 'Quiz closed') : (es ? 'Cuestionario final' : 'Final Quiz');
  function audioButton(choice: P047Choice | null) {
    if (!question || !audioEnabled || !onAudio || state.phase !== 'question') return null;
    const asset = p047AudioAsset(question.id, audioLanguage, choice), active = asset.id === activeAudioId;
    const subject = choice ? `${es ? 'opción' : 'answer'} ${choice}` : es ? 'pregunta' : 'question';
    return <button type="button" className="p047-quiz__audio" disabled={paused} aria-pressed={active}
      aria-label={`${active ? (es ? 'Detener' : 'Stop') : (es ? 'Escuchar' : 'Listen to')} ${subject}`}
      onClick={() => onAudio(asset.id, identity)}>{active ? (es ? 'Detener audio' : 'Stop audio') : (es ? 'Escuchar' : 'Listen')}</button>;
  }
  const options = question && <div className="p047-quiz__options" role="group" aria-label={es ? 'Opciones de respuesta' : 'Answer choices'}>
    {question.options.map(option => {
      const feedback = review?.options.find(candidate => candidate.letter === option.letter);
      return <div className="p047-quiz__option" key={option.letter} data-selected={feedback?.selected || undefined} data-correct={feedback?.correct || undefined}>
        <button type="button" className="p047-quiz__answer" disabled={paused || state.phase !== 'question'} lang="en"
          aria-label={`${option.letter}: ${option.value}`} data-lesson-text-block={option.blockId}
          onClick={() => onAction({type: 'answer', identity, choice: option.letter, elapsedMs: elapsedMs()})}>
          <span className="p047-quiz__letter">{option.letter}</span><MathValue value={option.value}/>
        </button>
        {audioButton(option.letter)}
        {feedback?.feedback && <span className="p047-quiz__feedback" lang="en">{feedback.feedback}</span>}
      </div>;
    })}
  </div>;
  // The shared exercise template owns the prompt and ordering. Interactive
  // choices render their matching snapshot values in native buttons/MathML.
  const promptSnapshot = {...snapshot, blocks: snapshot.blocks.filter(block => block.id === question?.promptBlockId)};
  return <section className="p047-quiz lesson-text-presentation" lang={uiLanguage} data-p047-phase={state.phase}
    data-p047-audio-phase={audioPhase} data-p047-audio-id={activeAudioId ?? ''}
    data-p047-revision={state.revision} data-p047-question={identity.questionId ?? ''} data-p047-ordinal={identity.ordinal ?? ''}
    data-p047-replay={state.replay} data-p047-text-status={snapshot.status}>
    <header className="p047-quiz__header"><h2 ref={heading} tabIndex={-1} lang="en" data-lesson-text-block="source-quiz-title">Positive &amp; Negative Numbers: Final Quiz</h2>
      {question && <p aria-label={es ? 'Progreso' : 'Progress'} data-lesson-text-block="progress">{identity.ordinal} / 10</p>}
    </header>
    {state.phase !== 'question' && <h3>{title}</h3>}
    {es && <p className="p047-quiz__language">Texto original en inglés.</p>}
    {audioEnabled && onAudioLanguage && state.phase === 'question' && <fieldset className="p047-quiz__audio-language" disabled={paused}>
      <legend>{es ? 'Idioma del audio' : 'Audio language'}</legend>
      {(['en', 'es'] as const).map(language => <button type="button" key={language} aria-pressed={audioLanguage === language}
        onClick={() => onAudioLanguage(language)}>{language === 'en' ? 'English' : 'Español'}</button>)}
    </fieldset>}
    {audioError && <p role="alert">{es ? 'No se pudo reproducir el audio. Inténtalo de nuevo.' : 'Audio could not play. Please try again.'}</p>}
    {question && <>
      {audioButton(null)}
      <LessonTextPresentation snapshot={promptSnapshot} template="exercise" className={question.figure?.kind === 'temperature-table' ? 'p047-quiz__table-layout' : 'p047-quiz__full-width-layout'}
        figure={question.figure ? <QuizFigure question={question}/> : undefined} figureReadingOrder={1000}
        controls={options} controlsReadingOrder={1001}/>
    </>}
    {review && <div className="p047-quiz__review-summary" aria-live="polite">
      <p>{es ? 'Tu respuesta' : 'Your answer'}: <span data-lesson-text-block="review-selected">{review.response.choice}</span></p>
      <p>{es ? 'Respuesta correcta' : 'Correct answer'}: <span data-lesson-text-block="review-correct">{review.question.correctLetter}</span></p>
      <button type="button" disabled={paused} onClick={() => onAction({type: 'review-next', identity})}>
        {state.reviewIndex === 9 ? (es ? 'Ver resultado' : 'Show result') : (es ? 'Siguiente' : 'Next')}
      </button>
    </div>}
    {state.phase === 'result' && result && <div className="p047-quiz__result" aria-live="polite">
      <p lang="en" data-lesson-text-block="finish-message">You have completed the quiz.</p>
      <p lang="en"><span data-lesson-text-block="finish-score-label">Your score is</span> <strong data-lesson-text-block="finish-score">{result.correct} / 10.</strong></p>
      <div className="p047-quiz__actions">
        <button type="button" disabled={paused} onClick={() => onAction({type: 'review', identity})}>{es ? 'Repasar respuestas' : 'Review answers'}</button>
        <button type="button" disabled={paused} onClick={() => onAction({type: 'close', identity})}>{es ? 'Continuar' : 'Continue'}</button>
      </div>
    </div>}
    <footer><button type="button" disabled={paused} onClick={() => onAction({type: 'replay', identity})}>{es ? 'Repetir cuestionario' : 'Replay quiz'}</button></footer>
  </section>;
}
