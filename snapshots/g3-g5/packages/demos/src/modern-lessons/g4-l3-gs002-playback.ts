import source from './generated/g4-l3-gs002-intro-controls.json';
import type {LessonTextFrameTransition} from '../lesson-text-contract';

/** Source button action, resolved by its actual per-frame display-list identity. */
export function getGs002NewGameTransition(frame:number):LessonTextFrameTransition|null{
  if(!Number.isInteger(frame)||frame<1||frame>426)return null;
  const control=source.frames[frame-1].controls.find(c=>c.role==='newGame');
  if(!control||!(control.characterId===62||control.characterId===124))return null;
  const action=source.newGameActions[control.characterId];
  return {fromFrame:frame,toFrame:action.targetFrame,stopFrame:action.stopFrame};
}

/** Explicit modern accessibility continuation, not an authored button action. */
export const GS002_CONTINUE_TO_GAME:LessonTextFrameTransition={fromFrame:426,toFrame:427,stopFrame:427};
export const GS002_FRAME_CONTROL={frameDomain:'sprite-321',completionFrame:427,
  transitions:[...source.frames.map(s=>getGs002NewGameTransition(s.frame)).filter((e):e is LessonTextFrameTransition=>e!==null),GS002_CONTINUE_TO_GAME]};
