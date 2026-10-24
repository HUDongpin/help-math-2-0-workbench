import {NMS_L02_P012_IR as IR} from './generated/nms-l02-p012-source-ir-v1';
import type {P012FrameState,P012Node} from './nms-l02-p012-timeline-v1';
import type {LessonTextBinding,LessonTextInstanceSegment} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';
const textCharacters=new Set(IR.texts.map(t=>t.characterId));
export const P012_REPLACED_SHAPES:ReadonlySet<number>=new Set([3,4,5,6,8,12,13,16,17,28,29,31]);
export function p012ReplacesNode(n:P012Node){return textCharacters.has(n.characterId)||P012_REPLACED_SHAPES.has(n.characterId);}
export const P012_TERM_RUNS=Object.freeze({'character-7/run-0':'Equivalent fraction','character-7/run-2':'Fraction','character-7/run-4':'Equivalent','character-14/run-1':'Quantity'}as const);
export const P012_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p012-native-source-v1',animationId:IR.animationId,placementId:IR.animationId,sourceSwfSha256:IR.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:['character-2/run-0'],sourceShapeIds:[3],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:['character-2/run-0'],sourceShapeIds:[3],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'definition',sourceTextIds:['character-7','character-14','character-30'],sourceShapeIds:[6,13],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 ...[18,24,19,25,26,27].map((id,index)=>({id:'value-'+id,sourceTextIds:['character-'+id],role:'label' as const,language:'en' as const,readingOrder:3+index,valueSource:'maintained-page-state' as const})),
 ...[35,36,38,39].map((depth,index)=>({id:'equals-'+depth,sourceTextIds:['character-32'],role:'label' as const,language:'en' as const,readingOrder:9+index,valueSource:'maintained-page-state' as const})),
 ]as const)});
export function p012TeachingState(s:P012FrameState){
 const at=(id:number,depth?:number)=>s.visibleTexts.find(t=>t.characterId===id&&(depth===undefined||t.depth===depth)&&t.instancePath.startsWith('root:6/d3g1c33/sprite-33/'));
 const node=(id:number)=>s.nodes.find(n=>n.characterId===id),alpha=(id:number)=>{const n=node(id);return n?Math.max(0,Math.min(1,n.color[3]+n.color[7])):0;};
 // Source first-line run5 includes the space that joins the second line.
 const definitionRuns=[...(at(7)?.runs??[]),...(at(14)?.runs??[])],values=[18,24,19,25,26,27].map(id=>({id,runs:at(id)?.runs??[]}));
 const equalities=[35,36,38,39].map(depth=>({depth,run:at(32,depth)?.runs[0]}));
 // Morph29 grows from14 to277 source units; retain its nonzero initial span.
 const growing=node(29),divider=node(31)?1:growing?(14+263*growing.ratio/65535)/277:0;
 return Object.freeze({headingVisible:alpha(3)>0,definitionRuns,allRuns:definitionRuns,definition:definitionRuns.map(r=>r.visibleText).join(''),values,equalities,panelAlpha:alpha(16),pictureAlpha:alpha(21),wordEmphasized:alpha(30)>0,divider});
}
function instance(n:P012Node){const path:LessonTextInstanceSegment[]=[];for(const m of n.instancePath.matchAll(/(root:\d+|sprite-\d+)\/d(\d+)g(\d+)c(\d+)/gu))path.push(Object.freeze({timelineId:m[1]!.startsWith('root:')?'root':m[1]!,depth:Number(m[2]),generation:Number(m[3]),characterId:Number(m[4])}));return Object.freeze({id:lessonTextInstanceId(path),path:Object.freeze(path)});}
export function p012TextSnapshot(s:P012FrameState){
 const t=p012TeachingState(s),values:Record<string,{text:string;visible:boolean}>={'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible:t.headingVisible},'activity-title':{text:'Vocabulary',visible:t.headingVisible},definition:{text:t.definition,visible:Boolean(t.definition)}};
 for(const v of t.values){const text=v.runs.map(r=>r.visibleText).join(v.runs.length===2?'/':'');values['value-'+v.id]={text,visible:Boolean(text)};}
 for(const e of t.equalities){const text=e.run?.visibleText??'';values['equals-'+e.depth]={text,visible:Boolean(text)};}
 const snap=buildLessonTextSnapshot(P012_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:'source-vocabulary',lang:s.language,seed:s.seed,replay:s.replay},values);
 return Object.freeze({...snap,suppressedInstances:Object.freeze(snap.status==='ready'?s.nodes.filter(p012ReplacesNode).map(instance):[])});
}
