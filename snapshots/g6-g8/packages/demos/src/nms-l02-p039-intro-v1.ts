import { P039_INTRO_SOURCE } from './generated/nms-l02-p039-intro-source-v1';

/** P039 main237 introductory frames only. Practice uses the separate interactive state. */
export function p039IntroAt(frame: number) {
  if (!Number.isInteger(frame) || frame < 1 || frame > 545) throw Error('P039_INTRO_FRAME');
  const beats = P039_INTRO_SOURCE.beats;
  let lo = 0, hi = beats.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (beats[mid].firstFrame <= frame) lo = mid;
    else hi = mid - 1;
  }
  const sentences = P039_INTRO_SOURCE.sentences.map(sentence => {
    const visibleOffsets = sentence.glyphs.filter(glyph => glyph.firstFrame <= frame).map(glyph => glyph.offset);
    // Preserve spaces in place so a later renderer can hide glyphs without shifting layout.
    const visible = new Set<number>(visibleOffsets);
    const maskedText = [...sentence.text].map((char, offset) => char === ' ' || visible.has(offset) ? char : '\u00a0').join('');
    return Object.freeze({ text: sentence.text, maskedText, visibleOffsets: Object.freeze(visibleOffsets), complete: visibleOffsets.length === sentence.glyphs.length });
  });
  return Object.freeze({ frame, ...beats[lo].pose, sentences: Object.freeze(sentences) });
}
