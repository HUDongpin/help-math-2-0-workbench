'use client';
import {nmsL02P056ProductModule} from '../nms-l02-p056-product-module-v1';
import {P056_CANONICAL_TIMELINE} from '../timelines/shared-nms002-l02-p056';

/** Canonical registry entry for the existing maintained DOM/inline-SVG product.
 * The registry owns Current-JS admission; this wrapper alone grants none. */
const animationModule=nmsL02P056ProductModule;
const runtime=animationModule.runtime;
if(animationModule.key!==P056_CANONICAL_TIMELINE.animationId||
 animationModule.movie.stage.width!==P056_CANONICAL_TIMELINE.stage.width||
 animationModule.movie.stage.height!==P056_CANONICAL_TIMELINE.stage.height||
 animationModule.movie.fps!==P056_CANONICAL_TIMELINE.fps||
 animationModule.movie.frameCount!==P056_CANONICAL_TIMELINE.frameCount||
 !runtime||
 runtime.frameCount!==P056_CANONICAL_TIMELINE.rootFrameCount||
 runtime.defaultFrameDomain!==P056_CANONICAL_TIMELINE.frameDomain||
 runtime.frameDomains?.length!==1||
 runtime.frameDomains?.[0]?.id!==P056_CANONICAL_TIMELINE.frameDomain||
 runtime.frameDomains?.[0]?.frameCount!==P056_CANONICAL_TIMELINE.frameCount||
 runtime.frameDomains?.[0]?.rootFrame!==P056_CANONICAL_TIMELINE.rootBeginFrame||
 animationModule.playbackMode!==P056_CANONICAL_TIMELINE.productPlaybackMode||
 animationModule.playbackEndFrameByDomain?.[P056_CANONICAL_TIMELINE.frameDomain]!==
  P056_CANONICAL_TIMELINE.productPlaybackEndFrame)
 throw Error('P056_CANONICAL_MODULE_RUNTIME_MISMATCH');

export default animationModule;
