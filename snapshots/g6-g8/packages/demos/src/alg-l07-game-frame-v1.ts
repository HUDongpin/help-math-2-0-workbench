import type {RuntimeContext} from './contract';
import type {LessonTextBinding,LessonTextBlockBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import {P051_SOURCE as D} from './alg-l07-p051-source-v1';
import {P052_CARDS as G} from './alg-l07-p052-cards-v1';
import {p051InitialState} from './alg-l07-p051-state-v1';
import {p052InitialState,type P052State} from './alg-l07-p052-state-v1';
export const L7_GAME_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P051_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-185',frameCount:683,rootFrame:6}]);
export const P052_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-303',frameCount:6,rootFrame:6},{id:'sprite-157',frameCount:28,rootFrame:6},{id:'sprite-170',frameCount:27,rootFrame:6}]);
type Draft=Pick<LessonTextBlockBinding,'id'|'sourceTextIds'|'role'>;
const makeBinding=(animationId:string,sha256:string,blocks:readonly Draft[]):LessonTextBinding=>Object.freeze({schemaVersion:1,version:`${animationId}-native-game-v1`,animationId,placementId:animationId,sourceSwfSha256:sha256,template:'complex-figure',blocks:blocks.map((b,readingOrder)=>({...b,readingOrder,language:'en' as const,valueSource:'maintained-page-state' as const}))});
export const P051_TEXT_BINDING=makeBinding(D.animationId,D.sourceSha256,[...D.instructions.map(t=>({id:`instruction-${t.characterId}`,sourceTextIds:[t.sourceTextId],role:'body' as const})),...D.demoCards.map(c=>({id:c.id,sourceTextIds:c.sourceBindings.map(t=>`character-${t.characterId}`),role:'body' as const})),...D.popup.map(t=>({id:`popup-${t.characterId}`,sourceTextIds:[`character-${t.characterId}`],role:'body' as const})),{id:'select-message',sourceTextIds:['character-137'],role:'feedback'}]);
export const P052_TEXT_BINDING=makeBinding(G.animationId,G.sourceSha256,[...G.levels.flatMap(l=>l.cards.map(c=>({id:`level-${l.level}-${c.name}`,sourceTextIds:c.textBindings.map(t=>`character-${t.characterId}`),role:'body' as const}))),...G.popup.map(t=>({id:`popup-${t.characterId}`,sourceTextIds:[`character-${t.characterId}`],role:'body' as const})),{id:'wrong-feedback',sourceTextIds:['character-151'],role:'feedback'},{id:'right-feedback',sourceTextIds:['character-164','character-165'],role:'feedback'}]);
function contextFor(frame:number,c:RuntimeContext,domains:readonly {id:string;frameCount:number}[],fallback:string){
 const frameDomain=c.frameDomain??fallback,spec=domains.find(d=>d.id===frameDomain);
 if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!['en','es'].includes(c.lang)||!Number.isSafeInteger(c.seed)||c.seed<0||c.seed>4294967295||!Number.isSafeInteger(c.replay??0)||(c.replay??0)<0)throw Error('ALG_L07_GAME_INVALID_FRAME');
 return {...c,frame,frameDomain,rootFrame:frameDomain==='root'?frame:6};
}
export function algL07P051Frame(frame:number,context:RuntimeContext={frame,scenario:'source-directions',lang:'en',seed:0}){
 const c=contextFor(frame,context,P051_DOMAINS,'sprite-185');if(!['source-directions','directions-popup'].includes(c.scenario))throw Error('P051 invalid scenario');
 // 683 is declared by the SWF but blocked by stop() at 682. Keep its identity,
 // and expose no fabricated continuation. Root frames other than 6 are structural.
 const ready=(c.frameDomain!=='root'||frame===6)&&(c.frameDomain!=='sprite-185'||frame<=682),mainFrame=c.frameDomain==='root'?1:frame;
 const state={...p051InitialState(0,c.replay??0),frame:mainFrame,popup:ready&&c.scenario==='directions-popup'&&mainFrame===682};
 const values:Record<string,{text:string;visible:boolean}>={};
 for(const t of D.instructions){const text=t.prefix.find(v=>mainFrame>=v.first&&mainFrame<=v.last)?.value??'';values[`instruction-${t.characterId}`]={text,visible:ready&&Boolean(text)};}
 for(const card of D.demoCards)values[card.id]={text:card.sourceBindings.map(t=>t.text).join(' '),visible:ready&&(card.opacity.find(v=>mainFrame>=v.first&&mainFrame<=v.last)?.value??0)>0};
 for(const t of D.popup)values[`popup-${t.characterId}`]={text:t.text,visible:ready&&state.popup};
 values['select-message']={text:D.message.text,visible:ready&&state.message};
 return {animationId:D.animationId,...c,state,ready,structuralOnly:!ready,sourceDeclaredFrameCount:683,sourceStopFrame:682,textSnapshot:buildLessonTextSnapshot(P051_TEXT_BINDING,c,values)};
}
export function algL07P052Frame(frame:number,context:RuntimeContext={frame,scenario:'source-game',lang:'en',seed:0}){
 const c=contextFor(frame,context,P052_DOMAINS,'sprite-303'),id=Number(c.frameDomain.slice(7)),feedback=id===157||id===170;
 if(!(['source-game','directions-popup'].includes(c.scenario)||feedback&&c.scenario===(id===157?'wrong-feedback':'right-feedback')))throw Error('P052 invalid scenario');
 const mainFrame=c.frameDomain==='sprite-303'?frame:2,ready=(c.frameDomain!=='root'||frame===6)&&(c.frameDomain!=='sprite-303'||frame>=2&&frame<=5),level=mainFrame>=4?2:1;
 let state:P052State=p052InitialState(level,0,c.replay??0);
 if(mainFrame===3||mainFrame===5)state={...state,mainFrame,phase:'complete',matched:[1,2,3,4,5,6],score:60,cardsEnabled:false,quizSection:false};
 else if(feedback)state={...state,score:id===157?-2:10,cardsEnabled:frame===(id===157?28:27),feedback:{[id]:{frame,generation:1,playing:frame<(id===157?28:27)}}};
 state={...state,popup:ready&&c.scenario==='directions-popup'};
 const values:Record<string,{text:string;visible:boolean}>={};
 for(const l of G.levels)for(const card of l.cards)values[`level-${l.level}-${card.name}`]={text:card.textBindings.map(t=>t.text).join(' '),visible:ready&&state.phase==='game'&&l.level===level};
 for(const t of G.popup)values[`popup-${t.characterId}`]={text:t.text,visible:ready&&state.popup};
 for(const f of[157,170]as const){const opacity=G.feedbackTitles[f].find(v=>frame>=v.first&&frame<=v.last)?.value??0;values[f===157?'wrong-feedback':'right-feedback']={text:f===157?'Try Again!':'Great Job!',visible:ready&&id===f&&opacity>0};}
 return {animationId:G.animationId,...c,state,ready,structuralOnly:!ready,sourceDeclaredFrameCount:6,textSnapshot:buildLessonTextSnapshot(P052_TEXT_BINDING,c,values)};
}
