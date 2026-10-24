import {NMS_L02_P015_IR as IR} from './generated/nms-l02-p015-source-ir-v1';
import type {P015FrameState,P015Node} from './nms-l02-p015-timeline-v1';
import type {LessonTextBinding,LessonTextInstanceSegment} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';

const textCharacters=new Set(IR.texts.map(t=>t.characterId));
export const P015_REPLACED_SHAPES:ReadonlySet<number>=new Set([3,4,5,6,8,11,39,41,43,45]);
export function p015ReplacesNode(n:P015Node){return textCharacters.has(n.characterId)||P015_REPLACED_SHAPES.has(n.characterId);}
export const P015_TERM_RUNS=Object.freeze({'character-7/run-1':'Percent','character-7/run-3':'Ratio','character-12/run-1':'Compare','character-12/run-3':'Quantity'}as const);
/** Source grid cell counts independently checked at every cell center. */
export const P015_GRID_COUNTS:Readonly<Record<number,number>>=Object.freeze({15:0,16:0,17:3,18:7,19:10,20:13,21:16,22:19,23:23,24:26,25:29,26:32,27:35,28:39,29:42,30:45,31:48,32:51,33:56,34:58,35:60,36:63,37:66,38:70});
export const P015_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p015-native-source-v1',animationId:IR.animationId,placementId:IR.animationId,sourceSwfSha256:IR.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:['character-2/run-0'],sourceShapeIds:[3],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:['character-2/run-0'],sourceShapeIds:[3],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'definition-line1',sourceTextIds:['character-7'],sourceShapeIds:[6],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 {id:'definition-line2',sourceTextIds:['character-12'],sourceShapeIds:[11],role:'body',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 {id:'grid-caption',sourceTextIds:['character-40','character-42'],role:'body',language:'en',readingOrder:4,valueSource:'maintained-page-state'},
 {id:'shaded-caption',sourceTextIds:['character-44'],role:'body',language:'en',readingOrder:5,valueSource:'maintained-page-state'},
 {id:'unshaded-caption',sourceTextIds:['character-46'],role:'body',language:'en',readingOrder:6,valueSource:'maintained-page-state'},
 ]as const)});
export function p015TeachingState(s:P015FrameState){
 const at=(id:number)=>s.visibleTexts.find(t=>t.characterId===id&&t.instancePath.startsWith('root:6/d3g1c47/sprite-47/'));
 const opacity=(n:P015Node|undefined)=>n?Math.max(0,Math.min(1,n.color[3]+n.color[7])):0;
 const alpha=(id:number)=>opacity(s.nodes.find(n=>n.characterId===id));
 const definitionLines=[at(7)?.runs??[],at(12)?.runs??[]],lineTexts=definitionLines.map(runs=>runs.map(r=>r.visibleText).join(''));
 const grid=s.nodes.find(n=>Object.hasOwn(P015_GRID_COUNTS,n.characterId));
 const captions=[40,42,44,46].map(id=>({id,run:at(id)?.runs[0]}));
 const text=(id:number)=>captions.find(c=>c.id===id)?.run?.visibleText??'';
 // Source40 and42 are authored on separate visual lines of one sentence.
 // The native layout supplies a separating space only once line42 is visible.
 const gridCaption=[text(40),text(42)].filter(Boolean).join(' ');
 return Object.freeze({headingVisible:alpha(3)>0,definitionLines,lineTexts,allRuns:definitionLines.flat(),definition:lineTexts.filter(Boolean).join('\n'),panelAlpha:alpha(4),grid,gridAlpha:opacity(grid),filledCells:grid?P015_GRID_COUNTS[grid.characterId]!:0,captions,gridCaption,shadedCaption:text(44),unshadedCaption:text(46)});
}
function instance(n:P015Node){const path:LessonTextInstanceSegment[]=[];for(const m of n.instancePath.matchAll(/(root:\d+|sprite-\d+)\/d(\d+)g(\d+)c(\d+)/gu))path.push(Object.freeze({timelineId:m[1]!.startsWith('root:')?'root':m[1]!,depth:Number(m[2]),generation:Number(m[3]),characterId:Number(m[4])}));return Object.freeze({id:lessonTextInstanceId(path),path:Object.freeze(path)});}
export function p015TextSnapshot(s:P015FrameState){
 const t=p015TeachingState(s),values:Record<string,{text:string;visible:boolean}>={'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible:t.headingVisible},'activity-title':{text:'Vocabulary',visible:t.headingVisible}};
 for(const [key,text]of [['definition-line1',t.lineTexts[0]!],['definition-line2',t.lineTexts[1]!],['grid-caption',t.gridCaption],['shaded-caption',t.shadedCaption],['unshaded-caption',t.unshadedCaption]]as const)values[key]={text,visible:Boolean(text)};
 const snap=buildLessonTextSnapshot(P015_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:'source-vocabulary',lang:s.language,seed:s.seed,replay:s.replay},values);
 return Object.freeze({...snap,suppressedInstances:Object.freeze(snap.status==='ready'?s.nodes.filter(p015ReplacesNode).map(instance):[])});
}
