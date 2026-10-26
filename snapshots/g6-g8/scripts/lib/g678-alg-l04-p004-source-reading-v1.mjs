import assert from 'node:assert/strict';
// Source-audited two-scene ratio projection. Record separators describe text runs.
export async function compileAlgL4P004Reading({sourceSpec, mainFacts, readBound, literalReading}) {
  assert.equal(sourceSpec.animationId,'shared-alg001-l04-p004');assert.deepEqual(literalReading,[]);
  const proof=JSON.parse((await readBound(sourceSpec.sourceMathReading.audit.path,sourceSpec.sourceMathReading.audit)).bytes);
  assert.equal(proof.animationId,sourceSpec.animationId);
  for(const p of [proof.sourceXml,proof.sourceFacts,proof.diagnostic])await readBound(p.path,p);
  const text={};for(const {characterId,...pin} of sourceSpec.sourceMathReading.textBindings){
    text[characterId]=(await readBound(pin.path,pin)).bytes.toString().trim();
    assert(mainFacts.placementEdges.some(p=>p.characterId===characterId),'source math placement');
  }
  assert.deepEqual(text,{15:'drivers\n--- RECORDSEPARATOR ---\nwheels',16:'3',17:'=',18:'12',24:'1',25:'4',31:'rider\n--- RECORDSEPARATOR ---\nwheels',32:'6',34:'=',36:'1',37:'2'});
  const row=(characterId,depth)=>{const row=proof.reveals.find(p=>p.characterId===characterId&&p.depth===depth);assert(row&&mainFacts.placementEdges.some(p=>p.characterId===characterId&&p.firstFrame===row.firstFrame));return row;};
  assert.deepEqual(row(15,6).fullAlphaSpans,[[130,505]]);assert.deepEqual(row(15,6).visibleSpans,[[126,509]]);
  assert.deepEqual(row(24,3).fullAlphaSpans,[[232,505]]);assert.deepEqual(row(31,6).fullAlphaSpans,[[601,1006]]);
  assert.deepEqual(row(36,4).fullAlphaSpans,[[702,1006]]);
  assert(Number(text[16])/Number(text[18])===Number(text[24])/Number(text[25]));
  assert(Number(text[32])/Number(text[18])===Number(text[36])/Number(text[37]));
  const label=id=>text[id].split('\n--- RECORDSEPARATOR ---\n').join(' / ');
  const cars=`${label(15)} ${text[17]} ${text[16]}/${text[18]}`;
  const bicycles=`${label(31)} ${text[17]} ${text[32]}/${text[18]}`;
  return [{firstFrame:130,lastFrame:231,text:cars},{firstFrame:232,lastFrame:509,text:`${cars} ${text[17]} ${text[24]}/${text[25]}`},
    {firstFrame:601,lastFrame:701,text:bicycles},{firstFrame:702,lastFrame:1006,text:`${bicycles} ${text[34]} ${text[36]}/${text[37]}`}];
}
