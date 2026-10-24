import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
 type G678PreviewEnvironment} from './g678-preview-policy';
import {P056_RESOURCE_PINS} from './alg-l06-p056-local-request-v1';
import {P057_MEASURED_BINDINGS,type P057AudioDomain}
 from '../../../packages/demos/src/alg-l06-p057-measured-bindings-v1';
import {P057_ASSET_ROOT as ROOT,P057_LOCAL_ORIGIN as ORIGIN,
 p057CandidateReferer,p057LocalDevelopment} from './alg-l06-p057-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
 root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
 bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
 originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const inherited=Object.fromEntries(Object.entries(P056_RESOURCE_PINS).map(([token,row])=>{
 const bridge=`p056-${token}`;
 return [bridge,pin(row.originalPath,bridge,row.path,row.root,row.bytes,
  row.sha256,row.contentType)];
}));
const streamFiles:Readonly<Record<P057AudioDomain,string>>=Object.freeze({main:'assets/source-stream-312.mp3',sa:'source-v1/L6TS08.mp3',...Object.fromEntries([52,77,93,105,117,129,157].map(id=>[String(id),'assets/source-stream-'+id+(id===105?'.wav':'.mp3')]))}) as Record<P057AudioDomain,string>;
const ownAudio=Object.fromEntries((Object.keys(streamFiles) as P057AudioDomain[])
 .map(id=>{
  const token=id==='main'?'main-source-v1':id==='sa'?
   'optional-spanish-audio-v1':`feedback-${id}-source-v1`;
  const binding=P057_MEASURED_BINDINGS[id];
  return [token,pin(`${ROOT}/${token}`,token,
   `migrations/shared-alg001-l06-p057/${streamFiles[id]}`,
   'workspace',binding.sourceBytes,binding.sourceSha256,id==='105'?'audio/wav':'audio/mpeg')];
 }));

/** Ten P057 source resources plus exact inherited P056 dependencies. */
export const P057_RESOURCE_PINS=Object.freeze({
 'canvas-renderer.js':pin(`${ROOT}/canvas-renderer.js`,'canvas-renderer.js',
  'migrations/shared-alg001-l06-p057/canvas-v1/canvas-renderer-draft.js',
  'workspace',11006951,
  'b2d839c31d4907b168e45a2607896f714731b88943d3cb93b10b11528634b401',
  'text/javascript; charset=utf-8'),
 ...ownAudio,...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P057Resource=keyof typeof P057_RESOURCE_PINS;
type SourceRequest={readonly method:string;readonly url:URL;
 readonly headers:Pick<Headers,'get'>};
/** Exact source URL, SHA, referer and fetch mode for the P057 document. */
export function p057ResourceForRequest(request:SourceRequest,
 env:G678PreviewEnvironment=process.env):P057Resource|null{
 const {method,url,headers}=request;
 if(!p057LocalDevelopment(env)||!isG678LocalPreviewRequestUrl(url,env)||
  !isG678LocalPreviewRequestHeaders(headers,env)||
  url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
  headers.get('host')!=='127.0.0.1:3331'||
  ![null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))||
  ![null,'http'].includes(headers.get('x-forwarded-proto'))||
  headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
 const origin=headers.get('origin');
 if(origin!==null&&origin!==ORIGIN)return null;
 if(!p057CandidateReferer(headers.get('referer')))return null;
 for(const [token,row] of Object.entries(P057_RESOURCE_PINS)){
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
