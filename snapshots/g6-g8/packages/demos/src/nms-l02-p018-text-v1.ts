import {NMS_L02_P018_IR as IR} from './generated/nms-l02-p018-source-ir-v1';
import type {P018FrameState,P018Node} from './nms-l02-p018-timeline-v1';
import type {LessonTextBinding,LessonTextInstanceSegment} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';
const textCharacters=new Set(IR.texts.map(t=>t.characterId));
export const P018_REPLACED_SHAPES:ReadonlySet<number>=new Set([1,2,3,6,10,13,14,15,16,17,18,19,20,25,26,28]);
export function p018ReplacesNode(n:P018Node){return textCharacters.has(n.characterId)||P018_REPLACED_SHAPES.has(n.characterId);}
export type P018TermKey='Fraction'|'Circle';
export const P018_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p018-native-source-v1',animationId:IR.animationId,placementId:IR.animationId,sourceSwfSha256:IR.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'formula',sourceTextIds:[5,8,9,11,12].map(i=>'character-'+i),sourceShapeIds:[3],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 {id:'caption',sourceTextIds:[21,22,23,27].map(i=>'character-'+i),sourceShapeIds:[19,20,25,26,28],role:'body',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 ]as const)});
export function p018TeachingState(s:P018FrameState){
 const at=(id:number)=>s.visibleTexts.find(t=>t.characterId===id);
 const text=(id:number)=>at(id)?.runs.map(r=>r.visibleText).join('')??'';
 const node=(id:number)=>s.nodes.find(n=>n.characterId===id);
 const alpha=(id:number)=>{const n=node(id);return n?Math.max(0,Math.min(1,n.color[3]+n.color[7])):0;};
 const cap=at(23)?.runs,heading=at(5)?.runs;
 const divider=node(13),arrow=node(16);
 return Object.freeze({headingVisible:alpha(1)>0,fraction:heading?.[0]?.visibleText??'',equals:heading?.[1]?.visibleText??'',numerator:text(8),denominator:text(9),formulaAlpha:alpha(5),emphasis:Object.freeze({numerator:Boolean(text(11)),denominator:Boolean(text(12))}),circleAlpha:alpha(10),dividerProgress:node(14)?1:divider?(7.3+100.65*divider.ratio/65535)/107.95:0,redAlpha:alpha(15),arrowProgress:node(18)?1:arrow?arrow.ratio/65535:0,arrowVisible:Boolean(node(18)||arrow),fractionNumerator:text(21),fractionDenominator:text(22),captionBefore:cap?.[0]?.visibleText??'',captionCircle:cap?.[1]?.visibleText??'',captionAfter:cap?.[2]?.visibleText??'',captionLine2:text(27),termAvailable:Object.freeze({Fraction:Boolean(heading?.[0]?.complete),Circle:Boolean(cap?.[1]?.complete)})});
}
function instance(n:P018Node){const path:LessonTextInstanceSegment[]=[];for(const m of n.instancePath.matchAll(/(root:\d+|sprite-\d+)\/d(\d+)g(\d+)c(\d+)/gu))path.push(Object.freeze({timelineId:m[1]!.startsWith('root:')?'root':m[1]!,depth:Number(m[2]),generation:Number(m[3]),characterId:Number(m[4])}));return Object.freeze({id:lessonTextInstanceId(path),path:Object.freeze(path)});}
export function p018TextSnapshot(s:P018FrameState){
 const t=p018TeachingState(s),formula=t.fraction?`${t.fraction}${t.equals} ${t.numerator} / ${t.denominator}`:'',caption=[t.fractionNumerator&&t.fractionDenominator?`${t.fractionNumerator}/${t.fractionDenominator}`:'',t.captionBefore+t.captionCircle+t.captionAfter,t.captionLine2].filter(Boolean).join(' ');
 const values={'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible:t.headingVisible},'activity-title':{text:'Instruction',visible:t.headingVisible},formula:{text:formula,visible:Boolean(formula)},caption:{text:caption,visible:Boolean(caption)}};
 const snap=buildLessonTextSnapshot(P018_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:'source-instruction',lang:s.language,seed:s.seed,replay:s.replay},values);
 return Object.freeze({...snap,suppressedInstances:Object.freeze(snap.status==='ready'?s.nodes.filter(p018ReplacesNode).map(instance):[])});
}
