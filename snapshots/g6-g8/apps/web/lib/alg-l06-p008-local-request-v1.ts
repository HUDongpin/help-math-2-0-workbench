import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';

const ID='shared-alg001-l06-p008';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ORIGIN='http://127.0.0.1:3331';
const DOCUMENTS=['candidate-v1','continuous-v1'].flatMap(version=>
  ['en','es'].map(locale=>`/${locale}/migration-status/g678-calibration/${ID}/${version}`));
export const P008_RESOURCE_PINS=Object.freeze({
  canvas:Object.freeze({path:`/flash-assets/g678-local/${ID}/canvas-v1`,bytes:19032480,
    sha256:'ef40a85081b1cd131e3751fbaec8242a847592247f1b1992f681dd499309c33e',
    contentType:'text/javascript; charset=utf-8'}),
  main:Object.freeze({path:`/flash-assets/g678-local/${ID}/continuous-source-v1`,bytes:377130,
    sha256:'ab14ce47d0f98c841213b222f27e7bc44587ba27849048ed1dd16bd41c2eabe2',
    contentType:'audio/mpeg'}),
  spanish:Object.freeze({path:`/flash-assets/g678-local/${ID}/optional-spanish-audio-v1`,bytes:135072,
    sha256:'ca48f20431673bb4e6f17c28cb605134f4098161bbcb93cc82c274cb472466f3',
    contentType:'audio/mpeg'}),
});
export type P008Resource=keyof typeof P008_RESOURCE_PINS;
export const p008ResourceUrl=(resource:P008Resource)=>{
  const pin=P008_RESOURCE_PINS[resource];return `${pin.path}?sha256=${pin.sha256}`;
};
type SourceRequest={method:string;url:URL;headers:Pick<Headers,'get'>};

/** An exact P008 candidate document on the local development origin may read
 * only these three hash-bound resources. No locale or SA choice starts audio. */
export function isP008ResourceRequest(request:SourceRequest,resource:P008Resource,
  env:G678PreviewEnvironment=process.env):boolean{
  const pin=P008_RESOURCE_PINS[resource],{url,headers,method}=request;
  if(env.NODE_ENV!=='development'||env.VERCEL||env.VERCEL_ENV||
    env.HELP_MATH_G678_SOURCE_ROOT!==SOURCE_ROOT||
    !isG678LocalPreviewRequestUrl(url,env)||!isG678LocalPreviewRequestHeaders(headers,env)||
    url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
    url.pathname!==pin.path||url.search!==`?sha256=${pin.sha256}`||
    (method!=='GET'&&(method!=='HEAD'||resource==='canvas'))||
    headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return false;
  const mode=headers.get('sec-fetch-mode'),dest=headers.get('sec-fetch-dest');
  if(resource==='canvas'?(dest!=='script'||(mode!=='cors'&&mode!=='no-cors')):
    (dest!=='empty'||mode!=='cors'))return false;
  if(headers.get('host')!=='127.0.0.1:3331'||
    (headers.get('x-forwarded-host')!==null&&headers.get('x-forwarded-host')!=='127.0.0.1:3331')||
    (headers.get('x-forwarded-proto')!==null&&headers.get('x-forwarded-proto')!=='http'))return false;
  try{
    const referer=new URL(headers.get('referer')??'');
    const origin=headers.get('origin');
    return referer.origin===ORIGIN&&!referer.username&&!referer.password&&
      !referer.hash&&!referer.search&&
      DOCUMENTS.includes(referer.pathname)&&
      (origin===null||origin===ORIGIN);
  }catch{return false;}
}
