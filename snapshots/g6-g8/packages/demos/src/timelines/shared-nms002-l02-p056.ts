import {P056_DISPLAY_SOURCE} from '../generated/nms-l02-p056-display-list-v1';
import {P056_PRODUCT_SCENARIO} from '../nms-l02-p056-product-text-v1';
import {P056_SOURCE_BEHAVIOR} from './shared-nms002-l02-p056-source-behavior';

/** Canonical DOM registration timeline. Source has no child terminal stop;
 * the maintained product's once-at-frame-234 hold is a modern host policy. */
export const P056_CANONICAL_TIMELINE=Object.freeze({
 animationId:'shared-nms002-l02-p056',
 sourceSwfSha256:'a1872d6c20987340889c1077d6720cbfe046faa3b5228164987e0834f3c639be',
 stage:Object.freeze({width:800,height:600}),
 fps:12,rootFrameCount:10,rootBeginFrame:6,
 frameDomain:'sprite-24',frameCount:234,scenario:'source-static-frame',
 sourceChildTerminalStopPresent:false,
 productPlaybackMode:'once',productPlaybackEndFrame:234,
 originalRuntimeParityEstablished:false,
} as const);

if(P056_SOURCE_BEHAVIOR.animationId!==P056_CANONICAL_TIMELINE.animationId||
 P056_SOURCE_BEHAVIOR.swfSha256!==P056_CANONICAL_TIMELINE.sourceSwfSha256||
 P056_SOURCE_BEHAVIOR.rootFrameCount!==P056_CANONICAL_TIMELINE.rootFrameCount||
 P056_SOURCE_BEHAVIOR.teachingFrameDomain!==P056_CANONICAL_TIMELINE.frameDomain||
 P056_SOURCE_BEHAVIOR.teachingFrameCount!==P056_CANONICAL_TIMELINE.frameCount||
 P056_DISPLAY_SOURCE.animationId!==P056_CANONICAL_TIMELINE.animationId||
 P056_DISPLAY_SOURCE.sourceSwfSha256!==P056_CANONICAL_TIMELINE.sourceSwfSha256||
 P056_DISPLAY_SOURCE.frameDomain!==P056_CANONICAL_TIMELINE.frameDomain||
 P056_DISPLAY_SOURCE.frameCount!==P056_CANONICAL_TIMELINE.frameCount||
 P056_DISPLAY_SOURCE.rootPlacement.frame!==P056_CANONICAL_TIMELINE.rootBeginFrame||
 P056_PRODUCT_SCENARIO!==P056_CANONICAL_TIMELINE.scenario)
 throw Error('P056_CANONICAL_TIMELINE_SOURCE_MISMATCH');
