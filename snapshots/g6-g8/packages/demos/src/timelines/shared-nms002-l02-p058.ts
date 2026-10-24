import {P058_AUDIO_BLOCK_SOURCE,P058_AUDIO_BLOCKS} from '../generated/nms-l02-p058-audio-blocks-v1';
import {P058_DISPLAY_SOURCE} from '../generated/nms-l02-p058-display-list-v1';
import {P058_SOURCE_BUTTON_OCCURRENCES,P058_SOURCE_TERMS} from '../generated/nms-l02-p058-terms-v1';
import {P058_CONTROLS,P058_ID,P058_SOURCE_SHA} from '../nms-l02-p058-semantic-v1';
import {P058_PRODUCT_SCENARIO} from '../nms-l02-p058-product-text-v1';
import {P058_PRODUCT_SOURCE_AUDIO} from '../nms-l02-p058-product-module-v1';

/** Canonical maintained DOM timeline. Sprite 37 has no authored terminal stop;
 * holding frame 274 after one pass is a declared product playback policy. */
export const P058_CANONICAL_TIMELINE=Object.freeze({
 animationId:'shared-nms002-l02-p058',
 sourceSwfSha256:'fc26d0a7049db6b8ce5532cfbed1fcb380c75e503d9c7cb7974bea73b8505d57',
 stage:Object.freeze({width:800,height:600}),fps:12,rootFrameCount:10,rootBeginFrame:6,
 frameDomain:'sprite-37',frameCount:274,scenario:'source-static-frame',
 sourceChildTerminalStopPresent:false,productPlaybackMode:'once',productPlaybackEndFrame:274,
 sourceAudio:Object.freeze({sha256:'05f43faf63e470935728be5b54933ebb71760aeb819074b570091a6e4b068f38',
  firstBlockFrame:10,lastBlockFrame:274,blockCount:265,decodedSamples:486144,
  headerLatencySeekSamples:1673,audioRenderedByProductModule:false}),
 glossary:Object.freeze({controlCount:7,uniqueTermCount:6,
  sourceSelection:'identified-indexMI-export-literal-L1-bank-path',
  originalL2BanksResolved:false,historicalHostAssociationEstablished:false}),
 originalRuntimeParityEstablished:false,
} as const);

if(P058_ID!==P058_CANONICAL_TIMELINE.animationId||
 P058_SOURCE_SHA!==P058_CANONICAL_TIMELINE.sourceSwfSha256||
 P058_DISPLAY_SOURCE.animationId!==P058_CANONICAL_TIMELINE.animationId||
 P058_DISPLAY_SOURCE.sourceSwfSha256!==P058_CANONICAL_TIMELINE.sourceSwfSha256||
 P058_DISPLAY_SOURCE.frameDomain!==P058_CANONICAL_TIMELINE.frameDomain||
 P058_DISPLAY_SOURCE.frameCount!==P058_CANONICAL_TIMELINE.frameCount||
 P058_DISPLAY_SOURCE.fps!==P058_CANONICAL_TIMELINE.fps||
 P058_DISPLAY_SOURCE.rootFrameCount!==P058_CANONICAL_TIMELINE.rootFrameCount||
 P058_DISPLAY_SOURCE.rootPlacement.frame!==P058_CANONICAL_TIMELINE.rootBeginFrame||
 P058_DISPLAY_SOURCE.rootPlacement.characterId!==37||
 P058_DISPLAY_SOURCE.rootPlacement.transX!==7477||P058_DISPLAY_SOURCE.rootPlacement.transY!==5666||
 P058_PRODUCT_SCENARIO!==P058_CANONICAL_TIMELINE.scenario||
 P058_CONTROLS.controls.length!==P058_CANONICAL_TIMELINE.glossary.controlCount||
 P058_SOURCE_BUTTON_OCCURRENCES.length!==P058_CANONICAL_TIMELINE.glossary.controlCount||
 P058_SOURCE_TERMS.length!==P058_CANONICAL_TIMELINE.glossary.uniqueTermCount||
 P058_PRODUCT_SOURCE_AUDIO.sha256!==P058_CANONICAL_TIMELINE.sourceAudio.sha256||
 P058_PRODUCT_SOURCE_AUDIO.firstBlockFrame!==P058_CANONICAL_TIMELINE.sourceAudio.firstBlockFrame||
 P058_PRODUCT_SOURCE_AUDIO.lastBlockFrame!==P058_CANONICAL_TIMELINE.sourceAudio.lastBlockFrame||
 P058_PRODUCT_SOURCE_AUDIO.decodedSamples!==P058_CANONICAL_TIMELINE.sourceAudio.decodedSamples||
 P058_AUDIO_BLOCK_SOURCE.sourceSwfSha256!==P058_CANONICAL_TIMELINE.sourceSwfSha256||
 P058_AUDIO_BLOCK_SOURCE.sourcePayloadSha256!==P058_CANONICAL_TIMELINE.sourceAudio.sha256||
 P058_AUDIO_BLOCK_SOURCE.blockCount!==P058_CANONICAL_TIMELINE.sourceAudio.blockCount||
 P058_AUDIO_BLOCK_SOURCE.mp3LatencySeekSamples!==P058_CANONICAL_TIMELINE.sourceAudio.headerLatencySeekSamples||
 P058_AUDIO_BLOCKS.length!==P058_CANONICAL_TIMELINE.sourceAudio.blockCount)
 throw Error('P058_CANONICAL_TIMELINE_SOURCE_MISMATCH');
