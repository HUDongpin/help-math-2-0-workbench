import {P060_DISPLAY_META} from '../generated/nms-l02-p060-display-list-v1';
import {P060_GLOSSARY_SOURCE_DISPOSITION,P060_SOURCE_TERMS} from '../generated/nms-l02-p060-terms-v1';
import {P060_AUDIO_DOMAINS,P060_AUDIO_SOURCE} from '../nms-l02-p060-audio-v1';
import {P060_ID,P060_SOURCE_SHA,P060_STOPS,P060_GLOSSARY_KEYS} from '../nms-l02-p060-state-v1';
import {P060_PRODUCT_SCENARIO,P060_PRODUCT_SOURCE_AUDIO} from '../nms-l02-p060-product-module-v1';

/** Main sprite has 721 source frames but an authored stop at 718. Frames 719–721
 * remain inspectable source data, not a selected normal-play continuation. */
export const P060_CANONICAL_TIMELINE=Object.freeze({
 animationId:P060_ID,sourceSwfSha256:P060_SOURCE_SHA,stage:Object.freeze({width:800,height:600}),fps:12,
 rootFrameCount:10,rootBeginFrame:6,rootPlacementTwips:Object.freeze({x:8247,y:5658}),
 frameDomain:'sprite-391',frameCount:721,sourceStops:P060_STOPS,
 productPlaybackMode:'once',productPlaybackEndFrame:718,productVisualFrameRange:Object.freeze([1,718]),
 sourceIntrospectionFrameRange:Object.freeze([1,721]),scenario:P060_PRODUCT_SCENARIO,
 sourceAudio:Object.freeze({mainSha256:P060_PRODUCT_SOURCE_AUDIO.sha256,firstBlockFrame:9,
  lastBlockFrame:711,blockCount:703,decodedSamples:1289088,renderedByProductModule:false}),
 glossary:Object.freeze({sourceControlCount:16,uniqueSourceTermCount:8,
  selection:P060_GLOSSARY_SOURCE_DISPOSITION.sourceSelection,
  originalL2BanksResolved:false,historicalHostAssociationEstablished:false}),
 originalRuntimeParityEstablished:false,
} as const);

if(P060_DISPLAY_META.animationId!==P060_CANONICAL_TIMELINE.animationId||
 P060_DISPLAY_META.sourceSwfSha256!==P060_CANONICAL_TIMELINE.sourceSwfSha256||
 P060_DISPLAY_META.mainFrames!==P060_CANONICAL_TIMELINE.frameCount||
 P060_DISPLAY_META.rootFrames!==P060_CANONICAL_TIMELINE.rootFrameCount||
 P060_DISPLAY_META.rootEntryFrame!==P060_CANONICAL_TIMELINE.rootBeginFrame||
 P060_DISPLAY_META.rootPlacementTwips.x!==P060_CANONICAL_TIMELINE.rootPlacementTwips.x||
 P060_DISPLAY_META.rootPlacementTwips.y!==P060_CANONICAL_TIMELINE.rootPlacementTwips.y||
 P060_DISPLAY_META.fps!==P060_CANONICAL_TIMELINE.fps||
 JSON.stringify(P060_DISPLAY_META.authoredStops)!==JSON.stringify(P060_CANONICAL_TIMELINE.sourceStops)||
 P060_GLOSSARY_KEYS.length!==8||P060_SOURCE_TERMS.length!==8||
 P060_AUDIO_SOURCE.swfSha256!==P060_CANONICAL_TIMELINE.sourceSwfSha256||
 P060_AUDIO_DOMAINS['sprite-391'].sha256!==P060_CANONICAL_TIMELINE.sourceAudio.mainSha256||
 P060_AUDIO_DOMAINS['sprite-391'].firstBlockFrame!==P060_CANONICAL_TIMELINE.sourceAudio.firstBlockFrame||
 P060_AUDIO_DOMAINS['sprite-391'].lastBlockFrame!==P060_CANONICAL_TIMELINE.sourceAudio.lastBlockFrame||
 P060_AUDIO_DOMAINS['sprite-391'].decodedSamples!==P060_CANONICAL_TIMELINE.sourceAudio.decodedSamples)
 throw Error('P060_CANONICAL_TIMELINE_SOURCE_MISMATCH');
