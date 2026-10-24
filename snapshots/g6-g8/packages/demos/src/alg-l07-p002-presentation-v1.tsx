'use client';
import type {AnimationRendererProps} from './contract';
import {LessonAnimationTitleV1} from './lesson-animation-title-v1';
import {createSourceStaticCanvasCandidate} from './source-static-canvas-candidate';
import {ALG_L07_P002_SOURCE as SOURCE,algL07P002Frame,type AlgL07P002Frame} from './alg-l07-p002-state-v1';
import './alg-l07-p002-v1.css';
export const ALG_L07_P002_CANVAS_SHA256='d02d235aadd0e0a258adc2de7e4526d8b329908f8db302c70ab14c031e2c7a2e';
const candidate=createSourceStaticCanvasCandidate({animationId:SOURCE.animationId,title:SOURCE.title,sourceSwfSha256:SOURCE.sourceSha256,
 assetSource:'/flash-assets/g678-local/shared-alg001-l07-p002/native-canvas-renderer.js',assetSha256:ALG_L07_P002_CANVAS_SHA256,
 stage:{width:800,height:600,backgroundColor:'#b8d8f7'},fps:12,rootFrameCount:10,rootBeginFrame:6,mainFrameDomain:'sprite-452',mainFrameCount:1195,
 playbackMode:'once',showEngineeringDisclosure:false});
const CanvasRenderer=candidate.module.Renderer;
export function algL07P002Commit(canvas:HTMLCanvasElement,frame:number,seed:number){
 const registry=(window as Window & {HELP_MATH_CANVAS_ASSETS?:Record<string,{render:(canvas:HTMLCanvasElement,request:Record<string,unknown>)=>unknown}>}).HELP_MATH_CANVAS_ASSETS;
 const result=registry?.[SOURCE.animationId]?.render(canvas,{frame,scenario:'source-static-frame',lang:'en',seed});
 return !!result&&typeof result==='object'&&'localFrame' in result&&result.localFrame===frame;
}
export function AlgL07P002Presentation({state,reducedMotion=false}:{state:AlgL07P002Frame;reducedMotion?:boolean}){
 const frame=state.mainFrame??1;
 return <section className="alg-l07-p002" data-animation-id={state.animationId} data-flash-animation-id={state.animationId}
  data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}
  data-flash-language={state.language} data-flash-seed={state.seed} data-flash-replay={state.replay}
  data-source-text-ids={state.sourceTextIds.join(',')} data-source-swf-sha256={SOURCE.sourceSha256}
  data-visual-language="en" data-visual-language-fallback={state.visualLanguageFallback?'source-en':undefined}>
  <LessonAnimationTitleV1 courseTitle={SOURCE.courseTitle} activityTitle={SOURCE.activityTitle} language="en"/>
  <div className="alg-l07-p002__scene" aria-hidden="true">
   <CanvasRenderer frame={frame} frameDomain="sprite-452" rootFrame={6} scenario="source-static-frame" lang="en" seed={state.seed}/>
  </div>
  <div className="alg-l07-p002__reading" data-table-visible={state.tableVisible?'true':'false'}>
   {state.tableVisible&&<table lang="en" data-lesson-text-block="service-plans">
    <caption data-source-text-id="character-160">{SOURCE.tableTitle}</caption>
    <thead><tr data-source-text-id="character-155"><th scope="col">Plan</th><th scope="col">Monthly Fee</th><th scope="col">Minutes Fee</th></tr></thead>
    <tbody>{SOURCE.rows.map((row,index)=><tr key={row.characterId} data-source-text-id={`character-${row.characterId}`}>
     <th scope="row">{index+1}. {row.plan}</th>{(['monthly','rate'] as const).map(cell=>{const emphasized=state.accents.some(accent=>accent[0]===index&&accent[1]===cell);return <td key={cell} data-plan-cell={`${index}-${cell}`} data-emphasis={emphasized?'true':'false'}>{cell==='rate'?<>{row.rate.slice(0,row.rate.indexOf('/')+1)}<wbr/>{row.rate.slice(row.rate.indexOf('/')+1)}</>:row[cell]}</td>;})}
    </tr>)}</tbody>
   </table>}
  </div>
 </section>;
}
export function AlgL07P002Renderer(props:AnimationRendererProps){return <AlgL07P002Presentation state={algL07P002Frame(props.frame,{...props,frame:props.frame})} reducedMotion={props.reducedMotion}/>;}
