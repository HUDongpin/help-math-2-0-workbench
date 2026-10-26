import assert from 'node:assert/strict';
import test from 'node:test';
import {readP027SourceEvidence,validateP027SourceEvidence,KEYS,MASKS,
 MORPH_WINDOWS,SA,SOURCE} from './alg-l06-p027-admission-semantics-v1.mjs';

test('P027 physical source and technical decode retain independent limits',()=>{
 const evidence=readP027SourceEvidence();
 assert.equal(evidence.sourcePlan.source.swf.sha256,SOURCE.sha256);
 assert.equal(evidence.sourcePlan.source.separateSa.sha256,SA.sha256);
 assert.deepEqual(evidence.sourcePlan.glossary.map(row=>row.keyAttribute),
  KEYS.map(row=>row[0]));
 assert.deepEqual(evidence.canvas.sourceClipMasks.map(row=>[
  row.frame,row.characterId,row.depth,row.clipDepth]),MASKS);
 assert.deepEqual(evidence.canvas.sourceMorph.windows,MORPH_WINDOWS);
 assert.equal(evidence.native.canvasInstanceSuppressionSupported,false);
 assert.equal(evidence.audioPlan.optionalSpanishAudio.localeAutoplay,false);
 assert.equal(evidence.browserDecode.results[0].samples,1412352);
 assert.equal(evidence.browserDecode.results[1].samples,1307520);
 assert.equal(validateP027SourceEvidence(evidence),true);
});

test('P027 source semantics reject morph, mask, glossary and audio inventions',()=>{
 const evidence=readP027SourceEvidence();
 const changed=(alter)=>{const copy=structuredClone(evidence);alter(copy);
  assert.throws(()=>validateP027SourceEvidence(copy));};
 changed(copy=>{copy.canvas.sourceMorph.windows[0][1]=314;});
 changed(copy=>{copy.canvas.sourceClipMasks[2].clipDepth=23;});
 changed(copy=>{copy.sourcePlan.glossary[0].keyAttribute='Vertical';});
 changed(copy=>{copy.native.canvasInstanceSuppressionSupported=true;});
 changed(copy=>{copy.audioPlan.optionalSpanishAudio.localeAutoplay=true;});
 changed(copy=>{copy.browserDecode.results[0].pcmSha256='0'.repeat(64);});
 changed(copy=>{copy.stableDecode.status='failed';});
});
