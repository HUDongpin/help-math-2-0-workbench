import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
 type G678PreviewEnvironment} from './g678-preview-policy';
import {P041_RESOURCE_PINS} from './alg-l06-p041-local-request-v1';
import {P042_MEASURED_BINDINGS,type P042MeasuredDomainId}
 from '../../../packages/demos/src/alg-l06-p042-measured-bindings-v1';
import {P042_ASSET_ROOT as ROOT,P042_LOCAL_ORIGIN as ORIGIN,
 p042CandidateReferer,p042LocalDevelopment} from './alg-l06-p042-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
 root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
 bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
 originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const streamFiles:Readonly<Record<P042MeasuredDomainId,string>>=Object.freeze({
 main:'streams/sprite-341-main.mp3',
 wrong4:'streams/sprite-292-wrong-feedback-4.mp3',
 right4:'streams/sprite-239-right-feedback-4.mp3',
 sa:'separate-sa-source-v1.mp3',
});
const ownAudio=Object.fromEntries((Object.keys(streamFiles) as P042MeasuredDomainId[])
 .map(id=>{
  const token=id==='main'?'main-source-v1':id==='sa'?
   'optional-spanish-audio-v1':`feedback-${id}-source-v1`;
  const binding=P042_MEASURED_BINDINGS[id];
  return [token,pin(`${ROOT}/${token}`,token,
   `migrations/shared-alg001-l06-p042/audio-source-v1/${streamFiles[id]}`,
   'workspace',binding.sourceBytes,binding.sourceSha256,'audio/mpeg')];
 }));
const inherited=Object.fromEntries(Object.entries(P041_RESOURCE_PINS).map(([token,row])=>{
 const bridge=`p041-${token}`;
 return [bridge,pin(row.originalPath,bridge,row.path,row.root,row.bytes,
  row.sha256,row.contentType)];
}));

/** Five exact P042 resources plus inherited P041/P038 host dependencies. */
export const P042_RESOURCE_PINS=Object.freeze({
 'canvas-renderer.js':pin(`${ROOT}/canvas-renderer.js`,'canvas-renderer.js',
  'migrations/shared-alg001-l06-p042/canvas-v1/canvas-renderer.js',
  'workspace',3403156,
  '8eebb94446a095f5219bc5b3b46f740179d92e8ee6260a6a5cfa2d9d34fae8f4',
  'text/javascript; charset=utf-8'),
 ...ownAudio,...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P042Resource=keyof typeof P042_RESOURCE_PINS;
export const P042_PREDECESSOR_ORIGINAL_PATHS=Object.freeze(Object.values(P042_RESOURCE_PINS)
 .filter(row=>row.originalPath!==row.bridgePath).map(row=>row.originalPath));
export function p042ResourceUrl(resource:P042Resource){
 const row=P042_RESOURCE_PINS[resource];
 if(!row)throw Error('P042_RESOURCE_UNKNOWN');
 return `${row.originalPath}?sha256=${row.sha256}`;
}
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};
/** Both original URLs and the internal bridge require an exact hash and caller. */
export function p042ResourceForRequest(request:SourceRequest,
 env:G678PreviewEnvironment=process.env):P042Resource|null{
 const {method,url,headers}=request;
 if(!p042LocalDevelopment(env)||!isG678LocalPreviewRequestUrl(url,env)||
  !isG678LocalPreviewRequestHeaders(headers,env)||
  url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
  headers.get('host')!=='127.0.0.1:3331'||
  ![null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))||
  ![null,'http'].includes(headers.get('x-forwarded-proto'))||
  headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
 const origin=headers.get('origin');
 if(origin!==null&&origin!==ORIGIN)return null;
 if(!p042CandidateReferer(headers.get('referer')))return null;
 for(const [token,row] of Object.entries(P042_RESOURCE_PINS)){
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
