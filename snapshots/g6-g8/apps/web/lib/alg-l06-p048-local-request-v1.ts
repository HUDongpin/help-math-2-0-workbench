import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
 type G678PreviewEnvironment} from './g678-preview-policy';
import {P047_RESOURCE_PINS} from './alg-l06-p047-local-request-v1';
import {P048_MEASURED_BINDINGS,type P048AudioDomain}
 from '../../../packages/demos/src/alg-l06-p048-measured-bindings-v1';
import {P048_ASSET_ROOT as ROOT,P048_LOCAL_ORIGIN as ORIGIN,
 p048CandidateReferer,p048LocalDevelopment} from './alg-l06-p048-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
 root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
 bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
 originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const inherited=Object.fromEntries(Object.entries(P047_RESOURCE_PINS).map(([token,row])=>{
 const bridge=`p047-${token}`;
 return [bridge,pin(row.originalPath,bridge,row.path,row.root,row.bytes,
  row.sha256,row.contentType)];
}));
const streamFiles:Readonly<Record<P048AudioDomain,string>>=Object.freeze({
 main:'assets/source-stream-348-main.mp3',
 wrong4:'assets/source-stream-304-wrong4.mp3',
 right4:'assets/source-stream-217-right4.mp3',
 sa:'source-v1/L6TI08.mp3',
});
const ownAudio=Object.fromEntries((Object.keys(streamFiles) as P048AudioDomain[])
 .map(id=>{
  const token=id==='main'?'main-source-v1':id==='sa'?
   'optional-spanish-audio-v1':`feedback-${id}-source-v1`;
  const binding=P048_MEASURED_BINDINGS[id];
  return [token,pin(`${ROOT}/${token}`,token,
   `migrations/shared-alg001-l06-p048/${streamFiles[id]}`,
   'workspace',binding.sourceBytes,binding.sourceSha256,'audio/mpeg')];
 }));

/** Five P048 source resources plus exact inherited P047 dependencies. */
export const P048_RESOURCE_PINS=Object.freeze({
 'canvas-renderer.js':pin(`${ROOT}/canvas-renderer.js`,'canvas-renderer.js',
  'migrations/shared-alg001-l06-p048/canvas-v2/canvas-renderer-draft.js',
  'workspace',3681992,
  'a27fa6d830bab0f90c653e62f89e069c2301b570a7e34e309592bbf552e0733f',
  'text/javascript; charset=utf-8'),
 ...ownAudio,...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P048Resource=keyof typeof P048_RESOURCE_PINS;
type SourceRequest={readonly method:string;readonly url:URL;
 readonly headers:Pick<Headers,'get'>};
/** Exact source URL, SHA, referer and fetch mode for the P048 document. */
export function p048ResourceForRequest(request:SourceRequest,
 env:G678PreviewEnvironment=process.env):P048Resource|null{
 const {method,url,headers}=request;
 if(!p048LocalDevelopment(env)||!isG678LocalPreviewRequestUrl(url,env)||
  !isG678LocalPreviewRequestHeaders(headers,env)||
  url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
  headers.get('host')!=='127.0.0.1:3331'||
  ![null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))||
  ![null,'http'].includes(headers.get('x-forwarded-proto'))||
  headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
 const origin=headers.get('origin');
 if(origin!==null&&origin!==ORIGIN)return null;
 if(!p048CandidateReferer(headers.get('referer')))return null;
 for(const [token,row] of Object.entries(P048_RESOURCE_PINS)){
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
