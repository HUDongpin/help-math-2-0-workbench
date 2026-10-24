import React from 'react';
import {Gs002IntroductionText} from './g4-l3-gs002-introduction';
import {Gs002IntroBoard} from './g4-l3-gs002-intro-board';
import {Gs002IntroControls} from './g4-l3-gs002-intro-controls';
import type {Gs002OpenTerm} from './g4-l3-gs002-copy';
import {Gs002IntroStatus,GS002_COPY} from './g4-l3-gs002-copy';

/** Composed source-frame intro; official host still owns playback and game handoff. */
export function Gs002IntroScene({frame,reducedMotion=false,art,onKeyTerm,onNewGame}:{
  frame:number;reducedMotion?:boolean;art:{ship:string;virus:string};onKeyTerm?:Gs002OpenTerm;onNewGame?:()=>void;
}){
  return <section lang="en" data-gs002-intro-scene={frame} style={{display:'grid',gap:'1rem',minWidth:0}}>
    <Gs002IntroStatus frame={frame}/>
    <Gs002IntroductionText frame={frame} reducedMotion={reducedMotion} onKeyTerm={onKeyTerm} showSymbols={false}/>
    <Gs002IntroControls frame={frame} reducedMotion={reducedMotion} onNewGame={onNewGame}/>
    <p data-source-text={GS002_COPY.introHelpLabel.sourceTextId} data-lesson-text-block="intro-help-label"
      style={{margin:0,fontSize:'1.125rem',lineHeight:1.6,color:'#475569'}}>{GS002_COPY.introHelpLabel.text}</p>
    <Gs002IntroBoard frame={frame} art={art}/>
  </section>;
}
