import {NMS_L02_P017_IR as IR} from './generated/nms-l02-p017-source-ir-v1';
import type {P017FrameState,P017Node} from './nms-l02-p017-timeline-v1';
import type {LessonTextBinding,LessonTextInstanceSegment} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';

const textCharacters=new Set(IR.texts.map(t=>t.characterId));
export const P017_REPLACED_SHAPES:ReadonlySet<number>=new Set([1,2,3,6,23,24,60,64,65,66]);
export function p017ReplacesNode(n:P017Node){return textCharacters.has(n.characterId)||P017_REPLACED_SHAPES.has(n.characterId);}
export type P017TermKey='Fraction'|'Whole'|'Group';
/** Exact source word order. Repeated characters bind by instance depth, not symbol id. */
export const P017_DEFINITION_WORDS=Object.freeze(['Fractions','describe','part','of','a','whole,','part','of','a','group,','or','part','of','a','number.']);
export const P017_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p017-native-source-v1',animationId:IR.animationId,placementId:IR.animationId,sourceSwfSha256:IR.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'opening',sourceTextIds:[5,8,...Array.from({length:14},(_,i)=>i+9)].map(i=>'character-'+i),sourceShapeIds:[3],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 {id:'definition',sourceTextIds:Array.from({length:33},(_,i)=>'character-'+(i+25)),sourceShapeIds:[23,24],role:'body',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 {id:'whole-heading',sourceTextIds:['character-62'],role:'heading',language:'en',readingOrder:4,valueSource:'maintained-page-state'},
 {id:'whole-caption',sourceTextIds:['character-67','character-68','character-69'],sourceShapeIds:[66],role:'body',language:'en',readingOrder:5,valueSource:'maintained-page-state'},
 {id:'group-heading',sourceTextIds:['character-63'],role:'heading',language:'en',readingOrder:6,valueSource:'maintained-page-state'},
 {id:'group-caption',sourceTextIds:['character-70','character-71','character-72'],sourceShapeIds:[66],role:'body',language:'en',readingOrder:7,valueSource:'maintained-page-state'},
 ]as const)});
export function p017TeachingState(s:P017FrameState){
 const visible=s.visibleTexts;
 const at=(id:number)=>visible.find(t=>t.characterId===id);
 const text=(id:number)=>at(id)?.runs.map(r=>r.visibleText).join('')??'';
 const opacity=(n:P017Node|undefined)=>n?Math.max(0,Math.min(1,n.color[3]+n.color[7])):0;
 const alpha=(id:number)=>opacity(s.nodes.find(n=>n.characterId===id));
 const words:{text:string;visibleText:string;complete:boolean;term:P017TermKey|null;termComplete:boolean;depths:readonly number[]}[]=[];
 let depth=70;
 for(const word of P017_DEFINITION_WORDS){
  const depths=Array.from({length:word.length},()=>depth--);
  const glyphs=depths.map(d=>visible.find(n=>n.depth===d&&n.characterId>=25&&n.characterId<=57)?.runs[0]);
  const visibleText=glyphs.map(r=>r?.visibleText??'').join('');
  const term=word==='Fractions'?'Fraction':word==='whole,'?'Whole':word==='group,'?'Group':null;
  const termLength=term?word.replace(/,$/u,'').length:0;
  words.push(Object.freeze({text:word,visibleText,complete:glyphs.every(g=>g?.complete),term,termComplete:termLength>0&&glyphs.slice(0,termLength).every(g=>g?.complete),depths:Object.freeze(depths)}));
 }
 const openingLower=text(5),openingUpper=text(22),tail=text(8),definition=words.map(w=>w.visibleText).filter(Boolean).join(' ');
 const fractionComplete=(at(5)?.runs[0]?.complete??false)||(at(22)?.runs[0]?.complete??false)||(words[0]?.termComplete??false);
 const termAvailable=Object.freeze({Fraction:fractionComplete,Whole:words.some(w=>w.term==='Whole'&&w.termComplete),Group:words.some(w=>w.term==='Group'&&w.termComplete)});
 const local=IR.domains['73']!.frames[Math.max(0,(s.mainFrame??1)-1)]!.map(i=>IR.poses[i]!);
 const fractionX=local.find(p=>p.characterId===5)?.matrix[4]??-151.85;
 const openingPosition=Math.max(0,Math.min(1,(fractionX+151.85)/204));
 const emphasis=Object.freeze({fraction:Boolean(text(9)),decimal:visible.some(n=>n.characterId===17&&n.runs.some(r=>r.visibleText)),percent:visible.some(n=>n.characterId===21&&n.runs.some(r=>r.visibleText))});
 const wholeNumerator=text(67),wholeDenominator=text(68),wholeText=text(69),groupNumerator=text(70),groupDenominator=text(71),groupText=text(72);
 return Object.freeze({headingVisible:alpha(1)>0,openingLower,openingUpper,openingLowerAlpha:alpha(5),openingUpperAlpha:alpha(22),tail,tailAlpha:alpha(8),openingPosition,emphasis,words:Object.freeze(words),definition,termAvailable,wholeHeading:text(62),groupHeading:text(63),wholeHeadingAlpha:alpha(62),groupHeadingAlpha:alpha(63),comparisonAlpha:alpha(60),wholeAlpha:alpha(64),groupAlpha:alpha(65),wholeNumerator,wholeDenominator,wholeText,wholeCaptionAlpha:alpha(69),groupNumerator,groupDenominator,groupText,groupCaptionAlpha:alpha(72)});
}
function instance(n:P017Node){const path:LessonTextInstanceSegment[]=[];for(const m of n.instancePath.matchAll(/(root:\d+|sprite-\d+)\/d(\d+)g(\d+)c(\d+)/gu))path.push(Object.freeze({timelineId:m[1]!.startsWith('root:')?'root':m[1]!,depth:Number(m[2]),generation:Number(m[3]),characterId:Number(m[4])}));return Object.freeze({id:lessonTextInstanceId(path),path:Object.freeze(path)});}
export function p017TextSnapshot(s:P017FrameState){
 const t=p017TeachingState(s),values:Record<string,{text:string;visible:boolean}>={'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible:t.headingVisible},'activity-title':{text:'Instruction',visible:t.headingVisible}};
 const opening=[t.openingUpper||t.openingLower,t.tail].filter(Boolean).join(' ');
 for(const [key,text]of [['opening',opening],['definition',t.definition],['whole-heading',t.wholeHeading],['group-heading',t.groupHeading],['whole-caption',t.wholeNumerator&&t.wholeDenominator?`${t.wholeNumerator}/${t.wholeDenominator} ${t.wholeText}`:''],['group-caption',t.groupNumerator&&t.groupDenominator?`${t.groupNumerator}/${t.groupDenominator} ${t.groupText}`:'']]as const)values[key]={text,visible:Boolean(text)};
 const snap=buildLessonTextSnapshot(P017_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:'source-instruction',lang:s.language,seed:s.seed,replay:s.replay},values);
 return Object.freeze({...snap,suppressedInstances:Object.freeze(snap.status==='ready'?s.nodes.filter(p017ReplacesNode).map(instance):[])});
}
