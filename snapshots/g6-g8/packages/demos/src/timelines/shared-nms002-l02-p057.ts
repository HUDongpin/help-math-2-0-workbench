import {P057_DISPLAY_SOURCE} from '../generated/nms-l02-p057-display-list-v1';
import {P057_CONTROLS,P057_ID,P057_SOURCE_SHA} from '../nms-l02-p057-semantic-v1';
import {P057_PRODUCT_SCENARIO} from '../nms-l02-p057-product-text-v1';
import {P057_PRODUCT_SOURCE_AUDIO} from '../nms-l02-p057-product-module-v1';

/** Canonical DOM registration timeline. The source child has no terminal stop;
 * the maintained product holds frame 328 after one playback by host policy. */
export const P057_CANONICAL_TIMELINE=Object.freeze({
 animationId:'shared-nms002-l02-p057',
 sourceSwfSha256:'9cc456a0af745dc31240b3a6d805e8e115c1c1c2725f851fca8e907a767820aa',
 stage:Object.freeze({width:800,height:600}),fps:12,rootFrameCount:10,rootBeginFrame:6,
 frameDomain:'sprite-66',frameCount:328,scenario:'source-static-frame',
 sourceChildTerminalStopPresent:false,productPlaybackMode:'once',productPlaybackEndFrame:328,
 sourceAudio:Object.freeze({sha256:'c87ebf7d1117a616ebddd6b3530a7b19c50dfd885bc5e2734817657da026c2dc',
  firstBlockFrame:5,lastBlockFrame:328,blockCount:324,decodedSamples:595008,
  audioRenderedByProductModule:false}),
 glossary:Object.freeze({controlCount:7,sourceSelection:'identified-indexMI-export-literal-L1-bank-path',
  originalL2BanksResolved:false,historicalHostAssociationEstablished:false}),
 originalRuntimeParityEstablished:false,
} as const);

if(P057_ID!==P057_CANONICAL_TIMELINE.animationId||
 P057_SOURCE_SHA!==P057_CANONICAL_TIMELINE.sourceSwfSha256||
 P057_DISPLAY_SOURCE.animationId!==P057_CANONICAL_TIMELINE.animationId||
 P057_DISPLAY_SOURCE.sourceSwfSha256!==P057_CANONICAL_TIMELINE.sourceSwfSha256||
 P057_DISPLAY_SOURCE.frameDomain!==P057_CANONICAL_TIMELINE.frameDomain||
 P057_DISPLAY_SOURCE.frameCount!==P057_CANONICAL_TIMELINE.frameCount||
 P057_DISPLAY_SOURCE.fps!==P057_CANONICAL_TIMELINE.fps||
 P057_DISPLAY_SOURCE.rootFrameCount!==P057_CANONICAL_TIMELINE.rootFrameCount||
 P057_DISPLAY_SOURCE.rootPlacement.frame!==P057_CANONICAL_TIMELINE.rootBeginFrame||
 P057_DISPLAY_SOURCE.rootPlacement.transX!==7430||P057_DISPLAY_SOURCE.rootPlacement.transY!==5667||
 P057_PRODUCT_SCENARIO!==P057_CANONICAL_TIMELINE.scenario||
 P057_CONTROLS.controls.length!==P057_CANONICAL_TIMELINE.glossary.controlCount||
 P057_PRODUCT_SOURCE_AUDIO.sha256!==P057_CANONICAL_TIMELINE.sourceAudio.sha256||
 P057_PRODUCT_SOURCE_AUDIO.firstBlockFrame!==P057_CANONICAL_TIMELINE.sourceAudio.firstBlockFrame||
 P057_PRODUCT_SOURCE_AUDIO.lastBlockFrame!==P057_CANONICAL_TIMELINE.sourceAudio.lastBlockFrame||
 P057_PRODUCT_SOURCE_AUDIO.decodedSamples!==P057_CANONICAL_TIMELINE.sourceAudio.decodedSamples)
 throw Error('P057_CANONICAL_TIMELINE_SOURCE_MISMATCH');
