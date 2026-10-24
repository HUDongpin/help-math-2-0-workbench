import{CONTINUOUS_AUDIO_PHASE}from'./continuous-source-audio-access';
import{isG678LocalPreviewRequestUrl,isG678LoopbackHostname,type G678PreviewEnvironment}from'./g678-preview-policy';
export const NMS_L11_SOURCE_AUDIO_ID='shared-nms002-l11-p030';
export const NMS_L11_SOURCE_AUDIO_DOMAINS=Object.freeze(['sprite-90','sprite-101','sprite-112','sprite-124','sprite-150','sprite-182','sprite-215','sprite-223','sprite-251','sprite-260']);
export function isNmsL11SourceAudioRequest(request:{method:string;url:URL;headers:Pick<Headers,'get'>},env:G678PreviewEnvironment=process.env){
 const{url,headers}=request;
 if(request.method!=='GET'||env.HELP_MATH_G678_CALIBRATION_PHASE!==CONTINUOUS_AUDIO_PHASE||!isG678LocalPreviewRequestUrl(url,env)||url.protocol!=='http:'||
  !NMS_L11_SOURCE_AUDIO_DOMAINS.some(d=>url.pathname===`/flash-assets/g678-local/${NMS_L11_SOURCE_AUDIO_ID}/interactive-audio/${d}`)||headers.get('sec-fetch-site')!=='same-origin'||headers.get('sec-fetch-mode')!=='cors'||headers.get('sec-fetch-dest')!=='empty'||headers.get('range')!==null)return false;
 try{const actual=new URL(url.href),host=headers.get('host');if(host)actual.host=host;const referer=new URL(headers.get('referer')??''),origin=headers.get('origin');
  return isG678LoopbackHostname(actual.hostname)&&actual.port===url.port&&referer.origin===actual.origin&&/^\/(en|es)\/migration-status\/g678-calibration\/shared-nms002-l11-p\d{3}$/u.test(referer.pathname)&&(origin===null||origin===actual.origin);
 }catch{return false;}
}
