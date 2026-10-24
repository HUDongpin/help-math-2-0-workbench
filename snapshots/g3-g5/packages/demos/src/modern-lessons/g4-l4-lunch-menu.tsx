'use client';
import React, {useEffect,useState,type ReactNode} from 'react';
import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextPresentationCapability,TextPresentationSnapshot} from '../lesson-text-contract';
import {LessonCanvasPlane,type LessonCanvasPlaneAdapter} from '../lesson-canvas-plane';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {loadLunchActivityScene} from './g4-l4-lunch-activity';
import {getLunchMenuSnapshot,type LunchMenuConfig,type LunchMenuFrameReader} from './g4-l4-lunch-menu-state';

const NATIVE_STAGE=Object.freeze({width:800,height:600});
const STYLES=`
.lunch-menu{display:grid;gap:1.25rem;min-inline-size:0;max-inline-size:84rem;margin-inline:auto;color:#14213d;font-family:var(--lesson-text-font-body,system-ui,sans-serif)}
.lunch-menu h2{margin:0;overflow-wrap:anywhere;word-break:normal;hyphens:auto;letter-spacing:-.01em;font-weight:500}
@container lesson-text (max-width:12rem){.lunch-menu h2{font-variation-settings:"wdth" 75}}
.lunch-menu__layout{display:grid;gap:1.25rem;align-items:start;min-inline-size:0;font-size:var(--lesson-text-body-size);line-height:1.6}
.lunch-menu__scene{margin:0;min-inline-size:0;border:1px solid #cad6e4;border-radius:.75rem;overflow:hidden;background:white}
.lunch-menu__table{inline-size:100%;table-layout:auto;border-collapse:separate;border-spacing:0;min-inline-size:0;background:#fff;border:1px solid #cad6e4;border-radius:.75rem;padding:.5rem .8rem}
.lunch-menu__table caption{text-align:start;font:650 1.5rem/1.3 var(--lesson-text-font-heading,system-ui,sans-serif);padding:0 0 .75rem}
.lunch-menu__table th,.lunch-menu__table td{padding:.4rem .15rem;border-bottom:1px solid #dce3eb;vertical-align:top}
.lunch-menu__table th{text-align:start;font-weight:450;overflow-wrap:normal;word-break:normal}
.lunch-menu__table td{text-align:end;white-space:nowrap;font-variant-numeric:tabular-nums;padding-inline-start:.85rem}
.lunch-menu__table tr:last-child th,.lunch-menu__table tr:last-child td{border-bottom:0}
.lunch-menu__table tr[data-source-highlight="true"]{background:#fbe7f3}
.lunch-menu[data-menu-focus="true"] .lunch-menu__table{border-color:#765d97;background:#f9fbff}
.lunch-menu[data-final-menu="true"] .lunch-menu__layout{grid-template-columns:minmax(0,1fr)}
.lunch-menu[data-final-menu="true"] .lunch-menu__table{max-inline-size:40rem;margin-inline:auto}
@media (prefers-reduced-motion:reduce){.lunch-menu__table tr[data-highlight-group="true"]{background:#fbe7f3}}
@container lesson-text (min-width:48rem){.lunch-menu__layout{--lesson-text-body-size:1.25rem}}
@container lesson-text (min-width:54rem){.lunch-menu__layout{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)}}
@container lesson-text (max-width:18rem){.lunch-menu__table tr,.lunch-menu__table th,.lunch-menu__table td{display:block}.lunch-menu__table th{border-bottom:0;padding-bottom:0}.lunch-menu__table td{text-align:start;padding-top:0;padding-inline-start:.15rem}}
`;
export function LunchMenuSurface({config,snapshot,figure}:{readonly config:LunchMenuConfig;readonly snapshot:TextPresentationSnapshot;readonly figure:ReactNode}) {
  const blocks=Object.fromEntries(snapshot.blocks.map(b=>[b.id,b])),frame=snapshot.identity.frame;
  const finalMenu=frame>=config.finalMenuOnlyFrom,visible=blocks[config.menuTitle.id].visible;
  return <div className="lesson-text-presentation lunch-menu" data-native-lunch-menu="true" data-native-frame={frame}
    data-menu-focus={frame>=config.menuFocusFrom} data-final-menu={finalMenu}>
    <style>{STYLES}</style>
    <h2 className="lesson-text-presentation__block lesson-text-presentation__block--title" data-lesson-text-block={config.title.id}>{blocks[config.title.id].text}</h2>
    <div className="lunch-menu__layout">
      <figure className="lunch-menu__scene" hidden={finalMenu}>{figure}</figure>
      <table className="lunch-menu__table" aria-hidden={!visible||undefined} style={{visibility:visible?'visible':'hidden'}}>
        <caption data-lesson-text-block={config.menuTitle.id}>{blocks[config.menuTitle.id].text}</caption>
        <tbody>{config.menu.map(row=>{
          const group=config.highlights.find(h=>h.foodCharacterId===row.foodCharacterId);
          const active=group?.intervals.some(([first,end])=>frame>=first&&frame<end)??false;
          const inGroup=Boolean(group&&frame>=group.firstFrame&&frame<group.lastFrameExclusive);
          return <tr key={row.id} data-source-food-id={row.foodCharacterId} data-source-highlight={active} data-highlight-group={inGroup}>
            <th scope="row" data-lesson-text-block={row.foodId}>{blocks[row.foodId].text}</th>
            <td data-lesson-text-block={row.priceId}>{blocks[row.priceId].text}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  </div>;
}
export function createLunchMenuPresentation(config:LunchMenuConfig,readFrame:LunchMenuFrameReader):LessonTextPresentationCapability<SourceStaticCanvasFrameState> {
  const getSnapshot=(state:SourceStaticCanvasFrameState,context:RuntimeContext)=>getLunchMenuSnapshot(config,readFrame,state,context);
  function Renderer(props:AnimationRendererProps) {
    const context:RuntimeContext={...props,frameDomain:props.frameDomain??config.frameDomain,rootFrame:props.rootFrame??config.rootFrame};
    const state=(props.state===undefined?readFrame(props.frame,context):props.state) as SourceStaticCanvasFrameState;
    const snapshot=getSnapshot(state,context),[adapter,setAdapter]=useState<LessonCanvasPlaneAdapter|null>(null),[failed,setFailed]=useState(false);
    useEffect(()=>{if(snapshot.status!=='ready')return;let cancelled=false;void loadLunchActivityScene(config).then(a=>{if(!cancelled)setAdapter(a)}).catch(()=>{if(!cancelled)setFailed(true)});return()=>{cancelled=true}},[snapshot.status]);
    const attributes={'data-modern-lesson':'g4-l4-rw002','data-presentation-status':snapshot.status==='ready'?'candidate':'blocked','data-source-swf-sha256':config.sourceSwfSha256,
      'data-flash-frame':snapshot.identity.frame,'data-flash-frame-domain':snapshot.identity.frameDomain,'data-flash-root-frame':snapshot.identity.rootFrame,
      'data-flash-seed':snapshot.identity.seed,'data-flash-lang':snapshot.identity.language,'data-flash-scenario':snapshot.identity.scenario,'data-replay':snapshot.identity.replay,
      'data-language-policy':props.uiLanguage==='es'?'source-fallback':'source','data-spanish-translation':'false','data-original-runtime-accepted':'false','data-owner-accepted':'false','data-strict-migration-complete':'false'};
    if(snapshot.status!=='ready')return <section {...attributes} lang="en"/>;
    return <section {...attributes} lang="en">{failed?<p role="status">The lesson figure could not load.</p>:adapter?
      <LessonCanvasPlane adapter={adapter} nativeStage={NATIVE_STAGE} sourceBitmapBound={true} request={{...context,...snapshot.identity,lang:'en'}} snapshot={snapshot}
        renderKey={`${config.animationId}:${JSON.stringify(snapshot.identity)}`} figureLabel="Lunch scene">
        {(committed,figure)=><LunchMenuSurface config={config} snapshot={committed} figure={figure}/>}
      </LessonCanvasPlane>:<p role="status">Loading lesson figure…</p>}</section>;
  }
  return Object.freeze({schemaVersion:1,binding:config.binding,Renderer,getSnapshot,playbackMode:'once',
    playbackEndFrameByDomain:Object.freeze({[config.frameDomain]:config.frameCount}),reducedMotionFrameByDomain:Object.freeze({[config.frameDomain]:config.frameCount}),
    sourceTimelineAudioCues:config.sourceAudio,prepare:async()=>{await loadLunchActivityScene(config)}});
}
