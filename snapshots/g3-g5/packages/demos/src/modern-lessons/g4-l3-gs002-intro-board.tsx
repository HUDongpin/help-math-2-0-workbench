import React from 'react';
import source from './generated/g4-l3-gs002-intro-board.json';
import {GS002_GAME_AXIS} from './g4-l3-gs002-board';

export const GS002_INTRO_BOARD=source;
export function getGs002IntroBoard(frame:number){
  return source.frames[Math.max(1,Math.min(426,Number.isFinite(frame)?Math.trunc(frame):1))-1];
}

/** Intro-only deterministic actor positions; game runtime continues to own gameplay. */
export function Gs002IntroBoard({frame,art}:{frame:number;art:{ship:string;virus:string}}){
  const s=getGs002IntroBoard(frame);
  return <figure lang="en" data-gs002-intro-board={s.frame} style={{margin:0,minWidth:0}}>
    <div role="group" aria-label="Animated demonstration on a vertical number line from seven to negative seven."
      style={{position:'relative',minWidth:'calc(4rem + 96px)',height:'45rem',border:'1px solid #8d9bb0',borderRadius:'.5rem',background:'#f7faff'}}>
      {GS002_GAME_AXIS.rows.map(row=><div key={row.index} style={{height:'3rem',borderBottom:row.index===14?undefined:'1px solid #8d9bb0',
        background:row.value===0?'#e9eff8':undefined,display:'flex',alignItems:'center'}}>
        <span data-source-text={row.sourceTextId} data-lesson-text-block={`intro-tick-${row.value}`}
          style={{width:'4rem',textAlign:'center',fontSize:'1.125rem',lineHeight:1.6,fontWeight:row.value===0?800:600,
            color:row.value<0?'#9f2222':row.value>0?'#153d8a':'#172033'}}>{row.label}</span>
      </div>)}
      <img src={art.ship} alt="Space coupe" data-source-character="48" data-source-y={s.actors.ship.centerY}
        style={{position:'absolute',width:39,height:26,maxWidth:'none',left:'calc(25% + 3rem)',top:`${(s.actors.ship.rowPosition+.5)*3}rem`,transform:'translate(-50%,-50%)'}}/>
      <span data-source-character="69" data-source-y={s.actors.virus.centerY}
        style={{position:'absolute',width:32,height:31,overflow:'hidden',left:'calc(75% + 1rem)',top:`${(s.actors.virus.rowPosition+.5)*3}rem`,transform:'translate(-50%,-50%)'}}>
        <img src={art.virus} alt="Virus" style={{position:'absolute',left:-129,top:0,width:161,height:31,maxWidth:'none'}}/>
      </span>
    </div>
  </figure>;
}
