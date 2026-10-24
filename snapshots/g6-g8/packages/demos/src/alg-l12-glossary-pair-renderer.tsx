'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {AnimationRendererProps} from './contract';
import {loadPairNativeAsset,type PairNativeAsset,type PairNativeAssetConfig} from './alg-l12-glossary-pair-assets';
import {pairTextSnapshot,type PairAnimationId,type PairTextSnapshot} from './alg-l12-p013-p015-native-text';

export function PairNativeRenderer(props:AnimationRendererProps&{assetConfig:PairNativeAssetConfig}){
 const [asset,setAsset]=useState<PairNativeAsset|null>(null),[snapshot,setSnapshot]=useState<PairTextSnapshot|null>(null),[failed,setFailed]=useState(false);
 const canvas=useRef<HTMLCanvasElement>(null),staging=useRef<HTMLCanvasElement|null>(null);
 const figureViewport=useRef<HTMLDivElement>(null);
 useEffect(()=>{let active=true;void loadPairNativeAsset(props.assetConfig).then(value=>{if(active)setAsset(value);})
  .catch(()=>{if(active)setFailed(true);});return()=>{active=false;};},[props.assetConfig]);
 useEffect(()=>()=>{if(staging.current){staging.current.width=0;staging.current.height=0;}staging.current=null;},[]);
 useLayoutEffect(()=>{
  if(!asset||!canvas.current)return;
  try{
   const request={frame:props.frame,frameDomain:props.frameDomain??'',rootFrame:props.rootFrame??6,scenario:props.scenario,lang:props.lang,seed:props.seed};
   const next=pairTextSnapshot(props.assetConfig.animationId as PairAnimationId,{...request,replay:props.replay??0});
   if(next.status!=='ready')throw Error('Pair native text context unavailable');
   const buffer=staging.current??document.createElement('canvas');
   if(!staging.current){buffer.width=1600;buffer.height=1200;staging.current=buffer;}
   const ids=next.sourceSuppressionInstanceIds;
   const result=asset.renderWithText(buffer,{...request,text:{suppressInstanceIds:ids}});
   if(result.unfulfilledSuppressionIds.length||result.suppressedInstanceIds.length!==ids.length||
    ids.some(id=>!result.suppressedInstanceIds.includes(id))||
    (result.state.localFrame??result.state.frame)!==request.frame||result.state.frameDomain!==request.frameDomain||result.state.rootFrame!==6)
    throw Error('Pair text/drawing transaction mismatch');
   const context=canvas.current.getContext('2d');if(!context)throw Error('Pair canvas unavailable');
   context.setTransform(1,0,0,1,0,0);context.clearRect(0,0,1600,1200);context.drawImage(buffer,0,0);
   setSnapshot(next);setFailed(false);
  }catch{setFailed(true);setSnapshot(null);canvas.current.getContext('2d')?.clearRect(0,0,1600,1200);}
 },[asset,props.assetConfig,props.frame,props.frameDomain,props.rootFrame,props.scenario,props.lang,props.seed,props.replay]);
 const visibleFigure=Boolean(snapshot)&&!failed;
 useEffect(()=>{
  const viewport=figureViewport.current;if(!viewport||!visibleFigure)return;
  // Keep the complete 800px source stage scrollable. Center its first view on
  // narrow screens; never reset a learner's pan on animation-frame updates.
  let previousWidth=-1;
  const center=()=>{if(viewport.clientWidth===previousWidth)return;previousWidth=viewport.clientWidth;
   viewport.scrollLeft=Math.max(0,(viewport.scrollWidth-viewport.clientWidth)/2);};
  center();const observer=new ResizeObserver(center);observer.observe(viewport);
  return()=>observer.disconnect();
 },[visibleFigure]);
 const visible=snapshot?.prose.filter(p=>p.visible)??[];
 return <section lang="en" className="pair-source-native" data-canvas-status={failed?'error':snapshot?'ready':'loading'}
  data-pair-native-frame={snapshot?.identity.frame}>
  {failed?<p role="alert">The lesson text and diagram could not load together.</p>:!snapshot?<p role="status">Loading lesson text and diagram…</p>:<>
   <h2>{snapshot.title.text}</h2>
   {visible.map(p=><p key={p.instanceId} data-source-instance-id={p.instanceId}>{p.text}</p>)}
  </>}
  <figure hidden={!snapshot||failed}>
   <div ref={figureViewport} className="pair-figure-scroll" tabIndex={0} aria-label="Scrollable source coordinate diagram">
    <canvas ref={canvas} width={1600} height={1200} role="img"
     aria-label={['Source coordinate diagram.',...(snapshot?.figureLabels.filter(label=>label.alpha>0).map(label=>label.text)??[])].join(' ')}/>
   </div>
  </figure>
  {props.uiLanguage==='es'&&<p lang="es" className="lesson-text-language-note" data-spanish-translation="missing">
   Texto original en inglés. Esta página todavía no tiene una traducción al español verificada.
  </p>}
 </section>;
}
