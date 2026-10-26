import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync,readFileSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {P003_CONTINUOUS_SOURCE_BYTES,P003_CONTINUOUS_SOURCE_SHA256}
  from './alg-l06-p003-continuous-source-access-v2';

const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_RELATIVE='G6-G8-shared/ALG001/L6/RW/L6RW03.swf';
const SOURCE_BYTES=1220637;
const SOURCE_SHA='c3d265b61aedccc48e679cbecfe6424a2a78f2a9cb5cfa2a33791fa124933766';
const AUDIT_ROOT='/Volumes/American Dream/hudongpin/g678-p003-audit.11qugt';
const AUDIO=path.join(AUDIT_ROOT,'source-stream.mp3');
const REPORT_RELATIVE='output/alg-l06-p003-audio-alignment-20260928/continuous-v3.json';
const REPORT_BYTES=320688;
const REPORT_SHA='d3b66115dc1aa6bc61e3d375f475052d646f4f52ea50e544fa9eff4be3b273af';
const sha256=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

function exactFile(file:string,bytes:number,digest:string):Buffer{
  if(realpathSync(file)!==file)throw Error('P003_CONTINUOUS_SOURCE_PHYSICAL');
  const before=lstatSync(file,{bigint:true});
  if(!before.isFile()||before.isSymbolicLink()||before.nlink!==1n||
    before.size!==BigInt(bytes))throw Error('P003_CONTINUOUS_SOURCE_FILE');
  const content=readFileSync(file),after=lstatSync(file,{bigint:true});
  for(const key of ['dev','ino','size','mtimeNs','ctimeNs','mode','nlink'] as const)
    if(before[key]!==after[key])throw Error('P003_CONTINUOUS_SOURCE_RACE');
  if(content.length!==bytes||sha256(content)!==digest)
    throw Error('P003_CONTINUOUS_SOURCE_PIN');
  return content;
}

type V3Report={kind:string;status:string;
  inputs:{source:{path:string;bytes:number;sha256:string}};
  sourceStream:{frameDomain:string;fps:number;sampleRate:number;
    singleHead:{initialLatencySamples:number};
    fullMp3:{bytes:number;sha256:string};
    packetGroups:Array<{blockCount:number}>};
  decode:{sampleCount:number};
  capabilityBoundary:{originalRuntimeAccepted:boolean;audioAccepted:boolean;
    currentJsRegistrationChanged:boolean}};

/** Reads the complete, untrimmed source stream, with the real SWF and v3
 * source audit checked first. It does not imply source-timeline audio sync. */
export function readP003ContinuousSource():Buffer{
  if(process.env.NODE_ENV!=='development'||Boolean(process.env.VERCEL)||
    process.env.VERCEL_ENV||process.env.HELP_MATH_G678_SOURCE_ROOT!==SOURCE_ROOT||
    !['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')||
    process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND!=='127.0.0.1')
    throw Error('P003_CONTINUOUS_SOURCE_LOCAL_ONLY');
  for(const root of [SOURCE_ROOT,AUDIT_ROOT]){
    const stat=lstatSync(root);
    if(!stat.isDirectory()||stat.isSymbolicLink()||realpathSync(root)!==root)
      throw Error('P003_CONTINUOUS_SOURCE_PHYSICAL_ROOT');
  }
  const source=path.join(SOURCE_ROOT,SOURCE_RELATIVE);
  exactFile(source,SOURCE_BYTES,SOURCE_SHA);
  const cwd=process.cwd();
  const projectRoot=path.basename(cwd)==='web'&&path.basename(path.dirname(cwd))==='apps'
    ?path.resolve(cwd,'../..'):cwd;
  if(realpathSync(projectRoot)!==projectRoot)
    throw Error('P003_CONTINUOUS_SOURCE_PHYSICAL_ROOT');
  const report=JSON.parse(exactFile(path.join(projectRoot,REPORT_RELATIVE),
    REPORT_BYTES,REPORT_SHA).toString('utf8')) as V3Report;
  if(report.kind!=='alg-l06-p003-continuous-stream-source-audit-v3'||
    report.status!=='source-and-spec-informed-modern-candidate-not-original-runtime-or-audio-acceptance'||
    report.inputs.source.path!==source||report.inputs.source.bytes!==SOURCE_BYTES||
    report.inputs.source.sha256!==SOURCE_SHA||
    report.sourceStream.frameDomain!=='sprite-154'||
    report.sourceStream.fps!==12||report.sourceStream.sampleRate!==22050||
    report.sourceStream.singleHead.initialLatencySamples!==1673||
    report.sourceStream.fullMp3.bytes!==P003_CONTINUOUS_SOURCE_BYTES||
    report.sourceStream.fullMp3.sha256!==P003_CONTINUOUS_SOURCE_SHA256||
    report.sourceStream.packetGroups.reduce((sum,item)=>sum+item.blockCount,0)!==637||
    report.decode.sampleCount!==1168128||
    report.capabilityBoundary.originalRuntimeAccepted!==false||
    report.capabilityBoundary.audioAccepted!==false||
    report.capabilityBoundary.currentJsRegistrationChanged!==false)
    throw Error('P003_CONTINUOUS_SOURCE_REPORT');
  return exactFile(AUDIO,P003_CONTINUOUS_SOURCE_BYTES,P003_CONTINUOUS_SOURCE_SHA256);
}
