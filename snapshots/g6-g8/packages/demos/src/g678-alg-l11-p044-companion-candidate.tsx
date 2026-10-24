"use client";
import React,{useEffect,useId,useLayoutEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import type {AnimationRendererProps} from "./contract";
import {G678_ALG_L11_P044_HOST_SCORE_CANDIDATE_MODULE} from "./g678-alg-l11-p044-host-score-candidate";
import {useP044CompanionController,type P044CompanionController} from "./g678-alg-l11-p044-companion-controller";
import {G678_ALG_L11_P044_LITERAL_CONTENT as LITERALS} from "./generated/g678-alg-l11-p044-literal-content-v1";
import {G678_ALG_L11_D_INSTRUCTIONAL_VISUALS as SOURCE} from "./generated/g678-alg-l11-tranche-d-instructional-visuals-v1";
const useClientLayoutEffect=typeof window==="undefined"?useEffect:useLayoutEffect;
function useCompanionTarget(targetId:string|undefined){
  const[target,setTarget]=useState<HTMLElement|null>(null);
  useClientLayoutEffect(()=>{const resolve=()=>{const found=targetId?document.getElementById(targetId):null;
    const next=found?.isConnected&&found.dataset.pageInteractionCompanionHost==="true"&&!found.closest('[data-p044-source-plane]')?found:null;
    setTarget(previous=>previous===next?previous:next);};resolve();if(!targetId)return;
    const observer=new MutationObserver(resolve);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['id','data-page-interaction-companion-host']});
    return()=>observer.disconnect();},[targetId]);
  return target?.isConnected?target:null;
}
const sourceByNumber=new Map<number,(typeof SOURCE.questions)[number]>(SOURCE.questions.map(q=>[q.number,q]));
const literalByNumber=new Map<number,(typeof LITERALS)[number]>(LITERALS.map(q=>[q.number,q]));
function currentQuestion(state:P044CompanionController){const assessment=state.controller.assessment;
  const review=assessment.phase==="review"?assessment.responses[assessment.reviewIndex]:null;
  const number=review?.questionNumber??assessment.questionNumbers[assessment.currentIndex];
  return{review,number,source:sourceByNumber.get(number)!,literal:literalByNumber.get(number)!};}
function SourceArt({visual}:{visual:{readonly svg:string;readonly sha256:string}}){
  const instance=`p044-art-${useId().replace(/[^a-zA-Z0-9_-]/g,'')}`;
  // Source plane and readable graph choices may display the same source asset.
  // Namespace only DOM identifiers/references, never its vector geometry.
  const svg=visual.svg.replace(/\bid="([^"]+)"/g,(_,id)=>`id="${instance}-${id}"`)
    .replace(/(xlink:href|href)="#([^"]+)"/g,(_,attribute,id)=>`${attribute}="#${instance}-${id}"`)
    .replace(/url\(#([^)]*)\)/g,(_,id)=>`url(#${instance}-${id})`);
  return<span aria-hidden="true" data-source-vector-sha256={visual.sha256} data-source-svg-instance={instance}
    style={{display:"block",width:"100%",pointerEvents:"none"}} dangerouslySetInnerHTML={{__html:svg}}/>;
}
function SourcePlane({state}:{state:P044CompanionController}){
  const{source,review}=currentQuestion(state),assessment=state.controller.assessment;
  if(assessment.phase==="results")return<div aria-hidden="true" data-p044-source-plane="800x600" style={{aspectRatio:"4/3",background:"#eef7ff",padding:"4%"}}>
    <p>Final Quiz</p><p>Score: {assessment.responses.filter(r=>r.correct).length} / 10</p></div>;
  const promptHeight=Math.min(source.prompt.height,160),choiceHeights=source.choices.map(c=>Math.min(c.visual.height,64));
  return<div aria-hidden="true" data-p044-source-plane="800x600" data-source-review-visual={String(Boolean(review))}
    style={{position:"relative",aspectRatio:"4/3",width:"100%",overflow:"hidden",background:"#eef7ff"}}>
    <div style={{position:"absolute",left:"3%",top:"4%",width:`${Math.min(source.prompt.width,740)/8}%`}}><SourceArt visual={source.prompt}/></div>
    {source.choices.map((choice,index)=>{const top=40+promptHeight+30+choiceHeights.slice(0,index).reduce((a,b)=>a+b+30,0);
      const selected=review?.selectedOption===choice.option,correct=review?.correctOption===choice.option;
      return<div key={choice.option} data-source-art-choice={choice.sourceInstanceName} data-source-art-selected={String(selected)} data-source-art-correct={String(correct)}
        style={{position:"absolute",left:"3%",top:`${top/6}%`,width:`${Math.min(choice.visual.width,700)/8}%`,
          outline:correct?"3px solid #23713c":selected?"3px solid #b45309":undefined,background:correct?"#e2f5e8":undefined}}><SourceArt visual={choice.visual}/></div>;
    })}
  </div>;
}
function Companion({state,props,placement}:{state:P044CompanionController;props:AnimationRendererProps;placement:"portal"|"fallback"}){
  const assessment=state.controller.assessment,{source,literal,review,number}=currentQuestion(state),questionHeading=useRef<HTMLHeadingElement|null>(null),surface=useRef<HTMLElement|null>(null);
  const previousQuestion=useRef(`${number}:${assessment.phase}:${assessment.reviewIndex}`);
  useEffect(()=>{const next=`${number}:${assessment.phase}:${assessment.reviewIndex}`;
    if(previousQuestion.current!==next&&(document.activeElement===document.body||surface.current?.contains(document.activeElement)))questionHeading.current?.focus();
    previousQuestion.current=next;},[number,assessment.phase,assessment.reviewIndex]);
  const progress=review?`Review ${assessment.reviewIndex+1} of 10`:assessment.phase==="answering"?`Question ${assessment.currentIndex+1} of 10`:"Quiz results";
  const showing=assessment.phase==="answering"||Boolean(review);
  return<section ref={surface} className="p044-math-companion" lang="en" data-p044-action-tree="true" data-companion-placement={placement} aria-label="Final Quiz">
    <div className="p044-math-companion__toolbar"><h2>Final Quiz</h2><button disabled={props.paused||!props.onReplay} type="button" onClick={props.onReplay}>Replay</button></div>
    {state.controller.message?<p role="alert" className="p044-math-companion__alert">{state.controller.message}</p>:null}
    <h3 ref={questionHeading} tabIndex={-1} className="p044-math-companion__progress" aria-live="polite">{props.paused?"Paused. ":""}{progress}</h3>
    {showing?<div data-source-question={literal.label} data-source-frame={source.sourceFrame} data-source-review-frame={review?source.sourceReviewFrame:undefined}>
      <p className="p044-math-companion__prompt" data-literal-prompt="true"><span data-visible-prompt="true" aria-hidden="true">{literal.prompt}</span>
        <span className="p044-math-companion__sr-only" data-spoken-prompt="true">{literal.promptSpoken}</span></p>
      {literal.promptGraphDescription?<><p className="p044-math-companion__graph-description" data-literal-graph-description="true">{literal.promptGraphDescription}</p>
        <div className="p044-math-companion__graphic"><SourceArt visual={source.prompt}/></div></>:null}
      <div className="p044-math-companion__choices" aria-label={review?"Choices and answer review":"Choose an answer"}>
        {literal.choices.map(choice=>{const visual=source.choices[choice.option-1],selected=review?.selectedOption===choice.option,correct=review?.correctOption===choice.option;
          const reviewText=selected&&correct?"Your answer · Correct":selected?"Your answer":correct?"Correct answer":null;
          return<button key={choice.option} className="p044-math-companion__choice" type="button" data-source-instance-name={choice.sourceInstanceName}
            data-source-character-id={choice.sourceCharacterId} data-review-selected={String(selected)} data-review-correct={String(correct)}
            aria-label={`${String.fromCharCode(64+choice.option)}. ${choice.spoken}`} aria-description={reviewText??undefined}
            disabled={state.locked||Boolean(review)} onClick={()=>state.dispatch({type:"answer",option:choice.option as 1|2|3|4,input:"mouse"})}>
            <span className="p044-math-companion__choice-label" aria-hidden="true">{String.fromCharCode(64+choice.option)}.</span>
            <span className="p044-math-companion__choice-body"><span className="p044-math-companion__literal" data-literal-choice="true" aria-hidden="true">{choice.text}</span>
              {choice.graphic?<span className="p044-math-companion__graphic"><SourceArt visual={visual.visual}/></span>:null}
              {reviewText?<strong className="p044-math-companion__review-status" aria-hidden="true">{reviewText}</strong>:null}</span>
          </button>;
        })}
      </div>
    </div>:<div role="status"><p className="p044-math-companion__result">Score: {assessment.responses.filter(r=>r.correct).length} / 10</p><p>{assessment.grade}</p>
      <button type="button" disabled={state.locked} onClick={()=>state.dispatch({type:"begin-review",input:"mouse"})}>Review answers</button></div>}
    {review?<button className="p044-math-companion__review-next" type="button" disabled={state.locked}
      onClick={()=>state.dispatch({type:assessment.reviewIndex<9?"next-review":"finish-review",input:"mouse"})}>{assessment.reviewIndex<9?"Next review":"Finish review"}</button>:null}
    <style>{`
      .p044-math-companion{--p044-ink:#13284c;--p044-border:#2459a9;box-sizing:border-box;max-width:800px;margin:0 auto;padding:16px;width:100%;background:#eef7ff;color:var(--p044-ink);font-family:system-ui,sans-serif;font-size:16px;line-height:1.5}
      .p044-math-companion *{box-sizing:border-box}.p044-math-companion__toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.p044-math-companion h2{font-size:24px;margin:0}.p044-math-companion h3{font-size:18px;margin:12px 0}
      .p044-math-companion button{font:inherit;min-height:48px;min-width:44px;border:2px solid var(--p044-border);border-radius:8px;padding:10px 14px;background:white;color:var(--p044-ink);cursor:pointer;touch-action:manipulation}.p044-math-companion button:disabled{cursor:default;border-color:#7890b0}
      .p044-math-companion button:focus-visible,.p044-math-companion__progress:focus-visible{outline:3px solid #b45309;outline-offset:3px}.p044-math-companion__prompt,.p044-math-companion__graph-description,.p044-math-companion__literal,.p044-math-companion__result{font-size:20px;line-height:1.5;white-space:normal;overflow-wrap:normal}
      .p044-math-companion__prompt{margin:12px 0 16px}.p044-math-companion__graph-description{padding:12px;background:white;border-left:4px solid var(--p044-border)}.p044-math-companion__choices{display:grid;grid-template-columns:1fr;gap:8px;margin-top:16px}
      .p044-math-companion__choice{display:flex;gap:12px;align-items:flex-start;text-align:left;width:100%;min-height:64px!important}.p044-math-companion__choice-label{font-size:20px;font-weight:700;flex-shrink:0}.p044-math-companion__choice-body{min-width:0;display:block;flex:1}.p044-math-companion__literal{display:block}
      .p044-math-companion__graphic{display:block;max-width:560px;width:100%;margin:8px 0}.p044-math-companion__review-status{display:block;margin-top:8px;font-size:16px}.p044-math-companion__choice[data-review-correct=true]{background:#e2f5e8;border-color:#23713c}.p044-math-companion__choice[data-review-selected=true]:not([data-review-correct=true]){border-color:#b45309}
      .p044-math-companion__review-next{margin-top:16px}.p044-math-companion__alert{padding:12px;background:#fff4f4;border-left:4px solid #a22323}
      .p044-math-companion__sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
    `}</style>
  </section>;
}
export function AlgL11P044CompanionRenderer(props:AnimationRendererProps){
  const state=useP044CompanionController(props),target=useCompanionTarget(props.pageInteractionCompanionTargetId),assessment=state.controller.assessment;
  const content=<Companion state={state} props={props} placement={target?"portal":"fallback"}/>;
  return<div data-p044-companion-successor="v1" data-host-score-gate={state.controller.scoreGate} data-assessment-phase={assessment.phase}
    data-host-acknowledged-source-questions={state.controller.acknowledgedSourceQuestionIds.join(',')} data-random-selection={assessment.questionNumbers.join(',')}
    data-host-score-completion-eligible={String(state.finished)} data-source-audio-disposition="pending-source-audio-routing">
    {target?<><SourcePlane state={state}/>{createPortal(content,target)}</>:<div data-p044-standalone-fallback="true" style={props.pageInteractionCompanionTargetId?{maxHeight:600,overflowY:"auto"}:undefined}>
      {content}<SourcePlane state={state}/></div>}
  </div>;
}
export const G678_ALG_L11_P044_COMPANION_CANDIDATE_MODULE=Object.freeze({...G678_ALG_L11_P044_HOST_SCORE_CANDIDATE_MODULE,Renderer:AlgL11P044CompanionRenderer});
