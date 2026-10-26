import {notFound} from 'next/navigation';
import {isNmsL2P024AudioRequest} from '@/lib/nms-l02-p024-audio-access';
import {readNmsL2P024Audio} from '@/lib/g678-nms-l02-p024.server';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{domain:string}>}){const {domain}=await params;if(!isNmsL2P024AudioRequest({method:request.method,url:new URL(request.url),headers:request.headers},domain))notFound();let source;try{source=readNmsL2P024Audio(domain);}catch{notFound();}return new Response(new Uint8Array(source.bytes),{headers:{'Content-Type':source.contentType,'Content-Length':String(source.bytes.length),'Cache-Control':'private, no-store, max-age=0','Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, noarchive','Vary':'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest'}});}
