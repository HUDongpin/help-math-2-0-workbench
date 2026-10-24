import type {G678PreviewEnvironment} from './g678-preview-policy';

export const P013_ID='shared-alg001-l07-p013';
export const P013_LOCAL_ORIGIN='http://127.0.0.1:3331';
export const P013_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const P013_ROUTE=`/migration-status/g678-calibration/${P013_ID}`;
export const P013_ASSET_ROOT=`/flash-assets/g678-local/${P013_ID}`;

export function p013LocalDevelopment(env:G678PreviewEnvironment=process.env):boolean{
 return env.NODE_ENV==='development'&&!env.VERCEL&&!env.VERCEL_ENV&&
  env.HELP_MATH_G678_SOURCE_ROOT===P013_SOURCE_ROOT&&
  ['1','true'].includes(env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
  env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1';
}
export function p013DocumentHeaders(headers:Pick<Headers,'get'>,
 env:G678PreviewEnvironment=process.env):boolean{
 return p013LocalDevelopment(env)&&headers.get('host')==='127.0.0.1:3331'&&
  [null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))&&
  [null,'http'].includes(headers.get('x-forwarded-proto'))&&
  [null,P013_LOCAL_ORIGIN].includes(headers.get('origin'));
}
export function p013DocumentRequest(url:URL,headers:Pick<Headers,'get'>,
 method:string,mode:'candidate'|'registered',env:G678PreviewEnvironment=process.env):boolean{
 return p013DocumentHeaders(headers,env)&&url.origin===P013_LOCAL_ORIGIN&&
  !url.username&&!url.password&&!url.hash&&['GET','HEAD'].includes(method)&&
  ['en','es'].some(locale=>url.pathname===`/${locale}${P013_ROUTE}/${mode}-v1`)&&
  [...url.searchParams].every(([key,value])=>
   (key==='mode'&&value==='focus')||(key==='_rsc'&&/^[A-Za-z0-9_-]{1,128}$/.test(value)))&&
  url.searchParams.getAll('mode').length<=1&&url.searchParams.getAll('_rsc').length<=1;
}
export function p013ProxyDocumentRequest(url:URL,headers:Pick<Headers,'get'>,
 method:string,mode:'candidate'|'registered',env:G678PreviewEnvironment=process.env):boolean{
 if(!p013DocumentHeaders(headers,env)||
  ![P013_LOCAL_ORIGIN,'http://localhost:3331'].includes(url.origin))return false;
 const external=new URL(url.href);external.hostname='127.0.0.1';
 return p013DocumentRequest(external,headers,method,mode,env);
}
export function p013DocumentReferer(value:string|null,mode:'candidate'|'registered'):boolean{
 if(!value)return false;
 try{
  const url=new URL(value);
  return url.origin===P013_LOCAL_ORIGIN&&!url.username&&!url.password&&!url.hash&&
   ['','?mode=focus'].includes(url.search)&&
   ['en','es'].some(locale=>url.pathname===`/${locale}${P013_ROUTE}/${mode}-v1`);
 }catch{return false;}
}
