import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
 type G678PreviewEnvironment} from './g678-preview-policy';
import {P038_RESOURCE_PINS} from './alg-l06-p038-local-request-v1';
import {P041_MEASURED_BINDINGS,type P041MeasuredDomainId}
 from '../../../packages/demos/src/alg-l06-p041-measured-bindings-v1';
import {P041_ASSET_ROOT as ROOT,P041_LOCAL_ORIGIN as ORIGIN,
 p041CandidateReferer,p041LocalDevelopment} from './alg-l06-p041-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
 root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
 bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
 originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const streamFiles:Readonly<Record<P041MeasuredDomainId,string>>=Object.freeze({
 main:'streams/sprite-169-main.mp3',sa:'separate-sa-source-v1.mp3',
 '76':'streams/sprite-76-wrong-1.mp3',
 '91':'streams/sprite-91-wrong-3.mp3',
 '105':'streams/sprite-105-wrong-2.mp3',
 '119':'streams/sprite-119-right-3.mp3',
 '139':'streams/sprite-139-right-2.mp3',
 '152':'streams/sprite-152-right-4.mp3',
 '168':'streams/sprite-168-right-1.mp3',
});
const ownAudio=Object.fromEntries((Object.keys(streamFiles) as P041MeasuredDomainId[])
 .map(id=>{
  const token=id==='main'?'main-source-v1':id==='sa'?
   'optional-spanish-audio-v1':`feedback-${id}-source-v1`;
  const binding=P041_MEASURED_BINDINGS[id];
  return [token,pin(`${ROOT}/${token}`,token,
   `migrations/shared-alg001-l06-p041/audio-source-v1/${streamFiles[id]}`,
   'workspace',binding.sourceBytes,binding.sourceSha256,'audio/mpeg')];
 }));
const inherited=Object.fromEntries(Object.entries(P038_RESOURCE_PINS).map(([token,row])=>{
 const bridge=`p038-${token}`;
 return [bridge,pin(row.originalPath,bridge,row.path,row.root,row.bytes,
  row.sha256,row.contentType)];
}));

/** Ten exact P041 resources plus unchanged P038 candidate host dependencies. */
export const P041_RESOURCE_PINS=Object.freeze({
 'canvas-renderer.js':pin(`${ROOT}/canvas-renderer.js`,'canvas-renderer.js',
  'migrations/shared-alg001-l06-p041/canvas-v1/canvas-renderer.js',
  'workspace',2971805,
  '77cdf78caf76bc825e4c8cbdc5f511dd377da9b289018a53cf1c72c7f3ad5923',
  'text/javascript; charset=utf-8'),
 ...ownAudio,...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P041Resource=keyof typeof P041_RESOURCE_PINS;
export const P041_PREDECESSOR_ORIGINAL_PATHS=Object.freeze(Object.values(P041_RESOURCE_PINS)
 .filter(row=>row.originalPath!==row.bridgePath).map(row=>row.originalPath));
export function p041ResourceUrl(resource:P041Resource){
 const row=P041_RESOURCE_PINS[resource];
 if(!row)throw Error('P041_RESOURCE_UNKNOWN');
 return `${row.originalPath}?sha256=${row.sha256}`;
}
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};
/** Both original URLs and the internal bridge require an exact hash and caller. */
export function p041ResourceForRequest(request:SourceRequest,
 env:G678PreviewEnvironment=process.env):P041Resource|null{
 const {method,url,headers}=request;
 if(!p041LocalDevelopment(env)||!isG678LocalPreviewRequestUrl(url,env)||
  !isG678LocalPreviewRequestHeaders(headers,env)||
  url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
  headers.get('host')!=='127.0.0.1:3331'||
  ![null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))||
  ![null,'http'].includes(headers.get('x-forwarded-proto'))||
  headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
 const origin=headers.get('origin');
 if(origin!==null&&origin!==ORIGIN)return null;
 if(!p041CandidateReferer(headers.get('referer')))return null;
 for(const [token,row] of Object.entries(P041_RESOURCE_PINS)){
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
