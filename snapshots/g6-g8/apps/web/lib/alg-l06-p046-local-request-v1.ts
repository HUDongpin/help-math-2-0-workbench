import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
 type G678PreviewEnvironment} from './g678-preview-policy';
import {P045_RESOURCE_PINS} from './alg-l06-p045-local-request-v1';
import {P046_MEASURED_BINDINGS,type P046AudioDomain}
 from '../../../packages/demos/src/alg-l06-p046-measured-bindings-v1';
import {P046_ASSET_ROOT as ROOT,P046_LOCAL_ORIGIN as ORIGIN,
 p046CandidateReferer,p046LocalDevelopment} from './alg-l06-p046-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
 root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
 bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
 originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const inherited=Object.fromEntries(Object.entries(P045_RESOURCE_PINS).map(([token,row])=>{
 const bridge=`p045-${token}`;
 return [bridge,pin(row.originalPath,bridge,row.path,row.root,row.bytes,
  row.sha256,row.contentType)];
}));
const streamFiles:Readonly<Record<P046AudioDomain,string>>=Object.freeze({
 main:'assets/source-stream-123-main.mp3',
 wrong:'assets/source-stream-61-wrong.mp3',
 right:'assets/source-stream-63-right.mp3',
 sa:'source-v1/L6TI06.mp3',
});
const ownAudio=Object.fromEntries((Object.keys(streamFiles) as P046AudioDomain[])
 .map(id=>{
  const token=id==='main'?'main-source-v1':id==='sa'?
   'optional-spanish-audio-v1':`feedback-${id}-source-v1`;
  const binding=P046_MEASURED_BINDINGS[id];
  return [token,pin(`${ROOT}/${token}`,token,
   `migrations/shared-alg001-l06-p046/${streamFiles[id]}`,
   'workspace',binding.sourceBytes,binding.sourceSha256,'audio/mpeg')];
 }));

/** Five P046 source resources plus exact inherited P045 dependencies. */
export const P046_RESOURCE_PINS=Object.freeze({
 'canvas-renderer.js':pin(`${ROOT}/canvas-renderer.js`,'canvas-renderer.js',
  'migrations/shared-alg001-l06-p046/canvas-v1/canvas-renderer-draft.js',
  'workspace',2389062,
  '888a3e9f41e236eda7b4d0fe9c04a0aaa38d9e12bdbdbe844cc6d1e12a5272d6',
  'text/javascript; charset=utf-8'),
 ...ownAudio,...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P046Resource=keyof typeof P046_RESOURCE_PINS;
type SourceRequest={readonly method:string;readonly url:URL;
 readonly headers:Pick<Headers,'get'>};
/** Exact source URL, SHA, referer and fetch mode for the P046 document. */
export function p046ResourceForRequest(request:SourceRequest,
 env:G678PreviewEnvironment=process.env):P046Resource|null{
 const {method,url,headers}=request;
 if(!p046LocalDevelopment(env)||!isG678LocalPreviewRequestUrl(url,env)||
  !isG678LocalPreviewRequestHeaders(headers,env)||
  url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
  headers.get('host')!=='127.0.0.1:3331'||
  ![null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))||
  ![null,'http'].includes(headers.get('x-forwarded-proto'))||
  headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
 const origin=headers.get('origin');
 if(origin!==null&&origin!==ORIGIN)return null;
 if(!p046CandidateReferer(headers.get('referer')))return null;
 for(const [token,row] of Object.entries(P046_RESOURCE_PINS)){
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
