import {notFound} from 'next/navigation';
import {isContinuousSourceAudioRequest} from '@/lib/continuous-source-audio-access';
import {readBoundG678LocalRuntimeAsset} from '@/lib/g678-local-runtime-asset.server';
import {getWorkspaceRoot} from '@/lib/catalog';
import {g678PartialCalibrationSnapshot} from '@/lib/g678-calibration-product-bridge.server';
import {readContinuousAudioCandidate} from '@/lib/g678-frozen16-thirteen-source-audio-v2-authority.server';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{animationId:string}>}){
  const url=new URL(request.url),{animationId}=await params;
  if(!isContinuousSourceAudioRequest({url,headers:request.headers}))notFound();
  const snapshot=g678PartialCalibrationSnapshot();if(snapshot.status!=='ready')notFound();
  const root=getWorkspaceRoot(),candidate=readContinuousAudioCandidate(root,animationId),pin=candidate.sourceAsset;
  const query=[...url.searchParams.entries()];if(query.length!==1||query[0]?.[0]!=='sha256'||query[0]?.[1]!==pin.sha256)notFound();
  const source=await readBoundG678LocalRuntimeAsset({workspaceRoot:root,binding:{...pin,animationId,url:url.pathname}});if(!source)notFound();
  return new Response(new Uint8Array(source.bytes),{headers:{'Content-Type':'audio/mpeg','Content-Length':String(source.bytes.length),
    'Cache-Control':'private, no-store, max-age=0','Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff',
    'X-Robots-Tag':'noindex, nofollow, noarchive','Vary':'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest'}});
}
