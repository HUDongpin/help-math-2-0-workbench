import {isG678LocalPreviewRequestUrl,isG678LocalPreviewRequestHeaders,type G678PreviewEnvironment} from './g678-preview-policy';
import {CONTINUOUS_AUDIO_PHASE} from './continuous-source-audio-access';
export const P047_AUDIO_PREFIX='/flash-assets/g678-local/shared-nms002-l01-p047/quiz-audio/';
export function isP047AudioRequest(request:{method:string;url:URL;headers:Pick<Headers,'get'>},env:G678PreviewEnvironment=process.env){
 const {method,url,headers}=request;
 if(method!=='GET'||env.HELP_MATH_G678_CALIBRATION_PHASE!==CONTINUOUS_AUDIO_PHASE||!isG678LocalPreviewRequestUrl(url,env)
   ||!isG678LocalPreviewRequestHeaders(headers,env)||url.protocol!=='http:'||!new RegExp('^'+P047_AUDIO_PREFIX+'p047-q(?:[1-9]|1[0-9]|2[0-7])-(?:question|[ABCD])-(?:en|es)$').test(url.pathname)
   ||headers.get('sec-fetch-site')!=='same-origin'||headers.get('sec-fetch-mode')!=='cors'||headers.get('sec-fetch-dest')!=='empty'||headers.get('range')!==null)return false;
 const query=[...url.searchParams.entries()];if(query.length!==1||query[0][0]!=='sha256'||!/^[a-f0-9]{64}$/.test(query[0][1]))return false;
 try{const host=new URL('http://'+headers.get('host')),referer=new URL(headers.get('referer')??''),origin=headers.get('origin');
  // NextURL normalizes a loopback IP to localhost; retain actual Host and exact port.
  return host.port===url.port&&referer.origin===host.origin&&/^\/(en|es)\/migration-status\/g678-calibration\/shared-nms002-l01-p\d{3}$/.test(referer.pathname)
    &&(origin===null||origin===host.origin);
 }catch{return false;}
}
