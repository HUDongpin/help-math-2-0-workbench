import type {RuntimeContext,AnimationRendererProps} from '../contract';
import type {TextPresentationSnapshot,LessonTextBinding} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import {getCourseG04L04In004FrameState} from '../modules/course-g04-l04-in-004';
import {G4_L4_IN004_CAPABILITY_CONFIG as META} from './generated/g4-l4-in004-capability-config';
import {G4_L4_IN004_NATIVE_CONFIG as C} from './generated/g4-l4-in004-native-config';
import {getIn004IntroState} from './g4-l4-in004-intro';
import {in004OwnedActivities,type In004Session} from './g4-l4-in004-host-state';
export const IN004_BINDING:LessonTextBinding=META.binding;
validateLessonTextBinding(IN004_BINDING);
export function getIn004TextSnapshot(state:SourceStaticCanvasFrameState,r:RuntimeContext,session?:In004Session,activities:AnimationRendererProps['lessonActivities']=[]):TextPresentationSnapshot {
 const expected=getCourseG04L04In004FrameState(r.frame,r),valid=Boolean(state&&state.status==='ready'&&expected.status==='ready'&&state.animationId===C.animationId&&state.sourceSwfSha256===C.sourceSwfSha256&&state.frame===r.frame&&Number.isInteger(r.frame)&&r.frame>=1&&r.frame<=483&&state.frameDomain==='sprite-207'&&(r.frameDomain??'sprite-207')==='sprite-207'&&state.rootFrame===6&&(r.rootFrame??6)===6&&state.language==='en'&&r.lang==='en'&&state.scenario==='source-static-frame'&&r.scenario===state.scenario&&state.seed===(r.seed>>>0)&&!r.entryStateSha256);
 const intro=getIn004IntroState(Math.max(1,Math.min(470,Number.isInteger(r.frame)?r.frame:1))),q=C.questions.find(q=>q.frame===r.frame),p=session?.practice;
 const practice=Boolean(q&&(session===undefined||p?.question===q.id));
 const values:Record<string,{text:string;visible:boolean}>={title:{text:C.copy.title.text,visible:true},newProblem:{text:C.copy.newProblem.text,visible:true},wrong:{text:C.copy.wrong.text,visible:practice&&Boolean(p?.wrongOpen)},close:{text:C.copy.close.text,visible:practice&&Boolean(p?.wrongOpen)},correct:{text:C.copy.correct.text,visible:practice&&Boolean(session&&in004OwnedActivities(session,activities).some(a=>a.id==='in004-g4l4-final'&&a.status==='playing'&&a.frame>=2&&a.frame<25))}};
 for(const [id,cid] of [['instruction',33],['dragInstruction',41]] as const){const t=intro.body.find(t=>t.characterId===cid);values[id]={text:t?.visibleTokens.map(t=>t.text).join('')??'',visible:Boolean(t)};}
 for(const t of C.ticks)values['tick-'+t.value]={text:t.text,visible:r.frame<=470||practice};
 for(const id of ['minus8','minus5','plus5','plus8']){const g=intro.groups.find(g=>g.id===id);values['intro-'+id]={text:g?.text??'',visible:r.frame<=470&&Boolean(g)};}
 values['intro-equation']={text:intro.equation?.text??'',visible:r.frame<=470&&Boolean(intro.equation)};
 values.question={text:q?.equation.text??'',visible:practice};values.answer={text:p?.answer??'',visible:practice&&Boolean(p?.answer)};
 for(const name of ['Mc_Jump_1','Mc_Jump_2','Mc_Jump_3','Mc_Jump_4']){const card=q?.cards.find(c=>c.name===name);values[name]={text:card?.label.text??'',visible:practice&&Boolean(card)};}
 return{schemaVersion:1,animationId:C.animationId,bindingVersion:IN004_BINDING.version,sourceSwfSha256:C.sourceSwfSha256,status:valid?'ready':'blocked',blockers:valid?[]:['exact-source-runtime-identity-mismatch'],identity:{frame:state?.frame??r.frame,frameDomain:state?.frameDomain??'sprite-207',rootFrame:state?.rootFrame??6,scenario:r.scenario,language:r.lang,seed:r.seed,replay:r.replay??0},suppressedInstances:[],blocks:IN004_BINDING.blocks.map(b=>({id:b.id,role:b.role,language:b.language,readingOrder:b.readingOrder,text:values[b.id].text,visible:valid&&values[b.id].visible}))};
}
