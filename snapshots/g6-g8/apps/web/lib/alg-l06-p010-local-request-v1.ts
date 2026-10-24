import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';

const ID='shared-alg001-l06-p010';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ORIGIN='http://127.0.0.1:3331';
const DOCUMENTS=['candidate-v1','continuous-v1'].flatMap(version=>
  ['en','es'].map(locale=>`/${locale}/migration-status/g678-calibration/${ID}/${version}`));
export const P010_RESOURCE_PINS=Object.freeze({
  canvas:Object.freeze({path:`/flash-assets/g678-local/${ID}/canvas-v1`,bytes:1154661,
    sha256:'0a1aa913455ff358ceec7674e7f73fa6c27f59a054fc8d43f41e7bc91b8720c1',
    contentType:'text/javascript; charset=utf-8'}),
  main:Object.freeze({path:`/flash-assets/g678-local/${ID}/continuous-source-v1`,bytes:124280,
    sha256:'f5c71e9d066a0d2ce37be7afd20c3d1f8182b5c2c7b6a06a38c131074093fa89',
    contentType:'audio/mpeg'}),
  spanish:Object.freeze({path:`/flash-assets/g678-local/${ID}/optional-spanish-audio-v1`,bytes:301056,
    sha256:'903c1bd16cebf9f1ceda0d9b8a47905cae20f380bb857fa33fc855a6db350275',
    contentType:'audio/mpeg'}),
});
export type P010Resource=keyof typeof P010_RESOURCE_PINS;
export const p010ResourceUrl=(resource:P010Resource)=>{
  const pin=P010_RESOURCE_PINS[resource];return `${pin.path}?sha256=${pin.sha256}`;
};
type SourceRequest={method:string;url:URL;headers:Pick<Headers,'get'>};

/** An exact P010 candidate document on the local development origin may read
 * only these three hash-bound resources. No locale or SA choice starts audio. */
export function isP010ResourceRequest(request:SourceRequest,resource:P010Resource,
  env:G678PreviewEnvironment=process.env):boolean{
  const pin=P010_RESOURCE_PINS[resource],{url,headers,method}=request;
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
      !referer.hash&&(!referer.search||referer.search==='?mode=focus')&&
      DOCUMENTS.includes(referer.pathname)&&
      (origin===null||origin===ORIGIN);
  }catch{return false;}
}
