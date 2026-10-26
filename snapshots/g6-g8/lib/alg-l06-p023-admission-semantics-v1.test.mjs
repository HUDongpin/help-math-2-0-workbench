import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readP023CanonicalSource,proposedP023Artifacts,GATES,SOURCE,SA}
 from './alg-l06-p023-admission-semantics-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('P023 source binding proves one 11–410 main range, 21/29 text and four own hit gates',()=>{
 const source=readP023CanonicalSource(root);
 assert.deepEqual(source.binding.source,SOURCE);
 assert.equal(source.binding.files.length,43);
 assert.equal(source.external.length,5);
 assert.equal(source.audit.textDefinitions.length,21);
 assert.equal(source.text.inventory.textRuns,29);
 assert.equal(source.text.textInstances.length,56);
 assert.deepEqual(source.audit.maskPlacements.map(x=>
  [x.frame,x.characterId,x.depth,x.clipDepth]),[[11,3,3,14]]);
 assert.deepEqual([source.audio.main.firstBlockFrame,source.audio.main.lastBlockFrame,
  source.audio.main.blockCount,source.audio.main.zeroPayloadBlocks.map(x=>x.frame),
  source.audio.main.negativeSeekBlocks],[11,410,400,[12],[]]);
 assert.deepEqual(source.plan.main.asset.source,source.audio.main.extractedMp3);
 assert.deepEqual(source.audio.separateSa.copy.sha256,SA.sha256);
 assert.deepEqual(Object.fromEntries(Object.entries(source.glossary).map(([key,row])=>
  [key,[row.characterId,row.instances[0].firstCandidateFrame]])),GATES);
 assert.deepEqual(source.crosswalk.missingModernKeys,['Domain']);
 assert.deepEqual(source.audit.teachingGeometry.setNotation.readingOrder.map(x=>x.text),
  ['{','1',',','10',',','100','}']);
 assert.deepEqual(source.artifacts,proposedP023Artifacts(root,source.canvas));
});
