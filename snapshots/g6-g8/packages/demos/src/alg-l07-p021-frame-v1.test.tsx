import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {P021_DOMAINS, P021_DEFAULTS, P021_TEXT_BINDING, algL07P021Frame} from './alg-l07-p021-frame-v1';
import {ALG_L07_P021_SOURCE as S} from './alg-l07-p021-source-v1';
import {SourceStreamRunsClockV1} from './source-stream-runs-clock-v1';

test('all 14 source domains and 1678 exact requirement queries have complete native text snapshots', () => {
  const raw = JSON.parse(fs.readFileSync('migrations/shared-alg001-l07-p021/native-v1/source-model-v1.json', 'utf8'));
  assert.deepEqual(P021_DOMAINS.map(d => [d.id, d.frameCount]).sort(), raw.timelines.map((t: {timelineId:string;declaredFrameCount:number}) => [t.timelineId,t.declaredFrameCount]).sort());
  const coverage = JSON.parse(fs.readFileSync('migrations/shared-alg001-l07-p021/evidence/full-frame-coverage.json', 'utf8'));
  let queries = 0;
  for (const req of coverage.requirements) {
    for (let frame = 1; frame <= req.requiredRange.lastFrame; frame++) {
      const view = algL07P021Frame(frame, {frame, frameDomain:req.frameDomainId, scenario:req.scenario, lang:req.language, seed:0, replay:2, requirementId:req.requirementId, traceId:req.traceId, entryStateSha256:req.entryStateSha256});
      assert.equal(view.textSnapshot.status, 'ready');
      assert.deepEqual(view.textSnapshot.blockers, []);
      assert.equal(view.frame, frame);
      assert.equal(view.frameDomain, req.frameDomainId);
      assert.equal(view.rootFrame, req.frameDomainId === 'root' ? frame : 6);
      assert.equal(view.replay, 2);
      queries++;
    }
  }
  assert.equal(queries,1678);
  assert.equal(P021_DEFAULTS['sprite-158'], 'right-feedback-unselected');
  assert.throws(() => algL07P021Frame(10, {frame:10,frameDomain:'sprite-158',scenario:'right-feedback',lang:'en',seed:0}));
  assert.equal(algL07P021Frame(10,{frame:10,frameDomain:'sprite-158',scenario:'right-feedback-unselected',lang:'en',seed:0}).feedbackTitle,'Well done!');
});

test('native graph labels retain exact character and placement identities, including source sign inconsistency', () => {
  const raw = JSON.parse(fs.readFileSync('migrations/shared-alg001-l07-p021/native-v1/source-model-v1.json','utf8'));
  const timeline = raw.timelines.find((t:{timelineId:string}) => t.timelineId === 'sprite-215');
  const quiz = timeline.frames[96];
  assert.equal(P021_TEXT_BINDING.blocks.filter(b=>b.id.startsWith('graph-')).length,56);
  for (const graph of S.graphs) {
    for (const label of graph.labels) {
      const placement = quiz.find((p:{depth:number}) => p.depth === label.sourceDepth);
      assert.equal(placement.characterId,label.sourceCharacterId);
      const text = raw.texts.find((t:{characterId:number})=>t.characterId===label.sourceCharacterId);
      assert.equal(text.runs.map((r:{text:string})=>r.text).join(''),label.text);
    }
    assert.deepEqual(graph.labels.slice(9,12).map(l=>l.text),graph.letter==='A'?['6','4','2']:['-6','-4','-2']);
  }
  assert.deepEqual(S.answers.map(a=>[a.letter,a.instance,a.characterId]),[['A','AnsBtn4',35],['B','AnsBtn1',34],['C','AnsBtn3',34],['D','AnsBtn2',34]]);
  assert.equal(algL07P021Frame(97).textSnapshot.blocks.filter(b=>b.visible&&b.id.startsWith('graph-')).length,56);
  assert.equal(algL07P021Frame(154).textSnapshot.blocks.filter(b=>b.visible&&b.id.startsWith('graph-')).length,14);
  assert.throws(()=>algL07P021Frame(155));
});

test('wrong feedback branches preserve titles, first/second text, and their distinct source Close windows', () => {
  for (const [id, first, hold, title] of [[183,16,23,'Try Again!'],[198,13,20,'Incorrect!'],[213,14,21,'Try Again!']] as const) {
    for (const second of [false,true]) {
      const scenario = second ? 'wrong-second' : 'wrong-first';
      const query=(frame:number)=>algL07P021Frame(frame,{frame,frameDomain:`sprite-${id}`,scenario,lang:'es',seed:0});
      assert(!query(first-1).closeVisible);
      assert(query(first).closeVisible);
      assert(query(hold).closeVisible);
      assert(!query(hold+1).closeVisible);
      assert.equal(query(hold).feedbackTitle,title);
      assert.equal(query(hold).state.wrongText,second?'Choose the graph that is a straight line. ':'Choose the graph that is a straight line. Try again.');
    }
  }
});

test('all nine original MP3 domain runs validate without treating the source fifth branch as reachable', () => {
  for (const source of S.clocks) {
    const plan={version:1 as const,sourceSwfSha256:S.sourceSha256,frameDomain:`sprite-${source.spriteId}`,firstFrame:1 as const,lastFrame:source.sourceFrameCount,fps:12 as const,decoder:source.decoder,segments:source.segments,emptyNegativeBlocks:source.emptyNegativeBlocks,alignmentStatus:'source-run-candidate-not-original-runtime-accepted' as const};
    new SourceStreamRunsClockV1(plan,{commitHeldFrame:()=>true});
    assert.equal(source.decoder.sampleRate,22050);
    assert.equal(source.decoder.channels,1);
  }
  assert.equal(S.clocks.length,9);
  assert.deepEqual(S.branches.filter(b=>b.kind==='right'&&b.naturallySelected).map(b=>b.spriteId),[101,67,137,109]);
  assert.equal(S.sa.decodedSamples,497664);
});
