import React from 'react';
import source from './generated/g4-l3-ti003-intro.json';
import {COURSE_G04_L03_TI_003_CARDS as cards,
  type CourseG04L03Ti003NumberLineDragState,
  type CourseG04L03Ti003TargetId,
  type CourseG04L03Ti003CardId,
} from '../timelines/course-g04-l03-ti-003-number-line-drag-interaction';

const values = Array.from({length: source.axisMax - source.axisMin + 1}, (_, i) => i + source.axisMin);
const label = (value: number) => value < 0 ? `−${-value}` : String(value);

/** Native labels preserve the existing source-bound card/target mapping. */
export function Ti003NumberLine({interaction, disabled, onChoose, preview = false}: {
  interaction: CourseG04L03Ti003NumberLineDragState;
  disabled: boolean;
  preview?: boolean;
  onChoose: (target: CourseG04L03Ti003TargetId, card?: CourseG04L03Ti003CardId) => void;
}) {
  return <div className="ti003-native-axis" role="group" tabIndex={0}
    aria-label="Number line from negative twelve to twelve. Scroll horizontally to explore all positions."
    style={{maxWidth:'100%', overflowX:'auto', padding:'.5rem .25rem 1rem'}}>
    <style>{`
      .ti003-native-axis:focus-visible {outline:3px solid #224b8e;outline-offset:2px}
      .ti003-native-axis .ti003-native-position {font:inherit;font-size:1.125rem;line-height:1.5;min-width:2.75rem;min-height:2.75rem;padding:.25rem;border:2px solid #224b8e;border-radius:.5rem;background:#fff;color:#111}
      .ti003-native-axis .ti003-native-position:focus-visible {outline:3px solid #b45309;outline-offset:3px}
      .ti003-native-axis .ti003-native-position:disabled {background:#e2e8f0;color:#475569}
    `}</style>
    <div style={{display:'grid',gridTemplateColumns:`repeat(${values.length},4.5rem)`,width:'max-content',fontFamily:'var(--lesson-font-body, system-ui, sans-serif)',fontSize:'1.125rem',lineHeight:1.5}}>
      {values.map(value => {
        const target = cards.find(card => card.numericValue === value);
        const placed = target && cards.some(card => interaction.placements[card.id] === target.targetId);
        return <div key={value} data-ti003-number-position={value} style={{display:'grid',gridTemplateRows:preview?'0rem 1rem auto':'3rem 1rem auto',justifyItems:'center',alignItems:'center',position:'relative'}}>
          {target && !preview ? <button className="ti003-native-position" type="button"
            aria-label={`Position ${value < 0 ? `negative ${-value}` : value > 0 ? `positive ${value}` : 'zero'}${placed ? ', placed' : ''}`}
            data-ti003-focus-control={`target-${target.targetId}`}
            disabled={disabled || Boolean(placed)}
            onDragOver={event => {if (!disabled && !placed) event.preventDefault();}}
            onDrop={event => {
              event.preventDefault();
              const card = cards.find(c => c.id === event.dataTransfer.getData("text/plain"));
              if (!disabled && !placed && card) onChoose(target.targetId, card.id);
            }}
            onClick={() => onChoose(target.targetId)}>{label(value)}{placed ? ' ✓' : ''}</button> : <span/>}
          <span aria-hidden="true" style={{width:'100%',borderTop:'2px solid #224b8e',position:'relative'}}><span style={{position:'absolute',left:'50%',height:'.75rem',top:'-.375rem',borderLeft:'2px solid #224b8e'}}/>{value===source.axisMin||value===source.axisMax?<span style={{position:'absolute',top:'-.7em',...(value===source.axisMin?{left:0}:{right:0})}}>{value===source.axisMin?'◀':'▶'}</span>:null}</span>
          <span data-ti003-number-label={value} data-lesson-text-block={`tick-${value}`}>{label(value)}</span>
        </div>;
      })}
    </div>
  </div>;
}

/** The source help diagram has its own −10..10 range, distinct from the exercise. */
export function Ti003HelpNumberLine() {
  return <div className="ti003-native-help-axis" role="group" tabIndex={0}
    aria-label="Number line from negative ten through zero to positive ten. Scroll horizontally to explore."
    style={{maxWidth:'100%',overflowX:'auto',padding:'.5rem .25rem 1rem'}}>
    <div style={{display:'grid',gridTemplateColumns:`repeat(${source.helpAxis.length},minmax(2rem,1fr))`,width:'100%',minWidth:`${source.helpAxis.length*2}rem`,fontSize:'1.125rem',lineHeight:1.5}}>
      {source.helpAxis.map(({value}) => <div key={value} style={{textAlign:'center',color:value<0?'#b91c1c':value>0?'#153d8a':'#111'}}>
        <div aria-hidden="true" style={{height:'1rem',borderBottom:'2px solid currentColor',position:'relative'}}>
          <span style={{position:'absolute',left:'50%',bottom:'-.375rem',height:'.75rem',borderLeft:'2px solid currentColor'}}/>
          {value===-10||value===10?<span style={{position:'absolute',bottom:'-.8em',...(value===-10?{left:0}:{right:0})}}>{value===-10?'◀':'▶'}</span>:null}
        </div>
        <span data-ti003-help-number-label={value} data-lesson-text-block={`help-tick-${value}`} style={{display:'block',paddingTop:'.5rem'}}>{label(value)}</span>
      </div>)}
    </div>
  </div>;
}
