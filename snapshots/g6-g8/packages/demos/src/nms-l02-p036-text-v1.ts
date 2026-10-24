import type{LessonTextBinding}from'./lesson-text-contract';
import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{P036_FRAME_DATA as DATA}from'./generated/nms-l02-p036-frame-data-v1';
import{p036Teaching,p036Readable,P036_STATIC_KEYS}from'./nms-l02-p036-teaching-v1';
import type{P036FrameState}from'./nms-l02-p036-frame-v1';
const ids=(v:number[])=>v.map(n=>'character-'+n);
export const P036_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p036-native-source-v2',animationId:DATA.animationId,placementId:DATA.animationId,sourceSwfSha256:DATA.sourceSha256,template:'explanation',blocks:Object.freeze([
{id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
{id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
{id:'train-title',sourceTextIds:ids([10]),role:'heading',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
{id:'train-pairs',sourceTextIds:ids([12,13,14,16,17,19,20,22,23]),sourceShapeIds:[11,15,18,21],role:'label',language:'en',readingOrder:4,valueSource:'maintained-page-state'},
{id:'instruction-29',sourceTextIds:ids([29]),role:'body',language:'en',readingOrder:5,valueSource:'maintained-page-state'},
{id:'instruction-34',sourceTextIds:ids([34]),role:'body',language:'en',readingOrder:6,valueSource:'maintained-page-state'},
{id:'instruction-35',sourceTextIds:ids([35]),sourceShapeIds:[36],role:'body',language:'en',readingOrder:7,valueSource:'maintained-page-state'},
{id:'instruction-37',sourceTextIds:ids([37]),role:'body',language:'en',readingOrder:8,valueSource:'maintained-page-state'},
{id:'instruction-38',sourceTextIds:ids([38]),role:'body',language:'en',readingOrder:9,valueSource:'maintained-page-state'},
{id:'example',sourceTextIds:ids([39,40,79,84,88]),sourceShapeIds:[41],role:'label',language:'en',readingOrder:10,valueSource:'maintained-page-state'},
{id:'calculator-title',sourceTextIds:[],sourceShapeIds:[61],role:'heading',language:'en',readingOrder:11,valueSource:'maintained-page-state'},
{id:'calculator-display',sourceTextIds:ids([47,83,85,86]),sourceShapeIds:[87],role:'label',language:'en',readingOrder:12,valueSource:'maintained-page-state'},
{id:'calculator-keys',sourceTextIds:ids([67,75,76,77,78]),sourceShapeIds:[49,50,51,52,53,54,55,56,62,63,64,65,68,69,70,71,72],role:'label',language:'en',readingOrder:13,valueSource:'maintained-page-state'}
]as const)});
export function p036TextValues(s:P036FrameState){const visible=s.mainFrame!==null,t=p036Teaching(s.state.mainFrame),trainTitle=t.introPoses.find(p=>p.characterId===10),pairs=t.introCards.filter(c=>(c.panel?.color[3]??0)>0).map(c=>c.fraction.join('/')+' ↔ '+c.decimal).join('; '),result:Record<string,{text:string;visible:boolean}>={
'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible},'activity-title':{text:'Instruction',visible},'train-title':{text:'Fractions to Decimals Express',visible:visible&&(trainTitle?.color[3]??0)>0},'train-pairs':{text:pairs,visible:visible&&pairs.length>0},example:{text:'3/4'+(t.resultAlpha>0?' = 0.75':''),visible:visible&&t.calculatorPresent},'calculator-title':{text:'CALCULATOR',visible:visible&&t.calculatorPresent},'calculator-display':{text:t.display,visible:visible&&t.calculatorPresent&&t.display.length>0},'calculator-keys':{text:P036_STATIC_KEYS.map(k=>k.label).join(' '),visible:visible&&t.calculatorPresent}};
for(const id of[29,34,35,37,38]){let text=p036Readable(t.runs.filter(r=>r.sourceTextId.startsWith('character-'+id+'/')));if(id===35&&t.divisionInstructionSymbol?.fullyContained)text=text.replace('(   )','(÷)');result['instruction-'+id]={text,visible:visible&&text.length>0};}return result;}
export function p036TextSnapshot(s:P036FrameState){return buildLessonTextSnapshot(P036_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang:s.language,seed:s.seed,replay:s.replay},p036TextValues(s));}
