/** Exact P025-only local browser boundary. This module is edge-importable. */
import type {G678PreviewEnvironment} from './g678-preview-policy';

export const P025_ID='shared-alg001-l06-p025';
export const P025_LOCAL_ORIGIN='http://127.0.0.1:3331';
export const P025_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const P025_ASSET_ROOT=`/flash-assets/g678-local/${P025_ID}`;
const DOCUMENTS=new Set(['en','es'].flatMap(locale=>['candidate-v1','continuous-v1'].map(route=>
 `/${locale}/migration-status/g678-calibration/${P025_ID}/${route}`)));

export function p025LocalDevelopment(env:G678PreviewEnvironment=process.env):boolean{
 return env.NODE_ENV==='development'&&!env.VERCEL&&!env.VERCEL_ENV&&
  env.HELP_MATH_G678_SOURCE_ROOT===P025_SOURCE_ROOT&&
  ['1','true'].includes(env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
  env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1';
}

export function p025CandidateReferer(value:string|null):boolean{
 if(!value)return false;
 try{
  const referer=new URL(value);
  return referer.origin===P025_LOCAL_ORIGIN&&!referer.username&&!referer.password&&
   !referer.hash&&['','?mode=focus'].includes(referer.search)&&
   DOCUMENTS.has(referer.pathname);
 }catch{return false;}
}

/** Exact document boundary; resource and document scopes share one origin. */
export function p025DocumentHeaders(headers:Pick<Headers,'get'>,
 env:G678PreviewEnvironment=process.env):boolean{
 return p025LocalDevelopment(env)&&headers.get('host')==='127.0.0.1:3331'&&
  [null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))&&
  [null,'http'].includes(headers.get('x-forwarded-proto'))&&
  [null,P025_LOCAL_ORIGIN].includes(headers.get('origin'));
}
export function p025DocumentRequest(url:URL,headers:Pick<Headers,'get'>,
 method:string,env:G678PreviewEnvironment=process.env):boolean{
 return p025DocumentHeaders(headers,env)&&url.origin===P025_LOCAL_ORIGIN&&
  !url.username&&!url.password&&!url.hash&&['GET','HEAD'].includes(method)&&
  DOCUMENTS.has(url.pathname)&&[...url.searchParams].every(([key,value])=>
   (key==='mode'&&value==='focus')||(key==='_rsc'&&/^[A-Za-z0-9_-]{1,128}$/.test(value)))&&
  url.searchParams.getAll('mode').length<=1&&url.searchParams.getAll('_rsc').length<=1;
}

/** Next dev normalizes its internal URL to localhost; retain the exact public Host boundary. */
export function p025ProxyDocumentRequest(url:URL,headers:Pick<Headers,'get'>,
 method:string,env:G678PreviewEnvironment=process.env):boolean{
 if(!p025DocumentHeaders(headers,env)||
  ![P025_LOCAL_ORIGIN,'http://localhost:3331'].includes(url.origin))return false;
 const external=new URL(url.href);external.hostname='127.0.0.1';
 return p025DocumentRequest(external,headers,method,env);
}
