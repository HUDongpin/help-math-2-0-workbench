import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
 type G678PreviewEnvironment} from './g678-preview-policy';
import {P048_RESOURCE_PINS} from './alg-l06-p048-local-request-v1';
import {P049_MEASURED_BINDINGS,type P049AudioDomain}
 from '../../../packages/demos/src/alg-l06-p049-measured-bindings-v1';
import {P049_ASSET_ROOT as ROOT,P049_LOCAL_ORIGIN as ORIGIN,
 p049CandidateReferer,p049LocalDevelopment} from './alg-l06-p049-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
 root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
 bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
 originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const inherited=Object.fromEntries(Object.entries(P048_RESOURCE_PINS).map(([token,row])=>{
 const bridge=`p048-${token}`;
 return [bridge,pin(row.originalPath,bridge,row.path,row.root,row.bytes,
  row.sha256,row.contentType)];
}));
const streamFiles:Readonly<Record<P049AudioDomain,string>>=Object.freeze({
 main:'assets/source-stream-327-main.mp3',
 wrong4:'assets/source-stream-302-wrong4.mp3',
 right4:'assets/source-stream-192-right4.wav',
 sa:'source-v1/L6TI09.mp3',
});
const ownAudio=Object.fromEntries((Object.keys(streamFiles) as P049AudioDomain[])
 .map(id=>{
  const token=id==='main'?'main-source-v1':id==='sa'?
   'optional-spanish-audio-v1':`feedback-${id}-source-v1`;
  const binding=P049_MEASURED_BINDINGS[id];
  return [token,pin(`${ROOT}/${token}`,token,
   `migrations/shared-alg001-l06-p049/${streamFiles[id]}`,
   'workspace',binding.sourceBytes,binding.sourceSha256,id==='right4'?'audio/wav':'audio/mpeg')];
 }));

/** Five P049 source resources plus exact inherited P048 dependencies. */
export const P049_RESOURCE_PINS=Object.freeze({
 'canvas-renderer.js':pin(`${ROOT}/canvas-renderer.js`,'canvas-renderer.js',
  'migrations/shared-alg001-l06-p049/canvas-v2/canvas-renderer-draft.js',
  'workspace',2324462,
  '298611af1cccf27353df77f9b4d7b4fdbebe7992e1d0950c974dba83a85fc3d3',
  'text/javascript; charset=utf-8'),
 ...ownAudio,...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P049Resource=keyof typeof P049_RESOURCE_PINS;
type SourceRequest={readonly method:string;readonly url:URL;
 readonly headers:Pick<Headers,'get'>};
/** Exact source URL, SHA, referer and fetch mode for the P049 document. */
export function p049ResourceForRequest(request:SourceRequest,
 env:G678PreviewEnvironment=process.env):P049Resource|null{
 const {method,url,headers}=request;
 if(!p049LocalDevelopment(env)||!isG678LocalPreviewRequestUrl(url,env)||
  !isG678LocalPreviewRequestHeaders(headers,env)||
  url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
  headers.get('host')!=='127.0.0.1:3331'||
  ![null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))||
  ![null,'http'].includes(headers.get('x-forwarded-proto'))||
  headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
 const origin=headers.get('origin');
 if(origin!==null&&origin!==ORIGIN)return null;
 if(!p049CandidateReferer(headers.get('referer')))return null;
 for(const [token,row] of Object.entries(P049_RESOURCE_PINS)){
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
