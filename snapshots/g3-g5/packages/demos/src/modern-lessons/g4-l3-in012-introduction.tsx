'use client';
import React from 'react';
import {In012AxisArt, in012TickLeft} from './g4-l3-in012-axis';
import {getIn012Introduction} from './g4-l3-in012-intro-state';
import {IN012_ACTIVITY_STYLES} from './g4-l3-in012-activity';
import {COURSE_G04_L03_IN_012_CARDS as CARDS} from '../timelines/course-g04-l03-in-012-owing-drag-interaction';
const signed = (n: number) => n < 0 ? `−${-n}` : n > 0 ? `+${n}` : '0';
/** Source-timed native text introduction. No interactive answers before frame174. */
export function In012Introduction({frame, onKeyTerm}: {frame: number; onKeyTerm?: (entryId: string, trigger: HTMLButtonElement) => void}) {
  const scene = getIn012Introduction(frame);
  return <section className="in012-activity" lang="en" data-in012-intro-frame={frame}>
    <style>{IN012_ACTIVITY_STYLES}</style>
    {scene.instructions.map(instruction => <p key={instruction.characterId} style={{opacity: instruction.opacity}} data-source-text={instruction.characterId} data-lesson-text-block={instruction.characterId===29?'instruction-first':'instruction-second'}>
      {[...new Set(instruction.glyphs.map(g => g.sourceTextId))].map(run => {
        const glyphs = instruction.glyphs.filter(g => g.sourceTextId === run);
        const entry = ({'character-29/run-1': 'en-0495-b62037868041', 'character-33/run-0': 'en-0424-79116d5cfb19', 'character-33/run-2': 'en-0451-a7f0d0283926'} as Record<string, string>)[run];
        if (entry && onKeyTerm && glyphs.every(g => g.visible)) return <button key={run} type="button" className="in012-term" onClick={e => onKeyTerm(entry, e.currentTarget)}>{glyphs.map(g => g.text).join('')}</button>;
        return <span key={run}><span style={{position: 'absolute', width: 1, height: 1, padding: 0, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap'}}>{glyphs.filter(g => g.visible).map(g => g.text).join('')}</span>
          <span aria-hidden="true">{glyphs.map((glyph, index) => <span key={index} style={{visibility: glyph.visible ? 'visible' : 'hidden'}}>{glyph.text}</span>)}</span></span>;
      })}
    </p>)}
    <div className="in012-axis" tabIndex={0} role="group" aria-label="Number line from negative eight to positive eight. Scroll horizontally to explore all positions.">
      <div className="in012-axis-plane" style={{height: '5rem'}}>
        <In012AxisArt frame={frame} top=".3rem"/>
        {scene.ticks.map(tick => <span key={tick.value} className="in012-tick" data-number-value={tick.value} data-lesson-text-block={`tick-${tick.value}`}
          aria-hidden={tick.opacity === 0} style={{left: in012TickLeft(tick.value), top: '1.75rem', opacity: tick.opacity}}>{signed(tick.value)}</span>)}
      </div>
    </div>
    <div className="in012-cards">{CARDS.map(card => <div key={card.id} className="in012-card"
      data-intro-card={card.id} data-lesson-text-block={`card-${card.id}`} aria-hidden={scene.cards.find(c => c.id === card.id)!.opacity === 0}
      style={{opacity: scene.cards.find(c => c.id === card.id)!.opacity}}>
      <strong>{card.person}</strong><span>{card.relation} {card.amountText}</span>
    </div>)}</div>
  </section>;
}
