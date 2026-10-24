"use client";
import React, {useEffect, useId, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {resolveP044CompanionTarget} from './g678-nms-l01-p044-companion-target';
import {P044_CONFIG, type P044Event, type P044Input, type P044Query} from './g678-nms-l01-p044-controller';
import {P044_SOURCE_GLOSSARY} from './generated/g678-nms-l01-p044-source-glossary-v1';
import {P044ReadableInstruction} from './g678-nms-l01-p044-readable-instruction';

/** Injection is deliberately local: no dynamic URL, fetch or registration is
 * introduced here. A source-verified caller supplies the exact adapter. */
export interface P044VisualSurface {render(query: P044Query): void; dispose?(): void}
export type P044MountVisual = (canvas: HTMLCanvasElement) => Promise<P044VisualSurface>;
export interface P044CandidateViewProps {
  readonly query: P044Query;
  readonly uiLanguage: 'en' | 'es';
  readonly mountVisual: P044MountVisual;
  readonly onEvent: (event: P044Event, trigger?: HTMLButtonElement) => void;
  readonly onReplay?: () => void;
  readonly onVisualReady: (ready: boolean) => void;
  readonly message?: string | null;
  readonly interactionBlocked?: boolean;
  readonly companionTargetId?:string;
}
const buttonStyle: React.CSSProperties = {minHeight: 44, minWidth: 44, padding: '10px 16px', border: '2px solid #2459a9',
  borderRadius: 8, background: '#ffffff', color: '#13284c', fontFamily: 'inherit', fontSize: 18, lineHeight: 1.5};
const activeInput = (event: React.MouseEvent<HTMLButtonElement>): P044Input => event.detail === 0 ? 'Enter' : 'mouse';

/** Source artwork and modern, responsive controls are separate surfaces.
 * This component is NOT an AnimationModule, My Lesson registration or acceptance. */
export function NmsL01P044CandidateView(props: P044CandidateViewProps) {
  const source=useRef<HTMLElement|null>(null),[target,setTarget]=useState<HTMLElement|null>(null);
  useEffect(()=>{
    const resolve=()=>setTarget(previous=>{const next=resolveP044CompanionTarget(source.current,props.companionTargetId);return previous===next?previous:next;});resolve();
    const document=source.current?.ownerDocument;if(!props.companionTargetId||!document)return;
    const observer=new MutationObserver(resolve);observer.observe(document.body,{subtree:true,childList:true,attributes:true,
      attributeFilter:['id','class','data-page-interaction-companion-host']});return()=>observer.disconnect();
  },[props.companionTargetId]);
  const canvas = useRef<HTMLCanvasElement | null>(null), surface = useRef<P044VisualSurface | null>(null);
  const latest = useRef(props); latest.current = props;
  const [visualStatus, setVisualStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [visualError, setVisualError] = useState<string | null>(null);
  const titleId = `p044-question-${useId().replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  useEffect(() => {
    let active = true, owned: P044VisualSurface | null = null;
    setVisualStatus('loading');setVisualError(null);latest.current.onVisualReady(false);
    if (!canvas.current) return;
    void props.mountVisual(canvas.current).then(result => {
      owned = result;
      if (!active) {result.dispose?.();return;}
      result.render(latest.current.query);surface.current = result;
      setVisualStatus('ready');latest.current.onVisualReady(true);
    }).catch(() => {
      if (!active) return;
      setVisualError('The source-bound visual could not be rendered. Playback remains held.');
      setVisualStatus('failed');latest.current.onVisualReady(false);
    });
    return () => {active = false;surface.current = null;owned?.dispose?.();latest.current.onVisualReady(false);};
  }, [props.mountVisual]);
  useEffect(() => {
    if (!surface.current || visualStatus !== 'ready') return;
    try {surface.current.render(props.query);} catch {
      surface.current = null;setVisualStatus('failed');
      setVisualError('The source-bound visual rejected this instance state. Playback remains held.');
      latest.current.onVisualReady(false);
    }
  }, [props.query, visualStatus]);
  const {query, uiLanguage} = props, es = uiLanguage === 'es';
  const blocked = Boolean(props.interactionBlocked) || visualStatus !== 'ready';
  const send = (event: P044Event, trigger: HTMLButtonElement) => {if (!blocked) props.onEvent(event, trigger);};
  const inputEvent = (event: React.MouseEvent<HTMLButtonElement>, data: Record<string, unknown>) =>
    send({...data, epoch: query.epoch, input: activeInput(event)} as P044Event, event.currentTarget);
  const visibleQuestion = query.mainFrame >= 2;
  const admittedTarget=target&&resolveP044CompanionTarget(source.current,props.companionTargetId)===target?target:null;
  const companion=<div data-p044-maintained-controls="true" data-p044-companion-placement={admittedTarget?'portal':'fallback'} lang={uiLanguage} style={{boxSizing:'border-box',padding:16,background:'#fff',fontSize:20,lineHeight:1.5,color:'#13284c',fontFamily:'system-ui, sans-serif'}}>
      <p style={{margin:'0 0 12px',fontSize:14}}>{es ? 'Vista de ingeniería sin registrar. Audio y aceptación pendientes.' : 'Unregistered engineering view. Audio and acceptance pending.'}</p>
      {visualError || props.message ? <p role="alert">{visualError ?? props.message}</p> : null}
      {visibleQuestion ? <div lang="en">
        <h2 id={titleId} style={{fontSize:22,lineHeight:1.5,margin:'0 0 12px',fontWeight:600}}>Farimah bought 3 pairs of jeans for $40 each. What is the total cost of Farimah’s jeans before tax?</h2>
      </div> : null}
      {visibleQuestion?<P044ReadableInstruction query={query}/>:null}
      <div aria-labelledby={visibleQuestion ? titleId : undefined} style={{display:'flex',flexWrap:'wrap',gap:12}}>
        {query.controls.answers.map(answer => <button key={answer.instanceName} type="button" lang="en" style={buttonStyle}
          data-p044-answer={answer.instanceName} data-source-character-id={answer.sourceCharacterId} data-source-depth={answer.depth}
          disabled={blocked} onClick={event => inputEvent(event,{type:'choose-answer',instanceName:answer.instanceName})}>
          {answer.letter}. {answer.label}
        </button>)}
        {query.controls.continueTargets.includes(43) ? <button type="button" style={buttonStyle} disabled={blocked}
          data-p044-continue="true" data-source-character-id="43" data-hit-area="maintained-accessible-not-source-geometry"
          onClick={event => inputEvent(event,{type:'continue',stopFrame:query.mainFrame,sourceTarget:43})}>{es ? 'Continuar' : 'Continue'}</button> : null}
        {query.controls.continueTargets.includes(44) ? <button type="button" style={buttonStyle} disabled={blocked}
          data-p044-alternate-continue="true" data-source-character-id="44"
          onClick={event => inputEvent(event,{type:'continue',stopFrame:query.mainFrame,sourceTarget:44})}>{es ? 'Continuar (control alternativo)' : 'Continue (alternate source control)'}</button> : null}
        {query.controls.explanation ? <button type="button" style={buttonStyle} disabled={blocked} data-p044-explanation="true"
          onClick={event => inputEvent(event,{type:'open-explanation',stopFrame:query.mainFrame})}>{es ? 'Ver la explicación' : 'Show explanation'}</button> : null}
        {query.controls.explanationClose ? <button type="button" style={buttonStyle} disabled={blocked} data-p044-explanation-close="true"
          onClick={event => inputEvent(event,{type:'close-explanation',sourceObjectId:query.activeNestedFrames[0]?.sourceObjectId})}>{es ? 'Cerrar la explicación' : 'Close explanation'}</button> : null}
        {query.controls.popupOpen ? <button type="button" style={buttonStyle} disabled={blocked} data-p044-help="true"
          onClick={event => inputEvent(event,{type:'open-popup'})}>{es ? 'Ver el ejemplo de ayuda' : 'Show help example'}</button> : null}
        {query.controls.popupClose ? <button type="button" style={buttonStyle} disabled={blocked} data-p044-help-close="true"
          onClick={event => inputEvent(event,{type:'close-popup'})}>{es ? 'Cerrar el ejemplo de ayuda' : 'Close help example'}</button> : null}
      </div>
      {query.controls.glossary.length ? <nav aria-label={es ? 'Palabras clave' : 'Key words'} style={{display:'flex',flexWrap:'wrap',gap:12,marginTop:16}}>
        {query.controls.glossary.map(term => {
          const entry = P044_SOURCE_GLOSSARY.entries.find(entry => entry.id === term.id)!;
          return <button key={term.id} type="button" style={buttonStyle} disabled={blocked} data-p044-glossary={term.id}
            data-source-character-id={term.sourceButtonId}
            onClick={event => inputEvent(event,{type:'open-glossary',term:term.id})}>{entry.labels[uiLanguage]}</button>;
        })}
      </nav> : null}
      {query.phase === 'feedback' ? <p role="status" data-p044-feedback-status="true">{es ? 'Mostrando la respuesta original…' : 'Showing source feedback…'}</p> : null}
      {query.pendingMainResume ? <p role="status">{es ? 'Esperando al reproductor de la lección…' : 'Waiting for the lesson playhead…'}</p> : null}
      {query.completed ? <p role="status">{es ? 'La animación candidata llegó a la parada original. Esto no es aceptación.' : 'The candidate reached the source stop. This is not acceptance.'}</p> : null}
      <button type="button" style={{...buttonStyle,marginTop:16}} disabled={!props.onReplay}
        data-p044-replay="true" onClick={props.onReplay}>{es ? 'Repetir' : 'Replay'}</button>
    </div>;
  return <section ref={source} data-p044-candidate-view="v1" data-animation-id={P044_CONFIG.animationId}
    data-current-javascript-registered="false" data-product-calibration-passed="false"
    data-source-frame={query.mainFrame} data-source-phase={query.phase} data-source-epoch={query.epoch}
    data-source-nested-frames={query.sourceContexts.map(context => `${context.instanceKey}:${context.frame}:${context.visible}`).join('|')}
    data-visual-status={visualStatus} data-source-audio="unintegrated" data-unbound-source-write="a_text"
    style={{width:'100%',maxWidth:800,minWidth:0,margin:'0 auto',color:'#13284c',fontFamily:'system-ui, sans-serif'}}>
    <div style={{position:'relative',width:'100%',aspectRatio:'4 / 3',background:'#bddbf4'}}>
      <canvas ref={canvas} width={800} height={600} role="img" lang="en"
        aria-label="Source artwork: Positive & Negative Numbers: Test Skills. Farimah's jeans word problem."
        style={{display:'block',width:'100%',height:'100%'}}/>
      {visualStatus === 'loading' ? <p role="status" style={{position:'absolute',inset:16,margin:0}}>{es ? 'Cargando el dibujo original…' : 'Loading source artwork…'}</p> : null}
    </div>
    {admittedTarget?createPortal(companion,admittedTarget):companion}
  </section>;
}
