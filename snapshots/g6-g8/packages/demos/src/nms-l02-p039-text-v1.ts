import type {LessonTextBinding,LessonTextBlockBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import {P039_INTRO_SOURCE as SOURCE} from './generated/nms-l02-p039-intro-source-v1';
import {P039_PAGE_TITLE} from './generated/nms-l02-p039-page-title-source-v1';
import {P039_COPY,p039Feedback} from './nms-l02-p039-copy-v1';
import {p039IntroAt} from './nms-l02-p039-intro-v1';
import type {P039FrameState} from './nms-l02-p039-frame-v1';
const block=(id:string,ids:readonly string[],shapes:readonly number[],role:LessonTextBlockBinding['role'],language:'en'|'es',readingOrder:number):LessonTextBlockBinding=>Object.freeze({id,sourceTextIds:Object.freeze([...ids]),sourceShapeIds:Object.freeze([...shapes]),role,language,readingOrder,valueSource:'maintained-page-state'});
const instructionIds=SOURCE.sentences.map(s=>Object.freeze([...new Set(s.glyphs.map(g=>g.id.split('/')[0]))]));
/** Language labels describe native output language. Spanish UI copy is a
 * maintained translation of the referenced semantic role, not Spanish source bytes.
 * XML page title, fallback notice and native completion status are separate UI copy. */
export const P039_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p039-native-source-v1',animationId:SOURCE.animationId,placementId:SOURCE.animationId,sourceSwfSha256:SOURCE.sourceSha256,template:'exercise',blocks:Object.freeze([
 block('course-title',[],[108],'heading','en',0),block('activity-title',[],[108],'title','en',1),
 block('instruction-1',instructionIds[0],[],'question','en',2),block('instruction-2',instructionIds[1],[],'body','en',3),
 ...(['en','es']as const).flatMap((language,i)=>[
  block('control-done-'+language,['character-116'],[],'label',language,6+i),
  block('control-reset-'+language,['character-115'],[],'label',language,8+i),
  block('control-close-'+language,['character-217'],[],'label',language,16+i),
  block('selected-percent-'+language,['character-212','character-213','character-214'],[],'answer',language,4+i),
  block('feedback-wrong-'+language,['character-226'],[],'feedback',language,10+i),
  block('feedback-correct-'+language,['character-233'],[],'feedback',language,12+i),
  block('feedback-reveal-'+language,['character-212','character-213','character-214'],[],'feedback',language,14+i),
 ]),
])});
export function p039TextValues(s:P039FrameState){
 const visible=s.mainFrame!==null,state=s.state,sentences=state.mainFrame<546?p039IntroAt(state.mainFrame).sentences:SOURCE.sentences.map(x=>({maskedText:x.text}));
 const values:Record<string,{text:string;visible:boolean}>={
  'course-title':{text:P039_PAGE_TITLE.courseHeading,visible},'activity-title':{text:P039_PAGE_TITLE.activityHeading,visible},
 };
 sentences.forEach((x,i)=>{const text=x.maskedText.replace(/\u00a0/g,' ').trim();values['instruction-'+(i+1)]={text,visible:visible&&text.length>0};});
 for(const language of ['en','es']as const){const shown=visible&&s.language===language,l=P039_COPY[language],feedback=p039Feedback(state,language);
  values['control-done-'+language]={text:l.done,visible:shown};values['control-reset-'+language]={text:l.reset,visible:shown};values['control-close-'+language]={text:l.close,visible:shown&&state.popupVisible};
  values['selected-percent-'+language]={text:l.slider+': '+state.percent+'%',visible:shown&&state.mainFrame>=546};
  for(const kind of ['wrong','correct','reveal']as const)values['feedback-'+kind+'-'+language]={text:feedback.kind===kind?feedback.text:'',visible:shown&&feedback.kind===kind};
 }
 return values;
}
export function p039TextSnapshot(s:P039FrameState){return buildLessonTextSnapshot(P039_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang:s.language,seed:s.seed,replay:s.replay},p039TextValues(s));}
