import assert from 'node:assert/strict';
import test from 'node:test';
import canonicalModule from '../src/modules/shared-nms002-l02-p056';
import {nmsL02P056ProductModule} from '../src/nms-l02-p056-product-module-v1';
import {P056_CANONICAL_TIMELINE} from '../src/timelines/shared-nms002-l02-p056';

test('canonical DOM entry is the maintained product module and locks its source domain',()=>{
 assert.equal(canonicalModule,nmsL02P056ProductModule);
 assert.equal(P056_CANONICAL_TIMELINE.animationId,canonicalModule.key);
 assert.deepEqual(P056_CANONICAL_TIMELINE.stage,{width:800,height:600});
 assert.equal(P056_CANONICAL_TIMELINE.fps,12);
 assert.equal(P056_CANONICAL_TIMELINE.rootFrameCount,10);
 assert.equal(P056_CANONICAL_TIMELINE.rootBeginFrame,6);
 assert.equal(P056_CANONICAL_TIMELINE.frameDomain,'sprite-24');
 assert.equal(P056_CANONICAL_TIMELINE.frameCount,234);
 assert.equal(P056_CANONICAL_TIMELINE.sourceSwfSha256,
  'a1872d6c20987340889c1077d6720cbfe046faa3b5228164987e0834f3c639be');
 assert.equal(P056_CANONICAL_TIMELINE.sourceChildTerminalStopPresent,false);
 assert.equal(P056_CANONICAL_TIMELINE.productPlaybackMode,'once');
 assert.equal(P056_CANONICAL_TIMELINE.productPlaybackEndFrame,234);
 assert.equal(P056_CANONICAL_TIMELINE.originalRuntimeParityEstablished,false);
 assert.equal(canonicalModule.playbackMode,'once');
 assert.equal(canonicalModule.playbackEndFrameByDomain?.['sprite-24'],234);
});
