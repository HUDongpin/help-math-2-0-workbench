/** Exact P056-only source-audio candidate document boundary. */
import type {G678PreviewEnvironment} from './g678-preview-policy';

export const P056_ID='shared-alg001-l06-p056';
export const P056_LOCAL_ORIGIN='http://127.0.0.1:3331';
export const P056_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const P056_ASSET_ROOT=`/flash-assets/g678-local/${P056_ID}`;
export const P056_DOCUMENT_PATHS=Object.freeze(['en','es'].map(locale=>
 `/${locale}/migration-status/g678-calibration/${P056_ID}/candidate-v1`));

export function p056LocalDevelopment(env:G678PreviewEnvironment=process.env):boolean{
 return env.NODE_ENV==='development'&&!env.VERCEL&&!env.VERCEL_ENV&&
  env.HELP_MATH_G678_SOURCE_ROOT===P056_SOURCE_ROOT&&
  ['1','true'].includes(env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
  env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1';
}
export function p056CandidateReferer(value:string|null):boolean{
 if(!value)return false;
 try{
  const url=new URL(value);
  return url.origin===P056_LOCAL_ORIGIN&&!url.username&&!url.password&&!url.hash&&
   ['','?mode=focus'].includes(url.search)&&P056_DOCUMENT_PATHS.includes(url.pathname);
 }catch{return false;}
}
export function p056DocumentHeaders(headers:Pick<Headers,'get'>,
 env:G678PreviewEnvironment=process.env):boolean{
 return p056LocalDevelopment(env)&&headers.get('host')==='127.0.0.1:3331'&&
  [null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))&&
  [null,'http'].includes(headers.get('x-forwarded-proto'))&&
  [null,P056_LOCAL_ORIGIN].includes(headers.get('origin'));
}
export function p056DocumentRequest(url:URL,headers:Pick<Headers,'get'>,
 method:string,env:G678PreviewEnvironment=process.env):boolean{
 return p056DocumentHeaders(headers,env)&&url.origin===P056_LOCAL_ORIGIN&&
  !url.username&&!url.password&&!url.hash&&['GET','HEAD'].includes(method)&&
  P056_DOCUMENT_PATHS.includes(url.pathname)&&[...url.searchParams].every(([key,value])=>
   (key==='mode'&&value==='focus')||(key==='_rsc'&&/^[A-Za-z0-9_-]{1,128}$/.test(value)))&&
  url.searchParams.getAll('mode').length<=1&&url.searchParams.getAll('_rsc').length<=1;
}
export function p056ProxyDocumentRequest(url:URL,headers:Pick<Headers,'get'>,
 method:string,env:G678PreviewEnvironment=process.env):boolean{
 if(!p056DocumentHeaders(headers,env)||
  ![P056_LOCAL_ORIGIN,'http://localhost:3331'].includes(url.origin))return false;
 const external=new URL(url.href);external.hostname='127.0.0.1';
 return p056DocumentRequest(external,headers,method,env);
}
