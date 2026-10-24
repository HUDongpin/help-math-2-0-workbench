'use client';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {createMemoryOnlyLessonHost} from './lesson-host-contract';
import {recordP064HostScore, resetP064HostScore,
  type P064HostRequest} from './nms-l02-p064-host-score-candidate';
import {P064_PRESENTATION_DATA} from './nms-l02-p064-presentation-data-v1';
import {p064ReviewTargetMiss} from './nms-l02-p064-source-risk-candidate';
import {advanceP064Review, answerP064Question, initialP064Quiz, p064CurrentReview, p064Grade,
  type P064Option, type P064QuizState} from './nms-l02-p064-quiz-state-candidate';

type Question = (typeof P064_PRESENTATION_DATA.questions)[number];
type CandidateSession = Readonly<{quiz: P064QuizState; rng: number; revision: number}>;

function nextDraw(rng: number, count: number) {
  const next = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
  return {rng: next, index: next % count};
}
export function createP064CandidateSession(seed: number): CandidateSession {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw Error('P064 seed must be uint32');
  const draw = nextDraw(seed >>> 0, 35);
  return {quiz: initialP064Quiz(P064_PRESENTATION_DATA.questions.map(q =>
    (q.options.findIndex(option => option.correct) + 1) as P064Option), draw.index), rng: draw.rng, revision: 0};
}
export function answerP064Candidate(session: CandidateSession, questionId: number, option: P064Option): CandidateSession {
  if (session.quiz.phase !== 'question' || session.quiz.currentQuestionId !== questionId) return session;
  const draw = session.quiz.responses.length === 9 ? null : nextDraw(session.rng, session.quiz.remainingQuestionIds.length);
  return {quiz: answerP064Question(session.quiz, option, draw?.index), rng: draw?.rng ?? session.rng,
    revision: session.revision + 1};
}

function Value({value}: {readonly value: string}) {
  const fraction = /^(\d+)\/(\d+)$/.exec(value);
  if (!fraction) return <span>{value}</span>;
  return React.createElement('math', {'aria-label': value},
    React.createElement('mfrac', null, React.createElement('mn', null, fraction[1]),
      React.createElement('mn', null, fraction[2])));
}
function reviewOptionText(option: Question['options'][number]) {
  return 'picture' in option && option.picture ? option.pictureAlt : option.value ?? '';
}
export function P064ReviewSourceRiskNotice({questionId, option, uiLanguage = 'en'}: {
  readonly questionId: number; readonly option: number; readonly uiLanguage?: 'en' | 'es';
}) {
  const risk = p064ReviewTargetMiss(questionId, option);
  if (!risk) return null;
  return <p className="p064-candidate__source-risk" role="note"
    data-p064-source-risk="review-lookup-miss"
    data-p064-review-instance={risk.computedReviewName}
    data-p064-feedback-instance={risk.computedFeedbackName}
    data-p064-feedback-lookup={risk.feedbackFieldLookupMiss ? 'missing' : 'matched'}>{uiLanguage === 'es'
      ? risk.feedbackFieldLookupMiss
        ? 'Las búsquedas de la instancia de repaso y del campo de texto de retroalimentación en el código fuente no encuentran coincidencias para esta opción. Este resumen de respuestas es una propuesta moderna; el comportamiento original no está verificado.'
        : 'La búsqueda de la instancia de repaso en el código fuente no encuentra una coincidencia para esta opción; el campo de texto de retroalimentación sí coincide. Este resumen de respuestas es una propuesta moderna; el comportamiento original no está verificado.'
      : risk.feedbackFieldLookupMiss
        ? 'The source review sprite and feedback text field lookups have no match for this option. This answer summary is a modern candidate; original behavior is unverified.'
        : 'The source review sprite lookup has no match for this option; the feedback text field name still matches. This answer summary is a modern candidate; original behavior is unverified.'}</p>;
}
function NumberLine({line}: {readonly line: Extract<NonNullable<Question['illustration']>, {kind: 'number-line'}>}) {
  const span = line.maximum - line.minimum;
  const x = (value: number) => 36 + 528 * (value - line.minimum) / span;
  const pointX = x(line.point);
  const ticks = Array.from({length: line.intervals + 1}, (_, index) =>
    line.minimum + span * index / line.intervals);
  const labels = line.minimum === 0 && line.maximum === 1 ? [0, 0.5, 1]
    : line.minimum === 8 ? [8, 8.5, 9, 9.5, 10, 10.5, 11]
      : [line.minimum, line.minimum + 0.5, line.minimum + 1, line.minimum + 1.5, line.maximum];
  const summary = `Number line from ${line.minimum} to ${line.maximum}, divided into ${line.intervals} intervals; `
    + `point ${line.pointLabel} is at ${line.point}.`;
  return <svg className="p064-candidate__numberline" viewBox="0 0 600 132" role="img" aria-label={summary}
    data-source-shape={line.sourceShapeId}>
    <line x1="36" x2="564" y1="68" y2="68" stroke="currentColor" strokeWidth="2"/>
    {ticks.map((tick, index) => <line key={index} x1={x(tick)} x2={x(tick)} y1="60" y2="76"
      stroke="currentColor" strokeWidth="1.5"/>)}
    {labels.map(label => <text key={label} x={x(label)} y="105" textAnchor="middle" fontSize="17">{label}</text>)}
    <circle cx={pointX} cy="68" r="5" fill="#155e75"/>
    <text x={pointX} y="42" textAnchor="middle" fontSize="20" fontWeight="700">{line.pointLabel}</text>
  </svg>;
}

function QuestionAudioCandidates({questionId, uiLanguage}: {
  readonly questionId: number; readonly uiLanguage: 'en' | 'es';
}) {
  const players = useRef<(HTMLAudioElement | null)[]>([]);
  const pauseAll = (except?: number) => {
    players.current.forEach((audio, index) => {if (index !== except) audio?.pause();});
  };
  useEffect(() => {
    const currentPlayers = players.current;
    return () => {currentPlayers.forEach(audio => audio?.pause());};
  }, []);
  const languages = ['EA', 'SA'] as const;
  const source = (folder: 'EA' | 'SA', option?: string) =>
    `/flash-assets/g678-local/shared-nms002-l02-p064/${option ? 'option' : 'question'}-audio/${folder}/${questionId}${option ? `/${option}` : ''}`;
  const player = (folder: 'EA' | 'SA', index: number, option?: string) =>
    <audio ref={node => {
      const previous = players.current[index];
      if (previous && previous !== node) previous.pause();
      players.current[index] = node;
    }} controls preload="none"
      src={source(folder, option)} onPlay={() => pauseAll(index)}
      aria-label={uiLanguage === 'es'
        ? `${folder} audio de origen sin aprobar, pregunta ${questionId}${option ? `, opción ${option}` : ''}`
        : `${folder} source ${option ? `answer ${option}` : 'question'} ${questionId} audio candidate`}/>;
  return <div className="p064-candidate__audio" role="group" aria-label={uiLanguage === 'es'
    ? 'Candidatos de audio de la pregunta y las respuestas' : 'Question and answer audio candidates'}
    data-p064-source-question-audio={questionId}>
    <p>{uiLanguage === 'es'
      ? 'Archivos EA/SA del origen; idioma hablado, controles originales y sincronización sin aprobar.'
      : 'Source EA/SA files; spoken language, original controls, and synchronization are not accepted.'}</p>
    <div className="p064-candidate__audio-grid">
      {languages.map((folder, index) => <label key={folder}>{folder} / {folder === 'EA' ? 'EN' : 'SP'}
        {player(folder, index)}</label>)}
    </div>
    <details className="p064-candidate__option-audio"
      onToggle={event => {if (!event.currentTarget.open) players.current.slice(2).forEach(audio => audio?.pause());}}>
      <summary>{uiLanguage === 'es' ? 'Audio de las opciones A–D' : 'Answer A–D audio'}</summary>
      {(['A', 'B', 'C', 'D'] as const).map((option, optionIndex) =>
        <div className="p064-candidate__option-audio-row" key={option} data-p064-option-audio={option}>
          <strong>{option}</strong>
          <div className="p064-candidate__audio-grid">
            {languages.map((folder, languageIndex) => <label key={folder}>
              {folder} / {folder === 'EA' ? 'EN' : 'SP'}
              {player(folder, 2 + optionIndex * 2 + languageIndex, option)}
            </label>)}
          </div>
        </div>)}
    </details>
  </div>;
}

export function P064QuestionView({question, ordinal, uiLanguage = 'en', disabled = false, onAnswer}:
  {readonly question: Question; readonly ordinal: number; readonly disabled?: boolean;
    readonly uiLanguage?: 'en' | 'es';
    readonly onAnswer: (questionId: number, option: P064Option) => void}) {
  const figure = question.illustration;
  const root = useRef<HTMLElement>(null);
  return <section ref={root} className="p064-candidate__question" data-p064-question={question.id}
    data-p064-source-frame={question.questionFrame}>
    <p className="p064-candidate__progress">{ordinal} / 10</p>
    <h3 lang="en" tabIndex={-1} data-p064-focus data-source-text-id={question.sourcePromptTextId}>{question.prompt}</h3>
    {figure && <figure className="p064-candidate__figure">
      {figure.kind === 'source-illustration'
        ? <img src={figure.source} width={figure.width} height={figure.height} alt={figure.alt}
          data-source-shape={figure.sourceShapeId}/>
        : <NumberLine line={figure}/>}
    </figure>}
    {question.id === 5 && <p className="p064-candidate__source-risk" role="note"
      data-p064-source-risk="q5-dynamic-fields">{uiLanguage === 'es'
        ? 'El fotograma de origen también define diez campos editables con valor inicial 0. Su valor y visibilidad en ejecución no están verificados; esta recta numérica es una interpretación candidata.'
        : 'The source frame also defines ten editable fields initially set to 0. Their runtime values and visibility are unverified; this number line is a candidate interpretation.'}</p>}
    <div className="p064-candidate__options" role="group"
      aria-label={uiLanguage === 'es' ? 'Opciones de respuesta' : 'Answer choices'}>
      {question.options.map((option, index) => <button type="button" key={option.letter}
        lang="en"
        className={`p064-candidate__option${'picture' in option && option.picture ? ' p064-candidate__option--picture' : ''}`}
        disabled={disabled}
        data-source-instance={option.sourceInstance} data-source-sprite={option.sourceSpriteId}
        onClick={() => {
          root.current?.querySelectorAll('audio').forEach(audio => audio.pause());
          onAnswer(question.id, (index + 1) as P064Option);
        }}>
        <span className="p064-candidate__letter">{option.letter}</span>
        {'picture' in option && option.picture
          ? <img src={option.picture.source} width={option.picture.width} height={option.picture.height}
            alt={option.pictureAlt} data-source-sprite={option.sourceSpriteId}/>
          : <Value value={option.value ?? ''}/>}
      </button>)}
    </div>
    <QuestionAudioCandidates questionId={question.id} uiLanguage={uiLanguage}/>
  </section>;
}

export function P064QuizCandidate({seed = 0, uiLanguage = 'en', onState, onLessonHostRequest}:
  {readonly seed?: number; readonly uiLanguage?: 'en' | 'es'; readonly onState?: (state: P064QuizState) => void;
    readonly onLessonHostRequest?: P064HostRequest}) {
  const [session, setSession] = useState(() => createP064CandidateSession(seed));
  const [scoreGate, setScoreGate] = useState<'local-only' | 'initializing' | 'ready' | 'blocked'>(
    onLessonHostRequest ? 'initializing' : 'local-only');
  const sessionRef = useRef(session);
  const gateRef = useRef(scoreGate);
  const root = useRef<HTMLElement>(null);
  const publish = useCallback((next: CandidateSession) => {sessionRef.current = next; setSession(next);}, []);
  const gate = useCallback((next: typeof scoreGate) => {gateRef.current = next; setScoreGate(next);}, []);
  useEffect(() => {
    if (!onLessonHostRequest) return;
    gate(resetP064HostScore(onLessonHostRequest, sessionRef.current.quiz) ? 'ready' : 'blocked');
  }, [onLessonHostRequest, gate]);
  useEffect(() => {onState?.(session.quiz);}, [onState, session.quiz]);
  useEffect(() => {if (session.revision > 0) root.current?.querySelector<HTMLElement>('[data-p064-focus]')?.focus();},
    [session.revision]);
  const quiz = session.quiz;
  const question = quiz.currentQuestionId === null ? null : P064_PRESENTATION_DATA.questions[quiz.currentQuestionId - 1];
  const review = p064CurrentReview(quiz);
  const reviewQuestion = review ? P064_PRESENTATION_DATA.questions[review.questionId - 1] : null;
  const selectedOption = reviewQuestion && review ? reviewQuestion.options[review.option - 1] : null;
  const correctOption = reviewQuestion?.options.find(option => option.correct);
  const es = uiLanguage === 'es';
  const handleAnswer = (questionId: number, option: P064Option) => {
    if (onLessonHostRequest && gateRef.current !== 'ready') return;
    const before = sessionRef.current;
    const after = answerP064Candidate(before, questionId, option);
    if (after === before) return;
    if (onLessonHostRequest && !recordP064HostScore(onLessonHostRequest, after.quiz)) {
      gate('blocked');
      return;
    }
    publish(after);
  };
  const replay = () => {
    const next = {...createP064CandidateSession(seed), revision: sessionRef.current.revision + 1};
    if (onLessonHostRequest) {
      if (!resetP064HostScore(onLessonHostRequest, next.quiz)) {gate('blocked'); return;}
      gate('ready');
    }
    publish(next);
  };
  return <section ref={root} className="p064-candidate" lang={uiLanguage} data-animation-id="shared-nms002-l02-p064"
    data-p064-phase={quiz.phase} data-p064-revision={session.revision}
    data-p064-host-score-gate={scoreGate}
    data-source-alignment="candidate-not-accepted">
    <header><h2>{es ? 'Cuestionario final' : 'Final Quiz'}</h2>
      <p className="p064-candidate__notice">{es
        ? 'Las preguntas conservan el texto original en inglés. Audio y revisión de traducción pendientes.'
        : 'Source English questions. Audio and translation review are pending.'}</p></header>
    {scoreGate === 'blocked' && <p role="alert">{es
      ? 'El anfitrión no pudo confirmar la puntuación. La pregunta no avanzó; repite el cuestionario para intentarlo de nuevo.'
      : 'The lesson host could not confirm the score. The question did not advance; replay to retry.'}</p>}
    {question && <P064QuestionView key={`${question.id}:${session.revision}`} question={question}
      ordinal={quiz.responses.length + 1} uiLanguage={uiLanguage} disabled={scoreGate === 'blocked' || scoreGate === 'initializing'}
      onAnswer={handleAnswer}/>}
    {quiz.phase === 'finish' && <div className="p064-candidate__result" aria-live="polite">
      <h3 tabIndex={-1} data-p064-focus>{es ? 'Resultado' : 'Result'}: {quiz.responses.filter(response => response.correct).length} / 10</h3>
      <p lang="en">{p064Grade(quiz)}</p>
      <button type="button" onClick={() => setSession(previous => ({...previous,
        quiz: advanceP064Review(previous.quiz), revision: previous.revision + 1}))}>
        {es ? 'Repasar respuestas' : 'Review answers'}</button>
    </div>}
    {review && <div className="p064-candidate__review" aria-live="polite">
      <h3 tabIndex={-1} data-p064-focus>{es ? 'Repaso' : 'Review'} {quiz.reviewOrdinal} / 10</h3>
      <p lang="en">{reviewQuestion?.prompt}</p>
      <p>{es ? 'Tu respuesta' : 'Your answer'}: <span lang="en">{selectedOption?.letter} — {
        selectedOption && reviewOptionText(selectedOption)}</span></p>
      <p>{es ? 'Respuesta correcta' : 'Correct answer'}: <span lang="en">{correctOption?.letter} — {
        correctOption && reviewOptionText(correctOption)}</span></p>
      <P064ReviewSourceRiskNotice questionId={review.questionId} option={review.option} uiLanguage={uiLanguage}/>
      <button type="button" onClick={() => setSession(previous => ({...previous,
        quiz: advanceP064Review(previous.quiz), revision: previous.revision + 1}))}>
        {quiz.reviewOrdinal === 10 ? (es ? 'Terminar repaso' : 'Finish review') : (es ? 'Siguiente' : 'Next')}</button>
    </div>}
    {quiz.phase === 'host-exit-unresolved' && <p role="status" tabIndex={-1} data-p064-focus>{es
      ? 'Repaso terminado. La integración de progreso del curso está pendiente.'
      : 'Review finished. Course progress integration is pending.'}</p>}
    <footer><button type="button" onClick={replay}>{es ? 'Repetir cuestionario' : 'Replay quiz'}</button></footer>
  </section>;
}

/** Audit-only host exercise; this is not a registered My Lesson member. */
export function P064LocalHostScoringCandidate({seed = 0, uiLanguage = 'en'}:
  {readonly seed?: number; readonly uiLanguage?: 'en' | 'es'}) {
  const host = useMemo(() => createMemoryOnlyLessonHost({releaseId: 'p064-local-candidate',
    releaseMemberIds: ['shared-nms002-l02-p064'], currentAnimationId: 'shared-nms002-l02-p064',
    enabledCapabilities: ['fq-scoring'], mode: 'audit', releasePublished: false}), []);
  const request = useCallback<P064HostRequest>(value => host.dispatch(value), [host]);
  return <P064QuizCandidate seed={seed} uiLanguage={uiLanguage} onLessonHostRequest={request}/>;
}
