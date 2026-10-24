import {NMS_L02_P014_IR as IR} from './generated/nms-l02-p014-source-ir-v1';
import type {P014FrameState,P014Node} from './nms-l02-p014-timeline-v1';
import type {LessonTextBinding,LessonTextInstanceSegment} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';
const textCharacters=new Set(IR.texts.map(t=>t.characterId));
export const P014_REPLACED_SHAPES:ReadonlySet<number>=new Set([3,4,5,6,13,15,17]);
export function p014ReplacesNode(n:P014Node){return textCharacters.has(n.characterId)||P014_REPLACED_SHAPES.has(n.characterId);}
export const P014_TERM_RUNS=Object.freeze({'character-7/run-0':'Equivalent decimal','character-7/run-2':'Decimal'}as const);
export const P014_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p014-native-source-v1',animationId:IR.animationId,placementId:IR.animationId,sourceSwfSha256:IR.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:['character-2/run-0'],sourceShapeIds:[3],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:['character-2/run-0'],sourceShapeIds:[3],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'definition',sourceTextIds:['character-7'],sourceShapeIds:[6],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 {id:'quarter',sourceTextIds:['character-14'],sourceShapeIds:[15,17],role:'label',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 {id:'equals',sourceTextIds:['character-11'],role:'label',language:'en',readingOrder:4,valueSource:'maintained-page-state'},
 {id:'hundredths',sourceTextIds:['character-12'],sourceShapeIds:[13],role:'label',language:'en',readingOrder:5,valueSource:'maintained-page-state'},
 {id:'decimal',sourceTextIds:['character-16','character-18'],role:'label',language:'en',readingOrder:6,valueSource:'maintained-page-state'},
 ]as const)});
export function p014TeachingState(s:P014FrameState){
 const at=(id:number)=>s.visibleTexts.find(t=>t.characterId===id&&t.instancePath.startsWith('root:6/d3g1c19/sprite-19/'));
 const alpha=(id:number)=>{const n=s.nodes.find(n=>n.characterId===id);return n?Math.max(0,Math.min(1,n.color[3]+n.color[7])):0;};
 const definitionRuns=at(7)?.runs??[],values=[14,12].map(id=>({id,runs:at(id)?.runs??[]}));
 return Object.freeze({headingVisible:alpha(3)>0,definitionRuns,allRuns:definitionRuns,definition:definitionRuns.map(r=>r.visibleText).join(''),values,equals:at(11)?.runs[0],decimal:at(16)?.runs[0],panelAlpha:alpha(4),gridAlpha:alpha(10),quarterEmphasized:alpha(17)>0,decimalEmphasized:alpha(18)>0});
}
function instance(n:P014Node){const path:LessonTextInstanceSegment[]=[];for(const m of n.instancePath.matchAll(/(root:\d+|sprite-\d+)\/d(\d+)g(\d+)c(\d+)/gu))path.push(Object.freeze({timelineId:m[1]!.startsWith('root:')?'root':m[1]!,depth:Number(m[2]),generation:Number(m[3]),characterId:Number(m[4])}));return Object.freeze({id:lessonTextInstanceId(path),path:Object.freeze(path)});}
export function p014TextSnapshot(s:P014FrameState){
 const t=p014TeachingState(s),values:Record<string,{text:string;visible:boolean}>={'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible:t.headingVisible},'activity-title':{text:'Vocabulary',visible:t.headingVisible},definition:{text:t.definition,visible:Boolean(t.definition)}};
 for(const v of t.values){const text=v.runs.map(r=>r.visibleText).join('/');values[v.id===14?'quarter':'hundredths']={text,visible:Boolean(text)};}
 for(const [key,run]of [['equals',t.equals],['decimal',t.decimal]]as const){const text=run?.visibleText??'';values[key]={text,visible:Boolean(text)};}
 const snap=buildLessonTextSnapshot(P014_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:'source-vocabulary',lang:s.language,seed:s.seed,replay:s.replay},values);
 return Object.freeze({...snap,suppressedInstances:Object.freeze(snap.status==='ready'?s.nodes.filter(p014ReplacesNode).map(instance):[])});
}
