import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {P019_RESOURCE_PINS} from './alg-l06-p019-local-request-v1';
import {P020_ASSET_ROOT as ROOT,P020_LOCAL_ORIGIN as ORIGIN,
  p020CandidateReferer,p020LocalDevelopment} from './alg-l06-p020-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
  root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
  bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
    originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const previousOwnTokens=new Set(['canvas-renderer.js','main-1','optional-spanish-audio-v1']);
const inherited=Object.fromEntries(Object.entries(P019_RESOURCE_PINS).map(([token,row])=>{
 const newToken=previousOwnTokens.has(token)?`p019-${token}`:token;
 return [newToken,pin(row.originalPath,newToken,row.path,row.root,row.bytes,row.sha256,row.contentType)];
}));

/** Ten P020 source assets and all 63 formally registered predecessor assets. */
export const P020_RESOURCE_PINS=Object.freeze({
 'canvas-renderer.js':pin(`${ROOT}/canvas-renderer.js`,'canvas-renderer.js','output/alg-l06-p020-canvas-v1/canvas-renderer.js','workspace',1459184,'24223de75354e7d58dc197bf350ccea41af142b9eac715b28e449876f7548331','text/javascript; charset=utf-8'),
 'main-1':pin(`${ROOT}/main-1`,'main-1','output/alg-l06-p020-audio-v1/sprite-162-source-v1.mp3','workspace',70850,'fedf4b38d47116379c961728cc7088481bef08a11eb1e739c39b86365e8a8dd3','audio/mpeg'),
 'feedback-right-1':pin(`${ROOT}/feedback-right-1`,'feedback-right-1','output/alg-l06-p020-audio-v1/sprite-157-source-v1.mp3','workspace',11050,'3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7','audio/mpeg'),
 'feedback-right-2':pin(`${ROOT}/feedback-right-2`,'feedback-right-2','output/alg-l06-p020-audio-v1/sprite-128-source-v1.mp3','workspace',12740,'c9502f3d979684587046242dc9022b8aa89e89c72688dfa4bc027858badd9e6e','audio/mpeg'),
 'feedback-right-3':pin(`${ROOT}/feedback-right-3`,'feedback-right-3','output/alg-l06-p020-audio-v1/sprite-108-source-v1.mp3','workspace',12350,'7e9810de5390cdc982dac2795e046343157a6ad9fe4a2ab13e1020b401b2ad11','audio/mpeg'),
 'feedback-right-4':pin(`${ROOT}/feedback-right-4`,'feedback-right-4','output/alg-l06-p020-audio-v1/sprite-141-source-v1.mp3','workspace',11570,'ede0affb88cb9c7d0378514ff027a74e843f5f1cbac3f751820392dd9420d9e8','audio/mpeg'),
 'feedback-wrong-1':pin(`${ROOT}/feedback-wrong-1`,'feedback-wrong-1','output/alg-l06-p020-audio-v1/sprite-65-source-v1.mp3','workspace',11050,'1c3e481dcaa018b19c5b24eaa05b11d88e7cb75a640acd8a06133ccf3ff0c7e5','audio/mpeg'),
 'feedback-wrong-2':pin(`${ROOT}/feedback-wrong-2`,'feedback-wrong-2','output/alg-l06-p020-audio-v1/sprite-94-source-v1.mp3','workspace',10270,'1421b1c2ed818b79f66f9d94530176299e8ebfaff946ccbb0e851cec9d72234e','audio/mpeg'),
 'feedback-wrong-3':pin(`${ROOT}/feedback-wrong-3`,'feedback-wrong-3','output/alg-l06-p020-audio-v1/sprite-80-source-v1.mp3','workspace',11050,'3506fcffbe07e726fd4cf1c750cd2641d2aa06f4ca14379b4407ea5843e4f0f0','audio/mpeg'),
 'optional-spanish-audio-v1':pin(`${ROOT}/optional-spanish-audio-v1`,'optional-spanish-audio-v1','output/alg-l06-p020-audio-v1/separate-sa-source-v1.mp3','workspace',66864,'f4ba15d3d1d483da6bb90e46a444196f7d80b910af862d2b03c56f3a1f2618d4','audio/mpeg'),
 ...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P020Resource=keyof typeof P020_RESOURCE_PINS;
export const P020_PREDECESSOR_ORIGINAL_PATHS=Object.freeze(Object.values(P020_RESOURCE_PINS)
 .filter(row=>row.originalPath!==row.bridgePath).map(row=>row.originalPath));
export const p020ResourceUrl=(resource:P020Resource)=>{
 const row=P020_RESOURCE_PINS[resource];
 if(!row)throw Error('P020_RESOURCE_UNKNOWN');
 return `${row.originalPath}?sha256=${row.sha256}`;
};
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};
export function p020ResourceForRequest(request:SourceRequest,
 env:G678PreviewEnvironment=process.env):P020Resource|null{
 const {method,url,headers}=request;
 if(!p020LocalDevelopment(env)||!isG678LocalPreviewRequestUrl(url,env)||
  !isG678LocalPreviewRequestHeaders(headers,env)||
  url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
  headers.get('host')!=='127.0.0.1:3331'||
  (headers.get('x-forwarded-host')!==null&&headers.get('x-forwarded-host')!=='127.0.0.1:3331')||
  (headers.get('x-forwarded-proto')!==null&&headers.get('x-forwarded-proto')!=='http')||
  headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
 const origin=headers.get('origin');
 if(origin!==null&&origin!==ORIGIN)return null;
 if(!p020CandidateReferer(headers.get('referer')))return null;
 for(const [token,row] of Object.entries(P020_RESOURCE_PINS)){
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
