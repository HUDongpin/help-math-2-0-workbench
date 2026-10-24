'use client';
import React,{useId,useRef,type CSSProperties,type KeyboardEvent} from 'react';
import DATA from './weather.generated.json';
import {useWholeWeatherInk} from './whole-weather-ink';

export const IN009_WEATHER_CANDIDATE_DATA = DATA;
export interface WeatherDataset {
 readonly schemaVersion:number;
 /** Optional historical workflow label, never source/acceptance authority. */
 readonly censusStatus?:string;
 readonly censusSha256:string;
 readonly sourceSwfSha256:string;
 readonly bitmap:{readonly characterId:number;readonly width:number;readonly height:number;readonly sha256:string;readonly rgbaSha256:string};
 readonly labels:readonly {readonly id:string;readonly kind:string;readonly sourceText:string;readonly text:string;readonly unitPrintedAtLabel:string|null;readonly coverBox:readonly number[];readonly glyphBox?:readonly number[]|null;readonly anchor:readonly number[];readonly readingOrder:number;readonly reviewStatus:string}[];
}
const FLOW_IDS=new Set(['title','date','credit']);
const EXPECTED_SWF='766b6ab686bbaf8ab1dacc30a7ffb96f33735102a1dff7df6b7a97976e3ab25c';
const EXPECTED_BITMAP='590785910aa245ce4acd8b8c768882bbd33f65a60ab08428b77d205a472f87e9';
export type WeatherLabelId = string;
export type SourceMapClip =
 | {readonly kind:'none'}
 | {readonly kind:'bitmap-space-path-union';readonly paths:readonly {readonly d:string;readonly fillRule:'nonzero'|'evenodd'}[]};
/** Coordinates have already been projected by the root source adapter into bitmap19's640x480 space.
 * This component neither derives source visibility nor guesses the clipped label membership. */
export type WeatherMapSourceState =
 | {readonly status:'unresolved';readonly sourceFrame:number;readonly reason:string}
 | {readonly status:'resolved';readonly sourceFrame:number;readonly sourceInstanceId:string;readonly sourceSwfSha256:string;
    readonly visible:boolean;readonly alpha:number;readonly clip:SourceMapClip;readonly admittedLabelIds:readonly WeatherLabelId[];
    readonly evidenceRef:string;readonly semanticVisibility:'primary'|'duplicate-hidden'};
export interface WeatherMapProps {
 readonly source:WeatherMapSourceState;
 /** Caller must select and pin a specific candidate or reviewed successor. No implicit value dataset. */
 readonly dataset:WeatherDataset;
 readonly censusSha256:string;
 /** Root's source-bound bitmap URL. The copied prototype source-map.png has the exact pinned bytes. */
 readonly bitmapUrl:string;
 readonly bitmapSha256:string;
 readonly className?:string;
}
export function validateWeatherSource(source:WeatherMapSourceState,bitmapSha256:string,dataset:WeatherDataset,censusSha256:string){
 if(!/^[a-f0-9]{64}$/.test(censusSha256)||dataset.censusSha256!==censusSha256)throw Error('Explicit weather census pin mismatch');
 if(dataset.sourceSwfSha256!==EXPECTED_SWF||dataset.bitmap.characterId!==19||dataset.bitmap.sha256!==EXPECTED_BITMAP)throw Error('Dataset is not the source-bound IN009 weather map');
 if(dataset.bitmap.width!==640||dataset.bitmap.height!==480||dataset.labels.length!==141)throw Error('Weather-map dataset membership or dimensions mismatch');
 const LABEL_IDS=new Set(dataset.labels.map(label=>label.id));if(LABEL_IDS.size!==141)throw Error('Duplicate weather-map label identity');
 if([...FLOW_IDS].some(id=>!LABEL_IDS.has(id)))throw Error('Missing exact relocated metadata label');
 for(const label of dataset.labels){const [x,y,w,h]=label.coverBox;if(label.coverBox.length!==4||label.anchor.length!==2||![x,y,w,h,...label.anchor].every(Number.isFinite)||x<0||y<0||w<=0||h<=0||x+w>640||y+h>480)throw Error('Invalid candidate source cover box');}

 if(bitmapSha256!==dataset.bitmap.sha256)throw Error('Weather-map bitmap identity mismatch');
 if(!Number.isInteger(source.sourceFrame)||source.sourceFrame<1||source.sourceFrame>637)throw Error('Unsupported IN009 source frame');
 if(source.status==='unresolved')return;
 if(source.sourceSwfSha256!==dataset.sourceSwfSha256||!source.sourceInstanceId||!source.evidenceRef)throw Error('Weather-map source adapter binding missing');
 if(!Number.isFinite(source.alpha)||source.alpha<0||source.alpha>1)throw Error('Invalid source map alpha');
 if(new Set(source.admittedLabelIds).size!==source.admittedLabelIds.length||source.admittedLabelIds.some(id=>!LABEL_IDS.has(id)))throw Error('Invalid source-admitted weather label membership');
 if(source.clip.kind==='bitmap-space-path-union'&&(!source.clip.paths.length||source.clip.paths.some(path=>!path.d.trim())))throw Error('Unresolved source clip cannot be painted');
}
function pan(event:KeyboardEvent<HTMLDivElement>){
 if(event.target!==event.currentTarget)return;
 const node=event.currentTarget,x=Math.max(44,node.clientWidth*.75),y=Math.max(44,node.clientHeight*.75);
 const deltas:Record<string,readonly[number,number]>={ArrowLeft:[-x,0],ArrowRight:[x,0],ArrowUp:[0,-y],ArrowDown:[0,y],PageUp:[0,-y],PageDown:[0,y]};
 const delta=deltas[event.key];if(!delta)return;event.preventDefault();node.scrollBy({left:delta[0],top:delta[1],behavior:'auto'});
}
/** Source-clock-free prototype. The selected census carries its own transcription review status; cover/clip/layout acceptance remains separate. */
export function In009WeatherMap({source,dataset,censusSha256,bitmapUrl,bitmapSha256,className=''}:WeatherMapProps){
 const viewport=useRef<HTMLDivElement>(null);
 const uid=useId(),clipId=`${uid}-weather-source-clip`;
 validateWeatherSource(source,bitmapSha256,dataset,censusSha256);
 const resolved=source.status==='resolved',shown=resolved&&source.visible&&source.alpha>0;
 const admitted=new Set(resolved?source.admittedLabelIds:[]),duplicate=resolved&&source.semanticVisibility==='duplicate-hidden';
 useWholeWeatherInk(viewport,shown,resolved?source.clip:null);
 const flowLabels=dataset.labels.filter(label=>FLOW_IDS.has(label.id)).sort((a,b)=>a.readingOrder-b.readingOrder);
 const flow=(id:string)=>{const label=flowLabels.find(label=>label.id===id)!;const props={className:'in009-weather-map__prose',hidden:!admitted.has(id),'aria-hidden':!admitted.has(id)||duplicate||undefined,'data-weather-native-id':id,'data-lesson-text-block':`weather-${id}`,'data-weather-source-admitted':admitted.has(id)?'true':'false','data-weather-source-ink':'relocated-prose','data-weather-viewport-ink':'reflowed','data-weather-label-kind':label.kind,'data-weather-source-text':label.sourceText,'data-weather-reading-order':label.readingOrder,style:{opacity:resolved?source.alpha:0}};return id==='title'?<h3 key={id} {...props}>{label.text}</h3>:<p key={id} {...props}>{label.text}</p>;};
 const clip=resolved&&source.clip.kind==='bitmap-space-path-union'?source.clip:null;
 return <figure className={`in009-weather-map ${className}`} lang="en" hidden={!shown}
  data-weather-source-frame={source.sourceFrame} data-weather-source-status={source.status}
  data-weather-census-status={dataset.censusStatus} data-weather-census-sha256={censusSha256} data-weather-source-instance={resolved?source.sourceInstanceId:undefined}>
  {flow('title')}
  {clip&&<svg className="in009-weather-map__clip-definitions" aria-hidden="true" width="0" height="0"><defs><clipPath id={clipId} clipPathUnits="objectBoundingBox">
   {clip.paths.map((path,index)=><path key={index} d={path.d} transform="scale(0.0015625 0.0020833333333333333)" clipRule={path.fillRule}/>)}
  </clipPath></defs></svg>}
  <div ref={viewport} className="in009-weather-map__viewport" data-weather-viewport-ax-policy="retain-source-admitted-text" role="region" aria-label="Weather map" tabIndex={shown&&!duplicate?0:-1}
   aria-hidden={duplicate||undefined} onKeyDown={pan}>
   <div className="in009-weather-map__extent">
    <div className="in009-weather-map__composition" style={{opacity:resolved?source.alpha:0,clipPath:clip?`url(#${clipId})`:undefined}}>
     <img className="in009-weather-map__bitmap" src={bitmapUrl} width={640} height={480} alt="" aria-hidden="true" draggable={false}/>
     <svg className="in009-weather-map__plates" viewBox="0 0 640 480" preserveAspectRatio="none" aria-hidden="true">
      {dataset.labels.map(label=><rect key={label.id} data-weather-mask-id={label.id} x={label.coverBox[0]} y={label.coverBox[1]} width={label.coverBox[2]} height={label.coverBox[3]} fill="#fffdf7"/>)}
     </svg>
     <div className="in009-weather-map__labels">
      {dataset.labels.filter(label=>!FLOW_IDS.has(label.id)).map(label=><span key={label.id} className="in009-weather-map__label"
       role={label.kind==='map-title'?'heading':undefined} aria-level={label.kind==='map-title'?3:undefined}
       data-weather-native-id={label.id} data-weather-reading-order={label.readingOrder} data-lesson-text-block={`weather-${label.id}`} data-weather-source-admitted={admitted.has(label.id)?"true":"false"} aria-hidden={!admitted.has(label.id)||undefined} data-weather-label-kind={label.kind} data-weather-source-text={label.sourceText}
       style={{left:`${label.anchor[0]/640*100}%`,top:`${label.anchor[1]/480*100}%`} as CSSProperties}>{label.text}</span>)}
     </div>
    </div>
   </div>
  </div>
  <figcaption className="in009-weather-map__caption" aria-hidden={duplicate||undefined}>{flowLabels.filter(label=>label.id!=='title').map(label=>flow(label.id))}</figcaption>
 </figure>;
}
