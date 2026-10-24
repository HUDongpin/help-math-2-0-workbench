import {NMS_L02_P003_IR as IR} from './generated/nms-l02-p003-source-ir-v1';
import type {P003FrameState,P003Node} from './nms-l02-p003-timeline-v1';
import type {LessonTextBinding,LessonTextInstanceSegment} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';
const textCharacters=new Set(IR.texts.map(t=>t.characterId));
export const P003_REPLACED_SHAPES:ReadonlySet<number>=new Set([265,266,280,283,285,287,296,305,307,312,315,316,317,318,319,320,323,328,330]);
export function p003ReplacesNode(n:P003Node):boolean{return textCharacters.has(n.characterId)||P003_REPLACED_SHAPES.has(n.characterId);}
export const P003_TEXT_BINDING:LessonTextBinding=Object.freeze({
 schemaVersion:1,version:'nms-l02-p003-native-source-v1',animationId:IR.animationId,placementId:IR.animationId,sourceSwfSha256:IR.sourceSha256,template:'complex-figure',
 blocks:Object.freeze([
  {id:'course-title',sourceTextIds:[],sourceShapeIds:[328],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
  {id:'activity-title',sourceTextIds:['character-327/run-1'],sourceShapeIds:[328],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
  {id:'fruit-summary',sourceTextIds:['character-269'],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
  {id:'fruit-equation',sourceTextIds:[284,286,288,289,290,291,306,308,309,313,314,321,322].map(n=>'character-'+n),sourceShapeIds:[285,287,296,305,307,312,315,316,317,318,319,320,323],role:'label',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 ]as const),
});
/** Exact source character and instance domain survive the1153 depth rearrangement.
 * Later flashing overlays emphasize existing values; they are not new values. */
export function p003TeachingState(s:P003FrameState){
 const value=(id:number)=>s.visibleTexts.filter(t=>t.characterId===id&&t.instancePath.includes('/d1g1c326/sprite-326/')).map(t=>t.runs.map(r=>r.visiblePrefix).join('')).join('');
 const shape=(id:number)=>s.nodes.some(n=>n.characterId===id&&n.domain==='326'&&n.color[3]+n.color[7]>0);
 const frame=s.mainFrame??0;
 const summary=value(269),numerator=value(284),denominator=value(286);
 const ratio=Boolean(numerator&&denominator&&(shape(285)||shape(296)));
 const half=value(288)==='1'&&value(289)==='2'&&value(290).includes('=')&&(shape(287)||shape(296));
 const decimal=value(291)==='0.50'&&value(290)==='==';
 // Maintain emphasis for each source overlay window, removing 6Hz flashes while
 // preserving the order and boundaries of already visible teaching values.
 const emphasis=frame>=1223&&frame<=1229?'numerator':frame>=1231&&frame<=1237?'denominator':frame>=1249&&frame<=1254?'half':frame>=1276&&frame<=1281?'decimal-whole':frame>=1283&&frame<=1291?'decimal-fraction':null;
 return Object.freeze({headingVisible:s.nodes.some(n=>n.characterId===328&&n.domain==='329'&&n.color[3]+n.color[7]>0),summary,numerator,denominator,ratio,half,decimal,emphasis});
}
function instance(n:P003Node){const path:LessonTextInstanceSegment[]=[];for(const m of n.instancePath.matchAll(/(root:\d+|sprite-\d+)\/d(\d+)g(\d+)c(\d+)/gu))path.push(Object.freeze({timelineId:m[1]!.startsWith('root:')?'root':m[1]!,depth:Number(m[2]),generation:Number(m[3]),characterId:Number(m[4])}));return Object.freeze({id:lessonTextInstanceId(path),path:Object.freeze(path)});}
export function p003TextSnapshot(s:P003FrameState){const t=p003TeachingState(s);const eq=(t.ratio?`${t.numerator} / ${t.denominator}`:[t.numerator,t.denominator].filter(Boolean).join('; '))+(t.half?' = 1/2':'')+(t.decimal?' = 0.50':'');const snap=buildLessonTextSnapshot(P003_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:'source-real-world',lang:s.language,seed:s.seed,replay:s.replay},{'course-title':{text:'Fractions, Decimals and Percents Concepts:',visible:t.headingVisible},'activity-title':{text:'Real World Activity',visible:t.headingVisible},'fruit-summary':{text:t.summary,visible:Boolean(t.summary)},'fruit-equation':{text:eq,visible:Boolean(eq)}});return Object.freeze({...snap,suppressedInstances:Object.freeze(snap.status==='ready'?s.nodes.filter(p003ReplacesNode).map(instance):[])});}
