import{p003AssetResponse}from'@/lib/alg-l07-p003-asset-response-v1.server';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{resource:string}>}){return p003AssetResponse(request,'GET',(await params).resource,'candidate');}
export async function HEAD(request:Request,{params}:{params:Promise<{resource:string}>}){return p003AssetResponse(request,'HEAD',(await params).resource,'candidate');}
