/** Pure work-only source proposal. No renderer, clock, callback or host side effects. */
export function getNativeState(config, frame) {
  if (!Number.isInteger(frame) || frame < 1 || frame > config.frameCount) throw new RangeError('Source frame must be1..555');
  const source = config.stateBank[config.frameStateIndices[frame - 1]];
  const whole = value => value < 0 ? `−${-value}` : String(value);
  return {
    frame, source,
    prefixEmphasis: source.prefixEmphasis?.readable ? source.prefixEmphasis : null,
    paragraphs: config.wordRows.map((r, i) => r.words.slice(0, source.wordCounts[i]).map(w => w.word).join(' ')),
    patternPrefix: source.pattern.readable ? '12, 9, 6, 3, 0,' : null,
    fillTexts: source.fills.map(f => f?.readable ? whole(f.value) : null),
    axisLabels: source.axis.readable ? config.axisDefinitions.map(a => ({value:a.value,text:whole(a.value)})) : [],
    arrow: source.arrow,
    movingLabels: source.movingMinusThree.filter(p => p.readable).map(p => ({...p,text:whole(p.value)})),
    signedFlash: source.signedFlash?.readable ? {...source.signedFlash,text:whole(source.signedFlash.value)} : null,
    keyTerms: config.keyTerms.entries.filter(k => frame >= k.readableFromFrame),
  };
}
export function keywordHostRequest(config, frame, keyAttribute) {
  const term = getNativeState(config,frame).keyTerms.find(k => k.keyAttribute === keyAttribute);
  if (!term) return null;
  return {type:'open-keyterm',entryId:term.entryId,sourceAnimationId:config.animationId,
    playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'};
}
export const closeKeywordRequest = () => ({type:'close-keyterm'});
