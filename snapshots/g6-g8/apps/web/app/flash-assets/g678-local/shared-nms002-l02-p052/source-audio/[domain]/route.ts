import {getWorkspaceRoot} from '@/lib/catalog';
import {p052AudioResponse} from '@/lib/nms-l02-p052-audio-response';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request:Request,{params}:{params:Promise<{domain:string}>}){
 const {domain}=await params;return p052AudioResponse(request,domain,getWorkspaceRoot);
}
