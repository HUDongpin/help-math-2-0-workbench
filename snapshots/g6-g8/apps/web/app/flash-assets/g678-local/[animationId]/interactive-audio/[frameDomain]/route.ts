import{isDatL05SourceAudioRequest,DAT_L05_SOURCE_AUDIO_ID}from'@/lib/dat-l05-source-audio-access';
import{notFound}from'next/navigation';
import{isNmsL11SourceAudioRequest,NMS_L11_SOURCE_AUDIO_ID}from'@/lib/nms-l11-source-audio-access';
import{readBoundG678LocalRuntimeAsset}from'@/lib/g678-local-runtime-asset.server';
import{getWorkspaceRoot}from'@/lib/catalog';
import{g678PartialCalibrationSnapshot}from'@/lib/g678-calibration-product-bridge.server';
import{readNmsL11SourceAudio,readDatL05SourceAudio}from'@/lib/g678-frozen16-thirteen-source-audio-v2-authority.server';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{animationId:string;frameDomain:string}>}){
 const url=new URL(request.url),{animationId,frameDomain}=await params;
 const nms=animationId===NMS_L11_SOURCE_AUDIO_ID&&isNmsL11SourceAudioRequest({method:request.method,url,headers:request.headers}),dat=animationId===DAT_L05_SOURCE_AUDIO_ID&&isDatL05SourceAudioRequest({method:request.method,url,headers:request.headers});if(!nms&&!dat)notFound();
 const snapshot=g678PartialCalibrationSnapshot();if(snapshot.status!=='ready')notFound();const root=getWorkspaceRoot(),pin=dat?readDatL05SourceAudio(root,frameDomain):readNmsL11SourceAudio(root,frameDomain),query=[...url.searchParams.entries()];
 if(query.length!==1||query[0]?.[0]!=='sha256'||query[0]?.[1]!==pin.sha256)notFound();
 const source=await readBoundG678LocalRuntimeAsset({workspaceRoot:root,binding:{...pin,animationId,url:url.pathname}});if(!source)notFound();
 return new Response(new Uint8Array(source.bytes),{headers:{'Content-Type':'audio/mpeg','Content-Length':String(source.bytes.length),'Cache-Control':'private, no-store, max-age=0','Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, noarchive','Vary':'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest'}});
}
