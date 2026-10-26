import 'server-only';
import {getWorkspaceRoot} from './catalog';
import {readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {nmsL02P054AdmissionDescriptor} from './nms-l02-p054-admission.server';
import {nmsL02P053ProductDescriptorV1} from './nms-l02-p053-product-descriptor-v1';
import {readP053SourceAudio} from './nms-l02-p053-source-audio.server';

const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE={path:'G6-G8-shared/NMS002/L2/GS/L2GS02.swf',bytes:236774,
 sha256:'f42f6a4759759561035a7c97e7392241513d0410d69214af422425ef37523fdf'};
const XML={path:'G6-G8-shared/NMS002/L2/index.xml',bytes:12845,
 sha256:'550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'};
const MOVIE_ROOT='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/p053-source-audit-rjgSPq';
const MOVIE={path:'movie.xml',bytes:1262572,
 sha256:'058b9759e535ea6a861dd5d260a4648af146bfe1f0bcd45f9baee324be0635e1'};
const AUDITS={
 display:{path:'migrations/shared-nms002-l02-p053/audit/native-display-product-v1.json',bytes:358217,
  sha256:'2c00b045bf3153ac5f6aadcc197674aca9f368354d85ffbe6bb620854c039151'},
 visual:{path:'migrations/shared-nms002-l02-p053/audit/visual-scene-v1.json',bytes:1565440,
  sha256:'b22a2e71c920e425d397a0070338ef9d66e714fff31df8959d9115878fbe8ea7'},
 host:{path:'migrations/shared-nms002-l02-p053/audit/host-navigation-resolution-v1.json',bytes:5555,
  sha256:'4082197b15ee072fcbbbff594c5a92ceaf19c039964fa3d8cd58cb83a3536332'},
 audio:{path:'migrations/shared-nms002-l02-p053/audit/source-stream-product-v1.json',bytes:2385,
  sha256:'5106b1751eb3e40575cb0daad40e4e40563e087fe6da536f283de799d50cc3da'},
 graph:{path:'migrations/shared-nms002-l02-p053/audit/frame-domain-static-graph-v1.json',bytes:4685,
  sha256:'8ad79c29aedcb0553b571ed8f20f8f826b7a5feba15c770d2a433f27a40ff3aa'},
} as const;

function demand(ok:unknown,reason:string):asserts ok{
 if(!ok)throw Error(`P053_PRODUCT_CANDIDATE: ${reason}`);
}

/** Source-locked local projection. Registration and original-runtime claims remain unchanged. */
export function nmsL02P053ProductCandidateDescriptor(){
 demand(process.env.NODE_ENV!=='production'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
  process.env.HELP_MATH_G678_SOURCE_ROOT===SOURCE_ROOT,'local source environment');
 const root=getWorkspaceRoot();
 readPin(SOURCE_ROOT,SOURCE);readPin(SOURCE_ROOT,XML);readPin(MOVIE_ROOT,MOVIE);
 const display=readJsonPin(root,AUDITS.display);
 const visual=readJsonPin(root,AUDITS.visual);
 const host=readJsonPin(root,AUDITS.host);
 const audio=readJsonPin(root,AUDITS.audio);
 const graph=readJsonPin(root,AUDITS.graph);
 demand(display.kind==='nms-l02-p053-native-display-source-ir-v1'&&
  display.animationId==='shared-nms002-l02-p053'&&
  display.source.physicalRoot===SOURCE_ROOT&&display.source.sha256===SOURCE.sha256&&
  display.source.rootMainPlacement.spriteId===187&&display.source.rootMainPlacement.rootFrame===6&&
  display.source.mainFrames===694&&display.source.fps===12&&
  display.boundary.originalRuntimeParity===false,'native display identity and boundary');
 demand(visual.kind==='nms-l02-p053-visual-scene-source-v1'&&
  visual.animationId===display.animationId&&visual.source.sha256===SOURCE.sha256&&
  visual.rootPlacement.characterId===187&&visual.rootPlacement.rootFrame===6&&
  visual.mainFrameDomain.declaredFrames===694&&visual.mainFrameDomain.heldFrame===693&&
  visual.mainFrameDomain.nextFrameAutoReachedEstablished===false&&
  visual.boundary.originalRuntimeAccepted===false,'visual scene identity and held stop');
 demand(host.lessonXml.sha256===XML.sha256&&
  host.lessonXml.path===`${SOURCE_ROOT}/${XML.path}`&&
  JSON.stringify(host.lessonXml.gsPagesInOrder)===
   JSON.stringify(['GS/L2GS02.swf','GS/L2GS03.swf'])&&
  host.staticInterpretation.some((text:string)=>text.includes('early L7GS03 request')),
  'source navigation disposition');
 demand(audio.animationId===display.animationId&&audio.source.sha256===SOURCE.sha256&&
  audio.stream.frameDomain==='sprite-187'&&audio.stream.blockCount===619&&
  audio.limits.originalRuntimeAccepted===false&&audio.limits.audioListeningAccepted===false,
  'audio source boundary');
 demand(graph.animationId===display.animationId&&graph.source.sha256===SOURCE.sha256,
  'frame graph source identity');
 readP053SourceAudio();
 const predecessor=nmsL02P054AdmissionDescriptor();
 demand(predecessor.registered===true&&
  predecessor.descriptor.productBridge.registeredAnimationCount===63,
  'registered P054 predecessor');
 return nmsL02P053ProductDescriptorV1(predecessor.descriptor);
}
