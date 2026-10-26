import {notFound} from 'next/navigation';
import {p034ResourceForRequest,P034_RESOURCE_PINS,type P034Resource}
 from '@/lib/alg-l06-p034-local-request-v1';
import {p034DocumentKindFromReferer} from '@/lib/alg-l06-p034-preview-policy-v1';

const load=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
 :import('@/lib/alg-l06-p034-resources-v1.server');
export const dynamic='force-dynamic';

async function responseFor(request:Request,method:'GET'|'HEAD',
 {params}:{params:Promise<{resource:string}>}){
 const token=p034ResourceForRequest({method:request.method,url:new URL(request.url),
  headers:request.headers});
 const mode=p034DocumentKindFromReferer(request.headers.get('referer'));
 const {resource}=await params;
 if(request.method!==method||token===null||mode===null||token!==resource||
  !Object.hasOwn(P034_RESOURCE_PINS,token))notFound();
 const row=P034_RESOURCE_PINS[token];
 let bytes:Buffer;
 try{
  const source=await load();if(!source)notFound();
  bytes=await source.readP034Resource(token as P034Resource,mode);
 }catch{notFound();}
 if(bytes.length!==row.bytes)notFound();
 return new Response(method==='HEAD'?null:new Uint8Array(bytes),{headers:{
  'Content-Type':row.contentType,'Content-Length':String(bytes.length),
  'Cache-Control':'private, no-store, max-age=0',
  'Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff',
  'X-Helpmath-G678-Asset':`p034-${mode}-local-only`,
  'X-Robots-Tag':'noindex, nofollow, noarchive, noimageindex',
  Vary:'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
 }});
}
export const GET=(request:Request,context:{params:Promise<{resource:string}>})=>
 responseFor(request,'GET',context);
export const HEAD=(request:Request,context:{params:Promise<{resource:string}>})=>
 responseFor(request,'HEAD',context);
