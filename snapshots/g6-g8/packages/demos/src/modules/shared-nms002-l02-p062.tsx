'use client';
import {nmsL02P062ProductModule} from '../nms-l02-p062-product-module-v1';
import {P062_CANONICAL_TIMELINE} from '../timelines/shared-nms002-l02-p062';

/** Canonical source-stopped DOM entry; this wrapper alone grants no registration. */
const animationModule=nmsL02P062ProductModule;
const runtime=animationModule.runtime;
if(animationModule.key!==P062_CANONICAL_TIMELINE.animationId||
 animationModule.movie.stage.width!==P062_CANONICAL_TIMELINE.stage.width||
 animationModule.movie.stage.height!==P062_CANONICAL_TIMELINE.stage.height||
 animationModule.movie.fps!==P062_CANONICAL_TIMELINE.fps||
 animationModule.movie.frameCount!==P062_CANONICAL_TIMELINE.frameCount||
 !runtime||runtime.frameCount!==P062_CANONICAL_TIMELINE.rootFrameCount||
 runtime.defaultFrameDomain!==P062_CANONICAL_TIMELINE.frameDomain||
 runtime.frameDomains?.length!==1||
 runtime.frameDomains[0]?.id!==P062_CANONICAL_TIMELINE.frameDomain||
 runtime.frameDomains[0]?.frameCount!==P062_CANONICAL_TIMELINE.frameCount||
 runtime.frameDomains[0]?.rootFrame!==P062_CANONICAL_TIMELINE.rootBeginFrame||
 animationModule.playbackMode!==P062_CANONICAL_TIMELINE.productPlaybackMode||
 animationModule.playbackEndFrameByDomain?.[P062_CANONICAL_TIMELINE.frameDomain]!==P062_CANONICAL_TIMELINE.productPlaybackEndFrame||
 animationModule.audioCues.length!==0)
 throw Error('P062_CANONICAL_MODULE_RUNTIME_MISMATCH');

export default animationModule;
