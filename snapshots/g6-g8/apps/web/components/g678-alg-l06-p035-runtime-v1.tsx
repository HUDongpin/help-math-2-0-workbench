'use client';
import {useCallback,useEffect,useState} from 'react';
import {useSourceLessonHostBridge,type SourceLessonSnapshot} from './source-lesson-host-bridge-v1';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {P035PlayerV1} from '../../../packages/demos/src/alg-l06-p035-player-v1';
import type {P035AudioOwnerSnapshot} from '../../../packages/demos/src/alg-l06-p035-audio-owner-v1';
import type {P035CanvasAsset} from '../../../packages/demos/src/alg-l06-p035-visual-v1';
import {P035_MEASURED_BINDINGS,type P035MeasuredDomainId} from '../../../packages/demos/src/alg-l06-p035-measured-bindings-v1';
import type {P035Glossary} from '../../../packages/demos/src/alg-l06-p035-state-v1';
const ID='shared-alg001-l06-p035';
const SOURCE_SHA='9aaf16b58c32b00b056c7c5040b38f9d1391486bb025b71c95fa0326bbae33b3';
const CANVAS_SHA='b0011b78121b76672ec62706f5943013885e8d0a31756707f2a246078b906ab3';
export const P035_GLOSSARY_ENTRY_ID={Substitute:'substitute',Equation:'equation',
 Function:'function',Output:'output',Input:'input'} as const satisfies Record<P035Glossary,string>;
const HOST_BINDING={frameCount:534,frameDomain:'sprite-227',fps:12,
 companionIdSuffix:'-p035-source-readable',glossaryEntries:P035_GLOSSARY_ENTRY_ID} as const;
// Modern deterministic host choice. The source names show*Feed(), but does not recover selection policy.
export const P035_HOST_VARIANTS={wrongFirst:80,wrongSecond:126,right:207} as const;
const SOURCE_URLS=Object.fromEntries(Object.entries(P035_MEASURED_BINDINGS).map(([id,pin])=>[
 id,`/flash-assets/g678-local/${ID}/${id==='main'?'main-source-v1':id==='sa'?'optional-spanish-audio-v1':`feedback-${id}`}?sha256=${pin.sourceSha256}`,
])) as Readonly<Record<P035MeasuredDomainId,string>>;
type Asset=P035CanvasAsset&{metadata:{animationId:string;sourceSwfSha256:string;
 fps:number;sourceRootTimeline:{frameCount:number;beginFrame:number};
 deterministicContentTimeline:{timelineId:string;frameCount:number};stage:{width:number;height:number}}};
let canvasLoad:Promise<Asset>|undefined;
function loaded(){return window.HELP_MATH_CANVAS_ASSETS?.[ID] as unknown as Asset|undefined;}
function exact(){const asset=loaded(),m=asset?.metadata;
 if(!asset||m?.animationId!==ID||m.sourceSwfSha256!==SOURCE_SHA||m.fps!==12||
  m.sourceRootTimeline.frameCount!==10||m.sourceRootTimeline.beginFrame!==6||
  m.deterministicContentTimeline.timelineId!=='sprite-227'||m.deterministicContentTimeline.frameCount!==534||
  m.stage.width!==800||m.stage.height!==600)throw Error('P035_CANVAS_IDENTITY');return asset;}
function loadCanvas():Promise<Asset>{
 if(loaded()){try{return Promise.resolve(exact());}catch(e){return Promise.reject(e);}}
 if(!canvasLoad)canvasLoad=new Promise((resolve,reject)=>{const script=document.createElement('script');
  script.src=`/flash-assets/g678-local/${ID}/canvas-renderer.js?sha256=${CANVAS_SHA}`;script.async=true;
  script.onload=()=>{try{resolve(exact());}catch(e){script.remove();canvasLoad=undefined;reject(e);}};
  script.onerror=()=>{script.remove();canvasLoad=undefined;reject(Error('P035_CANVAS_REQUEST'));};
  document.head.append(script);});return canvasLoad;
}
export function p035HostSnapshot(snapshot:P035AudioOwnerSnapshot):SourceLessonSnapshot{
 const spanish=snapshot.state.supplemental!=='off';
 return {frame:snapshot.state.mainFrame,phase:snapshot.phase,
  selectedAudio:spanish?'spanish':'main',
  audio:snapshot.activeOwner==='feedback'?(snapshot.feedbackAudio??snapshot.mainAudio):snapshot.mainAudio,
  spanish:snapshot.supplementalAudio};
}
export function G678AlgL6P035RuntimeV1(props:LessonRuntimeAdapterProps){
 const {source,readableTarget,connectControls,onSnapshot,openGlossary}=useSourceLessonHostBridge(props,HOST_BINDING);
 const [asset,setAsset]=useState<Asset|null>(null),[failed,setFailed]=useState(false);
 const observe=useCallback((value:P035AudioOwnerSnapshot)=>onSnapshot(p035HostSnapshot(value)),[onSnapshot]);
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&props.moduleKey===ID&&
  props.audioEnabled===true&&props.query.frameDomain==='sprite-227'&&
  props.query.scenario==='source-static-frame'&&props.query.lang==='en'&&String(props.query.seed)==='0'&&
  props.query.capture!=='1'&&['en','es'].includes(props.uiLanguage??'');
 useEffect(()=>{if(!scoped)return;let live=true;void loadCanvas().then(a=>{if(live)setAsset(a);},()=>{
  if(live)setFailed(true);});return()=>{live=false;};},[scoped]);
 return <div ref={source} data-p035-host-probe={ID} data-p035-host-ready={String(!!asset&&scoped)}
  data-p035-host-source-sha256={SOURCE_SHA} data-p035-host-error={!scoped?'scope':failed?'canvas':'none'}>
  {!scoped||failed?<p role="alert">{props.labels.unavailable}</p>:asset?
   <P035PlayerV1 canvasAsset={asset} sourceUrls={SOURCE_URLS} baseUrl={window.location.origin}
    feedbackVariants={P035_HOST_VARIANTS} language={props.uiLanguage} volume={props.volume??1}
    connectControls={connectControls} onSnapshot={observe} onOpenGlossary={openGlossary}
    nativeTextTarget={readableTarget} hidePlaybackControls/>:<p role="status">{props.labels.loading}</p>}
 </div>;
}
