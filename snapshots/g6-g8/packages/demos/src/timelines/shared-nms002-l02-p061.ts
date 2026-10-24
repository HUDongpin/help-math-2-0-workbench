import {P061_DISPLAY_META} from '../generated/nms-l02-p061-display-list-v1';
import {P061_GLOSSARY_SOURCE_DISPOSITION,P061_SOURCE_TERMS} from '../generated/nms-l02-p061-terms-v1';
import {P061_AUDIO_DOMAINS,P061_AUDIO_SOURCE} from '../nms-l02-p061-audio-v1';
import {P061_ID,P061_SOURCE_SHA,P061_STOPS,P061_GLOSSARY_KEYS} from '../nms-l02-p061-state-v1';
import {P061_PRODUCT_SCENARIO,P061_PRODUCT_SOURCE_AUDIO} from '../nms-l02-p061-product-module-v1';

/** Main sprite has 882 source frames but an authored stop at 879. Frames 880–882
 * remain inspectable source data, not a selected normal-play continuation. */
export const P061_CANONICAL_TIMELINE=Object.freeze({
 animationId:P061_ID,sourceSwfSha256:P061_SOURCE_SHA,stage:Object.freeze({width:800,height:600}),fps:12,
 rootFrameCount:10,rootBeginFrame:6,rootPlacementTwips:Object.freeze({x:8247,y:5658}),
 frameDomain:'sprite-315',frameCount:882,sourceStops:P061_STOPS,
 productPlaybackMode:'once',productPlaybackEndFrame:879,productVisualFrameRange:Object.freeze([1,879]),
 sourceIntrospectionFrameRange:Object.freeze([1,882]),scenario:P061_PRODUCT_SCENARIO,
 sourceAudio:Object.freeze({mainSha256:P061_PRODUCT_SOURCE_AUDIO.sha256,firstBlockFrame:9,
  lastBlockFrame:875,blockCount:867,decodedSamples:1590336,renderedByProductModule:false}),
 glossary:Object.freeze({sourceControlCount:7,uniqueSourceTermCount:6,
  selection:P061_GLOSSARY_SOURCE_DISPOSITION.sourceSelection,
  originalL2BanksResolved:false,historicalHostAssociationEstablished:false}),
 originalRuntimeParityEstablished:false,
} as const);

if(P061_DISPLAY_META.animationId!==P061_CANONICAL_TIMELINE.animationId||
 P061_DISPLAY_META.sourceSwfSha256!==P061_CANONICAL_TIMELINE.sourceSwfSha256||
 P061_DISPLAY_META.mainFrames!==P061_CANONICAL_TIMELINE.frameCount||
 P061_DISPLAY_META.rootFrames!==P061_CANONICAL_TIMELINE.rootFrameCount||
 P061_DISPLAY_META.rootEntryFrame!==P061_CANONICAL_TIMELINE.rootBeginFrame||
 P061_DISPLAY_META.rootPlacementTwips.x!==P061_CANONICAL_TIMELINE.rootPlacementTwips.x||
 P061_DISPLAY_META.rootPlacementTwips.y!==P061_CANONICAL_TIMELINE.rootPlacementTwips.y||
 P061_DISPLAY_META.fps!==P061_CANONICAL_TIMELINE.fps||
 JSON.stringify(P061_DISPLAY_META.authoredStops)!==JSON.stringify(P061_CANONICAL_TIMELINE.sourceStops)||
 P061_GLOSSARY_KEYS.length!==6||P061_SOURCE_TERMS.length!==6||
 P061_AUDIO_SOURCE.swfSha256!==P061_CANONICAL_TIMELINE.sourceSwfSha256||
 P061_AUDIO_DOMAINS['sprite-315'].sha256!==P061_CANONICAL_TIMELINE.sourceAudio.mainSha256||
 P061_AUDIO_DOMAINS['sprite-315'].firstBlockFrame!==P061_CANONICAL_TIMELINE.sourceAudio.firstBlockFrame||
 P061_AUDIO_DOMAINS['sprite-315'].lastBlockFrame!==P061_CANONICAL_TIMELINE.sourceAudio.lastBlockFrame||
 P061_AUDIO_DOMAINS['sprite-315'].decodedSamples!==P061_CANONICAL_TIMELINE.sourceAudio.decodedSamples)
 throw Error('P061_CANONICAL_TIMELINE_SOURCE_MISMATCH');
