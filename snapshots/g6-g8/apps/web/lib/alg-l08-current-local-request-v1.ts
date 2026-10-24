import {P040_RESOURCE_PINS} from './alg-l08-p040-local-request-v1';
import {P050_RESOURCE_PINS} from './alg-l08-p050-local-request-v1';
import {P038_RESOURCE_PINS} from './alg-l08-p038-local-request-v1';
import {P039_RESOURCE_PINS} from './alg-l08-p039-local-request-v1';
import {P046_RESOURCE_PINS} from './alg-l08-p046-local-request-v1';
import {P047_RESOURCE_PINS} from './alg-l08-p047-local-request-v1';
import {P048_RESOURCE_PINS} from './alg-l08-p048-local-request-v1';
import {P037_RESOURCE_PINS} from './alg-l08-p037-local-request-v1';
import {P036_RESOURCE_PINS} from './alg-l08-p036-local-request-v1';
import {P035_RESOURCE_PINS} from './alg-l08-p035-local-request-v1';
import {P034_RESOURCE_PINS} from './alg-l08-p034-local-request-v1';
import {P033_RESOURCE_PINS} from './alg-l08-p033-local-request-v1';
import {P032_RESOURCE_PINS} from './alg-l08-p032-local-request-v1';
import {P031_RESOURCE_PINS} from './alg-l08-p031-local-request-v1';
import {P030_RESOURCE_PINS} from './alg-l08-p030-local-request-v1';
import {P029_RESOURCE_PINS} from './alg-l08-p029-local-request-v1';
import {P028_RESOURCE_PINS} from './alg-l08-p028-local-request-v1';
import {P027_RESOURCE_PINS} from './alg-l08-p027-local-request-v1';
import {P026_RESOURCE_PINS} from './alg-l08-p026-local-request-v1';
import {P024_RESOURCE_PINS} from './alg-l08-p024-local-request-v1';
import {P023_RESOURCE_PINS} from './alg-l08-p023-local-request-v1';
import {P022_RESOURCE_PINS} from './alg-l08-p022-local-request-v1';
import {P021_RESOURCE_PINS} from './alg-l08-p021-local-request-v1';
import {P020_RESOURCE_PINS} from './alg-l08-p020-local-request-v1';
import {P019_RESOURCE_PINS} from './alg-l08-p019-local-request-v1';
import {P018_RESOURCE_PINS} from './alg-l08-p018-local-request-v1';
import {P016_RESOURCE_PINS} from './alg-l08-p016-local-request-v1';
import {P015_RESOURCE_PINS} from './alg-l08-p015-local-request-v1';
import {P014_RESOURCE_PINS} from './alg-l08-p014-local-request-v1';
import {P013_RESOURCE_PINS} from './alg-l08-p013-local-request-v1';
import {P012_RESOURCE_PINS} from './alg-l08-p012-local-request-v1';
import {P011_RESOURCE_PINS} from './alg-l08-p011-local-request-v1';
import {P010_RESOURCE_PINS} from './alg-l08-p010-local-request-v1';
import {P009_RESOURCE_PINS} from './alg-l08-p009-local-request-v1';
import {P007_RESOURCE_PINS} from './alg-l08-p007-local-request-v1';
import {P006_RESOURCE_PINS} from './alg-l08-p006-local-request-v1';
import {P001_RESOURCE_PINS} from './alg-l08-p001-local-request-v1';
import {P005_RESOURCE_PINS} from './alg-l08-p005-local-request-v1';
import {L8_LESSON_CANVAS_RESOURCES} from './alg-l08-lesson-canvas-request-v1';
import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,type G678PreviewEnvironment} from './g678-preview-policy';
import {l8CurrentDocumentReferer,l8LocalDevelopment,L8_LOCAL_ORIGIN} from './alg-l08-current-local-documents-v1';
type Row={originalPath:string;path:string;bytes:number;sha256:string;contentType:string;destination:'script'|'empty';mode:'cors'|'no-cors';owner:'p001'|'p005'|'p006'|'p007'|'p009'|'p010'|'p011'|'p012'|'p013'|'p014'|'p015'|'p016'|'p018'|'p019'|'p020'|'p021'|'p022'|'p023'|'p024'|'p026'|'p027'|'p028'|'p029'|'p030'|'p031'|'p032'|'p033'|'p034'|'p035'|'p036'|'p037'|'p038'|'p039'|'p046'|'p047'|'p048'|'p040'|'p050'|'historical';resource:string};
export const L8_CURRENT_RESOURCE_PINS:Readonly<Record<string,Row>>=Object.freeze({
 ...Object.fromEntries(Object.entries(P001_RESOURCE_PINS).map(([resource,pin])=>[`p001-${resource}`,Object.freeze({...pin,destination:'empty',mode:'cors',owner:'p001',resource})])),
 ...Object.fromEntries(Object.entries(P005_RESOURCE_PINS).map(([resource,pin])=>[`p005-${resource}`,Object.freeze({...pin,owner:'p005',resource})])),
 ...Object.fromEntries(Object.entries(P006_RESOURCE_PINS).map(([resource,pin])=>[`p006-${resource}`,Object.freeze({...pin,owner:'p006',resource})])),
 ...Object.fromEntries(Object.entries(P007_RESOURCE_PINS).map(([resource,pin])=>[`p007-${resource}`,Object.freeze({...pin,owner:'p007',resource})])),
 ...Object.fromEntries(Object.entries(P009_RESOURCE_PINS).map(([resource,pin])=>[`p009-${resource}`,Object.freeze({...pin,owner:'p009',resource})])),
 ...Object.fromEntries(Object.entries(P010_RESOURCE_PINS).map(([resource,pin])=>[`p010-${resource}`,Object.freeze({...pin,owner:'p010',resource})])),
 ...Object.fromEntries(Object.entries(P011_RESOURCE_PINS).map(([resource,pin])=>[`p011-${resource}`,Object.freeze({...pin,owner:'p011',resource})])),
 ...Object.fromEntries(Object.entries(P012_RESOURCE_PINS).map(([resource,pin])=>[`p012-${resource}`,Object.freeze({...pin,owner:'p012',resource})])),
 ...Object.fromEntries(Object.entries(P013_RESOURCE_PINS).map(([resource,pin])=>[`p013-${resource}`,Object.freeze({...pin,owner:'p013',resource})])),
 ...Object.fromEntries(Object.entries(P014_RESOURCE_PINS).map(([resource,pin])=>[`p014-${resource}`,Object.freeze({...pin,owner:'p014',resource})])),
 ...Object.fromEntries(Object.entries(P015_RESOURCE_PINS).map(([resource,pin])=>[`p015-${resource}`,Object.freeze({...pin,owner:'p015',resource})])),
 ...Object.fromEntries(Object.entries(P016_RESOURCE_PINS).map(([resource,pin])=>[`p016-${resource}`,Object.freeze({...pin,owner:'p016',resource})])),
 ...Object.fromEntries(Object.entries(P018_RESOURCE_PINS).map(([resource,pin])=>[`p018-${resource}`,Object.freeze({...pin,owner:'p018',resource})])),
 ...Object.fromEntries(Object.entries(P019_RESOURCE_PINS).map(([resource,pin])=>[`p019-${resource}`,Object.freeze({...pin,owner:'p019',resource})])),
 ...Object.fromEntries(Object.entries(P020_RESOURCE_PINS).map(([resource,pin])=>[`p020-${resource}`,Object.freeze({...pin,owner:'p020',resource})])),
 ...Object.fromEntries(Object.entries(P021_RESOURCE_PINS).map(([resource,pin])=>[`p021-${resource}`,Object.freeze({...pin,owner:'p021',resource})])),
 ...Object.fromEntries(Object.entries(P022_RESOURCE_PINS).map(([resource,pin])=>[`p022-${resource}`,Object.freeze({...pin,owner:'p022',resource})])),
 ...Object.fromEntries(Object.entries(P023_RESOURCE_PINS).map(([resource,pin])=>[`p023-${resource}`,Object.freeze({...pin,owner:'p023',resource})])),
 ...Object.fromEntries(Object.entries(P024_RESOURCE_PINS).map(([resource,pin])=>[`p024-${resource}`,Object.freeze({...pin,owner:'p024',resource})])),
 ...Object.fromEntries(Object.entries(P026_RESOURCE_PINS).map(([resource,pin])=>[`p026-${resource}`,Object.freeze({...pin,owner:'p026',resource})])),
 ...Object.fromEntries(Object.entries(P027_RESOURCE_PINS).map(([resource,pin])=>[`p027-${resource}`,Object.freeze({...pin,owner:'p027',resource})])),
 ...Object.fromEntries(Object.entries(P028_RESOURCE_PINS).map(([resource,pin])=>[`p028-${resource}`,Object.freeze({...pin,owner:'p028',resource})])),
 ...Object.fromEntries(Object.entries(P029_RESOURCE_PINS).map(([resource,pin])=>[`p029-${resource}`,Object.freeze({...pin,owner:'p029',resource})])),
 ...Object.fromEntries(Object.entries(P030_RESOURCE_PINS).map(([resource,pin])=>[`p030-${resource}`,Object.freeze({...pin,owner:'p030',resource})])),
 ...Object.fromEntries(Object.entries(P031_RESOURCE_PINS).map(([resource,pin])=>[`p031-${resource}`,Object.freeze({...pin,owner:'p031',resource})])),
 ...Object.fromEntries(Object.entries(P032_RESOURCE_PINS).map(([resource,pin])=>[`p032-${resource}`,Object.freeze({...pin,owner:'p032',resource})])),
 ...Object.fromEntries(Object.entries(P033_RESOURCE_PINS).map(([resource,pin])=>[`p033-${resource}`,Object.freeze({...pin,owner:'p033',resource})])),
 ...Object.fromEntries(Object.entries(P034_RESOURCE_PINS).map(([resource,pin])=>[`p034-${resource}`,Object.freeze({...pin,owner:'p034',resource})])),
 ...Object.fromEntries(Object.entries(P035_RESOURCE_PINS).map(([resource,pin])=>[`p035-${resource}`,Object.freeze({...pin,owner:'p035',resource})])),
 ...Object.fromEntries(Object.entries(P036_RESOURCE_PINS).map(([resource,pin])=>[`p036-${resource}`,Object.freeze({...pin,owner:'p036',resource})])),
 ...Object.fromEntries(Object.entries(P037_RESOURCE_PINS).map(([resource,pin])=>[`p037-${resource}`,Object.freeze({...pin,owner:'p037',resource})])),
 ...Object.fromEntries(Object.entries(P038_RESOURCE_PINS).map(([resource,pin])=>[`p038-${resource}`,Object.freeze({...pin,owner:'p038',resource})])),
 ...Object.fromEntries(Object.entries(P039_RESOURCE_PINS).map(([resource,pin])=>[`p039-${resource}`,Object.freeze({...pin,owner:'p039',resource})])),
 ...Object.fromEntries(Object.entries(P046_RESOURCE_PINS).map(([resource,pin])=>[`p046-${resource}`,Object.freeze({...pin,owner:'p046',resource})])),
 ...Object.fromEntries(Object.entries(P047_RESOURCE_PINS).map(([resource,pin])=>[`p047-${resource}`,Object.freeze({...pin,owner:'p047',resource})])),
 ...Object.fromEntries(Object.entries(P048_RESOURCE_PINS).map(([resource,pin])=>[`p048-${resource}`,Object.freeze({...pin,owner:'p048',resource})])),
 ...Object.fromEntries(Object.entries(P040_RESOURCE_PINS).map(([resource,pin])=>[`p040-${resource}`,Object.freeze({...pin,owner:'p040',resource})])),
 ...Object.fromEntries(Object.entries(P050_RESOURCE_PINS).map(([resource,pin])=>[`p050-${resource}`,Object.freeze({...pin,owner:'p050',resource})])),
 ...Object.fromEntries(Object.entries(L8_LESSON_CANVAS_RESOURCES).map(([resource,pin])=>[`historical-${resource}`,Object.freeze({...pin,destination:'script',mode:'cors',owner:'historical',resource})])),
});
export function l8CurrentResourceForRequest(request:{method:string;url:URL;headers:Pick<Headers,'get'>},mode:'candidate'|'registered',env:G678PreviewEnvironment=process.env):string|null{
 const {method,url,headers}=request;
 if(!l8LocalDevelopment(env)||!isG678LocalPreviewRequestUrl(url,env)||!isG678LocalPreviewRequestHeaders(headers,env)||
  url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
  headers.get('host')!=='127.0.0.1:3331'||![null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))||
  ![null,'http'].includes(headers.get('x-forwarded-proto'))||headers.get('range')!==null||
  headers.get('sec-fetch-site')!=='same-origin'||![null,L8_LOCAL_ORIGIN].includes(headers.get('origin'))||
  !l8CurrentDocumentReferer(headers.get('referer'),mode))return null;
 for(const [token,pin] of Object.entries(L8_CURRENT_RESOURCE_PINS)){
  if(url.pathname!==pin.originalPath&&url.pathname!==`/flash-assets/g678-local/alg-l08-current-${mode}/${token}`)continue;
  if(url.search!==`?sha256=${pin.sha256}`||!['GET','HEAD'].includes(method)||
   headers.get('sec-fetch-dest')!==pin.destination||headers.get('sec-fetch-mode')!==pin.mode||
   (pin.destination==='script'&&(method!=='GET'||headers.get('origin')!==L8_LOCAL_ORIGIN)))return null;
  return token;
 }
 return null;
}
