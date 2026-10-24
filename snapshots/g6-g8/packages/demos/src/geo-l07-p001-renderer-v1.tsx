'use client';
import type {AnimationRendererProps} from './contract';
import {geoL07P001Frame} from './geo-l07-p001-timeline-v1';
import {geoL07P001TextSnapshot} from './geo-l07-p001-text-v1';
import {LessonTextPresentation} from './lesson-text-presentation';
import './geo-l07-p001-v1.css';

/** Source-locked clock and native title; host audio remains unresolved. */
export function GeoL07P001Renderer(props: AnimationRendererProps) {
  const state = geoL07P001Frame(props.frame, {...props, frame: props.frame});
  const snapshot = geoL07P001TextSnapshot(state);
  return <section className="geo-l07-p001" data-animation-id={state.animationId}
    data-flash-animation-id={state.animationId} data-flash-frame={state.frame}
    data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}
    data-flash-scenario={state.scenario} data-flash-language={state.language}
    data-flash-seed={state.seed} data-flash-replay={state.replay}
    data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId}
    data-flash-entry-state-sha256={props.entryStateSha256}
    data-source-alignment="candidate-not-accepted" data-source-text-ids={state.sourceTextIds.join(',')}
    data-source-main-frame={state.mainFrame ?? ''}>
    {props.uiLanguage === 'es' && <p className="geo-l07-p001__fallback" lang="es">Título original en inglés.</p>}
    <div className="geo-l07-p001__title" style={{opacity: state.alpha, transform: `scale(${state.scale})`}}>
      <LessonTextPresentation template="explanation" snapshot={snapshot}/>
    </div>
  </section>;
}
