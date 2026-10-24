import type {AnimationRendererProps} from '../contract';
import type {LessonTextBinding,TextPresentationSnapshot} from '../lesson-text-contract';
import type {CourseG04L03Ti004LeastToGreatestDragState} from '../timelines/course-g04-l03-ti-004-least-to-greatest-drag-interaction';
import {COURSE_G04_L03_TI_004_CARDS as cards} from '../timelines/course-g04-l03-ti-004-least-to-greatest-drag-interaction';
import source from './generated/g4-l3-ti004-question.json';
export const TI004_BINDING=source.binding as LessonTextBinding;
export function getTi004TextSnapshot(state:unknown,context:AnimationRendererProps,interaction?:CourseG04L03Ti004LeastToGreatestDragState,helpOpen=false):TextPresentationSnapshot{
 const s=state as Record<string,unknown>|null,blockers:string[]=[];
 if(!s||s.animationId!==TI004_BINDING.animationId||s.sourceSwfSha256!==source.sourceSha256)blockers.push('source-identity-mismatch');
 if(!s||s.status!=='ready'||s.blocker)blockers.push('source-state-not-ready');
 if(!Number.isInteger(context.frame)||context.frame<1||context.frame>124||(context.frameDomain??'sprite-274')!=='sprite-274'||(context.rootFrame??6)!==6||context.scenario!=='source-static-frame'||context.lang!=='en'||context.entryStateSha256)blockers.push('unsupported-native-context');
 if(s&&(s.frame!==context.frame||s.frameDomain!==(context.frameDomain??'sprite-274')||s.rootFrame!==(context.rootFrame??6)||s.scenario!==context.scenario||s.language!==context.lang||s.seed!==context.seed))blockers.push('source-context-mismatch');
 const question=context.frame===124,intro=source.frames[Math.max(0,Math.min(123,context.frame-1))]!;
 if(question&&!interaction)blockers.push('interaction-state-required');
 const values:Record<string,string>={'question-number':intro.number,'instruction-first':intro.instruction,'instruction-ending':intro.ending,least:intro.least,greatest:intro.greatest,'help-button':source.texts['4'],'help-negative':source.texts['240'],'help-positive':source.texts['241'],close:source.texts['214'],'wrong-feedback':source.texts['222'],'complete-feedback':source.texts['235']};
 return {schemaVersion:1,animationId:TI004_BINDING.animationId,bindingVersion:TI004_BINDING.version,sourceSwfSha256:source.sourceSha256,status:blockers.length?'blocked':'ready',blockers,identity:{frame:context.frame,frameDomain:context.frameDomain??'sprite-274',rootFrame:context.rootFrame??6,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0},suppressedInstances:[],blocks:blockers.length?[]:TI004_BINDING.blocks.map(b=>{
  let text=values[b.id]??'',visible=Boolean(text);
  if(b.id.startsWith('card-')){text=cards.find(c=>c.id===b.id.slice(5))!.valueText.replace('-','−');visible=intro.cards;}
  if(b.id.startsWith('help-tick-')){text=source.helpAxis.find(t=>t.value===Number(b.id.slice(10)))!.label;visible=question&&helpOpen;}
  if(b.id==='question-number'&&question)visible=false;
  if(b.id==='help-button')visible=question;
  if(['help-negative','help-positive'].includes(b.id))visible=question&&helpOpen;
  if(b.id==='close')visible=question&&(helpOpen||interaction?.outcome==='wrong');
  if(b.id==='wrong-feedback')visible=question&&interaction?.outcome==='wrong';
  if(b.id==='complete-feedback')visible=question&&interaction?.outcome==='complete';
  return {id:b.id,text,role:b.role,language:b.language,readingOrder:b.readingOrder,visible};
 })};
}
