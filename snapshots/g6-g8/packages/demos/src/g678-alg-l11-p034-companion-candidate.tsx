"use client";
import React,{useEffect,useLayoutEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import type {AnimationRendererProps} from "./contract";
import {G678_ALG_L11_P034_FEEDBACK_CANDIDATE_MODULE} from "./g678-alg-l11-p034-feedback-candidate";
import {useP034CompanionController,type P034CompanionController} from "./g678-alg-l11-p034-companion-controller";
import {G678_ALG_L11_P034_LEARNER_MATH as MATH} from "./generated/g678-alg-l11-p034-learner-math-v1";
import {G678_ALG_L11_D_INSTRUCTIONAL_VISUALS as VISUALS} from "./generated/g678-alg-l11-tranche-d-instructional-visuals-v1";
import {G678_ALG_L11_P034_SOURCE_REVEAL as REVEAL} from "./generated/g678-alg-l11-p034-source-reveal-v1";
import {algL11P034FadeState} from "./g678-alg-l11-p034-source-fade";
import {algL11P034RevealedTile} from "./g678-alg-l11-p034-source-reveal";
const useClientLayoutEffect=typeof window==="undefined"?useEffect:useLayoutEffect;
const literals=new Map(MATH.map(card=>[card.cardId,card]));
const statusText=(state:P034CompanionController)=>state.controller.game.phase==="correct-feedback"?"Correct match: +10. Feedback is playing."
  :state.controller.game.phase==="wrong-feedback"?"Try another pair: −2. Feedback is playing."
    :state.controller.game.phase==="complete"?"All six pairs matched!":"Select two cards with equivalent inequalities.";
function useCompanionTarget(targetId:string|undefined){
  const[target,setTarget]=useState<HTMLElement|null>(null);
  useClientLayoutEffect(()=>{
    const resolve=()=>{const found=targetId?document.getElementById(targetId):null;
      const next=found?.isConnected&&found.dataset.pageInteractionCompanionHost==="true"&&!found.closest('[data-p034-source-plane]')?found:null;
      setTarget(previous=>previous===next?previous:next);};
    resolve();if(!targetId)return;
    const observer=new MutationObserver(resolve);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['id','data-page-interaction-companion-host']});
    return()=>observer.disconnect();
  },[targetId]);
  return target?.isConnected?target:null;
}
function SourceArt({svg}:{svg:string}){return<span style={{display:"block",width:"100%",pointerEvents:"none"}} dangerouslySetInnerHTML={{__html:svg}}/>;}
function SourcePlane({state,reduced}:{state:P034CompanionController;reduced:boolean}){
  const game=state.controller.game;
  const feedbackFrame=state.feedbackFrame;
  const frame=feedbackFrame?(reduced?Math.floor((feedbackFrame.source.startFrame+feedbackFrame.source.terminalFrame)/2):feedbackFrame.frame):0;
  const feedback=feedbackFrame?.source.frames[frame-1];
  const offset=feedback?.svg.match(/<g transform="matrix\(1\.0, 0\.0, 0\.0, 1\.0, ([^,]+), ([^)]+)\)"/);
  return<div data-p034-source-plane="800x600" aria-hidden="true" style={{position:"relative",width:"100%",aspectRatio:"4/3",overflow:"hidden",background:"#eef7ff"}}>
    {VISUALS.cards.filter(card=>card.level===game.level).map(card=>{
      const position=REVEAL.tiles.find(tile=>tile.cardId===card.id)!.cardSourcePosition;
      const matched=game.matchedPairIds.includes(card.pairId),tile=algL11P034RevealedTile(card.id,game.matchedPairIds);
      const fade=algL11P034FadeState(state.reveal.elapsedByPair[card.pairId]??0,matched,reduced);
      return<div key={card.id} data-source-art-card={card.id} data-source-vector-sha256={card.visual.sha256}
        style={{position:"absolute",left:`${(412.4+position.x)/8}%`,top:`${(283.3+position.y)/6}%`,width:`${card.visual.width/8}%`}}>
        {tile?<span data-source-revealed-tile={tile.sourceInstanceName} style={{position:"absolute",inset:0,visibility:fade.tileVisible?"visible":"hidden"}}><SourceArt svg={tile.visual.svg}/></span>:null}
        <span data-source-fade-tick={fade.tick} style={{display:"block",position:"relative",opacity:fade.opacity,visibility:fade.cardVisible?"visible":"hidden"}}><SourceArt svg={card.visual.svg}/></span>
      </div>;
    })}
    {feedback&&offset?<div data-source-feedback-art={feedbackFrame!.source.characterId} data-source-feedback-visual-frame={frame}
      style={{position:"absolute",left:`${(412.4-25.5-Number(offset[1]))/8}%`,top:`${(283.3-(feedbackFrame!.source.characterId===105?43.55:32.55)-Number(offset[2]))/6}%`,width:`${feedback.width/8}%`}}>
      <SourceArt svg={feedback.svg}/></div>:null}
  </div>;
}
function Companion({state,props,placement}:{state:P034CompanionController;props:AnimationRendererProps;placement:"portal"|"fallback"}){
  const host=useRef<HTMLElement|null>(null),lastPhase=useRef(state.controller.game.phase),cardElements=useRef(new Map<string,HTMLButtonElement>());
  const game=state.controller.game;
  useEffect(()=>{const previous=lastPhase.current;lastPhase.current=game.phase;
    if((previous==="correct-feedback"||previous==="wrong-feedback")&&game.phase==="choosing"&&
      (document.activeElement===document.body||host.current?.contains(document.activeElement))){
      const next=[...cardElements.current.values()].find(button=>!button.disabled);next?.focus({preventScroll:true});
    }
  },[game.phase]);
  return<section className="p034-math-companion" data-p034-action-tree="true" data-companion-placement={placement}
    aria-label="Inequalities Match Game" ref={host} lang="en">
    <header><h2>Inequalities Match Game</h2><p>Choose two cards with equivalent inequalities.</p></header>
    <div className="p034-math-companion__toolbar">{([1,2]as const).map(level=><button key={level} type="button" onClick={()=>state.changeLevel(level)}
      aria-pressed={game.level===level} disabled={state.locked||game.phase!=="choosing"}>Level {level}</button>)}
      <strong>Score: {game.score}</strong><span>Pairs: {state.controller.completedPairIds.length} / 6</span>
      <button type="button" disabled={props.paused||!props.onReplay} onClick={props.onReplay}>Replay</button></div>
    {state.controller.message?<p className="p034-math-companion__alert" role="alert">{state.controller.message}</p>:null}
    <p className="p034-math-companion__status" role="status" aria-live="polite" aria-atomic="true">{props.paused?"Paused. ":""}{statusText(state)}</p>
    <div className="p034-math-companion__cards">{VISUALS.cards.filter(card=>card.level===game.level).map(card=>{
      const literal=literals.get(card.id)!,matched=game.matchedPairIds.includes(card.pairId),selected=game.selectedCardId===card.id;
      return<button key={card.id} ref={element=>{if(element)cardElements.current.set(card.id,element);else cardElements.current.delete(card.id);}}
        className="p034-math-companion__card" type="button" data-source-card-id={card.id} data-source-character-id={card.sourceCharacterId}
        aria-label={literal.spoken} aria-description={matched?"Matched":selected?"Selected":undefined} aria-pressed={selected} disabled={state.locked||game.phase!=="choosing"||matched}
        data-card-matched={String(matched)} onClick={()=>state.select(card.id)}>
        <span className="p034-math-companion__expression" aria-hidden="true">{literal.expression}</span>
        <span className="p034-math-companion__card-state" aria-hidden="true">{matched?"Matched":selected?"Selected":"Choose card"}</span>
      </button>;
    })}</div>
    <style>{`
      .p034-math-companion{--p034-ink:#13284c;--p034-border:#2459a9;--p034-surface:#fff;box-sizing:border-box;background:#eef7ff;color:var(--p034-ink);font-family:system-ui,sans-serif;font-size:16px;line-height:1.5;max-width:800px;margin:0 auto;padding:16px;width:100%}
      .p034-math-companion *{box-sizing:border-box}.p034-math-companion h2{font-size:24px;line-height:1.25;margin:0 0 8px}.p034-math-companion p{margin:8px 0 16px}
      .p034-math-companion__toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.p034-math-companion button{min-height:48px;min-width:44px;padding:10px 14px;font:inherit;border:2px solid var(--p034-border);border-radius:8px;background:var(--p034-surface);color:var(--p034-ink);cursor:pointer;touch-action:manipulation}
      .p034-math-companion button:focus-visible{outline:3px solid #b45309;outline-offset:3px}.p034-math-companion button:disabled{cursor:default;border-color:#7890b0}.p034-math-companion button[aria-pressed=true]{background:#d3eaff;border-color:#13284c}
      .p034-math-companion__cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:8px}.p034-math-companion__card{text-align:left;display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:72px!important;overflow-wrap:normal}
      .p034-math-companion__expression{font-size:20px;line-height:1.5;font-weight:600;min-width:0;white-space:normal}.p034-math-companion__card-state{font-size:12px;line-height:1.4;flex-shrink:0}.p034-math-companion__card[data-card-matched=true]{background:#d7f2df}
      .p034-math-companion__status{border-left:4px solid var(--p034-border);padding:8px 12px;background:#fff;min-height:48px}.p034-math-companion__alert{border-left:4px solid #a22323;background:#fff4f4;padding:12px}
      @media(max-width:480px){.p034-math-companion__cards{grid-template-columns:1fr}.p034-math-companion__card{align-items:flex-start;flex-direction:column;gap:4px}.p034-math-companion{padding:16px}}
    `}</style>
  </section>;
}
export function AlgL11P034CompanionRenderer(props:AnimationRendererProps){
  const state=useP034CompanionController(props),target=useCompanionTarget(props.pageInteractionCompanionTargetId);
  const content=<Companion state={state} props={props} placement={target?"portal":"fallback"}/>;
  return<div data-p034-companion-successor="v1" data-source-level={state.controller.game.level} data-host-feedback-gate={state.controller.gate}
    data-feedback-phase={state.controller.game.phase} data-source-score={state.controller.game.score}
    data-source-completed-pair-count={state.controller.completedPairIds.length} data-source-revealing-pair-count={state.controller.game.matchedPairIds.length}
    data-source-feedback-frame={state.feedbackFrame?.frame??1} data-source-feedback-elapsed={Math.floor(state.elapsed)}
    data-source-audio-disposition="exact-extracted-payload-unrouted" data-source-interaction-complete={String(state.finished)}>
    {target?<><SourcePlane state={state} reduced={Boolean(props.reducedMotion)}/>{createPortal(content,target)}</>
      :<div data-p034-standalone-fallback="true" style={props.pageInteractionCompanionTargetId?{maxHeight:600,overflowY:"auto"}:undefined}>
        {content}<SourcePlane state={state} reduced={Boolean(props.reducedMotion)}/>
      </div>}
  </div>;
}
export const G678_ALG_L11_P034_COMPANION_CANDIDATE_MODULE=Object.freeze({...G678_ALG_L11_P034_FEEDBACK_CANDIDATE_MODULE,Renderer:AlgL11P034CompanionRenderer});
