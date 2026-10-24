'use client';
import React from 'react';
import {G4_L4_ZOG_X_GAME as game} from './generated/g4-l4-zog-x-game-config';

type Question=(typeof game.questions)[number];
/** Native question content only. The page owns source artwork, audio,
 * feedback clocks, navigation, focus restoration and runtime admission. */
export function ZogXQuestion({question:q,number,enabled,onAnswer}:{question:Question;number:number;enabled:boolean;onAnswer:(choice:string)=>void}){
 return <fieldset className="zog-x-question" data-zog-x-question={q.label} disabled={!enabled} lang="en">
  <style>{CSS}</style>
  <legend>
   <span data-lesson-text-block={`${q.label}-number`} data-source-text-ids={q.numberFieldIds.join(' ')}>{number}.</span>{' '}
   <span data-lesson-text-block={q.label} data-source-text-ids={q.sourcePromptIds.join(' ')}>{q.prompt}</span>
  </legend>
  <div className="zog-x-question__answers">
   {q.answers.map(answer=><button key={answer.id} type="button" disabled={!enabled} data-zog-x-answer={answer.id}
    data-source-button-id={answer.sourceButtonId} data-source-instance={answer.sourceInstanceId} onClick={()=>onAnswer(answer.id)}>
    <span data-lesson-text-block={`${q.label}-${answer.id}-letter`} data-source-text-ids={answer.sourceLetterIds.join(' ')}>{answer.id}</span>{' '}
    <span data-lesson-text-block={`${q.label}-${answer.id}`} data-source-text-ids={answer.sourceTextIds.join(' ')}>{answer.text}</span>
   </button>)}
  </div>
 </fieldset>;
}
const CSS=`.zog-x-question{min-inline-size:0;max-inline-size:100%;margin:0;padding:.5rem;border:1px solid #b4c8dc;border-radius:.8rem;background:#fff;color:#172c43;font:var(--lesson-text-body-size,1.125rem)/var(--lesson-text-line-height,1.6) var(--lesson-text-font-body,system-ui,sans-serif);font-variant-numeric:tabular-nums;overflow-wrap:normal;word-break:normal;hyphens:none}.zog-x-question *{box-sizing:border-box}.zog-x-question legend{max-inline-size:100%;padding:0 .3rem;font-size:1em;font-weight:600;white-space:normal}.zog-x-question__answers{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,11rem),1fr));gap:.75rem}.zog-x-question button{display:flex;flex-wrap:wrap;align-items:center;gap:.2em .5em;min-inline-size:0;min-block-size:44px;padding:.7rem .9rem;border:2px solid #8caac8;border-radius:.6rem;color:inherit;background:#f2f7fd;font:var(--lesson-text-label-size,1.125rem)/var(--lesson-text-line-height,1.6) var(--lesson-text-font-body,system-ui,sans-serif);text-align:start;cursor:pointer;touch-action:manipulation}.zog-x-question button>span{white-space:nowrap}.zog-x-question button>span:first-child{font-weight:700;color:#285c8e}.zog-x-question button:hover:enabled{background:#e5f0fc;border-color:#285c8e}.zog-x-question button:focus-visible{outline:3px solid #a64100;outline-offset:3px}.zog-x-question button:disabled{cursor:default}`;
