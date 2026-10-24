/** Exact P038-only local candidate document boundary. */
import type {G678PreviewEnvironment} from './g678-preview-policy';

export const P038_ID='shared-alg001-l06-p038';
export const P038_LOCAL_ORIGIN='http://127.0.0.1:3331';
export const P038_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const P038_ASSET_ROOT=`/flash-assets/g678-local/${P038_ID}`;
export const P038_DOCUMENT_PATHS=Object.freeze(['en','es'].map(locale=>
 `/${locale}/migration-status/g678-calibration/${P038_ID}/candidate-v1`));

export function p038LocalDevelopment(env:G678PreviewEnvironment=process.env):boolean{
 return env.NODE_ENV==='development'&&!env.VERCEL&&!env.VERCEL_ENV&&
  env.HELP_MATH_G678_SOURCE_ROOT===P038_SOURCE_ROOT&&
  ['1','true'].includes(env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
  env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1';
}
export function p038CandidateReferer(value:string|null):boolean{
 if(!value)return false;
 try{
  const url=new URL(value);
  return url.origin===P038_LOCAL_ORIGIN&&!url.username&&!url.password&&!url.hash&&
   ['','?mode=focus'].includes(url.search)&&P038_DOCUMENT_PATHS.includes(url.pathname);
 }catch{return false;}
}
export function p038DocumentHeaders(headers:Pick<Headers,'get'>,
 env:G678PreviewEnvironment=process.env):boolean{
 return p038LocalDevelopment(env)&&headers.get('host')==='127.0.0.1:3331'&&
  [null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))&&
  [null,'http'].includes(headers.get('x-forwarded-proto'))&&
  [null,P038_LOCAL_ORIGIN].includes(headers.get('origin'));
}
export function p038DocumentRequest(url:URL,headers:Pick<Headers,'get'>,
 method:string,env:G678PreviewEnvironment=process.env):boolean{
 return p038DocumentHeaders(headers,env)&&url.origin===P038_LOCAL_ORIGIN&&
  !url.username&&!url.password&&!url.hash&&['GET','HEAD'].includes(method)&&
  P038_DOCUMENT_PATHS.includes(url.pathname)&&[...url.searchParams].every(([key,value])=>
   (key==='mode'&&value==='focus')||(key==='_rsc'&&/^[A-Za-z0-9_-]{1,128}$/.test(value)))&&
  url.searchParams.getAll('mode').length<=1&&url.searchParams.getAll('_rsc').length<=1;
}
/** Next dev may normalize its internal URL to localhost; public Host remains exact. */
export function p038ProxyDocumentRequest(url:URL,headers:Pick<Headers,'get'>,
 method:string,env:G678PreviewEnvironment=process.env):boolean{
 if(!p038DocumentHeaders(headers,env)||
  ![P038_LOCAL_ORIGIN,'http://localhost:3331'].includes(url.origin))return false;
 const external=new URL(url.href);external.hostname='127.0.0.1';
 return p038DocumentRequest(external,headers,method,env);
}
