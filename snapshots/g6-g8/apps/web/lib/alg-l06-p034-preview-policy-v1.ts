/** Exact P034-only local candidate/formal document boundary. */
import type {G678PreviewEnvironment} from './g678-preview-policy';

export const P034_ID='shared-alg001-l06-p034';
export const P034_LOCAL_ORIGIN='http://127.0.0.1:3331';
export const P034_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const P034_ASSET_ROOT=`/flash-assets/g678-local/${P034_ID}`;
const DOCUMENTS=new Set(['en','es'].flatMap(locale=>['candidate-v1','continuous-v1'].map(route=>
 `/${locale}/migration-status/g678-calibration/${P034_ID}/${route}`)));

export function p034LocalDevelopment(env:G678PreviewEnvironment=process.env):boolean{
 return env.NODE_ENV==='development'&&!env.VERCEL&&!env.VERCEL_ENV&&
  env.HELP_MATH_G678_SOURCE_ROOT===P034_SOURCE_ROOT&&
  ['1','true'].includes(env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
  env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1';
}
export function p034DocumentKindFromReferer(value:string|null):'candidate'|'formal'|null{
 if(!value)return null;
 try{
  const referer=new URL(value);
  if(referer.origin!==P034_LOCAL_ORIGIN||referer.username||referer.password||
   referer.hash||!['','?mode=focus'].includes(referer.search)||
   !DOCUMENTS.has(referer.pathname))return null;
  return referer.pathname.endsWith('/continuous-v1')?'formal':'candidate';
 }catch{return null;}
}
/** Existing local-resource caller can still check the exact referer boundary. */
export const p034CandidateReferer=(value:string|null):boolean=>
 p034DocumentKindFromReferer(value)==='candidate';
export function p034DocumentHeaders(headers:Pick<Headers,'get'>,
 env:G678PreviewEnvironment=process.env):boolean{
 return p034LocalDevelopment(env)&&headers.get('host')==='127.0.0.1:3331'&&
  [null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))&&
  [null,'http'].includes(headers.get('x-forwarded-proto'))&&
  [null,P034_LOCAL_ORIGIN].includes(headers.get('origin'));
}
export function p034DocumentRequest(url:URL,headers:Pick<Headers,'get'>,
 method:string,env:G678PreviewEnvironment=process.env):boolean{
 return p034DocumentHeaders(headers,env)&&url.origin===P034_LOCAL_ORIGIN&&
  !url.username&&!url.password&&!url.hash&&['GET','HEAD'].includes(method)&&
  DOCUMENTS.has(url.pathname)&&[...url.searchParams].every(([key,value])=>
   (key==='mode'&&value==='focus')||(key==='_rsc'&&/^[A-Za-z0-9_-]{1,128}$/.test(value)))&&
  url.searchParams.getAll('mode').length<=1&&url.searchParams.getAll('_rsc').length<=1;
}
/** Next dev may normalize its internal URL to localhost. Keep the public Host exact. */
export function p034ProxyDocumentRequest(url:URL,headers:Pick<Headers,'get'>,
 method:string,env:G678PreviewEnvironment=process.env):boolean{
 if(!p034DocumentHeaders(headers,env)||
  ![P034_LOCAL_ORIGIN,'http://localhost:3331'].includes(url.origin))return false;
 const external=new URL(url.href);external.hostname='127.0.0.1';
 return p034DocumentRequest(external,headers,method,env);
}
