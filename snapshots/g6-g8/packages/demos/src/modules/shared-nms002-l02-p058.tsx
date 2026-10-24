'use client';
import {nmsL02P058ProductModule} from '../nms-l02-p058-product-module-v1';
import {P058_CANONICAL_TIMELINE} from '../timelines/shared-nms002-l02-p058';

/** Canonical maintained DOM entry; this wrapper alone grants no registration. */
const animationModule=nmsL02P058ProductModule;
const runtime=animationModule.runtime;
if(animationModule.key!==P058_CANONICAL_TIMELINE.animationId||
 animationModule.movie.stage.width!==P058_CANONICAL_TIMELINE.stage.width||
 animationModule.movie.stage.height!==P058_CANONICAL_TIMELINE.stage.height||
 animationModule.movie.fps!==P058_CANONICAL_TIMELINE.fps||
 animationModule.movie.frameCount!==P058_CANONICAL_TIMELINE.frameCount||
 !runtime||runtime.frameCount!==P058_CANONICAL_TIMELINE.rootFrameCount||
 runtime.defaultFrameDomain!==P058_CANONICAL_TIMELINE.frameDomain||
 runtime.frameDomains?.length!==1||
 runtime.frameDomains?.[0]?.id!==P058_CANONICAL_TIMELINE.frameDomain||
 runtime.frameDomains?.[0]?.frameCount!==P058_CANONICAL_TIMELINE.frameCount||
 runtime.frameDomains?.[0]?.rootFrame!==P058_CANONICAL_TIMELINE.rootBeginFrame||
 animationModule.playbackMode!==P058_CANONICAL_TIMELINE.productPlaybackMode||
 animationModule.playbackEndFrameByDomain?.[P058_CANONICAL_TIMELINE.frameDomain]!==
  P058_CANONICAL_TIMELINE.productPlaybackEndFrame||
 animationModule.audioCues.length!==0)
 throw Error('P058_CANONICAL_MODULE_RUNTIME_MISMATCH');

export default animationModule;
