import{l7CurrentAssetResponse}from'@/lib/alg-l07-current-asset-response-v1.server';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{resource:string}>}){return l7CurrentAssetResponse(request,'GET',(await params).resource,'candidate');}
export async function HEAD(request:Request,{params}:{params:Promise<{resource:string}>}){return l7CurrentAssetResponse(request,'HEAD',(await params).resource,'candidate');}
