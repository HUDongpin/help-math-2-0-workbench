import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {P032_RESOURCE_PINS} from './alg-l06-p032-local-request-v1';
import {P034_ASSET_ROOT as ROOT,P034_LOCAL_ORIGIN as ORIGIN,
  p034DocumentKindFromReferer,p034LocalDevelopment} from './alg-l06-p034-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
  root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
  bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
    originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const inherited=Object.fromEntries(Object.entries(P032_RESOURCE_PINS).map(([token,row])=>{
 const newToken=`p032-${token}`;
 return [newToken,pin(row.originalPath,newToken,row.path,row.root,row.bytes,row.sha256,row.contentType)];
}));

/** Three exact P034 resources and unchanged 109 P032 predecessor URLs. */
export const P034_RESOURCE_PINS=Object.freeze({
 "canvas-renderer.js":pin(`${ROOT}/canvas-renderer.js`,"canvas-renderer.js","migrations/shared-alg001-l06-p034/canvas-v1/canvas-renderer.js",'workspace',2754150,"8e424c04ecdde8168145b3aed03b02bcc2c38db95b776295fd7298fc04fedc87","text/javascript; charset=utf-8"),
 "main-source-v1":pin(`${ROOT}/main-source-v1`,"main-source-v1","migrations/shared-alg001-l06-p034/audio-source-v1/main-source-v1.mp3",'workspace',167310,"9f75303ceb0bd281d47f92583f1c40aa34b4974695a0c019199682b507131e2d","audio/mpeg"),
 "optional-spanish-audio-v1":pin(`${ROOT}/optional-spanish-audio-v1`,"optional-spanish-audio-v1","G6-G8-shared/ALG001/L6/SA/L6IN06.mp3",'source',438816,"2bebaa57aee0e80591e80cd542dc98f51839593820c9ec16d6a720dbfd9dab30","audio/mpeg"),
 ...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P034Resource=keyof typeof P034_RESOURCE_PINS;
export const P034_PREDECESSOR_ORIGINAL_PATHS=Object.freeze(Object.values(P034_RESOURCE_PINS)
  .filter(row=>row.originalPath!==row.bridgePath).map(row=>row.originalPath));
export const p034ResourceUrl=(resource:P034Resource)=>{
  const row=P034_RESOURCE_PINS[resource];
  if(!row)throw Error('P034_RESOURCE_UNKNOWN');
  return `${row.originalPath}?sha256=${row.sha256}`;
};
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};
/** Both original URLs and internal rewrite paths require the same exact pin. */
export function p034ResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):P034Resource|null{
  const {method,url,headers}=request;
  if(!p034LocalDevelopment(env)||
    !isG678LocalPreviewRequestUrl(url,env)||!isG678LocalPreviewRequestHeaders(headers,env)||
    url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
    headers.get('host')!=='127.0.0.1:3331'||
    (headers.get('x-forwarded-host')!==null&&headers.get('x-forwarded-host')!=='127.0.0.1:3331')||
    (headers.get('x-forwarded-proto')!==null&&headers.get('x-forwarded-proto')!=='http')||
    headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
  const origin=headers.get('origin');
  if(origin!==null&&origin!==ORIGIN)return null;
  if(!p034DocumentKindFromReferer(headers.get('referer')))return null;
  for(const [token,row] of Object.entries(P034_RESOURCE_PINS)){
    if(url.pathname!==row.originalPath&&url.pathname!==row.bridgePath)continue;
    if(url.search!==`?sha256=${row.sha256}`)return null;
    const script=row.contentType.startsWith('text/javascript');
    if(script?(method!=='GET'||headers.get('sec-fetch-dest')!=='script'||
      !['cors','no-cors'].includes(headers.get('sec-fetch-mode')??'')||
      (headers.get('sec-fetch-mode')==='cors'&&origin!==ORIGIN)):
      (!['GET','HEAD'].includes(method)||headers.get('sec-fetch-dest')!=='empty'||
      headers.get('sec-fetch-mode')!=='cors'))return null;
    return token;
  }
  return null;
}
