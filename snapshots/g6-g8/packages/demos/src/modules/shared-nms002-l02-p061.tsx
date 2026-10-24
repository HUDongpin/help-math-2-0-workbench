'use client';
import {nmsL02P061ProductModule} from '../nms-l02-p061-product-module-v1';
import {P061_CANONICAL_TIMELINE} from '../timelines/shared-nms002-l02-p061';

/** Canonical source-stopped DOM entry; this wrapper alone grants no registration. */
const animationModule=nmsL02P061ProductModule;
const runtime=animationModule.runtime;
if(animationModule.key!==P061_CANONICAL_TIMELINE.animationId||
 animationModule.movie.stage.width!==P061_CANONICAL_TIMELINE.stage.width||
 animationModule.movie.stage.height!==P061_CANONICAL_TIMELINE.stage.height||
 animationModule.movie.fps!==P061_CANONICAL_TIMELINE.fps||
 animationModule.movie.frameCount!==P061_CANONICAL_TIMELINE.frameCount||
 !runtime||runtime.frameCount!==P061_CANONICAL_TIMELINE.rootFrameCount||
 runtime.defaultFrameDomain!==P061_CANONICAL_TIMELINE.frameDomain||
 runtime.frameDomains?.length!==1||
 runtime.frameDomains[0]?.id!==P061_CANONICAL_TIMELINE.frameDomain||
 runtime.frameDomains[0]?.frameCount!==P061_CANONICAL_TIMELINE.frameCount||
 runtime.frameDomains[0]?.rootFrame!==P061_CANONICAL_TIMELINE.rootBeginFrame||
 animationModule.playbackMode!==P061_CANONICAL_TIMELINE.productPlaybackMode||
 animationModule.playbackEndFrameByDomain?.[P061_CANONICAL_TIMELINE.frameDomain]!==P061_CANONICAL_TIMELINE.productPlaybackEndFrame||
 animationModule.audioCues.length!==0)
 throw Error('P061_CANONICAL_MODULE_RUNTIME_MISMATCH');

export default animationModule;
