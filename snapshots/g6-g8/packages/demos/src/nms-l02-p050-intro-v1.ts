import {P050_INTRO_RANGES} from './generated/nms-l02-p050-intro-data-v1';
/** Source-authored direct display state, before the interactive stop at209. */
export function p050Intro(frame: number) {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > 208) throw Error('P050_INTRO_FRAME');
  const range = P050_INTRO_RANGES.find(row => row.first <= frame && frame <= row.last);
  if (!range) throw Error('P050_INTRO_RANGE');
  return range.value;
}
