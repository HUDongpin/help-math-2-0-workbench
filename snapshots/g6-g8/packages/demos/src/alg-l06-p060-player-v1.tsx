'use client';
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {bindTechnicalOwner,nativeTechnicalOwner,publishTechnicalCommit,retireTechnicalObservation,type TechnicalOwner} from './technical-observation-v1';
import {P060_NATIVE_SOURCE} from './generated/alg-l06-p060-native-v1';
import {P060QuestionContent, P060_CONTENT_CSS} from './alg-l06-p060-content-v1';
import {p060AudioAsset, p060Question, type P060Choice} from './alg-l06-p060-source-v1';
import {p060Identity, p060Results, p060Review, p060SourceState, type P060Action} from './alg-l06-p060-state-v1';
import {P060SessionV1, type P060SessionDependencies, type P060SessionSnapshot} from './alg-l06-p060-session-v1';

export interface P060PlayerControls {
  setPaused(value: boolean): void;
  replay(): boolean;
  narration(action: 'play' | 'stop'): void;
  stop(): void;
}
export interface P060PlayerProps {
  readonly seed: number;
  readonly uiLanguage: 'en' | 'es';
  readonly paused?: boolean;
  readonly volume?: number;
  readonly audioEnabled: boolean;
  readonly readAudio: P060SessionDependencies['readAudio'];
  readonly connectControls?: (controls: P060PlayerControls) => () => void;
  readonly onState?: (snapshot: P060SessionSnapshot) => void;
  readonly onPaused?: (paused: boolean) => void;
  readonly onReplay?: () => void;
  readonly onComplete?: () => void;
}
const formatTime = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
function Elapsed({read, paused, owner}: {read: () => number; paused: boolean; owner: () => TechnicalOwner|null}) {
  const [value, setValue] = useState(read);
  const ownerId=owner()?.playerId;
  useEffect(() => {setValue(read()); if (paused) return; const id = window.setInterval(bindTechnicalOwner(() => setValue(read()), owner()), 250); return () => window.clearInterval(id);}, [read, paused, ownerId]);
  return <span data-p060-elapsed>{formatTime(value)}</span>;
}

export function P060QuizPlayer(props: P060PlayerProps) {
  const latest = useRef(props); latest.current = props;
  const sessionRef = useRef<P060SessionV1 | null>(null);
  const sourceSurface=useRef<HTMLElement>(null);
  const observationOwner=useRef<()=>TechnicalOwner|null>(()=>null);
  observationOwner.current=()=>{const session=sessionRef.current,target=sourceSurface.current;if(!session||!target)return null;return nativeTechnicalOwner(session,target,'shared-alg001-l06-p060',P060_NATIVE_SOURCE.sourceSha256,session.snapshot().quiz.replay);};
  const [snapshot, setSnapshot] = useState<P060SessionSnapshot | null>(null);
  const heading = useRef<HTMLHeadingElement>(null), lastIdentity = useRef<string | null>(null);
  const readElapsed = useRef(() => sessionRef.current?.elapsedMs() ?? 0).current;
  useEffect(() => {
    let active = true;
    const session = new P060SessionV1(props.seed, latest.current.uiLanguage, {
      readAudio: (asset, signal) => latest.current.audioEnabled ? latest.current.readAudio(asset, signal) : Promise.reject(Error('P060_AUDIO_DISABLED')),
      technicalOwner:()=>observationOwner.current(),
      changed: state => {if (active) {setSnapshot(state); latest.current.onState?.(state);}},
    });
    sessionRef.current = session; session.setVolume(latest.current.volume ?? 1); session.setPaused(latest.current.paused ?? false);
    setSnapshot(session.snapshot()); latest.current.onState?.(session.snapshot());
    const controls: P060PlayerControls = {
      setPaused(value) {if (!active) return; session.setPaused(value); latest.current.onPaused?.(value);},
      replay() {if (!active || !session.replay()) return false; latest.current.onPaused?.(false); latest.current.onReplay?.(); return true;},
      narration(action) {
        if (!active) return;
        if (action === 'stop') {session.stopAudio(); return;}
        if (!latest.current.audioEnabled) return;
        session.setPaused(false); latest.current.onPaused?.(false);
        void session.playAudio(null, p060Identity(session.snapshot().quiz));
      },
      stop() {if (!active) return; active = false; void session.close();},
    };
    const disconnect = latest.current.connectControls?.(controls);
    return () => {active = false; retireTechnicalObservation(sourceSurface.current,observationOwner.current()); disconnect?.(); if (sessionRef.current === session) sessionRef.current = null; void session.close();};
  }, [props.seed]);
  useEffect(() => {sessionRef.current?.setPaused(props.paused ?? false);}, [props.paused]);
  useEffect(() => {sessionRef.current?.setVolume(props.volume ?? 1);}, [props.volume]);
  useEffect(() => {sessionRef.current?.setLanguage(props.uiLanguage);}, [props.uiLanguage]);
  useEffect(() => {if (!props.audioEnabled) sessionRef.current?.stopAudio();}, [props.audioEnabled]);
  const focusKey = snapshot ? `${snapshot.quiz.replay}:${snapshot.quiz.epoch}` : null;
  useEffect(() => {if (focusKey === null) return; if (lastIdentity.current !== null && lastIdentity.current !== focusKey) heading.current?.focus(); lastIdentity.current = focusKey;}, [focusKey]);
  useLayoutEffect(()=>{const target=sourceSurface.current,owner=observationOwner.current();if(!target||!owner||!snapshot)return;const source=p060SourceState(snapshot.quiz);publishTechnicalCommit(target,owner,'maintained-dom-module-v1',{frame:source.frame,frameDomain:'sprite-973',phase:snapshot.quiz.phase,questionId:p060Identity(snapshot.quiz).questionId,epoch:snapshot.quiz.epoch,answerCount:snapshot.quiz.responses.length,errors:snapshot.audio.failure?[snapshot.audio.failure]:[],missing:[]},{paused:snapshot.paused,playbackComplete:snapshot.quiz.phase==='closed'});},[snapshot]);
  const es = props.uiLanguage === 'es';
  if (!snapshot) return <p role="status">{es ? 'Cargando cuestionario…' : 'Loading quiz…'}</p>;
  const {quiz, audio, paused} = snapshot, identity = p060Identity(quiz), source = p060SourceState(quiz), results = p060Results(quiz), review = p060Review(quiz);
  const question = identity.questionId === null ? null : p060Question(identity.questionId);
  const action = (value: P060Action) => {
    if (!sessionRef.current?.dispatch(value)) return;
    if (value.type === 'replay') latest.current.onReplay?.();
    if (value.type === 'close') latest.current.onComplete?.();
  };
  const audioButton = (choice: P060Choice | null) => {
    if (quiz.phase !== 'question' || !question) return null;
    const asset = p060AudioAsset(question.id, snapshot.language, choice);
    const selected = audio.assetId === asset.id && ['playing','loading'].includes(audio.phase);
    const label = choice === null ? es ? 'Escuchar pregunta' : 'Read question' : es ? `Escuchar ${choice}` : `Read ${choice}`;
    return <button type="button" className="p060-audio" data-audio-choice={choice ?? 'question'} aria-pressed={selected} aria-label={label}
      disabled={paused || !props.audioEnabled} onClick={() => void sessionRef.current?.playAudio(choice, identity)}>
      {selected ? es ? 'Detener' : 'Stop' : label}</button>;
  };
  return <section ref={sourceSurface} className="p060-quiz" data-p060-phase={quiz.phase} data-p060-question={identity.questionId ?? ''} data-p060-epoch={quiz.epoch}
    data-p060-replay={quiz.replay} data-flash-frame-domain="sprite-973" data-flash-frame={source.frame} data-flash-root-frame="6" data-flash-seed={quiz.seed}
    aria-label={es ? 'Evaluación final: funciones' : 'Final quiz: functions'}>
    <style>{P060_CONTENT_CSS}{CSS}</style>
    <header><h2 ref={heading} tabIndex={-1}>{quiz.phase === 'question' ? es ? `Pregunta ${quiz.responses.length + 1} de 10` : `Question ${quiz.responses.length + 1} of 10`
      : quiz.phase === 'review' ? es ? `Repaso ${(quiz.reviewIndex ?? 0) + 1} de 10` : `Review ${(quiz.reviewIndex ?? 0) + 1} of 10`
      : quiz.phase === 'closed' ? es ? 'Cuestionario terminado' : 'Quiz finished' : es ? 'Resultados' : 'Results'}</h2>
      <p>{es ? 'Tiempo: ' : 'Time: '}<Elapsed read={readElapsed} owner={()=>observationOwner.current()} paused={paused || quiz.phase !== 'question'}/></p></header>
    {paused && <p role="status">{es ? 'En pausa. Pulsa Reproducir para continuar.' : 'Paused. Use Play to continue.'}</p>}
    {question && <>
      {quiz.phase === 'question' && <div className="p060-audio-controls"><label>{es ? 'Idioma del audio ' : 'Audio language '}
        <select aria-label={es ? 'Idioma del audio' : 'Audio language'} value={snapshot.language} disabled={paused || !props.audioEnabled}
          onChange={e => sessionRef.current?.setLanguage(e.target.value as 'en' | 'es')}><option value="en">English</option><option value="es">Español</option></select></label>{audioButton(null)}</div>}
      {audio.phase === 'failed' && <p role="status">{es ? 'No se pudo reproducir el audio. Inténtalo de nuevo.' : 'Audio could not play. Please try again.'}</p>}
      <P060QuestionContent question={question}/>
      <div className="p060-options" role="group" aria-label={es ? 'Opciones' : 'Answer choices'}>
        {question.options.map(option => {
          const marked = review?.options.find(o => o.letter === option.letter);
          return <div key={`${question.id}-${option.letter}`} className="p060-option-row" data-review-feedback={marked?.feedback ?? ''}>
            {quiz.phase === 'question' ? <button className="p060-answer" type="button" disabled={paused} data-choice={option.letter}
              onClick={() => action({type:'answer', choice:option.letter as P060Choice, identity, elapsedMs:0})}>
              <strong>{option.letter}</strong><span lang="en" data-source-text-id={option.textId}>{option.value}</span></button>
              : <div className="p060-answer p060-review-option"><strong>{option.letter}</strong><span lang="en">{option.value}</span>
                {marked?.selected && <span className="p060-tag">{es ? 'Tu respuesta' : 'Your answer'}</span>}
                {marked?.feedback && <span className="p060-tag" lang="en">{marked.feedback}</span>}</div>}
            {audioButton(option.letter as P060Choice)}
          </div>;
        })}
      </div>
      {quiz.phase === 'review' && <button type="button" disabled={paused} onClick={() => action({type:'review-next', identity})}>
        {quiz.reviewIndex === 9 ? es ? 'Volver a los resultados' : 'Back to results' : es ? 'Siguiente respuesta' : 'Next answer'}</button>}
    </>}
    {results && (quiz.phase === 'result' || quiz.phase === 'closed') && <div className="p060-results">
      <p className="p060-score" data-p060-score>{results.correct} / {results.total}</p><p lang="en" data-p060-grade>{results.grade}</p>
      {quiz.phase === 'result' && <div className="p060-result-actions"><button type="button" disabled={paused} onClick={() => action({type:'review', identity})}>{es ? 'Repasar respuestas' : 'Review answers'}</button>
        <button type="button" disabled={paused} onClick={() => action({type:'replay', identity})}>{es ? 'Repetir cuestionario' : 'Replay quiz'}</button>
        <button type="button" disabled={paused} onClick={() => action({type:'close', identity})}>{es ? 'Continuar' : 'Continue'}</button></div>}
    </div>}
  </section>;
}
const CSS = `
.p060-quiz{font:400 1rem/1.6 system-ui,sans-serif;box-sizing:border-box;color:#142d44;background:#fff;border:1px solid #b6cbd7;border-radius:.8rem;padding:1rem;min-width:0;max-width:100%}
.p060-quiz *{box-sizing:border-box}.p060-quiz header{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.5rem;border-bottom:1px solid #d3e0e8}
.p060-quiz h2{font:650 1.2rem/1.4 system-ui,sans-serif;margin:.2rem 0 .7rem}.p060-quiz header p{margin:0 0 .7rem}
.p060-quiz button,.p060-quiz select{font:inherit;min-height:44px;border:1px solid #7999b0;border-radius:.4rem;color:inherit;background:#f1f7fb;padding:.45rem .65rem}
.p060-quiz button{cursor:pointer}.p060-quiz button:disabled{cursor:default;opacity:.55}.p060-quiz button:hover:not(:disabled){background:#ddecf5}
.p060-quiz :focus-visible{outline:3px solid #1765b1;outline-offset:3px}
.p060-audio-controls{display:flex;flex-wrap:wrap;gap:.7rem;align-items:center;margin:.8rem 0}.p060-audio-controls label{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center}
.p060-options{display:grid;gap:.7rem;margin:1rem 0}.p060-option-row{display:flex;gap:.6rem;align-items:stretch;min-width:0}.p060-quiz .p060-answer{flex:1;min-width:0;display:flex;align-items:center;gap:.8rem;text-align:left;padding:.6rem .8rem;overflow-wrap:anywhere}
.p060-answer strong{align-self:flex-start;color:#134e76}.p060-audio{flex:0 0 auto;align-self:center}.p060-review-option{border:1px solid #b6cbd7;border-radius:.4rem;flex-wrap:wrap}
.p060-tag{font-weight:600}.p060-option-row[data-review-feedback="Correct"] .p060-review-option{border:2px solid #087a54;background:#eefaf4}.p060-option-row[data-review-feedback="Incorrect"] .p060-review-option{border:2px solid #be3434;background:#fff3f1}
.p060-results{text-align:center}.p060-score{font-size:2rem;font-weight:700;margin:1rem}.p060-result-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:.7rem}
@media(max-width:420px){.p060-option-row{flex-wrap:wrap}.p060-answer{flex-basis:100%!important}.p060-option-row .p060-audio{margin-left:auto}}
`;
