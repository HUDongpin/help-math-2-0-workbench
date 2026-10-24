import type{AnimationRendererProps,RuntimeContext}from'./contract';
import{ALG_L08_P040_SOURCE as S}from'./alg-l08-p040-source-v1';
import{p040InitialState,p040Act}from'./alg-l08-p040-state-v1';
import{AlgL08P040Presentation}from'./alg-l08-p040-presentation-v1';
export const P040_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P040_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-255',frameCount:737,rootFrame:6}]);
/** Stateless main-domain inspection is intentionally separate from the live
 * seeded game session; static frame736 has the source's no-Start game state. */
export function algL08P040Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-255',scenario:'source-game',lang:'en',seed:1}){
 const domain=context.frameDomain??'sprite-255',spec=P040_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>0xffffffff||!['en','es'].includes(context.lang)||context.scenario!=='source-game')throw Error('P040 invalid inspection identity');
 let state=p040InitialState(context.seed);const main=domain==='root'?1:frame;if(main===736)state=p040Act(state,{type:'enter-game',epoch:state.source.epoch});else state={...state,source:{...state.source,mainFrame:main,mainPlaying:main<736,missingFinalTarget:main===737}};
 return{...context,frameDomain:domain,rootFrame:domain==='root'?frame:6,ready:domain!=='root'||frame===6,state};
}
export function AlgL08P040Renderer(props:AnimationRendererProps){const view=algL08P040Frame(props.frame,{...props,scenario:props.scenario??'source-game'});return view.ready?<AlgL08P040Presentation state={view.state} language={view.lang}/>:<section data-animation-id={S.animationId} aria-busy="true"/>;}
