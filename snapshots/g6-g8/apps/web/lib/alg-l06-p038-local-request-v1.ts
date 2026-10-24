import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
 type G678PreviewEnvironment} from './g678-preview-policy';
import {P035_RESOURCE_PINS} from './alg-l06-p035-local-request-v1';
import {P038_ASSET_ROOT as ROOT,P038_LOCAL_ORIGIN as ORIGIN,
 p038CandidateReferer,p038LocalDevelopment} from './alg-l06-p038-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
 root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
 bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
 originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const inherited=Object.fromEntries(Object.entries(P035_RESOURCE_PINS).map(([token,row])=>{
 const newToken=`p035-${token}`;
 return [newToken,pin(row.originalPath,newToken,row.path,row.root,row.bytes,
  row.sha256,row.contentType)];
}));

/** Three P038 source resources and unchanged P035-host predecessor pins. */
export const P038_RESOURCE_PINS=Object.freeze({
 'canvas-renderer.js':pin(`${ROOT}/canvas-renderer.js`,'canvas-renderer.js',
  'migrations/shared-alg001-l06-p038/canvas-v1/canvas-renderer.js','workspace',
  5569990,'80c0b1f6225d60eee27bc9d99ab16040d23b794f3364873be455e2a68524fcfa',
  'text/javascript; charset=utf-8'),
 'main-source-v1':pin(`${ROOT}/main-source-v1`,'main-source-v1',
  'migrations/shared-alg001-l06-p038/audio-source-v1/main-source-v1.mp3','workspace',
  154960,'524ae7aa2cc1cb5f85bfe076b785a92c4d29470afdc813e577d93335408ff6fa',
  'audio/mpeg'),
 'optional-spanish-audio-v1':pin(`${ROOT}/optional-spanish-audio-v1`,
  'optional-spanish-audio-v1',
  'migrations/shared-alg001-l06-p038/audio-source-v1/separate-sa-source-v1.mp3',
  'workspace',152544,
  '86aad21a9e9dc50791bdec2ee243dcdbff05302b2f75c23564c3305ef3650fea',
  'audio/mpeg'),
 ...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P038Resource=keyof typeof P038_RESOURCE_PINS;
export const P038_PREDECESSOR_ORIGINAL_PATHS=Object.freeze(Object.values(P038_RESOURCE_PINS)
 .filter(row=>row.originalPath!==row.bridgePath).map(row=>row.originalPath));
export const p038ResourceUrl=(resource:P038Resource)=>{
 const row=P038_RESOURCE_PINS[resource];
 if(!row)throw Error('P038_RESOURCE_UNKNOWN');
 return `${row.originalPath}?sha256=${row.sha256}`;
};
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};
/** Original URLs and the internal bridge require the same exact hash and caller. */
export function p038ResourceForRequest(request:SourceRequest,
 env:G678PreviewEnvironment=process.env):P038Resource|null{
 const {method,url,headers}=request;
 if(!p038LocalDevelopment(env)||
   !isG678LocalPreviewRequestUrl(url,env)||
   !isG678LocalPreviewRequestHeaders(headers,env)||
   url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
   headers.get('host')!=='127.0.0.1:3331'||
   ![null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))||
   ![null,'http'].includes(headers.get('x-forwarded-proto'))||
   headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
 const origin=headers.get('origin');
 if(origin!==null&&origin!==ORIGIN)return null;
 if(!p038CandidateReferer(headers.get('referer')))return null;
 for(const [token,row] of Object.entries(P038_RESOURCE_PINS)){
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
