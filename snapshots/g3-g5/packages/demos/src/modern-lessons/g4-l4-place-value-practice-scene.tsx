'use client';
import React from'react';
import {ColumnArithmeticScene,type ColumnArithmeticConfig}from'./g4-l4-column-arithmetic';
import {numberLineValue as valueAt}from'./g4-l4-number-line';
export interface PlaceValuePracticeConfig extends ColumnArithmeticConfig {
 readonly initialQuestionFrame:number;readonly poolSize:6|7;
 readonly questions:readonly Readonly<{label:string;frame:number;answerOwner:string;childSprite:number}>[];
 readonly copy:readonly Readonly<{id:string;text:string;active:readonly(readonly[number,boolean])[];sourceTextIds:readonly string[];sourceInstances:readonly string[];tokens:readonly Readonly<{text:string;color:string;sourceTextIds:readonly string[];alpha:readonly(readonly[number,number])[]}>[]}>[];
 readonly button:Readonly<{id:string;text:string;sourceTextIds:readonly string[];sourceInstances:readonly string[];sourceButtonId:number}>;
}
export function getPlaceValuePracticeCopy(config:PlaceValuePracticeConfig,frame:number){
 return config.copy.map(p=>({...p,visible:valueAt(p.active,frame,false),tokens:p.tokens.map(t=>({...t,alpha:valueAt(t.alpha,frame,0)}))}));
}
export function PlaceValuePracticeScene({config,frame,replay=0,paused=false,ready=false,onNewProblem}:{config:PlaceValuePracticeConfig;frame:number;replay?:number;paused?:boolean;ready?:boolean;onNewProblem?:()=>void}){
 return <ColumnArithmeticScene config={config} frame={frame} replay={replay}>
  <style>{`.g4l4-practice-copy{font:1.125rem/1.6 var(--lesson-font-body,system-ui,sans-serif);color:#17273c;overflow-wrap:normal;word-break:normal;hyphens:none}.g4l4-practice-copy p{margin:.55em 0}.g4l4-practice-copy span{transition:none!important}.g4l4-practice-copy button{font:inherit;padding:.35em .7em;min-inline-size:44px;min-block-size:44px;border:1px solid #1556a0;border-radius:.4em;background:#1556a0;color:white;cursor:pointer}.g4l4-practice-copy button:disabled{background:#dce6ef;color:#35485c;cursor:default}.g4l4-practice-copy button:focus-visible{outline:3px solid #1556a0;outline-offset:3px}`}</style>
  <div className="g4l4-practice-copy">
   {getPlaceValuePracticeCopy(config,frame).filter(p=>p.visible).map(p=><p key={p.id} data-lesson-text-block={p.id} data-source-instances={p.sourceInstances.join(',')}>{p.tokens.map((t,i)=><span key={i} data-source-word={i} aria-hidden={t.alpha<=0} style={{opacity:t.alpha,visibility:t.alpha>0?'visible':'hidden',color:t.color}}>{t.text}</span>)}</p>)}
   <p><button type="button" data-place-value-new-problem data-lesson-text-block={config.button.id} data-source-button={config.button.sourceButtonId} disabled={paused||!ready||!onNewProblem} onClick={onNewProblem}>{config.button.text}</button></p>
  </div>
 </ColumnArithmeticScene>;
}
