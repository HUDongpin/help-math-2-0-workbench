import {createHash} from 'node:crypto';
import {constants,closeSync,fstatSync,lstatSync,openSync,readFileSync,realpathSync} from 'node:fs';
import {join,resolve,sep} from 'node:path';
import {P052_AUDIO_PLANS,P052_AUDIO_SOURCE_SHA256} from '../../../packages/demos/src/generated/nms-l02-p052-runtime-audio-v1';
export const P052_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
/** Source identity and byte validation, independent of route admission. No cache. */
export function readP052CandidateAudio(workspaceRoot:string,sourceRoot:string,domain:string){
 if(!Object.hasOwn(P052_AUDIO_PLANS,domain))throw Error('P052_AUDIO_DOMAIN');
 function exact(root:string,relative:string,size:number,hash:string){
  const base=resolve(root),rootStat=lstatSync(base);
  if(!rootStat.isDirectory()||rootStat.isSymbolicLink()||realpathSync(base)!==base)throw Error('P052_SOURCE_ROOT');
  let current=base;for(const part of relative.split('/')){current=join(current,part);if(lstatSync(current).isSymbolicLink())throw Error('P052_SOURCE_SYMLINK');}
  const file=join(base,relative);if(realpathSync(file)!==file||!file.startsWith(base+sep))throw Error('P052_SOURCE_ESCAPE');
  const fd=openSync(file,constants.O_RDONLY|constants.O_NOFOLLOW);
  try{
   const stat=fstatSync(fd);if(!stat.isFile()||stat.size!==size)throw Error('P052_SOURCE_SIZE');
   const bytes=readFileSync(fd);
   if(bytes.length!==size||createHash('sha256').update(bytes).digest('hex')!==hash)throw Error('P052_SOURCE_HASH');
   return bytes;
  }finally{closeSync(fd);}
 }
 exact(sourceRoot,'G6-G8-shared/NMS002/L2/TI/L2TI11.swf',106791,P052_AUDIO_SOURCE_SHA256);
 exact(workspaceRoot,'migrations/shared-nms002-l02-p052/audit/preserved-source-v1.swf',106791,P052_AUDIO_SOURCE_SHA256);
 const plan=P052_AUDIO_PLANS[domain as keyof typeof P052_AUDIO_PLANS];
 return exact(workspaceRoot,`migrations/shared-nms002-l02-p052/audit/${domain}-source-stream-v1.mp3`,plan.inputBytes,plan.inputSha256);
}
