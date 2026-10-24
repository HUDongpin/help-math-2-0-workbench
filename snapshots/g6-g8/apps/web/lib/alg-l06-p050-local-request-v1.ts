import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
 type G678PreviewEnvironment} from './g678-preview-policy';
import {P049_RESOURCE_PINS} from './alg-l06-p049-local-request-v1';
import {P050_MEASURED_BINDINGS,type P050AudioDomain}
 from '../../../packages/demos/src/alg-l06-p050-measured-bindings-v1';
import {P050_ASSET_ROOT as ROOT,P050_LOCAL_ORIGIN as ORIGIN,
 p050CandidateReferer,p050LocalDevelopment} from './alg-l06-p050-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
 root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
 bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
 originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const inherited=Object.fromEntries(Object.entries(P049_RESOURCE_PINS).map(([token,row])=>{
 const bridge=`p049-${token}`;
 return [bridge,pin(row.originalPath,bridge,row.path,row.root,row.bytes,
  row.sha256,row.contentType)];
}));
const streamFiles:Readonly<Record<P050AudioDomain,string>>={
  "main": "assets/source-stream-489-main.mp3",
  "wrong": "assets/source-stream-380-wrong.mp3",
  "correct358": "assets/source-stream-358-correct-358.mp3",
  "correct432": "assets/source-stream-432-correct-432.wav",
  "correct479": "assets/source-stream-479-correct-479.mp3",
  "sa": "source-v1/L6GS02.mp3"
};
const ownAudio=Object.fromEntries((Object.keys(streamFiles) as P050AudioDomain[])
 .map(id=>{
  const token=id==='main'?'main-source-v1':id==='sa'?
   'optional-spanish-audio-v1':`feedback-${id}-source-v1`;
  const binding=P050_MEASURED_BINDINGS[id];
  return [token,pin(`${ROOT}/${token}`,token,
   `migrations/shared-alg001-l06-p050/${streamFiles[id]}`,
   'workspace',binding.sourceBytes,binding.sourceSha256,id==='correct432'?'audio/wav':'audio/mpeg')];
 }));

/** Seven P050 source resources plus exact inherited P049 dependencies. */
export const P050_RESOURCE_PINS=Object.freeze({
 'canvas-renderer.js':pin(`${ROOT}/canvas-renderer.js`,'canvas-renderer.js',
  'migrations/shared-alg001-l06-p050/canvas-v1/canvas-renderer-draft.js',
  'workspace',10456890,
  'd384ef32b39c8bd1e013c667653bcb5a643cbe703be6c145b87ce87a752347ff',
  'text/javascript; charset=utf-8'),
 ...ownAudio,...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P050Resource=keyof typeof P050_RESOURCE_PINS;
type SourceRequest={readonly method:string;readonly url:URL;
 readonly headers:Pick<Headers,'get'>};
/** Exact source URL, SHA, referer and fetch mode for the P050 document. */
export function p050ResourceForRequest(request:SourceRequest,
 env:G678PreviewEnvironment=process.env):P050Resource|null{
 const {method,url,headers}=request;
 if(!p050LocalDevelopment(env)||!isG678LocalPreviewRequestUrl(url,env)||
  !isG678LocalPreviewRequestHeaders(headers,env)||
  url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
  headers.get('host')!=='127.0.0.1:3331'||
  ![null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))||
  ![null,'http'].includes(headers.get('x-forwarded-proto'))||
  headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
 const origin=headers.get('origin');
 if(origin!==null&&origin!==ORIGIN)return null;
 if(!p050CandidateReferer(headers.get('referer')))return null;
 for(const [token,row] of Object.entries(P050_RESOURCE_PINS)){
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
