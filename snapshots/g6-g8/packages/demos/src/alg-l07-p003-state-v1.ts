import type {RuntimeContext} from './contract';
import type {LessonTextBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import {ALG_L07_P003_SOURCE as SOURCE} from './alg-l07-p003-source-v1';
export {ALG_L07_P003_SOURCE} from './alg-l07-p003-source-v1';
export const P003_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l07-p003-native-source-v1',animationId:SOURCE.animationId,placementId:SOURCE.animationId,sourceSwfSha256:SOURCE.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:['character-402'],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:['character-402'],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'plans',sourceTextIds:[7,8,9,10,12].map(i=>'character-'+i),role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 {id:'definition',sourceTextIds:[258,268,301,306].map(i=>'character-'+i),role:'body',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 {id:'variables',sourceTextIds:[331,336].map(i=>'character-'+i),role:'body',language:'en',readingOrder:4,valueSource:'maintained-page-state'},
 {id:'equation',sourceTextIds:['character-339'],role:'body',language:'en',readingOrder:5,valueSource:'maintained-page-state'},
 {id:'substitution',sourceTextIds:['character-342','character-355'],role:'body',language:'en',readingOrder:6,valueSource:'maintained-page-state'},
 {id:'result',sourceTextIds:['character-368'],role:'body',language:'en',readingOrder:7,valueSource:'maintained-page-state'},
 {id:'summary',sourceTextIds:['character-375'],role:'body',language:'en',readingOrder:8,valueSource:'maintained-page-state'},
 {id:'expanded-summary',sourceTextIds:['character-379'],role:'body',language:'en',readingOrder:9,valueSource:'maintained-page-state'},
 ]as const)});
export function algL07P003Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-401',scenario:'source-real-world',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-401';if(!['root','sprite-401'].includes(domain)||!Number.isSafeInteger(frame)||frame<1||frame>(domain==='root'?10:2141)||!['en','es'].includes(context.lang)||context.scenario!=='source-real-world'||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295)throw Error('invalid-p003-source-state');
 const ready=domain!=='root'||frame>=6,mainFrame=domain==='root'?1:frame;
 const visible=(id:number)=>ready&&Boolean(SOURCE.texts.find(t=>t.characterId===id)?.frameRanges.some(([a,b])=>mainFrame>=a&&mainFrame<=b));
 const text=(id:number)=>visible(id)?SOURCE.texts.find(t=>t.characterId===id)!.text.trim():'';
 const definition=visible(301)?[text(301),text(306)].filter(Boolean).join(' '):text(258);
 const values={ 'course-title':{text:'Linear and Nonlinear Functions:',visible:ready},'activity-title':{text:'Real World Activity',visible:ready},
  plans:{text:'Cell Phone Service Plans. Smooth Talk: $0 monthly fee, $0.20 per minute. Easy Talk: $50 monthly fee, $0.05 per minute. Super Talk: $60 monthly fee, $0.03 per minute.',visible:ready},
  definition:{text:definition,visible:Boolean(definition)},variables:{text:[text(331),text(336)].filter(Boolean).join('. '),visible:visible(331)||visible(336)},
  equation:{text:text(339),visible:visible(339)},substitution:{text:text(342),visible:visible(342)},result:{text:text(368),visible:visible(368)},summary:{text:text(375),visible:visible(375)},'expanded-summary':{text:text(379),visible:visible(379)}};
 const termAvailable=Object.fromEntries(SOURCE.glossaryButtons.map(b=>[b.key,ready&&b.frameRanges.some(([a,z])=>mainFrame>=a&&mainFrame<=z)]))as Readonly<Record<'Function'|'Relation'|'Value',boolean>>;
 return Object.freeze({animationId:SOURCE.animationId,frame,mainFrame,frameDomain:domain,rootFrame:domain==='root'?frame:6,language:context.lang,seed:context.seed,replay:context.replay??0,ready,definition,
  variables:Object.freeze([text(331),text(336)].filter(Boolean)),equation:text(339),substitution:text(342),result:text(368),summary:text(375),expandedSummary:text(379),expandedSummaryAlpha:SOURCE.expandedSummaryAlpha[mainFrame-1]!,termAvailable,
  sourceTextIds:Object.freeze(SOURCE.texts.filter(t=>t.characterId===402?ready:visible(t.characterId)).map(t=>t.sourceTextId)),
  rowAssociation:SOURCE.rowAssociation[mainFrame-1]!,suppressInstanceIds:Object.freeze([...SOURCE.sourceTextInstanceIds[mainFrame-1]!,...SOURCE.nativeGraphicInstanceIds[mainFrame-1]!]),textSnapshot:buildLessonTextSnapshot(P003_TEXT_BINDING,{...context,frame,frameDomain:domain,rootFrame:domain==='root'?frame:6},values)});
}
export type AlgL07P003Frame=ReturnType<typeof algL07P003Frame>;
