import{p002AssetResponse}from'@/lib/alg-l07-p002-asset-response-v1.server';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{resource:string}>}){return p002AssetResponse(request,'GET',(await params).resource,'registered');}
export async function HEAD(request:Request,{params}:{params:Promise<{resource:string}>}){return p002AssetResponse(request,'HEAD',(await params).resource,'registered');}
