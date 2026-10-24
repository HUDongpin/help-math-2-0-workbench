import {FROZEN_CONTINUOUS_SOURCE_MEMBERS} from '../../../packages/demos/src/frozen-continuous-source-scope';
import {isG678LocalPreviewRequestUrl,isG678LoopbackHostname,type G678PreviewEnvironment} from './g678-preview-policy';
export const CONTINUOUS_AUDIO_ID='shared-alg001-l06-p040';
export const CONTINUOUS_AUDIO_PHASE='frozen16-continuous-audio-provisional-browser-qa';
export const CONTINUOUS_AUDIO_PATH=`/flash-assets/g678-local/${CONTINUOUS_AUDIO_ID}/source-stream.mp3`;
const memberForPath=(pathname:string)=>FROZEN_CONTINUOUS_SOURCE_MEMBERS.find(m=>pathname===`/flash-assets/g678-local/${m.animationId}/source-stream.mp3`);
export const isContinuousSourceAudioPath=(pathname:string)=>Boolean(memberForPath(pathname));
export function isContinuousSourceAudioRequest(request:{url:URL;headers:Pick<Headers,'get'>},env:G678PreviewEnvironment=process.env){
  const {url,headers}=request;const member=memberForPath(url.pathname);
  if(env.HELP_MATH_G678_CALIBRATION_PHASE!==CONTINUOUS_AUDIO_PHASE||!isG678LocalPreviewRequestUrl(url,env)||url.protocol!=='http:'||!member||
    headers.get('sec-fetch-site')!=='same-origin'||headers.get('sec-fetch-mode')!=='cors'||headers.get('sec-fetch-dest')!=='empty'||headers.get('range')!==null)return false;
  try{const referer=new URL(headers.get('referer')??'');const origin=headers.get('origin');
    // NextURL normalizes loopback IPs to localhost in the proxy. Validate the
    // actual Host and retain the same port instead of weakening origin checks.
    const actual=new URL(url.href);const host=headers.get('host');if(host)actual.host=host;
    if(!isG678LoopbackHostname(actual.hostname)||actual.port!==url.port)return false;
    return referer.origin===actual.origin&&new RegExp('^/(en|es)/migration-status/g678-calibration/'+member.animationId.replace(/-p\d{3}$/u,'')+'-p\\d{3}$','u').test(referer.pathname)&&
      (origin===null||origin===actual.origin);
  }catch{return false;}
}
