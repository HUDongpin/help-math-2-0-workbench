import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import type {LessonTextBinding,LessonTextRole} from './lesson-text-contract';
import {p052BoundCapture,type P052CaptureIdentityRequest} from './nms-l02-p052-capture-identity-v1';
import {p052Copy,p052ShadeSummary,P052_COPY_SOURCE_IDS} from './nms-l02-p052-copy-v1';
import {p052IntroText} from './nms-l02-p052-intro-view-v1';
import {p052IntroScene} from './nms-l02-p052-intro-scene-v1';
const digitIds=[...new Set(Array.from({length:114},(_,i)=>p052IntroScene(i+1)).flat()
 .filter(o=>o.kind==='text'&&/^\d$/.test(o.text??'')).map(o=>o.characterId))];
const specs:readonly [string,readonly number[],LessonTextRole][]=[
 ['title',P052_COPY_SOURCE_IDS.title,'title'],['question',P052_COPY_SOURCE_IDS.question,'question'],
 ['prompt',P052_COPY_SOURCE_IDS.prompt,'body'],['done',P052_COPY_SOURCE_IDS.done,'label'],
 ['reset',P052_COPY_SOURCE_IDS.reset,'label'],['help',P052_COPY_SOURCE_IDS.help,'label'],
 ['digits',digitIds,'answer'],['summary',P052_COPY_SOURCE_IDS.prompt,'label'],
 ['slider',P052_COPY_SOURCE_IDS.prompt,'label'],['keyboard',P052_COPY_SOURCE_IDS.prompt,'body'],
 ['feedback',[321,330],'feedback'],['feedback-close',[312],'label'],
 ['help-heading',[4,5],'heading'],['help-explanation',[340],'body'],['row-column-note',[340],'body'],
 ['example',[339],'label'],['term-Square',[340],'label'],['term-Column',[340],'label'],
 ['help-close',[312],'label'],['glossary-title',[340],'heading'],['glossary-definition',[340],'body'],
 ['glossary-close',[312],'label'],['paused',P052_COPY_SOURCE_IDS.prompt,'label'],['resume',P052_COPY_SOURCE_IDS.prompt,'label'],
];
/** Source IDs anchor semantic decisions, not verbatim provenance for new UI.
 * Keyboard/summary/pause and row-column note are maintained accessibility copy.
 * ES page copy is translated; glossary values retain separately generated XML
 * provenance. No old glyph suppression: these views already use native HTML. */
export const P052_TEXT_BINDING:LessonTextBinding={schemaVersion:1,version:'p052-native-text-v1',
 animationId:'shared-nms002-l02-p052',placementId:'shared-nms002-l02-p052',
 sourceSwfSha256:'5efa48905e74c0dd604b9e896bee1a1b4cfb1fe0839044686527fe96e1311638',template:'exercise',
 blocks:specs.map(([id,ids,role],readingOrder)=>({id,sourceTextIds:ids.map(n=>`character-${n}`),role,
  readingOrder,language:'en',valueSource:'maintained-page-state'}))};
/** Exact candidate query only; live host state needs its own admitted adapter. */
export function p052TextSnapshot(request:P052CaptureIdentityRequest){
 const result=p052BoundCapture(request),s=result.state,lang=result.language,copy=p052Copy(lang);
 const intro=s.phase==='intro'&&s.frame<115,projection=intro?p052IntroText(s.frame,lang):null;
 const controls=s.phase==='practice'||s.phase==='intro'&&s.frame===115;
 const feedback=s.phase==='wrong'||s.phase==='right',glossary=s.glossary?copy.glossary[s.glossary]:null;
 const values:Record<string,{text:string;visible:boolean}>={};
 const add=(id:string,text:string,visible=true)=>{values[id]={text,visible};};
 add('title',copy.title);add('question',copy.question,!intro||projection!.questionAlpha>0);
 add('prompt',copy.prompt,!intro||projection!.promptAlpha>0);
 for(const [id,sourceId] of [['done',168],['reset',170]] as const)
  add(id,copy[id],intro?projection!.labels.some(l=>l.sourceId===sourceId&&l.alpha>0):controls);
 add('help',copy.help,controls);
 add('digits',intro?projection!.digits??'':String(s.percent).padStart(3,'0')+'%',!intro||projection!.labels.some(l=>l.kind==='digit'&&l.alpha>0));
 add('summary',intro?projection!.summary??copy.slider:p052ShadeSummary(s.percent,lang));
 add('slider',copy.slider,controls);add('keyboard',copy.keyboard,controls);
 add('feedback',s.phase==='wrong'?copy.retry:copy.answer,feedback);add('feedback-close',copy.close,feedback);
 add('help-heading',copy.help,s.help);add('help-explanation',copy.helpExplanation,s.help);
 add('row-column-note',copy.rowColumnNote,s.help);add('example',copy.example,s.help);
 for(const term of ['Square','Column'] as const)add(`term-${term}`,copy.glossary[term].title,s.help);
 add('help-close',copy.close,s.help);add('glossary-title',glossary?.title??'',!!glossary);
 add('glossary-definition',glossary?.definition??'',!!glossary);add('glossary-close',copy.close,!!glossary);
 add('paused',copy.paused,!intro&&s.paused);add('resume',lang==='es'?'Continuar':'Resume',s.paused&&(feedback||s.help||!!glossary));
 return buildLessonTextSnapshot({...P052_TEXT_BINDING,blocks:P052_TEXT_BINDING.blocks.map(b=>({...b,language:lang}))},
  {frame:s.frame,frameDomain:result.frameDomain,rootFrame:6,scenario:result.scenario,lang,seed:s.seed,replay:s.epoch},values);
}
