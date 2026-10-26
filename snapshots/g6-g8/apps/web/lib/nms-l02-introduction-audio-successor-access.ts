import {isNmsL2AudioRequest} from './nms-l02-p002-audio-access';
import type {G678PreviewEnvironment} from './g678-preview-policy';
/** A separately named endpoint preserves P001's existing frozen access path. */
export function isNmsL2IntroductionAudioRequest(request:{method:string;url:URL;headers:Pick<Headers,'get'>},env:G678PreviewEnvironment=process.env) {
  return isNmsL2AudioRequest(request,'introduction',env);
}
