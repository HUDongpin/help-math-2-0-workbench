import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {P026_DOMAINS, P026_DEFAULTS, P026_TEXT_BINDING, algL07P026Frame} from './alg-l07-p026-frame-v1';
import {ALG_L07_P026_SOURCE as S} from './alg-l07-p026-source-v1';
import {SourceStreamRunsClockV1} from './source-stream-runs-clock-v1';

test('all 13 source domains and 1978 exact requirement queries have complete native text snapshots', () => {
  const raw = JSON.parse(fs.readFileSync('migrations/shared-alg001-l07-p026/native-v1/source-model-v1.json', 'utf8'));
  assert.deepEqual(P026_DOMAINS.map(d => [d.id, d.frameCount]).sort(), raw.timelines.map((t: {timelineId:string;declaredFrameCount:number}) => [t.timelineId,t.declaredFrameCount]).sort());
  const coverage = JSON.parse(fs.readFileSync('migrations/shared-alg001-l07-p026/evidence/full-frame-coverage.json', 'utf8'));
  let queries = 0;
  for (const req of coverage.requirements) {
    for (let frame = 1; frame <= req.requiredRange.lastFrame; frame++) {
      const view = algL07P026Frame(frame, {frame, frameDomain:req.frameDomainId, scenario:req.scenario, lang:req.language, seed:0, replay:2, requirementId:req.requirementId, traceId:req.traceId, entryStateSha256:req.entryStateSha256});
      assert.equal(view.textSnapshot.status, 'ready');
      assert.deepEqual(view.textSnapshot.blockers, []);
      assert.equal(view.frame, frame);
      assert.equal(view.frameDomain, req.frameDomainId);
      assert.equal(view.rootFrame, req.frameDomainId === 'root' ? frame : 6);
      assert.equal(view.replay, 2);
      queries++;
    }
  }
  assert.equal(queries,1978);

});

test('A negative fraction, B correct coefficient and C/D values bind to source identities',()=>{
 assert.deepEqual(S.answers.map(a=>[a.letter,a.instance,a.characterId,a.value]),[['A','AnsBtn1',30,'–5/9'],['B','AnsBtn2',31,'–5'],['C','AnsBtn3',30,'5'],['D','AnsBtn4',30,'9']]);
 assert.deepEqual(S.answers[0].valueIds,[24,26,25]);assert.equal(S.answers[0].numerator,'5');assert.equal(S.answers[0].denominator,'9');
 assert.equal(algL07P026Frame(253).textSnapshot.blocks.filter(b=>b.visible&&b.id.startsWith('value-')).length,4);
 assert.equal(algL07P026Frame(332).textSnapshot.blocks.filter(b=>b.visible&&b.id.startsWith('value-')).length,1);
 assert.throws(()=>algL07P026Frame(333));
});

test('wrong feedback branches preserve titles, first/second text, and their distinct source Close windows', () => {
  for (const [id, first, hold, title] of [[148,16,23,'Try Again!'],[176,13,20,'Incorrect!'],[162,13,20,'incorrect!']] as const) {
    for (const second of [false,true]) {
      const scenario = second ? 'wrong-second' : 'wrong-first';
      const query=(frame:number)=>algL07P026Frame(frame,{frame,frameDomain:`sprite-${id}`,scenario,lang:'es',seed:0});
      assert(!query(first-1).closeVisible);
      assert(query(first).closeVisible);
      assert(query(hold).closeVisible);
      assert(!query(hold+1).closeVisible);
      assert.equal(query(hold).feedbackTitle,title);
      assert.equal(query(hold).state.wrongText,second?'Select the coefficient of the x-term. ':'Select the coefficient of the x-term. Try again.');
    }
  }
});

test('all eight decoded source stream clocks validate including ADPCM feedback', () => {
  for (const source of S.clocks) {
    const plan={version:1 as const,sourceSwfSha256:S.sourceSha256,frameDomain:`sprite-${source.spriteId}`,firstFrame:1 as const,lastFrame:source.sourceFrameCount,fps:12 as const,decoder:source.decoder,segments:source.segments,emptyNegativeBlocks:source.emptyNegativeBlocks,alignmentStatus:'source-run-candidate-not-original-runtime-accepted' as const};
    new SourceStreamRunsClockV1(plan,{commitHeldFrame:()=>true});
    assert.equal(source.decoder.sampleRate,22050);
    assert.equal(source.decoder.channels,1);
  }
  assert.equal(S.clocks.length,8);
  assert.deepEqual(S.branches.filter(b=>b.kind==='right'&&b.naturallySelected).map(b=>b.spriteId),[90,123,102,65]);
  assert.equal(S.sa.decodedSamples,313344);
});
