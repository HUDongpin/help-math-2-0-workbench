import 'server-only';
import {readFileSync,realpathSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {G678_LIFE_SOURCE_ROOT,resolveG678PhysicalPath} from '../../../lib/g678-life-root-binding-v1.mjs';
import {getWorkspaceRoot} from './catalog';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';

const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const OUTPUT='output/alg-l12-next-glossary-20260927';
const SOURCES={
 'shared-alg001-l12-p013':{stem:'L12VB08',sha256:'056fb04850a10cd8888112e4c4fe5730bf475e559f0904b7841545c099536424',bytes:145346},
 'shared-alg001-l12-p015':{stem:'L12VB10',sha256:'b14f5cec27090f38053e46ea7ef90beaeabab75a6aabe278955477e34bcc68c4',bytes:187238},
} as const;
const RESOURCE_PINS={
 'shared-alg001-l12-p013':{
  'typography.js':{bytes:2463783,sha256:'ba2d1cd3b9913bb15e0be97a7ee69f1e79fb0258d9fcac105f45c605fcf3f441'},
  'main.mp3':{bytes:150410,sha256:'de89db3cb7d52ffad3ee3284746e923aa2a86e0f58178f7822105d02a77fe525'},
  'spanish-audio.mp3':{bytes:248640,sha256:'6a9c37d04b72b96753afba7e1f4f2583dafe9a35727faf9f350f034e1e093f76'},
 },
 'shared-alg001-l12-p015':{
  'typography.js':{bytes:5955891,sha256:'53256a9b116823b1113e50972a3aa1ecee86891b9d2b4f87bbf2902ebb37b917'},
  'main.mp3':{bytes:195650,sha256:'a9732002266a2c0b97656775787bf83b6dddf9449a0f465889e05ee44a449b9c'},
  'spanish-audio.mp3':{bytes:109200,sha256:'38d5bc99348053895392ab922dfa10517e993c68479f964c9a938244245e9a30'},
 },
} as const;
export type GlossaryPairId=keyof typeof SOURCES;
type Pin={path:string;sha256:string;bytes:number};
export type PairResourceName='typography.js'|'main.mp3'|'spanish-audio.mp3';
function read(pin:Pin,root:string){
 const file=path.isAbsolute(pin.path)?pin.path:path.join(root,pin.path);
 if(realpathSync(file)!==file||!Number.isSafeInteger(pin.bytes)||pin.bytes<1||pin.bytes>12_000_000||!/^[a-f0-9]{64}$/.test(pin.sha256))throw Error('Pair resource bounds');
 const before=lstatSync(file,{bigint:true});if(!before.isFile()||before.nlink!==1n)throw Error('Pair ordinary file');
 const bytes=readFileSync(file),after=lstatSync(file,{bigint:true});
 for(const key of ['dev','ino','size','mtimeNs','ctimeNs','mode','nlink']as const)if(before[key]!==after[key])throw Error('Pair file changed');
 if(bytes.length!==pin.bytes||createHash('sha256').update(bytes).digest('hex')!==pin.sha256)throw Error('Pair hash drift');
 return bytes;
}
function boundSourceRoot(){
 const envRoot=process.env.HELP_MATH_G678_SOURCE_ROOT;
 if(envRoot===SOURCE_ROOT)return SOURCE_ROOT;
 if(envRoot!==G678_LIFE_SOURCE_ROOT)throw Error('Pair local source scope');
 return resolveG678PhysicalPath(SOURCE_ROOT);
}
function physicalRecorded(recorded:string){
 if(process.env.HELP_MATH_G678_SOURCE_ROOT===SOURCE_ROOT||!recorded.startsWith(`${SOURCE_ROOT}/`))return recorded;
 return resolveG678PhysicalPath(recorded);
}
export function pairHostResources(id:GlossaryPairId){
 const sourceRoot=boundSourceRoot();
 if(!Object.hasOwn(SOURCES,id)||!isG678LocalPreviewEnabled()||process.env.HELP_MATH_G678_SOURCE_ROOT!==sourceRoot||realpathSync(sourceRoot)!==sourceRoot)throw Error('Pair local source scope');
 const root=getWorkspaceRoot();if(realpathSync(root)!==root)throw Error('Pair physical worktree');
 const expected=SOURCES[id],sourcePath=`${SOURCE_ROOT}/G6-G8-shared/ALG001/L12/VB/${expected.stem}.swf`;
 read({path:physicalRecorded(sourcePath),...expected},root);
 const index=JSON.parse(readFileSync(path.join(root,OUTPUT,'host-resources-v1.json'),'utf8'));
 if(index.schemaVersion!==1||index.kind!=='alg-l12-glossary-pair-host-resources-v1'||index.registered!==false||index.pages.length!==2)throw Error('Pair manifest shape');
 const matches=index.pages.filter((p:{animationId:string})=>p.animationId===id);if(matches.length!==1)throw Error('Pair membership');
 const page=matches[0];if(page.source.path!==sourcePath||page.source.sha256!==expected.sha256||page.source.bytes!==expected.bytes)throw Error('Pair source mismatch');
 const short=id.split('-').at(-1),sprite=short==='p013'?63:76;
 if(page.frameDomain!==`sprite-${sprite}`||page.frameCount!==(sprite===63?372:474))throw Error('Pair frame identity');
 const paths={'typography.js':`${OUTPUT}/native-candidates/${short}/canvas-renderer.js`,
  'main.mp3':`${OUTPUT}/audio/${short}-main-sprite-${sprite}.mp3`,
  'spanish-audio.mp3':`${SOURCE_ROOT}/G6-G8-shared/ALG001/L12/SA/${expected.stem}.mp3`};
 return (Object.keys(paths)as PairResourceName[]).map(name=>{
  const pin=page.resources[name]as Pin&{contentType:string};
  const reviewed=RESOURCE_PINS[id][name];
  if(pin.sha256!==reviewed.sha256||pin.bytes!==reviewed.bytes)throw Error('Pair reviewed resource identity');
  if(pin.path!==paths[name]||pin.contentType!==(name==='typography.js'?'text/javascript; charset=utf-8':'audio/mpeg'))throw Error('Pair resource binding');
  const bytes=read({...pin,path:physicalRecorded(pin.path)},root);return {name,sha256:pin.sha256,bytes,contentType:pin.contentType};
 });
}
export function pairHostAssetManifest(id:GlossaryPairId){return pairHostResources(id).map(p=>({...p,bytes:p.bytes.length}));}
