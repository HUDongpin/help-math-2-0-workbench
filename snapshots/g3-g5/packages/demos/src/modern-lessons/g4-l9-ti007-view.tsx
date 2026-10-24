'use client';
import React,{useEffect,useLayoutEffect,useRef,useState}from'react';
import type{AnimationRendererProps}from'../contract';
import type{TextPresentationSnapshot}from'../lesson-text-contract';
import{LessonSourceButton}from'../lesson-source-button';
import{numberLineValue as at}from'./g4-l4-number-line';
import{observeEstimatedChild,type EstimatedPairConfig,type EstimatedPairState,type EstimatedPairAction}from'./g4-l4-estimated-pair';
export type Ti007Config=EstimatedPairConfig&{readonly hint:{readonly character:number;readonly viewBox:readonly number[];readonly visibleFrames:readonly number[];readonly sourceInstance:string}};
type Placement=NonNullable<EstimatedPairConfig['scene']['geometry'][number]['states'][number][1]>;
const allActivities=(r:AnimationRendererProps)=>r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]);
const CSS=`
.estimated-pair{box-sizing:border-box;inline-size:100%;min-inline-size:0;background:#fffdf7;color:#17273c;padding:.75rem;font:1.25rem/1.6 var(--lesson-font-body,system-ui,sans-serif)}
.estimated-pair *{box-sizing:border-box}.estimated-pair h2{font:700 1.5em/1.35 var(--lesson-font-display,system-ui,sans-serif);overflow-wrap:normal;word-break:normal;hyphens:none;margin:0 0 .5em}.estimated-pair p{margin:.6em 0}
.estimated-pair button{font:inherit;cursor:pointer}.estimated-pair button:disabled{cursor:default}.estimated-pair button:focus-visible,.estimated-pair [tabindex]:focus-visible{outline:3px solid #1556a0;outline-offset:3px}
.estimated-pair__term{display:inline;border:0;padding:0;margin:0;background:transparent;color:#064fb3;text-decoration:underline;text-underline-offset:.15em;line-height:inherit}
.estimated-pair__port{max-inline-size:100%;overflow-x:auto;padding:.6rem .3rem;overscroll-behavior-inline:contain}.estimated-pair__figure{position:relative;font-size:1.125rem;line-height:1.15;margin-inline:auto}
.estimated-pair__geometry{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.estimated-pair__label{position:absolute;transform:translate(-50%,-50%);white-space:pre;line-height:1.3;font-variant-numeric:tabular-nums;pointer-events:none}
[data-modern-text-page="course-g04-l09-ti-007"] [data-lesson-text-block="description-96"],[data-modern-text-page="course-g04-l09-ti-007"] [data-lesson-text-block="description-97"],[data-modern-text-page="course-g04-l09-ti-007"] [data-lesson-text-block="description-98"],[data-modern-text-page="course-g04-l09-ti-007"] [data-lesson-text-block="description-99"]{font-size:1.25rem}
.estimated-pair__header{white-space:normal;text-align:center;max-inline-size:10em;font-weight:650}.estimated-pair__tile{position:absolute;border:2px solid transparent;border-radius:.35rem;background:transparent;min-width:44px;min-height:44px;padding:0;touch-action:none;line-height:1.2;font-variant-numeric:tabular-nums}
.estimated-pair__tile{color:#17273c}.estimated-pair__tile:disabled{pointer-events:none;color:#17273c;opacity:1;-webkit-text-fill-color:#17273c}.estimated-pair__tile[aria-pressed=true]{outline:3px solid #1556a0;outline-offset:3px;background:rgba(21,86,160,.08)}.estimated-pair__target:enabled{border:2px dashed #285e7f}.estimated-pair__target:enabled:hover{background:rgba(255,255,255,.35)}
.estimated-pair__action{border:1px solid #1556a0;border-radius:.35rem;background:#1556a0;color:white;padding:.4em .8em;min-width:44px;min-height:44px}
.estimated-pair__feedback{border:2px solid #9a5c28;border-radius:.5rem;padding:1rem;background:#fff4e2}.estimated-pair__final{border-color:#2b6c43;background:#edf8ef}.estimated-pair__help{border:2px solid #51759d;border-radius:.5rem;padding:1rem;background:#fff}.estimated-pair__help-controls{display:flex;justify-content:flex-end}
[data-modern-text-page="course-g04-l09-ti-007"] .estimated-pair__help .estimated-pair__term{max-inline-size:100%;white-space:normal;overflow-wrap:normal;word-break:normal;hyphens:none}
.estimated-pair__help-port{max-width:100%;overflow-x:auto}.estimated-pair__math{display:grid;grid-template-columns:4.3ch 1.5ch 4.3ch 1.5ch 4.3ch;column-gap:.15em;min-width:max-content;font-size:1.3rem;line-height:1.5;margin:.4em 0;font-variant-numeric:tabular-nums;text-align:center}.estimated-pair__math-row{display:contents}.estimated-pair__arrow{height:2.2em;width:1em;justify-self:center}.estimated-pair__hint{font-size:1rem}.estimated-pair__badge{display:inline-block;background:#17273c;color:#fff;padding:.1em .5em;border-radius:50%;margin-inline-end:.5em}
.estimated-pair [data-source-alpha]{transition:none!important}@media(max-width:480px){.estimated-pair{padding-inline:0}.estimated-pair h2{font-size:1.75rem}.estimated-pair__help{padding:.6rem .25rem}}
[data-modern-text-page="course-g04-l09-ti-007"] .estimated-pair__help button{scroll-margin-block:8px;scroll-margin-block-start:calc(var(--lesson-platform-header-offset,0px) + 8px);}
`;
export function Ti007Scene({c,r,s,snapshot,onAction}:{c:Ti007Config;r:AnimationRendererProps;s:EstimatedPairState&{readonly sourceFinalControlsEnabled?:boolean};snapshot:TextPresentationSnapshot;onAction:(a:EstimatedPairAction)=>void}) {
 const root=useRef<HTMLElement>(null),port=useRef<HTMLDivElement>(null),manual=useRef(false),wasWrong=useRef(false),lastFocus=useRef<string|null>(null);
 const drag=useRef<{id:string;pointer:number;x:number;y:number;moved:boolean}|null>(null),suppressClick=useRef<string|null>(null);
 const [offset,setOffset]=useState<{id:string;x:number;y:number}|null>(null);
 const [minX,minY,width,height]=c.layout.bounds,px=(x:number)=>(x-minX)/width*100+'%',py=(y:number)=>(y-minY)/height*100+'%';
 const targetBottom=(tile:Ti007Config['targets'][number])=>Math.min(tile.bounds[3],...c.targets.filter(t=>t.bounds[2]>tile.bounds[2]).map(t=>t.bounds[2]));
 const shortestTargetRow=Math.min(...c.targets.map(t=>targetBottom(t)-t.bounds[2]));
 const boardScale=Math.max(1,(44+2*2)*c.layout.unitsPerEm[1]/(18*shortestTargetRow));
 const rect=(b:readonly number[])=>({left:px(b[0]),top:py(b[2]),width:(b[1]-b[0])/width*100+'%',height:(b[3]-b[2])/height*100+'%'});
 const visible=(id:string)=>snapshot.blocks.some(b=>b.id===id&&b.visible),text=(id:string)=>c.blocks.find(b=>b.id===id)?.text??'';
 const enabled=r.frame===c.holdFrame&&!r.paused&&(s.phase==='idle'||s.phase==='final'&&s.sourceFinalControlsEnabled)&&!s.wrongOpen&&!s.helpOpen&&Boolean(r.onLessonActivityRequest&&r.onLessonFrameRequest&&r.onLessonActivitiesRequest);
 const helpEnabled=r.frame===c.holdFrame&&!r.paused&&!s.wrongOpen&&!s.helpOpen&&['idle','final'].includes(s.phase)&&Boolean(r.onLessonButtonActivityRequest);
 useLayoutEffect(()=>{manual.current=false;},[r.replay]);
 useLayoutEffect(()=>{
  const p=port.current;if(!p||s.helpOpen)return;
  const center=()=>{if(manual.current)return;const fig=p.firstElementChild as HTMLElement|null;if(fig){const f=fig.getBoundingClientRect(),v=p.getBoundingClientRect();p.scrollLeft+=f.left+(c.layout.initialFocusX-minX)/width*fig.clientWidth-v.left-p.clientWidth/2;}};
  center();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(center);observer?.observe(p);return()=>observer?.disconnect();
 },[r.replay,s.helpOpen]);
 useLayoutEffect(()=>{
  const focus=s.helpOpen?'help':s.wrongOpen?'wrong-close':s.focus;
  if(focus&&(focus!==lastFocus.current||s.wrongOpen&&!wasWrong.current)){
   const target=root.current?.querySelector<HTMLElement>(`[data-estimated-focus="${focus}"]`);
   if(target){target.focus();lastFocus.current=focus;}
  }else if(!focus)lastFocus.current=null;
  wasWrong.current=s.wrongOpen;
 },[s.helpOpen,s.wrongOpen,s.focus,s.phase,visible('final'),r.frame===c.frameCount]);
 useEffect(()=>{if(r.paused||r.frame!==c.holdFrame||s.helpOpen||s.wrongOpen){drag.current=null;setOffset(null);}},[r.paused,r.frame,s.helpOpen,s.wrongOpen]);
 useEffect(()=>()=>{drag.current=null;},[r.seed,r.replay]);
 const draw=(character:number)=>c.scene.shapes.find(shape=>shape.character===character)!.paths.map((path,i)=><path key={i} d={path.d} fill={path.fill} stroke={path.stroke} strokeWidth={path.width} strokeLinecap="round" strokeLinejoin="round"/>);
 const shape=(item:Placement,key:string)=>item.alpha<=0?null:<g key={key} opacity={item.alpha} transform={`matrix(${item.matrix.join(' ')})`} data-source-shape={item.character}>{draw(item.character)}</g>;
 const glossary=(label:string,entryId:string|null,scope:string,color?:string)=>{
  if(!entryId)return label;
  const term=c.terms.find(t=>t.entryId===entryId&&t.scope===scope);if(!term)return label;
  const available=term.activeFrames.some(([first,last])=>r.frame>=first&&r.frame<last);
  return <>{label.match(/^\s*/)?.[0]}<button type="button" className="estimated-pair__term" style={{color}} data-source-keyterm={term.key} data-source-button={term.button} data-keyterm-entry-id={entryId}
   disabled={!available||!r.onLessonHostRequest} onClick={event=>r.onLessonHostRequest?.({type:'open-keyterm',entryId,sourceAnimationId:c.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget,keyTermIndexLanguage:'en'})}>{label.trim()}</button>{label.match(/\s*$/)?.[0]}</>;
 };
 const scrollKeys=(event:React.KeyboardEvent<HTMLDivElement>)=>{
  if(event.target!==event.currentTarget||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();manual.current=true;const p=event.currentTarget;p.scrollLeft=event.key==='Home'?0:event.key==='End'?p.scrollWidth:p.scrollLeft+(event.key==='ArrowRight'?1:-1)*44;
 };
 const release=(event:React.PointerEvent<HTMLButtonElement>)=>{
  const current=drag.current;if(!current||current.pointer!==event.pointerId)return;drag.current=null;setOffset(null);
  if(!current.moved)return;suppressClick.current=current.id;
  const target=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>('[data-estimated-target]');
  const id=target&&root.current?.contains(target)?target.dataset.estimatedTarget??null:null;
  onAction({type:'drop',card:current.id,target:id});
 };
 const cursor=at(c.scene.cursor,r.frame,null),hint=observeEstimatedChild(c,s,'own032-hint',allActivities(r)),hintFrame=hint?.frame??1,hintVisible=r.frame===c.holdFrame&&c.hint.visibleFrames.includes(hintFrame);
 const ownStyle=c.cards.map(card=>`[data-modern-text-page="${c.animationId}"] [data-estimated-card="${card.id}"]{border:0;padding-block-end:max(0px,calc(44px - ${(card.bounds[3]-card.bounds[2])*boardScale/c.layout.unitsPerEm[1]}em))}`).join('');
 return <section ref={root} className="estimated-pair" lang="en" data-modern-text-page={c.animationId} data-lesson-frame={r.frame} data-lesson-replay={r.replay??0} data-flash-frame-domain={c.frameDomain} data-flash-root-frame="6"
  data-estimated-phase={s.phase} data-source-final-controls-enabled={s.sourceFinalControlsEnabled?'true':'false'} data-estimated-placed={s.placed.join(',')} data-estimated-selected={s.selected??''} data-estimated-wrong={s.wrongOpen?'open':'closed'} data-estimated-help={s.helpOpen?'open':'closed'} data-estimated-attempts={s.attempts} data-estimated-activities={JSON.stringify(allActivities(r).map(({id,sourceInstanceId,frameDomain,frame,status,revision,cancellationToken})=>({id,sourceInstanceId,frameDomain,frame,status,revision,cancellationToken})))}>
  <style>{CSS+ownStyle+`.ti007__help-wrap{position:relative;display:inline-block}.ti007__hint{position:absolute;inset:-.25rem;inline-size:calc(100% + .5rem);block-size:calc(100% + .5rem);pointer-events:none}[data-modern-text-page="course-g04-l09-ti-007"] .estimated-pair__term{min-block-size:44px;white-space:nowrap}`}</style><h2 data-lesson-text-block="title">{text('title')}</h2>
  <div hidden={s.helpOpen}>
   {c.prompts.map(p=><p key={p.character} style={p.exercise?{visibility:p.tokens.some(t=>at(t.alpha,r.frame,0)>0)?'visible':'hidden'}:undefined} className={p.exercise?'estimated-pair__badge':undefined}>{p.tokens.map(token=>{
    const alpha=at(token.alpha,r.frame,0),color=at(token.color,r.frame,'#17273c');
    return <span key={token.id} data-lesson-text-block={token.id} data-source-alpha={alpha} aria-hidden={alpha<=0} style={{visibility:alpha>0?'visible':'hidden',opacity:alpha,color}}>{glossary(token.text,token.entryId,'prompt',color)}</span>;
   })}</p>)}
   {r.frame===c.holdFrame&&<p className="estimated-pair__hint">Select an answer, then select a box. You can also drag the answers.</p>}
   {s.wrongOpen&&<div className="estimated-pair__feedback" role="region" aria-label="Try again"><p data-lesson-text-block="wrong">{text('wrong')}</p><LessonSourceButton runtime={r} activityId="estimated-wrong-close" className="estimated-pair__action" type="button" disabled={!!r.paused} data-estimated-focus="wrong-close" data-lesson-text-block="close" onClick={()=>onAction({type:'close-wrong'})}>{text('close')}</LessonSourceButton></div>}
   {visible('final')&&<div className="estimated-pair__feedback estimated-pair__final" role="status" tabIndex={-1} data-estimated-focus="final"><strong data-lesson-text-block="final">{text('final')}</strong></div>}
   <div ref={port} className="estimated-pair__port" role="region" aria-label={c.figureLabel??"Problems with estimated sum and estimated difference drop areas"} tabIndex={0} onKeyDown={scrollKeys} onPointerDown={()=>{manual.current=true;}} onWheel={()=>{manual.current=true;}}>
    <div className="estimated-pair__figure" style={{width:width*boardScale/c.layout.unitsPerEm[0]+'em',height:height*boardScale/c.layout.unitsPerEm[1]+'em'}}>
     {c.scene.geometry.map(track=>{const item=at(track.states,r.frame,null);return item&&<svg key={track.id} className="estimated-pair__geometry" viewBox={c.layout.bounds.join(' ')} preserveAspectRatio="none" aria-hidden="true" focusable="false" style={{zIndex:item.depth}}>{shape(item,track.id)}</svg>;})}
     {c.scene.labels.map(track=>{const item=at(track.states,r.frame,null);if(!item||item.alpha<=0)return null;const header=c.scene.headerCharacters.includes(item.character);return <span key={track.id} className={'estimated-pair__label'+(header?' estimated-pair__header':'')} data-lesson-text-block={track.id} data-source-alpha={item.alpha} data-source-character={item.character} style={{left:px(item.position[0]),top:py(item.position[1]),opacity:item.alpha,color:item.color,zIndex:item.depth,width:header?text(track.id).startsWith('Estimated')?'7em':'max-content':undefined}}>{text(track.id)}</span>;})}
     {cursor&&cursor.alpha>0&&c.scene.cursorSource&&<svg className="estimated-pair__geometry" viewBox={c.layout.bounds.join(' ')} preserveAspectRatio="none" aria-hidden="true" focusable="false" style={{zIndex:cursor.depth}} data-source-cursor="32" data-source-alpha={cursor.alpha}><g transform={`matrix(${cursor.matrix.join(' ')})`} opacity={cursor.alpha}><image href={c.scene.cursorSource} x={c.scene.cursorBounds[0]} y={c.scene.cursorBounds[1]} width={c.scene.cursorBounds[2]} height={c.scene.cursorBounds[3]}/></g></svg>}
     {c.targets.filter(t=>r.frame>=t.lifetime.firstFrame&&r.frame<t.lifetime.lastFrameExclusive).map(tile=>{
      const revealed=visible(tile.block),hitBounds=[tile.bounds[0],tile.bounds[1],tile.bounds[2],targetBottom(tile)];return <React.Fragment key={tile.id}>
       {revealed&&<svg className="estimated-pair__geometry" viewBox={c.layout.bounds.join(' ')} preserveAspectRatio="none" aria-hidden="true" focusable="false" style={{zIndex:100}}>{tile.shapes.map((item,i)=>shape(item,tile.id+i))}</svg>}
       <button type="button" className="estimated-pair__tile estimated-pair__target" style={{...rect(hitBounds),zIndex:110}} data-estimated-target={tile.id} data-source-instance={tile.sourceInstance} data-estimated-revealed={revealed} disabled={!enabled||revealed&&!(s.phase==='final'&&s.sourceFinalControlsEnabled)} aria-label={`${tile.column} for ${tile.problem}${revealed?': '+tile.text:''}`} onClick={()=>onAction({type:'drop',target:tile.id})}>
        {revealed&&<span data-lesson-text-block={tile.block}>{tile.text}</span>}
       </button>
      </React.Fragment>;
     })}
     {c.cards.filter(tile=>visible(tile.block)).map(tile=>{
      const shift=offset?.id===tile.id?offset:null;
      return <React.Fragment key={tile.id}>
       {!shift&&<svg className="estimated-pair__geometry" viewBox={c.layout.bounds.join(' ')} preserveAspectRatio="none" aria-hidden="true" focusable="false" style={{zIndex:120}}>{tile.shapes.map((item,i)=>shape(item,tile.id+i))}</svg>}
       <button type="button" className="estimated-pair__tile" data-estimated-card={tile.id} data-estimated-focus={tile.id} data-source-instance={tile.sourceInstance} data-lesson-text-block={tile.block} aria-pressed={s.selected===tile.id} disabled={!enabled}
        style={{...rect(tile.bounds),zIndex:shift?150:130,transform:shift?`translate(${shift.x}px,${shift.y}px)`:undefined,background:shift?'white':undefined,pointerEvents:shift?'none':undefined}}
        onClick={event=>{if(suppressClick.current===tile.id&&event.detail>0){suppressClick.current=null;return;}suppressClick.current=null;onAction({type:'select',card:tile.id});}}
        onPointerDown={event=>{if(event.button!==0||!enabled)return;suppressClick.current=null;drag.current={id:tile.id,pointer:event.pointerId,x:event.clientX,y:event.clientY,moved:false};event.currentTarget.setPointerCapture(event.pointerId);}}
        onPointerMove={event=>{const d=drag.current;if(!d||d.pointer!==event.pointerId||!enabled)return;const x=event.clientX-d.x,y=event.clientY-d.y;if(!d.moved&&Math.hypot(x,y)<6)return;d.moved=true;setOffset({id:d.id,x,y});}}
        onPointerUp={release} onPointerCancel={()=>{drag.current=null;setOffset(null);}}>{tile.text}</button>
      </React.Fragment>;
     })}
    </div>
   </div>
   {c.help&&(r.frame===c.holdFrame||hintVisible)&&<span className="ti007__help-wrap" style={r.frame===c.holdFrame?undefined:{inlineSize:'8.5em',blockSize:'2.2em'}} data-source-hint-frame={hintFrame} data-source-hint-instance={c.hint.sourceInstance}>{r.frame===c.holdFrame&&<LessonSourceButton type="button" runtime={r} activityId="estimated-help-open" className="estimated-pair__action" disabled={!helpEnabled} data-estimated-focus="help-button" data-lesson-text-block="help-button" onClick={()=>onAction({type:'help',open:true})}>{text('help-button')}</LessonSourceButton>}{hintVisible&&<svg className="ti007__hint" viewBox={c.hint.viewBox.join(' ')} preserveAspectRatio="none" aria-hidden="true" data-source-shape={c.hint.character}>{draw(c.hint.character)}</svg>}</span>}
  </div>
  {s.helpOpen&&c.help&&<div className="estimated-pair__help" role="dialog" aria-modal="true" aria-label={text('help-button')} tabIndex={-1} data-estimated-focus="help" onKeyDown={event=>{
   if(event.key==='Escape'){event.preventDefault();onAction({type:'help',open:false});return;}
   if(event.key!=='Tab')return;const controls=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]'));if(!controls.length)return;
   const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&(document.activeElement===first||document.activeElement===event.currentTarget)){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }}>
   <div className="estimated-pair__help-controls"><LessonSourceButton type="button" runtime={r} activityId="estimated-help-close" className="estimated-pair__action" disabled={!!r.paused} data-lesson-text-block="close" onClick={()=>onAction({type:'help',open:false})}>{text('close')}</LessonSourceButton></div>
   {c.help.rows.slice(0,5).map(row=><p key={row.id} data-lesson-text-block={row.id}>{row.tokens.map((token,i)=><span key={i} style={{color:token.color}}>{glossary(token.text,token.entryId,'help')}</span>)}</p>)}
   <div role="table" aria-label="Solve an equation using inverse operations" style={{display:'grid',gridTemplateColumns:'minmax(0,1fr)',gap:'.7rem'}}>{c.help.rows.slice(5).map(row=>{const parts=row.tokens.map(t=>t.text).join('').split(/ {2,}/).map(t=>t.trim()).filter(Boolean);return <div key={row.id} role="row" data-lesson-text-block={row.id} style={{display:'flex',flexWrap:'wrap',minInlineSize:0,gap:'.75em',borderBlockEnd:'1px solid #789',paddingBlock:'.4em'}}><span role="cell" style={{minInlineSize:0,maxInlineSize:'100%',whiteSpace:'normal',overflowWrap:'normal',wordBreak:'normal',hyphens:'none'}}>{parts[0].split(/(\s+)/).map((part,i)=>/^\s+$/.test(part)?part:<span key={i} style={{whiteSpace:'nowrap'}}>{part}</span>)}</span>{' '}<span role="cell" style={{flex:'1 1 12em',minInlineSize:0}}>{parts.slice(1).join(' ')}</span></div>})}</div>
  </div>}
  {r.frame===c.frameCount&&s.phase==='continued'&&<button type="button" className="estimated-pair__action" disabled={!r.onReplay} data-estimated-focus="replay" onClick={r.onReplay}>Replay</button>}
 </section>;
}

