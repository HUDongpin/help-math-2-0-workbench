import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
 type G678PreviewEnvironment} from './g678-preview-policy';

const ID='shared-alg001-l06-p004';
const PAGE=`/migration-status/g678-calibration/${ID}/candidate-v1`;
export const P004_RESOURCE_PINS=Object.freeze({
 canvas:Object.freeze({path:`/flash-assets/g678-local/${ID}/canvas-v1`,bytes:7342336,
  sha256:'6b6f124262c8b90517151ea77eee43a30843c170211d4cd76404e584c876c2d8',contentType:'text/javascript; charset=utf-8'}),
 main:Object.freeze({path:`/flash-assets/g678-local/${ID}/continuous-source-v1`,bytes:329030,
  sha256:'e8f5307618bd63789f468c7a056cf80ae7828f17b665a24893fafc3ad8bb7f7e',contentType:'audio/mpeg'}),
 spanish:Object.freeze({path:`/flash-assets/g678-local/${ID}/optional-spanish-audio-v1`,bytes:667968,
  sha256:'08bb62e9c1d92235c2e3fb96c44d44fc16b92ca7d175274e4c809f06bcfda8a5',contentType:'audio/mpeg'}),
});
export type P004Resource=keyof typeof P004_RESOURCE_PINS;
export const p004ResourceUrl=(resource:P004Resource)=>{
 const pin=P004_RESOURCE_PINS[resource];return `${pin.path}?sha256=${pin.sha256}`;
};
type SourceRequest={method:string;url:URL;headers:Pick<Headers,'get'>};

/** Asset identity is bound to one local candidate page and one real source root.
 * Next may normalize request.url hostname; Host, port and Referer still agree. */
export function isP004ResourceRequest(request:SourceRequest,resource:P004Resource,
 env:G678PreviewEnvironment=process.env):boolean{
 const pin=P004_RESOURCE_PINS[resource],{url,headers,method}=request;
 if(env.NODE_ENV!=='development'||env.VERCEL||env.VERCEL_ENV||
  env.HELP_MATH_G678_SOURCE_ROOT!=='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'||
  !isG678LocalPreviewRequestUrl(url,env)||!isG678LocalPreviewRequestHeaders(headers,env)||
  url.protocol!=='http:'||url.username||url.password||url.hash||
  url.pathname!==pin.path||url.search!==`?sha256=${pin.sha256}`||
  (method!=='GET'&&(method!=='HEAD'||resource==='canvas'))||
  headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return false;
 const mode=headers.get('sec-fetch-mode'),dest=headers.get('sec-fetch-dest');
 if(resource==='canvas'?(dest!=='script'||(mode!=='cors'&&mode!=='no-cors')):
  (dest!=='empty'||mode!=='cors'))return false;
 try{
  const host=headers.get('host');if(!host||host.includes(',')||host.includes('@'))return false;
  const hostUrl=new URL(`http://${host}`);
  if(hostUrl.hostname!=='127.0.0.1'||hostUrl.port!==url.port||hostUrl.host!==host||
   (headers.get('x-forwarded-host')!==null&&headers.get('x-forwarded-host')!==host)||
   (headers.get('x-forwarded-proto')!==null&&headers.get('x-forwarded-proto')!=='http'))return false;
  const referer=new URL(headers.get('referer')??'');
  const origin=headers.get('origin');
  return referer.origin===hostUrl.origin&&!referer.username&&!referer.password&&
   !referer.hash&&!referer.search&&
   (referer.pathname===`/en${PAGE}`||referer.pathname===`/es${PAGE}`)&&
   (origin===null||origin===hostUrl.origin);
 }catch{return false;}
}
