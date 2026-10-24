import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
 type G678PreviewEnvironment} from './g678-preview-policy';
import {P001_ASSET_ROOT,P001_LOCAL_ORIGIN,
 p001DocumentReferer,p001LocalDevelopment} from './alg-l08-p001-preview-policy-v1';

export const P001_STREAM_PIN=Object.freeze({sourceBytes:53820,
 sourceSha256:'f02ac7ba661a072c1d5c812943f82745698e8fbabd45daf3a3e21536aee2b269'});
export const P001_RESOURCE_PINS=Object.freeze({
 'source-stream':Object.freeze({originalPath:`${P001_ASSET_ROOT}/source-stream`,
  path:'migrations/shared-alg001-l08-p001/source-v1/source-stream-142.mp3',
  bytes:P001_STREAM_PIN.sourceBytes,sha256:P001_STREAM_PIN.sourceSha256,
  contentType:'audio/mpeg' as const}),
});
export type P001Resource=keyof typeof P001_RESOURCE_PINS;
export function p001ResourceForRequest(request:{method:string;url:URL;headers:Pick<Headers,'get'>},
 mode:'candidate'|'registered',env:G678PreviewEnvironment=process.env):P001Resource|null{
 const {method,url,headers}=request,row=P001_RESOURCE_PINS['source-stream'];
 if(!p001LocalDevelopment(env)||!isG678LocalPreviewRequestUrl(url,env)||
  !isG678LocalPreviewRequestHeaders(headers,env)||
  url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
  headers.get('host')!=='127.0.0.1:3331'||
  ![null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))||
  ![null,'http'].includes(headers.get('x-forwarded-proto'))||
  headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin'||
  ![null,P001_LOCAL_ORIGIN].includes(headers.get('origin'))||
  !p001DocumentReferer(headers.get('referer'),mode)||
  url.pathname!==row.originalPath||
  url.search!==`?sha256=${row.sha256}`||!['GET','HEAD'].includes(method)||
  headers.get('sec-fetch-dest')!=='empty'||headers.get('sec-fetch-mode')!=='cors')return null;
 return 'source-stream';
}
