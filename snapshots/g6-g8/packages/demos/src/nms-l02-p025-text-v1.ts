import {NMS_L02_P025_IR as IR} from './generated/nms-l02-p025-source-ir-v1';
import type {P025FrameState,P025Node} from './nms-l02-p025-timeline-v1';
import type {LessonTextBinding,LessonTextInstanceSegment} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';
import {p025TeachingState} from './nms-l02-p025-teaching-v1';
export {p025TeachingState,type P025TermKey} from './nms-l02-p025-teaching-v1';
const textCharacters=new Set(IR.texts.map(t=>t.characterId));
export const P025_REPLACED_SHAPES:ReadonlySet<number>=new Set([1,2,3,4,7,11,12,13,16,17,21,22,25,26,29,30,32,33,34,35]);
export const P025_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p025-native-source-v1',animationId:IR.animationId,placementId:IR.animationId,sourceSwfSha256:IR.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'definition',sourceTextIds:['character-6'],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 {id:'fractions',sourceTextIds:['character-14','character-15','character-18','character-19','character-20','character-23','character-24','character-27','character-28','character-31'],sourceShapeIds:[13,17,22,26,30,32,33,34,35],role:'body',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
]as const)});
function instance(n:P025Node){const path:LessonTextInstanceSegment[]=[];for(const m of n.instancePath.matchAll(/(root:\d+|sprite-\d+)\/d(\d+)g(\d+)c(\d+)/gu))path.push(Object.freeze({timelineId:m[1]!.startsWith('root:')?'root':m[1]!,depth:Number(m[2]),generation:Number(m[3]),characterId:Number(m[4])}));return Object.freeze({id:lessonTextInstanceId(path),path:Object.freeze(path)});}
export function p025TextSnapshot(s:P025FrameState){
 const t=p025TeachingState(s),definition=t.definition.map(r=>r.visibleText).join(''),fractions=t.fractions.map(f=>`${f.numerator}/${f.denominator}`).join(t.equality?' = ':'; ');
 const snap=buildLessonTextSnapshot(P025_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:'source-instruction',lang:s.language,seed:s.seed,replay:s.replay},{'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible:t.headingVisible},'activity-title':{text:'Instruction',visible:t.headingVisible},definition:{text:definition,visible:definition.length>0},fractions:{text:fractions,visible:fractions.length>0}});
 return Object.freeze({...snap,suppressedInstances:Object.freeze(snap.status==='ready'?s.nodes.filter(n=>textCharacters.has(n.characterId)||P025_REPLACED_SHAPES.has(n.characterId)).map(instance):[])});
}
