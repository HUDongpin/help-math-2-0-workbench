import React, {lazy, Suspense, useEffect, useId, useRef} from 'react';
import type {AnimationRendererProps} from '../contract';
import {LessonSourceButton} from '../lesson-source-button';
import {GS002_SOURCE_ACTIVITIES} from './g4-l3-gs002-source-activities';
import type {CourseG04L03Gs002InteractionAction,CourseG04L03Gs002InteractionState} from '../timelines/course-g04-l03-gs-002-interaction';
import {Gs002GameBoard} from './g4-l3-gs002-board';
import {GS002_COPY,Gs002FeedbackText,Gs002GameStatus} from './g4-l3-gs002-copy';

const EndingFigure=lazy(()=>import('./g4-l3-gs002-ending-figure').then(module=>({default:module.Gs002EndingFigure})));

const buttonStyle={font:'inherit',fontSize:'1.125rem',lineHeight:1.6,minHeight:44,minWidth:44,
  maxWidth:'100%',padding:'.4rem .75rem',border:'1px solid #61738c',borderRadius:'.4rem',
  color:'#172033',background:'#fff',overflowWrap:'anywhere'} as const;

/** Controlled presentation. The caller retains the existing reducer, clock, pause and Replay. */
export function Gs002Activity({state,dispatch,art,help,runtime,focusOnEntry=false,reducedMotion=false}:{
  runtime?:AnimationRendererProps;
  state:CourseG04L03Gs002InteractionState;
  dispatch:React.Dispatch<CourseG04L03Gs002InteractionAction>;
  art:{ship:string;virus:string};
  help:React.ReactNode;
  focusOnEntry?:boolean;
  reducedMotion?:boolean;
}) {
  const id=useId(),distanceRef=useRef<HTMLInputElement>(null),plusRef=useRef<HTMLInputElement>(null);
  const closeRef=useRef<HTMLButtonElement>(null),helpRef=useRef<HTMLButtonElement>(null);
  const newGameRef=useRef<HTMLButtonElement>(null),previousMode=useRef(state.mode);
  const ready=state.mode==='ready',popup=state.mode==='help'||state.mode==='feedback';
  const hitDefinition=GS002_SOURCE_ACTIVITIES.find(a=>a.id==='gs002-source-69')!;
  const hitActivity=runtime?.lessonActivities?.find(a=>a.id===hitDefinition.id&&a.frameDomain===hitDefinition.frameDomain&&a.sourceInstanceId===hitDefinition.sourceInstanceId);
  const sourceClose=state.mode==='help'||(state.mode==='feedback'&&GS002_COPY.feedback.includes(state.feedbackText??''));
  const closeProps={ref:closeRef,type:'button' as const,style:buttonStyle,
    'data-lesson-text-block':state.mode==='help'?'help-close':'feedback-close',
    'data-source-text':GS002_COPY.labels.close.sourceTextId,
    onClick:()=>dispatch({type:state.mode==='help'?'close-help':'close-feedback'})};
  // Opt in only for an intentional user-initiated handoff, not passive playback.
  useEffect(()=>{if(focusOnEntry)plusRef.current?.focus();},[focusOnEntry]);
  useEffect(()=>{
    const previous=previousMode.current;previousMode.current=state.mode;
    if(popup)closeRef.current?.focus();
    else if(state.mode==='expired')newGameRef.current?.focus();
    else if(ready&&previous==='help')helpRef.current?.focus();
    else if(ready&&previous==='feedback')(state.sign?distanceRef:plusRef).current?.focus();
    else if(ready&&previous==='expired')plusRef.current?.focus();
  },[state.mode,state.sign,popup,ready]);

  return <section lang="en" data-gs002-native-activity="true" data-game-mode={state.mode}
    style={{display:'grid',gap:'1rem',minWidth:0,color:'#172033'}}>
    <Gs002GameStatus state={state}/>
    <form onSubmit={event=>{event.preventDefault();dispatch({type:'submit-move'});}}>
      <fieldset disabled={!ready} style={{border:0,padding:0,margin:0,minWidth:0,display:'grid',gap:'.75rem'}}>
        <legend data-gs002-copy-authority="modern-current-js" style={{marginBottom:'.5rem'}}>Direction and distance</legend>
        <div role="group" aria-label="Direction" style={{display:'flex',flexWrap:'wrap',gap:'.5rem 1rem'}}>
          {(['+','-'] as const).map(sign=><label key={sign}
            style={{display:'flex',gap:'.5rem',alignItems:'center',minHeight:44,maxWidth:'100%',fontSize:'1.125rem',lineHeight:1.6}}>
            <input type="radio" name={`${id}-sign`} aria-label={sign==='+'?'Positive':'Negative'}
              checked={state.sign===sign} ref={sign==='+'?plusRef:undefined}
              onChange={()=>dispatch({type:'set-sign',sign})}/>
            <span>{sign==='+'?'Positive (+)':'Negative (−)'}</span>
          </label>)}
        </div>
        <label style={{display:'grid',gap:'.25rem',minWidth:0}}>
          <span data-gs002-copy-authority="modern-current-js">Number of spaces</span>
          <input ref={distanceRef} type="text" inputMode="numeric" autoComplete="off" spellCheck={false}
            maxLength={2} pattern="[0-9]{0,2}" aria-label="Number of spaces"
            data-source-text="character-138" data-lesson-text-block={state.distanceInput?'game-distance':undefined} value={state.distanceInput}
            onChange={event=>dispatch({type:'set-distance',value:event.currentTarget.value})}
            style={{font:'inherit',fontSize:'1.125rem',lineHeight:1.6,width:'8ch',maxWidth:'100%',minHeight:44,
              boxSizing:'border-box',padding:'.35rem .5rem',color:'#172033',background:'#fff',border:'1px solid #61738c',borderRadius:'.3rem'}}/>
        </label>
        <div style={{display:'flex',flexWrap:'wrap',gap:'.5rem'}}>
          <button type="submit" style={buttonStyle} data-lesson-text-block="game-go" data-source-text={GS002_COPY.labels.go.sourceTextId}>{GS002_COPY.labels.go.text}</button>
          <button type="button" style={buttonStyle} data-lesson-text-block="game-newGame" data-source-text={GS002_COPY.labels.newGame.sourceTextId}
            onClick={()=>dispatch({type:'new-game'})}>{GS002_COPY.labels.newGame.text}</button>
          <button ref={helpRef} type="button" style={buttonStyle} data-lesson-text-block="game-help" data-source-text={GS002_COPY.labels.help.sourceTextId}
            onClick={()=>dispatch({type:'open-help'})}>{GS002_COPY.labels.help.text}</button>
        </div>
      </fieldset>
    </form>
    {popup&&<div role="dialog" aria-labelledby={`${id}-popup-title`}
      style={{display:'grid',gap:'.75rem',padding:'.75rem',border:'2px solid #61738c',borderRadius:'.5rem',minWidth:0}}>
      <h3 id={`${id}-popup-title`} data-lesson-text-block={state.mode==='help'?'help-title':undefined} style={{font:'inherit',fontWeight:800,margin:0}}>
        {state.mode==='help'?GS002_COPY.labels.help.text:'Try again'}</h3>
      {state.mode==='help'?help:<Gs002FeedbackText text={state.feedbackText??''}/>}
      {sourceClose&&runtime?<LessonSourceButton {...closeProps} runtime={runtime}
        activityId={`gs002-button-${state.mode==='help'?'help-close':'feedback-close'}`}>{GS002_COPY.labels.close.text}</LessonSourceButton>
        :<button {...closeProps}>{GS002_COPY.labels.close.text}</button>}
    </div>}
    {state.mode==='expired'&&<div role="dialog" aria-labelledby={`${id}-expired-title`}
      data-gs002-copy-authority="modern-current-js" style={{display:'grid',gap:'.75rem',minWidth:0}}>
      <h3 id={`${id}-expired-title`} style={{font:'inherit',fontWeight:800,margin:0}}>Time&apos;s up</h3>
      <p style={{margin:0,lineHeight:1.6}}>Final score: {state.score}</p>
      <button ref={newGameRef} type="button" style={buttonStyle} data-lesson-text-block="expired-newGame" onClick={()=>dispatch({type:'new-game'})}>{GS002_COPY.labels.newGame.text}</button>
      <Suspense fallback={<p role="status">Loading ending animation…</p>}>
        <EndingFigure elapsedMs={state.endingElapsedMs} reducedMotion={reducedMotion}/>
      </Suspense>
    </div>}
    {state.mode==='moving'||state.mode==='hit-resolving'?<p role="status" data-gs002-copy-authority="modern-current-js"
      style={{margin:0,lineHeight:1.6}}>{state.mode==='moving'?'Ship moving.':`Target reached. Score ${state.score}.`}</p>:null}
    {state.mode!=='expired'&&<Gs002GameBoard state={state} art={art} hitFrame={hitActivity?.frame} reducedMotion={reducedMotion}/>}
  </section>;
}
