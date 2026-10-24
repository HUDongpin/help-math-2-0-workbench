import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {P025_RESOURCE_PINS} from './alg-l06-p025-local-request-v1';
import {P026_ASSET_ROOT as ROOT,P026_LOCAL_ORIGIN as ORIGIN,
  p026CandidateReferer,p026LocalDevelopment} from './alg-l06-p026-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
  root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
  bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
    originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const inherited=Object.fromEntries(Object.entries(P025_RESOURCE_PINS).map(([token,row])=>{
 const newToken=`p025-${token}`;
 return [newToken,pin(row.originalPath,newToken,row.path,row.root,row.bytes,row.sha256,row.contentType)];
}));

/** Four exact P026 resources and unchanged P025 predecessor URLs. */
export const P026_RESOURCE_PINS=Object.freeze({
 "canvas-renderer.js":pin(`${ROOT}/canvas-renderer.js`,"canvas-renderer.js","output/alg-l06-p026-canvas-v1/canvas-renderer.js",'workspace',1257436,"5f7b9b0cc37cb536113280c5fd35236cc67c9445b9802c86fce354801a742382","text/javascript; charset=utf-8"),
 "main-1":pin(`${ROOT}/main-1`,"main-1","output/alg-l06-p026-audio-extraction-v1/main-1-source-v1.mp3",'workspace',52520,"ef1eac21881278a8ad30a2c17fef520f820940bc0941aea533493c4307b5a670","audio/mpeg"),
 "main-2":pin(`${ROOT}/main-2`,"main-2","output/alg-l06-p026-audio-extraction-v1/main-2-source-v1.mp3",'workspace',80470,"c2ee52ab31a0ada790a4ac8659c0b703e999d830d6bc5c6b734f57d399c0f4dd","audio/mpeg"),
 "optional-spanish-audio-v1":pin(`${ROOT}/optional-spanish-audio-v1`,"optional-spanish-audio-v1","output/alg-l06-p026-audio-extraction-v1/separate-sa-source-v1.mp3",'workspace',120960,"1ef4cbedd255911e0392e26fa5420787f6338dff70c405d4074eb86427003b06","audio/mpeg"),
 ...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P026Resource=keyof typeof P026_RESOURCE_PINS;
export const P026_PREDECESSOR_ORIGINAL_PATHS=Object.freeze(Object.values(P026_RESOURCE_PINS)
  .filter(row=>row.originalPath!==row.bridgePath).map(row=>row.originalPath));
export const p026ResourceUrl=(resource:P026Resource)=>{
  const row=P026_RESOURCE_PINS[resource];
  if(!row)throw Error('P026_RESOURCE_UNKNOWN');
  return `${row.originalPath}?sha256=${row.sha256}`;
};
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};
/** Both original URLs and internal rewrite paths require the same exact pin. */
export function p026ResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):P026Resource|null{
  const {method,url,headers}=request;
  if(!p026LocalDevelopment(env)||
    !isG678LocalPreviewRequestUrl(url,env)||!isG678LocalPreviewRequestHeaders(headers,env)||
    url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
    headers.get('host')!=='127.0.0.1:3331'||
    (headers.get('x-forwarded-host')!==null&&headers.get('x-forwarded-host')!=='127.0.0.1:3331')||
    (headers.get('x-forwarded-proto')!==null&&headers.get('x-forwarded-proto')!=='http')||
    headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
  const origin=headers.get('origin');
  if(origin!==null&&origin!==ORIGIN)return null;
  if(!p026CandidateReferer(headers.get('referer')))return null;
  for(const [token,row] of Object.entries(P026_RESOURCE_PINS)){
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
