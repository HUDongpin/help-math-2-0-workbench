import {createHash} from 'node:crypto';
import {lstatSync,readFileSync,realpathSync} from 'node:fs';
import {join,resolve,sep} from 'node:path';
import {P051_AUDIO_PLANS} from '../../../packages/demos/src/generated/nms-l02-p051-audio-plan-v1';
import {P051_SOURCE_SHA256} from '../../../packages/demos/src/nms-l02-p051-frame-v1';
const SOURCE='G6-G8-shared/NMS002/L2/TI/L2TI10.swf';
/** Exact local bytes only. Route exposure additionally requires the frozen registration gate. */
export function readP051CandidateAudio(workspaceRoot:string,sourceRoot:string,domain:string){
 if(!Object.hasOwn(P051_AUDIO_PLANS,domain))throw Error('P051_AUDIO_DOMAIN');
 const readExact=(root:string,relative:string,size:number,sha256:string)=>{
  const base=resolve(root);if(!lstatSync(base).isDirectory()||lstatSync(base).isSymbolicLink()||realpathSync(base)!==base)throw Error('P051_SOURCE_ROOT');
  const file=join(base,relative);let current=base;
  for(const segment of relative.split('/')){current=join(current,segment);if(lstatSync(current).isSymbolicLink())throw Error('P051_SOURCE_SYMLINK');}
  if(!realpathSync(file).startsWith(base+sep))throw Error('P051_SOURCE_ESCAPE');
  const stat=lstatSync(file);if(!stat.isFile()||stat.size!==size)throw Error('P051_SOURCE_SIZE');
  const bytes=readFileSync(file);if(bytes.length!==size||createHash('sha256').update(bytes).digest('hex')!==sha256)throw Error('P051_SOURCE_HASH');return bytes;
 };
 readExact(sourceRoot,SOURCE,861848,P051_SOURCE_SHA256);
 readExact(workspaceRoot,'migrations/shared-nms002-l02-p051/audit/source-input.swf',861848,P051_SOURCE_SHA256);
 const plan=P051_AUDIO_PLANS[domain as keyof typeof P051_AUDIO_PLANS];
 const bytes=readExact(workspaceRoot,`migrations/shared-nms002-l02-p051/audit/sprite-${domain}-source-stream-v1.mp3`,plan.inputBytes,plan.inputSha256);
 return {bytes,contentType:'audio/mpeg' as const};
}
