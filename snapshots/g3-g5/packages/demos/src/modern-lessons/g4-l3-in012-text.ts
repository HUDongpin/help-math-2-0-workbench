import type {AnimationRendererProps} from '../contract';
import type {LessonTextBinding, LessonTextBlockBinding, TextPresentationSnapshot} from '../lesson-text-contract';
import source from './generated/g4-l3-in012-native-inputs.json';
import {getIn012Introduction} from './g4-l3-in012-intro-state';
import {COURSE_G04_L03_IN_012_CARDS as CARDS, createCourseG04L03In012OwingDragState, type CourseG04L03In012OwingDragState as State} from '../timelines/course-g04-l03-in-012-owing-drag-interaction';
const ids = (id: number) => source.texts.find(t => t.characterId === id)!.sourceTextIds;
const text = (id: number) => source.texts.find(t => t.characterId === id)!.text;
const signed = (n: number) => n < 0 ? `−${-n}` : n > 0 ? `+${n}` : '0';
export const IN012_MODERN_UI_TEXT = Object.freeze({guidance:'Select a card, then choose its position on the number line. You can also drag a card to a position.'});
const ticks = Array.from({length:17},(_,i)=>i-8);
const block = (id: string, sourceTextIds: readonly string[], role: LessonTextBlockBinding['role'], readingOrder: number, sourceShapeIds?: readonly number[]): LessonTextBlockBinding =>
  ({id,sourceTextIds,role,readingOrder,sourceShapeIds,language:'en',valueSource:'maintained-page-state'});
export const IN012_BINDING: LessonTextBinding = {
  schemaVersion:1,version:'g04-l03-placement-023-native-v1',placementId:'g04-l03-placement-023',animationId:'course-g04-l03-in-012',sourceSwfSha256:source.sourceSwfSha256,template:'exercise',
  blocks:[block('title',ids(4),'heading',0),block('instruction-first',ids(29),'question',1),block('instruction-second',ids(33),'question',2),
    ...ticks.map((n,i)=>block(`tick-${n}`,n===0?ids(8):[...ids(Math.abs(n)+9),...(n>0?ids(19):[])],'label',10+i,n<0?[20]:undefined)),
    ...CARDS.map((c,i)=>block(`target-${c.targetId}`,c.signedValue<0?ids(-c.signedValue+9):[...ids(c.signedValue+9),...ids(19)],'label',60+i,c.signedValue<0?[20]:undefined)),
    ...CARDS.map((c,i)=>block(`card-${c.id}`,ids(22+i),'answer',30+i)),
    ...CARDS.map((c,i)=>block(`placed-${c.id}`,ids(22+i),'answer',40+i)),
    block('wrong-feedback',ids(222),'feedback',50),block('wrong-close',ids(213),'label',51),
    block('final-feedback',ids(226),'feedback',53)],
};
export function in012NativeBlockers(props: AnimationRendererProps): readonly string[] {
  const blockers: string[] = [];
  if ((props.frameDomain ?? 'sprite-228') !== 'sprite-228') blockers.push('unsupported-frame-domain');
  if (!Number.isInteger(props.frame) || props.frame < 1 || props.frame > 215) blockers.push('unsupported-native-frame');
  if (props.rootFrame !== undefined && props.rootFrame !== 6) blockers.push('unsupported-root-frame');
  if (props.scenario !== 'source-static-frame') blockers.push('unsupported-scenario');
  if (props.lang !== 'en') blockers.push('english-source-visuals-only');
  if (props.entryStateSha256) blockers.push('deterministic-source-capture-excluded');
  return blockers;
}
/** Explicit interaction argument is the actual controlled reducer state. */
export function getIn012TextSnapshot(props: AnimationRendererProps, interactionState?: State): TextPresentationSnapshot {
  const blockers = [...in012NativeBlockers(props)];
  if (props.frame >= 174 && !interactionState) blockers.push('interaction-state-required');
  const interaction = interactionState ?? createCourseG04L03In012OwingDragState();
  if (props.frame > 174 && interaction.outcome !== 'complete') blockers.push('completed-interaction-required');
  const intro = !blockers.length && props.frame < 174 ? getIn012Introduction(props.frame) : undefined;
  const active = props.frame >= 174;
  const values: Record<string,{text:string;visible:boolean}> = {
    title:{text:text(4),visible:true},
    'instruction-first':{text:intro?.instructions[0]?.visibleText ?? text(29),visible:active || !!intro?.instructions[0]?.visibleText},
    'instruction-second':{text:intro?.instructions[1]?.visibleText ?? text(33),visible:active || !!intro?.instructions[1]?.visibleText},
    'wrong-feedback':{text:text(222),visible:active && interaction.outcome==='wrong'},
    'wrong-close':{text:text(213),visible:active && interaction.outcome==='wrong'},
    'final-feedback':{text:text(226),visible:active && interaction.outcome==='final-correct-feedback'},
  };
  for(const value of ticks)values[`tick-${value}`]={text:signed(value),visible:active || (intro?.ticks.find(t=>t.value===value)?.opacity??0)>0};
  for(const card of CARDS){
    values[`target-${card.targetId}`]={text:signed(card.signedValue),visible:active};
    const value=`${card.person}\n${card.relation} ${card.amountText}`;
    values[`card-${card.id}`]={text:value,visible:active?interaction.placements[card.id]===null:(intro?.cards.find(c=>c.id===card.id)?.opacity??0)>0};
    values[`placed-${card.id}`]={text:value,visible:active&&interaction.placements[card.id]!==null};
  }
  return {schemaVersion:1,animationId:IN012_BINDING.animationId,bindingVersion:IN012_BINDING.version,sourceSwfSha256:IN012_BINDING.sourceSwfSha256,
    status:blockers.length?'blocked':'ready',blockers,identity:{frame:props.frame,frameDomain:props.frameDomain??'sprite-228',rootFrame:props.rootFrame??6,scenario:props.scenario,language:props.lang,seed:props.seed>>>0,replay:props.replay??0},
    suppressedInstances:[],blocks:blockers.length?[]:IN012_BINDING.blocks.map(b=>({id:b.id,role:b.role,language:b.language,readingOrder:b.readingOrder,...values[b.id]!}))};
}
