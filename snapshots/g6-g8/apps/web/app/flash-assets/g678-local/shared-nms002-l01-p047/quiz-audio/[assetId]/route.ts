import {notFound} from 'next/navigation';
import {isP047AudioRequest} from '@/lib/nms-l01-p047-audio-access';
import {readNmsL1P047Audio} from '@/lib/g678-nms-l01-p047.server';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{assetId:string}>}){
 const url=new URL(request.url);if(!isP047AudioRequest({method:request.method,url,headers:request.headers}))notFound();
 const {assetId}=await params;let source;
 try{source=readNmsL1P047Audio(assetId,url.searchParams.get('sha256')!);}catch{notFound();}
 return new Response(new Uint8Array(source.bytes),{headers:{'Content-Type':'audio/mpeg','Content-Length':String(source.bytes.length),
  'Cache-Control':'private, no-store, max-age=0','Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff',
  'X-Robots-Tag':'noindex, nofollow, noarchive','Vary':'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest'}});
}
