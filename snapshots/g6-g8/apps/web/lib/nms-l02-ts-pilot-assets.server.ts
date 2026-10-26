import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync,readFileSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';
import type {P055TextIr} from '../../../packages/demos/src/nms-l02-ts-pilot-text';

const SOURCE_ROOTS=new Set([
 '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware',
 '/Volumes/Life /HELP MATH Related Files/AWS Grade-Classified Courseware',
]);
const ID='shared-nms002-l02-p055';
const SOURCE={path:'G6-G8-shared/NMS002/L2/TS/L2TS02.swf',bytes:149059,
 sha256:'8581db0c66f2b9640eb8ea244e22ec6831d0cb98d1fd9b3fb60b15bcc745758e'} as const;
const PINS={
 'typography.js':{path:'output/nms-l02-ts-family-20260927/visual/canvas-renderer.js',
  bytes:930320,sha256:'47e796237e5520140a760175865f09c3f218ac942cf3cadc8fb9f56c38bd358d',
  contentType:'text/javascript; charset=utf-8'},
 'main.mp3':{path:'output/nms-l02-ts-family-20260927/audio/p055-main-sprite-26.mp3',
  bytes:143780,sha256:'ca2a80e75f1fc25d4ff0696af4cc1ccfcec87a1518bbc88eda998b855865a20b',
  contentType:'audio/mpeg'},
} as const;
const TEXT={path:'output/nms-l02-ts-family-20260927/visual/source-text-ir.json',
 bytes:106339,sha256:'72f14b7e998611357389f40cc1e6083ec7ea60c55d00067b3709afed6844a49a'} as const;
type Pin={path:string;bytes:number;sha256:string};
export type P055PilotAssetName=keyof typeof PINS;
export type P055PilotTextIr=P055TextIr & {
 schemaVersion:1;kind:'nms-l02-ts-p055-source-static-text-v1';
 animationId:typeof ID;sourceSwfSha256:typeof SOURCE.sha256;
 frameDomain:'sprite-26';frameCount:351;
};
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
function sourceRoot():string {
 const root=process.env.HELP_MATH_G678_SOURCE_ROOT??'';
 if(!isG678LocalPreviewEnabled()||!SOURCE_ROOTS.has(root)||
    realpathSync(root)!==root||!lstatSync(root).isDirectory()||
    lstatSync(root).isSymbolicLink())throw Error('P055_PILOT_SCOPE');
 return root;
}
function physicalRoot():string {
 sourceRoot();
 const root=getWorkspaceRoot();
 if(realpathSync(root)!==root||!lstatSync(root).isDirectory())throw Error('P055_PILOT_WORKTREE');
 return root;
}
function read(pin:Pin,root:string):Buffer {
 if(!Number.isSafeInteger(pin.bytes)||pin.bytes<1||pin.bytes>12_000_000||
    !/^[a-f0-9]{64}$/u.test(pin.sha256))throw Error('P055_PILOT_PIN');
 const file=path.isAbsolute(pin.path)?pin.path:path.join(root,pin.path);
 if(realpathSync(file)!==file)throw Error('P055_PILOT_PHYSICAL');
 const before=lstatSync(file,{bigint:true});
 if(!before.isFile()||before.isSymbolicLink()||before.nlink!==1n)throw Error('P055_PILOT_ORDINARY');
 const bytes=readFileSync(file),after=lstatSync(file,{bigint:true});
 for(const key of ['dev','ino','mode','size','mtimeNs','ctimeNs','nlink'] as const)
  if(before[key]!==after[key])throw Error('P055_PILOT_CHANGED');
 if(bytes.length!==pin.bytes||sha(bytes)!==pin.sha256)throw Error('P055_PILOT_HASH');
 return bytes;
}
export function verifyP055PilotSource():{path:string;bytes:number;sha256:string} {
 const root=physicalRoot();
 const source={...SOURCE,path:`${sourceRoot()}/${SOURCE.path}`};
 read(source,root);
 return source;
}
export function p055PilotResources(){
 const root=physicalRoot();verifyP055PilotSource();
 return (Object.keys(PINS) as P055PilotAssetName[]).map(name=>{
  const pin=PINS[name],bytes=read(pin,root);
  return {name,...pin,bytes};
 });
}
export function p055PilotAssetManifest(){
 return p055PilotResources().map(({name,path,sha256,bytes,contentType})=>({
  name,path,sha256,bytes:bytes.length,contentType,
  url:`/migration-assets/nms-l02-ts-pilot/${name}?sha256=${sha256}`,
 }));
}
const record=(value:unknown):value is Record<string,unknown>=>
 typeof value==='object'&&value!==null&&!Array.isArray(value);
const finite=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value);
function textShape(value:unknown):value is P055PilotTextIr {
 if(!record(value)||value.schemaVersion!==1||value.kind!=='nms-l02-ts-p055-source-static-text-v1'||
    value.animationId!==ID||value.sourceSwfSha256!==SOURCE.sha256||
    value.frameDomain!=='sprite-26'||value.frameCount!==351||
    !Array.isArray(value.definitions)||value.definitions.length!==12||
    !Array.isArray(value.instances)||value.instances.length!==18)return false;
 const definitions=value.definitions,instances=value.instances;
 if(!definitions.every(item=>record(item)&&Number.isSafeInteger(item.characterId)&&
    typeof item.role==='string'&&Array.isArray(item.runs)&&item.runs.length>0&&
    item.runs.every((run:unknown)=>record(run)&&typeof run.text==='string'&&
      finite(run.yOffsetTwips))))return false;
 return instances.every(item=>record(item)&&typeof item.instanceId==='string'&&
  Number.isSafeInteger(item.characterId)&&Number.isSafeInteger(item.firstFrame)&&
  Number.isSafeInteger(item.lastFrameExclusive)&&Array.isArray(item.poseSegments)&&
  item.poseSegments.length>0&&item.poseSegments.every((segment:unknown)=>{
   if(!record(segment)||!Number.isSafeInteger(segment.firstFrame)||
      !Number.isSafeInteger(segment.lastFrameExclusive)||!record(segment.pose)||
      typeof segment.pose.visible!=='boolean'||!record(segment.pose.colorTransform))return false;
   const color=segment.pose.colorTransform;
   return Array.isArray(color.multiply)&&color.multiply.length===4&&
     color.multiply.every(finite)&&Array.isArray(color.add)&&color.add.length===4&&
     color.add.every(finite)&&finite(color.divisor)&&color.divisor>0;
  }));
}
export function p055PilotText():P055PilotTextIr {
 const root=physicalRoot();verifyP055PilotSource();
 const value:unknown=JSON.parse(read(TEXT,root).toString('utf8'));
 if(!textShape(value))throw Error('P055_PILOT_TEXT_SHAPE');
 return value;
}
