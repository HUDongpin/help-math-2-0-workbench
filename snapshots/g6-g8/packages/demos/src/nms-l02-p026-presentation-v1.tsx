'use client';
import React,{useEffect,useRef}from'react';import type{P026State}from'./nms-l02-p026-state-v1';import{p026SourceTeaching,p026SourcePoses}from'./nms-l02-p026-source-query-v1';import{P026SourceArt,P026Fraction}from'./nms-l02-p026-artwork-v1';import'./nms-l02-p026-v1.css';
import{p026LiveFrame}from'./nms-l02-p026-timeline-v1';
import{p026TextSnapshot}from'./nms-l02-p026-text-v1';
export type P026TermKey='Fraction'|'Equivalent fraction';
const demoNumbers=[[1,4],[1,8],[1,2],[2,3]]as const;const demoPictures=[{n:3,d:6,shape:32},{n:4,d:6,shape:52},{n:3,d:4,shape:54},{n:1,d:8,shape:56}]as const;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
function pos(col:number,row:number,alpha=1,scale=1):React.CSSProperties{return{'--col':col,'--row':row,opacity:alpha,'--card-scale':Math.min(1.12,scale)}as React.CSSProperties;}
export interface P026PresentationProps{readonly state:P026State;readonly language:'en'|'es';readonly paused:boolean;readonly reducedMotion?:boolean;readonly onChoose:(id:number)=>void;readonly onTerm?:(key:P026TermKey,trigger:HTMLButtonElement)=>void;}
export function NmsL2P026Presentation({state:s,language:l,paused,reducedMotion=false,onChoose,onTerm}:P026PresentationProps){
 const t=p026SourceTeaching(s.mainFrame),root=useRef<HTMLElement|null>(null),focusOwned=useRef(false),interactive=s.phase==='ready'||s.phase==='second',keys:Readonly<Record<number,P026TermKey>>={1:'Fraction',4:'Equivalent fraction'};
 useEffect(()=>{if(!interactive||!focusOwned.current||document.activeElement!==document.body)return;root.current?.querySelector<HTMLButtonElement>('[data-p026-card][aria-disabled="false"]')?.focus({preventScroll:true});},[interactive,s.cards]);
 const alpha=t.boardComposite?.alpha??0;
 const half=t.selectedHalf,blue=t.blueThreeSixths;
 const halfProgress=half?clamp((half.matrix[5]!+16.1)/(129.85+16.1)):0,blueProgress=blue?clamp((blue.matrix[5]!+145.1)/(130+145.1)):0;
 const progress=(v:number)=>reducedMotion?(v>=1?1:0):v;
 const answer=p026SourcePoses('sprite-10',s.answerFrame),eq=answer.find(p=>p.characterId===6),question=answer.some(p=>p.characterId===9);
 const status=s.phase==='returning'?(l==='es'?'Las tarjetas vuelven a su lugar.':'The cards return to their places.'):s.phase==='second'?(l==='es'?'Elige la tarjeta equivalente.':'Choose the equivalent card.'):s.phase==='completed'?(l==='es'?'Actividad completada.':'Activity complete.'):s.phase==='ready'?(l==='es'?'Elige una tarjeta.':'Choose a card.') :'';
 const snapshot=p026TextSnapshot(p026LiveFrame(s,l));
 if(snapshot.status!=='ready')return <p role="alert">{l==='es'?'La página no está disponible.':'The page is unavailable.'}</p>;
 return <section data-p026-text-status={snapshot.status} ref={root} className="nms-l02-p026 lesson-text-presentation" data-p026-main-frame={s.mainFrame} data-p026-phase={s.phase} data-p026-round={s.round} data-p026-matches={s.matches} data-p026-answer-frame={s.answerFrame} data-p026-replay={s.replay} onBlurCapture={e=>{if(e.relatedTarget&&!root.current?.contains(e.relatedTarget as Node))focusOwned.current=false;}}>
  <header lang="en"><p data-lesson-text-block="course-title">Fractions, Decimals &amp; Percents Concepts</p><h2 data-lesson-text-block="activity-title">Instruction</h2></header>
  {l==='es'&&<p className="nms-l02-p026__fallback" lang="es">Esta página conserva el texto y el audio originales en inglés. Las definiciones de los términos están disponibles en español.</p>}
  <p data-lesson-text-block="instruction" className="nms-l02-p026__instruction" lang="en" aria-hidden={t.instructionAlpha===0} style={{opacity:t.instructionAlpha}}>{t.instructionRuns.map((r,i)=>{const key=keys[i];const parts=/^(\s*)(.*?)(\s*)$/su.exec(r.visibleText)!;return key&&t.termAvailable[key]&&onTerm?<React.Fragment key={r.sourceTextId}>{parts[1]}<button type="button" className="nms-l02-p026__term" data-source-key-attribute={key} onClick={e=>onTerm(key,e.currentTarget)}>{parts[2]}</button>{parts[3]}</React.Fragment>:<span key={r.sourceTextId}>{r.visibleText}</span>})}</p>
  <div className="nms-l02-p026__stage" aria-label={l==='es'?'Tarjetas de fracciones y balanza':'Fraction cards and balance scale'}>
   {s.phase==='intro'?<>
    {demoNumbers.map(([n,d],i)=>{const selected=i===2&&half,card=t.numberCards.find(c=>c.numerator===n&&c.denominator===d);if(!selected&&!card)return null;const a=selected?half.alpha:card!.denominatorPose.alpha;if(a<=0)return null;return <div key={'n'+i} className="nms-l02-p026__card nms-l02-p026__number" data-lesson-text-block="number-cards" data-p026-demo-number={`${n}/${d}`} style={pos(0,selected?2+2*progress(halfProgress):i,a,selected&&!reducedMotion?half.matrix[0]:1)}><P026Fraction n={n} d={d}/></div>})}
    {demoPictures.map((p,i)=>{if(i===0&&s.mainFrame>=100&&!blue)return null;const a=i===0&&blue?blue.alpha:alpha;if(a<=0)return null;return <div key={'p'+i} className="nms-l02-p026__card" data-p026-demo-picture={`${p.n}/${p.d}`} style={pos(1,i===0&&blue?4*progress(blueProgress):i,a,i===0&&blue&&!reducedMotion?blue.matrix[0]:1)}><P026SourceArt shape={p.shape}/></div>})}
   </>:s.cards.filter(c=>!c.removed).map(c=>{const homeCol=Math.floor((c.id-1)/4),homeRow=(c.id-1)%4,side=c.id===s.first?0:c.id===s.second?1:-1;let col=homeCol,row=homeRow;if(side>=0){const moving=(s.phase==='moving-first'&&side===0)||(s.phase==='moving-second'&&side===1),returning=s.phase==='returning',time=clamp((s.motionTick-1)/20),q=reducedMotion?(time>=1?1:0):time*(2-time);if(moving){col=homeCol+(side-homeCol)*q;row=homeRow+(4-homeRow)*q;}else if(returning){col=side+(homeCol-side)*q;row=4+(homeRow-4)*q;}else{col=side;row=4;}}const enabled=!paused&&interactive&&c.id!==s.first;return <button type="button" key={c.id} className={'nms-l02-p026__card'+(c.kind==='number'?' nms-l02-p026__number':'')} data-p026-card={c.id} data-p026-pair={c.pairId} data-lesson-text-block={c.kind==='number'?'number-cards':undefined} data-p026-kind={c.kind} aria-disabled={!enabled} tabIndex={enabled?0:-1} aria-label={c.kind==='number'?(l==='es'?`Fracción ${c.numerator}/${c.denominator}`:`Fraction ${c.numerator}/${c.denominator}`):(l==='es'?`Círculo: ${c.numerator} de ${c.denominator} partes iguales coloreadas`:`Circle: ${c.numerator} of ${c.denominator} equal parts colored`)} style={pos(col,row)} onFocus={()=>{focusOwned.current=true;}} onClick={()=>{if(enabled)onChoose(c.id)}}>{c.kind==='number'?<P026Fraction n={c.numerator} d={c.denominator}/>:<P026SourceArt shape={c.sourceShape}/>}</button>})}
   {s.phase==='intro'&&t.cursor&&t.cursor.alpha>0&&!reducedMotion&&<div className="nms-l02-p026__cursor" data-p026-cursor-shape={t.cursor.characterId} style={pos(s.mainFrame<229?0:1,s.mainFrame<229?(half?2+2*halfProgress:2):(blue?4*blueProgress:0),t.cursor.alpha)}><P026SourceArt shape={t.cursor.characterId}/></div>}
   <div className="nms-l02-p026__balance"><P026SourceArt shape={4}/></div>
   {((s.phase==='intro'&&t.equalityAlpha>0)||eq)&&<span data-lesson-text-block="equality" className="nms-l02-p026__equals" style={{opacity:s.phase==='intro'?t.equalityAlpha:eq!.color[3]}}>=</span>}
   {s.phase!=='intro'&&question&&<span data-lesson-text-block="question" className="nms-l02-p026__question">?</span>}
  </div>
  <p className="nms-l02-p026__status" role="status" aria-live="polite">{status}</p>
 </section>;
}
