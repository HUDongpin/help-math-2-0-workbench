"use client";
import {useId,type ReactNode} from 'react';
import type {AnimationRendererProps} from './contract';
import {LessonAnimationTitleV1} from './lesson-animation-title-v1';
import {ALG_L10_P004_SOURCE as SOURCE,algL10P004Frame,algL10P004MaskPolygon,algL10P004MorphPaths,type AlgL10P004Frame,type AlgL10P004Placement,type AlgL10P004Owner} from './alg-l10-p004-state-v1';
import './alg-l10-p004-v1.css';
const safeId=(value:string)=>value.replace(/[^a-zA-Z0-9_-]/g,'_');
const transform=(n:AlgL10P004Placement)=>`matrix(${n.matrix.join(' ')})`;
const points=(n:AlgL10P004Placement)=>algL10P004MaskPolygon(n).map(p=>p.join(',')).join(' ');
function Scene({nodes,state,path,onOpenGlossary}:{nodes:readonly AlgL10P004Placement[];state:AlgL10P004Frame;path:string;onOpenGlossary?:(owner:AlgL10P004Owner)=>void}){
 const masks=nodes.filter(n=>n.clipDepth!==null&&n.clipDepth>n.depth),maskId=(n:AlgL10P004Placement)=>safeId(`${path}-${n.instanceId}`);
 return <><defs>{masks.map(n=><clipPath key={n.instanceId} id={maskId(n)} clipPathUnits="userSpaceOnUse"><polygon points={points(n)} transform={transform(n)} clipRule="evenodd"/></clipPath>)}</defs>
 {nodes.filter(n=>n.clipDepth===null).map(n=>{const inline=SOURCE.inlineShapes[n.characterId],shape=SOURCE.shapes[n.characterId],text=SOURCE.texts[n.characterId],morph=SOURCE.morphs[n.characterId],button=SOURCE.buttons[n.characterId];let content:ReactNode;
 if(n.characterId===60)content=<Scene nodes={state.main} state={state} path={`${path}-main`} onOpenGlossary={onOpenGlossary}/>;
 else if(inline)content=inline.paths.map((p,i)=><path key={i} d={p.d} {...p.paint} data-source-inline-character={n.characterId} data-source-inline-role={inline.role} data-source-stroke-width-twips={inline.sourceStrokeWidthTwips} data-display-stroke-width={inline.displayStrokeWidth}/>);
 else if(shape)content=<image href={`${SOURCE.assetRoot}/${n.characterId}.svg?sha256=${shape.sha256}`} x={shape.x} y={shape.y} width={shape.width} height={shape.height} preserveAspectRatio="none"/>;
 else if(text)content=text.runs.map((r,i)=><text key={i} x={r.x} y={r.y} fontSize={r.size} textLength={r.advance} lengthAdjust="spacingAndGlyphs" fill={`rgb(${r.color.slice(0,3).join(' ')})`} fillOpacity={r.color[3]/255} xmlSpace="preserve" aria-hidden="true">{r.text}</text>);
 else if(morph)content=algL10P004MorphPaths(n.characterId,n.ratio).map((p,i)=><path key={i} d={p.d} {...p.paint}/>);
 else if(button){const owner=state.owners.find(o=>o.instanceId===n.instanceId&&o.characterId===n.characterId),hit=SOURCE.masks[button.hitShape];content=owner&&onOpenGlossary?<polygon className="alg-l10-p004__hit" points={hit.start.map(p=>p.join(',')).join(' ')} fill="transparent" pointerEvents="all" role="button" tabIndex={0} aria-label={button.entry.labels[state.language]} onClick={()=>onOpenGlossary(owner)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onOpenGlossary(owner);}}}/>:null;}
 else throw Error('ALG_L10_P004_UNKNOWN_CHARACTER');
 let placed:ReactNode=<g transform={transform(n)} opacity={n.alpha} data-source-character={n.characterId} data-source-instance={n.instanceId} data-source-ratio={n.ratio}>{content}</g>;
 for(const m of masks.filter(m=>n.depth>m.depth&&n.depth<=m.clipDepth!))placed=<g clipPath={`url(#${maskId(m)})`}>{placed}</g>;
 return <g key={n.instanceId}>{placed}</g>;})}</>;
}
export function AlgL10P004Presentation({state,onOpenGlossary,glossary,onCloseGlossary}:{state:AlgL10P004Frame;onOpenGlossary?:(owner:AlgL10P004Owner)=>void;glossary?:AlgL10P004Owner|null;onCloseGlossary?:()=>void}){
 const id=useId(),nodes=state.root.filter(n=>!SOURCE.titleSuppression.rootDepths.includes(n.depth));
 const owner=glossary&&state.owners.find(o=>o.instanceId===glossary.instanceId&&o.characterId===glossary.characterId&&o.term===glossary.term&&o.frame===glossary.frame&&o.replay===glossary.replay&&o.seed===glossary.seed),entry=owner?SOURCE.buttons[owner.characterId].entry:null;
 const reading=state.readingTexts.filter((t,i,a)=>a.findIndex(z=>z.text===t.text)===i);
 return <section className="alg-l10-p004" data-animation-id={state.animationId} data-flash-animation-id={state.animationId} data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame} data-flash-language={state.language} data-flash-seed={state.seed} data-flash-replay={state.replay} data-source-text-ids={state.sourceTextIds.join(',')} data-source-swf-sha256={SOURCE.sourceSha256} data-visual-language="en" data-visual-language-fallback={state.visualLanguageFallback?'source-en':undefined}>
 {state.mainFrame!==null&&<LessonAnimationTitleV1 courseTitle={SOURCE.courseTitle} activityTitle={SOURCE.activityTitle} language="en"/>}
 <svg className="alg-l10-p004__scene" viewBox="0 0 800 600" style={{background:SOURCE.backgroundColor}} aria-hidden={onOpenGlossary?undefined:true} aria-label={onOpenGlossary?state.title:undefined}><Scene nodes={nodes} state={state} path={id} onOpenGlossary={onOpenGlossary}/></svg>
 {reading.length>0&&<div className="alg-l10-p004__reading" lang="en">{reading.map(t=><p key={t.characterId} data-lesson-text-block={`source-text-${t.characterId}`} data-source-text-id={`character-${t.characterId}`}>{t.text}</p>)}</div>}
 {entry&&<section className="alg-l10-p004__glossary" lang={state.language} aria-labelledby={`${safeId(id)}-term`} data-glossary-owner={owner!.instanceId}><h3 id={`${safeId(id)}-term`}>{entry.labels[state.language]}</h3><p>{entry.definitions[state.language]}</p>{onCloseGlossary&&<button type="button" onClick={onCloseGlossary}>{state.language==='es'?'Cerrar':'Close'}</button>}</section>}
 </section>;
}
export function AlgL10P004Renderer(props:AnimationRendererProps){return <AlgL10P004Presentation state={algL10P004Frame(props.frame,{...props,frame:props.frame})}/>;}
