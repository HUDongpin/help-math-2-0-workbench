import assert from 'node:assert/strict';
// A bounded semantic projection of this page's source text and vector math.
// XML/FFDec audit supplies full-alpha timing and fraction/divide-shape interpretation.
// It does not grant original-runtime or human review authority.
export async function compileNmsL2P005Reading({sourceSpec, mainFacts, readBound, literalReading}) {
  assert.equal(sourceSpec.animationId, 'shared-nms002-l02-p005');
  assert.equal(sourceSpec.main.frameCount, 990);
  const proof=JSON.parse((await readBound(sourceSpec.sourceMathReading.audit.path,sourceSpec.sourceMathReading.audit)).bytes);
  assert.equal(proof.animationId,sourceSpec.animationId);
  for(const p of [proof.sourceXml,proof.sourceFacts,proof.diagnostic]) await readBound(p.path,p);
  const text={};
  for(const binding of sourceSpec.sourceMathReading.textBindings){
    const {characterId,...pin}=binding;
    text[characterId]=(await readBound(pin.path,pin)).bytes.toString().trim();
    assert(mainFacts.placementEdges.some(p=>p.characterId===characterId),'source placed math literal');
  }
  assert.deepEqual(text,{334:'6',335:'8',336:'=',346:'2',350:'3',351:'4',357:'= 0.75',362:'= 75%'});
  assert.deepEqual(proof.math.fractionBarCharacterIds,[332,333,345,352]);assert.equal(proof.math.divideGlyphCharacterId,347);
  for(const characterId of [...proof.math.fractionBarCharacterIds,347]) assert(mainFacts.placementEdges.some(p=>p.characterId===characterId));
  const reveal=(characterId,depth)=>{
    const row=proof.reveals.find(p=>p.characterId===characterId&&p.depth===depth);
    assert(row&&mainFacts.placementEdges.some(p=>p.characterId===characterId&&p.firstFrame===row.firstFrame));return row.fullAlphaFrame;
  };
  assert.deepEqual([reveal(334,230),reveal(346,234),reveal(350,240),reveal(357,244),reveal(362,245)],[324,375,419,446,487]);
  const [n,d,v,rn,rd]=[334,335,346,350,351].map(k=>Number(text[k]));
  assert(n/v===rn&&d/v===rd&&n/d===0.75&&100*n/d===75,'source equivalence');
  const fraction=`${text[334]}/${text[335]}`;
  const divided=`${fraction} ${text[336]} (${text[334]} ÷ ${text[346]})/(${text[335]} ÷ ${text[346]})`;
  const reduced=`${divided} ${text[336]} ${text[350]}/${text[351]}`;
  const decimal=`${reduced} ${text[357]}`;
  const steps=[[324,fraction],[375,divided],[419,reduced],[446,decimal],[487,`${decimal} ${text[362]}`]];
  return [...literalReading,...steps.map(([firstFrame,text],i)=>({firstFrame,lastFrame:steps[i+1]?.[0]-1||990,text}))];
}
