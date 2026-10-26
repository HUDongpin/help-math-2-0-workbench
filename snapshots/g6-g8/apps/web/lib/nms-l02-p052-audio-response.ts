import type {G678PreviewEnvironment} from './g678-preview-policy';
import {isP052AudioRequest} from './nms-l02-p052-audio-access';
import {P052_SOURCE_ROOT,readP052CandidateAudio} from './nms-l02-p052-source-bytes';
const headers={'Cache-Control':'private, no-store, max-age=0','Cross-Origin-Resource-Policy':'same-origin',
 'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, noarchive',
 'Vary':'Host, Referer, Origin, Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest'};
/** Checks admission before resolving workspace or reading any private file. */
export function p052AudioResponse(request:Request,domain:string,workspaceRoot:()=>string,
 env:G678PreviewEnvironment=process.env):Response{
 const denied=()=>new Response(null,{status:404,headers});
 if(!isP052AudioRequest({method:request.method,url:new URL(request.url),headers:request.headers},domain,env)
  ||env.HELP_MATH_G678_SOURCE_ROOT!==P052_SOURCE_ROOT)return denied();
 try{
  const bytes=readP052CandidateAudio(workspaceRoot(),P052_SOURCE_ROOT,domain);
  return new Response(new Uint8Array(bytes),{headers:{...headers,'Content-Type':'audio/mpeg','Content-Length':String(bytes.length)}});
 }catch{return denied();}
}
