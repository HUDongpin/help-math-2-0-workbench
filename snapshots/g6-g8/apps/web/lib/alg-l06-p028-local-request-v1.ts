import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {P027_RESOURCE_PINS} from './alg-l06-p027-local-request-v1';
import {P028_ASSET_ROOT as ROOT,P028_LOCAL_ORIGIN as ORIGIN,
  p028CandidateReferer,p028LocalDevelopment} from './alg-l06-p028-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
  root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
  bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
    originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const inherited=Object.fromEntries(Object.entries(P027_RESOURCE_PINS).map(([token,row])=>{
 const newToken=`p027-${token}`;
 return [newToken,pin(row.originalPath,newToken,row.path,row.root,row.bytes,row.sha256,row.contentType)];
}));

/** Three exact P028 resources and unchanged 103 P027 predecessor URLs. */
export const P028_RESOURCE_PINS=Object.freeze({
 "canvas-renderer.js":pin(`${ROOT}/canvas-renderer.js`,"canvas-renderer.js","output/alg-l06-p028-canvas-v1/canvas-renderer.js",'workspace',459877,"b4d784c6dd65c0a412c4a41447d4485476a8715b665b175f277a40a40ffbb2e6","text/javascript; charset=utf-8"),
 "main-source-v1":pin(`${ROOT}/main-source-v1`,"main-source-v1","output/alg-l06-p028-audio-extraction-v1/main-source-v1.mp3",'workspace',54990,"4f6453056b67a9eb37859eba02a0f0c31d1619d50fd7c83863c55f0fd7c41a70","audio/mpeg"),
 "optional-spanish-audio-v1":pin(`${ROOT}/optional-spanish-audio-v1`,"optional-spanish-audio-v1","G6-G8-shared/ALG001/L6/SA/L6VB21.mp3",'source',37632,"f056221dc3c4251538c3a1d2c201bec5abe92c18a58f6ce1d185a8a6cf6703cf","audio/mpeg"),
 ...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P028Resource=keyof typeof P028_RESOURCE_PINS;
export const P028_PREDECESSOR_ORIGINAL_PATHS=Object.freeze(Object.values(P028_RESOURCE_PINS)
  .filter(row=>row.originalPath!==row.bridgePath).map(row=>row.originalPath));
export const p028ResourceUrl=(resource:P028Resource)=>{
  const row=P028_RESOURCE_PINS[resource];
  if(!row)throw Error('P028_RESOURCE_UNKNOWN');
  return `${row.originalPath}?sha256=${row.sha256}`;
};
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};
/** Both original URLs and internal rewrite paths require the same exact pin. */
export function p028ResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):P028Resource|null{
  const {method,url,headers}=request;
  if(!p028LocalDevelopment(env)||
    !isG678LocalPreviewRequestUrl(url,env)||!isG678LocalPreviewRequestHeaders(headers,env)||
    url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
    headers.get('host')!=='127.0.0.1:3331'||
    (headers.get('x-forwarded-host')!==null&&headers.get('x-forwarded-host')!=='127.0.0.1:3331')||
    (headers.get('x-forwarded-proto')!==null&&headers.get('x-forwarded-proto')!=='http')||
    headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
  const origin=headers.get('origin');
  if(origin!==null&&origin!==ORIGIN)return null;
  if(!p028CandidateReferer(headers.get('referer')))return null;
  for(const [token,row] of Object.entries(P028_RESOURCE_PINS)){
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
