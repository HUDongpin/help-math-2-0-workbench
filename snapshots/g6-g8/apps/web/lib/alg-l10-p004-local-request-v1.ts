import type {G678PreviewEnvironment} from './g678-preview-policy';
import {isG678LocalPreviewRequestUrl,isG678LocalPreviewRequestHeaders} from './g678-preview-policy';
import {P004_LOCAL_ORIGIN,p004LocalDevelopment,p004DocumentReferer} from './alg-l10-p004-preview-policy-v1';
import {P004_RESOURCE_PINS,type P004ResourceId} from './alg-l10-p004-resource-pins-v1';
export {P004_RESOURCE_PINS} from './alg-l10-p004-resource-pins-v1';
export type P004Resource=P004ResourceId;
export function p004ResourceForRequest(request:{method:string;url:URL;headers:Pick<Headers,'get'>},
 env:G678PreviewEnvironment=process.env):P004Resource|null{
 const {method,url,headers}=request;
 if(!p004LocalDevelopment(env)||!isG678LocalPreviewRequestUrl(url,env)||!isG678LocalPreviewRequestHeaders(headers,env)||
  url.origin!==P004_LOCAL_ORIGIN||url.username||url.password||url.hash||!['GET','HEAD'].includes(method)||
  headers.get('host')!=='127.0.0.1:3331'||![null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))||
  ![null,'http'].includes(headers.get('x-forwarded-proto'))||headers.get('range')!==null||
  headers.get('sec-fetch-site')!=='same-origin'||![null,P004_LOCAL_ORIGIN].includes(headers.get('origin'))||
  !(p004DocumentReferer(headers.get('referer'),'candidate')||p004DocumentReferer(headers.get('referer'),'registered')))return null;
 const token=(Object.keys(P004_RESOURCE_PINS) as P004Resource[]).find(key=>P004_RESOURCE_PINS[key].originalPath===url.pathname);
 if(!token)return null;const row=P004_RESOURCE_PINS[token];
 return url.search===`?sha256=${row.sha256}`&&headers.get('sec-fetch-dest')===row.destination&&headers.get('sec-fetch-mode')===row.mode?token:null;
}
