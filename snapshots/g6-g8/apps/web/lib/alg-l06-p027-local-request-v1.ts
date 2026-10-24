import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {P026_RESOURCE_PINS} from './alg-l06-p026-local-request-v1';
import {P027_ASSET_ROOT as ROOT,P027_LOCAL_ORIGIN as ORIGIN,
  p027CandidateReferer,p027LocalDevelopment} from './alg-l06-p027-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
  root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
  bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
    originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const inherited=Object.fromEntries(Object.entries(P026_RESOURCE_PINS).map(([token,row])=>{
 const newToken=`p026-${token}`;
 return [newToken,pin(row.originalPath,newToken,row.path,row.root,row.bytes,row.sha256,row.contentType)];
}));

/** Three exact P027 resources and unchanged P026 predecessor URLs. */
export const P027_RESOURCE_PINS=Object.freeze({
 "canvas-renderer.js":pin(`${ROOT}/canvas-renderer.js`,"canvas-renderer.js","output/alg-l06-p027-canvas-v1/canvas-renderer.js",'workspace',4452771,"15aa87b51cf12834708b46290e95efa2a7f55e08f48d1d90010dcb32045fcb90","text/javascript; charset=utf-8"),
 "main-source-v1":pin(`${ROOT}/main-source-v1`,"main-source-v1","output/alg-l06-p027-audio-extraction-v1/main-source-v1.mp3",'workspace',318760,"8b2d1bf09c88647b4799108ad85ff563e744cc899226d1bb1b07ee1cc5551929","audio/mpeg"),
 "optional-spanish-audio-v1":pin(`${ROOT}/optional-spanish-audio-v1`,"optional-spanish-audio-v1","output/alg-l06-p027-audio-extraction-v1/separate-sa-source-v1.mp3",'workspace',381360,"445005ae7c0a6f4896c686ad46c35e56847e4e977b991d5aa40add7a5e271cc0","audio/mpeg"),
 ...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P027Resource=keyof typeof P027_RESOURCE_PINS;
export const P027_PREDECESSOR_ORIGINAL_PATHS=Object.freeze(Object.values(P027_RESOURCE_PINS)
  .filter(row=>row.originalPath!==row.bridgePath).map(row=>row.originalPath));
export const p027ResourceUrl=(resource:P027Resource)=>{
  const row=P027_RESOURCE_PINS[resource];
  if(!row)throw Error('P027_RESOURCE_UNKNOWN');
  return `${row.originalPath}?sha256=${row.sha256}`;
};
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};
/** Both original URLs and internal rewrite paths require the same exact pin. */
export function p027ResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):P027Resource|null{
  const {method,url,headers}=request;
  if(!p027LocalDevelopment(env)||
    !isG678LocalPreviewRequestUrl(url,env)||!isG678LocalPreviewRequestHeaders(headers,env)||
    url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
    headers.get('host')!=='127.0.0.1:3331'||
    (headers.get('x-forwarded-host')!==null&&headers.get('x-forwarded-host')!=='127.0.0.1:3331')||
    (headers.get('x-forwarded-proto')!==null&&headers.get('x-forwarded-proto')!=='http')||
    headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
  const origin=headers.get('origin');
  if(origin!==null&&origin!==ORIGIN)return null;
  if(!p027CandidateReferer(headers.get('referer')))return null;
  for(const [token,row] of Object.entries(P027_RESOURCE_PINS)){
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
