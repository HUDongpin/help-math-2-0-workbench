import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {P022_RESOURCE_PINS} from './alg-l06-p022-local-request-v1';
import {P023_ASSET_ROOT as ROOT,P023_LOCAL_ORIGIN as ORIGIN,
  p023CandidateReferer,p023LocalDevelopment} from './alg-l06-p023-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
  root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
  bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
    originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const ownPreviousTokens=new Set(['canvas-renderer.js','main-1','optional-spanish-audio-v1']);
const inherited=Object.fromEntries(Object.entries(P022_RESOURCE_PINS).map(([token,row])=>{
 const newToken=ownPreviousTokens.has(token)?`p022-${token}`:token;
 return [newToken,pin(row.originalPath,newToken,row.path,row.root,row.bytes,row.sha256,row.contentType)];
}));

/** Three exact P023 resources and the unchanged registered P022 predecessor assets. */
export const P023_RESOURCE_PINS=Object.freeze({
 "canvas-renderer.js":pin(`${ROOT}/canvas-renderer.js`,"canvas-renderer.js","output/alg-l06-p023-canvas-v1/canvas-renderer.js",'workspace',1121396,"537dc11715e7f7353e1bab5263a126516160328dde94976bce85c288ad61fa42","text/javascript; charset=utf-8"),
 "main-1":pin(`${ROOT}/main-1`,"main-1","output/alg-l06-p023-audio-v1/sprite-38-source-v1.mp3",'workspace',165750,"a8a52336d0b4e37aa2c00edc77a491afac4b38b173f13909d75b4a889a1e09a6","audio/mpeg"),
 "optional-spanish-audio-v1":pin(`${ROOT}/optional-spanish-audio-v1`,"optional-spanish-audio-v1","output/alg-l06-p023-audio-v1/separate-sa-source-v1.mp3",'workspace',292320,"c8da225f06545b2fd3b7edb77be46af198337b168dadd3c869cd9613377c33c5","audio/mpeg"),
 ...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P023Resource=keyof typeof P023_RESOURCE_PINS;
export const P023_PREDECESSOR_ORIGINAL_PATHS=Object.freeze(Object.values(P023_RESOURCE_PINS)
  .filter(row=>row.originalPath!==row.bridgePath).map(row=>row.originalPath));
export const p023ResourceUrl=(resource:P023Resource)=>{
  const row=P023_RESOURCE_PINS[resource];
  if(!row)throw Error('P023_RESOURCE_UNKNOWN');
  return `${row.originalPath}?sha256=${row.sha256}`;
};
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};
/** Both original URLs and internal rewrite paths require the same exact pin. */
export function p023ResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):P023Resource|null{
  const {method,url,headers}=request;
  if(!p023LocalDevelopment(env)||
    !isG678LocalPreviewRequestUrl(url,env)||!isG678LocalPreviewRequestHeaders(headers,env)||
    url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
    headers.get('host')!=='127.0.0.1:3331'||
    (headers.get('x-forwarded-host')!==null&&headers.get('x-forwarded-host')!=='127.0.0.1:3331')||
    (headers.get('x-forwarded-proto')!==null&&headers.get('x-forwarded-proto')!=='http')||
    headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
  const origin=headers.get('origin');
  if(origin!==null&&origin!==ORIGIN)return null;
  if(!p023CandidateReferer(headers.get('referer')))return null;
  for(const [token,row] of Object.entries(P023_RESOURCE_PINS)){
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
