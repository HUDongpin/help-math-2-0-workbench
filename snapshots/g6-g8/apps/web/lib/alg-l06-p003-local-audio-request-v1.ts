import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';

/** Only the observed learner focus option and Next's bounded transport token.
 * Frame/seek/identity overrides are never admitted. Referrers omit RSC. */
export function isP003ContinuousHostSearch(params:URLSearchParams, allowRsc=false):boolean {
  const keys=[...params.keys()];
  if(new Set(keys).size!==keys.length)return false;
  return keys.every(key=>key==='mode'?params.get(key)==='focus':
    allowRsc&&key==='_rsc'&&/^[A-Za-z0-9_-]{1,128}$/u.test(params.get(key)??''));
}

const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';

type SourceRequest={
  readonly method:string;
  readonly url:URL;
  readonly headers:Pick<Headers,'get'>;
};

/** Both explicitly configured P003 audio resources share the exact local host boundary.
 * URL-host loopback normalization may differ from the actual Host header, but
 * both must use the same port and the Referer must share the Host origin. */
export function isP003ScopedAudioRequest(request:SourceRequest, resource: {path:string;sha256:string},
  env:G678PreviewEnvironment=process.env):boolean{
  const {method,url,headers}=request;
  if (!/^\/flash-assets\/g678-local\/shared-alg001-l06-p003\/(?:continuous-source-v2|optional-spanish-audio-v1)$/u.test(resource.path) ||
      !/^[a-f0-9]{64}$/u.test(resource.sha256)) return false;
  if((method!=='GET'&&method!=='HEAD')||
    env.NODE_ENV!=='development'||
    env.HELP_MATH_G678_SOURCE_ROOT!==SOURCE_ROOT||
    !isG678LocalPreviewRequestUrl(url,env)||
    !isG678LocalPreviewRequestHeaders(headers,env)||
    url.protocol!=='http:'||url.username||url.password||url.hash||
    url.pathname!==resource.path||
    url.search!==`?sha256=${resource.sha256}`||
    headers.get('sec-fetch-site')!=='same-origin'||
    headers.get('sec-fetch-mode')!=='cors'||
    headers.get('sec-fetch-dest')!=='empty'||
    headers.get('range')!==null)return false;
  try{
    const host=headers.get('host');
    const forwarded=headers.get('x-forwarded-host');
    const hostUrl=new URL(`http://${host}`);
    const referer=new URL(headers.get('referer')??'');
    const origin=headers.get('origin');
    return hostUrl.host===host&&hostUrl.port===url.port&&
      (forwarded===null||forwarded===host)&&
      referer.origin===hostUrl.origin&&!referer.username&&!referer.password&&
      isP003ContinuousHostSearch(referer.searchParams)&&!referer.hash&&
      /^\/(?:en|es)\/migration-status\/g678-calibration\/shared-alg001-l06-p003\/continuous-v2$/u.test(referer.pathname)&&
      (origin===null||origin===hostUrl.origin);
  }catch{return false;}
}
