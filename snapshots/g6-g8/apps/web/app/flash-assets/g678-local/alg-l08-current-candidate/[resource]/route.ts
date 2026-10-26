import {notFound} from 'next/navigation';
import {L8_CURRENT_RESOURCE_PINS,l8CurrentResourceForRequest} from '@/lib/alg-l08-current-local-request-v1';
const load=()=>process.env.NODE_ENV==='production'?Promise.resolve(null):import('@/lib/alg-l08-current-resources-v1.server');
export const dynamic='force-dynamic';
async function respond(request:Request,{params}:{params:Promise<{resource:string}>},method:'GET'|'HEAD'){
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||request.method!==method)notFound();
 const url=new URL(request.url);if(url.protocol!=='http:'||url.port!=='3331'||!['127.0.0.1','localhost'].includes(url.hostname))notFound();
 url.hostname='127.0.0.1';
 const token=l8CurrentResourceForRequest({method,url,headers:request.headers},'candidate'),{resource}=await params;
 if(token===null||token!==resource)notFound();let bytes:Buffer;
 try{const source=await load();if(!source)notFound();bytes=await source.readL8CurrentResource(token);}catch{notFound();}
 const pin=L8_CURRENT_RESOURCE_PINS[token]!;if(bytes.length!==pin.bytes)notFound();
 return new Response(method==='HEAD'?null:new Uint8Array(bytes),{headers:{'Content-Type':pin.contentType,'Content-Length':String(bytes.length),'Cache-Control':'private, no-store, max-age=0','Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, noarchive, noimageindex',Vary:'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest'}});
}
export const GET=(request:Request,context:{params:Promise<{resource:string}>})=>respond(request,context,'GET');
export const HEAD=(request:Request,context:{params:Promise<{resource:string}>})=>respond(request,context,'HEAD');
