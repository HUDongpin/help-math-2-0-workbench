import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {P053_SOURCE_AUDIO_BYTES,P053_SOURCE_AUDIO_SHA256}
  from './nms-l02-p053-source-audio-access';

const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_RELATIVE='G6-G8-shared/NMS002/L2/GS/L2GS02.swf';
const SOURCE_SHA='f42f6a4759759561035a7c97e7392241513d0410d69214af422425ef37523fdf';
const SOURCE_BYTES=236774;
const AUDIT_RELATIVE='migrations/shared-nms002-l02-p053/audit/source-stream-product-v1.json';
const AUDIT_SHA='5106b1751eb3e40575cb0daad40e4e40563e087fe6da536f283de799d50cc3da';
const AUDIT_BYTES=2385;
const EXTERNAL_ROOT='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/p053-source-stream-product-v1';
const MP3_PATH=path.join(EXTERNAL_ROOT,'sprite-187-source-stream-v1.mp3');
const INDEX_PATH=path.join(EXTERNAL_ROOT,'raw-block-index-v1.json');
const INDEX_SHA='71b102949ed66206315863a290691f1f4db1b2331ce3d0283ea90684b0ff8fa8';
const INDEX_BYTES=447231;
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

function readExact(file:string,bytes:number,sha256:string):Buffer{
  const before=lstatSync(file,{bigint:true});
  if(!before.isFile()||before.isSymbolicLink()||before.nlink!==1n||before.size!==BigInt(bytes))
    throw Error('P053_SOURCE_AUDIO_FILE');
  const body=readFileSync(file);
  const after=lstatSync(file,{bigint:true});
  for(const key of ['dev','ino','size','mtimeNs','ctimeNs','mode','nlink'] as const){
    if(before[key]!==after[key])throw Error('P053_SOURCE_AUDIO_RACE');
  }
  if(body.length!==bytes||hash(body)!==sha256)throw Error('P053_SOURCE_AUDIO_PIN');
  return body;
}

type StreamAudit={schema:string;animationId:string;disposition:string;
  source:{root:string;relativePath:string;bytes:number;sha256:string};
  stream:{frameDomain:string;blockCount:number;firstBlockFrame:number;lastBlockFrame:number};
  externalFiles:{mp3:{path:string;bytes:number;sha256:string};
    rawIndex:{path:string;bytes:number;sha256:string}};
  limits:{audioListeningAccepted:boolean;originalRuntimeAccepted:boolean;
    headAndBlockSeekRetainedNotApplied:boolean;spanishAudioSpliced:boolean}};
type RawIndex={schema:string;animationId:string;source:{sha256:string};
  tagCounts:{SoundStreamBlock:number};stream:{ownerDomainId:string;blockCount:number}};

/** Full source-order MP3 only; no trim, gap fill, seek correction or timeline mapping. */
export function readP053SourceAudio():Buffer{
  if(process.env.NODE_ENV==='production'||Boolean(process.env.VERCEL)||process.env.VERCEL_ENV||
    process.env.HELP_MATH_G678_SOURCE_ROOT!==SOURCE_ROOT)
    throw Error('P053_SOURCE_AUDIO_LOCAL_ONLY');
  const sourceStat=lstatSync(SOURCE_ROOT),externalStat=lstatSync(EXTERNAL_ROOT);
  if(
    !sourceStat.isDirectory()||sourceStat.isSymbolicLink()||
    !externalStat.isDirectory()||externalStat.isSymbolicLink())
    throw Error('P053_SOURCE_AUDIO_LOCAL_ONLY');
  readExact(path.join(SOURCE_ROOT,SOURCE_RELATIVE),SOURCE_BYTES,SOURCE_SHA);
  const cwd=process.cwd();
  const projectRoot=path.basename(cwd)==='web'&&path.basename(path.dirname(cwd))==='apps'
    ?path.resolve(cwd,'../..'):cwd;
  const audit=JSON.parse(readExact(path.join(projectRoot,AUDIT_RELATIVE),AUDIT_BYTES,AUDIT_SHA).toString('utf8')) as StreamAudit;
  if(audit.schema!=='nms-l02-p053-source-stream-product-v1'||
    audit.animationId!=='shared-nms002-l02-p053'||
    audit.disposition!=='reusable-source-stream-candidate'||
    audit.source.root!==SOURCE_ROOT||audit.source.relativePath!==SOURCE_RELATIVE||
    audit.source.bytes!==SOURCE_BYTES||audit.source.sha256!==SOURCE_SHA||
    audit.stream.frameDomain!=='sprite-187'||audit.stream.blockCount!==619||
    audit.stream.firstBlockFrame!==4||audit.stream.lastBlockFrame!==694||
    audit.externalFiles.mp3.path!==MP3_PATH||
    audit.externalFiles.mp3.bytes!==P053_SOURCE_AUDIO_BYTES||
    audit.externalFiles.mp3.sha256!==P053_SOURCE_AUDIO_SHA256||
    audit.externalFiles.rawIndex.path!==INDEX_PATH||
    audit.externalFiles.rawIndex.bytes!==INDEX_BYTES||
    audit.externalFiles.rawIndex.sha256!==INDEX_SHA||
    audit.limits.audioListeningAccepted!==false||
    audit.limits.originalRuntimeAccepted!==false||
    audit.limits.headAndBlockSeekRetainedNotApplied!==true||
    audit.limits.spanishAudioSpliced!==false)throw Error('P053_SOURCE_AUDIO_AUDIT');
  const index=JSON.parse(readExact(INDEX_PATH,INDEX_BYTES,INDEX_SHA).toString('utf8')) as RawIndex;
  if(index.schema!=='nms-l02-p053-source-stream-raw-index-v1'||
    index.animationId!==audit.animationId||index.source.sha256!==SOURCE_SHA||
    index.tagCounts.SoundStreamBlock!==619||
    index.stream.ownerDomainId!=='sprite-187'||index.stream.blockCount!==619)
    throw Error('P053_SOURCE_AUDIO_INDEX');
  return readExact(MP3_PATH,P053_SOURCE_AUDIO_BYTES,P053_SOURCE_AUDIO_SHA256);
}
