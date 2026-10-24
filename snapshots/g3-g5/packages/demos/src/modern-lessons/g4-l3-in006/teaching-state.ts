import data from './source.generated.json';
export function teachingState(inputFrame: number) {
  const frame = Math.max(1, Math.min(1053, Math.floor(Number.isFinite(inputFrame) ? inputFrame : 1)));
  const first = frame <= 630;
  const prompt = frame < 932 ? (first ? '4 to −1' : '−1 to 10') : null;
  const words = data.words.slice(0, 2).flatMap(row => row.words.filter(w => w.fullyContainedFromFrame !== null && frame >= w.fullyContainedFromFrame).map(w => w.text));
  const evidence = data.emphasisByFrame[frame - 1];
  const outlinedAxis = evidence.axis[0] ?? null;
  const prompt4 = evidence.prompt4;
  const promptMinus1 = evidence.promptMinus1;
  const prompt10 = evidence.prompt10;
  return {
    frame, prompt, words, outlinedAxis, axisEmphasis: evidence.axis,
    demonstrationControl: data.pointerByFrame[frame - 1].control,
    paletteTarget: data.pointerByFrame[frame - 1].paletteBoundingBoxTarget,
    promptEmphasis: { four: prompt4, minusOne: promptMinus1, ten: prompt10 },
    equation: frame >= 512 && frame <= 628 ? '4 + −5 = −1' : null,
    equationEmphasis: [518,520,522].includes(frame) ? '−5' : [542,544,546].includes(frame) ? '−1' : null,
    arrows: data.arrowsByFrame[frame - 1],
    blankFields: frame >= 952,
    axis: data.axis.map((label,index) => ({value:index - 15,sourceText:label.text,tickXTwips:label.tickXTwips})),
    palette: [1,2,4,5],
    quiz: false as const,
  };
}
export const sourceShapePaths = data.shapePaths;
