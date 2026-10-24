'use client';
import {useCallback,useEffect,useState} from 'react';
import {loadBoundLessonAudio,useSourceLessonHostBridge,
 type SourceLessonSnapshot} from './source-lesson-host-bridge-v1';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {P038PlayerV1,type P038PlayerPropsV1}
 from '../../../packages/demos/src/alg-l06-p038-player-v1';
import {P038_MAIN,P038_SA} from '../../../packages/demos/src/alg-l06-p038-runtime-v1';
import {ALG_L06_P038_DRAWING} from '../../../packages/demos/src/timelines/shared-alg001-l06-p038';

const ID='shared-alg001-l06-p038';
const SOURCE_SHA='bbd60a3b673fc54b3ea44a20943db33ea556532ddc14789a71aed4dadfe1e9de';
const CANVAS_SHA='80c0b1f6225d60eee27bc9d99ab16040d23b794f3364873be455e2a68524fcfa';
if(ALG_L06_P038_DRAWING.animationId!==ID||
 ALG_L06_P038_DRAWING.sourceSwfSha256!==SOURCE_SHA||
 ALG_L06_P038_DRAWING.assetSha256!==CANVAS_SHA)
 throw Error('P038_MAINTAINED_DRAWING_DRIFT');
export const P038_GLOSSARY_ENTRY_ID={Table:'table',Output:'output',Input:'input',
 Equation:'equation',Rule:'rule',Graph:'graph',Function:'function'} as const;
const HOST_BINDING={frameCount:409,frameDomain:'sprite-67',fps:12,
 companionIdSuffix:'-p038-source-readable',glossaryEntries:P038_GLOSSARY_ENTRY_ID} as const;
type Snapshot=Parameters<NonNullable<P038PlayerPropsV1['onSnapshot']>>[0];
type Asset=P038PlayerPropsV1['asset']&{metadata:{animationId:string;
 sourceSwfSha256:string;fps:number;sourceRootTimeline:{frameCount:number;beginFrame:number};
 deterministicContentTimeline:{timelineId:string;frameCount:number};
 stage:{width:number;height:number}}};

let canvasLoad:Promise<Asset>|undefined;
function loaded(){return window.HELP_MATH_CANVAS_ASSETS?.[ID] as unknown as Asset|undefined;}
function exact(){
 const asset=loaded(),m=asset?.metadata;
 if(!asset||m?.animationId!==ID||m.sourceSwfSha256!==SOURCE_SHA||m.fps!==12||
  m.sourceRootTimeline.frameCount!==13||m.sourceRootTimeline.beginFrame!==6||
  m.deterministicContentTimeline.timelineId!=='sprite-67'||
  m.deterministicContentTimeline.frameCount!==409||
  m.stage.width!==800||m.stage.height!==600)
  throw Error('P038_CANVAS_IDENTITY');
 return asset;
}
function loadCanvas():Promise<Asset>{
 if(loaded()){try{return Promise.resolve(exact());}catch(error){return Promise.reject(error);}}
 if(!canvasLoad)canvasLoad=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=`/flash-assets/g678-local/${ID}/canvas-renderer.js?sha256=${CANVAS_SHA}`;
  script.async=true;
  script.onload=()=>{try{resolve(exact());}catch(error){
    script.remove();canvasLoad=undefined;reject(error);}};
  script.onerror=()=>{script.remove();canvasLoad=undefined;
    reject(Error('P038_CANVAS_REQUEST'));};
  document.head.append(script);
 });
 return canvasLoad;
}
export function p038HostSnapshot(snapshot:Snapshot):SourceLessonSnapshot{
 return {frame:snapshot.frame,phase:snapshot.phase,
  selectedAudio:snapshot.selectedAudio,
  audio:snapshot.mainAudio,spanish:snapshot.spanishAudio};
}
export function G678AlgL6P038RuntimeV1(props:LessonRuntimeAdapterProps){
 const {source,readableTarget,reducedMotion,connectControls,onSnapshot,openGlossary}=
  useSourceLessonHostBridge(props,HOST_BINDING);
 const [asset,setAsset]=useState<Asset|null>(null),[failed,setFailed]=useState(false);
 const observe=useCallback((value:Snapshot)=>onSnapshot(p038HostSnapshot(value)),[onSnapshot]);
 const main=useCallback((signal:AbortSignal)=>loadBoundLessonAudio({animationId:ID,
  assetId:'main-source-v1',pin:P038_MAIN,origin:window.location.origin,
  signal,errorPrefix:'P038_MAIN'}),[]);
 const spanish=useCallback((signal:AbortSignal)=>loadBoundLessonAudio({animationId:ID,
  assetId:'optional-spanish-audio-v1',pin:P038_SA,origin:window.location.origin,
  signal,errorPrefix:'P038_SPANISH'}),[]);
 const closeGlossary=useCallback(()=>{
  props.onLessonHostRequest?.({type:'close-glossary'});
 },[props.onLessonHostRequest]);
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&
  props.moduleKey===ID&&props.audioEnabled===true&&
  props.query.frameDomain==='sprite-67'&&
  props.query.scenario==='source-static-frame'&&props.query.lang==='en'&&
  String(props.query.seed)==='0'&&props.query.capture!=='1'&&
  ['en','es'].includes(props.uiLanguage??'');
 useEffect(()=>{if(!scoped)return;let live=true;
  void loadCanvas().then(value=>{if(live)setAsset(value);},()=>{if(live)setFailed(true);});
  return()=>{live=false;};
 },[scoped]);
 return <div ref={source} data-p038-host-probe={ID}
  data-p038-host-ready={String(!!asset&&scoped)}
  data-p038-host-source-sha256={SOURCE_SHA}
  data-p038-host-canvas-sha256={CANVAS_SHA}
  data-p038-host-error={!scoped?'scope':failed?'canvas':'none'}>
  {!scoped||failed?<p role="alert">{props.labels.unavailable}</p>:asset?
   <P038PlayerV1 asset={asset} loadMain={main} loadSpanish={spanish}
    language={props.uiLanguage} reducedMotion={reducedMotion} volume={props.volume??1}
    connectControls={connectControls} onSnapshot={observe}
    onOpenGlossary={openGlossary} onCloseGlossary={closeGlossary}
    hidePlaybackControls nativeTextTarget={readableTarget}/>:<p role="status">{props.labels.loading}</p>}
 </div>;
}
