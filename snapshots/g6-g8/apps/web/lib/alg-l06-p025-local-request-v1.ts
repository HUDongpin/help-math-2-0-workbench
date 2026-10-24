import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {P024_RESOURCE_PINS} from './alg-l06-p024-local-request-v1';
import {P025_ASSET_ROOT as ROOT,P025_LOCAL_ORIGIN as ORIGIN,
  p025CandidateReferer,p025LocalDevelopment} from './alg-l06-p025-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
  root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
  bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
    originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const ownPreviousTokens=new Set(['canvas-renderer.js','optional-spanish-audio-v1']);
const inherited=Object.fromEntries(Object.entries(P024_RESOURCE_PINS).map(([token,row])=>{
 const newToken=ownPreviousTokens.has(token)?`p024-${token}`:token;
 return [newToken,pin(row.originalPath,newToken,row.path,row.root,row.bytes,row.sha256,row.contentType)];
}));

/** Three exact P025 resources and the unchanged registered P024 predecessor assets. */
export const P025_RESOURCE_PINS=Object.freeze({
 "canvas-renderer.js":pin(`${ROOT}/canvas-renderer.js`,"canvas-renderer.js","output/alg-l06-p025-canvas-v2/canvas-renderer.js",'workspace',909190,"a3fd0f401fa32779ddff8fc41bc423d458b2ea2a929c44a43fbe3446dc5082f9","text/javascript; charset=utf-8"),
 "main-1":pin(`${ROOT}/main-1`,"main-1","output/alg-l06-p025-audio-v1/sprite-21-source-v1.mp3",'workspace',123500,"e6122c6402e0000f810b82a6f91b76b50a918a44b75709194b2cec3834a201c4","audio/mpeg"),
 "optional-spanish-audio-v1":pin(`${ROOT}/optional-spanish-audio-v1`,"optional-spanish-audio-v1","output/alg-l06-p025-audio-v1/separate-sa-source-v1.mp3",'workspace',173040,"295dcabe0549764ffe03ecc4e6a332a5cb85d05329095be079ad32bdac6a044e","audio/mpeg"),
 ...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P025Resource=keyof typeof P025_RESOURCE_PINS;
export const P025_PREDECESSOR_ORIGINAL_PATHS=Object.freeze(Object.values(P025_RESOURCE_PINS)
  .filter(row=>row.originalPath!==row.bridgePath).map(row=>row.originalPath));
export const p025ResourceUrl=(resource:P025Resource)=>{
  const row=P025_RESOURCE_PINS[resource];
  if(!row)throw Error('P025_RESOURCE_UNKNOWN');
  return `${row.originalPath}?sha256=${row.sha256}`;
};
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};
/** Both original URLs and internal rewrite paths require the same exact pin. */
export function p025ResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):P025Resource|null{
  const {method,url,headers}=request;
  if(!p025LocalDevelopment(env)||
    !isG678LocalPreviewRequestUrl(url,env)||!isG678LocalPreviewRequestHeaders(headers,env)||
    url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
    headers.get('host')!=='127.0.0.1:3331'||
    (headers.get('x-forwarded-host')!==null&&headers.get('x-forwarded-host')!=='127.0.0.1:3331')||
    (headers.get('x-forwarded-proto')!==null&&headers.get('x-forwarded-proto')!=='http')||
    headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
  const origin=headers.get('origin');
  if(origin!==null&&origin!==ORIGIN)return null;
  if(!p025CandidateReferer(headers.get('referer')))return null;
  for(const [token,row] of Object.entries(P025_RESOURCE_PINS)){
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
