import {NMS_L02_P009_IR as IR} from './generated/nms-l02-p009-source-ir-v1';
import type {P009FrameState,P009Node} from './nms-l02-p009-timeline-v1';
import type {P009VisibleRun} from './nms-l02-p009-source-contract-v1';
import type {LessonTextBinding,LessonTextInstanceSegment} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';
const textCharacters=new Set(IR.texts.map(t=>t.characterId));
export const P009_REPLACED_SHAPES:ReadonlySet<number>=new Set([3,4,5,6,13,25,26,36]);
export function p009ReplacesNode(n:P009Node){return textCharacters.has(n.characterId)||P009_REPLACED_SHAPES.has(n.characterId);}
export const P009_COLUMNS=Object.freeze([
 {id:'hundreds',text:33,depth:25,digit:0,group:'whole'},
 {id:'tens',text:32,depth:24,digit:0,group:'whole'},
 {id:'ones',text:28,depth:20,digit:21,group:'whole'},
 {id:'point',text:29,depth:21,digit:22,group:'point'},
 {id:'tenths',text:30,depth:22,digit:24,group:'decimal'},
 {id:'hundredths',text:31,depth:23,digit:23,group:'decimal'},
 {id:'thousandths',text:34,depth:26,digit:0,group:'decimal'}
]as const);
export const P009_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p009-native-source-v1',animationId:IR.animationId,placementId:IR.animationId,sourceSwfSha256:IR.sourceSha256,template:'complex-figure',blocks:Object.freeze([
{id:'course-title',sourceTextIds:['character-2/run-0'],sourceShapeIds:[3],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
{id:'activity-title',sourceTextIds:['character-2/run-0'],sourceShapeIds:[3],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
{id:'definition',sourceTextIds:['character-7','character-14'],sourceShapeIds:[6,13],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
{id:'number',sourceTextIds:[12,16,17,18,19,20,21,22,23,24].map(i=>'character-'+i),role:'label',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
{id:'whole-group',sourceTextIds:['character-7/run-5','character-28'],role:'label',language:'en',readingOrder:4,valueSource:'maintained-page-state'},
{id:'decimal-group',sourceTextIds:['character-35'],role:'label',language:'en',readingOrder:5,valueSource:'maintained-page-state'},
...P009_COLUMNS.flatMap((c,i)=>[
{id:c.id+'-label',sourceTextIds:['character-'+c.text],sourceShapeIds:[26],role:'label' as const,language:'en' as const,readingOrder:6+i*2,valueSource:'maintained-page-state' as const},
{id:c.id+'-value',sourceTextIds:['character-'+(c.digit||c.text)],role:'label' as const,language:'en' as const,readingOrder:7+i*2,valueSource:'maintained-page-state' as const}]),
] as const)});
export const P009_TERM_RUNS=Object.freeze({'character-7/run-1':'Decimal point','character-7/run-3':'Symbol','character-7/run-5':'Whole numbers','character-14/run-1':'Decimal fraction'}as const);
export function p009TeachingState(s:P009FrameState){
 const at=(id:number,depth?:number)=>s.visibleTexts.find(t=>t.characterId===id&&(depth===undefined||t.depth===depth)&&t.instancePath.startsWith('root:6/d3g1c37/sprite-37/'));
 const visible=(id:number)=>s.nodes.some(n=>n.characterId===id&&n.color[3]+n.color[7]>0);
 const first=(id:number,depth?:number)=>at(id,depth)?.runs[0];
 const firstLine=at(7)?.runs??[],secondLine=at(14)?.runs??[];
 // The line-ending source space has no glyph ink but is a semantic separator.
 const definitionRuns:readonly P009VisibleRun[]=[...firstLine.filter(r=>r.sourceTextId!=='character-7/run-6'),...(secondLine.length?[{sourceTextId:'character-7/run-6',text:' ',visibleText:' ',glyphVisible:[true],complete:true,alpha:1}]:[]),...secondLine];
 const numberIds=new Set([12,16,18,19,20,21,22,23,24]);
 const numeric=s.nodes.filter(n=>numberIds.has(n.characterId)&&first(n.characterId)?.visibleText).sort((a,b)=>a.matrix[4]-b.matrix[4]);
 const number=numeric.map(n=>first(n.characterId)!.visibleText).join('');
 const columns=P009_COLUMNS.map(c=>Object.freeze({...c,label:first(c.text,c.depth),value:c.digit?first(c.digit)?.visibleText??'':'',valueAlpha:c.digit?first(c.digit)?.alpha??0:0}));
 const tableVisible=visible(26),groupRun=first(28,27),decimalGroup=first(35,28)?.visibleText??'';
 const tableMask=s.nodes.find(n=>n.characterId===26)?.masks.find(m=>m.characterId===25||m.characterId===36),tableProgress=tableMask?.characterId===36?1:(tableMask?.ratio??0)/65535;
 return Object.freeze({headingVisible:visible(3),definitionRuns,allRuns:definitionRuns,definition:definitionRuns.map(r=>r.visibleText).join(''),number,numberParts:numeric.map(n=>Object.freeze({characterId:n.characterId,text:first(n.characterId)!.visibleText,alpha:first(n.characterId)!.alpha})),pointEmphasized:visible(17),spread:numeric.some(n=>[19,20,21,22,23,24].includes(n.characterId)),tableVisible,columns,wholeGroup:groupRun?.visibleText?'Whole number':'',decimalGroup,tableProgress});
}
function instance(n:P009Node){const path:LessonTextInstanceSegment[]=[];for(const m of n.instancePath.matchAll(/(root:\d+|sprite-\d+)\/d(\d+)g(\d+)c(\d+)/gu))path.push(Object.freeze({timelineId:m[1]!.startsWith('root:')?'root':m[1]!,depth:Number(m[2]),generation:Number(m[3]),characterId:Number(m[4])}));return Object.freeze({id:lessonTextInstanceId(path),path:Object.freeze(path)});}
export function p009TextSnapshot(s:P009FrameState){const t=p009TeachingState(s),values:Record<string,{text:string;visible:boolean}>={
'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible:t.headingVisible},'activity-title':{text:'Vocabulary',visible:t.headingVisible},definition:{text:t.definition,visible:Boolean(t.definition)},number:{text:t.number,visible:Boolean(t.number)},'whole-group':{text:t.wholeGroup,visible:Boolean(t.wholeGroup)},'decimal-group':{text:t.decimalGroup,visible:Boolean(t.decimalGroup)}};
for(const c of t.columns){values[c.id+'-label']={text:c.label?.visibleText??'',visible:t.tableVisible&&Boolean(c.label?.visibleText)};values[c.id+'-value']={text:c.value,visible:t.tableVisible&&Boolean(c.value)};}
const snap=buildLessonTextSnapshot(P009_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:'source-vocabulary',lang:s.language,seed:s.seed,replay:s.replay},values);return Object.freeze({...snap,suppressedInstances:Object.freeze(snap.status==='ready'?s.nodes.filter(p009ReplacesNode).map(instance):[])});}
