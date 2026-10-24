import type {LessonTextBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import type {P026FrameState} from './nms-l02-p026-timeline-v1';
import {p026FrameTeaching} from './nms-l02-p026-timeline-v1';
import {p026SourcePoses} from './nms-l02-p026-source-query-v1';
import {P026_SOURCE_IR as IR} from './generated/nms-l02-p026-source-ir-v1';

export const P026_TEXT_BINDING:LessonTextBinding=Object.freeze({
 schemaVersion:1,version:'nms-l02-p026-native-source-v1',animationId:IR.animationId,
 placementId:IR.animationId,sourceSwfSha256:IR.sourceSha256,template:'exercise',
 blocks:Object.freeze([
  {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
  {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
  {id:'instruction',sourceTextIds:['character-22'],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
  {id:'number-cards',sourceTextIds:['character-13','character-14','character-16','character-18','character-20','character-48','character-49','character-69','character-70'],role:'body',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
  {id:'equality',sourceTextIds:['character-35'],sourceShapeIds:[5],role:'label',language:'en',readingOrder:4,valueSource:'maintained-page-state'},
  {id:'question',sourceTextIds:['character-8'],role:'question',language:'en',readingOrder:5,valueSource:'maintained-page-state'},
 ]as const),
});
/** Exact current native game state supplies dynamic values. Dormant youGotIt
 * text is excluded: the source round actions hide it and never show it again.
 * This native-only renderer does not overlay source glyphs, so it needs no
 * fabricated source-instance suppression paths.
 */
export function p026TextSnapshot(s:P026FrameState){
 const t=p026FrameTeaching(s),g=s.game;
 const instruction=t?.instructionRuns.map(r=>r.visibleText).join('')??'';
 const numbers=g?.phase==='intro'?([[1,4],[1,8],[1,2],[2,3]]as const).filter(([n,d],i)=>{
  const selected=i===2?t!.selectedHalf:null,card=t!.numberCards.find(c=>c.numerator===n&&c.denominator===d);
  return (selected?selected.alpha:card?.denominatorPose.alpha??0)>0;
 }).map(([n,d])=>`${n}/${d}`):g?.cards.filter(c=>c.kind==='number'&&!c.removed).map(c=>`${c.numerator}/${c.denominator}`)??[];
 const answer=g&&g.phase!=='intro'?p026SourcePoses('sprite-10',g.answerFrame):[];
 const equality=g?.phase==='intro'?(t?.equalityAlpha??0)>0:answer.some(p=>p.characterId===6&&p.color[3]!>0);
 return buildLessonTextSnapshot(P026_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang:s.language,seed:s.seed,replay:s.replay},{
  'course-title':{text:'Fractions, Decimals & Percents Concepts',visible:g!==null},
  'activity-title':{text:'Instruction',visible:g!==null},
  instruction:{text:instruction,visible:(t?.instructionAlpha??0)>0&&instruction.length>0},
  'number-cards':{text:numbers.join('; '),visible:numbers.length>0},
  equality:{text:'=',visible:equality},
  question:{text:'?',visible:answer.some(p=>p.characterId===9)},
 });
}
