import {NMS_L02_P023_IR as IR} from './generated/nms-l02-p023-source-ir-v1';
import type {P023FrameState,P023Node} from './nms-l02-p023-timeline-v1';
import type {LessonTextBinding,LessonTextInstanceSegment} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';
export type P023TermKey='Fraction'|'Number line'|'Whole'|'Part';
const textCharacters=new Set(IR.texts.map(t=>t.characterId));
export const P023_REPLACED_SHAPES:ReadonlySet<number>=new Set([1,2,3,7,8,9,10,11,12,13,14,15,17,18,19,20,22]);
export const P023_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p023-native-source-v1',animationId:IR.animationId,placementId:IR.animationId,sourceSwfSha256:IR.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'zero',sourceTextIds:['character-5'],sourceShapeIds:[17],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 {id:'one',sourceTextIds:['character-6'],sourceShapeIds:[18],role:'body',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 {id:'half',sourceTextIds:['character-6','character-16'],sourceShapeIds:[15],role:'body',language:'en',readingOrder:4,valueSource:'maintained-page-state'},
 {id:'definition',sourceTextIds:['character-21','character-27'],role:'body',language:'en',readingOrder:5,valueSource:'maintained-page-state'},
]as const)});
export function p023TeachingState(s:P023FrameState){
 const at=(id:number)=>s.visibleTexts.find(t=>t.characterId===id),first=at(21)?.runs??[],second=at(27)?.runs??[];
 const row=IR.teachingStates[IR.teachingFrames[(s.mainFrame??1)-1]!]!;
 return Object.freeze({...row,headingVisible:s.nodes.some(n=>n.characterId===1&&n.color[3]+n.color[7]>0),first,second,termAvailable:Object.freeze({Fraction:Boolean(first[0]?.complete),Part:Boolean(first[2]?.complete),Whole:Boolean(first[4]?.complete),'Number line':Boolean(first[6]?.complete)})});
}
function instance(n:P023Node){const path:LessonTextInstanceSegment[]=[];for(const m of n.instancePath.matchAll(/(root:\d+|sprite-\d+)\/d(\d+)g(\d+)c(\d+)/gu))path.push(Object.freeze({timelineId:m[1]!.startsWith('root:')?'root':m[1]!,depth:Number(m[2]),generation:Number(m[3]),characterId:Number(m[4])}));return Object.freeze({id:lessonTextInstanceId(path),path:Object.freeze(path)});}
export function p023TextSnapshot(s:P023FrameState){
 const t=p023TeachingState(s),definition=t.first.map(r=>r.visibleText).join('')+t.second.map(r=>r.visibleText).join('');
 const values={'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible:t.headingVisible},'activity-title':{text:'Instruction',visible:t.headingVisible},zero:{text:'0',visible:t.axisAlpha>0},one:{text:'1',visible:t.axisAlpha>0},half:{text:'1/2',visible:t.halfAlpha>0},definition:{text:definition,visible:definition.length>0}};
 const snap=buildLessonTextSnapshot(P023_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:'source-instruction',lang:s.language,seed:s.seed,replay:s.replay},values);
 return Object.freeze({...snap,suppressedInstances:Object.freeze(snap.status==='ready'?s.nodes.filter(n=>textCharacters.has(n.characterId)||P023_REPLACED_SHAPES.has(n.characterId)).map(instance):[])});
}
