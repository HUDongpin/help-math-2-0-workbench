import assert from 'node:assert/strict';
// Source letter runs become readable words only after their authored motion settles.
export async function compileNmsL8P004Reading({sourceSpec,mainFacts,readBound,literalReading}) {
  assert.equal(sourceSpec.animationId,'shared-nms002-l08-p004');
  const proof=JSON.parse((await readBound(sourceSpec.sourceHeadlineReading.audit.path,sourceSpec.sourceHeadlineReading.audit)).bytes);
  assert.equal(proof.animationId,sourceSpec.animationId);
  for(const p of [proof.sourceXml,proof.sourceFacts,proof.diagnostic])await readBound(p.path,p);
  const glyph={};for(const {characterId,...pin} of sourceSpec.sourceHeadlineReading.textBindings){glyph[characterId]=(await readBound(pin.path,pin)).bytes.toString().trim();assert(glyph[characterId].length===1);}
  const words=proof.words.map(word=>{
    const sorted=[...word.glyphs].sort((a,b)=>Number(a.transform.transX)-Number(b.transform.transX));
    for(const g of sorted){assert(mainFacts.placementEdges.some(p=>p.characterId===g.characterId&&p.distinctFrames.includes(g.firstFrame)));assert.equal(g.hiddenFrame,1163);assert.equal(g.transform.transY,'-3154');}
    const text=sorted.map(g=>glyph[g.characterId]).join('');assert.equal(text,word.text);assert.equal(word.settledFrame,Math.max(...sorted.map(g=>g.finalTransformFrame)));return text;
  });
  assert.deepEqual(words,['Caribbean','Birds','and','Animals']);assert.equal(proof.headlineFirstFrame,Math.max(...proof.words.map(w=>w.settledFrame)));assert.equal(proof.headlineLastFrame,1162);
  assert.equal(proof.mongoose.firstFrame,1517);assert.equal(proof.mongoose.displayFirstFrame,1535);
  assert(proof.mongoose.maskTimeline.some(p=>p.frame===1535&&p.objectID==='203'&&p.clipDepth==='63'));
  assert.deepEqual(literalReading,[{firstFrame:1535,lastFrame:1557,text:'5,000 Mongoose'}]);
  return [{firstFrame:proof.headlineFirstFrame,lastFrame:proof.headlineLastFrame,text:words.join(' ')},...literalReading];
}
