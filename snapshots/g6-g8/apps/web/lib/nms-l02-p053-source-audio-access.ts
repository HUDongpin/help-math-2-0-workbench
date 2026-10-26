import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';

export const P053_SOURCE_AUDIO_SHA256 =
  '225177c9c27670c636ce383e0ec58e439888b14afa33427a53c14ff1ca7a4e7d';
export const P053_SOURCE_AUDIO_BYTES = 256230;
export const P053_SOURCE_AUDIO_PATH =
  '/flash-assets/g678-local/shared-nms002-l02-p053/source-audio';
export const P053_SOURCE_AUDIO_URL =
  `${P053_SOURCE_AUDIO_PATH}?sha256=${P053_SOURCE_AUDIO_SHA256}`;
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';

type AudioRequest = {
  readonly method:string;
  readonly url:URL;
  readonly headers:Pick<Headers,'get'>;
};

/** Exact local candidate page and fetch context; no cross-page asset widening. */
export function isP053SourceAudioRequest(request:AudioRequest,
  env:G678PreviewEnvironment=process.env):boolean{
  const {method,url,headers}=request;
  if((method!=='GET'&&method!=='HEAD')||
    env.HELP_MATH_G678_SOURCE_ROOT!==SOURCE_ROOT||
    !isG678LocalPreviewRequestUrl(url,env)||
    !isG678LocalPreviewRequestHeaders(headers,env)||
    url.protocol!=='http:'||url.username||url.password||url.hash||
    url.pathname!==P053_SOURCE_AUDIO_PATH||
    url.search!==`?sha256=${P053_SOURCE_AUDIO_SHA256}`||
    headers.get('sec-fetch-site')!=='same-origin'||
    headers.get('range')!==null)return false;
  if(method==='GET'&&
    (headers.get('sec-fetch-mode')!=='cors'||headers.get('sec-fetch-dest')!=='empty'))return false;
  if(method==='HEAD'&&
    !((headers.get('sec-fetch-mode')==='cors'&&headers.get('sec-fetch-dest')==='empty')||
      (headers.get('sec-fetch-mode')==='no-cors'&&headers.get('sec-fetch-dest')==='empty')))return false;
  try{
    const host=headers.get('host');
    const forwarded=headers.get('x-forwarded-host');
    const hostUrl=new URL(`http://${host}`);
    const referer=new URL(headers.get('referer')??'');
    const origin=headers.get('origin');
    return hostUrl.host===host&&hostUrl.port===url.port&&
      (forwarded===null||forwarded===host)&&
      referer.origin===hostUrl.origin&&!referer.username&&!referer.password&&
      !referer.search&&!referer.hash&&
      /^\/(?:en|es)\/migration-status\/g678-calibration\/shared-nms002-l02-p053$/u.test(referer.pathname)&&
      (origin===null||origin===hostUrl.origin);
  }catch{return false;}
}
