'use client';
import React,{useRef,type CSSProperties,type ReactNode} from 'react';
import {projectIn009Ticks,type In009SourceState} from './geometry';
import {useWholeTemperatureInk} from './whole-temperature-ink';
export interface In009SourceDocument {readonly identity:{readonly animationId:string;readonly placementId:string;readonly sourceSha256:string;readonly frameDomain:string;readonly rootEntryFrame:number;readonly frames:number;readonly fps:number};readonly title:string;readonly words:readonly {readonly text:string;readonly firstWholeFrame:number;readonly characterRange:readonly number[]}[]}
export interface In009NativeSurfaceProps {
 readonly sourceDocument:In009SourceDocument;
 readonly sourceState:In009SourceState;
 readonly graphics:ReactNode;
 readonly weather:ReactNode|null;
 /** Source74 graphic in local bounds [-905,-523,263,1847], rendered by Canvas or SVG. Root must delegate74 from the general painter. */
 readonly thermometer:null|{readonly ownership:'source-74-delegated';readonly graphic:ReactNode};
 readonly compositionStatus:'slots-uncomposed'|'source-delegation-acknowledged';
 readonly requestedLanguage:'en'|'es';
 /** The product host normally owns this notice; standalone compositions may opt in. */
 readonly showLanguageNotice?:boolean;
 readonly onKeyword:(term:'Temperature'|'Measure',trigger:HTMLElement)=>void;
}
function validate({sourceDocument:d,sourceState:s}:In009NativeSurfaceProps){if(d.identity.animationId!=='course-g04-l03-in-009'||d.identity.placementId!=='g04-l03-placement-020'||d.identity.sourceSha256!=='766b6ab686bbaf8ab1dacc30a7ffb96f33735102a1dff7df6b7a97976e3ab25c'||d.identity.frameDomain!=='sprite-200'||d.identity.rootEntryFrame!==6||d.identity.frames!==637||d.identity.fps!==12)throw Error('IN009 source document identity mismatch');if(!Number.isInteger(s.frame)||s.frame<1||s.frame>637||s.wordIndices.some((n,i)=>n!==i||n>=d.words.length||d.words[n].firstWholeFrame>s.frame))throw Error('Unsupported source word/frame state');if(s.caption&&!s.caption.text.endsWith(s.caption.value))throw Error('Caption cannot be split into exact source prefix and atomic value');}
export function In009NativeSurface(props:In009NativeSurfaceProps){
 validate(props);const {sourceDocument,sourceState:s,graphics,weather,thermometer,compositionStatus,requestedLanguage,onKeyword}=props;
 const viewport=useRef<HTMLDivElement>(null),layout=projectIn009Ticks(s),composedThermometer=Boolean(layout&&thermometer&&compositionStatus==='source-delegation-acknowledged');
 useWholeTemperatureInk(viewport,composedThermometer);
 const caption=s.caption,visibleWords=new Set(s.wordIndices);
 return <section className="in009-native" lang="en" data-in009-frame={s.frame} data-in009-source-sha256={sourceDocument.identity.sourceSha256}
  data-in009-composition={compositionStatus} data-in009-weather-slot={weather?'provided':'empty'} data-in009-graphics-slot={graphics?'provided':'empty'} data-in009-thermometer-slot={composedThermometer?'delegated':'uncomposed'} data-source-language="en" data-requested-language={requestedLanguage} data-spanish-translation={requestedLanguage==='es'?'missing':undefined}>
  <h2 data-lesson-text-block="title">{sourceDocument.title}</h2>
  {requestedLanguage==='es'&&props.showLanguageNotice&&<p className="in009-native__fallback" lang="es" data-spanish-translation="missing">Texto original en inglés. No hay una traducción verificada de esta página al español.</p>}
  <p className="in009-native__definition" data-lesson-text-block="definition" hidden={!s.wordIndices.length}>
   {sourceDocument.words.map((word,index)=>visibleWords.has(index)&&<React.Fragment key={index}>{index>0?' ':''}{index===0||index===3?<button className="in009-native__keyword" type="button" data-source-word-index={index} onClick={event=>onKeyword(index===0?'Temperature':'Measure',event.currentTarget)}>{word.text}</button>:<span data-source-word-index={index}>{word.text}</span>}</React.Fragment>)}
  </p>
  {weather&&<div className="in009-native__weather-slot">{weather}</div>}
  <div className="in009-native__scene-layout" data-has-thermometer={composedThermometer?'true':'false'}>
   <div className="in009-native__scene-slot">{graphics}</div>
   {layout&&<div className="in009-native__thermometer-region" hidden={!composedThermometer}>
    <div ref={viewport} className="in009-native__thermometer-viewport" role="region" aria-label="Temperature scale from minus twenty to one hundred. Scroll to explore." tabIndex={0} data-in009-ax-policy="source-admitted-ticks-retained-while-viewport-ink-hidden">
     <div className="in009-native__thermometer-extent" style={{'--in009-thermometer-height':`${layout.heightRem}rem`}as CSSProperties}>
      <div className="in009-native__thermometer-plot">
       <div className="in009-native__thermometer-graphic" aria-hidden="true" data-source-graphic-id="74" data-source-local-bounds={layout.bounds.join(' ')}>{thermometer?.graphic}</div>
       {layout.positions.map(tick=><span key={tick.id} className="in009-native__tick" data-in009-temperature-tick={tick.id} data-lesson-text-block={`thermometer-${tick.depth}`} data-source-character-id={tick.sourceCharacterId}
        data-source-minus-instance={tick.minusInstanceId??undefined} data-source-whole={tick.wholeVisible?'true':'false'} aria-hidden={!tick.wholeVisible||undefined}
        style={{left:`${tick.anchorXPercent}%`,top:`${tick.anchorYPercent}%`}}>{tick.text}</span>)}
      </div>
     </div>
    </div>
   </div>}
  </div>
  {caption&&<p className="in009-native__caption" data-lesson-text-block="temperature-caption" data-source-whole={caption.wholeVisible?'true':'false'} aria-hidden={!caption.wholeVisible||undefined}>
   <span>{caption.text.slice(0,-caption.value.length)}</span><span className="in009-native__temperature-value" data-source-role="signed-temperature" data-source-text-id={caption.sourceTextId} data-source-minus-id={caption.sourceMinusId} data-source-emphasis={s.emphasisActive?'true':'false'} data-source-emphasis-count={s.emphasisSources.length}>{caption.value}</span>
  </p>}
 </section>;
}
