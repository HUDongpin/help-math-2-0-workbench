import {isG678LocalPreviewRequestUrl,isG678LocalPreviewRequestHeaders,type G678PreviewEnvironment} from './g678-preview-policy';
import {CONTINUOUS_AUDIO_PHASE} from './continuous-source-audio-access';
import {P052_AUDIO_PLANS} from '../../../packages/demos/src/generated/nms-l02-p052-runtime-audio-v1';
export const P052_AUDIO_PREFIX='/flash-assets/g678-local/shared-nms002-l02-p052/source-audio/';
/** Temporary engineering admission is explicit, not Current-JS registration. */
export function isP052AudioRequest(request:{method:string;url:URL;headers:Pick<Headers,'get'>},domain:string,
 env:G678PreviewEnvironment=process.env):boolean{
 const {method,url,headers}=request;
 if(!Object.hasOwn(P052_AUDIO_PLANS,domain)||method!=='GET'
  ||env.HELP_MATH_G678_P052_AUDIO_CANDIDATE!=='1'
  ||env.HELP_MATH_G678_CALIBRATION_PHASE!==CONTINUOUS_AUDIO_PHASE
  ||!isG678LocalPreviewRequestUrl(url,env)||!isG678LocalPreviewRequestHeaders(headers,env)
  ||url.protocol!=='http:'||url.username||url.password||url.hash||url.pathname!==P052_AUDIO_PREFIX+domain
  ||headers.get('sec-fetch-site')!=='same-origin'||headers.get('sec-fetch-mode')!=='cors'
  ||headers.get('sec-fetch-dest')!=='empty'||headers.get('range')!==null)return false;
 const plan=P052_AUDIO_PLANS[domain as keyof typeof P052_AUDIO_PLANS],query=[...url.searchParams];
 if(query.length!==1||query[0][0]!=='sha256'||query[0][1]!==plan.inputSha256)return false;
 try{
  const hostText=headers.get('host')!,host=new URL('http://'+hostText),referer=new URL(headers.get('referer')??'');
  const forwarded=headers.get('x-forwarded-host'),origin=headers.get('origin');
  return host.host===hostText&&host.port===url.port&&(forwarded===null||forwarded===hostText)
   &&referer.origin===host.origin&&!referer.username&&!referer.password
   &&(origin===null||origin===host.origin)
   &&/^\/(?:(?:en|es)\/)?migration-status\/g678-calibration\/shared-nms002-l02-(?:p052|p055)$/.test(referer.pathname);
 }catch{return false;}
}
