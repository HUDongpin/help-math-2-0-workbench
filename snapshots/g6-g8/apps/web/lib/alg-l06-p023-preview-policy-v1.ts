/** Exact P023-only local browser boundary. This module is edge-importable. */
import type {G678PreviewEnvironment} from './g678-preview-policy';

export const P023_ID='shared-alg001-l06-p023';
export const P023_LOCAL_ORIGIN='http://127.0.0.1:3331';
export const P023_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const P023_ASSET_ROOT=`/flash-assets/g678-local/${P023_ID}`;
const DOCUMENTS=new Set(['en','es'].flatMap(locale=>['candidate-v1','continuous-v1'].map(route=>
 `/${locale}/migration-status/g678-calibration/${P023_ID}/${route}`)));

export function p023LocalDevelopment(env:G678PreviewEnvironment=process.env):boolean{
 return env.NODE_ENV==='development'&&!env.VERCEL&&!env.VERCEL_ENV&&
  env.HELP_MATH_G678_SOURCE_ROOT===P023_SOURCE_ROOT&&
  ['1','true'].includes(env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
  env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1';
}

export function p023CandidateReferer(value:string|null):boolean{
 if(!value)return false;
 try{
  const referer=new URL(value);
  return referer.origin===P023_LOCAL_ORIGIN&&!referer.username&&!referer.password&&
   !referer.hash&&['','?mode=focus'].includes(referer.search)&&
   DOCUMENTS.has(referer.pathname);
 }catch{return false;}
}

/** Exact document boundary; resource and document scopes share one origin. */
export function p023DocumentHeaders(headers:Pick<Headers,'get'>,
 env:G678PreviewEnvironment=process.env):boolean{
 return p023LocalDevelopment(env)&&headers.get('host')==='127.0.0.1:3331'&&
  [null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))&&
  [null,'http'].includes(headers.get('x-forwarded-proto'))&&
  [null,P023_LOCAL_ORIGIN].includes(headers.get('origin'));
}
export function p023DocumentRequest(url:URL,headers:Pick<Headers,'get'>,
 method:string,env:G678PreviewEnvironment=process.env):boolean{
 return p023DocumentHeaders(headers,env)&&url.origin===P023_LOCAL_ORIGIN&&
  !url.username&&!url.password&&!url.hash&&['GET','HEAD'].includes(method)&&
  DOCUMENTS.has(url.pathname)&&[...url.searchParams].every(([key,value])=>
   (key==='mode'&&value==='focus')||(key==='_rsc'&&/^[A-Za-z0-9_-]{1,128}$/.test(value)))&&
  url.searchParams.getAll('mode').length<=1&&url.searchParams.getAll('_rsc').length<=1;
}

/** Next dev normalizes its internal URL to localhost; retain the exact public Host boundary. */
export function p023ProxyDocumentRequest(url:URL,headers:Pick<Headers,'get'>,
 method:string,env:G678PreviewEnvironment=process.env):boolean{
 if(!p023DocumentHeaders(headers,env)||
  ![P023_LOCAL_ORIGIN,'http://localhost:3331'].includes(url.origin))return false;
 const external=new URL(url.href);external.hostname='127.0.0.1';
 return p023DocumentRequest(external,headers,method,env);
}
