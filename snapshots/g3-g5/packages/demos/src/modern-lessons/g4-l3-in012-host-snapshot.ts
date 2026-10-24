import type {RuntimeContext} from '../contract';
import type {TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import type {CourseG04L03In012OwingDragState as Interaction} from '../timelines/course-g04-l03-in-012-owing-drag-interaction';
import {getIn012TextSnapshot, IN012_BINDING} from './g4-l3-in012-text';

/** Host source state and native interaction are separate evidence inputs. */
export function getIn012HostSnapshot(state: SourceStaticCanvasFrameState, context: RuntimeContext, interaction?: Interaction): TextPresentationSnapshot {
  const snapshot = getIn012TextSnapshot(context, interaction);
  const blockers = [...snapshot.blockers];
  if (state.animationId !== IN012_BINDING.animationId || state.sourceSwfSha256 !== IN012_BINDING.sourceSwfSha256) blockers.push('source-identity-mismatch');
  if (state.status !== 'ready' || state.blocker) blockers.push('source-state-not-ready');
  if (state.frame !== context.frame || state.frameDomain !== (context.frameDomain ?? 'sprite-228') || state.rootFrame !== (context.rootFrame ?? 6) || state.language !== context.lang || state.scenario !== context.scenario || state.seed !== context.seed) blockers.push('source-context-mismatch');
  if (!Number.isSafeInteger(context.seed) || context.seed < 0 || context.seed > 0xffffffff || !Number.isSafeInteger(context.replay ?? 0) || (context.replay ?? 0) < 0) blockers.push('invalid-reset-identity');
  return blockers.length ? {...snapshot,status:'blocked',blockers:[...new Set(blockers)],blocks:[]} : snapshot;
}
