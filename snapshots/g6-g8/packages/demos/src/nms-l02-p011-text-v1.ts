import {NMS_L02_P011_IR as IR} from './generated/nms-l02-p011-source-ir-v1';
import type {P011FrameState,P011Node} from './nms-l02-p011-timeline-v1';
import type {LessonTextBinding,LessonTextInstanceSegment} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';
const textCharacters=new Set(IR.texts.map(t=>t.characterId));
export const P011_REPLACED_SHAPES:ReadonlySet<number>=new Set([3,4,5,6,10,11,20,21,26]);
export function p011ReplacesNode(n:P011Node){return textCharacters.has(n.characterId)||P011_REPLACED_SHAPES.has(n.characterId);}
export const P011_TERM_RUNS=Object.freeze({'character-7/run-0':'Equivalent','character-7/run-2':'Value'}as const);
export const P011_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p011-native-source-v1',animationId:IR.animationId,placementId:IR.animationId,sourceSwfSha256:IR.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:['character-2/run-0'],sourceShapeIds:[3],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:['character-2/run-0'],sourceShapeIds:[3],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'definition',sourceTextIds:['character-7','character-19'],sourceShapeIds:[6],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 ...[12,18,13,23,24,25].map((id,index)=>({id:'value-'+id,sourceTextIds:['character-'+id],role:'label' as const,language:'en' as const,readingOrder:3+index,valueSource:'maintained-page-state' as const})),
 ...[27,28,30,31].map((depth,index)=>({id:'equals-'+depth,sourceTextIds:['character-22'],role:'label' as const,language:'en' as const,readingOrder:9+index,valueSource:'maintained-page-state' as const})),
 ]as const)});
export function p011TeachingState(s:P011FrameState){
 const at=(id:number,depth?:number)=>s.visibleTexts.find(t=>t.characterId===id&&(depth===undefined||t.depth===depth)&&t.instancePath.startsWith('root:6/d3g1c27/sprite-27/'));
 const node=(id:number)=>s.nodes.find(n=>n.characterId===id),alpha=(id:number)=>{const n=node(id);return n?Math.max(0,Math.min(1,n.color[3]+n.color[7])):0;};
 const definitionRuns=at(7)?.runs??[],values=[12,18,13,23,24,25].map(id=>({id,runs:at(id)?.runs??[]}));
 const equalities=[27,28,30,31].map(depth=>({depth,run:at(22,depth)?.runs[0]}));
 const divider=node(21)?1:(node(20)?.ratio??0)/65535;
 return Object.freeze({headingVisible:alpha(3)>0,definitionRuns,allRuns:definitionRuns,definition:definitionRuns.map(r=>r.visibleText).join(''),values,equalities,panelAlpha:alpha(10),pictureAlpha:alpha(15),wordEmphasized:alpha(19)>0,divider});
}
function instance(n:P011Node){const path:LessonTextInstanceSegment[]=[];for(const m of n.instancePath.matchAll(/(root:\d+|sprite-\d+)\/d(\d+)g(\d+)c(\d+)/gu))path.push(Object.freeze({timelineId:m[1]!.startsWith('root:')?'root':m[1]!,depth:Number(m[2]),generation:Number(m[3]),characterId:Number(m[4])}));return Object.freeze({id:lessonTextInstanceId(path),path:Object.freeze(path)});}
export function p011TextSnapshot(s:P011FrameState){
 const t=p011TeachingState(s),values:Record<string,{text:string;visible:boolean}>={'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible:t.headingVisible},'activity-title':{text:'Vocabulary',visible:t.headingVisible},definition:{text:t.definition,visible:Boolean(t.definition)}};
 for(const v of t.values){const text=v.runs.map(r=>r.visibleText).join(v.runs.length===2?'/':'');values['value-'+v.id]={text,visible:Boolean(text)};}
 for(const e of t.equalities){const text=e.run?.visibleText??'';values['equals-'+e.depth]={text,visible:Boolean(text)};}
 const snap=buildLessonTextSnapshot(P011_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:'source-vocabulary',lang:s.language,seed:s.seed,replay:s.replay},values);
 return Object.freeze({...snap,suppressedInstances:Object.freeze(snap.status==='ready'?s.nodes.filter(p011ReplacesNode).map(instance):[])});
}
