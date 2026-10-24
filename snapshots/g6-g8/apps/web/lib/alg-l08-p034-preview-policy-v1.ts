import type {G678PreviewEnvironment} from './g678-preview-policy';

export const P034_ID='shared-alg001-l08-p034';
export const P034_LOCAL_ORIGIN='http://127.0.0.1:3331';
export const P034_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const P034_ROUTE=`/migration-status/g678-calibration/${P034_ID}`;
export const P034_ASSET_ROOT=`/flash-assets/g678-local/${P034_ID}`;

export function p034LocalDevelopment(env:G678PreviewEnvironment=process.env):boolean{
 return env.NODE_ENV==='development'&&!env.VERCEL&&!env.VERCEL_ENV&&
  env.HELP_MATH_G678_SOURCE_ROOT===P034_SOURCE_ROOT&&
  ['1','true'].includes(env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
  env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1';
}
export function p034DocumentHeaders(headers:Pick<Headers,'get'>,
 env:G678PreviewEnvironment=process.env):boolean{
 return p034LocalDevelopment(env)&&headers.get('host')==='127.0.0.1:3331'&&
  [null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))&&
  [null,'http'].includes(headers.get('x-forwarded-proto'))&&
  [null,P034_LOCAL_ORIGIN].includes(headers.get('origin'));
}
export function p034DocumentRequest(url:URL,headers:Pick<Headers,'get'>,
 method:string,mode:'candidate'|'registered',env:G678PreviewEnvironment=process.env):boolean{
 return p034DocumentHeaders(headers,env)&&url.origin===P034_LOCAL_ORIGIN&&
  !url.username&&!url.password&&!url.hash&&['GET','HEAD'].includes(method)&&
  ['en','es'].some(locale=>url.pathname===`/${locale}${P034_ROUTE}/${mode}-v1`)&&
  [...url.searchParams].every(([key,value])=>
   (key==='mode'&&value==='focus')||(key==='_rsc'&&/^[A-Za-z0-9_-]{1,128}$/.test(value)))&&
  url.searchParams.getAll('mode').length<=1&&url.searchParams.getAll('_rsc').length<=1;
}
export function p034ProxyDocumentRequest(url:URL,headers:Pick<Headers,'get'>,
 method:string,mode:'candidate'|'registered',env:G678PreviewEnvironment=process.env):boolean{
 if(!p034DocumentHeaders(headers,env)||
  ![P034_LOCAL_ORIGIN,'http://localhost:3331'].includes(url.origin))return false;
 const external=new URL(url.href);external.hostname='127.0.0.1';
 return p034DocumentRequest(external,headers,method,mode,env);
}
export function p034DocumentReferer(value:string|null,mode:'candidate'|'registered'):boolean{
 if(!value)return false;
 try{
  const url=new URL(value);
  return url.origin===P034_LOCAL_ORIGIN&&!url.username&&!url.password&&!url.hash&&
   ['','?mode=focus'].includes(url.search)&&
   ['en','es'].some(locale=>url.pathname===`/${locale}${P034_ROUTE}/${mode}-v1`);
 }catch{return false;}
}
