'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {AnimationRendererProps} from './contract';
import {loadP055NativeAsset,type P055NativeAsset} from './nms-l02-p055-native-assets';
import {nmsP055TextSnapshot,type P055NativeTextSnapshot} from './nms-l02-p055-native-text';

export function NmsL02P055NativeRenderer(props:AnimationRendererProps){
 const [asset,setAsset]=useState<P055NativeAsset|null>(null);
 const [snapshot,setSnapshot]=useState<P055NativeTextSnapshot|null>(null);
 const [failed,setFailed]=useState(false);
 const canvas=useRef<HTMLCanvasElement>(null),staging=useRef<HTMLCanvasElement|null>(null);
 useEffect(()=>{let active=true;void loadP055NativeAsset().then(value=>{if(active)setAsset(value);})
  .catch(()=>{if(active)setFailed(true);});return()=>{active=false;};},[]);
 useEffect(()=>()=>{if(staging.current){staging.current.width=0;staging.current.height=0;staging.current=null;}},[]);
 useLayoutEffect(()=>{
  if(!asset||!canvas.current)return;
  try{
   const request={frame:props.frame,frameDomain:props.frameDomain??'',rootFrame:props.rootFrame??6,
    scenario:props.scenario,lang:props.lang,seed:props.seed,replay:props.replay??0};
   const next=nmsP055TextSnapshot(request);
   if(next.status!=='ready')throw Error('P055 native text context unavailable');
   const buffer=staging.current??document.createElement('canvas');
   if(!staging.current){buffer.width=1600;buffer.height=1200;staging.current=buffer;}
   const ids=next.sourceSuppressionInstanceIds;
   const result=asset.renderWithText(buffer,{...request,text:{suppressInstanceIds:ids}});
   if(result.unfulfilledSuppressionIds.length||result.suppressedInstanceIds.length!==ids.length||
    ids.some(id=>!result.suppressedInstanceIds.includes(id))||
    (result.state.localFrame??result.state.frame)!==request.frame||
    result.state.frameDomain!==request.frameDomain||result.state.rootFrame!==6)
    throw Error('P055 native text/drawing transaction mismatch');
   const context=canvas.current.getContext('2d');if(!context)throw Error('P055 canvas unavailable');
   context.setTransform(1,0,0,1,0,0);context.clearRect(0,0,1600,1200);context.drawImage(buffer,0,0);
   setSnapshot(next);setFailed(false);
  }catch{setFailed(true);setSnapshot(null);canvas.current.getContext('2d')?.clearRect(0,0,1600,1200);}
 },[asset,props.frame,props.frameDomain,props.rootFrame,props.scenario,props.lang,props.seed,props.replay]);
 const ready=Boolean(snapshot)&&!failed;
 const visible=snapshot?.rows.filter(row=>row.visible)??[];
 const text=(characterId:number)=>visible.filter(row=>row.characterId===characterId).map(row=>
  <span key={row.instanceId} data-source-instance-id={row.instanceId}
   style={{opacity:row.alpha,whiteSpace:'pre-line'}}>{row.text}</span>);
 const cardStyle={border:'2px solid #cf7629',borderRadius:'0.75rem',padding:'1rem',background:'#fff7e9'};
 return <article className="nms-ts-pilot nms-p055-native" lang="en"
  data-canvas-status={failed?'error':ready?'ready':'loading'} data-p055-frame={snapshot?.identity.frame}
  style={{maxWidth:'60rem',margin:'0 auto',lineHeight:1.6}}>
  <h2>4 Step Plan</h2>
  {props.uiLanguage==='es'&&<p lang="es" className="lesson-text-language-note" data-spanish-translation="missing">
   Texto original en inglés. No hay una traducción al español verificada.
  </p>}
  {failed?<p role="alert">The lesson text and drawing could not load together.</p>:
   !ready?<p role="status">Loading lesson text and drawing…</p>:null}
  <section lang="en" aria-label="Four step plan" className="nms-ts-step-grid" hidden={!ready}
   style={{display:ready?'grid':'none',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:'1rem'}}>
   <div style={cardStyle}>{text(8)}{text(7)} <strong>{text(9)}</strong></div>
   <div style={cardStyle}>{text(4)}</div><div style={cardStyle}>{text(5)}</div><div style={cardStyle}>{text(6)}</div>
  </section>
  <section lang="en" className="nms-ts-instructions" hidden={!ready} aria-label="Instructions"
   style={{display:ready?'block':'none',fontSize:'1.25rem',padding:'1rem 0'}}>
   {[13,20,24].map(id=><p key={id}>{text(id)}</p>)}
   <div className="nms-ts-emphasis" aria-label="Source emphasis">{[17,18,23].map(id=>text(id))}</div>
  </section>
  <details hidden={!ready}><summary>Reference drawing</summary>
   <p>Extracted text is presented above.</p>
   <canvas ref={canvas} width={1600} height={1200} role="img" style={{display:'block',width:'100%',height:'auto'}}
    aria-label="Source step containers, pointer, and outlined title"/>
  </details>
 </article>;
}
