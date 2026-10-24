import React from 'react';
import source from './generated/g4-l3-gs002-axis.json';
import {Gs002HitRow} from './g4-l3-gs002-hit-figure';
import type {CourseG04L03Gs002InteractionState} from '../timelines/course-g04-l03-gs-002-interaction';

export const GS002_GAME_AXIS = source;
type BoardState = Pick<CourseG04L03Gs002InteractionState,'shipIndex'|'virusIndex'|'mode'>;

/** Source art is provided by the maintained page. No random draw, clock, or answer hint here. */
export function Gs002GameBoard({state,art,hitFrame,reducedMotion=false}:{state:BoardState;art:{ship:string;virus:string};hitFrame?:number;reducedMotion?:boolean}) {
  const ship=source.rows[state.shipIndex],virus=source.rows[state.virusIndex];
  if (!ship || !virus || !Number.isInteger(state.shipIndex) || !Number.isInteger(state.virusIndex)) {
    throw new Error('GS002 game position outside source rows');
  }
  return <figure lang="en" data-gs002-native-board="true" style={{margin:0,minWidth:0}}>
    <figcaption data-gs002-copy-authority="modern-current-js" style={{lineHeight:1.6,marginBottom:'.75rem'}}>
      Space coupe: {ship.label}. Virus: {virus.label}.
    </figcaption>
    <div tabIndex={0} role="group" aria-label="Vertical number line from seven at the top to negative seven at the bottom. Scroll horizontally if needed."
      style={{overflowX:'auto',maxWidth:'100%',border:'1px solid #8d9bb0',borderRadius:'.5rem'}}>
      <div style={{minWidth:'calc(4rem + 128px)',background:'#f7faff'}}>
        {source.rows.map(row=><div key={row.index} data-gs002-row={row.index} data-gs002-value={row.value}
          style={{display:'grid',gridTemplateColumns:'4rem minmax(64px, 1fr) minmax(64px, 1fr)',minHeight:'3rem',alignItems:'center',
            borderBottom:row.index===14?undefined:'1px solid #8d9bb0',
            background:row.value===0?'#e9eff8':undefined}}>
          <span data-source-text={row.sourceTextId} data-lesson-text-block={`game-tick-${row.value}`}
            style={{fontSize:'1.125rem',lineHeight:1.6,textAlign:'center',fontWeight:row.value===0?800:600,
              color:row.value<0?'#9f2222':row.value>0?'#153d8a':'#172033'}}>{row.label}</span>
          {state.mode==='hit-resolving'&&hitFrame!==undefined&&state.shipIndex===row.index&&state.virusIndex===row.index
            ?<Gs002HitRow frame={hitFrame} reducedMotion={reducedMotion} ship={art.ship} row={row.index}/>
            :<><span style={{display:'flex',justifyContent:'center',minWidth:0}}>
            {state.shipIndex===row.index&&<img src={art.ship} alt="Space coupe" data-gs002-ship-row={row.index}
              width={39} height={26} style={{width:39,height:26,maxWidth:'none'}}/>}
          </span>
          <span style={{display:'flex',justifyContent:'center',minWidth:0}}>
            {state.virusIndex===row.index&&<span data-gs002-virus-row={row.index}
              style={{position:'relative',width:32,height:31,overflow:'hidden',flex:'0 0 32px'}}>
              <img src={art.virus} alt="Virus" width={161} height={31}
                style={{position:'absolute',left:-129,top:0,width:161,height:31,maxWidth:'none'}}/>
            </span>}
          </span></>}
        </div>)}
      </div>
    </div>
  </figure>;
}
