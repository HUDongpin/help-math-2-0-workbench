import {createHash} from 'node:crypto';
import {lstat,readFile,realpath} from 'node:fs/promises';
import path from 'node:path';
import {controlledPreviewRequestAllowed} from '@/lib/controlled-current-js-preview';
import {FQ002_AUDIO_ASSETS} from '../../../../../../../../../packages/demos/src/modern-lessons/generated/g4-l3-fq002-audio';
// Match the existing flash-asset route's bounded single-range policy. The
// G4 L12 helper is coupled to its unrelated private calibration asset catalog.
function resolveByteRange(header:string|null,length:number):{start:number;end:number}|null|'unsatisfiable' {
 if(header===null)return null;
 const match=/^bytes=(\d*)-(\d*)$/u.exec(header);
 if(!match||(!match[1]&&!match[2])||length<1)return 'unsatisfiable';
 if(!match[1]){
  const suffix=Number(match[2]);
  if(!Number.isSafeInteger(suffix)||suffix<1)return 'unsatisfiable';
  return {start:Math.max(0,length-suffix),end:length-1};
 }
 const start=Number(match[1]),end=match[2]?Number(match[2]):length-1;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=length||end<start)return 'unsatisfiable';
 return {start,end:Math.min(end,length-1)};
}

export async function GET(request:Request,{params}:{params:Promise<{language:string;file:string}>}) {
 const denied=()=>new Response(null,{status:404,headers:{'Cache-Control':'no-store'}});
 const url=new URL(request.url);
 if(!controlledPreviewRequestAllowed(url,request.headers.get('host')))return denied();
 const {language,file}=await params;
 const asset=FQ002_AUDIO_ASSETS.find(a=>new URL(a.source,'http://local').pathname===`/flash-assets/courses/course-g04-l03-fq-002/audio/${language}/${file}`);
 if(!asset||url.searchParams.getAll('sha256').length!==1||url.searchParams.get('sha256')!==asset.sha256)return denied();
 // Next and its standalone server run from the web application directory.
 // Keep tracing bounded to this private asset root, not arbitrary workspace roots
 // that also contain preserved standalone build copies.
 const root=path.join(process.cwd(),'preview-audio-assets/fq002-v1');
 const target=path.resolve(root,language,file);
 try{
  const realRoot=await realpath(root),realTarget=await realpath(target),entry=await lstat(target);
  if(!realTarget.startsWith(realRoot+path.sep)||!entry.isFile()||entry.isSymbolicLink())return denied();
  const bytes=await readFile(realTarget);if(createHash('sha256').update(bytes).digest('hex')!==asset.sha256)return denied();
  // Verify the complete source before serving any byte subset or size metadata.
  const range=resolveByteRange(request.headers.get('range'),bytes.length);
  const headers=new Headers({'Accept-Ranges':'bytes','Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'});
  if(range==='unsatisfiable'){
   headers.set('Content-Range',`bytes */${bytes.length}`);
   return new Response(null,{status:416,headers});
  }
  const body=range?bytes.subarray(range.start,range.end+1):bytes;
  headers.set('Content-Type','audio/mpeg');headers.set('Content-Length',String(body.length));
  if(range)headers.set('Content-Range',`bytes ${range.start}-${range.end}/${bytes.length}`);
  return new Response(new Uint8Array(body),{status:range?206:200,headers});
 }catch{return denied();}
}
