'use client';
import React,{useLayoutEffect,useRef}from'react';
import source from './generated/g4-l3-ti002-native-inputs.json';
import{COURSE_G04_L03_TI_002_CARDS as cards,type CourseG04L03Ti002KeyTermDragState as State,type CourseG04L03Ti002KeyTermDragAction as Action,type CourseG04L03Ti002CardId as CardId}from'../timelines/course-g04-l03-ti-002-key-term-drag-interaction';
import{TI002_DEFINITION_LINKS}from'./g4-l3-ti002-keyterms';
import type{Ti002PictureButton}from'./g4-l3-ti002-picture-dialog';
const text=(id:number)=>source.texts.find(t=>t.characterId===id)!;
const pictureButtons:Record<CardId,Ti002PictureButton>={Scr_1:144,Scr_2:179,Scr_3:171,Scr_4:143,Scr_5:145};
const definitionIds:Record<CardId,number>={Scr_1:79,Scr_2:87,Scr_3:76,Scr_4:71,Scr_5:83};
const termIds:Record<CardId,number>={Scr_1:66,Scr_2:68,Scr_3:67,Scr_4:69,Scr_5:65};
const rows=[...cards].sort((a,b)=>a.targetCenter.y-b.targetCenter.y);
/** Controlled question only: host owns admission, feedback activity and reset. */
export function Ti002Question({state,dispatch,paused,onPictureOpen,pictures,onKeyTerm}:{state:State;dispatch:(action:Action)=>void;paused:boolean;onPictureOpen:(id:Ti002PictureButton,trigger:HTMLButtonElement)=>void;pictures:Record<CardId,React.ReactNode>;onKeyTerm?:(sourceButtonId:number,trigger:HTMLButtonElement)=>void}){
 const root=useRef<HTMLElement>(null),previous=useRef(state),drag=useRef<{id:CardId;x:number;y:number}|null>(null),suppress=useRef<CardId|null>(null),close=useRef<HTMLButtonElement>(null);
 const focused=useRef<HTMLElement|null>(null);
 const disabled=paused||state.locked;
 useLayoutEffect(()=>{
  if(state.outcome==='wrong'&&previous.current.outcome!=='wrong')close.current?.focus();
  if(previous.current.outcome==='wrong'&&state.outcome==='ready')root.current?.querySelector<HTMLButtonElement>(`[data-ti002-card="${previous.current.wrongCardId}"]`)?.focus();
  const section=root.current,active=section?.ownerDocument.activeElement;
  if(section&&state.outcome==='correct-feedback'&&previous.current.outcome!=='correct-feedback'&&state.lastPlacedCardId){
   const origin=focused.current;
   if(origin&&(origin.dataset.ti002Target===state.attemptedTargetId||origin.dataset.ti002Card===state.lastPlacedCardId)&&(active===section.ownerDocument.body||active===origin)){
    section.querySelector<HTMLElement>(`[data-ti002-placed="${state.lastPlacedCardId}"]`)?.focus();
   }
  }
  if(section&&previous.current.outcome==='correct-feedback'&&state.outcome==='ready'&&active?.matches('[data-ti002-placed]')&&section.contains(active)){
   section.querySelector<HTMLButtonElement>('[data-ti002-card]:not(:disabled)')?.focus();
  }
  previous.current=state;if(disabled)drag.current=null;
 },[state,disabled]);
 const definition=(id:number)=>{
  const links=TI002_DEFINITION_LINKS[id]??[],value=text(id).text;
  if(!onKeyTerm)return <span data-ti002-source-text={id} data-lesson-text-block={`text-${id}`}>{value}</span>;
  const pattern=new RegExp('('+links.map(link=>link.text).join('|')+')','g');
  return <span data-ti002-source-text={id} data-lesson-text-block={`text-${id}`}>{value.split(pattern).map((part,i)=>{
   const link=links.find(link=>link.text===part);
   return link?<button key={i} type="button" className="ti002-keyterm" data-ti002-keyterm-button={link.button} aria-disabled={paused} onClick={e=>{if(!paused)onKeyTerm(link.button,e.currentTarget);}}>{part}</button>:<React.Fragment key={i}>{part}</React.Fragment>;
  })}</span>;
 };
 const sourceSpan=(id:number,blockId=`text-${id}`)=><span data-ti002-source-text={id} data-lesson-text-block={blockId}>{text(id).text}</span>;
 return <section ref={root} onFocusCapture={event=>{focused.current=event.target as HTMLElement;}} className="ti002-question" data-ti002-outcome={state.outcome} lang="en">
  <style>{`.ti002-question{font-family:var(--lesson-font-body,system-ui,sans-serif);color:#16364a;min-width:0;display:grid;grid-template-columns:minmax(0,1fr);container-type:inline-size;gap:1rem}.ti002-question h2{font-size:1.75rem;line-height:1.3;margin:0}.ti002-question p{font-size:1.125rem;line-height:1.6;margin:0}.ti002-terms{display:flex;flex-wrap:wrap;gap:.75rem}.ti002-question button{font:inherit;font-size:1.125rem;line-height:1.5;min-height:44px;padding:.65rem;border:2px solid #526f86;border-radius:.6rem;background:white;color:inherit;overflow-wrap:anywhere}.ti002-question button:focus-visible,.ti002-question .ti002-placed:focus-visible{outline:3px solid #005a9c;outline-offset:3px}.ti002-question button[aria-pressed=true]{background:#e4f3ff;outline:3px solid #005a9c}.ti002-question [data-ti002-card]{touch-action:none}.ti002-row{border:1px solid #718399;border-radius:.75rem;padding:1rem;display:grid;grid-template-columns:minmax(8rem,1fr) minmax(10rem,2fr) minmax(12rem,3fr);gap:1rem;align-items:center}.ti002-row>*{min-width:0}.ti002-cell-label{display:block;font-weight:700;font-size:1rem;line-height:1.5;margin-bottom:.5rem}.ti002-definition{font-size:1.125rem;line-height:1.6;overflow-wrap:anywhere}.ti002-question .ti002-keyterm{padding:.1rem .25rem;color:#005a9c;text-decoration:underline;text-underline-offset:.15em}.ti002-placed{font-size:1.125rem;font-weight:700;line-height:1.5}.ti002-picture-preview{max-width:100%;overflow:hidden}.ti002-feedback{padding:1rem;border:2px solid #526f86;border-radius:.75rem}@media(min-width:768px){.ti002-question p,.ti002-definition{font-size:1.25rem}.ti002-question .ti002-keyterm{font-size:inherit;line-height:inherit}}@media(max-width:800px){.ti002-row{grid-template-columns:minmax(0,1fr)}}@container(max-width:38rem){.ti002-question .ti002-row{grid-template-columns:minmax(0,1fr)}}`}</style>
  <h2>{sourceSpan(54)}</h2><p><span style={{marginRight:".5em",fontWeight:700}}>{sourceSpan(59)}</span>{' '}{sourceSpan(56)}</p>
  <div className="ti002-terms" aria-label={text(61).text}>{cards.filter(c=>state.placements[c.id]===null).map(card=><button key={card.id} type="button" data-ti002-card={card.id} disabled={disabled} aria-pressed={state.selectedCardId===card.id}
   onClick={()=>{if(suppress.current===card.id){suppress.current=null;return;}if(!disabled)dispatch({type:'select-card',cardId:card.id});}}
   onPointerDown={e=>{if(disabled||e.button!==0)return;drag.current={id:card.id,x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}}
   onPointerCancel={()=>{drag.current=null;}}
   onPointerUp={e=>{const g=drag.current;drag.current=null;if(!g||disabled||Math.hypot(e.clientX-g.x,e.clientY-g.y)<6)return;suppress.current=g.id;const hit=e.currentTarget.ownerDocument.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('[data-ti002-target]');const target=cards.find(c=>c.targetId===hit?.dataset.ti002Target);if(target&&hit&&root.current?.contains(hit)&&!hit.matches(':disabled'))dispatch({type:'drop-card',cardId:g.id,targetId:target.targetId});}}>{sourceSpan(termIds[card.id])}</button>)}</div>
  {rows.map(card=><div className="ti002-row" key={card.id} data-ti002-row={card.id}>
   <div><span className="ti002-cell-label">{sourceSpan(61)}</span>{state.placements[card.id]?<span className="ti002-placed" tabIndex={-1} data-ti002-placed={card.id}>{sourceSpan(termIds[card.id])}</span>:<button type="button" data-ti002-target={card.targetId} disabled={disabled} aria-label={`Match selected key term to: ${text(definitionIds[card.id]).text}`} onClick={()=>{if(!disabled)dispatch({type:'drop-card',targetId:card.targetId});}}>—</button>}</div>
   <div className="ti002-definition"><span className="ti002-cell-label">{sourceSpan(62)}</span>{definition(definitionIds[card.id])}</div>
   <div><span className="ti002-cell-label">{sourceSpan(63)}</span><div className="ti002-picture-preview">{pictures[card.id]}</div><button type="button" data-ti002-picture-button={pictureButtons[card.id]} disabled={paused} onClick={e=>onPictureOpen(pictureButtons[card.id],e.currentTarget)}>{sourceSpan(64)}</button></div>
  </div>)}
  {state.outcome==='wrong'&&<div className="ti002-feedback" role="status"><p>{sourceSpan(266)}</p><button ref={close} type="button" disabled={paused} onClick={()=>dispatch({type:'close-wrong'})}>{sourceSpan(148,'wrong-close')}</button></div>}
 </section>;
}
