import type {AnimationRendererProps,RuntimeContext} from '../../contract';
import type {LessonTextBinding,LessonTextActivityDefinition,LessonTextActivitySnapshot,LessonTextFrameTransition} from '../../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../../source-static-canvas-candidate';
import {buildLessonTextSnapshot} from '../../lesson-text-snapshot';
import data from './source.generated.json';
export const GS003_SOURCE=data;
export const GS003_BINDING=data.binding as unknown as LessonTextBinding;
export const GS003_ACTIVITIES=data.activities as unknown as readonly LessonTextActivityDefinition[];
export type Gs003Level=1|2;
/** Host memory scoped to the exact035→036 handoff; absence follows source defaultLevel1. */
export type Gs003Runtime=AnimationRendererProps&Readonly<{gs003EntryLevel?:Gs003Level}>;
export type Gs003Card=Readonly<{id:string;frame:1|2;alpha:number;visible:boolean;pictureVisible:boolean}>;
export type Gs003Feedback=Readonly<{requested:boolean;afterRevision:number;completedRevision:number;frame:number}>;
export type Gs003Fade=Readonly<{pair:number;alphaStep:number;intervalMs:number;elapsedMs:number;appliedTicks:number}>;
export type Gs003Session=Readonly<{seed:number;replay:number;lastFrame:number;level:Gs003Level;selectedLevel:Gs003Level;entryRequested:boolean;cards:readonly Gs003Card[];cardsEnabled:boolean;score:number;ansClickCount:0|1;chkMcName:string;totAnsCount:number;correctEndCount:number;quizSection:boolean;popupOpen:boolean;fades:readonly Gs003Fade[];wrong:Gs003Feedback;correct:Gs003Feedback;completionSent:boolean;focus:string|null}>;
const quietFeedback=():Gs003Feedback=>({requested:false,afterRevision:0,completedRevision:0,frame:1});
export function gs003EntryLevel(value:unknown):Gs003Level{if(value===undefined)return 1;if(value===1||value===2)return value;throw new TypeError('GS003 requires an exact level1 or level2 handoff');}
export function gs003Level(level:Gs003Level){return data.levels.find(l=>l.level===level)!;}
function freshCards(level:Gs003Level):Gs003Card[]{return gs003Level(level).cards.map(c=>({id:c.id,frame:1,alpha:100,visible:true,pictureVisible:false}));}
export function createGs003(seed=0,replay=0,entryLevel?:Gs003Level):Gs003Session{const level=gs003EntryLevel(entryLevel);return{seed:seed>>>0,replay,lastFrame:1,level,selectedLevel:level,entryRequested:false,cards:freshCards(level),cardsEnabled:true,score:0,ansClickCount:0,chkMcName:'',totAnsCount:0,correctEndCount:0,quizSection:true,popupOpen:false,fades:[],wrong:quietFeedback(),correct:quietFeedback(),completionSent:false,focus:null};}
const validLevel=(r:Gs003Runtime)=>r.gs003EntryLevel===undefined||r.gs003EntryLevel===1||r.gs003EntryLevel===2;
const identity=(s:Gs003Session,r:Gs003Runtime)=>validLevel(r)&&r.lang==='en'&&r.scenario==='source-static-frame'&&!r.entryStateSha256&&(r.rootFrame??6)===6&&(r.frameDomain??data.frameDomain)===data.frameDomain&&Number.isInteger(r.frame)&&r.frame>=1&&r.frame<=5&&(r.seed>>>0)===s.seed&&(r.replay??0)===s.replay;
export function gs003EntryTransition(level:Gs003Level,fromFrame=1):LessonTextFrameTransition{if(level!==1&&level!==2||![1,3,5].includes(fromFrame))throw new TypeError('GS003 source branch is outside an entry or selector frame');const toFrame=level===1?2:4;return{fromFrame,toFrame,stopFrame:toFrame};}
export const GS003_FRAME_CONTROL={frameDomain:data.frameDomain,completionFrame:5,transitions:([1,3,5]as const).flatMap(f=>([1,2]as const).map(l=>gs003EntryTransition(l,f)))}as const;
export const GS003_COMPLETION={id:'gs003-source-six-correct-feedbacks',frameDomain:data.frameDomain,frames:[2,4]}as const;
export function requestGs003Entry(s:Gs003Session,r:Gs003Runtime):Gs003Session{if(!identity(s,r)||r.paused||r.frame!==1||s.entryRequested)return s;const edge=gs003EntryTransition(s.selectedLevel);return r.onLessonFrameRequest?.(edge)===true?{...s,entryRequested:true}:s;}
export function selectGs003Level(s:Gs003Session,level:Gs003Level,r:Gs003Runtime):Gs003Session{if(!identity(s,r)||r.paused||s.popupOpen||s.entryRequested||![3,5].includes(r.frame)||level!==1&&level!==2)return s;return{...s,selectedLevel:level,focus:null};}
export function startGs003Level(s:Gs003Session,r:Gs003Runtime):Gs003Session{if(!identity(s,r)||r.paused||s.popupOpen||s.entryRequested||![3,5].includes(r.frame))return s;return r.onLessonFrameRequest?.(gs003EntryTransition(s.selectedLevel,r.frame))===true?{...s,entryRequested:true}:s;}
const activity=(kind:'wrong'|'correct',s:Gs003Session)=>GS003_ACTIVITIES.find(a=>a.id===`gs003-level${s.level}-${kind}`)!;
function observed(r:Gs003Runtime,definition:LessonTextActivityDefinition):LessonTextActivitySnapshot|undefined{return(r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[])).find(a=>a.id===definition.id&&a.frameDomain===definition.frameDomain&&a.sourceInstanceId===definition.sourceInstanceId);}
export function chooseGs003Card(s:Gs003Session,id:string,r:Gs003Runtime):Gs003Session{
 if(!identity(s,r)||r.paused||s.popupOpen||!s.cardsEnabled||r.frame!==gs003Level(s.level).frame)return s;
 const selected=s.cards.find(c=>c.id===id),source=gs003Level(s.level).cards.find(c=>c.id===id);if(!selected?.visible||!source)return s;
 if(s.ansClickCount===0)return{...s,ansClickCount:1,chkMcName:id,cards:s.cards.map(c=>c.id===id?{...c,frame:2}:c),focus:null};
 const opposite=`Mc${source.pair}_${source.side===1?2:1}`,match=s.cards.find(c=>c.id===opposite)?.frame===2,kind=match?'correct':'wrong',definition=activity(kind,s),before=observed(r,definition);
 if(r.onLessonActivityRequest?.({id:definition.id,parentFrame:r.frame})!==true)return s;
 const feedback={...s[kind],requested:true,afterRevision:Math.max(s[kind].completedRevision,before?.revision??0),frame:2};
 if(!match)return{...s,cardsEnabled:false,ansClickCount:0,score:s.score-2,cards:s.cards.map(c=>c.id===s.chkMcName?{...c,frame:1}:c),wrong:feedback,focus:'feedback-wrong'};
 return{...s,cardsEnabled:false,ansClickCount:0,score:s.score+10,cards:s.cards.map(c=>c.id===id||c.id===opposite?{...c,frame:1,alpha:100}:c),fades:[...s.fades,{pair:source.pair,...source.fade,elapsedMs:0,appliedTicks:0}],correct:feedback,focus:null};
}
/** Source setInterval steps remain discrete. Modern Pause freezes this local clock. */
export function advanceGs003Fades(s:Gs003Session,elapsedMs:number,r:Gs003Runtime):Gs003Session{
 if(!identity(s,r)||r.paused||!s.fades.length||!Number.isFinite(elapsedMs)||elapsedMs<=0)return s;let cards=[...s.cards];const fades:Gs003Fade[]=[];
 for(const f of s.fades){const elapsed=f.elapsedMs+elapsedMs,ticks=Math.floor(elapsed/f.intervalMs);let applied=f.appliedTicks,done=false;
  while(applied<ticks&&!done){applied++;const names=[`Mc${f.pair}_1`,`Mc${f.pair}_2`];cards=cards.map(c=>names.includes(c.id)?{...c,alpha:c.alpha>0?c.alpha-f.alphaStep:c.alpha,visible:c.alpha>0?c.visible:false,pictureVisible:true}:c);done=names.every(id=>cards.find(c=>c.id===id)?.visible===false);}
  if(!done)fades.push({...f,elapsedMs:elapsed,appliedTicks:applied});
 }
 return{...s,cards,fades};
}
export function openGs003Directions(s:Gs003Session,r:Gs003Runtime):Gs003Session{if(!identity(s,r)||s.popupOpen||r.frame===1)return s;return{...s,popupOpen:true,cardsEnabled:false,focus:'directions-close'};}
export function closeGs003Directions(s:Gs003Session,r:Gs003Runtime):Gs003Session{if(!identity(s,r)||!s.popupOpen)return s;return{...s,popupOpen:false,cardsEnabled:true,focus:'repeat'};}
export function requestGs003Completion(s:Gs003Session,r:Gs003Runtime):Gs003Session{
 if(!identity(s,r)||r.paused||s.completionSent||s.quizSection||s.correctEndCount<6||!GS003_COMPLETION.frames.includes(r.frame as 2|4))return s;
 const request={id:GS003_COMPLETION.id,frameDomain:data.frameDomain,frame:r.frame,seed:s.seed,replay:s.replay};
 return r.onLessonCompletionRequest?.(request)===true?{...s,completionSent:true}:s;
}
export function syncGs003(s:Gs003Session,r:Gs003Runtime):Gs003Session{
 if(!validLevel(r))return s;
 if(s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0))s=createGs003(r.seed,r.replay??0,r.gs003EntryLevel);
 if(s.lastFrame!==r.frame){if(r.frame===1)s=createGs003(r.seed,r.replay??0,r.gs003EntryLevel);else if(r.frame===2||r.frame===4){const level=r.frame===2?1:2;s={...createGs003(r.seed,r.replay??0,level),lastFrame:r.frame};}else s={...s,lastFrame:r.frame,entryRequested:false,popupOpen:false};}
 if(!identity(s,r)||r.frame!==gs003Level(s.level).frame)return s;
 for(const kind of ['wrong','correct']as const){const definition=activity(kind,s),a=observed(r,definition),before=s[kind];if(!before.requested||!a||a.revision<=before.afterRevision||a.revision<=before.completedRevision||a.frame<definition.startFrame||a.frame>definition.endFrame)continue;
  if(before.frame!==a.frame)s={...s,[kind]:{...before,frame:a.frame}};
  if(a.status==='completed'&&a.frame===definition.endFrame){s={...s,cardsEnabled:true,focus:s.popupOpen?s.focus:kind==='wrong'?s.chkMcName:s.cards.find(c=>c.visible&&c.alpha>0)?.id??'repeat',[kind]:{...s[kind],requested:false,completedRevision:a.revision}};if(kind==='correct'){const total=s.totAnsCount+1;s={...s,totAnsCount:total>=6?0:total,correctEndCount:s.correctEndCount+1,quizSection:total>=6?false:s.quizSection};}}
 }
 return s;
}
export function gs003Values(frame:number,s?:Gs003Session){s=s??{...createGs003(0,0,frame>=4?2:1),lastFrame:frame};const playing=frame===2||frame===4,selectors=frame===3||frame===5,level=gs003Level(frame>=4?2:1);return Object.fromEntries(GS003_BINDING.blocks.map(b=>{let value=(data.text as Record<string,string>)[b.id]??'',visible=b.id==='title';if(b.id==='game-title'||b.id==='score-label'||b.id==='repeat')visible=frame>=2;if(b.id==='score-value'){visible=frame>=2;value=String(s!.score);}if(['level1','level2','start'].includes(b.id))visible=selectors;const card=level.cards.find(c=>c.blockId===b.id);if(card)visible=playing&&Boolean(s!.cards.find(c=>c.id===card.id)?.visible)&&Boolean(s!.cards.find(c=>c.id===card.id)!.alpha>0);if(b.id==='wrong'||b.id==='correct'){const feedback=data.feedback.find(f=>f.id===b.id)!;visible=playing&&(feedback.frames.find(f=>f.frame===s![b.id as 'wrong'|'correct'].frame)?.textAlpha??0)>0;}if(b.id.startsWith('directions-'))visible=frame>=2&&s!.popupOpen;return[b.id,{text:value,visible}];}));}
export function gs003Snapshot(state:SourceStaticCanvasFrameState,r:RuntimeContext,s?:Gs003Session){const result=buildLessonTextSnapshot(GS003_BINDING,r,gs003Values(r.frame,s));const valid=state.status==='ready'&&state.animationId===data.animationId&&state.sourceSwfSha256===data.sourceSwfSha256&&state.frame===r.frame&&Number.isInteger(r.frame)&&r.frame>=1&&r.frame<=5&&state.frameDomain===data.frameDomain&&(r.frameDomain??data.frameDomain)===data.frameDomain&&state.rootFrame===6&&(r.rootFrame??6)===6&&state.language==='en'&&r.lang==='en'&&state.scenario==='source-static-frame'&&r.scenario===state.scenario&&state.seed===(r.seed>>>0)&&!r.entryStateSha256;return valid?result:{...result,status:'blocked'as const,blockers:['exact-source-runtime-identity-mismatch'],blocks:result.blocks.map(b=>({...b,visible:false}))};}
