import {NMS_L02_P008_IR as IR} from './generated/nms-l02-p008-source-ir-v1';
import type {P008FrameState,P008Node} from './nms-l02-p008-timeline-v1';
import type {LessonTextBinding,LessonTextInstanceSegment} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';
const textCharacters=new Set(IR.texts.map(t=>t.characterId));
export const P008_REPLACED_SHAPES:ReadonlySet<number>=new Set([3,4,6,8,12,15,27]);
export function p008ReplacesNode(n:P008Node){return textCharacters.has(n.characterId)||P008_REPLACED_SHAPES.has(n.characterId);}
export const P008_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p008-native-source-v1',animationId:IR.animationId,placementId:IR.animationId,sourceSwfSha256:IR.sourceSha256,template:'complex-figure',blocks:Object.freeze([
{id:'course-title',sourceTextIds:['character-2/run-0'],sourceShapeIds:[3],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
{id:'activity-title',sourceTextIds:['character-2/run-0'],sourceShapeIds:[3],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
{id:'definition',sourceTextIds:['character-7','character-13'],sourceShapeIds:[6,12],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
{id:'explanation',sourceTextIds:['character-16','character-28'],sourceShapeIds:[15,27],role:'body',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
{id:'tenths-label',sourceTextIds:['character-20','character-23'],sourceShapeIds:[30,31,32],role:'label',language:'en',readingOrder:4,valueSource:'maintained-page-state'},
{id:'tenths-value',sourceTextIds:['character-33'],role:'label',language:'en',readingOrder:5,valueSource:'maintained-page-state'},
{id:'hundredths-label',sourceTextIds:['character-26'],role:'label',language:'en',readingOrder:6,valueSource:'maintained-page-state'},
{id:'hundredths-value',sourceTextIds:['character-38'],role:'label',language:'en',readingOrder:7,valueSource:'maintained-page-state'},
]as const)});
export const P008_TERM_RUNS=Object.freeze({'character-7/run-1':'Decimal','character-7/run-3':'Decimal point','character-13/run-0':'Place value','character-16/run-1':'Fraction','character-16/run-3':'Power','character-28/run-1':'Whole'}as const);
export function p008TeachingState(s:P008FrameState){
 const at=(id:number)=>s.visibleTexts.find(t=>t.characterId===id&&t.instancePath.startsWith('root:6/d3g1c39/sprite-39/'));
 const visible=(id:number)=>s.nodes.some(n=>n.characterId===id&&n.color[3]+n.color[7]>0);
 const runs=(...ids:number[])=>ids.flatMap(id=>at(id)?.runs??[]);
 const definitionRuns=runs(7,13),explanationRuns=runs(16,28),allRuns=[...definitionRuns,...explanationRuns];
 const label=at(20)??at(23),outlinedLabel=[30,31,32].some(visible),hundredths=at(26),tenthsValue=at(33),hundredthsValue=at(38);
 const first=(t:typeof label)=>t?.runs[0];
 return Object.freeze({headingVisible:visible(3),definitionRuns,explanationRuns,allRuns,definition:definitionRuns.map(r=>r.visiblePrefix).join(''),explanation:explanationRuns.map(r=>r.visiblePrefix).join(''),tenthsVisible:[19,21,30,31,32].some(visible),hundredthsVisible:[24,25,34,35,36,37].some(visible),tenthsLabel:outlinedLabel?'Tenths':first(label)?.visiblePrefix??'',tenthsLabelAlpha:outlinedLabel?1:first(label)?.alpha??0,hundredthsLabel:first(hundredths)?.visiblePrefix??'',hundredthsLabelAlpha:first(hundredths)?.alpha??0,tenthsValue:first(tenthsValue)?.visiblePrefix??'',tenthsValueAlpha:first(tenthsValue)?.alpha??0,hundredthsValue:first(hundredthsValue)?.visiblePrefix??'',hundredthsValueAlpha:first(hundredthsValue)?.alpha??0,tenthsShaded:visible(32)?3:visible(31)?2:visible(30)?1:0,hundredthsShaded:visible(37)?35:visible(36)?30:visible(35)?20:visible(34)?10:0});
}
function instance(n:P008Node){const path:LessonTextInstanceSegment[]=[];for(const m of n.instancePath.matchAll(/(root:\d+|sprite-\d+)\/d(\d+)g(\d+)c(\d+)/gu))path.push(Object.freeze({timelineId:m[1]!.startsWith('root:')?'root':m[1]!,depth:Number(m[2]),generation:Number(m[3]),characterId:Number(m[4])}));return Object.freeze({id:lessonTextInstanceId(path),path:Object.freeze(path)});}
export function p008TextSnapshot(s:P008FrameState){const t=p008TeachingState(s),snap=buildLessonTextSnapshot(P008_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:'source-vocabulary',lang:s.language,seed:s.seed,replay:s.replay},{'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible:t.headingVisible},'activity-title':{text:'Vocabulary',visible:t.headingVisible},definition:{text:t.definition,visible:Boolean(t.definition)},explanation:{text:t.explanation,visible:Boolean(t.explanation)},'tenths-label':{text:t.tenthsLabel,visible:Boolean(t.tenthsLabel)},'tenths-value':{text:t.tenthsValue,visible:Boolean(t.tenthsValue)},'hundredths-label':{text:t.hundredthsLabel,visible:Boolean(t.hundredthsLabel)},'hundredths-value':{text:t.hundredthsValue,visible:Boolean(t.hundredthsValue)}});return Object.freeze({...snap,suppressedInstances:Object.freeze(snap.status==='ready'?s.nodes.filter(p008ReplacesNode).map(instance):[])});}
