import {P062_DISPLAY_META} from '../generated/nms-l02-p062-display-list-v1';
import {P062_AUDIO_DOMAINS,P062_AUDIO_SOURCE} from '../nms-l02-p062-audio-v1';
import {P062_ID,P062_SOURCE_SHA,P062_STOPS,P062_SOURCE_GLOSSARY_CONTROLS_PRESENT} from '../nms-l02-p062-state-v1';
import {P062_PRODUCT_SCENARIO,P062_PRODUCT_SOURCE_AUDIO} from '../nms-l02-p062-product-module-v1';

/** P062's 837 source frames include three after its authored terminal stop 834. */
export const P062_CANONICAL_TIMELINE=Object.freeze({
 animationId:P062_ID,sourceSwfSha256:P062_SOURCE_SHA,stage:Object.freeze({width:800,height:600}),fps:12,
 rootFrameCount:10,rootBeginFrame:6,rootPlacementTwips:Object.freeze({x:8247,y:5658}),
 frameDomain:'sprite-315',frameCount:837,sourceStops:P062_STOPS,
 productPlaybackMode:'once',productPlaybackEndFrame:834,productVisualFrameRange:Object.freeze([1,834]),
 sourceIntrospectionFrameRange:Object.freeze([1,837]),scenario:P062_PRODUCT_SCENARIO,
 sourceAudio:Object.freeze({mainSha256:P062_PRODUCT_SOURCE_AUDIO.sha256,firstBlockFrame:9,
  lastBlockFrame:828,decodedSamples:1503936,renderedByProductModule:false}),
 glossary:Object.freeze({sourceControlCount:0,uniqueSourceTermCount:0,
  sourceKeyAttributeControlsPresent:false,historicalHostAssociationEstablished:false}),
 editorialCorrections:Object.freeze(['tax-base','example-rate']),
 originalRuntimeParityEstablished:false,
} as const);

if(P062_DISPLAY_META.animationId!==P062_CANONICAL_TIMELINE.animationId||
 P062_DISPLAY_META.sourceSwfSha256!==P062_CANONICAL_TIMELINE.sourceSwfSha256||
 P062_DISPLAY_META.mainFrames!==P062_CANONICAL_TIMELINE.frameCount||
 P062_DISPLAY_META.rootFrames!==P062_CANONICAL_TIMELINE.rootFrameCount||
 P062_DISPLAY_META.rootEntryFrame!==P062_CANONICAL_TIMELINE.rootBeginFrame||
 P062_DISPLAY_META.rootPlacementTwips.x!==P062_CANONICAL_TIMELINE.rootPlacementTwips.x||
 P062_DISPLAY_META.rootPlacementTwips.y!==P062_CANONICAL_TIMELINE.rootPlacementTwips.y||
 P062_DISPLAY_META.fps!==P062_CANONICAL_TIMELINE.fps||
 JSON.stringify(P062_DISPLAY_META.authoredStops)!==JSON.stringify(P062_CANONICAL_TIMELINE.sourceStops)||
 P062_DISPLAY_META.editorialDeviations.map(row=>row.issue).join(',')!==
  P062_CANONICAL_TIMELINE.editorialCorrections.join(',')||
 P062_SOURCE_GLOSSARY_CONTROLS_PRESENT!==false||
 P062_AUDIO_SOURCE.swfSha256!==P062_CANONICAL_TIMELINE.sourceSwfSha256||
 P062_AUDIO_DOMAINS['sprite-315'].sha256!==P062_CANONICAL_TIMELINE.sourceAudio.mainSha256||
 P062_AUDIO_DOMAINS['sprite-315'].firstBlockFrame!==P062_CANONICAL_TIMELINE.sourceAudio.firstBlockFrame||
 P062_AUDIO_DOMAINS['sprite-315'].lastBlockFrame!==P062_CANONICAL_TIMELINE.sourceAudio.lastBlockFrame||
 P062_AUDIO_DOMAINS['sprite-315'].decodedSamples!==P062_CANONICAL_TIMELINE.sourceAudio.decodedSamples)
 throw Error('P062_CANONICAL_TIMELINE_SOURCE_MISMATCH');
