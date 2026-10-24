import {P038_PRESENTATION_SOURCE as PRESENTATION} from './generated/nms-l02-p038-presentation-source-v1';
import {P038_TEACHING_SOURCE as SOURCE} from './generated/nms-l02-p038-teaching-source-v1';
import {p038GridFrame} from './nms-l02-p038-grid-v1';
export function p038Teaching(frame: number, reducedMotion = false) {
  const grid = p038GridFrame(frame);
  const runs = SOURCE.instructionRuns.map(run => {
    const text = run.glyphs.map((glyph, index) => {
      if (glyph.frame !== null) return frame >= glyph.frame ? glyph.text : '';
      const following = run.glyphs.slice(index + 1).find(g => g.frame !== null);
      const previous = run.glyphs.slice(0, index).reverse().find(g => g.frame !== null);
      const boundary = following?.frame ?? previous?.frame ?? run.fullFrame;
      return frame >= boundary ? glyph.text : '';
    }).join('');
    return Object.freeze({sourceTextId: run.sourceTextId, text, termId: run.termId,
      termEnabled: run.termId !== null && frame >= run.fullFrame});
  });
  const presentation = PRESENTATION.frames[frame - 1];
  return Object.freeze({frame, grid, runs: Object.freeze(runs), fractionVisible: frame >= SOURCE.fractionFrame,
    decimalVisible: frame >= SOURCE.decimalFrame,
    fractionAlpha: presentation.fractionAlpha, decimalAlpha: presentation.decimalAlpha,
    gridEmphasis: reducedMotion && frame >= 446 && frame <= 452 ? 'filled' : presentation.gridEmphasis});
}
