import {NMS_L02_P006_IR as IR} from './generated/nms-l02-p006-source-ir-v1';
import type {P006FrameState,P006Node} from './nms-l02-p006-timeline-v1';
import type {LessonTextBinding,LessonTextInstanceSegment} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';
const textCharacters=new Set(IR.texts.map(t=>t.characterId));
export const P006_REPLACED_SHAPES:ReadonlySet<number>=new Set([39,40,42,45,50,56,58]);
export function p006ReplacesNode(n:P006Node){return textCharacters.has(n.characterId)||P006_REPLACED_SHAPES.has(n.characterId);}
export const P006_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p006-native-source-v1',animationId:IR.animationId,placementId:IR.animationId,sourceSwfSha256:IR.sourceSha256,template:'complex-figure',blocks:Object.freeze([
{id:'course-title',sourceTextIds:[],sourceShapeIds:[56],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
{id:'activity-title',sourceTextIds:['character-55/run-1'],sourceShapeIds:[56],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
{id:'essential-heading',sourceTextIds:['character-44/run-0'],role:'heading',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
{id:'essential-question',sourceTextIds:['character-44/run-2','character-44/run-3','character-51'],sourceShapeIds:[42,50],role:'body',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
]as const)});
export type P006TermKey='Convert'|'Fraction'|'Decimal'|'Percent';
export interface P006QuestionPart{readonly text:string;readonly sourceTextId:string;readonly term?:P006TermKey;readonly complete:boolean;}
export function p006TeachingState(s:P006FrameState){
 const run=(id:string)=>s.visibleTexts.flatMap(t=>t.runs).find(r=>r.sourceTextId===id)?.visiblePrefix??'';
 const combined=run('character-44/run-3'),parts:P006QuestionPart[]=[];
 const add=(text:string,id:string,term?:P006TermKey,full=text)=>{if(text)parts.push(Object.freeze({text,sourceTextId:id,term,complete:text===full}));};
 add(run('character-44/run-2'),'character-44/run-2');
 add(combined.slice(0,7),'character-44/run-3','Convert','convert');add(combined.slice(7,8),'character-44/run-3');
 add(combined.slice(8,17),'character-44/run-3','Fraction','fractions');add(combined.slice(17),'character-44/run-3');
 add(run('character-51/run-0'),'character-51/run-0');add(run('character-51/run-1'),'character-51/run-1','Decimal','decimals');add(run('character-51/run-2'),'character-51/run-2');add(run('character-51/run-3'),'character-51/run-3','Percent','percents');add(run('character-51/run-4'),'character-51/run-4');
 return Object.freeze({headingVisible:s.nodes.some(n=>n.characterId===56&&n.domain==='57'),heading:run('character-44/run-0'),parts:Object.freeze(parts),question:parts.map(p=>p.text).join(''),panel:s.nodes.some(n=>n.characterId===39||n.characterId===40)});
}
function instance(n:P006Node){const path:LessonTextInstanceSegment[]=[];for(const m of n.instancePath.matchAll(/(root:\d+|sprite-\d+)\/d(\d+)g(\d+)c(\d+)/gu))path.push(Object.freeze({timelineId:m[1]!.startsWith('root:')?'root':m[1]!,depth:Number(m[2]),generation:Number(m[3]),characterId:Number(m[4])}));return Object.freeze({id:lessonTextInstanceId(path),path:Object.freeze(path)});}
export function p006TextSnapshot(s:P006FrameState){const t=p006TeachingState(s),snap=buildLessonTextSnapshot(P006_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:'source-essential-question',lang:s.language,seed:s.seed,replay:s.replay},{'course-title':{text:'Fractions, Decimals and Percents Concepts:',visible:t.headingVisible},'activity-title':{text:'Real World Activity',visible:t.headingVisible},'essential-heading':{text:t.heading,visible:Boolean(t.heading)},'essential-question':{text:t.question,visible:Boolean(t.question)}});return Object.freeze({...snap,suppressedInstances:Object.freeze(snap.status==='ready'?s.nodes.filter(p006ReplacesNode).map(instance):[])});}
