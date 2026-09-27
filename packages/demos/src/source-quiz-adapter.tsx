'use client';
import {sourceQuestionAudioAssets} from './source-lesson-audio';
import React, {useEffect, useMemo, useState} from 'react';
import {createPortal} from 'react-dom';
import type {AnimationModule, AnimationRendererProps} from './contract';
import {createSourceStaticCanvasCandidate, type SourceStaticCanvasCandidateConfig} from './source-static-canvas-candidate';
import contracts from './source-quiz-contracts.generated.json';
import {sourceQuizOrder} from './source-quiz-sequence';
import {SourceQuestionAudioControls} from './source-question-audio-controls';

type Question = {number: number; frame: number; correct: number; audioRoles: (string | null)[]};
type Contract = {canvasConfig: SourceStaticCanvasCandidateConfig; frameDomain: string; sourceSwfSha256: string; selection: string; presentedCount: number; questions: Question[]};
const pages = contracts as unknown as Record<string, Contract>;
const buttonStyle = {minHeight:44,minWidth:44,padding:'8px 14px',border:'2px solid #0758ba',borderRadius:8,background:'#fff',color:'#073b75',font:'600 16px system-ui'};
/** Only independently source-bound entries in the generated allowlist are interactive. */
export function withSourceQuiz(module: AnimationModule): AnimationModule {
  const contract = pages[module.key];
  if (!contract) return module;
  const visual = createSourceStaticCanvasCandidate(contract.canvasConfig);
  const Base = visual.Renderer;
  function Session(props: AnimationRendererProps) {
    const order = useMemo(() => sourceQuizOrder(contract.questions.map(q=>q.number), contract.presentedCount,
      contract.selection === 'random-without-replacement', props.seed + (contract.selection === 'random-without-replacement' ? (props.replay ?? 0) : 0)), [props.seed, props.replay]);
    const [responses, setResponses] = useState<number[]>([]);
    const [cursor, setCursor] = useState(0);
    const [target, setTarget] = useState<HTMLElement | null>(null);
    const spanish = (props.uiLanguage ?? props.lang) === 'es';
    const finished = cursor === order.length;
    const question = contract.questions.find(q=>q.number === order[Math.min(cursor,order.length-1)])!;
    const selected = responses[cursor];
    const stop = () => props.onLessonHostRequest?.({type:'stop-audio'});
    useEffect(() => { if(props.paused) props.onLessonHostRequest?.({type:'stop-audio'}); }, [props.paused,props.onLessonHostRequest]);
    useEffect(() => {setTarget(props.pageInteractionCompanionTargetId ? document.getElementById(props.pageInteractionCompanionTargetId) : null);},[props.pageInteractionCompanionTargetId]);
    const state = visual.getFrameState(question.frame,{...props,lang:'en',scenario:'source-static-frame',frameDomain:contract.frameDomain});
    const controls = <section data-source-quiz={module.key} data-source-question={finished ? 'complete' : question.number}
      data-source-question-frame={question.frame} data-source-selection-seed={props.seed + (contract.selection === 'random-without-replacement' ? (props.replay ?? 0) : 0)} aria-label={spanish ? 'Actividad de preguntas' : 'Question activity'}
      style={{padding:12,background:'#f6faff',color:'#123',width:'100%',boxSizing:'border-box'}}>
      {props.reducedMotion && <p role="status">{spanish ? 'Movimiento reducido.' : 'Reduced motion is enabled.'}</p>}
      <p aria-live="polite">{finished ? (spanish ? 'Actividad completada' : 'Activity complete') :
        `${spanish ? 'Pregunta' : 'Question'} ${cursor+1} / ${order.length}`}</p>
      {!finished && <>
        <div role="group" aria-label={spanish ? 'Seleccionar respuesta' : 'Select answer'} style={{display:'flex',flexWrap:'wrap',gap:10}}>
          {[1,2,3,4].map(option=><button key={option} type="button" style={buttonStyle} disabled={selected !== undefined}
            aria-pressed={selected===option} onClick={()=>{stop();setResponses([...responses,option]);}}>
            {spanish ? 'Respuesta' : 'Answer'} {'ABCD'[option-1]}</button>)}
        </div>
        <SourceQuestionAudioControls animationId={module.key} questionNumber={question.number} enabled runtime={{...props,paused:false}} />
        {question.audioRoles.some(role=>role!==null&&!sourceQuestionAudioAssets(module.key,question.number,spanish?'es':'en').some(asset=>asset.option===role)) && <p style={{fontSize:13}}>{spanish ? 'Las opciones sin botón de audio no tienen una grabación disponible.' : 'Options without an audio button have no recording available.'}</p>}
        {selected !== undefined && <div role="status"><p>{selected===question.correct ? (spanish?'Correcto':'Correct') : (spanish?'Incorrecto':'Incorrect')} — {spanish?'Respuesta correcta':'Correct answer'}: {'ABCD'[question.correct-1]}</p>
          <button type="button" style={buttonStyle} onClick={()=>{stop();setCursor(cursor+1);}}>{spanish?'Siguiente pregunta':'Next question'}</button></div>}
      </>}
      {finished && <p>{responses.filter((answer,i)=>answer===contract.questions.find(q=>q.number===order[i])!.correct).length} / {order.length}</p>}
      <button type="button" style={{...buttonStyle,marginTop:10}} onClick={()=>{stop();props.onReplay?.();setResponses([]);setCursor(0);}}>{spanish?'Repetir':'Replay activity'}</button>
    </section>;
    return <><div data-source-quiz-visual={module.key} style={{height:"100%",width:"100%"}}><Base {...props} lang="en" scenario="source-static-frame" frame={question.frame} frameDomain={contract.frameDomain} state={state}/></div>{target?createPortal(controls,target):controls}</>;
  }
  function Renderer(props: AnimationRendererProps) {return <Session key={`${props.replay ?? 0}:${props.uiLanguage ?? props.lang}:${props.seed}`} {...props}/>;}
  return Object.freeze({...module,transport:undefined,Renderer});
}
