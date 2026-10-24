'use client';
import {nmsL02P057ProductModule} from '../nms-l02-p057-product-module-v1';
import {P057_CANONICAL_TIMELINE} from '../timelines/shared-nms002-l02-p057';

/** Canonical maintained DOM entry; this wrapper alone grants no registration. */
const animationModule=nmsL02P057ProductModule;
const runtime=animationModule.runtime;
if(animationModule.key!==P057_CANONICAL_TIMELINE.animationId||
 animationModule.movie.stage.width!==P057_CANONICAL_TIMELINE.stage.width||
 animationModule.movie.stage.height!==P057_CANONICAL_TIMELINE.stage.height||
 animationModule.movie.fps!==P057_CANONICAL_TIMELINE.fps||
 animationModule.movie.frameCount!==P057_CANONICAL_TIMELINE.frameCount||
 !runtime||runtime.frameCount!==P057_CANONICAL_TIMELINE.rootFrameCount||
 runtime.defaultFrameDomain!==P057_CANONICAL_TIMELINE.frameDomain||
 runtime.frameDomains?.length!==1||
 runtime.frameDomains?.[0]?.id!==P057_CANONICAL_TIMELINE.frameDomain||
 runtime.frameDomains?.[0]?.frameCount!==P057_CANONICAL_TIMELINE.frameCount||
 runtime.frameDomains?.[0]?.rootFrame!==P057_CANONICAL_TIMELINE.rootBeginFrame||
 animationModule.playbackMode!==P057_CANONICAL_TIMELINE.productPlaybackMode||
 animationModule.playbackEndFrameByDomain?.[P057_CANONICAL_TIMELINE.frameDomain]!==
  P057_CANONICAL_TIMELINE.productPlaybackEndFrame||
 animationModule.audioCues.length!==0)
 throw Error('P057_CANONICAL_MODULE_RUNTIME_MISMATCH');

export default animationModule;
