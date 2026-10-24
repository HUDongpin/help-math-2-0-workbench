import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Script, createContext} from 'node:vm';
import {PAIR_PAGES} from './build-g678-alg-l12-glossary-pair-inputs.mjs';
import {PAIR_CANVAS_EXPECTATIONS, buildGlossaryPairCanvasCandidates} from './build-g678-alg-l12-glossary-pair-canvas.mjs';

test('two different physical exports produce source-only browser assets through one generator', () => {
  const {output,pages}=buildGlossaryPairCanvasCandidates();
  assert.deepEqual(pages.map(page=>page.id),PAIR_PAGES.map(page=>page.id));
  assert.equal(output.size,12,'five content outputs and one source receipt per page');
  for (const source of PAIR_PAGES) {
    const expected=PAIR_CANVAS_EXPECTATIONS[source.short];
    const base=`output/alg-l12-next-glossary-20260927/candidates/${source.short}`;
    const runtime=output.get(`${base}/canvas-renderer.js`);
    const metadata=JSON.parse(output.get(`${base}/runtime-meta.json`));
    const spec=JSON.parse(output.get(`${base}/adapter-spec.json`));
    const receipt=JSON.parse(output.get(`${base}/source-canvas-receipt.json`));
    const structure=JSON.parse(output.get(`${base}/source-structure.json`));
    assert.equal(spec.ffdecExport.targetSpriteObjectId,expected.sprite);
    assert.deepEqual(spec.ffdecExport.exportInternalTranslation,
      {x:expected.internal[0],y:expected.internal[1]});
    assert.equal(spec.timeline.local.frameCount,expected.frames);
    assert.deepEqual(spec.timeline.stageRenderOffset,
      {x:(8248-Math.round(expected.internal[0]*20))/20,
        y:(5666-Math.round(expected.internal[1]*20))/20});
    assert.equal(structure.maskCounts.reduce((a,b)=>a+b,0),expected.maskBlocks);
    assert.deepEqual(structure.audio.negativeSeekBlocks,expected.audio.negativeSeekBlocks);
    assert.equal(receipt.source.sha256,source.sha256);
    assert.equal(receipt.sourceCompanionShapeId,expected.companion);
    assert.equal(receipt.outputs.length,5);
    assert.equal(metadata.animationId,source.id);
    assert.equal(metadata.sourceSwfSha256,source.sha256);
    assert.equal(metadata.requiredCanvas.width,1600);
    assert.equal(metadata.requiredCanvas.height,1200);
    for (const key of ['audioPlaybackEnabled','glossaryBehaviorEnabled','nativeTextSuppressionApplied',
      'originalRuntimeAccepted','fidelityAccepted','audioAccepted','humanAccepted','ownerAccepted',
      'strictComplete','published']) assert.equal(metadata[key],false,`${source.short}: ${key}`);
    assert.match(runtime,new RegExp(`place\\("shape${expected.companion}"`));
    assert(!/\b(?:AudioContext|fetch|setInterval|setTimeout|DoHyperLinks|_root|_global)\b/.test(runtime));
    const context=createContext({});new Script(runtime).runInContext(context,{timeout:3000});
    const asset=context.HELP_MATH_CANVAS_ASSETS[source.id];
    assert.equal(asset.metadata.animationId,source.id);
    assert.equal(asset.resolveFrameState({frame:expected.frames,frameDomain:`sprite-${expected.sprite}`,
      rootFrame:6,scenario:'source-static-frame',lang:'en',seed:0}).localFrame,expected.frames);
    assert.throws(()=>asset.resolveFrameState({frame:1,frameDomain:`sprite-${expected.sprite}`,
      rootFrame:6,scenario:'source-static-frame',lang:'es',seed:0}));
    assert.throws(()=>asset.resolveFrameState({frame:1,frameDomain:`sprite-${expected.sprite}`,
      rootFrame:6,scenario:'source-static-frame',lang:'en',seed:0,audio:true}));
  }
});
