import {NMS_L02_P007_IR as IR} from './generated/nms-l02-p007-source-ir-v1';
import type {P007FrameState,P007Node} from './nms-l02-p007-timeline-v1';
import type {LessonTextBinding,LessonTextInstanceSegment} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';
const textCharacters=new Set(IR.texts.map(t=>t.characterId));
export const P007_REPLACED_SHAPES:ReadonlySet<number>=new Set([3,4,6,8,16,23]);
export function p007ReplacesNode(n:P007Node){return textCharacters.has(n.characterId)||P007_REPLACED_SHAPES.has(n.characterId);}
export const P007_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p007-native-source-v1',animationId:IR.animationId,placementId:IR.animationId,sourceSwfSha256:IR.sourceSha256,template:'complex-figure',blocks:Object.freeze([
{id:'course-title',sourceTextIds:['character-2/run-0'],sourceShapeIds:[3],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
{id:'activity-title',sourceTextIds:['character-2/run-0'],sourceShapeIds:[3],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
{id:'definition',sourceTextIds:['character-7'],sourceShapeIds:[6],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
{id:'half',sourceTextIds:['character-17'],sourceShapeIds:[16],role:'label',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
{id:'two-thirds',sourceTextIds:['character-24'],sourceShapeIds:[23],role:'label',language:'en',readingOrder:4,valueSource:'maintained-page-state'},
]as const)});
export const P007_TERM_RUNS=Object.freeze({'character-7/run-0':'Fraction','character-7/run-2':'Whole','character-7/run-4':'Group'}as const);
export function p007TeachingState(s:P007FrameState){
 const at=(id:number)=>s.visibleTexts.find(t=>t.characterId===id&&t.instancePath.startsWith('root:6/d3g1c35/sprite-35/'));
 const visible=(id:number)=>s.nodes.some(n=>n.characterId===id&&n.color[3]+n.color[7]>0);
 const definitionRuns=at(7)?.runs??[],half=at(17),thirds=at(24);
 const fraction=(text:typeof half,bar:number,top:string,bottom:string)=>Boolean(visible(bar)&&text?.runs[0]?.visiblePrefix===top&&text?.runs[1]?.visiblePrefix===bottom);
 return Object.freeze({headingVisible:visible(3),definitionRuns,definition:definitionRuns.map(r=>r.visiblePrefix).join(''),halfVisible:visible(12),thirdsVisible:visible(20),halfFraction:fraction(half,16,'1','2'),thirdsFraction:fraction(thirds,23,'2','3'),halfAlpha:half?.runs[0]?.alpha??0,thirdsAlpha:thirds?.runs[0]?.alpha??0});
}
function instance(n:P007Node){const path:LessonTextInstanceSegment[]=[];for(const m of n.instancePath.matchAll(/(root:\d+|sprite-\d+)\/d(\d+)g(\d+)c(\d+)/gu))path.push(Object.freeze({timelineId:m[1]!.startsWith('root:')?'root':m[1]!,depth:Number(m[2]),generation:Number(m[3]),characterId:Number(m[4])}));return Object.freeze({id:lessonTextInstanceId(path),path:Object.freeze(path)});}
export function p007TextSnapshot(s:P007FrameState){const t=p007TeachingState(s),snap=buildLessonTextSnapshot(P007_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:'source-vocabulary',lang:s.language,seed:s.seed,replay:s.replay},{'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible:t.headingVisible},'activity-title':{text:'Vocabulary',visible:t.headingVisible},definition:{text:t.definition,visible:Boolean(t.definition)},half:{text:'1/2',visible:t.halfFraction},'two-thirds':{text:'2/3',visible:t.thirdsFraction}});return Object.freeze({...snap,suppressedInstances:Object.freeze(snap.status==='ready'?s.nodes.filter(p007ReplacesNode).map(instance):[])});}
