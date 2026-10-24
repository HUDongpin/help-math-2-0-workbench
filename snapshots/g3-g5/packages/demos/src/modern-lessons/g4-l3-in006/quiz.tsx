import React,{useLayoutEffect,useRef} from 'react';
import type {AnimationRendererProps} from '../../contract';
import {LessonSourceButton} from '../../lesson-source-button';
import {
  COURSE_G04_L03_IN_006_INSTRUCTION,
  COURSE_G04_L03_IN_006_JUMP_MAGNITUDES as MAGNITUDES,
  type CourseG04L03In006JumpMagnitude as JumpMagnitude,
  type CourseG04L03In006NumberLineJumpState as InteractionState,
  type CourseG04L03In006NumberLineJumpAction as InteractionAction,
} from '../../timelines/course-g04-l03-in-006-number-line-jump-interaction';

export interface G4L3In006QuizPresentationProps {
  runtime?: AnimationRendererProps;
  interaction: InteractionState;
  interactive: boolean;
  selectedMagnitude: JumpMagnitude | null;
  onSelect: (magnitude: JumpMagnitude) => void;
  onAction: (action: InteractionAction) => void;
  wrongCloseRef?: React.Ref<HTMLButtonElement>;
}

const styles = `
.in006-quiz{font-family:var(--lesson-font-body,Nunito,system-ui,sans-serif);color:#14213d;display:grid;gap:1.25rem;min-inline-size:0;max-inline-size:70rem;margin-inline:auto}
.in006-quiz p{font-size:var(--lesson-text-body-size,1.25rem);line-height:1.6;margin:0;max-inline-size:70ch}
.in006-quiz fieldset{border:0;padding:0;margin:0;min-inline-size:0}
.in006-quiz legend{font-size:1.125rem;font-weight:700;line-height:1.5;margin-block-end:.75rem}
.in006-quiz__controls{display:flex;flex-wrap:wrap;gap:.75rem;align-items:center}
.in006-quiz button{box-sizing:border-box;min-inline-size:44px;min-block-size:44px;border:2px solid #365071;border-radius:.5rem;background:#fff;color:#14213d;font:700 1.125rem/1.4 var(--lesson-font-body,Nunito,system-ui,sans-serif);padding:.45rem .65rem;cursor:pointer;touch-action:manipulation}
.in006-quiz button:disabled{cursor:default;color:#586577;border-color:#7a879c;background:#f3f5f7}
.in006-quiz button[aria-pressed=true]{outline:3px solid #155ac1;outline-offset:3px;background:#edf4ff}
.in006-quiz button:focus-visible,.in006-quiz__viewport:focus-visible{outline:3px solid #155ac1;outline-offset:3px}
.in006-quiz__viewport{max-inline-size:100%;overflow:auto;border:1px solid #7a879c;border-radius:1rem;overscroll-behavior-inline:contain;background:#fffdf7;padding:.75rem;scroll-padding-inline:1rem}
.in006-quiz__line{position:relative;block-size:12rem}
.in006-quiz__line,.in006-quiz__line *{transition-property:none}
.in006-quiz__line svg{position:absolute;inset:0;inline-size:100%;block-size:9rem;overflow:visible}
.in006-quiz__tick{position:absolute;inset-block-start:9.25rem;inline-size:2.75rem;text-align:center;transform:translateX(-50%);font-size:max(18px,1.125rem);font-weight:700;line-height:1.5;white-space:nowrap}
.in006-quiz__summary{display:flex;flex-wrap:wrap;gap:.5rem 1.5rem;font-size:1.125rem;line-height:1.6}
.in006-quiz__feedback{border:2px solid #a52c43;border-radius:.75rem;padding:1rem;display:grid;gap:.75rem;background:#fff2f3}
.in006-quiz__feedback--correct{border-color:#22663d;background:#eef8f1}
.in006-quiz details{font-size:1.125rem;line-height:1.6;overflow-wrap:anywhere}
.in006-quiz summary{min-block-size:44px;cursor:pointer}
.in006-quiz ol{margin-block:0;padding-inline-start:2rem}
`;

/** Presentation only: the caller owns interaction state, feedback timing, focus and audio. */
export function G4L3In006QuizPresentation({runtime, interaction, interactive, selectedMagnitude, onSelect, onAction, wrongCloseRef}: G4L3In006QuizPresentationProps) {
  const ready = interactive && !interaction.locked && interaction.outcome === 'ready';
  const minimum = Math.min(-15, ...interaction.jumps.flatMap(jump => [jump.start, jump.end]));
  const maximum = Math.max(15, ...interaction.jumps.flatMap(jump => [jump.start, jump.end]));
  const columns = maximum - minimum + 1;
  const width = columns * 56;
  const x = (value: number) => (value - minimum + .5) * 56;
  const viewportRef=useRef<HTMLDivElement>(null);
  // DOM-only positioning. Selection and unrelated host rerenders never reset a learner's scroll.
  useLayoutEffect(()=>{
    const viewport=viewportRef.current;if(!viewport)return;
    let active=true;
    const position=()=>{
      if(!active)return;
      const current=viewport.querySelector<HTMLElement>(`[data-number-label="${interaction.currentValue}"]`);
      const target=viewport.querySelector<HTMLElement>(`[data-number-label="${interaction.target}"]`);
      if(!current||!target||!viewport.clientWidth)return;
      const viewRect=viewport.getBoundingClientRect(),scale=viewRect.width/viewport.offsetWidth;
      const point=(element:HTMLElement)=>{const rect=element.getBoundingClientRect();return {center:(rect.left-viewRect.left+rect.width/2)/scale+viewport.scrollLeft,width:rect.width/scale};};
      const c=point(current),t=point(target);
      const bothFit=Math.abs(c.center-t.center)+(c.width+t.width)/2+24<=viewport.clientWidth;
      const center=bothFit?(c.center+t.center)/2:c.center;
      viewport.scrollLeft=Math.max(0,Math.min(viewport.scrollWidth-viewport.clientWidth,center-viewport.clientWidth/2));
    };
    position();
    const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(position);observer?.observe(viewport);
    const line=viewport.querySelector('.in006-quiz__line');if(line)observer?.observe(line);
    void document.fonts?.ready.then(position);
    return()=>{active=false;observer?.disconnect();};
  },[interaction.questionRevision,interaction.currentQuestion.id,interaction.currentValue,interaction.target]);
  const dispatch = (action: InteractionAction) => { if (interactive) onAction(action); };
  const magnitudeFromDrop = (event: React.DragEvent) => {
    const value = Number(event.dataTransfer.getData('text/plain'));
    return MAGNITUDES.find(magnitude => magnitude === value);
  };
  return <section className="in006-quiz" lang="en" data-in006-quiz="native-proposal" data-interaction-outcome={interaction.outcome}
    onDragOver={event => { if (ready) event.preventDefault(); }}
    onDrop={event => { event.preventDefault(); if (ready && magnitudeFromDrop(event)) {event.dataTransfer.dropEffect='copy'; dispatch({type:'invalid-drop'});} }}>
    <style>{styles}</style>
    <p data-lesson-text-block="instruction">{COURSE_G04_L03_IN_006_INSTRUCTION}</p>
    <div className="in006-quiz__summary" aria-label="Number-line points">
      <span><span aria-hidden="true">■ </span>First point: <strong>{interaction.start}</strong></span>
      <span><span aria-hidden="true" style={{color:"#22663d"}}>▼ </span>Target number: <strong>{interaction.target}</strong></span>
      <span aria-live="polite" aria-atomic="true"><span aria-hidden="true" style={{color:"#155ac1"}}>○ </span>Current point: <strong>{interaction.currentValue}</strong></span>
    </div>
    <fieldset disabled={!ready}>
      <legend>Select a jump</legend>
      <div className="in006-quiz__controls">{MAGNITUDES.map(magnitude => <button key={magnitude} type="button"
        data-in006-focus-control={`jump-${magnitude}`} aria-label={`Select jump ${magnitude} to the right`}
        aria-pressed={selectedMagnitude === magnitude} draggable={ready} disabled={!ready}
        onClick={() => { if (ready) onSelect(magnitude); }}
        onDragEnd={event => {if(ready && event.dataTransfer.dropEffect==='none') dispatch({type:'invalid-drop'});}}
        onDragStart={event => { if (!ready) {event.preventDefault(); return;} onSelect(magnitude); event.dataTransfer.effectAllowed='copy'; event.dataTransfer.setData('text/plain',String(magnitude)); }}>
        +{magnitude}
      </button>)}</div>
    </fieldset>
    <p style={{fontSize:"1.125rem"}}>Scroll the number line sideways to see more numbers.</p>
    <div ref={viewportRef} className="in006-quiz__viewport" role="region" tabIndex={0} aria-label="Number line. Scroll horizontally to explore all numbers."
      onDragOver={event => { if (ready) {event.preventDefault(); event.dataTransfer.dropEffect='copy';} }}
      onDrop={event => {event.preventDefault(); event.stopPropagation(); if (!ready) return; event.dataTransfer.dropEffect='copy'; const magnitude=magnitudeFromDrop(event); dispatch(magnitude?{type:'place',magnitude}:{type:'invalid-drop'});}}>
      <div className="in006-quiz__line" style={{inlineSize:`${columns * 2.75}rem`}} data-domain-min={minimum} data-domain-max={maximum}>
        <svg viewBox={`0 0 ${width} 144`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d={`M ${x(minimum)} 132 H ${x(maximum)}`} fill="none" stroke="#365071" strokeWidth="2"/>
          {Array.from({length:columns},(_,index) => minimum+index).map(value => <path key={value} data-tick={value}
            d={`M ${x(value)} 124 V 140`} stroke="#365071" strokeWidth="2"/>)}
          {interaction.jumps.map((jump,index) => {
            const start=x(jump.start), end=x(jump.end), lift=36+(index%3)*22, direction=jump.signedDelta>0?1:-1;
            return <g key={jump.id} data-jump-id={jump.id} data-start={jump.start} data-end={jump.end}>
              <path d={`M ${start} 124 Q ${(start+end)/2} ${124-lift*2} ${end} 124`} fill="none" stroke="#155ac1" strokeWidth="3"/>
              <path d={`M ${end-8*direction} 113 L ${end} 124 L ${end-1*direction} 110`} fill="none" stroke="#155ac1" strokeWidth="3"/>
            </g>;
          })}
          <rect x={x(interaction.start)-6} y={126} width={12} height={12} fill="#14213d"/>
          <path d={`M ${x(interaction.target)} 113 l -8 -14 h 16 Z`} fill="#22663d"/>
          <circle cx={x(interaction.currentValue)} cy={132} r={7} fill="#fff" stroke="#155ac1" strokeWidth={3}/>
        </svg>
        {Array.from({length:columns},(_,index) => minimum+index).map(value => <span className="in006-quiz__tick" data-number-label={value}
          key={value} style={{insetInlineStart:`${x(value)/width*100}%`}}>{value}</span>)}
      </div>
    </div>
    <div className="in006-quiz__controls">
      <button type="button" data-in006-focus-control="place" disabled={!ready || selectedMagnitude===null}
        onClick={() => {if (ready && selectedMagnitude!==null) dispatch({type:'place',magnitude:selectedMagnitude});}}>
        {selectedMagnitude===null?'Select a jump':`Place +${selectedMagnitude} jump`}
      </button>
      <button type="button" data-in006-focus-control="reverse" disabled={!ready || interaction.lastJumpId===null}
        onClick={() => {if (ready && interaction.lastJumpId!==null) dispatch({type:'reverse-last'});}}>Reverse last jump</button>
      {runtime?<LessonSourceButton runtime={runtime} activityId="in006-clear-down" type="button" data-in006-focus-control="clear" disabled={!interactive} onClick={()=>dispatch({type:'clear'})}>Clear</LessonSourceButton>
        :<button type="button" data-in006-focus-control="clear" disabled={!interactive} onClick={()=>dispatch({type:'clear'})}>Clear</button>}
      {runtime?<LessonSourceButton runtime={runtime} activityId="in006-new-down" type="button" data-in006-focus-control="new-number" disabled={!interactive||!interaction.newNumberEnabled}
        onClick={()=>{if(interaction.newNumberEnabled)dispatch({type:'new-number'});}}>New Number</LessonSourceButton>
        :<button type="button" data-in006-focus-control="new-number" disabled={!interactive||!interaction.newNumberEnabled}
        onClick={()=>{if(interaction.newNumberEnabled)dispatch({type:'new-number'});}}>New Number</button>}
    </div>
    {interaction.equation && <p data-lesson-text-block="equation" aria-label={`Equation: ${interaction.equation}`}>{interaction.equation}</p>}
    <details><summary>Jump history ({interaction.jumps.length})</summary>
      {interaction.jumps.length===0?<p>No jumps placed yet.</p>:<ol>{interaction.jumps.map(jump => <li key={jump.id}>
        {jump.start} {jump.signedDelta<0?'−':'+'} {jump.magnitude} = {jump.end}
      </li>)}</ol>}
    </details>
    {interaction.outcome==='wrong' && <div className="in006-quiz__feedback">
      <p role="alert" data-lesson-text-block="wrong">{interaction.feedback}</p>
      <button ref={wrongCloseRef} type="button" disabled={!interactive} data-in006-focus-control="close-wrong"
        onClick={() => dispatch({type:'close-wrong'})}
        onKeyDown={event => {if(event.key==='Escape' && interactive){event.preventDefault(); dispatch({type:'close-wrong'});}}}>Close</button>
    </div>}
    {(interaction.outcome==='correct-feedback'||interaction.outcome==='complete') && <p role="status" className="in006-quiz__feedback in006-quiz__feedback--correct"
      data-lesson-text-block="complete">{interaction.feedback}</p>}
  </section>;
}
