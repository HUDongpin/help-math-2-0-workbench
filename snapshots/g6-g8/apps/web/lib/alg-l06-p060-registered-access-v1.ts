/** Current registered P060 view. The frozen candidate policy remains byte identical. */
import {P060_RESOURCE_PINS,p060ResourceForRequest}
 from './alg-l06-p060-local-request-v1';
import {P060_ID,P060_LOCAL_ORIGIN,p060DocumentHeaders}
 from './alg-l06-p060-preview-policy-v1';
import type {G678PreviewEnvironment} from './g678-preview-policy';

export const P060_REGISTERED_PATH=`/migration-status/g678-calibration/${P060_ID}/registered-v1`;
export const P060_REGISTERED_ASSET_ROOT=`/flash-assets/g678-local/${P060_ID}-registered`;
const documentPaths=Object.freeze(['en','es'].map(locale=>`/${locale}${P060_REGISTERED_PATH}`));
const candidateReferer=`${P060_LOCAL_ORIGIN}/en/migration-status/g678-calibration/${P060_ID}/candidate-v1`;

function registeredReferer(value:string|null):boolean{
 if(!value)return false;
 try{
  const url=new URL(value);
  return url.origin===P060_LOCAL_ORIGIN&&!url.username&&!url.password&&!url.hash&&
   ['','?mode=focus'].includes(url.search)&&documentPaths.includes(url.pathname);
 }catch{return false;}
}
export function p060RegisteredDocumentRequest(url:URL,headers:Pick<Headers,'get'>,
 method:string,env:G678PreviewEnvironment=process.env):boolean{
 return p060DocumentHeaders(headers,env)&&url.origin===P060_LOCAL_ORIGIN&&
  !url.username&&!url.password&&!url.hash&&['GET','HEAD'].includes(method)&&
  documentPaths.includes(url.pathname)&&[...url.searchParams].every(([key,value])=>
   (key==='mode'&&value==='focus')||(key==='_rsc'&&/^[A-Za-z0-9_-]{1,128}$/.test(value)))&&
  url.searchParams.getAll('mode').length<=1&&url.searchParams.getAll('_rsc').length<=1;
}
export function p060RegisteredProxyDocumentRequest(url:URL,headers:Pick<Headers,'get'>,
 method:string,env:G678PreviewEnvironment=process.env):boolean{
 if(!p060DocumentHeaders(headers,env)||
  ![P060_LOCAL_ORIGIN,'http://localhost:3331'].includes(url.origin))return false;
 const external=new URL(url.href);external.hostname='127.0.0.1';
 return p060RegisteredDocumentRequest(external,headers,method,env);
}
export function p060RegisteredResourceForRequest({method,url,headers}:{
 method:string;url:URL;headers:Pick<Headers,'get'>},
 env:G678PreviewEnvironment=process.env):string|null{
 if(!registeredReferer(headers.get('referer')))return null;
 const canonicalHeaders={get:(key:string)=>key.toLowerCase()==='referer'
  ?candidateReferer:headers.get(key)};
 for(const [token,pin] of Object.entries(P060_RESOURCE_PINS)){
  if(url.pathname!==pin.originalPath&&
   url.pathname!==`${P060_REGISTERED_ASSET_ROOT}/${token}`)continue;
  const original=new URL(url.href);original.pathname=pin.originalPath;
  return p060ResourceForRequest({method,url:original,headers:canonicalHeaders},env)===token
   ?token:null;
 }
 return null;
}
