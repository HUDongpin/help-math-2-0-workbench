import {P055_ID,P055_SOURCE} from '../nms-l02-ts-pilot-text';
import {P055_NATIVE_ASSET} from '../nms-l02-p055-native-assets';

/** Exact source timing and actual local candidate asset provenance. */
export const NMS_L02_P055_TIMELINE=Object.freeze({
 animationId:P055_ID,sourceSwfSha256:P055_SOURCE,
 assetSource:P055_NATIVE_ASSET.url,assetSha256:P055_NATIVE_ASSET.runtimeSha256,
 stage:Object.freeze({width:800,height:600}),fps:12,
 rootFrameCount:10,rootBeginFrame:6,
 mainFrameDomain:'sprite-26',mainFrameCount:351,
 playbackMode:'once' as const,
});
